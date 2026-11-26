"use client";

import { useState } from "react";
import type { Project } from "../data-projects";
import { Reveal } from "../primitives/Reveal";
import { PageTitle } from "./PageTitle";
import { ProjectGridCard } from "./ProjectGridCard";
import { ProjectListRow } from "./ProjectListRow";

type View = "grid" | "list";

function ViewOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const line =
    "block h-6 transition-transform duration-[350ms] ease-[cubic-bezier(0.3,1.3,0.5,1)] group-hover:-translate-y-full";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group vs-label relative inline-block h-6 overflow-hidden uppercase ${active ? "text-vs-fg" : "text-vs-muted"}`}
    >
      <span className={line}>{label}</span>
      <span className={line} aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

/**
 * /project-showcase/: "WORKS" label + DIVE INTO OUR WORKS, then a GRID / LIST switch over the
 * 10 projects. Grid: 3 columns >=1200, 2 from 810, 1 below (40px gaps). List: centred rows.
 */
export function ProjectsIndex({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("grid");

  return (
    <>
      <section className="vs-frame px-5 pt-[97px] min-[810px]:pt-[76px] min-[1200px]:pt-[100px]">
        <Reveal trigger="mount" className="vs-body text-center text-vs-fg">
          <p>WORKS</p>
        </Reveal>
        <PageTitle text="Dive into our works" className="mt-5" />
      </section>

      <section className="vs-frame px-5 pt-[140px] pb-[60px] min-[810px]:pt-[200px] min-[810px]:pb-[100px]">
        <div className="flex gap-5">
          <ViewOption label="Grid" active={view === "grid"} onClick={() => setView("grid")} />
          <ViewOption label="List" active={view === "list"} onClick={() => setView("list")} />
        </div>

        {view === "grid" ? (
          <div className="mt-20 grid grid-cols-1 gap-10 min-[810px]:grid-cols-2 min-[1200px]:grid-cols-3">
            {projects.map((p, i) => (
              <ProjectGridCard key={p.slug} project={p} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-5">
            {projects.map((p, i) => (
              <ProjectListRow key={p.slug} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
