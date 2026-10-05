// Subtle captions: the current cue line, balanced over two lines when long, italic serif on a faint
// paper strip, a 7-frame fade in and out. Drawn straight onto the frame, over everything.
import { Ctx, Env, probeRect } from "./core";
import { CUES } from "./cues";
import { SERIF, clamp, lineAt } from "./kit";

const FADE = 7, PX = 38, MAXW = 1240, Y = 992;
const split = (ctx: Ctx, s: string): string[] => {
  if (ctx.measureText(s).width <= MAXW) return [s];
  const words = s.split(" "); let best = 1, bestD = 1e9;
  for (let i = 1; i < words.length; i++) { const a = ctx.measureText(words.slice(0, i).join(" ")).width, b = ctx.measureText(words.slice(i).join(" ")).width, d = Math.max(a, b); if (d < bestD) { bestD = d; best = i; } }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
};

export const drawCaption = (ctx: Ctx, env: Env, frame: number, o: { dark?: boolean } = {}) => {
  const i = lineAt(frame); if (i < 0) return;
  const [a, b, raw] = CUES[i], s = raw.replace(/"([^"]*)"/g, "\u201c$1\u201d").replace(/(\w)'(\w)/g, "$1\u2019$2"), alpha = clamp(Math.min((frame - a + 1) / FADE, (b - frame) / FADE));
  if (alpha <= 0) return;
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.font = SERIF(PX);
  const lines = split(ctx, s), lh = PX * 1.22, w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56, h = lines.length * lh + 22, cx = env.W / 2, top = Y - h + 22;
  // the strip: a faint torn-paper band, a little wider than the words
  ctx.globalAlpha = alpha * (o.dark ? 0.55 : 0.72); ctx.fillStyle = o.dark ? "#2a2633" : "#fbf6ea";
  ctx.beginPath(); const x0 = cx - w / 2, x1 = cx + w / 2, y0 = top - 6, y1 = top + h - 6, r = 14;
  ctx.moveTo(x0 + r, y0); ctx.lineTo(x1 - r, y0 + 1); ctx.quadraticCurveTo(x1, y0, x1 + 2, y0 + r); ctx.lineTo(x1 - 1, y1 - r); ctx.quadraticCurveTo(x1, y1, x1 - r, y1 + 1); ctx.lineTo(x0 + r, y1); ctx.quadraticCurveTo(x0, y1, x0 - 1, y1 - r); ctx.lineTo(x0 + 1, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0); ctx.fill();
  ctx.globalAlpha = alpha; ctx.fillStyle = o.dark ? "#f4eee4" : "#3a3238"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  lines.forEach((l, k) => { const y = top + lh * (k + 0.5) + 2; ctx.fillText(l, cx, y); probeRect(ctx, env, cx - ctx.measureText(l).width / 2, y - PX / 2, ctx.measureText(l).width, PX, "caption", "text"); });
  ctx.restore();
};
