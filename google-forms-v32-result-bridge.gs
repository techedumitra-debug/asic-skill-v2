/* ASIC-Skill v32 Google Forms -> Cloudflare Worker result bridge.
   Script Properties required:
   ASIC_SKILL_RESULT_ENDPOINT = https://asic-skill-material-server.asic-skill-materials.workers.dev/quiz-result
   ASIC_SKILL_WEBHOOK_SECRET = same secret as Cloudflare QUIZ_WEBHOOK_SECRET

   IMPORTANT:
   1. Put the 10 EDIT Form IDs in FORM_IDS.
   2. Run installTriggers() ONCE after all IDs are entered.
   3. Current ASIC Physical Design quizzes contain 10 scored MCQs, 1 point each.
*/

const FORM_IDS = [
  // "EDIT_FORM_ID_QUIZ_01",
  // "EDIT_FORM_ID_QUIZ_02",
  // "EDIT_FORM_ID_QUIZ_03",
  // "EDIT_FORM_ID_QUIZ_04",
  // "EDIT_FORM_ID_QUIZ_05",
  // "EDIT_FORM_ID_QUIZ_06",
  // "EDIT_FORM_ID_QUIZ_07",
  // "EDIT_FORM_ID_QUIZ_08",
  // "EDIT_FORM_ID_QUIZ_09",
  // "EDIT_FORM_ID_QUIZ_10",
];

const EXPECTED_MAX_SCORE = 10;

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  const ids = FORM_IDS.filter(id => id && !String(id).startsWith("EDIT_FORM_ID_"));
  if (!ids.length) {
    throw new Error("No Google Form EDIT IDs have been configured in FORM_IDS.");
  }

  ids.forEach(id => {
    ScriptApp.newTrigger("onQuizSubmit")
      .forForm(FormApp.openById(id))
      .onFormSubmit()
      .create();
  });

  Logger.log("Installed " + ids.length + " form-submit trigger(s).");
}

function onQuizSubmit(e) {
  if (!e || !e.source || !e.response) {
    throw new Error("onQuizSubmit must run from a Google Form submit trigger.");
  }

  const props = PropertiesService.getScriptProperties();
  const endpoint = props.getProperty("ASIC_SKILL_RESULT_ENDPOINT");
  const secret = props.getProperty("ASIC_SKILL_WEBHOOK_SECRET");

  if (!endpoint || !secret) {
    throw new Error("Missing ASIC-Skill Script properties.");
  }

  const form = e.source;
  const response = e.response;

  let email = "";
  response.getItemResponses().forEach(r => {
    if (r.getItem().getTitle() === "ASIC-Skill Student Email") {
      email = String(r.getResponse() || "").trim();
    }
  });

  if (!email) {
    throw new Error("ASIC-Skill Student Email is empty.");
  }

  let score = 0;
  response.getGradableItemResponses().forEach(r => {
    const pts = r.getScore();
    if (typeof pts === "number" && Number.isFinite(pts)) {
      score += pts;
    }
  });

  // Defensive validation for the current 10-question / 10-point quiz format.
  const maxScore = EXPECTED_MAX_SCORE;
  if (!Number.isFinite(score) || score < 0) {
    throw new Error("Calculated quiz score is invalid.");
  }
  if (score > maxScore) {
    throw new Error("Calculated score exceeds expected maximum: " + score + "/" + maxScore);
  }

  const payload = {
    email: email,
    quiz_title: form.getTitle(),
    score: score,
    max_score: maxScore
  };

  // This log is immediately before transmission, so it shows exactly what
  // Apps Script is sending to the Cloudflare Worker.
  Logger.log("Sending quiz result: " + payload.quiz_title + " | " + payload.score + "/" + payload.max_score);

  const res = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: {
      "X-ASIC-Skill-Webhook": secret
    },
    payload: JSON.stringify(payload)
  });

  const status = res.getResponseCode();
  const body = res.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error("Result bridge failed (" + status + "): " + body);
  }

  Logger.log("Result bridge completed successfully.");
}
