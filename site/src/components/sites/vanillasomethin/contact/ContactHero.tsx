import { CONTACT_PAGE } from "../data-contact";
import { CharReveal } from "../primitives/CharReveal";

/**
 * Section - Hero: "GET IN TOUCH", centred, per-character blur-in on mount.
 * Padding 100 (desktop) / 100x40 (tablet) / 100x20 (mobile); heading 96 / 68 / 44, line-height 1.3.
 */
export function ContactHero() {
  return (
    <section
      id="section-hero"
      className="vs-frame relative z-[3] bg-vs-bg px-5 py-[100px] min-[810px]:px-10 min-[1440px]:px-[100px]"
    >
      <CharReveal
        as="h1"
        trigger="mount"
        text={CONTACT_PAGE.headline}
        className="w-full text-center font-grotesk text-[44px] leading-[1.3] font-bold tracking-[0.01em] text-vs-inverse uppercase min-[810px]:text-[68px] min-[1440px]:text-[96px]"
      />
    </section>
  );
}
