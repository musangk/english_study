// Run: node tests/core.test.js   (no dependencies)
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../coach/core.js');

const root = path.join(__dirname, '..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'packs/en/pack.json'), 'utf8'));
const packJa = JSON.parse(fs.readFileSync(path.join(root, 'packs/ja/pack.json'), 'utf8'));
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/report_en.md'), 'utf8');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('hashId is stable and normalizes', () => {
  assert.strictEqual(L.hashId('Circle back!'), L.hashId('circle  back'));
  assert.match(L.hashId('circle back'), /^[0-9a-f]{8}$/);
  // Must match cli/lsf.py (tests/test_cli.py checks the same vectors)
  const vec = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hash_vectors.json'), 'utf8'));
  for (const [s, h] of Object.entries(vec)) assert.strictEqual(L.hashId(s), h, s);
});

t('parse lsf-report block (with trailing commas)', () => {
  const { report, source } = L.parseReport(fixture, pack);
  assert.strictEqual(source, 'json');
  assert.strictEqual(report.errors.length, 2);
  assert.strictEqual(report.expressions.length, 3);
  assert.deepStrictEqual(report.scores, { fluency: 4, accuracy: 3, range: 3 });
});

t('fallback: table + scores without json block', () => {
  const noJson = fixture.split('```lsf-report')[0];
  const { report, source } = L.parseReport(noJson, pack);
  assert.strictEqual(source, 'table');
  assert.strictEqual(report.errors.length, 2);
  assert.strictEqual(report.errors[1].better, 'We need to discuss the deadline.');
  assert.strictEqual(report.scores.fluency, 4);
});

t('empty / garbage input throws', () => {
  assert.throws(() => L.parseReport('', pack));
  assert.throws(() => L.parseReport('hello there', pack));
});

t('apply → mission grading, new cards, repeated mistake resets box', () => {
  const store = L.emptyStore('en');
  const day1 = '2026-11-16'; // Monday → work track
  const m1 = L.pickMission(store, pack, day1);
  assert.strictEqual(m1.trackKey, 'work');
  assert.strictEqual(m1.expressions.length, 0);
  const { report } = L.parseReport(fixture, pack);
  const r1 = L.applyReport(store, report, m1, day1);
  assert.strictEqual(r1.added, 5); // 3 expr + 2 fix
  const ld = store.langs.en;
  assert.strictEqual(ld.sessions.length, 1);

  const day2 = L.addDays(day1, 1);
  const m2 = L.pickMission(store, pack, day2);
  assert.strictEqual(m2.expressions.length, 3);
  const circle = Object.values(ld.expressions).find((c) => c.text === 'circle back');
  const inMission = m2.expressions.some((e) => e.text === 'circle back');
  const r2 = L.applyReport(store, { ...report, expressions: [], errors: [report.errors[0]] }, m2, day2);
  if (inMission) {
    assert.strictEqual(circle.box, 2); // used → promoted
    assert.ok(r2.graded.find((g) => g.text === 'circle back').ok);
  }
  const fix = Object.values(ld.expressions).find((c) => c.text === 'I went to the meeting yesterday.');
  assert.strictEqual(fix.box, 1); // repeated mistake stays at box 1
  assert.strictEqual(fix.due, L.addDays(day2, 1));
});

t('prompts render with no leftover placeholders', () => {
  const store = L.emptyStore('en');
  for (const p of [pack, packJa]) {
    const m = L.pickMission(store, p, '2026-11-18');
    const s = L.buildStartPrompt(p, store, m); const r = L.buildReviewPrompt(p, m);
    assert.ok(!/\{\{\w+\}\}/.test(s), 'start placeholders');
    assert.ok(!/\{\{\w+\}\}/.test(r), 'review placeholders');
    assert.ok(r.includes('```lsf-report'));
    const json = r.split('```lsf-report')[1].split('```')[0];
    JSON.parse(json); // the shape we show the AI must itself be valid JSON
  }
});

t('review day reuses last week scenario', () => {
  const store = L.emptyStore('en');
  const { report } = L.parseReport(fixture, pack);
  L.applyReport(store, report, L.pickMission(store, pack, '2026-11-16'), '2026-11-16');
  const sat = L.pickMission(store, pack, '2026-11-21'); // Saturday → review
  assert.ok(sat.review);
  assert.strictEqual(sat.scenario, report.scenario);
});

t('stats, anki, merge', () => {
  const store = L.emptyStore('en');
  const { report } = L.parseReport(fixture, pack);
  L.applyReport(store, report, L.pickMission(store, pack, '2026-11-16'), '2026-11-16');
  const st = L.stats(store, 'en', '2026-11-16');
  assert.strictEqual(st.sessions, 1); assert.strictEqual(st.streak, 1);
  assert.strictEqual(st.topErrors.length, 2);
  const tsv = L.toAnkiTSV(store, 'en');
  assert.strictEqual(tsv.split('\n').length, 5);
  const merged = L.mergeStore(L.emptyStore('en'), JSON.parse(JSON.stringify(store)));
  L.mergeStore(merged, JSON.parse(JSON.stringify(store)));
  assert.strictEqual(merged.langs.en.sessions.length, 1);
});

t('similarity for spoken answers', () => {
  assert.ok(L.similarity('I went to the meeting yesterday', 'I went to the meeting yesterday.') > 0.99);
  assert.ok(L.similarity('I go meeting', 'I went to the meeting yesterday') < 0.5);
  assert.ok(L.similarity('予約をお願いします', '予約をお願いします。') > 0.99);
});

console.log(`\n${n} tests passed`);
