import Image from "next/image";
import { projectHref, type Project } from "../data-projects";

/**
 * "Other project" card. >=810: 400px cover with a 55px blurred caption bar across the middle
 * (client | title | category, #fafafa); hover zooms and darkens the cover, cursor shows VIEW.
 * Phones: 341px cover with title + category underneath.
 */
export function OtherProjectCard({ project }: { project: Project }) {
  return (
    <a href={projectHref(project.slug)} data-cursor="view" className="group block">
      <div className="relative h-[341px] overflow-hidden rounded-[8px] min-[810px]:h-[400px]">
        <div className="absolute inset-0 transition-[transform,filter] duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] min-[810px]:group-hover:scale-110 min-[810px]:group-hover:brightness-50">
          <Image src={project.cover} alt={project.name} fill loading="lazy" sizes="(max-width: 809px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="absolute top-1/2 left-0 hidden h-[55px] w-full -translate-y-1/2 items-center gap-2 px-6 backdrop-blur-[5px] min-[810px]:flex">
          <p className="vs-body shrink-0 text-vs-card-text">{project.client}</p>
          <h4 className="min-w-0 flex-1 text-center font-grotesk text-[24px] leading-[1.3] font-medium tracking-[0.01em] text-vs-card-text">
            {project.name}
          </h4>
          <p className="vs-body shrink-0 text-vs-card-text">{project.category}</p>
        </div>
      </div>
      <div className="mt-3 min-[810px]:hidden">
        <h5 className="vs-h5 text-vs-fg">{project.name}</h5>
        <p className="font-inter text-[12px] leading-[18px] font-light text-vs-fg">{project.category}</p>
      </div>
    </a>
  );
}
