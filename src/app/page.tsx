import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { DesignPhilosophySection } from "@/components/DesignPhilosophySection";
import { WorksSection } from "@/components/WorksSection";
import { ServicesSection } from "@/components/ServicesSection";
import VideoSection from "@/components/VideoSection";
import ProcessSection from "@/components/ProcessSection";
import TeamSection from "@/components/TeamSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <AboutSection />
        <DesignPhilosophySection />
        <WorksSection />
        <ServicesSection />
        <VideoSection />
        <ProcessSection />
        <TeamSection />
        <FAQSection />
        <ContactSection />
      </main>
    </>
  );
}
