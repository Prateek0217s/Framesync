import React from 'react';
import { Check, Trash2, PenLine, MessageSquare } from 'lucide-react';
import { formatTimecodePrecise, timeAgo } from '../lib/time';

// Timestamped feedback list. Clicking a row triggers the seek-and-redraw
// engine in VideoReviewer (PDD §5.3.5).
export default function CommentList({
  comments,
  selectedId,
  onSelect,
  role,
  onResolve,
  onDelete,
}) {
  const sorted = [...comments].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  if (sorted.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-slate-500">
        <MessageSquare className="mb-2 opacity-40" />
        No feedback yet. Pause the video and sketch on a frame to leave the first note.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((c) => {
        const active = c._id === selectedId;
        const hasSketch = (c.scribbleData?.strokes?.length || 0) > 0;
        return (
          <li key={c._id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(c)}
              className={`group cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                active
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-line bg-ink-800/60 hover:border-primary/50 hover:bg-ink-800'
              } ${c.resolved ? 'opacity-60' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-ink-950 px-2 py-0.5 font-mono text-xs text-primary-soft">
                    {formatTimecodePrecise(c.timestamp || 0)}
                  </span>
                  {hasSketch && (
                    <PenLine size={13} className="text-accent" title="Has sketch" />
                  )}
                  {c.resolved && (
                    <span className="fs-badge bg-emerald-500/15 text-emerald-300">
                      <Check size={11} /> Resolved
                    </span>
                  )}
                </div>
                {role === 'admin' && (
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title={c.resolved ? 'Reopen' : 'Resolve'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(c);
                      }}
                      className="rounded-md p-1 text-slate-400 hover:bg-ink-700 hover:text-emerald-300"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c);
                      }}
                      className="rounded-md p-1 text-slate-400 hover:bg-ink-700 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p
                className={`text-sm leading-snug text-slate-200 ${
                  c.resolved ? 'line-through decoration-slate-600' : ''
                }`}
              >
                {c.text}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">
                  {c.authorName || 'Reviewer'}
                </span>
                <span>·</span>
                <span>{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
