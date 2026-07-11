// Mission 2: FIRST PROFIT. Teaches earning, the difference between revenue
// and profit, how price affects demand, and paying back what you borrow.
// The player buys (or borrows) a lemonade kit at the grocery, sets up a stand
// in the plaza, chooses a price, and serves animated customers one by one.
CC.m2 = (function () {
  var scene = null;
  var stand = null, standSign = null, kitDisplay = null;
  var customer = null, spawnTimer = 0, farewell = [];

  var KIT_COST = 10, LOAN_REPAY = 12, CUPS = 10;
  var STAND = { x: 8, z: -13 };
  var BUY_CHANCE = { 2: 0.95, 3: 0.8, 4: 0.55, 5: 0.35 };

  function st() { return CC.state.missions.stage; }
  function m2() { return CC.state.flags.m2 || (CC.state.flags.m2 = {}); }

  // ---------- mission start ----------
  function startSoon() {
    if (st().m2) return;
    setTimeout(startIntro, 2200);
  }
  function startIntro() {
    if (st().m2 || CC.paused) { if (!st().m2) setTimeout(startIntro, 2000); return; }
    CC.missions.say([
      { who: "ledger", text: "Nice work with that budget. Spending wisely is half the story." },
      { who: "ledger", text: "The other half is earning. Nia put together lemonade starter kits, they are at Budget Basket Market." },
      { who: "ledger", text: "A kit costs 10 coins and makes 10 cups. Sell them in the plaza by the fountain." },
      { who: "ledger", text: "Here is the secret: what you take in is revenue. What is left after paying for the kit, that is profit." }
    ], function () {
      st().m2 = 1;
      CC.ui.banner("MISSION 2", "FIRST PROFIT");
      CC.audio.sfx("mission");
      CC.ui.tracker("First Profit", "Get a lemonade kit at Budget Basket Market (10 coins).");
      CC.missions.setMarkerAt(-73, 7);
      CC.save.autosave("mission 2 started");
    });
  }

  // ---------- the kit at the grocery ----------
  function buildKitDisplay(sc) {
    var cx = 1360, cz = 0; // grocery room center
    kitDisplay = new THREE.Group(); sc.add(kitDisplay);
    var ped = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 1),
      new THREE.MeshLambertMaterial({ color: 0xffe08a }));
    ped.position.set(cx - 4, 0.45, cz + 5.2); kitDisplay.add(ped);
    var jug = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 10),
      new THREE.MeshLambertMaterial({ color: 0xf7e26b }));
    jug.position.set(cx - 4, 1.15, cz + 5.2); kitDisplay.add(jug);
    var lb = new THREE.Mesh(new THREE.PlaneGeometry(2, 1),
      new THREE.MeshBasicMaterial({ map: CC.world.textTex(["Lemonade Kit", "10 coins, makes 10 cups"], 256, 128, "#fff8eb", "#22333b", 30) }));
    lb.position.set(cx - 4, 2, cz + 5.2); lb.rotation.y = Math.PI; kitDisplay.add(lb);

    CC.interact.add("grocery", {
      id: "m2kit", x: cx - 4, z: cz + 5.2, r: 1.8,
      label: "Look at the Lemonade Kit (10 coins)",
      when: function () { return st().m2 === 1; },
      action: function () { CC.ui.panel(kitHTML()); }
    });
  }
  function kitHTML() {
    var canAfford = CC.state.cash >= KIT_COST;
    var h = "<h2>Lemonade Kit</h2>" +
      "<p style='font-size:20px'><b style='color:#1c7d32'>" + KIT_COST + " coins</b></p>" +
      "<p>Lemons, sugar, cups and a pitcher. Makes " + CUPS + " cups. Everything a first business needs.</p>";
    if (canAfford) {
      h += "<p>You have <b>" + CC.state.cash + "</b> coins.</p>" +
        "<div class='panelBtns'>" +
        "<button class='btn gold' onclick='CC.m2.buyKit(false)'>Buy for " + KIT_COST + " coins</button>" +
        "<button class='btn ghost' onclick='CC.ui.closePanel()'>Not now</button></div>";
    } else {
      h += "<p>You only have <b>" + CC.state.cash + "</b> coins. Nia left a note:</p>" +
        "<p><em>\"Short on coins? Take a kit now and pay me " + LOAN_REPAY + " from your earnings. Borrowing costs a little extra, that is how lending works.\"</em></p>" +
        "<div class='panelBtns'>" +
        "<button class='btn gold' onclick='CC.m2.buyKit(true)'>Borrow the kit (repay " + LOAN_REPAY + ")</button>" +
        "<button class='btn ghost' onclick='CC.ui.closePanel()'>Not now</button></div>";
    }
    return h;
  }
  function buyKit(borrowed) {
    if (st().m2 !== 1) return;
    if (borrowed) {
      m2().loan = true;
      CC.concept("borrowingCosts");
      CC.ui.toast("You borrowed the kit. Repay Nia " + LOAN_REPAY + " coins from your earnings.", "info");
    } else {
      if (CC.state.cash < KIT_COST) return;
      CC.state.cash -= KIT_COST;
      CC.state.tx.push({ day: CC.state.day, amt: -KIT_COST, label: "Lemonade kit", kind: "business" });
      CC.state.stats.spent += KIT_COST;
      CC.audio.sfx("spend");
    }
    m2().kit = true;
    st().m2 = 2;
    CC.ui.closePanel();
    CC.ui.updateHUD();
    CC.ui.tracker("First Profit", "Set up your lemonade stand by the plaza fountain.");
    CC.missions.setMarkerAt(STAND.x, STAND.z, 5);
    CC.ui.hint("m2plaza", "Head to the plaza fountain and press E at the marker to set up your stand.", 8);
    CC.save.autosave("got the kit");
  }

  // ---------- the stand ----------
  function buildStand() {
    if (stand) return;
    stand = new THREE.Group(); scene.add(stand);
    function bx(w, h, d, c, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color: c }));
      m.position.set(x, y, z); m.castShadow = true; stand.add(m); return m;
    }
    bx(2.6, 1, 1, 0xf7d26b, STAND.x, 0.5, STAND.z);                 // counter
    bx(0.12, 2.3, 0.12, 0x8a6642, STAND.x - 1.2, 1.15, STAND.z);    // posts
    bx(0.12, 2.3, 0.12, 0x8a6642, STAND.x + 1.2, 1.15, STAND.z);
    var roof = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4),
      new THREE.MeshLambertMaterial({ map: CC.world.textTex([""], 128, 64, "#d94f6a", "#fff", 10, "stripe"), side: THREE.DoubleSide }));
    roof.position.set(STAND.x, 2.5, STAND.z); roof.rotation.x = -0.35; stand.add(roof);
    var jug = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.45, 10),
      new THREE.MeshLambertMaterial({ color: 0xf7e26b }));
    jug.position.set(STAND.x - 0.7, 1.25, STAND.z); stand.add(jug);
    for (var i = 0; i < 3; i++) {
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.16, 8),
        new THREE.MeshLambertMaterial({ color: 0xfff4e0 }));
      cup.position.set(STAND.x + 0.3 + i * 0.25, 1.1, STAND.z); stand.add(cup);
    }
    standSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.8), new THREE.MeshBasicMaterial({ map: signTex() }));
    standSign.position.set(STAND.x, 1.9, STAND.z + 0.1); stand.add(standSign);
    CC.world.addCollider(STAND.x - 1.4, STAND.z - 0.6, STAND.x + 1.4, STAND.z + 0.6);
  }
  function signTex() {
    var price = m2().price;
    return CC.world.textTex(price ? ["LEMONADE", price + " coins a cup"] : ["LEMONADE"],
      256, 90, "#fff8eb", "#c4485f", 34);
  }
  function refreshSign() {
    if (standSign) { standSign.material.map = signTex(); standSign.material.needsUpdate = true; }
  }

  function registerStandInteracts() {
    // set-up spot, then stand management
    CC.interact.add("city", {
      id: "m2setup", x: STAND.x, z: STAND.z, r: 2.2,
      label: "Set up your lemonade stand",
      when: function () { return st().m2 === 2; },
      action: function () {
        buildStand();
        st().m2 = 3;
        m2().cups = CUPS; m2().revenue = 0; m2().sold = 0; m2().passed = 0;
        CC.audio.sfx("mission");
        CC.ui.panel(priceHTML());
        CC.save.autosave("stand ready");
      }
    });
    CC.interact.add("city", {
      id: "m2stand", x: STAND.x - 2.2, z: STAND.z + 0.4, r: 1.6,
      label: function () { return "Your stand (" + m2().cups + " cups left)"; },
      when: function () { return st().m2 === 3 && !!m2().price; },
      action: function () { CC.ui.panel(manageHTML()); }
    });
    CC.interact.add("city", {
      id: "m2serve", x: STAND.x, z: STAND.z + 1.6, r: 1.9,
      label: function () { return "Serve lemonade (" + m2().price + " coins)"; },
      when: function () { return st().m2 === 3 && customer && customer.state === "wait"; },
      action: serveCustomer
    });
  }

  // ---------- pricing ----------
  function priceHTML() {
    var h = "<h2>Set your price</h2>" +
      "<p>Your kit cost " + (m2().loan ? LOAN_REPAY + " coins (borrowed)" : KIT_COST + " coins") +
      " and makes " + CUPS + " cups. What will one cup cost?</p>" +
      "<p style='opacity:.75'><em>A higher price earns more per cup, but fewer people will buy. A lower price sells fast, but earns less each time.</em></p>" +
      "<div class='panelBtns' style='justify-content:center'>";
    [2, 3, 4, 5].forEach(function (p) {
      h += "<button class='btn" + (p === 3 ? " gold" : "") + "' onclick='CC.m2.setPrice(" + p + ")'>" + p + " coins</button>";
    });
    h += "</div>";
    return h;
  }
  function setPrice(p) {
    m2().price = p;
    refreshSign();
    CC.ui.closePanel();
    CC.ui.tracker("First Profit", "Sell lemonade! Press E when a customer is waiting. Cups left: " + m2().cups);
    CC.missions.setMarker(false);
    CC.audio.sfx("ui");
    CC.concept("priceAndDemand");
    CC.save.autosave("price set");
  }
  function manageHTML() {
    var d = m2();
    return "<h2>Your stand</h2>" +
      "<div class='rowline'><span>Price per cup</span><b>" + d.price + " coins</b></div>" +
      "<div class='rowline'><span>Cups left</span><b>" + d.cups + "</b></div>" +
      "<div class='rowline'><span>Sold so far</span><b>" + d.sold + "</b></div>" +
      "<div class='rowline'><span>Revenue so far</span><b class='pos'>" + d.revenue + " coins</b></div>" +
      "<div class='panelBtns'>" +
      "<button class='btn ghost' onclick='CC.m2.closeStand()'>Close the stand for today</button>" +
      "<button class='btn' onclick='CC.ui.closePanel()'>Keep selling</button></div>";
  }

  // ---------- customers ----------
  var LINES_BUY = ["One please!", "Ooh, lemonade!", "Just what I needed.", "Yes please!"];
  var LINES_PASS = ["A bit pricey for me today.", "Maybe next time.", "Hmm, I will pass, thanks."];
  function spawnCustomer() {
    var look = {
      skin: (Math.random() * CC.SKINS.length) | 0, hair: (Math.random() * 5) | 0,
      hairC: (Math.random() * CC.HAIRC.length) | 0, top: (Math.random() * CC.CLOTH.length) | 0,
      jacket: (Math.random() * CC.CLOTH.length) | 0, pants: (Math.random() * CC.CLOTH.length) | 0,
      shoes: (Math.random() * CC.CLOTH.length) | 0, acc: 0, pack: -1
    };
    var rig = CC.chars.make(look);
    var side = Math.random() < 0.5 ? 1 : -1;
    rig.group.position.set(STAND.x + side * 16, 0, -9);
    scene.add(rig.group);
    customer = { rig: rig, state: "approach", t: 0 };
  }
  function serveCustomer() {
    var d = m2();
    var chance = BUY_CHANCE[d.price] || 0.6;
    if (Math.random() < chance) {
      d.cups--; d.sold++; d.revenue += d.price;
      CC.state.cash += d.price;
      CC.state.stats.earned += d.price;
      CC.audio.sfx("coin");
      CC.ui.toast("\u201c" + LINES_BUY[(Math.random() * LINES_BUY.length) | 0] + "\u201d  +" + d.price + " coins", "info");
    } else {
      d.passed++;
      CC.audio.sfx("uiBack");
      CC.ui.toast("\u201c" + LINES_PASS[(Math.random() * LINES_PASS.length) | 0] + "\u201d", "bad");
    }
    CC.state.minutes = Math.min(1439, CC.state.minutes + 3);
    CC.ui.updateHUD();
    CC.ui.tracker("First Profit", "Sell lemonade! Press E when a customer is waiting. Cups left: " + d.cups);
    customer.state = "leave";
    if (d.cups <= 0) finish(false);
    else CC.save.autosave();
  }
  function closeStand() {
    CC.ui.closePanel();
    finish(true);
  }
  function updateCustomers(dt) {
    if (st().m2 !== 3 || !m2().price || CC.paused) return;
    if (!customer) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) { spawnCustomer(); spawnTimer = 1.2 + Math.random() * 1.2; }
      return;
    }
    var g = customer.rig.group;
    if (customer.state === "approach") {
      var tx = STAND.x, tz = STAND.z + 1.5;
      var dx = tx - g.position.x, dz = tz - g.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.25) {
        customer.state = "wait"; customer.t = 0;
        g.rotation.y = Math.atan2(STAND.x - g.position.x, STAND.z - g.position.z);
      } else {
        g.position.x += dx / dist * 1.7 * dt;
        g.position.z += dz / dist * 1.7 * dt;
        g.rotation.y = Math.atan2(dx, dz);
        CC.chars.animate(customer.rig, 0.5, dt);
      }
    } else if (customer.state === "wait") {
      customer.t += dt;
      CC.chars.animate(customer.rig, 0, dt);
      if (customer.t > 14) { // patient, but not forever
        CC.ui.toast("The customer wandered off. Serve them a little faster!", "bad");
        customer.state = "leave";
      }
    } else if (customer.state === "leave") {
      var lx = STAND.x + 18, lz = -8;
      var dx2 = lx - g.position.x, dz2 = lz - g.position.z;
      var dd = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (dd < 1) {
        scene.remove(g); customer = null; spawnTimer = 0.8;
      } else {
        g.position.x += dx2 / dd * 1.9 * dt;
        g.position.z += dz2 / dd * 1.9 * dt;
        g.rotation.y = Math.atan2(dx2, dz2);
        CC.chars.animate(customer.rig, 0.55, dt);
      }
    }
  }

  // ---------- finish and summary ----------
  function finish(closedEarly) {
    st().m2 = 4;
    if (customer) { scene.remove(customer.rig.group); customer = null; }
    var d = m2();
    var repaid = 0, forgiven = 0;
    if (d.loan) {
      repaid = Math.min(LOAN_REPAY, CC.state.cash);
      CC.state.cash -= repaid;
      forgiven = LOAN_REPAY - repaid;
      if (repaid > 0) CC.state.tx.push({ day: CC.state.day, amt: -repaid, label: "Repaid Nia", kind: "loan" });
    }
    d.result = { closedEarly: closedEarly, repaid: repaid, forgiven: forgiven };
    CC.ui.tracker(null);
    CC.concept("revenueAndProfit"); CC.concept("earning");
    CC.audio.sfx("mission");
    CC.ui.updateHUD();
    CC.ui.panel(summaryHTML());
    CC.save.autosave("mission 2 complete");
  }
  function summaryHTML() {
    var d = m2(), r = d.result;
    var cost = d.loan ? r.repaid + r.forgiven : KIT_COST;
    var profit = d.revenue - cost;
    var lesson;
    if (d.sold === 0) {
      lesson = "No sales this time, so the kit cost more than you earned. Every business owner has a day like this. Try a friendlier price and give it another go.";
    } else if (profit > 0 && d.price >= 4 && d.passed >= d.sold) {
      lesson = "You made a profit, but plenty of customers walked away at that price. Sometimes a slightly lower price sells so many more cups that you earn more overall.";
    } else if (profit > 0 && d.price <= 2) {
      lesson = "Cheap cups sold fast! You still made a profit, but notice how hard you worked for it. A slightly higher price can earn the same with less running around.";
    } else if (profit > 0) {
      lesson = "Revenue is what came in. Profit is what is left after paying for the kit. You priced it well and came out ahead. That is how a business grows.";
    } else {
      lesson = "You earned some revenue, but after paying for the kit there was no profit left. Costs matter just as much as sales.";
    }
    var h = "<h2 style='text-align:center'>YOUR FIRST PROFIT</h2>" +
      "<div class='rowline'><span>Cups sold</span><b>" + d.sold + " of " + CUPS + "</b></div>" +
      "<div class='rowline'><span>Price per cup</span><b>" + d.price + " coins</b></div>" +
      "<div class='rowline'><span>Revenue</span><b class='pos'>" + d.revenue + " coins</b></div>" +
      "<div class='rowline'><span>" + (d.loan ? "Repaid Nia" : "Kit cost") + "</span><b class='neg'>" + (d.loan ? r.repaid : KIT_COST) + " coins</b></div>";
    if (r.forgiven > 0) {
      h += "<div class='rowline'><span>Nia forgave</span><b>" + r.forgiven + " coins</b></div>" +
        "<p style='opacity:.8'><em>\"Pay me in smiles this time. But remember, borrowed coins always want to go home.\"</em></p>";
    }
    h += "<div class='rowline'><span>Profit</span><b class='" + (profit >= 0 ? "pos" : "neg") + "'>" + profit + " coins</b></div>" +
      "<p style='margin-top:12px'>" + lesson + "</p>" +
      "<div class='panelBtns'>" +
      "<button class='btn ghost' onclick='CC.m2.replay()'>Run the stand again</button>" +
      "<button class='btn' onclick='CC.ui.closePanel()'>Keep exploring</button></div>";
    return h;
  }
  function replay() {
    var d = m2();
    d.kit = false; d.price = 0; d.cups = 0; d.revenue = 0; d.sold = 0; d.passed = 0;
    d.loan = false; d.result = null;
    st().m2 = 1;
    if (stand) { scene.remove(stand); stand = null; standSign = null; }
    CC.ui.closePanel();
    CC.ui.tracker("First Profit", "Get a lemonade kit at Budget Basket Market (10 coins).");
    CC.missions.setMarkerAt(-73, 7);
    CC.audio.sfx("mission");
    CC.save.autosave("mission 2 replay");
  }

  // ---------- restore after loading ----------
  function restore() {
    var s = st().m2;
    if (!s) {
      if (st().m1 === 2) startSoon();
      return;
    }
    if (s === 1) {
      CC.ui.tracker("First Profit", "Get a lemonade kit at Budget Basket Market (10 coins).");
      CC.missions.setMarkerAt(-73, 7);
    } else if (s === 2) {
      CC.ui.tracker("First Profit", "Set up your lemonade stand by the plaza fountain.");
      CC.missions.setMarkerAt(STAND.x, STAND.z, 5);
    } else if (s === 3) {
      buildStand(); refreshSign();
      if (m2().price) {
        CC.ui.tracker("First Profit", "Sell lemonade! Press E when a customer is waiting. Cups left: " + m2().cups);
        CC.missions.setMarker(false);
      } else {
        CC.ui.panel(priceHTML());
      }
    }
    // stage 4: nothing to rebuild, the summary was already shown
  }

  function update(dt) {
    updateCustomers(dt);
  }

  function init(sc) {
    scene = sc;
    buildKitDisplay(sc);
    registerStandInteracts();
  }

  return {
    init: init, update: update, startSoon: startSoon, restore: restore,
    buyKit: buyKit, setPrice: setPrice, closeStand: closeStand, replay: replay,
    debugCustomer: function () { return customer; }
  };
})();
