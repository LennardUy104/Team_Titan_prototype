/* Titan prototype — Analytics view. Consolidates graphs + performance metrics
   into one insights-focused screen. Role-aware: employee (personal) / leader (team + org). */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

window.Views.analytics = function (role) {
  return role === "leader" ? leaderAnalytics() : employeeAnalytics();
};

// Donut segment colors keyed by performance band.
const BAND_COLORS = {
  "Exceeds": "var(--green-deep)",
  "Meets":   "var(--lime)",
  "Below":   "var(--donut-amber)",
  "At Risk": "var(--red)",
};

// Objective status mix -> insight-bar segments (over a given objective list).
function statusMix(objectives) {
  const by = (s) => objectives.filter((o) => o.status === s).length;
  return [
    { label: "On track",  value: by("on-track"),  color: "var(--green-deep)" },
    { label: "At risk",   value: by("at-risk"),   color: "var(--donut-amber)" },
    { label: "Completed", value: by("completed"), color: "var(--lime)" },
    { label: "Draft",     value: by("draft"),     color: "var(--lime-2)" },
  ];
}

// Compact objective progress rows (title + weight/due + progress bar + status).
function objectiveProgressRows(objectives) {
  return objectives.map((o) => `
    <div class="row-item">
      <span style="flex:1"><strong>${UI.esc(o.title)}</strong><br><small class="muted">Weight ${o.weight}% · Due ${o.target}</small></span>
      <span style="width:160px;flex-shrink:0">
        ${UI.progress(o.progress, o.status)}
        <div class="spread small muted" style="margin-top:5px"><span>${o.progress}%</span>${UI.statusBadge(o.status)}</div>
      </span>
    </div>`).join("");
}

/* ---------- Employee — personal analytics ---------- */
function employeeAnalytics() {
  const mine = DB.OBJECTIVES.filter((o) => o.owner === DB.CURRENT_USER.employee.name);
  const avg = mine.length ? Math.round(mine.reduce((a, o) => a + o.progress, 0) / mine.length) : 0;

  return `
    <div class="grid grid-4" style="margin-bottom:16px">
      ${UI.statTile("Overall Score", "88", "+4 vs last Q", true)}
      ${UI.statTile("Active Objectives", String(mine.filter((o) => o.status !== "completed").length))}
      ${UI.statTile("Avg Progress", avg + "%")}
      ${UI.statTile("Peer Rating", "4.4", "+0.3", true)}
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">Performance Trend <span class="hint">Last 6 months</span></div>
        ${UI.sparkline(DB.TREND_6M, DB.TREND_LABELS)}
      </div>
      <div class="card">
        <div class="card-title">Objective Status Mix</div>
        ${UI.insightBar(statusMix(mine))}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">Objective Progress <span class="hint">${mine.length} objectives · Q3 2026</span></div>
      <div class="stack">${objectiveProgressRows(mine) || `<div class="empty">No objectives yet</div>`}</div>
    </div>`;
}

/* ---------- Leader — team + org analytics ---------- */
function leaderAnalytics() {
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

  return `
    <div class="grid grid-4" style="margin-bottom:16px">
      ${UI.statTile("Team Avg Score", "80", "+2", true)}
      ${UI.statTile("Objective Completion", "78%", "+6%", true)}
      ${UI.statTile("Pending Feedback", String(DB.PEER_REVIEWS.filter((r) => r.status === "pending").length))}
      ${UI.statTile("Need Attention", String(attention.length), "-1", true)}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Objective Status Mix <span class="hint">All objectives</span></div>
      ${UI.insightBar(statusMix(DB.OBJECTIVES))}
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
      <div class="card-title">Employees Needing Attention</div>
      ${att}
    </div>`;
}
