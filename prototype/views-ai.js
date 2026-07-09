/* Titan prototype — AI Assistant view. Summary, feedback, progress, reports, mock chat. */
window.Views = window.Views || {};
window.ViewsWire = window.ViewsWire || {};

window.Views.ai = function (role) {
  const ai = DB.AI;
  const isLeader = role === "leader";

  // Employees get a self-only assistant; leaders get the full cross-team toolkit.
  const reportList = isLeader ? ai.reports : ai.employeeReports;
  const suggestList = isLeader ? ai.chatSuggestions : ai.employeeChatSuggestions;
  const feedbackTitle = isLeader ? "✦ AI Suggested Feedback" : "✦ Your Strengths &amp; Focus Areas";
  const greeting = isLeader
    ? "Hi! I'm your Titan AI assistant. Ask me about your team's performance, objectives, or activity. Try a suggestion below."
    : "Hi! I'm your Titan AI assistant. I can answer questions about your own performance and objectives. Try a suggestion below.";
  const scopeHint = isLeader ? "" : `<span class="hint">Scoped to your own data</span>`;

  const strengths = ai.feedback.strengths.map((s) => `<li><span class="ck">✓</span> ${UI.esc(s)}</li>`).join("");
  const improvements = ai.feedback.improvements.map((s) => `<li><span class="ck off">○</span> ${UI.esc(s)}</li>`).join("");
  const reasons = ai.progress.reasons.map((r) => `<li><span class="ck">✓</span> ${UI.esc(r)}</li>`).join("");
  const reports = reportList.map((r) => `<button class="btn sm" data-report="${UI.esc(r)}">${UI.esc(r)}</button>`).join(" ");
  const suggests = suggestList.map((q) => `<span class="tag" data-ask="${UI.esc(q)}">${UI.esc(q)}</span>`).join("");

  return `
    <div class="grid grid-2">
      <div class="stack">
        <div class="card ai-narrative">
          <div class="ai-tag">✦ AI Performance Summary</div>
          <p style="margin:8px 0 0">${UI.esc(ai.summary)}</p>
        </div>

        <div class="card">
          <div class="card-title">✦ AI Objective Progress <span class="hint">${UI.esc(ai.progress.objective)}</span></div>
          <div class="row" style="gap:16px;align-items:flex-start">
            <div style="text-align:center">
              <div class="stat-value" style="color:var(--accent)">${ai.progress.estimate}%</div>
              <div class="small muted">Estimated</div>
            </div>
            <ul class="check-list" style="flex:1">${reasons}</ul>
          </div>
        </div>

        <div class="card">
          <div class="card-title">${feedbackTitle}</div>
          <div class="fb-cols">
            <div><h4>Strengths</h4><ul class="check-list">${strengths}</ul></div>
            <div><h4>Improvement Areas</h4><ul class="check-list">${improvements}</ul></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">✦ AI Report Generation</div>
          <div class="row" style="flex-wrap:wrap;gap:8px">${reports}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">✦ AI Chat Assistant ${scopeHint}</div>
        <div class="chat">
          <div class="chat-log" id="chat-log">
            <div class="msg bot">${UI.esc(greeting)}</div>
          </div>
          <div class="chat-suggests" id="chat-suggests">${suggests}</div>
          <div class="chat-input">
            <input type="text" id="chat-input" placeholder="Ask something…" />
            <button class="btn primary" id="chat-send">Send</button>
          </div>
        </div>
      </div>
    </div>`;
};

window.ViewsWire.ai = function (role) {
  const isLeader = role === "leader";
  // Match answers against the role-appropriate canned set (employees never see others' data).
  const canned = isLeader ? DB.AI.chatCanned : DB.AI.employeeChatCanned;
  const fallback = isLeader ? DB.AI.chatFallback : DB.AI.employeeChatFallback;

  const log = document.getElementById("chat-log");
  const input = document.getElementById("chat-input");

  function push(text, who) {
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function answer(q) {
    const lc = q.toLowerCase();
    const hit = canned.find((c) => c.match.every((m) => lc.includes(m)))
             || canned.find((c) => c.match.some((m) => lc.includes(m)));
    return hit ? hit.reply : fallback;
  }

  function send(q) {
    const text = (q || input.value).trim();
    if (!text) return;
    push(text, "user");
    input.value = "";
    setTimeout(() => push(answer(text), "bot"), 350); // fake "thinking" delay
  }

  document.getElementById("chat-send").addEventListener("click", () => send());
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  document.getElementById("chat-suggests").addEventListener("click", (e) => {
    const t = e.target.closest("[data-ask]");
    if (t) send(t.dataset.ask);
  });
  document.querySelectorAll("[data-report]").forEach((b) =>
    b.addEventListener("click", () => {
      Modal.open(`
        <div class="modal-head"><h3>${UI.esc(b.dataset.report)}</h3><button class="close" data-close>×</button></div>
        <div class="card ai-narrative" style="box-shadow:none">
          <div class="ai-tag">✦ Generated draft</div>
          <p style="margin:8px 0 0">${UI.esc(DB.AI.summary)}</p>
        </div>
        <div class="small muted" style="margin-top:12px">Prototype: report generation is mocked. The full product exports PDF / Excel / CSV.</div>
        <div class="modal-foot"><button class="btn" data-close>Close</button><button class="btn primary" data-close>Export PDF</button></div>`);
    }));
};
