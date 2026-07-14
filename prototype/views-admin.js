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

window.Views.admin = function () {
  const body = AdminState.tab === "departments" ? departmentsTab()
    : AdminState.tab === "teams" ? teamsTab() : usersTab();
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
  } else {
    const add = document.getElementById("team-add");
    if (add) add.addEventListener("click", () => openTeam(null));
    bindRowAction("[data-team-edit]", "tr[data-team]", "teamEdit", "team", openTeam);
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
