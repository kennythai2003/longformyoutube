// Reusable outdoor and indoor sets, each painted once (cachedSet) and blitted per frame.
import { Env, GRAPHITE, Gfx, P, oval, rng } from "./core";
import { boxPts, cachedSet, polyPts } from "./kit";

export const W = (g: Gfx, pts: P[], c: string, seed: number, a = 0.85, rim = true) => g.wash(pts, c, { alpha: a, seed, dx: 0, dy: 0, shrink: 1, rim });
export const ink = (g: Gfx, pts: P[], seed: number, w = 2.4, closed = true, opacity = 0.9) => g.pen(pts, { closed, w, seed, wobble: 0.6, boil: 0.3, taper: 0.5, opacity, color: GRAPHITE });
export const solid = (g: Gfx, pts: P[], c: string, sh: string, seed: number, light: P = [-6, -6]) => { g.group("paint", () => g.form(pts, c, sh, { seed, light })); g.group("ink", () => ink(g, pts, seed + 1)); };
/** a big flat wash laid plain (no granulation over a whole field), softened */
export const field = (g: Gfx, pts: P[], c: string, seed: number, a = 0.94, blur = 2) => g.group("plain", () => W(g, pts, c, seed, a, false), { blur });
/** a soft light or shade pool */
export const pool = (g: Gfx, cx: number, cy: number, rx: number, ry: number, c: string, a: number, seed: number) => g.group("plain", () => W(g, oval(cx, cy, rx, ry, 14), c, seed, a, false), { blur: Math.min(80, rx * 0.25) });

const house = (g: Gfx, x: number, base: number, w: number, h: number, c: string, sh: string, roof: string, seed: number) => {
  const body = boxPts(x, base - h, x + w, base, 6), roofP = polyPts([[x - 14, base - h + 2], [x + w / 2, base - h - w * 0.42], [x + w + 14, base - h + 2]], 5);
  g.group("paint", () => { g.form(body, c, sh, { seed, light: [-6, -6] }); g.form(roofP, roof, roof, { seed: seed + 1, light: [-4, -4] }); });
  const r = rng(seed + 2), wins: P[][] = [];
  const cols = Math.max(1, Math.floor(w / 70)), rows = Math.max(1, Math.floor((h - 40) / 90));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const wx = x + (w / cols) * (i + 0.5) - 16, wy = base - h + 30 + j * 90; if (j === rows - 1 && i === Math.floor(cols / 2) && r() < 0.8) continue; wins.push(boxPts(wx, wy, wx + 32, wy + 40, 3)); }
  const door = boxPts(x + w / 2 - 20, base - 70, x + w / 2 + 20, base, 4);
  g.group("paint", () => { wins.forEach((p, i) => W(g, p, "#fdf3dc", seed + 10 + i, 0.9, false)); W(g, door, sh, seed + 9, 0.9); });
  g.group("ink", () => { ink(g, body, seed + 3, 2.4); ink(g, roofP, seed + 4, 2.4); wins.forEach((p, i) => { ink(g, p, seed + 30 + i, 1.6, true, 0.75); }); ink(g, door, seed + 5, 1.8); });
};
const tree = (g: Gfx, x: number, base: number, s: number, seed: number, leaf = "#8fbf82", leafSh = "#5f9160") => {
  const trunk = polyPts([[x - 9 * s, base], [x - 6 * s, base - 120 * s], [x + 6 * s, base - 120 * s], [x + 9 * s, base]], 4);
  const crown: P[] = []; const r = rng(seed); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = (62 + r() * 18) * s; crown.push([x + Math.cos(a) * rr * 1.05, base - 170 * s + Math.sin(a) * rr * 0.9]); }
  g.group("paint", () => { g.form(trunk, "#9b7660", "#6e5040", { seed }); g.form(crown, leaf, leafSh, { seed: seed + 1, light: [-10, -10] }); });
  g.group("ink", () => { ink(g, trunk, seed + 2, 2.2); ink(g, crown, seed + 3, 2.4); g.hatch(x + 10 * s, base - 160 * s, 40 * s, { n: 6, len: 26 * s, angle: -1.1, seed: seed + 4, opacity: 0.3 }); });
};

/** a quiet street in late-afternoon light: far pavement (y 560-600), road (600-760), near pavement (760+) */
export const streetSet = (env: Env) => cachedSet(env, "street", (g, ctx) => {
  ctx.fillStyle = "#f6efe2"; ctx.fillRect(0, 0, env.W, env.H);
  field(g, boxPts(-30, -30, 1950, 600, 8), "#f3d8bd", 1); pool(g, 1500, 120, 700, 260, "#fbe9c8", 0.7, 2); pool(g, 300, 80, 500, 200, "#cfe0ee", 0.45, 3);
  g.group("paint", () => { W(g, oval(420, 150, 120, 36, 10), "#fbf3e6", 4, 0.8, false); W(g, oval(1180, 110, 160, 40, 10), "#fbf3e6", 5, 0.75, false); });
  const cols: [string, string, string][] = [["#c9d9b8", "#9ab38a", "#b46a5c"], ["#f2c9a6", "#cf9c7c", "#8a6a78"], ["#d6c6e2", "#a996bd", "#b46a5c"], ["#f3dc9a", "#cfb265", "#7b6f8f"], ["#e9b8b4", "#c48884", "#6f7d96"], ["#bcd3e3", "#8eaac0", "#b46a5c"]];
  let x = -40; [220, 260, 200, 300, 230, 280, 240].forEach((w, i) => { const c = cols[i % cols.length]; house(g, x, 560, w, 200 + ((i * 53) % 110), c[0], c[1], c[2], 20 + i * 40); x += w + 24; });
  tree(g, 330, 580, 1.0, 400); tree(g, 1610, 580, 1.15, 420, "#9cc48c");
  field(g, boxPts(-30, 556, 1950, 604, 8), "#ddd0bf", 6); field(g, boxPts(-30, 600, 1950, 764, 8), "#a29aa6", 7); field(g, boxPts(-30, 760, 1950, 1110, 8), "#e6dac8", 8);
  g.group("ink", () => {
    ink(g, [[-20, 600], [960, 602], [1940, 599]], 9, 2.6, false); ink(g, [[-20, 762], [960, 760], [1940, 763]], 10, 2.8, false); ink(g, [[-20, 774], [960, 773], [1940, 775]], 11, 1.4, false, 0.5);
    for (let i = 0; i < 9; i++) ink(g, [[60 + i * 230, 682], [160 + i * 230, 683]], 12 + i, 4, false, 0.55);
    for (let i = 0; i < 10; i++) ink(g, [[i * 210 - 40, 780], [i * 210 - 120, 1090]], 30 + i, 1.3, false, 0.35);
    ink(g, [[-20, 900], [960, 902], [1940, 899]], 45, 1.2, false, 0.3);
    g.hatch(0, 640, 1900, { n: 70, len: 22, angle: -0.9, seed: 46, opacity: 0.12 });
  });
  // a lamp post on the near pavement
  const post = polyPts([[1762, 900], [1768, 330], [1780, 330], [1786, 900]], 6), lamp = polyPts([[1744, 300], [1804, 300], [1792, 340], [1756, 340]], 4);
  g.group("paint", () => { g.form(post, "#5d6a7d", "#3f4a5a", { seed: 50 }); g.form(lamp, "#f6e6b0", "#d9c07a", { seed: 51 }); }); g.group("ink", () => { ink(g, post, 52, 2.2); ink(g, lamp, 53, 2.2); });
});

/** a grassy rise at dusk for the tin-can telephone; ground near y 900 (left) to 860 (right) */
export const duskSet = (env: Env) => cachedSet(env, "dusk", (g, ctx) => {
  ctx.fillStyle = "#f6efe2"; ctx.fillRect(0, 0, env.W, env.H);
  field(g, boxPts(-30, -30, 1950, 700, 8), "#e9b49c", 1); pool(g, 960, 640, 900, 260, "#f8d29c", 0.85, 2); pool(g, 960, 40, 1200, 300, "#9e93c4", 0.55, 3);
  g.group("paint", () => { W(g, oval(980, 610, 90, 90, 14), "#fde7b0", 4, 0.9, false); [[300, 200, 180], [1500, 160, 220], [800, 120, 120]].forEach(([x, y, w], i) => W(g, oval(x, y, w, 26, 10), "#f3c3b4", 5 + i, 0.7, false)); });
  // far hills, then the near rise
  field(g, polyPts([[-30, 700], [300, 620], [700, 660], [1100, 610], [1500, 650], [1950, 600], [1950, 820], [-30, 820]], 6), "#9a8fae", 10);
  field(g, polyPts([[-30, 860], [500, 880], [960, 840], [1400, 850], [1950, 820], [1950, 1110], [-30, 1110]], 6), "#8fa883", 11);
  g.group("ink", () => { ink(g, [[-20, 700], [300, 620], [700, 660], [1100, 610], [1500, 650], [1940, 600]], 12, 1.8, false, 0.6); ink(g, [[-20, 860], [500, 880], [960, 840], [1400, 850], [1940, 820]], 13, 2.6, false);
    const r = rng(14); for (let i = 0; i < 60; i++) { const x = r() * 1920, y = 880 + r() * 190; ink(g, [[x, y], [x + 4, y - 14 - r() * 8]], 20 + i, 1.4, false, 0.45); }
    // a fence along the far field
    for (let i = 0; i < 14; i++) ink(g, [[100 + i * 130, 700], [102 + i * 130, 640]], 90 + i, 2, false, 0.6); ink(g, [[60, 660], [1900, 655]], 110, 1.8, false, 0.55); ink(g, [[60, 684], [1900, 680]], 111, 1.6, false, 0.5);
  });
});

/** a park in soft afternoon light: grass from y 600, trees, a far path */
export const parkSet = (env: Env) => cachedSet(env, "park", (g, ctx) => {
  ctx.fillStyle = "#f6efe2"; ctx.fillRect(0, 0, env.W, env.H);
  field(g, boxPts(-30, -30, 1950, 640, 8), "#cfe3ee", 1); pool(g, 1400, 120, 700, 260, "#fbf1d6", 0.8, 2);
  g.group("paint", () => { [[380, 150, 150], [1100, 110, 190], [1650, 200, 120]].forEach(([x, y, w], i) => W(g, oval(x, y, w, 34, 10), "#fbf8f0", 3 + i, 0.85, false)); });
  field(g, polyPts([[-30, 600], [500, 560], [1000, 590], [1500, 550], [1950, 580], [1950, 700], [-30, 700]], 6), "#a9c79a", 6);
  field(g, boxPts(-30, 640, 1950, 1110, 8), "#9cc48c", 7); pool(g, 960, 860, 900, 220, "#b6d6a2", 0.6, 8);
  field(g, polyPts([[-30, 700], [700, 670], [1950, 690], [1950, 720], [700, 700], [-30, 730]], 6), "#e6dac2", 9);
  [[180, 640, 1.3, 10], [520, 600, 0.9, 20], [1420, 600, 1.0, 30], [1760, 650, 1.4, 40]].forEach(([x, y, s, sd]) => {
    const trunk = polyPts([[x - 10 * s, y], [x - 7 * s, y - 130 * s], [x + 7 * s, y - 130 * s], [x + 10 * s, y]], 4), crown: P[] = []; const r = rng(sd);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = (70 + r() * 20) * s; crown.push([x + Math.cos(a) * rr * 1.1, y - 190 * s + Math.sin(a) * rr * 0.9]); }
    g.group("paint", () => { g.form(trunk, "#9b7660", "#6e5040", { seed: sd }); g.form(crown, "#8fbf82", "#5f9160", { seed: sd + 1, light: [-10, -10] }); });
    g.group("ink", () => { ink(g, trunk, sd + 2, 2.2); ink(g, crown, sd + 3, 2.4); });
  });
  g.group("ink", () => { const r = rng(50); for (let i = 0; i < 70; i++) { const x = r() * 1920, y = 720 + r() * 360; ink(g, [[x, y], [x + 4, y - 12 - r() * 8]], 60 + i, 1.4, false, 0.4); } });
  // the picnic blanket, gingham
  const bl = polyPts([[560, 800], [1360, 800], [1460, 960], [460, 960]], 8);
  g.group("paint", () => { g.form(bl, "#f3d9c9", "#d9b29e", { seed: 200 }); for (let i = 0; i < 8; i++) { const u0 = i / 8, u1 = (i + 0.5) / 8; W(g, polyPts([[560 + 800 * u0, 800], [560 + 800 * u1, 800], [460 + 1000 * u1, 960], [460 + 1000 * u0, 960]], 3), "#e39a9c", 210 + i, 0.4, false); } for (let j = 0; j < 4; j++) { const v0 = j / 4, v1 = (j + 0.5) / 4, y0 = 800 + 160 * v0, y1 = 800 + 160 * v1; W(g, polyPts([[560 - 100 * v0, y0], [1360 + 100 * v0, y0], [1360 + 100 * v1, y1], [560 - 100 * v1, y1]], 3), "#e39a9c", 230 + j, 0.35, false); } });
  g.group("ink", () => ink(g, bl, 240, 2.4));
});
