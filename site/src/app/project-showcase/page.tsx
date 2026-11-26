import type { Metadata } from "next";
import { seoMetadata } from "@/lib/seo";
import { PageShell } from "@/components/sites/vanillasomethin/projects/PageShell";
import { ProjectsIndex } from "@/components/sites/vanillasomethin/projects/ProjectsIndex";

export const metadata: Metadata = seoMetadata("project-showcase");

export default function ProjectShowcasePage() {
  return (
    <PageShell>
      <ProjectsIndex />
    </PageShell>
  );
}
