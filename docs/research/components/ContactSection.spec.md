# ContactSection + Footer Specification

## Overview
- **Target file:** `src/components/ContactSection.tsx`
- **Interaction model:** static form
- **Background:** #ebe8e5

## DOM Structure
```
section.contact (bg: #ebe8e5)
  ├─ div.contact-tagline (decorative spaced text)
  ├─ div.contact-grid (two-column)
  │   ├─ div.contact-form-wrap
  │   │   ├─ span.section-label ("[GET STARTED]")
  │   │   ├─ p.form-cta ("Tell us about your idea...")
  │   │   └─ form.contact-form
  │   │       ├─ input[name]
  │   │       ├─ input[email]
  │   │       ├─ textarea[message]
  │   │       └─ button[submit] ("SEND A MESSAGE")
  │   └─ div.contact-info
  │       ├─ div.contact-item (CONTACT: phone, email)
  │       ├─ div.contact-item (LOCATION)
  │       └─ div.contact-item (SOCIAL: Instagram, Pinterest, LinkedIn)
  └─ footer.footer
      ├─ span.footer-logo ("VANILLA&SOMETHIN'")
      ├─ span.footer-credit ("Made with Framer by Hisham Khalid")
      └─ span.footer-copy ("© 2026 All rights reserved.")
```

## Computed Styles

### section.contact
- background: #ebe8e5
- padding: 80px 40px

### contact-tagline
- font-family: Space Grotesk (or The Seasons Bold for display)
- font-size: clamp(16px, 2vw, 26px)
- letter-spacing: 0.2em
- color: #0d0d0d
- text-align: center
- padding: 40px 0 60px

### contact-grid
- display: grid
- grid-template-columns: 1fr 1fr
- gap: 80px
- @mobile: grid-template-columns: 1fr

### form inputs
- width: 100%
- padding: 14px 0
- border: none
- border-bottom: 1px solid rgba(13,13,13,0.2)
- background: transparent
- font-family: Space Grotesk
- font-size: 15px
- color: #0d0d0d
- outline: none
- display: block
- margin-bottom: 8px

### textarea
- min-height: 100px
- resize: none

### form submit button
- margin-top: 32px
- padding: 14px 32px
- background: #0d0d0d
- color: #ebe8e5
- font-size: 12px
- letter-spacing: 0.1em
- text-transform: uppercase
- font-weight: 500
- border: none
- cursor: pointer
- border-radius: 2px
- hover: background #380100

### contact-item label
- font-family: Fragment Mono
- font-size: 11px
- letter-spacing: 0.1em
- text-transform: uppercase
- color: #adadad
- margin-bottom: 8px

### contact-item value
- font-size: 15px
- color: #0d0d0d
- line-height: 1.6

### footer
- border-top: 1px solid rgba(13,13,13,0.1)
- padding: 24px 40px
- display: flex
- justify-content: space-between
- align-items: center
- font-size: 12px
- color: #4d4d4d

## Text Content (verbatim)
- Tagline: "Big plans? Small questions? We're listening."
- Form CTA: "Tell us about your idea, your vision, or just say hi."
- Submit button: "SEND A MESSAGE"
- Contact label: "CONTACT"
- Phone: "+91 7411 34 9844"
- Email: "hello@vanillasometh.in"
- Location label: "LOCATION"
- Location: "MANGALORE, INDIA"
- Social label: "SOCIAL"
- Social links: INSTAGRAM, PINTEREST, LINKEDIN
- Footer logo: "VANILLA&SOMETHIN'"
- Footer credit: "Made with Framer by Hisham Khalid"
- Footer copyright: "© 2026 All rights reserved."

## Responsive
- Mobile: single column, form stacks above info
