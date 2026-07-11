# CHANGELOG

## Session 1
- Checkpoint 1: project scaffold, git init, tracking docs, Higgsfield prompt
  library (all 15 required outputs plus reference sets), asset manifest with
  drop-in slot system. Three.js r128 vendored for offline play.

## Session 2
- Checkpoints 2-3: engine core, characters with schedules, complete Budget Bay
  district, third-person controller and occlusion camera, UI core, main loop.
- Real-browser QA (headless Chrome + swiftshader): boot clean, zero console
  errors, collision and wall-slide verified, day and night screenshots captured.
- Fixed: fractional minutes in clock text; billboard drop-in loader now http-only
  to avoid a file:// CORS console error.

## Session 3
- Mission 1: FIRST BUDGET complete: start menu (Continue/New Game), intro
  dialogue, 40-coin budget, mission marker, polished store exterior and clean
  interior with 9 labeled displays, cashier, inspect/basket/checkout flow,
  adaptive summary, replay, save/reload. All 10 required test scenarios PASS
  in real Chrome with zero console errors. Movement and camera smoothing polish.

## Session 4
- UX pass: auto-fit sign text at 2x resolution, OPEN/CLOSED plaques,
  closed-hour door prompts, NPC name tags, clearer landmark signs, reworded
  mission hint. Space-to-jump added. Mission 2: FIRST PROFIT implemented and
  fully tested (14 browser assertions incl. borrow path and mid-sale reload).
