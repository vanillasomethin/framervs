"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_PAGE } from "../data-contact";

type Status = "idle" | "sending" | "success" | "error";

const FORM = CONTACT_PAGE.form;

const fieldClass =
  "w-full rounded-none border-0 border-b border-vs-fg bg-transparent p-3 font-inter text-[16px] leading-[1.5] font-normal text-vs-muted outline-none placeholder:text-vs-muted focus:border-vs-inverse";

/**
 * Hidden copy of the form for Netlify's build-time form detection (the real form posts
 * with fetch, so it is client-rendered state). Same name and field names as ContactForm.
 */
export function NetlifyFormDetection() {
  return (
    <form name={FORM.name} data-netlify="true" netlify-honeypot="bot-field" hidden>
      <input type="hidden" name="form-name" value={FORM.name} />
      <input type="text" name="bot-field" />
      {FORM.fields.map((f) =>
        f.type === "textarea" ? <textarea key={f.name} name={f.name} /> : <input key={f.name} type={f.type} name={f.name} />,
      )}
    </form>
  );
}

/**
 * Right column of Section - Form. Name / Email / Message with a 1px underline, 40px apart;
 * SUBMIT uses the site's outline-button hover (fg blob rising from below).
 * Posts to Netlify Forms ("/", urlencoded, form-name=contact). Never posts to Framer.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string") body.append(key, value);
    });
    setStatus("sending");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      name={FORM.name}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-10"
    >
      <input type="hidden" name="form-name" value={FORM.name} />
      <p className="hidden" aria-hidden="true">
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      {FORM.fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-5">
          <span className="vs-body text-vs-fg">{f.label}</span>
          {f.type === "textarea" ? (
            <textarea name={f.name} required placeholder={f.placeholder} className={`${fieldClass} h-[100px] resize-y`} />
          ) : (
            <input name={f.name} type={f.type} required placeholder={f.placeholder} className={`${fieldClass} h-12`} />
          )}
        </label>
      ))}
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-[8px] border border-vs-fg px-3 py-2 disabled:opacity-60 min-[810px]:w-[200px]"
        >
          <span
            aria-hidden="true"
            className="absolute top-[59.7px] left-1/2 h-[64.5px] w-[calc(100%+24px)] origin-top -translate-x-1/2 scale-[0.16] rounded-[8px] bg-vs-fg transition-[top,scale] duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)] group-hover:top-[-11.5px] group-hover:scale-100"
          />
          <span className="vs-label relative z-[1] whitespace-nowrap text-vs-fg transition-colors duration-300 group-hover:text-vs-bg">
            {status === "sending" ? FORM.sending : FORM.submit}
          </span>
        </button>
        <p role="status" aria-live="polite" className="vs-body text-vs-fg empty:hidden">
          {status === "success" ? FORM.success : status === "error" ? FORM.error : ""}
        </p>
      </div>
    </form>
  );
}
