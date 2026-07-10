/* Titan prototype — Feedback module. Role-aware, split into two top-level views:
   My Feedback (received)              — both roles.
   Feedback (give feedback to team)    — leader only (nav-gated in app.js). */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Local UI state for the giving-feedback view (resets on reload — fine for a prototype).
// insightsShown: AI Insights are generated on demand, per selected member (not automatic).
const ReviewState = { subjectIdx: 0, override: "", insightsShown: false, feedbackText: "" };

// "My Feedback" — feedback the signed-in user has received.
window.Views["my-feedback"] = function (role) {
  return receivedView(role);
};

// "Feedback" — leader gives / finalizes feedback for their team.
// Wrapped in a fresh #feedback-body each render so delegated listeners don't stack.
window.Views["feedback"] = function () {
  return `<div id="feedback-body">${teamView()}</div>`;
};

/* ---------- Received evaluation (read-only) — shared by both roles ---------- */
function receivedEvalCard(rec, opts) {
  opts = opts || {};
  const strengths = rec.strengths.map((s) => `<li><span class="ck">✓</span> ${UI.esc(s)}</li>`).join("");
  const improvements = rec.improvements.map((s) => `<li><span class="ck off">○</span> ${UI.esc(s)}</li>`).join("");
  const evalRole = rec.evaluatorRole ? ` · ${UI.esc(rec.evaluatorRole)}` : "";
  const ack = opts.inModal ? "" : `<div class="modal-foot" style="margin-top:16px"><button class="btn" id="ack-eval">Acknowledge</button></div>`;
  return `
    <div class="card eval-readonly">
      <div class="spread" style="align-items:flex-start">
        <div>
          <div class="card-title" style="margin:0">Feedback by ${UI.esc(rec.evaluator)}${evalRole}</div>
          <div class="small muted" style="margin-top:4px">Period ${UI.esc(rec.period)} · Finalized ${UI.esc(rec.finalizedOn)}</div>
        </div>
        <span class="badge green">Finalized</span>
      </div>
      <div class="divider"></div>
      <div class="row" style="gap:20px;align-items:center">
        <div class="eval-score"><div class="stat-value">${rec.finalScore}</div><div class="stat-label">Final Score</div></div>
        <p class="muted" style="margin:0;flex:1">${UI.esc(rec.summary)}</p>
      </div>
      <div class="divider"></div>
      <div class="fb-cols">
        <div><h4>Strengths</h4><ul class="check-list">${strengths}</ul></div>
        <div><h4>Improvement Areas</h4><ul class="check-list">${improvements}</ul></div>
      </div>
      <div class="divider"></div>
      <strong>Leader Comments</strong>
      <p class="muted" style="margin-top:6px">${UI.esc(rec.comments)}</p>
      ${ack}
    </div>`;
}

function historyList(rec) {
  const hist = (rec && rec.history) || [];
  const rows = hist.map((h, i) => `
    <div class="row-item">
      <span>${UI.esc(h.period)} · <strong>Score ${h.finalScore}</strong> <span class="muted">· by ${UI.esc(h.evaluator)}</span></span>
      <button class="btn sm" data-hist="${i}">View</button>
    </div>`).join("") || `<div class="empty">No previous feedback.</div>`;
  return `<div class="card"><div class="card-title">Feedback History</div>${rows}</div>`;
}

function receivedView(role) {
  const rec = DB.RECEIVED_EVALUATIONS[DB.CURRENT_USER[role].name];
  if (!rec) {
    return `<div class="card"><div class="card-title">My Feedback</div>
      <div class="empty">📋 No feedback yet. Your leader hasn't finalized your feedback for this period.</div></div>`;
  }
  return `<div class="stack">
    <div class="section-head"><h2 class="mb-0">My Feedback</h2></div>
    ${receivedEvalCard(rec)}
    ${historyList(rec)}
  </div>`;
}

/* ---------- Team evaluations (leader gives/finalizes) ---------- */
function statusBadgeFor(m) {
  if (m.status === "finalized") return `<span class="badge green">Finalized ${m.score}</span>`;
  if (m.status === "in-progress") return `<span class="badge amber">In progress</span>`;
  return `<span class="badge gray">Not started</span>`;
}

// The selected team member's objectives — context for giving feedback.
// Rows open the read-only objective detail modal (openDetailModal, from views-objectives.js).
function memberObjectives(subject) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name);
  const body = objs.length ? objs.map((o) => `
    <div class="row-item clickable" data-obj="${o.id}">
      <span style="flex:1">
        <strong>${UI.esc(o.title)}</strong>
        <br><small class="muted">${UI.esc(o.period)} · weight ${o.weight}%</small>
      </span>
      <span style="width:160px;flex-shrink:0">
        ${UI.progress(o.progress, o.status)}
        <div class="spread small muted" style="margin-top:5px"><span>${o.progress}%</span>${UI.statusBadge(o.status)}</div>
      </span>
    </div>`).join("")
    : `<div class="empty">No objectives assigned to ${UI.esc(subject.name)} yet.</div>`;
  return `<div class="card">
    <div class="card-title">${UI.esc(subject.name)}'s Objectives <span class="hint">${objs.length} total</span></div>
    ${body}
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

  // Right column stacks the member's objectives (context) above the feedback editor.
  const right = subject
    ? `<div class="stack">${memberObjectives(subject)}${teamEditor(subject)}</div>`
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
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name);
  if (!objs.length) return `<div class="empty">No objective data available for ${UI.esc(subject.name)} yet.</div>`;

  const avg = Math.round(objs.reduce((a, o) => a + o.progress, 0) / objs.length);
  const onTrack = objs.filter((o) => o.status === "on-track").length;
  const atRisk = objs.filter((o) => o.status === "at-risk").length;
  const facts = [
    `${objs.length} active objective${objs.length === 1 ? "" : "s"} · average progress ${avg}%`,
    `${onTrack} on track · ${atRisk} at risk`,
    ...objs.map((o) => `${o.title}: ${o.progress}% (${o.status.replace("-", " ")})`),
    ...objs.flatMap((o) => o.evidence.map((e) => `${e.text} — ${e.src}`)).slice(0, 6),
  ];
  const bullets = facts.map((t) => `<li><span class="ck">✓</span> ${UI.esc(t)}</li>`).join("");
  return `<ul class="check-list">${bullets}</ul>
    <div class="small muted" style="margin-top:8px">Objective data gathered by AI. Use it to inform the feedback you write below — AI does not draft feedback.</div>`;
}

function teamEditor(subject) {
  const mr = DB.MANAGER_REVIEW;
  const insightsBody = ReviewState.insightsShown
    ? renderInsights(subject)
    : `<div class="empty" style="padding:22px">Click <strong>Generate AI Insights</strong> to gather supporting data and observations for ${UI.esc(subject.name)}.
        <div class="small muted" style="margin-top:6px">AI gathers facts only — you write the feedback.</div></div>`;

  return `<div class="card">
    <div class="card-title">Give Feedback: ${UI.esc(subject.name)} <span class="hint">${UI.esc(mr.period)}</span></div>

    <div class="spread" style="margin-bottom:10px">
      <span class="ai-tag">✦ AI Insights</span>
      <button class="btn sm" id="gen-insights">${ReviewState.insightsShown ? "↻ Regenerate" : "✦ Generate AI Insights"}</button>
    </div>
    ${insightsBody}

    <div class="divider"></div>
    <div class="field"><label>Final score</label><input type="number" id="override" value="${UI.esc(ReviewState.override)}" min="0" max="100" placeholder="Enter score (0–100)" /></div>
    <div class="field"><label>Your Feedback</label><textarea id="leader-feedback" placeholder="Write your feedback for ${UI.esc(subject.name)}…">${UI.esc(ReviewState.feedbackText)}</textarea></div>
    <div class="modal-foot"><button class="btn primary" id="finalize">Finalize Feedback</button></div>
  </div>`;
}

/* ---------- Wiring ---------- */
// "My Feedback" (received) — acknowledge + history modal.
window.ViewsWire["my-feedback"] = function (role) {
  const ack = document.getElementById("ack-eval");
  if (ack) ack.addEventListener("click", () => toast("Feedback acknowledged"));

  const rec = DB.RECEIVED_EVALUATIONS[DB.CURRENT_USER[role].name];
  if (!rec) return;
  document.querySelectorAll("[data-hist]").forEach((b) =>
    b.addEventListener("click", () => {
      const h = rec.history[Number(b.dataset.hist)];
      Modal.open(`
        <div class="modal-head"><h3>Feedback · ${UI.esc(h.period)}</h3><button class="close" data-close>×</button></div>
        ${receivedEvalCard(h, { inModal: true })}
        <div class="modal-foot"><button class="btn primary" data-close>Close</button></div>`);
    }));
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

  // Preserve the leader's in-progress inputs across re-renders (e.g. when generating insights).
  const ov = document.getElementById("override");
  if (ov) ov.addEventListener("input", () => { ReviewState.override = ov.value; });
  const fb = document.getElementById("leader-feedback");
  if (fb) fb.addEventListener("input", () => { ReviewState.feedbackText = fb.value; });

  const fin = document.getElementById("finalize");
  if (fin) fin.addEventListener("click", finalizeCurrent);

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
  ReviewState.feedbackText = "";
  const m = DB.TEAM_EVALUATIONS[idx];
  ReviewState.override = m.score != null ? String(m.score) : ""; // no AI-suggested score
  rerender();
}

function finalizeCurrent() {
  const m = DB.TEAM_EVALUATIONS[ReviewState.subjectIdx];
  const score = Number(ReviewState.override);
  if (ReviewState.override === "" || Number.isNaN(score) || score < 0 || score > 100) {
    toast("Enter a final score (0–100) before finalizing."); return;
  }
  if (!ReviewState.feedbackText.trim()) {
    toast("Write your feedback before finalizing — AI insights don't replace your words."); return;
  }
  m.status = "finalized";
  m.score = score;
  toast(`Feedback finalized for ${m.name} · final score ${m.score}`);
  rerender();
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
