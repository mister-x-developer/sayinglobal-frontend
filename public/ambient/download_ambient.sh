#!/bin/bash
cd frontend/public/ambient

download() {
  # $1 = url, $2 = name
  echo "Downloading $2..."
  if [ ! -f "$2.mp4" ]; then
    ./yt-dlp "$1" -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --download-sections "*00:00:10-00:00:25" --force-keyframes-at-cuts -o "$2.%(ext)s"
  fi
}

download "https://www.youtube.com/watch?v=mPZkdNFkNps" "rain_day"
download "https://www.youtube.com/watch?v=1bPEqEdF2A0" "rain_night"
download "https://www.youtube.com/watch?v=TZArawOSy1o" "thunder_day"
download "https://www.youtube.com/watch?v=T0XEq8YVvS8" "thunder_night"
download "https://www.youtube.com/watch?v=1-YGEyvA2oY" "ocean_day"
download "https://www.youtube.com/watch?v=4yqMVv1oB34" "ocean_night"
download "https://www.youtube.com/watch?v=odKxL4A4xJ0" "forest_day"
download "https://www.youtube.com/watch?v=xNN7iTA57jM" "forest_night"
download "https://www.youtube.com/watch?v=Pof1B6n6T94" "night_day"
download "https://www.youtube.com/watch?v=4yqMVv1oB34" "night_night"
