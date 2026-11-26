/**
 * FAQ answers exactly as the live page renders them: one `white-space: pre-wrap` paragraph per
 * answer, with the source's own line breaks and blank lines (read from the DOM 2026-11-20).
 * `data.ts` keeps the same copy as arrays, which loses the blank lines in answer 03 and the
 * trailing space in answer 10, so the accordion uses these strings. The COA address in
 * answer 10 is plain text on the source (not a link).
 */
export const FAQ_ANSWER_TEXT: string[] = [
  "You can book a session by filling out the contact form on my website or reaching out via email. Let me know your preferred date, location, and any specific ideas you have in mind.",
  "Yes.\nWe can manage everything — drawings, approvals, contractors, materials — or collaborate with your preferred team.",
  "It depends on size, scope, materials, and level of customization.\nAverage starting ranges (India):\n\nArchitecture / New builds: ₹2,500–₹6,000 per sq.ft\n\nInteriors: ₹1,800–₹4,000 per sq.ft\n\nWe share a rough estimate once we understand your requirements.",
  "Mostly, yes.\nWe’ll guide you on what’s possible and help adjust scope and materials to make things work.",
  "Materials → finishes → complexity.\nPremium marble, custom furniture, or structural changes increase cost.\nSimple layout + standard finishes = more budget-friendly.",
  "A contractor builds;\na design team plans, visualizes, optimizes space, and ensures everything works beautifully.\nIt saves time, mistakes, and rework costs.",
  "Yes — we can manage everything or collaborate with your preferred vendors.",
  "Renovations can take 2–4 months.\nNew builds can take 8–16 months.\nTimelines vary based on approvals, materials, and complexity.",
  "Absolutely.\nWe’ve successfully delivered projects across cities using virtual collaboration.",
  "We typically work with a percentage-based model or fixed slabs, depending on the scope ; as per Scale Of Charges set by the Council Of Architecture India \nhttps://coa.gov.in/index1.php?lang=1&level=2&&sublinkid=299&lid=86",
];
