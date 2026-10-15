// glossary.js: plain-English tooltips for the Heraldic Elements rows. Nothing else.
// Deterministic lookup. Watches the four value cells and sets data-tip on each row.
(function () {
  "use strict";

  var FIELD = {
    "Plain field": "One tincture covers the whole shield. No dividing line.",
    "Per pale": "Split down the middle with a vertical line.",
    "Per fess": "Split across the middle with a horizontal line.",
    "Per bend": "Split on the diagonal, from top left to bottom right.",
    "Per chevron": "Split by an upside-down V, like a roof gable.",
    "Quarterly": "Divided into four quarters."
  };

  var TINCTURE = {
    "Or": "Or: gold, a metal. Usually shown as yellow.",
    "Argent": "Argent: silver, a metal. Usually shown as white.",
    "Gules": "Gules: red, a colour.",
    "Azure": "Azure: blue, a colour.",
    "Sable": "Sable: black, a colour.",
    "Vert": "Vert: green, a colour.",
    "Purpure": "Purpure: purple, a colour."
  };
  var TINCTURE_RULE = "Rule of tincture: never metal on metal or colour on colour.";

  var CHARGE = {
    "mullet": "Mullet: a star.",
    "crescent": "Crescent: a crescent moon.",
    "roundel": "Roundel: a plain disc.",
    "lozenge": "Lozenge: a diamond shape.",
    "cross": "Cross: an even cross reaching the edges of the field.",
    "chevron": "Chevron: an upside-down V, like a roof.",
    "tower": "Tower: a castle tower.",
    "escutcheon": "Escutcheon: a small shield set on the shield."
  };
  var CHARGE_NOTE = "The charge is the main picture placed on the field.";

  var ARRANGEMENT = {
    "Counterchanged": "The charge swaps tinctures where it crosses the dividing line, so each half shows the opposite one.",
    "Proper": "On a plain field the charge sits in a single tincture. (Strictly, heraldic “proper” means natural colours. Blazon uses it loosely here.)"
  };

  function tipFor(id, text) {
    var t = (text || "").trim();
    if (!t || t === "—") return "";
    if (id === "elem-field") return FIELD[t] || "";
    if (id === "elem-tinctures") {
      // "Vert (colour)" or "Sable and Argent"
      var names = t.replace(/\s*\(.*\)\s*$/, "").split(/\s+and\s+/);
      var parts = names.map(function (n) { return TINCTURE[n.trim()]; }).filter(Boolean);
      return parts.length ? parts.join(" ") + " " + TINCTURE_RULE : "";
    }
    if (id === "elem-charge") {
      var key = t.replace(/^(a|an)\s+/i, "").toLowerCase();
      return CHARGE[key] ? CHARGE[key] + " " + CHARGE_NOTE : "";
    }
    if (id === "elem-arrangement") return ARRANGEMENT[t] || "";
    return "";
  }

  ["elem-field", "elem-tinctures", "elem-charge", "elem-arrangement"].forEach(function (id) {
    var cell = document.getElementById(id);
    if (!cell) return;
    var row = cell.closest(".breakdown-row");
    if (!row) return;
    function update() {
      var tip = tipFor(id, cell.textContent);
      if (tip) {
        row.setAttribute("data-tip", tip);
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-description", tip);
      } else {
        row.removeAttribute("data-tip");
        row.removeAttribute("tabindex");
        row.removeAttribute("aria-description");
      }
    }
    update();
    new MutationObserver(update).observe(cell, { childList: true, characterData: true, subtree: true });
  });
}());
