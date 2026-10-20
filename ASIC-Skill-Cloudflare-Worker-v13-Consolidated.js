const ALLOWED_ORIGINS = new Set([
  "https://www.asic-skill.com",
  "https://asic-skill.com"
]);

function cors(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://www.asic-skill.com",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
  };
}
function json(request, body, status=200){ return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json",...cors(request)}}); }
function authHeader(request){ const h=request.headers.get("Authorization")||""; return h.startsWith("Bearer ")?h:null; }
async function sb(request, env, path, options={}){
  const auth=authHeader(request);
  if(!auth) return {response:null,error:new Response("Unauthorized",{status:401})};
  const headers={apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:auth,...(options.headers||{})};
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{...options,headers}); return {response};
}
async function user(request,env){ const {response,error}=await sb(request,env,"/auth/v1/user"); if(error) return null; if(!response.ok) return null; return response.json(); }
async function isAdmin(request,env){ const {response}=await sb(request,env,"/rest/v1/rpc/is_admin",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}); return !!response && response.ok && await response.json()===true; }
function safeName(name){ return name.replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").slice(-140)||"material"; }

export default {
  async fetch(request,env){
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors(request)});
    const url=new URL(request.url);
    if(url.pathname==="/") return json(request,{service:"ASIC-Skill Premium Material Server",status:"online"});

    // v31: Google Forms server-side result bridge. Never expose these secrets in browser code.
    if(request.method==="POST" && url.pathname==="/quiz-result"){
      const supplied=request.headers.get("X-ASIC-Skill-Webhook")||"";
      if(!env.QUIZ_WEBHOOK_SECRET || supplied!==env.QUIZ_WEBHOOK_SECRET) return json(request,{error:"Unauthorized webhook."},401);
      if(!env.SUPABASE_SERVICE_ROLE_KEY) return json(request,{error:"Server configuration incomplete."},500);
      let body; try{ body=await request.json(); }catch{ return json(request,{error:"Invalid JSON."},400); }
      const email=String(body.email||"").trim(); const quizTitle=String(body.quiz_title||"").trim();
      const score=Number(body.score); const maxScore=Number(body.max_score);
      if(!email||!quizTitle||!Number.isFinite(score)||!Number.isFinite(maxScore)||maxScore<=0) return json(request,{error:"Missing or invalid result data."},400);
      const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_quiz_attempt_by_email`,{
        method:"POST",headers:{"Content-Type":"application/json",apikey:env.SUPABASE_SERVICE_ROLE_KEY},
        body:JSON.stringify({p_email:email,p_quiz_title:quizTitle,p_score:score,p_max_score:maxScore})
      });
      if(!r.ok) return json(request,{error:"Could not record quiz result.",detail:await r.text()},500);
      return json(request,{ok:true,attempt_id:await r.json()});
    }

    if(request.method==="POST" && url.pathname==="/admin/material"){
      if(!await user(request,env)) return json(request,{error:"Sign in required."},401);
      if(!await isAdmin(request,env)) return json(request,{error:"Administrator access required."},403);
      const form=await request.formData(); const file=form.get("file");
      const materialType=String(form.get("material_type")||"pdf");
      const isVideo=materialType==="video";
      const validType=file instanceof File && (isVideo ? (file.type==="video/mp4" || file.type==="video/webm" || /\.(mp4|webm)$/i.test(file.name)) : (file.type==="application/pdf" || /\.pdf$/i.test(file.name)));
      if(!validType) return json(request,{error:isVideo?"An MP4 or WebM video file is required.":"A PDF file is required."},400);
      const courseId=String(form.get("course_id")||""); const title=String(form.get("title")||"").trim(); const moduleName=String(form.get("module_name")||"").trim();
      if(!courseId||!title||!moduleName) return json(request,{error:"Course, module and lesson title are required."},400);
      const key=`${courseId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      await env.COURSE_MATERIALS.put(key,file.stream(),{httpMetadata:{contentType:file.type || (isVideo?"video/mp4":"application/pdf"),contentDisposition:`inline; filename="${safeName(file.name)}"`}});
      const payload={course_id:courseId,module_name:moduleName,title,description:String(form.get("description")||""),material_type:materialType,access_level:"premium",storage_provider:"r2",storage_path:key,drive_url:null,file_name:file.name,is_published:true};
      const {response}=await sb(request,env,"/rest/v1/materials",{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
      if(!response.ok){ await env.COURSE_MATERIALS.delete(key); return json(request,{error:"R2 upload succeeded but lesson record failed: "+await response.text()},500); }
      const rows=await response.json(); return json(request,{ok:true,material:rows[0]},201);
    }

    const adminDelete=url.pathname.match(/^\/admin\/material\/([^/]+)$/);
    if(request.method==="DELETE" && adminDelete){
      if(!await user(request,env)) return json(request,{error:"Sign in required."},401); if(!await isAdmin(request,env)) return json(request,{error:"Administrator access required."},403);
      const id=decodeURIComponent(adminDelete[1]); const {response:getRes}=await sb(request,env,`/rest/v1/materials?id=eq.${encodeURIComponent(id)}&select=id,storage_provider,storage_path`);
      if(!getRes.ok) return json(request,{error:"Could not read lesson."},500); const rows=await getRes.json(); if(!rows.length) return json(request,{error:"Lesson not found."},404);
      if(rows[0].storage_provider==="r2" && rows[0].storage_path) await env.COURSE_MATERIALS.delete(rows[0].storage_path);
      const {response:delRes}=await sb(request,env,`/rest/v1/materials?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{Prefer:"return=representation"}});
      if(!delRes.ok) return json(request,{error:"Could not delete lesson record."},500); return json(request,{ok:true});
    }

    const materialMatch=url.pathname.match(/^\/material\/([^/]+)$/);
    if(request.method==="GET" && materialMatch){
      const currentUser=await user(request,env); if(!currentUser) return json(request,{error:"Sign in required."},401);
      const id=decodeURIComponent(materialMatch[1]); const {response:mRes}=await sb(request,env,`/rest/v1/materials?id=eq.${encodeURIComponent(id)}&is_published=eq.true&select=id,course_id,access_level,storage_provider,storage_path,file_name,material_type`);
      if(!mRes.ok) return json(request,{error:"Could not verify lesson."},500); const rows=await mRes.json(); if(!rows.length) return json(request,{error:"Lesson not found."},404); const m=rows[0];
      if(m.storage_provider!=="r2" || !m.storage_path) return json(request,{error:"This lesson is not stored in R2."},400);
      let allowed=await isAdmin(request,env);
      if(!allowed){ const {response:eRes}=await sb(request,env,`/rest/v1/entitlements?user_id=eq.${encodeURIComponent(currentUser.id)}&course_id=eq.${encodeURIComponent(m.course_id)}&active=eq.true&select=id&limit=1`); allowed=eRes?.ok && (await eRes.json()).length>0; }
      if(!allowed) return json(request,{error:"Premium access is required for this course."},403);
      const object=await env.COURSE_MATERIALS.get(m.storage_path); if(!object) return json(request,{error:"Material not found in private storage."},404);
      const headers=new Headers(cors(request)); object.writeHttpMetadata(headers); headers.set("Content-Type",object.httpMetadata?.contentType || (m.material_type==="video"?"video/mp4":"application/pdf")); headers.set("Content-Disposition",`inline; filename="${safeName(m.file_name||"material")}"`); headers.set("Cache-Control","private, no-store"); headers.set("X-Content-Type-Options","nosniff");
      return new Response(object.body,{headers});
    }
    return json(request,{error:"Not Found"},404);
  }
};
