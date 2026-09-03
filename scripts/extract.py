#!/usr/bin/env python3
"""
Extract clean study sentences from the YouTube auto-captions of
"9시간 중급 그래머 인 유즈 Unit 1~145" (English Grammar in Use / Intermediate).

Pipeline:
  1. Read the json3 caption file (timed ASR lines).
  2. Reconstruct proper sentences across the awkward time-based line breaks.
  3. Drop the second reading of every sentence (the video reads each example
     twice) using a time-window de-duplication.
  4. Split into study "days" of N sentences and write data/sentences.json.

Regenerate captions with:
  yt-dlp --skip-download --write-auto-subs --sub-langs "en-orig" \
    --sub-format json3 --extractor-args "youtube:player_client=android" \
    -o "raw/captions.%(ext)s" "https://www.youtube.com/watch?v=NQl-SvgfmtY"
"""
import json
import re
import os

SRC = os.path.join(os.path.dirname(__file__), "..", "raw", "captions.en-orig.json3")
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "sentences.json")
PER_DAY = 20
DEDUPE_WINDOW_MS = 90_000  # a repeat within 90s is the video's second reading

ABBR = re.compile(r"\b(Mr|Mrs|Ms|Dr|St|vs|etc|eg|ie|Prof|Sr|Jr|No)\.$", re.I)
END = re.compile(r"[.?!]+[\"')\]]?(?=\s|$)")


def load_lines(path):
    data = json.load(open(path, encoding="utf-8"))
    out = []
    for e in data["events"]:
        segs = e.get("segs")
        if not segs:
            continue
        txt = "".join(s.get("utf8", "") for s in segs)
        txt = re.sub(r"\s+", " ", txt).strip()
        if txt:
            out.append((e.get("tStartMs", 0), txt))
    return out


def reconstruct(lines):
    """Merge timed lines into full sentences, tagging each with its start time."""
    buf, buf_start, sentences = "", None, []
    for t, txt in lines:
        if buf_start is None:
            buf_start = t
        buf = (buf + " " + txt).strip() if buf else txt
        while True:
            chosen = None
            for m in END.finditer(buf):
                if ABBR.search(buf[: m.end()].strip()):
                    continue  # abbreviation, not a real sentence end
                chosen = m
                break
            if not chosen:
                break
            sentences.append((buf_start, buf[: chosen.end()].strip()))
            buf, buf_start = buf[chosen.end():].strip(), t
    if buf.strip():
        sentences.append((buf_start, buf.strip()))
    return sentences


def dedupe(sentences):
    """Remove the second spoken reading of each sentence (within the window)."""
    seen, uniq = {}, []
    norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()
    for t, s in sentences:
        n = norm(s)
        if not n:
            continue
        if n in seen and (t - seen[n]) <= DEDUPE_WINDOW_MS:
            seen[n] = t
            continue
        seen[n] = t
        uniq.append((t, s))
    return uniq


def main():
    lines = load_lines(SRC)
    sentences = dedupe(reconstruct(lines))
    items = [
        {"id": i + 1, "t": round(t / 1000, 1), "day": i // PER_DAY + 1, "en": s}
        for i, (t, s) in enumerate(sentences)
    ]
    total_days = (len(items) + PER_DAY - 1) // PER_DAY
    payload = {
        "source": "https://www.youtube.com/watch?v=NQl-SvgfmtY",
        "title": "English Grammar in Use (Intermediate) · Unit 1–145",
        "perDay": PER_DAY,
        "totalSentences": len(items),
        "totalDays": total_days,
        "sentences": items,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(payload, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"Wrote {len(items)} sentences across {total_days} days -> {OUT}")


if __name__ == "__main__":
    main()
