"use client";

/**
 * LiquidButton — Y2K Chrome Liquid Metal
 * SVG path morphing + subtle shimmer + authentic metallic gradient.
 * Text is a separate absolute layer — no filter applied to it.
 *
 * Size variants:
 *   md   — 176×72px SVG  (default, page headers)
 *   sm   — 130×54px SVG  (toolbars, panels)
 *   xs   — 88×38px SVG   (inline, input bars, compact rows)
 *   icon — 44×44px SVG   (icon-only square)
 *
 * Gradient philosophy: real metal looks like a diagonal band of light
 * crossing a darker base — NOT a rainbow of 6 stops top-to-bottom.
 */

import React, { useRef, useCallback, useEffect, useState } from "react";
import { BLOB_PATHS } from "./blobPaths";

type LiquidButtonSize = "md" | "sm" | "xs" | "icon";

interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: LiquidButtonSize;
}

// SVG dimensions per size variant
// viewBox is always 220×90 (blob coordinate space)
// width/height scale the rendered SVG
const SIZE_MAP: Record<LiquidButtonSize, { w: number; h: number; pad: number; fontSize: string; gap: string }> = {
  md:   { w: 176, h: 72,  pad: 14, fontSize: "0.8125rem", gap: "0.4rem" },
  sm:   { w: 130, h: 52,  pad: 10, fontSize: "0.75rem",   gap: "0.35rem" },
  xs:   { w: 88,  h: 36,  pad: 7,  fontSize: "0.6875rem", gap: "0.3rem" },
  icon: { w: 44,  h: 44,  pad: 7,  fontSize: "0.75rem",   gap: "0" },
};

function parsePath(d: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  for (const p of d.trim().split(/\s+/)) {
    const n = parseFloat(p);
    tokens.push(isNaN(n) ? p : n);
  }
  return tokens;
}

function lerpPaths(a: Array<string | number>, b: Array<string | number>, t: number): string {
  return a.map((va, i) => {
    const vb = b[i];
    return typeof va === "number" && typeof vb === "number"
      ? (va + (vb - va) * t).toFixed(2)
      : va;
  }).join(" ");
}

const PARSED_BLOBS = BLOB_PATHS.map(parsePath);
let uidCounter = 0;

export default function LiquidButton({
  children,
  onClick,
  className = "",
  disabled = false,
  style: outerStyle,
  size = "md",
}: LiquidButtonProps) {
  const { w, h, pad, fontSize, gap } = SIZE_MAP[size];

  const outerRef   = useRef<HTMLDivElement>(null);
  const pathRef    = useRef<SVGPathElement>(null);
  const specRef    = useRef<SVGPathElement>(null);
  const shimRef    = useRef<SVGPathElement>(null);
  const morphRaf   = useRef<number>(0);
  const magRaf     = useRef<number>(0);
  const shimRaf    = useRef<number>(0);
  const posRef     = useRef({ x: 0, y: 0 });
  const targetRef  = useRef({ x: 0, y: 0 });
  const [gradId]   = useState(() => `lbg${uidCounter++}`);
  const [specId]   = useState(() => `lbs${uidCounter++}`);
  const [shimGrad] = useState(() => `lbsh${uidCounter++}`);
  const [clipId]   = useState(() => `lbcl${uidCounter++}`);
  const [hovered, setHovered] = useState(false);

  // ── Blob morphing (4s per transition, ease-in-out cubic) ────────
  useEffect(() => {
    let elapsed = 0;
    let last = performance.now();
    let fromIdx = 0;
    let toIdx = 1;
    const DURATION = 4000;

    function tick(now: number) {
      elapsed += now - last;
      last = now;
      const p = Math.min(elapsed / DURATION, 1);
      const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
      const d = lerpPaths(PARSED_BLOBS[fromIdx], PARSED_BLOBS[toIdx], e);
      pathRef.current?.setAttribute("d", d);
      specRef.current?.setAttribute("d", d);
      shimRef.current?.setAttribute("d", d);
      if (p >= 1) {
        elapsed = 0;
        fromIdx = toIdx;
        toIdx = (toIdx + 1 + Math.floor(Math.random() * (BLOB_PATHS.length - 2))) % BLOB_PATHS.length;
        if (toIdx === fromIdx) toIdx = (toIdx + 1) % BLOB_PATHS.length;
      }
      morphRaf.current = requestAnimationFrame(tick);
    }
    morphRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(morphRaf.current);
  }, []);

  // ── Subtle shimmer: slow diagonal sweep, very low opacity ───────
  useEffect(() => {
    const el = document.getElementById(shimGrad) as SVGLinearGradientElement | null;
    if (!el) return;
    let start: number | null = null;
    const PERIOD = 6000;

    function anim(now: number) {
      if (!start) start = now;
      if (!el) return;
      const t = ((now - start) % PERIOD) / PERIOD;
      const x = -0.5 + t * 2.0;
      el.setAttribute("x1", `${(x * 100).toFixed(1)}%`);
      el.setAttribute("x2", `${((x + 0.30) * 100).toFixed(1)}%`);
      shimRaf.current = requestAnimationFrame(anim);
    }
    shimRaf.current = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(shimRaf.current);
  }, [shimGrad]);

  // ── Magnetic cursor pull ─────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!outerRef.current) return;
    const r = outerRef.current.getBoundingClientRect();
    targetRef.current = {
      x: (e.clientX - r.left - r.width  / 2) * 0.08,
      y: (e.clientY - r.top  - r.height / 2) * 0.08,
    };
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    setHovered(false);
  }, []);

  useEffect(() => {
    function loop() {
      const p = posRef.current, t = targetRef.current;
      p.x += (t.x - p.x) * 0.055;
      p.y += (t.y - p.y) * 0.055;
      if (outerRef.current)
        outerRef.current.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`;
      magRaf.current = requestAnimationFrame(loop);
    }
    magRaf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(magRaf.current);
  }, []);

  // Glow intensity scales with size
  const glowSize = size === "md" ? "8px" : size === "sm" ? "6px" : "4px";
  const glowFar  = size === "md" ? "22px" : size === "sm" ? "14px" : "8px";

  return (
    <div
      ref={outerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`lbtn-outer ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        filter: hovered
          ? `drop-shadow(0 0 ${glowSize} var(--metal-glow-soft)) drop-shadow(0 0 ${glowFar} var(--metal-glow-soft))`
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
        transition: "filter 0.5s ease",
        padding: `${pad}px`,
        ...outerStyle,
      }}
    >
      <svg
        viewBox="0 0 220 90"
        width={w}
        height={h}
        style={{ display: "block", overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          {/* Radial gradient: bright center → darker edges */}
          <radialGradient id={gradId} cx="45%" cy="40%" r="65%" fx="45%" fy="35%">
            <stop offset="0%"   stopColor="var(--metal-center)" />
            <stop offset="40%"  stopColor="var(--metal-mid)" />
            <stop offset="100%" stopColor="var(--metal-edge)" />
          </radialGradient>

          {/* Specular dome */}
          <radialGradient id={specId} cx="28%" cy="25%" r="35%">
            <stop offset="0%"   stopColor="var(--metal-specular)" stopOpacity="0.90" />
            <stop offset="40%"  stopColor="var(--metal-specular)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--metal-specular)" stopOpacity="0" />
          </radialGradient>

          {/* Shimmer sweep — subtle, 0.18 opacity */}
          <linearGradient id={shimGrad} x1="-50%" y1="0" x2="-20%" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="45%"  stopColor="rgba(255,255,255,0.18)" />
            <stop offset="55%"  stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <clipPath id={clipId}>
            <path ref={shimRef} d={BLOB_PATHS[0]} />
          </clipPath>
        </defs>

        {/* Base metallic fill */}
        <path ref={pathRef} d={BLOB_PATHS[0]} fill={`url(#${gradId})`} />

        {/* Specular dome */}
        <path ref={specRef} d={BLOB_PATHS[0]} fill={`url(#${specId})`}
          style={{ mixBlendMode: "screen", pointerEvents: "none" }} />

        {/* Shimmer sweep */}
        <rect
          x="-20" y="-20" width="260" height="130"
          fill={`url(#${shimGrad})`}
          clipPath={`url(#${clipId})`}
          style={{ mixBlendMode: "screen", pointerEvents: "none" }}
        />
      </svg>

      {/* Invisible click target */}
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          position: "absolute", inset: 0,
          background: "none", border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          zIndex: 20,
        }}
        aria-label={typeof children === "string" ? children : undefined}
      />

      {/* Text — absolute, centered, NO filter, always crisp */}
      <div
        style={{
          position: "absolute",
          inset: `${pad}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap,
          fontSize,
          fontWeight: 700,
          letterSpacing: size === "xs" ? "0.03em" : "0.05em",
          color: "var(--chrome-text)",
          pointerEvents: "none",
          zIndex: 10,
          whiteSpace: "nowrap",
          textShadow: "none",
          userSelect: "none",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
