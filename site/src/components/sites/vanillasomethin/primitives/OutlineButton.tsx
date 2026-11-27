import type { ReactNode } from "react";

/**
 * Source outline button (BOOK A CONSULTATION, SEE OUR WORKS, VIEW ALL, SEND A MESSAGE).
 * 1px fg border, radius 8, padding 8px 12px, label Space Grotesk 500 16/24.
 * Hover: a fg "Bg Fill" blob rises from below the button (32x10 -> 200x64.5) and fills it;
 * the label turns bg-coloured. Spring-like ~0.5s.
 */
export function OutlineButton({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className={`group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-[8px] border border-vs-fg px-3 py-2 ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[59.7px] left-1/2 h-[64.5px] w-[200px] origin-top -translate-x-1/2 scale-[0.16] rounded-[8px] bg-vs-fg transition-[top,scale] duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)] group-hover:top-[-11.5px] group-hover:scale-100"
      />
      <span className="vs-label relative z-[1] whitespace-nowrap text-vs-fg transition-colors duration-300 group-hover:text-vs-bg">
        {children}
      </span>
    </a>
  );
}
