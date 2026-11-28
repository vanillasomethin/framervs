import type { ReactNode } from "react";
import { SERVICES } from "../data";
import { Reveal } from "../primitives/Reveal";
import { SectionHeader } from "../primitives/SectionHeader";
import { ServiceTicker } from "./services/ServiceTicker";

type Service = (typeof SERVICES.items)[number];

/**
 * Services (#section-awards). 12 rows; the list slides in from x 400 (spring .8s bounce .2).
 * Row = fg-coloured base (the hover colour) + ticker behind + bg-coloured content layer on top.
 * Desktop hover fades the content layer out (~0.4s), revealing the fg row and the running ticker.
 * Mobile (<810): 48px rows with 20px gaps, 16px titles that wrap, no ticker.
 */
export function Services() {
  return (
    <section
      id="section-awards"
      className="vs-frame relative z-[2] flex flex-col items-center gap-10 overflow-hidden bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <SectionHeader label={SERVICES.label}>
        <p>{SERVICES.intro}</p>
      </SectionHeader>
      <Reveal
        className="flex w-full flex-col gap-5 min-[810px]:gap-0"
        from={{ opacity: 0, x: 400 }}
        duration={0.8}
        bounce={0.2}
        delay={0}
        amount={0.08}
      >
        {SERVICES.items.map((item) => (
          <ServiceRow key={item.n} item={item} />
        ))}
      </Reveal>
    </section>
  );
}

function ServiceRow({ item }: { item: Service }) {
  const content: ReactNode = (
    <>
      <ServiceTicker text={item.ticker} image={item.image} />
      <div className="relative z-[1] flex min-h-12 w-full items-center justify-between gap-1 bg-vs-bg px-2 py-3 transition-opacity duration-[400ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-0 after:pointer-events-none after:absolute after:inset-0 after:border-b after:border-vs-fg min-[810px]:min-h-[60px] min-[810px]:gap-0">
        <p className="vs-body shrink-0 text-center whitespace-pre text-vs-fg">{item.n}</p>
        <p className="min-w-0 flex-[1_0_0px] text-center font-grotesk text-base leading-6 font-medium whitespace-pre-wrap text-vs-fg uppercase min-[810px]:text-2xl min-[810px]:leading-9">
          {item.title}
        </p>
        <p className="vs-body shrink-0 text-center whitespace-pre text-vs-fg">{item.tag}</p>
      </div>
    </>
  );
  const cls = "group relative flex w-full flex-col overflow-hidden bg-vs-fg";
  return item.href ? (
    <a href={item.href} target="_blank" rel="noopener" className={cls}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}
