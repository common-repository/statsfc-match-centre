<?php
/*
Plugin Name: StatsFC Match Centre
Plugin URI: https://statsfc.com/match-centre
Description: StatsFC Match Centre
Version: 2.0.1
Author: Will Woodward
Author URI: https://willjw.co.uk
License: GPL2
*/

/*  Copyright 2020  Will Woodward  (email : will@willjw.co.uk)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


/**
 * Define the widget constants
 */
define('STATSFC_MATCH_CENTRE_ID',      'StatsFC_MatchCentre');
define('STATSFC_MATCH_CENTRE_NAME',    'StatsFC Fixtures');
define('STATSFC_MATCH_CENTRE_VERSION', '2.0.1');


/**
 * Adds the widget
 */
class StatsFC_MatchCentre extends WP_Widget
{
    public $isShortcode = false;

    protected static $count = 0;

    private static $defaults = array(
        'title'       => '',
        'key'         => '',
        'team'        => '',
        'date'        => '',
        'timezone'    => 'Europe/London',
        'default_css' => true,
        'omit_errors' => false,
    );

    private static $whitelist = array(
        'team',
        'date',
        'timezone',
        'omitErrors',
        'lang',
    );

    /**
     * Register widget with WordPress
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct(
            STATSFC_MATCH_CENTRE_ID,
            STATSFC_MATCH_CENTRE_NAME,
            array(
                'description' => 'StatsFC Match Centre',
            )
        );
    }

    /**
     * Back-end widget form
     *
     * @see WP_Widget::form()
     *
     * @param array $instance Previously saved values from database
     *
     * @return void
     */
    public function form($instance)
    {
        $instance    = wp_parse_args((array) $instance, self::$defaults);
        $title       = strip_tags($instance['title']);
        $key         = strip_tags($instance['key']);
        $team        = strip_tags($instance['team']);
        $date        = strip_tags($instance['date']);
        $timezone    = strip_tags($instance['timezone']);
        $default_css = strip_tags($instance['default_css']);
        $omit_errors = strip_tags($instance['omit_errors']);
        ?>
        <p>
            <label>
                <?php _e('Title', STATSFC_MATCH_CENTRE_ID); ?>
                <input class="widefat" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo esc_attr($title); ?>">
            </label>
        </p>
        <p>
            <label>
                <?php _e('Key', STATSFC_MATCH_CENTRE_ID); ?>
                <input class="widefat" name="<?php echo $this->get_field_name('key'); ?>" type="text" value="<?php echo esc_attr($key); ?>">
            </label>
        </p>
        <p>
            <label>
                <?php _e('Team', STATSFC_MATCH_CENTRE_ID); ?>
                <input class="widefat" name="<?php echo $this->get_field_name('team'); ?>" type="text" value="<?php echo esc_attr($team); ?>" placeholder="e.g., Liverpool, Manchester City">
            </label>
        </p>
        <p>
            <label>
                <?php _e('Date', STATSFC_MATCH_CENTRE_ID); ?>
                <input class="widefat" name="<?php echo $this->get_field_name('date'); ?>" type="text" value="<?php echo esc_attr($date); ?>" placeholder="e.g., <?php echo date('Y-m-d'); ?>">
            </label>
        </p>
        <p>
            <label>
                <?php _e('Timezone', STATSFC_MATCH_CENTRE_ID); ?>
                <select class="widefat" name="<?php echo $this->get_field_name('timezone'); ?>">
                    <?php
                    $zones = timezone_identifiers_list();

                    foreach ($zones as $zone) {
                        $selected = ($zone == $timezone ? ' selected' : '');

                        echo '<option value="' . esc_attr($zone) . '"' . $selected . '>' . esc_attr($zone) . '</option>' . PHP_EOL;
                    }
                    ?>
                </select>
            </label>
        </p>
        <p>
            <label>
                <?php _e('Use default styles?', STATSFC_MATCH_CENTRE_ID); ?>
                <input type="checkbox" name="<?php echo $this->get_field_name('default_css'); ?>"<?php echo ($default_css == 'on' ? ' checked' : ''); ?>>
            </label>
        </p>
        <p>
            <label>
                <?php _e('Omit error messages?', STATSFC_MATCH_CENTRE_ID); ?>
                <input type="checkbox" name="<?php echo $this->get_field_name('omit_errors'); ?>"<?php echo ($omit_errors == 'on' ? ' checked' : ''); ?>>
            </label>
        </p>
    <?php
    }

    /**
     * Sanitize widget form values as they are saved
     *
     * @see WP_Widget::update()
     *
     * @param array $new_instance Values just sent to be saved
     * @param array $old_instance Previously saved values from database
     *
     * @return array Updated safe values to be saved
     */
    public function update($new_instance, $old_instance)
    {
        $instance                = $old_instance;
        $instance['title']       = strip_tags($new_instance['title']);
        $instance['key']         = strip_tags($new_instance['key']);
        $instance['team']        = strip_tags($new_instance['team']);
        $instance['date']        = strip_tags($new_instance['date']);
        $instance['timezone']    = strip_tags($new_instance['timezone']);
        $instance['default_css'] = strip_tags($new_instance['default_css']);
        $instance['omit_errors'] = strip_tags($new_instance['omit_errors']);

        return $instance;
    }

    /**
     * Front-end display of widget
     *
     * @see WP_Widget::widget()
     *
     * @param array $args     Widget arguments
     * @param array $instance Saved values from database
     *
     * @return string|void
     */
    public function widget($args, $instance)
    {
        extract($args);

        $title       = apply_filters('widget_title', (array_key_exists('title', $instance) ? $instance['title'] : ''));
        $unique_id   = ++static::$count;
        $key         = (array_key_exists('key', $instance) ? $instance['key'] : '');
        $referer     = (array_key_exists('HTTP_HOST', $_SERVER) ? $_SERVER['HTTP_HOST'] : '');
        $default_css = (array_key_exists('default_css', $instance) && filter_var($instance['default_css'], FILTER_VALIDATE_BOOLEAN));

        $options = array(
            'team'       => (array_key_exists('team', $instance) ? $instance['team'] : ''),
            'date'       => (array_key_exists('date', $instance) ? $instance['date'] : ''),
            'timezone'   => (array_key_exists('timezone', $instance) ? $instance['timezone'] : ''),
            'omitErrors' => (array_key_exists('omit_errors', $instance) && isset($instance['omit_errors']) && filter_var($instance['omit_errors'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false'),
            'lang'       => substr(get_bloginfo('language'), 0, 2),
        );

        $html = '';

        if (isset($before_widget)) {
            $html .= $before_widget;
        }

        if (isset($before_title)) {
            $html .= $before_title;
        }

        $html .= $title;

        if (isset($after_title)) {
            $html .= $after_title;
        }

        $html .= '<div id="statsfc-match-centre-' . $unique_id . '"></div>' . PHP_EOL;

        if (isset($after_widget)) {
            $html .= $after_widget;
        }

        // Enqueue 3rd party tooltip library
        wp_enqueue_style('tipso', plugins_url('tipso.min.css', __FILE__));
        wp_enqueue_script('tipso', plugins_url('tipso.min.js', __FILE__), array('jquery'), null, true);

        // Enqueue CSS
        if ($default_css) {
            wp_enqueue_style(
                STATSFC_MATCH_CENTRE_ID,
                plugins_url('match-centre.css', __FILE__),
                null,
                STATSFC_MATCH_CENTRE_VERSION
            );
        }

        // Enqueue base JS
        wp_enqueue_script(
            STATSFC_MATCH_CENTRE_ID,
            plugins_url('match-centre.js', __FILE__),
            array('jquery'),
            STATSFC_MATCH_CENTRE_VERSION,
            true
        );

        // Enqueue widget JS
        $object = 'statsfc_match_centre_' . $unique_id;

        $script  = '<script>' . PHP_EOL;
        $script .= 'var ' . $object . ' = new StatsFC_MatchCentre(' . json_encode($key) . ');' . PHP_EOL;
        $script .= $object . '.referer = ' . json_encode($referer) . ';' . PHP_EOL;

        foreach (static::$whitelist as $parameter) {
            if (! array_key_exists($parameter, $options)) {
                continue;
            }

            $script .= $object . '.' . $parameter . ' = ' . json_encode($options[$parameter]) . ';' . PHP_EOL;
        }

        $script .= $object . '.display("statsfc-match-centre-' . $unique_id . '");' . PHP_EOL;
        $script .= '</script>';

        add_action('wp_print_footer_scripts', function () use ($script) {
            echo $script;
        });

        if ($this->isShortcode) {
            return $html;
        } else {
            echo $html;
        }
    }

    /**
     * Display the widget from the shortcode
     *
     * @param  array  $atts
     * @return string
     */
    public static function shortcode($atts)
    {
        $args = shortcode_atts(self::$defaults, $atts);

        $widget              = new self;
        $widget->isShortcode = true;

        return $widget->widget(array(), $args);
    }
}


/**
 * Register the widget
 */
add_action('widgets_init', function () {
    register_widget(STATSFC_MATCH_CENTRE_ID);
});


/**
 * Register the shortcode
 */
add_shortcode('statsfc-match-centre', STATSFC_MATCH_CENTRE_ID . '::shortcode');
