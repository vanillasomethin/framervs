# DesignPhilosophySection Specification

## Overview
- **Target file:** `src/components/DesignPhilosophySection.tsx`
- **Interaction model:** CLICK-driven accordion — 4 items, only one open at a time
- **Background:** #ebe8e5

## DOM Structure
```
section.philosophy (bg: #ebe8e5)
  ├─ div.philosophy-header
  │   ├─ span.section-label ("[DESIGN PHILOSOPHY]")
  │   └─ p.philosophy-intro ("Our practice shifts between experimentation...")
  └─ div.philosophy-accordion
      ├─ div.accordion-item (01 Unbounded Realities) [OPEN by default]
      ├─ div.accordion-item (02 Beyond the Measured Line)
      ├─ div.accordion-item (03 The Dialogue of Balance)
      └─ div.accordion-item (04 Human Reverence)
```

## Accordion Item Structure
```
div.accordion-item
  ├─ button.accordion-trigger (click to toggle)
  │   ├─ span.item-number ("01")
  │   ├─ span.item-title ("Unbounded Realities")
  │   └─ span.item-icon ("+" when closed, "−" when open)
  └─ div.accordion-content (height: 0 when closed, auto when open, transition: 0.4s)
      ├─ p.item-body (long description text)
      └─ div.item-image (architectural photo, visible when open)
```

## Computed Styles

### section.philosophy
- background: #ebe8e5
- padding: 80px 40px

### philosophy-intro
- font-size: 16px
- color: #4d4d4d
- max-width: 480px
- line-height: 1.6

### accordion-item
- border-top: 1px solid rgba(13,13,13,0.15)
- padding: 24px 0

### accordion-trigger
- display: flex
- align-items: center
- gap: 24px
- width: 100%
- cursor: pointer
- background: none
- border: none

### item-number
- font-family: Fragment Mono
- font-size: 12px
- color: #adadad
- min-width: 24px

### item-title (closed state)
- font-family: Space Grotesk
- font-size: clamp(18px, 2vw, 26px)
- font-weight: 500
- color: #0d0d0d

### item-title (open state)
- font-weight: 700

### item-icon
- font-size: 20px
- color: #adadad
- margin-left: auto
- transition: transform 0.3s

### accordion-content
- overflow: hidden
- transition: height 0.4s ease, opacity 0.3s ease
- display: grid (grid-template-rows: 0fr closed, 1fr open)

### item-body
- font-size: 16px
- color: #4d4d4d
- line-height: 1.7
- max-width: 560px
- padding: 16px 0 24px
- padding-left: 48px (aligns with title)

### item-image
- width: 100%
- max-width: 400px
- aspect-ratio: 3/2
- object-fit: cover
- margin-top: 16px
- border-radius: 2px

## Content (verbatim)

### 01 Unbounded Realities
Body: "We believe architecture is not bound by walls or drawings but by the human eye that beholds it. Each space is a lived poem — formed from memory, instinct, and imagination. We design to awaken what already exists, to stretch perception beyond the seen."
Image: https://framerusercontent.com/images/4ozF3bX5xrkGtsuXbDNpNTS7Bs.jpg

### 02 Beyond the Measured Line
Body: "Precision guides us, but not as a cage. We draw not to restrict, but to reveal — the silence between proportions, the dialogue between material and light. Every line holds a question; every shadow, an answer."
Image: https://framerusercontent.com/images/fmDMsww9kNQtwrweYpGqgMtmkjk.jpg

### 03 The Dialogue of Balance
Body: "To design is to converse — between wildness and order, chaos and control, intuition and method. Like a steady rain, or a story told beneath a tree, each project finds its rhythm in balance — never static, always alive."
Image: https://framerusercontent.com/images/utllKwemXVBHvKDDsgn8RNhB0.jpg

### 04 Human Reverence
Body: "Design begins where ego ends. We craft spaces that honour the human body — its pace, its breath, its need for belonging. Architecture, for us, is a gesture of humility — a place that receives, rather than commands."
Image: https://framerusercontent.com/images/Q8bmHzZaQIQyELQ0wK4xVmHx0I.jpg

## Responsive
- Desktop: accordion full width, image inside expands to the right
- Mobile: same accordion, image goes below text, full width
