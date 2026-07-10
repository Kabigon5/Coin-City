// Input. Keyboard state, per-frame pressed keys, pointer-lock mouse look,
// wheel zoom, plus light gamepad support (left stick move, right stick look,
// A interact, B run). Overlays release pointer lock automatically.
CC.input = (function () {
  var down = {}, pressed = {}, mdx = 0, mdy = 0, wheel = 0, locked = false;
  var canvas = null, dragging = false;

  function onKeyDown(e) {
    if (e.repeat) return;
    down[e.code] = true; pressed[e.code] = true;
    // Keep the page from scrolling with game keys
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].indexOf(e.code) >= 0) e.preventDefault();
  }
  function onKeyUp(e) { down[e.code] = false; }

  function init(cv) {
    canvas = cv;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", function () { down = {}; });
    canvas.addEventListener("click", function () {
      CC.audio.ensure(); CC.audio.resume();
      // Pointer lock is blocked inside some embedded previews; the
      // drag-to-look fallback below covers those cases.
      if (!CC.paused && !locked) {
        try { canvas.requestPointerLock(); } catch (e) {}
      }
    });
    canvas.addEventListener("mousedown", function () { dragging = true; });
    window.addEventListener("mouseup", function () { dragging = false; });
    document.addEventListener("pointerlockchange", function () {
      locked = document.pointerLockElement === canvas;
    });
    document.addEventListener("mousemove", function (e) {
      if (locked) { mdx += e.movementX; mdy += e.movementY; }
      else if (dragging && !CC.paused) { mdx += e.movementX; mdy += e.movementY; }
    });
    window.addEventListener("wheel", function (e) {
      if (!CC.paused) wheel += e.deltaY;
    }, { passive: true });
    window.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  function unlock() { if (locked && document.exitPointerLock) document.exitPointerLock(); }

  // Gamepad polled per frame
  function pad() {
    var gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < gps.length; i++) if (gps[i] && gps[i].connected) return gps[i];
    return null;
  }
  function dz(v) { return Math.abs(v) < 0.18 ? 0 : v; }

  var prevPadA = false, prevPadStart = false;
  return {
    init: init, unlock: unlock,
    isLocked: function () { return locked; },
    down: function (code) { return !!down[code]; },
    // pressed() consumes the event so one keypress fires one action
    pressed: function (code) { if (pressed[code]) { pressed[code] = false; return true; } return false; },
    endFrame: function () { pressed = {}; mdx = 0; mdy = 0; wheel = 0; },
    mouse: function () { return { dx: mdx, dy: mdy, wheel: wheel }; },
    // movement axis combining WASD, arrows and gamepad left stick
    axis: function () {
      var x = 0, z = 0;
      if (down["KeyW"] || down["ArrowUp"]) z -= 1;
      if (down["KeyS"] || down["ArrowDown"]) z += 1;
      if (down["KeyA"] || down["ArrowLeft"]) x -= 1;
      if (down["KeyD"] || down["ArrowRight"]) x += 1;
      var p = pad();
      if (p) { x += dz(p.axes[0] || 0); z += dz(p.axes[1] || 0); }
      var len = Math.sqrt(x * x + z * z);
      if (len > 1) { x /= len; z /= len; }
      return { x: x, z: z };
    },
    lookPad: function () {
      var p = pad(); if (!p) return { x: 0, y: 0 };
      return { x: dz(p.axes[2] || 0), y: dz(p.axes[3] || 0) };
    },
    running: function () {
      var p = pad();
      return this.down("ShiftLeft") || this.down("ShiftRight") || (p && p.buttons[1] && p.buttons[1].pressed);
    },
    padInteract: function () {
      var p = pad(); if (!p) return false;
      var now = p.buttons[0] && p.buttons[0].pressed;
      var fire = now && !prevPadA; prevPadA = now; return fire;
    },
    padPause: function () {
      var p = pad(); if (!p) return false;
      var now = p.buttons[9] && p.buttons[9].pressed;
      var fire = now && !prevPadStart; prevPadStart = now; return fire;
    }
  };
})();
