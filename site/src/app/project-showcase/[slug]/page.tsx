import type { Metadata } from "next";
import { seoMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getProject, PROJECTS } from "@/components/sites/vanillasomethin/data-projects";
import { PageShell } from "@/components/sites/vanillasomethin/projects/PageShell";
import { ProjectDetail } from "@/components/sites/vanillasomethin/projects/ProjectDetail";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return getProject(slug) ? seoMetadata(`project-showcase/${slug}`) : {};
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <PageShell>
      <ProjectDetail project={project} />
    </PageShell>
  );
}
