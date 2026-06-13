// Home page.
//
// Once you have run `npm run framer:export` and your homepage component lands
// in src/framer/, replace the placeholder below with the real component, e.g.:
//
//   import Home from "../src/framer/home";
//   export default function Page() {
//     return <Home.Responsive />;
//   }
//
// unframer names each file after the Framer component you selected and exposes
// a `.Responsive` variant that switches breakpoints automatically. See
// UNFRAMER_SETUP.md for the exact wiring steps.

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
        background: "#0d0d0d",
        color: "#fff",
        textAlign: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 28, margin: 0 }}>React project ready</h1>
      <p style={{ maxWidth: 520, opacity: 0.7, lineHeight: 1.5 }}>
        Export your Framer components with <code>npm run framer:export</code>,
        then wire them into the pages. See <code>UNFRAMER_SETUP.md</code> for the
        step-by-step.
      </p>
    </main>
  );
}
