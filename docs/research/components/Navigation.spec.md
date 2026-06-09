# Navigation Specification

## Overview
- **Target file:** `src/components/Navigation.tsx`
- **Interaction model:** scroll-triggered style change + static links
- **Position:** Fixed, top of page, z-index 100+

## DOM Structure
```
nav (fixed, full-width, top)
  └─ div.nav-inner (max-width container, flex row, space-between)
      ├─ a.logo (text logo: "vanilla &" / "somethin'" stacked or inline)
      └─ ul.nav-links (flex row, links: ABOUT, ESTIMATOR, WORKS, TEAM, CONTACT)
```

## Computed Styles — Desktop (1440px)

### nav container
- position: fixed
- top: 0
- left: 0
- right: 0
- z-index: 100
- padding: 20px 40px
- transition: background 0.3s ease, backdrop-filter 0.3s ease, padding 0.3s ease

### State A (at top, scroll < ~50px)
- background: transparent
- backdrop-filter: none
- box-shadow: none

### State B (scrolled, scroll >= 50px)
- background: rgba(235, 232, 229, 0.92)
- backdrop-filter: blur(12px)
- box-shadow: 0 1px 0 rgba(13,13,13,0.08)

### Logo
- font-family: Space Grotesk
- font-size: 14px
- font-weight: 500
- text-transform: lowercase
- letter-spacing: 0.02em
- color: #0d0d0d
- Two lines: "vanilla &" / "somethin'"

### Nav links
- font-family: Space Grotesk
- font-size: 12px
- font-weight: 500
- letter-spacing: 0.08em
- text-transform: uppercase
- color: #0d0d0d
- gap: 32px between items
- opacity on hover: 0.6, transition: 0.2s

## Links
- ABOUT → /about (or /#about section scroll)
- ESTIMATOR → /estimator
- WORKS → /works (or /project-showcase)
- TEAM → /team
- CONTACT → /contact

## Responsive Behavior
- Desktop (>768px): horizontal links visible
- Mobile (≤768px): links hidden, hamburger icon (☰) shown, opens overlay menu

## States & Behaviors

### Scroll trigger
- **Trigger:** window.scrollY >= 50
- **State A → B:** background appears, blur applies
- **Implementation:** useEffect + window scroll listener, or IntersectionObserver on a sentinel div at top
