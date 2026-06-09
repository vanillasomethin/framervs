# TeamSection Specification

## Overview
- **Target file:** `src/components/TeamSection.tsx`
- **Interaction model:** static
- **Background:** #ebe8e5

## DOM Structure
```
section.team (bg: #ebe8e5)
  ├─ span.section-label ("[MEET THE TEAM]")
  ├─ p.team-intro
  └─ div.team-member
      ├─ img.member-photo
      └─ div.member-info
          ├─ blockquote.member-quote
          ├─ p.member-name
          └─ p.member-title
```

## Computed Styles

### section.team
- background: #ebe8e5
- padding: 80px 40px

### team-member
- display: flex
- gap: 60px
- align-items: flex-start
- @mobile: flex-direction: column

### member-photo
- width: 280px
- height: 340px
- object-fit: cover
- border-radius: 2px
- flex-shrink: 0

### member-quote
- font-size: clamp(16px, 1.5vw, 20px)
- color: #0d0d0d
- line-height: 1.7
- max-width: 600px
- font-style: italic
- margin-bottom: 32px

### member-name
- font-size: 18px
- font-weight: 700
- color: #0d0d0d

### member-title
- font-size: 13px
- color: #4d4d4d
- letter-spacing: 0.05em

## Content (verbatim)
- Section label: "[MEET THE TEAM]"
- Intro: "We're a collective of curious minds — architects, designers, and builders who thrive on collaboration and thoughtful design."
- Quote: "I believe good design begins by listening — to people, to place, and to purpose. Every line we draw should make life better, not just look beautiful. At Vanilla & Somethin', my focus is on creating spaces that feel intuitive, grounded, and quietly bold."
- Name: "Ar. Hisham Khalid"
- Title: "Principal Architect/Creative Strategist"
- Photo: https://framerusercontent.com/images/moM8ZORfvrX2YbDz00S2V55jZk0.jpg
