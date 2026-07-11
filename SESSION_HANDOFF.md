# SESSION_HANDOFF

Read this first. It is written so a fresh session can continue with zero chat history.

## What this project is
A third-person, explorable, animated 3D financial-literacy adventure game:
Coin City: Build Your Future, Chapter One: Budget Bay. Target players age 10 to 15.
Full requirements live in the project brief the user supplied; the distilled,
binding rules are:
- Real explorable 3D city, third-person character, enterable buildings, missions,
  jobs, business sim, economy, Future Lens, day and night, weather, save system.
- No em dashes anywhere (code comments, dialogue, docs, UI). Use commas or periods.
- No robotic AI language, no placeholder buttons, no fake features.
- Fictional currency (coins), fictional companies, no real personal data collected.

## Engine and launch
- Engine: Three.js r128, vendored locally at game/js/lib/three.min.js. Runs
  offline from the file system, no server and no build step required.
- Launch: open game/index.html in any modern desktop browser (double click).
- Test: open browser devtools console, there must be zero errors on load.
- Syntax check from shell: for f in game/js/*.js; do node --check "$f"; done

## File locations
- game/index.html          entry point, DOM overlay skeleton, script load order
- game/css/style.css       all UI styling
- game/js/*.js             one file per system, load order matters (see index.html)
- assets/                  drop-in slot for Higgsfield renders (see assets/README.md)
- HIGGSFIELD_PROMPTS.md    exact prompts for every required generation
- ASSET_MANIFEST.md        per-asset production records
- PROGRESS.md              current truth about what works
- backups/                 dated ZIP exports, never overwrite old ones

## Architecture conventions (must follow)
- Single global namespace: window.CC. Every file attaches to it, nothing executes
  gameplay until CC.main.init() runs on window load.
- World units are meters, ground plane y=0. City zone id is "city"; interiors get
  ids like "home", "bank" and live far away at x >= 1000 in the same scene.
- Colliders are axis-aligned boxes {x1,z1,x2,z2} per zone in CC.world.colliders.
  Player is a circle r=0.45, resolved per axis (slide along walls).
- CC.world.solids is an array of meshes used for camera occlusion raycasts.
- Game time: CC.state.minutes 0..1439, 1 real second = 1 game minute while
  unpaused. CC.paused is true whenever any DOM overlay is open.
- Interactables: CC.interact.add(zone, {id, x, z, r, label, when, action}).
  main.js scans the current zone each frame, shows the prompt, E triggers action.
- Money: integers, currency word is "coins". Never allow negative cash; spending
  APIs return false instead.

## Higgsfield
Connector exists but a generation attempt returned "No approval received"
(user approval prompt not granted in chat). Do not burn turns retrying blindly.
If the user approves later: run the generations exactly as written in
HIGGSFIELD_PROMPTS.md, download results with curl into assets/ using the file
names in assets/README.md, log each in ASSET_MANIFEST.md. Account had 110
credits on the Plus plan when checked, so favor images over video.

## Backup rules
Local git commits after every checkpoint (remote push unavailable, no remote
configured). After every major playable milestone run:
cd /home/claude/Coin-City && zip -qr "backups/Coin-City_$(date +%Y-%m-%d_%H%M).zip" . -x "backups/*" -x ".git/*"

## Known bugs
None open. Browser QA found and fixed: fractional minutes in the clock
text, and a file:// CORS console error from the billboard drop-in loader.

## STOP: awaiting user playtest of the v3 build (UX pass, jump, Missions 1 and 2).
Mission 3 candidates from the simplified roadmap: scam mission, then emergency
mission. Do not start without user direction.

## Next implementation step
interiors.js: nine enterable rooms at x >= 1000 with door interactables and
fade transitions, then dialogue.js. The walkable-city milestone is done and
browser-verified (see PROGRESS.md and exports/ screenshots).
