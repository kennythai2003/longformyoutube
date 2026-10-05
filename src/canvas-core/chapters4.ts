// Chapters 18-22: watering the dead plant, face-down, setting the sack down, the picnic, the phone put down, dawn.
import { Ctx, Env, Gfx, P, oval, softBox } from "./core";
import { PLANT_AT, drawBedroom } from "./bedroom";
import { BUBBLE, blit, boxPts, bubble, cachedSet, clamp, cloud, cue, dim, gText, glowAt, lerp, lerpP, newG, polyPts, pop, ramp, SERIF, smooth, UI, wob } from "./kit";
import { JO, Look, Pose, RAE, SAM, breathe, drawPerson, footShadow, mixPose, sitCross, stand, standPour, walk, withExpr } from "./person";
import { drawPhone, Msg } from "./phone";
import { drawPlant, drawSeedling, fallenLeaf } from "./plant";
import { field, ink, parkSet, pool, W } from "./sets";

const at = (g: Gfx, x: number, y: number, s: number, pose: Pose, L: Look, f: number, o: { shadow?: number; breathe?: boolean; lit?: number } = {}) => {
  g.push(x, y, s); if (o.shadow !== 0) footShadow(g, 60, o.shadow ?? 0.28); drawPerson(g, o.breathe === false ? pose : breathe(pose, f, L.seed), L, f, { lit: o.lit }); g.pop();
};

/** a watering can whose handle sits at `h` (world), tilted by `tilt` radians (spout toward +x) */
const wateringCan = (g: Gfx, h: P, tilt: number, seed = 800) => {
  g.push(h[0], h[1], 1, tilt);
  const body = polyPts([[-10, -10], [70, -14], [74, 60], [-14, 64]], 5), spout = polyPts([[66, 20], [140, -40], [150, -32], [74, 36]], 3), rose = oval(146, -38, 12, 7, 8);
  g.group("paint", () => { g.form(spout, "#8fb3c9", "#5f87a0", { seed }); g.form(body, "#9cc0d6", "#6a90a8", { seed: seed + 1, light: [-6, -6] }); g.form(rose, "#8fb3c9", "#5f87a0", { seed: seed + 2 }); });
  g.group("ink", () => { g.pen(body, { closed: true, w: 2.4, seed: seed + 3 }); g.pen(spout, { closed: true, w: 2.2, seed: seed + 4 }); g.pen(rose, { closed: true, w: 2, seed: seed + 5 }); g.pen([[-8, -8], [10, -40], [50, -42], [68, -12]], { w: 3, seed: seed + 6, retrace: false }); });
  g.pop();
  const ca = Math.cos(tilt), sa = Math.sin(tilt); return [h[0] + 146 * ca + 38 * sa, h[1] + 146 * sa - 38 * ca] as P;
};
const drops = (g: Gfx, f: number, from: P, to: number, n: number, seed: number) => g.group("paint", () => { for (let i = 0; i < n; i++) { const u = ((f * 0.07 + i / n) % 1), x = from[0] + Math.sin(i * 2.1) * 6 + u * 10, y = from[1] + u * (to - from[1]); g.wash(oval(x, y, 3.2, 5.5, 6), "#9cc6e6", { alpha: 0.9, seed: seed + i, dx: 0, dy: 0, shrink: 1, rim: false }); } });

// ---------------------------------------------------------------- 18. watering the dead plant
// "And because you remember that version of the relationship" -> "So stop trying."
export const ch18Watering = (ctx: Ctx, f: number, env: Env) => {
  const tSend = cue("You keep sending things."), tForce = cue("But you can't force someone back"), tAvail = cue("You can make yourself more available."), tFun = cue("You can become funnier."), tMyst = cue("You can become more mysterious."), tMore = cue("You can give them more attention."), tLess = cue("You can give them less attention."), tWait = cue("You can wait three hours"), tNone = cue("None of that changes whether");
  drawBedroom(ctx, env, f, "day");
  const g = newG(ctx, env, f);
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0.9);
  // Sam beside the window, pouring; lowers the can on "But you can't force", lifts it again, lowers it for good on "None of that"
  const pouring = (f >= tSend && f < tForce) || (f >= tAvail + 10 && f < tNone);
  const lift = ramp(f, tSend - 20, tSend) * (1 - ramp(f, tForce, tForce + 16)) + ramp(f, tAvail, tAvail + 16) * (1 - ramp(f, tNone, tNone + 20));
  const base = withExpr(stand(), { look: [6, -4], brows: -0.4, mouth: "flat" }), pour = withExpr({ ...standPour(), wristR: [74, -214], elbowR: [48, -186], wristL: [52, -196], elbowL: [28, -160] }, { look: [6, -4], brows: -0.5, mouth: "flat", eyes: "open" });
  const S = 1.75, sx = 1240, sy = 890;
  at(g, sx, sy, S, mixPose(base, pour, lift), SAM, f);
  const hand: P = lerpP([sx + 40 * S, sy - 116 * S], [sx + 74 * S, sy - 214 * S], lift), tilt = lerp(0.1, 0.55, pouring ? 1 : 0) * lift;
  const tip = wateringCan(g, [hand[0] - 10, hand[1] + 8], tilt);
  const flow = f >= tMore && f < tLess ? 14 : f >= tLess && f < tWait ? 2 : 7;
  if (pouring && lift > 0.8) drops(g, f, tip, PLANT_AT[1] - 100, flow, 820);
  // a party hat, then sunglasses, then a stopwatch: nothing changes the plant
  const head: P = [sx + 10 * S, sy - 252 * S];
  const hat = pop(f, tFun + 4, 10) * (1 - ramp(f, tMyst, tMyst + 6));
  if (hat > 0) { g.push(head[0] + 8, head[1] - 60, hat, 0.2); g.group("paint", () => g.form(polyPts([[-34, 30], [0, -60], [34, 30]], 4), "#f2899c", "#c95f72", { seed: 830 })); g.group("ink", () => { g.pen(polyPts([[-34, 30], [0, -60], [34, 30]], 4), { closed: true, w: 2.4, seed: 831 }); g.pen(oval(0, -64, 8, 8, 8), { closed: true, w: 2.4, color: "#f3d577", seed: 832 }); }); g.pop(); }
  const shades = pop(f, tMyst + 4, 10) * (1 - ramp(f, tMore, tMore + 10));
  if (shades > 0) { g.push(head[0] + 18, head[1], shades); g.group("plain", () => { g.fill(softBox(-20, 0, 34, 22, 4, 14), "#2a2833"); g.fill(softBox(22, 0, 38, 24, 4, 14), "#2a2833"); }); g.group("ink", () => g.pen([[-4, -2], [4, -2]], { w: 3, seed: 840, retrace: false })); g.pop(); }
  const watch = pop(f, tWait + 6, 10) * (1 - ramp(f, tNone, tNone + 12));
  if (watch > 0) { g.push(880, 360, watch); g.group("plain", () => { g.form(oval(0, 0, 70, 70, 14), "#fbf7ef", "#d9d0c4", { seed: 850 }); const a = -Math.PI / 2 + f * 0.25; g.fill(polyPts([[0, 0], [Math.cos(a) * 52, Math.sin(a) * 52], [Math.cos(a) * 52 + 4, Math.sin(a) * 52 + 4]], 2), "#3a3440"); gText(g, "3h", 0, 38, { font: SERIF(28), color: "#7a6a5e" }); }); g.group("ink", () => { g.pen(oval(0, 0, 70, 70, 14), { closed: true, w: 2.6, seed: 851 }); g.pen([[0, -70], [0, -90]], { w: 6, seed: 852, retrace: false }); }); g.pop(); }
};

// ---------------------------------------------------------------- 19. face-down
// "So stop trying." -> "Sometimes the most respectful thing you can do"
export const ch19FaceDown = (ctx: Ctx, f: number, env: Env) => {
  const tAnother = cue("Stop sending another message"), tReel = cue("Stop sending them a reel"), tAsking = cue("Stop asking questions when you already know"), tStaring = cue("Stop staring at the typing indicator"), tBreathe = cue("Let the conversation breathe."), tIf = cue("And if it dies..."), tDie = cue("let it die."), tRevive = cue("You don't need to revive it."), tGoodbye = cue("You don't need a dramatic goodbye."), tPara = cue("You don't need to send a paragraph"), tAsk = cue("You don't need to ask,"), tStill = cue('"Are you still interested in talking to me?"'), tKnow = cue("You already know.");
  // a desk seen from above
  blit(ctx, cachedSet(env, "desk-top", (g, c) => {
    c.fillStyle = "#c79c7c"; c.fillRect(0, 0, env.W, env.H);
    field(g, boxPts(-30, -30, 1950, 1110, 8), "#c9a283", 1); pool(g, 760, 420, 900, 500, "#e2bf9c", 0.6, 2);
    g.group("ink", () => { for (let i = 0; i < 7; i++) ink(g, [[-20, 80 + i * 160], [960, 84 + i * 160], [1940, 78 + i * 160]], 3 + i, 1.4, false, 0.4); });
    // a mug and a pencil
    g.group("paint", () => { g.form(oval(1500, 260, 80, 80, 14), "#e8eef3", "#b9c6d2", { seed: 20 }); g.form(oval(1500, 260, 62, 62, 14), "#7a5442", "#5a3a2c", { seed: 21 }); g.form(polyPts([[1360, 760], [1690, 690], [1696, 706], [1366, 776]], 4), "#f3d577", "#cfb25c", { seed: 22 }); });
    g.group("ink", () => { ink(g, oval(1500, 260, 80, 80, 14), 23); ink(g, oval(1588, 260, 26, 16, 8), 24, 2); ink(g, polyPts([[1360, 760], [1690, 690], [1696, 706], [1366, 776]], 4), 25, 2); });
  }));
  const g = newG(ctx, env, f);
  const flip = clamp((f - tBreathe - 6) / 14), faceUp = flip < 0.5;
  const draft = f >= tAnother + 6 && f < tReel ? "hey did you see my last".slice(0, Math.floor((f - tAnother - 6) * 0.6)) : f >= tAsking + 6 && f < tStaring ? "how was your day?".slice(0, Math.floor((f - tAsking - 6) * 0.6)) : "";
  const typing = f >= tStaring + 6 && f < tBreathe ? (Math.floor((f - tStaring) / 20) % 3 === 2 ? 0 : 1) : 0;
  const msgs: Msg[] = [{ side: "me", text: "hope your week's going ok", at: 0 }, { side: "them", text: "ya", at: 0 }, { side: "me", text: "haha nice", at: 0 }, { side: "me", text: "anyway", at: 0, read: 0 }];
  const cx = 860, cy = 500, k = 0.7, sq = Math.abs(Math.cos(flip * Math.PI));
  if (flip <= 0) drawPhone(g, ctx, env, f, { cx, cy, k, tilt: 6, title: "them", avatar: "#c3aedd", msgs, draft, caret: true, typing, noHand: true });
  else {
    // the turn, then the back of the phone: still, dark, with a camera
    const w = 470 * k * sq, h = 920 * k;
    const back = softBox(cx, cy, Math.max(8, w), h, 5.5, 40);
    g.group("paint", () => g.form(back, faceUp ? "#3a3a46" : "#4a4652", "#2a2832", { seed: 900 }));
    if (!faceUp) g.group("paint", () => g.form(softBox(cx + w * 0.3, cy - h * 0.38, 60 * sq, 60, 4, 16), "#2a2832", "#1a1820", { seed: 901 }));
    g.group("ink", () => g.pen(back, { closed: true, w: 3, seed: 902 }));
  }
  // "let it die.": the last leaf drifts down onto the desk beside the phone
  if (f >= tDie - 10) { const u = clamp((f - tDie + 10) / 70), x = lerp(1200, 1180, u) + Math.sin(u * 9) * 60 * (1 - u), y = lerp(-40, 560, smooth(u)); fallenLeaf(g, x, y, u * 3 + 0.4, 910); }
  // the paragraph you don't send, and the question you don't ask
  const para = pop(f, tPara + 6, 12) * (1 - ramp(f, tAsk, tAsk + 16));
  if (para > 0) { g.push(1380, 460, para, 0.05); g.group("plain", () => { g.form(polyPts([[-170, -200], [170, -200], [170, 200], [-170, 200]], 4), "#fbf7ef", "#d9d0c4", { seed: 920 }); }); g.group("ink", () => { for (let i = 0; i < 11; i++) g.pen([[-140, -160 + i * 30], [130 - (i === 10 ? 160 : (i * 37) % 60), -158 + i * 30]], { w: 1.6, seed: 930 + i, opacity: 0.55, retrace: false }); g.pen([[-160, -190], [160, 190]], { w: 3, color: "#c4525a", seed: 945, progress: ramp(f, tAsk - 20, tAsk), retrace: false }); }); g.pop(); }
  cloud(g, 1360, 420, 560, 150, { k: pop(f, tStill, 10) * (1 - ramp(f, tKnow, tKnow + 20)), text: "are you still interested in talking to me?", font: SERIF(28), seed: 950 });
  if (f >= tKnow) dim(ctx, env, "#e8d9c6", 0.2 * ramp(f, tKnow, tKnow + 40));
  void tIf; void tRevive; void tGoodbye;
};

// ---------------------------------------------------------------- 19b. setting the sack down
// "Sometimes the most respectful thing" -> "The people who genuinely want to be in your life"
export const ch19Sack = (ctx: Ctx, f: number, env: Env) => {
  const tCarry = cue("Because a conversation should not feel like a responsibility"), tExh = cue("You shouldn't feel exhausted"), tPerf = cue("You shouldn't feel like you're performing"), tProve = cue("You shouldn't have to constantly prove");
  drawBedroom(ctx, env, f, "dusk", { lights: 0.8 });
  const g = newG(ctx, env, f);
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0.97);
  const down = ramp(f, tCarry + 10, tCarry + 50), relief = ramp(f, tExh, tExh + 30);
  const S = 1.7, sx = 820, sy = 900;
  // the sack: over the shoulder, then set on the floor, where it slowly deflates
  const shoulder: P = [sx - 62 * S, sy - 238 * S], floor: P = [sx - 210, sy - 60];
  const sp = lerpP(shoulder, floor, smooth(down)), rot = lerp(-0.32, 0.1, down), squash = 1 - 0.35 * ramp(f, tPerf, tProve + 60);
  g.push(sp[0], sp[1], S * lerp(1, squash, down) * 0.85, rot); bubble(g, 0, 0, 190, 132 * (down > 0.9 ? squash : 1), { fill: "#fbf7ef", shade: "#cfc4b2", tail: "r", seed: 81 }); g.pop();
  const carry: Pose = { ...stand(), chest: [8, -198], head: [14, -246], elbowR: [26, -178], wristR: [0, -206], handR: "rest", tilt: 8 };
  const set: Pose = { ...stand(), chest: [-4, -194], head: [-6, -244], elbowR: [-20, -150], wristR: [-60, -118], elbowL: [-40, -150], wristL: [-70, -118], tilt: -6 };
  const free: Pose = { ...stand(), elbowR: [44, -176], wristR: [70, -222], elbowL: [-44, -176], wristL: [-70, -222], handR: "open", handL: "open", tilt: -3, head: [3, -256] };
  let pose = down < 1 ? mixPose(carry, set, down) : mixPose(set, free, ramp(f, tExh + 10, tExh + 40) * (1 - ramp(f, tPerf + 20, tPerf + 50)));
  if (f >= tPerf + 50) pose = stand();
  pose = withExpr(pose, { eyes: relief > 0.3 && f < tPerf + 20 ? "closed" : "open", mouth: f > tProve ? "smile" : relief > 0.5 ? "soft" : "flat", brows: lerp(-0.5, 0.2, relief), look: [4, -2] });
  at(g, sx, sy, S, pose, SAM, f, { shadow: 0.3 });
};

// ---------------------------------------------------------------- 20. the picnic
// "The people who genuinely want to be in your life" -> "So if you're currently staring at a chat"
export const ch20Picnic = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("The people who genuinely want to be in your life"), tNot = cue("Not every single time."), tCons = cue("But consistently enough"), tEff = cue("There will be effort."), tCur = cue("There will be curiosity."), tMom = cue("There will be moments where you don't have to do anything"), tLook = cue("That's what you're looking for."), tPerf = cue("Not perfection."), tRecip = cue("Just reciprocity.");
  blit(ctx, parkSet(env));
  const g = newG(ctx, env, f);
  // Jo (left) and Rae (right) on the blanket; Jo shifts to make room; Sam walks in and sits between them
  const room = ramp(f, t0 + 20, t0 + 50), walkIn = clamp((f - t0) / 70), sitDown = ramp(f, t0 + 70, t0 + 90);
  at(g, lerp(800, 700, room), 900, 1.15, withExpr(sitCross(), { mouth: "smile", look: [6, -2], brows: 0.3 }), JO, f, { shadow: 0 });
  at(g, 1230, 910, 1.15, { ...withExpr(sitCross(), { mouth: f > tCur && f < tMom ? "o" : "smile", look: [6, -2], brows: 0.4 }), flip: true }, RAE, f, { shadow: 0 });
  const sx = lerp(1700, 960, smooth(walkIn));
  const samPose = sitDown > 0 ? mixPose(stand(), sitCross(), sitDown) : walk(f / 26);
  const gotIt = f >= tRecip + 20;
  const seated: Pose = gotIt ? { ...samPose, elbowR: [30, -96], wristR: [44, -110], elbowL: [-20, -96], wristL: [14, -110], handL: "hold", handR: "hold" } : samPose;
  at(g, sx, lerp(900, 925, sitDown), 1.15, { ...withExpr(seated, { mouth: f > tNot ? "smile" : "soft", look: [-4, -2], eyes: f > tMom && f < tLook && Math.sin(f * 0.2) > 0.6 ? "closed" : "open", blush: 0.4 }), flip: sitDown > 0.5 }, SAM, f, { shadow: sitDown > 0.5 ? 0 : 0.25 });
  // the conversation keeps moving without Sam starting it
  const say: [number, string, "jo" | "rae" | "sam"][] = [[tNot + 4, "how've you been??", "jo"], [tCons + 10, "we missed you", "rae"], [tEff, "brought your fave snacks", "jo"], [tCur, "wait, tell me everything", "rae"], [tMom + 6, "ok so guess what", "jo"], [tMom + 40, "no WAY", "rae"], [tMom + 70, "right?!", "jo"], [tLook + 4, "haha", "sam"]];
  say.forEach(([t, s, who], i) => {
    const next = say[i + 1]?.[0] ?? tRecip + 40, k = pop(f, t, 10) * (1 - ramp(f, next + 30, next + 44)); if (k <= 0) return;
    const p: P = who === "jo" ? [560, 520] : who === "rae" ? [1370, 520] : [960, 470];
    bubble(g, p[0] + wob(f, i, 0.03) * 6, p[1] - (i % 2) * 40, 40 + s.length * 15, 64, { fill: who === "jo" ? "#dfe8f4" : who === "rae" ? "#fbf0c6" : BUBBLE.me, shade: who === "jo" ? "#a9bcd6" : who === "rae" ? "#dcc97a" : BUBBLE.meShade, tail: who === "jo" ? "r" : "l", text: s, font: UI(28), seed: 300 + i, k });
  });
  // "Just reciprocity.": Jo hands over a seedling
  const give = ramp(f, tRecip, tRecip + 26);
  if (f >= tPerf) { const pos = lerpP([lerp(800, 700, room) + 60, 860], [sx - 6, 896], give); drawSeedling(g, f, pos[0], pos[1], 0.9, 1, 700); }
};

// ---------------------------------------------------------------- 21. put the phone down
// "So if you're currently staring at a chat" -> "So stop watering the dead plant."
const SILL_Y = 602, PHONE_AT: P = [1610, 596], SEED_AT: P = [1330, 602];
const phoneOnSill = (g: Gfx, glow = 0) => { const p = polyPts([[PHONE_AT[0] - 40, PHONE_AT[1] - 8], [PHONE_AT[0] + 40, PHONE_AT[1] - 8], [PHONE_AT[0] + 44, PHONE_AT[1] + 2], [PHONE_AT[0] - 44, PHONE_AT[1] + 2]], 3); g.group("paint", () => g.form(p, glow > 0 ? "#6a7aa0" : "#3a3a46", "#22222a", { seed: 960 })); g.group("ink", () => g.pen(p, { closed: true, w: 2, seed: 961 })); };
export const ch21PhoneDown = (ctx: Ctx, f: number, env: Env) => {
  const tDont = cue("don't."), tPut = cue("Put the phone down."), tGo = cue("Go do literally anything else."), tSil = cue("Let the silence sit there."), tSee = cue("And see what happens"), tMaybe = cue("Maybe they'll reach out."), tWont = cue("Maybe they won't."), tEither = cue("But either way"), tRej = cue("Because sometimes you're not being rejected"), tBeg = cue("You're being rejected every time"), tBetter = cue("And you deserve better than that.");
  drawBedroom(ctx, env, f, "dusk", { lights: 0.6 });
  const g = newG(ctx, env, f);
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0.97); drawSeedling(g, f, SEED_AT[0], SEED_AT[1], 1.1, 1, 710);
  // Sam at the window with the phone; sets it on the sill; walks out (left)
  const put = ramp(f, tPut, tPut + 24), leave = clamp((f - tGo - 10) / 90);
  const S = 1.75, sx = lerp(1680, -260, smooth(leave)), sy = 890;
  if (put >= 1) phoneOnSill(g);
  if (leave < 1) {
    let pose: Pose;
    if (leave <= 0) pose = mixPose(withExpr({ ...stand(), elbowR: [30, -150], wristR: [42, -186], handR: "phone", tilt: 10 }, { eyes: "down", brows: -0.4, mouth: "flat" }), withExpr({ ...stand(), elbowR: [40, -200], wristR: [70, -236], handR: f < tPut + 12 ? "phone" : "rest", tilt: 4 }, { look: [6, -4], mouth: "flat" }), put);
    else pose = { ...walk(f / 24, { mouth: "soft", look: [3, 0], eyes: "open", brows: 0 }), flip: true };
    if (f >= tPut + 30 && leave <= 0) pose = withExpr(stand(), { look: [-4, 0], mouth: "soft", brows: 0 });
    at(g, sx, sy, S, pose, SAM, f, { lit: 0.5 });
  }
  // the quiet room: dust in the last light
  if (f >= tSil) g.group("paint", () => { for (let i = 0; i < 18; i++) { const u = ((f * 0.004 + i * 0.137) % 1), x = 1250 + Math.sin(i * 3.1 + f * 0.01) * 200 + i * 12, y = 200 + u * 600; g.wash(oval(x, y, 2.6, 2.6, 6), "#fff1c8", { alpha: 0.7 * Math.sin(u * Math.PI), seed: 970 + i, dx: 0, dy: 0, shrink: 1, rim: false }); } });
  dim(ctx, env, "#7a6a8e", 0.3 * ramp(f, tEither, tBetter + 60));
  void tDont; void tSee; void tMaybe; void tWont; void tRej; void tBeg; void SILL_Y;
};

// ---------------------------------------------------------------- 22. dawn
// "So stop watering the dead plant." -> the end
export const ch22Dawn = (ctx: Ctx, f: number, env: Env) => {
  const t0 = cue("So stop watering the dead plant."), tBring = cue("Stop trying to bring something back"), tEnd = cue("Some conversations are supposed to end."), tStr = cue("Some people are supposed to become strangers again."), tHeal = cue("And sometimes the healthiest thing"), tNothing = cue("It's sending nothing."), tDie = cue("Let the chat die."), tOn = cue("And let yourself move on.");
  drawBedroom(ctx, env, f, "dawn", { lights: 0.15 });
  const g = newG(ctx, env, f);
  glowAt(ctx, env, 1420, 520, 700, "#ffe3b0", 0.35);
  phoneOnSill(g);
  // the can: held over the dead plant, then set down on the floor
  const setDown = ramp(f, t0 + 20, t0 + 50), pick = ramp(f, tBring + 10, tBring + 40), out = clamp((f - tEnd) / 70), back = clamp((f - tHeal) / 60), slide = ramp(f, tHeal + 70, tHeal + 110), leave = clamp((f - tOn) / 40);
  const S = 1.75, sy = 890;
  let sx = 1240, pose: Pose;
  const hold = withExpr({ ...standPour(), wristR: [74, -214], elbowR: [48, -186] }, { look: [6, -4], mouth: "flat", brows: -0.2 });
  const crouch = withExpr({ ...stand(), chest: [10, -190], head: [16, -240], elbowR: [30, -120], wristR: [40, -60], tilt: 14 }, { look: [6, 6], eyes: "down", mouth: "soft" });
  const carry = withExpr({ ...stand(), elbowR: [36, -150], wristR: [60, -160], elbowL: [26, -150], wristL: [52, -158], handL: "hold", handR: "hold" }, { look: [4, -2], mouth: "soft" });
  if (f < tBring) pose = setDown < 0.5 ? mixPose(hold, crouch, setDown * 2) : mixPose(crouch, withExpr(stand(), { mouth: "soft" }), (setDown - 0.5) * 2);
  else if (f < tEnd) pose = mixPose(withExpr(stand(), { mouth: "soft" }), carry, pick);
  else if (f < tHeal) { sx = lerp(1240, -300, smooth(out)); pose = { ...walk(f / 24, { mouth: "soft", look: [3, 0], eyes: "open", brows: 0 }), elbowR: [36, -150], wristR: [60, -160], elbowL: [26, -150], wristL: [52, -158], flip: true }; }
  else if (f < tOn) { sx = lerp(-300, 1180, smooth(back)); pose = back < 1 ? walk(f / 24, { mouth: "smile", look: [3, 0], eyes: "open", brows: 0.2 }) : withExpr({ ...stand(), elbowR: [40, -190], wristR: [lerp(66, 64, slide), -214], handR: "open" }, { mouth: f > tDie ? "smile" : "soft", look: [6, -4], brows: 0.3 }); }
  else { sx = lerp(1180, -300, smooth(leave)); pose = { ...walk(f / 22, { mouth: "smile", look: [3, 0], eyes: "open", brows: 0.2 }), flip: true }; }
  // the dead plant: on the sill, then in Sam's arms, then gone
  if (f < tBring + 10) drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, 0.97);
  // the seedling: slid along the sill into the dead plant's place
  const seedX = lerp(SEED_AT[0], PLANT_AT[0], slide);
  drawSeedling(g, f, seedX, SEED_AT[1], 1.1, 1, 710);
  const canAt: P = setDown < 0.5 ? lerpP([sx + 64 * S, sy - 206 * S], [sx + 40 * S, sy - 60 * S], setDown * 2) : [1360, sy - 20];
  wateringCan(g, canAt, setDown < 0.5 ? 0.15 : 0, 860);
  at(g, sx, sy, S, pose, SAM, f, { shadow: 0.3 });
  if (f >= tBring + 10 && f < tHeal) { const hx = sx + (f < tEnd ? 56 : -56) * S, hy = sy - 150 * S + 60; drawPlant(g, f, hx, hy, 0.9, 0.97, 500); }
  // morning light grows
  glowAt(ctx, env, 1500, 380, 900, "#fff0c8", 0.15 * ramp(f, tDie, tOn + 40));
  void tStr; void tNothing; void pool; void field; void ink; void W; void JO; void RAE; void gText; void cloud;
};
