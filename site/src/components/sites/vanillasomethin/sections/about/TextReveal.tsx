"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Sticky word-by-word reveal. Word i lights when the block's top is at or above
 * `base - step * i` px from the viewport top (desktop 247/30, mobile 462/40), which is
 * scrollY 860 + 30i / 560 + 40i on the source page. Continuous and reversible.
 */
export function TextReveal({ text, children, images }: { text: string; children?: ReactNode; images?: ReactNode }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const words = text.split(" ");

  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    const mobile = window.matchMedia("(max-width: 809.98px)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top;
      const [base, step] = mobile.matches ? [462, 40] : [247, 30];
      const count = top > base ? 0 : Math.min(words.length, Math.floor((base - top) / step) + 1);
      setActive(count);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
    };
  }, [words.length]);

  return (
    <div ref={blockRef} className="relative flex w-full flex-col gap-10">
      <div className="sticky top-20 z-[1] flex w-full flex-col items-center gap-10">
        <p
          aria-label={text}
          className="w-full text-center font-grotesk text-[26px] leading-[1.25] font-normal tracking-[0.02em] min-[810px]:w-[800px] min-[810px]:max-w-full min-[810px]:text-[55px]"
        >
          {words.map((word, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="mr-[0.25em] inline-block transition-[color,filter] duration-200 ease-in-out"
              style={{ color: i < active ? "var(--vs-fg)" : "var(--vs-dim)" }}
            >
              {word}
            </span>
          ))}
        </p>
        {children}
      </div>
      {/* Scroll runway the sticky description travels over. */}
      <div aria-hidden="true" className="h-[800px] w-full" />
      {images}
    </div>
  );
}
