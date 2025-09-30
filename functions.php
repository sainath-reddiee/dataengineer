<?php
// COMPLETE ENHANCED functions.php for DataEngineer Hub
// Fixed keyword prioritization and scoring system

// Enable CORS for frontend applications
function handle_cors_requests() {
    $allowed_origins = [
        'https://dataengineerhub.blog',
        'https://app.dataengineerhub.blog',
        // Common development origins
        'http://localhost:3000',
        'http://localhost:5173',
    ];

    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: " . $origin);
        } else {
            // For development, allow localhost and common dev platforms
            if (strpos($origin, 'localhost') !== false || 
                strpos($origin, 'bolt.new') !== false || 
                strpos($origin, 'staticblitz.com') !== false ||
                strpos($origin, 'stackblitz.com') !== false ||
                strpos($origin, 'local-credent') !== false) {
                header("Access-Control-Allow-Origin: " . $origin);
            }
        }
    }

    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce, Cache-Control, Pragma");
    header("Access-Control-Allow-Credentials: true");
    
    // Handle preflight OPTIONS request and exit
    if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
        status_header(200);
        exit();
    }
}

// Use a higher priority and remove any old hooks to be safe
remove_action('init', 'handle_cors_requests');
add_action('init', 'handle_cors_requests', 9);

// =================================================================
// CACHE MANAGEMENT SYSTEM
// =================================================================

// Function to clear WordPress object cache and external caches
function clear_all_caches() {
    // Clear WordPress object cache
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    
    // Clear any transients related to posts and categories
    delete_transient('category_counts');
    delete_transient('recent_posts');
    
    // Clear database query cache
    global $wpdb;
    $wpdb->flush();
    
    // Log cache clearing
    error_log("🧹 CACHE: All caches cleared");
}

// Hook to clear cache when posts are saved/updated
add_action('save_post', 'clear_cache_on_post_save', 999);
function clear_cache_on_post_save($post_id) {
    if (wp_is_post_revision($post_id)) return;
    clear_all_caches();
    error_log("🧹 CACHE: Cleared cache after post save: $post_id");
}

// Hook to clear cache when categories are updated
add_action('edited_category', 'clear_cache_on_category_update', 999);
add_action('create_category', 'clear_cache_on_category_update', 999);
function clear_cache_on_category_update($term_id) {
    clear_all_caches();
    error_log("🧹 CACHE: Cleared cache after category update: $term_id");
}

// =================================================================
// ENHANCED AUTO CATEGORY ASSIGNMENT SYSTEM WITH MANUAL CONTROL
// =================================================================

// Helper function to find or create category
function get_or_create_category($category_name, $category_slug) {
    // Try to find existing category by slug
    $category = get_term_by('slug', $category_slug, 'category');
    
    if (!$category) {
        // Try to find by name
        $category = get_term_by('name', $category_name, 'category');
    }
    
    if (!$category) {
        // Create the category if it doesn't exist
        $result = wp_insert_term($category_name, 'category', array(
            'slug' => $category_slug,
            'description' => $category_name . ' related content'
        ));
        
        if (!is_wp_error($result)) {
            $category = get_term($result['term_id'], 'category');
            error_log("✅ Created new category: {$category_name} (ID: {$category->term_id})");
        } else {
            error_log("❌ Failed to create category {$category_name}: " . $result->get_error_message());
            return false;
        }
    }
    
    return $category;
}

// Add manual category control meta box
function add_category_control_meta_box() {
    add_meta_box(
        'manual-category-control',
        '🎯 Category Control',
        'category_control_meta_box_callback',
        'post',
        'side',
        'high'
    );
}
add_action('add_meta_boxes', 'add_category_control_meta_box');

function category_control_meta_box_callback($post) {
    wp_nonce_field('category_control_meta_box', 'category_control_nonce');
    
    // Get current settings
    $auto_categorization = get_post_meta($post->ID, '_auto_categorization_mode', true) ?: 'auto';
    $primary_category = get_post_meta($post->ID, '_primary_category', true);
    $excluded_categories = get_post_meta($post->ID, '_excluded_categories', true) ?: array();
    
    ?>
    <div style="padding: 10px;">
        <h4>Categorization Mode:</h4>
        <label style="display: block; margin: 5px 0;">
            <input type="radio" name="auto_categorization_mode" value="auto" <?php checked($auto_categorization, 'auto'); ?>>
            <strong>Auto</strong> - Assign all matching categories
        </label>
        
        <label style="display: block; margin: 5px 0;">
            <input type="radio" name="auto_categorization_mode" value="primary" <?php checked($auto_categorization, 'primary'); ?>>
            <strong>Primary Only</strong> - Assign only the strongest match
        </label>
        
        <label style="display: block; margin: 5px 0;">
            <input type="radio" name="auto_categorization_mode" value="manual" <?php checked($auto_categorization, 'manual'); ?>>
            <strong>Manual</strong> - Suggest categories, let me choose
        </label>
        
        <label style="display: block; margin: 5px 0;">
            <input type="radio" name="auto_categorization_mode" value="disabled" <?php checked($auto_categorization, 'disabled'); ?>>
            <strong>Disabled</strong> - No auto-categorization
        </label>
        
        <hr style="margin: 15px 0;">
        
        <h4>Primary Category Override:</h4>
        <select name="primary_category" style="width: 100%;">
            <option value="">Auto-detect strongest match</option>
            <option value="snowflake" <?php selected($primary_category, 'snowflake'); ?>>Snowflake</option>
            <option value="aws" <?php selected($primary_category, 'aws'); ?>>AWS</option>
            <option value="azure" <?php selected($primary_category, 'azure'); ?>>Azure</option>
            <option value="sql" <?php selected($primary_category, 'sql'); ?>>SQL</option>
            <option value="python" <?php selected($primary_category, 'python'); ?>>Python</option>
            <option value="airflow" <?php selected($primary_category, 'airflow'); ?>>Airflow</option>
            <option value="dbt" <?php selected($primary_category, 'dbt'); ?>>dbt</option>
            <option value="analytics" <?php selected($primary_category, 'analytics'); ?>>Analytics</option>
        </select>
        
        <hr style="margin: 15px 0;">
        
        <h4>Exclude Categories:</h4>
        <div style="max-height: 100px; overflow-y: auto; border: 1px solid #ddd; padding: 5px;">
            <?php
            $categories = array('snowflake', 'aws', 'azure', 'sql', 'python', 'airflow', 'dbt', 'analytics');
            foreach ($categories as $cat) {
                $checked = in_array($cat, (array)$excluded_categories) ? 'checked' : '';
                echo "<label style='display: block;'>";
                echo "<input type='checkbox' name='excluded_categories[]' value='{$cat}' {$checked}> " . ucfirst($cat);
                echo "</label>";
            }
            ?>
        </div>
    </div>
    <?php
}

// Save category control settings
function save_category_control_settings($post_id) {
    if (!isset($_POST['category_control_nonce']) || !wp_verify_nonce($_POST['category_control_nonce'], 'category_control_meta_box')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    
    // Save settings
    $mode = sanitize_text_field($_POST['auto_categorization_mode'] ?? 'auto');
    $primary = sanitize_text_field($_POST['primary_category'] ?? '');
    $excluded = array_map('sanitize_text_field', $_POST['excluded_categories'] ?? array());
    
    update_post_meta($post_id, '_auto_categorization_mode', $mode);
    update_post_meta($post_id, '_primary_category', $primary);
    update_post_meta($post_id, '_excluded_categories', $excluded);
}
add_action('save_post', 'save_category_control_settings', 5); // Run before auto-categorization

// FIXED: Enhanced auto-categorization function with better keyword prioritization
add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);

function enhanced_auto_assign_categories_universal($post_id, $post) {
    // Skip if this is an autosave or revision
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;
    
    // Only process published posts
    if ($post->post_status !== 'publish') return;
    
    // Only process posts (not pages)
    if ($post->post_type !== 'post') return;
    
    // Check if auto-categorization is disabled for this post
    $mode = get_post_meta($post_id, '_auto_categorization_mode', true) ?: 'auto';
    if ($mode === 'disabled') {
        error_log("🚫 Auto-categorization disabled for post: {$post->post_title}");
        return;
    }
    
    // Avoid infinite loops
    if (get_transient('processing_auto_categories_' . $post_id)) {
        return;
    }
    set_transient('processing_auto_categories_' . $post_id, true, 30);
    
    error_log("🤖 ENHANCED AUTO-CATEGORIZATION: Starting for post '{$post->post_title}' (ID: $post_id, Mode: $mode)");
    
    // Get excluded categories
    $excluded_categories = get_post_meta($post_id, '_excluded_categories', true) ?: array();
    
    // Get content for analysis
    $title = strtolower($post->post_title);
    $content = strtolower(strip_tags($post->post_content));
    $excerpt = strtolower(strip_tags($post->post_excerpt));
    $combined_text = $title . ' ' . $content . ' ' . $excerpt;
    
    error_log("🔍 Analyzing text: " . substr($combined_text, 0, 200) . "...");
    
    // FIXED: IMPROVED CATEGORY MAPPING with priority-based keywords
    $category_mappings = array(
        array(
            'name' => 'Snowflake',
            'slug' => 'snowflake',
            'primary_keywords' => array('snowflake'),  // High priority, unique keywords
            'secondary_keywords' => array('data warehouse', 'warehouse', 'snowpipe', 'snowsight', 'snowflake cloud')
        ),
        array(
            'name' => 'AWS', 
            'slug' => 'aws',
            'primary_keywords' => array('aws', 'amazon web services'),
            'secondary_keywords' => array('s3', 'ec2', 'lambda', 'glue', 'redshift', 'amazon s3', 'aws lambda')
        ),
        array(
            'name' => 'Azure',
            'slug' => 'azure',
            'primary_keywords' => array('azure', 'microsoft azure'),
            'secondary_keywords' => array('synapse', 'data factory', 'power bi', 'azure synapse', 'azure sql')
        ),
        array(
            'name' => 'SQL',
            'slug' => 'sql',
            'primary_keywords' => array('sql', 'query', 'queries'),
            'secondary_keywords' => array('select', 'database', 'mysql', 'postgresql', 'sql server')
        ),
        array(
            'name' => 'Python',
            'slug' => 'python',
            'primary_keywords' => array('python'),
            'secondary_keywords' => array('pandas', 'numpy', 'jupyter', 'dataframe', 'python script', 'python code')
        ),
        array(
            'name' => 'Airflow',
            'slug' => 'airflow',
            'primary_keywords' => array('airflow', 'apache airflow'),
            'secondary_keywords' => array('dag', 'dags', 'workflow', 'orchestration')
        ),
        array(
            'name' => 'dbt',
            'slug' => 'dbt',
            'primary_keywords' => array('dbt', 'data build tool'),
            'secondary_keywords' => array('transformation', 'analytics engineering', 'dbt model', 'dbt models')
        ),
        array(
            'name' => 'Analytics',
            'slug' => 'analytics',
            'primary_keywords' => array('analytics', 'data visualization'),
            'secondary_keywords' => array('bi', 'business intelligence', 'reporting', 'dashboard')  // 'bi' moved to secondary
        )
    );
    
    $detected_categories = array();
    
    // IMPROVED scoring algorithm
    foreach ($category_mappings as $mapping) {
        // Skip if category is excluded
        if (in_array($mapping['slug'], $excluded_categories)) {
            error_log("⭐ Skipping excluded category: {$mapping['name']}");
            continue;
        }
        
        $score = 0;
        $primary_score = 0;
        $secondary_score = 0;
        $found_keywords = array();
        
        // Check primary keywords (weighted heavily)
        foreach ($mapping['primary_keywords'] as $keyword) {
            $count = substr_count($combined_text, strtolower($keyword));
            if ($count > 0) {
                // Primary keywords get 10x weight
                $title_bonus = substr_count($title, strtolower($keyword)) * 5; // Extra title bonus
                $primary_score += ($count * 10) + $title_bonus;
                $found_keywords[] = $keyword . "(primary:" . (($count * 10) + $title_bonus) . ")";
            }
        }
        
        // Check secondary keywords (normal weight)
        foreach ($mapping['secondary_keywords'] as $keyword) {
            $count = substr_count($combined_text, strtolower($keyword));
            if ($count > 0) {
                $title_bonus = substr_count($title, strtolower($keyword)) * 2;
                $secondary_score += $count + $title_bonus;
                $found_keywords[] = $keyword . "(secondary:" . ($count + $title_bonus) . ")";
            }
        }
        
        $total_score = $primary_score + $secondary_score;
        
        // Only consider categories with primary keyword matches OR very high secondary scores
        if ($primary_score > 0 || $secondary_score >= 15) {
            error_log("🎯 Found keywords for {$mapping['name']}: " . implode(', ', $found_keywords) . " (primary: $primary_score, secondary: $secondary_score, total: $total_score)");
            
            $detected_categories[] = array(
                'mapping' => $mapping,
                'score' => $total_score,
                'primary_score' => $primary_score,
                'secondary_score' => $secondary_score,
                'keywords' => $found_keywords
            );
        }
    }
    
    // Sort by primary score first, then total score
    usort($detected_categories, function($a, $b) {
        // First compare primary scores
        $primary_diff = $b['primary_score'] - $a['primary_score'];
        if ($primary_diff != 0) {
            return $primary_diff;
        }
        
        // If primary scores are equal, compare total scores
        return $b['score'] - $a['score'];
    });
    
    $categories_to_assign = array();
    $assigned_category_names = array();
    
    // Apply categorization based on mode
    switch ($mode) {
        case 'manual':
            // For manual mode, just log suggestions but don't auto-assign
            error_log("💡 MANUAL MODE - Detected categories: " . 
                     implode(', ', array_map(function($cat) {
                         return $cat['mapping']['name'] . " (total: {$cat['score']}, primary: {$cat['primary_score']})";
                     }, $detected_categories)));
            
            // Store suggestions for admin interface
            update_post_meta($post_id, '_category_suggestions', $detected_categories);
            delete_transient('processing_auto_categories_' . $post_id);
            return;
            
        case 'primary':
            // Get primary category override or use strongest match
            $primary_override = get_post_meta($post_id, '_primary_category', true);
            error_log("🔍 PRIMARY MODE: Override setting = '$primary_override'");
            
            if ($primary_override && $primary_override !== '') {
                // Find the specific category
                $found_override = false;
                foreach ($detected_categories as $cat_data) {
                    if ($cat_data['mapping']['slug'] === $primary_override) {
                        $category = get_or_create_category($cat_data['mapping']['name'], $cat_data['mapping']['slug']);
                        if ($category) {
                            $categories_to_assign[] = $category->term_id;
                            $assigned_category_names[] = $category->name;
                            $found_override = true;
                            error_log("🎯 PRIMARY OVERRIDE: Will assign {$cat_data['mapping']['name']}");
                        }
                        break;
                    }
                }
                
                // If override category wasn't detected, still create it
                if (!$found_override) {
                    error_log("⚠️ PRIMARY OVERRIDE: Category '$primary_override' not detected in content, but forcing assignment");
                    $category = get_or_create_category(ucfirst($primary_override), $primary_override);
                    if ($category) {
                        $categories_to_assign[] = $category->term_id;
                        $assigned_category_names[] = $category->name;
                        error_log("🎯 PRIMARY FORCED: Will assign " . ucfirst($primary_override));
                    }
                }
            } else if (!empty($detected_categories)) {
                // Use strongest match
                $strongest = $detected_categories[0];
                $category = get_or_create_category($strongest['mapping']['name'], $strongest['mapping']['slug']);
                if ($category) {
                    $categories_to_assign[] = $category->term_id;
                    $assigned_category_names[] = $category->name;
                    error_log("🏆 PRIMARY AUTO: Will assign {$strongest['mapping']['name']} (total: {$strongest['score']}, primary: {$strongest['primary_score']})");
                }
            }
            break;
            
        case 'auto':
        default:
            // Assign categories, but prioritize those with primary keyword matches
            // Add debugging for auto mode
            error_log("🔄 AUTO MODE: Processing " . count($detected_categories) . " detected categories");
            
            foreach ($detected_categories as $cat_data) {
                $category = get_or_create_category($cat_data['mapping']['name'], $cat_data['mapping']['slug']);
                if ($category) {
                    $categories_to_assign[] = $category->term_id;
                    $assigned_category_names[] = $category->name;
                    error_log("✅ AUTO: Will assign {$category->name} (ID: {$category->term_id}, total: {$cat_data['score']}, primary: {$cat_data['primary_score']})");
                }
            }
            
            // SPECIAL FIX: If we're in auto mode but have categories to assign, only assign the top one if it has a clear primary keyword advantage
            if (count($detected_categories) > 1) {
                $top_category = $detected_categories[0];
                $second_category = $detected_categories[1];
                
                // If the top category has significantly higher primary score, only assign that one
                if ($top_category['primary_score'] > 0 && $second_category['primary_score'] == 0) {
                    error_log("🎯 AUTO MODE OVERRIDE: Top category has primary keywords, others don't. Assigning only top category.");
                    $categories_to_assign = array();
                    $assigned_category_names = array();
                    
                    $category = get_or_create_category($top_category['mapping']['name'], $top_category['mapping']['slug']);
                    if ($category) {
                        $categories_to_assign[] = $category->term_id;
                        $assigned_category_names[] = $category->name;
                        error_log("✅ AUTO PRIORITY: Will assign only {$category->name} (primary: {$top_category['primary_score']})");
                    }
                } else if ($top_category['primary_score'] >= ($second_category['primary_score'] * 2)) {
                    error_log("🎯 AUTO MODE OVERRIDE: Top category has much higher primary score. Assigning only top category.");
                    $categories_to_assign = array();
                    $assigned_category_names = array();
                    
                    $category = get_or_create_category($top_category['mapping']['name'], $top_category['mapping']['slug']);
                    if ($category) {
                        $categories_to_assign[] = $category->term_id;
                        $assigned_category_names[] = $category->name;
                        error_log("✅ AUTO PRIORITY: Will assign only {$category->name} (primary: {$top_category['primary_score']})");
                    }
                }
            }
            break;
    }
    
    // Assign categories if any were detected
    if (!empty($categories_to_assign)) {
        // Remove hook to prevent infinite loop
        remove_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
        
        // Clear existing categories and assign new ones
        $result = wp_set_post_categories($post_id, $categories_to_assign, false);
        
        if ($result !== false) {
            error_log("🎉 SUCCESS! Assigned categories in $mode mode: " . implode(', ', $assigned_category_names));
            
            // Update meta
            update_post_meta($post_id, '_auto_categorized', '1');
            update_post_meta($post_id, '_detected_categories', json_encode($assigned_category_names));
            
            // Update category counts
            wp_update_term_count_now($categories_to_assign, 'category');
            
            // Clear caches
            clear_all_caches();
            
        } else {
            error_log("❌ Failed to assign categories");
        }
        
        // Re-add hook
        add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
        
    } else {
        error_log("⚠️ No categories detected in $mode mode. Checking existing categories...");
        
        // Get existing categories
        $existing_cats = wp_get_post_categories($post_id);
        if (empty($existing_cats) && $mode !== 'manual') {
            error_log("ℹ️ No existing categories, assigning to Uncategorized");
            // Assign to uncategorized
            $uncategorized = get_category(1); // ID 1 is usually uncategorized
            if ($uncategorized) {
                remove_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
                wp_set_post_categories($post_id, array($uncategorized->term_id), false);
                add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
            }
        } else {
            error_log("ℹ️ Post already has categories or is in manual mode: " . implode(', ', $existing_cats));
        }
    }
    
    // Cleanup
    delete_transient('processing_auto_categories_' . $post_id);
}

// Force category count updates
add_action('wp_insert_post', 'force_update_category_counts', 999);
function force_update_category_counts($post_id) {
    if (wp_is_post_revision($post_id)) return;
    
    $categories = wp_get_post_categories($post_id);
    if (!empty($categories)) {
        wp_update_term_count_now($categories, 'category');
        error_log("📄 FORCE: Updated category counts for post $post_id");
    }
}

// Enhanced admin meta box to show detection results and manual suggestions
add_action('add_meta_boxes', 'add_auto_category_detection_meta_box');

function add_auto_category_detection_meta_box() {
    add_meta_box(
        'auto-category-detection',
        '🤖 Auto Category Detection',
        'auto_category_detection_callback',
        'post',
        'side',
        'default'
    );
}

function auto_category_detection_callback($post) {
    $title = $post->post_title;
    $content = $post->post_content;
    $combined_text = strtolower($title . ' ' . $content);
    
    echo '<div style="padding: 10px;">';
    
    // Show current mode
    $mode = get_post_meta($post->ID, '_auto_categorization_mode', true) ?: 'auto';
    echo '<div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin-bottom: 10px;">';
    echo '⚙️ <strong>Current Mode:</strong> ' . ucfirst($mode);
    echo '</div>';
    
    // Show if already auto-categorized
    $auto_categorized = get_post_meta($post->ID, '_auto_categorized', true);
    $detected_categories = get_post_meta($post->ID, '_detected_categories', true);
    
    if ($auto_categorized === '1') {
        echo '<div style="background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; margin-bottom: 10px;">';
        echo '✅ <strong>Auto-categorized!</strong>';
        
        if ($detected_categories) {
            $categories_data = json_decode($detected_categories, true);
            if ($categories_data) {
                echo '<br><small>Assigned to: ' . implode(', ', $categories_data) . '</small>';
            }
        }
        echo '</div>';
    }
    
    // Show manual suggestions if in manual mode
    $suggestions = get_post_meta($post->ID, '_category_suggestions', true);
    if ($mode === 'manual' && !empty($suggestions)) {
        echo '<div style="background: #f0f8ff; padding: 10px; border-radius: 4px; margin: 10px 0;">';
        echo '<h4>🤖 Suggested Categories:</h4>';
        
        foreach ($suggestions as $suggestion) {
            $name = $suggestion['mapping']['name'];
            $score = $suggestion['score'];
            $primary_score = $suggestion['primary_score'] ?? 0;
            $keywords = implode(', ', array_slice($suggestion['keywords'], 0, 3));
            
            echo "<div style='margin: 5px 0; padding: 5px; background: white; border-radius: 3px;'>";
            echo "<strong>$name</strong> (total: $score, primary: $primary_score)<br>";
            echo "<small>Keywords: $keywords</small><br>";
            echo "<button type='button' onclick='assignSingleCategory(\"{$suggestion['mapping']['slug']}\", \"$name\", {$post->ID})' class='button button-small'>Assign This Category</button>";
            echo "</div>";
        }
        echo '</div>';
    }
    
    // UPDATED Keyword detection preview with primary/secondary distinction
    $keyword_tests = array(
        'Snowflake' => array(
            'primary' => array('snowflake'),
            'secondary' => array('data warehouse', 'warehouse')
        ),
        'AWS' => array(
            'primary' => array('aws', 'amazon web services'),
            'secondary' => array('s3', 'lambda')
        ),
        'Azure' => array(
            'primary' => array('azure', 'microsoft azure'),
            'secondary' => array('synapse', 'power bi')
        ),
        'SQL' => array(
            'primary' => array('sql', 'query'),
            'secondary' => array('database')
        ),
        'Python' => array(
            'primary' => array('python'),
            'secondary' => array('pandas', 'jupyter')
        ),
        'Airflow' => array(
            'primary' => array('airflow'),
            'secondary' => array('dag', 'workflow')
        ),
        'dbt' => array(
            'primary' => array('dbt'),
            'secondary' => array('transformation')
        ),
        'Analytics' => array(
            'primary' => array('analytics', 'data visualization'),
            'secondary' => array('bi', 'business intelligence')
        )
    );
    
    echo '<h4>Keyword Detection (Improved):</h4>';
    
    $any_detected = false;
    foreach ($keyword_tests as $category => $keyword_groups) {
        $primary_found = array();
        $secondary_found = array();
        $primary_score = 0;
        $secondary_score = 0;
        
        // Check primary keywords
        foreach ($keyword_groups['primary'] as $keyword) {
            $count = substr_count($combined_text, $keyword);
            if ($count > 0) {
                $primary_found[] = "$keyword($count×10)";
                $primary_score += $count * 10;
            }
        }
        
        // Check secondary keywords
        foreach ($keyword_groups['secondary'] as $keyword) {
            $count = substr_count($combined_text, $keyword);
            if ($count > 0) {
                $secondary_found[] = "$keyword($count)";
                $secondary_score += $count;
            }
        }
        
        $total_score = $primary_score + $secondary_score;
        
        if ($total_score > 0) {
            $any_detected = true;
            $bg_color = $primary_score > 0 ? '#d4edda' : '#fff3cd'; // Green if primary, yellow if only secondary
            echo "<div style='background: $bg_color; padding: 5px; margin: 2px 0; border-radius: 3px;'>";
            echo "✅ <strong>$category</strong> (total: $total_score";
            if ($primary_score > 0) echo ", primary: $primary_score";
            echo ")<br>";
            
            if (!empty($primary_found)) {
                echo "<small><strong>Primary:</strong> " . implode(', ', $primary_found) . "</small><br>";
            }
            if (!empty($secondary_found)) {
                echo "<small>Secondary: " . implode(', ', $secondary_found) . "</small>";
            }
            echo "</div>";
        }
    }
    
    if (!$any_detected) {
        echo '<div style="background: #fff3cd; padding: 8px; border-radius: 4px;">';
        echo '⚠️ No keywords detected yet.<br>';
        echo '<small>Try including: Snowflake, AWS, Azure, SQL, Python, Airflow, or dbt</small>';
        echo '</div>';
    } else {
        echo '<div style="background: #d1ecf1; padding: 8px; margin-top: 10px; border-radius: 4px;">';
        echo '💡 Categories with primary keywords get priority. Categories will be assigned when you publish/update this post.';
        echo '</div>';
    }
    
    // Manual test button
    if ($post->ID) {
        echo '<hr style="margin: 10px 0;">';
        echo '<button type="button" onclick="testAutoCategories(' . $post->ID . ')" class="button button-primary" style="width: 100%;">🔄 Test Categorization</button>';
        echo '<button type="button" onclick="clearAllCaches()" class="button" style="width: 100%; margin-top: 5px;">🧹 Clear Caches</button>';
        
        ?>
        <script>
        function testAutoCategories(postId) {
            if (confirm('Test auto-categorization for this post?')) {
                jQuery.post(ajaxurl, {
                    action: 'manual_categorization',
                    post_id: postId,
                    nonce: '<?php echo wp_create_nonce("manual_categorization_" . $post->ID); ?>'
                }, function(response) {
                    if (response.success) {
                        alert('✅ Success!\n\nAssigned categories:\n' + response.data.categories.join('\n'));
                        location.reload();
                    } else {
                        alert('❌ Error: ' + response.data);
                    }
                }).fail(function() {
                    alert('❌ Request failed. Check console for details.');
                });
            }
        }
        
        function clearAllCaches() {
            if (confirm('Clear all caches? This will refresh the data for the frontend.')) {
                jQuery.post(ajaxurl, {
                    action: 'clear_all_caches',
                    nonce: '<?php echo wp_create_nonce("clear_caches"); ?>'
                }, function(response) {
                    if (response.success) {
                        alert('✅ Caches cleared successfully!');
                    } else {
                        alert('❌ Error clearing caches: ' + response.data);
                    }
                }).fail(function() {
                    alert('❌ Cache clear request failed.');
                });
            }
        }
        
        function assignSingleCategory(slug, name, postId) {
            if (confirm('Assign only "' + name + '" category to this post?')) {
                jQuery.post(ajaxurl, {
                    action: 'assign_single_category',
                    post_id: postId,
                    category_slug: slug,
                    nonce: '<?php echo wp_create_nonce("assign_category_" . $post->ID); ?>'
                }, function(response) {
                    if (response.success) {
                        alert('✅ Assigned "' + name + '" category!');
                        location.reload();
                    } else {
                        alert('❌ Error: ' + response.data);
                    }
                });
            }
        }
        </script>
        <?php
    }
    
    echo '</div>';
}

// AJAX handler for manual categorization
add_action('wp_ajax_manual_categorization', 'handle_manual_categorization');

function handle_manual_categorization() {
    $post_id = intval($_POST['post_id']);
    $nonce = $_POST['nonce'];
    
    if (!wp_verify_nonce($nonce, 'manual_categorization_' . $post_id)) {
        wp_send_json_error('Security check failed');
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    $post = get_post($post_id);
    if (!$post) {
        wp_send_json_error('Post not found');
        return;
    }
    
    // Clear any locks
    delete_transient('processing_auto_categories_' . $post_id);
    
    // Trigger categorization
    enhanced_auto_assign_categories_universal($post_id, $post);
    
    // Get results
    $categories = get_the_category($post_id);
    $category_names = array_map(function($cat) { return $cat->name; }, $categories);
    
    // Clear all caches after manual categorization
    clear_all_caches();
    
    wp_send_json_success(array(
        'message' => 'Categories updated and caches cleared',
        'categories' => $category_names,
        'post_title' => $post->post_title
    ));
}

// AJAX handler for single category assignment (for manual mode)
add_action('wp_ajax_assign_single_category', 'handle_assign_single_category');
function handle_assign_single_category() {
    $post_id = intval($_POST['post_id']);
    $category_slug = sanitize_text_field($_POST['category_slug']);
    $nonce = $_POST['nonce'];
    
    if (!wp_verify_nonce($nonce, 'assign_category_' . $post_id)) {
        wp_send_json_error('Security check failed');
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    // Find category by slug
    $category = get_term_by('slug', $category_slug, 'category');
    if (!$category) {
        wp_send_json_error('Category not found');
        return;
    }
    
    // Assign only this category
    wp_set_post_categories($post_id, array($category->term_id), false);
    
    // Update meta
    update_post_meta($post_id, '_auto_categorized', '1');
    update_post_meta($post_id, '_auto_categorization_mode', 'manual');
    delete_post_meta($post_id, '_category_suggestions');
    
    wp_update_term_count_now(array($category->term_id), 'category');
    clear_all_caches();
    
    wp_send_json_success("Assigned category: {$category->name}");
}

// AJAX handler for cache clearing
add_action('wp_ajax_clear_all_caches', 'handle_clear_all_caches');

function handle_clear_all_caches() {
    $nonce = $_POST['nonce'];
    
    if (!wp_verify_nonce($nonce, 'clear_caches')) {
        wp_send_json_error('Security check failed');
        return;
    }
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    clear_all_caches();
    
    wp_send_json_success(array(
        'message' => 'All caches cleared successfully'
    ));
}

// =================================================================
// CUSTOM META FIELDS FOR POSTS
// =================================================================

// Add custom meta fields for featured and trending posts
function add_custom_meta_fields() {
    add_meta_box(
        'post-meta-fields',
        'Post Settings',
        'show_custom_meta_fields',
        'post',
        'side'
    );
}
add_action('add_meta_boxes', 'add_custom_meta_fields');

function show_custom_meta_fields($post) {
    wp_nonce_field(basename(__FILE__), 'post_meta_nonce');
    
    $featured = get_post_meta($post->ID, 'featured', true);
    $trending = get_post_meta($post->ID, 'trending', true);
    
    echo '<p>';
    echo '<label for="featured">';
    echo '<input type="checkbox" id="featured" name="featured" value="1" ' . checked(1, $featured, false) . '>';
    echo ' Featured Post</label>';
    echo '</p>';
    
    echo '<p>';
    echo '<label for="trending">';
    echo '<input type="checkbox" id="trending" name="trending" value="1" ' . checked(1, $trending, false) . '>';
    echo ' Trending Post</label>';
    echo '</p>';
}

function save_custom_meta_fields($post_id) {
    if (!isset($_POST['post_meta_nonce']) || !wp_verify_nonce($_POST['post_meta_nonce'], basename(__FILE__))) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    $featured = isset($_POST['featured']) ? '1' : '0';
    $trending = isset($_POST['trending']) ? '1' : '0';
    
    update_post_meta($post_id, 'featured', $featured);
    update_post_meta($post_id, 'trending', $trending);
}
add_action('save_post', 'save_custom_meta_fields');

// =================================================================
// REST API ENHANCEMENTS
// =================================================================

// Add fields to REST API
function add_custom_fields_to_rest_api() {
    register_rest_field('post', 'featured', array(
        'get_callback' => function($post) {
            $featured = get_post_meta($post['id'], 'featured', true);
            return $featured === '1' || $featured === 1 || $featured === true;
        }
    ));
    
    register_rest_field('post', 'trending', array(
        'get_callback' => function($post) {
            $trending = get_post_meta($post['id'], 'trending', true);
            return $trending === '1' || $trending === 1 || $trending === true;
        }
    ));
    
    register_rest_field('post', 'auto_categorized', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_auto_categorized', true) === '1';
        }
    ));
    
    // Add excerpt to REST API response
    register_rest_field('post', 'excerpt_plain', array(
        'get_callback' => function($post) {
            $excerpt = get_the_excerpt($post['id']);
            return wp_strip_all_tags($excerpt);
        }
    ));
    
    // Add featured image URL to REST API response
    register_rest_field('post', 'featured_image_url', array(
        'get_callback' => function($post) {
            $image_id = get_post_thumbnail_id($post['id']);
            if ($image_id) {
                return wp_get_attachment_image_url($image_id, 'large');
            }
            return null;
        }
    ));
}
add_action('rest_api_init', 'add_custom_fields_to_rest_api');

// Newsletter subscription endpoint
function register_newsletter_endpoint() {
    register_rest_route('wp/v2', '/newsletter/subscribe', array(
        'methods' => 'POST',
        'callback' => 'handle_newsletter_subscription',
        'permission_callback' => '__return_true',
        'args' => array(
            'email' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_email($param);
                }
            )
        )
    ));
}
add_action('rest_api_init', 'register_newsletter_endpoint');

function handle_newsletter_subscription($request) {
    $email = sanitize_email($request->get_param('email'));
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }
    
    // Save to database
    global $wpdb;
    $table_name = $wpdb->prefix . 'newsletter_subscribers';
    
    // Create table if needed
    $charset_collate = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        email varchar(100) NOT NULL,
        subscribed_date datetime DEFAULT CURRENT_TIMESTAMP,
        status varchar(20) DEFAULT 'active',
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    $result = $wpdb->insert(
        $table_name,
        array(
            'email' => $email,
            'subscribed_date' => current_time('mysql'),
            'status' => 'active'
        )
    );
    
    if ($result === false) {
        return new WP_Error('subscription_failed', 'Failed to subscribe', array('status' => 500));
    }
    
    // Send welcome email
    $subject = 'Welcome to DataEngineer Hub Newsletter!';
    $message = 'Thank you for subscribing to our newsletter. You will receive weekly insights and updates about data engineering.';
    wp_mail($email, $subject, $message);
    
    return array(
        'success' => true,
        'message' => 'Successfully subscribed to newsletter'
    );
}

// Contact form endpoint
function register_contact_endpoint() {
    register_rest_route('wp/v2', '/contact/submit', array(
        'methods' => 'POST',
        'callback' => 'handle_contact_submission',
        'permission_callback' => '__return_true',
        'args' => array(
            'name' => array('required' => true),
            'email' => array('required' => true),
            'message' => array('required' => true)
        )
    ));
}
add_action('rest_api_init', 'register_contact_endpoint');

function handle_contact_submission($request) {
    $name = sanitize_text_field($request->get_param('name'));
    $email = sanitize_email($request->get_param('email'));
    $message = sanitize_textarea_field($request->get_param('message'));
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }
    
    // Send email to admin
    $admin_email = get_option('admin_email');
    $subject = 'New Contact Form Submission from ' . $name;
    $email_message = "Name: $name\nEmail: $email\n\nMessage:\n$message";
    
    $sent = wp_mail($admin_email, $subject, $email_message, array(
        'From: DataEngineer Hub <noreply@dataengineerhub.blog>',
        'Reply-To: ' . $email
    ));
    
    if (!$sent) {
        return new WP_Error('email_failed', 'Failed to send message', array('status' => 500));
    }
    
    // Send confirmation to user
    $user_subject = 'Thank you for contacting DataEngineer Hub';
    $user_message = "Hi $name,\n\nThank you for your message. We'll get back to you shortly.\n\nBest regards,\nDataEngineer Hub Team";
    wp_mail($email, $user_subject, $user_message);
    
    return array(
        'success' => true,
        'message' => 'Contact form submitted successfully'
    );
}

// =================================================================
// THEME SUPPORT & CUSTOMIZATIONS
// =================================================================

// Theme support
add_theme_support('post-thumbnails');

// Excerpt settings
function custom_excerpt_length($length) {
    return 30;
}
add_filter('excerpt_length', 'custom_excerpt_length');

function custom_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'custom_excerpt_more');

// Category colors
function add_category_color_field($term) {
    ?>
    <tr class="form-field">
        <th scope="row" valign="top">
            <label for="category_color">Category Color</label>
        </th>
        <td>
            <input type="color" id="category_color" name="category_color" value="<?php echo esc_attr(get_term_meta($term->term_id, 'category_color', true)); ?>" />
            <p class="description">Choose a color for this category</p>
        </td>
    </tr>
    <?php
}
add_action('category_edit_form_fields', 'add_category_color_field');

function save_category_color_field($term_id) {
    if (isset($_POST['category_color'])) {
        update_term_meta($term_id, 'category_color', sanitize_hex_color($_POST['category_color']));
    }
}
add_action('edited_category', 'save_category_color_field');

// Add category color to REST API
function add_category_color_to_rest_api() {
    register_rest_field('category', 'color', array(
        'get_callback' => function($term) {
            return get_term_meta($term['id'], 'category_color', true) ?: '#3B82F6';
        }
    ));
}
add_action('rest_api_init', 'add_category_color_to_rest_api');

// Ensure proper JSON response
function ensure_json_response($response, $server, $request) {
    if (strpos($request->get_route(), '/wp/v2/') !== false) {
        header('Content-Type: application/json; charset=utf-8');
    }
    return $response;
}
add_filter('rest_pre_serve_request', 'ensure_json_response', 10, 3);

// Add cache-busting headers for REST API responses
function add_cache_busting_headers($response, $server, $request) {
    if (strpos($request->get_route(), '/wp/v2/') !== false) {
        $response->header('Cache-Control', 'no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
    }
    return $response;
}
add_filter('rest_post_dispatch', 'add_cache_busting_headers', 10, 3);

// Add admin notice
add_action('admin_notices', function() {
    $screen = get_current_screen();
    if ($screen && in_array($screen->id, array('post', 'edit-post'))) {
        echo '<div class="notice notice-info is-dismissible">';
        echo '<p><strong>Enhanced Auto-Categorization Active:</strong> You now have full control over categorization modes (Auto/Primary/Manual/Disabled) for each post. Use the "Category Control" meta box to customize behavior.</p>';
        echo '</div>';
    }
});

?>