import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function drawStroke(ctx, stroke, w, h) {
  const pts = stroke.points || [];
  if (pts.length === 0) return;
  ctx.strokeStyle = stroke.color || '#EF4444';
  ctx.fillStyle = stroke.color || '#EF4444';
  ctx.lineWidth = stroke.width || 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (pts.length === 1) {
    // A single tap renders as a filled dot.
    ctx.beginPath();
    ctx.arc(pts[0].x * w, pts[0].y * h, (stroke.width || 4) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Vector path rendered via Path2D (PDD §5.3.5).
  const path = new Path2D();
  path.moveTo(pts[0].x * w, pts[0].y * h);
  for (let i = 1; i < pts.length; i += 1) {
    path.lineTo(pts[i].x * w, pts[i].y * h);
  }
  ctx.stroke(path);
}

/**
 * Transparent annotation overlay for the video (PDD §5.3, §9.2).
 * - Normalizes pointer coordinates to [0,1] so markups are resolution-independent.
 * - Scales the backing store by devicePixelRatio for crisp lines on retina/4K.
 * - Exposes an imperative handle: { undo, clear, getStrokes, isEmpty }.
 */
const VectorCanvas = forwardRef(function VectorCanvas(
  { enabled = false, color = '#EF4444', width = 6, reviewStrokes = null, onChangeCount },
  ref
) {
  const canvasRef = useRef(null);
  const liveStrokes = useRef([]);
  const current = useRef(null);
  const reviewRef = useRef(reviewStrokes);
  const penRef = useRef({ color, width });

  penRef.current = { color, width };
  reviewRef.current = reviewStrokes;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    if (cssW === 0 || cssH === 0) return;

    // High-DPI backing store (PDD §9.2).
    const dpr = window.devicePixelRatio || 1;
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (reviewRef.current) {
      reviewRef.current.forEach((s) => drawStroke(ctx, s, cssW, cssH));
    }
    liveStrokes.current.forEach((s) => drawStroke(ctx, s, cssW, cssH));
    if (current.current) drawStroke(ctx, current.current, cssW, cssH);
  }, []);

  const notify = useCallback(() => {
    onChangeCount?.(liveStrokes.current.length);
  }, [onChangeCount]);

  useImperativeHandle(
    ref,
    () => ({
      undo() {
        liveStrokes.current.pop();
        redraw();
        notify();
      },
      clear() {
        liveStrokes.current = [];
        current.current = null;
        redraw();
        notify();
      },
      getStrokes() {
        // Deep copy so callers can't mutate our buffer.
        return liveStrokes.current.map((s) => ({
          color: s.color,
          width: s.width,
          points: s.points.map((p) => ({ x: p.x, y: p.y })),
        }));
      },
      isEmpty() {
        return liveStrokes.current.length === 0;
      },
    }),
    [redraw, notify]
  );

  // Keep the overlay sized to the video container.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(canvas);
    redraw();
    return () => ro.disconnect();
  }, [redraw]);

  // Re-render when the reviewed comment's strokes change.
  useEffect(() => {
    redraw();
  }, [reviewStrokes, redraw]);

  const pointFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const handleDown = (e) => {
    if (!enabled) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    current.current = {
      color: penRef.current.color,
      width: penRef.current.width,
      points: [pointFromEvent(e)],
    };
    redraw();
  };

  const handleMove = (e) => {
    if (!enabled || !current.current) return;
    current.current.points.push(pointFromEvent(e));
    redraw();
  };

  const handleUp = (e) => {
    if (!enabled || !current.current) return;
    canvasRef.current.releasePointerCapture?.(e.pointerId);
    if (current.current.points.length > 0) {
      liveStrokes.current.push(current.current);
    }
    current.current = null;
    redraw();
    notify();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      className={`absolute inset-0 h-full w-full ${
        enabled ? 'pointer-events-auto cursor-crosshair touch-none' : 'pointer-events-none'
      }`}
    />
  );
});

export default VectorCanvas;
