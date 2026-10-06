import { Ctx, Env } from "./core";
import { PALS, PLANT_AT, drawBedroom } from "./bedroom";
import { cloud, cue, glowAt, lerp, newG, pop, ramp, smooth } from "./kit";
import { SAM, breathe, drawPerson, footShadow, mixPose, sitPhone, stand, standPour, withExpr } from "./person";
import { drawPlant } from "./plant";
import { GRAPHITE, P, oval, softBox, heart, tube } from "./core";
import { Gfx } from "./core";
import { BUBBLE, blit, bubble, clamp, ground, lerpP, lin, UI, gText, polyPts, typingDots, wob } from "./kit";
import { JO, Pose, standPhone, walk } from "./person";
import { duskSet, streetSet, W as Wash, ink as inkS } from "./sets";
import { drawPhone, Msg } from "./phone";
// Chapters, one function per scene: (ctx, frame, env), frame = the FILM's frame so events fire on cue().

// ---------------------------------------------------------------- 4. the bedroom at night
// "And eventually you catch yourself thinking" -> "Because once you notice it"
export const ch4Bedroom = (ctx: Ctx, f: number, env: Env) => {
  const tWhy = cue('"Why am I doing all of this?"'), tHard = cue("Why am I working this hard"), tStep = cue("That's when you need to take a step back"), tHardest = cue("Because sometimes the hardest thing"), tAlive = cue("You're the one keeping it alive"), tHorrible = cue("And I know that's a horrible realization");
  drawBedroom(ctx, env, f, "night", { lights: 1 - 0.35 * ramp(f, tHardest, tHorrible) });
  const g = newG(ctx, env, f);
  // the plant: drooping as the chapter goes on; propped up while Sam holds it, then let go
  const held = ramp(f, tAlive + 10, tAlive + 30) * (1 - ramp(f, tHorrible + 20, tHorrible + 40));
  const wilt = lerp(0.42, 0.62, ramp(f, tHardest, tAlive)) - held * 0.3 + ramp(f, tHorrible + 20, tHorrible + 60) * 0.06;
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, wilt);
  // Sam: on the bed with the phone -> stands, steps back -> crosses to the window and holds the plant up
  const S = 1.75, seated = withExpr(sitPhone(), { eyes: f > tWhy - 12 && f < tStep ? "half" : "down", brows: f > tWhy - 12 ? -0.6 : -0.2, mouth: f > tWhy ? "flat" : "soft" });
  const up = ramp(f, tStep, tStep + 20), back = ramp(f, tStep + 12, tStep + 44), toPlant = ramp(f, tAlive - 34, tAlive + 8);
  const standing = withExpr(stand(), { brows: -0.5, mouth: "flat", look: [2, -2] }), atPlant = withExpr(standPour(), { brows: -0.3, eyes: "open", look: [6, -4], mouth: "flat" });
  let pose = up < 1 ? mixPose(seated, standing, up) : toPlant > 0 ? mixPose(standing, atPlant, toPlant) : standing;
  pose = breathe(pose, f, SAM.seed);
  const x = 610 - back * 120 + toPlant * 900, feet = lerp(886, 892, up);
  g.push(x, feet, S); footShadow(g, 64, 0.3); drawPerson(g, pose, SAM, f, { lit: up < 1 ? 1 : 0.3 }); g.pop();
  // the phone's light on Sam's face while seated
  if (up < 1) glowAt(ctx, env, x + 46 * S, feet - 150 * S, 150, "#cfe4ff", 0.42 * (1 - up) * (0.92 + 0.08 * Math.sin(f * 0.3)));
  // the thought clouds
  const c1 = pop(f, tWhy, 10) * (1 - smooth((f - tStep) / 14)), c2 = pop(f, tHard, 10) * (1 - smooth((f - tStep) / 14));
  if (c1 > 0) cloud(g, 960 + Math.sin(f * 0.05) * 6, 300 + Math.sin(f * 0.04) * 5, 470, 150, { k: c1, from: [x + 30, feet - 300 * S + 20], text: "why am I doing all of this?", seed: 31 });
  if (c2 > 0) cloud(g, 1010 + Math.sin(f * 0.045 + 1) * 6, 120 + Math.sin(f * 0.05 + 2) * 4, 400, 120, { k: c2, text: "why this hard?", seed: 37, font: undefined });
  void PALS;
};

// ================================================================ shared bits for 1-3

const tag = (g: Gfx, x: number, y: number, s: string, k: number, alpha = 1) => { if (k <= 0.01) return; g.push(x, y, k); g.group("plain", () => { g.form(softBox(0, 0, 18 + s.length * 13, 34, 4, 18), "#f7f2ea", "#d9d0c4", { seed: 70 }); gText(g, s, 0, 1, { font: UI(19), color: "#6b6670" }); }, { alpha }); g.group("ink", () => g.pen(softBox(0, 0, 18 + s.length * 13, 34, 4, 18), { closed: true, w: 1.5, seed: 71, wobble: 0.3, opacity: 0.6, retrace: false }), { alpha }); g.pop(); };

// ---------------------------------------------------------------- 1. the street: carrying an empty speech bubble like a sack
export const ch1Street = (ctx: Ctx, f: number, env: Env) => {
  const tNotice = cue("You just start noticing little things"), tDiff = cue("The conversation feels different"), tEnd = cue("You used to open your phone");
  blit(ctx, streetSet(env));
  const g = newG(ctx, env, f);
  // them, across the road, on their phone; never looks up
  const tp = breathe(withExpr(standPhone(), { eyes: "down", mouth: "flat" }), f, JO.seed);
  g.push(1330, 592, 0.72); footShadow(g, 50, 0.25); drawPerson(g, { ...tp, flip: true }, JO, f); g.pop();
  tag(g, 1330, 340, "Seen", pop(f, tNotice + 6, 10), 1 - ramp(f, tDiff + 30, tDiff + 44));
  const dots = pop(f, tNotice + 34, 8) * (1 - ramp(f, tNotice + 64, tNotice + 72));
  if (dots > 0) { tag(g, 1420, 300, "   ", dots); typingDots(g, f, 1420, 300, 0.7); }
  // Sam walks left to right with the sack; it gets heavier
  const heavy = ramp(f, tDiff, tDiff + 30), ph = (f / tEnd) * 5.4, x = 120 + (f / tEnd) * 980;
  let p: Pose = walk(ph, { mouth: "flat", brows: -0.2 - heavy * 0.4, eyes: "open", look: [3, 1] });
  const S = 1.42, swing = Math.sin(ph * Math.PI * 4) * 0.035;
  // the sack: an empty speech bubble slung over the shoulder, behind the back; its tail runs forward over
  // the shoulder into Sam's fist, so the hand is really holding it
  const sk: P = [-70, -232 + heavy * 22], rot = -0.36 + swing - heavy * 0.1;
  const W2 = (q: P): P => [sk[0] + q[0] * Math.cos(rot) - q[1] * Math.sin(rot), sk[1] + q[0] * Math.sin(rot) + q[1] * Math.cos(rot)];
  // the sack's twisted neck runs from the bubble's corner, over the shoulder, into Sam's fist at the chest
  const grip: P = [p.chest[0] + 26, p.chest[1] + 44], over: P = [p.chest[0] - 6, p.chest[1] + 10], from: P = [p.chest[0] - 40, p.chest[1] + 2];
  p = { ...p, chest: [p.chest[0] + 6 + heavy * 8, p.chest[1] + heavy * 6], head: [p.head[0] + 9 + heavy * 10, p.head[1] + heavy * 10], elbowR: [p.chest[0] + 34, p.chest[1] + 66], wristR: [grip[0] + 4, grip[1] + 2], handR: "rest" };
  g.push(x, 882, S); footShadow(g, 60, 0.3);
  g.push(sk[0], sk[1], 1, rot);
  bubble(g, 0, 0, 190, 132, { fill: "#fbf7ef", shade: "#cfc4b2", tail: "none", seed: 81 });
  g.group("ink", () => { [-30, 0, 30].forEach((x, i) => g.pen(oval(x, 4, 5, 5, 6), { closed: true, w: 3, seed: 83 + i, opacity: 0.35, retrace: false })); });
  g.pop();
  drawPerson(g, p, SAM, f);
  // the neck goes over the shoulder, in front of the hoodie; the fist closes on it
  const neck = tube([from, over, grip], 8, 6, false); void W2;
  g.group("paint", () => g.form(neck, "#fbf7ef", "#cfc4b2", { seed: 86, light: [-2, -3] }));
  g.group("ink", () => { g.pen(neck, { closed: true, w: 2.2, seed: 87, wobble: 0.3, opacity: 0.85 }); [0.35, 0.7].forEach((t, i) => { const a = lerpP(from, over, t); g.pen([[a[0] - 5, a[1] - 6], [a[0] + 5, a[1] + 6]], { w: 1.3, seed: 88 + i, opacity: 0.45, retrace: false }); }); });
  const fist = oval(grip[0] + 2, grip[1] + 2, 9, 8, 10);
  g.group("paint", () => g.form(fist, SAM.skin, SAM.skinShade, { seed: 90, light: [-2, -2] }));
  g.group("ink", () => { g.pen(fist, { closed: true, w: 1.8, seed: 91, wobble: 0.3 }); [-3, 1, 5].forEach((d, i) => g.pen([[grip[0] + 6, grip[1] + d - 2], [grip[0] + 10, grip[1] + d - 1]], { w: 1, seed: 92 + i, opacity: 0.6, retrace: false })); });
  g.pop();
};

// ---------------------------------------------------------------- 2. the phone close-up: their name, then the dry chat
const HISTORY: Msg[] = [
  { side: "them", text: "haha yeah", at: 0 }, { side: "me", text: "how was the trip??", at: 0 }, { side: "them", text: "good", at: 0 },
  { side: "me", text: "did you see the lake?", at: 0 }, { side: "them", text: "ya", at: 0 },
];
const typed = (f: number, from: number, words: string[], cps = 0.5) => {
  // type each phrase, pause, delete it, next
  let t = f - from; if (t < 0) return "";
  for (const w of words) { const typeF = w.length / cps, hold = 16, delF = w.length / (cps * 2.4), total = typeF + hold + delF + 6; if (t < total) { if (t < typeF) return w.slice(0, Math.floor(t * cps)); if (t < typeF + hold) return w; if (t < typeF + hold + delF) return w.slice(0, Math.max(0, w.length - Math.floor((t - typeF - hold) * cps * 2.4))); return ""; } t -= total; }
  return "";
};
export const ch2Phone = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("You used to open your phone"), t1 = cue("Now you open the chat"), t2 = cue("And that's when you realize something."), t3 = cue("You're not having a conversation anymore."), t4 = cue("You're trying to create one."), t5 = cue("There's a huge difference.");
  const cool = ramp(f, t1, t1 + 14);
  ground(ctx, env, "#efe3d2");
  const g = newG(ctx, env, f);
  g.group("plain", () => { Wash(g, oval(960, 540, 1100, 600, 14), cool > 0.5 ? "#b7bfd6" : "#f2d3a8", 1, 0.7, false); Wash(g, oval(400, 900, 600, 260, 12), "#d9b8a8", 2, 0.4, false); }, { blur: 60 });
  const msgs: Msg[] = [...HISTORY, { side: "me", text: "also!!", at: t3 + 4 }, { side: "me", text: "oh and remember that place?", at: t3 + 22 }, { side: "me", text: "the one with the noodles", at: t3 + 40 }, { side: "me", text: "anyway", at: t4 + 10, read: t5 }];
  const draft = f < t2 ? typed(f, t1 + 26, ["so what are you up to", "did you", "hey"]) : f >= t4 + 30 && f < t5 ? typed(f, t4 + 30, ["haha"]) : "";
  drawPhone(g, ctx, env, f, { cx: 960 + wob(f, 3, 0.02) * 6, cy: 500 + wob(f, 5, 0.02) * 5, k: 0.86, tilt: -3 + wob(f, 7, 0.015) * 1.2, title: "Jo", avatar: "#8aa6c9", msgs, draft, caret: f >= t1 + 14, lock: 1 - cool, lockFrom: t0 + 8, lockText: "omg you HAVE to see this", warm: 1 - cool });
};

// ---------------------------------------------------------------- 3. the tin-can telephone at dusk
const can = (g: Gfx, c: P, ang: number, seed: number) => {
  const ca = Math.cos(ang), sa = Math.sin(ang), R = (pts: P[]): P[] => pts.map(([x, y]) => [c[0] + x * ca - y * sa, c[1] + x * sa + y * ca]);
  const body = R(polyPts([[-14, -18], [14, -18], [14, 18], [-14, 18]], 5)), rim = R(oval(14, 0, 4, 18, 8));
  g.group("paint", () => { g.form(body, "#c9cbd3", "#8f929e", { seed, light: [-3, -4] }); g.form(rim, "#e6e8ee", "#a9acb8", { seed: seed + 1 }); });
  g.group("ink", () => { g.pen(body, { closed: true, w: 2, seed: seed + 2, wobble: 0.3, opacity: 0.9 }); g.pen(rim, { closed: true, w: 1.6, seed: seed + 3, wobble: 0.2, opacity: 0.8 }); [-8, 0, 8].forEach((y, i) => g.pen(R([[-12, y], [12, y]]), { w: 1, seed: seed + 4 + i, opacity: 0.35, retrace: false })); });
};
const icon = (g: Gfx, kind: string, x: number, y: number, k: number, rot: number, seed: number) => {
  if (k <= 0.01) return;
  g.push(x, y, k, rot);
  if (kind === "thought") { cloudMini(g, seed); }
  else {
    const card = polyPts([[-26, -26], [26, -26], [26, 26], [-26, 26]], 4);
    g.group("plain", () => { g.form(card, "#fbf7ef", "#d9d0c4", { seed }); if (kind === "meme") { g.form(oval(0, 4, 13, 11, 10), "#e8b46a", "#b98a40", { seed: seed + 1 }); g.form(polyPts([[-12, -2], [-9, -16], [-3, -6]], 3), "#e8b46a", "#b98a40", { seed: seed + 2 }); g.form(polyPts([[12, -2], [9, -16], [3, -6]], 3), "#e8b46a", "#b98a40", { seed: seed + 3 }); } if (kind === "reel") { g.fill(polyPts([[-8, -12], [12, 0], [-8, 12]], 3), "#e07a7a"); } if (kind === "cal") { g.fill(polyPts([[-26, -26], [26, -26], [26, -12], [-26, -12]], 4), "#e07a7a"); } });
    g.group("ink", () => { g.pen(card, { closed: true, w: 1.8, seed: seed + 5, wobble: 0.3, opacity: 0.85 }); if (kind === "meme") { g.pen([[-5, 2], [-4, 3]], { w: 2.5, seed: seed + 6, retrace: false }); g.pen([[5, 2], [6, 3]], { w: 2.5, seed: seed + 7, retrace: false }); } if (kind === "cal") gText(g, "14", 0, 8, { font: UI(20, 700), color: "#5b5560" }); });
  }
  g.pop();
};
const cloudMini = (g: Gfx, seed: number) => { const pts: P[] = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, b = 1 + 0.18 * Math.abs(Math.sin(a * 3)); pts.push([Math.cos(a) * 30 * b, Math.sin(a) * 22 * b]); } g.group("plain", () => g.form(pts, "#fbf7ef", "#d9d2e6", { seed })); g.group("ink", () => g.pen(pts, { closed: true, w: 1.8, seed: seed + 1, wobble: 0.3, opacity: 0.8 })); };

export const ch3TinCan = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("A conversation is supposed to go back and forth"), tOut = cue("But when somebody has mentally checked out"), tTopics = cue("You start coming up with new topics");
  const tThought = cue("You send them a random thought."), tMeme = cue("Then a meme."), tReel = cue("Then a reel."), tWeeks = cue("Then you remember something they told you"), tTerr = cue("but because you're terrified");
  blit(ctx, duskSet(env));
  const g = newG(ctx, env, f);
  const slack = ramp(f, tOut + 10, tOut + 46), gone = ramp(f, tTerr + 40, tTerr + 90);
  // Sam on the left holding the can to the mouth; them on the right (mirrored)
  const S = 1.3, sx = 360, sy = 906, tx = 1560, ty = 868, T = 1.18;
  const samPose = breathe(withExpr({ ...stand(), elbowR: [38, -178], wristR: [56, -226], handR: "hold" as const }, { brows: -0.6 * slack, mouth: slack > 0.5 ? "flat" : "smile", look: [4, -2], eyes: "open" }), f, SAM.seed);
  const canS: P = [sx + 74 * S, sy - 232 * S];
  const themHold: Pose = withExpr({ ...stand(), elbowR: [38, -178], wristR: [56, -226], handR: "hold" }, { mouth: "smile", look: [4, -2] });
  const themPhone = withExpr(standPhone(), { eyes: "down", mouth: "flat" });
  const tPose = breathe(mixPose(themHold, { ...themPhone, elbowL: [-30, -150], wristL: [-34, -112] }, ramp(f, tOut, tOut + 20)), f, JO.seed);
  const canT: P = lerpP([tx - 74 * T, ty - 232 * T], [tx + 36 * T, ty - 112 * T], ramp(f, tOut, tOut + 20));
  const canTend: P = lerpP(canT, [tx + 50, ty + 6], gone);
  // the string: taut while both talk, sagging once they check out
  const sag = 12 + slack * 230 + gone * 40, at = (t: number): P => { const a = lerpP(canS, canTend, t); return [a[0], a[1] + sag * 4 * t * (1 - t)]; };
  g.push(tx, ty, T); footShadow(g, 56, 0.25); drawPerson(g, { ...tPose, flip: true }, JO, f); g.pop();
  can(g, canTend, Math.PI * (1 - gone * 0.5), 300);
  g.group("ink", () => g.pen(Array.from({ length: 13 }, (_, i) => at(i / 12)), { w: 2, color: "#7a6a5e", seed: 310, wobble: 0.2, boil: 0.3, taper: 0, opacity: 0.9 * (1 - gone * 0.6), retrace: false }));
  // words travelling both ways while the line is alive
  const words = ["hi!", "haha", "no way", "same!", "and then", "wait what", "lol", "tell me!"];
  if (slack < 1) words.forEach((w, i) => { const period = 66, start = t0 + i * 26, u = ((f - start) % period) / period; if (f < start || f > tOut + 30) return; const dir = i % 2 ? -1 : 1, t = dir > 0 ? u : 1 - u, p = at(t); bubble(g, p[0], p[1] - 40, 40 + w.length * 15, 52, { fill: dir > 0 ? BUBBLE.me : BUBBLE.them, shade: dir > 0 ? BUBBLE.meShade : BUBBLE.themShade, tail: "none", text: w, font: UI(25), seed: 330 + i, k: Math.sin(u * Math.PI) * (1 - slack) }); });
  // after they check out: things stuffed in the can slide down the slack line and drop in the grass
  const items: [string, number][] = [["thought", tThought], ["meme", tMeme], ["reel", tReel], ["cal", tWeeks]];
  items.forEach(([kind, t], i) => {
    if (f < t) return; const u = (f - t) / 26, slide = clamp(u), fall = clamp((f - t - 26) / 12), rest: P = [700 + i * 90, 952 - (i % 2) * 14];
    const p0 = at(0.08 + 0.42 * smooth(slide)), p = fall > 0 ? lerpP(p0, rest, fall * fall) : p0;
    icon(g, kind, p[0], p[1] - 28 * (1 - fall), 1.45, (fall * (i % 2 ? 0.5 : -0.4)) + Math.sin(f * 0.1 + i) * 0.05 * (1 - fall), 400 + i * 10);
  });
  void tTopics;
  g.push(sx, sy, S); footShadow(g, 60, 0.3); drawPerson(g, samPose, SAM, f); g.pop();
  can(g, canS, 0, 290);
  void GRAPHITE; void heart; void inkS; void lin;
};
