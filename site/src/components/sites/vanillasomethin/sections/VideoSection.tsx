"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { VIDEO } from "../data";
import { CharReveal } from "../primitives/CharReveal";

/**
 * Video (#section-video): 100vh, content centred in a 232px-tall stage. The logo-reveal video
 * sits in a box 103% of the stage wide and 744.72px tall (top 77px into the section at 1440x900),
 * object-fit scale-down, and grows from scale .1 (spring 1s, bounce 0, delay .5) when half of it
 * is in view. The sentence sits top-left over it with a per-character fade that replays on re-entry.
 * Like Framer's Video component, the clip autoplays muted from load (no loop) and restarts from
 * the beginning when the section comes back into view after it has ended.
 */
export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // The video only downloads once the section is near (it is several MB and
    // would otherwise compete with the hero for bandwidth on phones).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (video.preload !== "auto") {
          video.preload = "auto";
          void video.play().catch(() => {});
        } else if (video.ended) {
          video.currentTime = 0;
          void video.play().catch(() => {});
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="section-video"
      className="vs-frame relative z-[2] flex h-screen flex-col items-center justify-center overflow-hidden bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <div className="relative z-[1] h-[232px] w-full">
        <motion.div
          className="absolute top-[-256.53px] left-[-1.427%] h-[744.72px] w-[103%] overflow-hidden"
          initial={{ scale: 0.1 }}
          whileInView={{ scale: 1, transition: { type: "spring", duration: 1, bounce: 0, delay: 0.5 } }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <video
            ref={videoRef}
            src={VIDEO.src}
            muted
            playsInline
            preload="none"
            className="block h-full w-full object-scale-down"
          />
        </motion.div>
        <div className="absolute top-[-272px] left-[-1.427%] z-[1] w-[103%] min-[810px]:top-[-194px] min-[810px]:left-6 min-[810px]:w-[466px]">
          <CharReveal
            text={VIDEO.sentence}
            className="font-inter text-xl leading-[30px] font-light text-vs-inverse"
            threshold={1}
            repeat
            duration={0.8}
            stagger={0.05}
            easing="cubic-bezier(.44,0,.56,1)"
          />
        </div>
      </div>
    </section>
  );
}
