// The film: one shot over the whole voiceover. The CHAPTER TABLE places each scene on its script line;
// each new chapter blooms in from a point over 22 frames, and the paper texture and caption go on top.
import { Ctx, Env } from "./core";
import { Film } from "./film";
import { drawCaption } from "./caption";
import { ch1Street, ch2Phone, ch3TinCan, ch4Bedroom } from "./chapters1";
import { ch10Busy, ch11Pattern, ch5Memory, ch6YeahHaha, ch7Interview, ch8Clouds, ch9Chess } from "./chapters2";
import { bloomPath, clipTo, cue, finishPaper, ground, newG, ramp, text, SERIF } from "./kit";

const FPS = 24, BPM = 72, DURATION = 13802, BLOOM = 22;
type Draw = (ctx: Ctx, f: number, env: Env) => void;
type Chapter = { id: string; from: number; draw: Draw; bloom: [number, number]; dark?: boolean };

/** a stand-in for a chapter that isn't drawn yet */
const todo = (title: string): Draw => (ctx, f, env) => { ground(ctx, env, "#efe6d6"); text(ctx, env, title, env.W / 2, env.H / 2 - 40, { font: SERIF(64) }); text(ctx, env, `frame ${f}`, env.W / 2, env.H / 2 + 30, { font: SERIF(28), alpha: 0.5 }); };

export const CHAPTERS: Chapter[] = [
  { id: "street", from: 0, draw: ch1Street, bloom: [960, 540] },
  { id: "phone", from: cue("You used to open your phone"), draw: ch2Phone, bloom: [960, 500] },
  { id: "tincan", from: cue("A conversation is supposed to go back and forth"), draw: ch3TinCan, bloom: [400, 600] },
  { id: "bedroom", from: cue("And eventually you catch yourself thinking"), draw: ch4Bedroom, bloom: [700, 600] },
  { id: "memory", from: cue("Because once you notice it"), draw: ch5Memory, bloom: [560, 460] },
  { id: "yeahhaha", from: cue("And now you're sitting there"), draw: ch6YeahHaha, bloom: [960, 500] },
  { id: "interview", from: cue("And somehow you're now three questions deep"), draw: ch7Interview, bloom: [760, 300] },
  { id: "clouds", from: cue("At some point, you have to stop blaming yourself"), draw: ch8Clouds, bloom: [700, 500] },
  { id: "chess", from: cue("And suddenly you're treating a casual conversation"), draw: ch9Chess, bloom: [800, 520] },
  { id: "busy", from: cue("And here's the thing"), draw: ch10Busy, bloom: [370, 370] },
  { id: "pattern", from: cue("It's the pattern that matters"), draw: ch11Pattern, bloom: [200, 400] },
  { id: "jo", from: cue("Because when someone genuinely wants to talk to you"), draw: todo("12 · Jo reaches out"), bloom: [960, 540] },
  { id: "door", from: cue("And unfortunately, some people won't just tell you"), draw: todo("13 · the door left open"), bloom: [960, 540] },
  { id: "candle", from: cue("You get one good conversation"), draw: todo("14 · the candle"), bloom: [960, 540] },
  { id: "detective", from: cue("You have to stop looking at the occasional"), draw: todo("15 · the detective"), bloom: [960, 540] },
  { id: "couch", from: cue("People who want to talk to you can still be busy"), draw: todo("16 · the couch"), bloom: [960, 540] },
  { id: "polaroids", from: cue("And this is where you need to be honest"), draw: todo("17 · polaroids"), bloom: [960, 540] },
  { id: "watering", from: cue("And because you remember that version"), draw: todo("18 · watering the dead plant"), bloom: [960, 540] },
  { id: "facedown", from: cue("So stop trying"), draw: todo("19 · face-down"), bloom: [960, 540] },
  { id: "picnic", from: cue("The people who genuinely want to be in your life"), draw: todo("20 · the picnic"), bloom: [960, 540] },
  { id: "phonedown", from: cue("So if you're currently staring at a chat"), draw: todo("21 · put the phone down"), bloom: [960, 540] },
  { id: "dawn", from: cue("So stop watering the dead plant"), draw: todo("22 · dawn"), bloom: [960, 540] },
];
// the table must run forward
CHAPTERS.forEach((c, i) => { if (i && c.from <= CHAPTERS[i - 1].from) throw new Error(`chapter ${c.id} starts before ${CHAPTERS[i - 1].id}`); });
export const chapterAt = (f: number) => { let i = 0; while (i + 1 < CHAPTERS.length && f >= CHAPTERS[i + 1].from) i++; return i; };

const draw = (ctx: Ctx, f: number, env: Env) => {
  const i = chapterAt(f), ch = CHAPTERS[i], t = f - ch.from;
  if (i > 0 && t < BLOOM) {
    CHAPTERS[i - 1].draw(ctx, f, env);
    const r = 40 + ramp(t, 0, BLOOM) * Math.hypot(env.W, env.H) * 0.95;
    ctx.save(); clipTo(ctx, env, bloomPath(ch.bloom, r, 900 + i)); ch.draw(ctx, f, env); ctx.restore();
  } else ch.draw(ctx, f, env);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  finishPaper(newG(ctx, env, f));
  drawCaption(ctx, env, f, { dark: ch.dark });
};

export const voiceover: Film = {
  meta: { title: "Let the chat die", W: 1920, H: 1080, fps: FPS, bpm: BPM, durationFrames: DURATION },
  assets: { images: {} },
  shots: [{ id: "film", start: 0, end: DURATION, draw }],
};
