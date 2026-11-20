// Single source of truth for the metadata of the Framer-exported pages.
//
// Why this exists: the Framer runtime rewrites document.title (and the
// description) after hydration with the values baked into its JS bundle,
// which are generic ("Vanilla & Somethin") for every page. Google indexes the
// rendered DOM, so static <head> edits alone are lost.
// `node scripts/seo/apply-framer-seo.mjs` writes these values into the static
// HTML AND into public/seo-meta.js, which re-applies them after hydration and
// on Framer's client-side navigation.
//
// Paths use the trailing-slash form Netlify serves with HTTP 200.
// Do not use em dashes in copy (enforced by scripts/audit-seo.mjs).

export const SITE = "https://www.vanillasometh.in";
export const BRAND = "Vanilla & Somethin'";
export const ORG = { "@type": "Organization", "@id": `${SITE}/#organization`, name: BRAND, url: `${SITE}/` };

const project = (p) => ({
  file: `project-showcase/${p.slug}/index.html`,
  path: `/project-showcase/${p.slug}/`,
  title: p.title,
  description: p.description,
  project: p,
});

export const PROJECTS = [
  { slug: "nord-terra", name: "Nord Terra House", category: "Residential architecture", year: "2024", locality: "Kozhikode", region: "Kerala", country: "IN",
    title: "Nord Terra House, Kozhikode Residence | Vanilla & Somethin'",
    description: "Nord Terra House, Kozhikode, Kerala (2024): a calm residence of stone, wood and lime-washed surfaces, shaped by sculpted natural light and quiet geometry." },
  { slug: "bnb", name: "BNB House", category: "Residential interior design", year: "2025", locality: "Kadri, Mangalore", region: "Karnataka", country: "IN",
    title: "BNB House Interiors, Kadri Mangalore | Vanilla & Somethin'",
    description: "BNB House: a 2025 residential interior design project in Kadri, Mangalore by Vanilla & Somethin'. Project overview, design approach and photographs." },
  { slug: "koan", name: "Koan House", category: "Residential interior design", year: "2025", locality: "Kadri, Mangalore", region: "Karnataka", country: "IN",
    title: "Koan House, Mangalore | Minimal Home Interiors | Vanilla & Somethin'",
    description: "Koan House in Kadri, Mangalore (2025): a minimal residential interior using natural and indirect light, balanced proportions and calm, essential forms." },
  { slug: "mak", name: "MAK Park Square", category: "Apartment interior design", year: "2025", locality: "Mangalore", region: "Karnataka", country: "IN",
    title: "MAK Park Square Apartment Interiors, Mangalore | Vanilla & Somethin'",
    description: "MAK Park Square, Mangalore (2025): compact apartment interiors with multifunctional furniture, hidden storage and a calm, neutral, textured palette." },
  { slug: "seiko-hyper", name: "Seiko Hypermarket", category: "Retail and supermarket design", year: "2025", locality: "Dammam", region: "Eastern Province", country: "SA",
    title: "Seiko Hypermarket, Dammam | Supermarket Design | Vanilla & Somethin'",
    description: "Seiko Hypermarket, Dammam, Saudi Arabia (2025): a supermarket layout with intuitive circulation, clear signage and lighting that lifts product visibility." },
  { slug: "flutecase", name: "Flute-Case", category: "Office interior design", year: "2025", locality: "Mangalore", region: "Karnataka", country: "IN",
    title: "Flute-Case Office Interiors, Mangalore | Vanilla & Somethin'",
    description: "Flute-Case, Mangalore (2025): an office interior for Rapid Solution Pvt. Ltd. with fluted textures, a calm minimal palette and zoned planning for focus." },
  { slug: "fair-fly", name: "Fair-Fly", category: "Retail kiosk design", year: "2025", locality: "Mangalore", region: "Karnataka", country: "IN",
    title: "Fair-Fly Popsicle Pop-Up Kiosk, Mangalore | Vanilla & Somethin'",
    description: "Fair-Fly for Sorbete, Mangalore (2025): a modular outdoor popsicle pop-up kiosk with a bright brand palette, lightweight parts and quick installation." },
  { slug: "coco-meltdown", name: "Coco Meltdown", category: "Cafe interior design", year: "2024", locality: "Al Khobar", region: "Eastern Province", country: "SA",
    title: "Coco Meltdown Cafe Interior, Al Khobar | Vanilla & Somethin'",
    description: "Coco Meltdown for Dip'N'Melt, Al Khobar (2024): a chocolate cafe interior with fluid curves, a rich brown and gold palette and glossy, warm lighting." },
  { slug: "pipe-nova", name: "Pipe Nova", category: "Retail interior design", year: "2025", locality: "Falnir, Mangalore", region: "Karnataka", country: "IN",
    title: "Pipe Nova Retail Interior, Falnir Mangalore | Vanilla & Somethin'",
    description: "Pipe Nova for Sorbete, Falnir, Mangalore (2025): an industrial retail interior where exposed pipes, metal frames and focused light form the brand identity." },
  { slug: "artwist-salon", name: "Artwist Salon", category: "Salon interior design", year: "2025", locality: "Kochi", region: "Kerala", country: "IN",
    title: "Artwist Salon Interior Design, Kochi | Vanilla & Somethin'",
    description: "Artwist Salon in Kochi, Kerala (2025): a salon interior with soft curves, warm flattering light and an efficient flow from styling stations to the wash area." },
];

export const PAGES = [
  {
    file: "index.html", path: "/",
    title: "Vanilla & Somethin' | Architects & Interior Designers, Mangalore",
    description: "Architecture and interior design studio in Mangalore designing homes, offices, cafes and retail spaces across coastal Karnataka, Kerala and the Gulf.",
    keepExistingSchema: true,
  },
  {
    file: "project-showcase/index.html", path: "/project-showcase/",
    title: "Architecture & Interior Design Projects | Vanilla & Somethin'",
    description: "Selected homes, apartments, offices, cafes, salons and retail interiors by Vanilla & Somethin' in Mangalore, Kerala and Saudi Arabia.",
    collection: true,
  },
  {
    file: "contact/index.html", path: "/contact/",
    title: "Contact Our Mangalore Architecture Studio | Vanilla & Somethin'",
    description: "Start a home, interior or commercial design project with Vanilla & Somethin'. Share your brief and we will reply with next steps and a consultation slot.",
    contact: true,
  },
  {
    file: "team.html", path: "/team.html", altPaths: ["/team", "/team/"],
    title: "Our Architects & Designers | Vanilla & Somethin' Team",
    description: "Meet Ar. Hisham Khalid, Ar. Zeba Ali Khan and the Vanilla & Somethin' team designing homes, workplaces and commercial interiors from Mangalore.",
    keepExistingSchema: true,
  },
  ...PROJECTS.map(project),
];
