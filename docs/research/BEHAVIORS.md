# Behaviors — vanillasomethin.framer.website

## Global
- **Lenis smooth scroll** — `class="lenis"` on `<html>`. Smooth, inertial scrolling. Implement with `lenis` npm package.
- **Dark mode** — CSS media query `(prefers-color-scheme: dark)` swaps tokens: bg → #380100, text → #ebe8e5

## Navigation
- **Scroll-triggered:** After scrolling ~50px, nav gains background and shadow
- **State A:** transparent background, full width nav
- **State B:** background appears (rgba(235,232,229,0.9) with backdrop-filter: blur), shadow subtle
- **Fixed position** at top of page, z-index high

## Hero Section
- **Layout:** Full viewport height, dark background (#0d0d0d or #380100)
- **Letters spaced individually** for "P U R E . P L A Y F U L . P U R P O S E F U L"
- **Ticker/marquee:** "A R C H I T E C T S . D E S I G N E R S . V I S I O N A R I E S" scrolls horizontally

## About Section
- **Stats counters:** Count up from 0 when scrolled into view (IntersectionObserver)
- **Text reveal:** Large body text with word-by-word reveal on scroll

## Design Philosophy Section (accordion)
- **Interaction model:** CLICK-driven accordion — 4 items, click to expand
- **Default open:** Item 01 (Unbounded Realities)
- **Image:** Each item shows corresponding image when expanded
- **Transition:** Height/opacity transition on expand/collapse

## Selected Works Section  
- **Layout:** Grid of project cards (2-col desktop, 1-col mobile)
- **Cards:** Image + project name + client + category on hover
- **Hover:** Image scale, overlay appears

## Services Section (accordion)
- **Interaction model:** CLICK-driven accordion — 12 items
- **Structure:** Number + title + expandable description with service bullets

## Video Section
- **Full-width video** plays autoplay, loop, muted
- **Text overlay:** "I CAPTURE MOMENTS THAT CAN'T BE REPEATED."

## Process Section
- **4 numbered steps** with title + description
- **Static layout** — no interactivity

## Team Section
- **Profile with quote** — photo, name, title, quote text

## FAQ Section
- **Click-driven accordion** — 10 questions
- **Default:** All closed

## Contact Section
- **Form:** Name, email, message fields + submit
- **Info panel:** Phone, email, location, social links (Instagram, Pinterest, LinkedIn)

## Footer
- **Simple:** Logo, copyright, links

## Responsive
- Mobile breakpoint: ~768px
- At mobile: nav collapses (hamburger?), hero text scales down, grid stacks
