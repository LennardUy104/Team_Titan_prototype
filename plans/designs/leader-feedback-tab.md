# Design: Leader — My Objectives & Feedback tabs
_Author: Mika | Date: 2026-07-10_

## Intent
Separate the leader's PERSONAL objectives from TEAM objectives. My Objectives = self only.
Team objectives move into the Feedback tab as context for the feedback workflow.

## A. My Objectives (both roles now = personal, self-owned)
- Title: "My Objectives" (drop "All Objectives").
- Remove the "All employees" owner filter (no longer any team listing here).
- Drop the "Owner" table column — redundant when every row is the signed-in user.
- Leader list = objectives where owner === leader name; employee unchanged (self).

### Layout (ASCII)
```
My Objectives                                    [ + Create Objective ]
3 objectives · Q3 2026
┌────────────────────────────────────────────────────────────────────┐
│ Objective                     Weight  Target      Progress    Status │
│ Grow Delivery Predictability   30%    2026-09-30  [====  ]72% On Track│
│ Strengthen Team Health         35%    2026-09-30  [===   ]58% At Risk │
│ Raise Engineering Quality Bar  35%    2026-09-30  [===== ]80% On Track│
└────────────────────────────────────────────────────────────────────┘
```

## B. Feedback tab (leader-only) — team objectives + feedback workflow
Right column becomes a STACK: the selected member's objectives (context) sit
ABOVE the feedback editor, so the leader reviews goals, then writes feedback.

### Layout (ASCII)
```
FEEDBACK
┌── Your Team ─────────┬── {Name}'s Objectives ─────────────────────┐
│ ▸ Abdul Palala  88   │  Adopt New Release Process        Q3 2026  │
│   Grace Lim   In prog│  wt 25%   [======    ] 60%       On Track  │
│ ▶ Maria Santos ◀     │  (row click → objective detail modal)      │
│   John Cruz     90   │  ……                                        │
│                      ├── Give Feedback: {Name} ───────── Q3 2026 ──┤
│                      │  [AI suggestion]           Accept   Reject  │
│                      │  [AI suggestion]           Accept   Reject  │
│                      │  ───────────────────────────────────────── │
│                      │  AI score 84     Final score [ 88 ]         │
│                      │  Manual Feedback [ textarea ]               │
│                      │                        [ Finalize Feedback ]│
└──────────────────────┴────────────────────────────────────────────┘
┌── Scheduled Feedback ───────────── [Google · account] [Connect] ───┐
│ member ▾  date  time  notes                          [ Schedule ]  │
│ • Maria Santos — Jul 15 · 30m   [Add to Google Calendar] [Remove]  │
└────────────────────────────────────────────────────────────────────┘
```

## Components (existing classes only)
- Roster: `.card` + `.card-title` "Your Team" + `.row-item.clickable` + `UI.who` + `.badge` (status) + `.btn.sm` "Give Feedback".
- Objectives context (NEW panel): `.card` + `.card-title` "{Name}'s Objectives". Each objective as a `.row-item.clickable` → `openDetailModal(id)`:
  - line 1: `<strong>{title}</strong>` + `.tag` weight (e.g. "wt 25%")
  - line 2: `.progress`(+status color) with `.small.muted` "{progress}%" + `.badge` status
- Feedback editor: existing `teamEditor()` markup (unchanged controls).
- Schedule: existing `scheduleCard()` (unchanged).
- Both context + editor stacked in a `.stack` inside the right grid cell.

## User flow
1. Leader opens Feedback → first team member auto-selected.
2. Sees that member's objectives (context) → primary action: give feedback (Accept/Reject AI, set Final score) → "Finalize Feedback".
3. Success: existing toast "Feedback finalized for {name} …"; row badge → "Finalized {score}".
4. Objective row click → read-only objective detail modal (criteria + evidence).

## States
- No member selected: auto-select first roster member (never a blank right column).
- Member WITH objectives: list them in the context panel.
- Member with NO objectives: context panel shows `.empty` "No objectives assigned to {Name} yet." (editor still shown).
- Empty roster: left card `.empty` "No team members to give feedback to."; right column shows `.empty` placeholder.

## C. Data to add (mock-data.js) — leader personal objectives (owner: "Andre Uy", AU)
1. **Grow Delivery Predictability** — Improve team on-time delivery and cut slippage.
   criteria: "Team on-time delivery ≥ 90%", "Sprint carryover < 10%", "No critical milestone missed". progress 72, on-track, weight 30.
2. **Strengthen Team Health** — Support engagement, growth, retention.
   criteria: "Biweekly 1:1s with every report", "Team eNPS ≥ 40", "Zero regretted attrition". progress 58, at-risk, weight 35.
3. **Raise Engineering Quality Bar** — Drive quality practices across the team.
   criteria: "PR review turnaround < 1 day", "Production incidents ↓ 20%", "Test coverage ≥ 80%". progress 80, on-track, weight 35.
Each needs: period "Q3 2026", target "2026-09-30", a description, and 1-2 evidence items (src GitHub/Backlog/Slack) to match the shape.

## Out of scope
No changes to Dashboard, AI Assistant, My Feedback, login, themes, or business logic.
```
