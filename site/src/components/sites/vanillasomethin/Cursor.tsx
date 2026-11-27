"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor (desktop fine pointers only).
 * Default: 16px fg-coloured dot, horizontally centred on the pointer with its top edge at
 * the pointer (translate(-50%, 0)), no lag. Over any element with data-cursor="view"
 * (the Works cards) it morphs into a pill (~84x53) reading "VIEW" in the bg colour.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"dot" | "view">("dot");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("vs-cursor-on");
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, 0)`;
      setVisible(true);
      const target = e.target instanceof Element ? e.target.closest("[data-cursor]") : null;
      setMode(target?.getAttribute("data-cursor") === "view" ? "view" : "dot");
    };
    const onLeave = () => setVisible(false);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.classList.remove("vs-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[13]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-vs-fg transition-[width,height] duration-300 ease-out ${
          mode === "view" ? "h-[53px] w-[84px]" : "h-4 w-4"
        }`}
      >
        <span
          className={`vs-h5 text-vs-bg transition-opacity duration-200 ${mode === "view" ? "opacity-100" : "opacity-0"}`}
        >
          VIEW
        </span>
      </div>
    </div>
  );
}
