#!/usr/bin/env bash
# Render the film in 4 chunks (each kept once done, so a restart only loses the chunk in progress),
# join them, add the voiceover, and split a shareable copy into 4 parts under 30 MB.
set -e
cd "$(dirname "$0")/.."
mkdir -p out/chunks parts
B=(0 3460 6920 10380 13802)
for i in 0 1 2 3; do
  f="out/chunks/c$i.mp4"
  [ -f "$f.done" ] && continue
  node tools/render.mjs voiceover --workers 4 --from ${B[$i]} --to ${B[$((i+1))]} --out "$f" > "out/chunks/c$i.log" 2>&1
  touch "$f.done"
done
printf "file 'c%d.mp4'\n" 0 1 2 3 > out/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/film-silent.mp4
ffmpeg -v error -y -i out/film-silent.mp4 -i voiceover.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart "Let the chat die.mp4"
ffmpeg -v error -y -i "Let the chat die.mp4" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a copy -movflags +faststart "Let the chat die (share).mp4"
rm -f parts/*.mp4
ffmpeg -v error -i "Let the chat die (share).mp4" -c copy -map 0 -f segment -segment_time 144 -reset_timestamps 1 -movflags +faststart "parts/p%d.mp4"
for i in 0 1 2 3; do mv "parts/p$i.mp4" "parts/Let the chat die - part $((i+1)) of 4.mp4"; done
ffprobe -v error -show_entries stream=codec_type,duration -of compact "Let the chat die.mp4"
ls -la parts
