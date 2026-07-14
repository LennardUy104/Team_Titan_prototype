/* Titan prototype — Peer Review. Available to every role.
   Three tabs, all from the current user's perspective:
     To Review   — requests where I'm the reviewer; write a rating + written feedback
     My Requests — peer reviews I asked for; track their status
     About Me    — completed feedback about me (reviewer hidden when anonymous) */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

const PeerState = { tab: "to-review" };
const PEER_TABS = [
  { id: "to-review", label: "To Review" },
  { id: "my-requests", label: "My Requests" },
  { id: "about-me", label: "About Me" },
];

function peerMe() { return DB.CURRENT_USER[window.App.role].name; }

// Read-only star row (rating out of 5).
function peerStars(n) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= n ? "on" : ""}">★</span>`;
  return `<span class="stars" style="cursor:default">${s}</span>`;
}
// Interactive star input; the chosen value lives in #peer-stars data-rating.
function peerStarsInput(n) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= (n || 0) ? "on" : ""}" data-star="${i}">★</span>`;
  return `<span class="stars" id="peer-stars" data-rating="${n || 0}">${s}</span>`;
}

function peerStatusBadge(status) {
  return status === "completed" ? `<span class="badge blue">Completed</span>` : `<span class="badge amber">Pending</span>`;
}

function peerTabsBar() {
  const tabs = PEER_TABS.map((t) =>
    `<button class="role-btn ${t.id === PeerState.tab ? "active" : ""}" data-peer-tab="${t.id}">${t.label}</button>`).join("");
  return `<div class="role-switch" id="peer-tabs" style="margin-bottom:18px">${tabs}</div>`;
}

// <option> lists for the request modal (exclude a name if given).
function peerPeople(sel, exclude) {
  return DB.EMPLOYEES.filter((u) => u.active && u.name !== exclude)
    .map((u) => `<option value="${UI.esc(u.name)}" ${u.name === sel ? "selected" : ""}>${UI.esc(u.name)}</option>`).join("");
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
        <div>${UI.who(r.subject, r.subjectInitials, `Requested by ${r.requestedBy === me ? "you" : UI.esc(r.requestedBy)}`)}</div>
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
  return `<div class="card">
    <div class="spread" style="align-items:flex-start">
      <div>${author}</div>
      ${peerStars(r.rating)}
    </div>
    <div style="margin-top:12px">
      <div class="small muted">What went well</div>
      <div style="margin:2px 0 10px">${UI.esc(r.wentWell) || "<span class='muted'>—</span>"}</div>
      <div class="small muted">What could improve</div>
      <div style="margin-top:2px">${UI.esc(r.toImprove) || "<span class='muted'>—</span>"}</div>
    </div>
  </div>`;
}

/* ---------- My Requests ---------- */
function myRequestsTab() {
  const me = peerMe();
  const mine = DB.PEER_REVIEWS.filter((r) => r.requestedBy === me);
  const rows = mine.length ? mine.map((r) => `
    <tr>
      <td>${UI.who(r.subject, r.subjectInitials, "")}</td>
      <td>${r.reviewer === me ? "You" : UI.esc(r.reviewer)}</td>
      <td>${r.anonymous ? `<span class="tag">Anonymous</span>` : `<span class="tag">Named</span>`}</td>
      <td>${peerStatusBadge(r.status)}${r.status === "completed" ? ` ${peerStars(r.rating)}` : ""}</td>
      <td class="right muted">${UI.esc(r.due)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty">You haven't requested any peer reviews yet.</td></tr>`;

  return `
    <div class="section-head">
      <div><h2 class="mb-0">My Requests</h2><div class="small muted">Peer reviews you initiated</div></div>
      <button class="btn primary" id="peer-request">+ Request peer review</button>
    </div>
    <div class="card" style="padding:6px 6px">
      <table class="table">
        <thead><tr><th>Subject</th><th>Reviewer</th><th>Visibility</th><th>Status</th><th class="right">Due</th></tr></thead>
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
  const body = PeerState.tab === "my-requests" ? myRequestsTab()
    : PeerState.tab === "about-me" ? aboutMeTab() : toReviewTab();
  return `${peerTabsBar()}${body}`;
};

window.ViewsWire.peer = function () {
  document.querySelectorAll("#peer-tabs [data-peer-tab]").forEach((b) =>
    b.addEventListener("click", () => { PeerState.tab = b.dataset.peerTab; rerenderPeer(); }));

  if (PeerState.tab === "to-review") {
    document.querySelectorAll("[data-review]").forEach((b) =>
      b.addEventListener("click", () => openPeerReview(Number(b.dataset.review))));
  } else if (PeerState.tab === "my-requests") {
    const req = document.getElementById("peer-request");
    if (req) req.addEventListener("click", openPeerRequest);
  }
};

/* ---------- Modals ---------- */
function bindStarInput() {
  const box = document.getElementById("peer-stars");
  if (!box) return;
  box.querySelectorAll(".star[data-star]").forEach((st) =>
    st.addEventListener("click", () => {
      const val = Number(st.dataset.star);
      box.dataset.rating = String(val);
      box.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.star) <= val));
    }));
}

function openPeerReview(id) {
  const r = DB.PEER_REVIEWS.find((x) => x.id === id);
  if (!r) return;
  Modal.open(`
    <div class="modal-head">
      <div><h3>Review ${UI.esc(r.subject)}</h3><div class="small muted" style="margin-top:4px">${r.anonymous ? "Your name is hidden from the subject." : "Shared with your name."}</div></div>
      <button class="close" data-close>×</button>
    </div>
    <div class="field"><label>Rating</label>${peerStarsInput(r.rating)}</div>
    <div class="field"><label>What went well</label><textarea id="peer-well" placeholder="Strengths, wins, things to keep doing…">${UI.esc(r.wentWell)}</textarea></div>
    <div class="field"><label>What could improve</label><textarea id="peer-improve" placeholder="Constructive, specific suggestions…">${UI.esc(r.toImprove)}</textarea></div>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="peer-save">Submit review</button></div>`);
  bindStarInput();
  document.getElementById("peer-save").addEventListener("click", () => {
    const rating = Number(document.getElementById("peer-stars").dataset.rating);
    if (!rating) { peerToast("Please give a star rating before submitting."); return; }
    r.rating = rating;
    r.wentWell = document.getElementById("peer-well").value.trim();
    r.toImprove = document.getElementById("peer-improve").value.trim();
    r.status = "completed";
    Modal.close(); rerenderPeer(); peerToast(`Review submitted for ${r.subject}.`);
  });
}

function openPeerRequest() {
  const me = peerMe();
  const firstSubject = DB.EMPLOYEES.filter((u) => u.active && u.name !== me)[0];
  Modal.open(`
    <div class="modal-head"><h3>Request a peer review</h3><button class="close" data-close>×</button></div>
    <div class="grid grid-2">
      <div class="field"><label>Subject (who is reviewed)</label><select id="pr-subject">${peerPeople(firstSubject ? firstSubject.name : "", me)}</select></div>
      <div class="field"><label>Reviewer (who writes it)</label><select id="pr-reviewer">${peerPeople("", null)}</select></div>
    </div>
    <div class="field"><label>Due date</label><input type="date" id="pr-due" value="2026-07-25" /></div>
    <label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="pr-anon" style="width:auto" /> Anonymous — hide the reviewer from the subject</label>
    <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="pr-save">Send request</button></div>`);
  document.getElementById("pr-save").addEventListener("click", () => {
    const subject = document.getElementById("pr-subject").value;
    const reviewer = document.getElementById("pr-reviewer").value;
    if (subject === reviewer) { peerToast("Reviewer and subject must be different people."); return; }
    const subj = DB.EMPLOYEES.find((u) => u.name === subject) || {};
    const rev = DB.EMPLOYEES.find((u) => u.name === reviewer) || {};
    DB.PEER_REVIEWS.push({
      id: DB.PEER_REVIEWS.reduce((m, x) => Math.max(m, x.id), 0) + 1,
      subject, subjectInitials: subj.initials || "?",
      reviewer, reviewerInitials: rev.initials || "?",
      requestedBy: peerMe(),
      status: "pending",
      due: document.getElementById("pr-due").value || "—",
      anonymous: document.getElementById("pr-anon").checked,
      rating: null, wentWell: "", toImprove: "",
    });
    Modal.close(); rerenderPeer(); peerToast(`Peer review requested: ${reviewer} → ${subject}.`);
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
