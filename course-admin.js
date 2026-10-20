const statusBox = document.getElementById("admin-status");
const form = document.getElementById("material-form");
const message = document.getElementById("upload-message");
const MATERIAL_SERVER = "https://asic-skill-material-server.asic-skill-materials.workers.dev";

function showMessage(text, ok=false){ message.hidden=false; message.textContent=text; message.className="message "+(ok?"ok":"bad"); }
function escapeHtml(value){ return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function validDriveUrl(value){ try { const u=new URL(value); return u.protocol==='https:' && (u.hostname==='drive.google.com' || u.hostname==='docs.google.com'); } catch { return false; } }
function validQuizUrl(value){
  try {
    const u=new URL(value);
    if(u.protocol!=='https:') return false;
    const google=(u.hostname==='docs.google.com' && /^\/forms\/d\/(?:e\/)?[^/]+\/(?:viewform|preview)$/.test(u.pathname));
    const tally=((u.hostname==='tally.so' || u.hostname.endsWith('.tally.so')) && /^\/(r|embed)\//.test(u.pathname));
    return google || tally;
  } catch { return false; }
}
function updateSourceFields(){
  const premium=document.getElementById("access").value==="premium";
  const type=document.getElementById("type").value;
  const isVideo=type==="video", isPoll=type==="poll", isOpenRoad=type==="openroad_lab", isEda=type==="eda_lab", isNativeLab=isOpenRoad||isEda;
  document.getElementById("poll-builder").hidden=!isPoll;
  document.getElementById("free-source").hidden=premium||isPoll||isNativeLab;
  document.getElementById("premium-source").hidden=!premium||isPoll||isNativeLab;
  document.getElementById("drive-url").required=!premium&&!isPoll&&!isNativeLab;
  document.getElementById("tally-url").required=isPoll;
  const file=document.getElementById("premium-file");
  file.required=premium&&!isPoll&&!isNativeLab;
  file.accept=isVideo?"video/mp4,video/webm,.mp4,.webm":"application/pdf,.pdf";
  document.getElementById("premium-file-label").textContent=isVideo?"Premium video file":"Premium PDF";
  document.getElementById("premium-source-help").textContent=isVideo
    ?"PREMIUM video: upload MP4/WebM to your private Cloudflare R2 bucket. For very large course videos, a dedicated streaming service is recommended."
    :"PREMIUM material: the PDF is uploaded to your private Cloudflare R2 bucket. Public R2 access stays disabled.";
  document.getElementById("upload-btn").textContent=isPoll?"Add Quiz →":(isOpenRoad?"Add OpenROAD Lab →":(isEda?"Add EDA Cloud Lab →":"Add Material →"));
}

async function initAdmin(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session){ statusBox.innerHTML='Please <a href="signin.html">sign in</a> first.'; return; }
  const {data:isAdmin,error}=await supabaseClient.rpc("is_admin");
  if(error){ statusBox.textContent="Database setup is not finished. Run the included Supabase SQL setup/migration first."; return; }
  if(!isAdmin){ statusBox.textContent="This account is not authorized as a course administrator."; return; }
  statusBox.textContent="Administrator access confirmed."; statusBox.classList.add("ok"); form.hidden=false;
  updateSourceFields(); await loadCourses(); await loadMaterials();
}
async function loadCourses(){
  const {data,error}=await supabaseClient.from("courses").select("id,title,slug").eq("is_active",true).order("sort_order");
  const select=document.getElementById("course"); if(error){ showMessage(error.message); return; }
  select.innerHTML=(data||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("");
}
async function loadMaterials(){
  const {data,error}=await supabaseClient.from("materials").select("id,title,module_name,sub_module_name,topic_name,access_level,material_type,drive_url,storage_provider,created_at,courses(title)").order("created_at",{ascending:false}).limit(100);
  const box=document.getElementById("material-list"); if(error){ box.textContent=error.message; return; }
  box.innerHTML=(data||[]).length ? data.map(m=>`<div class="material-row"><div><strong>${escapeHtml(m.title)}</strong><small>${escapeHtml(m.courses?.title||"Course")} · ${escapeHtml(m.module_name)} › ${escapeHtml(m.sub_module_name||'General')} › ${escapeHtml(m.topic_name||m.title)} · ${m.material_type==='poll'?'Quiz / Poll':(m.material_type==='openroad_lab'?'OpenROAD Interactive Lab':(m.material_type==='eda_lab'?'EDA Cloud Lab':(m.storage_provider==='r2'?'Private R2':(m.storage_provider==='none'?'ASIC-Skill Lab':'Google Drive'))))}</small></div><span class="pill ${m.access_level==='premium'?'premium':'free'}">${m.access_level}</span>${(m.drive_url||m.material_type==='openroad_lab'||m.material_type==='eda_lab')?`<button type="button" class="view-material" data-id="${m.id}" data-type="${m.material_type||''}" data-url="${escapeHtml(m.drive_url||'')}">View</button>`:''}<button type="button" class="delete-material" data-material-id="${m.id}" data-provider="${m.storage_provider||'drive'}" aria-label="Delete ${escapeHtml(m.title)}">Delete</button></div>`).join("") : '<p class="muted">No material added yet.</p>';
}
async function deleteMaterial(id,provider,button){
  const {data:material,error:lookupError}=await supabaseClient.from("materials").select("id,title").eq("id",id).single();
  if(lookupError || !material){ showMessage("Could not find lesson: "+(lookupError?.message||"Unknown error")); return; }
  const note=provider==='r2'?'The private R2 PDF will also be deleted.':'The original Google Drive file will NOT be deleted.';
  if(!window.confirm(`Remove "${material.title}" from ASIC-Skill? ${note}`)) return;
  button.disabled=true; button.textContent="Deleting…";
  if(provider==='r2'){
    const {data:{session}}=await supabaseClient.auth.getSession();
    const res=await fetch(`${MATERIAL_SERVER}/admin/material/${encodeURIComponent(id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${session?.access_token||''}`}});
    if(!res.ok){ const body=await res.json().catch(()=>({})); showMessage("Could not delete premium lesson: "+(body.error||res.statusText)); button.disabled=false; button.textContent="Delete"; return; }
  } else {
    const {data:deleted,error}=await supabaseClient.from("materials").delete().eq("id",id).select("id");
    if(error || !deleted?.length){ showMessage("Could not delete lesson: "+(error?.message||"Check administrator permissions.")); button.disabled=false; button.textContent="Delete"; return; }
  }
  showMessage("Lesson deleted successfully.",true); await loadMaterials();
}
document.getElementById("access").addEventListener("change",updateSourceFields);
document.getElementById("type").addEventListener("change",updateSourceFields);
document.getElementById("material-list").addEventListener("click",event=>{
  const view=event.target.closest("button.view-material");
  if(view){
    if((view.dataset.type==="poll" || view.dataset.type==="openroad_lab" || view.dataset.type==="eda_lab") && view.dataset.id){
      window.open(`lesson-viewer.html?id=${encodeURIComponent(view.dataset.id)}`,"_blank","noopener,noreferrer");
    } else {
      window.open(view.dataset.url,"_blank","noopener,noreferrer");
    }
    return;
  }
  const button=event.target.closest("button.delete-material"); if(button && !button.disabled) deleteMaterial(button.dataset.materialId,button.dataset.provider,button);
});
form.addEventListener("submit",async e=>{
  e.preventDefault(); message.hidden=true;
  const btn=document.getElementById("upload-btn"), course=document.getElementById("course"), access=document.getElementById("access").value;
  if(!course.value){ showMessage("Please select a course."); return; }
  btn.disabled=true; btn.textContent=access==='premium'?"Uploading securely…":"Adding…";
  try {
    const type=document.getElementById("type").value;
    const moduleName=document.getElementById("module").value.trim();
    const subModuleName=document.getElementById("sub-module").value.trim();
    const topicName=document.getElementById("topic").value.trim();
    if(!moduleName || !subModuleName || !topicName){ showMessage("Module, sub-module and topic are required."); return; }
    if(type==="openroad_lab" || type==="eda_lab"){
      const payload={course_id:course.value,module_name:moduleName,sub_module_name:subModuleName,topic_name:topicName,title:document.getElementById("title").value.trim(),description:document.getElementById("description").value.trim(),material_type:type,access_level:access,drive_url:null,storage_provider:"none",file_name:null,storage_path:null};
      const {error}=await supabaseClient.from("materials").insert(payload); if(error) throw error;
      showMessage(type==="eda_lab"?"EDA Cloud Lab added. It will open the OpenROAD / OpenSTA / Yosys / Magic workspace.":"OpenROAD interactive lab added. It will open inside ASIC-Skill Lab.",true);
    } else if(type==="poll"){
      const quizUrl=document.getElementById("tally-url").value.trim();
      if(!validQuizUrl(quizUrl)){ showMessage("Please paste a valid published Google Forms Responder URL (/viewform). Existing Tally Share/Embed URLs are also supported."); return; }
      const payload={course_id:course.value,module_name:moduleName,sub_module_name:subModuleName,topic_name:topicName,title:document.getElementById("title").value.trim(),description:document.getElementById("description").value.trim(),material_type:'poll',access_level:access,drive_url:quizUrl,storage_provider:'none',file_name:null,storage_path:null};
      const {error}=await supabaseClient.from("materials").insert(payload); if(error) throw error;
      showMessage("Quiz added successfully and will open inside ASIC-Skill.",true);
    } else if(access==='premium'){
      const file=document.getElementById("premium-file").files[0];
      const type=document.getElementById("type").value;
      const isVideo=type==="video";
      const validFile=isVideo ? !!file && (file.type==="video/mp4" || file.type==="video/webm" || /\.(mp4|webm)$/i.test(file.name)) : !!file && (file.type==="application/pdf" || /\.pdf$/i.test(file.name));
      if(!validFile){ showMessage(isVideo?"Please choose an MP4 or WebM video file.":"Please choose a PDF file for premium material."); return; }
      const {data:{session}}=await supabaseClient.auth.getSession();
      if(!session){ location.href='signin.html'; return; }
      const fd=new FormData();
      fd.append('file',file); fd.append('course_id',course.value); fd.append('module_name',moduleName); fd.append('sub_module_name',subModuleName); fd.append('topic_name',topicName); fd.append('title',document.getElementById("title").value.trim()); fd.append('description',document.getElementById("description").value.trim()); fd.append('material_type',document.getElementById("type").value);
      const res=await fetch(`${MATERIAL_SERVER}/admin/material`,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},body:fd});
      const body=await res.json().catch(()=>({})); if(!res.ok) throw new Error(body.error||`Upload failed (${res.status})`);
      showMessage(type==="video"?"Premium video uploaded privately to Cloudflare R2 and lesson published.":"Premium PDF uploaded privately to Cloudflare R2 and lesson published.",true);
    } else {
      const driveUrl=document.getElementById("drive-url").value.trim(); if(!validDriveUrl(driveUrl)){ showMessage("Please paste a valid Google Drive file link."); return; }
      const payload={course_id:course.value,module_name:moduleName,sub_module_name:subModuleName,topic_name:topicName,title:document.getElementById("title").value.trim(),description:document.getElementById("description").value.trim(),material_type:document.getElementById("type").value,access_level:'free',drive_url:driveUrl,storage_provider:'drive',file_name:null,storage_path:null};
      const {error}=await supabaseClient.from("materials").insert(payload); if(error) throw error;
      showMessage("Free Google Drive material added successfully.",true);
    }
    form.reset(); updateSourceFields(); await loadCourses(); await loadMaterials();
  } catch(err){ showMessage(err.message||String(err)); } finally { btn.disabled=false; btn.textContent="Add Material →"; }
});
initAdmin();

// v13: manual premium entitlement administration
const accessAdmin = document.getElementById("access-admin");
const accessEmail = document.getElementById("access-email");
const accessCourse = document.getElementById("access-course");
const accessMessage = document.getElementById("access-message");
const accessList = document.getElementById("access-list");
const grantAccessBtn = document.getElementById("grant-access-btn");

function showAccessMessage(text, ok=false){
  accessMessage.hidden=false;
  accessMessage.textContent=text;
  accessMessage.className="message access-message "+(ok?"ok":"bad");
}
async function loadAccessCourses(){
  const {data,error}=await supabaseClient.from("courses").select("id,title").eq("is_active",true).order("sort_order");
  if(error){ showAccessMessage(error.message); return; }
  accessCourse.innerHTML=(data||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("");
}
async function loadPremiumAccess(){
  const {data,error}=await supabaseClient.rpc("admin_list_premium_access");
  if(error){
    accessList.innerHTML='<p class="muted">Run <strong>supabase-v13-premium-access.sql</strong> first.</p>';
    return;
  }
  const active=(data||[]).filter(r=>r.active);
  accessList.innerHTML=active.length ? active.map(r=>`<div class="access-row"><div><strong>${escapeHtml(r.student_email)}</strong><small>${escapeHtml(r.course_title)}</small></div><span class="pill premium">ACTIVE</span><button type="button" class="revoke-access" data-email="${escapeHtml(r.student_email)}" data-course-id="${r.course_id}">Revoke</button></div>`).join("") : '<p class="muted">No active premium access yet.</p>';
}
async function initPremiumAccessAdmin(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session) return;
  const {data:isAdmin}=await supabaseClient.rpc("is_admin");
  if(!isAdmin) return;
  accessAdmin.hidden=false;
  await loadAccessCourses();
  await loadPremiumAccess();
}
grantAccessBtn?.addEventListener("click",async()=>{
  const email=accessEmail.value.trim(); const courseId=accessCourse.value;
  if(!email){ showAccessMessage("Enter the student's ASIC-Skill email address."); return; }
  if(!courseId){ showAccessMessage("Select a course."); return; }
  grantAccessBtn.disabled=true; grantAccessBtn.textContent="Granting…";
  const {error}=await supabaseClient.rpc("admin_grant_premium_access",{student_email:email,target_course_id:courseId});
  grantAccessBtn.disabled=false; grantAccessBtn.textContent="Grant Premium Access →";
  if(error){ showAccessMessage(error.message); return; }
  showAccessMessage("Premium access granted successfully.",true); accessEmail.value=""; await loadPremiumAccess();
});
accessList?.addEventListener("click",async event=>{
  const btn=event.target.closest("button.revoke-access"); if(!btn || btn.disabled) return;
  if(!confirm(`Revoke premium access for ${btn.dataset.email}?`)) return;
  btn.disabled=true; btn.textContent="Revoking…";
  const {error}=await supabaseClient.rpc("admin_revoke_premium_access",{student_email:btn.dataset.email,target_course_id:btn.dataset.courseId});
  if(error){ showAccessMessage(error.message); btn.disabled=false; btn.textContent="Revoke"; return; }
  showAccessMessage("Premium access revoked.",true); await loadPremiumAccess();
});
initPremiumAccessAdmin();
