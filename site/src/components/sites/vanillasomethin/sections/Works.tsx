import { WORKS } from "../data";
import { OutlineButton } from "../primitives/OutlineButton";
import { SectionHeader } from "../primitives/SectionHeader";
import { WorkCard } from "./works/WorkCard";

/**
 * Selected Works (#section-works): header, 20px gap, a 2-column grid (1 column under 810px)
 * of 10 cards with 20px gaps, then VIEW ALL centred 40px below. No bottom padding.
 * The live source shows no entrance animation on the cards (every ancestor stays opacity 1 /
 * transform none while scrolling in), so none is applied here.
 */
export function Works() {
  return (
    <section id="section-works" className="vs-frame relative z-[2] bg-vs-bg px-5 pt-[60px] min-[810px]:pt-[120px]">
      <SectionHeader label={WORKS.label}>
        <p>
          {WORKS.intro[0]}
          <br />
          {WORKS.intro[1]}
        </p>
      </SectionHeader>

      <div className="mt-5 grid grid-cols-1 gap-5 min-[810px]:grid-cols-2">
        {WORKS.items.map((work) => (
          <WorkCard key={work.href} work={work} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <OutlineButton href={WORKS.viewAll.href}>{WORKS.viewAll.label}</OutlineButton>
      </div>
    </section>
  );
}
