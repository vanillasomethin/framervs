export default function TeamSection() {
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
        [MEET THE TEAM]
      </span>
      <p
        style={{
          fontSize: "16px",
          color: "#4d4d4d",
          maxWidth: "540px",
          lineHeight: 1.6,
          margin: "16px 0 48px",
        }}
      >
        We&apos;re a collective of curious minds — architects, designers, and
        builders who thrive on collaboration and thoughtful design.
      </p>

      <div
        className="team-member"
        style={{
          display: "flex",
          gap: "60px",
          alignItems: "flex-start",
        }}
      >
        <img
          src="https://framerusercontent.com/images/moM8ZORfvrX2YbDz00S2V55jZk0.jpg"
          alt="Ar. Hisham Khalid"
          style={{
            width: "260px",
            height: "320px",
            objectFit: "cover",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <blockquote
            style={{
              fontSize: "clamp(15px, 1.5vw, 19px)",
              color: "#0d0d0d",
              lineHeight: 1.7,
              maxWidth: "600px",
              fontStyle: "italic",
              marginBottom: "24px",
              margin: "0 0 24px",
              padding: 0,
            }}
          >
            I believe good design begins by listening — to people, to place,
            and to purpose. Every line we draw should make life better, not
            just look beautiful. At Vanilla &amp; Somethin&apos;, my focus is
            on creating spaces that feel intuitive, grounded, and quietly bold.
          </blockquote>
          <p
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#0d0d0d",
              margin: 0,
            }}
          >
            Ar. Hisham Khalid
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#4d4d4d",
              letterSpacing: "0.04em",
              marginTop: "4px",
              margin: "4px 0 0",
            }}
          >
            Principal Architect / Creative Strategist
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .team-member {
            flex-direction: column !important;
          }
          .team-member img {
            width: 100% !important;
            height: 280px !important;
          }
        }
      `}</style>
    </section>
  );
}
