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
    flow: [
      { n: "0", title: "착륙", en: "Landing", desc: "기내에서 입국신고서(IPC) 작성", qs: [] },
      { n: "1", title: "입국심사", en: "Passport Control", desc: "SmartGate(자동) 또는 유인 카운터", qs: [1, 2, 3, 6, 7] },
      { n: "2", title: "수하물 찾기", en: "Baggage Claim", desc: "짐이 안 나오면 Baggage Services로", warn: "돌발 ① 수하물 미도착", qs: [] },
      { n: "3", title: "세관·검역", en: "Customs / Biosecurity", desc: "신고서 확인 후 레인 배정 (신고 없음 → 바로 출구)", qs: [4, 5, 8, 9] },
      { n: "4", title: "X-ray·검사", en: "Inspection", desc: "신고 있음 → 가방 검사", warn: "돌발 ② 반입 불가 시 폐기", qs: [10] },
      { n: "🚪", title: "출구", en: "Arrivals Hall", desc: "기차(Airport Link)·택시로 시내 이동", qs: [] }
    ],
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
