// Save system. Three manual slots plus an autosave slot in localStorage.
// Saves are plain JSON of CC.state plus player position and zone. Loading is
// applied by CC.main.applySave so world visuals can rebuild correctly.
CC.save = (function () {
  var KEY = "coincity_slot_", SKEY = "coincity_settings";

  function snapshot() {
    var s = JSON.parse(JSON.stringify(CC.state));
    s._pos = { x: CC.player.pos.x, z: CC.player.pos.z, zone: CC.zone };
    s._when = { day: CC.state.day, clock: CC.clockText() };
    s._stamp = Date.now();
    return s;
  }
  function write(slot, data) {
    try { localStorage.setItem(KEY + slot, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  function read(slot) {
    try {
      var raw = localStorage.getItem(KEY + slot);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  return {
    save: function (slot) {
      var ok = write(slot, snapshot());
      if (ok && CC.ui) CC.ui.toast("Game saved", "info");
      return ok;
    },
    autosave: function (reason) {
      if (!CC.state || CC.cineActive) return;
      write("auto", snapshot());
      if (CC.ui && reason) CC.ui.toast("Autosaved: " + reason, "info");
    },
    read: read,
    del: function (slot) { localStorage.removeItem(KEY + slot); },
    // slot summary for the load menu
    info: function (slot) {
      var d = read(slot);
      if (!d) return null;
      return {
        name: d.name, day: d.day, clock: d._when ? d._when.clock : "",
        cash: d.cash, savings: d.savings,
        missions: d.missions && d.missions.done ? d.missions.done.length : 0,
        stamp: d._stamp || 0
      };
    },
    anyExists: function () {
      return !!(read("auto") || read(0) || read(1) || read(2));
    },
    saveSettings: function () {
      try { localStorage.setItem(SKEY, JSON.stringify(CC.settings)); } catch (e) {}
    },
    loadSettings: function () {
      try {
        var raw = localStorage.getItem(SKEY);
        if (raw) {
          var s = JSON.parse(raw), def = CC.defaultSettings();
          for (var k in def) if (s[k] === undefined) s[k] = def[k];
          CC.settings = s;
        }
      } catch (e) {}
    }
  };
})();
