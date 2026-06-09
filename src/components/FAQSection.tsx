"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How do I start a project with you?",
    a: "Reach out via our contact form or email hello@vanillasometh.in with a brief description of your project. We'll schedule an introductory call to understand your vision and see if we're a good fit.",
  },
  {
    q: "Do you handle execution as well?",
    a: "Yes — we offer design supervision and site coordination through construction. Our involvement ensures the design intent is faithfully executed.",
  },
  {
    q: "How much will my project cost?",
    a: "Costs vary widely depending on project type, size, location, and quality of finishes. Our estimator tool gives a rough range. For a precise quote, contact us with your brief.",
  },
  {
    q: "Can you work within my budget?",
    a: "Absolutely. We're experienced at designing beautifully within constraints. Share your budget upfront and we'll tailor our approach accordingly.",
  },
  {
    q: "What affects the cost the most?",
    a: "Site complexity, material choices, scope of services (design-only vs. full execution), and finishing quality are the biggest cost drivers.",
  },
  {
    q: "Do I need a design team? Why not just hire a contractor?",
    a: "A design team brings vision, coordination, and problem-solving that contractors aren't trained for. We ensure the end result matches the intent — not just the drawing.",
  },
  {
    q: "Do you help with materials + contractors?",
    a: "Yes — we provide material specifications, help with contractor selection, and coordinate between trades to keep the project on track.",
  },
  {
    q: "How long will the project take?",
    a: "Timelines depend on project size and complexity. A residential interior typically takes 2–4 months for design and 3–6 months for execution. We'll give a detailed timeline in the proposal.",
  },
  {
    q: "Can we work together remotely?",
    a: "Absolutely. We've worked with clients across India and internationally. Video calls, cloud collaboration, and regular updates keep things running smoothly.",
  },
  {
    q: "What's your fee structure?",
    a: "We typically charge a fixed design fee or a percentage of project cost, depending on scope. Full transparency — no surprise charges. Detailed in our proposal.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      style={{
        background: "#ebe8e5",
        padding: "80px 40px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4d4d4d",
        }}
      >
        [FREQUENTLY ASKED QUESTIONS]
      </span>
      <p
        style={{
          fontSize: "16px",
          color: "#4d4d4d",
          maxWidth: "600px",
          lineHeight: 1.6,
          margin: "16px 0 48px",
        }}
      >
        If you&apos;re curious about how we work, timelines, budgets, or what
        to expect when you start a project with us — this is a good place to
        begin. No jargon. No over-complication. Just straight answers.
      </p>

      <div style={{ borderTop: "1px solid rgba(13,13,13,0.12)" }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{ borderBottom: "1px solid rgba(13,13,13,0.12)" }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  width: "100%",
                  padding: "22px 0",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#adadad",
                    minWidth: "28px",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#0d0d0d",
                    flex: 1,
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#adadad",
                    lineHeight: 1,
                  }}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.25s ease",
                }}
              >
                <div style={{ minHeight: 0, overflow: "hidden" }}>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4d4d4d",
                      lineHeight: 1.7,
                      padding: "0 0 20px 48px",
                      maxWidth: "700px",
                      margin: 0,
                    }}
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
