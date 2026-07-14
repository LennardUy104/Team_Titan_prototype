/* Titan prototype — Evidence Review & Curation. Leader-only (nav-gated in app.js).
   Evidence lives on each objective (objective.evidence[]). Here the leader reviews
   evidence across the team's current-half objectives, marks items curated, removes
   noise, and attaches new supporting evidence. All mutations are in-memory. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const EVIDENCE_SOURCES = ["GitHub", "Backlog", "Slack", "Manual"];

// Flatten evidence across the team's current-period objectives, keeping a back-reference.
function evidenceItems() {
  const out = [];
  DB.OBJECTIVES.filter((o) => o.period === DB.PERIOD && !o.archived).forEach((o) =>
    (o.evidence || []).forEach((e, idx) => out.push({ o, e, idx })));
  return out;
}

// Resolve an "objectiveId:index" key back to its objective + evidence entry.
function evidenceRef(key) {
  const [id, idx] = key.split(":").map(Number);
  const o = DB.OBJECTIVES.find((x) => x.id === id);
  return { o, e: o && o.evidence ? o.evidence[idx] : null, idx };
}

window.Views.evidence = function () {
  const items = evidenceItems();
  const curated = items.filter((x) => x.e.curated).length;
  const rows = items.length ? items.map(({ o, e, idx }) => `
    <tr>
      <td>${UI.who(o.owner, o.ownerInitials, "")}</td>
      <td><strong>${UI.esc(o.title)}</strong></td>
      <td><span class="tag">${UI.esc(e.src)}</span></td>
      <td>${UI.esc(e.text)}</td>
      <td>${e.curated ? `<span class="badge green">Curated</span>` : `<span class="badge gray">Uncurated</span>`}</td>
      <td class="right">
        <button class="btn sm" data-curate="${o.id}:${idx}">${e.curated ? "Uncurate" : "Mark curated"}</button>
        <button class="btn sm danger" data-remove="${o.id}:${idx}">Remove</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty">No evidence attached to team objectives this half-year.</td></tr>`;

  return `
    <div class="section-head">
      <div><h2 class="mb-0">Evidence Review &amp; Curation</h2><div class="small muted">${items.length} item${items.length === 1 ? "" : "s"} · ${curated} curated · ${UI.esc(DB.PERIOD)}</div></div>
      <button class="btn primary" id="ev-attach">+ Attach evidence</button>
    </div>
    <div class="small muted" style="margin:-6px 0 12px">Review evidence auto-collected from GitHub · Backlog · Slack, curate what matters, and attach anything missing.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Owner</th><th>Objective</th><th>Source</th><th>Evidence</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
};

window.ViewsWire.evidence = function () {
  const attach = document.getElementById("ev-attach");
  if (attach) attach.addEventListener("click", openAttachEvidence);

  document.querySelectorAll("[data-curate]").forEach((b) =>
    b.addEventListener("click", () => {
      const { e } = evidenceRef(b.dataset.curate);
      if (e) { e.curated = !e.curated; rerenderEvidence(); }
    }));
  document.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => {
      const { o, idx } = evidenceRef(b.dataset.remove);
      if (o) { o.evidence.splice(idx, 1); rerenderEvidence(); evidenceToast("Evidence removed."); }
    }));
};

function openAttachEvidence() {
  const objs = DB.OBJECTIVES.filter((o) => o.period === DB.PERIOD && !o.archived);
  const opts = objs.map((o) => `<option value="${o.id}">${UI.esc(o.owner)} — ${UI.esc(o.title)}</option>`).join("");
  const srcs = EVIDENCE_SOURCES.map((s) => `<option value="${s}">${s}</option>`).join("");
  Modal.open(`
    <div class="modal-head"><h3>Attach evidence</h3><button class="close" data-close>×</button></div>
    <div class="field"><label>Objective</label><select id="ev-obj">${opts}</select></div>
    <div class="field"><label>Source</label><select id="ev-src">${srcs}</select></div>
    <div class="field"><label>Evidence</label><textarea id="ev-text" placeholder="Describe the supporting evidence…"></textarea></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="ev-save">Attach</button></div>`);
  document.getElementById("ev-save").addEventListener("click", () => {
    const o = DB.OBJECTIVES.find((x) => x.id === Number(document.getElementById("ev-obj").value));
    const text = document.getElementById("ev-text").value.trim();
    if (!o) { evidenceToast("Pick an objective."); return; }
    if (!text) { evidenceToast("Describe the evidence."); return; }
    (o.evidence = o.evidence || []).push({ src: document.getElementById("ev-src").value, text, curated: true });
    Modal.close(); rerenderEvidence(); evidenceToast("Evidence attached and curated.");
  });
}

function rerenderEvidence() {
  document.getElementById("content").innerHTML = window.Views.evidence(window.App.role);
  window.ViewsWire.evidence(window.App.role);
}

function evidenceToast(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
