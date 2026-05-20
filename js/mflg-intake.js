/* MFLG Intake Final Launch v3.1.1 — Refined JS / Left Rail DOM Removed
   File: js/mflg-intake.js
   Architecture: Webflow external JS → n8n webhook → Google Sheets/Gmail/Vapi routing in n8n.

   In accordance with MP v2:
   - Full replacement file
   - Scoped required change only
   - Removes the left-side <aside> from rendered DOM
   - Preserves conditional logic, field names, payload, validation, n8n submission, and Vapi routing flags
   - Do not place secrets in this public file
*/

(function () {
  "use strict";

  const CONFIG = {
    version: "3.1.1-final-launch",
    mode: "n8n",
    n8nWebhookUrl: "https://jeremyjamesjack.app.n8n.cloud/webhook/mflg-intake",
    source: "MFLG Website Intake",
    expectedRootId: "mflg-intake-root",
    notificationEmail: "info@myfamilylawgroup.com",
    sheetName: "MFLG Intake Leads",
    sheetTab: "Intake",
    requestTimeoutMs: 16000
  };

  const state = {
    step: 1,
    submissionId: createId("SUB"),
    intakeId: createId("MFLG"),
    issuePathway: "",
    answers: {
      urgencySelection: "ASAP",
      involvedType: "Me only",
      serviceInterest: "Full matter support within LP scope",
      consentToContact: true,
      leadStatus: "New"
    },
    submitting: false,
    submittedPayload: null,
    submitAttemptCount: 0
  };

  const stages = {
    1: [1, "STEP 1 OF 4", "Issue"],
    2: [2, "STEP 2 OF 4", "Pathway"],
    3: [2, "STEP 2 OF 4", "Timing"],
    4: [3, "STEP 3 OF 4", "Service Fit"],
    5: [4, "STEP 4 OF 4", "Contact"],
    6: [4, "RECEIVED", "Submitted"]
  };

  const hardScopeReviewItems = [
    "Adoption",
    "Assisted reproductive technology / surrogacy",
    "DCS / dependency / foster care",
    "Termination of parental rights",
    "ICWA / Native American child welfare issue",
    "Appeal",
    "QDRO or supplemental retirement division order",
    "Business entity division",
    "Commercial property division",
    "Military/federal retirement benefits",
    "International custody/support",
    "Hague / foreign order / foreign service",
    "Tribal court issue"
  ];

  const referralItems = [
    "Termination of parental rights",
    "ICWA / Native American child welfare issue",
    "Appeal",
    "Hague / foreign order / foreign service",
    "Bankruptcy",
    "Criminal case",
    "Immigration issue",
    "Tax issue"
  ];

  const softScopeReviewItems = ["Not sure"];

  const issueOptions = [
    opt("Divorce / Legal Separation", "Divorce / Separation", "Dissolution, legal separation, annulment, temporary orders, or consent decree.", "courthouse"),
    opt("Parenting Time / Legal Decision-Making", "Parenting", "Parenting time, legal decision-making, relocation, or parenting plan issues.", "family"),
    opt("Child Support", "Child Support", "Establish, modify, enforce, calculate, or review child support.", "support"),
    opt("Spousal Maintenance", "Spousal Maintenance", "Alimony/spousal support requests, responses, modification, or enforcement.", "scales"),
    opt("Paternity", "Paternity", "Parentage, birth certificate, DNA testing, parenting time, or support.", "person"),
    opt("Modification of Existing Orders", "Modification", "Change parenting, support, maintenance, or other family-court orders.", "edit"),
    opt("Enforcement of Existing Orders", "Enforcement", "Orders not being followed, contempt, support arrears, or missed parenting time.", "shield"),
    opt("Mediation / ADR / Settlement Help", "Mediation / ADR", "Mediation, negotiation, arbitration, collaborative law, or settlement help.", "handshake"),
    opt("Protective Order Related to Family Law", "Protective Order", "Family-law related safety concern, protective order, or related hearing.", "alert"),
    opt("Document Preparation / Review", "Documents", "Prepare, review, file, or respond to family-law documents.", "document"),
    opt("Not Sure", "Not Sure", "Answer broader triage questions so we can identify the next step.", "question")
  ];

  const scopeItems = [
    "Adoption",
    "Assisted reproductive technology / surrogacy",
    "DCS / dependency / foster care",
    "Termination of parental rights",
    "ICWA / Native American child welfare issue",
    "Appeal",
    "QDRO or supplemental retirement division order",
    "Business entity division",
    "Commercial property division",
    "Bankruptcy",
    "Criminal case",
    "Immigration issue",
    "Tax issue",
    "Military/federal retirement benefits",
    "International custody/support",
    "Hague / foreign order / foreign service",
    "Tribal court issue",
    "None of these",
    "Not sure"
  ];

  const documentItems = [
    "Petition / Response",
    "Court orders",
    "Decree",
    "Parenting plan",
    "Child support order",
    "Spousal maintenance order",
    "Temporary orders",
    "Protective order",
    "Hearing notice",
    "Service documents",
    "Financial affidavit",
    "Paystubs / tax returns",
    "Mediation agreement",
    "I have documents but will upload/send later",
    "None yet",
    "Not sure"
  ];

  const pathways = {
    "Divorce / Legal Separation": [
      select("caseStage", "Is a case already filed?", ["Not filed yet", "Already filed / active case", "Final decree entered", "I was served", "Not sure"], true),
      select("agreementStatus", "Are both parties generally in agreement?", ["Yes, mostly agreed", "Some issues remain", "No, contested", "Not sure"], true),
      select("childrenInvolved", "Are minor children involved?", ["Yes", "No", "Not sure"], true),
      checks("divorceIssues", "Which divorce/separation issues are involved?", ["Property/debt division", "Real estate / home", "Child support", "Spousal maintenance", "Parenting time / legal decision-making", "Temporary orders", "Consent decree / agreement", "Name change", "Not sure"]),
      select("serviceNeed", "What type of help do you need?", ["Document preparation", "Document review", "Negotiation / settlement help", "Court appearance / representation within LP scope", "Full matter support within LP scope", "Not sure"], true)
    ],

    "Parenting Time / Legal Decision-Making": [
      select("existingOrder", "Is there an existing parenting order?", ["Yes", "No", "Not sure"], true),
      checks("parentingIssues", "What parenting issue do you need help with?", ["Legal decision-making", "Parenting time schedule", "Modification", "Enforcement", "Relocation", "Supervised parenting time", "Child being withheld", "Grandparent / third-party rights", "Not sure"]),
      select("childrenInvolved", "Are minor children involved?", ["Yes", "No", "Not sure"], true),
      input("childrenAges", "Children’s ages or dates of birth", "Example: 6 and 9, or DOBs"),
      checks("parentingSafetyConcerns", "Any safety or best-interest concerns?", ["Domestic violence", "Substance abuse", "Mental health concern", "Child abuse or neglect concern", "DCS involvement", "Protective order", "No safety concerns", "Prefer not to say"], "No safety concerns"),
      select("childrenLivedOutsideAZ5Years", "Have the children lived outside Arizona in the last five years?", ["Yes", "No", "Not sure"], false),
      select("otherJurisdictionOrders", "Any orders from another state, country, or tribal court?", ["Yes", "No", "Not sure"], false)
    ],

    "Child Support": [
      select("supportAction", "What child support help is needed?", ["Establish new support", "Modify support", "Enforce support / arrears", "Calculate or review support", "Respond to child support request", "Not sure"], true),
      select("existingOrder", "Is there an existing child support order?", ["Yes", "No", "Not sure"], true),
      select("incomeChange", "Are income, parenting time, insurance, or childcare costs changing?", ["Yes", "No", "Not sure"], true),
      select("arrearsOrBackSupport", "Are unpaid/back support amounts involved?", ["Yes", "No", "Not sure"], true)
    ],

    "Spousal Maintenance": [
      select("spousalAction", "What spousal maintenance help is needed?", ["Request maintenance", "Respond to request", "Modify existing order", "Enforce existing order", "Review likely exposure/eligibility", "Not sure"], true),
      select("existingOrder", "Is there an existing spousal maintenance order?", ["Yes", "No", "Not sure"], true),
      select("tiedToDivorce", "Is this tied to a divorce or legal separation?", ["Yes", "No", "Not sure"], true),
      input("maintenanceNotes", "Briefly describe the maintenance issue", "Income difference, current order, duration, or dispute")
    ],

    "Paternity": [
      select("parentageEstablished", "Is parentage already legally established?", ["Yes", "No", "Not sure"], true),
      select("birthCertificateIssue", "Is birth certificate/signing involved?", ["Yes", "No", "Not sure"], true),
      checks("paternityIssues", "What issues are connected to parentage?", ["DNA testing", "Birth certificate", "Acknowledgment of paternity", "Parenting time", "Legal decision-making", "Child support", "Same-sex parentage issue", "Not sure"]),
      select("caseStage", "Is a case already filed?", ["Not filed yet", "Already filed / active case", "Final order entered", "I was served", "Not sure"], true)
    ],

    "Modification of Existing Orders": [
      checks("orderToModify", "What order needs to be changed?", ["Parenting time", "Legal decision-making", "Child support", "Spousal maintenance", "Relocation", "Other family-court order", "Not sure"]),
      textarea("changeReason", "What changed?", "Briefly describe what changed and why a modification may be needed.", true),
      select("existingOrder", "Do you have a current signed court order?", ["Yes", "No", "Not sure"], true),
      input("orderDate", "Approximate order date, if known", "Month/year or date")
    ],

    "Enforcement of Existing Orders": [
      checks("orderToEnforce", "What order is not being followed?", ["Parenting time", "Legal decision-making", "Child support", "Spousal maintenance", "Property/debt family order", "Other order", "Not sure"]),
      textarea("nonComplianceDescription", "What is not being followed?", "Briefly describe the issue.", true),
      select("urgentReliefNeeded", "Is urgent court relief needed?", ["Yes", "No", "Not sure"], true),
      select("existingOrder", "Do you have a current signed court order?", ["Yes", "No", "Not sure"], true)
    ],

    "Mediation / ADR / Settlement Help": [
      checks("adrType", "What type of ADR or settlement help are you seeking?", ["Mediation", "Arbitration", "Negotiation", "Collaborative law", "Informal settlement conference", "Settlement agreement drafting", "Review proposed agreement", "Not sure"]),
      checks("adrIssues", "What issues are disputed or being resolved?", ["Divorce/separation", "Property/debt division", "Spousal maintenance", "Legal decision-making", "Parenting plan", "Child support", "Modification", "Enforcement", "Not sure"]),
      select("bothPartiesWilling", "Are both parties willing to participate?", ["Yes", "No", "Maybe / not sure"], true),
      select("activeCourtCase", "Is there an active court case?", ["Yes", "No", "Not sure"], true),
      notice("ADR can often be a private, less adversarial, and efficient way to resolve family-law disputes. Mediation is generally not binding unless agreements are signed and approved by the court.")
    ],

    "Protective Order Related to Family Law": [
      select("immediateSafetyConcern", "Is there an immediate safety concern?", ["Yes", "No", "Prefer not to say"], true),
      select("protectiveOrderStatus", "Is there a protective order involved?", ["I need one", "One is already in place", "There is a hearing scheduled", "No", "Not sure"], true),
      date("protectiveOrderHearingDate", "Protective order hearing date, if any"),
      select("familyLawRelated", "Is this tied to a family-law matter?", ["Yes", "No", "Not sure"], true),
      select("childrenInvolved", "Are children involved?", ["Yes", "No", "Not sure"], true),
      notice("If you are in immediate danger, call 911 or local emergency services. This intake is not monitored 24/7.")
    ],

    "Document Preparation / Review": [
      checks("documentTypes", "What document or order do you need help with?", ["New filing / petition", "Response", "Consent decree", "Parenting plan", "Child support worksheet", "Modification", "Enforcement", "Mediation agreement", "Temporary orders", "Not sure"]),
      select("representingSelf", "Are you representing yourself or seeking LP assistance?", ["Representing myself and need document help", "Seeking LP assistance within scope", "Not sure"], true),
      date("filingDeadline", "Filing deadline, if known"),
      textarea("documentSummary", "Briefly describe the document help needed", "What needs to be prepared, reviewed, filed, or corrected?", true)
    ],

    "Not Sure": [
      select("caseStage", "Is there a court case already?", ["No case filed", "Active case", "Final order already entered", "I was served", "Not sure"], true),
      select("childrenInvolved", "Are children involved?", ["Yes", "No", "Not sure"], true),
      select("hasDeadline", "Is there a deadline or court date?", ["Yes", "No", "Not sure"], true),
      checks("broadIssueType", "What does the issue seem to involve?", ["Divorce/separation", "Parenting", "Child support", "Spousal maintenance", "Paternity", "Modification", "Enforcement", "Documents", "Safety/protective order", "Mediation/settlement", "Not sure"]),
      textarea("whatResultNeeded", "What result are you hoping for?", "Tell us the outcome you are trying to reach.", true)
    ]
  };

  function opt(value, title, sub, iconName) {
    return { value, title, sub, icon: iconName };
  }

  function select(key, label, options, required) {
    return { type: "select", key, label, options, required: !!required };
  }

  function input(key, label, placeholder, required) {
    return { type: "input", key, label, placeholder: placeholder || "", required: !!required, inputType: "text" };
  }

  function date(key, label, required) {
    return { type: "input", key, label, placeholder: "", required: !!required, inputType: "date" };
  }

  function textarea(key, label, placeholder, required) {
    return { type: "textarea", key, label, placeholder: placeholder || "", required: !!required };
  }

  function checks(key, label, options, exclusiveNone) {
    return { type: "checks", key, label, options, exclusiveNone: exclusiveNone || "" };
  }

  function notice(text) {
    return { type: "notice", text };
  }

  function createId(prefix) {
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${stamp}-${random}`;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function root() {
    return document.getElementById(CONFIG.expectedRootId);
  }

  function ans(key) {
    return state.answers[key] || "";
  }

  function set(key, value) {
    state.answers[key] = value;
  }

  function arr(key) {
    return Array.isArray(state.answers[key]) ? state.answers[key] : [];
  }

  function setMulti(key, value, checked, exclusive) {
    const current = arr(key);
    let next = checked ? [...new Set([...current, value])] : current.filter((item) => item !== value);

    if (checked && exclusive && value === exclusive) {
      next = [value];
    } else if (checked && exclusive) {
      next = next.filter((item) => item !== exclusive);
    }

    state.answers[key] = next;
  }

  function includesAny(list, items) {
    return Array.isArray(list) && items.some((item) => list.includes(item));
  }

  function currentStage() {
    return stages[state.step] || stages[1];
  }

  function icon(name) {
    const paths = {
      courthouse: '<path d="M3 10h18"/><path d="M5 10v10M9 10v10M15 10v10M19 10v10"/><path d="M2 20h20M12 3 3 8h18l-9-5Z"/>',
      family: '<path d="M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M17 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2 21v-2a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v2"/><path d="M12 21v-2a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v2"/>',
      support: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8.5 10h5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h5"/>',
      scales: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M7 7l-4 7h8L7 7Z"/><path d="M17 7l-4 7h8l-4-7Z"/>',
      person: '<circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
      edit: '<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="M13 6l5 5"/>',
      shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="M9 12l2 2 4-4"/>',
      handshake: '<path d="M8 12l3 3a2 2 0 0 0 3 0l4-4"/><path d="M2 12l5-5 4 4"/><path d="M22 12l-5-5-4 4"/><path d="M7 17l2 2M17 17l-2 2"/>',
      alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
      document: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
      question: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.6 2.6 0 0 1 4.8 1.4c0 1.9-2.3 2.1-2.3 4"/><path d="M12 17h.01"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
      message: '<path d="M4 4h16v14H7l-3 3V4Z"/><path d="M8 9h8M8 13h5"/>'
    };

    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.document}</svg>`;
  }

  function render() {
    const mount = root();
    if (!mount) return;

    const stage = currentStage();

    mount.innerHTML = `
      <section class="mflg-intake" data-version="${esc(CONFIG.version)}">
        <div class="mflg-shell">
          <div class="mflg-right">
            ${state.step === 6 ? "" : introBlock()}

            <header class="mflg-head">
              <div class="mflg-headtop">
                <div class="mflg-count">${stage[1]}</div>
                <h3 class="mflg-heading">${stage[2]}</h3>
              </div>

              <div class="mflg-track">
                ${["Issue", "Timing", "Details", "Contact"].map((label, index) => `
                  <div class="mflg-progress ${index + 1 === stage[0] ? "is-active" : index + 1 < stage[0] ? "is-complete" : ""}">
                    <span class="mflg-dot"></span>
                    <span>${label}</span>
                  </div>
                `).join("")}
              </div>
            </header>

            <main class="mflg-body">
              <div class="mflg-error" id="mflg-error"></div>
              ${state.step === 6 ? successStep() : stepHtml()}
            </main>

            ${state.step === 6 ? "" : footer()}
          </div>
        </div>
      </section>
    `;

    bind();
    updateCounter();
  }

  function introBlock() {
    return `
      <section class="mflg-intro">
        <div class="mflg-intro-inner">
          <p class="mflg-intro-kicker">Arizona Family Law LP Intake</p>
          <h2 class="mflg-intro-title">Answer a few questions. Get a clear next step.</h2>
          <p class="mflg-intro-copy">Scope-appropriate Arizona family-law guidance from a Licensed Legal Paraprofessional. MY FAMILY LAW GROUP will review your submission for conflicts, service scope, urgency, and next-step fit before confirming whether services can be provided.</p>
        </div>
      </section>
    `;
  }

  function footer() {
    return `
      <div class="mflg-foot">
        ${icon("shield")}
        <span>Please do not include confidential details until services are confirmed. Intake submission does not create a client relationship.</span>
      </div>
    `;
  }

  function stepHtml() {
    if (state.step === 1) return issueStep();
    if (state.step === 2) return pathwayStep();
    if (state.step === 3) return timingStep();
    if (state.step === 4) return fitStep();
    return contactStep();
  }

  function issueStep() {
    return `
      <section class="mflg-screen mflg-issue-screen">
        <h3 class="mflg-title">${icon("courthouse")}What type of family-law issue are you facing?</h3>
        <p class="mflg-copy">Choose the closest path. If you are not sure, choose “Not Sure” and we will ask broader triage questions.</p>

        <div class="mflg-cards two mflg-issue-grid">
          ${issueOptions.map((item) => card("issuePathway", item.value, item.title, item.sub, item.icon)).join("")}
        </div>

        <div class="mflg-divider">${icon("scales")}</div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">What do you most need help with right now?</label>
            ${selectEl("primaryHelpNeeded", ["Understand my options", "Prepare or review documents", "Respond to papers I received", "Modify an existing order", "Enforce an existing order", "Prepare for court", "Negotiate or settle", "Prepare for mediation", "Get help with an agreement", "Not sure"], true)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Who are you seeking help for?</label>
            ${selectEl("helpFor", ["Me", "My child", "My grandchild", "A family member", "Someone else"], true)}
          </div>
        </div>

        <div class="mflg-field">
          <div class="mflg-rowtop">
            <label class="mflg-label">Briefly describe your situation.</label>
            <span class="mflg-counter">0 / 750</span>
          </div>
          <textarea class="mflg-textarea" data-key="summary" maxlength="750" data-required="true" placeholder="Share a few details so we can better understand your situation...">${esc(ans("summary"))}</textarea>
          <p class="mflg-help">Please avoid highly sensitive details. A conflict and scope review must happen before services are confirmed.</p>
        </div>

        <div class="mflg-honeypot" aria-hidden="true">
          <label>Leave this field empty<input data-key="website" tabindex="-1" autocomplete="off"></label>
        </div>

        ${nav(false, "Next: Pathway")}
      </section>
    `;
  }

  function pathwayStep() {
    const issue = state.issuePathway || ans("issuePathway") || "Not Sure";
    const questions = pathways[issue] || pathways["Not Sure"];

    return `
      <section class="mflg-screen">
        <h3 class="mflg-title">${icon("document")}${esc(issue)}</h3>
        <p class="mflg-copy">These questions change based on your selected issue so we can identify urgency, scope, and likely next step.</p>

        <div class="mflg-panel">
          <h4 class="mflg-panel-title">Pathway questions</h4>
          ${questions.map(renderQuestion).join("")}
        </div>

        ${["Protective Order Related to Family Law", "Document Preparation / Review", "Mediation / ADR / Settlement Help"].includes(issue) ? `
          <div class="mflg-notice show">Services are subject to Arizona LP scope, conflict review, and formal engagement. Matters outside scope may require attorney involvement or referral coordination.</div>
        ` : ""}

        ${nav(true, "Next: Timing")}
      </section>
    `;
  }

  function timingStep() {
    return `
      <section class="mflg-screen">
        <h3 class="mflg-title">${icon("clock")}Court status, urgency, and deadlines.</h3>
        <p class="mflg-copy">Deadlines, hearings, service, and safety concerns help determine review priority.</p>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">When do you need help?</label>
            <div class="mflg-cards three">
              ${card("urgencySelection", "ASAP", "ASAP", "Urgent — I need help right away.", "clock")}
              ${card("urgencySelection", "Within 30 Days", "Within 30 Days", "I need help in the next few weeks.", "document")}
              ${card("urgencySelection", "Just Exploring", "Just Exploring", "I’m gathering info for the future.", "question")}
            </div>
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Who is involved?</label>
            <div class="mflg-segments">
              ${segment("involvedType", "Me only")}
              ${segment("involvedType", "Me & spouse/partner")}
              ${segment("involvedType", "Me & others")}
            </div>
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Court/case stage</label>
            ${selectEl("caseStage", ["No case filed", "Active case", "Final order already entered", "I was served", "Not sure"], true)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Arizona county</label>
            ${selectEl("county", ["Maricopa", "Pima", "Pinal", "Yavapai", "Yuma", "Mohave", "Coconino", "Cochise", "Navajo", "Apache", "Gila", "Graham", "Greenlee", "La Paz", "Santa Cruz", "Other / Not Sure"], true)}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Have you been served?</label>
            ${selectEl("servedStatus", ["Yes", "No", "Not sure"], false)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Response deadline, if known</label>
            ${dateEl("urgentDeadline")}
            <p class="mflg-help">Leave blank if unknown.</p>
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Court/hearing date, if any</label>
            ${dateEl("courtDate")}
            <p class="mflg-help">Leave blank if unknown.</p>
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Immediate safety concern?</label>
            ${selectEl("immediateSafetyConcern", ["Yes", "No", "Prefer not to say"], true)}
          </div>
        </div>

        ${ans("immediateSafetyConcern") === "Yes" ? safetyWarning() : ""}

        ${nav(true, "Next: Service Fit")}
      </section>
    `;
  }

  function fitStep() {
    const flagState = flags();

    return `
      <section class="mflg-screen">
        <h3 class="mflg-title">${icon("shield")}Scope review and service fit.</h3>
        <p class="mflg-copy">Some issues may require review, coordination, or referral. This helps identify that early.</p>

        ${flagState.safetyFlag ? safetyWarning() : ""}

        <div class="mflg-panel">
          <h4 class="mflg-panel-title">Scope screen</h4>
          ${checkGrid("scopeItems", scopeItems, "None of these")}
        </div>

        ${flagState.hardScopeReviewFlag ? `
          <div class="mflg-notice show">Your answers include an issue that may require attorney involvement, special qualification review, or referral coordination.</div>
        ` : ""}

        ${flagState.softScopeReviewFlag && !flagState.hardScopeReviewFlag ? `
          <div class="mflg-notice show">Because you selected “Not sure,” this intake will be reviewed for service scope before any service pathway is confirmed.</div>
        ` : ""}

        <div class="mflg-panel">
          <h4 class="mflg-panel-title">Documents and service preference</h4>

          <div class="mflg-field">
            <label class="mflg-label">What documents are available?</label>
            ${checkGrid("documentsAvailable", documentItems, "None yet")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">What result are you hoping to accomplish?</label>
            ${textareaEl("desiredOutcome", "Describe your desired outcome or next step.", true)}
          </div>

          <div class="mflg-grid2">
            <div class="mflg-field">
              <label class="mflg-label">Preferred service type</label>
              ${selectEl("serviceInterest", ["Quick question / limited guidance", "Document review", "Prepare and file documents", "Help negotiating an agreement", "Mediation or settlement preparation", "Court appearance / limited-scope representation", "Full matter support within LP scope", "Not sure"], true)}
            </div>

            <div class="mflg-field">
              <label class="mflg-label">Budget or payment concern</label>
              ${selectEl("budgetOrPaymentConcern", ["Lowest-cost option", "Flat fee if available", "Limited-scope help", "Ongoing support", "Need payment flexibility", "Not sure yet"], false)}
            </div>
          </div>
        </div>

        ${nav(true, "Next: Contact")}
      </section>
    `;
  }

  function contactStep() {
    const flagState = flags();
    const recommended = recommendedPath(flagState);

    return `
      <section class="mflg-screen">
        <h3 class="mflg-title">${icon("message")}Contact and conflict check.</h3>
        <p class="mflg-copy">This information is used to review conflicts, scope, urgency, and next-step fit before services are confirmed.</p>

        ${flagState.safetyFlag ? safetyWarning() : ""}

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Full legal name</label>
            ${inputEl("fullName", "Your full legal name", true)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Preferred name</label>
            ${inputEl("preferredName", "Optional")}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Phone</label>
            ${inputEl("phone", "Phone number", true, "tel")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Email</label>
            ${inputEl("email", "Email address", true, "email")}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">City</label>
            ${inputEl("city", "City")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Preferred contact method</label>
            ${selectEl("preferredContactMethod", ["Phone", "Email", "Text", "No preference"], true)}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Best time to contact</label>
            ${inputEl("bestTimeToContact", "Morning, afternoon, evening, etc.")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">How did you hear about us?</label>
            ${inputEl("howDidYouHearAboutUs", "Google, referral, social, etc.")}
          </div>
        </div>

        <div class="mflg-divider">${icon("scales")}</div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Opposing party full legal name</label>
            ${inputEl("opposingParty", "Full name if known; enter “unknown” if not known", true)}
            <p class="mflg-help">This helps with conflict review. If you do not know the full legal name, enter “unknown.”</p>
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Opposing party other names, if known</label>
            ${inputEl("opposingPartyOtherNames", "Aliases, maiden name, former name")}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Opposing party attorney, if any</label>
            ${inputEl("opposingAttorney", "Attorney name or not sure")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Other involved adults</label>
            ${inputEl("otherInvolvedAdults", "Optional")}
          </div>
        </div>

        <label class="mflg-check">
          <input type="checkbox" data-key="consentNoRelationship" ${ans("consentNoRelationship") ? "checked" : ""} data-required="true">
          <span>I understand that submitting this intake does not create a client relationship. MY FAMILY LAW GROUP must complete a conflict, scope, and next-step review before accepting representation or providing services.</span>
        </label>

        <label class="mflg-check" style="margin-top:10px">
          <input type="checkbox" data-key="consentLPScope" ${ans("consentLPScope") ? "checked" : ""} data-required="true">
          <span>I understand MY FAMILY LAW GROUP provides services through an Arizona Licensed Legal Paraprofessional within licensed scope and may identify issues requiring attorney involvement, another professional, or referral.</span>
        </label>

        <div class="mflg-summarybox">
          <strong>Preliminary next step:</strong> ${esc(recommended)}<br>
          <span>This is an automated intake triage label only. It does not confirm representation or legal advice.</span>
        </div>

        <div class="mflg-nav">
          <button type="button" class="mflg-btn mflg-secondary" data-action="back">Back</button>
          <button type="button" class="mflg-btn mflg-primary" data-action="submit" ${state.submitting ? "disabled" : ""}>${state.submitting ? "Submitting..." : "Submit Intake →"}</button>
        </div>
      </section>
    `;
  }

  function safetyWarning() {
    return `
      <div class="mflg-notice show">
        If you are in immediate danger, call 911 or local emergency services. This intake is not monitored 24/7 and does not create an emergency-response relationship.
      </div>
    `;
  }

  function successStep() {
    const submitted = state.submittedPayload;

    return `
      <section class="mflg-screen">
        <div class="mflg-success show">
          <h3>Thank you. Your intake has been received.</h3>
          <p>Submission of this form does not create a client relationship. MY FAMILY LAW GROUP will review your submission for conflicts, service scope, urgency, and next-step fit before confirming whether services can be provided.</p>
          <p>If this is an emergency or you are in immediate danger, call 911 or local emergency services.</p>

          <div class="mflg-summarybox">
            <strong>Submission ID:</strong> ${esc(submitted?.submissionId || state.submissionId)}<br>
            <strong>Recommended next step:</strong> ${esc(submitted?.recommendedNextStep || "")}<br>
            <strong>Priority:</strong> ${esc(submitted?.priority || "")}
          </div>
        </div>
      </section>
    `;
  }

  function card(group, value, title, sub, iconName) {
    const selected = group === "issuePathway" ? state.issuePathway === value : ans(group) === value;
    const wide = group === "issuePathway" && value === "Not Sure" ? " mflg-card-wide" : "";

    return `
      <button type="button" class="mflg-card${wide} ${selected ? "is-selected" : ""}" data-option-group="${group}" data-option-value="${esc(value)}">
        <span class="mflg-radio"></span>
        <span class="mflg-card-icon">${icon(iconName)}</span>
        <span>
          <span class="mflg-card-title">${esc(title)}</span>
          <span class="mflg-card-sub">${esc(sub)}</span>
        </span>
      </button>
    `;
  }

  function segment(key, value) {
    return `
      <button type="button" class="mflg-seg ${ans(key) === value ? "is-selected" : ""}" data-option-group="${key}" data-option-value="${esc(value)}">
        ${esc(value)}
      </button>
    `;
  }

  function selectEl(key, options, required) {
    return `
      <select class="mflg-select" data-key="${key}" ${required ? "data-required='true'" : ""}>
        <option value="">Select one</option>
        ${options.map((option) => `<option value="${esc(option)}" ${ans(key) === option ? "selected" : ""}>${esc(option)}</option>`).join("")}
      </select>
    `;
  }

  function inputEl(key, placeholder, required, type) {
    return `
      <input class="mflg-input" type="${type || "text"}" data-key="${key}" value="${esc(ans(key))}" placeholder="${esc(placeholder || "")}" ${required ? "data-required='true'" : ""}>
    `;
  }

  function dateEl(key, required) {
    return `
      <input class="mflg-input" type="date" data-key="${key}" value="${esc(ans(key))}" ${required ? "data-required='true'" : ""}>
    `;
  }

  function textareaEl(key, placeholder, required) {
    return `
      <textarea class="mflg-textarea" data-key="${key}" ${required ? "data-required='true'" : ""} placeholder="${esc(placeholder || "")}">${esc(ans(key))}</textarea>
    `;
  }

  function checkGrid(key, options, exclusive) {
    const selected = arr(key);

    return `
      <div class="mflg-checkgrid" data-check-group="${key}" ${exclusive ? `data-exclusive-none="${esc(exclusive)}"` : ""}>
        ${options.map((option) => `
          <label class="mflg-check">
            <input type="checkbox" data-check-key="${key}" value="${esc(option)}" ${selected.includes(option) ? "checked" : ""}>
            <span>${esc(option)}</span>
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderQuestion(question) {
    if (question.type === "notice") {
      return `<div class="mflg-notice show">${esc(question.text)}</div>`;
    }

    if (question.type === "select") {
      return `
        <div class="mflg-field">
          <label class="mflg-label">${esc(question.label)}</label>
          ${selectEl(question.key, question.options, question.required)}
        </div>
      `;
    }

    if (question.type === "input") {
      return `
        <div class="mflg-field">
          <label class="mflg-label">${esc(question.label)}</label>
          ${question.inputType === "date" ? dateEl(question.key, question.required) : inputEl(question.key, question.placeholder, question.required)}
          ${question.inputType === "date" ? `<p class="mflg-help">Leave blank if unknown.</p>` : ""}
        </div>
      `;
    }

    if (question.type === "textarea") {
      return `
        <div class="mflg-field">
          <label class="mflg-label">${esc(question.label)}</label>
          ${textareaEl(question.key, question.placeholder, question.required)}
        </div>
      `;
    }

    if (question.type === "checks") {
      return `
        <div class="mflg-field">
          <label class="mflg-label">${esc(question.label)}</label>
          ${checkGrid(question.key, question.options, question.exclusiveNone)}
        </div>
      `;
    }

    return "";
  }

  function nav(back, nextLabel) {
    return `
      <div class="mflg-nav">
        ${back ? `<button type="button" class="mflg-btn mflg-secondary" data-action="back">Back</button>` : `<span></span>`}
        <button type="button" class="mflg-btn mflg-primary" data-action="next">${esc(nextLabel)} →</button>
      </div>
    `;
  }

  function bind() {
    const mount = root();
    if (!mount) return;

    mount.querySelectorAll("[data-option-group]").forEach((element) => {
      element.addEventListener("click", function () {
        const group = element.getAttribute("data-option-group");
        const value = element.getAttribute("data-option-value");

        if (group === "issuePathway") {
          state.issuePathway = value;
          set("legalIssue", value);
          set("matterCategory", value);
          set("issuePathway", value);
        } else {
          set(group, value);
        }

        render();
      });
    });

    mount.querySelectorAll("[data-key]").forEach((element) => {
      element.addEventListener("input", updateFromInput);
      element.addEventListener("change", updateFromInput);
    });

    mount.querySelectorAll("[data-check-key]").forEach((element) => {
      element.addEventListener("change", function () {
        const key = element.getAttribute("data-check-key");
        const exclusive = element.closest("[data-exclusive-none]")?.getAttribute("data-exclusive-none") || "";
        setMulti(key, element.value, element.checked, exclusive);
        render();
      });
    });

    mount.querySelectorAll("[data-action='next']").forEach((button) => {
      button.addEventListener("click", next);
    });

    mount.querySelectorAll("[data-action='back']").forEach((button) => {
      button.addEventListener("click", back);
    });

    mount.querySelectorAll("[data-action='submit']").forEach((button) => {
      button.addEventListener("click", submit);
    });
  }

  function updateFromInput(event) {
    const element = event.target;
    const key = element.getAttribute("data-key");
    if (!key) return;

    set(key, element.type === "checkbox" ? element.checked : element.value);
    updateCounter();
  }

  function updateCounter() {
    root()?.querySelectorAll(".mflg-counter").forEach((counter) => {
      counter.textContent = `${String(ans("summary") || "").length} / 750`;
    });
  }

  function currentScreen() {
    return root()?.querySelector(".mflg-screen");
  }

  function validate() {
    const screen = currentScreen();
    if (!screen) return true;

    screen.querySelectorAll(".mflg-invalid,.mflg-invalid-group").forEach((element) => {
      element.classList.remove("mflg-invalid", "mflg-invalid-group");
    });

    showError("");

    let valid = true;

    screen.querySelectorAll("[data-required='true']").forEach((element) => {
      const filled = element.type === "checkbox" ? element.checked : String(element.value || "").trim() !== "";

      if (!filled) {
        element.classList.add("mflg-invalid");
        valid = false;
      }
    });

    if (state.step === 1 && !state.issuePathway) {
      screen.querySelector("[data-option-group='issuePathway']")?.classList.add("mflg-invalid");
      valid = false;
    }

    if (state.step === 4) {
      ["scopeItems", "documentsAvailable"].forEach((key) => {
        if (!arr(key).length) {
          screen.querySelector(`[data-check-group='${key}']`)?.classList.add("mflg-invalid-group");
          valid = false;
        }
      });
    }

    if (state.step === 5) {
      const email = ans("email");

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        screen.querySelector("[data-key='email']")?.classList.add("mflg-invalid");
        valid = false;
      }
    }

    if (!valid) {
      showError("Please complete the highlighted required fields before continuing.");
      screen.querySelector(".mflg-invalid,.mflg-invalid-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return valid;
  }

  function showError(message) {
    const box = document.getElementById("mflg-error");
    if (!box) return;

    box.textContent = message;
    box.classList.toggle("show", !!message);
  }

  function next() {
    if (!validate()) return;

    state.step = Math.min(5, state.step + 1);
    render();
    root()?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function back() {
    state.step = Math.max(1, state.step - 1);
    render();
    root()?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function flags() {
    const answers = state.answers;

    const urgencyFlag =
      answers.urgencySelection === "ASAP" ||
      answers.caseStage === "I was served" ||
      answers.servedStatus === "Yes" ||
      answers.hasDeadline === "Yes" ||
      answers.urgentReliefNeeded === "Yes" ||
      answers.protectiveOrderStatus === "There is a hearing scheduled" ||
      answers.immediateSafetyConcern === "Yes" ||
      String(answers.urgentDeadline || "").trim() !== "" ||
      String(answers.courtDate || "").trim() !== "" ||
      String(answers.protectiveOrderHearingDate || "").trim() !== "";

    const safetyFlag =
      answers.immediateSafetyConcern === "Yes" ||
      ["I need one", "One is already in place", "There is a hearing scheduled"].includes(answers.protectiveOrderStatus) ||
      includesAny(answers.parentingSafetyConcerns, ["Domestic violence", "Child abuse or neglect concern", "DCS involvement", "Protective order"]);

    const hardScopeReviewFlag = includesAny(answers.scopeItems, hardScopeReviewItems);
    const softScopeReviewFlag = includesAny(answers.scopeItems, softScopeReviewItems);
    const scopeReviewFlag = hardScopeReviewFlag || softScopeReviewFlag;
    const referralFlag = includesAny(answers.scopeItems, referralItems) || answers.immediateSafetyConcern === "Yes";

    const childrenFlag =
      answers.childrenInvolved === "Yes" ||
      includesAny(answers.divorceIssues, ["Parenting time / legal decision-making", "Child support"]) ||
      includesAny(answers.parentingIssues, ["Legal decision-making", "Parenting time schedule", "Relocation", "Grandparent / third-party rights"]) ||
      includesAny(answers.paternityIssues, ["Parenting time", "Legal decision-making", "Child support"]);

    const supportFlag =
      answers.issuePathway === "Child Support" ||
      answers.issuePathway === "Spousal Maintenance" ||
      includesAny(answers.divorceIssues, ["Child support", "Spousal maintenance"]) ||
      includesAny(answers.paternityIssues, ["Child support"]);

    const propertyFlag =
      includesAny(answers.divorceIssues, ["Property/debt division", "Real estate / home"]) ||
      includesAny(answers.scopeItems, ["Business entity division", "Commercial property division", "QDRO or supplemental retirement division order"]);

    return {
      urgencyFlag,
      safetyFlag,
      hardScopeReviewFlag,
      softScopeReviewFlag,
      scopeReviewFlag,
      referralFlag,
      childrenFlag,
      supportFlag,
      propertyFlag
    };
  }

  function priority(flagState) {
    if (flagState.referralFlag || flagState.safetyFlag || flagState.urgencyFlag) return "RED";
    if (flagState.hardScopeReviewFlag || flagState.softScopeReviewFlag) return "YELLOW";
    if (
      ["Document review", "Prepare and file documents", "Mediation or settlement preparation"].includes(ans("serviceInterest")) ||
      ans("agreementStatus") === "Yes, mostly agreed"
    ) {
      return "GOLD";
    }
    if (ans("fullName") && ans("opposingParty")) return "BLUE";
    return "GREEN";
  }

  function recommendedPath(flagState) {
    if (ans("immediateSafetyConcern") === "Yes") return "Immediate safety review / emergency resources notice";
    if (flagState.referralFlag && (flagState.urgencyFlag || flagState.safetyFlag)) return "Urgent referral / attorney-network review";
    if (flagState.safetyFlag) return "Urgent safety and scope review";
    if (flagState.referralFlag) return "Referral / professional-network review";
    if (flagState.urgencyFlag) return "Urgent consultation review";
    if (flagState.hardScopeReviewFlag) return "Scope review / possible referral review";
    if (flagState.softScopeReviewFlag) return "Scope clarification consultation";
    if (ans("serviceInterest") === "Quick question / limited guidance") return "$50 Quick Question Consultation";
    if (ans("serviceInterest") === "Document review") return "Document Review";
    if (ans("serviceInterest") === "Prepare and file documents") return "Document Preparation / Filing Review";
    if (ans("serviceInterest") === "Mediation or settlement preparation" || state.issuePathway === "Mediation / ADR / Settlement Help") return "Mediation / Settlement Preparation";
    if (state.issuePathway === "Modification of Existing Orders") return "Modification Package Review";
    if (state.issuePathway === "Enforcement of Existing Orders") return "Enforcement Package Review";
    if (ans("agreementStatus") === "Yes, mostly agreed") return "Uncontested / Agreement Path Review";
    return "Full Consultation Review";
  }

  function internalTags(flagState, priorityValue) {
    const tags = [];

    if (flagState.urgencyFlag) tags.push("URGENT");
    if (flagState.safetyFlag) tags.push("SAFETY");
    if (flagState.hardScopeReviewFlag) tags.push("SCOPE_REVIEW_HARD");
    if (flagState.softScopeReviewFlag) tags.push("SCOPE_REVIEW_UNSURE");
    if (flagState.referralFlag) tags.push("REFERRAL");
    if (flagState.childrenFlag) tags.push("CHILDREN");
    if (flagState.supportFlag) tags.push("SUPPORT");
    if (flagState.propertyFlag) tags.push("PROPERTY");

    tags.push(`PRIORITY_${priorityValue}`);

    return tags;
  }

  function vapiEligible(flagState, priorityValue) {
    return (
      priorityValue === "RED" ||
      ans("urgencySelection") === "ASAP" ||
      flagState.safetyFlag ||
      ans("immediateSafetyConcern") === "Yes" ||
      ans("preferredContactMethod") === "Phone"
    );
  }

  function shortSummary(recommended) {
    return `${ans("fullName") || "New intake"} — ${state.issuePathway || "No issue selected"} — ${recommended}`;
  }

  function internalSummary(flagState, priorityValue, recommended, tags, eligible) {
    const lines = [];

    function add(label, value) {
      lines.push(`${label}: ${Array.isArray(value) ? value.join(", ") : value || ""}`);
    }

    lines.push("CLIENT:");
    add("Name", ans("fullName"));
    add("Preferred name", ans("preferredName"));
    add("Phone", ans("phone"));
    add("Email", ans("email"));
    add("City", ans("city"));
    add("County", ans("county"));
    add("Preferred contact", ans("preferredContactMethod"));
    add("Best time", ans("bestTimeToContact"));

    lines.push("\nCONFLICT CHECK:");
    add("Opposing party", ans("opposingParty"));
    add("Opposing party other names", ans("opposingPartyOtherNames"));
    add("Opposing attorney", ans("opposingAttorney"));
    add("Other involved adults", ans("otherInvolvedAdults"));

    lines.push("\nMATTER:");
    add("Issue pathway", state.issuePathway);
    add("Primary help needed", ans("primaryHelpNeeded"));
    add("Help for", ans("helpFor"));
    add("Urgency", ans("urgencySelection"));
    add("Involved type", ans("involvedType"));
    add("Summary", ans("summary"));

    lines.push("\nPATHWAY DETAILS:");
    Object.keys(state.answers).sort().forEach((key) => {
      if (["website", "consentNoRelationship", "consentLPScope"].includes(key)) return;

      const value = state.answers[key];
      if (Array.isArray(value) ? value.length : String(value || "").trim()) {
        add(key, value);
      }
    });

    lines.push("\nROUTING:");
    add("Priority", priorityValue);
    add("Recommended next step", recommended);
    add("Tags", tags);
    add("Urgent", String(flagState.urgencyFlag));
    add("Safety", String(flagState.safetyFlag));
    add("Hard scope review", String(flagState.hardScopeReviewFlag));
    add("Soft scope review", String(flagState.softScopeReviewFlag));
    add("Scope review", String(flagState.scopeReviewFlag));
    add("Referral", String(flagState.referralFlag));
    add("Vapi eligible", String(eligible));

    return lines.join("\n");
  }

  function payload() {
    const flagState = flags();
    const priorityValue = priority(flagState);
    const recommended = recommendedPath(flagState);
    const tags = internalTags(flagState, priorityValue);
    const eligible = vapiEligible(flagState, priorityValue);
    const submittedAt = new Date().toISOString();

    const row = {
      timestamp: submittedAt,
      submittedAt: submittedAt,
      source: CONFIG.source,
      version: CONFIG.version,
      mode: CONFIG.mode,
      submissionId: state.submissionId,
      intakeId: state.intakeId,
      submitAttemptCount: state.submitAttemptCount,

      validationSource: CONFIG.source,
      validationVersion: CONFIG.version,
      validationMode: CONFIG.mode,
      validationRootId: CONFIG.expectedRootId,
      origin: window.location.origin,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,

      priority: priorityValue,
      recommendedPath: recommended,
      recommendedNextStep: recommended,
      internalTags: tags.join(", "),

      urgentFlag: flagState.urgencyFlag,
      urgencyFlag: flagState.urgencyFlag,
      safetyFlag: flagState.safetyFlag,
      hardScopeReviewFlag: flagState.hardScopeReviewFlag,
      softScopeReviewFlag: flagState.softScopeReviewFlag,
      scopeReviewFlag: flagState.scopeReviewFlag,
      scopeFlag: flagState.scopeReviewFlag,
      referralFlag: flagState.referralFlag,

      vapiEligible: eligible,
      vapiTriggered: false,
      vapiStatus: "Not Triggered",

      status: "New",
      assignedTo: "Jeremy",
      nextAction: "Review intake",
      lastContactedAt: "",
      consultationStatus: "Not Scheduled",
      conflictStatus: "Pending",
      scopeDecision: flagState.referralFlag ? "Referral Review" : flagState.scopeReviewFlag ? "Scope Review Needed" : "Pending",

      fullName: ans("fullName"),
      preferredName: ans("preferredName"),
      phone: ans("phone"),
      email: ans("email"),
      city: ans("city"),
      county: ans("county"),
      preferredContactMethod: ans("preferredContactMethod"),
      bestTimeToContact: ans("bestTimeToContact"),
      howDidYouHearAboutUs: ans("howDidYouHearAboutUs"),

      helpFor: ans("helpFor"),
      legalIssue: state.issuePathway,
      matterCategory: state.issuePathway,
      issuePathway: state.issuePathway,
      primaryHelpNeeded: ans("primaryHelpNeeded"),
      urgencySelection: ans("urgencySelection"),
      involvedType: ans("involvedType"),
      matterDescription: ans("summary"),
      summary: ans("summary"),

      caseStage: ans("caseStage"),
      servedStatus: ans("servedStatus"),
      urgentDeadline: ans("urgentDeadline"),
      courtDate: ans("courtDate"),
      immediateSafetyConcern: ans("immediateSafetyConcern"),
      protectiveOrderStatus: ans("protectiveOrderStatus"),
      protectiveOrderHearingDate: ans("protectiveOrderHearingDate"),
      filingDeadline: ans("filingDeadline"),

      opposingParty: ans("opposingParty"),
      opposingPartyOtherNames: ans("opposingPartyOtherNames"),
      opposingAttorney: ans("opposingAttorney"),
      otherInvolvedAdults: ans("otherInvolvedAdults"),

      childrenInvolved: ans("childrenInvolved"),
      scopeItems: arr("scopeItems").join(", "),
      documentsAvailable: arr("documentsAvailable").join(", "),
      desiredOutcome: ans("desiredOutcome"),
      serviceInterest: ans("serviceInterest"),
      preferredServiceType: ans("serviceInterest"),
      budgetOrPaymentConcern: ans("budgetOrPaymentConcern"),
      budgetPreference: ans("budgetOrPaymentConcern"),

      consentToContact: true,
      consentNoRelationship: !!ans("consentNoRelationship"),
      consentLPScope: !!ans("consentLPScope"),

      shortSummary: shortSummary(recommended),
      notes: "",
      website: ans("website"),

      config: {
        version: CONFIG.version,
        mode: CONFIG.mode,
        targetSheet: CONFIG.sheetName,
        targetTab: CONFIG.sheetTab,
        notificationEmail: CONFIG.notificationEmail
      },

      requiredForN8nValidation: {
        source: CONFIG.source,
        version: CONFIG.version,
        honeypotEmpty: !ans("website"),
        hasFullName: !!ans("fullName"),
        hasPhone: !!ans("phone"),
        hasEmail: !!ans("email"),
        hasOpposingParty: !!ans("opposingParty"),
        consentNoRelationship: !!ans("consentNoRelationship"),
        consentLPScope: !!ans("consentLPScope")
      },

      allAnswers: { ...state.answers }
    };

    row.internalSummary = internalSummary(flagState, priorityValue, recommended, tags, eligible);
    row.fullPayloadJSON = JSON.stringify(row);
    row.rawJSON = row.fullPayloadJSON;

    return row;
  }

  async function submit() {
    if (state.submitting || state.step === 6) return;
    if (!validate()) return;

    if (ans("website")) {
      showError("Submission could not be completed. Please refresh and try again.");
      return;
    }

    state.submitAttemptCount += 1;

    const submissionPayload = payload();

    state.submitting = true;
    render();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(function () {
        controller.abort();
      }, CONFIG.requestTimeoutMs);

      const response = await fetch(CONFIG.n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submissionPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}`);
      }

      state.submittedPayload = submissionPayload;
      state.step = 6;
      state.submitting = false;
      render();
      root()?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("MFLG intake submission error:", error);
      state.submitting = false;
      render();
      showError("There was a problem submitting your intake. Please try again, or call 888-870-6354 if the issue continues.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
