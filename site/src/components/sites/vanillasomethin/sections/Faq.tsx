import { FAQ } from "../data";
import { Reveal } from "../primitives/Reveal";
import { FAQ_ANSWER_TEXT } from "./faq/answers";
import { FaqItem } from "./faq/FaqItem";

/**
 * Section - FAQ (z 3, part of the footer curtain stack). Desktop: two 680px columns, gap 40;
 * the left heading is sticky at top 40px while the 10 accordion items scroll past.
 * Mobile: heading stacked above the list. Serial numbers keep the source quirk (08 x3).
 */
export function Faq() {
  return (
    <section
      data-section="faq"
      className="vs-frame relative z-[3] bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <div className="flex w-full flex-col items-start gap-10 min-[810px]:flex-row">
        <div className="relative z-[1] flex w-full flex-col items-start gap-5 min-[810px]:sticky min-[810px]:top-10 min-[810px]:flex-1">
          <Reveal className="w-full">
            <h2 className="vs-h5 text-vs-muted">{FAQ.label}</h2>
          </Reveal>
          <Reveal className="w-full min-[810px]:w-[400px]">
            <p className="vs-body text-vs-fg">
              {FAQ.intro[0]}
              <br />
              {FAQ.intro[1]}
            </p>
          </Reveal>
        </div>
        <div className="flex w-full flex-col min-[810px]:flex-1">
          {FAQ.items.map((item, i) => (
            <FaqItem key={i} serial={item.n} question={item.q} answer={FAQ_ANSWER_TEXT[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}
