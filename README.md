# 🎧 English Grammar in Use — 하루 20문장

유튜브 **[9시간 중급 그래머 인 유즈 Unit 1~145 통합본](https://www.youtube.com/watch?v=NQl-SvgfmtY)** 영상의
모든 예문(**4,388문장**)을 하루 20문장씩(**220일**) 외우는 학습 웹앱입니다.

> 듣고 · 따라 말하고 · 시험 보며 가장 빠르게 암기하도록 설계했습니다.

## ✨ 기능

| 모드 | 설명 |
|------|------|
| 📖 **학습** | 문장을 보며 탭하면 소리 재생. 눈·귀로 먼저 익히기 |
| 🎧 **듣기** | 20문장 핸즈프리 연속 재생 (영상처럼 각 문장 2번 반복 가능) |
| ✍️ **시험** | 문장을 가리고 소리만 듣기 → 떠올린 뒤 정답 확인 → 암기도 채점 |

- **음성**: 브라우저 내장 TTS(Web Speech API) — 별도 파일·설치 없이 즉시 재생, **속도 조절** 가능
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
js/app.js           앱 로직 (모드·TTS·간격반복·진도)
data/sentences.json 4,388문장 / 220일 데이터
scripts/extract.py  자막 → 문장 추출 스크립트
```

---
학습 자료 출처: *English Grammar in Use* (Raymond Murphy) 기반 유튜브 영상. 개인 학습용.
