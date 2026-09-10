import { useEffect, useRef } from 'react';

/**
 * Mouse-following spotlight glow — a JSX port of motion-primitives'
 * Spotlight. Mount as a child of a `relative` container: a blurred
 * gradient blob tracks the cursor across the container and fades out when
 * it leaves. Purely decorative — pointer-events-none, aria-hidden.
 *
 * Props:
 *   size      — blob diameter in px (default 400)
 *   className — gradient stops + blur utilities, e.g.
 *               "from-primary/20 via-primary/10 to-transparent blur-3xl"
 *               (the blob itself is `bg-gradient-to-tr rounded-full`)
 */
export default function Spotlight({ size = 400, className = '' }) {
  const wrapRef = useRef(null);
  const blobRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const blob = blobRef.current;
    // The overlay is pointer-events-none, so listen on its host container
    // and track the cursor in the host's coordinate space.
    const host = wrap?.parentElement;
    if (!wrap || !blob || !host) return undefined;

    const move = (e) => {
      const rect = host.getBoundingClientRect();
      blob.style.transform = `translate3d(${
        e.clientX - rect.left - size / 2
      }px, ${e.clientY - rect.top - size / 2}px, 0)`;
      blob.style.opacity = '1';
    };
    const leave = () => {
      blob.style.opacity = '0';
    };

    host.addEventListener('mousemove', move);
    host.addEventListener('mouseleave', leave);
    return () => {
      host.removeEventListener('mousemove', move);
      host.removeEventListener('mouseleave', leave);
    };
  }, [size]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
    >
      <div
        ref={blobRef}
        className={`absolute left-0 top-0 rounded-full bg-gradient-to-tr opacity-0 will-change-transform ${className}`}
        style={{
          width: size,
          height: size,
          // Short transform transition makes the blob glide behind the
          // cursor (a cheap stand-in for the original's spring);
          // opacity fades in/out more slowly.
          transition: 'transform 250ms ease-out, opacity 500ms ease',
        }}
      />
    </div>
  );
}
