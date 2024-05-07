#!/bin/bash
# Use ffmpeg to decode the stream of h264 from the socket and play the feed
#
# Usage: bash ffmpeg-play.sh <tcp or udp url>
# Ex: bash ffmpeg-play.sh udp://0.0.0.0:12345
ffplay \
  -fflags nobuffer \
  ${1}?listen \
  -vf "setpts=N/30" \
  -flags low_delay \
  -framedrop