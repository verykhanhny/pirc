#!/bin/bash
# Use ffmpeg to decode the stream of h264 from the socket and play the feed
#
# Usage: bash ffmpeg-play.sh <tcp or udp url>
# Ex: bash ffmpeg-play.sh udp://0.0.0.0:12345
ffplay \
  -probesize 32 \
  -analyzeduration 0 \
  -sync ext \
  -fflags nobuffer \
  ${1}?listen \
  -vf setpts=0 \
  -flags low_delay \
  -framedrop
