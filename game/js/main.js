// Main bootstrap and game loop. Builds the renderer and scene, constructs
// Budget Bay, spawns the player and the scheduled cast, advances game time,
// runs the interaction scanner, and drives every per-frame system.
// NOTE for this milestone: the game boots straight into the city with the
// default look so the district can be play-tested. The main menu, character
// creator and save-load screens are the next UI checkpoint and will replace
// this direct boot (see PROGRESS.md).
CC.main = (function () {
  var renderer, scene, camera, clock;
  var currentInteract = null;

  // Daily routines for the named cast. Hours are 24h start times.
  // Interiors are not built yet, so interior stops use hide until that
  // checkpoint wires them to real rooms.
  function schedules() {
    return {
      ledger: [
        { h: 0, hide: true, zone: "city", x: -100, z: -28 },
        { h: 8, zone: "city", x: -99, z: -28.6, face: 0.4 },        // park bench mornings
        { h: 13, route: [[-24, -8], [24, -8], [24, -28], [-24, -28]] }, // plaza stroll
        { h: 18, zone: "city", x: 96, z: -5, face: 0 },             // evenings by the center
        { h: 22, hide: true, zone: "city", x: -100, z: -28 }
      ],
      penny: [
        { h: 0, hide: true, zone: "city", x: -43, z: -6 },
        { h: 9, zone: "city", x: -46, z: -6.4, face: Math.PI },     // outside the bank
        { h: 17, route: [[-43, -6], [-24, -8], [0, -30], [24, -8]] },
        { h: 20, hide: true, zone: "city", x: -43, z: -6 }
      ],
      milo: [
        { h: 0, hide: true, zone: "city", x: 48, z: 7 },
        { h: 9, route: [[10, 6], [10, 40], [-2, 40], [-2, 6]] },
        { h: 15, zone: "city", x: 45, z: 6.6, face: Math.PI },      // window shopping after school
        { h: 20, hide: true, zone: "city", x: 48, z: 7 }
      ],
      nia: [
        { h: 0, hide: true, zone: "city", x: 21, z: 7 },
        { h: 7, zone: "city", x: 21, z: 6.6, face: Math.PI },       // at the bakery
        { h: 18, zone: "city", x: 24, z: -12, face: 0.6 },
        { h: 21, hide: true, zone: "city", x: 21, z: 7 }
      ],
      dex: [
        { h: 0, hide: true, zone: "city", x: -50, z: 25 },
        { h: 10, zone: "city", x: -48.5, z: 25.4, face: Math.PI },  // by the EasyCoins kiosk
        { h: 16, zone: "city", x: -22, z: -27, face: 0.3 },         // under the billboard
        { h: 22, hide: true, zone: "city", x: -50, z: 25 }
      ],
      nova: [
        { h: 0, hide: true, zone: "city", x: 0, z: 64 },
        { h: 11, route: [[-40, 64], [40, 64], [40, 67], [-40, 67]] }, // filming the waterfront
        { h: 17, zone: "city", x: 2, z: 63, face: Math.PI },        // sunset shots
        { h: 21, hide: true, zone: "city", x: 0, z: 64 }
      ],
      mint: [
        { h: 0, hide: true, zone: "city", x: 0, z: -30 },
        { h: 8, zone: "city", x: 0, z: -30.4, face: Math.PI },      // city hall steps
        { h: 19, hide: true, zone: "city", x: 0, z: -30 }
      ],
      rusty: [
        { h: 0, hide: true, zone: "city", x: 75, z: 7 },
        { h: 9, zone: "repair", x: 1597, z: -3.2, face: Math.PI },  // at his workbench
        { h: 18, hide: true, zone: "city", x: 75, z: 7 }
      ],
      carla: [
        { h: 0, hide: true, zone: "city", x: -25, z: 7 },
        { h: 6, zone: "cafe", x: 1478, z: -1.6, face: Math.PI },    // behind the counter
        { h: 16, hide: true, zone: "city", x: -25, z: 7 }
      ],
      greta: [
        { h: 0, hide: true, zone: "city", x: -73, z: 7 },
        { h: 8, zone: "grocery", x: 1367, z: 5.4, face: 0 },        // at the checkout
        { h: 20, hide: true, zone: "city", x: -73, z: 7 }
      ]
    };
  }

  // Shopkeepers stand inside during open hours; interiors give their real
  // spots for Penny and Nia too, replacing the sidewalk placeholders.
  function indoorShifts(s) {
    s.penny.splice(1, 1, { h: 9, zone: "bank", x: 1116.5, z: -2, face: Math.PI });
    s.nia.splice(1, 1, { h: 7, zone: "bakery", x: 1240, z: -4, face: Math.PI });
    return s;
  }

  // Sleeping at home: fade, advance to next morning, restore energy, new
  // weather, utilities arrive every third day, autosave.
  function sleep() {
    CC.paused = true;
    CC.ui.fade(true, function () {
      CC.state.day++;
      CC.state.minutes = 7 * 60;
      CC.state.energy = 100;
      CC.world.rollWeather();
      var billNote = "";
      if (CC.state.day % 3 === 0) {
        CC.state.flags.billDue = true;
        billNote = " A utilities bill arrived: 12 coins.";
        CC.state.msgs.push({ day: CC.state.day, from: "Bay Utilities", text: "Your utilities bill of 12 coins is due. Pay it from your phone or lose a little trust around town.", scam: false });
      }
      CC.ui.updateHUD();
      CC.save.autosave("slept");
      CC.paused = false;
      CC.ui.fade(false, null, 700);
      CC.ui.banner("Day " + CC.state.day, CC.clockText());
      if (billNote) CC.ui.toast(billNote.trim(), "bad");
    }, 700);
  }

  // Rest spots the player can actually use right now
  function registerBenches() {
    [[-99.4, -29, "Grandpa's bench"], [-40, 64.2, "waterfront bench"], [40, 64.2, "waterfront bench"]]
      .forEach(function (b, i) {
        CC.interact.add("city", {
          id: "bench" + i, x: b[0], z: b[1], r: 1.6,
          label: "Rest a moment",
          action: function () {
            CC.state.energy = CC.clamp(CC.state.energy + 12, 0, 100);
            CC.state.minutes = Math.min(1439, CC.state.minutes + 20);
            CC.ui.toast("You sit for a while. Energy restored.", "info");
            CC.ui.updateHUD();
          }
        });
      });
  }

  function init() {
    CC.save.loadSettings();
    CC.ui.applySettingsToBody();

    var canvas = document.getElementById("view");
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: CC.settings.graphics !== "low"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CC.settings.graphics === "high" ? 2 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = CC.settings.graphics !== "low";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc9e2e8, 70, 260);
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 420);

    CC.input.init(canvas);
    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Fresh state, then build the living district and its interiors
    CC.state = CC.defaultState();
    CC.world.build(scene);
    CC.world.initLampLights();
    CC.world.makeRain();
    CC.world.setWeather(CC.state.weather);
    CC.world.applyStage();
    CC.interiors.build(scene);
    CC.interiors.refreshHome();
    CC.chars.spawnCast(scene, indoorShifts(schedules()));
    CC.player.spawn(scene, camera, CC.state.look);
    CC.player.warp(8, 6, Math.PI); // stepping off the bus at the plaza stop
    registerBenches();

    CC.ui.show("hud");
    CC.ui.updateHUD();
    CC.ui.tracker("Explore Budget Bay", "Walk the district. More of the story arrives in the next build.");
    CC.ui.hint("move", "WASD or arrows: walk. Shift: run. Mouse: camera. Click the screen to look around.", 9);

    clock = new THREE.Clock();
    CC.ui.fade(false, null, 900);
    requestAnimationFrame(loop);
  }

  var hudTick = 0;
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);

    if (!CC.paused && CC.state) {
      // one real second is one game minute
      CC.state.minutes += dt * CC.timeScale;
      if (CC.state.minutes >= 1440) {
        CC.state.minutes -= 1440;
        CC.state.day++;
        CC.world.rollWeather();
        CC.ui.toast("Day " + CC.state.day + " begins.", "info");
      }
      CC.world.update(dt);
      CC.chars.update(dt);
      CC.player.update(dt);
      scanInteract();

      // ambient music follows the time of day
      var ph = CC.phase();
      CC.audio.music(ph === "night" ? "night" : (ph === "evening" ? "evening" : "day"));
      CC.audio.update();

      hudTick += dt;
      if (hudTick > 0.5) { hudTick = 0; CC.ui.updateHUD(); }
    }

    // interact and pause inputs
    if (CC.input.pressed("KeyE") || CC.input.padInteract()) {
      if (currentInteract && !CC.paused) {
        var it = currentInteract;
        CC.audio.sfx("ui");
        it.action(it);
      }
    }
    if (CC.input.pressed("Escape")) CC.input.unlock();

    CC.input.endFrame();
    renderer.render(scene, camera);
  }

  function scanInteract() {
    var list = CC.interact.lists[CC.zone] || [];
    var best = null, bestD = 1e9;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.when && !it.when()) continue;
      var d = CC.dist2(CC.player.pos.x, CC.player.pos.z, it.x, it.z);
      var r = (it.r || 1.8);
      if (d < r * r && d < bestD) { best = it; bestD = d; }
    }
    currentInteract = best;
    CC.ui.prompt(best ? "<b>E</b>" + best.label : null);
  }

  window.addEventListener("load", init);

  return { init: init, sleep: sleep, sceneRef: function () { return scene; }, cameraRef: function () { return camera; } };
})();
