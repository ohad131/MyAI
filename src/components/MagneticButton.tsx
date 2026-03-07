"use client";

import React, { useRef, useCallback } from "react";
import { useLiquidRipple } from "@/hooks/useLiquidRipple";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** How strongly the button is pulled toward the cursor (0–1, default 0.38) */
  strength?: number;
  /** Extra class names */
  className?: string;
  children: React.ReactNode;
}

/**
 * MagneticButton
 * Wraps any button with a magnetic cursor effect:
 * - On mouse enter/move: button translates toward the cursor position
 * - On mouse leave: springs back to origin with a slight overshoot
 * - On mouse down: ripple effect at click position
 *
 * Usage:
 *   <MagneticButton className="btn-liquid">Click me</MagneticButton>
 */
export function MagneticButton({
  strength = 0.38,
  className = "",
  children,
  onMouseDown,
  style,
  ...props
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);
  const createRipple = useLiquidRipple();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = btnRef.current;
      if (!btn) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
        btn.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      });
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Spring back with slight overshoot
    btn.style.transition = "transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)";
    btn.style.transform = "translate(0px, 0px)";
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onMouseDown?.(e);
    },
    [createRipple, onMouseDown]
  );

  return (
    <button
      ref={btnRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      style={{ ...style, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      {...props}
    >
      {children}
    </button>
  );
}
