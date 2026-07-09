# Design Spec: Titan → NiceAdmin Re-skin
_Author: Mika | Date: 2026-07-08 | For: Nico (frontend impl)_

Re-skin the existing vanilla prototype (`prototype/`) to the **NiceAdmin** admin
aesthetic. No framework change. The stylesheet is already token-driven
(`:root` in `styles.css`), so ~70% of this is a token swap; the rest is 3 new
components + the role-model collapse.

Reference (authoritative): https://niceadmin-mui-nextjs-main.vercel.app/ +
user screenshot. **Do not invent colors — use the tokens below.**

---

## 1. Color tokens — swap in `styles.css :root`

NiceAdmin = light UI, **two greens**: a deep forest green (dark surfaces,
chart primary, brand) + a lime/chartreuse (CTAs, positive accents), on a soft
gray-green page.

| Token | Old (Lattice) | New (NiceAdmin) | Used for |
|---|---|---|---|
| `--bg` | `#f6f7f9` | `#f3f6f3` | page background |
| `--surface` | `#ffffff` | `#ffffff` | cards, sidebar, topbar |
| `--surface-2` | `#fbfbfd` | `#f5f8f4` | hover, inputs, tags |
| `--border` | `#e7e8ee` | `#e8eee7` | all borders |
| `--text` | `#1c1d29` | `#2b302c` | body text |
| `--muted` | `#6b7185` | `#6a746c` | secondary text |
| `--faint` | `#9aa0b0` | `#9aa89c` | tertiary |
| `--accent` | `#6c5ce7` | `#5f9e3f` | active-nav text, links, focus ring, progress fill |
| `--accent-soft` | `#efeafc` | `#e9f4dc` | active-nav pill bg, focus glow, AI card gradient |
| `--green` | `#16a34a` | `#4e8a34` | positive delta text, success |
| `--green-soft` | `#e6f6ec` | `#e7f4d6` | positive-delta pill bg, green badge |
| `--amber` / soft | keep | keep | at-risk |
| `--red` / soft | keep | keep | alerts |
| `--blue` / soft | keep | keep | info tags |

**New tokens to add:**
```css
--green-deep:  #124b3a;  /* hero banner bg, chart primary/base, brand mark, FAB, donut ring 1 */
--green-deep2: #0e3c2e;  /* darkest chart segment */
--lime:        #a6ce3a;  /* PRIMARY CTA button bg, hero button, bar tops, donut ring 2 */
--lime-2:      #cfe89a;  /* light lime, chart 3rd segment / insight bar mid */
--donut-amber: #e6a23c;  /* donut/insight 3rd segment (matches ref) */
```

---

## 2. Component overrides (rules that change, not just tokens)

NiceAdmin's primary button is **lime with dark text** (not accent-on-white),
and the active nav is a **mint pill with a rounded-left accent**. Apply:

```css
/* Primary CTA — lime, dark ink */
.btn.primary { background: var(--lime); border-color: var(--lime); color: #16351f; font-weight: 700; }
.btn.primary:hover { filter: brightness(1.04); }

/* Active nav — mint pill, deep-green text, keep left icon tinted */
.nav-item.active { background: var(--accent-soft); color: #2f6b2a; font-weight: 700; }
.nav-item.active .nav-ico { color: var(--accent); }

/* Brand mark → deep green filled circle vibe */
.brand-mark { color: var(--green-deep); }

/* Stacked bars: base = deep green, top = lime */
.bars .bar { background: var(--green-deep); }
.bars .bar.soft { background: var(--lime); }

/* Progress fill default → accent green (already via --accent) */
```

Everything else (cards, radii, shadows, badges, tables, chat, modal, forms)
keeps its current structure — just recolored via the tokens above. Radii
already match NiceAdmin's soft feel (`--r-card:14px`); keep.

---

## 3. Layout shell changes (`index.html` + css)

### Sidebar — add section labels
NiceAdmin groups nav under uppercase section headers. Insert a small label
above the nav group. Keep sidebar white.

```
┌──────────────────────┐
│ ◤ Titan              │   brand (green-deep mark)
│                      │
│ DASHBOARD            │   .nav-section  (11px, uppercase, --faint, letter-spacing)
│ ▤ Dashboard      ◀───│   active = mint pill
│ ◎ Objectives         │
│ ✦ AI Assistant       │
│ ✓ Reviews            │
│                      │
│ (spacer)             │
│ Prototype · dummy    │   .mini-note (unchanged)
└──────────────────────┘
```
Add `<div class="nav-section">Workspace</div>` above `#nav`. One section is
enough for 4 items — do not over-split.

### Topbar — search + role switch
Add a search input on the left of the topbar (visual only, non-functional is
fine for prototype) to echo NiceAdmin. Keep the role switch + user chip on the
right. Role switch now has **2 buttons** (see §5).

```
┌───────────────────────────────────────────────────────────────┐
│ Dashboard        [ 🔍 Search… ]      [Employee|Leader]  (AP) Abdul│
└───────────────────────────────────────────────────────────────┘
```
Search field: reuse input styles, `max-width:320px`, rounded, `--surface-2` bg,
magnifier glyph prefix. Low priority — if time-boxed, ship without it.

---

## 4. New components

### 4a. Welcome hero banner (`UI.heroBanner`) — top of BOTH dashboards
Full-width deep-green card, white text, lime CTA, greeting keyed to current
user. This is the signature NiceAdmin element.

```
┌───────────────────────────────────────────────────────────────┐
│                                                        ✦        │
│  Good Afternoon, Abdul  ☀                             (accent   │
│  Here's your performance snapshot for Q3 2026.         glyph)   │
│                                                                 │
│  [ View Full Report → ]   ← lime btn                            │
└───────────────────────────────────────────────────────────────┘
```
- bg: `var(--green-deep)`; text white; subtitle `rgba(255,255,255,.75)`
- greeting: "Good Morning/Afternoon/Evening, {firstName}" (time-of-day, static
  ok — hardcode "Afternoon")
- CTA `.btn.primary` (lime). For prototype it can route to Objectives view.
- radius `--r-card`, padding `24px 28px`, `margin-bottom:16px`
- optional right-side decorative glyph/emoji (skip real illustration)

### 4b. Donut chart (`UI.donut(segments, centerLabel, centerValue)`)
Pure CSS `conic-gradient` ring with a hollow center. Used in Leader dashboard
("Distribution" / "Current headcount by status").

```
        ╭───────╮
      ╱  ┌─────┐  ╲
     │   │Total│   │        segments: green-deep, lime, donut-amber, lime-2
     │   │ 44  │   │        legend rows below with value + delta
      ╲  └─────┘  ╱
        ╰───────╯
   ● Exceeds 3   ● Meets 12
   ● Below 4     ● At Risk 2
```
Implementation: a `div` with `background: conic-gradient(...)` sized ~160px,
`border-radius:50%`, and an inner white circle (`::after` or nested div) ~62%
diameter for the hollow. Legend = existing `.row-item` rows with color dots
(reuse `.badge::before` dot pattern or inline swatch).

### 4c. Insight segmented bar (`UI.insightBar(segments)`)
The thin 3-color bar under "Key Insights". A flex row of colored spans summing
to 100%. Reuse for an "at-a-glance" split (e.g. objective status mix).
```
[■■■■■■■■ deep ][■■■ amber ][■■■■ lime ]   ● On-track  ● At-risk  ● Draft
```

Add all three as `UI.*` helpers alongside existing `UI.barChart` / `UI.sparkline`
(they live in whatever module defines `UI` — check `app.js`).

---

## 5. Role model — Employee + Leader only

Collapse 3 roles → 2. **Leader = merged Manager + HR** (team view + org-wide
view in one dashboard).

**`index.html` role switch** → 2 buttons:
```html
<button class="role-btn active" data-role="employee">Employee</button>
<button class="role-btn" data-role="leader">Leader</button>
```

**`mock-data.js` CURRENT_USER** → 2 keys:
```js
employee: { name: "Abdul Palala", initials: "AP", title: "Software Engineer" },
leader:   { name: "Andre Uy",     initials: "AU", title: "Engineering Leader" },
```
(Drop the `hr` user; Rainiel can stay in `EMPLOYEES` roster.)

**`views-dashboard.js`** → `dashboard(role)` handles `employee` | `leader`.
- Delete the `hr` branch; rename `managerDash()` → `leaderDash()`.
- `leaderDash()` = manager content **+** the HR org-wide sections appended, so
  a Leader sees both team and organization. Compose top-to-bottom:

```
LEADER DASHBOARD
┌─────────── hero banner (Good Afternoon, Andre) ───────────┐

[ Team Avg 80 +2 ] [ Obj Completion 78% +6% ] [ Pending 2 ] [ Attention 1 ]   ← statTiles (from manager)

┌─ Team Performance (table) ─────┐  ┌─ Distribution (DONUT) ──────┐   ← donut replaces bars
│ member / score / progress /st  │  │  Exceeds/Meets/Below/AtRisk │
└────────────────────────────────┘  └─────────────────────────────┘

┌─ Department Performance (tbl) ─┐  ┌─ Dept Score (bar chart) ────┐   ← from HR
└────────────────────────────────┘  └─────────────────────────────┘

┌─ Top Performers ───┐  ┌─ Low-Performance Alerts ──┐              ← from HR
└────────────────────┘  └───────────────────────────┘

┌─ Employees Needing Attention ─────────────────────┐            ← from manager
└───────────────────────────────────────────────────┘
```
Keep it scannable — Leader dashboard is longer; that's expected for a merged
role. Reuse existing table/badge/statTile helpers unchanged (recolored via
tokens). Swap the manager "Performance Distribution" bar chart to the new
**donut** to showcase the NiceAdmin look; keep the "Department Score" bar chart
as the recolored stacked-green bars.

**Other views** (`views-objectives.js`, `views-ai.js`, `views-reviews.js`):
grep for `"manager"` / `"hr"` role checks and any `CURRENT_USER.hr` /
`.manager` reads → map to `leader`. Employee view: add hero banner at top,
otherwise structure unchanged.

---

## 6. Component inventory (existing → recolor / touch)

| Component | Action |
|---|---|
| `.sidebar` + brand | recolor, add `.nav-section` label |
| `.topbar` + role-switch | 2 roles, optional search field |
| `.btn.primary` | lime bg + dark text override |
| `.nav-item.active` | mint pill + deep-green text |
| `.card` / `.stat-tile` / badges / table / progress | recolor via tokens only |
| `.bars` | stacked deep-green + lime |
| `.ai-narrative` | gradient now green (via `--accent-soft`) |
| **hero banner** | NEW — `UI.heroBanner` |
| **donut** | NEW — `UI.donut` (conic-gradient) |
| **insight bar** | NEW — `UI.insightBar` (optional, nice-to-have) |

---

## 7. States (unchanged behavior, recolored)
- **Loading**: prototype has no async — n/a. If added, gray skeleton cards.
- **Empty**: reuse `.empty` ("No one needs attention 🎉", etc.) — already present.
- **Error**: n/a for mock prototype.
- **Active/hover**: nav hover `--surface-2`; active mint pill; button hover brightness.

---

## 8. Handoff checklist for Nico
1. Swap `:root` tokens (§1) + add new green tokens.
2. Apply component overrides (§2).
3. `index.html`: 2-role switch, add `.nav-section`, optional search input.
4. `mock-data.js`: `CURRENT_USER` → employee/leader.
5. `views-dashboard.js`: employee/leader branches; `leaderDash()` = manager+HR merge; hero banner on both.
6. Add `UI.heroBanner`, `UI.donut`, (`UI.insightBar`) helpers.
7. Sweep `views-objectives/ai/reviews.js` for `manager`/`hr` → `leader`.
8. Visual check in browser against reference screenshot (deep-green hero, lime CTAs, mint active nav, donut).

## Out of scope
- Real charts library (keep pure-CSS), dark-mode toggle, i18n/flag, cart/bell
  icons, real search. These are NiceAdmin chrome not needed for Titan's prototype.

## Open questions
- None blocking. Assumed Leader dashboard shows team **and** org sections
  stacked (per approved "Leader = Manager + HR"). If too long, later split into
  tabs — not needed for prototype.
