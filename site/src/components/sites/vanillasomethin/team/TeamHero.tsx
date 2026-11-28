import { CharReveal } from "../primitives/CharReveal";

/**
 * Team page hero, from the team page's own HTML (Framer's runtime drew the homepage
 * over it at /team.html, so visitors never saw it): "TEAM" and one line, centred.
 */
export function TeamHero() {
  return (
    <section
      id="section-hero"
      className="vs-frame relative z-[3] bg-vs-bg px-5 pt-[100px] pb-10 min-[810px]:px-10 min-[1440px]:px-[100px]"
    >
      <CharReveal
        as="h1"
        trigger="mount"
        text="TEAM"
        className="w-full text-center font-grotesk text-[44px] leading-[1.3] font-bold tracking-[0.01em] text-vs-inverse uppercase min-[810px]:text-[68px] min-[1440px]:text-[96px]"
      />
      <p className="vs-body mx-auto mt-6 max-w-[640px] text-center text-vs-fg">
        The architects shaping Vanilla &amp; Somethin’s thoughtful, human-centered spaces.
      </p>
    </section>
  );
}
