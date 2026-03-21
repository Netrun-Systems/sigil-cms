/**
 * Support Panel — JavaScript snippet generator
 *
 * Produces a self-contained JS snippet (~8KB minified) that renders a
 * floating "?" button which opens a slide-out support panel with tabs:
 *   Home, Search (docs), Contact, Chat (Charlotte AI), Status (announcements)
 *
 * The snippet uses CSS variables from the host page for theming and
 * creates its own shadow-free DOM to avoid style conflicts.
 */

export interface SupportPanelConfig {
  siteSlug: string;
  apiBase: string;
  features: {
    docs: boolean;
    contact: boolean;
    chat: boolean;
    announcements: boolean;
  };
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  accentColor: string;
  title: string;
  greeting: string;
}

export function generateSupportPanelSnippet(config: SupportPanelConfig): string {
  const {
    siteSlug,
    apiBase,
    features,
    position,
    primaryColor,
    accentColor,
    title,
    greeting,
  } = config;

  const posRight = position === 'bottom-right';

  // Build tab list based on enabled features
  const tabs: string[] = ['"home"'];
  if (features.docs) tabs.push('"search"');
  if (features.contact) tabs.push('"contact"');
  if (features.chat) tabs.push('"chat"');
  if (features.announcements) tabs.push('"status"');

  return `(function(){
"use strict";
if(document.getElementById("ncms-support-root"))return;

var CFG={
  slug:${JSON.stringify(siteSlug)},
  api:${JSON.stringify(apiBase)},
  features:${JSON.stringify(features)},
  primary:${JSON.stringify(primaryColor)},
  accent:${JSON.stringify(accentColor)},
  title:${JSON.stringify(title)},
  greeting:${JSON.stringify(greeting)},
  tabs:[${tabs.join(',')}]
};

/* ── Styles ─────────────────────────────────────────────────────────── */

var css=\`
#ncms-support-root{
  --sp-primary:\${CFG.primary};
  --sp-accent:\${CFG.accent};
  --sp-bg:var(--background,#ffffff);
  --sp-fg:var(--foreground,#1a1a1a);
  --sp-muted:var(--muted,#f4f4f5);
  --sp-muted-fg:var(--muted-foreground,#71717a);
  --sp-border:var(--border,#e4e4e7);
  --sp-radius:8px;
  font-family:var(--font-sans,Inter,-apple-system,BlinkMacSystemFont,sans-serif);
  font-size:14px;
  line-height:1.5;
  color:var(--sp-fg);
  z-index:999999;
}
#ncms-sp-btn{
  position:fixed;
  ${posRight ? 'right:20px' : 'left:20px'};
  bottom:20px;
  width:52px;height:52px;
  border-radius:50%;
  background:var(--sp-primary);
  color:#fff;
  border:none;
  cursor:pointer;
  box-shadow:0 4px 12px rgba(0,0,0,.15);
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s,box-shadow .2s;
  z-index:999999;
}
#ncms-sp-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.2)}
#ncms-sp-btn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

#ncms-sp-panel{
  position:fixed;
  ${posRight ? 'right:20px' : 'left:20px'};
  bottom:82px;
  width:380px;
  max-height:min(580px,calc(100vh - 100px));
  background:var(--sp-bg);
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  box-shadow:0 8px 30px rgba(0,0,0,.12);
  display:flex;flex-direction:column;
  overflow:hidden;
  transform:translateY(12px);
  opacity:0;
  pointer-events:none;
  transition:transform .25s ease,opacity .25s ease;
  z-index:999998;
}
#ncms-sp-panel.open{
  transform:translateY(0);
  opacity:1;
  pointer-events:auto;
}

/* Mobile: full-screen overlay */
@media(max-width:480px){
  #ncms-sp-panel{
    top:0;left:0;right:0;bottom:0;
    width:100%;max-height:100%;
    border-radius:0;border:none;
  }
  #ncms-sp-btn{${posRight ? 'right:16px' : 'left:16px'};bottom:16px}
}

.sp-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;
  border-bottom:1px solid var(--sp-border);
  background:var(--sp-primary);
  color:#fff;
  flex-shrink:0;
}
.sp-header h3{margin:0;font-size:15px;font-weight:600}
.sp-close{background:none;border:none;color:#fff;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center}
.sp-close:hover{background:rgba(255,255,255,.2)}
.sp-close svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

.sp-tabs{
  display:flex;
  border-bottom:1px solid var(--sp-border);
  background:var(--sp-muted);
  flex-shrink:0;
  overflow-x:auto;
}
.sp-tab{
  flex:1;
  padding:8px 4px;
  font-size:12px;
  text-align:center;
  background:none;border:none;
  cursor:pointer;
  color:var(--sp-muted-fg);
  border-bottom:2px solid transparent;
  transition:color .15s,border-color .15s;
  white-space:nowrap;
}
.sp-tab:hover{color:var(--sp-fg)}
.sp-tab.active{color:var(--sp-primary);border-bottom-color:var(--sp-primary);font-weight:600}

.sp-body{
  flex:1;
  overflow-y:auto;
  padding:16px;
}

/* Home tab */
.sp-greeting{font-size:16px;font-weight:600;margin:0 0 4px}
.sp-subtext{color:var(--sp-muted-fg);margin:0 0 16px;font-size:13px}
.sp-quick-links{display:flex;flex-direction:column;gap:8px}
.sp-qlink{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  cursor:pointer;background:var(--sp-bg);
  transition:border-color .15s,background .15s;
  text-decoration:none;color:var(--sp-fg);
}
.sp-qlink:hover{border-color:var(--sp-primary);background:var(--sp-muted)}
.sp-qlink-icon{width:20px;height:20px;color:var(--sp-primary);flex-shrink:0}
.sp-qlink-label{font-size:13px;font-weight:500}

/* Search tab */
.sp-search-input{
  width:100%;padding:8px 12px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  font-size:13px;
  outline:none;
  background:var(--sp-bg);color:var(--sp-fg);
  box-sizing:border-box;
}
.sp-search-input:focus{border-color:var(--sp-primary)}
.sp-results{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.sp-result{
  padding:10px 12px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  cursor:pointer;background:var(--sp-bg);
  transition:border-color .15s;
  text-decoration:none;color:var(--sp-fg);
  display:block;
}
.sp-result:hover{border-color:var(--sp-primary)}
.sp-result-title{font-weight:600;font-size:13px;margin:0 0 2px}
.sp-result-excerpt{color:var(--sp-muted-fg);font-size:12px;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sp-no-results{color:var(--sp-muted-fg);text-align:center;padding:24px 0;font-size:13px}

/* Contact tab */
.sp-form{display:flex;flex-direction:column;gap:10px}
.sp-field{display:flex;flex-direction:column;gap:3px}
.sp-field label{font-size:12px;font-weight:500;color:var(--sp-muted-fg)}
.sp-field input,.sp-field textarea{
  padding:8px 10px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  font-size:13px;
  background:var(--sp-bg);color:var(--sp-fg);
  outline:none;resize:vertical;
  font-family:inherit;
  box-sizing:border-box;
}
.sp-field input:focus,.sp-field textarea:focus{border-color:var(--sp-primary)}
.sp-submit{
  padding:10px;
  background:var(--sp-primary);
  color:#fff;border:none;
  border-radius:var(--sp-radius);
  font-size:13px;font-weight:600;
  cursor:pointer;
  transition:opacity .15s;
}
.sp-submit:hover{opacity:.9}
.sp-submit:disabled{opacity:.5;cursor:not-allowed}
.sp-msg{padding:12px;border-radius:var(--sp-radius);font-size:13px;text-align:center}
.sp-msg.success{background:#ecfdf5;color:#065f46}
.sp-msg.error{background:#fef2f2;color:#991b1b}

/* Chat tab */
.sp-chat-messages{
  display:flex;flex-direction:column;gap:8px;
  min-height:200px;
  max-height:320px;
  overflow-y:auto;
  margin-bottom:10px;
  padding-right:4px;
}
.sp-chat-bubble{
  max-width:85%;
  padding:8px 12px;
  border-radius:var(--sp-radius);
  font-size:13px;
  line-height:1.4;
  word-break:break-word;
}
.sp-chat-bubble.user{
  background:var(--sp-primary);color:#fff;
  align-self:flex-end;
  border-bottom-right-radius:2px;
}
.sp-chat-bubble.assistant{
  background:var(--sp-muted);color:var(--sp-fg);
  align-self:flex-start;
  border-bottom-left-radius:2px;
}
.sp-chat-input-row{display:flex;gap:6px}
.sp-chat-input{
  flex:1;
  padding:8px 10px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  font-size:13px;outline:none;
  background:var(--sp-bg);color:var(--sp-fg);
  font-family:inherit;
}
.sp-chat-input:focus{border-color:var(--sp-primary)}
.sp-chat-send{
  padding:8px 14px;
  background:var(--sp-primary);color:#fff;
  border:none;border-radius:var(--sp-radius);
  cursor:pointer;font-size:13px;font-weight:600;
  transition:opacity .15s;
}
.sp-chat-send:hover{opacity:.9}
.sp-chat-send:disabled{opacity:.5;cursor:not-allowed}

/* Status/Announcements tab */
.sp-announcements{display:flex;flex-direction:column;gap:8px}
.sp-announce{
  padding:10px 12px;
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  background:var(--sp-bg);
}
.sp-announce-header{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sp-badge{
  display:inline-block;
  padding:2px 8px;
  border-radius:10px;
  font-size:11px;
  font-weight:600;
  text-transform:uppercase;
  letter-spacing:.3px;
}
.sp-badge.info{background:#dbeafe;color:#1e40af}
.sp-badge.warning{background:#fef3c7;color:#92400e}
.sp-badge.maintenance{background:#fed7aa;color:#9a3412}
.sp-badge.resolved{background:#d1fae5;color:#065f46}
.sp-announce-title{font-weight:600;font-size:13px}
.sp-announce-msg{color:var(--sp-muted-fg);font-size:12px;margin:0}
.sp-empty{color:var(--sp-muted-fg);text-align:center;padding:24px 0;font-size:13px}
\`;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function h(tag,attrs,children){
  var el=document.createElement(tag);
  if(attrs)for(var k in attrs){
    if(k==="className")el.className=attrs[k];
    else if(k==="innerHTML")el.innerHTML=attrs[k];
    else if(k.indexOf("on")===0)el.addEventListener(k.slice(2).toLowerCase(),attrs[k]);
    else el.setAttribute(k,attrs[k]);
  }
  if(typeof children==="string")el.textContent=children;
  else if(Array.isArray(children))children.forEach(function(c){if(c)el.appendChild(c)});
  return el;
}

var debounceTimer;
function debounce(fn,ms){
  return function(){
    var args=arguments,self=this;
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(function(){fn.apply(self,args)},ms);
  };
}

async function api(path,opts){
  var url=CFG.api+path;
  var res=await fetch(url,Object.assign({headers:{"Content-Type":"application/json"}},opts||{}));
  return res.json();
}

/* ── State ──────────────────────────────────────────────────────────── */

var state={
  open:false,
  tab:"home",
  searchQuery:"",
  searchResults:[],
  contactForm:{name:"",email:"",message:""},
  contactStatus:null,
  chatMessages:[],
  chatLoading:false,
  announcements:[],
  announcementsLoaded:false
};

/* ── SVG Icons ──────────────────────────────────────────────────────── */

var ICONS={
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  mail:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  send:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
};

function svgIcon(name,cls){
  var s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 24 24");
  s.setAttribute("width","20");s.setAttribute("height","20");
  s.setAttribute("fill","none");s.setAttribute("stroke","currentColor");
  s.setAttribute("stroke-width","2");s.setAttribute("stroke-linecap","round");
  s.setAttribute("stroke-linejoin","round");
  if(cls)s.setAttribute("class",cls);
  s.innerHTML=ICONS[name]||"";
  return s;
}

/* ── Tab Labels ─────────────────────────────────────────────────────── */

var TAB_LABELS={home:"Home",search:"Search",contact:"Contact",chat:"Chat",status:"Status"};
var TAB_ICONS={home:"home",search:"search",contact:"mail",chat:"chat",status:"bell"};

/* ── Renderers ──────────────────────────────────────────────────────── */

function renderHome(){
  var frag=document.createDocumentFragment();
  frag.appendChild(h("p",{className:"sp-greeting"},CFG.greeting));
  frag.appendChild(h("p",{className:"sp-subtext"},"Choose a topic below or browse our resources."));

  var links=h("div",{className:"sp-quick-links"});
  if(CFG.features.docs){
    var a=h("a",{className:"sp-qlink",onClick:function(){setTab("search")}});
    a.appendChild(svgIcon("search","sp-qlink-icon"));
    a.appendChild(h("span",{className:"sp-qlink-label"},"Search Knowledge Base"));
    links.appendChild(a);
  }
  if(CFG.features.contact){
    var b=h("a",{className:"sp-qlink",onClick:function(){setTab("contact")}});
    b.appendChild(svgIcon("mail","sp-qlink-icon"));
    b.appendChild(h("span",{className:"sp-qlink-label"},"Send Us a Message"));
    links.appendChild(b);
  }
  if(CFG.features.chat){
    var c=h("a",{className:"sp-qlink",onClick:function(){setTab("chat")}});
    c.appendChild(svgIcon("chat","sp-qlink-icon"));
    c.appendChild(h("span",{className:"sp-qlink-label"},"Chat with AI Assistant"));
    links.appendChild(c);
  }
  if(CFG.features.announcements){
    var d=h("a",{className:"sp-qlink",onClick:function(){setTab("status")}});
    d.appendChild(svgIcon("bell","sp-qlink-icon"));
    d.appendChild(h("span",{className:"sp-qlink-label"},"System Status"));
    links.appendChild(d);
  }
  frag.appendChild(links);
  return frag;
}

function renderSearch(){
  var frag=document.createDocumentFragment();
  var input=h("input",{
    className:"sp-search-input",
    type:"text",
    placeholder:"Search articles...",
    value:state.searchQuery,
    onInput:debounce(function(e){
      state.searchQuery=e.target.value;
      if(state.searchQuery.length>=2)doSearch();
      else{state.searchResults=[];renderBody()}
    },300)
  });
  frag.appendChild(input);

  var results=h("div",{className:"sp-results"});
  if(state.searchResults.length){
    state.searchResults.forEach(function(r){
      var el=h("a",{className:"sp-result",href:r.url||"#",target:"_blank"});
      el.appendChild(h("p",{className:"sp-result-title"},r.title||"Untitled"));
      if(r.excerpt)el.appendChild(h("p",{className:"sp-result-excerpt"},r.excerpt));
      results.appendChild(el);
    });
  }else if(state.searchQuery.length>=2){
    results.appendChild(h("p",{className:"sp-no-results"},"No articles found."));
  }
  frag.appendChild(results);
  return frag;
}

function renderContact(){
  var frag=document.createDocumentFragment();
  if(state.contactStatus==="success"){
    frag.appendChild(h("div",{className:"sp-msg success"},"Message sent! We'll get back to you soon."));
    var again=h("button",{className:"sp-submit",style:"margin-top:10px",onClick:function(){state.contactStatus=null;state.contactForm={name:"",email:"",message:""};renderBody()}});
    again.textContent="Send Another";
    frag.appendChild(again);
    return frag;
  }
  var form=h("div",{className:"sp-form"});

  var f1=h("div",{className:"sp-field"});
  f1.appendChild(h("label",null,"Name"));
  f1.appendChild(h("input",{type:"text",value:state.contactForm.name,onInput:function(e){state.contactForm.name=e.target.value}}));
  form.appendChild(f1);

  var f2=h("div",{className:"sp-field"});
  f2.appendChild(h("label",null,"Email"));
  f2.appendChild(h("input",{type:"email",value:state.contactForm.email,onInput:function(e){state.contactForm.email=e.target.value}}));
  form.appendChild(f2);

  var f3=h("div",{className:"sp-field"});
  f3.appendChild(h("label",null,"Message"));
  f3.appendChild(h("textarea",{rows:"4",value:state.contactForm.message,onInput:function(e){state.contactForm.message=e.target.value}}));
  form.appendChild(f3);

  if(state.contactStatus==="error"){
    form.appendChild(h("div",{className:"sp-msg error"},"Failed to send. Please try again."));
  }

  var btn=h("button",{className:"sp-submit",onClick:submitContact});
  btn.textContent="Send Message";
  form.appendChild(btn);

  frag.appendChild(form);
  return frag;
}

function renderChat(){
  var frag=document.createDocumentFragment();

  var msgs=h("div",{className:"sp-chat-messages",id:"sp-chat-msgs"});
  if(!state.chatMessages.length){
    msgs.appendChild(h("div",{className:"sp-chat-bubble assistant"},"Hi! How can I help you today?"));
  }
  state.chatMessages.forEach(function(m){
    msgs.appendChild(h("div",{className:"sp-chat-bubble "+m.role},m.text));
  });
  if(state.chatLoading){
    msgs.appendChild(h("div",{className:"sp-chat-bubble assistant"},"Thinking..."));
  }
  frag.appendChild(msgs);

  var row=h("div",{className:"sp-chat-input-row"});
  var chatInput=h("input",{
    className:"sp-chat-input",
    type:"text",
    placeholder:"Type a message...",
    id:"sp-chat-field",
    onKeydown:function(e){if(e.key==="Enter"&&!e.shiftKey)sendChat()}
  });
  row.appendChild(chatInput);
  var sendBtn=h("button",{className:"sp-chat-send",onClick:sendChat});
  sendBtn.textContent="Send";
  row.appendChild(sendBtn);
  frag.appendChild(row);

  setTimeout(function(){
    var c=document.getElementById("sp-chat-msgs");
    if(c)c.scrollTop=c.scrollHeight;
  },0);

  return frag;
}

function renderStatus(){
  var frag=document.createDocumentFragment();
  if(!state.announcementsLoaded){
    frag.appendChild(h("p",{className:"sp-empty"},"Loading..."));
    loadAnnouncements();
    return frag;
  }
  if(!state.announcements.length){
    frag.appendChild(h("p",{className:"sp-empty"},"All systems operational. No announcements."));
    return frag;
  }
  var list=h("div",{className:"sp-announcements"});
  state.announcements.forEach(function(a){
    var card=h("div",{className:"sp-announce"});
    var header=h("div",{className:"sp-announce-header"});
    header.appendChild(h("span",{className:"sp-badge "+a.type},a.type));
    header.appendChild(h("span",{className:"sp-announce-title"},a.title));
    card.appendChild(header);
    card.appendChild(h("p",{className:"sp-announce-msg"},a.message));
    list.appendChild(card);
  });
  frag.appendChild(list);
  return frag;
}

/* ── Actions ────────────────────────────────────────────────────────── */

async function doSearch(){
  try{
    var data=await api("/public/support/"+CFG.slug+"/search",{
      method:"POST",
      body:JSON.stringify({query:state.searchQuery})
    });
    state.searchResults=(data&&data.data)||[];
  }catch(e){state.searchResults=[]}
  renderBody();
}

async function submitContact(){
  var f=state.contactForm;
  if(!f.name||!f.email||!f.message)return;
  try{
    var data=await api("/public/support/"+CFG.slug+"/contact",{
      method:"POST",
      body:JSON.stringify(f)
    });
    state.contactStatus=(data&&data.success)?"success":"error";
  }catch(e){state.contactStatus="error"}
  renderBody();
}

async function sendChat(){
  var input=document.getElementById("sp-chat-field");
  if(!input)return;
  var text=input.value.trim();
  if(!text||state.chatLoading)return;
  input.value="";
  state.chatMessages.push({role:"user",text:text});
  state.chatLoading=true;
  renderBody();
  try{
    var data=await api("/public/support/"+CFG.slug+"/chat",{
      method:"POST",
      body:JSON.stringify({message:text,history:state.chatMessages.slice(-20)})
    });
    state.chatMessages.push({role:"assistant",text:(data&&data.data&&data.data.reply)||"Sorry, I could not process that."});
  }catch(e){
    state.chatMessages.push({role:"assistant",text:"Connection error. Please try again."});
  }
  state.chatLoading=false;
  renderBody();
}

async function loadAnnouncements(){
  try{
    var data=await api("/public/support/"+CFG.slug+"/announcements");
    state.announcements=(data&&data.data)||[];
  }catch(e){state.announcements=[]}
  state.announcementsLoaded=true;
  renderBody();
}

/* ── DOM Rendering ──────────────────────────────────────────────────── */

function renderBody(){
  var body=document.getElementById("sp-body");
  if(!body)return;
  body.innerHTML="";
  var content;
  switch(state.tab){
    case "search":content=renderSearch();break;
    case "contact":content=renderContact();break;
    case "chat":content=renderChat();break;
    case "status":content=renderStatus();break;
    default:content=renderHome();
  }
  body.appendChild(content);
}

function setTab(t){
  state.tab=t;
  var tabs=document.querySelectorAll(".sp-tab");
  tabs.forEach(function(el){el.classList.toggle("active",el.dataset.tab===t)});
  renderBody();
}

function toggle(){
  state.open=!state.open;
  var panel=document.getElementById("ncms-sp-panel");
  if(panel)panel.classList.toggle("open",state.open);
}

/* ── Init ───────────────────────────────────────────────────────────── */

var style=document.createElement("style");
style.textContent=css;
document.head.appendChild(style);

var root=h("div",{id:"ncms-support-root"});

// Floating button
var btn=h("button",{id:"ncms-sp-btn","aria-label":"Open support panel",onClick:toggle});
btn.appendChild(svgIcon("help"));
root.appendChild(btn);

// Panel
var panel=h("div",{id:"ncms-sp-panel"});

// Header
var header=h("div",{className:"sp-header"});
header.appendChild(h("h3",null,CFG.title));
var closeBtn=h("button",{className:"sp-close","aria-label":"Close",onClick:toggle});
closeBtn.appendChild(svgIcon("x"));
header.appendChild(closeBtn);
panel.appendChild(header);

// Tabs
var tabBar=h("div",{className:"sp-tabs"});
CFG.tabs.forEach(function(t){
  var tab=h("button",{className:"sp-tab"+(t==="home"?" active":""),"data-tab":t,onClick:function(){setTab(t)}});
  tab.textContent=TAB_LABELS[t]||t;
  tabBar.appendChild(tab);
});
panel.appendChild(tabBar);

// Body
var body=h("div",{className:"sp-body",id:"sp-body"});
panel.appendChild(body);

root.appendChild(panel);
document.body.appendChild(root);

renderBody();
})();`;
}
