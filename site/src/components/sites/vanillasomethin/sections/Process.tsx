import Image from "next/image";
import { PROCESS } from "../data";
import { Reveal } from "../primitives/Reveal";
import { SectionHeader } from "../primitives/SectionHeader";

type Step = (typeof PROCESS.steps)[number];

/**
 * Process / Get Started. Desktop: cards 1120 wide, right-aligned in the 1400 content box
 * (x=300), number right, 400x520 image + 700-wide text column (title top, paragraph bottom).
 * Mobile: number (Inter 300 20 muted) right, 350x180 image, h5 title, paragraph.
 * Each card enters from y400 (spring bounce 0, 1s; first card delay .5, threshold 0).
 */
export function Process() {
  return (
    <section
      id="section-process"
      className="vs-frame relative z-[2] flex flex-col gap-10 overflow-hidden bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <SectionHeader label={PROCESS.label}>{PROCESS.intro}</SectionHeader>
      <div className="flex w-full flex-col gap-5 min-[810px]:gap-10">
        {PROCESS.steps.map((step, i) => (
          <Reveal
            key={step.n}
            className="w-full min-[810px]:ml-auto min-[810px]:max-w-[1120px]"
            from={{ opacity: 0, y: 400 }}
            duration={1}
            bounce={0}
            delay={i === 0 ? 0.5 : 0}
            amount={0}
          >
            <ProcessCard step={step} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ProcessCard({ step }: { step: Step }) {
  return (
    <article className="flex flex-col gap-5 overflow-hidden border-b border-vs-fg pb-5 min-[810px]:pb-10">
      <div className="flex justify-end">
        <span className="font-inter text-[20px] leading-[30px] font-light text-vs-muted min-[810px]:hidden">
          {step.n}
        </span>
        <h5 className="vs-h5 text-vs-fg max-[809px]:hidden">{step.n}</h5>
      </div>
      <div className="flex flex-col gap-5 min-[810px]:flex-row">
        <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-lg min-[810px]:h-[520px] min-[810px]:w-[400px]">
          <Image
            src={step.image}
            alt={step.title}
            fill
            sizes="(min-width: 810px) 400px, 100vw"
            className="object-cover"
            draggable={false}
          />
        </div>
        <div className="flex flex-col gap-5 overflow-hidden min-[810px]:h-[524px] min-[810px]:flex-1 min-[810px]:justify-between min-[810px]:gap-0">
          <h3 className="vs-h5 text-vs-fg min-[810px]:hidden">{step.title}</h3>
          <h3 className="vs-h3 text-vs-fg max-[809px]:hidden">{step.title}</h3>
          <p className="vs-body text-vs-fg min-[810px]:max-w-[400px]">{step.body}</p>
        </div>
      </div>
    </article>
  );
}
