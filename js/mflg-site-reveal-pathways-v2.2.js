/* MFLG Site Reveal Pathways v2.2.1
   File: js/mflg-site-reveal-pathways-v2.2.js

   In accordance with MP v2:
   - JS-only reveal hardening patch for the Practice Areas pathway directory
   - Uses MutationObserver so it waits for v2.1 site-enhancements to inject the full pathway section
   - Does not modify intake JS
   - Does not modify CSS
   - Does not replace mflg-site-enhancements.js
   - Preserves current site-enhancements v2.1 routing and intake architecture
   - Converts the full pathway section from always-visible to click-to-reveal
*/

(function () {
  "use strict";

  var VERSION = "2.2.1";
  var STATE = {
    initialized: false,
    revealed: false,
    observerStarted: false,
    lastAppliedAt: 0
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

  function scrollToElement(element) {
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function getPathwaysSection() {
    return (
      getFirst("#family-law-pathways") ||
      getFirst("[data-section='family-law-pathways']") ||
      getFirst(".mflg-full-pathways")
    );
  }

  function getButtonWrap() {
    return getFirst(".mflg-practice-view-all-wrap") || getFirst(".mflg-view-pathways-wrap");
  }

  function getRevealButton() {
    var wrap = getButtonWrap();

    if (!wrap) return null;

    return getFirst("a, button, [role='button']", wrap);
  }

  function isVisibleElement(element) {
    if (!element) return false;

    if (element.hidden) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    if (element.style && element.style.display === "none") return false;

    return true;
  }

  function setRevealButtonText(button) {
    if (!button) return;

    button.textContent = "View More Family Law Pathways";
    button.setAttribute("aria-label", "View more family law pathways");

    if (button.tagName && button.tagName.toLowerCase() === "a") {
      button.setAttribute("href", "#family-law-pathways");
    }
  }

  function hidePathways() {
    var section = getPathwaysSection();
    var wrap = getButtonWrap();
    var button = getRevealButton();

    STATE.revealed = false;

    if (section) {
      section.setAttribute("hidden", "hidden");
      section.setAttribute("aria-hidden", "true");
      section.style.display = "none";
      section.classList.remove("mflg-full-pathways-revealed");
      section.classList.add("mflg-full-pathways-hidden");
    }

    if (wrap) {
      wrap.style.display = "";
      wrap.removeAttribute("hidden");
      wrap.setAttribute("aria-hidden", "false");
    }

    setRevealButtonText(button);

    document.documentElement.classList.remove("mflg-full-pathways-open");
    document.documentElement.classList.add("mflg-full-pathways-closed");
  }

  function revealPathways() {
    var section = getPathwaysSection();
    var wrap = getButtonWrap();

    if (!section) return;

    STATE.revealed = true;

    section.removeAttribute("hidden");
    section.setAttribute("aria-hidden", "false");
    section.style.display = "";
    section.classList.remove("mflg-full-pathways-hidden");
    section.classList.add("mflg-full-pathways-revealed");

    if (wrap) {
      wrap.style.display = "none";
      wrap.setAttribute("aria-hidden", "true");
    }

    document.documentElement.classList.remove("mflg-full-pathways-closed");
    document.documentElement.classList.add("mflg-full-pathways-open");

    window.setTimeout(function () {
      scrollToElement(section);
    }, 40);
  }

  function replaceRevealButtonHandler() {
    var button = getRevealButton();

    if (!button) return false;

    setRevealButtonText(button);

    if (button.__mflgRevealV221) return true;

    var cleanButton = button.cloneNode(true);

    cleanButton.__mflgRevealV221 = true;
    cleanButton.setAttribute("data-mflg-reveal-version", VERSION);
    setRevealButtonText(cleanButton);

    cleanButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      revealPathways();
    });

    if (button.parentNode) {
      button.parentNode.replaceChild(cleanButton, button);
    }

    return true;
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
      if (control.__mflgRevealResetV221) return;
      if (!isPracticeAreaControl(control)) return;

      control.__mflgRevealResetV221 = true;

      control.addEventListener("click", function () {
        window.setTimeout(function () {
          hidePathways();
        }, 60);
      });
    });
  }

  function removeVisibleRawJavascriptLeak() {
    getAll("body *").forEach(function (node) {
      if (!node || !node.childNodes || node.children.length > 0) return;

      var text = String(node.textContent || "");

      if (
        text.indexOf("card.classList.add") !== -1 ||
        (text.indexOf("addEventListener") !== -1 && text.indexOf("radio.checked") !== -1) ||
        text.indexOf("syncRadioCards") !== -1 ||
        (text.indexOf("updateCount") !== -1 && text.indexOf("textarea.value.length") !== -1)
      ) {
        node.setAttribute("hidden", "hidden");
        node.setAttribute("aria-hidden", "true");
        node.style.display = "none";
      }
    });
  }

  function applyRevealState(reason) {
    var section = getPathwaysSection();
    var button = getRevealButton();

    if (!section || !button) return false;

    replaceRevealButtonHandler();
    bindPracticeAreaReset();
    removeVisibleRawJavascriptLeak();

    if (!STATE.revealed) {
      hidePathways();
    } else if (!isVisibleElement(section)) {
      revealPathways();
    }

    STATE.initialized = true;
    STATE.lastAppliedAt = Date.now();

    document.documentElement.classList.add("mflg-site-reveal-pathways-v221-ready");
    document.documentElement.setAttribute("data-mflg-reveal-pathways", VERSION);
    document.documentElement.setAttribute("data-mflg-reveal-reason", reason || "applied");

    return true;
  }

  function startObserver() {
    if (STATE.observerStarted) return;

    STATE.observerStarted = true;

    var observer = new MutationObserver(function () {
      window.clearTimeout(startObserver._timer);

      startObserver._timer = window.setTimeout(function () {
        applyRevealState("mutation");
      }, 50);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function scheduleInit() {
    startObserver();

    [0, 80, 180, 350, 700, 1200, 2000, 3500].forEach(function (delay) {
      window.setTimeout(function () {
        applyRevealState("timer-" + delay);
      }, delay);
    });
  }

  ready(scheduleInit);
})();
