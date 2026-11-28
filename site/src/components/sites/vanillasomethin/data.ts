// All copy and asset paths for the vanillasomethin homepage, as rendered on
// https://vanillasomethin.framer.website/ (source typos kept on purpose).

export const SOURCE = "";
const IMG = "/sites/vanillasomethin/images";

export const NAV_LINKS = [
  { label: "ABOUT", href: "#section-about" },
  { label: "PRICING", href: "/pricing" },
  { label: "WORKS", href: "/project-showcase/" },
  { label: "CONTACT", href: "/contact/" },
] as const;

export const HERO = {
  headline: "PURE. PLAYFUL. PURPOSEFUL",
  cta: { label: "BOOK A CONSULTATION", href: "/contact/" },
  ticker: ["ARCHITECTS", "DESIGNERS", "VISIONARIES"],
};

export const ABOUT = {
  label: "[ABOUT]",
  intro: "Where Functionality Meets Aesthetic, Your Architectural Journey Starts Here.",
  reveal:
    "WE ARE VANILLA & SOMETHIN. DESIGNERS OF SPACE, STORYTELLERS OF SIMPLICITY. OUR WORK CAPTURES THE SUBTLE TENSION BETWEEN STRUCTURE AND SOUL, WHERE THE ORDINARY TURNS EXTRAORDINARY.",
  cta: { label: "SEE OUR WORKS", href: "/project-showcase/" },
  images: {
    leftLarge: `${IMG}/about-2.webp`,
    leftSmall: `${IMG}/about-1.webp`,
    rightLarge: `${IMG}/about-3.webp`,
    rightSmall: `${IMG}/about-4.webp`,
  },
  counters: [
    {
      end: 4,
      suffix: "",
      label: "Years Experiences",
      text: "Years of shaping spaces, stories, and identities. This isn’t just practice, it’s a creative evolution driven by vision, collaboration, and fearless design thinking.",
    },
    {
      end: 101,
      suffix: "%",
      label: "Satisfied Clients",
      text: "Not just satisfied, they return. Every project runs smooth thanks to clear communication, precise results, and a process that feels natural.",
    },
    {
      end: 28,
      suffix: "",
      label: "Project Volume",
      text: "From simple beginnings to layered expressions, our journey is shaped by curiosity, collaboration, and the pursuit of honest design.",
    },
    {
      end: 36,
      suffix: "+",
      label: "Global Clients",
      text: "From Riyadh to Mangalore, We’ve worked with brands, agencies, and individuals who value design and a different point of view.",
    },
  ],
};

export const PHILOSOPHY = {
  label: "[DESIGN PHILOSOPHY]",
  intro:
    "Our practice shifts between experimentation and restraint, exploring how spaces can feel intuitive yet deliberate, raw yet refined. The goal is simple: to make design that breathes and belongs.",
  items: [
    {
      n: "01",
      title: "Unbounded Realities",
      body: "We believe architecture is not bound by walls or drawings but by the human eye that beholds it. Each space is a lived poem, formed from memory, instinct, and imagination. We design to awaken what already exists, to stretch perception beyond the seen.",
      image: `${IMG}/philosophy-1-unbounded-realities.webp`,
    },
    {
      n: "02",
      title: "Beyond the Measured Line",
      body: "Precision guides us, but not as a cage. We draw not to restrict, but to reveal, the silence between proportions, the dialogue between material and light. Every line holds a question; every shadow, an answer.",
      image: `${IMG}/philosophy-2-beyond-the-measured-line.webp`,
    },
    {
      n: "03",
      title: "The Dialogue of Balance",
      body: "To design is to converse, between wildness and order, chaos and control, intuition and method. Like a steady rain, or a story told beneath a tree, each project finds its rhythm in balance, never static, always alive.",
      image: `${IMG}/philosophy-3-dialogue-of-balance.webp`,
    },
    {
      n: "04",
      title: "Human Reverence",
      body: "Design begins where ego ends. We craft spaces that honour the human body: its pace, its breath, its need for belonging. Architecture, for us, is a gesture of humility, a place that receives, rather than commands.",
      image: `${IMG}/philosophy-4-human-reverence.webp`,
    },
  ],
};

export const WORKS = {
  label: "[SELECTED WORKS]",
  intro: ["These are the spaces that define us.", "Each project unfolds a new dialogue between vision and structure."],
  viewAll: { label: "VIEW ALL", href: "/project-showcase/" },
  items: [
    { client: "John Salins", title: "Flute-Case", category: "Commercial - Office", href: "/project-showcase/flutecase/", image: `${IMG}/work-01-flute-case.webp`, position: "82.3% 0%" },
    { client: "Sorbete", title: "Fair-Fly", category: "Commercial - Retail", href: "/project-showcase/fair-fly/", image: `${IMG}/work-02-fair-fly.webp`, position: "50% 50%" },
    { client: "Mr. Sadath", title: "Nord Terra House", category: "Residential", href: "/project-showcase/nord-terra/", image: `${IMG}/work-03-nord-terra-house.webp`, position: "50% 50%" },
    { client: "MAK Builders", title: "MAK Park Square", category: "Residential - Apartment", href: "/project-showcase/mak/", image: `${IMG}/work-04-mak-park-square.webp`, position: "50% 50%" },
    { client: "Mr. Ashraf", title: "BNB House", category: "Residential - Interiors", href: "/project-showcase/bnb/", image: `${IMG}/work-05-bnb-house.webp`, position: "50% 50%" },
    { client: "Dip'N'Melt", title: "Coco Meltdown", category: "Commercial - Cafe", href: "/project-showcase/coco-meltdown/", image: `${IMG}/work-06-coco-meltdown.webp`, position: "50% 50%" },
    { client: "Mrs. Fida", title: "Artwist Salon", category: "Commercial - Salon", href: "/project-showcase/artwist-salon/", image: `${IMG}/work-07-artwist-salon.webp`, position: "50% 50%" },
    { client: "Hyper Al Wafa", title: "Seiko Hypermarket", category: "Commercial - Retail", href: "/project-showcase/seiko-hyper/", image: `${IMG}/work-08-seiko-hypermarket.webp`, position: "50% 50%" },
    { client: "Adoor Family", title: "Koan House", category: "Residential - Interior", href: "/project-showcase/koan/", image: `${IMG}/work-09-koan-house.webp`, position: "50% 50%" },
    { client: "Sorbete", title: "Pipe Nova", category: "Commercial - Retail", href: "/project-showcase/pipe-nova/", image: `${IMG}/work-10-pipe-nova.webp`, position: "50% 50%" },
  ],
};

export const SERVICES = {
  label: "[SERVICES]",
  intro:
    "Each service is an extension of our design ethos: thoughtful, future-ready, and driven by the pursuit of timeless spatial quality.",
  items: [
    { n: "01", title: "Architectural Design", tag: "Core", ticker: "Concept Development · Schematic Design · Design Development · Construction Documentation · Sustainable & Passive Design · 3D Visualization", image: `${IMG}/service-01.webp`, href: null },
    { n: "02", title: "Interior Design", tag: "Bespoke", ticker: "Space Planning · Material & Finishes · Furniture & Joinery · Fit-out Drawings · Styling & Staging", image: `${IMG}/service-02.webp`, href: null },
    { n: "03", title: "Landscape Design", tag: "Core", ticker: "Master Planning · Hardscape Design · Planting Plans · Irrigation · Lighting · Maintenance Guidelines", image: `${IMG}/service-03.webp`, href: "/landscape-design/" },
    { n: "04", title: "Urban & Master Planning", tag: "Strategic", ticker: "Site Analysis · Feasibility Studies · Zoning & Regulations · Infrastructure Planning · Smart City Integration", image: `${IMG}/service-04.webp`, href: null },
    { n: "05", title: "BIM & Digital Design", tag: "Advanced", ticker: "BIM Modeling · Clash Detection · As-Built Models · Parametric Design · Digital Twin · Automation", image: `${IMG}/service-05-08.webp`, href: null },
    { n: "06", title: "Visualization & Communication", tag: "Advanced", ticker: "3D Modeling · Rendering · VR Walkthroughs · Animations · Diagrams · Presentations", image: `${IMG}/service-06.webp`, href: null },
    { n: "07", title: "Furniture & Product Design", tag: "Bespoke", ticker: "Bespoke Furniture · Product Prototyping · Material Research · Ergonomic & Sustainable Design", image: `${IMG}/service-07.webp`, href: null },
    { n: "08", title: "Heritage & Conservation", tag: "Specialized", ticker: "Documentation · Measured Drawings · Adaptive Reuse · Restoration · Material Conservation", image: `${IMG}/service-05-08.webp`, href: null },
    { n: "09", title: "Design Research & Innovation", tag: "Experimental", ticker: "Material Innovation · Computational Design · Sustainability & Circular Design · Prototyping · Testing", image: `${IMG}/service-09.webp`, href: null },
    { n: "10", title: "Authority Approvals & Compliance", tag: "Essential", ticker: "Permitting · Regulatory Compliance · Fire & Safety · Consultant Coordination · Green Building Docs", image: `${IMG}/service-10.webp`, href: "/permits-and-licensing-support/" },
    { n: "11", title: "Project Management & Execution Support", tag: "Core", ticker: "Design Supervision · Consultant Coordination · Site Inspections · Tender Docs · Post-Occupancy Evaluation", image: `${IMG}/service-11.webp`, href: "/project-management/" },
    { n: "12", title: "Future-Ready Solutions", tag: "Experimental", ticker: "Smart Building Integration · Net-Zero / Energy Modeling · Digital Fabrication · Modular Systems · AR/VR · AI Design Integration", image: `${IMG}/service-12.webp`, href: null },
  ],
};

export const VIDEO = {
  sentence: "Each space a verse, each detail a heartbeat.",
  src: "/sites/vanillasomethin/video/vanilla-logo-reveal.mp4",
};

export const PROCESS = {
  label: "[GET STARTED]",
  intro: "A simple, transparent process that turns your ideas into built reality, step by step.",
  steps: [
    { n: "01", title: "Connect", body: "Share your project goals, vision, and requirements. A quick email or call helps us understand what you’re looking to create.", image: `${IMG}/process-1-connect.webp` },
    { n: "02", title: "Define", body: "We discuss your needs, develop a tailored proposal, and outline the scope, timeline, and deliverables, ensuring full clarity before we begin.", image: `${IMG}/process-2-define.webp` },
    { n: "03", title: "Design", body: "Through research, sketches, and 3D visualization, ideas evolve into tangible design concepts. You’ll see your vision take form with each iteration.", image: `${IMG}/process-3-design.webp` },
    { n: "04", title: "Deliver", body: "We finalize drawings, coordinate execution, and stay involved through completion, ensuring the design is built true to intent.", image: `${IMG}/process-4-deliver.webp` },
  ],
};

const HISHAM_QUOTE =
  "“I believe good design begins by listening, to people, to place, and to purpose. Every line we draw should make life better, not just look beautiful. At Vanilla & Somethin’, my focus is on creating spaces that feel intuitive, grounded, and quietly bold.”";
const ZEBA_QUOTE =
  "“For me, design is storytelling. Each project is a new chapter shaped by context, craft, and emotion. I enjoy bridging ideas and execution, ensuring that what we imagine together becomes something meaningful in the real world.”";

export const TEAM = {
  // Source label is missing its opening bracket; kept as rendered.
  label: "MEET THE TEAM]",
  intro: "We’re a collective of curious minds: architects, designers, and builders who thrive on collaboration and thoughtful design.",
  slides: [
    { image: `${IMG}/team-1-hisham.webp`, quote: HISHAM_QUOTE, name: "Ar. Hisham Khalid", role: "Principal Architect/Creative Strategisttional" },
    { image: `${IMG}/team-2-zeba.webp`, quote: ZEBA_QUOTE, name: "Ar. Zeba Ali Khan", role: "Principal Architect/Creative Director" },
    { image: `${IMG}/team-3-hisham.webp`, quote: HISHAM_QUOTE, name: "Ar. Hisham Khalid", role: "Principal Architect/Creative Strategisttional" },
    { image: `${IMG}/team-4-zeba.webp`, quote: ZEBA_QUOTE, name: "Ar. Zeba Ali Khan", role: "Principal Architect/Creative Director" },
  ],
  arrows: { back: `${IMG}/arrow-back.svg`, next: `${IMG}/arrow-next.svg` },
};

export const FAQ = {
  label: "[FREQUENTLY ASKED QUESTIONS]",
  intro: [
    "If you're curious about how we work, timelines, budgets, or what to expect when you start a project with us, this is a good place to begin.",
    "No jargon. No over-complication. Just straight answers.",
  ],
  items: [
    { n: "01", q: "How do I start a project with you?", a: ["You can book a session by filling out the contact form on my website or reaching out via email. Let me know your preferred date, location, and any specific ideas you have in mind."] },
    { n: "02", q: "Do you handle execution as well?", a: ["Yes.", "We can manage everything (drawings, approvals, contractors, materials) or collaborate with your preferred team."] },
    { n: "03", q: "How much will my project cost?", a: ["It depends on size, scope, materials, and level of customization.", "Average starting ranges (India):", "Architecture / New builds: ₹2,500–₹6,000 per sq.ft", "Interiors: ₹1,800–₹4,000 per sq.ft", "We share a rough estimate once we understand your requirements."] },
    { n: "04", q: "Can you work within my budget?", a: ["Mostly, yes.", "We’ll guide you on what’s possible and help adjust scope and materials to make things work."] },
    { n: "05", q: "What affects the cost the most?", a: ["Materials → finishes → complexity.", "Premium marble, custom furniture, or structural changes increase cost.", "Simple layout + standard finishes = more budget-friendly."] },
    { n: "06", q: "Do I need a design team? Why not just hire a contractor?", a: ["A contractor builds;", "a design team plans, visualizes, optimizes space, and ensures everything works beautifully.", "It saves time, mistakes, and rework costs."] },
    { n: "07", q: "Do you help with materials + contractors?", a: ["Yes, we can manage everything or collaborate with your preferred vendors."] },
    { n: "08", q: "How long will the project take?", a: ["Renovations can take 2–4 months.", "New builds can take 8–16 months.", "Timelines vary based on approvals, materials, and complexity."] },
    { n: "09", q: "Can we work together remotely?", a: ["Absolutely.", "We’ve successfully delivered projects across cities using virtual collaboration."] },
    {
      n: "10",
      q: "What’s your fee structure?",
      a: ["We typically work with a percentage-based model or fixed slabs, depending on the scope ; as per Scale Of Charges set by the Council Of Architecture India"],
      link: "https://coa.gov.in/index1.php?lang=1&level=2&&sublinkid=299&lid=86",
    },
  ],
};

export const CONTACT = {
  headline: "Big plans? Small questions? We’re listening.",
  text: "Tell us about your idea, your vision, or just say hi.",
  cta: { label: "SEND A MESSAGE", href: "/contact/" },
};

export const FOOTER = {
  rows: [
    {
      label: "CONTACT",
      links: [
        { label: "+91 7411 32 4448", href: "tel:+917411324448" },
        { label: "hello@vanillasometh.in", href: "mailto:hello@vanillasometh.in" },
      ],
      separator: ",",
    },
    {
      label: "LOCATION",
      links: [
        { label: "MANGALORE, INDIA |", href: "https://maps.app.goo.gl/W2b5YT7XH658UqPa9" },
        { label: "RIYADH,SAUDI ARABIA", href: "https://maps.app.goo.gl/W2b5YT7XH658UqPa9" },
        { label: "MANGALORE STUDIO", href: "/locations/mangalore/" },
      ],
      separator: null,
    },
    {
      label: "SOCIAL",
      links: [
        { label: "INSTAGRAM", href: "https://www.instagram.com/vanillasometh.in/" },
        { label: "PINTEREST", href: "https://www.pinterest.com/vanillaandsomethin" },
        { label: "LINKEDIN", href: "https://www.linkedin.com/company/vanilla-and-somethin" },
      ],
      separator: ",",
    },
  ],
  wordmark: "VANILLA&SOMETHIN'",
  madeWith: "Designed by Hisham Khalid",
  copyright: "© 2026 Vanilla & Somethin'. All rights reserved.",
};
