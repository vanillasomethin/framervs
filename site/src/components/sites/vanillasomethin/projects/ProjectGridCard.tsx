import Image from "next/image";
import { projectHref, type Project } from "../data-projects";

/**
 * Index grid card: cover (359px tall, 341px on phones, radius 8) with the title (h5) and
 * category (Inter 12/18) beneath, side by side from 810px, stacked on phones.
 * Hover: cover zooms, the custom cursor shows VIEW (data-cursor="view").
 */
export function ProjectGridCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  return (
    <a href={projectHref(project.slug)} data-cursor="view" className="group block">
      <div className="relative h-[341px] overflow-hidden rounded-[8px] min-[810px]:h-[359px]">
        <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.44,0,0.56,1)] group-hover:scale-105">
          <Image
            src={project.cover}
            alt={project.name}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 33vw"
            className="object-cover"
            style={{ objectPosition: project.coverPosition }}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col min-[810px]:flex-row min-[810px]:items-start min-[810px]:gap-5">
        <h5 className="vs-h5 min-w-0 text-vs-fg min-[810px]:flex-1">{project.name}</h5>
        <p className="shrink-0 font-inter text-[12px] leading-[18px] font-light text-vs-fg">{project.category}</p>
      </div>
    </a>
  );
}
