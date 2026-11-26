import { CharReveal } from "../primitives/CharReveal";

/**
 * Big page title (index "DIVE INTO OUR WORKS", detail project name).
 * Space Grotesk 700, 96/68/44px (desktop/tablet/mobile), line-height 1.3, inverse colour,
 * per-character blur-up on mount like the source.
 */
export function PageTitle({ text, className }: { text: string; className?: string }) {
  return (
    <CharReveal
      as="h1"
      trigger="mount"
      stagger={0.03}
      text={text}
      className={`w-full text-center font-grotesk text-[44px] leading-[1.3] font-bold tracking-[0.01em] text-vs-inverse uppercase min-[810px]:text-[68px] min-[1200px]:text-[96px] ${className ?? ""}`}
    />
  );
}
