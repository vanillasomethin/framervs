import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Project } from "@/components/sites/vanillasomethin/data-projects";
import { PageShell } from "@/components/sites/vanillasomethin/projects/PageShell";
import { ProjectDetail } from "@/components/sites/vanillasomethin/projects/ProjectDetail";
import { allProjects, findProject } from "@/lib/projects";
import { hasSeoFile, seoMetadata } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};
  if (hasSeoFile(`project-showcase/${slug}`)) return seoMetadata(`project-showcase/${slug}`);
  // A project added in the admin: its title, place and search description from the CMS record.
  const title = `${project.name}${project.location ? `, ${project.location.split(",")[0]}` : ""} | Vanilla & Somethin'`;
  const description = project.fromCms?.seoDescription || project.description;
  return { title: { absolute: title }, description, openGraph: { type: "article", title, description, images: [project.cover] } };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();
  const others = project.others.map(findProject).filter((p): p is Project => Boolean(p));
  return (
    <PageShell>
      <ProjectDetail project={project} others={others} />
    </PageShell>
  );
}
