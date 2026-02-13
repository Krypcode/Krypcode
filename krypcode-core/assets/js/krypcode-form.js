/**
 * krypcode-form.js
 * 
 * Handles the secret message creation form.
 * Core Flow:
 *   1. User enters nickname, password, and secret content
 *   2. Input validation (English-only, password strength check)
 *   3. Client-side encryption using Cipher Map (via crypto.js)
 *   4. Encrypted content is sent to server via AJAX
 *   5. Server stores the encrypted content and returns a unique URL
 * 
 * Key Point: The actual encryption happens entirely on the client side.
 *            The server only receives and stores the already-encrypted content.
 */

jQuery(document).ready(function ($) {
  let currentCipherMap = null;
  let pendingAction = null;

  // ──────────────────────────────────────────────
  // Input Validation
  // ──────────────────────────────────────────────

  /**
   * Password Strength Checker
   * Evaluates password strength based on length and character variety.
   * Returns a score (0-100), label, and CSS class.
   */
  function checkPasswordStrength(password) {
    let strength = 0;
    let strengthText = "";
    let strengthClass = "";

    if (password.length === 0) {
      return { strength: 0, text: "", class: "" };
    }

    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;

    // Character variety checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    // Determine strength level
    if (strength < 40) {
      strengthText = "Weak";
      strengthClass = "weak";
    } else if (strength < 70) {
      strengthText = "Medium";
      strengthClass = "medium";
    } else {
      strengthText = "Strong";
      strengthClass = "strong";
    }

    return { strength, text: strengthText, class: strengthClass };
  }

  /**
   * English-Only Validation
   * Ensures input contains only English letters, numbers, and common punctuation.
   */
  function validateEnglishOnly(text) {
    return /^[a-zA-Z0-9\s\.,!?;:'"()\-]+$/.test(text);
  }

  // Real-time password strength indicator
  $("#password").on("input", function () {
    const password = $(this).val();
    const result = checkPasswordStrength(password);

    $(".password-strength-bar")
      .css("width", result.strength + "%")
      .removeClass("weak medium strong")
      .addClass(result.class);

    $(".password-strength-text").text(result.text);
  });

  // Validate nickname (English only)
  $("#nickname").on("input", function () {
    const value = $(this).val();
    if (value && !validateEnglishOnly(value)) {
      $(this).val(value.replace(/[^a-zA-Z0-9\-_]/g, ""));
      $(".error-message")
        .text("Nickname must contain only English letters, numbers, - and _")
        .show();
      setTimeout(() => $(".error-message").fadeOut(), 3000);
    }
  });

  // Validate secret content (English only)
  $("#secret-content").on("input", function () {
    const value = $(this).val();
    if (value && !validateEnglishOnly(value)) {
      $(this).val(value.replace(/[^a-zA-Z0-9\s\.,!?;:'"()\-]/g, ""));
      $(".error-message")
        .text("Secret content must contain only English characters")
        .show();
      setTimeout(() => $(".error-message").fadeOut(), 3000);
    }
  });

  // ──────────────────────────────────────────────
  // Core: Encryption & AJAX Submission
  // ──────────────────────────────────────────────

  /**
   * Secure Link Creation
   * 
   * This is the core workflow:
   * 1. Generate a random Cipher Map (client-side, via crypto.js)
   * 2. Encode the secret content using the Cipher Map (client-side)
   * 3. Send the ENCRYPTED content + password to the server via AJAX
   * 4. Server hashes the password (bcrypt) and stores the encrypted content
   * 5. Server returns a unique URL for accessing the post
   * 
   * The Cipher Map is shown to the user but NEVER sent to the server.
   * Without the Cipher Map, the encrypted content cannot be decoded,
   * even if the server or database is compromised.
   */
  function executeSecureLinkCreation() {
    const nickname = $("#nickname").val();
    const password = $("#password").val();
    const content = $("#secret-content").val();

    if (!nickname || !password || !content) {
      $(".error-message").text("Please fill in all fields.").show();
      return;
    }

    // [CLIENT-SIDE] Generate Cipher Map
    currentCipherMap = cipherUtils.generateCipherMap();

    // [CLIENT-SIDE] Encode secret content with Cipher Map
    const encryptedContent = cipherUtils.encodeWithCipherMap(
      content,
      currentCipherMap,
    );

    // [AJAX] Send encrypted content to server
    $.ajax({
      url: krypcodeAjax.ajax_url,
      type: "POST",
      data: {
        action: "create_krypcode_post",
        security: krypcodeAjax.nonce,
        nickname: nickname,
        password: password,
        encrypted_content: encryptedContent, // Already encrypted on client
      },
      success: function (response) {
        if (response.success) {
          displayCipherMap(currentCipherMap, response.data.url);
        } else {
          $(".error-message")
            .text("Error: " + response.data)
            .show();
        }
      },
      error: function () {
        $(".error-message").text("Server error. Please try again.").show();
      },
    });
  }

  /**
   * Cipher-Only Creation
   * Generates a Cipher Map without creating a server-side post.
   * Useful for offline encoding.
   */
  function executeCipherOnlyCreation() {
    $(".error-message").hide().text("");
    currentCipherMap = cipherUtils.generateCipherMap();
    displayCipherMap(currentCipherMap, null);
  }

  // ──────────────────────────────────────────────
  // Cipher Map Display
  // ──────────────────────────────────────────────

  /**
   * Renders the Cipher Map as a grid in a modal.
   * The Cipher Map is the decryption key — shown only to the creator.
   */
  function displayCipherMap(map, shareUrl) {
    let gridHtml = "";
    for (const [char, code] of Object.entries(map)) {
      gridHtml += `<div><strong>${char}</strong>: ${code}</div>`;
    }

    $("#cipher-map-table").html(gridHtml);

    if (shareUrl) {
      $("#confirm-cipher-btn").data("share-url", shareUrl).show();
    } else {
      $("#confirm-cipher-btn").hide();
    }

    $(".cipher-modal").css("display", "flex");
  }

  // ──────────────────────────────────────────────
  // Form Event Handlers
  // ──────────────────────────────────────────────

  // Precautions modal — requires user agreement before proceeding
  function showPrecautionsModal(actionType) {
    pendingAction = actionType;
    $("#precautions-agree-checkbox").prop("checked", false);
    $("#precautions-proceed-btn").prop("disabled", true);
    $(".precautions-modal").css("display", "flex");
  }

  $("#precautions-agree-checkbox").on("change", function () {
    $("#precautions-proceed-btn").prop("disabled", !$(this).is(":checked"));
  });

  $("#precautions-proceed-btn").on("click", function () {
    $(".precautions-modal").hide();

    if (pendingAction === "create-secure-link") {
      executeSecureLinkCreation();
    } else if (pendingAction === "create-cipher-only") {
      executeCipherOnlyCreation();
    }

    pendingAction = null;
  });

  $("#precautions-cancel-btn").on("click", function () {
    $(".precautions-modal").hide();
    pendingAction = null;
  });

  // Form submit → show precautions first
  $("#krypcode-form").on("submit", function (e) {
    e.preventDefault();
    showPrecautionsModal("create-secure-link");
  });

  // Cipher-only button → show precautions first
  $("#generate-cipher-only-btn").on("click", function () {
    showPrecautionsModal("create-cipher-only");
  });
});
