// Procedural audio. Everything is synthesized with WebAudio so the game has
// zero external sound files and works offline. Music is a soft generative
// pattern that changes with time of day and story mood.
CC.audio = (function () {
  var ctx = null, master, musicGain, sfxGain, rainNode = null, rainGain = null;
  var mode = "none", pattern = null, step = 0, nextNote = 0;

  // Scales per mood: gentle major day, warm evening, mysterious night
  var SCALES = {
    menu:    [262, 330, 392, 440, 523, 587],
    day:     [262, 294, 330, 392, 440, 523],
    evening: [247, 294, 330, 370, 440, 494],
    night:   [220, 262, 311, 330, 415, 440],
    event:   [262, 330, 392, 523, 587, 659],
    glitch:  [233, 247, 466, 494]
  };
  var TEMPO = { menu: 0.5, day: 0.42, evening: 0.55, night: 0.7, event: 0.32, glitch: 0.22 };

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.connect(master);
      applyVolumes();
      return true;
    } catch (e) { return false; }
  }
  function applyVolumes() {
    if (!ctx) return;
    master.gain.value = CC.settings.volMaster;
    musicGain.gain.value = CC.settings.volMusic * 0.5;
    sfxGain.gain.value = CC.settings.volSfx;
  }
  function resume() { if (ctx && ctx.state === "suspended") ctx.resume(); }

  // One synthesized voice
  function tone(freq, dur, type, vol, dest, bend) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * bend), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.05);
  }
  function noise(dur, vol, filterHz) {
    if (!ctx) return;
    var len = ctx.sampleRate * dur, buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ctx.createBufferSource(); s.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterHz || 1200;
    var g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
  }

  var SFX = {
    ui:        function () { tone(660, 0.07, "square", 0.08); },
    uiBack:    function () { tone(440, 0.08, "square", 0.07); },
    coin:      function () { tone(880, 0.09, "square", 0.12); setTimeout(function () { tone(1320, 0.12, "square", 0.12); }, 70); },
    spend:     function () { tone(520, 0.1, "triangle", 0.12, null, 0.7); },
    saveUp:    function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.16, "triangle", 0.11); }, i * 90); }); },
    debt:      function () { tone(180, 0.35, "sawtooth", 0.08, null, 0.8); },
    mission:   function () { [392, 523, 659, 784].forEach(function (f, i) { setTimeout(function () { tone(f, 0.2, "triangle", 0.13); }, i * 110); }); },
    step:      function () { noise(0.05, 0.05, 900); },
    stepGrass: function () { noise(0.06, 0.04, 500); },
    door:      function () { tone(200, 0.12, "sine", 0.1, null, 0.75); noise(0.09, 0.05, 600); },
    bell:      function () { tone(1400, 0.4, "sine", 0.09); tone(1760, 0.5, "sine", 0.05); },
    bike:      function () { tone(1200, 0.08, "square", 0.08); setTimeout(function () { tone(1200, 0.08, "square", 0.08); }, 110); },
    bus:       function () { tone(90, 0.8, "sawtooth", 0.06, null, 1.4); noise(0.6, 0.05, 300); },
    glitch:    function () {
      for (var i = 0; i < 6; i++) (function (i) {
        setTimeout(function () { tone(200 + Math.random() * 900, 0.06, "sawtooth", 0.09); }, i * 55);
      })(i);
      noise(0.35, 0.09, 3000);
    },
    pop:       function () { tone(300, 0.06, "sine", 0.12, null, 2.2); },
    error:     function () { tone(200, 0.18, "square", 0.09); setTimeout(function () { tone(160, 0.22, "square", 0.09); }, 140); },
    sizzle:    function () { noise(0.4, 0.05, 2400); },
    party:     function () { [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { setTimeout(function () { tone(f, 0.18, "triangle", 0.12); }, i * 95); }); }
  };

  // Generative background music, quiet arpeggios plus a slow bass
  function musicTick() {
    if (!ctx || mode === "none") return;
    var t = ctx.currentTime;
    if (t < nextNote) return;
    var sc = SCALES[mode] || SCALES.day;
    var tempo = TEMPO[mode] || 0.45;
    nextNote = t + tempo;
    step++;
    var n = sc[(step * 3 + ((step / 4) | 0)) % sc.length];
    tone(n, tempo * 1.6, mode === "night" || mode === "glitch" ? "triangle" : "sine", 0.05, musicGain);
    if (step % 4 === 0) tone(sc[0] / 2, tempo * 3.2, "sine", 0.05, musicGain);
    if (step % 8 === 2 && mode === "event") tone(sc[3], tempo * 1.2, "triangle", 0.05, musicGain);
  }

  function setMode(m) {
    if (m === mode) return;
    mode = m; step = 0;
  }

  function setRain(on) {
    if (!ctx) return;
    if (on && !rainNode) {
      var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      rainNode = ctx.createBufferSource(); rainNode.buffer = buf; rainNode.loop = true;
      var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.4;
      rainGain = ctx.createGain(); rainGain.gain.value = 0.05;
      rainNode.connect(f); f.connect(rainGain); rainGain.connect(master);
      rainNode.start();
    } else if (!on && rainNode) {
      try { rainNode.stop(); } catch (e) {}
      rainNode = null; rainGain = null;
    }
  }

  return {
    ensure: ensure, resume: resume, applyVolumes: applyVolumes,
    sfx: function (name) { if (ensure() && SFX[name]) SFX[name](); },
    music: setMode,
    rain: setRain,
    update: function () { if (ctx) musicTick(); }
  };
})();
