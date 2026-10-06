// The model sheet: every character in every library pose, side by side. Fix drift here, before scenes.
import { Ctx, Env } from "./core";
import { Film } from "./film";
import { finishPaper, ground, newG, text, SERIF } from "./kit";
import { JO, KAI, Look, Pose, RAE, SAM, breathe, drawChair, drawCushion, drawPerson, footShadow, sitCross, sitPhone, stand, standChin, standPhone, standPour, walk } from "./person";

const CAST: Look[] = [SAM, JO, RAE, KAI];
const POSES: [string, (f: number) => Pose][] = [
  ["stand", () => stand()], ["walk 0", () => walk(0)], ["walk .25", () => walk(0.25)], ["sitPhone", () => sitPhone()],
  ["sitCross", () => sitCross()], ["standChin", () => standChin()], ["standPour", () => standPour()], ["standPhone", () => standPhone()],
  ["back", (f) => ({ ...walk(f / 30), back: true })],
  ["flip", () => ({ ...stand({ mouth: "smile", brows: 0.6, eyes: "open", look: [0, 0] }), flip: true })],
];
const draw = (ctx: Ctx, f: number, env: Env) => {
  ground(ctx, env, "#fbf6ea"); const g = newG(ctx, env, f);
  const colW = env.W / POSES.length, rowH = env.H / CAST.length;
  CAST.forEach((L, r) => POSES.forEach(([name, pose], c) => {
    const x = colW * (c + 0.5), y = rowH * (r + 1) - 22, s = (rowH - 40) / 320;
    g.push(x, y, s); footShadow(g, 50); if (name === "sitPhone") drawChair(g); if (name === "sitCross") drawCushion(g); drawPerson(g, breathe(pose(f), f, L.seed), L, f); g.pop();
    if (r === 0) text(ctx, env, name, x, 14, { font: SERIF(16) });
  }));
  CAST.forEach((L, r) => text(ctx, env, L.name, 30, rowH * (r + 0.5), { font: SERIF(20) }));
  finishPaper(g);
};
export const lineup: Film = { meta: { title: "lineup", W: 1920, H: 1080, fps: 24, bpm: 72, durationFrames: 40 }, assets: { images: {} }, shots: [{ id: "sheet", start: 0, end: 40, draw }] };
