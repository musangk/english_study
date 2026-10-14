(() => {
  const $ = (s) => document.querySelector(s);
  const app = $("#app"), tabsEl = $("#tabs");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- storage (fails silently in private mode) ----------
  const KEY = "aus-trip-v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  const sit = (id) => (store[id] ||= { grades: {}, todo: {} });
  store.checks ||= {};

  // ---------- speech ----------
  // 우선순위: 사용자가 고른 음성 > 호주(en-AU) > 뉴질랜드 > 영국 > 미국. 인도 등 기타 억양은 최후순위.
  const SPEEDS = [["느리게", 0.7], ["보통", 0.95], ["실제속도", 1.15]];
  let speedIdx = store.speedIdx ?? 1;
  const hasTTS = "speechSynthesis" in window;
  const normLang = (l) => (l || "").replace("_", "-");
  const LANG_RANK = ["en-AU", "en-NZ", "en-GB", "en-IE", "en-US"];
  const voiceRank = (v) => {
    const r = LANG_RANK.indexOf(normLang(v.lang));
    const quality = /premium|enhanced|natural|neural|google/i.test(v.name) ? 0 : 0.5;
    return (r < 0 ? 10 : r) + quality;
  };
  let voices = [], voice = null, koVoice = null;
  const englishVoices = () => voices.filter((v) => /^en/i.test(normLang(v.lang))).sort((a, b) => voiceRank(a) - voiceRank(b));
  const hasAU = () => voices.some((v) => normLang(v.lang) === "en-AU");
  function loadVoices() {
    if (!hasTTS) return;
    voices = speechSynthesis.getVoices();
    const en = englishVoices();
    voice = en.find((v) => v.voiceURI === store.voiceURI) || en[0] || null;
    koVoice = voices.find((v) => normLang(v.lang) === "ko-KR") || null;
  }
  if (hasTTS) { loadVoices(); speechSynthesis.onvoiceschanged = () => { loadVoices(); if (location.hash.startsWith("#/settings")) route(); }; }

  const updateSpeedBtn = () => { $("#speedBtn").textContent = "🔊 " + SPEEDS[speedIdx][0]; };
  $("#speedBtn").onclick = () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length; store.speedIdx = speedIdx; save(); updateSpeedBtn();
    toast(`재생 속도: ${SPEEDS[speedIdx][0]}`);
  };
  $("#settingsBtn").onclick = () => (location.hash = "/settings");
  updateSpeedBtn();

  // 한 문장 재생. 끝나면 resolve.
  function say(text, { lang = "en", btn, rate } = {}) {
    return new Promise((resolve) => {
      if (!hasTTS) { toast("이 브라우저는 음성 재생을 지원하지 않아요"); return resolve(); }
      if (!voices.length) loadVoices();
      const u = new SpeechSynthesisUtterance(text);
      if (lang === "ko") { if (koVoice) u.voice = koVoice; u.lang = "ko-KR"; u.rate = 1; }
      else {
        if (voice) u.voice = voice;
        // Android Chrome은 voice를 무시하고 lang만 보는 경우가 있어 lang도 반드시 지정
        u.lang = voice ? normLang(voice.lang) : "en-AU";
        u.rate = rate ?? SPEEDS[speedIdx][1];
      }
      const done = () => { btn && btn.classList.remove("playing"); resolve(); };
      u.onend = done; u.onerror = done;
      btn && btn.classList.add("playing");
      speechSynthesis.speak(u);
    });
  }
  function speak(text, btn) {
    if (hasTTS) speechSynthesis.cancel();
    stopAuto();
    document.querySelectorAll(".playing").forEach((b) => b.classList.remove("playing"));
    say(text, { btn });
  }
  const playBtn = (text, cls = "") => `<button class="play ${cls}" data-say="${esc(text)}" aria-label="듣기">▶</button>`;

  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 1800);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) { e.preventDefault(); speak(b.dataset.say, b); }
  });

  // ---------- helpers ----------
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const daysUntil = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 864e5);
  const currentTopic = () => { const t = todayStr(); let cur = null; for (const s of TRIP.schedule) if (s.start <= t) cur = s; return cur; };
  const allItems = () => Object.entries(SITUATIONS).flatMap(([sid, S]) => S.questions.map((q, i) => ({ sid, i, q })));
  const knownCount = (sid) => Object.values(sit(sid).grades).filter((g) => g === "ok").length;
  const isPage = (id) => ["common", "review", "final", "settings"].includes(id);

  function setHeader(title, sub, back) {
    $("#title").textContent = title; $("#subtitle").textContent = sub; $("#backBtn").hidden = !back;
  }
  function setTabs(base, list, cur) {
    if (!list) { tabsEl.hidden = true; return; }
    tabsEl.hidden = false;
    tabsEl.innerHTML = list.map(([k, l]) => `<a class="tab ${k === cur ? "on" : ""}" href="#/${base}/${k}">${l}</a>`).join("");
    tabsEl.querySelector(".on")?.scrollIntoView({ inline: "center", block: "nearest" });
  }

  // ---------- routing ----------
  function route() {
    if (hasTTS) speechSynthesis.cancel();
    stopAuto();
    const [id, tab] = location.hash.replace(/^#\/?/, "").split("/");
    if (id && SITUATIONS[id]) renderSituation(id, tab || "listen");
    else if (id === "common") renderCommon(tab || "clarify");
    else if (id === "review") renderReview(tab || "mix");
    else if (id === "final") renderFinal(tab || "test");
    else if (id === "settings") renderSettings();
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  $("#backBtn").onclick = () => (location.hash = "");

  // ---------- home ----------
  function renderHome() {
    setHeader("🦘 호주여행준비", "시드니 → 멜버른 · 여행 영어", false); setTabs();
    const d = daysUntil(TRIP.departure), cur = currentTopic();
    const ddayTxt = d > 0 ? `D-${d}` : d === 0 ? "D-DAY ✈️" : "여행 중 🇦🇺";
    const total = allItems().length, known = Object.keys(SITUATIONS).reduce((a, s) => a + knownCount(s), 0);
    const noAU = hasTTS && voices.length && !hasAU();
    app.innerHTML = `
      <section class="hero">
        <div class="dday">${ddayTxt}</div>
        <p>2026.10.31 ~ 11.11 · 시드니 → 멜버른 · 성인 2명<br>전체 듣기 이해 ${known}/${total}</p>
      </section>
      ${noAU ? `<a class="card alert" href="#/settings">⚠️ 이 기기에 <b>호주 영어 음성</b>이 없어 다른 억양으로 재생됩니다. <u>설치 방법 보기 ›</u></a>` : ""}
      <h2>📅 학습 일정</h2>
      ${TRIP.schedule.map((s) => {
        const isNow = cur && cur.id === s.id, isSit = !!SITUATIONS[s.id];
        const k = isSit ? knownCount(s.id) : 0, n = isSit ? SITUATIONS[s.id].questions.length : 0;
        const sub = isSit ? `듣기 이해 ${k}/${n}` : s.id === "review" ? "전체 섞어 듣기 · 종합 롤플레이 · 악센트" : "모의고사 · 출발 전 체크리스트";
        return `<a class="card sched ${isNow ? "today" : ""}" href="#/${s.id}">
          <span class="ico">${s.icon}</span>
          <span class="body">
            <span class="date">${s.dates}</span> ${isNow ? '<span class="badge now">오늘</span>' : ""}
            <div><strong>${s.name}</strong></div>
            <div class="small muted">${sub}</div>
            ${isSit ? `<div class="progress"><i style="width:${(k / n) * 100}%"></i></div>` : ""}
          </span><span>›</span></a>`;
      }).join("")}
      <h2>📚 공통 자료</h2>
      <a class="card sched" href="#/common"><span class="ico">🗂</span><span class="body"><strong>되묻기 · 호주 표현 · 체크리스트</strong><div class="small muted">F 되묻기 10 · G 호주 표현 20 · H 자가 점검</div></span><span>›</span></a>
      <div class="tip">각 주제는 2일 구성: 1일차 듣기·표현 → 2일차 AI 음성 롤플레이. 출퇴근 때는 듣기 탭의 <b>🎧 연속 재생</b>으로 흘려듣기.</div>
      <p class="footer">음성: ${voice ? esc(voice.name) + " (" + esc(normLang(voice.lang)) + ")" : "기기 기본 음성"} · <a href="#/settings">음성 설정</a> · <a href="../">Grammar in Use</a></p>`;
  }

  // ---------- deck: 듣기 카드 / 목록 / 연속 재생 (상황별·전체 공용) ----------
  const deckState = {};
  function renderDeck(el, key, items, opts = {}) {
    const st = (deckState[key] ||= { mode: "card", missed: false, idx: 0, reveal: 0, order: null });
    const grade = (it) => sit(it.sid).grades[it.i];
    let list = st.order ? st.order.map((n) => items[n]).filter(Boolean) : items;
    if (st.missed) list = list.filter((it) => grade(it) !== "ok");
    const ok = items.filter((it) => grade(it) === "ok").length, passN = Math.ceil(items.length * 0.8);
    if (st.idx >= list.length) st.idx = 0;
    const rerender = () => renderDeck(el, key, items, opts);

    let html = `
      <div class="seg">
        <button data-mode="card" class="${st.mode === "card" ? "on" : ""}">🃏 카드</button>
        <button data-mode="auto" class="${st.mode === "auto" ? "on" : ""}">🎧 연속 재생</button>
        <button data-mode="list" class="${st.mode === "list" ? "on" : ""}">📋 목록</button>
      </div>
      <p class="score">자막 없이 이해: <b>${ok}</b>/${items.length} · 기준 ${passN} → ${ok >= passN ? '<span class="pass">통과 ✅</span>' : '<span class="fail">연습 중</span>'}</p>
      <div class="filter">
        <label><input type="checkbox" id="missedOnly" ${st.missed ? "checked" : ""}> 못 알아들은 것만 (${items.filter((it) => grade(it) !== "ok").length})</label>
        <button id="shuffleAll" class="linkbtn">🔀 섞기</button>
      </div>`;

    if (!list.length) {
      html += `<div class="card flash"><div style="font-size:40px">🎉</div><b>모두 알아들었어요!</b><button class="reveal" id="resetMissed">전체 보기</button></div>`;
    } else if (st.mode === "card") {
      const it = list[st.idx], q = it.q;
      html += `<div class="dots">${list.map((x, i) => `<i class="${grade(x) === "ok" ? "ok" : grade(x) === "ng" ? "ng" : ""} ${i === st.idx ? "cur" : ""}"></i>`).join("")}</div>
      <div class="card flash">
        <div class="num">${opts.showSit ? `${SITUATIONS[it.sid].icon} ${esc(SITUATIONS[it.sid].title)} · ` : ""}${st.idx + 1} / ${list.length} · 소리만 듣고 뜻을 떠올려 보세요</div>
        <button class="big-play" data-say="${esc(q.au)}" aria-label="호주식 발화 듣기">▶</button>
        ${st.reveal >= 1 ? `<div class="au">${esc(q.au)}</div><div class="pron">🗣 ${esc(q.pron)}</div><div><b>${esc(q.ko)}</b></div><div class="std">표준: ${esc(q.std)} ${playBtn(q.std, "sm")}</div>` : ""}
        ${st.reveal >= 2 ? `<div class="ansbox"><div class="lbl">내 즉답</div><div class="line">${playBtn(q.ans, "sm")}<span class="en">${esc(q.ans)}</span></div></div>` : ""}
        ${st.reveal < 2 ? `<button class="reveal" id="reveal">${st.reveal === 0 ? "👀 문장·뜻 보기" : "💬 즉답 보기"}</button>` : ""}
        <div class="grade"><button class="no" data-g="ng">😵 못 알아들음</button><button class="yes" data-g="ok">👂 알아들음</button></div>
      </div>
      <div class="navrow"><button id="prev">‹ 이전</button><button id="next">다음 ›</button></div>`;
    } else if (st.mode === "auto") {
      html += `<div class="card">
        <h3>🎧 핸즈프리 연속 재생</h3>
        <p class="small muted">호주식 질문 → (2초) → 한국어 뜻 → 내 즉답 순서로 ${list.length}문장을 이어서 재생합니다. 질문이 나오면 뜻을 먼저 떠올려 보세요.</p>
        <label class="field"><input type="checkbox" id="autoRepeat" ${store.autoRepeat ? "checked" : ""}> 질문 2번씩 듣기</label>
        <label class="field"><input type="checkbox" id="autoKo" ${store.autoKo !== false ? "checked" : ""}> 한국어 뜻 읽어주기 ${koVoice ? "" : '<span class="small muted">(한국어 음성 없음)</span>'}</label>
        <label class="field"><input type="checkbox" id="autoLoop" ${store.autoLoop ? "checked" : ""}> 끝나면 처음부터 반복</label>
        <div class="btns"><button class="btn primary" id="autoStart">${auto.running ? "⏹ 정지" : "▶ 시작"}</button></div>
        <div id="autoNow" class="autonow">${auto.running ? "" : "대기 중"}</div>
        <div class="tip">아이폰은 화면이 꺼지면 재생이 멈출 수 있어요. 재생 중에는 화면을 켜 두세요.</div>
      </div>`;
    } else {
      html += list.map((it, n) => { const q = it.q; return `<div class="card q">
        <div class="head"><span class="no">${opts.showSit ? SITUATIONS[it.sid].icon + " " : ""}#${it.i + 1}</span><span class="stagechip">${esc(SITUATIONS[it.sid].flow.find((f) => f.qs.includes(it.i + 1))?.title || "")}</span>
          <span class="gmark ${grade(it) || ""}">${grade(it) === "ok" ? "👂" : grade(it) === "ng" ? "😵" : ""}</span></div>
        <div class="line">${playBtn(q.au)}<span class="en">${esc(q.au)}</span></div>
        <dl class="kv"><dt>발음</dt><dd class="pr">${esc(q.pron)}</dd><dt>뜻</dt><dd>${esc(q.ko)}</dd><dt>표준</dt><dd class="muted">${esc(q.std)}</dd></dl>
        <div class="line" style="margin-top:8px">${playBtn(q.ans, "sm")}<span class="small"><span class="lbl">즉답</span> ${esc(q.ans)}</span></div>
      </div>`; }).join("");
    }
    if (opts.tip) html += `<div class="tip">${esc(opts.tip)}</div>`;
    el.innerHTML = html;

    el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { stopAuto(); st.mode = b.dataset.mode; rerender(); }));
    el.querySelector("#missedOnly").onchange = (e) => { st.missed = e.target.checked; st.idx = 0; st.reveal = 0; rerender(); };
    el.querySelector("#shuffleAll").onclick = () => { st.order = shuffle(items.map((_, n) => n)); st.idx = 0; st.reveal = 0; rerender(); toast("순서를 섞었어요"); };
    el.querySelector("#resetMissed") && (el.querySelector("#resetMissed").onclick = () => { st.missed = false; rerender(); });
    if (!list.length) return;
    if (st.mode === "card") {
      const go = (i) => { st.idx = (i + list.length) % list.length; st.reveal = 0; rerender(); };
      el.querySelector("#reveal") && (el.querySelector("#reveal").onclick = () => { st.reveal++; rerender(); });
      el.querySelector("#prev").onclick = () => go(st.idx - 1);
      el.querySelector("#next").onclick = () => go(st.idx + 1);
      el.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
        const it = list[st.idx]; sit(it.sid).grades[it.i] = b.dataset.g; save();
        // '못 알아들은 것만' 모드에서 알아들음 처리하면 목록에서 빠지므로 인덱스 유지
        if (st.missed && b.dataset.g === "ok") { st.reveal = 0; rerender(); } else go(st.idx + 1);
      }));
    } else if (st.mode === "auto") {
      el.querySelector("#autoRepeat").onchange = (e) => { store.autoRepeat = e.target.checked; save(); };
      el.querySelector("#autoKo").onchange = (e) => { store.autoKo = e.target.checked; save(); };
      el.querySelector("#autoLoop").onchange = (e) => { store.autoLoop = e.target.checked; save(); };
      el.querySelector("#autoStart").onclick = () => {
        if (auto.running) { stopAuto(); rerender(); return; }
        runAuto(list, el, opts);
        el.querySelector("#autoStart").textContent = "⏹ 정지";
      };
    }
  }

  const auto = { running: false, token: 0 };
  function stopAuto() { auto.running = false; auto.token++; if (hasTTS) speechSynthesis.cancel(); }
  async function runAuto(list, el, opts) {
    if (!hasTTS) return toast("이 브라우저는 음성 재생을 지원하지 않아요");
    speechSynthesis.cancel();
    const my = ++auto.token; auto.running = true;
    const alive = () => auto.token === my;
    do {
      for (let n = 0; n < list.length && alive(); n++) {
        const { q, sid } = list[n];
        const box = el.querySelector("#autoNow");
        if (box) box.innerHTML = `<div class="small muted">${opts.showSit ? SITUATIONS[sid].icon + " " : ""}${n + 1} / ${list.length}</div><div class="au">${esc(q.au)}</div><div class="pron">🗣 ${esc(q.pron)}</div><div><b>${esc(q.ko)}</b></div><div class="en small" style="margin-top:6px">💬 ${esc(q.ans)}</div>`;
        await say(q.au); if (!alive()) return;
        if (store.autoRepeat) { await sleep(900); if (!alive()) return; await say(q.au); if (!alive()) return; }
        await sleep(2000); if (!alive()) return;
        if (store.autoKo !== false && koVoice) { await say(q.ko, { lang: "ko" }); if (!alive()) return; await sleep(600); }
        await say(q.ans); if (!alive()) return;
        await sleep(2200);
      }
    } while (alive() && store.autoLoop);
    if (alive()) { auto.running = false; const b = el.querySelector("#autoStart"); if (b) b.textContent = "▶ 시작"; const box = el.querySelector("#autoNow"); if (box) box.textContent = "✅ 재생 완료"; }
  }

  // ---------- situation ----------
  const TABS = [["listen", "🎧 듣기"], ["phrases", "💬 표현"], ["visual", "🗺 그림"], ["info", "📌 정보"], ["role", "🎙 롤플레이"]];
  function renderSituation(id, tab) {
    const S = SITUATIONS[id];
    setHeader(`${S.icon} ${S.title}`, TRIP.schedule.find((s) => s.id === id)?.dates || "", true);
    setTabs(id, TABS, tab);
    if (tab === "phrases") renderPhrases(S);
    else if (tab === "visual") renderVisual(S);
    else if (tab === "info") renderInfo(S.info, S.listening, "📌 호주 현지 정보");
    else if (tab === "role") renderRole(id, S.days, S.roleplay);
    else renderDeck(app, id, S.questions.map((q, i) => ({ sid: id, i, q })), { tip: S.linkingTip });
  }

  function renderPhrases(S) {
    app.innerHTML = `
      <h2>B. 즉답·응용 문장</h2>
      ${S.phrases.map((p) => `<div class="card">
        <span class="badge">${esc(p.when)}</span>
        <div class="line" style="margin-top:8px">${playBtn(p.en)}<span class="en">${esc(p.en)}</span></div>
        <p class="small muted" style="margin:4px 0 0 44px">${esc(p.ko)}</p>
        <div class="line">${playBtn(p.alt, "sm")}<span class="small"><span class="lbl">응용</span> ${esc(p.alt)}</span></div>
      </div>`).join("")}
      <h2>C. 예상 밖 상황</h2>
      ${S.surprises.map((s) => `<div class="card">
        <h3>⚠️ ${esc(s.sit)}</h3>
        <div class="line">${playBtn(s.them, "sm")}<span class="small"><span class="lbl">상대</span> ${esc(s.them)}</span></div>
        <div class="line">${playBtn(s.me)}<span class="en">${esc(s.me)}</span></div>
      </div>`).join("")}`;
  }

  const treeHtml = (n) => n.q
    ? `<div class="node">${esc(n.q)}</div><div class="kids">${n.branches.map((b) => `<div><div class="edge">└ ${esc(b.a)}</div>${b.result ? `<div class="res ${b.tone}">${esc(b.result)}</div>` : treeHtml(b)}</div>`).join("")}</div>`
    : "";
  function renderVisual(S) {
    const F = S.answerFormula;
    let h = "";
    if (S.flow) h += `<h2>🗺 ${esc(S.flowTitle || "흐름도")}</h2>
      <p class="small muted" style="margin-bottom:10px">질문 번호를 누르면 호주식 발화를 들을 수 있어요.</p>
      <div class="flow">${S.flow.map((f) => `<div class="step"><div class="n">${f.n}</div><div class="box">
        <div class="t">${esc(f.title)}<small>${esc(f.en)}</small></div>${f.desc ? `<p>${esc(f.desc)}</p>` : ""}
        ${f.qs.length ? `<div class="qchips">${f.qs.map((n) => `<button class="qchip" data-say="${esc(S.questions[n - 1].au)}">#${n} ${esc(S.questions[n - 1].ko)}</button>`).join("")}</div>` : ""}
        ${f.warn ? `<div class="warn">⚠ ${esc(f.warn)}</div>` : ""}
      </div></div>`).join("")}</div>`;
    if (S.tree) h += `<h2>🌳 ${esc(S.treeTitle || "판단 트리")}</h2><div class="tree">${treeHtml(S.tree)}</div>${S.tree.tip ? `<div class="tip">${esc(S.tree.tip)}</div>` : ""}`;
    if (S.linking) h += `<h2>🔗 연음 분해: 왜 안 들리나</h2>
      <div class="legend"><span><span class="chunk drop">생략</span> 거의 안 들림</span><span><span class="chunk chg">변화</span> 실제 소리</span></div>
      ${S.linking.map((l) => `<div class="card">
        <div class="line">${playBtn(l.said)}<span class="en">${esc(l.said)}</span></div>
        <div class="chunks">${l.parts.map(([w, c]) => `<span class="chunk ${c}">${esc(w)}</span>`).join("")}</div>
        <div class="small muted">${esc(l.change)}</div>
        <div class="heard">👂 ${esc(l.heard)}</div>
      </div>`).join("")}
      ${S.linkingTip ? `<div class="tip">${esc(S.linkingTip)}</div>` : ""}`;
    if (S.vowels) h += `<h2>🔤 호주 모음 발음</h2>
      <div class="card" style="padding:6px 10px"><table class="vt"><thead><tr><th>철자</th><th>미국식</th><th>호주식</th><th></th></tr></thead><tbody>
        ${S.vowels.map((v) => `<tr><td><b>${esc(v.word)}</b><div class="small muted">${esc(v.ex)}</div></td><td class="us">${esc(v.us)}</td><td class="au">${esc(v.au)}</td><td>${playBtn(v.ex, "sm")}</td></tr>`).join("")}
      </tbody></table></div>`;
    if (F) h += `<h2>🧩 ${esc(F.title || "즉답 공식")}</h2>
      <div class="card">
        <div class="formula">${F.parts.map(([b, s], i) => `${i ? '<span class="plus">+</span>' : ""}<div class="blk"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>
        <div class="line" style="margin-top:12px">${playBtn(F.example.q, "sm")}<span class="small"><span class="lbl">Q</span> ${esc(F.example.q)}</span></div>
        <div class="line">${playBtn(F.example.a)}<span class="en">${esc(F.example.a)}</span></div>
        <div class="tip">${esc(F.tip)}</div>
      </div>`;
    app.innerHTML = h;
  }

  function infoHtml(info, listening, title) {
    return `
      ${info ? `<h2>${title}</h2>
      ${info.map((i) => `<div class="card info">
        <div class="k">${esc(i.k)} ${/확인 필요/.test(i.note) ? '<span class="badge check">확인 필요</span>' : ""}</div>
        <p>${esc(i.v)}</p>${i.note ? `<div class="note">※ ${esc(i.note)}</div>` : ""}
      </div>`).join("")}` : ""}
      <h2>🎬 듣기 자료 (유튜브)</h2>
      ${listening.map((l) => `<div class="card"><a class="yt" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(l.q)}">
        <span class="ytico">▶</span><span><span class="lbl">${esc(l.use)}</span><br><code>${esc(l.q)}</code></span></a></div>`).join("")}`;
  }
  const renderInfo = (info, listening, title) => (app.innerHTML = infoHtml(info, listening, title));

  function promptBlock(text) {
    return `
      <ol class="steps-ol small">
        <li>아래 <b>프롬프트 복사</b></li>
        <li>ChatGPT·Claude 앱에 붙여넣고 <b>음성 모드</b>로 전환</li>
        <li>끝나면 피드백 표에서 못 들은 표현을 <b>듣기 카드</b>로 다시 연습</li>
      </ol>
      <div class="btns"><button class="btn primary" id="copy">📋 프롬프트 복사</button></div>
      <div class="btns">
        <a class="btn" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(text)}">Claude에서 열기</a>
        <a class="btn" target="_blank" rel="noopener" href="https://chatgpt.com/?q=${encodeURIComponent(text)}">ChatGPT에서 열기</a>
      </div>
      <h2 style="font-size:15px">프롬프트 내용</h2>
      <div class="prompt">${esc(text)}</div>`;
  }
  function bindCopy(text) {
    $("#copy").onclick = async () => {
      try { await navigator.clipboard.writeText(text); toast("복사 완료! AI 앱에 붙여넣으세요"); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(app.querySelector(".prompt"));
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("길게 눌러 복사하세요");
      }
    };
  }
  function renderRole(id, days, text) {
    const st = sit(id);
    app.innerHTML = `
      <h2>✅ 오늘 할 일</h2>
      ${days.map((d, di) => `<div class="card todo"><h3>${esc(d.date)} · ${esc(d.label)}</h3>
        ${d.todo.map((t, ti) => { const k = `${di}-${ti}`; return `<label><input type="checkbox" data-k="${k}" ${st.todo[k] ? "checked" : ""}> ${esc(t)}</label>`; }).join("")}
      </div>`).join("")}
      <h2>🎙 롤플레이 프롬프트</h2>${promptBlock(text)}`;
    app.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => { st.todo[c.dataset.k] = c.checked; save(); }));
    bindCopy(text);
  }

  // ---------- 공통 F·G·H ----------
  function renderCommon(tab) {
    setHeader("🗂 공통 자료", "되묻기 · 호주 표현 · 체크리스트", true);
    setTabs("common", [["clarify", "F 되묻기"], ["aussie", "G 호주 표현"], ["check", "H 체크리스트"]], tab);
    const C = COMMON;
    if (tab === "aussie") {
      app.innerHTML = `<h2>G. 호주식 일상 표현 20</h2>
        ${C.aussie.map((a) => `<div class="card"><div class="line">${playBtn(a.ex)}<span class="en">${esc(a.ex)}</span><span class="pron-inline">${esc(a.pron)}</span></div>
          <p class="small" style="margin:4px 0 0 44px"><b>${esc(a.ko)}</b> · <span class="muted">${esc(a.where)}</span></p></div>`).join("")}`;
    } else if (tab === "check") renderChecklist();
    else {
      app.innerHTML = `<h2>F. 되묻기·확인 표현 10</h2>
        <div class="tip">못 알아들으면 침묵하지 말고 바로 되물으세요. 되묻는 것도 실력입니다.</div>
        ${C.clarify.map((c) => `<div class="card"><span class="badge">${esc(c.nuance)}</span>
          <div class="line" style="margin-top:8px">${playBtn(c.en)}<span class="en">${esc(c.en)}</span></div>
          <p class="small muted" style="margin:4px 0 0 44px">${esc(c.ko)}</p></div>`).join("")}`;
    }
  }
  function renderChecklist() {
    const autoPass = { "✈️ 공항": "airport", "🏨 호텔": "hotel", "☕ 식당·카페": "food", "🚋 교통": "transport", "🛒 쇼핑": "shopping", "💊 비상": "emergency" };
    let done = 0, total = 0;
    const body = COMMON.checklist.map((g, gi) => {
      const sid = autoPass[g.group];
      return `<div class="card todo"><h3>${esc(g.group)}</h3>${g.items.map((t, ti) => {
        const k = `${gi}-${ti}`; total++;
        // '듣기 카드 8/10' 항목은 듣기 점수로 자동 체크
        const autoOk = sid && /8\/10/.test(t) && knownCount(sid) >= 8;
        const on = autoOk || store.checks[k]; if (on) done++;
        return `<label><input type="checkbox" data-c="${k}" ${on ? "checked" : ""} ${autoOk ? "disabled" : ""}> ${esc(t)}${sid && /8\/10/.test(t) ? ` <span class="small muted">(현재 ${knownCount(sid)}/10)</span>` : ""}</label>`;
      }).join("")}</div>`;
    }).join("");
    app.innerHTML = `<h2>H. 출발 전 자가 점검</h2>
      <p class="score">완료 <b>${done}</b>/${total}</p><div class="progress" style="margin-bottom:12px"><i style="width:${(done / total) * 100}%"></i></div>
      ${body}`;
    app.querySelectorAll("[data-c]").forEach((c) => (c.onchange = () => { store.checks[c.dataset.c] = c.checked; save(); renderChecklist(); }));
  }

  // ---------- 종합 (10/26~28) ----------
  function renderReview(tab) {
    setHeader("🎙 종합 롤플레이", "10/26~28 · 전체 섞어 듣기 + 악센트 집중", true);
    setTabs("review", [["mix", "🎧 전체 섞어 듣기"], ["role", "🎙 종합 롤플레이"], ["accent", "🔤 악센트"]], tab);
    if (tab === "role") {
      const days = [{ date: "10/26~28", label: "매일", todo: ["전체 섞어 듣기 카드 1회", "종합 롤플레이 1회 (장면 3개)", "못 들은 표현 다시 듣기"] }];
      renderRole("review", days, REVIEW.roleplay);
    } else if (tab === "accent") {
      const A = SITUATIONS.airport;
      app.innerHTML = `<h2>🔤 호주 모음 발음</h2>
        <div class="card" style="padding:6px 10px"><table class="vt"><thead><tr><th>철자</th><th>미국식</th><th>호주식</th><th></th></tr></thead><tbody>
        ${A.vowels.map((v) => `<tr><td><b>${esc(v.word)}</b><div class="small muted">${esc(v.ex)}</div></td><td class="us">${esc(v.us)}</td><td class="au">${esc(v.au)}</td><td>${playBtn(v.ex, "sm")}</td></tr>`).join("")}
        </tbody></table></div>
        <h2>🔗 전체 연음 모음</h2>
        ${Object.values(SITUATIONS).flatMap((S) => S.linking.map((l) => `<div class="card"><div class="line">${playBtn(l.said)}<span class="en">${esc(l.said)}</span></div>
          <div class="small muted" style="margin:4px 0 0 44px">${S.icon} ${esc(l.change)}</div><div class="heard" style="margin-left:44px">👂 ${esc(l.heard)}</div></div>`)).join("")}
        ${infoHtml(null, REVIEW.accentListening, "")}`;
    } else {
      renderDeck(app, "__all", allItems(), { showSit: true, tip: "6개 상황 60문장을 섞어서 들어보세요. 실제 여행처럼 맥락 없이 들어도 알아듣는 게 목표입니다." });
    }
  }

  // ---------- 최종 (10/29~30): 모의고사 ----------
  let exam = null;
  function renderFinal(tab) {
    setHeader("✅ 최종 복습", "10/29~30 · 모의고사 + 체크리스트", true);
    setTabs("final", [["test", "📝 모의고사"], ["check", "✅ 체크리스트"]], tab);
    if (tab === "check") return renderChecklist();
    const best = store.bestExam;
    if (!exam) {
      app.innerHTML = `<div class="card flash">
        <div style="font-size:40px">📝</div>
        <b>듣기 모의고사 20문항</b>
        <p class="small muted">6개 상황에서 무작위 20문장. 소리만 듣고 뜻을 4개 중에서 고르세요.<br>통과 기준 16/20 (80%)</p>
        ${best != null ? `<p class="score">최고 점수 <b>${best}</b>/20 ${best >= 16 ? '<span class="pass">통과 ✅</span>' : ""}</p>` : ""}
        <button class="btn primary" id="startExam">시작하기</button></div>`;
      $("#startExam").onclick = () => {
        const all = allItems();
        exam = { qs: shuffle(all).slice(0, 20), n: 0, score: 0, picked: null, wrong: [] };
        exam.qs.forEach((it) => { it.opts = shuffle([it.q.ko, ...shuffle(all.filter((x) => x.q.ko !== it.q.ko)).slice(0, 3).map((x) => x.q.ko)]); });
        renderFinal("test");
        setTimeout(() => speak(exam.qs[0].q.au), 300);
      };
      return;
    }
    if (exam.n >= exam.qs.length) {
      const s = exam.score; store.bestExam = Math.max(store.bestExam ?? 0, s); save();
      app.innerHTML = `<div class="card flash"><div style="font-size:40px">${s >= 16 ? "🎉" : "💪"}</div>
        <p class="score">점수 <b>${s}</b>/20 ${s >= 16 ? '<span class="pass">통과 ✅</span>' : '<span class="fail">조금 더!</span>'}</p>
        <button class="btn primary" id="again">다시 보기</button></div>
        ${exam.wrong.length ? `<h2>틀린 문장</h2>${exam.wrong.map((it) => `<div class="card"><div class="line">${playBtn(it.q.au)}<span class="en">${esc(it.q.au)}</span></div>
          <p class="small" style="margin:4px 0 0 44px"><span class="pr">${esc(it.q.pron)}</span> · <b>${esc(it.q.ko)}</b></p></div>`).join("")}` : ""}`;
      $("#again").onclick = () => { exam = null; renderFinal("test"); };
      return;
    }
    const it = exam.qs[exam.n];
    app.innerHTML = `<div class="dots">${exam.qs.map((_, i) => `<i class="${i < exam.n ? "ok" : ""} ${i === exam.n ? "cur" : ""}"></i>`).join("")}</div>
      <div class="card flash">
        <div class="num">${exam.n + 1} / 20 · 현재 ${exam.score}점</div>
        <button class="big-play" data-say="${esc(it.q.au)}">▶</button>
        ${exam.picked != null ? `<div class="au">${esc(it.q.au)}</div><div class="pron">🗣 ${esc(it.q.pron)}</div>` : '<div class="small muted">여러 번 들어도 괜찮아요</div>'}
        <div class="choices">${it.opts.map((o, k) => {
          const cls = exam.picked == null ? "" : o === it.q.ko ? "right" : k === exam.picked ? "wrongc" : "";
          return `<button class="choice ${cls}" data-o="${k}" ${exam.picked != null ? "disabled" : ""}>${esc(o)}</button>`; }).join("")}</div>
        ${exam.picked != null ? `<button class="btn primary" id="nextQ">다음 ›</button>` : ""}
      </div>`;
    app.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
      exam.picked = +b.dataset.o;
      const correct = it.opts[exam.picked] === it.q.ko;
      if (correct) exam.score++; else exam.wrong.push(it);
      sit(it.sid).grades[it.i] = correct ? "ok" : "ng"; save();
      renderFinal("test");
    }));
    $("#nextQ") && ($("#nextQ").onclick = () => { exam.n++; exam.picked = null; renderFinal("test"); if (exam.n < exam.qs.length) setTimeout(() => speak(exam.qs[exam.n].q.au), 250); });
  }

  // ---------- 음성 설정 ----------
  function renderSettings() {
    setHeader("⚙️ 음성 설정", "호주 영어 음성 선택", true); setTabs();
    loadVoices();
    const en = englishVoices();
    const au = hasAU();
    app.innerHTML = `
      ${!hasTTS ? `<div class="card alert">이 브라우저는 음성 재생을 지원하지 않아요. Safari 또는 Chrome을 사용하세요.</div>` : ""}
      ${hasTTS && !au ? `<div class="card alert"><b>⚠️ 호주 영어(en-AU) 음성이 없습니다.</b><br>지금은 다른 억양으로 재생돼요. 아래 방법으로 호주 음성을 설치한 뒤 이 페이지를 새로고침하세요.</div>` : ""}
      ${hasTTS && au ? `<div class="card ok-box">✅ 호주 영어 음성을 사용할 수 있어요.</div>` : ""}
      <h2>🗣 영어 음성 선택</h2>
      <p class="small muted" style="margin-bottom:8px">🇦🇺 표시가 호주 음성입니다. ▶로 들어보고 고르세요.</p>
      ${en.map((v) => { const l = normLang(v.lang); const flag = { "en-AU": "🇦🇺", "en-GB": "🇬🇧", "en-US": "🇺🇸", "en-NZ": "🇳🇿", "en-IE": "🇮🇪", "en-IN": "🇮🇳" }[l] || "🌐";
        return `<label class="card voice ${voice && v.voiceURI === voice.voiceURI ? "sel" : ""}">
          <input type="radio" name="v" value="${esc(v.voiceURI)}" ${voice && v.voiceURI === voice.voiceURI ? "checked" : ""}>
          <span class="body"><b>${flag} ${esc(v.name)}</b><span class="small muted">${esc(l)}${v.localService === false ? " · 온라인" : ""}</span></span>
          <button class="play sm" data-test="${esc(v.voiceURI)}" aria-label="미리 듣기">▶</button></label>`; }).join("") || '<p class="muted">영어 음성을 찾지 못했어요.</p>'}
      <h2>📲 호주 음성 설치 방법</h2>
      <div class="card"><h3>iPhone · iPad</h3><ol class="steps-ol small">
        <li>설정 → 손쉬운 사용 → 읽기 및 말하기(음성 콘텐츠) → 음성</li>
        <li>영어 → <b>Karen</b> 또는 <b>Lee</b> (오스트레일리아) 선택 → 다운로드 (향상된 품질 권장)</li>
        <li>Safari에서 이 페이지 새로고침 → 위 목록에서 🇦🇺 선택</li></ol></div>
      <div class="card"><h3>Android (갤럭시 포함)</h3><ol class="steps-ol small">
        <li>설정 → 일반 → 언어 및 입력(또는 언어) → <b>텍스트 음성 변환(TTS)</b></li>
        <li>기본 엔진을 <b>Google 음성 인식 및 합성</b>으로 변경 (삼성 TTS면 호주 음성이 없을 수 있음)</li>
        <li>엔진 설정(⚙️) → 음성 데이터 설치 → <b>English (Australia)</b> 다운로드</li>
        <li>Chrome 완전히 종료 후 다시 열기 → 위 목록에서 🇦🇺 선택</li></ol></div>
      <div class="tip">기기 음성은 기기마다 품질이 다릅니다. 진짜 호주 발음은 듣기 탭의 유튜브 자료와 AI 음성 롤플레이로 보완하세요.</div>`;
    app.querySelectorAll("input[name=v]").forEach((r) => (r.onchange = () => {
      store.voiceURI = r.value; save(); loadVoices(); renderSettings(); say("G'day mate, how ya going? No worries.");
    }));
    app.querySelectorAll("[data-test]").forEach((b) => (b.onclick = (e) => {
      e.preventDefault(); speechSynthesis.cancel();
      const v = voices.find((x) => x.voiceURI === b.dataset.test);
      const u = new SpeechSynthesisUtterance("G'day mate, how ya going? Where ya headed today?");
      u.voice = v; u.lang = normLang(v.lang); u.rate = SPEEDS[speedIdx][1]; speechSynthesis.speak(u);
    }));
  }

  // ---------- offline ----------
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  route();
})();
