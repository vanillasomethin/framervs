export default function VideoSection() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "60vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        src="https://framerusercontent.com/assets/CVfrcDb1myaxy6wASsKtiRWSM.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.55,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "40px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(22px, 4vw, 58px)",
            fontWeight: 700,
            color: "#ebe8e5",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            maxWidth: "900px",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          I CAPTURE MOMENTS THAT CAN&apos;T BE REPEATED.
        </p>
      </div>
    </section>
  );
}
