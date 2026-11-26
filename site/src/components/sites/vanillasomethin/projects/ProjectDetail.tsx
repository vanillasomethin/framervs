import Image from "next/image";
import type { GalleryImage, Project } from "../data-projects";
import { Reveal } from "../primitives/Reveal";
import { Marquee } from "./Marquee";
import { OtherProjectCard } from "./OtherProjectCard";
import { PageTitle } from "./PageTitle";
import { ParallaxImage } from "./ParallaxImage";
import { RichText } from "./RichText";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="vs-body text-vs-fg">{label}</p>
      <h5 className="vs-h5 text-vs-fg">{value}</h5>
    </div>
  );
}

/** Gallery tile with the source's scroll reveal (fades in while unfolding from a tilted, small card). */
function GalleryTile({ image, alt, className }: { image: GalleryImage; alt: string; className: string }) {
  return (
    <Reveal
      from={{ opacity: 0, scale: 0.2, rotateX: 80 }}
      perspective={1200}
      duration={1}
      bounce={0.1}
      delay={0}
      amount={0.1}
      className={`relative overflow-hidden ${className}`}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        loading="lazy"
        sizes="(max-width: 809px) 100vw, 1400px"
        className="object-cover"
        style={image.position ? { objectPosition: image.position } : undefined}
      />
    </Reveal>
  );
}

/**
 * /project-showcase/<slug>/ - the CMS template:
 * Hero (title + description) -> parallax cover -> [OVERVIEW] year/category/client/location ->
 * wide image + [BEHIND THE DESIGN] rich text -> gallery (full, half, half, full, full) ->
 * OTHER PROJECT ticker with two project cards.
 */
export function ProjectDetail({ project, others }: { project: Project; others: Project[] }) {
  const [g1, g2, g3, ...rest] = project.gallery;

  return (
    <>
      {/* Hero + overview */}
      <section className="vs-frame px-5 pt-[97px] min-[810px]:pt-[76px] min-[1200px]:pt-[100px]">
        <PageTitle text={project.name} />
        <Reveal trigger="mount" delay={0.2} className="mx-auto mt-5 w-full text-center min-[810px]:w-[600px]">
          <p className="vs-body text-vs-fg">{project.description}</p>
        </Reveal>

        <div className="mt-10 min-[810px]:mt-20">
          <ParallaxImage src={project.cover} alt={project.name} />
        </div>

        <div className="mt-10 flex flex-col gap-5 min-[810px]:flex-row min-[810px]:gap-0">
          <Reveal className="min-[810px]:flex-1">
            <h5 className="vs-h5 text-vs-muted">[OVERVIEW]</h5>
          </Reveal>
          <Reveal className="flex flex-col gap-10 min-[810px]:flex-1">
            {/* The CMS overview paragraph; empty for most projects but still spaced, as in the source. */}
            <p className="vs-body text-vs-fg">{project.overview ?? ""}</p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-10">
              <Field label="Year" value={project.year} />
              <Field label="Category" value={project.category} />
              <Field label="Client" value={project.client} />
              <Field label="Location" value={project.location} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Behind the design */}
      <section className="vs-frame px-5 pt-20 min-[810px]:pt-[100px]">
        <div className="relative h-[400px] w-full overflow-hidden min-[810px]:h-[600px]">
          <Image src={project.behindImage} alt="" fill loading="lazy" sizes="(max-width: 1440px) 100vw, 1400px" className="object-cover" />
        </div>
        <div className="mt-10 flex flex-col gap-5 min-[810px]:gap-10 min-[1200px]:flex-row min-[1200px]:gap-5">
          <Reveal className="min-[1200px]:flex-1">
            <h5 className="vs-h5 text-vs-muted">[BEHIND THE DESIGN]</h5>
          </Reveal>
          <Reveal className="w-full min-[1200px]:w-[680px] min-[1200px]:shrink-0">
            <RichText nodes={project.behind} />
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section className="vs-frame px-5 pt-20 min-[810px]:pt-[100px]">
        <div className="grid grid-cols-1 gap-5 min-[810px]:grid-cols-2">
          {g1 ? <GalleryTile image={g1} alt={`${project.name} 1`} className="h-[440px] min-[810px]:col-span-2 min-[810px]:h-[607px]" /> : null}
          {g2 ? <GalleryTile image={g2} alt={`${project.name} 2`} className="h-[1042px]" /> : null}
          {g3 ? <GalleryTile image={g3} alt={`${project.name} 3`} className="h-[1042px]" /> : null}
          {rest.map((img, i) => (
            <GalleryTile
              key={img.src + i}
              image={img}
              alt={`${project.name} ${i + 4}`}
              className="h-[400px] min-[810px]:col-span-2 min-[810px]:h-[607px]"
            />
          ))}
        </div>
      </section>

      {/* Other projects */}
      <section className="vs-frame pt-[112px] pb-[60px] min-[810px]:pt-[236px] min-[810px]:pb-[100px]">
        <Marquee text="Other project" />
        <div className="mt-[72px] grid grid-cols-1 gap-5 px-10 min-[810px]:mt-20 min-[810px]:grid-cols-2 min-[1200px]:px-5">
          {others.map((p) => (
            <OtherProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>
    </>
  );
}
