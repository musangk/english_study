# 🎧 English Grammar in Use — 하루 20문장

### 👉 **[학습하러 가기 — https://musangk.github.io/english_study/](https://musangk.github.io/english_study/)**

유튜브 **[9시간 중급 그래머 인 유즈 Unit 1~145 통합본](https://www.youtube.com/watch?v=NQl-SvgfmtY)** 영상의
모든 예문(**4,384문장**)을 하루 20문장씩(**220일**) 외우는 학습 웹앱입니다.

> 듣고 · 따라 말하고 · 시험 보며 가장 빠르게 암기하도록 설계했습니다.

## 🎙 Voice Coach — AI 음성 회화 프레임워크 (영어·일본어)

### 👉 **[Voice Coach 열기 — https://musangk.github.io/english_study/coach/](https://musangk.github.io/english_study/coach/)**

AI와 음성으로 대화한 내용의 **교정이 휘발되지 않고 다음 세션 미션으로 이어지게** 하는 하루 15분 루틴입니다.

| 단계 | 하는 일 |
|------|------|
| 🎯 오늘 | 요일별 시나리오와 꼭 써야 할 표현 3개 → 시작 프롬프트 복사 → Claude/ChatGPT **음성 모드**로 대화 |
| 📥 기록 | 종료 리포트(`lsf-report`)를 붙여넣거나 **공유**(Android)하면 오답·표현 카드가 쌓임 |
| 🗣 복습 | 틀린 문장을 **말로** 고쳐 말하기. 음성 인식으로 일치율 확인, 간격 반복 |
| 📈 통계 | Fluency·Accuracy·Range 점수 추이, 자주 틀리는 유형 |

- 같은 규칙과 데이터를 쓰는 **CLI**(`cli/lsf.py`)와 **Claude Skill**(`skill/lang-study-coach`)을 함께 제공
- 홈 화면에 추가하면 앱처럼 쓸 수 있고, 오프라인에서도 열림
- 자세한 구조와 언어 추가 방법: **[docs/FRAMEWORK.md](docs/FRAMEWORK.md)**

```bash
python3 cli/lsf.py --data ~/lsf-store.json init       # 웹에서 내보낸 JSON도 그대로 사용 가능
python3 cli/lsf.py --data ~/lsf-store.json start      # 시작 프롬프트
python3 cli/lsf.py --data ~/lsf-store.json log r.md   # 리포트 기록
node tests/core.test.js && python3 -m unittest discover -s tests
```

## ✨ 기능

| 모드 | 설명 |
|------|------|
| 📖 **학습** | 문장을 보며 탭하면 소리 재생. 눈·귀로 먼저 익히기 |
| 🎧 **듣기** | 20문장 핸즈프리 연속 재생 (영상처럼 각 문장 2번 반복 가능) |
| ✍️ **시험** | 문장을 가리고 소리만 듣기 → 떠올린 뒤 정답 확인 → 암기도 채점 |
| 💬 **대화** | 그날 배운 20문장으로 **LLM과 회화 연습**하도록 유도하는 프롬프트 자동 생성 (복사 → ChatGPT·Claude·Gemini에 붙여넣기, 자유대화/롤플레이/인터뷰 시나리오) |

- **음성**: 🎬 **유튜브 원본 영상의 실제 음성** — 각 문장의 타임스탬프(`t`~`e`)로 원본을 재생하므로 기계음이 아니라 원어민 성우 그대로. 재생 속도 조절 가능(0.5×~1.5×)
- **간격 반복 암기(Leitner)**: `다시 / 애매 / 알아요` 채점에 따라 복습 주기를 자동 조절 (1→2→4→9→20일)
- **진도 저장**: 브라우저 localStorage에 자동 저장 (연속 학습일, 복습 대기, 암기 완료 수)
- **키보드 단축키**: `Space` 재생/정답, `1·2·3` 채점, `R` 다시 듣기
- 모바일 우선 반응형 · 라이트/다크 자동

## 🚀 GitHub Pages 배포

1. GitHub 저장소 → **Settings → Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` / `/ (root)` → **Save**
4. 잠시 후 `https://musangk.github.io/english_study/` 에서 접속

> 이미 이 저장소에 파일이 올라가 있으니, 위 설정만 켜면 바로 배포됩니다.

## 💻 로컬 실행

`file://`로 열면 데이터 로딩이 막히므로 간단한 서버로 실행하세요.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```

## 📱 팁

- **아이폰(Safari)**: 첫 재생은 화면을 한 번 탭해야 소리가 나옵니다(브라우저 정책).
- 홈 화면에 추가하면 앱처럼 사용할 수 있어요.
- 음성이 마음에 안 들면 ⚙️ 설정에서 다른 영어 음성을 고르세요.

## 🛠 데이터 재생성

문장 데이터는 영상 자막에서 추출했습니다. 다시 만들려면:

```bash
pip install yt-dlp
yt-dlp --skip-download --write-auto-subs --sub-langs "en-orig" \
  --sub-format json3 --extractor-args "youtube:player_client=android" \
  -o "raw/captions.%(ext)s" "https://www.youtube.com/watch?v=NQl-SvgfmtY"
python3 scripts/extract.py   # -> data/sentences.json
```

## 📂 구조

```
index.html          학습 UI
css/style.css       스타일
js/app.js           앱 로직 (모드·원본음성 재생·간격반복·진도)
data/sentences.json 4,384문장 / 220일 데이터
scripts/extract.py  자막 → 문장 추출 스크립트
scripts/retime.py   문장별 재생 구간 분리(겹침 보정) 스크립트
```

---
학습 자료 출처: *English Grammar in Use* (Raymond Murphy) 기반 유튜브 영상. 개인 학습용.
