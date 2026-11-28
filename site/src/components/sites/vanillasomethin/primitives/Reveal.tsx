"use client";

import { motion, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";

export type RevealFrom = {
  opacity?: number;
  x?: number;
  y?: number;
  rotateX?: number;
  rotate?: number;
  scale?: number;
};

type RevealProps = {
  children?: ReactNode;
  className?: string;
  /** Start state (Framer "appear" effect). Default = section-header fade-up: opacity 0, y 20. */
  from?: RevealFrom;
  /** Spring duration in seconds (Framer "duration"). */
  duration?: number;
  /** Spring bounce 0..1 (Framer "bounce"). */
  bounce?: number;
  delay?: number;
  /** "inView" (default) plays when `amount` of the element is visible; "mount" plays on mount. */
  trigger?: "inView" | "mount";
  /** Visible fraction that triggers (Framer threshold). */
  amount?: number;
  once?: boolean;
  /** Perspective for rotateX effects (counter rows use 1200px). */
  perspective?: number;
};

/**
 * Framer appear/scroll-reveal preset. Defaults reproduce the section-header reveal:
 * { opacity: 0, y: 20 } -> rest, spring bounce .2 duration .4 delay .4, 50% in view, once.
 */
export function Reveal({
  children,
  className,
  from = { opacity: 0, y: 20 },
  duration = 0.4,
  bounce = 0.2,
  delay = 0.4,
  trigger = "inView",
  amount = 0.5,
  once = true,
  perspective,
}: RevealProps) {
  const initial: TargetAndTransition = { opacity: 1, x: 0, y: 0, rotateX: 0, rotate: 0, scale: 1, ...from };
  const rest: TargetAndTransition = {
    opacity: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotate: 0,
    scale: 1,
    transition: { type: "spring", duration, bounce, delay },
  };
  const style = perspective ? { transformPerspective: perspective } : undefined;

  if (trigger === "mount") {
    return (
      <motion.div className={className} style={style} initial={initial} animate={rest}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={initial}
      whileInView={rest}
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}
