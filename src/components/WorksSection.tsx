import Link from "next/link";
import Image from "next/image";

const projects = [
  { client: "John Salins", title: "Flute-Case", category: "Commercial - Office", image: "https://framerusercontent.com/images/B4xFhzEhd6G5mQnlYF6h0KEzxAo.png", href: "/project-showcase/flutecase" },
  { client: "Sorbete", title: "Fair-Fly", category: "Commercial - Retail", image: "https://framerusercontent.com/images/ju0gSS3ymm8N5DMB9UWKr52GHzs.png", href: "/project-showcase/fair-fly" },
  { client: "Mr. Sadath", title: "Nord Terra", category: "Residential", image: "https://framerusercontent.com/images/atHnzlC0bxos7mKbhByERKoYC0o.jpg", href: "/project-showcase/nord-terra" },
  { client: "MAK Builders", title: "MAK Park Square", category: "Residential - Apartment", image: "https://framerusercontent.com/images/oOgqrwl6b9KzDzwvQVDCzrzBd2Q.png", href: "/project-showcase/mak" },
  { client: "Mr. Ashraf", title: "BNB House", category: "Residential - Interiors", image: "https://framerusercontent.com/images/bqseiXtoV5vO99RUi0xXuxLl2zM.png", href: "/project-showcase/bnb" },
  { client: "Dip'N'Melt", title: "Coco Meltdown", category: "Commercial - Cafe", image: "https://framerusercontent.com/images/iGACg6EJ6JWKeROxDsUB60pUqt8.jpg", href: "/project-showcase/coco-meltdown" },
  { client: "Mrs. Fida", title: "Artwist Salon", category: "Commercial - Salon", image: "https://framerusercontent.com/images/p2HafXrbkrzZWGuRNvQwiKefJ7s.png", href: "/project-showcase/artwist-salon" },
  { client: "Hyper Al Wafa", title: "Seiko Hypermarket", category: "Commercial - Retail", image: "https://framerusercontent.com/images/AI0u2FuN2JqVr5PS28MixwnR82k.jpg", href: "/project-showcase/seiko-hyper" },
  { client: "Adoor Family", title: "Koan House", category: "Residential - Interior", image: "https://framerusercontent.com/images/ztJAhSpApJJMG6U1vb2GRwo3bo.png", href: "/project-showcase/koan" },
  { client: "Sorbete", title: "Pipe Nova", category: "Commercial - Retail", image: "https://framerusercontent.com/images/ajLmeHHIgaReHnNGnMQBksLB54.jpg", href: "/project-showcase/pipe-nova" },
];

export function WorksSection() {
  return (
    <section
      style={{
        background: "#ebe8e5",
        padding: "80px 40px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-fragment-mono)",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4d4d4d",
        }}
      >
        [SELECTED WORKS]
      </span>

      <p
        style={{
          fontSize: "16px",
          color: "#4d4d4d",
          maxWidth: "480px",
          marginTop: "16px",
          lineHeight: "1.6",
        }}
      >
        These are the spaces that define us. Each project unfolds a new dialogue between vision and structure.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "24px",
          marginTop: "48px",
        }}
        className="works-grid"
      >
        {projects.map((project) => (
          <Link
            key={project.href}
            href={project.href}
            style={{
              display: "block",
              textDecoration: "none",
              cursor: "pointer",
            }}
            className="works-card"
          >
            <div
              style={{
                overflow: "hidden",
                aspectRatio: "4/3",
                borderRadius: "2px",
                position: "relative",
              }}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                unoptimized
                style={{
                  objectFit: "cover",
                  transition: "transform 0.5s ease",
                }}
                className="works-card-img"
              />
            </div>
            <div
              style={{
                padding: "14px 0 6px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-fragment-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#adadad",
                }}
              >
                {project.client}
              </span>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#0d0d0d",
                  margin: 0,
                }}
              >
                {project.title}
              </h3>
              <span
                style={{
                  fontSize: "12px",
                  color: "#4d4d4d",
                }}
              >
                {project.category}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <a
        href="/works"
        style={{
          display: "block",
          marginTop: "48px",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#0d0d0d",
          border: "1px solid rgba(13,13,13,0.25)",
          padding: "12px 24px",
          width: "fit-content",
          textDecoration: "none",
          borderRadius: "2px",
          transition: "background 0.2s",
        }}
        className="view-all-btn"
      >
        VIEW ALL
      </a>

      <style>{`
        @media (max-width: 768px) {
          .works-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .works-card:hover .works-card-img {
          transform: scale(1.04);
        }
        .view-all-btn:hover {
          background: rgba(13,13,13,0.04);
        }
      `}</style>
    </section>
  );
}
