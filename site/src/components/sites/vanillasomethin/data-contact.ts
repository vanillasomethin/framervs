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
    /** Netlify form name; the hidden detection form in the page uses the same name and fields. */
    name: "contact",
    fields: [
      { name: "name", label: "Name", type: "text", placeholder: "" },
      { name: "email", label: "Email", type: "email", placeholder: "" },
      { name: "message", label: "Message", type: "textarea", placeholder: "Your message..." },
    ],
    submit: "SUBMIT",
    sending: "SENDING...",
    success: "Thank you. Your message has been sent, we will get back to you soon.",
    error: "Something went wrong and your message was not sent. Please try again, or email hello@vanillasometh.in.",
  },
} as const;
