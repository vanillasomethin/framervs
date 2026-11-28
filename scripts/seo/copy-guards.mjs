// Copy that must never appear on the published site (checked by scripts/audit-seo.mjs).
//
// The original case studies shipped with text from a photography template
// ("A portrait series...", "models are positioned in raw terrains...").
// These phrases catch it if it ever comes back, e.g. from an old export.
export const FORBIDDEN = [
  "portrait series", "documentary-style series", "lifestyle photography project", "fine art project",
  "volcanic rock", "golden hour", "streetwear", "fashion editorial", "this series", "merge model and nature",
];
