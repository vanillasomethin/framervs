# WorksSection Specification

## Overview
- **Target file:** `src/components/WorksSection.tsx`
- **Interaction model:** static grid with hover effects
- **Background:** #ebe8e5

## DOM Structure
```
section.works (bg: #ebe8e5)
  ├─ div.works-header
  │   ├─ span.section-label ("[SELECTED WORKS]")
  │   └─ p.works-subtitle ("These are the spaces that define us...")
  ├─ div.works-grid (2-col grid of project cards)
  │   ├─ a.project-card × 10
  └─ a.works-cta ("VIEW ALL →")
```

## Project Card Structure
```
a.project-card (link to /project-showcase/[slug])
  ├─ div.card-image-wrap
  │   └─ img.card-image (object-fit: cover, aspect-ratio: 4/3)
  └─ div.card-info
      ├─ span.card-client (client name)
      ├─ h3.card-title (project name)
      └─ span.card-category (e.g. "Commercial - Office")
```

## Computed Styles

### section.works
- background: #ebe8e5
- padding: 80px 40px

### works-subtitle
- font-size: 16px
- color: #4d4d4d
- max-width: 480px
- margin-bottom: 48px

### works-grid
- display: grid
- grid-template-columns: repeat(2, 1fr)
- gap: 24px
- @media (max-width: 768px): grid-template-columns: 1fr

### project-card
- display: block
- cursor: pointer
- text-decoration: none

### card-image-wrap
- overflow: hidden
- aspect-ratio: 4/3
- border-radius: 2px

### card-image
- width: 100%
- height: 100%
- object-fit: cover
- transition: transform 0.5s ease
- hover: transform: scale(1.05)

### card-info
- padding: 16px 0 8px
- display: flex
- flex-direction: column
- gap: 4px

### card-client
- font-size: 11px
- font-family: Fragment Mono
- letter-spacing: 0.1em
- color: #adadad
- text-transform: uppercase

### card-title
- font-size: 18px
- font-weight: 600
- color: #0d0d0d
- margin: 4px 0

### card-category
- font-size: 12px
- color: #4d4d4d

### works-cta
- display: block
- margin-top: 48px
- font-size: 12px
- font-weight: 500
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #0d0d0d
- text-decoration: underline on hover

## Projects Data

| Client | Title | Category | Image URL | Slug |
|--------|-------|----------|-----------|------|
| John Salins | Flute-Case | Commercial - Office | https://framerusercontent.com/images/B4xFhzEhd6G5mQnlYF6h0KEzxAo.png | flutecase |
| Sorbete | Fair-Fly | Commercial - Retail | https://framerusercontent.com/images/ju0gSS3ymm8N5DMB9UWKr52GHzs.png | fair-fly |
| Mr. Sadath | Nord Terra | Residential | https://framerusercontent.com/images/atHnzlC0bxos7mKbhByERKoYC0o.jpg | nord-terra |
| MAK Builders | MAK Park Square | Residential - Apartment | https://framerusercontent.com/images/oOgqrwl6b9KzDzwvQVDCzrzBd2Q.png | mak |
| Mr. Ashraf | BNB House | Residential - Interiors | https://framerusercontent.com/images/bqseiXtoV5vO99RUi0xXuxLl2zM.png | bnb |
| Dip'N'Melt | Coco Meltdown | Commercial - Cafe | https://framerusercontent.com/images/iGACg6EJ6JWKeROxDsUB60pUqt8.jpg | coco-meltdown |
| Mrs. Fida | Artwist Salon | Commercial - Salon | https://framerusercontent.com/images/p2HafXrbkrzZWGuRNvQwiKefJ7s.png | artwist-salon |
| Hyper Al Wafa | Seiko Hypermarket | Commercial - Retail | https://framerusercontent.com/images/AI0u2FuN2JqVr5PS28MixwnR82k.jpg | seiko-hyper |
| Adoor Family | Koan House | Residential - Interior | https://framerusercontent.com/images/ztJAhSpApJJMG6U1vb2GRwo3bo.png | koan |
| Sorbete | Pipe Nova | Commercial - Retail | https://framerusercontent.com/images/ajLmeHHIgaReHnNGnMQBksLB54.jpg | pipe-nova |

## Text Content (verbatim)
- Section label: "[SELECTED WORKS]"
- Subtitle: "These are the spaces that define us. Each project unfolds a new dialogue between vision and structure."
- CTA: "VIEW ALL"
