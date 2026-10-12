# Pipe Drop – chat-controlled YouTube Live game (v1)
Static site (index.html + game.js + matter.min.js). 1280x720, dark theme.
## Commands
- `!1` drops into the left Ouroboros ring, `!2` into the right ring. Each tile your ball hits pays its number in gold.
- `!toll 0-15` only the current 👑 leader can set it; every drop by someone else pays the leader that much gold.
- `!song` reserved (set display text with `?song=Name`).
## Test
Open the URL, click **TEST** (bottom-right), type username + message, or "Spawn 10 bots". Leaderboard persists in localStorage ("Reset LB" clears).
## OBS
Add **Browser Source**, URL `<site>/?obs=1&apiKey=KEY&videoId=VIDEO_ID`, width 1280, height 720.
## YouTube API key
1. console.cloud.google.com → new project → enable **YouTube Data API v3**.
2. Credentials → Create API key (restrict to YouTube Data API v3).
3. Start your stream, copy the video ID from the watch URL (youtube.com/live/**ID**), put it in the URL.
Quota: default 10,000 units/day; each poll ≈5 units, so polling every 5s ≈ 7h of stream. Use `&poll=8000` to slow polling for longer streams.
