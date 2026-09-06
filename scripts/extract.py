#!/usr/bin/env python3
"""
Extract clean study sentences — with accurate start/end timestamps — from the
YouTube auto-captions of "9시간 중급 그래머 인 유즈 Unit 1~145"
(English Grammar in Use / Intermediate).

Pipeline:
  1. Read the json3 caption file (timed ASR lines).
  2. Turn lines into a word stream, each word tagged with its line's start/end.
  3. Reconstruct sentences across the awkward line breaks, keeping each
     sentence's start (first word) and end (last word) time.
  4. Drop the video's second reading of every sentence (time-window dedupe),
     keeping the first reading and its timing.
  5. Split into study "days" of N sentences → data/sentences.json.

The timestamps let the web app play the ORIGINAL video audio for each sentence
via the YouTube player (seek to `t`, play until `e`), instead of browser TTS.

Regenerate captions with:
  yt-dlp --skip-download --write-auto-subs --sub-langs "en-orig" \
    --sub-format json3 --extractor-args "youtube:player_client=android" \
    -o "raw/captions.%(ext)s" "https://www.youtube.com/watch?v=NQl-SvgfmtY"
"""
import json
import re
import os

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "raw", "captions.en-orig.json3")
OUT = os.path.join(HERE, "..", "data", "sentences.json")
VIDEO_ID = "NQl-SvgfmtY"
PER_DAY = 20
DEDUPE_WINDOW_MS = 90_000  # a repeat within 90s is the video's second reading

ABBR = re.compile(r"\b(Mr|Mrs|Ms|Dr|St|vs|etc|eg|ie|Prof|Sr|Jr|No)\.$", re.I)
ENDS = tuple(".?!")


def load_words(path):
    """Flat stream of (word, startMs, endMs); a line's end = next line's start."""
    data = json.load(open(path, encoding="utf-8"))
    lines = []
    for e in data["events"]:
        segs = e.get("segs")
        if not segs:
            continue
        txt = re.sub(r"\s+", " ", "".join(s.get("utf8", "") for s in segs)).strip()
        if txt:
            lines.append((e.get("tStartMs", 0), txt))
    words = []
    for i, (t, txt) in enumerate(lines):
        end = lines[i + 1][0] if i + 1 < len(lines) else t + 3000
        toks = txt.split()
        for w in toks:
            words.append((w, t, end))
    return words


def reconstruct(words):
    """Merge words into sentences, tracking start (first word) and end (last word)."""
    out, cur, start, end = [], [], None, None
    for w, ws, we in words:
        if start is None:
            start = ws
        cur.append(w)
        end = we
        sent = " ".join(cur)
        if w.endswith(ENDS) and not ABBR.search(sent):
            out.append((start, end, sent))
            cur, start, end = [], None, None
    if cur:
        out.append((start, end, " ".join(cur)))
    return out


def dedupe(sentences):
    seen, uniq = {}, []
    norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()
    for s, e, txt in sentences:
        n = norm(txt)
        if not n:
            continue
        if n in seen and (s - seen[n]) <= DEDUPE_WINDOW_MS:
            seen[n] = s
            continue
        seen[n] = s
        uniq.append((s, e, txt))
    return uniq


def main():
    sentences = dedupe(reconstruct(load_words(SRC)))
    items = []
    for i, (s, e, txt) in enumerate(sentences):
        start = round(s / 1000, 1)
        end = round(max(e, s + 400) / 1000, 1)  # ensure end > start
        items.append({"id": i + 1, "day": i // PER_DAY + 1, "t": start, "e": end, "en": txt})
    total_days = (len(items) + PER_DAY - 1) // PER_DAY
    payload = {
        "source": "https://www.youtube.com/watch?v=NQl-SvgfmtY",
        "videoId": VIDEO_ID,
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
