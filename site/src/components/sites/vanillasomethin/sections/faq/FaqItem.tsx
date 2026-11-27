"use client";

import { animate, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { PlusIcon } from "../../primitives/PlusIcon";

/** Height/rotation spring sampled on the live page: 69 -> 161px reached at ~210ms, 1px overshoot, settled ~380ms. */
const TOGGLE_SPRING = { type: "spring", duration: 0.4, bounce: 0.2 } as const;
/** Desktop scroll-in: each item slides from x+400 with opacity 0 once half of it is visible (mobile items do not animate). */
const REVEAL_SPRING = { type: "spring", duration: 0.6, bounce: 0.2 } as const;

export function FaqItem({ serial, question, answer }: { serial: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const answerId = useId();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const desktop = window.matchMedia("(min-width: 810px)");
    if (!desktop.matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        animate(el, { x: [400, 0], opacity: [0, 1] }, REVEAL_SPRING);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // Hidden start state comes from CSS (desktop only) so there is no flash before hydration;
    // motion's inline transform/opacity override it once the item scrolls in.
    <div ref={rootRef} className="w-full min-[810px]:opacity-0 min-[810px]:[transform:translateX(400px)]">
      <div
        className="relative flex w-full cursor-pointer flex-col p-5 transition-[background-color] duration-200 ease-out hover:bg-[rgba(77,77,77,0.06)]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex w-full items-start gap-5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={answerId}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-5 text-left outline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-vs-fg"
          >
            <span className="vs-body shrink-0 text-vs-fg">{serial}</span>
            <h5 className="vs-h5 min-w-0 flex-1 text-vs-fg">{question}</h5>
          </button>
          <motion.span
            aria-hidden="true"
            className="block shrink-0"
            initial={false}
            animate={{ rotate: open ? 45 : 0 }}
            transition={TOGGLE_SPRING}
          >
            <PlusIcon className="!transition-none" />
          </motion.span>
        </div>
        <motion.div
          id={answerId}
          role="region"
          className="overflow-hidden"
          initial={false}
          animate={{ height: open ? "auto" : 0 }}
          transition={TOGGLE_SPRING}
        >
          {/* Answer column is aligned with the question (serial 16px + gap 20px); 20px gap under the question.
              On close the text is dropped at once while the height springs shut, as on the source. */}
          <p
            className={`vs-body whitespace-pre-wrap break-words pt-5 pl-9 pr-[34px] text-vs-fg ${open ? "visible" : "invisible"}`}
          >
            {answer}
          </p>
        </motion.div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-vs-muted opacity-10" />
      </div>
    </div>
  );
}
