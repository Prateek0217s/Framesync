import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Film,
  PlusCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import VectorCanvas from './VectorCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import CommentList from './CommentList';
import PresenceBar from './PresenceBar';
import { STROKE_COLORS, STROKE_WIDTHS } from '../lib/constants';
import { formatTimecode } from '../lib/time';

/**
 * The shared review surface used by the agency ProjectDetail and the client
 * portal. Composes the aspect-locked player (PDD §9.1), the vector overlay
 * (§5.3), presence (§5.6), and the timestamped comment workflow.
 */
export default function VideoReviewer({
  project,
  proxyUrl,
  role,
  currentUser,
  comments,
  presence = [],
  onCreateComment,
  onResolve,
  onDelete,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const [color, setColor] = useState(STROKE_COLORS[0]);
  const [width, setWidth] = useState(STROKE_WIDTHS[1]);
  const [strokeCount, setStrokeCount] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selected = comments.find((c) => c._id === selectedId) || null;
  const reviewStrokes = selected?.scribbleData?.strokes || null;
  const drawingEnabled = isPaused && !selectedId;

  // ---- Player event wiring ----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const onPlay = () => {
      setIsPaused(false);
      setSelectedId(null); // leave review mode when playback resumes
    };
    const onPause = () => setIsPaused(true);
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
    };
  }, [proxyUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const seekTo = useCallback((t, { pause = false } = {}) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    if (pause) v.pause();
  }, []);

  // Seek-and-redraw: jump to a comment's frame and paint its strokes (§5.3.5).
  const selectComment = (c) => {
    setSelectedId(c._id);
    canvasRef.current?.clear();
    seekTo(c.timestamp || 0, { pause: true });
  };

  const startNewAnnotation = () => {
    setSelectedId(null);
    canvasRef.current?.clear();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const submit = async () => {
    if (!text.trim()) {
      toast.error('Add a note to describe your feedback.');
      return;
    }
    const strokes = canvasRef.current?.getStrokes() || [];
    setSubmitting(true);
    try {
      await onCreateComment({
        projectId: project._id,
        text: text.trim(),
        timestamp: Number(currentTime.toFixed(2)),
        scribbleData: strokes.length ? { strokes } : undefined,
      });
      setText('');
      canvasRef.current?.clear();
      setStrokeCount(0);
      toast.success('Feedback posted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      {/* ---- Player + overlay ---- */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl aspect-video">
          {proxyUrl ? (
            <video
              ref={videoRef}
              src={proxyUrl}
              className="h-full w-full object-contain"
              playsInline
              onClick={togglePlay}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <Film className="opacity-40" size={40} />
                <p className="text-sm">No proxy media uploaded yet.</p>
              </div>
            </div>
          )}

          {/* Vector overlay (pointer-events toggle per §5.3.2). */}
          {proxyUrl && (
            <VectorCanvas
              ref={canvasRef}
              enabled={drawingEnabled}
              color={color}
              width={width}
              reviewStrokes={reviewStrokes}
              onChangeCount={setStrokeCount}
            />
          )}

          {/* Mode hint */}
          {proxyUrl && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {selectedId
                ? 'Reviewing annotation'
                : isPaused
                ? 'Paused · sketch on the frame'
                : 'Playing · pause to annotate'}
            </div>
          )}

          {/* Center play affordance when paused with no drawing yet */}
          {proxyUrl && isPaused && strokeCount === 0 && !selectedId && (
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto absolute inset-0 grid place-items-center"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/90 text-white shadow-glow transition hover:scale-105">
                <Play size={28} className="ml-1" />
              </span>
            </button>
          )}
        </div>

        {/* Controls */}
        {proxyUrl && (
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-ink-850/70 p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                {isPaused ? <Play size={18} className="ml-0.5" /> : <Pause size={18} />}
              </button>

              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="fs-range w-full cursor-pointer accent-primary"
                />
                {/* Comment markers on the timeline */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                  {duration > 0 &&
                    comments.map((c) => (
                      <span
                        key={c._id}
                        className="absolute h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-accent/80"
                        style={{ left: `${((c.timestamp || 0) / duration) * 100}%` }}
                        title={c.text}
                      />
                    ))}
                </div>
              </div>

              <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-400">
                {formatTimecode(currentTime)} / {formatTimecode(duration)}
              </span>

              <button
                type="button"
                onClick={toggleMute}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-800 text-slate-300 hover:bg-ink-700"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* Pen toolbar — active only while paused & drawing */}
            <div className="flex items-center justify-between gap-3">
              <AnnotationToolbar
                color={color}
                width={width}
                onColor={setColor}
                onWidth={setWidth}
                onUndo={() => canvasRef.current?.undo()}
                onClear={() => canvasRef.current?.clear()}
                canUndo={strokeCount > 0}
                disabled={!drawingEnabled}
              />
              {selectedId && (
                <button
                  type="button"
                  onClick={startNewAnnotation}
                  className="fs-btn-ghost shrink-0 px-3 py-2 text-xs"
                >
                  <PlusCircle size={14} /> New annotation
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Sidebar: presence + composer + feedback ---- */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-line bg-ink-850/70 px-3 py-2.5">
          <PresenceBar presence={presence} self={currentUser} />
        </div>

        {/* Composer */}
        <div className="fs-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Add feedback
            </span>
            <span className="rounded-md bg-ink-950 px-2 py-0.5 font-mono text-xs text-primary-soft">
              @ {formatTimecode(currentTime)}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={
              isPaused
                ? 'Describe the change — e.g. “warm up the towel color here”.'
                : 'Pause the video to pin feedback to this frame.'
            }
            className="fs-input resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles size={13} className={strokeCount ? 'text-accent' : ''} />
              {strokeCount > 0
                ? `${strokeCount} sketch stroke${strokeCount > 1 ? 's' : ''} attached`
                : 'Sketch on the frame to attach a vector markup'}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !text.trim()}
              className="fs-btn-primary px-3 py-2 text-xs"
            >
              <Send size={14} /> {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>

        {/* Feedback list */}
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Feedback ({comments.length})
            </span>
          </div>
          <CommentList
            comments={comments}
            selectedId={selectedId}
            onSelect={selectComment}
            role={role}
            onResolve={onResolve}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
