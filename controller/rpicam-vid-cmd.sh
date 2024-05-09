#!/bin/bash
# This is the equivalent (or as close to equivalent) running rpicam-vid natively as the python code
#
# Usage: bash rpicam-vid-cmd.sh <camera_number> <tcp or udp url> <include_audio>
# Ex: bash rpicam-vid-cmd.sh 0 udp://localhost:12345 true

if [ ${3} == "true" ]; then
  audio_input="
    -itsoffset -0.3
    -f pulse
    -sample_rate 12000
    -thread_queue_size 1024
    -i default"
  audio_codec="
    -c:a aac
    -b:a 32000
    -profile:a aac_low"
fi

rpicam-vid \
  -t 0 \
  --camera ${1} \
  --width 640 \
  --height 480 \
  --autofocus-mode manual \
  --lens-position default \
  -n \
  --flush \
  --codec yuv420 \
  -o - | \
  ffmpeg \
  ${audio_input} \
  -use_wallclock_as_timestamps 1 \
  -thread_queue_size 64 \
  -loglevel warning \
  -y \
  -f rawvideo \
  -pixel_format yuv420p \
  -video_size 640x480 \
  -framerate 30 \
  -i - \
  -c:v libx264 \
  -preset ultrafast \
  -tune zerolatency \
  -profile:v baseline \
  ${audio_codec} \
  -f mpegts \
  ${2}
