/* Titan prototype — Peer Review. Assignments are generated automatically from
   project membership each evaluation cycle (June & December) — no manual requests.
   Tabs are role-aware:
     Employee: To Review · About Me
     Leader:   To Review · Assignments · About Me
       To Review   — reviews where I'm the reviewer; rate each criterion 1–5 stars
       Assignments — leader monitors/generates/deletes assignments for projects they lead
       About Me    — completed feedback about me (reviewer hidden when anonymous)
   Reviews are scored against the active template in DB.PEER_REVIEW_TEMPLATE
   (managed in Admin / OMS › Peer Review). Assignment logic lives in PeerAssign. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const PeerState = { tab: "to-review" };

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
// Interactive star input; the chosen value lives in the element's data-rating.
// Each input needs a unique id so several can coexist in one modal (one per criterion).
function peerStarsInput(n, id) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= (n || 0) ? "on" : ""}" data-star="${i}">★</span>`;
  return `<span class="stars stars-input" id="${id}" data-rating="${n || 0}">${s}</span>`;
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
  const mine = DB.PEER_REVIEWS.filter((r) => r.reviewer === me);
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

  const doneCards = done.map((r) => reviewDoneCard(r, false)).join("");

  return `
    <div class="section-head">
      <div><h2 class="mb-0">To Review</h2><div class="small muted">${pending.length} pending · ${done.length} completed</div></div>
    </div>
    <div class="grid" style="gap:12px;margin-bottom:24px">${pendingCards}</div>
    ${done.length ? `<div class="section-head"><div><h2 class="mb-0" style="font-size:var(--fs-label)">Completed by you</h2></div></div>
    <div class="grid" style="gap:12px">${doneCards}</div>` : ""}`;
}

// A finished review. showReviewer=true reveals who wrote it (used on "About Me",
// where anonymity must be honored); on "To Review" the reviewer is always me.
function reviewDoneCard(r, showReviewer) {
  const author = showReviewer
    ? (r.anonymous ? `<span class="tag">Anonymous</span>` : UI.who(r.reviewer, r.reviewerInitials, ""))
    : UI.who(r.subject, r.subjectInitials, "");
  const scoreRows = (r.scores && r.scores.length)
    ? r.scores.map((s) =>
        `<div class="spread" style="align-items:center;padding:3px 0"><span class="small muted">${UI.esc(s.label)}</span>${peerStars(s.rating)}</div>`).join("")
    : `<div class="small muted">—</div>`;
  return `<div class="card">
    <div class="spread" style="align-items:flex-start">
      <div>${author}</div>
      <div style="text-align:right"><div class="small muted">Overall</div>${peerStars(r.rating)}</div>
    </div>
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">${scoreRows}</div>
  </div>`;
}

/* ---------- Assignments (Leader) ---------- */
// Leader monitors peer-review assignments for the projects they lead, generates
// them for the current cycle, and can delete individual pairs. Assignments are
// project-driven (PeerAssign) — never manually requested.
function assignmentsTab() {
  const me = peerMe();
  const cyc = PeerAssign.currentCycle();
  const mine = PeerAssign.assignmentsForLeader(me);
  const pending = mine.filter((r) => r.status === "pending").length;
  const done = mine.filter((r) => r.status === "completed").length;

  const rows = mine.length ? mine.map((r) => `
    <tr>
      <td>${UI.who(r.subject, r.subjectInitials, "")}</td>
      <td>${r.reviewer === me ? "You" : UI.esc(r.reviewer)}</td>
      <td><span class="tag">${UI.esc(r.projectName)}</span></td>
      <td>${peerStatusBadge(r.status)}${r.status === "completed" ? ` ${peerStars(r.rating)}` : ""}</td>
      <td class="muted">${UI.esc(r.due)}</td>
      <td class="right"><button class="btn sm danger" data-asg-del="${r.id}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty">No assignments yet for projects you lead. Generate them for the current cycle.</td></tr>`;

  return `
    <div class="section-head">
      <div><h2 class="mb-0">Assignments</h2><div class="small muted">${UI.esc(cyc.label)} cycle · ${mine.length} assignment${mine.length === 1 ? "" : "s"} · ${pending} pending · ${done} completed</div></div>
      <button class="btn primary" id="asg-generate">↻ Generate assignments</button>
    </div>
    <div class="small muted" style="margin:-6px 0 12px">Assignments are generated automatically from project membership when the ${UI.esc(cyc.label)} cycle begins — every project member reviews the others. Members who transferred mid-cycle are covered from all their projects (via membership history). Regenerating only adds missing pairs; it never duplicates.</div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Subject</th><th>Reviewer</th><th>Project</th><th>Status</th><th>Due</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- About Me ---------- */
function aboutMeTab() {
  const me = peerMe();
  const about = DB.PEER_REVIEWS.filter((r) => r.subject === me && r.status === "completed");
  const avg = about.length ? (about.reduce((a, r) => a + (r.rating || 0), 0) / about.length) : 0;
  const summary = about.length ? `
    <div class="card" style="margin-bottom:18px">
      <div class="spread">
        <div><div class="stat-label">Average peer rating</div><div class="stat-value">${avg.toFixed(1)} <span class="small muted">/ 5</span></div></div>
        ${peerStars(Math.round(avg))}
      </div>
      <div class="small muted" style="margin-top:8px">${about.length} completed peer review${about.length === 1 ? "" : "s"}</div>
    </div>` : "";

  const cards = about.length
    ? about.map((r) => reviewDoneCard(r, true)).join("")
    : `<div class="empty">No completed peer reviews about you yet.</div>`;

  return `
    <div class="section-head"><div><h2 class="mb-0">About Me</h2><div class="small muted">Feedback peers shared about you</div></div></div>
    ${summary}
    <div class="grid" style="gap:12px">${cards}</div>`;
}

/* ---------- View + wiring ---------- */
window.Views.peer = function () {
  const role = window.App.role;
  // Guard: if the active tab isn't available to this role (e.g. switched from
  // Leader's "Assignments" back to Employee), fall back to To Review.
  if (!peerTabs(role).some((t) => t.id === PeerState.tab)) PeerState.tab = "to-review";
  const body = PeerState.tab === "assignments" ? assignmentsTab()
    : PeerState.tab === "about-me" ? aboutMeTab() : toReviewTab();
  return `${peerTabsBar(role)}${body}`;
};

window.ViewsWire.peer = function () {
  document.querySelectorAll("#peer-tabs [data-peer-tab]").forEach((b) =>
    b.addEventListener("click", () => { PeerState.tab = b.dataset.peerTab; rerenderPeer(); }));

  if (PeerState.tab === "to-review") {
    document.querySelectorAll("[data-review]").forEach((b) =>
      b.addEventListener("click", () => openPeerReview(Number(b.dataset.review))));
  } else if (PeerState.tab === "assignments") {
    const gen = document.getElementById("asg-generate");
    if (gen) gen.addEventListener("click", () => {
      const res = PeerAssign.generate(DB.CURRENT_CYCLE);
      rerenderPeer();
      peerToast(res.added ? `Generated ${res.added} new assignment${res.added === 1 ? "" : "s"}${res.skipped ? `, ${res.skipped} already existed` : ""}.` : `All assignments already generated for this cycle — nothing to add.`);
    });
    document.querySelectorAll("[data-asg-del]").forEach((b) =>
      b.addEventListener("click", () => { PeerAssign.remove(Number(b.dataset.asgDel)); rerenderPeer(); }));
  }
};

/* ---------- Modals ---------- */
// Bind every interactive star widget in the current modal independently.
function bindStarInputs() {
  document.querySelectorAll(".stars-input").forEach((box) =>
    box.querySelectorAll(".star[data-star]").forEach((st) =>
      st.addEventListener("click", () => {
        const val = Number(st.dataset.star);
        box.dataset.rating = String(val);
        box.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.star) <= val));
      })));
}

function openPeerReview(id) {
  const r = DB.PEER_REVIEWS.find((x) => x.id === id);
  if (!r) return;
  const crits = DB.PEER_REVIEW_TEMPLATE.criteria || [];
  // Prefill from any prior scores on this review (keyed by criterion label).
  const prev = {};
  (r.scores || []).forEach((s) => { prev[s.label] = s.rating; });

  const rows = crits.length
    ? crits.map((c) =>
        `<div class="spread" style="align-items:flex-start;gap:16px;padding:9px 0;border-bottom:1px solid var(--border)">
           <div><label style="margin:0">${UI.esc(c.label)}</label>${c.description ? `<div class="small muted" style="margin-top:2px">${UI.esc(c.description)}</div>` : ""}</div>
           <div style="flex-shrink:0;padding-top:2px">${peerStarsInput(prev[c.label] || 0, `pc-${c.id}`)}</div>
         </div>`).join("")
    : `<div class="empty">No review criteria are configured yet. A Leader can add them in Admin › Peer Review.</div>`;

  Modal.open(`
    <div class="modal-head">
      <div><h3>Review ${UI.esc(r.subject)}</h3><div class="small muted" style="margin-top:4px">${r.anonymous ? "Your name is hidden from the subject." : "Shared with your name."} · ${UI.esc(DB.PEER_REVIEW_TEMPLATE.name)}</div></div>
      <button class="close" data-close>×</button>
    </div>
    <div class="small muted" style="margin:-4px 0 10px">Rate each criterion from 1 to 5 stars.</div>
    ${rows}
    <div class="small" id="peer-review-msg" style="color:var(--red);margin-top:8px"></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button>${crits.length ? `<button class="btn primary" id="peer-save">Submit review</button>` : ""}</div>`);
  bindStarInputs();

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
