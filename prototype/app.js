/* Titan prototype — app controller: routing, role switching, shared UI helpers, modal. */

const App = {
  // Initial role comes from the login screen's choice (falls back to employee).
  role: (function () {
    try { return localStorage.getItem("titan-role") || "employee"; } catch (e) { return "employee"; }
  })(),
  view: "analytics",    // analytics | objectives | ai | feedback
};

/* ---------- Shared UI helpers (used by every view module) ---------- */
const UI = {
  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  color(seed) {
    const colors = DB.AVATAR_COLORS;
    let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return colors[h % colors.length];
  },

  avatar(initials, size) {
    const s = size === "lg" ? "width:40px;height:40px;font-size:13px" : "";
    return `<span class="av" style="background:${UI.color(initials)};${s}">${UI.esc(initials)}</span>`;
  },

  who(name, initials, sub) {
    return `<span class="who">${UI.avatar(initials)}<span>${UI.esc(name)}${sub ? `<br><small>${UI.esc(sub)}</small>` : ""}</span></span>`;
  },

  // Objective achievement % = manager's evaluation once given, else the self-assessment.
  objAchieved(o) {
    return o.managerPercent != null ? o.managerPercent : (o.selfPercent != null ? o.selfPercent : 0);
  },
  // Derive a status band from a percentage (for progress-bar color + badges).
  pctStatus(pct) {
    return pct >= 100 ? "completed" : pct >= 70 ? "on-track" : pct > 0 ? "at-risk" : "draft";
  },

  // KPI attainment vs target → { attain%, bar% (0–100), badge class + label, bar tone }.
  // Threshold logic: exceeded (≥100%) · on track (≥80%) · at risk (<80%).
  kpiStat(kpi) {
    let attain;
    if (kpi.direction === "lower") attain = kpi.value <= 0 ? 150 : (kpi.target / kpi.value) * 100;
    else attain = kpi.target <= 0 ? 0 : (kpi.value / kpi.target) * 100;
    attain = Math.round(attain);
    let cls, label;
    if (attain >= 100) { cls = "green"; label = "Exceeded"; }
    else if (attain >= 80) { cls = "blue"; label = "On Track"; }
    else { cls = "amber"; label = "At Risk"; }
    return { attain, bar: Math.max(0, Math.min(100, attain)), cls, label, barTone: attain < 80 ? "at-risk" : "on-track" };
  },

  // Default target date for a half-year period ("2026-2nd" -> "Dec 31, 2026").
  // Objectives without an explicit targetDate fall back to their period's end.
  periodEnd(period) {
    const [y, half] = String(period).split("-");
    return half === "1st" ? `Jun 30, ${y}` : `Dec 31, ${y}`;
  },

  // Scalable half-year selector: prev/next stepper + dropdown (+ optional "New half-year").
  // `sel` = currently selected period; opts.id = element id prefix; opts.showNew/newDisabled
  // control the New half-year button. Periods come from DB.PERIODS (newest-first).
  periodSelect(sel, opts) {
    opts = opts || {};
    const id = opts.id || "period";
    const periods = DB.PERIODS;
    const idx = periods.indexOf(sel);
    const options = periods.map((p) =>
      `<option value="${UI.esc(p)}" ${p === sel ? "selected" : ""}>${UI.esc(p)}${p === DB.PERIOD ? " · current" : ""}</option>`).join("");
    const olderDisabled = idx >= periods.length - 1 ? "disabled" : ""; // older = higher index
    const newerDisabled = idx <= 0 ? "disabled" : "";                  // newer = lower index
    const newBtn = opts.showNew
      ? `<button class="btn sm ghost" id="${id}-new-half" ${opts.newDisabled ? `disabled title="Add an objective before starting a new half-year"` : ""}>＋ New half-year</button>`
      : "";
    return `<div class="spread" style="margin-bottom:16px">
      <div class="row" style="gap:8px;align-items:center">
        <span class="small muted">Viewing</span>
        <button class="btn sm" id="${id}-prev" ${olderDisabled} title="Older half-year">‹</button>
        <select id="${id}-select" style="width:auto;min-width:170px">${options}</select>
        <button class="btn sm" id="${id}-next" ${newerDisabled} title="Newer half-year">›</button>
      </div>
      ${newBtn}
    </div>`;
  },

  // Map objective/employee status -> badge markup.
  statusBadge(status) {
    const map = {
      "on-track":  ["green", "On Track"],
      "at-risk":   ["amber", "At Risk"],
      "completed": ["blue",  "Completed"],
      "draft":     ["gray",  "Draft"],
      "pending":   ["amber", "Pending"],
    };
    const [cls, label] = map[status] || ["gray", status];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  progress(pct, status) {
    const tone = status === "at-risk" ? "amber" : status === "completed" ? "" : status === "draft" ? "" : "green";
    return `<div class="progress ${tone}"><span style="width:${pct}%"></span></div>`;
  },

  // Simple pure-CSS bar chart. data: [{label, value}], max optional.
  barChart(data, unit) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return `<div class="bars">${data.map((d) => `
      <div class="bar-col">
        <span class="bar-val">${d.value}${unit || ""}</span>
        <div class="bar" style="height:${Math.round((d.value / max) * 100)}%"></div>
        <span class="bar-lbl">${UI.esc(d.label)}</span>
      </div>`).join("")}</div>`;
  },

  // Inline SVG sparkline/line chart from an array of numbers.
  sparkline(values, labels) {
    const w = 520, h = 90, pad = 6;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const step = (w - pad * 2) / (values.length - 1);
    const pts = values.map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `M${pts[0][0]},${h - pad} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + ` L${pts[pts.length - 1][0]},${h - pad} Z`;
    const dots = pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#5f9e3f" />`).join("");
    const lbls = (labels || []).map((l, i) => `<text x="${(pad + i * step).toFixed(1)}" y="${h - 0}" font-size="9" fill="#9aa89c" text-anchor="middle">${UI.esc(l)}</text>`).join("");
    return `<svg class="spark" viewBox="0 0 ${w} ${h + 12}" preserveAspectRatio="none">
      <path d="${area}" fill="#e9f4dc" />
      <path d="${line}" fill="none" stroke="#5f9e3f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}${lbls}
    </svg>`;
  },

  statTile(label, value, delta, up) {
    const d = delta ? `<div class="stat-delta ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${UI.esc(delta)}</div>` : "";
    return `<div class="stat-tile"><div class="stat-label">${UI.esc(label)}</div><div class="stat-value">${UI.esc(value)}</div>${d}</div>`;
  },

  // NiceAdmin welcome banner. Deep-green card, lime CTA. CTA navigates via nav click.
  heroBanner(name, subtitle) {
    const first = String(name || "").split(" ")[0];
    return `<div class="hero">
      <div>
        <h2>Good Afternoon, ${UI.esc(first)} ☀️</h2>
        <p>${UI.esc(subtitle)}</p>
        <button class="btn primary" data-view="objectives">View Objectives →</button>
      </div>
      <div class="hero-glyph">📈</div>
    </div>`;
  },

  // Pure-CSS conic-gradient donut. segments: [{label, value, color}].
  donut(segments, centerLabel, centerValue) {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    let acc = 0;
    const stops = segments.map((s) => {
      const start = (acc / total) * 100; acc += s.value;
      return `${s.color} ${start.toFixed(1)}% ${((acc / total) * 100).toFixed(1)}%`;
    }).join(", ");
    const legend = segments.map((s) =>
      `<div class="leg"><span class="lbl"><span class="dot" style="background:${s.color}"></span>${UI.esc(s.label)}</span><strong>${s.value}</strong></div>`).join("");
    return `<div class="donut-wrap">
      <div class="donut">
        <div class="donut-ring" style="background:conic-gradient(${stops})"></div>
        <div class="donut-hole"><span class="d-label">${UI.esc(centerLabel)}</span><span class="d-value">${UI.esc(centerValue)}</span></div>
      </div>
      <div class="donut-legend">${legend}</div>
    </div>`;
  },

  // Human date/time for display, e.g. "Jul 15, 2026 · 9:00 AM".
  fmtDateTime(dateStr, timeStr) {
    const [y, m, d] = String(dateStr).split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let out = `${months[(m || 1) - 1]} ${d}, ${y}`;
    if (timeStr) {
      let [h, min] = String(timeStr).split(":").map(Number);
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      out += ` · ${h}:${String(min).padStart(2, "0")} ${ap}`;
    }
    return out;
  },

  // Build a real "Add to Google Calendar" template URL (no backend / OAuth needed).
  googleCalUrl(title, dateStr, timeStr, durationMin, details, guestEmail) {
    const pad = (n) => String(n).padStart(2, "0");
    const [y, mo, d] = String(dateStr).split("-").map(Number);
    const [h, mi] = String(timeStr || "09:00").split(":").map(Number);
    const start = new Date(y, (mo || 1) - 1, d, h || 0, mi || 0, 0);
    const end = new Date(start.getTime() + (durationMin || 30) * 60000);
    const stamp = (dt) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
    const params = [
      "action=TEMPLATE",
      `text=${encodeURIComponent(title || "Performance Feedback")}`,
      `dates=${stamp(start)}/${stamp(end)}`,
      `details=${encodeURIComponent(details || "")}`,
    ];
    if (guestEmail) params.push(`add=${encodeURIComponent(guestEmail)}`);
    return `https://calendar.google.com/calendar/render?${params.join("&")}`;
  },

  // Thin 3+-color proportional bar. segments: [{label, value, color}].
  insightBar(segments) {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const bar = segments.map((s) => `<span style="width:${((s.value / total) * 100).toFixed(1)}%;background:${s.color}"></span>`).join("");
    const legend = segments.map((s) => `<span class="leg"><span class="dot" style="background:${s.color}"></span>${UI.esc(s.label)} ${s.value}</span>`).join("");
    return `<div class="insight-bar">${bar}</div><div class="insight-legend">${legend}</div>`;
  },
};

/* ---------- Theme switcher (presentation only — cycles palette options) ---------- */
const Theme = {
  // Order = cycle order. `dot` is the swatch shown on the switcher button.
  options: [
    { id: "evergreen", name: "Evergreen", dot: "#5f9e3f" },
    { id: "indigo",    name: "Indigo",    dot: "#5b5bd6" },
    { id: "graphite",  name: "Graphite",  dot: "#18181b" },
    { id: "midnight",  name: "Midnight",  dot: "#6bbf59" },
  ],
  key: "titan-theme",

  current() {
    let saved = null;
    try { saved = localStorage.getItem(Theme.key); } catch (e) { /* private mode */ }
    return Theme.options.find((t) => t.id === saved) || Theme.options[0];
  },

  apply(id) {
    const opt = Theme.options.find((t) => t.id === id) || Theme.options[0];
    // Evergreen is the :root default — no attribute keeps CSS clean.
    if (opt.id === "evergreen") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", opt.id);
    try { localStorage.setItem(Theme.key, opt.id); } catch (e) { /* ignore */ }
    const dot = document.getElementById("theme-dot");
    const name = document.getElementById("theme-name");
    if (dot) dot.style.background = opt.dot;
    if (name) name.textContent = opt.name;
  },

  next() {
    const i = Theme.options.findIndex((t) => t.id === Theme.current().id);
    Theme.apply(Theme.options[(i + 1) % Theme.options.length].id);
  },

  init() {
    Theme.apply(Theme.current().id);
    const btn = document.getElementById("theme-switch");
    if (btn) btn.addEventListener("click", Theme.next);
  },
};

/* ---------- Modal ---------- */
const Modal = {
  open(html) {
    document.getElementById("modal").innerHTML = html;
    document.getElementById("modal-overlay").hidden = false;
  },
  close() {
    document.getElementById("modal-overlay").hidden = true;
    document.getElementById("modal").innerHTML = "";
  },
};

/* ---------- Rendering ---------- */
const VIEW_TITLES = {
  analytics: "Analytics",
  objectives: "My Objectives",
  ai: "AI Assistant",
  peer: "Peer Review",
  reports: "Reports",
  feedback: "Feedback",
  admin: "Admin",
};

function render() {
  // Evidence lives on each objective now; My Feedback was folded into My Objectives.
  if (App.view === "evidence" || App.view === "my-feedback") App.view = "objectives";
  // Leader-only views: hide their nav items (+ the leader-only divider) and
  // bounce employees off them.
  ["feedback", "admin"].forEach((v) => {
    const nav = document.querySelector(`.nav-item[data-view="${v}"]`);
    if (nav) nav.style.display = App.role === "leader" ? "" : "none";
  });
  document.querySelectorAll("[data-leader-only]").forEach((el) => {
    el.style.display = App.role === "leader" ? "" : "none";
  });
  if (App.role !== "leader" && (App.view === "feedback" || App.view === "admin")) App.view = "objectives";

  document.getElementById("topbar-title").textContent = VIEW_TITLES[App.view];

  // sync nav active state
  document.querySelectorAll(".nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === App.view));
  document.querySelectorAll(".role-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.role === App.role));

  // user chip
  const u = DB.CURRENT_USER[App.role];
  document.getElementById("user-avatar").textContent = u.initials;
  document.getElementById("user-avatar").style.background = UI.color(u.initials);
  document.getElementById("user-name").textContent = u.name;

  // render active view
  const fn = window.Views[App.view];
  document.getElementById("content").innerHTML = fn ? fn(App.role) : "<div class='empty'>Not found</div>";

  // let the view wire up its own events
  const wire = window.ViewsWire && window.ViewsWire[App.view];
  if (wire) wire(App.role);
}

/* ---------- Events ---------- */
function boot() {
  document.getElementById("nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    App.view = btn.dataset.view;
    render();
  });

  document.getElementById("role-switch").addEventListener("click", (e) => {
    const btn = e.target.closest(".role-btn");
    if (!btn) return;
    App.role = btn.dataset.role;
    try { localStorage.setItem("titan-role", App.role); } catch (err) { /* ignore */ }
    render();
  });

  // Sign out → clear the fake session and return to the login page.
  const signout = document.getElementById("signout");
  if (signout) signout.addEventListener("click", () => {
    try { localStorage.removeItem("titan-authed"); } catch (err) { /* ignore */ }
    window.location.href = "login.html";
  });

  // Close modal on overlay click or [data-close]
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay" || e.target.closest("[data-close]")) Modal.close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") Modal.close(); });

  Theme.init();
  render();
}

window.App = App; window.UI = UI; window.Modal = Modal;
document.addEventListener("DOMContentLoaded", boot);
