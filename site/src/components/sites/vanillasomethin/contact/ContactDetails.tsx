import { Fragment } from "react";
import { CONTACT_PAGE } from "../data-contact";
import { RollLink } from "../primitives/RollLink";

/** Left column of Section - Form: intro line, then [CONTACT] / [LOCATION] / [SOCIAL] link rows. */
export function ContactDetails() {
  return (
    <div className="flex w-full flex-col gap-10">
      <p className="vs-body text-vs-fg min-[1440px]:w-[600px]">{CONTACT_PAGE.intro}</p>
      {CONTACT_PAGE.groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-5">
          <h2 className="vs-h5 text-vs-muted">{group.label}</h2>
          <div className="flex flex-wrap items-center gap-y-1">
            {group.links.map((link, i) => (
              <Fragment key={link.label}>
                {i > 0 && group.separator ? (
                  <span className="pr-1 font-inter text-[16px] leading-[1.5] font-normal uppercase text-vs-muted">
                    {group.separator}
                  </span>
                ) : null}
                <RollLink
                  href={link.href}
                  external={link.external}
                  className={i === 0 ? undefined : group.label === "[SOCIAL]" ? "ml-[9px]" : group.separator ? undefined : "pl-1"}
                >
                  {link.label}
                </RollLink>
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
