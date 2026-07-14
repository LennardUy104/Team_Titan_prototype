/* Titan prototype — Admin / Organization Management System (OMS). Leader-only.
   Users: central-DB-backed (identity read-only; OBS manages role/dept/status).
   Departments & Teams: organizational structure managed here (out of Analytics). */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const AdminState = { tab: "users" };
const OMS_TABS = [
  { id: "users", label: "Users" },
  { id: "departments", label: "Departments" },
  { id: "teams", label: "Teams" },
  { id: "templates", label: "Templates" },
];

function omsTabs() {
  const tabs = OMS_TABS.map((t) =>
    `<button class="role-btn ${t.id === AdminState.tab ? "active" : ""}" data-oms-tab="${t.id}">${t.label}</button>`).join("");
  return `<div class="role-switch" id="oms-tabs" style="margin-bottom:18px">${tabs}</div>`;
}

// Shared <option> builders.
function userOptions(sel) {
  return DB.EMPLOYEES.map((u) => `<option value="${UI.esc(u.name)}" ${u.name === sel ? "selected" : ""}>${UI.esc(u.name)}</option>`).join("");
}
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
    <div class="small muted" style="margin:-6px 0 12px">Identity (name, email, manager) is owned by the Central DB. OBS manages access role, department, and status.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>User</th><th>Department</th><th>Manager</th><th>OBS Role</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Departments ---------- */
function departmentsTab() {
  const rows = DB.DEPARTMENTS.map((d) => {
    const members = DB.EMPLOYEES.filter((e) => e.dept === d.name).length;
    const teams = DB.TEAMS.filter((t) => t.department === d.name).length;
    return `<tr class="clickable" data-dept="${d.id}">
      <td><strong>${UI.esc(d.name)}</strong><br><small class="muted">${UI.esc(d.description)}</small></td>
      <td>${UI.esc(d.lead)}</td>
      <td>${teams}</td>
      <td>${members}</td>
      <td>${statusBadge(d.active)}</td>
      <td class="right"><button class="btn sm" data-dept-edit="${d.id}">Manage</button></td>
    </tr>`;
  }).join("");
  return `
    <div class="section-head">
      <div><h2 class="mb-0">Departments</h2><div class="small muted">${DB.DEPARTMENTS.length} departments · organizational grouping</div></div>
      <button class="btn primary" id="dept-add">+ Add Department</button>
    </div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Department</th><th>Lead</th><th>Teams</th><th>Members</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Teams ---------- */
function teamsTab() {
  const rows = DB.TEAMS.map((t) => `
    <tr class="clickable" data-team="${t.id}">
      <td><strong>${UI.esc(t.name)}</strong></td>
      <td><span class="tag">${UI.esc(t.department)}</span></td>
      <td>${UI.esc(t.lead)}</td>
      <td>${t.members.length}</td>
      <td>${statusBadge(t.active)}</td>
      <td class="right"><button class="btn sm" data-team-edit="${t.id}">Manage</button></td>
    </tr>`).join("");
  return `
    <div class="section-head">
      <div><h2 class="mb-0">Teams</h2><div class="small muted">${DB.TEAMS.length} teams · membership &amp; department mapping</div></div>
      <button class="btn primary" id="team-add">+ Add Team</button>
    </div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Team</th><th>Department</th><th>Lead</th><th>Members</th><th>Status</th><th></th></tr></thead>
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

window.Views.admin = function () {
  const body = AdminState.tab === "departments" ? departmentsTab()
    : AdminState.tab === "teams" ? teamsTab()
    : AdminState.tab === "templates" ? templatesTab() : usersTab();
  return `${omsTabs()}${body}`;
};

window.ViewsWire.admin = function () {
  document.querySelectorAll("#oms-tabs [data-oms-tab]").forEach((b) =>
    b.addEventListener("click", () => { AdminState.tab = b.dataset.omsTab; rerenderAdmin(); }));

  if (AdminState.tab === "users") {
    const sync = document.getElementById("oms-sync");
    if (sync) sync.addEventListener("click", () => toastAdmin(`Synced ${DB.EMPLOYEES.length} users from the Central DB.`));
    bindRowAction("[data-manage]", "tr[data-user]", "manage", "user", openManageUser);
  } else if (AdminState.tab === "departments") {
    const add = document.getElementById("dept-add");
    if (add) add.addEventListener("click", () => openDept(null));
    bindRowAction("[data-dept-edit]", "tr[data-dept]", "deptEdit", "dept", openDept);
  } else if (AdminState.tab === "teams") {
    const add = document.getElementById("team-add");
    if (add) add.addEventListener("click", () => openTeam(null));
    bindRowAction("[data-team-edit]", "tr[data-team]", "teamEdit", "team", openTeam);
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
    <div class="small muted" style="margin:-4px 0 14px">Identity synced from Central DB (read-only). Edit OBS access below.</div>
    <div class="grid grid-2">
      <div class="field"><label>OBS Role</label>
        <select id="mng-role"><option value="employee" ${u.obsRole !== "leader" ? "selected" : ""}>Employee</option><option value="leader" ${u.obsRole === "leader" ? "selected" : ""}>Leader</option></select>
      </div>
      <div class="field"><label>Department</label><select id="mng-dept">${deptOptions(u.dept)}</select></div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="mng-active" style="width:auto" ${u.active ? "checked" : ""} /> Active in OBS</label>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="mng-save">Save</button></div>`);
  document.getElementById("mng-save").addEventListener("click", () => {
    u.obsRole = document.getElementById("mng-role").value;
    u.dept = document.getElementById("mng-dept").value;
    u.active = document.getElementById("mng-active").checked;
    Modal.close(); rerenderAdmin(); toastAdmin(`Updated OBS access for ${u.name}.`);
  });
}

function openDept(id) {
  const d = id ? DB.DEPARTMENTS.find((x) => x.id === id) : { name: "", description: "", lead: "", active: true };
  Modal.open(`
    <div class="modal-head"><h3>${id ? "Edit" : "New"} Department</h3><button class="close" data-close>×</button></div>
    <div class="field"><label>Name</label><input type="text" id="d-name" value="${UI.esc(d.name)}" placeholder="e.g. Engineering" /></div>
    <div class="field"><label>Description</label><textarea id="d-desc" placeholder="What this department does…">${UI.esc(d.description)}</textarea></div>
    <div class="field"><label>Lead</label><select id="d-lead">${userOptions(d.lead)}</select></div>
    ${id ? `<label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="d-active" style="width:auto" ${d.active ? "checked" : ""}/> Active</label>` : ""}
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="d-save">${id ? "Save" : "Create"}</button></div>`);
  document.getElementById("d-save").addEventListener("click", () => {
    const name = document.getElementById("d-name").value.trim();
    if (!name) { toastAdmin("Department needs a name."); return; }
    const desc = document.getElementById("d-desc").value.trim();
    const lead = document.getElementById("d-lead").value;
    if (id) { d.name = name; d.description = desc; d.lead = lead; d.active = document.getElementById("d-active").checked; }
    else DB.DEPARTMENTS.push({ id: nextId(DB.DEPARTMENTS), name, description: desc, lead, active: true });
    Modal.close(); rerenderAdmin(); toastAdmin(`Department "${name}" ${id ? "updated" : "created"}.`);
  });
}

function openTeam(id) {
  const t = id ? DB.TEAMS.find((x) => x.id === id) : { name: "", department: (DB.DEPARTMENTS[0] || {}).name || "", lead: "", members: [], active: true };
  const memberChecks = DB.EMPLOYEES.filter((u) => u.active).map((u) =>
    `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" class="tm-member" value="${UI.esc(u.name)}" style="width:auto" ${t.members.includes(u.name) ? "checked" : ""}/> ${UI.esc(u.name)} <span class="muted">· ${UI.esc(u.dept)}</span></label>`).join("");
  Modal.open(`
    <div class="modal-head"><h3>${id ? "Edit" : "New"} Team</h3><button class="close" data-close>×</button></div>
    <div class="grid grid-2">
      <div class="field"><label>Name</label><input type="text" id="t-name" value="${UI.esc(t.name)}" placeholder="e.g. Platform" /></div>
      <div class="field"><label>Department</label><select id="t-dept">${deptOptions(t.department)}</select></div>
    </div>
    <div class="field"><label>Lead</label><select id="t-lead">${userOptions(t.lead)}</select></div>
    <div class="field"><label>Members</label><div style="max-height:180px;overflow:auto;border:1px solid var(--border);border-radius:var(--r-btn);padding:8px 11px">${memberChecks}</div></div>
    ${id ? `<label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="t-active" style="width:auto" ${t.active ? "checked" : ""}/> Active</label>` : ""}
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="t-save">${id ? "Save" : "Create"}</button></div>`);
  document.getElementById("t-save").addEventListener("click", () => {
    const name = document.getElementById("t-name").value.trim();
    if (!name) { toastAdmin("Team needs a name."); return; }
    const members = Array.from(document.querySelectorAll(".tm-member:checked")).map((c) => c.value);
    const dep = document.getElementById("t-dept").value;
    const lead = document.getElementById("t-lead").value;
    if (id) { t.name = name; t.department = dep; t.lead = lead; t.members = members; t.active = document.getElementById("t-active").checked; }
    else DB.TEAMS.push({ id: nextId(DB.TEAMS), name, department: dep, lead, members, active: true });
    Modal.close(); rerenderAdmin(); toastAdmin(`Team "${name}" ${id ? "updated" : "created"}.`);
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
