"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CONTACT_PAGE } from "../data-contact";
import { activeQuestions, whatsappText, whatsappUrl, type Answers, type Question } from "./questions";

type Status = "idle" | "sending" | "success" | "error";

const FORM = CONTACT_PAGE.form;

const fieldClass =
  "w-full rounded-none border-0 border-b border-vs-fg bg-transparent p-3 font-inter text-[16px] leading-[1.5] font-normal text-vs-fg outline-none placeholder:text-vs-muted focus:border-vs-inverse";

/**
 * Hidden copy of the form for Netlify's build-time form detection (the real form posts
 * with fetch from client state). Lists every field the guided form can send.
 */
export function NetlifyFormDetection() {
  return (
    <form name={FORM.name} data-netlify="true" netlify-honeypot="bot-field" hidden>
      <input type="hidden" name="form-name" value={FORM.name} />
      <input type="text" name="bot-field" />
      {FORM.fieldNames.map((n) => (n === "message" ? <textarea key={n} name={n} /> : <input key={n} type="text" name={n} />))}
    </form>
  );
}

function OutlineButton({ children, disabled, onClick, type = "button" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-[8px] border border-vs-fg px-3 py-2 disabled:opacity-40 min-[810px]:w-[200px]"
    >
      <span
        aria-hidden="true"
        className="absolute top-[59.7px] left-1/2 h-[64.5px] w-[calc(100%+24px)] origin-top -translate-x-1/2 scale-[0.16] rounded-[8px] bg-vs-fg transition-[top,scale] duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)] group-hover:top-[-11.5px] group-hover:scale-100 group-disabled:hidden"
      />
      <span className="vs-label relative z-[1] whitespace-nowrap text-vs-fg transition-colors duration-300 group-hover:text-vs-bg group-disabled:text-vs-fg">
        {children}
      </span>
    </button>
  );
}

/**
 * Right column of Section - Form: a guided conversation, one question at a time.
 * Tapping an option moves on by itself; typed answers move on with Next or Enter.
 * The last step opens WhatsApp to the studio with every answer filled in, and keeps a copy
 * in Netlify Forms ("/", urlencoded, form-name=contact).
 */
export function ContactForm() {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const bot = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const questions = activeQuestions(answers);
  const q: Question = questions[Math.min(index, questions.length - 1)];
  const last = index >= questions.length - 1;

  // Focus the typed answer when its question appears (not on first load: no jump on page open)
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      return;
    }
    field.current?.focus({ preventScroll: true });
  }, [index]);

  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  const valid = (question: Question, a: Answers): string => {
    if (question.kind !== "whatsapp" && !question.optional && !(a[question.id] || "").trim()) return question.kind === "choice" ? "Please pick one." : "Please fill this in.";
    return "";
  };

  // WhatsApp must open inside the click (a popup opened after an await is blocked);
  // a copy goes to Netlify Forms in the background so the studio keeps a record.
  function send(a: Answers) {
    // If a blocker stops it, the thank-you screen has a plain link to WhatsApp.
    window.open(whatsappUrl(a), "_blank", "noopener,noreferrer");
    const body = new URLSearchParams({ "form-name": FORM.name, "bot-field": bot.current?.value || "" });
    for (const n of FORM.fieldNames) {
      const v = (a[n] || "").trim();
      if (v) body.append(n, v);
    }
    void fetch("/", { method: "POST", keepalive: true, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() }).catch(() => {});
    setStatus("success");
  }

  const next = (a: Answers = answers) => {
    const problem = valid(q, a);
    setError(problem);
    if (problem) return;
    // Re-read the question list: the first answer decides which questions follow
    const list = activeQuestions(a);
    const at = list.findIndex((x) => x.id === q.id);
    if (at >= list.length - 1) send(a);
    else setIndex(at + 1);
  };

  const choose = (value: string) => {
    const a = { ...answers, [q.id]: value };
    setAnswers(a);
    next(a);
  };

  const back = () => {
    setError("");
    setIndex((i) => Math.max(0, i - 1));
  };

  if (status === "success") {
    return (
      <div className="flex w-full flex-col gap-5" role="status" aria-live="polite">
        <span className="vs-label text-vs-muted">[ALMOST DONE]</span>
        <p className="vs-h5 text-vs-fg">Thank you{answers.name ? `, ${answers.name.trim().split(/\s+/)[0]}` : ""}.</p>
        <p className="vs-body text-vs-fg">{FORM.success}</p>
        <a href={whatsappUrl(answers)} target="_blank" rel="noopener noreferrer" className="vs-label text-vs-fg underline underline-offset-4">
          WhatsApp didn&apos;t open? Tap here
        </a>
      </div>
    );
  }

  return (
    <form
      name={FORM.name}
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        next();
      }}
      className="flex w-full flex-col gap-8"
    >
      <p className="hidden" aria-hidden="true">
        <label>
          Leave this empty: <input ref={bot} name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <span className="vs-label text-vs-muted tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
        </span>
        <span className="relative h-px flex-1 bg-vs-muted/40" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 bg-vs-fg transition-[width] duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset
          key={q.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: [0.3, 1, 0.5, 1] }}
          className="flex flex-col gap-6"
        >
          <legend className="vs-h5 mb-2 text-vs-fg">{q.title}</legend>
          {q.hint ? <p className="vs-body -mt-4 text-vs-muted">{q.hint}</p> : null}

          {q.kind === "choice" ? (
            <div className="flex flex-col gap-3" role="radiogroup" aria-label={q.title}>
              {q.options?.map((o) => {
                const on = answers[q.id] === o;
                return (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(o)}
                    className={`flex items-center justify-between rounded-[8px] border px-4 py-3 text-left font-inter text-[16px] transition-colors duration-200 ${
                      on ? "border-vs-fg bg-vs-fg text-vs-bg" : "border-vs-fg/40 text-vs-fg hover:border-vs-fg"
                    }`}
                  >
                    <span>{o}</span>
                    <span aria-hidden="true" className="vs-label">→</span>
                  </button>
                );
              })}
            </div>
          ) : q.kind === "whatsapp" ? (
            <pre className="vs-body whitespace-pre-wrap rounded-[8px] border border-vs-fg/30 p-4 font-inter text-[15px] text-vs-fg">{whatsappText(answers)}</pre>
          ) : q.kind === "textarea" ? (
            <textarea
              ref={field}
              aria-label={q.title}
              placeholder={q.placeholder}
              value={answers[q.id] || ""}
              onChange={(e) => set(q.id, e.target.value.slice(0, 2000))}
              className={`${fieldClass} h-[120px] resize-y`}
            />
          ) : (
            <input
              ref={field}
              type="text"
              aria-label={q.title}
              autoComplete={q.id === "name" ? "name" : "off"}
              placeholder={q.placeholder}
              value={answers[q.id] || ""}
              onChange={(e) => set(q.id, e.target.value.slice(0, 200))}
              className={`${fieldClass} h-12`}
            />
          )}
        </motion.fieldset>
      </AnimatePresence>

      <p role="alert" className="vs-body text-vs-fg empty:hidden">
        {error || (status === "error" ? FORM.error : "")}
      </p>

      <div className="flex items-center gap-6">
        {q.kind !== "choice" || last ? (
          <OutlineButton type="submit" disabled={status === "sending"}>
            {status === "sending" ? FORM.sending : last ? FORM.submit : q.optional && !(answers[q.id] || "").trim() ? "SKIP" : "NEXT"}
          </OutlineButton>
        ) : null}
        {index > 0 ? (
          <button type="button" onClick={back} className="vs-label text-vs-muted underline-offset-4 hover:text-vs-fg hover:underline">
            ← BACK
          </button>
        ) : null}
      </div>
    </form>
  );
}
