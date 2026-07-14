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

// Objective status mix -> insight-bar segments (band derived from achievement %).
function statusMix(objectives) {
  const by = (s) => objectives.filter((o) => UI.pctStatus(UI.objAchieved(o)) === s).length;
  return [
    { label: "On track",  value: by("on-track"),  color: "var(--green-deep)" },
    { label: "At risk",   value: by("at-risk"),   color: "var(--donut-amber)" },
    { label: "Completed", value: by("completed"), color: "var(--lime)" },
    { label: "Draft",     value: by("draft"),     color: "var(--lime-2)" },
  ];
}

// Compact objective progress rows (title + category/period + achievement bar + status).
function objectiveProgressRows(objectives) {
  return objectives.map((o) => {
    const pct = UI.objAchieved(o);
    const cat = o.category === "organization" ? "Organization" : "Personal";
    return `
    <div class="row-item">
      <span style="flex:1"><strong>${UI.esc(o.title)}</strong><br><small class="muted">${cat} · ${UI.esc(o.period)}</small></span>
      <span style="width:160px;flex-shrink:0">
        ${UI.progress(pct, UI.pctStatus(pct))}
        <div class="spread small muted" style="margin-top:5px"><span>${pct}%</span>${UI.statusBadge(UI.pctStatus(pct))}</div>
      </span>
    </div>`;
  }).join("");
}

/* ---------- KPI tracking (definition · measurement · threshold) ---------- */
function kpiCard(kpi) {
  const k = UI.kpiStat(kpi);
  const targetLabel = kpi.direction === "lower" ? `Target ≤ ${kpi.target}${kpi.unit}` : `Target ${kpi.target}${kpi.unit}`;
  return `<div class="card">
    <div class="spread" style="align-items:flex-start">
      <div style="flex:1">
        <strong>${UI.esc(kpi.name)}</strong>
        <div class="small muted" style="margin-top:2px">${UI.esc(kpi.definition)}</div>
      </div>
      <span class="badge ${k.cls}">${k.label}</span>
    </div>
    <div class="row" style="align-items:flex-end;gap:10px;margin:12px 0 8px">
      <div class="stat-value" style="line-height:1">${kpi.value}${UI.esc(kpi.unit)}</div>
      <div class="small muted" style="margin-bottom:4px">${targetLabel} · ${k.attain}% attainment</div>
    </div>
    ${UI.progress(k.bar, k.barTone)}
  </div>`;
}

function kpiSection(scope) {
  const kpis = DB.KPIS.filter((k) => k.scope === scope);
  if (!kpis.length) return "";
  return `
    <div class="section-head"><div><h2 class="mb-0">KPIs</h2><div class="small muted">Definition · measurement · threshold tracking</div></div></div>
    <div class="grid grid-2" style="margin-bottom:24px">${kpis.map(kpiCard).join("")}</div>`;
}

/* ---------- Employee — personal analytics ---------- */
function employeeAnalytics() {
  const mine = DB.OBJECTIVES.filter((o) => o.owner === DB.CURRENT_USER.employee.name && o.period === DB.PERIOD);
  const avg = mine.length ? Math.round(mine.reduce((a, o) => a + UI.objAchieved(o), 0) / mine.length) : 0;

  return `
    <div class="grid grid-4" style="margin-bottom:16px">
      ${UI.statTile("Overall Score", "88", "+4 vs last H", true)}
      ${UI.statTile("Active Objectives", String(mine.filter((o) => UI.objAchieved(o) < 100).length))}
      ${UI.statTile("Avg Achievement", avg + "%")}
      ${UI.statTile("Peer Rating", "4.4", "+0.3", true)}
    </div>

    ${kpiSection("employee")}

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
      <div class="card-title">Objective Progress <span class="hint">${mine.length} objectives · ${UI.esc(DB.PERIOD)}</span></div>
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

    ${kpiSection("team")}

    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Objective Status Mix <span class="hint">All objectives</span></div>
      ${UI.insightBar(statusMix(DB.OBJECTIVES.filter((o) => o.period === DB.PERIOD)))}
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
