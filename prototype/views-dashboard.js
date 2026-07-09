/* Titan prototype — Dashboard view. Role-aware: employee / leader. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

window.Views.dashboard = function (role) {
  return role === "leader" ? leaderDash() : employeeDash();
};

// Donut segment colors keyed by performance band.
const BAND_COLORS = {
  "Exceeds": "var(--green-deep)",
  "Meets":   "var(--lime)",
  "Below":   "var(--donut-amber)",
  "At Risk": "var(--red)",
};

// Objective status mix -> insight-bar segments.
function objectiveStatusMix() {
  const by = (s) => DB.OBJECTIVES.filter((o) => o.status === s).length;
  return [
    { label: "On track",  value: by("on-track"),  color: "var(--green-deep)" },
    { label: "At risk",   value: by("at-risk"),   color: "var(--donut-amber)" },
    { label: "Completed", value: by("completed"), color: "var(--lime)" },
    { label: "Draft",     value: by("draft"),     color: "var(--lime-2)" },
  ];
}

/* ---------- Employee ---------- */
function employeeDash() {
  const me = DB.CURRENT_USER.employee;
  const mine = DB.OBJECTIVES.filter((o) => o.owner === "Abdul Palala");
  const cards = mine.map((o) => `
    <div class="card">
      <div class="spread">
        <strong>${UI.esc(o.title)}</strong>${UI.statusBadge(o.status)}
      </div>
      <div class="row small muted" style="margin:8px 0 12px;gap:16px">
        <span>Weight ${o.weight}%</span><span>Due ${o.target}</span>
      </div>
      ${UI.progress(o.progress, o.status)}
      <div class="right small muted" style="margin-top:6px">${o.progress}%</div>
    </div>`).join("");

  const feedback = [
    { who: "Maria S.", note: "Always quick to review my PRs — huge help." },
    { who: "Anonymous", note: "Great collaboration during the incident last month." },
  ].map((f) => `<div class="row-item"><span>${UI.esc(f.note)}</span><span class="tag">${UI.esc(f.who)}</span></div>`).join("");

  return `
    ${UI.heroBanner(me.name, "Here's your performance snapshot for Q3 2026.")}

    <div class="grid grid-4" style="margin-bottom:16px">
      ${UI.statTile("Overall Score", "88", "+4 vs last Q", true)}
      ${UI.statTile("Active Objectives", String(mine.filter(o=>o.status!=="completed").length))}
      ${UI.statTile("Avg Progress", Math.round(mine.reduce((a,o)=>a+o.progress,0)/mine.length) + "%")}
      ${UI.statTile("Peer Rating", "4.4", "+0.3", true)}
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">My Objectives <span class="hint">${DB.EMPLOYEES[0].dept}</span></div>
        <div class="stack">${cards}</div>
      </div>
      <div class="stack">
        <div class="card ai-narrative">
          <div class="ai-tag">✦ AI Summary</div>
          <p style="margin:8px 0 0">${UI.esc(DB.AI.summary)}</p>
        </div>
        <div class="card">
          <div class="card-title">Performance Trend</div>
          ${UI.sparkline(DB.TREND_6M, DB.TREND_LABELS)}
        </div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">Peer Feedback</div>
        ${feedback}
      </div>
      <div class="card">
        <div class="card-title">Upcoming Timeline</div>
        <div class="row-item"><span>Q3 self-assessment</span><span class="tag">Jul 25</span></div>
        <div class="row-item"><span>Peer review: Maria Santos</span><span class="tag">Jul 18</span></div>
        <div class="row-item"><span>Objective check-in</span><span class="tag">Aug 01</span></div>
      </div>
    </div>`;
}

/* ---------- Leader (merged Manager + HR: team + org-wide) ---------- */
function leaderDash() {
  const lead = DB.CURRENT_USER.leader;
  const team = DB.EMPLOYEES.filter((e) => e.dept === "Engineering");
  const attention = team.filter((e) => e.status === "at-risk" || e.trend === "down");

  const teamRows = team.map((e) => `
    <tr>
      <td>${UI.who(e.name, e.initials, e.role)}</td>
      <td><strong>${e.score}</strong></td>
      <td>${UI.progress(e.score, e.status)}</td>
      <td>${UI.statusBadge(e.status)}</td>
    </tr>`).join("");

  const att = attention.length
    ? attention.map((e) => `<div class="row-item"><span>${UI.who(e.name, e.initials, e.role)}</span>${UI.statusBadge(e.status)}</div>`).join("")
    : `<div class="empty">No one needs attention 🎉</div>`;

  const distribution = DB.DISTRIBUTION.map((d) => ({ label: d.band, value: d.count, color: BAND_COLORS[d.band] || "var(--muted)" }));
  const distTotal = DB.DISTRIBUTION.reduce((a, d) => a + d.count, 0);

  const deptRows = DB.DEPARTMENTS.map((d) => `
    <tr>
      <td><strong>${UI.esc(d.name)}</strong></td>
      <td>${d.headcount}</td>
      <td>${d.score}</td>
      <td style="min-width:140px">${UI.progress(d.completion, d.completion < 76 ? "at-risk" : "on-track")}</td>
      <td class="right">${d.completion}%</td>
    </tr>`).join("");

  const top = [...DB.EMPLOYEES].sort((a, b) => b.score - a.score).slice(0, 4)
    .map((e) => `<div class="row-item"><span>${UI.who(e.name, e.initials, e.dept)}</span><span class="badge green">${e.score}</span></div>`).join("");

  const low = DB.EMPLOYEES.filter((e) => e.score < 72)
    .map((e) => `<div class="row-item"><span>${UI.who(e.name, e.initials, e.dept)}</span><span class="badge red">${e.score}</span></div>`).join("")
    || `<div class="empty">No low-performance alerts</div>`;

  const upcoming = DB.SCHEDULED_EVALUATIONS.slice(0, 3).map((s) => `
    <div class="row-item">
      <span>${UI.who(s.subject, s.subjectInitials, UI.fmtDateTime(s.date, s.time))}</span>
      <a class="btn sm" href="${UI.googleCalUrl("Performance Evaluation · " + s.subject, s.date, s.time, s.durationMin, s.notes, DB.GOOGLE_CAL.account)}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
    </div>`).join("") || `<div class="empty">No evaluations scheduled.</div>`;

  return `
    ${UI.heroBanner(lead.name, "Your team and organization performance at a glance.")}

    <div class="grid grid-4" style="margin-bottom:16px">
      ${UI.statTile("Team Avg Score", "80", "+2", true)}
      ${UI.statTile("Objective Completion", "78%", "+6%", true)}
      ${UI.statTile("Pending Reviews", String(DB.PEER_REVIEWS.filter(r=>r.status==="pending").length))}
      ${UI.statTile("Need Attention", String(attention.length), "-1", true)}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Objective Status Mix <span class="hint">All objectives</span></div>
      ${UI.insightBar(objectiveStatusMix())}
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">Team Performance</div>
        <table class="table"><thead><tr><th>Member</th><th>Score</th><th>Progress</th><th>Status</th></tr></thead>
        <tbody>${teamRows}</tbody></table>
      </div>
      <div class="card">
        <div class="card-title">Performance Distribution</div>
        ${UI.donut(distribution, "Total", String(distTotal))}
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">Department Performance</div>
        <table class="table"><thead><tr><th>Department</th><th>People</th><th>Score</th><th>Completion</th><th></th></tr></thead>
        <tbody>${deptRows}</tbody></table>
      </div>
      <div class="card">
        <div class="card-title">Department Score Comparison</div>
        ${UI.barChart(DB.DEPARTMENTS.map((d) => ({ label: d.name.slice(0, 4), value: d.score })))}
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">Top Performers</div>${top}
      </div>
      <div class="card">
        <div class="card-title">Low Performance Alerts</div>${low}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">Upcoming Evaluations <span class="hint">Schedule in Reviews → Team Evaluations</span></div>
      ${upcoming}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">Employees Needing Attention</div>
      ${att}
    </div>`;
}

/* ---------- Wiring ---------- */
window.ViewsWire.dashboard = function () {
  // Hero CTA: reuse the nav to navigate + re-render.
  document.querySelectorAll(".hero [data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      const nav = document.querySelector(`.nav-item[data-view="${b.dataset.view}"]`);
      if (nav) nav.click();
    }));
};
