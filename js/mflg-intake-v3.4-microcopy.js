/* MFLG Intake v3.4 Microcopy Patch — Exact Pathway Preservation
   File: js/mflg-intake-v3.4-microcopy.js

   In accordance with MP v2:
   - Companion microcopy enhancement only
   - Does not replace mflg-intake.js
   - Does not alter intake state, validation, conditional logic, webhook, or routing
   - Reinforces exact-pathway preservation for mapped public pathway cards
*/

(function () {
  "use strict";

  var VERSION = "3.4-microcopy";
  var MESSAGE = "Your exact pathway selection will still be reviewed with your submission.";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getAll(selector, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    } catch (error) {
      return [];
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function shouldEnhanceBanner(banner) {
    if (!banner) return false;

    var text = normalizeText(banner.textContent);

    if (!text) return false;
    if (text.indexOf(normalizeText(MESSAGE)) !== -1) return false;

    return (
      text.indexOf("court appearance / hearing help") !== -1 ||
      text.indexOf("third-party / grandparent rights") !== -1 ||
      text.indexOf("uccjea / interstate custody") !== -1 ||
      text.indexOf("relocation") !== -1 ||
      text.indexOf("we started with document preparation") !== -1 ||
      text.indexOf("we started with parenting time") !== -1 ||
      text.indexOf("closest intake pathway") !== -1 ||
      text.indexOf("usually reviewed through the parenting pathway") !== -1
    );
  }

  function enhanceBanner(banner) {
    if (!shouldEnhanceBanner(banner)) return;

    var p = document.createElement("p");
    p.className = "mflg-route-preserve-note";
    p.textContent = MESSAGE;

    banner.appendChild(p);
    banner.setAttribute("data-mflg-microcopy", VERSION);
  }

  function applyMicrocopy() {
    getAll(".mflg-route-banner").forEach(enhanceBanner);
  }

  function startObserver() {
    var observer = new MutationObserver(function () {
      window.clearTimeout(startObserver._timer);
      startObserver._timer = window.setTimeout(applyMicrocopy, 40);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  ready(function () {
    applyMicrocopy();
    startObserver();

    [80, 180, 350, 700, 1200].forEach(function (delay) {
      window.setTimeout(applyMicrocopy, delay);
    });

    document.documentElement.classList.add("mflg-intake-v34-microcopy-ready");
    document.documentElement.setAttribute("data-mflg-intake-microcopy", VERSION);
  });
})();
