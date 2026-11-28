"use client";

import { useEffect, useRef } from "react";

/** Source ticker: items `[80x24 image][text]`, gap 40, padding 10, scrolling left at 40 px/s. */
const SPEED_PX_PER_S = 40;
const GAP = 40;
/** Copies rendered so the strip always covers the 1380px window plus one loop. */
const COPIES = 6;

/**
 * Framer Ticker clone. One loop = two items + gaps (live: row 01 shifts -2664px over 66.6s),
 * measured at runtime so the loop stays seamless whatever the font metrics. Runs continuously;
 * it is only visible while the row's content layer is faded out on hover.
 */
export function ServiceTicker({ text, image }: { text: string; image: string }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const first = list?.firstElementChild as HTMLElement | null;
    if (!list || !first) return;
    let anim: Animation | null = null;
    let lastShift = 0;
    const start = () => {
      const shift = Math.round(2 * (first.getBoundingClientRect().width + GAP));
      if (!shift || shift === lastShift) return;
      const progress = anim ? Number(anim.currentTime ?? 0) / ((lastShift / SPEED_PX_PER_S) * 1000) : 0;
      anim?.cancel();
      lastShift = shift;
      const duration = (shift / SPEED_PX_PER_S) * 1000;
      anim = list.animate([{ transform: "translateX(0px)" }, { transform: `translateX(-${shift}px)` }], {
        duration,
        iterations: Infinity,
        easing: "linear",
      });
      if (progress > 0) anim.currentTime = (progress % 1) * duration;
    };
    start();
    const ro = new ResizeObserver(start);
    ro.observe(first);
    return () => {
      ro.disconnect();
      anim?.cancel();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[14px] left-0 z-0 flex h-[37px] w-full flex-col items-center justify-center max-[809px]:hidden"
    >
      <div className="flex h-9 w-full items-center overflow-hidden p-2.5">
        <ul ref={listRef} className="flex shrink-0 items-center gap-10 will-change-transform">
          {Array.from({ length: COPIES }, (_, i) => (
            <li key={i} className="flex shrink-0 items-center justify-center gap-10 overflow-hidden">
              <div className="relative h-6 w-20 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="absolute inset-0 block h-full w-full object-cover" />
              </div>
              <p className="font-grotesk text-base leading-6 font-normal whitespace-pre text-vs-bg uppercase">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
