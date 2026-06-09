"use client";

import { useState } from "react";

interface Service {
  number: string;
  title: string;
  tag: string;
  bullets: string;
}

const services: Service[] = [
  { number: "01", title: "Architectural Design", tag: "Core", bullets: "Concept Development · Schematic Design · Design Development · Construction Documentation · Sustainable & Passive Design · 3D Visualization" },
  { number: "02", title: "Interior Design", tag: "Bespoke", bullets: "Space Planning · Material & Finishes · Furniture & Joinery · Fit-out Drawings · Styling & Staging" },
  { number: "03", title: "Landscape Design", tag: "Core", bullets: "Master Planning · Hardscape Design · Planting Plans · Irrigation · Lighting · Maintenance Guidelines" },
  { number: "04", title: "Urban & Master Planning", tag: "Strategic", bullets: "Site Analysis · Feasibility Studies · Zoning & Regulations · Infrastructure Planning · Smart City Integration" },
  { number: "05", title: "BIM & Digital Design", tag: "Advanced", bullets: "BIM Modeling · Clash Detection · As-Built Models · Parametric Design · Digital Twin · Automation" },
  { number: "06", title: "Visualization & Communication", tag: "Advanced", bullets: "3D Modeling · Rendering · VR Walkthroughs · Animations · Diagrams · Presentations" },
  { number: "07", title: "Furniture & Product Design", tag: "Bespoke", bullets: "Bespoke Furniture · Product Prototyping · Material Research · Ergonomic & Sustainable Design" },
  { number: "08", title: "Heritage & Conservation", tag: "Specialized", bullets: "Documentation · Measured Drawings · Adaptive Reuse · Restoration · Material Conservation" },
  { number: "09", title: "Design Research & Innovation", tag: "Experimental", bullets: "Material Innovation · Computational Design · Sustainability & Circular Design · Prototyping · Testing" },
  { number: "10", title: "Authority Approvals & Compliance", tag: "Essential", bullets: "Permitting · Regulatory Compliance · Fire & Safety · Consultant Coordination · Green Building Docs" },
  { number: "11", title: "Project Management & Execution Support", tag: "Core", bullets: "Design Supervision · Consultant Coordination · Site Inspections · Tender Docs · Post-Occupancy Evaluation" },
  { number: "12", title: "Future-Ready Solutions", tag: "Experimental", bullets: "Smart Building Integration · Net-Zero / Energy Modeling · Digital Fabrication · Modular Systems · AR/VR · AI Design Integration" },
];

export function ServicesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      style={{
        background: "#0d0d0d",
        padding: "80px 40px",
        color: "#ebe8e5",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-fragment-mono)",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#adadad",
        }}
      >
        [SERVICES]
      </span>

      <p
        style={{
          fontSize: "16px",
          color: "#adadad",
          maxWidth: "480px",
          margin: "16px 0 48px",
          lineHeight: "1.6",
        }}
      >
        Each service is an extension of our design ethos — thoughtful, future-ready, and driven by the pursuit of timeless spatial quality.
      </p>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          borderTop: "1px solid rgba(235,232,229,0.1)",
        }}
      >
        {services.map((service, index) => {
          const isOpen = openIndex === index;
          return (
            <li
              key={service.number}
              style={{
                borderBottom: "1px solid rgba(235,232,229,0.1)",
              }}
            >
              <button
                onClick={() => toggle(index)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "20px",
                  width: "100%",
                  padding: "22px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#ebe8e5",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-fragment-mono)",
                    fontSize: "12px",
                    color: "#adadad",
                    minWidth: "28px",
                    textAlign: "left",
                  }}
                >
                  {service.number}
                </span>
                <span
                  style={{
                    fontSize: "17px",
                    fontWeight: 500,
                    color: "#ebe8e5",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {service.title}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#adadad",
                    background: "rgba(235,232,229,0.07)",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {service.tag}
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#adadad",
                    marginLeft: "16px",
                    transition: "transform 0.3s ease",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                >
                  +
                </span>
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.3s ease",
                  overflow: "hidden",
                }}
              >
                <div style={{ minHeight: 0 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#adadad",
                      lineHeight: "1.8",
                      padding: "0 0 20px 48px",
                      margin: 0,
                    }}
                  >
                    {service.bullets}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
