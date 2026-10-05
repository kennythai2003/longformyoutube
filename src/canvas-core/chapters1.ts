// Chapters, one function per scene: (ctx, frame, env), frame = the FILM's frame so events fire on cue().
import { Ctx, Env } from "./core";
import { PALS, PLANT_AT, drawBedroom } from "./bedroom";
import { cloud, cue, glowAt, lerp, newG, pop, ramp, smooth } from "./kit";
import { SAM, breathe, drawPerson, footShadow, mixPose, sitPhone, stand, standPour, withExpr } from "./person";
import { drawPlant } from "./plant";

// ---------------------------------------------------------------- 4. the bedroom at night
// "And eventually you catch yourself thinking" -> "Because once you notice it"
export const ch4Bedroom = (ctx: Ctx, f: number, env: Env) => {
  const tWhy = cue('"Why am I doing all of this?"'), tHard = cue("Why am I working this hard"), tStep = cue("That's when you need to take a step back"), tHardest = cue("Because sometimes the hardest thing"), tAlive = cue("You're the one keeping it alive"), tHorrible = cue("And I know that's a horrible realization");
  drawBedroom(ctx, env, f, "night", { lights: 1 - 0.35 * ramp(f, tHardest, tHorrible) });
  const g = newG(ctx, env, f);
  // the plant: drooping as the chapter goes on; propped up while Sam holds it, then let go
  const held = ramp(f, tAlive + 10, tAlive + 30) * (1 - ramp(f, tHorrible + 20, tHorrible + 40));
  const wilt = lerp(0.42, 0.62, ramp(f, tHardest, tAlive)) - held * 0.3 + ramp(f, tHorrible + 20, tHorrible + 60) * 0.06;
  drawPlant(g, f, PLANT_AT[0], PLANT_AT[1], 1.15, wilt);
  // Sam: on the bed with the phone -> stands, steps back -> crosses to the window and holds the plant up
  const S = 1.75, seated = withExpr(sitPhone(), { eyes: f > tWhy - 12 && f < tStep ? "half" : "down", brows: f > tWhy - 12 ? -0.6 : -0.2, mouth: f > tWhy ? "flat" : "soft" });
  const up = ramp(f, tStep, tStep + 20), back = ramp(f, tStep + 12, tStep + 44), toPlant = ramp(f, tAlive - 34, tAlive + 8);
  const standing = withExpr(stand(), { brows: -0.5, mouth: "flat", look: [2, -2] }), atPlant = withExpr(standPour(), { brows: -0.3, eyes: "open", look: [6, -4], mouth: "flat" });
  let pose = up < 1 ? mixPose(seated, standing, up) : toPlant > 0 ? mixPose(standing, atPlant, toPlant) : standing;
  pose = breathe(pose, f, SAM.seed);
  const x = 610 - back * 120 + toPlant * 900, feet = lerp(886, 892, up);
  g.push(x, feet, S); footShadow(g, 64, 0.3); drawPerson(g, pose, SAM, f, { lit: up < 1 ? 1 : 0.3 }); g.pop();
  // the phone's light on Sam's face while seated
  if (up < 1) glowAt(ctx, env, x + 46 * S, feet - 150 * S, 150, "#cfe4ff", 0.42 * (1 - up) * (0.92 + 0.08 * Math.sin(f * 0.3)));
  // the thought clouds
  const c1 = pop(f, tWhy, 10) * (1 - smooth((f - tStep) / 14)), c2 = pop(f, tHard, 10) * (1 - smooth((f - tStep) / 14));
  if (c1 > 0) cloud(g, 960 + Math.sin(f * 0.05) * 6, 300 + Math.sin(f * 0.04) * 5, 470, 150, { k: c1, from: [x + 30, feet - 300 * S + 20], text: "why am I doing all of this?", seed: 31 });
  if (c2 > 0) cloud(g, 1010 + Math.sin(f * 0.045 + 1) * 6, 120 + Math.sin(f * 0.05 + 2) * 4, 400, 120, { k: c2, text: "why this hard?", seed: 37, font: undefined });
  void PALS;
};
