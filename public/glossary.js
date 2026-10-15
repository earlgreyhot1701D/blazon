// glossary.js: plain-English tooltips for the Heraldic Elements rows. Nothing else.
// Deterministic lookup. Explains each heraldic word, then the current value. Watches the four value cells.
(function () {
  "use strict";

  // What each heraldic word means, for someone who has never seen one.
  var CONCEPT = {
    "elem-field": "Field: the background of the shield, the surface everything else is painted on. It can be one solid color or split into sections by lines.",
    "elem-tinctures": "Tinctures: heraldry's word for the colors. There are metals (gold and silver) and colours (red, blue, black, green, purple).",
    "elem-charge": "Charge: the picture placed on top of the field, like a star, a tower, or a cross. It is the main symbol of the arms.",
    "elem-arrangement": "Arrangement: how the charge's colors relate to the field underneath it."
  };

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
  var TINCTURE_RULE = "The old rule of tincture: never put metal on metal or colour on colour, so the design stays readable from far away.";

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

  var ARRANGEMENT = {
    "Counterchanged": "The charge swaps tinctures where it crosses the dividing line, so each half shows the opposite one.",
    "Proper": "On a plain field the charge sits in a single tincture. (Strictly, heraldic “proper” means natural colours. Blazon uses it loosely here.)"
  };

  // Concept first, then what this shield's value means.
  function fullTip(id, text) {
    var value = valueTip(id, text);
    return value ? CONCEPT[id] + "\n\nHere: " + value : CONCEPT[id];
  }

  function valueTip(id, text) {
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
      return CHARGE[key] || "";
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
      var tip = fullTip(id, cell.textContent);
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
