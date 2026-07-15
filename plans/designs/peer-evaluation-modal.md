# Design: Peer Evaluation Modal (Redesign Proposals)
_Author: Mika | Date: 2026-07-15 | Status: PROPOSAL — awaiting direction pick_

## Current state (baseline)
`openPeerReview()` in `prototype/views-peer.js:200`. A single-screen modal:
head (subject + "Shared with your name · Standard Peer Evaluation") → helper "Rate each
criterion 1–5 stars" → 5 identical rows (label + desc, star row on right) → Cancel / Submit.

### Pain points
1. **Wall of stars** — 5 identical 20px star rows, visually monotone, invites mindless clicking.
2. **No qualitative signal** — pure numeric; the subject learns *what* score but never *why*.
3. **No progress feedback** — you can't see how many criteria are done until you hit Submit and get an error.
4. **Weak affordance** — 20px stars, 3px gap, small hit targets; no descriptor for what "3 stars" means.
5. **No overall takeaway** — no place for a summary comment, which is the highest-value part of a peer review.

Existing tokens to reuse: `--green #4e8a34`, `--green-soft`, `--lime` (primary btn), star on-color `#f5b301`,
`--border`, `--red`, `.modal` (max-width 560, radius 16), `.btn / .btn.primary`, `.badge`, `.stars`.

---

## Concept A — Guided (one criterion per step)
**Rationale:** Force attention on one criterion at a time; kills the wall-of-stars fatigue and gives a natural home for an optional note.

```
┌────────────────────────────────────────────────┐
│ Review Grace Lim                             ✕   │
│ Shared with your name · Standard Peer Eval       │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  Criterion 2 of 5           │  ← progress bar
├────────────────────────────────────────────────┤
│                                                  │
│            Collaboration                         │
│   Works well with the team, offers help, and     │
│   contributes to shared goals.                   │
│                                                  │
│        ★    ★    ★    ★    ★                      │  ← large 32px stars
│      Poor              Great      Exceptional     │
│                                                  │
│   ┌────────────────────────────────────────┐     │
│   │ Add a note (optional)                   │     │  ← textarea
│   └────────────────────────────────────────┘     │
├────────────────────────────────────────────────┤
│  ‹ Back                          Next ›          │
└────────────────────────────────────────────────┘
   (last step: "Next" → "Review & submit" summary)
```
- **Improves:** engagement, mobile ergonomics, built-in progress, per-criterion notes.
- **New mock-data:** `scores[].comment` (optional string). Nothing else.
- **Trade-off:** more clicks; power users may miss the at-a-glance list.

---

## Concept B — Card grid, upgraded (all-at-once) ★ recommended base
**Rationale:** Keep the fast single-screen flow reviewers expect, but fix affordance, add progress, and allow optional notes — the smallest change that lands the biggest UX wins.

```
┌────────────────────────────────────────────────┐
│ Review Grace Lim                             ✕   │
│ Shared with your name · Standard Peer Eval       │
├────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  3 of 5 rated   ⌀ 4.0        │  ← sticky progress + running avg chip
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ Communication                    ★★★★☆       │ │  ← 26px stars, descriptor on select
│ │ Shares information clearly…      "Strong"    │ │
│ │ ＋ Add note                                   │ │  ← expands textarea inline
│ └────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────┐ │
│ │ Collaboration                    ★★★★★       │ │
│ │ Works well with the team…        "Exceptional"│ │
│ └────────────────────────────────────────────┘ │
│                    … (cards 3–5) …               │
├────────────────────────────────────────────────┤
│  Cancel                    Submit review (3/5)   │  ← disabled until all rated
└────────────────────────────────────────────────┘
```
- **Improves:** live progress + running average, bigger stars w/ word descriptor, optional inline notes, submit button reflects completeness (no dead-end error).
- **New mock-data:** `scores[].comment` (optional). Reuses `.stars` everywhere else unchanged.
- **Trade-off:** taller modal; still a list (but now scannable cards).

---

## Concept C — Labeled scale + overall summary (Lattice-style)
**Rationale:** Lattice rates on *named* bands (Needs improvement → Exceptional) not bare stars, and centers a written summary. Richest signal, most on-brand for a Lattice-inspired product.

```
┌────────────────────────────────────────────────┐
│ Review Grace Lim                             ✕   │
│ Shared with your name · Standard Peer Eval       │
│ Rate each criterion, then add an overall note.   │
├────────────────────────────────────────────────┤
│ Communication                                    │
│ Shares information clearly, listens actively…    │
│ [ Poor ][ Fair ][ Good ][ Great ][Exceptional]   │  ← segmented; selected fills --green-soft
├────────────────────────────────────────────────┤
│ Collaboration                                    │
│ Works well with the team…                        │
│ [ Poor ][ Fair ][ Good ][ Great ][Exceptional]   │
├────────────────────────────────────────────────┤
│                 … (criteria 3–5) …               │
├────────────────────────────────────────────────┤
│ Overall comments                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ What should Grace keep doing / work on?     │ │  ← single high-value box
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│  Cancel                          Submit review   │
└────────────────────────────────────────────────┘
```
- **Improves:** meaningful bands beat abstract stars; one low-friction overall comment = the signal subjects actually read.
- **New mock-data:** top-level `review.overallComment` (string). Band index still maps to 1–5, so read-only star displays elsewhere keep working.
- **Trade-off:** segmented row is wide → must wrap/stack on mobile; changes the in-modal rating look (stars still used in read-only lists).

---

## Recommendation
**Concept B as the base, borrowing C's single "Overall comments" box.** It keeps the familiar
one-screen flow (low risk for a prototype), fixes every pain point (progress, affordance, dead-end
submit, qualitative signal), reuses existing `.stars`/`.btn` tokens so read-only star displays stay
intact, and only needs `scores[].comment?` + `review.overallComment?` in mock-data.
Pick **C** instead if you want the modal to *look* distinctly more Lattice-like (named bands).
Pick **A** if mobile / focus is the priority.

## Open question
- Should notes be **per-criterion** (A/B) or a **single overall** box (C), or **both**? This drives the mock-data shape.
