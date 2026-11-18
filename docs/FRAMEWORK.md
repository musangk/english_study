# Lang Study Framework

This is a framework for AI voice conversation practice that keeps growing over time, instead of resetting
every session. It works by keeping each session's feedback outside the AI and feeding it into the next
session as a mission.

## Why this exists

| Problem | Cause | What the framework does |
|---|---|---|
| Corrections are lost after each session | The AI doesn't remember past sessions | Every session ends with an `lsf-report`, which the app turns into review cards |
| Conversations stay at the same level | The AI adapts to the learner, and voice mode doesn't interrupt to correct | Prompts require speaking one level above the learner, pushing back, and using mission expressions |
| Progress can't be measured | There is no rubric | Scores from 1 to 6, plus a weekly review day that repeats last week's scenario to compare scores |

## Structure

```
packs/<lang>/pack.json     Language pack: levels, rubric, error types, tracks/scenarios, weekly rotation, prompt templates
schema/report.schema.json  lsf-report: the contract between the AI and every client
schema/store.schema.json   Personal learning data (web export = CLI data file)
coach/                     Voice Coach PWA (mobile, voice first) + core.js (shared logic)
cli/lsf.py                 Terminal client (same rules, same data file)
skill/lang-study-coach/    Claude Skill: say "영어 세션 시작" / "end session" in the Claude app
tests/                     JS and Python parity tests (hash, parsing, mission, grading)
```

## Clients

| Client | Best for | Data |
|---|---|---|
| **Voice Coach (web/PWA)** | Phone, before and after a voice session | Browser localStorage, with JSON export/import |
| **Claude Skill** | Running the session itself in Claude's voice mode | Outputs an lsf-report |
| **CLI** | Terminal, automation, backups | `--data store.json` |
| **Grammar in Use app** (`../`) | Sentence memorization | Same origin, so Voice Coach adds today's sentence to the mission |

## Daily routine (15 minutes)

1. **Voice Coach → 오늘:** check today's scenario and the 3 expressions you must use, then listen to them (1 min).
2. Tap **시작 프롬프트 복사**, open Claude, paste it, and switch to voice mode for the conversation (10 min).
   If the Skill is installed, just say "영어 세션 시작".
3. Say "end session", then send **종료 프롬프트** as text. The AI answers with a table and an `lsf-report`.
4. Share the answer to Voice Coach (Android) or copy it, then go to **기록**, paste it and save (1 min).
5. In spare moments, use **복습** to say past mistakes and expressions out loud. Speech recognition checks how closely you matched.

## Grading rules (spaced repetition)

| Event | Result |
|---|---|
| New expression or corrected sentence | box 1, due tomorrow |
| Mission expression used in a session / 복습 "알아요" | box +1, next review after 1, 2, 4, 9 or 20 days |
| Mission expression not used / 복습 "다시" | box 1, due tomorrow |
| The same mistake again | Back to box 1 |

## Adding a language

1. Copy `packs/en/pack.json` to `packs/<id>/pack.json` and translate the levels, error types, scenarios and prompts.
   Keep the `{{placeholders}}` exactly as they are.
2. Add the pack to `packs/index.json`.
3. Run `node tests/core.test.js && python3 -m unittest discover -s tests`. These check that no placeholder is left
   unfilled and that the JSON shape shown to the AI is valid.

## Using it as a template

Fork the repo, then turn on GitHub Pages and open `/coach/`. Personal data lives only in each user's browser or
data file, so it never ends up in the public repo.
