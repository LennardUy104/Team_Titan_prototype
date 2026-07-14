/* Titan prototype — Reports & Export. Available to every role.
   Generate mocked report drafts and "export" them (PDF / Excel / CSV).
   Real generation/export is backend work; here the actions are simulated. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const REPORT_SETS = {
  leader: [
    { name: "Team Performance Summary", desc: "Half-year snapshot of team objectives, scores, and KPI attainment." },
    { name: "Quarterly Report", desc: "Objective progress and highlights for the quarter." },
    { name: "Half-Year Report", desc: "Full evaluation-cycle summary across the team." },
    { name: "Manager Assessment Draft", desc: "Draft manager assessment compiled from objective data." },
  ],
  employee: [
    { name: "My Half-Year Report", desc: "Your objectives, achievement, and KPI attainment this half-year." },
    { name: "My Objective Progress", desc: "Per-objective progress with supporting evidence." },
    { name: "Self-Assessment Draft", desc: "Draft self-assessment compiled from your objective data." },
  ],
};
const EXPORT_FORMATS = ["PDF", "Excel", "CSV"];

function reportCard(r) {
  const exports = EXPORT_FORMATS.map((f) => `<button class="btn sm" data-export="${UI.esc(r.name)}" data-fmt="${f}">${f}</button>`).join(" ");
  return `<div class="card">
    <div class="card-title">${UI.esc(r.name)}</div>
    <p class="small muted" style="margin:0 0 12px">${UI.esc(r.desc)}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn sm primary" data-generate="${UI.esc(r.name)}">✦ Generate draft</button>
      <span class="small muted">Export:</span> ${exports}
    </div>
  </div>`;
}

window.Views.reports = function (role) {
  const reports = REPORT_SETS[role] || REPORT_SETS.employee;
  const scope = role === "leader" ? "team &amp; personal" : "your own";
  return `
    <div class="section-head"><div><h2 class="mb-0">Reports &amp; Export</h2><div class="small muted">Generate and export ${scope} reports · ${UI.esc(DB.PERIOD)}</div></div></div>
    <div class="small muted" style="margin:-6px 0 14px">Prototype: report generation and export are simulated. The full product renders real PDF / Excel / CSV files.</div>
    <div class="grid grid-2">${reports.map(reportCard).join("")}</div>`;
};

window.ViewsWire.reports = function () {
  document.querySelectorAll("[data-generate]").forEach((b) =>
    b.addEventListener("click", () => openReportDraft(b.dataset.generate)));
  document.querySelectorAll("[data-export]").forEach((b) =>
    b.addEventListener("click", () => reportsToast(`Exported “${b.dataset.export}” as ${b.dataset.fmt} (prototype).`)));
};

function openReportDraft(name) {
  Modal.open(`
    <div class="modal-head"><h3>${UI.esc(name)}</h3><button class="close" data-close>×</button></div>
    <div class="card ai-narrative" style="box-shadow:none">
      <div class="ai-tag">✦ Generated draft</div>
      <p style="margin:8px 0 0">${UI.esc(DB.AI.summary)}</p>
    </div>
    <div class="small muted" style="margin-top:12px">Prototype: content is mocked. Export renders PDF / Excel / CSV in the full product.</div>
    <div class="modal-foot">
      <button class="btn" data-close>Close</button>
      ${EXPORT_FORMATS.map((f) => `<button class="btn ${f === "PDF" ? "primary" : ""}" data-export-modal="${UI.esc(name)}" data-fmt="${f}">Export ${f}</button>`).join("")}
    </div>`);
  document.querySelectorAll("[data-export-modal]").forEach((b) =>
    b.addEventListener("click", () => { Modal.close(); reportsToast(`Exported “${b.dataset.exportModal}” as ${b.dataset.fmt} (prototype).`); }));
}

function reportsToast(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
