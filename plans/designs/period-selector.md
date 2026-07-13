# Design: Half-year Period Selector (scalable)
_Author: Mika | Date: 2026-07-13_

## Problem
A wrapping strip of one pill per half-year doesn't scale — 25 equal-weight tabs
across 3 rows bury the current period and clutter the clean top bar. The
"+ New half-year" button is always-on and spam-clickable, creating empty periods.

## Recommendation (primary): compact dropdown + prev/next stepper
Collapse the strip into ONE line: a stepper to walk adjacent halves, a dropdown
(styled `select`) that scales to any number of periods, and a demoted "New half-year".

## Layout (ASCII)
```
Viewing   [‹]  [ 2037-1st · current            ▾ ]  [›]        [ ＋ New half-year ]
                 └ dropdown lists all halves, newest first,
                   "· current" marks the open one; scrolls if long

Past half selected:
Viewing   [‹]  [ 2035-2nd                        ▾ ]  [›]      🔒 closed — read-only
```

## Components (existing only)
- `select#period-select` — the period menu (already themed; scales infinitely, native scroll).
- `.btn.sm` ×2 — `‹` / `›` steppers (previous = older, next = newer; disabled at ends).
- `.btn.sm.ghost` — "＋ New half-year" (demoted from primary; right-aligned).
- `Modal.open()` — confirm before starting a new half-year.
- Label uses `.small.muted` ("Viewing"); tokens for spacing.

## "New half-year" behavior (stops clutter/misuse)
1. Only enabled when the **latest** period is selected (can't branch from history).
2. **Disabled while the current period has zero objectives** — kills the empty-period spam directly.
3. Subtle ghost button + **confirm modal**: "Start 2038-1st? This opens a blank objective template and closes 2037-2nd."
4. On confirm → new latest period, selector jumps to it.

## User flow
1. User lands on My Objectives → selector shows current half, editable content below.
2. Switch period: pick from dropdown OR tap ‹ / › → content re-renders for that half.
3. Past half → read-only (existing banner). Current → editable (unchanged).
4. New cycle: "＋ New half-year" (only when current has objectives) → confirm → blank template.

## States
- **Current selected**: editable; "· current" in the label; New half-year enabled (if current has ≥1 objective).
- **Past selected**: read-only banner; New half-year hidden/disabled; steppers still work.
- **First-ever period**: single dropdown option; both steppers disabled; New half-year disabled until an objective exists.
- **Many periods**: dropdown scrolls; bar stays one line — no wrapping, ever.

## Alternatives (trade-offs)
- **Native `select` only** (no steppers): simplest to build, fully scalable, but loses quick adjacent nav and feels less "reviewy". Great minimal fallback.
- **Recent tabs + "More ▾" overflow**: show current + last 2 as pills, rest in a menu. Familiar, keeps one-tap recency, but still two UI patterns to maintain and more code than a select.

## Implementation note (minimal, for Nico)
- Replace `periodTabs()` (id `#period-tabs`) and `receivedPeriodTabs()` (id `#rcv-period-tabs`)
  with a shared `periodSelect(currentState, opts)` returning the select + steppers,
  bound to the SAME `ObjState.period` / `ReceivedState.period`. No data-model change.
- Wire: `select.change` → set state.period → rerender; steppers → move index within `DB.PERIODS`;
  New half-year → guard (latest && current has objectives) → confirm modal → create + advance.
- DB.PERIODS stays newest-first; options map over it. Applies to My Objectives + My Feedback.
```
