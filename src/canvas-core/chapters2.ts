// Chapters 5-11: the golden memory, "Yeah haha.", the interview, the thought clouds, the chess match,
// people get busy, the pattern timeline.
import { Ctx, Env, GRAPHITE, Gfx, P, heart, oval, rng, softBox } from "./core";
import { PLANT_AT, drawBedroom } from "./bedroom";
import { BUBBLE, blit, boxPts, bubble, cachedSet, clamp, cloud, cue, dim, gText, glowAt, ground, lerp, lerpP, newG, polyPts, pop, ramp, SERIF, smooth, UI, wob } from "./kit";
import { JO, Look, Pose, RAE, SAM, breathe, drawChair, drawPerson, footShadow, sitChair, sitCross, sitPhone, stand, standPhone, withExpr } from "./person";
import { drawPhone, Msg } from "./phone";
import { drawPlant } from "./plant";
import { field, ink, pool, W } from "./sets";

const at = (g: Gfx, x: number, y: number, s: number, pose: Pose, L: Look, f: number, o: { shadow?: number; lit?: number; chair?: boolean } = {}) => {
  g.push(x, y, s); if (o.shadow !== 0) footShadow(g, 60, o.shadow ?? 0.28); if (o.chair) drawChair(g); drawPerson(g, breathe(pose, f, L.seed), L, f, { lit: o.lit }); g.pop();
};

// ---------------------------------------------------------------- 5. a golden memory
// "Because once you notice it" -> "And now you're sitting there"
export const ch5Memory = (ctx: Ctx, f: number, env: Env) => {
  const tFirst = cue("They used to text you first."), tRandom = cue("They used to send you random things."), tAsk = cue("They used to ask questions about your life."), tEnth = cue("They used to respond with actual enthusiasm."), tThink = cue("You didn't have to think about what to say."), tTalked = cue("You just talked.");
  drawBedroom(ctx, env, f, "dusk", { lights: 1 });
  const g = newG(ctx, env, f);
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0);
  // Sam cross-legged on the bed, laughing at the phone
  const laugh = Math.sin(f * 0.35) > 0.2 && f > tFirst;
  const pose: Pose = withExpr({ ...sitCross(), elbowR: [34, -100], wristR: [30, -136], handR: "phone", head: [8, -180 + (laugh ? -2 : 0)], tilt: laugh ? -6 : 4 }, { mouth: f > tFirst ? "grin" : "smile", eyes: laugh ? "closed" : "down", look: [4, 4], blush: 0.6 });
  at(g, 560, 716, 1.75, pose, SAM, f, { shadow: 0 });
  const phone: P = [560 + 30 * 1.75, 716 - 150 * 1.75];
  glowAt(ctx, env, phone[0], phone[1], 200, "#ffe2b0", 0.4);
  // their messages float up out of the phone, unprompted, each with a heart
  const msgs: [number, string, "them" | "me"][] = [[tFirst, "you up??", "them"], [tRandom, "lol look at this", "them"], [tAsk, "how did the interview go?!", "them"], [tEnth, "NO WAY that's amazing!!", "them"],
    [tThink, "ok so get this", "me"], [tThink + 18, "STOP", "them"], [tThink + 34, "hahaha", "me"], [tTalked, "wait and then?", "them"], [tTalked + 12, "and then!!", "me"], [tTalked + 22, "i'm crying", "them"]];
  msgs.forEach(([t, s, side], i) => {
    if (f < t) return; const u = (f - t) / 110, k = pop(f, t, 10), y = phone[1] - 60 - u * 520, x = phone[0] + (side === "them" ? 140 : -40) + (i % 3) * 90 + Math.sin(f * 0.04 + i) * 14;
    const a = clamp(1.4 - u * 1.4); if (a <= 0) return;
    bubble(g, x + 120, y, 40 + s.length * 14, 58, { fill: side === "them" ? "#f6e3f0" : BUBBLE.me, shade: side === "them" ? "#d9b6cc" : BUBBLE.meShade, tail: side === "them" ? "l" : "r", text: s, font: UI(25), seed: 500 + i, k, alpha: a });
    if (side === "them") g.group("paint", () => g.wash(heart(x + 120 + (20 + s.length * 7), y - 34, 11), "#f2899c", { alpha: 0.9 * a * k, seed: 520 + i, dx: 0, dy: 0, shrink: 1, rim: false }));
  });
  if (f >= tRandom && f < tRandom + 110) { const u = (f - tRandom) / 110; g.push(phone[0] + 330, phone[1] - 120 - u * 420, pop(f, tRandom + 6, 10)); g.group("plain", () => { g.form(polyPts([[-34, -34], [34, -34], [34, 34], [-34, 34]], 4), "#fbf7ef", "#d9d0c4", { seed: 540 }); g.form(oval(0, 6, 17, 14, 10), "#e8b46a", "#b98a40", { seed: 541 }); }, { alpha: clamp(1.4 - u * 1.4) }); g.pop(); }
  // a remembered warmth: gold at the edges
  dim(ctx, env, "#f6dcb0", 0.28); glowAt(ctx, env, 960, 540, 1100, "#ffe7b8", 0.18);
};

// ---------------------------------------------------------------- 6. "Yeah haha."
// "And now you're sitting there" -> "And somehow you're now three questions deep"
export const ch6YeahHaha = (ctx: Ctx, f: number, env: Env) => {
  const tYeah = cue('"Yeah haha."'), tIts = cue("That's it."), tWhole = cue("That's the whole response."), tThink = cue("So you think,"), tOk = cue('"Okay, maybe I\'ll ask them something."');
  const tQ1 = cue("You ask a question."), tA1 = cue("They answer."), tNo = cue("No question back."), tQ2 = cue("So you ask another."), tA2 = cue("They answer that one too."), tStill = cue("Still nothing.");
  ground(ctx, env, "#e3e1ea");
  const g = newG(ctx, env, f);
  g.group("plain", () => { W(g, oval(960, 540, 1100, 600, 14), "#aab3cc", 1, 0.7, false); W(g, oval(1500, 900, 600, 260, 12), "#c9b8c8", 2, 0.4, false); }, { blur: 60 });
  const msgs: Msg[] = [
    { side: "me", text: "omg i just remembered the thing from last summer", at: 0 }, { side: "me", text: "the boat?? 😭".replace("😭", "!!"), at: 0 },
    { side: "them", text: "Yeah haha.", at: tYeah + 2 },
    { side: "me", text: "what are you up to this weekend?", at: tQ1 + 4 }, { side: "them", text: "nothing much", at: tA1 + 4 },
    { side: "me", text: "any fun plans for the summer?", at: tQ2 + 4 }, { side: "them", text: "not really", at: tA2 + 4 },
  ];
  const draft = f >= tOk && f < tQ1 + 4 ? "what are you up to this weekend?".slice(0, Math.floor((f - tOk) * 0.7)) : f >= tNo + 12 && f < tQ2 + 4 ? "any fun plans for the summer?".slice(0, Math.floor((f - tNo - 12) * 0.7)) : "";
  // "That's it." pushes in on the bubble
  const push = ramp(f, tIts, tIts + 16) * (1 - ramp(f, tThink, tThink + 16));
  drawPhone(g, ctx, env, f, { cx: 960 + wob(f, 3, 0.02) * 5 + push * 160, cy: 500 + wob(f, 5, 0.02) * 4 - push * 120, k: 0.86 + push * 0.3, tilt: -2 + wob(f, 7, 0.015), title: "Jo", avatar: "#8aa6c9", msgs, draft, caret: true, dim: 0 });
  void tWhole; void tStill;
};

// ---------------------------------------------------------------- 7. the interview
// "And somehow you're now three questions deep" (5 s)
export const ch7Interview = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("And somehow you're now three questions deep");
  blit(ctx, cachedSet(env, "interview", (g, c) => {
    c.fillStyle = "#3a3448"; c.fillRect(0, 0, env.W, env.H);
    pool(g, 960, 500, 760, 420, "#6e6487", 0.8, 1); field(g, boxPts(-30, 760, 1950, 1110, 8), "#4a4158", 2);
    const desk = polyPts([[560, 700], [1360, 700], [1400, 760], [520, 760]], 6), front = boxPts(560, 760, 1360, 900, 6);
    g.group("paint", () => { g.form(desk, "#a97c5f", "#7a5644", { seed: 3 }); g.form(front, "#8f6650", "#634434", { seed: 4 }); });
    g.group("ink", () => { ink(g, desk, 5, 2.6); ink(g, front, 6, 2.6); });
  }));
  const g = newG(ctx, env, f);
  glowAt(ctx, env, 960, 420, 700, "#fff1c8", 0.22);
  // Sam the interviewer (left) with cards and a mic; them (right) on the phone, mirrored
  at(g, 640, 860, 1.25, withExpr(sitChair(), { mouth: "o", brows: 0.4, look: [6, 0] }), SAM, f, { chair: true, shadow: 0 });
  at(g, 1280, 860, 1.25, { ...withExpr(sitPhone(), { eyes: "down", mouth: "flat" }), flip: true }, JO, f, { chair: true, shadow: 0 });
  // the mic and a stack of question cards on the desk
  g.group("paint", () => { g.form(polyPts([[880, 700], [892, 610], [902, 610], [914, 700]], 4), "#4a4a56", "#2e2e38", { seed: 30 }); g.form(oval(897, 596, 20, 26, 10), "#6a6a78", "#3e3e4a", { seed: 31 }); [0, 1, 2].forEach((i) => g.form(polyPts([[700 + i * 3, 690 - i * 5], [800 + i * 3, 686 - i * 5], [802 + i * 3, 700 - i * 5], [702 + i * 3, 704 - i * 5]], 4), "#fbf7ef", "#d9d0c4", { seed: 32 + i })); });
  g.group("ink", () => { g.pen(oval(897, 596, 20, 26, 10), { closed: true, w: 2, seed: 35 }); g.pen([[897, 622], [897, 700]], { w: 2.4, seed: 36 }); });
  bubble(g, 760, 300, 330, 80, { fill: BUBBLE.me, shade: BUBBLE.meShade, tail: "r", text: "question #3:", font: UI(30), seed: 40, k: pop(f, t0 + 6, 10) });
  bubble(g, 1210, 380, 140, 70, { fill: BUBBLE.them, shade: BUBBLE.themShade, tail: "l", text: "mhm", font: UI(30), seed: 41, k: pop(f, t0 + 50, 10) });
};

// ---------------------------------------------------------------- 8. thought clouds: "Maybe I'm..."
// "At some point, you have to stop blaming yourself" -> "And suddenly you're treating"
export const ch8Clouds = (ctx: Ctx, f: number, env: Env) => {
  const lines: [string, string, P, number, number][] = [
    ["Maybe I'm being annoying.", "am I annoying?", [430, 170], 380, 110], ["Maybe I'm texting too much.", "texting too much?", [1000, 120], 400, 110],
    ["Maybe I should give them more space.", "more space?", [1520, 210], 340, 110], ["Maybe I said something weird.", "said something weird?", [760, 330], 430, 120],
    ["Maybe I should wait longer before responding.", "wait longer?", [1280, 380], 330, 110], ["Maybe I need to act like I care less.", "care less?", [330, 430], 300, 100],
  ];
  const tBlame = cue("At some point, you have to stop blaming yourself"), tBrain = cue("Because that's usually where your brain goes.");
  drawBedroom(ctx, env, f, "night", { lights: 0.55 });
  const g = newG(ctx, env, f);
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0.66);
  // Sam on the bed, hunched, phone face-down on the quilt
  const crowd = lines.filter(([p]) => f >= cue(p)).length / lines.length;
  const pose = withExpr({ ...sitChair(), head: [12, -228 + crowd * 8], tilt: 10 + crowd * 6, chest: [8, -182 + crowd * 4], elbowL: [16, -136], wristL: [44, -124], elbowR: [30, -136], wristR: [52, -122] }, { eyes: crowd > 0.5 ? "half" : "open", brows: -0.4 - crowd * 0.5, mouth: crowd > 0.3 ? "sad" : "flat", look: [2, -4] });
  at(g, 610, 886, 1.75, pose, SAM, f, { shadow: 0.3 });
  g.group("paint", () => g.form(polyPts([[760, 676], [818, 672], [820, 684], [762, 688]], 4), "#3a3a44", "#22222a", { seed: 60 }));
  lines.forEach(([p, s, c, w, h], i) => { const t = cue(p); cloud(g, c[0] + wob(f, 70 + i, 0.03) * 8, c[1] + wob(f, 80 + i, 0.03) * 6, w, h, { k: pop(f, t, 10), text: s, seed: 90 + i * 7, font: SERIF(30), from: i === 3 ? [700, 400] : undefined }); });
  void tBlame; void tBrain;
};

// ---------------------------------------------------------------- 9. the chess match
// "And suddenly you're treating a casual conversation like a chess match." -> "And here's the thing."
const piece = (g: Gfx, x: number, y: number, mine: boolean, seed: number, o: { king?: boolean; fallen?: number; text?: string } = {}) => {
  const fall = o.fallen ?? 0;
  g.push(x, y, 0.9 + (y - 230) / 560 * 0.9, fall * 1.4);
  const base = oval(0, 0, 22, 8, 10), body = polyPts([[-14, 0], [-10, -44], [10, -44], [14, 0]], 4), head = softBox(0, -60, 52, 38, 4, 18);
  g.group("paint", () => { g.form(base, mine ? "#9fbfdc" : "#a996bd", mine ? "#6f93c4" : "#7b6a96", { seed }); g.form(body, mine ? "#cfe3f5" : "#d6c6e2", mine ? "#9fbfdc" : "#a996bd", { seed: seed + 1 }); g.form(head, mine ? "#cfe3f5" : "#e6dcef", mine ? "#9fbfdc" : "#b9a8cc", { seed: seed + 2 }); if (o.king) g.form(polyPts([[-14, -80], [-14, -96], [-6, -88], [0, -100], [6, -88], [14, -96], [14, -80]], 3), "#f2c46b", "#c9973a", { seed: seed + 3 }); });
  g.group("ink", () => { g.pen(base, { closed: true, w: 1.8, seed: seed + 4, opacity: 0.8 }); g.pen(body, { closed: true, w: 1.8, seed: seed + 5, opacity: 0.8 }); g.pen(head, { closed: true, w: 1.8, seed: seed + 6, opacity: 0.8 }); });
  if (o.text) g.group("plain", () => gText(g, o.text!, 0, -60, { font: UI(17), color: "#3a3440" }));
  g.pop();
};
export const ch9Chess = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("And suddenly you're treating"), tFour = cue("They took four hours to respond"), tSent = cue("They sent one sentence"), tRead = cue("They left you on read"), tWhy = cue("Why?"), tWrong = cue("If talking to someone requires this much strategy");
  // the board seen from above and in front: rows shrink toward the back
  blit(ctx, cachedSet(env, "chess", (g, c) => {
    c.fillStyle = "#e9dcc8"; c.fillRect(0, 0, env.W, env.H);
    field(g, boxPts(-30, -30, 1950, 1110, 8), "#c9a283", 1); pool(g, 860, 520, 800, 420, "#e8c7a2", 0.6, 2);
    const q = (u: number, v: number): P => { const y = 230 + Math.pow(v, 1.15) * 560, half = 240 + v * 150; return [800 + (u - 0.5) * 2 * half, y]; };
    const sq: P[][] = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) sq.push([q(i / 8, j / 8), q((i + 1) / 8, j / 8), q((i + 1) / 8, (j + 1) / 8), q(i / 8, (j + 1) / 8)]);
    const edge = [q(0, 0), q(1, 0), q(1, 1), q(0, 1)];
    g.group("paint", () => { g.form(polyPts(edge.map(([x, y]) => [x + (x - 800) * 0.04, y + (y > 500 ? 18 : -14)] as P), 6), "#8f6650", "#634434", { seed: 3 }); W(g, polyPts(edge, 6), "#f3e6cf", 4, 0.97); sq.forEach((s, i) => W(g, polyPts(s, 2), "#a98a6e", 10 + i, 0.85, false)); });
    g.group("ink", () => { ink(g, polyPts(edge, 6), 5, 2.4); });
    // the chess clock
    const box = polyPts([[1330, 470], [1690, 470], [1700, 640], [1320, 640]], 5);
    g.group("paint", () => g.form(box, "#7a5a8a", "#4e3a5c", { seed: 6 })); g.group("ink", () => ink(g, box, 7, 2.6));
  }));
  const g = newG(ctx, env, f);
  const q = (u: number, v: number): P => { const y = 230 + Math.pow(v, 1.15) * 560, half = 240 + v * 150; return [800 + (u - 0.5) * 2 * half, y]; };
  const cell = (i: number, j: number) => q((i + 0.5) / 8, (j + 0.75) / 8);
  // pieces: theirs at the back, mine at the front; moves happen on cue
  const theirs: [number, number][] = [[1, 1], [3, 1], [5, 0], [6, 1]], mine: [number, number][] = [[2, 6], [4, 6], [5, 7], [6, 6]];
  const tMove = lerpP(cell(3, 1), cell(3, 3), ramp(f, tFour + 4, tFour + 20)), mMove = lerpP(cell(4, 6), cell(4, 4), ramp(f, tFour + 50, tFour + 66));
  const tOne = lerpP(cell(6, 1), cell(6, 3), ramp(f, tSent + 4, tSent + 18)), mOne = lerpP(cell(6, 6), cell(5, 4), ramp(f, tSent + 40, tSent + 56));
  const all: [P, boolean, number, object][] = [];
  theirs.forEach(([i, j], k) => all.push([k === 1 ? tMove : k === 3 ? tOne : cell(i, j), false, 600 + k * 10, k === 3 && f > tSent + 4 ? { text: "k." } : {}]));
  mine.forEach(([i, j], k) => all.push([k === 1 ? mMove : k === 3 ? mOne : cell(i, j), true, 700 + k * 10, k === 2 ? { king: true, fallen: ramp(f, tRead + 18, tRead + 34) } : k === 3 && f > tSent + 40 ? { text: "ok." } : {}]));
  all.sort((a, b) => a[0][1] - b[0][1]).forEach(([p, m, s, o]) => piece(g, p[0], p[1], m, s, o));
  // the clock faces: theirs runs four hours, then mine five; "Why?" stops both
  const stop = f >= tWhy;
  const face = (cx: number, label: string, hours: number, active: boolean, seed: number) => {
    const ang = -Math.PI / 2 + (hours / 12) * Math.PI * 2;
    g.group("paint", () => { g.form(oval(cx, 556, 62, 62, 14), active ? "#fff6dc" : "#f3ead9", "#d9c9a8", { seed }); });
    g.group("ink", () => { g.pen(oval(cx, 556, 62, 62, 14), { closed: true, w: 2.4, seed: seed + 1 }); g.pen([[cx, 556], [cx + Math.cos(ang) * 46, 556 + Math.sin(ang) * 46]], { w: 3, seed: seed + 2, retrace: false }); g.pen([[cx, 556], [cx + Math.cos(ang * 12) * 30, 556 + Math.sin(ang * 12) * 30]], { w: 2, seed: seed + 3, retrace: false, opacity: 0.7 }); });
    g.group("plain", () => gText(g, label, cx, 450, { font: UI(26, 600), color: "#4a3a52" }));
  };
  const theirH = lerp(0, 4, ramp(f, tFour, tFour + 30)), myH = lerp(0, 5, ramp(f, tFour + 36, tFour + 70)) + (stop ? 0 : 0);
  face(1420, "Jo · 4h", theirH, f >= tFour && f < tFour + 32, 800); face(1600, "you · 5h", myH, f >= tFour + 34 && !stop, 810);
  if (f >= tRead) g.push(1060, 260, pop(f, tRead + 4, 10), -0.15), g.group("plain", () => { g.form(softBox(0, 0, 150, 56, 4, 18), "#f7e4e4", "#d9a9a9", { seed: 830 }); gText(g, "Read", 0, 1, { font: UI(30, 600), color: "#b04a4a" }); }), g.pop();
  if (stop) { g.push(800, 440, pop(f, tWhy, 10)); g.group("ink", () => { g.pen([[-50, -70], [-30, -110], [20, -116], [50, -80], [30, -40], [0, -16], [0, 20]], { w: 9, seed: 840, wobble: 0.6 }); g.pen(oval(0, 52, 8, 8, 8), { closed: true, w: 9, seed: 841 }); }, { alpha: 1 - ramp(f, tWrong + 40, tWrong + 60) }); g.pop(); }
  if (f >= tWrong) dim(ctx, env, "#b9a9b9", 0.35 * ramp(f, tWrong, tWrong + 40));
  void t0;
};

// ---------------------------------------------------------------- 10. people get busy
// "And here's the thing." -> "It's the pattern that matters."
const panel = (g: Gfx, x0: number, y0: number, x1: number, y1: number, k: number, seed: number, bg: string, inner: () => void) => {
  if (k <= 0.01) return; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  g.push(cx, cy, k); g.push(-cx, -cy, 1);
  const b = boxPts(x0, y0, x1, y1, 8);
  g.group("paint", () => g.form(b, bg, bg, { seed, light: [-3, -3] }));
  inner();
  g.group("ink", () => g.pen(b, { closed: true, w: 3, seed: seed + 1, wobble: 0.5 }));
  g.pop(); g.pop();
};
export const ch10Busy = (ctx: Ctx, f: number, env: Env) => {
  const tBusy = cue("People get busy."), tTired = cue("People get tired."), tStuff = cue("People have stuff going on."), tSlow = cue("A slow response does not automatically mean"), tDry = cue("One dry text doesn't mean anything."), tFew = cue("Even a few weird conversations");
  ground(ctx, env, "#f4ecdd");
  const g = newG(ctx, env, f);
  pool(g, 960, 540, 900, 500, "#efdcc0", 0.6, 1);
  // three panels: Rae at her desk under paperwork, Jo asleep on the bus, Rae again, carrying a box (moving house)
  panel(g, 90, 110, 650, 640, pop(f, Math.min(tBusy, cue("And here's the thing") + 8), 12), 10, "#e6eef3", () => {
    g.group("paint", () => { g.form(polyPts([[180, 520], [560, 520], [560, 540], [180, 540]], 6), "#a97c5f", "#7a5644", { seed: 11 }); for (let i = 0; i < 6; i++) g.form(polyPts([[420 + (i % 2) * 4, 516 - i * 14], [540, 516 - i * 14], [540, 504 - i * 14], [420, 504 - i * 14]], 3), "#fbf7ef", "#d9d0c4", { seed: 12 + i }); g.form(polyPts([[240, 518], [330, 518], [342, 470], [252, 470]], 3), "#55525e", "#33313b", { seed: 20 }); });
    at(g, 300, 630, 0.95, withExpr({ ...sitChair(), wristR: [40, -132], wristL: [30, -128] }, { brows: -0.5, mouth: "flat", eyes: "down", look: [6, 4] }), RAE, f, { chair: true, shadow: 0 });
  });
  panel(g, 680, 110, 1240, 640, pop(f, tTired, 12), 30, "#ede4f2", () => {
    g.group("paint", () => { g.form(boxPts(720, 150, 1200, 330, 6), "#cfe0ee", "#a9c3d6", { seed: 31 }); g.form(boxPts(880, 380, 1020, 600, 6), "#7d8fb0", "#5a6a8a", { seed: 32 }); });
    g.group("ink", () => { ink(g, boxPts(720, 150, 1200, 330, 6), 33, 2); [880, 1040].forEach((x, i) => ink(g, [[x, 150], [x, 330]], 34 + i, 1.8, false)); });
    at(g, 940, 630, 0.95, withExpr({ ...sitChair(), head: [12, -226], tilt: 18 }, { eyes: "closed", mouth: Math.sin(f * 0.05) > 0.6 ? "o" : "soft", brows: 0 }), JO, f, { shadow: 0 });
    if (f > tTired + 20) g.group("plain", () => gText(g, "z", 1060 + Math.sin(f * 0.05) * 6, 300 - ((f - tTired) % 60), { font: SERIF(40), color: "#6f6680", alpha: 0.7 }));
  });
  panel(g, 1270, 110, 1830, 640, pop(f, tStuff, 12), 50, "#f6e9d6", () => {
    const box = polyPts([[1480, 420], [1630, 420], [1630, 540], [1480, 540]], 4);
    at(g, 1500, 630, 0.95, withExpr({ ...stand(), elbowR: [40, -150], wristR: [70, -150], elbowL: [30, -150], wristL: [60, -146], handL: "open", handR: "open" }, { brows: -0.3, mouth: "o", look: [6, 0] }), RAE, f);
    g.group("paint", () => g.form(box, "#d9b48a", "#b08a62", { seed: 51 })); g.group("ink", () => { ink(g, box, 52, 2.4); ink(g, [[1480, 450], [1630, 450]], 53, 1.6, false, 0.6); });
  });
  // a late reply that still comes back, with a heart; then a dry one that means nothing
  bubble(g, 760, 790, 470, 76, { fill: "#f6e3f0", shade: "#d9b6cc", tail: "l", text: "sorry just saw this!! how are you", font: UI(28), seed: 60, k: pop(f, tSlow + 30, 12) });
  if (f > tSlow + 40) g.group("paint", () => g.wash(heart(1010, 760, 14), "#f2899c", { alpha: 0.9, seed: 61, dx: 0, dy: 0, shrink: 1, rim: false }));
  bubble(g, 1250, 830, 110, 66, { fill: BUBBLE.them, shade: BUBBLE.themShade, tail: "l", text: "k", font: UI(30), seed: 62, k: pop(f, tDry + 6, 12) });
  void tFew;
};

// ---------------------------------------------------------------- 11. the pattern timeline
// "It's the pattern that matters." -> "Because when someone genuinely wants to talk to you"
export const ch11Pattern = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("It's the pattern that matters."), tStart = cue("It's when you realize you're always the one starting"), tAsk = cue("You're always the one asking the questions."), tStop = cue("And whenever you stop..."), tNothing = cue("nothing happens."), tTells = cue("That's the part that tells you everything.");
  ground(ctx, env, "#f5eee0");
  const g = newG(ctx, env, f);
  pool(g, 960, 540, 1000, 420, "#ece2cf", 0.6, 1);
  const DAY = 300, YOU = 400, THEMY = 640, stopDay = 9;
  // the camera scrolls along the days, and keeps scrolling over blank paper after you stop
  const cam = lerp(0, DAY * 7, smooth((f - t0) / (tTells + 30 - t0)));
  g.push(-cam, 0, 1);
  g.group("ink", () => { ink(g, [[0, 520], [DAY * 16, 522]], 1, 1.6, false, 0.5); for (let d = 0; d < 16; d++) { ink(g, [[200 + d * DAY, 506], [200 + d * DAY, 536]], 2 + d, 1.6, false, 0.5); } });
  g.group("plain", () => { for (let d = 0; d < 16; d++) gText(g, `day ${d + 1}`, 200 + d * DAY, 556, { font: SERIF(22), color: "#8a8090" }); });
  const r = rng(77);
  for (let d = 0; d < stopDay; d++) {
    const nMe = 2 + (d % 2), nThem = d < 2 ? 2 : d < 5 ? 1 : 0;
    for (let i = 0; i < nMe; i++) { const x = 150 + d * DAY + i * 92, y = YOU - i * 30 - (r() * 24); bubble(g, x, y, 84 + r() * 40, 64, { fill: BUBBLE.me, shade: BUBBLE.meShade, tail: "r", seed: 900 + d * 10 + i }); }
    for (let i = 0; i < nThem; i++) { const sz = d < 2 ? 1 : 0.6; bubble(g, 170 + d * DAY + i * 92, THEMY + i * 24, (84 + r() * 30) * sz, 62 * sz, { fill: BUBBLE.them, shade: BUBBLE.themShade, tail: "l", seed: 960 + d * 10 + i }); }
    // "you started it" circles, one per day, drawn on cue
    const circ = ramp(f, tStart + d * 6, tStart + d * 6 + 14);
    if (circ > 0) g.group("ink", () => g.pen(oval(140 + d * DAY, YOU - 4, 50, 38, 12), { closed: true, w: 2.4, color: "#c4525a", seed: 1000 + d, progress: circ, wobble: 1.2, opacity: 0.85 }));
    const qm = ramp(f, tAsk + d * 6, tAsk + d * 6 + 10);
    if (qm > 0) g.group("plain", () => gText(g, "?", 190 + d * DAY + 30, YOU - 70, { font: SERIF(40), color: "#c4525a", alpha: qm }));
  }
  if (f >= tTells) g.group("ink", () => { const x = 200 + DAY * 11.4; g.pen([[x - 20, 420], [x + 280, 418]], { w: 2, color: "#c4525a", seed: 1100, progress: ramp(f, tTells, tTells + 20), opacity: 0.8 }); });
  g.pop();
  // the lane labels stay put
  g.group("plain", () => { g.fill(boxPts(-10, 300, 130, 760, 6), "#f5eee0", 0.92); gText(g, "you", 64, YOU, { font: SERIF(38), color: "#4f6f9f" }); gText(g, "Jo", 64, THEMY, { font: SERIF(38), color: "#7b6a96" }); }, { blur: 0 });
  if (f >= tTells) g.group("plain", () => gText(g, "stop.", 1460, 300, { font: SERIF(64), color: "#c4525a", alpha: ramp(f, tTells + 10, tTells + 26) }));
  void tStop; void tNothing; void GRAPHITE; void JO; void standPhone; void sitPhone; void dim; void clamp;
};
