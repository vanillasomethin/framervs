# ServicesSection Specification

## Overview
- **Target file:** `src/components/ServicesSection.tsx`
- **Interaction model:** CLICK-driven accordion — 12 services
- **Background:** #0d0d0d (dark)

## DOM Structure
```
section.services (bg: #0d0d0d)
  ├─ div.services-header
  │   └─ span.section-label ("[SERVICES]")
  │   └─ p.services-intro ("Each service is an extension of our design ethos...")
  └─ div.services-list
      └─ div.service-item × 12 (accordion items)
```

## Service Item Structure
```
div.service-item
  ├─ button.service-trigger
  │   ├─ span.service-number ("01")
  │   ├─ span.service-title ("Architectural Design")
  │   ├─ span.service-tag ("Core" | "Bespoke" | "Advanced" | "Essential" | "Experimental" | "Specialized" | "Strategic" | "Support")
  │   └─ span.icon ("+" / "−")
  └─ div.service-content (height-animated)
      └─ p.service-bullets (bullet list of sub-services)
```

## Computed Styles

### section.services
- background: #0d0d0d
- padding: 80px 40px
- color: #ebe8e5

### section-label
- color: #adadad

### services-intro
- font-size: 16px
- color: #adadad
- max-width: 480px

### service-item
- border-top: 1px solid rgba(235,232,229,0.1)
- padding: 0

### service-trigger
- display: flex
- align-items: center
- gap: 20px
- width: 100%
- padding: 24px 0
- background: none
- border: none
- cursor: pointer
- color: #ebe8e5

### service-number
- font-family: Fragment Mono
- font-size: 12px
- color: #adadad
- min-width: 24px

### service-title
- font-size: 18px
- font-weight: 500
- flex: 1

### service-tag
- font-size: 10px
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #adadad
- background: rgba(235,232,229,0.08)
- padding: 4px 10px
- border-radius: 20px

### service-content
- overflow: hidden
- transition: height 0.4s ease

### service-bullets
- font-size: 14px
- color: #adadad
- line-height: 1.7
- padding: 0 0 24px 44px
- Content: comma-separated items as bullet points

## Services Data (verbatim)

01 | Architectural Design | Core
Concept Development · Schematic Design · Design Development · Construction Documentation · Sustainable & Passive Design · 3D Visualization

02 | Interior Design | Bespoke
Space Planning · Material & Finishes · Furniture & Joinery · Fit-out Drawings · Styling & Staging

03 | Landscape Design | Core
Master Planning · Hardscape Design · Planting Plans · Irrigation · Lighting · Maintenance Guidelines

04 | Urban & Master Planning | Strategic
Site Analysis · Feasibility Studies · Zoning & Regulations · Infrastructure Planning · Smart City Integration

05 | BIM & Digital Design | Advanced
BIM Modeling · Clash Detection · As-Built Models · Parametric Design · Digital Twin · Automation

06 | Visualization & Communication | Advanced
3D Modeling · Rendering · VR Walkthroughs · Animations · Diagrams · Presentations

07 | Furniture & Product Design | Bespoke
Bespoke Furniture · Product Prototyping · Material Research · Ergonomic & Sustainable Design

08 | Heritage & Conservation | Specialized
Documentation · Measured Drawings · Adaptive Reuse · Restoration · Material Conservation

09 | Design Research & Innovation | Experimental
Material Innovation · Computational Design · Sustainability & Circular Design · Prototyping · Testing

10 | Authority Approvals & Compliance | Essential
Permitting · Regulatory Compliance · Fire & Safety · Consultant Coordination · Green Building Docs

11 | Project Management & Execution Support | Core
Design Supervision · Consultant Coordination · Site Inspections · Tender Docs · Post-Occupancy Evaluation

12 | Future-Ready Solutions | Experimental
Smart Building Integration · Net-Zero / Energy Modeling · Digital Fabrication · Modular Systems · AR/VR · AI Design Integration

## Text Content
- Section label: "[SERVICES]"
- Intro: "Each service is an extension of our design ethos — thoughtful, future-ready, and driven by the pursuit of timeless spatial quality."

## Responsive
- Same accordion on mobile, full width
