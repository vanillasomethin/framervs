import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Section header row used by About, Philosophy, Works, Services, Process, Team.
 * Desktop: label (h5 22px, muted) fills the left, paragraph (Inter 300 16/24) is a 400px
 * column at the right (x=1020 in a 1440 frame). Mobile: stacked, gap 20.
 * Reveal: fade-up y20, spring .4s bounce .2, delay .4, 50% in view.
 */
export function SectionHeader({
  label,
  children,
  className,
}: {
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={`flex w-full flex-col gap-5 min-[810px]:flex-row min-[810px]:items-start min-[810px]:gap-2.5 ${className ?? ""}`}
    >
      <p className="vs-h5 flex-1 text-vs-muted">{label}</p>
      {children ? <div className="vs-body w-full text-vs-fg min-[810px]:w-[400px] min-[810px]:shrink-0">{children}</div> : null}
    </Reveal>
  );
}
