# Project Context
_Last updated: 2026-07-08_

## Project
- **Name**: Titan
- **Type**: Web app — AI-powered employee performance management / OKR platform
- **Stack**: TBD (deferred) — prototype is UI-first with mock data
- **Repo**: /home/andreuy/project/titan (local, no git yet)

## Team Config
- **Backlog**: none
- **Notion**: none
- **CI/CD**: none

## Deliverables
- Clickable UI prototype styled after Lattice (https://lattice.com/)
- Modules in prototype: Objectives + Progress, Dashboards (Employee/Manager/HR), AI Assistant (mocked), Reviews (peer + manager)
- Full requirements: docs/requirements.md (14 feature areas for eventual product)

## Current Phase
Prototype — built (vanilla HTML/CSS/JS in prototype/). Revision in progress: 2-role model + NiceAdmin re-skin.

## Key Constraints
- Prototype first: mock data + fake login (role switcher: Employee / Leader)
- No real auth, DB, or live integrations in prototype
- Stack: vanilla HTML/CSS/JS (kept; no framework migration for prototype)

## Agent Notes
- Design language (REVISED 2026-07-08): follow NiceAdmin admin template — green admin shell, left sidebar nav, card grid, charts. Ref: https://niceadmin-mui-nextjs-main.vercel.app/
- Roles (REVISED 2026-07-08): Employee, Leader only. Leader = merged Manager + HR (team + org-wide views under one role). RBAC drives dashboard views.
- Domain: objectives with weights + success criteria; evidence auto-pulled from GitHub/Backlog/Slack (mocked in prototype)
- AI features are mocked (static/sample responses) in prototype
- Out of scope for prototype: reports export, audit trail, notifications backend, admin CRUD
