import type { Metadata } from "next";
import { Cursor } from "@/components/sites/vanillasomethin/Cursor";
import { SiteFooter } from "@/components/sites/vanillasomethin/SiteFooter";
import { SiteHeader } from "@/components/sites/vanillasomethin/SiteHeader";
import { SmoothScroll } from "@/components/sites/vanillasomethin/SmoothScroll";
import { Contact } from "@/components/sites/vanillasomethin/sections/Contact";
import { Team } from "@/components/sites/vanillasomethin/sections/Team";
import { TeamHero } from "@/components/sites/vanillasomethin/team/TeamHero";

export const metadata: Metadata = {
  title: "Our Architects & Designers | Vanilla & Somethin' Team",
  description: "Meet Ar. Hisham Khalid, Ar. Zeba Ali Khan and the Vanilla & Somethin' team.",
};

/** /team.html: the two principal architects (the homepage's team carousel) and a way to get in touch. */
export default function TeamPage() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <main className="relative">
        <SiteHeader hashBase="/" />
        <TeamHero />
        <Team />
        <Contact />
        <SiteFooter />
      </main>
    </>
  );
}
