"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";

/**
 * Detail cover. A 600px window (400px on phones) over a 1200px (800px) frame that is 105% wide,
 * centred, with the image contained inside it. The frame drifts up by 10% of the page scroll,
 * the source's "Parallax Image" scroll transform.
 */
export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * -0.1);

  return (
    <div className="relative h-[400px] w-full overflow-hidden min-[810px]:h-[600px]">
      <motion.div
        style={{ y }}
        className="absolute top-[-200px] left-[-2.5%] h-[800px] w-[105%] min-[810px]:top-[-300px] min-[810px]:h-[1200px]"
      >
        <Image src={src} alt={alt} fill priority sizes="105vw" className="object-contain" />
      </motion.div>
    </div>
  );
}
