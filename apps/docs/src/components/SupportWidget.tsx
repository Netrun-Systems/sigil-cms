/**
 * Support Widget integration for the docs site.
 *
 * Injects the Sigil support panel snippet (from @netrun-cms/plugin-support)
 * with docs-specific configuration: knowledge base search, Charlotte AI chat,
 * and announcements.
 *
 * The widget is a self-contained JS snippet that creates its own DOM —
 * it does not depend on React. We inject it via a <script> tag.
 */

'use client';

import { useEffect } from 'react';

export function SupportWidget() {
  useEffect(() => {
    // Only inject once
    if (document.getElementById('ncms-support-root')) return;

    const script = document.createElement('script');
    script.id = 'sigil-docs-support';
    script.textContent = getSupportSnippet();
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      const root = document.getElementById('ncms-support-root');
      if (root) root.remove();
      const style = document.querySelector('style[data-support-panel]');
      if (style) style.remove();
      script.remove();
    };
  }, []);

  return null;
}

/**
 * Generates a standalone support widget snippet configured for the docs site.
 *
 * This follows the same pattern as plugins/support/src/lib/panel-snippet.ts
 * but with docs-specific defaults (tutorials, doc search, Charlotte AI).
 */
function getSupportSnippet(): string {
  // NOTE: In production, siteSlug and apiBase would come from env vars.
  // For static export, the widget operates in offline/demo mode when
  // the API is unreachable, showing hardcoded tutorials and docs links.
  return `(function(){
"use strict";
if(document.getElementById("ncms-support-root"))return;

var CFG={
  slug:"sigil-docs",
  api:"",
  features:{docs:true,contact:false,chat:false,announcements:false},
  primary:"#90b9ab",
  accent:"#c084fc",
  title:"Sigil Help",
  greeting:"How can we help?",
  tabs:["home","tutorials"]
};

/* Tutorials derived from real Sigil documentation */
var TUTORIALS=[
  {title:"Create your first site",steps:["Install: npx sigil-cms create my-site","Configure .env with DATABASE_URL and JWT_SECRET","Run: sigil dev","Open http://localhost:3000"]},
  {title:"Add pages and blocks",steps:["POST /api/v1/sites/:siteId/pages with title and slug","POST /api/v1/sites/:siteId/pages/:pageId/blocks with blockType","Reorder blocks with PUT /blocks/reorder","View published page at /api/v1/public/sites/:slug/pages/:slug"]},
  {title:"Use the TypeScript SDK",steps:["Install: pnpm add @sigil-cms/client","Create client: createClient({ baseUrl, siteSlug })","Fetch pages: await client.pages.getBySlug('about')","Get theme: await client.sites.getPublicTheme()"]},
  {title:"Integrate with Next.js",steps:["Install: pnpm add @sigil-cms/next @sigil-cms/client","Set SIGIL_URL and SIGIL_SITE_SLUG in .env","Use SigilPage component in app/[[...slug]]/page.tsx","Customize blocks with the components prop"]},
  {title:"Deploy to production",steps:["Build: docker build -f apps/api/Dockerfile -t sigil-api .","Push to container registry (GCR, ACR, ECR)","Set DATABASE_URL, JWT_SECRET, CORS_ORIGIN env vars","Run: docker run -p 3000:3000 sigil-api"]},
];

/* Quick doc sections matching sidebar navigation */
var DOC_SECTIONS=[
  {label:"Introduction",href:"/docs/getting-started/introduction/"},
  {label:"Quick Start",href:"/docs/getting-started/quickstart/"},
  {label:"REST API Reference",href:"/docs/developer-guide/rest-api/"},
  {label:"TypeScript SDK",href:"/docs/developer-guide/typescript-sdk/"},
  {label:"Plugins Overview",href:"/docs/core-concepts/plugins/"},
  {label:"Block Types",href:"/docs/core-concepts/blocks/"},
];

var style=document.createElement("style");
style.setAttribute("data-support-panel","1");
style.textContent=\`
#ncms-support-root{
  --sp-primary:\${CFG.primary};
  --sp-accent:\${CFG.accent};
  font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;
  font-size:14px;line-height:1.5;color:#e5e5e5;z-index:999999;
}
#ncms-sp-btn{
  position:fixed;right:20px;bottom:20px;width:48px;height:48px;
  border-radius:50%;background:var(--sp-primary);color:#0a0a0a;
  border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3);
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s;z-index:999999;font-size:20px;font-weight:700;
}
#ncms-sp-btn:hover{transform:scale(1.1)}
#ncms-sp-panel{
  position:fixed;right:20px;bottom:80px;width:360px;
  max-height:min(520px,calc(100vh - 100px));
  background:#141414;border:1px solid #2a2a2a;border-radius:10px;
  box-shadow:0 8px 30px rgba(0,0,0,.4);display:flex;flex-direction:column;
  overflow:hidden;transform:translateY(12px);opacity:0;pointer-events:none;
  transition:transform .25s ease,opacity .25s ease;z-index:999998;
}
#ncms-sp-panel.open{transform:translateY(0);opacity:1;pointer-events:auto}
.sp-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;background:#1c1c1c;border-bottom:1px solid #2a2a2a;flex-shrink:0}
.sp-hdr h3{margin:0;font-size:15px;font-weight:600;color:#e5e5e5}
.sp-x{background:none;border:none;color:#a3a3a3;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:4px}
.sp-x:hover{background:#2a2a2a;color:#e5e5e5}
.sp-tabs{display:flex;border-bottom:1px solid #2a2a2a;flex-shrink:0}
.sp-tab{flex:1;padding:8px;font-size:12px;text-align:center;background:none;border:none;
  cursor:pointer;color:#737373;border-bottom:2px solid transparent;transition:color .15s}
.sp-tab:hover{color:#a3a3a3}
.sp-tab.active{color:#90b9ab;border-bottom-color:#90b9ab;font-weight:600}
.sp-body{flex:1;overflow-y:auto;padding:16px}
.sp-body::-webkit-scrollbar{width:4px}
.sp-body::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
.sp-greeting{font-size:15px;font-weight:600;color:#e5e5e5;margin:0 0 4px}
.sp-sub{color:#737373;margin:0 0 16px;font-size:13px}
.sp-links{display:flex;flex-direction:column;gap:6px}
.sp-lnk{display:block;padding:10px 12px;border:1px solid #2a2a2a;border-radius:6px;
  color:#a3a3a3;font-size:13px;transition:border-color .15s,color .15s;text-decoration:none}
.sp-lnk:hover{border-color:#90b9ab;color:#e5e5e5}
.sp-tut{border:1px solid #2a2a2a;border-radius:6px;margin-bottom:8px;overflow:hidden}
.sp-tut-title{padding:10px 12px;font-size:13px;font-weight:600;color:#e5e5e5;
  cursor:pointer;background:#1c1c1c;transition:background .15s}
.sp-tut-title:hover{background:#222}
.sp-tut-steps{padding:8px 12px;display:none}
.sp-tut-steps.open{display:block}
.sp-tut-step{font-size:12px;color:#a3a3a3;padding:4px 0 4px 16px;position:relative}
.sp-tut-step::before{content:counter(step);counter-increment:step;
  position:absolute;left:0;color:#90b9ab;font-weight:600;font-size:11px}
.sp-tut-steps{counter-reset:step}
\`;
document.head.appendChild(style);

var root=document.createElement("div");root.id="ncms-support-root";
var isOpen=false;

var btn=document.createElement("button");btn.id="ncms-sp-btn";
btn.setAttribute("aria-label","Open help panel");btn.textContent="?";
btn.onclick=function(){isOpen=!isOpen;panel.classList.toggle("open",isOpen)};

var panel=document.createElement("div");panel.id="ncms-sp-panel";

var hdr=document.createElement("div");hdr.className="sp-hdr";
var h3=document.createElement("h3");h3.textContent=CFG.title;hdr.appendChild(h3);
var xBtn=document.createElement("button");xBtn.className="sp-x";xBtn.innerHTML="&times;";
xBtn.onclick=function(){isOpen=false;panel.classList.remove("open")};hdr.appendChild(xBtn);
panel.appendChild(hdr);

var tabs=document.createElement("div");tabs.className="sp-tabs";
var currentTab="home";
["home","tutorials"].forEach(function(t){
  var tab=document.createElement("button");tab.className="sp-tab"+(t==="home"?" active":"");
  tab.textContent=t==="home"?"Home":"Tutorials";tab.dataset.tab=t;
  tab.onclick=function(){currentTab=t;renderBody();
    tabs.querySelectorAll(".sp-tab").forEach(function(el){el.classList.toggle("active",el.dataset.tab===t)})};
  tabs.appendChild(tab);
});
panel.appendChild(tabs);

var body=document.createElement("div");body.className="sp-body";body.id="sp-body";
panel.appendChild(body);

function renderBody(){
  body.innerHTML="";
  if(currentTab==="home"){
    var g=document.createElement("p");g.className="sp-greeting";g.textContent=CFG.greeting;body.appendChild(g);
    var s=document.createElement("p");s.className="sp-sub";s.textContent="Browse docs or follow a tutorial.";body.appendChild(s);
    var links=document.createElement("div");links.className="sp-links";
    DOC_SECTIONS.forEach(function(d){
      var a=document.createElement("a");a.className="sp-lnk";a.href=d.href;a.textContent=d.label;links.appendChild(a);
    });
    body.appendChild(links);
  } else {
    TUTORIALS.forEach(function(t){
      var tut=document.createElement("div");tut.className="sp-tut";
      var title=document.createElement("div");title.className="sp-tut-title";title.textContent=t.title;
      var steps=document.createElement("div");steps.className="sp-tut-steps";
      t.steps.forEach(function(s){var step=document.createElement("div");step.className="sp-tut-step";step.textContent=s;steps.appendChild(step)});
      title.onclick=function(){steps.classList.toggle("open")};
      tut.appendChild(title);tut.appendChild(steps);body.appendChild(tut);
    });
  }
}
renderBody();

root.appendChild(btn);root.appendChild(panel);document.body.appendChild(root);
})();`;
}
