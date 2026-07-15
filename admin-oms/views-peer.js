/* Titan prototype — Peer Review. Assignments are generated automatically from
   project membership each evaluation cycle (June & December) — no manual requests.
   Tabs are role-aware:
     Employee: To Review · About Me
     Leader:   To Review · Assignments · About Me
       To Review   — reviews where I'm the reviewer; rate each criterion 1–5 stars
       Assignments — leader monitors/generates/deletes assignments for projects they lead
       About Me    — anonymous aggregate about me: average rating + per-criterion
                     breakdown (reviewers are never shown)
   Peer reviews are ALWAYS anonymous — the subject never sees who reviewed them.
   Reviews are scored against the active template in DB.PEER_REVIEW_TEMPLATE
   (managed in Admin / OMS › Peer Review). Assignment logic lives in PeerAssign. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const PeerState = { tab: "to-review", cycle: DB.CURRENT_CYCLE, asg: { project: "all", subject: "all", status: "all", search: "", view: "all", page: 1, expanded: {} } };
const ASG_GROUPS_PER_PAGE = 10;

// The evaluation cycle in view (peer review repeats every 6 months). Shared
// across all peer tabs; defaults to the open cycle.
function peerCycle() { return DB.EVAL_CYCLES.find((c) => c.id === PeerState.cycle) || DB.EVAL_CYCLES.find((c) => c.id === DB.CURRENT_CYCLE); }
function peerCycleBar() {
  const opts = DB.EVAL_CYCLES.map((c) =>
    `<option value="${c.id}" ${c.id === PeerState.cycle ? "selected" : ""}>${UI.esc(c.label)}${c.id === DB.CURRENT_CYCLE ? " · current" : ""}</option>`).join("");
  return `<div class="row" style="gap:8px;align-items:center;margin-bottom:16px"><span class="small muted">Evaluation cycle</span><select id="peer-cycle" style="max-width:230px">${opts}</select></div>`;
}

// Tabs available to a role. Employees can't request/manage; leaders get Assignments.
function peerTabs(role) {
  const tabs = [{ id: "to-review", label: "To Review" }];
  if (role === "leader") tabs.push({ id: "assignments", label: "Assignments" });
  tabs.push({ id: "about-me", label: "About Me" });
  return tabs;
}

function peerMe() { return DB.CURRENT_USER[window.App.role].name; }

// Read-only star row (rating out of 5).
function peerStars(n) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= n ? "on" : ""}">★</span>`;
  return `<span class="stars" style="cursor:default">${s}</span>`;
}
// Word descriptor shown beside a rating (index = rating - 1).
const PEER_RATING_WORDS = ["Poor", "Fair", "Good", "Great", "Exceptional"];
// Interactive star input; the chosen value lives in the element's data-rating.
// Each input needs a unique id so several can coexist in one modal (one per criterion).
function peerStarsInput(n, id) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= (n || 0) ? "on" : ""}" data-star="${i}">★</span>`;
  return `<span class="stars stars-input stars-lg" id="${id}" data-rating="${n || 0}">${s}</span>`;
}

function peerStatusBadge(status) {
  return status === "completed" ? `<span class="badge blue">Completed</span>` : `<span class="badge amber">Pending</span>`;
}

function peerTabsBar(role) {
  const tabs = peerTabs(role).map((t) =>
    `<button class="role-btn ${t.id === PeerState.tab ? "active" : ""}" data-peer-tab="${t.id}">${t.label}</button>`).join("");
  return `<div class="role-switch" id="peer-tabs" style="margin-bottom:18px">${tabs}</div>`;
}

/* ---------- To Review ---------- */
function toReviewTab() {
  const me = peerMe();
  const mine = DB.PEER_REVIEWS.filter((r) => r.reviewer === me && r.cycleId === PeerState.cycle);
  const pending = mine.filter((r) => r.status === "pending");
  const done = mine.filter((r) => r.status === "completed");

  const pendingCards = pending.length ? pending.map((r) => `
    <div class="card">
      <div class="spread" style="align-items:flex-start">
        <div>${UI.who(r.subject, r.subjectInitials, r.projectName ? `Project · ${UI.esc(r.projectName)}` : "")}</div>
        <div class="row" style="gap:8px;align-items:center">
          ${r.anonymous ? `<span class="tag">Anonymous</span>` : ""}
          <span class="small muted">Due ${UI.esc(r.due)}</span>
        </div>
      </div>
      <div class="right" style="margin-top:12px"><button class="btn primary sm" data-review="${r.id}">Write review</button></div>
    </div>`).join("") : `<div class="empty">No pending reviews assigned to you.</div>`;

  const doneCards = done.map((r) => reviewDoneCard(r)).join("");

  return `
    <div class="section-head">
      <div><h2 class="mb-0">To Review</h2><div class="small muted">${pending.length} pending · ${done.length} completed</div></div>
    </div>
    <div class="grid" style="gap:12px;margin-bottom:24px">${pendingCards}</div>
    ${done.length ? `<div class="section-head"><div><h2 class="mb-0" style="font-size:var(--fs-label)">Completed by you</h2></div></div>
    <div class="grid" style="gap:12px">${doneCards}</div>` : ""}`;
}

// A finished review I wrote (shown under "Completed by you" on To Review), so it
// shows the subject. Peer feedback ABOUT me is never shown per-reviewer — see
// aboutMeTab, which aggregates anonymously.
function reviewDoneCard(r) {
  const scoreRows = (r.scores && r.scores.length)
    ? r.scores.map((s) =>
        `<div class="spread" style="align-items:center;padding:3px 0"><span class="small muted">${UI.esc(s.label)}</span>${peerStars(s.rating)}</div>`).join("")
    : `<div class="small muted">—</div>`;
  return `<div class="card">
    <div class="spread" style="align-items:flex-start">
      <div>${UI.who(r.subject, r.subjectInitials, "")}</div>
      <div style="text-align:right"><div class="small muted">Overall</div>${peerStars(r.rating)}</div>
    </div>
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">${scoreRows}</div>
  </div>`;
}

/* ---------- Assignments (Leader) — enterprise review-monitoring grid ----------
   Rows are grouped by the person being reviewed (no name duplication) and
   expand to reveal reviewers. Summary cards, saved views, filters + search, and
   pagination-over-groups keep it scalable for large HR rosters. Assignments are
   project-driven (PeerAssign) — never manually requested. */

// Derived per-review status: a pending review past the cycle's due date is overdue.
function asgStatusOf(r) {
  if (r.status === "completed") return "completed";
  return (r.due && r.due < DB.TODAY) ? "overdue" : "pending";
}
function asgChip(s) {
  return s === "completed" ? `<span class="badge green">Completed</span>`
    : s === "overdue" ? `<span class="badge red">Overdue</span>`
    : `<span class="badge amber">Pending</span>`;
}
// Saved views set filter combinations without hand-rebuilding them.
function asgApplyView(view) {
  const f = PeerState.asg;
  Object.assign(f, { project: "all", subject: "all", status: "all", search: "", page: 1, view });
  if (view === "pending") f.status = "pending";
  else if (view === "completed") f.status = "completed";
  else if (view === "overdue") f.status = "overdue";
  else if (view === "current-cycle") PeerState.cycle = DB.CURRENT_CYCLE;
  // "all" / "my-team": defaults (a leader is already scoped to their team's projects).
}

function assignmentsTab() {
  const me = peerMe();
  const cyc = peerCycle();
  const f = PeerState.asg;
  const all = PeerAssign.assignmentsForLeader(me, PeerState.cycle);

  // Filter options from the full cycle set; guard stale selections.
  const projects = [...new Set(all.map((r) => r.projectName))].sort();
  const people = [...new Set(all.map((r) => r.subject))].sort();
  if (f.project !== "all" && !projects.includes(f.project)) f.project = "all";
  if (f.subject !== "all" && !people.includes(f.subject)) f.subject = "all";

  const q = (f.search || "").trim().toLowerCase();
  const filtered = all.filter((r) =>
    (f.project === "all" || r.projectName === f.project) &&
    (f.subject === "all" || r.subject === f.subject) &&
    (f.status === "all" || asgStatusOf(r) === f.status) &&
    (!q || r.subject.toLowerCase().includes(q) || r.reviewer.toLowerCase().includes(q)));

  // Summary metrics over the filtered scope.
  const total = filtered.length;
  const completedN = filtered.filter((r) => asgStatusOf(r) === "completed").length;
  const overdueN = filtered.filter((r) => asgStatusOf(r) === "overdue").length;
  const pendingN = filtered.filter((r) => asgStatusOf(r) === "pending").length;
  const rate = total ? Math.round((completedN / total) * 100) : 0;
  const cards = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px">
    ${UI.statTile("Total Assignments", String(total))}
    ${UI.statTile("Pending", String(pendingN))}
    ${UI.statTile("Completed", String(completedN))}
    ${UI.statTile("Overdue", String(overdueN))}
    ${UI.statTile("Completion Rate", rate + "%")}
  </div>`;

  // Saved views.
  const views = [["all", "All Assignments"], ["my-team", "My Team"], ["pending", "Pending"], ["completed", "Completed"], ["overdue", "Overdue"], ["current-cycle", "Current Cycle"]];
  const viewChips = `<div class="role-switch" style="flex-wrap:wrap;margin-bottom:12px">${views.map(([id, label]) =>
    `<button class="role-btn ${f.view === id ? "active" : ""}" data-asg-view="${id}">${label}</button>`).join("")}</div>`;

  // Filter toolbar (Review Cycle is the selector above, from peerCycleBar).
  const opt = (v, label, sel) => `<option value="${UI.esc(v)}" ${v === sel ? "selected" : ""}>${UI.esc(label)}</option>`;
  const toolbar = all.length ? `
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
      <input type="search" id="asg-search" placeholder="Search employee or reviewer…" value="${UI.esc(f.search)}" style="min-width:220px;flex:1" />
      <select id="asg-f-project">${opt("all", "All projects", f.project)}${projects.map((p) => opt(p, p, f.project)).join("")}</select>
      <select id="asg-f-subject">${opt("all", "All people", f.subject)}${people.map((p) => opt(p, p, f.subject)).join("")}</select>
      <select id="asg-f-status">${opt("all", "All statuses", f.status)}${opt("pending", "Pending", f.status)}${opt("overdue", "Overdue", f.status)}${opt("completed", "Completed", f.status)}</select>
      <span class="small muted">${filtered.length} of ${all.length}</span>
    </div>` : "";

  // Group the filtered set by the person being reviewed; paginate the GROUPS.
  const groups = {};
  filtered.forEach((r) => { (groups[r.subject] = groups[r.subject] || []).push(r); });
  const subjects = Object.keys(groups).sort();
  const totalPages = Math.max(1, Math.ceil(subjects.length / ASG_GROUPS_PER_PAGE));
  const page = Math.min(Math.max(1, f.page || 1), totalPages);
  f.page = page;
  const start = (page - 1) * ASG_GROUPS_PER_PAGE;
  const pageSubjects = subjects.slice(start, start + ASG_GROUPS_PER_PAGE);

  const GRID = "display:grid;grid-template-columns:2.4fr 1.4fr 1.9fr 1.1fr 40px;gap:12px;align-items:center";
  const header = `<div style="${GRID};padding:10px 14px;position:sticky;top:0;background:var(--surface);border-bottom:1px solid var(--border);z-index:1">
    <div class="small muted">Employee</div><div class="small muted">Project</div><div class="small muted">Progress</div><div class="small muted">Status</div><div></div>
  </div>`;

  const rows = pageSubjects.map((subj) => {
    const items = groups[subj].slice().sort((a, b) => a.reviewer.localeCompare(b.reviewer));
    const gi = items[0];
    const t = items.length;
    const c = items.filter((r) => asgStatusOf(r) === "completed").length;
    const over = items.filter((r) => asgStatusOf(r) === "overdue").length;
    const pend = t - c - over;
    const pct = t ? Math.round((c / t) * 100) : 0;
    const projTags = [...new Set(items.map((r) => r.projectName))].map((p) => `<span class="tag">${UI.esc(p)}</span>`).join(" ");
    const summ = over ? asgChip("overdue") : (c === t ? `<span class="badge green">Complete</span>` : `<span class="badge amber">In progress</span>`);
    const open = !!f.expanded[subj];
    const groupRow = `<div style="${GRID};padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer" data-asg-toggle="${UI.esc(subj)}">
      <div class="row" style="gap:8px;align-items:center"><span class="muted" style="width:12px;display:inline-block">${open ? "▾" : "▸"}</span>${UI.who(subj, gi.subjectInitials, "")}</div>
      <div>${projTags}</div>
      <div>${UI.progress(pct, UI.pctStatus(pct))}<div class="small muted" style="margin-top:4px">${c}/${t} completed${pend ? ` · ${pend} pending` : ""}${over ? ` · ${over} overdue` : ""}</div></div>
      <div>${summ}</div>
      <div class="right"><button class="btn sm ghost" data-asg-menu="${UI.esc(subj)}" title="Actions">⋯</button></div>
    </div>`;
    const detail = open ? `<div style="padding:4px 14px 12px 40px;border-bottom:1px solid var(--border);background:var(--surface-2)">
      ${items.map((r) => `<div class="spread" style="align-items:center;padding:6px 0">
        <div class="small">${r.reviewer === me ? "You" : UI.esc(r.reviewer)}</div>
        <div class="row" style="gap:10px;align-items:center">${asgChip(asgStatusOf(r))}${r.status === "completed" ? ` ${peerStars(r.rating)}` : ""}<button class="btn sm ghost" data-asg-del="${r.id}" title="Remove">✕</button></div>
      </div>`).join("")}
    </div>` : "";
    return groupRow + detail;
  }).join("");

  const grid = subjects.length
    ? `<div class="card" style="padding:0;overflow:hidden">${header}${rows}</div>`
    : (all.length
      ? `<div class="empty">No assignments match your filters. <button class="btn sm" id="asg-clear">Clear filters</button></div>`
      : `<div class="empty">No assignments yet for projects you lead. <button class="btn sm primary" id="asg-generate-empty">Generate for ${UI.esc(cyc.label)}</button></div>`);

  const pager = subjects.length > ASG_GROUPS_PER_PAGE || page > 1 ? `
    <div class="row" style="justify-content:space-between;align-items:center;margin-top:12px">
      <span class="small muted">Employees ${start + 1}–${Math.min(start + ASG_GROUPS_PER_PAGE, subjects.length)} of ${subjects.length}</span>
      <div class="row" style="gap:8px;align-items:center">
        <button class="btn sm" id="asg-prev" ${page <= 1 ? "disabled" : ""}>‹ Prev</button>
        <span class="small muted">Page ${page} of ${totalPages}</span>
        <button class="btn sm" id="asg-next" ${page >= totalPages ? "disabled" : ""}>Next ›</button>
      </div>
    </div>` : "";

  return `
    <div class="section-head">
      <div><h2 class="mb-0">Assignments</h2><div class="small muted">${UI.esc(cyc.label)} cycle · Due ${UI.esc(cyc.due)} · monitor peer-review completion across your team</div></div>
      <button class="btn primary" id="asg-generate">↻ Generate assignments</button>
    </div>
    ${cards}
    ${viewChips}
    ${toolbar}
    ${grid}
    ${pager}`;
}

/* ---------- About Me ---------- */
// Anonymous aggregate of the peer feedback about me: overall average plus the
// average per criterion. Individual reviewers are NEVER shown.
function aboutMeTab() {
  const me = peerMe();
  const cyc = peerCycle();
  const about = DB.PEER_REVIEWS.filter((r) => r.subject === me && r.status === "completed" && r.cycleId === PeerState.cycle);
  const sub = `Anonymous peer feedback about you · ${UI.esc(cyc.label)}`;

  if (!about.length) {
    return `
      <div class="section-head"><div><h2 class="mb-0">About Me</h2><div class="small muted">${sub}</div></div></div>
      <div class="empty">No completed peer reviews about you for ${UI.esc(cyc.label)} yet.</div>`;
  }

  const avg = about.reduce((a, r) => a + (r.rating || 0), 0) / about.length;

  // Average each criterion across all reviews, ordered by the template.
  const agg = {}; // label -> { sum, n }
  about.forEach((r) => (r.scores || []).forEach((s) => {
    const a = agg[s.label] || (agg[s.label] = { sum: 0, n: 0 });
    a.sum += s.rating; a.n += 1;
  }));
  const templateOrder = (DB.PEER_REVIEW_TEMPLATE.criteria || []).map((c) => c.label);
  const labels = [...templateOrder.filter((l) => agg[l]), ...Object.keys(agg).filter((l) => !templateOrder.includes(l))];
  const breakdown = labels.map((l) => {
    const a = agg[l], av = a.sum / a.n;
    return `<div class="spread" style="align-items:center;padding:9px 0;border-bottom:1px solid var(--border)">
      <div><div class="small">${UI.esc(l)}</div><div class="small muted">${a.n} rating${a.n === 1 ? "" : "s"}</div></div>
      <div class="row" style="gap:10px;align-items:center">${peerStars(Math.round(av))}<strong>${av.toFixed(1)}</strong></div>
    </div>`;
  }).join("");

  const summary = `
    <div class="card" style="margin-bottom:18px">
      <div class="spread">
        <div><div class="stat-label">Average peer rating</div><div class="stat-value">${avg.toFixed(1)} <span class="small muted">/ 5</span></div></div>
        ${peerStars(Math.round(avg))}
      </div>
      <div class="small muted" style="margin-top:8px">🕶 ${about.length} anonymous peer review${about.length === 1 ? "" : "s"} · reviewers are not shown</div>
    </div>`;

  const breakdownCard = `
    <div class="card">
      <div class="card-title" style="margin:0 0 4px">Rating by criterion</div>
      <div class="small muted" style="margin-bottom:6px">Average across all peer reviews about you.</div>
      ${breakdown}
    </div>`;

  return `
    <div class="section-head"><div><h2 class="mb-0">About Me</h2><div class="small muted">${sub}</div></div></div>
    ${summary}
    ${breakdownCard}`;
}

/* ---------- View + wiring ---------- */
window.Views.peer = function () {
  const role = window.App.role;
  // Guard: if the active tab isn't available to this role (e.g. switched from
  // Leader's "Assignments" back to Employee), fall back to To Review.
  if (!peerTabs(role).some((t) => t.id === PeerState.tab)) PeerState.tab = "to-review";
  if (!DB.EVAL_CYCLES.some((c) => c.id === PeerState.cycle)) PeerState.cycle = DB.CURRENT_CYCLE;
  const body = PeerState.tab === "assignments" ? assignmentsTab()
    : PeerState.tab === "about-me" ? aboutMeTab() : toReviewTab();
  return `${peerTabsBar(role)}${peerCycleBar()}${body}`;
};

window.ViewsWire.peer = function () {
  document.querySelectorAll("#peer-tabs [data-peer-tab]").forEach((b) =>
    b.addEventListener("click", () => { PeerState.tab = b.dataset.peerTab; rerenderPeer(); }));

  const cy = document.getElementById("peer-cycle");
  if (cy) cy.addEventListener("change", () => { PeerState.cycle = cy.value; PeerState.asg.page = 1; rerenderPeer(); });

  if (PeerState.tab === "to-review") {
    document.querySelectorAll("[data-review]").forEach((b) =>
      b.addEventListener("click", () => openPeerReview(Number(b.dataset.review))));
  } else if (PeerState.tab === "assignments") {
    const doGenerate = () => {
      const res = PeerAssign.generate(PeerState.cycle);
      rerenderPeer();
      peerToast(res.added ? `Generated ${res.added} new assignment${res.added === 1 ? "" : "s"}${res.skipped ? `, ${res.skipped} already existed` : ""}.` : `All assignments already generated for this cycle — nothing to add.`);
    };
    const gen = document.getElementById("asg-generate");
    if (gen) gen.addEventListener("click", doGenerate);
    const genEmpty = document.getElementById("asg-generate-empty");
    if (genEmpty) genEmpty.addEventListener("click", doGenerate);

    // Filters (any change → custom view, page 1).
    [["asg-f-project", "project"], ["asg-f-subject", "subject"], ["asg-f-status", "status"]].forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) el.addEventListener("change", () => { PeerState.asg[key] = el.value; PeerState.asg.view = "custom"; PeerState.asg.page = 1; rerenderPeer(); });
    });

    // Live search — re-render, then restore focus + caret to the search box.
    const search = document.getElementById("asg-search");
    if (search) search.addEventListener("input", () => {
      PeerState.asg.search = search.value; PeerState.asg.view = "custom"; PeerState.asg.page = 1;
      rerenderPeer();
      const s = document.getElementById("asg-search");
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    });

    // Saved views + clear-filters CTA.
    document.querySelectorAll("[data-asg-view]").forEach((b) =>
      b.addEventListener("click", () => { asgApplyView(b.dataset.asgView); rerenderPeer(); }));
    const clear = document.getElementById("asg-clear");
    if (clear) clear.addEventListener("click", () => { asgApplyView("all"); rerenderPeer(); });

    // Expand/collapse a person's group (ignore clicks on the overflow button).
    document.querySelectorAll("[data-asg-toggle]").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-asg-menu]")) return;
        const s = el.dataset.asgToggle;
        PeerState.asg.expanded[s] = !PeerState.asg.expanded[s];
        rerenderPeer();
      }));

    // Row-actions overflow menu.
    document.querySelectorAll("[data-asg-menu]").forEach((b) =>
      b.addEventListener("click", (e) => { e.stopPropagation(); openAsgActions(b.dataset.asgMenu); }));

    // Pagination over employee groups.
    const prev = document.getElementById("asg-prev");
    if (prev) prev.addEventListener("click", () => { PeerState.asg.page = (PeerState.asg.page || 1) - 1; rerenderPeer(); });
    const next = document.getElementById("asg-next");
    if (next) next.addEventListener("click", () => { PeerState.asg.page = (PeerState.asg.page || 1) + 1; rerenderPeer(); });

    // Delete an individual assignment.
    document.querySelectorAll("[data-asg-del]").forEach((b) =>
      b.addEventListener("click", (e) => { e.stopPropagation(); PeerAssign.remove(Number(b.dataset.asgDel)); rerenderPeer(); }));
  }
};

/* ---------- Modals ---------- */
// Bind every interactive star widget in the current modal independently.
// onChange (optional) fires after any rating changes — used to refresh progress.
function bindStarInputs(onChange) {
  document.querySelectorAll(".stars-input").forEach((box) =>
    box.querySelectorAll(".star[data-star]").forEach((st) =>
      st.addEventListener("click", () => {
        const val = Number(st.dataset.star);
        box.dataset.rating = String(val);
        box.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.star) <= val));
        const desc = document.getElementById(`${box.id}-desc`);
        if (desc) desc.textContent = PEER_RATING_WORDS[val - 1] || "";
        if (onChange) onChange();
      })));
}

function openPeerReview(id) {
  const r = DB.PEER_REVIEWS.find((x) => x.id === id);
  if (!r) return;
  const crits = DB.PEER_REVIEW_TEMPLATE.criteria || [];
  // Prefill from any prior scores on this review (keyed by criterion label).
  const prev = {};
  (r.scores || []).forEach((s) => { prev[s.label] = s.rating; });

  const cards = crits.length
    ? crits.map((c) => {
        const rating = prev[c.label] || 0;
        return `<div class="peer-card">
           <label style="margin:0">${UI.esc(c.label)}</label>${c.description ? `<div class="small muted" style="margin-top:2px">${UI.esc(c.description)}</div>` : ""}
           <div class="peer-rate">${peerStarsInput(rating, `pc-${c.id}`)}<span class="peer-desc" id="pc-${c.id}-desc">${rating ? PEER_RATING_WORDS[rating - 1] : ""}</span></div>
         </div>`;
      }).join("")
    : `<div class="empty">No review criteria are configured yet. A Leader can add them in Admin › Peer Review.</div>`;

  Modal.open(`
    <div class="modal-head">
      <div><h3>Review ${UI.esc(r.subject)}</h3><div class="small muted" style="margin-top:4px">🕶 Anonymous — ${UI.esc(r.subject)} won't see who wrote this · ${UI.esc(DB.PEER_REVIEW_TEMPLATE.name)}</div></div>
      <button class="close" data-close>×</button>
    </div>
    ${crits.length ? `<div class="peer-progress">
      <div class="peer-progress-bar"><span id="peer-bar"></span></div>
      <div class="peer-progress-meta"><span id="peer-count"></span><span class="badge gray" id="peer-avg" hidden></span></div>
    </div>` : ""}
    ${cards}
    <div class="small" id="peer-review-msg" style="color:var(--red);margin-top:8px"></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button>${crits.length ? `<button class="btn primary" id="peer-save">Submit review</button>` : ""}</div>`);

  const total = crits.length;
  // Refresh the progress bar, rated count, running average, and submit state.
  function updateProgress() {
    let rated = 0, sum = 0;
    crits.forEach((c) => {
      const v = Number(document.getElementById(`pc-${c.id}`).dataset.rating);
      if (v) { rated++; sum += v; }
    });
    const bar = document.getElementById("peer-bar");
    if (bar) bar.style.width = `${total ? (rated / total) * 100 : 0}%`;
    const count = document.getElementById("peer-count");
    if (count) count.textContent = `${rated} of ${total} rated`;
    const avg = document.getElementById("peer-avg");
    if (avg) { avg.hidden = rated === 0; if (rated) avg.textContent = `avg ${(sum / rated).toFixed(1)}`; }
    const save = document.getElementById("peer-save");
    if (save) { const done = rated === total; save.disabled = !done; save.textContent = done ? "Submit review" : `Submit review (${rated}/${total})`; }
  }

  bindStarInputs(updateProgress);
  updateProgress();

  const saveBtn = document.getElementById("peer-save");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    const scores = [];
    let missing = false;
    crits.forEach((c) => {
      const val = Number(document.getElementById(`pc-${c.id}`).dataset.rating);
      if (!val) missing = true;
      scores.push({ label: c.label, rating: val });
    });
    if (missing) { document.getElementById("peer-review-msg").textContent = "Please rate every criterion before submitting."; return; }
    r.scores = scores;
    r.rating = Math.round(scores.reduce((a, s) => a + s.rating, 0) / scores.length);
    r.status = "completed";
    Modal.close(); rerenderPeer(); peerToast(`Review submitted for ${r.subject}.`);
  });
}

// Row-actions overflow menu for an employee's review group (mock actions).
function openAsgActions(subject) {
  Modal.open(`
    <div class="modal-head"><h3>${UI.esc(subject)}</h3><button class="close" data-close>×</button></div>
    <div class="small muted" style="margin:-4px 0 12px">Review assignment actions</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn" data-act="view">View reviews</button>
      <button class="btn" data-act="remind">Send reminder</button>
      <button class="btn" data-act="reassign">Reassign reviewer</button>
      <button class="btn" data-act="history">View history</button>
    </div>
    <div class="modal-foot"><button class="btn" data-close>Close</button></div>`);
  const act = (sel) => document.querySelector(`[data-act="${sel}"]`);
  act("view").addEventListener("click", () => { PeerState.asg.expanded[subject] = true; Modal.close(); rerenderPeer(); });
  act("remind").addEventListener("click", () => { Modal.close(); peerToast(`Reminder sent to ${subject}'s pending reviewers.`); });
  act("reassign").addEventListener("click", () => { Modal.close(); peerToast(`Reassign reviewer for ${subject} — coming in the full build.`); });
  act("history").addEventListener("click", () => { Modal.close(); peerToast(`No earlier-cycle history for ${subject} yet (prototype).`); });
}

function rerenderPeer() {
  document.getElementById("content").innerHTML = window.Views.peer(window.App.role);
  window.ViewsWire.peer(window.App.role);
}

function peerToast(msg) {
  Modal.open(`
    <div class="modal-head"><h3>✓ Done</h3><button class="close" data-close>×</button></div>
    <p class="muted" style="margin-top:0">${UI.esc(msg)}</p>
    <div class="modal-foot"><button class="btn primary" data-close>OK</button></div>`);
}
