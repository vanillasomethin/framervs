/**
 * The "+" used by the Philosophy and FAQ accordions: two 2px x 14px fg bars (radius 40), 14x14 box (export CSS).
 * When `open`, the whole icon rotates 45deg (becomes an x).
 */
export function PlusIcon({ open = false, size = 14, className }: { open?: boolean; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.3,1.2,0.5,1)] ${className ?? ""}`}
      style={{ width: size, height: size, transform: open ? "rotate(45deg)" : "none" }}
    >
      <span className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 rounded-[40px] bg-vs-fg" />
      <span className="absolute top-0 left-1/2 h-full w-[2px] -translate-x-1/2 rounded-[40px] bg-vs-fg" />
    </span>
  );
}
