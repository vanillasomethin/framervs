"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PlusIcon } from "../../primitives/PlusIcon";

type Item = { n: string; title: string; body: string; image: string };

/** Pointer-follow factors measured live: translate((px - cx) * 0.033, (py - cy) * 0.028). */
const FOLLOW_X = 0.033;
const FOLLOW_Y = 0.028;

/**
 * One Design Philosophy accordion row.
 * Closed 92px (desktop) / 66px (mobile): 20px padding around serial + h3 title + plus.
 * Open: plus rotates 45deg, the body (Inter 300, max-width 400) unfolds 20px under the title
 * (item grows to 232 / 254), and on desktop a 240x280 image card (brightness .5) appears at
 * left 75% (840 of 1120): top 200 -> 8, rotate(-10deg) -> 0, opacity 0 -> 1. While open, the
 * card drifts toward the pointer with a 0.15s ease-out transform transition.
 */
export function PhilosophyItem({
  item,
  open,
  onToggle,
}: {
  item: Item;
  open: boolean;
  onToggle: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const followRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const follow = followRef.current;
    if (!row || !follow) return;
    if (!open) {
      follow.style.transform = "translate(0px, 0px)";
      return;
    }
    const move = (x: number, y: number) => {
      const r = row.getBoundingClientRect();
      // Untransformed card centre: offsetLeft/offsetTop ignore the follow transform.
      const cx = r.left + follow.offsetLeft + follow.offsetWidth / 2;
      const cy = r.top + 8 + follow.offsetHeight / 2;
      follow.style.transform = `translate(${(x - cx) * FOLLOW_X}px, ${(y - cy) * FOLLOW_Y}px)`;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") move(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [open]);

  return (
    <div
      ref={rowRef}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`relative cursor-pointer p-5 outline-none transition-colors duration-200 ${
        open ? "" : "hover:bg-[rgba(77,77,77,0.06)]"
      }`}
    >
      <div className="relative flex gap-5 overflow-hidden">
        <p className="vs-body shrink-0 text-vs-fg">{item.n}</p>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="vs-h3 text-vs-fg">{item.title}</h3>
            <PlusIcon open={open} />
          </div>
          <div
            className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="vs-body max-w-[400px] pt-5 text-vs-fg">{item.body}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop image card (none on mobile). */}
      <div
        ref={followRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-[75%] z-[1] hidden h-[280px] w-[240px] min-[810px]:block"
        style={{
          top: open ? 8 : 200,
          opacity: open ? 1 : 0,
          transition:
            "transform 0.15s ease-out, top 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out",
        }}
      >
        <div
          className="relative h-full w-full brightness-50"
          style={{
            transform: open ? "none" : "rotate(-10deg)",
            transition: "transform 0.2s ease-out",
          }}
        >
          <Image src={item.image} alt="" fill sizes="240px" className="object-cover" />
        </div>
      </div>
    </div>
  );
}
