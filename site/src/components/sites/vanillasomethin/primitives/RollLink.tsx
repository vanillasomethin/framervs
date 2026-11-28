import type { ReactNode } from "react";

/**
 * Nav / footer link with the source's "roll" hover: two stacked copies of the label,
 * both slide up one line on hover. Label: Space Grotesk 500 16/24, muted colour.
 */
export function RollLink({
  href,
  children,
  className,
  external = false,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const line =
    "block h-6 transition-transform duration-[350ms] ease-[cubic-bezier(0.3,1.3,0.5,1)] group-hover:-translate-y-full";
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className={`group vs-label relative inline-block h-6 overflow-hidden whitespace-nowrap text-vs-muted ${className ?? ""}`}
    >
      <span className={line}>{children}</span>
      <span className={line} aria-hidden="true">
        {children}
      </span>
    </a>
  );
}
