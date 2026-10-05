// The film's shared kit: cue sync, easing, cached sets, bubbles, clouds, type, the bloom transition.
// Everything is a pure function of (frame, env); randomness only from rng(seed).
import { Ctx, Env, GRAPHITE, Gfx, Layer, P, PENCIL, displace, fractal, oval, rng, sample, softBox } from "./core";
import { CUES } from "./cues";

export const FPS = 24;

// ---------------------------------------------------------------- cue sync
/** The start frame of the script line beginning with `prefix`. Throws if no line matches, so a changed script can't silently desync a picture event. */
export const cue = (prefix: string, nth = 0): number => {
  const hits = CUES.filter(([, , t]) => t.startsWith(prefix));
  if (!hits[nth]) throw new Error(`cue("${prefix}"${nth ? `, ${nth}` : ""}): no script line starts with that`);
  return hits[nth][0];
};
/** The end frame of that line. */
export const cueEnd = (prefix: string, nth = 0): number => { cue(prefix, nth); return CUES.filter(([, , t]) => t.startsWith(prefix))[nth][1]; };
/** The index of the line showing at `frame` (-1 before the first). */
export const lineAt = (frame: number) => { for (let i = CUES.length - 1; i >= 0; i--) if (frame >= CUES[i][0]) return i; return -1; };

// ---------------------------------------------------------------- easing
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpP = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
/** 0 before frame a, 1 after frame b, eased between. */
export const ramp = (f: number, a: number, b: number) => smooth((f - a) / Math.max(1, b - a));
export const lin = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
/** a pop with overshoot: 0 -> 1.08 -> 1 over `dur` frames from `at` */
export const pop = (f: number, at: number, dur = 9) => { const t = clamp((f - at) / dur); if (t <= 0) return 0; if (t >= 1) return 1; const s = 1.70158 * 1.4; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
export const mixC = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t))).toString(16).padStart(2, "0")).join("");
};
/** a soft, aperiodic wobble in -1..1 */
export const wob = (f: number, seed: number, speed = 0.05) => (fractal(seed, f * speed, seed * 3.1, 1, 1, 2) - 0.5) * 2;

// ---------------------------------------------------------------- the surface
export const newG = (ctx: Ctx, env: Env, frame: number) => new Gfx(ctx, env, frame, PENCIL);
/** Paint a set once per size and reuse it. `key` must name everything its pixels depend on. */
export const cachedSet = (env: Env, key: string, paint: (g: Gfx, ctx: Ctx) => void): Layer => {
  const k = `set:${key}:${env.W}x${env.H}@${env.scale}`; let L = env.cache.get(k) as Layer | undefined;
  if (L) return L;
  L = env.canvas(Math.round(env.W * env.scale), Math.round(env.H * env.scale));
  const g = new Gfx(L.ctx, env, 0, PENCIL); L.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); paint(g, L.ctx);
  env.cache.set(k, L); return L;
};
export const blit = (ctx: Ctx, L: Layer, alpha = 1) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(L.canvas as CanvasImageSource, 0, 0); ctx.restore(); };
/** fill the frame (logical units) */
export const ground = (ctx: Ctx, env: Env, color: string) => { ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = color; ctx.fillRect(0, 0, env.W, env.H); ctx.restore(); };

/**
 * A closed shape with extra points along its edges. The pencil runs a spline through its points,
 * so a box given as 4 corners comes out as a pill: this keeps corners where they are.
 */
export const boxPts = (x0: number, y0: number, x1: number, y1: number, per = 7): P[] => {
  const c: P[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  return c.flatMap((a, i) => { const b = c[(i + 1) % 4]; return Array.from({ length: per }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / per, a[1] + ((b[1] - a[1]) * k) / per] as P); });
};
export const polyPts = (corners: P[], per = 7): P[] => corners.flatMap((a, i) => { const b = corners[(i + 1) % corners.length]; return Array.from({ length: per }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / per, a[1] + ((b[1] - a[1]) * k) / per] as P); });
/** an open polyline with extra points so the spline keeps its corners */
export const openPts = (pts: P[], per = 5): P[] => [...pts.slice(0, -1).flatMap((a, i) => { const b = pts[i + 1]; return Array.from({ length: per }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / per, a[1] + ((b[1] - a[1]) * k) / per] as P); }), pts[pts.length - 1]];
export const move = (pts: P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy]);
export const scaleAbout = (pts: P[], cx: number, cy: number, k: number, ky = k): P[] => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * ky]);

/** paint + line for one shape, the storybook way: shaded wash, then pencil */
export const shape = (g: Gfx, pts: P[], fill: string, shade: string, seed: number, o: { w?: number; ink?: string; light?: P; alpha?: number; inkAlpha?: number } = {}) => {
  g.group("paint", () => g.form(pts, fill, shade, { seed, light: o.light ?? [-6, -7], alpha: o.alpha ?? 0.98 }));
  g.group("ink", () => g.pen(pts, { closed: true, w: o.w ?? 2.6, color: o.ink ?? GRAPHITE, seed: seed + 1, wobble: 0.5, boil: 0.35, taper: 0.5, opacity: o.inkAlpha ?? 0.92 }));
};

// ---------------------------------------------------------------- type
export const SERIF = (px: number, italic = true) => `${italic ? "italic " : ""}${px}px "Liberation Serif", "DejaVu Serif", serif`;
export const UI = (px: number, weight = 500) => `${weight} ${px}px "Liberation Sans", "DejaVu Sans", sans-serif`;
/** text in logical units, on the frame's own context (call inside a g.group("plain") or after) */
export const text = (ctx: Ctx, env: Env, s: string, x: number, y: number, o: { font: string; color?: string; align?: CanvasTextAlign; alpha?: number; base?: CanvasTextBaseline }) => {
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.font = o.font; ctx.fillStyle = o.color ?? GRAPHITE; ctx.textAlign = o.align ?? "center"; ctx.textBaseline = o.base ?? "middle"; ctx.globalAlpha = o.alpha ?? 1; ctx.fillText(s, x, y); ctx.restore();
};
/** text drawn through a Gfx's current transform (so it moves and scales with a pushed group) */
export const gText = (g: Gfx, s: string, x: number, y: number, o: { font: string; color?: string; align?: CanvasTextAlign; alpha?: number; maxW?: number }) => {
  const c = g.cur; c.save(); c.font = o.font; c.fillStyle = o.color ?? GRAPHITE; c.textAlign = o.align ?? "center"; c.textBaseline = "middle"; c.globalAlpha *= o.alpha ?? 1;
  const w = c.measureText(s).width; g.touch(x - w, y - 40, x + w, y + 40); c.fillText(s, x, y, o.maxW); c.restore();
};
export const measure = (ctx: Ctx, s: string, font: string) => { ctx.save(); ctx.font = font; const w = ctx.measureText(s).width; ctx.restore(); return w; };

// ---------------------------------------------------------------- bubbles and clouds
export const BUBBLE = { me: "#cfe3f5", meShade: "#9fbfdc", them: "#f4efe6", themShade: "#d6cdbf", warm: "#fde3c4", warmShade: "#efc192" };
/**
 * A chat bubble centred at (cx, cy). `tail`: which bottom corner carries the tail ("l" | "r" | "none").
 * Drawn through the current transform; `k` 0..1 is its pop scale.
 */
export const bubble = (g: Gfx, cx: number, cy: number, w: number, h: number, o: { fill?: string; shade?: string; tail?: "l" | "r" | "none"; seed?: number; k?: number; text?: string; font?: string; color?: string; alpha?: number } = {}) => {
  const k = o.k ?? 1; if (k <= 0.01) return;
  const seed = o.seed ?? 11, tail = o.tail ?? "r";
  g.push(cx, cy, k);
  const body = softBox(0, 0, w, h, 4.2, 22);
  let pts = body;
  if (tail !== "none") {
    const s = tail === "r" ? 1 : -1, tip: P = [s * (w / 2 + 6), h / 2 + 8];
    // splice a tail in at the bottom corner
    const idx = body.reduce((bi, p, i) => (Math.hypot(p[0] - s * w * 0.42, p[1] - h / 2) < Math.hypot(body[bi][0] - s * w * 0.42, body[bi][1] - h / 2) ? i : bi), 0);
    pts = [...body.slice(0, idx), tip, ...body.slice(idx)];
  }
  g.group("plain", () => g.form(pts, o.fill ?? BUBBLE.them, o.shade ?? BUBBLE.themShade, { seed, light: [-4, -5] }), { alpha: o.alpha ?? 1 });
  g.group("ink", () => g.pen(pts, { closed: true, w: 2.2, seed: seed + 1, wobble: 0.4, boil: 0.3, taper: 0.5, opacity: 0.85 }), { alpha: o.alpha ?? 1 });
  if (o.text) g.group("plain", () => gText(g, o.text!, 0, 1, { font: o.font ?? UI(Math.min(30, h * 0.42)), color: o.color ?? "#2c2a33", maxW: w - 16 }), { alpha: o.alpha ?? 1 });
  g.pop();
};
/** typing dots inside a bubble, animated by frame */
export const typingDots = (g: Gfx, frame: number, cx: number, cy: number, s = 1, alpha = 1) => {
  g.group("plain", () => { const c = g.cur; for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(frame * 0.32 - i * 0.9)); g.touch(cx - 30 * s, cy - 20 * s, cx + 30 * s, cy + 20 * s); c.globalAlpha = alpha * (0.45 + 0.55 * b); c.fillStyle = "#6b6670"; c.beginPath(); c.arc(cx + (i - 1) * 15 * s, cy - b * 4 * s, 5 * s, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; });
};
/** a thought cloud centred at (cx, cy), with a trail of puffs toward `from` */
export const cloud = (g: Gfx, cx: number, cy: number, w: number, h: number, o: { from?: P; seed?: number; k?: number; fill?: string; shade?: string; text?: string; font?: string; alpha?: number } = {}) => {
  const k = o.k ?? 1; if (k <= 0.01) return;
  const seed = o.seed ?? 21, r = rng(seed), n = 11, pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, bulge = 0.16 + r() * 0.08;
    for (let j = 0; j < 4; j++) { const a = a0 + ((a1 - a0) * j) / 4, puff = Math.sin((j / 4) * Math.PI) * bulge; pts.push([Math.cos(a) * (w / 2) * (1 + puff), Math.sin(a) * (h / 2) * (1 + puff * 1.2)]); }
  }
  g.push(cx, cy, k);
  const fill = o.fill ?? "#fbf7ef", shade = o.shade ?? "#d9d2e6", al = o.alpha ?? 1;
  g.group("plain", () => g.form(pts, fill, shade, { seed, light: [-6, -8] }), { alpha: al });
  g.group("paint", () => g.wash(pts, shade, { alpha: 0.18, seed: seed + 5, dx: 4, dy: 6, shrink: 0.9, rim: false }), { alpha: al });
  g.group("ink", () => g.pen(pts, { closed: true, w: 2.3, seed: seed + 1, wobble: 0.5, boil: 0.35, taper: 0.4, opacity: 0.8 }), { alpha: al });
  if (o.from) {
    const fx = (o.from[0] - cx) / k, fy = (o.from[1] - cy) / k;
    [0.62, 0.78, 0.9].forEach((t, i) => { const p: P = [fx * t, fy * t], rr = 13 - i * 4; g.group("paint", () => g.form(oval(p[0], p[1], rr, rr * 0.85, 8), fill, shade, { seed: seed + 10 + i, light: [-2, -3] }), { alpha: al }); g.group("ink", () => g.pen(oval(p[0], p[1], rr, rr * 0.85, 8), { closed: true, w: 1.8, seed: seed + 20 + i, wobble: 0.3, opacity: 0.75 }), { alpha: al }); });
  }
  if (o.text) g.group("plain", () => gText(g, o.text!, 0, 2, { font: o.font ?? SERIF(34), color: "#3a3440", maxW: w * 0.86 }), { alpha: al });
  g.pop();
};

// ---------------------------------------------------------------- light
/** a glow painted straight onto the frame's context (never into a pooled layer: gradients there break determinism) */
export const glowAt = (ctx: Ctx, env: Env, x: number, y: number, r: number, color: string, a: number) => {
  if (a <= 0.003) return;
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalCompositeOperation = "screen";
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r); const hex = (v: number) => Math.round(255 * clamp(v)).toString(16).padStart(2, "0");
  gr.addColorStop(0, color + hex(a)); gr.addColorStop(0.4, color + hex(a * 0.55)); gr.addColorStop(1, color + "00");
  ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
};
/** darken the whole frame toward a colour (multiply), for dusk and night dimming */
export const dim = (ctx: Ctx, env: Env, color: string, a: number) => { if (a <= 0.003) return; ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, env.W, env.H); ctx.restore(); };

// ---------------------------------------------------------------- the bloom transition
/** the wet-edged blob a new chapter blooms through: centred at `c`, radius r (logical units) */
export const bloomPath = (c: P, r: number, seed: number): P[] => displace(sample(oval(c[0], c[1], r, r * 0.92, 14).map(([x, y], i) => { const q = rng(seed + i)(); return [c[0] + (x - c[0]) * (0.9 + q * 0.2), c[1] + (y - c[1]) * (0.9 + q * 0.2)] as P; }), true, 6), Math.min(90, r * 0.18), 0.012, 3, seed);
export const clipTo = (ctx: Ctx, env: Env, pts: P[]) => { ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip(); };

// ---------------------------------------------------------------- paper
export const finishPaper = (g: Gfx) => { g.paper("paper", 0.13); g.vignette("rgba(70,45,55,0.12)"); g.paper("coldpress", 0.2); };
