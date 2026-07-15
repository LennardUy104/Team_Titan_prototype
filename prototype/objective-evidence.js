/* Titan prototype — Evidence & Measurement, attached to each Objective.
   The Objective is the single source of truth: it holds both its performance
   definition (self/manager evaluation, elsewhere) and its evidence requirements
   + collected evidence (here). Rendered inside the objective's Feedback section
   — as a collapsible panel on the objective card, and expanded in the objective
   detail modal (leader Feedback flow). Replaces the old standalone Evidence page.

   Fields added to each objective (see ensure()):
     measurement      — how success is measured
     evidenceExpected — what evidence is expected
     evidenceSources  — where evidence comes from (array, multiple allowed)
     evidenceNotes    — optional supporting guidance
     evidence[]       — collected items { src, text, curated } (pre-existing)
   Editing is LEADER-ONLY; every role can read. Exposed as window.ObjEvidence. */
(function () {
  const SOURCES = ["GitHub", "Backlog", "Slack", "Manual"];

  // Demo enrichment so panels aren't empty (keyed by objective id). Only fills
  // blanks — never overrides anything already set.
  const DEMO_DEFN = {
    101: { measurement: "PR approval rate ≥ 95% and production bugs ≤ 3 per half.", evidenceExpected: "PR review stats and closed-bug counts.", evidenceNotes: "Pull metrics at half-end from the platform repo." },
    102: { measurement: "≥ 90% of committed tasks delivered on schedule.", evidenceExpected: "Task completion and cycle-time reports.", evidenceNotes: "" },
    110: { measurement: "Unit test coverage reaches 80%.", evidenceExpected: "Coverage report or CI badge.", evidenceNotes: "Auth and platform modules are the priority gaps." },
    104: { measurement: "All redesign screens delivered and design system approved.", evidenceExpected: "Handoff link plus stakeholder sign-off.", evidenceNotes: "" },
    107: { measurement: "Team on-time delivery ≥ 90%; sprint carryover ≤ 10%.", evidenceExpected: "Sprint delivery and carryover metrics.", evidenceNotes: "" },
  };

  function ensure(o) {
    if (o.evidenceSources === undefined) o.evidenceSources = [...new Set((o.evidence || []).map((e) => e.src))];
    if (o.measurement === undefined) o.measurement = "";
    if (o.evidenceExpected === undefined) o.evidenceExpected = "";
    if (o.evidenceNotes === undefined) o.evidenceNotes = "";
    const d = DEMO_DEFN[o.id];
    if (d) {
      if (!o.measurement) o.measurement = d.measurement;
      if (!o.evidenceExpected) o.evidenceExpected = d.evidenceExpected;
      if (!o.evidenceNotes) o.evidenceNotes = d.evidenceNotes;
    }
  }
  DB.OBJECTIVES.forEach(ensure);

  const canEdit = () => window.App.role === "leader"; // leader-only editing
  const orEmpty = (s, fallback) => UI.esc(s) || `<span class="muted">${fallback}</span>`;
  const ref = (key) => { const [id, idx] = key.split(":").map(Number); return { o: DB.OBJECTIVES.find((x) => x.id === id), idx }; };

  // Shared body: the evidence definition + collected items (+ controls if editable).
  function body(o) {
    const edit = canEdit();
    const sources = (o.evidenceSources || []);
    const sourceTags = sources.length ? sources.map((s) => `<span class="tag">${UI.esc(s)}</span>`).join(" ") : `<span class="muted small">—</span>`;
    const items = (o.evidence || []);
    const itemList = items.length ? items.map((e, idx) => `
      <li>
        <span class="ck ${e.curated ? "" : "off"}">✓</span>
        ${UI.esc(e.text)} <span class="tag">${UI.esc(e.src)}</span>
        ${e.curated ? `<span class="badge green">Curated</span>` : `<span class="badge gray">Uncurated</span>`}
        ${edit ? `<button class="btn sm ghost" data-oe-curate="${o.id}:${idx}">${e.curated ? "Uncurate" : "Curate"}</button><button class="btn sm ghost" data-oe-remove="${o.id}:${idx}" title="Remove">✕</button>` : ""}
      </li>`).join("") : `<li class="small muted">No evidence collected yet.</li>`;

    return `
      <div class="grid grid-2" style="gap:12px">
        <div><div class="small muted">How it's measured</div><div class="small">${orEmpty(o.measurement, "Not defined")}</div></div>
        <div><div class="small muted">Evidence expected</div><div class="small">${orEmpty(o.evidenceExpected, "Not defined")}</div></div>
        <div><div class="small muted">Sources</div><div>${sourceTags}</div></div>
        <div><div class="small muted">Notes</div><div class="small">${orEmpty(o.evidenceNotes, "—")}</div></div>
      </div>
      <div class="small muted" style="margin:12px 0 4px">Collected evidence <span class="hint">auto-collected from GitHub · Backlog · Slack, plus manual</span></div>
      <ul class="check-list" style="margin:0">${itemList}</ul>
      ${edit ? `<div class="row" style="gap:8px;margin-top:12px"><button class="btn sm" data-oe-editdef="${o.id}">Edit requirements</button><button class="btn sm primary" data-oe-attach="${o.id}">+ Attach evidence</button></div>`
             : `<div class="small muted" style="margin-top:10px">Evidence requirements are managed by your leader.</div>`}`;
  }

  // Collapsible panel for an objective card.
  function panel(o) {
    const count = (o.evidence || []).length;
    return `<details class="ev-panel" style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
      <summary style="cursor:pointer;font-weight:600;font-size:var(--fs-label)">Evidence &amp; Measurement <span class="muted">(${count})</span></summary>
      <div style="margin-top:10px">${body(o)}</div>
    </details>`;
  }

  // Expanded block for the objective detail modal.
  function block(o) {
    return `<div class="divider"></div><strong>Evidence &amp; Measurement</strong><div style="margin-top:8px">${body(o)}</div>`;
  }

  // Wire the [data-oe-*] controls in the document. rerender() repaints the host.
  function wire(rerender) {
    document.querySelectorAll("[data-oe-curate]").forEach((b) =>
      b.addEventListener("click", () => { const { o, idx } = ref(b.dataset.oeCurate); if (o && o.evidence[idx]) { o.evidence[idx].curated = !o.evidence[idx].curated; rerender(); } }));
    document.querySelectorAll("[data-oe-remove]").forEach((b) =>
      b.addEventListener("click", () => { const { o, idx } = ref(b.dataset.oeRemove); if (o) { o.evidence.splice(idx, 1); rerender(); } }));
    document.querySelectorAll("[data-oe-attach]").forEach((b) =>
      b.addEventListener("click", () => { const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.oeAttach)); if (o) openAttach(o, rerender); }));
    document.querySelectorAll("[data-oe-editdef]").forEach((b) =>
      b.addEventListener("click", () => { const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.oeEditdef)); if (o) openEditDef(o, rerender); }));
  }

  function openAttach(o, rerender) {
    const srcs = SOURCES.map((s) => `<option value="${s}">${s}</option>`).join("");
    Modal.open(`
      <div class="modal-head"><h3>Attach evidence</h3><button class="close" data-close>×</button></div>
      <div class="small muted" style="margin:-4px 0 10px">${UI.esc(o.title)}</div>
      <div class="field"><label>Source</label><select id="oe-a-src">${srcs}</select></div>
      <div class="field"><label>Evidence</label><textarea id="oe-a-text" placeholder="Describe the supporting evidence…"></textarea></div>
      <div class="small" id="oe-a-msg" style="color:var(--red)"></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="oe-a-save">Attach</button></div>`);
    document.getElementById("oe-a-save").addEventListener("click", () => {
      const text = document.getElementById("oe-a-text").value.trim();
      if (!text) { document.getElementById("oe-a-msg").textContent = "Describe the evidence."; return; }
      (o.evidence = o.evidence || []).push({ src: document.getElementById("oe-a-src").value, text, curated: true });
      Modal.close(); rerender();
    });
  }

  function openEditDef(o, rerender) {
    const checks = SOURCES.map((s) =>
      `<label style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" class="oe-src" value="${s}" style="width:auto" ${(o.evidenceSources || []).includes(s) ? "checked" : ""}/> ${s}</label>`).join("");
    Modal.open(`
      <div class="modal-head"><h3>Edit evidence requirements</h3><button class="close" data-close>×</button></div>
      <div class="small muted" style="margin:-4px 0 10px">${UI.esc(o.title)}</div>
      <div class="field"><label>How it's measured</label><textarea id="oe-measure" placeholder="e.g. Unit test coverage reaches 80%">${UI.esc(o.measurement)}</textarea></div>
      <div class="field"><label>Evidence expected</label><textarea id="oe-expected" placeholder="What proof demonstrates success?">${UI.esc(o.evidenceExpected)}</textarea></div>
      <div class="field"><label>Sources <span class="hint">where the evidence comes from</span></label><div>${checks}</div></div>
      <div class="field"><label>Notes <span class="hint">optional guidance</span></label><textarea id="oe-notes" placeholder="Anything reviewers should know…">${UI.esc(o.evidenceNotes)}</textarea></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="oe-def-save">Save</button></div>`);
    document.getElementById("oe-def-save").addEventListener("click", () => {
      o.measurement = document.getElementById("oe-measure").value.trim();
      o.evidenceExpected = document.getElementById("oe-expected").value.trim();
      o.evidenceSources = Array.from(document.querySelectorAll(".oe-src:checked")).map((c) => c.value);
      o.evidenceNotes = document.getElementById("oe-notes").value.trim();
      Modal.close(); rerender();
    });
  }

  window.ObjEvidence = { panel, block, wire, SOURCES };
})();
