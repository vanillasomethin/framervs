# VideoSection Specification

## Overview
- **Target file:** `src/components/VideoSection.tsx`
- **Interaction model:** static — autoplay video background
- **Background:** #0d0d0d

## DOM Structure
```
section.video-section (full width, relative)
  ├─ video.bg-video (absolute, covers full section)
  └─ div.video-overlay-text
      └─ p.video-quote ("I CAPTURE MOMENTS THAT CAN'T BE REPEATED.")
```

## Computed Styles

### section.video-section
- position: relative
- width: 100%
- min-height: 70vh
- overflow: hidden
- display: flex
- align-items: center
- justify-content: center

### bg-video
- position: absolute
- top: 0
- left: 0
- width: 100%
- height: 100%
- object-fit: cover
- opacity: 0.6
- z-index: 0
- attributes: autoplay, loop, muted, playsinline

### video-overlay-text
- position: relative
- z-index: 1
- text-align: center
- padding: 40px

### video-quote
- font-family: Space Grotesk (or The Seasons Bold)
- font-size: clamp(24px, 4vw, 58px)
- font-weight: 700
- color: #ebe8e5
- letter-spacing: 0.05em
- text-transform: uppercase
- max-width: 900px

## Assets
- Video: https://framerusercontent.com/assets/CVfrcDb1myaxy6wASsKtiRWSM.mp4

## Text Content (verbatim)
"I CAPTURE MOMENTS THAT CAN'T BE REPEATED."

## Responsive
- Mobile: font scales down, video still covers full width
