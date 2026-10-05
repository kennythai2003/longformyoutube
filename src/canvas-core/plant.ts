// The token that returns: a pothos in a terracotta pot. One parameter for its state, `wilt` 0..1
// (green and trailing -> drooping, yellowing, losing leaves -> bare brown stems). And a seedling.
import { GRAPHITE, Gfx, P, heart, oval, rng } from "./core";
void heart;
import { clamp, lerp, mixC, polyPts } from "./kit";

const GREEN = "#7fb36f", GREEN_LT = "#a9d38f", GREEN_DK = "#4f8650", DRY = "#b59a5a", DRY_DK = "#8a6d3c", DEAD = "#8c6a48";
const POT = "#d98a5f", POT_SH = "#a9603e", SOIL = "#5b4536";

/** the pot alone; (0,0) is the middle of its base, 1 unit = 1 px at s = 1 */
const pot = (g: Gfx, seed: number) => {
  const body = polyPts([[-46, -78], [46, -78], [36, 0], [-36, 0]], 6), rim = polyPts([[-54, -96], [54, -96], [52, -76], [-52, -76]], 6), soil = oval(0, -92, 44, 6, 10);
  g.group("paint", () => { g.form(body, POT, POT_SH, { seed, light: [-6, -6] }); g.form(rim, POT, POT_SH, { seed: seed + 1, light: [-5, -4] }); g.wash(soil, SOIL, { alpha: 0.9, seed: seed + 2, dx: 0, dy: 0, shrink: 1, rim: false }); });
  g.group("ink", () => { g.pen(body, { closed: true, w: 2.6, seed: seed + 3, wobble: 0.4, boil: 0.3, taper: 0.5 }); g.pen(rim, { closed: true, w: 2.6, seed: seed + 4, wobble: 0.4, boil: 0.3, taper: 0.5 }); g.hatch(14, -64, 20, { n: 5, len: 30, angle: 1.35, seed: seed + 5, opacity: 0.3 }); });
};

/** a pothos leaf: a soft heart-shaped base at `c` (the node), a drawn-out point aimed along `ang` */
const LEAF: P[] = [[0, 0], [1, -5], [6, -9.5], [13, -10.5], [20, -8.5], [26, -4.5], [31, -1], [33, 0], [31, 1.2], [26, 5], [20, 9], [13, 10.8], [6, 9.8], [1, 5.2]];
const orient = (c: P, ang: number, size: number): P[] => { const k = size / 16, ca = Math.cos(ang), sa = Math.sin(ang); return LEAF.map(([a, b]) => [c[0] + (a * ca - b * sa) * k, c[1] + (a * sa + b * ca) * k] as P); };

type Vine = { a: number; len: number; curl: number; side: number; leaves: number };
const VINES: Vine[] = [
  { a: -100, len: 150, curl: -2, side: -1, leaves: 6 }, { a: -78, len: 170, curl: 3, side: 1, leaves: 7 }, { a: -125, len: 120, curl: -6, side: -1, leaves: 5 },
  { a: -55, len: 130, curl: 7, side: 1, leaves: 5 }, { a: -150, len: 150, curl: -2, side: -1, leaves: 6 }, { a: -30, len: 170, curl: 4, side: 1, leaves: 7 },
  { a: -92, len: 95, curl: 1, side: 1, leaves: 4 },
];

/**
 * The plant at (x, y) = middle of the pot's base, scale s. `wilt` 0 = lush, 1 = dead.
 * The vines droop toward the ground with wilt, the leaves yellow then brown, and fall one by one.
 */
export const drawPlant = (g: Gfx, frame: number, x: number, y: number, s: number, wilt: number, seed = 500) => {
  const w = clamp(wilt);
  g.push(x, y, s);
  pot(g, seed);
  const r = rng(seed + 9), sway = (i: number) => Math.sin(frame * 0.045 + i * 1.7) * (2.2 - w * 1.4);
  const stems: P[][] = [], leaves: { c: P; ang: number; size: number; col: string; dk: string; i: number }[] = [];
  VINES.forEach((v, vi) => {
    const pts: P[] = [[v.side * 8 + (vi - 3) * 3, -92]]; let ang = ((v.a + sway(vi)) * Math.PI) / 180;
    const n = 9, step = (v.len * (1 - w * 0.12)) / n;
    for (let k = 0; k < n; k++) {
      // healthy vines arch up and trail; wilting ones are pulled down from the base
      const pull = w * 0.42 * (k / n + 0.4), curl = ((v.curl + sway(vi) * 0.6) * Math.PI) / 180;
      const down = Math.PI / 2 - ang; ang += curl + down * pull * 0.5;
      const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * step, q[1] + Math.sin(ang) * step]);
      // a leaf every other node, alternating sides; fewer survive as it dies
      if (k > 0 && k % 1 === 0 && k <= v.leaves) {
        const keep = r(); if (keep < w * w * 0.9) continue;
        const side = k % 2 ? 1 : -1, la = ang + side * (1.05 - w * 0.5) + w * 0.9, size = lerp(15, 11, w) * (0.8 + 0.4 * r()) * (k === v.leaves ? 0.75 : 1);
        const age = clamp(w * 1.6 - r() * 0.5), col = age < 0.5 ? mixC(GREEN, DRY, age * 2) : mixC(DRY, DEAD, (age - 0.5) * 2), dk = age < 0.5 ? mixC(GREEN_DK, DRY_DK, age * 2) : DRY_DK;
        leaves.push({ c: pts[pts.length - 1], ang: la, size, col, dk, i: leaves.length });
      }
    }
    stems.push(pts);
  });
  const stemC = mixC("#6f9c5f", DRY_DK, w);
  g.group("ink", () => stems.forEach((st, i) => g.pen(st, { w: 3, color: stemC, seed: seed + 20 + i, wobble: 0.3, boil: 0.3, taper: 0.7, retrace: false })));
  const leafPts = (l: (typeof leaves)[number]): P[] => orient(l.c, l.ang, l.size);
  g.group("paint", () => leaves.forEach((l) => { const p = leafPts(l); g.wash(p, l.col, { alpha: 0.92, seed: seed + 40 + l.i, dx: 0, dy: 0, shrink: 1, rim: true }); if (w < 0.5) g.wash(p.map(([a, b]) => [a - 2, b - 2] as P), GREEN_LT, { alpha: 0.35 * (1 - w * 2), seed: seed + 140 + l.i, dx: 0, dy: 0, shrink: 0.7, rim: false }); }));
  g.group("ink", () => leaves.forEach((l) => { const p = leafPts(l); g.pen(p, { closed: true, w: 1.5, color: GRAPHITE, seed: seed + 240 + l.i, wobble: 0.3, boil: 0.3, taper: 0.4, opacity: 0.75, retrace: false }); g.pen([l.c, [l.c[0] + Math.cos(l.ang) * l.size * 1.5, l.c[1] + Math.sin(l.ang) * l.size * 1.5]], { w: 1, color: l.dk, seed: seed + 340 + l.i, wobble: 0.2, opacity: 0.7, retrace: false }); }));
  g.pop();
};

/** a fallen leaf on a surface (for "let it die") */
export const fallenLeaf = (g: Gfx, x: number, y: number, ang: number, seed: number) => {
  const h = heart(0, 0, 10).map(([a, b]) => [a, -b] as P), ca = Math.cos(ang), sa = Math.sin(ang), p = h.map(([a, b]) => [x + a * ca - b * sa, y + a * sa + b * ca] as P);
  g.group("paint", () => g.wash(p, DEAD, { alpha: 0.9, seed, dx: 0, dy: 0, shrink: 1 })); g.group("ink", () => g.pen(p, { closed: true, w: 1.4, seed: seed + 1, wobble: 0.3, opacity: 0.7, retrace: false }));
};

/** the seedling Jo gives: a small pot, two round leaves and a third unfolding; `grow` 0..1 */
export const drawSeedling = (g: Gfx, frame: number, x: number, y: number, s: number, grow = 1, seed = 700) => {
  g.push(x, y, s * 0.62); pot(g, seed); g.pop();
  g.push(x, y, s);
  const sway = Math.sin(frame * 0.06) * 2.5, top: P = [sway * 0.6, -58 - 26 * grow - 4];
  const stem: P[] = [[0, -58], [sway * 0.3, -58 - 14 * grow], top];
  g.group("ink", () => g.pen(stem, { w: 2.4, color: GREEN_DK, seed: seed + 10, wobble: 0.2, boil: 0.3, taper: 0.6, retrace: false }));
  const ls = [orient(top, -0.5 * Math.PI + 1.05, 13 * grow + 2), orient(top, -0.5 * Math.PI - 1.05, 13 * grow + 2), orient(top, -Math.PI / 2 + sway * 0.03, 7 * grow + 1)];
  g.group("paint", () => ls.forEach((p, i) => g.wash(p, i === 2 ? GREEN_LT : GREEN, { alpha: 0.95, seed: seed + 20 + i, dx: 0, dy: 0, shrink: 1 })));
  g.group("ink", () => ls.forEach((p, i) => g.pen(p, { closed: true, w: 1.6, seed: seed + 30 + i, wobble: 0.3, opacity: 0.8, retrace: false })));
  g.pop();
};
