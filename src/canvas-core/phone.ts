// The phone close-up: a chat (or a lock screen) held in Sam's hand. Shared by chapters 2, 6, 12, 19.
// Messages pop on their frame; older ones scroll up. All bubbles share three groups, so a long chat stays cheap.
import { Ctx, Env, GRAPHITE, Gfx, P, heart, oval, softBox } from "./core";
import { BUBBLE, UI, clamp, glowAt, measure, pop, polyPts, smooth } from "./kit";
import { Look, SAM } from "./person";

export type Msg = { side: "me" | "them"; text: string; at: number; read?: number };
export type PhoneOpts = {
  cx: number; cy: number; k: number; title: string; avatar: string;
  msgs: Msg[]; draft?: string; caret?: boolean; typing?: number; lock?: number; lockText?: string; lockFrom?: number;
  warm?: number; hand?: Look; tilt?: number; dim?: number;
};
const PW = 470, PH = 920, SW = 424, SH = 836, TOP = -SH / 2, HEAD = 104, INPUT = 86, FONT = 28, LINE = 36;

const wrap = (ctx: Ctx, s: string, max: number): string[] => {
  const out: string[] = []; s.split("\n").forEach((para) => { let cur = ""; para.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (measure(ctx, t, UI(FONT)) > max && cur) { out.push(cur); cur = w; } else cur = t; }); out.push(cur); });
  return out;
};

export const drawPhone = (g: Gfx, ctx: Ctx, env: Env, f: number, o: PhoneOpts) => {
  const warm = o.warm ?? 0, hand = o.hand ?? SAM;
  glowAt(ctx, env, o.cx, o.cy, 620 * o.k, warm > 0.5 ? "#ffe2b0" : "#d4e6ff", 0.32 * (1 - (o.dim ?? 0)));
  g.push(o.cx, o.cy, o.k, ((o.tilt ?? 0) * Math.PI) / 180);
  // the hand behind: palm and fingers wrapping the left edge
  const palm: P[] = [[-150, 230], [-230, 300], [-260, 420], [-200, 560], [60, 560], [120, 470], [90, 360], [-40, 300]];
  g.group("paint", () => g.form(palm, hand.skin, hand.skinShade, { seed: 11, light: [-8, -8] }));
  g.group("ink", () => g.pen(palm, { closed: true, w: 3, seed: 12, wobble: 0.6, boil: 0.35, taper: 0.5 }));
  // the phone
  const body = softBox(0, 0, PW, PH, 5.5, 40), screen = softBox(0, 0, SW, SH, 6, 40);
  g.group("paint", () => g.form(body, "#3a3a46", "#20202a", { seed: 20, light: [-6, -8] }));
  const bg = warm > 0.5 ? "#fbf1e2" : "#eef0f5";
  g.group("plain", () => g.fill(screen, bg));
  // ---- messages (bottom-up), scrolled so the newest sits above the input bar
  const shown = o.msgs.filter((m) => f >= m.at);
  const sizes = shown.map((m) => { const lines = wrap(ctx, m.text, 270); const w = Math.max(...lines.map((l) => measure(ctx, l, UI(FONT)))) + 44, h = lines.length * LINE + 26; return { m, lines, w, h }; });
  const gap = 18, bottom = SH / 2 - INPUT - 18 - smooth(clamp(o.typing ?? 0)) * 70; let y = bottom;
  const placed = sizes.slice().reverse().map((s) => { const grow = smooth(clamp((f - s.m.at) / 8)); const h = (s.h + gap) * grow; const cy = y - s.h / 2; y -= h; return { ...s, cy, k: pop(f, s.m.at, 10) }; });
  const visible = placed.filter((p) => p.cy + p.h / 2 > TOP + HEAD - 40);
  const bx = (p: (typeof placed)[number]) => (p.m.side === "me" ? SW / 2 - 22 - p.w / 2 : -SW / 2 + 22 + p.w / 2);
  const shape = (p: (typeof placed)[number]): P[] => { const b = softBox(0, 0, p.w, p.h, 4, 22); const s = p.m.side === "me" ? 1 : -1; const tip: P = [s * (p.w / 2 + 4), p.h / 2 + 2]; const idx = b.reduce((bi, q, i) => (Math.hypot(q[0] - s * p.w * 0.45, q[1] - p.h / 2) < Math.hypot(b[bi][0] - s * p.w * 0.45, b[bi][1] - p.h / 2) ? i : bi), 0); return [...b.slice(0, idx), tip, ...b.slice(idx)]; };
  const sl = (o.lock ?? 0) < 1;
  if (sl) {
    g.group("plain", () => visible.forEach((p, i) => { g.push(bx(p), p.cy, p.k); g.form(shape(p), p.m.side === "me" ? BUBBLE.me : BUBBLE.them, p.m.side === "me" ? BUBBLE.meShade : BUBBLE.themShade, { seed: 40 + i, light: [-3, -4] }); g.pop(); }), { alpha: 1 - (o.lock ?? 0) });
    g.group("ink", () => visible.forEach((p, i) => { g.push(bx(p), p.cy, p.k); g.pen(shape(p), { closed: true, w: 2, seed: 60 + i, wobble: 0.3, boil: 0.3, taper: 0.5, opacity: 0.7 }); g.pop(); }), { alpha: 1 - (o.lock ?? 0) });
    g.group("plain", () => { const c = g.cur; visible.forEach((p) => { g.push(bx(p), p.cy, p.k); c.font = UI(FONT); c.fillStyle = "#2c2a33"; c.textAlign = "center"; c.textBaseline = "middle"; p.lines.forEach((l, j) => c.fillText(l, 0, (j - (p.lines.length - 1) / 2) * LINE + 1)); g.touch(-p.w / 2, -p.h / 2, p.w / 2, p.h / 2); g.pop(); }); }, { alpha: 1 - (o.lock ?? 0) });
    // "Read" under the last of my messages
    const last = placed[0]; if (last && last.m.side === "me" && last.m.read !== undefined && f >= last.m.read) g.group("plain", () => { const c = g.cur; c.font = UI(20); c.fillStyle = "#8a8794"; c.textAlign = "right"; c.globalAlpha = smooth((f - last.m.read!) / 8); c.fillText("Read", SW / 2 - 26, last.cy + last.h / 2 + 18); c.globalAlpha = 1; g.touch(0, last.cy, SW / 2, last.cy + last.h); });
    // typing dots in a grey bubble on their side
    if ((o.typing ?? 0) > 0.01) { const ty = bottom + 44; g.group("plain", () => { g.push(-SW / 2 + 70, ty, 1); g.form(softBox(0, 0, 100, 52, 4, 20), BUBBLE.them, BUBBLE.themShade, { seed: 80 }); g.pop(); const c = g.cur; for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(f * 0.3 - i * 0.9)); c.fillStyle = "#77737f"; c.globalAlpha = 0.5 + 0.5 * b; c.beginPath(); c.arc(-SW / 2 + 70 + (i - 1) * 22, ty - b * 5, 7, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; g.touch(-SW / 2, ty - 40, 0, ty + 40); }, { alpha: o.typing }); }
  }
  // ---- header and input bar, over the scrolled messages
  g.group("plain", () => {
    g.fill(polyPts([[-SW / 2, TOP], [SW / 2, TOP], [SW / 2, TOP + HEAD], [-SW / 2, TOP + HEAD]], 4), warm > 0.5 ? "#f6e6cf" : "#e2e5ee");
    g.form(oval(-SW / 2 + 62, TOP + HEAD / 2 + 6, 28, 28, 12), o.avatar, o.avatar, { seed: 90 });
    const c = g.cur; c.font = UI(30, 600); c.fillStyle = "#2c2a33"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(o.title, -SW / 2 + 106, TOP + HEAD / 2 + 6);
    c.font = UI(30, 400); c.fillStyle = "#6f8fc0"; c.fillText("‹", -SW / 2 + 12, TOP + HEAD / 2 + 4);
    g.fill(polyPts([[-SW / 2, SH / 2 - INPUT], [SW / 2, SH / 2 - INPUT], [SW / 2, SH / 2], [-SW / 2, SH / 2]], 4), warm > 0.5 ? "#f6e6cf" : "#e2e5ee");
    g.form(softBox(-24, SH / 2 - INPUT / 2, SW - 110, 54, 4, 24), "#ffffff", "#e6e6ec", { seed: 91 });
    g.form(oval(SW / 2 - 40, SH / 2 - INPUT / 2, 22, 22, 10), o.draft ? "#6f93c4" : "#b9c3d6", "#5f7ea6", { seed: 92 });
    const d = o.draft ?? ""; c.font = UI(26); c.fillStyle = d ? "#2c2a33" : "#a3a0ab"; c.textAlign = "left"; const tx = -SW / 2 + 44; c.fillText(d || "Message", tx, SH / 2 - INPUT / 2 + 1);
    if (o.caret && Math.floor(f / 12) % 2 === 0) { const w = d ? measure(c, d, UI(26)) : 0; c.fillStyle = "#4f78c0"; c.fillRect(tx + w + 3, SH / 2 - INPUT / 2 - 16, 3, 32); }
    g.touch(-SW / 2, TOP, SW / 2, SH / 2);
  }, { alpha: (1 - (o.lock ?? 0)) });
  // ---- the lock screen: a notification with their name, hearts drifting up
  if ((o.lock ?? 0) > 0.01) {
    const L = o.lock!, lf = o.lockFrom ?? 0;
    g.group("plain", () => { g.fill(screen, warm > 0.5 ? "#f3c98f" : "#5d6a93"); const c = g.cur; c.font = UI(96, 300); c.fillStyle = "#fffaf0"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("9:41", 0, TOP + 170); c.font = UI(26); c.fillText("Thursday", 0, TOP + 240); g.touch(-SW / 2, TOP, SW / 2, SH / 2); }, { alpha: L });
    const nk = pop(f, lf, 12);
    if (nk > 0) {
      g.push(0, -40, nk);
      g.group("plain", () => { g.form(softBox(0, 0, 380, 120, 5, 24), "#fffaf2", "#e8dccb", { seed: 95 }); g.form(oval(-140, 0, 30, 30, 12), o.avatar, o.avatar, { seed: 96 }); const c = g.cur; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = "#2c2a33"; c.font = UI(28, 600); c.fillText(o.title, -96, -20); c.font = UI(24); c.fillStyle = "#55525d"; c.fillText(o.lockText ?? "", -96, 20, 270); g.touch(-190, -60, 190, 60); }, { alpha: L });
      g.pop();
      // hearts drifting up from the notification
      g.group("paint", () => { for (let i = 0; i < 6; i++) { const t = ((f - lf) / 24 + i * 0.37) % 2.2; if (f < lf + i * 6) continue; const x = -120 + i * 50 + Math.sin(f * 0.07 + i) * 14, y = -110 - t * 150; g.wash(heart(x, y, 14 + (i % 3) * 4), i % 2 ? "#f2899c" : "#e9a3ad", { alpha: 0.85 * clamp(1 - t / 2.2), seed: 97 + i, dx: 0, dy: 0, shrink: 1, rim: false }); } }, { alpha: L });
    }
  }
  if ((o.dim ?? 0) > 0) g.group("plain", () => g.fill(screen, "#1b1d28", o.dim));
  g.group("ink", () => { g.pen(body, { closed: true, w: 3.2, seed: 21, wobble: 0.5, boil: 0.35, taper: 0.5 }); g.pen(screen, { closed: true, w: 1.8, seed: 22, wobble: 0.3, boil: 0.3, opacity: 0.55, retrace: false }); g.pen(oval(0, -PH / 2 + 22, 30, 5, 10), { closed: true, w: 1.6, seed: 23, opacity: 0.6, retrace: false }); });
  // the thumb over the right edge, in front
  const thumb: P[] = [[150, 360], [215, 250], [250, 200], [272, 214], [262, 280], [222, 400], [180, 460]];
  g.group("paint", () => g.form(thumb, hand.skin, hand.skinShade, { seed: 30, light: [-6, -6] }));
  g.group("ink", () => { g.pen(thumb, { closed: true, w: 2.8, seed: 31, wobble: 0.5, boil: 0.35, taper: 0.5 }); g.pen([[236, 228], [252, 222], [262, 230]], { w: 1.4, seed: 32, opacity: 0.6, retrace: false }); });
  g.pop();
};
export const _P = GRAPHITE;
