/* lang-study framework — core logic shared by the web coach (browser) and tests (node).
   No DOM access here. Everything works on plain JSON: pack (packs/<id>/pack.json) + store (schema/store.schema.json).
   The Python CLI (cli/lsf.py) implements the same rules; tests/ keep the two in sync. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LSF = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 9, 5: 20 }; // Leitner box → days (same as Grammar app)

  /* ---------- dates ---------- */
  const ymd = (d) => {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const dayIndex = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; }; // timezone-independent
  const weekday = (s) => new Date(s + 'T00:00:00').getDay();

  /* ---------- text ---------- */
  const norm = (s) => String(s || '').toLowerCase().normalize('NFKC')
    .replace(/[\s　]+/g, ' ').replace(/[.,!?;:"'“”‘’()\[\]。、！？「」『』…~\-]/g, '').trim();
  function hashId(s) { // FNV-1a 32bit, stable across JS/Python
    let h = 0x811c9dc5;
    const bytes = new TextEncoder().encode(norm(s));
    for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  const render = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));

  /* ---------- store ---------- */
  function emptyStore(lang = 'en') {
    return { version: 1, profile: { lang, levels: {}, grammarLink: true }, langs: {} };
  }
  function langData(store, lang) {
    if (!store.langs[lang]) store.langs[lang] = { sessions: [], expressions: {} };
    return store.langs[lang];
  }
  function levelOf(store, pack) { return (store.profile.levels || {})[pack.id] || pack.levels.default; }
  const levelLabel = (pack, v) => (pack.levels.items.find((i) => i.value === v) || {}).label || String(v);

  /* ---------- mission ---------- */
  function trackOf(pack, key) { return pack.tracks.find((t) => t.key === key) || pack.tracks[0]; }

  function pickMission(store, pack, date = today(), opts = {}) {
    const ld = langData(store, pack.id);
    let trackKey = pack.weekly[String(weekday(date))] || pack.tracks[0].key;
    let scenario; let review = false;
    if (trackKey === 'review') {
      review = true;
      const weekAgo = addDays(date, -7);
      const past = ld.sessions.filter((s) => s.date >= weekAgo && s.date < date && s.scenario);
      if (past.length) { trackKey = past[0].track || pack.tracks[0].key; scenario = past[0].scenario; }
      else trackKey = pack.tracks[0].key;
    }
    if (opts.trackKey) { trackKey = opts.trackKey; review = false; scenario = undefined; }
    const track = trackOf(pack, trackKey);
    if (!scenario) scenario = track.scenarios[dayIndex(date) % track.scenarios.length];
    const n = opts.count || 3;
    const cards = Object.entries(ld.expressions).map(([id, c]) => ({ id, ...c }));
    const due = cards.filter((c) => c.due <= date).sort((a, b) => a.box - b.box || a.due.localeCompare(b.due));
    const rest = cards.filter((c) => c.due > date).sort((a, b) => a.box - b.box || b.added.localeCompare(a.added));
    const picked = [...due, ...rest].slice(0, n);
    return { date, trackKey: track.key, trackLabel: track.label, scenario, review, expressions: picked, extra: opts.extra || [] };
  }

  function scoreShape(pack) { return JSON.stringify(Object.fromEntries(pack.rubric.map((r) => [r.key, 0]))); }

  function buildStartPrompt(pack, store, mission) {
    const lv = levelOf(store, pack);
    const items = [...mission.expressions.map((e) => e.text), ...mission.extra];
    const list = items.length ? items.map((t) => `   - ${t}`).join('\n') : '   - (none yet — pick 3 useful expressions for this scenario and tell me at the start)';
    return render(pack.prompts.start, {
      langName: pack.name, track: mission.trackLabel, scenario: mission.scenario,
      level: levelLabel(pack, lv), levelUp: levelLabel(pack, Math.min(6, lv + 1)), expressions: list,
    });
  }
  function buildReviewPrompt(pack, mission) {
    const items = [...mission.expressions.map((e) => e.text), ...mission.extra];
    return render(pack.prompts.review, {
      errorTypes: pack.errorTypes.map((e) => e.key).join(', '),
      rubric: pack.rubric.map((r) => r.key).join(', '),
      missionList: items.length ? items.join(' / ') : '(none)',
      langId: pack.id, trackKey: mission.trackKey, scenario: mission.scenario.replace(/"/g, "'"),
      scoreShape: scoreShape(pack),
    });
  }

  /* ---------- report parsing ---------- */
  function looseJSON(s) {
    const cleaned = s.replace(/^﻿/, '').replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
  }
  function parseTableRows(text) {
    const rows = [];
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith('|')) continue;
      const cells = t.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.length < 2) continue;
      if (cells.every((c) => /^:?-{2,}:?$/.test(c) || c === '')) continue;
      if (/my sentence|내 문장|better version/i.test(cells[0] + cells[1])) continue;
      rows.push({ said: cells[0], better: cells[1], type: cells[2] || '', note: cells[3] || '' });
    }
    return rows;
  }
  function parseReport(text, pack) {
    if (!text || !text.trim()) throw new Error('붙여넣은 내용이 비어 있어요.');
    const blocks = [...text.matchAll(/```\s*(lsf-report|json)?\s*\n([\s\S]*?)```/g)];
    const pick = blocks.find((b) => b[1] === 'lsf-report') || blocks.find((b) => /"errors"\s*:/.test(b[2]));
    let report; let source = 'json';
    if (pick) {
      try { report = looseJSON(pick[2]); } catch (e) { throw new Error('lsf-report JSON을 읽지 못했어요: ' + e.message); }
    } else {
      // Fallback: markdown table + "fluency: 4" style scores
      source = 'table';
      const errors = parseTableRows(text);
      const scores = {};
      const keys = pack ? pack.rubric.map((r) => r.key) : ['fluency', 'accuracy', 'range'];
      for (const k of keys) {
        const m = text.match(new RegExp(k + '[^0-9\\n]{0,15}([1-6])', 'i'));
        if (m) scores[k] = Number(m[1]);
      }
      if (!errors.length && !Object.keys(scores).length) throw new Error('lsf-report 블록이나 교정 표를 찾지 못했어요.');
      report = { errors, expressions: [], scores };
    }
    report.errors = (report.errors || []).filter((e) => e && (e.said || e.better));
    report.expressions = (report.expressions || []).filter((e) => e && e.text);
    report.scores = report.scores || {};
    for (const k of Object.keys(report.scores)) {
      const v = Number(report.scores[k]);
      if (!(v >= 1 && v <= 6)) delete report.scores[k]; else report.scores[k] = v;
    }
    report.missionUsed = (report.missionUsed || []).filter(Boolean);
    if (pack) report.lang = pack.id;
    return { report, source };
  }

  /* ---------- applying a report ---------- */
  function upsertCard(ld, card, date) {
    const id = hashId(card.text);
    const old = ld.expressions[id];
    if (old) {
      // Seen again as a mistake → back to box 1 (it is not learned yet)
      if (card.kind === 'fix') { old.box = 1; old.due = addDays(date, 1); old.wrong = card.wrong || old.wrong; }
      if (card.meaning && !old.meaning) old.meaning = card.meaning;
      return { id, created: false };
    }
    ld.expressions[id] = { box: 1, due: addDays(date, 1), uses: 0, added: date, ...card };
    return { id, created: true };
  }
  function grade(card, ok, date) {
    card.box = ok ? Math.min(5, (card.box || 1) + 1) : 1;
    card.due = addDays(date, ok ? INTERVALS[card.box] : 1);
    if (ok) card.uses = (card.uses || 0) + 1;
  }
  function applyReport(store, report, mission, date = today()) {
    const lang = report.lang || mission?.lang || store.profile.lang;
    const ld = langData(store, lang);
    const used = (report.missionUsed || []).map(norm);
    const graded = [];
    for (const e of (mission?.expressions || [])) {
      const card = ld.expressions[e.id];
      if (!card) continue;
      const n = norm(card.text);
      const ok = used.some((u) => u && (u === n || u.includes(n) || n.includes(u)));
      grade(card, ok, date); graded.push({ text: card.text, ok });
    }
    let added = 0;
    for (const x of report.expressions) if (upsertCard(ld, { text: x.text, meaning: x.meaning || '', kind: 'expr' }, date).created) added++;
    for (const er of report.errors) {
      if (!er.better || norm(er.better) === norm(er.said)) continue;
      if (upsertCard(ld, { text: er.better, wrong: er.said || '', meaning: er.note || '', type: er.type || '', kind: 'fix' }, date).created) added++;
    }
    const session = {
      id: `${date}-${Date.now().toString(36)}`, date, lang,
      track: report.track || mission?.trackKey || '', scenario: report.scenario || mission?.scenario || '',
      mission: (mission?.expressions || []).map((e) => e.text).concat(mission?.extra || []),
      errors: report.errors, expressions: report.expressions, scores: report.scores,
      missionUsed: report.missionUsed || [], summary: report.summary || '',
    };
    ld.sessions.unshift(session);
    return { session, added, graded };
  }

  /* ---------- drill (voice / self grading) ---------- */
  function similarity(a, b) { // token overlap, good enough for spoken answers
    const ta = norm(a).split(' ').filter(Boolean); const tb = norm(b).split(' ').filter(Boolean);
    if (!ta.length || !tb.length) {
      // CJK: fall back to characters
      const ca = [...norm(a).replace(/ /g, '')]; const cb = [...norm(b).replace(/ /g, '')];
      if (!ca.length || !cb.length) return 0;
      const setB = new Set(cb); return ca.filter((c) => setB.has(c)).length / Math.max(ca.length, cb.length);
    }
    if (ta.length === 1 && tb.length === 1 && ta[0].length > 3) {
      const ca = [...ta[0]]; const setB = new Set(tb[0]); return ca.filter((c) => setB.has(c)).length / Math.max(ca.length, tb[0].length);
    }
    const setB = new Set(tb);
    return ta.filter((t) => setB.has(t)).length / Math.max(ta.length, tb.length);
  }
  function gradeCard(store, lang, id, ok, date = today()) {
    const card = langData(store, lang).expressions[id];
    if (card) grade(card, ok, date);
    return card;
  }

  /* ---------- stats & export ---------- */
  function stats(store, lang, date = today()) {
    const ld = langData(store, lang);
    const cards = Object.values(ld.expressions);
    const errorCount = {};
    for (const s of ld.sessions) for (const e of s.errors) if (e.type) errorCount[e.type] = (errorCount[e.type] || 0) + 1;
    const days = new Set(ld.sessions.map((s) => s.date));
    let streak = 0; let d = days.has(date) ? date : addDays(date, -1);
    while (days.has(d)) { streak++; d = addDays(d, -1); }
    return {
      sessions: ld.sessions.length, streak,
      cards: cards.length, due: cards.filter((c) => c.due <= date).length, mastered: cards.filter((c) => c.box >= 4).length,
      topErrors: Object.entries(errorCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      scoreSeries: ld.sessions.slice(0, 20).reverse().map((s) => ({ date: s.date, scores: s.scores })),
    };
  }
  function toAnkiTSV(store, lang) {
    const esc = (s) => String(s || '').replace(/[\t\n]/g, ' ');
    return Object.values(langData(store, lang).expressions).map((c) => {
      const front = c.kind === 'fix' ? `✗ ${esc(c.wrong)}` : esc(c.meaning || c.text);
      const back = c.kind === 'fix' ? `${esc(c.text)}${c.meaning ? ' — ' + esc(c.meaning) : ''}` : esc(c.text);
      return `${front}\t${back}\tlsf ${lang} ${c.kind}`;
    }).join('\n');
  }
  function mergeStore(base, incoming) { // import: keep everything, newer box wins
    for (const [lang, ld] of Object.entries(incoming.langs || {})) {
      const t = langData(base, lang);
      const seen = new Set(t.sessions.map((s) => s.id));
      for (const s of ld.sessions || []) if (!seen.has(s.id)) t.sessions.push(s);
      t.sessions.sort((a, b) => b.date.localeCompare(a.date));
      for (const [id, c] of Object.entries(ld.expressions || {})) {
        const o = t.expressions[id];
        if (!o || (c.due || '') > (o.due || '')) t.expressions[id] = c;
      }
    }
    base.profile = { ...base.profile, ...(incoming.profile || {}) };
    return base;
  }

  return {
    INTERVALS, today, addDays, norm, hashId, render, emptyStore, langData, levelOf, levelLabel,
    pickMission, buildStartPrompt, buildReviewPrompt, parseReport, applyReport,
    similarity, gradeCard, stats, toAnkiTSV, mergeStore,
  };
});
