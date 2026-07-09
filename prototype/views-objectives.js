/* Titan prototype — Objectives + Progress view. List, create modal, detail modal with evidence. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Leader-only filter state (employee always scoped to self). Resets fine on reload.
const ObjectiveState = { owner: "all" };

window.Views.objectives = function (role) {
  const isLeader = role === "leader";

  // Scope the list: employee sees own only; leader sees all (optionally filtered).
  let list = DB.OBJECTIVES;
  if (!isLeader) {
    list = DB.OBJECTIVES.filter((o) => o.owner === DB.CURRENT_USER.employee.name);
  } else if (ObjectiveState.owner !== "all") {
    list = DB.OBJECTIVES.filter((o) => o.owner === ObjectiveState.owner);
  }

  const rows = list.map((o) => `
    <tr class="clickable" data-obj="${o.id}">
      <td><strong>${UI.esc(o.title)}</strong><br><small class="muted">${UI.esc(o.period)}</small></td>
      <td>${UI.who(o.owner, o.ownerInitials)}</td>
      <td>${o.weight}%</td>
      <td>${o.target}</td>
      <td style="min-width:150px">${UI.progress(o.progress, o.status)}<div class="right small muted" style="margin-top:4px">${o.progress}%</div></td>
      <td>${UI.statusBadge(o.status)}</td>
    </tr>`).join("") || `<tr><td colspan="6"><div class="empty">No objectives found</div></td></tr>`;

  // Leader gets an employee-name filter; employee does not.
  const owners = [...new Set(DB.OBJECTIVES.map((o) => o.owner))].sort();
  const filter = isLeader ? `
    <select id="obj-filter" style="width:auto;min-width:180px">
      <option value="all">All employees</option>
      ${owners.map((n) => `<option value="${UI.esc(n)}" ${ObjectiveState.owner === n ? "selected" : ""}>${UI.esc(n)}</option>`).join("")}
    </select>` : "";

  const title = isLeader ? "All Objectives" : "My Objectives";

  return `
    <div class="section-head">
      <div><h2 class="mb-0">${title}</h2><div class="small muted">${list.length} objective${list.length === 1 ? "" : "s"} · Q3 2026</div></div>
      <div class="row" style="gap:10px">${filter}<button class="btn primary" id="btn-create-obj">+ Create Objective</button></div>
    </div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Objective</th><th>Owner</th><th>Weight</th><th>Target</th><th>Progress</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
};

window.ViewsWire.objectives = function (role) {
  document.getElementById("btn-create-obj").addEventListener("click", openCreateModal);

  const filter = document.getElementById("obj-filter");
  if (filter) filter.addEventListener("change", () => {
    ObjectiveState.owner = filter.value;
    document.getElementById("content").innerHTML = window.Views.objectives(role);
    window.ViewsWire.objectives(role);
  });

  document.querySelectorAll("tr[data-obj]").forEach((tr) =>
    tr.addEventListener("click", () => openDetailModal(Number(tr.dataset.obj))));
};

function openDetailModal(id) {
  const o = DB.OBJECTIVES.find((x) => x.id === id);
  if (!o) return;

  const criteria = o.criteria.map((c) =>
    `<li><span class="ck ${c.done ? "" : "off"}">${c.done ? "✓" : "○"}</span> ${UI.esc(c.text)}</li>`).join("");

  const evidence = o.evidence.length
    ? o.evidence.map((e) => `<li><span class="ck">✓</span> ${UI.esc(e.text)} <span class="tag">${UI.esc(e.src)}</span></li>`).join("")
    : `<li class="muted">No evidence collected yet.</li>`;

  Modal.open(`
    <div class="modal-head">
      <div>
        <h3>${UI.esc(o.title)}</h3>
        <div class="row small muted" style="margin-top:6px;gap:14px">
          ${UI.statusBadge(o.status)} <span>Weight ${o.weight}%</span> <span>Due ${o.target}</span>
        </div>
      </div>
      <button class="close" data-close>×</button>
    </div>
    <p class="muted" style="margin-top:0">${UI.esc(o.description)}</p>

    <div class="divider"></div>
    <div class="spread"><strong>Progress</strong><span class="muted">${o.progress}%</span></div>
    <div style="margin-top:8px">${UI.progress(o.progress, o.status)}</div>

    <div class="divider"></div>
    <strong>Success Criteria</strong>
    <ul class="check-list" style="margin-top:8px">${criteria}</ul>

    <div class="divider"></div>
    <strong>Evidence</strong>
    <div class="small muted" style="margin-bottom:6px">Auto-collected from GitHub · Backlog · Slack</div>
    <ul class="check-list">${evidence}</ul>

    <div class="modal-foot">
      <button class="btn" data-close>Close</button>
      <button class="btn primary" data-close>Edit Objective</button>
    </div>`);
}

function openCreateModal() {
  Modal.open(`
    <div class="modal-head"><h3>Create Objective</h3><button class="close" data-close>×</button></div>
    <div class="field"><label>Title</label><input type="text" placeholder="e.g. Improve Code Quality" /></div>
    <div class="grid grid-3">
      <div class="field"><label>Weight (%)</label><input type="number" value="20" min="0" max="100" /></div>
      <div class="field"><label>Target Date</label><input type="date" value="2026-09-30" /></div>
      <div class="field"><label>Period</label>
        <select><option>Q3 2026</option><option>Q4 2026</option><option>Annual 2026</option></select>
      </div>
    </div>
    <div class="field"><label>Assign To</label>
      <select>${DB.EMPLOYEES.map((e) => `<option>${UI.esc(e.name)}</option>`).join("")}</select>
    </div>
    <div class="field"><label>Success Criteria (one per line)</label>
      <textarea placeholder="Less than 3 production bugs&#10;PR approval rate > 95%"></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn" data-close>Cancel</button>
      <button class="btn primary" data-close>Create Objective</button>
    </div>`);
}
