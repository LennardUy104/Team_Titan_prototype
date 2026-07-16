/* Titan prototype — Feedback module.
   Feedback (give feedback to team) — leader only (nav-gated in app.js).
   The former "My Feedback" (received) view was removed — My Objectives already
   shows each objective's manager % and comment, so it was redundant. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Local UI state for the giving-feedback view (resets on reload — fine for a prototype).
//   subjectName  : the employee currently in focus (defaults to the first assigned)
//   insightsShown: AI Insights are generated on demand, per member (not automatic)
//   evaluating   : whether "Start Evaluation" has revealed the editable eval
const ReviewState = { subjectName: null, insightsShown: false, evaluating: false };

// Employees assigned to the current leader for evaluation — driven by Admin ▸ Users
// → Assign Evaluator (u.evaluators). Excludes the leader themselves.
function assignedList() {
  const me = DB.CURRENT_USER[window.App.role].name;
  return DB.EMPLOYEES.filter((u) => u.name !== me && (u.evaluators || []).includes(me));
}
// The employee in focus; defaults to the first assigned employee.
function currentSubject() {
  const list = assignedList();
  if (!list.length) return null;
  let s = list.find((u) => u.name === ReviewState.subjectName);
  if (!s) { s = list[0]; ReviewState.subjectName = s.name; }
  return s;
}

// "Feedback" — leader evaluates the employees assigned to them.
// Wrapped in a fresh #feedback-body each render so delegated listeners don't stack.
window.Views["feedback"] = function () {
  return `<div id="feedback-body">${feedbackView()}</div>`;
};

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
  const evald = objs.filter((o) => o.managerPercent != null).length;
  const allDone = objs.length > 0 && evald === objs.length;

  const row = (o) => {
    const done = o.managerPercent != null;
    return `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div class="spread" style="align-items:flex-start">
        <div style="flex:1">
          <strong>${UI.esc(o.title)}</strong> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
          <div class="small muted" style="margin-top:4px">Self: ${o.selfPercent != null ? o.selfPercent + "%" : "—"} · ${UI.esc(o.selfReport) || "no self report"}</div>
        </div>
        <button class="btn sm" data-obj="${o.id}">📎 Evidence &amp; Measurement</button>
      </div>
      <div style="margin-top:8px">
        <label class="small muted">Manager evaluation · score each key result</label>
        ${window.ObjOKR.krManagerList(o)}
        <div class="row" style="gap:10px;align-items:flex-end;margin-top:8px">
          <div style="flex:1"><label class="small muted">Overall comment</label><input type="text" value="${UI.esc(o.managerComment)}" data-mgr-comment="${o.id}" placeholder="Manager's comment…" /></div>
          <button class="btn sm primary" data-save-eval="${o.id}">${done ? "Update" : "Save"}</button>
        </div>
      </div>
      ${done ? `<div class="small muted" style="margin-top:6px">✓ Evaluated (${o.managerPercent}% overall) — the member's self-assessment is locked.</div>` : ""}
    </div>`;
  };

  const list = objs.length ? objs.map(row).join("") : `<div class="empty">No objectives for ${UI.esc(subject.name)} yet.</div>`;
  return `<div class="card">
    <div class="eval-head">
      <div class="eval-id">
        ${UI.avatar(subject.initials)}
        <div>
          <div class="eval-eyebrow">Evaluating</div>
          <div class="eval-name">${UI.esc(subject.name)}</div>
          <div class="eval-role">${UI.esc(subject.role || "")}</div>
        </div>
      </div>
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
        <span class="badge ${allDone ? "green" : "amber"}">${evald}/${objs.length} evaluated</span>
        <button class="btn sm" id="add-org" ${orgFull ? "disabled title='Maximum reached'" : ""}>+ Organization Objective</button>
        <button class="btn sm" id="eval-done">✓ Done</button>
      </div>
    </div>
    <div class="small muted" style="margin:12px 0 6px">Organization ${org.length}/${DB.LIMITS.organization} · Personal ${personal.length}/${DB.LIMITS.personal}. Enter your evaluation per objective.</div>
    ${list}
  </div>`;
}

function feedbackView() {
  const list = assignedList();
  const subject = currentSubject();
  const header = `<div class="section-head">
    <div><h2 class="mb-0">Feedback</h2><div class="small muted">Evaluate the employees assigned to you · ${UI.esc(DB.PERIOD)}</div></div>
    <button class="btn primary" id="open-members">👥 Assigned Employees (${list.length})</button>
  </div>`;

  if (!subject) {
    return `${header}
      <div class="card"><div class="empty">No employees are assigned to you yet.<div class="small muted" style="margin-top:6px">An admin assigns evaluators in Admin ▸ Users → Assign Evaluator.</div></div></div>`;
  }

  const tag = subject.obsRole === "leader" ? ' <span class="tag">Leader</span>' : "";
  const selectedCard = `<div class="card">
    <div class="spread" style="align-items:center">
      <div>${UI.who(subject.name, subject.initials, subject.role)}${tag}</div>
      <div class="row" style="gap:10px;align-items:center">${statusBadgeFor(subject)}<button class="btn sm" id="open-members-2">Switch employee</button></div>
    </div>
  </div>`;

  // Evaluation is gated behind "Start Evaluation" (revealed inline on the page).
  const evalBlock = ReviewState.evaluating ? memberEvalCard(subject) : evalStartCard(subject);

  return `${header}
    ${selectedCard}
    <div class="stack" style="margin-top:16px">${aiInsightsCard(subject)}${evalBlock}</div>
    ${scheduleCard()}`;
}

// Read-only objective summary + a button to reveal the editable evaluation.
// Design: plans/designs/leader-feedback-evaluation-card.md (Mika).
function evalStartCard(subject) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.period === DB.PERIOD);
  const total = objs.length;
  const evald = objs.filter((o) => o.managerPercent != null).length;
  const allDone = total > 0 && evald === total;
  const pct = total ? Math.round((evald / total) * 100) : 0;

  const rows = total
    ? objs.map((o) => {
        const done = o.managerPercent != null;
        const badge = done
          ? `<span class="badge green">Evaluated · ${o.managerPercent}%</span>`
          : `<span class="badge amber">Not evaluated</span>`;
        return `<div class="eval-row ${done ? "done" : ""}">
          <span class="eval-rail"></span>
          <div class="eval-row-main">
            <span class="eval-row-title">${UI.esc(o.title)}</span> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
            <div class="eval-row-meta">Self-assessed ${o.selfPercent != null ? o.selfPercent + "%" : "—"}</div>
          </div>
          ${badge}
        </div>`;
      }).join("")
    : `<div class="empty">No objectives for ${UI.esc(subject.name)} yet.</div>`;

  const bar = total ? `<div class="eval-bar">${UI.progress(pct, allDone ? "completed" : "at-risk")}</div>` : "";

  return `<div class="card">
    <div class="eval-head">
      <div class="eval-id">
        ${UI.avatar(subject.initials)}
        <div>
          <div class="eval-eyebrow">Evaluation</div>
          <div class="eval-name">${UI.esc(subject.name)}</div>
          <div class="eval-role">${UI.esc(subject.role || "")}</div>
        </div>
      </div>
      <span class="badge ${allDone ? "green" : "amber"}">${evald}/${total} evaluated</span>
    </div>
    ${bar}
    <div class="eval-list">${rows}</div>
    <div class="eval-foot">
      <button class="btn primary" id="start-eval">✎ Start Evaluation</button>
      <span class="hint">Score each objective's key results, then finalize.</span>
    </div>
  </div>`;
}

/* ---------- Schedule evaluations (calendar + Google Calendar link) ---------- */
function scheduleCard() {
  const g = DB.GOOGLE_CAL;
  const chip = g.connected
    ? `<span class="badge green">Google · ${UI.esc(g.account)}</span> <button class="btn sm" id="gcal-toggle">Disconnect</button>`
    : `<button class="btn sm" id="gcal-toggle">Connect Google Calendar</button>`;

  const subjectOpts = assignedList().map((m) => `<option value="${UI.esc(m.name)}">${UI.esc(m.name)}</option>`).join("");

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
  const m = assignedList().find((x) => x.name === subject);
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
// "Feedback" (giving) — leader only.
window.ViewsWire["feedback"] = function () {
  wireFeedback();
};

function wireFeedback() {
  // Open the Slack-style assigned-employees panel (header button + "Switch employee").
  ["open-members", "open-members-2"].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener("click", openMembersPanel);
  });

  // Start / finish the inline evaluation (revealed on the page, not a modal).
  const start = document.getElementById("start-eval");
  if (start) start.addEventListener("click", () => { ReviewState.evaluating = true; rerender(); });
  const evalDone = document.getElementById("eval-done");
  if (evalDone) evalDone.addEventListener("click", () => { ReviewState.evaluating = false; rerender(); });

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
      const o = DB.OBJECTIVES.find((x) => x.id === id);
      const res = window.ObjOKR.saveManagerEval(o); // per-KR scores → o.managerPercent
      if (!res.ok) { toast(res.error); return; }
      const cmtEl = document.querySelector(`[data-mgr-comment="${id}"]`);
      if (cmtEl) o.managerComment = cmtEl.value;
      toast(`Evaluation saved for “${o.title}” (${o.managerPercent}% overall).`);
      rerender();
    }));

  // Add an organization objective for the selected member (respecting the cap).
  const addOrg = document.getElementById("add-org");
  if (addOrg) addOrg.addEventListener("click", () => { const s = currentSubject(); if (s) openCreateOrg(s); });

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

// Slack-style panel listing the leader's assigned employees; pick one to focus.
// Live search re-renders only the list (keeps the search box focused).
function openMembersPanel() {
  const render = (q) => {
    const needle = (q || "").trim().toLowerCase();
    return assignedList()
      .filter((u) => !needle || u.name.toLowerCase().includes(needle) || (u.role || "").toLowerCase().includes(needle))
      .map((u) => {
        const tag = u.obsRole === "leader" ? ' <span class="tag">Leader</span>' : "";
        return `<div class="row-item clickable" data-mem="${UI.esc(u.name)}"><span>${UI.who(u.name, u.initials, u.role)}${tag}</span>${statusBadgeFor(u)}</div>`;
      }).join("") || `<div class="empty">No employees match.</div>`;
  };
  const list = assignedList();
  Modal.open(`
    <div class="modal-head"><div><h3>Assigned Employees</h3><div class="small muted" style="margin-top:4px">${list.length} assigned to you</div></div><button class="close" data-close>×</button></div>
    <input type="search" id="mem-search" placeholder="Find members…" style="width:100%;margin-bottom:8px" />
    <div class="mem-list" id="mem-list">${render("")}</div>`);
  const search = document.getElementById("mem-search");
  const listEl = document.getElementById("mem-list");
  const bindRows = () => listEl.querySelectorAll("[data-mem]").forEach((el) =>
    el.addEventListener("click", () => { selectSubject(el.dataset.mem); Modal.close(); }));
  bindRows();
  search.addEventListener("input", () => { listEl.innerHTML = render(search.value); bindRows(); });
  search.focus();
}

function selectSubject(name) {
  ReviewState.subjectName = name;
  ReviewState.insightsShown = false; // fresh member → leader regenerates insights explicitly
  ReviewState.evaluating = false;    // each member starts read-only until "Start Evaluation"
  rerender();
}

// Create an organization objective (manager-assigned) for a team member, capped by DB.LIMITS.
function openCreateOrg(subject) {
  const count = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.category === "organization" && o.period === DB.PERIOD).length;
  if (count >= DB.LIMITS.organization) { toast(`A member can have at most ${DB.LIMITS.organization} organization objectives.`); return; }
  Modal.open(`
    <div class="modal-head"><h3>New Organization Objective</h3><button class="close" data-close>×</button></div>
    <div class="small muted" style="margin:-4px 0 12px">Assigned to ${UI.esc(subject.name)} · ${count} of ${DB.LIMITS.organization} used</div>
    ${ObjForm.fields()}
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="create-org-confirm">Assign</button></div>`);
  ObjForm.wire();
  document.getElementById("create-org-confirm").addEventListener("click", () => {
    const v = ObjForm.read();
    if (!v.title) { toast("Give the objective a title."); return; }
    DB.OBJECTIVES.push({
      id: nextObjectiveId(), title: v.title, owner: subject.name, ownerInitials: subject.initials,
      category: "organization", period: DB.PERIOD, description: v.description,
      weight: v.weight, focusAreas: v.focusAreas, requiresProof: v.requiresProof,
      selfPercent: null, selfReport: "", managerPercent: null, managerComment: "", evidence: [], keyResults: [],
    });
    Modal.close();
    rerender();
  });
}

// Re-render the active feedback view (leader "feedback").
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
