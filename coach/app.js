/* Voice Coach — web/PWA client of the lang-study framework.
   Flow (voice first): 오늘 미션 → 시작 프롬프트 복사 → Claude/ChatGPT 앱 음성 대화
   → 종료 프롬프트 → 리포트를 공유/붙여넣기 → 오답·표현 카드 누적 → 음성 복습. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

const KEY = { store: 'lsf.store.v1', mission: 'lsf.mission.v1', draft: 'lsf.draft.v1' };
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('저장 공간이 부족해요. 설정에서 내보내기 후 정리하세요.'); } };

let store = load(KEY.store, null) || LSF.emptyStore('en');
const PACKS = {};
let pack = null;
let tab = 'today';
let parsed = null; // last parsed report on the record tab

const AI_APPS = [
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
];

/* ---------- utils ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
const persist = () => save(KEY.store, store);

/* ---------- speech ---------- */
const TTS = {
  voice: null,
  pick() {
    if (!pack) return;
    const vs = speechSynthesis.getVoices();
    for (const lang of pack.speech.preferVoices) {
      const v = vs.find((x) => x.lang.replace('_', '-').startsWith(lang));
      if (v) return (this.voice = v);
    }
    this.voice = vs.find((x) => x.lang.startsWith(pack.id)) || null;
  },
  say(text, rate = 0.95) {
    if (!('speechSynthesis' in window)) return Promise.resolve();
    speechSynthesis.cancel(); this.pick();
    return new Promise((res) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = pack.speech.tts; if (this.voice) u.voice = this.voice; u.rate = rate;
      u.onend = res; u.onerror = res; speechSynthesis.speak(u);
    });
  },
  async sayAll(list) { for (const t of list) { await this.say(t); await new Promise((r) => setTimeout(r, 900)); } },
};
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => TTS.pick();

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen() {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('이 브라우저는 음성 인식을 지원하지 않아요. (Chrome/Safari 권장)'));
    const r = new SR(); r.lang = pack.speech.recognition; r.interimResults = false; r.maxAlternatives = 3;
    let done = false;
    r.onresult = (e) => { done = true; resolve([...e.results[0]].map((a) => a.transcript)); };
    r.onerror = (e) => { if (!done) reject(new Error(e.error === 'not-allowed' ? '마이크 권한을 허용해 주세요.' : '음성을 인식하지 못했어요.')); };
    r.onend = () => { if (!done) reject(new Error('음성을 인식하지 못했어요.')); };
    r.start();
  });
}

/* ---------- packs & mission ---------- */
async function loadPack(id) {
  if (!PACKS[id]) PACKS[id] = await (await fetch(`../packs/${id}/pack.json`)).json();
  pack = PACKS[id]; store.profile.lang = id; persist(); TTS.voice = null;
}

async function grammarExtra(date) {
  // Same-origin link with the Grammar-in-Use app (../): reuse the day the learner is on.
  if (pack.id !== 'en' || store.profile.grammarLink === false) return [];
  try {
    const meta = JSON.parse(localStorage.getItem('gu.meta.v1') || 'null');
    if (!meta || !meta.cursorDay) return [];
    const data = await (await fetch('../data/sentences.json')).json();
    const items = data.sentences.filter((s) => s.day === meta.cursorDay && s.en.split(' ').length >= 4);
    if (!items.length) return [];
    const seed = Number(date.replace(/-/g, ''));
    return [items[seed % items.length].en];
  } catch { return []; }
}

async function currentMission(force = false, trackKey) {
  const date = LSF.today();
  const saved = load(KEY.mission, null);
  if (!force && saved && saved.date === date && saved.lang === pack.id) return saved;
  const m = LSF.pickMission(store, pack, date, { trackKey, extra: await grammarExtra(date) });
  m.lang = pack.id; save(KEY.mission, m); return m;
}

/* ---------- render: today ---------- */
async function renderToday() {
  const m = await currentMission();
  const lv = LSF.levelOf(store, pack);
  const exprs = [...m.expressions.map((e) => ({ text: e.text, meaning: e.meaning, kind: e.kind, box: e.box })),
    ...m.extra.map((t) => ({ text: t, meaning: 'Grammar in Use 오늘 문장', kind: 'grammar' }))];
  const done = LSF.langData(store, pack.id).sessions.some((s) => s.date === m.date);
  app.innerHTML = `
    <div class="lang-row">
      ${Object.keys(PACKS_INDEX).map((id) => `<button class="chip ${id === pack.id ? 'on' : ''}" data-lang="${id}">${esc(PACKS_INDEX[id])}</button>`).join('')}
      <span class="muted small level-tag">레벨 ${esc(LSF.levelLabel(pack, lv))}</span>
    </div>
    <section class="mission card-flat">
      <div class="mission-head">
        <span class="badge ${done ? 'done' : 'todo'}">${done ? '오늘 완료' : '오늘 미션'}</span>
        <select id="trackSel" aria-label="트랙">
          ${pack.tracks.map((t) => `<option value="${t.key}" ${t.key === m.trackKey ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
        </select>
      </div>
      ${m.review ? '<p class="small accent">🔁 복습일: 지난주와 같은 시나리오로 점수를 비교해요</p>' : ''}
      <p class="scenario">${esc(m.scenario)}</p>
      <h3 class="section-title">꼭 써야 할 표현</h3>
      ${exprs.length ? `<ul class="expr-list">${exprs.map((e) => `
        <li><button class="icon-btn sm" data-say="${esc(e.text)}" aria-label="듣기">🔊</button>
          <div><b>${esc(e.text)}</b>${e.meaning ? `<div class="muted small">${esc(e.meaning)}</div>` : ''}</div></li>`).join('')}</ul>`
        : '<p class="muted small">아직 카드가 없어요. 첫 세션에서는 AI가 표현 3개를 골라 줍니다.</p>'}
    </section>

    <ol class="steps">
      <li>
        <b>워밍업 (1분)</b>
        <p class="muted small">표현을 듣고 소리 내어 따라 말하세요.</p>
        <button class="btn block" id="warmBtn" ${exprs.length ? '' : 'disabled'}>🔊 전체 듣기</button>
      </li>
      <li>
        <b>시작 프롬프트 → 음성 대화 (10분)</b>
        <p class="muted small">복사 → AI 앱에 붙여넣고 전송 → 🎙 음성 모드로 전환해서 대화하세요.</p>
        <button class="btn primary block" id="startCopy">📋 시작 프롬프트 복사</button>
        <div class="app-links">${AI_APPS.map((a) => `<a class="btn ghost" href="${a.url}" target="_blank" rel="noopener">${a.name} ↗</a>`).join('')}</div>
        <details><summary class="small muted">프롬프트 보기</summary><textarea class="prompt-box" readonly rows="10">${esc(LSF.buildStartPrompt(pack, store, m))}</textarea></details>
      </li>
      <li>
        <b>종료 리포트 요청</b>
        <p class="muted small">음성으로 “end session”이라고 말한 뒤, 이 프롬프트를 <u>텍스트로</u> 보내세요.</p>
        <button class="btn block" id="reviewCopy">📋 종료 프롬프트 복사</button>
      </li>
      <li>
        <b>리포트 저장</b>
        <p class="muted small">AI 답변 전체를 복사(또는 공유 → Voice Coach)해서 저장하세요.</p>
        <button class="btn block" id="goRecord">📥 리포트 붙여넣기</button>
      </li>
    </ol>`;

  $$('[data-lang]').forEach((b) => (b.onclick = async () => { await loadPack(b.dataset.lang); render(); }));
  $$('[data-say]').forEach((b) => (b.onclick = () => TTS.say(b.dataset.say)));
  $('#warmBtn').onclick = () => TTS.sayAll(exprs.map((e) => e.text));
  $('#trackSel').onchange = async (e) => { await currentMission(true, e.target.value); render(); };
  $('#startCopy').onclick = async () => toast((await copy(LSF.buildStartPrompt(pack, store, m))) ? '복사했어요. AI 앱에 붙여넣으세요.' : '복사 실패 — 프롬프트 보기에서 직접 복사하세요.');
  $('#reviewCopy').onclick = async () => toast((await copy(LSF.buildReviewPrompt(pack, m))) ? '복사했어요. 대화 끝에 텍스트로 보내세요.' : '복사 실패');
  $('#goRecord').onclick = () => go('record');
}

/* ---------- render: record ---------- */
function renderRecord(prefill) {
  const draft = prefill ?? load(KEY.draft, '');
  app.innerHTML = `
    <h2 class="section-title">AI 리포트 붙여넣기</h2>
    <p class="muted small">종료 프롬프트에 대한 AI 답변 <b>전체</b>를 붙여넣으세요. <code>lsf-report</code> 블록이 없으면 교정 표만으로도 저장돼요.</p>
    <textarea id="reportText" class="prompt-box editable" rows="9" placeholder="여기에 붙여넣기">${esc(draft)}</textarea>
    <div class="row-btns">
      <button class="btn" id="pasteBtn">📋 클립보드에서</button>
      <button class="btn primary" id="parseBtn">🔍 분석</button>
    </div>
    <div id="preview"></div>`;
  const ta = $('#reportText');
  ta.oninput = () => save(KEY.draft, ta.value);
  $('#pasteBtn').onclick = async () => {
    try { ta.value = await navigator.clipboard.readText(); save(KEY.draft, ta.value); doParse(); }
    catch { toast('클립보드 접근이 막혀 있어요. 길게 눌러 붙여넣기 하세요.'); }
  };
  $('#parseBtn').onclick = doParse;
  if (draft) doParse(true);
}

function doParse(silent) {
  const text = $('#reportText').value;
  try { parsed = LSF.parseReport(text, pack); }
  catch (e) { parsed = null; $('#preview').innerHTML = silent ? '' : `<p class="error">⚠️ ${esc(e.message)}</p>`; return; }
  const r = parsed.report;
  const label = (k) => (pack.errorTypes.find((x) => x.key === k) || {}).label || k;
  $('#preview').innerHTML = `
    <div class="card-flat">
      <p class="small muted">${parsed.source === 'json' ? '✅ lsf-report 블록 인식' : '⚠️ 표만 인식 (표현·사용 여부 없음)'}</p>
      ${Object.keys(r.scores).length ? `<div class="score-row">${pack.rubric.map((k) => `<div><span class="muted small">${esc(k.label)}</span><b>${r.scores[k.key] ?? '-'}</b></div>`).join('')}</div>` : ''}
      ${r.errors.length ? `<div class="table-wrap"><table class="mini-table"><thead><tr><th>내 문장</th><th>더 나은 표현</th><th>유형</th></tr></thead><tbody>
        ${r.errors.map((e) => `<tr><td class="wrong">${esc(e.said)}</td><td>${esc(e.better)}${e.note ? `<div class="muted small">${esc(e.note)}</div>` : ''}</td><td class="small">${esc(label(e.type))}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="small">교정할 문장이 없었어요 👏</p>'}
      ${r.expressions.length ? `<p class="small"><b>새 표현</b> · ${r.expressions.map((x) => esc(x.text)).join(' · ')}</p>` : ''}
      <button class="btn primary block" id="saveBtn">💾 저장하고 카드 만들기</button>
    </div>`;
  $('#saveBtn').onclick = async () => {
    const m = await currentMission();
    const res = LSF.applyReport(store, parsed.report, m.lang === pack.id ? m : null);
    persist(); save(KEY.draft, ''); parsed = null;
    const used = res.graded.filter((g) => g.ok).length;
    toast(`저장 완료 · 새 카드 ${res.added}개${res.graded.length ? ` · 미션 ${used}/${res.graded.length} 사용` : ''}`);
    go('stats');
  };
}

/* ---------- render: drill ---------- */
let drillQueue = []; let drillIdx = 0; let drillRevealed = false;
function buildDrill() {
  const date = LSF.today();
  const cards = Object.entries(LSF.langData(store, pack.id).expressions).map(([id, c]) => ({ id, ...c }));
  drillQueue = cards.filter((c) => c.due <= date).sort((a, b) => a.box - b.box).slice(0, 15);
  drillIdx = 0; drillRevealed = false;
}
function renderDrill() {
  if (!drillQueue.length || drillIdx >= drillQueue.length) buildDrill();
  const c = drillQueue[drillIdx];
  if (!c) {
    app.innerHTML = `<div class="empty"><p>🎉 오늘 복습할 카드가 없어요.</p><p class="muted small">세션 리포트를 저장하면 오답·표현 카드가 생겨요.</p></div>`;
    return;
  }
  const cue = c.kind === 'fix'
    ? `<div class="cue-label">틀렸던 문장 → 바르게 말해 보세요</div><div class="cue wrong">✗ ${esc(c.wrong)}</div>${c.meaning ? `<div class="muted small">${esc(c.meaning)}</div>` : ''}`
    : `<div class="cue-label">이 뜻을 ${esc(pack.nativeName)}로 말해 보세요</div><div class="cue">${esc(c.meaning || '(뜻 없음)')}</div>`;
  app.innerHTML = `
    <div class="drill-head muted small">${drillIdx + 1} / ${drillQueue.length} · box ${c.box}</div>
    <section class="card drill-card">
      ${cue}
      <div class="answer ${drillRevealed ? '' : 'hidden'}" id="answer">${esc(c.text)}</div>
      <div id="heard" class="small"></div>
    </section>
    <button class="btn primary lg block" id="micBtn">🎙 말하기</button>
    <div class="row-btns">
      <button class="btn" id="revealBtn">👀 정답</button>
      <button class="btn" id="playBtn">🔊 듣기</button>
    </div>
    <div class="grade-row">
      <button class="btn danger ghost" data-g="0">다시</button>
      <button class="btn primary" data-g="1">알아요</button>
    </div>`;
  const reveal = () => { drillRevealed = true; $('#answer').classList.remove('hidden'); };
  $('#revealBtn').onclick = reveal;
  $('#playBtn').onclick = () => { reveal(); TTS.say(c.text); };
  $('#micBtn').onclick = async () => {
    const b = $('#micBtn'); b.disabled = true; b.textContent = '🎙 듣는 중…';
    try {
      const alts = await listen();
      const best = Math.max(...alts.map((a) => LSF.similarity(a, c.text)));
      const pct = Math.round(best * 100);
      $('#heard').innerHTML = `인식: “${esc(alts[0])}” · 일치 <b class="${pct >= 80 ? 'ok' : 'ng'}">${pct}%</b>`;
      reveal(); TTS.say(c.text);
    } catch (e) { $('#heard').innerHTML = `<span class="error">${esc(e.message)}</span>`; }
    b.disabled = false; b.textContent = '🎙 다시 말하기';
  };
  $$('[data-g]').forEach((b) => (b.onclick = () => {
    LSF.gradeCard(store, pack.id, c.id, b.dataset.g === '1'); persist();
    drillIdx++; drillRevealed = false; renderDrill();
  }));
}

/* ---------- render: stats ---------- */
function sparkline(series, key) {
  const pts = series.map((s) => s.scores[key]).map((v, i) => [i, v]).filter(([, v]) => v);
  if (pts.length < 2) return '<span class="muted small">데이터 2개 이상부터 표시</span>';
  const W = 220, H = 48, n = series.length - 1 || 1;
  const xy = pts.map(([i, v]) => `${(i / n) * W},${H - ((v - 1) / 5) * H}`).join(' ');
  return `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" class="spark" aria-label="${key} 추이"><polyline points="${xy}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
function renderStats() {
  const st = LSF.stats(store, pack.id);
  const ld = LSF.langData(store, pack.id);
  const label = (k) => (pack.errorTypes.find((x) => x.key === k) || {}).label || k;
  const last = ld.sessions[0];
  app.innerHTML = `
    <div class="stat-row">
      <div class="stat"><b>${st.streak}</b><span>연속일</span></div>
      <div class="stat"><b>${st.sessions}</b><span>세션</span></div>
      <div class="stat"><b>${st.due}</b><span>복습 대기</span></div>
      <div class="stat"><b>${st.mastered}/${st.cards}</b><span>암기 카드</span></div>
    </div>
    <h3 class="section-title">점수 추이 (최근 20회, 1~6)</h3>
    <div class="card-flat">${pack.rubric.map((r) => `<div class="spark-row"><span>${esc(r.label)}${last && last.scores[r.key] ? ` <b>${last.scores[r.key]}</b>` : ''}</span>${sparkline(st.scoreSeries, r.key)}</div>`).join('')}</div>
    <h3 class="section-title">자주 틀리는 유형</h3>
    <div class="card-flat">${st.topErrors.length ? st.topErrors.map(([k, v]) => `<div class="bar-row"><span>${esc(label(k))}</span><div class="bar"><i style="width:${(v / st.topErrors[0][1]) * 100}%"></i></div><b>${v}</b></div>`).join('') : '<span class="muted small">아직 없어요</span>'}</div>
    <h3 class="section-title">세션 기록</h3>
    ${ld.sessions.length ? ld.sessions.slice(0, 30).map((s) => `
      <details class="session"><summary><b>${esc(s.date)}</b> · ${esc(s.scenario || s.track)} <span class="muted small">${Object.values(s.scores).join('/')}</span></summary>
        ${s.summary ? `<p class="small">${esc(s.summary)}</p>` : ''}
        ${s.errors.map((e) => `<p class="small"><span class="wrong">✗ ${esc(e.said)}</span><br>→ ${esc(e.better)}</p>`).join('')}
      </details>`).join('') : '<p class="muted small">기록이 없어요.</p>'}`;
}

/* ---------- settings drawer ---------- */
function openSettings() {
  const d = $('#settingsDrawer');
  const lv = LSF.levelOf(store, pack);
  d.innerHTML = `
    <h2>설정 · ${esc(pack.nativeName)}</h2>
    <label class="field"><span>내 레벨 (${esc(pack.levels.scale)})</span>
      <select id="levelSel">${pack.levels.items.map((i) => `<option value="${i.value}" ${i.value === lv ? 'selected' : ''}>${esc(i.label)}</option>`).join('')}</select></label>
    ${pack.id === 'en' ? `<label class="field checkbox"><input type="checkbox" id="gramChk" ${store.profile.grammarLink !== false ? 'checked' : ''}/><span>Grammar in Use 오늘 문장 1개를 미션에 추가</span></label>` : ''}
    <hr />
    <p class="muted small">학습 데이터는 이 브라우저에만 저장돼요. 기기 이동·백업은 내보내기를 사용하세요. (공개 저장소에 올리지 마세요)</p>
    <button class="btn block" id="expBtn">⬇️ 데이터 내보내기 (JSON)</button>
    <label class="btn block file-btn">⬆️ 가져오기 (병합)<input type="file" id="impFile" accept="application/json,.json" hidden /></label>
    <button class="btn block" id="ankiBtn">🃏 Anki 카드 내보내기 (TSV)</button>
    <hr />
    <button class="btn danger ghost block" id="resetBtn">${esc(pack.nativeName)} 데이터 초기화</button>
    <p class="muted small">framework: <a href="https://github.com/musangk/english_study" target="_blank" rel="noopener">github.com/musangk/english_study</a></p>`;
  d.hidden = false; $('#drawerBackdrop').hidden = false;
  $('#levelSel').onchange = (e) => { store.profile.levels = { ...(store.profile.levels || {}), [pack.id]: Number(e.target.value) }; persist(); save(KEY.mission, null); };
  const g = $('#gramChk'); if (g) g.onchange = () => { store.profile.grammarLink = g.checked; persist(); save(KEY.mission, null); };
  $('#expBtn').onclick = () => download(`lsf-store-${LSF.today()}.json`, JSON.stringify(store, null, 2), 'application/json');
  $('#ankiBtn').onclick = () => download(`lsf-anki-${pack.id}-${LSF.today()}.txt`, LSF.toAnkiTSV(store, pack.id), 'text/tab-separated-values');
  $('#impFile').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const inc = JSON.parse(await f.text()); if (inc.version !== 1 || !inc.langs) throw new Error(); LSF.mergeStore(store, inc); persist(); toast('가져오기 완료'); closeSettings(); render(); }
    catch { toast('lsf-store JSON 파일이 아니에요.'); }
  };
  $('#resetBtn').onclick = () => {
    if (!confirm(`${pack.nativeName} 학습 데이터를 모두 지울까요? 되돌릴 수 없어요.`)) return;
    delete store.langs[pack.id]; persist(); save(KEY.mission, null); closeSettings(); render();
  };
}
function closeSettings() { $('#settingsDrawer').hidden = true; $('#drawerBackdrop').hidden = true; if (tab === 'today') render(); }
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- routing ---------- */
function go(t) { tab = t; history.replaceState(null, '', '#' + t); render(); }
function render() {
  $$('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  window.scrollTo(0, 0);
  if (tab === 'record') return renderRecord();
  if (tab === 'drill') return renderDrill();
  if (tab === 'stats') return renderStats();
  return renderToday();
}

let PACKS_INDEX = {};
(async function boot() {
  const idx = await (await fetch('../packs/index.json')).json();
  PACKS_INDEX = Object.fromEntries(idx.packs.map((p) => [p.id, p.name]));
  await loadPack(PACKS_INDEX[store.profile.lang] ? store.profile.lang : 'en');
  $$('#tabbar button').forEach((b) => (b.onclick = () => go(b.dataset.tab)));
  $('#settingsBtn').onclick = openSettings;
  $('#drawerBackdrop').onclick = closeSettings;

  // Web Share Target (Android): share the AI answer → Voice Coach opens on 기록 with the text
  const q = new URLSearchParams(location.search);
  const shared = [q.get('title'), q.get('text'), q.get('url')].filter(Boolean).join('\n');
  if (shared) { history.replaceState(null, '', './#record'); tab = 'record'; save(KEY.draft, shared); }
  else if (['today', 'record', 'drill', 'stats'].includes(location.hash.slice(1))) tab = location.hash.slice(1);
  render();
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (h !== tab && ['today', 'record', 'drill', 'stats'].includes(h)) { tab = h; render(); }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
