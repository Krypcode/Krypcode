<?php
defined('ABSPATH') || exit;

/**
 * Krypcode AJAX Handler
 * 
 * Handles all server-side AJAX operations.
 * 
 * Key Design:
 *   - The server NEVER sees the original plaintext content.
 *   - Content arrives already encrypted by the client (via Cipher Map).
 *   - The password is hashed with bcrypt (cost 12) before storage.
 *   - The Cipher Map is never sent to or stored on the server.
 */
class Krypcode_Ajax
{
    public function __construct()
    {
        // Register AJAX actions for non-logged-in users
        add_action('wp_ajax_nopriv_create_krypcode_post', array($this, 'create_post'));
        add_action('wp_ajax_nopriv_verify_krypcode_password', array($this, 'verify_password'));
        add_action('wp_ajax_nopriv_delete_krypcode_post', array($this, 'delete_post'));
    }

    /**
     * Create a new encrypted post.
     * 
     * Receives:
     *   - nickname: User-chosen display name
     *   - encrypted_content: Already encrypted on the client side
     *   - password: Hashed with bcrypt before storage (never stored in plaintext)
     * 
     * The server stores:
     *   - Encrypted content (as post_content)
     *   - bcrypt password hash (as post meta)
     *   - Nickname and timestamp (as post meta)
     */
    public function create_post()
    {
        check_ajax_referer('krypcode_nonce', 'security');

        $nickname = sanitize_text_field($_POST['nickname']);
        $encrypted_content = sanitize_textarea_field($_POST['encrypted_content']);
        $password = sanitize_text_field($_POST['password']);

        // Hash password with bcrypt (cost 12)
        $password_hash = password_hash($password, PASSWORD_BCRYPT, array('cost' => 12));
        $timestamp = time();

        $post_id = wp_insert_post(array(
            'post_type' => 'post',
            'post_title' => $nickname . '-' . $timestamp,
            'post_content' => $encrypted_content,
            'post_status' => 'publish',
            'post_name' => $nickname . '-' . $timestamp,
        ));

        if ($post_id) {
            update_post_meta($post_id, '_krypcode_nickname', $nickname);
            update_post_meta($post_id, '_krypcode_timestamp', $timestamp);
            update_post_meta($post_id, '_krypcode_password_hash', $password_hash);

            wp_send_json_success(array(
                'url' => get_permalink($post_id),
                'post_id' => $post_id
            ));
        } else {
            wp_send_json_error('Failed to create post');
        }
    }

    /**
     * Verify password and return encrypted content.
     * 
     * The content returned is still encrypted with the Cipher Map.
     * Only the user who has the Cipher Map can decode it.
     */
    public function verify_password()
    {
        check_ajax_referer('krypcode_nonce', 'security');

        $post_id = intval($_POST['post_id']);
        $input_password = sanitize_text_field($_POST['password']);
        $stored_hash = get_post_meta($post_id, '_krypcode_password_hash', true);

        if (password_verify($input_password, $stored_hash)) {
            $post = get_post($post_id);
            $nickname = get_post_meta($post_id, '_krypcode_nickname', true);

            wp_send_json_success(array(
                'content' => $post->post_content,
                'nickname' => $nickname
            ));
        } else {
            wp_send_json_error('Invalid password');
        }
    }

    /**
     * Delete a post after password verification.
     * 
     * Requires the correct password to authorize deletion.
     * The post is permanently removed (force delete).
     */
    public function delete_post()
    {
        check_ajax_referer('krypcode_nonce', 'security');

        $post_id = intval($_POST['post_id']);
        $input_password = sanitize_text_field($_POST['password']);
        $stored_hash = get_post_meta($post_id, '_krypcode_password_hash', true);

        if (password_verify($input_password, $stored_hash)) {
            wp_delete_post($post_id, true);
            wp_send_json_success('Post deleted');
        } else {
            wp_send_json_error('Invalid password');
        }
    }
}
