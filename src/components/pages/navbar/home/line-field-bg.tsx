"use client";

import { useEffect, useRef } from "react";

const PITCH = 5;
const CELL = 6;
const FRAME_MS = 1000 / 30;

type Hole = { x: number; y: number; rx: number; ry: number };

function smoothstep(edge0: number, edge1: number, value: number) {
  const k = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return k * k * (3 - 2 * k);
}

function columnGain(index: number) {
  const n = Math.sin(index * 12.9898) * 43758.5453;
  return 0.7 + 0.3 * (n - Math.floor(n));
}

function density(
  x: number,
  y: number,
  t: number,
  w: number,
  h: number,
  hole: Hole | null,
) {
  const a = Math.sin(
    x * 0.011 + t * 0.21 + Math.sin(y * 0.004 + t * 0.13) * 1.6,
  );
  const b = Math.sin(
    y * 0.009 - t * 0.17 + Math.sin(x * 0.006 - t * 0.05) * 1.3,
  );
  const wave = 0.5 + 0.5 * (0.55 * a + 0.45 * b);
  const fade = smoothstep(0, h * 0.1, y) * smoothstep(0, h * 0.22, h - y);
  // Weighted toward the outer edge so the headline and buttons stay on a calm field.
  const side = smoothstep(w * 0.3, w * 0.95, x);
  let clear = 1;
  if (hole) {
    const dx = (x - hole.x) / hole.rx;
    const dy = (y - hole.y) / hole.ry;
    clear = smoothstep(0.55, 1.2, Math.sqrt(dx * dx + dy * dy));
  }
  return fade * side * clear * wave * wave * wave;
}

// Vertical hairlines broken into halftone dashes; drawn black and inverted in dark mode so CSS owns the colour.
export function LineFieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let hole: Hole | null = null;
    let frame = 0;
    let last = 0;
    let onScreen = true;

    function measure() {
      if (!canvas || !host || !ctx) return;
      const box = host.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      const wrapper = host.querySelector("[data-line-field-clear]");
      const mark = wrapper?.firstElementChild?.getBoundingClientRect();
      hole =
        mark && mark.width > 0
          ? {
              x: mark.left - box.left + mark.width / 2,
              y: mark.top - box.top + mark.height / 2,
              rx: mark.width * 0.42,
              ry: mark.height * 0.48,
            }
          : null;
    }

    function draw(seconds: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      const columns = Math.ceil(width / PITCH);
      for (let i = 0; i < columns; i++) {
        const x = i * PITCH + 2;
        const gain = columnGain(i);
        for (let y = 0; y < height; y += CELL) {
          const ink = density(x, y + CELL / 2, seconds, width, height, hole) * gain;
          const length = ink * CELL;
          if (length < 0.5) continue;
          ctx.rect(x, y + (CELL - length) / 2, 1, length);
        }
      }
      ctx.fillStyle = "#000";
      ctx.fill();
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now / 1000);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!wide.matches) return;
      measure();
      if (still.matches) {
        draw(0);
        return;
      }
      draw(performance.now() / 1000);
      if (onScreen) frame = requestAnimationFrame(tick);
    }

    const resize = new ResizeObserver(sync);
    resize.observe(host);
    const visibility = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    visibility.observe(canvas);
    wide.addEventListener("change", sync);
    still.addEventListener("change", sync);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      wide.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden size-full opacity-[0.2] lg:block dark:invert"
    />
  );
}
