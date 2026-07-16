/* Titan prototype — shared "create objective" field set. One definition reused by
   every create-objective modal (Personal · Organization · Template item) so the
   form stays identical everywhere. Renders the fields, wires the Focus Area
   multi-select dropdown (chips in the control + a pick list), and reads/validates
   the values back out. In-memory only. */
window.ObjForm = {
  // Focus Area = where the objective's progress/evidence is measured (multi-select).
  // Distinct from `category` (Organization vs Personal).
  FOCUS_OPTIONS: ["GitHub", "Backlog", "Peer Review"],

  // Render the shared fields. `vals` optionally prefills for edit/reuse:
  // { title, description, weight, focusAreas: [], requiresProof }.
  fields(vals) {
    vals = vals || {};
    const sel = new Set(vals.focusAreas || []);
    const opts = this.FOCUS_OPTIONS.map((opt) =>
      `<div class="of-opt ${sel.has(opt) ? "sel" : ""}" data-of-focus="${UI.esc(opt)}">${UI.esc(opt)}</div>`).join("");
    return `
      <div class="field"><label>Title</label><input type="text" id="of-title" value="${UI.esc(vals.title || "")}" placeholder="e.g. Improve Test Coverage" /></div>
      <div class="field"><label>Description</label><textarea id="of-desc" placeholder="What should this objective achieve?">${UI.esc(vals.description || "")}</textarea></div>
      <div class="field"><label>Weight / Measurement</label><input type="text" id="of-weight" value="${UI.esc(vals.weight || "")}" placeholder="e.g. 30% · measured by PR merge rate" /></div>
      <div class="field"><label>Focus Area <span class="muted">· where progress is measured · pick any</span></label>
        <div class="of-select" id="of-focus">
          <div class="of-select-control" tabindex="0"><div class="of-select-chips"></div><span class="of-caret">▾</span></div>
          <div class="of-select-menu" hidden>${opts}</div>
        </div>
      </div>
      <label class="of-check"><input type="checkbox" id="of-proof" ${vals.requiresProof ? "checked" : ""} /> Needs proof of output</label>`;
  },

  // Wire the Focus Area dropdown: open/close, toggle selection, paint chips,
  // remove-by-chip, and close on outside click. Call once after the modal opens.
  wire() {
    const root = document.getElementById("of-focus");
    if (!root) return;
    const control = root.querySelector(".of-select-control");
    const menu = root.querySelector(".of-select-menu");
    const chipsBox = root.querySelector(".of-select-chips");

    // Repaint the chips in the control from the currently-selected options.
    function paint() {
      const chosen = Array.from(menu.querySelectorAll(".of-opt.sel"));
      chipsBox.innerHTML = chosen.length
        ? chosen.map((o) => `<span class="of-chip">${UI.esc(o.dataset.ofFocus)}<button type="button" class="of-chip-x" data-of-remove="${UI.esc(o.dataset.ofFocus)}" title="Remove">×</button></span>`).join("")
        : `<span class="of-ph muted">Select focus area(s)…</span>`;
      chipsBox.querySelectorAll("[data-of-remove]").forEach((b) =>
        b.addEventListener("click", (e) => {
          e.stopPropagation(); // don't toggle the dropdown
          const opt = menu.querySelector(`.of-opt[data-of-focus="${CSS.escape(b.dataset.ofRemove)}"]`);
          if (opt) opt.classList.remove("sel");
          paint();
        }));
    }

    control.addEventListener("click", () => { menu.hidden = !menu.hidden; });
    menu.querySelectorAll(".of-opt").forEach((o) =>
      o.addEventListener("click", () => { o.classList.toggle("sel"); paint(); })); // stay open for multi-pick

    // Single shared outside-click closer (replaced each wire() so it never stacks).
    if (this._outside) document.removeEventListener("click", this._outside);
    this._outside = (e) => {
      const r = document.getElementById("of-focus");
      const m = r && r.querySelector(".of-select-menu");
      if (m && !m.hidden && !r.contains(e.target)) m.hidden = true;
    };
    document.addEventListener("click", this._outside);

    paint();
  },

  // Clear the fields (used when a modal adds several objectives in a row, e.g. the
  // Template builder). Resets inputs, deselects focus areas, and closes the menu.
  reset() {
    ["of-title", "of-desc", "of-weight"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
    const proof = document.getElementById("of-proof"); if (proof) proof.checked = false;
    const root = document.getElementById("of-focus");
    if (root) {
      root.querySelectorAll(".of-opt.sel").forEach((o) => o.classList.remove("sel"));
      const box = root.querySelector(".of-select-chips"); if (box) box.innerHTML = `<span class="of-ph muted">Select focus area(s)…</span>`;
      const menu = root.querySelector(".of-select-menu"); if (menu) menu.hidden = true;
    }
  },

  // Read the shared fields back out. Returns { title, description, weight,
  // focusAreas, requiresProof } — caller validates `title` (required).
  read() {
    return {
      title: document.getElementById("of-title").value.trim(),
      description: document.getElementById("of-desc").value.trim(),
      weight: document.getElementById("of-weight").value.trim(),
      focusAreas: Array.from(document.querySelectorAll("#of-focus .of-opt.sel")).map((o) => o.dataset.ofFocus),
      requiresProof: document.getElementById("of-proof").checked,
    };
  },
};
