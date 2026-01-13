(() => {
  const ADMIN_PASSWORD = "Somethin@22";
  const LOGIN_KEY = "cmsAdminLoggedIn";
  const CONTENT_PATH = "/content.json";

  const state = {
    rawContent: null,
    cms: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const showStatus = (message, isError = false) => {
    const status = $("#save-status");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#ff8b8b" : "#9bdc9b";
  };

  const fetchContent = async () => {
    const response = await fetch(CONTENT_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load content.json");
    const data = await response.json();
    state.rawContent = data;
    state.cms = data.cms || {
      homepage: {},
      team: [],
      services: [],
      caseStudies: [],
      contact: {},
    };
  };

  const createListItem = (fields, onRemove) => {
    const wrapper = document.createElement("div");
    wrapper.className = "list-item";
    const grid = document.createElement("div");
    grid.className = "grid";

    fields.forEach((field) => {
      const container = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = field.label;
      const input = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
      if (field.type && field.type !== "textarea") input.type = field.type;
      input.value = field.value || "";
      input.dataset.key = field.key;
      container.appendChild(label);
      container.appendChild(input);
      grid.appendChild(container);
    });

    const actionRow = document.createElement("div");
    actionRow.className = "action-row";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", onRemove);
    actionRow.appendChild(removeButton);

    wrapper.appendChild(grid);
    wrapper.appendChild(actionRow);
    return wrapper;
  };

  const renderTeam = () => {
    const list = $("#team-list");
    list.innerHTML = "";
    state.cms.team.forEach((member, index) => {
      const item = createListItem(
        [
          { label: "Name", key: "name", value: member.name },
          { label: "Role", key: "role", value: member.role },
          { label: "Bio", key: "bio", value: member.bio, type: "textarea" },
          { label: "Image URL", key: "image", value: member.image },
        ],
        () => {
          state.cms.team.splice(index, 1);
          renderTeam();
        }
      );
      list.appendChild(item);
    });
  };

  const renderServices = () => {
    const list = $("#services-list");
    list.innerHTML = "";
    state.cms.services.forEach((service, index) => {
      const item = createListItem(
        [
          { label: "Title", key: "title", value: service.title },
          { label: "Category", key: "category", value: service.category },
          { label: "Description", key: "description", value: service.description, type: "textarea" },
        ],
        () => {
          state.cms.services.splice(index, 1);
          renderServices();
        }
      );
      list.appendChild(item);
    });
  };

  const renderCaseStudies = () => {
    const list = $("#cases-list");
    list.innerHTML = "";
    state.cms.caseStudies.forEach((item, index) => {
      const block = createListItem(
        [
          { label: "Client", key: "client", value: item.client },
          { label: "Title", key: "title", value: item.title },
          { label: "Category", key: "category", value: item.category },
          { label: "Image URL", key: "image", value: item.image?.src },
          { label: "Image Alt", key: "imageAlt", value: item.image?.alt },
          { label: "Project URL", key: "url", value: item.url },
        ],
        () => {
          state.cms.caseStudies.splice(index, 1);
          renderCaseStudies();
        }
      );
      list.appendChild(block);
    });
  };

  const bindInputs = () => {
    $("#hero-headline").value = state.cms.homepage?.hero?.headline || "";
    $("#about-title").value = state.cms.homepage?.about?.title || "";
    $("#about-subtitle").value = state.cms.homepage?.about?.subtitle || "";
    $("#services-title").value = state.cms.homepage?.services?.title || "";
    $("#services-subtitle").value = state.cms.homepage?.services?.subtitle || "";
    $("#works-title").value = state.cms.homepage?.caseStudies?.title || "";
    $("#works-subtitle").value = state.cms.homepage?.caseStudies?.subtitle || "";
    $("#team-title").value = state.cms.homepage?.team?.title || "";
    $("#team-subtitle").value = state.cms.homepage?.team?.subtitle || "";

    $("#contact-phone").value = state.cms.contact?.phone || "";
    $("#contact-email").value = state.cms.contact?.email || "";
    $("#contact-locations").value = (state.cms.contact?.locations || []).join("\n");
    $("#contact-social").value = (state.cms.contact?.social || [])
      .map((item) => `${item.label} | ${item.url}`)
      .join("\n");
  };

  const collectList = (listSelector, fields) => {
    return $$(listSelector).map((item) => {
      const data = {};
      fields.forEach((field) => {
        const input = item.querySelector(`[data-key="${field}"]`);
        data[field] = input?.value?.trim() || "";
      });
      return data;
    });
  };

  const syncStateFromUI = () => {
    state.cms.homepage = {
      hero: {
        headline: $("#hero-headline").value.trim(),
      },
      about: {
        title: $("#about-title").value.trim(),
        subtitle: $("#about-subtitle").value.trim(),
      },
      services: {
        title: $("#services-title").value.trim(),
        subtitle: $("#services-subtitle").value.trim(),
      },
      caseStudies: {
        title: $("#works-title").value.trim(),
        subtitle: $("#works-subtitle").value.trim(),
      },
      team: {
        title: $("#team-title").value.trim(),
        subtitle: $("#team-subtitle").value.trim(),
      },
    };

    state.cms.team = collectList("#team-list .list-item", ["name", "role", "bio", "image"]);
    state.cms.services = collectList("#services-list .list-item", ["title", "category", "description"]);
    state.cms.caseStudies = collectList("#cases-list .list-item", [
      "client",
      "title",
      "category",
      "image",
      "imageAlt",
      "url",
    ]).map((item) => ({
      client: item.client,
      title: item.title,
      category: item.category,
      url: item.url,
      image: {
        src: item.image,
        alt: item.imageAlt,
      },
    }));

    state.cms.contact = {
      phone: $("#contact-phone").value.trim(),
      email: $("#contact-email").value.trim(),
      locations: $("#contact-locations").value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      social: $("#contact-social").value
        .split("\n")
        .map((line) => line.split("|").map((part) => part.trim()))
        .filter((pair) => pair[0] && pair[1])
        .map(([label, url]) => ({ label, url })),
    };
  };

  const handleSave = async () => {
    try {
      syncStateFromUI();
      const owner = $("#repo-owner").value.trim();
      const repo = $("#repo-name").value.trim();
      const branch = $("#repo-branch").value.trim() || "main";
      const path = $("#repo-path").value.trim();
      const token = $("#github-token").value.trim();
      const message = $("#commit-message").value.trim() || "Update site content";

      if (!owner || !repo || !path || !token) {
        showStatus("Please fill out repo details and token.", true);
        return;
      }

      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      };

      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
        { headers }
      );
      if (!fileResponse.ok) {
        throw new Error("Could not fetch existing file from GitHub.");
      }
      const fileData = await fileResponse.json();

      const updatedContent = {
        ...state.rawContent,
        cms: state.cms,
      };

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updatedContent, null, 2))));

      const updateResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message,
            content: encoded,
            sha: fileData.sha,
            branch,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("GitHub commit failed. Check token permissions.");
      }

      showStatus("Changes committed successfully.");
    } catch (error) {
      console.error(error);
      showStatus(error.message || "Save failed.", true);
    }
  };

  const setupLogin = () => {
    const loginCard = $("#login-card");
    const adminApp = $("#admin-app");

    const unlock = () => {
      const password = $("#admin-password").value.trim();
      if (password !== ADMIN_PASSWORD) {
        alert("Incorrect password");
        return;
      }
      localStorage.setItem(LOGIN_KEY, "true");
      loginCard.classList.add("hidden");
      adminApp.classList.remove("hidden");
    };

    $("#login-button").addEventListener("click", unlock);

    if (localStorage.getItem(LOGIN_KEY) === "true") {
      loginCard.classList.add("hidden");
      adminApp.classList.remove("hidden");
    }
  };

  const bindActions = () => {
    $("#add-team").addEventListener("click", () => {
      state.cms.team.push({ name: "", role: "", bio: "", image: "" });
      renderTeam();
    });

    $("#add-service").addEventListener("click", () => {
      state.cms.services.push({ title: "", category: "", description: "" });
      renderServices();
    });

    $("#add-case").addEventListener("click", () => {
      state.cms.caseStudies.push({
        client: "",
        title: "",
        category: "",
        url: "",
        image: { src: "", alt: "" },
      });
      renderCaseStudies();
    });

    $("#save-button").addEventListener("click", handleSave);
  };

  const init = async () => {
    setupLogin();
    await fetchContent();
    bindInputs();
    renderTeam();
    renderServices();
    renderCaseStudies();
    bindActions();
  };

  init();
})();
