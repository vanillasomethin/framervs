/**
 * Collaboration and digital project delivery: added to the production homepage
 * outside the Framer design (delivery partner, AI-assisted workflows, dashboards).
 */
const IMG = "/sites/vanillasomethin/images";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] tracking-[.18em] uppercase text-[#cbbda5]">{children}</p>
);

export function Collaboration() {
  return (
    <section aria-label="Collaboration and digital project delivery" className="bg-[#111] px-6 py-[76px] text-[#f4f1eb]">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        <div>
          <Eyebrow>Project collaboration</Eyebrow>
          <h2 className="my-3 text-[clamp(28px,4vw,42px)] leading-[1.15] font-medium">Design thinking, strengthened by delivery partnerships.</h2>
          <p className="leading-[1.8] text-[#c9c4ba]">
            We collaborate with Marian Projects Pvt. Ltd. on project delivery. The scope and responsibilities for each project are agreed by the teams and documented at the outset.
          </p>
          <a href="https://marian.in/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[#e2d5bd] underline underline-offset-[5px]">
            Visit Marian Projects
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-[22px]">
          <div className="flex items-center justify-center rounded bg-white px-3.5 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/marian-projects-logo.jpg`} alt="Marian Projects logo" loading="lazy" width={108} height={118} className="block h-[118px] w-[108px] object-contain" />
          </div>
          <div className="max-w-[220px] text-[13px] leading-[1.6] text-[#c9c4ba]">
            Collaboration with
            <br />
            <strong className="text-[#f4f1eb]">Marian Projects Pvt. Ltd.</strong>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 grid max-w-[1180px] gap-9 border-t border-[#393631] pt-[38px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        <div>
          <Eyebrow>AI-integrated workflows</Eyebrow>
          <h2 className="my-2.5 text-[clamp(25px,3vw,36px)] leading-[1.2] font-medium">Technology that supports better project decisions.</h2>
          <p className="leading-[1.8] text-[#c9c4ba]">
            We integrate AI-integrated tools into selected research, information management, design exploration and reporting workflows. Architectural judgement, technical review and client approvals remain with the project team.
          </p>
        </div>
        <div>
          <Eyebrow>In-house project dashboards</Eyebrow>
          <h3 className="my-2.5 text-xl font-medium">A clearer view of progress and budgets.</h3>
          <p className="leading-[1.8] text-[#c9c4ba]">
            Our in-house dashboards organise project milestones, task ownership, progress updates, review comments, approvals, budget allocations and revisions. Information reflects the latest updates recorded by the project team.
          </p>
          <a href="/project-management/" className="mt-2 inline-block text-[#e2d5bd] underline underline-offset-[5px]">
            Explore our digital project workflow
          </a>
        </div>
      </div>
    </section>
  );
}
