import { Cursor } from "@/components/sites/vanillasomethin/Cursor";
import { SiteFooter } from "@/components/sites/vanillasomethin/SiteFooter";
import { SiteHeader } from "@/components/sites/vanillasomethin/SiteHeader";
import { SmoothScroll } from "@/components/sites/vanillasomethin/SmoothScroll";
import { Collaboration } from "@/components/sites/vanillasomethin/sections/Collaboration";
import { About } from "@/components/sites/vanillasomethin/sections/About";
import { Contact } from "@/components/sites/vanillasomethin/sections/Contact";
import { DesignPhilosophy } from "@/components/sites/vanillasomethin/sections/DesignPhilosophy";
import { Faq } from "@/components/sites/vanillasomethin/sections/Faq";
import { Hero } from "@/components/sites/vanillasomethin/sections/Hero";
import { Process } from "@/components/sites/vanillasomethin/sections/Process";
import { Services } from "@/components/sites/vanillasomethin/sections/Services";
import { Team } from "@/components/sites/vanillasomethin/sections/Team";
import { VideoSection } from "@/components/sites/vanillasomethin/sections/VideoSection";
import { Works } from "@/components/sites/vanillasomethin/sections/Works";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <main className="relative">
        <SiteHeader />
        <Hero />
        <About />
        <DesignPhilosophy />
        <Works />
        <Services />
        <VideoSection />
        <Process />
        <Team />
        <Faq />
        <Contact />
        <SiteFooter />
        <Collaboration />
      </main>
    </>
  );
}
