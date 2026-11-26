import { Reveal } from "../primitives/Reveal";
import { ContactDetails } from "./ContactDetails";
import { ContactForm } from "./ContactForm";

/**
 * Section - Form. Desktop/tablet: two equal columns, gap 40 (padding 100x20 / 100x40).
 * Mobile: stacked, padding 40x20. Each column scales in from 0.5 with a fade on view.
 */
export function ContactFormSection() {
  return (
    <section
      id="section-form"
      className="vs-frame relative z-[3] bg-vs-bg px-5 py-10 min-[810px]:px-10 min-[810px]:py-[100px] min-[1440px]:px-5"
    >
      <div className="flex w-full flex-col gap-10 min-[810px]:flex-row min-[810px]:items-start">
        <Reveal from={{ opacity: 0, scale: 0.5 }} duration={0.6} delay={0.1} amount={0.2} className="w-full min-[810px]:flex-1">
          <ContactDetails />
        </Reveal>
        <Reveal from={{ opacity: 0, scale: 0.5 }} duration={0.6} delay={0.1} amount={0.2} className="w-full min-[810px]:flex-1">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
