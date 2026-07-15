/* Titan prototype — Admin / Organization Management System (OMS). Leader-only.
   Users: central-DB-backed (identity read-only; OMS manages role/dept/status).
   Templates + Peer Review criteria are managed here. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const AdminState = { tab: "users" };
const OMS_TABS = [
  { id: "users", label: "Users" },
  { id: "templates", label: "Templates" },
  { id: "peer", label: "Peer Review" },
];

function omsTabs() {
  const tabs = OMS_TABS.map((t) =>
    `<button class="role-btn ${t.id === AdminState.tab ? "active" : ""}" data-oms-tab="${t.id}">${t.label}</button>`).join("");
  return `<div class="role-switch" id="oms-tabs" style="margin-bottom:18px">${tabs}</div>`;
}

// Shared <option> builder (used by Manage User → department select).
function deptOptions(sel) {
  return DB.DEPARTMENTS.filter((d) => d.active).map((d) => `<option value="${UI.esc(d.name)}" ${d.name === sel ? "selected" : ""}>${UI.esc(d.name)}</option>`).join("");
}
function nextId(arr) { return arr.reduce((m, x) => Math.max(m, x.id), 0) + 1; }
function statusBadge(active) { return active ? `<span class="badge green">Active</span>` : `<span class="badge gray">Inactive</span>`; }

/* ---------- Users (central-DB-backed) ---------- */
function usersTab() {
  const rows = DB.EMPLOYEES.map((u) => `
    <tr class="clickable" data-user="${u.id}">
      <td>${UI.who(u.name, u.initials, u.email)}</td>
      <td>${UI.esc(u.dept)}</td>
      <td class="muted">${UI.esc(u.manager || "—")}</td>
      <td><span class="tag">${u.obsRole === "leader" ? "Leader" : "Employee"}</span></td>
      <td>${statusBadge(u.active)}</td>
      <td class="right"><button class="btn sm" data-manage="${u.id}">Manage</button></td>
    </tr>`).join("");

  return `
    <div class="section-head">
      <div><h2 class="mb-0">Users</h2><div class="small muted">${DB.EMPLOYEES.length} users · <span class="badge blue" style="vertical-align:middle">Synced from Central DB</span></div></div>
      <button class="btn sm" id="oms-sync">↻ Sync from Central DB</button>
    </div>
    <div class="small muted" style="margin:-6px 0 12px">Identity (name, email, manager) is owned by the Central DB. OMS manages access role, department, and status.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>User</th><th>Department</th><th>Manager</th><th>OMS Role</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Objective Templates (reusable, seeded — apply to seed a member) ---------- */
function templatesTab() {
  const rows = DB.OBJECTIVE_TEMPLATES.length ? DB.OBJECTIVE_TEMPLATES.map((t) => {
    const org = t.items.filter((i) => i.category === "organization").length;
    const per = t.items.filter((i) => i.category === "personal").length;
    return `<tr>
      <td><strong>${UI.esc(t.name)}</strong><br><small class="muted">${UI.esc(t.description)}</small></td>
      <td><span class="tag">${UI.esc(t.cadence)}</span></td>
      <td>${org} org · ${per} personal</td>
      <td class="right"><button class="btn sm primary" data-tpl-apply="${t.id}">Apply</button> <button class="btn sm danger" data-tpl-del="${t.id}">Delete</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="4" class="empty">No templates yet — create one to reuse across members.</td></tr>`;
  return `
    <div class="section-head">
      <div><h2 class="mb-0">Objective Templates</h2><div class="small muted">${DB.OBJECTIVE_TEMPLATES.length} reusable templates · build once, assign to many</div></div>
      <button class="btn primary" id="tpl-new">+ New Template</button>
    </div>
    <div class="small muted" style="margin:-6px 0 12px">Build a template from objectives (same fields as creating one), then assign it to one or more members to seed their ${UI.esc(DB.PERIOD)} objectives. Caps enforced (org ${DB.LIMITS.organization} · personal ${DB.LIMITS.personal}); duplicate titles are skipped.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Template</th><th>Cadence</th><th>Objectives</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Peer Review Template (single active template of rated criteria) ---------- */
function peerReviewTab() {
  const t = DB.PEER_REVIEW_TEMPLATE;
  const rows = t.criteria.length ? t.criteria.map((c, idx) => `
    <tr>
      <td class="muted">${idx + 1}</td>
      <td><strong>${UI.esc(c.label)}</strong>${c.description ? `<br><small class="muted">${UI.esc(c.description)}</small>` : ""}</td>
      <td class="right"><button class="btn sm" data-crit-edit="${UI.esc(c.id)}">Edit</button> <button class="btn sm danger" data-crit-del="${UI.esc(c.id)}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="3" class="empty">No criteria yet — add one so reviewers have something to rate.</td></tr>`;
  return `
    <div class="section-head">
      <div><h2 class="mb-0">Peer Review Template</h2><div class="small muted">${t.criteria.length} rated criteria · applied to every peer review</div></div>
      <button class="btn primary" id="crit-new">+ Add criterion</button>
    </div>
    <div class="small muted" style="margin:-6px 0 12px">Each criterion appears as a 1–5 star rating in every reviewer's “Write review” form. Editing here shapes new reviews; reviews already submitted keep the criteria they were scored on.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th style="width:48px">#</th><th>Criterion</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

window.Views.admin = function () {
  const body = AdminState.tab === "templates" ? templatesTab()
    : AdminState.tab === "peer" ? peerReviewTab() : usersTab();
  return `${omsTabs()}${body}`;
};

window.ViewsWire.admin = function () {
  document.querySelectorAll("#oms-tabs [data-oms-tab]").forEach((b) =>
    b.addEventListener("click", () => { AdminState.tab = b.dataset.omsTab; rerenderAdmin(); }));

  if (AdminState.tab === "users") {
    const sync = document.getElementById("oms-sync");
    if (sync) sync.addEventListener("click", () => toastAdmin(`Synced ${DB.EMPLOYEES.length} users from the Central DB.`));
    bindRowAction("[data-manage]", "tr[data-user]", "manage", "user", openManageUser);
  } else if (AdminState.tab === "peer") {
    const cn = document.getElementById("crit-new");
    if (cn) cn.addEventListener("click", () => openCriterion(null));
    document.querySelectorAll("[data-crit-edit]").forEach((b) =>
      b.addEventListener("click", () => openCriterion(b.dataset.critEdit)));
    document.querySelectorAll("[data-crit-del]").forEach((b) =>
      b.addEventListener("click", () => deleteCriterion(b.dataset.critDel)));
  } else {
    const nt = document.getElementById("tpl-new");
    if (nt) nt.addEventListener("click", openTemplateBuilder);
    document.querySelectorAll("[data-tpl-apply]").forEach((b) =>
      b.addEventListener("click", () => openApplyTemplate(Number(b.dataset.tplApply))));
    document.querySelectorAll("[data-tpl-del]").forEach((b) =>
      b.addEventListener("click", () => deleteTemplate(Number(b.dataset.tplDel))));
  }
};

// Wire both the row and its action button to open the same editor (button click wins).
function bindRowAction(btnSel, rowSel, btnKey, rowKey, handler) {
  document.querySelectorAll(`${btnSel}, ${rowSel}`).forEach((el) =>
    el.addEventListener("click", (e) => {
      const raw = el.dataset[btnKey] != null ? el.dataset[btnKey] : el.dataset[rowKey];
      const id = Number(raw);
      if (!Number.isNaN(id)) { e.stopPropagation(); handler(id); }
    }));
}

/* ---------- Modals ---------- */
function openManageUser(id) {
  const u = DB.EMPLOYEES.find((x) => x.id === id);
  if (!u) return;
  Modal.open(`
    <div class="modal-head">
      <div><h3>${UI.esc(u.name)}</h3><div class="small muted" style="margin-top:4px">${UI.esc(u.email)} · reports to ${UI.esc(u.manager || "—")}</div></div>
      <button class="close" data-close>×</button>
    </div>
    <div class="small muted" style="margin:-4px 0 14px">Identity synced from Central DB (read-only). Edit OMS access below.</div>
    <div class="grid grid-2">
      <div class="field"><label>OMS Role</label>
        <select id="mng-role"><option value="employee" ${u.obsRole !== "leader" ? "selected" : ""}>Employee</option><option value="leader" ${u.obsRole === "leader" ? "selected" : ""}>Leader</option></select>
      </div>
      <div class="field"><label>Department</label><select id="mng-dept">${deptOptions(u.dept)}</select></div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="mng-active" style="width:auto" ${u.active ? "checked" : ""} /> Active in OMS</label>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="mng-save">Save</button></div>`);
  document.getElementById("mng-save").addEventListener("click", () => {
    u.obsRole = document.getElementById("mng-role").value;
    u.dept = document.getElementById("mng-dept").value;
    u.active = document.getElementById("mng-active").checked;
    Modal.close(); rerenderAdmin(); toastAdmin(`Updated OMS access for ${u.name}.`);
  });
}

// Apply a template to one OR MORE members: bulk-create its objectives for the
// current half-year, honoring caps and skipping duplicates. In-memory only.
function openApplyTemplate(id) {
  const t = DB.OBJECTIVE_TEMPLATES.find((x) => x.id === id);
  if (!t) return;
  const preview = t.items.map((i) =>
    `<li><span class="ck">✓</span> <strong>${UI.esc(i.title)}</strong> <span class="tag">${i.category === "organization" ? "Org" : "Personal"}</span></li>`).join("");
  const memberChecks = DB.EMPLOYEES.filter((u) => u.active).map((u) =>
    `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" class="tpl-member" value="${UI.esc(u.name)}" style="width:auto" /> ${UI.esc(u.name)} <span class="muted">· ${UI.esc(u.dept)}</span></label>`).join("");
  Modal.open(`
    <div class="modal-head">
      <div><h3>Apply “${UI.esc(t.name)}”</h3><div class="small muted" style="margin-top:4px">${UI.esc(t.cadence)} · seeds ${t.items.length} objective${t.items.length === 1 ? "" : "s"} per member for ${UI.esc(DB.PERIOD)}</div></div>
      <button class="close" data-close>×</button>
    </div>
    <div class="field"><label>Assign to <span class="muted">· one or more members</span></label>
      <div style="display:flex;gap:12px;margin-bottom:6px"><button class="btn sm ghost" id="tpl-all">Select all</button><button class="btn sm ghost" id="tpl-none">Clear</button></div>
      <div style="max-height:180px;overflow:auto;border:1px solid var(--border);border-radius:var(--r-btn);padding:8px 11px">${memberChecks}</div>
    </div>
    <label class="small muted" style="display:block;margin-bottom:4px">This template's objectives</label>
    <ul class="check-list" style="margin:0">${preview}</ul>
    <div class="small muted" style="margin-top:8px">Objectives already at the cap or with a matching title are skipped (org ${DB.LIMITS.organization} · personal ${DB.LIMITS.personal}).</div>
    <div class="small" id="tpl-apply-msg" style="color:var(--red);margin-top:6px"></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="tpl-apply-confirm">Apply template</button></div>`);
  const setAll = (v) => document.querySelectorAll(".tpl-member").forEach((c) => { c.checked = v; });
  document.getElementById("tpl-all").addEventListener("click", () => setAll(true));
  document.getElementById("tpl-none").addEventListener("click", () => setAll(false));
  document.getElementById("tpl-apply-confirm").addEventListener("click", () => {
    const names = Array.from(document.querySelectorAll(".tpl-member:checked")).map((c) => c.value);
    if (!names.length) { document.getElementById("tpl-apply-msg").textContent = "Pick at least one member."; return; }
    let added = 0, skipped = 0;
    names.forEach((n) => {
      const emp = DB.EMPLOYEES.find((u) => u.name === n);
      if (emp) { const r = applyTemplate(t, emp); added += r.added; skipped += r.skipped; }
    });
    Modal.close(); rerenderAdmin();
    toastAdmin(`Applied “${t.name}” to ${names.length} member${names.length === 1 ? "" : "s"}: ${added} objective${added === 1 ? "" : "s"} added${skipped ? `, ${skipped} skipped (cap or duplicate)` : ""}.`);
  });
}

function applyTemplate(t, emp) {
  let added = 0, skipped = 0;
  t.items.forEach((item) => {
    const cap = item.category === "organization" ? DB.LIMITS.organization : DB.LIMITS.personal;
    const mine = DB.OBJECTIVES.filter((o) => o.owner === emp.name && o.period === DB.PERIOD && !o.archived);
    const count = mine.filter((o) => o.category === item.category).length;
    const dup = mine.some((o) => o.title === item.title);
    if (count >= cap || dup) { skipped++; return; }
    DB.OBJECTIVES.push({
      id: nextId(DB.OBJECTIVES), title: item.title, owner: emp.name, ownerInitials: emp.initials,
      category: item.category, period: DB.PERIOD, description: item.description, targetDate: "",
      selfPercent: item.category === "organization" ? null : 0, selfReport: "",
      managerPercent: null, managerComment: "", evidence: [], archived: false,
    });
    added++;
  });
  return { added, skipped };
}

// Build a template from objectives, mirroring the objective-creation flow
// (category · title · description per item). Items accumulate in a live list;
// name/cadence inputs are preserved because only the list re-paints. In-memory.
function openTemplateBuilder() {
  const items = [];
  const cadOpts = ["Quarterly", "Annual", "Custom"].map((c) => `<option value="${c}">${c}</option>`).join("");
  Modal.open(`
    <div class="modal-head"><h3>New Objective Template</h3><button class="close" data-close>×</button></div>
    <div class="grid grid-2">
      <div class="field"><label>Template name</label><input type="text" id="tpl-name" placeholder="e.g. Q Engineering Baseline" /></div>
      <div class="field"><label>Cadence</label><select id="tpl-cadence">${cadOpts}</select></div>
    </div>
    <div class="card" style="box-shadow:none;border:1px solid var(--border);margin-bottom:14px">
      <div class="card-title" style="margin:0 0 8px">Add objective <span class="hint">same fields as creating an objective</span></div>
      <div class="grid grid-2">
        <div class="field" style="margin-bottom:8px"><label>Category</label><select id="tpl-item-cat"><option value="organization">Organization</option><option value="personal">Personal</option></select></div>
        <div class="field" style="margin-bottom:8px"><label>Title</label><input type="text" id="tpl-item-title" placeholder="e.g. Improve Code Quality" /></div>
      </div>
      <div class="field" style="margin-bottom:8px"><label>Description</label><textarea id="tpl-item-desc" placeholder="What should this objective achieve?"></textarea></div>
      <button class="btn sm" id="tpl-item-add">+ Add objective</button>
    </div>
    <label class="small muted" style="display:block;margin-bottom:4px">Objectives in this template (<span id="tpl-count">0</span>)</label>
    <ul class="check-list" id="tpl-items"></ul>
    <div class="small" id="tpl-msg" style="color:var(--red);margin-top:6px"></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="tpl-save">Save template</button></div>`);

  const msg = (t) => { document.getElementById("tpl-msg").textContent = t || ""; };
  const list = document.getElementById("tpl-items");
  function paintItems() {
    list.innerHTML = items.length
      ? items.map((i, idx) => `<li><span class="ck">✓</span> <strong>${UI.esc(i.title)}</strong> <span class="tag">${i.category === "organization" ? "Org" : "Personal"}</span> <button class="btn sm ghost" data-tpl-item-del="${idx}" title="Remove">✕</button>${i.description ? `<div class="small muted" style="margin-left:22px">${UI.esc(i.description)}</div>` : ""}</li>`).join("")
      : `<li class="small muted">No objectives added yet.</li>`;
    document.getElementById("tpl-count").textContent = String(items.length);
    list.querySelectorAll("[data-tpl-item-del]").forEach((b) =>
      b.addEventListener("click", () => { items.splice(Number(b.dataset.tplItemDel), 1); paintItems(); }));
  }
  paintItems();

  document.getElementById("tpl-item-add").addEventListener("click", () => {
    const titleEl = document.getElementById("tpl-item-title");
    const title = titleEl.value.trim();
    if (!title) { msg("Give the objective a title before adding."); titleEl.focus(); return; }
    items.push({ category: document.getElementById("tpl-item-cat").value, title, description: document.getElementById("tpl-item-desc").value.trim() });
    titleEl.value = ""; document.getElementById("tpl-item-desc").value = ""; msg("");
    paintItems();
  });

  document.getElementById("tpl-save").addEventListener("click", () => {
    const name = document.getElementById("tpl-name").value.trim();
    if (!name) { msg("Give the template a name."); return; }
    if (!items.length) { msg("Add at least one objective to the template."); return; }
    const cadence = document.getElementById("tpl-cadence").value;
    DB.OBJECTIVE_TEMPLATES.push({
      id: nextId(DB.OBJECTIVE_TEMPLATES), name, cadence,
      description: `${items.length} objective${items.length === 1 ? "" : "s"} · ${cadence.toLowerCase()}`,
      items: items.slice(),
    });
    Modal.close(); rerenderAdmin(); toastAdmin(`Template “${name}” created.`);
  });
}

function deleteTemplate(id) {
  const t = DB.OBJECTIVE_TEMPLATES.find((x) => x.id === id);
  if (!t) return;
  DB.OBJECTIVE_TEMPLATES = DB.OBJECTIVE_TEMPLATES.filter((x) => x.id !== id);
  rerenderAdmin(); toastAdmin(`Template “${t.name}” deleted.`);
}

/* ---------- Peer Review criterion CRUD (writes to DB.PEER_REVIEW_TEMPLATE) ---------- */
// Criterion ids are strings ("c1", "c2", …); derive the next from the numeric suffix.
function nextCritId(arr) {
  const max = arr.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, "")) || 0), 0);
  return "c" + (max + 1);
}

function openCriterion(id) {
  const t = DB.PEER_REVIEW_TEMPLATE;
  const c = id ? t.criteria.find((x) => x.id === id) : { label: "", description: "" };
  if (!c) return;
  Modal.open(`
    <div class="modal-head"><h3>${id ? "Edit" : "New"} criterion</h3><button class="close" data-close>×</button></div>
    <div class="field"><label>Criterion name</label><input type="text" id="crit-label" value="${UI.esc(c.label)}" placeholder="e.g. Communication" /></div>
    <div class="field"><label>Description <span class="hint">shown to reviewers to guide their rating</span></label><textarea id="crit-desc" placeholder="e.g. Shares information clearly and keeps others informed.">${UI.esc(c.description)}</textarea></div>
    <div class="small muted" style="margin:-4px 0 4px">Reviewers rate this from 1 to 5 stars.</div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="crit-save">${id ? "Save" : "Add"}</button></div>`);
  document.getElementById("crit-save").addEventListener("click", () => {
    const label = document.getElementById("crit-label").value.trim();
    if (!label) { toastAdmin("Give the criterion a name."); return; }
    const description = document.getElementById("crit-desc").value.trim();
    if (id) { c.label = label; c.description = description; }
    else t.criteria.push({ id: nextCritId(t.criteria), label, description });
    Modal.close(); rerenderAdmin(); toastAdmin(`Criterion “${label}” ${id ? "updated" : "added"}.`);
  });
}

function deleteCriterion(id) {
  const t = DB.PEER_REVIEW_TEMPLATE;
  const c = t.criteria.find((x) => x.id === id);
  if (!c) return;
  t.criteria = t.criteria.filter((x) => x.id !== id);
  rerenderAdmin(); toastAdmin(`Criterion “${c.label}” deleted.`);
}

function rerenderAdmin() {
  document.getElementById("content").innerHTML = window.Views.admin(window.App.role);
  window.ViewsWire.admin(window.App.role);
}

function toastAdmin(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
