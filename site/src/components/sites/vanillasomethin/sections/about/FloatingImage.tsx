"use client";

import { motion, useScroll, useTransform } from "motion/react";

/**
 * About floating image: page-scroll parallax (moves `speed` x scroll, i.e. an extra
 * -(speed-1) * scrollY offset, as on the source) plus a y34 fade-up appear.
 */
export function FloatingImage({
  src,
  speed,
  className,
  center = false,
}: {
  src: string;
  speed: number;
  className: string;
  /** translateY(-50%) on the positioned box (right-hand large image). */
  center?: boolean;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => -(speed - 1) * v);
  return (
    <div className={`absolute ${center ? "-translate-y-1/2" : ""} ${className}`}>
      <motion.div className="h-full w-full" style={{ y }}>
        <motion.div
          className="relative h-full w-full"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0, transition: { type: "spring", duration: 1.3, bounce: 0.2 } }}
          viewport={{ once: true, amount: 0.5 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </motion.div>
      </motion.div>
    </div>
  );
}
