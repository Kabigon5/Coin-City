# Coin City: Build Your Future
## Chapter One: Budget Bay

A third-person, explorable, animated 3D financial-literacy adventure game for
players age 10 to 15. Built with Three.js r128, runs offline in any modern
desktop browser, no install and no server needed.

## Launch
Open game/index.html in Chrome, Edge, or Firefox (double click the file).
Click the game window once to enable mouse look and audio.

This README is expanded at each checkpoint. See PROGRESS.md for the current
truthful build state and SESSION_HANDOFF.md for developer continuation notes.

## Controls (current build)
WASD or arrows: walk. Shift: run. Mouse: camera (click the screen first).
Mouse wheel: zoom. E: interact. Esc: release the mouse. Gamepad: left stick
move, right stick camera, A interact, B run.

## What is playable right now
Free exploration of the whole Budget Bay district: main street, plaza, park,
canal bridge, pier market, business alley and residential street, with 10
scheduled story characters and pedestrian crowds, a driving bus, day and night,
weather, animated billboard and working bench rests. Story missions, interiors,
jobs and the business sim arrive in the next checkpoints (see PROGRESS.md).

## Higgsfield drop-in note
assets/ images swap in automatically when the game is served over http, for
example: python3 -m http.server inside the project folder, then open
http://localhost:8000/game/. Opened directly from the file system the game
uses its built-in procedural artwork instead (a browser WebGL security rule).


## Play online
https://kabigon5.github.io/Coin-City/game/
