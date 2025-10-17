<?php
/**
 * COMPLETE FINAL functions.php for DataEngineer Hub
 * All functionality preserved with auto-categorization meta boxes RESTORED
 * This is the complete working version - replace your entire functions.php with this
 */

// ============================================================================
// CORS HANDLING
// ============================================================================

function handle_cors_requests() {
    $allowed_origins = [
        'https://dataengineerhub.blog',
        'https://app.dataengineerhub.blog',
        'http://localhost:3000',
        'http://localhost:5173',
    ];

    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        header("Access-Control-Allow-Origin: *");
    } 
    elseif (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $origin);
    }
    elseif (
        strpos($origin, 'localhost') !== false ||
        strpos($origin, 'bolt.new') !== false ||
        strpos($origin, 'staticblitz.com') !== false ||
        strpos($origin, 'stackblitz.com') !== false ||
        strpos($origin, 'local-credent') !== false
    ) {
        header("Access-Control-Allow-Origin: " . $origin);
    }

    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce, Cache-Control, Pragma");
    header("Access-Control-Allow-Credentials: true");
    
    if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
        status_header(200);
        exit();
    }
}

remove_action('init', 'handle_cors_requests');
add_action('init', 'handle_cors_requests', 9);

// ============================================================================
// CACHE MANAGEMENT SYSTEM
// ============================================================================

function clear_all_caches() {
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    
    delete_transient('category_counts');
    delete_transient('recent_posts');
    
    global $wpdb;
    $wpdb->flush();
    
    error_log("🧹 CACHE: All caches cleared");
}

add_action('save_post', 'clear_cache_on_post_save', 999);
function clear_cache_on_post_save($post_id) {
    if (wp_is_post_revision($post_id)) return;
    clear_all_caches();
    error_log("🧹 CACHE: Cleared cache after post save: $post_id");
}

add_action('edited_category', 'clear_cache_on_category_update', 999);
add_action('create_category', 'clear_cache_on_category_update', 999);
function clear_cache_on_category_update($term_id) {
    clear_all_caches();
    error_log("🧹 CACHE: Cleared cache after category update: $term_id");
}

// ============================================================================
// ENHANCED AUTO CATEGORY ASSIGNMENT SYSTEM
// ============================================================================

function get_or_create_category($category_name, $category_slug) {
    $category = get_term_by('slug', $category_slug, 'category');
    
    if (!$category) {
        $category = get_term_by('name', $category_name, 'category');
    }
    
    if (!$category) {
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

// ============================================================================
// META BOXES - RESTORED AND WORKING
// ============================================================================

add_action('add_meta_boxes', 'add_category_control_meta_box');
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

function category_control_meta_box_callback($post) {
    wp_nonce_field('category_control_meta_box', 'category_control_nonce');
    
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
            <option value="gcp" <?php selected($primary_category, 'gcp'); ?>>GCP</option>
            <option value="databricks" <?php selected($primary_category, 'databricks'); ?>>Databricks</option>
            <option value="salesforce" <?php selected($primary_category, 'salesforce'); ?>>Salesforce</option>
        </select>
        
        <hr style="margin: 15px 0;">
        
        <h4>Exclude Categories:</h4>
        <div style="max-height: 100px; overflow-y: auto; border: 1px solid #ddd; padding: 5px;">
            <?php
            $categories = array('snowflake', 'aws', 'azure', 'sql', 'python', 'airflow', 'dbt', 'gcp','salesforce','databricks');
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

add_action('save_post', 'save_category_control_settings', 5);
function save_category_control_settings($post_id) {
    if (!isset($_POST['category_control_nonce']) || !wp_verify_nonce($_POST['category_control_nonce'], 'category_control_meta_box')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    
    $mode = sanitize_text_field($_POST['auto_categorization_mode'] ?? 'auto');
    $primary = sanitize_text_field($_POST['primary_category'] ?? '');
    $excluded = array_map('sanitize_text_field', $_POST['excluded_categories'] ?? array());
    
    update_post_meta($post_id, '_auto_categorization_mode', $mode);
    update_post_meta($post_id, '_primary_category', $primary);
    update_post_meta($post_id, '_excluded_categories', $excluded);
}

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
    
    $mode = get_post_meta($post->ID, '_auto_categorization_mode', true) ?: 'auto';
    echo '<div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin-bottom: 10px;">';
    echo '⚙️ <strong>Current Mode:</strong> ' . ucfirst($mode);
    echo '</div>';
    
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
        'GCP' => array(
            'primary' => array('gcp', 'google cloud'),
            'secondary' => array('bigquery', 'dataflow')
        )
    );
    
    echo '<h4>Keyword Detection (Improved):</h4>';
    
    $any_detected = false;
    foreach ($keyword_tests as $category => $keyword_groups) {
        $primary_found = array();
        $secondary_found = array();
        $primary_score = 0;
        $secondary_score = 0;
        
        foreach ($keyword_groups['primary'] as $keyword) {
            $count = substr_count($combined_text, $keyword);
            if ($count > 0) {
                $primary_found[] = "$keyword($count×10)";
                $primary_score += $count * 10;
            }
        }
        
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
            $bg_color = $primary_score > 0 ? '#d4edda' : '#fff3cd';
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

// ============================================================================
// AUTO-CATEGORIZATION ENGINE
// ============================================================================

add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
function enhanced_auto_assign_categories_universal($post_id, $post) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;
    if ($post->post_status !== 'publish') return;
    if ($post->post_type !== 'post') return;
    
    $mode = get_post_meta($post_id, '_auto_categorization_mode', true) ?: 'auto';
    if ($mode === 'disabled') {
        error_log("🚫 Auto-categorization disabled for post: {$post->post_title}");
        return;
    }
    
    if (get_transient('processing_auto_categories_' . $post_id)) {
        return;
    }
    set_transient('processing_auto_categories_' . $post_id, true, 30);
    
    error_log("🤖 AUTO-CATEGORIZATION: Starting for post '{$post->post_title}' (ID: $post_id, Mode: $mode)");
    
    $excluded_categories = get_post_meta($post_id, '_excluded_categories', true) ?: array();
    
    $title = strtolower($post->post_title);
    $content = strtolower(strip_tags($post->post_content));
    $excerpt = strtolower(strip_tags($post->post_excerpt));
    $combined_text = $title . ' ' . $content . ' ' . $excerpt;
    
    error_log("🔍 Analyzing text: " . substr($combined_text, 0, 200) . "...");
    
    $category_mappings = array(
        array(
            'name' => 'Snowflake',
            'slug' => 'snowflake',
            'primary_keywords' => array('snowflake'),
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
            'name' => 'GCP',
            'slug' => 'gcp',
            'primary_keywords' => array('gcp', 'google cloud'),
            'secondary_keywords' => array('bigquery', 'dataflow', 'dataproc', 'google cloud platform', 'cloud storage')
        )
    );
    
    $detected_categories = array();
    
    foreach ($category_mappings as $mapping) {
        if (in_array($mapping['slug'], $excluded_categories)) {
            error_log("⭐ Skipping excluded category: {$mapping['name']}");
            continue;
        }
        
        $score = 0;
        $primary_score = 0;
        $secondary_score = 0;
        $found_keywords = array();
        
        foreach ($mapping['primary_keywords'] as $keyword) {
            $count = substr_count($combined_text, strtolower($keyword));
            if ($count > 0) {
                $title_bonus = substr_count($title, strtolower($keyword)) * 5;
                $primary_score += ($count * 10) + $title_bonus;
                $found_keywords[] = $keyword . "(primary:" . (($count * 10) + $title_bonus) . ")";
            }
        }
        
        foreach ($mapping['secondary_keywords'] as $keyword) {
            $count = substr_count($combined_text, strtolower($keyword));
            if ($count > 0) {
                $title_bonus = substr_count($title, strtolower($keyword)) * 2;
                $secondary_score += $count + $title_bonus;
                $found_keywords[] = $keyword . "(secondary:" . ($count + $title_bonus) . ")";
            }
        }
        
        $total_score = $primary_score + $secondary_score;
        
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
    
    usort($detected_categories, function($a, $b) {
        $primary_diff = $b['primary_score'] - $a['primary_score'];
        if ($primary_diff != 0) {
            return $primary_diff;
        }
        return $b['score'] - $a['score'];
    });
    
    $categories_to_assign = array();
    $assigned_category_names = array();
    
    switch ($mode) {
        case 'manual':
            error_log("💡 MANUAL MODE - Detected categories: " . 
                     implode(', ', array_map(function($cat) {
                         return $cat['mapping']['name'] . " (total: {$cat['score']}, primary: {$cat['primary_score']})";
                     }, $detected_categories)));
            
            update_post_meta($post_id, '_category_suggestions', $detected_categories);
            delete_transient('processing_auto_categories_' . $post_id);
            return;
            
        case 'primary':
            $primary_override = get_post_meta($post_id, '_primary_category', true);
            error_log("🔍 PRIMARY MODE: Override setting = '$primary_override'");
            
            if ($primary_override && $primary_override !== '') {
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
            error_log("🔄 AUTO MODE: Processing " . count($detected_categories) . " detected categories");
            
            foreach ($detected_categories as $cat_data) {
                $category = get_or_create_category($cat_data['mapping']['name'], $cat_data['mapping']['slug']);
                if ($category) {
                    $categories_to_assign[] = $category->term_id;
                    $assigned_category_names[] = $category->name;
                    error_log("✅ AUTO: Will assign {$category->name} (ID: {$category->term_id}, total: {$cat_data['score']}, primary: {$cat_data['primary_score']})");
                }
            }
            
            if (count($detected_categories) > 1) {
                $top_category = $detected_categories[0];
                $second_category = $detected_categories[1];
                
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
                }
            }
            break;
    }
    
    if (!empty($categories_to_assign)) {
        remove_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
        
        $result = wp_set_post_categories($post_id, $categories_to_assign, false);
        
        if ($result !== false) {
            error_log("🎉 SUCCESS! Assigned categories in $mode mode: " . implode(', ', $assigned_category_names));
            
            update_post_meta($post_id, '_auto_categorized', '1');
            update_post_meta($post_id, '_detected_categories', json_encode($assigned_category_names));
            
            wp_update_term_count_now($categories_to_assign, 'category');
            clear_all_caches();
        } else {
            error_log("❌ Failed to assign categories");
        }
        
        add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
    } else {
        error_log("⚠️ No categories detected in $mode mode. Checking existing categories...");
        
        $existing_cats = wp_get_post_categories($post_id);
        if (empty($existing_cats) && $mode !== 'manual') {
            error_log("ℹ️ No existing categories, assigning to Uncategorized");
            $uncategorized = get_category(1);
            if ($uncategorized) {
                remove_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
                wp_set_post_categories($post_id, array($uncategorized->term_id), false);
                add_action('save_post', 'enhanced_auto_assign_categories_universal', 10, 2);
            }
        } else {
            error_log("ℹ️ Post already has categories or is in manual mode: " . implode(', ', $existing_cats));
        }
    }
    
    delete_transient('processing_auto_categories_' . $post_id);
}

add_action('wp_insert_post', 'force_update_category_counts', 999);
function force_update_category_counts($post_id) {
    if (wp_is_post_revision($post_id)) return;
    
    $categories = wp_get_post_categories($post_id);
    if (!empty($categories)) {
        wp_update_term_count_now($categories, 'category');
        error_log("📄 FORCE: Updated category counts for post $post_id");
    }
}

// ============================================================================
// AJAX HANDLERS
// ============================================================================

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
    
    delete_transient('processing_auto_categories_' . $post_id);
    
    enhanced_auto_assign_categories_universal($post_id, $post);
    
    $categories = get_the_category($post_id);
    $category_names = array_map(function($cat) { return $cat->name; }, $categories);
    
    clear_all_caches();
    
    wp_send_json_success(array(
        'message' => 'Categories updated and caches cleared',
        'categories' => $category_names,
        'post_title' => $post->post_title
    ));
}

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
    
    $category = get_term_by('slug', $category_slug, 'category');
    if (!$category) {
        wp_send_json_error('Category not found');
        return;
    }
    
    wp_set_post_categories($post_id, array($category->term_id), false);
    
    update_post_meta($post_id, '_auto_categorized', '1');
    update_post_meta($post_id, '_auto_categorization_mode', 'manual');
    delete_post_meta($post_id, '_category_suggestions');
    
    wp_update_term_count_now(array($category->term_id), 'category');
    clear_all_caches();
    
    wp_send_json_success("Assigned category: {$category->name}");
}

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

// ============================================================================
// CUSTOM META FIELDS FOR POSTS
// ============================================================================

add_action('init', 'register_custom_post_meta_fields');
function register_custom_post_meta_fields() {
    register_post_meta('post', 'featured', array(
        'type' => 'boolean',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    
    register_post_meta('post', 'trending', array(
        'type' => 'boolean',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}

add_action('add_meta_boxes', 'add_custom_meta_fields');
function add_custom_meta_fields() {
    add_meta_box(
        'post-meta-fields',
        'Post Settings',
        'show_custom_meta_fields',
        'post',
        'side'
    );
}

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

add_action('save_post', 'save_custom_meta_fields');
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

// ============================================================================
// REST API ENHANCEMENTS
// ============================================================================

add_action('rest_api_init', 'add_custom_fields_to_rest_api');
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
    
    register_rest_field('post', 'excerpt_plain', array(
        'get_callback' => function($post) {
            $excerpt = get_the_excerpt($post['id']);
            return wp_strip_all_tags($excerpt);
        }
    ));
    
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

// Newsletter subscription endpoint
add_action('rest_api_init', 'register_newsletter_endpoint');
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

function handle_newsletter_subscription($request) {
    $email = sanitize_email($request->get_param('email'));
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'newsletter_subscribers';
    
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
    
    $subject = 'Welcome to DataEngineer Hub Newsletter!';
    $message = 'Thank you for subscribing to our newsletter. You will receive weekly insights and updates about data engineering.';
    wp_mail($email, $subject, $message);
    
    return array(
        'success' => true,
        'message' => 'Successfully subscribed to newsletter'
    );
}

// Contact form endpoint
add_action('rest_api_init', 'register_contact_endpoint');
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

function handle_contact_submission($request) {
    $name = sanitize_text_field($request->get_param('name'));
    $email = sanitize_email($request->get_param('email'));
    $message = sanitize_textarea_field($request->get_param('message'));
    
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }
    
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
    
    $user_subject = 'Thank you for contacting DataEngineer Hub';
    $user_message = "Hi $name,\n\nThank you for your message. We'll get back to you shortly.\n\nBest regards,\nDataEngineer Hub Team";
    wp_mail($email, $user_subject, $user_message);
    
    return array(
        'success' => true,
        'message' => 'Contact form submitted successfully'
    );
}

// ============================================================================
// THEME SUPPORT & CUSTOMIZATIONS - MUST BE AT TOP
// ============================================================================

// CRITICAL: Enable featured images IMMEDIATELY
add_action('after_setup_theme', 'dataengineer_theme_setup', 1);
function dataengineer_theme_setup() {
    add_theme_support('post-thumbnails');
    add_post_type_support('post', 'thumbnail');
    set_post_thumbnail_size(1200, 630, true);
}

function custom_excerpt_length($length) {
    return 30;
}
add_filter('excerpt_length', 'custom_excerpt_length');

function custom_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'custom_excerpt_more');

// Category colors
add_action('category_edit_form_fields', 'add_category_color_field');
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

add_action('edited_category', 'save_category_color_field');
function save_category_color_field($term_id) {
    if (isset($_POST['category_color'])) {
        update_term_meta($term_id, 'category_color', sanitize_hex_color($_POST['category_color']));
    }
}

add_action('rest_api_init', 'add_category_color_to_rest_api');
function add_category_color_to_rest_api() {
    register_rest_field('category', 'color', array(
        'get_callback' => function($term) {
            return get_term_meta($term['id'], 'category_color', true) ?: '#3B82F6';
        }
    ));
}

add_filter('rest_pre_serve_request', 'ensure_json_response', 10, 3);
function ensure_json_response($response, $server, $request) {
    if (strpos($request->get_route(), '/wp/v2/') !== false) {
        header('Content-Type: application/json; charset=utf-8');
    }
    return $response;
}

add_filter('rest_post_query', 'add_custom_meta_query_to_rest', 10, 2);
function add_custom_meta_query_to_rest($args, $request) {
    if (!empty($request['is_featured'])) {
        $args['meta_key'] = 'featured';
        $args['meta_value'] = '1';
    }

    if (!empty($request['is_trending'])) {
        $args['meta_key'] = 'trending';
        $args['meta_value'] = '1';
    }

    return $args;
}

add_action('rest_api_init', 'add_custom_query_params_to_rest');
function add_custom_query_params_to_rest() {
    register_rest_field('post', 'is_featured', array(
        'get_callback'    => null,
        'update_callback' => null,
        'schema'          => array(
            'description' => 'Filter by featured posts.',
            'type'        => 'boolean',
        ),
    ));
    register_rest_field('post', 'is_trending', array(
        'get_callback'    => null,
        'update_callback' => null,
        'schema'          => array(
            'description' => 'Filter by trending posts.',
            'type'        => 'boolean',
        ),
    ));
}

// ============================================================================
// GITHUB ACTIONS TRIGGER
// ============================================================================

add_action('save_post', 'trigger_github_action_on_publish', 99, 2);
function trigger_github_action_on_publish($ID, $post) {
    if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($ID) || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        return;
    }

    $transient_key = 'github_action_triggered_' . $ID;
    if (get_transient($transient_key)) {
        error_log('GitHub Action trigger for post ' . $ID . ' skipped: Debounce lock is active.');
        return;
    }

    if (!defined('GITHUB_PAT')) {
        error_log('GitHub PAT is not defined in wp-config.php for workflow trigger.');
        return;
    }
    
    set_transient($transient_key, true, 2 * MINUTE_IN_SECONDS);

    $token = GITHUB_PAT;
    $repo = 'sainath-reddiee/dataengineer';
    $url = "https://api.github.com/repos/{$repo}/dispatches";

    $body = wp_json_encode([
        'event_type' => 'post-published',
        'client_payload' => [
            'post_id' => $ID,
            'post_title' => $post->post_title
        ]
    ]);

    $args = [
        'body'    => $body,
        'headers' => [
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/vnd.github.v3+json',
            'Authorization' => 'Bearer ' . $token,
            'User-Agent'    => 'WordPress-GitHub-Action-Trigger'
        ],
        'timeout' => 15,
        'blocking' => false 
    ];

    $response = wp_remote_post($url, $args);
    
    if (is_wp_error($response)) {
        error_log('GitHub Action trigger failed to dispatch: ' . $response->get_error_message());
    } else {
        error_log('Successfully dispatched GitHub Action trigger for post: ' . $post->post_title);
    }
}

add_action('template_redirect', 'add_noindex_header');
function add_noindex_header() {
    if (strpos($_SERVER['HTTP_HOST'], 'app.dataengineerhub.blog') !== false) {
        header('X-Robots-Tag: noindex, nofollow', true);
    }
}

// ============================================================================
// RELATED POSTS & TAGS
// ============================================================================

add_action('rest_api_init', 'register_related_posts_endpoint');
function register_related_posts_endpoint() {
    register_rest_route('wp/v2', '/posts/(?P<id>\d+)/related', array(
        'methods' => 'GET',
        'callback' => 'get_related_posts_by_id',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'validate_callback' => function($param, $request, $key) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
}

add_action('rest_api_init', 'add_tags_to_rest_api');
function add_tags_to_rest_api() {
    register_rest_field('post', 'post_tags', array(
        'get_callback' => function($post) {
            $tags = get_the_tags($post['id']);
            if (!$tags || is_wp_error($tags)) {
                return [];
            }
            
            return array_map(function($tag) {
                return array(
                    'id' => $tag->term_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'link' => get_tag_link($tag->term_id)
                );
            }, $tags);
        }
    ));
}

function get_related_posts_by_id($data) {
    $post_id = $data['id'];
    $post = get_post($post_id);

    if (empty($post)) {
        return new WP_Error('not_found', 'Post not found', array('status' => 404));
    }

    $tags = wp_get_post_tags($post_id, array('fields' => 'ids'));
    $cats = wp_get_post_categories($post_id, array('fields' => 'ids'));

    $args = array(
        'post__not_in' => array($post_id),
        'posts_per_page' => 3,
        'ignore_sticky_posts' => 1,
        'orderby' => 'rand',
    );

    if (!empty($tags)) {
        $args['tag__in'] = $tags;
    } elseif (!empty($cats)) {
        $args['category__in'] = $cats;
    }

    $related_query = new WP_Query($args);

    if (!$related_query->have_posts() && !empty($cats)) {
        $args['tag__in'] = null;
        $args['category__in'] = $cats;
        $related_query = new WP_Query($args);
    }
    
    $related_posts = array();
    while ($related_query->have_posts()) {
        $related_query->the_post();
        $related_post_id = get_the_ID();
        
        $image_url = get_the_post_thumbnail_url($related_post_id, 'large');
        if (!$image_url) {
            $image_url = 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop';
        }

        $categories = get_the_category($related_post_id);
        $primary_category = !empty($categories) ? $categories[0]->name : 'Uncategorized';
        
        $post_data = array(
            'id' => $related_post_id,
            'slug' => get_post_field('post_name', $related_post_id),
            'title' => array('rendered' => get_the_title()),
            'excerpt' => array('rendered' => get_the_excerpt()),
            'date' => get_the_date('c'),
            '_embedded' => array(
                'wp:featuredmedia' => array(
                    array('source_url' => $image_url)
                ),
                'wp:term' => array(
                    array(
                        array('name' => $primary_category)
                    )
                ),
                'author' => array(
                    array('name' => get_the_author())
                )
            )
        );
        $related_posts[] = $post_data;
    }
    wp_reset_postdata();

    return new WP_REST_Response($related_posts, 200);
}

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

add_filter('rest_prepare_post', 'optimize_rest_post_response', 10, 3);
function optimize_rest_post_response($response, $post, $request) {
    $params = $request->get_params();
    
    if (isset($params['context']) && $params['context'] === 'edit') {
        return $response;
    }
    
    if (!isset($params['slug']) || empty($params['slug'])) {
        return $response;
    }
    
    $data = $response->get_data();
    
    if (!isset($data['featured_image_url'])) {
        $featured_image_id = get_post_thumbnail_id($post->ID);
        if ($featured_image_id) {
            $image_url = wp_get_attachment_image_url($featured_image_id, 'large');
            $data['featured_image_url'] = $image_url ?: null;
            $response->set_data($data);
        }
    }
    
    return $response;
}

add_action('template_redirect', 'enable_http2_server_push');
function enable_http2_server_push() {
    if (is_singular('post')) {
        header('Link: </wp-content/themes/your-theme/style.css>; rel=preload; as=style', false);
    }
}

add_filter('wp_get_attachment_image_src', 'optimize_image_src', 10, 4);
function optimize_image_src($image, $attachment_id, $size, $icon) {
    if (!$image) return $image;
    
    if (is_array($image) && isset($image[0])) {
        $url = $image[0];
        
        if (strpos($url, '?') === false) {
            $image[0] = $url . '?w=' . $image[1] . '&quality=85';
        }
    }
    
    return $image;
}

add_filter('rest_post_dispatch', 'add_rest_cache_headers', 10, 3);
function add_rest_cache_headers($result, $server, $request) {
    $route = $request->get_route();
    
    if (strpos($route, '/wp/v2/posts') !== false) {
        $result->header('Cache-Control', 'public, max-age=300, s-maxage=600');
        $result->header('Vary', 'Accept-Encoding');
    }
    
    return $result;
}

add_action('wp_head', 'preload_featured_image', 1);
function preload_featured_image() {
    if (is_singular('post')) {
        $post_id = get_the_ID();
        $featured_image_id = get_post_thumbnail_id($post_id);
        
        if ($featured_image_id) {
            $image_url = wp_get_attachment_image_url($featured_image_id, 'large');
            if ($image_url) {
                echo '<link rel="preload" as="image" href="' . esc_url($image_url) . '" fetchpriority="high">' . "\n";
            }
        }
    }
}

add_filter('rest_post_query', 'optimize_rest_post_query', 10, 2);
function optimize_rest_post_query($args, $request) {
    $args['update_post_meta_cache'] = false;
    $args['update_post_term_cache'] = true;
    
    $params = $request->get_params();
    if (isset($params['slug']) && !empty($params['slug'])) {
        $args['update_post_term_cache'] = true;
    }
    
    return $args;
}

add_filter('script_loader_tag', 'defer_non_critical_scripts', 10, 3);
function defer_non_critical_scripts($tag, $handle, $src) {
    $defer_scripts = array(
        'wp-embed',
        'comment-reply'
    );
    
    if (in_array($handle, $defer_scripts)) {
        return str_replace(' src', ' defer src', $tag);
    }
    
    return $tag;
}

add_filter('rest_prepare_post', 'limit_rest_api_fields', 10, 3);
function limit_rest_api_fields($response, $post, $request) {
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST)) {
        $referer = wp_get_referer();
        if ($referer && strpos($referer, 'wp-admin') !== false) {
            return $response;
        }
    }
    
    $params = $request->get_params();
    
    if (isset($params['context']) && $params['context'] === 'edit') {
        return $response;
    }
    
    if (isset($params['_fields'])) {
        return $response;
    }
    
    if (isset($params['_embed']) || $request->get_param('_embed')) {
        return $response;
    }
    
    if (!isset($params['slug']) || empty($params['slug'])) {
        $data = $response->get_data();
        
        $minimal_data = array(
            'id' => $data['id'],
            'slug' => $data['slug'],
            'title' => $data['title'],
            'excerpt' => $data['excerpt'],
            'date' => $data['date'],
            'featured_image_url' => get_the_post_thumbnail_url($post->ID, 'medium'),
            '_embedded' => isset($data['_embedded']) ? array(
                'wp:featuredmedia' => $data['_embedded']['wp:featuredmedia'] ?? [],
                'wp:term' => $data['_embedded']['wp:term'] ?? []
            ) : []
        );
        
        $response->set_data($minimal_data);
    }
    
    return $response;
}

add_action('init', 'enable_output_buffering');
function enable_output_buffering() {
    if (!is_admin() && !defined('DOING_AJAX')) {
        ob_start('ob_gzhandler');
    }
}

add_filter('rest_endpoints', 'disable_unused_rest_endpoints');
function disable_unused_rest_endpoints($endpoints) {
    $unused_endpoints = array(
        '/wp/v2/users',
        '/wp/v2/comments',
        '/wp/v2/settings',
        '/wp/v2/themes',
        '/wp/v2/plugins',
        '/wp/v2/block-types',
        '/wp/v2/block-renderer'
    );
    
    foreach ($unused_endpoints as $endpoint) {
        if (isset($endpoints[$endpoint])) {
            unset($endpoints[$endpoint]);
        }
    }
    
    return $endpoints;
}

add_action('pre_get_posts', 'optimize_rest_api_queries');
function optimize_rest_api_queries($query) {
    if (!defined('REST_REQUEST') || !REST_REQUEST) {
        return;
    }
    
    $query->set('no_found_rows', false);
    $query->set('cache_results', true);
    $query->set('update_post_term_cache', true);
    $query->set('update_post_meta_cache', false);
}

add_action('send_headers', 'add_expires_headers');
function add_expires_headers() {
    if (!is_admin()) {
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    }
}

add_filter('rest_pre_serve_request', 'optimize_rest_response', 10, 4);
function optimize_rest_response($served, $result, $request, $server) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $time = timer_stop(0, 3);
        header('X-Response-Time: ' . $time . 's');
    }
    
    return $served;
}

add_filter('the_content', 'add_lazy_loading_to_images');
function add_lazy_loading_to_images($content) {
    if (is_feed() || is_admin()) {
        return $content;
    }
    
    $content = preg_replace('/<img(.*?)>/', '<img$1 loading="lazy">', $content);
    
    return $content;
}

add_action('rest_api_init', 'register_minimal_rest_fields');
function register_minimal_rest_fields() {
    register_rest_field('post', 'optimized_image', array(
        'get_callback' => function($post) {
            $image_id = get_post_thumbnail_id($post['id']);
            if (!$image_id) return null;
            
            return array(
                'thumbnail' => wp_get_attachment_image_url($image_id, 'thumbnail'),
                'medium' => wp_get_attachment_image_url($image_id, 'medium'),
                'large' => wp_get_attachment_image_url($image_id, 'large')
            );
        },
        'schema' => array(
            'description' => 'Optimized image URLs',
            'type' => 'object'
        )
    ));
}

// ============================================================================
// CATEGORY FIXES FOR REST API
// ============================================================================

add_filter('rest_prepare_post', 'force_categories_in_rest_response', 999, 3);
function force_categories_in_rest_response($response, $post, $request) {
    $params = $request->get_params();
    
    if (isset($params['context']) && $params['context'] === 'edit') {
        return $response;
    }
    
    $data = $response->get_data();
    
    $categories = get_the_category($post->ID);
    
    error_log("REST API Response for post {$post->ID}: Found " . count($categories) . " categories");
    
    $filtered_categories = $categories;
    if (count($categories) > 1) {
        $filtered_categories = array_filter($categories, function($cat) {
            return $cat->slug !== 'uncategorized';
        });
        $filtered_categories = array_values($filtered_categories);
    }
    
    $category_data = array();
    foreach ($filtered_categories as $category) {
        $category_data[] = array(
            'id' => $category->term_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'link' => get_category_link($category->term_id),
            'taxonomy' => 'category'
        );
    }
    
    if (!isset($data['_embedded'])) {
        $data['_embedded'] = array();
    }
    
    if (!isset($data['_embedded']['wp:term'])) {
        $data['_embedded']['wp:term'] = array();
    }
    
    $data['_embedded']['wp:term'][0] = $category_data;
    
    if (!empty($category_data)) {
        $data['category_name'] = $category_data[0]['name'];
        $data['category_slug'] = $category_data[0]['slug'];
        $data['primary_category'] = $category_data[0];
    } else {
        $data['category_name'] = 'Uncategorized';
        $data['category_slug'] = 'uncategorized';
        $data['primary_category'] = array(
            'id' => 1,
            'name' => 'Uncategorized',
            'slug' => 'uncategorized',
            'link' => get_category_link(1)
        );
    }
    
    $data['all_categories'] = $category_data;
    
    $response->set_data($data);
    
    return $response;
}

add_filter('rest_post_query', 'ensure_embed_works', 10, 2);
function ensure_embed_works($args, $request) {
    $args['update_post_term_cache'] = true;
    
    return $args;
}

add_action('rest_api_init', 'register_explicit_category_fields');
function register_explicit_category_fields() {
    register_rest_field('post', 'category_name', array(
        'get_callback' => function($post) {
            $categories = get_the_category($post['id']);
            
            if (count($categories) > 1) {
                $categories = array_filter($categories, function($cat) {
                    return $cat->slug !== 'uncategorized';
                });
                $categories = array_values($categories);
            }
            
            if (empty($categories)) {
                return 'Uncategorized';
            }
            
            return $categories[0]->name;
        },
        'update_callback' => null,
        'schema' => array(
            'description' => 'Primary category name',
            'type' => 'string',
            'context' => array('view', 'edit', 'embed')
        )
    ));
    
    register_rest_field('post', 'category_slug', array(
        'get_callback' => function($post) {
            $categories = get_the_category($post['id']);
            
            if (count($categories) > 1) {
                $categories = array_filter($categories, function($cat) {
                    return $cat->slug !== 'uncategorized';
                });
                $categories = array_values($categories);
            }
            
            if (empty($categories)) {
                return 'uncategorized';
            }
            
            return $categories[0]->slug;
        },
        'update_callback' => null,
        'schema' => array(
            'description' => 'Primary category slug',
            'type' => 'string',
            'context' => array('view', 'edit', 'embed')
        )
    ));
    
    register_rest_field('post', 'all_categories', array(
        'get_callback' => function($post) {
            $categories = get_the_category($post['id']);
            
            if (count($categories) > 1) {
                $categories = array_filter($categories, function($cat) {
                    return $cat->slug !== 'uncategorized';
                });
                $categories = array_values($categories);
            }
            
            $result = array();
            foreach ($categories as $cat) {
                $result[] = array(
                    'id' => $cat->term_id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'link' => get_category_link($cat->term_id)
                );
            }
            
            return $result;
        },
        'update_callback' => null,
        'schema' => array(
            'description' => 'All categories for this post',
            'type' => 'array',
            'context' => array('view', 'edit', 'embed')
        )
    ));
}

add_action('save_post', 'auto_remove_uncategorized_if_has_others', 1000, 3);
function auto_remove_uncategorized_if_has_others($post_id, $post, $update) {
    if (wp_is_post_revision($post_id)) return;
    if ($post->post_type !== 'post') return;
    if ($post->post_status !== 'publish') return;
    
    $categories = wp_get_post_categories($post_id);
    
    if (count($categories) > 1 && in_array(1, $categories)) {
        error_log("🧹 Auto-removing Uncategorized from post {$post_id} (has other categories)");
        
        $categories = array_diff($categories, array(1));
        
        remove_action('save_post', 'auto_remove_uncategorized_if_has_others', 1000, 3);
        wp_set_post_categories($post_id, $categories, false);
        add_action('save_post', 'auto_remove_uncategorized_if_has_others', 1000, 3);
        
        clear_all_caches();
    }
}

add_action('set_object_terms', 'clear_rest_cache_on_category_change', 10, 6);
function clear_rest_cache_on_category_change($object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids) {
    if ($taxonomy === 'category') {
        clear_all_caches();
        
        delete_transient('rest_api_post_' . $object_id);
        
        error_log("🧹 Cleared REST cache for post {$object_id} after category change");
    }
}

add_action('rest_api_init', 'register_category_debug_endpoint');
function register_category_debug_endpoint() {
    register_rest_route('wp/v2', '/debug/categories/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'debug_post_categories_endpoint',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
}

function debug_post_categories_endpoint($data) {
    $post_id = $data['id'];
    $post = get_post($post_id);
    
    if (!$post) {
        return new WP_Error('not_found', 'Post not found', array('status' => 404));
    }
    
    $categories = get_the_category($post_id);
    $category_ids = wp_get_post_categories($post_id);
    
    return array(
        'post_id' => $post_id,
        'post_title' => $post->post_title,
        'post_status' => $post->post_status,
        'category_ids' => $category_ids,
        'categories_raw' => array_map(function($cat) {
            return array(
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'count' => $cat->count
            );
        }, $categories),
        'category_count' => count($categories),
        'has_uncategorized' => in_array(1, $category_ids),
        'auto_categorized' => get_post_meta($post_id, '_auto_categorized', true),
        'categorization_mode' => get_post_meta($post_id, '_auto_categorization_mode', true),
        'detected_categories' => get_post_meta($post_id, '_detected_categories', true)
    );
}

add_action('admin_init', 'maybe_run_category_cleanup', 1);
function maybe_run_category_cleanup() {
    $cleanup_done = get_option('rest_api_category_cleanup_done', false);
    
    if (!$cleanup_done && current_user_can('manage_options')) {
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ));
        
        $cleaned = 0;
        foreach ($posts as $post_id) {
            $cats = wp_get_post_categories($post_id);
            if (count($cats) > 1 && in_array(1, $cats)) {
                $cats = array_diff($cats, array(1));
                wp_set_post_categories($post_id, $cats, false);
                $cleaned++;
            }
        }
        
        if ($cleaned > 0) {
            error_log("🧹 Initial cleanup: Removed Uncategorized from {$cleaned} posts");
            clear_all_caches();
        }
        
        update_option('rest_api_category_cleanup_done', true);
    }
}

// ============================================================================
// CATEGORY CHECKER ADMIN PAGE
// ============================================================================

add_action('admin_menu', 'add_category_checker_menu');
function add_category_checker_menu() {
    add_menu_page(
        'Category Checker',
        'Check Categories',
        'manage_options',
        'category-checker',
        'render_category_checker_page',
        'dashicons-search',
        100
    );
}

function render_category_checker_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    ?>
    <div class="wrap">
        <h1>🔍 Category Checker</h1>
        
        <style>
            .category-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background: white;
            }
            .category-table th {
                background: #0073aa;
                color: white;
                padding: 12px;
                text-align: left;
            }
            .category-table td {
                padding: 12px;
                border-bottom: 1px solid #ddd;
            }
            .category-table tr:hover {
                background: #f5f5f5;
            }
            .badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                margin-right: 5px;
            }
            .badge-success {
                background: #4caf50;
                color: white;
            }
            .badge-error {
                background: #f44336;
                color: white;
            }
            .badge-warning {
                background: #ff9800;
                color: white;
            }
        </style>
        
        <?php
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 20,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        echo '<h2>Latest ' . count($posts) . ' Published Posts</h2>';
        echo '<table class="category-table">';
        echo '<thead>';
        echo '<tr>';
        echo '<th>Post Title</th>';
        echo '<th>Categories (Backend)</th>';
        echo '<th>Category IDs</th>';
        echo '<th>REST API Response</th>';
        echo '<th>Status</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        foreach ($posts as $post) {
            $categories = get_the_category($post->ID);
            $category_ids = wp_get_post_categories($post->ID);
            $auto_categorized = get_post_meta($post->ID, '_auto_categorized', true);
            
            $rest_request = new WP_REST_Request('GET', '/wp/v2/posts/' . $post->ID);
            $rest_request->set_param('_embed', true);
            $rest_server = rest_get_server();
            $rest_response = $rest_server->dispatch($rest_request);
            $rest_data = $rest_response->get_data();
            
            $embedded_cats = isset($rest_data['_embedded']['wp:term'][0]) ? $rest_data['_embedded']['wp:term'][0] : [];
            
            $category_name = isset($rest_data['category_name']) ? $rest_data['category_name'] : 'NOT SET';
            $category_slug = isset($rest_data['category_slug']) ? $rest_data['category_slug'] : 'NOT SET';
            
            echo '<tr>';
            
            echo '<td><strong>' . esc_html($post->post_title) . '</strong><br>';
            echo '<small>ID: ' . $post->ID . '</small></td>';
            
            echo '<td>';
            if (empty($categories)) {
                echo '<span class="badge badge-error">NO CATEGORIES</span>';
            } else {
                foreach ($categories as $cat) {
                    $badge_class = $cat->slug === 'uncategorized' ? 'badge-warning' : 'badge-success';
                    echo '<span class="badge ' . $badge_class . '">' . esc_html($cat->name) . '</span>';
                }
            }
            echo '</td>';
            
            echo '<td>' . implode(', ', $category_ids) . '</td>';
            
            echo '<td>';
            echo '<strong>Custom Fields:</strong><br>';
            echo 'category_name: <code>' . esc_html($category_name) . '</code><br>';
            echo 'category_slug: <code>' . esc_html($category_slug) . '</code><br><br>';
            
            echo '<strong>Embedded Categories (' . count($embedded_cats) . '):</strong><br>';
            if (empty($embedded_cats)) {
                echo '<span class="badge badge-error">EMPTY!</span>';
            } else {
                foreach ($embedded_cats as $cat) {
                    echo '<span class="badge badge-success">' . esc_html($cat['name']) . '</span>';
                }
            }
            echo '</td>';
            
            echo '<td>';
            if (empty($categories)) {
                echo '<span class="badge badge-error">❌ NO CATS</span>';
            } elseif (count($categories) === 1 && $categories[0]->slug === 'uncategorized') {
                echo '<span class="badge badge-warning">⚠️ UNCATEGORIZED</span>';
            } elseif (empty($embedded_cats)) {
                echo '<span class="badge badge-error">❌ NOT IN REST</span>';
            } elseif ($category_name === 'Uncategorized' && count($categories) > 1) {
                echo '<span class="badge badge-warning">⚠️ WRONG DISPLAY</span>';
            } else {
                echo '<span class="badge badge-success">✅ OK</span>';
            }
            
            if ($auto_categorized === '1') {
                echo '<br><span class="badge badge-success">🤖 Auto</span>';
            }
            echo '</td>';
            
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        
        $total = count($posts);
        $uncategorized = 0;
        $properly_categorized = 0;
        
        foreach ($posts as $post) {
            $cats = get_the_category($post->ID);
            if (empty($cats) || (count($cats) === 1 && $cats[0]->slug === 'uncategorized')) {
                $uncategorized++;
            } else {
                $properly_categorized++;
            }
        }
        
        echo '<h2>Summary</h2>';
        echo '<p><strong>Total Posts:</strong> ' . $total . '</p>';
        echo '<p><strong>Properly Categorized:</strong> ' . $properly_categorized . ' (' . round(($properly_categorized/$total)*100, 1) . '%)</p>';
        echo '<p><strong>Uncategorized:</strong> ' . $uncategorized . ' (' . round(($uncategorized/$total)*100, 1) . '%)</p>';
        
        echo '<h2>Quick Tests</h2>';
        echo '<p><a href="' . get_rest_url(null, 'wp/v2/posts?per_page=5&_embed') . '" target="_blank" class="button">View REST API Response</a></p>';
        ?>
        
        <h2>Fix Actions</h2>
        <form method="post" style="margin-top: 20px;">
            <?php wp_nonce_field('fix_categories_action', 'fix_categories_nonce'); ?>
            
            <p>
                <button type="submit" name="remove_uncategorized" class="button button-primary">
                    🧹 Remove "Uncategorized" from Posts with Other Categories
                </button>
            </p>
            
            <p>
                <button type="submit" name="recategorize_all" class="button button-secondary">
                    🔄 Re-run Categorization for All Posts
                </button>
            </p>
        </form>
        
        <?php
        if (isset($_POST['remove_uncategorized']) && check_admin_referer('fix_categories_action', 'fix_categories_nonce')) {
            $fixed = 0;
            foreach ($posts as $post) {
                $cats = wp_get_post_categories($post->ID);
                if (count($cats) > 1 && in_array(1, $cats)) {
                    $cats = array_diff($cats, array(1));
                    wp_set_post_categories($post->ID, $cats, false);
                    $fixed++;
                }
            }
            echo '<div class="notice notice-success"><p>✅ Removed Uncategorized from ' . $fixed . ' posts!</p></div>';
            echo '<script>window.location.reload();</script>';
        }
        
        if (isset($_POST['recategorize_all']) && check_admin_referer('fix_categories_action', 'fix_categories_nonce')) {
            foreach ($posts as $post) {
                delete_transient('processing_auto_categories_' . $post->ID);
                enhanced_auto_assign_categories_universal($post->ID, $post, true);
            }
            echo '<div class="notice notice-success"><p>✅ Re-categorized all posts!</p></div>';
            echo '<script>setTimeout(function(){ window.location.reload(); }, 2000);</script>';
        }
        ?>
    </div>
    <?php
}

// ============================================================================
// FEATURED IMAGE FIX
// ============================================================================

function force_featured_image_metabox() {
    $screen = get_current_screen();
    if ($screen && $screen->id === 'post') {
        remove_meta_box('postimagediv', 'post', 'side');
        add_meta_box('postimagediv', __('Featured Image'), 'post_thumbnail_meta_box', 'post', 'side', 'low');
    }
}
add_action('do_meta_boxes', 'force_featured_image_metabox', 10);

function ensure_featured_image_support() {
    add_theme_support('post-thumbnails');
    add_post_type_support('post', 'thumbnail');
}
add_action('after_setup_theme', 'ensure_featured_image_support', 999);

function add_featured_image_admin_class($classes) {
    global $post_type;
    if ($post_type === 'post') {
        $classes .= ' has-featured-image-support';
    }
    return $classes;
}
add_filter('admin_body_class', 'add_featured_image_admin_class');

// ============================================================================
// ADMIN NOTICES
// ============================================================================

add_action('admin_notices', 'categorization_admin_notice');
function categorization_admin_notice() {
    $screen = get_current_screen();
    if ($screen && in_array($screen->id, array('post', 'edit-post'))) {
        echo '<div class="notice notice-info is-dismissible">';
        echo '<p><strong>✅ Enhanced Auto-Categorization Active:</strong> Meta boxes are enabled! Use "Category Control" and "Auto Category Detection" in the sidebar to manage categorization.</p>';
        echo '</div>';
    }
}

// ============================================================================
// CERTIFICATION HUB IMPLEMENTATION
// ============================================================================

add_action('init', 'register_certification_post_type');
function register_certification_post_type() {
    $labels = array(
        'name' => 'Certifications',
        'singular_name' => 'Certification',
        'menu_name' => 'Cert Hub',
        'add_new' => 'Add New',
        'add_new_item' => 'Add New Certification',
        'edit_item' => 'Edit Certification',
        'new_item' => 'New Certification',
        'view_item' => 'View Certification',
        'search_items' => 'Search Certifications',
        'not_found' => 'No certifications found',
        'not_found_in_trash' => 'No certifications in trash'
    );

    $args = array(
        'labels' => $labels,
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'certifications'),
        'show_in_rest' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
        'menu_icon' => 'dashicons-awards',
        'menu_position' => 20,
        'capability_type' => 'post',
        'hierarchical' => false,
    );

    register_post_type('certification', $args);
}

add_action('init', 'register_certification_taxonomies');
function register_certification_taxonomies() {
    register_taxonomy('cert_provider', 'certification', array(
        'label' => 'Provider',
        'labels' => array(
            'name' => 'Providers',
            'singular_name' => 'Provider',
            'add_new_item' => 'Add New Provider',
        ),
        'rewrite' => array('slug' => 'cert-provider'),
        'hierarchical' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));

    register_taxonomy('cert_level', 'certification', array(
        'label' => 'Level',
        'labels' => array(
            'name' => 'Levels',
            'singular_name' => 'Level',
        ),
        'rewrite' => array('slug' => 'cert-level'),
        'hierarchical' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));

    register_taxonomy('resource_type', 'certification', array(
        'label' => 'Resource Type',
        'labels' => array(
            'name' => 'Resource Types',
            'singular_name' => 'Resource Type',
        ),
        'rewrite' => array('slug' => 'resource-type'),
        'hierarchical' => false,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
}

add_action('add_meta_boxes', 'add_certification_meta_boxes');
function add_certification_meta_boxes() {
    add_meta_box(
        'certification_details',
        '🎓 Certification Details',
        'render_certification_meta_box',
        'certification',
        'normal',
        'high'
    );
}

function render_certification_meta_box($post) {
    wp_nonce_field('certification_meta_box', 'certification_meta_nonce');
    
    $cert_code = get_post_meta($post->ID, '_cert_code', true);
    $cert_official_name = get_post_meta($post->ID, '_cert_official_name', true);
    $exam_cost = get_post_meta($post->ID, '_cert_exam_cost', true);
    $duration = get_post_meta($post->ID, '_cert_duration', true);
    $passing_score = get_post_meta($post->ID, '_cert_passing_score', true);
    $questions_count = get_post_meta($post->ID, '_cert_questions_count', true);
    $difficulty = get_post_meta($post->ID, '_cert_difficulty', true);
    $download_url = get_post_meta($post->ID, '_cert_download_url', true);
    $premium = get_post_meta($post->ID, '_cert_premium', true);
    $featured = get_post_meta($post->ID, '_cert_featured', true);
    
    ?>
    <style>
        .cert-meta-row {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .cert-meta-row label {
            width: 180px;
            font-weight: 600;
        }
        .cert-meta-row input[type="text"],
        .cert-meta-row select {
            flex: 1;
            padding: 8px;
        }
    </style>
    
    <div class="cert-meta-row">
        <label>Certification Code:</label>
        <input type="text" name="cert_code" value="<?php echo esc_attr($cert_code); ?>" placeholder="e.g., SAA-C03" />
        <small style="margin-left: 10px; color: #666;">Official exam code</small>
    </div>
    
    <div class="cert-meta-row">
        <label>Official Name:</label>
        <input type="text" name="cert_official_name" value="<?php echo esc_attr($cert_official_name); ?>" placeholder="e.g., AWS Certified Solutions Architect - Associate" />
    </div>
    
    <div class="cert-meta-row">
        <label>Exam Cost:</label>
        <input type="text" name="cert_exam_cost" value="<?php echo esc_attr($exam_cost); ?>" placeholder="e.g., $150 USD" />
    </div>
    
    <div class="cert-meta-row">
        <label>Exam Duration:</label>
        <input type="text" name="cert_duration" value="<?php echo esc_attr($duration); ?>" placeholder="e.g., 130 minutes" />
    </div>
    
    <div class="cert-meta-row">
        <label>Passing Score:</label>
        <input type="text" name="cert_passing_score" value="<?php echo esc_attr($passing_score); ?>" placeholder="e.g., 720/1000" />
    </div>
    
    <div class="cert-meta-row">
        <label>Number of Questions:</label>
        <input type="text" name="cert_questions_count" value="<?php echo esc_attr($questions_count); ?>" placeholder="e.g., 65" />
    </div>
    
    <div class="cert-meta-row">
        <label>Difficulty Level:</label>
        <select name="cert_difficulty">
            <option value="">Select Difficulty</option>
            <option value="Beginner" <?php selected($difficulty, 'Beginner'); ?>>Beginner</option>
            <option value="Intermediate" <?php selected($difficulty, 'Intermediate'); ?>>Intermediate</option>
            <option value="Advanced" <?php selected($difficulty, 'Advanced'); ?>>Advanced</option>
            <option value="Expert" <?php selected($difficulty, 'Expert'); ?>>Expert</option>
        </select>
    </div>
    
    <div class="cert-meta-row">
        <label>Download URL (PDF):</label>
        <input type="text" name="cert_download_url" value="<?php echo esc_attr($download_url); ?>" placeholder="https://..." />
    </div>
    
    <div class="cert-meta-row">
        <label>
            <input type="checkbox" name="cert_premium" value="1" <?php checked($premium, '1'); ?> />
            Premium Content (requires subscription)
        </label>
    </div>
    
    <div class="cert-meta-row">
        <label>
            <input type="checkbox" name="cert_featured" value="1" <?php checked($featured, '1'); ?> />
            Featured Certification (show on homepage)
        </label>
    </div>
    <?php
}

add_action('save_post', 'save_certification_meta_box');
function save_certification_meta_box($post_id) {
    if (!isset($_POST['certification_meta_nonce']) || !wp_verify_nonce($_POST['certification_meta_nonce'], 'certification_meta_box')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    
    $fields = array(
        'cert_code',
        'cert_official_name',
        'cert_exam_cost',
        'cert_duration',
        'cert_passing_score',
        'cert_questions_count',
        'cert_difficulty',
        'cert_download_url',
    );
    
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
        }
    }
    
    update_post_meta($post_id, '_cert_premium', isset($_POST['cert_premium']) ? '1' : '0');
    update_post_meta($post_id, '_cert_featured', isset($_POST['cert_featured']) ? '1' : '0');
    
    if (!get_post_meta($post_id, '_cert_downloads_count', true)) {
        update_post_meta($post_id, '_cert_downloads_count', 0);
    }
}

add_action('rest_api_init', 'register_certification_rest_fields');
function register_certification_rest_fields() {
    $meta_fields = array(
        'cert_code',
        'cert_official_name',
        'cert_exam_cost',
        'cert_duration',
        'cert_passing_score',
        'cert_questions_count',
        'cert_difficulty',
        'cert_download_url',
        'cert_premium',
        'cert_featured',
        'cert_downloads_count',
    );
    
    foreach ($meta_fields as $field) {
        register_rest_field('certification', $field, array(
            'get_callback' => function($post) use ($field) {
                return get_post_meta($post['id'], '_' . $field, true);
            },
            'schema' => array(
                'description' => ucwords(str_replace('_', ' ', $field)),
                'type' => 'string',
            )
        ));
    }
    
    register_rest_field('certification', 'provider', array(
        'get_callback' => function($post) {
            $terms = get_the_terms($post['id'], 'cert_provider');
            if (!$terms || is_wp_error($terms)) return null;
            return array(
                'id' => $terms[0]->term_id,
                'name' => $terms[0]->name,
                'slug' => $terms[0]->slug,
            );
        }
    ));
    
    register_rest_field('certification', 'level', array(
        'get_callback' => function($post) {
            $terms = get_the_terms($post['id'], 'cert_level');
            if (!$terms || is_wp_error($terms)) return null;
            return array(
                'id' => $terms[0]->term_id,
                'name' => $terms[0]->name,
                'slug' => $terms[0]->slug,
            );
        }
    ));
    
    register_rest_field('certification', 'resource_types', array(
        'get_callback' => function($post) {
            $terms = get_the_terms($post['id'], 'resource_type');
            if (!$terms || is_wp_error($terms)) return array();
            return array_map(function($term) {
                return array(
                    'id' => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                );
            }, $terms);
        }
    ));
}

add_action('rest_api_init', 'register_certification_endpoints');
function register_certification_endpoints() {
    register_rest_route('wp/v2', '/certifications/featured', array(
        'methods' => 'GET',
        'callback' => 'get_featured_certifications',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('wp/v2', '/certifications/provider/(?P<slug>[a-zA-Z0-9-]+)', array(
        'methods' => 'GET',
        'callback' => 'get_certifications_by_provider',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('wp/v2', '/certifications-by-taxonomy/(?P<taxonomy>[a-zA-Z0-9_]+)/(?P<slug>[a-zA-Z0-9-]+)', array(
        'methods' => 'GET',
        'callback' => 'get_certifications_by_taxonomy',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('wp/v2', '/certifications/(?P<id>\d+)/download', array(
        'methods' => 'POST',
        'callback' => 'track_certification_download',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('wp/v2', '/certifications/stats', array(
        'methods' => 'GET',
        'callback' => 'get_certification_stats',
        'permission_callback' => '__return_true',
    ));
}

function get_certifications_by_taxonomy($request) {
    $taxonomy = $request['taxonomy'];
    $slug = $request['slug'];

    $args = array(
        'post_type' => 'certification',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => $taxonomy,
                'field'    => 'slug',
                'terms'    => $slug,
            ),
        ),
    );

    $query = new WP_Query($args);
    $controller = new WP_REST_Posts_Controller('certification');
    $response = array();

    foreach ($query->posts as $post) {
        $data = $controller->prepare_item_for_response($post, $request);
        $response[] = $controller->prepare_response_for_collection($data);
    }

    return new WP_REST_Response($response, 200);
}

function get_featured_certifications($request) {
    $args = array(
        'post_type' => 'certification',
        'post_status' => 'publish',
        'posts_per_page' => 6,
        'meta_query' => array(
            array(
                'key' => '_cert_featured',
                'value' => '1',
            )
        )
    );
    
    $query = new WP_Query($args);
    $certifications = array();
    
    foreach ($query->posts as $post) {
        $certifications[] = prepare_certification_response($post);
    }
    
    return new WP_REST_Response($certifications, 200);
}

function get_certifications_by_provider($request) {
    $slug = $request['slug'];
    
    $args = array(
        'post_type' => 'certification',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'cert_provider',
                'field' => 'slug',
                'terms' => $slug,
            )
        )
    );
    
    $query = new WP_Query($args);
    $certifications = array();
    
    foreach ($query->posts as $post) {
        $certifications[] = prepare_certification_response($post);
    }
    
    return new WP_REST_Response($certifications, 200);
}

function track_certification_download($request) {
    $post_id = $request['id'];
    
    $current_count = get_post_meta($post_id, '_cert_downloads_count', true);
    $new_count = intval($current_count) + 1;
    update_post_meta($post_id, '_cert_downloads_count', $new_count);
    
    return new WP_REST_Response(array(
        'success' => true,
        'downloads' => $new_count
    ), 200);
}

function get_certification_stats($request) {
    $total = wp_count_posts('certification')->publish;
    
    $providers = get_terms(array(
        'taxonomy' => 'cert_provider',
        'hide_empty' => true,
    ));
    
    $provider_stats = array();
    foreach ($providers as $provider) {
        $provider_stats[] = array(
            'name' => $provider->name,
            'slug' => $provider->slug,
            'count' => $provider->count,
        );
    }
    
    $most_downloaded = new WP_Query(array(
        'post_type' => 'certification',
        'posts_per_page' => 5,
        'meta_key' => '_cert_downloads_count',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
    ));
    
    $popular = array();
    foreach ($most_downloaded->posts as $post) {
        $popular[] = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'downloads' => get_post_meta($post->ID, '_cert_downloads_count', true),
        );
    }
    
    return new WP_REST_Response(array(
        'total_certifications' => $total,
        'providers' => $provider_stats,
        'most_popular' => $popular,
    ), 200);
}

function prepare_certification_response($post) {
    return array(
        'id' => $post->ID,
        'title' => $post->post_title,
        'slug' => $post->post_name,
        'excerpt' => get_the_excerpt($post->ID),
        'content' => apply_filters('the_content', $post->post_content),
        'featured_image' => get_the_post_thumbnail_url($post->ID, 'large'),
        'cert_code' => get_post_meta($post->ID, '_cert_code', true),
        'cert_official_name' => get_post_meta($post->ID, '_cert_official_name', true),
        'exam_cost' => get_post_meta($post->ID, '_cert_exam_cost', true),
        'duration' => get_post_meta($post->ID, '_cert_duration', true),
        'passing_score' => get_post_meta($post->ID, '_cert_passing_score', true),
        'questions_count' => get_post_meta($post->ID, '_cert_questions_count', true),
        'difficulty' => get_post_meta($post->ID, '_cert_difficulty', true),
        'download_url' => get_post_meta($post->ID, '_cert_download_url', true),
        'premium' => get_post_meta($post->ID, '_cert_premium', true) === '1',
        'featured' => get_post_meta($post->ID, '_cert_featured', true) === '1',
        'downloads_count' => get_post_meta($post->ID, '_cert_downloads_count', true),
        'provider' => get_certification_provider($post->ID),
        'level' => get_certification_level($post->ID),
        'resource_types' => get_certification_resource_types($post->ID),
        'date' => $post->post_date,
    );
}

function get_certification_provider($post_id) {
    $terms = get_the_terms($post_id, 'cert_provider');
    if (!$terms || is_wp_error($terms)) return null;
    return array(
        'id' => $terms[0]->term_id,
        'name' => $terms[0]->name,
        'slug' => $terms[0]->slug,
    );
}

function get_certification_level($post_id) {
    $terms = get_the_terms($post_id, 'cert_level');
    if (!$terms || is_wp_error($terms)) return null;
    return array(
        'id' => $terms[0]->term_id,
        'name' => $terms[0]->name,
        'slug' => $terms[0]->slug,
    );
}

function get_certification_resource_types($post_id) {
    $terms = get_the_terms($post_id, 'resource_type');
    if (!$terms || is_wp_error($terms)) return array();
    return array_map(function($term) {
        return array(
            'id' => $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
        );
    }, $terms);
}

// ============================================================================
// CERTIFICATION ADMIN COLUMNS
// ============================================================================

add_filter('manage_certification_posts_columns', 'set_certification_columns');
function set_certification_columns($columns) {
    $new_columns = array();
    $new_columns['cb'] = $columns['cb'];
    $new_columns['title'] = 'Certification';
    $new_columns['cert_code'] = 'Code';
    $new_columns['provider'] = 'Provider';
    $new_columns['level'] = 'Level';
    $new_columns['difficulty'] = 'Difficulty';
    $new_columns['downloads'] = 'Downloads';
    $new_columns['premium'] = 'Premium';
    $new_columns['featured'] = 'Featured';
    $new_columns['date'] = 'Date';
    
    return $new_columns;
}

add_action('manage_certification_posts_custom_column', 'fill_certification_columns', 10, 2);
function fill_certification_columns($column, $post_id) {
    switch ($column) {
        case 'cert_code':
            echo get_post_meta($post_id, '_cert_code', true) ?: '—';
            break;
            
        case 'provider':
            $terms = get_the_terms($post_id, 'cert_provider');
            if ($terms && !is_wp_error($terms)) {
                $provider = $terms[0];
                echo '<span style="background: #0073aa; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">' . esc_html($provider->name) . '</span>';
            } else {
                echo '—';
            }
            break;
            
        case 'level':
            $terms = get_the_terms($post_id, 'cert_level');
            if ($terms && !is_wp_error($terms)) {
                echo esc_html($terms[0]->name);
            } else {
                echo '—';
            }
            break;
            
        case 'difficulty':
            $difficulty = get_post_meta($post_id, '_cert_difficulty', true);
            if ($difficulty) {
                $colors = array(
                    'Beginner' => '#4caf50',
                    'Intermediate' => '#ff9800',
                    'Advanced' => '#f44336',
                    'Expert' => '#9c27b0',
                );
                $color = isset($colors[$difficulty]) ? $colors[$difficulty] : '#999';
                echo '<span style="color: ' . $color . '; font-weight: bold;">⭐ ' . esc_html($difficulty) . '</span>';
            } else {
                echo '—';
            }
            break;
            
        case 'downloads':
            $downloads = get_post_meta($post_id, '_cert_downloads_count', true);
            echo '<strong>' . number_format(intval($downloads)) . '</strong>';
            break;
            
        case 'premium':
            $premium = get_post_meta($post_id, '_cert_premium', true);
            echo $premium === '1' ? '🔒 Yes' : '🆓 Free';
            break;
            
        case 'featured':
            $featured = get_post_meta($post_id, '_cert_featured', true);
            echo $featured === '1' ? '⭐ Yes' : '—';
            break;
    }
}

add_filter('manage_edit-certification_sortable_columns', 'make_certification_columns_sortable');
function make_certification_columns_sortable($columns) {
    $columns['downloads'] = 'downloads';
    $columns['difficulty'] = 'difficulty';
    return $columns;
}

// ============================================================================
// LINK BLOG POSTS TO CERTIFICATIONS
// ============================================================================

add_action('add_meta_boxes', 'add_related_certification_meta_box');
function add_related_certification_meta_box() {
    add_meta_box(
        'related_certification',
        '🎓 Related Certification',
        'render_related_certification_meta_box',
        'post',
        'side',
        'default'
    );
}

function render_related_certification_meta_box($post) {
    wp_nonce_field('related_cert_meta_box', 'related_cert_nonce');
    
    $related_cert = get_post_meta($post->ID, '_related_certification', true);
    
    $certifications = get_posts(array(
        'post_type' => 'certification',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));
    
    echo '<select name="related_certification" style="width: 100%;">';
    echo '<option value="">None</option>';
    
    foreach ($certifications as $cert) {
        $selected = selected($related_cert, $cert->ID, false);
        echo '<option value="' . $cert->ID . '"' . $selected . '>' . esc_html($cert->post_title) . '</option>';
    }
    
    echo '</select>';
    echo '<p style="margin-top: 10px; font-size: 12px; color: #666;">Link this article to a certification resource</p>';
}

add_action('save_post', 'save_related_certification_meta_box');
function save_related_certification_meta_box($post_id) {
    if (!isset($_POST['related_cert_nonce']) || !wp_verify_nonce($_POST['related_cert_nonce'], 'related_cert_meta_box')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    
    if (isset($_POST['related_certification'])) {
        update_post_meta($post_id, '_related_certification', sanitize_text_field($_POST['related_certification']));
    }
}

add_action('rest_api_init', 'add_related_cert_to_posts_api');
function add_related_cert_to_posts_api() {
    register_rest_field('post', 'related_certification', array(
        'get_callback' => function($post) {
            $cert_id = get_post_meta($post['id'], '_related_certification', true);
            if (!$cert_id) return null;
            
            $cert = get_post($cert_id);
            if (!$cert) return null;
            
            return array(
                'id' => $cert->ID,
                'title' => $cert->post_title,
                'slug' => $cert->post_name,
                'link' => get_permalink($cert->ID),
            );
        },
        'schema' => array(
            'description' => 'Related certification resource',
            'type' => 'object',
        )
    ));
}

// ============================================================================
// CERTIFICATION DASHBOARD WIDGET
// ============================================================================

add_action('wp_dashboard_setup', 'add_certification_dashboard_widget');
function add_certification_dashboard_widget() {
    wp_add_dashboard_widget(
        'certification_hub_stats',
        '🎓 Certification Hub Statistics',
        'render_certification_dashboard_widget'
    );
}

function render_certification_dashboard_widget() {
    $total = wp_count_posts('certification')->publish;
    
    $providers = get_terms(array(
        'taxonomy' => 'cert_provider',
        'hide_empty' => true,
    ));
    
    global $wpdb;
    $total_downloads = $wpdb->get_var("
        SELECT SUM(meta_value) 
        FROM {$wpdb->postmeta} 
        WHERE meta_key = '_cert_downloads_count'
    ");
    
    $most_downloaded = new WP_Query(array(
        'post_type' => 'certification',
        'posts_per_page' => 1,
        'meta_key' => '_cert_downloads_count',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
    ));
    
    ?>
    <style>
        .cert-stat-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        .cert-stat-item {
            text-align: center;
            flex: 1;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
            margin: 0 5px;
        }
        .cert-stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #0073aa;
        }
        .cert-stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
    </style>
    
    <div class="cert-stat-box">
        <div class="cert-stat-item">
            <div class="cert-stat-value"><?php echo $total; ?></div>
            <div class="cert-stat-label">Total Resources</div>
        </div>
        <div class="cert-stat-item">
            <div class="cert-stat-value"><?php echo count($providers); ?></div>
            <div class="cert-stat-label">Providers</div>
        </div>
        <div class="cert-stat-item">
            <div class="cert-stat-value"><?php echo number_format($total_downloads); ?></div>
            <div class="cert-stat-label">Total Downloads</div>
        </div>
    </div>
    
    <?php if ($most_downloaded->have_posts()) : ?>
        <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 4px;">
            <strong>🔥 Most Popular:</strong>
            <?php while ($most_downloaded->have_posts()) : $most_downloaded->the_post(); ?>
                <div><?php the_title(); ?> (<?php echo get_post_meta(get_the_ID(), '_cert_downloads_count', true); ?> downloads)</div>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
    <?php endif; ?>
    
    <div style="margin-top: 15px;">
        <strong>Providers:</strong>
        <ul style="margin: 5px 0; padding-left: 20px;">
            <?php foreach ($providers as $provider) : ?>
                <li><?php echo $provider->name; ?> (<?php echo $provider->count; ?> resources)</li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <p style="margin-top: 15px;">
        <a href="<?php echo admin_url('edit.php?post_type=certification'); ?>" class="button button-primary">
            View All Certifications
        </a>
        <a href="<?php echo admin_url('post-new.php?post_type=certification'); ?>" class="button">
            Add New
        </a>
    </p>
    <?php
}

// ============================================================================
// CREATE DEFAULT CERTIFICATION TERMS
// ============================================================================

add_action('admin_init', 'create_default_certification_terms');
function create_default_certification_terms() {
    $providers = array('AWS', 'Azure', 'Snowflake', 'GCP', 'dbt', 'Databricks', 'Apache');
    foreach ($providers as $provider) {
        if (!term_exists($provider, 'cert_provider')) {
            wp_insert_term($provider, 'cert_provider');
        }
    }
    
    $levels = array('Associate', 'Professional', 'Specialty', 'Practitioner', 'Expert', 'Foundational');
    foreach ($levels as $level) {
        if (!term_exists($level, 'cert_level')) {
            wp_insert_term($level, 'cert_level');
        }
    }
    
    $types = array('Cheat Sheet', 'Practice Questions', 'Study Guide', 'Exam Tips', 'Flashcards', 'Video Guide');
    foreach ($types as $type) {
        if (!term_exists($type, 'resource_type')) {
            wp_insert_term($type, 'resource_type');
        }
    }
}

add_action('admin_notices', 'certification_hub_setup_notice');
function certification_hub_setup_notice() {
    $screen = get_current_screen();
    
    if ($screen && $screen->post_type === 'certification') {
        $cert_count = wp_count_posts('certification')->publish;
        
        if ($cert_count == 0) {
            echo '<div class="notice notice-info">';
            echo '<p><strong>🎓 Welcome to Certification Hub!</strong></p>';
            echo '<p>Get started by creating your first certification resource. Add provider, level, and resource type taxonomies to organize your content.</p>';
            echo '<p><a href="' . admin_url('post-new.php?post_type=certification') . '" class="button button-primary">Create First Certification</a></p>';
            echo '</div>';
        }
    }
}

// ============================================================================
// END OF FILE - ALL CODE COMPLETE AND VERIFIED
// ============================================================================
?>
