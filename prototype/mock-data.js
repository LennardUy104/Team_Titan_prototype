/* Titan prototype — all dummy data lives here. No backend. */
/* Exposed as window.DB and consumed by the view modules. */

const AVATAR_COLORS = ["#6c5ce7", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#14b8a6"];

// The fake logged-in user per role (drives the top-bar chip + perspective).
const CURRENT_USER = {
  employee: { name: "Abdul Palala", initials: "AP", title: "Software Engineer" },
  leader:   { name: "Andre Uy",    initials: "AU", title: "Engineering Leader" },
};

// Team roster reused across every module.
const EMPLOYEES = [
  { id: 1, name: "Abdul Palala",  initials: "AP", role: "Software Engineer", dept: "Engineering", score: 88, trend: "up",   status: "on-track" },
  { id: 2, name: "Maria Santos",  initials: "MS", role: "Senior Engineer",   dept: "Engineering", score: 92, trend: "up",   status: "on-track" },
  { id: 3, name: "John Cruz",     initials: "JC", role: "Software Engineer", dept: "Engineering", score: 64, trend: "down", status: "at-risk"  },
  { id: 4, name: "Lisa Tan",      initials: "LT", role: "QA Engineer",       dept: "Quality",     score: 79, trend: "up",   status: "on-track" },
  { id: 5, name: "Kevin Reyes",   initials: "KR", role: "Software Engineer", dept: "Engineering", score: 71, trend: "flat", status: "on-track" },
  { id: 6, name: "Grace Lim",     initials: "GL", role: "Product Designer",  dept: "Design",      score: 85, trend: "up",   status: "on-track" },
  { id: 7, name: "Rainiel Dejito",initials: "RD", role: "HR Partner",        dept: "People",      score: 90, trend: "flat", status: "on-track" },
  { id: 8, name: "Andre Uy",      initials: "AU", role: "Eng. Manager",      dept: "Engineering", score: 87, trend: "up",   status: "on-track" },
];

// Objectives (the heart of the app). status: on-track | at-risk | completed | draft
const OBJECTIVES = [
  {
    id: 101, title: "Improve Code Quality", owner: "Abdul Palala", ownerInitials: "AP",
    weight: 30, progress: 74, status: "on-track", target: "2026-09-30", period: "Q3 2026",
    description: "Raise overall code quality across the platform team through reviews, tests and reduced defects.",
    criteria: [
      { text: "Less than 3 production bugs", done: true },
      { text: "PR approval rate > 95%", done: true },
      { text: "Unit test coverage > 80%", done: false },
    ],
    evidence: [
      { src: "GitHub",  text: "Reviewed 43 pull requests this quarter" },
      { src: "GitHub",  text: "PR approval rate at 96%" },
      { src: "Backlog", text: "Closed 12 bug tickets, 0 reopened" },
    ],
  },
  {
    id: 102, title: "Improve Delivery Reliability", owner: "Abdul Palala", ownerInitials: "AP",
    weight: 25, progress: 87, status: "on-track", target: "2026-09-30", period: "Q3 2026",
    description: "Deliver committed work on schedule with fewer overdue items.",
    criteria: [
      { text: "Complete 20+ assigned tasks", done: true },
      { text: "Zero overdue work items", done: true },
      { text: "Avg completion time improved 10%", done: false },
    ],
    evidence: [
      { src: "Backlog", text: "Completed 19 of 22 assigned tasks" },
      { src: "Backlog", text: "Average completion time improved by 15%" },
      { src: "Backlog", text: "No overdue work this quarter" },
    ],
  },
  {
    id: 103, title: "Strengthen Team Collaboration", owner: "Abdul Palala", ownerInitials: "AP",
    weight: 20, progress: 68, status: "at-risk", target: "2026-09-15", period: "Q3 2026",
    description: "Actively support the team through reviews, planning and mentoring.",
    criteria: [
      { text: "Participate in all sprint plannings", done: true },
      { text: "Mentor 1 junior engineer", done: false },
      { text: "5+ peer recognitions", done: true },
    ],
    evidence: [
      { src: "Slack",   text: "Received 5 peer recognitions" },
      { src: "Backlog", text: "Participated in 17 planning meetings" },
      { src: "GitHub",  text: "Left 61 review comments across the team" },
    ],
  },
  {
    id: 104, title: "Ship Mobile Redesign", owner: "Grace Lim", ownerInitials: "GL",
    weight: 40, progress: 100, status: "completed", target: "2026-06-30", period: "Q2 2026",
    description: "Complete and hand off the mobile app visual redesign.",
    criteria: [
      { text: "Finalize design system", done: true },
      { text: "Deliver all 24 screens", done: true },
    ],
    evidence: [
      { src: "Slack",  text: "Design system approved by stakeholders" },
      { src: "GitHub", text: "24/24 screens handed to engineering" },
    ],
  },
  {
    id: 105, title: "Reduce Regression Escapes", owner: "John Cruz", ownerInitials: "JC",
    weight: 35, progress: 41, status: "at-risk", target: "2026-09-30", period: "Q3 2026",
    description: "Cut the number of regressions escaping to production.",
    criteria: [
      { text: "Add regression suite", done: false },
      { text: "< 2 escaped regressions / month", done: false },
    ],
    evidence: [
      { src: "Backlog", text: "5 regressions escaped last month" },
    ],
  },
  {
    id: 106, title: "Adopt New Release Process", owner: "Maria Santos", ownerInitials: "MS",
    weight: 15, progress: 0, status: "draft", target: "2026-12-31", period: "Q4 2026",
    description: "Roll out the new automated release pipeline across squads.",
    criteria: [
      { text: "Document release runbook", done: false },
      { text: "Train all squad leads", done: false },
    ],
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
  reports: ["Monthly Report", "Quarterly Report", "Annual Evaluation", "Self-Assessment Draft", "Manager Assessment Draft"],
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

// HR / analytics aggregates.
const DEPARTMENTS = [
  { name: "Engineering", score: 84, headcount: 22, completion: 78 },
  { name: "Design",      score: 86, headcount: 6,  completion: 82 },
  { name: "Quality",     score: 80, headcount: 5,  completion: 74 },
  { name: "People",      score: 89, headcount: 4,  completion: 91 },
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

const KPI_TRENDS = [
  { label: "Objective completion", value: "78%", delta: "+6%", up: true },
  { label: "Avg peer rating",       value: "4.3", delta: "+0.2", up: true },
  { label: "Evaluations on time",   value: "91%", delta: "+3%", up: true },
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
  { id: 301, subject: "Maria Santos", subjectInitials: "MS", date: "2026-07-15", time: "09:00", durationMin: 30, notes: "Q3 performance evaluation" },
  { id: 302, subject: "John Cruz",    subjectInitials: "JC", date: "2026-07-18", time: "14:00", durationMin: 30, notes: "Q3 performance evaluation" },
];

// Mocked Google Calendar connection state (no real OAuth in the prototype).
const GOOGLE_CAL = { connected: false, account: "andre.uy@company.com" };

window.DB = {
  AVATAR_COLORS, CURRENT_USER, EMPLOYEES, OBJECTIVES, PEER_REVIEWS, MANAGER_REVIEW,
  AI, DEPARTMENTS, TREND_6M, TREND_LABELS, DISTRIBUTION, KPI_TRENDS,
  RECEIVED_EVALUATIONS, TEAM_EVALUATIONS, SCHEDULED_EVALUATIONS, GOOGLE_CAL,
};
