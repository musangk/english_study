#!/usr/bin/env python3
"""
data/sentences.json 의 문장별 재생 구간(t~e)을 문장 단위로 분리한다.

문제:
  자막 한 줄(line)에 여러 문장이 들어 있으면, 추출 단계에서 그 줄의
  시작/끝 시간이 그 줄의 모든 문장에 그대로 부여된다. 그래서 한 문장을
  재생해도 같은 줄의 다른 문장까지 함께 들린다.
  예) 1: 2.3~4.7 / 2: 2.3~8.6 / 3: 4.7~8.6  (구간이 서로 겹침)

처리 대상:
  구간이 겹치는 연속 문장 그룹만. 단독 문장은 손대지 않는다.

분할 방법:
  그룹 전체 구간을 문장 길이(문자 수) 비율로 나눈다. 자막 줄 경계는
  참고 앵커로만 쓰고, 앵커가 비례 분할점에서 TOL 이내일 때만 반영한다.
  (앵커를 무조건 따르면 특정 문장이 0.8초로 눌리는 왜곡이 생긴다)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, "..", "data", "sentences.json")
MIN_DUR = 0.6   # 최소 재생 길이(초)
LEAD = 0.10     # 잘림 방지용 앞 여유(초)
TOL = 0.8       # 앵커를 반영할 최대 보정 폭(초)
EPS = LEAD + 0.05  # 겹침 판정 여유 — LEAD 보다 커야 재실행 시 재분할되지 않는다


def retime_group(g):
    """겹치는 문장 그룹 g 를 문장 길이 비율로 분할 (앵커는 TOL 내에서만 반영)."""
    start = min(s["t"] for s in g)
    end = max(s["e"] for s in g)
    span = end - start
    k = len(g)
    if span < MIN_DUR * k:
        return  # 구간이 너무 짧으면 나누지 않는다
    ws = [max(len(s["en"]), 1) for s in g]
    total = sum(ws)

    cuts, acc, prev = [], 0, start
    for i in range(k - 1):
        acc += ws[i]
        target = start + span * acc / total
        anchor = min(max(target, g[i + 1]["t"]), g[i]["e"])   # 자막 줄 경계
        cut = anchor if abs(anchor - target) <= TOL else target
        lo = prev + MIN_DUR                       # 앞 문장 최소 길이 보장
        hi = end - MIN_DUR * (k - 1 - i)          # 뒤 문장들 자리 확보
        cuts.append(min(max(cut, lo), hi))
        prev = cuts[-1]

    bounds = [start] + cuts + [end]
    for i, s in enumerate(g):
        s["t"] = round(max(0.0, bounds[i] - (LEAD if i else 0)), 2)
        s["e"] = round(max(bounds[i + 1], s["t"] + MIN_DUR), 2)


def main():
    data = json.load(open(PATH, encoding="utf-8"))
    S = data["sentences"]
    n = len(S)
    groups = touched = 0
    i = 0
    while i < n:
        j, end = i + 1, S[i]["e"]
        while j < n and S[j]["t"] < end - EPS:       # 겹치는 동안 그룹 확장
            end = max(end, S[j]["e"])
            j += 1
        if j - i > 1:
            before = [(s["t"], s["e"]) for s in S[i:j]]
            retime_group(S[i:j])
            if any((s["t"], s["e"]) != b for s, b in zip(S[i:j], before)):
                groups += 1
                touched += sum(1 for s, b in zip(S[i:j], before) if (s["t"], s["e"]) != b)
        i = j
    json.dump(data, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"retimed {touched} sentences in {groups} overlapping groups (of {n}) -> {PATH}")


if __name__ == "__main__":
    main()
