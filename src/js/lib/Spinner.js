import angular from "angular";
import Class from "../lib/Class";

  var prefixes = ['webkit', 'Moz', 'ms', 'O'], /* Vendor prefixes */
      animations = {}, /* Animation rules keyed by their name */
      useCssAnimations; /* Whether to use CSS animations or setTimeout */

  /**
   * Utility function to create elements. If no tag name is given,
   * a DIV is created. Optionally properties can be passed.
   */
  function createEl(tag, prop) {
    var el = document.createElement(tag || 'div'), n;
    for (n in prop) el[n] = prop[n];
    return el;
  }

  /**
   * Appends children and returns the parent.
   */
  function ins(parent /* child1, child2, ...*/) {
    for (var i = 1, n = arguments.length; i < n; i++)
      parent.appendChild(arguments[i]);
    return parent;
  }

  /**
    * Insert a new stylesheet to hold the keyframe or VML rules.
   */
  var sheet = (function() {
    var el = createEl('style', {type: 'text/css'});
    ins(document.getElementsByTagName('head')[0], el);
    return el.sheet || el.styleSheet;
  }());

  /**
   * Creates an opacity keyframe animation rule and returns its name.
   * Since most mobile Webkits have timing issues with animation-delay,
   * we create separate rules for each line/segment.
   */
  function addAnimation(alpha, trail, i, lines) {
    var name = ['opacity', trail, ~~(alpha * 100), i, lines].join('-'),
        start = 0.01 + i / lines * 100,
        z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha),
        prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase(),
        pre = prefix && '-' + prefix + '-' || '';

    if (!animations[name]) {
      sheet.insertRule(
          '@' + pre + 'keyframes ' + name + '{' +
          '0%{opacity:' + z + '}' +
          start + '%{opacity:' + alpha + '}' +
          (start + 0.01) + '%{opacity:1}' +
          (start + trail) % 100 + '%{opacity:' + alpha + '}' +
          '100%{opacity:' + z + '}' +
          '}', sheet.cssRules.length);

      animations[name] = 1;
    }
    return name;
  }

  /**
   * Tries various vendor prefixes and returns the first supported property.
   */
  function vendor(el, prop) {
    var s = el.style, pp, i;

    prop = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (i = 0; i < prefixes.length; i++) {
      pp = prefixes[i] + prop;
      if (s[pp] !== undefined) return pp;
    }
    if (s[prop] !== undefined) return prop;
  }

  /**
   * Sets multiple style properties at once.
   */
  function css(el, prop) {
    for (var n in prop)
      el.style[vendor(el, n) || n] = prop[n];

    return el;
  }

  /**
   * Fills in default values.
   */
  function merge(obj) {
    for (var i = 1; i < arguments.length; i++) {
      var def = arguments[i];
      for (var n in def)
        if (obj[n] === undefined) obj[n] = def[n];
    }
    return obj;
  }

  /**
   * Returns the line color from the given string or array.
   */
  function getColor(color, idx) {
    return typeof color == 'string' ? color : color[idx % color.length];
  }

  // Built-in defaults

  var defaults = {
    lines: 12,            // The number of lines to draw
    length: 7,            // The length of each line
    width: 5,             // The line thickness
    radius: 10,           // The radius of the inner circle
    rotate: 0,            // Rotation offset
    corners: 1,           // Roundness (0..1)
    color: '#000',        // #rgb or #rrggbb
    direction: 1,         // 1: clockwise, -1: counterclockwise
    speed: 1,             // Rounds per second
    trail: 100,           // Afterglow percentage
    opacity: 1 / 4,         // Opacity of the lines
    fps: 20,              // Frames per second when using setTimeout()
    zIndex: 2e9,          // Use a high z-index by default
    className: 'spinner', // CSS class to assign to the element
    top: '50%',           // center vertically
    left: '50%',          // center horizontally
    position: 'absolute',  // element position
    hwacceleration: true  //hardware acceleration
  },

      Spinner = Class.create('Spinner', {
        statics: {
          defaults: {}
        },

        opts: '',

        el: '',

        constructor: function(o) {
          this.opts = angular.extend({}, o || {}, Spinner.defaults, defaults);
        },

        /**
         * Internal method that adjusts the opacity of a single line.
         * Will be overwritten in VML fallback mode below.
         */
        opacity: function(el, i, val) {
          if (i < el.childNodes.length) el.childNodes[i].style.opacity = val;
        },

        spin: function(target) {
          this.stop();

          var self = this,
              o = self.opts,
              el = self.el = css(createEl(0, {'className': o.className}), {'position': o.position, 'width': 0, 'zIndex': o.zIndex});

          css(el, {
            'left': o.left,
            'top': o.top
          });

          if (target) {
            target.insertBefore(el, target.firstChild || null);
          }

          el.setAttribute('role', 'progressbar');
          self.lines(el, self.opts);
          var parentNode = el.parentNode;
          if (parentNode) {
            parentNode.style['display'] = 'block';
          }
          return self;
        },

        stop: function() {
          var el = this.el, parentNode;
          if (el) {
            parentNode = el.parentNode;
            if (parentNode) {
              parentNode.style['display'] = 'none';
              parentNode.removeChild(el);
            }
            this.el = undefined;
          }
          return this;
        },

        lines: function(el, o) {
          var i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, seg;

          function fill(color, shadow) {
            return css(createEl(), {
              position: 'absolute',
              width: (o.length + o.width) + 'px',
              height: o.width + 'px',
              background: color,
              boxShadow: shadow,
              transformOrigin: 'left',
              transform: 'rotate(' + ~~(360 / o.lines * i + o.rotate) + 'deg) translate(' + o.radius + 'px' + ',0)',
              borderRadius: (o.corners * o.width >> 1) + 'px'
            });
          }

          for (; i < o.lines; i++) {
            seg = css(createEl(), {
              position: 'absolute',
              top: 1 + ~(o.width / 2) + 'px',
              transform: o.hwacceleration ? 'translate3d(0,0,0)' : '',
              opacity: o.opacity,
              animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1 / o.speed + 's linear infinite'
            });

            if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2 + 'px'}));
            ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')));
          }
          return el;
        }
      });

  var probe = css(createEl('group'));
  useCssAnimations = vendor(probe, 'animation');

export default Spinner;

