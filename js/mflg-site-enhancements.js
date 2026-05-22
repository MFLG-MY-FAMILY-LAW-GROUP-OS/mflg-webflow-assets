/* MFLG Site Enhancements v1.8
   File: js/mflg-site-enhancements.js

   In accordance with MP v2:
   - Full JS replacement
   - Preserves locked intake architecture and validation
   - Preserves v1.7 cleanup stability
   - Keeps Practice Areas card routing to intake
   - Adds one controlled "View All Family Law Pathways" CTA under Practice Areas cards
   - CTA routes to intake for now because full Practice Areas page/expanded pathway section is not built yet
   - Does not inject dropdowns
   - Does not preselect intake values yet
   - Does not alter Webflow section structure
*/

(function () {
  "use strict";

  var SELECTORS = {
    intake: "#mflg-intake-root, #intake, [id*='intake']",
    practice:
      ".Practice-Areas-Preview-Section, .practice-areas-preview-section, [class*='Practice Areas Preview Section'], #practice-areas",
    fees:
      ".Fees-Section, .fees-section, [class*='Fees Section'], [class*='Fees-Section'], [class*='fees-section'], #fees",
    guides:
      ".Guides-Section, .guides-section, [class*='Guides Section'], [class*='Guides-Section'], [class*='guides-section'], #guides",
    hero:
      ".Hero-Section, .hero-section, [class*='Hero Section'], [class*='Hero-Section'], [class*='hero-section']",
    nav: ".navbar-fixed",
    navContainer: ".navbar-container",
    navMenu: ".navbar-menu"
  };

  var PRACTICE_CARDS = [
    {
      title: "Divorce & Legal Separation",
      key: "divorce-separation",
      aria: "Start intake pathway for divorce and legal separation"
    },
    {
      title: "Parenting Time & Legal Decision-Making",
      key: "parenting",
      aria: "Start intake pathway for parenting time and legal decision-making"
    },
    {
      title: "Child Support & Spousal Maintenance",
      key: "support-maintenance",
      aria: "Start intake pathway for child support and spousal maintenance"
    },
    {
      title: "Document Preparation & Filing",
      key: "documents",
      aria: "Start intake pathway for document preparation and filing"
    },
    {
      title: "Modifications & Enforcement",
      key: "modification-enforcement",
      aria: "Start intake pathway for modifications and enforcement"
    },
    {
      title: "Court Appearances Within Licensed Scope",
      key: "court-appearance",
      aria: "Start intake pathway for court appearances within licensed scope"
    }
  ];

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getFirst(selector, root) {
    try {
      return (root || document).querySelector(selector);
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

  function findNearestSectionFromElement(element) {
    if (!element) return null;

    return (
      element.closest("section") ||
      element.closest("[class*='Section']") ||
      element.closest("[class*='section']") ||
      element.parentElement
    );
  }

  function findSectionByExactHeading(headingText) {
    var headings = getAll("h1, h2, h3, h4, h5, h6");
    var target = normalizeText(headingText);

    for (var i = 0; i < headings.length; i += 1) {
      if (normalizeText(headings[i].textContent).indexOf(target) !== -1) {
        return findNearestSectionFromElement(headings[i]);
      }
    }

    return null;
  }

  function findSectionByTextPair(primaryText, secondaryText) {
    var sections = getAll("section, [class*='Section'], [class*='section']");
    var primary = normalizeText(primaryText);
    var secondary = normalizeText(secondaryText);

    for (var i = 0; i < sections.length; i += 1) {
      var text = normalizeText(sections[i].textContent);

      if (text.indexOf(primary) !== -1 && text.indexOf(secondary) !== -1) {
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
      findSectionByExactHeading("Practical help for Arizona family law matters") ||
      findSectionByTextPair("family law services", "divorce & legal separation")
    );
  }

  function getFeesElement() {
    return (
      getFirst(SELECTORS.fees) ||
      findSectionByTextPair("fees", "service options") ||
      findSectionByTextPair("quick question consultation", "full initial consultation")
    );
  }

  function getGuidesElement() {
    return (
      getFirst(SELECTORS.guides) ||
      findSectionByExactHeading("Step-by-step education paths") ||
      findSectionByTextPair("diy arizona guides", "read guide")
    );
  }

  function getHeroElement() {
    return (
      getFirst(SELECTORS.hero) ||
      findSectionByExactHeading("Clear Family Law Guidance") ||
      findSectionByTextPair("clear family law guidance", "more affordable path forward")
    );
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

  function markClickedCard(card) {
    if (!card) return;

    var practice = getPracticeElement();

    if (practice) {
      getAll(".mflg-practice-card", practice).forEach(function (item) {
        item.classList.remove("mflg-card-clicked");
      });
    }

    card.classList.add("mflg-card-clicked");

    window.setTimeout(function () {
      card.classList.remove("mflg-card-clicked");
    }, 900);
  }

  function routeElementToIntake(element, pathwayKey, ariaLabel) {
    var intake = getIntakeElement();

    if (!element || !intake) return;
    if (element.__mflgIntakePathRouted) return;

    element.__mflgIntakePathRouted = true;

    if (pathwayKey) {
      element.setAttribute("data-mflg-pathway", pathwayKey);
    }

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");

    if (ariaLabel) {
      element.setAttribute("aria-label", ariaLabel);
    }

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
      markClickedCard(element);
      scrollToElement(intake);
    });

    element.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        markClickedCard(element);
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

    return (
      text === "practice areas" ||
      text.indexOf("view practice areas") !== -1 ||
      text.indexOf("view all family law pathways") !== -1 ||
      href === "#practice-areas"
    );
  }

  function isFeesLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));

    return (
      text === "fees" ||
      text.indexOf("view full fees") !== -1 ||
      href === "#fees"
    );
  }

  function isGuidesLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));

    return (
      text === "guides" ||
      text.indexOf("view all guides") !== -1 ||
      href === "#guides"
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

  function removeOldInjectedPathwayRow() {
    getAll(".mflg-pathways-wrap").forEach(function (node) {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  function removePracticeViewAllButton() {
    getAll(".mflg-practice-view-all-wrap").forEach(function (node) {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  function removeAllPracticeCues() {
    getAll(".mflg-practice-path-cue").forEach(function (cue) {
      if (cue && cue.parentNode) {
        cue.parentNode.removeChild(cue);
      }
    });
  }

  function findHeadingByExactText(root, text) {
    var headings = getAll("h1, h2, h3, h4, h5, h6, strong, div", root);
    var target = normalizeText(text);

    for (var i = 0; i < headings.length; i += 1) {
      if (normalizeText(headings[i].textContent) === target) {
        return headings[i];
      }
    }

    return null;
  }

  function findBestCardAncestor(heading, section) {
    if (!heading || !section) return null;

    var current = heading;

    while (current && current !== section && current.parentElement) {
      var text = normalizeText(current.textContent);
      var className = normalizeText(current.className);
      var childCount = current.children ? current.children.length : 0;

      if (
        text.length >= 45 &&
        text.length <= 380 &&
        childCount >= 1 &&
        className.indexOf("hero") === -1 &&
        className.indexOf("guide") === -1 &&
        className.indexOf("fee") === -1 &&
        className.indexOf("nav") === -1
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return heading.parentElement;
  }

  function addPracticeCue(card) {
    if (!card) return;

    var cue = document.createElement("span");
    cue.className = "mflg-practice-path-cue";
    cue.textContent = "Start path →";

    card.appendChild(cue);
  }

  function getPracticeCardsInOrder(practice) {
    var cards = [];

    if (!practice) return cards;

    PRACTICE_CARDS.forEach(function (item) {
      var heading = findHeadingByExactText(practice, item.title);
      var card = findBestCardAncestor(heading, practice);

      if (card && cards.indexOf(card) === -1) {
        cards.push(card);
      }
    });

    return cards;
  }

  function addPracticeViewAllButton(practice, cards) {
    var intake = getIntakeElement();

    if (!practice || !cards || !cards.length || !intake) return;
    if (getFirst(".mflg-practice-view-all-wrap", practice)) return;

    var lastCard = cards[cards.length - 1];
    var cardGrid = lastCard.parentElement || practice;

    var wrap = document.createElement("div");
    wrap.className = "mflg-practice-view-all-wrap";

    var button = document.createElement("a");
    button.className = "mflg-practice-view-all";
    button.href = "#intake";
    button.textContent = "View All Family Law Pathways";
    button.setAttribute("aria-label", "View all family law pathways and start the guided intake");

    wrap.appendChild(button);

    if (cardGrid && cardGrid.parentElement) {
      cardGrid.parentElement.insertBefore(wrap, cardGrid.nextSibling);
    } else {
      practice.appendChild(wrap);
    }

    routeLinkToElement(button, intake);
  }

  function initPracticeAreaPathways() {
    var practice = getPracticeElement();

    removeOldInjectedPathwayRow();
    removePracticeViewAllButton();
    removeAllPracticeCues();

    if (!practice) return;

    practice.classList.add("mflg-practice-enhanced");

    var routedCards = [];

    PRACTICE_CARDS.forEach(function (item) {
      var heading = findHeadingByExactText(practice, item.title);
      var card = findBestCardAncestor(heading, practice);

      if (!card) return;

      card.classList.add("mflg-practice-card");
      card.setAttribute("data-mflg-pathway", item.key);

      addPracticeCue(card);
      routeElementToIntake(card, item.key, item.aria);

      if (routedCards.indexOf(card) === -1) {
        routedCards.push(card);
      }
    });

    addPracticeViewAllButton(practice, routedCards);
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
