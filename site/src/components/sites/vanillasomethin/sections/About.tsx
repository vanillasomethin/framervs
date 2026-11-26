import { ABOUT } from "../data";
import { OutlineButton } from "../primitives/OutlineButton";
import { Reveal } from "../primitives/Reveal";
import { SectionHeader } from "../primitives/SectionHeader";
import { Counter } from "./about/Counter";
import { FloatingImage } from "./about/FloatingImage";
import { TextReveal } from "./about/TextReveal";

/**
 * About: header, sticky word-by-word text reveal with four parallax images, counter rows.
 * The image layer (479 tall) sits at the bottom of the text-reveal block; positions are the
 * source's rest positions (x relative to the 1400/350 content box).
 */
export function About() {
  const img = ABOUT.images;
  return (
    <section
      id="section-about"
      className="vs-frame relative z-[2] flex flex-col gap-10 bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <SectionHeader label={ABOUT.label}>{ABOUT.intro}</SectionHeader>

      <TextReveal
        text={ABOUT.reveal}
        images={
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-[479px] w-full">
            <FloatingImage
              src={img.leftSmall}
              speed={1.3}
              className="bottom-0 left-0 h-[96px] w-[80px] min-[810px]:left-10 min-[810px]:h-[240px] min-[810px]:w-[200px]"
            />
            <FloatingImage
              src={img.leftLarge}
              speed={1.4}
              className="top-0 left-0 h-[114px] w-[100px] min-[810px]:left-10 min-[810px]:h-[320px] min-[810px]:w-[280px]"
            />
            <FloatingImage
              src={img.rightLarge}
              speed={1.4}
              center
              className="top-[234px] right-0 h-[137px] w-[120px] min-[810px]:h-[320px] min-[810px]:w-[280px]"
            />
            <FloatingImage
              src={img.rightSmall}
              speed={1.3}
              className="top-[-220px] right-10 h-[120px] w-[100px] min-[810px]:h-[240px] min-[810px]:w-[200px]"
            />
          </div>
        }
      >
        <Reveal>
          <OutlineButton href={ABOUT.cta.href}>{ABOUT.cta.label}</OutlineButton>
        </Reveal>
      </TextReveal>

      <div className="flex w-full flex-col gap-10">
        {ABOUT.counters.map((c) => (
          <Counter key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}
