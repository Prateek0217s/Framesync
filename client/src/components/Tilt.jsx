import { useEffect, useRef } from 'react';

/**
 * Cursor-tracking 3D tilt — a JSX port of motion-primitives' Tilt. While
 * hovered, the element rotates toward the cursor (up to `rotationFactor`
 * degrees per axis, `reverse` flips the direction), then eases back flat
 * on leave. A short transform transition while tracking makes it feel
 * attached; a longer one on leave gives the settle.
 *
 * `disabled` freezes the element flat without unmounting listeners-free —
 * used by ProjectCard while dnd-kit is dragging the card.
 */
export default function Tilt({
  children,
  rotationFactor = 8,
  reverse = false,
  disabled = false,
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;
    // Respect prefers-reduced-motion: no tilt, keep the layout.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const dir = reverse ? -1 : 1;
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 → 1 across
      const y = (e.clientY - rect.top) / rect.height; // 0 → 1 down
      const rx = dir * (0.5 - y) * 2 * rotationFactor;
      const ry = dir * (x - 0.5) * 2 * rotationFactor;
      el.style.transition = 'transform 80ms ease-out';
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const leave = () => {
      el.style.transition = 'transform 350ms ease-out';
      el.style.transform = 'perspective(900px)';
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [rotationFactor, reverse, disabled]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
