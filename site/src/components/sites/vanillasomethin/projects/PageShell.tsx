import type { ReactNode } from "react";
import { Cursor } from "../Cursor";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SmoothScroll } from "../SmoothScroll";
import { Contact } from "../sections/Contact";
import { Faq } from "../sections/Faq";

/**
 * Shared frame for the Project Showcase pages: same header, FAQ, contact and curtain footer
 * as the homepage. Homepage anchors in the nav resolve to "/#section-…".
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <main className="relative">
        <SiteHeader hashBase="/" />
        {/* Opaque layer above the sticky footer curtain (z 1), like the homepage sections. */}
        <div className="relative z-[2] bg-vs-bg">{children}</div>
        <Faq />
        <Contact />
        <SiteFooter />
      </main>
    </>
  );
}
