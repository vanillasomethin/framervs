import { Fragment } from "react";
import { CONTACT_PAGE } from "../data-contact";
import { RollLink } from "../primitives/RollLink";

/** [CONTACT] / [LOCATION] / [SOCIAL] link rows: three centred columns from 810px, stacked and centred below. */
export function ContactDetails() {
  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-10 text-center min-[810px]:grid-cols-3">
      {CONTACT_PAGE.groups.map((group) => (
        <div key={group.label} className="flex flex-col items-center gap-5">
          <h2 className="vs-h5 text-vs-muted">{group.label}</h2>
          <div className="flex flex-wrap items-center justify-center gap-y-1">
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
