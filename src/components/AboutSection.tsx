"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  {
    value: 8,
    suffix: "+",
    label: "Years Experiences",
    description:
      "Years of shaping spaces, stories, and identities. This isn't just practice—it's a creative evolution driven by vision, collaboration, and fearless design thinking.",
  },
  {
    value: 95,
    suffix: "%",
    label: "Satisfied Clients",
    description:
      "Not just satisfied—they return. Every project runs smooth thanks to clear communication, precise results, and a process that feels natural.",
  },
  {
    value: 50,
    suffix: "+",
    label: "Project Volume",
    description:
      "From simple beginnings to layered expressions — our journey is shaped by curiosity, collaboration, and the pursuit of honest design.",
  },
  {
    value: 12,
    suffix: "+",
    label: "Global Clients",
    description:
      "We've worked with brands, agencies, and individuals who value design and a different point of view.",
  },
];

function useCountUp(target: number, duration: number, triggered: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [triggered, target, duration]);

  return count;
}

function StatCounter({
  stat,
  triggered,
}: {
  stat: StatItem;
  triggered: boolean;
}) {
  const count = useCountUp(stat.value, 1500, triggered);

  return (
    <div>
      <div
        style={{
          fontSize: "clamp(40px, 5vw, 68px)",
          fontWeight: 700,
          color: "#0d0d0d",
          lineHeight: 1,
        }}
      >
        {count}
        {stat.suffix}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#0d0d0d",
          marginTop: 8,
        }}
      >
        {stat.label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#4d4d4d",
          lineHeight: 1.5,
          maxWidth: 200,
          marginTop: 6,
        }}
      >
        {stat.description}
      </div>
    </div>
  );
}

export function AboutSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      style={{
        background: "#ebe8e5",
        padding: "80px 40px",
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: "var(--font-fragment-mono)",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4d4d4d",
        }}
      >
        [ABOUT]
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "clamp(18px, 2vw, 26px)",
          color: "#0d0d0d",
          maxWidth: 600,
          lineHeight: 1.5,
          marginTop: 16,
          marginBottom: 0,
        }}
      >
        Where Functionality Meets Aesthetic, Your Architectural Journey Starts
        Here.
      </p>

      {/* Large body copy */}
      <p
        style={{
          fontSize: "clamp(26px, 3.5vw, 44px)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#0d0d0d",
          lineHeight: 1.15,
          margin: "48px 0 32px",
        }}
      >
        WE ARE VANILLA &amp; SOMETHIN. DESIGNERS OF SPACE, STORYTELLERS OF
        SIMPLICITY. OUR WORK CAPTURES THE SUBTLE TENSION BETWEEN STRUCTURE AND
        SOUL—WHERE THE ORDINARY TURNS EXTRAORDINARY.
      </p>

      {/* CTA link */}
      <Link
        href="#works"
        style={{
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#0d0d0d",
          textDecoration: "none",
          display: "inline-block",
        }}
        className="group"
      >
        <span className="group-hover:underline">SEE OUR WORKS →</span>
      </Link>

      {/* Stats grid */}
      <div
        ref={statsRef}
        style={{
          gap: 40,
          borderTop: "1px solid rgba(13,13,13,0.12)",
          paddingTop: 40,
          marginTop: 60,
        }}
        className="grid grid-cols-2 sm:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCounter key={stat.label} stat={stat} triggered={triggered} />
        ))}
      </div>
    </section>
  );
}
