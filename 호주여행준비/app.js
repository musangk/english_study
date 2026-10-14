(() => {
  const $ = (s) => document.querySelector(s);
  const app = $("#app"), tabsEl = $("#tabs");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- storage (fails silently in private mode) ----------
  const KEY = "aus-trip-v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

  // ---------- speech (prefers an en-AU voice) ----------
  const SPEEDS = [["느리게", 0.7], ["보통", 0.95], ["실제속도", 1.15]];
  let speedIdx = store.speedIdx ?? 1;
  let voice = null;
  const pickVoice = () => {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === "en-AU") || vs.find((v) => /en[-_]AU/i.test(v.lang)) ||
            vs.find((v) => v.lang === "en-GB") || vs.find((v) => v.lang.startsWith("en")) || null;
  };
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  const updateSpeedBtn = () => { $("#speedBtn").textContent = "🔊 " + SPEEDS[speedIdx][0]; };
  $("#speedBtn").onclick = () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length; store.speedIdx = speedIdx; save(); updateSpeedBtn();
    toast(`재생 속도: ${SPEEDS[speedIdx][0]}${voice ? " · " + voice.lang : ""}`);
  };
  updateSpeedBtn();

  function speak(text, btn) {
    if (!("speechSynthesis" in window)) return toast("이 브라우저는 음성 재생을 지원하지 않아요");
    speechSynthesis.cancel();
    document.querySelectorAll(".playing").forEach((b) => b.classList.remove("playing"));
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-AU";
    u.rate = SPEEDS[speedIdx][1];
    if (btn) { btn.classList.add("playing"); u.onend = u.onerror = () => btn.classList.remove("playing"); }
    speechSynthesis.speak(u);
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
  const daysUntil = (iso) => Math.ceil((new Date(iso + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 864e5);
  const currentTopic = () => {
    const t = todayStr(); let cur = null;
    for (const s of TRIP.schedule) if (s.start <= t) cur = s;
    return cur;
  };
  const sit = (id) => (store[id] ||= { grades: {}, todo: {} });

  // ---------- routing ----------
  const TABS = [["listen", "🎧 듣기"], ["phrases", "💬 표현"], ["visual", "🗺 그림"], ["info", "📌 정보"], ["role", "🎙 롤플레이"]];
  function route() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const [id, tab = "listen"] = location.hash.replace(/^#\/?/, "").split("/");
    if (id && SITUATIONS[id]) renderSituation(id, tab);
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  $("#backBtn").onclick = () => (location.hash = "");

  // ---------- home ----------
  function renderHome() {
    $("#backBtn").hidden = true; tabsEl.hidden = true;
    $("#title").textContent = "🦘 호주여행준비"; $("#subtitle").textContent = "시드니 → 멜버른 · 여행 영어";
    const d = daysUntil(TRIP.departure), cur = currentTopic();
    const ddayTxt = d > 0 ? `D-${d}` : d === 0 ? "D-DAY ✈️" : "여행 중 🇦🇺";
    app.innerHTML = `
      <section class="hero">
        <div class="dday">${ddayTxt}</div>
        <p>2026.10.31 ~ 11.11 · 시드니 → 멜버른 · 성인 2명<br>목표: 실력 복구 + 호주 악센트 적응 (하루 15분)</p>
      </section>
      <h2>📅 학습 일정</h2>
      ${TRIP.schedule.map((s) => {
        const ready = !!SITUATIONS[s.id], isNow = cur && cur.id === s.id;
        const st = ready ? sit(s.id) : null;
        const known = st ? Object.values(st.grades).filter((g) => g === "ok").length : 0;
        const total = ready ? SITUATIONS[s.id].questions.length : 0;
        return `<button class="card sched ${isNow ? "today" : ""} ${ready ? "" : "disabled"}" ${ready ? `data-go="${s.id}"` : "disabled"}>
          <span class="ico">${s.icon}</span>
          <span class="body">
            <span class="date">${s.dates}</span> ${isNow ? '<span class="badge now">오늘</span>' : ""} ${ready ? "" : '<span class="badge">준비 중</span>'}
            <div><strong>${s.name}</strong></div>
            ${ready ? `<div class="small muted">듣기 이해 ${known}/${total}</div><div class="progress"><i style="width:${total ? (known / total) * 100 : 0}%"></i></div>` : ""}
          </span>
          ${ready ? "<span>›</span>" : ""}
        </button>`;
      }).join("")}
      <div class="tip">각 주제는 2일 구성: 1일차 듣기·표현 → 2일차 AI 음성 롤플레이. 출퇴근 때는 '듣기 → 카드'로 흘려듣기.</div>
      <p class="footer">음성은 기기의 영어(호주) TTS 음성을 사용합니다 · <a href="../">Grammar in Use 학습</a></p>`;
    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => (location.hash = `/${b.dataset.go}/listen`)));
  }

  // ---------- situation ----------
  function renderSituation(id, tab) {
    const S = SITUATIONS[id];
    $("#backBtn").hidden = false; tabsEl.hidden = false;
    $("#title").textContent = `${S.icon} ${S.title}`;
    $("#subtitle").textContent = TRIP.schedule.find((s) => s.id === id)?.dates || "";
    tabsEl.innerHTML = TABS.map(([k, l]) => `<a class="tab ${k === tab ? "on" : ""}" href="#/${id}/${k}" style="text-decoration:none">${l}</a>`).join("");
    tabsEl.querySelector(".on")?.scrollIntoView({ inline: "center", block: "nearest" });
    ({ listen: renderListen, phrases: renderPhrases, visual: renderVisual, info: renderInfo, role: renderRole }[tab] || renderListen)(id, S);
  }

  // 듣기: 카드(블라인드 듣기) / 목록
  let listenMode = "card", cardIdx = 0, revealStep = 0;
  function renderListen(id, S) {
    const st = sit(id), qs = S.questions;
    const ok = Object.values(st.grades).filter((g) => g === "ok").length;
    const passN = Math.ceil(qs.length * 0.8);
    let html = `
      <div class="seg"><button data-mode="card" class="${listenMode === "card" ? "on" : ""}">🃏 듣기 카드</button><button data-mode="list" class="${listenMode === "list" ? "on" : ""}">📋 전체 목록</button></div>
      <p class="score">자막 없이 이해: <b>${ok}</b>/${qs.length} · 통과 기준 ${passN}개 → ${ok >= passN ? '<span class="pass">통과 ✅</span>' : '<span class="fail">연습 중</span>'}</p>
      <div class="dots">${qs.map((_, i) => `<i class="${st.grades[i] === "ok" ? "ok" : st.grades[i] === "ng" ? "ng" : ""} ${listenMode === "card" && i === cardIdx ? "cur" : ""}"></i>`).join("")}</div>`;

    if (listenMode === "card") {
      const q = qs[cardIdx];
      html += `<div class="card flash">
        <div class="num">질문 ${cardIdx + 1} / ${qs.length} · 먼저 소리만 듣고 뜻을 떠올려 보세요</div>
        <button class="big-play" data-say="${esc(q.au)}" aria-label="호주식 발화 듣기">▶</button>
        ${revealStep >= 1 ? `<div class="au">${esc(q.au)}</div><div class="pron">🗣 ${esc(q.pron)}</div><div><b>${esc(q.ko)}</b></div><div class="std">표준: ${esc(q.std)} ${playBtn(q.std, "sm")}</div>` : ""}
        ${revealStep >= 2 ? `<div class="ansbox"><div class="lbl">내 즉답</div><div class="line">${playBtn(q.ans, "sm")}<span class="en">${esc(q.ans)}</span></div></div>` : ""}
        ${revealStep < 2 ? `<button class="reveal" id="reveal">${revealStep === 0 ? "👀 문장·뜻 보기" : "💬 즉답 보기"}</button>` : ""}
        <div class="grade"><button class="no" data-g="ng">😵 못 알아들음</button><button class="yes" data-g="ok">👂 알아들음</button></div>
      </div>
      <div class="navrow"><button id="prev">‹ 이전</button><button id="shuffle">🔀 랜덤</button><button id="next">다음 ›</button></div>
      <div class="tip">${esc(S.linkingTip)}</div>`;
    } else {
      html += qs.map((q, i) => `<div class="card q">
        <div class="head"><span class="no">#${i + 1}</span><span class="stagechip">${esc(S.flow.find((f) => f.qs.includes(i + 1))?.title || "")}</span></div>
        <div class="line">${playBtn(q.au)}<span class="en">${esc(q.au)}</span></div>
        <dl class="kv"><dt>발음</dt><dd class="pr">${esc(q.pron)}</dd><dt>뜻</dt><dd>${esc(q.ko)}</dd><dt>표준</dt><dd class="muted">${esc(q.std)}</dd></dl>
        <div class="line" style="margin-top:8px">${playBtn(q.ans, "sm")}<span class="small"><span class="lbl">즉답</span> ${esc(q.ans)}</span></div>
      </div>`).join("");
    }
    app.innerHTML = html;
    app.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { listenMode = b.dataset.mode; renderListen(id, S); }));
    if (listenMode === "card") {
      const go = (i) => { cardIdx = (i + qs.length) % qs.length; revealStep = 0; renderListen(id, S); };
      $("#reveal") && ($("#reveal").onclick = () => { revealStep++; renderListen(id, S); });
      $("#prev").onclick = () => go(cardIdx - 1);
      $("#next").onclick = () => go(cardIdx + 1);
      $("#shuffle").onclick = () => go(Math.floor(Math.random() * qs.length));
      app.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => { st.grades[cardIdx] = b.dataset.g; save(); go(cardIdx + 1); }));
    }
  }

  function renderPhrases(id, S) {
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

  function renderVisual(id, S) {
    const tree = (n) => n.q
      ? `<div class="node">${esc(n.q)}</div><div class="kids">${n.branches.map((b) => `<div><div class="edge">└ ${esc(b.a)}</div>${b.result ? `<div class="res ${b.tone}">${esc(b.result)}</div>` : tree(b)}</div>`).join("")}</div>`
      : "";
    const F = S.answerFormula;
    app.innerHTML = `
      <h2>🗺 입국 흐름도</h2>
      <p class="small muted" style="margin-bottom:10px">각 단계에서 나오는 질문 번호를 누르면 호주식 발화를 들을 수 있어요.</p>
      <div class="flow">${S.flow.map((f) => `<div class="step"><div class="n">${f.n}</div><div class="box">
        <div class="t">${esc(f.title)}<small>${esc(f.en)}</small></div><p>${esc(f.desc)}</p>
        ${f.qs.length ? `<div class="qchips">${f.qs.map((n) => `<button class="qchip" data-say="${esc(S.questions[n - 1].au)}">#${n} ${esc(S.questions[n - 1].ko)}</button>`).join("")}</div>` : ""}
        ${f.warn ? `<div class="warn">⚠ ${esc(f.warn)}</div>` : ""}
      </div></div>`).join("")}</div>

      <h2>🌳 음식물 신고 판단</h2>
      <div class="tree">${tree(S.tree)}</div>
      <div class="tip">${esc(S.tree.tip)}</div>

      <h2>🔗 연음 분해: 왜 안 들리나</h2>
      <div class="legend"><span><span class="chunk drop">생략</span> 거의 안 들림</span><span><span class="chunk chg">변화</span> 실제 소리</span></div>
      ${S.linking.map((l) => `<div class="card">
        <div class="line">${playBtn(l.said)}<span class="en">${esc(l.said)}</span></div>
        <div class="chunks">${l.parts.map(([w, c]) => `<span class="chunk ${c}">${esc(w)}</span>`).join("")}</div>
        <div class="small muted">${esc(l.change)}</div>
        <div class="heard">👂 ${esc(l.heard)}</div>
      </div>`).join("")}
      <div class="tip">${esc(S.linkingTip)}</div>

      <h2>🔤 호주 모음 발음</h2>
      <div class="card" style="padding:6px 10px">
        <table class="vt"><thead><tr><th>철자</th><th>미국식</th><th>호주식</th><th></th></tr></thead><tbody>
        ${S.vowels.map((v) => `<tr><td><b>${esc(v.word)}</b><div class="small muted">${esc(v.ex)}</div></td><td class="us">${esc(v.us)}</td><td class="au">${esc(v.au)}</td><td>${playBtn(v.ex, "sm")}</td></tr>`).join("")}
        </tbody></table>
      </div>

      <h2>🧩 즉답 공식</h2>
      <div class="card">
        <div class="formula">${F.parts.map(([b, s], i) => `${i ? '<span class="plus">+</span>' : ""}<div class="blk"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>
        <div class="line" style="margin-top:12px">${playBtn(F.example.q, "sm")}<span class="small"><span class="lbl">Q</span> ${esc(F.example.q)}</span></div>
        <div class="line">${playBtn(F.example.a)}<span class="en">${esc(F.example.a)}</span></div>
        <div class="tip">${esc(F.tip)}</div>
      </div>`;
  }

  function renderInfo(id, S) {
    app.innerHTML = `
      <h2>📌 호주 현지 정보</h2>
      ${S.info.map((i) => `<div class="card info">
        <div class="k">${esc(i.k)} ${/확인 필요|반드시/.test(i.note) ? '<span class="badge check">확인 필요</span>' : ""}</div>
        <p>${esc(i.v)}</p>${i.note ? `<div class="note">※ ${esc(i.note)}</div>` : ""}
      </div>`).join("")}
      <h2>🎬 듣기 자료 (유튜브)</h2>
      ${S.listening.map((l) => `<div class="card"><a class="yt" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(l.q)}">
        <span class="ytico">▶</span><span><span class="lbl">${esc(l.use)}</span><br><code>${esc(l.q)}</code></span></a></div>`).join("")}`;
  }

  function renderRole(id, S) {
    const st = sit(id);
    app.innerHTML = `
      <h2>✅ 오늘 할 일</h2>
      ${S.days.map((d, di) => `<div class="card todo"><h3>${esc(d.date)} · ${esc(d.label)}</h3>
        ${d.todo.map((t, ti) => { const k = `${di}-${ti}`; return `<label><input type="checkbox" data-k="${k}" ${st.todo[k] ? "checked" : ""}> ${esc(t)}</label>`; }).join("")}
      </div>`).join("")}
      <h2>🎙 롤플레이 프롬프트</h2>
      <ol class="steps-ol small">
        <li>아래 <b>프롬프트 복사</b></li>
        <li>ChatGPT·Claude 앱에 붙여넣고 <b>음성 모드</b>로 전환</li>
        <li>끝나면 피드백 표에서 못 들은 표현을 <b>듣기 카드</b>로 다시 연습</li>
      </ol>
      <div class="btns"><button class="btn primary" id="copy">📋 프롬프트 복사</button></div>
      <div class="btns">
        <a class="btn" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(S.roleplay)}">Claude에서 열기</a>
        <a class="btn" target="_blank" rel="noopener" href="https://chatgpt.com/?q=${encodeURIComponent(S.roleplay)}">ChatGPT에서 열기</a>
      </div>
      <h2 style="font-size:15px">프롬프트 내용</h2>
      <div class="prompt">${esc(S.roleplay)}</div>`;
    app.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => { st.todo[c.dataset.k] = c.checked; save(); }));
    $("#copy").onclick = async () => {
      try { await navigator.clipboard.writeText(S.roleplay); toast("복사 완료! AI 앱에 붙여넣으세요"); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(app.querySelector(".prompt"));
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("길게 눌러 복사하세요");
      }
    };
  }

  route();
})();
