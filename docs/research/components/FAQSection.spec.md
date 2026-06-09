# FAQSection Specification

## Overview
- **Target file:** `src/components/FAQSection.tsx`
- **Interaction model:** CLICK-driven accordion — 10 questions, all closed by default
- **Background:** #ebe8e5

## DOM Structure
```
section.faq (bg: #ebe8e5)
  ├─ span.section-label ("[FREQUENTLY ASKED QUESTIONS]")
  ├─ p.faq-intro
  └─ div.faq-list
      └─ div.faq-item × 10 (accordion)
```

## FAQ Item Structure
```
div.faq-item
  ├─ button.faq-trigger
  │   ├─ span.faq-number
  │   ├─ span.faq-question
  │   └─ span.faq-icon
  └─ div.faq-answer (hidden until open)
```

## Computed Styles

### section.faq
- background: #ebe8e5
- padding: 80px 40px

### faq-intro
- font-size: 16px
- color: #4d4d4d
- max-width: 560px
- margin-bottom: 48px

### faq-item
- border-top: 1px solid rgba(13,13,13,0.15)

### faq-trigger
- width: 100%
- display: flex
- align-items: center
- gap: 20px
- padding: 24px 0
- text-align: left
- background: none
- border: none
- cursor: pointer

### faq-number
- font-family: Fragment Mono
- font-size: 12px
- color: #adadad
- min-width: 24px

### faq-question
- font-size: 16px
- font-weight: 500
- color: #0d0d0d
- flex: 1

### faq-icon
- font-size: 20px
- color: #adadad
- margin-left: auto

### faq-answer
- overflow: hidden
- transition: height 0.4s ease
- padding: 0 0 24px 44px
- font-size: 15px
- color: #4d4d4d
- line-height: 1.7
- max-width: 700px

## FAQ Content (verbatim)

01 | How do I start a project with you?
Answer: Reach out via our contact form or email hello@vanillasometh.in with a brief description of your project. We'll schedule an introductory call to understand your vision and see if we're a good fit.

02 | Do you handle execution as well?
Answer: Yes — we offer design supervision and site coordination through construction. Our involvement ensures the design intent is faithfully executed.

03 | How much will my project cost?
Answer: Costs vary widely depending on project type, size, location, and quality of finishes. Our estimator tool gives a rough range. For a precise quote, contact us with your brief.

04 | Can you work within my budget?
Answer: Absolutely. We're experienced at designing beautifully within constraints. Share your budget upfront and we'll tailor our approach accordingly.

05 | What affects the cost the most?
Answer: Site complexity, material choices, scope of services (design-only vs. full execution), and finishing quality are the biggest cost drivers.

06 | Do I need a design team? Why not just hire a contractor?
Answer: A design team brings vision, coordination, and problem-solving that contractors aren't trained for. We ensure the end result matches the intent — not just the drawing.

07 | Do you help with materials + contractors?
Answer: Yes — we provide material specifications, help with contractor selection, and coordinate between trades to keep the project on track.

08 | How long will the project take?
Answer: Timelines depend on project size and complexity. A residential interior typically takes 2–4 months for design and 3–6 months for execution. We'll give a detailed timeline in the proposal.

09 | Can we work together remotely?
Answer: Absolutely. We've worked with clients across India and internationally. Video calls, cloud collaboration, and regular updates keep things running smoothly.

10 | What's your fee structure?
Answer: We typically charge a fixed design fee or a percentage of project cost, depending on scope. Full transparency — no surprise charges. Detailed in our proposal.

## Intro Text (verbatim)
"If you're curious about how we work, timelines, budgets, or what to expect when you start a project with us — this is a good place to begin. No jargon. No over-complication. Just straight answers."
