// Chapters 12-17: Jo reaches out, the door left open, the candle, the detective, the couch, the polaroids.
import { Ctx, Env, Gfx, P, heart, oval, rng, softBox } from "./core";
import { BUBBLE, blit, boxPts, bubble, cachedSet, clamp, cloud, cue, dim, gText, glowAt, ground, lerp, lerpP, mixC, newG, polyPts, pop, ramp, SERIF, smooth, UI, wob } from "./kit";
import { JO, Look, Pose, RAE, SAM, THEM, breathe, drawPerson, footShadow, sitChair, stand, standChin, walk, withExpr } from "./person";
import { drawPhone, Msg } from "./phone";
import { field, ink, pool, W } from "./sets";

const at = (g: Gfx, x: number, y: number, s: number, pose: Pose, L: Look, f: number, o: { shadow?: number; breathe?: boolean } = {}) => {
  g.push(x, y, s); if (o.shadow !== 0) footShadow(g, 60, o.shadow ?? 0.28); drawPerson(g, o.breathe === false ? pose : breathe(pose, f, L.seed), L, f); g.pop();
};

// ---------------------------------------------------------------- 12. Jo reaches out
// "Because when someone genuinely wants to talk to you" -> "And unfortunately"
export const ch12Jo = (ctx: Ctx, f: number, env: Env) => {
  const tOwn = cue("They'll create their own."), tDay = cue("They'll tell you something that happened"), tRem = cue("They'll send you something that reminded them"), tAsk = cue("They'll ask what you're doing."), tFind = cue("They'll find a reason to continue"), tDrag = cue("You won't have to drag every response");
  ground(ctx, env, "#f3e6d2");
  const g = newG(ctx, env, f);
  g.group("plain", () => { W(g, oval(960, 540, 1100, 600, 14), "#f4d3a6", 1, 0.75, false); W(g, oval(1500, 200, 500, 260, 12), "#fbe7c4", 2, 0.6, false); }, { blur: 60 });
  const msgs: Msg[] = [
    { side: "me", text: "haha same", at: 0 },
    { side: "them", text: "ok random but", at: tOwn + 4 }, { side: "them", text: "a pigeon stole my sandwich today", at: tDay + 6 },
    { side: "them", text: "this reminded me of you!!", at: tRem + 6 }, { side: "them", text: "what are you up to?", at: tAsk + 4 },
    { side: "me", text: "nothing much, you?", at: tFind + 2 }, { side: "them", text: "wanna get food saturday?", at: tFind + 26 },
  ];
  drawPhone(g, ctx, env, f, { cx: 960 + wob(f, 3, 0.02) * 5, cy: 500 + wob(f, 5, 0.02) * 4, k: 0.86, tilt: 2 + wob(f, 7, 0.015), title: "Jo", avatar: "#8aa6c9", msgs, warm: 1, typing: f >= tDrag + 6 ? 1 : 0 });
  // little hearts and sparks around the phone as her messages land
  g.group("paint", () => [tOwn, tDay, tRem, tAsk, tFind + 26].forEach((t, i) => { const u = (f - t) / 40; if (u < 0 || u > 1) return; const x = 1250 + (i % 2) * 80, y = 300 + i * 70 - u * 80; g.wash(heart(x, y, 16), "#f2899c", { alpha: 0.85 * (1 - u), seed: 50 + i, dx: 0, dy: 0, shrink: 1, rim: false }); }));
};

// ---------------------------------------------------------------- 13. the door left open
// "And unfortunately, some people won't just tell you" -> "You get one good conversation"
const VP: P = [960, 380];
const hall = (u: number, v: number, z: number): P => { const s = 1 - z * 0.82; return [VP[0] + (u - 0.5) * 1700 * s, VP[1] + (v - 0.42) * 1500 * s]; };
export const ch13Door = (ctx: Ctx, f: number, env: Env) => {
  const tUn = cue("They'll slowly make themselves unavailable."), tLonger = cue("They'll take longer to respond."), tStop = cue("They'll stop initiating."), tShort = cue("They'll give you shorter answers."), tNever = cue("But they'll never completely disappear."), tBad = cue("Because completely disappearing makes them");
  const tDoor = cue("So instead, they give you just enough attention"), tWorse = cue("And that's arguably worse."), tMiddle = cue("Because now you're stuck in this weird middle ground");
  const ajar = lerp(0.12, 0.3, ramp(f, tDoor, tDoor + 30));
  blit(ctx, cachedSet(env, "hall", (g, c) => {
    c.fillStyle = "#efe4d4"; c.fillRect(0, 0, env.W, env.H);
    const Z = 1, wall = (u: number): P[] => polyPts([hall(u, 0, 0), hall(u, 0, Z), hall(u, 1, Z), hall(u, 1, 0)], 6);
    field(g, wall(0), "#d9c3b0", 1); field(g, wall(1), "#d4bcaa", 2);
    field(g, polyPts([hall(0, 1, 0), hall(1, 1, 0), hall(1, 1, Z), hall(0, 1, Z)], 6), "#a98c7a", 3);
    field(g, polyPts([hall(0, 0, 0), hall(1, 0, 0), hall(1, 0, Z), hall(0, 0, Z)], 6), "#e8dccb", 4);
    field(g, polyPts([hall(0, 0, Z), hall(1, 0, Z), hall(1, 1, Z), hall(0, 1, Z)], 6), "#e3d3c0", 5);
    pool(g, 960, 700, 500, 300, "#f6e3c4", 0.5, 6);
    g.group("ink", () => {
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([u, v], i) => ink(g, [hall(u, v, 0), hall(u, v, Z)], 10 + i, 2.4, false));
      for (let k = 1; k < 9; k++) { const z = 1 - Math.pow(1 - k / 9, 1.5); ink(g, [hall(0, 1, z), hall(1, 1, z)], 20 + k, 1.2, false, 0.35); }
      // side doors
      [[0.15, 0], [0.45, 0], [0.25, 1], [0.6, 1]].forEach(([z, u], i) => { const z2 = z + 0.12; const d = [hall(u, 0.38, z), hall(u, 0.38, z2), hall(u, 1, z2), hall(u, 1, z)]; ink(g, polyPts(d, 4), 40 + i, 2); });
    });
    const back = [hall(0.38, 0.32, Z), hall(0.62, 0.32, Z), hall(0.62, 1, Z), hall(0.38, 1, Z)];
    g.group("paint", () => g.form(polyPts(back, 4), "#8f6e5c", "#654b42", { seed: 60 })); g.group("ink", () => ink(g, polyPts(back, 4), 61, 2.4));
  }));
  const g = newG(ctx, env, f);
  // the far door: open a crack, light spilling through
  const d0 = hall(0.38, 0.32, 1), d1 = hall(0.62, 0.32, 1), d3 = hall(0.38, 1, 1), d2 = hall(0.62, 1, 1);
  const gapX = lerp(d0[0], d1[0], ajar);
  g.group("plain", () => g.fill(polyPts([d0, [gapX, d0[1]], [gapX, d3[1]], d3], 3), "#ffe9b8", 0.95));
  glowAt(ctx, env, (d0[0] + gapX) / 2, (d0[1] + d3[1]) / 2, 120 + ajar * 200, "#ffdfa0", 0.4);
  const leaf = polyPts([[gapX, d0[1]], d1, d2, [gapX, d3[1]]], 3);
  g.group("paint", () => g.form(leaf, "#9a7764", "#6e5244", { seed: 70 })); g.group("ink", () => g.pen(leaf, { closed: true, w: 2, seed: 71, wobble: 0.3 }));
  // them walks away down the hall, smaller with every line; then stops in the doorway and glances back
  const steps = [tUn, tLonger, tStop, tShort, tNever];
  let z = 0.08; steps.forEach((t, i) => { z += ramp(f, t, t + 50) * (i < 4 ? 0.2 : 0.0); });
  z = Math.min(0.9, z);
  const walking = steps.some((t, i) => i < 4 && f >= t && f < t + 50), ph = f / 26;
  const turned = f >= tBad + 20;
  const feet = hall(0.5, 1, z), sc = 1.15 * (1 - z * 0.82);
  const tPose: Pose = turned ? withExpr({ ...stand(), elbowR: [30, -150], wristR: [42, -176], handR: "phone" }, { eyes: "down", mouth: "flat" }) : { ...(walking ? walk(ph) : stand()), back: true };
  at(g, feet[0] + (turned ? 20 * sc : 0), feet[1], sc, tPose, THEM, f, { shadow: 0.2 });
  // their replies shrink as they go
  const replies: [number, string][] = [[tUn + 10, "hey sorry been busy"], [tLonger + 10, "ya"], [tStop + 10, "lol"], [tShort + 10, "k"]];
  replies.forEach(([t, s], i) => { const k = pop(f, t, 10) * (1 - ramp(f, t + 60, t + 74)); if (k > 0) bubble(g, feet[0] + 150, feet[1] - 300 * sc - 40, 30 + s.length * 14 * (1 - i * 0.15), 52 * (1 - i * 0.15), { fill: BUBBLE.them, shade: BUBBLE.themShade, tail: "l", text: s, font: UI(26 * (1 - i * 0.15)), seed: 80 + i, k }); });
  // Sam stuck in the middle of the hall, from behind, looking toward the door
  const samIn = ramp(f, tMiddle, tMiddle + 24);
  if (samIn > 0) { const p = hall(0.42, 1, 0.46); at(g, p[0], p[1], 1.15 * (1 - 0.46 * 0.82), { ...stand(), back: true }, SAM, f, { shadow: 0.25 * samIn }); }
  if (f >= tWorse) dim(ctx, env, "#cbbfc9", 0.25 * ramp(f, tWorse, tWorse + 30));
};

// ---------------------------------------------------------------- 14. the candle
// "You get one good conversation" -> "You have to stop looking at the occasional"
export const ch14Candle = (ctx: Ctx, f: number, env: Env) => {
  const tGood = cue("You get one good conversation"), tTwo = cue("Then they disappear for two days."), tRand = cue("Then they randomly respond"), tRem = cue("And because you remember how good"), tBusy = cue("Maybe they're just busy."), tThrough = cue("Maybe they're going through something."), tMiss = cue("Maybe if you give them enough space"), tWill = cue("And sometimes they will."), tWait = cue("But you shouldn't have to spend your time waiting");
  blit(ctx, cachedSet(env, "candle", (g, c) => {
    c.fillStyle = "#2b2533"; c.fillRect(0, 0, env.W, env.H);
    field(g, boxPts(-30, 760, 1950, 1110, 8), "#5a4446", 1); pool(g, 960, 820, 700, 160, "#7a5a52", 0.6, 2);
    g.group("ink", () => { ink(g, [[-20, 760], [960, 762], [1940, 758]], 3, 2.4, false, 0.7); });
  }));
  const g = newG(ctx, env, f);
  // the flame's life: flares on the good night, gutters over two days, flickers back, wavers on every "maybe"
  let life = 0.45;
  life += 0.55 * ramp(f, tGood + 10, tGood + 24); life -= 0.75 * ramp(f, tTwo, tTwo + 60); life += 0.4 * ramp(f, tRand + 10, tRand + 22);
  life -= 0.1 * ramp(f, tWait, tWait + 60);
  const waver = [tBusy, tThrough, tMiss].reduce((a, t) => a + Math.max(0, 1 - Math.abs(f - t - 12) / 16), 0);
  life = clamp(life + 0.08 * ramp(f, tWill, tWill + 20)) * (1 - 0.18 * waver * Math.abs(Math.sin(f * 0.6)));
  const fl = 0.85 + 0.15 * Math.sin(f * 0.47) * Math.sin(f * 0.13 + 1), h = (30 + 90 * life) * fl, cx = 960, top = 640;
  glowAt(ctx, env, cx, top - h * 0.5, 260 + 520 * life, "#ffcf7a", 0.18 + 0.4 * life);
  // the candle and its holder
  const body = polyPts([[cx - 40, top], [cx + 40, top], [cx + 42, 780], [cx - 42, 780]], 5), dish = oval(cx, 784, 120, 22, 14);
  g.group("paint", () => { g.form(dish, "#b9a07a", "#8a7350", { seed: 10 }); g.form(body, "#f6ecd8", "#d6c3a2", { seed: 11, light: [-6, -4] }); g.wash(oval(cx - 10, top + 4, 34, 8, 10), "#fff7e6", { alpha: 0.9, seed: 12, dx: 0, dy: 0, shrink: 1, rim: false }); });
  g.group("ink", () => { g.pen(dish, { closed: true, w: 2.4, seed: 13 }); g.pen(body, { closed: true, w: 2.4, seed: 14 }); g.pen([[cx, top], [cx + 2, top - 14]], { w: 2.4, seed: 15, retrace: false }); g.pen([[cx - 30, top + 8], [cx - 34, top + 60]], { w: 1.4, seed: 16, opacity: 0.5, retrace: false }); });
  const sway = Math.sin(f * 0.21) * 6 * (0.5 + waver);
  const flame: P[] = [[cx - 14 * (0.6 + life * 0.6), top - 12], [cx - 10, top - h * 0.5], [cx + sway, top - h], [cx + 10, top - h * 0.5], [cx + 14 * (0.6 + life * 0.6), top - 12], [cx, top - 4]];
  g.group("plain", () => { g.fill(flame, "#ffb84d", 0.95); g.fill(flame.map(([x, y]) => [cx + (x - cx) * 0.55, top - 10 + (y - top + 10) * 0.6] as P), "#fff3c4", 0.95); });
  // two days pass: a little calendar
  const cal = pop(f, tTwo + 6, 10) * (1 - ramp(f, tRand, tRand + 12));
  if (cal > 0) { g.push(1360, 380, cal); g.group("plain", () => { g.form(polyPts([[-70, -80], [70, -80], [70, 80], [-70, 80]], 4), "#fbf7ef", "#d9d0c4", { seed: 20 }); g.fill(polyPts([[-70, -80], [70, -80], [70, -44], [-70, -44]], 4), "#d9675f"); gText(g, f > tTwo + 40 ? "2 days" : "1 day", 0, 16, { font: SERIF(38), color: "#3a3440" }); }); g.pop(); }
  bubble(g, 620, 360, 400, 80, { fill: "#f6e3f0", shade: "#d9b6cc", tail: "r", text: "had SO much fun tonight", font: UI(28), seed: 30, k: pop(f, tGood + 14, 10) * (1 - ramp(f, tTwo + 10, tTwo + 24)) });
  bubble(g, 640, 380, 200, 76, { fill: BUBBLE.them, shade: BUBBLE.themShade, tail: "r", text: "lol hey", font: UI(28), seed: 31, k: pop(f, tRand + 10, 10) * (1 - ramp(f, tRem + 20, tRem + 34)) });
  // Sam's hands come in and cup the flame
  const cup = ramp(f, tRem, tRem + 36) * (1 - ramp(f, tWait + 30, tWait + 70));
  if (cup > 0) [-1, 1].forEach((s) => {
    // a forearm rising from the bottom corner, the palm curved toward the flame, fingers curled up
    const dx = s * lerp(560, 0, cup), Q = (pts: P[]): P[] => pts.map(([x, y]) => [cx + dx + s * x, y] as P);
    const hand = Q([[-560, 1110], [-370, 1110], [-200, 820], [-120, 760], [-84, 700], [-74, 640], [-84, 606], [-104, 600], [-118, 628], [-128, 600], [-150, 596], [-160, 630], [-176, 616], [-196, 626], [-200, 668], [-250, 700], [-420, 820]]);
    g.group("paint", () => g.form(hand, SAM.skin, SAM.skinShade, { seed: 40 + s, light: [-4, -6] }));
    g.group("ink", () => { g.pen(hand, { closed: true, w: 2.8, seed: 42 + s }); g.pen(Q([[-118, 628], [-124, 668]]), { w: 1.5, seed: 44 + s, opacity: 0.55, retrace: false }); g.pen(Q([[-160, 630], [-162, 672]]), { w: 1.5, seed: 46 + s, opacity: 0.55, retrace: false }); g.pen(Q([[-250, 760], [-180, 740]]), { w: 1.3, seed: 48 + s, opacity: 0.4, retrace: false }); });
    const ox = cx + dx;
    glowAt(ctx, env, ox + s * -60, 600, 120, "#ffcf7a", 0.25 * life * cup);
  });
};

// ---------------------------------------------------------------- 15. the detective
// "You have to stop looking at the occasional good interaction" -> "People who want to talk to you can still be busy"
const card = (g: Gfx, x: number, y: number, rot: number, seed: number, kind: number, glow = 0) => {
  g.push(x, y, 1, rot);
  const c = polyPts([[-62, -84], [62, -84], [62, 84], [-62, 84]], 4);
  g.group("plain", () => { g.form(c, "#fbf7ef", "#d9d0c4", { seed }); const r = rng(seed); for (let i = 0; i < 4; i++) { const me = (i + kind) % 3 === 0; g.form(softBox(me ? 14 : -14, -50 + i * 34, 60 + r() * 20, 22, 4, 12), me ? BUBBLE.me : BUBBLE.them, me ? BUBBLE.meShade : BUBBLE.themShade, { seed: seed + i }); } if (kind === 9) g.form(heart(0, 70, 12), "#f2899c", "#c95f72", { seed: seed + 9 }); if (kind === 8) g.form(oval(30, 66, 12, 12, 8), "#f6e8b0", "#cfbf7a", { seed: seed + 9 }); });
  g.group("ink", () => { g.pen(c, { closed: true, w: 1.8, seed: seed + 5, wobble: 0.3, opacity: 0.8 }); g.pen(oval(0, -80, 6, 6, 6), { closed: true, w: 3, color: "#c4525a", seed: seed + 6, retrace: false }); });
  g.pop();
  if (glow > 0) g.group("plain", () => g.fill(oval(x, y, 90, 110, 12), "#fff1c8", 0.25 * glow), { blur: 20, blend: "screen" });
};
export const ch15Detective = (ctx: Ctx, f: number, env: Env) => {
  const tWhole = cue("Look at the conversation as a whole."), tHope = cue("Not the one message that gave you hope."), tNight = cue("Not the one night where they were actually engaging."), tAll = cue("Look at everything."), tInit = cue("How often do you initiate?"), tAskYou = cue("How often do they ask about you?"), tKeep = cue("How often do you feel like you're trying"), tFeel = cue("how do you feel after talking to them?"), tExc = cue("Do you feel excited?"), tConf = cue("Or do you feel confused?"), tWant = cue('"Do they even want to talk to me?"'), tTell = cue("that's already telling you something.");
  blit(ctx, cachedSet(env, "office", (g, c) => {
    c.fillStyle = "#efe2cc"; c.fillRect(0, 0, env.W, env.H);
    field(g, boxPts(-30, -30, 1950, 880, 8), "#d8c8b0", 1); field(g, boxPts(-30, 880, 1950, 1110, 8), "#a88f7a", 2); pool(g, 760, 400, 700, 360, "#efe3cf", 0.5, 3);
    const board = boxPts(150, 110, 1290, 780, 8), frame = boxPts(130, 90, 1310, 800, 8);
    g.group("paint", () => { g.form(frame, "#9a7660", "#6e5040", { seed: 4 }); g.form(board, "#cfa77e", "#a98258", { seed: 5 }); });
    g.group("ink", () => { ink(g, frame, 6, 2.6); ink(g, board, 7, 2); ink(g, [[-20, 880], [1940, 882]], 8, 2.4, false); });
  }));
  const g = newG(ctx, env, f);
  // zoomed in on one hopeful message at first, then out to the whole board
  const zoom = lerp(1.9, 1, ramp(f, tWhole, tWhole + 40)), zc: P = [420, 300];
  g.push(zc[0] * (1 - zoom), zc[1] * (1 - zoom), zoom);
  const cards: [number, number, number, number][] = [[420, 300, -0.06, 9], [640, 260, 0.05, 1], [860, 300, -0.03, 2], [1080, 270, 0.07, 8], [520, 560, 0.04, 3], [760, 590, -0.05, 4], [990, 560, 0.03, 5], [1180, 600, -0.04, 6]];
  const hopeGlow = ramp(f, tHope, tHope + 10) * (1 - ramp(f, tNight, tNight + 20)), nightGlow = ramp(f, tNight, tNight + 10) * (1 - ramp(f, tAll, tAll + 20));
  cards.forEach(([x, y, r, k], i) => card(g, x, y, r, 100 + i * 10, k, i === 0 ? hopeGlow : i === 3 ? nightGlow : 0));
  // red string joining everything
  const str = ramp(f, tAll, tAll + 40);
  if (str > 0) g.group("ink", () => { const pins = cards.map(([x, y]) => [x, y - 80] as P); g.pen(pins, { w: 2, color: "#c4525a", seed: 200, progress: str, wobble: 0.6, taper: 0, opacity: 0.85, retrace: false }); g.pen([pins[0], pins[5], pins[2], pins[7]], { w: 1.8, color: "#c4525a", seed: 201, progress: str, wobble: 0.6, taper: 0, opacity: 0.75, retrace: false }); });
  g.pop();
  // sticky notes: the tallies
  const note = (x: number, y: number, k: number, label: string, tally: number, seed: number) => { if (k <= 0) return; g.push(x, y, k, (seed % 3 - 1) * 0.05); g.group("plain", () => { g.form(polyPts([[-90, -70], [90, -70], [90, 70], [-90, 70]], 4), "#f6e59a", "#d9c46a", { seed }); gText(g, label, 0, -36, { font: SERIF(30), color: "#3a3440" }); }); g.group("ink", () => { for (let i = 0; i < tally; i++) { const gx = -60 + (i % 5) * 16 + Math.floor(i / 5) * 90; if (i % 5 === 4) g.pen([[gx - 66, 30], [gx + 4, 6]], { w: 2.4, seed: seed + i, retrace: false }); else g.pen([[gx, 2], [gx + 2, 40]], { w: 2.4, seed: seed + i, retrace: false }); } if (tally === 0) gText(g, "0", 0, 22, { font: SERIF(44), color: "#c4525a" }); }); g.pop(); };
  note(1460, 200, pop(f, tInit + 4, 10), "you", Math.min(10, Math.floor((f - tInit) / 3)), 300); note(1700, 220, pop(f, tAskYou + 4, 10), "them", 0, 320);
  // Sam the detective with a magnifier
  const turn = ramp(f, tFeel, tFeel + 16);
  const pose = withExpr({ ...stand(), elbowR: [34, -170], wristR: [24, -210], handR: "hold", tilt: lerp(-6, 4, turn), head: [lerp(-2, 6, turn), -252] }, { look: [lerp(-8, 2, turn), -4], brows: f > tConf ? -0.7 : 0.3, mouth: f > tConf ? "flat" : "soft", eyes: "open" });
  g.push(1560, 930, 1.55); footShadow(g, 60, 0.3); drawPerson(g, { ...breathe(pose, f, SAM.seed), flip: turn < 0.5 }, SAM, f);
  const mg: P = [turn < 0.5 ? -24 : 24, -232];
  g.group("plain", () => g.fill(oval(mg[0] + (turn < 0.5 ? -14 : 14), mg[1] - 18, 22, 22, 12), "#dff0fb", 0.55));
  g.group("ink", () => { g.pen(oval(mg[0] + (turn < 0.5 ? -14 : 14), mg[1] - 18, 22, 22, 12), { closed: true, w: 4, seed: 400 }); g.pen([[mg[0], mg[1]], [mg[0] + (turn < 0.5 ? 8 : -8), mg[1] + 20]], { w: 5, seed: 401, retrace: false }); });
  g.pop();
  // excited? a small sun; confused? question marks circling
  if (f >= tExc) { const k = pop(f, tExc, 10) * (1 - ramp(f, tConf, tConf + 16)); g.push(1440, 420, k); g.group("plain", () => { g.form(oval(0, 0, 34, 34, 12), "#f6c94e", "#d9a52a", { seed: 410 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + f * 0.02; g.fill(oval(Math.cos(a) * 52, Math.sin(a) * 52, 7, 7, 6), "#f6c94e"); } }); g.pop(); }
  if (f >= tConf) for (let i = 0; i < 4; i++) { const a = f * 0.05 + i * Math.PI / 2, k = pop(f, tConf + i * 4, 10); g.group("plain", () => gText(g, "?", 1580 + Math.cos(a) * 110, 470 + Math.sin(a) * 40, { font: SERIF(52), color: "#7b6a96", alpha: k })); }
  cloud(g, 1300, 360, 520, 130, { k: pop(f, tWant, 10), text: "do they even want to talk to me?", font: SERIF(32), from: [1570, 520], seed: 420 });
  void tKeep; void tTell;
};

// ---------------------------------------------------------------- 16. the couch
// "People who want to talk to you can still be busy" -> "At some point, you have enough information."... -> "And this is where"
const couchSet = (env: Env) => cachedSet(env, "couch", (g, c) => {
  c.fillStyle = "#f2e6d4"; c.fillRect(0, 0, env.W, env.H);
  field(g, boxPts(-30, -30, 1950, 860, 8), "#e7cdb2", 1); field(g, boxPts(-30, 860, 1950, 1110, 8), "#b48e72", 2); pool(g, 1500, 300, 600, 400, "#f6e3c4", 0.6, 3);
  // window light and a lamp
  const win = boxPts(1400, 140, 1760, 520, 6);
  g.group("paint", () => { g.form(win, "#cfe3ee", "#a9c3d6", { seed: 4 }); }); g.group("ink", () => { ink(g, win, 5, 2.6); ink(g, [[1580, 140], [1580, 520]], 6, 2.4, false); });
  const back = polyPts([[330, 520], [1270, 520], [1290, 730], [310, 730]], 8), seat = polyPts([[300, 700], [1300, 700], [1320, 790], [280, 790]], 8), armL = polyPts([[240, 580], [340, 580], [350, 860], [230, 860]], 6), armR = polyPts([[1260, 580], [1360, 580], [1370, 860], [1250, 860]], 6), base = polyPts([[260, 790], [1340, 790], [1340, 860], [260, 860]], 6);
  g.group("paint", () => { g.form(back, "#c98f86", "#9d6f74", { seed: 7 }); g.form(seat, "#d9a29a", "#ab7a78", { seed: 8 }); g.form(base, "#b37d78", "#8a5d5a", { seed: 9 }); g.form(armL, "#c98f86", "#9d6f74", { seed: 10 }); g.form(armR, "#c98f86", "#9d6f74", { seed: 11 }); g.form(polyPts([[380, 560], [520, 556], [530, 690], [384, 694]], 4), "#f3d98a", "#cfb25c", { seed: 12 }); });
  g.group("ink", () => { [back, seat, base, armL, armR].forEach((p, i) => ink(g, p, 13 + i, 2.6)); ink(g, [[800, 524], [800, 700]], 19, 1.6, false, 0.5); });
  // coffee table
  const top = polyPts([[620, 900], [1180, 900], [1220, 940], [580, 940]], 6);
  g.group("paint", () => g.form(top, "#a97c5f", "#7a5644", { seed: 20 })); g.group("ink", () => { ink(g, top, 21, 2.4); ink(g, [[620, 940], [616, 1060]], 22, 3, false); ink(g, [[1180, 940], [1184, 1060]], 23, 3, false); });
});
export const ch16Couch = (ctx: Ctx, f: number, env: Env) => {
  const tBusy = cue("People who want to talk to you can still be busy."), tDecode = cue("You don't have to decode every message."), tPunct = cue("You don't have to inspect the punctuation."), tLol = cue("You don't have to figure out why they used"), tOnline = cue("You don't need to check whether they're online."), tStory = cue("You don't need to see if they watched your story."), tCalc = cue("You don't need to calculate how long"), tEnough = cue("At some point, you have enough information.");
  blit(ctx, couchSet(env));
  const g = newG(ctx, env, f);
  const back = ramp(f, tEnough + 10, tEnough + 40);
  // Rae (left) reading Sam's phone, one eyebrow up; Sam (right) with a magnifier, then not
  const rae = withExpr({ ...sitChair(), elbowR: [30, -140], wristR: [lerp(48, 90, back), lerp(-160, -150, back)], handR: back > 0.5 ? "rest" : "phone", tilt: 6 }, { eyes: back > 0.5 ? "open" : "down", brows: 0.7, mouth: back > 0.5 ? "smile" : "flat", look: [5, 3] });
  at(g, 560, 880, 1.55, rae, RAE, f, { shadow: 0 });
  const down = ramp(f, tDecode, tDecode + 24);
  const sam = withExpr({ ...sitChair(), elbowR: [30, -150], wristR: lerpP([40, -196], [56, -112], down), handR: "hold", elbowL: [-10, -140], wristL: [lerp(30, -20, back), -140], handL: back > 0.5 ? "phone" : "rest", tilt: -4 }, { look: [-6, 0], brows: lerp(-0.6, 0.2, ramp(f, tEnough, tEnough + 30)), mouth: f > tEnough + 20 ? "smile" : "flat", eyes: "open" });
  g.push(1040, 880, 1.55); drawPerson(g, { ...breathe(sam, f, SAM.seed), flip: true }, SAM, f);
  if (down < 1) { const m: P = [-lerp(40, 56, down), lerp(-196, -112, down)]; g.group("ink", () => { g.pen(oval(m[0] - 16, m[1] - 20, 20, 20, 12), { closed: true, w: 3.6, seed: 500 }); g.pen([m, [m[0] + 8, m[1] + 18]], { w: 4.5, seed: 501, retrace: false }); }); }
  g.pop();
  // the magnifier set down on the table
  if (down >= 1) g.group("ink", () => { g.pen(oval(900, 912, 24, 9, 12), { closed: true, w: 3.4, seed: 502 }); g.pen([[924, 914], [960, 918]], { w: 4.5, seed: 503, retrace: false }); });
  bubble(g, 460, 330, 440, 80, { fill: "#fbf0c6", shade: "#dcc97a", tail: "r", text: "they can still be busy, you know", font: UI(28), seed: 510, k: pop(f, tBusy + 10, 10) * (1 - ramp(f, tDecode, tDecode + 14)) });
  // the things you'd stop checking, each one fading away as it's named
  const fadeOut = (t: number) => pop(f, t + 4, 10) * (1 - ramp(f, t + 40, t + 60));
  const k1 = fadeOut(tPunct); if (k1 > 0) g.group("plain", () => { gText(g, ".", 1350, 340, { font: SERIF(160), color: "#3a3440", alpha: k1 }); gText(g, "!", 1460, 340, { font: SERIF(130), color: "#3a3440", alpha: k1 * 0.7 }); });
  const k2 = fadeOut(tLol); bubble(g, 1300, 300, 120, 64, { text: "lol", font: UI(30), seed: 520, k: k2, tail: "l" }); bubble(g, 1480, 380, 150, 64, { text: "lmao", font: UI(30), seed: 521, k: k2, tail: "l" });
  const k3 = fadeOut(tOnline); if (k3 > 0) { g.push(1400, 330, k3); g.group("plain", () => { g.form(softBox(0, 0, 200, 56, 4, 18), "#f7f2ea", "#d9d0c4", { seed: 530 }); g.form(oval(-66, 0, 10, 10, 8), "#6fc27a", "#4f9a5a", { seed: 531 }); gText(g, "online", 18, 1, { font: UI(28), color: "#55525d" }); }); g.pop(); }
  const k4 = fadeOut(tStory); if (k4 > 0) { g.push(1400, 340, k4); g.group("ink", () => { g.pen(oval(0, 0, 54, 54, 14), { closed: true, w: 6, color: "#e0806f", seed: 540 }); g.pen(oval(0, 0, 18, 12, 10), { closed: true, w: 3, seed: 541 }); }); g.pop(); }
  const k5 = fadeOut(tCalc); if (k5 > 0) { g.push(1400, 340, k5); g.group("plain", () => { g.form(oval(0, 10, 56, 56, 14), "#fbf7ef", "#d9d0c4", { seed: 550 }); const a = f * 0.2; g.fill(polyPts([[0, 10], [Math.cos(a) * 40, 10 + Math.sin(a) * 40], [Math.cos(a) * 40 + 3, 13 + Math.sin(a) * 40]], 2), "#3a3440"); }); g.group("ink", () => { g.pen(oval(0, 10, 56, 56, 14), { closed: true, w: 2.4, seed: 551 }); g.pen([[0, -46], [0, -60]], { w: 5, seed: 552, retrace: false }); }); g.pop(); }
  void clamp; void JO;
};

// ---------------------------------------------------------------- 17. polaroids
// "And this is where you need to be honest with yourself." -> "And because you remember that version"
export const ch17Polaroids = (ctx: Ctx, f: number, env: Env) => {
  const tVersion = cue("or are you trying to get back the version of them"), tNot = cue("Sometimes you're not attached to the person anymore."), tFelt = cue("You're attached to how they made you feel before."), tOld = cue("You're attached to the old conversations."), tLate = cue("The late nights."), tRand = cue("The random messages."), tExc = cue("The feeling that they were excited to hear from you.");
  blit(ctx, cachedSet(env, "polaroid-wall", (g, c) => {
    c.fillStyle = "#3f4766"; c.fillRect(0, 0, env.W, env.H);
    field(g, boxPts(-30, -30, 1950, 900, 8), "#56618a", 1); field(g, boxPts(-30, 900, 1950, 1110, 8), "#6f5f72", 2); pool(g, 1000, 360, 900, 340, "#7a86ae", 0.5, 3);
    g.group("ink", () => { ink(g, [[60, 150], [500, 210], [1000, 230], [1500, 210], [1900, 150]], 4, 1.8, false, 0.8); ink(g, [[-20, 900], [1940, 902]], 5, 2.4, false); });
  }));
  const g = newG(ctx, env, f);
  const string = (x: number) => { const t = (x - 60) / 1840; return 150 + Math.sin(t * Math.PI) * 80; };
  // what's in each: two people laughing, a moon, a stack of messages, a heart, a sunset, them smiling
  const pics: [number, string, number][] = [[330, "them", tVersion], [610, "moon", tLate], [890, "msgs", tRand], [1170, "heart", tExc], [1450, "laugh", tOld], [1730, "sun", tFelt]];
  const grey = ramp(f, tExc + 50, tExc + 140);
  pics.forEach(([x, kind, t], i) => {
    const y = string(x) + 140, rot = Math.sin(f * 0.03 + i) * 0.03 + (i % 2 ? 0.05 : -0.05), lit = ramp(f, t, t + 12) * (1 - ramp(f, t + 70, t + 100));
    g.push(x, y, 1 + lit * 0.12, rot);
    const fr = polyPts([[-100, -120], [100, -120], [100, 130], [-100, 130]], 4), ph = polyPts([[-84, -104], [84, -104], [84, 70], [-84, 70]], 4);
    g.group("paint", () => { g.form(fr, "#fbf7ef", "#d9d0c4", { seed: 600 + i }); g.form(ph, kind === "moon" ? "#2f3858" : kind === "sun" ? "#f3b88a" : "#f3dfc4", kind === "moon" ? "#1d2440" : "#d9b48a", { seed: 610 + i }); });
    g.group("paint", () => {
      if (kind === "moon") { g.form(oval(20, -40, 26, 26, 12), "#f6efd2", "#d9cf9e", { seed: 620 }); }
      if (kind === "sun") { g.form(oval(0, 10, 40, 40, 12), "#fde7b0", "#f2c46b", { seed: 621 }); }
      if (kind === "heart") { g.form(heart(0, -20, 34), "#f2899c", "#c95f72", { seed: 622 }); }
      if (kind === "msgs") { [0, 1, 2].forEach((j) => g.form(softBox(j % 2 ? 22 : -22, -60 + j * 44, 100, 30, 4, 14), j % 2 ? BUBBLE.me : "#f6e3f0", j % 2 ? BUBBLE.meShade : "#d9b6cc", { seed: 623 + j })); }
    });
    if (kind === "them" || kind === "laugh") { g.push(kind === "laugh" ? -26 : 0, 66, 0.5); drawPerson(g, withExpr({ ...stand(), head: [3, -252] }, { mouth: "grin", eyes: "closed", look: [0, 0] }), kind === "them" ? THEM : SAM, f, { noHands: true }); g.pop(); if (kind === "laugh") { g.push(40, 66, 0.5); drawPerson(g, { ...withExpr(stand(), { mouth: "grin", eyes: "closed", look: [0, 0] }), flip: true }, THEM, f, { noHands: true }); g.pop(); } }
    g.group("plain", () => g.fill(ph, "#8a8794", 0.55 * grey));
    g.group("ink", () => { g.pen(fr, { closed: true, w: 2, seed: 640 + i, wobble: 0.3 }); g.pen(ph, { closed: true, w: 1.4, seed: 650 + i, opacity: 0.6, wobble: 0.3 }); g.pen(polyPts([[-10, -134], [10, -134], [10, -100], [-10, -100]], 3), { closed: true, w: 2, color: "#8a6a50", seed: 660 + i }); });
    g.pop();
    if (lit > 0) glowAt(ctx, env, x, y, 240, "#ffe2b0", 0.3 * lit);
  });
  // Sam below, looking up at them
  at(g, 200, 1010, 1.25, withExpr(standChin(), { look: [6, -8], brows: -0.3, mouth: grey > 0.5 ? "flat" : "soft" }), SAM, f, { shadow: 0.25 });
  dim(ctx, env, "#c9c3d6", 0.25 * grey);
  void tNot; void smooth; void mixC; void ground; void JO; void lerpP;
};
