import { CONTACT } from "../data";
import { CharReveal } from "../primitives/CharReveal";
import { OutlineButton } from "../primitives/OutlineButton";
import { Reveal } from "../primitives/Reveal";

/**
 * Section - Contact (z 2, last opaque layer over the sticky footer curtain).
 * Desktop: padding 100/20, headline 96/124.8 (3 lines), 20px gap, sentence, 32px gap, button.
 * Mobile: padding 40/20, headline 36/46.8 with a forced break after "Big plans?".
 * Headline: per-character blur-in on view (CharReveal), rendered uppercase as the screenshots show.
 */
export function Contact() {
  const [first, ...rest] = CONTACT.headline.split("? ");
  const lineOne = `${first}?`;
  const remainder = rest.join("? ");
  const headlineClass =
    "w-full text-center font-grotesk text-[36px] leading-[1.3] font-bold tracking-[0.01em] text-vs-inverse uppercase min-[810px]:text-[96px]";

  return (
    <section
      data-section="contact"
      className="vs-frame relative z-[2] flex flex-col items-center gap-8 bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <div className="flex w-full flex-col items-center gap-5">
        {/* Desktop: one flowing paragraph (wraps to 3 lines in 1400px). */}
        <CharReveal as="h2" text={CONTACT.headline} className={`${headlineClass} max-[809px]:hidden`} />
        {/* Mobile: the source breaks after "Big plans?". */}
        <h2 className={`${headlineClass} min-[810px]:hidden`} aria-label={CONTACT.headline}>
          <CharReveal as="span" text={lineOne} className="block" />
          <CharReveal as="span" text={remainder} className="block" stagger={0.05} delay={lineOne.length * 0.05} />
        </h2>
        {/* Mobile: the source keeps the sentence on one line in a 700px box centred on the 350px column. */}
        <div className="flex w-full justify-center">
          <p className="vs-body shrink-0 whitespace-nowrap text-center text-vs-fg min-[810px]:w-full min-[810px]:shrink min-[810px]:whitespace-normal">
            {CONTACT.text}
          </p>
        </div>
      </div>
      <Reveal>
        <OutlineButton href={CONTACT.cta.href}>{CONTACT.cta.label}</OutlineButton>
      </Reveal>
    </section>
  );
}
