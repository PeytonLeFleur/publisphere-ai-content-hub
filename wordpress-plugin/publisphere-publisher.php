<?php
/**
 * Plugin Name: Publisphere Content Publisher
 * Plugin URI: https://publisphere.com
 * Description: Enables secure content publishing from Publisphere platform with Application Password support
 * Version: 1.0.0
 * Author: Publisphere
 * Author URI: https://publisphere.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: publisphere-publisher
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Current plugin version.
 */
define('PUBLISPHERE_VERSION', '1.0.0');

/**
 * Add admin menu
 */
add_action('admin_menu', 'publisphere_add_admin_menu');

function publisphere_add_admin_menu() {
    add_menu_page(
        'Publisphere Publisher',
        'Publisphere',
        'manage_options',
        'publisphere-publisher',
        'publisphere_settings_page',
        'dashicons-cloud-upload',
        100
    );
}

/**
 * Settings page content
 */
function publisphere_settings_page() {
    $site_url = get_site_url();
    $rest_url = get_rest_url();
    $current_user = wp_get_current_user();
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>Connection Information</h2>
            <p>Use these details to connect Publisphere to your WordPress site:</p>
            
            <table class="form-table">
                <tr>
                    <th scope="row">Site URL</th>
                    <td>
                        <code style="background: #f0f0f1; padding: 8px; display: inline-block; border-radius: 3px;">
                            <?php echo esc_html($site_url); ?>
                        </code>
                        <button class="button button-small" onclick="copyToClipboard('<?php echo esc_js($site_url); ?>')">
                            Copy
                        </button>
                    </td>
                </tr>
                <tr>
                    <th scope="row">REST API Endpoint</th>
                    <td>
                        <code style="background: #f0f0f1; padding: 8px; display: inline-block; border-radius: 3px;">
                            <?php echo esc_html($rest_url); ?>
                        </code>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Your Username</th>
                    <td>
                        <code style="background: #f0f0f1; padding: 8px; display: inline-block; border-radius: 3px;">
                            <?php echo esc_html($current_user->user_login); ?>
                        </code>
                    </td>
                </tr>
            </table>

            <h3>Setup Instructions</h3>
            <ol style="line-height: 2;">
                <li>Copy your Site URL above</li>
                <li>Go to your <a href="<?php echo admin_url('profile.php#application-passwords-section'); ?>">User Profile</a></li>
                <li>Scroll down to the "Application Passwords" section</li>
                <li>Enter "Publisphere" as the application name</li>
                <li>Click "Add New Application Password"</li>
                <li>Copy the generated password (you'll only see it once!)</li>
                <li>Use your username and the application password in Publisphere</li>
            </ol>

            <div class="notice notice-info inline">
                <p>
                    <strong>Note:</strong> Application Passwords are available in WordPress 5.6 and later.
                    They provide a secure way to connect external applications without exposing your main password.
                </p>
            </div>
        </div>

        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>REST API Status</h2>
            <?php publisphere_check_rest_api_status(); ?>
        </div>

        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>SEO Plugin Support</h2>
            <?php publisphere_check_seo_plugins(); ?>
        </div>
    </div>

    <script>
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            alert('Copied to clipboard!');
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    }
    </script>
    <?php
}

/**
 * Check REST API status
 */
function publisphere_check_rest_api_status() {
    $rest_url = get_rest_url();
    
    echo '<table class="form-table">';
    echo '<tr><th>REST API Enabled</th><td>';
    
    if (function_exists('rest_get_url_prefix')) {
        echo '<span style="color: green;">✓ Yes</span>';
        echo '<p class="description">REST API is enabled and accessible at: ' . esc_html($rest_url) . '</p>';
    } else {
        echo '<span style="color: red;">✗ No</span>';
        echo '<p class="description">REST API is not available. Please ensure WordPress is up to date.</p>';
    }
    
    echo '</td></tr>';
    echo '</table>';
}

/**
 * Check for SEO plugins
 */
function publisphere_check_seo_plugins() {
    $plugins = array();
    
    if (defined('WPSEO_VERSION')) {
        $plugins[] = array('name' => 'Yoast SEO', 'version' => WPSEO_VERSION, 'active' => true);
    }
    
    if (class_exists('RankMath')) {
        $plugins[] = array('name' => 'Rank Math', 'version' => 'Installed', 'active' => true);
    }
    
    if (empty($plugins)) {
        echo '<p>No SEO plugins detected. SEO metadata features will not be available.</p>';
    } else {
        echo '<p>The following SEO plugins are active and will be supported:</p>';
        echo '<ul>';
        foreach ($plugins as $plugin) {
            echo '<li><strong>' . esc_html($plugin['name']) . '</strong> - Version: ' . esc_html($plugin['version']) . '</li>';
        }
        echo '</ul>';
    }
}

/**
 * Register custom REST API fields for SEO plugins
 */
add_action('rest_api_init', 'publisphere_register_rest_fields');

function publisphere_register_rest_fields() {
    // Yoast SEO support
    if (defined('WPSEO_VERSION')) {
        register_rest_field('post', 'yoast_meta', array(
            'get_callback' => 'publisphere_get_yoast_meta',
            'update_callback' => 'publisphere_update_yoast_meta',
            'schema' => array(
                'description' => 'Yoast SEO meta data',
                'type' => 'object',
            ),
        ));
    }
    
    // Rank Math support
    if (class_exists('RankMath')) {
        register_rest_field('post', 'rank_math_meta', array(
            'get_callback' => 'publisphere_get_rankmath_meta',
            'update_callback' => 'publisphere_update_rankmath_meta',
            'schema' => array(
                'description' => 'Rank Math SEO meta data',
                'type' => 'object',
            ),
        ));
    }
}

/**
 * Get Yoast meta data
 */
function publisphere_get_yoast_meta($object) {
    $post_id = $object['id'];
    return array(
        'title' => get_post_meta($post_id, '_yoast_wpseo_title', true),
        'description' => get_post_meta($post_id, '_yoast_wpseo_metadesc', true),
        'focus_keyword' => get_post_meta($post_id, '_yoast_wpseo_focuskw', true),
    );
}

/**
 * Update Yoast meta data
 */
function publisphere_update_yoast_meta($value, $object) {
    $post_id = $object->ID;
    
    if (isset($value['title'])) {
        update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($value['title']));
    }
    if (isset($value['description'])) {
        update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_textarea_field($value['description']));
    }
    if (isset($value['focus_keyword'])) {
        update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($value['focus_keyword']));
    }
}

/**
 * Get Rank Math meta data
 */
function publisphere_get_rankmath_meta($object) {
    $post_id = $object['id'];
    return array(
        'title' => get_post_meta($post_id, 'rank_math_title', true),
        'description' => get_post_meta($post_id, 'rank_math_description', true),
        'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true),
    );
}

/**
 * Update Rank Math meta data
 */
function publisphere_update_rankmath_meta($value, $object) {
    $post_id = $object->ID;
    
    if (isset($value['title'])) {
        update_post_meta($post_id, 'rank_math_title', sanitize_text_field($value['title']));
    }
    if (isset($value['description'])) {
        update_post_meta($post_id, 'rank_math_description', sanitize_textarea_field($value['description']));
    }
    if (isset($value['focus_keyword'])) {
        update_post_meta($post_id, 'rank_math_focus_keyword', sanitize_text_field($value['focus_keyword']));
    }
}
