/* MFLG Site Enhancements v1.9 JS-Only Exact Intake Routing Fix
   File: js/mflg-site-enhancements.js

   In accordance with MP v2:
   - JS-only replacement
   - Preserves locked intake architecture, layout, validation, payload, and conditional logic
   - Does not alter CSS
   - Does not rebuild Webflow structure
   - Does not touch hero layout/video/overlay
   - Keeps Hero Start Guided Intake as general intake entry
   - Routes Practice Area cards to intake using exact mflg-intake.js data-option-value clicks
   - Restores View All Family Law Pathways button if missing
   - Keeps Fees CTAs routed to intake and stores service-interest context for later use
   - Does not inject dropdowns, Pay Invoice, Client Login, or mobile/tablet logic
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

  /*
    Exact values must match js/mflg-intake.js issueOptions values:
    - Divorce / Legal Separation
    - Parenting Time / Legal Decision-Making
    - Child Support
    - Spousal Maintenance
    - Paternity
    - Modification of Existing Orders
    - Enforcement of Existing Orders
    - Mediation / ADR / Settlement Help
    - Protective Order Related to Family Law
    - Document Preparation / Review
    - Not Sure
  */

  var PRACTICE_CARDS = [
    {
      title: "Divorce & Legal Separation",
      key: "divorce-separation",
      intakeValue: "Divorce / Legal Separation",
      aria: "Start intake pathway for divorce and legal separation"
    },
    {
      title: "Parenting Time & Legal Decision-Making",
      key: "parenting",
      intakeValue: "Parenting Time / Legal Decision-Making",
      aria: "Start intake pathway for parenting time and legal decision-making"
    },
    {
      title: "Child Support & Spousal Maintenance",
      key: "support-maintenance",
      intakeValue: "Child Support",
      context: "Combined homepage card selected: Child Support & Spousal Maintenance",
      aria: "Start intake pathway for child support and spousal maintenance"
    },
    {
      title: "Document Preparation & Filing",
      key: "documents",
      intakeValue: "Document Preparation / Review",
      aria: "Start intake pathway for document preparation and filing"
    },
    {
      title: "Modifications & Enforcement",
      key: "modification-enforcement",
      intakeValue: "Modification of Existing Orders",
      context: "Combined homepage card selected: Modifications & Enforcement",
      aria: "Start intake pathway for modifications and enforcement"
    },
    {
      title: "Court Appearances Within Licensed Scope",
      key: "court-appearance",
      intakeValue: "Not Sure",
      context: "Court appearance or hearing help requested",
      aria: "Start intake pathway for court appearances within licensed scope"
    }
  ];

  var SERVICE_INTEREST_VALUES = {
    "quick-question": "Quick question / limited guidance",
    "initial-consult": "Full matter support within LP scope",
    "comprehensive-consult": "Full matter support within LP scope"
  };

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

  function safeSessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, String(value || ""));
    } catch (error) {
      /* sessionStorage may be unavailable; routing should still work */
    }
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

  function dispatchNativeEvents(element) {
    if (!element) return;

    ["input", "change"].forEach(function (eventName) {
      try {
        element.dispatchEvent(new Event(eventName, { bubbles: true }));
      } catch (error) {
        /* no-op */
      }
    });
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
      document.documentElement.classList.add("mflg-nav-scrolled");

      if (nav) {
        nav.classList.add("mflg-nav-is-scrolled");
      }
    } else {
      document.body.classList.remove("mflg-nav-scrolled");
      document.documentElement.classList.remove("mflg-nav-scrolled");

      if (nav) {
        nav.classList.remove("mflg-nav-is-scrolled");
      }
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

  function routeLinkToElement(link, targetElement, beforeScroll) {
    if (!link || !targetElement) return;
    if (link.__mflgRouted) return;

    link.__mflgRouted = true;

    link.addEventListener("click", function (event) {
      event.preventDefault();

      if (typeof beforeScroll === "function") {
        beforeScroll();
      }

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

  function findExactIntakeIssueButton(issueValue) {
    var intake = getIntakeElement();

    if (!intake || !issueValue) return null;

    var candidates = getAll("[data-option-group='issuePathway']", intake);

    for (var i = 0; i < candidates.length; i += 1) {
      if (candidates[i].getAttribute("data-option-value") === issueValue) {
        return candidates[i];
      }
    }

    return null;
  }

  function findSelectedIssueButton(issueValue) {
    var button = findExactIntakeIssueButton(issueValue);

    if (button && button.classList.contains("is-selected")) {
      return button;
    }

    return null;
  }

  function clickExactIntakeIssue(issueValue, context) {
    var intake = getIntakeElement();

    if (!intake || !issueValue) return false;

    safeSessionSet("mflgIntakeIssueExact", issueValue);

    if (context) {
      safeSessionSet("mflgIntakeContext", context);
      intake.setAttribute("data-mflg-routing-context", context);
    }

    intake.setAttribute("data-mflg-routed-issue", issueValue);

    var button = findExactIntakeIssueButton(issueValue);

    if (!button && issueValue !== "Not Sure") {
      button = findExactIntakeIssueButton("Not Sure");
    }

    if (!button) return false;

    try {
      button.click();
      return true;
    } catch (error) {
      return false;
    }
  }

  function preselectExactIssueWithRetry(issueValue, context) {
    var attempts = [0, 120, 300, 650, 1000];

    attempts.forEach(function (delay) {
      window.setTimeout(function () {
        if (findSelectedIssueButton(issueValue)) return;
        clickExactIntakeIssue(issueValue, context);
      }, delay);
    });
  }

  function setVisibleServiceInterest(serviceKey) {
    var intake = getIntakeElement();

    if (!intake || !serviceKey) return false;

    var value = SERVICE_INTEREST_VALUES[serviceKey] || SERVICE_INTEREST_VALUES["initial-consult"];

    safeSessionSet("mflgServiceInterest", serviceKey);
    safeSessionSet("mflgServiceInterestValue", value);

    intake.setAttribute("data-mflg-service-interest", serviceKey);
    intake.setAttribute("data-mflg-service-interest-value", value);

    var selects = getAll("select[data-key='serviceInterest']", intake);

    for (var i = 0; i < selects.length; i += 1) {
      var select = selects[i];
      var options = Array.prototype.slice.call(select.options || []);

      for (var j = 0; j < options.length; j += 1) {
        if (options[j].value === value || options[j].textContent === value) {
          select.value = options[j].value;
          dispatchNativeEvents(select);
          return true;
        }
      }
    }

    return false;
  }

  function initIntakeMutationObserver() {
    var intake = getIntakeElement();

    if (!intake || intake.__mflgMutationObserverAttached) return;

    intake.__mflgMutationObserverAttached = true;

    var observer = new MutationObserver(function () {
      var serviceKey = "";

      try {
        serviceKey = window.sessionStorage.getItem("mflgServiceInterest") || "";
      } catch (error) {
        serviceKey = "";
      }

      if (serviceKey) {
        setVisibleServiceInterest(serviceKey);
      }
    });

    observer.observe(intake, {
      childList: true,
      subtree: true
    });
  }

  function routeElementToIntake(element, pathwayKey, ariaLabel, issueValue, context) {
    var intake = getIntakeElement();

    if (!element || !intake) return;
    if (element.__mflgIntakePathRouted) return;

    element.__mflgIntakePathRouted = true;

    if (pathwayKey) {
      element.setAttribute("data-mflg-pathway", pathwayKey);
    }

    if (issueValue) {
      element.setAttribute("data-mflg-intake-value", issueValue);
    }

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");

    if (ariaLabel) {
      element.setAttribute("aria-label", ariaLabel);
    }

    function handlePathwayStart(event) {
      var target = event.target;

      if (
        target &&
        target.closest &&
        target.closest("a, button, input, select, textarea, label") &&
        !target.classList.contains("mflg-practice-path-cue")
      ) {
        return;
      }

      event.preventDefault();
      markClickedCard(element);

      preselectExactIssueWithRetry(issueValue || "Not Sure", context || "");
      scrollToElement(intake);
    }

    element.addEventListener("click", handlePathwayStart);

    element.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        handlePathwayStart(event);
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
        routeLinkToElement(link, intake, function () {
          safeSessionSet("mflgIntakeIssueExact", "");
        });
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
        routeLinkToElement(link, intake, function () {
          safeSessionSet("mflgIntakeIssueExact", "");
        });
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

  function inferServiceInterestFromCard(control) {
    var parent = control && control.closest
      ? control.closest("article, li, [class*='card'], [class*='Card'], [class*='fee'], [class*='Fee']")
      : null;

    var sourceText = normalizeText(
      [
        control ? control.textContent : "",
        parent ? parent.textContent : ""
      ].join(" ")
    );

    if (
      sourceText.indexOf("15") !== -1 ||
      sourceText.indexOf("quick question") !== -1
    ) {
      return "quick-question";
    }

    if (
      sourceText.indexOf("60") !== -1 ||
      sourceText.indexOf("comprehensive") !== -1
    ) {
      return "comprehensive-consult";
    }

    if (
      sourceText.indexOf("30") !== -1 ||
      sourceText.indexOf("initial") !== -1
    ) {
      return "initial-consult";
    }

    return "initial-consult";
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

        routeLinkToElement(control, intake, function () {
          var serviceKey = inferServiceInterestFromCard(control);

          safeSessionSet("mflgServiceInterest", serviceKey);
          setVisibleServiceInterest(serviceKey);
        });
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
    getAll(".mflg-practice-view-all-wrap, .mflg-view-pathways-wrap").forEach(function (node) {
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

  function applyInlineViewAllStyles(wrap, button) {
    if (wrap) {
      wrap.style.display = "flex";
      wrap.style.justifyContent = "center";
      wrap.style.alignItems = "center";
      wrap.style.width = "100%";
      wrap.style.marginTop = "34px";
      wrap.style.marginBottom = "6px";
    }

    if (button) {
      button.style.display = "inline-flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.minHeight = "42px";
      button.style.padding = "13px 28px";
      button.style.borderRadius = "999px";
      button.style.background = "#02457A";
      button.style.color = "#fff";
      button.style.fontSize = "11px";
      button.style.fontWeight = "800";
      button.style.letterSpacing = "0.14em";
      button.style.textTransform = "uppercase";
      button.style.textDecoration = "none";
      button.style.border = "1px solid rgba(255,255,255,0.14)";
      button.style.boxShadow = "0 14px 30px rgba(2,69,122,0.24)";
      button.style.cursor = "pointer";
    }
  }

  function findFullPathwaySection() {
    return (
      getFirst("#family-law-pathways") ||
      getFirst("#all-family-law-pathways") ||
      getFirst("#pathways") ||
      getFirst("[data-section='family-law-pathways']") ||
      findSectionByExactHeading("Family Law Pathways") ||
      findSectionByExactHeading("All Family Law Pathways") ||
      findSectionByTextPair("paternity", "protective orders")
    );
  }

  function addPracticeViewAllButton(practice, cards) {
    var intake = getIntakeElement();

    if (!practice || !cards || !cards.length || !intake) return;
    if (getFirst(".mflg-practice-view-all-wrap, .mflg-view-pathways-wrap", practice)) return;

    var lastCard = cards[cards.length - 1];
    var cardGrid = lastCard.parentElement || practice;
    var destination = findFullPathwaySection() || intake;

    var wrap = document.createElement("div");
    wrap.className = "mflg-practice-view-all-wrap mflg-view-pathways-wrap";

    var button = document.createElement("a");
    button.className = "mflg-practice-view-all mflg-view-pathways-button";
    button.href = destination === intake ? "#intake" : "#" + (destination.id || "family-law-pathways");
    button.textContent = "View All Family Law Pathways";
    button.setAttribute("aria-label", "View all family law pathways");

    wrap.appendChild(button);
    applyInlineViewAllStyles(wrap, button);

    if (cardGrid && cardGrid.parentElement) {
      cardGrid.parentElement.insertBefore(wrap, cardGrid.nextSibling);
    } else {
      practice.appendChild(wrap);
    }

    routeLinkToElement(button, destination);
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
      card.setAttribute("data-mflg-intake-value", item.intakeValue);

      addPracticeCue(card);

      routeElementToIntake(
        card,
        item.key,
        item.aria,
        item.intakeValue,
        item.context || ""
      );

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
    initIntakeMutationObserver();
  });
})();
