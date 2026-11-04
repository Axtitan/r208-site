/* App previews: fit the phone frame to its slot, and start the app only when
   the visitor asks for it (or straight away on previews/phone.html). */
(function () {
  var PHONE_W = 426; // the drawn iPhone, bezel included, in CSS px

  function fit(box) {
    var phone = box.querySelector(".ap-phone");
    if (phone) phone.style.setProperty("--ap-s", String(box.clientWidth / PHONE_W));
  }
  var boxes = document.querySelectorAll("[data-phone-fit]");
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) { fit(e.target); });
    });
    boxes.forEach(function (b) { ro.observe(b); });
  } else {
    boxes.forEach(fit);
    window.addEventListener("resize", function () { boxes.forEach(fit); });
  }

  // Status bar and home indicator take the app's own colour, read from the
  // theme-color meta in the preview's index.html.
  function setColours(screen, bg) {
    var m = /^#([0-9a-f]{6})$/i.exec((bg || "").trim());
    if (!m) return;
    var n = parseInt(m[1], 16);
    var lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    screen.style.setProperty("--ap-bg", "#" + m[1]);
    screen.style.setProperty("--ap-fg", lum > 0.6 ? "#000" : "#fff");
  }

  function launch(btn) {
    var screen = btn.closest(".ap-screen");
    var frame = screen && screen.querySelector("iframe[data-src]");
    if (!frame || !frame.getAttribute("data-src")) return;
    if (screen.classList.contains("ap-screen--phone")) setColours(screen, "#ffffff");
    frame.addEventListener("load", function () {
      try {
        var meta = frame.contentDocument.querySelector('meta[name="theme-color"]');
        if (meta && screen.classList.contains("ap-screen--phone")) setColours(screen, meta.getAttribute("content"));
      } catch (e) { /* not same-origin: keep the default */ }
    });
    frame.src = frame.getAttribute("data-src");
    frame.hidden = false;
    screen.classList.add("is-live");
    btn.remove();
    frame.focus();
  }

  document.querySelectorAll("[data-preview-launch]").forEach(function (btn) {
    btn.addEventListener("click", function () { launch(btn); });
  });

  // previews/phone.html?src=/previews/<name>/index.html opens one preview on
  // its own. Only our own preview builds are accepted.
  var solo = document.querySelector("[data-preview-solo]");
  if (solo) {
    var src = new URLSearchParams(location.search).get("src") || "";
    var ok = /^\/previews\/[a-z0-9-]+\/[A-Za-z0-9._\/-]*$/.test(src) && src.indexOf("..") < 0;
    var frame = solo.querySelector("iframe");
    var btn = solo.querySelector("[data-preview-launch]");
    if (ok && frame && btn) {
      frame.setAttribute("data-src", src);
      launch(btn);
    } else {
      solo.classList.add("is-missing");
    }
  }
})();
