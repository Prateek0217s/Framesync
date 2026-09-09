import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { COMPRESSION_THRESHOLD_BYTES } from './constants';

// Single-thread core, loaded from the locally-installed @ffmpeg/core (PDD §4,
// §11). Using ?url + toBlobURL keeps the worker same-origin, so we need no
// SharedArrayBuffer and no COOP/COEP headers.
//
// NOTE: referenced by relative path, not package specifier — @ffmpeg/core's
// `exports` map only exposes "." (the ESM build) and "./wasm", while the
// ffmpeg.wasm worker requires the UMD build via importScripts(). A filesystem
// path sidesteps the exports map entirely.
import coreURL from '../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js?url';
import wasmURL from '../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm?url';

let ffmpeg = null;
let loadPromise = null;

export function isFFmpegLoaded() {
  return !!ffmpeg?.loaded;
}

// Lazy singleton — the ~30 MB wasm only loads the first time compression is
// actually needed.
export async function loadFFmpeg(onLog) {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();
    if (onLog) instance.on('log', ({ message }) => onLog(message));
    await instance.load({
      coreURL: await toBlobURL(coreURL, 'text/javascript'),
      wasmURL: await toBlobURL(wasmURL, 'application/wasm'),
    });
    ffmpeg = instance;
    return instance;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

// Read a video file's duration (seconds) via a throwaway <video> element.
export function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read video metadata'));
    };
    video.src = url;
  });
}

// Dynamic bitrate budget (PDD §5.2.2):
//   Target kbps = (100 MB × 8192 kbit / duration_seconds) × 0.90
// 1 MB == 8192 kbit, so 100 MB == 819200 kbit of total budget.
export function computeTargetBitrateKbps(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 2000; // safe fallback
  const budgetKbit = 100 * 8192; // 819200
  const kbps = (budgetKbit / durationSeconds) * 0.9;
  return Math.max(300, Math.round(kbps)); // floor to keep video watchable
}

function extensionOf(name = '') {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : 'mp4';
}

/**
 * Compress a video entirely in-browser when it exceeds the 100 MB threshold.
 * Returns { blob, didCompress, targetBitrateKbps, durationSeconds }.
 * Files under the threshold are returned untouched (PDD §5.2.1).
 */
export async function compressVideo(file, { onProgress, onLog, onPhase } = {}) {
  if (file.size < COMPRESSION_THRESHOLD_BYTES) {
    return { blob: file, didCompress: false, targetBitrateKbps: null, durationSeconds: null };
  }

  onPhase?.('probing');
  const durationSeconds = await getVideoDuration(file).catch(() => 0);
  const targetBitrateKbps = computeTargetBitrateKbps(durationSeconds);

  onPhase?.('loading-core');
  const ff = await loadFFmpeg(onLog);

  const inName = `input.${extensionOf(file.name)}`;
  const outName = 'output.mp4';

  // Monotonic progress: the 0.12 `progress` event stays silent on some inputs,
  // so also parse ffmpeg's stderr "time=HH:MM:SS" stamps. The duration used
  // for the ratio comes from the browser probe — EXCEPT when that failed
  // (browser-undecodable codecs like ProRes make getVideoDuration return 0),
  // in which case we take ffmpeg's own "Duration: HH:MM:SS" header line
  // instead. A frozen 0% bar is indistinguishable from a hang.
  let duration = durationSeconds;
  let lastPct = 0;
  const report = (pct) => {
    lastPct = Math.max(lastPct, Math.min(99, Math.max(0, Math.round(pct))));
    onProgress?.(lastPct);
  };
  const progressHandler = ({ progress }) => report(progress * 100);
  const logHandler = ({ message }) => {
    onLog?.(message);
    if (!duration) {
      const d = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message || '');
      if (d) duration = +d[1] * 3600 + +d[2] * 60 + +d[3];
    }
    const m = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message || '');
    if (m && duration > 0) {
      const secs = +m[1] * 3600 + +m[2] * 60 + +m[3];
      report((secs / duration) * 100);
    }
  };
  ff.on('progress', progressHandler);
  ff.on('log', logHandler);

  try {
    onPhase?.('writing');
    await ff.writeFile(inName, await fetchFile(file));

    onPhase?.('transcoding');

    // Exact pipeline from PDD §5.2.3.
    await ff.exec([
      '-i', inName,
      '-c:v', 'libx264',
      '-b:v', `${targetBitrateKbps}k`,
      '-preset', 'ultrafast',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      outName,
    ]);

    const out = await ff.readFile(outName);
    const blob = new Blob([out.buffer], { type: 'video/mp4' });

    // FR-5.2.4 — reclaim MEMFS to avoid leaking across repeated transcodes.
    await ff.deleteFile(inName).catch(() => {});
    await ff.deleteFile(outName).catch(() => {});

    onProgress?.(100);
    return { blob, didCompress: true, targetBitrateKbps, durationSeconds };
  } finally {
    ff.off('progress', progressHandler);
    ff.off('log', logHandler);
  }
}
