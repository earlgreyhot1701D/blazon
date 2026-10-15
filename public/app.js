(function() {
  'use strict';

  var SVG_NS = "http://www.w3.org/2000/svg";
  var SHIELD_PATH = "M 52 28 L 348 28 L 348 184 C 348 296 284 378 200 420 C 116 378 52 296 52 184 Z";

  var metals = [
    { name: "Or", hex: "#d8b038", type: "metal", label: "Gold / Sun" },
    { name: "Argent", hex: "#ecefe8", type: "metal", label: "Silver / Purity" }
  ];

  var colours = [
    { name: "Gules", hex: "#9b1e2a", type: "colour", label: "Ruby / Courage" },
    { name: "Azure", hex: "#1d4e8b", type: "colour", label: "Sapphire / Truth" },
    { name: "Sable", hex: "#201d1c", type: "colour", label: "Black / Constancy" },
    { name: "Vert", hex: "#2b6a3e", type: "colour", label: "Emerald / Hope" },
    { name: "Purpure", hex: "#6c3272", type: "colour", label: "Amethyst / Sovereignty" }
  ];

  var divisions = [
    { id: "plain", label: "Plain field", desc: "an undivided mantle of sovereign intent" },
    { id: "per-pale", label: "Per pale", desc: "a vertical partition dividing courage and intellect" },
    { id: "per-fess", label: "Per fess", desc: "a horizontal division balancing earthly foundation and heavens" },
    { id: "per-bend", label: "Per bend", desc: "a diagonal descent expressing chivalric pursuit" },
    { id: "per-chevron", label: "Per chevron", desc: "a gable of protection and aspiring noble heights" },
    { id: "quarterly", label: "Quarterly", desc: "four-fold realms joined under one unified banner" }
  ];

  var charges = [
    { id: "mullet", name: "mullet", article: "a", desc: "signifying divine celestial guidance and steadfast virtue" },
    { id: "crescent", name: "crescent", article: "a", desc: "denoting enlightenment, renewal, and enduring grace" },
    { id: "roundel", name: "roundel", article: "a", desc: "representing bounty, unity, and complete resolve" },
    { id: "lozenge", name: "lozenge", article: "a", desc: "an ancient emblem of acute wisdom and steadfast honor" },
    { id: "cross", name: "cross", article: "a", desc: "the ancient mark of chivalric duty and sanctified oath" },
    { id: "chevron", name: "chevron", article: "a", desc: "representing protective guardianship and firm alliance" },
    { id: "tower", name: "tower", article: "a", desc: "emblematic of steadfast defense, citadel refuge, and loyalty" },
    { id: "escutcheon", name: "escutcheon", article: "an", desc: "a shield within a shield, signifying profound heritage" }
  ];

  // DOM Elements
  var wordInput = document.getElementById("word-input");
  var btnGenerate = document.getElementById("btn-generate");
  var armsTitle = document.getElementById("arms-title");
  var shieldMount = document.getElementById("shield-mount");
  var blazonText = document.getElementById("blazon-text");
  var tinctureRule = document.getElementById("tincture-rule");
  var elemField = document.getElementById("elem-field");
  var elemTinctures = document.getElementById("elem-tinctures");
  var elemCharge = document.getElementById("elem-charge");
  var elemArrangement = document.getElementById("elem-arrangement");
  var loreDesc = document.getElementById("lore-description");
  var swatchField = document.getElementById("swatch-field");
  var swatchTinctures = document.getElementById("swatch-tinctures");
  var swatchCharge = document.getElementById("swatch-charge");
  var swatchArrangement = document.getElementById("swatch-arrangement");
  var exampleButtons = Array.prototype.slice.call(document.querySelectorAll(".example-btn"));
  var btnCopyBlazon = document.getElementById("btn-copy-blazon");
  var btnDownloadSvg = document.getElementById("btn-download-svg");
  var btnShareLink = document.getElementById("btn-share-link");
  var waxSealBtn = document.getElementById("wax-seal-btn");
  var toast = document.getElementById("toast");
  var toastMsg = document.getElementById("toast-msg");

  var currentDesign = null;
  var toastTimer = null;

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove("show");
    }, 2200);
  }

  function createSvg(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function(k) {
      el.setAttribute(k, String(attrs[k]));
    });
    return el;
  }

  function hashString(str) {
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function derive(hash, salt) {
    var val = (hash ^ Math.imul(salt, 2654435761)) >>> 0;
    val ^= val >>> 16;
    val = Math.imul(val, 2246822507) >>> 0;
    val ^= val >>> 13;
    val = Math.imul(val, 3266489909) >>> 0;
    val ^= val >>> 16;
    return val >>> 0;
  }

  function pick(list, seed) {
    return list[seed % list.length];
  }

  function designArms(rawText) {
    var clean = rawText.trim().toLowerCase();
    if (!clean) clean = "avalon";
    var hash = hashString(clean);

    var division = pick(divisions, derive(hash, 1));
    var firstIsMetal = derive(hash, 2) % 2 === 0;
    var firstPool = firstIsMetal ? metals : colours;
    var secondPool = firstIsMetal ? colours : metals;

    var tinctureOne = pick(firstPool, derive(hash, 3));
    var tinctureTwo = division.id === "plain" ? null : pick(secondPool, derive(hash, 4));
    var charge = pick(charges, derive(hash, 5));
    var chargeTincture = division.id === "plain" ? pick(secondPool, derive(hash, 6)) : null;

    var fieldText = division.id === "plain" 
      ? tinctureOne.name 
      : division.label + " " + tinctureOne.name + " and " + tinctureTwo.name;

    var ending = division.id === "plain" ? chargeTincture.name : "counterchanged";
    var formalBlazon = fieldText + ", " + charge.article + " " + charge.name + " " + ending + ".";

    return {
      clean: clean,
      rawWord: rawText.trim() || "Avalon",
      division: division,
      tinctureOne: tinctureOne,
      tinctureTwo: tinctureTwo,
      charge: charge,
      chargeTincture: chargeTincture,
      blazon: formalBlazon,
      isPlain: division.id === "plain"
    };
  }

  function getChargeShape(chargeId) {
    if (chargeId === "mullet") {
      return createSvg("polygon", {
        points: "200,95 224,166 298,168 240,212 260,285 200,242 140,285 160,212 102,168 176,166"
      });
    } else if (chargeId === "crescent") {
      return createSvg("path", {
        d: "M 226 102 A 100 100 0 1 0 226 308 A 76 76 0 1 1 226 102 Z",
        "fill-rule": "evenodd"
      });
    } else if (chargeId === "roundel") {
      return createSvg("circle", { cx: 200, cy: 208, r: 84 });
    } else if (chargeId === "lozenge") {
      return createSvg("polygon", { points: "200,90 305,208 200,326 95,208" });
    } else if (chargeId === "cross") {
      return createSvg("path", {
        d: "M 162 92 H 238 V 166 H 312 V 242 H 238 V 328 H 162 V 242 H 88 V 166 H 162 Z"
      });
    } else if (chargeId === "chevron") {
      return createSvg("path", {
        d: "M 70 140 L 200 270 L 330 140 L 330 208 L 200 338 L 70 208 Z"
      });
    } else if (chargeId === "tower") {
      return createSvg("path", {
        d: "M 116 130 H 144 V 104 H 176 V 130 H 224 V 104 H 256 V 130 H 284 V 318 H 116 Z"
      });
    } else {
      // Escutcheon
      return createSvg("path", {
        d: "M 136 120 H 264 V 210 C 264 266 236 305 200 326 C 164 305 136 266 136 210 Z"
      });
    }
  }

  function renderFieldDivision(group, divisionId, fill1, fill2) {
    if (divisionId === "plain") {
      var r = createSvg("rect", { x: 0, y: 0, width: 400, height: 440, fill: fill1 });
      group.appendChild(r);
      return;
    }

    group.appendChild(createSvg("rect", { x: 0, y: 0, width: 400, height: 440, fill: fill2 }));

    if (divisionId === "per-pale") {
      group.appendChild(createSvg("rect", { x: 0, y: 0, width: 200, height: 440, fill: fill1 }));
    } else if (divisionId === "per-fess") {
      group.appendChild(createSvg("rect", { x: 0, y: 0, width: 400, height: 215, fill: fill1 }));
    } else if (divisionId === "per-bend") {
      group.appendChild(createSvg("polygon", { points: "0,0 400,0 400,440", fill: fill1 }));
    } else if (divisionId === "per-chevron") {
      group.appendChild(createSvg("polygon", { points: "0,0 400,0 400,152 200,296 0,152", fill: fill1 }));
    } else if (divisionId === "quarterly") {
      group.appendChild(createSvg("rect", { x: 0, y: 0, width: 200, height: 215, fill: fill1 }));
      group.appendChild(createSvg("rect", { x: 200, y: 215, width: 200, height: 225, fill: fill1 }));
    }
  }

  function buildShieldSvg(design) {
    var svg = createSvg("svg", {
      viewBox: "0 0 400 440",
      xmlns: SVG_NS,
      role: "img",
      "aria-label": design.blazon
    });

    var defs = createSvg("defs");

    // Shield clip
    var shieldClip = createSvg("clipPath", { id: "shield-clip-path" });
    shieldClip.appendChild(createSvg("path", { d: SHIELD_PATH }));
    defs.appendChild(shieldClip);

    // Charge clip
    var chargeClip = createSvg("clipPath", { id: "charge-clip-path" });
    chargeClip.appendChild(getChargeShape(design.charge.id));
    defs.appendChild(chargeClip);

    // 3D Bevel Crease Gradients
    var creaseGradLeft = createSvg("linearGradient", { id: "crease-left", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    var stop1 = createSvg("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.2" });
    var stop2 = createSvg("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0.02" });
    creaseGradLeft.appendChild(stop1);
    creaseGradLeft.appendChild(stop2);
    defs.appendChild(creaseGradLeft);

    var creaseGradRight = createSvg("linearGradient", { id: "crease-right", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    var stop3 = createSvg("stop", { offset: "0%", "stop-color": "#000000", "stop-opacity": "0.34" });
    var stop4 = createSvg("stop", { offset: "100%", "stop-color": "#000000", "stop-opacity": "0.04" });
    creaseGradRight.appendChild(stop3);
    creaseGradRight.appendChild(stop4);
    defs.appendChild(creaseGradRight);

    svg.appendChild(defs);

    // Main Clipped Shield Group
    var shieldContent = createSvg("g", { "clip-path": "url(#shield-clip-path)" });

    // Draw Base Field
    var t1Hex = design.tinctureOne.hex;
    var t2Hex = design.tinctureTwo ? design.tinctureTwo.hex : design.tinctureOne.hex;
    renderFieldDivision(shieldContent, design.division.id, t1Hex, t2Hex);

    // Draw Charge
    if (design.isPlain) {
      var plainCharge = getChargeShape(design.charge.id);
      plainCharge.setAttribute("fill", design.chargeTincture.hex);
      plainCharge.setAttribute("stroke", "#140f0a");
      plainCharge.setAttribute("stroke-width", "3");
      shieldContent.appendChild(plainCharge);
    } else {
      // Counterchanged charge: clip inverted field inside charge
      var counterGroup = createSvg("g", { "clip-path": "url(#charge-clip-path)" });
      renderFieldDivision(counterGroup, design.division.id, t2Hex, t1Hex);
      shieldContent.appendChild(counterGroup);

      var outlineCharge = getChargeShape(design.charge.id);
      outlineCharge.setAttribute("fill", "none");
      outlineCharge.setAttribute("stroke", "#18100a");
      outlineCharge.setAttribute("stroke-width", "3.5");
      outlineCharge.setAttribute("stroke-linejoin", "round");
      shieldContent.appendChild(outlineCharge);
    }

    // Tactile Medieval Hatching / Vellum grain texture overlay
    var hatching = createSvg("g", { opacity: "0.08" });
    for (var i = -400; i < 800; i += 24) {
      hatching.appendChild(createSvg("line", {
        x1: i, y1: 0, x2: i + 440, y2: 440,
        stroke: "#ffffff", "stroke-width": 1
      }));
    }
    shieldContent.appendChild(hatching);

    // Authentic 3D Center Crease Lighting
    var creaseLeftRect = createSvg("rect", {
      x: 0, y: 0, width: 200, height: 440,
      fill: "url(#crease-left)"
    });
    var creaseRightRect = createSvg("rect", {
      x: 200, y: 0, width: 200, height: 440,
      fill: "url(#crease-right)"
    });
    shieldContent.appendChild(creaseLeftRect);
    shieldContent.appendChild(creaseRightRect);

    // Center spine highlight line
    shieldContent.appendChild(createSvg("line", {
      x1: 200, y1: 28, x2: 200, y2: 420,
      stroke: "rgba(255,255,255,0.32)", "stroke-width": 1.5
    }));

    svg.appendChild(shieldContent);

    // Heavy Gilded Outer Iron & Gold Bezel Frames
    svg.appendChild(createSvg("path", {
      d: SHIELD_PATH,
      fill: "none",
      stroke: "#22130c",
      "stroke-width": 14,
      "stroke-linejoin": "round"
    }));
    svg.appendChild(createSvg("path", {
      d: SHIELD_PATH,
      fill: "none",
      stroke: "#d4b05a",
      "stroke-width": 5,
      "stroke-linejoin": "round"
    }));
    svg.appendChild(createSvg("path", {
      d: SHIELD_PATH,
      fill: "none",
      stroke: "#805c1d",
      "stroke-width": 1.5,
      "stroke-linejoin": "round"
    }));

    return svg;
  }

  function updateSwatches(design) {
    var t1 = design.tinctureOne.hex;
    var t2 = design.tinctureTwo ? design.tinctureTwo.hex : t1;

    if (design.isPlain) {
      swatchField.style.background = t1;
      swatchTinctures.style.background = "linear-gradient(135deg, " + t1 + " 50%, " + design.chargeTincture.hex + " 50%)";
      swatchCharge.style.background = design.chargeTincture.hex;
      swatchArrangement.style.background = t1;
    } else {
      swatchField.style.background = "linear-gradient(135deg, " + t1 + " 50%, " + t2 + " 50%)";
      swatchTinctures.style.background = "linear-gradient(90deg, " + t1 + " 50%, " + t2 + " 50%)";
      swatchCharge.style.background = "radial-gradient(circle, " + t2 + " 45%, " + t1 + " 50%)";
      swatchArrangement.style.background = "linear-gradient(45deg, " + t2 + " 50%, " + t1 + " 50%)";
    }
  }

  function renderArms(shouldAnimate) {
    var rawVal = wordInput.value.trim();
    var word = rawVal || "Avalon";
    var design = designArms(word);
    currentDesign = design;

    // Visual subtle reveal animation trigger
    if (shouldAnimate) {
      shieldMount.classList.add("revealing");
      setTimeout(function() {
        shieldMount.classList.remove("revealing");
      }, 180);
    }

    // Update Title
    armsTitle.textContent = "Arms of " + (rawVal || "Avalon");

    // Clear and rebuild shield SVG
    shieldMount.replaceChildren();
    shieldMount.appendChild(buildShieldSvg(design));

    // Update Blazon prose
    blazonText.textContent = design.blazon;

    // Breakdown Elements
    elemField.textContent = design.division.label;
    elemTinctures.textContent = design.isPlain 
      ? design.tinctureOne.name + " (" + design.tinctureOne.type + ")"
      : design.tinctureOne.name + " and " + design.tinctureTwo.name;
    elemCharge.textContent = "A " + design.charge.name;
    elemArrangement.textContent = design.isPlain ? "Proper" : "Counterchanged";

    // Heraldic Lore Synthesis
    var loreSentence = "Features " + design.division.desc + ", conjoined with " + design.charge.article + " " + design.charge.name + " " + design.charge.desc + ". The composition bestows upon " + (rawVal || "Avalon") + " an honorable lineage of timeless dignity and enduring virtue.";
    loreDesc.textContent = loreSentence;

    updateSwatches(design);

    // Update active class on example pills
    var lowerWord = word.toLowerCase();
    exampleButtons.forEach(function(btn) {
      if (btn.getAttribute("data-word").toLowerCase() === lowerWord) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Export & Sharing actions
  function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast(successMsg);
      }).catch(function() {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    var temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch (e) {
      showToast("Failed to copy");
    }
    document.body.removeChild(temp);
  }

  function downloadShieldSvg() {
    if (!currentDesign) return;
    var svgEl = shieldMount.querySelector("svg");
    if (!svgEl) return;

    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgEl);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    var blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var filename = "arms-of-" + encodeURIComponent(currentDesign.clean) + ".svg";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SVG shield downloaded!");
  }

  function shareArmsLink() {
    if (!currentDesign) return;
    var targetWord = currentDesign.rawWord;
    var newUrl = window.location.origin + window.location.pathname + "?word=" + encodeURIComponent(targetWord);
    try {
      window.history.replaceState({ word: targetWord }, "", newUrl);
    } catch(e) {}
    copyTextToClipboard(newUrl, "Shareable URL copied to clipboard!");
  }

  // Event listeners
  wordInput.addEventListener("input", function() {
    renderArms(false);
  });

  btnGenerate.addEventListener("click", function() {
    renderArms(true);
  });

  wordInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      renderArms(true);
      wordInput.blur();
    }
  });

  exampleButtons.forEach(function(btn) {
    btn.addEventListener("click", function() {
      var word = this.getAttribute("data-word");
      wordInput.value = word;
      renderArms(true);
    });
  });

  btnCopyBlazon.addEventListener("click", function() {
    if (currentDesign && currentDesign.blazon) {
      copyTextToClipboard(currentDesign.blazon, "Formal Blazon copied!");
    }
  });

  btnDownloadSvg.addEventListener("click", function() {
    downloadShieldSvg();
  });

  btnShareLink.addEventListener("click", function() {
    shareArmsLink();
  });

  waxSealBtn.addEventListener("click", function() {
    showToast("Certified authentic heraldic blazon ⚜");
  });

  // Handle Initial load with URL query parameter ?word=...
  var urlParams = new URLSearchParams(window.location.search);
  var queryWord = urlParams.get("word");
  if (queryWord && queryWord.trim()) {
    wordInput.value = queryWord.trim();
  }

  // Initial execution
  renderArms(false);

})();
