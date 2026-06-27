(function () {
  const root = document.querySelector("[data-page-root]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const header = document.querySelector("[data-header]");
  const scrollPositions = new Map();
  let activeRenderPath = "/";
  let afterHeroAnchorAvailable = false;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const sectionFlow = [
    { path: "/", label: "Home" },
    { path: "/practice-areas", label: "Practice Areas" },
    { path: "/fees", label: "Fees" },
    { path: "/guides", label: "DIY Guides" },
    { path: "/tools", label: "Forms & Calculators" },
    { path: "/about", label: "About" },
    { path: "/faq", label: "FAQ" },
    { path: "/contact", label: "Contact" }
  ];

  const routes = {
    "/": home,
    "/practice-areas": practiceAreas,
    "/fees": fees,
    "/guides": guides,
    "/tools": tools,
    "/forms": tools,
    "/calculators": tools,
    "/about": about,
    "/faq": faq,
    "/contact": contact,
    "/start": start,
    "/client": clientLogin,
    "/staff": staffLogin,
    "/client-login": clientLogin,
    "/staff-login": staffLogin,
    "/privacy": privacy,
    "/terms": terms,
    "/accessibility": accessibility,
    "/thank-you": thankYou,
    "/404": notFound
  };

  const defaultMeta = {
    title: "MY FAMILY LAW GROUP PLLC",
    description: "Arizona family law guidance, legal document services, and guided intake from MY FAMILY LAW GROUP PLLC."
  };

  const routeMeta = {
    "/": {
      title: "Arizona Family Law Help | MY FAMILY LAW GROUP PLLC",
      description: "Arizona family law help from a licensed Legal Paraprofessional for divorce, parenting time, child support, legal decision-making, forms, and guided intake."
    },
    "/practice-areas": {
      title: "Practice Areas | MY FAMILY LAW GROUP PLLC",
      description: "Choose the Arizona family law issue closest to your situation, including divorce, parenting time, child support, paternity, modification, enforcement, and court preparation."
    },
    "/fees": {
      title: "Fees | MY FAMILY LAW GROUP PLLC",
      description: "Review published planning fees for Arizona family-law Legal Paraprofessional services, subject to conflict, licensed-scope, urgency, and service-fit review."
    },
    "/guides": {
      title: "DIY Family Law Guides | MY FAMILY LAW GROUP PLLC",
      description: "Use plain-language Arizona family-law DIY guides for forms, process orientation, and next-step planning before choosing guided intake or office review."
    },
    "/tools": {
      title: "Forms & Calculators | MY FAMILY LAW GROUP PLLC",
      description: "Find Arizona family-law forms, safe planning tools, deadline helpers, and calculator paths without entering private facts."
    },
    "/forms": {
      title: "Court Forms Finder | MY FAMILY LAW GROUP PLLC",
      description: "Find reviewed Arizona family-court form groups, court-source backup links, and guided intake paths without guessing."
    },
    "/calculators": {
      title: "Calculators & Planning Tools | MY FAMILY LAW GROUP PLLC",
      description: "Use safe Arizona family-law planning tools and calculator sources for support, parenting-time, deadlines, and next-step review."
    },
    "/about": {
      title: "About | MY FAMILY LAW GROUP PLLC",
      description: "Learn about MY FAMILY LAW GROUP PLLC and Arizona Legal Paraprofessional family-law services led by Jeremy James Jack JD, LP."
    },
    "/faq": {
      title: "FAQ | MY FAMILY LAW GROUP PLLC",
      description: "Search common Arizona family-law questions, Legal Paraprofessional scope answers, intake guidance, and plain-language legal terms."
    },
    "/contact": {
      title: "Contact | MY FAMILY LAW GROUP PLLC",
      description: "Contact MY FAMILY LAW GROUP PLLC or choose the right path for new matters, existing-client questions, deadlines, hearings, and access issues."
    },
    "/start": {
      title: "Start Guided Intake | MY FAMILY LAW GROUP PLLC",
      description: "Start Guided Intake so the office can review family-law issue type, county, urgency, documents, conflict, licensed scope, and next-step fit."
    },
    "/client": {
      title: "Client Portal | MY FAMILY LAW GROUP PLLC",
      description: "Review client access status, existing-client contact options, and secure access planning for MY FAMILY LAW GROUP PLLC."
    },
    "/staff": {
      title: "Staff Login | MY FAMILY LAW GROUP PLLC",
      description: "Restricted staff access for MY FAMILY LAW GROUP PLLC. Public visitors should use Guided Intake, Client Portal status, or Contact."
    },
    "/client-login": {
      title: "Client Portal | MY FAMILY LAW GROUP PLLC",
      description: "Review client access status, existing-client contact options, and secure access planning for MY FAMILY LAW GROUP PLLC."
    },
    "/staff-login": {
      title: "Staff Login | MY FAMILY LAW GROUP PLLC",
      description: "Restricted staff access for MY FAMILY LAW GROUP PLLC. Public visitors should use Guided Intake, Client Portal status, or Contact."
    },
    "/privacy": {
      title: "Privacy | MY FAMILY LAW GROUP PLLC",
      description: "Read how MY FAMILY LAW GROUP PLLC limits intake collection and uses information for conflict, urgency, scope, and service-fit review."
    },
    "/terms": {
      title: "Terms & Disclaimer | MY FAMILY LAW GROUP PLLC",
      description: "Review website terms, legal information disclaimers, no-client-relationship notices, LP scope limits, deadlines, and portal access terms."
    },
    "/accessibility": {
      title: "Accessibility | MY FAMILY LAW GROUP PLLC",
      description: "Review website accessibility commitments and contact options for alternate intake paths, access barriers, and urgent timing concerns."
    },
    "/thank-you": {
      title: "Thank You | MY FAMILY LAW GROUP PLLC",
      description: "Review what happens after submitting information to MY FAMILY LAW GROUP PLLC, including conflict, scope, urgency, and next-step review."
    },
    "/404": {
      title: "Page Not Found | MY FAMILY LAW GROUP PLLC",
      description: "The requested page was not found. Use Guided Intake, Practice Areas, Forms & Calculators, Fees, FAQ, or Contact to continue."
    }
  };

  const autoLegalTermSuppressedRoutes = new Set(["/tools", "/forms", "/calculators", "/faq"]);

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function isUsableHref(value) {
    const href = String(value || "").trim();
    return Boolean(href && href !== "#");
  }

  function isSameOriginSitePath(value) {
    const href = String(value || "").trim();
    return Boolean(href && href.startsWith("/") && !href.startsWith("//"));
  }

  function sitePdfViewUrlFor(file) {
    return isSameOriginSitePath(file?.site_pdf_view_url) ? file.site_pdf_view_url : "";
  }

  function sitePdfDownloadUrlFor(file) {
    if (isSameOriginSitePath(file?.site_pdf_download_url)) return file.site_pdf_download_url;
    if (isSameOriginSitePath(file?.hosted_download_url)) return file.hosted_download_url;
    return sitePdfViewUrlFor(file);
  }

  function officialPdfSourceLabel(file) {
    let host = "";
    try {
      host = new URL(file?.official_pdf_url || "").hostname.replace(/^www\./, "").toLowerCase();
    } catch (_) {
      host = "";
    }
    if (host.includes("superiorcourt.maricopa.gov")) return "Court source: Maricopa Superior Court";
    if (host.includes("azcourts.gov")) return "Court source: Arizona Courts";
    if (host.includes("sc.pima.gov")) return "Court source: Pima Superior Court";
    if (host.includes("cochise.az.gov")) return "Court source: Cochise County";
    if (host.includes("yavapaiaz.gov")) return "Court source: Yavapai Courts";
    return "Court source: official court website";
  }

  const legalTermDefinitions = {
    "case-stage": "The step your case is in, such as starting a case, responding to papers, finalizing an agreement, or changing an existing order.",
    posture: "The legal stage or position of a case. On this site, use it like case stage.",
    jurisdiction: "The court or county that has authority to handle the case or filing.",
    petition: "The first court paper that asks the court to open a case or make orders.",
    response: "The court paper filed after someone receives a petition or other request.",
    served: "When court papers are formally delivered to someone in the way court rules require.",
    "service-of-process": "The formal delivery of court papers to another person in the way court rules require.",
    filing: "Giving a document to the court so it becomes part of the case file.",
    decree: "The final court order that resolves a divorce, legal separation, or similar family-law matter.",
    disclosure: "The required exchange of financial or case information between parties.",
    affidavit: "A written statement signed under oath or penalty of perjury.",
    enforcement: "A request asking the court to make someone follow an existing order.",
    modification: "A request asking the court to change an existing order.",
    "temporary-orders": "Short-term court orders used while the case is still pending.",
    "legal-decision-making": "Arizona's term for legal custody: who makes major decisions for a child.",
    "parenting-time": "The schedule for when a child is with each parent.",
    paternity: "A legal case or finding that establishes a child's legal parent.",
    hearing: "A court event where the judge may take information, hear arguments, and decide next steps.",
    "existing-orders": "Court orders that have already been signed by a judge or entered in the case.",
    ars: "Arizona Revised Statutes. These are Arizona state laws.",
    packet: "A group of forms that usually go together for one court task.",
    contempt: "A court request claiming someone violated a court order.",
    scope: "The type of help the office is legally allowed and agreed to provide.",
    conflict: "A required check for whether the office can ethically review or accept a matter.",
    retainer: "Money paid in advance and held for legal services under an agreement.",
    qdro: "A special retirement-order document that usually requires attorney or specialist review."
  };

  const legalGlossaryTerms = [
    ["case-stage", "Case stage"],
    ["jurisdiction", "Jurisdiction"],
    ["petition", "Petition"],
    ["response", "Response"],
    ["service-of-process", "Service of process"],
    ["filing", "Filing"],
    ["decree", "Decree"],
    ["disclosure", "Disclosure"],
    ["temporary-orders", "Temporary orders"],
    ["legal-decision-making", "Legal decision-making"],
    ["parenting-time", "Parenting time"],
    ["paternity", "Paternity"],
    ["hearing", "Hearing"],
    ["existing-orders", "Existing orders"],
    ["enforcement", "Enforcement"],
    ["modification", "Modification"],
    ["contempt", "Contempt"],
    ["scope", "Scope"],
    ["conflict", "Conflict"],
    ["retainer", "Retainer"],
    ["qdro", "QDRO"]
  ];

  function legalTerm(key, label) {
    return esc(label || key);
  }

  function legalGlossaryPanel() {
    return "";
  }

  const legalTermMatchers = [
    ["legal-decision-making", /\blegal decision-making\b/i],
    ["temporary-orders", /\btemporary orders\b/i],
    ["parenting-time", /\bparenting time\b/i],
    ["case-stage", /\bcase stage\b/i],
    ["jurisdiction", /\bjurisdiction\b/i],
    ["disclosure", /\bdisclosure\b/i],
    ["affidavit", /\baffidavit\b/i],
    ["enforcement", /\benforcement\b/i],
    ["modification", /\bmodification\b/i],
    ["paternity", /\bpaternity\b/i],
    ["petition", /\bpetition\b/i],
    ["response", /\bresponse\b/i],
    ["decree", /\bdecree\b/i],
    ["service-of-process", /\bservice of process\b/i],
    ["served", /\bserved\b/i],
    ["filing", /\bfiling\b/i],
    ["hearing", /\bhearing\b/i],
    ["existing-orders", /\bexisting orders?\b/i],
    ["ars", /\bA\.R\.S\.?\b/i],
    ["packet", /\bpacket\b/i],
    ["contempt", /\bcontempt\b/i],
    ["scope", /\bscope\b/i],
    ["conflict", /\bconflict\b/i],
    ["retainer", /\bretainer\b/i],
    ["posture", /\bposture\b/i],
    ["qdro", /\bQDROs?\b/]
  ];

  function enhanceLegalTerms(container) {
    removePublicQuestionMarks(container || root);
  }

  function alignLegalTermTooltips(container) {
    const host = container || root;
    if (!host?.querySelectorAll) return;
    host.querySelectorAll(".legal-term-help").forEach((help) => {
      if (help.dataset.tooltipAligned === "true") return;
      help.dataset.tooltipAligned = "true";
      const updateAlignment = () => {
        const rect = help.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const tooltipWidth = Math.min(280, viewportWidth * 0.72);
        const center = rect.left + rect.width / 2;
        const leftWhenCentered = center - tooltipWidth / 2;
        const rightWhenCentered = center + tooltipWidth / 2;
        let edge = "center";
        if (leftWhenCentered < 0 && rect.left < tooltipWidth / 2) edge = "left";
        if (rightWhenCentered > viewportWidth && viewportWidth - rect.right < tooltipWidth / 2) edge = "right";
        help.dataset.tooltipEdge = edge;
      };
      help.addEventListener("pointerenter", updateAlignment);
      help.addEventListener("focus", updateAlignment);
      help.addEventListener("click", updateAlignment);
    });
  }

  function stickyHeaderOffset() {
    const rect = header?.getBoundingClientRect?.();
    const height = rect?.height || 0;
    return Math.max(72, Math.ceil(height + 18));
  }

  function setHiddenInert(element, hidden) {
    if (!element) return;
    element.hidden = Boolean(hidden);
    element.toggleAttribute("inert", Boolean(hidden));
    element.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  function revealAndFocus(target, options = {}) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;
    let current = element;
    while (current && current !== document.body) {
      if (current.hidden) current.hidden = false;
      if (current.hasAttribute("inert")) current.removeAttribute("inert");
      if (current.getAttribute("aria-hidden") === "true") current.removeAttribute("aria-hidden");
      if (current.tagName === "DETAILS") current.open = true;
      current = current.parentElement;
    }
    if (options.history && options.hash && window.location.hash !== options.hash) {
      history.pushState({ reveal: options.hash }, "", options.hash);
    }
    const focusTarget = element.matches("h1,h2,h3,h4,[tabindex],button,a,input,select,textarea")
      ? element
      : element.querySelector("h1,h2,h3,h4,[data-reveal-focus],button:not([hidden]),a[href]:not([hidden]),input:not([hidden]),select:not([hidden]),textarea:not([hidden])") || element;
    if (!focusTarget.hasAttribute("tabindex") && !focusTarget.matches("button,a[href],input,select,textarea")) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    window.requestAnimationFrame(() => {
      const y = element.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset();
      window.scrollTo({ top: Math.max(0, y), behavior: options.instant ? "auto" : "smooth" });
      window.setTimeout(() => {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (error) {
          /* Focus is enhancement-only. */
        }
      }, options.instant ? 0 : 240);
    });
  }

  let publicTextCleanupObserver = null;

  function removePublicQuestionMarks(container) {
    const host = container || root;
    if (!host || !host.querySelectorAll) return;
    const scrub = (value) => String(value || "").replace(/\?/g, "");
    const textHost = host.nodeType === Node.DOCUMENT_NODE ? host.body : host;
    if (textHost) {
      const walker = document.createTreeWalker(textHost, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.includes("?")) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent || parent.closest("script, style, noscript, svg, iframe, canvas")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        node.nodeValue = scrub(node.nodeValue);
      });
    }
    host.querySelectorAll("[aria-label], [title], [placeholder]").forEach((element) => {
      ["aria-label", "title", "placeholder"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value && value.includes("?")) element.setAttribute(attribute, scrub(value));
      });
    });
  }

  function schedulePublicTextCleanup(container) {
    window.requestAnimationFrame(() => removePublicQuestionMarks(container || root));
    window.setTimeout(() => removePublicQuestionMarks(container || root), 250);
  }

  function startPublicTextCleanupObserver() {
    if (publicTextCleanupObserver || !window.MutationObserver) return;
    publicTextCleanupObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList" || record.type === "characterData")) {
        schedulePublicTextCleanup(root);
      }
    });
    publicTextCleanupObserver.observe(root, { childList: true, subtree: true, characterData: true });
  }

  function scheduleLegalTermEnhancement(container) {
    window.requestAnimationFrame(() => enhanceLegalTerms(container || root));
    window.setTimeout(() => enhanceLegalTerms(container || root), 250);
    window.setTimeout(() => enhanceLegalTerms(container || root), 900);
    window.setTimeout(() => enhanceLegalTerms(container || root), 1800);
  }

  function link(href, label, cls) {
	    return `<a class="button ${cls || ""}" href="${href}" data-link>${label}</a>`;
	  }

  function ensureHeadMeta(selector, createTag, attrs) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement(createTag);
      Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
      document.head.appendChild(element);
    }
    return element;
  }

  function updateDocumentMeta(path) {
    const canonicalPath = routes[path] ? path : "/404";
    const meta = routeMeta[canonicalPath] || defaultMeta;
    const urlPath = canonicalPath === "/" ? "/" : `${canonicalPath}/`;
    const canonicalUrl = new URL(urlPath, window.location.origin).href;
    document.title = meta.title;
    ensureHeadMeta('meta[name="description"]', "meta", { name: "description" }).setAttribute("content", meta.description);
    ensureHeadMeta('link[rel="canonical"]', "link", { rel: "canonical" }).setAttribute("href", canonicalUrl);
    ensureHeadMeta('meta[property="og:title"]', "meta", { property: "og:title" }).setAttribute("content", meta.title);
    ensureHeadMeta('meta[property="og:description"]', "meta", { property: "og:description" }).setAttribute("content", meta.description);
    ensureHeadMeta('meta[property="og:url"]', "meta", { property: "og:url" }).setAttribute("content", canonicalUrl);
    ensureHeadMeta('meta[property="og:type"]', "meta", { property: "og:type" }).setAttribute("content", "website");
    ensureHeadMeta('meta[name="twitter:card"]', "meta", { name: "twitter:card" }).setAttribute("content", "summary_large_image");
    ensureHeadMeta('meta[name="twitter:title"]', "meta", { name: "twitter:title" }).setAttribute("content", meta.title);
    ensureHeadMeta('meta[name="twitter:description"]', "meta", { name: "twitter:description" }).setAttribute("content", meta.description);
  }

	  function slugify(value) {
	    return String(value || "")
	      .toLowerCase()
	      .replace(/[^a-z0-9]+/g, "-")
	      .replace(/^-+|-+$/g, "");
	  }

  function hero(title, copy, actions) {
    return `<section class="hero">
      <video class="hero-video hero-video-a is-active" data-hero-video-layer="a" data-video-loop="crossfade video loop" autoplay muted playsinline preload="auto" poster="/assets/images/mflg-hero-family-poster.jpg?v=mflg-live-20260627-163258-result-pruning">
        <source src="/assets/images/mflg-hero-adobestock.mp4?v=hero-clean-1" type="video/mp4">
      </video>
      <video class="hero-video hero-video-b" data-hero-video-layer="b" data-video-loop="crossfade video loop" aria-hidden="true" muted playsinline preload="auto" poster="/assets/images/mflg-hero-family-poster.jpg?v=mflg-live-20260627-163258-result-pruning">
        <source src="/assets/images/mflg-hero-adobestock.mp4?v=hero-clean-1" type="video/mp4">
      </video>
      <div class="hero-shade"></div>
      <div class="hero-inner">
        <div class="eyebrow">Arizona family law guidance</div>
        <h1>${title}</h1>
        <p class="lead">${copy}</p>
        <div class="hero-features" aria-label="Service highlights">
          <span><strong aria-hidden="true">▤</strong><em>Document preparation</em></span>
          <span><strong aria-hidden="true">⇧</strong><em>Filing support</em></span>
          <span><strong aria-hidden="true">⚖</strong><em>Negotiation</em></span>
          <span><strong aria-hidden="true">▥</strong><em>Court appearances within licensed scope</em></span>
        </div>
        <div class="actions">${actions}</div>
      </div>
      <a class="scroll-cue" href="#after-hero" aria-label="View more information">
        <span>Explore more</span>
        <b aria-hidden="true"></b>
      </a>
    </section>`;
  }

  function wireHeroVideoLoop() {
    const videos = Array.from(document.querySelectorAll(".hero-video"));
    if (!videos.length || videos[0].dataset.loopGuard === "true") return;
    videos.forEach((video) => {
      video.dataset.loopGuard = "true";
      video.muted = true;
      video.playsInline = true;
      video.loop = false;
    });
    if (videos.length < 2) {
      const single = videos[0];
      single.loop = true;
      const playPromise = single.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
      return;
    }
    const cleanStart = 0.12;
    const crossfadeSeconds = 1.45;
    const preRollSeconds = 0.42;
    const swapLeadSeconds = crossfadeSeconds + preRollSeconds;
    let activeIndex = 0;
    let swapping = false;
    const setActive = (nextIndex) => {
      videos.forEach((video, index) => {
        const active = index === nextIndex;
        video.classList.toggle("is-active", active);
        video.setAttribute("aria-hidden", active ? "false" : "true");
      });
      activeIndex = nextIndex;
    };
    const play = (video) => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    };
    const resetToCleanStart = (video) => {
      try {
        video.pause();
        video.currentTime = cleanStart;
      } catch (error) {}
    };
    const waitForPreRoll = (video, startedAt, onReady) => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const advanced = video.currentTime > cleanStart + 0.08;
      const decoded = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      if ((advanced && decoded) || elapsed >= preRollSeconds) {
        onReady();
        return;
      }
      requestAnimationFrame(() => waitForPreRoll(video, startedAt, onReady));
    };
    videos.forEach((video) => {
      video.addEventListener("loadedmetadata", () => {
        if (video.currentTime < cleanStart) video.currentTime = cleanStart;
      }, { once: true });
      video.addEventListener("ended", () => {
        if (videos[activeIndex] === video) video.currentTime = cleanStart;
      });
    });
    videos.slice(1).forEach(resetToCleanStart);
    setActive(0);
    play(videos[0]);
    const tick = () => {
      const active = videos[activeIndex];
      if (!active || swapping || !Number.isFinite(active.duration) || active.duration <= 1) return;
      if (active.currentTime >= active.duration - swapLeadSeconds) {
        swapping = true;
        const nextIndex = activeIndex === 0 ? 1 : 0;
        const next = videos[nextIndex];
        resetToCleanStart(next);
        play(next);
        waitForPreRoll(next, performance.now(), () => {
          setActive(nextIndex);
          window.setTimeout(() => {
            resetToCleanStart(active);
            swapping = false;
          }, Math.round((crossfadeSeconds + 0.18) * 1000));
        });
      }
    };
    window.setInterval(tick, 80);
  }

  function sectionNavigator(path) {
    if (path === "/" || path === "/start" || path === "/thank-you" || path === "/404" || path === "/tools" || path === "/forms" || path === "/calculators") return "";
    const index = sectionFlow.findIndex((item) => item.path === path);
    if (index < 0) return "";

    const previous = sectionFlow[(index - 1 + sectionFlow.length) % sectionFlow.length];
    const current = sectionFlow[index];
    const next = sectionFlow[(index + 1) % sectionFlow.length];

    return `<nav class="section-switcher" aria-label="Move between site sections">
      <a class="section-switcher-link" href="${previous.path}" data-link aria-label="Previous: ${esc(previous.label)}"><span>Previous:</span><strong>${previous.label}</strong></a>
      <div class="section-switcher-current"><span>Viewing</span><strong>${current.label}</strong></div>
      <a class="section-switcher-link" href="${next.path}" data-link aria-label="Next: ${esc(next.label)}"><span>Next:</span><strong>${next.label}</strong></a>
    </nav>`;
  }

  function sectionJourney(path) {
    if (path === "/" || path === "/start" || path === "/thank-you" || path === "/404" || path === "/tools" || path === "/forms" || path === "/calculators") return "";
    const index = sectionFlow.findIndex((item) => item.path === path);
    if (index < 0) return "";

    const next = sectionFlow[(index + 1) % sectionFlow.length];
    return `<nav class="section-journey" aria-label="Explore site sections">
      <div class="section-journey-head">
        <span>Continue</span>
        <strong>Choose the next step in the site flow.</strong>
      </div>
      <div class="section-journey-list">
        ${sectionFlow.map((item, itemIndex) => {
          const current = item.path === path;
          return `<a class="section-journey-link${current ? " active" : ""}" href="${item.path}" data-link${current ? ` aria-current="page"` : ""}>
            <b>${String(itemIndex + 1).padStart(2, "0")}</b>
            <span>${esc(item.label)}</span>
          </a>`;
        }).join("")}
      </div>
      <a class="section-journey-next" href="${next.path}" data-link>
        <span>Next section</span>
        <strong>${esc(next.label)}</strong>
      </a>
    </nav>`;
  }

  function section(title, copy, body, band, eyebrow, className) {
    const headingTag = activeRenderPath === "/" ? "h2" : "h1";
    const afterHeroId = band && afterHeroAnchorAvailable ? ` id="after-hero"` : "";
    if (afterHeroId) afterHeroAnchorAvailable = false;
    return `<section class="section ${band ? "band" : ""} ${className || ""}"${afterHeroId}>
      <div class="inner">
        <p class="eyebrow">${eyebrow || "MY FAMILY LAW GROUP PLLC"}</p>
        <${headingTag}>${title}</${headingTag}>
        ${copy ? `<p class="lead muted">${copy}</p>` : ""}
        ${sectionNavigator(activeRenderPath)}
        ${body}
        ${sectionJourney(activeRenderPath)}
      </div>
    </section>`;
  }

  function pageCommand(label, title, copy, actions, items = [], className = "") {
    return `<div class="page-command ${className}">
      <div class="page-command-copy">
        <p class="eyebrow">${esc(label)}</p>
        <h3>${esc(title)}</h3>
        <p>${esc(copy)}</p>
      </div>
      <div class="page-command-actions">
        ${actions.map((action) => `<a class="button ${esc(action.className || "outline")}" href="${esc(action.href)}"${action.dataLink === false ? "" : " data-link"}${action.route ? ` data-intake-route='${esc(JSON.stringify(action.route))}'` : ""}>${esc(action.label)}</a>`).join("")}
      </div>
      ${items.length ? `<div class="page-command-grid">
        ${items.map((item) => `<article>
          <span>${esc(item.label)}</span>
          <strong>${esc(item.title)}</strong>
          <p>${esc(item.copy)}</p>
          ${item.href ? `<a class="card-link" href="${esc(item.href)}" data-link>${esc(item.linkLabel || "Open path")} →</a>` : ""}
        </article>`).join("")}
      </div>` : ""}
    </div>`;
  }

  function cards(items) {
    return `<div class="grid">${items.map((item) => `<article class="card">
      ${item.icon ? `<div class="card-icon" aria-hidden="true">${item.icon}</div>` : ""}
      <h3>${item.title}</h3>
      <p>${item.copy}</p>
      ${item.href ? `<a class="card-link" href="${item.href}" data-link>${item.label || "Start Path"} →</a>` : ""}
    </article>`).join("")}</div>`;
  }

  const serviceItems = [
    { icon: "⚖", category: "Marriage", title: "Divorce / Dissolution", copy: "Arizona divorce help for petitions, responses, disclosure, agreements, temporary orders, parenting, support, and decree-related next steps." },
    { icon: "§", category: "Marriage", title: "Legal Separation", copy: "Guidance for separation filings, responses, agreements, parenting terms, support, property, debt, and court documents." },
    { icon: "◌", category: "Marriage", title: "Annulment", copy: "Scope review and document help for annulment questions, required facts, filing posture, and related family-court paperwork." },
    { icon: "◇", category: "Agreements", title: "Consent Decrees", copy: "Help organizing agreed divorce or separation terms into court-ready consent decree materials and supporting documents." },
    { icon: "✦", category: "Agreements", title: "Settlement Agreements", copy: "Review and preparation support for stipulated terms, settlement documents, proposed orders, and practical resolution planning." },
    { icon: "◷", category: "Court requests", title: "Temporary Orders", copy: "Support for temporary parenting, support, possession, disclosure, and other interim family-court requests." },
    { icon: "⌂", category: "Property", title: "Property & Debt Division", copy: "Organization and scope review for community property, separate property, debts, disclosure, exhibits, and settlement terms." },
    { icon: "⌂", category: "Property", title: "Real Estate / Marital Home", copy: "Family-court document support for home possession, sale or refinance terms, mortgage records, and related decree language." },
    { icon: "¶", category: "Identity", title: "Family-Case Name Change", copy: "Document help for name-change requests connected to divorce, separation, or other eligible family-court filings." },
    { icon: "◎", category: "Parenting", title: "Parenting Time", copy: "Help with parenting-time schedules, exchanges, missed time, school breaks, holidays, and practical parenting-plan terms." },
    { icon: "◉", category: "Parenting", title: "Legal Decision-Making", copy: "Support for Arizona legal decision-making issues, including sole or joint authority, best-interest facts, and court documents." },
    { icon: "▦", category: "Parenting", title: "Parenting Plans", copy: "Preparation and review of parenting plans, schedules, exchange terms, communication rules, and dispute-resolution provisions." },
    { icon: "◍", category: "Parenting", title: "Supervised Parenting Time", copy: "Scope review and document support for supervised-time requests, safety concerns, proposed conditions, and hearing preparation." },
    { icon: "!", category: "Parenting", title: "Child Withheld / Missed Time", copy: "Next-step review for withheld children, denied parenting time, enforcement options, documentation, and urgent court timing." },
    { icon: "⇄", category: "Parenting", title: "Relocation", copy: "Arizona relocation support tied to parenting time, legal decision-making, notice requirements, and proposed parenting-plan changes." },
    { icon: "⇆", category: "Jurisdiction", title: "UCCJEA / Interstate Custody", copy: "Review of interstate custody, child home-state questions, out-of-state orders, and Arizona jurisdiction concerns." },
    { icon: "◒", category: "Parenting", title: "Grandparent / Third-Party Rights", copy: "Scope review for grandparent or third-party rights connected to Arizona family-law matters and parenting orders." },
    { icon: "$", category: "Child support", title: "Child Support Establishment", copy: "Help starting child-support orders with income, parenting-time, insurance, childcare, and worksheet information." },
    { icon: "$", category: "Child support", title: "Child Support Modification", copy: "Support for changed income, parenting time, insurance, childcare, and other facts that may affect support." },
    { icon: "$", category: "Child support", title: "Child Support Enforcement", copy: "Document and next-step help when support is not being paid or existing child-support orders are not being followed." },
    { icon: "▣", category: "Child support", title: "Support Worksheet Review", copy: "Review of child-support worksheet inputs, income records, childcare, insurance, parenting days, and calculation readiness." },
    { icon: "!", category: "Child support", title: "Arrears / Back Support", copy: "Organization and review for unpaid support, payment history, arrears records, enforcement concerns, and related filings." },
    { icon: "$", category: "Maintenance", title: "Spousal Maintenance Requests", copy: "Help with spousal-maintenance requests or responses connected to divorce or legal separation." },
    { icon: "↻", category: "Maintenance", title: "Spousal Maintenance Modification", copy: "Review of existing maintenance orders, changed circumstances, income information, and modification documents." },
    { icon: "!", category: "Maintenance", title: "Spousal Maintenance Enforcement", copy: "Support when an existing spousal-maintenance order is not being followed and enforcement may be needed." },
    { icon: "◉", category: "Parentage", title: "Paternity / Parentage", copy: "Help with parentage, birth certificate issues, DNA testing, parenting time, legal decision-making, and child support." },
    { icon: "◍", category: "Parentage", title: "DNA Testing / Parentage Establishment", copy: "Document and process support for establishing parentage and connecting parentage to parenting or support orders." },
    { icon: "▤", category: "Parentage", title: "Birth Certificate / Acknowledgment", copy: "Scope review for birth-certificate and acknowledgment-of-paternity issues tied to family-court orders." },
    { icon: "◇", category: "Parentage", title: "Same-Sex Parentage", copy: "Careful scope review for same-sex parentage questions, existing documents, parenting orders, and referral needs if required." },
    { icon: "↻", category: "Post-decree", title: "Modification of Existing Orders", copy: "Help changing parenting, legal decision-making, child support, spousal maintenance, relocation, or other family-court orders." },
    { icon: "!", category: "Post-decree", title: "Enforcement of Existing Orders", copy: "Assistance when parenting, support, maintenance, property, debt, or other family-court orders are not being followed." },
    { icon: "⚖", category: "Post-decree", title: "Contempt / Noncompliance Review", copy: "Scope review and document organization for noncompliance, contempt-related facts, deadlines, and hearing preparation." },
    { icon: "!", category: "Safety", title: "Protective Orders / Safety Terms", copy: "Family-law related safety review for protective orders, injunction issues, related hearings, children, and referral needs where appropriate." },
    { icon: "⇄", category: "Resolution", title: "Mediation Preparation", copy: "Preparation for mediation with issue lists, documents, proposed terms, parenting plans, support information, and settlement options." },
    { icon: "◇", category: "Resolution", title: "Arbitration / ADR Preparation", copy: "Review and preparation for alternative dispute resolution, including scope-sensitive arbitration or collaborative-law pathways." },
    { icon: "⇧", category: "Resolution", title: "Negotiation Support", copy: "Practical negotiation support for parenting, support, property, debt, maintenance, and agreement terms within licensed scope." },
    { icon: "▥", category: "Resolution", title: "Settlement Conference Preparation", copy: "Help preparing documents, issue summaries, proposed terms, and exhibits for settlement conferences or informal resolution." },
    { icon: "✓", category: "Resolution", title: "Agreement Review", copy: "Focused review of proposed agreements before signing, filing, mediation, or presentation to the court." },
    { icon: "▤", category: "Documents", title: "Document Preparation", copy: "Preparation of family-law petitions, responses, agreements, plans, worksheets, orders, and supporting documents." },
    { icon: "✓", category: "Documents", title: "Document Review", copy: "Review of family-law forms, proposed orders, agreements, notices, worksheets, and filing packets before the next step." },
    { icon: "⇧", category: "Documents", title: "Petition / New Filing", copy: "Help preparing new family-court filings, initial paperwork, supporting documents, and filing-readiness checklists." },
    { icon: "↩", category: "Documents", title: "Response to Served Papers", copy: "Support for responses, deadlines, hearing notices, service issues, and next-step review after being served." },
    { icon: "⇧", category: "Procedure", title: "Filing & Service Coordination", copy: "Practical help with filing readiness, service coordination, court copies, deadlines, and procedural next steps." },
    { icon: "▥", category: "Court", title: "Hearing Preparation", copy: "Preparation for family-court hearings with documents, timelines, issue summaries, exhibits, and next-step expectations." },
    { icon: "⚖", category: "Court", title: "Court Appearance Within Licensed Scope", copy: "Representation for eligible family-court appearances, negotiations, mediation, and settlement discussions within licensed scope." },
    { icon: "▣", category: "Disclosure", title: "Financial Disclosure", copy: "Support with affidavits, income records, expense records, disclosure organization, exhibits, and required supporting documents." },
    { icon: "▦", category: "Disclosure", title: "Exhibit / Document Organization", copy: "Help organizing family-court documents, records, exhibits, timelines, and materials needed for review or hearing preparation." },
    { icon: "?", category: "Triage", title: "Not Sure Where to Start", copy: "Guided triage when the family-law issue, deadline, paperwork, or best next step is not yet clear." },
    { icon: "◇", category: "Scope review", title: "Adoption / Family Formation Review", copy: "Initial scope review for adoption or family-formation questions, including whether special qualification or referral is needed." },
    { icon: "!", category: "Scope review", title: "Special Scope / Referral Review", copy: "Early review for QDROs, business or commercial property, appeals, tribal, Hague, dependency, immigration, tax, or other referral issues." }
  ];

		  const initialServiceCount = 10;
		  const publicCategoryGroups = [
		    { label: "All situations", categories: null },
		    { label: "Divorce & agreements", categories: ["Marriage", "Agreements", "Property", "Maintenance"] },
		    { label: "Children & parenting", categories: ["Parenting", "Jurisdiction", "Parentage"] },
		    { label: "Support & money", categories: ["Child support", "Maintenance", "Property", "Disclosure"] },
		    { label: "Orders & court", categories: ["Post-decree", "Court requests", "Court", "Resolution"] },
		    { label: "Documents & safety", categories: ["Documents", "Procedure", "Disclosure", "Safety", "Triage", "Scope review", "Identity"] }
		  ];
		  const publicCategoryLabels = new Map(
		    publicCategoryGroups.flatMap((group) => (group.categories || []).map((category) => [category, group.label]))
		  );
		  const publicCategoryIndex = new Map(
		    publicCategoryGroups.map((group) => [group.label, group.categories ? new Set(group.categories) : null])
		  );

		  function publicCategoryFor(item) {
		    return publicCategoryLabels.get(item.category) || item.category || "Documents & safety";
		  }

	  function intakeRouteForService(item) {
	    const title = item.title;
	    const base = {
	      routeKey: `service-${slugify(title)}`,
	      entrySource: "service-pathway",
	      entryLabel: title,
	      issueDetail: title,
	      contextNote: `Using your selected issue: ${title}. The closest issue is preselected below, and you can change it if another option fits better.`,
	      presetAnswers: {
	        primaryHelpNeeded: "Understand my options"
	      }
	    };

	    const route = (issuePathway, serviceInterest, presetAnswers) => ({
	      ...base,
	      issuePathway,
	      serviceInterest: serviceInterest || "",
	      presetAnswers: {
	        ...base.presetAnswers,
	        ...(presetAnswers || {})
	      }
	    });

	    const documents = (presetAnswers) => route("Document Preparation / Review", "Prepare and file documents", presetAnswers);
	    const divorce = (presetAnswers) => route("Divorce / Legal Separation", "", presetAnswers);
	    const parenting = (presetAnswers) => route("Parenting Time / Legal Decision-Making", "", { childrenInvolved: "Yes", ...(presetAnswers || {}) });
	    const support = (presetAnswers) => route("Child Support", "", { childrenInvolved: "Yes", ...(presetAnswers || {}) });
	    const maintenance = (presetAnswers) => route("Spousal Maintenance", "", presetAnswers);
	    const paternity = (presetAnswers) => route("Paternity", "", { childrenInvolved: "Yes", ...(presetAnswers || {}) });
	    const mediation = (presetAnswers) => route("Mediation / ADR / Settlement Help", "Mediation or settlement preparation", presetAnswers);
	    const modification = (presetAnswers) => route("Modification of Existing Orders", "", presetAnswers);
	    const enforcement = (presetAnswers) => route("Enforcement of Existing Orders", "", presetAnswers);

	    switch (title) {
	      case "Divorce / Dissolution":
	        return divorce({ caseStage: "Not filed yet" });
	      case "Legal Separation":
	        return divorce({ caseStage: "Not filed yet" });
	      case "Annulment":
	        return divorce({ serviceNeed: "Document preparation" });
	      case "Consent Decrees":
	        return divorce({ agreementStatus: "Yes, mostly agreed", divorceIssues: ["Consent decree / agreement"], serviceNeed: "Document preparation" });
	      case "Settlement Agreements":
	        return mediation({ adrType: ["Settlement agreement drafting"], bothPartiesWilling: "Maybe / not sure" });
	      case "Temporary Orders":
	        return divorce({ divorceIssues: ["Temporary orders"], primaryHelpNeeded: "Prepare for court" });
	      case "Property & Debt Division":
	        return divorce({ divorceIssues: ["Property/debt division"], realEstateInvolved: "Not sure", debtsInvolved: "Yes" });
	      case "Real Estate / Marital Home":
	        return divorce({ divorceIssues: ["Real estate / home"], realEstateInvolved: "Yes" });
	      case "Family-Case Name Change":
	        return divorce({ divorceIssues: ["Name change"], serviceNeed: "Document preparation" });
	      case "Parenting Time":
	        return parenting({ parentingIssues: ["Parenting time schedule"] });
	      case "Legal Decision-Making":
	        return parenting({ parentingIssues: ["Legal decision-making"] });
	      case "Parenting Plans":
	        return parenting({ parentingIssues: ["Parenting time schedule", "Legal decision-making"] });
	      case "Supervised Parenting Time":
	        return parenting({ parentingIssues: ["Supervised parenting time"], parentingSafetyConcerns: ["Prefer not to say"] });
	      case "Child Withheld / Missed Time":
	        return parenting({ parentingIssues: ["Child being withheld", "Enforcement"], urgentReliefNeeded: "Not sure", primaryHelpNeeded: "Enforce an existing order" });
	      case "Relocation":
	        return parenting({ parentingIssues: ["Relocation"], relocationDistance: "Not sure" });
	      case "UCCJEA / Interstate Custody":
	        return parenting({ otherJurisdictionOrders: "Yes", existingOutOfStateOrders: "Yes", childHomeStateSixMonths: "Not sure" });
	      case "Grandparent / Third-Party Rights":
	        return parenting({ parentingIssues: ["Grandparent / third-party rights"] });
	      case "Child Support Establishment":
	        return support({ supportAction: "Establish new support" });
	      case "Child Support Modification":
	        return support({ supportAction: "Modify support", existingOrder: "Yes", incomeChange: "Yes" });
	      case "Child Support Enforcement":
	        return support({ supportAction: "Enforce support / arrears", existingOrder: "Yes", arrearsOrBackSupport: "Yes", primaryHelpNeeded: "Enforce an existing order" });
	      case "Support Worksheet Review":
	        return support({ supportAction: "Calculate or review support" });
	      case "Arrears / Back Support":
	        return support({ supportAction: "Enforce support / arrears", arrearsOrBackSupport: "Yes", existingOrder: "Yes" });
	      case "Spousal Maintenance Requests":
	        return maintenance({ spousalAction: "Request maintenance", tiedToDivorce: "Yes" });
	      case "Spousal Maintenance Modification":
	        return maintenance({ spousalAction: "Modify existing order", existingOrder: "Yes" });
	      case "Spousal Maintenance Enforcement":
	        return maintenance({ spousalAction: "Enforce existing order", existingOrder: "Yes" });
	      case "Paternity / Parentage":
	        return paternity({ paternityIssues: ["Parenting time", "Legal decision-making", "Child support"] });
	      case "DNA Testing / Parentage Establishment":
	        return paternity({ paternityIssues: ["DNA testing"], parentageEstablished: "No" });
	      case "Birth Certificate / Acknowledgment":
	        return paternity({ paternityIssues: ["Birth certificate", "Acknowledgment of paternity"], birthCertificateIssue: "Yes" });
	      case "Same-Sex Parentage":
	        return paternity({ paternityIssues: ["Same-sex parentage issue"] });
	      case "Modification of Existing Orders":
	        return modification({ existingOrder: "Yes" });
	      case "Enforcement of Existing Orders":
	        return enforcement({ existingOrder: "Yes", primaryHelpNeeded: "Enforce an existing order" });
	      case "Contempt / Noncompliance Review":
	        return enforcement({ existingOrder: "Yes", urgentReliefNeeded: "Not sure", primaryHelpNeeded: "Enforce an existing order" });
	      case "Protective Orders / Safety Terms":
	        return route("Protective Order Related to Family Law", "", { immediateSafetyConcern: "Prefer not to say", protectiveOrderStatus: "Not sure" });
	      case "Mediation Preparation":
	        return mediation({ adrType: ["Mediation"] });
	      case "Arbitration / ADR Preparation":
	        return mediation({ adrType: ["Arbitration"] });
	      case "Negotiation Support":
	        return mediation({ adrType: ["Negotiation"] });
	      case "Settlement Conference Preparation":
	        return mediation({ adrType: ["Informal settlement conference"] });
	      case "Agreement Review":
	        return mediation({ adrType: ["Review proposed agreement"] });
	      case "Document Preparation":
	        return documents({ documentTypes: ["New filing / petition"] });
	      case "Document Review":
	        return route("Document Preparation / Review", "Document review", { documentTypes: ["Not sure"] });
	      case "Petition / New Filing":
	        return documents({ documentTypes: ["New filing / petition"], caseStage: "Not filed yet" });
	      case "Response to Served Papers":
	        return documents({ documentTypes: ["Response"], servedStatus: "Yes", caseStage: "I was served", primaryHelpNeeded: "Respond to papers I received" });
	      case "Filing & Service Coordination":
	        return documents({ documentTypes: ["Service documents"] });
	      case "Hearing Preparation":
	        return documents({ documentTypes: ["Hearing notice"], primaryHelpNeeded: "Prepare for court" });
	      case "Court Appearance Within Licensed Scope":
	        return route("Not Sure", "Court appearance / limited-scope representation", { hasDeadline: "Yes", primaryHelpNeeded: "Prepare for court" });
	      case "Financial Disclosure":
	        return documents({ documentTypes: ["Financial affidavit"] });
	      case "Exhibit / Document Organization":
	        return documents({ documentTypes: ["Not sure"] });
	      case "Not Sure Where to Start":
	        return route("Not Sure", "Not sure", { primaryHelpNeeded: "Not sure" });
	      case "Adoption / Family Formation Review":
	        return route("Not Sure", "Not sure", { scopeItems: ["Adoption"], primaryHelpNeeded: "Understand my options" });
	      case "Special Scope / Referral Review":
	        return route("Not Sure", "Not sure", { scopeItems: ["Not sure"], primaryHelpNeeded: "Understand my options" });
	      default:
	        return route("Not Sure", "Not sure", { primaryHelpNeeded: "Not sure" });
		    }
		  }

		  function routeForServiceTitle(title) {
		    const item = serviceItems.find((service) => service.title === title) || serviceItems.find((service) => service.title === "Not Sure Where to Start");
		    return intakeRouteForService(item);
		  }

		  function intakeMethodRoute(title, issuePathway, serviceInterest, presetAnswers) {
		    return {
		      routeKey: `service-method-${slugify(title)}`,
		      entrySource: "service-method-lead-magnet",
		      entryLabel: title,
		      issueDetail: title,
		      issuePathway,
		      serviceInterest,
		      contextNote: `Using your selected service: ${title}. The closest issue and service focus are prefilled below, and you can change anything that does not fit.`,
		      presetAnswers: {
		        primaryHelpNeeded: "Understand my options",
		        ...(presetAnswers || {})
		      }
		    };
		  }

	  const serviceMethods = [
	    {
	      icon: "▤",
	      title: "Document preparation",
	      promise: "Turn the next filing into a clean packet.",
	      copy: "Petitions, responses, agreements, parenting plans, worksheets, proposed orders, and supporting materials organized for family-court review.",
	      bestFor: "Forms, packets, agreements",
	      cta: "Use document track in Intake",
	      route: intakeMethodRoute("Document preparation", "Document Preparation / Review", "Prepare and file documents", {
	        documentTypes: ["New filing / petition"],
	        serviceNeed: "Document preparation"
	      })
	    },
	    {
	      icon: "⇧",
	      title: "Filing support",
	      promise: "Know what needs to be filed, served, and tracked.",
	      copy: "Filing readiness, service coordination, copies, deadline awareness, and practical next steps before a document moves forward.",
	      bestFor: "Filing, service, deadlines",
	      cta: "Use filing track in Intake",
	      route: intakeMethodRoute("Filing support", "Document Preparation / Review", "Prepare and file documents", {
	        documentTypes: ["Service documents"],
	        hasDeadline: "Not sure",
	        serviceNeed: "Filing support"
	      })
	    },
	    {
	      icon: "⚖",
	      title: "Negotiation",
	      promise: "Build a settlement path before the conflict hardens.",
	      copy: "Issue lists, proposed terms, mediation preparation, settlement conference support, and agreement review within licensed scope.",
	      bestFor: "Mediation, settlement, terms",
	      cta: "Use settlement track in Intake",
	      route: intakeMethodRoute("Negotiation", "Mediation / ADR / Settlement Help", "Mediation or settlement preparation", {
	        adrType: ["Negotiation"],
	        bothPartiesWilling: "Maybe / not sure",
	        serviceNeed: "Negotiation support"
	      })
	    },
	    {
	      icon: "▥",
	      title: "Court appearances within licensed scope",
	      promise: "Check fit before a hearing or appearance.",
	      copy: "Eligibility review for limited-scope family-court appearances, hearing preparation, negotiation, mediation, and settlement discussions.",
	      bestFor: "Hearings, scope review",
	      cta: "Use court track in Intake",
	      route: intakeMethodRoute("Court appearances within licensed scope", "Not Sure", "Court appearance / limited-scope representation", {
	        hasDeadline: "Yes",
	        primaryHelpNeeded: "Prepare for court",
	        serviceNeed: "Court appearance within licensed scope"
	      })
	    }
	  ];

		  const serviceMethodFallbackRoute = intakeMethodRoute("Service track match", "Not Sure", "Not sure", {
		    primaryHelpNeeded: "Not sure",
		    serviceNeed: "Service track match"
		  });

		  function urgencyRouter() {
		    const urgentRoutes = [
		      { title: "I was served or have a deadline", action: "Start Intake with deadline context", route: routeForServiceTitle("Response to Served Papers") },
		      { title: "A court date is coming up", action: "Start Intake with hearing context", route: routeForServiceTitle("Hearing Preparation") },
		      { title: "Parenting time or support is not being followed", action: "Start Intake with enforcement context", route: routeForServiceTitle("Enforcement of Existing Orders") },
		      { title: "Safety or protective-order issue", action: "Start Intake with safety context", route: routeForServiceTitle("Protective Orders / Safety Terms") }
		    ];
		    return `<div class="urgency-router" aria-label="Fast paths for urgent family-law situations">
		      <div class="urgency-router-copy">
		        <p class="eyebrow">Deadline or pressure?</p>
		        <h3>If something is time-sensitive, start there.</h3>
		        <p>You do not need to know the legal label. Choose the closest pressure point and Intake will preserve that context for review.</p>
		      </div>
		      <div class="urgency-router-actions">
		        ${urgentRoutes.map((item) => `<a href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'><strong>${esc(item.title)}</strong><small>${esc(item.action)}</small><span aria-hidden="true">→</span></a>`).join("")}
		      </div>
		    </div>`;
		  }

		  function intakeProcessStrip() {
		    const steps = [
		      "Choose the closest issue",
		      "Add county, deadline, and documents",
		      "Conflict and licensed-scope review",
		      "Fee, fit, and next-step recommendation"
		    ];
		    return `<div class="intake-process-strip" aria-label="What happens after guided intake">
		      <span>What happens after Intake</span>
		      <ol>
		        ${steps.map((step) => `<li>${esc(step)}</li>`).join("")}
		      </ol>
		    </div>`;
		  }

  function reviewFitBand() {
		    const checks = [
		      {
		        label: "Conflict",
		        title: "Can the office review this matter?",
		        copy: "Names, parties, county, and case posture are screened before any service relationship is confirmed."
		      },
		      {
		        label: "Scope",
		        title: "Does it fit Arizona LP family-law authority?",
		        copy: "Legal Paraprofessional scope is checked against the requested task, documents, and court issue."
		      },
		      {
		        label: "Urgency",
		        title: "Is there a deadline, hearing, or safety issue?",
		        copy: "Time-sensitive facts point the matter toward the right next step, including referral when ordinary intake is not enough."
		      },
		      {
		        label: "Fee & fit",
		        title: "What service path makes practical sense?",
		        copy: "After review, the next step may be a consult, document package, limited-scope work, or a referral."
		      }
		    ];
    return `<aside class="review-fit-band" aria-label="Before you start">
		      <div class="review-fit-head">
		        <p class="eyebrow">Before you start</p>
		        <h3>The office checks fit before work begins.</h3>
		        <p>Guided Intake collects enough context to decide whether MY FAMILY LAW GROUP can help, what service path may fit, and what should happen next.</p>
		      </div>
		      <div class="review-fit-grid">
		        ${checks.map((item, index) => `<article>
		          <span>${String(index + 1).padStart(2, "0")} · ${esc(item.label)}</span>
		          <strong>${esc(item.title)}</strong>
		          <p>${esc(item.copy)}</p>
		        </article>`).join("")}
		      </div>
    </aside>`;
  }

  function proofBand(eyebrow, title, copy, items, className) {
    return `<aside class="signal-band${className ? ` ${className}` : ""}" aria-label="${esc(title)}">
      <div class="signal-band-head">
        <p class="eyebrow">${esc(eyebrow || "Process proof")}</p>
        <h3>${esc(title)}</h3>
        <p>${esc(copy)}</p>
      </div>
      <div class="signal-band-grid">
        ${items.map((item, index) => `<article>
          <span>${String(index + 1).padStart(2, "0")} · ${esc(item.label)}</span>
          <strong>${esc(item.title)}</strong>
          <p>${esc(item.copy)}</p>
        </article>`).join("")}
      </div>
    </aside>`;
  }

		  function intakeReadinessPanel(mode = "standard") {
		    const compact = mode === "compact";
		    const items = [
		      {
		        label: "Court basics",
		        title: "County, case number, and current orders",
		        copy: "If a case exists, have the county, case number, current orders, hearing notices, and filed documents available."
		      },
		      {
		        label: "Timing",
		        title: "Deadlines, hearings, and service dates",
		        copy: "Intake should include response deadlines, hearing dates, service dates, and any court notice that changes timing."
		      },
		      {
		        label: "People",
		        title: "Names needed for conflict review",
		        copy: "Use full names for parties, children, former spouses, other parents, and anyone already represented if known."
		      },
		      {
		        label: "Goal",
		        title: "The next action you want reviewed",
		        copy: "Examples include starting a case, responding, changing orders, enforcing orders, reviewing papers, or preparing for court."
		      }
		    ];
		    return `<aside class="intake-readiness${compact ? " compact" : ""}" aria-label="What to have ready before Guided Intake">
		      <div class="intake-readiness-head">
		        <p class="eyebrow">Before Guided Intake</p>
		        <h3>Have the practical facts ready before you start.</h3>
		        <p>Complete answers help the office review conflict, LP scope, urgency, documents, and service fit without relying on the perfect legal label.</p>
		      </div>
		      <div class="intake-readiness-grid">
		        ${items.map((item, index) => `<article>
		          <span>${String(index + 1).padStart(2, "0")} · ${esc(item.label)}</span>
		          <strong>${esc(item.title)}</strong>
		          <p>${esc(item.copy)}</p>
		        </article>`).join("")}
		      </div>
		    </aside>`;
		  }

		  function lpScopeClarityPanel() {
		    const lanes = [
		      {
		        label: "Often a fit",
		        title: "Defined family-law tasks",
		        copy: "Document preparation, filing support, review sessions, negotiation support, settlement paperwork, and eligible family-court appearances can often be reviewed for LP service fit.",
		        items: ["Divorce and legal separation documents", "Parenting time and legal decision-making", "Child support, modification, and enforcement", "Agreements, disclosure, and hearing preparation"]
		      },
		      {
		        label: "Review first",
		        title: "Facts decide the path",
		        copy: "Some matters may fit only after the office reviews current orders, deadlines, county, hearing type, safety concerns, contested facts, and document volume.",
		        items: ["Relocation, temporary orders, or enforcement", "Contested property or debt issues", "Mediation, settlement, or negotiation posture", "Court appearances and hearing preparation"]
		      },
		      {
		        label: "May need referral",
		        title: "Attorney or specialist involvement",
		        copy: "If a matter exceeds LP authority, creates unusual risk, or needs specialist work, the right answer may be attorney referral or a limited task instead of direct service.",
		        items: ["Appeals, criminal, immigration, bankruptcy, or tax issues", "Complex business valuation or commercial property", "QDRO or non-standard retirement division", "Emergency or highly complex litigation"]
		      }
		    ];
		    return `<aside class="lp-scope-panel" aria-label="Legal Paraprofessional scope clarity">
		      <div class="lp-scope-head">
		        <p class="eyebrow">LP scope clarity</p>
		        <h3>Not every family-law problem should use the same kind of help.</h3>
		        <p>Arizona Legal Paraprofessional services can be a practical fit for defined family-law work. Intake exists to decide whether the request fits licensed scope, risk, urgency, and client goals.</p>
		      </div>
		      <div class="lp-scope-grid">
		        ${lanes.map((lane) => `<article>
		          <span>${esc(lane.label)}</span>
		          <h4>${esc(lane.title)}</h4>
		          <p>${esc(lane.copy)}</p>
		          <ul class="list">${lane.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
		        </article>`).join("")}
		      </div>
		    </aside>`;
		  }

		  function decisionBridge() {
		    const foundRoute = routeForServiceTitle("Not Sure Where to Start");
		    const urgentRoute = routeForServiceTitle("Response to Served Papers");
		    const triageRoute = routeForServiceTitle("Not Sure Where to Start");
		    return `<div class="decision-bridge">
		      <div class="decision-bridge-copy">
		        <p class="eyebrow">Ready for the next step?</p>
		        <h3>You do not need to pick the perfect legal label.</h3>
		        <p>Start with the closest situation. Intake keeps the issue, timing, county, and documents organized so the next review can focus on fit, scope, and urgency.</p>
		      </div>
		      <div class="decision-options" aria-label="Choose the next step">
		        <a class="decision-option primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(foundRoute))}'>
		          <span>I found my issue</span>
		          <strong>Start intake with the closest pathway.</strong>
		          <b>Start Guided Intake →</b>
		        </a>
		        <a class="decision-option" href="/start" data-link data-intake-route='${esc(JSON.stringify(urgentRoute))}'>
		          <span>I was served or have a deadline</span>
		          <strong>Start with the deadline, hearing, service, or urgent next step first.</strong>
		          <b>Start Deadline Review →</b>
		        </a>
		        <a class="decision-option" href="/start" data-link data-intake-route='${esc(JSON.stringify(triageRoute))}'>
		          <span>I am not sure</span>
		          <strong>Use guided triage if the family-law label is unclear.</strong>
		          <b>Start Triage →</b>
		        </a>
		        <a class="decision-option" href="/guides" data-link>
		          <span>I want forms or context first</span>
		          <strong>Use DIY Guides to understand steps, forms, and court-readiness.</strong>
		          <b>Open DIY Guides →</b>
		        </a>
		      </div>
		      ${intakeProcessStrip()}
		    </div>`;
		  }

  function serviceViewModelForItem(item) {
	      const route = intakeRouteForService(item);
	      const issueProfile = issueProfileFor(item.title, item.category);
	      const guide = guideFromServiceItem(item);
      const baseFormsRoute = guideFormsRouteFor(guide);
      const formsRoute = {
        ...baseFormsRoute,
        suggestedIssue: baseFormsRoute.issue || "",
        fromPracticeArea: item.title
      };
	      const calculatorChoice = guideCalculatorChoiceFor(guide);
	      const neutralCalculator = shouldUseNeutralCalculatorChoice(guide);
	      const calculatorLabel = neutralCalculator
	        ? "Choose calculator or planner"
	        : calculatorChoice === "support"
	        ? "Open support calculator"
	        : calculatorChoice === "parenting"
	          ? "Open parenting-time counter"
	          : calculatorChoice === "maintenance"
	            ? "Open maintenance calculator"
	            : "Open deadline planner";
	      const primaryAction = neutralCalculator ? "forms" : "calculator";
	      return { ...item, href: "/start", route, issueProfile, guide, formsRoute, calculatorChoice, calculatorLabel, neutralCalculator, primaryAction };
  }

  function issuePrerequisitesForTitle(value) {
    const title = String(value || "").toLowerCase();
    if (title.includes("adoption") || title.includes("family formation")) {
      return [
        "Is this an adoption or family-formation issue that may require attorney, agency, or court-specific review?",
        "Has a verified adoption-specific packet been confirmed for the county and exact adoption type?",
        "Do not use parenting, guardianship, paternity, or general family-law packets as adoption forms."
      ];
    }
    if (title.includes("relocation")) {
      return [
        "Is there an existing parenting plan, legal decision-making order, or court order?",
        "Has relocation notice been given, and is there a deadline or hearing date?",
        "Does the other parent agree, object, or need more information before forms are chosen?"
      ];
    }
    if (title.includes("child support") || title.includes("support")) {
      return [
        "Are you starting, changing, enforcing, or calculating support?",
        "Do income, childcare, insurance, parenting-time days, or arrears records affect the answer?",
        "County is asked only when the form path needs a county-specific source."
      ];
    }
    if (title.includes("temporary order")) {
      return [
        "Is a case already filed, or do temporary orders need to be requested with a new case?",
        "What temporary help is needed: parenting, support, property, bills, safety, or exclusive use?",
        "Is there a deadline, hearing, service issue, or urgent timing concern?"
      ];
    }
    if (title.includes("consent decree")) {
      return [
        "Do both parties agree on every term before final paperwork is chosen?",
        "Are minor children, property, debts, support, or maintenance part of the agreement?",
        "Is the case already filed, and does the decree need supporting forms or worksheets?"
      ];
    }
    return [
      "County, case stage, children, agreement, existing orders, and timing can change the form path.",
      "Answer only the missing checks before opening a packet or PDF viewer.",
      "If the checks do not fit, use office review instead of guessing with a broad packet."
    ];
  }

  function issueProfileFor(value, categoryValue) {
    const title = String(value || "").trim();
    const category = String(categoryValue || "").trim();
    const text = `${category} ${title}`.toLowerCase();
    const base = {
      id: slugify(title || category || "family-law-issue"),
      publicLabel: title || "Family law issue",
      userProblem: `You are trying to choose the next Arizona family-law step for ${title || "this issue"} without opening the wrong court packet.`,
      firstStep: `Confirm the county, case stage, children, agreement status, existing orders, and timing that control ${title || "this issue"}.`,
      formsActionLabel: "Find the right forms",
      guideActionLabel: "Understand the steps",
      calculatorLabel: "",
      officeReviewTrigger: "Use office review if the facts do not match the listed form path or a deadline, safety issue, or LP-scope limit is present.",
      safestFallback: "Ask for office review instead of guessing with a broad packet.",
      disallowedBroadPackets: ["generic family-law packet", "unrelated divorce packet", "unrelated parenting packet"]
    };
    const exact = {
      "Relocation": {
        userProblem: "You are dealing with a move that may affect an existing parenting plan, notice rights, objections, deadlines, or temporary orders.",
        firstStep: "Confirm whether a parenting plan or order exists, whether notice has been given, whether a hearing or deadline is pending, and whether the move is agreed or disputed.",
        disallowedBroadPackets: ["broad parenting packet first", "new parenting packet before relocation notice or order status"]
      },
      "Child Support Establishment": {
        userProblem: "You need to start or calculate child support without being routed into a divorce packet unless divorce is actually the case type.",
        firstStep: "Confirm whether support is new, tied to parentage or parenting time, and whether income, childcare, insurance, parenting-time days, or arrears records are ready.",
        calculatorLabel: "Open support calculator",
        disallowedBroadPackets: ["divorce packet as primary", "parenting packet without support qualifiers"]
      },
      "Child Support Modification": {
        userProblem: "You need to know whether changed income, parenting time, insurance, childcare, or other support facts justify changing an existing order.",
        firstStep: "Confirm what support order exists, what changed, and whether calculation inputs are ready before any modification forms appear.",
        calculatorLabel: "Open support calculator",
        disallowedBroadPackets: ["new divorce packet", "enforcement packet unless nonpayment is selected"]
      },
      "Child Support Enforcement": {
        userProblem: "An existing child-support order may not be followed and the next step depends on the order, payment history, and enforcement goal.",
        firstStep: "Confirm what order exists, what is not being followed, payment or arrears records, and whether you are enforcing rather than changing support.",
        calculatorLabel: "Open support calculator",
        disallowedBroadPackets: ["modification packet as primary", "divorce packet as primary"]
      },
      "Temporary Orders": {
        userProblem: "You need short-term court help while a family-law case is pending or being filed.",
        firstStep: "Confirm whether a case is already filed, what temporary relief is needed, and whether a hearing, service issue, deadline, or urgent fact controls the request.",
        disallowedBroadPackets: ["generic family packet first", "final decree packet as primary"]
      },
      "Consent Decrees": {
        userProblem: "You have or are working toward an agreed final order and need to avoid contested-divorce routing.",
        firstStep: "Confirm whether both parties agree on every term, and whether children, property, debts, support, or maintenance require supporting forms.",
        disallowedBroadPackets: ["contested divorce packet as primary", "new petition packet before agreement status"]
      },
      "Adoption / Family Formation Review": {
        userProblem: "You need careful scope screening for adoption or family formation before any court form is treated as safe.",
        firstStep: "Identify adult, minor, stepchild, relative, DCS, consent, missing-consent, ICWA, agency, tribal, or other special requirements before any adoption form appears.",
        formsActionLabel: "Find the right forms after adoption readiness",
        officeReviewTrigger: "Office review is primary when the adoption type is minor, DCS, ICWA, missing consent, agency, tribal, or not clearly within verified form coverage.",
        safestFallback: "Do not use parenting, guardianship, paternity, or generic family-law packets as adoption forms.",
        disallowedBroadPackets: ["parenting packet", "guardianship packet", "paternity packet", "generic family-law packet"]
      },
      "Enforcement of Existing Orders": {
        userProblem: "An existing family-court order may not be followed, and enforcement should not be confused with changing the order.",
        firstStep: "Confirm what order exists, which term is not being followed, proof of noncompliance, and whether you need enforcement rather than modification.",
        disallowedBroadPackets: ["modification packet unless change is selected", "new filing packet"]
      },
      "Modification of Existing Orders": {
        userProblem: "You may need to change an existing order because facts have changed.",
        firstStep: "Confirm what order exists, what changed, whether the change affects parenting, support, maintenance, or relocation, and whether enforcement is a separate issue.",
        disallowedBroadPackets: ["enforcement packet unless noncompliance is selected", "new filing packet"]
      },
      "Paternity / Parentage": {
        userProblem: "You need to establish or clarify legal parentage before parenting-time or support forms are treated as the right path.",
        firstStep: "Confirm whether paternity or parentage is already established, whether DNA or acknowledgment is involved, and whether parenting or support orders are also needed.",
        disallowedBroadPackets: ["parenting packet before parentage status", "divorce packet as primary"]
      },
      "Property & Debt Division": {
        userProblem: "You need to divide, enforce, disclose, settle, or revisit property and debt issues without being pushed into an unrelated divorce packet.",
        firstStep: "Confirm whether this is division, enforcement, disclosure, settlement, decree language, real estate, debt allocation, or post-decree compliance.",
        disallowedBroadPackets: ["unrelated divorce packet for narrow post-decree property issue", "support packet"]
      },
      "Protective Orders / Safety Terms": {
        userProblem: "Safety-sensitive facts may require emergency resources, protective-order review, or referral before ordinary form prep.",
        firstStep: "Confirm immediate safety needs, children, existing family-court orders, hearing status, and whether emergency or protective-order resources are safer than ordinary intake.",
        formsActionLabel: "Review safety resources",
        officeReviewTrigger: "Office review, emergency resources, or referral can be primary when safety, jurisdiction, or LP-scope limits require it.",
        safestFallback: "Use emergency resources for immediate danger; do not rely on ordinary form-prep routing for urgent safety facts.",
        disallowedBroadPackets: ["ordinary family packet as safety answer", "intake-only path for emergency danger"]
      }
    };
    let profile = { ...base, ...(exact[title] || {}) };
    if (!exact[title]) {
      if (text.includes("enforcement") || text.includes("contempt") || text.includes("noncompliance") || text.includes("withheld") || text.includes("missed")) {
        profile = { ...profile, userProblem: `You need to respond to an existing order not being followed for ${title}.`, firstStep: "Confirm the exact order, the term not being followed, proof, timing, and whether you need enforcement rather than a change.", disallowedBroadPackets: ["modification packet as primary unless change is selected", "new filing packet"] };
      } else if (text.includes("modification")) {
        profile = { ...profile, userProblem: `You need to decide whether ${title} fits a change to an existing order.`, firstStep: "Confirm the existing order, the changed facts, the affected terms, and whether enforcement is a separate problem.", disallowedBroadPackets: ["enforcement packet as primary unless noncompliance is selected", "new filing packet"] };
      } else if (text.includes("support") || text.includes("arrears") || text.includes("worksheet")) {
        profile = { ...profile, userProblem: `You need support-specific routing for ${title}, not a generic divorce path.`, firstStep: "Confirm support status, order status, calculation inputs, payment records, and whether the issue is new, modified, enforced, or estimated.", calculatorLabel: "Open support calculator", disallowedBroadPackets: ["divorce packet as primary", "parenting packet without support qualifiers"] };
      } else if (text.includes("parenting") || text.includes("custody") || text.includes("decision-making") || text.includes("uccjea")) {
        profile = { ...profile, userProblem: `You need parenting-specific routing for ${title}.`, firstStep: "Confirm existing orders, children, schedule or decision-making issue, jurisdiction, safety, and whether the next step is new orders, change, enforcement, or planning.", calculatorLabel: "Open parenting-time counter", disallowedBroadPackets: ["divorce packet as primary unless divorce is selected", "support packet before parenting context"] };
      } else if (text.includes("agreement") || text.includes("settlement") || text.includes("decree")) {
        profile = { ...profile, userProblem: `You need agreement-focused routing for ${title}.`, firstStep: "Confirm whether all terms are agreed, whether children, property, debts, support, or maintenance are included, and whether the case is already filed.", disallowedBroadPackets: ["contested packet as primary", "new petition packet before agreement status"] };
      } else if (text.includes("property") || text.includes("debt") || text.includes("real estate") || text.includes("home") || text.includes("disclosure")) {
        profile = { ...profile, userProblem: `You need property, debt, or disclosure routing for ${title}.`, firstStep: "Confirm whether the issue is division, disclosure, settlement, enforcement, post-decree compliance, home sale, refinance, or separate-property documentation.", disallowedBroadPackets: ["unrelated support packet", "generic divorce packet for narrow post-decree property issue"] };
      } else if (text.includes("document") || text.includes("filing") || text.includes("response") || text.includes("service") || text.includes("hearing") || text.includes("court")) {
        profile = { ...profile, userProblem: `You need procedure and document-readiness routing for ${title}.`, firstStep: "Confirm the document type, deadline, hearing, service status, case stage, county, and whether a broader issue must be selected first.", disallowedBroadPackets: ["random packet library result", "generic family packet as primary"] };
      }
    }
    return profile;
  }

  function serviceAvailabilityTags(item) {
    const tags = ["Forms", "Steps", "Intake"];
    if (!item.neutralCalculator) {
      tags.splice(1, 0, item.calculatorChoice === "deadline" ? "Deadline" : "Calculator");
    } else {
      tags.splice(1, 0, "Tools");
    }
    return tags;
  }

  function shouldUseNeutralCalculatorChoice(guide) {
    const title = `${guide?.title || ""}`.toLowerCase();
    const category = `${guide?.category || ""}`.toLowerCase();
    const text = `${category} ${title}`;
    if (text.includes("child support") || text.includes("support worksheet") || text.includes("arrears")) return false;
    if (text.includes("spousal maintenance") || text.includes("maintenance")) return false;
    if (text.includes("parenting time") || text.includes("legal decision") || text.includes("custody") || text.includes("relocation")) return false;
    if (text.includes("deadline") || text.includes("served") || text.includes("response") || text.includes("hearing")) return false;
    return category.includes("marriage") || category.includes("agreements") || category.includes("property") || title.includes("divorce") || title.includes("dissolution") || title.includes("separation") || title.includes("annulment") || title.includes("consent") || title.includes("settlement");
  }

  function calculatorQuickChoices(recommendedChoice) {
    const choices = [
      {
        key: "support",
        title: "Child support",
        copy: "Estimate support using planning numbers only.",
        cta: "Open support calculator"
      },
      {
        key: "maintenance",
        title: "Spousal maintenance",
        copy: "Estimate maintenance using generic planning inputs.",
        cta: "Open maintenance calculator"
      },
      {
        key: "parenting",
        title: "Parenting time",
        copy: "Count overnights or parenting-time days.",
        cta: "Open parenting counter"
      },
      {
        key: "deadline",
        title: "Deadline readiness",
        copy: "Check whether timing should be reviewed first.",
        cta: "Open deadline planner"
      }
    ];
    const recommended = choices.find((choice) => choice.key === recommendedChoice) || choices[3];
    return [recommended, ...choices.filter((choice) => choice.key !== recommended.key)];
  }

  function renderServicePanel(item) {
    const profile = item.issueProfile || issueProfileFor(item.title, item.category);
    const checklist = guideChecklistFor(item).slice(0, 3);
    const readiness = guideReadinessFor(item)[0] || "If the next step is unclear, use Guided Intake before choosing forms.";
    const calculatorChoices = calculatorQuickChoices(item.calculatorChoice);
    const calculatorOpen = !item.neutralCalculator;
    const primaryAction = item.primaryAction || "forms";
    const recommendationTitle = primaryAction === "calculator"
      ? item.calculatorLabel
      : "View the forms for this issue";
    const recommendationCopy = primaryAction === "calculator"
      ? "This issue often depends on numbers or timing. Start with the planning tool, then open forms or Intake if the result raises questions."
      : "Start with the assigned form path. If the county, children, filing stage, agreement, orders, timing, safety, or title does not fit, use Guided Intake before guessing.";
    const serviceActions = [
      {
        key: "forms",
        label: "Find the right forms",
        primary: primaryAction === "forms"
      },
      {
        key: "calculator",
        label: item.calculatorLabel,
        primary: primaryAction === "calculator"
      },
      {
        key: "steps",
        label: "Understand the steps",
        primary: false
      }
    ].sort((a, b) => Number(b.primary) - Number(a.primary));
    return `<div class="guide-row-panel-inner service-row-panel-inner task-workspace" data-service-default-section="choose" data-task-workspace data-workspace-state="choose">
      <button class="guide-panel-close" type="button" data-service-panel-close aria-label="Close practice area details">Close</button>
      <div class="guide-panel-heading service-panel-heading">
        <p class="eyebrow">${esc(item.category)}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.copy)}</p>
        <div class="issue-profile-summary" data-issue-profile="${esc(profile.id)}">
          <strong>${esc(profile.userProblem)}</strong>
          <p>${esc(profile.firstStep)}</p>
        </div>
      </div>
      <section class="task-workspace-state" data-service-panel-section="choose">
        <p class="eyebrow">Choose</p>
        <h4>What would you like to do?</h4>
        <p class="muted">Start with one task. Using your selected issue: ${esc(item.title)}.</p>
        <div class="service-decision-actions" role="group" aria-label="Choose what to do next">
          ${serviceActions.map((action) => `<button class="button ${action.primary ? "primary" : "outline"}" type="button" data-service-action="${esc(action.key)}">${esc(action.key === "forms" ? profile.formsActionLabel : action.key === "steps" ? profile.guideActionLabel : action.label)}</button>`).join("")}
          <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>Ask for office review</a>
        </div>
      </section>
      <section class="task-workspace-state" data-service-panel-section="forms" hidden inert aria-hidden="true">
        <p class="eyebrow">Answer</p>
        <h4>${esc(profile.formsActionLabel)} for ${esc(profile.publicLabel)}.</h4>
        <div class="forms-prereq-panel">
          <strong>Use the form check before opening a packet.</strong>
          <p>The next page asks for county, case stage, children, agreement status, existing orders, timing, and safety before it shows a packet, statewide forms, or office review.</p>
        </div>
        <div class="guide-forms-viewer service-forms-viewer" data-guide-pdf-panel data-guide-calculator-choice="${esc(item.calculatorChoice || "")}" data-guide-pdf-packet="${esc(item.formsRoute.pdfPacket || "")}" data-guide-packet-label="${esc(item.title)}" data-guide-title="${esc(item.title)}" data-guide-route='${esc(JSON.stringify(item.formsRoute))}'></div>
      </section>
      <section class="task-workspace-state" data-service-panel-section="calculator" hidden inert aria-hidden="true">
        <p class="eyebrow">Result</p>
        <h4>${esc(item.calculatorLabel)}</h4>
        <p class="muted">Use planning numbers only. Do not enter names, case numbers, addresses, allegations, or private facts.</p>
        <div class="service-calculator-options">
          ${calculatorChoices.map((choice, choiceIndex) => `<a class="service-calculator-option${choiceIndex === 0 && calculatorOpen ? " recommended" : ""}" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(choice.key)}" data-guide-forms-route='${esc(JSON.stringify(item.formsRoute))}'>
            <span>${choiceIndex === 0 && calculatorOpen ? "Suggested" : "Option"}</span>
            <strong>${esc(choice.title)}</strong>
            <p>${esc(choice.copy)}</p>
            <b>${esc(choice.cta)} <span aria-hidden="true">→</span></b>
          </a>`).join("")}
        </div>
      </section>
      <section class="task-workspace-state" data-service-panel-section="steps" hidden inert aria-hidden="true">
        <p class="eyebrow">Steps</p>
        <h4>${esc(profile.guideActionLabel)} for ${esc(profile.publicLabel)}.</h4>
        <div class="guide-card-grid service-panel-grid">
          <div>
            <h5>What this usually involves</h5>
            <ul class="list">${checklist.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
          </div>
          <div>
            <h5>Your answers being used</h5>
            <p class="service-card-fallback">${esc(readiness)}</p>
            <p class="service-card-fallback">${esc(profile.officeReviewTrigger)}</p>
          </div>
        </div>
        <div class="guide-panel-next-actions" aria-label="Next actions after reviewing steps">
          <button class="button primary" type="button" data-service-action="forms">Find forms for this issue</button>
          <button class="button outline" type="button" data-service-action="calculator">${esc(item.calculatorLabel)}</button>
          <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>Ask for office review</a>
        </div>
      </section>
    </div>`;
    return `<div class="guide-row-panel-inner service-row-panel-inner" data-service-default-section="${esc(primaryAction)}">
      <button class="guide-panel-close" type="button" data-service-panel-close aria-label="Close practice area details">Close</button>
      <div class="guide-panel-heading service-panel-heading">
        <p class="eyebrow">${esc(item.category)}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.copy)}</p>
      </div>
      <div class="guide-next-step service-panel-next">
        <div class="guide-next-step-head">
          <span>Recommended next step</span>
          <strong>${esc(recommendationTitle)}</strong>
          <p>${esc(recommendationCopy)}</p>
        </div>
        <div class="service-decision-actions" role="group" aria-label="Choose what to do next">
          ${serviceActions.map((action) => `<button class="button ${action.primary ? "primary" : "outline"}" type="button" data-service-action="${esc(action.key)}" data-service-primary-action="${action.primary ? "true" : "false"}">${esc(action.label)}</button>`).join("")}
          <a class="button ghost" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>Use this issue in Intake</a>
        </div>
      </div>
      <div class="guide-card-grid service-panel-grid" data-service-panel-section="steps" hidden>
        <div>
          <h4>What this usually involves</h4>
          <ul class="list">${checklist.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Before you choose</h4>
          <p class="service-card-fallback">${esc(readiness)}</p>
        </div>
      </div>
      <details class="service-calculator-chooser" aria-label="Choose calculator or planner"${calculatorOpen ? " open" : ""} data-service-panel-section="calculator" hidden>
        <summary class="service-calculator-head">
          <span>Calculator or planner</span>
          <strong>${calculatorOpen ? "Use the suggested tool, or switch if another issue fits better." : "Need an estimate? Choose a calculator or planner."}</strong>
          <p>These tools stay on the website and use planning numbers only. Do not enter names, addresses, case numbers, allegations, or private facts.</p>
        </summary>
        <div class="service-calculator-options">
          ${calculatorChoices.map((choice, choiceIndex) => `<a class="service-calculator-option${choiceIndex === 0 && calculatorOpen ? " recommended" : ""}" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(choice.key)}" data-guide-forms-route='${esc(JSON.stringify(item.formsRoute))}'>
            <span>${choiceIndex === 0 && calculatorOpen ? "Suggested" : "Choose tool"}</span>
            <strong>${esc(choice.title)}</strong>
            <p>${esc(choice.copy)}</p>
            <b>${esc(choice.cta)} <span aria-hidden="true">→</span></b>
          </a>`).join("")}
        </div>
      </details>
      <div data-service-panel-section="forms" hidden>
      <div class="guide-forms-viewer service-forms-viewer" data-guide-pdf-panel data-guide-calculator-choice="${esc(item.calculatorChoice || "")}" data-guide-pdf-packet="${esc(item.formsRoute.pdfPacket || "")}" data-guide-packet-label="${esc(item.title)}" data-guide-title="${esc(item.title)}" data-guide-route='${esc(JSON.stringify(item.formsRoute))}'>
        <div class="guide-forms-viewer-head guide-forms-bridge-head">
          <div>
            <span>Forms & Calculators</span>
            <strong>Start the form check in Forms & Calculators.</strong>
            <p>This issue can start the form check, but the form questions still need your answers before any packet opens.</p>
          </div>
          <a class="button primary" href="/tools#forms-task-workspace" data-link data-guide-forms-route='${esc(JSON.stringify(item.formsRoute))}'>Answer questions to find forms</a>
        </div>
      </div>
      </div>
      <div class="guide-panel-actions service-panel-actions" aria-label="Practice area follow-up actions">
        <button class="button outline" type="button" data-service-action="forms">Review form path</button>
        <button class="button outline" type="button" data-service-action="calculator">${esc(item.calculatorLabel)}</button>
        <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>Use this issue in Intake</a>
        <button class="button ghost guide-panel-close-inline" type="button" data-service-panel-close>Close this issue</button>
      </div>
    </div>`;
  }

  function serviceCards() {
	    const items = serviceItems.map(serviceViewModelForItem);
				    const categories = publicCategoryGroups.filter((group) => group.label === "All situations" || items.some((item) => group.categories?.includes(item.category)));
		    return `<div class="service-tools" data-service-tools>
	      <label class="service-search-label" for="service-search">Start by choosing your issue</label>
	      <div class="service-search-row">
	        <input id="service-search" class="service-search" type="search" placeholder="Search divorce, parenting, support, paternity, enforcement..." data-service-search>
	        <span class="service-count" data-service-count>Showing ${initialServiceCount} of ${items.length} issue paths</span>
	      </div>
	      <div class="service-quick-fallback" aria-label="Fallback if the issue is unclear">
	        <span>Not sure what to choose?</span>
	        <a href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>Use Guided Intake</a>
	      </div>
	    </div>
		    <div class="service-category-panel" aria-label="Filter family-law pathways by situation">
		      <div class="service-category-head">
		        <p class="service-search-label">Browse by situation</p>
		        <button class="service-category-reset" type="button" data-service-category-reset>Reset</button>
		      </div>
		      <div class="service-category-list" role="group" aria-label="Issue filters">
		        ${categories.map((group, index) => `<button class="service-category-chip${index === 0 ? " active" : ""}" type="button" data-service-category-filter="${esc(group.label)}" aria-pressed="${index === 0 ? "true" : "false"}">${esc(group.label)}</button>`).join("")}
		      </div>
		    </div>
			    <div class="grid service-grid" data-service-grid data-service-list>${items.map((item, index) => {
			      return `
				    <article class="card service-card"${index >= initialServiceCount ? ` hidden data-service-extra` : ""} data-service-card data-service-index="${index}" data-service-category="${esc(item.category)}" data-service-group="${esc(publicCategoryFor(item))}" data-service-title="${esc(item.title.toLowerCase())}" data-service-category-text="${esc(item.category.toLowerCase())}" data-service-group-text="${esc(publicCategoryFor(item).toLowerCase())}" data-service-text="${esc(`${item.title} ${item.category} ${publicCategoryFor(item)} ${item.copy}`.toLowerCase())}">
			      <div class="service-heading">
			        <div class="card-icon service-icon" aria-hidden="true">${item.icon}</div>
		        <p class="service-kicker">${esc(item.category)}</p>
		        <h3>${esc(item.title)}</h3>
		        <div class="service-card-tools" aria-label="Available options for ${esc(item.title)}">
		          ${serviceAvailabilityTags(item).map((tag) => `<span>${esc(tag)}</span>`).join("")}
		        </div>
		      </div>
		      <div class="service-detail">
		        <p>${item.copy}</p>
		        <button class="card-link service-detail-toggle" type="button" data-service-detail-toggle aria-expanded="false">Choose this issue</button>
		      </div>
		    </article>`;
			    }).join("")}</div>
	    <div class="service-empty-state" data-service-empty hidden>
	      <span>No matching issue card</span>
	      <strong>Use a broader search or let Guided Intake sort it out.</strong>
	      <p>If the words do not match, the issue may still be covered under another family-law pathway.</p>
	      <div>
	        <button class="button outline" type="button" data-service-empty-reset>Reset search</button>
	        <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>Use Guided Intake</a>
	      </div>
	    </div>
	    <div class="service-reveal">
	      <button class="button primary service-reveal-button" type="button" data-service-reveal aria-expanded="false">View All Family Law Pathways</button>
		      <p class="service-note" data-service-note>Showing the first ${initialServiceCount} issue paths. Search any topic, browse a situation, or reveal the remaining ${items.length - initialServiceCount}. Some issues may need a different professional or closer review before forms are used.</p>
	    </div>
	    ${urgencyRouter()}
	    <div class="service-methods" aria-label="Choose a focused intake path">
	      <div class="service-methods-intro">
	        <p class="eyebrow">Not sure where to start?</p>
	        <h3>Use Intake to get matched without choosing the perfect legal label.</h3>
	        <p>If none of the issue cards feels right, choose the kind of help you need and Guided Intake will carry that context forward.</p>
	        <a class="service-methods-primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>
	          Let Intake match my track <span aria-hidden="true">→</span>
	        </a>
	      </div>
	      <div class="service-method-carousel" data-service-method-carousel>
	        <div class="service-method-carousel-head">
	          <span data-service-method-status>Path 1 of ${serviceMethods.length}</span>
	          <div class="service-method-controls" aria-label="Move between focused intake paths">
	            <button type="button" aria-label="Previous focused intake path" data-service-method-prev>‹</button>
	            <button type="button" aria-label="Next focused intake path" data-service-method-next>›</button>
	          </div>
	        </div>
	      <div class="service-method-grid" data-service-method-grid>
	        ${serviceMethods.map((item, index) => `<a class="service-method" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}' style="--method-index: ${index}">
	          <span class="service-method-number">0${index + 1}</span>
	          <span class="service-method-icon" aria-hidden="true">${item.icon}</span>
	          <small>${item.bestFor}</small>
	          <strong>${item.title}</strong>
	          <em>${item.promise}</em>
	          <p>${item.copy}</p>
	          <b>${item.cta} <span aria-hidden="true">→</span></b>
	        </a>`).join("")}
	      </div>
	      </div>
	    </div>`;
	  }

  function leadMagnetTaskEntry() {
    const fallbackRoute = esc(JSON.stringify(routeForServiceTitle("Not Sure Where to Start")));
    const tasks = [
      {
        label: "Find forms",
        title: "Answer a few details, then open forms that fit.",
        copy: "Start here when you want court paperwork. The site asks for the details it needs before any View form button appears.",
        href: "/forms",
        cta: "Find the right forms",
        primary: true
      },
      {
        label: "Understand steps",
        title: "Read the plain-language guide for your situation.",
        copy: "Use this when you want the steps, checklist, and likely next move before choosing paperwork.",
        href: "/guides",
        cta: "Read a DIY guide"
      },
      {
        label: "Use calculator",
        title: "Check numbers or timing before choosing forms.",
        copy: "Use support, parenting-time, maintenance, or deadline tools when the inputs match your situation.",
        href: "/calculators",
        cta: "Use calculator"
      },
      {
        label: "Office review",
        title: "Ask the office to review the next step.",
        copy: "Use office review after you get oriented, when forms do not seem to fit or timing needs closer attention.",
        href: "/start",
        cta: "Ask for office review",
        route: fallbackRoute
      }
    ];
    return `<div class="lead-magnet-entry" data-lead-magnet-flow aria-label="Choose a helpful starting task">
      <div class="lead-magnet-head">
        <p class="eyebrow">Pick a path</p>
        <h2>Start with one useful task, not a legal maze.</h2>
        <p>Pick forms, steps, calculator, or office review. If forms need more details, the site asks before showing a View form button.</p>
      </div>
      <div class="lead-magnet-grid">
        ${tasks.map((task) => `<a class="lead-magnet-card${task.primary ? " primary" : ""}" href="${esc(task.href)}" data-link${task.route ? ` data-intake-route='${task.route}'` : ""}>
          <span>${esc(task.label)}</span>
          <strong>${esc(task.title)}</strong>
          <p>${esc(task.copy)}</p>
          <b>${esc(task.cta)} <span aria-hidden="true">→</span></b>
        </a>`).join("")}
      </div>
    </div>`;
  }

  function reassuranceBand() {
    const items = [
      {
        label: "Start simple",
        title: "You do not need the perfect category.",
        copy: "Choose the closest task. The site can still point you toward forms, a guide, a calculator, or office review."
      },
      {
        label: "Forms second",
        title: "Forms appear after the needed details.",
        copy: "The goal is to avoid sending you to paperwork before the basic situation is clear."
      },
      {
        label: "Review when needed",
        title: "The office path stays available.",
        copy: "If timing, documents, safety, or fit is uncertain, save answers for review instead of guessing."
      }
    ];
    return `<div class="homepage-trust-band" aria-label="How to use this site">
      <div class="homepage-trust-copy">
        <p class="eyebrow">A safer first step</p>
        <h3>Get a useful direction before you commit to paperwork.</h3>
        <p>Many visitors arrive with a deadline, a confusing court packet, or no clear label for the problem. This site is built to help you choose a starting point without turning that uncertainty into a wrong form choice.</p>
      </div>
      <div class="homepage-trust-grid">
        ${items.map((item) => `<article>
          <span>${esc(item.label)}</span>
          <strong>${esc(item.title)}</strong>
          <p>${esc(item.copy)}</p>
        </article>`).join("")}
      </div>
    </div>`;
  }

	  function home() {
	    return hero(
	      "Find the Right Arizona Family Law Starting Point.",
	      "Start with forms, a guide, a calculator, or office review. The site helps narrow the next step without making you choose the perfect label first.",
	      `<div class="hero-task-grid" id="choose-task" aria-label="Choose a task">
	        <a class="hero-task-pill hero-pill primary" href="/forms" data-link>Find forms</a>
	        <a class="hero-task-pill hero-pill" href="/calculators" data-link>Use calculator</a>
	        <a class="hero-task-pill hero-pill" href="/guides" data-link>Read DIY guide</a>
	        <a class="hero-task-pill hero-pill" href="/start" data-link data-intake-route='${esc(JSON.stringify(routeForServiceTitle("Not Sure Where to Start")))}'>Office review</a>
	      </div>`
    ) + section(
      "Choose one useful task.",
      "Start with a useful task first, then ask for office review when closer help is the better fit.",
      leadMagnetTaskEntry(),
      true,
      "Start here",
      "lead-magnet-section"
    ) + section(
      "Get oriented before you choose.",
      "Use the site to understand the likely path, then decide whether forms, a guide, a calculator, or office review makes sense.",
      reassuranceBand(),
      false,
      "Before you choose",
      "trust-section"
    ) + section(
      "Find your issue.",
      "Choose the closest issue card when you already know the topic. If nothing feels right, Guided Intake can sort the starting point.",
	      `${serviceCards()}`,
	      true,
	      "Issue finder",
	      "service-section"
	    ) + section(
      "Before you start.",
      "Submitting information does not create a client relationship. The first job is to see whether the office can help, how urgent it is, and what next step fits.",
	      proofBand(
	        "Process proof",
	        "What the office reviews before anything is accepted.",
	        "The first pass is not a sales pitch. It is a practical review of fit, timing, documents, and whether another resource is better.",
	        [
	          { label: "Availability", title: "Names and parties are screened first", copy: "The office checks whether it can review the matter before advice or engagement terms are discussed." },
	          { label: "Fit", title: "The requested help is matched to what the office can do", copy: "The issue, documents, and requested help are compared with the services the office can provide." },
	          { label: "Urgency", title: "Deadlines and hearings move to the front", copy: "Response dates, court notices, and safety concerns should guide the next step before routine review." },
	          { label: "Next step", title: "The result is a path, not a vague promise", copy: "The office may recommend forms, a consult, a limited task, or a referral when that is the honest fit." }
	        ],
	        "proof-home"
	      ) + reviewFitBand(),
	      true,
	      "Intake review",
	      "review-section"
	    ) + section(
	      "From many issues to one clear next step.",
	      "If you know the issue, start there. If you do not, use triage. If you want to understand the process first, open the DIY guide path.",
		      decisionBridge(),
		      false,
		      "Next step clarity",
		      "decision-section"
		    );
	  }

  function practiceAreas() {
    return section("Practice Areas", "Choose the issue that is closest to your situation. Each card opens forms, tools, next steps, and Guided Intake if you are unsure.", `${pageCommand("Issue finder", "Choose the issue first. Then pick forms, a guide, or Intake.", "This page should help visitors name the family-law problem before they choose paperwork or office review.", [
      { label: "Start Guided Intake", href: "/start", className: "primary", route: routeForServiceTitle("Not Sure Where to Start") },
      { label: "Open Forms & Calculators", href: "/tools", className: "outline" },
      { label: "Use DIY Guides", href: "/guides", className: "outline" }
    ], [
      { label: "New case", title: "Divorce, parentage, support, or first orders", copy: "Start with the case type if no order exists yet.", href: "#service-search", linkLabel: "Browse issues" },
      { label: "Existing order", title: "Modification, enforcement, or missed parenting time", copy: "Use the post-order paths when a signed order already controls the issue.", href: "#service-search", linkLabel: "Find post-order help" },
      { label: "Deadline", title: "Served papers, hearing, or urgent timing", copy: "Use Intake when timing can change the safest next step.", href: "/start", linkLabel: "Start timing review" }
    ], "practice-command")}${proofBand("Path clarity", "Pick the closest issue and let the site do the sorting.", "The cards are arranged to reduce guessing. The right path should be obvious before anyone starts collecting documents.", [
      { label: "Closest issue", title: "Start with the problem you actually have", copy: "Select the path that is most like your matter, even if the legal label is not perfect." },
      { label: "Forms or tools", title: "Open the right helper without extra steps", copy: "Each card links to forms, checklists, calculators, or the office review path that fits the issue." },
      { label: "Unsure", title: "Use Guided Intake instead of guessing", copy: "When the issue is mixed or the facts are unclear, the intake path is the cleaner next step." },
      { label: "Boundary", title: "Some matters need another professional", copy: "If the issue needs attorney-only work, the page should not pretend otherwise." }
    ], "proof-practice")}${reviewFitBand()}${intakeReadinessPanel("compact")}${serviceCards()}`, true, "Family law services");
  }

  function feeRoute(title, serviceInterest, budgetConcern, presetAnswers) {
    return {
      routeKey: `fees-${slugify(title)}`,
      entrySource: "fees",
      entryLabel: title,
      issueDetail: title,
      issuePathway: "Not Sure",
      serviceInterest,
      contextNote: `Using your selected fee option: ${title}. Share the issue, timing, documents, and service needs so fee fit can be reviewed before any agreement is confirmed.`,
      presetAnswers: {
        primaryHelpNeeded: "Understand my options",
        budgetOrPaymentConcern: budgetConcern,
        serviceNeed: title,
        ...(presetAnswers || {})
      }
    };
  }

  const feeSections = [
    {
      title: "Hourly & Intake Fees",
      intro: "For initial review, advisory work, and hourly representation within licensed LP family-law scope.",
      items: [
        {
          title: "Initial Strategy Session",
          range: "$150",
          label: "1 hour",
          copy: "Flat-fee consultation, strictly limited to one hour. Non-refundable and not credited toward later packages.",
          includes: ["Issue spotting", "Options and next-step review", "No fee credit to preserve intake value"],
          cta: "Request Strategy Session",
          route: feeRoute("Initial Strategy Session", "Quick question / limited guidance", "Limited-scope help")
        },
        {
          title: "LP Standard Hourly Billing",
          range: "$225/hr",
          label: "Hourly",
          copy: "Applies to ongoing advisory support, communication overages, contested conversion work, and out-of-package review.",
          includes: ["After engagement only", "Scope-controlled LP work", "Written terms required"],
          cta: "Check Hourly Fit",
          route: feeRoute("LP Standard Hourly Billing", "Full matter support within LP scope", "Ongoing support")
        },
        {
          title: "Hourly Representation Deposit",
          range: "$3,500",
          label: "Minimum deposit",
          copy: "Initial trust deposit for open-ended hourly representation within LP scope when a flat-fee package is not the right fit.",
          includes: ["Conflict and scope review first", "Written engagement required", "Trust/accounting terms apply"],
          cta: "Request Retainer Review",
          route: feeRoute("Hourly Representation Deposit", "Full matter support within LP scope", "Ongoing support")
        }
      ]
    },
    {
      title: "Flat-Fee Bundles",
      intro: "End-to-end flat fees for standard family-law matters. Court filing fees and process-server costs are separate.",
      items: [
        {
          title: "Default Divorce Bundle",
          range: "$950",
          label: "Default path",
          copy: "For standard divorce matters moving toward default after the other party does not respond.",
          includes: ["Default paperwork", "Final judgment packet", "Standard marital estate only"],
          cta: "Check Default Divorce Fit",
          route: feeRoute("Default Divorce Bundle", "Prepare and file documents", "Flat fee if available", { agreementStatus: "No response / default path" })
        },
        {
          title: "Uncontested Divorce without Minor Children",
          range: "$1,800",
          label: "No minor children",
          copy: "For agreed divorce matters without minor children and with standard assets and debts.",
          includes: ["Petition or response path", "Settlement terms", "Consent decree support"],
          cta: "Price Divorce without Minor Children",
          route: feeRoute("Uncontested Divorce without Minor Children", "Prepare and file documents", "Flat fee if available", { agreementStatus: "Yes, mostly agreed" })
        },
        {
          title: "Uncontested Divorce with Minor Children",
          range: "$2,950",
          label: "Parenting plan",
          copy: "For agreed divorce matters with minor children, parenting-plan terms, support worksheet needs, and standard assets.",
          includes: ["Parenting plan", "Child support worksheet", "Consent decree support"],
          cta: "Price Divorce with Minor Children",
          route: feeRoute("Uncontested Divorce with Minor Children", "Prepare and file documents", "Flat fee if available", { agreementStatus: "Yes, mostly agreed", primaryHelpNeeded: "Get help with an agreement" })
        },
        {
          title: "Paternity / Parenting / Support",
          range: "$2,200",
          label: "Establish orders",
          copy: "For standard parentage, parenting time, legal decision-making, and child-support establishment matters.",
          includes: ["Parentage facts", "Parenting terms", "Support information"],
          cta: "Check Parentage Fit",
          route: feeRoute("Establish Paternity / Parenting Time / Support", "Prepare and file documents", "Flat fee if available", { primaryHelpNeeded: "Understand my options" })
        },
        {
          title: "Post-Decree Modification",
          range: "$1,800",
          label: "Existing orders",
          copy: "For standard modification of child support or parenting-time schedules after existing family-court orders.",
          includes: ["Change-in-circumstances facts", "Modification packet", "Order update path"],
          cta: "Check Modification Fit",
          route: feeRoute("Post-Decree Modification Bundle", "Modify an existing order", "Flat fee if available", { primaryHelpNeeded: "Modify an existing order" })
        }
      ]
    },
    {
      title: "A La Carte Document Menu",
      intro: "Limited-scope document preparation for self-represented clients who plan to handle court appearances themselves.",
      items: [
        {
          title: "Initial Petition Packet",
          range: "$700",
          label: "New filing",
          copy: "Dissolution, legal separation, or paternity filing packet for standard matters.",
          includes: ["Petition packet", "Filing-readiness checklist", "Service notes"],
          cta: "Start Petition Review",
          route: feeRoute("Initial Petition Packet", "Prepare and file documents", "Flat fee if available", { documentTypes: ["New filing / petition"] })
        },
        {
          title: "Response Packet",
          range: "$650",
          label: "Served papers",
          copy: "Response packet for defending against an active family-law petition.",
          includes: ["Deadline review", "Response forms", "Filing-readiness checklist"],
          cta: "Start Response Review",
          route: feeRoute("Response Packet", "Respond to papers I received", "Flat fee if available", { primaryHelpNeeded: "Respond to papers I received" })
        },
        {
          title: "Consent Decree Preparation",
          range: "$950",
          label: "Standard assets",
          copy: "Drafting final settlement documents for standard agreed matters.",
          includes: ["Agreement terms", "Consent decree", "Proposed final orders"],
          cta: "Start Decree Review",
          route: feeRoute("Consent Decree Preparation", "Get help with an agreement", "Flat fee if available", { agreementStatus: "Yes, mostly agreed" })
        },
        {
          title: "Affidavit of Financial Information",
          range: "$450",
          label: "AFI",
          copy: "Preparation support for Arizona family-court financial disclosure forms.",
          includes: ["Income facts", "Expense categories", "Disclosure review"],
          cta: "Start AFI Review",
          route: feeRoute("Affidavit of Financial Information", "Prepare or review documents", "Flat fee if available", { documentTypes: ["Financial disclosure"] })
        },
        {
          title: "Child Support Worksheet",
          range: "$250",
          label: "Calculator only",
          copy: "Child-support worksheet and calculator support when the needed inputs are available.",
          includes: ["Income inputs", "Parenting-time data", "Worksheet output"],
          cta: "Start Worksheet Review",
          route: feeRoute("Child Support Worksheet & Calculator Only", "Prepare or review documents", "Flat fee if available", { primaryHelpNeeded: "Understand my options" })
        },
        {
          title: "Parenting Plan Drafting",
          range: "$350",
          label: "Plan only",
          copy: "Parenting-plan drafting support for schedules, exchanges, holidays, and decision-making terms.",
          includes: ["Schedule terms", "Holiday provisions", "Exchange details"],
          cta: "Start Parenting Plan",
          route: feeRoute("Parenting Plan Drafting Only", "Get help with an agreement", "Flat fee if available", { primaryHelpNeeded: "Get help with an agreement" })
        }
      ]
    },
    {
      title: "Court Hearing Modules",
      intro: "Court modules are available only when the matter remains within LP family-law scope and the forum permits the requested appearance.",
      items: [
        {
          title: "RMC Bundle",
          range: "$750",
          label: "Conference",
          copy: "Resolution Management Conference preparation and attendance for standard family-law matters.",
          includes: ["Joint ADR statement", "Conference preparation", "Attendance if within scope"],
          cta: "Check RMC Fit",
          route: feeRoute("Resolution Management Conference Bundle", "Prepare for court", "Flat fee if available", { primaryHelpNeeded: "Prepare for court" })
        },
        {
          title: "Temporary Orders Module",
          range: "$1,500",
          label: "Short hearing",
          copy: "Drafting an interim motion or response and preparing for a standard short temporary-orders hearing.",
          includes: ["Motion or response", "Hearing prep", "Short-hearing attendance if within scope"],
          cta: "Check Temporary Orders",
          route: feeRoute("Temporary Orders Motion & Hearing Module", "Prepare for court", "Flat fee if available", { primaryHelpNeeded: "Prepare for court" })
        },
        {
          title: "Half-Day Evidentiary Hearing",
          range: "$3,500",
          label: "Up to 3 hours",
          copy: "For a single primary issue such as support or parenting-time adjustment, when appropriate for LP scope.",
          includes: ["Pretrial statement", "Exhibit notebook", "Witness preparation"],
          cta: "Review Hearing Fit",
          route: feeRoute("Half-Day Evidentiary Hearing Bundle", "Prepare for court", "Flat fee if available", { primaryHelpNeeded: "Prepare for court" })
        },
        {
          title: "Full-Day Evidentiary Trial",
          range: "$5,500",
          label: "Up to 6 hours",
          copy: "For single-issue or standard multi-issue contested trials that remain within LP family-law scope.",
          includes: ["Trial preparation", "Exhibits and witness prep", "Appearance review required"],
          cta: "Review Trial Fit",
          route: feeRoute("Full-Day Evidentiary Trial Bundle", "Prepare for court", "Flat fee if available", { primaryHelpNeeded: "Prepare for court" })
        }
      ]
    }
  ];

  function feeCard(option) {
    return `<article class="fee-card">
      <div class="fee-card-head">
        <span>${esc(option.label)}</span>
        <strong>${esc(option.range)}</strong>
      </div>
      <h3>${esc(option.title)}</h3>
      <p>${esc(option.copy)}</p>
      <ul class="list">${option.includes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(option.route))}'>${esc(option.cta)}</a>
    </article>`;
  }

  function fees() {
    return section("Fees", "Published planning fees for Arizona family-law LP services. Exact terms are confirmed only after conflict, licensed-scope, urgency, document, and service-fit review.", `
      ${pageCommand("Fee path", "Find the price range by case stage, not by guessing.", "Choose whether you need planning advice, a flat-fee packet, document-only help, or hearing preparation. Final terms still require conflict, scope, and written engagement review.", [
        { label: "Check Fee Fit", href: "/start", className: "primary", route: feeRoute("Fee-fit review", "Not sure", "Not sure yet") },
        { label: "Compare Form Paths", href: "/tools", className: "outline" },
        { label: "Use DIY Guides First", href: "/guides", className: "outline" }
      ], [
        { label: "Review", title: "Strategy session or hourly review", copy: "Use this when you need a focused review before choosing forms or representation." },
        { label: "Flat fee", title: "Standard uncontested or packet-based help", copy: "Use this when the matter is routine enough for a defined bundle." },
        { label: "Court", title: "Hearing or trial module", copy: "Use this only after the hearing type and LP scope are reviewed." }
      ], "fees-command")}
      ${proofBand("Fee review", "Pricing is confirmed by review, not by guesswork.", "The fee page explains how pricing is narrowed before any engagement is offered. It is intentionally specific about what is included and what is not.", [
        { label: "Conflict", title: "Fee-fit starts with case fit", copy: "No price should be read as a quote until the matter itself is eligible for review." },
        { label: "Scope", title: "Service boundaries stay visible", copy: "If the work moves outside LP authority, the page should point that out rather than bury it." },
        { label: "Costs", title: "Court filing and third-party costs are separate", copy: "The published prices are planning numbers, not promises that include every outside fee." },
        { label: "Terms", title: "Written engagement comes last", copy: "The final price belongs in a written agreement after the office confirms the path." }
      ], "proof-fees")}
      <div class="fee-hero-panel">
        <div>
          <p class="eyebrow">Licensed LP fee schedule</p>
          <h3>Transparent pricing, limited by conflict review, licensed scope, and written engagement terms.</h3>
          <p>Services are provided by a Licensed Legal Paraprofessional authorized in Arizona family-law matters within the scope allowed by Arizona Supreme Court rules and ACJA § 7-210. If a matter exceeds LP scope or requires attorney-only work, attorney referral, specialized co-counsel, or hourly scope review may be required.</p>
        </div>
        <div class="fee-hero-actions">
          <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(feeRoute("Fee-fit review", "Not sure", "Not sure yet")))}'>Check Fee Fit</a>
          <a class="button outline" href="/guides" data-link>Use DIY Guides First</a>
        </div>
      </div>
      <div class="fee-disclosure">
        <strong>LP scope notice</strong>
        <p>A Legal Paraprofessional is not a lawyer. Family-law LP services may include document preparation, advice within the licensed practice area, filing support, negotiation, and court appearance work when authorized and within scope. Complex business valuation, commercial property division, QDRO or non-standard retirement division, appeals, and other out-of-scope issues may require attorney involvement or separate specialized help.</p>
      </div>
      ${lpScopeClarityPanel()}
      <div class="fee-steps" aria-label="How fees are confirmed">
        ${["Intake", "Conflict check", "Scope review", "Written quote", "Engagement"].map((step, index) => `<span><b>0${index + 1}</b>${esc(step)}</span>`).join("")}
      </div>
      ${feeSections.map((group) => `<section class="fee-section">
        <div class="fee-section-head">
          <h3>${esc(group.title)}</h3>
          <p>${esc(group.intro)}</p>
        </div>
        <div class="fee-grid">${group.items.map(feeCard).join("")}</div>
      </section>`).join("")}
      <div class="fee-notes">
        <article>
          <h3>Complex asset exclusion</h3>
          <p>Flat fees apply to standard marital estates such as bank accounts, primary residences, vehicles, and ordinary debts. Formal business valuations, commercial real estate, complex pension division, and QDRO-related work are excluded from flat rates unless separately approved in writing.</p>
        </article>
        <article>
          <h3>Contested conversion</h3>
          <p>Uncontested flat-fee bundles include initial drafting and up to two minor revision rounds. If the other party contests, refuses to sign within 30 days, or demands substantive negotiation, remaining work may convert to the $225/hour LP rate after written notice.</p>
        </article>
        <article>
          <h3>Rush and excluded costs</h3>
          <p>A $325 expedited-execution premium may apply to single-document packages or petitions requested in fewer than three business days. Court filing fees, service fees, parenting classes, records, expert costs, and attorney referral work are separate.</p>
        </article>
      </div>
      <div class="notice"><strong>Fee terms are not final on this website.</strong> Published prices are planning fees, not guaranteed quotes. Confirmed pricing belongs in a written engagement after conflict, scope, urgency, document, and service review.</div>`);
  }

  async function guides() {
    const guides = await loadGuides();
    return section("DIY Guides", "Choose one issue, open the plain-language guide, then use the matched forms, calculator, or Guided Intake from that same guide.", `
      <div class="guide-command">
        <div>
          <p class="eyebrow">Start here</p>
          <h3>Pick a guide first. The forms and calculators appear inside the guide.</h3>
          <p>You should not have to search a form library first. Choose the closest issue, then pick one clear next step: forms, calculator, or Guided Intake.</p>
        </div>
        <div class="guide-command-actions">
          <a class="button primary" href="#guide-resource-start">Choose a DIY Guide</a>
          <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Not sure? Start Guided Intake</a>
        </div>
      </div>
      <div class="guide-path-strip" aria-label="DIY guide process">
        ${["Choose a guide", "Answer what you need", "View matched forms", "Use calculator if needed", "Start Intake if unsure"].map((step, index) => `<span><b>0${index + 1}</b>${esc(step)}</span>`).join("")}
      </div>
      <div class="guide-tools" id="guide-resource-start">
        <input type="search" placeholder="Search guides" aria-label="Search guides" data-guide-search>
        <button class="service-category-reset" type="button" data-guide-category-reset>Clear filters</button>
      </div>
      <div class="service-category-panel guide-category-panel" aria-label="Filter DIY guides by situation">
        <div class="service-category-head">
          <p class="service-search-label">Browse by situation</p>
        </div>
        <div class="service-category-list" role="group" aria-label="Guide filters">
          ${publicCategoryGroups.map((group, index) => `<button class="service-category-chip${index === 0 ? " active" : ""}" type="button" data-guide-category-filter="${esc(group.label)}" aria-pressed="${index === 0 ? "true" : "false"}">${esc(group.label)}</button>`).join("")}
        </div>
      </div>
      <div class="guide-status-row" aria-live="polite">
        <span data-guide-count>Showing ${Math.min(initialServiceCount, guides.length)} of ${guides.length} DIY guides</span>
      </div>
      <div class="guide-issue-grid" data-guide-list>${renderGuides(guides)}</div>
      <div class="guide-reveal">
        <button class="button primary guide-reveal-button" type="button" data-guide-reveal>Show all ${guides.length} guides</button>
        <button class="button outline guide-clear-button" type="button" data-guide-clear-all hidden>Show every guide</button>
        <p class="guide-note" data-guide-note>Showing the first ${Math.min(initialServiceCount, guides.length)} of ${guides.length}. Use Show all ${guides.length} guides to expand the full list.</p>
      </div>
    `);
  }

  async function loadGuides() {
    return serviceItems.map(guideFromServiceItem);
  }

  function guideFromServiceItem(item) {
    const route = intakeRouteForService(item);
    const category = item.category || "Family law";
    const issuePathway = route.issuePathway || "Not Sure";
    const forms = formsResourceForGuide(item);
    const issueProfile = issueProfileFor(item.title, category);
    return {
      slug: slugify(item.title),
      category,
      title: item.title,
      summary: issueProfile.userProblem || item.copy,
      issueProfile,
      level: `${category} guide`,
      issuePathway,
      serviceInterest: route.serviceInterest || "",
      leadCta: `Start ${item.title} Intake`,
      leadMagnet: `${item.title} readiness review`,
      formsLabel: forms.formsLabel,
      formsUrl: forms.formsUrl,
      countyFormsLabel: forms.countyFormsLabel,
      countyFormsUrl: forms.countyFormsUrl,
      phases: guidePhasesFor(item, issuePathway),
      items: guideChecklistFor(item),
      listener: guideReadinessFor(item)
    };
  }

  function formsResourceForGuide(item) {
    const title = item.title;
    const category = item.category;
    const base = {
      formsLabel: "Arizona court forms",
      formsUrl: "/tools#forms-approved-pdfs",
      countyFormsLabel: "Maricopa family court forms",
      countyFormsUrl: "/tools#forms-approved-pdfs"
    };

    if (category === "Child support" || title.includes("Support Worksheet")) {
      return {
        ...base,
        formsLabel: "Arizona child support forms",
        formsUrl: "/tools#forms-approved-pdfs"
      };
    }

    if (category === "Parenting" || category === "Parentage" || category === "Jurisdiction") {
      return {
        ...base,
        formsLabel: "Arizona family law forms",
        formsUrl: "/tools#forms-approved-pdfs"
      };
    }

    if (category === "Safety") {
      return {
        ...base,
        formsLabel: "Protective order resources",
        formsUrl: "/tools#forms-approved-pdfs"
      };
    }

    return base;
  }

  function guideFormsRouteFor(guide) {
    const title = `${guide?.title || ""}`.toLowerCase();
    const category = `${guide?.category || ""}`.toLowerCase();
    const text = `${category} ${title}`;
    let issue = "all";
    let posture = "";
    let children = "";

    if (text.includes("adoption") || text.includes("family formation")) {
      return {
        county: "",
        issue: "adoption office review",
        posture: "",
        children: "",
        pdfPacket: "all",
        formConfidence: "no-verified-form",
        expandPdfGroup: false,
        focusPacketBuilder: true,
        fromGuide: guide?.title || "Adoption Starting Point"
      };
    }

    if (title.includes("annulment")) {
      issue = "annulment";
    } else if (title.includes("name change")) {
      issue = "name change";
    } else if (title.includes("divorce") || title.includes("dissolution")) {
      issue = "divorce";
    } else if (title.includes("separation")) {
      issue = "divorce";
    } else if (title.includes("agreement") || title.includes("consent") || category.includes("agreement")) {
      issue = "divorce";
    } else if (category.includes("parenting") || category.includes("jurisdiction") || title.includes("parenting") || title.includes("custody")) {
      issue = "parenting";
    } else if (category.includes("child support") || title.includes("support")) {
      issue = "support";
    } else if (category.includes("parentage") || title.includes("paternity") || title.includes("parentage")) {
      issue = "parentage";
    } else if (category.includes("post-decree") || title.includes("modif")) {
      issue = "modification";
    } else if (title.includes("enforce") || title.includes("contempt")) {
      issue = "enforcement";
    } else if (category.includes("safety") || title.includes("protective")) {
      issue = "safety";
      posture = "Safety";
    } else if (category.includes("document") || category.includes("disclosure") || category.includes("procedure") || category.includes("court")) {
      issue = "documents";
    }

    const county = issue === "safety" ? "Statewide" : "";
    let pdfPacket = pdfPacketForFormsRoute(county, issue, posture, children);
    if (pdfPacket === "all" && county === "Maricopa") {
      if (issue === "documents") {
        if (title.includes("temporary") || title.includes("hearing") || title.includes("court appearance")) {
          pdfPacket = "maricopa-post-decree-temporary-orders";
        } else if (title.includes("financial") || title.includes("exhibit")) {
          pdfPacket = "maricopa-consent-decree-agreement";
        } else {
          pdfPacket = "maricopa-divorce-new-no-children";
        }
      }
      else if (issue === "modification") pdfPacket = "maricopa-post-decree-temporary-orders";
      else if (issue === "enforcement") pdfPacket = "maricopa-parenting-parentage-support";
      else if (issue === "safety") pdfPacket = "maricopa-protective-order-resources";
      else if (category.includes("property")) pdfPacket = "maricopa-consent-decree-agreement";
      else if (category.includes("disclosure")) pdfPacket = "maricopa-consent-decree-agreement";
      else if (category.includes("court") || category.includes("procedure")) pdfPacket = "maricopa-post-decree-temporary-orders";
      else if (category.includes("child support")) pdfPacket = "maricopa-parenting-parentage-support";
      else if (category.includes("maintenance")) pdfPacket = "maricopa-divorce-new-no-children";
      else if (category.includes("agreements") || category.includes("resolution")) pdfPacket = "maricopa-consent-decree-agreement";
      else if (title.includes("name change")) pdfPacket = "maricopa-name-change-adult-no-minor-children";
      else pdfPacket = "maricopa-divorce-new-no-children";
    }

    return {
      county,
      issue,
      posture,
      children,
      pdfPacket,
      expandPdfGroup: true,
      focusPacketBuilder: true,
      fromGuide: guide?.title || "DIY Guide"
    };
  }

  function guideCalculatorChoiceFor(guide) {
    const title = `${guide?.title || ""}`.toLowerCase();
    const category = `${guide?.category || ""}`.toLowerCase();
    const text = `${category} ${title}`;
    if (category.includes("child support") || title.includes("child support") || title.includes("support worksheet") || title.includes("arrears") || title.includes("back support")) return "support";
    if (category.includes("parenting") || category.includes("parentage") || category.includes("jurisdiction") || title.includes("parenting") || title.includes("custody") || title.includes("decision-making") || title.includes("paternity") || title.includes("parentage") || title.includes("relocation") || title.includes("grandparent") || title.includes("third-party") || title.includes("uccjea") || title.includes("dna") || title.includes("birth certificate")) return "parenting";
    if (category.includes("maintenance") || title.includes("maintenance") || title.includes("spousal")) return "maintenance";
    if (category.includes("marriage") || category.includes("agreements") || category.includes("property") || category.includes("disclosure") || title.includes("divorce") || title.includes("separation") || title.includes("annulment") || title.includes("consent") || title.includes("settlement") || title.includes("property") || title.includes("debt") || title.includes("real estate") || title.includes("financial")) return "maintenance";
    if (category.includes("resolution") && (title.includes("negotiation") || title.includes("agreement") || title.includes("settlement"))) return "support";
    if (text.includes("temporary") || text.includes("modification") || text.includes("enforcement") || text.includes("contempt") || text.includes("protective") || text.includes("safety") || text.includes("document") || text.includes("petition") || text.includes("response") || text.includes("filing") || text.includes("service") || text.includes("hearing") || text.includes("court") || text.includes("not sure") || text.includes("adoption") || text.includes("scope") || text.includes("referral") || text.includes("name change") || text.includes("mediation") || text.includes("arbitration") || text.includes("exhibit")) return "deadline";
    return "deadline";
  }

  function guidePacketChoicesFor(guide) {
    const title = `${guide?.title || ""}`.toLowerCase();
    const category = `${guide?.category || ""}`.toLowerCase();
    const text = `${category} ${title}`;
    const choice = (key, label, helper, packet, issue, posture, children = "any", confidence = "related", sourceUrl = "") => ({
      key,
      label,
      helper,
      packet,
      issue,
      posture,
      children,
      confidence,
      sourceUrl
    });
    const exact = (key, label, helper, packet, issue, posture, children = "any", sourceUrl = "") => choice(key, label, helper, packet, issue, posture, children, "exact", sourceUrl);
    const countyExact = (key, label, helper, packet, issue, posture, children = "any", sourceUrl = "") => choice(key, label, helper, packet, issue, posture, children, "county-exact", sourceUrl);
    const related = (key, label, helper, packet, issue, posture, children = "any", sourceUrl = "") => choice(key, label, helper, packet, issue, posture, children, "related", sourceUrl);
    const intakeRequired = (key, label, helper, packet, issue, posture, children = "any", sourceUrl = "") => choice(key, label, helper, packet, issue, posture, children, "intake-required", sourceUrl);
    const adoptionChoices = [
      intakeRequired("adoption-office-review", "Adoption or family-formation review", "Adoption is not mapped to parenting, guardianship, paternity, or generic family-law packets. Use office review to confirm scope and any verified county-specific source before relying on forms.", "all", "adoption office review", "", "")
    ];
    const divorceChoices = [
      countyExact("divorce-no-children", "Divorce or separation, no minor children", "Use this when the case starts a divorce or legal separation and no minor children are involved.", "maricopa-divorce-new-no-children", "divorce", "New filing", "no-minor-children"),
      countyExact("divorce-with-children", "Divorce or separation, with minor children", "Use this when the case starts a divorce or legal separation and parenting or support must also be addressed.", "maricopa-divorce-new-with-children", "divorce", "New filing", "minor-children"),
      countyExact("agreement-final", "Agreement or final decree", "Use this when both sides have an agreement and need final decree or settlement forms.", "maricopa-consent-decree-agreement", "divorce", "Agreement / final orders", "any")
    ];
    const annulmentChoices = [
      intakeRequired("annulment-source", "Annulment forms need county confirmation", "Annulment has a separate official packet path. Choose county and case stage before relying on any packet.", "all", "annulment", "", "", "https://superiorcourt.maricopa.gov/llrc/fc_group_28/"),
      related("divorce-no-children", "Related divorce/separation packet", "Use only for orientation. Annulment is a separate path and should be confirmed through Guided Intake before choosing forms.", "maricopa-divorce-new-no-children", "divorce", "New filing", "no-minor-children")
    ];
    const parentingChoices = [
      countyExact("parentage-parenting-support", "Start parenting, parentage, or support orders", "Use this when parents need first-time orders for legal decision-making, parenting time, parentage, or child support.", "maricopa-parenting-parentage-support", "parenting", "New filing", "minor-children"),
      countyExact("parenting-in-divorce", "Parenting issues in a divorce", "Use this when parenting terms are part of a new divorce or legal separation case.", "maricopa-divorce-new-with-children", "parenting", "New filing", "minor-children"),
      countyExact("foreign-custody", "Register an out-of-state custody order", "Use this when a custody or parenting order from another state needs Arizona court recognition.", "maricopa-foreign-custody-order", "parenting", "Existing order", "minor-children")
    ];
    const relocationChoices = [
      countyExact("pima-relocation", "Pima: Notice of Intent to Relocate", "Use Pima Packet 28 when the court is in Pima County and you need the relocation notice packet.", "pima-notice-of-intent-to-relocate", "relocation", "Notice of intent to relocate", "minor-children"),
      countyExact("cochise-relocation", "Cochise: Notice of Intent to Relocate", "Use the Cochise relocation notice packet when the court is in Cochise County.", "cochise-notice-of-intent-to-relocate", "relocation", "Notice of intent to relocate", "minor-children"),
      countyExact("yavapai-relocation", "Yavapai: Modification, relocation, and clarification", "Use Packet 34a when the court is in Yavapai County and the relocation issue is being combined with modification or clarification.", "yavapai-relocation-modification-clarification", "relocation", "Modify / clarify", "minor-children"),
      countyExact("maricopa-relocation", "Maricopa: Modify parenting time or child support", "Use this when Maricopa County requires the modification packet path for relocation matters.", "maricopa-modification-existing-order", "relocation", "Modify existing order", "minor-children"),
      countyExact("maricopa-relocation-temp", "Maricopa: Temporary orders with notice", "Use this when a temporary change is needed while the relocation issue is pending in Maricopa County.", "maricopa-post-decree-temporary-orders", "relocation", "Temporary relief", "minor-children"),
      related("parenting-existing", "Related parenting/order packet", "Use only after confirming whether this is a relocation notice, objection, modification, enforcement, or new parenting case.", "maricopa-parenting-parentage-support", "parenting", "Existing order", "minor-children")
    ];
    const supportChoices = [
      countyExact("new-support", "Start child support or parentage orders", "Use this when support is being started with parentage, legal decision-making, or parenting time.", "maricopa-parenting-parentage-support", "child support", "New filing", "minor-children"),
      countyExact("support-in-divorce", "Child support in a divorce", "Use this when support is part of a new divorce or legal separation case.", "maricopa-divorce-new-with-children", "child support", "New filing", "minor-children"),
      countyExact("foreign-support", "Register an out-of-state support order", "Use this when an existing support order from another state needs Arizona court recognition.", "maricopa-foreign-support-order", "child support", "Existing order", "minor-children")
    ];
    const agreementChoices = [
      countyExact("agreement-final", "Agreement or consent decree", "Use this when both sides have agreed and need final settlement or decree forms.", "maricopa-consent-decree-agreement", "agreement", "Agreement / final orders", "any"),
      countyExact("divorce-no-children", "Divorce agreement, no minor children", "Use this when the agreement belongs to a divorce or legal separation without minor children.", "maricopa-divorce-new-no-children", "divorce", "Agreement / final orders", "no-minor-children"),
      countyExact("divorce-with-children", "Divorce agreement, with minor children", "Use this when the agreement belongs to a divorce or legal separation with parenting or support terms.", "maricopa-divorce-new-with-children", "divorce", "Agreement / final orders", "minor-children")
    ];
    const postDecreeChoices = [
      countyExact("post-decree-temporary", "Temporary request after orders already exist", "Use this when there is already an order and a temporary court request is needed.", "maricopa-post-decree-temporary-orders", "modification", "Existing order", "any"),
      countyExact("foreign-custody", "Register or respond to out-of-state custody order", "Use this when an order from another state is involved.", "maricopa-foreign-custody-order", "parenting", "Existing order", "minor-children"),
      countyExact("foreign-support", "Register or respond to out-of-state support order", "Use this when an out-of-state support order is involved.", "maricopa-foreign-support-order", "child support", "Existing order", "minor-children")
    ];
    const documentChoices = [
      choice("new-divorce-no-children", "Start divorce or separation, no minor children", "Use this for a new divorce or legal separation filing without minor children.", "maricopa-divorce-new-no-children", "divorce", "New filing", "no-minor-children"),
      choice("new-divorce-with-children", "Start divorce or separation, with minor children", "Use this for a new divorce or legal separation filing with parenting or support issues.", "maricopa-divorce-new-with-children", "divorce", "New filing", "minor-children"),
      choice("parenting-support", "Start parenting, parentage, or support", "Use this for first-time parenting, parentage, or support orders outside divorce.", "maricopa-parenting-parentage-support", "parenting", "New filing", "minor-children"),
      choice("agreement-final", "Finish with an agreement", "Use this for consent decree, settlement, or final agreement forms.", "maricopa-consent-decree-agreement", "agreement", "Agreement / final orders", "any")
    ];
    const nameChangeChoices = [
      countyExact("adult-no-children", "Adult, no minor children", "Separate name-change case after divorce or outside divorce.", "maricopa-name-change-adult-no-minor-children", "name change", "New filing", "no-minor-children"),
      countyExact("adult-with-child", "Adult with a minor child", "Separate adult name-change case when the adult has a minor child.", "maricopa-name-change-adult-with-minor-child", "name change", "New filing", "minor-children"),
      countyExact("child", "Minor child", "Name-change request for a child.", "maricopa-name-change-minor-child", "name change", "New filing", "minor-children"),
      countyExact("family", "More than one family member", "Family packet for multiple related name changes.", "maricopa-name-change-family", "name change", "New filing", "minor-children"),
      countyExact("divorce", "During divorce", "Restore a former name before the decree is signed.", "maricopa-consent-decree-agreement", "divorce", "Agreement / final orders", "any"),
      countyExact("record-update", "Update court contact record", "Administrative update only; this does not legally change a name.", "maricopa-name-address-update", "name or address update", "Existing order", "any")
    ];

    if (title.includes("name change")) return nameChangeChoices;
    if (text.includes("adoption") || text.includes("family formation")) return adoptionChoices;
    if (title.includes("annulment")) return annulmentChoices;
    if (title.includes("relocation")) return relocationChoices;
    if (text.includes("divorce") || text.includes("dissolution") || text.includes("legal separation") || text.includes("annulment")) return divorceChoices;
    if (text.includes("consent") || text.includes("settlement") || text.includes("agreement") || category.includes("resolution")) return agreementChoices;
    if (text.includes("parenting") || text.includes("legal decision") || text.includes("custody") || text.includes("relocation") || text.includes("grandparent") || text.includes("third-party") || text.includes("uccjea")) return parentingChoices;
    if (text.includes("child support") || text.includes("arrears") || text.includes("support worksheet")) return supportChoices;
    if (text.includes("paternity") || text.includes("parentage") || text.includes("dna") || text.includes("birth certificate") || text.includes("same-sex parentage")) return [parentingChoices[0]];
    if (text.includes("modification") || text.includes("enforcement") || text.includes("contempt") || text.includes("withheld") || text.includes("missed time")) return postDecreeChoices;
    if (text.includes("temporary") || category.includes("court") || text.includes("hearing") || text.includes("appearance")) return [postDecreeChoices[0], parentingChoices[0], divorceChoices[1]];
    if (category.includes("property") || text.includes("property") || text.includes("debt") || text.includes("real estate") || text.includes("home")) return [agreementChoices[0], divorceChoices[0], divorceChoices[1]];
    if (category.includes("maintenance") || text.includes("maintenance") || text.includes("spousal")) return [divorceChoices[0], divorceChoices[1], agreementChoices[0]];
    if (category.includes("documents") || category.includes("procedure") || category.includes("disclosure") || text.includes("petition") || text.includes("filing") || text.includes("response")) return documentChoices;
    if (category.includes("safety") || text.includes("protective")) return [
      choice("protective-order", "Safety order resources", "Use this for protective-order planning resources. Emergency safety issues should use the official emergency path.", "maricopa-protective-order-resources", "safety", "Urgent / safety", "any")
    ];
    return [];
  }

  function guidePdfSearchText(action) {
    return [
      action?.public_name,
      action?.display_label,
      action?.label,
      action?.file_name,
      action?.public_file_code,
      action?.public_stage,
      action?.public_description
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function guidePdfRelevanceScore(action, formsRoute, guideTitle) {
    const text = guidePdfSearchText(action);
    const title = `${guideTitle || ""}`.toLowerCase();
    const stage = `${action?.public_stage || ""}`.toLowerCase();
    let score = 50;

    if (action?.language === "English") score -= 30;
    else score += 30;

    if (text.includes("petition")) score -= 28;
    if (text.includes("consent decree")) score -= title.includes("consent") || title.includes("agreement") ? 38 : 16;
    if (text.includes("summary consent decree forms packet")) score -= 34;
    if (text.includes("property") || text.includes("debt")) score -= title.includes("property") || title.includes("debt") || title.includes("settlement") ? 36 : 6;
    if (text.includes("parenting plan")) score -= title.includes("parenting plan") || title.includes("parenting time") || title.includes("legal decision") ? 36 : 10;
    if (text.includes("legal decision-making") || text.includes("parenting time")) score -= title.includes("legal decision") || title.includes("parenting") || title.includes("custody") ? 24 : 6;
    if (text.includes("child support")) score -= title.includes("support") || title.includes("paternity") || title.includes("parentage") ? 26 : 4;
    if (text.includes("paternity")) score -= title.includes("paternity") || title.includes("parentage") ? 36 : 8;
    if (text.includes("temporary orders")) score -= title.includes("temporary") || title.includes("hearing") || title.includes("court") ? 36 : 8;
    if (text.includes("protective order")) score -= title.includes("protective") || title.includes("safety") ? 36 : 10;
    if (text.includes("name or address")) score -= title.includes("name") || title.includes("address") ? 36 : 0;
    if (text.includes("foreign") || text.includes("out of state")) score -= title.includes("foreign") || title.includes("interstate") || title.includes("uccjea") ? 36 : 0;

    if (text.includes("sensitive data cover sheet")) score += 8;
    if (stage.includes("start here") || text.includes("before you file") || text.includes("instructions")) score -= 42;
    if (text.includes("notice / order")) score += 22;

    if (formsRoute?.children === "no-minor-children" && (text.includes("parenting") || text.includes("child support") || text.includes("children"))) score += 80;
    if (formsRoute?.children === "minor-children" && (text.includes("parenting") || text.includes("child support"))) score -= 12;

    return score;
  }

  function sortGuidePdfActions(actions, formsRoute, guideTitle) {
    return [...actions].sort((a, b) => {
      const scoreA = guidePdfRelevanceScore(a, formsRoute, guideTitle);
      const scoreB = guidePdfRelevanceScore(b, formsRoute, guideTitle);
      if (scoreA !== scoreB) return scoreA - scoreB;
      const langA = a.language === "English" ? 0 : 1;
      const langB = b.language === "English" ? 0 : 1;
      if (langA !== langB) return langA - langB;
      return String(a.public_stage || a.public_name || "").localeCompare(String(b.public_stage || b.public_name || ""));
    });
  }

  function formConfidenceLabel(confidence, county) {
    const publicCounty = normalizeFormsCounty(county);
    if (confidence === "exact") return "Matched forms";
    if (confidence === "exact-county-direct-packet") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `Matched forms for ${publicCounty} County` : "Matched county forms";
    if (confidence === "exact-county-packet-page") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `Official ${publicCounty} County packet` : "Official county packet";
    if (confidence === "verified-statewide-direct-packet" || confidence === "verified-statewide-packet-page") return "Arizona statewide forms";
    if (confidence === "issue-specific-county-source-page") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `Official ${publicCounty} County forms source for this issue` : "Official county forms source for this issue";
    if (confidence === "general-county-forms-index") return "General county forms directory";
    if (confidence === "no-verified-form") return "No verified form packet";
    if (confidence === "county-exact") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `Matched forms for ${publicCounty} County` : "Matched county forms";
    if (confidence === "intake-required") return "Check first";
    if (confidence === "statewide-generic") return "Arizona statewide forms";
    if (confidence === "related-only") return "Related official resource";
    return "Office review recommended";
  }

  function formConfidenceCopy(confidence, county) {
    const publicCounty = normalizeFormsCounty(county);
    if (confidence === "exact") return "These forms are matched to the selected issue.";
    if (confidence === "exact-county-direct-packet") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `These direct forms are matched for ${publicCounty} County. Use them only if that is your case county.` : "These direct forms are matched to a confirmed county.";
    if (confidence === "exact-county-packet-page") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `This is an official ${publicCounty} County packet page for the selected issue. Review the page before choosing forms.` : "This is an official county packet page for the selected issue.";
    if (confidence === "verified-statewide-direct-packet" || confidence === "verified-statewide-packet-page") return "These are Arizona statewide forms. Confirm whether your county also requires a local form.";
    if (confidence === "issue-specific-county-source-page") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `This official ${publicCounty} County source is specific to this issue, but individual PDFs have not all been matched on this page.` : "This official county source is specific to this issue, but individual PDFs have not all been matched on this page.";
    if (confidence === "general-county-forms-index") return "This is a general county forms directory, not an issue-specific packet. Do not treat it as matched forms.";
    if (confidence === "no-verified-form") return "No verified form packet is currently available for these answers.";
    if (confidence === "county-exact") return publicCounty && publicCounty !== "Not sure" && publicCounty !== "Statewide" ? `These forms are matched for ${publicCounty} County. Use them only if that is your case county.` : "These forms are matched to a confirmed county.";
    if (confidence === "intake-required") return "Use Guided Intake before choosing forms. This issue depends on timing, court orders, county, or case stage.";
    if (confidence === "statewide-generic") return "Use this statewide form path, then confirm whether your county requires local forms.";
    if (confidence === "related-only") return "This guide can start the form check, but the form questions still need to be answered.";
    return "Use office review before relying on this resource as a form match.";
  }

  function guideResourceSummaryFor(guide) {
    const calculatorChoice = guideCalculatorChoiceFor(guide);
    if (calculatorChoice === "support") return "This guide can open matched forms and the child-support calculator.";
    if (calculatorChoice === "parenting") return "This guide can open matched forms and the parenting-time counter.";
    if (calculatorChoice === "maintenance") return "This guide can open matched forms and the spousal-maintenance calculator.";
    if (calculatorChoice === "deadline") return "This guide can open matched forms and the deadline-readiness planner.";
    return "This guide can open matched forms or send the issue to Guided Intake.";
  }

  const publicPlanningRules = [
    "Use only issue type, county, case status, deadline yes/no, children yes/no, and filing posture before Guided Intake.",
    "Do not ask for full opposing-party names, child names, birth dates, account numbers, full financial disclosures, uploads, or detailed allegations in public tools.",
    "Treat every public tool output as a planning summary, not a legal opinion, client record, or confirmed representation.",
    "If the user needs forms or calculators, preserve only non-sensitive public answer context until conflict, scope, and engagement review are complete."
  ];

  const jurisdictionQuestions = [
    ["What county is the case in?", "County determines the packet set first. Pick the superior court where the case belongs before anything else."],
    ["Are minor children involved?", "Children change the packet, especially for parenting time, legal decision-making, support, and relocation."],
    ["Is this a new filing or an existing case?", "New cases use a different packet family than responses, modifications, enforcement, or post-decree requests."],
    ["Is there already an agreement or final order?", "Agreement packets and final-order packets are different from contested filing packets."],
    ["Has someone been served or is there a deadline?", "Timing can change whether response, temporary-order, or deadline-readiness materials are the safest starting point."],
    ["Do current court orders already exist?", "Existing orders can change whether modification, enforcement, contempt, or clarification forms are the right starting point."],
    ["Is safety involved?", "Safety issues should be screened before general forms so the next step does not miss urgent options."],
    ["County unknown?", "Use statewide Arizona resources first, then choose the correct superior court once county can be identified."]
  ];

  const formsPlanningCatalog = [
    {
      group: "Start a family-law case",
      matters: "Divorce, legal separation, annulment, paternity, initial parenting/support",
      posture: "New filing",
      source: "Arizona statewide forms + county filing instructions",
      status: "Catalog foundation"
    },
    {
      group: "Respond to papers",
      matters: "Response, service issues, default prevention, urgent deadlines",
      posture: "Served / response",
      source: "County-specific response packets and Arizona family-law forms",
      status: "Needs county match"
    },
    {
      group: "Agreement and final orders",
      matters: "Consent decree, settlement agreement, parenting plan, child support worksheet",
      posture: "Agreement / finalization",
      source: "Court packet + proposed-order requirements",
      status: "High priority"
    },
    {
      group: "Post-decree changes",
      matters: "Modification, enforcement, contempt, arrears, parenting-time changes",
      posture: "Existing order",
      source: "County forms tied to existing case and order type",
      status: "Needs order review"
    },
    {
      group: "Court readiness",
      matters: "Temporary orders, RMC, hearing preparation, disclosure, exhibits",
      posture: "Hearing / disclosure",
      source: "Court instructions, disclosure forms, exhibit and hearing resources",
      status: "Checklist first"
    }
  ];

  const formResourceCatalog = [
    {
      title: "Arizona Statewide Family-Law Forms",
      county: "Statewide",
      issues: ["all", "not sure", "documents", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official source",
      source: "Arizona Judicial Branch",
      url: "https://www.azcourts.gov/selfservicecenter/forms",
      note: "Use when county is unknown or a statewide packet is the safer first stop."
    },
    {
      title: "AZCourtHelp AZ Forms",
      county: "Statewide",
      issues: ["all", "not sure", "documents", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Statewide source",
      source: "AZCourtHelp",
      url: "https://azcourthelp.org/forms",
      note: "Central Arizona forms directory that connects statewide resources with county-specific requirements."
    },
    {
      title: "Maricopa Family Court Forms Library",
      county: "Maricopa",
      issues: ["all", "divorce", "legal separation", "parenting", "support", "parentage", "modification", "enforcement", "name change", "documents"],
      posture: "Any posture",
      status: "Official source",
      source: "Superior Court of Arizona in Maricopa County",
      url: "https://superiorcourt.maricopa.gov/llrc/family-court-forms/",
      note: "Primary county source for Maricopa packets, instructions, and updates."
    },
    {
      title: "Maricopa Clerk Filing and Records Resources",
      county: "Maricopa",
      issues: ["filing", "service", "deadline", "documents", "not sure"],
      posture: "Any posture",
      status: "Official filing source",
      source: "Clerk of the Superior Court of Maricopa County",
      url: "https://www.clerkofcourt.maricopa.gov/",
      note: "Use for filing, records, fees, and clerk-process checks; court-form packet selection still routes through the court forms library."
    },
    {
      title: "Start Divorce or Legal Separation",
      county: "Maricopa",
      issues: ["divorce", "legal separation", "property", "maintenance"],
      posture: "New filing",
      status: "County packet source",
      source: "Maricopa County Superior Court",
      url: "https://superiorcourt.maricopa.gov/llrc/family-court-forms/",
      note: "Choose by children involved, agreement status, service, property, debt, and support issues before choosing a packet."
    },
    {
      title: "Respond to Family-Court Papers",
      county: "Maricopa",
      issues: ["response", "divorce", "parenting", "support", "parentage", "deadline"],
      posture: "Served / response",
      status: "County packet source",
      source: "Maricopa County Superior Court",
      url: "https://superiorcourt.maricopa.gov/llrc/family-court-forms/",
      note: "Use when papers were served, a response deadline exists, or default risk needs screening."
    },
    {
      title: "Consent Decree and Agreements",
      county: "Maricopa",
      issues: ["agreement", "consent decree", "parenting plan", "child support worksheet", "divorce", "name change"],
      posture: "Agreement / final orders",
      status: "County packet source",
      source: "Maricopa County Superior Court",
      url: "https://superiorcourt.maricopa.gov/llrc/family-court-forms/",
      note: "Use for agreed divorce/separation finalization, parenting terms, and proposed-order readiness."
    },
    {
      title: "Name Change Decision Path",
      county: "Maricopa",
      issues: ["name change", "identity"],
      posture: "New filing",
      status: "On-site packets",
      source: "Maricopa County Superior Court",
      url: "#forms-approved-pdfs",
      note: "Use this when a name change is separate from a pending divorce decree or when a child/family name-change packet is needed."
    },
    {
      title: "Modify or Enforce Existing Orders",
      county: "Maricopa",
      issues: ["modification", "enforcement", "contempt", "support", "parenting", "maintenance"],
      posture: "Existing order",
      status: "County packet source",
      source: "Maricopa County Superior Court",
      url: "https://superiorcourt.maricopa.gov/llrc/family-court-forms/",
      note: "Existing case county and current order type control the safest next packet."
    },
    {
      title: "Protective Order Resources",
      county: "Statewide",
      issues: ["safety", "protective order", "injunction", "emergency"],
      posture: "Safety",
      status: "Official source",
      source: "Arizona Judicial Branch",
      url: "https://azpoint.azcourts.gov/",
      note: "Use official protective-order resources first for urgent safety-related court access."
    },
    {
      title: "Pima County Family Law Forms",
      county: "Pima",
      issues: ["all", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "County fallback",
      source: "Pima County Superior Court",
      url: "https://www.sc.pima.gov/law-library/forms/",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Pinal County Family Law Forms",
      county: "Pinal",
      issues: ["all", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "County fallback",
      source: "Pinal County Superior Court",
      url: "https://www.coscpinalcountyaz.gov/194/Family-Law",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Pinal Superior Court Official Website",
      county: "Pinal",
      issues: ["all", "not sure", "filing", "deadline", "documents"],
      posture: "Any posture",
      status: "Official court source",
      source: "Superior Court of Arizona in Pinal County",
      url: "https://www.pinalcourtsaz.gov/",
      note: "Use as a court-information fallback; packet-level form selection should still prefer reviewed county form pages."
    },
    {
      title: "Apache County Superior Court Family-Law Source",
      county: "Apache",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official source listed",
      source: "Superior Court of Arizona in Apache County",
      url: "https://www.apachecountyaz.gov/superior-court",
      note: "Official county source is listed for county routing. Automated monitoring is blocked, so use Guided Intake before relying on packet details."
    },
    {
      title: "Cochise County Family Law Forms",
      county: "Cochise",
      issues: ["all", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Cochise County",
      url: "https://www.cochise.az.gov/244/Family-Law-Forms",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Coconino County Family Law Source",
      county: "Coconino",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official source listed",
      source: "Superior Court of Arizona in Coconino County",
      url: "https://www.coconino.az.gov/870/Family-Law",
      note: "Official county source is listed for county routing. Automated monitoring is blocked, so use Guided Intake before relying on packet details."
    },
    {
      title: "Gila County Clerk Family Forms",
      county: "Gila",
      issues: ["all", "divorce", "parenting", "support", "parentage", "modification", "enforcement", "filing"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Gila County",
      url: "https://www.gilacountyaz.gov/government/courts/clerk_of_the_court/miscellaneousforms.php",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Graham County Superior Court Forms",
      county: "Graham",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official source listed",
      source: "Superior Court of Arizona in Graham County",
      url: "https://www.graham.az.gov/781/Superior-Court-Forms",
      note: "Official county source is listed for county routing. Automated monitoring is blocked, so use Guided Intake before relying on packet details."
    },
    {
      title: "Greenlee County Courts Official Source",
      county: "Greenlee",
      issues: ["all", "not sure", "filing", "documents"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Greenlee County",
      url: "https://greenlee.az.gov/ova_dep/courts/",
      note: "Use as a county court-information fallback when packet-level family-law forms are not clearly published."
    },
    {
      title: "La Paz County Self-Service Center",
      county: "La Paz",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in La Paz County",
      url: "https://www.lapazsuperiorcourtclerk.com/self-service-center.html",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Mohave County Family Court Forms and Kits",
      county: "Mohave",
      issues: ["all", "divorce", "legal separation", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Mohave County",
      url: "https://www.mohavecourts.com/forms-form-kits-page/families-children-forms-kits",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Navajo County Court Forms",
      county: "Navajo",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Navajo County",
      url: "https://www.navajocountyaz.gov/761/Court-Forms",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Santa Cruz County Clerk of the Superior Court",
      county: "Santa Cruz",
      issues: ["all", "not sure", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official source listed",
      source: "Superior Court of Arizona in Santa Cruz County",
      url: "https://www.santacruzcountyaz.gov/132/Clerk-of-the-Superior-Court",
      note: "Official county source is listed for county routing. Automated monitoring is blocked, so use Guided Intake before relying on packet details."
    },
    {
      title: "Yuma County Family Law Self-Service Center",
      county: "Yuma",
      issues: ["all", "divorce", "legal separation", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "Official county source",
      source: "Superior Court of Arizona in Yuma County",
      url: "https://www.yumacountyaz.gov/government/courts/self-service-center/family-law",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "Yavapai County Family Law Forms",
      county: "Yavapai",
      issues: ["all", "divorce", "parenting", "support", "parentage", "modification", "enforcement"],
      posture: "Any posture",
      status: "County fallback",
      source: "Yavapai County Superior Court",
      url: "https://courts.yavapaiaz.gov/Departments/Law-Library/Self-Service-Center/Domestic",
      note: "County source should be verified before packet-level download links are cached."
    },
    {
      title: "National Legal Support Services Forms Index",
      county: "Reference",
      issues: ["all", "documents", "name change", "divorce", "parenting", "support", "parentage"],
      posture: "Research only",
      status: "Reference index",
      source: "National Legal Support Services",
      url: "https://nationallegalsupportservices.com/forms/",
      note: "Use only to discover possible Arizona form names or IDs. Do not treat this as the official court source for user downloads."
    },
    {
      title: "eForms Arizona Reference Pages",
      county: "Reference",
      issues: ["documents", "name change", "research"],
      posture: "Research only",
      status: "Access-restricted reference",
      source: "eForms",
      url: "https://eforms.com/",
      note: "Automated checks are blocked, so this must remain research-only and must not be used for public form routing."
    }
  ];

  const formRouterIssues = [
    ["all", "All family-law resources"],
    ["divorce", "Divorce / separation"],
    ["parenting", "Parenting / legal decision-making"],
    ["support", "Child support"],
    ["parentage", "Paternity / parentage"],
    ["name change", "Name change"],
    ["modification", "Modification"],
    ["enforcement", "Enforcement / contempt"],
    ["safety", "Protective orders / safety"],
    ["documents", "Document review"]
  ];

  const arizonaCountyOptions = [
    "Apache",
    "Cochise",
    "Coconino",
    "Gila",
    "Graham",
    "Greenlee",
    "La Paz",
    "Maricopa",
    "Mohave",
    "Navajo",
    "Pima",
    "Pinal",
    "Santa Cruz",
    "Yavapai",
    "Yuma"
  ];
  const formRouterCounties = ["Not sure", ...arizonaCountyOptions];
  function normalizeFormsCounty(value) {
    const county = String(value || "").trim();
    if (!county || county === "Choose county") return "Not sure";
    return county;
  }
  function normalizeFormsPosture(value) {
    const posture = String(value || "").trim();
    if (!posture || posture === "Choose stage") return "Any posture";
    return posture;
  }
  function normalizeFormsChildren(value) {
    const children = String(value || "").trim();
    if (!children || children === "Choose one") return "any";
    return children;
  }
  function displayFormsCounty(value) {
    const county = normalizeFormsCounty(value);
    return county === "Not sure" ? "Choose county" : county;
  }
  function displayFormsPosture(value) {
    const posture = normalizeFormsPosture(value);
    return posture === "Any posture" ? "Choose stage" : posture;
  }
  function displayFormsChildren(value) {
    const children = normalizeFormsChildren(value);
    if (children === "any") return "Choose one";
    if (children === "minor-children") return "Minor children involved";
    if (children === "no-minor-children") return "No minor children";
    return children;
  }
  function publicIssueLabelForRoute(route) {
    const detail = route || {};
    const rawIssue = normalizeFormsIssue(detail.issue);
    const context = `${detail.publicIssueLabel || ""} ${detail.fromGuide || ""} ${detail.fromPracticeArea || ""} ${detail.guideTitle || ""} ${detail.packetLabel || ""}`.toLowerCase();
    const labels = {
      annulment: "Annulment",
      "adult adoption": "Adult Adoption",
      divorce: "Divorce / Legal Separation",
      "legal separation": "Divorce / Legal Separation",
      support: "Child Support",
      "child support": "Child Support",
      parentage: "Paternity / Parentage",
      paternity: "Paternity / Parentage",
      parenting: "Parenting Time / Legal Decision-Making",
      custody: "Parenting Time / Legal Decision-Making",
      modification: "Modification",
      enforcement: "Enforcement / Contempt",
      contempt: "Enforcement / Contempt",
      safety: "Protective Orders / Safety",
      "protective order": "Protective Orders / Safety",
      "protective order / safety": "Protective Orders / Safety",
      injunction: "Protective Orders / Safety",
      emergency: "Protective Orders / Safety",
      documents: "Document Preparation / Filing Help",
      "document preparation": "Document Preparation / Filing Help",
      "filing help": "Document Preparation / Filing Help",
      filing: "Document Preparation / Filing Help",
      service: "Filing / Service Coordination",
      disclosure: "Financial Disclosure",
      research: "Document Preparation / Filing Help",
      response: "Response to Served Papers",
      agreement: "Agreements / Consent Decree",
      "consent decree": "Agreements / Consent Decree",
      "parenting plan": "Parenting Plan",
      "child support worksheet": "Child Support Worksheet",
      mediation: "Mediation / ADR",
      "mediation preparation": "Mediation / ADR",
      adr: "Mediation / ADR",
      "limited scope representation": "Limited Scope Representation",
      relocation: "Relocation",
      "name change": "Name Change",
      "grandparent visitation": "Third-Party / Grandparent Rights",
      "grandparent rights": "Third-Party / Grandparent Rights",
      "third party rights": "Third-Party / Grandparent Rights",
      "third-party rights": "Third-Party / Grandparent Rights",
      "foreign custody / uccjea order": "UCCJEA / Interstate Custody",
      "interstate custody": "UCCJEA / Interstate Custody",
      "foreign support order": "Interstate / Foreign Support Order",
      "foreign family-court order": "Interstate / Foreign Family-Court Order",
      "foreign order": "Interstate / Foreign Family-Court Order",
      "out of state custody enforcement": "Interstate Custody Enforcement",
      "out-of-state custody enforcement": "Interstate Custody Enforcement",
      "income withholding / support": "Income Withholding / Child Support",
      "paternity / parenting time / child support": "Paternity, Parenting Time & Child Support",
      "temporary orders / court readiness": "Temporary Orders / Court Preparation",
      "post decree temporary orders": "Post-Decree Temporary Orders",
      "post-decree temporary orders": "Post-Decree Temporary Orders",
      "property division enforcement": "Property Division Enforcement",
      property: "Property / Debt",
      "name or address update": "Name / Address Update",
      adoption: "Adult Adoption",
      "special scope": "Scope Review",
      deadline: "Deadline / Served Papers",
      identity: "Name Change",
      "issue search": "Choose issue",
      "forms & tools": "Choose issue",
      "diy guide match": "Choose issue",
      "calculator routing help requested": "Choose issue",
      "official sources / reviewed routes / calculator readiness": "Choose issue",
      "public review status / source-only limits": "Choose issue",
      "official-source checks / safe form access": "Choose issue",
      "official pdfs available / site downloads enabled": "Choose issue",
      "public parenting-time planning tool selected": "Parenting Time / Legal Decision-Making",
      maintenance: "Spousal Maintenance",
      "spousal maintenance": "Spousal Maintenance"
    };
    const compactIssue = rawIssue.replace(/[-_]+/g, " ");
    if (labels[compactIssue]) return labels[compactIssue];
    if (labels[rawIssue]) return labels[rawIssue];
    if (context.includes("mediation") || context.includes("adr") || context.includes("arbitration")) return "Mediation / ADR";
    if (context.includes("negotiation") || context.includes("settlement")) return "Negotiation / Settlement";
    if (!rawIssue || rawIssue === "all" || rawIssue === "any" || rawIssue === "undefined" || rawIssue === "null") return "Choose issue";
    return "Choose issue";
  }
  function isPublicAnswerDefault(field, value) {
    const normalized = String(value || "").trim();
    if (!normalized) return true;
    if (field === "county") return normalizeFormsCounty(normalized) === "Not sure";
    if (field === "issue") return normalizeFormsIssue(normalized) === "all";
    if (field === "posture") return normalizeFormsPosture(normalized) === "Any posture";
	    if (field === "children") return normalizeFormsChildren(normalized) === "any";
	    if (field === "selectedPacket") return !normalized || normalized === "all" || normalized === "maricopa-divorce-new-no-children" || normalized === "maricopa-divorce-new-with-children";
	    if (field === "selectedCalculator") return !normalized || normalized === "deadline";
	    if (field === "packetSourceCounty") return normalizeFormsCounty(normalized) === "Not sure";
	    return !normalized;
	  }
  function confirmedPublicValue(field, value) {
    return isPublicAnswerDefault(field, value) ? "" : value;
  }
  function publicAnswerFieldsFromOption(value, fallbackFields = []) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === "object") return Object.keys(value).filter((key) => value[key]);
    return fallbackFields;
  }
	  function publicAnswerSource(options = {}) {
	    return options.source || options.sourcePathway || (options.explicitReset ? "explicit-reset" : options.userAction ? "user" : options.confirmed ? "confirmed-carry-forward" : options.suggested ? "suggested" : "route");
	  }
	  function isPacketMetadataSource(value) {
	    const source = String(value || "").trim().toLowerCase();
	    return [
	      "packet-metadata",
	      "legacy-packet-metadata",
	      "route-action-packet",
	      "route-action-pdf",
	      "official-packet-action",
	      "official-pdf-action",
	      "forms-router-packet"
	    ].includes(source);
	  }
	  function clearPublicAnswerMeta(meta, field) {
	    if (!meta || !field) return;
	    if (meta.confirmedFields) delete meta.confirmedFields[field];
	    if (meta.fieldSources) delete meta.fieldSources[field];
	    if (meta.suggestedFields) delete meta.suggestedFields[field];
	    if (meta.explicitUnknownFields) delete meta.explicitUnknownFields[field];
	    if (meta.resetFields) meta.resetFields[field] = true;
	  }
	  function routeSummaryParts(route) {
	    const detail = route || {};
	    return [
	      displayFormsCounty(detail.county),
	      publicIssueLabelForRoute(detail),
	      displayFormsPosture(detail.posture),
	      displayFormsChildren(detail.children)
	    ].filter((item) => item && !/^(Choose issue|Choose county|Choose stage|Choose one|Not selected)$/i.test(item));
	  }
  function canWritePublicAnswerField(field, incoming, existing, options = {}) {
    if (options.reset === true || options.explicitReset === true) return true;
    if (field === "need" || field === "sourcePathway" || field === "selectedGuide" || field === "selectedPracticeArea") return Boolean(incoming);
    const incomingDefault = isPublicAnswerDefault(field, incoming);
    const existingConfirmed = Boolean(confirmedPublicValue(field, existing));
    const actionConfirmedFields = publicAnswerFieldsFromOption(options.confirmedFields, []);
    const actionSuggestedFields = publicAnswerFieldsFromOption(options.suggestedFields, []);
    const fieldConfirmedByAction = actionConfirmedFields.includes(field);
    const fieldSuggestedByAction = actionSuggestedFields.includes(field);
    if (fieldSuggestedByAction && existingConfirmed && !fieldConfirmedByAction && options.allowSuggestedOverwrite !== true) return false;
    if (existingConfirmed && options.userAction === true && !fieldConfirmedByAction && options.allowOverwrite !== true) return false;
    if (incomingDefault && existingConfirmed && options.userAction === true && !fieldConfirmedByAction && options.allowDefaults !== true) return false;
    if (existingConfirmed && options.userAction !== true && options.confirmed !== true && options.allowOverwrite !== true) return false;
    if (incomingDefault && existingConfirmed && options.userAction !== true && options.confirmed !== true && options.allowDefaults !== true) return false;
    if (incomingDefault && options.userAction !== true && options.confirmed !== true && options.allowDefaults !== true) return !existingConfirmed;
    return true;
  }
  function commitPublicAnswers(answers = {}, options = {}) {
    const existingRaw = storedPublicAnswers();
    const existing = normalizePublicAnswers(existingRaw);
    const incomingRaw = answers || {};
    const incoming = normalizePublicAnswers(incomingRaw);
    const protectedFields = [
      "need",
      "issue",
      "county",
      "posture",
      "children",
      "agreementStatus",
      "existingOrders",
      "timing",
      "safety",
      "selectedGuide",
      "selectedPracticeArea",
      "selectedPacket",
      "selectedCalculator",
      "sourcePathway"
    ];
    const confirmedFieldsFromOptions = publicAnswerFieldsFromOption(options.confirmedFields, options.userAction || options.confirmed ? protectedFields : []);
    const suggestedFieldsFromOptions = publicAnswerFieldsFromOption(options.suggestedFields, []);
    const resetFieldsFromOptions = publicAnswerFieldsFromOption(options.resetFields, ["issue", "county", "posture", "children", "selectedPacket", "selectedCalculator"]);
	    const meta = {
	      confirmedFields: { ...(existingRaw.confirmedFields || {}) },
	      fieldSources: { ...(existingRaw.fieldSources || {}), ...(incomingRaw.fieldSources || {}) },
	      suggestedFields: { ...(existingRaw.suggestedFields || {}) },
	      explicitUnknownFields: { ...(existingRaw.explicitUnknownFields || {}) },
	      resetFields: { ...(existingRaw.resetFields || {}) }
    };
    const source = publicAnswerSource(options);
    const next = {
      ...existingRaw,
      ...existing,
      confirmedFields: meta.confirmedFields,
      fieldSources: meta.fieldSources,
      suggestedFields: meta.suggestedFields,
      explicitUnknownFields: meta.explicitUnknownFields,
      resetFields: meta.resetFields,
      updatedAt: new Date().toISOString()
    };
	    protectedFields.forEach((field) => {
	      const incomingValue = incoming[field];
	      if (options.reset !== true && options.explicitReset !== true && (meta.resetFields[field] || meta.explicitUnknownFields[field]) && !confirmedFieldsFromOptions.includes(field)) return;
	      if (canWritePublicAnswerField(field, incomingValue, existing[field], options)) {
	        next[field] = incomingValue;
        if (suggestedFieldsFromOptions.includes(field)) {
          meta.suggestedFields[field] = true;
          meta.fieldSources[field] = source;
          delete meta.confirmedFields[field];
          delete meta.explicitUnknownFields[field];
	        } else if (confirmedFieldsFromOptions.includes(field)) {
	          meta.confirmedFields[field] = true;
	          meta.fieldSources[field] = source;
	          delete meta.suggestedFields[field];
	          delete meta.resetFields[field];
	          if (["county", "issue", "posture", "children"].includes(field) && isPublicAnswerDefault(field, incomingValue)) meta.explicitUnknownFields[field] = true;
	          else delete meta.explicitUnknownFields[field];
	        } else if (isPublicAnswerDefault(field, incomingValue)) {
	          clearPublicAnswerMeta(meta, field);
        }
	      }
	    });
	    if (!isPublicAnswerDefault("packetSourceCounty", incoming.packetSourceCounty)) {
	      next.packetSourceCounty = incoming.packetSourceCounty;
	      meta.fieldSources.packetSourceCounty = incomingRaw.fieldSources?.packetSourceCounty || source;
	      delete meta.confirmedFields.packetSourceCounty;
	      delete meta.suggestedFields.packetSourceCounty;
	      delete meta.explicitUnknownFields.packetSourceCounty;
	      delete meta.resetFields.packetSourceCounty;
	    }
	    Object.entries(incomingRaw).forEach(([key, value]) => {
	      if (!(key in next) && value !== undefined && value !== null && value !== "") next[key] = value;
	    });
    if (options.reset === true || options.explicitReset === true) {
      next.issue = incoming.issue;
      next.county = incoming.county;
      next.posture = incoming.posture;
      next.children = incoming.children;
      next.selectedPacket = incoming.selectedPacket;
      next.selectedCalculator = incoming.selectedCalculator;
      resetFieldsFromOptions.forEach((field) => clearPublicAnswerMeta(meta, field));
    }
    try {
      window.sessionStorage.setItem("mflgPublicAnswers", JSON.stringify(next));
    } catch (error) {
      /* Public routing still works without session storage. */
    }
    window.MFLGPublicAnswers = { ...next };
    return next;
  }
	  function legacyValueAllowed(field, value, legacy = {}) {
	    if (isPublicAnswerDefault(field, value)) return false;
	    if (field === "county" && isPacketMetadataSource(legacy.sourcePathway || legacy.source || legacy.entrySource)) return false;
	    if (field === "county" && normalizeFormsCounty(value) === "Maricopa" && legacy.confirmed !== true && legacy.userConfirmed !== true) return false;
	    if (field === "posture" && normalizeFormsPosture(value) === "New filing" && legacy.confirmed !== true && legacy.userConfirmed !== true && legacy.sourcePathway !== "packet-metadata") return false;
	    return true;
	  }
	  function mergePublicAnswersWithLegacy(canonicalInput, legacyInput) {
	    const canonicalRaw = canonicalInput || {};
	    const legacyRaw = legacyInput || {};
	    const canonical = normalizePublicAnswers(canonicalRaw);
	    const legacy = normalizePublicAnswers({
      ...legacyRaw,
      selectedPacket: legacyRaw.selectedPacket || legacyRaw.pdfPacket,
      selectedCalculator: legacyRaw.selectedCalculator || legacyRaw.calculatorChoice
	    });
	    const merged = { ...canonicalRaw, ...canonical };
	    const resetFields = canonicalRaw.resetFields || {};
	    const explicitUnknownFields = canonicalRaw.explicitUnknownFields || {};
	    const fieldSources = { ...(canonicalRaw.fieldSources || {}) };
	    if (isPacketMetadataSource(legacyRaw.sourcePathway || legacyRaw.source || legacyRaw.entrySource) && !resetFields.county && !explicitUnknownFields.county && !confirmedPublicValue("packetSourceCounty", merged.packetSourceCounty) && !isPublicAnswerDefault("packetSourceCounty", legacy.county)) {
	      merged.packetSourceCounty = legacy.county;
	      fieldSources.packetSourceCounty = "legacy-packet-metadata";
	    }
	    [
	      ["county", "county"],
	      ["issue", "issue"],
	      ["posture", "posture"],
      ["children", "children"],
      ["selectedPacket", "selectedPacket"],
      ["selectedCalculator", "selectedCalculator"],
      ["selectedGuide", "selectedGuide"],
	      ["selectedPracticeArea", "selectedPracticeArea"]
	    ].forEach(([field, legacyField]) => {
	      if (!resetFields[field] && !explicitUnknownFields[field] && !confirmedPublicValue(field, merged[field]) && legacyValueAllowed(field, legacy[legacyField], legacyRaw)) {
	        merged[field] = legacy[legacyField];
	        fieldSources[field] = legacyRaw.confirmed === true || legacyRaw.userConfirmed === true ? "legacy-confirmed-migration" : "legacy-migration";
	      }
	    });
	    merged.fieldSources = fieldSources;
	    merged.sourcePathway = merged.sourcePathway || canonical.sourcePathway || legacy.sourcePathway || "";
	    merged.updatedAt = canonicalRaw.updatedAt || legacyRaw.updatedAt || new Date().toISOString();
	    return merged;
	  }
  function normalizePublicAnswers(input) {
    const source = input || {};
    return {
      need: source.need || "",
      issue: normalizeFormsIssue(source.issue || source.formIssue || source.issueDetail || "all"),
      county: normalizeFormsCounty(source.county || source.formCounty),
      posture: normalizeFormsPosture(source.posture || source.caseStage || source.formPosture),
      children: normalizeFormsChildren(source.children || source.formChildren),
      agreementStatus: source.agreementStatus || "",
      existingOrders: source.existingOrders || source.existingOrder || "",
      timing: source.timing || source.urgency || source.hasDeadline || "",
      safety: source.safety || source.safetyConcern || source.immediateSafetyConcern || "",
	      selectedGuide: source.selectedGuide || source.fromGuide || "",
	      selectedPracticeArea: source.selectedPracticeArea || source.fromPracticeArea || "",
	      selectedPacket: source.selectedPacket || source.pdfPacket || source.approvedPdfPacket || "",
	      selectedCalculator: source.selectedCalculator || source.calculatorChoice || "",
	      packetSourceCounty: normalizeFormsCounty(source.packetSourceCounty || source.sourceJurisdiction || source.packetCounty),
	      sourcePathway: source.sourcePathway || source.entrySource || ""
	    };
	  }
  function officialCountySourceFor(county) {
    const normalized = normalizeFormsCounty(county);
    if (!normalized || normalized === "Statewide" || normalized === "Not sure") {
      return {
        label: "Arizona statewide family-law forms",
        url: "https://www.azcourts.gov/selfservicecenter/forms"
      };
    }
    const source = formResourceCatalog.find((item) => item.county === normalized && item.status !== "Reference index" && item.status !== "Access-restricted reference");
    return {
      label: source?.title || `${normalized} County form help`,
      url: source?.url || "https://www.azcourts.gov/selfservicecenter/forms"
    };
  }
  function guideCountyRoute(formsRoute, selectedCounty) {
    const county = selectedCounty && selectedCounty !== "Not sure"
      ? selectedCounty
      : normalizeFormsCounty(formsRoute.county);
    return formsToolRouteFor({
      county,
      issue: formsRoute.issue || "all",
      posture: normalizeFormsPosture(formsRoute.posture),
      children: normalizeFormsChildren(formsRoute.children),
      pdfPacket: formsRoute.pdfPacket || formsRoute.packetId || "all"
    }, formsRoute.packetLabel || formsRoute.pageLabel || "Guide county check");
  }
  const formRouterPostures = ["Any posture", "New filing", "Served / response", "Agreement / final orders", "Existing order", "Safety"];
  const formRouterChildren = [
    ["any", "Children not selected"],
    ["minor-children", "Minor children involved"],
    ["no-minor-children", "No minor children"]
  ];
  const pdfPacketRouteMap = {
    "Maricopa|parenting|New filing": "maricopa-parenting-parentage-support",
    "Maricopa|support|New filing": "maricopa-parenting-parentage-support",
    "Maricopa|parentage|New filing": "maricopa-parenting-parentage-support",
    "Maricopa|divorce|Agreement / final orders": "maricopa-consent-decree-agreement",
    "Maricopa|agreement|Agreement / final orders": "maricopa-consent-decree-agreement",
    "Maricopa|consent decree|Agreement / final orders": "maricopa-consent-decree-agreement",
    "Maricopa|parenting|Agreement / final orders": "maricopa-consent-decree-agreement",
    "Maricopa|support|Agreement / final orders": "maricopa-consent-decree-agreement",
    "Maricopa|name change|New filing": "maricopa-name-change-adult-no-minor-children",
    "Maricopa|name change|Agreement / final orders": "maricopa-consent-decree-agreement"
  };
  function normalizeFormsIssue(value) {
    const issue = String(value || "all").trim().toLowerCase();
    if (!issue || issue === "all") return "all";
    if (issue === "child support" || issue === "support worksheet" || issue === "arrears") return "support";
    if (issue === "paternity" || issue === "parentage") return "parentage";
    if (issue === "custody" || issue === "legal decision-making" || issue === "parenting time") return "parenting";
    if (issue === "agreement" || issue === "consent decree" || issue === "settlement") return "agreement";
    return issue;
  }
  function pdfPacketForFormsRoute(county, issue, posture, children) {
    issue = normalizeFormsIssue(issue);
    if (county !== "Maricopa") return "all";
    if ((issue === "divorce" || issue === "legal separation") && posture === "New filing") {
      if (children === "minor-children") return "maricopa-divorce-new-with-children";
      if (children === "no-minor-children") return "maricopa-divorce-new-no-children";
      return "all";
    }
    return pdfPacketRouteMap[`${county}|${issue}|${posture}`] || "all";
  }
  const pdfPacketDecisionMeta = {
    "maricopa-consent-decree-agreement": {
      label: "Summary Consent Decree Process",
      count: 10
    },
    "maricopa-divorce-new-no-children": {
      label: "Divorce with No Minor Children",
      count: 10
    },
    "maricopa-divorce-new-with-children": {
      label: "Divorce with Minor Children",
      count: 10
    },
    "maricopa-parenting-parentage-support": {
      label: "Paternity, Parenting Time, and Child Support",
      count: 10
    },
    "maricopa-name-change-adult-no-minor-children": {
      label: "Adult Name Change - No Minor Children",
      count: 1
    },
    "maricopa-name-change-adult-with-minor-child": {
      label: "Adult Name Change - Adult Has Minor Child",
      count: 1
    },
    "maricopa-name-change-minor-child": {
      label: "Minor Child Name Change",
      count: 1
    },
    "maricopa-name-change-family": {
      label: "Family Name Change",
      count: 1
    }
  };
	  function formsToolRouteFor(detail, packetLabel, pdfAction) {
	    const route = detail || {};
	    const selectedPdf = pdfAction || {};
	    const selectedPdfLabel = selectedPdf.displayLabel || selectedPdf.label || "";
	    const labelParts = [
	      route.county && route.county !== "Statewide" ? route.county : "",
	      publicIssueLabelForRoute(route) !== "Choose issue" ? publicIssueLabelForRoute(route) : "forms/tools",
	      route.posture && route.posture !== "Any posture" ? route.posture : "",
	      route.children && route.children !== "any" ? displayFormsChildren(route.children) : ""
	    ].filter(Boolean);
    return {
      routeKey: `forms-tools-${slugify(labelParts.join("-") || "official-pdf-route")}`,
      entrySource: "Forms & Tools",
      entryLabel: selectedPdfLabel
        ? `Approved official PDF: ${selectedPdfLabel}`
        : packetLabel ? `Approved PDF packet: ${packetLabel}` : "Forms & Tools result",
      issuePathway: "Forms & Tools",
      issueDetail: labelParts.join(" / ") || "Official forms and PDF planning",
      serviceInterest: "",
      contextNote: "Public planning selection only. No sensitive facts, uploads, allegations, financial details, or opposing-party information were collected in Forms & Tools.",
      presetAnswers: {
        formCounty: route.county || "Statewide",
        formIssue: route.issue || "all",
        formPosture: route.posture || "Any posture",
        formChildren: route.children || "any",
        approvedPdfPacket: packetLabel || "",
        approvedPdfLabel: selectedPdfLabel,
        approvedPdfSourceLabel: selectedPdf.label || "",
        approvedPdfFile: selectedPdf.fileName || "",
        approvedPdfLanguage: selectedPdf.language || "",
        approvedPdfOfficialUrl: selectedPdf.officialUrl || "",
        sourceType: "Official court source / approved PDF action"
      }
    };
  }

  function formsRouteDecisionFor(detail, visibleResources) {
    const route = detail || {};
    const resources = Array.isArray(visibleResources) ? visibleResources : [];
    const firstResource = resources[0] || {};
    const hasReviewedPdfPacket = route.pdfPacket && route.pdfPacket !== "all";
    const isMaricopa = route.county === "Maricopa";
    const isSourceOnlyCounty = ["Pima", "Pinal", "Yavapai"].includes(route.county);
    const isSafetyRoute = route.issue === "safety" || route.posture === "Safety";
	    const selectedIssue = publicIssueLabelForRoute(route) !== "Choose issue" ? publicIssueLabelForRoute(route) : "family-law";
    const selectedPosture = route.posture && route.posture !== "Any posture" ? route.posture : "selected";
    const baseRoute = {
      routeKey: `forms-tools-route-decision-${slugify([route.county, selectedIssue, selectedPosture, route.children].filter(Boolean).join("-"))}`,
      entrySource: "Forms & Tools",
      entryLabel: "Forms & Tools next-step decision",
      issuePathway: "Forms & Tools",
	      issueDetail: [route.county, selectedIssue, selectedPosture, displayFormsChildren(route.children)].filter(Boolean).join(" / "),
      serviceInterest: "",
      contextNote: "Using your Forms & Tools answers. County, issue, case stage, and child-involved status were saved on this site; no sensitive facts were collected.",
      presetAnswers: {
        formCounty: route.county || "Statewide",
        formIssue: route.issue || "all",
        formPosture: route.posture || "Any posture",
        formChildren: route.children || "any",
        approvedPdfPacket: hasReviewedPdfPacket ? route.pdfPacket : "",
        officialSourceTitle: firstResource.title || "",
        officialSourceStatus: firstResource.status || "",
        sourceType: "Forms & Tools next-step decision / public planning"
      }
    };
    const baseMeta = [
      "Reviewed forms first",
      "No private facts needed",
      "Use Guided Intake if unsure"
    ];

    if (hasReviewedPdfPacket) {
      const packetMeta = pdfPacketDecisionMeta[route.pdfPacket] || {};
      const packetLabel = packetMeta.label || "reviewed form group";
      const packetCount = Number(packetMeta.count || 0);
      return {
        tone: "ready",
        kicker: "Recommended next click",
        title: `This looks like the ${packetLabel} path.`,
        copy: "Open the viewer first. If the forms do not look like your situation, choose a different packet instead of guessing.",
        primaryLabel: "View matched forms",
        primaryHref: "#forms-approved-pdfs",
        pdfPacket: route.pdfPacket,
        meta: ["Form match found", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isSafetyRoute) {
      return {
        tone: "urgent",
        kicker: "Safety first",
        title: "Use Guided Intake before choosing safety forms.",
        copy: "If safety is involved, do not start with general family-law forms or leave the site from this page. Use Guided Intake so the next step can be routed carefully.",
        primaryLabel: "Start Guided Intake",
        primaryHref: "/start",
        meta: ["Safety review first", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isMaricopa) {
      return {
        tone: "review",
        kicker: "Court source found",
        title: "Open the reviewed on-site forms.",
        copy: "This is the clearest form path for this selection. Open the verified packet viewer first, then use the checklist if you need the packet sequence.",
        primaryLabel: "View matched forms",
        primaryHref: "#forms-approved-pdfs",
        meta: ["Reviewed forms first", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isSourceOnlyCounty) {
      return {
        tone: "source",
        kicker: "County review needed",
        title: "Use Guided Intake to confirm county forms.",
        copy: "This county does not yet have reviewed on-site packet links. Use Guided Intake so the correct county forms can be confirmed without leaving this website.",
        primaryLabel: "Start Guided Intake",
        primaryHref: "/start",
        meta: ["County confirmation first", "Stay on this website"],
        route: baseRoute
      };
    }

    return {
      tone: "neutral",
      kicker: "Reviewed forms first",
      title: "Start with reviewed forms or use Intake.",
      copy: "If county, children, case stage, agreement, existing orders, timing, or safety are unclear, do not guess. Review the form options first or use Intake.",
      primaryLabel: "Open form chooser",
      primaryHref: "#forms-official-router",
      meta: baseMeta,
      route: baseRoute
    };
  }

  function setFormsDecisionPanel(router, decision) {
    const panel = router?.querySelector("[data-form-route-decision]");
    if (!panel || !decision) return;
    const kicker = panel.querySelector("[data-form-route-decision-kicker]");
    const title = panel.querySelector("[data-form-route-decision-title]");
    const copy = panel.querySelector("[data-form-route-decision-copy]");
    const meta = panel.querySelector("[data-form-route-decision-meta]");
    const primary = panel.querySelector("[data-form-route-decision-primary]");
    const intake = panel.querySelector("[data-form-route-decision-intake]");
    panel.dataset.routeTone = decision.tone || "neutral";
    if (kicker) kicker.textContent = decision.kicker || "Recommended next action";
    if (title) title.textContent = decision.title || "Choose answers to see the safest next step.";
    if (copy) copy.textContent = decision.copy || "Use reviewed forms first and Guided Intake when facts require review.";
    if (meta) {
      const items = Array.isArray(decision.meta) && decision.meta.length
        ? decision.meta
        : ["Reviewed forms first", "No private facts needed", "Use Guided Intake if unsure"];
      meta.innerHTML = items.slice(0, 3).map((item) => `<span>${esc(item)}</span>`).join("");
    }
    if (primary) {
      primary.textContent = decision.primaryLabel || "View on-site forms";
      primary.setAttribute("href", decision.primaryHref || "#forms-official-router");
      primary.dataset.formRouteDecisionPacket = decision.pdfPacket || "";
      const external = /^https?:\/\//.test(decision.primaryHref || "");
      if (external) {
        primary.setAttribute("href", "/start");
        primary.removeAttribute("target");
        primary.removeAttribute("rel");
        primary.setAttribute("data-link", "");
      } else {
        primary.removeAttribute("target");
        primary.removeAttribute("rel");
      }
    }
    if (intake) intake.setAttribute("data-intake-route", JSON.stringify(decision.route || guideFallbackRoute()));
  }

  function setUnifiedFormsResult(detail) {
    const host = document.querySelector("[data-forms-unified-result]");
    if (!host) return;
    const input = detail || {};
    const decision = input.decision || {};
    const packetLabel = input.packetLabel || "";
    const packetHref = input.packetHref || "#forms-packet-builder";
    const rawCourtHref = decision.primaryHref || "#forms-official-router";
    const courtHref = /^https?:\/\//.test(rawCourtHref) ? "#forms-approved-pdfs" : rawCourtHref;
    const intakeRoute = decision.route || guideFallbackRoute();
    const packetActionLabel = "Browse other form groups";
    host.dataset.routeTone = decision.tone || "neutral";
	      host.innerHTML = `
      <div class="forms-unified-main">
        <span>Start here</span>
        <strong>${esc(decision.title || "Review the recommended forms first.")}</strong>
        <p>${esc(decision.copy || "Use the on-page form viewer first, then choose another packet if the title is unclear.")}</p>
      </div>
      <div class="forms-unified-actions">
        <a class="button primary" href="${esc(courtHref)}">${esc(decision.primaryLabel || "View matched forms")}</a>
        <a class="button outline" href="${esc(packetHref)}">${esc(packetActionLabel)}</a>
        <a class="button ghost" href="/start" data-link data-forms-unified-intake>Start Guided Intake instead</a>
      </div>
    `;
    host.querySelector("[data-forms-unified-intake]")?.setAttribute("data-intake-route", JSON.stringify(intakeRoute));
  }

  const calculatorCatalog = [
    {
      title: "Child Support Calculator",
      use: "Official Arizona calculation support when income, parenting time, insurance, childcare, and support inputs are available.",
      source: "Arizona Judicial Branch / official calculator",
      safety: "Use the on-page calculator for planning. Start Guided Intake if any input is unclear."
    },
    {
      title: "Spousal Maintenance Calculator",
      use: "Planning support for guideline version, eligibility, amount, duration, and effective-date awareness.",
      source: "Arizona Judicial Branch / official maintenance calculator",
      safety: "Use only planning numbers. Start Guided Intake if the dates, income, or order status are unclear."
    },
    {
      title: "Parenting Time Counter",
      use: "On-site organizer for annual overnights and schedule assumptions used by other tools.",
      source: "MY FAMILY LAW GROUP on-page planning tool",
      safety: "No child names, birth dates, school names, or sensitive allegations required."
    },
    {
      title: "Deadline Readiness Planner",
      use: "Public checklist for served papers, hearing dates, service, disclosure, and response urgency.",
      source: "MY FAMILY LAW GROUP on-page planning tool",
      safety: "Collect deadline exists yes/no and date only if the user chooses; no document upload in public tool."
    }
  ];

  function tools() {
    const toolPath = typeof window !== "undefined" ? window.location.pathname.replace(/\/$/, "") : "/tools";
    const routeIntent = toolPath === "/calculators"
      ? {
        mode: "calculator",
        title: "Calculators & Planning Tools",
        copy: "Use safe planning tools and official Arizona calculator sources without entering private facts."
      }
      : toolPath === "/forms"
      ? {
        mode: "forms",
        title: "Court Forms Finder",
        copy: "Find the right reviewed forms, court-source backup, or Intake path without guessing or entering private details."
      }
      : {
        mode: "forms",
        title: "Forms & Calculators",
        copy: "Choose what you need. The page will show a safe next step without asking for private details."
    };
    const initialToolMode = routeIntent.mode;
    const toolsProofBand = proofBand("How to use this page", "Pick the next safe step without private details.", "The forms and calculator hub helps people choose quickly while keeping the page usable for self-help and deadline triage.", [
      { label: "No private facts", title: "Keep the search generic", copy: "Use labels like divorce, parenting, support, or deadline instead of typing sensitive case narrative." },
      { label: "Forms", title: "Open the reviewed form path first", copy: "If you need court papers, the page should point to the closest reviewed form group before anything else." },
      { label: "Calculators", title: "Use the planning tool when numbers matter", copy: "Support, parenting time, and deadline-related helpers stay available without forcing a full intake." },
      { label: "Unsure", title: "Use Intake when the label is unclear", copy: "If the issue does not fit cleanly, the office review path is the safest next step." }
    ], "proof-tools");
    return section(routeIntent.title, routeIntent.copy, `
      <div class="forms-command-center forms-smart-path" id="forms-task-workspace" data-forms-smart-path>
        <div class="forms-smart-path-copy">
          <p class="eyebrow">Start here</p>
          <h3>Choose one path, then answer only what is needed.</h3>
          <p>You do not need legal terms. Pick what sounds closest and this page will point you to forms, a calculator, or Guided Intake.</p>
          <div class="forms-start-steps" aria-label="Forms and Tools start steps">
            <article><span>Step 1</span><strong>Choose forms, calculator, deadline, guide, or office review</strong></article>
            <article><span>Step 2</span><strong>Answer only the follow-up questions that apply</strong></article>
            <article><span>Step 3</span><strong>Open the matched result or ask for office review</strong></article>
          </div>
          <div class="forms-guide-bridge" data-guide-bridge hidden>
            <div class="forms-guide-bridge-main">
              <span>DIY Guide context</span>
              <strong data-guide-bridge-title>Using your selected guide.</strong>
              <p data-guide-bridge-copy>The matching forms, calculator option, and Guided Intake link are ready.</p>
              <div class="forms-guide-bridge-chips" data-guide-bridge-chips></div>
            </div>
            <div class="forms-guide-bridge-actions" aria-label="DIY Guide next actions">
              <button class="button primary" type="button" data-guide-bridge-action="forms">Answer questions to find forms</button>
              <button class="button outline" type="button" data-guide-bridge-action="calculator">Use calculator</button>
              <a class="button outline" href="/start" data-link data-guide-bridge-intake>Start Guided Intake</a>
              <a class="button ghost" href="/guides" data-link>Back to guides</a>
            </div>
          </div>
          <div class="forms-guided-start" data-forms-guided-start>
            <div>
              <span>Guided Form Helper</span>
              <strong>Answer one question at a time.</strong>
              <p data-guided-copy>Start with what you need. The page will update the choices below for you.</p>
            </div>
            <div class="forms-guided-progress" aria-label="Guided Forms and Tools steps">
              <span data-guided-progress-label>A few questions to match your result</span>
              <button type="button" data-guided-jump="0" aria-current="true" aria-label="Step 1: Need"><b aria-hidden="true">1</b> <span>Need</span></button>
              <button type="button" data-guided-jump="1" aria-label="Step 2: County"><b aria-hidden="true">2</b> <span>County</span></button>
              <button type="button" data-guided-jump="2" aria-label="Step 3: Stage"><b aria-hidden="true">3</b> <span>Stage</span></button>
              <button type="button" data-guided-jump="3" aria-label="Step 4: Issue"><b aria-hidden="true">4</b> <span>Issue</span></button>
              <button type="button" data-guided-jump="4" aria-label="Step 5: Children"><b aria-hidden="true">5</b> <span>Children</span></button>
            </div>
            <div class="forms-guided-question" data-guided-question>What sounds closest?</div>
            <div class="forms-guided-options" data-guided-options></div>
            <div class="forms-guided-result" data-guided-result>
              <span>Your next step</span>
              <strong data-guided-result-title>Choose one answer to begin.</strong>
              <p data-guided-result-copy>Answer the questions above and use the blue button when you are ready.</p>
              <div class="forms-guided-summary" data-guided-summary></div>
              <div class="forms-guided-edit-answers" data-guided-edit-answers hidden>
                <button type="button" data-guided-edit="county">Change county</button>
                <button type="button" data-guided-edit="posture">Change stage</button>
                <button type="button" data-guided-edit="issue">Change issue</button>
                <button type="button" data-guided-edit="children">Change children</button>
              </div>
              <div class="forms-guided-tier" data-guided-result-tier hidden>
                <span>Recommended forms</span>
                <strong>Answer the helper to unlock one primary path.</strong>
                <p>The page will keep optional resources out of the way until the main result is clear.</p>
              </div>
              <div class="forms-guided-reason" data-guided-reason hidden>
                <span>Why this result</span>
                <p>No answer has been selected yet.</p>
              </div>
              <div class="forms-unified-result-summary" data-unified-result-summary hidden>
                <span>Your form result</span>
                <strong>Answer the helper to see one clear result.</strong>
                <dl>
                  <div><dt>Recommended forms</dt><dd data-unified-result-title>Pending answers</dd></div>
                  <div><dt>Based on</dt><dd data-unified-result-based-on>No answers selected yet</dd></div>
                  <div><dt>Why this appears</dt><dd data-unified-result-why>No form result is selected until you answer the current step.</dd></div>
                  <div><dt>Main action</dt><dd data-unified-result-primary>Choose one answer above</dd></div>
                  <div><dt>Related forms</dt><dd data-unified-result-secondary>Hidden until your form result is clear</dd></div>
                  <div><dt>Office review</dt><dd data-unified-result-review>Available if the result does not fit</dd></div>
                </dl>
              </div>
              <div class="forms-guided-path-line" data-guided-path-line>Answer the next question. The page will keep the form choices hidden until they are useful.</div>
              <div class="forms-guided-result-actions">
                <button class="button primary" type="button" data-guided-result-action data-guided-target="#forms-official-router">Continue to recommended forms</button>
                <button class="button outline" type="button" data-guided-change-answers hidden>Change answers</button>
                <a class="button outline" href="/start" data-link data-guided-intake-fallback data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Not sure? Start Guided Intake</a>
              </div>
            </div>
          </div>
          <div class="forms-entry-lanes" aria-label="Forms and Tools starting points">
            <a href="#forms-official-router" data-smart-lane="forms" aria-label="Find court forms">
              <span>Forms</span>
              <strong>Open form finder</strong>
            </a>
            <a href="#forms-calculator-hub" data-smart-lane="calculator" aria-label="Use a calculator">
              <span>Numbers</span>
              <strong>Use calculator</strong>
            </a>
            <a href="/guides" data-link data-smart-lane="guide" aria-label="Read a DIY guide">
              <span>Guide</span>
              <strong>Read a DIY guide</strong>
            </a>
            <a href="#deadline-readiness-planner" data-smart-lane="deadline" aria-label="Get deadline help">
              <span>Deadline</span>
              <strong>Check deadline path</strong>
            </a>
            <a href="/start" data-link data-smart-lane="intake" aria-label="Start Guided Intake" data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>
              <span>Office review</span>
              <strong>Start Guided Intake</strong>
            </a>
          </div>
        </div>
        <details class="forms-smart-path-controls" aria-label="Forms and tools recommendation controls">
          <summary class="forms-smart-path-controls-head">
            <span>Advanced</span>
            <strong>Browse other options.</strong>
          </summary>
          <label>What are you trying to do?
            <select data-smart-need>
              <option value="forms"${initialToolMode === "forms" ? " selected" : ""}>Find court forms</option>
              <option value="deadline">Respond to served papers or a deadline</option>
              <option value="issue">Search by family-law issue</option>
              <option value="calculator"${initialToolMode === "calculator" ? " selected" : ""}>Use a calculator</option>
              <option value="intake">Ask the office to help me choose</option>
              <option value="guide">Understand the process first</option>
            </select>
          </label>
          <label>County
            <select data-smart-county>
              ${formRouterCounties.map((county) => `<option value="${esc(county)}">${esc(county)}</option>`).join("")}
            </select>
          </label>
          <label>${legalTerm("case-stage", "Case stage")}
            <select data-smart-posture>
              ${formRouterPostures.map((posture) => `<option value="${esc(posture)}">${esc(posture)}</option>`).join("")}
            </select>
          </label>
          <label>Are children involved?
            <select data-smart-children>
              ${formRouterChildren.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}
            </select>
          </label>
        </details>
        <div class="forms-smart-path-mode" data-smart-mode>
          <span data-smart-mode-copy>One active workflow is shown first. Browse other options only if this result does not fit.</span>
          <div class="forms-smart-path-mode-actions">
            <button class="button ghost" type="button" data-smart-show-all>Browse other options</button>
            <button class="button ghost" type="button" data-smart-reset>Reset choices</button>
          </div>
        </div>
      </div>

      <div class="forms-privacy-strip" aria-label="Forms and calculators privacy note">
        <span>No private facts here.</span>
        <strong>Choose a path, open the exact packet, then use calculator or Intake only if needed.</strong>
        <a class="button ghost" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Start Guided Intake</a>
      </div>

      ${toolsProofBand}

      <div class="planning-guard">
        <div>
          <p class="eyebrow">Privacy note</p>
          <h3>Do not type private details on this page.</h3>
          <p>Use only the choices shown here. Intake will ask for more information only when it is the right place to do that.</p>
        </div>
        <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Use Guided Intake</a>
      </div>

      <div class="forms-safe-next" aria-label="Forms and Tools safe next step">
        <div>
          <span>Unsure at any point?</span>
          <strong>Do not guess on forms, deadlines, or calculator inputs.</strong>
          <p>Use Guided Intake when the court, county, packet, deadline, or calculator input is unclear. This page does not collect private facts.</p>
        </div>
        <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Start Guided Intake</a>
      </div>

      <details class="forms-help-note">
        <summary>Not sure which court or county to choose?</summary>
        <div class="jurisdiction-list">
          ${jurisdictionQuestions.map(([title, copy]) => `<article><h4>${esc(title)}</h4><p>${esc(copy)}</p></article>`).join("")}
        </div>
      </details>

      <div class="forms-router" id="forms-official-router" data-flow-section="forms manual" aria-label="Court forms finder">
        <div class="forms-router-head">
          <div>
            <p class="eyebrow">Matched form details</p>
            <h2>Review the form path only if forms are the recommended next step.</h2>
            <p>The guided helper fills this in after your answers. Change these boxes only if the result does not match what you selected.</p>
          </div>
          <a class="button outline" href="/start" data-link data-form-route-save data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Not sure? Start Guided Intake</a>
        </div>
        <div class="forms-router-question-stack" aria-label="Questions that determine the packet">
          ${[
            ["County", "Which superior court county controls the packet?"],
            ["Children", "Are minor children involved?"],
            ["Case stage", "Is this a new filing, response, agreement, modification, or enforcement?"],
            ["Agreement", "Is there a full agreement or still a dispute?"],
            ["Orders", "Do existing orders already exist?"],
            ["Timing", "Has someone been served, is a hearing scheduled, or is there a deadline?"],
            ["Safety", "Is there a safety issue that needs urgent screening?"]
          ].map(([label, question], index) => `<article>
            <span>0${index + 1}</span>
            <strong>${esc(label)}</strong>
            <p>${esc(question)}</p>
          </article>`).join("")}
        </div>
        <div class="forms-router-controls">
          <label>County
            <select data-form-county>
              ${formRouterCounties.map((county) => `<option value="${esc(county)}">${esc(county)}</option>`).join("")}
            </select>
          </label>
          <label>Children
            <select data-form-children>
              ${formRouterChildren.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}
            </select>
          </label>
          <label>Issue
            <select data-form-issue>
              ${formRouterIssues.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}
            </select>
          </label>
          <label>${legalTerm("posture", "Posture")}
            <select data-form-posture>
              ${formRouterPostures.map((posture) => `<option value="${esc(posture)}">${esc(posture)}</option>`).join("")}
            </select>
          </label>
          <button class="button ghost" type="button" data-form-reset>Reset</button>
        </div>
        <p class="forms-router-status" data-form-status></p>
        <div class="forms-unified-result" data-forms-unified-result aria-live="polite">
          <div class="forms-unified-main">
            <span>Start here</span>
            <strong>Answer the guided helper to see the recommended forms.</strong>
            <p>The page will keep reviewed forms, court-source backup, and Intake together.</p>
          </div>
        </div>
        <details class="forms-route-explain">
          <summary>Why this recommendation?</summary>
          <div class="forms-route-decision" data-form-route-decision aria-live="polite">
            <div>
              <span data-form-route-decision-kicker>Your recommended next action</span>
              <strong data-form-route-decision-title>Choose the questions above to get a next step.</strong>
              <p data-form-route-decision-copy>The page will recommend the exact viewer, packet checklist, or Intake if the choice is not clear.</p>
              <div class="forms-route-decision-meta" data-form-route-decision-meta>
                <span>No private facts needed</span>
                <span>Use Guided Intake if unsure</span>
              </div>
            </div>
            <div class="forms-route-decision-actions">
              <a class="button primary" href="#forms-approved-pdfs" data-form-route-decision-primary>View matched forms</a>
              <a class="button outline" href="/start" data-link data-form-route-decision-intake>Start Guided Intake</a>
            </div>
          </div>
        </details>
        <div class="official-resource-grid">
          ${formResourceCatalog.map((item) => `<details class="card official-resource-card"
            data-form-resource
            data-county="${esc(item.county)}"
            data-issues="${esc(item.issues.join(" "))}"
            data-posture="${esc(item.posture)}"
            data-title="${esc(item.title)}"
            data-status="${esc(item.status)}">
            <summary class="official-resource-summary">
              <span>${esc(item.status)}</span>
              <strong>${esc(item.title)}</strong>
              <p>${esc(item.note)}</p>
            </summary>
            <div class="official-resource-detail">
              <dl>
                <div><dt>Jurisdiction</dt><dd>${esc(item.county)}</dd></div>
                <div><dt>${legalTerm("posture", "Posture")}</dt><dd>${esc(item.posture)}</dd></div>
                <div><dt>Source</dt><dd>${esc(item.source)}</dd></div>
              </dl>
              <a class="card-link" href="#forms-approved-pdfs">Review this form group →</a>
            </div>
          </details>`).join("")}
        </div>
      </div>

      <div class="forms-matter-coverage" id="forms-matter-coverage" data-flow-section="issue" data-forms-tools-matter-coverage>
        <div>
          <span>Find your issue</span>
          <strong>Loading family law issue finder...</strong>
          <p>Search plain-language topics if you know the problem but not the form name.</p>
        </div>
      </div>

	        <div class="packet-readiness" id="forms-packets" data-flow-section="forms">
          <div class="section-head">
            <p class="eyebrow">Step 2</p>
            <h2>Open the forms that match your answers.</h2>
          <p>Start with the recommended form group and open the forms in order. If the group does not sound right, use Guided Intake instead of guessing.</p>
        </div>
        <div class="official-pdf-actions" id="forms-approved-pdfs" data-official-pdf-actions>
          <div class="section-head compact">
            <p class="eyebrow">Matching forms</p>
            <h2>Reviewed forms are loading.</h2>
            <p>Start with the recommended form group. Open forms in order. If the title does not sound right, use Guided Intake instead of guessing.</p>
          </div>
          <p class="forms-router-status">Loading reviewed forms...</p>
        </div>
        <div class="forms-download-readiness" data-form-download-readiness>
          <div class="forms-download-head">
            <span>Forms</span>
            <strong>Loading reviewed forms...</strong>
            <p>View court forms here and keep your place. Use Guided Intake if the form group or next step is unclear.</p>
          </div>
        </div>
      </div>

      <div class="calculator-hub" id="forms-calculator-hub" data-flow-section="calculator deadline">
        <div class="section-head">
          <p class="eyebrow">Calculators</p>
          <h2>Use the right calculator without guessing.</h2>
          <p>Calculators are planning tools, not court forms. Answer three quick questions and use Guided Intake if you do not know which numbers belong in the fields.</p>
        </div>
        <div class="calculator-start-card">
          <div>
            <span>Pick a calculator safely</span>
            <strong>Use only simple numbers and dates here.</strong>
            <p>Do not enter names, addresses, case numbers, allegations, uploads, or detailed private facts. If you need to explain what happened, use Guided Intake.</p>
          </div>
          <a class="button outline" href="/start" data-link data-calculator-safe-intake>Not sure? Start Guided Intake</a>
        </div>
        <div class="calculator-precheck" data-calculator-precheck>
          <div class="calculator-precheck-head">
            <span>Start here</span>
            <strong>Answer three quick questions.</strong>
            <p>Do not enter names, case numbers, income amounts, addresses, allegations, or financial details here. This only helps choose the next step.</p>
          </div>
          <div class="calculator-precheck-grid">
            <label>What are you trying to estimate?
              <select data-calculator-precheck-input="goal">
                <option value="support">Child support</option>
                <option value="maintenance">Spousal maintenance</option>
                <option value="parenting">Parenting-time days</option>
                <option value="deadline">Deadline or hearing timing</option>
                <option value="unsure">I am not sure</option>
              </select>
            </label>
            <label>Do you have the basic numbers?
              <select data-calculator-precheck-input="numbers">
                <option value="yes">Yes, I have them</option>
                <option value="partial">Some, but not all</option>
                <option value="no">No or I am unsure</option>
              </select>
            </label>
            <label>Is there an existing order?
              <select data-calculator-precheck-input="order">
                <option value="unsure">I am not sure</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
          <div class="calculator-precheck-result" aria-live="polite">
            <div>
              <span data-calculator-precheck-label>Recommended next step</span>
              <strong data-calculator-precheck-title>Use the child-support calculator on this page.</strong>
              <p data-calculator-precheck-copy>Use the on-site child-support calculator for planning and move the calculator choice into Intake if any input is unclear.</p>
            </div>
            <div class="calculator-precheck-actions">
              <button class="button primary" type="button" data-calculator-precheck-action>Open recommended calculator</button>
              <a class="button outline" href="/start" data-link data-calculator-precheck-intake>Add this calculator choice to Intake</a>
            </div>
          </div>
          <div class="calculator-precheck-checklist" aria-live="polite">
            <div>
              <span data-calculator-precheck-checklist-label>Before you start</span>
              <strong data-calculator-precheck-checklist-title>Gather the child-support inputs first.</strong>
              <p data-calculator-precheck-checklist-copy>Gather the basics first, then use the on-site calculator for planning.</p>
            </div>
            <ul data-calculator-precheck-checklist>
              <li>Current income information for each parent.</li>
              <li>Parenting-time or overnight count.</li>
              <li>Health insurance, childcare, and support-order information.</li>
            </ul>
          </div>
        </div>
        <div class="calculator-pathways" aria-label="Calculator paths">
          <article>
            <span>Child support</span>
            <strong>Estimate child support</strong>
            <p>Use planning numbers only. If income, parenting time, insurance, or childcare inputs are unclear, start Guided Intake first.</p>
            <div>
              <button class="button primary" type="button" data-calculator-jump="support">Open child support calculator</button>
            </div>
          </article>
          <article>
            <span>Parenting time</span>
            <strong>Count parenting overnights</strong>
            <p>Count overnights without names, addresses, allegations, or private facts. Use the count as an organizer, not a final child-support number.</p>
            <div>
              <button class="button primary" type="button" data-calculator-jump="parenting">Open parenting time counter</button>
            </div>
          </article>
          <article>
            <span>Spousal maintenance</span>
            <strong>Estimate spousal maintenance</strong>
            <p>Use planning numbers only. If marriage length, income, existing orders, or effective dates are unclear, start Guided Intake first.</p>
            <div>
              <button class="button primary" type="button" data-calculator-jump="maintenance">Open maintenance calculator</button>
            </div>
          </article>
        </div>
        <div class="calculator-chooser" data-calculator-chooser>
          <div class="calculator-chooser-head">
            <span>Choose a tool</span>
            <strong>What are you trying to figure out?</strong>
            <p>Pick the closest need. The page will point you to the safest next step without asking for private facts.</p>
          </div>
          <div class="calculator-chooser-options" role="list">
            <button type="button" data-calculator-choice="support">Child support amount</button>
            <button type="button" data-calculator-choice="maintenance">Spousal maintenance</button>
            <button type="button" data-calculator-choice="parenting">Parenting-time days</button>
            <button type="button" data-calculator-choice="deadline">Deadline or hearing timing</button>
          </div>
          <div class="calculator-chooser-result" aria-live="polite">
            <div>
              <span data-calculator-choice-kicker>Calculator guidance</span>
              <strong data-calculator-choice-title>Use the Arizona child support calculator source.</strong>
              <p data-calculator-choice-copy>Child-support formulas require the current Arizona calculator. Use this page to choose the right tool without entering private facts.</p>
            </div>
            <div class="calculator-chooser-actions">
              <a class="button primary" href="#official-calculator-source-viewer" data-calculator-choice-primary>Open calculators</a>
              <a class="button outline" href="/start" data-link data-calculator-choice-intake>Add this calculator choice to Intake</a>
            </div>
          </div>
        </div>
        <div class="calculator-formula-readiness" data-calculator-formula-readiness>
          <div class="calculator-formula-head">
            <div>
              <span>Calculators</span>
              <strong>Loading calculators...</strong>
              <p>The calculator that matches your answer will appear here.</p>
            </div>
          </div>
        </div>
        <div class="official-calculator-workspace is-fallback-collapsed" id="official-calculator-source-viewer" data-official-calculator-workspace>
          <div class="official-calculator-workspace-head">
            <div>
              <span>Official calculator workspace</span>
              <strong data-official-calculator-title>Arizona Child Support Calculator</strong>
              <p data-official-calculator-copy>Use this official workspace only as a fallback. The on-site calculators appear above when available.</p>
            </div>
            <div class="official-calculator-actions">
              <a class="button primary" href="/start" data-link data-official-calculator-source>Start guided review</a>
              <a class="button outline" href="#forms-approved-pdfs">Find matching forms</a>
            </div>
            <small class="source-fallback-note" data-official-calculator-frame-note>Official calculator loaded in the on-page frame.</small>
          </div>
          <div class="official-calculator-embed" data-official-calculator-embed>
            <div class="official-calculator-embed-head">
              <span data-official-calculator-embed-label>Official court calculator</span>
              <strong data-official-calculator-embed-title>Child support worksheet interview</strong>
              <p data-official-calculator-embed-copy>Use this court calculator only if the on-site calculator does not fit. If the frame does not load, use Intake so the office can help choose the next step.</p>
            </div>
            <iframe title="Arizona child support calculator" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-official-calculator-frame></iframe>
          </div>
          <div class="official-calculator-steps" aria-label="Calculator safety steps">
            <article><span>01</span><strong>Use the on-site calculator first</strong><p>The on-site calculators appear above. Use this official workspace only as fallback when needed.</p></article>
            <article><span>02</span><strong>Know where facts go</strong><p>Facts entered inside the embedded frame are handled by the official calculator. This public site carries only the selected calculator type into Intake.</p></article>
            <article><span>03</span><strong>Confirm your inputs</strong><p>Gather orders, income records, parenting-time counts, insurance, childcare, and effective dates before relying on any result.</p></article>
            <article><span>04</span><strong>Use Guided Intake if unsure</strong><p>If you do not know which numbers apply, save the calculator choice to Intake before guessing.</p></article>
          </div>
          <div class="official-calculator-next" aria-label="Calculator next steps">
            <div>
              <span>After the calculator</span>
              <strong>Choose the next safe step.</strong>
              <p>If you know what you need, continue with forms or the planning tools. If the numbers, forms, or timing are unclear, move the calculator choice into Intake.</p>
            </div>
            <div class="official-calculator-next-actions">
              <a class="button outline" href="#forms-official-router" data-official-calculator-forms>Find matching forms</a>
              <a class="button outline" href="#parenting-time-counter">Use parenting-time counter</a>
              <a class="button primary" href="/start" data-link data-official-calculator-next-intake>Use choice in Intake</a>
            </div>
          </div>
        </div>
        <div class="tool-card-grid">
          ${calculatorCatalog.map((tool) => `<article class="card tool-card">
            <h3>${esc(tool.title)}</h3>
            <p>${esc(tool.use)}</p>
            <dl>
              <div><dt>Source</dt><dd>${esc(tool.source)}</dd></div>
              <div><dt>Safety rule</dt><dd>${esc(tool.safety)}</dd></div>
            </dl>
          </article>`).join("")}
        </div>
        <div class="calculator-readiness" data-calculator-readiness>
          <div class="calculator-readiness-head">
            <div>
              <span>Calculator safety</span>
              <strong>Checking official calculator sources...</strong>
          <p>Formula-sensitive calculators should load official Arizona calculator tools in the on-page workspace unless a local formula version is reviewed and approved.</p>
            </div>
          </div>
        </div>
        <div class="parenting-time-tool" id="parenting-time-counter" data-parenting-time-counter>
          <div class="parenting-time-head">
            <div>
              <span>Planning tool</span>
              <strong>Parenting time counter</strong>
              <p>Estimate annual overnights without entering names, birth dates, allegations, addresses, or financial details. This does not calculate child support.</p>
            </div>
            <a class="button outline" href="#mflg-child-support-calculator">Open calculators</a>
          </div>
          <div class="parenting-time-grid">
            <label>Regular overnights every 14 days
              <input type="number" min="0" max="14" step="0.5" value="0" data-parenting-time-input="regular">
            </label>
            <label>Holiday overnights per year
              <input type="number" min="0" max="120" step="1" value="0" data-parenting-time-input="holiday">
            </label>
            <label>Vacation overnights per year
              <input type="number" min="0" max="120" step="1" value="0" data-parenting-time-input="vacation">
            </label>
            <label>Other annual overnights
              <input type="number" min="0" max="365" step="1" value="0" data-parenting-time-input="other">
            </label>
          </div>
          <div class="parenting-time-result" aria-live="polite">
            <div>
              <span>Estimated annual overnights</span>
              <strong data-parenting-time-total>0</strong>
              <p data-parenting-time-percent>0% of a 365-day year.</p>
            </div>
            <div>
              <span>Use carefully</span>
              <p data-parenting-time-guidance>Use this as an organizer only. Confirm numbers against orders, calendars, and the official Arizona calculator when support is involved.</p>
            </div>
            <div class="parenting-time-actions">
              <button class="button ghost" type="button" data-parenting-time-reset>Reset</button>
              <a class="button primary" href="/start" data-link data-parenting-time-intake>Add this count to Intake</a>
            </div>
          </div>
          <div class="parenting-time-next" aria-label="Parenting-time counter next steps">
            <div>
              <span data-parenting-time-next-label>Planning number only</span>
              <strong data-parenting-time-next-title>Use this count as an organizer, not a final support number.</strong>
              <p data-parenting-time-next-copy>When support, orders, or contested schedules are involved, confirm the inputs against official sources or use Intake before relying on the result.</p>
            </div>
            <div class="parenting-time-next-actions">
              <a class="button outline" href="#mflg-child-support-calculator">Open calculators</a>
              <a class="button outline" href="#forms-official-router">Find parenting forms</a>
              <a class="button primary" href="/start" data-link data-parenting-time-next-intake>Use count in Intake</a>
            </div>
          </div>
        </div>
        <div class="deadline-readiness-tool" id="deadline-readiness-planner" data-flow-section="deadline" data-deadline-readiness>
          <div class="deadline-readiness-head">
            <div>
              <span>Planning tool</span>
              <strong>Deadline readiness planner</strong>
              <p>Use this to decide whether to contact the office or start Guided Intake now. Do not enter private facts, documents, names, allegations, or case numbers here.</p>
            </div>
            <a class="button outline" href="/start" data-link data-deadline-header-intake>Start Guided Intake for deadline help</a>
          </div>
          <div class="deadline-readiness-grid">
            <label>What happened?
              <select data-deadline-input="event">
                <option value="served">I was served court papers</option>
                <option value="hearing">I have a hearing or conference date</option>
                <option value="order">I need to respond to an order or notice</option>
                <option value="unsure">I am not sure</option>
              </select>
            </label>
            <label>How soon?
              <select data-deadline-input="timing">
                <option value="today">Today or tomorrow</option>
                <option value="week">Within 7 days</option>
                <option value="month">Within 30 days</option>
                <option value="unknown">I do not know</option>
              </select>
            </label>
            <label>County
              <select data-deadline-input="county">
                ${formRouterCounties.map((county) => `<option value="${esc(county)}">${esc(county)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="deadline-readiness-result" aria-live="polite">
            <div>
              <span data-deadline-level>Review now</span>
              <strong data-deadline-title>Start with official court information and Intake.</strong>
              <p data-deadline-copy>Use court-source links and Guided Intake if you are unsure what kind of deadline applies.</p>
            </div>
            <div class="deadline-readiness-actions">
              <a class="button primary" href="/start" data-link data-deadline-intake>Use Guided Intake</a>
              <a class="button outline" href="#forms-official-router" data-deadline-source>Find response forms</a>
            </div>
          </div>
          <div class="deadline-readiness-next" aria-label="Deadline readiness next steps">
            <div>
              <span data-deadline-next-label>Do next</span>
              <strong data-deadline-next-title>Confirm the actual deadline before choosing forms.</strong>
              <p data-deadline-next-copy>This planner does not calculate deadlines. Use the court notice, court rule, or court source, then use Intake if timing is unclear.</p>
            </div>
            <ol>
              <li data-deadline-next-step-one>Use the on-page form viewer for your county or issue.</li>
              <li data-deadline-next-step-two>Use Guided Intake if the deadline, hearing, or response step is unclear.</li>
              <li data-deadline-next-step-three>Choose forms only after the filing stage and timing are clear.</li>
            </ol>
          </div>
        </div>
      </div>
    `);
  }

  function guidePhasesFor(item, issuePathway) {
    return [
      `Confirm the ${item.title} issue and current court status`,
      "Gather orders, notices, deadlines, facts, and supporting records",
      `Check scope, urgency, service needs, and ${issuePathway} fit`,
      "Open Guided Intake with the matter issue and answer context saved"
    ];
  }

  function guideChecklistFor(item) {
    const generic = [
      "Current court orders, filed papers, notices, and hearing dates",
      "County, case number, party names, and service status if a case exists",
      "A short timeline of what happened, what changed, and what you need next"
    ];
    const title = item.title;
    const category = item.category;

    if (category === "Marriage" || category === "Agreements" || category === "Property" || category === "Maintenance") {
      return [
        "Marriage date, separation date if any, and current filing posture",
        "Income, expenses, assets, debts, home, vehicle, and account records",
        "Any proposed agreement, decree language, temporary order request, or disputed term"
      ];
    }

    if (category === "Parenting" || category === "Jurisdiction") {
      return [
        "Existing parenting plan, legal decision-making order, and exchange schedule",
        "School, childcare, relocation, safety, communication, and missed-time records",
        "A proposed schedule or specific change the court would be asked to approve"
      ];
    }

    if (category === "Child support") {
      return [
        "Income records, childcare costs, insurance premiums, and parenting-time days",
        "Current child-support order, payment history, arrears notices, and worksheet if any",
        "Changed circumstances, enforcement facts, or calculation questions to review"
      ];
    }

    if (category === "Parentage") {
      return [
        "Birth certificate, acknowledgment, DNA testing status, and parentage records",
        "Current parenting, support, or custody-related orders if any",
        "Facts needed to connect parentage, parenting time, legal decision-making, and support"
      ];
    }

    if (category === "Post-decree") {
      return [
        "The existing order and every later signed order affecting the same issue",
        "Records showing what changed or how the order has not been followed",
        "Deadlines, enforcement history, payment records, messages, and proposed next step"
      ];
    }

    if (category === "Documents" || category === "Procedure" || category === "Disclosure" || category === "Court") {
      return [
        "Every draft, filed form, notice, exhibit, worksheet, and supporting document",
        "Filing deadline, service deadline, hearing date, and court instructions",
        "The exact document outcome needed: prepare, review, organize, file, or appear"
      ];
    }

    if (category === "Resolution") {
      return [
        "Issue list, proposed terms, offers exchanged, and any partial agreements",
        "Financial, parenting, support, property, debt, and disclosure documents",
        "Your settlement priorities, backup options, and court deadlines"
      ];
    }

    if (category === "Safety") {
      return [
        "Protective order status, hearing date, safety concerns, and related family case details",
        "Police reports, messages, prior orders, child-related safety facts, and service status",
        "Emergency timing, referral needs, and whether immediate court action is pending"
      ];
    }

    if (title === "Not Sure Where to Start" || category === "Scope review") return generic;
    return generic;
  }

  function guideReadinessFor(item) {
    const category = item.category;
    const common = [
      "Is there a court deadline, hearing, service issue, or urgent timing concern?",
      "Is there an existing order, pending case, agreement, or served paperwork?",
      "What outcome would make this guide successful: forms, review, negotiation, filing, or court help?"
    ];

    if (category === "Parenting" || category === "Jurisdiction" || category === "Parentage") {
      return [
        "Are children involved, and is there a current Arizona or out-of-state order?",
        "Are there safety, relocation, school, exchange, or withheld-time concerns?",
        "What parenting schedule, decision-making order, or parentage result is needed?"
      ];
    }

    if (category === "Child support" || category === "Maintenance") {
      return [
        "Is support being established, changed, enforced, calculated, or reviewed?",
        "Do income, insurance, childcare, parenting time, or payment records need cleanup?",
        "Is there a signed order or arrears history that must be reviewed first?"
      ];
    }

    if (category === "Documents" || category === "Procedure" || category === "Disclosure" || category === "Court") {
      return [
        "What exact document, filing, exhibit, disclosure, or appearance is needed?",
        "Has anything already been filed or served, and what deadline controls the next step?",
        "Does the task stay within licensed LP scope or need attorney/referral review?"
      ];
    }

    if (category === "Safety") {
      return [
        "Is anyone in immediate danger or is a protective-order hearing already set?",
        "Are children, exchanges, housing, communication, or related family orders involved?",
        "Does the issue need emergency resources, attorney referral, or limited family-law support?"
      ];
    }

    return common;
  }

  function renderGuides(guides) {
    if (!guides.length) return `<article class="card"><h3>Guides unavailable</h3><p>Please contact the office if you need help choosing where to start.</p></article>`;
    return guides.map((guide, index) => {
      return `<article class="card guide-card"${index >= initialServiceCount ? ` hidden data-guide-extra` : ""} data-guide-card data-category="${esc(guide.category)}" data-guide-group="${esc(publicCategoryFor(guide))}" data-guide-index="${index}" data-guide-title="${esc(guide.title.toLowerCase())}" data-guide-category="${esc(guide.category.toLowerCase())}" data-guide-group-text="${esc(publicCategoryFor(guide).toLowerCase())}" data-title="${esc(`${guide.title} ${guide.category} ${publicCategoryFor(guide)} ${guide.summary} ${guide.level || ""} ${(guide.items || []).join(" ")} ${(guide.phases || []).join(" ")} ${(guide.listener || []).join(" ")}`.toLowerCase())}">
      <div class="guide-card-head">
        <div>
          <p class="service-kicker">${esc(guide.category)}</p>
          <h3>${esc(guide.title)}</h3>
        </div>
      </div>
      <p>${esc(guide.summary)}</p>
      <button class="guide-detail-trigger" type="button" data-guide-open="${index}" aria-expanded="false">Open guide</button>
    </article>`;
    }).join("");
  }

  function renderGuidePanel(guide, index) {
    const route = guideRoute(guide);
    const profile = guide.issueProfile || issueProfileFor(guide.title, guide.category);
    const calculatorChoice = guideCalculatorChoiceFor(guide);
    const formsRoute = {
      ...guideFormsRouteFor(guide),
      suggestedIssue: guideFormsRouteFor(guide).issue || ""
    };
    const calculatorLabel = calculatorChoice === "support"
      ? "Open child support calculator"
      : calculatorChoice === "parenting"
        ? "Open parenting-time counter"
        : calculatorChoice === "maintenance"
          ? "Open spousal-maintenance calculator"
          : calculatorChoice === "deadline"
            ? "Open deadline-readiness planner"
            : "Choose calculator or planner";
    const calculatorChooserLabel = "Choose calculator or planner";
    return `<div class="guide-row-panel-inner task-workspace" data-guide-default-section="choose" data-task-workspace data-workspace-state="choose">
      <button class="guide-panel-close" type="button" data-guide-panel-close aria-label="Close guide details">Close</button>
      <div class="guide-panel-heading">
        <p class="eyebrow">${esc(guide.category)}</p>
        <h3>${esc(guide.title)}</h3>
        <p>${esc(guide.summary)}</p>
        <div class="issue-profile-summary" data-issue-profile="${esc(profile.id)}">
          <strong>${esc(profile.firstStep)}</strong>
          <p>${esc(profile.officeReviewTrigger)}</p>
        </div>
      </div>
      <section class="task-workspace-state" data-guide-panel-section="choose">
        <p class="eyebrow">Choose</p>
        <h4>What would you like to do?</h4>
        <p class="muted">Use this guide for one task at a time.</p>
        <div class="guide-next-options" role="group" aria-label="Choose a guide task">
          <button class="active" type="button" data-guide-next-choice="forms">Find forms</button>
          ${calculatorChoice ? `<button type="button" data-guide-next-choice="calculator">Use calculator</button>` : ""}
          <button type="button" data-guide-next-choice="steps">${esc(profile.guideActionLabel)}</button>
          <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>Ask for office review</a>
        </div>
      </section>
      <section class="task-workspace-state" data-guide-panel-section="steps" hidden inert aria-hidden="true">
        <p class="eyebrow">Steps</p>
        <h4>${esc(profile.guideActionLabel)} for ${esc(profile.publicLabel)}.</h4>
        <div class="guide-card-grid">
          <div>
            <h5>Collect first</h5>
            <ul class="list">${(guide.items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
          <div>
            <h5>Court-readiness check</h5>
            <ul class="list">${(guide.listener || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
        </div>
        <div class="guide-panel-next-actions" aria-label="Next actions after reviewing steps">
          <button class="button primary" type="button" data-guide-next-choice="forms">Find forms for this guide</button>
          ${calculatorChoice ? `<button class="button outline" type="button" data-guide-next-choice="calculator">Use calculator</button>` : ""}
          <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>Ask for office review</a>
        </div>
      </section>
      <section class="task-workspace-state" data-guide-panel-section="forms" hidden inert aria-hidden="true">
        <p class="eyebrow">Confirm</p>
        <h4>${esc(profile.formsActionLabel)} for ${esc(profile.publicLabel)}.</h4>
        <div class="forms-prereq-panel">
          <strong>Use the form check before opening a packet.</strong>
          <p>The next page asks for county, case stage, children, agreement status, existing orders, timing, and safety before it shows a packet, statewide forms, or office review.</p>
        </div>
        <div class="guide-forms-viewer" data-guide-pdf-panel data-guide-calculator-choice="${esc(calculatorChoice || "")}" data-guide-pdf-packet="${esc(formsRoute.pdfPacket || "")}" data-guide-packet-label="${esc(guide.title)}" data-guide-title="${esc(guide.title)}" data-guide-route='${esc(JSON.stringify(formsRoute))}'></div>
      </section>
      ${calculatorChoice ? `<section class="task-workspace-state" data-guide-panel-section="calculator" hidden inert aria-hidden="true">
        <p class="eyebrow">Result</p>
        <h4>${esc(calculatorChooserLabel)}</h4>
        <p class="muted">Use planning numbers only. Do not enter names, case numbers, addresses, allegations, or private facts.</p>
        <a class="button primary" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(calculatorChoice)}" data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>${esc(calculatorLabel)}</a>
      </section>` : ""}
    </div>`;
    return `<div class="guide-row-panel-inner">
      <button class="guide-panel-close" type="button" data-guide-panel-close aria-label="Close guide details">Close</button>
      <div class="guide-panel-heading">
        <p class="eyebrow">${esc(guide.category)}</p>
        <h3>${esc(guide.title)}</h3>
        <p>${esc(guide.summary)}</p>
      </div>
      <div class="guide-progress" aria-label="Guide phases">
        ${(guide.phases || []).map((phase, phaseIndex) => `<span><b>${phaseIndex + 1}</b>${esc(phase)}</span>`).join("")}
      </div>
      <div class="guide-card-grid">
        <div>
          <h4>Collect first</h4>
          <ul class="list">${(guide.items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Court-readiness check</h4>
          <ul class="list">${(guide.listener || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="guide-next-step" data-guide-next-step>
        <div class="guide-next-step-head">
          <span>Guide tools</span>
          <strong>Start with one clear next step.</strong>
          <p>${esc(guideResourceSummaryFor(guide))} Forms open after the form check confirms the county, stage, children, agreement, orders, timing, and safety screen.</p>
        </div>
        <div class="guide-next-options" role="list">
          <button class="active" type="button" data-guide-next-choice="forms">Find forms</button>
          ${calculatorChoice ? `<button type="button" data-guide-next-choice="calculator">Use calculator</button>` : ""}
          <button type="button" data-guide-next-choice="intake">I am not sure</button>
        </div>
        <div class="guide-next-result" data-guide-next-result="forms">
          <div>
            <span>Forms</span>
            <strong>Answer the form-check questions first.</strong>
            <p>The guide only suggests the issue. The next page asks the missing form questions before showing a county packet, statewide forms, or office review.</p>
          </div>
          <button class="button primary" type="button" data-guide-scroll-forms>Review form check</button>
        </div>
        ${calculatorChoice ? `<div class="guide-next-result" data-guide-next-result="calculator" hidden>
          <div>
            <span>Calculator</span>
            <strong>Choose the calculator or planner that fits.</strong>
            <p>This guide suggests ${esc(calculatorLabel.replace(/^Open /, ""))}, but you can switch tools on the next page. Use only simple planning numbers.</p>
          </div>
          <a class="button primary" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(calculatorChoice)}" data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>${esc(calculatorChooserLabel)}</a>
        </div>` : ""}
        <div class="guide-next-result" data-guide-next-result="intake" hidden>
          <div>
            <span>Safe fallback</span>
            <strong>Use Guided Intake if you are unsure.</strong>
            <p>Intake helps confirm the issue, timing, court-form path, and service fit without making you guess.</p>
          </div>
          <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>Start Guided Intake</a>
        </div>
      </div>
      <div class="guide-forms-viewer" data-guide-pdf-panel data-guide-calculator-choice="${esc(calculatorChoice || "")}" data-guide-pdf-packet="${esc(formsRoute.pdfPacket || "")}" data-guide-packet-label="${esc(guide.title)}" data-guide-title="${esc(guide.title)}" data-guide-route='${esc(JSON.stringify(formsRoute))}'>
        <div class="guide-forms-viewer-head guide-forms-bridge-head">
          <div>
            <span>Forms & Calculators</span>
            <strong>Start the form check in Forms & Calculators.</strong>
            <p>This guide only suggests the issue. Answer the form questions before opening a packet or PDF viewer.</p>
          </div>
          <a class="button primary" href="/tools#forms-task-workspace" data-link data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>Answer questions to find forms</a>
        </div>
      </div>
      <div class="guide-panel-actions">
        <button class="button outline" type="button" data-guide-scroll-forms>Review form path</button>
        ${calculatorChoice ? `<a class="button outline" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(calculatorChoice)}" data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>${esc(calculatorChooserLabel)}</a>` : ""}
        <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>${esc(guide.leadCta || "Start guided intake")}</a>
        <button class="button ghost guide-panel-close-inline" type="button" data-guide-panel-close>Close guide</button>
      </div>
    </div>`;
  }

  function guideFallbackRoute() {
    return {
      routeKey: "diy-guide-match",
      entrySource: "diy-guide",
      entryLabel: "DIY guide match",
      issueDetail: "DIY guide match",
      issuePathway: "Not Sure",
      serviceInterest: "Not sure",
      contextNote: "Using your selected DIY guide. Use the questions below to confirm the issue, timing, court-form needs, and next step.",
      presetAnswers: {
        primaryHelpNeeded: "Understand my options",
        serviceNeed: "DIY guide match"
      }
    };
  }

  function guideRoute(guide) {
    return {
      routeKey: `diy-guide-${slugify(guide.slug || guide.title)}`,
      entrySource: "diy-guide",
      entryLabel: guide.title,
      issueDetail: guide.leadMagnet || guide.title,
      issuePathway: guide.issuePathway || "Not Sure",
      serviceInterest: guide.serviceInterest || "",
      contextNote: `Using your selected guide: ${guide.title}. The guide path and readiness focus are saved below, and you can update anything that does not fit.`,
      presetAnswers: {
        primaryHelpNeeded: "Understand my options",
        serviceNeed: guide.leadMagnet || "DIY guide review",
        documentSummary: `DIY guide selected: ${guide.title}. Forms/resources reviewed: ${guide.formsLabel || "official forms"}.`
      }
    };
  }

  function about() {
    return section("About", "A focused Arizona family-law practice built around clear intake, practical document help, and licensed legal paraprofessional support within scope.", `<div class="about-profile">
      <div class="about-profile-copy">
        <p class="eyebrow">Licensed Arizona family-law help</p>
        <h3>Jeremy James Jack JD, LP</h3>
        <p>MY FAMILY LAW GROUP PLLC helps Arizona families organize the issue, understand the next procedural step, prepare or review family-law documents, and move into negotiation, settlement, mediation, or eligible court appearances within licensed scope.</p>
        <dl>
          <div><dt>License</dt><dd>Arizona Supreme Court Licensed Legal Paraprofessional - Family Law, License No. 500094</dd></div>
          <div><dt>Review standard</dt><dd>Conflict, scope, urgency, service fit, and referral concerns are reviewed before services are accepted.</dd></div>
          <div><dt>How review works</dt><dd>Guided Intake gives the office the details needed to check conflict, licensed scope, urgency, documents, and next-step fit.</dd></div>
        </dl>
      </div>
        <div class="about-profile-media"><img src="/assets/images/jeremy-profile.jpeg?v=mflg-live-20260627-163258-result-pruning" alt="Jeremy James Jack JD, LP"></div>
      <div class="about-profile-actions actions">
        ${link("/start", "Start Guided Intake", "primary")}
        ${link("/contact", "Contact the office", "outline")}
      </div>
    </div>
    ${proofBand("Practice proof", "The practice starts with the facts that control next steps.", "This page explains how the office works, what it screens, and why the site keeps emphasizing fit before service.", [
      { label: "Issue first", title: "The matter is named before any service is discussed", copy: "Practice areas and intake routes are designed to capture the actual issue instead of a buzzword." },
      { label: "Documents", title: "Forms, orders, and deadlines come early", copy: "Review starts with the papers that determine the next procedural step." },
      { label: "Boundary", title: "Scope and referral concerns stay visible", copy: "The site says when a matter needs another professional instead of forcing a fit." },
      { label: "Outcome", title: "The result is a clear next step", copy: "The goal is to leave the visitor with a concrete path, not just a broad description of services." }
    ], "proof-about")}
    ${lpScopeClarityPanel()}
    <div class="about-proof-grid">
      <article class="card"><h3>Family-law focus</h3><p>Divorce, parenting, child support, parentage, maintenance, enforcement, agreements, disclosure, filings, hearings, and settlement support each keep their issue context in Intake.</p></article>
      <article class="card"><h3>Scope-first review</h3><p>Some matters need attorney involvement, emergency resources, or referral. The intake flow is designed to surface those concerns before representation is confirmed.</p></article>
      <article class="card"><h3>Document-centered process</h3><p>Forms, orders, agreements, worksheets, exhibits, service issues, and deadlines are gathered early so the first review starts with usable information.</p></article>
    </div>
    <div class="about-process" aria-label="About intake process">
      ${[
        ["01", "Choose the closest issue", "Practice areas and Guides both carry the selected issue into Intake."],
        ["02", "Share the key details", "The form captures county, case stage, deadline, children, support, documents, and service needs."],
        ["03", "Check fit and scope", "The office reviews conflicts, licensed-scope limits, urgency, safety, and whether another resource is needed."],
        ["04", "Move to the right next step", "Guided Intake remains the public starting point. Accepted matters can later move into a secure client workspace when that access is available."]
      ].map(([number, title, copy]) => `<article><b>${number}</b><h3>${esc(title)}</h3><p>${esc(copy)}</p></article>`).join("")}
    </div>`);
  }

  const faqGroups = [
    {
      label: "Starting",
      intro: "What happens before services are accepted.",
      items: [
        ["Where should I start if I do not know what I need?", "Start with Guided Intake. It captures the issue, county, case stage, urgency, documents, and preferred help so the office can review conflict, licensed scope, and fit before recommending next steps."],
        ["Does submitting intake make me a client?", "No. Submitting intake, sending documents, reading a guide, or calling the office does not create a client relationship or confirm representation. Services require conflict review, scope review, and written engagement terms."],
        ["Can I call instead of using Guided Intake?", "Yes, but Guided Intake is the best first step for new matters because it gives the office the details needed for conflict, scope, urgency, and service-fit review."],
        ["What should I have ready before intake?", "Helpful items include filed papers, court orders, hearing notices, service documents, deadlines, county, case number, party names, income information, child-related facts, and a short timeline of what happened."],
        ["What if I have a hearing or deadline soon?", "Use Guided Intake and contact the office directly. A deadline, hearing, service problem, or safety concern should not wait for ordinary website review."],
        ["Can the office help if I was just served?", "Possibly. Intake should identify the date served, response deadline, county, case number, what papers were served, and whether temporary orders, parenting, support, property, or safety issues are involved."],
        ["Can I use this site if I already have a lawyer?", "Possibly, but the office must review conflict, role, scope, and whether your current attorney-client relationship affects what help can be offered."],
        ["Can the other party see what I submit?", "Website intake is for office review, but filed court documents and served papers may become part of the court process. Do not submit unnecessary confidential details before services are accepted."]
      ]
    },
    {
      label: "LP Scope",
      intro: "How Arizona Licensed Legal Paraprofessional services work.",
      items: [
        ["What is a Licensed Legal Paraprofessional?", "An Arizona Legal Paraprofessional is a licensed legal service provider authorized by the Arizona Supreme Court to provide legal services only within approved practice areas and scope limits."],
        ["Is an LP the same as a lawyer?", "No. An LP is not a lawyer. An LP may provide authorized services within the licensed practice area, but some matters require attorney involvement, referral, or specialized professional help."],
        ["Can an LP give legal advice?", "Within authorized scope, an Arizona LP may provide legal advice and opinions. Website content and DIY Guides remain general information until a matter is accepted under written terms."],
        ["Can an LP appear in family court?", "Within authorized family-law scope, an LP may be able to appear and speak in court. The office must review the matter type, hearing type, complexity, urgency, and scope before confirming availability."],
        ["What issues may be outside LP scope?", "Complex business valuations, commercial real estate, non-standard retirement division, QDRO-related work, appeals, criminal issues, bankruptcy, immigration, tax, and high-conflict or complex matters may require attorney or specialist involvement."],
        ["What happens if my case becomes too complex?", "The office may limit the scope, convert work to hourly review if allowed by the engagement, recommend attorney involvement, refer the matter out, or decline work that exceeds licensed scope."],
        ["Can an LP negotiate with the other party?", "LP negotiation may be available within authorized scope and after engagement. Intake should identify whether the case is uncontested, contested, settlement-focused, or already set for hearing."],
        ["Are communications confidential?", "Professional confidentiality obligations may apply after an appropriate professional relationship is formed. Before acceptance, submit only information needed for conflict, urgency, scope, and fit review."]
      ]
    },
    {
      label: "Divorce",
      intro: "Dissolution, legal separation, annulment, and agreements.",
      items: [
        ["How long must I live in Arizona before filing for divorce?", "Arizona generally requires one spouse to be domiciled in Arizona, or stationed here as a service member, for 90 days before filing for dissolution."],
        ["What is the difference between divorce and legal separation?", "Divorce ends the marriage. Legal separation can address property, debt, support, parenting, and other rights while the marriage remains legally intact."],
        ["Can we use a consent decree if we agree on everything?", "Often, yes. A consent decree or summary consent process may be appropriate when both parties have complete agreement on required terms, including property, debt, parenting, support, and related documents."],
        ["What if my spouse will not respond?", "A default path may be available after proper service and the required waiting period. Intake should capture service details, dates, county, children, property, debt, and requested final terms."],
        ["What if my spouse and I agree on most things but not everything?", "Partial agreement can still help. Intake should identify the agreed terms, disputed terms, documents exchanged, deadlines, and whether settlement drafting or negotiation support is needed."],
        ["Can I move out before divorce is filed?", "That depends on facts involving children, safety, finances, property, and court strategy. The public site cannot answer that for a specific case; request scope review before relying on a plan."],
        ["What property and debts are handled in divorce?", "Arizona divorce commonly addresses community property, separate property claims, debts, vehicles, bank accounts, retirement issues, the marital home, reimbursements, and allocation of obligations."],
        ["Can the office handle annulment?", "Possibly. Annulment depends on specific legal grounds and facts. Intake should explain the marriage history, timing, reason annulment is requested, and whether divorce or legal separation may be a better procedural fit."]
      ]
    },
    {
      label: "Parenting",
      intro: "Legal decision-making, parenting time, relocation, and safety.",
      items: [
        ["Does Arizona use the word custody?", "Arizona family-law orders generally use legal decision-making and parenting time instead of custody. Many people still say custody when describing the issue."],
        ["How does the court decide parenting issues?", "Arizona courts decide legal decision-making and parenting time based on the child’s best interests and relevant statutory factors, including safety, relationships, school, health, and other case-specific facts."],
        ["Can a child choose which parent to live with?", "A child’s wishes may be considered if the child is of suitable age and maturity, but the child does not simply decide the case. The court looks at best interests."],
        ["What is legal decision-making?", "Legal decision-making concerns major decisions for a child, often including education, health care, religion, and personal care decisions, depending on the order."],
        ["What is parenting time?", "Parenting time is the schedule for when each parent has time with the child, including regular weeks, weekends, holidays, school breaks, exchanges, and transportation terms."],
        ["Can parenting time be restricted?", "A court may restrict parenting time only under specific findings, including serious endangerment concerns. Safety facts need careful review and may require urgent resources."],
        ["What if the other parent will not follow the parenting plan?", "Enforcement or modification may be possible. Intake should include the order, missed-time records, messages, exchange history, police reports if any, and the exact remedy requested."],
        ["Can I relocate with a child?", "Relocation can trigger notice, objection, best-interest, and timing issues. Do not rely on general website content before moving; request review with the current order and proposed move details."]
      ]
    },
    {
      label: "Support",
      intro: "Child support, spousal maintenance, and financial disclosures.",
      items: [
        ["How is child support calculated in Arizona?", "Arizona child support uses guidelines and worksheet inputs such as income, parenting time, health insurance, childcare, other children, and certain expenses. The exact calculation depends on documents and facts."],
        ["Does equal parenting time mean no child support?", "No. Arizona law states that joint legal decision-making or substantially equal parenting time does not eliminate either parent’s responsibility to support a child."],
        ["Can child support be changed?", "Possibly. A change may depend on income, parenting time, insurance, childcare, emancipation, job loss, changed expenses, or other circumstances. Intake should include the current order and updated numbers."],
        ["What if the other parent is not paying child support?", "Enforcement options may exist. Gather the order, payment history, clearinghouse records, arrears notices, employment information, and any prior enforcement filings."],
        ["What is an Affidavit of Financial Information?", "An AFI is a detailed financial disclosure document used in many Arizona family-law matters involving support, fees, or financial issues. It should be complete, accurate, and supported by records."],
        ["What is spousal maintenance?", "Spousal maintenance is financial support from one spouse to the other when legal criteria are met. Eligibility, amount, and duration depend on facts and court findings."],
        ["Can the office prepare a child support worksheet?", "Yes, if within scope and with sufficient information. The office needs income records, parenting-time days, insurance, childcare, and other guideline inputs."],
        ["Can support be agreed by the parties?", "Parties can often propose support terms, but child support must still fit Arizona requirements and court review. Written agreements should be drafted carefully."]
      ]
    },
    {
      label: "Post-Decree",
      intro: "Changing, enforcing, or clarifying existing orders.",
      items: [
        ["When can parenting orders be modified?", "Arizona has timing and adequate-cause requirements. Some legal decision-making or parenting-time modifications generally cannot be filed within one year unless statutory exceptions apply."],
        ["What if there is danger or domestic violence after an order?", "Safety facts may support urgent or expedited review. Contact emergency resources if immediate danger exists, and provide orders, reports, messages, and hearing dates during intake."],
        ["Can child support be modified without changing parenting time?", "Sometimes. Support can change based on financial or child-related changes even if parenting time remains the same, but the worksheet and order terms must be reviewed."],
        ["What is enforcement?", "Enforcement asks the court to address failure to follow an existing order, such as unpaid support, denied parenting time, unpaid expenses, property transfer issues, or missed obligations."],
        ["What if the order is unclear?", "A clarification or modification path may be needed depending on the language, dispute, and remedy requested. Intake should upload the order and explain the specific confusion."],
        ["Can we change an order by agreement?", "Often, agreed modifications are possible, but the agreement usually needs proper documents and court approval before it replaces an existing order."],
        ["What records help in enforcement?", "Useful records include the signed order, payment records, calendars, messages, school records, exchange logs, receipts, notices, and a concise timeline."],
        ["Can the office help after a final decree?", "Possibly. Post-decree support may include modification, enforcement, clarification, document preparation, settlement terms, or hearing preparation if within licensed scope."]
      ]
    },
    {
      label: "Documents",
      intro: "Forms, service, disclosure, filing, and court preparation.",
      items: [
        ["Can you prepare forms for me?", "Yes, document preparation may be available within LP scope. Intake should identify the exact form packet, county, case stage, deadline, and whether advice or court help is also needed."],
        ["Where can I find official Arizona forms?", "Arizona Courts and county self-service centers publish family-law forms. The DIY Guides page links to official statewide and Maricopa family-court form resources."],
        ["Can you review documents I drafted myself?", "Possibly. The office can review for completeness, consistency, missing information, and fit with your stated goal if the matter is within scope."],
        ["What is service of process?", "Service is the formal delivery of court papers under required rules. Intake should include when papers were served, how they were served, and whether proof of service has been filed."],
        ["Can I file documents electronically?", "E-filing availability depends on court, county, role, and document type. The office can review filing posture and whether filing support is part of the service scope."],
        ["What documents should I upload?", "Upload court orders, petitions, responses, notices, hearing orders, disclosure, worksheets, financial records, proposed agreements, and any document connected to the requested next step."],
        ["Can you help with exhibits?", "Possibly. Exhibit organization may be available for hearings within scope. The office must review deadline, hearing type, court instructions, evidence volume, and whether attorney help is needed."],
        ["Can you fix a rejected filing?", "Possibly. Intake should include the rejected document, rejection notice, filing date, deadline, and the court’s stated reason for rejection."]
      ]
    },
    {
      label: "Fees",
      intro: "Pricing, limited scope, and service-fit review.",
      items: [
        ["Are fees shown on the website guaranteed?", "No. Published fees are planning fees. Final terms depend on conflict review, licensed scope, urgency, documents, complexity, and written engagement terms."],
        ["Why is there a paid strategy session?", "A paid strategy session protects intake value and allows focused review. It is not a promise that ongoing services will be available or that a matter is within scope."],
        ["What is limited-scope help?", "Limited-scope help means the office assists with defined tasks, such as document preparation, review, worksheet support, or hearing preparation, while the client handles other parts."],
        ["What can make a flat fee change?", "Contested issues, refusal to sign, substantive negotiation, complex property, business valuation, unusual retirement division, urgent turnaround, extra revisions, or out-of-scope work may change pricing or require referral."],
        ["Are court filing fees included?", "No. Court filing fees, process server costs, classes, records, expert fees, and third-party charges are separate unless written terms say otherwise."],
        ["Can I start DIY and upgrade later?", "Often, yes. DIY Guides are designed to help you organize facts and forms before routing into Guided Intake for reviewed next steps."],
        ["Do you offer full representation?", "The office may provide ongoing family-law LP services within licensed scope. The exact role must be defined in writing and may differ from attorney representation."],
        ["Can I compare LP pricing to lawyer pricing?", "LP services may be more affordable for appropriate matters, but price comparisons depend on complexity, scope, risk, and what work is included. The public fee page avoids promises that do not fit every case."]
      ]
    },
    {
      label: "Court",
      intro: "Hearings, settlement, mediation, and courtroom readiness.",
      items: [
        ["What is a Resolution Management Conference?", "An RMC is a family-court conference used to identify issues, deadlines, settlement options, disclosures, and future court settings. Preparation depends on the court order and case posture."],
        ["Can the office attend a hearing with me?", "Possibly, if the hearing and matter are within LP scope and the office accepts that role in writing. Intake should identify the hearing type, date, time, judge, and order setting the hearing."],
        ["What are temporary orders?", "Temporary orders address interim issues while a case is pending, such as parenting time, support, use of property, debt payments, or other temporary needs."],
        ["What is mediation?", "Mediation is a settlement process where a neutral helps parties try to reach agreement. Some courts require alternative dispute resolution before trial."],
        ["What if we settle before trial?", "Settlement terms usually need to be put into proper written form and submitted for court approval. The office can review drafting needs if within scope."],
        ["What should I bring to court?", "Bring the court order setting the hearing, filed documents, exhibits, notes, identification, financial records, proposed orders, and any materials required by the judge or rules."],
        ["Can I talk to the judge outside a hearing?", "Generally no. Communications with the court must follow court rules and proper filing or hearing procedures. Do not send private case arguments to the judge."],
        ["What if I miss a hearing?", "A missed hearing can have serious consequences. Contact the court and request legal review quickly. Intake should include the hearing notice, what happened, and any resulting order."]
      ]
    }
  ];

  function allFaqItems() {
    return faqGroups.flatMap((group) => group.items.map(([question, answer]) => ({ ...group, question, answer })));
  }

  function faqCard(item, index) {
    return `<details class="faq-item"${index >= 16 ? " hidden data-faq-extra" : ""} data-faq-item data-faq-category="${esc(item.label)}" data-faq-text="${esc(`${item.label} ${item.question} ${item.answer}`.toLowerCase())}">
      <summary><span>${esc(item.label)}</span>${esc(item.question)}</summary>
      <div class="faq-answer"><p>${esc(item.answer)}</p></div>
    </details>`;
  }

  function faq() {
    const items = allFaqItems();
    return section("FAQ", "Answers to the questions Arizona family-law users usually need before choosing a pathway, starting intake, comparing fees, or deciding whether LP help may fit.", `
      <div class="faq-command">
        <div>
          <p class="eyebrow">FAQ help</p>
          <h3>Find the answer, then move into the right next step.</h3>
          <p>Search by issue, filter by topic, open only what matters, then use Guided Intake when you need conflict, licensed-scope, urgency, and service-fit review.</p>
        </div>
        <div class="faq-command-actions">
          <a class="button primary" href="/start" data-link>Start Guided Intake</a>
          <a class="button outline" href="/guides" data-link>Use DIY Guides</a>
        </div>
      </div>
      <div class="faq-tools" data-faq-tools>
        <input type="search" placeholder="Search divorce, parenting, support, LP scope, fees..." aria-label="Search FAQs" data-faq-search>
        <div class="faq-category-list" aria-label="FAQ categories">
          <button class="faq-category-chip active" type="button" data-faq-filter="All" aria-pressed="true">All</button>
          ${faqGroups.map((group) => `<button class="faq-category-chip" type="button" data-faq-filter="${esc(group.label)}" aria-pressed="false">${esc(group.label)}</button>`).join("")}
        </div>
      </div>
      <div class="faq-status-row" aria-live="polite">
        <span data-faq-count>Showing 16 of ${items.length} FAQs</span>
      </div>
      <div class="faq-layout">
        <aside class="faq-index" aria-label="FAQ topic index">
          ${faqGroups.map((group) => `<button type="button" data-faq-filter="${esc(group.label)}"><strong>${esc(group.label)}</strong><span>${esc(group.intro)}</span></button>`).join("")}
        </aside>
        <div class="faq-list" data-faq-list>${items.map(faqCard).join("")}</div>
      </div>
      <div class="faq-reveal">
        <button class="button primary faq-reveal-button" type="button" data-faq-reveal>View All FAQs</button>
        <p class="faq-note" data-faq-note>Showing the first 16 frequently asked questions. Search any topic, choose a category, or reveal the remaining ${Math.max(items.length - 16, 0)}.</p>
      </div>
      <div class="policy-resources faq-resources">
        <h3>Official reference points</h3>
        <span>Arizona Courts family-law forms and basic filing information</span>
        <span>State Bar of Arizona Legal Paraprofessionals</span>
        <span>A.R.S. Section 25-403 best-interests factors</span>
        <span>A.R.S. Section 25-411 modification timing and adequate cause</span>
        <span>ABA Family Advocate client manuals</span>
      </div>
      ${legalGlossaryPanel()}`);
  }

  function contact() {
    return section("Contact", "Use the guided intake for structured review, or contact the office directly for urgent timing issues.", `${pageCommand("Contact options", "Choose the contact path that matches the situation.", "New matters, existing-client support, deadlines, and access issues should not all use the same first step.", [
      { label: "Start Guided Intake", href: "/start", className: "primary", route: serviceMethodFallbackRoute },
      { label: "Email Office", href: "mailto:info@myfamilylawgroup.com", className: "outline", dataLink: false },
      { label: "Call Office", href: "tel:+18888706354", className: "outline", dataLink: false }
    ], [
      { label: "New matter", title: "Use Guided Intake", copy: "Best for unreviewed divorce, parenting, support, forms, or court-preparation questions." },
      { label: "Existing client", title: "Use direct office contact", copy: "Best for case status, scheduling, document access, billing, or pending follow-up." },
      { label: "Deadline", title: "Put the date first", copy: "If there is a hearing, service date, response deadline, or safety issue, lead with timing." }
    ], "contact-command")}${proofBand("Contact paths", "Choose the contact path that matches the work.", "The site should not make every visitor do the same thing. New matters, existing clients, and urgent timing all need different next steps.", [
      { label: "New matter", title: "Start with Guided Intake", copy: "The office can review conflict, scope, urgency, and service fit from your submitted details." },
      { label: "Existing client", title: "Use direct office contact", copy: "Case status, documents, scheduling, and follow-up work belong on the existing-client path." },
      { label: "Deadline", title: "Put timing first", copy: "If there is a hearing, service date, or response deadline, say that immediately." },
      { label: "Access", title: "Report barriers plainly", copy: "If the website is difficult to use, send the page URL and describe the obstacle." }
    ], "proof-contact")}<div class="grid two">
      <article class="card"><h3>Office</h3><p><a href="tel:+18888706354">(888) 870-6354</a><br><a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a><br>Fax: 602-782-8114</p><p>Jeremy James Jack JD, LP<br>Arizona Supreme Court Licensed Legal Paraprofessional — Family Law<br>License No. 500094</p></article>
      <article class="card"><h3>Before sending details</h3><p>Please do not send confidential facts until the office confirms whether services can be provided.</p><p>Guided Intake is the best path for new matters because it gives the office the details needed for conflict, scope, urgency, and service-fit review.</p></article>
    </div><div class="contact-router" aria-label="Choose the best contact path">
      <div class="contact-router-head">
        <p class="eyebrow">Choose the right contact path</p>
        <h3>New matters, existing clients, and urgent timing need different next steps.</h3>
        <p>Use the path that matches your situation so the office gets the right context without unnecessary confidential detail.</p>
      </div>
      <div class="contact-router-grid">
        <article>
          <span>New matter</span>
          <strong>Start with Guided Intake</strong>
          <p>Best for divorce, parenting time, support, paternity, enforcement, modification, forms, or court-preparation questions that have not already been reviewed.</p>
          <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>Start Guided Intake</a>
        </article>
        <article>
          <span>Existing client</span>
          <strong>Use direct office contact</strong>
          <p>Existing clients should contact the office for case status, scheduling, document access, signed engagement work, billing questions, or a pending follow-up already in progress.</p>
          <a class="button outline" href="mailto:info@myfamilylawgroup.com">Email Office</a>
        </article>
        <article>
          <span>Deadline or hearing</span>
          <strong>Include timing first</strong>
          <p>If there is a hearing, response deadline, service date, or safety concern, include the date and court notice in Intake or your office message.</p>
          <a class="button outline" href="tel:+18888706354">Call Office</a>
        </article>
      </div>
    </div><div class="grid two contact-recommendations">
      <article class="card"><h3>What not to send first</h3><p>Do not send long confidential narratives, evidence dumps, passwords, or sensitive third-party records until the office confirms how information should be submitted.</p></article>
      <article class="card"><h3>Official social channels</h3><p>No public social media links are published here until official, maintained channels are confirmed. This avoids sending visitors to inactive or unofficial accounts.</p></article>
    </div>`);
  }

  function start() {
    return `<section class="intake-landing-section" aria-label="Guided intake introduction"><div class="intake-landing-inner">
      <p class="eyebrow">Guided Intake</p>
      <h1>Start Guided Intake</h1>
      <p class="lead muted">Answer a few questions so the office can review the family-law issue, urgency, county, and next-step needs. Submission does not create a client relationship or confirm representation.</p>
      <div class="intake-landing-cues" aria-label="Guided intake review focus">
        <span><b>01</b> Issue</span>
        <span><b>02</b> Urgency</span>
        <span><b>03</b> Next step</span>
      </div>
    </div></section><section class="intake-prep-section">${intakeReadinessPanel()}</section><section class="intake-shell intake-shell-start"><div id="mflg-intake-root"></div></section>`;
  }

  function clientLogin() {
    return section("Client Portal", "Secure client access is coordinated directly through the office while portal access is prepared.", `<div class="client-access-panel" aria-label="Client access routing">
      <div class="client-access-head">
        <p class="eyebrow">Access status</p>
        <h3>Use this page to choose the right access path without exposing unnecessary case details.</h3>
        <p>The public website is not a case-management portal. Until secure access is assigned directly by the office, use the path below that matches your status.</p>
      </div>
      <div class="client-access-grid">
        <article>
          <span>New matters</span>
          <strong>Start with Guided Intake</strong>
          <p>Guided Intake collects the details used for conflict, licensed-scope, urgency, and service-fit review.</p>
          <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>Start Guided Intake</a>
        </article>
        <article>
          <span>Existing clients</span>
          <strong>Contact the office for case support</strong>
          <p>Existing clients should contact the office for case status, document access, scheduling questions, billing questions, or next-step coordination.</p>
          <a class="button outline" href="/contact" data-link>Contact Office</a>
        </article>
        <article>
          <span>Secure access plan</span>
          <strong>Portal access will be assigned directly</strong>
          <p>When portal access is active, this page will direct clients to status, documents, tasks, and communications from one secure entry point.</p>
          <a class="button outline" href="mailto:info@myfamilylawgroup.com">Ask About Access</a>
        </article>
      </div>
    </div>
    <div class="notice"><strong>Client portal access is coordinated through the office.</strong> Existing clients who need documents, scheduling help, or case access support should contact the office at <a href="tel:+18888706354">(888) 870-6354</a> or <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>. New matters should begin with Guided Intake so conflict, scope, urgency, and service fit can be reviewed first.</div>
    <div class="client-access-note">
      <strong>Do not send passwords or large evidence files through ordinary public website messages.</strong>
      <p>Use office-directed upload, email, or portal instructions after the office confirms the correct channel for the matter.</p>
    </div>`);
  }

  function staffLogin() {
    return section("Staff Login", "Staff login is restricted and remains separate from public intake navigation.", `<div class="notice">Authorized staff should use the protected staff login process. This public page does not provide case-system or administrative access.</div>
    <div class="restricted-route-panel" aria-label="Staff login public routing">
      <div class="restricted-route-copy">
        <p class="eyebrow">Restricted access</p>
        <h3>This public page does not provide staff, case-system, or administrative login access.</h3>
        <p>If you reached this page by mistake, choose the public path that fits your need. New matters should use Guided Intake; existing clients should use direct office contact.</p>
      </div>
      <div class="restricted-route-grid">
        <a href="/start" data-link><span>New matter</span><strong>Start Guided Intake</strong><p>Submit structured information for conflict, scope, urgency, and service-fit review.</p></a>
        <a href="/client" data-link><span>Client access</span><strong>Client Portal status</strong><p>See how secure client access is coordinated through the office.</p></a>
        <a href="/contact" data-link><span>Office help</span><strong>Contact the office</strong><p>Use direct contact for existing-client support, access questions, and timing issues.</p></a>
      </div>
    </div>`);
  }

  function policyActionPanel(type) {
    const panels = {
      privacy: {
        label: "Privacy next steps",
        title: "Choose the safest path before sharing sensitive facts.",
        copy: "New family-law details should go through Guided Intake or office-directed communication after the office confirms the right channel.",
        actions: [
          ["Start Guided Intake", "/start", "primary"],
          ["Contact Office", "/contact", "outline"]
        ],
        items: [
          ["New matter", "Use Intake so names, county, deadline, and issue type are structured for review."],
          ["Prior submission", "Contact the office to update contact information or ask about the status of a prior request."],
          ["Sensitive records", "Wait for office instructions before sending passwords, large files, or highly sensitive documents."]
        ]
      },
      terms: {
        label: "Terms next steps",
        title: "Use the site as a starting point, then confirm fit before relying on a path.",
        copy: "Website content can help you orient, but case-specific advice requires conflict, scope, urgency, document, and engagement review.",
        actions: [
          ["Check Service Fit", "/start", "primary"],
          ["Review Fees", "/fees", "outline"]
        ],
        items: [
          ["No instant engagement", "Clicking a pathway or submitting information does not create a client relationship."],
          ["Scope matters", "Some issues require attorney or specialist help rather than LP service."],
          ["Deadlines", "If a hearing or response deadline exists, treat timing as the first fact to disclose."]
        ]
      },
      accessibility: {
        label: "Access next steps",
        title: "If the website gets in the way, use a direct access path.",
        copy: "The goal is practical access to intake and family-law information, not forcing every visitor through one online path.",
        actions: [
          ["Start Guided Intake", "/start", "primary"],
          ["Report Access Issue", "mailto:info@myfamilylawgroup.com", "outline"]
        ],
        items: [
          ["Barrier report", "Send the page URL, device or browser, and a short description of what did not work."],
          ["Alternative intake", "Ask for a reasonable alternate intake path if the web form is hard to use."],
          ["Urgent timing", "Call the office if an access issue intersects with a deadline, hearing, or service problem."]
        ]
      }
    };
    const panel = panels[type] || panels.privacy;
    return `<div class="policy-action-panel" aria-label="${esc(panel.label)}">
      <div class="policy-action-copy">
        <p class="eyebrow">${esc(panel.label)}</p>
        <h3>${esc(panel.title)}</h3>
        <p>${esc(panel.copy)}</p>
        <div class="policy-action-buttons">
          ${panel.actions.map(([label, href, cls]) => `<a class="button ${esc(cls)}" href="${esc(href)}"${href.startsWith("/") ? " data-link" : ""}>${esc(label)}</a>`).join("")}
        </div>
      </div>
      <div class="policy-action-list">
        ${panel.items.map(([label, copy], index) => `<article>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${esc(label)}</strong>
          <p>${esc(copy)}</p>
        </article>`).join("")}
      </div>
    </div>`;
  }

  function privacy() {
    return section("Privacy", "MY FAMILY LAW GROUP PLLC limits intake collection to information reasonably needed to review conflict, scope, urgency, licensed-scope, and next-step options.", `<div class="policy-grid">
      <article class="card"><h3>Information collected</h3><p>Guided Intake may collect contact details, county, case stage, deadlines, family-law issue type, document needs, service preferences, and limited facts needed to screen conflict, urgency, scope, and fit.</p></article>
      <article class="card"><h3>How information is used</h3><p>Information may be reviewed for intake triage, conflict checking, scheduling, licensed-scope review, service-fit review, and follow-up about the submitted request.</p></article>
      <article class="card"><h3>Confidential details</h3><p>Please do not submit confidential, highly sensitive, or emergency facts until the office confirms whether services can be provided. Submission does not confirm representation.</p></article>
      <article class="card"><h3>Systems and vendors</h3><p>Website, intake, email, scheduling, secure portal, and office workflow tools may process submitted information for office operations. Access should be limited to authorized review needs.</p></article>
      <article class="card"><h3>Your choices</h3><p>You may contact the office to update contact information, ask about a prior submission, request accessibility help, or ask how to proceed if you do not want to use the web intake form.</p></article>
      <article class="card"><h3>Official framework</h3><p>Arizona legal paraprofessionals provide services only within licensed scope and remain subject to Arizona professional-conduct obligations. The privacy posture follows that scope-first intake model.</p></article>
    </div><div class="policy-resources">
      <h3>Reference points</h3>
      <span>Arizona Supreme Court Legal Paraprofessional Program</span>
      <span>State Bar of Arizona Legal Paraprofessionals</span>
      <span>Arizona Rules of Professional Conduct</span>
    </div>${policyActionPanel("privacy")}`);
  }

  function terms() {
    return section("Terms & Disclaimer", "Website content is general information, not legal advice for a specific matter. Services are available only after conflict, urgency, licensed-scope, and fit review.", `<div class="policy-grid">
      <article class="card"><h3>No client relationship from website use</h3><p>Using this website, reading guide content, clicking a pathway, or submitting intake information does not create a client relationship or confirm representation.</p></article>
      <article class="card"><h3>General information only</h3><p>Public pages and DIY Guides are educational starting points. Specific advice requires review of facts, documents, deadlines, conflicts, licensed scope, and any required engagement terms.</p></article>
      <article class="card"><h3>Licensed-scope limits</h3><p>MY FAMILY LAW GROUP PLLC provides Arizona family-law support through a licensed legal paraprofessional model. Some issues require attorney involvement, emergency resources, or referral.</p></article>
      <article class="card"><h3>No guarantees</h3><p>Prior results, sample pathways, pricing examples, guide content, or intake routing do not guarantee a result, court action, fee, availability, or acceptance of a matter.</p></article>
      <article class="card"><h3>Deadlines and emergencies</h3><p>If a deadline, hearing, service issue, safety concern, or emergency exists, do not rely on website content alone. Contact the court, emergency resources, or qualified legal help immediately.</p></article>
      <article class="card"><h3>Client portal access</h3><p>Secure portal access is not available through the public website yet. Existing clients should contact the office for status, documents, tasks, and communications.</p></article>
    </div><div class="policy-resources">
      <h3>Reference points</h3>
      <span>ACJA Section 7-210 Legal Paraprofessional</span>
      <span>Arizona Rule 42, Rules of Professional Conduct</span>
      <span>ABA Model Rules reference</span>
    </div>${policyActionPanel("terms")}`);
  }

  function accessibility() {
    return section("Accessibility", "MY FAMILY LAW GROUP PLLC works to make this website usable for visitors with different access needs and to provide a practical path when the website does not work for someone.", `<div class="policy-grid">
      <article class="card"><h3>Website access</h3><p>The site is designed for keyboard navigation, readable contrast, responsive layouts, descriptive link text, and structured pages across desktop and mobile devices.</p></article>
      <article class="card"><h3>Intake alternatives</h3><p>If Guided Intake is difficult to use, contact the office so a reasonable alternate intake path can be discussed for the issue, timing, and document need.</p></article>
      <article class="card"><h3>Report an issue</h3><p>Send the page URL, device/browser, assistive technology if any, and a short description of the barrier to <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>.</p></article>
      <article class="card"><h3>Contact options</h3><p>Call <a href="tel:+18888706354">(888) 870-6354</a>, email <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>, or fax 602-782-8114 if website access prevents use of an online feature.</p></article>
    </div><div class="policy-resources">
      <h3>Access commitment</h3>
      <p>The goal is practical access to family-law intake information, not a website-only gate. New matters still require conflict, scope, urgency, and fit review before services are accepted.</p>
    </div>${policyActionPanel("accessibility")}`);
  }

  function thankYou() {
    return section("Thank You", "Thank you for contacting MY FAMILY LAW GROUP PLLC.", `<div class="thank-you-panel" aria-label="What happens after submission">
      <div class="thank-you-head">
        <p class="eyebrow">Submission received</p>
        <h3>Review comes before any service relationship is confirmed.</h3>
        <p>Your information will be reviewed for conflict, licensed scope, urgency, documents, and next-step needs. Submission does not create a client relationship or confirm representation.</p>
      </div>
      <div class="thank-you-steps">
        <article><span>01</span><strong>Conflict and identity review</strong><p>The office checks names and matter details before discussing legal strategy or accepting work.</p></article>
        <article><span>02</span><strong>Scope and urgency screen</strong><p>Deadlines, hearings, court notices, safety issues, and LP-scope limits determine the right follow-up.</p></article>
        <article><span>03</span><strong>Next-step recommendation</strong><p>The response may be a consult, document path, limited-scope quote, referral, or request for more information.</p></article>
      </div>
      <div class="thank-you-actions">
        <a class="button primary" href="/guides" data-link>Use DIY Guides While You Wait</a>
        <a class="button outline" href="/contact" data-link>Contact Office</a>
      </div>
    </div>`);
  }

  function notFound() {
    return section("Page Not Found", "The page you requested was not found.", `<div class="not-found-router" aria-label="Page recovery options">
      <div class="not-found-copy">
        <p class="eyebrow">Page not found</p>
        <h3>The link may have moved, but the main paths are still available.</h3>
        <p>Use one of the public routes below to get back to intake, practice-area details, forms, fees, or office contact.</p>
      </div>
      <div class="not-found-grid">
        <a href="/start" data-link><span>Guided Intake</span><strong>Start structured review</strong><p>Best if you need the office to review conflict, scope, urgency, and next steps.</p></a>
        <a href="/practice-areas" data-link><span>Practice Areas</span><strong>Find the closest issue</strong><p>Browse divorce, parenting, support, paternity, modification, enforcement, and related pathways.</p></a>
        <a href="/tools" data-link><span>Forms & Calculators</span><strong>Use forms and calculators</strong><p>Open court-form routing, deadline tools, child-support calculators, and public resources.</p></a>
        <a href="/fees" data-link><span>Fees</span><strong>Review planning prices</strong><p>See published fee categories before asking for service-fit review.</p></a>
        <a href="/faq" data-link><span>FAQ</span><strong>Search common answers</strong><p>Look up plain-language answers and legal-term definitions.</p></a>
        <a href="/contact" data-link><span>Contact</span><strong>Reach the office</strong><p>Use direct contact for existing-client questions, access issues, or urgent timing concerns.</p></a>
      </div>
    </div>`);
  }

	  function currentRoutePath() {
	    return window.location.pathname.replace(/\/$/, "") || "/";
	  }

		  function rememberScroll() {
		    scrollPositions.set(currentRoutePath(), window.scrollY || 0);
		  }

		  function jumpToTop() {
		    window.scrollTo(0, 0);
		    document.documentElement.scrollTop = 0;
		    document.body.scrollTop = 0;
		  }

	  async function render(options) {
	    const opts = options || {};
	    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const view = routes[path] || notFound;
    activeRenderPath = routes[path] ? path : "/404";
    afterHeroAnchorAvailable = activeRenderPath === "/";
    updateDocumentMeta(activeRenderPath);
    document.body.classList.toggle("has-hero", path === "/");
    document.body.classList.remove(
      "forms-showing-all-sections",
      "forms-active-need-forms",
      "forms-active-need-calculator",
      "forms-active-need-deadline",
      "forms-active-need-issue"
    );
    root.innerHTML = await view();
    applyStoredFormsRouteIfNeeded(path);
    wireGuideFilters();
    wireServiceTools();
    wireServiceMethodCarousel();
    wireFaqTools();
    wireFormsSmartPath();
    wireFormsRouter();
    wireFormsToolsActionPlan();
    wireFormsToolsReviewRoadmap();
    wireFormsToolsMaintenanceStatus();
    wireFormsToolsIntakeReadiness();
    wireFormsToolsRouteIntakeMap();
    wireFormsToolsMatterCoverage();
    wireFormsToolsCompletionStatus();
    wireJurisdictionReadiness();
    wireCalculatorReadiness();
    wireCalculatorFormulaReadiness();
    wireSourceHealthPanel();
    wireFormsToolsCoverage();
    wireFormRouteActions();
    wireOfficialPacketActions();
    wireOfficialPdfActions();
    wireFormDownloadReadiness();
    wireCalculatorPrecheck();
    wireCalculatorChooser();
    wireParentingTimeCounter();
    wireDeadlineReadinessPlanner();
	    renderIntakeIfNeeded(path);
	    updateNav(path);
      startPublicTextCleanupObserver();
      schedulePublicTextCleanup(root);
	    scheduleLegalTermEnhancement(root);
      wireHeroVideoLoop();
		    if (opts.restoreScroll) {
	      window.scrollTo({ top: scrollPositions.get(path) || 0, behavior: "instant" in window ? "instant" : "auto" });
	    } else {
	      jumpToTop();
	    }
    updateHeaderState();
	  }
	
	  function parseRouteData(value) {
	    if (!value) return null;
	    try {
	      const route = JSON.parse(value);
	      return route && typeof route === "object" ? route : null;
	    } catch (error) {
	      return null;
	    }
	  }

	  function storedIntakeRoute() {
	    try {
	      return parseRouteData(window.sessionStorage.getItem("mflgRouteContext"));
	    } catch (error) {
	      return null;
	    }
	  }

	  function storeIntakeRoute(route) {
	    try {
	      window.sessionStorage.setItem("mflgRouteContext", JSON.stringify({
	        ...route,
	        routedAt: new Date().toISOString()
	      }));
	    } catch (error) {
	      /* Intake still works without session storage. */
	    }
	    rememberPublicAnswers({
	      ...(route?.presetAnswers || {}),
	      issue: route?.issuePathway || route?.issueDetail || "",
	      sourcePathway: route?.entrySource || "",
	      selectedPracticeArea: route?.entrySource === "service-pathway" ? route.entryLabel : "",
	      selectedGuide: route?.entrySource === "diy-guide" ? route.entryLabel : ""
	    }, {
	      confirmed: true,
	      confirmedFields: ["issue", "selectedPracticeArea", "selectedGuide"],
	      source: route?.entrySource || "intake-route"
	    });
	  }

	  function storedPublicAnswers() {
	    try {
	      return parseRouteData(window.sessionStorage.getItem("mflgPublicAnswers")) || {};
	    } catch (error) {
	      return {};
	    }
	  }

		  function rememberPublicAnswers(answers, options = {}) {
		    return commitPublicAnswers(answers, options);
		  }

		  function storeFormsRoute(route, calculatorChoice, options = {}) {
	    const normalizedRoute = {
	      ...(route || {}),
	      issue: normalizeFormsIssue((route || {}).issue || "all"),
	      county: normalizeFormsCounty((route || {}).county),
	      posture: normalizeFormsPosture((route || {}).posture),
	      children: normalizeFormsChildren((route || {}).children),
	      calculatorChoice: calculatorChoice || (route || {}).calculatorChoice || ""
	    };
	    try {
	      window.sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({
	        ...normalizedRoute,
	        routedAt: new Date().toISOString()
	      }));
	    } catch (error) {
	      /* Forms routing still works without session storage. */
	    }
	    if (route && typeof route === "object") {
	      window.MFLGLatestFormsRoute = { ...normalizedRoute };
	    }
		    rememberPublicAnswers({
		      need: normalizedRoute.need || "",
		      issue: normalizedRoute.issue,
		      county: normalizedRoute.county,
		      posture: normalizedRoute.posture,
		      children: normalizedRoute.children,
		      selectedPacket: normalizedRoute.pdfPacket || "",
		      selectedCalculator: normalizedRoute.calculatorChoice || "",
		      selectedGuide: normalizedRoute.fromGuide || "",
			      selectedPracticeArea: normalizedRoute.fromPracticeArea || "",
			      packetSourceCounty: normalizedRoute.packetSourceCounty || normalizedRoute.sourceJurisdiction || "",
			      sourcePathway: normalizedRoute.sourcePathway || "Forms & Tools"
			    }, options);
			  }

	  function rememberFormsQualifierAnswers(answers, options = {}) {
	    const existing = storedFormsRoute() || window.MFLGLatestFormsRoute || {};
	    const route = {
	      ...existing,
	      ...(answers || {}),
	      issue: normalizeFormsIssue((answers || {}).issue || existing.issue || "all"),
	      county: normalizeFormsCounty((answers || {}).county || existing.county),
	      posture: normalizeFormsPosture((answers || {}).posture || existing.posture),
	      children: normalizeFormsChildren((answers || {}).children || existing.children)
	    };
	    route.pdfPacket = options.preservePacket === true
	      ? route.pdfPacket || "all"
	      : pdfPacketForFormsRoute(route.county, route.issue, route.posture, route.children);
	    route.expandPdfGroup = route.pdfPacket !== "all" || existing.expandPdfGroup === true;
	    route.focusPacketBuilder = route.pdfPacket !== "all" || existing.focusPacketBuilder === true;
		    storeFormsRoute(route, options.calculatorChoice || existing.calculatorChoice || window.MFLGGuideCalculatorChoice || "", options.publicAnswerOptions || {});
	    return route;
	  }

		  function storedFormsRoute() {
		    try {
		      const legacyRoute = parseRouteData(window.sessionStorage.getItem("mflgFormsRouteContext")) || {};
		      const answers = mergePublicAnswersWithLegacy(storedPublicAnswers(), legacyRoute);
		      const hasMeaningfulAnswer = Boolean(
		        confirmedPublicValue("county", answers.county)
		        || confirmedPublicValue("issue", answers.issue)
		        || confirmedPublicValue("posture", answers.posture)
		        || confirmedPublicValue("children", answers.children)
		        || confirmedPublicValue("selectedPacket", answers.selectedPacket)
		        || confirmedPublicValue("selectedCalculator", answers.selectedCalculator)
		        || answers.selectedGuide
		        || answers.selectedPracticeArea
		      );
		      if (!hasMeaningfulAnswer) return null;
		      rememberPublicAnswers(answers);
		      return {
		        county: answers.county,
		        issue: answers.issue,
		        posture: answers.posture,
		        children: answers.children,
	        pdfPacket: answers.selectedPacket || "all",
	        calculatorChoice: answers.selectedCalculator || "",
		        fromGuide: answers.selectedGuide || "",
		        fromPracticeArea: answers.selectedPracticeArea || ""
		      };
		    } catch (error) {
		      return null;
	    }
	  }

	  function applyStoredFormsRouteIfNeeded(path) {
	    if (path !== "/tools" && path !== "/forms" && path !== "/calculators") return;
	    const route = storedFormsRoute();
	    if (!route) return;
	    window.MFLGLatestFormsRoute = {
	      county: normalizeFormsCounty(route.county),
	      issue: normalizeFormsIssue(route.issue),
	      posture: normalizeFormsPosture(route.posture),
	      children: normalizeFormsChildren(route.children),
	      pdfPacket: route.pdfPacket || "all",
	      expandPdfGroup: route.expandPdfGroup !== false,
	      focusPacketBuilder: route.focusPacketBuilder !== false,
	      fromGuide: route.fromGuide || ""
	    };
	    if (route.calculatorChoice) {
	      window.MFLGGuideCalculatorChoice = route.calculatorChoice;
	    }
	  }

	  function clearIntakeRoute() {
	    try {
	      window.sessionStorage.removeItem("mflgRouteContext");
	      window.sessionStorage.removeItem("mflgIntakeIssueExact");
	      window.sessionStorage.removeItem("mflgIntakeIssue");
	      window.sessionStorage.removeItem("mflgIntakeContext");
	      window.sessionStorage.removeItem("mflgEntrySource");
	      window.sessionStorage.removeItem("mflgEntryLabel");
	      window.sessionStorage.removeItem("mflgServiceInterest");
	      window.sessionStorage.removeItem("mflgServiceInterestValue");
	    } catch (error) {
	      /* no-op */
	    }
	  }

	  function renderIntakeIfNeeded(path) {
	    if (path !== "/start" || typeof window.MFLGIntakeRoute !== "function") return;
	    const route = storedIntakeRoute();

	    if (route) {
	      window.MFLGIntakeRoute(route);
	      return;
	    }

	    if (typeof window.MFLGIntakeClearRoute === "function") {
	      window.MFLGIntakeClearRoute();
	    } else if (typeof window.MFLGIntakeRender === "function") {
	      window.MFLGIntakeRender();
	    }
	  }

  function normalizedPathFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return "";
      return url.pathname.replace(/\/$/, "") || "/";
    } catch (error) {
      return "";
    }
  }

  function updateNav(path) {
    const currentPath = path.replace(/\/$/, "") || "/";
    document.querySelectorAll("nav").forEach((container) => {
      let matched = false;
      container.querySelectorAll("a[href]").forEach((item) => {
        const itemPath = normalizedPathFromHref(item.getAttribute("href"));
        if (!itemPath) return;
        if (!matched && itemPath === currentPath) {
          item.setAttribute("aria-current", "page");
          matched = true;
        } else {
          item.removeAttribute("aria-current");
        }
      });
    });

    const brand = document.querySelector(".brand[href='/']");
    if (brand) {
      if (currentPath === "/") brand.setAttribute("aria-current", "page");
      else brand.removeAttribute("aria-current");
    }
  }

  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    nav.querySelectorAll("details[open]").forEach((item) => item.removeAttribute("open"));
  }

  function wireGuideFilters() {
    const search = document.querySelector("[data-guide-search]");
    const categoryButtons = Array.from(document.querySelectorAll("[data-guide-category-filter]"));
    const reset = document.querySelector("[data-guide-category-reset]");
    const list = document.querySelector("[data-guide-list]");
    const button = document.querySelector("[data-guide-reveal]");
    const clearAll = document.querySelector("[data-guide-clear-all]");
    const reveal = document.querySelector(".guide-reveal");
    const count = document.querySelector("[data-guide-count]");
    const note = document.querySelector("[data-guide-note]");
    if (!search || !list) return;
    const cards = Array.from(list.querySelectorAll("[data-guide-card]"));
    const guideData = serviceItems.map(guideFromServiceItem);
    let revealed = false;
    let activeCategory = "All situations";
    let activeGuideIndex = null;
    const panel = document.createElement("div");
    panel.className = "guide-row-panel";
    panel.hidden = true;

    const clearPanel = () => {
      activeGuideIndex = null;
      panel.hidden = true;
      panel.innerHTML = "";
      if (panel.parentElement) panel.remove();
      cards.forEach((card) => {
        card.classList.remove("active");
        card.querySelector("[data-guide-open]")?.setAttribute("aria-expanded", "false");
      });
    };

    const insertPanelAfterRow = (card) => {
      const visibleCards = cards.filter((item) => !item.hidden);
      const top = Math.round(card.getBoundingClientRect().top);
      let rowEnd = card;
      visibleCards.forEach((item) => {
        const itemTop = Math.round(item.getBoundingClientRect().top);
        if (Math.abs(itemTop - top) <= 2) rowEnd = item;
      });
      rowEnd.after(panel);
    };

    const openGuidePanel = (card) => {
      const index = Number(card.dataset.guideIndex || -1);
      const guide = guideData[index];
      if (!guide) return;
      const alreadyActive = activeGuideIndex === index && !panel.hidden;
      if (alreadyActive) {
        clearPanel();
        return;
      }
      activeGuideIndex = index;
      cards.forEach((item) => {
        const active = item === card;
        item.classList.toggle("active", active);
        item.querySelector("[data-guide-open]")?.setAttribute("aria-expanded", String(active));
      });
      panel.hidden = false;
      panel.innerHTML = renderGuidePanel(guide, index);
      insertPanelAfterRow(card);
      scheduleLegalTermEnhancement(panel);
      panel.querySelectorAll("[data-guide-panel-close]").forEach((button) => {
        button.addEventListener("click", clearPanel);
      });
      wireGuidePdfPanel(panel);
      panel.querySelectorAll("[data-guide-scroll-forms]").forEach((button) => {
        button.addEventListener("click", () => {
          revealAndFocus(panel.querySelector("[data-guide-pdf-panel]"), { hash: "#guide-forms", history: false });
        });
      });
      panel.querySelectorAll("[data-guide-packet-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const host = panel.querySelector("[data-guide-pdf-panel]");
          if (!host) return;
          const route = parseRouteData(host.getAttribute("data-guide-route")) || {};
          const nextRoute = {
            ...route,
            issue: button.dataset.routeIssue || route.issue || "all",
            posture: normalizeFormsPosture(button.dataset.routePosture || route.posture),
            children: normalizeFormsChildren(button.dataset.routeChildren || route.children),
            pdfPacket: button.dataset.packetId || route.pdfPacket || "",
            formConfidence: button.dataset.routeConfidence || route.formConfidence || "related",
            officialSourceUrl: button.dataset.routeSourceUrl || route.officialSourceUrl || ""
          };
          host.removeAttribute("data-guide-county-confirmed");
          host.setAttribute("data-guide-pdf-packet", nextRoute.pdfPacket || "");
          host.setAttribute("data-guide-packet-label", button.dataset.packetLabel || button.textContent?.trim() || route.packetLabel || route.guideTitle || "");
          host.setAttribute("data-guide-route", JSON.stringify(nextRoute));
          panel.querySelectorAll("[data-guide-packet-choice]").forEach((item) => {
            item.classList.toggle("active", item === button);
          });
          wireGuidePdfPanel(panel);
        });
      });
      const choiceButtons = Array.from(panel.querySelectorAll("[data-guide-next-choice]"));
      const resultPanels = Array.from(panel.querySelectorAll("[data-guide-next-result]"));
      const workspaceSections = Array.from(panel.querySelectorAll("[data-guide-panel-section]"));
      const revealGuideSection = (sectionName, shouldScroll = true) => {
        workspaceSections.forEach((section) => {
          setHiddenInert(section, section.getAttribute("data-guide-panel-section") !== sectionName);
        });
        choiceButtons.forEach((item) => {
          const active = item.getAttribute("data-guide-next-choice") === sectionName;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        const target = panel.querySelector(`[data-guide-panel-section="${sectionName}"]`);
        if (shouldScroll) requestAnimationFrame(() => revealAndFocus(target, { hash: `#guide-${sectionName}`, history: false }));
      };
      choiceButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const choice = button.getAttribute("data-guide-next-choice") || "forms";
          if (workspaceSections.length) revealGuideSection(choice);
          else {
            choiceButtons.forEach((item) => item.classList.toggle("active", item === button));
            resultPanels.forEach((item) => {
              item.hidden = item.getAttribute("data-guide-next-result") !== choice;
            });
          }
        });
      });
      if (workspaceSections.length) revealGuideSection(panel.querySelector("[data-guide-default-section]")?.getAttribute("data-guide-default-section") || "choose", false);
      requestAnimationFrame(() => {
        revealAndFocus(panel, { hash: "#guide-detail", history: false });
      });
    };

    const defaultVisibleCount = () => {
	      const width = window.innerWidth || document.documentElement.clientWidth || 1200;
	      if (width <= 520) return 6;
      if (width <= 900) return 10;
      if (width <= 1100) return 12;
      return initialServiceCount;
    };
    const filter = () => {
      const term = search.value.trim().toLowerCase();
      const activeGroup = publicCategoryIndex.get(activeCategory);
      const hasPrimaryMatch = !!term && cards.some((card) => {
        const title = card.dataset.guideTitle || "";
        const guideCategory = card.dataset.guideCategory || "";
        const guideGroup = card.dataset.guideGroupText || "";
        return title.includes(term) || guideCategory.includes(term) || guideGroup.includes(term);
      });
      const categoryActive = activeCategory !== "All situations";
      const limit = defaultVisibleCount();
      let visible = 0;
      let matchesTotal = 0;
      cards.forEach((card) => {
        const title = card.dataset.guideTitle || "";
        const guideCategory = card.dataset.guideCategory || "";
        const guideGroup = card.dataset.guideGroupText || "";
        const haystack = card.dataset.title.toLowerCase();
        const primaryMatch = title.includes(term) || guideCategory.includes(term) || guideGroup.includes(term);
        const matchesTerm = !term || (hasPrimaryMatch ? primaryMatch : haystack.includes(term));
        const matchesCat = !categoryActive || activeGroup?.has(card.dataset.category);
        let rank = 4;
        if (term && title === term) rank = 0;
        else if (term && title.startsWith(term)) rank = 1;
        else if (term && title.includes(term)) rank = 2;
        else if (term && guideCategory.includes(term)) rank = 3;
        else if (term && guideGroup.includes(term)) rank = 3;
        card.style.order = term ? String(rank) : "";
        const matches = matchesTerm && matchesCat;
        if (matches) matchesTotal += 1;
        const show = matches && (revealed || term || categoryActive || Number(card.dataset.guideIndex || 0) < limit);
        card.hidden = !show;
        if (show) {
          card.style.setProperty("--reveal-index", String(visible));
          visible += 1;
        }
      });
      if (activeGuideIndex !== null) {
        const activeCard = cards.find((card) => Number(card.dataset.guideIndex || -1) === activeGuideIndex);
        if (!activeCard || activeCard.hidden) {
          clearPanel();
        } else if (!panel.hidden) {
          insertPanelAfterRow(activeCard);
        }
      }
      if (count) {
        count.textContent = term || categoryActive
          ? categoryActive
            ? `Showing ${visible} guide${visible === 1 ? "" : "s"} for ${activeCategory}`
            : `Showing ${visible} matching DIY guide${visible === 1 ? "" : "s"}`
          : `Showing ${visible} of ${cards.length} DIY guides`;
      }
      if (note) {
        const visibleLabel = visible === 1 ? "guide" : "guides";
        note.textContent = revealed && !term && !categoryActive
          ? `Showing all ${cards.length} DIY guides. Search or choose a situation to narrow the list.`
          : categoryActive
          ? term
            ? `Showing ${visible} matching ${visibleLabel} for ${activeCategory}. Clear search to see every guide in this situation, or use Show every guide to reset the list.`
            : `Showing ${visible} ${visibleLabel} for ${activeCategory}. Use Show every guide to reset the list.`
          : term
          ? `Showing ${visible} matching ${visibleLabel}. Use Show every guide to reset the list, or choose a situation to narrow it.`
          : `Showing the first ${Math.min(limit, matchesTotal)} of ${cards.length}. Use Show all ${cards.length} guides to expand the full list.`;
      }
      if (reveal) {
        reveal.classList.toggle("revealed", revealed || !!term || categoryActive);
      }
      if (button) {
        button.textContent = categoryActive ? "Show all in this situation" : `Show all ${cards.length} guides`;
        button.setAttribute("aria-expanded", String(revealed));
        button.hidden = revealed && !term && !categoryActive;
      }
      if (clearAll) {
        clearAll.hidden = !term && !categoryActive;
      }
      categoryButtons.forEach((categoryButton) => {
        const active = categoryButton.dataset.guideCategoryFilter === activeCategory;
        categoryButton.classList.toggle("active", active);
        categoryButton.setAttribute("aria-pressed", String(active));
      });
    };
    search.addEventListener("input", filter);
    categoryButtons.forEach((categoryButton) => {
      categoryButton.addEventListener("click", () => {
        activeCategory = categoryButton.dataset.guideCategoryFilter || "All situations";
        filter();
      });
    });
    reset?.addEventListener("click", () => {
      activeCategory = "All situations";
      revealed = false;
      search.value = "";
      clearPanel();
      filter();
      search.focus();
    });
    button?.addEventListener("click", () => {
      revealed = true;
      filter();
    });
    clearAll?.addEventListener("click", () => {
      activeCategory = "All situations";
      revealed = true;
      search.value = "";
      clearPanel();
      filter();
    });
    cards.forEach((card) => {
      card.querySelector("[data-guide-open]")?.addEventListener("click", () => openGuidePanel(card));
    });
    window.addEventListener("resize", filter, { passive: true });
    filter();
  }

  function wireGuidePdfPanel(panel) {
    const host = panel.querySelector("[data-guide-pdf-panel]");
    if (!host) return;
    const packetId = host.getAttribute("data-guide-pdf-packet") || "";
    const guideTitle = host.getAttribute("data-guide-title") || "this guide";
    const calculatorChoice = host.getAttribute("data-guide-calculator-choice") || "";
    const formsRoute = parseRouteData(host.getAttribute("data-guide-route")) || {};
    const formConfidence = formsRoute.formConfidence || "related";
    const packetLabel = host.getAttribute("data-guide-packet-label") || guideTitle;
    const packetSummary = formsRoute.formConfidence || "related";
    const packetHint = formsRoute.formConfidence === "no-verified-form" || formsRoute.formConfidence === "intake-required"
      ? "No verified issue-specific packet is opened from this card before review."
      : packetId && packetId !== "all"
        ? `Recommended packet: ${packetLabel}.`
        : "No packet is selected yet.";
    const packetCopy = formsRoute.formConfidence === "statewide-generic"
      ? "This is a statewide form path. Continue to the form questions to review the packet and narrow by county if needed."
      : formsRoute.formConfidence === "related-only"
        ? "This guide points to related forms only. Continue to compare packet titles before opening anything."
        : formsRoute.formConfidence === "no-verified-form" || formsRoute.formConfidence === "intake-required"
          ? "Answer the checks first. If no verified packet fits, use office review instead of guessing with another family-law packet."
        : "Continue to the form-check questions. The result appears only after the required answers are known.";
    const bridgeCta = formsRoute.formConfidence === "no-verified-form" || formsRoute.formConfidence === "intake-required"
      ? "Check form availability"
      : "Answer questions to find forms";

    host.innerHTML = `
      <div class="guide-forms-viewer-head guide-forms-bridge-head">
        <div>
          <span>${esc(formConfidenceLabel(packetSummary))}</span>
          <strong>${esc(packetLabel)}</strong>
          <p>${esc(packetHint)} ${esc(packetCopy)}</p>
        </div>
        <a class="button primary" href="/tools#forms-task-workspace" data-link data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>${esc(bridgeCta)}</a>
      </div>
      <div class="guide-forms-bridge-grid">
        <article>
          <span>County</span>
          <strong>${esc(displayFormsCounty(formsRoute.county))}</strong>
        </article>
	        <article>
	          <span>Issue</span>
	          <strong>${esc(publicIssueLabelForRoute(formsRoute))}</strong>
	        </article>
        <article>
          <span>Case stage</span>
          <strong>${esc(displayFormsPosture(formsRoute.posture))}</strong>
        </article>
        <article>
          <span>Children</span>
          <strong>${esc(displayFormsChildren(formsRoute.children))}</strong>
        </article>
      </div>
      <p class="guide-forms-bridge-note">The selected guide only suggests the issue. Answer the form questions before opening a packet or PDF viewer.</p>
    `;
    scheduleLegalTermEnhancement(host);
  }

	  function wireServiceTools() {
	    const button = document.querySelector("[data-service-reveal]");
	    const search = document.querySelector("[data-service-search]");
	    const count = document.querySelector("[data-service-count]");
	    const cards = Array.from(document.querySelectorAll("[data-service-card]"));
	    const categoryButtons = Array.from(document.querySelectorAll("[data-service-category-filter]"));
	    const reset = document.querySelector("[data-service-category-reset]");
	    const emptyState = document.querySelector("[data-service-empty]");
	    const emptyReset = document.querySelector("[data-service-empty-reset]");
	    const reveal = document.querySelector(".service-reveal");
	    const note = document.querySelector("[data-service-note]");
	    if (!cards.length) return;
	
	    let revealed = false;
	    let activeCategory = "All situations";
	    let activeServiceIndex = null;
	    const serviceData = serviceItems.map(serviceViewModelForItem);
	    const panel = document.createElement("div");
	    panel.className = "guide-row-panel service-row-panel";
	    panel.hidden = true;

	    const setServiceToggleState = (card, active) => {
	      const toggle = card.querySelector("[data-service-detail-toggle]");
	      card.classList.toggle("is-expanded", active);
	      if (!toggle) return;
	      toggle.setAttribute("aria-expanded", String(active));
	      toggle.textContent = active ? "Selected issue" : "Choose this issue";
	    };
	
	    const clearServicePanel = () => {
	      activeServiceIndex = null;
	      panel.hidden = true;
	      panel.innerHTML = "";
	      if (panel.parentElement) panel.remove();
	      cards.forEach((card) => {
	        setServiceToggleState(card, false);
	      });
	    };
	
	    const insertServicePanelAfterRow = (card) => {
	      const visibleCards = cards.filter((item) => !item.hidden);
	      const top = Math.round(card.getBoundingClientRect().top);
	      let rowEnd = card;
	      visibleCards.forEach((item) => {
	        const itemTop = Math.round(item.getBoundingClientRect().top);
	        if (Math.abs(itemTop - top) <= 2) rowEnd = item;
	      });
	      rowEnd.after(panel);
	    };
	
	    const openServicePanel = (card) => {
	      const index = Number(card.dataset.serviceIndex || -1);
	      const item = serviceData[index];
	      if (!item) return;
	      const alreadyActive = activeServiceIndex === index && !panel.hidden;
	      if (alreadyActive) {
	        clearServicePanel();
	        return;
	      }
	      activeServiceIndex = index;
	      cards.forEach((candidate) => {
	        const active = candidate === card;
	        setServiceToggleState(candidate, active);
	      });
	      panel.hidden = false;
	      panel.innerHTML = renderServicePanel(item);
	      insertServicePanelAfterRow(card);
	      scheduleLegalTermEnhancement(panel);
      panel.querySelectorAll("[data-service-panel-close]").forEach((button) => {
        button.addEventListener("click", clearServicePanel);
      });
      wireGuidePdfPanel(panel);
      const revealServiceSection = (sectionName, shouldScroll = true) => {
        const sections = Array.from(panel.querySelectorAll("[data-service-panel-section]"));
        sections.forEach((section) => {
          setHiddenInert(section, section.getAttribute("data-service-panel-section") !== sectionName);
        });
        panel.querySelectorAll("[data-service-action]").forEach((button) => {
          const active = button.getAttribute("data-service-action") === sectionName;
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        const target = panel.querySelector(`[data-service-panel-section="${sectionName}"]`);
        if (sectionName === "calculator") {
          target?.setAttribute("open", "");
        }
        if (shouldScroll) {
          requestAnimationFrame(() => {
            revealAndFocus(target, { hash: `#practice-${sectionName}`, history: false });
          });
        }
      };
      panel.querySelectorAll("[data-service-action]").forEach((button) => {
        button.addEventListener("click", () => {
          revealServiceSection(button.getAttribute("data-service-action") || "forms");
        });
      });
      panel.querySelectorAll("[data-guide-scroll-forms]").forEach((button) => {
        button.addEventListener("click", () => {
          revealServiceSection("forms", false);
          revealAndFocus(panel.querySelector("[data-guide-pdf-panel]"), { hash: "#practice-forms", history: false });
        });
      });
      panel.querySelectorAll("[data-guide-packet-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const host = panel.querySelector("[data-guide-pdf-panel]");
          if (!host) return;
          const route = parseRouteData(host.getAttribute("data-guide-route")) || {};
          const nextRoute = {
            ...route,
            issue: button.dataset.routeIssue || route.issue || "all",
            posture: normalizeFormsPosture(button.dataset.routePosture || route.posture),
            children: normalizeFormsChildren(button.dataset.routeChildren || route.children),
            pdfPacket: button.dataset.packetId || route.pdfPacket || "",
            formConfidence: button.dataset.routeConfidence || route.formConfidence || "related",
            officialSourceUrl: button.dataset.routeSourceUrl || route.officialSourceUrl || ""
          };
          host.removeAttribute("data-guide-county-confirmed");
          host.setAttribute("data-guide-pdf-packet", nextRoute.pdfPacket || "");
          host.setAttribute("data-guide-packet-label", button.dataset.packetLabel || button.textContent?.trim() || route.packetLabel || route.guideTitle || "");
          host.setAttribute("data-guide-route", JSON.stringify(nextRoute));
          panel.querySelectorAll("[data-guide-packet-choice]").forEach((item) => {
            item.classList.toggle("active", item === button);
          });
          wireGuidePdfPanel(panel);
        });
      });
      revealServiceSection(panel.querySelector("[data-service-default-section]")?.getAttribute("data-service-default-section") || item.primaryAction || "forms", false);
      revealAndFocus(panel, { hash: "#practice-issue-detail", history: false });
    };
	
	    const defaultVisibleCount = () => {
	      const width = window.innerWidth || document.documentElement.clientWidth || 1200;
		      if (width <= 520) return 6;
	      if (width <= 900) return 10;
	      if (width <= 1100) return 12;
	      return initialServiceCount;
	    };
	    const update = (commitOptions = {}) => {
	      const term = (search?.value || "").trim().toLowerCase();
		      const activeGroup = publicCategoryIndex.get(activeCategory);
		      const categoryActive = activeCategory !== "All situations";
	      const limit = defaultVisibleCount();
	      let visible = 0;
	      let matchesTotal = 0;
	      const hasPrimaryMatch = !!term && cards.some((card) => {
	        const title = card.dataset.serviceTitle || "";
		        const category = card.dataset.serviceCategoryText || "";
		        const group = card.dataset.serviceGroupText || "";
		        return title.includes(term) || category.includes(term) || group.includes(term);
	      });
	
	      cards.forEach((card, index) => {
	        const title = card.dataset.serviceTitle || "";
	        const category = card.dataset.serviceCategoryText || "";
	        const haystack = card.dataset.serviceText || "";
		        const group = card.dataset.serviceGroupText || "";
		        const primaryMatch = title.includes(term) || category.includes(term) || group.includes(term);
		        const matchesTerm = !term || (hasPrimaryMatch ? primaryMatch : haystack.includes(term));
		        const matchesCategory = !categoryActive || activeGroup?.has(card.dataset.serviceCategory);
	        const matches = matchesTerm && matchesCategory;
	        let rank = 4;
	        if (term && title === term) rank = 0;
	        else if (term && title.startsWith(term)) rank = 1;
	        else if (term && title.includes(term)) rank = 2;
		        else if (term && category.includes(term)) rank = 3;
		        else if (term && group.includes(term)) rank = 3;
	        card.style.order = term ? String(rank) : "";
	        if (matches) matchesTotal += 1;
	        const show = matches && (revealed || term || categoryActive || index < limit);
	        card.hidden = !show;
		        if (show) {
		          card.style.setProperty("--reveal-index", String(visible));
		          visible += 1;
		        }
		      });
	      if (activeServiceIndex !== null) {
	        const activeCard = cards.find((card) => Number(card.dataset.serviceIndex || -1) === activeServiceIndex);
	        if (!activeCard || activeCard.hidden) {
	          clearServicePanel();
	        } else if (!panel.hidden) {
	          insertServicePanelAfterRow(activeCard);
	        }
	      }
		
	      if (count) {
		        const label = categoryActive ? `${activeCategory} issue path${visible === 1 ? "" : "s"}` : `issue path${visible === 1 ? "" : "s"}`;
	        count.textContent = term || categoryActive
	          ? `Showing ${visible} matching ${label}`
	          : `Showing ${visible} of ${cards.length} issue paths`;
	      }

	      const filtered = !!term || categoryActive;
	      if (note) {
	        const remaining = Math.max(cards.length - limit, 0);
	        note.textContent = revealed && !filtered
		          ? `Showing all ${cards.length} issue paths. Search any topic or choose a situation to narrow the list. Some issues may need a different professional or closer review before forms are used.`
		          : `Showing the first ${Math.min(limit, matchesTotal)} issue paths for this screen. Search any topic, browse a situation, or reveal the remaining ${remaining}. Some issues may need a different professional or closer review before forms are used.`;
	      }
	
	      if (reveal) {
	        reveal.hidden = filtered || cards.length <= limit;
	        reveal.classList.toggle("revealed", revealed && !filtered);
	      }
	      if (button) {
	        const expanded = revealed && !filtered;
	        button.textContent = expanded ? "Show Starting Pathways" : "View All Family Law Pathways";
	        button.setAttribute("aria-expanded", String(expanded));
	      }

	      if (emptyState) {
	        emptyState.hidden = visible !== 0;
	      }

	      categoryButtons.forEach((categoryButton) => {
	        const active = categoryButton.dataset.serviceCategoryFilter === activeCategory;
	        categoryButton.classList.toggle("active", active);
	        categoryButton.setAttribute("aria-pressed", String(active));
	      });
	    };
	
	    search?.addEventListener("input", update);
	    categoryButtons.forEach((categoryButton) => {
	      categoryButton.addEventListener("click", () => {
	        activeCategory = categoryButton.dataset.serviceCategoryFilter || "All situations";
	        update();
	      });
	    });
	    const resetServiceFilters = (shouldFocusSearch = false) => {
	      activeCategory = "All situations";
	      revealed = false;
	      clearServicePanel();
	      if (search) {
	        search.value = "";
	        if (shouldFocusSearch) search.focus();
	      }
	      update();
	      window.requestAnimationFrame(() => {
	        revealAndFocus(document.querySelector("[data-service-tools]"), { hash: "#practice-tools", history: false });
	      });
	    };
	    reset?.addEventListener("click", () => {
	      resetServiceFilters(true);
	    });
	    emptyReset?.addEventListener("click", () => {
	      resetServiceFilters(true);
	    });
	    button?.addEventListener("click", () => {
	      revealed = !revealed;
	      update();
	      window.requestAnimationFrame(() => {
	        revealAndFocus(document.querySelector("[data-service-list]"), { hash: "#practice-issues", history: false });
	      });
	    });
	    cards.forEach((card) => {
	      card.querySelector("[data-service-detail-toggle]")?.addEventListener("click", () => openServicePanel(card));
	    });
	    window.addEventListener("resize", update, { passive: true });
	    update();
	  }

	  function wireServiceMethodCarousel() {
	    const carousel = document.querySelector("[data-service-method-carousel]");
	    const grid = document.querySelector("[data-service-method-grid]");
	    const prev = document.querySelector("[data-service-method-prev]");
	    const next = document.querySelector("[data-service-method-next]");
	    const status = document.querySelector("[data-service-method-status]");
	    const methods = Array.from(document.querySelectorAll(".service-method"));
	    if (!carousel || !grid || !methods.length) return;

	    const indexFromScroll = () => {
	      const left = grid.scrollLeft;
	      let activeIndex = 0;
	      let bestDistance = Number.POSITIVE_INFINITY;
	      methods.forEach((method, index) => {
	        const distance = Math.abs(method.offsetLeft - left);
	        if (distance < bestDistance) {
	          bestDistance = distance;
	          activeIndex = index;
	        }
	      });
	      return activeIndex;
	    };

	    const update = () => {
	      const activeIndex = indexFromScroll();
	      const isScrollable = grid.scrollWidth > grid.clientWidth + 4;
	      const activeTitle = methods[activeIndex]?.querySelector("strong")?.textContent?.trim() || `path ${activeIndex + 1}`;
	      carousel.classList.toggle("is-scrollable", isScrollable);
	      if (status) status.textContent = `Path ${activeIndex + 1} of ${methods.length}: ${activeTitle}`;
	      if (prev) prev.disabled = !isScrollable || activeIndex <= 0;
	      if (next) next.disabled = !isScrollable || activeIndex >= methods.length - 1;
	      methods.forEach((method, index) => {
	        if (index === activeIndex) method.setAttribute("aria-current", "true");
	        else method.removeAttribute("aria-current");
	      });
	    };

	    const move = (direction) => {
	      const activeIndex = indexFromScroll();
	      const nextIndex = Math.max(0, Math.min(methods.length - 1, activeIndex + direction));
	      methods[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
	      window.setTimeout(update, 260);
	    };

	    prev?.addEventListener("click", () => move(-1));
	    next?.addEventListener("click", () => move(1));
	    grid.addEventListener("scroll", update, { passive: true });
	    window.addEventListener("resize", update, { passive: true });
	    update();
	  }

  function wireFaqTools() {
    const search = document.querySelector("[data-faq-search]");
    const cards = Array.from(document.querySelectorAll("[data-faq-item]"));
    const categoryButtons = Array.from(document.querySelectorAll("[data-faq-filter]"));
    const count = document.querySelector("[data-faq-count]");
    const reveal = document.querySelector(".faq-reveal");
    const revealButton = document.querySelector("[data-faq-reveal]");
    const note = document.querySelector("[data-faq-note]");
    if (!cards.length) return;

    let activeCategory = "All";
    let revealed = false;
    const defaultVisibleCount = () => {
      const width = window.innerWidth || document.documentElement.clientWidth || 1200;
      if (width <= 520) return 10;
      if (width <= 900) return 14;
      return 16;
    };
    const update = () => {
      const term = (search?.value || "").trim().toLowerCase();
      const categoryActive = activeCategory !== "All";
      const limit = defaultVisibleCount();
      let visible = 0;
      let matchesTotal = 0;
      cards.forEach((card, index) => {
        const matchesTerm = !term || (card.dataset.faqText || "").includes(term);
        const matchesCategory = !categoryActive || card.dataset.faqCategory === activeCategory;
        const matches = matchesTerm && matchesCategory;
        if (matches) matchesTotal += 1;
        const show = matches && (revealed || term || categoryActive || index < limit);
        card.hidden = !show;
        if (show) {
          card.style.setProperty("--reveal-index", String(visible));
          visible += 1;
        } else if (card.open) {
          card.open = false;
        }
      });

      categoryButtons.forEach((button) => {
        const active = button.dataset.faqFilter === activeCategory;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      if (count) {
        const label = activeCategory === "All" ? "FAQ" : `${activeCategory} FAQ`;
        count.textContent = term || categoryActive
          ? `Showing ${visible} matching ${label}${visible === 1 ? "" : "s"}`
          : `Showing ${visible} of ${cards.length} FAQs`;
      }
      if (note) {
        const remaining = Math.max(cards.length - limit, 0);
        note.textContent = revealed
          ? `Showing all ${cards.length} FAQs. Search or choose a category to narrow the list.`
          : `Showing the first ${Math.min(limit, matchesTotal)} FAQs for this screen. Search any topic, choose a category, or reveal the remaining ${remaining}.`;
      }
      reveal?.classList.toggle("revealed", revealed || !!term || categoryActive);
    };

    search?.addEventListener("input", update);
    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.faqFilter || "All";
        update();
      });
    });
    revealButton?.addEventListener("click", () => {
      revealed = true;
      update();
    });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function wireFormsRouter() {
    const router = document.querySelector(".forms-router");
    if (!router) return;
    const county = router.querySelector("[data-form-county]");
    const issue = router.querySelector("[data-form-issue]");
    const posture = router.querySelector("[data-form-posture]");
    const children = router.querySelector("[data-form-children]");
    const reset = router.querySelector("[data-form-reset]");
    const status = router.querySelector("[data-form-status]");
    const cards = Array.from(router.querySelectorAll("[data-form-resource]"));
    const routeSave = router.querySelector("[data-form-route-save]");
    const decisionPrimary = router.querySelector("[data-form-route-decision-primary]");
    const presetRoute = window.MFLGLatestFormsRoute || storedFormsRoute();
    if (presetRoute) {
      if (county && Array.from(county.options).some((option) => option.value === presetRoute.county)) county.value = presetRoute.county;
      const presetIssue = normalizeFormsIssue(presetRoute.issue);
      if (issue && Array.from(issue.options).some((option) => option.value === presetIssue)) issue.value = presetIssue;
      if (posture && Array.from(posture.options).some((option) => option.value === presetRoute.posture)) posture.value = presetRoute.posture;
      if (children && Array.from(children.options).some((option) => option.value === presetRoute.children)) children.value = presetRoute.children;
    }

    const update = (commitOptions = {}) => {
      const countyValue = normalizeFormsCounty(county?.value);
      const issueValue = normalizeFormsIssue(issue?.value || "all");
      const postureValue = normalizeFormsPosture(posture?.value);
      const childrenValue = normalizeFormsChildren(children?.value);
      let visible = 0;
      const visibleResources = [];

      cards.forEach((card) => {
        const cardCounty = card.dataset.county || "";
        const cardIssues = ` ${card.dataset.issues || ""} `;
        const cardPosture = card.dataset.posture || "";
        const countyMatch = countyValue === "Not sure" || cardCounty === "Statewide" || cardCounty === countyValue;
        const issueMatch = issueValue === "all" || cardIssues.includes(` ${issueValue} `) || cardIssues.includes(" all ");
        const postureMatch = postureValue === "Any posture" || cardPosture === "Any posture" || cardPosture === postureValue;
        const show = countyMatch && issueMatch && postureMatch;
        card.hidden = !show;
        card.open = Boolean(show && visible === 0);
        if (show) {
          visibleResources.push({
            title: card.dataset.title || "",
            status: card.dataset.status || "",
            url: card.dataset.url || ""
          });
          visible += 1;
        }
      });

      if (status) {
          status.textContent = visible
          ? `${visible} reviewed form path${visible === 1 ? "" : "s"} match your answers.`
          : "No clear form match yet. Use the statewide source or start Guided Intake.";
      }
      const routeDetail = {
        county: countyValue,
        issue: issueValue,
        posture: postureValue,
        children: childrenValue,
        pdfPacket: pdfPacketForFormsRoute(countyValue, issueValue, postureValue, childrenValue),
        expandPdfGroup: presetRoute?.expandPdfGroup === true || pdfPacketForFormsRoute(countyValue, issueValue, postureValue, childrenValue) !== "all",
        focusPacketBuilder: presetRoute?.focusPacketBuilder === true || pdfPacketForFormsRoute(countyValue, issueValue, postureValue, childrenValue) !== "all",
        fromGuide: presetRoute?.fromGuide || ""
      };
      window.MFLGLatestFormsRoute = routeDetail;
	      rememberFormsQualifierAnswers(routeDetail, { calculatorChoice: presetRoute?.calculatorChoice || "", publicAnswerOptions: commitOptions });
      const decision = formsRouteDecisionFor(routeDetail, visibleResources);
      setFormsDecisionPanel(router, decision);
      const packetMeta = pdfPacketDecisionMeta[routeDetail.pdfPacket] || {};
      setUnifiedFormsResult({
        decision,
        packetLabel: packetMeta.label || "",
        packetHref: routeDetail.pdfPacket && routeDetail.pdfPacket !== "all" ? "#forms-packet-builder" : "#forms-packets"
      });
      routeSave?.setAttribute("data-intake-route", JSON.stringify(decision.route || guideFallbackRoute()));
      window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: routeDetail }));
    };

	    county?.addEventListener("change", () => update({ userAction: true, confirmed: true, confirmedFields: ["county"], source: "forms-router" }));
	    issue?.addEventListener("change", () => update({ userAction: true, confirmed: true, confirmedFields: ["issue"], source: "forms-router" }));
	    posture?.addEventListener("change", () => update({ userAction: true, confirmed: true, confirmedFields: ["posture"], source: "forms-router" }));
	    children?.addEventListener("change", () => update({ userAction: true, confirmed: true, confirmedFields: ["children"], source: "forms-router" }));
    decisionPrimary?.addEventListener("click", () => {
      const packetId = decisionPrimary.dataset.formRouteDecisionPacket || "";
      if (!packetId || packetId === "all") return;
	      window.MFLGLatestFormsRoute = {
	        ...(window.MFLGLatestFormsRoute || {}),
	        pdfPacket: packetId,
	        expandPdfGroup: true,
	        focusPacketBuilder: true
	      };
	      storeFormsRoute(window.MFLGLatestFormsRoute, presetRoute?.calculatorChoice || "", { userAction: true, confirmed: true, confirmedFields: ["selectedPacket"], source: "forms-router-packet" });
	      window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: window.MFLGLatestFormsRoute }));
	    });
    reset?.addEventListener("click", () => {
      if (county) county.value = "Not sure";
      if (issue) issue.value = "all";
      if (posture) posture.value = "Any posture";
      if (children) children.value = "any";
      update({ explicitReset: true, reset: true, resetFields: ["county", "issue", "posture", "children", "selectedPacket"], source: "forms-router-reset" });
	    });
    update();
  }

  async function wireFormsToolsActionPlan() {
    const host = document.querySelector("[data-forms-tools-action-plan]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-action-plan.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const steps = Array.isArray(manifest.steps) ? manifest.steps : [];
      const route = {
        routeKey: "forms-tools-action-plan",
        entrySource: "Forms & Tools",
        entryLabel: "Forms & Tools action plan",
        issuePathway: "Forms & Tools",
        issueDetail: "Official sources / reviewed routes / calculator readiness",
        serviceInterest: "",
        contextNote: "Public Forms & Tools action plan only. Only safe source, county, form, packet, and calculator details should carry forward before conflict and scope review.",
        presetAnswers: {
          formsToolsActionPlan: "Use on-page reviewed forms first; use reviewed routes when available; use calculator guidance without entering private facts.",
          sourceType: "Forms & Tools action plan / public planning"
        }
      };

      host.innerHTML = `
        <div class="forms-action-plan-head">
          <div>
            <span>Advanced details</span>
            <strong>Forms and calculator sources are monitored before they are shown.</strong>
            <p>${esc(manifest.public_message || "Use the guided choices first. These details are here only if you want to understand how this page stays current.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-forms-action-plan-intake>Start Guided Intake</a>
        </div>
        <details class="forms-advanced-details">
          <summary>Show source and maintenance details</summary>
          <div class="forms-action-plan-metrics">
            <article><span>Reviewed paths</span><strong>${esc(String(summary.reviewed_routes || 0))}</strong></article>
            <article><span>Court PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
            <article><span>Calculator sources</span><strong>${esc(String(summary.official_formula_sources_ok || 0))}</strong></article>
            <article><span>On-page tools</span><strong>${summary.official_embeds_enabled ? "Available" : "Reviewing"}</strong></article>
          </div>
          <div class="forms-action-plan-steps">
            ${steps.map((step) => `<article>
              <span>${esc(step.status || "Step")}</span>
              <strong>${esc(step.label || "")}</strong>
              <p>${esc(step.guidance || "")}</p>
              <small>${esc(step.metric || "")}</small>
            </article>`).join("")}
          </div>
        </details>
      `;
      host.querySelector("[data-forms-action-plan-intake]")?.setAttribute("data-intake-route", JSON.stringify(route));
    } catch (error) {
      host.innerHTML = `
        <div class="forms-action-plan-head">
          <div>
            <span>Action plan</span>
            <strong>Forms & Tools action plan could not load.</strong>
            <p>Use on-page forms and Guided Intake while the action-plan summary is unavailable.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireFormsToolsReviewRoadmap() {
    const host = document.querySelector("[data-forms-tools-review-roadmap]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-review-roadmap.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const items = Array.isArray(manifest.items) ? manifest.items : [];
      const route = {
        routeKey: "forms-tools-review-roadmap",
        entrySource: "Forms & Tools",
        entryLabel: "Forms & Tools review roadmap",
        issuePathway: "Forms & Tools",
        issueDetail: "Public review status / source-only limits",
        serviceInterest: "",
        contextNote: "Using your Forms & Tools review status. Source-only limits were saved on this site; no sensitive facts were collected.",
        presetAnswers: {
          formsToolsReviewRoadmap: "Use the on-page forms first; anything unclear should be confirmed through Guided Intake before relying on it.",
          sourceType: "Forms & Tools review roadmap / public planning"
        }
      };

      host.innerHTML = `
        <div class="forms-review-roadmap-head">
          <div>
            <span>Advanced details</span>
            <strong>Some court resources are available here; others stay behind Guided Intake.</strong>
            <p>${esc(manifest.public_message || "Use the recommended forms first. Items that need review stay out of the main path.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-forms-review-roadmap-intake>Start Guided Intake</a>
        </div>
        <details class="forms-advanced-details">
          <summary>Show court-source coverage details</summary>
          <div class="forms-review-roadmap-metrics">
            <article><span>Packet pages</span><strong>${esc(String(summary.public_packet_page_actions || 0))}</strong></article>
            <article><span>Needs review</span><strong>${esc(String(summary.packet_candidates_review_only || 0))}</strong></article>
            <article><span>Court PDFs</span><strong>${esc(String(summary.public_pdf_actions || 0))}</strong></article>
            <article><span>County source pages</span><strong>${esc(String(summary.county_source_only || 0))}</strong></article>
          </div>
          <div class="forms-review-roadmap-grid">
            ${items.map((item) => `<article>
              <span>${esc(item.status || "Status")}</span>
              <strong>${esc(item.label || "")}</strong>
              <p>${esc(item.guidance || "")}</p>
              <small>${esc(String(item.count ?? ""))}</small>
            </article>`).join("")}
          </div>
        </details>
      `;
      host.querySelector("[data-forms-review-roadmap-intake]")?.setAttribute("data-intake-route", JSON.stringify(route));
    } catch (error) {
      host.innerHTML = `
        <div class="forms-review-roadmap-head">
          <div>
            <span>Review roadmap</span>
            <strong>Public review roadmap could not load.</strong>
            <p>Use on-page forms and Guided Intake while review status is unavailable.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireFormsToolsMaintenanceStatus() {
    const host = document.querySelector("[data-forms-tools-maintenance-status]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-maintenance-status.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const controls = Array.isArray(manifest.controls) ? manifest.controls : [];
      const checked = manifest.checked_at ? new Date(manifest.checked_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }) : "Recently checked";
      const route = {
        routeKey: "forms-tools-maintenance-status",
        entrySource: "Forms & Tools",
        entryLabel: "Forms & Tools form safety status",
        issuePathway: "Forms & Tools",
        issueDetail: "Official-source checks / safe form access",
        serviceInterest: "",
        contextNote: "Using your Forms & Tools source-safety status. Safe-access status was saved on this site; no sensitive facts were collected.",
        presetAnswers: {
          formsToolsMaintenanceStatus: "Official court source and safe form-access status reviewed in public planning.",
          sourceType: "Forms & Tools form safety / public planning"
        }
      };

      host.innerHTML = `
        <div class="forms-maintenance-head">
          <div>
            <span>Advanced details</span>
            <strong>Official court links are checked before they are shown.</strong>
            <p>Use the reviewed PDF viewer and download buttons shown above. If anything looks wrong or does not match your situation, start Guided Intake.</p>
            <small>Last checked: ${esc(checked)}</small>
          </div>
          <a class="button outline" href="/start" data-link data-forms-maintenance-intake>Start Guided Intake to confirm</a>
        </div>
        <details class="forms-advanced-details">
          <summary>Show form safety details</summary>
          <div class="forms-maintenance-metrics">
            <article><span>Court sources</span><strong>${esc(String(summary.official_sources_ok || 0))}/${esc(String(summary.official_sources_checked || 0))} checked</strong></article>
            <article><span>Reviewed paths</span><strong>${esc(String(summary.reviewed_routes || 0))}</strong></article>
            <article><span>Still reviewing</span><strong>${esc(String(summary.review_only_candidates || 0))}</strong></article>
            <article><span>Site downloads</span><strong>${summary.direct_cached_downloads_enabled ? "Available" : "Controlled"}</strong></article>
          </div>
          <div class="forms-maintenance-grid">
            ${controls.map((control) => `<article>
              <span>${esc(control.status || "Status")}</span>
              <strong>${esc(control.label || "")}</strong>
              <p>${esc(control.detail || "")}</p>
            </article>`).join("")}
          </div>
        </details>
      `;
      host.querySelector("[data-forms-maintenance-intake]")?.setAttribute("data-intake-route", JSON.stringify(route));
    } catch (error) {
      host.innerHTML = `
        <div class="forms-maintenance-head">
          <div>
            <span>Form safety</span>
            <strong>Form safety status could not load.</strong>
            <p>Use on-page forms and Guided Intake while source status is unavailable.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireFormDownloadReadiness() {
    const host = document.querySelector("[data-form-download-readiness]");
    if (!host) return;
    try {
      const response = await fetch(`/data/form-download-readiness.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const groups = Array.isArray(manifest.packet_groups) ? manifest.packet_groups : [];
      const files = Array.isArray(manifest.files) ? manifest.files : [];
      const defaultPacketId = "all";
      const defaultLanguage = files.some((file) => file.language === "English") ? "English" : "all";
      const childOnlyPattern = /parenting|legal decision-making|child support|paternity/i;
      const isChildOnlyPacketFile = (file) => childOnlyPattern.test(`${file.public_name || ""} ${file.public_stage || ""} ${file.file_name || ""}`);
      const packetFilePurpose = (file) => {
        const text = `${file.public_stage || ""} ${file.public_name || ""} ${file.file_name || ""}`.toLowerCase();
        if (/before you file|process/.test(text)) {
          return "Read this first so you understand the filing path, timing, and what the court expects before you complete forms.";
        }
        if (/sensitive data|cover sheet/.test(text)) {
          return "Use this cover sheet for private identifying information the court needs, while keeping that information out of public-facing documents.";
        }
        if (/petition/.test(text)) {
          return "This starts the request with the court. Review it carefully before filing because it frames what you are asking the court to do.";
        }
        if (/parenting plan/.test(text)) {
          return "Use this to organize proposed parenting-time, decision-making, exchange, holiday, and child-related terms.";
        }
        if (/parenting time|legal decision-making|order form/.test(text)) {
          return "Use this for the child-related orders the court may enter after reviewing the requested parenting terms.";
        }
        if (/consent|decree|agreement/.test(text)) {
          return "Use this when final terms are agreed and the paperwork needs to match the agreement before court review.";
        }
        if (/child support|worksheet/.test(text)) {
          return "Use this to connect support-related information to the official court process. Do not guess at numbers if the calculation is unclear.";
        }
        if (/service|serve|summons/.test(text)) {
          return "Use this to understand notice and service steps. The other side usually must receive proper notice before the case can move forward.";
        }
        return "Review this form in sequence with the packet. If the title does not match your situation, use Intake before relying on it.";
      };
      const route = {
        routeKey: "forms-download-readiness",
        entrySource: "Forms & Tools",
        entryLabel: "Form download safety check",
        issuePathway: "Forms & Tools",
        issueDetail: "Official PDFs available / site downloads enabled",
        serviceInterest: "",
        contextNote: "Public Forms & Tools download-safety route only. No form inputs, uploads, or sensitive facts were collected.",
        presetAnswers: {
          officialPdfActions: String(summary.official_pdf_actions || 0),
          hostedDownloadsEnabled: summary.hosted_downloads_enabled ? "yes" : "no",
          sourceType: "Forms & Tools download safety / public planning"
        }
      };

      host.innerHTML = `
        <div class="forms-download-head">
          <div>
            <span>Forms</span>
            <strong>Open reviewed court forms here.</strong>
            <p>Choose the form group that fits, open the forms in order, and keep the packet on-site.</p>
          </div>
        </div>
        <div class="forms-packet-builder" id="forms-packet-builder" data-forms-packet-builder>
          <div class="forms-packet-print-title" data-forms-packet-print-title>
            <span>Printable form checklist</span>
            <strong>MY FAMILY LAW GROUP PLLC</strong>
            <p>Use this checklist to track which official court PDFs you opened or reviewed. Do not write private facts, case numbers, or financial information on this page.</p>
          </div>
          <div class="forms-packet-builder-head">
            <div>
              <span>Build your form checklist</span>
              <strong>Choose one form group, then open the forms in order.</strong>
              <p>Open each form here first so you can keep your place. Use the viewer to stay on the packet and keep your place.</p>
            </div>
          </div>
          <div class="forms-packet-change-note" data-forms-packet-change-note hidden>
            <strong>Form list updated.</strong>
            <span>Visible forms changed. Checks from other form groups stay saved in this browser tab.</span>
          </div>
          <div class="forms-packet-fit" data-forms-packet-fit aria-live="polite">
            <article>
              <span>Best fit</span>
              <strong data-forms-packet-fit-title>Choose a form group above.</strong>
              <p data-forms-packet-fit-copy>The page will explain who the selected form group is usually for before you open forms.</p>
            </article>
            <article>
              <span>Confirm first</span>
              <strong data-forms-packet-fit-check>Do not guess if the title does not match.</strong>
              <p data-forms-packet-fit-check-copy>Choose a different packet if the title does not match the county, children, filing stage, or posture you need.</p>
            </article>
            <article>
              <span>Safe next step</span>
              <strong data-forms-packet-fit-next>Open the forms in order.</strong>
              <p data-forms-packet-fit-next-copy>Start with instructions, then use the checklist so you can track what you reviewed in this browser tab.</p>
            </article>
          </div>
          <div class="forms-packet-checklist-bar" data-forms-packet-checklist-bar>
            <p class="forms-packet-builder-status" data-forms-packet-status>Forms are ready.</p>
            <div class="forms-packet-primary-actions">
              <span data-forms-packet-progress>0 of 0 checked</span>
              <button class="button primary" type="button" data-forms-packet-next>Open next unchecked</button>
              <button class="button outline forms-packet-resume" type="button" data-forms-packet-resume hidden>Resume where you left off</button>
            </div>
            <div class="forms-packet-checklist-actions" aria-label="Form checklist utilities">
              <button class="button ghost" type="button" data-forms-packet-clear>Clear checks</button>
              <button class="button ghost" type="button" data-forms-packet-copy>Copy checklist</button>
              <button class="button outline" type="button" data-forms-packet-print>Print checklist</button>
            </div>
            <em data-forms-packet-next-status>Start with the first unchecked form.</em>
            <div class="forms-packet-state" data-forms-packet-state>
              <span data-forms-packet-state-label>Ready to start</span>
              <strong data-forms-packet-state-title>Open the first form when you are ready.</strong>
              <p data-forms-packet-state-copy>The checklist will update in this browser tab as you review each visible form.</p>
            </div>
            <small>Checks are saved only in this browser tab and are not sent to the office.</small>
          </div>
          <details class="forms-packet-browser" data-forms-packet-browser>
            <summary>
              <span>Other form groups</span>
              <strong>Browse other form groups</strong>
              <p>Use this only if the recommended forms do not fit your county, stage, children, or agreement status.</p>
            </summary>
            <div class="forms-packet-builder-controls">
              <label>Form group
                <select data-forms-packet-select>
                  <option value="all" selected>Choose after the helper matches forms</option>
                  ${groups.map((group) => `<option value="${esc(group.packet_id || "all")}">${esc(group.label || "Court form group")}</option>`).join("")}
                </select>
              </label>
              <label>Language
                <select data-forms-packet-language>
                  <option value="English"${defaultLanguage === "English" ? " selected" : ""}>English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="all">All languages</option>
                </select>
              </label>
            </div>
            <div class="forms-packet-builder-path" aria-label="Form group browsing sequence">
              <article><span>01</span><strong>Check the recommended forms first</strong><p>Use the visible form list before switching to another form group.</p></article>
              <article><span>02</span><strong>Switch only when the title does not fit</strong><p>County, filing stage, children, and agreement status can change the needed forms.</p></article>
              <article><span>03</span><strong>Ask for office review if unsure</strong><p>Do not guess between form groups when more than one sounds close.</p></article>
            </div>
          </details>
          <div class="forms-packet-clear-note" data-forms-packet-clear-note hidden>
            <strong>Visible checks cleared.</strong>
            <span>This only resets the visible form checklist in this browser tab.</span>
          </div>
          <div class="forms-packet-remaining" data-forms-packet-remaining aria-live="polite">
            <div>
              <span>Still left</span>
              <strong data-forms-packet-remaining-title>Forms left to review will appear here.</strong>
              <p data-forms-packet-remaining-copy>Use this as a quick check so you do not lose your place.</p>
            </div>
            <ol data-forms-packet-remaining-list></ol>
          </div>
          <div class="forms-packet-current" data-forms-packet-current hidden aria-live="polite">
            <div>
              <span>Current form</span>
              <strong data-forms-packet-current-title>No form opened yet.</strong>
              <p data-forms-packet-current-purpose>Open a form and this panel will keep the next step visible.</p>
              <small data-forms-packet-current-file></small>
            </div>
            <div class="forms-packet-current-actions">
              <button class="button outline" type="button" data-forms-packet-current-next>Continue to next form</button>
            </div>
          </div>
          <div class="forms-packet-complete" data-forms-packet-complete hidden>
            <div>
              <span>Forms reviewed</span>
              <strong>All visible forms in this form group are checked.</strong>
              <p>Use the checklist for your records, or open another packet if you need a different route.</p>
            </div>
            <div class="forms-packet-complete-actions">
              <button class="button outline" type="button" data-forms-packet-complete-copy>Copy checklist</button>
              <button class="button outline" type="button" data-forms-packet-complete-print>Print checklist</button>
            </div>
          </div>
          <div class="forms-packet-builder-list" data-forms-packet-list>
            ${files.map((file, index) => `<article
              data-forms-packet-file
              data-packet-id="${esc(file.packet_id || "")}"
              data-language="${esc(file.language || "")}"
              data-child-only="${isChildOnlyPacketFile(file) ? "true" : "false"}"
              data-site-pdf-view-url="${esc(sitePdfViewUrlFor(file))}"
              data-site-pdf-download-url="${esc(sitePdfDownloadUrlFor(file))}"
              data-file-name="${esc(file.file_name || "")}"
              data-public-name="${esc(file.public_name || file.file_name || "Official court PDF")}"
              data-public-purpose="${esc(packetFilePurpose(file))}"
              data-public-stage="${esc(file.public_stage || "Court form")}"
              data-file-index="${esc(String(index))}">
              <div class="forms-packet-file-step"><span data-forms-packet-step>${esc(String(index + 1).padStart(2, "0"))}</span></div>
              <div class="forms-packet-file-copy">
                <label class="forms-packet-check">
                  <input type="checkbox" data-forms-packet-check>
                  <span>Mark opened or reviewed</span>
                </label>
                <span>${esc([file.public_stage, file.language].filter(Boolean).join(" / ") || "Court form")}</span>
                <strong>${esc(file.public_name || file.file_name || "Official court PDF")}</strong>
                <p class="forms-packet-file-purpose"><b>Why this matters:</b> ${esc(packetFilePurpose(file))}</p>
                <p>${esc(file.review_required_before_hosting ? "Open the form here. If the PDF does not load, use the court-source link in the viewer." : "Reviewed court PDF available here.")}</p>
                <small>${esc(file.file_name || "")}</small>
              </div>
              <div class="forms-packet-file-actions">
                <button class="button primary" type="button" data-forms-packet-view>View form</button>
                <button class="button outline" type="button" data-forms-packet-download>Download PDF</button>
                <small class="forms-packet-source-note">Reviewed court PDF</small>
                <a class="card-link" href="/start" data-link data-forms-packet-file-intake>Add this form to Intake →</a>
              </div>
            </article>`).join("")}
          </div>
        </div>
      `;
      host.querySelector("[data-form-download-intake]")?.setAttribute("data-intake-route", JSON.stringify(route));
      const packetSelect = host.querySelector("[data-forms-packet-select]");
      const languageSelect = host.querySelector("[data-forms-packet-language]");
      const packetPrintTitle = host.querySelector("[data-forms-packet-print-title]");
      const packetChangeNote = host.querySelector("[data-forms-packet-change-note]");
      const packetIntake = host.querySelector("[data-forms-packet-intake]");
      const packetStatus = host.querySelector("[data-forms-packet-status]");
      const packetProgress = host.querySelector("[data-forms-packet-progress]");
      const packetNext = host.querySelector("[data-forms-packet-next]");
      const packetResume = host.querySelector("[data-forms-packet-resume]");
      const packetNextStatus = host.querySelector("[data-forms-packet-next-status]");
      const packetStateLabel = host.querySelector("[data-forms-packet-state-label]");
      const packetStateTitle = host.querySelector("[data-forms-packet-state-title]");
      const packetStateCopy = host.querySelector("[data-forms-packet-state-copy]");
      const packetRemaining = host.querySelector("[data-forms-packet-remaining]");
      const packetRemainingTitle = host.querySelector("[data-forms-packet-remaining-title]");
      const packetRemainingCopy = host.querySelector("[data-forms-packet-remaining-copy]");
      const packetRemainingList = host.querySelector("[data-forms-packet-remaining-list]");
      const packetFitTitle = host.querySelector("[data-forms-packet-fit-title]");
      const packetFitCopy = host.querySelector("[data-forms-packet-fit-copy]");
      const packetFitCheck = host.querySelector("[data-forms-packet-fit-check]");
      const packetFitCheckCopy = host.querySelector("[data-forms-packet-fit-check-copy]");
      const packetFitNext = host.querySelector("[data-forms-packet-fit-next]");
      const packetFitNextCopy = host.querySelector("[data-forms-packet-fit-next-copy]");
      const packetCurrent = host.querySelector("[data-forms-packet-current]");
      const packetCurrentTitle = host.querySelector("[data-forms-packet-current-title]");
      const packetCurrentPurpose = host.querySelector("[data-forms-packet-current-purpose]");
      const packetCurrentFile = host.querySelector("[data-forms-packet-current-file]");
      const packetCurrentNext = host.querySelector("[data-forms-packet-current-next]");
      const packetCurrentIntake = host.querySelector("[data-forms-packet-current-intake]");
      const packetClear = host.querySelector("[data-forms-packet-clear]");
      const packetClearNote = host.querySelector("[data-forms-packet-clear-note]");
      const packetCopy = host.querySelector("[data-forms-packet-copy]");
      const packetPrint = host.querySelector("[data-forms-packet-print]");
      const packetComplete = host.querySelector("[data-forms-packet-complete]");
      const packetCompleteCopy = host.querySelector("[data-forms-packet-complete-copy]");
      const packetCompletePrint = host.querySelector("[data-forms-packet-complete-print]");
      const packetCompleteIntake = host.querySelector("[data-forms-packet-complete-intake]");
      const fileCards = Array.from(host.querySelectorAll("[data-forms-packet-file]"));
      let currentPacketCard = null;
      let lastAutoOpenedPacketId = "";
      const checklistStorageKey = "mflgFormsPacketChecklist";
      const readPacketChecklist = () => {
        try {
          const parsed = JSON.parse(window.sessionStorage.getItem(checklistStorageKey) || "{}");
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
          return {};
        }
      };
      const writePacketChecklist = (state) => {
        try {
          window.sessionStorage.setItem(checklistStorageKey, JSON.stringify(state || {}));
        } catch (error) {
          // Session storage can be unavailable in some private browsing modes.
        }
      };
      const checklistKeyForCard = (card) => `${card?.dataset.packetId || ""}:${card?.dataset.sitePdfViewUrl || card?.dataset.fileName || ""}:${card?.dataset.language || ""}`;
      const restorePacketChecklist = () => {
        const state = readPacketChecklist();
        fileCards.forEach((card) => {
          const check = card.querySelector("[data-forms-packet-check]");
          if (check) check.checked = Boolean(state[checklistKeyForCard(card)]);
        });
      };
      const savePacketChecklist = () => {
        const state = readPacketChecklist();
        fileCards.forEach((card) => {
          const key = checklistKeyForCard(card);
          const checked = Boolean(card.querySelector("[data-forms-packet-check]")?.checked);
          if (checked) {
            state[key] = true;
          } else {
            delete state[key];
          }
        });
        writePacketChecklist(state);
      };
      const visiblePacketCards = () => fileCards.filter((card) => !card.hidden);
      let packetChangeNoteTimer = null;
      let packetClearNoteTimer = null;
      const showPacketChangeNote = () => {
        if (!packetChangeNote) return;
        packetChangeNote.hidden = false;
        window.clearTimeout(packetChangeNoteTimer);
        packetChangeNoteTimer = window.setTimeout(() => {
          packetChangeNote.hidden = true;
        }, 4200);
      };
      const showPacketClearNote = () => {
        if (!packetClearNote) return;
        packetClearNote.hidden = false;
        window.clearTimeout(packetClearNoteTimer);
        packetClearNoteTimer = window.setTimeout(() => {
          packetClearNote.hidden = true;
        }, 4200);
      };
      const hidePacketClearNote = () => {
        if (!packetClearNote) return;
        window.clearTimeout(packetClearNoteTimer);
        packetClearNote.hidden = true;
      };
      const updateRemainingPacketForms = (visibleCards) => {
        if (!packetRemaining || !packetRemainingList) return;
        const remaining = visibleCards.filter((card) => !card.querySelector("[data-forms-packet-check]")?.checked);
        packetRemaining.hidden = !visibleCards.length;
        if (packetRemainingTitle) {
          packetRemainingTitle.textContent = remaining.length
            ? `${remaining.length} form${remaining.length === 1 ? "" : "s"} still need review.`
            : "Every visible form in this form group is checked.";
        }
        if (packetRemainingCopy) {
          packetRemainingCopy.textContent = remaining.length
            ? "Open the next item below, or continue with the button above."
            : "You can copy or print the checklist, or open another packet when you are done.";
        }
        packetRemainingList.innerHTML = remaining.slice(0, 4).map((card, index) => `
          <li>
            <button type="button" data-forms-packet-remaining-open="${esc(card.dataset.fileIndex || "")}">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${esc(card.dataset.publicName || "Official court PDF")}</strong>
            </button>
          </li>
        `).join("");
        if (remaining.length > 4) {
          packetRemainingList.insertAdjacentHTML("beforeend", `<li class="forms-packet-remaining-more"><span>+</span><strong>${esc(String(remaining.length - 4))} more in this form group</strong></li>`);
        }
      };
      const setCurrentPacketCard = (card) => {
        currentPacketCard = card && !card.hidden ? card : null;
        fileCards.forEach((item) => {
          if (currentPacketCard && item === currentPacketCard) {
            item.setAttribute("data-current-form", "true");
          } else {
            item.removeAttribute("data-current-form");
          }
        });
        if (!packetCurrent) return;
        if (!currentPacketCard) {
          packetCurrent.hidden = true;
          return;
        }
        packetCurrent.hidden = false;
        if (packetCurrentTitle) packetCurrentTitle.textContent = currentPacketCard.dataset.publicName || "Official court PDF";
        if (packetCurrentPurpose) packetCurrentPurpose.textContent = currentPacketCard.dataset.publicPurpose || "Review this form before moving to the next step.";
        if (packetCurrentFile) packetCurrentFile.textContent = currentPacketCard.dataset.fileName ? `File: ${currentPacketCard.dataset.fileName}` : "";
        packetCurrentIntake?.setAttribute("data-intake-route", JSON.stringify(routeForPacket(currentPacketCard)));
      };
      const openFirstVisiblePacketCard = (packetId = packetSelect?.value || defaultPacketId) => {
        const firstVisibleCard = visiblePacketCards().find((card) => card.dataset.packetId === packetId);
        if (!firstVisibleCard) return false;
        if (lastAutoOpenedPacketId === `${packetId}:${firstVisibleCard.dataset.fileName || firstVisibleCard.dataset.publicName || ""}`) return true;
        lastAutoOpenedPacketId = `${packetId}:${firstVisibleCard.dataset.fileName || firstVisibleCard.dataset.publicName || ""}`;
        firstVisibleCard.querySelector("[data-forms-packet-view]")?.click();
        return true;
      };
      const updatePacketProgress = () => {
        const visibleCards = visiblePacketCards();
        const checked = visibleCards.filter((card) => card.querySelector("[data-forms-packet-check]")?.checked).length;
        const complete = Boolean(visibleCards.length && checked === visibleCards.length);
        if (packetProgress) {
          packetProgress.textContent = `${checked} of ${visibleCards.length} checked`;
        }
        const nextCard = visibleCards.find((card) => !card.querySelector("[data-forms-packet-check]")?.checked);
        if (packetNext) {
          packetNext.disabled = !nextCard;
          packetNext.textContent = nextCard ? "Open next unchecked" : "Forms reviewed";
        }
        if (packetResume) {
          packetResume.hidden = !(checked > 0 && nextCard);
          packetResume.disabled = !nextCard;
        }
        if (packetCurrentNext) {
          packetCurrentNext.disabled = !nextCard;
          packetCurrentNext.textContent = nextCard ? "Continue to next form" : "Forms reviewed";
        }
        if (packetNextStatus) {
          packetNextStatus.textContent = nextCard
            ? `Next: ${nextCard.dataset.publicName || "Official court PDF"}`
            : visibleCards.length ? "All visible forms are checked for this form group." : "No visible forms to review.";
        }
        if (packetStateLabel && packetStateTitle && packetStateCopy) {
          if (!visibleCards.length) {
            packetStateLabel.textContent = "No visible forms";
            packetStateTitle.textContent = "No forms match this form group and language.";
            packetStateCopy.textContent = "Change the form group or language, or pick a different packet if the right form path is unclear.";
          } else if (complete) {
            packetStateLabel.textContent = "Forms reviewed";
            packetStateTitle.textContent = "Every visible form in this form group is checked.";
            packetStateCopy.textContent = "Copy or print the checklist, or open another packet if you need a different route.";
          } else if (checked > 0) {
            packetStateLabel.textContent = "In progress";
            packetStateTitle.textContent = `${visibleCards.length - checked} form${visibleCards.length - checked === 1 ? "" : "s"} left in this view.`;
            packetStateCopy.textContent = "Continue with the next unchecked form or choose a specific remaining form below.";
          } else {
            packetStateLabel.textContent = "Ready to start";
            packetStateTitle.textContent = "Open the first form when you are ready.";
            packetStateCopy.textContent = "The checklist will update in this browser tab as you review each visible form.";
          }
        }
        if (packetComplete) {
          packetComplete.hidden = !complete;
        }
        updateRemainingPacketForms(visibleCards);
      };
      const packetChecklistText = () => {
        const packetLabel = packetSelect?.options[packetSelect.selectedIndex]?.textContent?.trim() || "Court form group";
        const languageLabel = languageSelect?.options[languageSelect.selectedIndex]?.textContent?.trim() || "Selected language";
        const lines = [
          "MY FAMILY LAW GROUP PLLC - Court Forms Checklist",
          `Form group: ${packetLabel}`,
          `Language: ${languageLabel}`,
          "Do not add private facts, case numbers, or financial information to this public checklist.",
          ""
        ];
        visiblePacketCards().forEach((card, index) => {
          const checked = card.querySelector("[data-forms-packet-check]")?.checked ? "x" : " ";
          lines.push(`${index + 1}. [${checked}] ${card.dataset.publicName || "Official court PDF"}`);
          if (card.dataset.fileName) lines.push(`   File: ${card.dataset.fileName}`);
        });
        return lines.join("\n");
      };
      const fallbackCopyText = (text) => {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (error) {
          copied = false;
        }
        area.remove();
        return copied;
      };
      const copyPacketChecklist = async (statusButton = packetCopy) => {
        const text = packetChecklistText();
        let copied = false;
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(text);
            copied = true;
          } catch (error) {
            copied = false;
          }
        }
        if (!copied) copied = fallbackCopyText(text);
        if (statusButton) {
          const originalText = statusButton.textContent;
          statusButton.textContent = copied ? "Checklist copied" : "Copy unavailable";
          window.setTimeout(() => {
            statusButton.textContent = originalText || "Copy checklist";
          }, 1800);
        }
      };
      const packetFitFor = (packetId) => {
        if (!packetId || packetId === "all") {
          return {
            title: "Choose a form group after the helper matches forms.",
            copy: "No county packet is selected until your answers point to one. If you are browsing manually, choose the form group that matches the county, stage, issue, and children involved.",
            check: "Answer the helper before relying on a packet.",
            checkCopy: "The form list should follow your answers. If the title does not match, change answers or use office review.",
            next: "Start with the guided helper above.",
            nextCopy: "The page will open the matched packet when a verified form path is available."
          };
        }
        if (packetId === "maricopa-divorce-new-with-children") {
          return {
            title: "Starting a Maricopa divorce or legal separation with minor children.",
            copy: "Use this form group when the case is a new filing and there are minor children who need parenting-time, legal decision-making, or child-support forms.",
            check: "Confirm children, county, and filing stage.",
            checkCopy: "If a case is already open, you may need response, post-decree, enforcement, or agreement forms instead of a new-filing form group.",
            next: "Read the process sheet before the petition.",
            nextCopy: "Then open the sensitive-data cover sheet, petition, parenting plan, and child-related forms in order."
          };
        }
        if (packetId === "maricopa-divorce-new-no-children") {
          return {
            title: "Starting a Maricopa divorce or legal separation with no minor children.",
            copy: "Use this form group when the case is a new filing and there are no minor children requiring parenting-time, decision-making, or child-support forms.",
            check: "Confirm there are no minor children in the case.",
            checkCopy: "If minor children are involved, switch to the form group with children so this page includes the child-related forms.",
            next: "Use the instructions first.",
            nextCopy: "The page hides child-related forms for this form group so you only see the forms that fit a no-children start."
          };
        }
        if (packetId === "maricopa-consent-decree-agreement") {
          return {
            title: "Finalizing a divorce or legal separation when everyone agrees.",
            copy: "Use this form group when both sides have reached a full agreement and need the court documents that move the matter toward final orders.",
            check: "Confirm the agreement is complete.",
            checkCopy: "If terms are still disputed, if someone will not sign, or if financial disclosure is incomplete, use Intake before relying on this form group.",
            next: "Open the final-order forms carefully.",
            nextCopy: "Compare each form against the agreement and keep the checklist for the final review step."
          };
        }
        if (packetId === "maricopa-parenting-parentage-support") {
          return {
            title: "Starting paternity, parenting-time, legal decision-making, or child support.",
            copy: "Use this form group when parents are not using a divorce form group and need orders about parentage, children, parenting time, or support.",
            check: "Confirm this is not part of an existing divorce case.",
            checkCopy: "If there is already a family-court order, you may need modification or enforcement instead of establishment forms.",
            next: "Start with the parentage and child forms.",
            nextCopy: "Open the forms in order, then choose another packet if the right filing path is still unclear."
          };
        }
        return {
          title: "Use the selected form group only if the title matches your situation.",
          copy: "If the form group does not match the county, case stage, children, or agreement status, choose another packet before opening forms.",
          check: "Confirm county, children, and case stage.",
          checkCopy: "A new filing, response, agreement, post-decree request, and enforcement request can require different paperwork.",
          next: "Open the forms in order.",
          nextCopy: "Start with the instructions and use the checklist to track what you reviewed."
        };
      };
      const routeForPacket = (card) => {
        const packetId = card?.dataset.packetId || packetSelect?.value || defaultPacketId;
        const group = groups.find((item) => item.packet_id === packetId) || groups[0] || {};
        return {
          routeKey: `forms-packet-builder-${slugify(group.label || packetId || "packet")}`,
          entrySource: "Forms & Tools",
          entryLabel: `Forms checklist: ${group.label || "Court form group"}`,
          issuePathway: "Forms & Tools",
          issueDetail: card?.dataset.publicName ? `Form checklist / ${card.dataset.publicName}` : "Form checklist selection",
          serviceInterest: "",
          contextNote: "Public form-checklist selection only. No private facts, uploads, case numbers, or financial information were collected.",
          presetAnswers: {
            packetBuilderPacket: group.label || "",
            packetBuilderPacketId: packetId,
            packetBuilderLanguage: card?.dataset.language || languageSelect?.value || "",
            packetBuilderForm: card?.dataset.publicName || "",
            approvedPdfOfficialUrl: card?.dataset.sitePdfViewUrl || "",
            sourceType: "Forms & Tools form checklist / public planning"
          }
        };
      };
      const updatePacketPrintTitle = (group) => {
        if (!packetPrintTitle) return;
        packetPrintTitle.innerHTML = `
          <span>Printable form checklist</span>
          <strong>${esc(group?.label || "Forms checklist")}</strong>
          <p>Use this checklist to track which official court PDFs you opened or reviewed. Do not write private facts, case numbers, or financial information on this page.</p>
        `;
      };
      const updatePacketBuilder = () => {
        const packetId = packetSelect?.value || defaultPacketId;
        const languageValue = languageSelect?.value || defaultLanguage;
        const group = groups.find((item) => item.packet_id === packetId) || groups[0] || {};
        const fit = packetFitFor(packetId);
        updatePacketPrintTitle(group);
        if (packetFitTitle) packetFitTitle.textContent = fit.title;
        if (packetFitCopy) packetFitCopy.textContent = fit.copy;
        if (packetFitCheck) packetFitCheck.textContent = fit.check;
        if (packetFitCheckCopy) packetFitCheckCopy.textContent = fit.checkCopy;
        if (packetFitNext) packetFitNext.textContent = fit.next;
        if (packetFitNextCopy) packetFitNextCopy.textContent = fit.nextCopy;
        let visible = 0;
        let hiddenForFit = 0;
        fileCards.forEach((card) => {
          const matchesPacket = packetId !== "all" && card.dataset.packetId === packetId;
          const matchesLanguage = languageValue === "all" || card.dataset.language === languageValue;
          const childOnlyMismatch = packetId === "maricopa-divorce-new-no-children" && card.dataset.childOnly === "true";
          const show = matchesPacket && matchesLanguage && !childOnlyMismatch;
          card.hidden = !show;
          if (matchesPacket && matchesLanguage && childOnlyMismatch) hiddenForFit += 1;
          if (show) {
            visible += 1;
            const step = card.querySelector("[data-forms-packet-step]");
            if (step) step.textContent = String(visible).padStart(2, "0");
          }
          card.querySelector("[data-forms-packet-file-intake]")?.setAttribute("data-intake-route", JSON.stringify(routeForPacket(card)));
        });
        packetIntake?.setAttribute("data-intake-route", JSON.stringify(routeForPacket(fileCards.find((card) => !card.hidden) || null)));
        packetCompleteIntake?.setAttribute("data-intake-route", JSON.stringify(routeForPacket(fileCards.find((card) => !card.hidden) || null)));
        if (currentPacketCard?.hidden) {
          setCurrentPacketCard(null);
        }
        if (packetStatus) {
          packetStatus.textContent = visible
            ? `${visible} matching official PDF${visible === 1 ? "" : "s"} shown for this form group.${hiddenForFit ? ` ${hiddenForFit} child-related form${hiddenForFit === 1 ? "" : "s"} hidden because this form group is for no minor children.` : ""}`
          : "No official PDFs match this form group and language.";
        }
        updatePacketProgress();
      };
      const applyPacketRoutePreset = (detail, shouldScroll) => {
        const packetId = detail?.pdfPacket || "";
        if (packetId && packetId !== "all" && packetSelect && Array.from(packetSelect.options).some((option) => option.value === packetId)) {
          packetSelect.value = packetId;
          if (languageSelect && Array.from(languageSelect.options).some((option) => option.value === "English")) {
            languageSelect.value = "English";
          }
          updatePacketBuilder();
          if (shouldScroll) {
            revealAndFocus(host.querySelector("[data-forms-packet-builder]"), { hash: "#forms-packet-builder", history: true });
          }
        }
      };
      fileCards.forEach((card) => {
        card.querySelector("[data-forms-packet-check]")?.addEventListener("change", () => {
          savePacketChecklist();
          updatePacketProgress();
        });
        card.querySelector("[data-forms-packet-view]")?.addEventListener("click", () => {
          setCurrentPacketCard(card);
          const check = card.querySelector("[data-forms-packet-check]");
          if (check) {
            check.checked = true;
            hidePacketClearNote();
            savePacketChecklist();
            updatePacketProgress();
          }
          window.dispatchEvent(new CustomEvent("mflg:official-pdf-open", {
            detail: {
              sitePdfViewUrl: card.dataset.sitePdfViewUrl || "",
              label: card.dataset.publicName || "",
              fileName: card.dataset.fileName || ""
            }
          }));
        });
        card.querySelector("[data-forms-packet-download]")?.addEventListener("click", () => {
          card.querySelector("[data-forms-packet-view]")?.click();
        });
      });
      packetNext?.addEventListener("click", () => {
        const nextCard = visiblePacketCards().find((card) => !card.querySelector("[data-forms-packet-check]")?.checked);
        if (!nextCard) return;
        nextCard.querySelector("[data-forms-packet-view]")?.click();
      });
      packetResume?.addEventListener("click", () => {
        const nextCard = visiblePacketCards().find((card) => !card.querySelector("[data-forms-packet-check]")?.checked);
        if (!nextCard) return;
        nextCard.querySelector("[data-forms-packet-view]")?.click();
      });
      packetCurrentNext?.addEventListener("click", () => {
        const nextCard = visiblePacketCards().find((card) => !card.querySelector("[data-forms-packet-check]")?.checked);
        if (!nextCard) return;
        nextCard.querySelector("[data-forms-packet-view]")?.click();
      });
      packetRemainingList?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-forms-packet-remaining-open]");
        if (!button) return;
        const card = fileCards.find((item) => item.dataset.fileIndex === button.dataset.formsPacketRemainingOpen && !item.hidden);
        if (!card) return;
        card.querySelector("[data-forms-packet-view]")?.click();
      });
      packetClear?.addEventListener("click", () => {
        visiblePacketCards().forEach((card) => {
          const check = card.querySelector("[data-forms-packet-check]");
          if (check) check.checked = false;
        });
        setCurrentPacketCard(null);
        savePacketChecklist();
        updatePacketProgress();
        showPacketClearNote();
      });
      packetCopy?.addEventListener("click", () => {
        copyPacketChecklist(packetCopy);
      });
      packetCompleteCopy?.addEventListener("click", () => {
        copyPacketChecklist(packetCompleteCopy);
      });
      packetPrint?.addEventListener("click", () => window.print());
      packetCompletePrint?.addEventListener("click", () => window.print());
      packetSelect?.addEventListener("change", () => {
        setCurrentPacketCard(null);
        hidePacketClearNote();
        updatePacketBuilder();
        openFirstVisiblePacketCard(packetSelect?.value || defaultPacketId);
        showPacketChangeNote();
      });
      languageSelect?.addEventListener("change", () => {
        setCurrentPacketCard(null);
        hidePacketClearNote();
        updatePacketBuilder();
        showPacketChangeNote();
      });
      window.addEventListener("mflg:forms-route-change", (event) => {
        applyPacketRoutePreset(event.detail, event.detail?.focusPacketBuilder === true);
      });
      if (window.MFLGLatestFormsRoute) {
        applyPacketRoutePreset(window.MFLGLatestFormsRoute, false);
      }
      restorePacketChecklist();
      updatePacketBuilder();
    } catch (error) {
      host.innerHTML = `
        <div class="forms-download-head">
          <div>
            <span>Forms</span>
            <strong>Forms could not load right now.</strong>
            <p>Use Guided Intake if you need help finding the right form.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireFormsToolsIntakeReadiness() {
    const host = document.querySelector("[data-forms-tools-intake-readiness]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-intake-readiness.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const options = Array.isArray(manifest.options) ? manifest.options : [];
      const routes = Array.isArray(manifest.reviewed_routes) ? manifest.reviewed_routes : [];
      const calculators = Array.isArray(manifest.calculators) ? manifest.calculators : [];
      const jurisdictions = Array.isArray(manifest.official_jurisdictions) ? manifest.official_jurisdictions : [];

      const routeForOption = (option) => ({
        routeKey: `forms-tools-start-${slugify(option.option_id || option.label || "option")}`,
        entrySource: "Forms & Tools",
        entryLabel: `Forms & Tools start: ${option.label || "Public planning option"}`,
        issuePathway: "Forms & Tools",
        issueDetail: option.public_status || option.label || "Safe public planning selection",
        serviceInterest: "",
        contextNote: "Public Forms & Tools start option only. Only non-sensitive source, form, county, packet, or calculator details were selected before Guided Intake.",
        presetAnswers: {
          formsToolsStartOption: option.label || "",
          formsToolsStartType: option.option_type || "",
          formsToolsStartStatus: option.public_status || "",
          sourceType: "Forms & Tools start option / public planning"
        }
      });

      host.innerHTML = `
        <div class="forms-intake-head">
          <div>
            <span>Guided start</span>
            <strong>Choose one simple form path, then continue only if it fits.</strong>
            <p>${esc(manifest.public_message || "Start from a public Forms & Tools selection, then continue into Guided Intake with only the form path needed to stay organized.")}</p>
          </div>
          <a class="button primary" href="/start" data-link data-forms-intake-option>Start Guided Intake</a>
        </div>
        <div class="forms-intake-metrics">
          <article><span>Start choices</span><strong>${esc(String(summary.safe_start_options || options.length))}</strong></article>
          <article><span>On-site form paths</span><strong>${esc(String(summary.reviewed_routes || 0))}</strong></article>
          <article><span>Form PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
          <article><span>Planning tools</span><strong>${esc(String(summary.calculator_choices || 0))}</strong></article>
        </div>
        <div class="forms-intake-grid">
          ${options.map((option) => `<article>
            <div>
              <span>${esc(option.option_type || "Option")}</span>
              <strong>${esc(option.label || "")}</strong>
              <p>${esc(option.public_status || "")}</p>
            </div>
            <div class="forms-intake-card-foot">
              <small>${esc(String(option.count || 0))} available</small>
              <a class="button outline" href="/start" data-link data-forms-intake-option data-forms-intake-option-id="${esc(option.option_id || "")}">Start Guided Intake</a>
            </div>
          </article>`).join("")}
        </div>
        <div class="forms-intake-evidence" aria-label="Reviewed public start evidence">
          <article>
            <span>Reviewed routes</span>
            <p>${routes.map((route) => esc(route.packet_label || route.packet_id || "Reviewed route")).join(" / ") || "Reviewed route data will appear after source review."}</p>
          </article>
          <article>
            <span>Source options</span>
            <p>${jurisdictions.map((item) => esc(item.label || item.county || "Official source")).join(" / ") || "Official source options will appear after monitoring."}</p>
          </article>
          <article>
            <span>Calculator choices</span>
            <p>${calculators.map((item) => esc(item.label || "Calculator")).join(" / ") || "Calculator choices will appear after source review."}</p>
          </article>
        </div>
      `;

      const fallbackOption = options[0] || {
        option_id: "forms-tools-public-planning",
        label: "Forms & Tools public planning",
        option_type: "planning",
        public_status: "Safe public Forms & Tools selection"
      };
      host.querySelectorAll("[data-forms-intake-option]").forEach((link) => {
        const optionId = link.getAttribute("data-forms-intake-option-id");
        const option = options.find((item) => item.option_id === optionId) || fallbackOption;
        link.setAttribute("data-intake-route", JSON.stringify(routeForOption(option)));
      });
    } catch (error) {
      host.innerHTML = `
        <div class="forms-intake-head">
          <div>
            <span>Safe Intake start</span>
            <strong>Safe start options could not load.</strong>
            <p>Continue to Guided Intake and avoid entering sensitive facts until prompted there.</p>
          </div>
          <a class="button outline" href="/start" data-link>Start Guided Intake</a>
        </div>
      `;
    }
  }

  function wireFormsSmartPath() {
    const host = document.querySelector("[data-forms-smart-path]");
    if (!host) return;
    const need = host.querySelector("[data-smart-need]");
    const county = host.querySelector("[data-smart-county]");
    const children = host.querySelector("[data-smart-children]");
    const posture = host.querySelector("[data-smart-posture]");
    const modeCopy = host.querySelector("[data-smart-mode-copy]");
    const entryLanes = host.querySelector(".forms-entry-lanes");
    const smartControls = host.querySelector(".forms-smart-path-controls");
    const smartMode = host.querySelector("[data-smart-mode]");
    const showAll = host.querySelector("[data-smart-show-all]");
    const reset = host.querySelector("[data-smart-reset]");
    const laneLinks = Array.from(host.querySelectorAll("[data-smart-lane]"));
    const guidedQuestion = host.querySelector("[data-guided-question]");
    const guidedOptions = host.querySelector("[data-guided-options]");
    const guidedCopy = host.querySelector("[data-guided-copy]");
    const guidedJumps = Array.from(host.querySelectorAll("[data-guided-jump]"));
    const guidedResultTitle = host.querySelector("[data-guided-result-title]");
    const guidedResultCopy = host.querySelector("[data-guided-result-copy]");
    const guidedResultAction = host.querySelector("[data-guided-result-action]");
    const guidedChangeAnswers = host.querySelector("[data-guided-change-answers]");
    const guidedIntakeFallback = host.querySelector("[data-guided-intake-fallback]");
    const guidedSummary = host.querySelector("[data-guided-summary]");
    const guidedEditAnswers = host.querySelector("[data-guided-edit-answers]");
    const guidedResultTier = host.querySelector("[data-guided-result-tier]");
    const guidedReason = host.querySelector("[data-guided-reason]");
    const unifiedResultSummary = host.querySelector("[data-unified-result-summary]");
    const unifiedResultTitle = host.querySelector("[data-unified-result-title]");
    const unifiedResultBasedOn = host.querySelector("[data-unified-result-based-on]");
    const unifiedResultWhy = host.querySelector("[data-unified-result-why]");
    const unifiedResultPrimary = host.querySelector("[data-unified-result-primary]");
    const unifiedResultSecondary = host.querySelector("[data-unified-result-secondary]");
    const unifiedResultReview = host.querySelector("[data-unified-result-review]");
    const guidedPathLine = host.querySelector("[data-guided-path-line]");
    const guideBridge = host.querySelector("[data-guide-bridge]");
    const guideBridgeTitle = host.querySelector("[data-guide-bridge-title]");
    const guideBridgeCopy = host.querySelector("[data-guide-bridge-copy]");
    const guideBridgeChips = host.querySelector("[data-guide-bridge-chips]");
    const guideBridgeActions = Array.from(host.querySelectorAll("[data-guide-bridge-action]"));
    const guideBridgeIntake = host.querySelector("[data-guide-bridge-intake]");
    const flowSections = Array.from(document.querySelectorAll("[data-flow-section]"));
    const initialStoredFormsRoute = storedFormsRoute();
    const presetRoute = window.MFLGLatestFormsRoute || initialStoredFormsRoute || {};
    const publicAnswerState = storedPublicAnswers();
    const publicConfirmedFields = publicAnswerState.confirmedFields || {};
    const hasConfirmedQualifierAnswers = Boolean(
      (publicConfirmedFields.county && confirmedPublicValue("county", publicAnswerState.county)) ||
      (publicConfirmedFields.issue && confirmedPublicValue("issue", publicAnswerState.issue)) ||
      (publicConfirmedFields.posture && confirmedPublicValue("posture", publicAnswerState.posture)) ||
      (publicConfirmedFields.children && confirmedPublicValue("children", publicAnswerState.children)) ||
      (publicConfirmedFields.selectedPacket && confirmedPublicValue("selectedPacket", publicAnswerState.selectedPacket))
    );
    const guideContextOnly = Boolean(presetRoute.fromGuide) && !hasConfirmedQualifierAnswers;
    const initialSmartPath = `/${String(window.location.pathname || "").replace(/^\/+|\/+$/g, "")}`;
    const presetNeed = window.location.hash === "#forms-calculator-hub" || (initialSmartPath === "/calculators" && window.MFLGGuideCalculatorChoice) ? "calculator" : "forms";
    let showAllSections = false;
    let guidedStep = 0;
    let guidedComplete = presetNeed === "calculator";
    const hasSavedQualifierAnswers = Boolean(initialStoredFormsRoute && hasConfirmedQualifierAnswers);
    let savedResumeActive = !guideContextOnly && hasSavedQualifierAnswers;
    let guideContextActive = guideContextOnly;
    const guidedAnswers = {
      need: need?.value || presetNeed,
      county: guideContextOnly ? "Not sure" : normalizeFormsCounty(presetRoute.county || county?.value),
      posture: guideContextOnly ? "Any posture" : normalizeFormsPosture(presetRoute.posture || posture?.value),
      issue: guideContextOnly ? "all" : normalizeFormsIssue(presetRoute.issue || "all"),
      children: guideContextOnly ? "any" : normalizeFormsChildren(presetRoute.children || children?.value)
    };
    const answeredFields = new Set();
    if (savedResumeActive) {
      ["need", "county", "posture", "issue", "children"].forEach((field) => answeredFields.add(field));
    } else if (presetNeed === "calculator") {
      answeredFields.add("need");
    }

    const routeForSmartPath = () => formsToolRouteFor({
      county: normalizeFormsCounty(county?.value),
      issue: guidedAnswers.issue || "all",
      posture: normalizeFormsPosture(posture?.value),
      children: normalizeFormsChildren(children?.value),
      pdfPacket: pdfPacketForFormsRoute(normalizeFormsCounty(county?.value), guidedAnswers.issue || "all", normalizeFormsPosture(posture?.value), normalizeFormsChildren(children?.value)),
      fromGuide: presetRoute.fromGuide || ""
    }, presetRoute.fromGuide || "");
	    const rememberSmartPathAnswers = (publicAnswerOptions = {}) => {
	      const route = rememberFormsQualifierAnswers({
        need: guidedAnswers.need || "forms",
        county: normalizeFormsCounty(guidedAnswers.county),
        issue: guidedAnswers.issue || "all",
        posture: normalizeFormsPosture(guidedAnswers.posture),
        children: normalizeFormsChildren(guidedAnswers.children),
        fromGuide: presetRoute.fromGuide || ""
	      }, {
	        calculatorChoice: window.MFLGGuideCalculatorChoice || presetRoute.calculatorChoice || "",
	        publicAnswerOptions
	      });
      window.MFLGLatestFormsRoute = route;
      window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: route }));
      return route;
    };

    const recommendations = {
      forms: {
        label: "What happens next",
        tier: "Recommended form path",
        title: "Continue to the recommended forms.",
        copy: "The helper has enough answers to show one primary form path. Open the forms only if the title and source match what you selected.",
        href: "#forms-approved-pdfs",
        text: "View matched forms"
      },
      calculator: {
        label: "What happens next",
        tier: "Recommended calculator",
        title: "Open the calculator tools.",
        copy: "Use only planning numbers. If you do not know which numbers belong in a field, use Guided Intake before relying on an estimate.",
        href: "#forms-calculator-hub",
        text: "Open calculator tools"
      },
      deadline: {
        label: "What happens next",
        tier: "Recommended deadline check",
        title: "Check the deadline path first.",
        copy: "If papers were served or a hearing is coming up, start with the deadline planner and use Guided Intake if timing is unclear.",
        href: "#deadline-readiness-planner",
        text: "Check deadline urgency"
      },
      issue: {
        label: "What happens next",
        tier: "Recommended issue search",
        title: "Search by plain-language issue.",
        copy: "Use the matter list when you know the problem, but do not know which court packet or form name fits.",
        href: "#forms-matter-coverage",
        text: "Search by issue"
      },
      guide: {
        label: "What happens next",
        tier: "Recommended DIY guide",
        title: "Read the guide before choosing forms.",
        copy: "Use DIY Guides when you need the process, document checklist, and readiness questions first.",
        href: "/guides",
        text: "Open DIY Guides",
        link: true
      },
      intake: {
        label: "What happens next",
        tier: "Office review recommended",
        title: "Start Guided Intake instead of guessing.",
        copy: "Use this when the issue, county, deadline, or next step is unclear. Only answer what Intake asks for.",
        href: "/start",
        text: "Start Guided Intake",
        link: true,
        route: true
      }
    };
    const guidedExactPdfPacket = () => pdfPacketForFormsRoute(
      normalizeFormsCounty(guidedAnswers.county),
      guidedAnswers.issue || "all",
      normalizeFormsPosture(guidedAnswers.posture),
      normalizeFormsChildren(guidedAnswers.children)
    );
    const recommendationForGuidedAnswers = () => {
      const active = guidedAnswers.need || "forms";
      if (active === "forms" && guidedExactPdfPacket() === "all") {
        return {
          label: "What happens next",
          tier: "Office review recommended",
          title: "Use Intake or adjust answers before opening forms.",
          copy: "No exact issue-specific form packet is verified for these answers yet. Change answers if another county or stage applies, or use Guided Intake for help confirming the next step.",
          href: "/start",
          text: "Start Guided Intake",
          link: true,
          route: true
        };
      }
      return recommendations[active] || recommendations.forms;
    };
    const countyLabelsForReason = {
      "Not sure": "not sure yet",
      Statewide: "Arizona statewide",
      Maricopa: "Maricopa County",
      Pima: "Pima County",
      Pinal: "Pinal County",
      Yavapai: "Yavapai County"
    };
    const needLabelsForReason = {
      forms: "Find forms",
      calculator: "Use a calculator",
      deadline: "Help me choose",
      issue: "Search by issue",
      guide: "Read a DIY guide",
      intake: "Start Guided Intake"
    };
    const hasAnswered = (field) => answeredFields.has(field);
    const selectedAnswerReasons = () => {
      const parts = [];
      if (hasAnswered("need")) parts.push(`you chose ${needLabelsForReason[guidedAnswers.need] || "a starting path"}`);
      if (hasAnswered("county")) parts.push(`county is ${countyLabelsForReason[guidedAnswers.county] || guidedAnswers.county}`);
      if (hasAnswered("posture")) parts.push(`case stage is ${guidedAnswers.posture}`);
      if (hasAnswered("issue")) parts.push(`issue is ${publicIssueLabelForRoute(guidedAnswers).toLowerCase()}`);
      if (hasAnswered("children")) parts.push(guidedAnswers.children === "minor-children" ? "minor children are involved" : guidedAnswers.children === "no-minor-children" ? "minor children are not involved" : "children answer is not sure");
      return parts;
    };
    const labelFor = (value, fallback = "") => {
      const text = String(value || fallback || "").trim();
      if (!text) return "";
      return text
        .split(/[\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };
    const routeChips = () => [
      presetRoute.county && presetRoute.county !== "Statewide" && presetRoute.county !== "Not sure" ? `${presetRoute.county} County` : "",
      normalizeFormsIssue(presetRoute.issue || "") !== "all" ? labelFor(normalizeFormsIssue(presetRoute.issue)) : "",
      presetRoute.posture && presetRoute.posture !== "Any posture" ? presetRoute.posture : "",
      presetRoute.children && presetRoute.children !== "any" ? labelFor(presetRoute.children) : "",
      presetRoute.pdfPacket && presetRoute.pdfPacket !== "all" ? "Matched packet ready" : ""
    ].filter(Boolean);
    const updateGuideBridge = () => {
      const hasGuideContext = Boolean(presetRoute.fromGuide || presetRoute.pdfPacket);
      if (!guideBridge) return;
      guideBridge.hidden = !hasGuideContext;
      if (!hasGuideContext) return;
      const guideTitle = presetRoute.fromGuide || "DIY Guide";
      if (guideBridgeTitle) guideBridgeTitle.textContent = `${guideTitle} is connected to this page.`;
      if (guideBridgeCopy) {
        guideBridgeCopy.textContent = window.MFLGGuideCalculatorChoice
          ? "Guide context is connected here, but county and form answers are not selected for you. Use the calculator if it fits, or answer the form questions before opening paperwork."
          : "Guide context is connected here, but county and form answers are not selected for you. Answer the form questions before opening any packet or PDF viewer.";
      }
      if (guideBridgeChips) {
        guideBridgeChips.innerHTML = routeChips().map((chip) => `<span>${esc(chip)}</span>`).join("");
      }
      guideBridgeIntake?.setAttribute("data-intake-route", JSON.stringify(formsToolRouteFor(presetRoute, presetRoute.fromGuide || "DIY Guide")));
    };
    const guidedSteps = [
      {
        question: "What do you need right now?",
        copy: "Pick the closest answer. You can change it later.",
        key: "need",
        options: [
          ["forms", "Find forms"],
          ["calculator", "Use a calculator"],
          ["guide", "Read a DIY guide"],
          ["deadline", "Help me choose"],
          ["intake", "Start Guided Intake"]
        ]
      },
      {
        question: "Which court or county sounds closest?",
        copy: "Forms can change by county. If you do not know, choose Not sure.",
        key: "county",
        options: [
          ["Not sure", "I do not know"],
          ["Apache", "Apache"],
          ["Cochise", "Cochise"],
          ["Coconino", "Coconino"],
          ["Gila", "Gila"],
          ["Graham", "Graham"],
          ["Greenlee", "Greenlee"],
          ["La Paz", "La Paz"],
          ["Maricopa", "Maricopa"],
          ["Mohave", "Mohave"],
          ["Navajo", "Navajo"],
          ["Pima", "Pima"],
          ["Pinal", "Pinal"],
          ["Santa Cruz", "Santa Cruz"],
          ["Yavapai", "Yavapai"],
          ["Yuma", "Yuma"]
        ]
      },
      {
        question: "What are you trying to do in court?",
        copy: "This changes whether you need starting forms, response forms, final papers, or post-order papers.",
        key: "posture",
        options: [
          ["New filing", "Start a new case"],
          ["Served / response", "Respond to papers I received"],
          ["Existing order", "Change or enforce an order"],
          ["Agreement / final orders", "Finalize an agreement"],
          ["Any posture", "I am not sure"]
        ]
      },
      {
        question: "What is the family-law issue?",
        copy: "Choose the closest topic. If none fit, leave it broad.",
        key: "issue",
        options: [
          ["divorce", "Divorce or legal separation"],
          ["parenting", "Parenting or custody"],
          ["support", "Child support or money"],
          ["all", "I am not sure"]
        ]
      },
      {
        question: "Are minor children involved?",
        copy: "This only changes which forms may be relevant.",
        key: "children",
        options: [
          ["any", "I am not sure"],
          ["minor-children", "Yes"],
          ["no-minor-children", "No"]
        ]
      }
    ];
    const guidedStepProgressLabel = (index) => {
      const labels = [
        "Step 1 of 5: Choose what you need",
        "Step 2 of 5: Choose county",
        "Step 3 of 5: Choose case stage",
        "Step 4 of 5: Choose issue",
        "Step 5 of 5: Choose children"
      ];
      return labels[Math.max(0, Math.min(index, labels.length - 1))] || "Step 1 of 5";
    };
    const guidedContinueLabel = () => {
      const next = guidedSteps[Math.min(guidedStep + 1, guidedSteps.length - 1)];
      if (!next) return "Continue";
      if (next.key === "county") return "Continue to county";
      if (next.key === "posture") return "Continue to case stage";
      if (next.key === "issue") return "Continue to issue";
      if (next.key === "children") return "Continue to children";
      return "Continue to next step";
    };
    const needForHash = (hash) => {
      if (hash === "#forms-calculator-hub") return "calculator";
      if (hash === "#deadline-readiness-planner") return "deadline";
      if (hash === "#forms-matter-coverage") return "issue";
      if (hash === "#forms-task-workspace" || hash === "#forms-official-router" || hash === "#forms-packets" || hash === "#forms-approved-pdfs") return "forms";
      return "";
    };
    const setNeedFromHash = (hash) => {
      const nextNeed = needForHash(hash);
      if (nextNeed && need) {
        need.value = nextNeed;
        guidedAnswers.need = nextNeed;
        showAllSections = false;
        update();
      }
    };

	    const update = (publicAnswerOptions = {}) => {
	      guidedAnswers.need = need?.value || guidedAnswers.need;
	      guidedAnswers.county = normalizeFormsCounty(county?.value || guidedAnswers.county);
	      guidedAnswers.posture = normalizeFormsPosture(posture?.value || guidedAnswers.posture);
	      guidedAnswers.children = normalizeFormsChildren(children?.value || guidedAnswers.children);
	      rememberSmartPathAnswers(publicAnswerOptions);
      const recommendation = recommendationForGuidedAnswers();
      const activeNeed = need?.value || "forms";
      const exactFormsReady = activeNeed !== "forms" || guidedExactPdfPacket() !== "all";
      const pathReady = showAllSections || activeNeed === "intake" || (guidedComplete && exactFormsReady);
      host.classList.toggle("user-showing-all", showAllSections);
      host.classList.toggle("forms-guided-complete", guidedComplete);
      host.classList.toggle("forms-guided-pending", !pathReady);
      host.classList.toggle("forms-guided-resume", savedResumeActive && !guidedComplete);
      document.body.classList.toggle("forms-showing-all-sections", showAllSections);
      document.body.classList.toggle("forms-active-need-forms", pathReady && activeNeed === "forms");
      document.body.classList.toggle("forms-active-need-calculator", pathReady && activeNeed === "calculator");
      document.body.classList.toggle("forms-active-need-deadline", pathReady && activeNeed === "deadline");
      document.body.classList.toggle("forms-active-need-issue", pathReady && activeNeed === "issue");
      flowSections.forEach((section) => {
        const sectionTargets = (section.getAttribute("data-flow-section") || "").split(/\s+/).filter(Boolean);
        const visible = pathReady && (showAllSections || sectionTargets.includes(activeNeed));
        section.classList.toggle("forms-flow-hidden", !visible);
        section.classList.toggle("forms-flow-active", visible && !showAllSections && sectionTargets.includes(activeNeed));
        section.toggleAttribute("inert", !visible);
        section.setAttribute("aria-hidden", visible ? "false" : "true");
      });
      const hasStartedPath = answeredFields.size > 0 || savedResumeActive || guidedComplete || guideContextActive;
      const showEntryLanes = showAllSections || !hasStartedPath;
      const showModeControls = showAllSections || hasStartedPath;
      if (modeCopy) {
        const isStillAnswering = !guidedComplete && !savedResumeActive && guidedStep < guidedSteps.length - 1 && guidedAnswers.need !== "intake";
        modeCopy.textContent = showAllSections
          ? "Showing other sections. Return to the recommended path before opening forms if the choices feel unclear."
          : savedResumeActive && !guidedComplete
          ? "Saved answers are applied. Continue with them or change answers before opening forms and tools."
          : isStillAnswering
          ? "Showing one guided question at a time."
          : !guidedComplete
          ? "Your recommended section will appear after you finish the guided helper."
          : `Showing one active workflow: ${recommendation.text}.`;
      }
      if (entryLanes) {
        setHiddenInert(entryLanes, !showEntryLanes);
      }
      if (smartControls) {
        setHiddenInert(smartControls, !showAllSections);
      }
      if (smartMode) {
        setHiddenInert(smartMode, !showModeControls);
      }
      if (showAll) {
        showAll.textContent = showAllSections ? "Show recommended path" : "Browse other options";
        showAll.setAttribute("aria-pressed", showAllSections ? "true" : "false");
      }
      laneLinks.forEach((lane) => {
        lane.toggleAttribute("aria-current", lane.getAttribute("data-smart-lane") === activeNeed);
      });
      updateGuideBridge();
      renderGuidedStep();
    };

    const setSelectValue = (control, value) => {
      if (!control) return;
      const options = Array.from(control.options || []);
      if (options.some((option) => option.value === value)) {
        control.value = value;
      }
    };
    setSelectValue(need, guidedAnswers.need);
    setSelectValue(county, guidedAnswers.county);
    setSelectValue(posture, guidedAnswers.posture);
    setSelectValue(children, guidedAnswers.children);
    const syncFormsFinder = () => {
      const formCounty = document.querySelector("[data-form-county]");
      const formIssue = document.querySelector("[data-form-issue]");
      const formPosture = document.querySelector("[data-form-posture]");
      const formChildren = document.querySelector("[data-form-children]");
      setSelectValue(formCounty, normalizeFormsCounty(guidedAnswers.county));
      setSelectValue(formChildren, normalizeFormsChildren(guidedAnswers.children));
      if (guidedAnswers.need === "deadline") {
        setSelectValue(formPosture, guidedAnswers.posture && guidedAnswers.posture !== "Any posture" ? guidedAnswers.posture : "Served / response");
        setSelectValue(formIssue, normalizeFormsIssue(guidedAnswers.issue || "all"));
      } else if (guidedAnswers.need === "calculator") {
        setSelectValue(formPosture, guidedAnswers.posture || "Any posture");
        setSelectValue(formIssue, normalizeFormsIssue(guidedAnswers.issue || "all"));
      } else {
        setSelectValue(formPosture, guidedAnswers.posture || "Any posture");
        setSelectValue(formIssue, normalizeFormsIssue(guidedAnswers.issue || "all"));
      }
      formCounty?.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const updateGuidedResult = () => {
      const recommendation = recommendationForGuidedAnswers();
      const needLabels = {
        forms: "Court forms",
        deadline: "Deadline or served papers",
        calculator: "Calculator",
        intake: "Guided Intake",
        issue: "Issue search",
        guide: "DIY Guides"
      };
      const countyLabels = {
        "Not sure": "County not selected",
        Statewide: "Statewide source",
        Maricopa: "Maricopa County",
        Pima: "Pima County",
        Pinal: "Pinal County",
        Yavapai: "Yavapai County"
      };
      const postureLabels = {
        "Any posture": "Stage not sure yet",
        "New filing": "Starting a case",
        "Served / response": "Responding to papers",
        "Existing order": "Changing or enforcing an order",
        "Agreement / final orders": "Finalizing an agreement",
        Safety: "Safety concern"
      };
      const childrenLabels = {
        any: "Children not sure yet",
        "minor-children": "Minor children",
        "no-minor-children": "No minor children"
      };
      const countyLabel = guidedAnswers.county && guidedAnswers.county !== "Statewide" && guidedAnswers.county !== "Not sure" ? `${guidedAnswers.county} ` : "";
      const childrenLabel = guidedAnswers.children === "minor-children"
        ? " with minor children"
        : guidedAnswers.children === "no-minor-children"
        ? " without minor children"
        : "";
      const shouldContinueQuestions = !guidedComplete && !savedResumeActive && guidedStep < guidedSteps.length - 1 && guidedAnswers.need !== "intake";
      const calculatorContextNote = guidedAnswers.need === "calculator"
        ? " These saved answers stay connected for forms; calculator tools only use the fields that apply."
        : "";
      if (guidedResultTitle) {
        guidedResultTitle.textContent = savedResumeActive && !guidedComplete
          ? "Using answers from this session."
          : shouldContinueQuestions
          ? `Next: ${guidedSteps[Math.min(guidedStep + 1, guidedSteps.length - 1)]?.question || "next step"}`
          : recommendation.title || (guidedAnswers.need === "intake"
          ? "Use Guided Intake instead of guessing."
          : guidedAnswers.need === "calculator"
          ? "Open the calculator tools."
          : `Use the ${countyLabel}form finder${childrenLabel}.`);
      }
      if (guidedResultCopy) {
        guidedResultCopy.textContent = savedResumeActive && !guidedComplete
          ? `These answers are already carrying through this site. Continue only if they still fit, or change them first.${calculatorContextNote}`
          : shouldContinueQuestions
          ? "Choose one answer above. The next step appears immediately after you choose."
          : recommendation.copy || (guidedAnswers.need === "intake"
          ? "This is the safest choice when the court, issue, deadline, or next form is unclear."
          : guidedAnswers.need === "calculator"
          ? "Start with calculator tools only if you know which numbers belong in the fields."
          : "The page has updated the form finder below. Use the next step button when you are ready.");
      }
      if (guidedResultAction) {
        guidedResultAction.textContent = savedResumeActive && !guidedComplete
          ? "Continue with saved answers"
          : shouldContinueQuestions ? "Choose one answer above" : recommendation.text || "Go to next step";
        guidedResultAction.dataset.guidedTarget = shouldContinueQuestions ? "" : recommendation.href || "#forms-approved-pdfs";
        guidedResultAction.toggleAttribute("data-guided-continue", false);
        guidedResultAction.disabled = shouldContinueQuestions;
        if (!shouldContinueQuestions && recommendation.route) {
          guidedResultAction.setAttribute("data-intake-route", JSON.stringify(routeForSmartPath()));
        } else {
          guidedResultAction.removeAttribute("data-intake-route");
        }
      }
      if (guidedChangeAnswers) {
        guidedChangeAnswers.hidden = !(savedResumeActive && !guidedComplete);
      }
      if (guidedEditAnswers) {
        guidedEditAnswers.hidden = !(guidedComplete || savedResumeActive || answeredFields.size > 1);
      }
      const answering = !savedResumeActive && !guidedComplete;
      guidedOptions?.toggleAttribute("inert", !answering);
      guidedOptions?.setAttribute("aria-hidden", answering ? "false" : "true");
      guidedResultAction?.classList.toggle("primary", true);
      if (guidedIntakeFallback) guidedIntakeFallback.setAttribute("data-intake-route", JSON.stringify(routeForSmartPath()));
      if (guidedResultTier) {
        guidedResultTier.hidden = shouldContinueQuestions && !savedResumeActive;
        const tierLabel = shouldContinueQuestions ? "Recommended forms" : recommendation.tier || recommendation.label || "Recommended forms";
        const tierTitle = shouldContinueQuestions
          ? "One primary path will appear here."
          : recommendation.title || "Recommended next step";
        const tierCopy = shouldContinueQuestions
          ? "Optional resources stay hidden until the helper has enough answers."
          : "Related forms stay below the main form result.";
        guidedResultTier.innerHTML = `<span>${esc(tierLabel)}</span><strong>${esc(tierTitle)}</strong><p>${esc(tierCopy)}</p>`;
      }
      if (guidedReason) {
        guidedReason.hidden = shouldContinueQuestions && !savedResumeActive;
        const reasons = selectedAnswerReasons();
        const reasonText = shouldContinueQuestions
          ? (guideContextActive ? "Your selected guide is connected. Choose the next answer above before forms appear." : "No form result is selected until you answer the current step.")
          : reasons.length
          ? `This appears because ${reasons.join(", ")}.`
          : "This appears because you chose a starting path.";
        guidedReason.innerHTML = `<span>Why this result</span><p>${esc(reasonText)}</p>`;
        if (unifiedResultWhy) unifiedResultWhy.textContent = reasonText;
      }
      if (unifiedResultSummary) {
        unifiedResultSummary.hidden = shouldContinueQuestions && !savedResumeActive;
        unifiedResultSummary.classList.toggle("is-ready", !shouldContinueQuestions);
      }
      if (unifiedResultTitle) {
        unifiedResultTitle.textContent = shouldContinueQuestions
          ? "Pending answers"
          : recommendation.title || "Recommended next step";
      }
      if (unifiedResultBasedOn) {
        const basedOn = [
          hasAnswered("county") ? countyLabels[guidedAnswers.county] || guidedAnswers.county : "",
          hasAnswered("posture") ? postureLabels[guidedAnswers.posture] || guidedAnswers.posture : "",
          hasAnswered("issue") ? (publicIssueLabelForRoute(guidedAnswers) === "Choose issue" ? "Issue not sure yet" : publicIssueLabelForRoute(guidedAnswers)) : "",
          hasAnswered("children") ? childrenLabels[guidedAnswers.children] || "Children not sure yet" : ""
        ].filter(Boolean);
        unifiedResultBasedOn.textContent = basedOn.length ? basedOn.join(" / ") : "No answers selected yet";
      }
      if (unifiedResultPrimary) {
        unifiedResultPrimary.textContent = shouldContinueQuestions ? "Choose one answer above" : recommendation.text || "Go to next step";
      }
      if (unifiedResultSecondary) {
        unifiedResultSecondary.textContent = shouldContinueQuestions
          ? "Hidden until the main result is clear"
          : "Available below the primary result if the recommended path does not fit.";
      }
      if (unifiedResultReview) {
        unifiedResultReview.textContent = recommendation.route || recommendation.tier === "Office review recommended"
          ? "Recommended for this result"
          : "Use office review if the answer, county, deadline, or form title does not fit.";
      }
	    if (guidedSummary) {
	        const chips = [
	          hasAnswered("need") ? needLabels[guidedAnswers.need] || "Forms" : "",
	          hasAnswered("county") ? countyLabels[guidedAnswers.county] || guidedAnswers.county || "County not selected" : "",
	          hasAnswered("posture") ? postureLabels[guidedAnswers.posture] || guidedAnswers.posture || "Stage not selected" : "",
	          hasAnswered("issue") ? (publicIssueLabelForRoute(guidedAnswers) === "Choose issue" ? "Issue not sure yet" : publicIssueLabelForRoute(guidedAnswers)) : "",
	          hasAnswered("children") ? childrenLabels[guidedAnswers.children] || "Children not sure yet" : ""
	        ].filter(Boolean);
        guidedSummary.innerHTML = chips.map((chip) => `<span>${esc(chip)}</span>`).join("");
        if (guidedPathLine) {
          guidedPathLine.textContent = savedResumeActive && !guidedComplete
            ? "Your previous choices are ready. Nothing is filed or sent by using them here."
            : shouldContinueQuestions
            ? "Choose one answer in the current step. The next step appears automatically."
            : `Ready next step: ${recommendation.text}.`;
        }
      }
    };

    function renderGuidedStep() {
      if (!guidedQuestion || !guidedOptions) return;
      const step = guidedSteps[guidedStep] || guidedSteps[0];
      guidedQuestion.textContent = savedResumeActive && !guidedComplete
        ? "Your saved answers are ready."
        : guidedComplete
        ? "Your answers are confirmed."
        : step.question;
      if (guidedCopy) {
        guidedCopy.textContent = savedResumeActive && !guidedComplete
          ? "We kept your county, court stage, issue, and children answer for this session."
          : guideContextActive && !guidedComplete
          ? "Guide context is connected, but county and form answers are not selected for you. Answer the remaining form questions before opening forms."
          : guidedComplete && guidedAnswers.need === "calculator"
          ? "Your form context stays saved. Calculator tools will use only the fields that apply."
          : guidedComplete
          ? "Your matched path is open below. You can still change answers or reset choices."
          : step.copy;
      }
      guidedOptions.innerHTML = step.options.map(([value, text]) => {
        const pressed = guidedAnswers[step.key] === value;
        return `<button type="button" data-guided-answer="${esc(value)}" aria-pressed="${pressed ? "true" : "false"}">${esc(text)}</button>`;
      }).join("");
      guidedOptions.hidden = savedResumeActive && !guidedComplete || guidedComplete;
      guidedOptions.toggleAttribute("inert", guidedOptions.hidden);
      guidedOptions.setAttribute("aria-hidden", guidedOptions.hidden ? "true" : "false");
      guidedJumps.forEach((jump, index) => {
        jump.setAttribute("aria-current", index === guidedStep ? "true" : "false");
        jump.disabled = guidedComplete || savedResumeActive;
        jump.setAttribute("aria-disabled", guidedComplete || savedResumeActive ? "true" : "false");
      });
      host.querySelector("[data-guided-progress-label]")?.replaceChildren(document.createTextNode(
        savedResumeActive && !guidedComplete
          ? "Saved answers applied"
        : guideContextActive && !guidedComplete
          ? "Guide context added"
        : guidedComplete
          ? "Answers confirmed"
          : guidedStepProgressLabel(guidedStep)
      ));
      updateGuidedResult();
    }

	    [
	      [need, "need"],
	      [county, "county"],
	      [children, "children"],
	      [posture, "posture"]
	    ].forEach(([control, field]) => control?.addEventListener("change", () => {
	      guidedAnswers.need = need?.value || guidedAnswers.need;
	      guidedAnswers.county = normalizeFormsCounty(county?.value || guidedAnswers.county);
	      guidedAnswers.posture = normalizeFormsPosture(posture?.value || guidedAnswers.posture);
	      guidedAnswers.children = normalizeFormsChildren(children?.value || guidedAnswers.children);
	      answeredFields.add(field);
	      syncFormsFinder();
	      update({ userAction: true, confirmed: true, confirmedFields: [field], source: "smart-path-control" });
	    }));
    laneLinks.forEach((lane) => {
      lane.addEventListener("click", (event) => {
        const laneNeed = lane.getAttribute("data-smart-lane");
        if (laneNeed && need && recommendations[laneNeed]) {
          need.value = laneNeed;
          guidedAnswers.need = laneNeed;
          answeredFields.add("need");
          guidedComplete = laneNeed !== "intake";
          if (laneNeed === "deadline") {
            guidedAnswers.posture = "Served / response";
            setSelectValue(posture, "Served / response");
          }
          showAllSections = false;
          syncFormsFinder();
		          update({ userAction: true, confirmed: true, confirmedFields: laneNeed === "deadline" ? ["need", "posture"] : ["need"], source: "smart-path-lane" });
          if (lane.getAttribute("href")?.startsWith("#")) {
            event.preventDefault();
            revealAndFocus(document.querySelector(lane.getAttribute("href")), { hash: lane.getAttribute("href"), history: true });
          }
        }
      });
    });
    guideBridgeActions.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-guide-bridge-action") || "forms";
        if (action === "calculator") {
        setSelectValue(need, "calculator");
        guidedAnswers.need = "calculator";
        answeredFields.add("need");
        guidedComplete = true;
          showAllSections = false;
          syncFormsFinder();
		          update({ userAction: true, confirmed: true, confirmedFields: ["need", "selectedCalculator"], source: "guide-bridge-calculator" });
          window.dispatchEvent(new CustomEvent("mflg:calculator-workspace", {
            detail: { choice: window.MFLGGuideCalculatorChoice || "support" }
          }));
          if (window.location.hash !== "#forms-calculator-hub") history.replaceState(history.state, "", "#forms-calculator-hub");
          revealAndFocus("#forms-calculator-hub", { hash: "#forms-calculator-hub", history: true });
          return;
        }
        setSelectValue(need, "forms");
        guidedAnswers.need = "forms";
        answeredFields.add("need");
        guidedComplete = false;
        savedResumeActive = false;
        guideContextActive = true;
        guidedStep = Math.max(1, guidedStep);
        showAllSections = false;
        syncFormsFinder();
      update({ userAction: true, confirmed: true, confirmedFields: ["need"], suggestedFields: ["issue", "county", "posture", "children", "selectedPacket"], source: "guide-bridge-forms" });
        window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: window.MFLGLatestFormsRoute || presetRoute }));
        if (window.location.hash !== "#forms-task-workspace") history.replaceState(history.state, "", "#forms-task-workspace");
        revealAndFocus("#forms-task-workspace", { hash: "#forms-task-workspace", history: true });
      });
    });
    document.querySelectorAll('a[href^="#forms-"]').forEach((link) => {
      link.addEventListener("click", () => setNeedFromHash(link.getAttribute("href") || ""));
    });
    window.addEventListener("mflg:forms-route-change", (event) => {
      const route = event.detail || {};
      if (!route || typeof route !== "object") return;
      guidedAnswers.county = normalizeFormsCounty(route.county || guidedAnswers.county);
      guidedAnswers.posture = normalizeFormsPosture(route.posture || guidedAnswers.posture);
      guidedAnswers.children = normalizeFormsChildren(route.children || guidedAnswers.children);
      guidedAnswers.issue = normalizeFormsIssue(route.issue || guidedAnswers.issue || "all");
      setSelectValue(county, guidedAnswers.county);
      setSelectValue(posture, guidedAnswers.posture);
      setSelectValue(children, guidedAnswers.children);
      renderGuidedStep();
      updateGuideBridge();
    });
    showAll?.addEventListener("click", () => {
      showAllSections = !showAllSections;
	      update();
    });
    reset?.addEventListener("click", () => {
      guidedStep = 0;
      guidedComplete = false;
      savedResumeActive = false;
      guidedAnswers.need = "forms";
      guidedAnswers.county = "Not sure";
      guidedAnswers.posture = "Any posture";
      guidedAnswers.issue = "all";
      guidedAnswers.children = "any";
      answeredFields.clear();
      setSelectValue(need, "forms");
      setSelectValue(county, "Not sure");
      setSelectValue(children, "any");
      setSelectValue(posture, "Any posture");
      showAllSections = false;
      syncFormsFinder();
	      update({ explicitReset: true, reset: true, resetFields: ["need", "county", "posture", "issue", "children", "selectedPacket", "selectedCalculator"], source: "smart-path-reset" });
      revealAndFocus(host, { hash: "#forms-task-workspace", history: false });
    });
    guidedChangeAnswers?.addEventListener("click", () => {
      savedResumeActive = false;
      guidedComplete = false;
      guidedStep = 0;
      showAllSections = false;
	        update();
      revealAndFocus(guidedQuestion || host, { hash: "#forms-task-workspace", history: false });
    });
    guidedOptions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-guided-answer]");
      if (!button) return;
      const step = guidedSteps[guidedStep] || guidedSteps[0];
      const value = button.getAttribute("data-guided-answer") || "";
      guideContextActive = false;
      guidedAnswers[step.key] = value;
      answeredFields.add(step.key);
      if (step.key === "need") {
        setSelectValue(need, value);
        if (value === "deadline") {
          guidedAnswers.posture = "Served / response";
          setSelectValue(posture, "Served / response");
        }
        if (value === "calculator" || value === "guide") {
          guidedComplete = true;
        }
      }
      if (step.key === "issue") guidedAnswers.issue = value;
      if (step.key === "county") setSelectValue(county, value);
      if (step.key === "posture") setSelectValue(posture, value);
      if (step.key === "children") setSelectValue(children, value);
      if (guidedStep >= guidedSteps.length - 1 || value === "intake") {
        guidedComplete = true;
      }
      showAllSections = false;
      syncFormsFinder();
      if (guidedStep < guidedSteps.length - 1) guidedStep += 1;
		        update({ userAction: true, confirmed: true, confirmedFields: step.key === "need" && value === "deadline" ? ["need", "posture"] : [step.key], source: "guided-answer" });
    });
    guidedJumps.forEach((jump) => {
      jump.addEventListener("click", () => {
        guidedStep = Number(jump.getAttribute("data-guided-jump") || 0);
        update();
      });
    });
    guidedEditAnswers?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-guided-edit]");
      if (!button) return;
      const key = button.getAttribute("data-guided-edit") || "";
      const index = guidedSteps.findIndex((step) => step.key === key);
      if (index < 0) return;
      savedResumeActive = false;
      guidedComplete = false;
      showAllSections = false;
      guidedStep = index;
      update();
      revealAndFocus(guidedQuestion || host, { hash: "#forms-task-workspace", history: false });
    });
    guidedResultAction?.addEventListener("click", (event) => {
      if (guidedResultAction.hasAttribute("data-guided-continue")) {
        event.preventDefault();
        guidedStep = Math.min(guidedStep + 1, guidedSteps.length - 1);
        update();
        revealAndFocus(guidedQuestion || host, { hash: "#forms-task-workspace", history: false });
        return;
      }
      if (savedResumeActive && !guidedComplete) {
        event.preventDefault();
        savedResumeActive = false;
        guidedComplete = true;
        syncFormsFinder();
        update();
      }
      guidedComplete = true;
      const href = guidedResultAction.dataset.guidedTarget || "";
      if (!href.startsWith("#")) {
        if (href) {
          if (href.replace(/\/$/, "") === "/start") {
            const route = parseRouteData(guidedResultAction.getAttribute("data-intake-route"));
            if (route) storeIntakeRoute(route);
          }
          window.location.assign(href);
        }
        return;
      }
      update();
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      revealAndFocus(target, { hash: href, history: true });
      if (href === "#forms-calculator-hub") {
        window.dispatchEvent(new CustomEvent("mflg:calculator-workspace", { detail: { choice: "support" } }));
      }
    });
    setNeedFromHash(window.location.hash);
    update();
  }

  async function wireFormsToolsRouteIntakeMap() {
    const host = document.querySelector("[data-forms-tools-route-intake-map]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-route-intake-map.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const routes = Array.isArray(manifest.routes) ? manifest.routes : [];

      const routeForItem = (item) => formsToolRouteFor(
        {
          county: item.route?.county || "Statewide",
          issue: item.route?.issue || "all",
          posture: item.route?.posture || "Any posture",
          children: item.route?.children || "any",
          pdfPacket: item.packet_id || "all"
        },
        item.packet_label || ""
      );

      host.innerHTML = `
        <div class="forms-route-intake-head">
          <div>
            <span>Saved form paths</span>
            <strong>Choose a form path only if it matches your situation.</strong>
            <p>These choices keep county, issue, and forms together. If none sound right, use Guided Intake instead.</p>
          </div>
          <a class="button outline" href="/start" data-link data-route-map-intake>Start Guided Intake</a>
        </div>
        <div class="forms-route-intake-metrics">
          <article><span>Form groups</span><strong>${esc(String(summary.reviewed_route_starts || routes.length))}</strong></article>
          <article><span>Viewable PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
          <article><span>County sources</span><strong>${esc(String(summary.official_sources_ok || 0))}/${esc(String(summary.official_sources_checked || 0))}</strong></article>
        </div>
	        <div class="forms-route-intake-grid">
	          ${routes.map((item) => {
	            const summaryParts = routeSummaryParts(item.route || {});
	            return `<article>
	            <div class="forms-route-intake-card-head">
	              <span>${esc(displayFormsCounty(item.route?.county) || "Official source")}</span>
	              <strong>${esc(item.packet_label || "Form path")}</strong>
	              <p>${esc(summaryParts.join(" / ") || "Forms matched to this path")}</p>
	            </div>
	            <div class="forms-route-intake-counts">
	              <small>${item.approved_pdfs ? `${esc(String(item.approved_pdfs))} form${item.approved_pdfs === 1 ? "" : "s"} ready to view` : "Use Guided Intake to confirm the next form"}</small>
	              <small>${esc((item.languages || []).join(" / ") || "Official source")}</small>
	            </div>
            <div class="forms-route-intake-actions">
	              ${item.approved_pdfs ? `<a class="card-link" href="#forms-approved-pdfs" data-route-map-card-pdfs="${esc(item.packet_id || "")}">View forms →</a>` : ""}
	              <a class="button primary" href="/start" data-link data-route-map-card-intake="${esc(item.route_start_id || "")}">Use Guided Intake</a>
	            </div>
	          </article>`;
	          }).join("")}
	        </div>
	      `;

      const firstRoute = routes[0] ? routeForItem(routes[0]) : formsToolRouteFor(window.MFLGLatestFormsRoute || {}, "");
      host.querySelector("[data-route-map-intake]")?.setAttribute("data-intake-route", JSON.stringify(firstRoute));
      host.querySelectorAll("[data-route-map-card-intake]").forEach((link) => {
        const routeStartId = link.getAttribute("data-route-map-card-intake");
        const item = routes.find((route) => route.route_start_id === routeStartId);
        link.setAttribute("data-intake-route", JSON.stringify(routeForItem(item || {})));
      });
    } catch (error) {
      host.innerHTML = `
        <div class="forms-route-intake-head">
          <div>
            <span>Starting points</span>
            <strong>Starting points could not load.</strong>
            <p>Use the form finder or Guided Intake while form paths are unavailable.</p>
          </div>
          <a class="button outline" href="/start" data-link>Start Guided Intake</a>
        </div>
      `;
    }
  }

  async function wireFormsToolsMatterCoverage() {
    const host = document.querySelector("[data-forms-tools-matter-coverage]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-matter-coverage.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const matters = Array.isArray(manifest.matters) ? manifest.matters : [];
      const categories = Array.isArray(manifest.categories) ? manifest.categories : [];

      const pickExactPacket = (matter) => {
        const packets = Array.isArray(matter.exact_packets) ? matter.exact_packets : [];
        return packets.length === 1 ? packets[0] : null;
      };
      const pickRelatedPacket = (matter) => {
        const packets = Array.isArray(matter.related_packets) ? matter.related_packets : [];
        return packets.find((packet) => packet.has_approved_pdf_actions) || packets[0] || null;
      };
      const routeForMatter = (matter) => {
        const exactPacket = pickExactPacket(matter);
        const relatedPacket = !exactPacket ? pickRelatedPacket(matter) : null;
        const selectedPacket = exactPacket || relatedPacket;
        const exactFormsAvailable = Boolean(exactPacket);
        const relatedFormsAvailable = !exactFormsAvailable && Boolean(relatedPacket);
        const nextStep = exactFormsAvailable
          ? "Open the exact on-site forms and keep the packet matched by checking county, children, case stage, agreement, orders, timing, and safety."
          : relatedFormsAvailable
          ? "Related on-site forms are available, but this issue still needs county or case-stage confirmation."
          : matter.form_confidence === "statewide-generic"
          ? "Use the statewide on-site forms first, then narrow by county if needed."
          : "This issue does not have a single exact packet yet. Use the on-site forms flow or Guided Intake.";
        const route = {
          routeKey: `forms-tools-matter-${slugify(matter.matter_id || matter.title || "matter")}`,
          entrySource: "Forms & Tools",
          entryLabel: `${matter.title || "Public matter"} forms`,
          issuePathway: matter.title || "Forms & Tools",
          issueDetail: nextStep,
          serviceInterest: "",
          contextNote: "Using your selected Forms & Tools issue. The selected issue title and category were saved on this site.",
          presetAnswers: {
            formsToolsMatterTitle: matter.title || "",
            formsToolsMatterCategory: matter.category || "",
            formsToolsMatterStatus: matter.public_status || "",
            formsToolsMatterExactPacket: exactPacket?.packet_id || "",
            formsToolsMatterRelatedPacket: relatedPacket?.packet_id || "",
            sourceType: "Forms & Tools issue finder"
          }
        };
        if (selectedPacket) {
          route.county = selectedPacket.county || matter.default_county || "Statewide";
          route.issue = selectedPacket.issue || "all";
          route.posture = selectedPacket.posture || "Any posture";
          route.children = selectedPacket.children || "any";
        } else {
          route.county = matter.default_county || "Statewide";
          route.issue = matter.title || "all";
          route.posture = matter.form_confidence === "statewide-generic" ? "Any posture" : "Any posture";
          route.children = "any";
        }
        if (exactPacket) {
          route.pdfPacket = exactPacket.packet_id;
          route.focusPacketBuilder = true;
          route.expandPdfGroup = true;
        }
        return route;
      };
      const matterConfidenceLabel = (matter) => formConfidenceLabel(matter.form_confidence || (matter.direct_pdf_available ? "county-exact" : "intake-required"), matter.default_county);
      const matterCardCopy = (matter) => {
        const exactPacket = pickExactPacket(matter);
        const relatedPacket = !exactPacket ? pickRelatedPacket(matter) : null;
        if (matter.form_confidence === "intake-required") return matter.public_guidance || "Use Guided Intake before choosing forms for this issue.";
        if (matter.form_confidence === "related-only") return matter.public_guidance || "Related on-site forms are available, but this issue still needs county or case-stage confirmation.";
        if (matter.form_confidence === "statewide-generic") return matter.public_guidance || "Use the statewide on-site forms first, then narrow by county if needed.";
        if (exactPacket && Array.isArray(matter.exact_packets) && matter.exact_packets.length === 1) {
          return "An exact on-site form group is available for this issue. Open it to keep county and case stage aligned.";
        }
        if (relatedPacket) return "Related on-site forms are available, but the issue still needs county or posture confirmation.";
        return "Use this issue to narrow the on-site forms or start Guided Intake.";
      };

      host.innerHTML = `
        <div class="forms-matter-head">
          <div>
            <span>Issue finder</span>
            <strong>Search by the family-law problem you recognize.</strong>
            <p>Open the issue card, then open the attached packet that matches it. The forms area stays on-site and does not route out to another workflow.</p>
          </div>
        </div>
        <div class="forms-matter-controls">
          <label>Search
            <input type="search" placeholder="Search matter or category" data-forms-matter-search>
          </label>
          <label>Category
            <select data-forms-matter-category>
              <option value="all">All categories</option>
              ${categories.map((item) => `<option value="${esc(item.category)}">${esc(item.category)}</option>`).join("")}
            </select>
          </label>
          <button class="button ghost" type="button" data-forms-matter-reset>Reset</button>
        </div>
        <p class="forms-router-status" data-forms-matter-status>Issue matches are ready.</p>
        <div class="forms-matter-grid">
          ${matters.map((matter, index) => `<article data-forms-matter-card data-forms-matter-index="${esc(String(index))}" data-forms-matter-category="${esc(matter.category || "")}" data-forms-matter-search="${esc(`${matter.title || ""} ${matter.category || ""} ${matter.public_status || ""}`.toLowerCase())}">
            <div>
              <span>${esc(matter.category || "Matter")}</span>
              <strong>${esc(matter.title || "")}</strong>
              <em class="form-confidence ${esc(matter.form_confidence || "related")}">${esc(matterConfidenceLabel(matter))}</em>
              <p>${esc(matterCardCopy(matter))}</p>
            </div>
            <div class="forms-matter-actions">
              <a class="card-link" href="#forms-official-router" data-forms-matter-open data-forms-matter-id="${esc(matter.matter_id || "")}">${esc(matter.form_confidence === "statewide-generic" ? "View statewide forms" : Array.isArray(matter.exact_packets) && matter.exact_packets.length === 1 ? "View verified forms" : matter.form_confidence === "related-only" ? "View related resource" : "View result")} →</a>
            </div>
          </article>`).join("")}
        </div>
        <div class="forms-matter-reveal">
          <button class="button outline" type="button" data-forms-matter-reveal>Show more issues</button>
          <small data-forms-matter-note>Showing common issues first. Search or choose a category to narrow the list.</small>
        </div>
      `;

      const fallbackMatter = matters[0] || { title: "Forms & Tools matter review", category: "Forms & Tools" };
      const search = host.querySelector("[data-forms-matter-search]");
      const category = host.querySelector("[data-forms-matter-category]");
      const reset = host.querySelector("[data-forms-matter-reset]");
      const reveal = host.querySelector("[data-forms-matter-reveal]");
      const note = host.querySelector("[data-forms-matter-note]");
      const status = host.querySelector("[data-forms-matter-status]");
      const cards = Array.from(host.querySelectorAll("[data-forms-matter-card]"));
      const openLinks = Array.from(host.querySelectorAll("[data-forms-matter-open]"));
      let expanded = false;
      const update = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const selected = category?.value || "all";
        const constrained = !expanded && !q && selected === "all";
        let visible = 0;
        cards.forEach((card) => {
          const matchesSearch = !q || (card.dataset.formsMatterSearch || "").includes(q);
          const matchesCategory = selected === "all" || card.dataset.formsMatterCategory === selected;
          const withinInitial = !constrained || Number(card.dataset.formsMatterIndex || 0) < 10;
          const show = matchesSearch && matchesCategory && withinInitial;
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (status) status.textContent = visible ? "Issue matches are ready." : "No issue matches the current filters.";
        if (reveal) reveal.hidden = expanded || Boolean(q) || selected !== "all" || matters.length <= 10;
        if (note) {
          note.textContent = constrained
            ? "Showing common issues first. Search or choose a category to narrow the list."
            : visible ? "Filtered issue matches are shown above." : "Try a broader search or use Intake.";
        }
      };
      search?.addEventListener("input", update);
      category?.addEventListener("change", update);
      reset?.addEventListener("click", () => {
        if (search) search.value = "";
        if (category) category.value = "all";
        expanded = false;
        update();
      });
      openLinks.forEach((link) => {
        link.addEventListener("click", () => {
	          const matterId = link.getAttribute("data-forms-matter-id") || "";
	          const matter = matters.find((item) => item.matter_id === matterId);
	          if (!matter) return;
	          const route = routeForMatter(matter);
	          storeFormsRoute(route, window.MFLGGuideCalculatorChoice || "", {
	            userAction: true,
	            confirmed: true,
	            confirmedFields: ["issue"],
	            suggestedFields: ["county", "posture", "children", "selectedPacket"],
	            source: "matter-card"
	          });
	          window.MFLGLatestFormsRoute = route;
	          window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: window.MFLGLatestFormsRoute }));
	        });
	      });
      reveal?.addEventListener("click", () => {
        expanded = true;
        update();
      });
      update();
      scheduleLegalTermEnhancement(host);
    } catch (error) {
      host.innerHTML = `
        <div class="forms-matter-head">
          <div>
            <span>Issue finder</span>
            <strong>The issue finder could not load.</strong>
            <p>Use Guided Intake and the office can help route the next step.</p>
          </div>
          <a class="button outline" href="/start" data-link>Start Guided Intake</a>
        </div>
      `;
      scheduleLegalTermEnhancement(host);
    }
  }

  async function wireFormsToolsCompletionStatus() {
    const host = document.querySelector("[data-forms-tools-completion-status]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-completion-status.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const summary = manifest.summary || {};
      const checks = Array.isArray(manifest.checks) ? manifest.checks : [];
      const complete = Boolean(summary.forms_tools_public_surface_complete);

      host.innerHTML = `
        <div class="forms-completion-head">
          <div>
            <span>Advanced details</span>
            <strong>${complete ? "Forms & Tools is ready for public use." : "Some Forms & Tools items are still being reviewed."}</strong>
            <p>${esc(manifest.public_message || "Use the guided path first. These details are optional.")}</p>
          </div>
          <a class="button primary" href="/start" data-link data-forms-completion-intake>Start Guided Intake</a>
        </div>
        <details class="forms-advanced-details">
          <summary>Show page readiness details</summary>
          <div class="forms-completion-metrics">
            <article><span>Checks</span><strong>${esc(String(summary.completion_checks_passing || 0))}/${esc(String(summary.completion_checks || 0))}</strong></article>
            <article><span>Issues covered</span><strong>${esc(String(summary.public_matters || 0))}</strong></article>
            <article><span>Guided starts</span><strong>${esc(String(summary.reviewed_route_starts || 0))}</strong></article>
            <article><span>Court PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
          </div>
          <div class="forms-completion-grid">
            ${checks.map((check) => `<article class="${check.status === "complete" ? "complete" : "needs-review"}">
              <span>${esc(check.status || "status")}</span>
              <strong>${esc(check.label || "")}</strong>
              <p>${esc(check.detail || "")}</p>
            </article>`).join("")}
          </div>
        </details>
      `;
      host.querySelector("[data-forms-completion-intake]")?.setAttribute("data-intake-route", JSON.stringify({
        routeKey: "forms-tools-completion-status",
        entrySource: "Forms & Tools",
        entryLabel: "Forms & Tools completion status",
        issuePathway: "Forms & Tools",
        issueDetail: complete ? "Forms & Tools public surface complete" : "Forms & Tools completion review",
        serviceInterest: "",
        contextNote: "Forms & Tools completion status only. No sensitive facts were collected.",
        presetAnswers: {
          formsToolsCompletionStatus: complete ? "Complete public surface" : "Needs review",
          sourceType: "Forms & Tools completion status / public planning"
        }
      }));
    } catch (error) {
      host.innerHTML = `
        <div class="forms-completion-head">
          <div>
            <span>Advanced details</span>
            <strong>Page readiness details could not load.</strong>
            <p>Use Guided Intake if this section does not load or if you are unsure which form path fits.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireJurisdictionReadiness() {
    const host = document.querySelector("[data-jurisdiction-readiness]");
    if (!host) return;
    try {
      const response = await fetch(`/data/jurisdiction-readiness.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const jurisdictions = Array.isArray(manifest.jurisdictions) ? manifest.jurisdictions : [];
      const summary = manifest.summary || {};

      host.innerHTML = `
        <div class="jurisdiction-readiness-head">
          <div>
            <span>County readiness</span>
            <strong>Choose your county before opening forms.</strong>
            <p>${esc(manifest.public_message || "County rules can affect the right form path. If the county is unclear, use Guided Intake before choosing forms.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-jurisdiction-intake>Use County Status in Intake</a>
        </div>
        <div class="jurisdiction-readiness-metrics">
          <article><span>County choices</span><strong>${esc(String(summary.official_jurisdictions || jurisdictions.length))}</strong></article>
          <article><span>On-site form paths</span><strong>${esc(String(summary.jurisdictions_with_reviewed_packet_actions || 0))}</strong></article>
          <article><span>Use Intake first</span><strong>${esc(String(summary.county_source_only || 0))}</strong></article>
        </div>
        <div class="jurisdiction-readiness-grid">
          ${jurisdictions.map((item) => `<article class="jurisdiction-readiness-card"
            data-jurisdiction-card="${esc(item.county || "Statewide")}"
            data-jurisdiction-label="${esc(item.label || "")}"
            data-jurisdiction-url="${esc(item.official_url || "")}">
            <span>${esc(item.county || "Statewide")}</span>
            <strong>${esc(item.label || "County form help")}</strong>
            <p>${esc(item.public_guidance || "")}</p>
            <small>${esc(String(item.reviewed_packet_routes || 0))} on-site path${item.reviewed_packet_routes === 1 ? "" : "s"} · ${esc(String(item.approved_pdf_actions || 0))} PDF${item.approved_pdf_actions === 1 ? "" : "s"}</small>
            <div class="jurisdiction-readiness-actions">
              <a class="card-link" href="#forms-approved-pdfs">View on-site forms →</a>
              <a class="card-link" href="/start" data-link data-jurisdiction-card-intake>Start Guided Intake →</a>
            </div>
          </article>`).join("")}
        </div>
      `;

      const headerIntake = host.querySelector("[data-jurisdiction-intake]");
      const cards = Array.from(host.querySelectorAll("[data-jurisdiction-card]"));
      const routeForCard = (card) => formsToolRouteFor({
        county: card.dataset.jurisdictionCard || "Statewide",
        issue: "all",
        posture: "Any posture",
        children: "any",
        pdfPacket: "all"
      }, card.dataset.jurisdictionLabel || "Official source");
      const updateLinks = () => {
        const active = cards.find((card) => card.classList.contains("active")) || cards[0];
        if (active) headerIntake?.setAttribute("data-intake-route", JSON.stringify(routeForCard(active)));
        cards.forEach((card) => {
          card.querySelector("[data-jurisdiction-card-intake]")?.setAttribute("data-intake-route", JSON.stringify(routeForCard(card)));
        });
      };
      const selectCounty = (county) => {
        cards.forEach((card) => {
          const active = card.dataset.jurisdictionCard === county || (county === "Statewide" && card.dataset.jurisdictionCard === "Statewide");
          card.classList.toggle("active", active);
        });
        updateLinks();
      };
      window.addEventListener("mflg:forms-route-change", (event) => {
        selectCounty(event.detail?.county || "Statewide");
      });
      selectCounty(window.MFLGLatestFormsRoute?.county || "Statewide");
    } catch (error) {
      host.innerHTML = `
        <div class="jurisdiction-readiness-head">
          <div>
            <span>County readiness</span>
            <strong>Jurisdiction source status could not load.</strong>
            <p>Use statewide and official county sources while the readiness summary is unavailable.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireCalculatorReadiness() {
    const host = document.querySelector("[data-calculator-readiness]");
    if (!host) return;
    try {
      const response = await fetch(`/data/calculator-readiness.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const calculators = Array.isArray(manifest.calculators) ? manifest.calculators : [];
      const summary = manifest.summary || {};

      host.innerHTML = `
        <div class="calculator-readiness-head">
          <div>
            <span>Calculators</span>
            <strong>Choose the calculator that matches your question.</strong>
            <p>${esc(manifest.public_message || "Use official calculator tools in the on-page workspace, then Intake when the numbers or forms are unclear.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-calculator-intake>Add calculator choice to Intake</a>
        </div>
        <div class="calculator-readiness-metrics">
          <article><span>Official sources</span><strong>${esc(String(summary.official_formula_sources || 0))}</strong></article>
          <article><span>Planning tools</span><strong>${esc(String(summary.safe_planning_tools || 0))}</strong></article>
          <article><span>On-page official tools</span><strong>${summary.official_embeds_enabled ? "Enabled" : "Ready"}</strong></article>
        </div>
        <div class="calculator-readiness-grid">
          ${calculators.map((item) => `<article class="calculator-readiness-card"
            data-calculator-card="${esc(item.calculator_id)}"
            data-calculator-label="${esc(item.label || "")}"
            data-calculator-status="${esc(item.public_status || "")}">
            <span>Planning tool</span>
            <strong>${esc(item.label || "Calculator")}</strong>
            <p>${esc(item.public_guidance || "")}</p>
            <small>${esc(item.source_authority || "")} · ${esc(item.source_monitor_status || "")}</small>
            <div class="calculator-readiness-actions">
              ${item.official_url ? `<button class="card-link" type="button" data-calculator-workspace-choice="${item.calculator_id === "az-spousal-maintenance-official" ? "maintenance" : "support"}">Open calculators →</button>` : ""}
              <a class="card-link" href="/start" data-link data-calculator-card-intake>Add this calculator to Intake →</a>
            </div>
          </article>`).join("")}
        </div>
      `;

      const headerIntake = host.querySelector("[data-calculator-intake]");
      const cards = Array.from(host.querySelectorAll("[data-calculator-card]"));
      const routeForCard = (card) => {
        const label = card.dataset.calculatorLabel || "Calculator";
        return {
          routeKey: `calculator-${slugify(label)}`,
          entrySource: "Forms & Tools",
          entryLabel: `Calculator readiness: ${label}`,
          issuePathway: "Forms & Tools",
          issueDetail: `Calculator / ${card.dataset.calculatorStatus || "planning"}`,
          serviceInterest: "",
          contextNote: "Public calculator route only. Formula-sensitive calculators use on-page official calculator tools; no sensitive facts or calculation inputs were collected by this website.",
          presetAnswers: {
            selectedCalculator: label,
            calculatorStatus: card.dataset.calculatorStatus || "",
            sourceType: "Calculator readiness / public planning"
          }
        };
      };
      const updateLinks = () => {
        const active = cards.find((card) => card.classList.contains("active")) || cards[0];
        if (active) headerIntake?.setAttribute("data-intake-route", JSON.stringify(routeForCard(active)));
        cards.forEach((card) => {
          card.querySelector("[data-calculator-card-intake]")?.setAttribute("data-intake-route", JSON.stringify(routeForCard(card)));
        });
      };
      cards.forEach((card) => {
        card.addEventListener("click", (event) => {
          const workspaceChoice = event.target.closest("[data-calculator-workspace-choice]");
	          if (workspaceChoice) {
	            event.preventDefault();
	            cards.forEach((item) => item.classList.toggle("active", item === card));
	            updateLinks();
	            commitPublicAnswers({
	              need: "calculator",
	              selectedCalculator: workspaceChoice.dataset.calculatorWorkspaceChoice || "support",
	              sourcePathway: "Forms & Tools"
	            }, {
	              userAction: true,
	              confirmed: true,
	              confirmedFields: ["need", "selectedCalculator"],
	              source: "calculator-readiness-card"
	            });
	            window.dispatchEvent(new CustomEvent("mflg:calculator-workspace", {
	              detail: { choice: workspaceChoice.dataset.calculatorWorkspaceChoice || "support" }
	            }));
	            return;
          }
          if (event.target.closest("a")) return;
          cards.forEach((item) => item.classList.toggle("active", item === card));
          updateLinks();
        });
      });
      if (cards[0]) cards[0].classList.add("active");
      updateLinks();
    } catch (error) {
      host.innerHTML = `
        <div class="calculator-readiness-head">
          <div>
            <span>Calculators</span>
            <strong>Calculators could not load right now.</strong>
            <p>Use Guided Intake if you need help choosing the right calculation path.</p>
          </div>
        </div>
      `;
    }
  }

  async function wireCalculatorFormulaReadiness() {
    const host = document.querySelector("[data-calculator-formula-readiness]");
    if (!host) return;
    try {
      const [formulaResponse, internalResponse, fixtureQaResponse, unlockResponse] = await Promise.all([
        fetch(`/data/calculator-formula-readiness.json?v=${Date.now()}`, { cache: "no-store" }),
        fetch(`/data/calculator-internal-status.json?v=${Date.now()}`, { cache: "no-store" }),
        fetch(`/data/calculator-fixture-qa-status.json?v=${Date.now()}`, { cache: "no-store" }),
        fetch(`/data/calculator-public-unlock-status.json?v=${Date.now()}`, { cache: "no-store" })
      ]);
      if (!formulaResponse.ok) throw new Error(`HTTP ${formulaResponse.status}`);
      const manifest = await formulaResponse.json();
      const internalStatus = internalResponse.ok ? await internalResponse.json() : null;
      const fixtureQaStatus = fixtureQaResponse.ok ? await fixtureQaResponse.json() : null;
      const unlockStatus = unlockResponse.ok ? await unlockResponse.json() : null;
      const summary = manifest.summary || {};
      const internalSummary = internalStatus?.summary || {};
      const fixtureQaSummary = fixtureQaStatus?.summary || {};
      const unlockSummary = unlockStatus?.summary || {};
      const sources = Array.isArray(manifest.formula_sources) ? manifest.formula_sources : [];
      host.innerHTML = `
        <div class="calculator-formula-head">
          <div>
            <span>Calculators</span>
            <strong>${summary.child_support_runtime_enabled ? "Start with the calculator that matches your question." : "Start with Intake if a calculator does not load."}</strong>
            <p>${summary.child_support_runtime_enabled ? `Use the on-site child-support calculator${summary.spousal_maintenance_runtime_enabled ? " and maintenance calculator" : ""} for planning. Use Intake if the numbers, dates, existing orders, or required forms are unclear.` : "Use Guided Intake if you need help choosing the right calculation path."}</p>
          </div>
          <a class="button outline" href="/start" data-link data-calculator-formula-intake>Start Guided Intake to confirm</a>
        </div>
        <div class="calculator-formula-metrics">
          <article><span>Available now</span><strong>${summary.official_embeds_enabled ? "Official tools" : "Review needed"}</strong></article>
          <article><span>Child support</span><strong>${summary.child_support_formula_map_ready ? "Map ready" : (summary.source_inventory_ready ? "Being checked" : "Pending")}</strong></article>
          <article><span>Fixture template</span><strong>${summary.fixture_entry_template_ready ? `${esc(String(summary.fixture_templates_ready || 0))} ready` : "Pending"}</strong></article>
          <article><span>Approved fixtures</span><strong>${summary.complete_approved_fixtures ? `${esc(String(summary.complete_approved_fixtures))} approved` : "Not yet"}</strong></article>
          <article><span>Regression checks</span><strong>${summary.complete_regression_comparisons ? `${esc(String(summary.complete_regression_comparisons))} passed` : "Waiting"}</strong></article>
          <article><span>Unlock gate</span><strong>${unlockSummary.public_unlock_ready ? "Ready" : "Locked"}</strong></article>
          <article><span>Testing</span><strong>${fixtureQaSummary.public_unlock_ready ? "Complete" : "Official comparison needed"}</strong></article>
          <article><span>On-site results</span><strong>${summary.public_results_enabled ? "Available" : "Not yet"}</strong></article>
          <article><span>Safety records</span><strong>${internalSummary.internal_artifacts_ready ? "Status only" : "Checking"}</strong></article>
        </div>
        ${summary.child_support_runtime_enabled ? `
        <form class="mflg-child-support-calculator" id="mflg-child-support-calculator" data-mflg-child-support-calculator>
          <div class="mflg-child-support-head">
            <div>
              <span>Planning tool</span>
              <strong>Estimate Arizona child support</strong>
              <p>Enter only planning numbers. Do not enter names, case numbers, addresses, allegations, or private documents.</p>
            </div>
            <button class="button primary" type="submit">Calculate</button>
          </div>
          <div class="mflg-child-support-grid">
            <label><span>Parent A monthly income</span><input type="number" min="0" step="1" inputmode="decimal" name="parent_a_monthly_income" value="4000"></label>
            <label><span>Parent B monthly income</span><input type="number" min="0" step="1" inputmode="decimal" name="parent_b_monthly_income" value="3000"></label>
            <label><span>Children</span><select name="children_count">${[1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>
            <label><span>Parenting plan</span><select name="parenting_plan_type"><option>Parent A</option><option>Parent B</option><option>Equal</option></select></label>
            <label><span>Parenting time</span><input type="number" min="0" step="1" inputmode="decimal" name="parenting_time_value" value="0"></label>
            <label><span>Health insurance</span><input type="number" min="0" step="1" inputmode="decimal" name="medical_insurance_cost" value="0"></label>
            <label><span>Childcare</span><input type="number" min="0" step="1" inputmode="decimal" name="childcare_cost" value="0"></label>
            <label><span>Other-child adjustment</span><input type="number" min="0" step="1" inputmode="decimal" name="other_children_adjustment" value="0"></label>
          </div>
          <div class="mflg-child-support-result" data-mflg-child-support-result>
            <span>Result</span>
            <strong>Enter numbers and calculate.</strong>
            <p>This calculator gives a planning result only.</p>
          </div>
        </form>` : ""}
        ${summary.spousal_maintenance_runtime_enabled ? `
        <form class="mflg-child-support-calculator mflg-maintenance-calculator" id="mflg-spousal-maintenance-calculator" data-mflg-maintenance-calculator>
          <div class="mflg-child-support-head">
            <div>
              <span>Planning tool</span>
              <strong>Estimate Arizona spousal maintenance</strong>
              <p>Enter planning numbers only. Do not enter names, case numbers, addresses, allegations, or private documents.</p>
            </div>
            <button class="button primary" type="submit">Calculate</button>
          </div>
          <div class="mflg-child-support-grid">
            <label><span>County</span><select name="county">${["Not sure", "Apache", "Cochise", "Coconino", "Gila", "Graham", "Greenlee", "La Paz", "Maricopa", "Mohave", "Navajo", "Pima", "Pinal", "Santa Cruz", "Yavapai", "Yuma"].map((county) => `<option${county === "Not sure" ? " selected" : ""}>${county}</option>`).join("")}</select></label>
            <label><span>Requesting party</span><select name="partyRequestingMaintenance"><option>Petitioner</option><option selected>Respondent</option></select></label>
            <label><span>Marriage date</span><input type="text" name="dateOfMarriage" placeholder="MM/DD/YYYY"></label>
            <label><span>Service date</span><input type="text" name="dateOfServiceOfProcess" placeholder="MM/DD/YYYY"></label>
            <label><span>Petitioner annual income</span><input type="number" min="0" step="1" inputmode="decimal" name="petitionerActualIncome" value="85000"></label>
            <label><span>Respondent annual income</span><input type="number" min="0" step="1" inputmode="decimal" name="respondentActualIncome" value="35000"></label>
            <label><span>Petitioner attributed income</span><input type="number" min="0" step="1" inputmode="decimal" name="petitionerAttributedIncome" value="0"></label>
            <label><span>Respondent attributed income</span><input type="number" min="0" step="1" inputmode="decimal" name="respondentAttributedIncome" value="0"></label>
            <label><span>Family size</span><input type="number" min="1" step="1" inputmode="numeric" name="familySize" value="2"></label>
            <label><span>Mortgage principal</span><input type="number" min="0" step="1" inputmode="decimal" name="familyMortgagePrincipal" value="0"></label>
            <label><span>Petitioner DOB</span><input type="text" name="petitionerDOB" placeholder="MM/DD/YYYY"></label>
            <label><span>Respondent DOB</span><input type="text" name="respondentDOB" placeholder="MM/DD/YYYY"></label>
          </div>
          <div class="mflg-child-support-result" data-mflg-maintenance-result>
            <span>Result</span>
            <strong>Enter numbers and calculate.</strong>
            <p>This calculator is powered by the official Arizona maintenance API and gives a planning result only.</p>
          </div>
        </form>` : ""}
        <div class="calculator-formula-grid">
          ${sources.map((item) => `<article class="calculator-formula-card">
            <span>Planning tool</span>
            <strong>${esc(item.branded_calculator_name || item.public_name || "MFLG calculator")}</strong>
            <p>${item.public_result_enabled
              ? "Use this calculator here and confirm the result before filing or signing anything."
              : "Use the official calculator source. The MFLG-branded version will appear here only after testing and approval."}</p>
            <small>${esc(item.public_name || "Official Arizona calculator")} remains the source to use today.</small>
          </article>`).join("")}
        </div>
      `;
      host.querySelector("[data-calculator-formula-intake]")?.setAttribute("data-intake-route", JSON.stringify({
        routeKey: "calculator-formula-review",
        entrySource: "Forms & Tools",
        entryLabel: "MFLG calculator formula review",
        issuePathway: "Forms & Tools",
        issueDetail: "Calculator formula review / local branded calculator build",
        serviceInterest: "",
        contextNote: "Public calculator formula readiness route only. No private calculation facts or inputs were collected.",
        presetAnswers: {
          selectedCalculator: "MFLG branded calculator review",
          calculatorStatus: "Formula build under review",
          sourceType: "Calculator formula readiness"
        }
      }));
      wireMflgChildSupportRuntime(host);
      wireMflgMaintenanceRuntime(host);
    } catch (error) {
      host.innerHTML = `
        <div class="calculator-formula-head">
          <div>
            <span>Calculators</span>
            <strong>Calculators could not load right now.</strong>
            <p>Use Guided Intake if you need help choosing the right calculation path.</p>
          </div>
        </div>
      `;
    }
  }

  function loadMflgCalculatorEngine() {
    if (window.MFLGCalculatorEngine) return Promise.resolve(window.MFLGCalculatorEngine);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-mflg-calculator-engine]");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.MFLGCalculatorEngine));
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = `/js/mflg-calculator-engine.js?v=${Date.now()}`;
      script.async = true;
      script.dataset.mflgCalculatorEngine = "true";
      script.addEventListener("load", () => resolve(window.MFLGCalculatorEngine));
      script.addEventListener("error", reject);
      document.head.appendChild(script);
    });
  }

  function wireMflgChildSupportRuntime(scope) {
    const form = scope?.querySelector("[data-mflg-child-support-calculator]");
    if (!form) return;
    const result = form.querySelector("[data-mflg-child-support-result]");
    const readInput = () => Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, value]));
    const render = (calculation) => {
      const display = calculation.display || {};
      result.innerHTML = `
        <span>Planning result</span>
        <strong>${esc(display.paying_parent || "Review needed")}: ${display.monthly_obligation ? `$${esc(String(display.monthly_obligation))} / month` : "no transfer shown"}</strong>
        <p>${esc(display.review_note || "Confirm the result before relying on it.")}</p>
        <div class="mflg-child-support-breakdown">
          <small>Basic obligation: $${esc(String(calculation.outputs?.BasicChildSupportObligation ?? 0))}</small>
          <small>Parent A share: ${esc(String(Math.round((calculation.outputs?.ObligationPercentageA || 0) * 100)))}%</small>
          <small>Parent B share: ${esc(String(Math.round((calculation.outputs?.ObligationPercentageB || 0) * 100)))}%</small>
        </div>
      `;
    };
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      result.innerHTML = `<span>Calculating</span><strong>Checking the on-site runtime...</strong><p>No information is submitted from this calculator.</p>`;
      try {
        const engine = await loadMflgCalculatorEngine();
        if (!engine?.childSupport || !engine.publicResultsEnabled) throw new Error("Runtime unavailable");
        render(engine.childSupport(readInput()));
      } catch (error) {
        result.innerHTML = `<span>Review needed</span><strong>The on-site calculator could not load.</strong><p>Use the official calculator above or start Intake for routing help.</p>`;
      }
    });
  }

  function moneyFromOfficial(value) {
    const numeric = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? `$${Math.round(numeric).toLocaleString()}` : esc(String(value || "$0"));
  }

  function wireMflgMaintenanceRuntime(scope) {
    const form = scope?.querySelector("[data-mflg-maintenance-calculator]");
    if (!form) return;
    const result = form.querySelector("[data-mflg-maintenance-result]");
    const readInput = () => Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, value]));
    const render = (calculation) => {
      const display = calculation.display || {};
      const output = calculation.outputs || {};
      result.innerHTML = `
        <span>Planning result</span>
        <strong>${moneyFromOfficial(display.monthly_low)} - ${moneyFromOfficial(display.monthly_high)} / month</strong>
        <p>Average target: ${moneyFromOfficial(display.monthly_average)}. Duration range: ${esc(String(display.duration_low || "Review needed"))} to ${esc(String(display.duration_high || "Review needed"))}.</p>
        <div class="mflg-child-support-breakdown">
          <small>Official API version: ${esc(String(calculation.officialVersion || output.Version || "current"))}</small>
          <small>Rule of 65: ${display.rule_of_65_eligible ? "May apply" : "Not shown"}</small>
          <small>${display.requestor_mismatch ? "Requesting party needs review" : "Requesting party accepted"}</small>
        </div>
        ${output.AmountSubjectToGuidelinesMessage ? `<p>${esc(String(output.AmountSubjectToGuidelinesMessage))}</p>` : ""}
        <p>${esc(display.review_note || "Confirm the result before relying on it.")}</p>
      `;
    };
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      result.innerHTML = `<span>Calculating</span><strong>Checking the official Arizona API...</strong><p>This website does not store maintenance calculator inputs.</p>`;
      try {
        const engine = await loadMflgCalculatorEngine();
        if (!engine?.spousalMaintenance) throw new Error("Maintenance runtime unavailable");
        render(await engine.spousalMaintenance(readInput()));
      } catch (error) {
        result.innerHTML = `<span>Review needed</span><strong>The on-site maintenance calculator could not load.</strong><p>Use Guided Intake for routing help or use the official calculator source below.</p>`;
      }
    });
  }

  function wireCalculatorPrecheck() {
    const host = document.querySelector("[data-calculator-precheck]");
    if (!host) return;
    const inputs = Array.from(host.querySelectorAll("[data-calculator-precheck-input]"));
    const label = host.querySelector("[data-calculator-precheck-label]");
    const title = host.querySelector("[data-calculator-precheck-title]");
    const copy = host.querySelector("[data-calculator-precheck-copy]");
    const action = host.querySelector("[data-calculator-precheck-action]");
    const intake = host.querySelector("[data-calculator-precheck-intake]");
    const checklistLabel = host.querySelector("[data-calculator-precheck-checklist-label]");
    const checklistTitle = host.querySelector("[data-calculator-precheck-checklist-title]");
    const checklistCopy = host.querySelector("[data-calculator-precheck-checklist-copy]");
    const checklist = host.querySelector("[data-calculator-precheck-checklist]");
    const read = (name) => host.querySelector(`[data-calculator-precheck-input="${name}"]`)?.value || "";
    const recommendations = {
      support: {
        choice: "support",
        label: "Planning tool",
        title: "Use the child-support calculator on this page.",
        copy: "Use the on-site calculator for planning. If income, parenting time, insurance, childcare, existing orders, or effective dates are unclear, use Intake before relying on a number.",
        button: "Open calculator",
        intakeLabel: "Child support calculator pre-check",
        checklistLabel: "Before you start",
        checklistTitle: "Gather the child-support inputs first.",
        checklistCopy: "Gather the details first, then use the on-site calculator for planning.",
        checklistItems: [
          "Current income information for each parent.",
          "Parenting-time or overnight count.",
          "Health insurance, childcare, and support-order information.",
          "Any existing child-support order or recent worksheet."
        ]
      },
      maintenance: {
        choice: "maintenance",
        label: "Planning tool",
        title: "Use the spousal-maintenance calculator on this page.",
        copy: "Use the on-site maintenance calculator for planning. If marriage dates, income, eligibility, existing orders, or effective dates are unclear, use Intake before relying on a result.",
        button: "Open calculator",
        intakeLabel: "Spousal maintenance calculator pre-check",
        checklistLabel: "Before you start",
        checklistTitle: "Gather the maintenance inputs first.",
        checklistCopy: "Gather the details first, then use the on-site calculator for planning.",
        checklistItems: [
          "Marriage date and expected separation or decree timing.",
          "Income information for each spouse.",
          "Any existing temporary or final maintenance order.",
          "Basic expense and self-sufficiency information for planning."
        ]
      },
      parenting: {
        choice: "parenting",
        label: "Planning tool",
        title: "Use the parenting-time counter.",
        copy: "The counter can organize estimated overnights without private facts. Use official calculator review when the count affects support or court paperwork.",
        button: "Open parenting-time counter",
        intakeLabel: "Parenting-time counter pre-check",
        checklistLabel: "Before you count",
        checklistTitle: "Use schedule counts, not private details.",
        checklistCopy: "The public counter only needs numbers. Keep names, allegations, addresses, and private facts out of this page.",
        checklistItems: [
          "Regular overnights in a two-week schedule.",
          "Holiday overnights per year.",
          "Vacation overnights per year.",
          "Any other annual overnights you need to account for."
        ]
      },
      deadline: {
        choice: "deadline",
        label: "Planning tool",
        title: "Use the deadline readiness planner.",
        copy: "This planner does not calculate or extend legal deadlines. It helps decide whether to start Intake or review court-source timing information now.",
        button: "Open deadline planner",
        intakeLabel: "Deadline planner pre-check",
        checklistLabel: "Before you wait",
        checklistTitle: "Check timing without entering private facts.",
        checklistCopy: "The public planner only sorts urgency. It does not calculate, extend, or guarantee any legal deadline.",
        checklistItems: [
          "Whether you were served, have a hearing, or received an order.",
          "How soon action may be needed.",
          "County or court location if you know it.",
          "Use Intake or court-source review now if timing is close."
        ]
      },
      intake: {
        choice: "intake",
        label: "Start Intake",
        title: "Use Intake before choosing a calculator.",
        copy: "When the right calculator or required numbers are unclear, do not guess. Carry only this calculator question into Intake.",
        button: "Start Intake",
        intakeLabel: "Calculator pre-check unsure",
        checklistLabel: "Use Guided Intake first",
        checklistTitle: "Do not guess at formula inputs.",
        checklistCopy: "When the needed calculator or numbers are unclear, use Intake before entering facts into a calculator.",
        checklistItems: [
          "Which issue you are trying to solve.",
          "Whether there is an existing order.",
          "Whether children, support, maintenance, or timing are involved.",
          "Avoid typing private numbers on the public page."
        ]
      }
    };
    const routeFor = (item, goal, numbers, order) => ({
      routeKey: `calculator-precheck-${slugify(item.intakeLabel)}`,
      entrySource: "Forms & Tools",
      entryLabel: item.intakeLabel,
      issuePathway: "Forms & Tools",
      issueDetail: `Calculator pre-check / ${item.intakeLabel}`,
      serviceInterest: "",
        contextNote: "Using your calculator pre-check answers. The website saved calculator category, readiness level, and existing-order uncertainty only; no private calculation facts or values were collected.",
      presetAnswers: {
        selectedCalculator: item.intakeLabel,
        calculatorReadiness: numbers,
        existingOrderStatus: order,
        sourceType: "Calculator pre-check / public planning",
        publicToolGoal: goal
      }
    });
    const resolveRecommendation = () => {
      const goal = read("goal");
      const numbers = read("numbers");
      const order = read("order");
      if (goal === "unsure" || numbers === "no" || (numbers === "partial" && goal !== "parenting")) {
        return { item: recommendations.intake, goal, numbers, order };
      }
      return { item: recommendations[goal] || recommendations.intake, goal, numbers, order };
    };
    const update = () => {
      const { item, goal, numbers, order } = resolveRecommendation();
      if (label) label.textContent = item.label;
      if (title) title.textContent = item.title;
      if (copy) copy.textContent = item.copy;
      if (action) {
        action.textContent = item.button;
        action.dataset.calculatorPrecheckChoice = item.choice;
      }
      if (checklistLabel) checklistLabel.textContent = item.checklistLabel;
      if (checklistTitle) checklistTitle.textContent = item.checklistTitle;
      if (checklistCopy) checklistCopy.textContent = item.checklistCopy;
      if (checklist) {
        checklist.innerHTML = (item.checklistItems || []).map((check) => `<li>${esc(check)}</li>`).join("");
      }
      intake?.setAttribute("data-intake-route", JSON.stringify(routeFor(item, goal, numbers, order)));
    };
    inputs.forEach((input) => input.addEventListener("change", update));
    action?.addEventListener("click", () => {
      const { item } = resolveRecommendation();
      if (item.choice === "intake") {
        intake?.click();
        return;
      }
      window.dispatchEvent(new CustomEvent("mflg:calculator-workspace", { detail: { choice: item.choice } }));
    });
    update();
  }

  function wireCalculatorChooser() {
    const host = document.querySelector("[data-calculator-chooser]");
    if (!host) return;
    const choices = Array.from(host.querySelectorAll("[data-calculator-choice]"));
    const jumpButtons = Array.from(document.querySelectorAll("[data-calculator-jump]"));
    const pathIntake = document.querySelector("[data-calculator-path-intake]");
    const kicker = host.querySelector("[data-calculator-choice-kicker]");
    const title = host.querySelector("[data-calculator-choice-title]");
    const copy = host.querySelector("[data-calculator-choice-copy]");
    const primary = host.querySelector("[data-calculator-choice-primary]");
    const intake = host.querySelector("[data-calculator-choice-intake]");
    const workspace = document.querySelector("[data-official-calculator-workspace]");
    const workspaceTitle = workspace?.querySelector("[data-official-calculator-title]");
    const workspaceCopy = workspace?.querySelector("[data-official-calculator-copy]");
    const workspaceSource = workspace?.querySelector("[data-official-calculator-source]");
    const workspaceIntake = workspace?.querySelector("[data-official-calculator-intake]");
    const workspaceNextIntake = workspace?.querySelector("[data-official-calculator-next-intake]");
    const workspaceFrame = workspace?.querySelector("[data-official-calculator-frame]");
    const workspaceFrameNote = workspace?.querySelector("[data-official-calculator-frame-note]");
    const workspaceEmbedTitle = workspace?.querySelector("[data-official-calculator-embed-title]");
    const workspaceEmbedCopy = workspace?.querySelector("[data-official-calculator-embed-copy]");
    const options = {
      support: {
        kicker: "Planning tool",
        title: "Use the child-support calculator here.",
        copy: "The on-site calculator appears above the official calculator workspace. It does not submit your numbers and should be confirmed before filing, signing, or relying on the result.",
        primaryText: "Open calculator",
        href: "#mflg-child-support-calculator",
        workspaceChoice: false,
        intakeLabel: "MFLG Child Support Calculator"
      },
      maintenance: {
        kicker: "Planning tool",
        title: "Use the spousal-maintenance calculator here.",
        copy: "The on-site calculator is powered by the official Arizona maintenance API. It keeps the experience on this page and should be confirmed before filing, signing, or relying on the result.",
        workspaceTitle: "Arizona Spousal Maintenance Calculator",
        workspaceCopy: "Use the on-site calculator above for planning. The official calculator remains available as a fallback for final confirmation before filing or relying on a number.",
        embedTitle: "Spousal maintenance calculator",
        embedCopy: "The on-site calculator uses the official Arizona maintenance API. Confirm version, income, marriage length, and maintenance factors before relying on the result.",
        frameNote: "Official fallback remains available if confirmation is needed.",
        primaryText: "Open calculator",
        href: "#mflg-spousal-maintenance-calculator",
        embedUrl: "https://www.superiorcourt.maricopa.gov/app/selfsuffcalc/",
        workspaceChoice: false,
        intakeLabel: "MFLG Spousal Maintenance Calculator"
      },
      parenting: {
        kicker: "Planning tool",
        title: "Use the parenting-time counter.",
        copy: "Use only counts and assumptions. Do not enter names, allegations, addresses, or financial details.",
        primaryText: "Open Counter",
        href: "#parenting-time-counter",
        workspaceChoice: false,
        intakeLabel: "Parenting Time Counter"
      },
      deadline: {
        kicker: "Planning tool",
        title: "Use the deadline readiness planner.",
        copy: "This does not calculate or extend legal deadlines. It helps you decide whether to use Guided Intake now.",
        primaryText: "Open Planner",
        href: "#deadline-readiness-planner",
        workspaceChoice: false,
        intakeLabel: "Deadline Readiness Planner"
      }
    };
    const routeFor = (item) => ({
      routeKey: `calculator-choice-${slugify(item.intakeLabel)}`,
      entrySource: "Forms & Tools",
      entryLabel: `Calculator choice: ${item.intakeLabel}`,
      issuePathway: "Forms & Tools",
      issueDetail: `Calculator choice / ${item.intakeLabel}`,
      serviceInterest: "",
      contextNote: "Using your calculator choice. The website saved only the selected tool type, not private calculation facts or values.",
      presetAnswers: {
        selectedCalculator: item.intakeLabel,
        sourceType: "Calculator chooser / public planning"
      }
    });
	    pathIntake?.setAttribute("data-intake-route", JSON.stringify({
      routeKey: "calculator-path-unsure",
      entrySource: "Forms & Tools",
      entryLabel: "Calculator help: not sure",
      issuePathway: "Forms & Tools",
      issueDetail: "Calculator routing help requested",
      serviceInterest: "",
      contextNote: "Using your calculator path. The website saved only that you were unsure which calculator or next step applied.",
      presetAnswers: {
        selectedCalculator: "Not sure",
	        sourceType: "Calculator path / public planning"
	      }
	    }));
	    const commitCalculatorChoice = (key, source) => {
	      commitPublicAnswers({
	        need: "calculator",
	        selectedCalculator: key || "support",
	        sourcePathway: "Forms & Tools"
	      }, {
	        userAction: true,
	        confirmed: true,
	        confirmedFields: ["need", "selectedCalculator"],
	        source: source || "calculator-chooser"
	      });
	    };
	    const select = (key, scrollToTarget) => {
	      const item = options[key] || options.support;
      choices.forEach((choice) => {
        const active = choice.dataset.calculatorChoice === key;
        choice.classList.toggle("active", active);
        choice.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (kicker) kicker.textContent = item.kicker;
      if (title) title.textContent = item.title;
      if (copy) copy.textContent = item.copy;
      if (primary) {
        primary.textContent = item.primaryText;
        primary.setAttribute("href", item.workspaceChoice ? "#official-calculator-source-viewer" : item.href);
        primary.dataset.calculatorWorkspaceChoice = item.workspaceChoice ? key : "";
        primary.removeAttribute("target");
        primary.removeAttribute("rel");
      }
      if (workspace && item.workspaceChoice) {
        workspace.classList.remove("is-fallback-collapsed");
        if (workspaceTitle) workspaceTitle.textContent = item.workspaceTitle || item.intakeLabel;
        if (workspaceCopy) workspaceCopy.textContent = item.workspaceCopy || item.copy;
        if (workspaceEmbedTitle) workspaceEmbedTitle.textContent = item.embedTitle || item.workspaceTitle || item.intakeLabel;
        if (workspaceEmbedCopy) workspaceEmbedCopy.textContent = item.embedCopy || item.workspaceCopy || item.copy;
        if (workspaceFrameNote) workspaceFrameNote.textContent = item.frameNote || "Official calculator loaded in the on-page frame.";
        if (workspaceFrame && item.embedUrl && workspaceFrame.getAttribute("src") !== item.embedUrl) {
          workspaceFrame.setAttribute("src", item.embedUrl);
          workspaceFrame.setAttribute("title", item.workspaceTitle || item.intakeLabel);
        }
        if (workspaceSource) {
          workspaceSource.setAttribute("href", "/start");
          workspaceSource.setAttribute("data-intake-route", JSON.stringify(routeFor(item)));
        }
        workspaceIntake?.setAttribute("data-intake-route", JSON.stringify(routeFor(item)));
        workspaceNextIntake?.setAttribute("data-intake-route", JSON.stringify(routeFor(item)));
      } else if (workspace) {
        workspace.classList.add("is-fallback-collapsed");
      }
      intake?.setAttribute("data-intake-route", JSON.stringify(routeFor(item)));
      if (scrollToTarget) {
        if (item.workspaceChoice) {
          revealAndFocus(workspace, { hash: "#calculator-workspace", history: true });
        } else {
          revealAndFocus(document.querySelector(item.href), { hash: item.href, history: true });
        }
      }
	    };
	    choices.forEach((choice) => {
	      choice.addEventListener("click", () => {
	        const key = choice.dataset.calculatorChoice || "support";
	        commitCalculatorChoice(key, "calculator-chooser");
	        select(key, false);
	      });
	    });
	    jumpButtons.forEach((button) => {
	      button.addEventListener("click", () => {
	        const key = button.dataset.calculatorJump || "support";
	        commitCalculatorChoice(key, "calculator-jump");
	        select(key, true);
	      });
	    });
    primary?.addEventListener("click", (event) => {
      const href = primary.getAttribute("href") || "";
	      const workspaceChoice = primary.dataset.calculatorWorkspaceChoice;
	      if (workspaceChoice) {
	        event.preventDefault();
	        commitCalculatorChoice(workspaceChoice, "calculator-primary");
	        select(workspaceChoice, true);
	        return;
	      }
      if (href.startsWith("#")) {
        event.preventDefault();
        revealAndFocus(document.querySelector(href), { hash: href, history: true });
      }
	    });
	    window.addEventListener("mflg:calculator-workspace", (event) => {
	      const key = event.detail?.choice || "support";
	      if (event.detail?.skipPublicAnswerCommit !== true) commitCalculatorChoice(key, event.detail?.source || "calculator-workspace");
	      select(key, true);
	    });
    select(window.MFLGGuideCalculatorChoice || "support", Boolean(window.MFLGGuideCalculatorChoice));
  }

  function wireParentingTimeCounter() {
    const host = document.querySelector("[data-parenting-time-counter]");
    if (!host) return;
    const inputs = Array.from(host.querySelectorAll("[data-parenting-time-input]"));
    const totalNode = host.querySelector("[data-parenting-time-total]");
    const percentNode = host.querySelector("[data-parenting-time-percent]");
    const guidanceNode = host.querySelector("[data-parenting-time-guidance]");
    const reset = host.querySelector("[data-parenting-time-reset]");
    const intake = host.querySelector("[data-parenting-time-intake]");
    const nextIntake = host.querySelector("[data-parenting-time-next-intake]");
    const nextLabel = host.querySelector("[data-parenting-time-next-label]");
    const nextTitle = host.querySelector("[data-parenting-time-next-title]");
    const nextCopy = host.querySelector("[data-parenting-time-next-copy]");
    const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
    const route = {
      routeKey: "calculator-parenting-time-counter",
      entrySource: "Forms & Tools",
      entryLabel: "Parenting time counter",
      issuePathway: "Parenting Time",
      issueDetail: "Public parenting-time planning tool selected",
      serviceInterest: "",
      contextNote: "Public parenting-time counter route only. The website did not store names, dates of birth, allegations, addresses, financial details, or the calculated overnight total.",
      presetAnswers: {
        selectedCalculator: "Parenting Time Counter",
        calculatorStatus: "Planning tool",
        sourceType: "Parenting time counter / public planning"
      }
    };
    intake?.setAttribute("data-intake-route", JSON.stringify(route));
    nextIntake?.setAttribute("data-intake-route", JSON.stringify(route));

    const readValue = (name) => {
      const input = host.querySelector(`[data-parenting-time-input="${name}"]`);
      return Number.parseFloat(input?.value || "0");
    };
    const update = () => {
      const regular = clamp(readValue("regular"), 0, 14);
      const holiday = clamp(readValue("holiday"), 0, 120);
      const vacation = clamp(readValue("vacation"), 0, 120);
      const other = clamp(readValue("other"), 0, 365);
      const annual = clamp(Math.round((regular * 26.071) + holiday + vacation + other), 0, 365);
      const percent = Math.round((annual / 365) * 1000) / 10;
      if (totalNode) totalNode.textContent = String(annual);
      if (percentNode) percentNode.textContent = `${percent}% of a 365-day year.`;
      if (guidanceNode) {
        guidanceNode.textContent = annual > 0
          ? "Use this number only as an organizer. Child support, final orders, and contested schedules require official-source review."
          : "Enter only counts, not names or private facts. Use official Arizona sources when support is involved.";
      }
      if (nextLabel && nextTitle && nextCopy) {
        if (annual > 0) {
          nextLabel.textContent = "Review before relying";
          nextTitle.textContent = `${annual} estimated annual overnight${annual === 1 ? "" : "s"} entered.`;
          nextCopy.textContent = "Use the official calculator if support is involved. Use Guided Intake if you are unsure whether these counts belong in your situation.";
        } else {
          nextLabel.textContent = "Planning number only";
          nextTitle.textContent = "Use this count as an organizer, not a final support number.";
          nextCopy.textContent = "When support, orders, or contested schedules are involved, confirm the inputs against official sources or use Intake before relying on the result.";
        }
      }
    };
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        const min = Number.parseFloat(input.min || "0");
        const max = Number.parseFloat(input.max || "365");
        const next = clamp(Number.parseFloat(input.value || "0"), min, max);
        if (String(input.value).trim() !== "" && Number.parseFloat(input.value) !== next) {
          input.value = String(next);
        }
        update();
      });
    });
    reset?.addEventListener("click", () => {
      inputs.forEach((input) => {
        input.value = "0";
      });
      update();
    });
    update();
  }

  function wireDeadlineReadinessPlanner() {
    const host = document.querySelector("[data-deadline-readiness]");
    if (!host) return;
    const event = host.querySelector('[data-deadline-input="event"]');
    const timing = host.querySelector('[data-deadline-input="timing"]');
    const county = host.querySelector('[data-deadline-input="county"]');
    const level = host.querySelector("[data-deadline-level]");
    const title = host.querySelector("[data-deadline-title]");
    const copy = host.querySelector("[data-deadline-copy]");
    const intakeLinks = Array.from(host.querySelectorAll("[data-deadline-intake], [data-deadline-header-intake]"));
    const sourceLink = host.querySelector("[data-deadline-source]");
    const nextLabel = host.querySelector("[data-deadline-next-label]");
    const nextTitle = host.querySelector("[data-deadline-next-title]");
    const nextCopy = host.querySelector("[data-deadline-next-copy]");
    const nextStepOne = host.querySelector("[data-deadline-next-step-one]");
    const nextStepTwo = host.querySelector("[data-deadline-next-step-two]");
    const nextStepThree = host.querySelector("[data-deadline-next-step-three]");
    const routeForSelection = () => {
      const timingValue = timing?.value || "unknown";
      const eventValue = event?.value || "unsure";
      const countyValue = county?.value || "Statewide";
      return {
        routeKey: `deadline-readiness-${slugify([countyValue, eventValue, timingValue].join("-"))}`,
        entrySource: "Forms & Tools",
        entryLabel: "Deadline readiness planner",
        issuePathway: "Forms & Tools",
        issueDetail: `Deadline planning / ${countyValue} / ${eventValue} / ${timingValue}`,
        serviceInterest: "",
        contextNote: "Public deadline-readiness route only. No documents, case numbers, names, allegations, private facts, or legal-deadline calculation were collected.",
        presetAnswers: {
          deadlinePlannerEvent: eventValue,
          deadlinePlannerTiming: timingValue,
          formCounty: countyValue,
          sourceType: "Deadline readiness planner / public planning"
        }
      };
    };
    const update = () => {
      const timingValue = timing?.value || "unknown";
      const eventValue = event?.value || "unsure";
      const countyValue = county?.value || "Statewide";
      let next = {
        level: "Review now",
        title: "Start with official court information and Intake.",
        copy: "Use the on-page form path and Guided Intake if you are unsure what kind of deadline applies.",
        sourceHref: "#forms-official-router",
        nextLabel: "Do next",
        nextTitle: "Confirm the actual deadline before choosing forms.",
        nextCopy: "This planner does not calculate deadlines. Use the court notice or rule, then use Intake if timing is unclear.",
        steps: [
          "Use the on-page form viewer for your county or issue.",
          "Use Guided Intake if the deadline, hearing, or response step is unclear.",
          "Choose forms only after the filing stage and timing are clear."
        ]
      };
      if (timingValue === "today" || timingValue === "week") {
        next = {
          level: "Time-sensitive",
          title: "Treat this as time-sensitive.",
          copy: "Use Guided Intake now and check the court notice or rule. This planner does not calculate or extend legal deadlines.",
          sourceHref: eventValue === "served" ? "#forms-official-router" : "#forms-packets",
          nextLabel: "Act now",
          nextTitle: "Do not wait for ordinary website review.",
          nextCopy: "Use Intake and official court information now. If safety or emergency facts are involved, use emergency resources or the court directly.",
          steps: [
            "Open Guided Intake or contact the office now.",
            "Check the court notice or rule before relying on any form packet.",
            "Do not assume this page calculated or extended the deadline."
          ]
        };
      } else if (timingValue === "unknown") {
        next = {
          level: "Unknown deadline",
          title: "Do not guess on timing.",
          copy: "If you do not know the deadline, use Intake before choosing forms.",
          sourceHref: "#forms-official-router",
          nextLabel: "Confirm first",
          nextTitle: "Find the controlling date before choosing forms.",
          nextCopy: "The safest next step is to identify the notice, service date, hearing date, or court instruction before selecting paperwork.",
          steps: [
            "Look for the served date, hearing date, or court notice.",
            "Use Guided Intake if you cannot identify the controlling date.",
            "Avoid choosing forms until timing is clear."
          ]
        };
      } else if (eventValue === "hearing") {
        next = {
          level: "Calendar check",
          title: "Confirm the hearing or conference instructions.",
          copy: "Review the notice and use Guided Intake if you need help deciding what to prepare.",
          sourceHref: "#forms-official-router",
          nextLabel: "Prepare carefully",
          nextTitle: "Start with the notice and court instructions.",
          nextCopy: "Hearing preparation depends on the type of setting, judge instructions, disclosure status, and what has already been filed.",
          steps: [
            "Review the hearing notice or court order.",
            "Use the on-page form finder.",
            "Use Guided Intake if you need help deciding what to prepare."
          ]
        };
      }
      if (level) level.textContent = next.level;
      if (title) title.textContent = next.title;
      if (copy) copy.textContent = next.copy;
      if (sourceLink) sourceLink.setAttribute("href", next.sourceHref);
      if (nextLabel) nextLabel.textContent = next.nextLabel;
      if (nextTitle) nextTitle.textContent = next.nextTitle;
      if (nextCopy) nextCopy.textContent = next.nextCopy;
      if (nextStepOne) nextStepOne.textContent = next.steps[0];
      if (nextStepTwo) nextStepTwo.textContent = next.steps[1];
      if (nextStepThree) nextStepThree.textContent = next.steps[2];
      const route = routeForSelection();
      intakeLinks.forEach((link) => link.setAttribute("data-intake-route", JSON.stringify(route)));
      window.MFLGDeadlineReadiness = {
        county: countyValue,
        event: eventValue,
        timing: timingValue
      };
    };
    [event, timing, county].forEach((input) => input?.addEventListener("change", update));
    update();
  }

  async function wireSourceHealthPanel() {
    const host = document.querySelector("[data-source-health-public]");
    if (!host) return;
    try {
      const response = await fetch(`/data/source-health-public.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health = await response.json();
      const summary = health.summary || {};
      const groups = Array.isArray(health.groups) ? health.groups : [];
      const broken = Number(summary.broken || 0);
      const status = broken > 0 ? "Needs review" : "All clear";
      const checked = health.checked_at ? new Date(health.checked_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }) : "Recently checked";

      host.innerHTML = `
        <div class="source-health-summary">
          <span>${esc(status)}</span>
          <strong>Form and court-resource checks are current.</strong>
          <p>${esc(health.public_message || "On-site form actions remain available. Use Guided Intake if you are unsure which path fits.")}</p>
          <small>Last checked: ${esc(checked)}</small>
        </div>
        <div class="source-health-grid">
          ${groups.map((group) => `<article>
            <span>${esc(group.label)}</span>
            <strong>${esc(String(group.total))} checked</strong>
            <p>${group.broken ? `${esc(String(group.broken))} item${group.broken === 1 ? "" : "s"} need review. Use Guided Intake if unsure.` : "Ready for on-site use."}</p>
          </article>`).join("")}
        </div>
      `;
      host.classList.toggle("needs-review", broken > 0);
    } catch (error) {
      host.innerHTML = `
        <div class="source-health-summary">
          <span>Resource status</span>
          <strong>Resource status could not load.</strong>
          <p>Use Guided Intake if you are unsure which form path fits.</p>
        </div>
      `;
    }
  }

  async function wireFormsToolsCoverage() {
    const host = document.querySelector("[data-forms-tools-coverage]");
    if (!host) return;
    try {
      const response = await fetch(`/data/forms-tools-coverage.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const coverage = await response.json();
      const summary = coverage.summary || {};
      const routes = Array.isArray(coverage.routes) ? coverage.routes : [];
      host.innerHTML = `
        <div class="forms-coverage-summary">
          <span>Coverage</span>
          <strong>Forms are organized by situation so you do not have to know the form name first.</strong>
          <p>Start with the guided helper. This keeps the next step tied to your selections while you compare form groups manually.</p>
        </div>
        <div class="forms-coverage-metrics">
          <article><span>County sources</span><strong>${esc(String(summary.official_sources_ok || 0))}/${esc(String(summary.official_sources_checked || 0))}</strong></article>
          <article><span>Form pages</span><strong>${esc(String(summary.official_packet_page_actions || 0))}</strong></article>
          <article><span>Viewable PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
        </div>
        <div class="forms-coverage-routes" aria-label="Forms and Tools covered form paths">
          ${routes.map((route) => {
            const routeDetail = route.route || {};
            const summaryParts = routeSummaryParts(routeDetail);
            return `<article>
            <span>${esc(displayFormsCounty(routeDetail.county || route.county || ""))}</span>
            <strong>${esc(route.packet_label || route.packet_id)}</strong>
            <p>${esc(summaryParts.length ? summaryParts.join(" / ") : "Choose answers to narrow the result")}</p>
            <small>${route.has_approved_pdf_actions ? `${esc(String(route.approved_pdf_actions))} PDF${route.approved_pdf_actions === 1 ? "" : "s"} ready to view` : "Use Guided Intake to confirm forms"}</small>
          </article>`;
          }).join("")}
        </div>
      `;
    } catch (error) {
      host.innerHTML = `
        <div class="forms-coverage-summary">
          <span>Coverage</span>
          <strong>Forms & Tools coverage could not load.</strong>
          <p>Use the form finder and reviewed form links while the coverage summary is unavailable.</p>
        </div>
      `;
    }
  }

  async function wireFormRouteActions() {
    const host = document.querySelector("[data-form-route-actions]");
    if (!host) return;
    try {
      const response = await fetch(`/data/form-route-actions.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
      const summary = manifest.summary || {};

      if (!routes.length) {
        host.innerHTML = `
          <div class="route-action-empty">
            <span>Form paths</span>
            <strong>Reviewed form paths are not available yet.</strong>
            <p>Use the form finder while the reviewed form paths load.</p>
          </div>
        `;
        return;
      }

      host.innerHTML = `
        <div class="route-action-head">
          <div>
            <span>Form paths</span>
          <strong>Choose one form path, then open the matching forms.</strong>
            <p>${esc(manifest.public_message || "Choose a form path to see reviewed forms.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-route-action-intake>Use selected form path in Intake</a>
        </div>
        <div class="route-action-controls" aria-label="Filter form paths">
          <label>Search
            <input type="search" placeholder="Search divorce, parenting, support, agreement..." data-route-action-search>
          </label>
          <label>Form path
            <select data-route-action-select>
              <option value="all">Show every form path</option>
              ${routes.map((route) => `<option value="${esc(route.packet_id)}">${esc(route.packet_label)}</option>`).join("")}
            </select>
          </label>
          <button class="button ghost" type="button" data-route-action-reset>Reset</button>
        </div>
        <p class="forms-router-status" data-route-action-status>${esc(String(routes.length))} form paths shown.</p>
        <div class="route-action-grid">
          ${routes.map((route) => {
            const packetPages = Array.isArray(route.official_packet_pages) ? route.official_packet_pages : [];
            const pdfs = Array.isArray(route.official_pdfs) ? route.official_pdfs : [];
	            const routeDetail = {
	              ...(route.route || {}),
	              packetLabel: route.packet_label || ""
	            };
	            const routeText = [
	              displayFormsCounty(routeDetail.county),
	              publicIssueLabelForRoute(routeDetail),
	              displayFormsPosture(routeDetail.posture),
	              displayFormsChildren(routeDetail.children)
	            ].filter((item) => item && item !== "Choose issue").join(" / ");
            const searchText = [
              route.packet_label,
              routeText,
              route.public_status,
              ...(route.languages || []),
              ...packetPages.map((item) => `${item.label} ${item.official_packet_page_url}`),
              ...pdfs.map((item) => `${item.display_label} ${item.file_name} ${item.language}`)
            ].filter(Boolean).join(" ").toLowerCase();
            return `<details class="route-action-card"
              data-route-action-card="${esc(route.packet_id)}"
              data-route-action-search="${esc(searchText)}"
              data-route-county="${esc(route.route?.county || "")}"
              data-route-issue="${esc(route.route?.issue || "")}"
              data-route-posture="${esc(route.route?.posture || "")}"
              data-route-children="${esc(route.route?.children || "")}">
              <summary class="route-action-card-head">
                <span>${esc(route.route?.county || "Official source")}</span>
                <strong>${esc(route.packet_label)}</strong>
                <p>${esc(routeText || "Reviewed court form route")}</p>
              </summary>
              <div class="route-action-counts">
                <small>${esc(String(route.counts?.official_packet_pages || 0))} packet page${(route.counts?.official_packet_pages || 0) === 1 ? "" : "s"}</small>
                <small>${esc(String(route.counts?.official_pdfs || 0))} approved PDF${(route.counts?.official_pdfs || 0) === 1 ? "" : "s"}</small>
                <small>${esc((route.languages || []).join(" / ") || "Review pending")}</small>
              </div>
              <div class="route-action-links">
                ${pdfs.length ? `<a class="route-action-pdf-focus" href="#forms-approved-pdfs" data-route-action-pdf-focus="${esc(route.packet_id)}">Open ${esc(String(pdfs.length))} forms for this situation</a>` : `<small class="route-action-more">Use Guided Intake for this situation while form review is pending.</small>`}
              </div>
              <a class="button primary route-action-intake" href="/start" data-link data-route-action-card-intake>Start Guided Intake to confirm</a>
            </details>`;
          }).join("")}
        </div>
      `;

      const search = host.querySelector("[data-route-action-search]");
      const select = host.querySelector("[data-route-action-select]");
      const reset = host.querySelector("[data-route-action-reset]");
      const status = host.querySelector("[data-route-action-status]");
      const headerIntake = host.querySelector("[data-route-action-intake]");
      const cards = Array.from(host.querySelectorAll("[data-route-action-card]"));
      const pdfFocusLinks = Array.from(host.querySelectorAll("[data-route-action-pdf-focus]"));
      const routeByPacket = new Map(routes.map((route) => [route.packet_id, route]));

      const routeDataForCard = (card) => {
        const packetId = card.dataset.routeActionCard || "all";
        const route = routeByPacket.get(packetId) || {};
        return formsToolRouteFor(
          {
            county: route.route?.county || card.dataset.routeCounty || "Statewide",
            issue: route.route?.issue || card.dataset.routeIssue || "all",
            posture: route.route?.posture || card.dataset.routePosture || "Any posture",
            children: route.route?.children || card.dataset.routeChildren || "any",
            pdfPacket: packetId
          },
          route.packet_label || ""
        );
      };
      const setIntakeLinks = () => {
        let selectedCard = cards.find((card) => !card.hidden && card.classList.contains("active"));
        if (!selectedCard) selectedCard = cards.find((card) => !card.hidden);
        const selectedRoute = selectedCard ? routeDataForCard(selectedCard) : formsToolRouteFor(window.MFLGLatestFormsRoute || {}, "");
        headerIntake?.setAttribute("data-intake-route", JSON.stringify(selectedRoute));
        cards.forEach((card) => {
          card.querySelector("[data-route-action-card-intake]")?.setAttribute("data-intake-route", JSON.stringify(routeDataForCard(card)));
        });
      };
      const update = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const selected = select?.value || "all";
        let visible = 0;
        cards.forEach((card) => {
          const matchesSearch = !q || (card.dataset.routeActionSearch || "").includes(q);
          const matchesSelect = selected === "all" || card.dataset.routeActionCard === selected;
          const show = matchesSearch && matchesSelect;
          card.hidden = !show;
          card.classList.toggle("active", selected !== "all" && card.dataset.routeActionCard === selected);
          card.open = Boolean(show && selected !== "all" && card.dataset.routeActionCard === selected);
          if (show) visible += 1;
        });
        if (status) {
          status.textContent = visible
            ? `${visible} form path${visible === 1 ? "" : "s"} shown.`
            : "No form path matches the current filters.";
        }
        setIntakeLinks();
      };
      const applyRoutePreset = (detail) => {
        const packetId = detail?.pdfPacket || "all";
        if (select && packetId !== "all" && routeByPacket.has(packetId)) {
          select.value = packetId;
          update();
        }
      };

      search?.addEventListener("input", update);
      select?.addEventListener("change", update);
	      pdfFocusLinks.forEach((link) => {
	        link.addEventListener("click", () => {
		          const packetId = link.getAttribute("data-route-action-pdf-focus") || "all";
		          const route = routeByPacket.get(packetId);
		          const canonical = mergePublicAnswersWithLegacy(storedPublicAnswers(), {});
		          const packetRoute = route?.route || {};
		          const packetSourceCounty = normalizeFormsCounty(packetRoute.county);
		          const nextRoute = {
		            county: confirmedPublicValue("county", canonical.county) || "Not sure",
		            issue: confirmedPublicValue("issue", canonical.issue) || normalizeFormsIssue(packetRoute.issue || "all"),
		            posture: confirmedPublicValue("posture", canonical.posture) || normalizeFormsPosture(packetRoute.posture),
		            children: confirmedPublicValue("children", canonical.children) || normalizeFormsChildren(packetRoute.children),
		            pdfPacket: packetId,
		            packetSourceCounty,
		            sourceJurisdiction: packetSourceCounty,
		            packetLabel: route?.packet_label || "",
		            sourcePathway: "packet-metadata",
		            expandPdfGroup: true
	          };
	          storeFormsRoute(nextRoute, canonical.selectedCalculator || "", {
	            userAction: true,
	            confirmed: true,
	            confirmedFields: ["selectedPacket"],
	            suggestedFields: ["county", "issue", "posture", "children"],
	            source: "packet-metadata"
	          });
	          window.MFLGLatestFormsRoute = nextRoute;
	          window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: window.MFLGLatestFormsRoute }));
	        });
	      });
      reset?.addEventListener("click", () => {
        if (search) search.value = "";
        if (select) select.value = "all";
        update();
      });
      window.addEventListener("mflg:forms-route-change", (event) => applyRoutePreset(event.detail));
      if (window.MFLGLatestFormsRoute) applyRoutePreset(window.MFLGLatestFormsRoute);
      update();
    } catch (error) {
      host.innerHTML = `
        <div class="route-action-empty">
          <span>Starting points</span>
          <strong>Matched form paths could not load.</strong>
          <p>Use the form finder while the starting-point list is unavailable.</p>
        </div>
      `;
    }
  }

  async function wireOfficialPacketActions() {
    const host = document.querySelector("[data-official-packet-actions]");
    if (!host) return;
    try {
      const response = await fetch(`/data/form-packet-page-actions.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const actions = Array.isArray(manifest.actions) ? manifest.actions : [];

      if (!actions.length) {
        host.innerHTML = `
          <div class="packet-action-empty">
            <strong>Official packet-page actions are under review.</strong>
            <p>Use the form finder above while packet-page review is pending.</p>
          </div>
        `;
        return;
      }

      host.innerHTML = `
        <div class="packet-action-head">
          <span>Official packet pages</span>
          <strong>${esc(String(actions.length))} reviewed packet page${actions.length === 1 ? "" : "s"} indexed.</strong>
          <p>Use the reviewed PDF viewer above or Intake when the form group title does not clearly match your situation.</p>
        </div>
        <div class="packet-action-grid" aria-label="Reviewed official packet page actions">
          ${actions.map((item) => {
            const route = formsToolRouteFor(item.route || {}, item.label || item.packet_label || "Official packet page");
            route.entryLabel = `Official packet page: ${item.label || item.packet_label || "Packet page"}`;
            route.presetAnswers = {
              ...(route.presetAnswers || {}),
              approvedPacketPageLabel: item.label || "",
              approvedPacketPageUrl: item.official_packet_page_url || "",
              approvedPacketPageReviewId: item.review_id || "",
              sourceType: "Official court source / approved packet page action"
            };
            return `<article class="card packet-action-card">
              <span>Official court page</span>
              <h3>${esc(item.label || "Official packet page")}</h3>
              <p>${esc(item.packet_label || "")}</p>
              <div class="packet-action-links">
                <a class="card-link" href="#forms-approved-pdfs">View reviewed PDFs →</a>
                <a class="card-link packet-intake-link" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>Use This Packet in Intake →</a>
              </div>
            </article>`;
          }).join("")}
        </div>
      `;
    } catch (error) {
      host.innerHTML = `
        <div class="packet-action-empty">
          <strong>Official packet-page actions could not load.</strong>
          <p>Use the form finder above while the packet-page information is unavailable.</p>
        </div>
      `;
    }
  }

  async function wireOfficialPdfActions() {
    const host = document.querySelector("[data-official-pdf-actions]");
    if (!host) return;
    try {
      const [response, routeIndexResponse] = await Promise.all([
        fetch(`/data/form-pdf-public-actions.json?v=${Date.now()}`, { cache: "no-store" }),
        fetch(`/data/form-pdf-route-index.json?v=${Date.now()}`, { cache: "no-store" })
      ]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!routeIndexResponse.ok) throw new Error(`Route index HTTP ${routeIndexResponse.status}`);
      const manifest = await response.json();
      const routeIndex = await routeIndexResponse.json();
      const actions = Array.isArray(manifest.actions) ? manifest.actions : [];
      const routePackets = Array.isArray(routeIndex.packets) ? routeIndex.packets : [];
      const routePacketById = new Map(routePackets.map((item) => [item.packet_id, item]));
      const summary = manifest.summary || {};
      const recommendedPacketId = routePackets.find((item) => item.packet_id === "maricopa-divorce-new-with-children")?.packet_id
        || routePackets.find((item) => item.packet_id === "maricopa-divorce-new-no-children")?.packet_id
        || routePackets[0]?.packet_id
        || actions[0]?.packet_id
        || "all";

      if (!actions.length || summary.public_pdf_actions_enabled !== true) {
      host.innerHTML = `
        <div class="section-head compact">
          <p class="eyebrow">Reviewed forms</p>
          <h2>Reviewed forms are not available right now.</h2>
          <p>The packet information could not load. Reload the page or try again in a moment.</p>
        </div>
      `;
        return;
      }

      const groups = new Map();
      actions.forEach((action) => {
        const key = action.packet_id || "official-pdfs";
        if (!groups.has(key)) {
          groups.set(key, {
            title: action.page_label || action.packet_label || "Official PDFs",
            packet: action.packet_label || "",
            actions: []
          });
        }
        groups.get(key).actions.push(action);
      });

      host.innerHTML = `
        <div class="section-head compact">
          <p class="eyebrow">Step 2</p>
          <h2>Open the exact packet for that issue.</h2>
            <p>Start with the recommended packet. View each form on this site, then download only when needed.</p>
        </div>
        <div class="official-pdf-spotlight" data-official-pdf-spotlight>
          <div>
            <span data-official-pdf-spotlight-kicker>Your next form step</span>
            <strong data-official-pdf-spotlight-title>Finding the closest form group...</strong>
            <p data-official-pdf-spotlight-copy>The packet below should match the choices you made above. Other form groups are secondary.</p>
            <ol class="forms-next-mini-list">
              <li>View the first form or instruction sheet.</li>
              <li>Check that the title matches your situation.</li>
              <li>Keep moving through the packet without leaving the site.</li>
            </ol>
            <small>You are not filing anything by opening these forms.</small>
          </div>
        </div>
        <p class="forms-router-status" data-official-pdf-status>Forms are ready.</p>
        <div class="official-pdf-intake-panel" hidden aria-hidden="true">
          <div>
            <strong data-official-pdf-intake-title>Packet support</strong>
            <p data-official-pdf-intake-copy>Packet support placeholder.</p>
          </div>
          <a class="button primary" href="/start" data-link data-official-pdf-intake>Start Guided Intake</a>
        </div>
        <div class="official-pdf-viewer" data-official-pdf-viewer hidden>
          <div class="official-pdf-viewer-head">
            <div>
              <span>Form viewer</span>
              <strong data-official-pdf-viewer-title>Selected court PDF</strong>
              <p data-official-pdf-viewer-copy>This reviewed court PDF opens here so you can keep your place.</p>
            </div>
            <button class="button ghost" type="button" data-official-pdf-viewer-close>Close viewer</button>
          </div>
          <iframe title="Official court PDF viewer" loading="lazy" data-official-pdf-frame></iframe>
          <div class="official-pdf-viewer-actions">
            <a class="button outline source-fallback-link" data-official-pdf-download aria-disabled="true">Download PDF</a>
            <a class="button outline source-fallback-link" href="/start" data-link data-official-pdf-source-fallback hidden aria-hidden="true">Confirm this form in Intake</a>
            <a class="button outline" href="/start" data-link data-official-pdf-viewer-intake hidden aria-hidden="true">Add this form to Intake</a>
          </div>
        </div>
        <div class="official-pdf-group-grid">
          ${Array.from(groups.entries()).map(([key, group]) => `
            <details class="official-pdf-group" data-official-pdf-group="${esc(key)}">
              <summary>
                <span>Form group</span>
                <strong>${esc(group.title)}</strong>
                <p>${esc(group.packet)}</p>
              </summary>
              <div class="official-pdf-link-grid">
                ${group.actions.map((action) => `
                  <article class="official-pdf-link"
                    data-official-pdf-link
                    data-packet="${esc(key)}"
                    data-language="${esc(action.language || "")}"
                    data-label="${esc(action.public_name || action.display_label || action.label || action.file_name || "Official PDF")}"
                    data-source-label="${esc(action.source_label || action.label || "")}"
                    data-file-name="${esc(action.file_name || "")}"
                    data-pdf-url="${esc(sitePdfViewUrlFor(action))}"
                    data-official-pdf-url="${esc(action.official_pdf_url || "")}"
                    data-site-pdf-view-url="${esc(sitePdfViewUrlFor(action))}"
                    data-site-pdf-download-url="${esc(sitePdfDownloadUrlFor(action))}"
                    data-search="${esc([action.public_name, action.public_description, action.public_stage, action.display_label, action.label, action.source_label, action.file_name, action.packet_label, action.page_label, action.language].filter(Boolean).join(" ").toLowerCase())}">
                    <button class="official-pdf-source" type="button" data-official-pdf-preview>
                      <span>${esc(action.public_stage || action.language || "Court form")}</span>
                      <strong>${esc(action.public_name || action.display_label || action.label || action.file_name || "Official PDF")}</strong>
                      <p>${esc(action.public_description || "Official court PDF from the reviewed packet.")}</p>
                      <small>${esc(officialPdfSourceLabel(action))}</small>
                      <em>${esc([action.language, action.public_file_code || action.file_name].filter(Boolean).join(" / "))}</em>
                      <b>View form</b>
                    </button>
                    <a class="official-pdf-direct-download" href="${esc(sitePdfDownloadUrlFor(action) || sitePdfViewUrlFor(action) || "#")}" download="${esc(action.file_name || "official-court-form.pdf")}">Download PDF</a>
                    <a class="official-pdf-intake-link" href="/start" data-link data-official-pdf-item-intake>Add this form to Intake</a>
                  </article>
                `).join("")}
              </div>
            </details>
          `).join("")}
        </div>
        <div class="official-pdf-advanced-action">
          <button class="button outline" type="button" data-official-pdf-show-all>Browse other form groups</button>
        </div>
        <details class="official-pdf-route-index" aria-label="Choose a court packet" data-official-pdf-route-index>
          <summary>
            <span>Need a different form group?</span>
            <strong>Choose another situation only if the recommendation above does not fit.</strong>
            <p>These choices are secondary. Pick the packet that matches the exact issue.</p>
          </summary>
          <div class="official-pdf-route-grid">
            ${routePackets.map((item) => `
              <button class="official-pdf-route-card" type="button" data-official-pdf-route-card="${esc(item.packet_id)}">
                <h3>${esc(item.page_label || item.packet_label || "Court form group")}</h3>
                <p>${esc(item.packet_label || "")}</p>
                <strong>${esc((item.languages || []).join(" / ") || "Official PDFs")}</strong>
                <em>Use this form group</em>
              </button>
            `).join("")}
          </div>
        </details>
        <details class="official-pdf-browse">
          <summary>Advanced: search or switch form groups</summary>
          <div class="official-pdf-controls" aria-label="Filter reviewed form links">
            <label>Search
              <input type="search" placeholder="Search form name, form group, language..." data-official-pdf-search>
            </label>
            <label>Form group
              <select data-official-pdf-packet>
                <option value="all">All form groups</option>
                ${Array.from(groups.entries()).map(([key, group]) => `<option value="${esc(key)}">${esc(group.title)}</option>`).join("")}
              </select>
            </label>
            <label>Language
              <select data-official-pdf-language>
                <option value="all">All languages</option>
                <option value="English" selected>English</option>
                <option value="Spanish">Spanish</option>
              </select>
            </label>
            <button class="button ghost" type="button" data-official-pdf-reset>Reset</button>
          </div>
        </details>
      `;
      const search = host.querySelector("[data-official-pdf-search]");
      const packet = host.querySelector("[data-official-pdf-packet]");
      const language = host.querySelector("[data-official-pdf-language]");
      const reset = host.querySelector("[data-official-pdf-reset]");
      const status = host.querySelector("[data-official-pdf-status]");
      const spotlightKicker = host.querySelector("[data-official-pdf-spotlight-kicker]");
      const spotlightTitle = host.querySelector("[data-official-pdf-spotlight-title]");
      const spotlightCopy = host.querySelector("[data-official-pdf-spotlight-copy]");
      const showAll = host.querySelector("[data-official-pdf-show-all]");
      const routeIndexDisclosure = host.querySelector("[data-official-pdf-route-index]");
      const intakeTitle = host.querySelector("[data-official-pdf-intake-title]");
      const intakeCopy = host.querySelector("[data-official-pdf-intake-copy]");
      const intakeLink = host.querySelector("[data-official-pdf-intake]");
      const viewer = host.querySelector("[data-official-pdf-viewer]");
      const viewerTitle = host.querySelector("[data-official-pdf-viewer-title]");
      const viewerCopy = host.querySelector("[data-official-pdf-viewer-copy]");
      const viewerFrame = host.querySelector("[data-official-pdf-frame]");
      const viewerClose = host.querySelector("[data-official-pdf-viewer-close]");
      const viewerDownload = host.querySelector("[data-official-pdf-download]");
      const viewerSourceFallback = host.querySelector("[data-official-pdf-source-fallback]");
      const viewerIntake = host.querySelector("[data-official-pdf-viewer-intake]");
      const links = Array.from(host.querySelectorAll("[data-official-pdf-link]"));
      const groupCards = Array.from(host.querySelectorAll("[data-official-pdf-group]"));
      const routeCards = Array.from(host.querySelectorAll("[data-official-pdf-route-card]"));
      let currentRouteDetail = window.MFLGLatestFormsRoute || {
        county: "Statewide",
        issue: "all",
        posture: "Any posture",
        children: "any",
        pdfPacket: "all"
      };
      let expandFocusedPdfGroup = false;
      let allowUnmatchedPdfBrowse = false;
      const updateIntakePanel = () => {
        const packetValue = packet?.value || "all";
        const packetLabel = packetValue !== "all"
          ? packet?.options[packet.selectedIndex]?.textContent || ""
          : "";
        const packetRoute = routePacketById.get(packetValue);
        const route = formsToolRouteFor({ ...currentRouteDetail, pdfPacket: packetValue }, packetLabel);
        if (intakeLink) {
          intakeLink.setAttribute("data-intake-route", JSON.stringify(route));
        }
        if (intakeTitle) {
          intakeTitle.textContent = packetLabel
            ? `${packetLabel} selected`
            : "Packet details";
        }
        if (intakeCopy) {
          intakeCopy.textContent = packetLabel && packetRoute
            ? "Packet source information is ready for the viewer."
            : packetLabel
            ? "Packet source information is ready."
            : "Packet details are ready.";
        }
      };
      const updateItemIntakeLinks = () => {
        links.forEach((link) => {
          const packetValue = link.dataset.packet || "all";
          const packetOption = packet ? Array.from(packet.options).find((option) => option.value === packetValue) : null;
          const route = formsToolRouteFor(
            { ...currentRouteDetail, pdfPacket: packetValue },
            packetOption?.textContent || "",
            {
              displayLabel: link.dataset.label || "",
              label: link.dataset.sourceLabel || link.dataset.label || "",
              fileName: link.dataset.fileName || "",
              language: link.dataset.language || "",
              officialUrl: link.dataset.officialPdfUrl || link.dataset.pdfUrl || ""
            }
          );
          link.querySelector("[data-official-pdf-item-intake]")?.setAttribute("data-intake-route", JSON.stringify(route));
        });
      };
      const routeForPdfLink = (link) => {
        const packetValue = link.dataset.packet || "all";
        const packetOption = packet ? Array.from(packet.options).find((option) => option.value === packetValue) : null;
        return formsToolRouteFor(
          { ...currentRouteDetail, pdfPacket: packetValue },
          packetOption?.textContent || "",
          {
            displayLabel: link.dataset.label || "",
            label: link.dataset.sourceLabel || link.dataset.label || "",
            fileName: link.dataset.fileName || "",
            language: link.dataset.language || "",
            officialUrl: link.dataset.officialPdfUrl || link.dataset.pdfUrl || ""
          }
        );
      };
      const closePdfViewer = () => {
        if (viewer) viewer.hidden = true;
        viewerFrame?.removeAttribute("src");
      };
      const openPdfViewer = (link) => {
        const url = link.dataset.pdfUrl || "";
        const siteViewUrl = link.dataset.sitePdfViewUrl || url;
        const siteDownloadUrl = link.dataset.sitePdfDownloadUrl || siteViewUrl;
        if (!siteViewUrl || !viewer || !viewerFrame) return;
        const label = link.dataset.label || "Official court PDF";
        const fileName = link.dataset.fileName || "";
        viewer.hidden = false;
        if (viewerTitle) viewerTitle.textContent = label;
        if (viewerCopy) {
          viewerCopy.textContent = fileName
            ? `Viewing ${fileName} through the approved site viewer. Use another packet if this title does not match.`
            : "Viewing the official court PDF through the approved site viewer.";
        }
        viewerFrame.setAttribute("src", siteViewUrl);
        if (viewerDownload && isUsableHref(siteDownloadUrl || siteViewUrl)) {
          viewerDownload.setAttribute("href", siteDownloadUrl || siteViewUrl);
          viewerDownload.removeAttribute("target");
          viewerDownload.removeAttribute("rel");
          viewerDownload.setAttribute("download", fileName || "official-court-form.pdf");
          viewerDownload.removeAttribute("aria-disabled");
        }
        if (viewerSourceFallback) {
          viewerSourceFallback.hidden = true;
          viewerSourceFallback.setAttribute("aria-hidden", "true");
          viewerSourceFallback.setAttribute("aria-disabled", "true");
          viewerSourceFallback.removeAttribute("href");
          viewerSourceFallback.removeAttribute("target");
          viewerSourceFallback.removeAttribute("rel");
          viewerSourceFallback.removeAttribute("data-source-url");
        }
        viewerIntake?.setAttribute("data-intake-route", JSON.stringify(routeForPdfLink(link)));
        revealAndFocus(viewer, { hash: "#forms-pdf-viewer", history: true });
      };
      window.addEventListener("mflg:official-pdf-open", (event) => {
        const url = event.detail?.sitePdfViewUrl || event.detail?.officialUrl || "";
        const match = links.find((link) => link.dataset.sitePdfViewUrl === url || link.dataset.pdfUrl === url);
        if (match) openPdfViewer(match);
      });
      const update = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const packetValue = packet?.value || "all";
        const languageValue = language?.value || "all";
        const allowPdfLinks = packetValue !== "all" || allowUnmatchedPdfBrowse;
        let visible = 0;
        links.forEach((link) => {
          const matchesSearch = !q || (link.dataset.search || "").includes(q);
          const matchesPacket = packetValue === "all" || link.dataset.packet === packetValue;
          const matchesLanguage = languageValue === "all" || link.dataset.language === languageValue;
          const show = allowPdfLinks && matchesSearch && matchesPacket && matchesLanguage;
          link.hidden = !show;
          if (show) visible += 1;
        });
        groupCards.forEach((group) => {
          const hasVisible = Array.from(group.querySelectorAll("[data-official-pdf-link]")).some((link) => !link.hidden);
          group.hidden = !hasVisible;
          const selectedGroup = packetValue !== "all" && group.dataset.officialPdfGroup === packetValue;
          group.open = Boolean(hasVisible && selectedGroup);
        });
        routeCards.forEach((card) => {
          const selected = packetValue !== "all" && card.dataset.officialPdfRouteCard === packetValue;
          card.classList.toggle("active", selected);
          card.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        const selectedRoute = routePacketById.get(packetValue);
        if (spotlightKicker) {
          spotlightKicker.textContent = selectedRoute ? "Recommended form path" : "Related forms";
        }
        if (spotlightTitle) {
          spotlightTitle.textContent = selectedRoute
            ? selectedRoute.page_label || selectedRoute.packet_label || "Recommended form group selected"
            : !allowUnmatchedPdfBrowse
            ? "No exact form packet is selected for these answers."
            : "Choose another form group only if the recommendation does not fit.";
        }
        if (spotlightCopy) {
          spotlightCopy.textContent = selectedRoute
            ? "Use this primary form path if it matches your situation. Open the forms in order."
            : !allowUnmatchedPdfBrowse
            ? "Use Guided Intake or change answers before opening a packet. Browse other form groups only if you already know the court packet title."
            : "Use search, form group, and language filters only if you know what you are looking for. Otherwise, start Guided Intake.";
        }
        if (status) {
          status.textContent = visible
            ? "Forms are ready."
            : allowUnmatchedPdfBrowse
            ? "No forms match these filters."
            : "No exact issue-specific form packet is selected for these answers.";
        }
        updateIntakePanel();
        updateItemIntakeLinks();
      };
      search?.addEventListener("input", () => {
        expandFocusedPdfGroup = false;
        update();
      });
      packet?.addEventListener("change", () => {
        expandFocusedPdfGroup = false;
        update();
      });
      language?.addEventListener("change", () => {
        expandFocusedPdfGroup = false;
        update();
      });
      const clearOfficialPdfFilters = () => {
        expandFocusedPdfGroup = false;
        allowUnmatchedPdfBrowse = false;
        if (search) search.value = "";
        if (packet) packet.value = "all";
        if (language) language.value = "English";
      };
      routeCards.forEach((card) => {
        card.addEventListener("click", () => {
          if (!packet) return;
          const packetValue = card.dataset.officialPdfRouteCard || "all";
          if (Array.from(packet.options).some((option) => option.value === packetValue)) {
            const packetRoute = routePacketById.get(packetValue);
            currentRouteDetail = packetRoute?.route
              ? { ...packetRoute.route, pdfPacket: packetValue }
              : { ...currentRouteDetail, pdfPacket: packetValue };
            packet.value = packetValue;
            update();
            closePdfViewer();
            window.requestAnimationFrame(() => {
              revealAndFocus(host.querySelector(`[data-official-pdf-group="${CSS.escape(packetValue)}"]`), { hash: "#forms-approved-pdfs", history: true });
            });
          }
        });
      });
      showAll?.addEventListener("click", () => {
        if (routeIndexDisclosure) routeIndexDisclosure.open = true;
        allowUnmatchedPdfBrowse = true;
        clearOfficialPdfFilters();
        allowUnmatchedPdfBrowse = true;
        update();
        revealAndFocus(routeIndexDisclosure, { hash: "#forms-other-packets", history: true });
      });
      reset?.addEventListener("click", () => {
        clearOfficialPdfFilters();
        update();
      });
      links.forEach((link) => {
        link.querySelectorAll("[data-official-pdf-preview]").forEach((trigger) => {
          trigger.addEventListener("click", () => openPdfViewer(link));
        });
      });
      viewerClose?.addEventListener("click", () => {
        closePdfViewer();
      });
      const applyRoutePreset = (detail) => {
        currentRouteDetail = detail || currentRouteDetail;
        expandFocusedPdfGroup = detail?.expandPdfGroup === true;
        const hasExplicitPacket = detail && Object.prototype.hasOwnProperty.call(detail, "pdfPacket");
        const explicitPacket = hasExplicitPacket ? detail.pdfPacket || "all" : "";
        const nextPacket = hasExplicitPacket ? explicitPacket : recommendedPacketId;
        allowUnmatchedPdfBrowse = false;
        if (packet && Array.from(packet.options).some((option) => option.value === nextPacket)) {
          packet.value = nextPacket;
          update();
          const label = packet.options[packet.selectedIndex]?.textContent || "approved packets";
          if (status && nextPacket !== "all") {
            status.textContent = `${status.textContent} Showing the form group that matches your answers: ${label}. Use View form to keep the PDF on this page.`;
          }
          if (detail?.expandPdfGroup === true || hasExplicitPacket) closePdfViewer();
        }
      };
      window.addEventListener("mflg:forms-route-change", (event) => {
        applyRoutePreset(event.detail);
      });
      if (window.MFLGLatestFormsRoute) {
        applyRoutePreset(window.MFLGLatestFormsRoute);
      } else {
        if (packet && Array.from(packet.options).some((option) => option.value === recommendedPacketId)) {
          packet.value = recommendedPacketId;
        }
        update();
      }
      if (window.location.hash === "#forms-approved-pdfs") {
        window.setTimeout(() => {
          const selectedGroup = host.querySelector(".official-pdf-group[open]") || host;
          revealAndFocus(selectedGroup, { hash: "#forms-approved-pdfs", history: false });
        }, 120);
      }
    } catch (error) {
      host.innerHTML = `
        <div class="section-head compact">
          <p class="eyebrow">Reviewed forms</p>
          <h2>Reviewed forms could not load.</h2>
          <p>Use Guided Intake and the office can help route you to the right court page.</p>
        </div>
      `;
    }
  }
	
	  document.addEventListener("click", async (event) => {
	    const anchor = event.target.closest("[data-link]");
	    if (!anchor) return;
	    const url = new URL(anchor.href, window.location.href);
	    if (url.origin !== window.location.origin) return;
	    const route = parseRouteData(anchor.getAttribute("data-intake-route"));
	    const formsRoute = parseRouteData(anchor.getAttribute("data-guide-forms-route"));
	    const calculatorChoice = anchor.getAttribute("data-guide-calculator-choice") || "";

	    if (formsRoute || calculatorChoice) {
	      const linkWantsCalculator = Boolean(calculatorChoice && url.hash === "#forms-calculator-hub");
	      const linkRoute = {
	        ...(formsRoute || window.MFLGLatestFormsRoute || {}),
	        need: linkWantsCalculator ? "calculator" : (formsRoute || window.MFLGLatestFormsRoute || {}).need || "forms",
	        calculatorChoice: linkWantsCalculator ? calculatorChoice : ""
	      };
      const confirmedBridgeFields = [
        "need",
        linkWantsCalculator ? "selectedCalculator" : "",
        formsRoute?.fromGuide ? "selectedGuide" : "",
        formsRoute?.fromPracticeArea ? "selectedPracticeArea" : ""
      ].filter(Boolean);
      const suggestedBridgeFields = linkWantsCalculator
        ? ["county", "posture", "children", "selectedPacket"]
        : ["issue", "county", "posture", "children", "selectedPacket"];
	      storeFormsRoute(linkRoute, linkWantsCalculator ? calculatorChoice : "", {
	        userAction: true,
	        confirmed: true,
	        confirmedFields: confirmedBridgeFields,
	        suggestedFields: suggestedBridgeFields,
	        source: linkWantsCalculator ? "global-calculator-link" : "global-forms-link"
	      });
	    }

	    if (url.pathname.replace(/\/$/, "") === "/start") {
	      if (route) {
	        storeIntakeRoute(route);
	      } else {
	        clearIntakeRoute();
	      }
	    }

	    event.preventDefault();
	    const nextPath = url.pathname.replace(/\/$/, "") || "/";
	    const activePath = currentRoutePath();
	    closeNav();

	    if (nextPath === activePath) {
	      if (url.hash) {
	        revealAndFocus(document.querySelector(url.hash), { hash: url.hash, history: false });
	      } else {
	        window.scrollTo({ top: 0, behavior: "smooth" });
	      }
	      updateHeaderState();
	      return;
	    }

	    rememberScroll();
	    history.pushState({}, "", `${url.pathname}${url.hash}`);
	    await render({ restoreScroll: false });
	    requestAnimationFrame(() => {
	      if (url.hash) {
	        revealAndFocus(document.querySelector(url.hash), { hash: url.hash, history: false });
	      } else {
	        jumpToTop();
	      }
	      updateHeaderState();
	      requestAnimationFrame(() => {
	        if (url.hash) {
	          revealAndFocus(document.querySelector(url.hash), { hash: url.hash, history: false });
	        } else {
	          jumpToTop();
	        }
	        updateHeaderState();
	      });
	    });
  });

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  window.addEventListener("popstate", () => render({ restoreScroll: true }));
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });
  document.querySelectorAll("[data-map-business-status]").forEach((band) => {
    const iframe = band.querySelector("iframe");
    const label = band.querySelector("[data-map-business-placeholder]");
    const verifiedName = (iframe?.dataset.googleBusinessName || band.dataset.googleBusinessName || "").trim();
    if (verifiedName && label) {
      label.querySelector("strong").textContent = verifiedName;
    }
    if (band.dataset.mapBusinessStatus === "verified") {
      band.classList.add("map-business-verified");
    }
  });
  updateHeaderState();
  render();
}());
