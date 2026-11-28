import { TEAM } from "../data";
import { Reveal } from "../primitives/Reveal";
import { SectionHeader } from "../primitives/SectionHeader";
import { TeamCarousel, type TeamSlide } from "./team/TeamCarousel";

const IMG = "/sites/vanillasomethin/images";
const [hisham, zeba] = TEAM.slides;

/**
 * The phone variant of the source slideshow is a different component: three slides
 * (Hisham, Zeba, Hisham) with taller portraits cropped from the top, and white circle
 * PNG arrows. Assets fetched from the live page (see report; not yet in asset-map.md).
 */
const MOBILE_SLIDES: TeamSlide[] = [
  { ...hisham, image: `${IMG}/team-mobile-1-hisham.webp`, objectPosition: "50% 0%" },
  { ...zeba, image: `${IMG}/team-mobile-2-zeba.webp`, objectPosition: "50% 0%" },
  { ...hisham, image: `${IMG}/team-mobile-1-hisham.webp`, objectPosition: "50% 0%" },
];

/**
 * Meet the Team (#section-testimonials). Header + an infinite, draggable slideshow
 * (desktop 800x743, slides 810px apart; mobile 340x505, 350px apart). The carousel block
 * enters from y400 (spring 1s).
 */
export function Team() {
  return (
    <section
      id="section-testimonials"
      className="vs-frame relative z-[2] flex flex-col gap-10 overflow-hidden bg-vs-bg px-5 py-10 min-[810px]:py-[100px]"
    >
      <SectionHeader label={TEAM.label}>{TEAM.intro}</SectionHeader>
      <Reveal from={{ opacity: 0, y: 400 }} duration={1} bounce={0} delay={0} amount={0} className="w-full">
        <TeamCarousel
          className="max-[809px]:hidden"
          label="Meet the team"
          slides={TEAM.slides}
          slideWidth={800}
          height={743}
          imageSize={200}
          arrows={{ back: TEAM.arrows.back, next: TEAM.arrows.next, className: "bg-vs-muted" }}
        />
        <TeamCarousel
          className="min-[810px]:hidden"
          label="Meet the team"
          slides={MOBILE_SLIDES}
          slideWidth={340}
          height={505}
          imageSize={120}
          arrows={{ back: `${IMG}/arrow-back-mobile.webp`, next: `${IMG}/arrow-next-mobile.webp` }}
        />
      </Reveal>
    </section>
  );
}
