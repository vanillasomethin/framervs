"use client";

import { useEffect, useRef } from "react";

/** A muted looping video that only downloads and plays once it is near the viewport. */
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        video.src = src;
        void video.play().catch(() => {});
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);

  return <video ref={ref} loop muted playsInline preload="none" className={className} />;
}
