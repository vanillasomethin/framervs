"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";

type CharRevealProps = {
  text: string;
  className?: string;
  as?: ElementType;
  /** "mount" plays after hydration, "inView" when `threshold` of the element is visible. */
  trigger?: "mount" | "inView";
  threshold?: number;
  /** Per-character duration in seconds (hero/contact 0.8, nav labels 0.4). */
  duration?: number;
  /** Delay between consecutive characters in seconds (source: 0.05). */
  stagger?: number;
  delay?: number;
  /** Replay: reverses when the element leaves the viewport (video sentence). */
  repeat?: boolean;
  /** CSS easing. Default approximates Framer spring bounce 0. Video sentence: cubic-bezier(.44,0,.56,1). */
  easing?: string;
  /** Start state: opacity .001, blur(10px), translateY(10px) (Framer text effect). */
  blur?: number;
  y?: number;
};

/**
 * Framer per-character text effect. Words stay unbroken (nowrap spans), each character
 * animates opacity/blur/translateY with a per-character stagger. Screen readers get the
 * plain text via aria-label.
 */
export function CharReveal({
  text,
  className,
  as: Tag = "p",
  trigger = "inView",
  threshold = 0,
  duration = 0.8,
  stagger = 0.05,
  delay = 0,
  repeat = false,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  blur = 10,
  y = 10,
}: CharRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (trigger === "mount") {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= Math.min(threshold, 0.99)) {
          setShown(true);
          if (!repeat) io.disconnect();
        } else if (repeat && !entry.isIntersecting) {
          setShown(false);
        }
      },
      { threshold: [0, Math.min(threshold, 0.99)] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, threshold, repeat]);

  let index = 0;
  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true">
          <span style={{ whiteSpace: "nowrap" }}>
            {Array.from(word).map((ch) => {
              const i = index++;
              const style: CSSProperties = {
                display: "inline-block",
                opacity: shown ? 1 : 0.001,
                filter: shown ? "blur(0px)" : `blur(${blur}px)`,
                transform: shown ? "none" : `translateY(${y}px)`,
                transition: `opacity ${duration}s ${easing}, filter ${duration}s ${easing}, transform ${duration}s ${easing}`,
                transitionDelay: `${delay + i * stagger}s`,
                willChange: "transform, filter, opacity",
              };
              return (
                <span key={i} style={style}>
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
