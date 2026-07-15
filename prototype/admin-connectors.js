/* Titan prototype — Admin / OMS › Connectors.
   MCP (Model Context Protocol) connectors link third-party apps so OMS can pull
   evidence and activity automatically — the same sources objective evidence is
   auto-collected from (GitHub · Backlog · Slack). Leader-only (Admin is gated).
   Card grid + configure/add modals; connect/disconnect toggles status. In-memory.
   Exposed as window.AdminConnectors; rendered/wired from views-admin.js.
   Relies on globals: DB, UI, Modal, toastAdmin. */
(function () {
  const isOn = (c) => c.status === "connected";

  function card(c) {
    const on = isOn(c);
    const tools = c.tools.length
      ? c.tools.map((t) => `<span class="tag">${UI.esc(t)}</span>`).join(" ")
      : `<span class="small muted">no tools</span>`;
    return `<div class="card">
      <div class="spread" style="align-items:flex-start">
        <div><strong>${UI.esc(c.name)}</strong> <span class="tag">${UI.esc(c.category)}</span>
          <div class="small muted" style="margin-top:3px;font-family:monospace;word-break:break-all">${UI.esc(c.mcpUrl)}</div>
        </div>
        <span class="badge ${on ? "green" : "gray"}">${on ? "Connected" : "Disconnected"}</span>
      </div>
      <div style="margin:10px 0 6px;display:flex;flex-wrap:wrap;gap:4px">${tools}</div>
      <div class="small muted">${on ? `Synced ${UI.esc(c.lastSync)}` : "Not connected"}</div>
      <div class="row" style="gap:8px;margin-top:12px">
        <button class="btn sm" data-conn-config="${UI.esc(c.id)}">Configure</button>
        <button class="btn sm ${on ? "danger" : "primary"}" data-conn-toggle="${UI.esc(c.id)}">${on ? "Disconnect" : "Connect"}</button>
      </div>
    </div>`;
  }

  function render() {
    const list = DB.CONNECTORS;
    const connected = list.filter(isOn).length;
    const cards = list.length
      ? list.map(card).join("")
      : `<div class="empty">No connectors yet — add one to link a third-party app.</div>`;
    return `
      <div class="section-head">
        <div><h2 class="mb-0">Connectors</h2><div class="small muted">${list.length} MCP connector${list.length === 1 ? "" : "s"} · ${connected} connected</div></div>
        <button class="btn primary" id="conn-add">+ Add connector</button>
      </div>
      <div class="small muted" style="margin:-6px 0 12px">Model Context Protocol (MCP) connectors link third-party apps so OMS can pull evidence and activity automatically.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">${cards}</div>`;
  }

  function wire(rerender) {
    const add = document.getElementById("conn-add");
    if (add) add.addEventListener("click", () => openConfig(null, rerender));
    document.querySelectorAll("[data-conn-config]").forEach((b) =>
      b.addEventListener("click", () => openConfig(b.dataset.connConfig, rerender)));
    document.querySelectorAll("[data-conn-toggle]").forEach((b) =>
      b.addEventListener("click", () => {
        const c = DB.CONNECTORS.find((x) => x.id === b.dataset.connToggle);
        if (!c) return;
        c.status = isOn(c) ? "disconnected" : "connected";
        if (isOn(c)) c.lastSync = "just now";
        rerender(); toastAdmin(`${c.name} ${isOn(c) ? "connected" : "disconnected"}.`);
      }));
  }

  // id === null → add a new (custom) connector; otherwise configure an existing one.
  function openConfig(id, rerender) {
    const c = id ? DB.CONNECTORS.find((x) => x.id === id) : { name: "", category: "Custom", mcpUrl: "", token: "", tools: [], status: "disconnected" };
    if (id && !c) return;
    Modal.open(`
      <div class="modal-head"><h3>${id ? "Configure" : "Add"} connector</h3><button class="close" data-close>×</button></div>
      <div class="grid grid-2">
        <div class="field"><label>Name</label><input type="text" id="conn-name" value="${UI.esc(c.name)}" placeholder="e.g. GitHub" ${id ? "disabled" : ""} /></div>
        <div class="field"><label>Category</label><input type="text" id="conn-cat" value="${UI.esc(c.category)}" placeholder="Code / Project / Comms" /></div>
      </div>
      <div class="field"><label>MCP server URL</label><input type="text" id="conn-url" value="${UI.esc(c.mcpUrl)}" placeholder="mcp://host" /></div>
      <div class="field"><label>Auth token</label><input type="password" id="conn-token" value="${UI.esc(c.token)}" placeholder="••••••••" autocomplete="off" /></div>
      <div class="field"><label>Tools / scopes <span class="hint">comma-separated</span></label><input type="text" id="conn-tools" value="${UI.esc(c.tools.join(", "))}" placeholder="issues, tasks" /></div>
      <label style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label);cursor:pointer"><input type="checkbox" id="conn-enabled" style="width:auto" ${isOn(c) ? "checked" : ""} /> Enable (connect) this connector</label>
      <div class="small" id="conn-msg" style="color:var(--red);margin-top:6px"></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" id="conn-save">${id ? "Save" : "Add"}</button></div>`);

    document.getElementById("conn-save").addEventListener("click", () => {
      const msg = (t) => { document.getElementById("conn-msg").textContent = t; };
      const name = document.getElementById("conn-name").value.trim();
      const url = document.getElementById("conn-url").value.trim();
      if (!name) { msg("Give the connector a name."); return; }
      if (!url) { msg("Enter the MCP server URL."); return; }
      const cat = document.getElementById("conn-cat").value.trim() || "Custom";
      const token = document.getElementById("conn-token").value;
      const tools = document.getElementById("conn-tools").value.split(",").map((s) => s.trim()).filter(Boolean);
      const enabled = document.getElementById("conn-enabled").checked;
      if (id) {
        c.category = cat; c.mcpUrl = url; c.token = token; c.tools = tools;
        c.status = enabled ? "connected" : "disconnected";
        if (enabled) c.lastSync = "just now";
      } else {
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "connector";
        const uid = DB.CONNECTORS.some((x) => x.id === base) ? `${base}-${DB.CONNECTORS.length + 1}` : base;
        DB.CONNECTORS.push({ id: uid, name, category: cat, mcpUrl: url, token, tools, status: enabled ? "connected" : "disconnected", lastSync: enabled ? "just now" : "—" });
      }
      Modal.close(); rerender(); toastAdmin(`Connector “${name}” ${id ? "updated" : "added"}.`);
    });
  }

  window.AdminConnectors = { render, wire };
})();
