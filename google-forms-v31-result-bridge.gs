/* ASIC-Skill v31 Google Forms -> Cloudflare Worker result bridge.
   Put secrets in Apps Script Project Settings > Script properties:
   ASIC_SKILL_RESULT_ENDPOINT = https://asic-skill-material-server.asic-skill-materials.workers.dev/quiz-result
   ASIC_SKILL_WEBHOOK_SECRET = the same random secret stored in the Worker as QUIZ_WEBHOOK_SECRET

   Paste the 10 EDIT form IDs below, then run installTriggers() once.
*/
const FORM_IDS = [
  // "EDIT_FORM_ID_QUIZ_01",
  // "EDIT_FORM_ID_QUIZ_02",
];

function installTriggers(){
  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  FORM_IDS.forEach(id=>ScriptApp.newTrigger('onQuizSubmit').forForm(FormApp.openById(id)).onFormSubmit().create());
  Logger.log('Installed '+FORM_IDS.length+' form-submit triggers.');
}

function onQuizSubmit(e){
  const props=PropertiesService.getScriptProperties();
  const endpoint=props.getProperty('ASIC_SKILL_RESULT_ENDPOINT');
  const secret=props.getProperty('ASIC_SKILL_WEBHOOK_SECRET');
  if(!endpoint || !secret) throw new Error('Missing Script properties.');

  const form=e.source;
  const response=e.response;
  let email='';
  response.getItemResponses().forEach(r=>{
    if(r.getItem().getTitle()==='ASIC-Skill Student Email') email=String(r.getResponse()||'').trim();
  });
  if(!email) throw new Error('ASIC-Skill Student Email is empty.');

  let score=0, maxScore=0;
  response.getGradableItemResponses().forEach(r=>{
    const pts=r.getScore();
    if(typeof pts==='number') score+=pts;
    const item=r.getItem();
    try { maxScore += item.getPoints() || 0; } catch(err) {}
  });
  if(maxScore<=0) throw new Error('Quiz maximum score could not be calculated.');

  const res=UrlFetchApp.fetch(endpoint,{
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{'X-ASIC-Skill-Webhook':secret},
    payload:JSON.stringify({email:email,quiz_title:form.getTitle(),score:score,max_score:maxScore})
  });
  if(res.getResponseCode()<200 || res.getResponseCode()>=300) throw new Error('Result bridge failed: '+res.getContentText());
}
