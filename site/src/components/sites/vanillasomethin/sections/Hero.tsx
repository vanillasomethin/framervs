import { HERO } from "../data";
import { CharReveal } from "../primitives/CharReveal";
import { OutlineButton } from "../primitives/OutlineButton";
import { Reveal } from "../primitives/Reveal";

// The source ticker is one centred pre-wrap paragraph with runs of spaces between the words.
const TICKER = `${HERO.ticker[0]}             .               ${HERO.ticker[1]}             .          ${HERO.ticker[2]}`;

/**
 * Hero: 90vh, headline + button centred in the padded box, ticker pinned near the bottom
 * (desktop), in flow under the button (tablet), hidden (mobile).
 */
export function Hero() {
  return (
    <section
      id="section-hero"
      className="vs-frame relative z-[3] flex min-h-[90vh] flex-col items-center justify-center gap-10 overflow-x-clip bg-vs-bg px-5 pt-[120px] pb-10 min-[810px]:pt-[140px] min-[810px]:pb-[100px] min-[1440px]:px-[100px]"
    >
      <CharReveal
        as="h1"
        trigger="mount"
        text={HERO.headline}
        className="w-[calc(100%+40px)] text-center font-grotesk text-[58px] leading-[1.1] font-bold tracking-[0.01em] text-vs-inverse min-[810px]:w-full min-[810px]:text-[100px] min-[1440px]:text-[120px]"
      />
      <Reveal trigger="mount" delay={0.8}>
        <OutlineButton href={HERO.cta.href}>{HERO.cta.label}</OutlineButton>
      </Reveal>
      <CharReveal
        trigger="mount"
        delay={0.4}
        text={TICKER}
        className="w-full text-center font-inter text-base leading-6 font-light whitespace-pre-wrap text-vs-fg uppercase max-[809px]:hidden min-[810px]:-mt-5 min-[1440px]:absolute min-[1440px]:mt-0 min-[1440px]:top-[calc(100%-92px)] min-[1440px]:left-0 min-[1440px]:px-5"
      />
    </section>
  );
}
