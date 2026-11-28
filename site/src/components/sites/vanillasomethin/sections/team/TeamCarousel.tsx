"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type TeamSlide = {
  image: string;
  quote: string;
  name: string;
  role: string;
  /** CSS object-position of the portrait (mobile variant crops from the top). */
  objectPosition?: string;
};

type Arrows = {
  back: string;
  next: string;
  /** Circle background classes (desktop: muted token circle with a white chevron svg). */
  className?: string;
};

type TeamCarouselProps = {
  slides: TeamSlide[];
  /** Slide (and viewport) width in px. Desktop 800, mobile 340. */
  slideWidth: number;
  /** Viewport height in px. Desktop 743, mobile 505. */
  height: number;
  /** Square portrait size in px. Desktop 200, mobile 120. */
  imageSize: number;
  arrows: Arrows;
  className?: string;
  label: string;
};

const GAP = 10;
/**
 * Framer slideshow transition. Sampled live for an 810px move: 412px at 100ms, 686 at 200ms,
 * 798 at 400ms, i.e. a critically damped spring with omega ~16.8 rad/s (settles ~0.7s).
 */
const SPRING = { type: "spring", stiffness: 282, damping: 33.6, mass: 1 } as const;
/** Slides rendered on each side of the current one (infinite window). */
const WINDOW = 3;

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * Infinite, draggable, no-autoplay slideshow (Framer "Slideshow"). The track is a motion value
 * in px; slides are rendered in a window around the current index at `k * step`, so it loops
 * forever in both directions without a wrap jump. Arrows and Left/Right keys move one slide.
 */
export function TeamCarousel({ slides, slideWidth, height, imageSize, arrows, className, label }: TeamCarouselProps) {
  const n = slides.length;
  const step = slideWidth + GAP;
  const x = useMotionValue(0);
  const [center, setCenter] = useState(0);
  const target = useRef(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    startValue: number;
    startIndex: number;
    moved: boolean;
    samples: { t: number; x: number }[];
  } | null>(null);

  useMotionValueEvent(x, "change", (v) => {
    const c = Math.round(-v / step);
    setCenter((prev) => (prev === c ? prev : c));
  });

  const goTo = useCallback(
    (index: number, velocity = 0) => {
      target.current = index;
      anim.current?.stop();
      anim.current = animate(x, -index * step, { ...SPRING, velocity });
    },
    [step, x],
  );

  const go = useCallback((dir: 1 | -1) => goTo(target.current + dir), [goTo]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    anim.current?.stop();
    const v = x.get();
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startValue: v,
      startIndex: Math.round(-v / step),
      moved: false,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 3) return;
      // A mostly vertical touch move is a page scroll, not a slide drag.
      if (e.pointerType !== "mouse" && Math.abs(e.clientY - d.startY) > Math.abs(dx)) {
        drag.current = null;
        goTo(target.current);
        return;
      }
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    x.set(d.startValue + dx);
    d.samples.push({ t: e.timeStamp, x: e.clientX });
    if (d.samples.length > 6) d.samples.shift();
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) {
      goTo(target.current);
      return;
    }
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? (last.x - first.x) / dt : 0;
    const dx = e.clientX - d.startX;
    let index = Math.round(-x.get() / step);
    if (index === d.startIndex && (Math.abs(dx) > slideWidth * 0.1 || Math.abs(velocity) > 300)) {
      index = d.startIndex + (dx < 0 ? 1 : -1);
    }
    goTo(index, velocity);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const current = mod(center, n);
  const items = [];
  for (let k = center - WINDOW; k <= center + WINDOW; k++) items.push(k);

  return (
    <div
      className={`relative mx-auto ${className ?? ""}`}
      style={{ width: slideWidth, height, maxWidth: "100%" }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vs-muted"
        tabIndex={0}
        aria-label={`${label}: use the left and right arrow keys to change slide`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        <motion.div className="absolute top-0 left-0 h-full" style={{ x }}>
          {items.map((k) => {
            const slide = slides[mod(k, n)];
            const active = k === center;
            return (
              <div
                key={k}
                role="group"
                aria-roledescription="slide"
                aria-label={`${mod(k, n) + 1} of ${n}`}
                aria-hidden={!active}
                inert={!active}
                className="absolute top-0 h-full"
                style={{ left: k * step, width: slideWidth }}
              >
                <Slide slide={slide} imageSize={imageSize} />
              </div>
            );
          })}
        </motion.div>
      </div>
      <p className="sr-only" aria-live="polite">
        {`Slide ${current + 1} of ${n}: ${slides[current].name}`}
      </p>
      <ArrowButton side="left" src={arrows.back} label="Previous" className={arrows.className} onClick={() => go(-1)} />
      <ArrowButton side="right" src={arrows.next} label="Next" className={arrows.className} onClick={() => go(1)} />
    </div>
  );
}

function Slide({ slide, imageSize }: { slide: TeamSlide; imageSize: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-5 overflow-hidden bg-vs-bg">
      <div className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: imageSize, height: imageSize }}>
        <Image
          src={slide.image}
          alt={slide.name}
          fill
          sizes={`${imageSize}px`}
          className="pointer-events-none object-cover"
          style={{ objectPosition: slide.objectPosition ?? "50% 50%" }}
          draggable={false}
        />
      </div>
      <div className="flex w-full flex-col items-center gap-2.5 bg-vs-bg px-10">
        <h3 className="vs-h3 w-full text-center text-vs-fg">{slide.quote}</h3>
        <div className="flex w-full items-end justify-center gap-1 whitespace-nowrap">
          <p className="vs-body shrink-0 text-center text-vs-fg">{slide.name}</p>
          <p className="shrink-0 text-center font-inter text-[14px] leading-[21px] font-medium text-vs-muted">{slide.role}</p>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  side,
  src,
  label,
  className,
  onClick,
}: {
  side: "left" | "right";
  src: string;
  label: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-[1] size-10 -translate-y-1/2 cursor-pointer overflow-hidden rounded-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vs-fg ${
        side === "left" ? "left-0" : "right-0"
      } ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={40} height={40} className="block size-10" draggable={false} />
    </button>
  );
}
