// ONE rig for every character: drawPerson(g, pose, look, frame). A Look is a palette + hair + clothes;
// a Pose is joint positions. Characters are never drawn any other way. Local units: feet on y = 0,
// the top of the head near y = -300; the figure faces +x (3/4 view) unless pose.flip.
// Light comes from the upper left, always (the world's light, not the figure's).
import { GRAPHITE, Gfx, P, arc, line, oval, rng, tube, turn } from "./core";
import { clamp, lerp, lerpP, openPts } from "./kit";

export type HandKind = "open" | "rest" | "phone" | "hold" | "point" | "hidden";
export type Mouth = "smile" | "flat" | "sad" | "o" | "grin" | "soft";
export type Expr = { mouth: Mouth; brows: number; eyes: "open" | "closed" | "half" | "down"; look: P; blush?: number };
export type Pose = {
  hip: P; chest: P; head: P; tilt: number;
  kneeL: P; ankleL: P; kneeR: P; ankleR: P;
  elbowL: P; wristL: P; elbowR: P; wristR: P;
  handL: HandKind; handR: HandKind;
  expr: Expr; flip?: boolean;
  /** 0 = toes forward (3/4), 1 = shoes seen from the side (walking) */ side?: number;
  /** sitting: thighs come toward the viewer, so the knee sits over the hip */ sit?: boolean;
};
export type HairKind = "crop" | "long" | "bun" | "hood";
export type TopKind = "hoodie" | "cardigan" | "jumper";
export type Look = {
  name: string; seed: number;
  skin: string; skinShade: string; blush: string;
  hair: HairKind; hairC: string; hairShade: string;
  top: TopKind; topC: string; topShade: string; innerC?: string; innerShade?: string;
  legs: string; legsShade: string; shoes: string; shoesShade: string;
  sockL?: string; sockR?: string;
  glasses?: boolean; earrings?: string; tote?: boolean;
};

// ---------------------------------------------------------------- the cast (BRIEF.md: these never change)
export const SAM: Look = {
  name: "Sam", seed: 100, skin: "#f3d2b8", skinShade: "#d9a98b", blush: "#ef9a9a",
  hair: "crop", hairC: "#3b3134", hairShade: "#211b1e",
  top: "hoodie", topC: "#a9c8a0", topShade: "#7c9e78",
  legs: "#4d5a78", legsShade: "#343f58", shoes: "#f4f0e8", shoesShade: "#c9c2b6", sockL: "#9a979c", sockR: "#e2b33c",
};
export const JO: Look = {
  name: "Jo", seed: 200, skin: "#e9bf9c", skinShade: "#c99472", blush: "#ec8f8a",
  hair: "long", hairC: "#4e3427", hairShade: "#30201a",
  top: "cardigan", topC: "#8aa6c9", topShade: "#5f7ea6", innerC: "#f6eedf", innerShade: "#d9ccb5",
  legs: "#3f3c48", legsShade: "#2a2832", shoes: "#7a5a46", shoesShade: "#553d30", earrings: "#e8c35a", tote: true,
};
export const RAE: Look = {
  name: "Rae", seed: 300, skin: "#f6dcc8", skinShade: "#ddb39a", blush: "#f0a3a0",
  hair: "bun", hairC: "#b4572f", hairShade: "#843a1f",
  top: "jumper", topC: "#f2d98a", topShade: "#cfb25c",
  legs: "#7d845a", legsShade: "#5a6040", shoes: "#5c4a44", shoesShade: "#3e312d", glasses: true,
};
export const THEM: Look = {
  name: "them", seed: 400, skin: "#e8c8b0", skinShade: "#c9a48a", blush: "#e9a0a0",
  hair: "hood", hairC: "#4a3a35", hairShade: "#2c221f",
  top: "hoodie", topC: "#c3aedd", topShade: "#8f7bab",
  legs: "#57536a", legsShade: "#3b384a", shoes: "#ece8f0", shoesShade: "#bdb6c6", 
};

// ---------------------------------------------------------------- pose library
const E = (o: Partial<Expr> = {}): Expr => ({ mouth: "soft", brows: 0, eyes: "open", look: [0, 0], ...o });
export const stand = (expr = E()): Pose => ({
  hip: [0, -118], chest: [0, -200], head: [3, -252], tilt: 0,
  kneeL: [-14, -62], ankleL: [-15, -10], kneeR: [15, -62], ankleR: [17, -10],
  elbowL: [-36, -156], wristL: [-38, -116], elbowR: [37, -156], wristR: [40, -116],
  handL: "rest", handR: "rest", expr,
});
/** a walk cycle; `ph` in cycles (1 = one full stride pair). Stride about 62 units per step. */
export const walk = (ph: number, expr = E()): Pose => {
  const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), bob = Math.abs(Math.cos(a)) * 5;
  const footL: P = [s * 30, -10 + Math.max(0, -c) * 9], footR: P = [-s * 30, -10 + Math.max(0, c) * 9];
  return {
    hip: [0, -122 + bob], chest: [3, -204 + bob], head: [7, -256 + bob], tilt: 2,
    kneeL: [s * 15 + 5, -64 + bob * 0.5], ankleL: footL, kneeR: [-s * 15 + 5, -64 + bob * 0.5], ankleR: footR,
    elbowL: [-s * 14 - 4, -160 + bob], wristL: [-s * 26 - 2, -122 + bob], elbowR: [s * 14 + 6, -160 + bob], wristR: [s * 26 + 8, -122 + bob],
    handL: "rest", handR: "rest", expr, side: 1,
  };
};
/** sitting on a bed or bench edge (seat at y = -96), phone in the right hand, head bowed */
export const sitPhone = (expr = E({ eyes: "down", look: [4, 6] })): Pose => ({
  hip: [-4, -104], chest: [6, -184], head: [16, -232], tilt: 9,
  kneeL: [34, -108], ankleL: [30, -12], kneeR: [42, -104], ankleR: [44, -10],
  elbowL: [-14, -138], wristL: [24, -140], elbowR: [26, -138], wristR: [46, -152],
  handL: "rest", handR: "phone", expr, sit: true,
});
export const sitChair = (expr = E()): Pose => ({ ...sitPhone(expr), head: [10, -236], tilt: 3, chest: [3, -186], elbowL: [-18, -142], wristL: [10, -118], elbowR: [24, -142], wristR: [44, -122], handR: "rest" });
export const sitCross = (expr = E()): Pose => ({
  hip: [0, -46], chest: [2, -128], head: [5, -180], tilt: 2,
  kneeL: [-46, -24], ankleL: [14, -14], kneeR: [48, -22], ankleR: [-12, -12],
  elbowL: [-34, -86], wristL: [-28, -50], elbowR: [36, -86], wristR: [30, -50],
  handL: "rest", handR: "rest", expr, sit: true,
});
export const standChin = (expr = E({ brows: -0.4, look: [3, -2] })): Pose => ({ ...stand(expr), elbowR: [30, -150], wristR: [20, -214], handR: "rest", elbowL: [-28, -156], wristL: [14, -150], handL: "rest", tilt: 6, head: [6, -252] });
export const standPour = (expr = E({ eyes: "down", look: [6, 4] })): Pose => ({ ...stand(expr), elbowR: [46, -170], wristR: [70, -178], handR: "hold", elbowL: [26, -150], wristL: [56, -160], handL: "hold", tilt: 8, head: [8, -251] });
export const standPhone = (expr = E({ eyes: "down", look: [5, 6] })): Pose => ({ ...stand(expr), elbowR: [30, -150], wristR: [42, -176], handR: "phone", tilt: 10, head: [8, -251] });

/** blend two poses joint by joint (expression from whichever is nearer) */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const m = (k: keyof Pose) => lerpP(a[k] as P, b[k] as P, t);
  return {
    hip: m("hip"), chest: m("chest"), head: m("head"), tilt: lerp(a.tilt, b.tilt, t),
    kneeL: m("kneeL"), ankleL: m("ankleL"), kneeR: m("kneeR"), ankleR: m("ankleR"),
    elbowL: m("elbowL"), wristL: m("wristL"), elbowR: m("elbowR"), wristR: m("wristR"),
    handL: t < 0.5 ? a.handL : b.handL, handR: t < 0.5 ? a.handR : b.handR, expr: t < 0.5 ? a.expr : b.expr,
    flip: a.flip, side: lerp(a.side ?? 0, b.side ?? 0, t), sit: t < 0.5 ? a.sit : b.sit,
  };
};
/** breathing: the chest and head rise and fall a little */
export const breathe = (p: Pose, frame: number, seed: number, amt = 1): Pose => {
  const b = Math.sin(frame * 0.085 + seed) * 1.6 * amt, h = Math.sin(frame * 0.085 + seed - 0.4) * 1.9 * amt;
  return { ...p, chest: [p.chest[0], p.chest[1] - b], head: [p.head[0], p.head[1] - h], elbowL: [p.elbowL[0], p.elbowL[1] - b * 0.6], elbowR: [p.elbowR[0], p.elbowR[1] - b * 0.6] };
};
/** natural blinks: every ~3-5 s, three frames shut */
export const blinking = (frame: number, seed: number) => { const period = 86 + (seed % 37); const t = (frame + seed * 13) % period; return t < 3; };
export const withExpr = (p: Pose, e: Partial<Expr>): Pose => ({ ...p, expr: { ...p.expr, ...e } });

// ---------------------------------------------------------------- drawing
const ink = (g: Gfx, pts: P[], seed: number, w = 2.6, o: { closed?: boolean; color?: string; opacity?: number; retrace?: boolean; taper?: number } = {}) =>
  g.pen(pts, { closed: o.closed ?? true, w, color: o.color ?? GRAPHITE, seed, wobble: 0.45, boil: 0.32, taper: o.taper ?? 0.5, opacity: o.opacity ?? 0.92, retrace: o.retrace });
const paint = (g: Gfx, pts: P[], c: string, sh: string, seed: number, light: P = [-5, -6]) => g.form(pts, c, sh, { seed, light });

/** a small hand at the wrist, pointing along `ang`; fingers separate, thumb on the side toward the viewer */
const handPts = (wrist: P, ang: number, kind: HandKind, side: 1 | -1): { pts: P[]; lines: P[][] } => {
  const R = 7.2, c: P = [8.5, 0];
  const spec = kind === "open" ? { a: [-0.55, -0.18, 0.18, 0.52], len: 8.5, w: 0.13 } : kind === "point" ? { a: [-0.05], len: 11, w: 0.16 } : { a: [-0.42, -0.14, 0.14, 0.42], len: 3.2, w: 0.14 };
  const on = (a: number, r: number): P => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  const pts: P[] = [[0, -4.6], [4, -6.6]], lines: P[][] = [];
  const ta = -1.65, tl = kind === "open" ? 8 : 5.5;
  pts.push(on(ta - 0.3, R), on(ta - 0.1, R + tl * 0.8), on(ta + 0.08, R + tl), on(ta + 0.3, R + tl * 0.6), on(ta + 0.45, R * 0.98));
  spec.a.forEach((a, i) => { const L = spec.len * (i === 1 ? 1.08 : i === 3 ? 0.82 : 1); pts.push(on(a - spec.w, R + L * 0.5), on(a - spec.w * 0.4, R + L * 0.95), on(a, R + L), on(a + spec.w * 0.4, R + L * 0.95), on(a + spec.w, R + L * 0.5)); if (i < spec.a.length - 1) { const v = on((a + spec.a[i + 1]) / 2, kind === "open" ? R + 1.5 : R + L * 0.5); pts.push(v); lines.push([v, [v[0] + (c[0] - v[0]) * 0.35, v[1] + (c[1] - v[1]) * 0.35]]); } });
  pts.push(on(1.3, R * 0.98), on(1.9, R * 0.95), [3, 6.8], [0, 4.6]);
  const place = (q: P[]): P[] => turn(q.map(([x, y]) => [wrist[0] + x, wrist[1] + y * side] as P), wrist[0], wrist[1], (ang * 180) / Math.PI);
  return { pts: place(pts), lines: lines.map(place) };
};

const PHONE = { body: "#3a3a44", shade: "#22222a", screen: "#bcd6ee", glow: "#e6f2ff" };
/** a phone held at the wrist; `lit` 0..1 is the screen's light */
export const phoneAt = (g: Gfx, wrist: P, ang: number, seed: number, lit = 1, face: "screen" | "back" = "screen") => {
  const a = ang - 1.2, ca = Math.cos(a), sa = Math.sin(a), cx = wrist[0] + Math.cos(ang) * 9, cy = wrist[1] + Math.sin(ang) * 9;
  const rect = (w: number, h: number): P[] => { const out: P[] = []; const cs: P[] = [[-w, -h], [w, -h], [w, h], [-w, h]]; cs.forEach((p, i) => { const q = cs[(i + 1) % 4]; for (let k = 0; k < 4; k++) out.push([p[0] + ((q[0] - p[0]) * k) / 4, p[1] + ((q[1] - p[1]) * k) / 4]); }); return out.map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca] as P); };
  const body = rect(8.5, 15), scr = rect(6.6, 12.6);
  g.group("paint", () => { paint(g, body, PHONE.body, PHONE.shade, seed, [-2, -2]); if (face === "screen") g.wash(scr, lit > 0.5 ? PHONE.glow : PHONE.screen, { alpha: 0.5 + lit * 0.45, seed: seed + 1, dx: 0, dy: 0, shrink: 1, rim: false }); });
  g.group("ink", () => ink(g, body, seed + 2, 1.9));
};

/** the whole figure. `scale` only thickens nothing: push the transform yourself (g.push) to place it. */
export const drawPerson = (g: Gfx, pose: Pose, L: Look, frame: number, o: { lit?: number; noHands?: boolean } = {}) => {
  const fx = pose.flip ? -1 : 1, F = (p: P): P => [p[0] * fx, p[1]], FP = (ps: P[]) => ps.map(F), sd = L.seed;
  const p = pose, blink = blinking(frame, sd);
  const shL = F([p.chest[0] - 27, p.chest[1] + 9]), shR = F([p.chest[0] + 25, p.chest[1] + 9]);
  const hipL = F([p.hip[0] - 14, p.hip[1] + 4]), hipR = F([p.hip[0] + 14, p.hip[1] + 4]);
  const near = fx > 0 ? "R" : "L"; // the arm and leg nearer the viewer: the side the figure faces
  const armW = 9.2, legW = 11;

  // ---- legs (far first)
  const leg = (side: "L" | "R") => {
    const hip = side === "L" ? hipL : hipR, knee = F(side === "L" ? p.kneeL : p.kneeR), ankle = F(side === "L" ? p.ankleL : p.ankleR), s = sd + (side === "L" ? 10 : 20);
    const sock = side === "L" ? L.sockL : L.sockR, sh = p.side ?? 0;
    // shoe: a soft wedge pointing the way the figure faces
    const toe = fx * lerp(16, 22, sh), shoe: P[] = [[-9 * fx, -7], [-11 * fx, 2], [-6 * fx, 7], [toe, 7], [toe + 5 * fx, 3], [toe + 3 * fx, -4], [6 * fx, -8], [0, -10]].map(([x, y]) => [ankle[0] + x, ankle[1] + 4 + y] as P);
    const legTube = tube([hip, knee, [ankle[0], ankle[1] - (sock ? 9 : 4)]], legW, legW * 0.86, false);
    g.group("paint", () => {
      if (sock) paint(g, tube([[ankle[0], ankle[1] - 13], [ankle[0], ankle[1] - 1]], 6.5, 6.5, false), sock, sock === "#e2b33c" ? "#b98a22" : "#706d73", s + 5, [-2, -2]);
      paint(g, legTube, L.legs, L.legsShade, s); paint(g, shoe, L.shoes, L.shoesShade, s + 1, [-3, -3]);
    });
    g.group("ink", () => {
      if (sock) ink(g, tube([[ankle[0], ankle[1] - 13], [ankle[0], ankle[1] - 1]], 6.5, 6.5, false), s + 6, 1.8);
      ink(g, legTube, s + 2, 2.5); ink(g, shoe, s + 3, 2.4);
      ink(g, line([ankle[0] - 9 * fx, ankle[1] + 9], [ankle[0] + toe + 2 * fx, ankle[1] + 9]), s + 4, 1.6, { closed: false, opacity: 0.55, retrace: false });
      // a crease behind the knee
      ink(g, line(lerpP(knee, hip, 0.12), lerpP(knee, ankle, 0.12), 2), s + 7, 1.4, { closed: false, opacity: 0.4, retrace: false });
    });
  };
  // ---- arms
  const arm = (side: "L" | "R") => {
    const sh = side === "L" ? shL : shR, el = F(side === "L" ? p.elbowL : p.elbowR), wr = F(side === "L" ? p.wristL : p.wristR), kind = side === "L" ? p.handL : p.handR, s = sd + (side === "L" ? 30 : 40);
    const sleeve = tube([sh, el, wr], armW, armW * 0.82, false), ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    const cuff = tube([lerpP(el, wr, 0.84), wr], armW * 0.95, armW * 0.9, false);
    g.group("paint", () => { paint(g, sleeve, L.topC, L.topShade, s); paint(g, cuff, L.topShade, L.topShade, s + 1, [-1, -1]); });
    g.group("ink", () => { ink(g, sleeve, s + 2, 2.4); ink(g, cuff, s + 3, 1.6, { opacity: 0.7, retrace: false }); });
    if (kind === "hidden" || o.noHands) return;
    const hs = (Math.cos(ang) >= 0 ? 1 : -1) as 1 | -1, h = handPts(wr, ang, kind === "phone" || kind === "hold" ? "rest" : kind, side === near ? hs : (-hs as 1 | -1));
    if (kind === "phone" && side === near) phoneAt(g, wr, ang, s + 9, o.lit ?? 1);
    g.group("paint", () => paint(g, h.pts, L.skin, L.skinShade, s + 4, [-2, -3]));
    g.group("ink", () => { ink(g, h.pts, s + 5, 1.8, { taper: 0.4 }); h.lines.forEach((q, i) => ink(g, q, s + 6 + i, 1.1, { closed: false, opacity: 0.6, retrace: false })); });
    if (kind === "phone" && side !== near) phoneAt(g, wr, ang, s + 9, o.lit ?? 1);
  };

  // ---- torso
  const torso = () => {
    const hip = F(p.hip), ch = F(p.chest), u: P = [ch[0] - hip[0], ch[1] - hip[1]], ul = Math.hypot(u[0], u[1]) || 1, n: P = [-u[1] / ul, u[0] / ul];
    const at = (t: number, w: number): P => [hip[0] + u[0] * t + n[0] * w, hip[1] + u[1] * t + n[1] * w];
    const hem = p.sit ? -0.08 : -0.17;
    const body: P[] = [at(hem, -33), at(0.3, -34), at(0.72, -33), at(0.95, -27), at(1.04, -12), at(1.06, 0), at(1.04, 12), at(0.95, 27), at(0.72, 33), at(0.3, 34), at(hem, 33), at(hem - 0.02, 12), at(hem - 0.025, 0), at(hem - 0.02, -12)];
    const s = sd + 50, neck = tube([at(1.0, 0), [F(p.head)[0] * 0.6 + ch[0] * 0.4, F(p.head)[1] * 0.45 + ch[1] * 0.55]], 8, 8, false);
    g.group("paint", () => paint(g, neck, L.skin, L.skinShade, s + 9, [-2, -2]));
    g.group("ink", () => ink(g, neck, s + 10, 1.8));
    g.group("paint", () => {
      paint(g, body, L.topC, L.topShade, s, [-7, -8]);
      if (L.top === "cardigan" && L.innerC) { const inner: P[] = [at(1.03, -10), at(0.7, -6), at(hem + 0.05, -7), at(hem + 0.05, 9), at(0.7, 8), at(1.03, 11)]; paint(g, inner, L.innerC, L.innerShade ?? L.innerC, s + 1, [-3, -3]); }
      if (L.top === "hoodie" && L.hair !== "hood") { const hood: P[] = [at(1.0, -26), at(1.13, -22), at(1.2, 0), at(1.13, 22), at(1.0, 25), at(0.97, 0)]; paint(g, hood, L.topShade, L.topShade, s + 2, [-2, -2]); }
      if (L.top === "jumper") { const ribs: P[] = [at(hem, -33), at(hem + 0.09, -33), at(hem + 0.09, 33), at(hem, 33)]; paint(g, ribs, L.topShade, L.topShade, s + 3, [-1, -1]); }
    });
    g.group("ink", () => {
      ink(g, body, s + 4, 2.8);
      if (L.top === "hoodie") {
        // kangaroo pocket and drawstrings
        ink(g, [at(0.1, -20), at(0.34, -16), at(0.36, 16), at(0.1, 21)], s + 5, 1.7, { closed: false, opacity: 0.6, retrace: false });
        if (L.hair !== "hood") { ink(g, [at(0.96, -6), at(0.8, -7), at(0.7, -6)], s + 6, 1.5, { closed: false, opacity: 0.75, retrace: false }); ink(g, [at(0.96, 7), at(0.8, 8), at(0.68, 7)], s + 7, 1.5, { closed: false, opacity: 0.75, retrace: false }); }
      }
      if (L.top === "cardigan") { ink(g, [at(1.03, -10), at(0.7, -6), at(hem + 0.04, -7)], s + 5, 1.8, { closed: false, opacity: 0.8 }); ink(g, [at(1.03, 11), at(0.7, 8), at(hem + 0.04, 9)], s + 6, 1.8, { closed: false, opacity: 0.8 }); [0.25, 0.45, 0.65].forEach((t, i) => ink(g, oval(...at(t, -9), 1.8, 1.8, 6), s + 11 + i, 1.2, { opacity: 0.7 })); }
      if (L.top === "jumper") ink(g, [at(hem + 0.09, -33), at(hem + 0.1, 0), at(hem + 0.09, 33)], s + 5, 1.5, { closed: false, opacity: 0.55, retrace: false });
      // a fold where the arm meets the body
      ink(g, [at(0.86, 24 * fx), at(0.7, 27 * fx)], s + 8, 1.4, { closed: false, opacity: 0.45, retrace: false });
    });
    if (L.tote) { const strap = [at(0.98, -20), at(0.5, -30), at(0.1, -38)], bag: P[] = [at(0.18, -46), at(0.2, -24), at(-0.2, -22), at(-0.24, -48)]; g.group("paint", () => paint(g, bag, "#e8dcc2", "#c2b394", s + 20, [-3, -3])); g.group("ink", () => { ink(g, bag, s + 21, 2); ink(g, strap, s + 22, 1.8, { closed: false }); }); }
  };

  // ---- head: hair behind, face, features, hair in front
  const head = () => {
    const hc = F(p.head), tilt = p.tilt * fx, s = sd + 70, R = 44;
    const H = (pts: P[]) => turn(pts.map(([x, y]) => [hc[0] + x * fx, hc[1] + y] as P), hc[0], hc[1], tilt);
    const face: P[] = [[-40, -22], [-30, -40], [-6, -46], [20, -44], [38, -30], [44, -6], [42, 16], [32, 34], [12, 44], [-6, 45], [-24, 38], [-38, 22], [-44, 0]];
    // hair behind the head
    if (L.hair === "long") {
      const back: P[] = [[-48, -10], [-46, -40], [-20, -56], [14, -56], [42, -40], [50, -10], [52, 30], [54, 70], [50, 92], [30, 98], [8, 70], [-14, 72], [-36, 98], [-54, 92], [-56, 60], [-52, 24]];
      g.group("paint", () => paint(g, H(back), L.hairC, L.hairShade, s, [-4, -6]));
      g.group("ink", () => { ink(g, H(back), s + 1, 2.4); [[-44, 30, -46, 86], [44, 30, 46, 84], [-30, 50, -32, 92]].forEach(([a, b, c, d], i) => ink(g, H([[a, b], [c, d]]), s + 40 + i, 1.3, { closed: false, opacity: 0.45, retrace: false })); });
    }
    // a hood: its back sits behind the head; its rim frames the face (drawn after the features, below)
    if (L.hair === "hood") {
      const hood: P[] = [[-58, 14], [-58, -28], [-36, -62], [4, -70], [42, -58], [60, -26], [62, 14], [54, 46], [26, 58], [-24, 58], [-50, 44]];
      g.group("paint", () => paint(g, H(hood), L.topC, L.topShade, s, [-5, -6]));
      g.group("ink", () => ink(g, H(hood), s + 3, 2.8));
    }
    // ear on the far side of the face, then the face
    const ear: P[] = oval(-42, 6, 8, 11, 8), hooded = L.hair === "hood";
    g.group("paint", () => { if (!hooded) paint(g, H(ear), L.skin, L.skinShade, s + 5, [-2, -2]); paint(g, H(face), L.skin, L.skinShade, s + 6, [-7, -8]); });
    g.group("ink", () => { if (!hooded) { ink(g, H(ear), s + 7, 2); ink(g, H(arc(-42, 6, 4, 6, -1.2, 1.4, 5)), s + 8, 1.3, { closed: false, opacity: 0.6, retrace: false }); } ink(g, H(face), s + 9, 3); });
    if (L.earrings) g.group("paint", () => paint(g, H(oval(-41, 22, 3, 3, 6)), L.earrings!, "#b8902a", s + 10, [-1, -1]));
    // features: shifted toward the facing side (3/4 view)
    const e = p.expr, lk = e.look, fo: P = [9 + lk[0], 4 + lk[1]], T = (pts: P[]) => H(pts.map(([x, y]) => [x + fo[0], y + fo[1]] as P));
    const blushA = 0.45 + (e.blush ?? 0) * 0.4;
    g.group("paint", () => [-1, 1].forEach((k) => g.wash(T(oval(k < 0 ? -19 : 18, 14, k < 0 ? 5 : 7, 4.5, 8)), L.blush, { alpha: blushA, seed: s + 12 + k, dx: 0, dy: 0, shrink: 1, rim: false })));
    g.group("ink", () => {
      const c = g.cur, closed = blink || e.eyes === "closed";
      [-1, 1].forEach((k, i) => {
        const x = k * 15 + (k < 0 ? 2 : 0), y = -2, rw = k < 0 ? 4.1 : 4.7, rh = k < 0 ? 5.6 : 6.2;
        if (closed) { ink(g, T(arc(x, y + 1, rw + 1.5, 3.5, 0.1 * Math.PI, 0.9 * Math.PI, 5)), s + 20 + i, 2.1, { closed: false, retrace: false }); }
        else if (e.eyes === "down") { ink(g, T(arc(x, y + 2, rw + 1.5, 2.6, 0.05 * Math.PI, 0.95 * Math.PI, 5)), s + 20 + i, 2.4, { closed: false, retrace: false }); }
        else {
          const q = T([[x, y]])[0]; g.touch(q[0] - 12, q[1] - 12, q[0] + 12, q[1] + 12);
          c.fillStyle = GRAPHITE; c.beginPath(); c.ellipse(q[0], q[1], rw, e.eyes === "half" ? rh * 0.62 : rh, (tilt * Math.PI) / 180, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#fffaf3"; c.beginPath(); c.arc(q[0] - 1.4 + lk[0] * 0.2, q[1] - 2.2, 1.7, 0, Math.PI * 2); c.fill();
          if (e.eyes === "half") ink(g, T(line([x - rw - 1.5, y - 2.5], [x + rw + 1.5, y - 2.5])), s + 22 + i, 1.8, { closed: false, retrace: false });
        }
        // brows: inner end up when worried (brows < 0), both up when raised (brows > 0)
        const b = e.brows, by = y - 13 - Math.max(0, b) * 4, worry = Math.max(0, -b);
        const innerX = x - k * 6, outerX = x + k * 6, innerY = by - worry * 5, outerY = by + worry * 2;
        ink(g, T([[outerX, outerY], [x, by - 1.5 - worry * 1.5], [innerX, innerY]]), s + 24 + i, 2, { closed: false, retrace: false, opacity: 0.85 });
      });
      // nose: a small tick toward the facing side
      ink(g, T([[4, 5], [7, 11], [3, 13]]), s + 30, 1.6, { closed: false, opacity: 0.7, retrace: false });
      // mouth
      const my = 23, m = e.mouth;
      if (m === "smile") ink(g, T(arc(1, my - 5, 9, 6, 0.15 * Math.PI, 0.85 * Math.PI, 6)), s + 31, 2.3, { closed: false });
      else if (m === "soft") ink(g, T(arc(1, my - 3, 6, 3, 0.2 * Math.PI, 0.8 * Math.PI, 5)), s + 31, 2.1, { closed: false });
      else if (m === "flat") ink(g, T(line([-5, my], [7, my - 0.5], 0.5)), s + 31, 2.1, { closed: false });
      else if (m === "sad") ink(g, T(arc(1, my + 4, 7, 4, 1.2 * Math.PI, 1.8 * Math.PI, 6)), s + 31, 2.1, { closed: false });
      else if (m === "o") { g.group("paint", () => g.form(T(oval(1, my, 3.6, 4.4, 8)), "#9c4d55", "#6d3038", { seed: s + 32 })); ink(g, T(oval(1, my, 3.6, 4.4, 8)), s + 31, 1.8); }
      else if (m === "grin") { const mo: P[] = [[-9, my - 3], [-4, my - 2], [4, my - 2], [10, my - 3], [7, my + 4], [1, my + 7], [-6, my + 4]]; g.group("paint", () => g.form(T(mo), "#a8525c", "#7a3540", { seed: s + 32 })); ink(g, T(mo), s + 31, 2); }
    });
    if (L.glasses) g.group("ink", () => { [-1, 1].forEach((k, i) => ink(g, T(oval(k * 15 + (k < 0 ? 2 : 0), -2, k < 0 ? 9 : 10.5, 9.5, 10)), s + 50 + i, 1.9)); ink(g, T(line([-3, -4], [5, -4], -1.5)), s + 52, 1.7, { closed: false }); ink(g, H([[-40, -4], [-24 + fo[0], -4 + fo[1]]]), s + 53, 1.5, { closed: false, opacity: 0.8 }); });
    // hair in front
    if (L.hair === "crop") {
      const r = rng(s + 60), cap: P[] = [[-46, 8], [-48, -22], [-36, -44], [-14, -54], [2, -54], [6, -66], [12, -54], [30, -50], [44, -34], [48, -14], [44, -16]];
      // a messy fringe: points along the forehead, in and out
      for (let i = 0; i <= 8; i++) { const t = i / 8, x = lerp(42, -40, t), y = lerp(-20, -18, t) + (i % 2 ? 9 + r() * 4 : -2 - r() * 3) + Math.sin(t * Math.PI) * -6; cap.push([x, y]); }
      cap.push([-44, -4]);
      g.group("paint", () => paint(g, H(cap), L.hairC, L.hairShade, s + 61, [-4, -6]));
      g.group("ink", () => { ink(g, H(cap), s + 62, 2.4); ink(g, H([[-20, -44], [-4, -34], [10, -40]]), s + 63, 1.3, { closed: false, opacity: 0.5, retrace: false }); ink(g, H([[18, -46], [26, -32]]), s + 64, 1.2, { closed: false, opacity: 0.5, retrace: false }); });
    }
    if (L.hair === "long") {
      // centre part, two curtains framing the face down past the jaw
      const lf: P[] = [[4, -52], [-14, -50], [-34, -40], [-46, -16], [-48, 20], [-46, 50], [-38, 58], [-34, 30], [-30, -4], [-18, -28], [0, -38]];
      const rt: P[] = [[4, -52], [22, -50], [40, -38], [48, -14], [50, 22], [48, 52], [40, 60], [38, 30], [36, 0], [26, -26], [8, -38]];
      g.group("paint", () => { paint(g, H(lf), L.hairC, L.hairShade, s + 61, [-4, -6]); paint(g, H(rt), L.hairC, L.hairShade, s + 62, [-4, -6]); });
      g.group("ink", () => { ink(g, H(lf), s + 63, 2.3); ink(g, H(rt), s + 64, 2.3); ink(g, H([[-20, -44], [-36, -10], [-40, 40]]), s + 65, 1.2, { closed: false, opacity: 0.45, retrace: false }); ink(g, H([[24, -42], [42, -6], [44, 40]]), s + 66, 1.2, { closed: false, opacity: 0.45, retrace: false }); });
    }
    if (L.hair === "bun") {
      const cap: P[] = [[-46, 6], [-48, -22], [-34, -46], [-6, -54], [24, -50], [44, -32], [48, -10], [40, -24], [20, -34], [-4, -34], [-26, -28], [-40, -12]];
      const bun = oval(-2, -66, 19, 16, 10);
      g.group("paint", () => { paint(g, H(bun), L.hairC, L.hairShade, s + 60, [-3, -4]); paint(g, H(cap), L.hairC, L.hairShade, s + 61, [-4, -6]); });
      g.group("ink", () => { ink(g, H(bun), s + 62, 2.3); ink(g, H(cap), s + 63, 2.4); ink(g, H(arc(-2, -66, 11, 9, 3.6, 5.6, 5)), s + 64, 1.2, { closed: false, opacity: 0.5, retrace: false }); ink(g, H([[-30, -36], [-10, -44], [14, -42]]), s + 65, 1.2, { closed: false, opacity: 0.45, retrace: false }); });
    }
    if (L.hair === "hood") {
      // a dark fringe peeking out, then the hood's rim around the face
      const fringe: P[] = [[-40, -12], [-38, -32], [-20, -44], [6, -46], [30, -40], [42, -22], [40, -10], [30, -22], [18, -18], [6, -26], [-6, -18], [-20, -26], [-30, -14]];
      const rim = tube(arc(2, 2, 49, 50, Math.PI * 0.82, Math.PI * 2.18, 12), 8.5, 8.5, false);
      g.group("paint", () => { paint(g, H(fringe), L.hairC, L.hairShade, s + 70, [-3, -4]); paint(g, H(rim), L.topC, L.topShade, s + 71, [-4, -5]); });
      g.group("ink", () => { ink(g, H(fringe), s + 72, 2.2); ink(g, H(rim), s + 73, 2.6); });
    }
  };

  // paint order: far arm, far leg, near leg, torso, head, near arm
  const far = near === "R" ? "L" : "R";
  if (p.sit) { arm(far); leg(far); torso(); leg(near); head(); arm(near); }
  else { arm(far); leg(far); leg(near); torso(); head(); arm(near); }
};

/** a plain wooden chair under a seated figure (local units: feet at y = 0, seat top at y = -96); draw it BEFORE the figure */
export const drawChair = (g: Gfx, seed = 900, wood = "#a97c5f", woodSh = "#7a5644") => {
  const seat: P[] = [[-46, -100], [44, -100], [48, -88], [-50, -88]].flatMap((a, i, c) => { const b = c[(i + 1) % 4]; return [0, 1, 2, 3].map((k) => [a[0] + ((b[0] - a[0]) * k) / 4, a[1] + ((b[1] - a[1]) * k) / 4] as P); });
  const back: P[] = [[-50, -96], [-50, -210], [-36, -214], [-36, -96]];
  const legs: P[][] = [[[-44, -88], [-46, 0]], [[40, -88], [44, 0]], [[-30, -88], [-28, -12]], [[26, -88], [28, -12]]];
  g.group("paint", () => { g.form(openPts(back, 4), wood, woodSh, { seed, light: [-3, -4] }); legs.forEach((l, i) => g.form(tube(l, 4.5, 4.5, false), woodSh, woodSh, { seed: seed + 1 + i })); g.form(seat, wood, woodSh, { seed: seed + 6, light: [-3, -4] }); });
  g.group("ink", () => { ink(g, openPts(back, 4), seed + 7, 2.4); legs.forEach((l, i) => ink(g, tube(l, 4.5, 4.5, false), seed + 8 + i, 2)); ink(g, seat, seed + 12, 2.4); ink(g, [[-50, -150], [-36, -150]], seed + 13, 1.6, { closed: false, opacity: 0.6 }); });
};
/** a floor cushion under a cross-legged figure */
export const drawCushion = (g: Gfx, color = "#d98f7a", shade = "#a8665a", seed = 950) => {
  const c = oval(0, -10, 78, 18, 14);
  g.group("paint", () => g.form(c, color, shade, { seed, light: [-4, -4] }));
  g.group("ink", () => { ink(g, c, seed + 1, 2.4); ink(g, arc(0, -10, 60, 10, 0.15, Math.PI - 0.15, 6), seed + 2, 1.3, { closed: false, opacity: 0.5 }); });
};

/** a soft cast shadow under the feet */
export const footShadow = (g: Gfx, w = 70, alpha = 0.32) => g.group("paint", () => g.wash(oval(4, 2, w, 9, 10), "#6f6680", { alpha, seed: 9, dx: 0, dy: 0, shrink: 1, rim: false }));
export const _clamp = clamp;
