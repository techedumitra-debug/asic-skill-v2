import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const viewerParams = new URLSearchParams(location.search);
const lessonId = viewerParams.get("id");
const MATERIAL_SERVER = "https://asic-skill-material-server.asic-skill-materials.workers.dev";
let viewerSession = null;
let pdfDoc = null;
let pageNum = 1;
let zoom = 1;
const rotation = 0;
let watermarkText = "ASIC-Skill Premium";
let pageObserver = null;
let resizeTimer = null;
let scrollRaf = 0;
let navTargetPage = null;
let zoomBusy = false;
const pageMetrics = new Map();
let renderGeneration = 0;

function googleDrivePreviewUrl(url){
  try { const u=new URL(url); if(!/(^|\.)drive\.google\.com$/i.test(u.hostname)) return null; let id=null; const m=u.pathname.match(/\/file\/d\/([^/]+)/); if(m) id=m[1]; if(!id) id=u.searchParams.get("id"); return id?`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`:null; } catch { return null; }
}

function setPageIndicator(n){
  if(!pdfDoc) return;
  pageNum=Math.max(1,Math.min(pdfDoc.numPages,n));
  const input=document.getElementById("pdf-page-input");
  if(document.activeElement!==input) input.value=String(pageNum);
}

function pageNearestViewerCenter(){
  const stage=document.getElementById("pdf-stage");
  if(!stage || !pdfDoc) return pageNum;
  const stageRect=stage.getBoundingClientRect();
  const centerY=stageRect.top + stage.clientHeight/2;
  let best=null;
  document.querySelectorAll(".pdf-page-wrap").forEach(el=>{
    const r=el.getBoundingClientRect();
    const d=Math.abs((r.top+r.bottom)/2-centerY);
    if(!best || d<best.d) best={n:Number(el.dataset.page),d};
  });
  return best?.n || pageNum;
}

function syncPageFromScroll(){
  if(navTargetPage!==null || zoomBusy) return;
  setPageIndicator(pageNearestViewerCenter());
}

function fitScaleForPage(page){
  const stage=document.getElementById("pdf-stage");
  const base=page.getViewport({scale:1,rotation});
  // Fit to the real visible reading width. No artificial 100%/1500px cap.
  const cs=getComputedStyle(stage);
  const horizontalPadding=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
  const available=Math.max(220,stage.clientWidth-horizontalPadding-4);
  return available/base.width;
}

function captureReadingAnchor(clientY=null){
  const stage=document.getElementById("pdf-stage");
  const sr=stage.getBoundingClientRect();
  const y=clientY==null ? sr.top+stage.clientHeight/2 : Math.max(sr.top,Math.min(sr.bottom,clientY));
  let best=null;
  document.querySelectorAll(".pdf-page-wrap").forEach(el=>{
    const r=el.getBoundingClientRect();
    const inside=y>=r.top && y<=r.bottom;
    const d=inside?0:Math.min(Math.abs(y-r.top),Math.abs(y-r.bottom));
    if(!best || d<best.d){
      const ratio=Math.max(0,Math.min(1,(y-r.top)/Math.max(1,r.height)));
      best={page:Number(el.dataset.page),ratio,d,viewportOffset:y-sr.top};
    }
  });
  return best || {page:pageNum,ratio:.5,viewportOffset:stage.clientHeight/2};
}

function restoreReadingAnchor(anchor){
  const stage=document.getElementById("pdf-stage");
  const target=document.querySelector(`.pdf-page-wrap[data-page="${anchor.page}"]`);
  if(!target) return;
  const top=target.offsetTop + anchor.ratio*target.offsetHeight - anchor.viewportOffset;
  stage.scrollTo({top:Math.max(0,top),left:stage.scrollLeft,behavior:"auto"});
  setPageIndicator(anchor.page);
}

async function renderPageInto(pageWrap, force=false){
  if(!pdfDoc || !pageWrap || pageWrap.dataset.rendering==="1") return;
  const num=Number(pageWrap.dataset.page);
  const renderKey=`${zoom.toFixed(3)}:${Math.round(document.getElementById("pdf-stage").clientWidth)}`;
  if(pageWrap.dataset.renderKey===renderKey && !force) return;
  pageWrap.dataset.rendering="1";
  const generation=renderGeneration;
  try{
    const page=await pdfDoc.getPage(num);
    const fitScale=fitScaleForPage(page);
    const viewport=page.getViewport({scale:fitScale*zoom,rotation});
    const dpr=Math.min(window.devicePixelRatio||1,2);

    // Render into an off-DOM canvas first. The currently visible canvas stays
    // untouched until the new bitmap is complete, eliminating zoom flashes.
    const buffer=document.createElement("canvas");
    buffer.width=Math.max(1,Math.floor(viewport.width*dpr));
    buffer.height=Math.max(1,Math.floor(viewport.height*dpr));
    const bctx=buffer.getContext("2d",{alpha:false});
    await page.render({canvasContext:bctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise;
    if(generation!==renderGeneration) return;

    const canvas=pageWrap.querySelector("canvas");
    canvas.width=buffer.width;
    canvas.height=buffer.height;
    canvas.style.width=`${viewport.width}px`;
    canvas.style.height=`${viewport.height}px`;
    canvas.getContext("2d",{alpha:false}).drawImage(buffer,0,0);
    pageWrap.dataset.renderKey=renderKey;
  }catch(e){ console.error("PDF page render failed", num, e); }
  finally{ pageWrap.dataset.rendering="0"; }
}

function sizeWrapForCurrentView(wrap){
  const metric=pageMetrics.get(Number(wrap.dataset.page));
  const stage=document.getElementById("pdf-stage");
  if(!metric || !stage) return;
  const cs=getComputedStyle(stage);
  const horizontalPadding=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
  const available=Math.max(220,stage.clientWidth-horizontalPadding-4);
  const fit=available/metric.width;
  const width=metric.width*fit*zoom;
  const height=metric.height*fit*zoom;
  wrap.style.width=`${width}px`;
  wrap.style.height=`${height}px`;
  wrap.style.minHeight=`${height}px`;
  const canvas=wrap.querySelector("canvas");
  // CSS-resize the existing bitmap immediately while the sharper replacement
  // renders in the background. This keeps document geometry stable.
  if(canvas){ canvas.style.width=`${width}px`; canvas.style.height=`${height}px`; }
}

function layoutAllPagesSync(){
  document.querySelectorAll(".pdf-page-wrap").forEach(sizeWrapForCurrentView);
}

function renderNearViewport(){
  const stage=document.getElementById("pdf-stage");
  if(!stage) return;
  const sr=stage.getBoundingClientRect();
  document.querySelectorAll(".pdf-page-wrap").forEach(wrap=>{
    const r=wrap.getBoundingClientRect();
    if(r.bottom>=sr.top-900 && r.top<=sr.bottom+900) renderPageInto(wrap,true);
  });
}

function createWatermarks(wrap){
  const positions=["wm-one","wm-two","wm-three"];
  positions.forEach(cls=>{
    const wm=document.createElement("div");
    wm.className=`pdf-watermark ${cls}`;
    wm.textContent=watermarkText;
    wm.setAttribute("aria-hidden","true");
    wrap.appendChild(wm);
  });
}

async function buildContinuousPages(){
  const pages=document.getElementById("pdf-pages");
  pages.innerHTML="";
  pageMetrics.clear();
  if(pageObserver) pageObserver.disconnect();
  pageObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    visible.forEach(e=>renderPageInto(e.target));
    if(visible.length && navTargetPage===null) syncPageFromScroll();
  },{root:document.getElementById("pdf-stage"),rootMargin:"900px 0px",threshold:[0,.05,.25,.5,.75]});

  // Read each page's unscaled dimensions once. These cached dimensions let us
  // resize every page container synchronously during zoom, so the scrollable
  // document never collapses and jumps upward.
  for(let n=1;n<=pdfDoc.numPages;n++){
    const page=await pdfDoc.getPage(n);
    const base=page.getViewport({scale:1,rotation});
    pageMetrics.set(n,{width:base.width,height:base.height});
    const wrap=document.createElement("article");
    wrap.className="pdf-page-wrap"; wrap.dataset.page=String(n);
    wrap.innerHTML=`<canvas aria-label="Premium PDF page ${n}"></canvas><span class="page-chip">${n}</span>`;
    createWatermarks(wrap);
    pages.appendChild(wrap);
    sizeWrapForCurrentView(wrap);
    pageObserver.observe(wrap);
  }
  renderNearViewport();
}

async function openPremiumPdf(arrayBuffer){
  pdfDoc=await pdfjsLib.getDocument({data:new Uint8Array(arrayBuffer)}).promise;
  document.getElementById("pdf-page-count").textContent=String(pdfDoc.numPages);
  const input=document.getElementById("pdf-page-input"); input.max=String(pdfDoc.numPages);
  document.getElementById("premium-pdf-viewer").hidden=false;
  pageNum=1; zoom=1; document.getElementById("pdf-zoom-label").textContent="100%";
  await buildContinuousPages();
}

function goToPage(n, behavior="smooth"){
  if(!pdfDoc) return;
  n=Math.max(1,Math.min(pdfDoc.numPages,Number(n)||pageNum));
  const stage=document.getElementById("pdf-stage");
  const target=document.querySelector(`.pdf-page-wrap[data-page="${n}"]`);
  if(!stage || !target) return;
  renderPageInto(target);
  navTargetPage=n;
  setPageIndicator(n);
  const top=Math.max(0, target.offsetTop - 12);
  stage.scrollTo({top,behavior});
  window.setTimeout(()=>{ navTargetPage=null; syncPageFromScroll(); }, behavior==="smooth"?520:80);
}

function stepPage(delta){
  if(!pdfDoc) return;
  const current=pageNearestViewerCenter();
  goToPage(current+delta,"smooth");
}

async function relayoutPreserveAnchor(clientY=null){
  if(!pdfDoc || zoomBusy) return;
  const anchor=captureReadingAnchor(clientY);
  zoomBusy=true;
  navTargetPage=anchor.page;
  renderGeneration++;
  try{
    // Critical v23 behavior: resize existing page boxes in place. Never remove
    // or rebuild them during zoom/fullscreen changes.
    layoutAllPagesSync();
    restoreReadingAnchor(anchor);
    requestAnimationFrame(()=>{
      restoreReadingAnchor(anchor);
      renderNearViewport();
    });
  } finally {
    zoomBusy=false;
    navTargetPage=null;
  }
}


/* v30.3 — optional Google Forms prefill from the authenticated Supabase user.
   Configure the Google Forms entry IDs below after adding Name and Email questions.
   Leave either value blank to disable that prefill field. */
const GOOGLE_FORM_PREFILL = {
  nameEntry: "",   // example: "entry.123456789"
  emailEntry: ""   // example: "entry.987654321"
};

function currentStudentIdentity(){
  const user=viewerSession?.user;
  if(!user) return {name:"",email:""};
  const meta=user.user_metadata||{};
  const name=(meta.full_name||meta.name||meta.display_name||"").trim();
  const email=(user.email||"").trim();
  return {name,email};
}

function applyStudentPrefill(url){
  try{
    const u=new URL(url);
    if(u.hostname!=="docs.google.com") return url;
    const identity=currentStudentIdentity();
    if(GOOGLE_FORM_PREFILL.nameEntry && identity.name){
      u.searchParams.set(GOOGLE_FORM_PREFILL.nameEntry, identity.name);
    }
    if(GOOGLE_FORM_PREFILL.emailEntry && identity.email){
      u.searchParams.set(GOOGLE_FORM_PREFILL.emailEntry, identity.email);
    }
    return u.toString();
  }catch{return url;}
}

function quizEmbedUrl(value){
  try{
    const u=new URL(value);
    if(u.protocol!=="https:") return null;

    // Google Forms: accept responder/preview URLs and force embedded mode.
    if(u.hostname==="docs.google.com" && /^\/forms\/d\/(?:e\/)?[^/]+\/(?:viewform|preview)$/.test(u.pathname)){
      u.pathname=u.pathname.replace(/\/preview$/, "/viewform");
      u.searchParams.set("embedded","true");
      return applyStudentPrefill(u.toString());
    }

    // Backward compatibility for any Tally quizzes already saved in the database.
    if(u.hostname==="tally.so" || u.hostname.endsWith(".tally.so")){
      const m=u.pathname.match(/^\/(?:r|embed)\/([^/?#]+)/);
      if(!m) return null;
      return `https://tally.so/embed/${encodeURIComponent(m[1])}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
    }
    return null;
  }catch{return null;}
}

async function openEmbeddedQuiz(material){
  const message=document.getElementById("viewer-message");
  if(material.access_level==="premium"){
    if(!viewerSession){ location.href="signin.html"; return; }
    if(!(await canOpenPremiumCourse(material.course_id))){ message.textContent="Premium access is required for this quiz."; return; }
  }
  const identity=currentStudentIdentity();
  const identityBox=document.getElementById("quiz-student-identity");
  if(identityBox && viewerSession?.user){
    document.getElementById("quiz-student-name").textContent=identity.name||"ASIC-Skill student";
    document.getElementById("quiz-student-email").textContent=identity.email||"";
    identityBox.hidden=false;
  }
  const url=quizEmbedUrl(material.drive_url);
  if(!url){ message.textContent="This quiz does not have a valid Google Forms responder URL."; return; }
  const quizFrame=document.getElementById("tally-frame");
  // v32.5: Do not infer submission from Google iframe load/navigation events.
  // Google Forms performs internal cross-origin navigations during normal use,
  // which caused false “Processing your result…” states in v32.3/v32.4.
  // Supabase quiz_attempts is now the only authoritative submission signal.
  quizFrame.onload=null;
  quizFrame.src=url;
  document.getElementById("tally-viewer").hidden=false;
  const resultBtn=document.getElementById("quiz-check-result");
  if(resultBtn) resultBtn.onclick=()=>loadQuizResult(material, true);
  startQuizResultPolling(material);
  message.hidden=true;
}

let quizResultPollTimer=null;
let lastQuizAttemptStamp=null;
let quizViewerOpenedAt=0;


function startQuizResultPolling(material){
  if(quizResultPollTimer) clearInterval(quizResultPollTimer);
  quizViewerOpenedAt=Date.now();
  lastQuizAttemptStamp=null;
  // Show an existing latest result immediately, then keep checking for a newly submitted attempt.
  loadQuizResult(material, false);
  quizResultPollTimer=setInterval(()=>loadQuizResult(material, false),2000);
}

async function loadQuizResult(material, manual=false){
  const btn=document.getElementById("quiz-check-result");
  const status=document.getElementById("quiz-result-status");
  const card=document.getElementById("quiz-result-card");
  if(!viewerSession?.user){ location.href="signin.html"; return; }
  if(manual){ btn.disabled=true; status.textContent="Checking your latest result…"; }
  else if(!lastQuizAttemptStamp){ status.textContent="Waiting for your quiz submission…"; }
  const {data,error}=await supabaseClient.from("quiz_attempts")
    .select("score,max_score,percentage,submitted_at")
    .eq("user_id",viewerSession.user.id).eq("material_id",material.id)
    .order("submitted_at",{ascending:false}).limit(1).maybeSingle();
  if(manual) btn.disabled=false;
  if(error){ if(manual) status.textContent="Could not load the result. Please try again."; return; }
  if(!data){ status.textContent="Submit the quiz below. Your ASIC-Skill result will appear here automatically."; return; }
  if(!manual && lastQuizAttemptStamp===data.submitted_at) return;
  lastQuizAttemptStamp=data.submitted_at;
  const pct=Number(data.percentage||0);
  const msg=pct>=90?"Excellent!":pct>=70?"Good job!":pct>=50?"Keep learning":"Review recommended";
  const submitted=new Date(data.submitted_at);
  const when=Number.isNaN(submitted.getTime())?"":submitted.toLocaleString();
  card.innerHTML=`<div class="quiz-result-kicker">Quiz Completed</div><div class="score">${data.score} / ${data.max_score}</div><div class="pct">${pct.toFixed(0)}%</div><div class="msg">${msg}</div>${when?`<div class="submitted">Submitted ${when}</div>`:""}`;
  card.hidden=false; status.textContent="Latest ASIC-Skill result";
  const processing=document.getElementById("quiz-processing");
  if(processing) processing.hidden=true;
  if(btn) btn.disabled=false;

  // v32.2: when a result was submitted during this viewer session, collapse the
  // Google Form and keep the student on ASIC-Skill. Existing older attempts do
  // not hide the form, so a student can still retake the quiz.
  const submittedMs=submitted.getTime();
  if(Number.isFinite(submittedMs) && submittedMs >= quizViewerOpenedAt - 5000){
    const wrap=document.querySelector(".quiz-embed-wrap");
    if(wrap) wrap.hidden=true;
    status.textContent="Quiz submitted — your ASIC-Skill result is shown below.";
    if(quizResultPollTimer){ clearInterval(quizResultPollTimer); quizResultPollTimer=null; }
  }
}

async function initViewer(){
  const message=document.getElementById("viewer-message"); if(!lessonId){message.textContent="Lesson not specified.";return;}
  ({data:{session:viewerSession}}=await supabaseClient.auth.getSession());
  if(viewerSession){ document.getElementById("signin-link").textContent="Signed In"; watermarkText=`ASIC-Skill Premium • ${viewerSession.user?.email||"Authorized user"}`; }
  const {data,error}=await supabaseClient.from("materials").select("id,course_id,module_name,title,description,material_type,access_level,file_name,drive_url,storage_provider,is_published,courses(slug,title)").eq("id",lessonId).eq("is_published",true).maybeSingle();
  if(error||!data){message.textContent="This lesson is unavailable.";return;}
  if(data.access_level==="premium"&&!viewerSession){location.href="signin.html";return;}
  document.title=`${data.title} | ASIC-Skill`; document.getElementById("lesson-title").textContent=data.title; document.getElementById("lesson-meta").textContent=[data.module_name,data.description||data.file_name||data.material_type].filter(Boolean).join(" • ");
  const pill=document.getElementById("access-pill"); pill.textContent=data.access_level; pill.className=`pill ${data.access_level}`; const slug=data.courses?.slug; if(slug) document.getElementById("back-course").href=`course-content.html?course=${encodeURIComponent(slug)}`;

  if(data.material_type==="eda_lab"){
    location.replace(`eda-lab.html?id=${encodeURIComponent(data.id)}`);
    return;
  }

  if(data.material_type==="openroad_lab"){
    location.replace(`openroad-lab.html?id=${encodeURIComponent(data.id)}`);
    return;
  }

  if(data.material_type==="poll"){
    await openEmbeddedQuiz(data);
    return;
  }

  if(data.storage_provider==="r2"){
    message.textContent="Checking premium access…";
    const res=await fetch(`${MATERIAL_SERVER}/material/${encodeURIComponent(data.id)}`,{headers:{Authorization:`Bearer ${viewerSession?.access_token||""}`}});
    if(res.status===403){message.textContent="Premium access is required for this lesson.";return;} if(res.status===401){location.href="signin.html";return;} if(!res.ok){const body=await res.json().catch(()=>({}));message.textContent=body.error||"Could not load premium material.";return;}
    try {
      if(data.material_type==="video"){
        const blob=await res.blob();
        const video=document.getElementById("premium-video");
        video.src=URL.createObjectURL(blob);
        document.getElementById("video-watermark").textContent=watermarkText;
        document.getElementById("premium-video-viewer").hidden=false;
        message.hidden=true;
      } else {
        await openPremiumPdf(await res.arrayBuffer());
        message.hidden=true;
      }
    } catch(e){ console.error(e); message.textContent=data.material_type==="video"?"Could not load this premium video.":"Could not render this premium PDF."; }
  } else {
    const preview=googleDrivePreviewUrl(data.drive_url); if(!preview){message.textContent="This lesson does not have a valid Google Drive file link.";return;}
    document.getElementById("material-frame").src=preview; document.getElementById("viewer-frame-wrap").hidden=false; message.hidden=true;
  }
}

function goToEnteredPage(){ if(!pdfDoc) return; const input=document.getElementById("pdf-page-input"); let n=parseInt(input.value,10); if(!Number.isFinite(n)) n=pageNum; goToPage(n); input.value=String(Math.max(1,Math.min(pdfDoc.numPages,n))); }
document.getElementById("pdf-page-input").addEventListener("change",goToEnteredPage);
document.getElementById("pdf-page-input").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();goToEnteredPage();e.target.blur();}});
document.getElementById("pdf-prev").addEventListener("click",()=>stepPage(-1));
document.getElementById("pdf-next").addEventListener("click",()=>stepPage(1));
async function setZoom(next, clientY=null){
  if(!pdfDoc || zoomBusy) return;
  next=Math.max(.5,Math.min(3.5,Math.round(next*10)/10));
  if(next===zoom) return;
  const anchor=captureReadingAnchor(clientY);
  zoomBusy=true;
  navTargetPage=anchor.page;
  renderGeneration++;
  try{
    zoom=next;
    document.getElementById("pdf-zoom-label").textContent=`${Math.round(zoom*100)}%`;
    layoutAllPagesSync();
    restoreReadingAnchor(anchor);
    requestAnimationFrame(()=>{
      restoreReadingAnchor(anchor);
      renderNearViewport();
    });
  } finally {
    zoomBusy=false;
    navTargetPage=null;
  }
}

function changeZoom(delta,clientY=null){ return setZoom(zoom+delta,clientY); }

["pdf-zoom-out","pdf-zoom-in"].forEach(id=>{
  document.getElementById(id).addEventListener("pointerdown",e=>e.preventDefault());
});
document.getElementById("pdf-zoom-out").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();changeZoom(-.1);});
document.getElementById("pdf-zoom-in").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();changeZoom(.1);});

const pdfStage=document.getElementById("pdf-stage");
pdfStage.addEventListener("scroll",()=>{
  if(scrollRaf) cancelAnimationFrame(scrollRaf);
  scrollRaf=requestAnimationFrame(syncPageFromScroll);
},{passive:true});
pdfStage.addEventListener("wheel",e=>{
  if(!(e.ctrlKey||e.metaKey) || !pdfDoc) return;
  e.preventDefault();
  e.stopPropagation();
  changeZoom(e.deltaY<0 ? .1 : -.1,e.clientY);
},{passive:false});

document.getElementById("pdf-fullscreen").addEventListener("click",async()=>{
  const viewer=document.getElementById("premium-pdf-viewer");
  try{ if(!document.fullscreenElement) await viewer.requestFullscreen(); else await document.exitFullscreen(); }catch(e){ console.warn(e); }
});
document.addEventListener("fullscreenchange",()=>{document.getElementById("pdf-fullscreen").textContent=document.fullscreenElement?"×":"⛶";document.getElementById("pdf-fullscreen").title=document.fullscreenElement?"Exit full screen":"Full screen"; clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>relayoutPreserveAnchor(),180);});
window.addEventListener("resize",()=>{if(!pdfDoc)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>relayoutPreserveAnchor(),250);});
document.addEventListener("contextmenu",e=>{if(e.target.closest(".viewer-frame-wrap,.premium-pdf-viewer")) e.preventDefault();});
document.addEventListener("keydown",e=>{ const premiumVisible=!document.getElementById("premium-pdf-viewer").hidden; if(!premiumVisible)return; const key=e.key.toLowerCase(); if((e.ctrlKey||e.metaKey)&&(key==="p"||key==="s")){e.preventDefault();e.stopPropagation();} if(e.key==="Escape"&&document.fullscreenElement){} });
window.addEventListener("beforeprint",()=>{ if(!document.getElementById("premium-pdf-viewer").hidden) document.body.classList.add("premium-print-block"); });
window.addEventListener("afterprint",()=>document.body.classList.remove("premium-print-block"));

// v18: robust draggable floating toolbar with a permanently visible grip.
(function setupDraggableControls(){
  const viewer=document.getElementById("premium-pdf-viewer");
  const bar=document.getElementById("premium-floating-controls");
  const handle=document.getElementById("pdf-drag-handle");
  let drag=null;
  let userPositioned=false;
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function clampBar(){
    if(!userPositioned || bar.hidden) return;
    const maxX=Math.max(0,viewer.clientWidth-bar.offsetWidth);
    const maxY=Math.max(0,viewer.clientHeight-bar.offsetHeight);
    const left=clamp(parseFloat(bar.style.left)||0,0,maxX);
    const top=clamp(parseFloat(bar.style.top)||0,0,maxY);
    bar.style.left=`${left}px`; bar.style.top=`${top}px`;
  }
  handle.addEventListener("pointerdown",e=>{
    e.preventDefault(); e.stopPropagation();
    const vr=viewer.getBoundingClientRect(), br=bar.getBoundingClientRect();
    drag={dx:e.clientX-br.left,dy:e.clientY-br.top};
    userPositioned=true;
    bar.style.position="absolute";
    bar.style.left=`${br.left-vr.left}px`; bar.style.top=`${br.top-vr.top}px`;
    bar.style.right="auto"; bar.style.bottom="auto";
    handle.setPointerCapture(e.pointerId); bar.classList.add("is-dragging");
  });
  handle.addEventListener("pointermove",e=>{
    if(!drag) return;
    const vr=viewer.getBoundingClientRect();
    const maxX=Math.max(0,viewer.clientWidth-bar.offsetWidth), maxY=Math.max(0,viewer.clientHeight-bar.offsetHeight);
    bar.style.left=`${clamp(e.clientX-vr.left-drag.dx,0,maxX)}px`;
    bar.style.top=`${clamp(e.clientY-vr.top-drag.dy,0,maxY)}px`;
  });
  function stop(e){
    if(e && handle.hasPointerCapture?.(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    drag=null; bar.classList.remove("is-dragging"); clampBar();
  }
  handle.addEventListener("pointerup",stop); handle.addEventListener("pointercancel",stop);
  window.addEventListener("resize",()=>requestAnimationFrame(clampBar));
  document.addEventListener("fullscreenchange",()=>requestAnimationFrame(clampBar));
})();

initViewer();
