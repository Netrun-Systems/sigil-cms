/**
 * Embeddable Chat Widget Snippet Generator
 *
 * Produces a self-contained JavaScript snippet that renders a Charlotte
 * AI chat widget on any page — similar to Intercom/Drift embed scripts.
 * The output is a single string of JavaScript (~5KB minified) that:
 *
 * - Creates a floating chat button (configurable position)
 * - Expands to a 400x600 chat panel on click
 * - Sends messages to Charlotte via REST (POST /chat proxy)
 * - Renders markdown responses with basic formatting
 * - Shows typing indicators during AI response
 * - Goes full-screen on mobile viewports
 * - Includes a "Powered by Sigil" footer
 */

export interface WidgetConfig {
  siteSlug: string;
  apiBase: string;
  charlotteApi: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  greeting?: string;
  placeholder?: string;
}

export function generateWidgetSnippet(config: WidgetConfig): string {
  const {
    siteSlug,
    apiBase,
    position = 'bottom-right',
    primaryColor = '#90b9ab',
    greeting = 'Hi! How can I help you today?',
    placeholder = 'Type a message...',
  } = config;

  const posRight = position === 'bottom-right';

  // The snippet is a self-executing function that creates the widget DOM,
  // styles, and event handlers without any external dependencies.
  return `(function(){
"use strict";
var S="${siteSlug}",A="${apiBase}",P="${primaryColor}",G=${JSON.stringify(greeting)},PH=${JSON.stringify(placeholder)};
var d=document,b=d.body;
function ce(t,c,s){var e=d.createElement(t);if(c)e.className=c;if(s)Object.assign(e.style,s);return e}
function esc(h){var t=d.createElement("div");t.textContent=h;return t.innerHTML}

/* --- Styles --- */
var style=ce("style");
style.textContent=\`
.sigil-w-btn{position:fixed;${posRight ? 'right:20px' : 'left:20px'};bottom:20px;width:56px;height:56px;border-radius:50%;background:\${P};color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);z-index:99998;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
.sigil-w-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.3)}
.sigil-w-btn svg{width:28px;height:28px;fill:currentColor}
.sigil-w-panel{position:fixed;${posRight ? 'right:20px' : 'left:20px'};bottom:88px;width:400px;height:600px;max-height:calc(100vh - 100px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}
.sigil-w-panel.open{display:flex}
.sigil-w-hdr{background:\${P};color:#fff;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.sigil-w-hdr h3{margin:0;font-size:16px;font-weight:600}
.sigil-w-close{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;padding:4px}
.sigil-w-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.sigil-w-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word}
.sigil-w-msg.bot{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}
.sigil-w-msg.user{background:\${P};color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.sigil-w-msg p{margin:4px 0}.sigil-w-msg code{background:rgba(0,0,0,.08);padding:1px 4px;border-radius:3px;font-size:13px}
.sigil-w-msg pre{background:rgba(0,0,0,.06);padding:8px;border-radius:6px;overflow-x:auto;font-size:13px}
.sigil-w-msg pre code{background:none;padding:0}
.sigil-w-typing{display:flex;gap:4px;padding:10px 14px;align-self:flex-start}
.sigil-w-typing span{width:8px;height:8px;background:#9ca3af;border-radius:50%;animation:sigil-bounce 1.2s infinite}
.sigil-w-typing span:nth-child(2){animation-delay:.2s}
.sigil-w-typing span:nth-child(3){animation-delay:.4s}
@keyframes sigil-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
.sigil-w-input{display:flex;padding:12px;border-top:1px solid #e5e7eb;gap:8px;flex-shrink:0}
.sigil-w-input input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;font-family:inherit}
.sigil-w-input input:focus{border-color:\${P}}
.sigil-w-input button{background:\${P};color:#fff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-size:14px;font-weight:500;white-space:nowrap}
.sigil-w-input button:disabled{opacity:.5;cursor:not-allowed}
.sigil-w-footer{text-align:center;padding:6px;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;flex-shrink:0}
.sigil-w-footer a{color:#9ca3af;text-decoration:none}
.sigil-w-footer a:hover{color:#6b7280}
@media(max-width:480px){
.sigil-w-panel{width:100%;height:100%;bottom:0;${posRight ? 'right:0' : 'left:0'};border-radius:0;max-height:100vh}
.sigil-w-btn{bottom:16px;${posRight ? 'right:16px' : 'left:16px'}}
}\`;
d.head.appendChild(style);

/* --- Chat icon SVG --- */
var chatSvg='<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
var closeSvg='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

/* --- DOM --- */
var btn=ce("button","sigil-w-btn");
btn.innerHTML=chatSvg;
btn.setAttribute("aria-label","Open chat");

var panel=ce("div","sigil-w-panel");
var hdr=ce("div","sigil-w-hdr");
hdr.innerHTML='<h3>AI Assistant</h3>';
var closeBtn=ce("button","sigil-w-close");
closeBtn.innerHTML=closeSvg;
closeBtn.setAttribute("aria-label","Close chat");
hdr.appendChild(closeBtn);

var msgs=ce("div","sigil-w-msgs");
var inputBar=ce("div","sigil-w-input");
var inp=ce("input");
inp.type="text";inp.placeholder=PH;inp.setAttribute("aria-label","Chat message");
var sendBtn=ce("button");
sendBtn.textContent="Send";

var footer=ce("div","sigil-w-footer");
footer.innerHTML='Powered by <a href="https://sigil.cms" target="_blank" rel="noopener">Sigil</a>';

inputBar.appendChild(inp);
inputBar.appendChild(sendBtn);
panel.appendChild(hdr);
panel.appendChild(msgs);
panel.appendChild(inputBar);
panel.appendChild(footer);
b.appendChild(btn);
b.appendChild(panel);

/* --- State --- */
var isOpen=false,isSending=false;

function toggle(){
  isOpen=!isOpen;
  panel.classList.toggle("open",isOpen);
  btn.innerHTML=isOpen?closeSvg:chatSvg;
  if(isOpen&&msgs.children.length===0)addMsg(G,"bot");
  if(isOpen)inp.focus();
}
btn.onclick=toggle;
closeBtn.onclick=toggle;

function addMsg(text,role){
  var m=ce("div","sigil-w-msg "+role);
  m.innerHTML=role==="bot"?renderMd(text):esc(text);
  msgs.appendChild(m);
  msgs.scrollTop=msgs.scrollHeight;
  return m;
}

function showTyping(){
  var t=ce("div","sigil-w-typing");
  t.id="sigil-typing";
  t.innerHTML="<span></span><span></span><span></span>";
  msgs.appendChild(t);
  msgs.scrollTop=msgs.scrollHeight;
}
function hideTyping(){var t=d.getElementById("sigil-typing");if(t)t.remove();}

/* --- Minimal Markdown renderer --- */
function renderMd(t){
  return t
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g,function(_,c){return "<pre><code>"+c.trim()+"</code></pre>"})
    .replace(/\`([^\`]+)\`/g,"<code>$1</code>")
    .replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>")
    .replace(/\\*(.+?)\\*/g,"<em>$1</em>")
    .replace(/\\n/g,"<br>");
}

/* --- Send --- */
async function send(){
  var text=inp.value.trim();
  if(!text||isSending)return;
  isSending=true;sendBtn.disabled=true;
  addMsg(text,"user");
  inp.value="";
  showTyping();
  try{
    var r=await fetch(A+"/api/v1/public/charlotte/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:text,siteSlug:S})
    });
    hideTyping();
    if(!r.ok)throw new Error("Request failed");
    var j=await r.json();
    addMsg(j.response||"Sorry, I couldn\\'t process that.","bot");
  }catch(e){
    hideTyping();
    addMsg("Sorry, something went wrong. Please try again.","bot");
  }
  isSending=false;sendBtn.disabled=false;
  inp.focus();
}

sendBtn.onclick=send;
inp.onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
})();`;
}
