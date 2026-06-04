(function () {
  const guideDataUrl = "/data/diy-guides.json";
  const root = document.querySelector("[data-page-root]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");

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
      <div class="hero-inner">
        <div class="eyebrow">Arizona family law support</div>
        <h1>${title}</h1>
        <p class="lead">${copy}</p>
        <div class="actions">${actions}</div>
      </div>
    </section>`;
  }

  function section(title, copy, body, band) {
    return `<section class="section ${band ? "band" : ""}">
      <div class="inner">
        <p class="eyebrow">MY FAMILY LAW GROUP PLLC</p>
        <h2>${title}</h2>
        ${copy ? `<p class="lead muted">${copy}</p>` : ""}
        ${body}
      </div>
    </section>`;
  }

  function cards(items) {
    return `<div class="grid">${items.map((item) => `<article class="card">
      <h3>${item.title}</h3>
      <p>${item.copy}</p>
    </article>`).join("")}</div>`;
  }

  function home() {
    return hero(
      "MY FAMILY LAW GROUP PLLC",
      "Practical Arizona family law help, document preparation, and guided intake with conflict and scope review before services are confirmed.",
      `${link("/start", "Start Guided Intake", "primary")} ${link("/practice-areas", "View Practice Areas")}`
    ) + section(
      "Clear help for difficult family-law moments",
      "The site is rebuilt as a static, version-controlled source so Webstudio can be used as a visual destination without trapping content in the cloud UI.",
      `<div class="split">
        <div>${cards([
          { title: "Divorce & separation", copy: "Document preparation, process guidance, and next-step planning for Arizona divorce and legal separation matters." },
          { title: "Children & parenting", copy: "Parenting time, legal decision-making, child support, and order-review support within licensed scope." },
          { title: "Orders & enforcement", copy: "Review existing orders, deadlines, compliance issues, and practical next steps before formal engagement." }
        ])}</div>
        <div class="media-frame"><img src="/assets/images/mflg-office.webp" alt="MY FAMILY LAW GROUP office reference"></div>
      </div>`,
      true
    ) + section(
      "Start with the right path",
      "Every intake path preserves the required disclaimer: submission does not create a client relationship and does not confirm representation.",
      cards([
        { title: "Guided intake", copy: "The existing production intake script remains available at /start and is configured for the documented n8n webhook. Live submission still requires approved testing." },
        { title: "DIY guides", copy: "Guides use static JSON data and front-end search/filtering, with no Webstudio CMS dependency." },
        { title: "Protected access", copy: "Client and staff login entries are routed separately so public pages do not point clients into staff-only CRM tools." }
      ])
    );
  }

  function practiceAreas() {
    return section("Practice Areas", "Focused Arizona family law pathways with scope review before services are accepted.", cards([
      { title: "Divorce & legal separation", copy: "Initial filing support, document preparation, disclosure organization, and practical process planning." },
      { title: "Legal decision-making", copy: "Parenting issues, child-focused facts, proposed plans, and safety-sensitive intake review." },
      { title: "Parenting time", copy: "Schedules, exchanges, school and medical logistics, and order review." },
      { title: "Child support", copy: "Support-information collection and review of income, insurance, childcare, and parenting-time inputs." },
      { title: "Existing orders", copy: "Modification, enforcement, compliance review, and documentation planning." },
      { title: "Scope/referral review", copy: "Issues outside licensed LP scope are flagged for attorney involvement or referral coordination." }
    ]));
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
    return section("DIY Guides", "Static, version-controlled guide data with search and category filters. No paid Webstudio CMS is required.", `
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
    if (!guides.length) return `<article class="card"><h3>Guide data unavailable</h3><p>Run the site through a local or hosted web server so static JSON can load.</p></article>`;
    return guides.map((guide) => `<article class="card" data-category="${esc(guide.category)}" data-title="${esc(guide.title + " " + guide.summary)}">
      <h3>${esc(guide.title)}</h3>
      <div class="guide-meta"><span class="pill">${esc(guide.category)}</span><span class="pill">${esc(guide.level)}</span></div>
      <p>${esc(guide.summary)}</p>
      <ul class="list">${guide.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      <div class="actions">${link("/start", "Start Intake", "primary")}</div>
    </article>`).join("");
  }

  function about() {
    return section("About", "Public bio copy remains conservative until the final approved biography is provided.", `<div class="split">
      <div>
        <h3>Jeremy James Jack, JD, LP</h3>
        <p>Arizona Legal Paraprofessional License No. 500094. Final expanded public bio copy should be verified against Arizona licensing records and the approved firm bio before publication.</p>
        <p>The profile image included here is a local asset candidate and should be confirmed by the user before live use.</p>
        ${link("/contact", "Contact the office", "primary")}
      </div>
      <div class="media-frame"><img src="/assets/images/jeremy-profile.jpeg" alt="Jeremy James Jack profile asset candidate"></div>
    </div>`);
  }

  function faq() {
    return section("FAQ", "", `<div class="grid two">
      ${[
        ["Does intake create a client relationship?", "No. Intake is reviewed for conflicts, scope, urgency, and fit before any services are accepted."],
        ["Is this legal advice?", "Public guides and website content are general information. Specific legal advice requires formal engagement."],
        ["Can I use DIY guides without CMS?", "Yes. The guide system is static JSON and front-end filtering."],
        ["Where do staff tools live?", "Staff tools remain protected and separate from the public website."]
      ].map(([q, a]) => `<article class="card"><h3>${q}</h3><p>${a}</p></article>`).join("")}
    </div>`);
  }

  function contact() {
    return section("Contact", "Use the guided intake for structured review, or contact the office directly for urgent timing issues.", `<div class="grid two">
      <article class="card"><h3>Office</h3><p><a href="tel:+18888706354">(888) 870-6354</a><br><a href="mailto:info@myfamilylawgroup.com">info@myfamilylawgroup.com</a><br>Fax: 602-782-8114</p><p>Jeremy James Jack, JD, LP<br>Arizona Legal Paraprofessional License No. 500094</p></article>
      <article class="card"><h3>Before sending details</h3><p>Please do not send confidential facts until the office confirms whether services can be provided.</p></article>
    </div>`);
  }

  function start() {
    return `<section class="section"><div class="inner">
      <p class="eyebrow">Guided intake</p>
      <h1>Start Guided Intake</h1>
      <p class="lead muted">This embedded intake preserves the existing production asset workflow. Submission does not create a client relationship.</p>
    </div></section><section class="intake-shell"><div id="mflg-intake-root"></div></section>`;
  }

  function clientLogin() {
    return section("Client Login", "Client portal routing is a placeholder until the approved client portal destination is confirmed.", `<div class="notice">Do not route clients to staff CRM, Vault, or Staff Intelligence tools. Approved client portal URL is still required.</div>`);
  }

  function staffLogin() {
    return section("Staff Login", "Staff routes must be protected before production use.", `<div class="notice">Planned staff entry should route through Cloudflare Access or an equivalent protected gateway, then to Staff OS/CRM. No public bypass is implemented here.</div>`);
  }

  function privacy() {
    return section("Privacy", "Draft privacy placeholder for review before publication.", `<p>This site should collect only the information needed for intake review and routing. Final privacy terms require user/legal approval before publishing.</p>`);
  }

  function terms() {
    return section("Terms & Disclaimer", "Draft disclaimer placeholder for review before publication.", `<p>Website content is general information, not legal advice. Submitting a form does not create an attorney-client relationship, does not guarantee representation, and does not confirm emergency response.</p>`);
  }

  function accessibility() {
    return section("Accessibility", "Accessibility validation is part of the rebuild acceptance pass.", `<p>The source includes keyboard skip navigation, focus states, semantic landmarks, alt text, and responsive layouts. Full audit remains required before live publishing.</p>`);
  }

  function thankYou() {
    return section("Thank You", "Submission confirmation placeholder.", `<p>This page is ready for a verified form redirect, but live n8n/CRM submission has not been tested in this rebuild pass. Any real submission remains subject to conflict, scope, urgency, and next-step review.</p>`);
  }

  function notFound() {
    return section("Page Not Found", "The page you requested was not found.", link("/", "Return Home", "primary"));
  }

  async function render() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const view = routes[path] || notFound;
    root.innerHTML = await view();
    wireGuideFilters();
    renderIntakeIfNeeded(path);
    updateNav(path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
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
  render();
}());
