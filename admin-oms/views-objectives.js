/* Titan prototype — My Objectives view (OBS template model, half-year cycle).
   Visible period tabs (like the spreadsheet): current half is editable, past
   halves are read-only history. Mission Statement + Organization (max 3) +
   Personal (max 5) objectives, each with self + manager assessment. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Which half-year is being viewed (persists across nav within the session).
const ObjState = { period: DB.PERIOD, showArchived: false };

function objField(o, key, value) { o[key] = value; } // mutate in-memory mock record

// Next half-year label: "2026-1st" -> "2026-2nd" -> "2027-1st" ...
function nextPeriodLabel(p) {
  const [y, half] = p.split("-");
  return half === "1st" ? `${y}-2nd` : `${Number(y) + 1}-1st`;
}

// One objective card. Self side is editable only in the current period and until
// the manager has evaluated it; otherwise it renders read-only.
function objectiveCard(o, isCurrent) {
  const canEdit = isCurrent && o.managerPercent == null;
  const achieved = UI.objAchieved(o);
  const evaluated = o.managerPercent != null;

  const selfBlock = canEdit
    ? `<label class="small muted">Achieved %</label>
       <input type="number" min="0" max="100" value="${o.selfPercent != null ? o.selfPercent : ""}" data-self-pct="${o.id}" placeholder="0–100" style="max-width:120px" />
       <label class="small muted" style="margin-top:8px;display:block">Achievement report <span class="muted">· why this %</span></label>
       <textarea data-self-report="${o.id}" placeholder="Explain your progress and the reason for this percentage…">${UI.esc(o.selfReport)}</textarea>`
    : `<div class="small"><strong>${o.selfPercent != null ? o.selfPercent + "%" : "—"}</strong><span class="muted"> · self-assessed</span></div>
       <p class="small muted" style="margin:6px 0 0">${UI.esc(o.selfReport) || "No report provided."}</p>
       ${(isCurrent && evaluated) ? `<div class="small muted" style="margin-top:6px">🔒 Locked after manager evaluation</div>` : ""}`;

  const managerBlock = evaluated
    ? `<div class="small"><strong>${o.managerPercent}%</strong><span class="muted"> · manager</span></div>
       <p class="small muted" style="margin:6px 0 0">${UI.esc(o.managerComment) || "No comment."}</p>`
    : `<div class="empty" style="padding:14px">Awaiting manager evaluation</div>`;

  const targetLabel = o.targetDate || UI.periodEnd(o.period);
  return `<div class="card" style="margin-bottom:12px">
    <div class="spread" style="align-items:flex-start">
      <div><strong>${UI.esc(o.title)}</strong><div class="small muted" style="margin-top:2px">${UI.esc(o.period)} · 🎯 Target ${UI.esc(targetLabel)}</div></div>
      <div class="row" style="gap:8px;align-items:center">
        <span class="badge ${evaluated ? "green" : "gray"}">${evaluated ? "Evaluated" : "In progress"} · ${achieved}%</span>
        ${isCurrent ? `<button class="btn sm ghost" data-archive="${o.id}" title="Archive this objective">🗄</button>` : ""}
      </div>
    </div>
    <p class="small muted" style="margin:8px 0 12px">${UI.esc(o.description)}</p>
    <div class="fb-cols">
      <div><h4>Self evaluation</h4>${selfBlock}</div>
      <div><h4>Manager evaluation</h4>${managerBlock}</div>
    </div>
  </div>`;
}

// Final Overall Score — one figure computed from per-objective achievement (KISS: simple average).
function overallScoreCard(objs) {
  const overall = objs.length ? Math.round(objs.reduce((a, o) => a + UI.objAchieved(o), 0) / objs.length) : 0;
  const status = UI.pctStatus(overall);
  return `<div class="card" style="margin-bottom:20px">
    <div class="spread" style="align-items:flex-start;margin-bottom:10px">
      <div>
        <div class="card-title" style="margin:0">Final Overall Score <span class="hint">computed from ${objs.length} objective${objs.length === 1 ? "" : "s"}</span></div>
        <div class="small muted" style="margin-top:4px">Average achievement across your objectives this half-year.</div>
      </div>
      <div style="text-align:right"><div class="stat-value" style="line-height:1">${overall}%</div><div style="margin-top:4px">${UI.statusBadge(status)}</div></div>
    </div>
    ${UI.progress(overall, status)}
  </div>`;
}

// Compact read-only row for an archived objective, with a Restore action.
function archivedRow(o) {
  return `<div class="card" style="margin-bottom:10px;opacity:.75">
    <div class="spread" style="align-items:flex-start">
      <div><strong>${UI.esc(o.title)}</strong> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
        <div class="small muted" style="margin-top:2px">Archived · self ${o.selfPercent != null ? o.selfPercent + "%" : "—"}</div>
      </div>
      <button class="btn sm" data-restore="${o.id}">Restore</button>
    </div>
  </div>`;
}

function objectiveSection(title, sub, objs, isCurrent, addBtn) {
  const body = objs.length ? objs.map((o) => objectiveCard(o, isCurrent)).join("") : `<div class="empty">No objectives yet.</div>`;
  return `
    <div class="section-head">
      <div><h2 class="mb-0">${title}</h2><div class="small muted">${sub}</div></div>
      ${addBtn || ""}
    </div>
    ${body}`;
}

window.Views.objectives = function (role) {
  const me = DB.CURRENT_USER[role].name;
  const period = ObjState.period;
  const isCurrent = period === DB.PERIOD;
  const mineAll = DB.OBJECTIVES.filter((o) => o.owner === me && o.period === period);
  const mine = mineAll.filter((o) => !o.archived);
  const archived = mineAll.filter((o) => o.archived);
  const org = mine.filter((o) => o.category === "organization");
  const personal = mine.filter((o) => o.category === "personal");
  const mission = DB.MISSION_STATEMENTS[`${period}|${me}`] || "";

  const personalFull = personal.length >= DB.LIMITS.personal;
  const addPersonal = isCurrent
    ? `<button class="btn primary" id="add-personal" ${personalFull ? "disabled title='Maximum reached'" : ""}>+ Add Personal Objective</button>`
    : "";

  const banner = isCurrent ? "" : `<div class="small muted" style="margin-bottom:12px">🔒 ${UI.esc(period)} is a closed half-year — read-only history.</div>`;

  const missionCard = `<div class="card" style="margin-bottom:20px">
    <div class="card-title">Mission Statement <span class="hint">${UI.esc(period)} · one sentence</span></div>
    ${isCurrent
      ? `<textarea id="mission" placeholder="Describe your focus for the coming half year…">${UI.esc(mission)}</textarea>`
      : `<p class="muted" style="margin:0">${UI.esc(mission) || "—"}</p>`}
  </div>`;

  const archivedSection = archived.length ? `
    <div style="margin-top:24px">
      <button class="btn sm" id="toggle-archived">${ObjState.showArchived ? "▾" : "▸"} Archived (${archived.length})</button>
      ${ObjState.showArchived ? `<div style="margin-top:12px">${archived.map(archivedRow).join("")}</div>` : ""}
    </div>` : "";

  return `
    ${UI.periodSelect(period, { id: "period", showNew: isCurrent, newDisabled: mine.length === 0 })}
    ${banner}
    ${missionCard}
    ${overallScoreCard(mine)}
    ${objectiveSection("Organization Objectives", `${org.length} of ${DB.LIMITS.organization} · assigned by your leader`, org, isCurrent, "")}
    <div style="margin-top:24px">
      ${objectiveSection("Personal Objectives", `${personal.length} of ${DB.LIMITS.personal} · set by you`, personal, isCurrent, addPersonal)}
    </div>
    ${archivedSection}`;
};

window.ViewsWire.objectives = function (role) {
  // Half-year selector: dropdown + prev/next stepper.
  const sel = document.getElementById("period-select");
  if (sel) sel.addEventListener("change", () => { ObjState.period = sel.value; rerenderObjectives(role); });
  const stepTo = (delta) => {
    const i = DB.PERIODS.indexOf(ObjState.period) + delta;
    if (i >= 0 && i < DB.PERIODS.length) { ObjState.period = DB.PERIODS[i]; rerenderObjectives(role); }
  };
  const prev = document.getElementById("period-prev");   // older
  if (prev) prev.addEventListener("click", () => stepTo(1));
  const next = document.getElementById("period-next");   // newer
  if (next) next.addEventListener("click", () => stepTo(-1));

  // Start the next half-year (blank template) — guarded + confirmed to avoid empty spam.
  const newHalf = document.getElementById("period-new-half");
  if (newHalf) newHalf.addEventListener("click", () => confirmNewHalfYear(role));

  // Mission statement — persist to the in-memory record (current period only).
  const mission = document.getElementById("mission");
  if (mission) mission.addEventListener("input", () => { DB.MISSION_STATEMENTS[`${ObjState.period}|${DB.CURRENT_USER[role].name}`] = mission.value; });

  // Self-assessment edits — write straight to the objective record (keeps focus).
  document.querySelectorAll("[data-self-pct]").forEach((el) =>
    el.addEventListener("input", () => {
      const o = DB.OBJECTIVES.find((x) => x.id === Number(el.dataset.selfPct));
      if (o) objField(o, "selfPercent", el.value === "" ? null : Math.max(0, Math.min(100, Number(el.value))));
    }));
  document.querySelectorAll("[data-self-report]").forEach((el) =>
    el.addEventListener("input", () => {
      const o = DB.OBJECTIVES.find((x) => x.id === Number(el.dataset.selfReport));
      if (o) objField(o, "selfReport", el.value);
    }));

  const add = document.getElementById("add-personal");
  if (add) add.addEventListener("click", () => openCreatePersonal(role));

  // Archive / restore / show-archived toggle (in-memory).
  const toggle = document.getElementById("toggle-archived");
  if (toggle) toggle.addEventListener("click", () => { ObjState.showArchived = !ObjState.showArchived; rerenderObjectives(role); });
  document.querySelectorAll("[data-archive]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.archive));
      if (o) { o.archived = true; rerenderObjectives(role); toastObj(`“${o.title}” archived.`); }
    }));
  document.querySelectorAll("[data-restore]").forEach((b) =>
    b.addEventListener("click", () => {
      const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.restore));
      if (o) { o.archived = false; rerenderObjectives(role); toastObj(`“${o.title}” restored.`); }
    }));
};

// Start the next half-year — only from the current period, only once it has objectives, with confirm.
function confirmNewHalfYear(role) {
  const me = DB.CURRENT_USER[role].name;
  const hasObjective = DB.OBJECTIVES.some((o) => o.owner === me && o.period === DB.PERIOD);
  if (!hasObjective) { toastObj("Add at least one objective to the current half-year before starting a new one."); return; }
  const next = nextPeriodLabel(DB.PERIOD);
  Modal.open(`
    <div class="modal-head"><h3>Start ${next}?</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">This opens a blank objective template for <strong>${next}</strong> and closes <strong>${DB.PERIOD}</strong> (it becomes read-only history).</p>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="confirm-new-half">Start ${next}</button></div>`);
  document.getElementById("confirm-new-half").addEventListener("click", () => {
    if (!DB.PERIODS.includes(next)) DB.PERIODS.unshift(next);
    DB.PERIOD = next;
    ObjState.period = next;
    Modal.close();
    rerenderObjectives(role);
  });
}

function openCreatePersonal(role) {
  const me = DB.CURRENT_USER[role];
  const count = DB.OBJECTIVES.filter((o) => o.owner === me.name && o.category === "personal" && o.period === DB.PERIOD).length;
  if (count >= DB.LIMITS.personal) { toastObj(`You can set at most ${DB.LIMITS.personal} personal objectives per half-year.`); return; }

  Modal.open(`
    <div class="modal-head"><h3>New Personal Objective</h3><button class="close" data-close>×</button></div>
    <div class="field"><label>Title</label><input type="text" id="new-obj-title" placeholder="e.g. Improve Test Coverage" /></div>
    <div class="field"><label>Description</label><textarea id="new-obj-desc" placeholder="What do you want to achieve this half-year?"></textarea></div>
    <div class="field"><label>Target date <span class="muted">· defaults to the half-year end</span></label><input type="date" id="new-obj-target" /></div>
    <div class="small muted">${count} of ${DB.LIMITS.personal} personal objectives used for ${UI.esc(DB.PERIOD)}.</div>
    <div class="modal-foot">
      <button class="btn" data-close>Cancel</button>
      <button class="btn primary" id="create-personal-confirm">Create</button>
    </div>`);

  document.getElementById("create-personal-confirm").addEventListener("click", () => {
    const title = document.getElementById("new-obj-title").value.trim();
    const desc = document.getElementById("new-obj-desc").value.trim();
    const targetDate = document.getElementById("new-obj-target").value;
    if (!title) { toastObj("Give your objective a title."); return; }
    DB.OBJECTIVES.push({
      id: nextObjectiveId(), title, owner: me.name, ownerInitials: me.initials,
      category: "personal", period: DB.PERIOD, description: desc, targetDate,
      selfPercent: 0, selfReport: "", managerPercent: null, managerComment: "", evidence: [], archived: false,
    });
    Modal.close();
    rerenderObjectives(role);
  });
}

function nextObjectiveId() {
  return DB.OBJECTIVES.reduce((max, o) => Math.max(max, o.id), 100) + 1;
}

// Read-only objective detail (also opened from the Feedback tab).
function openDetailModal(id) {
  const o = DB.OBJECTIVES.find((x) => x.id === id);
  if (!o) return;
  const catLabel = o.category === "organization" ? "Organization" : "Personal";
  const evidence = (o.evidence || []).length
    ? o.evidence.map((e) => `<li><span class="ck">✓</span> ${UI.esc(e.text)} <span class="tag">${UI.esc(e.src)}</span></li>`).join("")
    : "";
  const managerBlock = o.managerPercent != null
    ? `<div class="spread"><strong>Manager evaluation</strong><span>${o.managerPercent}%</span></div>
       <p class="muted small" style="margin-top:6px">${UI.esc(o.managerComment) || "No comment."}</p>`
    : `<div class="spread"><strong>Manager evaluation</strong><span class="muted">Pending</span></div>`;

  Modal.open(`
    <div class="modal-head">
      <div>
        <h3>${UI.esc(o.title)}</h3>
        <div class="row small muted" style="margin-top:6px;gap:10px"><span class="tag">${catLabel}</span> <span>${UI.esc(o.period)}</span> <span>🎯 Target ${UI.esc(o.targetDate || UI.periodEnd(o.period))}</span></div>
      </div>
      <button class="close" data-close>×</button>
    </div>
    <p class="muted" style="margin-top:0">${UI.esc(o.description)}</p>

    <div class="divider"></div>
    <div class="spread"><strong>Self evaluation</strong><span>${o.selfPercent != null ? o.selfPercent + "%" : "—"}</span></div>
    <p class="muted small" style="margin-top:6px">${UI.esc(o.selfReport) || "No report provided."}</p>

    <div class="divider"></div>
    ${managerBlock}

    ${evidence ? `<div class="divider"></div><strong>Evidence</strong>
      <div class="small muted" style="margin-bottom:6px">Auto-collected from GitHub · Backlog · Slack</div>
      <ul class="check-list">${evidence}</ul>` : ""}

    <div class="modal-foot"><button class="btn primary" data-close>Close</button></div>`);
}

function rerenderObjectives(role) {
  document.getElementById("content").innerHTML = window.Views.objectives(role);
  window.ViewsWire.objectives(role);
}

// Lightweight toast via the modal host (mirrors the Feedback view's toast).
function toastObj(msg) {
  Modal.open(`
    <div class="modal-head"><h3>Heads up</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
