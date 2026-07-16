/* Titan prototype — OKR layer for Objectives.
   Objectives follow the OKR framework: a qualitative Objective plus measurable
   Key Results. Each KR is numeric (start → current → target, with a unit); its
   progress = (current − start) / (target − start), which also handles descending
   metrics (e.g. reduce escapes 8 → 2). Per client decisions:
     - The manual self % is KEPT alongside KRs (KRs are informational there).
     - The leader evaluates PER key result; the objective's managerPercent is the
       average of its KR manager scores (once every KR is scored), preserving the
       UI.objAchieved contract used across analytics/reports/overall-score.
   Editing KR definitions is owner-side; per-KR manager scoring is leader-side.
   Exposed as window.ObjOKR. Loaded after mock-data.js, before the view modules. */
(function () {
  // Rich key results for flagship objectives (keyed by id); everything else gets
  // a single fallback KR derived from its existing self/manager percentages.
  const KR_SEED = {
    101: [ { title: "Unit test coverage", start: 60, current: 74, target: 80, unit: "%", managerScore: 76 },
           { title: "Bug tickets closed", start: 0, current: 12, target: 12, unit: "tix", managerScore: 80 } ],
    102: [ { title: "Committed tasks delivered", start: 0, current: 19, target: 22, unit: "tasks" },
           { title: "Avg cycle-time reduction", start: 0, current: 15, target: 20, unit: "%" } ],
    110: [ { title: "Coverage on target modules", start: 65, current: 74, target: 80, unit: "%" } ],
    104: [ { title: "Screens delivered", start: 0, current: 24, target: 24, unit: "screens", managerScore: 95 },
           { title: "Design-system sign-off", start: 0, current: 1, target: 1, unit: "approval", managerScore: 95 } ],
    105: [ { title: "Regression escapes / month", start: 8, current: 5, target: 2, unit: "esc" } ],
    107: [ { title: "On-time delivery", start: 70, current: 88, target: 95, unit: "%" },
           { title: "Sprint carryover", start: 25, current: 12, target: 10, unit: "%" } ],
    109: [ { title: "PR review turnaround", start: 2, current: 1, target: 1, unit: "days" },
           { title: "Production incidents", start: 13, current: 10, target: 8, unit: "inc" } ],
  };

  let seq = 1;
  function ensure(o) {
    if (Array.isArray(o.keyResults)) return; // already has KRs (e.g. runtime-created)
    const seed = KR_SEED[o.id] || [{
      title: "Overall progress", start: 0,
      current: o.selfPercent != null ? o.selfPercent : 0, target: 100, unit: "%",
      managerScore: o.managerPercent != null ? o.managerPercent : null,
    }];
    o.keyResults = seed.map((k) => ({ id: `kr${o.id}-${seq++}`, managerScore: null, ...k }));
  }
  DB.OBJECTIVES.forEach(ensure);

  function krProgress(kr) {
    if (kr.target === kr.start) return kr.current >= kr.target ? 100 : 0;
    const p = Math.round(((kr.current - kr.start) / (kr.target - kr.start)) * 100);
    return Math.max(0, Math.min(100, p));
  }

  // Objective manager % = average of KR manager scores, but only once EVERY KR is
  // scored (mirrors the old "manager has evaluated" lock). Null otherwise.
  function deriveManagerPercent(o) {
    const krs = o.keyResults || [];
    if (!krs.length || krs.some((k) => k.managerScore == null)) return null;
    return Math.round(krs.reduce((a, k) => a + k.managerScore, 0) / krs.length);
  }

  /* ---------- Renderers ---------- */
  // Owner-facing KR list on the objective card (below the manual self %).
  function krSelfList(o, editable) {
    const krs = o.keyResults || [];
    if (!krs.length) return `<div class="small muted" style="margin-top:8px">No key results yet.${editable ? ` <button class="btn sm ghost" data-kr-edit="${o.id}">Add key results</button>` : ""}</div>`;
    const rows = krs.map((kr, i) => {
      const p = krProgress(kr);
      const cur = editable
        ? `<input type="number" data-kr-cur="${o.id}:${i}" value="${kr.current}" style="max-width:76px" />`
        : `<strong>${kr.current}</strong>`;
      return `<div style="margin:8px 0">
        <div class="spread" style="align-items:baseline"><span class="small">${UI.esc(kr.title)}</span><span class="small muted">${cur} / ${kr.target} ${UI.esc(kr.unit)} · ${p}%</span></div>
        ${UI.progress(p, UI.pctStatus(p))}
      </div>`;
    }).join("");
    return `<div style="margin-top:10px"><div class="small muted" style="margin-bottom:2px">Key Results <span class="hint">measurable outcomes</span></div>${rows}${editable ? `<button class="btn sm ghost" data-kr-edit="${o.id}">Edit key results</button>` : ""}</div>`;
  }

  // Per-KR current-value inputs for the Self Evaluation modal. No definition
  // editing and no auto-wiring — values are read on Save via commitCurrents().
  function krEditRows(o) {
    const krs = o.keyResults || [];
    if (!krs.length) return `<div class="small muted">No key results yet.</div>`;
    return krs.map((kr, i) => {
      const p = krProgress(kr);
      return `<div style="margin:8px 0">
        <div class="spread" style="align-items:baseline"><span class="small">${UI.esc(kr.title)}</span><span class="small muted"><input type="number" data-kr-cur="${o.id}:${i}" value="${kr.current}" style="max-width:76px" /> / ${kr.target} ${UI.esc(kr.unit)} · ${p}%</span></div>
        ${UI.progress(p, UI.pctStatus(p))}
      </div>`;
    }).join("");
  }
  // Read the modal's KR current-value inputs into the objective (no rerender).
  function commitCurrents(o) {
    document.querySelectorAll(`[data-kr-cur^="${o.id}:"]`).forEach((el) => {
      const i = Number(el.dataset.krCur.split(":")[1]);
      if (o.keyResults && o.keyResults[i]) o.keyResults[i].current = Number(el.value);
    });
  }

  // Read-only KR block for the objective detail modal.
  function krDetail(o) {
    const krs = o.keyResults || [];
    if (!krs.length) return "";
    const rows = krs.map((kr) => {
      const p = krProgress(kr);
      return `<div style="margin:6px 0"><div class="spread"><span class="small">${UI.esc(kr.title)}</span><span class="small muted">${kr.current}/${kr.target} ${UI.esc(kr.unit)} · ${p}%${kr.managerScore != null ? ` · mgr ${kr.managerScore}%` : ""}</span></div>${UI.progress(p, UI.pctStatus(p))}</div>`;
    }).join("");
    return `<div class="divider"></div><strong>Key Results</strong><div style="margin-top:8px">${rows}</div>`;
  }

  // Leader-facing per-KR manager score inputs (review/feedback card).
  function krManagerList(o) {
    const krs = o.keyResults || [];
    if (!krs.length) return `<div class="small muted">No key results to score.</div>`;
    return krs.map((kr, i) => {
      const p = krProgress(kr);
      return `<div class="spread" style="align-items:flex-end;gap:10px;margin:6px 0">
        <div style="flex:1"><div class="small">${UI.esc(kr.title)}</div><div class="small muted">Self ${kr.current}/${kr.target} ${UI.esc(kr.unit)} · ${p}%</div></div>
        <div><label class="small muted">Mgr %</label><input type="number" min="0" max="100" value="${kr.managerScore != null ? kr.managerScore : ""}" data-kr-mgr="${o.id}:${i}" placeholder="0–100" style="max-width:92px" /></div>
      </div>`;
    }).join("");
  }

  // Read per-KR manager inputs for objective `o` from the DOM, validate, persist,
  // and roll up to o.managerPercent. Returns {ok, error}.
  function saveManagerEval(o) {
    const inputs = Array.from(document.querySelectorAll(`[data-kr-mgr^="${o.id}:"]`));
    if (!inputs.length) return { ok: false, error: "This objective has no key results to score." };
    const vals = [];
    for (const inp of inputs) {
      const v = inp.value, n = Number(v);
      if (v === "" || Number.isNaN(n) || n < 0 || n > 100) return { ok: false, error: "Enter a 0–100 score for every key result." };
      vals.push({ i: Number(inp.dataset.krMgr.split(":")[1]), n });
    }
    vals.forEach((s) => { o.keyResults[s.i].managerScore = s.n; });
    o.managerPercent = deriveManagerPercent(o);
    return { ok: true };
  }

  /* ---------- Owner KR editing + wiring ---------- */
  function wireSelf(rerender) {
    document.querySelectorAll("[data-kr-cur]").forEach((el) =>
      el.addEventListener("change", () => {
        const [id, i] = el.dataset.krCur.split(":").map(Number);
        const o = DB.OBJECTIVES.find((x) => x.id === id);
        if (o && o.keyResults[i]) { o.keyResults[i].current = Number(el.value); rerender(); }
      }));
    document.querySelectorAll("[data-kr-edit]").forEach((b) =>
      b.addEventListener("click", () => { const o = DB.OBJECTIVES.find((x) => x.id === Number(b.dataset.krEdit)); if (o) editKRs(o, rerender); }));
  }

  function editKRs(o, rerender) {
    const items = (o.keyResults || []).map((k) => ({ ...k }));
    Modal.open(`
      <div class="modal-head"><h3>Key Results</h3><button class="close" data-close>×</button></div>
      <div class="small muted" style="margin:-4px 0 10px">${UI.esc(o.title)} · each key result is measured start → target.</div>
      <div class="card" style="box-shadow:none;border:1px solid var(--border);margin-bottom:12px">
        <div class="grid grid-2"><div class="field" style="margin-bottom:8px"><label>Title</label><input type="text" id="kr-title" placeholder="e.g. Unit test coverage" /></div>
          <div class="field" style="margin-bottom:8px"><label>Unit</label><input type="text" id="kr-unit" placeholder="% / tix / days" value="%" /></div></div>
        <div class="grid grid-2"><div class="field" style="margin-bottom:8px"><label>Start</label><input type="number" id="kr-start" value="0" /></div>
          <div class="field" style="margin-bottom:8px"><label>Target</label><input type="number" id="kr-target" value="100" /></div></div>
        <div class="field" style="margin-bottom:8px"><label>Current</label><input type="number" id="kr-current" value="0" /></div>
        <button class="btn sm" id="kr-add">+ Add key result</button>
      </div>
      <ul class="check-list" id="kr-list"></ul>
      <div class="small" id="kr-msg" style="color:var(--red);margin-top:6px"></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="kr-save">Save key results</button></div>`);

    const list = document.getElementById("kr-list");
    const paint = () => {
      list.innerHTML = items.length
        ? items.map((k, idx) => `<li><span class="ck">✓</span> <strong>${UI.esc(k.title)}</strong> <span class="tag">${k.start}→${k.target} ${UI.esc(k.unit)}</span> <button class="btn sm ghost" data-kr-del="${idx}" title="Remove">✕</button></li>`).join("")
        : `<li class="small muted">No key results yet.</li>`;
      list.querySelectorAll("[data-kr-del]").forEach((b) => b.addEventListener("click", () => { items.splice(Number(b.dataset.krDel), 1); paint(); }));
    };
    paint();

    document.getElementById("kr-add").addEventListener("click", () => {
      const title = document.getElementById("kr-title").value.trim();
      if (!title) { document.getElementById("kr-msg").textContent = "Give the key result a title."; return; }
      items.push({
        id: `kr${o.id}-${seq++}`, title,
        start: Number(document.getElementById("kr-start").value) || 0,
        target: Number(document.getElementById("kr-target").value) || 0,
        current: Number(document.getElementById("kr-current").value) || 0,
        unit: document.getElementById("kr-unit").value.trim() || "%",
        managerScore: null,
      });
      document.getElementById("kr-title").value = ""; document.getElementById("kr-msg").textContent = "";
      paint();
    });

    document.getElementById("kr-save").addEventListener("click", () => {
      o.keyResults = items;
      o.managerPercent = deriveManagerPercent(o); // recompute lock if KRs changed
      Modal.close(); rerender();
    });
  }

  window.ObjOKR = { krProgress, krSelfList, krEditRows, commitCurrents, krDetail, krManagerList, saveManagerEval, deriveManagerPercent, wireSelf, editKRs };
})();
