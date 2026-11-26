"use client";

import { motion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { PHILOSOPHY } from "../data";
import { SectionHeader } from "../primitives/SectionHeader";
import { PhilosophyItem } from "./philosophy/PhilosophyItem";

const MOBILE_QUERY = "(max-width: 809px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;

/**
 * Design Philosophy (#section-photography).
 * Header row, then a 4-item accordion 20px below. Desktop: the list is 80% wide (1120 of 1400)
 * and right-aligned, sliding in from x 200 (spring bounce .2) as it enters; all items closed.
 * Mobile: full-bleed list, no slide-in, item 01 open by default. One item open at a time;
 * clicking the open item closes it.
 */
export function DesignPhilosophy() {
  // "default" = untouched: mobile shows item 01 open, desktop all closed (source defaults).
  const [choice, setChoice] = useState<number | null | "default">("default");
  const mobile = useSyncExternalStore(subscribe, getMobile, () => false);
  const open = choice === "default" ? (mobile ? 0 : null) : choice;

  const rest = { opacity: 1, x: 0 };

  return (
    <section
      id="section-photography"
      className="vs-frame relative z-[2] bg-vs-bg px-5 pt-[60px] pb-10 min-[810px]:pt-[120px] min-[810px]:pb-[100px]"
    >
      <SectionHeader label={PHILOSOPHY.label}>
        <p>{PHILOSOPHY.intro}</p>
      </SectionHeader>

      <motion.div
        className="-mx-5 mt-5 min-[810px]:mx-0 min-[810px]:ml-auto min-[810px]:w-[80%]"
        initial={{ opacity: 0, x: 200 }}
        animate={mobile ? { ...rest, transition: { duration: 0 } } : undefined}
        whileInView={mobile ? undefined : { ...rest, transition: { type: "spring", duration: 0.8, bounce: 0.2 } }}
        viewport={{ once: true, amount: 0.2 }}
      >
        {PHILOSOPHY.items.map((item, i) => (
          <PhilosophyItem
            key={item.n}
            item={item}
            open={open === i}
            onToggle={() => setChoice(open === i ? null : i)}
          />
        ))}
      </motion.div>
    </section>
  );
}
