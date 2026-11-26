import type { Metadata } from "next";
import { Cursor } from "@/components/sites/vanillasomethin/Cursor";
import { ContactFormSection } from "@/components/sites/vanillasomethin/contact/ContactFormSection";
import { NetlifyFormDetection } from "@/components/sites/vanillasomethin/contact/ContactForm";
import { ContactHero } from "@/components/sites/vanillasomethin/contact/ContactHero";
import { SiteFooter } from "@/components/sites/vanillasomethin/SiteFooter";
import { SiteHeader } from "@/components/sites/vanillasomethin/SiteHeader";
import { SmoothScroll } from "@/components/sites/vanillasomethin/SmoothScroll";
import { Contact } from "@/components/sites/vanillasomethin/sections/Contact";
import { Faq } from "@/components/sites/vanillasomethin/sections/Faq";

export const metadata: Metadata = {
  title: "Contact Our Mangalore Architecture Studio | Vanilla & Somethin'",
  description:
    "Get in touch with Vanilla & Somethin', an architecture and interior design studio in Mangalore and Riyadh. Tell us about your idea, your vision, or just say hi.",
};

export default function ContactPage() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <NetlifyFormDetection />
      <main className="relative">
        <SiteHeader hashBase="/" />
        <ContactHero />
        <ContactFormSection />
        <Faq />
        <Contact />
        <SiteFooter />
      </main>
    </>
  );
}
