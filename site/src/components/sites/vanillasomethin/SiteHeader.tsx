"use client";

import { useState } from "react";
import { NAV_LINKS } from "./data";
import { Reveal } from "./primitives/Reveal";
import { RollLink } from "./primitives/RollLink";
import { ThemeToggle } from "./ThemeToggle";

function Logo() {
  return (
    <a href="#section-hero" className="flex flex-col items-start text-vs-fg" aria-label="Vanilla & Somethin' home">
      <span className="font-seasons text-[26px] leading-[0.9] tracking-[0.05em]">vanilla &amp;</span>
      <span className="font-halimun text-[18px] leading-[1.4] tracking-[0.01em]">somethin&apos;</span>
    </a>
  );
}

/**
 * Navigation (not fixed: scrolls away with the page).
 * Desktop (>=810): logo left, theme toggle centred, roll links right (gap 8).
 * Mobile (<810): logo, toggle, hamburger; tapping expands a full-height panel with
 * "MILO THERON" above the logo and centred ABOUT / WORKS / CONTACT links.
 * Enter: fade-up y20, spring .4s bounce .2, delay .4 (on mount).
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <Reveal trigger="mount" className="vs-frame relative z-[6]">
      <header className="relative p-5">
        {/* Desktop */}
        <nav className="hidden h-[69px] items-center min-[810px]:flex" aria-label="Main">
          <div className="flex flex-1 items-center">
            <Logo />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <ThemeToggle />
          </div>
          <ul className="flex flex-1 items-center justify-end gap-2">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <RollLink href={l.href}>{l.label}</RollLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile */}
        <nav
          className={`min-[810px]:hidden ${
            open ? "fixed inset-0 z-[20] overflow-y-auto bg-vs-bg p-5" : "relative"
          }`}
          aria-label="Main"
        >
          <div className="flex items-start">
            <div className="flex w-[155px] shrink-0 flex-col">
              {open ? (
                <a href="./" className="vs-label uppercase text-vs-fg">
                  Milo Theron
                </a>
              ) : null}
              <Logo />
            </div>
            <ThemeToggle className="mt-[3px]" />
            <div className="flex flex-1 justify-end">
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="relative mt-[3px] h-10 w-10 rounded-full"
              >
                <span
                  className="absolute left-[10px] h-[2px] w-5 bg-vs-fg transition-[transform,top] duration-[400ms] ease-[cubic-bezier(0.3,1.2,0.5,1)]"
                  style={{ top: open ? 19 : 14, transform: open ? "rotate(-45deg)" : "none" }}
                />
                <span
                  className="absolute left-[10px] h-[2px] w-5 bg-vs-fg transition-[transform,top] duration-[400ms] ease-[cubic-bezier(0.3,1.2,0.5,1)]"
                  style={{ top: open ? 19 : 24, transform: open ? "rotate(45deg)" : "none" }}
                />
              </button>
            </div>
          </div>
          {open ? (
            <ul className="mt-[77px] flex flex-col items-center gap-10">
              {NAV_LINKS.filter((l) => !("desktopOnly" in l)).map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={() => setOpen(false)} className="vs-label text-vs-fg">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      </header>
    </Reveal>
  );
}
