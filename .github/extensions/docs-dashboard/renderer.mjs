function escapeScriptValue(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function renderDashboardHtml(instanceId) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="data:,">
  <title>Repository docs</title>
  <style>
    :root {
      --canvas-bg: var(--background-color-default, #f6f8fa);
      --surface: var(--background-color-default, #ffffff);
      --surface-subtle: var(--n-1, #f6f8fa);
      --surface-muted: var(--n-2, #eff2f5);
      --border: var(--border-color-default, #d0d7de);
      --border-muted: color-mix(in srgb, var(--border) 68%, transparent);
      --text: var(--text-color-default, #1f2328);
      --muted: var(--text-color-muted, #656d76);
      --accent: var(--true-color-blue, #0969da);
      --accent-muted: var(--true-color-blue-muted, #ddf4ff);
      --success: var(--true-color-green, #1a7f37);
      --attention: var(--true-color-yellow, #9a6700);
      --danger: var(--true-color-red, #cf222e);
      --shadow: 0 8px 24px rgba(140, 149, 159, 0.16);
      --radius: 8px;
    }

    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background: var(--canvas-bg);
      color: var(--text);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px);
      line-height: var(--leading-body-medium, 1.5);
    }
    button, input { font: inherit; }
    button { color: inherit; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    :focus-visible { outline: 2px solid var(--color-focus-outline, #0969da); outline-offset: 2px; }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      backdrop-filter: blur(12px);
    }
    .brand, .header-actions, .meta-row, .viewer-actions, .filter-row {
      display: flex;
      align-items: center;
    }
    .brand { gap: 10px; font-weight: var(--font-weight-semibold, 600); }
    .brand svg { width: 24px; height: 24px; fill: currentColor; }
    .repo-slash { color: var(--muted); font-weight: 400; }
    .header-actions { gap: 8px; }
    .instance-pill {
      max-width: 160px;
      overflow: hidden;
      color: var(--muted);
      font-family: var(--font-mono, "SFMono-Regular", Consolas, monospace);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 32px;
      padding: 5px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface-subtle);
      box-shadow: 0 1px 0 color-mix(in srgb, var(--border) 38%, transparent);
      cursor: pointer;
      font-weight: var(--font-weight-semibold, 600);
    }
    .button:hover { background: var(--surface-muted); text-decoration: none; }
    .button svg { width: 16px; height: 16px; fill: currentColor; }
    .button.icon-only { width: 32px; padding: 0; }

    .dashboard { max-width: 1440px; margin: 0 auto; padding: 40px 32px 64px; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 32px;
      align-items: end;
      margin-bottom: 28px;
    }
    .eyebrow {
      margin: 0 0 6px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-family: var(--font-sans-display, var(--font-sans, sans-serif));
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1.12;
      letter-spacing: -.02em;
    }
    .hero-copy { max-width: 720px; margin: 10px 0 0; color: var(--muted); font-size: 16px; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(92px, 1fr)); gap: 8px; }
    .stat {
      min-width: 96px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
    }
    .stat-value { display: block; font-size: 20px; font-weight: 700; line-height: 1.2; }
    .stat-label { color: var(--muted); font-size: 12px; }

    .toolbar {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      gap: 16px;
      align-items: center;
      margin-bottom: 20px;
    }
    .search-wrap { position: relative; }
    .search-wrap svg {
      position: absolute;
      top: 50%;
      left: 12px;
      width: 16px;
      height: 16px;
      color: var(--muted);
      fill: currentColor;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .search {
      width: 100%;
      height: 38px;
      padding: 7px 12px 7px 38px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      box-shadow: inset 0 1px 0 rgba(208, 215, 222, .2);
    }
    .search::placeholder { color: var(--muted); }
    .filter-row { flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .filter {
      padding: 5px 10px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      white-space: nowrap;
    }
    .filter:hover { background: var(--surface-muted); color: var(--text); }
    .filter.active { border-color: var(--border); background: var(--surface); color: var(--text); font-weight: 600; }

    .results-meta { margin: 0 0 12px; color: var(--muted); font-size: 12px; }
    .document-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .document-card {
      position: relative;
      display: flex;
      min-height: 230px;
      flex-direction: column;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      cursor: pointer;
      text-align: left;
      transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }
    .document-card:hover {
      border-color: color-mix(in srgb, var(--accent) 56%, var(--border));
      box-shadow: var(--shadow);
      transform: translateY(-2px);
    }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .file-icon {
      display: grid;
      width: 34px;
      height: 34px;
      place-items: center;
      border-radius: 7px;
      background: var(--accent-muted);
      color: var(--accent);
    }
    .file-icon.html { background: color-mix(in srgb, var(--attention) 13%, transparent); color: var(--attention); }
    .file-icon svg { width: 18px; height: 18px; fill: currentColor; }
    .type-badge, .category-badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 2px 8px;
      border: 1px solid var(--border-muted);
      border-radius: 999px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 600;
    }
    .card-title {
      margin: 16px 0 6px;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.35;
    }
    .card-description {
      display: -webkit-box;
      min-height: 42px;
      margin: 0;
      overflow: hidden;
      color: var(--muted);
      font-size: 13px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .meta-row { gap: 10px; margin-top: auto; padding-top: 16px; color: var(--muted); font-size: 11px; }
    .meta-row span { display: inline-flex; align-items: center; gap: 4px; }
    .meta-row svg { width: 13px; height: 13px; fill: currentColor; }
    .category-badge { margin-left: auto; max-width: 128px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty {
      grid-column: 1 / -1;
      padding: 64px 24px;
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      color: var(--muted);
      text-align: center;
    }
    .empty strong { display: block; margin-bottom: 4px; color: var(--text); font-size: 16px; }

    .viewer { display: none; height: calc(100vh - 56px); min-height: 500px; }
    body.viewer-open .dashboard { display: none; }
    body.viewer-open .viewer { display: grid; grid-template-columns: 320px minmax(0, 1fr); }
    .viewer-sidebar {
      min-width: 0;
      overflow: hidden;
      border-right: 1px solid var(--border);
      background: var(--surface);
    }
    .viewer-sidebar-head { padding: 16px; border-bottom: 1px solid var(--border); }
    .viewer-sidebar-head .search { height: 34px; }
    .back-button { width: 100%; margin-bottom: 12px; justify-content: flex-start; background: transparent; box-shadow: none; }
    .viewer-list { height: calc(100% - 100px); overflow-y: auto; padding: 8px; }
    .viewer-list-item {
      display: block;
      width: 100%;
      padding: 10px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      text-align: left;
    }
    .viewer-list-item:hover { background: var(--surface-subtle); }
    .viewer-list-item.active { background: var(--accent-muted); color: var(--accent); }
    .viewer-list-title { display: block; overflow: hidden; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .viewer-list-path { display: block; overflow: hidden; margin-top: 2px; color: var(--muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .viewer-main { min-width: 0; overflow-y: auto; background: var(--surface); }
    .viewer-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      min-height: 68px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 96%, transparent);
      backdrop-filter: blur(10px);
    }
    .viewer-title-wrap { min-width: 0; }
    .viewer-title { margin: 0; overflow: hidden; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
    .viewer-path {
      display: block;
      overflow: hidden;
      margin-top: 2px;
      color: var(--muted);
      font-family: var(--font-mono, "SFMono-Regular", Consolas, monospace);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .viewer-actions { flex: 0 0 auto; gap: 8px; }
    .article-wrap { max-width: 1060px; margin: 0 auto; padding: 40px 56px 80px; }
    .document-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-muted);
    }
    .html-frame { width: 100%; height: calc(100vh - 126px); border: 0; background: #fff; }
    .loading { display: grid; min-height: 320px; place-items: center; color: var(--muted); }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .markdown-body { color: var(--text); font-size: 16px; line-height: 1.65; word-wrap: break-word; }
    .markdown-body > :first-child { margin-top: 0 !important; }
    .markdown-body > :last-child { margin-bottom: 0 !important; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .markdown-body h1, .markdown-body h2 { padding-bottom: .3em; border-bottom: 1px solid var(--border-muted); }
    .markdown-body h1 { font-size: 2em; }
    .markdown-body h2 { font-size: 1.5em; }
    .markdown-body h3 { font-size: 1.25em; }
    .markdown-body h4 { font-size: 1em; }
    .markdown-body p, .markdown-body blockquote, .markdown-body ul, .markdown-body ol, .markdown-body table, .markdown-body pre { margin-top: 0; margin-bottom: 16px; }
    .markdown-body ul, .markdown-body ol { padding-left: 2em; }
    .markdown-body li + li { margin-top: .25em; }
    .markdown-body blockquote { padding: 0 1em; border-left: .25em solid var(--border); color: var(--muted); }
    .markdown-body blockquote > :last-child { margin-bottom: 0; }
    .markdown-body code {
      padding: .2em .4em;
      border-radius: 6px;
      background: var(--surface-muted);
      font-family: var(--font-mono, "SFMono-Regular", Consolas, monospace);
      font-size: 85%;
    }
    .markdown-body pre {
      overflow: auto;
      padding: 16px;
      border: 1px solid var(--border-muted);
      border-radius: 6px;
      background: var(--surface-subtle);
      line-height: 1.45;
    }
    .markdown-body pre code { padding: 0; background: transparent; font-size: 85%; }
    .markdown-body table { display: block; width: max-content; max-width: 100%; overflow: auto; border-spacing: 0; border-collapse: collapse; }
    .markdown-body th, .markdown-body td { padding: 6px 13px; border: 1px solid var(--border); }
    .markdown-body th { background: var(--surface-subtle); font-weight: 600; }
    .markdown-body tr:nth-child(2n) { background: color-mix(in srgb, var(--surface-subtle) 70%, transparent); }
    .markdown-body hr { height: .25em; margin: 24px 0; padding: 0; border: 0; background: var(--border); }
    .markdown-body img { max-width: 100%; height: auto; }
    .markdown-body kbd {
      display: inline-block;
      padding: 3px 5px;
      border: 1px solid var(--border);
      border-bottom-width: 2px;
      border-radius: 6px;
      background: var(--surface-subtle);
      font: 11px var(--font-mono, monospace);
    }
    .alert { padding: 12px 16px; border: 1px solid var(--border); border-left: 4px solid var(--danger); border-radius: 6px; background: var(--surface-subtle); }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
      .stats { max-width: 360px; }
      .toolbar { grid-template-columns: 1fr; }
      .filter-row { justify-content: flex-start; }
      body.viewer-open .viewer { grid-template-columns: 1fr; }
      .viewer-sidebar { display: none; }
      .article-wrap { padding: 28px 24px 64px; }
      .instance-pill { display: none; }
    }
    @media (max-width: 600px) {
      .app-header { padding: 0 16px; }
      .dashboard { padding: 28px 16px 48px; }
      .stats { grid-template-columns: repeat(3, 1fr); }
      .stat { min-width: 0; padding: 10px; }
      .viewer-header { padding: 10px 16px; }
      .document-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="app-header">
    <div class="brand">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z"/></svg>
      <span>gh-abcs-admin</span>
      <span class="repo-slash">/</span>
      <span>docs</span>
    </div>
    <div class="header-actions">
      <span class="instance-pill" title="Canvas instance">${escapeScriptValue(instanceId).slice(1, -1)}</span>
      <button class="button icon-only" id="refreshButton" title="Refresh document index" aria-label="Refresh document index">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.705 8.005a6.25 6.25 0 0 1 10.79-4.29l.005.006V1.75a.75.75 0 0 1 1.5 0v3.75a.75.75 0 0 1-.75.75H9.5a.75.75 0 0 1 0-1.5h1.894A4.75 4.75 0 1 0 12.67 9.1a.75.75 0 1 1 1.475.27 6.25 6.25 0 1 1-12.44-1.365Z"/></svg>
      </button>
    </div>
  </header>

  <main class="dashboard" id="dashboard">
    <section class="hero">
      <div>
        <p class="eyebrow">Knowledge center</p>
        <h1>Repository documentation</h1>
        <p class="hero-copy">Explore administration, governance, security, architecture, and migration guidance maintained in this repository.</p>
      </div>
      <div class="stats" aria-label="Document statistics">
        <div class="stat"><span class="stat-value" id="totalStat">—</span><span class="stat-label">Documents</span></div>
        <div class="stat"><span class="stat-value" id="markdownStat">—</span><span class="stat-label">Markdown</span></div>
        <div class="stat"><span class="stat-value" id="htmlStat">—</span><span class="stat-label">HTML</span></div>
      </div>
    </section>

    <section class="toolbar" aria-label="Document filters">
      <label class="search-wrap">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 6.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-.78 4.28a5.5 5.5 0 1 1 1.06-1.06l3.75 3.75a.75.75 0 1 1-1.06 1.06Z"/></svg>
        <input class="search" id="searchInput" type="search" placeholder="Search documentation…" autocomplete="off">
      </label>
      <div class="filter-row" id="categoryFilters"></div>
    </section>
    <p class="results-meta" id="resultsMeta"></p>
    <section class="document-grid" id="documentGrid" aria-live="polite">
      <div class="loading"><div class="spinner" aria-label="Loading documents"></div></div>
    </section>
  </main>

  <section class="viewer" id="viewer">
    <aside class="viewer-sidebar">
      <div class="viewer-sidebar-head">
        <button class="button back-button" id="backButton">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.78 3.22a.75.75 0 0 1 0 1.06L4.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"/><path d="M3 7.25h10.25a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5Z"/></svg>
          All documents
        </button>
        <label class="search-wrap">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 6.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-.78 4.28a5.5 5.5 0 1 1 1.06-1.06l3.75 3.75a.75.75 0 1 1-1.06 1.06l-3.75-3.75Z"/></svg>
          <input class="search" id="viewerSearch" type="search" placeholder="Filter documents…" autocomplete="off">
        </label>
      </div>
      <nav class="viewer-list" id="viewerList" aria-label="Repository documents"></nav>
    </aside>
    <div class="viewer-main" id="viewerMain">
      <header class="viewer-header">
        <div class="viewer-title-wrap">
          <h2 class="viewer-title" id="viewerTitle">Document</h2>
          <span class="viewer-path" id="viewerPath"></span>
        </div>
        <div class="viewer-actions">
          <button class="button" id="copyPathButton" title="Copy repository path">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5h2a.75.75 0 0 1 0 1.5h-2a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-2a.75.75 0 0 1 1.5 0v2A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
            Copy path
          </button>
        </div>
      </header>
      <div id="documentContent"><div class="loading"><div class="spinner"></div></div></div>
    </div>
  </section>

  <script>
    const icons = {
      file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5Zm5.75.56v2.19c0 .138.112.25.25.25h2.19ZM2 1.75C2 .784 2.784 0 3.75 0h5.19c.464 0 .909.184 1.237.513l3.31 3.31c.329.328.513.773.513 1.237v9.19A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25Z"/></svg>',
      clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2a.75.75 0 0 1 .75.75v3.74l2.1 1.21a.75.75 0 1 1-.75 1.3L7.625 8.77A.75.75 0 0 1 7.25 8.12V3.95A.75.75 0 0 1 8 3.2Z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm6.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/></svg>',
      list: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.5 3.25A.75.75 0 0 1 5.25 2.5h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 4A.75.75 0 0 1 5.25 6.5h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 3.25a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5ZM1 7.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Zm.75 3.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/></svg>'
    };
    const state = {
      documents: [],
      category: 'All',
      query: '',
      selectedPath: null,
      selectedDocument: null
    };

    const elements = {
      categoryFilters: document.getElementById('categoryFilters'),
      copyPathButton: document.getElementById('copyPathButton'),
      documentContent: document.getElementById('documentContent'),
      documentGrid: document.getElementById('documentGrid'),
      htmlStat: document.getElementById('htmlStat'),
      markdownStat: document.getElementById('markdownStat'),
      refreshButton: document.getElementById('refreshButton'),
      resultsMeta: document.getElementById('resultsMeta'),
      searchInput: document.getElementById('searchInput'),
      totalStat: document.getElementById('totalStat'),
      viewerList: document.getElementById('viewerList'),
      viewerMain: document.getElementById('viewerMain'),
      viewerPath: document.getElementById('viewerPath'),
      viewerSearch: document.getElementById('viewerSearch'),
      viewerTitle: document.getElementById('viewerTitle')
    };

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function safeHref(value) {
      const href = String(value || '').trim();
      if (!href || /^(javascript|data|vbscript):/i.test(href)) return '#';
      return escapeHtml(href);
    }

    function renderInline(value) {
      const placeholders = [];
      const preserve = (html) => {
        const token = '@@INLINE_' + placeholders.length + '@@';
        placeholders.push(html);
        return token;
      };
      let output = String(value).replace(/\`([^\`]+)\`/g, (_, code) =>
        preserve('<code>' + escapeHtml(code) + '</code>')
      );
      output = escapeHtml(output);
      output = output.replace(/!\\[([^\\]]*)\\]\\(([^\\s)]+)(?:\\s+&quot;.*?&quot;)?\\)/g, (_, alt, href) =>
        preserve('<img src="' + safeHref(href) + '" alt="' + alt + '">')
      );
      output = output.replace(/\\[([^\\]]+)\\]\\(([^\\s)]+)(?:\\s+&quot;.*?&quot;)?\\)/g, (_, label, href) =>
        preserve('<a href="' + safeHref(href) + '">' + label + '</a>')
      );
      output = output
        .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>')
        .replace(/(^|[^*])\\*([^*\\n]+)\\*/g, '$1<em>$2</em>')
        .replace(/(^|[^_])_([^_\\n]+)_/g, '$1<em>$2</em>');
      placeholders.forEach((html, index) => {
        output = output.replace('@@INLINE_' + index + '@@', html);
      });
      return output;
    }

    function splitTableRow(line) {
      return line.trim().replace(/^\\||\\|$/g, '').split('|').map((cell) => cell.trim());
    }

    function stripFrontmatter(markdown) {
      return markdown.replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\r?\\n?/, '');
    }

    function renderMarkdown(markdown) {
      const lines = stripFrontmatter(markdown).replace(/\\r\\n/g, '\\n').split('\\n');
      const html = [];
      let index = 0;
      let listType = null;

      const closeList = () => {
        if (listType) {
          html.push('</' + listType + '>');
          listType = null;
        }
      };
      const isBlockStart = (line, nextLine) =>
        !line.trim() ||
        /^#{1,6}\\s+/.test(line) ||
        /^\`\`\`/.test(line) ||
        /^>/.test(line) ||
        /^\\s*[-*+]\\s+/.test(line) ||
        /^\\s*\\d+\\.\\s+/.test(line) ||
        /^\\s*(---+|___+|\\*\\*\\*+)\\s*$/.test(line) ||
        (line.includes('|') && /^\\s*\\|?\\s*:?-{3,}/.test(nextLine || ''));

      while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed) {
          closeList();
          index += 1;
          continue;
        }

        const fence = line.match(/^\`\`\`\\s*([\\w-]*)/);
        if (fence) {
          closeList();
          const code = [];
          index += 1;
          while (index < lines.length && !/^\`\`\`/.test(lines[index])) {
            code.push(lines[index]);
            index += 1;
          }
          index += index < lines.length ? 1 : 0;
          const language = fence[1] ? ' class="language-' + escapeHtml(fence[1]) + '"' : '';
          html.push('<pre><code' + language + '>' + escapeHtml(code.join('\\n')) + '</code></pre>');
          continue;
        }

        const heading = line.match(/^(#{1,6})\\s+(.+?)\\s*#*$/);
        if (heading) {
          closeList();
          const level = heading[1].length;
          const id = heading[2].toLowerCase().replace(/[^a-z0-9\\s-]/g, '').trim().replace(/\\s+/g, '-');
          html.push('<h' + level + ' id="' + escapeHtml(id) + '">' + renderInline(heading[2]) + '</h' + level + '>');
          index += 1;
          continue;
        }

        if (line.includes('|') && /^\\s*\\|?\\s*:?-{3,}/.test(lines[index + 1] || '')) {
          closeList();
          const headers = splitTableRow(line);
          index += 2;
          const rows = [];
          while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
            rows.push(splitTableRow(lines[index]));
            index += 1;
          }
          html.push('<table><thead><tr>' + headers.map((cell) => '<th>' + renderInline(cell) + '</th>').join('') + '</tr></thead><tbody>' +
            rows.map((row) => '<tr>' + row.map((cell) => '<td>' + renderInline(cell) + '</td>').join('') + '</tr>').join('') +
            '</tbody></table>');
          continue;
        }

        if (/^>/.test(line)) {
          closeList();
          const quote = [];
          while (index < lines.length && /^>/.test(lines[index])) {
            quote.push(lines[index].replace(/^>\\s?/, ''));
            index += 1;
          }
          html.push('<blockquote>' + renderMarkdown(quote.join('\\n')) + '</blockquote>');
          continue;
        }

        const unordered = line.match(/^\\s*[-*+]\\s+(.+)/);
        const ordered = line.match(/^\\s*\\d+\\.\\s+(.+)/);
        if (unordered || ordered) {
          const nextType = ordered ? 'ol' : 'ul';
          if (listType !== nextType) {
            closeList();
            listType = nextType;
            html.push('<' + listType + '>');
          }
          const item = (unordered || ordered)[1];
          const checkbox = item.match(/^\\[([ xX])\\]\\s+(.+)/);
          html.push('<li>' + (checkbox
            ? '<input type="checkbox" disabled ' + (checkbox[1].toLowerCase() === 'x' ? 'checked ' : '') + '> ' + renderInline(checkbox[2])
            : renderInline(item)) + '</li>');
          index += 1;
          continue;
        }

        if (/^\\s*(---+|___+|\\*\\*\\*+)\\s*$/.test(line)) {
          closeList();
          html.push('<hr>');
          index += 1;
          continue;
        }

        closeList();
        const paragraph = [trimmed];
        index += 1;
        while (index < lines.length && !isBlockStart(lines[index], lines[index + 1])) {
          paragraph.push(lines[index].trim());
          index += 1;
        }
        html.push('<p>' + renderInline(paragraph.join(' ')) + '</p>');
      }
      closeList();
      return html.join('');
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    function filteredDocuments(query = state.query, category = state.category) {
      const needle = query.trim().toLowerCase();
      return state.documents.filter((document) => {
        const categoryMatches = category === 'All' || document.category === category;
        const searchMatches = !needle || [
          document.title,
          document.description,
          document.path,
          document.category
        ].some((value) => value.toLowerCase().includes(needle));
        return categoryMatches && searchMatches;
      });
    }

    function renderFilters() {
      const categories = ['All', ...new Set(state.documents.map((document) => document.category))];
      elements.categoryFilters.innerHTML = categories.map((category) =>
        '<button class="filter ' + (category === state.category ? 'active' : '') + '" data-category="' + escapeHtml(category) + '">' +
        escapeHtml(category) + '</button>'
      ).join('');
    }

    function renderGrid() {
      const documents = filteredDocuments();
      elements.resultsMeta.textContent = documents.length + (documents.length === 1 ? ' document' : ' documents') + ' shown';
      if (!documents.length) {
        elements.documentGrid.innerHTML = '<div class="empty"><strong>No documents found</strong>Try a different search or category.</div>';
        return;
      }
      elements.documentGrid.innerHTML = documents.map((document) =>
        '<button class="document-card" data-path="' + escapeHtml(document.path) + '">' +
          '<div class="card-top"><span class="file-icon ' + document.type + '">' + icons.file + '</span>' +
          '<span class="type-badge">' + (document.type === 'markdown' ? 'Markdown' : 'HTML') + '</span></div>' +
          '<h2 class="card-title">' + escapeHtml(document.title) + '</h2>' +
          '<p class="card-description">' + escapeHtml(document.description) + '</p>' +
          '<div class="meta-row"><span>' + icons.clock + document.readingMinutes + ' min</span>' +
          '<span>' + icons.list + document.headingCount + '</span>' +
          '<span class="category-badge">' + escapeHtml(document.category) + '</span></div>' +
        '</button>'
      ).join('');
    }

    function renderStats() {
      elements.totalStat.textContent = state.documents.length;
      elements.markdownStat.textContent = state.documents.filter((document) => document.type === 'markdown').length;
      elements.htmlStat.textContent = state.documents.filter((document) => document.type === 'html').length;
    }

    function renderViewerList() {
      const query = elements.viewerSearch.value.trim().toLowerCase();
      const documents = filteredDocuments(query, 'All');
      elements.viewerList.innerHTML = documents.map((document) =>
        '<button class="viewer-list-item ' + (document.path === state.selectedPath ? 'active' : '') + '" data-path="' + escapeHtml(document.path) + '">' +
          '<span class="viewer-list-title">' + escapeHtml(document.title) + '</span>' +
          '<span class="viewer-list-path">' + escapeHtml(document.path) + '</span>' +
        '</button>'
      ).join('');
      elements.viewerList.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
    }

    async function openDocument(path, updateServer = true) {
      const summary = state.documents.find((document) => document.path === path);
      if (!summary) return;
      state.selectedPath = path;
      document.body.classList.add('viewer-open');
      elements.viewerTitle.textContent = summary.title;
      elements.viewerPath.textContent = 'docs/' + summary.path;
      elements.documentContent.innerHTML = '<div class="loading"><div class="spinner" aria-label="Loading document"></div></div>';
      renderViewerList();
      if (updateServer) {
        fetch('/api/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        }).catch(() => {});
      }

      try {
        if (summary.type === 'html') {
          state.selectedDocument = summary;
          elements.documentContent.innerHTML =
            '<iframe class="html-frame" title="' + escapeHtml(summary.title) + '" sandbox="allow-forms allow-modals allow-popups allow-scripts" src="/raw?path=' +
            encodeURIComponent(path) + '"></iframe>';
        } else {
          const response = await fetch('/api/document?path=' + encodeURIComponent(path));
          if (!response.ok) throw new Error('Unable to load document');
          const documentData = await response.json();
          state.selectedDocument = documentData;
          elements.documentContent.innerHTML =
            '<article class="article-wrap"><div class="document-meta">' +
              '<span class="type-badge">Markdown</span>' +
              '<span class="type-badge">' + formatBytes(documentData.bytes) + '</span>' +
              '<span class="type-badge">' + documentData.readingMinutes + ' min read</span>' +
            '</div><div class="markdown-body">' + renderMarkdown(documentData.content) + '</div></article>';
        }
        elements.viewerMain.scrollTop = 0;
        history.replaceState(null, '', '#' + encodeURIComponent(path));
      } catch (error) {
        elements.documentContent.innerHTML =
          '<div class="article-wrap"><div class="alert"><strong>Document unavailable.</strong><br>' +
          escapeHtml(error.message) + '</div></div>';
      }
    }

    function showDashboard() {
      document.body.classList.remove('viewer-open');
      state.selectedPath = null;
      state.selectedDocument = null;
      history.replaceState(null, '', location.pathname);
    }

    function applyDocuments(documents) {
      state.documents = documents;
      renderStats();
      renderFilters();
      renderGrid();
      renderViewerList();
    }

    async function loadIndex() {
      elements.refreshButton.disabled = true;
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) throw new Error('Unable to load the docs index');
        const data = await response.json();
        applyDocuments(data.documents);
        const hashPath = decodeURIComponent(location.hash.slice(1));
        const initialPath = data.selectedPath || hashPath;
        if (initialPath && state.documents.some((document) => document.path === initialPath)) {
          await openDocument(initialPath, false);
        }
      } catch (error) {
        elements.documentGrid.innerHTML =
          '<div class="empty"><strong>Documentation could not be loaded</strong>' + escapeHtml(error.message) + '</div>';
      } finally {
        elements.refreshButton.disabled = false;
      }
    }

    elements.searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      renderGrid();
    });
    elements.categoryFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = button.dataset.category;
      renderFilters();
      renderGrid();
    });
    elements.documentGrid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-path]');
      if (card) openDocument(card.dataset.path);
    });
    elements.viewerList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-path]');
      if (item) openDocument(item.dataset.path);
    });
    elements.viewerSearch.addEventListener('input', renderViewerList);
    document.getElementById('backButton').addEventListener('click', showDashboard);
    elements.refreshButton.addEventListener('click', async () => {
      elements.refreshButton.disabled = true;
      try {
        const response = await fetch('/api/refresh', { method: 'POST' });
        if (!response.ok) throw new Error('Refresh failed');
      } finally {
        elements.refreshButton.disabled = false;
      }
    });
    elements.copyPathButton.addEventListener('click', async () => {
      if (!state.selectedPath) return;
      await navigator.clipboard.writeText('docs/' + state.selectedPath);
      const original = elements.copyPathButton.innerHTML;
      elements.copyPathButton.textContent = 'Copied!';
      setTimeout(() => { elements.copyPathButton.innerHTML = original; }, 1200);
    });
    elements.documentContent.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || !state.selectedPath) return;
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        event.preventDefault();
        document.getElementById(href.slice(1))?.scrollIntoView();
        return;
      }
      if (!/^(https?:|mailto:)/i.test(href)) {
        const base = new URL('https://repo.local/' + state.selectedPath);
        const target = new URL(href, base);
        const path = target.pathname.slice(1);
        if (state.documents.some((document) => document.path === path)) {
          event.preventDefault();
          openDocument(path);
          if (target.hash) {
            setTimeout(() => document.getElementById(target.hash.slice(1))?.scrollIntoView(), 0);
          }
        }
      }
    });

    const events = new EventSource('/events');
    events.addEventListener('select', (event) => {
      const data = JSON.parse(event.data);
      openDocument(data.path, false);
    });
    events.addEventListener('documents', (event) => {
      const data = JSON.parse(event.data);
      applyDocuments(data.documents);
    });

    loadIndex();
  </script>
</body>
</html>`;
}
