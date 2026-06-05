(function () {
  const guideDataUrl = "/data/diy-guides.json";
  const root = document.querySelector("[data-page-root]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const header = document.querySelector("[data-header]");

  const routes = {
    "/": home,
    "/practice-areas": practiceAreas,
    "/fees": fees,
    "/guides": guides,
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

  function link(href, label, cls) {
    return `<a class="button ${cls || ""}" href="${href}" data-link>${label}</a>`;
  }

  function hero(title, copy, actions) {
    return `<section class="hero">
      <video class="hero-video" autoplay muted loop playsinline preload="auto">
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

  function section(title, copy, body, band, eyebrow) {
    return `<section class="section ${band ? "band" : ""}"${band ? ` id="after-hero"` : ""}>
      <div class="inner">
        <p class="eyebrow">${eyebrow || "MY FAMILY LAW GROUP PLLC"}</p>
        <h2>${title}</h2>
        ${copy ? `<p class="lead muted">${copy}</p>` : ""}
        ${body}
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
    { icon: "!", category: "Safety", title: "Protective Orders Related to Family Law", copy: "Family-law related safety review for protective orders, related hearings, children, and immediate referral needs where appropriate." },
    { icon: "!", category: "Safety", title: "Family-Law Injunctions / Safety Terms", copy: "Support for safety-related family-court terms and injunction issues when they connect to an eligible family-law matter." },
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

  const serviceMethods = [
    { icon: "▤", title: "Document preparation", copy: "Court-ready family-law documents and supporting materials." },
    { icon: "⇧", title: "Filing support", copy: "Filing readiness, service coordination, deadlines, and next steps." },
    { icon: "⚖", title: "Negotiation", copy: "Practical negotiation, mediation, and settlement support." },
    { icon: "▥", title: "Court appearances within licensed scope", copy: "Eligible limited-scope family-court appearances after review." }
  ];

  function serviceCards() {
    const items = serviceItems.map((item) => ({ ...item, href: "/start" }));
    return `<div class="grid service-grid" data-service-grid>${items.map((item, index) => `
    <article class="card service-card"${index >= 6 ? ` hidden data-service-extra` : ""}>
      <div class="service-heading">
        <div class="card-icon service-icon" aria-hidden="true">${item.icon}</div>
        <p class="service-kicker">${esc(item.category)}</p>
        <h3><a href="${item.href}" data-link>${item.title}</a></h3>
      </div>
      <div class="service-detail">
        <p>${item.copy}</p>
        <a class="card-link" href="${item.href}" data-link>Review This Path →</a>
      </div>
    </article>`).join("")}</div>
    <div class="service-reveal">
      <button class="button primary service-reveal-button" type="button" data-service-reveal>View More Family Law Pathways</button>
      <p class="service-note">Services are subject to conflict, licensed-scope, timing, and availability review before representation or document help is confirmed.</p>
    </div>
    <div class="service-methods" aria-label="How MFLG can help">
      ${serviceMethods.map((item) => `<article class="service-method">
        <span aria-hidden="true">${item.icon}</span>
        <strong>${item.title}</strong>
        <p>${item.copy}</p>
      </article>`).join("")}
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
      "Family law services"
    ) + section(
      "Start with the right path",
      "Choose the next step that fits where you are now. Submission of information does not create a client relationship or confirm representation.",
      cards([
        { icon: "▤", title: "Guided Intake", copy: "Answer a few questions so we can understand the family-law issue, timing, county, and next-step needs.", href: "/start" },
        { icon: "?", title: "DIY Guides", copy: "Explore Arizona family-law pathways before deciding whether you need document help, coaching, negotiation support, or a court appearance within licensed scope.", href: "/guides" },
        { icon: "◇", title: "Secure Access", copy: "Client and staff access are routed separately so private case tools remain protected.", href: "/client" }
      ]),
      false,
      "Next steps"
    );
  }

  function practiceAreas() {
    return section("Practice Areas", "Focused Arizona family law pathways with scope review before services are accepted.", serviceCards(), true, "Family law services");
  }

  function fees() {
    return section("Fees", "Pricing should remain transparent but must not imply guaranteed outcomes or accepted representation before review.", `<div class="grid">
      <article class="card"><h3>Document help</h3><p>Flat-fee candidates can be reviewed after issue, scope, urgency, and conflict checks.</p></article>
      <article class="card"><h3>Guided process support</h3><p>Structured support may be available for qualifying Arizona family-law matters within licensed scope.</p></article>
      <article class="card"><h3>Referral-sensitive matters</h3><p>Matters needing attorney review, emergency action, or out-of-scope work require separate next-step confirmation.</p></article>
    </div><div class="notice"><strong>Fee terms are not final on this website.</strong> Confirmed pricing belongs in a written engagement after conflict, scope, and service review.</div>`);
  }

  async function guides() {
    const guides = await loadGuides();
    return section("DIY Guides", "Explore Arizona family-law topics by issue, urgency, and next-step need. These guides are general information and do not replace a conflict and scope review.", `
      <div class="guide-tools">
        <input type="search" placeholder="Search guides" aria-label="Search guides" data-guide-search>
        <select aria-label="Filter guides by category" data-guide-category>
          <option value="">All categories</option>
          ${Array.from(new Set(guides.map((guide) => guide.category))).map((category) => `<option>${esc(category)}</option>`).join("")}
        </select>
      </div>
      <div class="grid" data-guide-list>${renderGuides(guides)}</div>
    `);
  }

  async function loadGuides() {
    try {
      const response = await fetch(guideDataUrl);
      if (!response.ok) throw new Error("Guide data unavailable");
      return response.json();
    } catch (error) {
      return [];
    }
  }

  function renderGuides(guides) {
    if (!guides.length) return `<article class="card"><h3>Guides unavailable</h3><p>Please contact the office if you need help choosing where to start.</p></article>`;
    return guides.map((guide) => `<article class="card" data-category="${esc(guide.category)}" data-title="${esc(guide.title + " " + guide.summary)}">
      <h3>${esc(guide.title)}</h3>
      <div class="guide-meta"><span class="pill">${esc(guide.category)}</span><span class="pill">${esc(guide.level)}</span></div>
      <p>${esc(guide.summary)}</p>
      <ul class="list">${guide.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <div class="actions">${link("/start", "Start Intake", "primary")}</div>
    </article>`).join("");
  }

  function about() {
    return section("About", "MY FAMILY LAW GROUP PLLC helps Arizona families understand options, prepare documents, and move through family-law issues within licensed legal paraprofessional scope.", `<div class="split">
      <div>
        <h3>Jeremy James Jack, JD, LP</h3>
        <p>Arizona Supreme Court Licensed Legal Paraprofessional in Family Law. License No. 500094.</p>
        <p>Services are reviewed for conflict, scope, urgency, and fit before any client relationship or representation is confirmed.</p>
        ${link("/contact", "Contact the office", "primary")}
      </div>
      <div class="media-frame"><img src="/assets/images/jeremy-profile.jpeg" alt="Jeremy James Jack"></div>
    </div>`);
  }

  function faq() {
    return section("FAQ", "", `<div class="grid two">
      ${[
        ["Does intake create a client relationship?", "No. Intake is reviewed for conflicts, scope, urgency, and fit before any services are accepted."],
        ["Is this legal advice?", "Public guides and website content are general information. Specific legal advice requires formal engagement."],
        ["What if I am not sure where to start?", "Use the guided intake or contact the office so the issue, timing, county, and next-step needs can be reviewed."],
        ["Are all family-law matters within LP scope?", "No. Some issues require attorney involvement, emergency review, or referral. Scope is reviewed before services are confirmed."]
      ].map(([q, a]) => `<article class="card"><h3>${q}</h3><p>${a}</p></article>`).join("")}
    </div>`);
  }

  function contact() {
    return section("Contact", "Use the guided intake for structured review, or contact the office directly for urgent timing issues.", `<div class="grid two">
      <article class="card"><h3>Office</h3><p><a href="tel:+18888706354">(888) 870-6354</a><br><a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a><br>Fax: 602-782-8114</p><p>Jeremy James Jack, JD, LP<br>Arizona Supreme Court Licensed Legal Paraprofessional — Family Law<br>License No. 500094</p></article>
      <article class="card"><h3>Before sending details</h3><p>Please do not send confidential facts until the office confirms whether services can be provided.</p></article>
    </div>`);
  }

  function start() {
    return `<section class="section"><div class="inner">
      <p class="eyebrow">Guided intake</p>
      <h1>Start Guided Intake</h1>
      <p class="lead muted">Answer a few questions so the office can review the family-law issue, urgency, county, and next-step needs. Submission does not create a client relationship or confirm representation.</p>
    </div></section><section class="intake-shell"><div id="mflg-intake-root"></div></section>`;
  }

  function clientLogin() {
    return section("Client Login", "Client access is available only through an approved secure portal.", `<div class="notice">If you are an existing client and need access assistance, please contact the office at <a href="tel:+18888706354">(888) 870-6354</a> or <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>.</div>`);
  }

  function staffLogin() {
    return section("Staff Login", "Staff access is restricted.", `<div class="notice">Authorized staff should use the protected staff access process. This public page does not provide case-system access.</div>`);
  }

  function privacy() {
    return section("Privacy", "MY FAMILY LAW GROUP PLLC limits intake collection to information reasonably needed to review conflict, scope, urgency, and next-step options.", `<p>Please avoid sending confidential or highly sensitive facts until the office confirms whether services can be provided. Information submitted through this website may be reviewed for intake, conflict checking, scheduling, and service-fit evaluation.</p>`);
  }

  function terms() {
    return section("Terms & Disclaimer", "Website content is general information, not legal advice for a specific matter.", `<p>Submitting information does not create a client relationship or confirm representation. Services are available only after conflict, scope, urgency, and fit review, and after any required written agreement is completed.</p>`);
  }

  function accessibility() {
    return section("Accessibility", "MY FAMILY LAW GROUP PLLC works to make this website usable for visitors with different access needs.", `<p>If you have difficulty using this website or need information in another format, please contact the office at <a href="tel:+18888706354">(888) 870-6354</a> or <a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a>.</p>`);
  }

  function thankYou() {
    return section("Thank You", "Thank you for contacting MY FAMILY LAW GROUP PLLC.", `<p>Your information will be reviewed for conflict, scope, urgency, and next-step needs. Submission does not create a client relationship or confirm representation.</p>`);
  }

  function notFound() {
    return section("Page Not Found", "The page you requested was not found.", link("/", "Return Home", "primary"));
  }

  async function render() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const view = routes[path] || notFound;
    document.body.classList.toggle("has-hero", path === "/");
    root.innerHTML = await view();
    wireGuideFilters();
    wireServiceReveal();
    renderIntakeIfNeeded(path);
    updateNav(path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    updateHeaderState();
  }

  function renderIntakeIfNeeded(path) {
    if (path !== "/start" || typeof window.MFLGIntakeRoute !== "function") return;
    window.MFLGIntakeRoute({
      entryLabel: "Public website guided intake",
      issuePathway: "",
      source: "mflg-public-site"
    });
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

  function wireGuideFilters() {
    const search = document.querySelector("[data-guide-search]");
    const category = document.querySelector("[data-guide-category]");
    const list = document.querySelector("[data-guide-list]");
    if (!search || !category || !list) return;
    const filter = () => {
      const term = search.value.trim().toLowerCase();
      const cat = category.value;
      list.querySelectorAll(".card").forEach((card) => {
        const matchesTerm = !term || card.dataset.title.toLowerCase().includes(term);
        const matchesCat = !cat || card.dataset.category === cat;
        card.hidden = !(matchesTerm && matchesCat);
      });
    };
    search.addEventListener("input", filter);
    category.addEventListener("change", filter);
  }

  function wireServiceReveal() {
    const button = document.querySelector("[data-service-reveal]");
    const extras = Array.from(document.querySelectorAll("[data-service-extra]"));
    if (!button || extras.length === 0) return;
    button.addEventListener("click", () => {
      extras.forEach((card, index) => {
        card.removeAttribute("hidden");
        card.style.setProperty("--reveal-index", String(index));
      });
      button.closest(".service-reveal").classList.add("revealed");
    });
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("[data-link]");
    if (!anchor) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    history.pushState({}, "", url.pathname);
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    render();
  });

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  window.addEventListener("popstate", render);
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  updateHeaderState();
  render();
}());
