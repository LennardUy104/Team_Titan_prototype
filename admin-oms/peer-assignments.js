/* Titan prototype — peer-review assignment engine.
   Peer reviews are project-driven: when an evaluation cycle begins, assignments
   are generated automatically from project membership (no manual requests).
   Rules honored here:
     - Membership is read from PROJECT_MEMBERSHIP_HISTORY, not just current teams,
       so an employee who transferred mid-cycle is reviewed in BOTH projects.
     - Recently-joined members are NOT excluded; there is no minimum tenure.
     - Inactive directory users are skipped when pairing.
   Exposed as window.PeerAssign. Loaded after mock-data.js, before views. */
(function () {
  const cycleById = (id) => DB.EVAL_CYCLES.find((c) => c.id === id);
  const empByName = (name) => DB.EMPLOYEES.find((u) => u.name === name);
  const projById = (id) => DB.PROJECTS.find((p) => p.id === id);

  // Active members of a project whose membership overlaps the cycle window.
  // Overlap: joined on/before the window end AND (still a member OR left on/after
  // the window start). ISO date strings compare correctly with < / >.
  function membersDuringCycle(projectId, cycleId) {
    const cyc = cycleById(cycleId);
    if (!cyc) return [];
    const names = DB.PROJECT_MEMBERSHIP_HISTORY
      .filter((h) => h.projectId === projectId
        && h.from <= cyc.windowEnd
        && (h.to === null || h.to >= cyc.windowStart))
      .map((h) => h.employee);
    // de-dup + keep only active directory users
    return [...new Set(names)].filter((n) => { const e = empByName(n); return e && e.active; });
  }

  function nextId() {
    return DB.PEER_REVIEWS.reduce((m, x) => Math.max(m, x.id), 300) + 1;
  }

  function exists(reviewer, subject, cycleId) {
    return DB.PEER_REVIEWS.some((r) => r.reviewer === reviewer && r.subject === subject && r.cycleId === cycleId);
  }

  // Generate all-pairs assignments per project for a cycle. Idempotent: an
  // existing (reviewer, subject, cycle) triple is skipped, so re-running only
  // adds missing pairs and a pair shared across two projects is created once.
  function generate(cycleId) {
    const cyc = cycleById(cycleId);
    if (!cyc) return { added: 0, skipped: 0 };
    let added = 0, skipped = 0;
    DB.PROJECTS.filter((p) => p.active).forEach((p) => {
      const members = membersDuringCycle(p.id, cycleId);
      members.forEach((reviewer) => members.forEach((subject) => {
        if (reviewer === subject) return;
        if (exists(reviewer, subject, cycleId)) { skipped++; return; }
        const rev = empByName(reviewer) || {}, subj = empByName(subject) || {};
        DB.PEER_REVIEWS.push({
          id: nextId(),
          subject, subjectInitials: subj.initials || "?",
          reviewer, reviewerInitials: rev.initials || "?",
          projectId: p.id, projectName: p.name,
          cycleId, status: "pending", due: cyc.due,
          anonymous: true, rating: null, scores: [],
        });
        added++;
      }));
    });
    return { added, skipped };
  }

  function remove(id) {
    DB.PEER_REVIEWS = DB.PEER_REVIEWS.filter((r) => r.id !== id);
  }

  // Assignments for the projects a given leader leads, scoped to one cycle when
  // cycleId is given (peer review repeats every 6 months — keep cycles separate).
  function assignmentsForLeader(name, cycleId) {
    const mine = DB.PROJECTS.filter((p) => p.lead === name).map((p) => p.id);
    return DB.PEER_REVIEWS.filter((r) => mine.includes(r.projectId) && (!cycleId || r.cycleId === cycleId));
  }

  function currentCycle() { return cycleById(DB.CURRENT_CYCLE); }

  // Seed the initial cycle once, then mark a representative subset completed so
  // "About Me" and the completed lists aren't empty in the demo.
  function seedInitial() {
    if (DB.PEER_REVIEWS.length) return;
    generate(DB.CURRENT_CYCLE);
    const S = DB.PEER_REVIEW_TEMPLATE.criteria.map((c) => c.label);
    const mk = (vals) => S.map((label, i) => ({ label, rating: vals[i] }));
    const complete = (reviewer, subject, vals) => {
      const r = DB.PEER_REVIEWS.find((x) => x.reviewer === reviewer && x.subject === subject && x.status === "pending");
      if (!r) return;
      r.scores = mk(vals);
      r.rating = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      r.status = "completed";
    };
    // Feedback about Abdul (the demo employee's "About Me")
    complete("Maria Santos", "Abdul Palala", [5, 5, 5, 5, 4]);
    complete("Grace Lim", "Abdul Palala", [4, 5, 4, 4, 3]);
    complete("John Cruz", "Abdul Palala", [4, 4, 5, 4, 4]);
    // One Abdul already finished (his "To Review" shows a completed one too)
    complete("Abdul Palala", "Maria Santos", [5, 4, 5, 5, 4]);
    // Cross-project completion (John↔Lisa on Apollo)
    complete("Lisa Tan", "John Cruz", [3, 4, 4, 3, 4]);
  }

  window.PeerAssign = { membersDuringCycle, generate, remove, assignmentsForLeader, currentCycle, seedInitial };
  seedInitial();
})();
