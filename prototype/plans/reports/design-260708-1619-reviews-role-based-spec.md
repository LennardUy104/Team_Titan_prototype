# Design Spec: Reviews Tab — Role-Based UX
_Author: Mika | Date: 2026-07-08 | For: Nico (frontend impl)_

Rework the Reviews tab around **who can evaluate whom**. Employees never
evaluate — they only read the evaluation their Leader gave them. Leaders both
**give** evaluations (to their team) and **receive** them (from other Leaders).

Reuses existing NiceAdmin components/tokens. **No new primitives** except one
tiny optional CSS block (§6). The old peer-review-by-employee flow is deleted.

---

## 1. Information architecture (per role)

| Role | Structure | Sections |
|---|---|---|
| **Employee** | No tabs — single view | **My Evaluation** (read-only received) |
| **Leader** | 2 tabs (reuse `.role-switch` tab style) | **My Evaluation** (read-only received) · **Team Evaluations** (give/finalize) |

- Default tab for Leader = **Team Evaluations** (their primary action). Employee
  has no tabs, just the read-only card.
- Rationale: "received evaluation" is the same read-only component for both
  roles (DRY) — Employee sees only that; Leader gets it as one tab plus the
  give-flow as the other.

---

## 2. Component A — "My Evaluation" (read-only received) — BOTH roles

The evaluation the current user received from their evaluator. Read-only:
no inputs, no accept/reject, score shown as a number. One non-evaluative action
allowed — **Acknowledge** (it's not reviewing anyone).

```
┌─ My Evaluation ───────────────────────────────────────────────┐
│  Evaluated by Andre Uy · Engineering Leader        [Finalized ●]│  ← green badge
│  Period: Q3 2026 · Finalized Jul 2, 2026                        │  ← small muted
│                                                                 │
│  ┌───────────┐   Overall performance is strong and trending    │
│  │    88     │   upward this quarter.                           │  ← stat-value (big) + summary
│  │ FINAL SCORE│                                                 │
│  └───────────┘                                                  │
│                                                                 │
│  Strengths                     Improvement Areas                │  ← .fb-cols
│  ✓ Reliable delivery           ○ Documentation coverage         │
│  ✓ High PR review activity     ○ Unit test coverage             │
│  ✓ Strong collaboration                                         │
│                                                                 │
│  Leader Comments                                                │
│  "Consistently delivered on schedule with no overdue items.     │  ← muted text block
│   Focus next quarter on raising test coverage to 80%."          │
│                                                                 │
│                                        [ Acknowledge ]          │  ← .btn (secondary), right
└─────────────────────────────────────────────────────────────────┘
```

- **Score block**: reuse `.stat-value` (big number) with a `.stat-label`
  "FINAL SCORE". Wrap in a small bordered box or `.stat-tile`.
- **Strengths / Improvements**: existing `.fb-cols` + `.check-list` (`ck` /
  `ck off`).
- **Comments**: `<p class="muted">`.
- **Read-only affordance**: green **`Finalized`** `.badge` top-right +
  "Evaluated by … " identity line + no editable controls. That's enough signal.
- **Acknowledge**: `.btn` (NOT primary — this is acknowledgement, not a
  submission). On click → `toast("Evaluation acknowledged")` (reuse existing
  `toast()`).

### Empty state (no evaluation yet)
```
┌─ My Evaluation ───────────────────────────────────────────────┐
│                                                                 │
│              📋  No evaluation yet                              │
│   Your leader hasn't finalized your review for this period.     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
Reuse `.empty`.

---

## 3. Component B — "Team Evaluations" (give/finalize) — LEADER only

Two-step: (1) pick a team member from a list, (2) evaluate them. Keep it inline
(no route change) — selecting a member swaps the right panel to the editor.

```
┌─ Team Evaluations ────────────────────────────────────────────────────────┐
│ ┌─ Your Team ─────────────────┐   ┌─ Evaluate: Abdul Palala ─────────────┐ │
│ │ (AP) Abdul Palala           │   │ AI-Suggested Comments   Q3 2026       │ │
│ │      Software Eng · [In prog]│◀──│ [Strength] Delivered on schedule…    │ │
│ │                     Evaluate │   │           [Accept] [Reject]           │ │
│ │ (MS) Maria Santos           │   │ [Improvement] Test coverage 74%…      │ │
│ │      Senior Eng · [Not started]  │           [Accept] [Reject]           │ │
│ │                     Evaluate │   │ ───────────────────────────────────  │ │
│ │ (JC) John Cruz              │   │ AI score 88   Final score [ 88 ]      │ │
│ │      Software Eng·[Not started]  │ Manual feedback [ textarea ]          │ │
│ │ (GL) Grace Lim              │   │                    [ Finalize Eval ]  │ │
│ │      Designer · [Finalized 92]│  └───────────────────────────────────────┘ │
│ └─────────────────────────────┘                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Left — team list**: existing `.row-item` rows, each `UI.who(name, initials,
  role)` + a status `.badge` + a small `.btn.sm` "Evaluate". Status badges:
  - `Not started` → `.badge.gray`
  - `In progress` → `.badge.amber`
  - `Finalized {score}` → `.badge.green`
  - Clicking a row (or its Evaluate btn) selects that member.
- **Right — editor**: this is the **existing `managerTab()` content**
  (AI-suggested comments accept/reject + override score + manual feedback +
  Finalize), but the subject becomes the **selected member** instead of the
  hardcoded Abdul. On Finalize → `toast()` + mark that member `Finalized` in the
  list (update local state, re-render).
- **Default selection**: first team member (or the one already `In progress`).
- Grid: `.grid grid-2` (left list ~1fr, right editor). On mobile stacks.

### Leaders evaluate other Leaders
"Your Team" for a Leader should include **other leaders** as evaluatable
subjects (requirement: leaders evaluate each other). Simplest for the prototype:
the team list = Engineering team **plus** any other leader peers. Add 1–2
"Leader" peers to the roster/eval list so it's visible (see §5). A small role
tag ("Leader") on those rows communicates cross-leader evaluation.

---

## 4. Component C — Leader "My Evaluation" (received)

Identical to Component A, but the current user is the Leader (Andre Uy) and the
evaluator is **another leader** (e.g. "Diana Cruz · VP Engineering"). No new
design — same read-only card, different data record (§5). This satisfies
"leaders are also evaluated by other leaders."

---

## 4b. Component D — Evaluation History — BOTH roles

Below the current "My Evaluation" card, a **history of previous evaluations**
(past periods). Compact list; each row opens the full read-only detail in the
existing `Modal` (reuse Component A layout inside the modal).

```
┌─ Evaluation History ──────────────────────────────────────────┐
│  Q2 2026   Score 85   Evaluated by Andre Uy      [ View ]  ●    │  ← row-item
│  Q1 2026   Score 82   Evaluated by Andre Uy      [ View ]  ●    │
│  Q4 2025   Score 79   Evaluated by Priya Nair    [ View ]  ●    │
└─────────────────────────────────────────────────────────────────┘
```

- Rows: existing `.row-item`. Left = period + score + evaluator (muted). Right =
  a `.btn.sm` **View** + a small trend dot/`.badge` (green if score ≥ prev,
  amber if down — optional flourish).
- **View** → `Modal.open(...)` rendering the same `receivedEvalCard()` markup for
  that historical record (read-only, no Acknowledge inside the modal).
- Sort newest-first. This appears for **both** Employee and Leader (each sees
  their own received history).
- **Empty**: if no history → `.empty` "No previous evaluations."

For the **Leader / Team Evaluations** side, "history" is conveyed by the
`Finalized {score}` status badge on already-evaluated members — no separate
history list needed there for the prototype (keep scope tight).

---

## 5. Mock data needed (Nico adds to `mock-data.js`)

**(a) Received evaluations** — keyed by subject name, drives Component A/C:
```js
const RECEIVED_EVALUATIONS = {
  "Abdul Palala": {
    evaluator: "Andre Uy", evaluatorRole: "Engineering Leader",
    period: "Q3 2026", finalScore: 88, status: "finalized",
    finalizedOn: "2026-07-02",
    summary: "Overall performance is strong and trending upward this quarter.",
    strengths: ["Reliable delivery", "High PR review activity", "Strong collaboration"],
    improvements: ["Documentation coverage", "Unit test coverage"],
    comments: "Consistently delivered on schedule with no overdue items. Focus next quarter on raising test coverage to 80%.",
    history: [   // previous evaluations, newest-first (same shape, minus its own history)
      { evaluator: "Andre Uy",    period: "Q2 2026", finalScore: 85, finalizedOn: "2026-04-04", summary: "Solid quarter; delivery reliable.", strengths: ["Reliable delivery", "Good code reviews"], improvements: ["Test coverage"], comments: "Keep up the delivery consistency." },
      { evaluator: "Andre Uy",    period: "Q1 2026", finalScore: 82, finalizedOn: "2026-01-08", summary: "Steady growth this quarter.",     strengths: ["Collaboration"],                    improvements: ["Documentation", "Ownership"], comments: "Take more ownership of features end-to-end." },
      { evaluator: "Priya Nair",  period: "Q4 2025", finalScore: 79, finalizedOn: "2025-10-06", summary: "Meeting expectations.",            strengths: ["Willingness to learn"],             improvements: ["Delivery speed"], comments: "Focus on reducing task cycle time." },
    ],
  },
  "Andre Uy": {   // leader evaluated by another leader
    evaluator: "Diana Cruz", evaluatorRole: "VP Engineering",
    period: "Q3 2026", finalScore: 91, status: "finalized",
    finalizedOn: "2026-07-03",
    summary: "Strong leadership; team delivery and morale trending up.",
    strengths: ["Team throughput +6%", "Clear objective setting", "Low attrition"],
    improvements: ["Cross-team visibility", "Succession planning"],
    comments: "Excellent quarter leading Engineering. Grow bench strength via a formal mentoring track.",
    history: [
      { evaluator: "Diana Cruz", period: "Q2 2026", finalScore: 89, finalizedOn: "2026-04-05", summary: "Consistent leadership.",   strengths: ["Delivery predictability"], improvements: ["Cross-team visibility"], comments: "Increase visibility into roadmap tradeoffs." },
      { evaluator: "Diana Cruz", period: "Q1 2026", finalScore: 87, finalizedOn: "2026-01-09", summary: "Strong start to the year.", strengths: ["Team morale"],              improvements: ["Hiring pace"],           comments: "Accelerate backfill for open reqs." },
    ],
  },
};
```
Lookup by `DB.CURRENT_USER[role].name`. If absent → empty state. History rows
reuse the same read-only card (rendered inside `Modal`) via `receivedEvalCard()`.

**(b) Team evaluation list** — Leader's evaluatable subjects + status:
```js
const TEAM_EVALUATIONS = [
  { name: "Abdul Palala", initials: "AP", role: "Software Engineer", status: "in-progress", score: null },
  { name: "Maria Santos", initials: "MS", role: "Senior Engineer",   status: "not-started", score: null },
  { name: "John Cruz",    initials: "JC", role: "Software Engineer", status: "not-started", score: null },
  { name: "Grace Lim",    initials: "GL", role: "Product Designer",  status: "finalized",   score: 92 },
  { name: "Nadia Rahman", initials: "NR", role: "Product Leader",    status: "not-started", score: null, peerLeader: true },
];
```
`peerLeader:true` rows render a small "Leader" tag → shows cross-leader eval.
Keep existing `MANAGER_REVIEW.suggestions` as the AI comment set reused for the
selected subject (fine for a prototype — same suggestions per member).

**(c) Remove / retire** `PEER_REVIEWS` usage in the Reviews view (data can stay
in the file if referenced elsewhere — it isn't — but the peer-review UI is gone).

---

## 6. Optional CSS (only if needed)

Everything maps to existing classes. The one nicety — a subtle read-only tint on
the received card so it reads as "not editable":
```css
/* received/read-only evaluation card */
.eval-readonly { background: linear-gradient(180deg, var(--surface-2), var(--surface)); }
.eval-score { text-align: center; padding: 6px 18px; border-right: 1px solid var(--border); }
```
Optional. If skipped, the `Finalized` badge + identity line already communicate
read-only. Do not add more.

---

## 7. User flows

**Employee**
1. Opens Reviews → sees **My Evaluation** (read-only).
2. Primary action: **Acknowledge** → toast confirms. (No evaluating.)
3. Empty: "No evaluation yet" if no record.

**Leader**
1. Opens Reviews → **Team Evaluations** tab (default).
2. Picks a team member → editor loads AI suggestions for that subject.
3. Accept/reject suggestions, adjust final score, add feedback → **Finalize
   Evaluation** → toast + member marked `Finalized`.
4. Switches to **My Evaluation** tab → reads the evaluation a higher/peer leader
   gave them (read-only, Acknowledge).

---

## 8. States summary
- **Loading**: n/a (mock, synchronous).
- **Empty**: received card → `.empty` "No evaluation yet"; team list → n/a
  (always seeded).
- **Read-only vs editable**: read-only card = `Finalized` badge + evaluator
  identity + zero inputs; editable = the give-flow with Accept/Reject buttons,
  number input, textarea, Finalize CTA.
- **Success**: Finalize → toast + status badge flips to green `Finalized {score}`.

---

## 9. Handoff notes for Nico
1. `views-reviews.js`: replace the peer/manager 2-tab structure.
   - `dashboard`-style `role` param: `window.Views.reviews = function (role) {…}`.
   - **Employee** → render only Component A (received eval, read-only).
   - **Leader** → `.role-switch` tabs: `team` (default) + `received`.
     - `team` → Component B (list + editor); reuse existing `managerTab()` guts,
       parametrized by selected subject; Finalize updates `TEAM_EVALUATIONS`
       local state.
     - `received` → Component A.
2. Component A = shared render fn `receivedEvalCard(record, {readonly:true})` used
   by both roles, by both the current-eval card AND the history modal.
   Component D (history) renders below A for both roles; View → `Modal.open`
   with `receivedEvalCard(historyRecord)` (no Acknowledge inside modal).
3. Delete `peerTab()` / `wirePeer()` / star-rating UI.
4. `mock-data.js`: add `RECEIVED_EVALUATIONS`, `TEAM_EVALUATIONS`; export via
   `window.DB`.
5. Keep `toast()` and `Modal` as-is.
6. Verify: switch roles → Employee sees no evaluate controls anywhere; Leader can
   finalize and also read own received eval.

## Open questions
- Can an Employee **Acknowledge**? I included it as a read-only-safe action. If
  you'd rather it be pure read-only (no button at all), drop the Acknowledge
  button — trivial for Nico. Non-blocking; defaulting to include it.
