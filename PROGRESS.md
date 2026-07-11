# PROGRESS

Project: Coin City: Build Your Future, Chapter One: Budget Bay
Engine: Three.js r128 (browser real-time 3D), plain script modules, no build step
Updated: Session 2, walkable city milestone COMPLETE and browser-verified

## FINISHED AND WORKING (verified in headless Chrome, zero console errors)
- Project scaffold, git repo (local), tracking docs, Higgsfield prompt library
- game/index.html + full css: HUD, dialogue, phone, panel, menu, cinematic layers styled
- config.js: CC namespace, palettes, full default state, settings, time and math helpers
- audio.js: procedural WebAudio SFX (18 sounds), generative day/evening/night/event/glitch
  music, rain loop. No external audio files needed
- save.js: 3 slots + autosave in localStorage, settings persistence, slot summaries
- input.js: keyboard, pointer-lock mouse look, wheel zoom, basic gamepad
- characters.js: primitive-rig character factory (5 hairstyles, accessories, aprons,
  beard, hats), real pivoted walk cycles, idle sway, NPC class with hourly schedules,
  random pedestrian crowds with shopping bags
- world.js: complete Budget Bay: main street, residential street, cross streets, market
  plaza, park, canal + bridge + pier market, business alley. 9 signed shop buildings
  (bank, city hall, player home, community center damaged/fixed swap, grocery, cafe,
  bakery, general store, repair shop), row homes, decorative buildings, clock tower with
  a working hour hand, animated fountain, glowing bank coin, animated Instant Everything
  billboard (canvas ads rotate; glitch takeover mode; http drop-in slot for Higgsfield),
  3 posters, 3 bus stops, benches (one broken), trees that sway, flags, murals, litter,
  EasyCoins kiosk, broken bicycle prop, driving city bus that pauses at stops,
  day/night sky + sun + lamps + lit shop windows, weather (clear/cloudy/rain particles
  + rain audio), restoration stages 1-3 with visible city changes, 68 colliders
- player.js: third-person controller: camera-relative WASD + gamepad, accel/decel,
  collide-and-slide (browser-verified: wall stop and wall slide), orbit camera with
  wall occlusion raycast, zoom, footsteps (grass vs pavement), bicycle mode ready
- ui.js: HUD chips, toasts, interaction prompt, one-time tutorial hints, tracker,
  fade, banner
- main.js: renderer with graphics presets, game loop, time advance (1s = 1 game min),
  day rollover with weather reroll, NPC schedule table for all 10 named characters,
  interaction scanner (bench resting works), music follows time of day
- QA run in real headless Chrome: boot clean, HUD visible, 10 NPCs + 8 pedestrians
  spawned, movement, collision, sliding, day + night screenshots in exports/

## KNOWN LIMITATIONS (current build, all planned work)
- Boots directly into the city with the default look. Main menu, character creator,
  save/load UI are the dedicated UI checkpoint
- Building doors are visual only until the interiors checkpoint wires the 9 rooms
- Billboard Higgsfield drop-in only loads over http(s) (browser WebGL rule); the
  procedural ad is the file:// fallback by design

## NOT STARTED
interiors.js, dialogue.js, economy.js, phone.js, jobs.js, business.js, futurelens.js,
missions.js (m1-m10), cinematic.js, full menus/creator, assessments, docs/ deliverables

## SESSION 4: UX PASS + JUMP + MISSION 2 (all tests pass in real Chrome)
- Text engine fixed: every canvas sign now auto-shrinks its font to fit and
  renders at 2x resolution. No sign text is cut off anywhere (bank sign, store
  labels, kiosk, plaques all verified on screenshots in exports/)
- Shop clarity: OPEN/CLOSED plaques by every shop door update live with hours;
  closed doors explain their hours right in the interaction prompt; home sign
  renamed YOUR NEW HOME; community center reads UNDER REPAIR; floating name
  tags over all 10 named characters and the store cashier
- Space to jump: proper arc with gravity, landing sound, verified in browser
- MISSION 2: FIRST PROFIT complete: intro after Mission 1, lemonade kit at the
  grocery (10 coins) with a borrow-from-Nia path when broke (repay 12, gentle
  forgiveness if short), stand construction in the plaza, price choice 2 to 5
  coins with demand that honestly responds (95/80/55/35 percent), animated
  customers who walk up, buy or decline with speech, close-early option,
  adaptive YOUR FIRST PROFIT summary teaching revenue minus costs equals
  profit, replay, full save/reload verified mid-selling
- Mission marker is now shared and moves between objectives

## MISSION 1: FIRST BUDGET (COMPLETE, all 10 test scenarios pass in real Chrome)
- Start menu with Continue and New Game; intro dialogue from Grandpa Ledger;
  40-coin grant; mission tracker; animated gold marker and door ring at the store
- Polished Thread + Things: striped awning, display windows, door lamps, welcome
  mat; clean interior with 9 labeled product displays (3 essentials, 6 wants),
  checkout counter with an animated cashier
- Full shopping loop: inspect (price, description, gentle hint, coins-left
  preview), basket add/remove, overspend blocked, checkout review with per-line
  remove, pay, inventory, transaction log, autosaves
- Adaptive YOUR FIRST BUDGET summary (savings/balanced/tight/extras lessons),
  replay, save/reload verified mid-shop and post-completion

## EXACT NEXT STEP
WAITING FOR USER FEEDBACK ON MISSION 1. Do not start Mission 2. Previously planned next: dialogue depth, Mission 2. Old note: interiors.js: nine enterable rooms at x >= 1000 (home, bank, bakery, grocery, cafe,
repair, store, community center, city hall), door interactables with fade transitions
both ways, per-room colliders and props. Then dialogue.js.
