/* MFLG Site Reveal Pathways v2.2
   File: js/mflg-site-reveal-pathways-v2.2.js

   In accordance with MP v2:
   - JS-only reveal patch for the Practice Areas pathway directory
   - Does not modify intake JS
   - Does not modify CSS
   - Preserves current site-enhancements v2.1 routing and intake architecture
   - Converts the full pathway section from always-visible to click-to-reveal
*/

(function () {
  "use strict";

  var STATE = {
    initialized: false,
    revealed: false
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getAll(selector, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    } catch (error) {
      return [];
    }
  }

  function getFirst(selector, root) {
    try {
      return (root || document).querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function getPathwaysSection() {
    return getFirst("#family-law-pathways") || getFirst("[data-section='family-law-pathways']") || getFirst(".mflg-full-pathways");
  }

  function getButtonWrap() {
    return getFirst(".mflg-practice-view-all-wrap") || getFirst(".mflg-view-pathways-wrap");
  }

  function getRevealButton() {
    var wrap = getButtonWrap();
    if (!wrap) return null;
    return getFirst("a, button, [role='button']", wrap);
  }

  function scrollToElement(element) {
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setButtonText(button) {
    if (!button) return;
    button.textContent = "View More Family Law Pathways";
    button.setAttribute("aria-label", "View more family law pathways");
    button.setAttribute("href", "#family-law-pathways");
  }

  function hidePathways() {
    var section = getPathwaysSection();
    var wrap = getButtonWrap();

    STATE.revealed = false;

    if (section) {
      section.setAttribute("hidden", "hidden");
      section.setAttribute("aria-hidden", "true");
      section.style.display = "none";
      section.classList.remove("mflg-full-pathways-revealed");
    }

    if (wrap) {
      wrap.style.display = "";
      wrap.removeAttribute("hidden");
      wrap.setAttribute("aria-hidden", "false");
    }

    setButtonText(getRevealButton());
  }

  function revealPathways() {
    var section = getPathwaysSection();
    var wrap = getButtonWrap();

    if (!section) return;

    STATE.revealed = true;

    section.removeAttribute("hidden");
    section.setAttribute("aria-hidden", "false");
    section.style.display = "";
    section.classList.add("mflg-full-pathways-revealed");

    if (wrap) {
      wrap.style.display = "none";
      wrap.setAttribute("aria-hidden", "true");
    }

    window.setTimeout(function () {
      scrollToElement(section);
    }, 40);
  }

  function replaceRevealButtonHandler() {
    var button = getRevealButton();
    var wrap = getButtonWrap();

    if (!button || !wrap || button.__mflgRevealV22) return;

    setButtonText(button);

    var cleanButton = button.cloneNode(true);
    cleanButton.__mflgRevealV22 = true;
    setButtonText(cleanButton);

    cleanButton.addEventListener("click", function (event) {
      event.preventDefault();
      revealPathways();
    });

    button.parentNode.replaceChild(cleanButton, button);
  }

  function isPracticeAreaControl(control) {
    var text = normalizeText(control.textContent);
    var href = normalizeText(control.getAttribute && control.getAttribute("href"));

    return (
      text === "practice areas" ||
      text.indexOf("view practice areas") !== -1 ||
      href === "#practice-areas"
    );
  }

  function bindPracticeAreaReset() {
    getAll("a, button, [role='button']").forEach(function (control) {
      if (control.__mflgRevealResetV22) return;
      if (!isPracticeAreaControl(control)) return;

      control.__mflgRevealResetV22 = true;
      control.addEventListener("click", function () {
        window.setTimeout(hidePathways, 30);
      });
    });
  }

  function initializeRevealPatch() {
    var section = getPathwaysSection();
    var button = getRevealButton();

    if (!section || !button) return false;

    replaceRevealButtonHandler();
    hidePathways();
    bindPracticeAreaReset();

    STATE.initialized = true;
    document.documentElement.classList.add("mflg-site-reveal-pathways-v22-ready");

    return true;
  }

  function scheduleInit() {
    [0, 80, 180, 350, 700, 1200, 2000].forEach(function (delay) {
      window.setTimeout(function () {
        if (!STATE.initialized) {
          initializeRevealPatch();
        } else {
          replaceRevealButtonHandler();
          bindPracticeAreaReset();
        }
      }, delay);
    });
  }

  ready(scheduleInit);
})();
