"use client";

import { useState } from "react";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 0",
    border: "none",
    borderBottom: "1px solid rgba(13,13,13,0.2)",
    background: "transparent",
    fontFamily: "var(--font-sans)",
    fontSize: "15px",
    color: "#0d0d0d",
    outline: "none",
    display: "block",
    marginBottom: "16px",
    boxSizing: "border-box",
  };

  return (
    <section
      style={{
        background: "#ebe8e5",
        padding: "80px 40px 0",
      }}
    >
      {/* Decorative tagline */}
      <p
        style={{
          fontSize: "clamp(18px, 2.5vw, 32px)",
          letterSpacing: "0.05em",
          color: "#0d0d0d",
          textAlign: "center",
          padding: "0 40px 60px",
          margin: 0,
        }}
      >
        Big plans? Small questions? We&apos;re listening.
      </p>

      {/* Grid */}
      <div
        className="contact-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          marginBottom: "80px",
        }}
      >
        {/* Left — Form */}
        <div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#4d4d4d",
            }}
          >
            [GET STARTED]
          </span>
          <p
            style={{
              fontSize: "16px",
              color: "#4d4d4d",
              margin: "16px 0 32px",
            }}
          >
            Tell us about your idea, your vision, or just say hi.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              style={inputStyle}
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
            />
            <textarea
              style={{
                ...inputStyle,
                minHeight: "100px",
                resize: "none",
                marginBottom: "0",
              }}
              name="message"
              placeholder="Tell us about your project"
              value={form.message}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="contact-submit"
              style={{
                marginTop: "24px",
                padding: "13px 28px",
                background: "#0d0d0d",
                color: "#ebe8e5",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                borderRadius: "2px",
                transition: "background 0.2s",
              }}
            >
              SEND A MESSAGE
            </button>
          </form>
        </div>

        {/* Right — Info */}
        <div>
          {/* CONTACT */}
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#adadad",
                marginBottom: "8px",
                margin: "0 0 8px",
              }}
            >
              CONTACT
            </p>
            <div style={{ fontSize: "15px", color: "#0d0d0d", lineHeight: 1.8 }}>
              <a
                href="tel:+917411349844"
                style={{ display: "block", color: "inherit", textDecoration: "none" }}
              >
                +91 7411 34 9844
              </a>
              <a
                href="mailto:hello@vanillasometh.in"
                style={{ display: "block", color: "inherit", textDecoration: "none" }}
              >
                hello@vanillasometh.in
              </a>
            </div>
          </div>

          {/* LOCATION */}
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#adadad",
                margin: "0 0 8px",
              }}
            >
              LOCATION
            </p>
            <p style={{ fontSize: "15px", color: "#0d0d0d", lineHeight: 1.8, margin: 0 }}>
              MANGALORE, INDIA
            </p>
          </div>

          {/* SOCIAL */}
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#adadad",
                margin: "0 0 8px",
              }}
            >
              SOCIAL
            </p>
            <div style={{ display: "flex", gap: "16px", fontSize: "15px", color: "#0d0d0d", lineHeight: 1.8 }}>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>INSTAGRAM</a>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>PINTEREST</a>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>LINKEDIN</a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(13,13,13,0.1)",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          margin: "0 -40px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          VANILLA&amp;SOMETHIN&apos;
        </span>
        <span style={{ fontSize: "12px", color: "#adadad" }}>
          Made with ♥ by Hisham Khalid
        </span>
        <span style={{ fontSize: "12px", color: "#4d4d4d" }}>
          © 2026 All rights reserved.
        </span>
      </div>

      <style>{`
        .contact-submit:hover {
          background: #380100 !important;
        }
        @media (max-width: 700px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
