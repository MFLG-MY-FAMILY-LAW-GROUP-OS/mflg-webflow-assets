/* MFLG Site Enhancements v2.1
   File: js/mflg-site-enhancements.js

   In accordance with MP v2:
   - Full JS replacement
   - JS-only route override fix
   - Preserves stable CSS baseline
   - Preserves locked intake architecture, validation, payload, and conditional logic
   - Uses window.MFLGIntakeRoute(...) when available
   - Every Practice Area / Full Pathway click overwrites the prior route context
   - Hero Start / Nav Start route to general triage instead of preserving stale issue context
   - Fees Request Consult updates consultation context without erasing an intentionally selected issue
   - View All Family Law Pathways scrolls to full pathway section
   - No CSS changes
   - No hero/video/layout changes
   - No dropdowns, Pay Invoice, Client Login, language selector, or mobile/tablet build
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

  var EXACT_ISSUES = {
    divorce: "Divorce / Legal Separation",
    parenting: "Parenting Time / Legal Decision-Making",
    childSupport: "Child Support",
    spousalMaintenance: "Spousal Maintenance",
    paternity: "Paternity",
    modification: "Modification of Existing Orders",
    enforcement: "Enforcement of Existing Orders",
    mediationAdr: "Mediation / ADR / Settlement Help",
    protectiveOrder: "Protective Order Related to Family Law",
    documents: "Document Preparation / Review",
    notSure: "Not Sure"
  };

  var SERVICE_INTEREST = {
    quickQuestion: "Quick question / limited guidance",
    initialConsult: "Full matter support within LP scope",
    comprehensiveConsult: "Full matter support within LP scope"
  };

  var PRACTICE_CARDS = [
    {
      title: "Divorce & Legal Separation",
      key: "divorce-separation",
      intakeValue: EXACT_ISSUES.divorce,
      entryLabel: "Divorce & Legal Separation",
      contextNote: "You selected Divorce & Legal Separation. We started that intake pathway for you. You can change the issue below if needed.",
      aria: "Start intake pathway for divorce and legal separation"
    },
    {
      title: "Parenting Time & Legal Decision-Making",
      key: "parenting",
      intakeValue: EXACT_ISSUES.parenting,
      entryLabel: "Parenting Time & Legal Decision-Making",
      contextNote: "You selected Parenting Time & Legal Decision-Making. We started that intake pathway for you. You can change the issue below if needed.",
      aria: "Start intake pathway for parenting time and legal decision-making"
    },
    {
      title: "Child Support & Spousal Maintenance",
      key: "support-maintenance",
      intakeValue: EXACT_ISSUES.childSupport,
      entryLabel: "Child Support & Spousal Maintenance",
      contextNote:
        "You selected Child Support & Spousal Maintenance. We started with Child Support because it is one of the closest intake pathways. If Spousal Maintenance is closer, you can select it below.",
      aria: "Start intake pathway for child support and spousal maintenance"
    },
    {
      title: "Document Preparation & Filing",
      key: "documents",
      intakeValue: EXACT_ISSUES.documents,
      entryLabel: "Document Preparation & Filing",
      contextNote: "You selected Document Preparation & Filing. We started the document preparation and review pathway for you. You can change the issue below if needed.",
      aria: "Start intake pathway for document preparation and filing"
    },
    {
      title: "Modifications & Enforcement",
      key: "modification-enforcement",
      intakeValue: EXACT_ISSUES.modification,
      entryLabel: "Modifications & Enforcement",
      contextNote:
        "You selected Modifications & Enforcement. We started with Modification because it appears to be the closest intake pathway. If Enforcement is closer, you can select it below.",
      aria: "Start intake pathway for modifications and enforcement"
    },
    {
      title: "Court Appearances Within Licensed Scope",
      key: "court-appearance",
      intakeValue: EXACT_ISSUES.documents,
      entryLabel: "Court Appearances Within Licensed Scope",
      contextNote:
        "You selected Court Appearances Within Licensed Scope. We started with Document Preparation / Review because hearing help often depends on the filing, order, notice, or response involved. You can change the issue below if needed.",
      aria: "Start intake pathway for court appearances within licensed scope"
    }
  ];

  var FULL_PATHWAYS = [
    {
      title: "Divorce / Legal Separation",
      sub: "Dissolution, legal separation, annulment, temporary orders, or consent decree.",
      intakeValue: EXACT_ISSUES.divorce,
      contextNote: "You selected Divorce / Legal Separation. We started that intake pathway for you."
    },
    {
      title: "Parenting Time / Legal Decision-Making",
      sub: "Parenting plans, legal decision-making, parenting schedules, or parenting disputes.",
      intakeValue: EXACT_ISSUES.parenting,
      contextNote: "You selected Parenting Time / Legal Decision-Making. We started that intake pathway for you."
    },
    {
      title: "Child Support",
      sub: "Establish, modify, enforce, calculate, or review child support.",
      intakeValue: EXACT_ISSUES.childSupport,
      contextNote: "You selected Child Support. We started that intake pathway for you."
    },
    {
      title: "Spousal Maintenance",
      sub: "Request, respond to, modify, enforce, or review spousal maintenance issues.",
      intakeValue: EXACT_ISSUES.spousalMaintenance,
      contextNote: "You selected Spousal Maintenance. We started that intake pathway for you."
    },
    {
      title: "Paternity",
      sub: "Parentage, birth certificate, DNA testing, parenting time, or support.",
      intakeValue: EXACT_ISSUES.paternity,
      contextNote: "You selected Paternity. We started that intake pathway for you."
    },
    {
      title: "Modification",
      sub: "Change parenting, support, maintenance, relocation, or other family-court orders.",
      intakeValue: EXACT_ISSUES.modification,
      contextNote: "You selected Modification. We started that intake pathway for you."
    },
    {
      title: "Enforcement",
      sub: "Orders not being followed, contempt, arrears, or missed parenting time.",
      intakeValue: EXACT_ISSUES.enforcement,
      contextNote: "You selected Enforcement. We started that intake pathway for you."
    },
    {
      title: "Mediation / ADR",
      sub: "Mediation, negotiation, arbitration, settlement, or agreement review.",
      intakeValue: EXACT_ISSUES.mediationAdr,
      contextNote: "You selected Mediation / ADR. We started that intake pathway for you."
    },
    {
      title: "Protective Orders",
      sub: "Family-law related safety concerns, protective orders, or related hearings.",
      intakeValue: EXACT_ISSUES.protectiveOrder,
      contextNote: "You selected Protective Orders. We started that intake pathway for you."
    },
    {
      title: "Document Preparation",
      sub: "Prepare, review, file, or respond to family-law documents.",
      intakeValue: EXACT_ISSUES.documents,
      contextNote: "You selected Document Preparation. We started that intake pathway for you."
    },
    {
      title: "Court Appearance / Hearing Help",
      sub: "Hearing preparation, court notices, limited-scope appearance review, or next-step triage.",
      intakeValue: EXACT_ISSUES.documents,
      contextNote:
        "You selected Court Appearance / Hearing Help. We started with Document Preparation / Review because hearing help often depends on the filing, order, notice, or response involved. You can change the issue below if needed."
    },
    {
      title: "Relocation",
      sub: "Arizona relocation issues tied to parenting time or legal decision-making.",
      intakeValue: EXACT_ISSUES.parenting,
      contextNote:
        "You selected Relocation. We started with Parenting Time / Legal Decision-Making because relocation is usually reviewed through the parenting pathway. You can change the issue below if needed."
    },
    {
      title: "Third-Party / Grandparent Rights",
      sub: "Grandparent or third-party rights connected to Arizona family-law matters.",
      intakeValue: EXACT_ISSUES.parenting,
      contextNote:
        "You selected Third-Party / Grandparent Rights. We started with Parenting Time / Legal Decision-Making because that is the closest intake pathway. You can change the issue below if needed."
    },
    {
      title: "UCCJEA / Interstate Custody",
      sub: "Interstate custody, jurisdiction, out-of-state orders, or children recently outside Arizona.",
      intakeValue: EXACT_ISSUES.parenting,
      contextNote:
        "You selected UCCJEA / Interstate Custody. We started with Parenting Time / Legal Decision-Making because interstate custody issues are usually reviewed through the parenting pathway. You can change the issue below if needed."
    },
    {
      title: "Not Sure Where to Start",
      sub: "Use guided triage so the next step can be identified before services are confirmed.",
      intakeValue: EXACT_ISSUES.notSure,
      contextNote: "You selected Not Sure Where to Start. We started the general triage pathway for you."
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

  function slug(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, String(value || ""));
    } catch (error) {
      /* no-op */
    }
  }

  function storageRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      /* no-op */
    }
  }

  function storageSetRoute(context) {
    try {
      window.sessionStorage.setItem("mflgRouteContext", JSON.stringify(context || {}));
    } catch (error) {
      /* no-op */
    }
  }

  function clearLegacyRoutingStorage() {
    storageRemove("mflgRouteContext");
    storageRemove("mflgIntakeIssueExact");
    storageRemove("mflgIntakeIssue");
    storageRemove("mflgIntakeContext");
    storageRemove("mflgEntrySource");
    storageRemove("mflgEntryLabel");
    storageRemove("mflgServiceInterest");
    storageRemove("mflgServiceInterestValue");
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

      if (nav) nav.classList.add("mflg-nav-is-scrolled");
    } else {
      document.body.classList.remove("mflg-nav-scrolled");
      document.documentElement.classList.remove("mflg-nav-scrolled");

      if (nav) nav.classList.remove("mflg-nav-is-scrolled");
    }
  }

  function initNav() {
    var nav = getNavElement();
    var container = getFirst(SELECTORS.navContainer);
    var menu = getFirst(SELECTORS.navMenu);

    if (!nav) return;

    nav.classList.add("mflg-enhanced-nav");

    if (container) container.classList.add("mflg-enhanced-nav-container");
    if (menu) menu.classList.add("mflg-enhanced-nav-menu");

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

  function fallbackClickIssue(issueValue) {
    var button = findExactIntakeIssueButton(issueValue);

    if (!button && issueValue !== EXACT_ISSUES.notSure) {
      button = findExactIntakeIssueButton(EXACT_ISSUES.notSure);
    }

    if (!button) return false;

    try {
      button.click();
      return true;
    } catch (error) {
      return false;
    }
  }

  function applyIntakeRoute(context) {
    var route = context || {};
    var intake = getIntakeElement();

    clearLegacyRoutingStorage();
    storageSetRoute(route);

    storageSet("mflgEntrySource", route.entrySource || "");
    storageSet("mflgEntryLabel", route.entryLabel || "");
    storageSet("mflgIntakeContext", route.contextNote || "");
    storageSet("mflgIntakeIssueExact", route.issuePathway || "");
    storageSet("mflgServiceInterestValue", route.serviceInterest || "");

    if (typeof window.MFLGIntakeRoute === "function") {
      window.MFLGIntakeRoute(route);
      return true;
    }

    if (route.issuePathway) {
      [0, 120, 300, 650, 1000].forEach(function (delay) {
        window.setTimeout(function () {
          fallbackClickIssue(route.issuePathway);
        }, delay);
      });

      return true;
    }

    if (intake) {
      intake.setAttribute("data-mflg-routing-context", route.contextNote || route.entryLabel || "");
    }

    return false;
  }

  function applyGeneralIntakeRoute(sourceLabel) {
    return applyIntakeRoute({
      entrySource: "general-start",
      entryLabel: sourceLabel || "Start Guided Intake",
      issuePathway: EXACT_ISSUES.notSure,
      serviceInterest: "",
      contextNote:
        "Start with the closest issue below. If you are unsure, continue with Not Sure and we will ask broader triage questions.",
      routedAt: new Date().toISOString()
    });
  }

  function applyFeesRoute(serviceKey, label) {
    var serviceValue = SERVICE_INTEREST.initialConsult;

    if (serviceKey === "quick-question") {
      serviceValue = SERVICE_INTEREST.quickQuestion;
    }

    if (serviceKey === "comprehensive-consult") {
      serviceValue = SERVICE_INTEREST.comprehensiveConsult;
    }

    return applyIntakeRoute({
      entrySource: "fees",
      entryLabel: label || "Request Consult",
      issuePathway: "",
      serviceInterest: serviceValue,
      contextNote:
        "Consultation request started. Choose or confirm the closest legal issue below so we can complete conflict, scope, and next-step review before confirming services.",
      routedAt: new Date().toISOString()
    });
  }

  function applyPathwayRoute(item, source) {
    if (!item) return false;

    return applyIntakeRoute({
      entrySource: source || "pathway",
      entryLabel: item.entryLabel || item.title || "",
      issuePathway: item.intakeValue || EXACT_ISSUES.notSure,
      serviceInterest: "",
      contextNote: item.contextNote || "",
      routedAt: new Date().toISOString()
    });
  }

  function markClickedCard(card) {
    if (!card) return;

    getAll(".mflg-practice-card, .mflg-full-pathway-card").forEach(function (item) {
      item.classList.remove("mflg-card-clicked");
    });

    card.classList.add("mflg-card-clicked");

    window.setTimeout(function () {
      card.classList.remove("mflg-card-clicked");
    }, 900);
  }

  function routeElementToIntake(element, pathwayKey, ariaLabel, item, source) {
    var intake = getIntakeElement();

    if (!element || !intake) return;
    if (element.__mflgIntakePathRouted) return;

    element.__mflgIntakePathRouted = true;

    if (pathwayKey) element.setAttribute("data-mflg-pathway", pathwayKey);
    if (item && item.intakeValue) element.setAttribute("data-mflg-intake-value", item.intakeValue);

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");

    if (ariaLabel) element.setAttribute("aria-label", ariaLabel);

    function handlePathwayStart(event) {
      var target = event.target;

      if (
        target &&
        target.closest &&
        target.closest("a, button, input, select, textarea, label") &&
        !target.classList.contains("mflg-practice-path-cue") &&
        !target.classList.contains("mflg-pathway-start")
      ) {
        return;
      }

      event.preventDefault();

      markClickedCard(element);
      applyPathwayRoute(item, source || "pathway-card");
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

    return text === "fees" || text.indexOf("view full fees") !== -1 || href === "#fees";
  }

  function isGuidesLink(link) {
    var text = normalizeText(link.textContent);
    var href = normalizeText(link.getAttribute("href"));

    return text === "guides" || text.indexOf("view all guides") !== -1 || href === "#guides";
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

    getAll("a", nav).forEach(function (link) {
      if (isStartLink(link)) {
        link.classList.add("mflg-start-link");
        link.setAttribute("href", "#intake");
        routeLinkToElement(link, intake, function () {
          applyGeneralIntakeRoute("Start Guided Intake");
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

    getAll("a", hero).forEach(function (link) {
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
          applyGeneralIntakeRoute("Start Guided Intake");
        });
      }

      if (text.indexOf("view practice") !== -1 || text.indexOf("practice area") !== -1) {
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

    var sourceText = normalizeText([control ? control.textContent : "", parent ? parent.textContent : ""].join(" "));

    if (sourceText.indexOf("15") !== -1 || sourceText.indexOf("quick question") !== -1) {
      return "quick-question";
    }

    if (sourceText.indexOf("60") !== -1 || sourceText.indexOf("comprehensive") !== -1) {
      return "comprehensive-consult";
    }

    if (sourceText.indexOf("30") !== -1 || sourceText.indexOf("initial") !== -1) {
      return "initial-consult";
    }

    return "initial-consult";
  }

  function labelFromServiceKey(serviceKey) {
    if (serviceKey === "quick-question") return "Quick Question Consultation";
    if (serviceKey === "comprehensive-consult") return "Comprehensive Consultation";
    return "Initial Consultation";
  }

  function initFeesCtas() {
    var fees = getFeesElement();
    var intake = getIntakeElement();

    if (!fees || !intake) return;

    fees.classList.add("mflg-fees-section");

    getAll("a, button, [role='button']", fees).forEach(function (control) {
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
          applyFeesRoute(serviceKey, labelFromServiceKey(serviceKey));
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
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function removePracticeViewAllButton() {
    getAll(".mflg-practice-view-all-wrap, .mflg-view-pathways-wrap").forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function removeAllPracticeCues() {
    getAll(".mflg-practice-path-cue").forEach(function (cue) {
      if (cue && cue.parentNode) cue.parentNode.removeChild(cue);
    });
  }

  function removeExistingFullPathwaysSection() {
    getAll("#family-law-pathways, .mflg-full-pathways").forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
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

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function createFullPathwaysSection() {
    var section = document.createElement("section");

    section.id = "family-law-pathways";
    section.className = "mflg-full-pathways";
    section.setAttribute("data-section", "family-law-pathways");

    section.style.position = "relative";
    section.style.background = "#fbf7ee";
    section.style.padding = "88px 24px 96px";
    section.style.overflow = "hidden";

    var inner = document.createElement("div");
    inner.className = "mflg-full-pathways-inner";
    inner.style.maxWidth = "1180px";
    inner.style.margin = "0 auto";

    var header = document.createElement("div");
    header.className = "mflg-full-pathways-header";
    header.style.maxWidth = "780px";
    header.style.margin = "0 auto 38px";
    header.style.textAlign = "center";

    header.innerHTML =
      '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;color:#c79a2b;margin-bottom:12px;">Full Family Law Pathways</div>' +
      '<h2 style="margin:0;color:#06101a;font-size:clamp(34px,4vw,52px);line-height:1.02;letter-spacing:-.035em;">Find the path that fits your matter.</h2>' +
      '<p style="margin:18px auto 0;color:rgba(11,17,24,.72);font-size:16px;line-height:1.7;max-width:700px;">Choose the closest topic below. Each path starts the guided intake with the matching issue selected so your submission can be reviewed for conflicts, service scope, urgency, and next-step fit.</p>';

    var grid = document.createElement("div");
    grid.className = "mflg-full-pathways-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    grid.style.gap = "16px";

    FULL_PATHWAYS.forEach(function (item) {
      var card = document.createElement("article");

      card.className = "mflg-full-pathway-card";
      card.setAttribute("data-mflg-intake-value", item.intakeValue);
      card.setAttribute("data-mflg-pathway-title", item.title);
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Start intake pathway for " + item.title);

      card.style.background = "rgba(255,255,255,.86)";
      card.style.border = "1px solid rgba(11,17,24,.08)";
      card.style.borderRadius = "22px";
      card.style.padding = "22px 22px 20px";
      card.style.boxShadow = "0 14px 32px rgba(6,16,26,.06)";
      card.style.cursor = "pointer";
      card.style.transition = "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease";

      card.innerHTML =
        '<h3 style="margin:0;color:#06101a;font-size:18px;line-height:1.2;letter-spacing:-.01em;">' +
        escapeHtml(item.title) +
        '</h3>' +
        '<p style="margin:10px 0 0;color:rgba(11,17,24,.68);font-size:13px;line-height:1.55;">' +
        escapeHtml(item.sub) +
        '</p>' +
        '<span class="mflg-pathway-start" style="display:inline-flex;margin-top:16px;color:#02457a;font-size:10px;line-height:1;letter-spacing:.13em;text-transform:uppercase;font-weight:800;">Start path →</span>';

      card.addEventListener("mouseenter", function () {
        card.style.transform = "translateY(-3px)";
        card.style.borderColor = "rgba(199,154,43,.36)";
        card.style.boxShadow = "0 22px 48px rgba(6,16,26,.12)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
        card.style.borderColor = "rgba(11,17,24,.08)";
        card.style.boxShadow = "0 14px 32px rgba(6,16,26,.06)";
      });

      routeElementToIntake(
        card,
        slug(item.title),
        "Start intake pathway for " + item.title,
        item,
        "full-pathway-card"
      );

      grid.appendChild(card);
    });

    var note = document.createElement("p");
    note.style.maxWidth = "760px";
    note.style.margin = "28px auto 0";
    note.style.textAlign = "center";
    note.style.color = "rgba(11,17,24,.62)";
    note.style.fontSize = "13px";
    note.style.lineHeight = "1.65";
    note.textContent =
      "Services are subject to Arizona Licensed Legal Paraprofessional scope, conflict review, and formal engagement. Matters outside licensed scope may require attorney involvement or referral coordination.";

    inner.appendChild(header);
    inner.appendChild(grid);
    inner.appendChild(note);
    section.appendChild(inner);

    return section;
  }

  function adjustFullPathwaysGrid() {
    var grid = getFirst(".mflg-full-pathways-grid");

    if (!grid) return;

    if (window.innerWidth <= 640) {
      grid.style.gridTemplateColumns = "1fr";
    } else if (window.innerWidth <= 991) {
      grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    } else {
      grid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    }
  }

  function insertFullPathwaysSection(practice) {
    if (!practice) return null;

    removeExistingFullPathwaysSection();

    var section = createFullPathwaysSection();
    var fees = getFeesElement();

    if (fees && fees.parentNode) {
      fees.parentNode.insertBefore(section, fees);
    } else if (practice.parentNode) {
      practice.parentNode.insertBefore(section, practice.nextSibling);
    }

    adjustFullPathwaysGrid();
    window.addEventListener("resize", adjustFullPathwaysGrid);

    return section;
  }

  function findFullPathwaySection() {
    return getFirst("#family-law-pathways") || getFirst("[data-section='family-law-pathways']");
  }

  function addPracticeViewAllButton(practice, cards) {
    var pathwaySection = findFullPathwaySection();

    if (!practice || !cards || !cards.length || !pathwaySection) return;
    if (getFirst(".mflg-practice-view-all-wrap, .mflg-view-pathways-wrap", practice)) return;

    var lastCard = cards[cards.length - 1];
    var cardGrid = lastCard.parentElement || practice;

    var wrap = document.createElement("div");
    wrap.className = "mflg-practice-view-all-wrap mflg-view-pathways-wrap";

    var button = document.createElement("a");
    button.className = "mflg-practice-view-all mflg-view-pathways-button";
    button.href = "#family-law-pathways";
    button.textContent = "View All Family Law Pathways";
    button.setAttribute("aria-label", "View all family law pathways");

    wrap.appendChild(button);
    applyInlineViewAllStyles(wrap, button);

    if (cardGrid && cardGrid.parentElement) {
      cardGrid.parentElement.insertBefore(wrap, cardGrid.nextSibling);
    } else {
      practice.appendChild(wrap);
    }

    routeLinkToElement(button, pathwaySection);
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
        item,
        "practice-card"
      );

      if (routedCards.indexOf(card) === -1) {
        routedCards.push(card);
      }
    });

    var pathwaySection = insertFullPathwaysSection(practice);

    if (pathwaySection) {
      addPracticeViewAllButton(practice, routedCards);
    }
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
