// Interiors. Nine fully enterable rooms parked far from the city (x >= 1000)
// in the same scene: player home, bank, bakery, grocery, cafe, repair shop,
// general store, community center and city hall. Each room has furniture,
// wall colliders, its own light, an exit door, and honest opening hours.
CC.interiors = (function () {
  var scene, built = false;
  var roomLight = {}, ccDmgIn, ccFixIn, homeStuff = {};

  // zone id -> {cx, cz, w, d, name, hours, wallC, floorC}
  var ROOMS = {
    home:    { cx: 1000, cz: 0, w: 18, d: 14, name: "Your Building", wallC: 0x9a8f80, floorC: 0x8a7a66 },
    bank:    { cx: 1120, cz: 0, w: 20, d: 15, name: "Penny's Community Bank", hours: [9, 17], wallC: 0xbfe4d2, floorC: 0xd9cdb4 },
    bakery:  { cx: 1240, cz: 0, w: 18, d: 14, name: "Nia's Bakery", hours: [7, 18], wallC: 0xf3cdd6, floorC: 0xe8d9c4 },
    grocery: { cx: 1360, cz: 0, w: 24, d: 18, name: "Budget Basket Market", hours: [8, 20], wallC: 0xd9e4c4, floorC: 0xc9c2b0 },
    cafe:    { cx: 1480, cz: 0, w: 18, d: 14, name: "Sunrise Cafe", hours: [6, 16], wallC: 0xe8c9a0, floorC: 0x9a7a5a },
    repair:  { cx: 1600, cz: 0, w: 18, d: 14, name: "Rusty's Fix-It", hours: [9, 18], wallC: 0xa8b4c0, floorC: 0x6a7076 },
    store:   { cx: 1720, cz: 0, w: 18, d: 14, name: "Thread + Things", hours: [9, 19], wallC: 0xd4c0e8, floorC: 0xb0a4c0 },
    center:  { cx: 1840, cz: 0, w: 26, d: 20, name: "Community Center", wallC: 0x9a948a, floorC: 0x84807a },
    hall:    { cx: 1960, cz: 0, w: 22, d: 16, name: "City Hall", hours: [8, 18], wallC: 0xe4d9c0, floorC: 0xc0b494 }
  };

  function mat(c) { return new THREE.MeshLambertMaterial({ color: c }); }
  function box(zone, w, h, d, c, x, y, z, solid) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
    scene.add(m);
    if (solid) addCol(zone, x - w / 2, z - d / 2, x + w / 2, z + d / 2);
    return m;
  }
  function addCol(zone, x1, z1, x2, z2) {
    if (!CC.world.colliders[zone]) CC.world.colliders[zone] = [];
    CC.world.colliders[zone].push({ x1: x1, z1: z1, x2: x2, z2: z2 });
  }

  // A room shell: floor, ceiling, four walls with colliders, a rug, an inside
  // door mark on the south wall, and a warm point light.
  function shell(zone) {
    var R = ROOMS[zone], cx = R.cx, cz = R.cz, w = R.w, d = R.d, H = 3.6;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(R.floorC));
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0.01, cz); scene.add(floor);
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(0xf4ede0));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); scene.add(ceil);
    // walls: north, south (door side), west, east
    box(zone, w, H, 0.3, R.wallC, cx, H / 2, cz - d / 2, true);
    box(zone, w, H, 0.3, R.wallC, cx, H / 2, cz + d / 2, true);
    box(zone, 0.3, H, d, R.wallC, cx - w / 2, H / 2, cz, true);
    box(zone, 0.3, H, d, R.wallC, cx + w / 2, H / 2, cz, true);
    // door mark inside the south wall
    box(zone, 1.6, 2.6, 0.12, 0x6a4a32, cx, 1.3, cz + d / 2 - 0.22, false);
    var L = new THREE.PointLight(0xfff0d0, 0.9, w + d);
    L.position.set(cx, H - 0.5, cz); scene.add(L);
    roomLight[zone] = L;
    // exit interactable just inside the door
    CC.interact.add(zone, {
      id: zone + "_exit", x: cx, z: cz + d / 2 - 1.2, r: 1.7, label: "Leave",
      action: function () { CC.interiors.exitTo(zone); }
    });
    return R;
  }

  // ---------- room furnishings ----------
  function buildHome() {
    var R = shell("home"), cx = R.cx, cz = R.cz;
    // bed in the corner
    box("home", 2.2, 0.5, 1.2, 0x8a6642, cx - 6.5, 0.25, cz - 5.4, true);
    homeStuff.mattress = box("home", 2, 0.3, 1, 0xc9c2b4, cx - 6.5, 0.55, cz - 5.4, false);
    homeStuff.blanket = box("home", 2, 0.12, 0.7, CC.PAL.teal, cx - 6.5, 0.72, cz - 5.6, false);
    homeStuff.blanket.visible = false; // appears when bought in mission 2
    // desk and planning corkboard
    box("home", 2.4, 0.85, 1, 0x6a4a32, cx + 5.5, 0.42, cz - 5.6, true);
    box("home", 2.6, 1.5, 0.1, 0xb59a6a, cx + 5.5, 2.2, cz - 6.8, false);
    var note = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["MY PLAN FOR", "BUDGET BAY"], 256, 128, "#b59a6a", "#4a3a22", 30) }));
    note.position.set(cx + 5.5, 2.2, cz - 6.72); scene.add(note);
    // storage shelf
    box("home", 0.6, 2.2, 3, 0x7a5f45, cx - 8.2, 1.1, cz + 2, true);
    // savings jar display on a stool
    box("home", 0.7, 0.6, 0.7, 0x8a6642, cx + 7.5, 0.3, cz + 3, true);
    homeStuff.jar = box("home", 0.4, 0.55, 0.4, 0xbfe8f0, cx + 7.5, 0.9, cz + 3, false);
    // trophy shelf (fills with achievements later)
    box("home", 3, 0.12, 0.5, 0x6a4a32, cx - 2, 2.4, cz - 6.8, false);
    // boarded storefront window on the inside of the front wall
    homeStuff.boards = [];
    for (var i = 0; i < 3; i++) {
      var b = box("home", 4, 0.5, 0.12, 0x7a5f45, cx - 3, 1.2 + i * 0.7, cz + R.d / 2 - 0.3, false);
      b.rotation.z = i % 2 ? 0.1 : -0.08;
      homeStuff.boards.push(b);
    }
    homeStuff.lamp = box("home", 0.3, 1.6, 0.3, 0x39454e, cx + 2, 0.8, cz - 6, false);
    var lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x664400 }));
    lampHead.position.set(cx + 2, 1.8, cz - 6); scene.add(lampHead);
    homeStuff.lampHead = lampHead; lampHead.visible = false; homeStuff.lamp.visible = false;
    homeStuff.kettle = box("home", 0.4, 0.35, 0.4, 0xd94f6a, cx - 7.8, 2.35, cz + 2, false);
    homeStuff.kettle.visible = false;
    homeStuff.decor = box("home", 0.5, 0.7, 0.1, 0xffc94d, cx, 2.1, cz - 6.85, false);
    homeStuff.decor.visible = false;
    // dusty fixer-upper flavor
    box("home", 1.4, 0.4, 1, 0x84766a, cx + 1, 0.2, cz + 3.5, true); // old crate
    box("home", 1, 0.3, 0.8, 0x84766a, cx - 3, 0.15, cz + 4.2, true);

    // sleeping advances the day
    CC.interact.add("home", {
      id: "bed", x: cx - 6.5, z: cz - 5.4, r: 1.8, label: "Sleep until morning",
      action: function () { CC.main.sleep(); }
    });
    // savings jar peek
    CC.interact.add("home", {
      id: "jar", x: cx + 7.5, z: cz + 3, r: 1.5, label: "Check savings jar",
      action: function () {
        var s = CC.state;
        CC.ui.toast(s.bankOpen ? ("Bank savings: " + s.savings + " coins.") : "The jar is empty. Penny at the bank can help savings grow.", "info");
      }
    });
  }

  function buildBank() {
    var R = shell("bank"), cx = R.cx, cz = R.cz;
    // two teller desks
    box("bank", 3, 1.05, 1, 0x8a6642, cx - 3.5, 0.52, cz - 3.5, true);
    box("bank", 3, 1.05, 1, 0x8a6642, cx + 3.5, 0.52, cz - 3.5, true);
    // glass dividers
    box("bank", 3, 0.9, 0.06, 0xbfe8f0, cx - 3.5, 1.9, cz - 3.5, false);
    box("bank", 3, 0.9, 0.06, 0xbfe8f0, cx + 3.5, 1.9, cz - 3.5, false);
    // digital display: growing savings chart
    var chart = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2),
      new THREE.MeshBasicMaterial({ map: makeChartTex() }));
    chart.position.set(cx, 2.2, cz - R.d / 2 + 0.2); scene.add(chart);
    // waiting bench and coin rug
    box("bank", 2.4, 0.5, 0.7, CC.PAL.wood, cx - 6.5, 0.25, cz + 2.5, true);
    var rug = new THREE.Mesh(new THREE.CircleGeometry(2, 20), mat(0xffc94d));
    rug.rotation.x = -Math.PI / 2; rug.position.set(cx, 0.03, cz + 1); scene.add(rug);
    // ATM by the door
    box("bank", 1, 1.9, 0.7, 0x3a4a5a, cx + 7.5, 0.95, cz + 4.5, true);
    var atmScr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["ATM"], 128, 96, "#1d6b6e", "#bfffe8", 40) }));
    atmScr.position.set(cx + 7.5, 1.35, cz + 4.1); atmScr.rotation.y = Math.PI; scene.add(atmScr);
    // office door at the back
    box("bank", 1.4, 2.4, 0.12, 0x6a4a32, cx - 8.5, 1.2, cz - 2, false);
  }

  function makeChartTex() {
    var cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
    var c = cv.getContext("2d");
    c.fillStyle = "#153a3c"; c.fillRect(0, 0, 256, 128);
    c.strokeStyle = "#9fe2bf"; c.lineWidth = 4; c.beginPath(); c.moveTo(14, 110);
    [[50, 96], [90, 84], [130, 78], [170, 52], [230, 26]].forEach(function (p) { c.lineTo(p[0], p[1]); });
    c.stroke();
    c.fillStyle = "#ffd94d"; c.font = "bold 18px Trebuchet MS";
    c.fillText("SAVINGS GROW", 14, 24);
    return new THREE.CanvasTexture(cv);
  }

  function buildBakery() {
    var R = shell("bakery"), cx = R.cx, cz = R.cz;
    // display case with pastries
    box("bakery", 5, 1, 1.2, 0xf3d9a0, cx, 0.5, cz - 2.5, true);
    box("bakery", 5, 0.7, 1.2, 0xbfe8f0, cx, 1.35, cz - 2.5, false);
    var pastryCols = [0xf0a0b4, 0xd9a066, 0xfff4e0, 0xc4574f, 0xffc94d];
    for (var i = 0; i < 10; i++) {
      var p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(pastryCols[i % 5]));
      p.position.set(cx - 2 + (i % 5) * 1, 1.15, cz - 2.5 + (i < 5 ? -0.25 : 0.25));
      p.scale.y = 0.7; scene.add(p);
    }
    // chalkboard menu
    var menu = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["NIA'S BAKERY", "buns 4  tarts 6", "bread 5  cake 14"], 256, 160, "#2d3a33", "#f4ede0", 26) }));
    menu.position.set(cx, 2.3, cz - R.d / 2 + 0.2); scene.add(menu);
    // ovens and prep counter behind
    box("bakery", 2, 1.6, 1, 0x5a5a5a, cx - 5.5, 0.8, cz - 5, true);
    box("bakery", 3.5, 0.95, 1, 0xe8d9c4, cx + 4.5, 0.47, cz - 5, true);
    // two little tables
    [[-5, 3], [5, 3]].forEach(function (t) {
      box("bakery", 1.1, 0.78, 1.1, 0xf3d9a0, cx + t[0], 0.39, cz + t[1], true);
      box("bakery", 0.5, 0.5, 0.5, 0x8a6642, cx + t[0] - 1, 0.25, cz + t[1], false);
      box("bakery", 0.5, 0.5, 0.5, 0x8a6642, cx + t[0] + 1, 0.25, cz + t[1], false);
    });
  }

  function buildGrocery() {
    var R = shell("grocery"), cx = R.cx, cz = R.cz;
    // four aisles of stocked shelves
    for (var a = 0; a < 4; a++) {
      var ax = cx - 7.5 + a * 5;
      box("grocery", 1.2, 1.8, 10, 0xb0a284, ax, 0.9, cz - 1, true);
      for (var s = 0; s < 3; s++) for (var q = 0; q < 6; q++) {
        var prod = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4),
          mat([0xd94f6a, 0x4a7d4a, 0xffc94d, 0x3b6fb4, 0xff8a5c, 0xb48ad4][(a + s + q) % 6]));
        prod.position.set(ax + (q % 2 ? 0.62 : -0.62), 0.5 + s * 0.6, cz - 5.2 + q * 1.7);
        scene.add(prod);
      }
    }
    // checkout counter and baskets
    box("grocery", 3.2, 0.95, 1.2, 0x8a6642, cx + 7, 0.47, cz + 5.5, true);
    box("grocery", 0.8, 0.5, 0.8, 0xc4574f, cx - 10, 0.25, cz + 6.5, false);
    box("grocery", 0.8, 0.5, 0.8, 0xc4574f, cx - 10, 0.75, cz + 6.5, false);
    // sale sign
    var sale = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["WEEKLY SALE"], 256, 100, "#c4485f", "#fff4e0", 40) }));
    sale.position.set(cx, 2.6, cz - R.d / 2 + 0.2); scene.add(sale);
  }

  function buildCafe() {
    var R = shell("cafe"), cx = R.cx, cz = R.cz;
    box("cafe", 5.5, 1, 1.2, 0x7a4a26, cx - 2, 0.5, cz - 3, true);       // counter
    box("cafe", 1.2, 0.8, 0.8, 0x9a9a9a, cx - 4, 1.35, cz - 3, false);   // espresso machine
    box("cafe", 0.5, 0.4, 0.5, 0xd94f6a, cx - 1, 1.25, cz - 3, false);   // pastry dome
    var menu = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["SUNRISE CAFE", "coffee 3  tea 2", "toast 4"], 256, 140, "#4a3020", "#f4ead0", 26) }));
    menu.position.set(cx - 2, 2.4, cz - R.d / 2 + 0.2); scene.add(menu);
    // tables with stools
    [[-5.5, 2.5], [-1, 3.2], [3.5, 2.2], [5.5, -1.5]].forEach(function (t) {
      box("cafe", 1, 0.78, 1, 0x8a6642, cx + t[0], 0.39, cz + t[1], true);
      box("cafe", 0.45, 0.5, 0.45, 0x5a4632, cx + t[0] - 0.9, 0.25, cz + t[1], false);
      box("cafe", 0.45, 0.5, 0.45, 0x5a4632, cx + t[0] + 0.9, 0.25, cz + t[1], false);
    });
    // order pickup shelf
    box("cafe", 2, 0.1, 0.6, 0xe8c9a0, cx + 2.6, 1.15, cz - 3, false);
  }

  function buildRepair() {
    var R = shell("repair"), cx = R.cx, cz = R.cz;
    box("repair", 4.5, 0.95, 1.4, 0x5a4632, cx - 3, 0.47, cz - 3.5, true); // workbench
    // tool wall
    for (var i = 0; i < 6; i++) {
      var tool = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.08), mat(i % 2 ? 0xb0342c : 0x39454e));
      tool.position.set(cx - 5 + i * 1.1, 2.2, cz - R.d / 2 + 0.25); scene.add(tool);
    }
    // bike stand with a bike being fixed
    box("repair", 0.8, 0.9, 2, 0x6a7076, cx + 4.5, 0.45, cz - 3, true);
    var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 16), mat(0x2a2a2a));
    wheel.rotation.y = Math.PI / 2; wheel.position.set(cx + 4.5, 1.3, cz - 3.6); scene.add(wheel);
    // parts shelves
    box("repair", 0.6, 2.2, 4, 0x7a5f45, cx + 8, 1.1, cz + 1, true);
    for (var s = 0; s < 6; s++) {
      var part = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), mat([0xb0342c, 0x3b6fb4, 0x8a8a8a][s % 3]));
      part.position.set(cx + 7.9, 0.5 + (s % 3) * 0.7, cz - 0.4 + ((s / 3) | 0) * 1.6); scene.add(part);
    }
    // oil stain flavor
    var stain = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12), mat(0x3a3a3a));
    stain.rotation.x = -Math.PI / 2; stain.position.set(cx + 3, 0.02, cz + 2); scene.add(stain);
  }

  function buildStore() {
    var R = shell("store"), cx = R.cx, cz = R.cz;
    // Clean, colorful Mission 1 layout. Display coordinates must match
    // DISPLAY_AT in missions.js.
    function display(x, z, faceRy, label1, label2, baseC, buildItem) {
      box("store", 1, 0.9, 1, baseC, x, 0.45, z, true);
      var lb = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.95),
        new THREE.MeshBasicMaterial({ map: CC.world.textTex([label1, label2], 256, 128, "#fff8eb", "#22333b", 34) }));
      lb.position.set(x, 2, z); lb.rotation.y = faceRy; scene.add(lb);
      buildItem(x, z);
    }
    function m2(c) { return new THREE.MeshLambertMaterial({ color: c }); }
    function put(geom, c, x, y, z) {
      var m = new THREE.Mesh(geom, m2(c)); m.position.set(x, y, z); scene.add(m); return m;
    }
    var E = Math.PI / 2, W = -Math.PI / 2, S = 0;
    // ESSENTIALS along the west wall
    var head1 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["EVERYDAY ESSENTIALS"], 320, 80, "#2fa5a9", "#fff4e0", 34) }));
    head1.position.set(cx - 8.8, 2.9, cz - 0.5); head1.rotation.y = E; scene.add(head1);
    display(cx - 7, cz - 4, E, "Packed Lunch", "8 coins", 0x9fe2bf, function (x, z) {
      put(new THREE.BoxGeometry(0.5, 0.4, 0.35), 0xb08050, x, 1.1, z);
      put(new THREE.SphereGeometry(0.12, 8, 8), 0xd94f6a, x + 0.25, 1.02, z + 0.15);
    });
    display(cx - 7, cz - 0.5, E, "Notebook", "6 coins", 0x9fe2bf, function (x, z) {
      put(new THREE.BoxGeometry(0.55, 0.08, 0.7), 0x3b6fb4, x, 0.95, z).rotation.y = 0.3;
      put(new THREE.BoxGeometry(0.5, 0.05, 0.65), 0xfff4e0, x, 1.01, z).rotation.y = 0.3;
    });
    display(cx - 7, cz + 3, E, "Bus Pass", "12 coins", 0x9fe2bf, function (x, z) {
      put(new THREE.BoxGeometry(0.55, 0.35, 0.06), 0x2fa5a9, x, 1.1, z).rotation.y = 0.5;
    });
    // WANTS along the north wall
    var head2 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["TREATS + TRENDS"], 320, 80, "#7a4fb4", "#ffd9ff", 34) }));
    head2.position.set(cx + 0.5, 2.9, cz - 6.8); scene.add(head2);
    display(cx - 3.5, cz - 5.6, S, "Candy Mix", "3 coins", 0xf3cdd6, function (x, z) {
      [0xd94f6a, 0xffc94d, 0x9fe2bf].forEach(function (c, i) {
        put(new THREE.SphereGeometry(0.11, 8, 8), c, x - 0.18 + i * 0.18, 1, z);
      });
    });
    display(cx - 1, cz - 5.6, S, "Wind-Up Robot", "10 coins", 0xf3cdd6, function (x, z) {
      put(new THREE.BoxGeometry(0.3, 0.35, 0.22), 0x8a8a8a, x, 1.08, z);
      put(new THREE.BoxGeometry(0.2, 0.18, 0.18), 0xb0b0b0, x, 1.35, z);
      put(new THREE.SphereGeometry(0.04, 6, 6), 0xffc94d, x - 0.05, 1.37, z + 0.1);
      put(new THREE.SphereGeometry(0.04, 6, 6), 0xffc94d, x + 0.05, 1.37, z + 0.1);
    });
    display(cx + 1.5, cz - 5.6, S, "Video Game", "20 coins", 0xf3cdd6, function (x, z) {
      var g = put(new THREE.BoxGeometry(0.42, 0.52, 0.06), 0x22333b, x, 1.15, z);
      var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.3),
        new THREE.MeshBasicMaterial({ map: CC.world.textTex(["PLAY!"], 96, 80, "#4a2a8a", "#ffd94d", 26) }));
      scr.position.set(x, 1.2, z + 0.04); scene.add(scr);
    });
    display(cx + 4, cz - 5.6, S, "Headphones", "18 coins", 0xf3cdd6, function (x, z) {
      var arc = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI), m2(0xff8a5c));
      arc.position.set(x, 1.1, z); scene.add(arc);
      put(new THREE.SphereGeometry(0.09, 8, 8), 0x22333b, x - 0.22, 1.08, z);
      put(new THREE.SphereGeometry(0.09, 8, 8), 0x22333b, x + 0.22, 1.08, z);
    });
    // bigger wants along the east wall
    display(cx + 7, cz - 3, W, "New Shoes", "22 coins", 0xd4c0e8, function (x, z) {
      put(new THREE.BoxGeometry(0.24, 0.16, 0.5), 0xb0342c, x - 0.18, 1, z);
      put(new THREE.BoxGeometry(0.24, 0.16, 0.5), 0xb0342c, x + 0.18, 1, z);
    });
    display(cx + 7, cz + 0.5, W, "Trendy Backpack", "16 coins", 0xd4c0e8, function (x, z) {
      put(new THREE.BoxGeometry(0.42, 0.55, 0.25), 0xff8a5c, x, 1.2, z);
      put(new THREE.BoxGeometry(0.3, 0.2, 0.1), 0xffc94d, x, 1.05, z + 0.14);
    });
    // checkout counter with a register, by the door
    box("store", 3.2, 1, 1.2, 0x7a4fb4, cx + 4, 0.5, cz + 3.4, true);
    put(new THREE.BoxGeometry(0.5, 0.5, 0.4), 0x39454e, cx + 5, 1.25, cz + 3.4);
    var till = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["CHECK OUT HERE"], 256, 70, "#ffc94d", "#22333b", 34) }));
    till.position.set(cx + 4, 1.8, cz + 2.7); scene.add(till);
    // friendly touches, no clutter
    var rug = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), m2(0xffc94d));
    rug.rotation.x = -Math.PI / 2; rug.position.set(cx, 0.03, cz + 1); scene.add(rug);
    box("store", 0.4, 0.5, 0.4, 0xc4574f, cx - 4, 0.25, cz + 5.6, false);
    put(new THREE.SphereGeometry(0.35, 8, 8), 0x4a7d4a, cx - 4, 0.8, cz + 5.6);
    var wallSign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.1),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["THREAD + THINGS"], 320, 80, "#fff8eb", "#7a4fb4", 40) }));
    wallSign.position.set(cx + 8.8, 2.9, cz + 3.5); wallSign.rotation.y = W; scene.add(wallSign);
  }

  function buildCenter() {
    var R = shell("center"), cx = R.cx, cz = R.cz;
    // damaged version: stacked chairs, tarp, dust, one working table
    ccDmgIn = new THREE.Group(); scene.add(ccDmgIn);
    ccFixIn = new THREE.Group(); scene.add(ccFixIn); ccFixIn.visible = false;
    function addTo(g, mesh) { scene.remove(mesh); g.add(mesh); return mesh; }
    addTo(ccDmgIn, box("center", 2.2, 1.7, 1.6, 0x84766a, cx - 8, 0.85, cz - 5, true));
    addTo(ccDmgIn, box("center", 2, 1.3, 1.4, 0x84766a, cx - 5, 0.65, cz - 6, true));
    addTo(ccDmgIn, box("center", 5, 0.2, 4, 0x3b6fb4, cx + 6, 2.9, cz - 4, false)); // tarp
    var dust = new THREE.Mesh(new THREE.CircleGeometry(3, 16), mat(0x9a948a));
    dust.rotation.x = -Math.PI / 2; dust.position.set(cx, 0.02, cz); addTo(ccDmgIn, dust);
    addTo(ccDmgIn, box("center", 3, 0.9, 1.4, 0x6a5a4a, cx + 2, 0.45, cz + 2, true));
    // restored version: stage, banner, seat rows, notice board
    addTo(ccFixIn, box("center", 8, 0.5, 4, 0xc4574f, cx, 0.25, cz - 6.5, true)); // stage
    var ban = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.6),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["WELCOME BACK, BUDGET BAY"], 512, 100, "#1d6b6e", "#fff4e0", 40) }));
    ban.position.set(cx, 2.8, cz - R.d / 2 + 0.2); addTo(ccFixIn, ban);
    for (var r = 0; r < 3; r++) for (var c2 = 0; c2 < 4; c2++) {
      addTo(ccFixIn, box("center", 0.6, 0.5, 0.6, CC.PAL.teal, cx - 4.5 + c2 * 3, 0.25, cz + r * 2, false));
    }
    addTo(ccFixIn, box("center", 3, 1.6, 0.15, 0xb59a6a, cx - 9, 1.6, cz + 3, false));
  }

  function buildHall() {
    var R = shell("hall"), cx = R.cx, cz = R.cz;
    box("hall", 4, 1.05, 1.4, 0x8a6642, cx, 0.52, cz - 4, true);         // reception desk
    // city model table
    box("hall", 3.4, 0.8, 2.4, 0x6a5a4a, cx - 6, 0.4, cz + 1, true);
    [[0.4, 0.5], [1.1, 0.35], [-0.8, 0.6], [-0.2, 0.3]].forEach(function (mB) {
      box("hall", 0.5, mB[1], 0.5, 0xc9c2b4, cx - 6 + mB[0], 0.8 + mB[1] / 2, cz + 1 + mB[0] * 0.3, false);
    });
    // district progress board
    var prog = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["BUDGET BAY", "RESTORATION PLAN"], 256, 140, "#4a7d4a", "#f4ede0", 28) }));
    prog.position.set(cx, 2.2, cz - R.d / 2 + 0.2); scene.add(prog);
    // flags and bench
    box("hall", 0.1, 2.6, 0.1, 0x8a8a8a, cx + 6, 1.3, cz - 5, false);
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshLambertMaterial({ color: CC.PAL.teal, side: THREE.DoubleSide }));
    fl.position.set(cx + 6.6, 2.3, cz - 5); scene.add(fl);
    box("hall", 2.4, 0.5, 0.7, CC.PAL.wood, cx + 7, 0.25, cz + 3, true);
  }

  // ---------- transitions ----------
  function doorFor(zone) {
    var B = CC.worldRefs.buildings;
    var map = { home: B.home, bank: B.bank, bakery: B.bakery, grocery: B.grocery, cafe: B.cafe, repair: B.repair, store: B.store, center: B.center, hall: B.hall };
    return map[zone].door;
  }
  function isOpen(zone) {
    var h = ROOMS[zone].hours;
    if (!h) return true;
    return CC.hour() >= h[0] && CC.hour() < h[1];
  }
  function hoursText(zone) {
    var h = ROOMS[zone].hours;
    function fmt(x) { var ap = x < 12 ? "AM" : "PM"; var hh = x % 12; if (hh === 0) hh = 12; return hh + " " + ap; }
    return fmt(h[0]) + " to " + fmt(h[1]);
  }

  function enter(zone) {
    if (!isOpen(zone)) {
      CC.audio.sfx("error");
      CC.ui.toast(ROOMS[zone].name + " is closed. Open " + hoursText(zone) + ".", "bad");
      return;
    }
    CC.audio.sfx("door");
    CC.ui.fade(true, function () {
      CC.zone = zone;
      var R = ROOMS[zone];
      CC.player.warp(R.cx, R.cz + R.d / 2 - 1.6, Math.PI); // step in facing the room
      CC.audio.rain(false);
      CC.ui.fade(false);
      if (CC.onZoneEnter) CC.onZoneEnter(zone);
    }, 380);
  }
  function exitTo(zone) {
    CC.audio.sfx("door");
    CC.ui.fade(true, function () {
      CC.zone = "city";
      var d = doorFor(zone);
      // North-side buildings have doors at negative z and open toward +z
      // (the main street). South-side shops open toward -z.
      var outward = d.z < 0 ? 1 : -1;
      CC.player.warp(d.x, d.z + outward * 0.7, outward > 0 ? 0 : Math.PI);
      if (CC.state.weather === "rain") CC.audio.rain(true);
      CC.ui.fade(false);
      if (CC.onZoneEnter) CC.onZoneEnter("city");
    }, 380);
  }

  function registerCityDoors() {
    for (var zone in ROOMS) (function (zone) {
      var d = doorFor(zone);
      CC.interact.add("city", {
        id: "door_" + zone, x: d.x, z: d.z, r: 2,
        label: "Enter " + ROOMS[zone].name,
        action: function () { enter(zone); }
      });
    })(zone);
  }

  function build(sc) {
    if (built) return; built = true;
    scene = sc;
    buildHome(); buildBank(); buildBakery(); buildGrocery(); buildCafe();
    buildRepair(); buildStore(); buildCenter(); buildHall();
    registerCityDoors();
  }

  // Home upgrades become visible as the story grants them
  function refreshHome() {
    var f = CC.state.flags, inv = CC.state.inv;
    if (homeStuff.blanket) homeStuff.blanket.visible = inv.blanket > 0;
    if (homeStuff.lamp) { homeStuff.lamp.visible = inv.lamp > 0; homeStuff.lampHead.visible = inv.lamp > 0; }
    if (homeStuff.kettle) homeStuff.kettle.visible = inv.kettle > 0;
    if (homeStuff.decor) homeStuff.decor.visible = f.decorated;
    if (homeStuff.boards) homeStuff.boards.forEach(function (b) { b.visible = !f.storeOpen; });
  }
  function fixCenterInterior() { ccDmgIn.visible = false; ccFixIn.visible = true; }

  return {
    build: build, enter: enter, exitTo: exitTo, isOpen: isOpen,
    ROOMS: ROOMS, refreshHome: refreshHome, fixCenterInterior: fixCenterInterior,
    roomPos: function (zone) { return ROOMS[zone]; }
  };
})();
