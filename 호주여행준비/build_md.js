// data.js → 상황별 마크다운 생성.  실행: node 호주여행준비/build_md.js
const fs = require("fs"), path = require("path");
const dir = __dirname;
global.window = {};
eval(fs.readFileSync(path.join(dir, "data.js"), "utf8"));
const { TRIP, SITUATIONS, COMMON, REVIEW } = window;

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const tree = (n, depth = 0) => {
  const pad = "  ".repeat(depth);
  let out = `${pad}- **${n.q}**\n`;
  for (const b of n.branches) {
    out += b.result ? `${pad}  - ${b.a} → ${b.tone === "ok" ? "✅" : "⚠️"} ${b.result}\n` : `${pad}  - ${b.a}\n${tree(b, depth + 2)}`;
  }
  return out;
};
const FILES = { airport: "01_공항_입국심사.md", hotel: "02_호텔.md", food: "03_식당_카페.md", transport: "04_교통_길찾기_투어.md", shopping: "05_쇼핑_마트_환불.md", emergency: "06_비상상황.md" };

for (const [id, S] of Object.entries(SITUATIONS)) {
  const sched = TRIP.schedule.find((s) => s.id === id);
  const md = [];
  md.push(`# ${S.icon} ${S.title} (${sched.dates})`, "");
  for (const d of S.days) md.push(`- **${d.date} (${d.label})**: ${d.todo.join(" · ")}`);
  md.push("", "[← 호주여행준비 목차](README.md) · 📱 [웹에서 듣기](https://musangk.github.io/english_study/%ED%98%B8%EC%A3%BC%EC%97%AC%ED%96%89%EC%A4%80%EB%B9%84/#/" + id + ")", "", "---", "");
  md.push("## A. 예상 질문 듣기 표", "", table(["#", "표준 표현", "실제 호주식 발화", "들리는 발음", "한국어 뜻", "내 즉답 예시"], S.questions.map((q, i) => [i + 1, q.std, q.au, q.pron, q.ko, q.ans])), "");
  md.push("## B. 즉답·응용 문장", "", table(["영어 문장", "한국어 뜻", "응용 변형", "사용 시점"], S.phrases.map((p) => [p.en, p.ko, p.alt, p.when])), "");
  md.push("## C. 예상 밖 상황 대응", "", table(["상황", "상대 발화", "내 대응 표현"], S.surprises.map((s) => [s.sit, s.them, s.me])), "");
  md.push("## D. 호주 현지 특화 정보", "", table(["항목", "내용", "비고"], S.info.map((i) => [i.k, i.v, i.note])), "");
  md.push("## E. 듣기 자료", "", table(["용도", "유튜브 검색어"], S.listening.map((l) => [l.use, "`" + l.q + "`"])), "", "---", "");
  md.push(`## V1. ${S.flowTitle}`, "", table(["단계", "내용", "나오는 질문", "돌발"], S.flow.map((f) => [`${f.n} ${f.title} (${f.en})`, f.desc, f.qs.map((n) => "#" + n).join(" "), f.warn || ""])), "");
  md.push(`## V2. ${S.treeTitle}`, "", tree(S.tree), `> ${S.tree.tip}`, "");
  md.push("## V3. 연음 분해: 왜 안 들리는가", "", table(["실제 발화", "단어 분해 (~~생략~~, **변화**)", "소리 변화", "들리는 덩어리"],
    S.linking.map((l) => [l.said, l.parts.map(([w, c]) => (c === "drop" ? `~~${w}~~` : c === "chg" ? `**${w}**` : w)).join(" · "), l.change, l.heard])), "", `**듣기 포인트:** ${S.linkingTip}`, "");
  let v = 4;
  if (S.vowels) md.push(`## V${v++}. 호주 모음 발음`, "", table(["철자", "미국식", "호주식으로 들림", "예시"], S.vowels.map((x) => [x.word, x.us, x.au, x.ex])), "");
  const F = S.answerFormula;
  md.push(`## V${v}. ${F.title}`, "", "```", " " + F.parts.map(([b]) => `[${b}]`).join(" + "), " " + F.parts.map(([, s]) => s).join(" "), "", ` 예) Q. ${F.example.q}`, `     A. ${F.example.a}`, "```", `> ${F.tip}`, "", "---", "");
  md.push(`## 🎙 롤플레이 프롬프트 (${S.days[1].date}, AI 음성 모드)`, "", "```", S.roleplay, "```", "");
  fs.writeFileSync(path.join(dir, FILES[id]), md.join("\n"));
}

// 공통 F·G·H
const c = [];
c.push("# 🗂 공통 자료 (F·G·H)", "", "[← 호주여행준비 목차](README.md)", "");
c.push("## F. 되묻기·확인 표현", "", table(["#", "영어", "한국어 뜻", "뉘앙스·상황"], COMMON.clarify.map((x, i) => [i + 1, x.en, x.ko, x.nuance])), "");
c.push("## G. 호주식 일상 표현·발음 20", "", table(["표현", "뜻", "실제 들리는 발음", "나오는 상황"], COMMON.aussie.map((x) => [x.ex, x.ko, x.pron, x.where])), "");
c.push("## H. 출발 전 자가 점검 체크리스트", "");
for (const g of COMMON.checklist) c.push(`### ${g.group}`, "", ...g.items.map((t) => `- [ ] ${t}`), "");
fs.writeFileSync(path.join(dir, "07_공통_되묻기_호주표현_체크리스트.md"), c.join("\n"));

// 종합·최종
const r = [];
r.push("# 🎙 종합 롤플레이 (10/26~28) · ✅ 최종 복습 (10/29~30)", "", "[← 호주여행준비 목차](README.md)", "");
r.push("## 10/26~28 종합", "", "- 웹 **🎧 전체 섞어 듣기**: 6개 상황 60문장을 섞어서 카드·연속 재생", "- 웹 **🔤 악센트**: 호주 모음 발음 + 전체 연음 모음", "- 아래 종합 롤플레이 프롬프트로 AI 음성 대화 (장면 3개)", "");
r.push("### 악센트 집중 듣기", "", table(["용도", "유튜브 검색어"], REVIEW.accentListening.map((l) => [l.use, "`" + l.q + "`"])), "");
r.push("### 종합 롤플레이 프롬프트", "", "```", REVIEW.roleplay, "```", "");
r.push("## 10/29~30 최종 복습", "", "- 웹 **📝 모의고사**: 무작위 20문장 듣고 뜻 고르기 (통과 16/20)", "- [H. 체크리스트](07_공통_되묻기_호주표현_체크리스트.md) 전 항목 확인", "- 각 상황의 **확인 필요** 항목 최신 정보 재확인", "");
fs.writeFileSync(path.join(dir, "08_종합_최종복습.md"), r.join("\n"));
console.log("generated", Object.values(FILES).length + 2, "files");
