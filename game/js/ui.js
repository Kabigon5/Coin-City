// UI core. HUD chips, toasts, the interaction prompt, tutorial hints that
// disappear once used, screen fades, story banners and the mission tracker.
// Larger surfaces (phone, panels, menus) are separate modules that use these.
CC.ui = (function () {
  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove("hidden"); }
  function hide(id) { el(id).classList.add("hidden"); }

  function updateHUD() {
    if (!CC.state) return;
    el("chipClock").textContent = "Day " + CC.state.day + ", " + CC.clockText();
    var w = CC.state.weather;
    el("chipWeather").textContent = w === "rain" ? "Rainy" : (w === "cloudy" ? "Cloudy" : "Clear");
    el("chipCash").textContent = CC.state.cash + " coins";
    if (CC.state.bankOpen) {
      show("chipSave");
      el("chipSave").textContent = "Saved " + CC.state.savings;
    } else hide("chipSave");
    if (CC.state.debt && CC.state.debt.balance > 0) {
      show("chipDebt");
      el("chipDebt").textContent = "Debt " + CC.state.debt.balance;
    } else hide("chipDebt");
    el("energyFill").style.width = CC.clamp(CC.state.energy, 0, 100) + "%";
  }

  var toastCount = 0;
  function toast(text, kind) {
    if (!text) return;
    if (toastCount > 4) return; // never flood the screen
    toastCount++;
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = text;
    el("toastWrap").appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2600);
    setTimeout(function () { t.remove(); toastCount--; }, 3200);
  }

  function prompt(html) {
    if (html) { el("prompt").innerHTML = html; show("prompt"); }
    else hide("prompt");
  }

  // Tutorial hints: shown once each, keyed, vanish after their action happens
  var hintsSeen = {};
  var hintTimer = null;
  function hint(key, text, seconds) {
    if (key && hintsSeen[key]) return;
    if (key) hintsSeen[key] = true;
    el("hintBar").textContent = text;
    show("hintBar");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hide("hintBar"); }, (seconds || 6) * 1000);
  }
  function clearHint() { clearTimeout(hintTimer); hide("hintBar"); }

  function tracker(title, obj) {
    if (!title) { hide("tracker"); return; }
    el("trackerTitle").textContent = title;
    el("trackerObj").textContent = obj || "";
    show("tracker");
  }

  function fade(toBlack, cb, ms) {
    var f = el("fade");
    f.style.transitionDuration = (ms || 600) + "ms";
    if (toBlack) f.classList.remove("clear"); else f.classList.add("clear");
    if (cb) setTimeout(cb, (ms || 600) + 30);
  }

  var bannerTimer = null;
  function banner(title, sub, secs) {
    el("bannerTitle").textContent = title;
    el("bannerSub").textContent = sub || "";
    show("banner");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { hide("banner"); }, (secs || 3.4) * 1000);
  }

  function panel(html) {
    el("panelCard").innerHTML = html;
    show("panel"); CC.paused = true; CC.input.unlock();
  }
  function closePanel() { hide("panel"); CC.paused = false; }
  function menu(html) {
    if (html) { el("menuCard").innerHTML = html; show("menu"); }
    else hide("menu");
  }

  function basketChip(text) {
    if (text) { el("basketChip").textContent = text; show("basketChip"); }
    else hide("basketChip");
  }
  function bizHUD(text) {
    if (text) { el("bizHUD").innerHTML = text; show("bizHUD"); }
    else hide("bizHUD");
  }

  function applySettingsToBody() {
    var b = document.body;
    b.classList.toggle("highContrast", !!CC.settings.highContrast);
    b.classList.toggle("reducedMotion", !!CC.settings.reducedMotion);
    b.classList.toggle("bigText", CC.settings.textSize === 1);
    b.classList.toggle("hugeText", CC.settings.textSize === 2);
  }

  return {
    el: el, show: show, hide: hide,
    updateHUD: updateHUD, toast: toast, prompt: prompt,
    hint: hint, clearHint: clearHint, tracker: tracker,
    fade: fade, banner: banner, basketChip: basketChip, bizHUD: bizHUD,
    panel: panel, closePanel: closePanel, menu: menu,
    applySettingsToBody: applySettingsToBody
  };
})();
