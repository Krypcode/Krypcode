/**
 * single-krypcode.js
 * 
 * Handles the encrypted post viewing page.
 * Core Flow:
 *   1. User visits a unique URL (e.g., /nickname-timestamp/)
 *   2. A password input form is displayed
 *   3. User enters the password → sent to server via AJAX for verification
 *   4. Server compares bcrypt hash → if valid, returns the encrypted content
 *   5. The encrypted content is displayed on the page
 *   6. User can also delete the post by re-submitting the password
 * 
 * Note: The content returned from the server is still ENCRYPTED 
 *       with the Cipher Map. The user needs the Cipher Map 
 *       (received during creation) to manually decode it.
 */

jQuery(document).ready(function ($) {
  // ──────────────────────────────────────────────
  // Password Verification
  // ──────────────────────────────────────────────

  if ($("#verify-password-form").length) {
    $("#verify-password-form").on("submit", function (e) {
      e.preventDefault();

      const postId = $(this).data("post-id");
      const inputPassword = $("#password-input").val();
      const $form = $(this);
      const $errorMessage = $(
        '<p class="error-message" style="color: #f87171; margin-top: 10px;"></p>',
      );

      // Remove any previous error messages
      $form.find(".error-message").remove();

      if (!inputPassword) {
        $form.append($errorMessage.text("Please enter a password."));
        return;
      }

      // [AJAX] Verify password against server-stored bcrypt hash
      $.ajax({
        url: krypcodeAjax.ajax_url,
        type: "POST",
        data: {
          action: "verify_krypcode_password",
          security: krypcodeAjax.nonce,
          post_id: postId,
          password: inputPassword,
        },
        success: function (response) {
          if (response.success) {
            // Password verified — display the encrypted content
            $("#password-form").hide();

            const content = response.data.content;
            const deleteButton =
              '<button id="delete-post-button" class="krypcode-delete-button">Delete</button>';

            $("#encrypted-content-display")
              .html(content + deleteButton)
              .show();

            // ──────────────────────────────────────────────
            // Post Deletion
            // ──────────────────────────────────────────────

            /**
             * Delete the post permanently.
             * Re-uses the same password for authorization.
             * The server verifies the password hash again before deleting.
             */
            $("#delete-post-button").on("click", function () {
              if (
                !confirm(
                  "Are you sure you want to delete this post? \n \n This action cannot be undone.",
                )
              ) {
                return;
              }

              $.ajax({
                url: krypcodeAjax.ajax_url,
                type: "POST",
                data: {
                  action: "delete_krypcode_post",
                  security: krypcodeAjax.nonce,
                  post_id: postId,
                  password: inputPassword,
                },
                success: function (deleteResponse) {
                  if (deleteResponse.success) {
                    alert("Post deleted successfully.");
                    window.location.href = krypcodeAjax.home_url;
                  } else {
                    alert("Error: " + deleteResponse.data);
                  }
                },
                error: function () {
                  alert("Error deleting post.");
                },
              });
            });
          } else {
            $form.append($errorMessage.text("Error: " + response.data));
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.error("AJAX Error:", textStatus, errorThrown);
          $form.append(
            $errorMessage.text("AJAX request failed: " + textStatus),
          );
        },
      });
    });
  }
});
