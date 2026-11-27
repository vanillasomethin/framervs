"use client";

import Lenis from "lenis";
import { useEffect } from "react";

declare global {
  interface Window {
    vsLenis?: Lenis;
  }
}

/**
 * Framer "Smooth Scroll" component, intensity 10 -> Lenis({ duration: 1 }), default easing.
 * Same-page anchor links ("#section-about", "#section-hero") scroll through Lenis.
 * Native window scroll stays the source of truth, so scroll-driven sections can read
 * window.scrollY / IntersectionObserver as usual. The instance is exposed as window.vsLenis (Lenis itself owns window.lenis).
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1, autoRaf: true, anchors: true });
    window.vsLenis = lenis;
    return () => {
      lenis.destroy();
      if (window.vsLenis === lenis) window.vsLenis = undefined;
    };
  }, []);
  return null;
}
