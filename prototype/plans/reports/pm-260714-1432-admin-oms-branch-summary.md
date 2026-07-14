# feature/admin-oms — Branch Summary

_Date: 2026-07-14 · Branch: `feature/admin-oms` (pushed) · Base: `main` · Scope: UI prototype only_

## Overview
5 feature commits, ~1,200 insertions across 12 files. Adds the remaining MVP/Important screens, reconciles all 6 deviations from the Google Sheet, and ships a live GitHub Pages preview. `main`'s existing `/prototype/` deployment is untouched.

## Commits
| SHA | Title |
|---|---|
| `3570419` | Admin/OMS console — Users, Departments, Teams |
| `445fa5e` | Peer Review page for all roles |
| `ca38f0f` | Reports, Evidence Review, Archive + reconcile deviations |
| `ac480f1` | Reusable objective templates in Admin/OMS (seeded + apply) |
| `402d801` | Create-template UI + multi-user assign for templates |

## New pages
| Page | File (new) | Access |
|---|---|---|
| Admin / OMS — Users · Departments · Teams · Templates | `views-admin.js` (~385 lines) | Leader |
| Peer Review — To Review · My Requests · About Me | `views-peer.js` (~245) | All |
| Reports & Export — role-scoped list + mock PDF/Excel/CSV | `views-reports.js` (~71) | All |
| Evidence Review & Curation — review / curate / attach | `views-evidence.js` (~101) | Leader |

## Objective Templates (leader-only, in OMS → Templates)
- Seeded quarterly/annual templates.
- **Create-template UI** mirrors objective creation (add items by category · title · description; live editable list; inline validation).
- **Delete** per template.
- **Apply to one OR MORE members** via checklist (Select all / Clear); seeds each member's current-half objectives, honoring org ≤3 / personal ≤5 caps and skipping duplicate titles; reports aggregate added/skipped.

## Enhancements to existing pages
- **My Objectives** (`views-objectives.js`): target dates (explicit or half-year-end default), **Final Overall Score** card, **archive/restore** with collapsible Archived section.
- **AI Assistant** (`views-ai.js`): "AI Suggested Feedback" → on-demand, **data-only AI Insights** (never authored feedback).
- **Analytics** (`views-analytics.js`): KPI target dates + leader **Evaluation Progress** management card (replaces HR/department dashboard).

## Supporting changes
- `mock-data.js`: `EMPLOYEES` (+email/manager/obsRole/active), reshaped `DEPARTMENTS`, new `TEAMS`, `OBJECTIVE_TEMPLATES`, reshaped `PEER_REVIEWS`, one seeded archived objective.
- `app.js` + `index.html`: nav items, view titles, leader-only role gates; `UI.periodEnd()` helper.

## Deviations reconciled (vs Google Sheet)
Target dates · Final Overall Score · AI Insights (data-only) · Departments in OMS not Analytics · HR dashboard → Leader Analytics · Reusable templates.

## Deployment
- GitHub Pages is in **legacy "Deploy from a branch"** mode → the `deploy-pages.yml` Actions workflow is inert.
- **Main (production):** `https://lennarduy104.github.io/Team_Titan_prototype/prototype/` — 200, unchanged.
- **Feature preview:** `https://lennarduy104.github.io/Team_Titan_prototype/admin-oms/` — 200.
- Preview = snapshot of the branch's `prototype/` copied into `main/admin-oms/` (commit `53032c0` on `main`). Refresh = re-copy + commit, or add an auto-sync workflow.

## Validation
- `node --check` clean on all edited/new JS.
- serve-smoke 200 on all assets.
- Headless render: all view×role combinations, 0 failures, no `undefined`.
- Template flows verified headless: create, multi-apply (added/skipped correct), delete.
- Deploy verified: `/admin-oms/`, `/admin-oms/login.html`, `/admin-oms/views-admin.js` all 200.

## Unresolved / open
1. PR `feature/admin-oms` → `main` not yet opened.
2. Preview refresh is manual (snapshot). Auto-sync workflow not yet set up.
3. No **browser** click-through — validation is structural only (no browser in the build env). Recommend a manual pass of login, modals, and template create/apply on the live preview.
4. Longer term: switching Pages Source to "GitHub Actions" would remove the `main/admin-oms/` copy but changes main's URL from `/prototype/` to `/`.
