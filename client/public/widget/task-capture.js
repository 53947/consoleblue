/**
 * ConsoleBlue Task Capture Widget
 *
 * Add to any TriadBlue site:
 *   <script src="https://console.blue/widget/task-capture.js" data-project="hostsblue"></script>
 *
 * Right-click selected text → Create Task in ConsoleBlue
 */
(function () {
  "use strict";

  const CONSOLE_BLUE_URL =
    document.currentScript?.getAttribute("data-api") || "https://console.blue";
  const PROJECT_SLUG =
    document.currentScript?.getAttribute("data-project") || "";
  const SITE_NAME =
    document.currentScript?.getAttribute("data-site-name") ||
    window.location.hostname;

  // ── Styles ──
  const STYLES = `
    .cb-task-menu {
      position: fixed;
      z-index: 999999;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      padding: 4px;
      min-width: 220px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      animation: cb-fade-in 0.12s ease-out;
    }
    @keyframes cb-fade-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .cb-task-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 6px;
      color: #374151;
      text-align: left;
      font-size: 13px;
      line-height: 1;
    }
    .cb-task-menu-item:hover {
      background: #f3f4f6;
    }
    .cb-task-menu-item svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .cb-task-sep {
      height: 1px;
      background: #e5e7eb;
      margin: 4px 8px;
    }
    .cb-task-dialog-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: cb-fade-in 0.15s ease-out;
    }
    .cb-task-dialog {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      width: 420px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .cb-task-dialog-header {
      padding: 20px 24px 0;
    }
    .cb-task-dialog-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .cb-task-dialog-source {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 12px 24px 0;
    }
    .cb-task-dialog-source svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .cb-task-dialog-source strong {
      color: #374151;
      font-weight: 500;
    }
    .cb-task-dialog-body {
      padding: 16px 24px 24px;
    }
    .cb-task-dialog-body label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    }
    .cb-task-dialog-body input,
    .cb-task-dialog-body textarea,
    .cb-task-dialog-body select {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      color: #111827;
      background: #fff;
      box-sizing: border-box;
    }
    .cb-task-dialog-body input:focus,
    .cb-task-dialog-body textarea:focus,
    .cb-task-dialog-body select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
    }
    .cb-task-dialog-body textarea {
      min-height: 70px;
      resize: vertical;
    }
    .cb-task-field {
      margin-bottom: 12px;
    }
    .cb-task-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .cb-task-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 0 24px 20px;
    }
    .cb-task-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-family: inherit;
    }
    .cb-task-btn-ghost {
      background: none;
      color: #6b7280;
    }
    .cb-task-btn-ghost:hover {
      background: #f3f4f6;
    }
    .cb-task-btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .cb-task-btn-primary:hover {
      background: #1d4ed8;
    }
    .cb-task-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cb-task-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: #111827;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: cb-fade-in 0.15s ease-out;
    }
  `;

  // ── Icons (inline SVG) ──
  const ICON_TASK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
  const ICON_ZAP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
  const ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
  const ICON_GLOBE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';

  // ── Inject styles ──
  const styleEl = document.createElement("style");
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // ── State ──
  let menuEl = null;
  let dialogEl = null;

  function getSelectedText() {
    const sel = window.getSelection();
    return sel?.toString()?.trim() || "";
  }

  function getSourceInfo() {
    return {
      siteName: SITE_NAME,
      projectSlug: PROJECT_SLUG,
      page: window.location.pathname,
      url: window.location.href,
    };
  }

  function removeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
  }

  function removeDialog() {
    if (dialogEl) {
      dialogEl.remove();
      dialogEl = null;
    }
  }

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "cb-task-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── API Call ──
  async function createTask(data) {
    try {
      const res = await fetch(`${CONSOLE_BLUE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      showToast("Failed to create task: " + err.message);
      throw err;
    }
  }

  // ── Quick Task ──
  async function handleQuickTask(text) {
    const source = getSourceInfo();
    await createTask({
      title: text.slice(0, 500),
      description: `Source: ${source.siteName}${source.page}`,
      tags: source.projectSlug
        ? [source.projectSlug, `source:${source.url}`]
        : [`source:${source.url}`],
    });
    showToast("Task created!");
  }

  // ── Full Dialog ──
  function showDialog(text) {
    removeDialog();
    const source = getSourceInfo();

    const overlay = document.createElement("div");
    overlay.className = "cb-task-dialog-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) removeDialog();
    });

    overlay.innerHTML = `
      <div class="cb-task-dialog">
        <div class="cb-task-dialog-header">
          <h2>Create Task</h2>
        </div>
        <div class="cb-task-dialog-source">
          ${ICON_GLOBE}
          Captured from <strong>${source.siteName}${source.page}</strong>
        </div>
        <form class="cb-task-dialog-body" id="cb-task-form">
          <div class="cb-task-field">
            <label for="cb-title">Title</label>
            <input id="cb-title" type="text" required value="${text.slice(0, 500).replace(/"/g, "&quot;")}" />
          </div>
          <div class="cb-task-field">
            <label for="cb-desc">Description</label>
            <textarea id="cb-desc">${text.replace(/</g, "&lt;")}</textarea>
          </div>
          <div class="cb-task-row">
            <div class="cb-task-field">
              <label for="cb-priority">Priority</label>
              <select id="cb-priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="cb-task-field">
              <label for="cb-status">Status</label>
              <select id="cb-status">
                <option value="backlog">Backlog</option>
                <option value="todo" selected>To Do</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>
        </form>
        <div class="cb-task-dialog-footer">
          <button type="button" class="cb-task-btn cb-task-btn-ghost" id="cb-cancel">Cancel</button>
          <button type="submit" form="cb-task-form" class="cb-task-btn cb-task-btn-primary" id="cb-submit">Create Task</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    dialogEl = overlay;

    // Focus title
    const titleInput = overlay.querySelector("#cb-title");
    if (titleInput) titleInput.focus();

    overlay.querySelector("#cb-cancel").addEventListener("click", removeDialog);

    overlay.querySelector("#cb-task-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = overlay.querySelector("#cb-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";

      const title = overlay.querySelector("#cb-title").value.trim();
      const desc = overlay.querySelector("#cb-desc").value.trim();
      const priority = overlay.querySelector("#cb-priority").value;
      const status = overlay.querySelector("#cb-status").value;

      let fullDesc = desc;
      if (fullDesc) {
        fullDesc += `\n\n---\nSource: ${source.siteName}${source.page}`;
      } else {
        fullDesc = `Source: ${source.siteName}${source.page}`;
      }

      try {
        await createTask({
          title,
          description: fullDesc,
          priority,
          status,
          tags: source.projectSlug
            ? [source.projectSlug, `source:${source.url}`]
            : [`source:${source.url}`],
        });
        showToast("Task created!");
        removeDialog();
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Task";
      }
    });

    // Close on Escape
    function handleKey(e) {
      if (e.key === "Escape") {
        removeDialog();
        document.removeEventListener("keydown", handleKey);
      }
    }
    document.addEventListener("keydown", handleKey);
  }

  // ── Context Menu ──
  function showMenu(x, y, text) {
    removeMenu();

    const menu = document.createElement("div");
    menu.className = "cb-task-menu";

    // Position: keep in viewport
    menu.style.left = Math.min(x, window.innerWidth - 240) + "px";
    menu.style.top = Math.min(y, window.innerHeight - 160) + "px";

    const hasText = !!text;

    menu.innerHTML = `
      <button class="cb-task-menu-item" data-action="create" ${!hasText ? "style='opacity:0.4;pointer-events:none'" : ""}>
        ${ICON_TASK}
        Create Task from Selection
      </button>
      <button class="cb-task-menu-item" data-action="quick" ${!hasText ? "style='opacity:0.4;pointer-events:none'" : ""}>
        ${ICON_ZAP}
        Quick Task
      </button>
      <div class="cb-task-sep"></div>
      <button class="cb-task-menu-item" data-action="copy" ${!hasText ? "style='opacity:0.4;pointer-events:none'" : ""}>
        ${ICON_COPY}
        Copy
      </button>
    `;

    document.body.appendChild(menu);
    menuEl = menu;

    menu.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      removeMenu();

      if (action === "create") {
        showDialog(text);
      } else if (action === "quick") {
        await handleQuickTask(text);
      } else if (action === "copy") {
        if (text) navigator.clipboard.writeText(text);
      }
    });
  }

  // ── Event Listeners ──
  document.addEventListener("contextmenu", (e) => {
    const text = getSelectedText();
    // Only show custom menu if text is selected
    if (!text) return;

    e.preventDefault();
    showMenu(e.clientX, e.clientY, text);
  });

  document.addEventListener("click", () => {
    removeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") removeMenu();
  });

  console.log(
    `[ConsoleBlue] Task capture widget loaded for ${SITE_NAME} (project: ${PROJECT_SLUG || "none"})`,
  );
})();
