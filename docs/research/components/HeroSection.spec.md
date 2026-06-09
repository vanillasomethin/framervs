# HeroSection Specification

## Overview
- **Target file:** `src/components/HeroSection.tsx`
- **Interaction model:** static + marquee ticker
- **Screenshot:** docs/design-references/hero.png

## DOM Structure
```
section.hero (min-height: 100vh, dark bg)
  ├─ div.hero-header (top area with headline)
  │   ├─ p.hero-tagline ("P U R E . P L A Y F U L . P U R P O S E F U L")
  │   └─ a.hero-cta ("BOOK A CONSULTATION")
  ├─ div.hero-images (overlapping architectural images, center of hero)
  └─ div.hero-ticker (bottom marquee: "A R C H I T E C T S . D E S I G N E R S . V I S I O N A R I E S")
```

## Computed Styles

### section.hero
- min-height: 100vh
- background: #0d0d0d (near black)
- display: flex
- flex-direction: column
- justify-content: space-between
- overflow: hidden
- position: relative
- padding: 0
- padding-top: 80px (accounts for fixed nav)

### hero-tagline
- font-family: Space Grotesk
- font-size: clamp(44px, 6vw, 96px)
- font-weight: 700
- color: #ebe8e5
- letter-spacing: 0.2em (spaced letters: "P U R E . P L A Y F U L .")
- text-transform: uppercase
- padding: 40px 40px 0

### hero-cta button
- font-family: Space Grotesk
- font-size: 12px
- font-weight: 500
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #ebe8e5
- border: 1px solid rgba(235,232,229,0.4)
- padding: 12px 24px
- border-radius: 2px
- background: transparent
- hover: background rgba(235,232,229,0.1)
- transition: 0.2s
- position: absolute top-right or inline after tagline

### hero images area
- The hero shows architectural project images (2-3 overlapping rectangles)
- Images from framerusercontent.com:
  - https://framerusercontent.com/images/o3gmJ2YSEg2cCrqtvEIlwv5AY.jpg
  - https://framerusercontent.com/images/w9XwtveeBOu7c3GZOxpMad45vLE.jpg
  - https://framerusercontent.com/images/CEKXi1dH5VIjMKAoLqwbAv5liQ.jpg
- Images are positioned absolutely, overlapping, with slight rotation or offset
- Mix of portrait and landscape ratios
- Cover approximately 60% of viewport height

### hero-ticker (bottom)
- position: relative, bottom of section
- width: 100%
- overflow: hidden
- background: transparent (or slight divider above)
- padding: 16px 0
- border-top: 1px solid rgba(235,232,229,0.15)

### ticker text
- font-family: Space Grotesk
- font-size: 11px
- font-weight: 500
- letter-spacing: 0.3em
- text-transform: uppercase
- color: #adadad
- display: flex (two copies for seamless loop)
- animation: marquee 20s linear infinite
- Content: "A R C H I T E C T S .   D E S I G N E R S .   V I S I O N A R I E S   "

## Text Content (verbatim)
- Tagline: "P U R E . P L A Y F U L . P U R P O S E F U L"
- CTA: "BOOK A CONSULTATION"
- Ticker: "A R C H I T E C T S . D E S I G N E R S . V I S I O N A R I E S"

## Assets
- Image 1: https://framerusercontent.com/images/o3gmJ2YSEg2cCrqtvEIlwv5AY.jpg
- Image 2: https://framerusercontent.com/images/w9XwtveeBOu7c3GZOxpMad45vLE.jpg
- Image 3: https://framerusercontent.com/images/CEKXi1dH5VIjMKAoLqwbAv5liQ.jpg

## Responsive Behavior
- Desktop: full viewport, large text, 3 images
- Mobile: text scales down to ~32px, images stack or single image, ticker continues
