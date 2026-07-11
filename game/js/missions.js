// Mission 1: FIRST BUDGET. Teaches needs versus wants, basic budgeting,
// opportunity cost, and keeping money for later, entirely through walking to
// the general store, inspecting real products, filling a basket and checking
// out. Includes a small reusable dialogue player, the mission marker, the
// store cashier, an adaptive end summary, replay, and save restoration.
CC.missions = (function () {
  var scene = null;
  var marker = null, ring = null, markerT = 0, markerOn = false;
  var cashier = null;

  // ---------- product catalog ----------
  // hint stays gentle so the player still has to think; need/want is only
  // revealed on the summary screen.
  var PRODUCTS = {
    lunch:    { name: "Packed Lunch", price: 8, need: true,  hint: "Needed for school.",
                desc: "A sandwich, fruit and juice to get you through the school day." },
    notebook: { name: "Notebook", price: 6, need: true, hint: "Needed for school.",
                desc: "Lined pages for classes, lists and big plans." },
    buspass:  { name: "Bus Pass", price: 12, need: true, hint: "Required for transportation.",
                desc: "A week of rides anywhere in Budget Bay." },
    candy:    { name: "Candy Mix", price: 3, need: false, hint: "Fun, but optional.",
                desc: "Sweet, colorful, and gone in about five minutes." },
    headphones: { name: "Headphones", price: 18, need: false, hint: "Nice to have.",
                desc: "Crisp sound for music and videos." },
    shoes:    { name: "New Shoes", price: 22, need: false, hint: "Nice to have.",
                desc: "The fresh pair everyone at school is talking about." },
    game:     { name: "Video Game", price: 20, need: false, hint: "Fun, but optional.",
                desc: "The new adventure everyone is playing this month." },
    toy:      { name: "Wind-Up Robot", price: 10, need: false, hint: "Fun, but optional.",
                desc: "A little robot with tiny coin eyes. It walks and beeps." },
    tpack:    { name: "Trendy Backpack", price: 16, need: false, hint: "You already have a backpack.",
                desc: "This season's print. Your current backpack works fine." }
  };
  var ESSENTIALS = ["lunch", "notebook", "buspass"];

  // ---------- tiny dialogue player (reusable by later missions) ----------
  var dlgQ = [], dlgDone = null, dlgOpen = false;
  function say(lines, done) {
    dlgQ = lines.slice(); dlgDone = done || null;
    dlgOpen = true; CC.paused = true; CC.input.unlock();
    CC.ui.show("dlg");
    advance();
  }
  function advance() {
    if (dlgQ.length === 0) {
      dlgOpen = false; CC.ui.hide("dlg"); CC.paused = false;
      var d = dlgDone; dlgDone = null; if (d) d();
      return;
    }
    var L = dlgQ.shift();
    var who = CC.chars.CAST[L.who] || { name: "???", badge: "?", col: "#2fa5a9" };
    CC.ui.el("dlgName").textContent = who.name;
    CC.ui.el("dlgFace").textContent = who.badge;
    CC.ui.el("dlgPortrait").style.background = who.col;
    CC.ui.el("dlgText").textContent = L.text;
    CC.ui.el("dlgChoices").innerHTML = "";
    CC.audio.sfx("pop");
  }
  document.addEventListener("DOMContentLoaded", function () {
    CC.ui.el("dlg").addEventListener("click", function () { if (dlgOpen) advance(); });
  });

  // ---------- mission state helpers ----------
  function st() { return CC.state.missions.stage; }
  function flags() { return CC.state.flags; }
  function basket() { return flags().m1Basket || (flags().m1Basket = []); }
  function owned() { return flags().m1Owned || (flags().m1Owned = {}); }
  function basketTotal() {
    return basket().reduce(function (t, id) { return t + PRODUCTS[id].price; }, 0);
  }
  function essentialsOwned() {
    return ESSENTIALS.every(function (id) { return owned()[id]; });
  }
  function missingEssentials() {
    return ESSENTIALS.filter(function (id) { return !owned()[id] && basket().indexOf(id) < 0; })
      .map(function (id) { return PRODUCTS[id].name; });
  }

  // ---------- mission marker ----------
  var markerY = 8.6;
  function buildMarker(sc) {
    marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.55),
      new THREE.MeshLambertMaterial({ color: 0xffc94d, emissive: 0x996600 }));
    sc.add(marker);
    ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0x2fa5a9 }));
    ring.rotation.x = -Math.PI / 2;
    sc.add(ring);
    setMarker(false);
  }
  // The one shared mission marker; missions move it where the player should go
  function setMarkerAt(x, z, y) {
    markerY = y || 8.6;
    marker.position.set(x, markerY, z);
    ring.position.set(x, 0.07, z - 0.8);
    setMarker(true);
  }
  function setMarker(on) {
    markerOn = on;
    if (marker) marker.visible = on;
    if (ring) ring.visible = on;
  }

  // ---------- the store cashier ----------
  function buildCashier(sc) {
    cashier = CC.chars.make({ skin: 2, hair: 2, hairC: 2, top: 3, jacket: 3, pants: 7, shoes: 8, acc: 0, pack: -1, apron: 0x5a3a7a });
    cashier.group.position.set(1724, 0, 4.2);
    cashier.group.rotation.y = Math.PI; // faces the counter and the door
    cashier.group.add(CC.chars.nameSprite("Sam, Cashier", "#d9b3ff"));
    sc.add(cashier.group);
  }

  // ---------- mission flow ----------
  function startSoon() {
    if (st().m1) return;
    setTimeout(startIntro, 1400);
  }
  function startIntro() {
    if (st().m1) return;
    say([
      { who: "ledger", text: "Morning! Big first day in Budget Bay. Every good plan starts with a simple one." },
      { who: "ledger", text: "Here are 40 coins. You will need three things today: a packed lunch, a notebook, and a bus pass." },
      { who: "ledger", text: "The general store, Thread and Things, has all of it. Follow the gold marker down the street." },
      { who: "ledger", text: "One more thing. You do not have to spend it all. Coins you keep today are choices you keep for tomorrow." }
    ], function () {
      st().m1 = 1;
      CC.state.cash = 40;
      CC.audio.sfx("coin");
      CC.ui.updateHUD();
      CC.ui.banner("MISSION 1", "FIRST BUDGET");
      CC.audio.sfx("mission");
      CC.ui.tracker("First Budget", "Buy the essentials while staying within your 40-coin budget: lunch, notebook, bus pass.");
      setMarkerAt(48, 7);
      CC.ui.hint("m1go", "Face the street and head right. Look for the bobbing gold marker above Thread + Things.", 9);
      CC.save.autosave("mission started");
    });
  }

  // ---------- shopping ----------
  function inspectHTML(id) {
    var p = PRODUCTS[id];
    var inB = basket().indexOf(id) >= 0;
    var isOwned = !!owned()[id];
    var total = basketTotal();
    var afterThis = CC.state.cash - total - (inB || isOwned ? 0 : p.price);
    var h = "<h2>" + p.name + "</h2>" +
      "<p style='font-size:20px'><b style='color:#1c7d32'>" + p.price + " coins</b></p>" +
      "<p>" + p.desc + "</p>" +
      "<p style='opacity:.75'><em>" + p.hint + "</em></p>";
    if (isOwned) {
      h += "<p><b>You already bought this today.</b></p>" +
        "<div class='panelBtns'><button class='btn ghost' onclick='CC.m1.closeP()'>Close</button></div>";
      return h;
    }
    if (inB) {
      h += "<p>In your basket. Basket total: <b>" + total + "</b> coins.</p>" +
        "<div class='panelBtns'>" +
        "<button class='btn coral' onclick='CC.m1.removeB(\"" + id + "\")'>Remove from basket</button>" +
        "<button class='btn ghost' onclick='CC.m1.closeP()'>Close</button></div>";
    } else {
      h += "<p>If you add this, you would have <b>" + Math.max(0, afterThis) + "</b> coins left after your basket.</p>" +
        "<div class='panelBtns'>" +
        "<button class='btn' onclick='CC.m1.addB(\"" + id + "\")'>Add to basket</button>" +
        "<button class='btn ghost' onclick='CC.m1.closeP()'>Close</button></div>";
    }
    return h;
  }
  function addB(id) {
    var p = PRODUCTS[id];
    if (basketTotal() + p.price > CC.state.cash) {
      CC.audio.sfx("error");
      CC.ui.toast("That would cost more coins than you have. Remove something first.", "bad");
      return;
    }
    basket().push(id);
    CC.audio.sfx("pop");
    CC.ui.toast(p.name + " added. Basket: " + basketTotal() + " coins.", "info");
    CC.ui.panel(inspectHTML(id));
    refreshChip();
  }
  function removeB(id) {
    var i = basket().indexOf(id);
    if (i >= 0) basket().splice(i, 1);
    CC.audio.sfx("uiBack");
    CC.ui.panel(inspectHTML(id));
    refreshChip();
  }
  function refreshChip() {
    if (CC.zone === "store" && basket().length > 0) {
      CC.ui.basketChip("Basket " + basket().length + " items, " + basketTotal() +
        " coins. You have " + CC.state.cash + ", so " + (CC.state.cash - basketTotal()) + " left after.");
    } else CC.ui.basketChip(null);
  }

  // ---------- checkout ----------
  function checkoutHTML() {
    var b = basket();
    var h = "<h2>Checkout</h2>";
    var miss = missingEssentials();
    if (b.length === 0) {
      h += "<p>\"Hi there! Your basket is empty. Take a look around, the essentials are on the left wall.\"</p>";
      if (miss.length) h += "<p style='opacity:.8'>Still needed: <b>" + miss.join(", ") + "</b>.</p>";
      h += "<div class='panelBtns'><button class='btn ghost' onclick='CC.m1.closeP()'>Keep shopping</button></div>";
      return h;
    }
    h += "<p>\"Let's see what you found!\"</p>";
    b.forEach(function (id) {
      var p = PRODUCTS[id];
      h += "<div class='rowline'><span>" + p.name + "</span><span><b>" + p.price + "</b> " +
        "<button class='btn small ghost' onclick='CC.m1.removeAtCheckout(\"" + id + "\")'>Remove</button></span></div>";
    });
    var total = basketTotal(), left = CC.state.cash - total;
    h += "<div class='bigTotal'>Total: " + total + " coins</div>" +
      "<p>You have <b>" + CC.state.cash + "</b> coins. After paying you would have <b>" + left + "</b> left.</p>";
    if (miss.length) h += "<p style='opacity:.85'>\"Just a heads up, you still need: <b>" + miss.join(", ") + "</b>.\"</p>";
    h += "<div class='panelBtns'>" +
      "<button class='btn gold' onclick='CC.m1.pay()'>Pay " + total + " coins</button>" +
      "<button class='btn ghost' onclick='CC.m1.closeP()'>Keep shopping</button></div>";
    return h;
  }
  function removeAtCheckout(id) {
    var i = basket().indexOf(id);
    if (i >= 0) basket().splice(i, 1);
    CC.audio.sfx("uiBack");
    CC.ui.panel(checkoutHTML());
    refreshChip();
  }
  var paying = false;
  function pay() {
    if (paying) return; // a purchase can never charge twice
    var total = basketTotal();
    if (total <= 0) return;
    if (total > CC.state.cash) {
      CC.audio.sfx("error");
      CC.ui.toast("Not enough coins for this basket.", "bad");
      return;
    }
    paying = true;
    CC.state.cash -= total;
    var boughtNow = basket().slice();
    boughtNow.forEach(function (id) {
      owned()[id] = true;
      CC.state.inv[id] = (CC.state.inv[id] || 0) + 1;
    });
    CC.state.tx.push({ day: CC.state.day, amt: -total, label: "Thread + Things", kind: "shopping" });
    CC.state.stats.spent += total;
    flags().m1Basket = [];
    CC.audio.sfx("coin"); CC.audio.sfx("bell");
    CC.ui.updateHUD(); refreshChip();
    CC.concept("budgeting"); CC.concept("needsAndWants");
    CC.save.autosave("purchase");
    paying = false;
    if (st().m1 === 1 && essentialsOwned()) {
      completeMission();
    } else {
      var miss = missingEssentials();
      CC.ui.panel("<h2>Thank you!</h2><p>\"All packed up. Come back any time.\"</p>" +
        (miss.length ? "<p>\"Don't forget, you still need: <b>" + miss.join(", ") + "</b>.\"</p>" : "") +
        "<div class='panelBtns'><button class='btn' onclick='CC.m1.closeP()'>Done</button></div>");
    }
  }

  // ---------- completion and adaptive summary ----------
  function completeMission() {
    st().m1 = 2;
    setMarker(false);
    CC.ui.tracker(null);
    CC.concept("opportunityCost"); CC.concept("keepingMoneyForLater");
    var wants = Object.keys(owned()).filter(function (id) { return !PRODUCTS[id].need; });
    var spent = 40 - CC.state.cash;
    flags().m1Result = { spent: spent, left: CC.state.cash, wants: wants };
    CC.audio.sfx("mission");
    CC.ui.panel(summaryHTML());
    CC.save.autosave("mission complete");
  }
  function lessonText(left, wants) {
    if (wants.length === 0 && left >= 10) {
      return "You bought what you needed and kept " + left + " coins for later. Money you keep gives you choices tomorrow. And when the needs are covered, treating yourself now and then is fine too.";
    }
    if (wants.length === 1 && left > 3) {
      return "You covered your essentials and still had room for something fun. That is what a balanced budget looks like: needs first, then a want you can truly afford.";
    }
    if (left <= 3) {
      return "You covered your needs, but your budget has little room for surprises now. Next time, try keeping a few coins spare, just in case the day does not go as planned.";
    }
    return "You covered everything and enjoyed some extras, with coins to spare. Just watch that the extras never crowd out tomorrow's needs.";
  }
  function summaryHTML() {
    var r = flags().m1Result;
    var needNames = ESSENTIALS.map(function (id) { return PRODUCTS[id].name; }).join(", ");
    var wantNames = r.wants.length ? r.wants.map(function (id) { return PRODUCTS[id].name; }).join(", ") : "none";
    return "<h2 style='text-align:center'>YOUR FIRST BUDGET</h2>" +
      "<div class='rowline'><span>Starting money</span><b>40 coins</b></div>" +
      "<div class='rowline'><span>Total spent</span><b class='neg'>" + r.spent + " coins</b></div>" +
      "<div class='rowline'><span>Money remaining</span><b class='pos'>" + r.left + " coins</b></div>" +
      "<div class='rowline'><span>Needs purchased</span><b>" + needNames + "</b></div>" +
      "<div class='rowline'><span>Wants purchased</span><b>" + wantNames + "</b></div>" +
      "<div class='rowline'><span>Stayed within budget</span><b>Yes</b></div>" +
      "<p style='margin-top:12px'>" + lessonText(r.left, r.wants) + "</p>" +
      "<div class='panelBtns'>" +
      "<button class='btn ghost' onclick='CC.m1.replay()'>Replay mission</button>" +
      "<button class='btn' onclick='CC.m1.closeP()'>Keep exploring</button></div>";
  }
  function replay() {
    // full reset of mission 1: coins back to 40, shelves restocked
    ESSENTIALS.concat(["candy", "headphones", "shoes", "game", "toy", "tpack"]).forEach(function (id) {
      delete owned()[id];
      delete CC.state.inv[id];
    });
    flags().m1Basket = [];
    flags().m1Result = null;
    st().m1 = 1;
    CC.state.cash = 40;
    CC.ui.closePanel();
    CC.ui.updateHUD();
    CC.ui.tracker("First Budget", "Buy the essentials while staying within your 40-coin budget: lunch, notebook, bus pass.");
    setMarker(true);
    refreshChip();
    CC.audio.sfx("mission");
    CC.ui.toast("Mission restarted. You have 40 coins again.", "info");
    CC.save.autosave("mission replay");
  }

  // ---------- interactables inside the store ----------
  // Display positions must match the interior layout in interiors.js.
  var DISPLAY_AT = {
    lunch: [1713, -4], notebook: [1713, -0.5], buspass: [1713, 3],
    candy: [1716.5, -5.6], toy: [1719, -5.6], game: [1721.5, -5.6], headphones: [1724, -5.6],
    shoes: [1727, -3], tpack: [1727, 0.5]
  };
  function registerShop() {
    for (var id in DISPLAY_AT) (function (id) {
      var p = DISPLAY_AT[id];
      CC.interact.add("store", {
        id: "prod_" + id, x: p[0], z: p[1], r: 1.7,
        label: "Inspect " + PRODUCTS[id].name + " (" + PRODUCTS[id].price + " coins)",
        when: function () { return st().m1 >= 1; },
        action: function () { CC.ui.panel(inspectHTML(id)); }
      });
    })(id);
    CC.interact.add("store", {
      id: "checkout", x: 1724, z: 3.2, r: 2.2,
      label: "Check out",
      when: function () { return st().m1 >= 1; },
      action: function () { CC.ui.panel(checkoutHTML()); }
    });
  }

  // ---------- zone hook and per-frame update ----------
  function onZoneEnter(zone) {
    refreshChip();
    if (zone === "store" && st().m1 === 1 && !flags().m1Entered) {
      flags().m1Entered = true;
      CC.ui.hint("m1shop", "Walk up to a display and press E to inspect it. The checkout is by the counter.", 8);
      CC.save.autosave("entered the store");
    }
  }

  function update(dt) {
    // advance dialogue with E, gamepad A, or Enter
    if (dlgOpen && (CC.input.pressed("KeyE") || CC.input.pressed("Enter") || CC.input.padInteract())) {
      advance();
    }
    // marker bob and spin, ring pulse
    if (markerOn && marker && !CC.settings.reducedMotion) {
      markerT += dt;
      marker.position.y = markerY + Math.sin(markerT * 2.4) * 0.35;
      marker.rotation.y += dt * 1.6;
      var s = 1 + Math.sin(markerT * 3) * 0.12;
      ring.scale.set(s, s, 1);
    }
    // cashier idle animation
    if (cashier && CC.zone === "store") CC.chars.animate(cashier, 0, dt);
  }

  // ---------- restore after loading a save ----------
  function restore() {
    if (CC.m2) CC.m2.restore();
    var s = st().m1;
    if (s === 1) {
      CC.ui.tracker("First Budget", "Buy the essentials while staying within your 40-coin budget: lunch, notebook, bus pass.");
      if (!essentialsOwned()) setMarkerAt(48, 7); else setMarker(false);
    } else {
      if (!s) { CC.ui.tracker(null); setMarker(false); startSoon(); }
    }
    refreshChip();
  }

  function init(sc) {
    scene = sc;
    buildMarker(sc);
    buildCashier(sc);
    registerShop();
    CC.onZoneEnter = onZoneEnter;
  }

  // public API, including the button handlers used by panel HTML
  CC.m1 = {
    addB: addB, removeB: removeB, removeAtCheckout: removeAtCheckout,
    pay: pay, replay: replay,
    closeP: function () {
      CC.ui.closePanel(); refreshChip();
      if (st().m1 === 2 && !st().m2 && CC.m2) CC.m2.startSoon();
    }
  };
  return {
    init: init, update: update, startSoon: startSoon, restore: restore,
    say: say, PRODUCTS: PRODUCTS,
    setMarkerAt: setMarkerAt, setMarker: setMarker
  };
})();
