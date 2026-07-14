/* Titan prototype — all dummy data lives here. No backend. */
/* Exposed as window.DB and consumed by the view modules. */

const AVATAR_COLORS = ["#6c5ce7", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#14b8a6"];

// The fake logged-in user per role (drives the top-bar chip + perspective).
const CURRENT_USER = {
  employee: { name: "Abdul Palala", initials: "AP", title: "Software Engineer" },
  leader:   { name: "Andre Uy",    initials: "AU", title: "Engineering Leader" },
};

// User directory — treated as the mock "Central DB". Identity fields (name, email,
// manager, role/title) are owned there (read-only in OBS). obsRole + active + dept
// grouping are the OBS-side attributes managed in the Admin console.
const EMPLOYEES = [
  { id: 1, name: "Abdul Palala",  initials: "AP", role: "Software Engineer", dept: "Engineering", email: "abdul.palala@company.com",  manager: "Andre Uy",   obsRole: "employee", active: true,  score: 88, trend: "up",   status: "on-track" },
  { id: 2, name: "Maria Santos",  initials: "MS", role: "Senior Engineer",   dept: "Engineering", email: "maria.santos@company.com",  manager: "Andre Uy",   obsRole: "employee", active: true,  score: 92, trend: "up",   status: "on-track" },
  { id: 3, name: "John Cruz",     initials: "JC", role: "Software Engineer", dept: "Engineering", email: "john.cruz@company.com",     manager: "Andre Uy",   obsRole: "employee", active: true,  score: 64, trend: "down", status: "at-risk"  },
  { id: 4, name: "Lisa Tan",      initials: "LT", role: "QA Engineer",       dept: "QA",          email: "lisa.tan@company.com",      manager: "Andre Uy",   obsRole: "employee", active: true,  score: 79, trend: "up",   status: "on-track" },
  { id: 5, name: "Kevin Reyes",   initials: "KR", role: "Software Engineer", dept: "Engineering", email: "kevin.reyes@company.com",   manager: "Andre Uy",   obsRole: "employee", active: false, score: 71, trend: "flat", status: "on-track" },
  { id: 6, name: "Grace Lim",     initials: "GL", role: "Product Designer",  dept: "Engineering", email: "grace.lim@company.com",     manager: "Andre Uy",   obsRole: "employee", active: true,  score: 85, trend: "up",   status: "on-track" },
  { id: 7, name: "Rainiel Dejito",initials: "RD", role: "People Partner",    dept: "Admin",       email: "rainiel.dejito@company.com",manager: "Diana Cruz", obsRole: "leader",   active: true,  score: 90, trend: "flat", status: "on-track" },
  { id: 8, name: "Andre Uy",      initials: "AU", role: "Eng. Manager",      dept: "Engineering", email: "andre.uy@company.com",      manager: "Diana Cruz", obsRole: "leader",   active: true,  score: 87, trend: "up",   status: "on-track" },
];

// Review cycle is a half-year. PERIODS newest-first; index 0 is the current (open) one.
const PERIOD = "2026-2nd";
const PERIODS = ["2026-2nd", "2026-1st", "2025-2nd"];
const LIMITS = { organization: 3, personal: 5 };

// Mission statement per half-year, keyed "<period>|<name>" (editable for the current period).
const MISSION_STATEMENTS = {
  "2026-2nd|Abdul Palala": "Ship reliable, well-tested features while growing into a mentor for the team.",
  "2026-2nd|Andre Uy": "Build a predictable, healthy engineering team that ships quality work on time.",
  "2026-1st|Abdul Palala": "Stabilize core services and strengthen my infrastructure skills.",
  "2026-1st|Andre Uy": "Cut attrition and raise delivery predictability across the team.",
  "2025-2nd|Abdul Palala": "Deliver billing v1 and improve release confidence.",
};

// Objectives. Two categories per the OBS template:
//   organization = requested by the manager/company (max 3)
//   personal     = set by the member themselves (max 5)
// Dual assessment: self (percent + report) and manager (percent + comment).
// Self side is editable until the manager evaluates (managerPercent !== null).
const OBJECTIVES = [
  // ---- Abdul Palala (employee) ----
  {
    id: 101, title: "Improve Code Quality", owner: "Abdul Palala", ownerInitials: "AP",
    category: "organization", period: PERIOD,
    description: "Raise code quality across the platform team through reviews, tests, and fewer defects.",
    selfPercent: 80, selfReport: "Cut production bugs to 2 and held PR approval at 96%; unit coverage still climbing.",
    managerPercent: 78, managerComment: "Strong quarter. Keep pushing unit test coverage toward the 80% target.",
    evidence: [
      { src: "GitHub",  text: "Reviewed 43 pull requests; approval rate 96%" },
      { src: "Backlog", text: "Closed 12 bug tickets, 0 reopened" },
    ],
  },
  {
    id: 102, title: "Improve Delivery Reliability", owner: "Abdul Palala", ownerInitials: "AP",
    category: "organization", period: PERIOD,
    description: "Deliver committed work on schedule with fewer overdue items.",
    selfPercent: 90, selfReport: "Completed 19 of 22 assigned tasks with no overdue work; average cycle time down 15%.",
    managerPercent: null, managerComment: "",
    evidence: [
      { src: "Backlog", text: "Completed 19 of 22 assigned tasks" },
      { src: "Backlog", text: "Average completion time improved by 15%" },
    ],
  },
  {
    id: 103, title: "Mentor a Junior Engineer", owner: "Abdul Palala", ownerInitials: "AP",
    category: "personal", period: PERIOD,
    description: "Support a new team member's ramp-up through regular pairing and reviews.",
    selfPercent: 60, selfReport: "Weekly pairing sessions running; onboarding doc drafted, ramp still in progress.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  {
    id: 110, title: "Raise Unit Test Coverage to 80%", owner: "Abdul Palala", ownerInitials: "AP",
    category: "personal", period: PERIOD,
    description: "Close the gap to the 80% unit test coverage objective.",
    selfPercent: 55, selfReport: "Currently at 74%; adding suites for the auth and platform modules.",
    managerPercent: null, managerComment: "",
    evidence: [{ src: "Backlog", text: "Coverage measured at 74%" }],
  },
  // ---- Andre Uy (leader — his own objectives) ----
  {
    id: 107, title: "Grow Delivery Predictability", owner: "Andre Uy", ownerInitials: "AU",
    category: "organization", period: PERIOD,
    description: "Improve the team's on-time delivery and cut milestone slippage.",
    selfPercent: 75, selfReport: "Team on-time delivery at 88%; sprint carryover down to 12%.",
    managerPercent: null, managerComment: "",
    evidence: [{ src: "Backlog", text: "Team on-time delivery at 88%" }],
  },
  {
    id: 109, title: "Raise Engineering Quality Bar", owner: "Andre Uy", ownerInitials: "AU",
    category: "personal", period: PERIOD,
    description: "Drive quality practices across the team via faster reviews and fewer incidents.",
    selfPercent: 80, selfReport: "Median PR review turnaround under 1 day; production incidents down 23%.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  // ---- Grace Lim ----
  {
    id: 104, title: "Ship Mobile Redesign", owner: "Grace Lim", ownerInitials: "GL",
    category: "organization", period: PERIOD,
    description: "Complete and hand off the mobile app visual redesign.",
    selfPercent: 100, selfReport: "Delivered all 24 screens; design system approved by stakeholders.",
    managerPercent: 95, managerComment: "Outstanding delivery and design leadership this half.",
    evidence: [{ src: "GitHub", text: "24/24 screens handed to engineering" }],
  },
  {
    id: 111, title: "Improve Design Handoff Docs", owner: "Grace Lim", ownerInitials: "GL",
    category: "personal", period: PERIOD,
    description: "Make engineering handoff smoother with reusable documentation templates.",
    selfPercent: 70, selfReport: "Templates drafted; team adoption underway.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  // ---- John Cruz ----
  {
    id: 105, title: "Reduce Regression Escapes", owner: "John Cruz", ownerInitials: "JC",
    category: "organization", period: PERIOD,
    description: "Cut the number of regressions escaping to production.",
    selfPercent: 45, selfReport: "Still around 5 escapes per month; regression suite is a work in progress.",
    managerPercent: null, managerComment: "",
    evidence: [{ src: "Backlog", text: "5 regressions escaped last month" }],
  },
  {
    id: 112, title: "Adopt TDD on New Modules", owner: "John Cruz", ownerInitials: "JC",
    category: "personal", period: PERIOD,
    description: "Practice test-driven development on newly built modules.",
    selfPercent: 50, selfReport: "Applied TDD on 2 of 4 new modules so far.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  // ---- Maria Santos ----
  {
    id: 106, title: "Adopt New Release Process", owner: "Maria Santos", ownerInitials: "MS",
    category: "organization", period: PERIOD,
    description: "Roll out the new automated release pipeline across squads.",
    selfPercent: 20, selfReport: "Runbook drafting started; pipeline setup pending.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  {
    id: 113, title: "Cross-train on CI Pipeline", owner: "Maria Santos", ownerInitials: "MS",
    category: "personal", period: PERIOD,
    description: "Build working knowledge of the CI/CD pipeline and release tooling.",
    selfPercent: 40, selfReport: "Shadowing recent releases and learning the tooling.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  // ---- Nadia Rahman ----
  {
    id: 114, title: "Own Incident Response Rotation", owner: "Nadia Rahman", ownerInitials: "NR",
    category: "organization", period: PERIOD,
    description: "Take ownership of the on-call incident response rotation.",
    selfPercent: 30, selfReport: "Shadowing the current on-call engineer this cycle.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  {
    id: 115, title: "Improve On-call Runbooks", owner: "Nadia Rahman", ownerInitials: "NR",
    category: "personal", period: PERIOD,
    description: "Document response steps for the most common production alerts.",
    selfPercent: 25, selfReport: "Started documenting the top alerts and escalation paths.",
    managerPercent: null, managerComment: "",
    evidence: [],
  },
  // ===== Closed past half-years (read-only history) =====
  // ---- 2026 1st half ----
  {
    id: 201, title: "Stabilize Auth Service", owner: "Abdul Palala", ownerInitials: "AP",
    category: "organization", period: "2026-1st",
    description: "Reduce auth-service incidents and improve reliability.",
    selfPercent: 85, selfReport: "Cut auth incidents from 6 to 1; added health checks.",
    managerPercent: 82, managerComment: "Big reliability win. Document the runbook next cycle.",
    evidence: [],
  },
  {
    id: 202, title: "Learn Kubernetes Basics", owner: "Abdul Palala", ownerInitials: "AP",
    category: "personal", period: "2026-1st",
    description: "Build working knowledge of the container platform.",
    selfPercent: 70, selfReport: "Completed the internal K8s course; deployed a test service.",
    managerPercent: 72, managerComment: "Good foundation — apply it to a real service next.",
    evidence: [],
  },
  {
    id: 203, title: "Reduce Team Attrition", owner: "Andre Uy", ownerInitials: "AU",
    category: "organization", period: "2026-1st",
    description: "Improve retention across the engineering team.",
    selfPercent: 80, selfReport: "Zero regretted attrition; ran stay-interviews with all reports.",
    managerPercent: 85, managerComment: "Strong people leadership this half.",
    evidence: [],
  },
  // ---- 2025 2nd half ----
  {
    id: 204, title: "Ship Billing v1", owner: "Abdul Palala", ownerInitials: "AP",
    category: "organization", period: "2025-2nd",
    description: "Deliver the first version of the billing module.",
    selfPercent: 90, selfReport: "Shipped billing v1 on schedule; 2 minor post-launch fixes.",
    managerPercent: 88, managerComment: "Solid delivery under a tight deadline.",
    evidence: [],
  },
];

// Peer review requests + history.
const PEER_REVIEWS = [
  { id: 201, subject: "Maria Santos", subjectInitials: "MS", requestedBy: "Andre Uy", status: "pending",   due: "2026-07-18", anonymous: false },
  { id: 202, subject: "Kevin Reyes",  subjectInitials: "KR", requestedBy: "Andre Uy", status: "pending",   due: "2026-07-20", anonymous: true  },
  { id: 203, subject: "Lisa Tan",     subjectInitials: "LT", requestedBy: "Self",     status: "completed", due: "2026-07-05", anonymous: false, rating: 4, note: "Great attention to edge cases; could share test plans earlier." },
  { id: 204, subject: "Grace Lim",    subjectInitials: "GL", requestedBy: "Andre Uy", status: "completed", due: "2026-06-28", anonymous: true,  rating: 5, note: "Exceptional design leadership this quarter." },
];

// Manager review — AI-suggested comments waiting for accept/reject.
const MANAGER_REVIEW = {
  subject: "Abdul Palala", subjectInitials: "AP", period: "Q3 2026", aiScore: 88,
  suggestions: [
    { id: 1, text: "Consistently delivered assigned work on schedule with no overdue items.", tone: "strength" },
    { id: 2, text: "High engagement in peer reviews — 43 PRs reviewed this quarter.", tone: "strength" },
    { id: 3, text: "Documentation coverage remains below target; recommend a focus area.", tone: "improvement" },
    { id: 4, text: "Unit test coverage at 74%, short of the 80% objective.", tone: "improvement" },
  ],
};

// AI Assistant sample content.
const AI = {
  summary: "Abdul consistently delivered assigned tasks within schedule, completed 38 pull requests, actively participated in peer reviews, and demonstrated strong collaboration through frequent code reviews and mentoring activities. Overall performance this quarter is strong and trending upward.",
  progress: {
    objective: "Improve Delivery Reliability",
    estimate: 87,
    reasons: [
      "Completed 19 of 22 assigned tasks",
      "Average completion time improved by 15%",
      "No overdue work this quarter",
    ],
  },
  feedback: {
    strengths: ["Strong collaboration", "Reliable delivery", "High code review participation"],
    improvements: ["Documentation", "Test coverage", "Response time"],
  },
  reports: ["Monthly Report", "Quarterly Report", "Annual Feedback", "Self-Assessment Draft", "Manager Assessment Draft"],
  // Canned chat responses keyed by a matched keyword.
  chatSuggestions: [
    "Show John's accomplishments for Q2",
    "Why is John's delivery score lower this month?",
    "Summarize Abdul's GitHub activity",
    "Compare the last three quarters",
  ],
  chatCanned: [
    { match: ["john", "q2"], reply: "John Cruz in Q2: completed 14 of 22 tasks (64%), reviewed 11 PRs, and closed 8 bug tickets. Delivery dipped mid-quarter due to 5 escaped regressions. Strength: quick bug triage. Watch area: on-time delivery." },
    { match: ["why", "delivery"], reply: "John's delivery score is lower this month mainly because 3 tasks slipped past their target dates and 5 regressions escaped to production, increasing rework. Removing the rework, his throughput is roughly in line with last month." },
    { match: ["abdul", "github"], reply: "Abdul's GitHub activity: 38 pull requests merged, 43 PRs reviewed, 61 review comments, and a 96% PR approval rate. Most active in the platform and auth repositories." },
    { match: ["compare", "quarter"], reply: "Over the last three quarters Abdul's overall score moved 81 → 85 → 88. Delivery reliability and collaboration are trending up; documentation and test coverage remain the consistent improvement areas." },
  ],
  chatFallback: "This is a prototype AI assistant. In the full product I'd analyze objectives, GitHub, Backlog and Slack activity to answer that. Try one of the suggested questions to see a sample response.",

  // --- Employee scope: self-only. No cross-person lookups (RBAC / privacy). ---
  employeeReports: ["Self-Assessment Draft"],
  employeeChatSuggestions: [
    "Summarize my GitHub activity",
    "Explain my delivery score",
    "How am I tracking on my objective?",
    "Compare my last three quarters",
  ],
  employeeChatCanned: [
    { match: ["github"], reply: "Your GitHub activity: 38 pull requests merged, 43 PRs reviewed, 61 review comments, and a 96% PR approval rate. Most active in the platform and auth repositories." },
    { match: ["objective"], reply: "You're at ~87% on 'Improve Delivery Reliability': 19 of 22 tasks complete, average completion time down 15%, and no overdue work this quarter." },
    { match: ["track"], reply: "You're at ~87% on 'Improve Delivery Reliability': 19 of 22 tasks complete, average completion time down 15%, and no overdue work this quarter." },
    { match: ["delivery"], reply: "Your delivery score this quarter reflects 19 of 22 tasks completed on time, a 15% faster average completion, and no overdue work. It's trending upward." },
    { match: ["score"], reply: "Your delivery score this quarter reflects 19 of 22 tasks completed on time, a 15% faster average completion, and no overdue work. It's trending upward." },
    { match: ["compare", "quarter"], reply: "Over the last three quarters your overall score moved 81 → 85 → 88. Delivery reliability and collaboration are trending up; documentation and test coverage remain your improvement areas." },
  ],
  employeeChatFallback: "I can only see your own performance data in this workspace. Try asking about your objectives, delivery score, or GitHub activity.",
};

// Departments — managed in Admin/OMS (kept out of Analytics). Admin · Engineering · QA.
const DEPARTMENTS = [
  { id: 1, name: "Admin",       description: "People, HR and operations.",     lead: "Rainiel Dejito", active: true },
  { id: 2, name: "Engineering", description: "Product engineering squads.",    lead: "Andre Uy",       active: true },
  { id: 3, name: "QA",          description: "Quality assurance and testing.", lead: "Lisa Tan",       active: true },
];

// Teams — managed in Admin/OMS. Each maps to a department and holds members.
const TEAMS = [
  { id: 1, name: "Platform", department: "Engineering", lead: "Andre Uy", members: ["Abdul Palala", "Maria Santos"], active: true },
  { id: 2, name: "Web",      department: "Engineering", lead: "Andre Uy", members: ["John Cruz", "Kevin Reyes", "Grace Lim"], active: true },
  { id: 3, name: "QA Guild", department: "QA",          lead: "Lisa Tan", members: ["Lisa Tan"], active: true },
];

// Employee performance trend (last 6 months, %).
const TREND_6M = [72, 76, 74, 80, 83, 88];
const TREND_LABELS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

// Performance distribution buckets (manager view).
const DISTRIBUTION = [
  { band: "Exceeds", count: 3 },
  { band: "Meets",   count: 12 },
  { band: "Below",   count: 4 },
  { band: "At Risk", count: 2 },
];

// KPIs for the Analytics page. direction "higher" = bigger is better; "lower" = smaller is better.
// scope: employee (personal/project) | team (leader view).
const KPIS = [
  { id: 1, scope: "employee", name: "Objective Achievement", definition: "Avg achieved % across your objectives this half-year.", value: 78, unit: "%", target: 80, direction: "higher" },
  { id: 2, scope: "employee", name: "On-time Delivery", definition: "Share of tasks completed on or before their due date.", value: 88, unit: "%", target: 90, direction: "higher" },
  { id: 3, scope: "employee", name: "Peer Rating", definition: "Average rating from peer feedback.", value: 4.4, unit: "/5", target: 4.5, direction: "higher" },
  { id: 4, scope: "employee", name: "Rework Rate", definition: "Share of work sent back for fixes (lower is better).", value: 6, unit: "%", target: 5, direction: "lower" },
  { id: 5, scope: "team", name: "Team Objective Completion", definition: "Avg objective achievement across the team.", value: 78, unit: "%", target: 85, direction: "higher" },
  { id: 6, scope: "team", name: "On-time Delivery", definition: "Team-wide share of work delivered on schedule.", value: 88, unit: "%", target: 90, direction: "higher" },
  { id: 7, scope: "team", name: "Escaped Defects", definition: "Regressions reaching production per month (lower is better).", value: 5, unit: "", target: 3, direction: "lower" },
  { id: 8, scope: "team", name: "Avg Peer Rating", definition: "Average peer rating across the team.", value: 4.3, unit: "/5", target: 4.2, direction: "higher" },
];

const KPI_TRENDS = [
  { label: "Objective completion", value: "78%", delta: "+6%", up: true },
  { label: "Avg peer rating",       value: "4.3", delta: "+0.2", up: true },
  { label: "Feedback on time",   value: "91%", delta: "+3%", up: true },
  { label: "Low-performance flags", value: "6",   delta: "-2",  up: true },
];

// Received evaluations (read-only), keyed by subject name. Each has a history[]
// of previous periods (newest-first). Employee + Leader both look theirs up.
const RECEIVED_EVALUATIONS = {
  "Abdul Palala": {
    evaluator: "Andre Uy", evaluatorRole: "Engineering Leader",
    period: "Q3 2026", finalScore: 88, status: "finalized", finalizedOn: "2026-07-02",
    summary: "Overall performance is strong and trending upward this quarter.",
    strengths: ["Reliable delivery", "High PR review activity", "Strong collaboration"],
    improvements: ["Documentation coverage", "Unit test coverage"],
    comments: "Consistently delivered on schedule with no overdue items. Focus next quarter on raising test coverage to 80%.",
    history: [
      { evaluator: "Andre Uy",   period: "Q2 2026", finalScore: 85, finalizedOn: "2026-04-04", summary: "Solid quarter; delivery reliable.", strengths: ["Reliable delivery", "Good code reviews"], improvements: ["Test coverage"], comments: "Keep up the delivery consistency." },
      { evaluator: "Andre Uy",   period: "Q1 2026", finalScore: 82, finalizedOn: "2026-01-08", summary: "Steady growth this quarter.",     strengths: ["Collaboration"],                    improvements: ["Documentation", "Ownership"], comments: "Take more ownership of features end-to-end." },
      { evaluator: "Priya Nair", period: "Q4 2025", finalScore: 79, finalizedOn: "2025-10-06", summary: "Meeting expectations.",            strengths: ["Willingness to learn"],             improvements: ["Delivery speed"], comments: "Focus on reducing task cycle time." },
    ],
  },
  "Andre Uy": {
    evaluator: "Diana Cruz", evaluatorRole: "VP Engineering",
    period: "Q3 2026", finalScore: 91, status: "finalized", finalizedOn: "2026-07-03",
    summary: "Strong leadership; team delivery and morale trending up.",
    strengths: ["Team throughput +6%", "Clear objective setting", "Low attrition"],
    improvements: ["Cross-team visibility", "Succession planning"],
    comments: "Excellent quarter leading Engineering. Grow bench strength via a formal mentoring track.",
    history: [
      { evaluator: "Diana Cruz", period: "Q2 2026", finalScore: 89, finalizedOn: "2026-04-05", summary: "Consistent leadership.",   strengths: ["Delivery predictability"], improvements: ["Cross-team visibility"], comments: "Increase visibility into roadmap tradeoffs." },
      { evaluator: "Diana Cruz", period: "Q1 2026", finalScore: 87, finalizedOn: "2026-01-09", summary: "Strong start to the year.", strengths: ["Team morale"],              improvements: ["Hiring pace"],           comments: "Accelerate backfill for open reqs." },
    ],
  },
};

// Subjects a Leader can evaluate (team + peer leaders). status drives the badge.
const TEAM_EVALUATIONS = [
  { name: "Abdul Palala", initials: "AP", role: "Software Engineer", status: "in-progress", score: null },
  { name: "Maria Santos", initials: "MS", role: "Senior Engineer",   status: "not-started", score: null },
  { name: "John Cruz",    initials: "JC", role: "Software Engineer", status: "not-started", score: null },
  { name: "Grace Lim",    initials: "GL", role: "Product Designer",  status: "finalized",   score: 92 },
  { name: "Nadia Rahman", initials: "NR", role: "Product Leader",    status: "not-started", score: null, peerLeader: true },
];

// Leader-scheduled evaluations (calendar feature). Mutated in-session on schedule/remove.
const SCHEDULED_EVALUATIONS = [
  { id: 301, subject: "Maria Santos", subjectInitials: "MS", date: "2026-07-15", time: "09:00", durationMin: 30, notes: "Q3 performance feedback" },
  { id: 302, subject: "John Cruz",    subjectInitials: "JC", date: "2026-07-18", time: "14:00", durationMin: 30, notes: "Q3 performance feedback" },
];

// Mocked Google Calendar connection state (no real OAuth in the prototype).
const GOOGLE_CAL = { connected: false, account: "andre.uy@company.com" };

window.DB = {
  AVATAR_COLORS, CURRENT_USER, EMPLOYEES, OBJECTIVES, PEER_REVIEWS, MANAGER_REVIEW,
  AI, DEPARTMENTS, TREND_6M, TREND_LABELS, DISTRIBUTION, KPI_TRENDS,
  RECEIVED_EVALUATIONS, TEAM_EVALUATIONS, SCHEDULED_EVALUATIONS, GOOGLE_CAL,
  PERIOD, PERIODS, LIMITS, MISSION_STATEMENTS, KPIS, TEAMS,
};
