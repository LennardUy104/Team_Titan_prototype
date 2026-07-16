# Design: Leader Feedback — Evaluation Start Card
_Author: Mika | Date: 2026-07-16_

Read-only summary a leader sees for a selected assigned employee **before** starting
the evaluation. Maps onto `prototype/views-reviews.js` → `evalStartCard(subject)`.

## Problem
Current card is flat: a single-line "Evaluation — Name" title, low-contrast rows,
status buried in grey prose. No identity anchor, no at-a-glance progress.

## Fix (hierarchy in 3 zones)
1. **Identity header** — avatar + bold name (the WHO), an "EVALUATION" eyebrow, and
   an overall progress badge (amber until complete, green when done).
2. **Progress bar** — thin green bar directly under the header = instant "how far".
3. **Objective list** — each row gets a colored status **rail** (amber = not
   evaluated, green = evaluated), bold title + type tag, self-% meta, and a right
   status badge. Rail + badge = redundant coding, scannable at a glance.
4. **Footer** — primary "Start Evaluation" CTA + a one-line helper.

## Layout (ASCII)
```
┌───────────────────────────────────────────────────────────────┐
│  ⬤AV   EVALUATION                              [ 0/2 evaluated ]│  ← eyebrow + badge
│        Maria Santos                                             │  ← bold name (18px/700)
│        Senior Engineer                                          │  ← role, muted
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (progress, green)         │
│  ┌─┐                                                            │
│  │▮│ Adopt New Release Process  [Org]        [ Not evaluated ] │  ← amber rail
│  │ │ Self-assessed 20%                                          │
│  ├─┤                                                            │
│  │▮│ Cross-train on CI Pipeline [Personal]   [ Not evaluated ] │  ← amber rail
│  │ │ Self-assessed 40%                                          │
│  └─┘                                                            │
│  [ ✎ Start Evaluation ]   Score each objective, then finalize.  │
└───────────────────────────────────────────────────────────────┘
```
When an objective is evaluated the rail turns green and the badge reads
`Evaluated · 88%`.

## Type scale (existing tokens)
- Eyebrow: `--fs-eyebrow` (11px), `--fw-semibold`, uppercase, `--ls-wide`, `--muted`
- Name: `--fs-section` (18px), `--fw-bold`, `--ls-tight`, `--text`
- Role: `--fs-helper` (12px), `--muted`
- Objective title: `--fs-body`, `--fw-semibold`, `--text`
- Meta / helper: `--fs-helper`, `--muted`

## Color / status treatment
| State | Rail | Badge |
|-------|------|-------|
| Not evaluated | `--amber` | `.badge.amber` "Not evaluated" |
| Evaluated | `--green` | `.badge.green` "Evaluated · N%" |
| Overall (header) | — | amber `X/Y` until `X==Y` → green |

Progress bar reuses `.progress.green`. All values are design tokens → **light + dark
handled automatically**; rail uses solid `--amber`/`--green` (legible in both themes).

## Components (vanilla — reuse existing classes)
- `.card` — container (unchanged)
- `.avatar` — 40px identity anchor (size bump via `.eval-id .avatar`)
- `.badge` (green/amber) — overall + per-row status
- `.tag` — Org / Personal type
- `.progress.green` — completion bar
- `.btn.primary` — Start Evaluation CTA
- New scoped classes: `.eval-head`, `.eval-id`, `.eval-eyebrow`, `.eval-name`,
  `.eval-role`, `.eval-bar`, `.eval-row(.done)`, `.eval-rail`, `.eval-foot`

## User flow
1. Leader selects an employee (Assigned Employees panel) → this card renders.
2. Primary action: **Start Evaluation** → reveals the editable `memberEvalCard` inline.
3. Success: card region swaps to the editable evaluation (same header treatment for
   continuity), with a **✓ Done** to collapse back here.
4. Error: none (read-only). Save/validation lives in the editable state.

## States
- **Loading:** n/a (synchronous mock data).
- **Empty (no objectives):** keep the `.empty` block — "No objectives for {name} yet."
  Hide the progress bar; still allow the header. CTA may read "Nothing to evaluate"
  (disabled) — optional.
- **All evaluated:** header badge green `Y/Y evaluated`, every rail green; CTA label
  can switch to "Review Evaluation".

## Continuity note (editable state)
`memberEvalCard` should reuse the **same identity header** (avatar + name + progress)
so "Start Evaluation" feels like the card opening up, not a context switch.

---

## Implementation (drop-in)

### CSS (append near `.stack` / Feedback styles in styles.css)
```css
/* Leader Feedback — Evaluation start card */
.eval-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.eval-id { display: flex; align-items: center; gap: 12px; }
.eval-id .avatar { width: 40px; height: 40px; font-size: 14px; flex-shrink: 0; }
.eval-eyebrow { font-size: var(--fs-eyebrow); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: var(--ls-wide); color: var(--muted); }
.eval-name { font-size: var(--fs-section); font-weight: var(--fw-bold); letter-spacing: var(--ls-tight); color: var(--text); line-height: 1.2; }
.eval-role { font-size: var(--fs-helper); color: var(--muted); margin-top: 1px; }
.eval-bar { margin: 14px 0 4px; }
.eval-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.eval-row:last-of-type { border-bottom: none; }
.eval-rail { width: 3px; align-self: stretch; min-height: 34px; border-radius: var(--r-pill); background: var(--amber); flex-shrink: 0; }
.eval-row.done .eval-rail { background: var(--green); }
.eval-row-main { flex: 1; min-width: 0; }
.eval-row-title { font-weight: var(--fw-semibold); color: var(--text); }
.eval-row-meta { font-size: var(--fs-helper); color: var(--muted); margin-top: 2px; }
.eval-foot { display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.eval-foot .hint { font-size: var(--fs-helper); color: var(--muted); }
```

### `evalStartCard(subject)` replacement
```js
function evalStartCard(subject) {
  const objs = DB.OBJECTIVES.filter((o) => o.owner === subject.name && o.period === DB.PERIOD);
  const total = objs.length;
  const evald = objs.filter((o) => o.managerPercent != null).length;
  const allDone = total > 0 && evald === total;
  const pct = total ? Math.round((evald / total) * 100) : 0;

  const rows = total
    ? objs.map((o) => {
        const done = o.managerPercent != null;
        const badge = done
          ? `<span class="badge green">Evaluated · ${o.managerPercent}%</span>`
          : `<span class="badge amber">Not evaluated</span>`;
        return `<div class="eval-row ${done ? "done" : ""}">
          <span class="eval-rail"></span>
          <div class="eval-row-main">
            <span class="eval-row-title">${UI.esc(o.title)}</span> <span class="tag">${o.category === "organization" ? "Org" : "Personal"}</span>
            <div class="eval-row-meta">Self-assessed ${o.selfPercent != null ? o.selfPercent + "%" : "—"}</div>
          </div>
          ${badge}
        </div>`;
      }).join("")
    : `<div class="empty">No objectives for ${UI.esc(subject.name)} yet.</div>`;

  const bar = total
    ? `<div class="eval-bar">${UI.progress(pct, allDone ? "completed" : "at-risk")}</div>`
    : "";

  return `<div class="card">
    <div class="eval-head">
      <div class="eval-id">
        ${UI.avatar(subject.initials)}
        <div>
          <div class="eval-eyebrow">Evaluation</div>
          <div class="eval-name">${UI.esc(subject.name)}</div>
          <div class="eval-role">${UI.esc(subject.role || "")}</div>
        </div>
      </div>
      <span class="badge ${allDone ? "green" : "amber"}">${evald}/${total} evaluated</span>
    </div>
    ${bar}
    <div class="eval-list">${rows}</div>
    <div class="eval-foot">
      <button class="btn primary" id="start-eval">✎ Start Evaluation</button>
      <span class="hint">Score each objective's key results, then finalize.</span>
    </div>
  </div>`;
}
```
Notes:
- `UI.avatar(initials)` renders the `.avatar` circle; `.eval-id .avatar` bumps it to 40px.
- `UI.progress(pct, status)`: `at-risk` → amber fill, `completed` → neutral/green — I
  pass `completed`/`at-risk` so the bar tone tracks the badge (green when done).
- No behavior change: still one `#start-eval` button; wiring untouched.
