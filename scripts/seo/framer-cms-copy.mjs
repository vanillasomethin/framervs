// Corrections to the Framer "Projects" CMS collection (self-hosted in public/js/*.framercms).
//
// Five case studies shipped with copy from a photography template ("A portrait series...",
// "models are positioned in raw terrains...", "Bold streetwear..."). Replacement copy is
// written only from each project's own facts (type, client, location, year), its existing
// "Behind the design" notes, and, for BNB House, what its project visualisations show.
// Do not add claims (materials, budgets, outcomes) that the studio has not confirmed.
//
// Applied by: node scripts/seo/patch-framer-cms.mjs
// No em dashes in copy (site rule).

export const REPLACEMENTS = [
  // Pipe Nova
  ["A creative exploration of light and shadow, using reflections, neon, and unconventional lighting techniques for unique visual effects.",
   "Pipe Nova is a retail interior for Sorbete in Falnir, Mangalore, where exposed pipes, metal frameworks and engineered details become the visual identity of the store."],
  ["This series investigates how light shapes perception. Each image tests the boundaries of visibility and color through unconventional lighting methods.",
   "A monochrome base of greys and blacks with brushed metal accents keeps the space polished yet rugged, while focused lighting picks out the sculptural pipework and casts shadows that bring out form and craftsmanship."],

  // Koan House
  ["A lifestyle photography project focusing on authenticity, unposed moments, and the beauty of imperfection.",
   "Koan House is a residential interior in Kadri, Mangalore, designed around minimalism with meaning: every element reduced to its essential form for clarity, balance and calm."],
  ["A raw visual narrative celebrating imperfections, stripped of digital enhancements. This series emphasizes the beauty in real textures, human flaws, and authentic expressions.",
   "Natural and indirect light shapes the mood and defines each volume, while carefully composed proportions and alignments give the home a quiet, meditative character."],

  // Coco Meltdown
  ["A documentary-style series capturing diverse individuals, telling their stories through raw, intimate portraits.",
   "Coco Meltdown is a cafe interior for Dip'N'Melt in Al Khobar, Saudi Arabia, inspired by the movement of melting chocolate."],
  ["A moody exploration of identity and mystery, this series presents unfamiliar faces through expressive portraiture and shadow play.",
   "Organic curves and soft transitions guide the spatial flow, while rich browns, creamy neutrals and golden accents connect the interior to the cafe's core product. Lighting adds gloss and depth for a warm, indulgent atmosphere."],

  // MAK Park Square
  ["A minimalist fine art project focusing on simplicity, negative space, and quiet, contemplative moments.",
   "MAK Park Square is an apartment interior project for MAK Builders in Mangalore, planned to make compact homes feel light, calm and practical."],
  ["A poetic photo series about calmness and introspection, where every frame is frozen in time. Emphasis is placed on minimal movement and clean compositions.",
   "Multifunctional furniture and hidden storage make the most of each zone, while soft neutrals, tactile materials and natural light bring a sense of calm to city living."],

  // Nord Terra House
  ["A fashion editorial infused with the feel of classic cinema. Each frame is a still from a story you wish you could watch unfold.",
   "Stone, timber and soft plaster tones form a tactile backdrop, and spaces unfold gradually to balance openness with privacy in everyday family life."],

  // BNB House (copy grounded in the project visualisations)
  ["A portrait series exploring the connection between people and landscapes, blending organic elements with human emotion.",
   "BNB House is a residential interior project in Kadri, Mangalore, combining warm stone, bronze-framed glass and soft curved furniture around an indoor garden."],
  ["A juxtaposition of the human body against untouched landscapes, this series explores the connection between fashion and the earth.",
   "Living spaces, bedrooms and bathrooms share one material family: marble and stone surfaces, textured wall finishes and layered lighting, with greenery brought indoors to soften the palette."],
  ["CREATIVE DIRECTION", "INDOOR GARDEN AT THE CENTRE"],
  ["Inspired by elemental forces, models are positioned in raw terrains—volcanic rock, glaciers, fields—to highlight the contrast and harmony.",
   "A planted court with a tree and pebble-like seating brings greenery and a sense of the outdoors into the middle of the living area."],
  ["LIGHTING TECHNIQUES USED", "WARM STONE AND BRONZE"],
  ["Shot entirely in natural light during golden hour, embracing the unpredictability of the environment.",
   "Marble-clad walls, bronze-toned frames and textured finishes give every room a calm, consistent material palette."],
  ["STYLING PHILOSOPHY", "SOFT FORMS, LAYERED LIGHT"],
  ["Organic textures, layered naturals, and tones pulled from the landscape (moss green, stone gray, icy white) to merge model and nature.",
   "Curved and upholstered furniture with pendant and cove lighting creates a relaxed, warm atmosphere across the living room, bedrooms and baths."],
  ["Kadri, Karnataka", "Kadri, Mangalore"],

  // Fair-Fly
  ["Bold streetwear, layered essentials, and a mix of luxury + thrift reflect the reality of modern style in motion.",
   "The open, compact form sits naturally within the lively food street, inviting people to stop, order and gather around the kiosk."],
  ["a vibrant outdoor popsicle pop-up store designed by Vanilla & Somethin Architects", "A vibrant outdoor popsicle pop-up store designed by Vanilla & Somethin' Architects"],
  ["Mangalore, Karnatka", "Mangalore, Karnataka"],

  // House style: no em dashes in published copy.
  [" — ", ", "],
];

// Phrases that must never appear in the published site again (checked by scripts/audit-seo.mjs).
export const FORBIDDEN = [
  "portrait series", "documentary-style series", "lifestyle photography project", "fine art project",
  "volcanic rock", "golden hour", "streetwear", "fashion editorial", "this series", "merge model and nature",
];
