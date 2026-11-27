import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

// The main site's header, so the estimator is part of the same site: the logo goes
// home, the same links as the homepage, and a menu button on phones.
const LINKS = [
  { label: "ABOUT", href: "/#section-about" },
  { label: "PRICING", href: "/pricing" },
  { label: "WORKS", href: "/project-showcase/" },
  { label: "CONTACT", href: "/contact/" },
];

const Logo = () => (
  <a href="/" className="flex flex-col items-start text-vs-dark" aria-label="Vanilla & Somethin' home">
    <span className="font-seasons text-[26px] leading-[0.9] tracking-[0.05em]">vanilla &amp;</span>
    <span className="font-halimun text-[18px] leading-[1.4] tracking-[0.01em]">somethin&apos;</span>
  </a>
);

const SiteHeader = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="relative z-40 px-5 py-5">
      <nav className="flex items-center justify-between" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="font-space-grotesk text-sm tracking-[0.04em] text-vs-dark/70 transition-colors hover:text-vs-dark">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-full border border-vs-dark/20 text-vs-dark md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f0ede8] px-5 py-5 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex size-10 items-center justify-center rounded-full border border-vs-dark/20 text-vs-dark"
            >
              <X className="size-5" />
            </button>
          </div>
          <ul className="mt-20 flex flex-col items-center gap-10">
            {[{ label: "HOME", href: "/" }, ...LINKS].map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={() => setOpen(false)} className="font-space-grotesk text-lg tracking-[0.04em] text-vs-dark">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
};

export default SiteHeader;
