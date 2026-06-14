(function () {
  const root = document.querySelector("[data-page-root]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const header = document.querySelector("[data-header]");
  const scrollPositions = new Map();
  let activeRenderPath = "/";

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

  const legalTermDefinitions = {
    "case-stage": "The step your case is in, such as starting a case, responding to papers, finalizing an agreement, or changing an existing order.",
    posture: "The legal stage or position of a case. On this site, use it like case stage.",
    jurisdiction: "The court or county that has authority to handle the case or filing.",
    petition: "The first court paper that asks the court to open a case or make orders.",
    response: "The court paper filed after someone receives a petition or other request.",
    served: "When court papers are formally delivered to someone in the way court rules require.",
    service: "The formal delivery of court papers to another person.",
    filing: "Giving a document to the court so it becomes part of the court record.",
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

  function legalTerm(key, label) {
    const definition = legalTermDefinitions[key] || legalTermDefinitions[String(key || "").toLowerCase()];
    if (!definition) return esc(label || key);
    return `<span class="legal-term" data-legal-term-key="${esc(key)}">${esc(label || key)}<button type="button" class="legal-term-help" aria-label="${esc(`${label || key}: ${definition}`)}" data-legal-definition="${esc(definition)}">?</button></span>`;
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
    ["served", /\bserved\b/i],
    ["service", /\bservice\b/i],
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
    const host = container || root;
    if (!host || !host.querySelectorAll) return;
    const usedByBlock = new WeakMap();
    const maxReplacements = 80;
    const blockFor = (element) => element.closest([
      ".guide-row-panel",
      ".service-row-panel",
      ".forms-matter-grid article",
      ".forms-route-card",
      ".forms-router-card",
      ".official-pdf-link",
      ".faq-item",
      ".card",
      "section",
      "article"
    ].join(", ")) || host;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.nodeValue || "";
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".legal-term, .site-header, .footer, script, style, button, a, select, option, input, textarea")) return NodeFilter.FILTER_REJECT;
        if (!parent.closest("p, li, dd, dt, h1, h2, h3, h4, strong, small, span")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const replacements = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || "";
      const block = blockFor(node.parentElement);
      const used = usedByBlock.get(block) || new Set(Array.from(block.querySelectorAll?.("[data-legal-term-key]") || []).map((item) => item.getAttribute("data-legal-term-key")));
      usedByBlock.set(block, used);
      const match = legalTermMatchers.find(([key, regex]) => !used.has(key) && regex.test(text));
      if (!match) continue;
      const [key, regex] = match;
      const result = regex.exec(text);
      if (!result || result.index < 0) continue;
      replacements.push({ node, key, index: result.index, label: result[0] });
      used.add(key);
      if (replacements.length >= maxReplacements) break;
    }
    replacements.forEach(({ node, key, index, label }) => {
      const text = node.nodeValue || "";
      const before = text.slice(0, index);
      const after = text.slice(index + label.length);
      const wrapper = document.createElement("span");
      wrapper.className = "legal-term";
      wrapper.setAttribute("data-legal-term-key", key);
      wrapper.textContent = label;
      const help = document.createElement("button");
      help.type = "button";
      help.className = "legal-term-help";
      help.textContent = "?";
      const definition = legalTermDefinitions[key] || "";
      help.setAttribute("aria-label", `${label}: ${definition}`);
      help.setAttribute("data-legal-definition", definition);
      wrapper.appendChild(help);
      const fragment = document.createDocumentFragment();
      if (before) fragment.appendChild(document.createTextNode(before));
      fragment.appendChild(wrapper);
      if (after) fragment.appendChild(document.createTextNode(after));
      node.parentNode?.replaceChild(fragment, node);
    });
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

	  function slugify(value) {
	    return String(value || "")
	      .toLowerCase()
	      .replace(/[^a-z0-9]+/g, "-")
	      .replace(/^-+|-+$/g, "");
	  }

  function hero(title, copy, actions) {
    return `<section class="hero">
      <video class="hero-video" autoplay muted loop playsinline preload="auto" poster="/assets/images/mflg-hero-family-poster.jpg?v=mflg-live-20260613-countygate1">
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

  function sectionNavigator(path) {
    if (path === "/" || path === "/start" || path === "/thank-you" || path === "/404" || path === "/tools" || path === "/forms" || path === "/calculators") return "";
    const index = sectionFlow.findIndex((item) => item.path === path);
    if (index < 0) return "";

    const previous = sectionFlow[(index - 1 + sectionFlow.length) % sectionFlow.length];
    const current = sectionFlow[index];
    const next = sectionFlow[(index + 1) % sectionFlow.length];

    return `<nav class="section-switcher" aria-label="Move between site sections">
      <a class="section-switcher-link" href="${previous.path}" data-link><span>Previous</span><strong>${previous.label}</strong></a>
      <div class="section-switcher-current"><span>Viewing</span><strong>${current.label}</strong></div>
      <a class="section-switcher-link" href="${next.path}" data-link><span>Next</span><strong>${next.label}</strong></a>
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
    return `<section class="section ${band ? "band" : ""} ${className || ""}"${band ? ` id="after-hero"` : ""}>
      <div class="inner">
        <p class="eyebrow">${eyebrow || "MY FAMILY LAW GROUP PLLC"}</p>
        <h2>${title}</h2>
        ${copy ? `<p class="lead muted">${copy}</p>` : ""}
        ${sectionNavigator(activeRenderPath)}
        ${body}
        ${sectionJourney(activeRenderPath)}
      </div>
    </section>`;
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

		  const initialServiceCount = 15;
		  const publicCategoryGroups = [
		    { label: "All", categories: null },
		    { label: "Divorce / Separation", categories: ["Marriage", "Agreements", "Property", "Maintenance"] },
		    { label: "Children & Parenting", categories: ["Parenting", "Jurisdiction", "Parentage"] },
		    { label: "Support & Money", categories: ["Child support", "Maintenance", "Property", "Disclosure"] },
		    { label: "Orders After Court", categories: ["Post-decree", "Court requests"] },
		    { label: "Documents & Filing", categories: ["Documents", "Procedure", "Disclosure"] },
		    { label: "Court / Hearing Help", categories: ["Court", "Resolution"] },
		    { label: "Safety / Urgent Issues", categories: ["Safety", "Court requests", "Post-decree"] },
		    { label: "Not Sure / Scope Review", categories: ["Triage", "Scope review"] }
		  ];
		  const publicCategoryLabels = new Map(
		    publicCategoryGroups.flatMap((group) => (group.categories || []).map((category) => [category, group.label]))
		  );
		  const publicCategoryIndex = new Map(
		    publicCategoryGroups.map((group) => [group.label, group.categories ? new Set(group.categories) : null])
		  );

		  function publicCategoryFor(item) {
		    return publicCategoryLabels.get(item.category) || item.category || "Not Sure / Scope Review";
		  }

	  function intakeRouteForService(item) {
	    const title = item.title;
	    const base = {
	      routeKey: `service-${slugify(title)}`,
	      entrySource: "service-pathway",
	      entryLabel: title,
	      issueDetail: title,
	      contextNote: `Your ${title} selection was carried into Intake. The closest issue is preselected below, and you can change it if another option fits better.`,
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
		      contextNote: `Your ${title} selection was carried into Intake. The closest issue and service focus are prefilled below, and you can change anything that does not fit.`,
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
	      cta: "Start intake for documents",
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
	      cta: "Start intake for filing",
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
	      cta: "Start intake for settlement",
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
	      cta: "Start intake for court review",
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
		      { title: "I was served or have a deadline", route: routeForServiceTitle("Response to Served Papers") },
		      { title: "A court date is coming up", route: routeForServiceTitle("Hearing Preparation") },
		      { title: "Parenting time or support is not being followed", route: routeForServiceTitle("Enforcement of Existing Orders") },
		      { title: "Safety or protective-order issue", route: routeForServiceTitle("Protective Orders / Safety Terms") }
		    ];
		    return `<div class="urgency-router" aria-label="Fast routes for urgent family-law situations">
		      <div class="urgency-router-copy">
		        <p class="eyebrow">Deadline or pressure?</p>
		        <h3>If something is time-sensitive, start there.</h3>
		        <p>You do not need to know the legal label. Choose the closest pressure point and Intake will preserve that context for review.</p>
		      </div>
		      <div class="urgency-router-actions">
		        ${urgentRoutes.map((item) => `<a href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>${esc(item.title)} <span aria-hidden="true">→</span></a>`).join("")}
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
		          <strong>Route the deadline, hearing, service, or urgent next step first.</strong>
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
	      const guide = guideFromServiceItem(item);
	      const packetChoices = guidePacketChoicesFor(guide);
	      const primaryPacket = packetChoices[0];
	      const formsRoute = primaryPacket
	        ? {
	          ...guideFormsRouteFor(guide),
	          issue: primaryPacket.issue,
	          posture: primaryPacket.posture,
	          children: primaryPacket.children,
	          pdfPacket: primaryPacket.packet,
	          formConfidence: primaryPacket.confidence || "related",
	          officialSourceUrl: primaryPacket.sourceUrl || ""
	        }
	        : guideFormsRouteFor(guide);
	      const calculatorChoice = guideCalculatorChoiceFor(guide);
	      const calculatorLabel = calculatorChoice === "support"
	        ? "Open support calculator"
	        : calculatorChoice === "parenting"
	          ? "Open parenting-time counter"
	          : calculatorChoice === "maintenance"
	            ? "Open maintenance calculator"
	            : "Open deadline planner";
	      return { ...item, href: "/start", route, guide, formsRoute, calculatorChoice, calculatorLabel };
  }

  function renderServicePanel(item) {
    const checklist = guideChecklistFor(item).slice(0, 3);
    const readiness = guideReadinessFor(item)[0] || "If the next step is unclear, use Guided Intake before choosing forms.";
    return `<div class="guide-row-panel-inner service-row-panel-inner">
      <button class="guide-panel-close" type="button" data-service-panel-close aria-label="Close practice area details">Close</button>
      <div class="guide-panel-heading service-panel-heading">
        <p class="eyebrow">${esc(item.category)}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.copy)}</p>
      </div>
      <div class="guide-card-grid service-panel-grid">
        <div>
          <h4>What this usually involves</h4>
          <ul class="list">${checklist.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Before you choose</h4>
          <p class="service-card-fallback">${esc(readiness)}</p>
        </div>
      </div>
      <div class="guide-next-step service-panel-next">
        <div class="guide-next-step-head">
          <span>Next step</span>
          <strong>Review forms, use a planner, or start intake when you are ready.</strong>
          <p>This overview is intentionally lighter than the DIY Guide. Use Forms & Tools for documents and calculators, or Guided Intake if the path is not clear.</p>
        </div>
        <div class="service-row-actions">
          <a class="button primary" href="/tools#forms-approved-pdfs" data-link data-guide-forms-route='${esc(JSON.stringify(item.formsRoute))}'>View Forms & Tools</a>
          <a class="button outline" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(item.calculatorChoice)}" data-guide-forms-route='${esc(JSON.stringify(item.formsRoute))}'>${esc(item.calculatorLabel)}</a>
          <a class="button ghost" href="/start" data-link data-intake-route='${esc(JSON.stringify(item.route))}'>Start Guided Intake</a>
        </div>
      </div>
    </div>`;
  }

  function serviceCards() {
	    const items = serviceItems.map(serviceViewModelForItem);
				    const categories = publicCategoryGroups.filter((group) => group.label === "All" || items.some((item) => group.categories?.includes(item.category)));
		    return `<div class="service-tools" data-service-tools>
	      <label class="service-search-label" for="service-search">Search family-law pathways</label>
	      <div class="service-search-row">
	        <input id="service-search" class="service-search" type="search" placeholder="Search parenting, support, paternity, enforcement..." data-service-search>
	        <span class="service-count" data-service-count>Showing ${initialServiceCount} of ${items.length} pathways</span>
	      </div>
	    </div>
	    <div class="service-methods" aria-label="Choose a focused intake path">
	      <div class="service-methods-intro">
	        <p class="eyebrow">Focused intake paths</p>
	        <h3>Not ready to choose a legal issue? Start with the kind of help you need.</h3>
	        <p>These cards open Guided Intake with that kind of help already selected. If you want to read about a specific legal issue first, use the practice-area cards below.</p>
	        <a class="service-methods-primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(serviceMethodFallbackRoute))}'>
	          Get matched in Intake <span aria-hidden="true">→</span>
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
	    </div>
		    ${urgencyRouter()}
		    <div class="service-category-panel" aria-label="Filter family-law pathways by situation">
		      <div class="service-category-head">
		        <p class="service-search-label">Browse by situation</p>
		        <button class="service-category-reset" type="button" data-service-category-reset>Reset</button>
		      </div>
		      <div class="service-category-list" role="group" aria-label="Pathway categories">
		        ${categories.map((group, index) => `<button class="service-category-chip${index === 0 ? " active" : ""}" type="button" data-service-category-filter="${esc(group.label)}" aria-pressed="${index === 0 ? "true" : "false"}">${esc(group.label)}</button>`).join("")}
		      </div>
		    </div>
			    <div class="grid service-grid" data-service-grid data-service-list>${items.map((item, index) => {
			      return `
				    <article class="card service-card"${index >= initialServiceCount ? ` hidden data-service-extra` : ""} role="button" tabindex="0" aria-label="Review details for ${esc(item.title)}" data-service-card data-service-index="${index}" data-service-category="${esc(item.category)}" data-service-group="${esc(publicCategoryFor(item))}" data-service-title="${esc(item.title.toLowerCase())}" data-service-category-text="${esc(item.category.toLowerCase())}" data-service-group-text="${esc(publicCategoryFor(item).toLowerCase())}" data-service-text="${esc(`${item.title} ${item.category} ${publicCategoryFor(item)} ${item.copy}`.toLowerCase())}">
			      <div class="service-heading">
			        <div class="card-icon service-icon" aria-hidden="true">${item.icon}</div>
		        <p class="service-kicker">${esc(item.category)}</p>
		        <h3>${esc(item.title)}</h3>
		      </div>
		      <div class="service-detail">
		        <p>${item.copy}</p>
		        <button class="card-link service-detail-toggle" type="button" data-service-detail-toggle aria-expanded="false">Review this path →</button>
		      </div>
		    </article>`;
			    }).join("")}</div>
	    <div class="service-reveal">
	      <button class="button primary service-reveal-button" type="button" data-service-reveal>View All Family Law Pathways</button>
		      <p class="service-note" data-service-note>Showing the first ${initialServiceCount} pathways. Search any topic, browse a situation, or reveal the remaining ${items.length - initialServiceCount}. Services are subject to conflict, licensed-scope, timing, and availability review.</p>
	    </div>`;
	  }

  function home() {
    return hero(
      "Clear Family Law Guidance. A More Affordable Path Forward.",
      "Arizona family law help from a licensed Legal Paraprofessional for divorce, parenting time, child support, legal decision-making, and related family court matters.",
      `${link("/start", "Start Guided Intake", "primary")} ${link("/practice-areas", "View Practice Areas", "outline")}`
    ) + section(
      "Practical help for Arizona family law matters.",
      "Family-law help for moments when documents, deadlines, parenting terms, support, and court expectations need to be handled clearly. Every path begins with conflict, scope, timing, and fit review.",
	      serviceCards(),
	      true,
	      "Family law services",
	      "service-section"
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
    return section("Practice Areas", "Focused Arizona family law pathways with scope review before services are accepted.", serviceCards(), true, "Family law services");
  }

  function feeRoute(title, serviceInterest, budgetConcern, presetAnswers) {
    return {
      routeKey: `fees-${slugify(title)}`,
      entrySource: "fees",
      entryLabel: title,
      issueDetail: title,
      issuePathway: "Not Sure",
      serviceInterest,
      contextNote: `Your ${title} fee selection was carried into Intake. Share the issue, timing, documents, and service needs so fee fit can be reviewed before any agreement is confirmed.`,
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
          title: "Uncontested Divorce",
          range: "$1,800",
          label: "No minor children",
          copy: "For agreed divorce matters without minor children and with standard assets and debts.",
          includes: ["Petition or response path", "Settlement terms", "Consent decree support"],
          cta: "Price No-Kids Divorce",
          route: feeRoute("Uncontested Divorce (No Kids)", "Prepare and file documents", "Flat fee if available", { agreementStatus: "Yes, mostly agreed" })
        },
        {
          title: "Uncontested Divorce with Kids",
          range: "$2,950",
          label: "Parenting plan",
          copy: "For agreed divorce matters with minor children, parenting-plan terms, support worksheet needs, and standard assets.",
          includes: ["Parenting plan", "Child support worksheet", "Consent decree support"],
          cta: "Price Divorce with Kids",
          route: feeRoute("Uncontested Divorce (With Kids)", "Prepare and file documents", "Flat fee if available", { agreementStatus: "Yes, mostly agreed", primaryHelpNeeded: "Get help with an agreement" })
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
        ${["Choose a guide", "Answer what you need", "Open matched forms", "Use calculator if needed", "Start Intake if unsure"].map((step, index) => `<span><b>0${index + 1}</b>${esc(step)}</span>`).join("")}
      </div>
      <div class="guide-tools" id="guide-resource-start">
        <input type="search" placeholder="Search guides" aria-label="Search guides" data-guide-search>
        <select aria-label="Filter guides by category" data-guide-category>
          <option value="">All categories</option>
          ${Array.from(new Set(guides.map((guide) => guide.category))).map((category) => `<option>${esc(category)}</option>`).join("")}
        </select>
      </div>
      <div class="guide-status-row" aria-live="polite">
        <span data-guide-count>Showing ${Math.min(initialServiceCount, guides.length)} of ${guides.length} DIY guides</span>
      </div>
      <div class="guide-issue-grid" data-guide-list>${renderGuides(guides)}</div>
      <div class="guide-reveal">
        <button class="button primary guide-reveal-button" type="button" data-guide-reveal>View All DIY Guides</button>
        <p class="guide-note" data-guide-note>Showing the first ${Math.min(initialServiceCount, guides.length)} guides. Search any topic, choose a category, or reveal the remaining ${Math.max(guides.length - initialServiceCount, 0)}.</p>
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
    return {
      slug: slugify(item.title),
      category,
      title: item.title,
      summary: item.copy,
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
    let issue = "all";
    let posture = "Any posture";
    let children = "any";

    if (title.includes("annulment")) {
      issue = "divorce";
      posture = "New filing";
      children = "no-minor-children";
    } else if (title.includes("name change")) {
      issue = "name change";
      posture = "New filing";
    } else if (title.includes("divorce") || title.includes("dissolution")) {
      issue = "divorce";
      posture = title.includes("consent") || title.includes("agreement") ? "Agreement / final orders" : "New filing";
    } else if (title.includes("separation")) {
      issue = "divorce";
      posture = "New filing";
    } else if (title.includes("agreement") || title.includes("consent") || category.includes("agreement")) {
      issue = "divorce";
      posture = "Agreement / final orders";
    } else if (category.includes("parenting") || category.includes("jurisdiction") || title.includes("parenting") || title.includes("custody")) {
      issue = "parenting";
      posture = title.includes("modif") || title.includes("enforce") || category.includes("post-decree") ? "Existing order" : "New filing";
      children = "minor-children";
    } else if (category.includes("child support") || title.includes("support")) {
      issue = "support";
      posture = title.includes("modif") || title.includes("enforce") || category.includes("post-decree") ? "Existing order" : "New filing";
      children = "minor-children";
    } else if (category.includes("parentage") || title.includes("paternity") || title.includes("parentage")) {
      issue = "parentage";
      posture = "New filing";
      children = "minor-children";
    } else if (category.includes("post-decree") || title.includes("modif")) {
      issue = "modification";
      posture = "Existing order";
    } else if (title.includes("enforce") || title.includes("contempt")) {
      issue = "enforcement";
      posture = "Existing order";
    } else if (category.includes("safety") || title.includes("protective")) {
      issue = "safety";
      posture = "Safety";
    } else if (category.includes("document") || category.includes("disclosure") || category.includes("procedure") || category.includes("court")) {
      issue = "documents";
    }

    const county = issue === "safety" ? "Statewide" : "Maricopa";
    let pdfPacket = pdfPacketForFormsRoute(county, issue, posture, children);
    if (pdfPacket === "all") {
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
    const divorceChoices = [
      countyExact("divorce-no-children", "Divorce or separation, no minor children", "Use this when the case starts a divorce or legal separation and no minor children are involved.", "maricopa-divorce-new-no-children", "divorce", "New filing", "no-minor-children"),
      countyExact("divorce-with-children", "Divorce or separation, with minor children", "Use this when the case starts a divorce or legal separation and parenting or support must also be addressed.", "maricopa-divorce-new-with-children", "divorce", "New filing", "minor-children"),
      countyExact("agreement-final", "Agreement or final decree", "Use this when both sides have an agreement and need final decree or settlement forms.", "maricopa-consent-decree-agreement", "divorce", "Agreement / final orders", "any")
    ];
    const annulmentChoices = [
      intakeRequired("annulment-source", "Annulment forms need county confirmation", "Annulment has a separate official packet path. If your county is not listed, confirm whether that court accepts Maricopa forms before relying on them.", "maricopa-annulment-official-source", "annulment", "New filing", "any", "https://superiorcourt.maricopa.gov/llrc/fc_group_28/"),
      related("divorce-no-children", "Related divorce/separation packet", "Use only for orientation. Annulment is a separate path and should be confirmed through Guided Intake or the official court source.", "maricopa-divorce-new-no-children", "divorce", "New filing", "no-minor-children")
    ];
    const parentingChoices = [
      countyExact("parentage-parenting-support", "Start parenting, parentage, or support orders", "Use this when parents need first-time orders for legal decision-making, parenting time, parentage, or child support.", "maricopa-parenting-parentage-support", "parenting", "New filing", "minor-children"),
      countyExact("parenting-in-divorce", "Parenting issues in a divorce", "Use this when parenting terms are part of a new divorce or legal separation case.", "maricopa-divorce-new-with-children", "parenting", "New filing", "minor-children"),
      countyExact("foreign-custody", "Register an out-of-state custody order", "Use this when a custody or parenting order from another state needs Arizona court recognition.", "maricopa-foreign-custody-order", "parenting", "Existing order", "minor-children")
    ];
    const relocationChoices = [
      intakeRequired("relocation-review", "Relocation notice and court path", "Relocation depends on existing orders, distance, timing, and the A.R.S. 25-408 notice rules. Use intake before choosing forms.", "maricopa-relocation-official-source", "relocation", "Existing order", "minor-children", "https://www.azleg.gov/ars/25/00408.htm"),
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
      countyExact("divorce", "During divorce", "Restore a former name before the decree is signed.", "maricopa-consent-decree-agreement", "divorce", "Agreement / final orders", "any"),
      countyExact("adult-no-children", "Adult, no minor children", "Separate name-change case after divorce or outside divorce.", "maricopa-name-change-adult-no-minor-children", "name change", "New filing", "no-minor-children"),
      countyExact("adult-with-child", "Adult with a minor child", "Separate adult name-change case when the adult has a minor child.", "maricopa-name-change-adult-with-minor-child", "name change", "New filing", "minor-children"),
      countyExact("child", "Minor child", "Name-change request for a child.", "maricopa-name-change-minor-child", "name change", "New filing", "minor-children"),
      countyExact("family", "More than one family member", "Family packet for multiple related name changes.", "maricopa-name-change-family", "name change", "New filing", "minor-children"),
      countyExact("record-update", "Update court contact record", "Administrative update only; this does not legally change a name.", "maricopa-name-address-update", "name or address update", "Existing order", "any")
    ];

    if (title.includes("name change")) return nameChangeChoices;
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

  function formConfidenceLabel(confidence) {
    if (confidence === "exact") return "Exact form path";
    if (confidence === "county-exact") return "Maricopa packet available";
    if (confidence === "intake-required") return "Confirm before forms";
    if (confidence === "statewide-generic") return "Statewide starting point";
    if (confidence === "related-only") return "Related forms only";
    return "Related forms";
  }

  function formConfidenceCopy(confidence) {
    if (confidence === "exact") return "This form path is directly assigned to the selected issue.";
    if (confidence === "county-exact") return "A Maricopa packet is available. Confirm your county before relying on these forms.";
    if (confidence === "intake-required") return "Use Guided Intake before choosing forms. The issue depends on timing, court orders, county, or legal stage.";
    if (confidence === "statewide-generic") return "Use this as a statewide starting point, then confirm whether your county requires a local packet.";
    if (confidence === "related-only") return "Related forms exist, but this is not confirmed as the exact packet for the selected issue.";
    return "These forms are related, but may not be the exact packet for the selected issue.";
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
    "If the user needs forms or calculators, preserve only non-sensitive routing context until conflict, scope, and engagement review are complete."
  ];

  const jurisdictionQuestions = [
    ["Existing case?", "If there is already a case number, the county where that case is pending usually controls the forms and next filing posture."],
    ["New case?", "For divorce or legal separation, county and Arizona residency must be checked before choosing forms."],
    ["Children involved?", "Parenting, support, parentage, and relocation can require child-residence and existing-order screening before form selection."],
    ["Served or deadline?", "Response, default, temporary orders, hearing, and enforcement packets depend on timing and what has already been filed."],
    ["County unknown?", "Use statewide Arizona resources first, then route to the correct superior court once county can be identified."]
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
      note: "Central Arizona forms directory that helps bridge statewide resources and county-specific requirements."
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
      note: "Route by children involved, agreement status, service, property, debt, and support issues before choosing a packet."
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

  const formRouterCounties = ["Statewide", "Maricopa", "Pima", "Pinal", "Yavapai"];
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
  function pdfPacketForFormsRoute(county, issue, posture, children) {
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
      route.issue && route.issue !== "all" ? route.issue : "forms/tools",
      route.posture && route.posture !== "Any posture" ? route.posture : "",
      route.children && route.children !== "any" ? route.children : ""
    ].filter(Boolean);
    return {
      routeKey: `forms-tools-${slugify(labelParts.join("-") || "official-pdf-route")}`,
      entrySource: "Forms & Tools",
      entryLabel: selectedPdfLabel
        ? `Approved official PDF: ${selectedPdfLabel}`
        : packetLabel ? `Approved PDF packet: ${packetLabel}` : "Forms & Tools route",
      issuePathway: "Forms & Tools",
      issueDetail: labelParts.join(" / ") || "Official forms and PDF planning",
      serviceInterest: "",
      contextNote: "Public planning route only. No sensitive facts, uploads, allegations, financial details, or opposing-party information were collected in Forms & Tools.",
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
    const selectedIssue = route.issue && route.issue !== "all" ? route.issue : "family-law";
    const selectedPosture = route.posture && route.posture !== "Any posture" ? route.posture : "selected";
    const baseRoute = {
      routeKey: `forms-tools-route-decision-${slugify([route.county, selectedIssue, selectedPosture, route.children].filter(Boolean).join("-"))}`,
      entrySource: "Forms & Tools",
      entryLabel: "Forms & Tools route decision",
      issuePathway: "Forms & Tools",
      issueDetail: [route.county, selectedIssue, selectedPosture, route.children].filter(Boolean).join(" / "),
      serviceInterest: "",
      contextNote: "Public Forms & Tools selection only. County, issue, case stage, and child-involved status were carried forward; no sensitive facts were collected.",
      presetAnswers: {
        formCounty: route.county || "Statewide",
        formIssue: route.issue || "all",
        formPosture: route.posture || "Any posture",
        formChildren: route.children || "any",
        approvedPdfPacket: hasReviewedPdfPacket ? route.pdfPacket : "",
        officialSourceTitle: firstResource.title || "",
        officialSourceStatus: firstResource.status || "",
        sourceType: "Forms & Tools route decision / public planning"
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
        copy: "Start with this form group. If the forms do not look like your situation, use Guided Intake instead of guessing.",
        primaryLabel: "View matching forms",
        primaryHref: "#forms-packet-builder",
        pdfPacket: route.pdfPacket,
        meta: ["Form match found", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isSafetyRoute) {
      return {
        tone: "urgent",
        kicker: "Safety first",
        title: "Use the protective-order court page first.",
        copy: "If safety is involved, do not start with general family-law forms. Open the safety court page, then use Guided Intake if you want office review.",
        primaryLabel: "Open safety page",
        primaryHref: firstResource.url || "https://azpoint.azcourts.gov/",
        meta: ["Safety page first", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isMaricopa) {
      return {
        tone: "review",
        kicker: "Court source found",
        title: "Open the matching Maricopa forms.",
        copy: "This is the safest starting point for this selection. Use the reviewed forms or start Intake if you are not sure which form group fits.",
        primaryLabel: "Open court forms",
        primaryHref: firstResource.url || "#forms-packets",
        meta: ["Reviewed forms first", ...baseMeta.slice(1)],
        route: baseRoute
      };
    }

    if (isSourceOnlyCounty) {
      return {
        tone: "source",
        kicker: "County source found",
        title: "Open the county court page.",
        copy: "For this county, use the court page. If you cannot tell which forms fit, start Intake.",
        primaryLabel: "Open county page",
        primaryHref: firstResource.url || "#forms-official-router",
        meta: ["County page first", "Use Guided Intake if unsure"],
        route: baseRoute
      };
    }

    return {
      tone: "neutral",
      kicker: "Reviewed forms first",
      title: "Start with reviewed forms or use Intake.",
      copy: "If county, case stage, or children status is unclear, do not guess. Review the form options first or use Intake.",
      primaryLabel: "Open court forms",
      primaryHref: firstResource.url || "#forms-official-router",
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
    if (title) title.textContent = decision.title || "Choose a route to see the safest next step.";
    if (copy) copy.textContent = decision.copy || "Use reviewed forms first and Guided Intake when facts require review.";
    if (meta) {
      const items = Array.isArray(decision.meta) && decision.meta.length
        ? decision.meta
        : ["Reviewed forms first", "No private facts needed", "Use Guided Intake if unsure"];
      meta.innerHTML = items.slice(0, 3).map((item) => `<span>${esc(item)}</span>`).join("");
    }
    if (primary) {
      primary.textContent = decision.primaryLabel || "Open court forms";
      primary.setAttribute("href", decision.primaryHref || "#forms-official-router");
      primary.dataset.formRouteDecisionPacket = decision.pdfPacket || "";
      const external = /^https?:\/\//.test(decision.primaryHref || "");
      if (external) {
        primary.setAttribute("target", "_blank");
        primary.setAttribute("rel", "noopener");
        primary.removeAttribute("data-link");
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
    const packetHref = input.packetHref || "#forms-approved-pdfs";
    const rawCourtHref = decision.primaryHref || "#forms-official-router";
    const courtHref = /^https?:\/\//.test(rawCourtHref) ? "#forms-approved-pdfs" : rawCourtHref;
    const intakeRoute = decision.route || guideFallbackRoute();
    host.dataset.routeTone = decision.tone || "neutral";
    host.innerHTML = `
      <div class="forms-unified-main">
        <span>Start here</span>
        <strong>${esc(decision.title || "Review the recommended forms first.")}</strong>
        <p>${esc(decision.copy || "Use the on-page form viewer first, then use Intake if the choice is unclear.")}</p>
      </div>
      <div class="forms-unified-actions">
        <a class="button primary" href="${esc(courtHref)}">${esc(decision.primaryLabel || "View on-site forms")}</a>
        <a class="button outline" href="${esc(packetHref)}">View forms${packetLabel ? `: ${esc(packetLabel)}` : ""}</a>
        <a class="button ghost" href="/start" data-link data-forms-unified-intake>Start Guided Intake instead</a>
      </div>
    `;
    host.querySelector("[data-forms-unified-intake]")?.setAttribute("data-intake-route", JSON.stringify(intakeRoute));
  }

  const packetReadinessCatalog = [
    {
      title: "Statewide starting point",
      scope: "Unknown county, first pass, or general document review",
      status: "Source verified",
      action: "View statewide form guidance"
    },
    {
      title: "Safety and protective orders",
      scope: "Protective order, injunction, or urgent safety resource routing",
      status: "Source verified",
      action: "Open AZPOINT"
    },
    {
      title: "Maricopa divorce packets",
      scope: "New filing with or without children, response, agreement, and consent decree routing",
      status: "Packet URLs pending review",
      action: "Open Maricopa forms library"
    },
    {
      title: "Maricopa parenting/support packets",
      scope: "Parentage, parenting time, legal decision-making, child support, worksheet readiness",
      status: "Packet URLs pending review",
      action: "Open Maricopa forms library"
    },
    {
      title: "Post-decree and enforcement",
      scope: "Modification, enforcement, contempt, support, parenting, and maintenance order issues",
      status: "Packet URLs pending review",
      action: "Open court source"
    },
    {
      title: "Disclosure and court readiness",
      scope: "Financial disclosure, exhibits, temporary orders, and hearing preparation resources",
      status: "Packet URLs pending review",
      action: "Use checklist first"
    }
  ];

  const sourceMonitorSnapshot = {
    version: "0.6.0",
    checked: "19 official-source records checked",
    result: "19 OK / 0 broken",
    rule: "Public downloads stay disabled until packet URLs and hashes are reviewed."
  };

  const maricopaCandidateSnapshot = {
    version: "0.4.0",
    extracted: "16 Maricopa candidate packet links",
    groups: "7 packet groups mapped",
    rule: "Candidates require human review before download buttons are enabled."
  };

  const reviewQueueSnapshot = {
    version: "0.5.0",
    total: "16 review queue items",
    allowed: "7 official packet-page actions allowed",
    rule: "Reviewed packet starts stay controlled while approved PDFs open in the on-site viewer."
  };

  const pdfCandidateSnapshot = {
    version: "0.6.0",
    extracted: "40 official PDF candidates found",
    result: "40 OK / 0 broken",
    rule: "PDF links remain review-only until promoted by human review."
  };

  const pdfReviewQueueSnapshot = {
    version: "0.7.0",
    total: "40 PDF review items",
    split: "36 English / 34 Spanish",
    rule: "Human-reviewed items can now be promoted through the validated public manifest."
  };

  const pdfPromotionSnapshot = {
    version: "0.8.0",
    total: "74 public official PDF actions enabled",
    pending: "0 PDFs pending review",
    rule: "Approved PDFs can be viewed and downloaded on site through controlled same-origin delivery."
  };

  const pdfReviewWorkbenchSnapshot = {
    version: "0.9.0",
    batches: "9 packet review batches completed",
    total: "70 official PDF candidates organized",
    rule: "Review decisions validate before any official PDF link is surfaced."
  };

  const pdfDecisionTemplateSnapshot = {
    version: "1.0.0",
    template: "74 reviewer decision records completed",
    validation: "Decision validation passed before promotion",
    rule: "The decision file remains the controlled source for public PDF action changes."
  };

  const pdfPromotionAuditSnapshot = {
    version: "1.1.0",
    ready: "74 promotion-ready PDF decisions",
    blocked: "0 blocked promotions",
    rule: "Dry-run audit must match the intended review result before public PDF actions change."
  };

  const pdfRouteIndexSnapshot = {
    version: "1.0.0",
    routes: "4 safe packet routes indexed",
    actions: "40 approved official PDF actions mapped",
    rule: "Route metadata stays limited to county, issue, posture, child-involved status, packet, language, and official source."
  };

  const maricopaCandidateGroups = [
    ["Divorce with children", "Candidate packet page found"],
    ["Divorce without children", "Candidate packet page found"],
    ["Summary consent decree", "Candidate packet page found"],
    ["Parentage / parenting / support", "3 candidate packet pages found"],
    ["Modification", "3 candidate packet pages found"],
    ["Enforcement", "3 candidate packet pages found"],
    ["Temporary orders / worksheet readiness", "4 candidate packet pages found"]
  ];

  const officialPacketPageActions = [
    {
      label: "Divorce with Minor Children",
      packet: "Maricopa divorce or separation - with children",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_4/"
    },
    {
      label: "Divorce with No Minor Children",
      packet: "Maricopa divorce or separation - no children",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_3/"
    },
    {
      label: "Summary Consent Decree",
      packet: "Agreement / final orders",
      url: "https://superiorcourt.maricopa.gov/llrc/drscd/"
    },
    {
      label: "Paternity, Parenting Time and Support",
      packet: "Parentage / parenting / support",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_6/"
    },
    {
      label: "Modify Parenting, Decision-Making and Support",
      packet: "Post-decree modification",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_14/"
    },
    {
      label: "Enforce a Support Order",
      packet: "Enforcement",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_11/"
    },
    {
      label: "Temporary Orders Pre-Decree",
      packet: "Court readiness",
      url: "https://superiorcourt.maricopa.gov/llrc/fc_group_5/"
    }
  ];

  const pdfReviewGroups = [
    ["Divorce with children", "10 PDFs: 5 English / 5 Spanish"],
    ["Divorce without children", "10 PDFs: 5 English / 5 Spanish"],
    ["Summary consent decree", "10 PDFs: 5 English / 5 Spanish"],
    ["Parentage / parenting / support", "10 PDFs: 5 English / 5 Spanish"]
  ];

  const calculatorCatalog = [
    {
      title: "Child Support Calculator",
      use: "Official Arizona calculation support when income, parenting time, insurance, childcare, and support inputs are available.",
      source: "Arizona Judicial Branch / official calculator",
      safety: "Official calculator link first; on-site estimates only after version monitoring and review."
    },
    {
      title: "Spousal Maintenance Calculator",
      use: "Planning support for guideline version, eligibility, amount, duration, and effective-date awareness.",
      source: "Arizona Judicial Branch / official maintenance calculator",
      safety: "Formula/version changes must trigger review before any on-site calculation logic is used."
    },
    {
      title: "Parenting Time Counter",
      use: "On-site organizer for annual overnights and schedule assumptions used by other tools.",
      source: "MFLG planning tool with user-entered assumptions",
      safety: "No child names, birth dates, school names, or sensitive allegations required."
    },
    {
      title: "Deadline Readiness Planner",
      use: "Public checklist for served papers, hearing dates, service, disclosure, and response urgency.",
      source: "MFLG planning tool with official-source links",
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
    return section(routeIntent.title, routeIntent.copy, `
      <div class="forms-command-center forms-smart-path" data-forms-smart-path>
        <div class="forms-smart-path-copy">
          <p class="eyebrow">Start here</p>
          <h3>Start with one simple choice.</h3>
          <p>You do not need legal terms. Pick what sounds closest and this page will point you to forms, a calculator, or Guided Intake.</p>
          <div class="forms-start-steps" aria-label="Forms and Tools start steps">
            <article><span>Step 1</span><strong>Tell us what you need</strong></article>
            <article><span>Step 2</span><strong>Choose the closest match</strong></article>
            <article><span>Step 3</span><strong>Open court forms, use a calculator, or start intake</strong></article>
          </div>
          <div class="forms-guided-start" data-forms-guided-start>
            <div>
              <span>Guided Form Helper</span>
              <strong>Answer one question at a time.</strong>
              <p data-guided-copy>Start with what you need. The page will update the choices below for you.</p>
            </div>
            <div class="forms-guided-progress" aria-label="Guided Forms and Tools steps">
              <button type="button" data-guided-jump="0" aria-current="true">1</button>
              <button type="button" data-guided-jump="1">2</button>
              <button type="button" data-guided-jump="2">3</button>
              <button type="button" data-guided-jump="3">4</button>
              <button type="button" data-guided-jump="4">5</button>
            </div>
            <div class="forms-guided-question" data-guided-question>What sounds closest?</div>
            <div class="forms-guided-options" data-guided-options></div>
            <div class="forms-guided-result" data-guided-result>
              <span>Your next step</span>
              <strong data-guided-result-title>Start with the form finder.</strong>
              <p data-guided-result-copy>Answer the questions above and use the blue button when you are ready.</p>
              <div class="forms-guided-summary" data-guided-summary></div>
              <div class="forms-guided-path-line" data-guided-path-line>Answer the next question. The page will keep the form choices hidden until they are useful.</div>
              <div class="forms-guided-result-actions">
                <button class="button primary" type="button" data-guided-result-action data-guided-target="#forms-official-router">Continue to recommended forms</button>
                <a class="button outline" href="/start" data-link data-guided-intake-fallback data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Not sure? Start Guided Intake</a>
              </div>
            </div>
          </div>
          <div class="forms-path-strip" aria-label="Recommended Forms and Tools path">
            <span><b>1</b> Tell us what you need</span>
            <span><b>2</b> Pick the closest match</span>
            <span><b>3</b> Open the next safe step</span>
          </div>
          <div class="forms-entry-lanes" aria-label="Beginner Forms and Tools starting points">
            <a href="#forms-official-router" data-smart-lane="forms">
              <span>Court forms</span>
              <strong>I need court forms.</strong>
            </a>
            <a href="#forms-calculator-hub" data-smart-lane="calculator">
              <span>Calculators</span>
              <strong>I need a calculator.</strong>
            </a>
            <a href="#deadline-readiness-planner" data-smart-lane="deadline">
              <span>Deadline</span>
              <strong>I was served or have a deadline.</strong>
            </a>
            <a href="/start" data-link data-smart-lane="intake" data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>
              <span>Not sure</span>
              <strong>I am not sure.</strong>
            </a>
          </div>
        </div>
        <details class="forms-smart-path-controls" aria-label="Forms and tools recommendation controls">
          <summary class="forms-smart-path-controls-head">
            <span>Optional</span>
            <strong>Fine tune the result.</strong>
          </summary>
          <label>What are you trying to do?
            <select data-smart-need>
              <option value="forms"${initialToolMode === "forms" ? " selected" : ""}>Find court forms</option>
              <option value="deadline">Respond to served papers or a deadline</option>
              <option value="issue">Search by family-law issue</option>
              <option value="calculator"${initialToolMode === "calculator" ? " selected" : ""}>Use a calculator</option>
              <option value="intake">Ask the office to route me</option>
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
          <span data-smart-mode-copy>Recommended path shown first. Browse all sections only if you want more options.</span>
          <div class="forms-smart-path-mode-actions">
            <button class="button ghost" type="button" data-smart-show-all>Advanced: show all sections</button>
            <button class="button ghost" type="button" data-smart-reset>Reset choices</button>
          </div>
        </div>
      </div>

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

      <div class="forms-router" id="forms-official-router" data-flow-section="forms deadline manual" aria-label="Court forms finder">
        <div class="forms-router-head">
          <div>
            <p class="eyebrow">Step 1</p>
            <h2>Choose the form group that sounds closest.</h2>
            <p>The guided helper fills this in for you. Change the boxes only if the recommendation does not match. If you are unsure, use Guided Intake instead of guessing.</p>
          </div>
          <a class="button outline" href="/start" data-link data-form-route-save data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Not sure? Start Guided Intake</a>
        </div>
        <div class="forms-router-controls">
          <label>County
            <select data-form-county>
              ${formRouterCounties.map((county) => `<option value="${esc(county)}">${esc(county)}</option>`).join("")}
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
          <label>Children
            <select data-form-children>
              ${formRouterChildren.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}
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
              <strong data-form-route-decision-title>Choose the boxes above to get a next step.</strong>
              <p data-form-route-decision-copy>The page will recommend reviewed forms or Intake if the choice is not clear.</p>
              <div class="forms-route-decision-meta" data-form-route-decision-meta>
                <span>No private facts needed</span>
                <span>Use Guided Intake if unsure</span>
              </div>
            </div>
            <div class="forms-route-decision-actions">
              <a class="button primary" href="#forms-approved-pdfs" data-form-route-decision-primary>View matching forms</a>
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
            data-status="${esc(item.status)}"
            data-url="${esc(item.url)}">
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
            <p>Open court forms here and keep your place. Use Guided Intake if the form group or next step is unclear.</p>
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
              <span>Official fallback workspace</span>
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
              <p data-official-calculator-embed-copy>Use this court calculator only if the on-site calculator does not fit. If the frame does not load, use Intake so the office can help route the next step.</p>
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
              <p>Use this to decide whether to contact the office or open official court sources now. Do not enter private facts, documents, names, allegations, or case numbers here.</p>
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
      "Open Guided Intake with the matter issue and route context saved"
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
      const route = guideRoute(guide);
      return `<article class="card guide-card"${index >= initialServiceCount ? ` hidden data-guide-extra` : ""} data-guide-card data-category="${esc(guide.category)}" data-guide-index="${index}" data-guide-title="${esc(guide.title.toLowerCase())}" data-guide-category="${esc(guide.category.toLowerCase())}" data-title="${esc(`${guide.title} ${guide.category} ${guide.summary} ${guide.level || ""} ${(guide.items || []).join(" ")} ${(guide.phases || []).join(" ")} ${(guide.listener || []).join(" ")}`.toLowerCase())}">
      <div class="guide-card-head">
        <div>
          <p class="service-kicker">${esc(guide.category)}</p>
          <h3>${esc(guide.title)}</h3>
        </div>
      </div>
      <p>${esc(guide.summary)}</p>
      <button class="guide-detail-trigger" type="button" data-guide-open="${index}" aria-expanded="false">View Forms & Calculator</button>
      <div class="guide-lead">
        <p>${esc(guide.leadMagnet || "Readiness review")}</p>
        <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>${esc(guide.leadCta || "Start guided intake")}</a>
      </div>
    </article>`;
    }).join("");
  }

  function renderGuidePanel(guide, index) {
    const route = guideRoute(guide);
    const calculatorChoice = guideCalculatorChoiceFor(guide);
    const packetChoices = guidePacketChoicesFor(guide);
    const formsRoute = packetChoices[0]
      ? {
        ...guideFormsRouteFor(guide),
        issue: packetChoices[0].issue,
        posture: packetChoices[0].posture,
        children: packetChoices[0].children,
        pdfPacket: packetChoices[0].packet,
        formConfidence: packetChoices[0].confidence || "related",
        officialSourceUrl: packetChoices[0].sourceUrl || ""
      }
      : guideFormsRouteFor(guide);
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
          <strong>View the forms and calculator for this guide.</strong>
          <p>${esc(guideResourceSummaryFor(guide))} Forms open on this page. You are not filing anything by viewing or downloading a PDF.</p>
        </div>
        <div class="guide-next-options" role="list">
          <button class="active" type="button" data-guide-next-choice="forms">View forms</button>
          ${calculatorChoice ? `<button type="button" data-guide-next-choice="calculator">Use calculator</button>` : ""}
          <button type="button" data-guide-next-choice="intake">I am not sure</button>
        </div>
        <div class="guide-next-result" data-guide-next-result="forms">
          <div>
            <span>Forms</span>
            <strong>Open the forms assigned to this guide.</strong>
            <p>The PDF viewer below opens the approved court forms for this practice area. If the form title does not fit, use Guided Intake.</p>
          </div>
          <button class="button primary" type="button" data-guide-scroll-forms>View forms below</button>
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
      ${packetChoices.length ? `<div class="guide-packet-chooser" data-guide-packet-chooser>
        <div>
          <span>Form path</span>
          <strong>Choose the situation that fits before opening forms.</strong>
          <p>Pick the closest public form path. If none of these sound right, use Guided Intake instead of guessing.</p>
        </div>
        <div class="guide-packet-options" role="list">
          ${packetChoices.map((choice, choiceIndex) => `<button class="${choiceIndex === 0 ? "active" : ""}" type="button" data-guide-packet-choice="${esc(choice.key)}" data-packet-id="${esc(choice.packet)}" data-route-issue="${esc(choice.issue)}" data-route-posture="${esc(choice.posture)}" data-route-children="${esc(choice.children)}" data-route-confidence="${esc(choice.confidence || "related")}" data-route-source-url="${esc(choice.sourceUrl || "")}">
            <em class="form-confidence ${esc(choice.confidence || "related")}">${esc(formConfidenceLabel(choice.confidence))}</em>
            <span>${esc(choice.label)}</span>
            <small>${esc(choice.helper)}</small>
          </button>`).join("")}
        </div>
      </div>` : ""}
      <div class="guide-forms-viewer" data-guide-pdf-panel data-guide-pdf-packet="${esc(formsRoute.pdfPacket || "")}" data-guide-title="${esc(guide.title)}" data-guide-route='${esc(JSON.stringify(formsRoute))}'>
        <div class="guide-forms-viewer-head">
          <div>
            <span>Forms for this guide</span>
            <strong>Loading approved PDFs...</strong>
            <p>Forms appear here so you can stay on this guide.</p>
          </div>
        </div>
      </div>
      <div class="guide-panel-actions">
        <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(route))}'>${esc(guide.leadCta || "Start guided intake")}</a>
        <button class="button outline" type="button" data-guide-scroll-forms>View forms for this guide</button>
        ${calculatorChoice ? `<a class="button outline" href="/tools#forms-calculator-hub" data-link data-guide-calculator-choice="${esc(calculatorChoice)}" data-guide-forms-route='${esc(JSON.stringify(formsRoute))}'>${esc(calculatorChooserLabel)}</a>` : ""}
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
      contextNote: "Your DIY guide selection was carried into Intake. Use the questions below to confirm the issue, timing, court-form needs, and next step.",
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
      contextNote: `Your ${guide.title} DIY guide selection was carried into Intake. The guide path and readiness focus are saved below, and you can update anything that does not fit.`,
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
          <div><dt>Operating model</dt><dd>Guided Intake creates a structured review record so the office can check conflict, licensed scope, urgency, documents, and next-step fit.</dd></div>
        </dl>
      </div>
        <div class="about-profile-media"><img src="/assets/images/jeremy-profile.jpeg?v=mflg-live-20260613-countygate1" alt="Jeremy James Jack JD, LP"></div>
      <div class="about-profile-actions actions">
        ${link("/start", "Start Guided Intake", "primary")}
        ${link("/contact", "Contact the office", "outline")}
      </div>
    </div>
    <div class="about-proof-grid">
      <article class="card"><h3>Family-law focus</h3><p>Divorce, parenting, child support, parentage, maintenance, enforcement, agreements, disclosure, filings, hearings, and settlement support are routed through issue-specific intake paths.</p></article>
      <article class="card"><h3>Scope-first review</h3><p>Some matters need attorney involvement, emergency resources, or referral. The intake flow is designed to surface those concerns before representation is confirmed.</p></article>
      <article class="card"><h3>Document-centered process</h3><p>Forms, orders, agreements, worksheets, exhibits, service issues, and deadlines are gathered early so the first review starts with usable information.</p></article>
    </div>
    <div class="about-process" aria-label="About intake process">
      ${[
        ["01", "Choose the closest issue", "Practice areas and Guides both route into Intake with the selected matter issue preserved."],
        ["02", "Build the review record", "The form captures county, case stage, deadline, children, support, documents, and service needs."],
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
        ["Can I call instead of using Guided Intake?", "Yes, but Guided Intake is the best first step for new matters because it creates the structured record needed for conflict, scope, urgency, and service-fit review."],
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
          <p class="eyebrow">Question router</p>
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
        <a href="https://www.azcourts.gov/selfservicecenter/Family-Law-Forms/Child-Support" target="_blank" rel="noopener">Arizona Courts family-law forms and basic filing information</a>
        <a href="https://www.azbar.org/for-legal-professionals/practice-tools-management/practice-2-0/legal-paraprofessionals/" target="_blank" rel="noopener">State Bar of Arizona Legal Paraprofessionals</a>
        <a href="https://www.azleg.gov/ars/25/00403.htm" target="_blank" rel="noopener">A.R.S. § 25-403 best-interests factors</a>
        <a href="https://www.azleg.gov/ars/25/00411.htm" target="_blank" rel="noopener">A.R.S. § 25-411 modification timing and adequate cause</a>
        <a href="https://www.americanbar.org/groups/family_law/resources/family-advocate/client-manuals/" target="_blank" rel="noopener">ABA Family Advocate client manuals</a>
      </div>`);
  }

  function contact() {
    return section("Contact", "Use the guided intake for structured review, or contact the office directly for urgent timing issues.", `<div class="grid two">
      <article class="card"><h3>Office</h3><p><a href="tel:+18888706354">(888) 870-6354</a><br><a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a><br>Fax: 602-782-8114</p><p>Jeremy James Jack JD, LP<br>Arizona Supreme Court Licensed Legal Paraprofessional — Family Law<br>License No. 500094</p></article>
      <article class="card"><h3>Before sending details</h3><p>Please do not send confidential facts until the office confirms whether services can be provided.</p><p>Guided Intake is the best path for new matters because it creates the structured record needed for conflict, scope, urgency, and service-fit review.</p></article>
    </div><div class="grid two contact-recommendations">
      <article class="card"><h3>Current best path</h3><p>New matters should start with Guided Intake. Existing clients should contact the office for case status, documents, scheduling, and next-step support.</p><a class="card-link" href="/start" data-link>Start Guided Intake →</a></article>
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
    </div></section><section class="intake-shell intake-shell-start"><div id="mflg-intake-root"></div></section>`;
  }

  function clientLogin() {
    return section("Client Portal", "Secure client access is coordinated directly through the office while portal access is prepared.", `<div class="notice"><strong>Client portal access is coordinated through the office.</strong> Existing clients who need documents, scheduling help, or case access support should contact the office at <a href="tel:+18888706354">(888) 870-6354</a> or <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>. New matters should begin with Guided Intake so conflict, scope, urgency, and service fit can be reviewed first.</div><div class="access-roadmap">
      <article class="card"><h3>New matters</h3><p>Guided Intake creates the structured review record used for conflict, scope, urgency, and service-fit review.</p><a class="card-link" href="/start" data-link>Start Guided Intake →</a></article>
      <article class="card"><h3>Existing clients</h3><p>Contact the office for case status, document access, scheduling questions, or next-step coordination.</p></article>
      <article class="card"><h3>Secure access plan</h3><p>When portal access is active, this page will direct clients to status, documents, tasks, and communications from one secure entry point.</p></article>
    </div><div class="actions"><a class="button primary" href="/start" data-link>Start Guided Intake</a><a class="button outline" href="/contact" data-link>Contact Office</a></div>`);
  }

  function staffLogin() {
    return section("Staff Access", "Staff access is restricted and will remain separate from public intake navigation.", `<div class="notice">Authorized staff should use the protected staff access process. This public page does not provide case-system or administrative access.</div>`);
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
      <a href="https://www.azcourts.gov/Licensing-Regulation/Legal-Paraprofessional-Program" target="_blank" rel="noopener">Arizona Supreme Court Legal Paraprofessional Program</a>
      <a href="https://www.azbar.org/for-legal-professionals/practice-tools-management/practice-2-0/legal-paraprofessionals/" target="_blank" rel="noopener">State Bar of Arizona Legal Paraprofessionals</a>
      <a href="https://www.azbar.org/for-legal-professionals/lawyer-regulation/resources/rules-of-professional-conduct/" target="_blank" rel="noopener">Arizona Rules of Professional Conduct</a>
    </div>`);
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
      <a href="https://www.azcourts.gov/Portals/0/0/admcode/pdfcurrentcode/7-210%20Legal%20Paraprofessional%20Amended%2008-2024.pdf" target="_blank" rel="noopener">ACJA Section 7-210 Legal Paraprofessional</a>
      <a href="https://www.azbar.org/for-legal-professionals/lawyer-regulation/resources/rules-of-professional-conduct/" target="_blank" rel="noopener">Arizona Rule 42, Rules of Professional Conduct</a>
      <a href="https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/" target="_blank" rel="noopener">ABA Model Rules reference</a>
    </div>`);
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
    </div>`);
  }

  function thankYou() {
    return section("Thank You", "Thank you for contacting MY FAMILY LAW GROUP PLLC.", `<p>Your information will be reviewed for conflict, scope, urgency, and next-step needs. Submission does not create a client relationship or confirm representation.</p>`);
  }

  function notFound() {
    return section("Page Not Found", "The page you requested was not found.", link("/", "Return Home", "primary"));
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
	    scheduleLegalTermEnhancement(root);
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
	  }

	  function storeFormsRoute(route, calculatorChoice) {
	    try {
	      window.sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({
	        ...(route || {}),
	        calculatorChoice: calculatorChoice || "",
	        routedAt: new Date().toISOString()
	      }));
	    } catch (error) {
	      /* Forms routing still works without session storage. */
	    }
	    if (route && typeof route === "object") {
	      window.MFLGLatestFormsRoute = { ...route };
	    }
	  }

	  function storedFormsRoute() {
	    try {
	      return parseRouteData(window.sessionStorage.getItem("mflgFormsRouteContext"));
	    } catch (error) {
	      return null;
	    }
	  }

	  function applyStoredFormsRouteIfNeeded(path) {
	    if (path !== "/tools" && path !== "/forms" && path !== "/calculators") return;
	    const route = storedFormsRoute();
	    if (!route) return;
	    window.MFLGLatestFormsRoute = {
	      county: route.county || "Statewide",
	      issue: route.issue || "all",
	      posture: route.posture || "Any posture",
	      children: route.children || "any",
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

  function updateNav(path) {
    document.querySelectorAll("[data-nav] a").forEach((item) => {
      item.removeAttribute("aria-current");
      if (item.getAttribute("href") === path) item.setAttribute("aria-current", "page");
    });
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
    const category = document.querySelector("[data-guide-category]");
    const list = document.querySelector("[data-guide-list]");
    const button = document.querySelector("[data-guide-reveal]");
    const reveal = document.querySelector(".guide-reveal");
    const count = document.querySelector("[data-guide-count]");
    const note = document.querySelector("[data-guide-note]");
    if (!search || !category || !list) return;
    const cards = Array.from(list.querySelectorAll("[data-guide-card]"));
    const guideData = serviceItems.map(guideFromServiceItem);
    let revealed = false;
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
          panel.querySelector("[data-guide-pdf-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            posture: button.dataset.routePosture || route.posture || "New filing",
            children: button.dataset.routeChildren || route.children || "any",
            pdfPacket: button.dataset.packetId || route.pdfPacket || "",
            formConfidence: button.dataset.routeConfidence || route.formConfidence || "related",
            officialSourceUrl: button.dataset.routeSourceUrl || route.officialSourceUrl || ""
          };
          host.setAttribute("data-guide-pdf-packet", nextRoute.pdfPacket || "");
          host.setAttribute("data-guide-route", JSON.stringify(nextRoute));
          panel.querySelectorAll("[data-guide-packet-choice]").forEach((item) => {
            item.classList.toggle("active", item === button);
          });
          wireGuidePdfPanel(panel);
        });
      });
      const choiceButtons = Array.from(panel.querySelectorAll("[data-guide-next-choice]"));
      const resultPanels = Array.from(panel.querySelectorAll("[data-guide-next-result]"));
      choiceButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const choice = button.getAttribute("data-guide-next-choice") || "forms";
          choiceButtons.forEach((item) => item.classList.toggle("active", item === button));
          resultPanels.forEach((item) => {
            item.hidden = item.getAttribute("data-guide-next-result") !== choice;
          });
        });
      });
      requestAnimationFrame(() => {
        panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
      const cat = category.value;
      const hasPrimaryMatch = !!term && cards.some((card) => {
        const title = card.dataset.guideTitle || "";
        const guideCategory = card.dataset.guideCategory || "";
        return title.includes(term) || guideCategory.includes(term);
      });
      const categoryActive = !!cat;
      const limit = defaultVisibleCount();
      let visible = 0;
      let matchesTotal = 0;
      cards.forEach((card) => {
        const title = card.dataset.guideTitle || "";
        const guideCategory = card.dataset.guideCategory || "";
        const haystack = card.dataset.title.toLowerCase();
        const primaryMatch = title.includes(term) || guideCategory.includes(term);
        const matchesTerm = !term || (hasPrimaryMatch ? primaryMatch : haystack.includes(term));
        const matchesCat = !cat || card.dataset.category === cat;
        let rank = 4;
        if (term && title === term) rank = 0;
        else if (term && title.startsWith(term)) rank = 1;
        else if (term && title.includes(term)) rank = 2;
        else if (term && guideCategory.includes(term)) rank = 3;
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
          ? `Showing ${visible} matching DIY guide${visible === 1 ? "" : "s"}`
          : `Showing ${visible} of ${cards.length} DIY guides`;
      }
      if (note) {
        const remaining = Math.max(cards.length - limit, 0);
        note.textContent = revealed
          ? `Showing all ${cards.length} DIY guides. Search or choose a category to narrow the list.`
          : `Showing the first ${Math.min(limit, matchesTotal)} guides for this screen. Search any topic, choose a category, or reveal the remaining ${remaining}.`;
      }
      if (reveal) {
        reveal.classList.toggle("revealed", revealed || !!term || categoryActive);
      }
    };
    search.addEventListener("input", filter);
    category.addEventListener("change", filter);
    button?.addEventListener("click", () => {
      revealed = true;
      filter();
    });
    cards.forEach((card) => {
      card.querySelector("[data-guide-open]")?.addEventListener("click", () => openGuidePanel(card));
    });
    window.addEventListener("resize", filter, { passive: true });
    filter();
  }

  async function wireGuidePdfPanel(panel) {
    const host = panel.querySelector("[data-guide-pdf-panel]");
    if (!host) return;
    const packetId = host.getAttribute("data-guide-pdf-packet") || "";
    const guideTitle = host.getAttribute("data-guide-title") || "this guide";
    const formsRoute = parseRouteData(host.getAttribute("data-guide-route")) || {};
    const formConfidence = formsRoute.formConfidence || "related";
    const requiresIntakeBeforeForms = formConfidence === "intake-required" || formConfidence === "related-only";
    const countySpecific = (formsRoute.county || "Maricopa") === "Maricopa" && formConfidence !== "statewide-generic";
    const countyConfirmed = host.getAttribute("data-guide-county-confirmed") === "true";

    if (requiresIntakeBeforeForms) {
      host.innerHTML = `
        <div class="guide-forms-viewer-head guide-county-gate">
          <div>
            <span>${esc(formConfidenceLabel(formConfidence))}</span>
            <strong>Confirm the path before opening forms.</strong>
            <p>${esc(formConfidenceCopy(formConfidence))} This guide depends on county, case stage, children, timing, or existing court orders.</p>
          </div>
          <div class="guide-county-actions">
            ${isUsableHref(formsRoute.officialSourceUrl) ? `<a class="button outline" href="${esc(formsRoute.officialSourceUrl)}" target="_blank" rel="noopener">Review official source</a>` : ""}
            <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Start Guided Intake</a>
          </div>
        </div>
      `;
      scheduleLegalTermEnhancement(host);
      return;
    }

    if (countySpecific && !countyConfirmed) {
      host.innerHTML = `
        <div class="guide-forms-viewer-head guide-county-gate">
          <div>
            <span>${esc(formConfidenceLabel(formConfidence))}</span>
            <strong>Confirm county before opening PDFs.</strong>
            <p>These forms are assigned to Maricopa County. If your case is in another Arizona county, the local superior court may require its own packet.</p>
          </div>
          <label class="guide-county-select">Case county
            <select data-guide-county-choice>
              <option value="">Choose county</option>
              <option value="Maricopa">Maricopa County</option>
              <option value="Other">Another Arizona county</option>
              <option value="Not sure">I am not sure</option>
            </select>
          </label>
          <div class="guide-county-actions">
            <button class="button primary" type="button" data-guide-county-confirm disabled>Open Maricopa PDFs</button>
            <a class="button outline" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Use Guided Intake</a>
          </div>
          <p class="guide-county-note" data-guide-county-note>Select Maricopa only if your case or new filing belongs there.</p>
        </div>
      `;
      const countyChoice = host.querySelector("[data-guide-county-choice]");
      const confirm = host.querySelector("[data-guide-county-confirm]");
      const note = host.querySelector("[data-guide-county-note]");
      countyChoice?.addEventListener("change", () => {
        const value = countyChoice.value;
        if (confirm) confirm.disabled = value !== "Maricopa";
        if (note) {
          note.textContent = value === "Maricopa"
            ? "Maricopa selected. You can open the Maricopa PDF viewer below."
            : value
              ? "Use Guided Intake or the official source before relying on Maricopa packets for another county."
              : "Select Maricopa only if your case or new filing belongs there.";
        }
      });
      confirm?.addEventListener("click", () => {
        host.setAttribute("data-guide-county-confirmed", "true");
        wireGuidePdfPanel(panel);
      });
      scheduleLegalTermEnhancement(host);
      return;
    }

    try {
      const response = await fetch(`/data/form-pdf-public-actions.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const rawActions = (Array.isArray(manifest.actions) ? manifest.actions : [])
        .filter((action) => action.packet_id === packetId)
        .filter((action) => {
          if (formsRoute.children !== "no-minor-children") return true;
          const text = guidePdfSearchText(action);
          return !(text.includes("parenting plan") || text.includes("child support") || text.includes("legal decision-making order"));
        });
      const actions = sortGuidePdfActions(rawActions, formsRoute, guideTitle);

      if (!actions.length) {
        host.innerHTML = `
          <div class="guide-forms-viewer-head">
            <div>
              <span>Forms for this guide</span>
              <strong>Forms are being reviewed for ${esc(guideTitle)}.</strong>
              <p>This guide does not yet have an approved on-site PDF group. Use Guided Intake so the office can confirm the correct official forms.</p>
            </div>
            <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Start Guided Intake</a>
          </div>
        `;
        scheduleLegalTermEnhancement(host);
        return;
      }

      const first = actions[0];
      const actionRoute = (action) => formsToolRouteFor(
        { ...formsRoute, pdfPacket: packetId },
        action.packet_label || "",
        {
          displayLabel: action.display_label || action.public_name || "",
          label: action.source_label || action.label || action.public_name || "",
          fileName: action.file_name || "",
          language: action.language || "",
          officialUrl: action.official_pdf_url || ""
        }
      );

      host.innerHTML = `
        <div class="guide-forms-viewer-head">
          <div>
            <span>Forms for this guide</span>
            <strong>${esc(guideTitle)} forms</strong>
            <p>Start with the first form shown. The rest continue in the order most likely to match this guide. You are not filing anything by viewing them.</p>
          </div>
          <a class="button outline" href="/start" data-link data-guide-pdf-intake>Use Guided Intake</a>
        </div>
        <div class="guide-pdf-layout">
          <div class="guide-pdf-list" aria-label="${esc(guideTitle)} forms">
            ${actions.map((action, actionIndex) => `
              <button class="${action === first ? "active" : ""}" type="button" data-guide-pdf-choice="${actionIndex}">
                <span>${String(actionIndex + 1).padStart(2, "0")} · ${esc(action.public_stage || action.language || "Court form")}</span>
                <strong>${esc(action.public_name || action.display_label || action.label || action.file_name || "Official court PDF")}</strong>
                <p>${esc([action.language, action.public_file_code || action.file_name].filter(Boolean).join(" / "))}</p>
              </button>
            `).join("")}
          </div>
          <div class="guide-pdf-frame">
            <div class="guide-pdf-frame-head">
              <div>
                <span data-guide-pdf-stage>${esc(first.public_stage || "Court form")}</span>
                <strong data-guide-pdf-title>${esc(first.public_name || first.display_label || first.file_name || "Official court PDF")}</strong>
                <p data-guide-pdf-copy>${esc(first.public_description || "Approved court PDF assigned to this guide.")}</p>
              </div>
              ${isUsableHref(first.site_pdf_download_url || first.site_pdf_view_url || first.official_pdf_url)
                ? `<a class="button outline" href="${esc(first.site_pdf_download_url || first.site_pdf_view_url || first.official_pdf_url)}" data-guide-pdf-download>Download PDF</a>`
                : `<button class="button outline" type="button" data-guide-pdf-download disabled>PDF unavailable</button>`}
            </div>
            <iframe title="${esc(guideTitle)} court PDF viewer" loading="lazy" src="${esc(first.site_pdf_view_url || first.official_pdf_url || "")}" data-guide-pdf-frame></iframe>
          </div>
        </div>
      `;
      scheduleLegalTermEnhancement(host);

      const intake = host.querySelector("[data-guide-pdf-intake]");
      const frame = host.querySelector("[data-guide-pdf-frame]");
      const title = host.querySelector("[data-guide-pdf-title]");
      const stage = host.querySelector("[data-guide-pdf-stage]");
      const copy = host.querySelector("[data-guide-pdf-copy]");
      const download = host.querySelector("[data-guide-pdf-download]");
      const buttons = Array.from(host.querySelectorAll("[data-guide-pdf-choice]"));

      const setActive = (index) => {
        const action = actions[index] || first;
        buttons.forEach((button, buttonIndex) => button.classList.toggle("active", buttonIndex === index));
        if (frame) frame.setAttribute("src", action.site_pdf_view_url || action.official_pdf_url || "");
        if (title) title.textContent = action.public_name || action.display_label || action.file_name || "Official court PDF";
        if (stage) stage.textContent = action.public_stage || action.language || "Court form";
        if (copy) copy.textContent = action.public_description || "Approved court PDF assigned to this guide.";
        if (download) {
          const downloadUrl = action.site_pdf_download_url || action.site_pdf_view_url || action.official_pdf_url || "";
          if (download.tagName === "A" && isUsableHref(downloadUrl)) {
            download.setAttribute("href", downloadUrl);
            download.removeAttribute("aria-disabled");
          } else {
            download.removeAttribute("href");
            download.setAttribute("aria-disabled", "true");
          }
        }
        intake?.setAttribute("data-intake-route", JSON.stringify(actionRoute(action)));
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setActive(Number(button.getAttribute("data-guide-pdf-choice") || 0)));
      });
      setActive(actions.indexOf(first));
    } catch (error) {
      host.innerHTML = `
        <div class="guide-forms-viewer-head">
          <div>
            <span>Forms for this guide</span>
            <strong>Forms could not load.</strong>
            <p>Use Guided Intake while the approved PDF manifest is unavailable.</p>
          </div>
          <a class="button primary" href="/start" data-link data-intake-route='${esc(JSON.stringify(guideFallbackRoute()))}'>Start Guided Intake</a>
        </div>
      `;
      scheduleLegalTermEnhancement(host);
    }
  }

	  function wireServiceTools() {
	    const button = document.querySelector("[data-service-reveal]");
	    const search = document.querySelector("[data-service-search]");
	    const count = document.querySelector("[data-service-count]");
	    const cards = Array.from(document.querySelectorAll("[data-service-card]"));
	    const categoryButtons = Array.from(document.querySelectorAll("[data-service-category-filter]"));
	    const reset = document.querySelector("[data-service-category-reset]");
	    const reveal = document.querySelector(".service-reveal");
	    const note = document.querySelector("[data-service-note]");
	    if (!cards.length) return;
	
	    let revealed = false;
	    let activeCategory = "All";
	    let activeServiceIndex = null;
	    const serviceData = serviceItems.map(serviceViewModelForItem);
	    const panel = document.createElement("div");
	    panel.className = "guide-row-panel service-row-panel";
	    panel.hidden = true;
	
	    const clearServicePanel = () => {
	      activeServiceIndex = null;
	      panel.hidden = true;
	      panel.innerHTML = "";
	      if (panel.parentElement) panel.remove();
	      cards.forEach((card) => {
	        card.classList.remove("is-expanded");
	        card.querySelector("[data-service-detail-toggle]")?.setAttribute("aria-expanded", "false");
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
	        candidate.classList.toggle("is-expanded", active);
	        candidate.querySelector("[data-service-detail-toggle]")?.setAttribute("aria-expanded", String(active));
	      });
	      panel.hidden = false;
	      panel.innerHTML = renderServicePanel(item);
	      insertServicePanelAfterRow(card);
	      scheduleLegalTermEnhancement(panel);
	      panel.querySelectorAll("[data-service-panel-close]").forEach((button) => {
	        button.addEventListener("click", clearServicePanel);
	      });
	      requestAnimationFrame(() => {
	        panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
	      });
	    };
	
	    const defaultVisibleCount = () => {
	      const width = window.innerWidth || document.documentElement.clientWidth || 1200;
		      if (width <= 520) return 6;
	      if (width <= 900) return 10;
	      if (width <= 1100) return 12;
	      return initialServiceCount;
	    };
	    const update = () => {
	      const term = (search?.value || "").trim().toLowerCase();
		      const activeGroup = publicCategoryIndex.get(activeCategory);
		      const categoryActive = activeCategory !== "All";
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
		        const label = categoryActive ? `${activeCategory} pathway${visible === 1 ? "" : "s"}` : `pathway${visible === 1 ? "" : "s"}`;
	        count.textContent = term || categoryActive
	          ? `Showing ${visible} matching ${label}`
	          : `Showing ${visible} of ${cards.length} pathways`;
	      }

	      if (note) {
	        const remaining = Math.max(cards.length - limit, 0);
	        note.textContent = revealed
		          ? `Showing all ${cards.length} pathways. Search any topic or choose a situation to narrow the list. Services are subject to conflict, licensed-scope, timing, and availability review.`
		          : `Showing the first ${Math.min(limit, matchesTotal)} pathways for this screen. Search any topic, browse a situation, or reveal the remaining ${remaining}. Services are subject to conflict, licensed-scope, timing, and availability review.`;
	      }
	
	      if (reveal) {
	        reveal.classList.toggle("revealed", revealed || !!term || categoryActive);
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
	        activeCategory = categoryButton.dataset.serviceCategoryFilter || "All";
	        update();
	      });
	    });
	    reset?.addEventListener("click", () => {
	      activeCategory = "All";
	      revealed = false;
	      if (search) search.value = "";
	      update();
	    });
	    button?.addEventListener("click", () => {
	      revealed = true;
	      update();
	    });
	    cards.forEach((card) => {
	      card.addEventListener("click", (event) => {
	        if (event.target.closest("a, button")) return;
	        openServicePanel(card);
	      });
	      card.addEventListener("keydown", (event) => {
	        if (event.key !== "Enter" && event.key !== " ") return;
	        event.preventDefault();
	        openServicePanel(card);
	      });
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
	      carousel.classList.toggle("is-scrollable", isScrollable);
	      if (status) status.textContent = `Path ${activeIndex + 1} of ${methods.length}`;
	      if (prev) prev.disabled = !isScrollable || activeIndex <= 0;
	      if (next) next.disabled = !isScrollable || activeIndex >= methods.length - 1;
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
      if (issue && Array.from(issue.options).some((option) => option.value === presetRoute.issue)) issue.value = presetRoute.issue;
      if (posture && Array.from(posture.options).some((option) => option.value === presetRoute.posture)) posture.value = presetRoute.posture;
      if (children && Array.from(children.options).some((option) => option.value === presetRoute.children)) children.value = presetRoute.children;
    }

    const update = () => {
      const countyValue = county?.value || "Statewide";
      const issueValue = issue?.value || "all";
      const postureValue = posture?.value || "Any posture";
      const childrenValue = children?.value || "any";
      let visible = 0;
      const visibleResources = [];

      cards.forEach((card) => {
        const cardCounty = card.dataset.county || "";
        const cardIssues = ` ${card.dataset.issues || ""} `;
        const cardPosture = card.dataset.posture || "";
        const countyMatch = cardCounty === "Statewide" || cardCounty === countyValue;
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
          ? `${visible} reviewed form starting point${visible === 1 ? "" : "s"} match your answers.`
          : "No clear form match yet. Use the statewide source or start Guided Intake.";
      }
      const routeDetail = {
        county: countyValue,
        issue: issueValue,
        posture: postureValue,
        children: childrenValue,
        pdfPacket: pdfPacketForFormsRoute(countyValue, issueValue, postureValue, childrenValue),
        expandPdfGroup: presetRoute?.expandPdfGroup === true,
        focusPacketBuilder: presetRoute?.focusPacketBuilder === true,
        fromGuide: presetRoute?.fromGuide || ""
      };
      window.MFLGLatestFormsRoute = routeDetail;
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

    county?.addEventListener("change", update);
    issue?.addEventListener("change", update);
    posture?.addEventListener("change", update);
    children?.addEventListener("change", update);
    decisionPrimary?.addEventListener("click", () => {
      const packetId = decisionPrimary.dataset.formRouteDecisionPacket || "";
      if (!packetId || packetId === "all") return;
      window.MFLGLatestFormsRoute = {
        ...(window.MFLGLatestFormsRoute || {}),
        pdfPacket: packetId,
        expandPdfGroup: true,
        focusPacketBuilder: true
      };
      window.dispatchEvent(new CustomEvent("mflg:forms-route-change", { detail: window.MFLGLatestFormsRoute }));
    });
    reset?.addEventListener("click", () => {
      if (county) county.value = "Statewide";
      if (issue) issue.value = "all";
      if (posture) posture.value = "Any posture";
      if (children) children.value = "any";
      update();
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
        contextNote: "Public Forms & Tools action plan only. Only safe source, county, route, packet, and calculator metadata should carry forward before conflict and scope review.",
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
        contextNote: "Public Forms & Tools review-roadmap route only. Review status and source-only limits were carried forward; no sensitive facts were collected.",
        presetAnswers: {
          formsToolsReviewRoadmap: "Approved actions open on-page reviewed forms; review-only candidates and disabled features stay blocked until review controls support them.",
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
        contextNote: "Public Forms & Tools form-safety route only. Source health and safe-access status were carried forward; no sensitive facts were collected.",
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
      const defaultPacketId = groups.find((group) => group.packet_id === "maricopa-divorce-new-with-children")?.packet_id
        || groups[0]?.packet_id
        || "all";
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
            <p>Choose the form group that fits, open the forms in order, and use Intake if anything does not match your situation.</p>
          </div>
          <a class="button outline" href="/start" data-link data-form-download-intake>Start Guided Intake to confirm</a>
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
              <p>Open each form here first so you can keep your place. Use the court-source link in the viewer only if a PDF does not load.</p>
            </div>
            <a class="button primary" href="/start" data-link data-forms-packet-intake>Add this form group to Intake</a>
          </div>
          <div class="forms-packet-builder-controls">
            <label>Form group
              <select data-forms-packet-select>
                ${groups.map((group) => `<option value="${esc(group.packet_id || "all")}"${group.packet_id === defaultPacketId ? " selected" : ""}>${esc(group.label || "Court form group")}</option>`).join("")}
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
              <p data-forms-packet-fit-check-copy>Use Guided Intake if you are unsure about the county, children, filing stage, or whether a response has already been filed.</p>
            </article>
            <article>
              <span>Safe next step</span>
              <strong data-forms-packet-fit-next>Open the forms in order.</strong>
              <p data-forms-packet-fit-next-copy>Start with instructions, then use the checklist so you can track what you reviewed in this browser tab.</p>
            </article>
          </div>
          <div class="forms-packet-builder-path" aria-label="Packet builder sequence">
            <article><span>01</span><strong>Read the starting instructions</strong><p>Begin with the court process sheet before opening forms.</p></article>
            <article><span>02</span><strong>Open only matching forms</strong><p>The page hides child-only forms when the form group says no minor children.</p></article>
            <article><span>03</span><strong>Use Guided Intake if unsure</strong><p>If the form group title or forms do not fit, do not guess.</p></article>
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
              <a class="button primary" href="/start" data-link data-forms-packet-current-intake>Use current form in Intake</a>
            </div>
          </div>
          <div class="forms-packet-complete" data-forms-packet-complete hidden>
            <div>
              <span>Forms reviewed</span>
              <strong>All visible forms in this form group are checked.</strong>
              <p>Use the checklist for your records, or send this form group choice into Intake if you want the office to review the next step.</p>
            </div>
            <div class="forms-packet-complete-actions">
              <button class="button outline" type="button" data-forms-packet-complete-copy>Copy checklist</button>
              <button class="button outline" type="button" data-forms-packet-complete-print>Print checklist</button>
              <a class="button primary" href="/start" data-link data-forms-packet-complete-intake>Add form group to Intake</a>
            </div>
          </div>
          <div class="forms-packet-builder-list" data-forms-packet-list>
            ${files.map((file, index) => `<article
              data-forms-packet-file
              data-packet-id="${esc(file.packet_id || "")}"
              data-language="${esc(file.language || "")}"
              data-child-only="${isChildOnlyPacketFile(file) ? "true" : "false"}"
              data-official-url="${esc(file.official_pdf_url || "")}"
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
                <button class="button primary" type="button" data-forms-packet-view>Open court form PDF</button>
                <button class="button outline" type="button" data-forms-packet-download>Preview PDF only</button>
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
      const checklistKeyForCard = (card) => `${card?.dataset.packetId || ""}:${card?.dataset.officialUrl || card?.dataset.fileName || ""}:${card?.dataset.language || ""}`;
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
            : "You can copy or print the checklist, or send this form group choice into Intake.";
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
            packetStateCopy.textContent = "Change the form group or language, or use Intake if the right starting point is unclear.";
          } else if (complete) {
            packetStateLabel.textContent = "Forms reviewed";
            packetStateTitle.textContent = "Every visible form in this form group is checked.";
            packetStateCopy.textContent = "Copy or print the checklist, or send this form group choice into Intake for help confirming the next step.";
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
          if (card.dataset.officialUrl) lines.push(`   Official court PDF source: ${card.dataset.officialUrl}`);
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
            nextCopy: "Open the forms in order, then use Intake if the right filing path is still unclear."
          };
        }
        return {
          title: "Use the selected form group only if the title matches your situation.",
          copy: "If the form group does not match the county, case stage, children, or agreement status, use Intake before opening forms.",
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
            approvedPdfOfficialUrl: card?.dataset.officialUrl || "",
            sourceType: "Forms & Tools form checklist / public planning"
          }
        };
      };
      const updatePacketBuilder = () => {
        const packetId = packetSelect?.value || defaultPacketId;
        const languageValue = languageSelect?.value || defaultLanguage;
        const fit = packetFitFor(packetId);
        if (packetFitTitle) packetFitTitle.textContent = fit.title;
        if (packetFitCopy) packetFitCopy.textContent = fit.copy;
        if (packetFitCheck) packetFitCheck.textContent = fit.check;
        if (packetFitCheckCopy) packetFitCheckCopy.textContent = fit.checkCopy;
        if (packetFitNext) packetFitNext.textContent = fit.next;
        if (packetFitNextCopy) packetFitNextCopy.textContent = fit.nextCopy;
        let visible = 0;
        let hiddenForFit = 0;
        fileCards.forEach((card) => {
          const matchesPacket = card.dataset.packetId === packetId;
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
            host.querySelector("[data-forms-packet-builder]")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              officialUrl: card.dataset.officialUrl || "",
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
        contextNote: "Public Forms & Tools start option only. Only non-sensitive source, route, county, packet, or calculator metadata was selected before Guided Intake.",
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
            <span>Safe Intake start</span>
            <strong>${esc(String(summary.safe_start_options || options.length))} safe start options. ${esc(String(summary.reviewed_routes || 0))} reviewed routes ready.</strong>
            <p>${esc(manifest.public_message || "Start from a public Forms & Tools selection, then continue into Guided Intake with only the starting point needed to stay organized.")}</p>
          </div>
          <a class="button primary" href="/start" data-link data-forms-intake-option>Start Guided Intake</a>
        </div>
        <div class="forms-intake-metrics">
          <article><span>Sources OK</span><strong>${esc(String(summary.official_sources_ok || 0))}/${esc(String(summary.official_sources_checked || 0))}</strong></article>
          <article><span>Packet pages</span><strong>${esc(String(summary.official_packet_page_actions || 0))}</strong></article>
          <article><span>Approved PDFs</span><strong>${esc(String(summary.approved_pdf_actions || 0))}</strong></article>
          <article><span>Calculators</span><strong>${esc(String(summary.calculator_choices || 0))}</strong></article>
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
    const guidedIntakeFallback = host.querySelector("[data-guided-intake-fallback]");
    const guidedSummary = host.querySelector("[data-guided-summary]");
    const guidedPathLine = host.querySelector("[data-guided-path-line]");
    const flowSections = Array.from(document.querySelectorAll("[data-flow-section]"));
    let showAllSections = false;
    let guidedStep = 0;
    const currentToolsPath = window.location.pathname.replace(/\/$/, "") || "/";
    let guidedComplete = currentToolsPath === "/forms" || currentToolsPath === "/calculators";
    const guidedAnswers = {
      need: need?.value || "forms",
      county: county?.value || "Statewide",
      posture: posture?.value || "Any posture",
      issue: "all",
      children: children?.value || "any"
    };

    const routeForSmartPath = () => formsToolRouteFor({
      county: county?.value || "Statewide",
      issue: guidedAnswers.issue || "all",
      posture: posture?.value || "Any posture",
      children: children?.value || "any",
      pdfPacket: "all"
    }, "");

    const recommendations = {
      forms: {
        label: "What happens next",
        title: "Continue to the recommended forms.",
        copy: "The guided helper has selected the closest form group. Open the forms in order, and use Guided Intake if the title does not sound right.",
        href: "#forms-approved-pdfs",
        text: "Open matched forms"
      },
      calculator: {
        label: "What happens next",
        title: "Open the calculator tools.",
        copy: "Use only planning numbers. If you do not know which numbers belong in a field, use Guided Intake before relying on an estimate.",
        href: "#forms-calculator-hub",
        text: "Open calculator tools"
      },
      deadline: {
        label: "What happens next",
        title: "Check the deadline path first.",
        copy: "If papers were served or a hearing is coming up, start with the deadline planner and use Guided Intake if timing is unclear.",
        href: "#deadline-readiness-planner",
        text: "Check deadline urgency"
      },
      issue: {
        label: "What happens next",
        title: "Search by plain-language issue.",
        copy: "Use the matter list when you know the problem, but do not know which court packet or form name fits.",
        href: "#forms-matter-coverage",
        text: "Search by issue"
      },
      guide: {
        label: "What happens next",
        title: "Read the guide before choosing forms.",
        copy: "Use DIY Guides when you need the process, document checklist, and readiness questions first.",
        href: "/guides",
        text: "Open DIY Guides",
        link: true
      },
      intake: {
        label: "What happens next",
        title: "Start Guided Intake instead of guessing.",
        copy: "Use this when the issue, county, deadline, or next step is unclear. Only answer what Intake asks for.",
        href: "/start",
        text: "Start Guided Intake",
        link: true,
        route: true
      }
    };
    const guidedSteps = [
      {
        question: "What do you need right now?",
        copy: "Pick the closest answer. You can change it later.",
        key: "need",
        options: [
          ["forms", "I need court forms"],
          ["deadline", "I was served or have a deadline"],
          ["calculator", "I need a calculator"],
          ["intake", "I am not sure"]
        ]
      },
      {
        question: "Which court or county sounds closest?",
        copy: "Forms can change by county. If you do not know, choose Statewide.",
        key: "county",
        options: [
          ["Statewide", "I do not know"],
          ["Maricopa", "Maricopa"],
          ["Pima", "Pima"],
          ["Pinal", "Pinal"],
          ["Yavapai", "Yavapai"]
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
    const needForHash = (hash) => {
      if (hash === "#forms-calculator-hub") return "calculator";
      if (hash === "#deadline-readiness-planner") return "deadline";
      if (hash === "#forms-matter-coverage") return "issue";
      if (hash === "#forms-official-router" || hash === "#forms-packets" || hash === "#forms-approved-pdfs") return "forms";
      return "";
    };
    const setNeedFromHash = (hash) => {
      const nextNeed = needForHash(hash);
      if (nextNeed && need) {
        need.value = nextNeed;
        guidedAnswers.need = nextNeed;
        guidedComplete = true;
        showAllSections = false;
        update();
      }
    };

    const update = () => {
      guidedAnswers.need = need?.value || guidedAnswers.need;
      guidedAnswers.county = county?.value || guidedAnswers.county;
      guidedAnswers.posture = posture?.value || guidedAnswers.posture;
      guidedAnswers.children = children?.value || guidedAnswers.children;
      const recommendation = recommendations[need?.value || "forms"] || recommendations.forms;
      const activeNeed = need?.value || "forms";
      const pathReady = showAllSections || guidedComplete || activeNeed === "intake";
      host.classList.toggle("user-showing-all", showAllSections);
      host.classList.toggle("forms-guided-complete", guidedComplete);
      host.classList.toggle("forms-guided-pending", !pathReady);
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
      });
      if (modeCopy) {
        const isStillAnswering = !guidedComplete && guidedStep < guidedSteps.length - 1 && guidedAnswers.need !== "intake";
        modeCopy.textContent = showAllSections
          ? "Showing every advanced section. Start Guided Intake if the choices feel unclear."
          : isStillAnswering
          ? "Showing one guided question at a time."
          : !guidedComplete
          ? "Your recommended section will appear after you finish the guided helper."
          : `Showing the recommended path first: ${recommendation.text}.`;
      }
      if (showAll) {
        showAll.textContent = showAllSections ? "Show recommended path" : "Advanced: show all sections";
        showAll.setAttribute("aria-pressed", showAllSections ? "true" : "false");
      }
      laneLinks.forEach((lane) => {
        lane.toggleAttribute("aria-current", lane.getAttribute("data-smart-lane") === activeNeed);
      });
      renderGuidedStep();
    };

    const setSelectValue = (control, value) => {
      if (!control) return;
      const options = Array.from(control.options || []);
      if (options.some((option) => option.value === value)) {
        control.value = value;
      }
    };
    const syncFormsFinder = () => {
      const formCounty = document.querySelector("[data-form-county]");
      const formIssue = document.querySelector("[data-form-issue]");
      const formPosture = document.querySelector("[data-form-posture]");
      const formChildren = document.querySelector("[data-form-children]");
      setSelectValue(formCounty, guidedAnswers.county || "Statewide");
      setSelectValue(formChildren, guidedAnswers.children || "any");
      if (guidedAnswers.need === "deadline") {
        setSelectValue(formPosture, guidedAnswers.posture && guidedAnswers.posture !== "Any posture" ? guidedAnswers.posture : "Served / response");
        setSelectValue(formIssue, guidedAnswers.issue || "all");
      } else if (guidedAnswers.need === "calculator") {
        setSelectValue(formPosture, "Any posture");
        setSelectValue(formIssue, "support");
      } else {
        setSelectValue(formPosture, guidedAnswers.posture || "Any posture");
        setSelectValue(formIssue, guidedAnswers.issue || "all");
      }
      formCounty?.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const updateGuidedResult = () => {
      const recommendation = recommendations[guidedAnswers.need || "forms"] || recommendations.forms;
      const needLabels = {
        forms: "Court forms",
        deadline: "Deadline or served papers",
        calculator: "Calculator",
        intake: "Guided Intake",
        issue: "Issue search",
        guide: "DIY Guides"
      };
      const issueLabels = {
        all: "Not sure yet",
        divorce: "Divorce / separation",
        parenting: "Parenting",
        support: "Support"
      };
      const countyLabels = {
        Statewide: "Court not sure yet",
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
      const countyLabel = guidedAnswers.county && guidedAnswers.county !== "Statewide" ? `${guidedAnswers.county} ` : "";
      const childrenLabel = guidedAnswers.children === "minor-children"
        ? " with minor children"
        : guidedAnswers.children === "no-minor-children"
        ? " without minor children"
        : "";
      const shouldContinueQuestions = !guidedComplete && guidedStep < guidedSteps.length - 1 && guidedAnswers.need !== "intake";
      if (guidedResultTitle) {
        guidedResultTitle.textContent = shouldContinueQuestions
          ? "Answer the next question."
          : recommendation.title || (guidedAnswers.need === "intake"
          ? "Use Guided Intake instead of guessing."
          : guidedAnswers.need === "calculator"
          ? "Open the calculator tools."
          : `Use the ${countyLabel}form finder${childrenLabel}.`);
      }
      if (guidedResultCopy) {
        guidedResultCopy.textContent = shouldContinueQuestions
          ? "Keep going. The page will show the right forms, calculator, or intake option after the basic choices are answered."
          : recommendation.copy || (guidedAnswers.need === "intake"
          ? "This is the safest choice when the court, issue, deadline, or next form is unclear."
          : guidedAnswers.need === "calculator"
          ? "Start with calculator tools only if you know which numbers belong in the fields."
          : "The page has updated the form finder below. Use the next step button when you are ready.");
      }
      if (guidedResultAction) {
        guidedResultAction.textContent = shouldContinueQuestions ? "Continue to next question" : recommendation.text || "Go to next step";
        guidedResultAction.dataset.guidedTarget = shouldContinueQuestions ? "" : recommendation.href || "#forms-approved-pdfs";
        guidedResultAction.toggleAttribute("data-guided-continue", shouldContinueQuestions);
        if (!shouldContinueQuestions && recommendation.route) {
          guidedResultAction.setAttribute("data-intake-route", JSON.stringify(routeForSmartPath()));
        } else {
          guidedResultAction.removeAttribute("data-intake-route");
        }
      }
      if (guidedIntakeFallback) guidedIntakeFallback.setAttribute("data-intake-route", JSON.stringify(routeForSmartPath()));
      if (guidedSummary) {
        const chips = [
          needLabels[guidedAnswers.need] || "Forms",
          countyLabels[guidedAnswers.county] || guidedAnswers.county || "Court not sure yet",
          postureLabels[guidedAnswers.posture] || guidedAnswers.posture || "Stage not sure yet",
          issueLabels[guidedAnswers.issue] || "Not sure yet",
          childrenLabels[guidedAnswers.children] || "Children not sure yet"
        ];
        guidedSummary.innerHTML = chips.map((chip) => `<span>${esc(chip)}</span>`).join("");
        if (guidedPathLine) {
          guidedPathLine.textContent = shouldContinueQuestions
            ? "Keep going one question at a time. You can always choose Guided Intake if you are unsure."
            : `Ready next step: ${recommendation.text}.`;
        }
      }
    };

    function renderGuidedStep() {
      if (!guidedQuestion || !guidedOptions) return;
      const step = guidedSteps[guidedStep] || guidedSteps[0];
      guidedQuestion.textContent = step.question;
      if (guidedCopy) guidedCopy.textContent = step.copy;
      guidedOptions.innerHTML = step.options.map(([value, text]) => {
        const pressed = guidedAnswers[step.key] === value;
        return `<button type="button" data-guided-answer="${esc(value)}" aria-pressed="${pressed ? "true" : "false"}">${esc(text)}</button>`;
      }).join("");
      guidedJumps.forEach((jump, index) => {
        jump.setAttribute("aria-current", index === guidedStep ? "true" : "false");
      });
      updateGuidedResult();
    }

    [need, county, children, posture].forEach((control) => control?.addEventListener("change", () => {
      guidedAnswers.need = need?.value || guidedAnswers.need;
      guidedAnswers.county = county?.value || guidedAnswers.county;
      guidedAnswers.posture = posture?.value || guidedAnswers.posture;
      guidedAnswers.children = children?.value || guidedAnswers.children;
      syncFormsFinder();
      update();
    }));
    laneLinks.forEach((lane) => {
      lane.addEventListener("click", (event) => {
        const laneNeed = lane.getAttribute("data-smart-lane");
        if (laneNeed && need && recommendations[laneNeed]) {
          need.value = laneNeed;
          guidedAnswers.need = laneNeed;
          guidedComplete = laneNeed !== "intake";
          if (laneNeed === "deadline") {
            guidedAnswers.posture = "Served / response";
            setSelectValue(posture, "Served / response");
          }
          showAllSections = false;
          syncFormsFinder();
          update();
          if (lane.getAttribute("href")?.startsWith("#")) {
            event.preventDefault();
            document.querySelector(lane.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
    document.querySelectorAll('a[href^="#forms-"]').forEach((link) => {
      link.addEventListener("click", () => setNeedFromHash(link.getAttribute("href") || ""));
    });
    showAll?.addEventListener("click", () => {
      showAllSections = !showAllSections;
      update();
    });
    reset?.addEventListener("click", () => {
      guidedStep = 0;
      guidedComplete = false;
      guidedAnswers.need = "forms";
      guidedAnswers.county = "Statewide";
      guidedAnswers.posture = "Any posture";
      guidedAnswers.issue = "all";
      guidedAnswers.children = "any";
      setSelectValue(need, "forms");
      setSelectValue(county, "Statewide");
      setSelectValue(children, "any");
      setSelectValue(posture, "Any posture");
      showAllSections = false;
      syncFormsFinder();
      update();
      host.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    guidedOptions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-guided-answer]");
      if (!button) return;
      const step = guidedSteps[guidedStep] || guidedSteps[0];
      const value = button.getAttribute("data-guided-answer") || "";
      guidedAnswers[step.key] = value;
      if (step.key === "need") {
        setSelectValue(need, value);
        if (value === "deadline") {
          guidedAnswers.posture = "Served / response";
          setSelectValue(posture, "Served / response");
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
      update();
    });
    guidedJumps.forEach((jump) => {
      jump.addEventListener("click", () => {
        guidedStep = Number(jump.getAttribute("data-guided-jump") || 0);
        update();
      });
    });
    guidedResultAction?.addEventListener("click", (event) => {
      if (guidedResultAction.hasAttribute("data-guided-continue")) {
        event.preventDefault();
        guidedStep = Math.min(guidedStep + 1, guidedSteps.length - 1);
        update();
        guidedQuestion?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
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
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <span>Saved starting points</span>
            <strong>Choose a starting point only if it sounds like your situation.</strong>
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
          ${routes.map((item) => `<article>
            <div class="forms-route-intake-card-head">
              <span>${esc(item.route?.county || "Official source")}</span>
              <strong>${esc(item.packet_label || "Form starting point")}</strong>
              <p>${esc([item.route?.issue, item.route?.posture, item.route?.children].filter(Boolean).join(" / ") || "Forms matched to this starting point")}</p>
            </div>
            <div class="forms-route-intake-counts">
              <small>${item.approved_pdfs ? `${esc(String(item.approved_pdfs))} form${item.approved_pdfs === 1 ? "" : "s"} ready to view` : "Use Guided Intake to confirm the next form"}</small>
              <small>${esc((item.languages || []).join(" / ") || "Official source")}</small>
            </div>
            <div class="forms-route-intake-actions">
              ${item.approved_pdfs ? `<a class="card-link" href="#forms-approved-pdfs" data-route-map-card-pdfs="${esc(item.packet_id || "")}">View forms →</a>` : ""}
              <a class="button primary" href="/start" data-link data-route-map-card-intake="${esc(item.route_start_id || "")}">Use Guided Intake</a>
            </div>
          </article>`).join("")}
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
            <p>Use the form finder or Guided Intake while starting points are unavailable.</p>
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

      const routeForMatter = (matter) => ({
        routeKey: `forms-tools-matter-${slugify(matter.matter_id || matter.title || "matter")}`,
        entrySource: "Forms & Tools",
        entryLabel: `Forms & Tools matter: ${matter.title || "Public matter"}`,
        issuePathway: matter.title || "Forms & Tools",
        issueDetail: matter.public_status || "Court forms or Guided Intake start",
        serviceInterest: "",
        contextNote: "Public Forms & Tools issue selection only. Only the selected issue title and category were carried forward.",
        presetAnswers: {
          formsToolsMatterTitle: matter.title || "",
          formsToolsMatterCategory: matter.category || "",
          formsToolsMatterStatus: matter.public_status || "",
          sourceType: "Forms & Tools issue finder"
        }
      });
      const matterConfidenceLabel = (matter) => formConfidenceLabel(matter.form_confidence || (matter.direct_pdf_available ? "county-exact" : "intake-required"));
      const matterCardCopy = (matter) => {
        if (matter.form_confidence === "intake-required") return matter.public_guidance || "Use Guided Intake before choosing forms for this issue.";
        if (matter.form_confidence === "related-only") return matter.public_guidance || "Related forms are available, but the exact packet still needs confirmation.";
        if (matter.form_confidence === "statewide-generic") return matter.public_guidance || "Start with the official statewide source, then confirm county requirements.";
        if (matter.exact_packet_available) return "Matched forms are available. Confirm county and case stage before relying on them.";
        return "Use this issue to narrow forms or start Intake.";
      };

      host.innerHTML = `
        <div class="forms-matter-head">
          <div>
            <span>Issue finder</span>
            <strong>Search by the family-law problem you recognize.</strong>
            <p>You do not need to know the form name. Search the plain-language issue, then open Intake if the next step is not clear.</p>
          </div>
          <a class="button outline" href="/start" data-link data-forms-matter-intake>Start Guided Intake</a>
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
              <a class="card-link" href="#forms-approved-pdfs">${esc(matter.direct_pdf_available ? "View matched forms" : "Review form sources")} →</a>
              <a class="button primary" href="/start" data-link data-forms-matter-card-intake="${esc(matter.matter_id || "")}">Start Guided Intake</a>
            </div>
          </article>`).join("")}
        </div>
        <div class="forms-matter-reveal">
          <button class="button outline" type="button" data-forms-matter-reveal>Show more issues</button>
          <small data-forms-matter-note>Showing common issues first. Search or choose a category to narrow the list.</small>
        </div>
      `;

      const fallbackMatter = matters[0] || { title: "Forms & Tools matter review", category: "Forms & Tools" };
      host.querySelector("[data-forms-matter-intake]")?.setAttribute("data-intake-route", JSON.stringify(routeForMatter(fallbackMatter)));
      host.querySelectorAll("[data-forms-matter-card-intake]").forEach((link) => {
        const matterId = link.getAttribute("data-forms-matter-card-intake");
        const matter = matters.find((item) => item.matter_id === matterId) || fallbackMatter;
        link.setAttribute("data-intake-route", JSON.stringify(routeForMatter(matter)));
      });

      const search = host.querySelector("[data-forms-matter-search]");
      const category = host.querySelector("[data-forms-matter-category]");
      const reset = host.querySelector("[data-forms-matter-reset]");
      const reveal = host.querySelector("[data-forms-matter-reveal]");
      const note = host.querySelector("[data-forms-matter-note]");
      const status = host.querySelector("[data-forms-matter-status]");
      const cards = Array.from(host.querySelectorAll("[data-forms-matter-card]"));
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
            <p>Use official sources and Guided Intake while completion checks are unavailable.</p>
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
            <strong>${esc(String(summary.official_jurisdictions || jurisdictions.length))} official source option${(summary.official_jurisdictions || jurisdictions.length) === 1 ? "" : "s"} monitored.</strong>
            <p>${esc(manifest.public_message || "Official sources and packet-level actions are reviewed separately.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-jurisdiction-intake>Use County Status in Intake</a>
        </div>
        <div class="jurisdiction-readiness-metrics">
          <article><span>Sources OK</span><strong>${esc(String(summary.monitored_sources_ok || 0))}/${esc(String(summary.monitored_sources_total || 0))}</strong></article>
          <article><span>Reviewed form groups</span><strong>${esc(String(summary.jurisdictions_with_reviewed_packet_actions || 0))}</strong></article>
          <article><span>County source only</span><strong>${esc(String(summary.county_source_only || 0))}</strong></article>
        </div>
        <div class="jurisdiction-readiness-grid">
          ${jurisdictions.map((item) => `<article class="jurisdiction-readiness-card"
            data-jurisdiction-card="${esc(item.county || "Statewide")}"
            data-jurisdiction-label="${esc(item.label || "")}"
            data-jurisdiction-url="${esc(item.official_url || "")}">
            <span>${esc(item.county || "Statewide")}</span>
            <strong>${esc(item.label || "Official source")}</strong>
            <p>${esc(item.public_guidance || "")}</p>
            <small>${esc(item.packet_review_status || "")} · ${esc(String(item.reviewed_packet_routes || 0))} reviewed route${item.reviewed_packet_routes === 1 ? "" : "s"} · ${esc(String(item.approved_pdf_actions || 0))} PDFs</small>
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
            <label><span>County</span><select name="county">${["Apache", "Cochise", "Coconino", "Gila", "Graham", "Greenlee", "La Paz", "Maricopa", "Mohave", "Navajo", "Pima", "Pinal", "Santa Cruz", "Yavapai", "Yuma"].map((county) => `<option${county === "Maricopa" ? " selected" : ""}>${county}</option>`).join("")}</select></label>
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
              : "Use the official fallback workspace. The MFLG-branded version will appear here only after testing and approval."}</p>
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
        result.innerHTML = `<span>Review needed</span><strong>The on-site maintenance calculator could not load.</strong><p>Use Guided Intake for routing help or use the official fallback workspace below.</p>`;
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
      contextNote: "Public calculator pre-check route only. The website carried forward calculator category, readiness level, and existing-order uncertainty only; no private calculation facts or values were collected.",
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
        copy: "The on-site calculator appears above the official fallback workspace. It does not submit your numbers and should be confirmed before filing, signing, or relying on the result.",
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
        copy: "This does not calculate or extend legal deadlines. It helps you decide whether to use Intake or official court sources now.",
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
      contextNote: "Public calculator chooser route only. The website carried forward only the selected tool type, not private calculation facts or values.",
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
      contextNote: "Public calculator path route only. The website carried forward only that the user was unsure which calculator or next step applied.",
      presetAnswers: {
        selectedCalculator: "Not sure",
        sourceType: "Calculator path / public planning"
      }
    }));
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
          workspace?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    choices.forEach((choice) => {
      choice.addEventListener("click", () => select(choice.dataset.calculatorChoice || "support", false));
    });
    jumpButtons.forEach((button) => {
      button.addEventListener("click", () => {
        select(button.dataset.calculatorJump || "support", true);
      });
    });
    primary?.addEventListener("click", (event) => {
      const href = primary.getAttribute("href") || "";
      const workspaceChoice = primary.dataset.calculatorWorkspaceChoice;
      if (workspaceChoice) {
        event.preventDefault();
        select(workspaceChoice, true);
        return;
      }
      if (href.startsWith("#")) {
        event.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    window.addEventListener("mflg:calculator-workspace", (event) => {
      select(event.detail?.choice || "support", true);
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
        copy: "Use official source links and Guided Intake if you are unsure what kind of deadline applies.",
        sourceHref: "#forms-official-router",
        nextLabel: "Do next",
        nextTitle: "Confirm the actual deadline before choosing forms.",
        nextCopy: "This planner does not calculate deadlines. Use the court notice, rule, or official source, then use Intake if timing is unclear.",
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
          copy: "Use Guided Intake now and check the official court source. This planner does not calculate or extend legal deadlines.",
          sourceHref: eventValue === "served" ? "#forms-official-router" : "#forms-packets",
          nextLabel: "Act now",
          nextTitle: "Do not wait for ordinary website review.",
          nextCopy: "Use Intake and official court information now. If safety or emergency facts are involved, use emergency resources or the court directly.",
          steps: [
            "Open Guided Intake or contact the office now.",
            "Check the official court source or notice before relying on any form packet.",
            "Do not assume this page calculated or extended the deadline."
          ]
        };
      } else if (timingValue === "unknown") {
        next = {
          level: "Unknown deadline",
          title: "Do not guess on timing.",
          copy: "If you do not know the deadline, use Intake or the official court source before choosing forms.",
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
          copy: "Review the notice and official court source. Use Guided Intake if you need help deciding what to prepare.",
          sourceHref: "#forms-official-router",
          nextLabel: "Prepare carefully",
          nextTitle: "Start with the notice and court instructions.",
          nextCopy: "Hearing preparation depends on the type of setting, judge instructions, disclosure status, and what has already been filed.",
          steps: [
            "Review the hearing notice or court order.",
            "Use the form finder for official source links.",
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
          <strong>${esc(String(summary.ok || 0))} of ${esc(String(summary.total || 0))} official sources checked OK.</strong>
          <p>${esc(health.public_message || "Public actions continue to open official court sources only.")}</p>
          <small>Last checked: ${esc(checked)}</small>
        </div>
        <div class="source-health-grid">
          ${groups.map((group) => `<article>
            <span>${esc(group.label)}</span>
            <strong>${esc(String(group.ok))}/${esc(String(group.total))} OK</strong>
            <p>${group.broken ? `${esc(String(group.broken))} source${group.broken === 1 ? "" : "s"} need review.` : "No broken sources detected."}</p>
          </article>`).join("")}
        </div>
      `;
      host.classList.toggle("needs-review", broken > 0);
    } catch (error) {
      host.innerHTML = `
        <div class="source-health-summary">
          <span>Source status</span>
          <strong>Official-source status could not load.</strong>
          <p>Use the official court source links while the public status summary is unavailable.</p>
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
        <div class="forms-coverage-routes" aria-label="Forms and Tools covered routes">
          ${routes.map((route) => `<article>
            <span>${esc(route.route?.county || "Official source")}</span>
            <strong>${esc(route.packet_label || route.packet_id)}</strong>
            <p>${esc([route.route?.issue, route.route?.posture, route.route?.children].filter(Boolean).join(" / "))}</p>
            <small>${route.has_approved_pdf_actions ? `${esc(String(route.approved_pdf_actions))} PDF${route.approved_pdf_actions === 1 ? "" : "s"} ready to view` : "Use Guided Intake to confirm forms"}</small>
          </article>`).join("")}
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
            <span>Starting points</span>
            <strong>Form starting points are not available yet.</strong>
            <p>Use the form finder while the reviewed starting points load.</p>
          </div>
        `;
        return;
      }

      host.innerHTML = `
        <div class="route-action-head">
          <div>
            <span>Starting points</span>
          <strong>Choose one starting point, then open the matching forms.</strong>
            <p>${esc(manifest.public_message || "Choose a starting point to see reviewed forms.")}</p>
          </div>
          <a class="button outline" href="/start" data-link data-route-action-intake>Use Selected Route in Intake</a>
        </div>
        <div class="route-action-controls" aria-label="Filter reviewed packet routes">
          <label>Search
            <input type="search" placeholder="Search divorce, parenting, support, agreement..." data-route-action-search>
          </label>
          <label>Route
            <select data-route-action-select>
              <option value="all">Show every starting point</option>
              ${routes.map((route) => `<option value="${esc(route.packet_id)}">${esc(route.packet_label)}</option>`).join("")}
            </select>
          </label>
          <button class="button ghost" type="button" data-route-action-reset>Reset</button>
        </div>
        <p class="forms-router-status" data-route-action-status>${esc(String(routes.length))} starting points shown.</p>
        <div class="route-action-grid">
          ${routes.map((route) => {
            const packetPages = Array.isArray(route.official_packet_pages) ? route.official_packet_pages : [];
            const pdfs = Array.isArray(route.official_pdfs) ? route.official_pdfs : [];
            const routeText = [route.route?.county, route.route?.issue, route.route?.posture, route.route?.children].filter(Boolean).join(" / ");
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
            ? `${visible} starting point${visible === 1 ? "" : "s"} shown.`
            : "No starting point matches the current filters.";
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
          window.MFLGLatestFormsRoute = {
            county: route?.route?.county || "Maricopa",
            issue: route?.route?.issue || "all",
            posture: route?.route?.posture || "Any posture",
            children: route?.route?.children || "any",
            pdfPacket: packetId,
            expandPdfGroup: true
          };
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
          <strong>Matched form starting points could not load.</strong>
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
          <p>Use the form finder above while the packet-page manifest is unavailable.</p>
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
            <p>Use Guided Intake and the office can help route you to the right court page.</p>
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
          <h2>Open the forms for that situation.</h2>
          <p>Start with the recommended form group. Open the forms in order. If the title does not sound right, use Guided Intake instead of guessing.</p>
        </div>
        <div class="official-pdf-spotlight" data-official-pdf-spotlight>
          <div>
            <span data-official-pdf-spotlight-kicker>Your next form step</span>
            <strong data-official-pdf-spotlight-title>Finding the closest form group...</strong>
            <p data-official-pdf-spotlight-copy>Start here. The form group below should match the choices you made above.</p>
            <ol class="forms-next-mini-list">
              <li>Open the first form or instruction sheet.</li>
              <li>Check that the title matches your situation.</li>
              <li>Stop and start Guided Intake if it does not match.</li>
            </ol>
            <small>You are not filing anything by opening these forms.</small>
          </div>
          <button class="button outline" type="button" data-official-pdf-show-all>Browse other form groups</button>
        </div>
        <details class="official-pdf-route-index" aria-label="Choose a court packet" data-official-pdf-route-index>
          <summary>
            <span>Need a different form group?</span>
            <strong>Choose another situation only if the recommendation above does not fit.</strong>
            <p>These choices are secondary. If none sound right, start Guided Intake.</p>
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
        <p class="forms-router-status" data-official-pdf-status>Forms are ready.</p>
        <div class="official-pdf-intake-panel">
          <div>
            <strong data-official-pdf-intake-title>Not sure this form group fits?</strong>
            <p data-official-pdf-intake-copy>Use Guided Intake and the office can help route the next step.</p>
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
            <a class="button outline source-fallback-link" target="_blank" rel="noopener" data-official-pdf-source-fallback aria-disabled="true">Open court source</a>
            <a class="button outline" href="/start" data-link data-official-pdf-viewer-intake>Add this form to Intake</a>
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
                    data-pdf-url="${esc(action.official_pdf_url || "")}"
                    data-site-pdf-view-url="${esc(action.site_pdf_view_url || "")}"
                    data-site-pdf-download-url="${esc(action.site_pdf_download_url || "")}"
                    data-search="${esc([action.public_name, action.public_description, action.public_stage, action.display_label, action.label, action.source_label, action.file_name, action.packet_label, action.page_label, action.language].filter(Boolean).join(" ").toLowerCase())}">
                    <button class="official-pdf-source" type="button" data-official-pdf-preview>
                      <span>${esc(action.public_stage || action.language || "Court form")}</span>
                      <strong>${esc(action.public_name || action.display_label || action.label || action.file_name || "Official PDF")}</strong>
                      <p>${esc(action.public_description || "Official court PDF from the reviewed packet.")}</p>
                      <em>${esc([action.language, action.public_file_code || action.file_name].filter(Boolean).join(" / "))}</em>
                      <b>Open court form PDF</b>
                    </button>
                    <button class="official-pdf-direct-download" type="button" data-official-pdf-preview>Preview PDF only</button>
                    <a class="official-pdf-intake-link" href="/start" data-link data-official-pdf-item-intake>Add this form to Intake</a>
                  </article>
                `).join("")}
              </div>
            </details>
          `).join("")}
        </div>
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
            ? `Not sure ${packetLabel} fits?`
            : "Not sure which form group fits?";
        }
        if (intakeCopy) {
          intakeCopy.textContent = packetLabel && packetRoute
            ? "Use Guided Intake and the office can help confirm whether this is the right starting point."
            : packetLabel
            ? "Use Intake if the form group title does not match your situation."
            : "Use Intake if the form list does not make sense.";
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
              officialUrl: link.dataset.pdfUrl || ""
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
            officialUrl: link.dataset.pdfUrl || ""
          }
        );
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
            ? `Viewing ${fileName} through the approved site viewer. Use the fallback only if the file does not load.`
            : "Viewing the official court PDF through the approved site viewer.";
        }
        viewerFrame.setAttribute("src", siteViewUrl);
        if (viewerDownload && isUsableHref(siteDownloadUrl)) {
          viewerDownload.setAttribute("href", siteDownloadUrl);
          viewerDownload.setAttribute("download", fileName || "official-court-form.pdf");
          viewerDownload.removeAttribute("aria-disabled");
        }
        if (viewerSourceFallback && isUsableHref(url || siteViewUrl)) {
          viewerSourceFallback.setAttribute("href", url || siteViewUrl);
          viewerSourceFallback.removeAttribute("aria-disabled");
        }
        viewerIntake?.setAttribute("data-intake-route", JSON.stringify(routeForPdfLink(link)));
        viewer.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      window.addEventListener("mflg:official-pdf-open", (event) => {
        const url = event.detail?.officialUrl || "";
        const match = links.find((link) => link.dataset.pdfUrl === url);
        if (match) openPdfViewer(match);
      });
      const update = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const packetValue = packet?.value || "all";
        const languageValue = language?.value || "all";
        let visible = 0;
        links.forEach((link) => {
          const matchesSearch = !q || (link.dataset.search || "").includes(q);
          const matchesPacket = packetValue === "all" || link.dataset.packet === packetValue;
          const matchesLanguage = languageValue === "all" || link.dataset.language === languageValue;
          const show = matchesSearch && matchesPacket && matchesLanguage;
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
          spotlightKicker.textContent = selectedRoute ? "Recommended form group" : "Browsing other form groups";
        }
        if (spotlightTitle) {
          spotlightTitle.textContent = selectedRoute
            ? selectedRoute.page_label || selectedRoute.packet_label || "Recommended form group selected"
            : "Choose a form group only if the recommendation does not fit.";
        }
        if (spotlightCopy) {
          spotlightCopy.textContent = selectedRoute
            ? "Start here if this form group sounds like your situation. Open the forms in order."
            : "Use search, form group, and language filters only if you know what you are looking for. Otherwise, start Guided Intake.";
        }
        if (status) {
          status.textContent = visible
            ? "Forms are ready."
            : "No forms match these filters.";
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
          }
        });
      });
      showAll?.addEventListener("click", () => {
        if (routeIndexDisclosure) routeIndexDisclosure.open = true;
        clearOfficialPdfFilters();
        update();
        routeIndexDisclosure?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        if (viewer) viewer.hidden = true;
        viewerFrame?.removeAttribute("src");
      });
      const applyRoutePreset = (detail) => {
        currentRouteDetail = detail || currentRouteDetail;
        expandFocusedPdfGroup = detail?.expandPdfGroup === true;
        const hasExplicitPacket = detail && Object.prototype.hasOwnProperty.call(detail, "pdfPacket");
        const explicitPacket = hasExplicitPacket ? detail.pdfPacket || "all" : "";
        const nextPacket = explicitPacket && explicitPacket !== "all" ? explicitPacket : recommendedPacketId;
        if (packet && Array.from(packet.options).some((option) => option.value === nextPacket)) {
          packet.value = nextPacket;
          update();
          const label = packet.options[packet.selectedIndex]?.textContent || "approved packets";
          if (status && nextPacket !== "all") {
            status.textContent = `${status.textContent} Showing the form group that matches your answers: ${label}.`;
          }
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
          host.scrollIntoView({ behavior: "smooth", block: "start" });
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
	      storeFormsRoute(formsRoute || window.MFLGLatestFormsRoute || {}, calculatorChoice);
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
	        document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
	        document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
	      } else {
	        jumpToTop();
	      }
	      updateHeaderState();
	      requestAnimationFrame(() => {
	        if (url.hash) {
	          document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
