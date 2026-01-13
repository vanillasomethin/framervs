(() => {
  const CMS_PATH = "/content.json";

  const escapeHTML = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const injectStyles = () => {
    if (document.getElementById("cms-dynamic-styles")) return;
    const style = document.createElement("style");
    style.id = "cms-dynamic-styles";
    style.textContent = `
      .cms-section {
        margin-top: 32px;
        display: grid;
        gap: 20px;
      }
      .cms-grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .cms-card {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.02);
      }
      .cms-card h4 {
        margin: 0 0 8px;
        font-size: 18px;
      }
      .cms-card p {
        margin: 4px 0;
        font-size: 14px;
        line-height: 1.4;
        opacity: 0.9;
      }
      .cms-team-card img {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 12px;
        object-fit: cover;
        aspect-ratio: 4 / 3;
      }
      .cms-contact-list {
        display: grid;
        gap: 8px;
        font-size: 14px;
      }
      .cms-contact-list a {
        color: inherit;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  };

  const setText = (element, value) => {
    if (!element || value == null) return;
    element.textContent = value;
  };

  const setLinkText = (link, value) => {
    if (!link || value == null) return;
    const textNodes = link.querySelectorAll(".framer-text");
    if (textNodes.length) {
      textNodes.forEach((node) => setText(node, value));
      return;
    }
    link.textContent = value;
  };

  const setSectionText = (section, selector, value) => {
    const target = section?.querySelector(selector);
    setText(target, value);
  };

  const setSectionTextByFramerName = (section, framerName, value) => {
    const target = section?.querySelector(`[data-framer-name="${framerName}"] .framer-text`) ||
      section?.querySelector(`[data-framer-name="${framerName}"]`);
    setText(target, value);
  };

  const updateProjectCards = (items = []) => {
    items.forEach((item, index) => {
      const card = document.querySelector(`#project-${index + 1}`);
      if (!card) return;

      card.querySelectorAll("a[href]").forEach((link) => {
        if (item.url) {
          link.setAttribute("href", item.url);
        }
      });

      card.querySelectorAll("img").forEach((img) => {
        if (item.image?.src) img.setAttribute("src", item.image.src);
        if (item.image?.srcset) img.setAttribute("srcset", item.image.srcset);
        if (item.image?.alt) img.setAttribute("alt", item.image.alt);
      });

      card.querySelectorAll("h4").forEach((title) => {
        setText(title, item.title);
      });

      const detailEls = card.querySelectorAll('p[data-styles-preset="mbtNsEJPb"]');
      detailEls.forEach((detail, detailIndex) => {
        detail.textContent = detailIndex % 2 === 0 ? item.client : item.category;
      });
    });
  };

  const renderServices = (section, services = []) => {
    if (!section || !services.length) return;
    let container = section.querySelector("#cms-services");
    if (!container) {
      container = document.createElement("div");
      container.id = "cms-services";
      container.className = "cms-section";
      section.appendChild(container);
    }

    container.innerHTML = `
      <div class="cms-grid">
        ${services
          .map(
            (service) => `
            <div class="cms-card">
              <h4>${escapeHTML(service.title)}</h4>
              <p><strong>${escapeHTML(service.category || "")}</strong></p>
              <p>${escapeHTML(service.description || "")}</p>
            </div>
          `
          )
          .join("")}
      </div>
    `;
  };

  const renderTeam = (section, team = []) => {
    if (!section || !team.length) return;
    let container = section.querySelector("#cms-team");
    if (!container) {
      container = document.createElement("div");
      container.id = "cms-team";
      container.className = "cms-section";
      section.appendChild(container);
    }

    container.innerHTML = `
      <div class="cms-grid">
        ${team
          .map(
            (member) => `
            <div class="cms-card cms-team-card">
              ${member.image ? `<img src="${escapeHTML(member.image)}" alt="${escapeHTML(member.name || "Team member")}">` : ""}
              <h4>${escapeHTML(member.name || "")}</h4>
              <p><strong>${escapeHTML(member.role || "")}</strong></p>
              <p>${escapeHTML(member.bio || "")}</p>
            </div>
          `
          )
          .join("")}
      </div>
    `;
  };

  const renderContact = (section, contact) => {
    if (!section || !contact) return;
    let container = section.querySelector("#cms-contact");
    if (!container) {
      container = document.createElement("div");
      container.id = "cms-contact";
      container.className = "cms-section";
      section.appendChild(container);
    }

    const locationLines = (contact.locations || []).map((loc) => escapeHTML(loc)).join("<br>");
    const socials = (contact.social || [])
      .map(
        (item) =>
          `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.label)}</a>`
      )
      .join(" · ");

    container.innerHTML = `
      <div class="cms-card">
        <div class="cms-contact-list">
          <div><strong>Phone:</strong> ${escapeHTML(contact.phone || "")}</div>
          <div><strong>Email:</strong> <a href="mailto:${escapeHTML(contact.email || "")}">${escapeHTML(
            contact.email || ""
          )}</a></div>
          <div><strong>Locations:</strong> ${locationLines}</div>
          <div><strong>Social:</strong> ${socials}</div>
        </div>
      </div>
    `;
  };

  const updateFooterContact = (contact) => {
    if (!contact) return;
    const phone = contact.phone || "";
    const email = contact.email || "";
    const locations = contact.locations || [];
    const social = contact.social || [];

    document.querySelectorAll('[data-framer-name="Contact Wrap"]').forEach((wrap) => {
      wrap.querySelectorAll('a[href^="tel:"]').forEach((link) => {
        if (phone) {
          link.setAttribute("href", `tel:${phone}`);
          setLinkText(link, phone);
        }
      });

      wrap
        .querySelectorAll('a[href^="mailto:"], a[href*="/cdn-cgi/l/email-protection"]')
        .forEach((link) => {
          if (email) {
            link.setAttribute("href", `mailto:${email}`);
            setLinkText(link, email);
          }
        });

      wrap.querySelectorAll("span.__cf_email__").forEach((node) => {
        if (email) {
          node.textContent = email;
        }
      });

      const locationLinks = wrap.querySelectorAll('[data-framer-name="Location"] a');
      locationLinks.forEach((link, index) => {
        if (locations[index]) {
          setLinkText(link, locations[index]);
        }
      });

      const socialLinks = wrap.querySelectorAll('[data-framer-name="Social"] a');
      socialLinks.forEach((link, index) => {
        const entry = social[index];
        if (!entry) return;
        if (entry.url) link.setAttribute("href", entry.url);
        setLinkText(link, entry.label);
      });
    });
  };

  const updateTeamPage = (cms) => {
    const teamSection = document.querySelector('[data-framer-name="Section - Team"]');
    if (!teamSection) return;
    const pageTitle = cms.teamPage?.title || cms.homepage?.team?.title;
    const pageSubtitle = cms.teamPage?.subtitle || cms.homepage?.team?.subtitle;
    setSectionTextByFramerName(teamSection, "TEAM", pageTitle);
    setSectionTextByFramerName(teamSection, "Team intro", pageSubtitle);

    const teamList = teamSection.querySelector('[data-framer-name="Team List"]');
    if (teamList) {
      teamList.innerHTML = "";
      renderTeam(teamList, cms.team);
    }
  };

  const updateStaticText = (cms) => {
    const aboutSection = document.querySelector("#section-about");
    setSectionTextByFramerName(aboutSection, "About", cms.homepage?.about?.title);
    setSectionText(aboutSection, '[data-framer-name^="Lorem ipsum"] .framer-text', cms.homepage?.about?.subtitle);

    const worksSection = document.querySelector("#section-works");
    setSectionTextByFramerName(worksSection, "Selected Works", cms.homepage?.caseStudies?.title);
    setSectionText(worksSection, '[data-framer-name^="Lorem ipsum"] .framer-text', cms.homepage?.caseStudies?.subtitle);

    const servicesSection = document.querySelector("#section-awards");
    setSectionText(servicesSection, 'h2.framer-text', cms.homepage?.services?.title);
    setSectionText(servicesSection, '[data-framer-name^="Lorem ipsum"] .framer-text', cms.homepage?.services?.subtitle);

    const teamSection = document.querySelector("#section-testimonials");
    if (teamSection) {
      const heading = teamSection.querySelector('h2.framer-text');
      setText(heading, cms.homepage?.team?.title);
      setSectionText(teamSection, '[data-framer-name^="Lorem ipsum"] .framer-text', cms.homepage?.team?.subtitle);
    }

    const heroSection = document.querySelector("#section-hero");
    if (heroSection) {
      const heroText = heroSection.querySelector('[data-framer-name="Medium length hero headline goes here"] .framer-text') ||
        heroSection.querySelector('[data-framer-name="Medium length hero headline goes here"]');
      setText(heroText, cms.homepage?.hero?.headline);
    }
  };

  const load = async () => {
    try {
      const response = await fetch(CMS_PATH, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.cms) return;

      injectStyles();
      updateStaticText(data.cms);
      updateProjectCards(data.cms.caseStudies);

      renderServices(document.querySelector("#section-awards"), data.cms.services);
      renderTeam(document.querySelector("#section-testimonials"), data.cms.team);
      renderContact(document.querySelector('[data-framer-name="Section - Contact"]'), data.cms.contact);
      updateFooterContact(data.cms.contact);
      updateTeamPage(data.cms);
    } catch (error) {
      console.warn("CMS loader failed", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
