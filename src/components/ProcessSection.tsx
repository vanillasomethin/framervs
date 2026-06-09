const steps = [
  {
    number: "01",
    title: "Connect",
    desc: "Share your project goals, vision, and requirements. A quick email or call helps us understand what you're looking to create.",
  },
  {
    number: "02",
    title: "Define",
    desc: "We discuss your needs, develop a tailored proposal, and outline the scope, timeline, and deliverables — ensuring full clarity before we begin.",
  },
  {
    number: "03",
    title: "Design",
    desc: "Through research, sketches, and 3D visualization, ideas evolve into tangible design concepts. You'll see your vision take form with each iteration.",
  },
  {
    number: "04",
    title: "Deliver",
    desc: "We finalize drawings, coordinate execution, and stay involved through completion — ensuring the design is built true to intent.",
  },
];

export default function ProcessSection() {
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
          textTransform: "uppercase" as const,
          color: "#4d4d4d",
        }}
      >
        [GET STARTED]
      </span>
      <p
        style={{
          fontSize: "16px",
          color: "#4d4d4d",
          maxWidth: "480px",
          lineHeight: 1.6,
          margin: "16px 0 0",
        }}
      >
        A simple, transparent process that turns your ideas into built reality
        — step by step.
      </p>

      <div
        className="process-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "40px",
          borderTop: "1px solid rgba(13,13,13,0.12)",
          paddingTop: "48px",
          marginTop: "60px",
        }}
      >
        {steps.map((step) => (
          <div key={step.number}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#adadad",
                display: "block",
                marginBottom: "16px",
              }}
            >
              {step.number}
            </span>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0d0d0d",
                marginBottom: "12px",
                margin: "0 0 12px",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4d4d4d",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .process-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 540px) {
          .process-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
