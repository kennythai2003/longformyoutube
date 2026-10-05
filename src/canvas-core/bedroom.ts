// Sam's bedroom: the reusable set (painted once per palette and cached) plus its live parts
// (fairy lights, stars, the moon's light). The plant sits on the windowsill: PLANT_AT.
import { Ctx, Env, GRAPHITE, Gfx, P, oval, rng } from "./core";
import { blit, boxPts, cachedSet, glowAt, polyPts } from "./kit";

export type Pal = { wall: string; wallSh: string; wallLt: string; floor: string; floorSh: string; sky: string; skyLt: string; quilt: string; quiltSh: string; patch: string[]; wood: string; woodSh: string; curtain: string; curtainSh: string; night: number };
export const PALS: Record<"night" | "dusk" | "dawn" | "day", Pal> = {
  night: { wall: "#5d6a93", wallSh: "#3f4a70", wallLt: "#8a96bb", floor: "#7a6474", floorSh: "#584556", sky: "#26304f", skyLt: "#3d4b78", quilt: "#c99a86", quiltSh: "#9a6f63", patch: ["#b9a4c9", "#d8b98a", "#9fb6a0", "#c9898f"], wood: "#8f6e60", woodSh: "#654b42", curtain: "#9a8fbf", curtainSh: "#6d6394", night: 1 },
  dusk: { wall: "#c99a92", wallSh: "#9d6f74", wallLt: "#e6bba6", floor: "#a07d6c", floorSh: "#77584d", sky: "#e7a27f", skyLt: "#f5c99a", quilt: "#e3ae8c", quiltSh: "#b77f68", patch: ["#c7b0d8", "#f1d08f", "#a9c9a7", "#e39a9c"], wood: "#a67b62", woodSh: "#7a5644", curtain: "#b9a6d4", curtainSh: "#8c79ac", night: 0.45 },
  dawn: { wall: "#ecd2bd", wallSh: "#c9a693", wallLt: "#f8e6cf", floor: "#c39a7c", floorSh: "#987158", sky: "#f7cfa0", skyLt: "#fde9c4", quilt: "#efbf9f", quiltSh: "#c99277", patch: ["#cbb7e0", "#f6d995", "#b3d4ad", "#f0a6a6"], wood: "#b48a6c", woodSh: "#8a644e", curtain: "#c7b6e2", curtainSh: "#9b88bb", night: 0.1 },
  day: { wall: "#f0e3cb", wallSh: "#d2bfa2", wallLt: "#fbf2de", floor: "#c9a283", floorSh: "#9d7a5f", sky: "#bfe0f2", skyLt: "#e4f2fa", quilt: "#efbf9f", quiltSh: "#c99277", patch: ["#cbb7e0", "#f6d995", "#b3d4ad", "#f0a6a6"], wood: "#b48a6c", woodSh: "#8a644e", curtain: "#c7b6e2", curtainSh: "#9b88bb", night: 0 },
};
export const FLOOR_Y = 860;
export const WIN = { x0: 1190, y0: 150, x1: 1650, y1: 590 };
/** the middle of the plant pot's base, on the sill */
export const PLANT_AT: P = [1500, 602];
export const SEAT: P = [610, 712];
const BULBS: P[] = Array.from({ length: 16 }, (_, i) => { const t = i / 15, x = 70 + t * 1060; return [x, 104 + Math.sin(t * Math.PI) * 74 + Math.sin(t * Math.PI * 4) * 6]; });
const BULB_C = ["#ffd98a", "#ffc3a6", "#fff0b8", "#ffd0e0"];

const W = (g: Gfx, pts: P[], c: string, seed: number, a = 0.85, rim = true) => g.wash(pts, c, { alpha: a, seed, dx: 0, dy: 0, shrink: 1, rim });
const ink = (g: Gfx, pts: P[], seed: number, w = 2.4, closed = true, opacity = 0.9) => g.pen(pts, { closed, w, seed, wobble: 0.6, boil: 0.3, taper: 0.5, opacity });

export const bedroomSet = (env: Env, which: keyof typeof PALS) => cachedSet(env, `bedroom:${which}`, (g, ctx) => {
  const p = PALS[which];
  ctx.fillStyle = "#f6efe2"; ctx.fillRect(0, 0, env.W, env.H);
  // wall, floor, light falling from the window
  // big washes go down plain (granulation over a whole wall reads as stucco), then one light granulating glaze
  g.group("plain", () => { W(g, boxPts(-30, -30, 1950, FLOOR_Y + 8, 10), p.wall, 1, 0.94, false); W(g, boxPts(-30, FLOOR_Y, 1950, 1110, 10), p.floor, 3, 0.96, false); }, { blur: 2 });
  g.group("plain", () => { W(g, oval(1420, 420, 520, 380, 14), p.wallLt, 2, 0.32, false); W(g, oval(1400, 990, 420, 90, 14), p.wallLt, 4, 0.18, false); W(g, oval(420, 260, 520, 260, 12), p.wallSh, 5, 0.18, false); }, { blur: 60 });
  g.group("paint", () => { W(g, boxPts(-30, -30, 1950, FLOOR_Y + 8, 10), p.wall, 6, 0.16, false); W(g, boxPts(-30, FLOOR_Y, 1950, 1110, 10), p.floorSh, 7, 0.14, false); });
  g.group("ink", () => {
    ink(g, [[-20, FLOOR_Y], [700, FLOOR_Y + 2], [1940, FLOOR_Y - 1]], 5, 2.6, false);
    ink(g, [[-20, FLOOR_Y - 26], [900, FLOOR_Y - 25], [1940, FLOOR_Y - 27]], 6, 1.6, false, 0.6);
    const r = rng(7); for (let i = 0; i < 9; i++) { const y = FLOOR_Y + 30 + i * i * 3.2 + i * 9; ink(g, [[-20, y], [960, y + r() * 4], [1940, y - 2]], 8 + i, 1.2, false, 0.35); }
    g.hatch(40, 760, 1000, { n: 40, len: 30, angle: -1.2, seed: 30, opacity: 0.16 });
  });
  // window: sky, moon or sun, frame, curtains, sill
  const { x0, y0, x1, y1 } = WIN;
  g.group("paint", () => {
    W(g, boxPts(x0, y0, x1, y1, 8), p.sky, 40, 0.95);
    W(g, polyPts([[x0, y1 - 160], [x1, y1 - 200], [x1, y1], [x0, y1]], 5), p.skyLt, 41, 0.6, false);
    if (p.night > 0.5) { W(g, oval(1540, 250, 34, 34, 12), "#f6efd2", 42, 0.95); W(g, oval(1556, 240, 30, 30, 12), p.sky, 43, 0.9, false); }
    else { W(g, oval(1420, y1 - 70, 70, 70, 12), "#fff1c7", 44, 0.8, false); }
    // rooftops across the street
    W(g, polyPts([[x0, y1 - 70], [1260, y1 - 70], [1260, y1 - 120], [1330, y1 - 160], [1400, y1 - 120], [1400, y1 - 60], [1520, y1 - 60], [1520, y1 - 100], [1650, y1 - 100], [x1, y1], [x0, y1]], 4), p.night > 0.5 ? "#141a33" : "#9d8f9f", 45, 0.92);
  });
  g.group("ink", () => {
    ink(g, boxPts(x0 - 14, y0 - 14, x1 + 14, y1 + 6, 8), 50, 3);
    ink(g, boxPts(x0, y0, x1, y1, 8), 51, 2.4);
    ink(g, [[(x0 + x1) / 2, y0], [(x0 + x1) / 2 + 1, y1]], 52, 3, false); ink(g, [[x0, (y0 + y1) / 2 - 20], [x1, (y0 + y1) / 2 - 21]], 53, 3, false);
    if (p.night > 0.5) { const r = rng(54); for (let i = 0; i < 14; i++) { const x = x0 + 20 + r() * (x1 - x0 - 40), y = y0 + 20 + r() * 220; g.pen(oval(x, y, 1.6, 1.6, 5), { closed: true, w: 1.6, color: "#f6efd2", seed: 60 + i, wobble: 0.2, retrace: false, opacity: 0.85 }); } }
    // lit windows across the street
    if (p.night > 0.5) [[1300, y1 - 48], [1330, y1 - 48], [1432, y1 - 36], [1560, y1 - 72]].forEach(([x, y], i) => g.fill(boxPts(x, y, x + 14, y + 12, 3), "#f2cf7c", 0.85));
  });
  // curtains, gathered at the sides, and the sill
  const curtain = (cx: number, s: number, seed: number) => { const pts = polyPts([[cx - 50 * s, y0 - 40], [cx + 46 * s, y0 - 40], [cx + 30 * s, y0 + 180], [cx + 52 * s, y1 + 40], [cx - 40 * s, y1 + 40], [cx - 30 * s, y0 + 200]], 6); g.group("paint", () => g.form(pts, p.curtain, p.curtainSh, { seed, light: [-8, -6] })); g.group("ink", () => { ink(g, pts, seed + 1, 2.4); [-20, 0, 20].forEach((d, i) => ink(g, [[cx + d * s, y0 - 30], [cx + d * 0.5 * s, y0 + 190], [cx + d * 1.2 * s, y1 + 30]], seed + 2 + i, 1.3, false, 0.45)); }); };
  curtain(x0 - 46, -1, 80); curtain(x1 + 46, 1, 90);
  const sill = boxPts(x0 - 50, y1 + 6, x1 + 50, y1 + 34, 8);
  g.group("paint", () => g.form(sill, p.wood, p.woodSh, { seed: 100, light: [-4, -4] })); g.group("ink", () => ink(g, sill, 101, 2.6));
  // fairy-light wire (the bulbs' glow is live)
  g.group("ink", () => { ink(g, BULBS, 110, 1.6, false, 0.8); BULBS.forEach(([x, y], i) => g.pen(oval(x, y + 9, 5.5, 8, 7), { closed: true, w: 1.5, seed: 120 + i, wobble: 0.2, opacity: 0.7, retrace: false })); });
  g.group("paint", () => BULBS.forEach(([x, y], i) => W(g, oval(x, y + 9, 5, 7.5, 7), BULB_C[i % 4], 140 + i, 0.9, false)));
  // two small framed drawings over the bed
  const frame = (bx: number, by: number, w: number, h: number, seed: number, art: (cx: number, cy: number) => void) => { const f = boxPts(bx, by, bx + w, by + h, 6), m = boxPts(bx + 10, by + 10, bx + w - 10, by + h - 10, 6); g.group("paint", () => { g.form(f, p.wood, p.woodSh, { seed, light: [-3, -3] }); W(g, m, "#f3ead9", seed + 1, 0.95); }); art(bx + w / 2, by + h / 2); g.group("ink", () => { ink(g, f, seed + 2, 2.2); ink(g, m, seed + 3, 1.4, true, 0.6); }); };
  frame(300, 300, 130, 150, 160, (cx, cy) => g.group("paint", () => { W(g, polyPts([[cx - 45, cy + 40], [cx - 10, cy - 30], [cx + 10, cy], [cx + 25, cy - 15], [cx + 45, cy + 40]], 4), "#8fb0c9", 165); W(g, oval(cx + 22, cy - 34, 9, 9, 8), "#f2c46b", 166); }));
  frame(470, 340, 110, 110, 170, (cx, cy) => g.group("paint", () => { W(g, oval(cx, cy + 4, 26, 26, 10), "#e79a8f", 175); W(g, oval(cx - 8, cy - 4, 9, 9, 8), "#f6e1c5", 176, 0.8, false); }));
  // the bed: headboard, legs, mattress, quilt, pillow
  const head = polyPts([[104, 520], [250, 520], [256, 820], [98, 820]], 6), mattress = polyPts([[240, 680], [920, 682], [924, 744], [236, 746]], 8);
  const quilt = polyPts([[380, 668], [930, 672], [948, 760], [944, 842], [600, 846], [384, 840]], 8), pillow: P[] = [[250, 642], [282, 624], [372, 626], [400, 646], [396, 690], [362, 702], [272, 700], [246, 680]];
  g.group("paint", () => { g.form(head, p.wood, p.woodSh, { seed: 200, light: [-6, -6] }); [[236, 830], [900, 830]].forEach(([x, y], i) => g.form(boxPts(x, y - 10, x + 22, y + 30, 3), p.woodSh, p.woodSh, { seed: 205 + i })); g.form(mattress, "#efe6da", "#c9bba9", { seed: 210 }); });
  g.group("paint", () => { g.form(quilt, p.quilt, p.quiltSh, { seed: 220, light: [-8, -8] }); const r = rng(225); for (let i = 0; i < 10; i++) { const cx = 440 + (i % 5) * 100, cy = 712 + Math.floor(i / 5) * 70; W(g, boxPts(cx - 34, cy - 24, cx + 34, cy + 24, 4), p.patch[Math.floor(r() * 4)], 230 + i, 0.55, false); } g.form(pillow, "#f6f0e6", "#d4c8b8", { seed: 250, light: [-4, -5] }); });
  g.group("ink", () => {
    ink(g, head, 201, 2.8); ink(g, [[118, 560], [236, 560]], 202, 1.6, false, 0.5); ink(g, mattress, 211, 2.2); ink(g, quilt, 221, 2.8); ink(g, pillow, 251, 2.4);
    ink(g, [[384, 700], [940, 704]], 222, 1.3, false, 0.45); ink(g, [[384, 776], [944, 780]], 223, 1.3, false, 0.45);
    [430, 530, 630, 730, 830].forEach((x, i) => ink(g, [[x, 676], [x + 3, 838]], 224 + i, 1.2, false, 0.4));
    g.hatch(390, 812, 540, { n: 34, len: 22, angle: -1.25, seed: 240, opacity: 0.22 });
  });
  // a rug, then the paper
  g.group("paint", () => W(g, oval(1090, 960, 330, 52, 14), p.patch[0], 260, 0.55));
  g.group("ink", () => { ink(g, oval(1090, 960, 330, 52, 14), 261, 2); ink(g, oval(1090, 960, 290, 40, 14), 262, 1.3, true, 0.5); });
});

/** the set plus its living parts: twinkling fairy lights (`lights` 0..1), stars and the moon's glow */
export const drawBedroom = (ctx: Ctx, env: Env, frame: number, which: keyof typeof PALS, o: { lights?: number } = {}) => {
  blit(ctx, bedroomSet(env, which));
  const p = PALS[which], lights = o.lights ?? 1;
  BULBS.forEach(([x, y], i) => { const tw = 0.75 + 0.25 * Math.sin(frame * 0.11 + i * 2.3) * Math.sin(frame * 0.037 + i); glowAt(ctx, env, x, y + 9, 38, BULB_C[i % 4], 0.5 * lights * tw * (0.3 + p.night * 0.7)); });
  if (p.night > 0.5) glowAt(ctx, env, 1545, 250, 120, "#cfd8f0", 0.16 + 0.03 * Math.sin(frame * 0.05));
};
export const _g = GRAPHITE;
