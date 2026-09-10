import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, Lock, Film } from 'lucide-react';
import TerminalLoader from './TerminalLoader';
import toast from 'react-hot-toast';
import { uploadsApi, projectsApi, putToS3 } from '../services/api';
import { compressVideo } from '../lib/ffmpeg';
import { humanFileSize } from '../lib/time';
import { COMPRESSION_THRESHOLD_BYTES } from '../lib/constants';

const PHASE_LABEL = {
  probing: 'Probing video metadata…',
  'loading-core': 'Loading WASM core… (~30 MB, first time only)',
  writing: 'Loading video into memory…',
  transcoding: 'Transcoding in browser…',
};

/**
 * Media ingestion control (PDD §5.2). `variant`:
 *  - 'proxy'  → client-side WASM compression for files ≥100 MB, then S3 PUT.
 *  - 'master' → raw high-res upload, only enabled once the project is Approved
 *               (Level Lock, §5.5). Backend still enforces the 403.
 */
export default function MediaUpload({ project, variant, disabled, onDone }) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | compressing | uploading | done
  const [ffPhase, setFfPhase] = useState(null);
  const [compressPct, setCompressPct] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [info, setInfo] = useState(null);
  const [logTail, setLogTail] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const busy = phase === 'compressing' || phase === 'uploading';
  const isMaster = variant === 'master';

  // Elapsed-seconds counter — proof the process is alive even when the
  // percentage can't be determined yet (e.g. before duration is known).
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [busy, phase]);

  const reset = () => {
    setPhase('idle');
    setFfPhase(null);
    setCompressPct(0);
    setUploadPct(0);
    setLogTail(null);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file.');
      return;
    }

    try {
      let blob = file;
      let contentType = file.type || 'video/mp4';
      let filename = file.name;

      // Proxy: compress client-side when over threshold (§5.2.1/§5.2.2).
      if (!isMaster) {
        setPhase('compressing');
        const willCompress = file.size >= COMPRESSION_THRESHOLD_BYTES;
        setInfo(
          willCompress
            ? `Compressing ${humanFileSize(file.size)} proxy in your browser…`
            : `${humanFileSize(file.size)} — under 100 MB, uploading directly.`
        );
        const result = await compressVideo(file, {
          onPhase: setFfPhase,
          onProgress: setCompressPct,
          onLog: (msg) => {
            // Keep only ffmpeg's frame/time status lines — the definitive
            // "it's alive" signal, shown under the progress bar.
            if (msg.includes('frame=')) setLogTail(msg);
          },
        });
        blob = result.blob;
        if (result.didCompress) {
          contentType = 'video/mp4';
          filename = `${file.name.replace(/\.[^.]+$/, '')}-proxy.mp4`;
          setInfo(
            `Compressed ${humanFileSize(file.size)} → ${humanFileSize(
              blob.size
            )} @ ${result.targetBitrateKbps} kbps`
          );
        }
      }

      // Presigned PUT (§10.1).
      setPhase('uploading');
      const { url, key } = isMaster
        ? await uploadsApi.presignMasterUpload(project._id, filename, contentType)
        : await uploadsApi.presignProxyUpload(project._id, filename, contentType);

      await putToS3(url, blob, contentType, setUploadPct);

      // Persist the key.
      if (isMaster) {
        await uploadsApi.confirmMaster(project._id, key);
      } else {
        await projectsApi.update(project._id, { proxyMediaKey: key });
      }

      setPhase('done');
      toast.success(isMaster ? 'Master delivered' : 'Proxy uploaded');
      onDone?.({ variant, key });
      setTimeout(reset, 1500);
    } catch (err) {
      const msg =
        err?.response?.status === 403
          ? 'Locked — the project must be Approved before uploading the master.'
          : err?.response?.data?.message || err.message || 'Upload failed';
      toast.error(msg);
      reset();
    }
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-ink-900/50 px-4 py-5 text-sm text-slate-500">
        <Lock size={18} className="shrink-0" />
        <div>
          <p className="font-medium text-slate-400">Master delivery locked</p>
          <p className="text-xs">
            Unlocks automatically once the client approves this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {phase === 'idle' || phase === 'done' ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            isMaster
              ? 'border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/5'
              : 'border-line hover:border-primary hover:bg-primary/5'
          }`}
        >
          {phase === 'done' ? (
            <CheckCircle2 className="text-emerald-400" />
          ) : isMaster ? (
            <Film className="text-emerald-400" />
          ) : (
            <UploadCloud className="text-primary-soft" />
          )}
          <span className="text-sm font-semibold text-slate-200">
            {isMaster ? 'Upload final 4K master' : 'Upload proxy media'}
          </span>
          <span className="text-xs text-slate-500">
            {isMaster
              ? 'Delivered securely; downloadable by the client.'
              : 'MP4/MOV — files ≥100 MB are compressed in-browser.'}
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-200">
            {phase === 'compressing' ? (
              <TerminalLoader size={20} className="text-accent" />
            ) : (
              <Loader2 size={16} className="animate-spin text-primary-soft" />
            )}
            <span className="flex-1 truncate">
              {phase === 'compressing'
                ? PHASE_LABEL[ffPhase] || 'Preparing…'
                : 'Uploading to secure storage…'}
            </span>
            <span className="shrink-0 tabular-nums text-xs text-slate-400">
              {phase === 'compressing' ? `${compressPct}%` : `${uploadPct}%`}
              <span className="ml-2 text-slate-500">{elapsed}s</span>
            </span>
          </div>
          {info && <p className="mb-2 text-xs text-slate-500">{info}</p>}
          {phase === 'compressing' && logTail && (
            <p
              className="mb-2 truncate font-mono text-[10px] text-slate-600"
              title={logTail}
            >
              {logTail}
            </p>
          )}
          <Progress
            value={phase === 'compressing' ? compressPct : uploadPct}
            tone={phase === 'compressing' ? 'accent' : 'primary'}
            indeterminate={
              phase === 'compressing' && compressPct === 0 && elapsed > 2
            }
          />
        </div>
      )}
    </div>
  );
}

function Progress({ value, tone, indeterminate }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
      {indeterminate ? (
        // Percentage unknown yet — a moving bar proves work is happening.
        <div
          className={`h-full w-full animate-pulse rounded-full ${
            tone === 'accent' ? 'bg-accent' : 'bg-primary'
          }`}
        />
      ) : (
        <div
          className={`h-full rounded-full transition-all ${
            tone === 'accent' ? 'bg-accent' : 'bg-primary'
          }`}
          style={{ width: `${value}%` }}
        />
      )}
    </div>
  );
}
