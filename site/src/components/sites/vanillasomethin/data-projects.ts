// All 10 Project Showcase entries (formerly Framer CMS), in the order the index shows them.
// Text is verbatim from the rendered source pages (source typos and spacing kept).

export type RichNode =
  | { type: "h5"; text: string; bold?: boolean }
  | { type: "p"; text: string; lead?: string; bold?: boolean }
  | { type: "video"; src: string };

export type GalleryImage = { src: string; position?: string };

export type Project = {
  slug: string;
  name: string;
  client: string;
  category: string;
  location: string;
  year: string;
  /** Hero paragraph under the title. */
  description: string;
  /** Optional paragraph in the Overview block (only some projects fill it). */
  overview?: string;
  /** Cover image: index cards, other-project cards and the detail parallax image. */
  cover: string;
  /** object-position of the cover on the index grid card. */
  coverPosition: string;
  /** Wide image above [BEHIND THE DESIGN]. */
  behindImage: string;
  behind: RichNode[];
  /** Gallery layout: full, half, half, full, full. */
  gallery: GalleryImage[];
  /** Slugs of the two "Other project" cards. */
  others: [string, string];
};

export const PROJECTS: Project[] = [
  {
    slug: "flutecase",
    name: "Flute-Case",
    client: "John Salins",
    category: "Commercial - Office",
    location: "Mangalore, Karnataka",
    year: "2025",
    description: "Office Space for Rapid Solution Pvt.Ltd -  The design intent was to use minimal colors, patterns, and textures to create a sense of lightness for the inhabitants to experience calm while working, which in turn increases their productivity at work.",
    cover: "/sites/vanillasomethin/images/projects/flutecase/hero.png",
    coverPosition: "82.3% 0%",
    behindImage: "/sites/vanillasomethin/images/projects/flutecase/behind.webp",
    behind: [
      { type: "h5", text: "Fluted Geometry as Identity" },
      { type: "p", text: "The brand’s core aesthetic inspired the repeated use of fluted textures along walls and surfaces, helping translate product language into spatial expression." },
      { type: "h5", text: "Calm Minimal Material Palette" },
      { type: "p", text: "A restrained blend of wood grains, textured paints, and matte finishes establishes a soothing, clutter-free environment that encourages focus." },
      { type: "h5", text: "Seamless Work Flow Planning" },
      { type: "p", text: "Zones are thoughtfully arranged to balance privacy and collaboration ,  integrating open workstations, breakout niches, and efficient circulation to support daily operations." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/flutecase/gallery-01.jpg", position: "50% 47.5%" },
      { src: "/sites/vanillasomethin/images/projects/flutecase/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/flutecase/gallery-03.jpg" },
      { src: "/sites/vanillasomethin/images/projects/flutecase/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/flutecase/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "fair-fly",
    name: "Fair-Fly",
    client: "Sorbete",
    category: "Commercial - Retail",
    location: "Mangalore, Karnatka",
    year: "2025",
    description: "a vibrant outdoor popsicle pop-up store designed by Vanilla & Somethin Architects, featuring playful colors, lightweight materials, and a breezy open form that blends seamlessly with the lively food street atmosphere.",
    cover: "/sites/vanillasomethin/images/projects/fair-fly/hero.png",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/fair-fly/behind.jpg",
    behind: [
      { type: "h5", text: "MODULAR STRUCTURE" },
      { type: "p", text: "Built with lightweight, modular components for quick installation and seamless relocation without compromising stability or visual appeal" },
      { type: "h5", text: "BRAND-DRIVEN IDENTITY" },
      { type: "p", text: "A bright, eye-catching palette inspired by popsicle hues strengthens brand recall and creates an immediate sense of fun and freshness." },
      { type: "h5", text: "STREET-INTEGRATED EXPERIENCE" },
      { type: "p", text: "Bold streetwear, layered essentials, and a mix of luxury + thrift reflect the reality of modern style in motion." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/fair-fly/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/fair-fly/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/fair-fly/gallery-03.png" },
      { src: "/sites/vanillasomethin/images/projects/fair-fly/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/fair-fly/gallery-05.png" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "nord-terra",
    name: "Nord Terra House",
    client: "Mr. Sadath",
    category: "Residential",
    location: "Kozhikode, Kerala",
    year: "2024",
    description: "Architectural compositions of Nordterra House bathed in natural light and shadow, capturing raw textures and refined geometry in a cinematic, moody tone that evokes calm strength and understated luxury",
    overview: "Nordterra House is envisioned as a calm refuge ,  a residence grounded in raw materiality, quiet geometry, and an understated Nordic sensibility. The architecture embraces earthy textures, muted tones, and sculpted natural light to create an atmosphere of warmth and contemplative simplicity. Spaces unfold gradually, revealing moments of intimacy framed by minimal details and honest materials like stone, wood, and lime-washed surfaces. The design balances openness with privacy, anchoring daily life in a setting that feels both grounded and quietly luxurious.",
    cover: "/sites/vanillasomethin/images/projects/nord-terra/hero.jpg",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/nord-terra/behind.jpg",
    behind: [
      { type: "h5", text: "QUIET MATERIAL EXPRESSION", bold: true },
      { type: "p", text: "A restrained palette of natural stone, timber, and soft plaster tones forms a tactile backdrop, emphasizing honesty and warmth in every space.", bold: true },
      { type: "h5", text: "SCULPTED LIGHT + SHADOW", bold: true },
      { type: "p", text: "Fenestration and layered screening were carefully composed to choreograph natural light, creating cinematic depth and mood throughout the day.", bold: true },
      { type: "h5", text: "SOFT GEOMETRY + BALANCE", bold: true },
      { type: "p", text: "Minimal, clean lines meet gentle curves and organic textures, producing a harmonious rhythm that evokes a sense of calm strength and modern elegance.", bold: true },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/nord-terra/gallery-01.png" },
      { src: "/sites/vanillasomethin/images/projects/nord-terra/gallery-02.png" },
      { src: "/sites/vanillasomethin/images/projects/nord-terra/gallery-03.png" },
      { src: "/sites/vanillasomethin/images/projects/nord-terra/gallery-04.png" },
      { src: "/sites/vanillasomethin/images/projects/nord-terra/gallery-05.png" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "mak",
    name: "MAK Park Square",
    client: "MAK Builders",
    category: "Residential - Apartment",
    location: "Mangalore, Karnataka",
    year: "2025",
    description: "A minimalist fine art project focusing on simplicity, negative space, and quiet, contemplative moments.",
    cover: "/sites/vanillasomethin/images/projects/mak/hero.png",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/mak/behind.jpg",
    behind: [
      { type: "h5", text: "Smart Spatial Planning" },
      { type: "p", text: "Compact zones are optimized through multifunctional furniture and hidden storage, ensuring visual lightness without compromising comfort." },
      { type: "h5", text: "Neutral Palette + Texture Play" },
      { type: "p", text: "A base of soft neutrals paired with tactile materials brings depth and sophistication, allowing natural light to become an active design element." },
      { type: "h5", text: "Urban Calm Aesthetic" },
      { type: "p", text: "Simple forms, clean geometry, and restrained detailing create a sense of calm ,  offering balance amidst the pace of city life." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/mak/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/mak/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/mak/gallery-03.jpg" },
      { src: "/sites/vanillasomethin/images/projects/mak/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/mak/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "bnb",
    name: "BNB House",
    client: "Mr. Ashraf",
    category: "Residential - Interiors",
    location: "Kadri, Karnataka",
    year: "2025",
    description: "A portrait series exploring the connection between people and landscapes, blending organic elements with human emotion.",
    cover: "/sites/vanillasomethin/images/projects/bnb/hero.png",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/bnb/behind.png",
    behind: [
      { type: "h5", text: "CREATIVE DIRECTION" },
      { type: "p", text: "Inspired by elemental forces, models are positioned in raw terrains, volcanic rock, glaciers, fields, to highlight the contrast and harmony." },
      { type: "h5", text: "LIGHTING TECHNIQUES USED" },
      { type: "p", text: "Shot entirely in natural light during golden hour, embracing the unpredictability of the environment." },
      { type: "h5", text: "STYLING PHILOSOPHY" },
      { type: "p", text: "Organic textures, layered naturals, and tones pulled from the landscape (moss green, stone gray, icy white) to merge model and nature." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/bnb/gallery-01.png" },
      { src: "/sites/vanillasomethin/images/projects/bnb/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/bnb/gallery-03.png" },
      { src: "/sites/vanillasomethin/images/projects/bnb/gallery-04.png" },
      { src: "/sites/vanillasomethin/images/projects/bnb/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "coco-meltdown",
    name: "Coco Meltdown",
    client: "Dip'N'Melt",
    category: "Commercial - Cafe",
    location: "Al Khobar, Saudi Arabia",
    year: "2024",
    description: "A documentary-style series capturing diverse individuals, telling their stories through raw, intimate portraits.",
    cover: "/sites/vanillasomethin/images/projects/coco-meltdown/hero.jpg",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/coco-meltdown/behind.jpg",
    behind: [
      { type: "h5", text: "Fluid Form Language" },
      { type: "p", text: "Inspired by the movement of melting chocolate, organic curves and soft transitions define the spatial flow, creating a sense of continuity and warmth." },
      { type: "h5", text: "Immersive Chocolate Palette" },
      { type: "p", text: "Rich browns, creamy neutrals, and golden accents create a sensory connection to the café’s core product ,  indulgence through color and texture." },
      { type: "h5", text: "Play of Light + Gloss" },
      { type: "p", text: "Strategic lighting enhances material depth, casting reflections that mimic the sheen of chocolate and evoke a cozy, luxurious ambience." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/coco-meltdown/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/coco-meltdown/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/coco-meltdown/gallery-03.jpg" },
      { src: "/sites/vanillasomethin/images/projects/coco-meltdown/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/coco-meltdown/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "artwist-salon",
    name: "Artwist Salon",
    client: "Mrs. Fida",
    category: "Commercial - Salon",
    location: "Kochi, Kerala",
    year: "2025",
    description: "Artwist Salon is envisioned as a creative beauty space where elegance meets expression. The design blends soft curves, warm lighting, and refined textures to craft an inviting environment that feels both luxurious and personal. Each zone ,  from styling stations to the wash area ,  is arranged to enhance comfort while maintaining an efficient workflow for the stylists. A muted, modern palette acts as a calm backdrop, allowing the artistry of hair, beauty, and makeup to take center stage.",
    cover: "/sites/vanillasomethin/images/projects/artwist-salon/hero.png",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/artwist-salon/behind.jpg",
    behind: [
      { type: "p", lead: "Soft, Sculpted Aesthetic", text: "Organic curves and gentle forms create a soothing atmosphere, making the space feel comfortable, elegant, and visually flowing." },
      { type: "p", lead: " Warm, Flattering Lighting", text: "Lighting is carefully calibrated to enhance skin tones and provide clarity for stylists, while maintaining a cozy, boutique-like ambience." },
      { type: "p", lead: "Function-Driven Layout", text: "Efficient zoning ensures smooth workflow ,  with well-positioned styling chairs, wash stations, and waiting areas designed for comfort and ease." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/artwist-salon/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/artwist-salon/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/artwist-salon/gallery-03.jpg" },
      { src: "/sites/vanillasomethin/images/projects/artwist-salon/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/artwist-salon/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "seiko-hyper",
    name: "Seiko Hypermarket",
    client: "Hyper Al Wafa",
    category: "Commercial - Retail",
    location: "Dammam, Saudi Arabia",
    year: "2025",
    description: "Seiko Hypermarket is designed as a seamless, customer-centered retail environment that prioritizes clarity, flow, and visual comfort. The layout organizes diverse product zones into an intuitive circulation system, ensuring effortless navigation even during peak hours. A bright, neutral palette combined with clean signage and strategic lighting enhances product visibility while maintaining a pleasant shopping atmosphere. Durable materials, well-defined departmental identities, and thoughtful detailing allow the space to feel both contemporary and highly functional ,  delivering an elevated retail experience that aligns with Seiko’s commitment to quality and convenience.",
    cover: "/sites/vanillasomethin/images/projects/seiko-hyper/hero.jpg",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/seiko-hyper/behind.jpg",
    behind: [
      { type: "h5", text: "Intuitive Circulation Strategy" },
      { type: "p", text: "A clear pathway system guides customers naturally through fresh produce, groceries, roastery, and specialty zones ,  reducing congestion and improving shopping ease." },
      { type: "h5", text: "Balanced Lighting + Visual Hierarchy" },
      { type: "p", text: "Natural light, deep contrast studio lighting, and strategic shadows were used to create bold compositions." },
      { type: "h5", text: "Durable Materials for Heavy Use" },
      { type: "p", text: "High-performance surfaces, anti-slip flooring, and robust fixtures ensure longevity and minimal maintenance, meeting the demands of a high-traffic hypermarket environment." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/seiko-hyper/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/seiko-hyper/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/seiko-hyper/gallery-03.jpg" },
      { src: "/sites/vanillasomethin/images/projects/seiko-hyper/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/seiko-hyper/gallery-05.jpg" },
    ],
    others: ["pipe-nova", "koan"],
  },
  {
    slug: "koan",
    name: "Koan House",
    client: "Adoor Family",
    category: "Residential - Interior",
    location: "Kadri, Mangalore",
    year: "2025",
    description: "A lifestyle photography project focusing on authenticity, unposed moments, and the beauty of imperfection.",
    cover: "/sites/vanillasomethin/images/projects/koan/hero.png",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/koan/behind.png",
    behind: [
      { type: "p", lead: "Minimalism with Meaning", text: "Every element is reduced to its essential form, ensuring clarity, balance, and visual calm without sacrificing depth or character." },
      { type: "p", lead: "Light as a Spatial Element", text: "Natural and indirect lighting is used to shape mood, define volumes, and enhance the meditative quality of the space." },
      { type: "p", lead: "Balanced Geometry + Proportion", text: "Carefully composed proportions and alignments create harmony, reinforcing the philosophy of stillness and intentional design." },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/koan/gallery-01.png" },
      { src: "/sites/vanillasomethin/images/projects/koan/gallery-02.png" },
      { src: "/sites/vanillasomethin/images/projects/koan/gallery-03.png" },
      { src: "/sites/vanillasomethin/images/projects/koan/gallery-04.png" },
      { src: "/sites/vanillasomethin/images/projects/koan/gallery-05.png" },
    ],
    others: ["pipe-nova", "seiko-hyper"],
  },
  {
    slug: "pipe-nova",
    name: "Pipe Nova",
    client: "Sorbete",
    category: "Commercial - Retail",
    location: "Falnir, Mangalore",
    year: "2025",
    description: "A creative exploration of light and shadow, using reflections, neon, and unconventional lighting techniques for unique visual effects.",
    cover: "/sites/vanillasomethin/images/projects/pipe-nova/hero.jpg",
    coverPosition: "50% 50%",
    behindImage: "/sites/vanillasomethin/images/projects/pipe-nova/behind.jpg",
    behind: [
      { type: "p", lead: "Industrial Aesthetic Elevated", text: "Exposed pipes, metal frameworks, and engineered detailing shift from being purely functional to becoming the visual identity of the space." },
      { type: "p", lead: "Monochrome + Metallic Palette", text: "A crisp base of greys and blacks, paired with brushed metal accents, creates a polished yet rugged character aligned with the brand’s DNA." },
      { type: "p", lead: "Lighting to Reveal Structure", text: "Focused lighting highlights the sculptural quality of the pipes and assemblies, casting shadows that emphasize form, depth, and craftsmanship." },
      { type: "video", src: "/sites/vanillasomethin/images/projects/pipe-nova/behind-video.mp4" },
    ],
    gallery: [
      { src: "/sites/vanillasomethin/images/projects/pipe-nova/gallery-01.jpg" },
      { src: "/sites/vanillasomethin/images/projects/pipe-nova/gallery-02.jpg" },
      { src: "/sites/vanillasomethin/images/projects/pipe-nova/gallery-03.png" },
      { src: "/sites/vanillasomethin/images/projects/pipe-nova/gallery-04.jpg" },
      { src: "/sites/vanillasomethin/images/projects/pipe-nova/gallery-05.jpg" },
    ],
    others: ["koan", "seiko-hyper"],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export const projectHref = (slug: string) => `/project-showcase/${slug}/`;
