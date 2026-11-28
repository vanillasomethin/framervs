import { CONTACT_PAGE } from "../data-contact";
import { Reveal } from "../primitives/Reveal";
import { ContactDetails } from "./ContactDetails";
import { ContactForm } from "./ContactForm";

/**
 * Section - Form: one centred column. The intro line and the guided form sit in the middle
 * of the page (max 560px), with the contact details as a centred row of three underneath
 * (stacked on phones).
 */
export function ContactFormSection() {
  return (
    <section
      id="section-form"
      className="vs-frame relative z-[3] bg-vs-bg px-5 py-10 min-[810px]:px-10 min-[810px]:py-[100px]"
    >
      <div className="mx-auto flex w-full flex-col items-center gap-16">
        <Reveal from={{ opacity: 0, scale: 0.5 }} duration={0.6} delay={0.1} amount={0.2} className="w-full max-w-[560px]">
          <p className="vs-body mb-10 text-center text-vs-fg">{CONTACT_PAGE.intro}</p>
          <ContactForm />
        </Reveal>
        <Reveal from={{ opacity: 0, scale: 0.5 }} duration={0.6} delay={0.1} amount={0.2} className="w-full border-t border-vs-fg/20 pt-12">
          <ContactDetails />
        </Reveal>
      </div>
    </section>
  );
}
