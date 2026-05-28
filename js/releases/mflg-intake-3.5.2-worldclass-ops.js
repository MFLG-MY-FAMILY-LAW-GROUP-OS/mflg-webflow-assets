/* MFLG Intake Final Launch v3.4.0 — Intake UI Polish / Payload Contract Preserved
   File: js/mflg-intake.js
   Architecture: Webflow external JS → n8n webhook → Google Sheets/Gmail/Vapi routing in n8n.

   In accordance with MP v2:
   - Full replacement file
   - Adds safe public route method: window.MFLGIntakeRoute(...)
   - Adds routing-context banner on Step 1
   - Applies stored/external routing context once instead of on every render
   - Allows manual issue-card selections to override routed context
   - Converts selected manual text fields to dropdowns/structured controls
   - Adds repeatable minor-child cards while preserving existing child summary fields
   - Syncs child DOB to age to prevent conflicting DOB/age submissions
   - Adds conservative Arizona city/state residency assist without changing backend field names
   - Adds click-anywhere date input behavior
   - Adds conditional consult-prep questions for jurisdiction, support, parenting, property, maintenance, relocation, safety, documents, and evidence
   - Preserves conditional logic, field names, payload, validation, n8n submission, and Vapi routing flags
   - Preserves locked intake design structure
   - Do not place secrets in this public file
*/

(function () {
  "use strict";

  const CONFIG = {
    version: "3.5.2-worldclass-ops",
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
    routingContext: {
      entrySource: "",
      entryLabel: "",
      issuePathway: "",
      serviceInterest: "",
      contextNote: "",
      routedAt: "",
      userChangedIssue: false
    },
    routeAppliedFromStorage: false,
    consistencyConfirmations: {},
    consistencyReviewVisible: false,
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


  const arizonaCountyOptions = [
    "Maricopa",
    "Pinal",
    "Pima",
    "Yavapai",
    "Coconino",
    "Mohave",
    "Yuma",
    "La Paz",
    "Gila",
    "Navajo",
    "Apache",
    "Greenlee",
    "Graham",
    "Cochise",
    "Santa Cruz",
    "Unknown / Not sure"
  ];

  const bestTimeToContactOptions = [
    "Morning",
    "Midday",
    "Afternoon",
    "Evening",
    "Anytime",
    "Text me first"
  ];

  const howDidYouHearOptions = [
    "Google",
    "Referral",
    "Facebook",
    "Instagram",
    "YouTube",
    "Avvo / Legal Directory",
    "State Bar / Legal Resource",
    "Friend or Family",
    "Returning Client",
    "Other"
  ];

  const childCountOptions = ["1", "2", "3", "4", "5+"];

  const childAgeOptions = [
    "Auto-calculate from DOB",
    "Newborn",
    "Under 1",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18+",
    "Unknown / Not sure"
  ];

  const caseRoleOptions = [
    "Petitioner / filing party",
    "Respondent / responding party",
    "Not filed yet",
    "Not sure"
  ];

  const hearingTypeOptions = [
    "No hearing scheduled",
    "Resolution management conference",
    "Temporary orders hearing",
    "Evidentiary hearing",
    "Trial",
    "Protective order hearing",
    "Mediation / settlement conference",
    "Other / not sure"
  ];

  const yesNoUnsureOptions = ["Yes", "No", "Not sure"];

  const financialDocumentItems = [
    "Recent paystubs",
    "Tax returns / W-2s / 1099s",
    "Health insurance cost proof",
    "Childcare cost proof",
    "Support payment history / arrears records",
    "Bank or retirement statements",
    "Real estate / mortgage documents",
    "Debt statements",
    "None yet",
    "Not sure"
  ];

  const evidenceItems = [
    "Court orders / filed pleadings",
    "Hearing notice / service documents",
    "Text messages / emails",
    "Police reports",
    "DCS / agency records",
    "School or medical records",
    "Photos / screenshots",
    "Witness names",
    "None yet",
    "Not sure"
  ];

  const pathways = {
    "Divorce / Legal Separation": [
      select("caseStage", "Is a case already filed?", ["Not filed yet", "Already filed / active case", "Final decree entered", "I was served", "Not sure"], true),
      select("marriedToOtherParty", "Are you legally married to the other party?", ["Yes", "No", "Not sure"], false),
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

  function textHasAny(value, words) {
    const normalized = String(value || "").toLowerCase();
    return words.some((word) => normalized.includes(word));
  }

  function combinedNarrative() {
    return [
      ans("summary"),
      ans("desiredOutcome"),
      ans("documentSummary"),
      ans("nonComplianceDescription"),
      ans("changeReason"),
      ans("maintenanceNotes"),
      ans("whatResultNeeded"),
      ans("safeContactInstructions"),
      ans("childrenResidenceHistory"),
      ans("currentParentingSchedule"),
      ans("desiredParentingSchedule"),
      ans("parentCommunicationExchangeConcerns"),
      ans("childSchoolDaycareSpecialNeeds")
    ].join(" ");
  }

  function parseLocalDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const dateValue = new Date(year, month - 1, day);

    if (dateValue.getFullYear() !== year || dateValue.getMonth() !== month - 1 || dateValue.getDate() !== day) {
      return null;
    }

    dateValue.setHours(0, 0, 0, 0);
    return dateValue;
  }

  function todayLocal() {
    const dateValue = new Date();
    dateValue.setHours(0, 0, 0, 0);
    return dateValue;
  }

  function daysFromToday(value) {
    const dateValue = parseLocalDate(value);
    if (!dateValue) return null;

    return Math.round((dateValue.getTime() - todayLocal().getTime()) / 86400000);
  }

  function dateBefore(a, b) {
    const first = parseLocalDate(a);
    const second = parseLocalDate(b);
    return !!(first && second && first.getTime() < second.getTime());
  }

  function hasCourtDetailAnswers() {
    return !!(
      ans("caseNumber") ||
      ans("courtDate") ||
      ans("urgentDeadline") ||
      ans("protectiveOrderHearingDate") ||
      ans("filingDeadline") ||
      ans("servedStatus") === "Yes" ||
      !["", "No hearing scheduled"].includes(ans("hearingType")) ||
      ans("temporaryOrdersStatus") === "Yes" ||
      ans("partyRole") === "Petitioner / filing party" ||
      ans("partyRole") === "Respondent / responding party"
    );
  }

  function isNoCaseStage(value) {
    return ["No case filed", "Not filed yet"].includes(value);
  }

  function isActiveCaseStage(value) {
    return ["Active case", "Already filed / active case", "I was served"].includes(value);
  }

  function childIssueSelected() {
    return (
      ["Parenting Time / Legal Decision-Making", "Child Support", "Paternity"].includes(state.issuePathway) ||
      includesAny(arr("divorceIssues"), ["Child support", "Parenting time / legal decision-making"]) ||
      includesAny(arr("parentingIssues"), ["Legal decision-making", "Parenting time schedule", "Modification", "Enforcement", "Relocation", "Supervised parenting time", "Child being withheld", "Grandparent / third-party rights"]) ||
      includesAny(arr("paternityIssues"), ["Parenting time", "Legal decision-making", "Child support"]) ||
      !!ans("childrenAges") ||
      !!ans("childrenCurrentCityState") ||
      !!ans("childHomeStateSixMonths") ||
      !!ans("childrenResidenceHistory") ||
      !!ans("currentParentingSchedule") ||
      !!ans("desiredParentingSchedule") ||
      !!ans("supportAction") ||
      !!ans("relocationDistance")
    );
  }

  function likelyOutsideArizona(value) {
    const normalized = String(value || "").toLowerCase();
    if (/\b(ca|nv|ut|nm|co|tx|or|wa|id|fl|ny)\b/.test(normalized)) {
      return true;
    }

    return textHasAny(normalized, [
      "utah",
      "california",
      "nevada",
      "new mexico",
      "colorado",
      "texas",
      "oregon",
      "washington",
      "idaho",
      "florida",
      "new york"
    ]);
  }

  function consistencyIssue(id, severity, step, fields, title, message, options) {
    const opts = options || {};

    return {
      id,
      severity,
      step,
      fields,
      title,
      message,
      actionLabel: opts.actionLabel || "I confirm this is correct",
      allowContinue: opts.allowContinue !== false,
      requiresConfirmation: opts.requiresConfirmation !== false,
      sort: opts.sort || 50
    };
  }

  function dateConsistencyIssues() {
    const issues = [];
    const dateFields = [
      ["courtDate", "Court/hearing date", 3],
      ["urgentDeadline", "Response deadline", 3],
      ["protectiveOrderHearingDate", "Protective order hearing date", 2],
      ["filingDeadline", "Filing deadline", 2]
    ];

    dateFields.forEach(([key, label, step]) => {
      const value = ans(key);
      const days = daysFromToday(value);
      if (days === null) return;

      if (days < 0 && ["courtDate", "protectiveOrderHearingDate"].includes(key)) {
        issues.push(consistencyIssue(
          `${key}-past-${value}`,
          "clarify",
          step,
          [key],
          "Date may have already passed",
          `The ${label.toLowerCase()} appears to be in the past. Please confirm whether this date already passed or correct the date.`,
          { sort: 18 }
        ));
      } else if (days >= 0 && days <= 2) {
        issues.push(consistencyIssue(
          `${key}-urgent-${value}`,
          "urgent",
          step,
          [key],
          "Very soon deadline or hearing",
          "You entered a court date, hearing, or deadline that appears to be very soon. Our office may not have enough time to review, prepare, or accept the matter through this form. Please call (888) 870-6354 directly. You may continue submitting this intake, but submission does not mean representation has been accepted.",
          { sort: 5 }
        ));
      } else if (days >= 3 && days <= 7) {
        issues.push(consistencyIssue(
          `${key}-soon-${value}`,
          "warning",
          step,
          [key],
          "Short preparation window",
          "This date is within the next week. Please confirm it is correct so our office can review timing and preparation concerns.",
          { sort: 12 }
        ));
      } else if (days >= 8 && days <= 14 && ["courtDate", "urgentDeadline", "protectiveOrderHearingDate"].includes(key)) {
        issues.push(consistencyIssue(
          `${key}-caution-${value}`,
          "info",
          step,
          [key],
          "Upcoming date to review",
          "This date is coming up soon. Our office will review timing, scope, and availability before confirming any services.",
          { requiresConfirmation: false, sort: 30 }
        ));
      }
    });

    if (ans("hasDeadline") === "No" && ans("urgentDeadline")) {
      issues.push(consistencyIssue(
        "deadline-entered-hasdeadline-no",
        "clarify",
        3,
        ["hasDeadline", "urgentDeadline"],
        "Deadline answer may not match",
        "You entered a response deadline, but also indicated there may not be a deadline. Please confirm whether the date is known or estimated.",
        { sort: 20 }
      ));
    }

    if (dateBefore(ans("separationDate"), ans("marriageDate"))) {
      issues.push(consistencyIssue(
        "separation-before-marriage",
        "clarify",
        2,
        ["marriageDate", "separationDate"],
        "Marriage dates may not match",
        "The separation date appears to be before the marriage date. Please correct the date or confirm the closest known dates.",
        { sort: 22 }
      ));
    }

    if (dateBefore(ans("urgentDeadline"), ans("dateServed"))) {
      issues.push(consistencyIssue(
        "response-deadline-before-service",
        "warning",
        3,
        ["dateServed", "urgentDeadline"],
        "Deadline and service date may not match",
        "The response deadline appears to be before the service date. Please correct the dates or confirm whether one of them is estimated.",
        { sort: 9 }
      ));
    }

    if (daysFromToday(ans("dateServed")) !== null && daysFromToday(ans("dateServed")) > 0) {
      issues.push(consistencyIssue(
        "date-served-future",
        "clarify",
        3,
        ["dateServed"],
        "Service date appears to be in the future",
        "The service date appears to be in the future. Please correct it or confirm if this is an expected future service date.",
        { sort: 17 }
      ));
    }

    if (daysFromToday(ans("marriageDate")) !== null && daysFromToday(ans("marriageDate")) > 0) {
      issues.push(consistencyIssue(
        "marriage-date-future",
        "clarify",
        2,
        ["marriageDate"],
        "Marriage date appears to be in the future",
        "The marriage date appears to be in the future. Please correct it or confirm if this is only an approximate planning date.",
        { sort: 24 }
      ));
    }

    for (let index = 1; index <= childCardCount(ans("childrenCount")); index += 1) {
      const dobKey = `child${index}DateOfBirth`;
      const ageKey = `child${index}Age`;
      const dob = ans(dobKey);
      const days = daysFromToday(dob);

      if (days !== null && days > 0) {
        issues.push(consistencyIssue(
          `${dobKey}-future-${dob}`,
          "block",
          2,
          [dobKey],
          "Child date of birth is in the future",
          "The child date of birth appears to be in the future. Please correct the date of birth or clear it before continuing.",
          { allowContinue: false, requiresConfirmation: false, sort: 1 }
        ));
      }

      const calculated = calculatedChildAgeOption(dob);
      const selected = ans(ageKey);
      if (calculated && selected && selected !== calculated) {
        issues.push(consistencyIssue(
          `${ageKey}-mismatch-${dob}-${selected}`,
          "block",
          2,
          [dobKey, ageKey],
          "DOB and age do not match",
          "The date of birth and age do not appear to match. Please correct the date of birth or clear it before selecting an age manually.",
          { allowContinue: false, requiresConfirmation: false, sort: 2 }
        ));
      }
    }

    return issues;
  }

  function getIntakeConsistencyIssues() {
    updateChildDerivedFields();

    const issues = [...dateConsistencyIssues()];
    const narrative = combinedNarrative();
    const safetyWords = ["violence", "threat", "weapon", "stalking", "abuse", "emergency", "danger", "police", "assault", "unsafe", "harass"];
    const scopeWords = ["appeal", "qdro", "adoption", "business", "commercial property", "dependency", "dcs", "termination", "surrogacy", "criminal", "immigration", "bankruptcy", "hague", "tribal"];

    if (ans("immediateSafetyConcern") === "Yes" || ans("protectiveOrderStatus") === "There is a hearing scheduled") {
      issues.push(consistencyIssue(
        "immediate-safety-review",
        "urgent",
        3,
        ["immediateSafetyConcern", "protectiveOrderStatus"],
        "Safety review",
        "If you are in immediate danger, call 911 or local emergency services. This intake is not monitored 24/7. You may still submit the form so our office can review the information during business review.",
        { actionLabel: "I understand and want to continue", sort: 3 }
      ));
    }

    if (ans("immediateSafetyConcern") !== "Yes" && textHasAny(narrative, safetyWords)) {
      issues.push(consistencyIssue(
        "narrative-safety-review",
        "warning",
        3,
        ["summary", "desiredOutcome"],
        "Safety details may need review",
        "Some words in your answers may describe a safety concern. Please confirm whether there is an immediate danger or protective-order issue.",
        { sort: 10 }
      ));
    }

    if (isNoCaseStage(ans("caseStage")) && hasCourtDetailAnswers()) {
      issues.push(consistencyIssue(
        "no-case-with-court-details",
        "clarify",
        3,
        ["caseStage", "caseNumber", "courtDate", "urgentDeadline", "servedStatus", "hearingType"],
        "Court status may not match",
        "You selected that no court case has been filed, but you also entered court, hearing, service, or deadline information. Please confirm whether a court case already exists.",
        { sort: 14 }
      ));
    }

    if (isActiveCaseStage(ans("caseStage")) && !hasCourtDetailAnswers()) {
      issues.push(consistencyIssue(
        "active-case-no-details",
        "info",
        3,
        ["caseStage", "caseNumber", "courtDate", "urgentDeadline"],
        "Active case details help review",
        "You selected that there is an active case. If you know the court county, case number, hearing date, or response deadline, please add it. If you are not sure, you may continue.",
        { requiresConfirmation: false, sort: 35 }
      ));
    }

    if (ans("servedStatus") === "Yes" && !ans("urgentDeadline")) {
      issues.push(consistencyIssue(
        "served-no-deadline",
        "clarify",
        3,
        ["servedStatus", "urgentDeadline"],
        "Service deadline may be missing",
        "You selected that papers were served. If you know the service date or response deadline, please enter it because deadlines may depend on that information. If unsure, you may continue.",
        { sort: 16 }
      ));
    }

    if (ans("servedStatus") === "Yes" && !ans("dateServed")) {
      issues.push(consistencyIssue(
        "served-no-service-date",
        "clarify",
        3,
        ["servedStatus", "dateServed"],
        "Service date may be missing",
        "You selected that papers were served. If you know the date you were served, please enter it because deadlines may depend on that date. If unsure, you may continue.",
        { sort: 16 }
      ));
    }

    if (ans("urgentDeadline") && !ans("knowsResponseDeadline")) {
      issues.push(consistencyIssue(
        "deadline-entered-no-confidence",
        "clarify",
        3,
        ["urgentDeadline", "knowsResponseDeadline"],
        "Deadline source may be missing",
        "You entered a response deadline. Please confirm whether this deadline is from court papers, estimated, or not sure.",
        { sort: 19 }
      ));
    }

    if (ans("childrenInvolved") === "No" && (ans("childrenCount") || childIssueSelected())) {
      issues.push(consistencyIssue(
        "no-children-with-child-details",
        "clarify",
        2,
        ["childrenInvolved", "childrenCount", "childrenAges", "childrenCurrentCityState"],
        "Child-related answers may not match",
        "You selected that no minor children are involved, but some child-related answers were also provided. Please confirm whether minor children are involved.",
        { sort: 15 }
      ));
    }

    if (state.issuePathway === "Divorce / Legal Separation" && ans("marriedToOtherParty") === "No") {
      issues.push(consistencyIssue(
        "divorce-path-never-married",
        "clarify",
        2,
        ["marriedToOtherParty", "issuePathway"],
        "Marriage-related path may not match",
        "You selected a divorce or legal separation matter, but also indicated you may not be legally married to the other party. Please confirm whether divorce/legal separation is the closest issue.",
        { sort: 21 }
      ));
    }

    for (let index = 1; index <= childCardCount(ans("childrenCount")); index += 1) {
      const cityKey = `child${index}CurrentCityState`;
      const livesKey = `child${index}LivesInArizona`;
      const city = ans(cityKey);
      const lives = ans(livesKey);
      const inferredAz = inferArizonaFromCityState(city);

      if (city && lives === "Yes" && likelyOutsideArizona(city)) {
        issues.push(consistencyIssue(
          `${cityKey}-outside-az-lives-yes`,
          "clarify",
          2,
          [cityKey, livesKey],
          "Child location may not match",
          "You entered a child location that may not match the Arizona residency answer. Please confirm the child’s current location and whether the child currently lives in Arizona.",
          { sort: 28 }
        ));
      }

      if (city && lives === "No" && inferredAz === "Yes") {
        issues.push(consistencyIssue(
          `${cityKey}-az-lives-no`,
          "clarify",
          2,
          [cityKey, livesKey],
          "Child location may not match",
          "You entered a child location that may not match the Arizona residency answer. Please confirm the child’s current location and whether the child currently lives in Arizona.",
          { sort: 28 }
        ));
      }

      if (ans(`child${index}Age`) === "18+") {
        issues.push(consistencyIssue(
          `child${index}-adult-age-review`,
          "clarify",
          2,
          [`child${index}Age`],
          "Adult child listed in minor-child section",
          "This section is for minor children. Please confirm whether this child is 18 or older, or correct the age if the child is a minor.",
          { sort: 26 }
        ));
      }
    }

    if (state.issuePathway === "Mediation / ADR / Settlement Help" && ans("bothPartiesWilling") === "No") {
      issues.push(consistencyIssue(
        "adr-not-willing",
        "clarify",
        2,
        ["bothPartiesWilling", "adrType"],
        "Settlement path may need review",
        "You selected mediation or settlement help, but also indicated both parties may not be willing to participate. Please confirm the closest service path.",
        { sort: 32 }
      ));
    }

    if (ans("agreementStatus") === "Yes, mostly agreed" && (
      includesAny(arr("divorceIssues"), ["Temporary orders", "Parenting time / legal decision-making", "Property/debt division", "Real estate / home"]) ||
      includesAny(arr("parentingSafetyConcerns"), ["Domestic violence", "Child abuse or neglect concern", "DCS involvement", "Protective order"])
    )) {
      issues.push(consistencyIssue(
        "agreement-with-contested-issues",
        "clarify",
        2,
        ["agreementStatus", "divorceIssues", "parentingSafetyConcerns"],
        "Agreement status may need review",
        "You selected that the matter is mostly agreed, but some answers may involve contested, safety, or court-review issues. Please confirm the closest description.",
        { sort: 34 }
      ));
    }

    if (["Court appearance / limited-scope representation", "Document review", "Prepare and file documents", "Quick question / limited guidance"].includes(ans("serviceInterest"))) {
      const courtDays = daysFromToday(ans("courtDate"));
      const deadlineDays = daysFromToday(ans("urgentDeadline"));
      const soonest = [courtDays, deadlineDays].filter((value) => value !== null && value >= 0).sort((a, b) => a - b)[0];

      if (soonest !== undefined && soonest <= 7) {
        issues.push(consistencyIssue(
          "limited-service-soon-date",
          "warning",
          4,
          ["serviceInterest", "courtDate", "urgentDeadline"],
          "Service fit and timing review",
          "You selected a lower-scope or limited service option, but your answers may involve an urgent or contested issue. We may need to review whether this is appropriate for limited-scope help.",
          { sort: 13 }
        ));
      }
    }

    if (textHasAny(narrative, scopeWords) || includesAny(arr("scopeItems"), hardScopeReviewItems)) {
      issues.push(consistencyIssue(
        "scope-referral-review",
        "warning",
        4,
        ["scopeItems", "summary", "desiredOutcome"],
        "Scope or referral review",
        "Some issues may require attorney involvement, additional qualifications, or referral coordination. Our office will review whether the matter falls within licensed Legal Paraprofessional scope.",
        { sort: 25 }
      ));
    }

    return issues.sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
  }

  function isConsistencyIssueConfirmed(issue) {
    return !!state.consistencyConfirmations[issue.id];
  }

  function unresolvedConsistencyIssues(options) {
    const opts = options || {};
    return getIntakeConsistencyIssues().filter((issue) => {
      if (opts.upToStep && issue.step > opts.upToStep) return false;
      if (!issue.requiresConfirmation && issue.severity !== "block") return false;
      if (isConsistencyIssueConfirmed(issue)) return false;
      return true;
    });
  }

  function issueStepLabel(step) {
    return {
      1: "Issue",
      2: "Pathway",
      3: "Timing",
      4: "Service Fit",
      5: "Contact"
    }[step] || "Intake";
  }

  function issueSeverityLabel(severity) {
    return {
      info: "Note",
      clarify: "Please confirm",
      warning: "Review",
      urgent: "Urgent",
      block: "Correction needed"
    }[severity] || "Review";
  }

  function consistencyReviewHtml(context) {
    const allIssues = getIntakeConsistencyIssues();
    const visibleIssues = allIssues.filter((issue) => {
      if (context === "final") return issue.step <= 5;
      if (state.consistencyReviewVisible) return issue.step <= state.step;
      if (issue.step !== state.step) return false;
      return issue.severity === "urgent" || issue.severity === "block";
    });

    if (!visibleIssues.length) return "";

    return `
      <div class="mflg-consistency-panel" id="mflg-consistency-panel" data-consistency-panel>
        <div class="mflg-consistency-head">
          <span class="mflg-consistency-kicker">Consistency review</span>
          <h4>Some answers may need a quick review.</h4>
          <p>Please review the item${visibleIssues.length === 1 ? "" : "s"} below. You can correct an answer or confirm it is accurate.</p>
        </div>
        <div class="mflg-consistency-list">
          ${visibleIssues.map((issue) => consistencyIssueHtml(issue)).join("")}
        </div>
      </div>
    `;
  }

  function consistencyIssueHtml(issue) {
    const confirmed = isConsistencyIssueConfirmed(issue);
    const canConfirm = issue.allowContinue && issue.requiresConfirmation && issue.severity !== "block";

    return `
      <div class="mflg-consistency-item is-${esc(issue.severity)} ${confirmed ? "is-confirmed" : ""}">
        <div class="mflg-consistency-meta">
          <span>${esc(issueSeverityLabel(issue.severity))}</span>
          <span>${esc(issueStepLabel(issue.step))}</span>
          ${confirmed ? "<span>Confirmed</span>" : ""}
        </div>
        <strong>${esc(issue.title)}</strong>
        <p>${esc(issue.message)}</p>
        <div class="mflg-consistency-actions">
          <button type="button" class="mflg-mini-btn" data-action="edit-consistency-step" data-step="${issue.step}">Edit answer</button>
          ${canConfirm && !confirmed ? `<button type="button" class="mflg-mini-btn is-primary" data-action="confirm-consistency-issue" data-issue-id="${esc(issue.id)}">${esc(issue.actionLabel)}</button>` : ""}
        </div>
      </div>
    `;
  }

  function consistencyPayloadSummary() {
    const issues = getIntakeConsistencyIssues();
    const confirmed = issues.filter(isConsistencyIssueConfirmed);
    const unresolved = issues.filter((issue) => issue.requiresConfirmation && !isConsistencyIssueConfirmed(issue));

    return {
      reviewVersion: CONFIG.version,
      issueCount: issues.length,
      confirmedIssueIds: confirmed.map((issue) => issue.id),
      unresolvedIssueIds: unresolved.map((issue) => issue.id),
      issues: issues.map((issue) => ({
        id: issue.id,
        severity: issue.severity,
        step: issue.step,
        title: issue.title,
        message: issue.message,
        confirmed: isConsistencyIssueConfirmed(issue)
      }))
    };
  }

  function missingConsultPrepItems(flagState) {
    const missing = [];

    function requireField(key, label) {
      if (!hasAnswer(key)) missing.push(label);
    }

    requireField("opposingParty", "Opposing party name for conflict check");

    if (isActiveCaseStage(ans("caseStage")) || ans("servedStatus") === "Yes" || ans("caseNumber")) {
      requireField("caseNumber", "Case number");
      requireField("partyRole", "Client role in the case");
    }

    if (ans("servedStatus") === "Yes") {
      requireField("dateServed", "Date served");
      requireField("urgentDeadline", "Response deadline");
      requireField("knowsResponseDeadline", "Deadline source or confidence");
    }

    if (flagState.caseDeadlineFlag) {
      requireField("courtDate", "Upcoming court/hearing date, if known");
      requireField("hearingType", "Upcoming hearing type");
    }

    if (flagState.childrenFlag) {
      requireField("childrenCount", "Number of minor children");
      requireField("childrenAges", "Children DOB/age summary");
      requireField("childrenCurrentCityState", "Children current city/state summary");
      requireField("childHomeStateSixMonths", "Child Arizona six-month home-state answer");
    }

    if (flagState.supportFlag) {
      requireField("clientGrossMonthlyIncome", "Client gross monthly income");
      requireField("otherParentGrossMonthlyIncome", "Other parent gross monthly income");
      requireField("parentingDaysEstimate", "Parenting days/overnights estimate");
    }

    if (state.issuePathway === "Divorce / Legal Separation") {
      requireField("marriedToOtherParty", "Marriage status confirmation");
      requireField("arizonaResidency90Days", "Arizona 90-day residency answer");
    }

    if (flagState.propertyFlag) {
      requireField("realEstateInvolved", "Real estate involved answer");
      requireField("retirementAccountsInvolved", "Retirement account answer");
      requireField("debtsInvolved", "Debt answer");
    }

    if (flagState.safetyFlag) {
      requireField("safeContactInstructions", "Safe contact instructions");
      requireField("protectiveOrderStatus", "Protective order status");
    }

    return missing;
  }

  function intakeReadinessScore(flagState, consistencySummary, missingItems) {
    let score = consultPrepCompletenessScore();

    if (ans("fullName") && ans("phone") && ans("email")) score += 8;
    if (ans("opposingParty")) score += 6;
    if (ans("summary")) score += 6;
    if (ans("desiredOutcome")) score += 5;
    if (arr("documentsAvailable").length) score += 5;
    if (arr("evidenceAvailable").length) score += 4;
    if (flagState.supportCalculationReadyFlag) score += 6;

    score -= Math.min(missingItems.length * 4, 32);
    score -= Math.min((consistencySummary.unresolvedIssueIds || []).length * 6, 30);

    if (flagState.safetyFlag || flagState.urgencyFlag) score -= 6;
    if (flagState.hardScopeReviewFlag || flagState.referralFlag) score -= 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function intakeReadinessLevel(score, flagState, consistencySummary) {
    if (flagState.safetyFlag || flagState.urgencyFlag) return "Urgent review";
    if (flagState.hardScopeReviewFlag || flagState.referralFlag) return "Scope/referral review";
    if ((consistencySummary.unresolvedIssueIds || []).length) return "Needs clarification";
    if (score >= 78) return "Consult-ready";
    if (score >= 52) return "Partially ready";
    return "Needs intake follow-up";
  }

  function recommendedStaffAction(flagState, readinessLevel, missingItems) {
    if (flagState.safetyFlag) return "Review safety facts and safe-contact instructions before outreach.";
    if (flagState.urgencyFlag) return "Review deadline/hearing timing and call if appropriate.";
    if (flagState.hardScopeReviewFlag || flagState.referralFlag) return "Review LP scope and referral fit before scheduling.";
    if (readinessLevel === "Needs clarification") return "Review unresolved consistency items before relying on intake facts.";
    if (missingItems.length) return "Collect missing consultation-prep items before or during scheduling.";
    return "Proceed with conflict/scope review and consultation scheduling.";
  }

  function staffConsultPrepBrief(flagState, consistencySummary, readinessScoreValue, readinessLevel, missingItems, recommended) {
    const lines = [];

    function add(label, value) {
      lines.push(`${label}: ${Array.isArray(value) ? value.join(", ") : value || ""}`);
    }

    lines.push("STAFF CONSULTATION PREP:");
    add("Readiness", `${readinessLevel} (${readinessScoreValue}/100)`);
    add("Recommended staff action", recommendedStaffAction(flagState, readinessLevel, missingItems));
    add("Priority", priority(flagState));
    add("Recommended path", recommended);
    add("Issue pathway", state.issuePathway);
    add("Urgency", ans("urgencySelection"));
    add("Court status", ans("caseStage"));
    add("Served status", ans("servedStatus"));
    add("Date served", ans("dateServed"));
    add("Response deadline", ans("urgentDeadline"));
    add("Deadline confidence", ans("knowsResponseDeadline"));
    add("Court date", ans("courtDate"));
    add("Safety concern", ans("immediateSafetyConcern"));
    add("Children", ans("childrenInvolved"));
    add("Children summary", ans("childrenAges"));
    add("Child location summary", ans("childrenCurrentCityState"));
    add("Documents", arr("documentsAvailable"));
    add("Evidence", arr("evidenceAvailable"));
    add("Unresolved consistency items", consistencySummary.unresolvedIssueIds);
    add("Confirmed consistency items", consistencySummary.confirmedIssueIds);
    add("Missing prep items", missingItems);

    return lines.join("\n");
  }

  function validIssuePathway(value) {
    return issueOptions.some((item) => item.value === value);
  }

  function safeJsonParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, String(value || ""));
    } catch (error) {
      /* sessionStorage may be unavailable; intake still works without it */
    }
  }

  function storageRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      /* no-op */
    }
  }

  function emptyRoutingContext() {
    return {
      entrySource: "",
      entryLabel: "",
      issuePathway: "",
      serviceInterest: "",
      contextNote: "",
      routedAt: "",
      userChangedIssue: false
    };
  }

  function normalizeRoutingContext(context) {
    const input = context || {};
    const issue = input.issuePathway || input.issueValue || input.intakeValue || input.routedIssuePathway || "";
    const serviceInterest = input.serviceInterest || input.serviceInterestValue || input.routedServiceInterest || "";

    return {
      entrySource: String(input.entrySource || input.source || "").trim(),
      entryLabel: String(input.entryLabel || input.label || "").trim(),
      issuePathway: validIssuePathway(issue) ? issue : "",
      serviceInterest: String(serviceInterest || "").trim(),
      contextNote: String(input.contextNote || input.context || "").trim(),
      routedAt: input.routedAt || new Date().toISOString(),
      userChangedIssue: !!input.userChangedIssue
    };
  }

  function routingContextHasValue(context) {
    return !!(context && (context.entrySource || context.entryLabel || context.issuePathway || context.serviceInterest || context.contextNote));
  }

  function readRoutingContextFromStorage() {
    const stored = safeJsonParse(storageGet("mflgRouteContext"));

    if (stored && typeof stored === "object") {
      return normalizeRoutingContext(stored);
    }

    const legacyIssue = storageGet("mflgIntakeIssueExact") || storageGet("mflgIntakeIssue");
    const legacyContext = storageGet("mflgIntakeContext");
    const legacyService = storageGet("mflgServiceInterestValue") || storageGet("mflgServiceInterest");
    const legacyLabel = storageGet("mflgEntryLabel");
    const legacySource = storageGet("mflgEntrySource");

    if (!legacyIssue && !legacyContext && !legacyService && !legacyLabel && !legacySource) {
      return emptyRoutingContext();
    }

    return normalizeRoutingContext({
      entrySource: legacySource || "external-route",
      entryLabel: legacyLabel || legacyIssue || legacyService,
      issuePathway: legacyIssue,
      serviceInterest: legacyService,
      contextNote: legacyContext
    });
  }

  function writeRoutingContextToStorage(context) {
    const normalized = normalizeRoutingContext(context);

    if (!routingContextHasValue(normalized)) {
      storageRemove("mflgRouteContext");
      return;
    }

    storageSet("mflgRouteContext", JSON.stringify(normalized));
  }

  function setRoutingAnswerFields(context) {
    const normalized = normalizeRoutingContext(context);

    set("entrySource", normalized.entrySource);
    set("entryLabel", normalized.entryLabel);
    set("contextNote", normalized.contextNote);
    set("routedIssuePathway", normalized.issuePathway);
    set("routedServiceInterest", normalized.serviceInterest);
    set("routingContextJSON", routingContextHasValue(normalized) ? JSON.stringify(normalized) : "");
  }

  function clearRoutingContext() {
    state.routeAppliedFromStorage = true;
    state.routingContext = emptyRoutingContext();
    setRoutingAnswerFields(state.routingContext);
    storageRemove("mflgRouteContext");
    storageRemove("mflgIntakeIssueExact");
    storageRemove("mflgIntakeIssue");
    storageRemove("mflgIntakeContext");
    storageRemove("mflgEntrySource");
    storageRemove("mflgEntryLabel");
    storageRemove("mflgServiceInterest");
    storageRemove("mflgServiceInterestValue");
  }

  function applyRoutingContext(context, options) {
    const normalized = normalizeRoutingContext(context);
    const opts = options || {};
    const hasContext = routingContextHasValue(normalized);

    if (!hasContext) {
      return false;
    }

    state.routeAppliedFromStorage = true;
    state.routingContext = normalized;
    setRoutingAnswerFields(normalized);
    writeRoutingContextToStorage(normalized);

    if (normalized.issuePathway && !opts.preserveExistingIssue) {
      state.issuePathway = normalized.issuePathway;
      set("legalIssue", normalized.issuePathway);
      set("matterCategory", normalized.issuePathway);
      set("issuePathway", normalized.issuePathway);
    }

    if (normalized.serviceInterest) {
      set("serviceInterest", normalized.serviceInterest);
    }

    if (opts.render !== false) {
      render();
    }

    return true;
  }

  function applyStoredRoutingContext() {
    if (state.routeAppliedFromStorage) {
      return;
    }

    state.routeAppliedFromStorage = true;

    const storedContext = readRoutingContextFromStorage();

    if (routingContextHasValue(storedContext)) {
      applyRoutingContext(storedContext, { render: false, fromStorage: true });
    }
  }

  function exposeRoutingApi() {
    window.MFLGIntakeRoute = function (context) {
      return applyRoutingContext(context || {}, { render: true });
    };

    window.MFLGIntakeClearRoute = function () {
      clearRoutingContext();
      render();
      return true;
    };
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
    applyStoredRoutingContext();

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

  function routingBanner() {
    const context = normalizeRoutingContext(state.routingContext);

    if (!routingContextHasValue(context)) {
      return "";
    }

    const label = context.entryLabel || context.issuePathway || context.serviceInterest || "Guided intake";
    const issue = context.issuePathway;
    const service = context.serviceInterest;
    const note = context.contextNote;

    let body = "We used your selection to start this intake pathway. You can change the issue below if something else is closer.";

    if (context.entrySource === "fees") {
      body = "Consultation request started. Choose or confirm the closest legal issue below so we can complete conflict, scope, and next-step review before confirming services.";
    } else if (note) {
      body = note;
    } else if (issue && label && label !== issue) {
      body = `We started with ${esc(issue)} because it is the closest intake pathway for “${esc(label)}.” You can change the issue below if needed.`;
    }

    return `
      <div class="mflg-route-banner" role="status">
        <div class="mflg-route-kicker">Pathway context</div>
        <strong>${esc(label)}</strong>
        <p>${body}</p>
        ${issue ? `<span>Selected issue: ${esc(issue)}</span>` : ""}
        ${service ? `<span>Service interest: ${esc(service)}</span>` : ""}
      </div>
    `;
  }

  function issueStep() {
    return `
      <section class="mflg-screen mflg-issue-screen">
        ${routingBanner()}

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

        ${consistencyReviewHtml("step")}
        ${nav(false, "Next: Pathway")}
      </section>
    `;
  }

  function pathwayStep() {
    const issue = state.issuePathway || ans("issuePathway") || "Not Sure";
    const questions = pathways[issue] || pathways["Not Sure"];
    const hasEmbeddedChildDetails = questions.some((question) => question.key === "childrenAges");
    const shouldShowChildDetails =
      !hasEmbeddedChildDetails &&
      (ans("childrenInvolved") === "Yes" ||
        issue === "Parenting Time / Legal Decision-Making" ||
        issue === "Child Support" ||
        issue === "Paternity");

    return `
      <section class="mflg-screen">
        <h3 class="mflg-title">${icon("document")}${esc(issue)}</h3>
        <p class="mflg-copy">These questions change based on your selected issue so we can identify urgency, scope, and likely next step.</p>

        <div class="mflg-panel">
          <h4 class="mflg-panel-title">Pathway questions</h4>
          ${questions.map(renderQuestion).join("")}
          ${shouldShowChildDetails ? childrenDetailsPanel() : ""}
          ${consultPrepPanel(issue)}
        </div>

        ${["Protective Order Related to Family Law", "Document Preparation / Review", "Mediation / ADR / Settlement Help"].includes(issue) ? `
          <div class="mflg-notice show">Services are subject to Arizona LP scope, conflict review, and formal engagement. Matters outside scope may require attorney involvement or referral coordination.</div>
        ` : ""}

        ${consistencyReviewHtml("step")}
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
            ${selectEl("county", arizonaCountyOptions, true)}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Have you been served?</label>
            ${selectEl("servedStatus", ["Yes", "No", "Not sure"], false)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Date served, if known</label>
            ${dateEl("dateServed")}
            <p class="mflg-help">Leave blank if unknown.</p>
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Response deadline, if known</label>
            ${dateEl("urgentDeadline")}
            <p class="mflg-help">Leave blank if unknown.</p>
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Is the response deadline known or estimated?</label>
            ${selectEl("knowsResponseDeadline", ["Known from court papers", "Estimated", "Not sure"], false)}
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

        ${consistencyReviewHtml("step")}
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
            <label class="mflg-label">Financial/support documents available</label>
            ${checkGrid("financialDocumentsAvailable", financialDocumentItems, "None yet")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Evidence or case materials available</label>
            ${checkGrid("evidenceAvailable", evidenceItems, "None yet")}
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

        ${consistencyReviewHtml("step")}
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
            ${selectEl("bestTimeToContact", bestTimeToContactOptions, false)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">How did you hear about us?</label>
            ${selectEl("howDidYouHearAboutUs", howDidYouHearOptions, false)}
            ${howDidYouHearFollowUp()}
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

        ${consistencyReviewHtml("final")}

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

  function selectElWithValue(key, options, value, required, disabled, extraClass) {
    const selectedValue = value || ans(key);

    return `
      <select class="mflg-select ${extraClass || ""}" data-key="${key}" ${required ? "data-required='true'" : ""} ${disabled ? "disabled aria-disabled='true'" : ""}>
        <option value="">Select one</option>
        ${options.map((option) => `<option value="${esc(option)}" ${selectedValue === option ? "selected" : ""}>${esc(option)}</option>`).join("")}
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
      <div class="mflg-date-wrap" data-date-wrap>
        <input class="mflg-input mflg-date-input" type="date" data-key="${key}" value="${esc(ans(key))}" placeholder="Select date" aria-label="Select date" ${required ? "data-required='true'" : ""}>
      </div>
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

  function howDidYouHearFollowUp() {
    const selected = ans("howDidYouHearAboutUs");

    if (selected !== "Referral" && selected !== "Other") {
      return "";
    }

    const label = selected === "Referral" ? "Who referred you?" : "Please describe";
    const placeholder = selected === "Referral" ? "Referral name or source" : "How you heard about us";

    return `
      <div class="mflg-field">
        <label class="mflg-label">${label}</label>
        ${inputEl("howDidYouHearAboutUsDetail", placeholder)}
      </div>
    `;
  }

  function composedHowDidYouHear() {
    const selected = ans("howDidYouHearAboutUs");
    const detail = String(ans("howDidYouHearAboutUsDetail") || "").trim();

    if (!selected) return "";
    if ((selected === "Referral" || selected === "Other") && detail) {
      return `${selected} — ${detail}`;
    }

    return selected;
  }

  function childrenDetailsPanel() {
    const childrenAnswer = ans("childrenInvolved");

    if (childrenAnswer && childrenAnswer !== "Yes") {
      return "";
    }

    const count = ans("childrenCount") || "";
    const cardsToShow = childCardCount(count);

    return `
      <div class="mflg-panel mflg-children-panel">
        <h4 class="mflg-panel-title">Minor children details</h4>
        <p class="mflg-help">Enter date of birth where available. Age will be calculated from DOB when possible. If you are not sure, use the age dropdown.</p>

        <div class="mflg-field">
          <label class="mflg-label">How many minor children are involved?</label>
          ${selectEl("childrenCount", childCountOptions, childrenAnswer === "Yes")}
        </div>

        ${cardsToShow ? Array.from({ length: cardsToShow }, (_, index) => childDetailCard(index + 1)).join("") : ""}

        ${count === "5+" ? `
          <div class="mflg-field">
            <label class="mflg-label">Additional children details</label>
            ${textareaEl("childrenAdditionalDetails", "For additional children, list initials, DOB/age if known, current city/state, and whether they live in Arizona.", false)}
          </div>
        ` : ""}

        <p class="mflg-help">This section preserves the existing backend fields by summarizing child DOB/age details into childrenAges and child location details into childrenCurrentCityState.</p>
      </div>
    `;
  }

  function consultPrepPanel(issue) {
    const childMatter =
      ans("childrenInvolved") === "Yes" ||
      ["Parenting Time / Legal Decision-Making", "Child Support", "Paternity"].includes(issue) ||
      includesAny(arr("divorceIssues"), ["Child support", "Parenting time / legal decision-making"]) ||
      includesAny(arr("paternityIssues"), ["Parenting time", "Legal decision-making", "Child support"]);

    const supportMatter =
      issue === "Child Support" ||
      includesAny(arr("divorceIssues"), ["Child support"]) ||
      includesAny(arr("paternityIssues"), ["Child support"]);

    const maintenanceMatter =
      issue === "Spousal Maintenance" ||
      includesAny(arr("divorceIssues"), ["Spousal maintenance"]);

    const propertyMatter =
      issue === "Divorce / Legal Separation" ||
      includesAny(arr("divorceIssues"), ["Property/debt division", "Real estate / home"]);

    const relocationMatter =
      includesAny(arr("parentingIssues"), ["Relocation"]) ||
      includesAny(arr("orderToModify"), ["Relocation"]);

    const safetyMatter =
      issue === "Protective Order Related to Family Law" ||
      ans("immediateSafetyConcern") === "Yes" ||
      includesAny(arr("parentingSafetyConcerns"), ["Domestic violence", "Child abuse or neglect concern", "DCS involvement", "Protective order"]);

    return `
      <div class="mflg-divider">${icon("scales")}</div>

      <div class="mflg-field">
        <h4 class="mflg-panel-title">Consult-prep details</h4>
        <p class="mflg-help">Optional, but helpful for a more prepared consultation. Answer what you know now; unknown is okay.</p>
      </div>

      ${caseLogisticsPrep()}
      ${jurisdictionPrep(issue, childMatter)}
      ${childMatter ? parentingBestInterestPrep() : ""}
      ${supportMatter ? childSupportPrep() : ""}
      ${maintenanceMatter ? spousalMaintenancePrep() : ""}
      ${propertyMatter ? propertyDebtPrep() : ""}
      ${relocationMatter ? relocationPrep() : ""}
      ${safetyMatter ? protectiveOrderSafetyPrep() : ""}
    `;
  }

  function caseLogisticsPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Case number, if already filed</label>
          ${inputEl("caseNumber", "Example: FC2026-000000")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Your role in the case</label>
          ${selectEl("partyRole", caseRoleOptions, false)}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Upcoming hearing type</label>
          ${selectEl("hearingType", hearingTypeOptions, false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Temporary orders already in place?</label>
          ${selectEl("temporaryOrdersStatus", yesNoUnsureOptions, false)}
        </div>
      </div>
    `;
  }

  function jurisdictionPrep(issue, childMatter) {
    if (!childMatter && issue !== "Divorce / Legal Separation") {
      return "";
    }

    return `
      <div class="mflg-grid2">
        ${issue === "Divorce / Legal Separation" ? `
          <div class="mflg-field">
            <label class="mflg-label">Has either spouse lived in Arizona for at least 90 days?</label>
            ${selectEl("arizonaResidency90Days", yesNoUnsureOptions, false)}
          </div>
        ` : ""}

        ${childMatter ? `
          <div class="mflg-field">
            <label class="mflg-label">Have the children lived in Arizona for the last 6 months?</label>
            ${selectEl("childHomeStateSixMonths", yesNoUnsureOptions, false)}
          </div>
        ` : ""}
      </div>

      ${childMatter ? `
        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Any other state, country, or tribal court orders?</label>
            ${selectEl("existingOutOfStateOrders", yesNoUnsureOptions, false)}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Children’s residence history</label>
            ${inputEl("childrenResidenceHistory", "States/cities where children lived recently")}
          </div>
        </div>
      ` : ""}
    `;
  }

  function parentingBestInterestPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Current parenting schedule</label>
          ${inputEl("currentParentingSchedule", "Example: every other weekend, 2-2-3, informal")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Desired parenting schedule</label>
          ${inputEl("desiredParentingSchedule", "What schedule are you hoping for?")}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">School/daycare or special needs</label>
          ${inputEl("childSchoolDaycareSpecialNeeds", "School, daycare, medical, therapy, IEP, etc.")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Communication or exchange concerns?</label>
          ${selectEl("parentCommunicationExchangeConcerns", ["Yes", "No", "Not sure", "Prefer not to say"], false)}
        </div>
      </div>
    `;
  }

  function childSupportPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Your gross monthly income, if known</label>
          ${inputEl("clientGrossMonthlyIncome", "Before taxes; approximate is okay")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Other parent gross monthly income, if known</label>
          ${inputEl("otherParentGrossMonthlyIncome", "Before taxes; approximate or unknown")}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Parenting days / overnights estimate</label>
          ${inputEl("parentingDaysEstimate", "Approximate annual days or current schedule")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">DES/DCSS involved?</label>
          ${selectEl("dcssInvolvement", yesNoUnsureOptions, false)}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Monthly child health insurance cost</label>
          ${inputEl("childHealthInsuranceCost", "Amount paid for child coverage")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Monthly childcare cost</label>
          ${inputEl("childcareCost", "Work-related childcare, if any")}
        </div>
      </div>
    `;
  }

  function spousalMaintenancePrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Marriage date</label>
          ${dateEl("marriageDate")}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Separation date, if any</label>
          ${dateEl("separationDate")}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Employment, health, or training issue?</label>
          ${selectEl("maintenanceEmploymentOrHealthIssue", yesNoUnsureOptions, false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Career sacrifice or childcare limiting work?</label>
          ${selectEl("maintenanceCareerOrChildcareIssue", yesNoUnsureOptions, false)}
        </div>
      </div>
    `;
  }

  function propertyDebtPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Real estate involved?</label>
          ${selectEl("realEstateInvolved", yesNoUnsureOptions, false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Retirement accounts involved?</label>
          ${selectEl("retirementAccountsInvolved", yesNoUnsureOptions, false)}
        </div>
      </div>

      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Significant debts involved?</label>
          ${selectEl("debtsInvolved", yesNoUnsureOptions, false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Separate property, business, or retirement division issue?</label>
          ${selectEl("complexPropertyIssue", ["Yes", "No", "Not sure"], false)}
        </div>
      </div>
    `;
  }

  function relocationPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Relocation distance/type</label>
          ${selectEl("relocationDistance", ["Out of Arizona", "More than 100 miles within Arizona", "Less than 100 miles", "Not sure"], false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Written relocation notice sent or received?</label>
          ${selectEl("relocationNoticeStatus", ["Sent", "Received", "Not yet", "Not sure"], false)}
        </div>
      </div>
    `;
  }

  function protectiveOrderSafetyPrep() {
    return `
      <div class="mflg-grid2">
        <div class="mflg-field">
          <label class="mflg-label">Protective order served?</label>
          ${selectEl("protectiveOrderServed", yesNoUnsureOptions, false)}
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Safe contact instructions</label>
          ${inputEl("safeContactInstructions", "Best/safest way to contact you")}
        </div>
      </div>

      <div class="mflg-field">
        <label class="mflg-label">Address confidentiality or safe-exchange concern?</label>
        ${selectEl("addressConfidentialityOrExchangeConcern", ["Yes", "No", "Not sure", "Prefer not to say"], false)}
      </div>
    `;
  }

  function childCardCount(value) {
    if (value === "5+") return 4;
    const count = parseInt(value, 10);
    return Number.isFinite(count) && count > 0 ? Math.min(count, 4) : 0;
  }

  function childDetailCard(number) {
    const dobKey = `child${number}DateOfBirth`;
    const ageKey = `child${number}Age`;
    const dobValue = ans(dobKey);
    const calculatedRawAge = calculateAgeFromDate(dobValue);
    const calculatedAgeOption = ageToOption(calculatedRawAge);
    const ageLocked = !!calculatedAgeOption;
    const ageHelp = ageLocked
      ? `Age locked from DOB: ${esc(calculatedRawAge)}${calculatedAgeOption !== calculatedRawAge ? ` (${esc(calculatedAgeOption)})` : ""}. Clear DOB to enter age only.`
      : "Choose age only if DOB is unknown or approximate.";

    return `
      <div class="mflg-panel mflg-child-card" data-child-card="${number}">
        <h4 class="mflg-panel-title">Child ${number}</h4>

        <div class="mflg-grid2">
          <div class="mflg-field">
            <label class="mflg-label">Name or initials</label>
            ${inputEl(`child${number}NameOrInitials`, "Optional")}
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Date of birth</label>
            ${dateEl(dobKey)}
          </div>
        </div>

        <div class="mflg-grid2">
          <div class="mflg-field ${ageLocked ? "mflg-field-auto" : ""}">
            <label class="mflg-label">Age</label>
            ${selectElWithValue(ageKey, childAgeOptions, calculatedAgeOption, false, ageLocked, ageLocked ? "is-auto-locked" : "")}
            <p class="mflg-help">${ageHelp}</p>
          </div>

          <div class="mflg-field">
            <label class="mflg-label">Current city/state</label>
            ${inputEl(`child${number}CurrentCityState`, "Example: Phoenix, AZ")}
          </div>
        </div>

        <div class="mflg-field">
          <label class="mflg-label">Does this child currently live in Arizona?</label>
          ${selectEl(`child${number}LivesInArizona`, ["Yes", "No", "Not sure"], false)}
          <p class="mflg-help">This is separate from city/state and helps identify Arizona jurisdiction/residency issues. If city/state clearly shows Arizona and this field is blank or Not sure, the form may auto-select Yes.</p>
        </div>
      </div>
    `;
  }

  function calculateAgeFromDate(value) {
    if (!value) return "";

    const dob = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? String(age) : "";
  }

  function ageToOption(ageValue) {
    if (ageValue === "") return "";

    const numericAge = parseInt(ageValue, 10);
    if (!Number.isFinite(numericAge) || numericAge < 0) return "";
    if (numericAge === 0) return "Under 1";
    if (numericAge >= 18) return "18+";

    return String(numericAge);
  }

  function calculatedChildAgeOption(dobValue) {
    return ageToOption(calculateAgeFromDate(dobValue));
  }

  function inferArizonaFromCityState(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "";

    if (/\b(az|arizona)\b/.test(normalized)) return "Yes";

    const arizonaCities = [
      "phoenix",
      "scottsdale",
      "mesa",
      "tempe",
      "chandler",
      "gilbert",
      "glendale",
      "peoria",
      "surprise",
      "goodyear",
      "avondale",
      "buckeye",
      "queen creek",
      "tucson",
      "flagstaff",
      "prescott",
      "yuma",
      "maricopa",
      "casa grande",
      "apache junction",
      "fountain hills",
      "paradise valley"
    ];

    return arizonaCities.some((city) => normalized.includes(city)) ? "Yes" : "";
  }

  function syncChildAgeFromDob(number) {
    const dobKey = `child${number}DateOfBirth`;
    const ageKey = `child${number}Age`;
    const calculated = calculatedChildAgeOption(ans(dobKey));

    if (calculated) {
      set(ageKey, calculated);
    }
  }

  function updateChildAgeField(number) {
    const dobKey = `child${number}DateOfBirth`;
    const ageKey = `child${number}Age`;
    const dobValue = ans(dobKey);
    const calculatedRawAge = calculateAgeFromDate(dobValue);
    const calculatedAgeOption = ageToOption(calculatedRawAge);
    const ageSelect = root()?.querySelector(`[data-key='${ageKey}']`);

    if (!ageSelect) return;

    const field = ageSelect.closest(".mflg-field");
    const help = field?.querySelector(".mflg-help");
    const ageLocked = !!calculatedAgeOption;

    ageSelect.disabled = ageLocked;
    ageSelect.setAttribute("aria-disabled", ageLocked ? "true" : "false");
    ageSelect.classList.toggle("is-auto-locked", ageLocked);
    field?.classList.toggle("mflg-field-auto", ageLocked);

    if (ageLocked) {
      ageSelect.value = calculatedAgeOption;
    }

    if (help) {
      help.textContent = ageLocked
        ? `Age locked from DOB: ${calculatedRawAge}${calculatedAgeOption !== calculatedRawAge ? ` (${calculatedAgeOption})` : ""}. Clear DOB to enter age only.`
        : "Choose age only if DOB is unknown or approximate.";
    }
  }

  function syncChildResidencyFromCityState(number) {
    const cityKey = `child${number}CurrentCityState`;
    const livesKey = `child${number}LivesInArizona`;
    const inferred = inferArizonaFromCityState(ans(cityKey));
    const current = ans(livesKey);

    if (inferred && (!current || current === "Not sure")) {
      set(livesKey, inferred);
    }
  }

  function syncChildrenDerivedInput(key) {
    const dobMatch = /^child(\d+)DateOfBirth$/.exec(key);
    const cityMatch = /^child(\d+)CurrentCityState$/.exec(key);
    const livesMatch = /^child(\d+)LivesInArizona$/.exec(key);

    if (dobMatch) {
      syncChildAgeFromDob(dobMatch[1]);
    }

    if (cityMatch) {
      syncChildResidencyFromCityState(cityMatch[1]);
    }

    if (livesMatch && ans(key) === "No" && !ans("childrenLivedOutsideAZ5Years")) {
      set("childrenLivedOutsideAZ5Years", "Yes");
    }
  }

  function updateChildDerivedFields() {
    const countValue = ans("childrenCount");
    const count = childCardCount(countValue);
    const ageLines = [];
    const locationLines = [];

    for (let index = 1; index <= count; index += 1) {
      syncChildAgeFromDob(index);
      syncChildResidencyFromCityState(index);

      const name = ans(`child${index}NameOrInitials`) || `Child ${index}`;
      const dob = ans(`child${index}DateOfBirth`);
      const calculatedAge = calculateAgeFromDate(dob);
      const selectedAge = ans(`child${index}Age`);
      const age = calculatedAge || (selectedAge && selectedAge !== "Auto-calculate from DOB" ? selectedAge : "");
      const cityState = ans(`child${index}CurrentCityState`);
      const livesInArizona = ans(`child${index}LivesInArizona`);

      ageLines.push(`${name}: ${dob ? `DOB ${dob}` : "DOB not provided"}${age ? `, age ${age}` : ""}`);
      locationLines.push(`${name}: ${cityState || "city/state not provided"}${livesInArizona ? `, lives in Arizona: ${livesInArizona}` : ""}`);
    }

    if (countValue === "5+" && ans("childrenAdditionalDetails")) {
      ageLines.push(`Additional children: ${ans("childrenAdditionalDetails")}`);
      locationLines.push(`Additional children: ${ans("childrenAdditionalDetails")}`);
    }

    if (ageLines.length) {
      set("childrenAges", ageLines.join(" | "));
    }

    if (locationLines.length) {
      set("childrenCurrentCityState", locationLines.join(" | "));
    }
  }

  function focusDatePicker(input) {
    if (!input) return;

    try {
      input.focus({ preventScroll: true });
    } catch (error) {
      input.focus();
    }

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch (error) {
        /* Browser may block showPicker outside direct user activation. Focus still helps. */
      }
    }
  }

  function renderQuestion(question) {
    if (question.key === "childrenAges") {
      return childrenDetailsPanel();
    }

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

    function resetConsistencyAfterEdit() {
      state.consistencyConfirmations = {};
      state.consistencyReviewVisible = false;
    }

    mount.querySelectorAll("[data-option-group]").forEach((element) => {
      element.addEventListener("click", function () {
        const group = element.getAttribute("data-option-group");
        const value = element.getAttribute("data-option-value");

        resetConsistencyAfterEdit();

        if (group === "issuePathway") {
          const prior = state.issuePathway;

          state.issuePathway = value;
          set("legalIssue", value);
          set("matterCategory", value);
          set("issuePathway", value);

          if (prior && prior !== value && routingContextHasValue(state.routingContext)) {
            state.routingContext = {
              ...state.routingContext,
              issuePathway: value,
              userChangedIssue: true,
              contextNote: `You changed the selected issue to ${value}. Continue with this pathway, or choose a different issue below if needed.`
            };

            setRoutingAnswerFields(state.routingContext);
            writeRoutingContextToStorage(state.routingContext);
          }
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

    mount.querySelectorAll("[data-date-wrap]").forEach((wrapper) => {
      wrapper.addEventListener("click", function () {
        focusDatePicker(wrapper.querySelector("input[type='date']"));
      });
    });

    mount.querySelectorAll(".mflg-date-input").forEach((input) => {
      input.addEventListener("click", function () {
        focusDatePicker(input);
      });
      input.addEventListener("focus", function () {
        focusDatePicker(input);
      });
    });

    mount.querySelectorAll("[data-check-key]").forEach((element) => {
      element.addEventListener("change", function () {
        const key = element.getAttribute("data-check-key");
        const exclusive = element.closest("[data-exclusive-none]")?.getAttribute("data-exclusive-none") || "";
        setMulti(key, element.value, element.checked, exclusive);
        resetConsistencyAfterEdit();
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

    mount.querySelectorAll("[data-action='confirm-consistency-issue']").forEach((button) => {
      button.addEventListener("click", function () {
        const issueId = button.getAttribute("data-issue-id");
        if (issueId) {
          state.consistencyConfirmations[issueId] = new Date().toISOString();
        }
        state.consistencyReviewVisible = true;
        render();
        document.getElementById("mflg-consistency-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    mount.querySelectorAll("[data-action='edit-consistency-step']").forEach((button) => {
      button.addEventListener("click", function () {
        const step = parseInt(button.getAttribute("data-step"), 10);
        if (Number.isFinite(step)) {
          state.step = Math.min(5, Math.max(1, step));
          state.consistencyReviewVisible = true;
          render();
          root()?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function updateFromInput(event) {
    const element = event.target;
    const key = element.getAttribute("data-key");
    if (!key) return;

    set(key, element.type === "checkbox" ? element.checked : element.value);
    state.consistencyConfirmations = {};
    state.consistencyReviewVisible = false;
    syncChildrenDerivedInput(key);
    updateChildDerivedFields();
    updateCounter();

    const dobMatch = /^child(\d+)DateOfBirth$/.exec(key);
    if (dobMatch) {
      updateChildAgeField(dobMatch[1]);
    }

    if (
      key === "childrenInvolved" ||
      key === "childrenCount" ||
      key === "howDidYouHearAboutUs" ||
      key === "servedStatus" ||
      /^child\d+LivesInArizona$/.test(key)
    ) {
      render();
    }
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
      return false;
    }

    const unresolved = unresolvedConsistencyIssues({ upToStep: state.step });
    if (unresolved.length) {
      state.consistencyReviewVisible = true;
      render();
      const hasBlock = unresolved.some((issue) => issue.severity === "block" || issue.allowContinue === false);
      showError(hasBlock ? "Please correct the highlighted consistency item before continuing." : "Please review and confirm the consistency item before continuing.");
      document.getElementById("mflg-consistency-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    state.consistencyReviewVisible = false;
    return true;
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

  function hasAnswer(key) {
    const value = state.answers[key];
    return Array.isArray(value) ? value.length > 0 : String(value || "").trim() !== "";
  }

  function consultPrepCompletenessScore() {
    const keys = [
      "caseNumber",
      "partyRole",
      "hearingType",
      "temporaryOrdersStatus",
      "arizonaResidency90Days",
      "childHomeStateSixMonths",
      "existingOutOfStateOrders",
      "childrenResidenceHistory",
      "currentParentingSchedule",
      "desiredParentingSchedule",
      "clientGrossMonthlyIncome",
      "otherParentGrossMonthlyIncome",
      "parentingDaysEstimate",
      "childHealthInsuranceCost",
      "childcareCost",
      "dcssInvolvement",
      "marriageDate",
      "separationDate",
      "maintenanceEmploymentOrHealthIssue",
      "maintenanceCareerOrChildcareIssue",
      "realEstateInvolved",
      "retirementAccountsInvolved",
      "debtsInvolved",
      "complexPropertyIssue",
      "relocationDistance",
      "relocationNoticeStatus",
      "protectiveOrderServed",
      "safeContactInstructions",
      "addressConfidentialityOrExchangeConcern",
      "financialDocumentsAvailable",
      "evidenceAvailable"
    ];

    const answered = keys.filter(hasAnswer).length;
    return Math.round((answered / keys.length) * 100);
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

    const jurisdictionReviewFlag =
      ["No", "Not sure"].includes(answers.arizonaResidency90Days) ||
      ["No", "Not sure"].includes(answers.childHomeStateSixMonths) ||
      answers.childrenLivedOutsideAZ5Years === "Yes" ||
      answers.existingOutOfStateOrders === "Yes" ||
      answers.otherJurisdictionOrders === "Yes";

    const caseDeadlineFlag =
      answers.servedStatus === "Yes" ||
      answers.caseStage === "I was served" ||
      !!String(answers.urgentDeadline || "").trim() ||
      !!String(answers.courtDate || "").trim() ||
      !!String(answers.protectiveOrderHearingDate || "").trim() ||
      !["", "No hearing scheduled"].includes(answers.hearingType || "");

    const supportCalculationReadyFlag =
      !!String(answers.clientGrossMonthlyIncome || "").trim() &&
      !!String(answers.otherParentGrossMonthlyIncome || "").trim() &&
      !!String(answers.parentingDaysEstimate || "").trim();

    const adultChildAgeFlag =
      Object.keys(answers).some((key) => /^child\d+Age$/.test(key) && answers[key] === "18+");

    return {
      urgencyFlag,
      safetyFlag,
      hardScopeReviewFlag,
      softScopeReviewFlag,
      scopeReviewFlag,
      referralFlag,
      childrenFlag,
      supportFlag,
      propertyFlag,
      jurisdictionReviewFlag,
      caseDeadlineFlag,
      supportCalculationReadyFlag,
      adultChildAgeFlag
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
    if (flagState.jurisdictionReviewFlag) tags.push("JURISDICTION_REVIEW");
    if (flagState.caseDeadlineFlag) tags.push("CASE_DEADLINE");
    if (flagState.supportCalculationReadyFlag) tags.push("SUPPORT_CALC_READY");
    if (flagState.adultChildAgeFlag) tags.push("ADULT_CHILD_AGE_REVIEW");

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
    add("How heard", composedHowDidYouHear());

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
    add("Children involved", ans("childrenInvolved"));
    add("Children count", ans("childrenCount"));
    add("Children ages/DOB summary", ans("childrenAges"));
    add("Children location summary", ans("childrenCurrentCityState"));

    lines.push("\nCONSULT PREP:");
    add("Case number", ans("caseNumber"));
    add("Party role", ans("partyRole"));
    add("Hearing type", ans("hearingType"));
    add("Temporary orders", ans("temporaryOrdersStatus"));
    add("AZ residency 90 days", ans("arizonaResidency90Days"));
    add("Child home state 6 months", ans("childHomeStateSixMonths"));
    add("Out-of-state/tribal orders", ans("existingOutOfStateOrders") || ans("otherJurisdictionOrders"));
    add("Children residence history", ans("childrenResidenceHistory"));
    add("Current parenting schedule", ans("currentParentingSchedule"));
    add("Desired parenting schedule", ans("desiredParentingSchedule"));
    add("Support income client", ans("clientGrossMonthlyIncome"));
    add("Support income other parent", ans("otherParentGrossMonthlyIncome"));
    add("Parenting days estimate", ans("parentingDaysEstimate"));
    add("Health insurance cost", ans("childHealthInsuranceCost"));
    add("Childcare cost", ans("childcareCost"));
    add("DES/DCSS", ans("dcssInvolvement"));
    add("Marriage date", ans("marriageDate"));
    add("Separation date", ans("separationDate"));
    add("Real estate", ans("realEstateInvolved"));
    add("Retirement accounts", ans("retirementAccountsInvolved"));
    add("Debts", ans("debtsInvolved"));
    add("Complex property issue", ans("complexPropertyIssue"));
    add("Relocation distance", ans("relocationDistance"));
    add("Relocation notice", ans("relocationNoticeStatus"));
    add("Protective order served", ans("protectiveOrderServed"));
    add("Safe contact", ans("safeContactInstructions"));
    add("Address/exchange safety", ans("addressConfidentialityOrExchangeConcern"));
    add("Financial docs", arr("financialDocumentsAvailable"));
    add("Evidence/materials", arr("evidenceAvailable"));
    add("Consult-prep completeness", `${consultPrepCompletenessScore()}%`);

    lines.push("\nROUTING CONTEXT:");
    add("Entry source", ans("entrySource"));
    add("Entry label", ans("entryLabel"));
    add("Context note", ans("contextNote"));
    add("Routed issue pathway", ans("routedIssuePathway"));
    add("Routed service interest", ans("routedServiceInterest"));
    add("User changed issue", String(state.routingContext.userChangedIssue));

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
    add("Jurisdiction review", String(flagState.jurisdictionReviewFlag));
    add("Case/deadline", String(flagState.caseDeadlineFlag));
    add("Support calc ready", String(flagState.supportCalculationReadyFlag));
    add("Adult child age review", String(flagState.adultChildAgeFlag));
    add("Vapi eligible", String(eligible));

    const consistencySummary = consistencyPayloadSummary();
    const missingItems = missingConsultPrepItems(flagState);
    const readinessScoreValue = intakeReadinessScore(flagState, consistencySummary, missingItems);
    const readinessLevel = intakeReadinessLevel(readinessScoreValue, flagState, consistencySummary);

    lines.push("\nWORLD-CLASS REVIEW:");
    add("Intake readiness", `${readinessLevel} (${readinessScoreValue}/100)`);
    add("Recommended staff action", recommendedStaffAction(flagState, readinessLevel, missingItems));
    add("Missing consult-prep items", missingItems);
    add("Consistency issue count", String(consistencySummary.issueCount));
    add("Unresolved consistency issues", consistencySummary.unresolvedIssueIds);
    add("Confirmed consistency issues", consistencySummary.confirmedIssueIds);

    return lines.join("\n");
  }

  function payload() {
    updateChildDerivedFields();

    const flagState = flags();
    const priorityValue = priority(flagState);
    const recommended = recommendedPath(flagState);
    const tags = internalTags(flagState, priorityValue);
    const eligible = vapiEligible(flagState, priorityValue);
    const submittedAt = new Date().toISOString();
    const route = normalizeRoutingContext(state.routingContext);
    const howHeard = composedHowDidYouHear();
    const consistencySummary = consistencyPayloadSummary();
    const missingItems = missingConsultPrepItems(flagState);
    const readinessScoreValue = intakeReadinessScore(flagState, consistencySummary, missingItems);
    const readinessLevel = intakeReadinessLevel(readinessScoreValue, flagState, consistencySummary);
    const staffPrepBrief = staffConsultPrepBrief(flagState, consistencySummary, readinessScoreValue, readinessLevel, missingItems, recommended);

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
      jurisdictionReviewFlag: flagState.jurisdictionReviewFlag,
      caseDeadlineFlag: flagState.caseDeadlineFlag,
      supportCalculationReadyFlag: flagState.supportCalculationReadyFlag,
      adultChildAgeFlag: flagState.adultChildAgeFlag,
      consultPrepCompletenessScore: consultPrepCompletenessScore(),
      intakeReadinessScore: readinessScoreValue,
      intakeReadinessLevel: readinessLevel,
      missingConsultPrepItems: missingItems.join(", "),
      missingConsultPrepItemsJSON: JSON.stringify(missingItems),
      consistencyIssueCount: consistencySummary.issueCount,
      unresolvedConsistencyIssueIds: consistencySummary.unresolvedIssueIds.join(", "),
      confirmedConsistencyIssueIds: consistencySummary.confirmedIssueIds.join(", "),
      staffPrepBrief: staffPrepBrief,

      vapiEligible: eligible,
      vapiTriggered: false,
      vapiStatus: "Not Triggered",

      leadStage: "New Intake",
      status: "New",
      assignedTo: "Jeremy",
      nextAction: "Review intake",
      lastContactedAt: "",
      followUpDate: "",
      consultationStatus: "Not Scheduled",
      consultationDate: "",
      paymentStatus: "Not Requested",
      engagementStatus: "Not Sent",
      conflictCheckStatus: "Pending",
      conflictCheckDate: "",
      conflictCheckNotes: "",
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
      howDidYouHearAboutUs: howHeard,

      helpFor: ans("helpFor"),
      legalIssue: state.issuePathway,
      matterCategory: state.issuePathway,
      issuePathway: state.issuePathway,
      primaryHelpNeeded: ans("primaryHelpNeeded"),
      urgencySelection: ans("urgencySelection"),
      involvedType: ans("involvedType"),
      matterDescription: ans("summary"),
      summary: ans("summary"),

      entrySource: route.entrySource,
      entryLabel: route.entryLabel,
      contextNote: route.contextNote,
      routedIssuePathway: route.issuePathway,
      routedServiceInterest: route.serviceInterest,
      routingContextJSON: routingContextHasValue(route) ? JSON.stringify(route) : "",
      userChangedRoutedIssue: !!route.userChangedIssue,

      caseStage: ans("caseStage"),
      courtStatus: ans("caseStage"),
      courtCounty: ans("courtCounty") || ans("county"),
      caseNumber: ans("caseNumber"),
      partyRole: ans("partyRole"),
      hearingType: ans("hearingType"),
      temporaryOrdersStatus: ans("temporaryOrdersStatus"),
      servedStatus: ans("servedStatus"),
      dateServed: ans("dateServed"),
      knowsResponseDeadline: ans("knowsResponseDeadline"),
      knownResponseDeadline: ans("knowsResponseDeadline"),
      urgentDeadline: ans("urgentDeadline"),
      responseDeadline: ans("urgentDeadline"),
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
      minorChildrenInvolved: ans("childrenInvolved"),
      childrenMinorConfirm: ans("childrenInvolved"),
      childrenCount: ans("childrenCount"),
      childrenAges: ans("childrenAges"),
      childrenCurrentCityState: ans("childrenCurrentCityState"),
      childrenLivedOutsideAZ5Years: ans("childrenLivedOutsideAZ5Years"),
      arizonaResidency90Days: ans("arizonaResidency90Days"),
      childHomeStateSixMonths: ans("childHomeStateSixMonths"),
      existingOutOfStateOrders: ans("existingOutOfStateOrders") || ans("otherJurisdictionOrders"),
      childrenResidenceHistory: ans("childrenResidenceHistory"),
      currentParentingSchedule: ans("currentParentingSchedule"),
      desiredParentingSchedule: ans("desiredParentingSchedule"),
      childSchoolDaycareSpecialNeeds: ans("childSchoolDaycareSpecialNeeds"),
      parentCommunicationExchangeConcerns: ans("parentCommunicationExchangeConcerns"),
      clientGrossMonthlyIncome: ans("clientGrossMonthlyIncome"),
      otherParentGrossMonthlyIncome: ans("otherParentGrossMonthlyIncome"),
      parentingDaysEstimate: ans("parentingDaysEstimate"),
      childHealthInsuranceCost: ans("childHealthInsuranceCost"),
      childcareCost: ans("childcareCost"),
      dcssInvolvement: ans("dcssInvolvement"),
      marriedToOtherParty: ans("marriedToOtherParty"),
      marriageDate: ans("marriageDate"),
      separationDate: ans("separationDate"),
      maintenanceEmploymentOrHealthIssue: ans("maintenanceEmploymentOrHealthIssue"),
      maintenanceCareerOrChildcareIssue: ans("maintenanceCareerOrChildcareIssue"),
      realEstateInvolved: ans("realEstateInvolved"),
      retirementAccountsInvolved: ans("retirementAccountsInvolved"),
      debtsInvolved: ans("debtsInvolved"),
      complexPropertyIssue: ans("complexPropertyIssue"),
      relocationDistance: ans("relocationDistance"),
      relocationNoticeStatus: ans("relocationNoticeStatus"),
      protectiveOrderServed: ans("protectiveOrderServed"),
      safeContactInstructions: ans("safeContactInstructions"),
      addressConfidentialityOrExchangeConcern: ans("addressConfidentialityOrExchangeConcern"),
      scopeItems: arr("scopeItems").join(", "),
      documentsAvailable: arr("documentsAvailable").join(", "),
      financialDocumentsAvailable: arr("financialDocumentsAvailable").join(", "),
      evidenceAvailable: arr("evidenceAvailable").join(", "),
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

      allAnswers: {
        ...state.answers,
        consistencyReview: consistencySummary,
        intakeReadinessScore: readinessScoreValue,
        intakeReadinessLevel: readinessLevel,
        missingConsultPrepItems: missingItems,
        staffPrepBrief: staffPrepBrief
      }
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

      clearRoutingContext();

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

  exposeRoutingApi();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
