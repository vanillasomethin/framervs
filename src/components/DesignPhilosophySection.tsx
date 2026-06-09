"use client";

import { useState } from "react";
import Image from "next/image";

interface PhilosophyItem {
  number: string;
  title: string;
  body: string;
  image: string;
}

const items: PhilosophyItem[] = [
  {
    number: "01",
    title: "Unbounded Realities",
    body: "We believe architecture is not bound by walls or drawings but by the human eye that beholds it. Each space is a lived poem — formed from memory, instinct, and imagination. We design to awaken what already exists, to stretch perception beyond the seen.",
    image:
      "https://framerusercontent.com/images/4ozF3bX5xrkGtsuXbDNpNTS7Bs.jpg",
  },
  {
    number: "02",
    title: "Beyond the Measured Line",
    body: "Precision guides us, but not as a cage. We draw not to restrict, but to reveal — the silence between proportions, the dialogue between material and light. Every line holds a question; every shadow, an answer.",
    image:
      "https://framerusercontent.com/images/fmDMsww9kNQtwrweYpGqgMtmkjk.jpg",
  },
  {
    number: "03",
    title: "The Dialogue of Balance",
    body: "To design is to converse — between wildness and order, chaos and control, intuition and method. Like a steady rain, or a story told beneath a tree, each project finds its rhythm in balance — never static, always alive.",
    image:
      "https://framerusercontent.com/images/utllKwemXVBHvKDDsgn8RNhB0.jpg",
  },
  {
    number: "04",
    title: "Human Reverence",
    body: "Design begins where ego ends. We craft spaces that honour the human body — its pace, its breath, its need for belonging. Architecture, for us, is a gesture of humility — a place that receives, rather than commands.",
    image:
      "https://framerusercontent.com/images/Q8bmHzZaQIQyELQ0wK4xVmHx0I.jpg",
  },
];

export function DesignPhilosophySection() {
  const [activeIndex, setActiveIndex] = useState(0);

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
        [DESIGN PHILOSOPHY]
      </div>

      {/* Intro text */}
      <p
        style={{
          fontSize: 16,
          color: "#4d4d4d",
          maxWidth: 480,
          lineHeight: 1.6,
          margin: "16px 0 48px",
        }}
      >
        Our practice shifts between experimentation and restraint — exploring
        how spaces can feel intuitive yet deliberate, raw yet refined. The goal
        is simple: to make design that breathes and belongs.
      </p>

      {/* Accordion container */}
      <div
        style={{
          borderTop: "1px solid rgba(13,13,13,0.12)",
        }}
      >
        {items.map((item, index) => {
          const isOpen = activeIndex === index;
          return (
            <div
              key={item.number}
              style={{
                borderBottom: "1px solid rgba(13,13,13,0.12)",
              }}
            >
              {/* Trigger */}
              <button
                onClick={() => setActiveIndex(index)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 24,
                  width: "100%",
                  padding: "24px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                aria-expanded={isOpen}
              >
                {/* Number */}
                <span
                  style={{
                    fontFamily: "var(--font-fragment-mono)",
                    fontSize: 12,
                    color: "#adadad",
                    minWidth: 28,
                  }}
                >
                  {item.number}
                </span>

                {/* Title */}
                <span
                  style={{
                    fontSize: "clamp(18px, 2vw, 26px)",
                    fontWeight: isOpen ? 700 : 500,
                    color: "#0d0d0d",
                    flex: 1,
                    transition: "font-weight 0.15s ease",
                  }}
                >
                  {item.title}
                </span>

                {/* Icon */}
                <span
                  style={{
                    fontSize: 20,
                    color: "#adadad",
                    marginLeft: "auto",
                    lineHeight: 1,
                  }}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* Animated content */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.35s ease",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  {/* Body text */}
                  <p
                    style={{
                      fontSize: 16,
                      color: "#4d4d4d",
                      lineHeight: 1.7,
                      maxWidth: 560,
                      padding: "0 0 32px 52px",
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>

                  {/* Image */}
                  <div
                    style={{
                      margin: "0 0 32px 52px",
                      width: 480,
                      maxWidth: "100%",
                    }}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={480}
                      height={280}
                      unoptimized
                      style={{
                        objectFit: "cover",
                        borderRadius: 2,
                        width: 480,
                        height: 280,
                        maxWidth: "100%",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
