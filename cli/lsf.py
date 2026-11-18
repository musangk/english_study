#!/usr/bin/env python3
"""lsf — lang-study framework CLI (Python 3.9+, no dependencies).

Same rules as coach/core.js and the same data file as the web coach's export,
so you can move between phone (Voice Coach PWA) and terminal:

  python3 cli/lsf.py init  --data ~/lsf-store.json --lang en
  python3 cli/lsf.py start  --data ~/lsf-store.json [--lang ja] [--track work]   # start prompt (+ copies mission)
  python3 cli/lsf.py review --data ~/lsf-store.json                              # end-of-session prompt
  python3 cli/lsf.py log    --data ~/lsf-store.json report.md                    # or: pbpaste | lsf.py log -
  python3 cli/lsf.py stats  --data ~/lsf-store.json
  python3 cli/lsf.py anki   --data ~/lsf-store.json > cards.txt
  python3 cli/lsf.py validate report.md

Env LSF_DATA can replace --data. Keep the data file out of public repos.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS = ROOT / "packs"
INTERVALS = {1: 1, 2: 2, 3: 4, 4: 9, 5: 20}
PUNCT = re.compile(r"[.,!?;:\"'“”‘’()\[\]。、！？「」『』…~\-]")


# ---------- helpers (mirror core.js) ----------
def today() -> str:
    return dt.date.today().isoformat()


def add_days(s: str, n: int) -> str:
    return (dt.date.fromisoformat(s) + dt.timedelta(days=n)).isoformat()


def weekday(s: str) -> int:  # Sunday=0 like JS getDay()
    return (dt.date.fromisoformat(s).weekday() + 1) % 7


def day_index(s: str) -> int:
    return (dt.date.fromisoformat(s) - dt.date(1970, 1, 1)).days


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", str(s or "").lower())
    s = re.sub(r"[\s　]+", " ", s)
    return PUNCT.sub("", s).strip()


def hash_id(s: str) -> str:  # FNV-1a 32bit, identical to core.js
    h = 0x811C9DC5
    for b in norm(s).encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def render(tpl: str, vars: dict) -> str:
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(vars.get(m.group(1), "")), tpl)


def load_pack(lang: str) -> dict:
    p = PACKS / lang / "pack.json"
    if not p.exists():
        sys.exit(f"unknown language pack: {lang} (available: {', '.join(d.name for d in PACKS.iterdir() if d.is_dir())})")
    return json.loads(p.read_text(encoding="utf-8"))


def empty_store(lang="en") -> dict:
    return {"version": 1, "profile": {"lang": lang, "levels": {}, "grammarLink": True}, "langs": {}}


def lang_data(store: dict, lang: str) -> dict:
    return store["langs"].setdefault(lang, {"sessions": [], "expressions": {}})


def level_of(store, pack) -> int:
    return (store["profile"].get("levels") or {}).get(pack["id"], pack["levels"]["default"])


def level_label(pack, v) -> str:
    return next((i["label"] for i in pack["levels"]["items"] if i["value"] == v), str(v))


# ---------- mission & prompts ----------
def pick_mission(store, pack, date, track_key=None, count=3) -> dict:
    ld = lang_data(store, pack["id"])
    key = pack["weekly"].get(str(weekday(date)), pack["tracks"][0]["key"])
    scenario, review = None, False
    if key == "review":
        review = True
        week_ago = add_days(date, -7)
        past = [s for s in ld["sessions"] if week_ago <= s["date"] < date and s.get("scenario")]
        if past:
            key, scenario = past[0].get("track") or pack["tracks"][0]["key"], past[0]["scenario"]
        else:
            key = pack["tracks"][0]["key"]
    if track_key:
        key, review, scenario = track_key, False, None
    track = next((t for t in pack["tracks"] if t["key"] == key), pack["tracks"][0])
    if not scenario:
        scenario = track["scenarios"][day_index(date) % len(track["scenarios"])]
    cards = [{"id": i, **c} for i, c in ld["expressions"].items()]
    due = sorted([c for c in cards if c["due"] <= date], key=lambda c: (c["box"], c["due"]))
    rest = [c for c in cards if c["due"] > date]
    rest.sort(key=lambda c: c["added"], reverse=True)
    rest.sort(key=lambda c: c["box"])
    return {"date": date, "lang": pack["id"], "trackKey": track["key"], "trackLabel": track["label"],
            "scenario": scenario, "review": review, "expressions": (due + rest)[:count], "extra": []}


def start_prompt(pack, store, m) -> str:
    lv = level_of(store, pack)
    items = [e["text"] for e in m["expressions"]] + m["extra"]
    lst = "\n".join(f"   - {t}" for t in items) if items else \
        "   - (none yet — pick 3 useful expressions for this scenario and tell me at the start)"
    return render(pack["prompts"]["start"], {
        "langName": pack["name"], "track": m["trackLabel"], "scenario": m["scenario"],
        "level": level_label(pack, lv), "levelUp": level_label(pack, min(6, lv + 1)), "expressions": lst})


def review_prompt(pack, m) -> str:
    items = [e["text"] for e in m["expressions"]] + m["extra"]
    return render(pack["prompts"]["review"], {
        "errorTypes": ", ".join(e["key"] for e in pack["errorTypes"]),
        "rubric": ", ".join(r["key"] for r in pack["rubric"]),
        "missionList": " / ".join(items) if items else "(none)",
        "langId": pack["id"], "trackKey": m["trackKey"], "scenario": m["scenario"].replace('"', "'"),
        "scoreShape": json.dumps({r["key"]: 0 for r in pack["rubric"]}, separators=(",", ":"))})


# ---------- report ----------
def parse_report(text: str, pack: dict | None = None) -> tuple[dict, str]:
    if not text or not text.strip():
        raise ValueError("empty report")
    blocks = re.findall(r"```\s*(lsf-report|json)?\s*\n([\s\S]*?)```", text)
    pick = next((b for b in blocks if b[0] == "lsf-report"), None) or \
        next((b for b in blocks if re.search(r'"errors"\s*:', b[1])), None)
    if pick:
        body = pick[1].lstrip("﻿").replace("“", '"').replace("”", '"')
        body = re.sub(r",\s*([}\]])", r"\1", body)
        report, source = json.loads(body), "json"
    else:
        source, errors = "table", []
        for line in text.splitlines():
            t = line.strip()
            if not t.startswith("|"):
                continue
            cells = [c.strip() for c in re.sub(r"^\||\|$", "", t).split("|")]
            if len(cells) < 2 or all(re.fullmatch(r":?-{2,}:?", c) or c == "" for c in cells):
                continue
            if re.search(r"my sentence|내 문장|better version", cells[0] + cells[1], re.I):
                continue
            cells += [""] * 4
            errors.append({"said": cells[0], "better": cells[1], "type": cells[2], "note": cells[3]})
        keys = [r["key"] for r in pack["rubric"]] if pack else ["fluency", "accuracy", "range"]
        scores = {}
        for k in keys:
            mm = re.search(k + r"[^0-9\n]{0,15}([1-6])", text, re.I)
            if mm:
                scores[k] = int(mm.group(1))
        if not errors and not scores:
            raise ValueError("no lsf-report block or correction table found")
        report = {"errors": errors, "expressions": [], "scores": scores}
    report["errors"] = [e for e in report.get("errors") or [] if e and (e.get("said") or e.get("better"))]
    report["expressions"] = [e for e in report.get("expressions") or [] if e and e.get("text")]
    report["scores"] = {k: v for k, v in (report.get("scores") or {}).items()
                        if isinstance(v, (int, float)) and 1 <= v <= 6}
    report["missionUsed"] = [x for x in report.get("missionUsed") or [] if x]
    if pack:
        report["lang"] = pack["id"]
    return report, source


def _grade(card, ok, date):
    card["box"] = min(5, card.get("box", 1) + 1) if ok else 1
    card["due"] = add_days(date, INTERVALS[card["box"]] if ok else 1)
    if ok:
        card["uses"] = card.get("uses", 0) + 1


def _upsert(ld, card, date) -> bool:
    cid = hash_id(card["text"])
    old = ld["expressions"].get(cid)
    if old:
        if card["kind"] == "fix":
            old.update(box=1, due=add_days(date, 1), wrong=card.get("wrong") or old.get("wrong", ""))
        if card.get("meaning") and not old.get("meaning"):
            old["meaning"] = card["meaning"]
        return False
    ld["expressions"][cid] = {"box": 1, "due": add_days(date, 1), "uses": 0, "added": date, **card}
    return True


def apply_report(store, report, mission, date) -> dict:
    lang = report.get("lang") or (mission or {}).get("lang") or store["profile"]["lang"]
    ld = lang_data(store, lang)
    used = [norm(u) for u in report.get("missionUsed", [])]
    graded = []
    for e in (mission or {}).get("expressions", []):
        card = ld["expressions"].get(e["id"])
        if not card:
            continue
        n = norm(card["text"])
        ok = any(u and (u == n or n in u or u in n) for u in used)
        _grade(card, ok, date)
        graded.append({"text": card["text"], "ok": ok})
    added = sum(_upsert(ld, {"text": x["text"], "meaning": x.get("meaning", ""), "kind": "expr"}, date)
                for x in report["expressions"])
    for er in report["errors"]:
        if er.get("better") and norm(er["better"]) != norm(er.get("said", "")):
            added += _upsert(ld, {"text": er["better"], "wrong": er.get("said", ""), "meaning": er.get("note", ""),
                                  "type": er.get("type", ""), "kind": "fix"}, date)
    session = {"id": f"{date}-{int(time.time() * 1000):x}", "date": date, "lang": lang,
               "track": report.get("track") or (mission or {}).get("trackKey", ""),
               "scenario": report.get("scenario") or (mission or {}).get("scenario", ""),
               "mission": [e["text"] for e in (mission or {}).get("expressions", [])] + (mission or {}).get("extra", []),
               "errors": report["errors"], "expressions": report["expressions"], "scores": report["scores"],
               "missionUsed": report.get("missionUsed", []), "summary": report.get("summary", "")}
    ld["sessions"].insert(0, session)
    return {"session": session, "added": added, "graded": graded}


def stats(store, lang, date) -> dict:
    ld = lang_data(store, lang)
    cards = list(ld["expressions"].values())
    err = {}
    for s in ld["sessions"]:
        for e in s["errors"]:
            if e.get("type"):
                err[e["type"]] = err.get(e["type"], 0) + 1
    days = {s["date"] for s in ld["sessions"]}
    streak, d = 0, date if date in days else add_days(date, -1)
    while d in days:
        streak, d = streak + 1, add_days(d, -1)
    return {"sessions": len(ld["sessions"]), "streak": streak, "cards": len(cards),
            "due": sum(c["due"] <= date for c in cards), "mastered": sum(c["box"] >= 4 for c in cards),
            "topErrors": sorted(err.items(), key=lambda x: -x[1])[:5],
            "scoreSeries": [{"date": s["date"], "scores": s["scores"]} for s in reversed(ld["sessions"][:20])]}


def anki_tsv(store, lang) -> str:
    esc = lambda s: re.sub(r"[\t\n]", " ", str(s or ""))
    out = []
    for c in lang_data(store, lang)["expressions"].values():
        if c["kind"] == "fix":
            front, back = f"✗ {esc(c.get('wrong'))}", esc(c["text"]) + (f" — {esc(c['meaning'])}" if c.get("meaning") else "")
        else:
            front, back = esc(c.get("meaning") or c["text"]), esc(c["text"])
        out.append(f"{front}\t{back}\tlsf {lang} {c['kind']}")
    return "\n".join(out)


# ---------- CLI ----------
def _data_path(a) -> Path:
    p = a.data or os.environ.get("LSF_DATA")
    if not p:
        sys.exit("--data FILE (or env LSF_DATA) is required")
    return Path(p).expanduser()


def _load(a) -> dict:
    p = _data_path(a)
    if not p.exists():
        sys.exit(f"{p} not found — run: lsf.py init --data {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def _save(a, store):
    p = _data_path(a)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(p)


def _mission_path(a) -> Path:
    return _data_path(a).with_suffix(".mission.json")


def _mission(a, store, pack, force=False):
    mp, date = _mission_path(a), today()
    if not force and mp.exists():
        m = json.loads(mp.read_text(encoding="utf-8"))
        if m.get("date") == date and m.get("lang") == pack["id"]:
            return m
    m = pick_mission(store, pack, date, getattr(a, "track", None))
    mp.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
    return m


def main(argv=None):
    ap = argparse.ArgumentParser(prog="lsf", description="lang-study framework CLI")
    ap.add_argument("--data", help="store JSON (same format as Voice Coach export)")
    ap.add_argument("--lang", help="language pack id (default: profile.lang)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init")
    s = sub.add_parser("start"); s.add_argument("--track")
    sub.add_parser("review")
    lg = sub.add_parser("log"); lg.add_argument("file", help="report file, or - for stdin")
    sub.add_parser("stats")
    sub.add_parser("anki")
    v = sub.add_parser("validate"); v.add_argument("file")
    a = ap.parse_args(argv)

    if a.cmd == "validate":
        text = sys.stdin.read() if a.file == "-" else Path(a.file).read_text(encoding="utf-8")
        report, src = parse_report(text, load_pack(a.lang) if a.lang else None)
        print(json.dumps({"source": src, "errors": len(report["errors"]), "expressions": len(report["expressions"]),
                          "scores": report["scores"]}, ensure_ascii=False))
        return
    if a.cmd == "init":
        p = _data_path(a)
        if p.exists():
            sys.exit(f"{p} already exists")
        p.parent.mkdir(parents=True, exist_ok=True)
        _save(a, empty_store(a.lang or "en"))
        print(f"created {p}")
        return

    store = _load(a)
    lang = a.lang or store["profile"].get("lang", "en")
    pack = load_pack(lang)
    if a.cmd == "start":
        m = _mission(a, store, pack, force=bool(a.track))
        print(start_prompt(pack, store, m))
    elif a.cmd == "review":
        print(review_prompt(pack, _mission(a, store, pack)))
    elif a.cmd == "log":
        text = sys.stdin.read() if a.file == "-" else Path(a.file).read_text(encoding="utf-8")
        report, src = parse_report(text, pack)
        mp = _mission_path(a)
        m = json.loads(mp.read_text(encoding="utf-8")) if mp.exists() else None
        if m and (m.get("lang") != lang or m.get("date") != today()):
            m = None
        res = apply_report(store, report, m, today())
        _save(a, store)
        used = sum(g["ok"] for g in res["graded"])
        print(f"saved ({src}) · new cards {res['added']}" + (f" · mission {used}/{len(res['graded'])} used" if res["graded"] else ""))
    elif a.cmd == "stats":
        st = stats(store, lang, today())
        print(f"| 항목 | 값 |\n|---|---|\n| 세션 | {st['sessions']} |\n| 연속일 | {st['streak']} |\n"
              f"| 카드 | {st['cards']} (암기 {st['mastered']}) |\n| 복습 대기 | {st['due']} |")
        labels = {e["key"]: e["label"] for e in pack["errorTypes"]}
        if st["topErrors"]:
            print("\n| 자주 틀리는 유형 | 횟수 |\n|---|---|")
            for k, n in st["topErrors"]:
                print(f"| {labels.get(k, k)} | {n} |")
        if st["scoreSeries"]:
            keys = [r["key"] for r in pack["rubric"]]
            print("\n| 날짜 | " + " | ".join(keys) + " |\n|---|" + "---|" * len(keys))
            for s in st["scoreSeries"]:
                print(f"| {s['date']} | " + " | ".join(str(s['scores'].get(k, '-')) for k in keys) + " |")
    elif a.cmd == "anki":
        print(anki_tsv(store, lang))


if __name__ == "__main__":
    main()
