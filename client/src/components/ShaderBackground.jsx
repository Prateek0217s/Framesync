import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Light Ripple — animated full-screen WebGL shader background (skill:
 * light-ripple). Glowing concentric arcs of light, dispersed into color and
 * sliced by a diagonal grid. Ported from the skill's TSX to plain JSX for the
 * Vite client ("use client" is Next.js-only and unneeded here). The whole
 * effect lives in the GLSL fragment shader, so it renders identically
 * everywhere. Only dependency: three (MIT).
 *
 * Props (see the skill's prop reference):
 *   speed       — animation multiplier (1 = default, 0 = frozen still frame)
 *   lineWidth   — glow line thickness (default 0.002; higher = bolder)
 *   dispersion  — RGB channel offset for the spectrum look (ignored if tint)
 *   tint        — [r,g,b] 0–1 monochrome glow; null = full spectrum
 *   brightness  — overall intensity multiplier
 *   invert      — light-theme variant: white ground with the arcs subtracted
 *                 instead of black ground with them added. The arcs subtract
 *                 the tint's complement, so an ice tint stays ice-cyan on
 *                 white rather than flipping to its inverse hue.
 */
export default function ShaderBackground({
  speed = 1,
  lineWidth = 0.002,
  dispersion = 0.01,
  tint = null,
  brightness = 1,
  invert = false,
  className = 'h-full w-full',
  style,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vertexShader = `
      void main() { gl_Position = vec4(position, 1.0); }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float uLineWidth;
      uniform float uDispersion;
      uniform vec3 uTint;
      uniform float uUseTint;
      uniform float uBrightness;
      uniform float uInvert;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        vec3 color = vec3(0.0);
        for (int j = 0; j < 3; j++) {
          for (int i = 0; i < 5; i++) {
            color[j] += uLineWidth * float(i * i) /
              abs(fract(t - uDispersion * float(j) + float(i) * 0.01) * 5.0
                  - length(uv) + mod(uv.x + uv.y, 0.2));
          }
        }
        float mono = (color.r + color.g + color.b) / 3.0;
        // Dark theme: arcs add the tint to a black ground.
        vec3 darkColor = mix(color, mono * uTint, uUseTint) * uBrightness;
        // Light theme: arcs subtract the tint's complement from a white
        // ground — same hue, opposite polarity.
        vec3 lightColor = vec3(1.0) -
          mix(color, mono * (vec3(1.0) - uTint), uUseTint) * uBrightness;
        gl_FragColor = vec4(mix(darkColor, lightColor, uInvert), 1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      uLineWidth: { value: lineWidth },
      uDispersion: { value: dispersion },
      uTint: { value: new THREE.Vector3(...(tint ?? [1, 1, 1])) },
      uUseTint: { value: tint ? 1.0 : 0.0 },
      uBrightness: { value: brightness },
      uInvert: { value: invert ? 1.0 : 0.0 },
    };

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };
    onResize();
    window.addEventListener('resize', onResize);

    // prefers-reduced-motion → frozen still frame (skill's note).
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSpeed = reduced ? 0 : speed;

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05 * effectiveSpeed;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
    // tint must be a stable reference (module constant / useMemo) or the
    // canvas will re-initialize on every parent render.
  }, [speed, lineWidth, dispersion, tint, brightness, invert]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ background: invert ? '#fff' : '#000', overflow: 'hidden', ...style }}
    />
  );
}

// Preset constants from the skill — module-level so the `tint` prop stays a
// stable reference across renders (see the deps note above).
export const SHADER_TINTS = {
  ice: [0.3, 0.8, 1.0],
  solar: [1.0, 0.7, 0.25],
  plasma: [1.0, 0.3, 0.9],
  matrix: [0.35, 1.0, 0.45],
  noir: [0.85, 0.88, 1.0],
};
