/* MFLG Site Enhancements v1.0
   File: js/mflg-site-enhancements.js

   In accordance with MP v2:
   - JS-only enhancement layer
   - Does not alter intake architecture or intake validation logic
   - Does not rebuild Webflow structure
   - Adds nav scroll state
   - Routes Start and hero CTAs to locked intake
   - Changes hero primary CTA text from Schedule Consultation to Start Guided Intake
   - No dropdown injection yet
*/

(function () {
  "use strict";

  var INTAKE_SELECTOR = "#mflg-intake-root";
  var PRACTICE_SELECTOR = ".Practice-Areas-Preview-Section, [class*='Practice Areas Preview Section'], [class*='Practice-Areas'], #practice-areas";
  var FEES_SELECTOR = ".Fees-Section, [class*='Fees Section'], [class*='Fees-Section'], #fees";
  var GUIDES_SELECTOR = ".Guides-Section, [class*='Guides Section'], [class*='Guides-Section'], #guides";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getFirst(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function scrollToElement(element) {
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function setAnchorId(element, id) {
    if (!element || !id) return;

    if (!element.id) {
      element.id = id;
    }
  }

  function getIntakeElement() {
    return getFirst(INTAKE_SELECTOR) || getFirst("#intake");
  }

  function getPracticeElement() {
    return getFirst(PRACTICE_SELECTOR);
  }

  function getFeesElement() {
    return getFirst(FEES_SELECTOR);
  }

  function getGuidesElement() {
    return getFirst(GUIDES_SELECTOR);
  }

  function updateScrollState() {
    var threshold = 24;

    if (window.scrollY > threshold) {
      document.body.classList.add("mflg-nav-scrolled");
    } else {
      document.body.classList.remove("mflg-nav-scrolled");
    }
  }

  function initNavScrollState() {
    updateScrollState();

    window.addEventListener(
      "scroll",
      function () {
        updateScrollState();
      },
      { passive: true }
    );
  }

  function routeLinkToElement(link, targetElement) {
    if (!link || !targetElement) return;

    link.addEventListener("click", function (event) {
      event.preventDefault();
      scrollToElement(targetElement);
    });
  }

  function isStartLink(link) {
    var text = normalizeText(link.textContent);
    var className = normalizeText(link.className);
    var href = normalizeText(link.getAttribute("href"));

    return (
      text === "start" ||
      text === "start intake" ||
      text === "start guided intake" ||
      className.indexOf("start") !== -1 ||
      href === "#intake" ||
      href.indexOf("intake") !== -1
    );
  }

  function isPracticeLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));
    var className = normalizeText(link.className);

    return (
      text.indexOf("practice area") !== -1 ||
      href === "#practice-areas" ||
      className.indexOf("practice") !== -1
    );
  }

  function isFeesLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));
    var className = normalizeText(link.className);

    return (
      text === "fees" ||
      text.indexOf("full fees") !== -1 ||
      href === "#fees" ||
      className.indexOf("fee") !== -1
    );
  }

  function isGuidesLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));
    var className = normalizeText(link.className);

    return (
      text === "guides" ||
      text.indexOf("guide") !== -1 ||
      href === "#guides" ||
      className.indexOf("guide") !== -1
    );
  }

  function initAnchorIds() {
    var intake = getIntakeElement();
    var practice = getPracticeElement();
    var fees = getFeesElement();
    var guides = getGuidesElement();

    setAnchorId(intake, "intake");
    setAnchorId(practice, "practice-areas");
    setAnchorId(fees, "fees");
    setAnchorId(guides, "guides");
  }

  function initNavRouting() {
    var intake = getIntakeElement();
    var practice = getPracticeElement();
    var fees = getFeesElement();
    var guides = getGuidesElement();

    var navLinks = document.querySelectorAll(
      "[class*='Navbar'] a, [class*='navbar'] a, nav a"
    );

    navLinks.forEach(function (link) {
      if (isStartLink(link)) {
        link.setAttribute("href", "#intake");
        routeLinkToElement(link, intake);
      } else if (isPracticeLink(link)) {
        link.setAttribute("href", "#practice-areas");
        routeLinkToElement(link, practice);
      } else if (isFeesLink(link)) {
        link.setAttribute("href", "#fees");
        routeLinkToElement(link, fees);
      } else if (isGuidesLink(link)) {
        link.setAttribute("href", "#guides");
        routeLinkToElement(link, guides);
      }
    });
  }

  function initHeroCtas() {
    var intake = getIntakeElement();
    var practice = getPracticeElement();

    var hero = getFirst(".Hero-Section, .Hero Section, [class*='Hero Section'], [class*='Hero-Section'], [class*='hero-section']");

    if (!hero) return;

    var heroLinks = Array.prototype.slice.call(hero.querySelectorAll("a"));

    heroLinks.forEach(function (link) {
      var text = normalizeText(link.textContent);

      if (
        text.indexOf("schedule consultation") !== -1 ||
        text.indexOf("book") !== -1 ||
        text.indexOf("consultation") !== -1
      ) {
        link.textContent = "Start Guided Intake";
        link.setAttribute("href", "#intake");
        routeLinkToElement(link, intake);
      }

      if (text.indexOf("view practice") !== -1 || text.indexOf("practice area") !== -1) {
        link.setAttribute("href", "#practice-areas");
        routeLinkToElement(link, practice);
      }
    });
  }

  function initFeesCtaLanguage() {
    var fees = getFeesElement();
    var intake = getIntakeElement();

    if (!fees) return;

    var links = fees.querySelectorAll("a, button");

    links.forEach(function (link) {
      var text = normalizeText(link.textContent);

      if (text === "book now" || text.indexOf("book now") !== -1) {
        link.textContent = "Request Consultation";
        if (link.tagName.toLowerCase() === "a") {
          link.setAttribute("href", "#intake");
        }
        routeLinkToElement(link, intake);
      }

      if (text.indexOf("view full fees") !== -1) {
        if (link.tagName.toLowerCase() === "a") {
          link.setAttribute("href", "#fees");
        }
        routeLinkToElement(link, fees);
      }
    });
  }

  ready(function () {
    initAnchorIds();
    initNavScrollState();
    initNavRouting();
    initHeroCtas();
    initFeesCtaLanguage();
  });
})();
