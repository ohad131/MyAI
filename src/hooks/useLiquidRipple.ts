"use client";

import { useCallback } from "react";

/**
 * useLiquidRipple
 * Adds a chrome-tinted ripple circle at the click position inside a .btn-liquid element.
 * Usage: <button className="btn-liquid" onMouseDown={createRipple}>
 */
export function useLiquidRipple() {
  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.10) 60%, transparent 100%);
      pointer-events: none;
      z-index: 10;
      animation: liquid-ripple 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    `;

    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }, []);

  return createRipple;
}
