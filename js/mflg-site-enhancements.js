/* MFLG Site Enhancements v1.5
   File: js/mflg-site-enhancements.js

   In accordance with MP v2:
   - Full JS replacement
   - Preserves v1.4 nav and fee behavior
   - Adds Practice Areas cards as intake pathways
   - Adds missing pathway pills for intake architecture alignment
   - Does not alter intake architecture, validation, field names, payload, or conditional logic
   - Does not preselect intake values yet
   - No dropdown injection
   - No Pay Invoice or Client Login
*/

(function () {
  "use strict";

  var SELECTORS = {
    intake: "#mflg-intake-root, #intake, [id*='intake']",
    practice:
      ".Practice-Areas-Preview-Section, .practice-areas-preview-section, [class*='Practice Areas Preview Section'], [class*='Practice-Areas'], [class*='practice-areas'], #practice-areas",
    fees:
      ".Fees-Section, .fees-section, [class*='Fees Section'], [class*='Fees-Section'], [class*='fees-section'], #fees",
    guides:
      ".Guides-Section, .guides-section, [class*='Guides Section'], [class*='Guides-Section'], [class*='guides-section'], #guides",
    hero:
      ".Hero-Section, .hero-section, [class*='Hero Section'], [class*='Hero-Section'], [class*='hero-section']",
    nav: ".navbar-fixed",
    navContainer: ".navbar-container",
    navMenu: ".navbar-menu",
    navStart: ".navbar-start-button"
  };

  var PRACTICE_KEYWORDS = [
    "divorce",
    "legal separation",
    "parenting",
    "legal decision",
    "child support",
    "spousal",
    "maintenance",
    "document preparation",
    "filing",
    "modification",
    "enforcement",
    "court appearances",
    "licensed scope"
  ];

  var EXTRA_PATHWAYS = [
    {
      title: "Paternity",
      sub: "Parentage, birth certificate, DNA testing, parenting time, or support.",
      key: "paternity"
    },
    {
      title: "Protective Orders",
      sub: "Family-law related safety concerns, protective orders, or related hearings.",
      key: "protective-order"
    },
    {
      title: "Mediation / ADR",
      sub: "Negotiation, mediation, arbitration, settlement, or lower-conflict resolution.",
      key: "mediation-adr"
    },
    {
      title: "Not Sure Where to Start?",
      sub: "Use guided triage so the next step can be identified before services are confirmed.",
      key: "not-sure"
    }
  ];

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

  function findSectionByText(textNeedles) {
    var sections = getAll("section, div");
    var needles = textNeedles.map(normalizeText);

    for (var i = 0; i < sections.length; i += 1) {
      var text = normalizeText(sections[i].textContent);

      var matched = needles.every(function (needle) {
        return text.indexOf(needle) !== -1;
      });

      if (matched) {
        return sections[i];
      }
    }

    return null;
  }

  function getIntakeElement() {
    return getFirst(SELECTORS.intake);
  }

  function getPracticeElement() {
    return (
      getFirst(SELECTORS.practice) ||
      findSectionByText(["family law services", "practical help"])
    );
  }

  function getFeesElement() {
    return (
      getFirst(SELECTORS.fees) ||
      findSectionByText(["fees", "service options"]) ||
      findSectionByText(["quick question consultation", "full initial consultation"])
    );
  }

  function getGuidesElement() {
    return (
      getFirst(SELECTORS.guides) ||
      findSectionByText(["diy arizona guides"]) ||
      findSectionByText(["step-by-step education paths"])
    );
  }

  function getHeroElement() {
    return getFirst(SELECTORS.hero) || findSectionByText(["clear family law guidance"]);
  }

  function getNavElement() {
    return getFirst(SELECTORS.nav);
  }

  function updateScrollState() {
    var nav = getNavElement();
    var threshold = 44;
    var isScrolled = window.scrollY > threshold;

    if (isScrolled) {
      document.body.classList.add("mflg-nav-scrolled");
      if (nav) nav.classList.add("mflg-nav-is-scrolled");
    } else {
      document.body.classList.remove("mflg-nav-scrolled");
      if (nav) nav.classList.remove("mflg-nav-is-scrolled");
    }
  }

  function initNav() {
    var nav = getNavElement();
    var container = getFirst(SELECTORS.navContainer);
    var menu = getFirst(SELECTORS.navMenu);

    if (!nav) return;

    nav.classList.add("mflg-enhanced-nav");

    if (container) {
      container.classList.add("mflg-enhanced-nav-container");
    }

    if (menu) {
      menu.classList.add("mflg-enhanced-nav-menu");
    }

    updateScrollState();

    window.addEventListener(
      "scroll",
      function () {
        updateScrollState();
      },
      { passive: true }
    );

    window.addEventListener("resize", updateScrollState);
  }

  function routeLinkToElement(link, targetElement) {
    if (!link || !targetElement) return;

    if (link.__mflgRouted) return;
    link.__mflgRouted = true;

    link.addEventListener("click", function (event) {
      event.preventDefault();
      scrollToElement(targetElement);
    });
  }

  function routeElementToIntake(element, pathwayKey) {
    var intake = getIntakeElement();

    if (!element || !intake) return;
    if (element.__mflgIntakePathRouted) return;

    element.__mflgIntakePathRouted = true;

    if (pathwayKey) {
      element.setAttribute("data-mflg-pathway", pathwayKey);
    }

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");

    element.addEventListener("click", function (event) {
      var target = event.target;

      if (
        target &&
        target.closest &&
        target.closest("a, button, input, select, textarea, label")
      ) {
        return;
      }

      event.preventDefault();
      scrollToElement(intake);
    });

    element.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollToElement(intake);
      }
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
      className.indexOf("navbar-start-button") !== -1 ||
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
      text === "practice areas" ||
      text.indexOf("view practice areas") !== -1 ||
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
      text.indexOf("view full fees") !== -1 ||
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
    setAnchorId(getIntakeElement(), "intake");
    setAnchorId(getPracticeElement(), "practice-areas");
    setAnchorId(getFeesElement(), "fees");
    setAnchorId(getGuidesElement(), "guides");
  }

  function initNavRouting() {
    var intake = getIntakeElement();
    var practice = getPracticeElement();
    var fees = getFeesElement();
    var guides = getGuidesElement();
    var nav = getNavElement();

    if (!nav) return;

    var navLinks = getAll("a", nav);

    navLinks.forEach(function (link) {
      if (isStartLink(link)) {
        link.classList.add("mflg-start-link");
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

      if (
        normalizeText(link.textContent).indexOf("888") !== -1 ||
        normalizeText(link.getAttribute("href")).indexOf("tel:") === 0
      ) {
        link.classList.add("mflg-phone-link");
      }
    });
  }

  function initHeroCtas() {
    var intake = getIntakeElement();
    var practice = getPracticeElement();
    var hero = getHeroElement();

    if (!hero) return;

    hero.classList.add("mflg-hero-section");

    var heroLinks = getAll("a", hero);

    heroLinks.forEach(function (link) {
      var text = normalizeText(link.textContent);

      if (
        text.indexOf("schedule consultation") !== -1 ||
        text.indexOf("book") !== -1 ||
        text.indexOf("consultation") !== -1 ||
        text.indexOf("start guided intake") !== -1
      ) {
        link.textContent = "Start Guided Intake";
        link.classList.add("mflg-hero-primary-cta");
        link.setAttribute("href", "#intake");
        routeLinkToElement(link, intake);
      }

      if (
        text.indexOf("view practice") !== -1 ||
        text.indexOf("practice area") !== -1
      ) {
        link.classList.add("mflg-hero-secondary-cta");
        link.setAttribute("href", "#practice-areas");
        routeLinkToElement(link, practice);
      }
    });
  }

  function updateButtonText(button, newText) {
    if (!button) return;

    var nestedText = button.querySelector("span, div, strong");

    if (
      nestedText &&
      (
        normalizeText(nestedText.textContent).indexOf("book now") !== -1 ||
        normalizeText(nestedText.textContent).indexOf("request consultation") !== -1 ||
        normalizeText(nestedText.textContent).indexOf("request consult") !== -1
      )
    ) {
      nestedText.textContent = newText;
    } else {
      button.textContent = newText;
    }
  }

  function initFeesCtas() {
    var fees = getFeesElement();
    var intake = getIntakeElement();

    if (!fees || !intake) return;

    fees.classList.add("mflg-fees-section");

    var feeControls = getAll("a, button, [role='button']", fees);

    feeControls.forEach(function (control) {
      var text = normalizeText(control.textContent);
      var href = normalizeText(control.getAttribute("href"));

      if (
        text === "book now" ||
        text.indexOf("book now") !== -1 ||
        text.indexOf("request consultation") !== -1 ||
        text.indexOf("request consult") !== -1 ||
        text.indexOf("schedule") !== -1 ||
        text.indexOf("consultation") !== -1 ||
        href.indexOf("calendly") !== -1 ||
        href.indexOf("book") !== -1
      ) {
        updateButtonText(control, "Request Consult");
        control.classList.add("mflg-fee-cta");

        if (control.tagName.toLowerCase() === "a") {
          control.setAttribute("href", "#intake");
        }

        routeLinkToElement(control, intake);
      }

      if (text.indexOf("view full fees") !== -1) {
        if (control.tagName.toLowerCase() === "a") {
          control.setAttribute("href", "#fees");
        }

        routeLinkToElement(control, fees);
      }
    });
  }

  function inferPracticeKey(text) {
    var value = normalizeText(text);

    if (value.indexOf("divorce") !== -1 || value.indexOf("separation") !== -1) {
      return "divorce-separation";
    }

    if (value.indexOf("parenting") !== -1 || value.indexOf("decision") !== -1) {
      return "parenting";
    }

    if (value.indexOf("child support") !== -1 || value.indexOf("spousal") !== -1 || value.indexOf("maintenance") !== -1) {
      return "support-maintenance";
    }

    if (value.indexOf("document") !== -1 || value.indexOf("filing") !== -1) {
      return "documents";
    }

    if (value.indexOf("modification") !== -1 || value.indexOf("enforcement") !== -1) {
      return "modification-enforcement";
    }

    if (value.indexOf("court") !== -1 || value.indexOf("licensed scope") !== -1) {
      return "court-appearance";
    }

    return "family-law-pathway";
  }

  function looksLikePracticeCard(element) {
    if (!element) return false;

    var text = normalizeText(element.textContent);

    if (text.length < 18 || text.length > 420) return false;

    var hasKeyword = PRACTICE_KEYWORDS.some(function (keyword) {
      return text.indexOf(keyword) !== -1;
    });

    if (!hasKeyword) return false;

    var childCount = element.children ? element.children.length : 0;

    return childCount >= 1;
  }

  function findPracticeCards(section) {
    if (!section) return [];

    var candidates = getAll("a, article, .w-layout-cell, .w-dyn-item, div", section);
    var cards = [];

    candidates.forEach(function (candidate) {
      if (!looksLikePracticeCard(candidate)) return;

      var parentAlreadySelected = cards.some(function (existing) {
        return existing.contains(candidate);
      });

      if (parentAlreadySelected) return;

      var candidateContainsExisting = cards.some(function (existing) {
        return candidate.contains(existing);
      });

      if (candidateContainsExisting) return;

      cards.push(candidate);
    });

    return cards.slice(0, 8);
  }

  function addPracticeCue(card) {
    if (!card) return;
    if (card.querySelector(".mflg-practice-path-cue")) return;

    var cue = document.createElement("span");
    cue.className = "mflg-practice-path-cue";
    cue.textContent = "Start path →";

    card.appendChild(cue);
  }

  function createPathwayPill(pathway) {
    var button = document.createElement("button");

    button.type = "button";
    button.className = "mflg-pathway-pill";
    button.setAttribute("data-mflg-pathway", pathway.key);

    button.innerHTML =
      '<span class="mflg-pathway-pill-title">' +
      pathway.title +
      '</span>' +
      '<span class="mflg-pathway-pill-sub">' +
      pathway.sub +
      '</span>' +
      '<span class="mflg-pathway-pill-cta">Start path →</span>';

    routeElementToIntake(button, pathway.key);

    return button;
  }

  function addExtraPathways(section) {
    if (!section) return;
    if (section.querySelector(".mflg-pathways-wrap")) return;

    var wrap = document.createElement("div");
    wrap.className = "mflg-pathways-wrap";

    var kicker = document.createElement("span");
    kicker.className = "mflg-pathways-kicker";
    kicker.textContent = "More family-law pathways";

    var grid = document.createElement("div");
    grid.className = "mflg-pathways-grid";

    EXTRA_PATHWAYS.forEach(function (pathway) {
      grid.appendChild(createPathwayPill(pathway));
    });

    wrap.appendChild(kicker);
    wrap.appendChild(grid);

    section.appendChild(wrap);
  }

  function initPracticeAreaPathways() {
    var practice = getPracticeElement();

    if (!practice) return;

    practice.classList.add("mflg-practice-enhanced");

    var cards = findPracticeCards(practice);

    cards.forEach(function (card) {
      var pathwayKey = inferPracticeKey(card.textContent);

      card.classList.add("mflg-practice-card");
      card.setAttribute("data-mflg-pathway", pathwayKey);

      addPracticeCue(card);
      routeElementToIntake(card, pathwayKey);
    });

    addExtraPathways(practice);
  }

  ready(function () {
    initAnchorIds();
    initNav();
    initNavRouting();
    initHeroCtas();
    initFeesCtas();
    initPracticeAreaPathways();
  });
})();
