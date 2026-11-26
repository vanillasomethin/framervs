import Image from "next/image";
import { projectHref, type Project } from "../data-projects";

/**
 * Index list row: "01  TITLE  Category" centred on one 60px line.
 * Hover (desktop): the row's text blurs and the cover (400x369) appears at the right edge,
 * top-aligned with the row.
 */
export function ProjectListRow({ project, index }: { project: Project; index: number }) {
  return (
    <a
      href={projectHref(project.slug)}
      className="group relative flex min-h-[60px] flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-vs-fg"
    >
      <span className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 transition-[filter] duration-300 min-[1200px]:group-hover:blur-[4px]">
        <span className="vs-body">{String(index + 1).padStart(2, "0")}</span>
        <span className="vs-h3 text-[24px] min-[810px]:text-[40px]">{project.name}</span>
        <span className="vs-body">{project.category}</span>
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 z-[2] hidden h-[369px] w-[400px] overflow-hidden opacity-0 transition-opacity duration-300 min-[1200px]:block min-[1200px]:group-hover:opacity-100"
      >
        <Image src={project.cover} alt="" fill loading="lazy" sizes="400px" className="object-cover" />
      </span>
    </a>
  );
}
