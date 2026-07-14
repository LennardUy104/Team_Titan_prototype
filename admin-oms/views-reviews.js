/* Titan prototype — Feedback module. Role-aware, split into two top-level views:
   My Feedback (received)              — both roles.
   Feedback (give feedback to team)    — leader only (nav-gated in app.js). */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Local UI state for the giving-feedback view (resets on reload — fine for a prototype).
// insightsShown: AI Insights are generated on demand, per selected member (not automatic).
const ReviewState = { subjectIdx: 0, insightsShown: false };

// "My Feedback" — feedback the signed-in user has received.
window.Views["my-feedback"] = function (role) {
  return receivedView(role);
};

// "Feedback" — leader gives / finalizes feedback for their team.
// Wrapped in a fresh #feedback-body each render so delegated listeners don't stack.
window.Views["feedback"] = function () {
  return `<div id="feedback-body">${teamView()}</div>`;
};

/* ---------- My Feedback (received) — per-objective manager evaluations, by half-year ---------- */
// Which half-year the "My Feedback" view is showing (its own selector).
const ReceivedState = { period: DB.PERIOD };

function receivedView(role) {
  const me = DB.CURRENT_USER[role].name;
  const period = ReceivedState.period;
  const mine = DB.OBJECTIVES.filter((o) => o.owner === me && o.period === period);

  const cards = mine.map((o) => {
    const done = o.managerPercent != null;
    return `<div class="card" style="margin-bottom:12px">
      <div class="spread" style="align-items:flex-start">
        <div>
          <strong>${UI.esc(o.title)}</strong> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
          <div class="small muted" style="margin-top:4px">Self ${o.selfPercent != null ? o.selfPercent + "%" : "—"}${done ? ` · Manager ${o.managerPercent}%` : ""}</div>
        </div>
        <span class="badge ${done ? "green" : "gray"}">${done ? "Evaluated" : "Pending"}</span>
      </div>
      ${done
        ? `<div class="divider"></div><strong>Manager feedback</strong><p class="muted" style="margin:6px 0 0">${UI.esc(o.managerComment) || "No comment."}</p>`
        : `<div class="empty" style="margin-top:8px">Awaiting your leader's evaluation.</div>`}
    </div>`;
  }).join("") || `<div class="empty">No objectives for ${UI.esc(period)}.</div>`;

  return `
    ${UI.periodSelect(period, { id: "rcv" })}
    <div class="section-head"><div><h2 class="mb-0">My Feedback</h2><div class="small muted">Manager evaluations per objective · ${UI.esc(period)}</div></div></div>
    ${cards}`;
}

/* ---------- Giving feedback: roster status + AI insights + per-objective evaluation ---------- */
// Roster badge derived from how many of the member's objectives are manager-evaluated.
function statusBadgeFor(m) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === m.name && o.period === DB.PERIOD);
  const evald = objs.filter((o) => o.managerPercent != null).length;
  if (!objs.length) return `<span class="badge gray">No objectives</span>`;
  if (evald === objs.length) return `<span class="badge green">Complete</span>`;
  if (evald > 0) return `<span class="badge amber">${evald}/${objs.length} evaluated</span>`;
  return `<span class="badge gray">Not started</span>`;
}

// AI Insights (on demand) — data gathering only; does not draft feedback.
function aiInsightsCard(subject) {
  const body = ReviewState.insightsShown
    ? renderInsights(subject)
    : `<div class="empty" style="padding:22px">Click <strong>Generate AI Insights</strong> to gather supporting data for ${UI.esc(subject.name)}.
        <div class="small muted" style="margin-top:6px">AI gathers facts only — you write the evaluation.</div></div>`;
  return `<div class="card">
    <div class="spread" style="margin-bottom:10px">
      <span class="ai-tag">✦ AI Insights</span>
      <button class="btn sm" id="gen-insights">${ReviewState.insightsShown ? "↻ Regenerate" : "✦ Generate AI Insights"}</button>
    </div>
    ${body}
  </div>`;
}

// Per-objective manager evaluation (% + comment). Saving a % locks the member's self-assessment.
function memberEvalCard(subject) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.period === DB.PERIOD);
  const org = objs.filter((o) => o.category === "organization");
  const personal = objs.filter((o) => o.category === "personal");
  const orgFull = org.length >= DB.LIMITS.organization;

  const row = (o) => {
    const done = o.managerPercent != null;
    return `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div class="spread" style="align-items:flex-start">
        <div style="flex:1">
          <strong>${UI.esc(o.title)}</strong> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
          <div class="small muted" style="margin-top:4px">Self: ${o.selfPercent != null ? o.selfPercent + "%" : "—"} · ${UI.esc(o.selfReport) || "no self report"}</div>
        </div>
        <button class="btn sm ghost" data-obj="${o.id}">Details</button>
      </div>
      <div class="row" style="gap:10px;align-items:flex-end;margin-top:8px">
        <div><label class="small muted">Manager %</label><input type="number" min="0" max="100" value="${done ? o.managerPercent : ""}" data-mgr-pct="${o.id}" placeholder="0–100" style="max-width:110px" /></div>
        <div style="flex:1"><label class="small muted">Comment</label><input type="text" value="${UI.esc(o.managerComment)}" data-mgr-comment="${o.id}" placeholder="Manager's comment…" /></div>
        <button class="btn sm primary" data-save-eval="${o.id}">${done ? "Update" : "Save"}</button>
      </div>
      ${done ? `<div class="small muted" style="margin-top:6px">✓ Evaluated — the member's self-assessment is locked.</div>` : ""}
    </div>`;
  };

  const list = objs.length ? objs.map(row).join("") : `<div class="empty">No objectives for ${UI.esc(subject.name)} yet.</div>`;
  return `<div class="card">
    <div class="card-title">Objectives — ${UI.esc(subject.name)} <span class="hint">${UI.esc(DB.PERIOD)}</span>
      <button class="btn sm" id="add-org" ${orgFull ? "disabled title='Maximum reached'" : ""}>+ Organization Objective</button>
    </div>
    <div class="small muted" style="margin-bottom:6px">Organization ${org.length}/${DB.LIMITS.organization} · Personal ${personal.length}/${DB.LIMITS.personal}. Enter your evaluation per objective.</div>
    ${list}
  </div>`;
}

function teamView() {
  const list = DB.TEAM_EVALUATIONS;
  const subject = list[ReviewState.subjectIdx];
  const rows = list.map((m, i) => {
    const sel = i === ReviewState.subjectIdx ? ' style="background:var(--surface-2)"' : "";
    const tag = m.peerLeader ? ' <span class="tag">Leader</span>' : "";
    return `<div class="row-item clickable" data-subj="${i}"${sel}>
      <span>${UI.who(m.name, m.initials, m.role)}${tag}</span>
      <span class="row" style="gap:10px">${statusBadgeFor(m)}<button class="btn sm" data-subj-btn="${i}">Give Feedback</button></span>
    </div>`;
  }).join("") || `<div class="empty">No team members to give feedback to.</div>`;

  // Right column: AI insights (context) above the per-objective manager evaluation.
  const right = subject
    ? `<div class="stack">${aiInsightsCard(subject)}${memberEvalCard(subject)}</div>`
    : `<div class="card"><div class="empty">Select a team member to give feedback.</div></div>`;

  return `
    <div class="grid grid-2">
      <div class="card"><div class="card-title">Your Team</div>${rows}</div>
      ${right}
    </div>
    ${scheduleCard()}`;
}

/* ---------- Schedule evaluations (calendar + Google Calendar link) ---------- */
function scheduleCard() {
  const g = DB.GOOGLE_CAL;
  const chip = g.connected
    ? `<span class="badge green">Google · ${UI.esc(g.account)}</span> <button class="btn sm" id="gcal-toggle">Disconnect</button>`
    : `<button class="btn sm" id="gcal-toggle">Connect Google Calendar</button>`;

  const subjectOpts = DB.TEAM_EVALUATIONS.map((m) => `<option value="${UI.esc(m.name)}">${UI.esc(m.name)}</option>`).join("");

  const rows = DB.SCHEDULED_EVALUATIONS.length
    ? DB.SCHEDULED_EVALUATIONS.map((s) => `
      <div class="row-item">
        <span>${UI.who(s.subject, s.subjectInitials)}<br><small class="muted">${UI.fmtDateTime(s.date, s.time)} · ${s.durationMin}m</small></span>
        <span class="row" style="gap:8px">
          <a class="btn sm" href="${UI.googleCalUrl("Performance Feedback · " + s.subject, s.date, s.time, s.durationMin, s.notes, g.account)}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
          <button class="btn sm danger" data-unschedule="${s.id}">Remove</button>
        </span>
      </div>`).join("")
    : `<div class="empty">No feedback sessions scheduled.</div>`;

  return `<div class="card" style="margin-top:16px">
    <div class="card-title">Scheduled Feedback <span class="hint">${chip}</span></div>
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px">
      <div class="field" style="margin:0;flex:1;min-width:150px"><label>Team member</label><select id="sched-subject">${subjectOpts}</select></div>
      <div class="field" style="margin:0"><label>Date</label><input type="date" id="sched-date" value="2026-07-20" /></div>
      <div class="field" style="margin:0"><label>Time</label><input type="time" id="sched-time" value="10:00" /></div>
      <div class="field" style="margin:0;flex:1;min-width:150px"><label>Notes</label><input type="text" id="sched-notes" placeholder="Q3 performance feedback" /></div>
      <button class="btn primary" id="sched-add">Schedule</button>
    </div>
    ${rows}
  </div>`;
}

function scheduleEval() {
  const subject = document.getElementById("sched-subject").value;
  const date = document.getElementById("sched-date").value;
  const time = document.getElementById("sched-time").value;
  const notes = document.getElementById("sched-notes").value || "Q3 performance feedback";
  if (!subject || !date || !time) { toast("Pick a team member, date, and time."); return; }
  const m = DB.TEAM_EVALUATIONS.find((x) => x.name === subject);
  DB.SCHEDULED_EVALUATIONS.push({
    id: Date.now(), subject,
    subjectInitials: m ? m.initials : subject.slice(0, 2).toUpperCase(),
    date, time, durationMin: 30, notes,
  });
  rerender();
  toast(`Feedback scheduled for ${subject} on ${UI.fmtDateTime(date, time)}.`);
}

// AI Insights = objective, AI-gathered data & observations to help the leader —
// NOT feedback to hand the employee. Derived from the member's own objectives + evidence.
function renderInsights(subject) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.period === DB.PERIOD);
  if (!objs.length) return `<div class="empty">No objective data available for ${UI.esc(subject.name)} yet.</div>`;

  const avgSelf = Math.round(objs.reduce((a, o) => a + (o.selfPercent || 0), 0) / objs.length);
  const evaluated = objs.filter((o) => o.managerPercent != null).length;
  const facts = [
    `${objs.length} objective${objs.length === 1 ? "" : "s"} · average self-assessment ${avgSelf}%`,
    `${evaluated} of ${objs.length} manager-evaluated`,
    ...objs.map((o) => `${o.title}: self ${o.selfPercent != null ? o.selfPercent + "%" : "—"}${o.selfReport ? ` — ${o.selfReport}` : ""}`),
    ...objs.flatMap((o) => (o.evidence || []).map((e) => `${e.text} — ${e.src}`)).slice(0, 5),
  ];
  const bullets = facts.map((t) => `<li><span class="ck">✓</span> ${UI.esc(t)}</li>`).join("");
  return `<ul class="check-list">${bullets}</ul>
    <div class="small muted" style="margin-top:8px">Objective data gathered by AI. Use it to inform your evaluation — AI does not write feedback.</div>`;
}

/* ---------- Wiring ---------- */
// "My Feedback" (received) — half-year selector (dropdown + stepper), read-only history.
window.ViewsWire["my-feedback"] = function () {
  const sel = document.getElementById("rcv-select");
  if (sel) sel.addEventListener("change", () => { ReceivedState.period = sel.value; rerender(); });
  const stepTo = (delta) => {
    const i = DB.PERIODS.indexOf(ReceivedState.period) + delta;
    if (i >= 0 && i < DB.PERIODS.length) { ReceivedState.period = DB.PERIODS[i]; rerender(); }
  };
  const prev = document.getElementById("rcv-prev");
  if (prev) prev.addEventListener("click", () => stepTo(1));
  const next = document.getElementById("rcv-next");
  if (next) next.addEventListener("click", () => stepTo(-1));
};

// "Feedback" (giving) — leader only.
window.ViewsWire["feedback"] = function () {
  wireTeam();
};

function wireTeam() {
  // Select a subject (row or Give Feedback button)
  document.querySelectorAll("[data-subj], [data-subj-btn]").forEach((el) =>
    el.addEventListener("click", () => {
      const raw = el.dataset.subj != null ? el.dataset.subj : el.dataset.subjBtn;
      const idx = Number(raw);
      if (!Number.isNaN(idx)) selectSubject(idx);
    }));

  // Delegated clicks on the per-render wrapper: open an objective's detail modal.
  document.getElementById("feedback-body").addEventListener("click", (e) => {
    const obj = e.target.closest("[data-obj]");
    if (obj) openDetailModal(Number(obj.dataset.obj));
  });

  // Generate AI Insights on demand (not automatic).
  const gen = document.getElementById("gen-insights");
  if (gen) gen.addEventListener("click", () => { ReviewState.insightsShown = true; rerender(); });

  // Save a per-objective manager evaluation (locks the member's self-assessment).
  document.querySelectorAll("[data-save-eval]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.saveEval);
      const pctEl = document.querySelector(`[data-mgr-pct="${id}"]`);
      const cmtEl = document.querySelector(`[data-mgr-comment="${id}"]`);
      const pct = Number(pctEl.value);
      if (pctEl.value === "" || Number.isNaN(pct) || pct < 0 || pct > 100) { toast("Enter a manager % (0–100) for this objective."); return; }
      const o = DB.OBJECTIVES.find((x) => x.id === id);
      o.managerPercent = pct; o.managerComment = cmtEl.value;
      toast(`Evaluation saved for “${o.title}”.`);
      rerender();
    }));

  // Add an organization objective for the selected member (respecting the cap).
  const addOrg = document.getElementById("add-org");
  if (addOrg) addOrg.addEventListener("click", () => openCreateOrg(DB.TEAM_EVALUATIONS[ReviewState.subjectIdx]));

  // Schedule card: Google connect toggle, add, remove
  const gcal = document.getElementById("gcal-toggle");
  if (gcal) gcal.addEventListener("click", () => { DB.GOOGLE_CAL.connected = !DB.GOOGLE_CAL.connected; rerender(); });

  const add = document.getElementById("sched-add");
  if (add) add.addEventListener("click", scheduleEval);

  document.querySelectorAll("[data-unschedule]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = Number(b.dataset.unschedule);
      DB.SCHEDULED_EVALUATIONS = DB.SCHEDULED_EVALUATIONS.filter((s) => s.id !== id);
      rerender();
    }));
}

function selectSubject(idx) {
  ReviewState.subjectIdx = idx;
  ReviewState.insightsShown = false; // fresh member → leader regenerates insights explicitly
  rerender();
}

// Create an organization objective (manager-assigned) for a team member, capped by DB.LIMITS.
function openCreateOrg(subject) {
  const count = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.category === "organization" && o.period === DB.PERIOD).length;
  if (count >= DB.LIMITS.organization) { toast(`A member can have at most ${DB.LIMITS.organization} organization objectives.`); return; }
  Modal.open(`
    <div class="modal-head"><h3>New Organization Objective</h3><button class="close" data-close>×</button></div>
    <div class="small muted" style="margin:-4px 0 12px">Assigned to ${UI.esc(subject.name)} · ${count} of ${DB.LIMITS.organization} used</div>
    <div class="field"><label>Title</label><input type="text" id="new-org-title" placeholder="e.g. Improve Delivery Reliability" /></div>
    <div class="field"><label>Description</label><textarea id="new-org-desc" placeholder="What should this member achieve this half-year?"></textarea></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="create-org-confirm">Assign</button></div>`);
  document.getElementById("create-org-confirm").addEventListener("click", () => {
    const title = document.getElementById("new-org-title").value.trim();
    const desc = document.getElementById("new-org-desc").value.trim();
    if (!title) { toast("Give the objective a title."); return; }
    DB.OBJECTIVES.push({
      id: nextObjectiveId(), title, owner: subject.name, ownerInitials: subject.initials,
      category: "organization", period: DB.PERIOD, description: desc,
      selfPercent: null, selfReport: "", managerPercent: null, managerComment: "", evidence: [],
    });
    Modal.close();
    rerender();
  });
}

// Re-render whichever feedback view is active (my-feedback | feedback).
function rerender() {
  const role = window.App.role;
  const view = window.App.view;
  document.getElementById("content").innerHTML = window.Views[view](role);
  window.ViewsWire[view](role);
}

// Lightweight toast via the modal host.
function toast(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
