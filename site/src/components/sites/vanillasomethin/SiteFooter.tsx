import { Fragment } from "react";
import { FOOTER } from "./data";
import { CAMERA_PATH } from "./icons";
import { RollLink } from "./primitives/RollLink";

/**
 * Footer. Curtain reveal: `position: sticky; bottom: 0; z-index: 1` as the last child of
 * <main>, while FAQ (z 3) and Contact (z 2) are relative with an opaque bg and slide off it.
 */
export function SiteFooter() {
  return (
    <div className="vs-frame sticky bottom-0 z-[1]">
      <footer className="bg-vs-bg pt-[100px] pb-5">
        <div className="flex flex-col gap-5 px-5">
          {FOOTER.rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-2 min-[810px]:min-h-[52px] min-[810px]:flex-row min-[810px]:items-center"
            >
              <h3 className="vs-h3 flex-1 text-[32px] leading-[1.3] text-vs-fg min-[810px]:text-[40px]">{row.label}</h3>
              <div className="flex flex-wrap items-center">
                {row.links.map((link, i) => (
                  <Fragment key={link.label}>
                    {i > 0 && row.separator ? (
                      <span className="pr-1 font-inter text-[16px] leading-[1.5] font-normal uppercase text-vs-muted">
                        {row.separator}
                      </span>
                    ) : null}
                    <RollLink href={link.href} external className={i > 0 && !row.separator ? "pl-1" : undefined}>
                      {link.label}
                    </RollLink>
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
          <div className="h-px w-full bg-vs-fg" />
        </div>

        <div className="pt-20">
          <svg
            viewBox="0 0 1389.6 144"
            className="block h-auto w-full overflow-visible text-vs-fg opacity-10"
            aria-label={FOOTER.wordmark}
            role="img"
          >
            <foreignObject width="100%" height="100%" className="overflow-visible">
              <p className="m-0 font-grotesk text-[180px] leading-[0.8] font-bold tracking-[-0.12em] whitespace-nowrap text-vs-fg uppercase">
                {FOOTER.wordmark}
              </p>
            </foreignObject>
          </svg>
          <div className="flex items-center justify-between gap-4 px-5 font-inter text-[14px] font-light text-vs-fg max-[809px]:flex-col max-[809px]:items-start">
            <div className="flex items-center gap-2.5 leading-[1.3]">
              <svg viewBox="0 0 256 256" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path d={CAMERA_PATH} />
              </svg>
              <p>{FOOTER.madeWith}</p>
            </div>
            <p className="leading-[1.5]">{FOOTER.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
