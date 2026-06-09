# ProcessSection Specification

## Overview
- **Target file:** `src/components/ProcessSection.tsx`
- **Interaction model:** static — 4 numbered steps
- **Background:** #ebe8e5

## DOM Structure
```
section.process (bg: #ebe8e5)
  ├─ div.process-header
  │   ├─ span.section-label ("[GET STARTED]")
  │   └─ p.process-intro ("A simple, transparent process...")
  └─ div.process-steps (grid 2x2 or 4-col)
      ├─ div.step × 4
```

## Step Structure
```
div.step
  ├─ span.step-number ("01")
  ├─ h3.step-title ("Connect")
  └─ p.step-desc (description)
```

## Computed Styles

### section.process
- background: #ebe8e5
- padding: 80px 40px

### process-steps
- display: grid
- grid-template-columns: repeat(4, 1fr) desktop, repeat(2, 1fr) tablet, 1fr mobile
- gap: 40px
- margin-top: 60px
- border-top: 1px solid rgba(13,13,13,0.15)
- padding-top: 48px

### step-number
- font-family: Fragment Mono
- font-size: 12px
- color: #adadad
- display: block
- margin-bottom: 16px

### step-title
- font-size: 22px
- font-weight: 700
- color: #0d0d0d
- margin-bottom: 12px

### step-desc
- font-size: 14px
- color: #4d4d4d
- line-height: 1.6

## Steps Content (verbatim)
01 | Connect
"Share your project goals, vision, and requirements. A quick email or call helps us understand what you're looking to create."

02 | Define
"We discuss your needs, develop a tailored proposal, and outline the scope, timeline, and deliverables — ensuring full clarity before we begin."

03 | Design
"Through research, sketches, and 3D visualization, ideas evolve into tangible design concepts. You'll see your vision take form with each iteration."

04 | Deliver
"We finalize drawings, coordinate execution, and stay involved through completion — ensuring the design is built true to intent."

## Intro text
"[GET STARTED]"
"A simple, transparent process that turns your ideas into built reality — step by step."
