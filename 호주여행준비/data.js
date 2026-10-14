// 호주여행준비 학습 데이터. 새 상황은 SITUATIONS 배열에 추가.
window.TRIP = {
  title: "호주여행준비",
  departure: "2026-10-31",
  schedule: [
    { id: "airport", dates: "10/14~15", start: "2026-10-14", icon: "✈️", name: "공항·입국심사" },
    { id: "hotel", dates: "10/16~17", start: "2026-10-16", icon: "🏨", name: "호텔" },
    { id: "food", dates: "10/18~19", start: "2026-10-18", icon: "☕", name: "식당·카페" },
    { id: "transport", dates: "10/20~21", start: "2026-10-20", icon: "🚋", name: "교통·길찾기·투어" },
    { id: "shopping", dates: "10/22~23", start: "2026-10-22", icon: "🛒", name: "쇼핑·마트·환불" },
    { id: "emergency", dates: "10/24~25", start: "2026-10-24", icon: "💊", name: "비상 상황" },
    { id: "review", dates: "10/26~28", start: "2026-10-26", icon: "🎙", name: "종합 롤플레이" },
    { id: "final", dates: "10/29~30", start: "2026-10-29", icon: "✅", name: "최종 복습" }
  ]
};

window.SITUATIONS = {
  airport: {
    title: "공항·입국심사",
    icon: "✈️",
    days: [
      { date: "10/14", label: "1일차 · 듣기·표현", todo: ["A 예상 질문 10개 듣기", "B·C 표현 소리 내 읽기", "V 시각 자료 훑기", "E 유튜브 듣기 1개"] },
      { date: "10/15", label: "2일차 · 롤플레이", todo: ["A 카드 복습 (뜻 가리고)", "롤플레이 프롬프트로 AI 음성 대화", "피드백 표에서 못 들은 표현 다시 듣기"] }
    ],
    questions: [
      { std: "What's the purpose of your visit?", au: "Here on holiday, yeah?", pron: "히어론 할러데이, 예?", ko: "휴가로 오신 거죠?", ans: "Yeah, just a holiday. Sydney and then Melbourne.", stage: 1 },
      { std: "How long are you staying in Australia?", au: "How long ya here for?", pron: "하울롱 야 히어퍼?", ko: "얼마나 머물러요?", ans: "About twelve days. We fly out on the 11th.", stage: 1 },
      { std: "Where will you be staying?", au: "Where're ya stayin'?", pron: "웨어러 야 스테인?", ko: "어디서 묵어요?", ans: "A hotel in the CBD, then one in Melbourne.", stage: 1 },
      { std: "Do you have anything to declare?", au: "Anythin' to declare? Any food on ya?", pron: "에니띵 터 디클레어? 에니 푸돈야?", ko: "신고할 것 있어요? 음식 있어요?", ans: "Yes, we've got some snacks. I ticked \"yes\" on the card.", stage: 3 },
      { std: "Are you carrying any meat, dairy or fruit?", au: "Got any meat, dairy, fresh fruit in there?", pron: "갓에니 밋, 데어리, 프레쉬 프룻 인데어?", ko: "고기·유제품·과일 있어요?", ans: "No fresh food, just packaged snacks and instant noodles.", stage: 3 },
      { std: "Are you two travelling together?", au: "You two together?", pron: "유 투 터게더?", ko: "두 분 일행이에요?", ans: "Yes, we're together.", stage: 1 },
      { std: "Is this your first time in Australia?", au: "First time in Oz? Been here before?", pron: "퍼스타임 인 오즈? 빈 히어 비포?", ko: "호주 처음이에요?", ans: "First time, actually. Really looking forward to it.", stage: 1 },
      { std: "Did you pack your bags yourself?", au: "Pack 'em yourself?", pron: "팩컴 여셀프?", ko: "짐 직접 쌌어요?", ans: "Yes, I packed them myself.", stage: 3 },
      { std: "Are you carrying any medication?", au: "Carryin' any meds?", pron: "캐린 에니 메즈?", ko: "약 갖고 있어요?", ans: "Just some personal meds, cold medicine and painkillers.", stage: 3 },
      { std: "Could you put your bag on the belt, please?", au: "Just pop it up on the belt for us.", pron: "저슷 팝 잇업 온더 벨트 퍼러스", ko: "가방을 벨트 위에 올려주세요", ans: "Sure. Do you need me to open it?", stage: 4 }
    ],
    phrases: [
      { en: "We're here for about twelve days. Sydney first, then Melbourne.", ko: "12일 정도 있어요. 시드니 먼저 가고 멜버른 가요.", alt: "We're spending five nights in Sydney and the rest in Melbourne.", when: "체류 기간·일정 질문" },
      { en: "I'm not sure if this counts, so I declared it just in case.", ko: "해당되는지 몰라서 혹시 몰라 신고했어요.", alt: "I wasn't sure about this one, could you check it for me?", when: "음식물 신고 시" },
      { en: "Sorry, could you say that again? I didn't quite catch it.", ko: "죄송한데 다시 말해주시겠어요? 잘 못 들었어요.", alt: "Sorry, did you say \"meds\" or \"meat\"?", when: "빠른 질문 못 알아들었을 때" }
    ],
    surprises: [
      { sit: "수하물이 안 나옴", them: "Looks like your bag didn't make the connection. Fill this out and we'll courier it to your hotel.", me: "Okay. How long does it usually take? Can I get a reference number so I can track it?" },
      { sit: "신고한 음식 검사·폐기", them: "Sorry mate, that one's gotta go in the bin. Can't bring that in.", me: "No worries. Is everything else okay?" }
    ],
    info: [
      { k: "ETA(전자여행허가)", v: "한국 여권 소지자는 ETA(subclass 601) 필요, 'Australian ETA' 앱으로 신청", note: "출발 전 승인 여부 반드시 확인", check: true },
      { k: "입국신고서", v: "기내 배포 Incoming Passenger Card 작성, 음식·약품 해당 시 \"Yes\" 체크", note: "디지털 신고(ATD)로 전환 중일 수 있음, 확인 필요" },
      { k: "음식물 신고", v: "호주는 검역이 매우 엄격함. 애매하면 무조건 신고해야 하고, 신고만 하면 대부분 문제없음. 미신고 적발 시 벌금", note: "벌금 액수는 확인 필요" },
      { k: "SmartGate", v: "ePassport 소지자는 자동출입국 게이트 이용 가능", note: "연령 조건 확인 필요" },
      { k: "면세 한도", v: "1인 약 AUD 900, 주류 2.25L, 담배 25개비", note: "확인 필요" },
      { k: "현금", v: "AUD 10,000 이상(상당액)은 신고 대상", note: "" },
      { k: "시드니 공항 → 시내", v: "Airport Link 기차(Opal·컨택리스 카드), 공항역은 추가 요금(Station Access Fee) 있음", note: "요금 확인 필요" }
    ],
    listening: [
      { use: "1일차 듣기 ①", q: "Border Security Australia's Front Line Sydney airport" },
      { use: "1일차 듣기 ②", q: "Australia airport arrival customs declare food" },
      { use: "자투리 흘려듣기", q: "Sydney airport arrival vlog first time Australia" }
    ],
    flowTitle: "입국 흐름도",
    flow: [
      { n: "0", title: "착륙", en: "Landing", desc: "기내에서 입국신고서(IPC) 작성", qs: [] },
      { n: "1", title: "입국심사", en: "Passport Control", desc: "SmartGate(자동) 또는 유인 카운터", qs: [1, 2, 3, 6, 7] },
      { n: "2", title: "수하물 찾기", en: "Baggage Claim", desc: "짐이 안 나오면 Baggage Services로", warn: "돌발 ① 수하물 미도착", qs: [] },
      { n: "3", title: "세관·검역", en: "Customs / Biosecurity", desc: "신고서 확인 후 레인 배정 (신고 없음 → 바로 출구)", qs: [4, 5, 8, 9] },
      { n: "4", title: "X-ray·검사", en: "Inspection", desc: "신고 있음 → 가방 검사", warn: "돌발 ② 반입 불가 시 폐기", qs: [10] },
      { n: "🚪", title: "출구", en: "Arrivals Hall", desc: "기차(Airport Link)·택시로 시내 이동", qs: [] }
    ],
    treeTitle: "음식물 신고 판단",
    tree: {
      q: "음식 가지고 있나?",
      branches: [
        { a: "없음", result: "IPC \"No\"", tone: "ok" },
        { a: "있음", q: "고기·유제품·계란·생과일·씨앗 포함?", branches: [
          { a: "예", result: "신고 + 검사 (반입 불가 가능성 높음)", tone: "warn" },
          { a: "아니오 (과자·라면·포장식품)", result: "그래도 IPC \"Yes\" + 신고 ✅ (신고하면 대부분 통과)", tone: "ok" }
        ] }
      ],
      tip: "라면 스프에 고기 성분이 들어 있을 수 있으니 무조건 신고하는 쪽이 안전합니다."
    },
    linking: [
      { said: "How long ya here for?", parts: [["How", ""], ["long", ""], ["are you", "drop"], ["→ ya", "chg"], ["here", ""], ["for", ""]], change: "are you → ya (축약)", heard: "하울롱 · 야 · 히어퍼" },
      { said: "Anythin' to declare?", parts: [["anything", ""], ["→ anythin'", "chg"], ["to", ""], ["declare", ""]], change: "-ing → -in' (g 탈락)", heard: "에니띤 · 터 · 디클레어" },
      { said: "Got any food on ya?", parts: [["Have you", "drop"], ["got", ""], ["any", ""], ["food", ""], ["on", ""], ["you", "drop"], ["→ ya", "chg"]], change: "주어·조동사 생략, you → ya", heard: "갓에니 · 푸돈야" },
      { said: "Pack 'em yourself?", parts: [["Did you", "drop"], ["pack", ""], ["them", "drop"], ["→ 'em", "chg"], ["yourself", ""]], change: "앞부분 통째로 생략, them → 'em", heard: "팩컴 · 여셀프" },
      { said: "Pop it up on the belt for us.", parts: [["pop", ""], ["it", ""], ["up", ""], ["on", ""], ["the", ""], ["belt", ""]], change: "t가 ㄹ처럼 약화 (flap t)", heard: "파삐럽 · 온더 · 벨트" },
      { said: "Carryin' any meds?", parts: [["Are you", "drop"], ["carrying", ""], ["any", ""], ["medication", "drop"], ["→ meds", "chg"]], change: "생략 + 단어 축약 (meds)", heard: "캐린 · 에니 · 메즈" }
    ],
    linkingTip: "문장 앞부분(Are you / Did you / Have you)은 거의 들리지 않으므로 문장 끝의 핵심 단어에 집중하세요.",
    vowels: [
      { word: "day / stay", us: "데이", au: "다이 / 스타이", ex: "Where ya stayin'?" },
      { word: "mate", us: "메잇", au: "마잇", ex: "Cheers, mate." },
      { word: "no / go", us: "노우", au: "나우", ex: "No worries." },
      { word: "here / for", us: "히얼 / 포얼", au: "히어 / 퍼 (r 없음)", ex: "How long ya here for?" },
      { word: "today", us: "투데이", au: "터다이", ex: "Flyin' in today?" },
      { word: "meat ↔ meds", us: "밋 / 메즈", au: "둘 다 짧게 들려 헷갈림", ex: "Meat or meds?" }
    ],
    answerFormula: {
      title: "즉답 공식",
      parts: [["핵심 답", "Holiday."], ["보충 1개", "Sydney, then Melbourne."], ["(선택) 확인", "Is that okay?"]],
      example: { q: "How long ya here for?", a: "About twelve days. We fly out on the 11th." },
      tip: "짧게 답하되 정보 1개를 덧붙이면 추가 질문이 줄어듭니다."
    },
    roleplay: `지금부터 너는 시드니 공항의 호주 입국심사관(ABF officer)이고, 이어서 세관·검역 직원(Biosecurity officer) 역할도 맡아.
나는 OPIc IH 수준이지만 오랜만에 영어를 써서 반응이 느린 상태고, 호주 악센트 알아듣기가 약해.

[상황 설정]
- 일정: 2026-10-31 시드니 도착, 11-11 멜버른 출국, 성인 2명 (나 + 동행 1명)
- 숙소: 시드니 CBD 호텔 → 멜버른 호텔
- 짐: 포장 과자, 컵라면(스프에 고기 성분 가능), 감기약·진통제
- 입국신고서에는 음식 "Yes" 체크함

[진행 순서]
1단계 입국심사: 방문 목적·기간·숙소·일행·방문 경험·직업 중 4~5개를 골라 물어봐
2단계 세관·검역: 신고 물품 확인 → 음식·약 세부 질문 → 가방 검사 요청
3단계 돌발 상황: 아래 중 1개를 무작위로 넣어줘
  - 컵라면 일부 폐기 요청
  - 수하물 미도착으로 Baggage Services 안내
  - 귀국 항공권 확인 요청

[말하기 규칙]
- 호주 원어민처럼 실제 속도로, 축약·생략(ya, 'em, anythin', Are you 생략 등)을 섞어서 말해
- 한 번에 한두 문장만 말하고 내 답을 기다려
- 내가 되물으면 처음엔 같은 속도로 다시 말하고, 두 번째에만 천천히 말해줘
- 내 답이 너무 짧거나 애매하면 실제 심사관처럼 추가 질문을 해

[종료 후 한국어로 표 정리]
1) 내가 못 알아들은 표현 | 실제 발화 | 들리는 발음
2) 내 답변 | 더 자연스러운 표현
3) 반응이 늦었던 질문 | 바로 쓸 수 있는 즉답 표현
4) 오늘 점수: 질문 이해율(이해한 질문 수/전체), 평균 반응 속도 평가(빠름·보통·느림)

"Next please!"로 시작해줘.`
  }
};

// ---------- 롤플레이 프롬프트 공통 틀 ----------
function makeRoleplay(o) {
  return `지금부터 너는 ${o.role} 역할이야.
나는 OPIc IH 수준이지만 오랜만에 영어를 써서 반응이 느린 상태고, 호주 악센트 알아듣기가 약해.

[상황 설정]
${o.setting.map((x) => "- " + x).join("\n")}

[진행 순서]
${o.steps.map((x, i) => `${i + 1}단계 ${x}`).join("\n")}
${o.steps.length + 1}단계 돌발 상황: 아래 중 1개를 무작위로 넣어줘
${o.surprises.map((x) => "  - " + x).join("\n")}

[말하기 규칙]
- 호주 원어민처럼 실제 속도로, 축약·생략·호주식 표현(${o.slang})을 섞어서 말해
- 한 번에 한두 문장만 말하고 내 답을 기다려
- 내가 되물으면 처음엔 같은 속도로 다시 말하고, 두 번째에만 천천히 말해줘
- 내 답이 너무 짧거나 애매하면 실제 직원처럼 추가 질문을 해

[종료 후 한국어로 표 정리]
1) 내가 못 알아들은 표현 | 실제 발화 | 들리는 발음
2) 내 답변 | 더 자연스러운 표현
3) 반응이 늦었던 질문 | 바로 쓸 수 있는 즉답 표현
4) 오늘 점수: 질문 이해율(이해한 질문 수/전체), 평균 반응 속도 평가(빠름·보통·느림)

"${o.start}"로 시작해줘.`;
}
const twoDays = (d1, d2) => [
  { date: d1, label: "1일차 · 듣기·표현", todo: ["A 예상 질문 10개 듣기 카드", "B·C 표현 소리 내 따라 읽기", "그림 탭 훑기", "E 유튜브 듣기 1개"] },
  { date: d2, label: "2일차 · 롤플레이", todo: ["못 들은 카드만 복습", "롤플레이 프롬프트로 AI 음성 대화", "피드백 표의 못 들은 표현 다시 듣기"] }
];

// ===================== 호텔 =====================
window.SITUATIONS.hotel = {
  title: "호텔", icon: "🏨", days: twoDays("10/16", "10/17"),
  questions: [
    { std: "Can I get the name on the reservation?", au: "Name on the booking?", pron: "네임 온더 부킹?", ko: "예약자 성함이요?", ans: "It's under Kim. K-I-M.", stage: 1 },
    { std: "May I see your passport and a credit card for incidentals?", au: "Just need ya passport and a card for incidentals.", pron: "저슷 니쟈 패스포트 앤어 카드 퍼 인시덴틀즈", ko: "여권이랑 부대비용용 카드 주세요", ans: "Sure, here you go. How much is the hold?", stage: 2 },
    { std: "There will be a pre-authorisation of $200, released at check-out.", au: "There'll be a two-hundred-dollar hold, comes off when ya check out.", pron: "데얼비 어 투헌드렛 달러 홀드, 컴즈오프 웬야 체카웃", ko: "200달러 홀드 걸리고 체크아웃 때 풀려요", ans: "Okay. How long does it take to be released?", stage: 2 },
    { std: "I'm sorry, your room isn't ready yet. It should be ready by 2.", au: "Room's not quite ready yet, sorry — should be right by two.", pron: "룸즈 낫 콰잇 레디 옛, 소리 — 슈비 라잇 바이 투", ko: "방이 아직 준비 안 됐어요, 2시면 될 거예요", ans: "No worries. Could we leave our bags here till then?", stage: 3 },
    { std: "Would you like us to store your luggage?", au: "Want us to hang onto ya bags?", pron: "원어스 투 행온투 야 백즈?", ko: "짐 맡아드릴까요?", ans: "That'd be great, thanks. Do I need a ticket for them?", stage: 3 },
    { std: "Breakfast is served from 6:30 to 10:30 on level 2.", au: "Brekkie's from six-thirty till ten-thirty, level two.", pron: "브레키즈 프롬 식스떠리 틸 텐떠리, 레블 투", ko: "조식은 6:30~10:30, 2층이에요", ans: "Is breakfast included in our rate?", stage: 4 },
    { std: "Is there anything else I can help you with?", au: "Anything else I can do for ya?", pron: "에니띵 엘스 아이캔 두 퍼야?", ko: "더 도와드릴 거 있어요?", ans: "Actually, what's the Wi-Fi password?", stage: 4 },
    { std: "Would you like your room cleaned tomorrow?", au: "D'ya want the room serviced tomorrow?", pron: "쟈 원더 룸 서비스트 터모로?", ko: "내일 객실 청소 원하세요?", ans: "Yes please, but after ten if possible.", stage: 5 },
    { std: "How would you like to settle the bill?", au: "How'd ya like to settle up?", pron: "하우쟈 라익 투 세를럽?", ko: "결제 어떻게 하시겠어요?", ans: "On the card I gave you at check-in, please.", stage: 6 },
    { std: "Did you take anything from the minibar?", au: "Anythin' from the minibar?", pron: "에니띤 프롬 더 미니바?", ko: "미니바 이용하셨어요?", ans: "Nothing from the minibar, thanks.", stage: 6 }
  ],
  phrases: [
    { en: "Hi, we've got a booking under Kim, checking in for five nights.", ko: "김으로 예약했고 5박 체크인이요.", alt: "We booked through Agoda — here's the confirmation.", when: "체크인 시작" },
    { en: "Sorry to bother you, but the air con in our room isn't working.", ko: "번거롭게 해서 죄송한데 방 에어컨이 안 돼요.", alt: "Sorry to bother you, but there's no hot water in the shower.", when: "방 문제 요청" },
    { en: "Would it be possible to get a late checkout, say around one?", ko: "1시쯤 레이트 체크아웃 가능할까요?", alt: "Could we leave our bags here after checkout?", when: "체크아웃 전날" }
  ],
  surprises: [
    { sit: "예약이 없다고 함", them: "Hmm, I'm not seeing anything under that name.", me: "Could you try my first name, or this confirmation number? I booked through Booking.com." },
    { sit: "예약과 다른 침대", them: "We've only got a queen left tonight, sorry.", me: "We actually booked twin beds. Is there any chance you could check again, or move us tomorrow?" }
  ],
  info: [
    { k: "보증금(Bond / Pre-authorisation)", v: "체크인 시 카드에 1박당 일정액 홀드. 체크아웃 후 해제까지 며칠 걸릴 수 있음", note: "금액·해제 기간 호텔별 확인 필요" },
    { k: "체크인·아웃 시간", v: "보통 체크인 14~15시, 체크아웃 10~11시", note: "호텔별 확인 필요" },
    { k: "팁", v: "팁 문화 없음. 포터·하우스키핑 팁은 선택", note: "" },
    { k: "전기 플러그", v: "230V, Type I(八자형 3핀) — 한국 플러그 사용 불가, 어댑터 필수", note: "" },
    { k: "수돗물", v: "호텔 수돗물 음용 가능", note: "" },
    { k: "날씨", v: "10~11월은 봄. 멜버른은 하루에도 날씨가 크게 변함(four seasons in one day) → 겉옷 필수", note: "" },
    { k: "표현", v: "에어컨 = air con, 수건 추가 = extra towels, 객실 청소 = housekeeping / room service(청소)", note: "" }
  ],
  listening: [
    { use: "1일차 듣기 ①", q: "hotel check in conversation English real" },
    { use: "1일차 듣기 ②", q: "Australian hotel reception check in" },
    { use: "자투리 흘려듣기", q: "Melbourne hotel room tour vlog" }
  ],
  flowTitle: "호텔 이용 흐름",
  flow: [
    { n: "1", title: "예약 확인", en: "Reservation", desc: "예약자 이름·확인번호 제시", warn: "돌발 ① 예약이 없다고 함", qs: [1] },
    { n: "2", title: "여권·카드", en: "ID & Card", desc: "부대비용용 카드 홀드", qs: [2, 3] },
    { n: "3", title: "방 준비·짐", en: "Room & Luggage", desc: "이른 도착이면 짐 맡기기", warn: "돌발 ② 다른 침대 타입", qs: [4, 5] },
    { n: "4", title: "안내", en: "Info", desc: "조식·와이파이·시설 안내", qs: [6, 7] },
    { n: "5", title: "숙박 중", en: "During Stay", desc: "청소·문제 요청", qs: [8] },
    { n: "6", title: "체크아웃", en: "Check-out", desc: "결제·미니바 확인", qs: [9, 10] }
  ],
  treeTitle: "방에 문제가 있을 때",
  tree: {
    q: "급한 문제인가? (물·전기·문 잠금·소음)",
    branches: [
      { a: "예", result: "프런트 전화: \"Could you send someone up to have a look?\"", tone: "warn" },
      { a: "아니오", q: "방을 바꾸고 싶을 정도?", branches: [
        { a: "예", result: "\"Would it be possible to move rooms?\"", tone: "warn" },
        { a: "아니오", result: "\"Could we get some extra towels / pillows?\"", tone: "ok" }
      ] }
    ],
    tip: "Sorry to bother you, but ... 로 시작하면 정중하면서 자연스럽습니다."
  },
  linking: [
    { said: "Want us to hang onto ya bags?", parts: [["Do you", "drop"], ["want", ""], ["us", ""], ["to", ""], ["hang", ""], ["onto", ""], ["your", "drop"], ["→ ya", "chg"], ["bags", ""]], change: "Do you 생략, your → ya", heard: "원어스 · 행온투 · 야 백즈" },
    { said: "Brekkie's from six-thirty.", parts: [["breakfast", "drop"], ["→ brekkie", "chg"], ["is", "drop"], ["→ 's", "chg"], ["from", ""], ["six-thirty", ""]], change: "breakfast → brekkie (호주식 줄임말)", heard: "브레키즈 · 프롬 · 식스떠리" },
    { said: "How'd ya like to settle up?", parts: [["How would you", "drop"], ["→ How'd ya", "chg"], ["like", ""], ["to", ""], ["settle up", ""]], change: "would you → 'd ya, settle의 t가 ㄹ처럼", heard: "하우쟈 · 라익투 · 세를럽" },
    { said: "Should be right by two.", parts: [["It", "drop"], ["should", ""], ["be", ""], ["right", ""], ["by", ""], ["two", ""]], change: "주어 생략, right = 괜찮다/준비된다 (호주식)", heard: "슈비 · 라잇 · 바이투" }
  ],
  linkingTip: "호주는 단어를 -ie/-o로 줄이는 습관이 강합니다 (breakfast → brekkie, afternoon → arvo).",
  answerFormula: {
    title: "요청 공식",
    parts: [["쿠션", "Sorry to bother you,"], ["문제", "the air con isn't working."], ["요청", "Could you send someone up?"]],
    example: { q: "Anything else I can do for ya?", a: "Actually, could we get a couple of extra towels?" },
    tip: "문제만 말하지 말고 원하는 해결책을 함께 말하면 한 번에 처리됩니다."
  },
  roleplay: makeRoleplay({
    role: "시드니 CBD 호텔의 호주인 프런트 직원(receptionist)",
    setting: ["성인 2명, 5박 예약 (예약자 Kim, Booking.com 예약)", "오후 12시 도착 → 방 준비 전", "다음 날 방 에어컨 고장, 마지막 날 레이트 체크아웃 희망"],
    steps: ["체크인: 예약 확인 → 여권·카드 → 보증금 홀드 안내", "방 미준비: 짐 보관 → 조식·와이파이 안내", "숙박 중 전화: 방 문제(에어컨) 요청", "체크아웃: 결제·미니바·레이트 체크아웃"],
    surprises: ["예약이 시스템에 없다고 함", "트윈 대신 퀸 침대만 남았다고 함", "보증금 홀드가 예상보다 큼"],
    slang: "brekkie, should be right, no worries, hang onto",
    start: "G'day, checking in?"
  })
};

// ===================== 식당·카페 =====================
window.SITUATIONS.food = {
  title: "식당·카페", icon: "☕", days: twoDays("10/18", "10/19"),
  questions: [
    { std: "What can I get for you?", au: "What can I getcha?", pron: "왓 캐나이 게챠?", ko: "뭐 드릴까요?", ans: "Can I grab a flat white and a long black, please?", stage: 1 },
    { std: "What kind of milk would you like?", au: "Any milk preference? Full cream, skim, oat?", pron: "에니 밀크 프레퍼런스? 풀크림, 스킴, 오웃?", ko: "우유 뭘로 하실래요?", ans: "Oat, please.", stage: 1 },
    { std: "Are you eating in or taking it away?", au: "Havin' it here or takeaway?", pron: "해빈잇 히어 오어 테이커웨이?", ko: "드시고 가세요, 가져가세요?", ans: "Having it here, thanks.", stage: 1 },
    { std: "You can pay by card whenever you're ready.", au: "Just tap whenever you're ready.", pron: "저슷 탭 웬에버 유어 레디", ko: "준비되면 카드 대세요", ans: "(카드 탭) Thanks.", stage: 2 },
    { std: "What name should I put on the order?", au: "Name for the order?", pron: "네임 퍼디 오더?", ko: "주문자 이름이요?", ans: "Kim. K-I-M.", stage: 2 },
    { std: "Do you have a reservation?", au: "Got a booking, guys?", pron: "갓어 부킹, 가이즈?", ko: "예약하셨어요?", ans: "No, we don't. Table for two, if you've got one?", stage: 3 },
    { std: "There's about a twenty-minute wait. Is that okay?", au: "It's about a twenty-minute wait, that alright?", pron: "잇서바웃 어 트웨니 미닛 웨잇, 댓 올라잇?", ko: "20분 정도 기다려야 하는데 괜찮아요?", ans: "That's fine. Can we wait at the bar?", stage: 3 },
    { std: "Are you ready to order?", au: "You guys right to order?", pron: "유 가이즈 라잇 투 오더?", ko: "주문하시겠어요?", ans: "Could we have a couple more minutes?", stage: 4 },
    { std: "How is everything?", au: "How's everything goin'? All good?", pron: "하우즈 에브리띵 고인? 올 굿?", ko: "음식 괜찮으세요?", ans: "Really good, thanks. Could we get some more water?", stage: 4 },
    { std: "Please note there is a 10% surcharge on Sundays.", au: "Just so ya know, there's a ten percent surcharge today.", pron: "저슷소야노우, 데어저 텐퍼센 서차지 터다이", ko: "오늘은 10% 추가 요금이 있어요", ans: "Oh okay, no worries.", stage: 5 }
  ],
  phrases: [
    { en: "Can I grab a flat white with oat milk, please?", ko: "오트밀크 플랫화이트 하나 주세요.", alt: "Could I get a long black, extra hot?", when: "카페 주문 (Can I grab = 호주에서 흔한 주문 표현)" },
    { en: "What would you recommend? We're happy to share a couple of dishes.", ko: "추천해 주실래요? 두어 개 나눠 먹으려고요.", alt: "Is this one big enough for two?", when: "메뉴 고를 때" },
    { en: "Do we pay here or at the counter? Could we split it?", ko: "여기서 계산해요, 카운터에서 해요? 나눠서 낼 수 있어요?", alt: "Could we get the bill, please?", when: "계산할 때" }
  ],
  surprises: [
    { sit: "메뉴 품절", them: "Sorry, we've just run out of the barra.", me: "Ah, no worries. What would you suggest instead?" },
    { sit: "카드 결제 거절", them: "Card's been declined, sorry. Wanna try again?", me: "That's strange. Let me try tapping again — otherwise I'll use another card." }
  ],
  info: [
    { k: "커피 메뉴", v: "flat white(라떼보다 우유 적고 진함), long black(아메리카노보다 진함), short black(에스프레소), magic(멜버른식, 더블 리스트레토 + 우유)", note: "" },
    { k: "팁", v: "의무 아님. 서비스가 좋으면 10% 정도 선택", note: "" },
    { k: "주말·공휴일 추가요금", v: "일요일·공휴일 surcharge 10~15% 흔함 (메뉴 하단 표기)", note: "식당별 확인 필요" },
    { k: "카드 수수료", v: "카드 결제 시 1~2% card surcharge 붙는 곳 있음", note: "확인 필요" },
    { k: "카페 주문 방식", v: "카운터에서 주문·선결제 → 번호표/이름 → 자리로 가져다줌", note: "" },
    { k: "BYO", v: "주류 반입 가능한 식당 (corkage 요금 있을 수 있음)", note: "" },
    { k: "물", v: "tap water(수돗물) 무료 요청 가능", note: "" }
  ],
  listening: [
    { use: "1일차 듣기 ①", q: "ordering coffee in Australia flat white long black" },
    { use: "1일차 듣기 ②", q: "Australian restaurant waiter conversation" },
    { use: "자투리 흘려듣기", q: "Melbourne cafe brunch vlog" }
  ],
  flowTitle: "카페·식당 흐름",
  flow: [
    { n: "☕", title: "카페 주문", en: "Order", desc: "메뉴 → 우유 → 매장/포장", qs: [1, 2, 3] },
    { n: "💳", title: "결제·이름", en: "Pay", desc: "카운터 선결제, 이름·번호표", warn: "돌발 ② 카드 거절", qs: [4, 5] },
    { n: "🍽", title: "식당 입장", en: "Seating", desc: "예약 여부 → 대기", qs: [6, 7] },
    { n: "📝", title: "주문·식사", en: "Order & Eat", desc: "주문, 중간 체크", warn: "돌발 ① 품절", qs: [8, 9] },
    { n: "🧾", title: "계산", en: "Bill", desc: "추가요금 안내 확인", qs: [10] }
  ],
  treeTitle: "커피 고르기",
  tree: {
    q: "우유 넣을래?",
    branches: [
      { a: "예", q: "진하게?", branches: [
        { a: "진하게", result: "flat white (멜버른이면 magic)", tone: "ok" },
        { a: "부드럽게", result: "latte / cappuccino", tone: "ok" }
      ] },
      { a: "아니오", q: "양은?", branches: [
        { a: "많이", result: "long black (아메리카노 대신)", tone: "ok" },
        { a: "한 샷", result: "short black (에스프레소)", tone: "ok" }
      ] }
    ],
    tip: "호주 카페에는 'Americano'가 없는 곳도 많습니다. long black이 가장 가깝습니다."
  },
  linking: [
    { said: "What can I getcha?", parts: [["What", ""], ["can", ""], ["I", ""], ["get you", "drop"], ["→ getcha", "chg"]], change: "get you → getcha (t+y = 차)", heard: "왓 캐나이 · 게챠" },
    { said: "You guys right to order?", parts: [["Are", "drop"], ["you guys", ""], ["right", ""], ["to", ""], ["order", ""]], change: "Are 생략, right = ready (호주식)", heard: "유가이즈 · 라잇투 · 오더" },
    { said: "Havin' it here or takeaway?", parts: [["Are you", "drop"], ["having", ""], ["→ havin'", "chg"], ["it", ""], ["here", ""], ["or", ""], ["takeaway", ""]], change: "Are you 생략, -ing → -in'", heard: "해빈잇 · 히어 · 오어 · 테이커웨이" },
    { said: "How's everything goin'?", parts: [["How", ""], ["is", "drop"], ["→ 's", "chg"], ["everything", ""], ["going", ""], ["→ goin'", "chg"]], change: "is → 's, going → goin'", heard: "하우즈 · 에브리띵 · 고인" }
  ],
  linkingTip: "호주에서 'You right?'는 '도와드릴까요? / 괜찮으세요?' 뜻입니다. right = ready / okay.",
  answerFormula: {
    title: "주문 공식",
    parts: [["시작", "Can I grab"], ["메뉴", "a flat white"], ["옵션", "with oat milk"], ["마무리", "please?"]],
    example: { q: "What can I getcha?", a: "Can I grab a long black, extra hot, please?" },
    tip: "Can I get / Can I grab 둘 다 자연스럽습니다. 옵션은 with ~ 로 뒤에 붙이세요."
  },
  roleplay: makeRoleplay({
    role: "멜버른 카페 바리스타, 이어서 시드니 레스토랑 서버(waiter)",
    setting: ["성인 2명, 카페는 아침, 레스토랑은 일요일 저녁 (예약 없음)", "커피 2잔 주문 (우유 옵션 포함)", "레스토랑에서 메뉴 추천받고 나눠 먹을 예정"],
    steps: ["카페: 주문 → 우유 옵션 → 매장/포장 → 결제 → 이름", "레스토랑 입장: 예약 여부 → 대기 시간", "주문·식사: 추천 요청 → 중간 체크", "계산: 일요일 추가 요금 안내 → 결제"],
    surprises: ["주문한 메뉴 품절", "카드 결제 거절", "주문과 다른 음식이 나옴"],
    slang: "getcha, you right, no worries, arvo",
    start: "Morning! What can I getcha?"
  })
};

// ===================== 교통·길찾기·투어 =====================
window.SITUATIONS.transport = {
  title: "교통·길찾기·투어", icon: "🚋", days: twoDays("10/20", "10/21"),
  questions: [
    { std: "Please tap your card on the reader.", au: "Just tap on, mate.", pron: "저슷 탭폰, 마잇", ko: "카드 찍으세요(승차 태그)", ans: "(탭) Cheers. Does this go to Circular Quay?", stage: 1 },
    { std: "We don't accept cash on this bus.", au: "No cash on the bus, sorry — card or Opal only.", pron: "노우 캐시 온더 버스, 소리 — 카드 오어 오팔 온리", ko: "버스는 현금 안 받아요, 카드나 Opal만", ans: "Can I just tap my credit card?", stage: 1 },
    { std: "Where are you going?", au: "Where ya headed?", pron: "웨어 야 헤디드?", ko: "어디 가세요?", ans: "Bondi Beach. Is this the right bus?", stage: 2 },
    { std: "You should get off at the next stop.", au: "You'll wanna jump off at the next stop.", pron: "율 워나 점포프 앳더 넥스땁", ko: "다음 정류장에서 내리세요", ans: "Thanks! Do I need to press the button?", stage: 2 },
    { std: "It's a ten-minute walk. Go straight and turn left at the traffic lights.", au: "It's ten minutes' walk — head straight down and chuck a left at the lights.", pron: "...헤드 스트레잇 다운 앤 척어 레프트 앳더 라잇츠", ko: "10분 거리예요, 쭉 가다 신호등에서 좌회전", ans: "Left at the lights. Got it, thanks.", stage: 3 },
    { std: "You don't need to tap in the Free Tram Zone.", au: "Ya don't need to touch on in the free zone.", pron: "야 돈 니투 터촌 인더 프리 조운", ko: "무료 구역에선 태그 안 해도 돼요", ans: "Oh great. Where does the free zone end?", stage: 1 },
    { std: "Are you checking any bags today?", au: "Checkin' any bags today?", pron: "체킨 에니 백즈 터다이?", ko: "오늘 부칠 짐 있어요?", ans: "Yes, two bags, one each.", stage: 4 },
    { std: "This bag is overweight. It's twenty-six kilograms.", au: "This one's a bit over — twenty-six kilos.", pron: "디스원저 빗 오버 — 트웨니식스 킬로즈", ko: "이 짐 무게 초과예요, 26kg", ans: "Ah, can I move a few things into my carry-on?", stage: 4 },
    { std: "Please be back at the bus at three o'clock sharp.", au: "Back on the bus at three on the dot, yeah?", pron: "백온더 버스 앳 쓰리 온더 닷, 예?", ko: "3시 정각에 버스로 돌아오세요", ans: "Three o'clock, got it. Where's the bus parked?", stage: 5 },
    { std: "This train terminates here. All passengers must change.", au: "This service terminates here, all change please.", pron: "디스 서비스 터미네잇츠 히어, 올 체인지 플리즈", ko: "이 열차는 여기서 종료, 모두 내리세요", ans: "(직원에게) Excuse me, how do I get to Central from here?", stage: 2 }
  ],
  phrases: [
    { en: "Sorry, is this the right platform for the train to the airport?", ko: "죄송한데 공항 가는 열차 이 플랫폼 맞아요?", alt: "Does this bus stop anywhere near the Opera House?", when: "탑승 전 확인" },
    { en: "Could you let me know when we get to Bondi Beach?", ko: "본다이 비치 도착하면 알려주실래요?", alt: "Could you tell me which stop to get off at?", when: "버스 기사에게" },
    { en: "We're on the nine o'clock tour — where's the meeting point?", ko: "9시 투어인데 집합 장소가 어디예요?", alt: "What time do we need to be back on the bus?", when: "투어 집합" }
  ],
  surprises: [
    { sit: "열차 운행 중단 (공사)", them: "No trains this weekend, there's trackwork. Buses are replacing trains out the front.", me: "Sorry, where exactly do I catch the replacement bus? Will it take much longer?" },
    { sit: "수하물 무게 초과", them: "That's gonna be an excess baggage fee, unless you can take some out.", me: "Let me move a few things into my carry-on. Can I re-weigh it?" }
  ],
  info: [
    { k: "시드니 Opal", v: "교통카드 없이 컨택리스 신용카드·모바일페이로 tap on/off 가능. 하루·주간 요금 상한(cap) 있음. 탭오프 안 하면 최대 요금", note: "요금·상한 금액 확인 필요" },
    { k: "멜버른 Myki", v: "Myki 카드 사용. 컨택리스 카드 결제 도입 진행 중", note: "도입 여부 확인 필요" },
    { k: "Free Tram Zone", v: "멜버른 CBD 내 트램 무료, 태그 불필요. 구역 밖으로 나가면 태그 필수", note: "" },
    { k: "시드니 → 멜버른", v: "국내선 약 1시간 30분. 수하물 마감 출발 30~45분 전. 저가항공(Jetstar 등)은 수하물 별도 구매·무게 엄격", note: "항공사별 확인 필요" },
    { k: "택시·앱", v: "Uber·DiDi 사용 가능, 택시도 카드 결제", note: "" },
    { k: "길 표현", v: "lights = 신호등, chuck a left/right = 좌/우회전, servo = 주유소, CBD = 도심", note: "" },
    { k: "공사", v: "주말 trackwork로 열차 대신 버스 운행 잦음 → 앱(TripView, PTV)으로 확인", note: "" }
  ],
  listening: [
    { use: "1일차 듣기 ①", q: "how to use Opal card Sydney contactless" },
    { use: "1일차 듣기 ②", q: "Melbourne free tram zone explained" },
    { use: "자투리 흘려듣기", q: "Sydney to Melbourne travel vlog" }
  ],
  flowTitle: "이동 흐름 (시드니 → 멜버른 포함)",
  flow: [
    { n: "🚌", title: "탑승·태그", en: "Tap on", desc: "카드·Opal 탭, 무료 구역 확인", qs: [1, 2, 6] },
    { n: "🗺", title: "이동·하차", en: "Ride", desc: "목적지 확인, 하차 안내", warn: "돌발 ① 운행 중단(trackwork)", qs: [3, 4, 10] },
    { n: "🚶", title: "길찾기", en: "Directions", desc: "현지인에게 길 묻기", qs: [5] },
    { n: "✈️", title: "국내선 체크인", en: "SYD → MEL", desc: "수하물 부치기", warn: "돌발 ② 무게 초과", qs: [7, 8] },
    { n: "🚐", title: "투어", en: "Day Tour", desc: "집합·복귀 시간", qs: [9] }
  ],
  treeTitle: "탭(tap) 해야 하나?",
  tree: {
    q: "어느 도시?",
    branches: [
      { a: "시드니", result: "Opal 또는 컨택리스 카드로 탈 때·내릴 때 둘 다 tap", tone: "warn" },
      { a: "멜버른", q: "Free Tram Zone 안에서만 트램?", branches: [
        { a: "예", result: "태그 불필요 (무료)", tone: "ok" },
        { a: "아니오 (구역 밖·버스·기차)", result: "Myki tap on (컨택리스 가능 여부 확인 필요)", tone: "warn" }
      ] }
    ],
    tip: "한 사람이 카드 하나만 사용하세요. 같은 카드로 두 명이 찍으면 안 됩니다."
  },
  linking: [
    { said: "Where ya headed?", parts: [["Where", ""], ["are you", "drop"], ["→ ya", "chg"], ["headed", ""]], change: "are you → ya", heard: "웨어야 · 헤디드" },
    { said: "You'll wanna jump off at the next stop.", parts: [["You'll", ""], ["want to", "drop"], ["→ wanna", "chg"], ["get off", "drop"], ["→ jump off", "chg"], ["at the", ""], ["next stop", ""]], change: "want to → wanna, get off → jump off", heard: "율워나 · 점포프 · 앳더넥스땁" },
    { said: "Chuck a left at the lights.", parts: [["turn", "drop"], ["→ chuck", "chg"], ["a left", ""], ["at the", ""], ["traffic lights", "drop"], ["→ lights", "chg"]], change: "turn → chuck (호주 구어)", heard: "척어 레프트 · 앳더 라잇츠" },
    { said: "Checkin' any bags today?", parts: [["Are you", "drop"], ["checking", ""], ["→ checkin'", "chg"], ["any", ""], ["bags", ""], ["today", ""], ["→ 터다이", "chg"]], change: "Are you 생략, today → 터다이", heard: "체킨 · 에니백즈 · 터다이" }
  ],
  linkingTip: "길 설명은 숫자·방향(left/right)·랜드마크(lights, corner)만 잡으면 됩니다. 놓치면 \"Left at the lights?\"처럼 복창하세요.",
  answerFormula: {
    title: "길 묻기 공식",
    parts: [["쿠션", "Sorry to bug you,"], ["목적지", "how do I get to Central?"], ["확인", "Is it walking distance?"]],
    example: { q: "Where ya headed?", a: "The Opera House. Is it walking distance from here?" },
    tip: "Sorry to bug you 는 Excuse me보다 부드럽고 호주에서 자주 씁니다."
  },
  roleplay: makeRoleplay({
    role: "시드니 버스 기사·길 가는 현지인, 이어서 국내선 체크인 직원, 투어 가이드",
    setting: ["시드니에서 Opal 대신 신용카드로 탑승", "본다이 비치 → 오페라하우스 이동", "시드니 → 멜버른 국내선 (짐 2개, 1개 무게 초과 가능)", "멜버른 그레이트 오션 로드 1일 투어"],
    steps: ["버스 탑승: 태그 → 목적지 확인 → 하차 안내", "길찾기: 현지인에게 길 묻기 (좌우·신호등)", "국내선 체크인: 수하물 → 좌석 → 탑승구", "투어: 집합 장소·복귀 시간 확인"],
    surprises: ["주말 공사로 열차 대신 대체 버스", "수하물 무게 초과", "투어 집합 장소 변경"],
    slang: "mate, chuck a left, jump off, on the dot",
    start: "G'day, where ya headed?"
  })
};

// ===================== 쇼핑·마트·환불 =====================
window.SITUATIONS.shopping = {
  title: "쇼핑·마트·환불", icon: "🛒", days: twoDays("10/22", "10/23"),
  questions: [
    { std: "Can I help you with anything?", au: "You right there?", pron: "유 라잇 데어?", ko: "도와드릴까요?", ans: "Just having a look, thanks.", stage: 1 },
    { std: "Do you have a loyalty card?", au: "Got a Flybuys or Everyday Rewards?", pron: "갓어 플라이바이즈 오어 에브리데이 리워즈?", ko: "포인트 카드 있어요?", ans: "No, I don't. Just this, thanks.", stage: 2 },
    { std: "Would you like to pay by credit or debit?", au: "Credit or savings?", pron: "크레딧 오어 세이빙즈?", ko: "신용이요, 예금(체크)이요?", ans: "Credit, please.", stage: 2 },
    { std: "Do you need a bag? They cost 15 cents.", au: "D'ya need a bag? They're fifteen cents.", pron: "쟈 니더 백? 데어 피프틴 센츠", ko: "봉투 필요해요? 15센트예요", ans: "No thanks, I've brought my own.", stage: 2 },
    { std: "Would you like the receipt?", au: "Want the receipt in the bag?", pron: "원더 리싯 인더 백?", ko: "영수증 봉투에 넣어드릴까요?", ans: "Yes please, I might need it for a refund.", stage: 2 },
    { std: "Is it a present? Would you like it gift-wrapped?", au: "Is it a pressie? Want it wrapped?", pron: "이짓 어 프레지? 원잇 랩트?", ko: "선물이에요? 포장해 드릴까요?", ans: "Yes, it's a gift. That'd be lovely.", stage: 3 },
    { std: "Please remove the item from the bagging area.", au: "Unexpected item in the bagging area.", pron: "언익스펙티드 아이럼 인더 배깅 에어리아", ko: "봉투 놓는 곳에 예상치 못한 물건이 있습니다", ans: "(직원에게) Sorry, could you give me a hand? It keeps saying unexpected item.", stage: 4 },
    { std: "Would you like a refund or an exchange?", au: "Are ya after a refund or a swap?", pron: "아야 애프터 어 리펀드 오어 어 스왑?", ko: "환불이에요, 교환이에요?", ans: "A refund, please. It doesn't fit.", stage: 5 },
    { std: "Do you have the receipt with you?", au: "Got the receipt on ya?", pron: "갓더 리싯 온야?", ko: "영수증 가지고 계세요?", ans: "Yes, here it is. I bought it on Monday.", stage: 5 },
    { std: "We can only offer store credit for that.", au: "We can only do store credit on that one, sorry.", pron: "위캔 온리 두 스토어 크레딧 온댓원, 소리", ko: "그건 적립금(스토어 크레딧)만 가능해요", ans: "Oh, I'm only here till next week. Is a refund to my card possible?", stage: 5 }
  ],
  phrases: [
    { en: "I'm after something for my mum — any ideas?", ko: "엄마 선물 찾는데 추천해 줄 만한 거 있어요?", alt: "I'm after some sunscreen — which aisle is it in?", when: "물건 찾을 때 (I'm after = ~을 찾고 있다, 호주식)" },
    { en: "Have you got this in a size up, or is this all you've got?", ko: "한 치수 큰 거 있어요, 이게 다예요?", alt: "Is this one on sale, or is that a different one?", when: "사이즈·가격 확인" },
    { en: "Could I get a tax invoice for this? I'd like to claim the TRS at the airport.", ko: "세금 영수증 받을 수 있을까요? 공항에서 TRS 환급하려고요.", alt: "Could you put both items on one invoice?", when: "TRS 영수증 요청" }
  ],
  surprises: [
    { sit: "진열 가격과 다름", them: "That's actually forty-nine ninety-five. The sale price was for the other one.", me: "Oh, the shelf said twenty-nine ninety-five. Could you double-check for me?" },
    { sit: "결제 됐는지 불확실", them: "Looks like it didn't go through. D'ya wanna try inserting it?", me: "Sure. Has it been charged though? I don't want to pay twice." }
  ],
  info: [
    { k: "TRS (세금 환급)", v: "출국 60일 이내, 한 사업자(같은 ABN)에서 AUD 300 이상(GST 포함) 구매 시 GST 환급. tax invoice 필요, 물건은 기내 휴대, 출국장 TRS 카운터에서 신청 (TRS 앱으로 사전 입력 가능)", note: "조건·마감 시간 확인 필요" },
    { k: "마트", v: "Woolworths(울리스), Coles, Aldi. 봉투 유료(장바구니 지참 권장)", note: "봉투 가격 확인 필요" },
    { k: "결제 질문", v: "\"Credit or savings?\" → 해외 카드는 Credit 선택", note: "" },
    { k: "약국 쇼핑", v: "Chemist Warehouse — 선물용 영양제·화장품 저렴", note: "" },
    { k: "가격 표기", v: "표시 가격에 GST(10%) 포함", note: "" },
    { k: "환불", v: "불량은 소비자법상 환불 가능, 단순 변심은 매장 정책에 따름 (store credit만 주는 곳 있음)", note: "매장별 확인 필요" },
    { k: "영업시간", v: "일요일·공휴일 단축. 11/3(화) Melbourne Cup Day는 멜버른 공휴일", note: "날짜·영업 여부 확인 필요" }
  ],
  listening: [
    { use: "1일차 듣기 ①", q: "Australian supermarket checkout conversation" },
    { use: "1일차 듣기 ②", q: "Tourist Refund Scheme Australia how to claim" },
    { use: "자투리 흘려듣기", q: "Woolworths grocery haul Australia" }
  ],
  flowTitle: "쇼핑 흐름 (TRS 포함)",
  flow: [
    { n: "🛍", title: "매장", en: "Browsing", desc: "직원 응대, 물건 찾기", qs: [1] },
    { n: "💳", title: "계산", en: "Checkout", desc: "포인트카드 → 결제 방식 → 봉투 → 영수증", warn: "돌발 ① 가격 다름 / ② 결제 오류", qs: [2, 3, 4, 5] },
    { n: "🎁", title: "선물 포장", en: "Gift wrap", desc: "", qs: [6] },
    { n: "🤖", title: "셀프 계산대", en: "Self-checkout", desc: "오류 시 직원 호출", qs: [7] },
    { n: "↩️", title: "환불·교환", en: "Returns", desc: "영수증 필수", qs: [8, 9, 10] },
    { n: "✈️", title: "출국 시 TRS", en: "Tax refund", desc: "tax invoice + 물건 지참 → 출국장 카운터", qs: [] }
  ],
  treeTitle: "TRS 환급 대상인가?",
  tree: {
    q: "한 매장(같은 사업자)에서 AUD 300 이상?",
    branches: [
      { a: "아니오", result: "대상 아님", tone: "warn" },
      { a: "예", q: "출국 60일 이내 구매 + tax invoice 있음?", branches: [
        { a: "아니오", result: "대상 아님 (매장에서 tax invoice 꼭 요청)", tone: "warn" },
        { a: "예", result: "물건 기내 휴대 → 출국장 TRS 카운터 ✅", tone: "ok" }
      ] }
    ],
    tip: "출국 당일 TRS 줄이 길 수 있어요. TRS 앱에 미리 입력해 두면 빠릅니다 (확인 필요)."
  },
  linking: [
    { said: "You right there?", parts: [["Are", "drop"], ["you", ""], ["right", ""], ["there", ""]], change: "Are 생략, right = 괜찮아요?/필요한 거 있어요?", heard: "유 라잇 · 데어" },
    { said: "Got the receipt on ya?", parts: [["Have you", "drop"], ["got", ""], ["the receipt", ""], ["on", ""], ["you", "drop"], ["→ ya", "chg"]], change: "Have you 생략, you → ya", heard: "갓더 리싯 · 온야" },
    { said: "Are ya after a refund or a swap?", parts: [["Are", ""], ["you", "drop"], ["→ ya", "chg"], ["looking for", "drop"], ["→ after", "chg"], ["a refund", ""], ["or", ""], ["an exchange", "drop"], ["→ a swap", "chg"]], change: "after = 원하다, swap = 교환", heard: "아야 애프터 · 어리펀드 · 오어 어스왑" },
    { said: "Is it a pressie?", parts: [["Is it a", ""], ["present", "drop"], ["→ pressie", "chg"]], change: "present → pressie (-ie 줄임말)", heard: "이짓어 · 프레지" }
  ],
  linkingTip: "\"Credit or savings?\"는 호주 계산대의 단골 질문입니다. 외국 카드는 Credit.",
  answerFormula: {
    title: "환불 공식",
    parts: [["요청", "I'd like to return this."], ["이유", "It doesn't fit."], ["증빙", "Here's the receipt."], ["방식", "Could I get a refund to my card?"]],
    example: { q: "Are ya after a refund or a swap?", a: "A refund, please — it doesn't fit. Here's the receipt." },
    tip: "이유 + 영수증을 먼저 말하면 추가 질문이 줄어듭니다."
  },
  roleplay: makeRoleplay({
    role: "시드니 쇼핑몰 의류 매장 직원, 이어서 Woolworths 계산원",
    setting: ["엄마 선물 + 내 옷 쇼핑 (총 AUD 350, TRS 대상)", "마트에서 간식·생수 구매, 장바구니 없음", "어제 산 셔츠가 작아서 환불하고 싶음"],
    steps: ["매장: 응대 → 사이즈·추천 → 선물 포장", "계산: 결제 방식 → tax invoice 요청", "마트: 포인트카드 → 봉투 → 결제", "환불: 이유 → 영수증 → 환불 방식"],
    surprises: ["진열 가격과 계산 가격이 다름", "store credit만 가능하다고 함", "결제가 됐는지 불확실"],
    slang: "you right, pressie, I'm after, credit or savings",
    start: "Hey, you right there?"
  })
};

// ===================== 비상 상황 =====================
window.SITUATIONS.emergency = {
  title: "비상 상황", icon: "💊", days: twoDays("10/24", "10/25"),
  questions: [
    { std: "What symptoms do you have?", au: "What's goin' on — what are ya symptoms?", pron: "왓츠 고인 온 — 왓아야 심텀즈?", ko: "증상이 어떠세요?", ans: "I've had a sore throat and a bit of a fever since last night.", stage: 1 },
    { std: "Are you taking any other medication?", au: "Are ya takin' anything else at the moment?", pron: "아야 테이킨 에니띵 엘스 앳더 모먼?", ko: "지금 드시는 다른 약 있어요?", ans: "No, nothing else.", stage: 1 },
    { std: "Do you have any allergies?", au: "Allergic to anything?", pron: "얼러직 투 에니띵?", ko: "알레르기 있어요?", ans: "Not that I know of.", stage: 1 },
    { std: "Take two tablets every four to six hours, no more than eight in 24 hours.", au: "Two every four to six hours, max eight a day, yeah?", pron: "투 에브리 포어 투 식스 아워즈, 맥스 에잇 어다이, 예?", ko: "4~6시간마다 2알, 하루 최대 8알", ans: "Two every four to six hours. Should I take it with food?", stage: 1 },
    { std: "You'll need a prescription from a doctor for that.", au: "You'll need a script from a GP for that one.", pron: "율 니더 스크립 프롬어 지피 퍼댓원", ko: "그건 의사 처방전이 필요해요", ans: "Is there a GP clinic nearby that takes walk-ins?", stage: 2 },
    { std: "Do you have a Medicare card?", au: "Got a Medicare card?", pron: "갓어 메디케어 카드?", ko: "메디케어(호주 공공의료보험) 카드 있어요?", ans: "No, I'm a tourist. I've got travel insurance.", stage: 2 },
    { std: "It's a private consultation. That will be $90, paid upfront.", au: "It's private billing, so it's ninety bucks up front.", pron: "잇츠 프라이빗 빌링, 쏘 잇츠 나이니 벅스 업프런트", ko: "비급여라 90달러 선결제예요", ans: "That's fine. Could I get a receipt for my insurance?", stage: 2 },
    { std: "When did you last have it?", au: "When'd ya last have it?", pron: "웬쟈 래스트 해빗?", ko: "마지막으로 언제 갖고 있었어요?", ans: "I think I left it on the tram about an hour ago.", stage: 3 },
    { std: "Have you contacted the lost property office?", au: "Have ya tried lost property?", pron: "해뱌 트라이드 로스트 프라퍼티?", ko: "분실물 센터에 연락해 봤어요?", ans: "Not yet. Where can I find it?", stage: 3 },
    { std: "Emergency. Do you need police, fire or ambulance?", au: "Emergency — police, fire or ambulance?", pron: "이머전시 — 폴리스, 파이어 오어 앰뷸런스?", ko: "경찰·소방·구급 중 어디요?", ans: "Ambulance, please. My friend has collapsed.", stage: 4 }
  ],
  phrases: [
    { en: "I've had a really bad headache since this morning. Is there anything stronger than Panadol?", ko: "아침부터 두통이 심해요. 파나돌보다 센 거 있어요?", alt: "I think I've got food poisoning. What would you recommend?", when: "약국" },
    { en: "I've lost my wallet. Could I get a police report for my insurance?", ko: "지갑을 잃어버렸어요. 보험용 경찰 신고서 받을 수 있을까요?", alt: "My phone's been stolen. Where's the nearest police station?", when: "분실·도난" },
    { en: "Sorry, could you write that down for me?", ko: "죄송한데 적어 주실 수 있어요?", alt: "Sorry, which one do I take first?", when: "복용법·주소 확인" }
  ],
  surprises: [
    { sit: "여권 분실", them: "You'll need to contact your consulate for an emergency travel document.", me: "Could you tell me how to get to the Korean consulate? We fly out on the eleventh." },
    { sit: "병원 대기 시간 김", them: "There's about a two-hour wait for walk-ins, sorry.", me: "Is there anywhere else nearby I could go, or a telehealth option?" }
  ],
  info: [
    { k: "긴급번호", v: "000 (경찰·소방·구급). 휴대폰에서 112도 연결", note: "" },
    { k: "약국", v: "chemist / pharmacy. Panadol = paracetamol(타이레놀 성분), Nurofen = ibuprofen. 일부 약은 약사 상담 후 판매(pharmacist only)", note: "" },
    { k: "GP (일반의)", v: "예약 위주, walk-in 가능한 클리닉 있음. 관광객은 전액 본인 부담", note: "진료비 확인 필요" },
    { k: "응급실", v: "ED (Emergency Department), 병원 내. 대기 시간 길 수 있음", note: "" },
    { k: "여행자보험", v: "영수증(receipt)·진단서(medical certificate)·경찰 신고서(police report) 꼭 받기", note: "" },
    { k: "분실물", v: "시드니: Transport NSW Lost Property / 멜버른: PTV Lost Property", note: "연락처 확인 필요" },
    { k: "영사 도움", v: "주시드니 대한민국 총영사관, 영사콜센터 +82-2-3210-0404 (24시간)", note: "멜버른 공관 위치·연락처 확인 필요" },
    { k: "자외선·해변", v: "자외선 매우 강함 (sunscreen·sunnies 필수). 해변은 빨강·노랑 깃발 사이에서만 수영", note: "" }
  ],
  listening: [
    { use: "1일차 듣기 ①", q: "pharmacy conversation Australia pharmacist" },
    { use: "1일차 듣기 ②", q: "calling 000 Triple Zero what to expect" },
    { use: "자투리 흘려듣기", q: "visiting a GP in Australia as a tourist" }
  ],
  flowTitle: "아플 때·잃어버렸을 때",
  flow: [
    { n: "💊", title: "약국", en: "Chemist", desc: "증상 → 복용 중인 약 → 알레르기 → 복용법", qs: [1, 2, 3, 4] },
    { n: "🩺", title: "병원 (GP)", en: "Clinic", desc: "처방 필요 시, 선결제 후 보험 청구", warn: "돌발 ② 대기 2시간", qs: [5, 6, 7] },
    { n: "🔍", title: "분실", en: "Lost", desc: "마지막 위치 → 분실물 센터 → 경찰 신고서", warn: "돌발 ① 여권 분실", qs: [8, 9] },
    { n: "🚨", title: "긴급", en: "000", desc: "경찰·소방·구급 선택 → 위치 설명", qs: [10] }
  ],
  treeTitle: "어디로 가야 하나?",
  tree: {
    q: "생명이 위급한가? (호흡곤란·의식저하·심한 출혈·흉통)",
    branches: [
      { a: "예", result: "즉시 000 → \"Ambulance, please.\"", tone: "warn" },
      { a: "아니오", q: "일반 약으로 해결될까? (감기·두통·배탈)", branches: [
        { a: "예", result: "Chemist (약국)", tone: "ok" },
        { a: "아니오", result: "GP 클리닉 (walk-in) → 밤·주말이면 병원 ED", tone: "warn" }
      ] }
    ],
    tip: "000 통화 시 주소를 바로 말할 수 있게 숙소 주소를 휴대폰 메모에 영어로 저장해 두세요."
  },
  linking: [
    { said: "What are ya symptoms?", parts: [["What", ""], ["are", ""], ["your", "drop"], ["→ ya", "chg"], ["symptoms", ""]], change: "your → ya (you와 소리 같음)", heard: "왓아야 · 심텀즈" },
    { said: "You'll need a script from a GP.", parts: [["You'll", ""], ["need a", ""], ["prescription", "drop"], ["→ script", "chg"], ["from a", ""], ["doctor", "drop"], ["→ GP", "chg"]], change: "prescription → script, doctor → GP", heard: "율 니더 · 스크립 · 프롬어 지피" },
    { said: "It's ninety bucks up front.", parts: [["It's", ""], ["ninety", ""], ["dollars", "drop"], ["→ bucks", "chg"], ["up front", ""]], change: "dollars → bucks, ninety의 t가 약화", heard: "잇츠 · 나이니 벅스 · 업프런트" },
    { said: "When'd ya last have it?", parts: [["When", ""], ["did you", "drop"], ["→ 'd ya", "chg"], ["last", ""], ["have", ""], ["it", ""]], change: "did you → 'd ya", heard: "웬쟈 · 래스트 · 해빗" }
  ],
  linkingTip: "숫자(복용 횟수·금액·시간)가 가장 중요합니다. 반드시 복창하세요: \"Two every four hours?\"",
  answerFormula: {
    title: "증상 공식",
    parts: [["증상", "I've got a sore throat"], ["시점", "since last night."], ["요청", "Is there something for that?"]],
    example: { q: "What's goin' on?", a: "I've had a bad stomach ache since this morning. Is there something for that?" },
    tip: "I've got (지금 상태) / I've had ~ since (언제부터)를 구분하면 약사가 바로 이해합니다."
  },
  roleplay: makeRoleplay({
    role: "멜버른 약국 약사, 이어서 GP 클리닉 접수 직원, 분실물 센터 직원",
    setting: ["동행자가 어젯밤부터 목이 아프고 열이 남", "나는 관광객, 메디케어 없음, 여행자보험 있음", "트램에서 지갑(또는 휴대폰)을 잃어버린 것 같음"],
    steps: ["약국: 증상 → 복용 중인 약 → 알레르기 → 복용법 안내", "약사가 GP 권유 → 클리닉 접수 → 진료비·영수증", "분실: 마지막 위치 → 분실물 신고 → 경찰 신고서"],
    surprises: ["처방전이 필요한 약이라 판매 불가", "GP 대기 2시간", "여권도 함께 분실"],
    slang: "script, GP, bucks, chemist",
    start: "Hi there, what's goin' on today?"
  })
};

// ===================== 공통 데이터 F·G·H =====================
window.COMMON = {
  clarify: [
    { en: "Sorry, could you say that again?", ko: "죄송한데 다시 말씀해 주시겠어요?", nuance: "기본·정중" },
    { en: "Sorry, I didn't quite catch that.", ko: "잘 못 들었어요.", nuance: "일부만 놓쳤을 때" },
    { en: "Sorry, what was that?", ko: "뭐라고 하셨죠?", nuance: "캐주얼·카페" },
    { en: "Did you say Tuesday or Thursday?", ko: "화요일이라고 하셨어요, 목요일이라고 하셨어요?", nuance: "둘 중 확인" },
    { en: "Could you slow down a little? I'm still getting used to the accent.", ko: "조금 천천히 말씀해 주실래요? 아직 억양이 익숙지 않아서요.", nuance: "속도 요청 + 이유 (호감)" },
    { en: "Sorry, what does \"arvo\" mean?", ko: "\"arvo\"가 무슨 뜻이에요?", nuance: "모르는 단어" },
    { en: "So just to confirm — platform three at two-fifteen?", ko: "확인하자면 3번 플랫폼 2시 15분이죠?", nuance: "정보 복창" },
    { en: "Could you write that down for me?", ko: "적어 주실 수 있어요?", nuance: "숫자·주소·약 이름" },
    { en: "Sorry, you lost me after the second turn.", ko: "두 번째 꺾는 데부터 놓쳤어요.", nuance: "길 설명 중간에 놓침" },
    { en: "Is that per person or in total?", ko: "1인당이에요, 전체예요?", nuance: "가격 확인" }
  ],
  aussie: [
    { ex: "G'day", ko: "안녕하세요", pron: "그다이", where: "인사 전반" },
    { ex: "How ya going?", ko: "잘 지내요? (= How are you?)", pron: "하우야 고잉", where: "인사 — 답: Good, thanks. You?" },
    { ex: "No worries", ko: "괜찮아요 / 천만에요", pron: "나우 워리즈", where: "감사·사과에 대한 답" },
    { ex: "Too easy", ko: "문제없어요 / 알겠어요", pron: "투 이지", where: "주문·요청 수락" },
    { ex: "Cheers", ko: "고마워요 (건배 아님)", pron: "치어즈", where: "가벼운 감사" },
    { ex: "Ta", ko: "고마워 (아주 짧게)", pron: "타", where: "물건 건넬 때" },
    { ex: "Mate", ko: "친구 / 손님 호칭", pron: "마잇", where: "모든 상황" },
    { ex: "You right?", ko: "도와드릴까요? / 괜찮아요?", pron: "유 라잇", where: "매장·카페" },
    { ex: "Heaps", ko: "엄청, 많이", pron: "힙스", where: "Thanks heaps / heaps of people" },
    { ex: "Reckon", ko: "~인 것 같다 (think)", pron: "레컨", where: "I reckon it'll rain." },
    { ex: "Arvo", ko: "오후 (afternoon)", pron: "아보", where: "See ya this arvo" },
    { ex: "Brekkie", ko: "아침 식사", pron: "브레키", where: "호텔·카페" },
    { ex: "Avo", ko: "아보카도", pron: "아보", where: "카페 메뉴 (avo toast)" },
    { ex: "Servo", ko: "주유소·편의점", pron: "써보", where: "길 설명" },
    { ex: "Bottle-o", ko: "주류 판매점", pron: "보를로", where: "마트에선 술을 안 팜" },
    { ex: "Macca's", ko: "맥도날드", pron: "매커즈", where: "길 설명·간판" },
    { ex: "Sunnies", ko: "선글라스", pron: "써니즈", where: "쇼핑·해변" },
    { ex: "Thongs", ko: "슬리퍼(쪼리)", pron: "떵즈", where: "쇼핑·해변 (속옷 아님!)" },
    { ex: "She'll be right", ko: "다 괜찮을 거야", pron: "쉴비 라잇", where: "문제 생겼을 때 직원이 안심시킬 때" },
    { ex: "Keen", ko: "~하고 싶은, 열심인", pron: "킨", where: "Are you keen for a tour?" }
  ],
  checklist: [
    { group: "📝 출발 전 필수", items: ["ETA(전자여행허가) 승인 확인 (동행자 포함)", "입국신고서 방식(종이 IPC / 디지털) 최신 정보 확인", "여행자보험 가입·증권 영문본 저장", "숙소 주소 영어로 휴대폰 메모 저장", "Type I 어댑터 2개 이상", "각 상황 '확인 필요' 항목 재확인 (요금·규정)"] },
    { group: "✈️ 공항", items: ["예상 질문 10개 중 8개 이상 자막 없이 이해 (듣기 카드 8/10)", "체류 기간·숙소·목적을 3초 안에 답하기", "음식물 신고 문장 막힘 없이 말하기"] },
    { group: "🏨 호텔", items: ["듣기 카드 8/10 이상", "예약 누락 상황 대응 문장 말하기", "방 문제 요청 공식(쿠션+문제+요청)으로 말하기"] },
    { group: "☕ 식당·카페", items: ["듣기 카드 8/10 이상", "커피 주문 (메뉴+우유+매장/포장) 한 문장으로", "surcharge·카드 거절 대응"] },
    { group: "🚋 교통", items: ["듣기 카드 8/10 이상", "길 설명 듣고 방향 복창하기", "국내선 수하물 질문 대응"] },
    { group: "🛒 쇼핑", items: ["듣기 카드 8/10 이상", "Credit or savings? 즉답", "환불 공식 4단계로 말하기", "TRS 조건 설명할 수 있음"] },
    { group: "💊 비상", items: ["듣기 카드 8/10 이상", "증상 공식으로 말하기", "000 통화 시 첫 두 문장 말하기 (서비스 종류 + 상황)"] },
    { group: "🎙 종합", items: ["종합 롤플레이 3회 완료", "되묻기 표현 10개 중 5개 이상 실제로 사용", "전체 섞어 듣기 모의고사 80% 이상"] }
  ]
};

// ===================== 종합·최종 =====================
window.REVIEW = {
  roleplay: `지금부터 너는 호주 여행 중 만나는 여러 사람(입국심사관, 호텔 직원, 바리스타, 버스 기사, 마트 계산원, 약사) 역할을 차례로 맡아.
나는 OPIc IH 수준이지만 오랜만에 영어를 써서 반응이 느린 상태고, 호주 악센트 알아듣기가 약해.

[상황 설정]
- 여행: 2026-10-31 시드니 도착 → 시드니 관광 → 국내선으로 멜버른 → 11-11 출국, 성인 2명
- 장면은 무작위로 3개를 골라 이어서 진행해 (장면이 바뀔 때 "[Scene: 장소]"만 말해)

[진행 규칙]
- 각 장면마다 예상 밖 상황을 1번씩 넣어줘 (예약 누락, 품절, 결제 오류, 열차 운행 중단, 분실 등)
- 호주 원어민처럼 실제 속도로, 축약·호주식 표현(ya, arvo, no worries, you right, reckon, heaps)을 섞어서 말해
- 한 번에 한두 문장만 말하고 내 답을 기다려
- 내가 되물으면 처음엔 같은 속도로, 두 번째에만 천천히 말해줘
- 3초 이상 대답이 없으면 실제 직원처럼 "You right?" 하고 재촉해

[종료 후 한국어로 표 정리]
1) 장면별 못 알아들은 표현 | 실제 발화 | 들리는 발음
2) 내 답변 | 더 자연스러운 표현
3) 반응이 늦었던 질문 | 바로 쓸 수 있는 즉답 표현
4) 장면별 점수 (이해율, 반응 속도)와 출발 전 마지막으로 연습할 3가지

첫 장면부터 시작해줘.`,
  accentListening: [
    { use: "호주 악센트 특징", q: "Australian accent explained vowels" },
    { use: "길거리 인터뷰 (빠른 실제 발화)", q: "Australian slang street interview" },
    { use: "흘려듣기 (예능)", q: "Border Security Australia full episode" }
  ]
};
