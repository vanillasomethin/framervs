// The guided contact form: one question at a time. A question with `when` is only
// asked if that returns true for the answers so far; "Just looking" skips the
// project questions and goes straight to how to reach the visitor.

export type Answers = Record<string, string>;

export type Question = {
  id: string;
  title: string;
  hint?: string;
  kind: "choice" | "text" | "textarea" | "whatsapp";
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  when?: (a: Answers) => boolean;
};

export const JUST_LOOKING = "Just looking around";
const isProject = (a: Answers) => Boolean(a.intent) && a.intent !== JUST_LOOKING;

export const QUESTIONS: Question[] = [
  {
    id: "intent",
    title: "What brings you here today?",
    kind: "choice",
    options: [
      JUST_LOOKING,
      "Building my dream home",
      "Renovating or preserving a home",
      "Designing interiors",
      "A commercial space (office, cafe, retail)",
      "Something else",
    ],
  },
  { id: "location", title: "Where is the project?", hint: "A city or area is enough.", kind: "text", placeholder: "e.g. Kadri, Mangalore", optional: true, when: isProject },
  {
    id: "stage",
    title: "Where are you with it right now?",
    kind: "choice",
    options: ["Just an idea", "I have the land or property", "I have drawings already", "Ready to start building"],
    when: isProject,
  },
  {
    id: "timeline",
    title: "When would you like to start?",
    kind: "choice",
    options: ["Within 3 months", "3 to 6 months", "6 to 12 months", "Not sure yet"],
    when: isProject,
  },
  {
    id: "budget",
    title: "Do you have a budget in mind?",
    hint: "A rough range helps us suggest what's possible.",
    kind: "choice",
    options: ["Under ₹25 lakh", "₹25 to 50 lakh", "₹50 lakh to 1 crore", "Above ₹1 crore", "Not sure yet"],
    when: isProject,
  },
  {
    id: "message",
    title: "Anything else you'd like us to know?",
    kind: "textarea",
    placeholder: "Rooms, style, a must-have, or just say hi.",
    optional: true,
  },
  { id: "name", title: "What should we call you?", kind: "text", placeholder: "Your name" },
  { id: "send", title: "Send this across to the studio", hint: "It opens WhatsApp with your answers filled in. Just press send.", kind: "whatsapp" },
];

export const activeQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.when || q.when(a));

export const STUDIO_WHATSAPP = "917411324448";

const LABELS: Record<string, string> = {
  intent: "Looking for",
  location: "Where",
  stage: "Stage",
  timeline: "Start",
  budget: "Budget",
  message: "Notes",
};

/** The WhatsApp message: a greeting with the visitor's name, then each answer on its own line. */
export const whatsappText = (a: Answers) => {
  const lines = [`Hi Vanilla & Somethin', I'm ${(a.name || "").trim() || "getting in touch"}.`];
  for (const [k, label] of Object.entries(LABELS)) {
    const v = (a[k] || "").trim();
    if (v) lines.push(`${label}: ${v}`);
  }
  return lines.join("\n");
};

export const whatsappUrl = (a: Answers) => `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(whatsappText(a))}`;
