/* Project pages: start an app preview only when the visitor asks for it. */
(function () {
  document.querySelectorAll("[data-preview-launch]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var screen = btn.closest(".ap-screen");
      var frame = screen && screen.querySelector("iframe[data-src]");
      if (!frame) return;
      frame.src = frame.getAttribute("data-src");
      frame.hidden = false;
      screen.classList.add("is-live");
      btn.remove();
      frame.focus();
    });
  });
})();
