(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var SHIELD_PATH = "M 52 28 L 348 28 L 348 184 C 348 296 284 378 200 420 C 116 378 52 296 52 184 Z";

  var metals = [
    { name: "Or", hex: "#d4af37", type: "metal" },
    { name: "Argent", hex: "#e8e8e8", type: "metal" }
  ];

  var colours = [
    { name: "Gules", hex: "#9b1c20", type: "colour" },
    { name: "Azure", hex: "#1f4e8c", type: "colour" },
    { name: "Sable", hex: "#1a1a1a", type: "colour" },
    { name: "Vert", hex: "#2f6b3a", type: "colour" },
    { name: "Purpure", hex: "#6a2f6b", type: "colour" }
  ];

  var divisions = [
    { id: "plain", label: "" },
    { id: "per-pale", label: "Per pale" },
    { id: "per-fess", label: "Per fess" },
    { id: "per-bend", label: "Per bend" },
    { id: "per-chevron", label: "Per chevron" },
    { id: "quarterly", label: "Quarterly" }
  ];

  var charges = [
    { id: "mullet", name: "mullet", article: "a" },
    { id: "crescent", name: "crescent", article: "a" },
    { id: "roundel", name: "roundel", article: "a" },
    { id: "lozenge", name: "lozenge", article: "a" },
    { id: "cross", name: "cross", article: "a" },
    { id: "chevron", name: "chevron", article: "a" },
    { id: "tower", name: "tower", article: "a" },
    { id: "escutcheon", name: "escutcheon", article: "an" }
  ];

  var input = document.getElementById("word-input");
  var armsName = document.getElementById("arms-name");
  var shieldStage = document.getElementById("shield-stage");
  var blazonLine = document.getElementById("blazon-line");
  var ruleNote = document.getElementById("rule-note");
  var exampleButtons = Array.prototype.slice.call(document.querySelectorAll(".example"));

  function svgElement(name, attributes) {
    var element = document.createElementNS(SVG_NS, name);

    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, String(attributes[key]));
    });

    return element;
  }

  function hashText(text) {
    var hash = 2166136261;

    Array.from(text).forEach(function (character) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    });

    return hash >>> 0;
  }

  function derive(hash, salt) {
    var value = (hash ^ Math.imul(salt, 2654435761)) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 2246822507) >>> 0;
    value ^= value >>> 13;
    value = Math.imul(value, 3266489909) >>> 0;
    value ^= value >>> 16;
    return value >>> 0;
  }

  function choose(list, value) {
    return list[value % list.length];
  }

  function normalize(value) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function designArms(text) {
    var hash = hashText(text);
    var division = choose(divisions, derive(hash, 1));
    var firstIsMetal = derive(hash, 2) % 2 === 0;
    var firstPool = firstIsMetal ? metals : colours;
    var secondPool = firstIsMetal ? colours : metals;
    var tinctureOne = choose(firstPool, derive(hash, 3));
    var tinctureTwo = division.id === "plain"
      ? null
      : choose(secondPool, derive(hash, 4));
    var charge = choose(charges, derive(hash, 5));
    var chargeTincture = division.id === "plain"
      ? choose(secondPool, derive(hash, 6))
      : null;
    var fieldText = division.id === "plain"
      ? tinctureOne.name
      : division.label + " " + tinctureOne.name + " and " + tinctureTwo.name;
    var ending = division.id === "plain"
      ? chargeTincture.name
      : "counterchanged";

    return {
      division: division,
      tinctureOne: tinctureOne,
      tinctureTwo: tinctureTwo,
      charge: charge,
      chargeTincture: chargeTincture,
      blazon: fieldText + ", " + charge.article + " " + charge.name + " " + ending + "."
    };
  }

  function appendRect(parent, x, y, width, height, fill) {
    parent.appendChild(svgElement("rect", {
      x: x,
      y: y,
      width: width,
      height: height,
      fill: fill
    }));
  }

  function appendPolygon(parent, points, fill) {
    parent.appendChild(svgElement("polygon", {
      points: points,
      fill: fill
    }));
  }

  function drawField(parent, divisionId, one, two) {
    if (divisionId === "plain") {
      appendRect(parent, 0, 0, 400, 440, one);
      return;
    }

    appendRect(parent, 0, 0, 400, 440, two);

    if (divisionId === "per-pale") {
      appendRect(parent, 0, 0, 200, 440, one);
    } else if (divisionId === "per-fess") {
      appendRect(parent, 0, 0, 400, 220, one);
    } else if (divisionId === "per-bend") {
      appendPolygon(parent, "0,0 400,0 400,440", one);
    } else if (divisionId === "per-chevron") {
      appendPolygon(parent, "0,0 400,0 400,150 200,292 0,150", one);
    } else if (divisionId === "quarterly") {
      appendRect(parent, 0, 0, 200, 220, one);
      appendRect(parent, 200, 220, 200, 220, one);
    }
  }

  function chargeShape(chargeId) {
    var shape;

    if (chargeId === "mullet") {
      shape = svgElement("polygon", {
        points: "200,105 225,171 296,175 241,220 258,290 200,250 142,290 159,220 104,175 175,171"
      });
    } else if (chargeId === "crescent") {
      shape = svgElement("path", {
        d: "M 225 105 A 102 102 0 1 0 225 309 A 78 78 0 1 1 225 105 Z",
        "fill-rule": "evenodd",
        "clip-rule": "evenodd"
      });
    } else if (chargeId === "roundel") {
      shape = svgElement("circle", {
        cx: 200,
        cy: 210,
        r: 88
      });
    } else if (chargeId === "lozenge") {
      shape = svgElement("polygon", {
        points: "200,95 300,210 200,325 100,210"
      });
    } else if (chargeId === "cross") {
      shape = svgElement("path", {
        d: "M 164 96 H 236 V 170 H 310 V 242 H 236 V 324 H 164 V 242 H 90 V 170 H 164 Z"
      });
    } else if (chargeId === "chevron") {
      shape = svgElement("path", {
        d: "M 72 142 L 200 270 L 328 142 L 328 210 L 200 338 L 72 210 Z"
      });
    } else if (chargeId === "tower") {
      shape = svgElement("path", {
        d: "M 112 132 H 142 V 104 H 174 V 132 H 226 V 104 H 258 V 132 H 288 V 318 H 112 Z"
      });
    } else {
      shape = svgElement("path", {
        d: "M 136 119 H 264 V 209 C 264 264 236 303 200 324 C 164 303 136 264 136 209 Z"
      });
    }

    return shape;
  }

  function createShieldSvg(design) {
    var svg = svgElement("svg", {
      viewBox: "0 0 400 440",
      role: "img",
      "aria-label": design.blazon,
      preserveAspectRatio: "xMidYMid meet"
    });
    var title = svgElement("title");
    var defs = svgElement("defs");
    var shieldClip = svgElement("clipPath", {
      id: "shield-clip",
      clipPathUnits: "userSpaceOnUse"
    });
    var chargeClip = svgElement("clipPath", {
      id: "charge-clip",
      clipPathUnits: "userSpaceOnUse"
    });
    var fieldGroup = svgElement("g", {
      "clip-path": "url(#shield-clip)"
    });

    title.textContent = design.blazon;
    shieldClip.appendChild(svgElement("path", { d: SHIELD_PATH }));
    chargeClip.appendChild(chargeShape(design.charge.id));
    defs.appendChild(shieldClip);
    defs.appendChild(chargeClip);
    svg.appendChild(title);
    svg.appendChild(defs);

    drawField(
      fieldGroup,
      design.division.id,
      design.tinctureOne.hex,
      design.tinctureTwo ? design.tinctureTwo.hex : design.tinctureOne.hex
    );
    svg.appendChild(fieldGroup);

    if (design.division.id === "plain") {
      var solidCharge = chargeShape(design.charge.id);
      solidCharge.setAttribute("fill", design.chargeTincture.hex);
      solidCharge.setAttribute("stroke", "#140f0a");
      solidCharge.setAttribute("stroke-opacity", "0.55");
      solidCharge.setAttribute("stroke-width", "3");
      solidCharge.setAttribute("stroke-linejoin", "round");
      svg.appendChild(solidCharge);
    } else {
      var counterchanged = svgElement("g", {
        "clip-path": "url(#charge-clip)"
      });
      drawField(
        counterchanged,
        design.division.id,
        design.tinctureTwo.hex,
        design.tinctureOne.hex
      );
      svg.appendChild(counterchanged);

      var chargeOutline = chargeShape(design.charge.id);
      chargeOutline.setAttribute("fill", "none");
      chargeOutline.setAttribute("stroke", "#140f0a");
      chargeOutline.setAttribute("stroke-opacity", "0.62");
      chargeOutline.setAttribute("stroke-width", "3");
      chargeOutline.setAttribute("stroke-linejoin", "round");
      svg.appendChild(chargeOutline);
    }

    var paintedTexture = svgElement("g", {
      "clip-path": "url(#shield-clip)",
      opacity: "0.075"
    });
    var textureIndex;

    for (textureIndex = -420; textureIndex < 820; textureIndex += 28) {
      paintedTexture.appendChild(svgElement("line", {
        x1: textureIndex,
        y1: 0,
        x2: textureIndex + 440,
        y2: 440,
        stroke: "#fff8e6",
        "stroke-width": 1
      }));
    }

    svg.appendChild(paintedTexture);
    svg.appendChild(svgElement("path", {
      d: SHIELD_PATH,
      fill: "none",
      stroke: "#2a1b13",
      "stroke-width": 13,
      "stroke-linejoin": "round"
    }));
    svg.appendChild(svgElement("path", {
      d: SHIELD_PATH,
      fill: "none",
      stroke: "#d2ae5d",
      "stroke-width": 5,
      "stroke-linejoin": "round"
    }));

    return svg;
  }

  function createEmptyShield() {
    var svg = svgElement("svg", {
      viewBox: "0 0 400 440",
      role: "img",
      "aria-label": "An empty heraldic shield waiting for a word",
      preserveAspectRatio: "xMidYMid meet"
    });
    var title = svgElement("title");
    var prompt = svgElement("text", {
      x: 200,
      y: 225,
      "text-anchor": "middle",
      fill: "#8f7556",
      "font-family": "Cormorant Garamond, Georgia, serif",
      "font-size": 54,
      "font-style": "italic"
    });

    title.textContent = "An empty heraldic shield waiting for a word";
    prompt.textContent = "?";
    svg.appendChild(title);
    svg.appendChild(svgElement("path", {
      d: SHIELD_PATH,
      fill: "rgba(245, 234, 209, 0.46)",
      stroke: "#7b6040",
      "stroke-width": 5,
      "stroke-dasharray": "10 9",
      "stroke-linejoin": "round"
    }));
    svg.appendChild(prompt);
    return svg;
  }

  function updatePressedExample(value) {
    exampleButtons.forEach(function (button) {
      button.setAttribute(
        "aria-pressed",
        button.getAttribute("data-word").toLowerCase() === value ? "true" : "false"
      );
    });
  }

  function render() {
    try {
      var normalized = normalize(input.value);
      shieldStage.textContent = "";
      updatePressedExample(normalized);

      if (!normalized) {
        shieldStage.appendChild(createEmptyShield());
        armsName.textContent = "Awaiting inscription";
        blazonLine.textContent = "Enter a word to reveal its arms.";
        ruleNote.textContent = "Every choice will come from your text.";
        return;
      }

      var design = designArms(normalized);
      var displayName = input.value.trim().replace(/\s+/g, " ");
      shieldStage.appendChild(createShieldSvg(design));
      armsName.textContent = "Arms of " + displayName;
      blazonLine.textContent = design.blazon;
      ruleNote.textContent = "Rule of tincture respected: metal and colour alternate.";
    } catch (error) {
      shieldStage.textContent = "";
      shieldStage.appendChild(createEmptyShield());
      armsName.textContent = "No arms drawn";
      blazonLine.textContent = "These arms could not be drawn. Try another word.";
      ruleNote.textContent = "No design was created.";
    }
  }

  function chooseExample(event) {
    try {
      input.value = event.currentTarget.getAttribute("data-word");
      render();
      input.focus();
    } catch (error) {
      blazonLine.textContent = "That example could not be loaded. Type a word instead.";
    }
  }

  try {
    input.addEventListener("input", render);
    exampleButtons.forEach(function (button) {
      button.addEventListener("click", chooseExample);
    });
    render();
  } catch (error) {
    document.body.textContent = "Blazon could not start. Please refresh and try again.";
  }
}());
