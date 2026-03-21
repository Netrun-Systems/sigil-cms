/**
 * Resonance Tracking Snippet Generator
 *
 * Produces a self-contained JavaScript snippet (~2KB minified) that tracks
 * per-block engagement on the public site. Uses IntersectionObserver,
 * navigator.sendBeacon, and crypto.randomUUID — no cookies, no localStorage,
 * no PII collection.
 */

/**
 * Returns the Resonance tracking snippet as a JavaScript string.
 *
 * The snippet:
 * - Uses IntersectionObserver to detect when blocks enter/exit viewport
 * - Tracks time each block spends in viewport (via timestamps)
 * - Detects clicks on interactive elements within blocks (buttons, links)
 * - Detects the "bounce point" (last block visible when page unloads)
 * - Generates a random session hash (crypto.randomUUID()) — no cookies, no localStorage
 * - Batches events and sends via navigator.sendBeacon on page unload
 * - Falls back to fetch() if sendBeacon unavailable
 * - Blocks are identified by data-block-id attribute (already rendered by BlockRenderer)
 * - Sends to POST /api/v1/public/resonance/:siteSlug/events
 */
export function generateTrackingSnippet(siteSlug: string, apiBase: string): string {
  return `(function(){
"use strict";
if(typeof IntersectionObserver==="undefined")return;
var endpoint="${apiBase}/api/v1/public/resonance/${siteSlug}/events";
var sid=typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
var events=[];
var blockTimers={};
var lastVisibleBlockId=null;
var maxEvents=200;

function queueEvent(pageId,blockId,blockType,eventType,value){
if(events.length>=maxEvents)return;
events.push({pageId:pageId,blockId:blockId,blockType:blockType,eventType:eventType,value:value});
}

function getPageId(){
var el=document.querySelector("[data-page-id]");
return el?el.getAttribute("data-page-id"):"unknown";
}

function flush(){
if(events.length===0)return;
var payload=JSON.stringify({sessionHash:sid,events:events.splice(0,50)});
if(navigator.sendBeacon){
navigator.sendBeacon(endpoint,new Blob([payload],{type:"application/json"}));
}else{
fetch(endpoint,{method:"POST",body:payload,headers:{"Content-Type":"application/json"},keepalive:true}).catch(function(){});
}
}

var blocks=document.querySelectorAll("[data-block-id]");
if(blocks.length===0)return;

var pageId=getPageId();

var observer=new IntersectionObserver(function(entries){
entries.forEach(function(entry){
var el=entry.target;
var blockId=el.getAttribute("data-block-id");
var blockType=el.getAttribute("data-block-type")||"unknown";
if(entry.isIntersecting){
if(!blockTimers[blockId]){
queueEvent(pageId,blockId,blockType,"impression",1);
}
blockTimers[blockId]=Date.now();
lastVisibleBlockId={id:blockId,type:blockType};
}else if(blockTimers[blockId]){
var elapsed=Date.now()-blockTimers[blockId];
if(elapsed>500){
queueEvent(pageId,blockId,blockType,"viewport_time",elapsed);
}
blockTimers[blockId]=null;
}
});
},{threshold:0.3});

blocks.forEach(function(block){observer.observe(block);});

document.addEventListener("click",function(e){
var target=e.target;
while(target&&target!==document.body){
if(target.tagName==="A"||target.tagName==="BUTTON"||target.getAttribute&&target.getAttribute("role")==="button"){
var blockEl=target.closest("[data-block-id]");
if(blockEl){
var blockId=blockEl.getAttribute("data-block-id");
var blockType=blockEl.getAttribute("data-block-type")||"unknown";
queueEvent(pageId,blockId,blockType,"click",1);
}
break;
}
target=target.parentElement;
}
},true);

function onUnload(){
var bk;
for(bk in blockTimers){
if(blockTimers[bk]){
var el=document.querySelector("[data-block-id='"+bk+"']");
var bt=el?el.getAttribute("data-block-type")||"unknown":"unknown";
var elapsed=Date.now()-blockTimers[bk];
if(elapsed>500){
queueEvent(pageId,bk,bt,"viewport_time",elapsed);
}
}
}
if(lastVisibleBlockId){
queueEvent(pageId,lastVisibleBlockId.id,lastVisibleBlockId.type,"bounce_point",1);
}
flush();
}

var scrollDepths={};
function checkScrollDepth(){
var scrollTop=window.pageYOffset||document.documentElement.scrollTop;
var docHeight=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
var winHeight=window.innerHeight;
blocks.forEach(function(block){
var blockId=block.getAttribute("data-block-id");
var blockType=block.getAttribute("data-block-type")||"unknown";
var rect=block.getBoundingClientRect();
var blockTop=rect.top+scrollTop;
var blockMid=blockTop+rect.height/2;
if(scrollTop+winHeight>blockMid){
var depth=Math.min(100,Math.round(((scrollTop+winHeight)/docHeight)*100));
if(!scrollDepths[blockId]||depth>scrollDepths[blockId]){
scrollDepths[blockId]=depth;
queueEvent(pageId,blockId,blockType,"scroll_depth",depth);
}
}
});
}

var scrollTimer=null;
window.addEventListener("scroll",function(){
if(scrollTimer)clearTimeout(scrollTimer);
scrollTimer=setTimeout(checkScrollDepth,300);
},{passive:true});

window.addEventListener("visibilitychange",function(){
if(document.visibilityState==="hidden")onUnload();
});
window.addEventListener("pagehide",onUnload);

setInterval(flush,15000);
})();`;
}
