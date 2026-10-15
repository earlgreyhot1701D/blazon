// about.js: opens and closes the About dialog. Nothing else.
(function () {
  "use strict";
  var dialog = document.getElementById("about-dialog");
  var openBtn = document.getElementById("btn-about");
  var closeBtn = document.getElementById("btn-about-close");
  if (!dialog || !openBtn || !closeBtn || typeof dialog.showModal !== "function") return;
  openBtn.addEventListener("click", function () { dialog.showModal(); });
  closeBtn.addEventListener("click", function () { dialog.close(); });
  // Click on the dark backdrop closes it too.
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
}());
