import React from 'react';
import { Undo2, Eraser } from 'lucide-react';
import { STROKE_COLORS, STROKE_WIDTHS } from '../lib/constants';

// Pen controls for the annotation overlay (PDD §5.3.4): 5 colors, 3 widths,
// undo, and clear.
export default function AnnotationToolbar({
  color,
  width,
  onColor,
  onWidth,
  onUndo,
  onClear,
  canUndo,
  disabled,
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink-850 px-3 py-2 ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        {STROKE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColor(c)}
            title={c}
            className={`h-6 w-6 rounded-full border transition ${
              color === c
                ? 'scale-110 border-white ring-2 ring-white/60'
                : 'border-black/40 hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-5 w-px bg-line" />

      <div className="flex items-center gap-1.5">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onWidth(w)}
            title={`${w}px`}
            className={`grid h-7 w-7 place-items-center rounded-lg border transition ${
              width === w
                ? 'border-primary bg-primary/20'
                : 'border-line bg-ink-800 hover:bg-ink-700'
            }`}
          >
            <span
              className="rounded-full bg-slate-200"
              style={{ width: w, height: w }}
            />
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-line" />

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="fs-btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-40"
      >
        <Undo2 size={14} /> Undo
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!canUndo}
        className="fs-btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-40"
      >
        <Eraser size={14} /> Clear
      </button>
    </div>
  );
}
