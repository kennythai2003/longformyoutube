# notes/verify_cues.py: speech should begin at each cue start (loudness before vs after).
import json, sys, array, math
SR = 16000
a = array.array('h'); a.frombytes(open(sys.argv[1], 'rb').read())
def rms(t0, t1):
    i0, i1 = max(0, int(t0 * SR)), min(len(a), int(t1 * SR))
    if i1 <= i0: return 1e-9
    return math.sqrt(sum(x * x for x in a[i0:i1]) / (i1 - i0)) + 1e-9
cues = json.load(open('notes/cues.json')); bad = []
for i, c in enumerate(cues):
    if i == 0: continue
    s = c['start']; pre, post = rms(s - 0.25, s - 0.05), rms(s + 0.05, s + 0.6)
    db = 20 * math.log10(post / pre)
    if db < 6: bad.append((i, s, round(db, 1), c['text'][:50]))
print(f"{len(cues) - 1 - len(bad)} of {len(cues) - 1} cue starts pass (speech >= 6 dB louder just after than just before)")
for b in bad: print("  borderline", "#%d at %d:%05.2f (%+.1f dB) %s" % (b[0], b[1] // 60, b[1] % 60, b[2], b[3]))
