/* =========================================================
   MY FAMILY LAW GROUP PLLC
   Webflow External Intake JavaScript
   File: js/mflg-intake.js
   Purpose: Final launch guided intake behavior
   ========================================================= */

(function () {
  "use strict";

  var MFLG_INTAKE_CONFIG = {
    webhookUrl: "",
    debug: true
  };

  var intakeState = {
    currentStep: 1,
    totalSteps: 4,
    data: {
      legalIssue: "",
      timing: "",
      childrenInvolved: "",
      fullName: "",
      email: "",
      phone: "",
      summary: "",
      pageUrl: "",
      userAgent: "",
      submittedAt: ""
    }
  };

  function buildMflgIntake() {
    var root = document.getElementById("mflg-intake-root");

    if (!root) {
      console.warn("MFLG intake root not found.");
      return;
    }

    root.innerHTML = getIntakeMarkup();

    initMflgIntakeLogic();
  }

  function getIntakeMarkup() {
    return `
      <section class="mflg-intake-section" aria-label="MY FAMILY LAW GROUP guided intake">
        <div class="mflg-intake-shell">

          <div class="mflg-intake-left" aria-hidden="true">
            <div class="mflg-intake-left-content">
              <div class="mflg-kicker">Guided Intake</div>
              <h2>Answer a few questions. Get a clear next step.</h2>
              <p>
                Start with a focused intake so we can understand the family-law issue,
                timing, and the type of help that may be appropriate.
              </p>
            </div>
          </div>

          <div class="mflg-intake-card">
            <div class="mflg-intake-card-header">
              <div class="mflg-progress-row">
                <div class="mflg-step-label" id="mflg-step-label">Step 1</div>
                <div class="mflg-step-count" id="mflg-step-count">1 of 4</div>
              </div>

              <div class="mflg-progress-track" aria-hidden="true">
                <div class="mflg-progress-bar" id="mflg-progress-bar"></div>
              </div>
            </div>

            <div class="mflg-intake-card-body">
              <form id="mflg-intake-form" novalidate>

                <div class="mflg-step" data-step="1">
                  <div class="mflg-form-icon-row">
                    <div class="mflg-courthouse-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10.5L12 5L21 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M5 11H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M7 11V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M12 11V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M17 11V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M5 18H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M4 21H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="mflg-form-title">What type of family-law issue do you need help with?</h3>
                    </div>
                  </div>

                  <p class="mflg-form-subtitle">
                    Choose the closest option. You can add details before submitting.
                  </p>

                  <div class="mflg-gold-divider" aria-hidden="true">
                    <span>⚖</span>
                  </div>

                  <div class="mflg-field-group">
                    <label class="mflg-label" for="mflg-issue">Primary issue</label>
                    <select class="mflg-select" id="mflg-issue" name="legalIssue">
                      <option value="">Select an issue</option>
                      <option value="Divorce or legal separation">Divorce or legal separation</option>
                      <option value="Child custody / legal decision-making / parenting time">Child custody / legal decision-making / parenting time</option>
                      <option value="Child support">Child support</option>
                      <option value="Spousal maintenance">Spousal maintenance</option>
                      <option value="Modification or enforcement">Modification or enforcement</option>
                      <option value="Paternity">Paternity</option>
                      <option value="Protective order tied to family law">Protective order tied to family law</option>
                      <option value="Mediation / ADR / settlement help">Mediation / ADR / settlement help</option>
                      <option value="Document preparation / review">Document preparation / review</option>
                      <option value="Not sure">Not sure</option>
                    </select>
                  </div>
                </div>

                <div class="mflg-step mflg-hidden" data-step="2">
                  <div class="mflg-form-icon-row">
                    <div class="mflg-courthouse-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 3V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M17 3V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M4.5 8.5H19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M6.5 5H17.5C18.6046 5 19.5 5.89543 19.5 7V18.5C19.5 19.6046 18.6046 20.5 17.5 20.5H6.5C5.39543 20.5 4.5 19.6046 4.5 18.5V7C4.5 5.89543 5.39543 5 6.5 5Z" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M8 12H8.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                        <path d="M12 12H12.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                        <path d="M16 12H16.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                        <path d="M8 16H8.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                        <path d="M12 16H12.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="mflg-form-title">How soon do you need help?</h3>
                    </div>
                  </div>

                  <p class="mflg-form-subtitle">
                    Timing helps us identify urgency, deadlines, and the most appropriate next step.
                  </p>

                  <div class="mflg-card-options" data-name="timing">
                    <div class="mflg-option-card" data-value="Urgent deadline or court date" role="button" tabindex="0">
                      <strong>Urgent</strong>
                      <span>I have a deadline, court date, service issue, or immediate concern.</span>
                    </div>

                    <div class="mflg-option-card" data-value="Soon" role="button" tabindex="0">
                      <strong>Soon</strong>
                      <span>I need help in the next few days or weeks.</span>
                    </div>

                    <div class="mflg-option-card" data-value="Planning ahead" role="button" tabindex="0">
                      <strong>Planning ahead</strong>
                      <span>I am trying to understand my options before acting.</span>
                    </div>

                    <div class="mflg-option-card" data-value="Not sure" role="button" tabindex="0">
                      <strong>Not sure</strong>
                      <span>I need help figuring out how serious this is.</span>
                    </div>
                  </div>

                  <input type="hidden" name="timing" id="mflg-timing">
                </div>

                <div class="mflg-step mflg-hidden" data-step="3">
                  <div class="mflg-form-icon-row">
                    <div class="mflg-courthouse-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M8.5 11C10.1569 11 11.5 9.65685 11.5 8C11.5 6.34315 10.1569 5 8.5 5C6.84315 5 5.5 6.34315 5.5 8C5.5 9.65685 6.84315 11 8.5 11Z" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M15.5 11C17.1569 11 18.5 9.65685 18.5 8C18.5 6.34315 17.1569 5 15.5 5C13.8431 5 12.5 6.34315 12.5 8C12.5 9.65685 13.8431 11 15.5 11Z" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M4.5 19C4.5 16.7909 6.29086 15 8.5 15C10.7091 15 12.5 16.7909 12.5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M11.5 19C11.5 16.7909 13.2909 15 15.5 15C17.7091 15 19.5 16.7909 19.5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="mflg-form-title">Are children involved?</h3>
                    </div>
                  </div>

                  <p class="mflg-form-subtitle">
                    This helps identify whether legal decision-making, parenting time, child support,
                    relocation, or other child-related issues may be involved.
                  </p>

                  <div class="mflg-segmented" data-name="children">
                    <button type="button" class="mflg-segment" data-value="Yes">Yes</button>
                    <button type="button" class="mflg-segment" data-value="No">No</button>
                    <button type="button" class="mflg-segment" data-value="Not sure / maybe">Not sure / maybe</button>
                  </div>

                  <input type="hidden" name="childrenInvolved" id="mflg-children">
                </div>

                <div class="mflg-step mflg-hidden" data-step="4">
                  <div class="mflg-form-icon-row">
                    <div class="mflg-courthouse-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 4.5H14.5L18 8V19.5H7V4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                        <path d="M14.5 4.5V8H18" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                        <path d="M9.5 12H15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M9.5 15H15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="mflg-form-title">Tell us a little more.</h3>
                    </div>
                  </div>

                  <p class="mflg-form-subtitle">
                    Keep it brief. Do not include confidential details until services are confirmed.
                  </p>

                  <div class="mflg-field-group">
                    <label class="mflg-label" for="mflg-name">Full name</label>
                    <input class="mflg-input" id="mflg-name" name="fullName" type="text" autocomplete="name" placeholder="Your full name">
                  </div>

                  <div class="mflg-field-group">
                    <label class="mflg-label" for="mflg-email">Email</label>
                    <input class="mflg-input" id="mflg-email" name="email" type="email" autocomplete="email" placeholder="you@example.com">
                  </div>

                  <div class="mflg-field-group">
                    <label class="mflg-label" for="mflg-phone">Phone</label>
                    <input class="mflg-input" id="mflg-phone" name="phone" type="tel" autocomplete="tel" placeholder="Phone number">
                  </div>

                  <div class="mflg-field-group">
                    <label class="mflg-label" for="mflg-summary">Brief summary</label>
                    <textarea class="mflg-textarea" id="mflg-summary" name="summary" placeholder="Briefly describe what you need help with."></textarea>
                  </div>
                </div>

                <div class="mflg-button-row">
                  <button type="button" class="mflg-btn mflg-btn-secondary" id="mflg-back-btn">Back</button>
                  <button type="button" class="mflg-btn mflg-btn-primary" id="mflg-next-btn">Next</button>
                </div>

                <div class="mflg-disclaimer">
                  This intake form is for general information and scheduling purposes only.
                  Submission does not create a client relationship. Services are limited to matters within
                  Arizona Licensed Legal Paraprofessional authority and applicable scope.
                </div>

              </form>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function initMflgIntakeLogic() {
    var backBtn = document.getElementById("mflg-back-btn");
    var nextBtn = document.getElementById("mflg-next-btn");
    var progressBar = document.getElementById("mflg-progress-bar");
    var stepLabel = document.getElementById("mflg-step-label");
    var stepCount = document.getElementById("mflg-step-count");
    var issueSelect = document.getElementById("mflg-issue");

    if (!backBtn || !nextBtn || !progressBar || !stepLabel || !stepCount) {
      console.warn("MFLG intake controls not found.");
      return;
    }

    if (issueSelect) {
      issueSelect.addEventListener("change", function () {
        intakeState.data.legalIssue = issueSelect.value || "";
      });
    }

    initOptionCards();
    initSegmentButtons();

    backBtn.addEventListener("click", function () {
      if (intakeState.currentStep > 1) {
        intakeState.currentStep -= 1;
        showStep(intakeState.currentStep);
      }
    });

    nextBtn.addEventListener("click", function () {
      if (intakeState.currentStep < intakeState.totalSteps) {
        if (!validateStep(intakeState.currentStep)) {
          return;
        }

        intakeState.currentStep += 1;
        showStep(intakeState.currentStep);
        return;
      }

      if (!validateStep(intakeState.currentStep)) {
        return;
      }

      submitIntake();
    });

    showStep(intakeState.currentStep);
  }

  function initOptionCards() {
    var cards = document.querySelectorAll(".mflg-option-card");

    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        selectTimingCard(card);
      });

      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectTimingCard(card);
        }
      });
    });
  }

  function selectTimingCard(card) {
    var parent = card.closest(".mflg-card-options");
    var hiddenInput = document.getElementById("mflg-timing");

    if (!parent || !hiddenInput) {
      return;
    }

    parent.querySelectorAll(".mflg-option-card").forEach(function (item) {
      item.classList.remove("is-selected");
      item.setAttribute("aria-selected", "false");
    });

    card.classList.add("is-selected");
    card.setAttribute("aria-selected", "true");

    hiddenInput.value = card.getAttribute("data-value") || "";
    intakeState.data.timing = hiddenInput.value;
  }

  function initSegmentButtons() {
    var buttons = document.querySelectorAll(".mflg-segment");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var parent = button.closest(".mflg-segmented");
        var hiddenInput = document.getElementById("mflg-children");

        if (!parent || !hiddenInput) {
          return;
        }

        parent.querySelectorAll(".mflg-segment").forEach(function (item) {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");

        hiddenInput.value = button.getAttribute("data-value") || "";
        intakeState.data.childrenInvolved = hiddenInput.value;
      });
    });
  }

  function showStep(step) {
    var steps = document.querySelectorAll(".mflg-step");

    steps.forEach(function (stepElement) {
      var stepNumber = Number(stepElement.getAttribute("data-step"));

      if (stepNumber === step) {
        stepElement.classList.remove("mflg-hidden");
        stepElement.setAttribute("aria-hidden", "false");
      } else {
        stepElement.classList.add("mflg-hidden");
        stepElement.setAttribute("aria-hidden", "true");
      }
    });

    var progressPercent = (step / intakeState.totalSteps) * 100;

    var progressBar = document.getElementById("mflg-progress-bar");
    var stepLabel = document.getElementById("mflg-step-label");
    var stepCount = document.getElementById("mflg-step-count");
    var backBtn = document.getElementById("mflg-back-btn");
    var nextBtn = document.getElementById("mflg-next-btn");

    progressBar.style.width = progressPercent + "%";
    stepLabel.textContent = "Step " + step;
    stepCount.textContent = step + " of " + intakeState.totalSteps;

    if (step === 1) {
      backBtn.classList.add("mflg-hidden");
    } else {
      backBtn.classList.remove("mflg-hidden");
    }

    if (step === intakeState.totalSteps) {
      nextBtn.textContent = "Submit";
    } else {
      nextBtn.textContent = "Next";
    }

    var activeTitle = document.querySelector('.mflg-step[data-step="' + step + '"] .mflg-form-title');

    if (activeTitle) {
      activeTitle.setAttribute("tabindex", "-1");
      activeTitle.focus({ preventScroll: true });
    }
  }

  function validateStep(step) {
    clearInlineErrors();

    if (step === 1) {
      var issue = document.getElementById("mflg-issue");

      if (!issue || !issue.value) {
        showInlineError("Please select the closest family-law issue.");
        if (issue) {
          issue.focus();
        }
        return false;
      }
    }

    if (step === 2) {
      var timing = document.getElementById("mflg-timing");

      if (!timing || !timing.value) {
        showInlineError("Please select how soon you need help.");
        return false;
      }
    }

    if (step === 3) {
      var children = document.getElementById("mflg-children");

      if (!children || !children.value) {
        showInlineError("Please select whether children are involved.");
        return false;
      }
    }

    if (step === 4) {
      var name = document.getElementById("mflg-name");
      var email = document.getElementById("mflg-email");
      var phone = document.getElementById("mflg-phone");
      var summary = document.getElementById("mflg-summary");

      if (!name || !name.value.trim()) {
        showInlineError("Please enter your full name.");
        if (name) {
          name.focus();
        }
        return false;
      }

      if (!email || !isValidEmail(email.value)) {
        showInlineError("Please enter a valid email address.");
        if (email) {
          email.focus();
        }
        return false;
      }

      if (!phone || !phone.value.trim()) {
        showInlineError("Please enter your phone number.");
        if (phone) {
          phone.focus();
        }
        return false;
      }

      if (!summary || !summary.value.trim()) {
        showInlineError("Please provide a brief summary.");
        if (summary) {
          summary.focus();
        }
        return false;
      }
    }

    return true;
  }

  function showInlineError(message) {
    var form = document.getElementById("mflg-intake-form");

    if (!form) {
      return;
    }

    clearInlineErrors();

    var error = document.createElement("div");
    error.className = "mflg-inline-error";
    error.setAttribute("role", "alert");
    error.textContent = message;

    var buttonRow = document.querySelector(".mflg-button-row");

    if (buttonRow) {
      form.insertBefore(error, buttonRow);
    } else {
      form.appendChild(error);
    }
  }

  function clearInlineErrors() {
    var errors = document.querySelectorAll(".mflg-inline-error");

    errors.forEach(function (error) {
      error.remove();
    });
  }

  function isValidEmail(value) {
    var trimmed = String(value || "").trim();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  function collectIntakeData() {
    var form = document.getElementById("mflg-intake-form");
    var formData = new FormData(form);
    var collected = {};

    formData.forEach(function (value, key) {
      collected[key] = typeof value === "string" ? value.trim() : value;
    });

    collected.pageUrl = window.location.href;
    collected.userAgent = window.navigator.userAgent;
    collected.submittedAt = new Date().toISOString();
    collected.source = "MFLG Webflow Intake";
    collected.submissionStatus = MFLG_INTAKE_CONFIG.webhookUrl ? "ready_for_webhook" : "test_mode_no_webhook";

    return collected;
  }

  function submitIntake() {
    var nextBtn = document.getElementById("mflg-next-btn");
    var intakeData = collectIntakeData();

    if (MFLG_INTAKE_CONFIG.debug) {
      console.log("MFLG intake submitted:", intakeData);
    }

    if (!MFLG_INTAKE_CONFIG.webhookUrl) {
      showSuccessMessage(
        "Thank you. Your intake information has been captured for testing. The live submission connection will be added next."
      );
      return;
    }

    nextBtn.disabled = true;
    nextBtn.textContent = "Submitting...";

    fetch(MFLG_INTAKE_CONFIG.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(intakeData)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Submission failed with status " + response.status);
        }

        showSuccessMessage("Thank you. Your intake has been submitted. We will review your information and follow up.");
      })
      .catch(function (error) {
        console.error("MFLG intake submission error:", error);
        showInlineError("Something went wrong submitting the form. Please call 888-870-6354 or email info@myfamilylawgroup.com.");
      })
      .finally(function () {
        nextBtn.disabled = false;
        nextBtn.textContent = "Submit";
      });
  }

  function showSuccessMessage(message) {
    var cardBody = document.querySelector(".mflg-intake-card-body");

    if (!cardBody) {
      alert(message);
      return;
    }

    cardBody.innerHTML = `
      <div class="mflg-success-message" role="status">
        <div class="mflg-form-icon-row">
          <div class="mflg-courthouse-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 class="mflg-form-title">Thank you.</h3>
          </div>
        </div>

        <p class="mflg-form-subtitle">
          ${escapeHtml(message)}
        </p>

        <div class="mflg-gold-divider" aria-hidden="true">
          <span>⚖</span>
        </div>

        <p class="mflg-disclaimer">
          This confirmation does not create a client relationship. Services remain subject to conflict checks,
          scope review, and formal engagement terms.
        </p>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMflgIntake);
  } else {
    buildMflgIntake();
  }
})();
