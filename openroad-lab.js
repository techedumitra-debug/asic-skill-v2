const $ = (id) => document.getElementById(id);
const API = (window.ASIC_SKILL_LAB_API || '').replace(/\/$/, '');
const materialId = new URLSearchParams(location.search).get('id');

const STAGE_META = {
  "synthesis": {
    "group": "Synthesis",
    "label": "Synthesis",
    "description": "Prepare the synthesized OpenDB"
  },
  "initial_floorplan": {
    "group": "Floorplan",
    "label": "Initial Floorplan",
    "description": "Create die/core, rows and tracks"
  },
  "macro_placement": {
    "group": "Floorplan",
    "label": "Macro Placement",
    "description": "Place hard macros when present"
  },
  "tapcell": {
    "group": "Floorplan",
    "label": "Tapcell / Welltie",
    "description": "Insert substrate support cells"
  },
  "pdn": {
    "group": "Floorplan",
    "label": "PDN / Floorplan Complete",
    "description": "Power grid and canonical floorplan"
  },
  "global_placement": {
    "group": "Placement",
    "label": "Global Placement (initial)",
    "description": "Global cells placement before I/O"
  },
  "io_placement": {
    "group": "Placement",
    "label": "I/O Placement",
    "description": "Place ports on legal layers"
  },
  "timing_placement": {
    "group": "Placement",
    "label": "Timing-driven Placement",
    "description": "Timing/routability optimization"
  },
  "repair_placement": {
    "group": "Placement",
    "label": "Repair / Resizing",
    "description": "Buffer and cell size repair"
  },
  "detailed_placement": {
    "group": "Placement",
    "label": "Detailed Placement",
    "description": "Legalize standard cells"
  },
  "cts": {
    "group": "CTS",
    "label": "Clock Tree Synthesis",
    "description": "Build and balance clock network"
  },
  "global_route": {
    "group": "Routing",
    "label": "Global Routing",
    "description": "Plan routing topology and congestion"
  },
  "detailed_route": {
    "group": "Routing",
    "label": "Detailed Routing",
    "description": "Detailed wire routing"
  },
  "fillcell": {
    "group": "Routing",
    "label": "Fillcell / Route Complete",
    "description": "Final routing ODB and timing constraints"
  },
  "density_fill": {
    "group": "Finalization",
    "label": "Density Fill",
    "description": "Insert filler geometries"
  },
  "final_report": {
    "group": "Finalization",
    "label": "Final Reports + GDS Export",
    "description": "Reports and output artifacts \u2014 educational QA"
  }
};
const STAGE_ORDER = Object.keys(STAGE_META);
const STAGE_LABELS = Object.fromEntries(STAGE_ORDER.map(id => [id, STAGE_META[id].label]));
const PHASE_ORDER = ['Synthesis', 'Floorplan', 'Placement', 'CTS', 'Routing', 'Finalization'];
let selectedPhase = 'Synthesis';
let availablePairs = [];
let catalogVerified = false;

let session = null;
let sessionId = null;
let pollTimer = null;
let timerInterval = null;
let sessionStartedAt = null;
let currentLayoutStage = null;
let layoutObjectUrl = null;
let terminal = null;
let fitAddon = null;
let terminalSocket = null;
let terminalLine = '';
let terminalReady = false;
let latestStageState = null;
let terminalCursor = 0;
let commandHistory = [];
let commandHistoryIndex = 0;
let lastCollaterals = null;
let lastFlowLog = '';
let logFollow = true;
let lastSanitySignature = '';

function apiHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: 'Bearer ' + window.__asicSession?.access_token,
  };
}

function setState(kind, title, subtitle) {
  $('job-status').textContent = title;
  $('job-substatus').textContent = subtitle;
  $('status-dot').className = 'status-dot' + (kind ? ' ' + kind : '');
}

function appendLog(line) {
  const pre = $('terminal-log');
  pre.textContent += line + '\n';
  pre.scrollTop = pre.scrollHeight;
}

function params() {
  return {
    material_id: materialId,
    design: $('design').value,
    platform: $('platform').value,
    utilization: Number($('utilization').value),
    aspect_ratio: Number($('aspect').value),
    core_margin: Number($('margin').value),
  };
}

function lockParameters(locked) {
  ['design', 'platform', 'utilization', 'aspect', 'margin'].forEach(id => {
    $(id).disabled = locked;
  });
}

function updateRequested(p) {
  $('result-requested-util').textContent = p.utilization + '%';
  $('result-aspect').textContent = p.aspect_ratio;
  $('result-margin').textContent = p.core_margin + ' µm';
}

function formatNumber(value, suffix = '', digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) + suffix : '—';
}

function updateMetrics(body) {
  const metrics = body?.metrics || {};
  const p = body?.parameters || params();
  updateRequested(p);
  const measured = Number(metrics.measured_utilization_pct);
  const requested = Number(p.utilization);
  $('result-measured-util').textContent = Number.isFinite(measured)
    ? measured.toFixed(measured % 1 ? 1 : 0) + '%'
    : '—';
  $('result-area').textContent = metrics.design_area_um2 != null
    ? Number(metrics.design_area_um2).toFixed(0) + ' µm²'
    : '—';
  $('result-memory').textContent = metrics.peak_memory_mb != null
    ? formatNumber(metrics.peak_memory_mb, ' MB', 1)
    : '—';
  if (Number.isFinite(measured) && Number.isFinite(requested)) {
    const delta = measured - requested;
    $('result-delta').textContent = (delta >= 0 ? '+' : '') + delta.toFixed(delta % 1 ? 1 : 0) + ' pp';
    $('result-insight').textContent = `OpenROAD currently reports ${measured}% utilization versus the ${requested}% requested target (${delta >= 0 ? '+' : ''}${delta.toFixed(delta % 1 ? 1 : 0)} percentage points).`;
  } else {
    $('result-delta').textContent = '—';
  }
}

function resetMetrics() {
  const p = params();
  updateRequested(p);
  $('result-measured-util').textContent = '—';
  $('result-area').textContent = '—';
  $('result-delta').textContent = '—';
  $('result-memory').textContent = '—';
  $('result-session').textContent = '—';
}

function buildFlowUI() {
  const bar = $('phase-tabs');
  const cards = $('flow-steps');
  const views = $('layout-stage-buttons');
  bar.replaceChildren(); cards.replaceChildren(); views.replaceChildren();
  PHASE_ORDER.forEach(phase => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = phase; button.dataset.phase = phase;
    button.addEventListener('click', () => selectPhase(phase));
    bar.appendChild(button);
  });
  STAGE_ORDER.forEach((id, index) => {
    const meta = STAGE_META[id];
    const article = document.createElement('article');
    article.className = 'flow-step'; article.dataset.stage = id; article.dataset.phase = meta.group;
    article.innerHTML = `<div class="step-number">${String(index + 1).padStart(2,'0')}</div>
      <div class="step-copy"><span>${meta.group}</span><h4></h4><p></p><small class="inline-sanity">PRE: — &nbsp; POST: —</small></div>
      <div class="step-state"><b>LOCKED</b><button type="button" disabled>Run</button></div>`;
    article.querySelector('h4').textContent = meta.label;
    article.querySelector('p').textContent = meta.description;
    article.querySelector('button').addEventListener('click', () => runStage(id));
    cards.appendChild(article);
    if (true) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.dataset.layoutStage = id; btn.textContent = meta.label; btn.disabled = true;
      btn.addEventListener('click', () => loadLayout(id));
      views.appendChild(btn);
    }
  });
  selectPhase(selectedPhase);
}

function selectPhase(phase) {
  selectedPhase = phase;
  document.querySelectorAll('#phase-tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.phase === phase);
    btn.setAttribute('aria-pressed', String(btn.dataset.phase === phase));
  });
  document.querySelectorAll('.flow-step').forEach(card => {
    card.hidden = card.dataset.phase !== phase;
  });
}

function renderSanity(stages = {}) {
  const signature = JSON.stringify(STAGE_ORDER.map(key => [key, stages[key]?.status, stages[key]?.sanity]));
  if (signature === lastSanitySignature) return;
  lastSanitySignature = signature;
  const root = $('sanity-results');
  const expanded = Object.fromEntries([...root.querySelectorAll('.sanity-stage[data-stage]')]
    .map(node => [node.dataset.stage, node.open]));
  root.replaceChildren();
  for (const key of STAGE_ORDER) {
    const item = stages[key] || {};
    const reports = item.sanity || {};
    const section = document.createElement('details');
    section.className = 'sanity-stage'; section.dataset.stage = key;
    section.open = Object.prototype.hasOwnProperty.call(expanded,key) ? expanded[key] : !!reports.pre || !!reports.post;
    const heading = document.createElement('summary');
    heading.textContent = `${STAGE_META[key].group} · ${STAGE_LABELS[key]} — ${item.status || 'NOT RUN'}`;
    section.appendChild(heading);
    if (!reports.pre && !reports.post) {
      const message = document.createElement('p'); message.className='muted-hint';
      message.textContent = 'NOT RUN · Required inputs, previous OpenDB, physical evidence and output file integrity will be checked when this stage runs. No quality result is assumed.';
      section.appendChild(message);
    }
    for (const phase of ['pre', 'post']) {
      const result = reports[phase];
      if (!result) {
        const pending = document.createElement('p'); pending.className='sanity-status';
        pending.textContent = `${phase.toUpperCase()} · NOT RUN`;
        section.appendChild(pending); continue;
      }
      const heading = document.createElement('p');
      heading.className = `sanity-status ${result.status}`;
      heading.textContent = `${phase.toUpperCase()} · ${result.status.toUpperCase()}`;
      section.appendChild(heading);
      const groupLabel = document.createElement('h5'); groupLabel.textContent = 'Required artifact / integrity gates'; section.appendChild(groupLabel);
      for (const check of result.checks || []) {
        addSanityRow(section, check);
      }
      const evidenceTitle = document.createElement('h5'); evidenceTitle.textContent = 'Engineering measurements & unresolved checks (nonblocking)'; section.appendChild(evidenceTitle);
      for (const check of result.engineering || []) addSanityRow(section, check);
    }
    root.appendChild(section);
  }

}

function addSanityRow(section, check) {
  const row = document.createElement('div'); row.className = `sanity-check ${check.status}`;
  const name = document.createElement('strong'); name.textContent = `${(check.status || 'not_checked').toUpperCase()} · ${check.name}`;
  const detail = document.createElement('span'); detail.textContent = check.detail || '';
  row.append(name, detail); section.appendChild(row);
}

function updatePairOptions() {
  const platform = $('platform'); const design = $('design');
  const currentP = platform.value; const currentD = design.value;
  const platforms = [...new Set(availablePairs.map(row => row.platform))];
  platform.replaceChildren();
  platforms.forEach(name => platform.add(new Option(name.toUpperCase(), name)));
  if (platforms.includes(currentP)) platform.value = currentP;
  const designs = availablePairs.filter(row => row.platform === platform.value);
  design.replaceChildren();
  designs.forEach(row => design.add(new Option(row.design.toUpperCase(), row.design)));
  if (designs.some(row => row.design === currentD)) design.value = currentD;
}

async function loadCatalog() {
  $('retry-catalog').disabled = true;
  $('retry-catalog').textContent = 'Checking connection…';
  try {
    return await loadCatalogOnce();
  } finally {
    $('retry-catalog').disabled = false;
    $('retry-catalog').textContent = '↻ Retry Connection';
  }
}

async function loadCatalogOnce() {
  if (!API) {
    $('catalog-status').textContent = 'Backend not configured. Set the guided lab API URL in openroad-lab-config.js.';
    return;
  }
  try {
    const response = await apiJson('/api/lab/catalog');
    availablePairs = response.items || [];
    catalogVerified = !!response.verified;
    updatePairOptions();
    $('start-session').disabled = availablePairs.length === 0;
    $('catalog-status').textContent = availablePairs.length
      ? `${availablePairs.length} compatible design / technology option(s) found${catalogVerified ? ' in your installed ORFS image' : ' (demo preview)'}.`
      : `${response.note || 'No verified designs found.'} Verify Docker image and guided backend.`;
  } catch (error) {
    $('start-session').disabled = true;
    availablePairs = [];
    catalogVerified = false;
    $('design').replaceChildren(new Option('Designs unavailable', ''));
    $('platform').replaceChildren(new Option('Technologies unavailable', ''));
    const explanation = await explainCatalogError(error);
    $('catalog-status').textContent = `Cannot load designs: ${explanation}`;
    setState('error', 'Guided Lab connection needs attention', explanation);
  }
}

function setTab(name) {
  document.querySelectorAll('.lab-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  document.querySelectorAll('.lab-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === name);
  });
  if (name === 'terminal') {
    ensureTerminal();
    setTimeout(() => fitAddon?.fit(), 40);
  }
}

function stageCard(stage) {
  return document.querySelector(`.flow-step[data-stage="${stage}"]`);
}

function updateStageCards(body) {
  const states = body?.stages || {};
  latestStageState = states;
  STAGE_ORDER.forEach(stage => {
    const card = stageCard(stage);
    if (!card) return;
    const state = states[stage] || { status: 'locked' };
    card.classList.remove('ready', 'running', 'completed', 'failed');
    if (['ready', 'running', 'completed', 'failed'].includes(state.status)) card.classList.add(state.status);
    const badge = card.querySelector('.step-state b');
    const button = card.querySelector('.step-state button');
    badge.textContent = String(state.status || 'locked').toUpperCase();
    const pre = state.sanity?.pre?.status || '—';
    const post = state.sanity?.post?.status || '—';
    const quick = card.querySelector('.inline-sanity');
    if (quick) quick.textContent = `PRE: ${pre.toUpperCase()} · POST: ${post.toUpperCase()}`;
    button.textContent = state.status === 'completed' ? 'Complete' : state.status === 'running' ? 'Running…' : 'Run';
    button.disabled = !sessionId || !API || !['ready', 'failed'].includes(state.status) || !!body?.busy;
  });

  document.querySelectorAll('[data-layout-stage]').forEach(btn => {
    const stage = btn.dataset.layoutStage;
    btn.disabled = states[stage]?.status !== 'completed';
    btn.title = states[stage]?.visual ? 'Inspect captured OpenROAD image' : 'Inspect stage observations; image rendering unavailable';
  });

  renderSanity(states);

}

function syncFlowLog(body) {
  if (!Array.isArray(body?.log_tail)) return;
  const pre = $('terminal-log');
  const nearEnd = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 64;
  const newLog = body.log_tail.join('\n') + '\n';
  if (newLog !== lastFlowLog) {
    pre.textContent = newLog;
    lastFlowLog = newLog;
    if (logFollow && nearEnd) pre.scrollTop = pre.scrollHeight;
  }
}

function updateSessionUI(body) {
  if (!body) return;
  updateMetrics(body);
  updateStageCards(body);
  syncFlowLog(body);
  $('result-session').textContent = sessionId ? sessionId.slice(0, 8) : '—';

  if (body.status === 'error') {
    setState('error', 'Lab needs attention', body.message || 'The current stage failed.');
  } else if (body.busy || body.status === 'running') {
    const label = body.current_stage ? STAGE_LABELS[body.current_stage] : 'OpenROAD';
    setState('running', label + ' running', body.message || 'OpenROAD is executing the approved stage.');
  } else if (body.status === 'ready') {
    const completed = STAGE_ORDER.filter(stage => body.stages?.[stage]?.status === 'completed').length;
    if (completed === STAGE_ORDER.length) {
      setState('done', 'Educational PnR complete', 'All 16 stages completed. Inspect final reports, sanity results and layouts.');
    } else {
      setState(completed ? 'done' : '', completed ? 'Stage complete' : 'Lab session ready', body.message || 'Run the next guided stage.');
    }
  }

  const completedStages = STAGE_ORDER.filter(stage => body.stages?.[stage]?.status === 'completed');
  if (completedStages.length && (!currentLayoutStage || !body.stages?.[currentLayoutStage] ||
      body.stages[currentLayoutStage].status !== 'completed')) {
    loadLayout(completedStages[completedStages.length - 1]);
  }
}

function startSessionClock() {
  clearInterval(timerInterval);
  sessionStartedAt = Date.now();
  timerInterval = setInterval(() => {
    if (!sessionId) {
      $('session-timer').textContent = 'No session';
      return;
    }
    const seconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    $('session-timer').textContent = `Session ${mm}:${ss}`;
  }, 1000);
}

// Re-check an expired Supabase token once. Authentication is always enforced
// by the Guided Lab server; this never invents, reuses, or bypasses a token.
async function refreshGuidedAuth() {
  try {
    const { data, error } = await supabaseClient.auth.refreshSession();
    if (error || !data?.session?.access_token) return false;
    window.__asicSession = data.session;
    return true;
  } catch (_) { return false; }
}

async function fetchGuided(path, options = {}) {
  const send = () => fetch(API + path, {
    ...options,
    headers: apiHeaders(options.headers || {}),
  });
  let res;
  try {
    res = await send();
    if (res.status === 401 && await refreshGuidedAuth()) res = await send();
  } catch (error) {
    throw new Error(`Cannot reach Guided OpenROAD API (${API}). Verify the guided server on port 8080, /health, CORS and HTTP/HTTPS. ${error.message}`);
  }
  return res;
}

async function apiJson(path, options = {}) {
  const res = await fetchGuided(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const failure = new Error(body.error || `Lab API error ${res.status}`);
    failure.status = res.status;
    throw failure;
  }
  return body;
}

// Health intentionally contains no secrets. It identifies the most common
// reason why an otherwise signed-in student receives 401 on /api/lab/catalog.
async function explainCatalogError(error) {
  if (error.status !== 401) return error.message;
  try {
    const response = await fetch(`${API}/health`, { cache: 'no-store' });
    const info = response.ok ? await response.json() : {};
    if (info.auth_configured === false) {
      return 'Guided server authentication is not configured. Add the same SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY used by supabase-config.js to openroad-lab-server/.env, then restart the guided server (port 8080).';
    }
  } catch (_) { /* Original 401 is still actionable. */ }
  return 'The guided server rejected your sign-in token (HTTP 401). Confirm its .env uses the SAME Supabase project URL and publishable key as supabase-config.js. Then sign out/in and click Retry Connection.';
}

async function createSession() {
  if (!API) {
    appendLog('Preview mode: no lab API is configured.');
    setState('', 'Preview mode', 'Configure the Linux lab API to create an isolated OpenROAD session.');
    return;
  }
  $('start-session').disabled = true;
  resetMetrics();
  setState('running', 'Creating lab session', 'Starting an isolated OpenROAD container…');
  try {
    const body = await apiJson('/api/lab/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params()),
    });
    sessionId = body.session_id;
    lockParameters(true);
    $('start-session').hidden = true;
    $('reset-session').hidden = false;
    $('result-session').textContent = sessionId.slice(0, 8);
    startSessionClock();
    updateSessionUI(body);
    loadCollaterals();
    beginPolling();
    ensureTerminal(true);
  } catch (error) {
    setState('error', 'Could not create lab', error.message);
    appendLog('ERROR: ' + error.message);
    $('start-session').disabled = availablePairs.length === 0;
  }
}

async function runStage(stage) {
  if (!sessionId) return;
  const card = stageCard(stage);
  const button = card?.querySelector('button');
  if (button) button.disabled = true;
  try {
    await apiJson(`/api/lab/sessions/${encodeURIComponent(sessionId)}/stages/${encodeURIComponent(stage)}`, { method: 'POST' });
    setState('running', STAGE_LABELS[stage] + ' queued', 'OpenROAD is starting this guided stage…');
  } catch (error) {
    setState('error', 'Could not start stage', error.message);
    appendLog('ERROR: ' + error.message);
  }
}

async function pollOnce() {
  if (!sessionId || !API) return;
  try {
    const body = await apiJson(`/api/lab/sessions/${encodeURIComponent(sessionId)}`);
    updateSessionUI(body);
  } catch (error) {
    clearInterval(pollTimer);
    setState('error', 'Lab connection lost', error.message);
  }
}

function beginPolling() {
  clearInterval(pollTimer);
  pollOnce();
  pollTimer = setInterval(pollOnce, 1600);
}

async function resetSession() {
  if (!sessionId) return;
  $('reset-session').disabled = true;
  try {
    await apiJson(`/api/lab/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  } catch (error) {
    if (!String(error.message).includes('not found')) {
      $('reset-session').disabled = false;
      setState('error', 'Could not reset lab', error.message);
      return;
    }
  }
  clearInterval(pollTimer);
  clearInterval(timerInterval);
  disconnectTerminal();
  sessionId = null;
  currentLayoutStage = null;
  lockParameters(false);
  $('start-session').hidden = false;
  $('start-session').disabled = availablePairs.length === 0;
  $('reset-session').hidden = true;
  $('reset-session').disabled = false;
  $('session-timer').textContent = 'No session';
  $('terminal-log').textContent = 'ASIC-Skill guided OpenROAD lab ready.\n';
  resetMetrics();
  document.querySelectorAll('.flow-step').forEach((card, index) => {
    card.classList.remove('ready', 'running', 'completed', 'failed');
    if (index === 0) card.classList.add('ready');
    const badge = card.querySelector('.step-state b');
    const btn = card.querySelector('.step-state button');
    badge.textContent = index === 0 ? 'READY' : 'LOCKED';
    btn.textContent = 'Run';
    btn.disabled = true;
  });
  document.querySelectorAll('[data-layout-stage]').forEach(btn => { btn.disabled = true; btn.classList.remove('active'); });
  $('layout-image').removeAttribute('src');
  $('layout-message').textContent = 'Complete a physical stage to generate its OpenROAD visual.';
  $('layout-fallback').hidden = false;
  $('collateral-rows').replaceChildren();
  $('collateral-summary').textContent = 'Start a session to inspect actual ORFS inputs.';
  $('flow-preview-box').hidden = true;
  renderSanity({});
  setState('', 'Ready', 'Choose parameters and start the guided lab.');
}

async function loadLayout(stage) {
  if (!sessionId || !API || latestStageState?.[stage]?.status !== 'completed') return;
  currentLayoutStage = stage;
  const state = latestStageState[stage];
  const observations = state.sanity?.post?.observations || {};
  const box = $('layout-fallback');
  $('layout-image').removeAttribute('src');
  box.hidden = false;
  box.textContent = `${STAGE_LABELS[stage]} | OpenDB: ${state.sanity?.post?.status || 'not checked'} | Instances: ${observations.instances ?? 'n/a'} | Placed: ${observations.placed ?? 'n/a'} | Signal nets with wires: ${observations.wired_nets ?? 'n/a'} | Clock nets: ${observations.clock_nets ?? 'n/a'}`;
  $('layout-message').textContent = `${STAGE_LABELS[stage]}: ${state.visual ? 'Opening a real OpenROAD image…' : 'No PNG was captured for this stage. OpenDB observations are shown instead.'}`;
  document.querySelectorAll('[data-layout-stage]').forEach(btn => btn.classList.toggle('active', btn.dataset.layoutStage === stage));
  if (!state.visual) return;
  try {
    const res = await fetchGuided(`/api/lab/sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(stage)}`);
    if (!res.ok) throw new Error('Layout image unavailable.');
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Invalid layout preview format.');
    if (layoutObjectUrl) URL.revokeObjectURL(layoutObjectUrl);
    layoutObjectUrl = URL.createObjectURL(blob);
    $('layout-image').src = layoutObjectUrl;
    box.hidden = true;
    $('layout-message').textContent = `${STAGE_LABELS[stage]} — rendered from the completed OpenDB, display only.`;
  } catch (error) {
    box.hidden = false;
    $('layout-message').textContent = `${STAGE_LABELS[stage]} layout visual could not load: ${error.message}. OpenDB observations remain available.`;
  }
}

async function browserPreview(kind, target = 'flow') {
  if (!sessionId) return;
  const pre = $(target === 'flow' ? 'flow-preview' : 'collateral-preview');
  const title = $(target === 'flow' ? 'flow-preview-title' : 'collateral-preview-title');
  if (target === 'flow') $('flow-preview-box').hidden = false;
  title.textContent = 'Inspecting ' + kind + '…';
  pre.textContent = 'Loading a read-only preview…';
  try {
    const result = await apiJson(`/api/lab/sessions/${encodeURIComponent(sessionId)}/preview/${encodeURIComponent(kind)}`);
    title.textContent = result.title || kind;
    pre.textContent = result.text || '(empty file)';
    if (result.notice) title.textContent += ' · ' + result.notice;
  } catch(error) { pre.textContent = error.message; }
}

async function loadCollaterals() {
  if (!sessionId) return;
  $('collateral-summary').textContent = 'Inspecting inputs within the isolated container…';
  try {
    const body = await apiJson(`/api/lab/sessions/${encodeURIComponent(sessionId)}/collaterals`);
    lastCollaterals = body;
    const container = $('collateral-rows'); container.replaceChildren();
    $('collateral-summary').textContent = `${body.design.toUpperCase()} · ${body.platform.toUpperCase()} | ${body.disclaimer}`;
    for (const item of body.items || []) {
      const card = document.createElement('article'); card.className = 'collateral-card';
      const heading = document.createElement('h4'); heading.textContent = item.label;
      const status = document.createElement('span'); status.className = `collateral-state ${item.status}`; status.textContent = item.status.replace(/_/g,' ').toUpperCase();
      const description = document.createElement('p'); description.textContent = item.meaning;
      const fileNames = document.createElement('div'); fileNames.className = 'collateral-files';
      fileNames.textContent = (item.files || []).length ? item.files.map(f => `${f.file} (${f.bytes} bytes)`).join('\n') : 'No applicable file found / generated at this stage.';
      card.append(heading,status,description,fileNames);
      if ((item.files || []).length && item.key !== 'tlu') {
        const button = document.createElement('button'); button.type='button';button.textContent='Preview in browser';
        button.addEventListener('click',()=>browserPreview(item.key,'collateral'));card.appendChild(button);
      }
      container.appendChild(card);
    }
    $('collateral-declarations').textContent = JSON.stringify(body.declarations || {}, null, 2) + '\n\nValues containing $(...) require ORFS Make expansion and are not proof of active-file consumption.';
  } catch(error) { $('collateral-summary').textContent = 'Input inspection failed: ' + error.message; }
}

function wsUrl() {
  const base = new URL(API);
  const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${base.host}/ws/terminal/${encodeURIComponent(sessionId)}`;
}

const TERMINAL_COMPLETIONS = ['pwd','ls','ls -la','ls -lh','cat','head','tail','grep','help','openroad -version','yosys -V',
  ...STAGE_ORDER.map(stage => 'make ' + ({synthesis:'synth',pdn:'floorplan',detailed_placement:'place',cts:'cts',fillcell:'route',final_report:'finish'}[stage] || ''))].filter(Boolean);
function terminalPrompt() {
  if (!terminal) return;
  terminal.write('\x1b[38;5;45mstudent@asic-lab\x1b[0m:\x1b[38;5;111m/flow\x1b[0m$ ');
}
function redrawTerminalLine() {
  if (!terminal) return;
  // Erase/redraw only this command input (never edit the container's output).
  terminal.write('\r\x1b[2K');terminalPrompt();terminal.write(terminalLine);
  if (terminalCursor < terminalLine.length) terminal.write(`\x1b[${terminalLine.length-terminalCursor}D`);
}
function ensureTerminal(forceReconnect = false) {
  if (!window.Terminal) return;
  if (!terminal) {
    terminal = new Terminal({cursorBlink:true,fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize:13,theme:{background:'#030910',foreground:'#c6f6d5',cursor:'#67e8f9',selectionBackground:'#164e63'},scrollback:4500});
    fitAddon = new FitAddon.FitAddon();terminal.loadAddon(fitAddon);terminal.open($('xterm'));fitAddon.fit();
    terminal.writeln('ASIC-Skill Guided Linux Terminal');
    terminal.writeln('Start a lab session to connect to your isolated OpenROAD container.');
    // The browser normally captures Ctrl+A for select-all; reserve it for this terminal.
    terminal.attachCustomKeyEventHandler(e=>{
      if(e.type!=='keydown')return true;
      const controls={a:'\x01',e:'\x05',u:'\x15',k:'\x0b',w:'\x17',l:'\x0c',r:'\x12'};
      if(e.ctrlKey&&controls[e.key.toLowerCase()]){
        e.preventDefault();handleTerminalInput(controls[e.key.toLowerCase()]);return false;
      }
      if(e.key==='Tab'){
        e.preventDefault();handleTerminalInput('\t');return false;
      }
      return true;
    });
    terminal.onData(handleTerminalInput);
    window.addEventListener('resize',()=>fitAddon?.fit());
  }
  if (forceReconnect) disconnectTerminal(false);
  if (sessionId && API && (!terminalSocket || terminalSocket.readyState > 1)) connectTerminal();
}
function connectTerminal() {
  if (!sessionId || !API || !terminal) return;
  terminalReady=false;terminal.writeln('\r\nConnecting to isolated lab container…');
  terminalSocket=new WebSocket(wsUrl());
  terminalSocket.addEventListener('open',()=>terminalSocket.send(JSON.stringify({type:'auth',token:window.__asicSession.access_token})));
  terminalSocket.addEventListener('message',event=>{
    let msg;try{msg=JSON.parse(event.data)}catch{return}
    if(msg.type==='ready'){terminalReady=true;terminal.writeln(msg.message||'Terminal ready.');terminalPrompt();}
    else if(msg.type==='output')terminal.write(String(msg.data||''));
    else if(msg.type==='prompt'){terminalLine='';terminalCursor=0;terminalPrompt();}
    else if(msg.type==='clear')terminal.clear();
    else if(msg.type==='error')terminal.writeln('\r\nERROR: '+(msg.message||'Terminal error'));
  });
  terminalSocket.addEventListener('close',()=>{terminalReady=false;if(sessionId)terminal.writeln('\r\n[terminal disconnected]');});
  terminalSocket.addEventListener('error',()=>{terminalReady=false;});
}
function disconnectTerminal(clearScreen=true){
  terminalReady=false;terminalLine='';terminalCursor=0;
  if(terminalSocket){try{terminalSocket.close()}catch{}terminalSocket=null;}
  if(terminal&&clearScreen){terminal.clear();terminal.writeln('ASIC-Skill Guided Linux Terminal');terminal.writeln('Start a lab session to connect.');}
}
function sendTerminalCommand(command){
  ensureTerminal();
  if(!terminalReady||!terminalSocket||terminalSocket.readyState!==WebSocket.OPEN){terminal?.writeln('\r\nStart a lab session and wait for terminal connection first.');return;}
  terminalLine=command;terminalCursor=command.length;redrawTerminalLine();handleTerminalInput('\r');
}
function terminalHistory(direction){
  if(!commandHistory.length)return;
  commandHistoryIndex=Math.max(0,Math.min(commandHistory.length,commandHistoryIndex+direction));
  terminalLine=commandHistory[commandHistoryIndex]||'';terminalCursor=terminalLine.length;redrawTerminalLine();
}
function terminalAutocomplete(){
  const matches=TERMINAL_COMPLETIONS.filter(v=>v.startsWith(terminalLine));
  if(matches.length===1){terminalLine=matches[0];terminalCursor=terminalLine.length;redrawTerminalLine();}
  else if(matches.length>1){terminal.write('\r\n'+matches.join('    ')+'\r\n');terminalPrompt();terminal.write(terminalLine);}
}
function handleTerminalInput(data){
  if(!terminalReady)return;
  if(data==='\r'||data==='\n'){
    terminal.write('\r\n');const command=terminalLine.trim();
    if(command){commandHistory.push(command);if(commandHistory.length>100)commandHistory.shift();}
    commandHistoryIndex=commandHistory.length;terminalLine='';terminalCursor=0;
    if(terminalSocket?.readyState===WebSocket.OPEN) terminalSocket.send(JSON.stringify({type:'command',command}));return;
  }
  if(data==='\x1b[A'){terminalHistory(-1);return}
  if(data==='\x1b[B'){terminalHistory(1);return}
  if(data==='\x1b[D'){terminalCursor=Math.max(0,terminalCursor-1);redrawTerminalLine();return}
  if(data==='\x1b[C'){terminalCursor=Math.min(terminalLine.length,terminalCursor+1);redrawTerminalLine();return}
  if(data==='\x1b[H'||data==='\x1bOH'||data==='\x01'){terminalCursor=0;redrawTerminalLine();return}
  if(data==='\x1b[F'||data==='\x1bOF'||data==='\x05'){terminalCursor=terminalLine.length;redrawTerminalLine();return}
  if(data==='\t'){terminalAutocomplete();return}
  if(data==='\x03'){terminalLine='';terminalCursor=0;terminal.write('^C\r\n');terminalPrompt();return}
  if(data==='\x0c'){terminal.clear();redrawTerminalLine();return}
  if(data==='\x15'){terminalLine=terminalLine.slice(terminalCursor);terminalCursor=0;redrawTerminalLine();return}
  if(data==='\x0b'){terminalLine=terminalLine.slice(0,terminalCursor);redrawTerminalLine();return}
  if(data==='\x17'){
    const prefix=terminalLine.slice(0,terminalCursor);const trim=prefix.replace(/\s*[^\s]+\s*$/,'');
    terminalLine=trim+terminalLine.slice(terminalCursor);terminalCursor=trim.length;redrawTerminalLine();return;
  }
  if(data==='\x12'){terminalHistory(-1);return}
  if(data==='\x7f'||data==='\b'){
    if(terminalCursor){terminalLine=terminalLine.slice(0,terminalCursor-1)+terminalLine.slice(terminalCursor);terminalCursor--;redrawTerminalLine();}return;
  }
  if(data==='\x1b[3~'){if(terminalCursor<terminalLine.length){terminalLine=terminalLine.slice(0,terminalCursor)+terminalLine.slice(terminalCursor+1);redrawTerminalLine();}return;}
  if(/^[\x20-\x7E]+$/.test(data)&&terminalLine.length+data.length<240){
    terminalLine=terminalLine.slice(0,terminalCursor)+data+terminalLine.slice(terminalCursor);
    terminalCursor+=data.length;redrawTerminalLine();
  }
}

async function init() {
  const { data: { session: authSession } } = await supabaseClient.auth.getSession();
  if (!authSession) {
    location.href = 'signin.html';
    return;
  }
  window.__asicSession = authSession;
  $('signin-link').textContent = 'Signed In';

  // A course-linked lab still enforces its published-material and entitlement
  // checks. A direct EDA Lab launch needs no material ID.
  if (materialId) {
  const { data, error } = await supabaseClient
    .from('materials')
    .select('id,course_id,module_name,sub_module_name,topic_name,title,description,material_type,access_level,courses(slug,title)')
    .eq('id', materialId)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data || !['openroad_lab','eda_lab'].includes(data.material_type)) {
    $('lab-notice').textContent = 'This OpenROAD lab is unavailable.';
    return;
  }

  if (data.access_level === 'premium') {
    const { data: entitled, error: entErr } = await supabaseClient.rpc('has_premium_course_access', { target_course_id: data.course_id });
    if (entErr || !entitled) {
      $('lab-notice').textContent = 'Premium access is required for this lab.';
      return;
    }
  }

  $('lab-title').textContent = data.title || 'OpenROAD Floorplanning Lab';
  $('lab-meta').textContent = [data.module_name, data.sub_module_name, data.topic_name, data.description].filter(Boolean).join(' • ');
  $('lab-access').textContent = data.access_level.toUpperCase();
  $('lab-access').className = 'pill ' + data.access_level;
  if (data.courses?.slug) $('back-course').href = 'course-content.html?course=' + encodeURIComponent(data.courses.slug);
  } else {
    $('lab-meta').textContent = 'Standalone authenticated learning lab · educational OpenROAD implementation flow';
    $('back-course').href = 'eda-lab.html';
    $('back-course').textContent = '← Back to EDA Lab';
  }

  $('mode-badge').textContent = API ? 'GUIDED LAB' : 'PREVIEW';
  $('lab-notice').hidden = true;
  $('lab-workspace').hidden = false;
  resetMetrics();
  updateStageCards({ stages: { synthesis: { status: 'ready' } } });
  await loadCatalog();
  if (!API) setState('', 'Preview mode', 'Configure the Linux lab API to enable isolated containers, visuals and terminal access.');
}

// Tabs
document.querySelectorAll('.lab-tab').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

// v37.0.22 builds the 16 grouped stages dynamically.
buildFlowUI();
$('platform').addEventListener('change', updatePairOptions);
$('retry-catalog').addEventListener('click', loadCatalog);
$('refresh-collaterals').addEventListener('click',loadCollaterals);

document.querySelectorAll('[data-terminal-command]').forEach(btn => {
  btn.addEventListener('click', () => {
    setTab('terminal');
    sendTerminalCommand(btn.dataset.terminalCommand);
  });
});

$('start-session').addEventListener('click', createSession);
$('reset-session').addEventListener('click', resetSession);
$('clear-log').addEventListener('click', () => { $('terminal-log').textContent = ''; });
document.querySelectorAll('[data-browser-preview]').forEach(btn=>btn.addEventListener('click',()=>browserPreview(btn.dataset.browserPreview)));
$('log-top').addEventListener('click',()=>{logFollow=false;$('terminal-log').scrollTop=0;$('terminal-log').focus()});
$('log-bottom').addEventListener('click',()=>{logFollow=true;const pre=$('terminal-log');pre.scrollTop=pre.scrollHeight;pre.focus()});
$('terminal-log').addEventListener('scroll',()=>{
  const pre=$('terminal-log');logFollow=pre.scrollTop+pre.clientHeight>=pre.scrollHeight-48;
});
$('page-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$('page-bottom').addEventListener('click',()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));
const scrollablePre = new Set(['terminal-log','collateral-preview','collateral-declarations','flow-preview']);
document.addEventListener('keydown',event=>{
  if(event.code!=='Space'||event.ctrlKey||event.altKey||event.metaKey)return;
  const target=event.target;
  if(target.closest?.('input,select,textarea,button,a,[contenteditable="true"],.xterm'))return;
  const scrollElement=scrollablePre.has(target.id)?target:window;
  event.preventDefault();
  if(scrollElement===window)window.scrollBy({top:(event.shiftKey?-1:1)*window.innerHeight*0.8,behavior:'smooth'});
  else scrollElement.scrollBy({top:(event.shiftKey?-1:1)*scrollElement.clientHeight*.8,behavior:'smooth'});
});

window.addEventListener('beforeunload', () => {
  clearInterval(pollTimer);
  clearInterval(timerInterval);
  if (layoutObjectUrl) URL.revokeObjectURL(layoutObjectUrl);
  if (terminalSocket) {
    try { terminalSocket.close(); } catch {}
  }
});

init();
