let session=null, courses=[], isAdmin=false, currentCourse=null, currentMaterials=[];
const params=new URLSearchParams(location.search);

async function init(){
  ({data:{session}}=await supabaseClient.auth.getSession());
  if(session){
    document.getElementById("signin-link").textContent="Signed In";
    const {data:adminFlag}=await supabaseClient.rpc("is_admin");
    isAdmin=adminFlag===true;
  }
  const {data,error}=await supabaseClient.from("courses").select("id,title,slug,description").eq("is_active",true).order("sort_order");
  if(error){ showCourseError("Course database is not set up yet. Run the included Supabase SQL setup."); return; }
  courses=data||[]; renderPicker();
  const requested=params.get("course");
  const course=courses.find(c=>c.slug===requested)||courses[0];
  if(course){
    if(!requested || requested!==course.slug) history.replaceState(null,"",`?course=${encodeURIComponent(course.slug)}`);
    await loadCourse(course);
  } else showCourseError("No active courses are available yet.");
}

function renderPicker(){
  document.getElementById("course-picker").innerHTML=courses.map(c=>`<button data-slug="${escapeHtml(c.slug)}">${escapeHtml(c.title)}</button>`).join("");
  document.querySelectorAll("#course-picker button").forEach(b=>b.onclick=async()=>{
    const c=courses.find(x=>x.slug===b.dataset.slug); history.replaceState(null,"",`?course=${encodeURIComponent(c.slug)}`); await loadCourse(c);
  });
}

async function loadCourse(course){
  currentCourse=course;
  document.getElementById("course-title").textContent=course.title;
  document.getElementById("course-description").textContent=course.description||"Structured ASIC-Skill learning material.";
  document.querySelectorAll("#course-picker button").forEach(b=>b.classList.toggle("active",b.dataset.slug===course.slug));
  document.getElementById("curriculum").innerHTML='<div class="empty compact">Loading curriculum…</div>';
  document.getElementById("lesson-area").innerHTML="";
  const {data,error}=await supabaseClient.from("materials")
    .select("id,module_name,sub_module_name,topic_name,title,description,material_type,access_level,file_name,drive_url,storage_provider,sort_order")
    .eq("course_id",course.id).eq("is_published",true).order("sort_order").order("created_at");
  if(error){
    const msg=(error.message||"").includes("sub_module_name")|| (error.message||"").includes("topic_name")
      ? "Run supabase-v34-hierarchical-curriculum.sql once, then refresh this page."
      : error.message;
    showCourseError(msg); return;
  }
  currentMaterials=data||[]; renderStats(currentMaterials); renderCurriculum(currentMaterials); renderHierarchy(currentMaterials);
}

function norm(v,fallback){ const t=String(v??"").trim(); return t||fallback; }
function buildHierarchy(items){
  const modules=[]; const moduleMap=new Map();
  for(const m of items){
    const moduleName=norm(m.module_name,"General");
    const subName=norm(m.sub_module_name,"General");
    const topicName=norm(m.topic_name,m.title||"Topic");
    if(!moduleMap.has(moduleName)){ const mod={name:moduleName,subs:[],_map:new Map(),count:0}; moduleMap.set(moduleName,mod); modules.push(mod); }
    const mod=moduleMap.get(moduleName); mod.count++;
    if(!mod._map.has(subName)){ const sub={name:subName,topics:[],_map:new Map(),count:0}; mod._map.set(subName,sub); mod.subs.push(sub); }
    const sub=mod._map.get(subName); sub.count++;
    if(!sub._map.has(topicName)){ const topic={name:topicName,items:[]}; sub._map.set(topicName,topic); sub.topics.push(topic); }
    sub._map.get(topicName).items.push(m);
  }
  return modules;
}

function renderStats(items){
  const h=buildHierarchy(items);
  const subs=h.reduce((n,m)=>n+m.subs.length,0);
  const topics=h.reduce((n,m)=>n+m.subs.reduce((a,s)=>a+s.topics.length,0),0);
  document.getElementById("course-stats").innerHTML=`
    <div><strong>${h.length}</strong><span>Modules</span></div>
    <div><strong>${subs}</strong><span>Sub-modules</span></div>
    <div><strong>${topics}</strong><span>Topics</span></div>
    <div><strong>${items.length}</strong><span>Materials</span></div>`;
}

function renderCurriculum(items){
  const box=document.getElementById("curriculum");
  if(!items.length){ box.innerHTML='<div class="empty compact">No topics have been published for this course yet.</div>'; return; }
  const modules=buildHierarchy(items);
  box.innerHTML=modules.map((mod,mi)=>`
    <section class="nav-module ${mi===0?'open':''}">
      <button class="nav-module-toggle accordion-toggle" type="button" aria-expanded="${mi===0?'true':'false'}">
        <span class="section-number">${String(mi+1).padStart(2,'0')}</span><span><strong>${escapeHtml(mod.name)}</strong><small>${mod.subs.length} sub-module${mod.subs.length===1?'':'s'}</small></span><span class="chevron">⌄</span>
      </button>
      <div class="nav-module-body">
        ${mod.subs.map((sub,si)=>`<section class="nav-sub ${mi===0&&si===0?'open':''}">
          <button class="nav-sub-toggle accordion-toggle" type="button" aria-expanded="${mi===0&&si===0?'true':'false'}"><span class="branch-dot"></span><span><strong>${escapeHtml(sub.name)}</strong><small>${sub.topics.length} topic${sub.topics.length===1?'':'s'}</small></span><span class="chevron">⌄</span></button>
          <div class="nav-sub-body">${sub.topics.map(topic=>`<button class="nav-topic-jump" type="button" data-anchor="${anchorFor(mi,si,topic.name)}"><span>↳</span><span>${escapeHtml(topic.name)}</span><small>${topic.items.length}</small></button>`).join('')}</div>
        </section>`).join('')}
      </div>
    </section>`).join('');
  wireAccordions(box);
  box.querySelectorAll('.nav-topic-jump').forEach(btn=>btn.onclick=()=>document.getElementById(btn.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'center'}));
}

function renderHierarchy(items){
  const area=document.getElementById("lesson-area");
  if(!items.length){ area.innerHTML='<div class="empty">No topics have been published for this course yet.</div>'; return; }
  const modules=buildHierarchy(items);
  area.innerHTML=modules.map((mod,mi)=>`
    <section class="floating-module ${mi===0?'open':''}">
      <button class="floating-module-head accordion-toggle" type="button" aria-expanded="${mi===0?'true':'false'}">
        <span class="module-orb">${String(mi+1).padStart(2,'0')}</span>
        <span class="module-copy"><span class="small-label">MODULE ${mi+1}</span><strong>${escapeHtml(mod.name)}</strong><small>${mod.subs.length} sub-modules · ${mod.count} materials</small></span><span class="module-expand"><span>Expand</span><b class="chevron">⌄</b></span>
      </button>
      <div class="floating-module-body">
        ${mod.subs.map((sub,si)=>`
          <section class="floating-sub ${mi===0&&si===0?'open':''}">
            <button class="floating-sub-head accordion-toggle" type="button" aria-expanded="${mi===0&&si===0?'true':'false'}">
              <span class="sub-index">${String(mi+1).padStart(2,'0')}.${si+1}</span><span class="sub-copy"><strong>${escapeHtml(sub.name)}</strong><small>${sub.topics.length} topics</small></span><span class="chevron">⌄</span>
            </button>
            <div class="floating-sub-body">
              ${sub.topics.map((topic,ti)=>topicBlock(topic,mi,si,ti)).join('')}
            </div>
          </section>`).join('')}
      </div>
    </section>`).join('');
  wireAccordions(area);
  area.querySelectorAll('.topic-card-head').forEach(btn=>btn.onclick=()=>{
    const card=btn.closest('.topic-card'); const open=card.classList.toggle('open'); btn.setAttribute('aria-expanded',String(open));
  });
  area.querySelectorAll('.material-action').forEach(btn=>btn.onclick=e=>{ e.stopPropagation(); openMaterialById(btn.dataset.id); });
  area.querySelectorAll('.delete-course-material').forEach(btn=>btn.onclick=e=>{e.stopPropagation();deleteMaterial(btn,currentCourse);});
}

function topicBlock(topic,mi,si,ti){
  const anchor=anchorFor(mi,si,topic.name);
  const premiumCount=topic.items.filter(x=>x.access_level==='premium').length;
  return `<article class="topic-card" id="${anchor}">
    <button class="topic-card-head" type="button" aria-expanded="false">
      <span class="topic-index">${ti+1}</span><span class="topic-copy"><span class="topic-kicker">TOPIC</span><strong>${escapeHtml(topic.name)}</strong><small>${topic.items.length} material${topic.items.length===1?'':'s'}${premiumCount?` · ${premiumCount} premium`:''}</small></span><span class="topic-open">Open <b>＋</b></span>
    </button>
    <div class="topic-materials">${topic.items.map(materialRow).join('')}</div>
  </article>`;
}

function materialRow(m){
  const premium=m.access_level==='premium';
  return `<div class="topic-material-row">
    <span class="material-icon">${materialTypeIcon(m.material_type)}</span>
    <span class="material-copy"><strong>${escapeHtml(m.title)}</strong><small>${escapeHtml(materialTypeLabel(m.material_type))}${m.description?` · ${escapeHtml(m.description)}`:''}</small></span>
    <span class="pill ${premium?'premium':'free'}">${premium?'Premium':'Free'}</span>
    <button class="material-action" type="button" data-id="${m.id}">${premium?'View / Unlock':'View'} →</button>
    ${isAdmin?`<button class="delete-course-material" type="button" data-id="${m.id}" data-title="${escapeHtml(m.title)}">Delete</button>`:''}
  </div>`;
}

function wireAccordions(root){
  root.querySelectorAll('.accordion-toggle').forEach(btn=>btn.onclick=()=>{
    const section=btn.parentElement; const open=section.classList.toggle('open'); btn.setAttribute('aria-expanded',String(open));
  });
}
function anchorFor(mi,si,name){ return `topic-${mi}-${si}-${slugify(name)}`; }
function slugify(v){ return String(v||'topic').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'topic'; }

async function openMaterialById(id){
  const m=currentMaterials.find(x=>x.id===id); if(!m) return;
  if(m.access_level==="premium"&&!session){ location.href="signin.html"; return; }
  if(m.material_type!=="openroad_lab" && (m.storage_provider||"drive")==="drive" && !m.drive_url){ alert("No Google Drive link is saved for this material."); return; }
  location.href=`lesson-viewer.html?id=${encodeURIComponent(id)}`;
}
function materialTypeLabel(type){ return ({video:"Video",lab:"Lab",openroad_lab:"OpenROAD Lab",poll:"Quiz",assignment:"Assignment",presentation:"Presentation",pdf:"Notes / PDF",document:"Document",cheatsheet:"Cheat Sheet",other:"Resource"})[type]||"Material"; }
function materialTypeIcon(type){ return ({video:"▶",lab:"⌘",openroad_lab:"⬡",poll:"?",assignment:"✓",presentation:"▣",pdf:"▤",document:"≡",cheatsheet:"★",other:"＋"})[type]||"•"; }
function escapeHtml(value){ return String(value ?? "").replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function showCourseError(text){ document.getElementById("curriculum").innerHTML=`<div class="empty compact">${escapeHtml(text)}</div>`; document.getElementById("lesson-area").innerHTML=`<div class="empty">${escapeHtml(text)}</div>`; }

async function deleteMaterial(btn,course){
  if(!isAdmin){ alert("Administrator access is required to delete course material."); return; }
  const id=btn.dataset.id, title=btn.dataset.title||"this material";
  const material=currentMaterials.find(x=>x.id===id); const provider=material?.storage_provider||"drive";
  if(!window.confirm(`Remove "${title}" from ASIC-Skill? ${provider==="r2"?"The private R2 file will also be deleted.":"The original Google Drive file will NOT be deleted."}`)) return;
  btn.disabled=true; btn.textContent="Deleting…";
  if(provider==="r2"){
    const res=await fetch("https://asic-skill-material-server.asic-skill-materials.workers.dev/admin/material/"+encodeURIComponent(id),{method:"DELETE",headers:{Authorization:`Bearer ${session?.access_token||""}`}});
    if(!res.ok){ const body=await res.json().catch(()=>({})); alert("The premium material could not be deleted: "+(body.error||res.statusText)); btn.disabled=false; btn.textContent="Delete"; return; }
  }else{
    const {data:deleted,error}=await supabaseClient.from("materials").delete().eq("id",id).select("id");
    if(error||!deleted?.length){ alert("The material could not be deleted: "+(error?.message||"Check administrator permissions.")); btn.disabled=false; btn.textContent="Delete"; return; }
  }
  await loadCourse(course);
}

document.getElementById("refresh-course")?.addEventListener("click",()=>currentCourse&&loadCourse(currentCourse));
init();
