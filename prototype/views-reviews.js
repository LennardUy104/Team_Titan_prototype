/* Titan prototype — Reviews view. Role-aware.
   Employee: read-only "My Evaluation" + history.
   Leader:   tabs → Team Evaluations (give/finalize) + My Evaluation (received). */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

// Local UI state (resets on reload — fine for a prototype).
const ReviewState = { tab: "team", subjectIdx: 0, decisions: {}, override: "88" };

window.Views.reviews = function (role) {
  if (role !== "leader") return receivedView("employee");
  return `
    <div class="role-switch" style="margin-bottom:18px">
      <button class="role-btn ${ReviewState.tab === "team" ? "active" : ""}" data-tab="team">Team Evaluations</button>
      <button class="role-btn ${ReviewState.tab === "received" ? "active" : ""}" data-tab="received">My Evaluation</button>
    </div>
    <div id="review-body">${ReviewState.tab === "team" ? teamView() : receivedView("leader")}</div>`;
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
          <div class="card-title" style="margin:0">Evaluated by ${UI.esc(rec.evaluator)}${evalRole}</div>
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
    </div>`).join("") || `<div class="empty">No previous evaluations.</div>`;
  return `<div class="card"><div class="card-title">Evaluation History</div>${rows}</div>`;
}

function receivedView(role) {
  const rec = DB.RECEIVED_EVALUATIONS[DB.CURRENT_USER[role].name];
  if (!rec) {
    return `<div class="card"><div class="card-title">My Evaluation</div>
      <div class="empty">📋 No evaluation yet. Your leader hasn't finalized your review for this period.</div></div>`;
  }
  return `<div class="stack">
    <div class="section-head"><h2 class="mb-0">My Evaluation</h2></div>
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

function teamView() {
  const list = DB.TEAM_EVALUATIONS;
  const rows = list.map((m, i) => {
    const sel = i === ReviewState.subjectIdx ? ' style="background:var(--surface-2)"' : "";
    const tag = m.peerLeader ? ' <span class="tag">Leader</span>' : "";
    return `<div class="row-item clickable" data-subj="${i}"${sel}>
      <span>${UI.who(m.name, m.initials, m.role)}${tag}</span>
      <span class="row" style="gap:10px">${statusBadgeFor(m)}<button class="btn sm" data-subj-btn="${i}">Evaluate</button></span>
    </div>`;
  }).join("");
  return `
    <div class="grid grid-2">
      <div class="card"><div class="card-title">Your Team</div>${rows}</div>
      ${teamEditor(list[ReviewState.subjectIdx])}
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
          <a class="btn sm" href="${UI.googleCalUrl("Performance Evaluation · " + s.subject, s.date, s.time, s.durationMin, s.notes, g.account)}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
          <button class="btn sm danger" data-unschedule="${s.id}">Remove</button>
        </span>
      </div>`).join("")
    : `<div class="empty">No evaluations scheduled.</div>`;

  return `<div class="card" style="margin-top:16px">
    <div class="card-title">Scheduled Evaluations <span class="hint">${chip}</span></div>
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px">
      <div class="field" style="margin:0;flex:1;min-width:150px"><label>Team member</label><select id="sched-subject">${subjectOpts}</select></div>
      <div class="field" style="margin:0"><label>Date</label><input type="date" id="sched-date" value="2026-07-20" /></div>
      <div class="field" style="margin:0"><label>Time</label><input type="time" id="sched-time" value="10:00" /></div>
      <div class="field" style="margin:0;flex:1;min-width:150px"><label>Notes</label><input type="text" id="sched-notes" placeholder="Q3 performance evaluation" /></div>
      <button class="btn primary" id="sched-add">Schedule</button>
    </div>
    ${rows}
  </div>`;
}

function scheduleEval() {
  const subject = document.getElementById("sched-subject").value;
  const date = document.getElementById("sched-date").value;
  const time = document.getElementById("sched-time").value;
  const notes = document.getElementById("sched-notes").value || "Q3 performance evaluation";
  if (!subject || !date || !time) { toast("Pick a team member, date, and time."); return; }
  const m = DB.TEAM_EVALUATIONS.find((x) => x.name === subject);
  DB.SCHEDULED_EVALUATIONS.push({
    id: Date.now(), subject,
    subjectInitials: m ? m.initials : subject.slice(0, 2).toUpperCase(),
    date, time, durationMin: 30, notes,
  });
  rerender();
  toast(`Evaluation scheduled for ${subject} on ${UI.fmtDateTime(date, time)}.`);
}

function teamEditor(subject) {
  const mr = DB.MANAGER_REVIEW;
  const items = mr.suggestions.map((s) => {
    const decision = ReviewState.decisions[s.id];
    const badge = decision === "accepted" ? '<span class="badge green">Accepted</span>'
                : decision === "rejected" ? '<span class="badge red">Rejected</span>' : "";
    return `
      <div class="row-item" data-sugg="${s.id}">
        <span style="flex:1">
          <span class="tag" style="margin-right:8px">${s.tone === "strength" ? "Strength" : "Improvement"}</span>
          ${UI.esc(s.text)} ${badge}
        </span>
        <span class="row" style="gap:6px">
          <button class="btn sm success" data-accept="${s.id}">Accept</button>
          <button class="btn sm danger" data-reject="${s.id}">Reject</button>
        </span>
      </div>`;
  }).join("");

  return `<div class="card">
    <div class="card-title">Evaluate: ${UI.esc(subject.name)} <span class="hint">${UI.esc(mr.period)}</span></div>
    <div class="small muted" style="margin-bottom:10px">Review each AI suggestion, set a final score, then finalize.</div>
    ${items}
    <div class="divider"></div>
    <div class="row" style="gap:16px;align-items:flex-end">
      <div style="text-align:center"><div class="small muted">AI score</div><div class="stat-value" style="color:var(--accent)">${mr.aiScore}</div></div>
      <div style="flex:1"><label class="small muted">Final score</label><input type="number" id="override" value="${UI.esc(ReviewState.override)}" min="0" max="100" /></div>
    </div>
    <div class="field" style="margin-top:12px"><label>Manual Feedback</label><textarea placeholder="Add leader comments…"></textarea></div>
    <div class="modal-foot"><button class="btn primary" id="finalize">Finalize Evaluation</button></div>
  </div>`;
}

/* ---------- Wiring ---------- */
window.ViewsWire.reviews = function (role) {
  // Tabs (leader only)
  document.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => { ReviewState.tab = b.dataset.tab; rerender(); }));

  // Acknowledge on the current received card
  const ack = document.getElementById("ack-eval");
  if (ack) ack.addEventListener("click", () => toast("Evaluation acknowledged"));

  // History "View" → read-only modal
  const rec = DB.RECEIVED_EVALUATIONS[DB.CURRENT_USER[role].name];
  document.querySelectorAll("[data-hist]").forEach((b) =>
    b.addEventListener("click", () => {
      const h = rec.history[Number(b.dataset.hist)];
      Modal.open(`
        <div class="modal-head"><h3>Evaluation · ${UI.esc(h.period)}</h3><button class="close" data-close>×</button></div>
        ${receivedEvalCard(h, { inModal: true })}
        <div class="modal-foot"><button class="btn primary" data-close>Close</button></div>`);
    }));

  // Team editor (leader + team tab only)
  if (role === "leader" && ReviewState.tab === "team") wireTeam();
};

function wireTeam() {
  // Select a subject (row or Evaluate button)
  document.querySelectorAll("[data-subj], [data-subj-btn]").forEach((el) =>
    el.addEventListener("click", () => {
      const raw = el.dataset.subj != null ? el.dataset.subj : el.dataset.subjBtn;
      const idx = Number(raw);
      if (!Number.isNaN(idx)) selectSubject(idx);
    }));

  // Accept / reject AI suggestions (delegated)
  document.getElementById("review-body").addEventListener("click", (e) => {
    const a = e.target.closest("[data-accept]"), r = e.target.closest("[data-reject]");
    if (a) { ReviewState.decisions[a.dataset.accept] = "accepted"; rerender(); }
    else if (r) { ReviewState.decisions[r.dataset.reject] = "rejected"; rerender(); }
  });

  const ov = document.getElementById("override");
  if (ov) ov.addEventListener("change", () => { ReviewState.override = ov.value; });

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
  ReviewState.decisions = {};
  const m = DB.TEAM_EVALUATIONS[idx];
  ReviewState.override = m.score != null ? String(m.score) : String(DB.MANAGER_REVIEW.aiScore);
  rerender();
}

function finalizeCurrent() {
  const m = DB.TEAM_EVALUATIONS[ReviewState.subjectIdx];
  m.status = "finalized";
  m.score = Number(ReviewState.override) || DB.MANAGER_REVIEW.aiScore;
  const n = Object.keys(ReviewState.decisions).length;
  toast(`Evaluation finalized for ${m.name} · ${n} AI comments reviewed · final score ${m.score}`);
  rerender();
}

function rerender() {
  const role = window.App.role;
  document.getElementById("content").innerHTML = window.Views.reviews(role);
  window.ViewsWire.reviews(role);
}

// Lightweight toast via the modal host.
function toast(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
