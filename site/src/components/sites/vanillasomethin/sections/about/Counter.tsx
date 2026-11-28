"use client";

import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

type CounterProps = { end: number; suffix: string; label: string; text: string };

/**
 * Counter row: flips up from rotateX 80 / y 40 (spring 1.2s, no bounce) when half visible,
 * while the number counts 0 -> end linearly over 2s.
 */
export function Counter({ end, suffix, label, text }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  // Keep the real metric in server-rendered HTML; the parent stays hidden until the
  // existing entrance animation runs, then the count-up still starts at zero.
  const [value, setValue] = useState(end);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, end, { duration: 2, ease: "linear", onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, end]);

  return (
    <motion.div
      ref={ref}
      className="flex w-full flex-col gap-5 border-b border-vs-fg py-5 min-[810px]:flex-row min-[810px]:items-center min-[810px]:gap-2.5"
      initial={{ opacity: 0, rotateX: 80, y: 40 }}
      animate={inView ? { opacity: 1, rotateX: 0, y: 0 } : undefined}
      transition={{ type: "spring", duration: 1.2, bounce: 0 }}
    >
      <p
        aria-label={`${end}${suffix}`}
        className="flex-1 font-grotesk text-[48px] leading-[1.27] font-bold text-vs-fg min-[810px]:text-[62px] min-[1440px]:text-[96px]"
      >
        <span aria-hidden="true">
          {value}
          {suffix}
        </span>
      </p>
      <div className="flex w-full flex-col gap-2.5 min-[810px]:w-[400px] min-[810px]:shrink-0">
        <p className="font-aboreto text-base leading-[1.5] text-vs-fg">{label}</p>
        <p className="vs-body text-vs-fg">{text}</p>
      </div>
    </motion.div>
  );
}
