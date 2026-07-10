// Characters. Stylized rigs are built from primitives at runtime: pivoted
// limbs for real walk cycles, expressive head bob, hair styles, accessories.
// NPCs follow daily schedules and waypoint routes so the district feels alive.
CC.chars = (function () {

  function box(w, h, d, color) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: color }));
    m.castShadow = true;
    return m;
  }

  // look: {skin, hair, hairC, top, jacket, pants, shoes, acc, pack}
  // indexes into CC.SKINS / CC.HAIRC / CC.CLOTH
  function makeCharacter(look) {
    var skin = CC.SKINS[look.skin % CC.SKINS.length];
    var hairC = CC.HAIRC[look.hairC % CC.HAIRC.length];
    var top = CC.CLOTH[look.top % CC.CLOTH.length];
    var jacket = CC.CLOTH[look.jacket % CC.CLOTH.length];
    var pants = CC.CLOTH[look.pants % CC.CLOTH.length];
    var shoes = CC.CLOTH[look.shoes % CC.CLOTH.length];

    var g = new THREE.Group();

    // Legs pivot at the hip (y 0.62)
    function leg(side) {
      var pivot = new THREE.Group(); pivot.position.set(0.11 * side, 0.62, 0);
      var m = box(0.15, 0.55, 0.17, pants); m.position.y = -0.28; pivot.add(m);
      var shoe = box(0.17, 0.1, 0.26, shoes); shoe.position.set(0, -0.58, 0.04); pivot.add(shoe);
      g.add(pivot); return pivot;
    }
    var legL = leg(-1), legR = leg(1);

    // Torso and jacket
    var torso = box(0.42, 0.5, 0.26, top); torso.position.y = 0.9; g.add(torso);
    var jkt = box(0.46, 0.34, 0.3, jacket); jkt.position.y = 0.82; g.add(jkt);

    // Arms pivot at the shoulder (y 1.1)
    function arm(side) {
      var pivot = new THREE.Group(); pivot.position.set(0.27 * side, 1.1, 0);
      var m = box(0.12, 0.46, 0.14, jacket); m.position.y = -0.2; pivot.add(m);
      var hand = box(0.11, 0.1, 0.12, skin); hand.position.y = -0.46; pivot.add(hand);
      g.add(pivot); return pivot;
    }
    var armL = arm(-1), armR = arm(1);

    // Head group so it can nod and look
    var headG = new THREE.Group(); headG.position.y = 1.18; g.add(headG);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12),
      new THREE.MeshLambertMaterial({ color: skin }));
    head.position.y = 0.22; head.castShadow = true; headG.add(head);
    // Eyes
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c2226 });
    [-1, 1].forEach(function (s) {
      var e = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), eyeMat);
      e.position.set(0.085 * s, 0.25, 0.215); headG.add(e);
    });

    // Hair styles
    var hm = new THREE.MeshLambertMaterial({ color: hairC });
    var style = look.hair % CC.HAIRSTYLES.length;
    if (style === 0) { // short
      var h0 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI * 2, 0, 1.4), hm);
      h0.position.y = 0.26; headG.add(h0);
    } else if (style === 1) { // fluffy
      var h1 = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), hm);
      h1.position.y = 0.36; h1.scale.y = 0.75; headG.add(h1);
    } else if (style === 2) { // ponytail
      var h2 = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 8, 0, Math.PI * 2, 0, 1.5), hm);
      h2.position.y = 0.26; headG.add(h2);
      var tail = box(0.1, 0.34, 0.1, hairC); tail.position.set(0, 0.16, -0.26); tail.rotation.x = 0.4; headG.add(tail);
    } else if (style === 3) { // buzz
      var h3 = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, 1.1), hm);
      h3.position.y = 0.27; headG.add(h3);
    } else { // long
      var h4 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, 1.7), hm);
      h4.position.y = 0.25; headG.add(h4);
      var fall = box(0.4, 0.34, 0.12, hairC); fall.position.set(0, 0.05, -0.17); headG.add(fall);
    }

    // Accessories
    if (look.acc === 1) { // cap
      var brim = box(0.3, 0.05, 0.42, CC.CLOTH[(look.top + 3) % CC.CLOTH.length]);
      brim.position.set(0, 0.4, 0.08); headG.add(brim);
    } else if (look.acc === 2) { // glasses
      var gl = box(0.3, 0.07, 0.03, 0x22333b); gl.position.set(0, 0.25, 0.23); headG.add(gl);
    }
    if (look.pack !== undefined && look.pack >= 0) { // backpack
      var pk = box(0.3, 0.34, 0.14, CC.CLOTH[look.pack % CC.CLOTH.length]);
      pk.position.set(0, 0.92, -0.22); g.add(pk);
    }
    if (look.beard) {
      var bd = box(0.22, 0.14, 0.08, hairC); bd.position.set(0, 0.1, 0.2); headG.add(bd);
    }
    if (look.hat === "flat") {
      var fc = box(0.36, 0.07, 0.36, 0x6a6a6a); fc.position.y = 0.42; headG.add(fc);
      var fb = box(0.2, 0.04, 0.14, 0x6a6a6a); fb.position.set(0, 0.4, 0.24); headG.add(fb);
    }
    if (look.apron) {
      var ap = box(0.4, 0.42, 0.02, look.apron); ap.position.set(0, 0.78, 0.15); g.add(ap);
    }

    return {
      group: g, legL: legL, legR: legR, armL: armL, armR: armR, headG: headG,
      phase: Math.random() * 6, holdItem: null
    };
  }

  // Animate a rig. move is 0 idle to 1 run. dt in seconds.
  function animate(ch, move, dt) {
    ch.phase += dt * (2.2 + move * 8.5);
    var s = Math.sin(ch.phase);
    if (move > 0.02) {
      var amp = 0.35 + move * 0.55;
      ch.legL.rotation.x = s * amp;
      ch.legR.rotation.x = -s * amp;
      ch.armL.rotation.x = -s * amp * 0.8;
      ch.armR.rotation.x = ch.holdItem ? -0.9 : s * amp * 0.8;
      ch.group.position.y = Math.abs(Math.cos(ch.phase)) * 0.05 * move;
      ch.headG.rotation.x = 0.04 * s;
    } else {
      // idle: soft breathing sway
      var b = Math.sin(ch.phase * 0.5);
      ch.legL.rotation.x *= 0.85; ch.legR.rotation.x *= 0.85;
      ch.armL.rotation.x = b * 0.05; ch.armR.rotation.x = ch.holdItem ? -0.9 : -b * 0.05;
      ch.group.position.y = 0;
      ch.headG.rotation.x = b * 0.03;
    }
  }
  function wave(ch) { ch.armR.rotation.x = -2.6; }

  // Named cast. Looks are fixed so characters stay visually consistent
  // everywhere (matches HIGGSFIELD_PROMPTS.md master descriptions).
  var CAST = {
    ledger: { name: "Grandpa Ledger", look: { skin: 3, hair: 1, hairC: 7, top: 2, jacket: 6, pants: 7, shoes: 5, acc: 0, pack: -1, beard: true, hat: "flat" }, badge: "GL", col: "#8a6642" },
    penny:  { name: "Penny",  look: { skin: 1, hair: 2, hairC: 0, top: 8, jacket: 0, pants: 5, shoes: 7, acc: 2, pack: -1 }, badge: "P", col: "#2fa5a9" },
    milo:   { name: "Milo",   look: { skin: 4, hair: 3, hairC: 5, top: 1, jacket: 1, pants: 7, shoes: 2, acc: 0, pack: 4 }, badge: "M", col: "#ff8a5c" },
    nia:    { name: "Nia",    look: { skin: 4, hair: 2, hairC: 0, top: 2, jacket: 5, pants: 4, shoes: 0, acc: 0, pack: -1, apron: 0x4a6a8a }, badge: "N", col: "#d94f6a" },
    dex:    { name: "Dex",    look: { skin: 0, hair: 0, hairC: 0, top: 3, jacket: 3, pants: 7, shoes: 7, acc: 0, pack: -1 }, badge: "D", col: "#8a4fb4" },
    nova:   { name: "Nova",   look: { skin: 2, hair: 1, hairC: 6, top: 5, jacket: 4, pants: 0, shoes: 1, acc: 2, pack: 2 }, badge: "NV", col: "#3b6fb4" },
    mint:   { name: "Mayor Mint", look: { skin: 2, hair: 4, hairC: 7, top: 0, jacket: 0, pants: 0, shoes: 7, acc: 0, pack: -1 }, badge: "MM", col: "#4a7d4a" },
    rusty:  { name: "Rusty",  look: { skin: 3, hair: 3, hairC: 1, top: 7, jacket: 6, pants: 7, shoes: 5, acc: 0, pack: -1, apron: 0x5a4632 }, badge: "R", col: "#8a6642" },
    carla:  { name: "Carla",  look: { skin: 1, hair: 4, hairC: 1, top: 1, jacket: 2, pants: 7, shoes: 0, acc: 0, pack: -1, apron: 0x7a5230 }, badge: "C", col: "#c46a4f" },
    greta:  { name: "Greta",  look: { skin: 0, hair: 2, hairC: 3, top: 6, jacket: 6, pants: 5, shoes: 5, acc: 2, pack: -1, apron: 0x3a5a3a }, badge: "G", col: "#4a7d4a" }
  };

  // NPC with hourly schedule. Each schedule entry: {h: startHour, zone, x, z,
  // face} or {h, route: [[x,z]...]} for a walking loop within the city.
  function NPC(id, def) {
    this.id = id; this.def = def;
    this.rig = makeCharacter(def.look);
    this.group = this.rig.group;
    this.zone = "city";
    this.pos = new THREE.Vector3(0, 0, 0);
    this.target = null; this.route = null; this.ri = 0;
    this.speed = 1.5; this.moving = 0; this.faceYaw = 0;
    this.schedule = def.schedule || [];
    this.hidden = false;
  }
  NPC.prototype.applySchedule = function (hour) {
    var pick = null;
    for (var i = 0; i < this.schedule.length; i++) {
      if (hour >= this.schedule[i].h) pick = this.schedule[i];
    }
    if (!pick) pick = this.schedule[0];
    if (!pick) return;
    if (this.current === pick) return;
    this.current = pick;
    this.hidden = !!pick.hide;
    if (pick.route) {
      this.zone = "city"; this.route = pick.route; this.ri = 0;
      this.pos.set(pick.route[0][0], 0, pick.route[0][1]);
      this.target = null;
    } else {
      this.route = null;
      // Walk there if same zone and in the city, otherwise teleport
      if (this.zone === "city" && pick.zone === "city" && !this.hidden) {
        this.target = { x: pick.x, z: pick.z };
      } else {
        this.pos.set(pick.x, 0, pick.z); this.target = null;
      }
      this.zone = pick.zone;
      if (pick.face !== undefined) this.faceYaw = pick.face;
    }
  };
  NPC.prototype.update = function (dt) {
    // Visible only in the player's current zone
    var vis = !this.hidden && this.zone === CC.zone;
    this.group.visible = vis;
    var tgt = null;
    if (this.route) {
      var wp = this.route[this.ri];
      tgt = { x: wp[0], z: wp[1] };
    } else if (this.target) tgt = this.target;

    if (tgt && this.zone === "city") {
      var dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.35) {
        if (this.route) this.ri = (this.ri + 1) % this.route.length;
        else this.target = null;
        this.moving = 0;
      } else {
        this.pos.x += (dx / d) * this.speed * dt;
        this.pos.z += (dz / d) * this.speed * dt;
        this.faceYaw = Math.atan2(dx, dz);
        this.moving = CC.lerp(this.moving, 0.45, dt * 6);
      }
    } else {
      this.moving = CC.lerp(this.moving, 0, dt * 6);
    }
    this.group.position.x = this.pos.x;
    this.group.position.z = this.pos.z;
    // smooth turn
    var cy = this.group.rotation.y, ty = this.faceYaw;
    var diff = ((ty - cy + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.group.rotation.y = cy + diff * Math.min(1, dt * 8);
    if (vis) animate(this.rig, this.moving, dt);
  };

  var npcs = {}, peds = [];

  function spawnCast(scene, schedules) {
    for (var id in CAST) {
      var n = new NPC(id, CAST[id]);
      n.schedule = schedules[id] || [];
      n.applySchedule(CC.hour());
      scene.add(n.group);
      npcs[id] = n;
    }
  }

  // Generic pedestrians walking loops. Count scales with restoration stage
  // and the graphics setting.
  function spawnPeds(scene, routes, count) {
    while (peds.length > count) {
      var p = peds.pop(); scene.remove(p.group);
    }
    while (peds.length < count) {
      var look = {
        skin: (Math.random() * CC.SKINS.length) | 0,
        hair: (Math.random() * 5) | 0,
        hairC: (Math.random() * CC.HAIRC.length) | 0,
        top: (Math.random() * CC.CLOTH.length) | 0,
        jacket: (Math.random() * CC.CLOTH.length) | 0,
        pants: (Math.random() * CC.CLOTH.length) | 0,
        shoes: (Math.random() * CC.CLOTH.length) | 0,
        acc: Math.random() < 0.25 ? ((Math.random() * 3) | 0) : 0,
        pack: Math.random() < 0.4 ? ((Math.random() * CC.CLOTH.length) | 0) : -1
      };
      var np = new NPC("ped" + peds.length, { name: "", look: look });
      var route = routes[(Math.random() * routes.length) | 0];
      // offset start so crowds spread out
      np.route = route; np.ri = (Math.random() * route.length) | 0;
      np.pos.set(route[np.ri][0], 0, route[np.ri][1]);
      np.speed = 1.1 + Math.random() * 0.8;
      if (Math.random() < 0.3) { // carrying a shopping bag
        var bag = box(0.16, 0.2, 0.12, CC.CLOTH[(Math.random() * CC.CLOTH.length) | 0]);
        bag.position.set(0, -0.5, 0.06); np.rig.armR.add(bag); np.rig.holdItem = bag;
      }
      scene.add(np.group);
      peds.push(np);
    }
  }

  function update(dt) {
    var h = CC.hour();
    for (var id in npcs) { npcs[id].applySchedule(h); npcs[id].update(dt); }
    for (var i = 0; i < peds.length; i++) peds[i].update(dt);
  }

  return {
    make: makeCharacter, animate: animate, wave: wave,
    CAST: CAST, npcs: npcs, peds: peds,
    spawnCast: spawnCast, spawnPeds: spawnPeds, update: update
  };
})();
