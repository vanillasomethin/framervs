// Copy for the /contact/ page, as rendered on https://vanillasomethin.framer.website/contact
// (source quirks kept: the phone number here differs from the footer's, links carry " |").

export const CONTACT_PAGE = {
  headline: "GET IN TOUCH",
  intro: "Tell me about your idea, your vision, or just say hi.",
  groups: [
    {
      label: "[CONTACT]",
      separator: ",",
      links: [
        { label: "+91 7411 32 4448", href: "tel:+917411324448", external: false },
        { label: "HELLO@VANILLASOMETH.IN", href: "mailto:HELLO@VANILLASOMETH.IN", external: false },
      ],
    },
    {
      label: "[LOCATION]",
      separator: null,
      links: [
        { label: "MANGALORE, INDIA |", href: "https://maps.app.goo.gl/W2b5YT7XH658UqPa9", external: true },
        { label: "RIYADH,SAUDI ARABIA", href: "https://maps.app.goo.gl/W2b5YT7XH658UqPa9", external: true },
      ],
    },
    {
      label: "[SOCIAL]",
      separator: null,
      links: [
        { label: "LINKEDIN |", href: "https://www.linkedin.com/company/vanilla-and-somethin", external: true },
        { label: "PINTEREST |", href: "https://www.pinterest.com/vanillaandsomethin", external: true },
        { label: "INSTAGRAM", href: "https://www.instagram.com/vanillasometh.in/", external: true },
      ],
    },
  ],
  form: {
    /** Netlify form name; the hidden detection form in the page lists every field below. */
    name: "contact",
    /** Every field the guided form can send (Netlify drops fields its detection form lacks). */
    fieldNames: ["intent", "location", "stage", "timeline", "budget", "message", "name"],
    submit: "SEND ON WHATSAPP",
    sending: "OPENING WHATSAPP...",
    success: "WhatsApp should have opened with your message. Press send there and we will reply within a working day.",
    error: "Something went wrong and your message was not sent. Please try again, or email hello@vanillasometh.in.",
  },
} as const;
