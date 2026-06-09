# AboutSection Specification

## Overview
- **Target file:** `src/components/AboutSection.tsx`
- **Interaction model:** scroll-triggered counter animation
- **Background:** #ebe8e5 (cream)

## DOM Structure
```
section.about (bg: #ebe8e5)
  ├─ div.about-header
  │   ├─ span.section-label ("[ABOUT]")
  │   └─ p.about-subtitle ("Where Functionality Meets Aesthetic, Your Architectural Journey Starts Here.")
  ├─ div.about-body
  │   ├─ div.about-text (large scrolling text with word reveal)
  │   │   └─ p (uppercase, word by word)
  │   └─ div.about-image (architectural photo)
  ├─ a.about-cta ("SEE OUR WORKS →")
  └─ div.about-stats (4 stat counters in a row)
      ├─ div.stat (Years Experiences)
      ├─ div.stat (Satisfied Clients %)
      ├─ div.stat (Project Volume)
      └─ div.stat (Global Clients +)
```

## Computed Styles

### section.about
- background: #ebe8e5
- padding: 80px 40px
- max-width: 100%

### section-label
- font-family: Fragment Mono
- font-size: 12px
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #4d4d4d
- margin-bottom: 24px

### about-subtitle
- font-family: Space Grotesk
- font-size: clamp(18px, 2vw, 26px)
- font-weight: 400
- color: #0d0d0d
- max-width: 600px
- line-height: 1.5

### about body text (large text block)
- font-family: Space Grotesk
- font-size: clamp(26px, 3.5vw, 44px)
- font-weight: 700
- text-transform: uppercase
- color: #0d0d0d
- line-height: 1.15
- letter-spacing: 0.02em
- Content: "WE ARE VANILLA & SOMETHIN. DESIGNERS OF SPACE, STORYTELLERS OF SIMPLICITY. OUR WORK CAPTURES THE SUBTLE TENSION BETWEEN STRUCTURE AND SOUL—WHERE THE ORDINARY TURNS EXTRAORDINARY."

### about-cta
- font-size: 12px
- font-weight: 500
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #0d0d0d
- text-decoration: underline on hover
- margin-top: 32px

### stat item
- display: flex
- flex-direction: column
- gap: 8px

### stat value
- font-family: Space Grotesk
- font-size: clamp(40px, 5vw, 68px)
- font-weight: 700
- color: #0d0d0d
- counter animation: counts from 0 to final value when in viewport

### stat label
- font-size: 14px
- font-weight: 500
- color: #0d0d0d
- text-transform: capitalize

### stat description
- font-size: 13px
- color: #4d4d4d
- line-height: 1.4
- max-width: 200px

### stats container
- display: grid
- grid-template-columns: repeat(4, 1fr) on desktop
- gap: 40px
- border-top: 1px solid rgba(13,13,13,0.15)
- padding-top: 40px
- margin-top: 60px

## Stats Data (verbatim)
1. Value: "0" → "8+" (or similar), Label: "Years Experiences", Description: "Years of shaping spaces, stories, and identities. This isn't just practice—it's a creative evolution driven by vision, collaboration, and fearless design thinking."
2. Value: "0%" → "95%", Label: "Satisfied Clients", Description: "Not just satisfied—they return. Every project runs smooth thanks to clear communication, precise results, and a process that feels natural."
3. Value: "0" → "50+", Label: "Project Volume", Description: "From simple beginnings to layered expressions — our journey is shaped by curiosity, collaboration, and the pursuit of honest design."
4. Value: "0+" → "12+", Label: "Global Clients", Description: "We've worked with brands, agencies, and individuals who value design and a different point of view."

Note: actual numbers not in source, show 0 on load, animate when in view. Use displayed text: "0" / "0%" / "0+" as placeholders matching the original which counts up.

## Assets
About section image: https://framerusercontent.com/images/k0hCBBFPRnK09hkFkjqs5C3fI.jpg

## Responsive Behavior
- Desktop: two-column layout (text left, image right) then full-width stats grid
- Mobile: single column, stats grid becomes 2×2
