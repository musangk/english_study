/* English Grammar in Use — 하루 20문장 학습기
   - Data: data/sentences.json  (4,388 sentences / 220 days)
   - Audio: Web Speech API (browser TTS)
   - Memorization: Leitner spaced repetition, progress in localStorage
*/
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');

/* ---------- State & storage ---------- */
const LS = {
  prog: 'gu.progress.v1',   // { [id]: {box, due, seen} }
  set: 'gu.settings.v1',    // { rate, twice, gap, voiceURI, startDate }
  meta: 'gu.meta.v1',       // { cursorDay, lastStudy, streak }
};
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let DATA = null;
let progress = load(LS.prog, {});
let settings = Object.assign({ rate: 1, twice: true, gap: 0.8, voiceURI: '', startDate: '' }, load(LS.set, {}));
let meta = Object.assign({ cursorDay: 1, lastStudy: '', streak: 0 }, load(LS.meta, {}));

const INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 9, 5: 20 }; // days until next review by new box
const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
const addDays = (s, n) => { const d = new Date(s + 'T00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };

function rec(id) { return progress[id] || { box: 0, due: '', seen: false }; }
function statusOf(id) { const b = rec(id).box; return b >= 4 ? 'known' : b >= 2 ? 'learning' : rec(id).seen ? 'new' : 'new'; }
function grade(id, g) { // g: 'again' | 'hard' | 'good'
  const r = rec(id);
  let box = r.box || 1;
  if (g === 'again') box = 1;
  else if (g === 'hard') box = Math.max(1, box);
  else box = Math.min(5, box + 1);
  const due = g === 'again' ? todayStr() : addDays(todayStr(), INTERVALS[box]);
  progress[id] = { box, due, seen: true };
  save(LS.prog, progress);
  bumpStreak();
}
function markSeen(id) { const r = rec(id); if (!r.seen) { progress[id] = { box: Math.max(1, r.box), due: r.due || addDays(todayStr(), 1), seen: true }; save(LS.prog, progress); } }
function bumpStreak() {
  const t = todayStr();
  if (meta.lastStudy === t) return;
  meta.streak = meta.lastStudy && addDays(meta.lastStudy, 1) === t ? meta.streak + 1 : 1;
  meta.lastStudy = t; save(LS.meta, meta);
}

/* ---------- Data helpers ---------- */
const dayItems = (day) => DATA.sentences.filter(s => s.day === day);
const dueItems = () => DATA.sentences.filter(s => rec(s.id).seen && rec(s.id).due && rec(s.id).due <= todayStr());
function dayState(day) {
  const it = dayItems(day); const seen = it.filter(s => rec(s.id).seen).length;
  return seen === 0 ? 'todo' : seen === it.length ? 'done' : 'partial';
}

/* ---------- TTS engine ---------- */
const TTS = {
  voices: [], voice: null, keepAlive: null,
  init() {
    const pick = () => {
      this.voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      this.choose(settings.voiceURI);
      renderVoiceOptions();
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  },
  choose(uri) {
    this.voice = this.voices.find(v => v.voiceURI === uri)
      || this.voices.find(v => /United States|US|en-US/i.test(v.lang + v.name))
      || this.voices[0] || null;
  },
  speak(text) {
    return new Promise((resolve) => {
      try { speechSynthesis.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; }
      u.rate = settings.rate; u.pitch = 1;
      u.onend = u.onerror = () => resolve();
      // iOS/Safari keep-alive: synthesis pauses itself on long runs
      clearInterval(this.keepAlive);
      this.keepAlive = setInterval(() => { if (speechSynthesis.speaking) speechSynthesis.resume(); }, 5000);
      speechSynthesis.speak(u);
    });
  },
  stop() { clearInterval(this.keepAlive); try { speechSynthesis.cancel(); } catch {} },
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function say(text) { await TTS.speak(text); if (settings.twice) { await sleep(250); await TTS.speak(text); } }

/* ---------- Router ---------- */
function go(hash) { location.hash = hash; }
function router() {
  player.stop();
  const h = location.hash.slice(1) || 'home';
  const [route, arg] = h.split('/');
  if (route === 'day') renderDay(+arg || 1);
  else if (route === 'review') renderReview();
  else if (route === 'list') renderList();
  else renderHome();
  window.scrollTo(0, 0);
}

/* ---------- Views ---------- */
function ring(pct, label, sub) {
  const R = 34, C = 2 * Math.PI * R, off = C * (1 - pct / 100);
  return `<svg class="ring" width="86" height="86" viewBox="0 0 86 86">
    <circle cx="43" cy="43" r="${R}" fill="none" stroke="var(--line)" stroke-width="8"/>
    <circle cx="43" cy="43" r="${R}" fill="none" stroke="var(--accent)" stroke-width="8"
      stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"
      transform="rotate(-90 43 43)"/>
    <text x="43" y="41" text-anchor="middle" font-size="19" font-weight="700" fill="var(--text)">${label}</text>
    <text x="43" y="57" text-anchor="middle" font-size="10" fill="var(--muted)">${sub}</text>
  </svg>`;
}

function renderHome() {
  const doneDays = Array.from({ length: DATA.totalDays }, (_, i) => i + 1).filter(d => dayState(d) === 'done').length;
  const pct = Math.round(doneDays / DATA.totalDays * 100);
  const due = dueItems().length;
  const known = DATA.sentences.filter(s => rec(s.id).box >= 4).length;
  const cur = Math.min(meta.cursorDay, DATA.totalDays);

  app.innerHTML = `
    <section class="hero">
      ${ring(pct, doneDays, `/ ${DATA.totalDays}일`)}
      <div class="hero-info">
        <h1>${doneDays === 0 ? '오늘부터 시작해요! 👋' : `${doneDays}일 완료 · 잘하고 있어요`}</h1>
        <p>${DATA.title}</p>
        <p>전체 ${DATA.totalSentences.toLocaleString()}문장 · 하루 ${DATA.perDay}문장</p>
      </div>
    </section>

    <div class="stat-row">
      <div class="stat"><b>Day ${cur}</b><span>오늘 진도</span></div>
      <div class="stat"><b style="color:var(--amber)">${due}</b><span>복습 대기</span></div>
      <div class="stat"><b style="color:var(--green)">${known}</b><span>암기 완료</span></div>
    </div>

    <div class="action-grid">
      <button class="btn primary lg" id="goToday">📖 오늘 학습<span class="sub">Day ${cur}</span></button>
      <button class="btn lg" id="goReview" ${due ? '' : 'disabled'}>🔁 복습<span class="sub">${due ? due + '문장 대기' : '대기 없음'}</span></button>
      <button class="btn lg" id="goListen">🎧 오늘 듣기<span class="sub">핸즈프리 재생</span></button>
      <button class="btn lg" id="goList">📚 전체 목록<span class="sub">Day 1–${DATA.totalDays}</span></button>
    </div>

    <div class="section-title">최근 진도</div>
    <div class="day-list" id="recent"></div>
  `;

  // recent days: around cursor
  const start = Math.max(1, cur - 1);
  const recent = $('#recent');
  for (let d = start; d < start + 6 && d <= DATA.totalDays; d++) recent.append(dayRow(d));

  $('#goToday').onclick = () => go(`day/${cur}`);
  $('#goReview').onclick = () => due && go('review');
  $('#goListen').onclick = () => go(`day/${cur}?listen`);
  $('#goList').onclick = () => go('list');
}

function dayRow(d) {
  const st = dayState(d);
  const badge = { done: 'done', partial: 'partial', todo: 'todo' }[st];
  const label = { done: '완료', partial: '진행중', todo: '시작 전' }[st];
  const first = dayItems(d)[0]?.en || '';
  const b = document.createElement('button');
  b.className = 'day-item';
  b.innerHTML = `<span class="num">Day ${d}</span><span class="prev">${first}</span><span class="badge ${badge}">${label}</span>`;
  b.onclick = () => go(`day/${d}`);
  return b;
}

function renderList() {
  app.innerHTML = `<div class="study-head"><h1>전체 목록</h1></div>
    <p class="muted small" style="margin-bottom:12px">Day를 선택하세요 · 총 ${DATA.totalDays}일</p>
    <div class="day-list" id="all"></div>`;
  const all = $('#all');
  const frag = document.createDocumentFragment();
  for (let d = 1; d <= DATA.totalDays; d++) frag.append(dayRow(d));
  all.append(frag);
}

/* --- Day view with 3 modes --- */
let curMode = 'study';
function renderDay(day) {
  const wantListen = location.hash.includes('?listen');
  curMode = wantListen ? 'listen' : 'study';
  meta.cursorDay = Math.max(meta.cursorDay, day); save(LS.meta, meta);
  const items = dayItems(day);

  app.innerHTML = `
    <div class="study-head">
      <button class="icon-btn" id="dPrev" ${day <= 1 ? 'disabled' : ''}>‹</button>
      <h1 style="text-align:center">Day ${day}</h1>
      <button class="icon-btn" id="dNext" ${day >= DATA.totalDays ? 'disabled' : ''}>›</button>
    </div>
    <div class="mode-tabs">
      <button data-m="study">📖 학습</button>
      <button data-m="listen">🎧 듣기</button>
      <button data-m="test">✍️ 시험</button>
      <button data-m="talk">💬 대화</button>
    </div>
    <div id="modeBody"></div>`;

  $('#dPrev').onclick = () => go(`day/${day - 1}`);
  $('#dNext').onclick = () => go(`day/${day + 1}`);
  $$('.mode-tabs button').forEach(b => b.onclick = () => setMode(b.dataset.m, day, items));
  setMode(curMode, day, items);
}
function setMode(m, day, items) {
  curMode = m; player.stop();
  $$('.mode-tabs button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  if (m === 'study') modeStudy(items);
  else if (m === 'listen') modeListen(items, `Day ${day}`);
  else if (m === 'talk') modeTalk(items, day);
  else modeTest(items, `Day ${day} 시험`);
}

/* Study mode: tap any sentence to hear it */
function modeStudy(items) {
  const body = $('#modeBody');
  body.innerHTML = `<div class="sent-list">` + items.map((s, i) => `
    <div class="sent-row" data-id="${s.id}" data-i="${i}">
      <span class="dot ${statusOf(s.id)}"></span>
      <span class="idx">${i + 1}</span>
      <span class="txt">${s.en}</span>
      <button class="btn ghost play" aria-label="재생">🔊</button>
    </div>`).join('') + `</div>
    <p class="kbd-hint">문장을 탭하면 소리가 재생됩니다</p>`;
  $$('.sent-row', body).forEach(row => {
    const s = items[+row.dataset.i];
    row.onclick = async () => {
      $$('.sent-row', body).forEach(r => r.classList.remove('playing'));
      row.classList.add('playing');
      markSeen(s.id); row.querySelector('.dot').className = 'dot ' + statusOf(s.id);
      await say(s.en);
      row.classList.remove('playing');
    };
  });
}

/* Listen mode: hands-free autoplay through the day */
function modeListen(items, title) {
  const body = $('#modeBody');
  body.innerHTML = `<div class="sent-list" id="listenList">` + items.map((s, i) => `
    <div class="sent-row" data-i="${i}"><span class="idx">${i + 1}</span><span class="txt">${s.en}</span></div>`).join('')
    + `</div>
    <div class="playbar">
      <button class="btn primary big-play" id="pPlay">▶︎</button>
      <div class="now" id="pNow">▶︎ 를 눌러 ${items.length}문장 연속 재생</div>
      <button class="icon-btn" id="pStop">⏹</button>
    </div>`;
  const rows = $$('#listenList .sent-row', body);
  const highlight = (i) => rows.forEach((r, j) => {
    r.classList.toggle('playing', j === i);
    if (j === i) r.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  $('#pPlay').onclick = () => player.playing ? player.pause() : player.start(items, highlight, title);
  $('#pStop').onclick = () => player.stop();
}

/* Test mode: flashcard recall + spaced-repetition grading */
function modeTest(items, title) { testSession(items, title, () => setMode('study', null, items)); }

/* Talk mode: generate an LLM prompt to practice a conversation with today's sentences */
const TALK_SCENES = [
  { key: 'free', label: '🗣 자유 대화', hint: '일상 주제로 자연스럽게' },
  { key: 'roleplay', label: '🎭 롤플레이', hint: '상황극 (카페·여행 등)' },
  { key: 'interview', label: '🎤 질문 인터뷰', hint: '나에 대해 묻고 답하기' },
];
function buildDayPrompt(items, day, scene) {
  const list = items.map((s, i) => `${i + 1}. ${s.en}`).join('\n');
  const sceneLine = {
    free: 'Have a relaxed everyday conversation with me (hobbies, weekend, work, food, etc.).',
    roleplay: 'Set up a simple real-life role-play (e.g. ordering at a cafe, checking in at a hotel, asking for directions) and play the other person. Tell me the situation first.',
    interview: 'Interview me with friendly questions about my life, opinions and plans, so I keep speaking.',
  }[scene];
  return `You are my friendly English conversation tutor. I'm a Korean learner studying *English Grammar in Use (Intermediate)*.

Today (Day ${day}) I studied these ${items.length} target sentences / grammar patterns:
${list}

Please run a short conversation-practice session based on the patterns above.

Format & rules:
- ${sceneLine}
- Ask only ONE question at a time, then wait for my reply.
- Keep your English natural but at my level (simple, everyday).
- Naturally reuse and recycle today's target grammar patterns throughout the chat so I practice them in context.
- After each of my replies: (1) react briefly and naturally, (2) if I made any mistake, gently correct it, show the natural version, and add a short 한국어 explanation of *why*, (3) then continue with your next line.
- Every 4–5 turns, ask me to make my own sentence using one specific pattern from today's list.
- Keep the conversation itself in English; use Korean only for the correction explanations.
- Be encouraging and keep it light and fun.

When you're ready, greet me and ask your first question. Let's begin!`;
}
function modeTalk(items, day) {
  const body = $('#modeBody');
  let scene = 'free';
  const render = () => {
    const prompt = buildDayPrompt(items, day, scene);
    body.innerHTML = `
      <p class="muted small" style="margin-bottom:10px">아래 프롬프트를 복사해서 ChatGPT·Claude·Gemini 등에 붙여넣으면,
        <b>오늘 배운 ${items.length}문장</b>으로 영어 대화를 연습할 수 있어요.</p>
      <div class="mode-tabs" id="sceneTabs" style="margin-bottom:12px">
        ${TALK_SCENES.map(s => `<button data-s="${s.key}" class="${s.key === scene ? 'active' : ''}" title="${s.hint}">${s.label}</button>`).join('')}
      </div>
      <textarea class="prompt-box" id="promptText" readonly rows="12">${prompt.replace(/</g, '&lt;')}</textarea>
      <div class="card-controls" style="margin-top:12px">
        <button class="btn primary" id="copyBtn">📋 프롬프트 복사</button>
      </div>
      <div class="section-title">바로 열기 (붙여넣기 Ctrl/⌘+V)</div>
      <div class="link-row">
        <a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT ↗</a>
        <a class="btn" href="https://claude.ai/new" target="_blank" rel="noopener">Claude ↗</a>
        <a class="btn" href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini ↗</a>
      </div>
      <p class="kbd-hint">💡 대화가 끝나면 “오늘 문장으로 짧은 퀴즈를 내줘” 라고 이어서 말해보세요.</p>`;
    $$('#sceneTabs button', body).forEach(b => b.onclick = () => { scene = b.dataset.s; render(); });
    $('#copyBtn').onclick = async () => {
      const btn = $('#copyBtn');
      try { await navigator.clipboard.writeText(prompt); }
      catch { const t = $('#promptText'); t.focus(); t.select(); document.execCommand('copy'); }
      btn.textContent = '복사됨 ✓'; btn.classList.add('primary');
      setTimeout(() => (btn.textContent = '📋 프롬프트 복사'), 1500);
    };
  };
  render();
}

function testSession(items, title, onDone) {
  const body = $('#modeBody') || app;
  let i = 0, revealed = false;
  const render = () => {
    if (i >= items.length) {
      body.innerHTML = `<div class="empty"><div class="big">🎉</div><b>${title} 완료!</b>
        <p class="muted" style="margin-top:8px">${items.length}문장 학습했어요</p>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
          <button class="btn" id="againBtn">다시</button>
          <button class="btn primary" id="homeBtn2">홈으로</button></div></div>`;
      $('#againBtn').onclick = () => { i = 0; revealed = false; render(); };
      $('#homeBtn2').onclick = () => go('home');
      return;
    }
    const s = items[i]; revealed = false;
    body.innerHTML = `
      <div class="progress-line"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="card" id="card">
        <span class="counter">${i + 1} / ${items.length}</span>
        <span class="box-tag">Box ${rec(s.id).box || 0}/5</span>
        <div class="en hidden" id="enText">${s.en}</div>
        <p class="tap-hint" id="hint">🔊 소리를 듣고 문장을 떠올려 보세요 · 탭하면 정답</p>
      </div>
      <div class="card-controls">
        <button class="btn" id="replay">🔊 다시 듣기</button>
        <button class="btn" id="reveal">👁 정답 보기</button>
      </div>
      <div id="gradeWrap"></div>`;
    const enEl = $('#enText'), card = $('#card');
    const showAnswer = () => {
      if (revealed) return; revealed = true;
      enEl.classList.remove('hidden'); $('#hint').textContent = '기억났나요? 아래에서 선택하세요';
      $('#gradeWrap').innerHTML = `<div class="grade-row">
        <button class="btn again" id="gA">😵 다시<small>+오늘</small></button>
        <button class="btn hard" id="gH">🤔 애매<small>+1일</small></button>
        <button class="btn good" id="gG">😎 알아요<small>+${INTERVALS[Math.min(5,(rec(s.id).box||1)+1)]}일</small></button></div>`;
      const next = (g) => { grade(s.id, g); i++; render(); };
      $('#gA').onclick = () => next('again');
      $('#gH').onclick = () => next('hard');
      $('#gG').onclick = () => next('good');
    };
    card.onclick = showAnswer;
    $('#reveal').onclick = (e) => { e.stopPropagation(); showAnswer(); };
    $('#replay').onclick = (e) => { e.stopPropagation(); say(s.en); };
    say(s.en); // auto-play prompt
  };
  render();
}

function renderReview() {
  const items = dueItems();
  if (!items.length) {
    app.innerHTML = `<div class="empty"><div class="big">✅</div><b>복습할 문장이 없어요</b>
      <p class="muted" style="margin-top:8px">오늘 학습을 이어가 보세요</p>
      <button class="btn primary" style="margin-top:20px" onclick="location.hash='home'">홈으로</button></div>`;
    return;
  }
  app.innerHTML = `<div class="study-head"><button class="icon-btn" id="rBack">‹</button>
    <h1 style="text-align:center">🔁 복습 (${items.length})</h1><span style="width:40px"></span></div>
    <div id="modeBody"></div>`;
  $('#rBack').onclick = () => go('home');
  testSession(items, '복습', () => go('home'));
}

/* ---------- Sequential player (listen mode) ---------- */
const player = {
  playing: false, idx: 0, items: null, hl: null, token: 0,
  async start(items, hl, title) {
    this.items = items; this.hl = hl; this.playing = true;
    const my = ++this.token;
    $('#pPlay') && ($('#pPlay').textContent = '⏸');
    for (; this.idx < items.length; this.idx++) {
      if (my !== this.token) return;
      const s = items[this.idx];
      this.hl(this.idx);
      $('#pNow') && ($('#pNow').textContent = `${this.idx + 1}/${items.length} · ${s.en}`);
      markSeen(s.id);
      await say(s.en);
      if (my !== this.token) return;
      await sleep(settings.gap * 1000);
      if (my !== this.token) return;
    }
    this.finish(title);
  },
  pause() {
    this.playing = false; this.token++; TTS.stop();
    $('#pPlay') && ($('#pPlay').textContent = '▶︎');
    $('#pNow') && ($('#pNow').textContent = '일시정지 · ▶︎ 로 이어재생');
  },
  finish() {
    this.playing = false; this.idx = 0;
    $('#pPlay') && ($('#pPlay').textContent = '▶︎');
    $('#pNow') && ($('#pNow').textContent = '재생 완료 🎉 · 다시 들으려면 ▶︎');
    bumpStreak();
  },
  stop() {
    this.playing = false; this.token++; this.idx = 0; TTS.stop();
    this.hl && this.hl(-1);
  },
};

/* ---------- Settings drawer ---------- */
function renderVoiceOptions() {
  const sel = $('#voiceSelect'); if (!sel) return;
  sel.innerHTML = TTS.voices.map(v =>
    `<option value="${v.voiceURI}" ${TTS.voice && v.voiceURI === TTS.voice.voiceURI ? 'selected' : ''}>${v.name} (${v.lang})</option>`
  ).join('') || '<option>기기에 영어 음성이 없습니다</option>';
}
function openDrawer(open) {
  $('#settingsDrawer').hidden = !open; $('#drawerBackdrop').hidden = !open;
}
function initSettingsUI() {
  $('#rateRange').value = settings.rate; $('#rateVal').textContent = settings.rate.toFixed(2) + '×';
  $('#gapRange').value = settings.gap; $('#gapVal').textContent = settings.gap.toFixed(1) + '초';
  $('#twiceChk').checked = settings.twice;
  $('#startDate').value = settings.startDate || todayStr();

  $('#settingsBtn').onclick = () => openDrawer(true);
  $('#drawerBackdrop').onclick = () => openDrawer(false);
  $('#homeBtn').onclick = () => go('home');

  $('#voiceSelect').onchange = (e) => { settings.voiceURI = e.target.value; TTS.choose(e.target.value); save(LS.set, settings); };
  $('#rateRange').oninput = (e) => { settings.rate = +e.target.value; $('#rateVal').textContent = settings.rate.toFixed(2) + '×'; save(LS.set, settings); };
  $('#gapRange').oninput = (e) => { settings.gap = +e.target.value; $('#gapVal').textContent = settings.gap.toFixed(1) + '초'; save(LS.set, settings); };
  $('#twiceChk').onchange = (e) => { settings.twice = e.target.checked; save(LS.set, settings); };
  $('#startDate').onchange = (e) => { settings.startDate = e.target.value; save(LS.set, settings); };
  $('#testVoiceBtn').onclick = () => say('Hello. This is your English study voice.');
  $('#resetBtn').onclick = () => {
    if (confirm('모든 학습 진도를 삭제할까요? 되돌릴 수 없습니다.')) {
      progress = {}; meta = { cursorDay: 1, lastStudy: '', streak: 0 };
      save(LS.prog, progress); save(LS.meta, meta); openDrawer(false); router();
    }
  };
}

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,select,textarea')) return;
  const card = $('#card');
  if (e.code === 'Space') { e.preventDefault();
    if ($('#pPlay')) $('#pPlay').click();
    else if (card) ($('#reveal') || {}).click?.() || card.click();
  }
  if (card && $('#gG')) { if (e.key === '1') $('#gA').click(); if (e.key === '2') $('#gH').click(); if (e.key === '3') $('#gG').click(); }
  if (e.key.toLowerCase() === 'r' && $('#replay')) $('#replay').click();
});

/* ---------- Boot ---------- */
async function boot() {
  initSettingsUI();
  TTS.init();
  try {
    const res = await fetch('data/sentences.json');
    DATA = await res.json();
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="big">⚠️</div><b>데이터를 불러오지 못했어요</b>
      <p class="muted small" style="margin-top:8px">GitHub Pages 또는 로컬 서버에서 열어주세요.<br>(file:// 로는 동작하지 않습니다)</p></div>`;
    return;
  }
  $('#subtitle').textContent = `하루 ${DATA.perDay}문장 · 전체 ${DATA.totalDays}일`;
  window.addEventListener('hashchange', router);
  router();
}
boot();
