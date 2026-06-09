"use client";

import Image from "next/image";

const tickerText =
  "A R C H I T E C T S .   D E S I G N E R S .   V I S I O N A R I E S   ";

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        paddingTop: "80px",
      }}
    >
      {/* Top area: tagline + CTA */}
      <div
        style={{
          padding: "40px 40px 0",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "clamp(40px, 5.5vw, 96px)",
            fontWeight: 700,
            color: "#ebe8e5",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          P U R E . P L A Y F U L . P U R P O S E F U L
        </h1>

        <button
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#ebe8e5",
            border: "1px solid rgba(235,232,229,0.35)",
            padding: "11px 22px",
            background: "transparent",
            transition: "background 0.2s",
            borderRadius: "2px",
            cursor: "pointer",
            alignSelf: "flex-start",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(235,232,229,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          BOOK A CONSULTATION
        </button>
      </div>

      {/* Middle images area */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: "420px",
          margin: "40px 0",
        }}
      >
        {/* Image 1 — portrait, left-center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-220px, -50%)",
            width: "300px",
            height: "400px",
            zIndex: 1,
          }}
        >
          <Image
            src="https://framerusercontent.com/images/o3gmJ2YSEg2cCrqtvEIlwv5AY.jpg"
            alt="Architectural space"
            fill
            unoptimized
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Image 2 — landscape, center (slightly lower) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-80px, -40%)",
            width: "400px",
            height: "280px",
            zIndex: 2,
          }}
        >
          <Image
            src="https://framerusercontent.com/images/w9XwtveeBOu7c3GZOxpMad45vLE.jpg"
            alt="Design detail"
            fill
            unoptimized
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Image 3 — portrait, right-center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(160px, -55%)",
            width: "280px",
            height: "360px",
            zIndex: 3,
          }}
        >
          <Image
            src="https://framerusercontent.com/images/CEKXi1dH5VIjMKAoLqwbAv5liQ.jpg"
            alt="Interior vision"
            fill
            unoptimized
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Bottom ticker */}
      <div
        style={{
          borderTop: "1px solid rgba(235,232,229,0.12)",
          padding: "16px 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "marquee 25s linear infinite",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#adadad",
              whiteSpace: "nowrap",
            }}
          >
            {tickerText}
            {tickerText}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
