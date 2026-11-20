// Studio settings: team, onboarding checklist template, site-visit reminders,
// backup & restore, sample data. Rendered below the website settings.

import { $, $$, uid, app, studioApi, toast } from "../core.js";
import { STATE_OPTIONS } from "./finance.js";
import { DEFAULT_POLICY } from "./leave.js";
import { data, team, saveSettings, DEFAULT_CHECKLIST, ONBOARDING, loadAll, meId, setMe, isoDate, waitForSave, discardQueue } from "./data.js";
import { icon, esc, optionsHTML, confirmBox } from "./ui.js";
import { seedDemo, clearDemo, hasDemoData } from "./demo.js";

export const renderStudioSettings = (container) => {
  const section = document.createElement("div");
  section.className = "studio-settings";
  container.prepend(section);

  const draw = () => {
    const checklist = data.settings.onboardingChecklist || [];
    section.innerHTML = `
      <div class="panel">
        <h2>Team</h2><p class="muted">People who can be assigned tasks, snags and site visits. Pick who you are on this device so “My tasks” and activity are labelled correctly.</p>
        <div class="rows-edit" data-team>${team().map((m) => `<div class="row-edit" data-id="${m.id}"><input type="text" value="${esc(m.name)}" data-f="name" placeholder="Name" aria-label="Name"><input type="text" value="${esc(m.role || "")}" data-f="role" placeholder="Role (optional)" aria-label="Role"><label class="me"><input type="radio" name="me" value="${m.id}" ${meId() === m.id ? "checked" : ""}> This is me</label><button type="button" class="icon-btn small" data-rm-member="${m.id}" aria-label="Remove">${icon("x", 14)}</button></div>`).join("") || '<p class="muted">No team members yet.</p>'}</div>
        <div class="panel-actions"><button class="btn small" data-add-member>${icon("plus", 14)} Add team member</button></div>
      </div>
      <div class="panel">
        <h2>Client onboarding checklist</h2><p class="muted">Every new client gets this checklist, grouped by pipeline stage. “Brief received” ticks itself when the client submits their form.</p>
        <div class="rows-edit" data-checklist>${checklist.map((i) => `<div class="row-edit" data-id="${esc(i.id)}"><input type="text" value="${esc(i.label)}" data-f="label" aria-label="Checklist item"><select data-f="stage" aria-label="Stage">${optionsHTML(ONBOARDING, i.stage)}</select><button type="button" class="icon-btn small" data-rm-item="${esc(i.id)}" aria-label="Remove">${icon("x", 14)}</button></div>`).join("")}</div>
        <div class="panel-actions"><button class="btn small" data-add-item>${icon("plus", 14)} Add item</button><button class="btn small ghost" data-reset-checklist>Reset to default</button></div>
      </div>
      <div class="panel" id="company-panel">
        <h2>Company (printed on quotes and invoices)</h2><p class="muted">Nothing here is filled in for you. Add your registered details; they appear on every document you print.</p>
        <div class="form-grid">${[["legalName", "Legal name", "e.g. Vanilla & Somethin' Architects"], ["gstin", "GSTIN", "15 characters"], ["pan", "PAN", ""], ["phone", "Phone", ""], ["email", "Email", ""], ["upi", "UPI ID", ""], ["invoicePrefix", "Invoice number prefix", "VS"], ["quotePrefix", "Quote number prefix", "VSQ"]].map(([k, l, ph]) => `<label class="field half"><span class="lbl">${l}</span><input type="text" data-company="${k}" value="${esc((data.settings.company || {})[k] || "")}" placeholder="${esc(ph)}"></label>`).join("")}
          <label class="field half"><span class="lbl">Registered state (GST)</span><select data-company="stateCode">${STATE_OPTIONS.map((o) => `<option value="${o.id}" ${((data.settings.company || {}).stateCode || "29") === o.id ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>
          <label class="field wide"><span class="lbl">Address</span><textarea data-company="address" rows="2">${esc((data.settings.company || {}).address || "")}</textarea></label>
          <label class="field wide"><span class="lbl">Bank details</span><textarea data-company="bank" rows="3" placeholder="Account name, number, IFSC, bank and branch">${esc((data.settings.company || {}).bank || "")}</textarea></label>
          <label class="field wide"><span class="lbl">Terms printed on documents</span><textarea data-company="terms" rows="3" placeholder="Payment terms, scope notes, validity">${esc((data.settings.company || {}).terms || "")}</textarea></label></div>
      </div>
      <div class="panel">
        <h2>Leave policy</h2><p class="muted">Defaults follow the ALIVE team policy. Earned leave accrues 1 day for every N days worked. The office works the 2nd and 4th Saturdays.</p>
        <div class="form-grid">${[["casualPerYear", "Casual days a year"], ["casualMaxRun", "Casual: max in a row"], ["sickPerYear", "Sick days a year"], ["sickCertificateOver", "Certificate needed over (days)"], ["earnedPerDaysWorked", "Earned: 1 day per N days worked"], ["earnedMaxPerYear", "Earned: max a year"], ["earnedCarryCap", "Earned: carry-over cap"], ["choicePerYear", "Choice days a year"]].map(([k, l]) => `<label class="field half"><span class="lbl">${l}</span><input type="number" min="0" data-policy="${k}" value="${esc(((data.settings.leavePolicy || {})[k]) ?? DEFAULT_POLICY[k])}"></label>`).join("")}</div>
      </div>
      <div class="panel">
        <h2>Site visits</h2>
        <label class="field half"><span class="lbl">Flag a live site if it hasn't been visited for <em>days</em></span><input type="number" min="1" max="90" value="${esc(data.settings.staleVisitDays || 14)}" data-stale></label>
      </div>
      <div class="panel">
        <h2>Data</h2><p class="muted">Studio data is stored privately, not in the website's code. Download a backup now and then. Site photos aren't included in backups.</p>
        <div class="panel-actions"><button class="btn" data-export>${icon("download", 15)} Download backup</button><button class="btn" data-import>${icon("upload", 15)} Restore from backup…</button>
        ${hasDemoData() ? `<button class="btn ghost danger" data-clear-demo>Remove sample data</button>` : `<button class="btn ghost" data-seed>${icon("sparkle", 15)} Load sample data</button>`}</div>
      </div>`;
  };
  draw();

  const members = () => $$("[data-team] .row-edit", section).map((row) => ({ ...(team().find((m) => m.id === row.dataset.id) || { id: row.dataset.id }), name: $('[data-f="name"]', row).value.trim(), role: $('[data-f="role"]', row).value.trim() })).filter((m) => m.name);
  const items = () => $$("[data-checklist] .row-edit", section).map((row) => ({ id: row.dataset.id, label: $('[data-f="label"]', row).value.trim(), stage: $('[data-f="stage"]', row).value })).filter((i) => i.label);

  section.addEventListener("change", (e) => {
    if (e.target.closest("[data-team]") && e.target.name !== "me") saveSettings({ team: members() });
    else if (e.target.name === "me") setMe(e.target.value);
    else if (e.target.closest("[data-checklist]")) saveSettings({ onboardingChecklist: items() });
    else if (e.target.matches("[data-company]")) saveSettings({ company: { ...(data.settings.company || {}), [e.target.dataset.company]: e.target.value.trim() } });
    else if (e.target.matches("[data-policy]")) saveSettings({ leavePolicy: { ...(data.settings.leavePolicy || {}), [e.target.dataset.policy]: Math.max(0, Number(e.target.value) || 0) } });
    else if (e.target.matches("[data-stale]")) saveSettings({ staleVisitDays: Math.max(1, Math.min(90, Number(e.target.value) || 14)) });
  });

  section.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("[data-add-member]")) {
      saveSettings({ team: [...members(), { id: uid("tm_"), name: "New member", role: "" }] });
      draw();
      const rows = $$("[data-team] .row-edit input[data-f=name]", section);
      rows[rows.length - 1].select();
    } else if (t.closest("[data-rm-member]")) {
      saveSettings({ team: members().filter((m) => m.id !== t.closest("[data-rm-member]").dataset.rmMember) });
      draw();
    } else if (t.closest("[data-add-item]")) {
      saveSettings({ onboardingChecklist: [...items(), { id: uid("ci_"), label: "New step", stage: "enquiry" }] });
      draw();
      const rows = $$("[data-checklist] .row-edit input[data-f=label]", section);
      rows[rows.length - 1].select();
    } else if (t.closest("[data-rm-item]")) {
      saveSettings({ onboardingChecklist: items().filter((i) => i.id !== t.closest("[data-rm-item]").dataset.rmItem) });
      draw();
    } else if (t.closest("[data-reset-checklist]")) {
      if (await confirmBox({ title: "Reset the checklist?", message: "Your custom checklist is replaced with the default steps. Ticks already made on clients are kept.", confirmLabel: "Reset" })) {
        saveSettings({ onboardingChecklist: DEFAULT_CHECKLIST });
        draw();
      }
    } else if (t.closest("[data-seed]")) {
      seedDemo();
      app.render();
    } else if (t.closest("[data-clear-demo]")) {
      clearDemo();
      app.render();
    } else if (t.closest("[data-export]")) {
      try {
        const backup = await studioApi({ action: "export" });
        const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `vs-studio-backup-${isoDate()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch (error) {
        toast(esc(error.message), { error: true });
      }
    } else if (t.closest("[data-import]")) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        try {
          const backup = JSON.parse(await file.text());
          if (!(await confirmBox({ title: "Restore this backup?", message: "All current studio data (clients, projects, tasks, site logs) is replaced with the backup's contents.", confirmLabel: "Restore", danger: true }))) return;
          // Let anything already queued land first, then drop whatever couldn't: these edits are older
          // than the backup, and a later retry must not overwrite the restored data.
          await waitForSave();
          discardQueue();
          await studioApi({ action: "import", data: backup });
          await loadAll();
          toast("Backup restored.");
          app.render();
        } catch (error) {
          toast(esc(error.message || "That file couldn't be read."), { error: true });
        }
      };
      input.click();
    }
  });
};
