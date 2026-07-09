# Titan — Application Requirements

_Source: [Titan] Project Meeting, Jul 6, 2026 — Abdul Jalil Palala, Andre Lennard Uy, Rainiel Dejito_
_Captured: 2026-07-08_

Titan is an **AI-powered employee performance management / OKR platform**. It replaces manual
Excel-based performance tracking with automated objective tracking, evidence collection from dev
tools (GitHub, Backlog, Slack), AI-generated summaries/feedback, and multi-role dashboards.

Design reference: **[Lattice](https://lattice.com/)**.

## Function List

### 1. Authentication & User Management
Login / Logout · Role-Based Access Control (RBAC) · User Management · Department Management ·
Team Management · Employee Profile · Manager Assignment

### 2. Objective Management (heart of the app)
Create / Edit / Archive Objectives · Assign to Employees · Assign Weights · Set Target Dates ·
Define Success Criteria · Duplicate for Multiple Employees · Quarterly/Annual Templates ·
Approval Workflow

> Example — Objective: *Improve Code Quality*; Weight: 30%; Success Criteria: *<3 production bugs*, *PR approval rate >95%*

### 3. Performance Tracking (auto, not manual)
Objective Progress · KPI Tracking · Performance Timeline · Activity History · Achievement Records ·
Evidence Repository · Monthly Progress · Quarterly Progress

### 4. External Integrations (automation layer)
- **GitHub**: Pull Requests, Reviews, Commits, Issues, Branches, Releases
- **Backlog (Nulab)**: Completed Tasks, Story Points, Bugs, Milestones, Sprint Completion
- **Slack**: Notifications, Recognition Messages, Feedback, Team Activity
- **Future**: Jira, Azure DevOps, SonarQube, Jenkins, GitLab, Microsoft Teams, Google Workspace

### 5. Evidence Collection
Every objective has supporting evidence (e.g. "Reviewed 43 PRs", "Participated in 17 planning
meetings", "Received 5 peer recognitions"). Makes evaluations transparent and defensible.

### 6. AI Assistant (highest value)
- **AI Performance Summary** — auto-write evaluation narratives from activity data
- **AI Objective Progress** — estimate % complete + reasoning
- **AI Suggested Feedback** — strengths + improvement areas
- **AI Report Generation** — Monthly / Quarterly / Annual / Self-Assessment / Manager Assessment
- **AI Chat Assistant** — e.g. "Show John's accomplishments for Q2", "Summarize Abdul's GitHub activity"

### 7. Peer Review
Request Reviews · Anonymous · Named · Rating Scale · Written Feedback · Review History · Deadlines

### 8. Manager Review (optional)
Review AI Suggestions · Accept/Reject AI Comments · Override Scores · Add Manual Feedback ·
Attach Files · Finalize Evaluation

### 9. Dashboards
- **Employee**: Objectives, Progress, Timeline, AI Summary, Peer Feedback, Performance Trend
- **Manager**: Team Performance, Pending Reviews, Employees Needing Attention, Objective Completion, Performance Distribution
- **HR**: Department Performance, Org Statistics, Top Performers, Low Performance Alerts, KPI Trends

### 10. Reports
Generate: Monthly / Quarterly / Annual / Department / Team / Employee — Export: PDF, Excel, CSV

### 11. Notifications
Objective Assigned/Updated · Review Due · Peer Review Requested · Evaluation Submitted/Approved ·
Integration Failed · AI Summary Ready

### 12. Audit Trail
Objective Changes · Score Changes · Manager Comments · AI Recommendations · Approval History · User Activity

### 13. Administration
Manage: Departments · Teams · Users · Roles · Evaluation Periods · Objective Templates ·
AI Settings · Integration Settings

### 14. Analytics
Performance Trends · Objective Completion Rate · Department Comparison · Team Performance ·
KPI Achievement · Peer Review Distribution · Evaluation Completion Rate

---

## Prototype Scope (decided 2026-07-08)
UI-first clickable prototype, styled after Lattice. **Stack deferred.** Mock data + fake login
(role switcher: Employee / Manager / HR). Modules in scope:
1. Objectives + Progress
2. Dashboards (Employee / Manager / HR)
3. AI Assistant (mocked responses)
4. Reviews (peer + manager)

Out of scope for prototype: real auth, real DB, live integrations, reports export, audit trail,
notifications backend, admin CRUD.
