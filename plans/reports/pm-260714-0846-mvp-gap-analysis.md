# OBS — Function Gap Analysis (MVP & Important)

_Source: client Google Sheet "Summarized Function List" (14 modules). Compared against the current **UI prototype** (vanilla HTML/CSS/JS, mock data — no backend/DB/real integrations). Nice-to-Have items excluded per request._

**Legend:** ✅ Implemented (UI/mock) · 🟡 Partial (UI stub / mock-only / adapted) · ❌ Missing · ⚠️ Intentionally deviated (later client decision this session)

**Important framing:** the prototype is UI-first with mock data. Backend-heavy functions (integrations, MCP AI, RLS, persistence, exports) are inherently **not built** — at best represented visually. "Implemented" below means *demonstrated in the prototype UI*, not production-ready.

## 1. Authentication & User Management
| Function | Pri | Status | Notes |
|---|---|---|---|
| Login / Logout & SSO | MVP | 🟡 | Google SSO button + fake auth gate + sign-out in UI. No real OIDC/SAML, MFA, sessions. |
| RBAC | MVP | 🟡 | Employee/Leader role switch gates nav/views (Feedback leader-only, AI self-scope). No service-layer / Postgres RLS. |
| User Management (CRUD/invite/deactivate) | MVP | ❌ | No user admin UI. |
| Department Management | MVP | ⚠️❌ | Not built — and **de-scoped by client** (OBS not department-focused). |
| Team Management | MVP | ❌ | No team CRUD. |
| Employee Profile | MVP | ❌ | Only avatar/name chip; no profile view/edit. |
| Manager Assignment | MVP | ❌ | Reporting lines are mock (TEAM roster); no assignment UI. |

## 2. Objective Management
| Function | Pri | Status | Notes |
|---|---|---|---|
| Create / Edit Objectives | MVP | 🟡 | Create personal objective (title/desc) works; **no rich success-criteria editor**, no edit of existing title/criteria. |
| Assign & Duplicate Objectives | MVP | 🟡 | Leader assigns organization objectives to a member (create-for-member). No duplicate. |
| Assign Objective Weights | MVP | ⚠️❌ | **Weights dropped by client** earlier this session. Conflicts with sheet (MVP). |
| Target Dates & Success Criteria | MVP | ⚠️❌ | **Target/status dropped by client**; success criteria not in current model. Conflicts with sheet (MVP). |
| Archive Objectives | Important | ❌ | Not built. |
| Quarterly / Annual Templates | Important | 🟡 | Half-year cycle + "New half-year" blank template ≈ templating; not reusable *named* templates. |

## 3. Performance Tracking
| Function | Pri | Status | Notes |
|---|---|---|---|
| Objective Progress | MVP | 🟡 | Progress via self % + manager %. **Not** auto-derived from evidence (manual). |
| Evidence Repository | MVP | 🟡 | Evidence shown per objective (mock "auto-collected"); no central repo / uploads. |
| KPI Tracking | Important | ✅ | Definition + measured value + threshold status (Exceeded/On-track/At-risk) on Analytics. |
| Activity History | Important | ❌ | No aggregated activity view. |
| Monthly / Quarterly Progress | Important | 🟡 | Half-year history/snapshots exist; no monthly/quarterly rollups. |

## 4. External Integrations — all backend
| Function | Pri | Status | Notes |
|---|---|---|---|
| Integration Framework | MVP | ❌ | Backend; mock evidence text only. |
| GitHub Integration | MVP | ❌ | Referenced in mock evidence, not real. |
| Backlog (Nulab) | Important | ❌ | Mock text only. |
| Slack | Important | ❌ | Mock text only. |

## 5. Evidence Collection
| Function | Pri | Status | Notes |
|---|---|---|---|
| Evidence Linking to Objectives | MVP | 🟡 | Objective detail shows linked evidence (mock); no real linking engine. |
| Evidence Review & Curation | Important | ❌ | No curation/attach UI. |

## 6. AI Assistant
| Function | Pri | Status | Notes |
|---|---|---|---|
| MCP AI Integration Layer | MVP | ❌ | Backend; AI is canned/mock. |
| AI Performance Summary | MVP | 🟡 | Static mock summary in AI Assistant; not evidence-cited. |
| AI Objective Progress | Important | 🟡 | Mock estimate + reasons card. |
| AI Suggested Feedback | Important | ⚠️ | **Client pivoted AI to data-only insights** (no drafted feedback). Employee sees reframed "Strengths & Focus Areas"; leader gets data-only AI Insights. Deliberate deviation. |
| AI Report Generation | Important | 🟡 | Report buttons + mocked draft modal; no real generation. |

## 7. Peer Review
| Function | Pri | Status | Notes |
|---|---|---|---|
| Request Peer Reviews | Important | ❌ | PEER_REVIEWS mock data + a "Peer Rating" metric only; no request workflow UI. |
| Anonymous / Named Reviews | Important | ❌ | Not built. |
| Rating Scale & Written Feedback | Important | ❌ | No peer rating/feedback UI. |

## 8. Manager Review
| Function | Pri | Status | Notes |
|---|---|---|---|
| Score Override & Manual Feedback | MVP | ✅ | Per-objective manager % + written comment (leader enters). |
| Review AI Suggestions (accept/reject) | MVP | ⚠️ | Built then **removed by client** (AI no longer suggests giveable feedback). Deliberate deviation. |
| Finalize Evaluation | MVP | 🟡 | Per-objective Save/Update locks the member's self side; no single finalize+sign-off lock. |
| Attach Files | Important | ❌ | Not built. |

## 9. Dashboards
| Function | Pri | Status | Notes |
|---|---|---|---|
| Employee Dashboard | MVP | 🟡 | Dashboard replaced by **Analytics** (client) + My Objectives + AI tab cover most fields (objectives, progress, trend, AI summary). No unified timeline. |
| Manager Dashboard | MVP | 🟡 | Leader Analytics covers team performance, attention list, completion, distribution, pending. |
| HR Dashboard | Important | ⚠️❌ | Department/org stats **removed by client**. |

## 10. Reports
| Function | Pri | Status | Notes |
|---|---|---|---|
| Report Generation | Important | 🟡 | AI report drafts mocked; no real report engine. |
| Export (PDF / Excel / CSV) | Important | ❌ | Non-functional "Export PDF" button only. |

## 13. Administration
| Function | Pri | Status | Notes |
|---|---|---|---|
| Evaluation Periods Management | MVP | 🟡 | Half-year period lifecycle + "New half-year" (open/close cycle) in UI; no admin windows/config. |
| Admin Console Shell | Important | ❌ | No admin console. |

## 14. Analytics
| Function | Pri | Status | Notes |
|---|---|---|---|
| Analytics Visualizations | Important | 🟡 | Trends, objective completion, team performance, KPI achievement, peer/perf distribution present. Department comparison **removed by client**; evaluation-completion viz partial. |

## Scorecard (MVP + Important only)
- **MVP (19 functions):** ✅ 1 · 🟡 8 · ❌/⚠️❌ 10
- **Important (18 functions):** ✅ 1 · 🟡 6 · ❌ 11
- Prototype is strongest in **Objectives, Manager Review (scoring), KPIs, period/history, dashboards-as-Analytics**. Whole modules unbuilt: **Integrations, Peer Review, Reports/Export, User/Team/Profile admin** (mostly backend — expected for a UI prototype).

## Intentional deviations from the sheet (client decisions this session — reconcile before build)
1. **Weights / Target dates / Success criteria** dropped from objectives — but sheet lists them **MVP**. Decide: re-add for MVP, or update the sheet.
2. **AI "Suggested Feedback" + "Review AI Suggestions" (accept/reject)** removed in favor of **data-only AI Insights** — sheet lists both as MVP/Important. Reconcile the AI stance.
3. **Departments / HR Dashboard / Department analytics** removed — sheet lists Department Mgmt (MVP) + HR Dashboard/Dept viz (Important).
4. **Single "Finalize Evaluation"** replaced by per-objective evaluation — sheet lists Finalize as MVP.

## Recommended MVP build order (for the real Next.js/NestJS product)
Foundation → Auth/SSO + RBAC + User/Team/Profile · Objective Management (with the re-decided weights/criteria) · Manager Review + Finalize · Objective Progress + Evidence + Integration Framework (GitHub first) · MCP AI layer + AI Summary · Employee/Manager Dashboards. Peer Review, Reports/Export, Analytics viz follow as Important.

## Open questions
- Reconcile the 4 deviations above — are the prototype's simplifications the new source of truth, or does the sheet stand for MVP scope?
- Is the prototype's mock "evidence auto-collected from GitHub/Backlog/Slack" meant to become real integrations in MVP (sheet says GitHub + Framework are MVP)?
- Departments: fully cut, or keep minimal for RBAC/org grouping even if not surfaced in Analytics?
