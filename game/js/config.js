// Coin City core namespace, constants and shared state.
// Every module attaches to window.CC. Nothing runs until CC.main.init().
window.CC = {
  VER: "0.3.0",
  paused: false,          // true while any overlay owns the screen
  zone: "city",           // current zone id, "city" or an interior id
  timeScale: 1,           // 1 real second = 1 game minute at scale 1
  postgame: false
};

// Visual palette shared between 3D world and UI
CC.PAL = {
  teal: 0x2fa5a9, coral: 0xff8a5c, gold: 0xffc94d, mint: 0x9fe2bf,
  cream: 0xfff4e0, ink: 0x22333b, brick: 0xc46a4f, sand: 0xe8d9b8,
  road: 0x3d444c, walk: 0xb9b3a4, grass: 0x7fb56b, water: 0x3f8fa8,
  wood: 0x8a6642, glass: 0xbfe8f0
};

// Character creator palettes. Options are free to combine, never gendered.
CC.SKINS  = [0xf4d3b3, 0xe8b98a, 0xc98d5f, 0xa06a42, 0x7a4a2b, 0x5a3620];
CC.HAIRC  = [0x2b2019, 0x5b3a21, 0x9a6a33, 0xd9b380, 0xb43b3b, 0x3b6fb4, 0x8a4fb4, 0xe8e4da];
CC.CLOTH  = [0x2fa5a9, 0xff8a5c, 0xffc94d, 0x8a4fb4, 0x3b6fb4, 0xd94f6a, 0x4a7d4a, 0x36454f, 0xe8e4da];
CC.HAIRSTYLES = ["Short", "Fluffy", "Ponytail", "Buzz", "Long"];
CC.ACCS = ["None", "Cap", "Glasses"];

// Fresh save state. Everything the save system persists lives here.
CC.defaultState = function () {
  return {
    ver: CC.VER,
    name: "Sky",
    look: { skin: 2, hair: 1, hairC: 0, eyes: 0, top: 0, jacket: 4, pants: 8, shoes: 1, acc: 0, pack: 2 },
    // money
    cash: 25, savings: 0, bankOpen: false,
    goal: { name: "", target: 0 },
    debt: null, // {lender, balance, ratePct, minPay, openedDay, history:[]}
    creditRep: 50,
    // person
    energy: 100, trust: 10, knowledge: 0,
    // world clock
    day: 1, minutes: 8 * 60 + 30, weather: "clear",
    restoration: 8, // 0..100, stage thresholds at 35 and 70
    // progress
    flags: {}, inv: { food: 2, meals: 0, decor: 0, tools: 0, blanket: 0, lamp: 0, kettle: 0, kit: 0, keepsake: 1 },
    rel: { ledger: 0, penny: 0, milo: 0, nia: 0, dex: 0, nova: 0, mint: 0, rusty: 0, carla: 0, greta: 0 },
    missions: { stage: {}, done: [] },   // stage per mission id, -1 means not started
    evidence: [],
    coinsFound: 0,
    bike: { found: false, owned: false, riding: false },
    busPass: false, busStopsFound: ["plaza"],
    jobSkill: { cafe: 0, bakery: 0 }, jobShifts: 0,
    biz: null, // created in business.js when founded
    // ledgers
    tx: [],       // {day, amt, label, kind}
    msgs: [],     // {day, from, text, scam}
    budget: { Food: 30, Transport: 10, Business: 0, Fun: 15, Savings: 20, Other: 0 },
    stats: { earned: 0, spent: 0, deposited: 0, billsPaid: 0, helped: 0, scamsAvoided: 0, concepts: {} },
    // research and assessment (all local, anonymous)
    assess: { pre: null, post: null },
    research: null // {code, log:[{t, ev, data}]}
  };
};
CC.state = null;

// Settings persist separately from saves
CC.defaultSettings = function () {
  return {
    volMaster: 0.8, volMusic: 0.6, volSfx: 0.9,
    textSpeed: 1, textSize: 0, highContrast: false, reducedMotion: false,
    camSens: 1, invertY: false, graphics: "medium", simpleLang: false
  };
};
CC.settings = CC.defaultSettings();

// Time helpers
CC.hour = function () { return Math.floor(CC.state.minutes / 60); };
CC.clockText = function () {
  var h = CC.hour(), m = Math.floor(CC.state.minutes % 60);
  var ap = h < 12 ? "AM" : "PM"; var hh = h % 12; if (hh === 0) hh = 12;
  return hh + ":" + (m < 10 ? "0" : "") + m + " " + ap;
};
CC.phase = function () { // morning, afternoon, evening, night
  var h = CC.hour();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
};

// Math helpers
CC.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
CC.lerp = function (a, b, t) { return a + (b - a) * t; };
CC.lerpColor = function (c1, c2, t) {
  var r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  var r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  return ((r1 + (r2 - r1) * t) << 16) | (((g1 + (g2 - g1) * t) | 0) << 8) | ((b1 + (b2 - b1) * t) | 0);
};
CC.dist2 = function (ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

// Concept tracker: records which financial ideas the player has met, for the
// chapter report. Never interrupts play.
CC.concept = function (key) {
  if (CC.state && !CC.state.stats.concepts[key]) {
    CC.state.stats.concepts[key] = CC.state.day;
    if (CC.research) CC.research.log("concept", key);
  }
};

// Research logging shim, real implementation lives with assessments
CC.research = {
  log: function (ev, data) {
    if (CC.state && CC.state.research) {
      CC.state.research.log.push({ day: CC.state.day, min: CC.state.minutes, ev: ev, data: data });
    }
  }
};

// Interactable registry. main.js scans the active zone every frame.
CC.interact = {
  lists: {},
  add: function (zone, obj) {
    if (!this.lists[zone]) this.lists[zone] = [];
    this.lists[zone].push(obj);
    return obj;
  },
  remove: function (zone, id) {
    var L = this.lists[zone]; if (!L) return;
    for (var i = L.length - 1; i >= 0; i--) if (L[i].id === id) L.splice(i, 1);
  },
  get: function (zone, id) {
    var L = this.lists[zone]; if (!L) return null;
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  }
};
