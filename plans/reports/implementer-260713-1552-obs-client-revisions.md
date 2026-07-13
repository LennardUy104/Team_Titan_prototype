# OBS Prototype — Client Revisions (2026-07-13)

_Scope: prototype (vanilla HTML/CSS/JS, mock data). No backend. Layout/theme system + Inter typography preserved throughout._

## 1. Product rename
- App title → **"Sun PH Objective Monitoring System (OBS)"** across sidebar + login brand.
- Browser tab → **"OBS"** (login tab "OBS — Sign in"). AI chat greeting → "OBS AI assistant".
- Internal storage keys / code comments left as-is (project codename, not product title).

## 2. Login — Google SSO only
- Removed email/password, remember-me, forgot-password, Microsoft button, and role selector.
- New centered single-column layout: logo → app name → "Login to continue" → "with" divider → **Sign in with Google** button (gradient, theme-aware) → subtle wave.
- Role now defaults to Employee at sign-in; switched via the existing in-app topbar toggle.

## 3. My Objectives — rebuilt to the spreadsheet template model
- **Mission Statement** (one sentence, per half-year, editable).
- Two capped sections: **Organization Objectives (max 3, manager-assigned)** + **Personal Objectives (max 5, self-set)**. Caps enforced (disabled button + guard).
- Per-objective **dual assessment**: Self (% + achievement report) and Manager (% + comment).
- Self side editable **until the manager evaluates**, then it **locks** (🔒).
- Dropped Weight / Target / Status. Period model → **half-year (e.g. 2026-2nd)**.

## 4. Feedback tab (leader) — per-objective evaluation
- Replaced the single overall score with **per-objective Manager % + comment** (Save locks the member's self side).
- Leader can **add Organization Objectives** for a member (cap 3).
- **AI Insights** remain on-demand and data-only (gather facts; never draft feedback). Roster badges now show evaluation progress (e.g. "1/4 evaluated", "Complete").

## 5. My Feedback (received) — repurposed
- Old single-score card retired. Now shows the **manager's per-objective evaluations per half-year** (read-only) — unifies "feedback history" with the period model.

## 6. History — half-year cycle
- Objectives belong to a half-year period. **Current half = editable; past halves = read-only** snapshots (frozen self/manager %s + comments).
- **"New half-year"** advances the cycle (blank template); previous half becomes read-only history. Seeded past halves (2026-1st, 2025-2nd) for demo.

## 7. Period selector — scalable (dropdown + stepper)
- Replaced the wrapping tab wall with a one-line control: **‹ / › stepper + dropdown** (newest-first, "· current" marked, scrolls — handles any number of periods).
- **"New half-year"** demoted to a subtle ghost button: only on the current period, **disabled until the current half has an objective**, and **confirm-gated** (stops empty-period spam).
- Applied to My Objectives + My Feedback via a shared `UI.periodSelect()` helper.

## 8. Analytics
- Adapted (not redesigned) to the new %-model: charts use "achieved %" (manager if evaluated, else self) with a derived status band; scoped to the current half-year.

## Files touched
`prototype/`: app.js, index.html, login.html, login.js, mock-data.js, styles.css, views-ai.js, views-analytics.js, views-objectives.js, views-reviews.js.
Design specs: `plans/designs/leader-feedback-tab.md`, `plans/designs/period-selector.md`.

## Validation
All JS pass `node --check`; CSS token references resolve; local HTTP serve returns 200 for all assets. Structural + smoke only — no browser-based visual pass in this environment.

## Open items / follow-ups
- Legacy `RECEIVED_EVALUATIONS` mock data now unused (harmless; can be trimmed).
- Objective detail modal retains optional Evidence (GitHub/Backlog/Slack) — kept as a product differentiator; not in the source spreadsheet.
- Suggest a browser visual QA pass across the 4 themes + both roles before client demo.
