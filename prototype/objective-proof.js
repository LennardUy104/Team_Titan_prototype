/* Titan prototype — Proof of Output, attached to each Objective. DISTINCT from
   Evidence & Measurement: Evidence is the LEADER's view (auto-collected from
   GitHub/Backlog); Proof of Output is submitted by the EMPLOYEE (objective owner)
   to demonstrate their result — a repo/PR link or an uploaded screenshot
   (e.g. a certificate).

   Shown only when the objective requires it (o.requiresProof, set at creation).
   The owner submits proof on My Objectives; the leader reviews it read-only in the
   objective detail modal. When proof is required and none is attached, the
   objective cannot be marked 100% complete (enforced in views-objectives).

   Fields added to each objective:
     requiresProof — boolean (from objective-form)
     proofs[]      — [{ kind:"link"|"image", value, name }]
                     link  → value = URL,        name = optional label
                     image → value = object URL, name = filename (in-memory only)
   Exposed as window.ObjProof. */
(function () {
  function list(o) { return o.proofs || (o.proofs = []); }
  function count(o) { return list(o).length; }
  // Requirement satisfied? Objectives that don't require proof are always satisfied.
  function has(o) { return !o.requiresProof || count(o) > 0; }

  // One proof item — image thumbnail or link chip; removable when the owner can edit.
  function itemHtml(o, p, idx, canSubmit) {
    const del = canSubmit ? `<button class="btn sm ghost proof-x" data-proof-del="${o.id}:${idx}" title="Remove">✕</button>` : "";
    if (p.kind === "image") {
      return `<div class="proof-item"><img class="proof-thumb" src="${UI.esc(p.value)}" alt="${UI.esc(p.name)}" /><span class="proof-name">${UI.esc(p.name)}</span>${del}</div>`;
    }
    return `<div class="proof-item"><span class="proof-ico">🔗</span><a class="proof-link" href="${UI.esc(p.value)}" target="_blank" rel="noopener">${UI.esc(p.name || p.value)}</a>${del}</div>`;
  }

  // Proof of Output section — rendered only when the objective requires proof.
  // canSubmit: the owner may add/remove (their own current, unlocked objective).
  function panel(o, canSubmit) {
    if (!o.requiresProof) return "";
    const items = list(o);
    const body = items.length
      ? `<div class="proof-list">${items.map((p, i) => itemHtml(o, p, i, canSubmit)).join("")}</div>`
      : `<div class="small muted">No proof submitted yet.</div>`;
    const badge = items.length ? `<span class="badge green">Proof attached</span>` : `<span class="badge red">Proof required</span>`;
    const addBtn = canSubmit ? `<button class="btn sm primary" data-proof-add="${o.id}" style="margin-top:10px">+ Submit proof</button>` : "";
    return `<div class="proof-panel" style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
      <div class="spread" style="align-items:center"><strong style="font-size:var(--fs-label)">Proof of Output</strong>${badge}</div>
      <div class="small muted" style="margin:4px 0 8px">Attach a link (repo, PR, doc) or upload an image (e.g. a certificate) to evidence your result.</div>
      ${body}
      ${addBtn}
    </div>`;
  }

  // Wire the [data-proof-*] controls. rerender() repaints the host.
  function wire(rerender) {
    document.querySelectorAll("[data-proof-add]").forEach((b) =>
      b.addEventListener("click", () => { const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.proofAdd)); if (o) openSubmit(o, rerender); }));
    document.querySelectorAll("[data-proof-del]").forEach((b) =>
      b.addEventListener("click", () => {
        const [id, idx] = b.dataset.proofDel.split(":").map(Number);
        const o = DB.OBJECTIVES.find((x) => x.id === id);
        if (o && o.proofs) { o.proofs.splice(idx, 1); rerender(); }
      }));
  }

  // Submit-proof modal: Link / Image toggle. Image uses a local object-URL preview
  // (in-memory only — clears on reload, since the prototype has no backend).
  function openSubmit(o, rerender) {
    let picked = null; // { value, name } for a chosen image
    let kind = "link";
    Modal.open(`
      <div class="modal-head"><h3>Submit proof of output</h3><button class="close" data-close>×</button></div>
      <div class="small muted" style="margin:-4px 0 12px">${UI.esc(o.title)}</div>
      <div class="role-switch" id="proof-kind" style="margin-bottom:14px">
        <button class="role-btn active" data-proof-kind="link">🔗 Link</button>
        <button class="role-btn" data-proof-kind="image">🖼 Image</button>
      </div>
      <div id="proof-link-fields">
        <div class="field"><label>Link <span class="muted">· repo, PR, doc URL</span></label><input type="url" id="proof-url" placeholder="https://github.com/org/repo/pull/42" /></div>
        <div class="field"><label>Label <span class="muted">· optional</span></label><input type="text" id="proof-label" placeholder="e.g. Coverage PR" /></div>
      </div>
      <div id="proof-image-fields" hidden>
        <div class="field"><label>Image <span class="muted">· screenshot / certificate</span></label><input type="file" id="proof-file" accept="image/*" /></div>
        <div id="proof-preview" style="margin-top:8px"></div>
      </div>
      <div class="small" id="proof-msg" style="color:var(--red);margin-top:6px"></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="proof-save">Attach</button></div>`);

    const linkFields = document.getElementById("proof-link-fields");
    const imageFields = document.getElementById("proof-image-fields");
    const msg = (t) => { document.getElementById("proof-msg").textContent = t || ""; };
    document.querySelectorAll("#proof-kind [data-proof-kind]").forEach((b) =>
      b.addEventListener("click", () => {
        kind = b.dataset.proofKind;
        document.querySelectorAll("#proof-kind .role-btn").forEach((x) => x.classList.toggle("active", x === b));
        linkFields.hidden = kind !== "link";
        imageFields.hidden = kind !== "image";
        msg("");
      }));

    const fileEl = document.getElementById("proof-file");
    fileEl.addEventListener("change", () => {
      const f = fileEl.files && fileEl.files[0];
      if (!f) { picked = null; document.getElementById("proof-preview").innerHTML = ""; return; }
      const url = URL.createObjectURL(f);
      picked = { value: url, name: f.name };
      document.getElementById("proof-preview").innerHTML = `<img class="proof-thumb lg" src="${url}" alt="${UI.esc(f.name)}" /> <span class="small muted">${UI.esc(f.name)}</span>`;
    });

    document.getElementById("proof-save").addEventListener("click", () => {
      if (kind === "link") {
        const url = document.getElementById("proof-url").value.trim();
        if (!url) { msg("Paste a link to attach."); return; }
        list(o).push({ kind: "link", value: url, name: document.getElementById("proof-label").value.trim() });
      } else {
        if (!picked) { msg("Choose an image to attach."); return; }
        list(o).push({ kind: "image", value: picked.value, name: picked.name });
      }
      Modal.close(); rerender();
    });
  }

  window.ObjProof = { panel, wire, openSubmit, has, count };
})();
