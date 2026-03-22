/**
 * Meridian Flipbook Viewer — Self-contained HTML page served at public routes.
 *
 * Pure HTML/CSS/JS with zero external dependencies.
 * Features:
 *  - CSS 3D page-flip animation
 *  - Keyboard navigation (arrows, space)
 *  - Touch swipe on mobile
 *  - Toolbar: page counter, fullscreen, share, download
 *  - Analytics beacon fires on each page view
 */

export interface ViewerOptions {
  slug: string;
  title: string;
  pageCount: number;
  settings: {
    pageFlipAnimation: string;
    backgroundColor: string;
    autoPlay: boolean;
    autoPlayInterval: number;
    shareEnabled: boolean;
    downloadEnabled: boolean;
    showToolbar: boolean;
    showPageCount: boolean;
  };
  pdfUrl: string;
  baseUrl: string;
  themePrimary?: string;
  themeAccent?: string;
}

export function renderFlipbookViewer(opts: ViewerOptions): string {
  const {
    slug, title, pageCount, settings, pdfUrl, baseUrl,
    themePrimary = '#1e3a5f',
    themeAccent = '#4f8cdb',
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: ${settings.backgroundColor};
      --primary: ${themePrimary};
      --accent: ${themeAccent};
      --toolbar-h: 48px;
    }

    body {
      background: var(--bg);
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Toolbar */
    .toolbar {
      display: ${settings.showToolbar ? 'flex' : 'none'};
      align-items: center;
      justify-content: space-between;
      height: var(--toolbar-h);
      padding: 0 16px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 10;
    }
    .toolbar-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 40%;
    }
    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-indicator {
      font-size: 13px;
      color: #ccc;
      font-variant-numeric: tabular-nums;
    }
    .btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: #e0e0e0;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
    }
    .btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); }
    .btn svg { width: 16px; height: 16px; vertical-align: middle; }

    /* Viewer area */
    .viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      perspective: 1200px;
    }

    .page-container {
      position: relative;
      width: min(90vw, 700px);
      height: min(80vh, 900px);
      transform-style: preserve-3d;
    }

    .page {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      transition: transform 0.5s ease, opacity 0.5s ease;
      backface-visibility: hidden;
    }
    .page img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .page.prev { transform: translateX(-110%); opacity: 0; }
    .page.current { transform: translateX(0); opacity: 1; }
    .page.next { transform: translateX(110%); opacity: 0; }

    /* Flip animation variant */
    .flip .page.prev { transform: rotateY(90deg); opacity: 0; }
    .flip .page.current { transform: rotateY(0deg); opacity: 1; }
    .flip .page.next { transform: rotateY(-90deg); opacity: 0; }

    /* Fade animation variant */
    .fade .page { transform: none; }
    .fade .page.prev { opacity: 0; }
    .fade .page.current { opacity: 1; }
    .fade .page.next { opacity: 0; }

    /* Nav arrows */
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 8px;
      z-index: 5;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .viewer:hover .nav-arrow { opacity: 1; }
    .nav-arrow:hover { background: rgba(0,0,0,0.5); }
    .nav-arrow.left { left: 16px; }
    .nav-arrow.right { right: 16px; }
    .nav-arrow svg { width: 24px; height: 24px; }

    /* Loading */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 14px;
    }

    @media (max-width: 600px) {
      .toolbar-title { display: none; }
      .page-container { width: 95vw; height: 75vh; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">${escapeHtml(title)}</div>
    <div class="toolbar-center">
      <button class="btn" id="btn-prev" title="Previous page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <span class="page-indicator" id="page-indicator" style="display:${settings.showPageCount ? 'inline' : 'none'}">1 / ${pageCount}</span>
      <button class="btn" id="btn-next" title="Next page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
    <div class="toolbar-actions">
      ${settings.shareEnabled ? `<button class="btn" id="btn-share" title="Share">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>` : ''}
      ${settings.downloadEnabled ? `<button class="btn" id="btn-download" title="Download PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>` : ''}
      <button class="btn" id="btn-fullscreen" title="Fullscreen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
      </button>
    </div>
  </div>

  <div class="viewer">
    <div class="page-container ${settings.pageFlipAnimation}" id="page-container">
      <div class="page current" id="page-display">
        <div class="loading">Loading page...</div>
      </div>
    </div>
    <button class="nav-arrow left" id="nav-prev">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <button class="nav-arrow right" id="nav-next">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  </div>

  <script>
  (function() {
    'use strict';

    var slug = ${JSON.stringify(slug)};
    var baseUrl = ${JSON.stringify(baseUrl)};
    var totalPages = ${pageCount};
    var currentPage = 1;
    var sessionId = 'ms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    var pageStartTime = Date.now();
    var autoPlayTimer = null;

    var pageDisplay = document.getElementById('page-display');
    var indicator = document.getElementById('page-indicator');
    var container = document.getElementById('page-container');

    function pageImageUrl(num) {
      return baseUrl + '/api/v1/public/flipbooks/' + slug + '/pages/' + num;
    }

    function loadPage(num) {
      if (num < 1 || num > totalPages) return;

      // Send analytics for previous page
      sendBeacon(currentPage, (Date.now() - pageStartTime) / 1000);

      currentPage = num;
      pageStartTime = Date.now();

      // Animate
      pageDisplay.className = 'page current';
      pageDisplay.innerHTML = '<img src="' + pageImageUrl(num) + '" alt="Page ' + num + '" loading="eager">';
      if (indicator) indicator.textContent = num + ' / ' + totalPages;
    }

    function nextPage() { if (currentPage < totalPages) loadPage(currentPage + 1); }
    function prevPage() { if (currentPage > 1) loadPage(currentPage - 1); }

    // Analytics beacon
    function sendBeacon(pageNum, timeOnPage) {
      if (timeOnPage < 0.1) return; // skip sub-100ms views
      try {
        var data = JSON.stringify({
          sessionId: sessionId,
          pageNumber: pageNum,
          timeOnPage: Math.min(timeOnPage, 3600),
          userAgent: navigator.userAgent,
          referrer: document.referrer || ''
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            baseUrl + '/api/v1/public/flipbooks/' + slug + '/analytics',
            new Blob([data], { type: 'application/json' })
          );
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', baseUrl + '/api/v1/public/flipbooks/' + slug + '/analytics', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(data);
        }
      } catch(e) { /* analytics are non-critical */ }
    }

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
      else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    });

    // Touch swipe
    var touchStartX = 0;
    container.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    container.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) { dx < 0 ? nextPage() : prevPage(); }
    }, { passive: true });

    // Buttons
    document.getElementById('btn-prev').addEventListener('click', prevPage);
    document.getElementById('btn-next').addEventListener('click', nextPage);
    document.getElementById('nav-prev').addEventListener('click', prevPage);
    document.getElementById('nav-next').addEventListener('click', nextPage);

    // Fullscreen
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function() {});
      } else {
        document.exitFullscreen().catch(function() {});
      }
    }
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    // Share
    var shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        if (navigator.share) {
          navigator.share({ title: ${JSON.stringify(title)}, url: window.location.href }).catch(function() {});
        } else {
          navigator.clipboard.writeText(window.location.href).then(function() {
            shareBtn.textContent = 'Copied!';
            setTimeout(function() { shareBtn.innerHTML = shareBtn.dataset.original; }, 2000);
          });
          shareBtn.dataset.original = shareBtn.innerHTML;
        }
      });
    }

    // Download
    var dlBtn = document.getElementById('btn-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', function() {
        var a = document.createElement('a');
        a.href = ${JSON.stringify(pdfUrl)};
        a.download = ${JSON.stringify(title)} + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    // Auto-play
    ${settings.autoPlay ? `
    autoPlayTimer = setInterval(function() {
      if (currentPage < totalPages) nextPage();
      else clearInterval(autoPlayTimer);
    }, ${settings.autoPlayInterval});
    ` : ''}

    // Send final analytics on unload
    window.addEventListener('beforeunload', function() {
      sendBeacon(currentPage, (Date.now() - pageStartTime) / 1000);
    });

    // Load first page
    loadPage(1);

    // Preload next page
    if (totalPages > 1) { var img = new Image(); img.src = pageImageUrl(2); }
  })();
  </script>
</body>
</html>`;
}

export function renderEmbedViewer(opts: ViewerOptions): string {
  // Embed version is the same viewer but wrapped for iframe use
  return renderFlipbookViewer(opts);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
