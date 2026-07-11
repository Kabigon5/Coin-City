// Budget Bay. One dense connected district: main street, plaza, park, canal
// waterfront with bridge and pier market, business alley, residential row.
// Handles day and night lighting, weather, the city bus, animated props and
// the three restoration stages that visibly transform the district.
CC.world = (function () {
  var scene, sun, hemi, amb;
  var colliders = { city: [] }, solids = [];
  var lamps = [], lampLights = [], windowMats = [], trees = [], flags = [], plaques = [];
  var water, fountainJet, bus, busState;
  var billboard = { mat: null, canvas: null, tex: null, glitch: false, timer: 0, custom: false };
  var clockHand = null;
  var boardsS2 = [], plantsS2 = [], stringS3 = [], muralMats = [], benchBroken = null, benchFixed = null;
  var ccDamaged, ccFixed, homeBoards = [], homeDecor = [], shopSign = null, outdoorS3 = [];
  var litter = [], posters = [], performer = null, eventDecor = [];
  var rain = null, rainOn = false;
  var routes = [];
  var stage = 1;

  // ---------- small builders ----------
  function mat(c) { return new THREE.MeshLambertMaterial({ color: c }); }
  function box(w, h, d, c, x, y, z, solid) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    if (solid) addCollider(x - w / 2, z - d / 2, x + w / 2, z + d / 2, m);
    return m;
  }
  function flat(x1, z1, x2, z2, c, y) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat(c));
    m.rotation.x = -Math.PI / 2;
    m.position.set((x1 + x2) / 2, y || 0.02, (z1 + z2) / 2);
    m.receiveShadow = true; scene.add(m); return m;
  }
  function addCollider(x1, z1, x2, z2, mesh) {
    colliders.city.push({ x1: x1, z1: z1, x2: x2, z2: z2 });
    if (mesh) solids.push(mesh);
  }

  // Canvas text texture for signs, posters, murals
  function textTex(lines, w, h, bg, fg, fs, deco) {
    // Render at double resolution and auto-shrink the font so text is always
    // sharp and never cut off, no matter how long the label is.
    var scale = 2;
    var cv = document.createElement("canvas"); cv.width = w * scale; cv.height = h * scale;
    var c = cv.getContext("2d");
    c.scale(scale, scale);
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    if (deco === "stripe") {
      c.fillStyle = "rgba(255,255,255,.25)";
      for (var i = 0; i < w; i += 40) c.fillRect(i, 0, 20, h);
    }
    var L = Array.isArray(lines) ? lines : [lines];
    var maxW = w * 0.92;
    var fit = fs;
    c.textAlign = "center"; c.textBaseline = "middle";
    L.forEach(function (t) {
      c.font = "bold " + fs + "px Trebuchet MS, sans-serif";
      var m = c.measureText(t).width;
      if (m > maxW) fit = Math.min(fit, Math.floor(fs * maxW / m));
    });
    // also fit vertically when there are several lines
    var maxH = (h * 0.9) / L.length / 1.15;
    if (fit > maxH) fit = Math.floor(maxH);
    c.fillStyle = fg;
    c.font = "bold " + fit + "px Trebuchet MS, sans-serif";
    L.forEach(function (t, i) {
      c.fillText(t, w / 2, h / 2 + (i - (L.length - 1) / 2) * (fit * 1.15));
    });
    var t = new THREE.CanvasTexture(cv); return t;
  }
  function sign(text, w, h, bg, fg, x, y, z, ry, fs) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: textTex(text, 256, Math.round(256 * h / w), bg, fg, fs || 60) }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m;
  }

  // A shop building: walls, roof trim, doorway, glowing windows, canvas sign
  function building(o) {
    var g = new THREE.Group(); scene.add(g);
    var w = o.w, d = o.d, h = o.h || 6;
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(o.color));
    body.position.set(o.x, h / 2, o.z); body.castShadow = true; body.receiveShadow = true;
    g.add(body); solids.push(body);
    addCollider(o.x - w / 2, o.z - d / 2, o.x + w / 2, o.z + d / 2);
    // roof trim
    var trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6), mat(o.trim || 0x8a5a44));
    trim.position.set(o.x, h + 0.2, o.z); g.add(trim);
    // door on the given face: "S" faces +z direction outward at z + d/2, "N" at z - d/2
    var dz = o.face === "N" ? -d / 2 : d / 2;
    var doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.2), mat(o.doorC || 0x6a4a32));
    doorMesh.position.set(o.x + (o.doorOff || 0), 1.3, o.z + dz + (o.face === "N" ? -0.05 : 0.05));
    g.add(doorMesh);
    // windows along the door face
    var wm = new THREE.MeshLambertMaterial({ color: CC.PAL.glass, emissive: 0x000000 });
    windowMats.push({ m: wm, open: o.hours });
    var count = Math.max(2, Math.floor(w / 5));
    for (var i = 0; i < count; i++) {
      var wx = o.x - w / 2 + (i + 0.5) * (w / count);
      if (Math.abs(wx - (o.x + (o.doorOff || 0))) < 1.6) continue;
      var win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), wm);
      win.position.set(wx, 2, o.z + dz + (o.face === "N" ? -0.12 : 0.12));
      if (o.face === "N") win.rotation.y = Math.PI;
      g.add(win);
      // second storey windows
      if (h > 5.5) {
        var win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), wm);
        win2.position.set(wx, 4.4, win.position.z); win2.rotation.y = win.rotation.y;
        g.add(win2);
      }
    }
    // sign
    if (o.name) {
      var s = sign(o.name, Math.min(w - 1, 12), 1.8, o.signBg || "#22333b", o.signFg || "#fff4e0",
        o.x + (o.doorOff || 0) * 0.4, 3.8, o.z + dz + (o.face === "N" ? -0.15 : 0.15),
        o.face === "N" ? Math.PI : 0, 52);
      g.add(s);
      // OPEN or CLOSED plaque beside the door, updated live with shop hours
      if (o.hours) {
        var openT = textTex("OPEN", 128, 64, "#2e8b57", "#ffffff", 34);
        var closedT = textTex("CLOSED", 128, 64, "#8a4444", "#f0e0e0", 30);
        var pq = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.58),
          new THREE.MeshBasicMaterial({ map: closedT }));
        pq.position.set(o.x + (o.doorOff || 0) + 1.7, 2.1, o.z + dz + (o.face === "N" ? -0.1 : 0.1));
        if (o.face === "N") pq.rotation.y = Math.PI;
        scene.add(pq); g.add(pq);
        plaques.push({ m: pq.material, openT: openT, closedT: closedT, hours: o.hours });
      }
    }
    return { group: g, door: { x: o.x + (o.doorOff || 0), z: o.z + dz + (o.face === "N" ? -1 : 1) }, body: body };
  }

  function lamp(x, z) {
    var pole = box(0.14, 4.2, 0.14, 0x39454e, x, 2.1, z, false);
    var headM = new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x000000 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), headM);
    head.position.set(x, 4.3, z); scene.add(head);
    lamps.push(headM);
    return pole;
  }
  function tree(x, z, s) {
    s = s || 1;
    box(0.35 * s, 1.6 * s, 0.35 * s, 0x6a4a32, x, 0.8 * s, z, false);
    var lm = mat(0x5f9e52);
    var l1 = new THREE.Mesh(new THREE.SphereGeometry(1.15 * s, 9, 8), lm);
    l1.position.set(x, 2.2 * s, z); l1.castShadow = true; scene.add(l1);
    var l2 = new THREE.Mesh(new THREE.SphereGeometry(0.8 * s, 8, 7), lm);
    l2.position.set(x + 0.5 * s, 2.9 * s, z + 0.2 * s); scene.add(l2);
    trees.push({ a: l1, b: l2, x: x });
    addCollider(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
  }
  function bench(x, z, ry, broken) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g);
    var c = broken ? 0x5a4a3c : CC.PAL.wood;
    var seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.55), mat(c)); seat.position.y = 0.5; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), mat(c)); back.position.set(0, 0.85, -0.25); g.add(back);
    [-0.8, 0.8].forEach(function (s) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), mat(0x39454e)); leg.position.set(s, 0.25, 0); g.add(leg);
    });
    if (broken) { back.rotation.z = 0.35; seat.rotation.z = -0.08; }
    addCollider(x - 1, z - 0.4, x + 1, z + 0.4);
    return g;
  }

  // ---------- district construction ----------
  function build(sc) {
    scene = sc;

    // Lighting rig
    hemi = new THREE.HemisphereLight(0xbfe8f0, 0x6a5a44, 0.55); scene.add(hemi);
    amb = new THREE.AmbientLight(0xffffff, 0.28); scene.add(amb);
    sun = new THREE.DirectionalLight(0xfff2d8, 0.95);
    sun.position.set(60, 90, 30); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
    sun.shadow.camera.far = 400;
    scene.add(sun);

    // Ground and paving
    flat(-160, -100, 160, 140, CC.PAL.walk, 0);              // base concrete
    flat(-130, -4, 130, 4, CC.PAL.road, 0.03);               // main street
    flat(-130, -64, 130, -56, CC.PAL.road, 0.03);            // residential street
    flat(-64, -56, -56, -4, CC.PAL.road, 0.03);              // west cross street
    flat(56, -56, 64, -4, CC.PAL.road, 0.03);                // east cross street
    flat(-8, 4, 8, 62, 0xcfc5ae, 0.03);                      // pedestrian way to waterfront
    flat(-30, -32, 30, -6, 0xd9c9a8, 0.035);                 // market plaza paving
    flat(-128, -48, -74, -10, CC.PAL.grass, 0.03);           // park
    flat(-130, 62, 130, 70, 0xcfc5ae, 0.03);                 // waterfront promenade
    // street dashes
    for (var dx = -124; dx < 126; dx += 12) flat(dx, -0.25, dx + 5, 0.25, 0xd8d3c2, 0.04);
    // crosswalks
    [[-10, 10], [92, 108]].forEach(function (cw) {
      for (var i = 0; i < 5; i++) flat(cw[0] + i * (cw[1] - cw[0]) / 5 + 0.6, -4, cw[0] + i * (cw[1] - cw[0]) / 5 + 2.4, 4, 0xe8e2d2, 0.05);
    });
    // cracked sidewalk detail near the plaza (struggling era flavor)
    for (var ci = 0; ci < 8; ci++) {
      flat(-28 + ci * 7, 5 + (ci % 2), -26 + ci * 7, 5.5 + (ci % 2), 0x8f887c, 0.045);
    }

    // Canal, promenade wall, bridge, pier market
    water = new THREE.Mesh(new THREE.PlaneGeometry(300, 34),
      new THREE.MeshLambertMaterial({ color: CC.PAL.water, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -1.1, 87); scene.add(water);
    box(300, 1.4, 1, 0x9a927f, 0, -0.3, 70.5, false);         // canal wall north
    // keep the player out of the water except at the bridge
    addCollider(-160, 69.8, -5, 71.4); addCollider(5, 69.8, 160, 71.4);
    // bridge deck and railings
    flat(-5, 70, 5, 106, 0xb59a76, 0.16);
    box(0.3, 1, 36, 0x7a5a3f, -4.8, 0.55, 88, false); box(0.3, 1, 36, 0x7a5a3f, 4.8, 0.55, 88, false);
    addCollider(-5.4, 70, -4.6, 106); addCollider(4.6, 70, 5.4, 106);
    // pier
    flat(-18, 106, 18, 124, 0xb59a76, 0.16);
    addCollider(-18.6, 106, -18, 124); addCollider(18, 106, 18.6, 124); addCollider(-18.6, 123.6, 18.6, 124.2);
    // funnel walls where bridge meets pier
    addCollider(-18, 105.4, -5, 106.2); addCollider(5, 105.4, 18, 106.2);
    // market stalls on the pier
    [[-11, 112, "FISH + CHIPS", "#3b6fb4"], [0, 116, "BAY MARKET", "#d94f6a"], [11, 112, "FRUIT BOAT", "#4a7d4a"]].forEach(function (st) {
      box(3.4, 2.2, 2.2, 0xe8d9b8, st[0], 1.1, st[1], true);
      var roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, 3), mat(0xc4574f));
      roof.position.set(st[0], 2.5, st[1]); roof.rotation.z = 0.06; scene.add(roof);
      sign(st[2], 3.4, 0.8, st[3], "#fff", st[0], 1.9, st[1] - 1.18, Math.PI, 46);
    });

    // ---------- enterable buildings ----------
    var B = {};
    B.bank = building({ x: -43, z: -16, w: 18, d: 16, h: 7, color: CC.PAL.mint, face: "S", name: "PENNY'S COMMUNITY BANK", signBg: "#1d6b6e", trim: 0xd9b380, hours: [9, 17] });
    // glowing coin sign above the bank (landmark)
    var coinM = new THREE.MeshLambertMaterial({ color: 0xffc94d, emissive: 0x664400 });
    var coin = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 20), coinM);
    coin.rotation.x = Math.PI / 2; coin.position.set(-43, 8.6, -8.2); scene.add(coin);
    lamps.push(coinM); // the coin sign glows at night like the street lamps

    B.hall = building({ x: 0, z: -40, w: 26, d: 16, h: 8, color: 0xdccfb4, face: "S", name: "BUDGET BAY CITY HALL", signBg: "#4a7d4a", trim: 0xb0a284, hours: [8, 18] });
    // flags on city hall
    [-8, 8].forEach(function (fx) {
      box(0.1, 4, 0.1, 0x8a8a8a, fx, 10, -35, false);
      var f = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1), new THREE.MeshLambertMaterial({ color: CC.PAL.teal, side: THREE.DoubleSide }));
      f.position.set(fx + 1, 11.3, -35); scene.add(f); flags.push(f);
    });

    B.home = building({ x: 42, z: -16, w: 16, d: 16, h: 7, color: 0x9a8f80, face: "S", name: "YOUR NEW HOME", signBg: "#1d6b6e", trim: 0x6a6156, hours: [0, 24] });
    // boarded storefront planks, removed when the shop opens (mission 9)
    for (var bi = 0; bi < 3; bi++) {
      var pb = box(5.5, 0.7, 0.15, 0x7a5f45, 42 + (bi % 2 ? 1 : -1), 1.4 + bi * 0.9, -7.85, false);
      pb.rotation.z = (bi % 2 ? -0.12 : 0.1); homeBoards.push(pb);
    }
    homeDecor.push(box(1.4, 0.5, 0.5, 0xc4574f, 38.5, 0.25, -7.4, false)); // flower box
    homeDecor.push(box(1.4, 0.5, 0.5, 0xc4574f, 45.5, 0.25, -7.4, false));
    homeDecor.forEach(function (m) { m.visible = false; });

    // community center: damaged shell that swaps to a restored version
    ccDamaged = new THREE.Group(); ccFixed = new THREE.Group();
    scene.add(ccDamaged); scene.add(ccFixed); ccFixed.visible = false;
    var ccBody = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 18), mat(0x7d766c));
    ccBody.position.set(100, 3.5, -17); ccBody.castShadow = true; ccDamaged.add(ccBody); solids.push(ccBody);
    addCollider(88, -26, 112, -8);
    var tarp = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 10), mat(0x3b6fb4));
    tarp.position.set(96, 7.3, -18); tarp.rotation.z = 0.05; ccDamaged.add(tarp);
    for (var cbi = 0; cbi < 3; cbi++) {
      var cb = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 0.15), mat(0x6a5540));
      cb.position.set(97 + cbi * 2 - 2, 1.5 + cbi * 0.8, -7.85); cb.rotation.z = cbi % 2 ? 0.15 : -0.1; ccDamaged.add(cb);
    }
    var ccSignOld = sign(["COMMUNITY CENTER", "UNDER REPAIR"], 10, 2, "#4a443c", "#e8dcc4", 100, 4.6, -7.8, 0, 40);
    ccDamaged.add(ccSignOld);
    var ccBody2 = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 18), mat(CC.PAL.mint));
    ccBody2.position.set(100, 3.5, -17); ccBody2.castShadow = true; ccFixed.add(ccBody2);
    var ccTrim = new THREE.Mesh(new THREE.BoxGeometry(24.6, 0.5, 18.6), mat(CC.PAL.gold));
    ccTrim.position.set(100, 7.3, -17); ccFixed.add(ccTrim);
    var ccSignNew = sign(["BUDGET BAY", "COMMUNITY CENTER"], 11, 2.4, "#1d6b6e", "#fff4e0", 100, 4.8, -7.8, 0, 42);
    ccFixed.add(ccSignNew);
    var ccDoor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.2), mat(0x6a4a32));
    ccDoor.position.set(100, 1.4, -7.9); scene.add(ccDoor);
    B.center = { door: { x: 100, z: -7 } };

    // south side of Main Street
    B.grocery = building({ x: -73, z: 16, w: 22, d: 16, h: 6, color: 0x8fbf7f, face: "N", name: "BUDGET BASKET MARKET", signBg: "#3a6a3a", hours: [8, 20] });
    B.cafe = building({ x: -25, z: 16, w: 18, d: 16, h: 6, color: 0xd9a066, face: "N", name: "SUNRISE CAFE", signBg: "#7a4a26", hours: [6, 16] });
    B.bakery = building({ x: 21, z: 16, w: 18, d: 16, h: 6, color: 0xf0a0b4, face: "N", name: "NIA'S BAKERY", signBg: "#c4485f", trim: 0xf3d9a0, hours: [7, 18] });
    B.store = building({ x: 48, z: 16, w: 16, d: 16, h: 6, color: 0xc9a0e8, face: "N", name: "THREAD + THINGS", signBg: "#7a4fb4", trim: 0xffc94d, hours: [9, 19] });
    // Mission 1 storefront dressing: striped awning, display windows,
    // welcome mat and door lamps so the store is easy to spot.
    var awn = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.4),
      new THREE.MeshLambertMaterial({ map: textTex([""], 256, 64, "#ffc94d", "#fff", 10, "stripe"), side: THREE.DoubleSide }));
    awn.position.set(48, 3.1, 6.6); awn.rotation.x = -0.9; scene.add(awn);
    [[44.2], [51.8]].forEach(function (wx) {
      box(2.6, 1.6, 0.25, 0xfff4e0, wx[0], 1.5, 7.95, false);
      box(2.2, 1.2, 0.15, CC.PAL.glass, wx[0], 1.5, 7.8, false);
      box(0.5, 0.6, 0.1, 0xd94f6a, wx[0] - 0.5, 1.3, 7.7, false);
      box(0.4, 0.5, 0.1, 0x2fa5a9, wx[0] + 0.5, 1.25, 7.7, false);
    });
    flat(46.9, 6.1, 49.1, 7.3, 0xc4574f, 0.05);
    lamp(45, 5.5); lamp(51, 5.5);
    B.repair = building({ x: 75, z: 16, w: 18, d: 16, h: 6, color: 0x8a9db4, face: "N", name: "RUSTY'S FIX-IT", signBg: "#3a4a5a", hours: [9, 18] });

    // decorative and boarded buildings (some heal at restoration stage 2)
    [[-96, -16, 14, 12, 0xb0876a], [-118, -58, 12, 10, 0xc9a37f], [120, -16, 14, 12, 0xa88f9e],
     [70, -16, 10, 12, 0x9aa48a], [-104, 16, 16, 14, 0xb59a8a], [100, 16, 16, 14, 0x9a8fb0],
     [122, 16, 12, 14, 0xb0a284]].forEach(function (bb, i) {
      var dec = building({ x: bb[0], z: bb[1], w: bb[2], d: bb[3], h: 5 + (i % 3), color: bb[4], face: bb[1] < 0 ? "S" : "N" });
      if (i % 2 === 0) {
        var brd = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.15), mat(0x6a5540));
        brd.position.set(bb[0], 1.8, bb[1] + (bb[1] < 0 ? bb[3] / 2 + 0.05 : -bb[3] / 2 - 0.05));
        brd.rotation.z = 0.12; scene.add(brd); boardsS2.push(brd);
      }
    });
    // residential row homes on the north street
    for (var hx = -90; hx <= 60; hx += 18) {
      building({ x: hx, z: -74, w: 12, d: 12, h: 5.5, color: [0xc98d7a, 0xd4b483, 0x9ab0c4, 0xb4c49a][((hx + 90) / 18) % 4 | 0], face: "S" });
    }
    addCollider(-160, -86, 160, -82); // north edge fence line
    box(320, 1, 1, 0x7a8a7a, 0, 0.5, -84, false);

    // ---------- landmarks ----------
    // clock tower
    box(3, 16, 3, 0xc46a4f, 24, 8, -28, true);
    var face = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), mat(0xfff4e0));
    face.position.set(24, 13.5, -26.4); scene.add(face);
    clockHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.05), mat(0x22333b));
    clockHand.position.set(24, 13.5, -26.3); scene.add(clockHand);
    box(3.6, 0.8, 3.6, 0xffc94d, 24, 16.4, -28, false);
    // fountain
    var basin = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 1, 20), mat(0xa9a294));
    basin.position.set(0, 0.5, -19); scene.add(basin); solids.push(basin);
    addCollider(-3.6, -22.6, 3.6, -15.4);
    var pool = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.2, 20), mat(CC.PAL.water));
    pool.position.set(0, 1, -19); scene.add(pool);
    fountainJet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 2.2, 10),
      new THREE.MeshLambertMaterial({ color: 0xbfe8f0, transparent: true, opacity: 0.75 }));
    fountainJet.position.set(0, 2, -19); scene.add(fountainJet);

    // giant Instant Everything billboard by the plaza (landmark, glitch target)
    box(0.6, 9, 0.6, 0x39454e, -29, 4.5, -27, true);
    box(0.6, 9, 0.6, 0x39454e, -23, 4.5, -31, true);
    billboard.canvas = document.createElement("canvas");
    billboard.canvas.width = 512; billboard.canvas.height = 288;
    billboard.tex = new THREE.CanvasTexture(billboard.canvas);
    billboard.mat = new THREE.MeshBasicMaterial({ map: billboard.tex });
    var bScreen = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.75), billboard.mat);
    bScreen.position.set(-26, 9.2, -29); bScreen.rotation.y = Math.PI / 4 + Math.PI / 2;
    scene.add(bScreen);
    drawAd(0);
    // Swap in a Higgsfield render if assets/billboard.jpg exists. Browsers
    // only allow WebGL image textures over http(s), so when the game is
    // opened straight from the file system the procedural ad stays active.
    if (location.protocol === "http:" || location.protocol === "https:") {
      try {
        new THREE.TextureLoader().load("../assets/billboard.jpg", function (t) {
          billboard.mat.map = t; billboard.custom = true; billboard.mat.needsUpdate = true;
        }, undefined, function () {});
      } catch (e) {}
    }

    // Instant Everything posters (scam investigation targets)
    [[-16.2, 3, 10, 0], [34, 2.2, 27.9, Math.PI], [88.5, 2.5, -12, Math.PI / 2]].forEach(function (pp, i) {
      var p = sign(["INSTANT", "EVERYTHING", i === 0 ? "GET IT NOW" : (i === 1 ? "EASY COINS FAST" : "EVERYONE APPROVED")],
        2.4, 3, "#5a3a9a", "#ffd9ff", pp[0], pp[1], pp[2], pp[3], 34);
      posters.push(p);
    });

    // bus stops: plaza, east end, west end
    [[10, 5.4, "plaza"], [100, 5.4, "east"], [-90, -5.4, "west"]].forEach(function (bs) {
      var shelterZ = bs[1] > 0 ? bs[1] + 0.8 : bs[1] - 0.8;
      box(4, 0.15, 1.6, 0x8fd0c8, bs[0], 2.6, shelterZ, false);
      box(0.15, 2.6, 0.15, 0x39454e, bs[0] - 1.8, 1.3, shelterZ, false);
      box(0.15, 2.6, 0.15, 0x39454e, bs[0] + 1.8, 1.3, shelterZ, false);
      sign("BUS", 1.2, 0.6, "#1d6b6e", "#fff", bs[0], 2.2, shelterZ + (bs[1] > 0 ? 0.9 : -0.9), bs[1] > 0 ? Math.PI : 0, 60);
      bench(bs[0], shelterZ + (bs[1] > 0 ? 0.4 : -0.4), bs[1] > 0 ? Math.PI : 0, bs[2] === "east");
    });

    // park furnishings
    tree(-120, -20, 1.2); tree(-108, -40, 1); tree(-90, -16, 1.1); tree(-84, -38, 0.9);
    tree(-118, -44, 1); tree(-98, -26, 1.3);
    bench(-100, -30, 0.4);                 // Grandpa's morning bench
    benchBroken = bench(-86, -22, -0.5, true);
    benchFixed = bench(-86, -22, -0.5, false); benchFixed.visible = false;
    // empty flower beds that bloom at stage 2
    [[-114, -30], [-92, -42], [-80, -14]].forEach(function (fb) {
      box(2.4, 0.35, 2.4, 0x7a6a52, fb[0], 0.18, fb[1], false);
      var bloom = new THREE.Group(); scene.add(bloom); bloom.visible = false;
      for (var fi = 0; fi < 5; fi++) {
        var fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6),
          mat([0xd94f6a, 0xffc94d, 0xb48ad4][fi % 3]));
        fl.position.set(fb[0] - 0.8 + (fi % 3) * 0.8, 0.55, fb[1] - 0.6 + ((fi / 3) | 0) * 1);
        bloom.add(fl);
        var st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), mat(0x4a7d4a));
        st.position.set(fl.position.x, 0.35, fl.position.z); bloom.add(st);
      }
      plantsS2.push(bloom);
    });
    // street trees along the main road
    tree(-50, 7, 0.8); tree(4, -7, 0.9); tree(60, 7, 0.8); tree(112, -7, 0.9); tree(-14, 60, 1); tree(20, 60, 1);

    // faded murals that get repainted (restoration)
    var mm1 = new THREE.MeshLambertMaterial({ map: textTex(["BUDGET BAY", "SUNRISE"], 512, 256, "#8a8276", "#a89a86", 64, "stripe") });
    var mur1 = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), mm1);
    mur1.position.set(87.9, 3.2, -17); mur1.rotation.y = -Math.PI / 2; scene.add(mur1);
    muralMats.push(mm1);
    var mm2 = new THREE.MeshLambertMaterial({ map: textTex(["SHOP LOCAL"], 512, 256, "#7d766c", "#948a7a", 70) });
    var mur2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.4), mm2);
    mur2.position.set(-83.9, 3, 16); mur2.rotation.y = Math.PI / 2; scene.add(mur2);
    muralMats.push(mm2);

    // business alley clutter: dumpster, kiosk, broken bicycle, litter, cones
    flat(-84, 24, 84, 30, 0x6f6a60, 0.025); // alley paving
    box(2.6, 1.4, 1.4, 0x4a5a4a, -8, 0.7, 27, true); // dumpster
    var kiosk = box(2.6, 2.6, 2, 0x5a3a9a, -50, 1.3, 27, true);
    sign(["EASYCOINS", "KIOSK"], 2.4, 1.2, "#3a2a6a", "#ffd9ff", -50, 2, 25.95, Math.PI, 44);
    CC.worldRefs = CC.worldRefs || {}; CC.worldRefs.kiosk = kiosk;
    // broken bicycle prop (mission 5 discovery)
    var bikeProp = new THREE.Group(); bikeProp.position.set(34, 0, 27.2); bikeProp.rotation.z = 0.9; bikeProp.rotation.y = 0.6;
    var bw = mat(0xb0342c);
    [[-0.55, 0.45], [0.55, 0.45]].forEach(function (wp) {
      var wh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 16), mat(0x2a2a2a));
      wh.position.set(wp[0], wp[1], 0); bikeProp.add(wh);
    });
    var fr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), bw); fr.rotation.z = 0.4; fr.position.y = 0.55; bikeProp.add(fr);
    var fr2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), bw); fr2.rotation.z = -0.9; fr2.position.set(0.3, 0.6, 0); bikeProp.add(fr2);
    scene.add(bikeProp); CC.worldRefs.bikeProp = bikeProp;
    // construction barrier near the community center
    box(3, 1, 0.2, 0xe07b39, 84, 0.5, -6, true);
    // litter pieces (volunteer cleanup targets in mission 10)
    [[-20, -10], [14, -24], [-70, 5.5], [6, 40], [-96, -34]].forEach(function (lt, i) {
      var l = flat(lt[0], lt[1], lt[0] + 0.7, lt[1] + 0.5, 0xd8d3c2, 0.06);
      l.rotation.z = Math.random(); litter.push({ mesh: l, x: lt[0], z: lt[1], id: "lit" + i, taken: false });
    });

    // waterfront lamps and rail benches
    lamp(-60, 63); lamp(0, 63); lamp(60, 63);
    bench(-40, 65, Math.PI); bench(40, 65, Math.PI);
    // street lamps
    lamp(-100, 6); lamp(-60, -6); lamp(-20, 6); lamp(20, -6); lamp(64, 6); lamp(104, -6);
    lamp(-24, -8); lamp(24, -10);
    lamp(0, -34); lamp(-100, -14);

    // outdoor cafe seating, appears at stage 3
    [[-30, 9.5], [-25, 10.5], [-20, 9.5]].forEach(function (tt) {
      var tb = box(1, 0.75, 1, 0xfff4e0, tt[0], 0.4, tt[1], false);
      var um = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 8), mat(0xd94f6a));
      um.position.set(tt[0], 1.9, tt[1]); scene.add(um);
      var up = box(0.08, 1.6, 0.08, 0x8a6642, tt[0], 1, tt[1], false);
      outdoorS3.push(tb, um, up);
    });
    // string lights between plaza lamps, stage 3
    for (var si = 0; si < 8; si++) {
      var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x775500 }));
      bulb.position.set(-24 + si * 6.8, 4.6 - Math.sin(si / 7 * Math.PI) * 0.7, -9);
      scene.add(bulb); stringS3.push(bulb);
    }
    outdoorS3.concat(stringS3).forEach(function (m) { m.visible = false; });

    // the city bus
    bus = new THREE.Group(); scene.add(bus);
    var bBody = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 2.4), mat(CC.PAL.teal));
    bBody.position.y = 1.7; bBody.castShadow = true; bus.add(bBody);
    var bStripe = new THREE.Mesh(new THREE.BoxGeometry(7.05, 0.5, 2.45), mat(CC.PAL.cream));
    bStripe.position.y = 2.1; bus.add(bStripe);
    for (var wi = -1; wi <= 1; wi += 2) [[-2.4], [2.4]].forEach(function (wx) {
      var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), mat(0x2a2a2a));
      wh.rotation.x = Math.PI / 2; wh.position.set(wx[0], 0.5, wi * 1.2); bus.add(wh);
    });
    var bWin = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.8, 2.5), mat(CC.PAL.glass));
    bWin.position.y = 2.7; bus.add(bWin);
    bus.position.set(-140, 0, 1.8);
    busState = { x: -140, pause: 0, dir: 1 };

    // pedestrian walking routes
    routes = [
      [[-118, 6], [116, 6], [116, -6], [-118, -6]],
      [[-24, -8], [24, -8], [24, -28], [-24, -28]],
      [[-108, 64], [108, 64], [108, 67], [-108, 67]],
      [[-120, -16], [-80, -16], [-80, -42], [-120, -42]],
      [[-96, -58], [70, -58], [70, -61], [-96, -61]],
      [[10, 6], [10, 58], [-2, 58], [-2, 6]]
    ];

    // world edge walls
    addCollider(-150, -100, -130, 140); addCollider(130, -100, 150, 140);
    addCollider(-150, 128, 150, 140);

    // performer appears at restoration stage 3
    performer = CC.chars.make({ skin: 5, hair: 1, hairC: 4, top: 2, jacket: 3, pants: 7, shoes: 2, acc: 1, pack: -1 });
    performer.group.position.set(8, 0, -22); performer.group.rotation.y = -0.7;
    var guitar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.1), mat(0x8a5a2f));
    guitar.position.set(0, -0.35, 0.14); guitar.rotation.z = 0.5; performer.armL.add(guitar);
    performer.holdItem = guitar;
    scene.add(performer.group); performer.group.visible = false;

    CC.worldRefs.buildings = B;
    return B;
  }

  // ---------- billboard advertisement ----------
  var adSlogans = [["GET IT NOW.", "PAY LATER."], ["EVERYONE IS", "APPROVED!"], ["WHY WAIT?", "INSTANT EVERYTHING"], ["UPGRADE YOUR", "LIFE TODAY"]];
  function drawAd(idx) {
    var c = billboard.canvas.getContext("2d"), w = 512, h = 288;
    var gr = c.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#5a3a9a"); gr.addColorStop(1, "#2a5adf");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,.18)";
    for (var i = 0; i < 10; i++) c.fillRect((i * 97 + idx * 30) % w, (i * 53) % h, 26, 26);
    c.fillStyle = "#fff"; c.textAlign = "center";
    c.font = "bold 40px Trebuchet MS"; c.fillText("INSTANT EVERYTHING", w / 2, 62);
    var sl = adSlogans[idx % adSlogans.length];
    c.font = "bold 52px Trebuchet MS"; c.fillStyle = "#ffd94d";
    c.fillText(sl[0], w / 2, 150); c.fillText(sl[1], w / 2, 208);
    c.font = "10px Trebuchet MS"; c.fillStyle = "rgba(255,255,255,.5)";
    c.fillText("terms fees interest and conditions apply see enclosed 41 pages", w / 2, 274);
    billboard.tex.needsUpdate = true;
  }
  function drawGlitch() {
    var c = billboard.canvas.getContext("2d"), w = 512, h = 288;
    c.fillStyle = "#0a0f1e"; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 60; i++) {
      c.fillStyle = ["#27e0e8", "#e82fd0", "#111a2e"][i % 3];
      c.fillRect(Math.random() * w, Math.random() * h, Math.random() * 90, 4 + Math.random() * 10);
    }
    // the mask
    c.fillStyle = "#27e0e8";
    c.fillRect(w / 2 - 60, 70, 120, 130);
    c.fillStyle = "#0a0f1e";
    c.fillRect(w / 2 - 40, 105, 28, 22); c.fillRect(w / 2 + 12, 105, 28, 22);
    c.fillRect(w / 2 - 30, 160, 60, 12);
    c.fillStyle = "#e82fd0";
    c.font = "bold 26px monospace"; c.textAlign = "center";
    c.fillText("C0IN CITY IS A GAME", w / 2, 250);
    c.fillText("Y0U ARE L0SING", w / 2, 278);
    billboard.tex.needsUpdate = true;
  }
  function billboardGlitch(on) {
    billboard.glitch = on;
    if (on) drawGlitch(); else if (!billboard.custom) drawAd(0);
  }

  // ---------- day and night ----------
  var SKY = [
    { h: 5, sky: 0x27384c, sun: 0.05, amb: 0.16, fog: 0x27384c },
    { h: 7, sky: 0xf2b58a, sun: 0.55, amb: 0.26, fog: 0xe8c9a8 },
    { h: 10, sky: 0x9fd8ea, sun: 1.0, amb: 0.34, fog: 0xc9e2e8 },
    { h: 16, sky: 0x9fd0e8, sun: 0.9, amb: 0.32, fog: 0xc9dee8 },
    { h: 19, sky: 0xf2996a, sun: 0.45, amb: 0.24, fog: 0xd9a888 },
    { h: 21, sky: 0x1c2c44, sun: 0.06, amb: 0.15, fog: 0x1c2c44 },
    { h: 24, sky: 0x141f33, sun: 0.03, amb: 0.13, fog: 0x141f33 }
  ];
  function applySky() {
    var t = CC.state.minutes / 60;
    var a = SKY[0], b = SKY[0];
    for (var i = 0; i < SKY.length - 1; i++) {
      if (t >= SKY[i].h && t < SKY[i + 1].h) { a = SKY[i]; b = SKY[i + 1]; break; }
      if (t >= SKY[SKY.length - 1].h || t < SKY[0].h) { a = SKY[SKY.length - 1]; b = SKY[0]; }
    }
    var span = (b.h - a.h + 24) % 24 || 1;
    var f = CC.clamp(((t - a.h + 24) % 24) / span, 0, 1);
    var cloudMul = CC.state.weather === "clear" ? 1 : (CC.state.weather === "cloudy" ? 0.72 : 0.5);
    var sky = CC.lerpColor(a.sky, b.sky, f);
    if (CC.state.weather !== "clear") sky = CC.lerpColor(sky, 0x8a95a0, 0.4);
    scene.background = new THREE.Color(sky);
    if (scene.fog) scene.fog.color.setHex(CC.lerpColor(a.fog, b.fog, f));
    sun.intensity = CC.lerp(a.sun, b.sun, f) * cloudMul;
    amb.intensity = CC.lerp(a.amb, b.amb, f) + (stage >= 3 ? 0.03 : 0);
    hemi.intensity = 0.3 + sun.intensity * 0.3;
    // sun sweeps east to west
    var ang = ((t - 6) / 12) * Math.PI;
    sun.position.set(Math.cos(ang) * 90, Math.max(8, Math.sin(ang) * 100), 40);
    // lamps and shop windows at night
    var night = t < 6.3 || t > 18.8;
    lamps.forEach(function (lm) { lm.emissive.setHex(night ? 0xbb8822 : 0x000000); });
    lampLights.forEach(function (L) { L.visible = night; });
    windowMats.forEach(function (wmi) {
      var open = !wmi.open || (CC.hour() >= wmi.open[0] && CC.hour() < wmi.open[1]);
      wmi.m.emissive.setHex(night && open ? 0x554411 : 0x000000);
    });
    plaques.forEach(function (pq) {
      var open = CC.hour() >= pq.hours[0] && CC.hour() < pq.hours[1];
      var want = open ? pq.openT : pq.closedT;
      if (pq.m.map !== want) { pq.m.map = want; pq.m.needsUpdate = true; }
    });
    stringS3.forEach(function (bm) { bm.material.emissive.setHex(night ? 0xaa7711 : 0x332200); });
  }

  function initLampLights() {
    [[0, -19], [-60, 0], [60, 0], [0, 64], [-100, -30]].forEach(function (p) {
      var L = new THREE.PointLight(0xffd9a0, 0.7, 34);
      L.position.set(p[0], 5, p[1]); L.visible = false; scene.add(L);
      lampLights.push(L);
    });
  }

  // ---------- weather ----------
  function makeRain() {
    var geo = new THREE.BufferGeometry(), N = 700, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaccdd, size: 0.14, transparent: true, opacity: 0.7 }));
    rain.visible = false; scene.add(rain);
  }
  function setWeather(w) {
    CC.state.weather = w;
    rainOn = (w === "rain") && !CC.settings.reducedMotion;
    if (rain) rain.visible = rainOn;
    CC.audio.rain(w === "rain" && CC.zone === "city");
    if (CC.ui) CC.ui.updateHUD();
  }
  function rollWeather() {
    var r = Math.random();
    setWeather(r < 0.6 ? "clear" : (r < 0.85 ? "cloudy" : "rain"));
  }

  // ---------- restoration ----------
  function setRestoration(v) {
    CC.state.restoration = CC.clamp(v, 0, 100);
    var s = CC.state.restoration >= 70 ? 3 : (CC.state.restoration >= 35 ? 2 : 1);
    if (s !== stage) {
      stage = s;
      applyStage();
      if (CC.ui) CC.ui.toast(s === 2 ? "Budget Bay is recovering. The streets look brighter." : (s === 3 ? "Budget Bay is growing. The whole district feels alive." : ""), "info");
    }
  }
  function applyStage() {
    boardsS2.forEach(function (m) { m.visible = stage < 2; });
    plantsS2.forEach(function (m) { m.visible = stage >= 2; });
    if (benchBroken) { benchBroken.visible = stage < 2; benchFixed.visible = stage >= 2; }
    muralMats.forEach(function (mm, i) {
      mm.map = stage >= 2
        ? textTex(i === 0 ? ["BUDGET BAY", "SUNRISE"] : ["SHOP LOCAL"], 512, 256, i === 0 ? "#2fa5a9" : "#d94f6a", "#fff4e0", i === 0 ? 64 : 70, "stripe")
        : mm.map;
      mm.needsUpdate = true;
    });
    outdoorS3.forEach(function (m) { m.visible = stage >= 3; });
    stringS3.forEach(function (m) { m.visible = stage >= 3; });
    if (performer) performer.group.visible = stage >= 3;
    // more pedestrians as the district recovers
    var counts = { low: [5, 8, 12], medium: [8, 12, 18], high: [12, 18, 26] };
    var c = (counts[CC.settings.graphics] || counts.medium)[stage - 1];
    CC.chars.spawnPeds(scene, routes, c);
  }
  function fixCommunityCenter() {
    ccDamaged.visible = false; ccFixed.visible = true;
  }
  function fixHomeStorefront() {
    homeBoards.forEach(function (m) { m.visible = false; });
  }
  function showHomeDecor() { homeDecor.forEach(function (m) { m.visible = true; }); }
  function setShopSign(name) {
    if (shopSign) scene.remove(shopSign);
    shopSign = sign(name.toUpperCase(), 10, 1.5, "#c4485f", "#fff4e0", 42, 4.9, -7.82, 0, 52);
  }
  function setEventDecor(on) {
    if (on && eventDecor.length === 0) {
      // bunting, food stalls and lanterns for the celebration
      for (var i = 0; i < 10; i++) {
        var b = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 4),
          mat([0xd94f6a, 0xffc94d, 0x2fa5a9][i % 3]));
        b.position.set(88 + i * 2.4, 4.4 - Math.sin(i / 9 * Math.PI) * 0.6, -6.5);
        b.rotation.x = Math.PI; scene.add(b); eventDecor.push(b);
      }
      [[92, -2, "SNACKS", "#d94f6a"], [108, -2, "GAMES", "#3b6fb4"]].forEach(function (st) {
        var s1 = box(3, 2, 2, 0xe8d9b8, st[0], 1, st[1], true);
        var r1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.6), mat(0xc4574f));
        r1.position.set(st[0], 2.3, st[1]); scene.add(r1);
        var sg = sign(st[2], 2.6, 0.7, st[3], "#fff", st[0], 1.7, st[1] + 1.06, 0, 52);
        eventDecor.push(s1, r1, sg);
      });
      for (var li = 0; li < 6; li++) {
        var ln = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0xffc94d, emissive: 0xaa6600 }));
        ln.position.set(90 + li * 4, 3.6, -4); scene.add(ln); eventDecor.push(ln);
      }
    }
    eventDecor.forEach(function (m) { m.visible = on; });
  }

  // ---------- per-frame update ----------
  var envT = 0;
  function update(dt) {
    envT += dt;
    applySky();
    // clock tower hand
    if (clockHand) clockHand.rotation.z = -(CC.state.minutes % 720) / 720 * Math.PI * 2;
    // water shimmer and fountain
    if (water) water.position.y = -1.1 + Math.sin(envT * 1.4) * 0.05;
    if (fountainJet) {
      var js = 0.8 + Math.sin(envT * 5) * 0.18;
      fountainJet.scale.set(1, js, 1);
    }
    // trees sway
    if (!CC.settings.reducedMotion) {
      for (var i = 0; i < trees.length; i++) {
        var sw = Math.sin(envT * 1.1 + trees[i].x) * 0.05;
        trees[i].a.rotation.z = sw; trees[i].b.rotation.z = sw * 1.4;
      }
      flags.forEach(function (f, fi) { f.rotation.y = Math.sin(envT * 2 + fi) * 0.3; });
    }
    // billboard: ad rotation, flicker, or glitch static
    billboard.timer += dt;
    if (billboard.glitch) {
      if (billboard.timer > 0.12) { billboard.timer = 0; drawGlitch(); }
    } else if (!billboard.custom && billboard.timer > 3.2) {
      billboard.timer = 0; drawAd((Math.random() * adSlogans.length) | 0);
    }
    // rain follows the player
    if (rainOn && rain && CC.player) {
      rain.position.x = CC.player.pos.x; rain.position.z = CC.player.pos.z;
      var pos = rain.geometry.attributes.position;
      for (var ri = 0; ri < pos.count; ri++) {
        var y = pos.getY(ri) - dt * 22;
        if (y < 0) y = 28;
        pos.setY(ri, y);
      }
      pos.needsUpdate = true;
    }
    // the bus drives the main street, pausing at stops
    if (bus) {
      if (busState.pause > 0) busState.pause -= dt;
      else {
        busState.x += dt * 9 * busState.dir;
        if (busState.x > 140) { busState.x = 140; busState.dir = -1; bus.rotation.y = Math.PI; }
        if (busState.x < -140) { busState.x = -140; busState.dir = 1; bus.rotation.y = 0; }
        [[10], [100], [-90]].forEach(function (st) {
          if (Math.abs(busState.x - st[0]) < 0.5 && busState.pause <= 0) busState.pause = 4;
        });
        bus.position.x = busState.x;
        bus.position.z = busState.dir > 0 ? 1.8 : -1.8;
      }
    }
  }

  return {
    build: build, colliders: colliders, solids: solids, routes: routes,
    update: update, applySky: applySky, initLampLights: initLampLights,
    makeRain: makeRain, setWeather: setWeather, rollWeather: rollWeather,
    setRestoration: setRestoration, applyStage: applyStage, stageNum: function () { return stage; },
    billboardGlitch: billboardGlitch,
    fixCommunityCenter: fixCommunityCenter, fixHomeStorefront: fixHomeStorefront,
    showHomeDecor: showHomeDecor, setShopSign: setShopSign, setEventDecor: setEventDecor,
    litter: litter, posters: posters,
    textTex: textTex, sign: sign, boxHelper: box, flatHelper: flat, matHelper: mat,
    addCollider: addCollider
  };
})();
