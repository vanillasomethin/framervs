(() => {
  const ADMIN_PASSWORD = "Somethin@22";
  const LOGIN_KEY = "cmsAdminLoggedIn";
  const CONTENT_PATH = "/content.json";

  // ⚠️ Anyone with this URL can trigger deployments.
  // After testing, regenerate this hook in Vercel and replace the URL here.
  const VERCEL_DEPLOY_HOOK =
    "https://api.vercel.com/v1/integrations/deploy/prj_lxcNFMjCcf3BgRuZQ9FGVhEZpyOn/4yo5D4Owth";

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
      const input =
        field.type === "textarea"
          ? document.createElement("textarea")
          : document.createElement("input");
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
          {
            label: "Description",
            key: "description",
            value: service.description,
            type: "textarea",
          },
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
          { label: "Clie
