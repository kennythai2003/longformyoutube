# notes/align.py: align script lines to the voiceover's pauses. Usage: python3 notes/align.py <duration_seconds>
import re, json, math, bisect, sys
T = float(sys.argv[1])
lines = [l.strip() for l in open('notes/script.txt') if l.strip()]
S, cur = [], None
for l in open('notes/silences_fine.txt'):
    m = re.search(r'silence_start: ([\d.]+)', l)
    if m: cur = float(m.group(1))
    m = re.search(r'silence_end: ([\d.]+)', l)
    if m: S.append((cur, float(m.group(1))))
cands = [(0.0, 0.0, 's')]; t = 0.0                     # boundaries: pause midpoints (free), points inside speech (penalised)
for a, b in S:
    x = t + 0.25
    while x < a - 0.1: cands.append((x, 2.5, 'in')); x += 0.25
    cands.append(((a + b) / 2, 0.0, 'gap')); t = b
x = t + 0.25
while x < T - 0.1: cands.append((x, 2.5, 'in')); x += 0.25
cands.append((T, 0.0, 'e')); times = [c[0] for c in cands]
def speech(a, b):
    s = b - a
    for g0, g1 in S:
        if g1 <= a: continue
        if g0 >= b: break
        s -= max(0, min(b, g1) - max(a, g0))
    return s
chars = [len(re.sub(r'[^A-Za-z0-9]', '', l)) + 2 for l in lines]
rate = speech(0, T) / sum(chars); L, C, INF = len(lines), len(cands), 1e18
dp = [[INF] * C for _ in range(L + 1)]; bk = [[0] * C for _ in range(L + 1)]; dp[0][0] = 0
for i in range(1, L + 1):
    e = chars[i - 1] * rate
    for j in range(1, C):
        tj = times[j]; lo = bisect.bisect_left(times, tj - 3.2 * e - 1.5); hi = bisect.bisect_right(times, tj - 0.35 * e)
        best, bj, row = INF, 0, dp[i - 1]
        for k in range(lo, min(hi, j)):
            if row[k] >= INF: continue
            d = speech(times[k], tj)
            if d <= 0.05: continue
            c = row[k] + 4 * (math.log(d / e)) ** 2
            if c < best: best, bj = c, k
        if best < INF: dp[i][j] = best + cands[j][1]; bk[i][j] = bj
j, out = C - 1, []
for i in range(L, 0, -1):
    k = bk[i][j]; out.append({"text": lines[i - 1], "start": round(times[k], 3), "end": round(times[j], 3)}); j = k
json.dump(out[::-1], open('notes/cues.json', 'w'), indent=1)
