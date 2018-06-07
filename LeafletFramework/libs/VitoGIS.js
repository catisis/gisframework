/*
 Leaflet 1.0.0-beta.2 ("c732ffd"), a JS library for interactive maps. http://leafletjs.com
 (c) 2010-2015 Vladimir Agafonkin, (c) 2010-2011 CloudMade
*/
(function (window, document, undefined) {
var L = {
	version: '1.0.0-beta.2'
};

function expose() {
	var oldL = window.L;

	L.noConflict = function () {
		window.L = oldL;
		return this;
	};

	window.L = L;
}

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = L;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(L);
}

// define Leaflet as a global L variable, saving the original L to restore later if needed
if (typeof window !== 'undefined') {
	expose();
}



/*
 * L.Util contains various utility functions used throughout Leaflet code.
 */

L.Util = {
	// extend an object with properties of one or more other objects
	extend: function (dest) {
		var i, j, len, src;

		for (j = 1, len = arguments.length; j < len; j++) {
			src = arguments[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},

	// create an object from a given prototype
	create: Object.create || (function () {
		function F() {}
		return function (proto) {
			F.prototype = proto;
			return new F();
		};
	})(),

	// bind a function to be called with a given context
	bind: function (fn, obj) {
		var slice = Array.prototype.slice;

		if (fn.bind) {
			return fn.bind.apply(fn, slice.call(arguments, 1));
		}

		var args = slice.call(arguments, 2);

		return function () {
			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
		};
	},

	// return unique ID of an object
	stamp: function (obj) {
		if(obj.feature && obj.feature.id)
			return obj.feature.id;
		if(obj.id)
			return obj.id;
		/*eslint-disable */
		obj._leaflet_id = obj._leaflet_id || ++L.Util.lastId;
		return obj._leaflet_id;
		/*eslint-enable */
	},

	lastId: 0,

	// return a function that won't be called more often than the given interval
	throttle: function (fn, time, context) {
		var lock, args, wrapperFn, later;

		later = function () {
			// reset lock and call if queued
			lock = false;
			if (args) {
				wrapperFn.apply(context, args);
				args = false;
			}
		};

		wrapperFn = function () {
			if (lock) {
				// called too soon, queue to call later
				args = arguments;

			} else {
				// call and lock until later
				fn.apply(context, arguments);
				setTimeout(later, time);
				lock = true;
			}
		};

		return wrapperFn;
	},

	// wrap the given number to lie within a certain range (used for wrapping longitude)
	wrapNum: function (x, range, includeMax) {
		var max = range[1],
		    min = range[0],
		    d = max - min;
		return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
	},

	// do nothing (used as a noop throughout the code)
	falseFn: function () { return false; },

	// round a given number to a given precision
	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	// trim whitespace from both sides of a string
	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	// split a string into words
	splitWords: function (str) {
		return L.Util.trim(str).split(/\s+/);
	},

	// set options to an object, inheriting parent's options as well
	setOptions: function (obj, options) {
		if (!obj.hasOwnProperty('options')) {
			obj.options = obj.options ? L.Util.create(obj.options) : {};
		}
		for (var i in options) {
			obj.options[i] = options[i];
		}
		return obj.options;
	},

	// make a URL with GET parameters out of a set of properties/values
	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},

	// super-simple templating facility, used for TileLayer URLs
	template: function (str, data) {
		return str.replace(L.Util.templateRe, function (str, key) {
			var value = data[key];

			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);

			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	templateRe: /\{ *([\w_]+) *\}/g,

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	indexOf: function (array, el) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] === el) { return i; }
		}
		return -1;
	},
	objToArray:function(obj){
		var arr = [];
		for(i in obj){
			arr.push(obj[i]);
		}
		return arr;
	},
	// minimal image URI, set to an image when disposing to flush memory
	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {
	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		return window['webkit' + name] || window['moz' + name] || window['ms' + name];
	}

	var lastTime = 0;

	// fallback for IE 7-8
	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer,
	    cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
	               getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };


	L.Util.requestAnimFrame = function (fn, context, immediate) {
		if (immediate && requestFn === timeoutDefer) {
			fn.call(context);
		} else {
			return requestFn.call(window, L.bind(fn, context));
		}
	};

	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};
})();
//��String���getLength����
String.prototype.getLength = function () {
	var len = 0;
	for (var i = 0; i < this.length; i++) {
		if (this.charCodeAt(i) > 127 || this.charCodeAt(i) == 94) {
			len += 2;
		} else {
			len++;
		}
	}
	return len;
}

// shortcuts for most used utility functions
L.extend = L.Util.extend;
L.bind = L.Util.bind;
L.stamp = L.Util.stamp;
L.setOptions = L.Util.setOptions;



/*
 * L.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

L.Class = function () {};

L.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		this.callInitHooks();
	};

	var parentProto = NewClass.__super__ = this.prototype;

	var proto = L.Util.create(parentProto);
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	// inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		L.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (proto.options) {
		props.options = L.Util.extend(L.Util.create(proto.options), props.options);
	}

	// mix given properties into the prototype
	L.extend(proto, props);

	proto._initHooks = [];

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// method for adding properties to prototype
L.Class.include = function (props) {
	L.extend(this.prototype, props);
};

// merge new default options to the Class
L.Class.mergeOptions = function (options) {
	L.extend(this.prototype.options, options);
};

// add a constructor hook
L.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};



/*
 * L.Evented is a base class that Leaflet classes inherit from to handle custom events.
 */

L.Evented = L.Class.extend({

	on: function (types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (var type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}

		} else {
			// types can be a string of space-separated words
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	off: function (types, fn, context) {

		if (!types) {
			// clear all listeners if called without arguments
			delete this._events;

		} else if (typeof types === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}

		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on: function (type, fn, context) {

		var events = this._events = this._events || {},
		    contextId = context && context !== this && L.stamp(context);

		if (contextId) {
			// store listeners with custom context in a separate hash (if it has an id);
			// gives a major performance boost when firing and removing events (e.g. on map object)

			var indexKey = type + '_idx',
			    indexLenKey = type + '_len',
			    typeIndex = events[indexKey] = events[indexKey] || {},
			    id = L.stamp(fn) + '_' + contextId;

			if (!typeIndex[id]) {
				typeIndex[id] = {fn: fn, ctx: context};

				// keep track of the number of keys in the index to quickly check if it's empty
				events[indexLenKey] = (events[indexLenKey] || 0) + 1;
			}

		} else {
			// individual layers mostly use "this" for context and don't fire listeners too often
			// so simple array makes the memory footprint better while not degrading performance

			events[type] = events[type] || [];
			events[type].push({fn: fn});
		}
	},

	_off: function (type, fn, context) {
		var events = this._events,
		    indexKey = type + '_idx',
		    indexLenKey = type + '_len';

		if (!events) { return; }

		if (!fn) {
			// clear all listeners for a type if function isn't specified
			delete events[type];
			delete events[indexKey];
			delete events[indexLenKey];
			return;
		}

		var contextId = context && context !== this && L.stamp(context),
		    listeners, i, len, listener, id;

		if (contextId) {
			id = L.stamp(fn) + '_' + contextId;
			listeners = events[indexKey];

			if (listeners && listeners[id]) {
				listener = listeners[id];
				delete listeners[id];
				events[indexLenKey]--;
			}

		} else {
			listeners = events[type];

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					if (listeners[i].fn === fn) {
						listener = listeners[i];
						listeners.splice(i, 1);
						break;
					}
				}
			}
		}

		// set the removed listener to noop so that's not called if remove happens in fire
		if (listener) {
			listener.fn = L.Util.falseFn;
		}
	},

	fire: function (type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }

		var event = L.Util.extend({}, data, {type: type, target: this}),
		    events = this._events;

		if (events) {
			var typeIndex = events[type + '_idx'],
			    i, len, listeners, id;

			if (events[type]) {
				// make sure adding/removing listeners inside other listeners won't cause infinite loop
				listeners = events[type].slice();

				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].fn.call(this, event);
				}
			}

			// fire event for the context-indexed listeners as well
			for (id in typeIndex) {
				typeIndex[id].fn.call(typeIndex[id].ctx, event);
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	listens: function (type, propagate) {
		var events = this._events;

		if (events && (events[type] || events[type + '_len'])) { return true; }

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) { return true; }
			}
		}
		return false;
	},

	once: function (types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		var handler = L.bind(function () {
			this
			    .off(types, fn, context)
			    .off(types, handler, context);
		}, this);

		// add a listener that's executed once and removed after that
		return this
		    .on(types, fn, context)
		    .on(types, handler, context);
	},

	// adds a parent to propagate events to (when you fire with true as a 3rd argument)
	addEventParent: function (obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[L.stamp(obj)] = obj;
		return this;
	},

	removeEventParent: function (obj) {
		if (this._eventParents) {
			delete this._eventParents[L.stamp(obj)];
		}
		return this;
	},

	_propagateEvent: function (e) {
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, L.extend({layer: e.target}, e), true);
		}
	}
});

var proto = L.Evented.prototype;

// aliases; we should ditch those eventually
proto.addEventListener = proto.on;
proto.removeEventListener = proto.clearAllEventListeners = proto.off;
proto.addOneTimeEventListener = proto.once;
proto.fireEvent = proto.fire;
proto.hasEventListeners = proto.listens;

L.Mixin = {Events: proto};



/*
 * L.Browser handles different browser and feature detections for internal Leaflet use.
 */

(function () {

	var ua = navigator.userAgent.toLowerCase(),
	    doc = document.documentElement,

	    ie = 'ActiveXObject' in window,

	    webkit    = ua.indexOf('webkit') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android23 = ua.search('android [23]') !== -1,
	    chrome    = ua.indexOf('chrome') !== -1,
	    gecko     = ua.indexOf('gecko') !== -1  && !webkit && !window.opera && !ie,

	    mobile = typeof orientation !== 'undefined' || ua.indexOf('mobile') !== -1,
	    msPointer = !window.PointerEvent && window.MSPointerEvent,
	    pointer = (window.PointerEvent && navigator.pointerEnabled) || msPointer,

	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera12 = 'OTransition' in doc.style;

	var touch = !window.L_NO_TOUCH && !phantomjs && (pointer || 'ontouchstart' in window ||
			(window.DocumentTouch && document instanceof window.DocumentTouch));

	L.Browser = {
		ie: ie,
		ielt9: ie && !document.addEventListener,
		webkit: webkit,
		gecko: gecko,
		android: ua.indexOf('android') !== -1,
		android23: android23,
		chrome: chrome,
		safari: !chrome && ua.indexOf('safari') !== -1,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera12: opera12,
		any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,
		mobileGecko: mobile && gecko,

		touch: !!touch,
		msPointer: !!msPointer,
		pointer: !!pointer,

		retina: (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1
	};

}());



/*
 * L.Point represents a point with x and y coordinates.
 */

L.Point = function (x, y, round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

L.Point.prototype = {

	clone: function () {
		return new L.Point(this.x, this.y);
	},

	// non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(L.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	subtract: function (point) {
		return this.clone()._subtract(L.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	scaleBy: function (point) {
		return new L.Point(this.x * point.x, this.y * point.y);
	},

	unscaleBy: function (point) {
		return new L.Point(this.x / point.x, this.y / point.y);
	},

	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	ceil: function () {
		return this.clone()._ceil();
	},

	_ceil: function () {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	},

	distanceTo: function (point) {
		point = L.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	equals: function (point) {
		point = L.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	contains: function (point) {
		point = L.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	toString: function () {
		return 'Point(' +
		        L.Util.formatNum(this.x) + ', ' +
		        L.Util.formatNum(this.y) + ')';
	}
};

L.point = function (x, y, round) {
	if (x instanceof L.Point) {
		return x;
	}
	if (L.Util.isArray(x)) {
		return new L.Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new L.Point(x, y, round);
};



/*
 * L.Bounds represents a rectangular area on the screen in pixel coordinates.
 */

L.Bounds = function (a, b) { // (Point, Point) or Point[]
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

L.Bounds.prototype = {
	// extend the bounds to contain the given point
	extend: function (point) { // (Point)
		point = L.point(point);

		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	getCenter: function (round) { // (Boolean) -> Point
		return new L.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	getBottomLeft: function () { // -> Point
		return new L.Point(this.min.x, this.max.y);
	},

	getTopRight: function () { // -> Point
		return new L.Point(this.max.x, this.min.y);
	},

	getSize: function () {
		return this.max.subtract(this.min);
	},

	contains: function (obj) { // (Bounds) or (Point) -> Boolean
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof L.Point) {
			obj = L.point(obj);
		} else {
			obj = L.bounds(obj);
		}

		if (obj instanceof L.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	overlaps: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xOverlaps = (max2.x > min.x) && (min2.x < max.x),
		    yOverlaps = (max2.y > min.y) && (min2.y < max.y);

		return xOverlaps && yOverlaps;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};

L.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
	if (!a || a instanceof L.Bounds) {
		return a;
	}
	return new L.Bounds(a, b);
};



/*
 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};



/*
 * L.DomUtil contains various utility functions for working with DOM.
 */

L.DomUtil = {
	get: function (id) {
		return typeof id === 'string' ? document.getElementById(id) : id;
	},

	getStyle: function (el, style) {

		var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
			parent.removeChild(el);
		}
	},

	empty: function (el) {
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	},

	toFront: function (el) {
		el.parentNode.appendChild(el);
	},

	toBack: function (el) {
		var parent = el.parentNode;
		parent.insertBefore(el, parent.firstChild);
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = L.DomUtil.getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = L.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!L.DomUtil.hasClass(el, name)) {
			var className = L.DomUtil.getClass(el);
			L.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			L.DomUtil.setClass(el, L.Util.trim((' ' + L.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {
			L.DomUtil._setOpacityIE(el, value);
		}
	},

	_setOpacityIE: function (el, value) {
		var filter = false,
		    filterName = 'DXImageTransform.Microsoft.Alpha';

		// filters collection throws an error if we try to retrieve a filter that doesn't exist
		try {
			filter = el.filters.item(filterName);
		} catch (e) {
			// don't set opacity to 1 if we haven't already set an opacity,
			// it isn't needed and breaks transparent pngs.
			if (value === 1) { return; }
		}

		value = Math.round(value * 100);

		if (filter) {
			filter.Enabled = (value !== 100);
			filter.Opacity = value;
		} else {
			el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	setTransform: function (el, offset, scale) {
		var pos = offset || new L.Point(0, 0);

		el.style[L.DomUtil.TRANSFORM] =
			(L.Browser.ie3d ?
				'translate(' + pos.x + 'px,' + pos.y + 'px)' :
				'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
			(scale ? ' scale(' + scale + ')' : '');
	},

	setPosition: function (el, point) { // (HTMLElement, Point[, Boolean])

		/*eslint-disable */
		el._leaflet_pos = point;
		/*eslint-enable */

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(el, point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		return el._leaflet_pos;
	}
};


(function () {
	// prefix style property names

	L.DomUtil.TRANSFORM = L.DomUtil.testProp(
			['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);


	// webkitTransition comes first because some browser versions that drop vendor prefix don't do
	// the same for the transitionend event, in particular the Android 4.1 stock browser

	var transition = L.DomUtil.TRANSITION = L.DomUtil.testProp(
			['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

	L.DomUtil.TRANSITION_END =
			transition === 'webkitTransition' || transition === 'OTransition' ? transition + 'End' : 'transitionend';


	if ('onselectstart' in document) {
		L.DomUtil.disableTextSelection = function () {
			L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);
		};
		L.DomUtil.enableTextSelection = function () {
			L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);
		};

	} else {
		var userSelectProperty = L.DomUtil.testProp(
			['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

		L.DomUtil.disableTextSelection = function () {
			if (userSelectProperty) {
				var style = document.documentElement.style;
				this._userSelect = style[userSelectProperty];
				style[userSelectProperty] = 'none';
			}
		};
		L.DomUtil.enableTextSelection = function () {
			if (userSelectProperty) {
				document.documentElement.style[userSelectProperty] = this._userSelect;
				delete this._userSelect;
			}
		};
	}

	L.DomUtil.disableImageDrag = function () {
		L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);
	};
	L.DomUtil.enableImageDrag = function () {
		L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);
	};

	L.DomUtil.preventOutline = function (element) {
		while (element.tabIndex === -1) {
			element = element.parentNode;
		}
		if (!element || !element.style) { return; }
		L.DomUtil.restoreOutline();
		this._outlineElement = element;
		this._outlineStyle = element.style.outline;
		element.style.outline = 'none';
		L.DomEvent.on(window, 'keydown', L.DomUtil.restoreOutline, this);
	};
	L.DomUtil.restoreOutline = function () {
		if (!this._outlineElement) { return; }
		this._outlineElement.style.outline = this._outlineStyle;
		delete this._outlineElement;
		delete this._outlineStyle;
		L.DomEvent.off(window, 'keydown', L.DomUtil.restoreOutline, this);
	};
})();



/*
 * L.LatLng represents a geographical point with latitude and longitude coordinates.
 */

L.LatLng = function (lat, lng, alt) {
	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	this.lat = +lat;
	this.lng = +lng;

	if (alt !== undefined) {
		this.alt = +alt;
	}
};

L.LatLng.prototype = {
	equals: function (obj, maxMargin) {
		if (!obj) { return false; }

		obj = L.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
	},

	toString: function (precision) {
		return 'LatLng(' +
		        L.Util.formatNum(this.lat, precision) + ', ' +
		        L.Util.formatNum(this.lng, precision) + ')';
	},

	distanceTo: function (other) {
		return L.CRS.Earth.distance(this, L.latLng(other));
	},

	wrap: function () {
		return L.CRS.Earth.wrapLatLng(this);
	},

	toBounds: function (sizeInMeters) {
		var latAccuracy = 180 * sizeInMeters / 40075017,
		    lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

		return L.latLngBounds(
		        [this.lat - latAccuracy, this.lng - lngAccuracy],
		        [this.lat + latAccuracy, this.lng + lngAccuracy]);
	},

	clone: function () {
		return new L.LatLng(this.lat, this.lng, this.alt);
	}
};


// constructs LatLng with different signatures
// (LatLng) or ([Number, Number]) or (Number, Number) or (Object)

L.latLng = function (a, b, c) {
	if (a instanceof L.LatLng) {
		return a;
	}
	if (L.Util.isArray(a) && typeof a[0] !== 'object') {
		if (a.length === 3) {
			return new L.LatLng(a[0], a[1], a[2]);
		}
		if (a.length === 2) {
			return new L.LatLng(a[0], a[1]);
		}
		return null;
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
	}
	if (b === undefined) {
		return null;
	}
	return new L.LatLng(a, b, c);
};



/*
 * L.LatLngBounds represents a rectangular area on the map in geographical coordinates.
 */

L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

L.LatLngBounds.prototype = {

	// extend the bounds to contain the given point or bounds
	extend: function (obj) { // (LatLng) or (LatLngBounds)
		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLng) {
			sw2 = obj;
			ne2 = obj;

		} else if (obj instanceof L.LatLngBounds) {
			sw2 = obj._southWest;
			ne2 = obj._northEast;

			if (!sw2 || !ne2) { return this; }

		} else {
			return obj ? this.extend(L.latLng(obj) || L.latLngBounds(obj)) : this;
		}

		if (!sw && !ne) {
			this._southWest = new L.LatLng(sw2.lat, sw2.lng);
			this._northEast = new L.LatLng(ne2.lat, ne2.lng);
		} else {
			sw.lat = Math.min(sw2.lat, sw.lat);
			sw.lng = Math.min(sw2.lng, sw.lng);
			ne.lat = Math.max(ne2.lat, ne.lat);
			ne.lng = Math.max(ne2.lng, ne.lng);
		}

		return this;
	},

	// extend the bounds by a percentage
	pad: function (bufferRatio) { // (Number) -> LatLngBounds
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new L.LatLngBounds(
		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	getCenter: function () { // -> LatLng
		return new L.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	getSouthWest: function () {
		return this._southWest;
	},

	getNorthEast: function () {
		return this._northEast;
	},

	getNorthWest: function () {
		return new L.LatLng(this.getNorth(), this.getWest());
	},

	getSouthEast: function () {
		return new L.LatLng(this.getSouth(), this.getEast());
	},

	getWest: function () {
		return this._southWest.lng;
	},

	getSouth: function () {
		return this._southWest.lat;
	},

	getEast: function () {
		return this._northEast.lng;
	},

	getNorth: function () {
		return this._northEast.lat;
	},

	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {
			obj = L.latLng(obj);
		} else {
			obj = L.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	intersects: function (bounds) { // (LatLngBounds) -> Boolean
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	overlaps: function (bounds) { // (LatLngBounds) -> Boolean
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
		    lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);

		return latOverlaps && lngOverlaps;
	},

	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	equals: function (bounds) { // (LatLngBounds)
		if (!bounds) { return false; }

		bounds = L.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

// TODO International date line?

L.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)
	if (!a || a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
};



/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

L.Projection = {};

L.Projection.LonLat = {
    project: function (latlng) {
        if (L.Util.isArray(latlng)) {
            var points = [];
            for (var i in latlng) {
                points.push(new L.Point(latlng[i].lng, latlng[i].lat));
            }
            return points;
        } else {
            return new L.Point(latlng.lng, latlng.lat);
        }

    },

    unproject: function (point) {
        if (L.Util.isArray(point)) {
            var points = [];
            for (var i in point) {
                points.push(new L.Point(point[i].lng, point[i].lat));
            }
            return points;
        } else {
            return new L.LatLng(point.y, point.x);
        }

    },

    bounds: L.bounds([-180, -90], [180, 90])
};



/*
 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.
 */

L.Projection.SphericalMercator = {

	R: 6378137,
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) {
		var d = Math.PI / 180,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    sin = Math.sin(lat * d);

		return new L.Point(
				this.R * latlng.lng * d,
				this.R * Math.log((1 + sin) / (1 - sin)) / 2);
	},

	unproject: function (point) {
		var d = 180 / Math.PI;

		return new L.LatLng(
			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
			point.x * d / this.R);
	},

	bounds: (function () {
		var d = 6378137 * Math.PI;
		return L.bounds([-d, -d], [d, d]);
	})()
};



/*
 * L.CRS is the base object for all defined CRS (Coordinate Reference Systems) in Leaflet.
 */

L.CRS = {
	// converts geo coords to pixel ones
	latLngToPoint: function (latlng, zoom) {
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	// converts pixel coords to geo coords
	pointToLatLng: function (point, zoom) {
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	// converts geo coords to projection-specific coords (e.g. in meters)
	project: function (latlng) {
		return this.projection.project(latlng);
	},

	// converts projected coords to geo coords
	unproject: function (point) {
		return this.projection.unproject(point);
	},

	// defines how the world scales with zoom
	scale: function (zoom) {
		return 256 * Math.pow(2, zoom);
	},

	zoom: function (scale) {
		return Math.log(scale / 256) / Math.LN2;
	},

	// returns the bounds of the world in projected coords if applicable
	getProjectedBounds: function (zoom) {
		if (this.infinite) { return null; }

		var b = this.projection.bounds,
		    s = this.scale(zoom),
		    min = this.transformation.transform(b.min, s),
		    max = this.transformation.transform(b.max, s);

		return L.bounds(min, max);
	},

	// whether a coordinate axis wraps in a given range (e.g. longitude from -180 to 180); depends on CRS
	// wrapLng: [min, max],
	// wrapLat: [min, max],

	// if true, the coordinate space will be unbounded (infinite in all directions)
	// infinite: false,

	// wraps geo coords in certain ranges if applicable
	wrapLatLng: function (latlng) {
		var lng = this.wrapLng ? L.Util.wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
		    lat = this.wrapLat ? L.Util.wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
		    alt = latlng.alt;

		return L.latLng(lat, lng, alt);
	}
};



/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	},

	zoom: function (scale) {
		return Math.log(scale) / Math.LN2;
	},

	distance: function (latlng1, latlng2) {
		var dx = latlng2.lng - latlng1.lng,
		    dy = latlng2.lat - latlng1.lat;

		return Math.sqrt(dx * dx + dy * dy);
	},

	infinite: true
});



/*
 * L.CRS.Earth is the base class for all CRS representing Earth.
 */

L.CRS.Earth = L.extend({}, L.CRS, {
	wrapLng: [-180, 180],

	R: 6378137,

	// distance between two geographical points using spherical law of cosines approximation
	distance: function (latlng1, latlng2) {
		var rad = Math.PI / 180,
		    lat1 = latlng1.lat * rad,
		    lat2 = latlng2.lat * rad,
		    a = Math.sin(lat1) * Math.sin(lat2) +
		        Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

		return this.R * Math.acos(Math.min(a, 1));
	}
});



/*
 * L.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping and is used by Leaflet by default.
 */

L.CRS.EPSG3857 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:3857',
	projection: L.Projection.SphericalMercator,

	transformation: (function () {
		var scale = 0.5 / (Math.PI * L.Projection.SphericalMercator.R);
		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});

L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
	code: 'EPSG:900913'
});



/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.EPSG4326 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:4326',
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5)
});



/*
 * L.Map is the central class of the API - it is used to create a map.
 */

L.Map = L.Evented.extend({

	options: {
		crs: L.CRS.EPSG3857,

		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: true,
		trackResize: true,
		markerZoomAnimation: true,
		maxBoundsViscosity: 0.0,
		transform3DLimit: 8388608 // Precision limit of a 32-bit float
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.setOptions(this, options);

		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = L.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.zoom !== undefined) {
			this._zoom = this._limitZoom(options.zoom);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];
		this._layers = {};
		this._zoomBoundLayers = {};
		this._sizeChanged = true;

		this.callInitHooks();

		this._addLayers(this.options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	setView: function (center, zoom) {
		zoom = zoom === undefined ? this.getZoom() : zoom;
		this._resetView(L.latLng(center), zoom);
		return this;
	},

	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = zoom;
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	zoomIn: function (delta, options) {
		return this.setZoom(this._zoom + (delta || 1), options);
	},

	zoomOut: function (delta, options) {
		return this.setZoom(this._zoom - (delta || 1), options);
	},

	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	_getBoundsCenterZoom: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

		zoom = options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;

		var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		return {
			center: center,
			zoom: zoom
		};
	},

	fitBounds: function (bounds, options) {
		var target = this._getBoundsCenterZoom(bounds, options);
		return this.setView(target.center, target.zoom, options);
	},

	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.PanAnimation.js
		this.fire('movestart');

		this._rawPanBy(L.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},

	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		if (!bounds) {
			return this.off('moveend', this._panInsideMaxBounds);
		} else if (this.options.maxBounds) {
			this.off('moveend', this._panInsideMaxBounds);
		}

		this.options.maxBounds = bounds;

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds);
	},

	setMinZoom: function (zoom) {
		this.options.minZoom = zoom;

		if (this._loaded && this.getZoom() < this.options.minZoom) {
			return this.setZoom(zoom);
		}

		return this;
	},

	setMaxZoom: function (zoom) {
		this.options.maxZoom = zoom;

		if (this._loaded && (this.getZoom() > this.options.maxZoom)) {
			return this.setZoom(zoom);
		}

		return this;
	},

	panInsideBounds: function (bounds, options) {
		this._enforcingBounds = true;
		var center = this.getCenter(),
		    newCenter = this._limitCenter(center, this._zoom, L.latLngBounds(bounds));

		if (center.equals(newCenter)) { return this; }

		this.panTo(newCenter, options);
		this._enforcingBounds = false;
		return this;
	},

	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = L.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	stop: function () {
		L.Util.cancelAnimFrame(this._flyToFrame);
		if (this._panAnim) {
			this._panAnim.stop();
		}
		return this;
	},

	// TODO handler.addTo
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	remove: function () {

		this._initEvents(true);

		try {
			// throws error in IE6-8
			delete this._container._leaflet;
		} catch (e) {
			this._container._leaflet = undefined;
		}

		L.DomUtil.remove(this._mapPane);

		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		if (this._loaded) {
			this.fire('unload');
		}

		for (var i in this._layers) {
			this._layers[i].remove();
		}

		return this;
	},

	createPane: function (name, container) {
		var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
		    pane = L.DomUtil.create('div', className, container || this._mapPane);

		if (name) {
			this._panes[name] = pane;
		}
		return pane;
	},


	// public methods for getting map state

	getCenter: function () { // (Boolean) -> LatLng
		this._checkIfLoaded();

		if (this._lastCenter && !this._moved()) {
			return this._lastCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
	},

	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = L.latLngBounds(bounds);

		var zoom = this.getMinZoom() - (inside ? 1 : 0),
		    maxZoom = this.getMaxZoom(),
		    size = this.getSize(),

		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),

		    zoomNotFound = true,
		    boundsSize;

		padding = L.point(padding || [0, 0]);

		do {
			zoom++;
			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding).floor();
			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	getPixelBounds: function (center, zoom) {
		var topLeftPoint = this._getTopLeftPoint(center, zoom);
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._pixelOrigin;
	},

	getPixelWorldBounds: function (zoom) {
		return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
	},

	getPane: function (pane) {
		return typeof pane === 'string' ? this._panes[pane] : pane;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom, fromZoom) {
		var crs = this.options.crs;
		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
		return crs.scale(toZoom) / crs.scale(fromZoom);
	},

	getScaleZoom: function (scale, fromZoom) {
		var crs = this.options.crs;
		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
		return crs.zoom(scale * crs.scale(fromZoom));
	},

	// conversion methods

	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},

	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		var projectedPoint = L.point(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	},

	wrapLatLng: function (latlng) {
		return this.options.crs.wrapLatLng(L.latLng(latlng));
	},

	distance: function (latlng1, latlng2) {
		return this.options.crs.distance(L.latLng(latlng1), L.latLng(latlng2));
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return L.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet) {
			throw new Error('Map container is already initialized.');
		}

		L.DomEvent.addListener(container, 'scroll', this._onScroll, this);
		container._leaflet = true;
	},

	_initLayout: function () {
		var container = this._container;

		this._fadeAnimated = this.options.fadeAnimation && L.Browser.any3d;

		L.DomUtil.addClass(container, 'leaflet-container' +
			(L.Browser.touch ? ' leaflet-touch' : '') +
			(L.Browser.retina ? ' leaflet-retina' : '') +
			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(L.Browser.safari ? ' leaflet-safari' : '') +
			(this._fadeAnimated ? ' leaflet-fade-anim' : ''));

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};
		this._paneRenderers = {};

		this._mapPane = this.createPane('mapPane', this._container);
		L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

		this.createPane('tilePane');
		this.createPane('shadowPane');
		this.createPane('overlayPane');
		this.createPane('markerPane');
		this.createPane('popupPane');

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, 'leaflet-zoom-hide');
			L.DomUtil.addClass(panes.shadowPane, 'leaflet-zoom-hide');
		}
	},


	// private methods that modify map state

	_resetView: function (center, zoom) {
		L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

		var loading = !this._loaded;
		this._loaded = true;
		zoom = this._limitZoom(zoom);

		var zoomChanged = this._zoom !== zoom;
		this
			._moveStart(zoomChanged)
			._move(center, zoom)
			._moveEnd(zoomChanged);

		this.fire('viewreset');

		if (loading) {
			this.fire('load');
		}
	},

	_moveStart: function (zoomChanged) {
		if (zoomChanged) {
			this.fire('zoomstart');
		}
		return this.fire('movestart');
	},

	_move: function (center, zoom, data) {
		if (zoom === undefined) {
			zoom = this._zoom;
		}

		var zoomChanged = this._zoom !== zoom;

		this._zoom = zoom;
		this._lastCenter = center;
		this._pixelOrigin = this._getNewPixelOrigin(center);

		if (zoomChanged) {
			this.fire('zoom', data);
		}
		return this.fire('move', data);
	},

	_moveEnd: function (zoomChanged) {
		if (zoomChanged) {
			this.fire('zoomend');
		}
		return this.fire('moveend');
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_panInsideMaxBounds: function () {
		if (!this._enforcingBounds) {
			this.panInsideBounds(this.options.maxBounds);
		}
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// DOM event handling

	_initEvents: function (remove) {
		if (!L.DomEvent) { return; }

		this._targets = {};
		this._targets[L.stamp(this._container)] = this;

		var onOff = remove ? 'off' : 'on';

		L.DomEvent[onOff](this._container, 'click dblclick mousedown mouseup ' +
			'mouseover mouseout mousemove contextmenu keypress', this._handleDOMEvent, this);

		if (this.options.trackResize) {
			L.DomEvent[onOff](window, 'resize', this._onResize, this);
		}

		if (L.Browser.any3d && this.options.transform3DLimit) {
			this[onOff]('moveend', this._onMoveEnd);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this);
	},

	_onScroll: function () {
		this._container.scrollTop  = 0;
		this._container.scrollLeft = 0;
	},

	_onMoveEnd: function () {
		var pos = this._getMapPanePos();
		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
			// a pixel offset on very high values, see: http://jsfiddle.net/dg6r5hhb/
			this._resetView(this.getCenter(), this.getZoom());
		}
	},

	_findEventTargets: function (e, type) {
		var targets = [],
		    target,
		    isHover = type === 'mouseout' || type === 'mouseover',
		    src = e.target || e.srcElement;

		while (src) {
			target = this._targets[L.stamp(src)];
			if (target && target.listens(type, true)) {
				if (isHover && !L.DomEvent._isExternalTarget(src, e)) { break; }
				targets.push(target);
				if (isHover) { break; }
			}
			if (src === this._container) { break; }
			src = src.parentNode;
		}
		if (!targets.length && !isHover && L.DomEvent._isExternalTarget(src, e)) {
			targets = [this];
		}
		return targets;
	},

	_handleDOMEvent: function (e) {
		if (!this._loaded || L.DomEvent._skipped(e)) { return; }

		// find the layer the event is propagating from and its parents
		var type = e.type === 'keypress' && e.keyCode === 13 ? 'click' : e.type;

		if (e.type === 'click') {
			// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
			var synth = L.Util.extend({}, e);
			synth.type = 'preclick';
			this._handleDOMEvent(synth);
		}

		if (type === 'mousedown') {
			// prevents outline when clicking on keyboard-focusable element
			L.DomUtil.preventOutline(e.target || e.srcElement);
		}

		this._fireDOMEvent(e, type);
	},

	_fireDOMEvent: function (e, type, targets) {

		if (e._stopped) { return; }

		targets = (targets || []).concat(this._findEventTargets(e, type));

		if (!targets.length) { return; }

		var target = targets[0];
		if (type === 'contextmenu' && target.listens(type, true)) {
			L.DomEvent.preventDefault(e);
		}

		// prevents firing click after you just dragged an object
		if ((e.type === 'click' || e.type === 'preclick') && !e._simulated && this._draggableMoved(target)) { return; }

		var data = {
			originalEvent: e
		};

		if (e.type !== 'keypress') {
			var isMarker = target instanceof L.Marker;
			data.containerPoint = isMarker ?
					this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
		}

		for (var i = 0; i < targets.length; i++) {
			targets[i].fire(type, data, true);
			if (data.originalEvent._stopped ||
				(targets[i].options.nonBubblingEvents && L.Util.indexOf(targets[i].options.nonBubblingEvents, type) !== -1)) { return; }
		}
	},

	_draggableMoved: function (obj) {
		obj = obj.options.draggable ? obj : this;
		return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, {target: this});
		} else {
			this.on('load', callback, context);
		}
		return this;
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane) || new L.Point(0, 0);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function (center, zoom) {
		var pixelOrigin = center && zoom !== undefined ?
			this._getNewPixelOrigin(center, zoom) :
			this.getPixelOrigin();
		return pixelOrigin.subtract(this._getMapPanePos());
	},

	_getNewPixelOrigin: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
	},

	_latLngToNewLayerPoint: function (latlng, zoom, center) {
		var topLeft = this._getNewPixelOrigin(center, zoom);
		return this.project(latlng, zoom)._subtract(topLeft);
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),

		    dx = this._rebound(nwOffset.x, -seOffset.x),
		    dy = this._rebound(nwOffset.y, -seOffset.y);

		return new L.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom();
		if (!L.Browser.any3d) { zoom = Math.round(zoom); }

		return Math.max(min, Math.min(max, zoom));
	}
});

L.map = function (id, options) {
	return new L.Map(id, options);
};




L.Layer = L.Evented.extend({

	options: {
		pane: 'overlayPane',
		nonBubblingEvents: []  // Array of events that should not be bubbled to DOM parents (like the map)
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	remove: function () {
		return this.removeFrom(this._map || this._mapToAdd);
	},

	removeFrom: function (obj) {
		if (obj) {
			obj.removeLayer(this);
		}
		return this;
	},

	getPane: function (name) {
		return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
	},

	addInteractiveTarget: function (targetEl) {
		this._map._targets[L.stamp(targetEl)] = this;
		return this;
	},

	removeInteractiveTarget: function (targetEl) {
		delete this._map._targets[L.stamp(targetEl)];
		return this;
	},

	_layerAdd: function (e) {
		var map = e.target;

		// check in case layer gets added and then removed before the map is ready
		if (!map.hasLayer(this)) { return; }

		this._map = map;
		this._zoomAnimated = map._zoomAnimated;

		if (this.getEvents) {
			map.on(this.getEvents(), this);
		}

		this.onAdd(map);

		if (this.getAttribution && this._map.attributionControl) {
			this._map.attributionControl.addAttribution(this.getAttribution());
		}

		this.fire('add');
		map.fire('layeradd', {layer: this});
	}
});


L.Map.include({
	addLayer: function (layer) {
		var id = L.stamp(layer);
		if (this._layers[id]) { return layer; }
		this._layers[id] = layer;

		layer._mapToAdd = this;

		if (layer.beforeAdd) {
			layer.beforeAdd(this);
		}

		this.whenReady(layer._layerAdd, layer);

		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		if (layer.getAttribution && this.attributionControl) {
			this.attributionControl.removeAttribution(layer.getAttribution());
		}

		if (layer.getEvents) {
			this.off(layer.getEvents(), layer);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
			layer.fire('remove');
		}

		layer._map = layer._mapToAdd = null;

		return this;
	},

	hasLayer: function (layer) {
		return !!layer && (L.stamp(layer) in this._layers);
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	_addLayers: function (layers) {
		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},

	_addZoomLimit: function (layer) {
		if (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
			this._zoomBoundLayers[L.stamp(layer)] = layer;
			this._updateZoomLevels();
		}
	},

	_removeZoomLimit: function (layer) {
		var id = L.stamp(layer);

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}
	},

	_updateZoomLevels: function () {
		var minZoom = Infinity,
		    maxZoom = -Infinity,
		    oldZoomSpan = this._getZoomSpan();

		for (var i in this._zoomBoundLayers) {
			var options = this._zoomBoundLayers[i].options;

			minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
			maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
		}

		this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
		this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	}
});



/**
 * Http请求类
 *
 * 该方法提供Get||Post||Jsonp请求
 * @L.Request
 * @stastic
 *
 * */
(function (window) {
    window._EsriLeafletCallbacks = {};
})(window)

L.Request = {
    callbacks: new Date().getTime(),
    _serialize: function (params) {
        var data = '';
        //  params.f = params.f || 'json';

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var param = params[key];
                var type = Object.prototype.toString.call(param);
                var value;

                if (data.length) {
                    data += '&';
                }

                if (type === '[object Array]') {
                    value = (Object.prototype.toString.call(param[0]) === '[object Object]') ? JSON.stringify(param) : param.join(',');
                } else if (type === '[object Object]') {
                    value = JSON.stringify(param);
                } else if (type === '[object Date]') {
                    value = param.valueOf();
                } else {
                    value = param;
                }

                data += encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }
        }

        return data;
    },

    createRequest: function (callback, context, resultType) {
        resultType = resultType ? resultType : "JSON";
        var httpRequest = new XMLHttpRequest();

        httpRequest.onerror = function (e) {
            httpRequest.onreadystatechange = L.Util.falseFn;

            callback.call(context, {
                error: {
                    code: 500,
                    message: 'XMLHttpRequest error'
                }
            }, null);
        };

        httpRequest.onreadystatechange = function () {
            var response;
            var error;

            if (httpRequest.readyState === 4) {


                if (resultType == "JSON") {
                    try {
                        response = JSON.parse(httpRequest.responseText);
                    } catch (e) {
                        response = null;
                        error = {
                            code: 500,
                            message: 'Could not parse response as JSON. This could also be caused by a CORS or XMLHttpRequest error.'
                        };
                    }
                }
                else {
                    if (httpRequest.status === 200) {
                        response = httpRequest.responseText;
                    } else {
                        response = httpRequest.responseText;
                    }
                }

                if (!error && response.error) {
                    error = response.error;
                    response = null;
                }

                httpRequest.onerror = L.Util.falseFn;

                callback.call(context, error, response);
            }
        };

        return httpRequest;
    },
    /**
     * HTTP post
     *
     *  @method post
     *  @params {[String]} url url
     *  @params {[Object]} params 参数
     *  @params {[Function]} callback 回调
     *  @params {[Object]} context 环境
     *  @params {[String]} resultType 返回类型 当前支持JSON
     * */
    post: function (url, params, callback, context, resultType) {
        var httpRequest = this.createRequest(callback, context, resultType);
        httpRequest.open('POST', url);
        //httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        httpRequest.setRequestHeader('Access-Control-Allow-Headers', '*');
        httpRequest.setRequestHeader('Access-Control-Allow-Origin', '*');
        httpRequest.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
        httpRequest.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.8,en;q=0.6');

        httpRequest.send(params);

        return httpRequest;

    },
    /**
     * HTTP get
     *  @method get
     *  @params {[String]} url url
     *  @params {[Object]} params 参数
     *  @params {[Function]} callback 回调
     *  @params {[Object]} context 环境
     * */
    get: function (url, params, callback, context) {
        var httpRequest = this.createRequest(callback, context),
            requestUrl = url;
        if (params)
            requestUrl += '?' + params;
        httpRequest.open('GET', requestUrl, true);
        httpRequest.setRequestHeader('Access-Control-Allow-Origin', '*');
        httpRequest.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
        httpRequest.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.8,en;q=0.6');
        httpRequest.send(null);

        return httpRequest;
    },
    /**
     * HTTP get 获取text类型的数据
     *  @method getText
     *  @params {[String]} url url
     *  @params {[Object]} params 参数
     *  @params {[Function]} callback 回调
     *  @params {[Object]} context 环境
     * */
    getText: function (url, params, callback, context) {
        var httpRequest = this.createRequest(callback, context, "text"),
            requestUrl = url;
        if (params)
            requestUrl += '?' + params;
        httpRequest.open('GET', requestUrl, true);
        httpRequest.setRequestHeader('Access-Control-Allow-Origin', '*');
        httpRequest.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
        httpRequest.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.8,en;q=0.6');
        httpRequest.send(null);

        return httpRequest;
    },
    /**
     * HTTP 无返回的JSONP
     *  @method noReturnJP
     *  @params {[String]} url url
     *  @params {[Object]} params 参数
     * */
    noReturnJP: function (url, params) {
        var script = L.DomUtil.create('script', null, document.body);
        script.type = 'text/javascript';
        script.src = url + '?' + this._serialize(params);
    },
    /**
     * HTTP JSONP
     *  @method JSONP
     *  @params {[String]} url url
     *  @params {[Object]} params 参数
     *  @params {[Function]} callback 回调
     *  @params {[Object]} context 环境
     * */
    JSONP: function (url, params, callback, context) {

        var callbackId = 'c' + new Date().getTime();

        params.callback = 'window._EsriLeafletCallbacks.' + callbackId;

        var script = L.DomUtil.create('script', null, document.body);
        script.type = 'text/javascript';
        script.src = url + '?' + this._serialize(params);
        script.id = callbackId;


        window._EsriLeafletCallbacks[callbackId] = function (response) {
            if (window._EsriLeafletCallbacks[callbackId] !== true) {
                var error;
                var responseType = Object.prototype.toString.call(response);

                if (!(responseType === '[object Object]' || responseType === '[object Array]')) {
                    error = {
                        error: {
                            code: 500,
                            message: 'Expected array or object as JSONP response'
                        }
                    };
                    response = null;
                }

                if (!error && response.error) {
                    error = response;
                    response = null;
                }

                callback.call(context, error, response);
                //  window._EsriLeafletCallbacks[callbackId] = true;
            }
        };

        this.callbacks++;

        return {
            id: callbackId,
            url: script.src,
            abort: function () {
                window._EsriLeafletCallbacks._callback[callbackId]({
                    code: 0,
                    message: 'Request aborted.'
                });
            }
        };
    }
}




/*
 * Mercator projection that takes into account that the Earth is not a perfect sphere.
 * Less popular than spherical mercator; used by projections like EPSG:3395.
 */

L.Projection.Mercator = {
    R: 6378137,
    R_MINOR: 6356752.314245179,

    bounds: L.bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),

    project: function (latlng) {

        if (L.Util.isArray(latlng)) {
            var points = [];
            for (var i in latlng) {
                var d = Math.PI / 180,
                    r = this.R,
                    y = latlng[i].lat * d,
                    tmp = this.R_MINOR / r,
                    e = Math.sqrt(1 - tmp * tmp),
                    con = e * Math.sin(y);

                var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
                y = -r * Math.log(Math.max(ts, 1E-10));

                points.push(new L.Point(latlng[i].lng * d * r, y));
            }
            return points;
        } else {
            var d = Math.PI / 180,
                r = this.R,
                y = latlng.lat * d,
                tmp = this.R_MINOR / r,
                e = Math.sqrt(1 - tmp * tmp),
                con = e * Math.sin(y);

            var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
            y = -r * Math.log(Math.max(ts, 1E-10));
            return new L.Point(latlng.lng * d * r, y);
        }
    },

    unproject: function (point) {
        var d = 180 / Math.PI,
            r = this.R,
            tmp = this.R_MINOR / r,
            e = Math.sqrt(1 - tmp * tmp),
            ts = Math.exp(-point.y / r),
            phi = Math.PI / 2 - 2 * Math.atan(ts);

        for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
            con = e * Math.sin(phi);
            con = Math.pow((1 - con) / (1 + con), e / 2);
            dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
            phi += dphi;
        }

        return new L.LatLng(phi * d, point.x * d / r);
    }
};



/*
 * L.CRS.EPSG3857 (World Mercator) CRS implementation.
 */

L.CRS.EPSG3395 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:3395',
	projection: L.Projection.Mercator,

	transformation: (function () {
		var scale = 0.5 / (Math.PI * L.Projection.Mercator.R);
		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});



/*
 * L.GridLayer is used as base class for grid-like layers like TileLayer.
 */

L.GridLayer = L.Layer.extend({

	options: {
		pane: 'tilePane',

		tileSize: 256,
		opacity: 1,
		zIndex: 1,

		updateWhenIdle: L.Browser.mobile,
		updateInterval: 200,

		attribution: null,
		bounds: null,

		minZoom: 0
		// maxZoom: <Number>
		// noWrap: false
	},

	initialize: function (options) {
		options = L.setOptions(this, options);
	},

	onAdd: function () {
		this._initContainer();

		this._levels = {};
		this._tiles = {};

		this._resetView();
		this._update();
	},

	beforeAdd: function (map) {
		map._addZoomLimit(this);
	},

	onRemove: function (map) {
		L.DomUtil.remove(this._container);
		map._removeZoomLimit(this);
		this._container = null;
		this._tileZoom = null;
	},

	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._container);
			this._setAutoZIndex(Math.max);
		}
		return this;
	},

	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._container);
			this._setAutoZIndex(Math.min);
		}
		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	isLoading: function () {
		return this._loading;
	},

	redraw: function () {
		if (this._map) {
			this._removeAllTiles();
			this._update();
		}
		return this;
	},

	getEvents: function () {
		var events = {
			viewreset: this._resetAll,
			zoom: this._resetView,
			moveend: this._onMoveEnd
		};

		if (!this.options.updateWhenIdle) {
			// update tiles on move, but not more often than once per given interval
			if (!this._onMove) {
				this._onMove = L.Util.throttle(this._onMoveEnd, this.options.updateInterval, this);
			}

			events.move = this._onMove;
		}

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	createTile: function () {
		return document.createElement('div');
	},

	getTileSize: function () {
		var s = this.options.tileSize;
		return s instanceof L.Point ? s : new L.Point(s, s);
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (compare) {
		// go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)

		var layers = this.getPane().children,
		    edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

		for (var i = 0, len = layers.length, zIndex; i < len; i++) {

			zIndex = layers[i].style.zIndex;

			if (layers[i] !== this._container && zIndex) {
				edgeZIndex = compare(edgeZIndex, +zIndex);
			}
		}

		if (isFinite(edgeZIndex)) {
			this.options.zIndex = edgeZIndex + compare(-1, 1);
			this._updateZIndex();
		}
	},

	_updateOpacity: function () {
		if (!this._map) { return; }

		// IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
		if (L.Browser.ielt9 || !this._map._fadeAnimated) {
			return;
		}

		L.DomUtil.setOpacity(this._container, this.options.opacity);

		var now = +new Date(),
		    nextFrame = false,
		    willPrune = false;

		for (var key in this._tiles) {
			var tile = this._tiles[key];
			if (!tile.current || !tile.loaded) { continue; }

			var fade = Math.min(1, (now - tile.loaded) / 200);

			L.DomUtil.setOpacity(tile.el, fade);
			if (fade < 1) {
				nextFrame = true;
			} else {
				if (tile.active) { willPrune = true; }
				tile.active = true;
			}
		}

		if (willPrune && !this._noPrune) { this._pruneTiles(); }

		if (nextFrame) {
			L.Util.cancelAnimFrame(this._fadeFrame);
			this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
		}
	},

	_initContainer: function () {
		if (this._container) { return; }

		this._container = L.DomUtil.create('div', 'leaflet-layer');
		this._updateZIndex();

		if (this.options.opacity < 1) {
			this._updateOpacity();
		}

		this.getPane().appendChild(this._container);
	},

	_updateLevels: function () {

		var zoom = this._tileZoom,
		    maxZoom = this.options.maxZoom;

		for (var z in this._levels) {
			if (this._levels[z].el.children.length || z === zoom) {
				this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
			} else {
				L.DomUtil.remove(this._levels[z].el);
				delete this._levels[z];
			}
		}

		var level = this._levels[zoom],
		    map = this._map;

		if (!level) {
			level = this._levels[zoom] = {};

			level.el = L.DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
			level.el.style.zIndex = maxZoom;

			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
			level.zoom = zoom;

			this._setZoomTransform(level, map.getCenter(), map.getZoom());

			// force the browser to consider the newly added element for transition
			L.Util.falseFn(level.el.offsetWidth);
		}

		this._level = level;

		return level;
	},

	_pruneTiles: function () {
		var key, tile;

		var zoom = this._map.getZoom();
		if (zoom > this.options.maxZoom ||
			zoom < this.options.minZoom) { return this._removeAllTiles(); }

		for (key in this._tiles) {
			tile = this._tiles[key];
			tile.retain = tile.current;
		}

		for (key in this._tiles) {
			tile = this._tiles[key];
			if (tile.current && !tile.active) {
				var coords = tile.coords;
				if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
					this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
				}
			}
		}

		for (key in this._tiles) {
			if (!this._tiles[key].retain) {
				this._removeTile(key);
			}
		}
	},

	_removeAllTiles: function () {
		for (var key in this._tiles) {
			this._removeTile(key);
		}
	},

	_resetAll: function () {
		for (var z in this._levels) {
			L.DomUtil.remove(this._levels[z].el);
			delete this._levels[z];
		}
		this._removeAllTiles();

		this._tileZoom = null;
		this._resetView();
	},

	_retainParent: function (x, y, z, minZoom) {
		var x2 = Math.floor(x / 2),
		    y2 = Math.floor(y / 2),
		    z2 = z - 1;

		var key = x2 + ':' + y2 + ':' + z2,
		    tile = this._tiles[key];

		if (tile && tile.active) {
			tile.retain = true;
			return true;

		} else if (tile && tile.loaded) {
			tile.retain = true;
		}

		if (z2 > minZoom) {
			return this._retainParent(x2, y2, z2, minZoom);
		}

		return false;
	},

	_retainChildren: function (x, y, z, maxZoom) {

		for (var i = 2 * x; i < 2 * x + 2; i++) {
			for (var j = 2 * y; j < 2 * y + 2; j++) {

				var key = i + ':' + j + ':' + (z + 1),
				    tile = this._tiles[key];

				if (tile && tile.active) {
					tile.retain = true;
					continue;

				} else if (tile && tile.loaded) {
					tile.retain = true;
				}

				if (z + 1 < maxZoom) {
					this._retainChildren(i, j, z + 1, maxZoom);
				}
			}
		}
	},

	_resetView: function (e) {
		var animating = e && (e.pinch || e.flyTo);
		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
	},

	_animateZoom: function (e) {
		this._setView(e.center, e.zoom, true, e.noUpdate);
	},

	_setView: function (center, zoom, noPrune, noUpdate) {
		var tileZoom = Math.round(zoom);
		if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
		    (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
			tileZoom = undefined;
		}

		var tileZoomChanged = (tileZoom !== this._tileZoom);

		if (!noUpdate || tileZoomChanged) {

			this._tileZoom = tileZoom;

			if (this._abortLoading) {
				this._abortLoading();
			}

			this._updateLevels();
			this._resetGrid();

			if (tileZoom !== undefined) {
				this._update(center);
			}

			if (!noPrune) {
				this._pruneTiles();
			}

			// Flag to prevent _updateOpacity from pruning tiles during
			// a zoom anim or a pinch gesture
			this._noPrune = !!noPrune;
		}

		this._setZoomTransforms(center, zoom);
	},

	_setZoomTransforms: function (center, zoom) {
		for (var i in this._levels) {
			this._setZoomTransform(this._levels[i], center, zoom);
		}
	},

	_setZoomTransform: function (level, center, zoom) {
		var scale = this._map.getZoomScale(zoom, level.zoom),
		    translate = level.origin.multiplyBy(scale)
		        .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

		if (L.Browser.any3d) {
			L.DomUtil.setTransform(level.el, translate, scale);
		} else {
			L.DomUtil.setPosition(level.el, translate);
		}
	},

	_resetGrid: function () {
		var map = this._map,
		    crs = map.options.crs,
		    tileSize = this._tileSize = this.getTileSize(),
		    tileZoom = this._tileZoom;

		var bounds = this._map.getPixelWorldBounds(this._tileZoom);
		if (bounds) {
			this._globalTileRange = this._pxBoundsToTileRange(bounds);
		}

		this._wrapX = crs.wrapLng && !this.options.noWrap && [
			Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
			Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
		];
		this._wrapY = crs.wrapLat && !this.options.noWrap && [
			Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
			Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
		];
	},

	_onMoveEnd: function () {
		if (!this._map || this._map._animatingZoom) { return; }

		this._resetView();
	},

	_getTiledPixelBounds: function (center, zoom, tileZoom) {
		var map = this._map,
		    scale = map.getZoomScale(zoom, tileZoom),
		    pixelCenter = map.project(center, tileZoom).floor(),
		    halfSize = map.getSize().divideBy(scale * 2);

		return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
	},

	// Private method to load tiles in the grid's active zoom level according to map bounds
	_update: function (center) {
		var map = this._map;
		if (!map) { return; }
		var zoom = map.getZoom();

		if (center === undefined) { center = map.getCenter(); }
		if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

		var pixelBounds = this._getTiledPixelBounds(center, zoom, this._tileZoom),
		    tileRange = this._pxBoundsToTileRange(pixelBounds),
		    tileCenter = tileRange.getCenter(),
		    queue = [];

		for (var key in this._tiles) {
			this._tiles[key].current = false;
		}

		// _update just loads more tiles. If the tile zoom level differs too much
		// from the map's, let _setView reset levels and prune old tiles.
		if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

		// create a queue of coordinates to load tiles from
		for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
			for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
				var coords = new L.Point(i, j);
				coords.z = this._tileZoom;

				if (!this._isValidTile(coords)) { continue; }

				var tile = this._tiles[this._tileCoordsToKey(coords)];
				if (tile) {
					tile.current = true;
				} else {
					queue.push(coords);
				}
			}
		}

		// sort tile queue to load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
		});

		if (queue.length !== 0) {
			// if its the first batch of tiles to load
			if (!this._loading) {
				this._loading = true;
				this.fire('loading');
			}

			// create DOM fragment to append tiles in one batch
			var fragment = document.createDocumentFragment();

			for (i = 0; i < queue.length; i++) {
				this._addTile(queue[i], fragment);
			}

			this._level.el.appendChild(fragment);
		}
	},

	_isValidTile: function (coords) {
		var crs = this._map.options.crs;

		if (!crs.infinite) {
			// don't load tile if it's out of bounds and not wrapped
			var bounds = this._globalTileRange;
			if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
			    (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
		}

		if (!this.options.bounds) { return true; }

		// don't load tile if it doesn't intersect the bounds in options
		var tileBounds = this._tileCoordsToBounds(coords);
		return L.latLngBounds(this.options.bounds).overlaps(tileBounds);
	},

	_keyToBounds: function (key) {
		return this._tileCoordsToBounds(this._keyToTileCoords(key));
	},

	// converts tile coordinates to its geographical bounds
	_tileCoordsToBounds: function (coords) {

		var map = this._map,
		    tileSize = this.getTileSize(),

		    nwPoint = coords.scaleBy(tileSize),
		    sePoint = nwPoint.add(tileSize),

		    nw = map.wrapLatLng(map.unproject(nwPoint, coords.z)),
		    se = map.wrapLatLng(map.unproject(sePoint, coords.z));

		return new L.LatLngBounds(nw, se);
	},

	// converts tile coordinates to key for the tile cache
	_tileCoordsToKey: function (coords) {
		return coords.x + ':' + coords.y + ':' + coords.z;
	},

	// converts tile cache key to coordinates
	_keyToTileCoords: function (key) {
		var k = key.split(':'),
		    coords = new L.Point(+k[0], +k[1]);
		coords.z = +k[2];
		return coords;
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];
		if (!tile) { return; }

		L.DomUtil.remove(tile.el);

		delete this._tiles[key];

		this.fire('tileunload', {
			tile: tile.el,
			coords: this._keyToTileCoords(key)
		});
	},

	_initTile: function (tile) {
		L.DomUtil.addClass(tile, 'leaflet-tile');

		var tileSize = this.getTileSize();
		tile.style.width = tileSize.x + 'px';
		tile.style.height = tileSize.y + 'px';

		tile.onselectstart = L.Util.falseFn;
		tile.onmousemove = L.Util.falseFn;

		// update opacity on tiles in IE7-8 because of filter inheritance problems
		if (L.Browser.ielt9 && this.options.opacity < 1) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}

		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.android && !L.Browser.android23) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
	},

	_addTile: function (coords, container) {
		var tilePos = this._getTilePos(coords),
		    key = this._tileCoordsToKey(coords);

		var tile = this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));

		this._initTile(tile);

		// if createTile is defined with a second argument ("done" callback),
		// we know that tile is async and will be ready later; otherwise
		if (this.createTile.length < 2) {
			// mark tile as ready, but delay one frame for opacity animation to happen
			L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords, null, tile));
		}

		L.DomUtil.setPosition(tile, tilePos);

		// save tile in cache
		this._tiles[key] = {
			el: tile,
			coords: coords,
			current: true
		};

		container.appendChild(tile);
		this.fire('tileloadstart', {
			tile: tile,
			coords: coords
		});
	},

	_tileReady: function (coords, err, tile) {
		if (!this._map) { return; }

		if (err) {
			this.fire('tileerror', {
				error: err,
				tile: tile,
				coords: coords
			});
		}

		var key = this._tileCoordsToKey(coords);

		tile = this._tiles[key];
		if (!tile) { return; }

		tile.loaded = +new Date();
		if (this._map._fadeAnimated) {
			L.DomUtil.setOpacity(tile.el, 0);
			L.Util.cancelAnimFrame(this._fadeFrame);
			this._fadeFrame = L.Util.requestAnimFrame(this._updateOpacity, this);
		} else {
			tile.active = true;
			this._pruneTiles();
		}

		L.DomUtil.addClass(tile.el, 'leaflet-tile-loaded');

		this.fire('tileload', {
			tile: tile.el,
			coords: coords
		});

		if (this._noTilesToLoad()) {
			this._loading = false;
			this.fire('load');
		}
	},

	_getTilePos: function (coords) {
		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
	},

	_wrapCoords: function (coords) {
		var newCoords = new L.Point(
			this._wrapX ? L.Util.wrapNum(coords.x, this._wrapX) : coords.x,
			this._wrapY ? L.Util.wrapNum(coords.y, this._wrapY) : coords.y);
		newCoords.z = coords.z;
		return newCoords;
	},

	_pxBoundsToTileRange: function (bounds) {
		var tileSize = this.getTileSize();
		return new L.Bounds(
			bounds.min.unscaleBy(tileSize).floor(),
			bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
	},

	_noTilesToLoad: function () {
		for (var key in this._tiles) {
			if (!this._tiles[key].loaded) { return false; }
		}
		return true;
	}
});

L.gridLayer = function (options) {
	return new L.GridLayer(options);
};



/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.TileLayer = L.GridLayer.extend({

    options: {
        maxZoom: 18,

        subdomains: 'abc',
        errorTileUrl: '',
        zoomOffset: 0,

        maxNativeZoom: null, // Number
        tms: false,
        zoomReverse: false,
        detectRetina: false,
        crossOrigin: false
    },

    initialize: function (url, options) {

        this._url = url;

        options = L.setOptions(this, options);

        // detecting retina displays, adjusting tileSize and zoom levels
        if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

            options.tileSize = Math.floor(options.tileSize / 2);
            options.zoomOffset++;

            options.minZoom = Math.max(0, options.minZoom);
            options.maxZoom--;
        }

        if (typeof options.subdomains === 'string') {
            options.subdomains = options.subdomains.split('');
        }

        // for https://github.com/Leaflet/Leaflet/issues/137
        if (!L.Browser.android) {
            this.on('tileunload', this._onTileRemove);
        }
    },

    setUrl: function (url, noRedraw) {
        this._url = url;

        if (!noRedraw) {
            this.redraw();
        }
        return this;
    },

    createTile: function (coords, done) {
        var tile = document.createElement('img');

        L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
        L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

        if (this.options.crossOrigin) {
            tile.crossOrigin = '';
        }

        /*
         Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
         http://www.w3.org/TR/WCAG20-TECHS/H67
         */
        tile.alt = '';

        tile.src = this.getTileUrl(coords);

        return tile;
    },

    getTileUrl: function (coords) {
        var resolutions = 1;
        if (this._map.options.crs.options) {
            resolutions = this._map.options.crs.options.resolutions;
        }
        return L.Util.template(this._url, L.extend({
            r: this.options.detectRetina && L.Browser.retina && this.options.maxZoom > 0 ? '@2x' : '',
            s: this._getSubdomain(coords),
            x: coords.x,
            y: this.options.tms ? this._globalTileRange.max.y - coords.y : coords.y,
            z: this._getZoomForUrl(),
            sm: 1 / (resolutions[this._getZoomForUrl()] * 96 / 0.0254000508)
        }, this.options));
    },

    _tileOnLoad: function (done, tile) {
        // For https://github.com/Leaflet/Leaflet/issues/3332
        if (L.Browser.ielt9) {
            setTimeout(L.bind(done, this, null, tile), 0);
        } else {
            done(null, tile);
        }
    },

    _tileOnError: function (done, tile, e) {
        var errorUrl = this.options.errorTileUrl;
        if (errorUrl) {
            tile.src = errorUrl;
        }
        done(e, tile);
    },

    getTileSize: function () {
        var map = this._map,
            tileSize = L.GridLayer.prototype.getTileSize.call(this),
            zoom = this._tileZoom + this.options.zoomOffset,
            zoomN = this.options.maxNativeZoom;

        // increase tile size when overscaling
        return zoomN !== null && zoom > zoomN ?
            tileSize.divideBy(map.getZoomScale(zoomN, zoom)).round() :
            tileSize;
    },

    _onTileRemove: function (e) {
        e.tile.onload = null;
    },

    _getZoomForUrl: function () {

        var options = this.options,
            zoom = this._tileZoom;

        if (options.zoomReverse) {
            zoom = options.maxZoom - zoom;
        }

        zoom += options.zoomOffset;

        return options.maxNativeZoom !== null ? Math.min(zoom, options.maxNativeZoom) : zoom;
    },

    _getSubdomain: function (tilePoint) {
        var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
        return this.options.subdomains[index];
    },

    // stops loading all tiles in the background layer
    _abortLoading: function () {
        var i, tile;
        for (i in this._tiles) {
            if (this._tiles[i].coords.z !== this._tileZoom) {
                tile = this._tiles[i].el;

                tile.onload = L.Util.falseFn;
                tile.onerror = L.Util.falseFn;

                if (!tile.complete) {
                    tile.src = L.Util.emptyImageUrl;
                    L.DomUtil.remove(tile);
                }
            }
        }
    }
});

L.tileLayer = function (url, options) {
    return new L.TileLayer(url, options);
};



/*
 * L.TileLayer.WMS is used for WMS tile layers.
 */

L.TileLayer.WMS = L.TileLayer.extend({

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/jpeg',
		transparent: false
	},

	options: {
		crs: null,
		uppercase: false
	},

	initialize: function (url, options) {

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams);

		// all keys that are not TileLayer options go to WMS params
		for (var i in options) {
			if (!(i in this.options)) {
				wmsParams[i] = options[i];
			}
		}

		options = L.setOptions(this, options);

		wmsParams.width = wmsParams.height = options.tileSize * (options.detectRetina && L.Browser.retina ? 2 : 1);

		this.wmsParams = wmsParams;
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;
		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (coords) {

		var tileBounds = this._tileCoordsToBounds(coords),
		    nw = this._crs.project(tileBounds.getNorthWest()),
		    se = this._crs.project(tileBounds.getSouthEast()),

		    bbox = (this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
			    [se.y, nw.x, nw.y, se.x] :
			    [nw.x, se.y, se.x, nw.y]).join(','),

		    url = L.TileLayer.prototype.getTileUrl.call(this, coords);

		return url +
			L.Util.getParamString(this.wmsParams, url, this.options.uppercase) +
			(this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
	},

	setParams: function (params, noRedraw) {

		L.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});

L.tileLayer.wms = function (url, options) {
	return new L.TileLayer.WMS(url, options);
};



/*
 * L.ImageOverlay is used to overlay images over the map (to specific geographical bounds).
 */

L.ImageOverlay = L.Layer.extend({

	options: {
		opacity: 1,
		alt: '',
		interactive: false

		/*
		crossOrigin: <Boolean>,
		*/
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	onAdd: function () {
		if (!this._image) {
			this._initImage();

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}

		if (this.options.interactive) {
			L.DomUtil.addClass(this._image, 'leaflet-interactive');
			this.addInteractiveTarget(this._image);
		}

		this.getPane().appendChild(this._image);
		this._reset();
	},

	onRemove: function () {
		L.DomUtil.remove(this._image);
		if (this.options.interactive) {
			this.removeInteractiveTarget(this._image);
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._image) {
			this._updateOpacity();
		}
		return this;
	},

	setStyle: function (styleOpts) {
		if (styleOpts.opacity) {
			this.setOpacity(styleOpts.opacity);
		}
		return this;
	},

	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._image);
		}
		return this;
	},

	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._image);
		}
		return this;
	},

	setUrl: function (url) {
		this._url = url;

		if (this._image) {
			this._image.src = url;
		}
		return this;
	},

	setBounds: function (bounds) {
		this._bounds = bounds;

		if (this._map) {
			this._reset();
		}
		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getEvents: function () {
		var events = {
			zoom: this._reset,
			viewreset: this._reset
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	getBounds: function () {
		return this._bounds;
	},

	getElement: function () {
		return this._image;
	},

	_initImage: function () {
		var img = this._image = L.DomUtil.create('img',
				'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));

		img.onselectstart = L.Util.falseFn;
		img.onmousemove = L.Util.falseFn;

		img.onload = L.bind(this.fire, this, 'load');

		if (this.options.crossOrigin) {
			img.crossOrigin = '';
		}

		img.src = this._url;
		img.alt = this.options.alt;
	},

	_animateZoom: function (e) {
		var scale = this._map.getZoomScale(e.zoom),
		    offset = this._map._latLngToNewLayerPoint(this._bounds.getNorthWest(), e.zoom, e.center);

		L.DomUtil.setTransform(this._image, offset, scale);
	},

	_reset: function () {
		var image = this._image,
		    bounds = new L.Bounds(
		        this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		        this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
		    size = bounds.getSize();

		L.DomUtil.setPosition(image, bounds.min);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

L.imageOverlay = function (url, bounds, options) {
	return new L.ImageOverlay(url, bounds, options);
};



/*
 * L.Icon is an image-based icon class that you can use with L.Marker for custom markers.
 */

L.Icon = L.Class.extend({
	/*
	options: {
		iconUrl: (String) (required)
		iconRetinaUrl: (String) (optional, used for retina devices if detected)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowRetinaUrl: (String) (optional, used for retina devices if detected)
		shadowSize: (Point)
		shadowAnchor: (Point)
		className: (String)
	},
	*/

	initialize: function (options) {
		L.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options,
		    size = L.point(options[name + 'Size']),
		    anchor = L.point(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
		            size && size.divideBy(2, true));

		img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		return L.Browser.retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
	}
});

L.icon = function (options) {
	return new L.Icon(options);
};



/*
 * L.Icon.Default is the blue marker icon used by default in Leaflet.
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (L.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = L.Icon.Default.getPath();

		if (!path) {
			throw new Error('Couldn\'t autodetect L.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

L.Icon.Default.getPath = function(){
	var scripts = document.getElementsByTagName('script'),
		leafletRe = /[\/^]VitoGIS[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}

L.Icon.Default.imagePath = (L.Icon.Default.getPath());



/*
 * L.Marker is used to display clickable/draggable icons on the map.
 */

L.Marker = L.Layer.extend({

	options: {
		pane: 'markerPane',
		nonBubblingEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],

		icon: new L.Icon.Default(),
		// title: '',
		// alt: '',
		interactive: true,
		// draggable: false,
		keyboard: true,
		zIndexOffset: 0,
		opacity: 1,
		// riseOnHover: false,
		riseOffset: 250
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	onAdd: function (map) {
		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

		this._initIcon();
		this.update();
	},

	onRemove: function () {
		if (this.dragging && this.dragging.enabled()) {
			this.options.draggable = true;
			this.dragging.removeHooks();
		}

		this._removeIcon();
		this._removeShadow();
	},

	getEvents: function () {
		var events = {
			zoom: this.update,
			viewreset: this.update
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		var oldLatLng = this._latlng;
		this._latlng = L.latLng(latlng);
		this.update();
		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
	},

	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		return this.update();
	},

	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup, this._popup.options);
		}

		return this;
	},

	getElement: function () {
		return this._icon;
	},

	update: function () {

		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

		var icon = options.icon.createIcon(this._icon),
		    addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		if (options.riseOnHover) {
			this.on({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		var newShadow = options.icon.createShadow(this._shadow),
		    addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		if (addIcon) {
			this.getPane().appendChild(this._icon);
		}
		this._initInteraction();
		if (newShadow && addShadow) {
			this.getPane('shadowPane').appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			this.off({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		L.DomUtil.remove(this._icon);
		this.removeInteractiveTarget(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			L.DomUtil.remove(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.interactive) { return; }

		L.DomUtil.addClass(this._icon, 'leaflet-interactive');

		this.addInteractiveTarget(this._icon);

		if (L.Handler.MarkerDrag) {
			var draggable = this.options.draggable;
			if (this.dragging) {
				draggable = this.dragging.enabled();
				this.dragging.disable();
			}

			this.dragging = new L.Handler.MarkerDrag(this);

			if (draggable) {
				this.dragging.enable();
			}
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		var opacity = this.options.opacity;

		L.DomUtil.setOpacity(this._icon, opacity);

		if (this._shadow) {
			L.DomUtil.setOpacity(this._shadow, opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	}
});

L.marker = function (latlng, options) {
	return new L.Marker(latlng, options);
};



/*
 * L.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based L.Icon)
 * to use with L.Marker.
 */

L.DivIcon = L.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		div.innerHTML = options.html !== false ? options.html : '';

		if (options.bgPos) {
			div.style.backgroundPosition = (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}
		this._setIconStyles(div, 'icon');

		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};



/*
 * L.Popup is used for displaying popups on the map.
 */

L.Map.mergeOptions({
	closePopupOnClick: true
});

L.Popup = L.Layer.extend({

	options: {
		pane: 'popupPane',

		minWidth: 50,
		maxWidth: 300,
		// maxHeight: <Number>,
		offset: [0, 7],

		autoPan: true,
		autoPanPadding: [5, 5],
		// autoPanPaddingTopLeft: <Point>,
		// autoPanPaddingBottomRight: <Point>,

		closeButton: true,
		autoClose: true,
		// keepInView: false,
		// className: '',
		zoomAnimation: true
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
	},

	onAdd: function (map) {
		this._zoomAnimated = this._zoomAnimated && this.options.zoomAnimation;

		if (!this._container) {
			this._initLayout();
		}

		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 0);
		}

		clearTimeout(this._removeTimeout);
		this.getPane().appendChild(this._container);
		this.update();

		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 1);
		}

		map.fire('popupopen', {popup: this});

		if (this._source) {
			this._source.fire('popupopen', {popup: this}, true);
		}
	},

	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onRemove: function (map) {
		if (map._fadeAnimated) {
			L.DomUtil.setOpacity(this._container, 0);
			this._removeTimeout = setTimeout(L.bind(L.DomUtil.remove, L.DomUtil, this._container), 200);
		} else {
			L.DomUtil.remove(this._container);
		}

		map.fire('popupclose', {popup: this});

		if (this._source) {
			this._source.fire('popupclose', {popup: this}, true);
		}
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	getContent: function () {
		return this._content;
	},

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	getElement: function () {
		return this._container;
	},

	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	getEvents: function () {
		var events = {
			zoom: this._updatePosition,
			viewreset: this._updatePosition
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}
		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}
		return events;
	},

	isOpen: function () {
		return !!this._map && this._map.hasLayer(this);
	},

	bringToFront: function () {
		if (this._map) {
			L.DomUtil.toFront(this._container);
		}
		return this;
	},

	bringToBack: function () {
		if (this._map) {
			L.DomUtil.toBack(this._container);
		}
		return this;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
		    container = this._container = L.DomUtil.create('div',
			prefix + ' ' + (this.options.className || '') +
			' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide'));

		if (this.options.closeButton) {
			var closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';

			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);

		L.DomEvent
			.disableClickPropagation(wrapper)
			.disableScrollPropagation(this._contentNode)
			.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateContent: function () {
		if (!this._content) { return; }

		var node = this._contentNode;
		var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

		if (typeof content === 'string') {
			node.innerHTML = content;
		} else {
			while (node.hasChildNodes()) {
				node.removeChild(node.firstChild);
			}
			node.appendChild(content);
		}
		this.fire('contentupdate');
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    offset = L.point(this.options.offset);

		if (this._zoomAnimated) {
			L.DomUtil.setPosition(this._container, pos);
		} else {
			offset = offset.add(pos);
		}

		var bottom = this._containerBottom = -offset.y,
		    left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = bottom + 'px';
		this._container.style.left = left + 'px';
	},

	_animateZoom: function (e) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		L.DomUtil.setPosition(this._container, pos);
	},

	_adjustPan: function () {
		if (!this.options.autoPan || (this._map._panAnim && this._map._panAnim._inProgress)) { return; }

		var map = this._map,
		    containerHeight = this._container.offsetHeight,
		    containerWidth = this._containerWidth,
		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

		if (this._zoomAnimated) {
			layerPos._add(L.DomUtil.getPosition(this._container));
		}

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = L.point(this.options.autoPanPadding),
		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		L.DomEvent.stop(e);
	}
});

L.popup = function (options, source) {
	return new L.Popup(options, source);
};


L.Map.include({
	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])
		if (!(popup instanceof L.Popup)) {
			popup = new L.Popup(options).setContent(popup);
		}

		if (latlng) {
			popup.setLatLng(latlng);
		}

		if (this.hasLayer(popup)) {
			return this;
		}

		if (this._popup && this._popup.options.autoClose) {
			this.closePopup();
		}

		this._popup = popup;
		return this.addLayer(popup);
	},

	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
		}
		return this;
	}
});



/*
 * Adds popup-related methods to all layers.
 */

L.Layer.include({

    bindPopup: function (content, options) {

        if (content instanceof L.Popup) {
            L.setOptions(content, options);
            this._popup = content;
            content._source = this;
        } else {
            if (!this._popup || options) {
                this._popup = new L.Popup(options, this);
            }
            this._popup.setContent(content);
        }

        if (!this._popupHandlersAdded) {
            this.on({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });
            this._popupHandlersAdded = true;
        }

        // save the originally passed offset
        if (!this._originalPopupOffset)
            this._originalPopupOffset = this._popup.options.offset;

        return this;
    },

    unbindPopup: function () {
        if (this._popup) {
            this.off({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });
            this._popupHandlersAdded = false;
            this._popup = null;
        }
        return this;
    },

    openPopup: function (layer, latlng) {
        if (!(layer instanceof L.Layer)) {
            latlng = layer;
            layer = this;
        }

        if (layer instanceof L.FeatureGroup) {
            for (var id in this._layers) {
                layer = this._layers[id];
                break;
            }
        }

        if (!latlng) {
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
        }

        if (this._popup && this._map) {
            // set the popup offset for this layer
            this._popup.options.offset = this._popupAnchor(layer);

            // set popup source to this layer
            this._popup._source = layer;

            // update the popup (content, layout, ect...)
            this._popup.update();

            // open the popup on the map
            this._map.openPopup(this._popup, latlng);
        }

        return this;
    },

    closePopup: function () {
        if (this._popup) {
            this._popup._close();
        }
        return this;
    },

    togglePopup: function (target) {
        if (this._popup) {
            if (this._popup._map) {
                this.closePopup();
            } else {
                this.openPopup(target);
            }
        }
        return this;
    },

    isPopupOpen: function () {
        return this._popup.isOpen();
    },

    setPopupContent: function (content) {
        if (this._popup) {
            this._popup.setContent(content);
        }
        return this;
    },

    getPopup: function () {
        return this._popup;
    },

    _openPopup: function (e) {
        var layer = e.layer || e.target;

        if (!this._popup) {
            return;
        }

        if (!this._map) {
            return;
        }

        // if this inherits from Path its a vector and we can just
        // open the popup at the new location
        if (layer instanceof L.Path) {
            this.openPopup(e.layer || e.target, e.latlng);
            return;
        }

        // otherwise treat it like a marker and figure out
        // if we should toggle it open/closed
        if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
            this.closePopup();
        } else {
            this.openPopup(layer, e.latlng);
        }
    },

    _popupAnchor: function (layer) {
        // where shold we anchor the popup on this layer?
        var anchor = layer._getPopupAnchor ? layer._getPopupAnchor() : [0, 0];

        // add the users passed offset to that
        var offsetToAdd = this._originalPopupOffset || L.Popup.prototype.options.offset;

        // return the final point to anchor the popup
        return L.point(anchor).add(offsetToAdd);
    },

    _movePopup: function (e) {
        this._popup.setLatLng(e.latlng);
    }
});



/*
 * Popup extension to L.Marker, adding popup-related methods.
 */

L.Marker.include({
	_getPopupAnchor: function () {
		return this.options.icon.options.popupAnchor || [0, 0];
	}
});



/*
 * L.LayerGroup is a class to combine several layers into one so that
 * you can manipulate the group (e.g. add/remove it) as one layer.
 */

L.LayerGroup = L.Layer.extend({

	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	hasLayer: function (layer) {
		return !!layer && (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	clearLayers: function () {
		for (var i in this._layers) {
			this.removeLayer(this._layers[i]);
		}
		return this;
	},

	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		for (var i in this._layers) {
			map.addLayer(this._layers[i]);
		}
	},

	onRemove: function (map) {
		for (var i in this._layers) {
			map.removeLayer(this._layers[i]);
		}
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	getLayer: function (id) {
		return this._layers[id];
	},

	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	getLayerId: function (layer) {
		return L.stamp(layer);
	}
});

L.layerGroup = function (layers) {
	return new L.LayerGroup(layers);
};



/*
 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and additional methods
 * shared between a group of interactive layers (like vectors or markers).
 */

L.FeatureGroup = L.LayerGroup.extend({

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		layer.addEventParent(this);

		L.LayerGroup.prototype.addLayer.call(this, layer);

		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.removeEventParent(this);

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		return this.fire('layerremove', {layer: layer});
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new L.LatLngBounds();

		for (var id in this._layers) {
			var layer = this._layers[id];
			bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
		}
		return bounds;
	}
});

L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};



/*
 * L.Renderer is a base class for renderer implementations (SVG, Canvas);
 * handles renderer container, bounds and zoom animation.
 */

L.Renderer = L.Layer.extend({

	options: {
		// how much to extend the clip area around the map view (relative to its size)
		// e.g. 0.1 would be 10% of map view in each direction; defaults to clip with the map view
		padding: 0.1
	},

	initialize: function (options) {
		L.setOptions(this, options);
		L.stamp(this);
	},

	onAdd: function () {
		if (!this._container) {
			this._initContainer(); // defined by renderer implementations

			if (this._zoomAnimated) {
				L.DomUtil.addClass(this._container, 'leaflet-zoom-animated');
			}
		}

		this.getPane().appendChild(this._container);
		this._update();
	},

	onRemove: function () {
		L.DomUtil.remove(this._container);
	},

	getEvents: function () {
		var events = {
			viewreset: this._reset,
			zoom: this._onZoom,
			moveend: this._update
		};
		if (this._zoomAnimated) {
			events.zoomanim = this._onAnimZoom;
		}
		return events;
	},

	_onAnimZoom: function (ev) {
		this._updateTransform(ev.center, ev.zoom);
	},

	_onZoom: function () {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	},

	_updateTransform: function (center, zoom) {
		var scale = this._map.getZoomScale(zoom, this._zoom),
		    position = L.DomUtil.getPosition(this._container),
		    viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
		    currentCenterPoint = this._map.project(this._center, zoom),
		    destCenterPoint = this._map.project(center, zoom),
		    centerOffset = destCenterPoint.subtract(currentCenterPoint),

		    topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

		L.DomUtil.setTransform(this._container, topLeftOffset, scale);
	},

	_reset: function () {
		this._update();
		this._updateTransform(this._center, this._zoom);
	},

	_update: function () {
		// update pixel bounds of renderer container (for positioning/sizing/clipping later)
		var p = this.options.padding,
		    size = this._map.getSize(),
		    min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

		this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
	}
});


L.Map.include({
	// used by each vector layer to decide which renderer to use
	getRenderer: function (layer) {
		var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;

		if (!renderer) {
			renderer = this._renderer = (this.options.preferCanvas && L.canvas()) || L.svg();
		}

		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	_getPaneRenderer: function (name) {
		if (name === 'overlayPane' || name === undefined) {
			return false;
		}

		var renderer = this._paneRenderers[name];
		if (renderer === undefined) {
			renderer = (L.SVG && L.svg({pane: name})) || (L.Canvas && L.canvas({pane: name}));
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	}
});



/*
 * L.Path is the base class for all Leaflet vector layers like polygons and circles.
 */

L.Path = L.Layer.extend({

	options: {
		stroke: true,
		color: '#3388ff',
		weight: 3,
		opacity: 1,
		lineCap: 'round',
		lineJoin: 'round',
		// dashArray: null
		// dashOffset: null

		// fill: false
		// fillColor: same as color by default
		fillOpacity: 0.2,
		fillRule: 'evenodd',

		// className: ''
		interactive: true
	},

	beforeAdd: function (map) {
		// Renderer is set here because we need to call renderer.getEvents
		// before this.getEvents.
		this._renderer = map.getRenderer(this);
	},

	onAdd: function () {
		this._renderer._initPath(this);
		this._reset();
		this._renderer._addPath(this);
	},

	onRemove: function () {
		this._renderer._removePath(this);
	},

	getEvents: function () {
		return {
			zoomend: this._project,
			moveend: this._update,
			viewreset: this._reset
		};
	},

	redraw: function () {
		if (this._map) {
			this._renderer._updatePath(this);
		}
		return this;
	},

	setStyle: function (style) {
		L.setOptions(this, style);
		if (this._renderer) {
			this._renderer._updateStyle(this);
		}
		return this;
	},

	bringToFront: function () {
		if (this._renderer) {
			this._renderer._bringToFront(this);
		}
		return this;
	},

	bringToBack: function () {
		if (this._renderer) {
			this._renderer._bringToBack(this);
		}
		return this;
	},

	getElement: function () {
		return this._path;
	},

	_reset: function () {
		// defined in children classes
		this._project();
		this._update();
	},

	_clickTolerance: function () {
		// used when doing hit detection for Canvas layers
		return (this.options.stroke ? this.options.weight / 2 : 0) + (L.Browser.touch ? 10 : 0);
	}
});



/*
 * L.LineUtil contains different utility functions for line segments
 * and polylines (clipping, simplification, distances, etc.)
 */

L.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	simplify: function (points, tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// distance from a point to a segment between two points
	pointToSegmentDistance:  function (p, p1, p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	closestPointOnSegment: function (p, p1, p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},

	// Cohen-Sutherland line clipping algorithm.
	// Used to avoid rendering parts of a polyline that are not currently visible.

	clipSegment: function (a, b, bounds, useLastCode, round) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) { return [a, b]; }

			// if a,b is outside the clip window (trivial reject)
			if (codeA & codeB) { return false; }

			// other cases
			codeOut = codeA || codeB;
			p = this._getEdgeIntersection(a, b, codeOut, bounds, round);
			newCode = this._getBitCode(p, bounds);

			if (codeOut === codeA) {
				a = p;
				codeA = newCode;
			} else {
				b = p;
				codeB = newCode;
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds, round) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max,
		    x, y;

		if (code & 8) { // top
			x = a.x + dx * (max.y - a.y) / dy;
			y = max.y;

		} else if (code & 4) { // bottom
			x = a.x + dx * (min.y - a.y) / dy;
			y = min.y;

		} else if (code & 2) { // right
			x = max.x;
			y = a.y + dy * (max.x - a.x) / dx;

		} else if (code & 1) { // left
			x = min.x;
			y = a.y + dy * (min.x - a.x) / dx;
		}

		return new L.Point(x, y, round);
	},

	_getBitCode: function (p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}

		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
	}
};



/*
 * L.Polyline implements polyline vector layer (a set of points connected with lines)
 */

L.Polyline = L.Path.extend({

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0
		// noClip: false
	},

	initialize: function (latlngs, options) {
		L.setOptions(this, options);
		this._setLatLngs(latlngs);
	},

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._setLatLngs(latlngs);
		return this.redraw();
	},

	isEmpty: function () {
		return !this._latlngs.length;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity,
		    minPoint = null,
		    closest = L.LineUtil._sqClosestPointOnSegment,
		    p1, p2;

		for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
			var points = this._parts[j];

			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];

				var sqDist = closest(p, p1, p2, true);

				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = closest(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	getCenter: function () {
		var i, halfDist, segDist, dist, p1, p2, ratio,
		    points = this._rings[0],
		    len = points.length;

		if (!len) { return null; }

		// polyline centroid algorithm; only uses the first ring if there are multiple

		for (i = 0, halfDist = 0; i < len - 1; i++) {
			halfDist += points[i].distanceTo(points[i + 1]) / 2;
		}

		// The line is so small in the current view that all points are on the same pixel.
		if (halfDist === 0) {
			return this._map.layerPointToLatLng(points[0]);
		}

		for (i = 0, dist = 0; i < len - 1; i++) {
			p1 = points[i];
			p2 = points[i + 1];
			segDist = p1.distanceTo(p2);
			dist += segDist;

			if (dist > halfDist) {
				ratio = (dist - halfDist) / segDist;
				return this._map.layerPointToLatLng([
					p2.x - ratio * (p2.x - p1.x),
					p2.y - ratio * (p2.y - p1.y)
				]);
			}
		}
	},

	getBounds: function () {
		return this._bounds;
	},

	addLatLng: function (latlng, latlngs) {
		latlngs = latlngs || this._defaultShape();
		latlng = L.latLng(latlng);
		latlngs.push(latlng);
		this._bounds.extend(latlng);
		return this.redraw();
	},

	_setLatLngs: function (latlngs) {
		this._bounds = new L.LatLngBounds();
		this._latlngs = this._convertLatLngs(latlngs);
	},

	_defaultShape: function () {
		return L.Polyline._flat(this._latlngs) ? this._latlngs : this._latlngs[0];
	},

	// recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
	_convertLatLngs: function (latlngs) {
		var result = [],
		    flat = L.Polyline._flat(latlngs);

		for (var i = 0, len = latlngs.length; i < len; i++) {
			if (flat) {
				result[i] = L.latLng(latlngs[i]);
				this._bounds.extend(result[i]);
			} else {
				result[i] = this._convertLatLngs(latlngs[i]);
			}
		}

		return result;
	},

	_project: function () {
		this._rings = [];
		this._projectLatlngs(this._latlngs, this._rings);

		// project bounds as well to use later for Canvas hit detection/etc.
		var w = this._clickTolerance(),
		    p = new L.Point(w, -w);

		if (this._bounds.isValid()) {
			this._pxBounds = new L.Bounds(
				this._map.latLngToLayerPoint(this._bounds.getSouthWest())._subtract(p),
				this._map.latLngToLayerPoint(this._bounds.getNorthEast())._add(p));
		}
	},

	// recursively turns latlngs into a set of rings with projected coordinates
	_projectLatlngs: function (latlngs, result) {

		var flat = latlngs[0] instanceof L.LatLng,
		    len = latlngs.length,
		    i, ring;

		if (flat) {
			ring = [];
			for (i = 0; i < len; i++) {
				ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
			}
			result.push(ring);
		} else {
			for (i = 0; i < len; i++) {
				this._projectLatlngs(latlngs[i], result);
			}
		}
	},

	// clip polyline by renderer bounds so that we have less to render for performance
	_clipPoints: function () {
		var bounds = this._renderer._bounds;

		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
			return;
		}

		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}

		var parts = this._parts,
		    i, j, k, len, len2, segment, points;

		for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
			points = this._rings[i];

			for (j = 0, len2 = points.length; j < len2 - 1; j++) {
				segment = L.LineUtil.clipSegment(points[j], points[j + 1], bounds, j, true);

				if (!segment) { continue; }

				parts[k] = parts[k] || [];
				parts[k].push(segment[0]);

				// if segment goes out of screen, or it's the last one, it's the end of the line part
				if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
					parts[k].push(segment[1]);
					k++;
				}
			}
		}
	},

	// simplify each clipped part of the polyline for performance
	_simplifyPoints: function () {
		var parts = this._parts,
		    tolerance = this.options.smoothFactor;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = L.LineUtil.simplify(parts[i], tolerance);
		}
	},

	_update: function () {
		if (!this._map) { return; }

		this._clipPoints();
		this._simplifyPoints();
		this._updatePath();
	},

	_updatePath: function () {
		this._renderer._updatePoly(this);
	}
});

L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};

L.Polyline._flat = function (latlngs) {
	// true if it's a flat array of latlngs; false if nested
	return !L.Util.isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
};



/*
 * L.PolyUtil contains utility functions for polygons (clipping, etc.).
 */

L.PolyUtil = {};

/*
 * Sutherland-Hodgeman polygon clipping algorithm.
 * Used to avoid rendering parts of a polygon that are not currently visible.
 */
L.PolyUtil.clipPolygon = function (points, bounds, round) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = L.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds, round);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds, round);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};



/*
 * L.Polygon implements polygon vector layer (closed polyline with a fill inside).
 */

L.Polygon = L.Polyline.extend({

	options: {
		fill: true
	},

	isEmpty: function () {
		return !this._latlngs.length || !this._latlngs[0].length;
	},

	getCenter: function () {
		var i, j, p1, p2, f, area, x, y, center,
		    points = this._rings[0],
		    len = points.length;

		if (!len) { return null; }

		// polygon centroid algorithm; only uses the first ring if there are multiple

		area = x = y = 0;

		for (i = 0, j = len - 1; i < len; j = i++) {
			p1 = points[i];
			p2 = points[j];

			f = p1.y * p2.x - p2.y * p1.x;
			x += (p1.x + p2.x) * f;
			y += (p1.y + p2.y) * f;
			area += f * 3;
		}

		if (area === 0) {
			// Polygon is so small that all points are on same pixel.
			center = points[0];
		} else {
			center = [x / area, y / area];
		}
		return this._map.layerPointToLatLng(center);
	},

	_convertLatLngs: function (latlngs) {
		var result = L.Polyline.prototype._convertLatLngs.call(this, latlngs),
		    len = result.length;

		// remove last point if it equals first one
		if (len >= 2 && result[0] instanceof L.LatLng && result[0].equals(result[len - 1])) {
			result.pop();
		}
		return result;
	},

	_setLatLngs: function (latlngs) {
		L.Polyline.prototype._setLatLngs.call(this, latlngs);
		if (L.Polyline._flat(this._latlngs)) {
			this._latlngs = [this._latlngs];
		}
	},

	_defaultShape: function () {
		return L.Polyline._flat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
	},

	_clipPoints: function () {
		// polygons need a different clipping algorithm so we redefine that

		var bounds = this._renderer._bounds,
		    w = this.options.weight,
		    p = new L.Point(w, w);

		// increase clip padding by stroke width to avoid stroke on clip edges
		bounds = new L.Bounds(bounds.min.subtract(p), bounds.max.add(p));

		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
			return;
		}

		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}

		for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
			clipped = L.PolyUtil.clipPolygon(this._rings[i], bounds, true);
			if (clipped.length) {
				this._parts.push(clipped);
			}
		}
	},

	_updatePath: function () {
		this._renderer._updatePoly(this, true);
	}
});

L.polygon = function (latlngs, options) {
	return new L.Polygon(latlngs, options);
};



/*
 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

L.Rectangle = L.Polygon.extend({
	initialize: function (latLngBounds, options) {
		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	setBounds: function (latLngBounds) {
		return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = L.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});

L.rectangle = function (latLngBounds, options) {
	return new L.Rectangle(latLngBounds, options);
};



/*
 * L.CircleMarker is a circle overlay with a permanent pixel radius.
 */

L.CircleMarker = L.Path.extend({

	options: {
		fill: true,
		radius: 10
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
		this._radius = this.options.radius;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		this.redraw();
		return this.fire('move', {latlng: this._latlng});
	},

	getLatLng: function () {
		return this._latlng;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	},

	setStyle : function (options) {
		var radius = options && options.radius || this._radius;
		L.Path.prototype.setStyle.call(this, options);
		this.setRadius(radius);
		return this;
	},

	_project: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
		this._updateBounds();
	},

	_updateBounds: function () {
		var r = this._radius,
		    r2 = this._radiusY || r,
		    w = this._clickTolerance(),
		    p = [r + w, r2 + w];
		this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
	},

	_update: function () {
		if (this._map) {
			this._updatePath();
		}
	},

	_updatePath: function () {
		this._renderer._updateCircle(this);
	},

	_empty: function () {
		return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
	}
});

L.circleMarker = function (latlng, options) {
	return new L.CircleMarker(latlng, options);
};



/*
 * L.Circle is a circle overlay (with a certain radius in meters).
 * It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion)
 */

L.Circle = L.CircleMarker.extend({

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
		this._mRadius = this.options.radius;
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._mRadius;
	},

	getBounds: function () {
		var half = [this._radius, this._radiusY || this._radius];

		return new L.LatLngBounds(
			this._map.layerPointToLatLng(this._point.subtract(half)),
			this._map.layerPointToLatLng(this._point.add(half)));
	},

	setStyle: L.Path.prototype.setStyle,

	_project: function () {

		var lng = this._latlng.lng,
		    lat = this._latlng.lat,
		    map = this._map,
		    crs = map.options.crs;

		if (crs.distance === L.CRS.Earth.distance) {
			var d = Math.PI / 180,
			    latR = (this._mRadius / L.CRS.Earth.R) / d,
			    top = map.project([lat + latR, lng]),
			    bottom = map.project([lat - latR, lng]),
			    p = top.add(bottom).divideBy(2),
			    lat2 = map.unproject(p).lat,
			    lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
			            (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

			this._point = p.subtract(map.getPixelOrigin());
			this._radius = isNaN(lngR) ? 0 : Math.max(Math.round(p.x - map.project([lat2, lng - lngR]).x), 1);
			this._radiusY = Math.max(Math.round(p.y - top.y), 1);

		} else {
			var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));

			this._point = map.latLngToLayerPoint(this._latlng);
			this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
		}

		this._updateBounds();
	}
});

L.circle = function (latlng, options, legacyOptions) {
	if (typeof options === 'number') {
		// Backwards compatibility with 0.7.x factory (latlng, radius, options?)
		options = L.extend({}, legacyOptions, {radius: options});
	}
	return new L.Circle(latlng, options);
};



/*
 * L.SVG renders vector layers with SVG. All SVG-specific code goes here.
 */

L.SVG = L.Renderer.extend({

	getEvents: function () {
		var events = L.Renderer.prototype.getEvents.call(this);
		events.zoomstart = this._onZoomStart;
		return events;
	},

	_initContainer: function () {
		this._container = L.SVG.create('svg');

		// makes it possible to click through svg root; we'll reset it back in individual paths
		this._container.setAttribute('pointer-events', 'none');

		this._rootGroup = L.SVG.create('g');
		this._container.appendChild(this._rootGroup);
	},

	_onZoomStart: function () {
		// Drag-then-pinch interactions might mess up the center and zoom.
		// In this case, the easiest way to prevent this is re-do the renderer
		//   bounds and padding when the zooming starts.
		this._update();
	},

	_update: function () {
		if (this._map._animatingZoom && this._bounds) { return; }

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    size = b.getSize(),
		    container = this._container;

		// set size of svg-container if changed
		if (!this._svgSize || !this._svgSize.equals(size)) {
			this._svgSize = size;
			container.setAttribute('width', size.x);
			container.setAttribute('height', size.y);
		}

		// movement: update container viewBox so that we don't have to change coordinates of individual layers
		L.DomUtil.setPosition(container, b.min);
		container.setAttribute('viewBox', [b.min.x, b.min.y, size.x, size.y].join(' '));
	},

	// methods below are called by vector layers implementations

	_initPath: function (layer) {
		var path = layer._path = L.SVG.create('path');

		if (layer.options.className) {
			L.DomUtil.addClass(path, layer.options.className);
		}

		if (layer.options.interactive) {
			L.DomUtil.addClass(path, 'leaflet-interactive');
		}

		this._updateStyle(layer);
	},

	_addPath: function (layer) {
		this._rootGroup.appendChild(layer._path);
		layer.addInteractiveTarget(layer._path);
	},

	_removePath: function (layer) {
		L.DomUtil.remove(layer._path);
		layer.removeInteractiveTarget(layer._path);
	},

	_updatePath: function (layer) {
		layer._project();
		layer._update();
	},

	_updateStyle: function (layer) {
		var path = layer._path,
		    options = layer.options;

		if (!path) { return; }

		if (options.stroke) {
			path.setAttribute('stroke', options.color);
			path.setAttribute('stroke-opacity', options.opacity);
			path.setAttribute('stroke-width', options.weight);
			path.setAttribute('stroke-linecap', options.lineCap);
			path.setAttribute('stroke-linejoin', options.lineJoin);

			if (options.dashArray) {
				path.setAttribute('stroke-dasharray', options.dashArray);
			} else {
				path.removeAttribute('stroke-dasharray');
			}

			if (options.dashOffset) {
				path.setAttribute('stroke-dashoffset', options.dashOffset);
			} else {
				path.removeAttribute('stroke-dashoffset');
			}
		} else {
			path.setAttribute('stroke', 'none');
		}

		if (options.fill) {
			path.setAttribute('fill', options.fillColor || options.color);
			path.setAttribute('fill-opacity', options.fillOpacity);
			path.setAttribute('fill-rule', options.fillRule || 'evenodd');
		} else {
			path.setAttribute('fill', 'none');
		}

		path.setAttribute('pointer-events', options.pointerEvents || (options.interactive ? 'visiblePainted' : 'none'));
	},

	_updatePoly: function (layer, closed) {
		this._setPath(layer, L.SVG.pointsToPath(layer._parts, closed));
	},

	_updateCircle: function (layer) {
		var p = layer._point,
		    r = layer._radius,
		    r2 = layer._radiusY || r,
		    arc = 'a' + r + ',' + r2 + ' 0 1,0 ';

		// drawing a circle with two half-arcs
		var d = layer._empty() ? 'M0 0' :
				'M' + (p.x - r) + ',' + p.y +
				arc + (r * 2) + ',0 ' +
				arc + (-r * 2) + ',0 ';

		this._setPath(layer, d);
	},

	_setPath: function (layer, path) {
		layer._path.setAttribute('d', path);
	},

	// SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
	_bringToFront: function (layer) {
		L.DomUtil.toFront(layer._path);
	},

	_bringToBack: function (layer) {
		L.DomUtil.toBack(layer._path);
	}
});


L.extend(L.SVG, {
	create: function (name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	},

	// generates SVG path string for multiple rings, with each ring turning into "M..L..L.." instructions
	pointsToPath: function (rings, closed) {
		var str = '',
		    i, j, len, len2, points, p;

		for (i = 0, len = rings.length; i < len; i++) {
			points = rings[i];

			for (j = 0, len2 = points.length; j < len2; j++) {
				p = points[j];
				str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
			}

			// closes the ring for polygons; "x" is VML syntax
			str += closed ? (L.Browser.svg ? 'z' : 'x') : '';
		}

		// SVG complains about empty path strings
		return str || 'M0 0';
	}
});

L.Browser.svg = !!(document.createElementNS && L.SVG.create('svg').createSVGRect);

L.svg = function (options) {
	return L.Browser.svg || L.Browser.vml ? new L.SVG(options) : null;
};



/*
 * Vector rendering for IE7-8 through VML.
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

L.Browser.vml = !L.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

// redefine some SVG methods to handle VML syntax which is similar but with some differences
L.SVG.include(!L.Browser.vml ? {} : {

	_initContainer: function () {
		this._container = L.DomUtil.create('div', 'leaflet-vml-container');
	},

	_update: function () {
		if (this._map._animatingZoom) { return; }
		L.Renderer.prototype._update.call(this);
	},

	_initPath: function (layer) {
		var container = layer._container = L.SVG.create('shape');

		L.DomUtil.addClass(container, 'leaflet-vml-shape ' + (this.options.className || ''));

		container.coordsize = '1 1';

		layer._path = L.SVG.create('path');
		container.appendChild(layer._path);

		this._updateStyle(layer);
	},

	_addPath: function (layer) {
		var container = layer._container;
		this._container.appendChild(container);

		if (layer.options.interactive) {
			layer.addInteractiveTarget(container);
		}
	},

	_removePath: function (layer) {
		var container = layer._container;
		L.DomUtil.remove(container);
		layer.removeInteractiveTarget(container);
	},

	_updateStyle: function (layer) {
		var stroke = layer._stroke,
		    fill = layer._fill,
		    options = layer.options,
		    container = layer._container;

		container.stroked = !!options.stroke;
		container.filled = !!options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = layer._stroke = L.SVG.create('stroke');
			}
			container.appendChild(stroke);
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = L.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			stroke.endcap = options.lineCap.replace('butt', 'flat');
			stroke.joinstyle = options.lineJoin;

		} else if (stroke) {
			container.removeChild(stroke);
			layer._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = layer._fill = L.SVG.create('fill');
			}
			container.appendChild(fill);
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			layer._fill = null;
		}
	},

	_updateCircle: function (layer) {
		var p = layer._point.round(),
		    r = Math.round(layer._radius),
		    r2 = Math.round(layer._radiusY || r);

		this._setPath(layer, layer._empty() ? 'M0 0' :
				'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r2 + ' 0,' + (65535 * 360));
	},

	_setPath: function (layer, path) {
		layer._path.v = path;
	},

	_bringToFront: function (layer) {
		L.DomUtil.toFront(layer._container);
	},

	_bringToBack: function (layer) {
		L.DomUtil.toBack(layer._container);
	}
});

if (L.Browser.vml) {
	L.SVG.create = (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement('<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	})();
}



/*
 * L.Canvas handles Canvas vector layers rendering and mouse events handling. All Canvas-specific code goes here.
 */

L.Canvas = L.Renderer.extend({

	onAdd: function () {
		L.Renderer.prototype.onAdd.call(this);

		this._layers = this._layers || {};

		// Redraw vectors since canvas is cleared upon removal,
		// in case of removing the renderer itself from the map.
		this._draw();
	},

	_initContainer: function () {
		var container = this._container = document.createElement('canvas');

		L.DomEvent
			.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this)
			.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this)
			.on(container, 'mouseout', this._handleMouseOut, this);

		this._ctx = container.getContext('2d');
	},

	_update: function () {
		if (this._map._animatingZoom && this._bounds) { return; }

		this._drawnLayers = {};

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    container = this._container,
		    size = b.getSize(),
		    m = L.Browser.retina ? 2 : 1;

		L.DomUtil.setPosition(container, b.min);

		// set canvas size (also clearing it); use double size on retina
		container.width = m * size.x;
		container.height = m * size.y;
		container.style.width = size.x + 'px';
		container.style.height = size.y + 'px';

		if (L.Browser.retina) {
			this._ctx.scale(2, 2);
		}

		// translate so we use the same path coordinates after canvas element moves
		this._ctx.translate(-b.min.x, -b.min.y);
	},

	_initPath: function (layer) {
		this._layers[L.stamp(layer)] = layer;
	},

	_addPath: L.Util.falseFn,

	_removePath: function (layer) {
		layer._removed = true;
		this._requestRedraw(layer);
	},

	_updatePath: function (layer) {
		this._redrawBounds = layer._pxBounds;
		this._draw(true);
		layer._project();
		layer._update();
		this._draw();
		this._redrawBounds = null;
	},

	_updateStyle: function (layer) {
		this._requestRedraw(layer);
	},

	_requestRedraw: function (layer) {
		if (!this._map) { return; }

		var padding = (layer.options.weight || 0) + 1;
		this._redrawBounds = this._redrawBounds || new L.Bounds();
		this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
		this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));

		this._redrawRequest = this._redrawRequest || L.Util.requestAnimFrame(this._redraw, this);
	},

	_redraw: function () {
		this._redrawRequest = null;

		this._draw(true); // clear layers in redraw bounds
		this._draw(); // draw layers

		this._redrawBounds = null;
	},

	_draw: function (clear) {
		this._clear = clear;
		var layer, bounds = this._redrawBounds;
		this._ctx.save();
		if (bounds) {
			this._ctx.beginPath();
			this._ctx.rect(bounds.min.x, bounds.min.y, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
			this._ctx.clip();
		}

		for (var id in this._layers) {
			layer = this._layers[id];
			if (!bounds || layer._pxBounds.intersects(bounds)) {
				layer._updatePath();
			}
			if (clear && layer._removed) {
				delete layer._removed;
				delete this._layers[id];
			}
		}
		this._ctx.restore();  // Restore state before clipping.
	},

	_updatePoly: function (layer, closed) {

		var i, j, len2, p,
		    parts = layer._parts,
		    len = parts.length,
		    ctx = this._ctx;

		if (!len) { return; }

		this._drawnLayers[layer._leaflet_id] = layer;

		ctx.beginPath();

		for (i = 0; i < len; i++) {
			for (j = 0, len2 = parts[i].length; j < len2; j++) {
				p = parts[i][j];
				ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
			}
			if (closed) {
				ctx.closePath();
			}
		}

		this._fillStroke(ctx, layer);

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_updateCircle: function (layer) {

		if (layer._empty()) { return; }

		var p = layer._point,
		    ctx = this._ctx,
		    r = layer._radius,
		    s = (layer._radiusY || r) / r;

		if (s !== 1) {
			ctx.save();
			ctx.scale(1, s);
		}

		ctx.beginPath();
		ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

		if (s !== 1) {
			ctx.restore();
		}

		this._fillStroke(ctx, layer);
	},

	_fillStroke: function (ctx, layer) {
		var clear = this._clear,
		    options = layer.options;

		ctx.globalCompositeOperation = clear ? 'destination-out' : 'source-over';

		if (options.fill) {
			ctx.globalAlpha = clear ? 1 : options.fillOpacity;
			ctx.fillStyle = options.fillColor || options.color;
			ctx.fill(options.fillRule || 'evenodd');
		}

		if (options.stroke && options.weight !== 0) {
			ctx.globalAlpha = clear ? 1 : options.opacity;

			// if clearing shape, do it with the previously drawn line width
			layer._prevWeight = ctx.lineWidth = clear ? layer._prevWeight + 1 : options.weight;

			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	},

	// Canvas obviously doesn't have mouse events for individual drawn objects,
	// so we emulate that by calculating what's under the mouse on mousemove/click manually

	_onClick: function (e) {
		var point = this._map.mouseEventToLayerPoint(e), layers = [], layer;

		for (var id in this._layers) {
			layer = this._layers[id];
			if (layer.options.interactive && layer._containsPoint(point)) {
				L.DomEvent._fakeStop(e);
				layers.push(layer);
			}
		}
		if (layers.length)  {
			this._fireEvent(layers, e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) { return; }

		var point = this._map.mouseEventToLayerPoint(e);
		this._handleMouseOut(e, point);
		this._handleMouseHover(e, point);
	},


	_handleMouseOut: function (e, point) {
		var layer = this._hoveredLayer;
		if (layer && (e.type === 'mouseout' || !layer._containsPoint(point))) {
			// if we're leaving the layer, fire mouseout
			L.DomUtil.removeClass(this._container, 'leaflet-interactive');
			this._fireEvent([layer], e, 'mouseout');
			this._hoveredLayer = null;
		}
	},

	_handleMouseHover: function (e, point) {
		var id, layer;
		if (!this._hoveredLayer) {
			for (id in this._drawnLayers) {
				layer = this._drawnLayers[id];
				if (layer.options.interactive && layer._containsPoint(point)) {
					L.DomUtil.addClass(this._container, 'leaflet-interactive'); // change cursor
					this._fireEvent([layer], e, 'mouseover');
					this._hoveredLayer = layer;
					break;
				}
			}
		}
		if (this._hoveredLayer) {
			this._fireEvent([this._hoveredLayer], e);
		}
	},

	_fireEvent: function (layers, e, type) {
		this._map._fireDOMEvent(e, type || e.type, layers);
	},

	// TODO _bringToFront & _bringToBack, pretty tricky

	_bringToFront: L.Util.falseFn,
	_bringToBack: L.Util.falseFn
});

L.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

L.canvas = function (options) {
	return L.Browser.canvas ? new L.Canvas(options) : null;
};

L.Polyline.prototype._containsPoint = function (p, closed) {
	var i, j, k, len, len2, part,
	    w = this._clickTolerance();

	if (!this._pxBounds.contains(p)) { return false; }

	// hit detection for polylines
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			if (!closed && (j === 0)) { continue; }

			if (L.LineUtil.pointToSegmentDistance(p, part[k], part[j]) <= w) {
				return true;
			}
		}
	}
	return false;
};

L.Polygon.prototype._containsPoint = function (p) {
	var inside = false,
	    part, p1, p2, i, j, k, len, len2;

	if (!this._pxBounds.contains(p)) { return false; }

	// ray casting algorithm for detecting if point is in polygon
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			p1 = part[j];
			p2 = part[k];

			if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
				inside = !inside;
			}
		}
	}

	// also check if it's on polygon stroke
	return inside || L.Polyline.prototype._containsPoint.call(this, p, true);
};

L.CircleMarker.prototype._containsPoint = function (p) {
	return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
};



/*
 * L.GeoJSON turns any GeoJSON data into a Leaflet layer.
 */

L.GeoJSON = L.FeatureGroup.extend({

    initialize: function (geojson, options) {
        L.setOptions(this, options);

        this._layers = {};

        if (geojson) {
            this.addData(geojson);
        }
    },

    addData: function (geojson) {
        var features = L.Util.isArray(geojson) ? geojson : geojson.features,
            i, len, feature;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                // only add this if geometry or geometries are set and not null
                feature = features[i];
                if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                    this.addData(feature);
                }
            }
            return this;
        }

        var options = this.options;

        if (options.filter && !options.filter(geojson)) {
            return this;
        }

        var layer = L.GeoJSON.geometryToLayer(geojson, options);
        if (!layer) {
            return this;
        }
        layer.feature = L.GeoJSON.asFeature(geojson);

        layer.defaultOptions = layer.options;
        this.resetStyle(layer);

        if (options.onEachFeature) {
            options.onEachFeature(geojson, layer);
        }

        return this.addLayer(layer);
    },

    resetStyle: function (layer) {
        // reset any custom styles
        layer.options = layer.defaultOptions;
        this._setLayerStyle(layer, this.options.style);
        return this;
    },

    setStyle: function (style) {
        return this.eachLayer(function (layer) {
            this._setLayerStyle(layer, style);
        }, this);
    },

    _setLayerStyle: function (layer, style) {
        if (typeof style === 'function') {
            style = style(layer.feature);
        }
        if (layer.setStyle) {
            layer.setStyle(style);
        }
    }
});

L.extend(L.GeoJSON, {
    geometryToLayer: function (geojson, options) {

        var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
            coords = geometry ? geometry.coordinates : null,
            layers = [],
            pointToLayer = options && options.pointToLayer,
            coordsToLatLng = options && options.coordsToLatLng || this.coordsToLatLng,
            latlng, latlngs, i, len;

        if (!coords && !geometry) {
            return null;
        }

        switch (geometry.type) {
            case 'Point':
                latlng = coordsToLatLng(coords);
                var returngeom = pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);
                returngeom.feature = {properties: geojson.properties}
                return returngeom;

            case 'MultiPoint':
                for (i = 0, len = coords.length; i < len; i++) {
                    latlng = coordsToLatLng(coords[i]);
                    var returngeom = pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);
                    returngeom.feature = {properties: geojson.properties}
                    layers.push(returngeom);
                }
                return new L.FeatureGroup(layers);

            case 'LineString':
            case 'MultiLineString':
                latlngs = this.coordsToLatLngs(coords, geometry.type === 'LineString' ? 0 : 1, coordsToLatLng);
                var returngeom = new L.Polyline(latlngs, options);
                returngeom.feature = {properties: geojson.properties}
                return returngeom;

            case 'Polygon':
            case 'MultiPolygon':
                latlngs = this.coordsToLatLngs(coords, geometry.type === 'Polygon' ? 1 : 2, coordsToLatLng);
                var returngeom = null;
                if (latlngs.length > 0) {
                    returngeom = new L.Polygon(latlngs, options);
                    returngeom.feature = {properties: geojson.properties}
                }
                return returngeom;

            case 'GeometryCollection':
                for (i = 0, len = geometry.geometries.length; i < len; i++) {
                    var layer = this.geometryToLayer({
                        geometry: geometry.geometries[i],
                        type: 'Feature',
                        properties: geojson.properties
                    }, options);

                    if (layer) {
                        layers.push(layer);
                    }
                }
                return new L.FeatureGroup(layers);

            default:
                throw new Error('Invalid GeoJSON object.');
        }
    },

    coordsToLatLng: function (coords) {
        return new L.LatLng(coords[1], coords[0], coords[2]);
    },

    coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) {
        var latlngs = [];

        for (var i = 0, len = coords.length, latlng; i < len; i++) {
            latlng = levelsDeep ?
                this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
                (coordsToLatLng || this.coordsToLatLng)(coords[i]);

            latlngs.push(latlng);
        }

        return latlngs;
    },

    latLngToCoords: function (latlng) {
        return latlng.alt !== undefined ?
            [latlng.lng, latlng.lat, latlng.alt] :
            [latlng.lng, latlng.lat];
    },

    latLngsToCoords: function (latlngs, levelsDeep, closed) {
        var coords = [];

        for (var i = 0, len = latlngs.length; i < len; i++) {
            coords.push(levelsDeep ?
                L.GeoJSON.latLngsToCoords(latlngs[i], levelsDeep - 1, closed) :
                L.GeoJSON.latLngToCoords(latlngs[i]));
        }

        if (!levelsDeep && closed) {
            coords.push(coords[0]);
        }

        return coords;
    },

    getFeature: function (layer, newGeometry) {
        return layer.feature ?
            L.extend({}, layer.feature, {geometry: newGeometry}) :
            L.GeoJSON.asFeature(newGeometry);
    },

    asFeature: function (geoJSON) {
        if (geoJSON.type === 'Feature') {
            return geoJSON;
        }

        return {
            type: 'Feature',
            properties: {},
            geometry: geoJSON
        };
    }
});

var PointToGeoJSON = {
    toGeoJSON: function () {
        return L.GeoJSON.getFeature(this, {
            type: 'Point',
            coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
        });
    }
};

L.Marker.include(PointToGeoJSON);
L.Circle.include(PointToGeoJSON);
L.CircleMarker.include(PointToGeoJSON);

L.Polyline.prototype.toGeoJSON = function () {
    var multi = !L.Polyline._flat(this._latlngs);

    var coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 1 : 0);

    return L.GeoJSON.getFeature(this, {
        type: (multi ? 'Multi' : '') + 'LineString',
        coordinates: coords
    });
};

L.Polygon.prototype.toGeoJSON = function () {
    var holes = !L.Polyline._flat(this._latlngs),
        multi = holes && !L.Polyline._flat(this._latlngs[0]);

    var coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true);

    if (!holes) {
        coords = [coords];
    }

    return L.GeoJSON.getFeature(this, {
        type: (multi ? 'Multi' : '') + 'Polygon',
        coordinates: coords
    });
};


L.LayerGroup.include({
    toMultiPoint: function () {
        var coords = [];

        this.eachLayer(function (layer) {
            coords.push(layer.toGeoJSON().geometry.coordinates);
        });

        return L.GeoJSON.getFeature(this, {
            type: 'MultiPoint',
            coordinates: coords
        });
    },

    toGeoJSON: function () {

        var type = this.feature && this.feature.geometry && this.feature.geometry.type;

        if (type === 'MultiPoint') {
            return this.toMultiPoint();
        }

        var isGeometryCollection = type === 'GeometryCollection',
            jsons = [];

        this.eachLayer(function (layer) {
            if (layer.toGeoJSON) {
                var json = layer.toGeoJSON();
                jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
            }
        });

        if (isGeometryCollection) {
            return L.GeoJSON.getFeature(this, {
                geometries: jsons,
                type: 'GeometryCollection'
            });
        }

        return {
            type: 'FeatureCollection',
            features: jsons
        };
    }
});

L.geoJson = function (geojson, options) {
    return new L.GeoJSON(geojson, options);
};



/*
 * L.DomEvent contains functions for working with DOM events.
 * Inspired by John Resig, Dean Edwards and YUI addEvent implementations.
 */

var eventsKey = '_leaflet_events';

L.DomEvent = {

	on: function (obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this._on(obj, type, types[type], fn);
			}
		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(obj, types[i], fn, context);
			}
		}

		return this;
	},

	off: function (obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this._off(obj, type, types[type], fn);
			}
		} else {
			types = L.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(obj, types[i], fn, context);
			}
		}

		return this;
	},

	_on: function (obj, type, fn, context) {
		var id = type + L.stamp(fn) + (context ? '_' + L.stamp(context) : '');

		if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

		var handler = function (e) {
			return fn.call(context || obj, e || window.event);
		};

		var originalHandler = handler;

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.addPointerListener(obj, type, handler, id);

		} else if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);

		} else if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				handler = function (e) {
					e = e || window.event;
					if (L.DomEvent._isExternalTarget(obj, e)) {
						originalHandler(e);
					}
				};
				obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false);

			} else {
				if (type === 'click' && L.Browser.android) {
					handler = function (e) {
						return L.DomEvent._filterClick(e, originalHandler);
					};
				}
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[eventsKey] = obj[eventsKey] || {};
		obj[eventsKey][id] = handler;

		return this;
	},

	_off: function (obj, type, fn, context) {

		var id = type + L.stamp(fn) + (context ? '_' + L.stamp(context) : ''),
		    handler = obj[eventsKey] && obj[eventsKey][id];

		if (!handler) { return this; }

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);

		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else {
				obj.removeEventListener(
					type === 'mouseenter' ? 'mouseover' :
					type === 'mouseleave' ? 'mouseout' : type, handler, false);
			}

		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[eventsKey][id] = null;

		return this;
	},

	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else if (e.originalEvent) {  // In case of Leaflet event.
			e.originalEvent._stopped = true;
		} else {
			e.cancelBubble = true;
		}
		L.DomEvent._skipped(e);

		return this;
	},

	disableScrollPropagation: function (el) {
		return L.DomEvent.on(el, 'mousewheel MozMousePixelScroll', L.DomEvent.stopPropagation);
	},

	disableClickPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		L.DomEvent.on(el, L.Draggable.START.join(' '), stop);

		return L.DomEvent.on(el, {
			click: L.DomEvent._fakeStop,
			dblclick: stop
		});
	},

	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	stop: function (e) {
		return L.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	getMousePosition: function (e, container) {
		if (!container) {
			return new L.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new L.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
		L.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_isExternalTarget: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
		    elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			return;
		}
		L.DomEvent._lastClick = timeStamp;

		handler(e);
	}
};

L.DomEvent.addListener = L.DomEvent.on;
L.DomEvent.removeListener = L.DomEvent.off;



/*
 * L.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
 */

L.Draggable = L.Evented.extend({

	statics: {
		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	initialize: function (element, dragStartTarget, preventOutline) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
		this._preventOutline = preventOutline;
	},

	enable: function () {
		if (this._enabled) { return; }

		L.DomEvent.on(this._dragStartTarget, L.Draggable.START.join(' '), this._onDown, this);

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.DomEvent.off(this._dragStartTarget, L.Draggable.START.join(' '), this._onDown, this);

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		this._moved = false;

		if (L.DomUtil.hasClass(this._element, 'leaflet-zoom-anim')) { return; }

		if (L.Draggable._dragging || e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches) || !this._enabled) { return; }
		L.Draggable._dragging = true;  // Prevent dragging multiple objects at once.

		if (this._preventOutline) {
			L.DomUtil.preventOutline(this._element);
		}

		L.DomUtil.disableImageDrag();
		L.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		this.fire('down');

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new L.Point(first.clientX, first.clientY);
		this._startPos = this._newPos = L.DomUtil.getPosition(this._element);

		L.DomEvent
		    .on(document, L.Draggable.MOVE[e.type], this._onMove, this)
		    .on(document, L.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new L.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }
		if (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

		L.DomEvent.preventDefault(e);

		if (!this._moved) {
			this.fire('dragstart');

			this._moved = true;
			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

			L.DomUtil.addClass(document.body, 'leaflet-dragging');

			this._lastTarget = e.target || e.srcElement;
			L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		L.Util.cancelAnimFrame(this._animRequest);
		this._lastEvent = e;
		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true);
	},

	_updatePosition: function () {
		var e = {originalEvent: this._lastEvent};
		this.fire('predrag', e);
		L.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag', e);
	},

	_onUp: function () {
		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		if (this._lastTarget) {
			L.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');
			this._lastTarget = null;
		}

		for (var i in L.Draggable.MOVE) {
			L.DomEvent
			    .off(document, L.Draggable.MOVE[i], this._onMove, this)
			    .off(document, L.Draggable.END[i], this._onUp, this);
		}

		L.DomUtil.enableImageDrag();
		L.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			L.Util.cancelAnimFrame(this._animRequest);

			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
		L.Draggable._dragging = false;
	}
});



/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});



/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

L.Map.mergeOptions({
	dragging: true,

	inertia: !L.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	easeLinearity: 0.2,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				down: this._onDown,
				dragstart: this._onDragStart,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this);

			this._draggable.on('predrag', this._onPreDragLimit, this);
			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDragWrap, this);
				map.on('zoomend', this._onZoomEnd, this);

				map.whenReady(this._onZoomEnd, this);
			}
		}
		L.DomUtil.addClass(this._map._container, 'leaflet-grab');
		this._draggable.enable();
	},

	removeHooks: function () {
		L.DomUtil.removeClass(this._map._container, 'leaflet-grab');
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	moving: function () {
		return this._draggable && this._draggable._moving;
	},

	_onDown: function () {
		this._map.stop();
	},

	_onDragStart: function () {
		var map = this._map;

		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
			var bounds = L.latLngBounds(this._map.options.maxBounds);

			this._offsetLimit = L.bounds(
				this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
				this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
					.add(this._map.getSize()));

			this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
		} else {
			this._offsetLimit = null;
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function (e) {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 50) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move', e)
		    .fire('drag', e);
	},

	_onZoomEnd: function () {
		var pxCenter = this._map.getSize().divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
	},

	_viscousLimit: function (value, threshold) {
		return value - (value - threshold) * this._viscosity;
	},

	_onPreDragLimit: function () {
		if (!this._viscosity || !this._offsetLimit) { return; }

		var offset = this._draggable._newPos.subtract(this._draggable._startPos);

		var limit = this._offsetLimit;
		if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
		if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
		if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
		if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

		this._draggable._newPos = this._draggable._startPos.add(offset);
	},

	_onPreDragWrap: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._absPos = this._draggable._newPos.clone();
		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,

		    noInertia = !options.inertia || this._times.length < 2;

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x && !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true,
						animate: true
					});
				});
			}
		}
	}
});

L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);



/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

L.Map.mergeOptions({
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    oldZoom = map.getZoom(),
		    zoom = e.originalEvent.shiftKey ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);



/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

L.Map.mergeOptions({
	scrollWheelZoom: true,
	wheelDebounceTime: 40
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, {
			mousewheel: this._onWheelScroll,
			MozMousePixelScroll: L.DomEvent.preventDefault
		}, this);

		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, {
			mousewheel: this._onWheelScroll,
			MozMousePixelScroll: L.DomEvent.preventDefault
		}, this);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);
		var debounce = this._map.options.wheelDebounceTime;

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(debounce - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.stop(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		map.stop(); // stop panning and fly animations if any

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);



/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

L.extend(L.DomEvent, {

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last, touch,
		    doubleTap = false,
		    delay = 250;

		function onTouchStart(e) {
			var count;

			if (L.Browser.pointer) {
				count = L.DomEvent._pointersCount;
			} else {
				count = e.touches.length;
			}

			if (count > 1) { return; }

			var now = Date.now(),
			    delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd() {
			if (doubleTap && !touch.cancelBubble) {
				if (L.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = {},
					    prop, i;

					for (i in touch) {
						prop = touch[i];
						newTouch[i] = prop && prop.bind ? prop.bind(touch) : prop;
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}

		var pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend;

		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;

		obj.addEventListener(touchstart, onTouchStart, false);
		obj.addEventListener(touchend, onTouchEnd, false);
		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_',
		    touchend = obj[pre + this._touchend + id];

		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
		obj.removeEventListener(this._touchend, touchend, false);

		return this;
	}
});



/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	POINTER_DOWN:   L.Browser.msPointer ? 'MSPointerDown'   : 'pointerdown',
	POINTER_MOVE:   L.Browser.msPointer ? 'MSPointerMove'   : 'pointermove',
	POINTER_UP:     L.Browser.msPointer ? 'MSPointerUp'     : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: {},
	_pointersCount: 0,

	// Provides a touch events wrapper for (ms)pointer events.
	// ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		if (type === 'touchstart') {
			this._addPointerStart(obj, handler, id);

		} else if (type === 'touchmove') {
			this._addPointerMove(obj, handler, id);

		} else if (type === 'touchend') {
			this._addPointerEnd(obj, handler, id);
		}

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var handler = obj['_leaflet_' + type + id];

		if (type === 'touchstart') {
			obj.removeEventListener(this.POINTER_DOWN, handler, false);

		} else if (type === 'touchmove') {
			obj.removeEventListener(this.POINTER_MOVE, handler, false);

		} else if (type === 'touchend') {
			obj.removeEventListener(this.POINTER_UP, handler, false);
			obj.removeEventListener(this.POINTER_CANCEL, handler, false);
		}

		return this;
	},

	_addPointerStart: function (obj, handler, id) {
		var onDown = L.bind(function (e) {
			if (e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
				L.DomEvent.preventDefault(e);
			}

			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchstart' + id] = onDown;
		obj.addEventListener(this.POINTER_DOWN, onDown, false);

		// need to keep track of what pointers and how many are active to provide e.touches emulation
		if (!this._pointerDocListener) {
			var pointerUp = L.bind(this._globalPointerUp, this);

			// we listen documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_DOWN, L.bind(this._globalPointerDown, this), true);
			document.documentElement.addEventListener(this.POINTER_MOVE, L.bind(this._globalPointerMove, this), true);
			document.documentElement.addEventListener(this.POINTER_UP, pointerUp, true);
			document.documentElement.addEventListener(this.POINTER_CANCEL, pointerUp, true);

			this._pointerDocListener = true;
		}
	},

	_globalPointerDown: function (e) {
		this._pointers[e.pointerId] = e;
		this._pointersCount++;
	},

	_globalPointerMove: function (e) {
		if (this._pointers[e.pointerId]) {
			this._pointers[e.pointerId] = e;
		}
	},

	_globalPointerUp: function (e) {
		delete this._pointers[e.pointerId];
		this._pointersCount--;
	},

	_handlePointer: function (e, handler) {
		e.touches = [];
		for (var i in this._pointers) {
			e.touches.push(this._pointers[i]);
		}
		e.changedTouches = [e];

		handler(e);
	},

	_addPointerMove: function (obj, handler, id) {
		var onMove = L.bind(function (e) {
			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchmove' + id] = onMove;
		obj.addEventListener(this.POINTER_MOVE, onMove, false);
	},

	_addPointerEnd: function (obj, handler, id) {
		var onUp = L.bind(function (e) {
			this._handlePointer(e, handler);
		}, this);

		obj['_leaflet_touchend' + id] = onUp;
		obj.addEventListener(this.POINTER_UP, onUp, false);
		obj.addEventListener(this.POINTER_CANCEL, onUp, false);
	}
});



/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

L.Map.mergeOptions({
	touchZoom: L.Browser.touch && !L.Browser.android23,
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToContainerPoint(e.touches[0]),
		    p2 = map.mouseEventToContainerPoint(e.touches[1]);

		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.touchZoom !== 'center') {
			this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
		}

		this._startDist = p1.distanceTo(p2);
		this._startZoom = map.getZoom();

		this._moved = false;
		this._zooming = true;

		map.stop();

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var map = this._map,
		    p1 = map.mouseEventToContainerPoint(e.touches[0]),
		    p2 = map.mouseEventToContainerPoint(e.touches[1]),
		    scale = p1.distanceTo(p2) / this._startDist;


		this._zoom = map.getScaleZoom(scale, this._startZoom);

		if (map.options.touchZoom === 'center') {
			this._center = this._startLatLng;
			if (scale === 1) { return; }
		} else {
			// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
			var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
			if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
			this._center = map.unproject(map.project(this._pinchStartLatLng).subtract(delta));
		}

		if (!map.options.bounceAtZoomLimits) {
			if ((this._zoom <= map.getMinZoom() && scale < 1) ||
		        (this._zoom >= map.getMaxZoom() && scale > 1)) { return; }
		}

		if (!this._moved) {
			map._moveStart(true);
			this._moved = true;
		}

		L.Util.cancelAnimFrame(this._animRequest);

		var moveFn = L.bind(map._move, map, this._center, this._zoom, {pinch: true, round: false});
		this._animRequest = L.Util.requestAnimFrame(moveFn, this, true);

		L.DomEvent.preventDefault(e);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		this._zooming = false;
		L.Util.cancelAnimFrame(this._animRequest);

		L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		var zoom = this._zoom;
		zoom = this._map._limitZoom(zoom - this._startZoom > 0 ? Math.ceil(zoom) : Math.floor(zoom));


		this._map._animateZoom(this._center, zoom, true, true);
	}
});

L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);



/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

L.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		this._simulateEvent('mousedown', first);

		L.DomEvent.on(document, {
			touchmove: this._onMove,
			touchend: this._onUp
		}, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent.off(document, {
			touchmove: this._onMove,
			touchend: this._onUp
		}, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			this._simulateEvent('mouseup', first);

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
		this._simulateEvent('mousemove', first);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}



/*
 * L.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

L.Map.mergeOptions({
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown, this);
	},

	moved: function () {
		return this._moved;
	},

	_resetState: function () {
		this._moved = false;
	},

	_onMouseDown: function (e) {
		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		this._resetState();

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		L.DomEvent.on(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._moved = true;

			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._container);
			L.DomUtil.addClass(this._container, 'leaflet-crosshair');

			this._map.fire('boxzoomstart');
		}

		this._point = this._map.mouseEventToContainerPoint(e);

		var bounds = new L.Bounds(this._point, this._startPoint),
		    size = bounds.getSize();

		L.DomUtil.setPosition(this._box, bounds.min);

		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	_finish: function () {
		if (this._moved) {
			L.DomUtil.remove(this._box);
			L.DomUtil.removeClass(this._container, 'leaflet-crosshair');
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent.off(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseUp: function (e) {
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();

		if (!this._moved) { return; }
		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		setTimeout(L.bind(this._resetState, this), 0);

		var bounds = new L.LatLngBounds(
		        this._map.containerPointToLatLng(this._startPoint),
		        this._map.containerPointToLatLng(this._point));

		this._map
			.fitBounds(bounds)
			.fire('boxzoomend', {boxZoomBounds: bounds});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);



/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

L.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 54, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex <= 0) {
			container.tabIndex = '0';
		}

		L.DomEvent.on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			mousedown: this._onMouseDown
		}, this);

		this._map.on({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	removeHooks: function () {
		this._removeHooks();

		L.DomEvent.off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			mousedown: this._onMouseDown
		}, this);

		this._map.off({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

		var key = e.keyCode,
		    map = this._map,
		    offset;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			offset = this._panKeys[key];
			if (e.shiftKey) {
				offset = L.point(offset).multiplyBy(3);
			}

			map.panBy(offset);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

		} else if (key === 27) {
			map.closePopup();

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);



/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;

		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon, true);
		}

		this._draggable.on({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();

		L.DomUtil.addClass(icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable.off({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();

		if (this._marker._icon) {
			L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
		}
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function (e) {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;
		e.latlng = latlng;

		marker
		    .fire('move', e)
		    .fire('drag', e);
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});



/*
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

L.Control = L.Class.extend({
	options: {
		position: 'topright'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	getPosition: function () {
		return this.options.position;
	},

	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	getContainer: function () {
		return this._container;
	},

	addTo: function (map) {
		this.remove();
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	remove: function () {
		if (!this._map) {
			return this;
		}

		L.DomUtil.remove(this._container);

		if (this.onRemove) {
			this.onRemove(this._map);
		}

		this._map = null;

		return this;
	},

	_refocusOnMap: function (e) {
		// if map exists and event is not a keyboard event
		if (this._map && e && e.screenX > 0 && e.screenY > 0) {
			this._map.getContainer().focus();
		}
	}
});

L.control = function (options) {
	return new L.Control(options);
};


// adds control-related methods to L.Map

L.Map.include({
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	removeControl: function (control) {
		control.remove();
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		L.DomUtil.remove(this._controlContainer);
	}
});



/*
 * L.Control.Zoom is used for the default zoom buttons on the map.
 */

L.Control.Zoom = L.Control.extend({
	options: {
		position: 'topleft',
		zoomInText: '+',
		zoomInTitle: 'Zoom in',
		zoomOutText: '-',
		zoomOutTitle: 'Zoom out'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar'),
		    options = this.options;

		this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn);
		this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	disable: function () {
		this._disabled = true;
		this._updateDisabled();
		return this;
	},

	enable: function () {
		this._disabled = false;
		this._updateDisabled();
		return this;
	},

	_zoomIn: function (e) {
		if (!this._disabled) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		}
	},

	_zoomOut: function (e) {
		if (!this._disabled) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		}
	},

	_createButton: function (html, title, className, container, fn) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent
		    .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
		    .on(link, 'click', L.DomEvent.stop)
		    .on(link, 'click', fn, this)
		    .on(link, 'click', this._refocusOnMap, this);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
		    className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (this._disabled || map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (this._disabled || map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

L.Map.mergeOptions({
	zoomControl: true
});

L.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new L.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

L.control.zoom = function (options) {
	return new L.Control.Zoom(options);
};



/*
 * L.Control.Attribution is used for displaying attribution on the map (added by default).
 */

L.Control.Attribution = L.Control.extend({
	options: {
		position: 'bottomright',
		prefix: ''
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
		if (L.DomEvent) {
			L.DomEvent.disableClickPropagation(this._container);
		}

		// TODO ugly, refactor
		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}

		this._update();

		return this._container;
	},

	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	addAttribution: function (text) {
		if (!text) { return this; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	removeAttribution: function (text) {
		if (!text) { return this; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	}
});

L.Map.mergeOptions({
	attributionControl: true
});

L.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		this.attributionControl = (new L.Control.Attribution()).addTo(this);
	}
});

L.control.attribution = function (options) {
	return new L.Control.Attribution(options);
};



/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.Scale = L.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true
		// updateWhenIdle: false
	},

	onAdd: function (map) {
		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className + '-line', container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className, container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className, container);
		}
	},

	_update: function () {
		var map = this._map,
		    y = map.getSize().y / 2;

		var maxMeters = map.distance(
				map.containerPointToLatLng([0, y]),
				map.containerPointToLatLng([this.options.maxWidth, y]));

		this._updateScales(maxMeters);
	},

	_updateScales: function (maxMeters) {
		if (this.options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}
		if (this.options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters),
		    label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

		this._updateScale(this._mScale, label, meters / maxMeters);
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);
			this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);

		} else {
			feet = this._getRoundNum(maxFeet);
			this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
		}
	},

	_updateScale: function (scale, text, ratio) {
		scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
		scale.innerHTML = text;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 :
		    d >= 5 ? 5 :
		    d >= 3 ? 3 :
		    d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

L.control.scale = function (options) {
	return new L.Control.Scale(options);
};



/*
 * L.Control.Layers is a control to allow users to switch between different layers on the map.
 */

L.Control.Layers = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true,
		hideSingleBase: false
	},

	initialize: function (baseLayers, overlays, options) {
		L.setOptions(this, options);

		this._layers = {};
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		this._map = map;
		map.on('zoomend', this._checkDisabledLayers, this);

		return this._container;
	},

	onRemove: function () {
		this._map.off('zoomend', this._checkDisabledLayers, this);
	},

	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		return this._update();
	},

	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		return this._update();
	},

	removeLayer: function (layer) {
		layer.off('add remove', this._onLayerChange, this);

		delete this._layers[L.stamp(layer)];
		return this._update();
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		// makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		L.DomEvent.disableClickPropagation(container);
		if (!L.Browser.touch) {
			L.DomEvent.disableScrollPropagation(container);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent.on(container, {
					mouseenter: this._expand,
					mouseleave: this._collapse
				}, this);
			}

			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			} else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}

			// work around for Firefox Android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (layer, name, overlay) {
		layer.on('add remove', this._onLayerChange, this);

		var id = L.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) { return this; }

		L.DomUtil.empty(this._baseLayersList);
		L.DomUtil.empty(this._overlaysList);

		var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
			baseLayersCount += !obj.overlay ? 1 : 0;
		}

		// Hide base layers section if there's only one layer.
		if (this.options.hideSingleBase) {
			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
			this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

		return this;
	},

	_onLayerChange: function (e) {
		if (!this._handlingClick) {
			this._update();
		}

		var obj = this._layers[L.stamp(e.target)];

		var type = obj.overlay ?
			(e.type === 'add' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'add' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' +
				name + '"' + (checked ? ' checked="checked"' : '') + '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    checked = this._map.hasLayer(obj.layer),
		    input;

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = L.stamp(obj.layer);

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		// Helps from preventing layer control flicker when checkboxes are disabled
		// https://github.com/Leaflet/Leaflet/issues/2771
		var holder = document.createElement('div');

		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		this._checkDisabledLayers();
		return label;
	},

	_onInputClick: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    input, layer, hasLayer;
		var addedLayers = [],
		    removedLayers = [];

		this._handlingClick = true;

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			layer = this._layers[input.layerId].layer;
			hasLayer = this._map.hasLayer(layer);

			if (input.checked && !hasLayer) {
				addedLayers.push(layer);

			} else if (!input.checked && hasLayer) {
				removedLayers.push(layer);
			}
		}

		// Bugfix issue 2318: Should remove all old layers before readding new ones
		for (i = 0; i < removedLayers.length; i++) {
			this._map.removeLayer(removedLayers[i]);
		}
		for (i = 0; i < addedLayers.length; i++) {
			this._map.addLayer(addedLayers[i]);
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
		this._form.style.height = null;
		var acceptableHeight = this._map._size.y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._form.clientHeight) {
			L.DomUtil.addClass(this._form, 'leaflet-control-layers-scrollbar');
			this._form.style.height = acceptableHeight + 'px';
		} else {
			L.DomUtil.removeClass(this._form, 'leaflet-control-layers-scrollbar');
		}
		this._checkDisabledLayers();
	},

	_collapse: function () {
		L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
	},

	_checkDisabledLayers: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    input,
		    layer,
		    zoom = this._map.getZoom();

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			layer = this._layers[input.layerId].layer;
			input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
			                 (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);

		}
	}
});

L.control.layers = function (baseLayers, overlays, options) {
	return new L.Control.Layers(baseLayers, overlays, options);
};



/*
 * L.PosAnimation powers Leaflet pan animations internally.
 */

L.PosAnimation = L.Evented.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step(true);
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function (round) {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration), round);
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress, round) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		if (round) {
			pos._round();
		}
		L.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});



/*
 * Extends L.Map to handle panning animations.
 */

L.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		this.stop();

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate, duration: options.duration}, options.pan);
			}

			// try animating pan or zoom
			var moved = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (moved) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this.fire('moveend');
		}
		// If we pan too far, Chrome gets issues with tiles
		// and makes them disappear or appear in the wrong place (slightly offset) #2602
		if (options.animate !== true && !this.getSize().contains(offset)) {
			this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});



/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

var zoomAnimated = L.DomUtil.TRANSITION && L.Browser.any3d && !L.Browser.mobileOpera;

if (zoomAnimated) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {

			this._createAnimProxy();

			L.DomEvent.on(this._proxy, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!zoomAnimated ? {} : {

	_createAnimProxy: function () {

		var proxy = this._proxy = L.DomUtil.create('div', 'leaflet-proxy leaflet-zoom-animated');
		this._panes.mapPane.appendChild(proxy);

		this.on('zoomanim', function (e) {
			var prop = L.DomUtil.TRANSFORM,
			    transform = proxy.style[prop];

			L.DomUtil.setTransform(proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

			// workaround for case when transform is the same and so transitionend event is not fired
			if (transform === proxy.style[prop] && this._animatingZoom) {
				this._onZoomTransitionEnd();
			}
		}, this);

		this.on('load moveend', function () {
			var c = this.getCenter(),
			    z = this.getZoom();
			L.DomUtil.setTransform(proxy, this.project(c, z), this.getZoomScale(z, 1));
		}, this);
	},

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		L.Util.requestAnimFrame(function () {
			this
			    ._moveStart(true)
			    ._animateZoom(center, zoom, true);
		}, this);

		return true;
	},

	_animateZoom: function (center, zoom, startAnim, noUpdate) {
		if (startAnim) {
			this._animatingZoom = true;

			// remember what center/zoom to set after animation
			this._animateToCenter = center;
			this._animateToZoom = zoom;

			L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');
		}

		this.fire('zoomanim', {
			center: center,
			zoom: zoom,
			noUpdate: noUpdate
		});

		// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
		setTimeout(L.bind(this._onZoomTransitionEnd, this), 250);
	},

	_onZoomTransitionEnd: function () {
		if (!this._animatingZoom) { return; }

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		// This anim frame should prevent an obscure iOS webkit tile loading race condition.
		L.Util.requestAnimFrame(function () {
			this._animatingZoom = false;

			this
				._move(this._animateToCenter, this._animateToZoom)
				._moveEnd(true);
		}, this);
	}
});




L.Map.include({
	flyTo: function (targetCenter, targetZoom, options) {

		options = options || {};
		if (options.animate === false || !L.Browser.any3d) {
			return this.setView(targetCenter, targetZoom, options);
		}

		this.stop();

		var from = this.project(this.getCenter()),
		    to = this.project(targetCenter),
		    size = this.getSize(),
		    startZoom = this._zoom;

		targetCenter = L.latLng(targetCenter);
		targetZoom = targetZoom === undefined ? startZoom : targetZoom;

		var w0 = Math.max(size.x, size.y),
		    w1 = w0 * this.getZoomScale(startZoom, targetZoom),
		    u1 = (to.distanceTo(from)) || 1,
		    rho = 1.42,
		    rho2 = rho * rho;

		function r(i) {
			var b = (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (i ? w1 : w0) * rho2 * u1);
			return Math.log(Math.sqrt(b * b + 1) - b);
		}

		function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
		function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
		function tanh(n) { return sinh(n) / cosh(n); }

		var r0 = r(0);

		function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
		function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

		function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }

		var start = Date.now(),
		    S = (r(1) - r0) / rho,
		    duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

		function frame() {
			var t = (Date.now() - start) / duration,
			    s = easeOut(t) * S;

			if (t <= 1) {
				this._flyToFrame = L.Util.requestAnimFrame(frame, this);

				this._move(
					this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
					this.getScaleZoom(w0 / w(s), startZoom),
					{flyTo: true});

			} else {
				this
					._move(targetCenter, targetZoom)
					._moveEnd(true);
			}
		}

		this._moveStart(true);

		frame.call(this);
		return this;
	},

	flyToBounds: function (bounds, options) {
		var target = this._getBoundsCenterZoom(bounds, options);
		return this.flyTo(target.center, target.zoom, options);
	}
});



/*
 * Provides L.Map with convenient shortcuts for using browser geolocation features.
 */

L.Map.include({
	_defaultLocateOptions: {
		timeout: 10000,
		watch: false
		// setView: false
		// maxZoom: <Number>
		// maximumAge: 0
		// enableHighAccuracy: false
	},

	locate: function (options) {

		options = this._locateOptions = L.extend({}, this._defaultLocateOptions, options);

		if (!('geolocation' in navigator)) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
		    onError = L.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	stopLocate: function () {
		if (navigator.geolocation && navigator.geolocation.clearWatch) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new L.LatLng(lat, lng),
		    bounds = latlng.toBounds(pos.coords.accuracy),
		    options = this._locateOptions;

		if (options.setView) {
			var zoom = this.getBoundsZoom(bounds);
			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}
});



!function(t,s){"function"==typeof define&&define.amd?define(s):"undefined"!=typeof module?module.exports=s():t.proj4=s()}(this,function(){var t,s,i;return function(a){function h(t,s){return x.call(t,s)}function e(t,s){var i,a,h,e,n,r,o,l,u,c,M=s&&s.split("/"),f=y.map,m=f&&f["*"]||{};if(t&&"."===t.charAt(0))if(s){for(M=M.slice(0,M.length-1),t=M.concat(t.split("/")),l=0;l<t.length;l+=1)if(c=t[l],"."===c)t.splice(l,1),l-=1;else if(".."===c){if(1===l&&(".."===t[2]||".."===t[0]))break;l>0&&(t.splice(l-1,2),l-=2)}t=t.join("/")}else 0===t.indexOf("./")&&(t=t.substring(2));if((M||m)&&f){for(i=t.split("/"),l=i.length;l>0;l-=1){if(a=i.slice(0,l).join("/"),M)for(u=M.length;u>0;u-=1)if(h=f[M.slice(0,u).join("/")],h&&(h=h[a])){e=h,n=l;break}if(e)break;!r&&m&&m[a]&&(r=m[a],o=l)}!e&&r&&(e=r,n=o),e&&(i.splice(0,n,e),t=i.join("/"))}return t}function n(t,s){return function(){return f.apply(a,v.call(arguments,0).concat([t,s]))}}function r(t){return function(s){return e(s,t)}}function o(t){return function(s){_[t]=s}}function l(t){if(h(d,t)){var s=d[t];delete d[t],g[t]=!0,M.apply(a,s)}if(!h(_,t)&&!h(g,t))throw new Error("No "+t);return _[t]}function u(t){var s,i=t?t.indexOf("!"):-1;return i>-1&&(s=t.substring(0,i),t=t.substring(i+1,t.length)),[s,t]}function c(t){return function(){return y&&y.config&&y.config[t]||{}}}var M,f,m,p,_={},d={},y={},g={},x=Object.prototype.hasOwnProperty,v=[].slice;m=function(t,s){var i,a=u(t),h=a[0];return t=a[1],h&&(h=e(h,s),i=l(h)),h?t=i&&i.normalize?i.normalize(t,r(s)):e(t,s):(t=e(t,s),a=u(t),h=a[0],t=a[1],h&&(i=l(h))),{f:h?h+"!"+t:t,n:t,pr:h,p:i}},p={require:function(t){return n(t)},exports:function(t){var s=_[t];return"undefined"!=typeof s?s:_[t]={}},module:function(t){return{id:t,uri:"",exports:_[t],config:c(t)}}},M=function(t,s,i,e){var r,u,c,M,f,y,x=[];if(e=e||t,"function"==typeof i){for(s=!s.length&&i.length?["require","exports","module"]:s,f=0;f<s.length;f+=1)if(M=m(s[f],e),u=M.f,"require"===u)x[f]=p.require(t);else if("exports"===u)x[f]=p.exports(t),y=!0;else if("module"===u)r=x[f]=p.module(t);else if(h(_,u)||h(d,u)||h(g,u))x[f]=l(u);else{if(!M.p)throw new Error(t+" missing "+u);M.p.load(M.n,n(e,!0),o(u),{}),x[f]=_[u]}c=i.apply(_[t],x),t&&(r&&r.exports!==a&&r.exports!==_[t]?_[t]=r.exports:c===a&&y||(_[t]=c))}else t&&(_[t]=i)},t=s=f=function(t,s,i,h,e){return"string"==typeof t?p[t]?p[t](s):l(m(t,s).f):(t.splice||(y=t,s.splice?(t=s,s=i,i=null):t=a),s=s||function(){},"function"==typeof i&&(i=h,h=e),h?M(a,t,s,i):setTimeout(function(){M(a,t,s,i)},4),f)},f.config=function(t){return y=t,y.deps&&f(y.deps,y.callback),f},t._defined=_,i=function(t,s,i){s.splice||(i=s,s=[]),h(_,t)||h(d,t)||(d[t]=[t,s,i])},i.amd={jQuery:!0}}(),i("node_modules/almond/almond",function(){}),i("proj4/mgrs",["require","exports","module"],function(t,s){function i(t){return t*(Math.PI/180)}function a(t){return 180*(t/Math.PI)}function h(t){var s,a,h,e,r,o,l,u,c,M=t.lat,f=t.lon,m=6378137,p=.00669438,_=.9996,d=i(M),y=i(f);c=Math.floor((f+180)/6)+1,180===f&&(c=60),M>=56&&64>M&&f>=3&&12>f&&(c=32),M>=72&&84>M&&(f>=0&&9>f?c=31:f>=9&&21>f?c=33:f>=21&&33>f?c=35:f>=33&&42>f&&(c=37)),s=6*(c-1)-180+3,u=i(s),a=p/(1-p),h=m/Math.sqrt(1-p*Math.sin(d)*Math.sin(d)),e=Math.tan(d)*Math.tan(d),r=a*Math.cos(d)*Math.cos(d),o=Math.cos(d)*(y-u),l=m*((1-p/4-3*p*p/64-5*p*p*p/256)*d-(3*p/8+3*p*p/32+45*p*p*p/1024)*Math.sin(2*d)+(15*p*p/256+45*p*p*p/1024)*Math.sin(4*d)-35*p*p*p/3072*Math.sin(6*d));var g=_*h*(o+(1-e+r)*o*o*o/6+(5-18*e+e*e+72*r-58*a)*o*o*o*o*o/120)+5e5,x=_*(l+h*Math.tan(d)*(o*o/2+(5-e+9*r+4*r*r)*o*o*o*o/24+(61-58*e+e*e+600*r-330*a)*o*o*o*o*o*o/720));return 0>M&&(x+=1e7),{northing:Math.round(x),easting:Math.round(g),zoneNumber:c,zoneLetter:n(M)}}function e(t){var s=t.northing,i=t.easting,h=t.zoneLetter,n=t.zoneNumber;if(0>n||n>60)return null;var r,o,l,u,c,M,f,m,p,_,d=.9996,y=6378137,g=.00669438,x=(1-Math.sqrt(1-g))/(1+Math.sqrt(1-g)),v=i-5e5,P=s;"N">h&&(P-=1e7),m=6*(n-1)-180+3,r=g/(1-g),f=P/d,p=f/(y*(1-g/4-3*g*g/64-5*g*g*g/256)),_=p+(3*x/2-27*x*x*x/32)*Math.sin(2*p)+(21*x*x/16-55*x*x*x*x/32)*Math.sin(4*p)+151*x*x*x/96*Math.sin(6*p),o=y/Math.sqrt(1-g*Math.sin(_)*Math.sin(_)),l=Math.tan(_)*Math.tan(_),u=r*Math.cos(_)*Math.cos(_),c=y*(1-g)/Math.pow(1-g*Math.sin(_)*Math.sin(_),1.5),M=v/(o*d);var b=_-o*Math.tan(_)/c*(M*M/2-(5+3*l+10*u-4*u*u-9*r)*M*M*M*M/24+(61+90*l+298*u+45*l*l-252*r-3*u*u)*M*M*M*M*M*M/720);b=a(b);var C=(M-(1+2*l+u)*M*M*M/6+(5-2*u+28*l-3*u*u+8*r+24*l*l)*M*M*M*M*M/120)/Math.cos(_);C=m+a(C);var S;if(t.accuracy){var j=e({northing:t.northing+t.accuracy,easting:t.easting+t.accuracy,zoneLetter:t.zoneLetter,zoneNumber:t.zoneNumber});S={top:j.lat,right:j.lon,bottom:b,left:C}}else S={lat:b,lon:C};return S}function n(t){var s="Z";return 84>=t&&t>=72?s="X":72>t&&t>=64?s="W":64>t&&t>=56?s="V":56>t&&t>=48?s="U":48>t&&t>=40?s="T":40>t&&t>=32?s="S":32>t&&t>=24?s="R":24>t&&t>=16?s="Q":16>t&&t>=8?s="P":8>t&&t>=0?s="N":0>t&&t>=-8?s="M":-8>t&&t>=-16?s="L":-16>t&&t>=-24?s="K":-24>t&&t>=-32?s="J":-32>t&&t>=-40?s="H":-40>t&&t>=-48?s="G":-48>t&&t>=-56?s="F":-56>t&&t>=-64?s="E":-64>t&&t>=-72?s="D":-72>t&&t>=-80&&(s="C"),s}function r(t,s){var i=""+t.easting,a=""+t.northing;return t.zoneNumber+t.zoneLetter+o(t.easting,t.northing,t.zoneNumber)+i.substr(i.length-5,s)+a.substr(a.length-5,s)}function o(t,s,i){var a=l(i),h=Math.floor(t/1e5),e=Math.floor(s/1e5)%20;return u(h,e,a)}function l(t){var s=t%p;return 0===s&&(s=p),s}function u(t,s,i){var a=i-1,h=_.charCodeAt(a),e=d.charCodeAt(a),n=h+t-1,r=e+s,o=!1;n>P&&(n=n-P+y-1,o=!0),(n===g||g>h&&n>g||(n>g||g>h)&&o)&&n++,(n===x||x>h&&n>x||(n>x||x>h)&&o)&&(n++,n===g&&n++),n>P&&(n=n-P+y-1),r>v?(r=r-v+y-1,o=!0):o=!1,(r===g||g>e&&r>g||(r>g||g>e)&&o)&&r++,(r===x||x>e&&r>x||(r>x||x>e)&&o)&&(r++,r===g&&r++),r>v&&(r=r-v+y-1);var l=String.fromCharCode(n)+String.fromCharCode(r);return l}function c(t){if(t&&0===t.length)throw"MGRSPoint coverting from nothing";for(var s,i=t.length,a=null,h="",e=0;!/[A-Z]/.test(s=t.charAt(e));){if(e>=2)throw"MGRSPoint bad conversion from: "+t;h+=s,e++}var n=parseInt(h,10);if(0===e||e+3>i)throw"MGRSPoint bad conversion from: "+t;var r=t.charAt(e++);if("A">=r||"B"===r||"Y"===r||r>="Z"||"I"===r||"O"===r)throw"MGRSPoint zone letter "+r+" not handled: "+t;a=t.substring(e,e+=2);for(var o=l(n),u=M(a.charAt(0),o),c=f(a.charAt(1),o);c<m(r);)c+=2e6;var p=i-e;if(0!==p%2)throw"MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters"+t;var _,d,y,g,x,v=p/2,P=0,b=0;return v>0&&(_=1e5/Math.pow(10,v),d=t.substring(e,e+v),P=parseFloat(d)*_,y=t.substring(e+v),b=parseFloat(y)*_),g=P+u,x=b+c,{easting:g,northing:x,zoneLetter:r,zoneNumber:n,accuracy:_}}function M(t,s){for(var i=_.charCodeAt(s-1),a=1e5,h=!1;i!==t.charCodeAt(0);){if(i++,i===g&&i++,i===x&&i++,i>P){if(h)throw"Bad character: "+t;i=y,h=!0}a+=1e5}return a}function f(t,s){if(t>"V")throw"MGRSPoint given invalid Northing "+t;for(var i=d.charCodeAt(s-1),a=0,h=!1;i!==t.charCodeAt(0);){if(i++,i===g&&i++,i===x&&i++,i>v){if(h)throw"Bad character: "+t;i=y,h=!0}a+=1e5}return a}function m(t){var s;switch(t){case"C":s=11e5;break;case"D":s=2e6;break;case"E":s=28e5;break;case"F":s=37e5;break;case"G":s=46e5;break;case"H":s=55e5;break;case"J":s=64e5;break;case"K":s=73e5;break;case"L":s=82e5;break;case"M":s=91e5;break;case"N":s=0;break;case"P":s=8e5;break;case"Q":s=17e5;break;case"R":s=26e5;break;case"S":s=35e5;break;case"T":s=44e5;break;case"U":s=53e5;break;case"V":s=62e5;break;case"W":s=7e6;break;case"X":s=79e5;break;default:s=-1}if(s>=0)return s;throw"Invalid zone letter: "+t}var p=6,_="AJSAJS",d="AFAFAF",y=65,g=73,x=79,v=86,P=90;s.forward=function(t,s){return s=s||5,r(h({lat:t.lat,lon:t.lon}),s)},s.inverse=function(t){var s=e(c(t.toUpperCase()));return[s.left,s.bottom,s.right,s.top]}}),i("proj4/Point",["./mgrs"],function(t){function s(t,i,a){if(!(this instanceof s))return new s(t,i,a);if("object"==typeof t)this.x=t[0],this.y=t[1],this.z=t[2]||0;else if("string"==typeof t&&"undefined"==typeof i){var h=t.split(",");this.x=parseFloat(h[0]),this.y=parseFloat(h[1]),this.z=parseFloat(h[2])||0}else this.x=t,this.y=i,this.z=a||0;this.clone=function(){return new s(this.x,this.y,this.z)},this.toString=function(){return"x="+this.x+",y="+this.y},this.toShortString=function(){return this.x+", "+this.y}}return s.fromMGRS=function(i){var a=t.inverse(i);return new s((a[2]+a[0])/2,(a[3]+a[1])/2)},s.prototype.toMGRS=function(s){return t.forward({lon:this.x,lat:this.y},s)},s}),i("proj4/extend",[],function(){return function(t,s){t=t||{};var i,a;if(!s)return t;for(a in s)i=s[a],void 0!==i&&(t[a]=i);return t}}),i("proj4/common",[],function(){var t={PI:3.141592653589793,HALF_PI:1.5707963267948966,TWO_PI:6.283185307179586,FORTPI:.7853981633974483,R2D:57.29577951308232,D2R:.017453292519943295,SEC_TO_RAD:484813681109536e-20,EPSLN:1e-10,MAX_ITER:20,COS_67P5:.3826834323650898,AD_C:1.0026,PJD_UNKNOWN:0,PJD_3PARAM:1,PJD_7PARAM:2,PJD_GRIDSHIFT:3,PJD_WGS84:4,PJD_NODATUM:5,SRS_WGS84_SEMIMAJOR:6378137,SRS_WGS84_ESQUARED:.006694379990141316,SIXTH:.16666666666666666,RA4:.04722222222222222,RA6:.022156084656084655,RV4:.06944444444444445,RV6:.04243827160493827,msfnz:function(t,s,i){var a=t*s;return i/Math.sqrt(1-a*a)},tsfnz:function(t,s,i){var a=t*i,h=.5*t;return a=Math.pow((1-a)/(1+a),h),Math.tan(.5*(this.HALF_PI-s))/a},phi2z:function(t,s){for(var i,a,h=.5*t,e=this.HALF_PI-2*Math.atan(s),n=0;15>=n;n++)if(i=t*Math.sin(e),a=this.HALF_PI-2*Math.atan(s*Math.pow((1-i)/(1+i),h))-e,e+=a,Math.abs(a)<=1e-10)return e;return-9999},qsfnz:function(t,s){var i;return t>1e-7?(i=t*s,(1-t*t)*(s/(1-i*i)-.5/t*Math.log((1-i)/(1+i)))):2*s},iqsfnz:function(s,i){var a=1-(1-s*s)/(2*s)*Math.log((1-s)/(1+s));if(Math.abs(Math.abs(i)-a)<1e-6)return 0>i?-1*t.HALF_PI:t.HALF_PI;for(var h,e,n,r,o=Math.asin(.5*i),l=0;30>l;l++)if(e=Math.sin(o),n=Math.cos(o),r=s*e,h=Math.pow(1-r*r,2)/(2*n)*(i/(1-s*s)-e/(1-r*r)+.5/s*Math.log((1-r)/(1+r))),o+=h,Math.abs(h)<=1e-10)return o;return 0/0},asinz:function(t){return Math.abs(t)>1&&(t=t>1?1:-1),Math.asin(t)},e0fn:function(t){return 1-.25*t*(1+t/16*(3+1.25*t))},e1fn:function(t){return.375*t*(1+.25*t*(1+.46875*t))},e2fn:function(t){return.05859375*t*t*(1+.75*t)},e3fn:function(t){return t*t*t*(35/3072)},mlfn:function(t,s,i,a,h){return t*h-s*Math.sin(2*h)+i*Math.sin(4*h)-a*Math.sin(6*h)},imlfn:function(t,s,i,a,h){var e,n;e=t/s;for(var r=0;15>r;r++)if(n=(t-(s*e-i*Math.sin(2*e)+a*Math.sin(4*e)-h*Math.sin(6*e)))/(s-2*i*Math.cos(2*e)+4*a*Math.cos(4*e)-6*h*Math.cos(6*e)),e+=n,Math.abs(n)<=1e-10)return e;return 0/0},srat:function(t,s){return Math.pow((1-t)/(1+t),s)},sign:function(t){return 0>t?-1:1},adjust_lon:function(t){return t=Math.abs(t)<this.PI?t:t-this.sign(t)*this.TWO_PI},adjust_lat:function(t){return t=Math.abs(t)<this.HALF_PI?t:t-this.sign(t)*this.PI},latiso:function(t,s,i){if(Math.abs(s)>this.HALF_PI)return Number.NaN;if(s===this.HALF_PI)return Number.POSITIVE_INFINITY;if(s===-1*this.HALF_PI)return Number.NEGATIVE_INFINITY;var a=t*i;return Math.log(Math.tan((this.HALF_PI+s)/2))+t*Math.log((1-a)/(1+a))/2},fL:function(t,s){return 2*Math.atan(t*Math.exp(s))-this.HALF_PI},invlatiso:function(t,s){var i=this.fL(1,s),a=0,h=0;do a=i,h=t*Math.sin(a),i=this.fL(Math.exp(t*Math.log((1+h)/(1-h))/2),s);while(Math.abs(i-a)>1e-12);return i},sinh:function(t){var s=Math.exp(t);return s=(s-1/s)/2},cosh:function(t){var s=Math.exp(t);return s=(s+1/s)/2},tanh:function(t){var s=Math.exp(t);return s=(s-1/s)/(s+1/s)},asinh:function(t){var s=t>=0?1:-1;return s*Math.log(Math.abs(t)+Math.sqrt(t*t+1))},acosh:function(t){return 2*Math.log(Math.sqrt((t+1)/2)+Math.sqrt((t-1)/2))},atanh:function(t){return Math.log((t-1)/(t+1))/2},gN:function(t,s,i){var a=s*i;return t/Math.sqrt(1-a*a)},pj_enfn:function(t){var s=[];s[0]=this.C00-t*(this.C02+t*(this.C04+t*(this.C06+t*this.C08))),s[1]=t*(this.C22-t*(this.C04+t*(this.C06+t*this.C08)));var i=t*t;return s[2]=i*(this.C44-t*(this.C46+t*this.C48)),i*=t,s[3]=i*(this.C66-t*this.C68),s[4]=i*t*this.C88,s},pj_mlfn:function(t,s,i,a){return i*=s,s*=s,a[0]*t-i*(a[1]+s*(a[2]+s*(a[3]+s*a[4])))},pj_inv_mlfn:function(s,i,a){for(var h=1/(1-i),e=s,n=t.MAX_ITER;n;--n){var r=Math.sin(e),o=1-i*r*r;if(o=(this.pj_mlfn(e,r,Math.cos(e),a)-s)*o*Math.sqrt(o)*h,e-=o,Math.abs(o)<t.EPSLN)return e}return e},nad_intr:function(t,s){var i,a={x:(t.x-1e-7)/s.del[0],y:(t.y-1e-7)/s.del[1]},h={x:Math.floor(a.x),y:Math.floor(a.y)},e={x:a.x-1*h.x,y:a.y-1*h.y},n={x:Number.NaN,y:Number.NaN};if(h.x<0){if(!(-1===h.x&&e.x>.99999999999))return n;h.x++,e.x=0}else if(i=h.x+1,i>=s.lim[0]){if(!(i===s.lim[0]&&e.x<1e-11))return n;h.x--,e.x=1}if(h.y<0){if(!(-1===h.y&&e.y>.99999999999))return n;h.y++,e.y=0}else if(i=h.y+1,i>=s.lim[1]){if(!(i===s.lim[1]&&e.y<1e-11))return n;h.y++,e.y=1}i=h.y*s.lim[0]+h.x;var r={x:s.cvs[i][0],y:s.cvs[i][1]};i++;var o={x:s.cvs[i][0],y:s.cvs[i][1]};i+=s.lim[0];var l={x:s.cvs[i][0],y:s.cvs[i][1]};i--;var u={x:s.cvs[i][0],y:s.cvs[i][1]},c=e.x*e.y,M=e.x*(1-e.y),f=(1-e.x)*(1-e.y),m=(1-e.x)*e.y;return n.x=f*r.x+M*o.x+m*u.x+c*l.x,n.y=f*r.y+M*o.y+m*u.y+c*l.y,n},nad_cvt:function(s,i,a){var h={x:Number.NaN,y:Number.NaN};if(isNaN(s.x))return h;var e={x:s.x,y:s.y};e.x-=a.ll[0],e.y-=a.ll[1],e.x=t.adjust_lon(e.x-t.PI)+t.PI;var n=t.nad_intr(e,a);if(i){if(isNaN(n.x))return h;n.x=e.x+n.x,n.y=e.y-n.y;var r,o,l=9,u=1e-12;do{if(o=t.nad_intr(n,a),isNaN(o.x)){this.reportError("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");break}r={x:n.x-o.x-e.x,y:n.y+o.y-e.y},n.x-=r.x,n.y-=r.y}while(l--&&Math.abs(r.x)>u&&Math.abs(r.y)>u);if(0>l)return this.reportError("Inverse grid shift iterator failed to converge."),h;h.x=t.adjust_lon(n.x+a.ll[0]),h.y=n.y+a.ll[1]}else isNaN(n.x)||(h.x=s.x-n.x,h.y=s.y+n.y);return h},C00:1,C02:.25,C04:.046875,C06:.01953125,C08:.01068115234375,C22:.75,C44:.46875,C46:.013020833333333334,C48:.007120768229166667,C66:.3645833333333333,C68:.005696614583333333,C88:.3076171875};return t}),i("proj4/constants",[],function(){var t={};return t.PrimeMeridian={greenwich:0,lisbon:-9.131906111111,paris:2.337229166667,bogota:-74.080916666667,madrid:-3.687938888889,rome:12.452333333333,bern:7.439583333333,jakarta:106.807719444444,ferro:-17.666666666667,brussels:4.367975,stockholm:18.058277777778,athens:23.7163375,oslo:10.722916666667},t.Ellipsoid={MERIT:{a:6378137,rf:298.257,ellipseName:"MERIT 1983"},SGS85:{a:6378136,rf:298.257,ellipseName:"Soviet Geodetic System 85"},GRS80:{a:6378137,rf:298.257222101,ellipseName:"GRS 1980(IUGG, 1980)"},IAU76:{a:6378140,rf:298.257,ellipseName:"IAU 1976"},airy:{a:6377563.396,b:6356256.91,ellipseName:"Airy 1830"},"APL4.":{a:6378137,rf:298.25,ellipseName:"Appl. Physics. 1965"},NWL9D:{a:6378145,rf:298.25,ellipseName:"Naval Weapons Lab., 1965"},mod_airy:{a:6377340.189,b:6356034.446,ellipseName:"Modified Airy"},andrae:{a:6377104.43,rf:300,ellipseName:"Andrae 1876 (Den., Iclnd.)"},aust_SA:{a:6378160,rf:298.25,ellipseName:"Australian Natl & S. Amer. 1969"},GRS67:{a:6378160,rf:298.247167427,ellipseName:"GRS 67(IUGG 1967)"},bessel:{a:6377397.155,rf:299.1528128,ellipseName:"Bessel 1841"},bess_nam:{a:6377483.865,rf:299.1528128,ellipseName:"Bessel 1841 (Namibia)"},clrk66:{a:6378206.4,b:6356583.8,ellipseName:"Clarke 1866"},clrk80:{a:6378249.145,rf:293.4663,ellipseName:"Clarke 1880 mod."},clrk58:{a:6378293.645208759,rf:294.2606763692654,ellipseName:"Clarke 1858"},CPM:{a:6375738.7,rf:334.29,ellipseName:"Comm. des Poids et Mesures 1799"},delmbr:{a:6376428,rf:311.5,ellipseName:"Delambre 1810 (Belgium)"},engelis:{a:6378136.05,rf:298.2566,ellipseName:"Engelis 1985"},evrst30:{a:6377276.345,rf:300.8017,ellipseName:"Everest 1830"},evrst48:{a:6377304.063,rf:300.8017,ellipseName:"Everest 1948"},evrst56:{a:6377301.243,rf:300.8017,ellipseName:"Everest 1956"},evrst69:{a:6377295.664,rf:300.8017,ellipseName:"Everest 1969"},evrstSS:{a:6377298.556,rf:300.8017,ellipseName:"Everest (Sabah & Sarawak)"},fschr60:{a:6378166,rf:298.3,ellipseName:"Fischer (Mercury Datum) 1960"},fschr60m:{a:6378155,rf:298.3,ellipseName:"Fischer 1960"},fschr68:{a:6378150,rf:298.3,ellipseName:"Fischer 1968"},helmert:{a:6378200,rf:298.3,ellipseName:"Helmert 1906"},hough:{a:6378270,rf:297,ellipseName:"Hough"},intl:{a:6378388,rf:297,ellipseName:"International 1909 (Hayford)"},kaula:{a:6378163,rf:298.24,ellipseName:"Kaula 1961"},lerch:{a:6378139,rf:298.257,ellipseName:"Lerch 1979"},mprts:{a:6397300,rf:191,ellipseName:"Maupertius 1738"},new_intl:{a:6378157.5,b:6356772.2,ellipseName:"New International 1967"},plessis:{a:6376523,rf:6355863,ellipseName:"Plessis 1817 (France)"},krass:{a:6378245,rf:298.3,ellipseName:"Krassovsky, 1942"},SEasia:{a:6378155,b:6356773.3205,ellipseName:"Southeast Asia"},walbeck:{a:6376896,b:6355834.8467,ellipseName:"Walbeck"},WGS60:{a:6378165,rf:298.3,ellipseName:"WGS 60"},WGS66:{a:6378145,rf:298.25,ellipseName:"WGS 66"},WGS72:{a:6378135,rf:298.26,ellipseName:"WGS 72"},WGS84:{a:6378137,rf:298.257223563,ellipseName:"WGS 84"},sphere:{a:6370997,b:6370997,ellipseName:"Normal Sphere (r=6370997)"}},t.Datum={wgs84:{towgs84:"0,0,0",ellipse:"WGS84",datumName:"WGS84"},ch1903:{towgs84:"674.374,15.056,405.346",ellipse:"bessel",datumName:"swiss"},ggrs87:{towgs84:"-199.87,74.79,246.62",ellipse:"GRS80",datumName:"Greek_Geodetic_Reference_System_1987"},nad83:{towgs84:"0,0,0",ellipse:"GRS80",datumName:"North_American_Datum_1983"},nad27:{nadgrids:"@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",ellipse:"clrk66",datumName:"North_American_Datum_1927"},potsdam:{towgs84:"606.0,23.0,413.0",ellipse:"bessel",datumName:"Potsdam Rauenberg 1950 DHDN"},carthage:{towgs84:"-263.0,6.0,431.0",ellipse:"clark80",datumName:"Carthage 1934 Tunisia"},hermannskogel:{towgs84:"653.0,-212.0,449.0",ellipse:"bessel",datumName:"Hermannskogel"},ire65:{towgs84:"482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",ellipse:"mod_airy",datumName:"Ireland 1965"},rassadiran:{towgs84:"-133.63,-157.5,-158.62",ellipse:"intl",datumName:"Rassadiran"},nzgd49:{towgs84:"59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",ellipse:"intl",datumName:"New Zealand Geodetic Datum 1949"},osgb36:{towgs84:"446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",ellipse:"airy",datumName:"Airy 1830"},s_jtsk:{towgs84:"589,76,480",ellipse:"bessel",datumName:"S-JTSK (Ferro)"},beduaram:{towgs84:"-106,-87,188",ellipse:"clrk80",datumName:"Beduaram"},gunung_segara:{towgs84:"-403,684,41",ellipse:"bessel",datumName:"Gunung Segara Jakarta"}},t.Datum.OSB36=t.Datum.OSGB36,t.wktProjections={"Lambert Tangential Conformal Conic Projection":"lcc",Lambert_Conformal_Conic:"lcc",Lambert_Conformal_Conic_2SP:"lcc",Mercator:"merc","Popular Visualisation Pseudo Mercator":"merc",Mercator_1SP:"merc",Transverse_Mercator:"tmerc","Transverse Mercator":"tmerc","Lambert Azimuthal Equal Area":"laea","Universal Transverse Mercator System":"utm",Hotine_Oblique_Mercator:"omerc","Hotine Oblique Mercator":"omerc",Hotine_Oblique_Mercator_Azimuth_Natural_Origin:"omerc",Hotine_Oblique_Mercator_Azimuth_Center:"omerc",Van_der_Grinten_I:"vandg",VanDerGrinten:"vandg",Stereographic_North_Pole:"sterea",Oblique_Stereographic:"sterea",Polar_Stereographic:"sterea",Polyconic:"poly",New_Zealand_Map_Grid:"nzmg",Miller_Cylindrical:"mill",Krovak:"krovak",Equirectangular:"eqc",Equidistant_Cylindrical:"eqc",Cassini:"cass",Cassini_Soldner:"cass",Azimuthal_Equidistant:"aeqd",Albers_Conic_Equal_Area:"aea",Albers:"aea",Mollweide:"moll",Lambert_Azimuthal_Equal_Area:"laea",Sinusoidal:"sinu",Equidistant_Conic:"eqdc",Mercator_Auxiliary_Sphere:"merc"},t.grids={"null":{ll:[-3.14159265,-1.57079633],del:[3.14159265,1.57079633],lim:[3,3],count:9,cvs:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]}},t}),i("proj4/global",[],function(){return function(t){t("WGS84","+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"),t("EPSG:4326","+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"),t("EPSG:4269","+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees"),t("EPSG:3857","+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"),t["EPSG:3785"]=t["EPSG:3857"],t.GOOGLE=t["EPSG:3857"],t["EPSG:900913"]=t["EPSG:3857"],t["EPSG:102113"]=t["EPSG:3857"]}}),i("proj4/projString",["./common","./constants"],function(t,s){return function(i){var a={},h={};i.split("+").map(function(t){return t.trim()}).filter(function(t){return t}).forEach(function(t){var s=t.split("=");"@null"!==s[1]&&(s.push(!0),h[s[0].toLowerCase()]=s[1])});var e,n,r,o={proj:"projName",datum:"datumCode",rf:function(t){a.rf=parseFloat(t,10)},lat_0:function(s){a.lat0=s*t.D2R},lat_1:function(s){a.lat1=s*t.D2R},lat_2:function(s){a.lat2=s*t.D2R},lat_ts:function(s){a.lat_ts=s*t.D2R},lon_0:function(s){a.long0=s*t.D2R},lon_1:function(s){a.long1=s*t.D2R},lon_2:function(s){a.long2=s*t.D2R},alpha:function(s){a.alpha=parseFloat(s)*t.D2R},lonc:function(s){a.longc=s*t.D2R},x_0:function(t){a.x0=parseFloat(t,10)},y_0:function(t){a.y0=parseFloat(t,10)},k_0:function(t){a.k0=parseFloat(t,10)},k:function(t){a.k0=parseFloat(t,10)},r_a:function(){a.R_A=!0},zone:function(t){a.zone=parseInt(t,10)},south:function(){a.utmSouth=!0},towgs84:function(t){a.datum_params=t.split(",").map(function(t){return parseFloat(t,10)})},to_meter:function(t){a.to_meter=parseFloat(t,10)},from_greenwich:function(s){a.from_greenwich=s*t.D2R},pm:function(i){a.from_greenwich=(s.PrimeMeridian[i]?s.PrimeMeridian[i]:parseFloat(i,10))*t.D2R},axis:function(t){var s="ewnsud";3===t.length&&-1!==s.indexOf(t.substr(0,1))&&-1!==s.indexOf(t.substr(1,1))&&-1!==s.indexOf(t.substr(2,1))&&(a.axis=t)}};for(e in h)n=h[e],e in o?(r=o[e],"function"==typeof r?r(n):a[r]=n):a[e]=n;return a}}),i("proj4/wkt",["./extend","./constants","./common"],function(t,s,i){function a(s,i,a){s[i]=a.map(function(t){var s={};return h(t,s),s}).reduce(function(s,i){return t(s,i)},{})}function h(t,s){var i;return Array.isArray(t)?(i=t.shift(),"PARAMETER"===i&&(i=t.shift()),1===t.length?Array.isArray(t[0])?(s[i]={},h(t[0],s[i])):s[i]=t[0]:t.length?"TOWGS84"===i?s[i]=t:(s[i]={},["UNIT","PRIMEM","VERT_DATUM"].indexOf(i)>-1?(s[i]={name:t[0].toLowerCase(),convert:t[1]},3===t.length&&(s[i].auth=t[2])):"SPHEROID"===i?(s[i]={name:t[0],a:t[1],rf:t[2]},4===t.length&&(s[i].auth=t[3])):["GEOGCS","GEOCCS","DATUM","VERT_CS","COMPD_CS","LOCAL_CS","FITTED_CS","LOCAL_DATUM"].indexOf(i)>-1?(t[0]=["name",t[0]],a(s,i,t)):t.every(function(t){return Array.isArray(t)})?a(s,i,t):h(t,s[i])):s[i]=!0,void 0):(s[t]=!0,void 0)}function e(t,s){var i=s[0],a=s[1];!(i in t)&&a in t&&(t[i]=t[a],3===s.length&&(t[i]=s[2](t[i])))}function n(t){return t*i.D2R}function r(t){function i(s){var i=t.to_meter||1;return parseFloat(s,10)*i}"GEOGCS"===t.type?t.projName="longlat":"LOCAL_CS"===t.type?(t.projName="identity",t.local=!0):t.projName=s.wktProjections[t.PROJECTION],t.UNIT&&(t.units=t.UNIT.name.toLowerCase(),"metre"===t.units&&(t.units="meter"),t.UNIT.convert&&(t.to_meter=parseFloat(t.UNIT.convert,10))),t.GEOGCS&&(t.datumCode=t.GEOGCS.DATUM?t.GEOGCS.DATUM.name.toLowerCase():t.GEOGCS.name.toLowerCase(),"d_"===t.datumCode.slice(0,2)&&(t.datumCode=t.datumCode.slice(2)),("new_zealand_geodetic_datum_1949"===t.datumCode||"new_zealand_1949"===t.datumCode)&&(t.datumCode="nzgd49"),"wgs_1984"===t.datumCode&&("Mercator_Auxiliary_Sphere"===t.PROJECTION&&(t.sphere=!0),t.datumCode="wgs84"),"_ferro"===t.datumCode.slice(-6)&&(t.datumCode=t.datumCode.slice(0,-6)),"_jakarta"===t.datumCode.slice(-8)&&(t.datumCode=t.datumCode.slice(0,-8)),t.GEOGCS.DATUM&&t.GEOGCS.DATUM.SPHEROID&&(t.ellps=t.GEOGCS.DATUM.SPHEROID.name.replace("_19","").replace(/[Cc]larke\_18/,"clrk"),"international"===t.ellps.toLowerCase().slice(0,13)&&(t.ellps="intl"),t.a=t.GEOGCS.DATUM.SPHEROID.a,t.rf=parseFloat(t.GEOGCS.DATUM.SPHEROID.rf,10))),t.b&&!isFinite(t.b)&&(t.b=t.a);var a=function(s){return e(t,s)},h=[["standard_parallel_1","Standard_Parallel_1"],["standard_parallel_2","Standard_Parallel_2"],["false_easting","False_Easting"],["false_northing","False_Northing"],["central_meridian","Central_Meridian"],["latitude_of_origin","Latitude_Of_Origin"],["scale_factor","Scale_Factor"],["k0","scale_factor"],["latitude_of_center","Latitude_of_center"],["lat0","latitude_of_center",n],["longitude_of_center","Longitude_Of_Center"],["longc","longitude_of_center",n],["x0","false_easting",i],["y0","false_northing",i],["long0","central_meridian",n],["lat0","latitude_of_origin",n],["lat0","standard_parallel_1",n],["lat1","standard_parallel_1",n],["lat2","standard_parallel_2",n],["alpha","azimuth",n],["srsCode","name"]];h.forEach(a),t.long0||!t.longc||"Albers_Conic_Equal_Area"!==t.PROJECTION&&"Lambert_Azimuthal_Equal_Area"!==t.PROJECTION||(t.long0=t.longc)}return function(s,i){var a=JSON.parse((","+s).replace(/\,([A-Z_0-9]+?)(\[)/g,',["$1",').slice(1).replace(/\,([A-Z_0-9]+?)\]/g,',"$1"]')),e=a.shift(),n=a.shift();a.unshift(["name",n]),a.unshift(["type",e]),a.unshift("output");var o={};return h(a,o),r(o.output),t(i,o.output)}}),i("proj4/defs",["./common","./constants","./global","./projString","./wkt"],function(t,s,i,a,h){function e(t){var s=this;if(2===arguments.length)e[t]="+"===arguments[1][0]?a(arguments[1]):h(arguments[1]);else if(1===arguments.length)return Array.isArray(t)?t.map(function(t){Array.isArray(t)?e.apply(s,t):e(t)}):("string"==typeof t||("EPSG"in t?e["EPSG:"+t.EPSG]=t:"ESRI"in t?e["ESRI:"+t.ESRI]=t:"IAU2000"in t?e["IAU2000:"+t.IAU2000]=t:console.log(t)),void 0)}return i(e),e}),i("proj4/datum",["./common"],function(t){var s=function(i){if(!(this instanceof s))return new s(i);if(this.datum_type=t.PJD_WGS84,i){if(i.datumCode&&"none"===i.datumCode&&(this.datum_type=t.PJD_NODATUM),i.datum_params){for(var a=0;a<i.datum_params.length;a++)i.datum_params[a]=parseFloat(i.datum_params[a]);(0!==i.datum_params[0]||0!==i.datum_params[1]||0!==i.datum_params[2])&&(this.datum_type=t.PJD_3PARAM),i.datum_params.length>3&&(0!==i.datum_params[3]||0!==i.datum_params[4]||0!==i.datum_params[5]||0!==i.datum_params[6])&&(this.datum_type=t.PJD_7PARAM,i.datum_params[3]*=t.SEC_TO_RAD,i.datum_params[4]*=t.SEC_TO_RAD,i.datum_params[5]*=t.SEC_TO_RAD,i.datum_params[6]=i.datum_params[6]/1e6+1)}this.datum_type=i.grids?t.PJD_GRIDSHIFT:this.datum_type,this.a=i.a,this.b=i.b,this.es=i.es,this.ep2=i.ep2,this.datum_params=i.datum_params,this.datum_type===t.PJD_GRIDSHIFT&&(this.grids=i.grids)}};return s.prototype={compare_datums:function(s){return this.datum_type!==s.datum_type?!1:this.a!==s.a||Math.abs(this.es-s.es)>5e-11?!1:this.datum_type===t.PJD_3PARAM?this.datum_params[0]===s.datum_params[0]&&this.datum_params[1]===s.datum_params[1]&&this.datum_params[2]===s.datum_params[2]:this.datum_type===t.PJD_7PARAM?this.datum_params[0]===s.datum_params[0]&&this.datum_params[1]===s.datum_params[1]&&this.datum_params[2]===s.datum_params[2]&&this.datum_params[3]===s.datum_params[3]&&this.datum_params[4]===s.datum_params[4]&&this.datum_params[5]===s.datum_params[5]&&this.datum_params[6]===s.datum_params[6]:this.datum_type===t.PJD_GRIDSHIFT||s.datum_type===t.PJD_GRIDSHIFT?this.nadgrids===s.nadgrids:!0},geodetic_to_geocentric:function(s){var i,a,h,e,n,r,o,l=s.x,u=s.y,c=s.z?s.z:0,M=0;if(u<-t.HALF_PI&&u>-1.001*t.HALF_PI)u=-t.HALF_PI;else if(u>t.HALF_PI&&u<1.001*t.HALF_PI)u=t.HALF_PI;else if(u<-t.HALF_PI||u>t.HALF_PI)return null;return l>t.PI&&(l-=2*t.PI),n=Math.sin(u),o=Math.cos(u),r=n*n,e=this.a/Math.sqrt(1-this.es*r),i=(e+c)*o*Math.cos(l),a=(e+c)*o*Math.sin(l),h=(e*(1-this.es)+c)*n,s.x=i,s.y=a,s.z=h,M},geocentric_to_geodetic:function(s){var i,a,h,e,n,r,o,l,u,c,M,f,m,p,_,d,y,g=1e-12,x=g*g,v=30,P=s.x,b=s.y,C=s.z?s.z:0;if(m=!1,i=Math.sqrt(P*P+b*b),a=Math.sqrt(P*P+b*b+C*C),i/this.a<g){if(m=!0,_=0,a/this.a<g)return d=t.HALF_PI,y=-this.b,void 0}else _=Math.atan2(b,P);h=C/a,e=i/a,n=1/Math.sqrt(1-this.es*(2-this.es)*e*e),l=e*(1-this.es)*n,u=h*n,p=0;do p++,o=this.a/Math.sqrt(1-this.es*u*u),y=i*l+C*u-o*(1-this.es*u*u),r=this.es*o/(o+y),n=1/Math.sqrt(1-r*(2-r)*e*e),c=e*(1-r)*n,M=h*n,f=M*l-c*u,l=c,u=M;while(f*f>x&&v>p);return d=Math.atan(M/Math.abs(c)),s.x=_,s.y=d,s.z=y,s},geocentric_to_geodetic_noniter:function(s){var i,a,h,e,n,r,o,l,u,c,M,f,m,p,_,d,y,g=s.x,x=s.y,v=s.z?s.z:0;if(g=parseFloat(g),x=parseFloat(x),v=parseFloat(v),y=!1,0!==g)i=Math.atan2(x,g);else if(x>0)i=t.HALF_PI;else if(0>x)i=-t.HALF_PI;else if(y=!0,i=0,v>0)a=t.HALF_PI;else{if(!(0>v))return a=t.HALF_PI,h=-this.b,void 0;a=-t.HALF_PI}return n=g*g+x*x,e=Math.sqrt(n),r=v*t.AD_C,l=Math.sqrt(r*r+n),c=r/l,f=e/l,M=c*c*c,o=v+this.b*this.ep2*M,d=e-this.a*this.es*f*f*f,u=Math.sqrt(o*o+d*d),m=o/u,p=d/u,_=this.a/Math.sqrt(1-this.es*m*m),h=p>=t.COS_67P5?e/p-_:p<=-t.COS_67P5?e/-p-_:v/m+_*(this.es-1),y===!1&&(a=Math.atan(m/p)),s.x=i,s.y=a,s.z=h,s},geocentric_to_wgs84:function(s){if(this.datum_type===t.PJD_3PARAM)s.x+=this.datum_params[0],s.y+=this.datum_params[1],s.z+=this.datum_params[2];else if(this.datum_type===t.PJD_7PARAM){var i=this.datum_params[0],a=this.datum_params[1],h=this.datum_params[2],e=this.datum_params[3],n=this.datum_params[4],r=this.datum_params[5],o=this.datum_params[6],l=o*(s.x-r*s.y+n*s.z)+i,u=o*(r*s.x+s.y-e*s.z)+a,c=o*(-n*s.x+e*s.y+s.z)+h;s.x=l,s.y=u,s.z=c}},geocentric_from_wgs84:function(s){if(this.datum_type===t.PJD_3PARAM)s.x-=this.datum_params[0],s.y-=this.datum_params[1],s.z-=this.datum_params[2];else if(this.datum_type===t.PJD_7PARAM){var i=this.datum_params[0],a=this.datum_params[1],h=this.datum_params[2],e=this.datum_params[3],n=this.datum_params[4],r=this.datum_params[5],o=this.datum_params[6],l=(s.x-i)/o,u=(s.y-a)/o,c=(s.z-h)/o;s.x=l+r*u-n*c,s.y=-r*l+u+e*c,s.z=n*l-e*u+c}}},s}),i("proj4/projCode/longlat",["require","exports","module"],function(t,s){function i(t){return t}s.init=function(){},s.forward=i,s.inverse=i}),i("proj4/projCode/tmerc",["../common"],function(t){return{init:function(){this.e0=t.e0fn(this.es),this.e1=t.e1fn(this.es),this.e2=t.e2fn(this.es),this.e3=t.e3fn(this.es),this.ml0=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},forward:function(s){var i,a,h,e=s.x,n=s.y,r=t.adjust_lon(e-this.long0),o=Math.sin(n),l=Math.cos(n);if(this.sphere){var u=l*Math.sin(r);if(Math.abs(Math.abs(u)-1)<1e-10)return 93;a=.5*this.a*this.k0*Math.log((1+u)/(1-u)),i=Math.acos(l*Math.cos(r)/Math.sqrt(1-u*u)),0>n&&(i=-i),h=this.a*this.k0*(i-this.lat0)}else{var c=l*r,M=Math.pow(c,2),f=this.ep2*Math.pow(l,2),m=Math.tan(n),p=Math.pow(m,2);i=1-this.es*Math.pow(o,2);var _=this.a/Math.sqrt(i),d=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,n);a=this.k0*_*c*(1+M/6*(1-p+f+M/20*(5-18*p+Math.pow(p,2)+72*f-58*this.ep2)))+this.x0,h=this.k0*(d-this.ml0+_*m*M*(.5+M/24*(5-p+9*f+4*Math.pow(f,2)+M/30*(61-58*p+Math.pow(p,2)+600*f-330*this.ep2))))+this.y0}return s.x=a,s.y=h,s},inverse:function(s){var i,a,h,e,n,r,o=6;if(this.sphere){var l=Math.exp(s.x/(this.a*this.k0)),u=.5*(l-1/l),c=this.lat0+s.y/(this.a*this.k0),M=Math.cos(c);i=Math.sqrt((1-M*M)/(1+u*u)),n=t.asinz(i),0>c&&(n=-n),r=0===u&&0===M?this.long0:t.adjust_lon(Math.atan2(u,M)+this.long0)}else{var f=s.x-this.x0,m=s.y-this.y0;for(i=(this.ml0+m/this.k0)/this.a,a=i,e=0;!0&&(h=(i+this.e1*Math.sin(2*a)-this.e2*Math.sin(4*a)+this.e3*Math.sin(6*a))/this.e0-a,a+=h,!(Math.abs(h)<=t.EPSLN));e++)if(e>=o)return 95;if(Math.abs(a)<t.HALF_PI){var p=Math.sin(a),_=Math.cos(a),d=Math.tan(a),y=this.ep2*Math.pow(_,2),g=Math.pow(y,2),x=Math.pow(d,2),v=Math.pow(x,2);i=1-this.es*Math.pow(p,2);var P=this.a/Math.sqrt(i),b=P*(1-this.es)/i,C=f/(P*this.k0),S=Math.pow(C,2);n=a-P*d*S/b*(.5-S/24*(5+3*x+10*y-4*g-9*this.ep2-S/30*(61+90*x+298*y+45*v-252*this.ep2-3*g))),r=t.adjust_lon(this.long0+C*(1-S/6*(1+2*x+y-S/20*(5-2*y+28*x-3*g+8*this.ep2+24*v)))/_)}else n=t.HALF_PI*t.sign(m),r=this.long0}return s.x=r,s.y=n,s}}}),i("proj4/projCode/utm",["../common","./tmerc"],function(t,s){return{dependsOn:"tmerc",init:function(){this.zone&&(this.lat0=0,this.long0=(6*Math.abs(this.zone)-183)*t.D2R,this.x0=5e5,this.y0=this.utmSouth?1e7:0,this.k0=.9996,s.init.apply(this),this.forward=s.forward,this.inverse=s.inverse)}}}),i("proj4/projCode/gauss",["../common"],function(t){return{init:function(){var s=Math.sin(this.lat0),i=Math.cos(this.lat0);
i*=i,this.rc=Math.sqrt(1-this.es)/(1-this.es*s*s),this.C=Math.sqrt(1+this.es*i*i/(1-this.es)),this.phic0=Math.asin(s/this.C),this.ratexp=.5*this.C*this.e,this.K=Math.tan(.5*this.phic0+t.FORTPI)/(Math.pow(Math.tan(.5*this.lat0+t.FORTPI),this.C)*t.srat(this.e*s,this.ratexp))},forward:function(s){var i=s.x,a=s.y;return s.y=2*Math.atan(this.K*Math.pow(Math.tan(.5*a+t.FORTPI),this.C)*t.srat(this.e*Math.sin(a),this.ratexp))-t.HALF_PI,s.x=this.C*i,s},inverse:function(s){for(var i=1e-14,a=s.x/this.C,h=s.y,e=Math.pow(Math.tan(.5*h+t.FORTPI)/this.K,1/this.C),n=t.MAX_ITER;n>0&&(h=2*Math.atan(e*t.srat(this.e*Math.sin(s.y),-.5*this.e))-t.HALF_PI,!(Math.abs(h-s.y)<i));--n)s.y=h;return n?(s.x=a,s.y=h,s):null}}}),i("proj4/projCode/sterea",["../common","./gauss"],function(t,s){return{init:function(){s.init.apply(this),this.rc&&(this.sinc0=Math.sin(this.phic0),this.cosc0=Math.cos(this.phic0),this.R2=2*this.rc,this.title||(this.title="Oblique Stereographic Alternative"))},forward:function(i){var a,h,e,n;return i.x=t.adjust_lon(i.x-this.long0),s.forward.apply(this,[i]),a=Math.sin(i.y),h=Math.cos(i.y),e=Math.cos(i.x),n=this.k0*this.R2/(1+this.sinc0*a+this.cosc0*h*e),i.x=n*h*Math.sin(i.x),i.y=n*(this.cosc0*a-this.sinc0*h*e),i.x=this.a*i.x+this.x0,i.y=this.a*i.y+this.y0,i},inverse:function(i){var a,h,e,n,r;if(i.x=(i.x-this.x0)/this.a,i.y=(i.y-this.y0)/this.a,i.x/=this.k0,i.y/=this.k0,r=Math.sqrt(i.x*i.x+i.y*i.y)){var o=2*Math.atan2(r,this.R2);a=Math.sin(o),h=Math.cos(o),n=Math.asin(h*this.sinc0+i.y*a*this.cosc0/r),e=Math.atan2(i.x*a,r*this.cosc0*h-i.y*this.sinc0*a)}else n=this.phic0,e=0;return i.x=e,i.y=n,s.inverse.apply(this,[i]),i.x=t.adjust_lon(i.x+this.long0),i}}}),i("proj4/projCode/somerc",[],function(){return{init:function(){var t=this.lat0;this.lambda0=this.long0;var s=Math.sin(t),i=this.a,a=this.rf,h=1/a,e=2*h-Math.pow(h,2),n=this.e=Math.sqrt(e);this.R=this.k0*i*Math.sqrt(1-e)/(1-e*Math.pow(s,2)),this.alpha=Math.sqrt(1+e/(1-e)*Math.pow(Math.cos(t),4)),this.b0=Math.asin(s/this.alpha);var r=Math.log(Math.tan(Math.PI/4+this.b0/2)),o=Math.log(Math.tan(Math.PI/4+t/2)),l=Math.log((1+n*s)/(1-n*s));this.K=r-this.alpha*o+this.alpha*n/2*l},forward:function(t){var s=Math.log(Math.tan(Math.PI/4-t.y/2)),i=this.e/2*Math.log((1+this.e*Math.sin(t.y))/(1-this.e*Math.sin(t.y))),a=-this.alpha*(s+i)+this.K,h=2*(Math.atan(Math.exp(a))-Math.PI/4),e=this.alpha*(t.x-this.lambda0),n=Math.atan(Math.sin(e)/(Math.sin(this.b0)*Math.tan(h)+Math.cos(this.b0)*Math.cos(e))),r=Math.asin(Math.cos(this.b0)*Math.sin(h)-Math.sin(this.b0)*Math.cos(h)*Math.cos(e));return t.y=this.R/2*Math.log((1+Math.sin(r))/(1-Math.sin(r)))+this.y0,t.x=this.R*n+this.x0,t},inverse:function(t){for(var s=t.x-this.x0,i=t.y-this.y0,a=s/this.R,h=2*(Math.atan(Math.exp(i/this.R))-Math.PI/4),e=Math.asin(Math.cos(this.b0)*Math.sin(h)+Math.sin(this.b0)*Math.cos(h)*Math.cos(a)),n=Math.atan(Math.sin(a)/(Math.cos(this.b0)*Math.cos(a)-Math.sin(this.b0)*Math.tan(h))),r=this.lambda0+n/this.alpha,o=0,l=e,u=-1e3,c=0;Math.abs(l-u)>1e-7;){if(++c>20)return;o=1/this.alpha*(Math.log(Math.tan(Math.PI/4+e/2))-this.K)+this.e*Math.log(Math.tan(Math.PI/4+Math.asin(this.e*Math.sin(l))/2)),u=l,l=2*Math.atan(Math.exp(o))-Math.PI/2}return t.x=r,t.y=l,t}}}),i("proj4/projCode/omerc",["../common"],function(t){return{init:function(){this.no_off=this.no_off||!1,this.no_rot=this.no_rot||!1,isNaN(this.k0)&&(this.k0=1);var s=Math.sin(this.lat0),i=Math.cos(this.lat0),a=this.e*s;this.bl=Math.sqrt(1+this.es/(1-this.es)*Math.pow(i,4)),this.al=this.a*this.bl*this.k0*Math.sqrt(1-this.es)/(1-a*a);var h=t.tsfnz(this.e,this.lat0,s),e=this.bl/i*Math.sqrt((1-this.es)/(1-a*a));1>e*e&&(e=1);var n,r;if(isNaN(this.longc)){var o=t.tsfnz(this.e,this.lat1,Math.sin(this.lat1)),l=t.tsfnz(this.e,this.lat2,Math.sin(this.lat2));this.el=this.lat0>=0?(e+Math.sqrt(e*e-1))*Math.pow(h,this.bl):(e-Math.sqrt(e*e-1))*Math.pow(h,this.bl);var u=Math.pow(o,this.bl),c=Math.pow(l,this.bl);n=this.el/u,r=.5*(n-1/n);var M=(this.el*this.el-c*u)/(this.el*this.el+c*u),f=(c-u)/(c+u),m=t.adjust_lon(this.long1-this.long2);this.long0=.5*(this.long1+this.long2)-Math.atan(M*Math.tan(.5*this.bl*m)/f)/this.bl,this.long0=t.adjust_lon(this.long0);var p=t.adjust_lon(this.long1-this.long0);this.gamma0=Math.atan(Math.sin(this.bl*p)/r),this.alpha=Math.asin(e*Math.sin(this.gamma0))}else n=this.lat0>=0?e+Math.sqrt(e*e-1):e-Math.sqrt(e*e-1),this.el=n*Math.pow(h,this.bl),r=.5*(n-1/n),this.gamma0=Math.asin(Math.sin(this.alpha)/e),this.long0=this.longc-Math.asin(r*Math.tan(this.gamma0))/this.bl;this.uc=this.no_off?0:this.lat0>=0?this.al/this.bl*Math.atan2(Math.sqrt(e*e-1),Math.cos(this.alpha)):-1*this.al/this.bl*Math.atan2(Math.sqrt(e*e-1),Math.cos(this.alpha))},forward:function(s){var i,a,h,e=s.x,n=s.y,r=t.adjust_lon(e-this.long0);if(Math.abs(Math.abs(n)-t.HALF_PI)<=t.EPSLN)h=n>0?-1:1,a=this.al/this.bl*Math.log(Math.tan(t.FORTPI+.5*h*this.gamma0)),i=-1*h*t.HALF_PI*this.al/this.bl;else{var o=t.tsfnz(this.e,n,Math.sin(n)),l=this.el/Math.pow(o,this.bl),u=.5*(l-1/l),c=.5*(l+1/l),M=Math.sin(this.bl*r),f=(u*Math.sin(this.gamma0)-M*Math.cos(this.gamma0))/c;a=Math.abs(Math.abs(f)-1)<=t.EPSLN?Number.POSITIVE_INFINITY:.5*this.al*Math.log((1-f)/(1+f))/this.bl,i=Math.abs(Math.cos(this.bl*r))<=t.EPSLN?this.al*this.bl*r:this.al*Math.atan2(u*Math.cos(this.gamma0)+M*Math.sin(this.gamma0),Math.cos(this.bl*r))/this.bl}return this.no_rot?(s.x=this.x0+i,s.y=this.y0+a):(i-=this.uc,s.x=this.x0+a*Math.cos(this.alpha)+i*Math.sin(this.alpha),s.y=this.y0+i*Math.cos(this.alpha)-a*Math.sin(this.alpha)),s},inverse:function(s){var i,a;this.no_rot?(a=s.y-this.y0,i=s.x-this.x0):(a=(s.x-this.x0)*Math.cos(this.alpha)-(s.y-this.y0)*Math.sin(this.alpha),i=(s.y-this.y0)*Math.cos(this.alpha)+(s.x-this.x0)*Math.sin(this.alpha),i+=this.uc);var h=Math.exp(-1*this.bl*a/this.al),e=.5*(h-1/h),n=.5*(h+1/h),r=Math.sin(this.bl*i/this.al),o=(r*Math.cos(this.gamma0)+e*Math.sin(this.gamma0))/n,l=Math.pow(this.el/Math.sqrt((1+o)/(1-o)),1/this.bl);return Math.abs(o-1)<t.EPSLN?(s.x=this.long0,s.y=t.HALF_PI):Math.abs(o+1)<t.EPSLN?(s.x=this.long0,s.y=-1*t.HALF_PI):(s.y=t.phi2z(this.e,l),s.x=t.adjust_lon(this.long0-Math.atan2(e*Math.cos(this.gamma0)-r*Math.sin(this.gamma0),Math.cos(this.bl*i/this.al))/this.bl)),s}}}),i("proj4/projCode/lcc",["../common"],function(t){return{init:function(){if(this.lat2||(this.lat2=this.lat1),this.k0||(this.k0=1),!(Math.abs(this.lat1+this.lat2)<t.EPSLN)){var s=this.b/this.a;this.e=Math.sqrt(1-s*s);var i=Math.sin(this.lat1),a=Math.cos(this.lat1),h=t.msfnz(this.e,i,a),e=t.tsfnz(this.e,this.lat1,i),n=Math.sin(this.lat2),r=Math.cos(this.lat2),o=t.msfnz(this.e,n,r),l=t.tsfnz(this.e,this.lat2,n),u=t.tsfnz(this.e,this.lat0,Math.sin(this.lat0));this.ns=Math.abs(this.lat1-this.lat2)>t.EPSLN?Math.log(h/o)/Math.log(e/l):i,isNaN(this.ns)&&(this.ns=i),this.f0=h/(this.ns*Math.pow(e,this.ns)),this.rh=this.a*this.f0*Math.pow(u,this.ns),this.title||(this.title="Lambert Conformal Conic")}},forward:function(s){var i=s.x,a=s.y;Math.abs(2*Math.abs(a)-t.PI)<=t.EPSLN&&(a=t.sign(a)*(t.HALF_PI-2*t.EPSLN));var h,e,n=Math.abs(Math.abs(a)-t.HALF_PI);if(n>t.EPSLN)h=t.tsfnz(this.e,a,Math.sin(a)),e=this.a*this.f0*Math.pow(h,this.ns);else{if(n=a*this.ns,0>=n)return null;e=0}var r=this.ns*t.adjust_lon(i-this.long0);return s.x=this.k0*e*Math.sin(r)+this.x0,s.y=this.k0*(this.rh-e*Math.cos(r))+this.y0,s},inverse:function(s){var i,a,h,e,n,r=(s.x-this.x0)/this.k0,o=this.rh-(s.y-this.y0)/this.k0;this.ns>0?(i=Math.sqrt(r*r+o*o),a=1):(i=-Math.sqrt(r*r+o*o),a=-1);var l=0;if(0!==i&&(l=Math.atan2(a*r,a*o)),0!==i||this.ns>0){if(a=1/this.ns,h=Math.pow(i/(this.a*this.f0),a),e=t.phi2z(this.e,h),-9999===e)return null}else e=-t.HALF_PI;return n=t.adjust_lon(l/this.ns+this.long0),s.x=n,s.y=e,s}}}),i("proj4/projCode/krovak",["../common"],function(t){return{init:function(){this.a=6377397.155,this.es=.006674372230614,this.e=Math.sqrt(this.es),this.lat0||(this.lat0=.863937979737193),this.long0||(this.long0=.4334234309119251),this.k0||(this.k0=.9999),this.s45=.785398163397448,this.s90=2*this.s45,this.fi0=this.lat0,this.e2=this.es,this.e=Math.sqrt(this.e2),this.alfa=Math.sqrt(1+this.e2*Math.pow(Math.cos(this.fi0),4)/(1-this.e2)),this.uq=1.04216856380474,this.u0=Math.asin(Math.sin(this.fi0)/this.alfa),this.g=Math.pow((1+this.e*Math.sin(this.fi0))/(1-this.e*Math.sin(this.fi0)),this.alfa*this.e/2),this.k=Math.tan(this.u0/2+this.s45)/Math.pow(Math.tan(this.fi0/2+this.s45),this.alfa)*this.g,this.k1=this.k0,this.n0=this.a*Math.sqrt(1-this.e2)/(1-this.e2*Math.pow(Math.sin(this.fi0),2)),this.s0=1.37008346281555,this.n=Math.sin(this.s0),this.ro0=this.k1*this.n0/Math.tan(this.s0),this.ad=this.s90-this.uq},forward:function(s){var i,a,h,e,n,r,o,l=s.x,u=s.y,c=t.adjust_lon(l-this.long0);return i=Math.pow((1+this.e*Math.sin(u))/(1-this.e*Math.sin(u)),this.alfa*this.e/2),a=2*(Math.atan(this.k*Math.pow(Math.tan(u/2+this.s45),this.alfa)/i)-this.s45),h=-c*this.alfa,e=Math.asin(Math.cos(this.ad)*Math.sin(a)+Math.sin(this.ad)*Math.cos(a)*Math.cos(h)),n=Math.asin(Math.cos(a)*Math.sin(h)/Math.cos(e)),r=this.n*n,o=this.ro0*Math.pow(Math.tan(this.s0/2+this.s45),this.n)/Math.pow(Math.tan(e/2+this.s45),this.n),s.y=o*Math.cos(r)/1,s.x=o*Math.sin(r)/1,this.czech||(s.y*=-1,s.x*=-1),s},inverse:function(t){var s,i,a,h,e,n,r,o,l=t.x;t.x=t.y,t.y=l,this.czech||(t.y*=-1,t.x*=-1),n=Math.sqrt(t.x*t.x+t.y*t.y),e=Math.atan2(t.y,t.x),h=e/Math.sin(this.s0),a=2*(Math.atan(Math.pow(this.ro0/n,1/this.n)*Math.tan(this.s0/2+this.s45))-this.s45),s=Math.asin(Math.cos(this.ad)*Math.sin(a)-Math.sin(this.ad)*Math.cos(a)*Math.cos(h)),i=Math.asin(Math.cos(a)*Math.sin(h)/Math.cos(s)),t.x=this.long0-i/this.alfa,r=s,o=0;var u=0;do t.y=2*(Math.atan(Math.pow(this.k,-1/this.alfa)*Math.pow(Math.tan(s/2+this.s45),1/this.alfa)*Math.pow((1+this.e*Math.sin(r))/(1-this.e*Math.sin(r)),this.e/2))-this.s45),Math.abs(r-t.y)<1e-10&&(o=1),r=t.y,u+=1;while(0===o&&15>u);return u>=15?null:t}}}),i("proj4/projCode/cass",["../common"],function(t){return{init:function(){this.sphere||(this.e0=t.e0fn(this.es),this.e1=t.e1fn(this.es),this.e2=t.e2fn(this.es),this.e3=t.e3fn(this.es),this.ml0=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0))},forward:function(s){var i,a,h=s.x,e=s.y;if(h=t.adjust_lon(h-this.long0),this.sphere)i=this.a*Math.asin(Math.cos(e)*Math.sin(h)),a=this.a*(Math.atan2(Math.tan(e),Math.cos(h))-this.lat0);else{var n=Math.sin(e),r=Math.cos(e),o=t.gN(this.a,this.e,n),l=Math.tan(e)*Math.tan(e),u=h*Math.cos(e),c=u*u,M=this.es*r*r/(1-this.es),f=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,e);i=o*u*(1-c*l*(1/6-(8-l+8*M)*c/120)),a=f-this.ml0+o*n/r*c*(.5+(5-l+6*M)*c/24)}return s.x=i+this.x0,s.y=a+this.y0,s},inverse:function(s){s.x-=this.x0,s.y-=this.y0;var i,a,h=s.x/this.a,e=s.y/this.a;if(this.sphere){var n=e+this.lat0;i=Math.asin(Math.sin(n)*Math.cos(h)),a=Math.atan2(Math.tan(h),Math.cos(n))}else{var r=this.ml0/this.a+e,o=t.imlfn(r,this.e0,this.e1,this.e2,this.e3);if(Math.abs(Math.abs(o)-t.HALF_PI)<=t.EPSLN)return s.x=this.long0,s.y=t.HALF_PI,0>e&&(s.y*=-1),s;var l=t.gN(this.a,this.e,Math.sin(o)),u=l*l*l/this.a/this.a*(1-this.es),c=Math.pow(Math.tan(o),2),M=h*this.a/l,f=M*M;i=o-l*Math.tan(o)/u*M*M*(.5-(1+3*c)*M*M/24),a=M*(1-f*(c/3+(1+3*c)*c*f/15))/Math.cos(o)}return s.x=t.adjust_lon(a+this.long0),s.y=t.adjust_lat(i),s}}}),i("proj4/projCode/laea",["../common"],function(t){return{S_POLE:1,N_POLE:2,EQUIT:3,OBLIQ:4,init:function(){var s=Math.abs(this.lat0);if(this.mode=Math.abs(s-t.HALF_PI)<t.EPSLN?this.lat0<0?this.S_POLE:this.N_POLE:Math.abs(s)<t.EPSLN?this.EQUIT:this.OBLIQ,this.es>0){var i;switch(this.qp=t.qsfnz(this.e,1),this.mmf=.5/(1-this.es),this.apa=this.authset(this.es),this.mode){case this.N_POLE:this.dd=1;break;case this.S_POLE:this.dd=1;break;case this.EQUIT:this.rq=Math.sqrt(.5*this.qp),this.dd=1/this.rq,this.xmf=1,this.ymf=.5*this.qp;break;case this.OBLIQ:this.rq=Math.sqrt(.5*this.qp),i=Math.sin(this.lat0),this.sinb1=t.qsfnz(this.e,i)/this.qp,this.cosb1=Math.sqrt(1-this.sinb1*this.sinb1),this.dd=Math.cos(this.lat0)/(Math.sqrt(1-this.es*i*i)*this.rq*this.cosb1),this.ymf=(this.xmf=this.rq)/this.dd,this.xmf*=this.dd}}else this.mode===this.OBLIQ&&(this.sinph0=Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0))},forward:function(s){var i,a,h,e,n,r,o,l,u,c,M=s.x,f=s.y;if(M=t.adjust_lon(M-this.long0),this.sphere){if(n=Math.sin(f),c=Math.cos(f),h=Math.cos(M),this.mode===this.OBLIQ||this.mode===this.EQUIT){if(a=this.mode===this.EQUIT?1+c*h:1+this.sinph0*n+this.cosph0*c*h,a<=t.EPSLN)return null;a=Math.sqrt(2/a),i=a*c*Math.sin(M),a*=this.mode===this.EQUIT?n:this.cosph0*n-this.sinph0*c*h}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(h=-h),Math.abs(f+this.phi0)<t.EPSLN)return null;a=t.FORTPI-.5*f,a=2*(this.mode===this.S_POLE?Math.cos(a):Math.sin(a)),i=a*Math.sin(M),a*=h}}else{switch(o=0,l=0,u=0,h=Math.cos(M),e=Math.sin(M),n=Math.sin(f),r=t.qsfnz(this.e,n),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(o=r/this.qp,l=Math.sqrt(1-o*o)),this.mode){case this.OBLIQ:u=1+this.sinb1*o+this.cosb1*l*h;break;case this.EQUIT:u=1+l*h;break;case this.N_POLE:u=t.HALF_PI+f,r=this.qp-r;break;case this.S_POLE:u=f-t.HALF_PI,r=this.qp+r}if(Math.abs(u)<t.EPSLN)return null;switch(this.mode){case this.OBLIQ:case this.EQUIT:u=Math.sqrt(2/u),a=this.mode===this.OBLIQ?this.ymf*u*(this.cosb1*o-this.sinb1*l*h):(u=Math.sqrt(2/(1+l*h)))*o*this.ymf,i=this.xmf*u*l*e;break;case this.N_POLE:case this.S_POLE:r>=0?(i=(u=Math.sqrt(r))*e,a=h*(this.mode===this.S_POLE?u:-u)):i=a=0}}return s.x=this.a*i+this.x0,s.y=this.a*a+this.y0,s},inverse:function(s){s.x-=this.x0,s.y-=this.y0;var i,a,h,e,n,r,o,l=s.x/this.a,u=s.y/this.a;if(this.sphere){var c,M=0,f=0;if(c=Math.sqrt(l*l+u*u),a=.5*c,a>1)return null;switch(a=2*Math.asin(a),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(f=Math.sin(a),M=Math.cos(a)),this.mode){case this.EQUIT:a=Math.abs(c)<=t.EPSLN?0:Math.asin(u*f/c),l*=f,u=M*c;break;case this.OBLIQ:a=Math.abs(c)<=t.EPSLN?this.phi0:Math.asin(M*this.sinph0+u*f*this.cosph0/c),l*=f*this.cosph0,u=(M-Math.sin(a)*this.sinph0)*c;break;case this.N_POLE:u=-u,a=t.HALF_PI-a;break;case this.S_POLE:a-=t.HALF_PI}i=0!==u||this.mode!==this.EQUIT&&this.mode!==this.OBLIQ?Math.atan2(l,u):0}else{if(o=0,this.mode===this.OBLIQ||this.mode===this.EQUIT){if(l/=this.dd,u*=this.dd,r=Math.sqrt(l*l+u*u),r<t.EPSLN)return s.x=0,s.y=this.phi0,s;e=2*Math.asin(.5*r/this.rq),h=Math.cos(e),l*=e=Math.sin(e),this.mode===this.OBLIQ?(o=h*this.sinb1+u*e*this.cosb1/r,n=this.qp*o,u=r*this.cosb1*h-u*this.sinb1*e):(o=u*e/r,n=this.qp*o,u=r*h)}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(u=-u),n=l*l+u*u,!n)return s.x=0,s.y=this.phi0,s;o=1-n/this.qp,this.mode===this.S_POLE&&(o=-o)}i=Math.atan2(l,u),a=this.authlat(Math.asin(o),this.apa)}return s.x=t.adjust_lon(this.long0+i),s.y=a,s},P00:.3333333333333333,P01:.17222222222222222,P02:.10257936507936508,P10:.06388888888888888,P11:.0664021164021164,P20:.016415012942191543,authset:function(t){var s,i=[];return i[0]=t*this.P00,s=t*t,i[0]+=s*this.P01,i[1]=s*this.P10,s*=t,i[0]+=s*this.P02,i[1]+=s*this.P11,i[2]=s*this.P20,i},authlat:function(t,s){var i=t+t;return t+s[0]*Math.sin(i)+s[1]*Math.sin(i+i)+s[2]*Math.sin(i+i+i)}}}),i("proj4/projCode/merc",["../common"],function(t){return{init:function(){var s=this.b/this.a;this.es=1-s*s,this.e=Math.sqrt(this.es),this.lat_ts?this.k0=this.sphere?Math.cos(this.lat_ts):t.msfnz(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)):this.k0||(this.k0=this.k?this.k:1)},forward:function(s){var i=s.x,a=s.y;if(a*t.R2D>90&&a*t.R2D<-90&&i*t.R2D>180&&i*t.R2D<-180)return null;var h,e;if(Math.abs(Math.abs(a)-t.HALF_PI)<=t.EPSLN)return null;if(this.sphere)h=this.x0+this.a*this.k0*t.adjust_lon(i-this.long0),e=this.y0+this.a*this.k0*Math.log(Math.tan(t.FORTPI+.5*a));else{var n=Math.sin(a),r=t.tsfnz(this.e,a,n);h=this.x0+this.a*this.k0*t.adjust_lon(i-this.long0),e=this.y0-this.a*this.k0*Math.log(r)}return s.x=h,s.y=e,s},inverse:function(s){var i,a,h=s.x-this.x0,e=s.y-this.y0;if(this.sphere)a=t.HALF_PI-2*Math.atan(Math.exp(-e/(this.a*this.k0)));else{var n=Math.exp(-e/(this.a*this.k0));if(a=t.phi2z(this.e,n),-9999===a)return null}return i=t.adjust_lon(this.long0+h/(this.a*this.k0)),s.x=i,s.y=a,s}}}),i("proj4/projCode/aea",["../common"],function(t){return{init:function(){Math.abs(this.lat1+this.lat2)<t.EPSLN||(this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e3=Math.sqrt(this.es),this.sin_po=Math.sin(this.lat1),this.cos_po=Math.cos(this.lat1),this.t1=this.sin_po,this.con=this.sin_po,this.ms1=t.msfnz(this.e3,this.sin_po,this.cos_po),this.qs1=t.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat2),this.cos_po=Math.cos(this.lat2),this.t2=this.sin_po,this.ms2=t.msfnz(this.e3,this.sin_po,this.cos_po),this.qs2=t.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat0),this.cos_po=Math.cos(this.lat0),this.t3=this.sin_po,this.qs0=t.qsfnz(this.e3,this.sin_po,this.cos_po),this.ns0=Math.abs(this.lat1-this.lat2)>t.EPSLN?(this.ms1*this.ms1-this.ms2*this.ms2)/(this.qs2-this.qs1):this.con,this.c=this.ms1*this.ms1+this.ns0*this.qs1,this.rh=this.a*Math.sqrt(this.c-this.ns0*this.qs0)/this.ns0)},forward:function(s){var i=s.x,a=s.y;this.sin_phi=Math.sin(a),this.cos_phi=Math.cos(a);var h=t.qsfnz(this.e3,this.sin_phi,this.cos_phi),e=this.a*Math.sqrt(this.c-this.ns0*h)/this.ns0,n=this.ns0*t.adjust_lon(i-this.long0),r=e*Math.sin(n)+this.x0,o=this.rh-e*Math.cos(n)+this.y0;return s.x=r,s.y=o,s},inverse:function(s){var i,a,h,e,n,r;return s.x-=this.x0,s.y=this.rh-s.y+this.y0,this.ns0>=0?(i=Math.sqrt(s.x*s.x+s.y*s.y),h=1):(i=-Math.sqrt(s.x*s.x+s.y*s.y),h=-1),e=0,0!==i&&(e=Math.atan2(h*s.x,h*s.y)),h=i*this.ns0/this.a,this.sphere?r=Math.asin((this.c-h*h)/(2*this.ns0)):(a=(this.c-h*h)/this.ns0,r=this.phi1z(this.e3,a)),n=t.adjust_lon(e/this.ns0+this.long0),s.x=n,s.y=r,s},phi1z:function(s,i){var a,h,e,n,r,o=t.asinz(.5*i);if(s<t.EPSLN)return o;for(var l=s*s,u=1;25>=u;u++)if(a=Math.sin(o),h=Math.cos(o),e=s*a,n=1-e*e,r=.5*n*n/h*(i/(1-l)-a/n+.5/s*Math.log((1-e)/(1+e))),o+=r,Math.abs(r)<=1e-7)return o;return null}}}),i("proj4/projCode/gnom",["../common"],function(t){return{init:function(){this.sin_p14=Math.sin(this.lat0),this.cos_p14=Math.cos(this.lat0),this.infinity_dist=1e3*this.a,this.rc=1},forward:function(s){var i,a,h,e,n,r,o,l,u=s.x,c=s.y;return h=t.adjust_lon(u-this.long0),i=Math.sin(c),a=Math.cos(c),e=Math.cos(h),r=this.sin_p14*i+this.cos_p14*a*e,n=1,r>0||Math.abs(r)<=t.EPSLN?(o=this.x0+this.a*n*a*Math.sin(h)/r,l=this.y0+this.a*n*(this.cos_p14*i-this.sin_p14*a*e)/r):(o=this.x0+this.infinity_dist*a*Math.sin(h),l=this.y0+this.infinity_dist*(this.cos_p14*i-this.sin_p14*a*e)),s.x=o,s.y=l,s},inverse:function(s){var i,a,h,e,n,r;return s.x=(s.x-this.x0)/this.a,s.y=(s.y-this.y0)/this.a,s.x/=this.k0,s.y/=this.k0,(i=Math.sqrt(s.x*s.x+s.y*s.y))?(e=Math.atan2(i,this.rc),a=Math.sin(e),h=Math.cos(e),r=t.asinz(h*this.sin_p14+s.y*a*this.cos_p14/i),n=Math.atan2(s.x*a,i*this.cos_p14*h-s.y*this.sin_p14*a),n=t.adjust_lon(this.long0+n)):(r=this.phic0,n=0),s.x=n,s.y=r,s}}}),i("proj4/projCode/cea",["../common"],function(t){return{init:function(){this.sphere||(this.k0=t.msfnz(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)))},forward:function(s){var i,a,h=s.x,e=s.y,n=t.adjust_lon(h-this.long0);if(this.sphere)i=this.x0+this.a*n*Math.cos(this.lat_ts),a=this.y0+this.a*Math.sin(e)/Math.cos(this.lat_ts);else{var r=t.qsfnz(this.e,Math.sin(e));i=this.x0+this.a*this.k0*n,a=this.y0+.5*this.a*r/this.k0}return s.x=i,s.y=a,s},inverse:function(s){s.x-=this.x0,s.y-=this.y0;var i,a;return this.sphere?(i=t.adjust_lon(this.long0+s.x/this.a/Math.cos(this.lat_ts)),a=Math.asin(s.y/this.a*Math.cos(this.lat_ts))):(a=t.iqsfnz(this.e,2*s.y*this.k0/this.a),i=t.adjust_lon(this.long0+s.x/(this.a*this.k0))),s.x=i,s.y=a,s}}}),i("proj4/projCode/eqc",["../common"],function(t){return{init:function(){this.x0=this.x0||0,this.y0=this.y0||0,this.lat0=this.lat0||0,this.long0=this.long0||0,this.lat_ts=this.lat_t||0,this.title=this.title||"Equidistant Cylindrical (Plate Carre)",this.rc=Math.cos(this.lat_ts)},forward:function(s){var i=s.x,a=s.y,h=t.adjust_lon(i-this.long0),e=t.adjust_lat(a-this.lat0);return s.x=this.x0+this.a*h*this.rc,s.y=this.y0+this.a*e,s},inverse:function(s){var i=s.x,a=s.y;return s.x=t.adjust_lon(this.long0+(i-this.x0)/(this.a*this.rc)),s.y=t.adjust_lat(this.lat0+(a-this.y0)/this.a),s}}}),i("proj4/projCode/poly",["../common"],function(t){return{init:function(){this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e=Math.sqrt(this.es),this.e0=t.e0fn(this.es),this.e1=t.e1fn(this.es),this.e2=t.e2fn(this.es),this.e3=t.e3fn(this.es),this.ml0=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},forward:function(s){var i,a,h,e=s.x,n=s.y,r=t.adjust_lon(e-this.long0);if(h=r*Math.sin(n),this.sphere)Math.abs(n)<=t.EPSLN?(i=this.a*r,a=-1*this.a*this.lat0):(i=this.a*Math.sin(h)/Math.tan(n),a=this.a*(t.adjust_lat(n-this.lat0)+(1-Math.cos(h))/Math.tan(n)));else if(Math.abs(n)<=t.EPSLN)i=this.a*r,a=-1*this.ml0;else{var o=t.gN(this.a,this.e,Math.sin(n))/Math.tan(n);i=o*Math.sin(h),a=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,n)-this.ml0+o*(1-Math.cos(h))}return s.x=i+this.x0,s.y=a+this.y0,s},inverse:function(s){var i,a,h,e,n,r,o,l,u;if(h=s.x-this.x0,e=s.y-this.y0,this.sphere)if(Math.abs(e+this.a*this.lat0)<=t.EPSLN)i=t.adjust_lon(h/this.a+this.long0),a=0;else{r=this.lat0+e/this.a,o=h*h/this.a/this.a+r*r,l=r;var c;for(n=t.MAX_ITER;n;--n)if(c=Math.tan(l),u=-1*(r*(l*c+1)-l-.5*(l*l+o)*c)/((l-r)/c-1),l+=u,Math.abs(u)<=t.EPSLN){a=l;break}i=t.adjust_lon(this.long0+Math.asin(h*Math.tan(l)/this.a)/Math.sin(a))}else if(Math.abs(e+this.ml0)<=t.EPSLN)a=0,i=t.adjust_lon(this.long0+h/this.a);else{r=(this.ml0+e)/this.a,o=h*h/this.a/this.a+r*r,l=r;var M,f,m,p,_;for(n=t.MAX_ITER;n;--n)if(_=this.e*Math.sin(l),M=Math.sqrt(1-_*_)*Math.tan(l),f=this.a*t.mlfn(this.e0,this.e1,this.e2,this.e3,l),m=this.e0-2*this.e1*Math.cos(2*l)+4*this.e2*Math.cos(4*l)-6*this.e3*Math.cos(6*l),p=f/this.a,u=(r*(M*p+1)-p-.5*M*(p*p+o))/(this.es*Math.sin(2*l)*(p*p+o-2*r*p)/(4*M)+(r-p)*(M*m-2/Math.sin(2*l))-m),l-=u,Math.abs(u)<=t.EPSLN){a=l;break}M=Math.sqrt(1-this.es*Math.pow(Math.sin(a),2))*Math.tan(a),i=t.adjust_lon(this.long0+Math.asin(h*M/this.a)/Math.sin(a))}return s.x=i,s.y=a,s}}}),i("proj4/projCode/nzmg",["../common"],function(t){return{iterations:1,init:function(){this.A=[],this.A[1]=.6399175073,this.A[2]=-.1358797613,this.A[3]=.063294409,this.A[4]=-.02526853,this.A[5]=.0117879,this.A[6]=-.0055161,this.A[7]=.0026906,this.A[8]=-.001333,this.A[9]=67e-5,this.A[10]=-34e-5,this.B_re=[],this.B_im=[],this.B_re[1]=.7557853228,this.B_im[1]=0,this.B_re[2]=.249204646,this.B_im[2]=.003371507,this.B_re[3]=-.001541739,this.B_im[3]=.04105856,this.B_re[4]=-.10162907,this.B_im[4]=.01727609,this.B_re[5]=-.26623489,this.B_im[5]=-.36249218,this.B_re[6]=-.6870983,this.B_im[6]=-1.1651967,this.C_re=[],this.C_im=[],this.C_re[1]=1.3231270439,this.C_im[1]=0,this.C_re[2]=-.577245789,this.C_im[2]=-.007809598,this.C_re[3]=.508307513,this.C_im[3]=-.112208952,this.C_re[4]=-.15094762,this.C_im[4]=.18200602,this.C_re[5]=1.01418179,this.C_im[5]=1.64497696,this.C_re[6]=1.9660549,this.C_im[6]=2.5127645,this.D=[],this.D[1]=1.5627014243,this.D[2]=.5185406398,this.D[3]=-.03333098,this.D[4]=-.1052906,this.D[5]=-.0368594,this.D[6]=.007317,this.D[7]=.0122,this.D[8]=.00394,this.D[9]=-.0013},forward:function(s){var i,a=s.x,h=s.y,e=h-this.lat0,n=a-this.long0,r=1e-5*(e/t.SEC_TO_RAD),o=n,l=1,u=0;for(i=1;10>=i;i++)l*=r,u+=this.A[i]*l;var c,M,f=u,m=o,p=1,_=0,d=0,y=0;for(i=1;6>=i;i++)c=p*f-_*m,M=_*f+p*m,p=c,_=M,d=d+this.B_re[i]*p-this.B_im[i]*_,y=y+this.B_im[i]*p+this.B_re[i]*_;return s.x=y*this.a+this.x0,s.y=d*this.a+this.y0,s},inverse:function(s){var i,a,h,e=s.x,n=s.y,r=e-this.x0,o=n-this.y0,l=o/this.a,u=r/this.a,c=1,M=0,f=0,m=0;for(i=1;6>=i;i++)a=c*l-M*u,h=M*l+c*u,c=a,M=h,f=f+this.C_re[i]*c-this.C_im[i]*M,m=m+this.C_im[i]*c+this.C_re[i]*M;for(var p=0;p<this.iterations;p++){var _,d,y=f,g=m,x=l,v=u;for(i=2;6>=i;i++)_=y*f-g*m,d=g*f+y*m,y=_,g=d,x+=(i-1)*(this.B_re[i]*y-this.B_im[i]*g),v+=(i-1)*(this.B_im[i]*y+this.B_re[i]*g);y=1,g=0;var P=this.B_re[1],b=this.B_im[1];for(i=2;6>=i;i++)_=y*f-g*m,d=g*f+y*m,y=_,g=d,P+=i*(this.B_re[i]*y-this.B_im[i]*g),b+=i*(this.B_im[i]*y+this.B_re[i]*g);var C=P*P+b*b;f=(x*P+v*b)/C,m=(v*P-x*b)/C}var S=f,j=m,N=1,A=0;for(i=1;9>=i;i++)N*=S,A+=this.D[i]*N;var I=this.lat0+1e5*A*t.SEC_TO_RAD,E=this.long0+j;return s.x=E,s.y=I,s}}}),i("proj4/projCode/mill",["../common"],function(t){return{init:function(){},forward:function(s){var i=s.x,a=s.y,h=t.adjust_lon(i-this.long0),e=this.x0+this.a*h,n=this.y0+1.25*this.a*Math.log(Math.tan(t.PI/4+a/2.5));return s.x=e,s.y=n,s},inverse:function(s){s.x-=this.x0,s.y-=this.y0;var i=t.adjust_lon(this.long0+s.x/this.a),a=2.5*(Math.atan(Math.exp(.8*s.y/this.a))-t.PI/4);return s.x=i,s.y=a,s}}}),i("proj4/projCode/sinu",["../common"],function(t){return{init:function(){this.sphere?(this.n=1,this.m=0,this.es=0,this.C_y=Math.sqrt((this.m+1)/this.n),this.C_x=this.C_y/(this.m+1)):this.en=t.pj_enfn(this.es)},forward:function(s){var i,a,h=s.x,e=s.y;if(h=t.adjust_lon(h-this.long0),this.sphere){if(this.m)for(var n=this.n*Math.sin(e),r=t.MAX_ITER;r;--r){var o=(this.m*e+Math.sin(e)-n)/(this.m+Math.cos(e));if(e-=o,Math.abs(o)<t.EPSLN)break}else e=1!==this.n?Math.asin(this.n*Math.sin(e)):e;i=this.a*this.C_x*h*(this.m+Math.cos(e)),a=this.a*this.C_y*e}else{var l=Math.sin(e),u=Math.cos(e);a=this.a*t.pj_mlfn(e,l,u,this.en),i=this.a*h*u/Math.sqrt(1-this.es*l*l)}return s.x=i,s.y=a,s},inverse:function(s){var i,a,h;if(s.x-=this.x0,s.y-=this.y0,i=s.y/this.a,this.sphere)s.y/=this.C_y,i=this.m?Math.asin((this.m*s.y+Math.sin(s.y))/this.n):1!==this.n?Math.asin(Math.sin(s.y)/this.n):s.y,h=s.x/(this.C_x*(this.m+Math.cos(s.y)));else{i=t.pj_inv_mlfn(s.y/this.a,this.es,this.en);var e=Math.abs(i);e<t.HALF_PI?(e=Math.sin(i),a=this.long0+s.x*Math.sqrt(1-this.es*e*e)/(this.a*Math.cos(i)),h=t.adjust_lon(a)):e-t.EPSLN<t.HALF_PI&&(h=this.long0)}return s.x=h,s.y=i,s}}}),i("proj4/projCode/moll",["../common"],function(t){return{init:function(){},forward:function(s){for(var i=s.x,a=s.y,h=t.adjust_lon(i-this.long0),e=a,n=t.PI*Math.sin(a),r=0;!0;r++){var o=-(e+Math.sin(e)-n)/(1+Math.cos(e));if(e+=o,Math.abs(o)<t.EPSLN)break}e/=2,t.PI/2-Math.abs(a)<t.EPSLN&&(h=0);var l=.900316316158*this.a*h*Math.cos(e)+this.x0,u=1.4142135623731*this.a*Math.sin(e)+this.y0;return s.x=l,s.y=u,s},inverse:function(s){var i,a;s.x-=this.x0,s.y-=this.y0,a=s.y/(1.4142135623731*this.a),Math.abs(a)>.999999999999&&(a=.999999999999),i=Math.asin(a);var h=t.adjust_lon(this.long0+s.x/(.900316316158*this.a*Math.cos(i)));h<-t.PI&&(h=-t.PI),h>t.PI&&(h=t.PI),a=(2*i+Math.sin(2*i))/t.PI,Math.abs(a)>1&&(a=1);var e=Math.asin(a);return s.x=h,s.y=e,s}}}),i("proj4/projCode/eqdc",["../common"],function(t){return{init:function(){return Math.abs(this.lat1+this.lat2)<t.EPSLN?(t.reportError("eqdc:init: Equal Latitudes"),void 0):(this.lat2=this.lat2||this.lat1,this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e=Math.sqrt(this.es),this.e0=t.e0fn(this.es),this.e1=t.e1fn(this.es),this.e2=t.e2fn(this.es),this.e3=t.e3fn(this.es),this.sinphi=Math.sin(this.lat1),this.cosphi=Math.cos(this.lat1),this.ms1=t.msfnz(this.e,this.sinphi,this.cosphi),this.ml1=t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat1),Math.abs(this.lat1-this.lat2)<t.EPSLN?this.ns=this.sinphi:(this.sinphi=Math.sin(this.lat2),this.cosphi=Math.cos(this.lat2),this.ms2=t.msfnz(this.e,this.sinphi,this.cosphi),this.ml2=t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat2),this.ns=(this.ms1-this.ms2)/(this.ml2-this.ml1)),this.g=this.ml1+this.ms1/this.ns,this.ml0=t.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0),this.rh=this.a*(this.g-this.ml0),void 0)},forward:function(s){var i,a=s.x,h=s.y;if(this.sphere)i=this.a*(this.g-h);else{var e=t.mlfn(this.e0,this.e1,this.e2,this.e3,h);i=this.a*(this.g-e)}var n=this.ns*t.adjust_lon(a-this.long0),r=this.x0+i*Math.sin(n),o=this.y0+this.rh-i*Math.cos(n);return s.x=r,s.y=o,s},inverse:function(s){s.x-=this.x0,s.y=this.rh-s.y+this.y0;var i,a,h,e;this.ns>=0?(a=Math.sqrt(s.x*s.x+s.y*s.y),i=1):(a=-Math.sqrt(s.x*s.x+s.y*s.y),i=-1);var n=0;if(0!==a&&(n=Math.atan2(i*s.x,i*s.y)),this.sphere)return e=t.adjust_lon(this.long0+n/this.ns),h=t.adjust_lat(this.g-a/this.a),s.x=e,s.y=h,s;var r=this.g-a/this.a;return h=t.imlfn(r,this.e0,this.e1,this.e2,this.e3),e=t.adjust_lon(this.long0+n/this.ns),s.x=e,s.y=h,s}}}),i("proj4/projCode/vandg",["../common"],function(t){return{init:function(){this.R=this.a},forward:function(s){var i,a,h=s.x,e=s.y,n=t.adjust_lon(h-this.long0);Math.abs(e)<=t.EPSLN&&(i=this.x0+this.R*n,a=this.y0);var r=t.asinz(2*Math.abs(e/t.PI));(Math.abs(n)<=t.EPSLN||Math.abs(Math.abs(e)-t.HALF_PI)<=t.EPSLN)&&(i=this.x0,a=e>=0?this.y0+t.PI*this.R*Math.tan(.5*r):this.y0+t.PI*this.R*-Math.tan(.5*r));var o=.5*Math.abs(t.PI/n-n/t.PI),l=o*o,u=Math.sin(r),c=Math.cos(r),M=c/(u+c-1),f=M*M,m=M*(2/u-1),p=m*m,_=t.PI*this.R*(o*(M-p)+Math.sqrt(l*(M-p)*(M-p)-(p+l)*(f-p)))/(p+l);0>n&&(_=-_),i=this.x0+_;var d=l+M;return _=t.PI*this.R*(m*d-o*Math.sqrt((p+l)*(l+1)-d*d))/(p+l),a=e>=0?this.y0+_:this.y0-_,s.x=i,s.y=a,s},inverse:function(s){var i,a,h,e,n,r,o,l,u,c,M,f,m;return s.x-=this.x0,s.y-=this.y0,M=t.PI*this.R,h=s.x/M,e=s.y/M,n=h*h+e*e,r=-Math.abs(e)*(1+n),o=r-2*e*e+h*h,l=-2*r+1+2*e*e+n*n,m=e*e/l+(2*o*o*o/l/l/l-9*r*o/l/l)/27,u=(r-o*o/3/l)/l,c=2*Math.sqrt(-u/3),M=3*m/u/c,Math.abs(M)>1&&(M=M>=0?1:-1),f=Math.acos(M)/3,a=s.y>=0?(-c*Math.cos(f+t.PI/3)-o/3/l)*t.PI:-(-c*Math.cos(f+t.PI/3)-o/3/l)*t.PI,i=Math.abs(h)<t.EPSLN?this.long0:t.adjust_lon(this.long0+t.PI*(n-1+Math.sqrt(1+2*(h*h-e*e)+n*n))/2/h),s.x=i,s.y=a,s}}}),i("proj4/projCode/aeqd",["../common"],function(t){return{init:function(){this.sin_p12=Math.sin(this.lat0),this.cos_p12=Math.cos(this.lat0)},forward:function(s){var i,a,h,e,n,r,o,l,u,c,M,f,m,p,_,d,y,g,x,v,P,b,C,S=s.x,j=s.y,N=Math.sin(s.y),A=Math.cos(s.y),I=t.adjust_lon(S-this.long0);return this.sphere?Math.abs(this.sin_p12-1)<=t.EPSLN?(s.x=this.x0+this.a*(t.HALF_PI-j)*Math.sin(I),s.y=this.y0-this.a*(t.HALF_PI-j)*Math.cos(I),s):Math.abs(this.sin_p12+1)<=t.EPSLN?(s.x=this.x0+this.a*(t.HALF_PI+j)*Math.sin(I),s.y=this.y0+this.a*(t.HALF_PI+j)*Math.cos(I),s):(g=this.sin_p12*N+this.cos_p12*A*Math.cos(I),d=Math.acos(g),y=d/Math.sin(d),s.x=this.x0+this.a*y*A*Math.sin(I),s.y=this.y0+this.a*y*(this.cos_p12*N-this.sin_p12*A*Math.cos(I)),s):(i=t.e0fn(this.es),a=t.e1fn(this.es),h=t.e2fn(this.es),e=t.e3fn(this.es),Math.abs(this.sin_p12-1)<=t.EPSLN?(n=this.a*t.mlfn(i,a,h,e,t.HALF_PI),r=this.a*t.mlfn(i,a,h,e,j),s.x=this.x0+(n-r)*Math.sin(I),s.y=this.y0-(n-r)*Math.cos(I),s):Math.abs(this.sin_p12+1)<=t.EPSLN?(n=this.a*t.mlfn(i,a,h,e,t.HALF_PI),r=this.a*t.mlfn(i,a,h,e,j),s.x=this.x0+(n+r)*Math.sin(I),s.y=this.y0+(n+r)*Math.cos(I),s):(o=N/A,l=t.gN(this.a,this.e,this.sin_p12),u=t.gN(this.a,this.e,N),c=Math.atan((1-this.es)*o+this.es*l*this.sin_p12/(u*A)),M=Math.atan2(Math.sin(I),this.cos_p12*Math.tan(c)-this.sin_p12*Math.cos(I)),x=0===M?Math.asin(this.cos_p12*Math.sin(c)-this.sin_p12*Math.cos(c)):Math.abs(Math.abs(M)-t.PI)<=t.EPSLN?-Math.asin(this.cos_p12*Math.sin(c)-this.sin_p12*Math.cos(c)):Math.asin(Math.sin(I)*Math.cos(c)/Math.sin(M)),f=this.e*this.sin_p12/Math.sqrt(1-this.es),m=this.e*this.cos_p12*Math.cos(M)/Math.sqrt(1-this.es),p=f*m,_=m*m,v=x*x,P=v*x,b=P*x,C=b*x,d=l*x*(1-v*_*(1-_)/6+P/8*p*(1-2*_)+b/120*(_*(4-7*_)-3*f*f*(1-7*_))-C/48*p),s.x=this.x0+d*Math.sin(M),s.y=this.y0+d*Math.cos(M),s))},inverse:function(s){s.x-=this.x0,s.y-=this.y0;var i,a,h,e,n,r,o,l,u,c,M,f,m,p,_,d,y,g,x,v,P,b,C;if(this.sphere){if(i=Math.sqrt(s.x*s.x+s.y*s.y),i>2*t.HALF_PI*this.a)return;return a=i/this.a,h=Math.sin(a),e=Math.cos(a),n=this.long0,Math.abs(i)<=t.EPSLN?r=this.lat0:(r=t.asinz(e*this.sin_p12+s.y*h*this.cos_p12/i),o=Math.abs(this.lat0)-t.HALF_PI,n=Math.abs(o)<=t.EPSLN?this.lat0>=0?t.adjust_lon(this.long0+Math.atan2(s.x,-s.y)):t.adjust_lon(this.long0-Math.atan2(-s.x,s.y)):t.adjust_lon(this.long0+Math.atan2(s.x*h,i*this.cos_p12*e-s.y*this.sin_p12*h))),s.x=n,s.y=r,s}return l=t.e0fn(this.es),u=t.e1fn(this.es),c=t.e2fn(this.es),M=t.e3fn(this.es),Math.abs(this.sin_p12-1)<=t.EPSLN?(f=this.a*t.mlfn(l,u,c,M,t.HALF_PI),i=Math.sqrt(s.x*s.x+s.y*s.y),m=f-i,r=t.imlfn(m/this.a,l,u,c,M),n=t.adjust_lon(this.long0+Math.atan2(s.x,-1*s.y)),s.x=n,s.y=r,s):Math.abs(this.sin_p12+1)<=t.EPSLN?(f=this.a*t.mlfn(l,u,c,M,t.HALF_PI),i=Math.sqrt(s.x*s.x+s.y*s.y),m=i-f,r=t.imlfn(m/this.a,l,u,c,M),n=t.adjust_lon(this.long0+Math.atan2(s.x,s.y)),s.x=n,s.y=r,s):(i=Math.sqrt(s.x*s.x+s.y*s.y),d=Math.atan2(s.x,s.y),p=t.gN(this.a,this.e,this.sin_p12),y=Math.cos(d),g=this.e*this.cos_p12*y,x=-g*g/(1-this.es),v=3*this.es*(1-x)*this.sin_p12*this.cos_p12*y/(1-this.es),P=i/p,b=P-x*(1+x)*Math.pow(P,3)/6-v*(1+3*x)*Math.pow(P,4)/24,C=1-x*b*b/2-P*b*b*b/6,_=Math.asin(this.sin_p12*Math.cos(b)+this.cos_p12*Math.sin(b)*y),n=t.adjust_lon(this.long0+Math.asin(Math.sin(d)*Math.sin(b)/Math.cos(_))),r=Math.atan((1-this.es*C*this.sin_p12/Math.sin(_))*Math.tan(_)/(1-this.es)),s.x=n,s.y=r,s)
}}}),i("proj4/projections",["require","exports","module","./projCode/longlat","./projCode/tmerc","./projCode/utm","./projCode/sterea","./projCode/somerc","./projCode/omerc","./projCode/lcc","./projCode/krovak","./projCode/cass","./projCode/laea","./projCode/merc","./projCode/aea","./projCode/gnom","./projCode/cea","./projCode/eqc","./projCode/poly","./projCode/nzmg","./projCode/mill","./projCode/sinu","./projCode/moll","./projCode/eqdc","./projCode/vandg","./projCode/aeqd","./projCode/longlat"],function(t,s){s.longlat=t("./projCode/longlat"),s.identity=s.longlat,s.tmerc=t("./projCode/tmerc"),s.utm=t("./projCode/utm"),s.sterea=t("./projCode/sterea"),s.somerc=t("./projCode/somerc"),s.omerc=t("./projCode/omerc"),s.lcc=t("./projCode/lcc"),s.krovak=t("./projCode/krovak"),s.cass=t("./projCode/cass"),s.laea=t("./projCode/laea"),s.merc=t("./projCode/merc"),s.aea=t("./projCode/aea"),s.gnom=t("./projCode/gnom"),s.cea=t("./projCode/cea"),s.eqc=t("./projCode/eqc"),s.poly=t("./projCode/poly"),s.nzmg=t("./projCode/nzmg"),s.mill=t("./projCode/mill"),s.sinu=t("./projCode/sinu"),s.moll=t("./projCode/moll"),s.eqdc=t("./projCode/eqdc"),s.vandg=t("./projCode/vandg"),s.aeqd=t("./projCode/aeqd"),s.longlat=t("./projCode/longlat"),s.identity=s.longlat}),i("proj4/Proj",["./extend","./common","./defs","./constants","./datum","./projections","./wkt","./projString"],function(t,s,i,a,h,e,n,r){var o=function l(s){if(!(this instanceof l))return new l(s);this.srsCodeInput=s;var a;"string"==typeof s?s in i?(this.deriveConstants(i[s]),t(this,i[s])):s.indexOf("GEOGCS")>=0||s.indexOf("GEOCCS")>=0||s.indexOf("PROJCS")>=0||s.indexOf("LOCAL_CS")>=0?(a=n(s),this.deriveConstants(a),t(this,a)):"+"===s[0]&&(a=r(s),this.deriveConstants(a),t(this,a)):(this.deriveConstants(s),t(this,s)),this.initTransforms(this.projName)};return o.prototype={initTransforms:function(s){if(!(s in o.projections))throw"unknown projection "+s;t(this,o.projections[s]),this.init()},deriveConstants:function(i){if(i.nadgrids&&0===i.nadgrids.length&&(i.nadgrids=null),i.nadgrids){i.grids=i.nadgrids.split(",");var e=null,n=i.grids.length;if(n>0)for(var r=0;n>r;r++){e=i.grids[r];var o=e.split("@");""!==o[o.length-1]&&(i.grids[r]={mandatory:1===o.length,name:o[o.length-1],grid:a.grids[o[o.length-1]]},i.grids[r].mandatory&&!i.grids[r].grid)}}if(i.datumCode&&"none"!==i.datumCode){var l=a.Datum[i.datumCode];l&&(i.datum_params=l.towgs84?l.towgs84.split(","):null,i.ellps=l.ellipse,i.datumName=l.datumName?l.datumName:i.datumCode)}if(!i.a){var u=a.Ellipsoid[i.ellps]?a.Ellipsoid[i.ellps]:a.Ellipsoid.WGS84;t(i,u)}i.rf&&!i.b&&(i.b=(1-1/i.rf)*i.a),(0===i.rf||Math.abs(i.a-i.b)<s.EPSLN)&&(i.sphere=!0,i.b=i.a),i.a2=i.a*i.a,i.b2=i.b*i.b,i.es=(i.a2-i.b2)/i.a2,i.e=Math.sqrt(i.es),i.R_A&&(i.a*=1-i.es*(s.SIXTH+i.es*(s.RA4+i.es*s.RA6)),i.a2=i.a*i.a,i.b2=i.b*i.b,i.es=0),i.ep2=(i.a2-i.b2)/i.b2,i.k0||(i.k0=1),i.axis||(i.axis="enu"),i.datum=h(i)}},o.projections=e,o}),i("proj4/datum_transform",["./common"],function(t){return function(s,i,a){function h(s){return s===t.PJD_3PARAM||s===t.PJD_7PARAM}var e,n,r;if(s.compare_datums(i))return a;if(s.datum_type===t.PJD_NODATUM||i.datum_type===t.PJD_NODATUM)return a;var o=s.a,l=s.es,u=i.a,c=i.es,M=s.datum_type;if(M===t.PJD_GRIDSHIFT)if(0===this.apply_gridshift(s,0,a))s.a=t.SRS_WGS84_SEMIMAJOR,s.es=t.SRS_WGS84_ESQUARED;else{if(!s.datum_params)return s.a=o,s.es=s.es,a;for(e=1,n=0,r=s.datum_params.length;r>n;n++)e*=s.datum_params[n];if(0===e)return s.a=o,s.es=s.es,a;M=s.datum_params.length>3?t.PJD_7PARAM:t.PJD_3PARAM}return i.datum_type===t.PJD_GRIDSHIFT&&(i.a=t.SRS_WGS84_SEMIMAJOR,i.es=t.SRS_WGS84_ESQUARED),(s.es!==i.es||s.a!==i.a||h(M)||h(i.datum_type))&&(s.geodetic_to_geocentric(a),h(s.datum_type)&&s.geocentric_to_wgs84(a),h(i.datum_type)&&i.geocentric_from_wgs84(a),i.geocentric_to_geodetic(a)),i.datum_type===t.PJD_GRIDSHIFT&&this.apply_gridshift(i,1,a),s.a=o,s.es=l,i.a=u,i.es=c,a}}),i("proj4/adjust_axis",[],function(){return function(t,s,i){var a,h,e,n=i.x,r=i.y,o=i.z||0;for(e=0;3>e;e++)if(!s||2!==e||void 0!==i.z)switch(0===e?(a=n,h="x"):1===e?(a=r,h="y"):(a=o,h="z"),t.axis[e]){case"e":i[h]=a;break;case"w":i[h]=-a;break;case"n":i[h]=a;break;case"s":i[h]=-a;break;case"u":void 0!==i[h]&&(i.z=a);break;case"d":void 0!==i[h]&&(i.z=-a);break;default:return null}return i}}),i("proj4/transform",["./common","./datum_transform","./adjust_axis","./Proj"],function(t,s,i,a){return function(h,e,n){function r(s,i){return(s.datum.datum_type===t.PJD_3PARAM||s.datum.datum_type===t.PJD_7PARAM)&&"WGS84"!==i.datumCode}var o;return h.datum&&e.datum&&(r(h,e)||r(e,h))&&(o=new a("WGS84"),this.transform(h,o,n),h=o),"enu"!==h.axis&&i(h,!1,n),"longlat"===h.projName?(n.x*=t.D2R,n.y*=t.D2R):(h.to_meter&&(n.x*=h.to_meter,n.y*=h.to_meter),h.inverse(n)),h.from_greenwich&&(n.x+=h.from_greenwich),n=s(h.datum,e.datum,n),e.from_greenwich&&(n.x-=e.from_greenwich),"longlat"===e.projName?(n.x*=t.R2D,n.y*=t.R2D):(e.forward(n),e.to_meter&&(n.x/=e.to_meter,n.y/=e.to_meter)),"enu"!==e.axis&&i(e,!0,n),n}}),i("proj4/core",["./Point","./Proj","./transform"],function(t,s,i){var a=s("WGS84");return function(h,e,n){var r=function(s,a,n){var r;return Array.isArray(n)?(r=i(s,a,t(n)),3===n.length?[r.x,r.y,r.z]:[r.x,r.y]):i(h,e,n)};return h=h instanceof s?h:s(h),"undefined"==typeof e?(e=h,h=a):"string"==typeof e?e=s(e):"x"in e||Array.isArray(e)?(n=e,e=h,h=a):e=e instanceof s?e:s(e),n?r(h,e,n):{forward:function(t){return r(h,e,t)},inverse:function(t){return r(e,h,t)}}}}),i("proj4",["proj4/core","proj4/Proj","proj4/Point","proj4/defs","proj4/transform","proj4/mgrs"],function(t,s,i,a,h,e){return t.defaultDatum="WGS84",t.Proj=s,t.WGS84=new t.Proj("WGS84"),t.Point=i,t.defs=a,t.transform=h,t.mgrs=e,t}),s("proj4")});


(function (factory) {
    var L, proj4;
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['leaflet', 'proj4'], factory);
    } else if (typeof module === 'object' && typeof module.exports === "object") {
        // Node/CommonJS
        L = require('leaflet');
        proj4 = require('proj4');
        module.exports = factory(L, proj4);
    } else {
        // Browser globals
        if (typeof window.L === 'undefined' || typeof window.proj4 === 'undefined')
            throw 'Leaflet and proj4 must be loaded first';
        factory(window.L, window.proj4);
    }
}(function (L, proj4) {

    L.Proj = {};

    L.Proj._isProj4Obj = function (a) {
        return (typeof a.inverse !== 'undefined' &&
        typeof a.forward !== 'undefined');
    };

    L.Proj.Projection = L.Class.extend({
        initialize: function (code, def, bounds) {
            var isP4 = L.Proj._isProj4Obj(code);
            this._proj = isP4 ? code : this._projFromCodeDef(code, def);
            this.bounds = isP4 ? def : bounds;
        },

        project: function (latlng) {
            if (L.Util.isArray(latlng)) {
                var points = [];
                for (var i in latlng) {
                    var point = this._proj.forward([latlng[i].lng, latlng[i].lat]);
                    points.push(new L.Point(point[0], point[1]));
                }
                return points;
            } else {
                var point = this._proj.forward([latlng.lng, latlng.lat]);
                return new L.Point(point[0], point[1]);
            }
        },

        unproject: function (point, unbounded) {
            var point2 = this._proj.inverse([point.x, point.y]);
            return new L.LatLng(point2[1], point2[0], unbounded);
        },

        _projFromCodeDef: function (code, def) {
            if (def) {
                proj4.defs(code, def);
            } else if (proj4.defs[code] === undefined) {
                var urn = code.split(':');
                if (urn.length > 3) {
                    code = urn[urn.length - 3] + ':' + urn[urn.length - 1];
                }
                if (proj4.defs[code] === undefined) {
                    throw 'No projection definition for code ' + code;
                }
            }

            return proj4(code);
        }
    });

    L.Proj.CRS = L.Class.extend({
        includes: L.CRS,

        options: {
            transformation: new L.Transformation(1, 0, -1, 0)
        },

        initialize: function (a, b, c) {
            var code,
                proj,
                def,
                options;

            if (L.Proj._isProj4Obj(a)) {
                proj = a;
                code = proj.srsCode;
                options = b || {};

                this.projection = new L.Proj.Projection(proj, options.bounds);
            } else {
                code = a;
                def = b;
                options = c || {};
                this.projection = new L.Proj.Projection(code, def, options.bounds);
            }

            L.Util.setOptions(this, options);
            this.code = code;
            this.transformation = this.options.transformation;

            if (this.options.origin) {
                this.transformation =
                    new L.Transformation(1, -this.options.origin[0],
                        -1, this.options.origin[1]);
            }

            if (this.options.scales) {
                this._scales = this.options.scales;
            } else if (this.options.resolutions) {
                this._scales = [];
                for (var i = this.options.resolutions.length - 1; i >= 0; i--) {
                    if (this.options.resolutions[i]) {
                        this._scales[i] = 1 / this.options.resolutions[i];
                    }
                }
            }

            this.infinite = !this.options.bounds;
        },

        scale: function (zoom) {
            var iZoom = Math.floor(zoom),
                baseScale,
                nextScale,
                scaleDiff,
                zDiff;
            if (zoom === iZoom) {
                return this._scales[zoom];
            } else {
                // Non-integer zoom, interpolate
                baseScale = this._scales[iZoom];
                nextScale = this._scales[iZoom + 1];
                scaleDiff = nextScale - baseScale;
                zDiff = (zoom - iZoom);
                return baseScale + scaleDiff * zDiff;
            }
        },

        zoom: function (scale) {
            // Find closest number in this._scales, down
            var downScale = this._closestElement(this._scales, scale),
                downZoom = this._scales.indexOf(downScale),
                nextZoom,
                scaleDiff;
            // Check if scale is downScale => return array index
            if (scale === downScale) {
                return downZoom;
            }
            // Interpolate
            nextZoom = downZoom + 1;
            scaleDiff = this._scales[nextZoom] - downScale;
            return (scale - downScale) / scaleDiff + downZoom;
        },

        /* Get the closest lowest element in an array */
        _closestElement: function (array, element) {
            var low;
            for (var i = array.length; i--;) {
                if (array[i] <= element && (low === undefined || low < array[i])) {
                    low = array[i];
                }
            }
            return low;
        }
    });

    L.Proj.GeoJSON = L.GeoJSON.extend({
        initialize: function (geojson, options) {
            this._callLevel = 0;
            L.GeoJSON.prototype.initialize.call(this, geojson, options);
        },

        addData: function (geojson) {
            var crs;

            if (geojson) {
                if (geojson.crs && geojson.crs.type === 'name') {
                    crs = new L.Proj.CRS(geojson.crs.properties.name);
                } else if (geojson.crs && geojson.crs.type) {
                    crs = new L.Proj.CRS(geojson.crs.type + ':' + geojson.crs.properties.code);
                }

                if (crs !== undefined) {
                    this.options.coordsToLatLng = function (coords) {
                        var point = L.point(coords[0], coords[1]);
                        return crs.projection.unproject(point);
                    };
                }
            }

            // Base class' addData might call us recursively, but
            // CRS shouldn't be cleared in that case, since CRS applies
            // to the whole GeoJSON, inluding sub-features.
            this._callLevel++;
            try {
                L.GeoJSON.prototype.addData.call(this, geojson);
            } finally {
                this._callLevel--;
                if (this._callLevel === 0) {
                    delete this.options.coordsToLatLng;
                }
            }
        }
    });

    L.Proj.geoJson = function (geojson, options) {
        return new L.Proj.GeoJSON(geojson, options);
    };

    return L.Proj;
}));



/**
 * 各地图API坐标系统比较与转换;
 * WGS84坐标系：即地球坐标系，国际上通用的坐标系。设备一般包含GPS芯片或者北斗芯片获取的经纬度为WGS84地理坐标系,
 * 谷歌地图采用的是WGS84地理坐标系（中国范围除外）;
 * GCJ02坐标系：即火星坐标系，是由中国国家测绘局制订的地理信息系统的坐标系统。由WGS84坐标系经加密后的坐标系。
 * 谷歌中国地图和搜搜中国地图采用的是GCJ02地理坐标系; BD09坐标系：即百度坐标系，GCJ02坐标系经加密后的坐标系;
 * 搜狗坐标系、图吧坐标系等，估计也是在GCJ02基础上加密而成的。 chenhua
 */
L.chinaProj = {
    pi: Math.PI,
    a: 6378245.0,
    ee: 0.00669342162296594323,

    /**
     * 84 to 火星坐标系 (GCJ-02) World Geodetic System ==> Mars Geodetic System
     *
     * @param lat
     * @param lon
     * @return
     */
    gps84_To_Gcj02: function (lat, lon) {
        if (this.outOfChina(lat, lon)) {
            return [lat, lon];
        }
        var dLat = this.transformLat(lon - 105.0, lat - 35.0);
        var dLon = this.transformLon(lon - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * this.pi;
        var magic = Math.sin(radLat);
        magic = 1 - this.ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);
        dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);
        var mgLat = lat + dLat;
        var mgLon = lon + dLon;
        return [mgLat,mgLon];
    },

    /**
     * * 火星坐标系 (GCJ-02) to 84 * * @param lon * @param lat * @return
     * */
    gcj_To_Gps84: function (lat, lon) {
        var gps = this.transform(lat, lon);
        var lontitude = lon * 2 - gps[1];
        var latitude = lat * 2 - gps[0];
        return [latitude,lontitude];
    },

    /**
     * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 将 GCJ-02 坐标转换成 BD-09 坐标
     *
     * @param gg_lat
     * @param gg_lon
     */
    gcj02_To_Bd09: function (gg_lat, gg_lon) {
        var x = gg_lon, y = gg_lat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.pi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.pi);
        var bd_lon = z * Math.cos(theta) + 0.0065;
        var bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lat, bd_lon];
    },

    /**
     * * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 * * 将 BD-09 坐标转换成GCJ-02 坐标 * * @param
     * bd_lat * @param bd_lon * @return
     */

    bd09_To_Gcj02: function (bd_lat, bd_lon) {
        var x = bd_lon - 0.0065, y = bd_lat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.pi);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.pi);
        var gg_lon = z * Math.cos(theta);
        var gg_lat = z * Math.sin(theta);
        return [gg_lat, gg_lon];
    },

    /**
     * (BD-09)-->84
     * @param bd_lat
     * @param bd_lon
     * @return
     */
    bd09_To_Gps84: function (bd_lat, bd_lon) {

        var gcj02 = this.bd09_To_Gcj02(bd_lat, bd_lon);
        var map84 = this.gcj_To_Gps84(gcj02[0], gcj02[1]);
        return map84;

    },

    outOfChina: function (lat, lon) {
        if (lon < 72.004 || lon > 137.8347)
            return true;
        if (lat < 0.8293 || lat > 55.8271)
            return true;
        return false;
    },
    transform: function (lat, lon) {
        if (this.outOfChina(lat, lon)) {
            return [lat, lon];
        }
        var dLat = this.transformLat(lon - 105.0, lat - 35.0);
        var dLon = this.transformLon(lon - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * this.pi;
        var magic = Math.sin(radLat);
        magic = 1 - this.ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);
        dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);
        var mgLat = lat + dLat;
        var mgLon = lon + dLon;
        return [mgLat, mgLon];
    },

    transformLat: function (x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y
            + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * this.pi) + 40.0 * Math.sin(y / 3.0 * this.pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * this.pi) + 320 * Math.sin(y * this.pi / 30.0)) * 2.0 / 3.0;
        return ret;
    },
    transformLon: function (x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1
            * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * this.pi) + 40.0 * Math.sin(x / 3.0 * this.pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * this.pi) + 300.0 * Math.sin(x / 30.0
                * this.pi)) * 2.0 / 3.0;
        return ret;
    }
}



/*
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */

L.drawVersion = '0.2.4-dev';

L.drawLocal = {
	draw: {
		toolbar: {
			actions: {
				title: '取消绘制',
				text: '取消'
			},
			undo: {
				title: '删除上一个编辑点',
				text: '返回'
			},
			buttons: {
				polyline: '绘制折线',
				polygon: '绘制面',
				rectangle: '绘制矩形',
				circle: '绘制圆形',
				marker: '绘制点'
			}
		},
		handlers: {
			circle: {
				tooltip: {
					start: '点击地图然后拖拽绘制圆'
				},
				radius: 'Radius'
			},
			marker: {
				tooltip: {
					start: '点击地图绘制点'
				}
			},
			polygon: {
				tooltip: {
					start: '点击地图开始绘制',
					cont: '点击继续绘制,CTRL+Z返回上一个编辑点，ESC取消绘制',
					end: '点击起点结束绘制,CTRL+Z返回上一个编辑点，ESC取消绘制'
				}
			},
			polyline: {
				error: '<strong>错误:</strong> 绘制错误!',
				tooltip: {
					start: '点击地图开始绘制',
					cont: '点击继续绘制,CTRL+Z返回上一个编辑点，ESC取消绘制',
					end: '点击绘制终点结束绘制,CTRL+Z返回上一个编辑点，ESC取消绘制'
				}
			},
			rectangle: {
				tooltip: {
					start: '点击并且拖拽绘制。'
				}
			},
			simpleshape: {
				tooltip: {
					end: '鼠标抬起结束绘制'
				}
			}
		}
	},
	edit: {
		toolbar: {
			actions: {
				save: {
					title: '保存修改',
					text: '保存'
				},
				cancel: {
					title: '取消编辑',
					text: '取消'
				}
			},
			buttons: {
				edit: '编辑地图',
				editDisabled: '没有可编辑的图层',
				remove: '删除图层',
				removeDisabled: '没有图层可以删除'
			}
		},
		handlers: {
			edit: {
				tooltip: {
					text: '点击拖拽地图节点编辑地图',
					subtext: '点击取消返回上一步编辑状态'
				}
			},
			remove: {
				tooltip: {
					text: '点击删除要素'
				}
			}
		}
	}
};



L.Draw = {};

L.Draw.Feature = L.Handler.extend({
	includes: L.Mixin.Events,

	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._overlayPane = map._panes.overlayPane;
		this._popupPane = map._panes.popupPane;

		// Merge default shapeOptions options with custom shapeOptions
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
		}
		L.setOptions(this, options);
	},

	enable: function () {
		if (this._enabled) { return; }

		this.fire('enabled', { handler: this.type });

		this._map.fire('draw:drawstart', { layerType: this.type });

		L.Handler.prototype.enable.call(this);
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:drawstop', { layerType: this.type });

		this.fire('disabled', { handler: this.type });
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			L.DomUtil.disableTextSelection();

			map.getContainer().focus();

			this._tooltip = new L.Tooltip(this._map);

			L.DomEvent.on(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();

			this._tooltip.dispose();
			this._tooltip = null;

			L.DomEvent.off(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	setOptions: function (options) {
		L.setOptions(this, options);
	},

	_fireCreatedEvent: function (layer) {
		this._map.fire('draw:created', { layer: layer, layerType: this.type });
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		//debugger;
		if (e.keyCode === 27) {
			this.disable();
		}
	}
});


L.Draw.Polyline = L.Draw.Feature.extend({
	statics: {
		TYPE: 'polyline'
	},

	Poly: L.Polyline,

	options: {
		allowIntersection: true,
		repeatMode: false,
		drawError: {
			color: '#b00b00',
			timeout: 2500
		},
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		guidelineDistance: 20,
		maxGuideLineLength: 4000,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		metric: true, // Whether to use the metric meaurement system or imperial
		showLength: true, // Whether to display distance in the tooltip
		zIndexOffset: 2000 // This should be > than the highest z-index any map layers
	},

	initialize: function (map, options) {
		// Need to set this here to ensure the correct message is used.
		this.options.drawError.message = L.drawLocal.draw.handlers.polyline.error;

		// Merge default drawError options with custom options
		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polyline.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], this.options.shapeOptions);

			this._tooltip.updateContent(this._getTooltipText());

			// Make a transparent marker that will used to catch click events. These click
			// events will create the vertices. We need to do this so we can ensure that
			// we can create vertices over other map layers (markers, vector layers). We
			// also do not want to trigger any click handlers of objects we are clicking on
			// while drawing.
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('mousedown', this._onMouseDown, this)
				.addTo(this._map);

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('mouseup', this._onMouseUp, this)
				.on('zoomend', this._onZoomEnd, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		this._clearHideErrorTimeout();

		this._cleanUpShape();

		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;

		this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseup', this._onMouseUp, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;

		// clean up DOM
		this._clearGuides();

		this._map
			.off('mousemove', this._onMouseMove, this)
			.off('zoomend', this._onZoomEnd, this);
	},

	deleteLastVertex: function () {
		if (this._markers.length <= 1) {
			return;
		}

		var lastMarker = this._markers.pop(),
			poly = this._poly,
			latlng = this._poly._spliceLatLngs(poly.getLatLngs().length - 1, 1)[0];

		this._markerGroup.removeLayer(lastMarker);

		if (poly.getLatLngs().length < 2) {
			this._map.removeLayer(poly);
		}

		this._vertexChanged(latlng, false);
	},

	addVertex: function (latlng) {
		var markersLength = this._markers.length;

		if (markersLength > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorTooltip();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorTooltip();
		}

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._vertexChanged(latlng, true);
	},

	_finishShape: function () {
		var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true);

		if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
			this._showErrorTooltip();
			return;
		}

		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	//Called to verify the shape is valid when the user tries to finish it
	//Return false if the shape is not valid
	_shapeIsValid: function () {
		return true;
	},

	_onZoomEnd: function () {
		this._updateGuide();
	},

	_onMouseMove: function (e) {
		var newPos = e.layerPoint,
			latlng = e.latlng;

		// Save latlng
		// should this be moved to _updateGuide() ?
		this._currentLatLng = latlng;

		this._updateTooltip(latlng);

		// Update the guide line
		this._updateGuide(newPos);

		// Update the mouse marker position
		this._mouseMarker.setLatLng(latlng);

		L.DomEvent.preventDefault(e.originalEvent);
	},

	_vertexChanged: function (latlng, added) {
		this._updateFinishHandler();

		this._updateRunningMeasure(latlng, added);

		this._clearGuides();

		this._updateTooltip();
	},

	_onMouseDown: function (e) {
		var originalEvent = e.originalEvent;
		this._mouseDownOrigin = L.point(originalEvent.clientX, originalEvent.clientY);
	},

	_onMouseUp: function (e) {
		if (this._mouseDownOrigin) {
			// We detect clicks within a certain tolerance, otherwise let it
			// be interpreted as a drag by the map
			var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY)
				.distanceTo(this._mouseDownOrigin);
			if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) {
				this.addVertex(e.latlng);
			}
		}
		this._mouseDownOrigin = null;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;
		// The last marker should have a click handler to close the polyline
		if (markerCount > 1) {
			this._markers[markerCount - 1].on('click', this._finishShape, this);
		}

		// Remove the old marker click handler (as only the last point should close the polyline)
		if (markerCount > 2) {
			this._markers[markerCount - 2].off('click', this._finishShape, this);
		}
	},

	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon,
			zIndexOffset: this.options.zIndexOffset * 2
		});

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_updateGuide: function (newPos) {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}
	},

	_updateTooltip: function (latLng) {
		var text = this._getTooltipText();

		if (latLng) {
			this._tooltip.updatePosition(latLng);
		}

		if (!this._errorShown) {
			this._tooltip.updateContent(text);
		}
	},

	_drawGuide: function (pointA, pointB) {
		var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			guidelineDistance = this.options.guidelineDistance,
			maxGuideLineLength = this.options.maxGuideLineLength,
			// Only draw a guideline with a max length
			i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
			fraction,
			dashPoint,
			dash;

		//create the guides container if we haven't yet
		if (!this._guidesContainer) {
			this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
		}

		//draw a dash every GuildeLineDistance
		for (; i < length; i += this.options.guidelineDistance) {
			//work out fraction along line we are
			fraction = i / length;

			//calculate new x,y point
			dashPoint = {
				x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
				y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
			};

			//add guide dash to guide container
			dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
			dash.style.backgroundColor =
				!this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

			L.DomUtil.setPosition(dash, dashPoint);
		}
	},

	_updateGuideColor: function (color) {
		if (this._guidesContainer) {
			for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
				this._guidesContainer.childNodes[i].style.backgroundColor = color;
			}
		}
	},

	// removes all child elements (guide dashes) from the guides container
	_clearGuides: function () {
		if (this._guidesContainer) {
			while (this._guidesContainer.firstChild) {
				this._guidesContainer.removeChild(this._guidesContainer.firstChild);
			}
		}
	},

	_getTooltipText: function () {
		var showLength = this.options.showLength,
			labelText, distanceStr;

		if (this._markers.length === 0) {
			labelText = {
				text: L.drawLocal.draw.handlers.polyline.tooltip.start
			};
		} else {
			distanceStr = showLength ? this._getMeasurementString() : '';

			if (this._markers.length === 1) {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.cont,
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.end,
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_updateRunningMeasure: function (latlng, added) {
		var markersLength = this._markers.length,
			previousMarkerIndex, distance;

		if (this._markers.length === 1) {
			this._measurementRunningTotal = 0;
		} else {
			previousMarkerIndex = markersLength - (added ? 2 : 1);
			distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng());

			this._measurementRunningTotal += distance * (added ? 1 : -1);
		}
	},

	_getMeasurementString: function () {
		var currentLatLng = this._currentLatLng,
			previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
			distance;

		// calculate the distance from the last fixed point to the mouse position
		distance = this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng);

		return L.GeometryUtil.readableDistance(distance, this.options.metric);
	},

	_showErrorTooltip: function () {
		this._errorShown = true;

		// Update tooltip
		this._tooltip
			.showAsError()
			.updateContent({ text: this.options.drawError.message });

		// Update shape
		this._updateGuideColor(this.options.drawError.color);
		this._poly.setStyle({ color: this.options.drawError.color });

		// Hide the error after 2 seconds
		this._clearHideErrorTimeout();
		this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
	},

	_hideErrorTooltip: function () {
		this._errorShown = false;

		this._clearHideErrorTimeout();

		// Revert tooltip
		this._tooltip
			.removeError()
			.updateContent(this._getTooltipText());

		// Revert shape
		this._updateGuideColor(this.options.shapeOptions.color);
		this._poly.setStyle({ color: this.options.shapeOptions.color });
	},

	_clearHideErrorTimeout: function () {
		if (this._hideErrorTimeout) {
			clearTimeout(this._hideErrorTimeout);
			this._hideErrorTimeout = null;
		}
	},

	_cleanUpShape: function () {
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].off('click', this._finishShape, this);
		}
	},

	_fireCreatedEvent: function () {
		var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
		poly.length  = this._measurementRunningTotal;
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
	},

	_cancelDrawing:function(e){
		//debugger;
	//	this._cancelDrawing.call(e);
		if (e.keyCode === 27) {
			this.disable();
		}
		if (e.keyCode == 90 && e.ctrlKey){
			this.deleteLastVertex()
		}
	}
});



L.Draw.Polygon = L.Draw.Polyline.extend({
	statics: {
		TYPE: 'polygon'
	},

	Poly: L.Polygon,

	options: {
		showArea: false,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	initialize: function (map, options) {
		L.Draw.Polyline.prototype.initialize.call(this, map, options);

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polygon.TYPE;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;

		// The first marker should have a click handler to close the polygon
		if (markerCount === 1) {
			this._markers[0].on('click', this._finishShape, this);
		}

		// Add and update the double click handler
		if (markerCount > 2) {
			this._markers[markerCount - 1].on('dblclick', this._finishShape, this);
			// Only need to remove handler if has been added before
			if (markerCount > 3) {
				this._markers[markerCount - 2].off('dblclick', this._finishShape, this);
			}
		}
	},

	_getTooltipText: function () {
		var text, subtext;

		if (this._markers.length === 0) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.start;
		} else if (this._markers.length < 3) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
		} else {
			text = L.drawLocal.draw.handlers.polygon.tooltip.end;
			subtext = this._getMeasurementString();
		}

		return {
			text: text,
			subtext: subtext
		};
	},

	_getMeasurementString: function () {
		var area = this._area;

		if (!area) {
			return null;
		}

		return L.GeometryUtil.readableArea(area, this.options.metric);
	},

	_shapeIsValid: function () {
		return this._markers.length >= 3;
	},

	_vertexChanged: function (latlng, added) {
		var latLngs;

		// Check to see if we should show the area
		if (!this.options.allowIntersection && this.options.showArea) {
			latLngs = this._poly.getLatLngs();

			this._area = L.GeometryUtil.geodesicArea(latLngs);
		}

		L.Draw.Polyline.prototype._vertexChanged.call(this, latlng, added);
	},

	_cleanUpShape: function () {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			this._markers[0].off('click', this._finishShape, this);

			if (markerCount > 2) {
				this._markers[markerCount - 1].off('dblclick', this._finishShape, this);
			}
		}
	}
});



L.SimpleShape = {};

L.Draw.SimpleShape = L.Draw.Feature.extend({
	options: {
		repeatMode: false
	},

	initialize: function (map, options) {
		this._endLabelText = L.drawLocal.draw.handlers.simpleshape.tooltip.end;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._mapDraggable = this._map.dragging.enabled();

			if (this._mapDraggable) {
				this._map.dragging.disable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._tooltip.updateContent({ text: this._initialLabelText });

			this._map
				.on('mousedown', this._onMouseDown, this)
				.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			this._map
				.off('mousedown', this._onMouseDown, this)
				.off('mousemove', this._onMouseMove, this);

			L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}
		}
		this._isDrawing = false;
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		this._startLatLng = e.latlng;

		L.DomEvent
			.on(document, 'mouseup', this._onMouseUp, this)
			.preventDefault(e.originalEvent);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._tooltip.updateContent({ text: this._endLabelText });
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function () {
		if (this._shape) {
			this._fireCreatedEvent();
		}

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	}
});


L.Draw.Rectangle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'rectangle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Rectangle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.rectangle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		var rectangle = new L.Rectangle(this._shape.getBounds(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
	}
});



L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true // Whether to use the metric meaurement system or imperial
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this.options.shapeOptions.radius = this._startLatLng.distanceTo(latlng);
			this._shape = new L.Circle(this._startLatLng, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(this._startLatLng.distanceTo(latlng));
		}
	},

	_fireCreatedEvent: function () {
		this.options.shapeOptions.radius = this._shape.getRadius();
		var circle = new L.Circle(this._startLatLng, this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);

			// Get the new radius (rounded to 1 dp)
			radius = this._shape.getRadius().toFixed(1);

			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: showRadius ? 'Radius: ' + L.GeometryUtil.readableDistance(radius, useMetric) : ''
			});
		}
	}
});



L.Draw.Marker = L.Draw.Feature.extend({
	statics: {
		TYPE: 'marker'
	},

	options: {
		icon: new L.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Marker.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({ text: L.drawLocal.draw.handlers.marker.tooltip.start });

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map
					.off('click', this._onClick, this)
					.removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._marker);
		}
		else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_fireCreatedEvent: function () {
		var marker = new L.Marker(this._marker.getLatLng(), { icon: this.options.icon });
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
	}
});



L.Edit = L.Edit || {};

L.Edit.Marker = L.Handler.extend({
	initialize: function (marker, options) {
		this._marker = marker;
		L.setOptions(this, options);
	},

	addHooks: function () {
		var marker = this._marker;

		marker.dragging.enable();
		marker.on('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	removeHooks: function () {
		var marker = this._marker;

		marker.dragging.disable();
		marker.off('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	_onDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
	},

	_toggleMarkerHighlight: function () {

		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leafler.markercluster there
		// is a chance that a marker doesn't.
		if (!this._icon) {
			return;
		}
		
		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		var icon = this._icon;

		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	}
});

L.Marker.addInitHook(function () {
	if (L.Edit.Marker) {
		this.editing = new L.Edit.Marker(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});



L.Edit = L.Edit || {};

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */

L.Edit.Poly = L.Handler.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		})
	},

	initialize: function (poly, options) {
		this._poly = poly;
		L.setOptions(this, options);

		this._isPolygon = L.Polygon && (this._poly instanceof L.Polygon);
	},

	addHooks: function () {
		if (this._poly._map) {

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._poly._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		if (this._poly._map) {
			this._poly._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		this._markers = [];

		var latlngs = this._poly._latlngs,
			i, j, len, marker;

		//Polylines are a single array, Polygons are a nested array
		if (this._isPolygon) {
			latlngs = latlngs[0];
		}

		// TODO refactor holes implementation in Polygon to support it here

		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createMarker(latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers.push(marker);
		}

		var markerLeft, markerRight;

		for (i = 0, j = len - 1; i < len; j = i++) {
			if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
				continue;
			}

			markerLeft = this._markers[j];
			markerRight = this._markers[i];

			this._createMiddleMarker(markerLeft, markerRight);
			this._updatePrevNext(markerLeft, markerRight);
		}
	},

	_createMarker: function (latlng, index) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: this.options.icon
		});

		marker._origLatLng = latlng;
		marker._index = index;

		marker.on('drag', this._onMarkerDrag, this);
		marker.on('dragend', this._fireEdit, this);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_removeMarker: function (marker) {
		var i = marker._index;

		this._markerGroup.removeLayer(marker);
		this._markers.splice(i, 1);
		this._poly._spliceLatLngs(i, 1);
		this._updateIndexes(i, -1);

		marker
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this);
	},

	_fireEdit: function () {
		this._poly.edited = true;
		this._poly.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target;

		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
	},

	_onMarkerClick: function (e) {
		var isPolygon = this._isPolygon,
			minPoints = isPolygon ? 4 : 3,
			marker = e.target;

		// If removing this point would create an invalid polyline/polygon don't remove
		if ((isPolygon ? this._poly._latlngs[0] : this._poly._latlngs).length < minPoints) {
			return;
		}

		// remove the marker
		this._removeMarker(marker);

		// update prev/next links of adjacent markers
		this._updatePrevNext(marker._prev, marker._next);

		// remove ghost markers near the removed marker
		if (marker._middleLeft) {
			this._markerGroup.removeLayer(marker._middleLeft);
		}
		if (marker._middleRight) {
			this._markerGroup.removeLayer(marker._middleRight);
		}

		// create a ghost marker in place of the removed one
		if (marker._prev && marker._next) {
			this._createMiddleMarker(marker._prev, marker._next);

		} else if (!marker._prev) {
			marker._next._middleLeft = null;

		} else if (!marker._next) {
			marker._prev._middleRight = null;
		}

		this._fireEdit();
	},

	_updateIndexes: function (index, delta) {
		this._markerGroup.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2) {
		var latlng = this._getMiddleLatLng(marker1, marker2),
		    marker = this._createMarker(latlng),
		    onClick,
		    onDragStart,
		    onDragEnd;

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			var i = marker2._index;

			marker._index = i;

			marker
			    .off('click', onClick, this)
			    .on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;
			this._poly._spliceLatLngs(i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);

			this._updateIndexes(i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);

			this._poly.fire('editstart');
		};

		onDragEnd = function () {
			marker.off('dragstart', onDragStart, this);
			marker.off('dragend', onDragEnd, this);

			this._createMiddleMarker(marker1, marker);
			this._createMiddleMarker(marker, marker2);
		};

		onClick = function () {
			onDragStart.call(this);
			onDragEnd.call(this);
			this._fireEdit();
		};

		marker
		    .on('click', onClick, this)
		    .on('dragstart', onDragStart, this)
		    .on('dragend', onDragEnd, this);

		this._markerGroup.addLayer(marker);
	},

	_updatePrevNext: function (marker1, marker2) {
		if (marker1) {
			marker1._next = marker2;
		}
		if (marker2) {
			marker2._prev = marker1;
		}
	},

	_getMiddleLatLng: function (marker1, marker2) {
		var map = this._poly._map,
		    p1 = map.project(marker1.getLatLng()),
		    p2 = map.project(marker2.getLatLng());

		return map.unproject(p1._add(p2)._divideBy(2));
	}
});

var initHook = function () {

	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {
		this.editing = new L.Edit.Poly(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
};

L.Polyline.addInitHook(initHook);
L.Polygon.addInitHook(initHook);

L.Polyline.include({
	_spliceLatLngs: function (index, count, toAdd) {
		var latLngs = this._latlngs,
			res;

		if (toAdd) {
			res = latLngs.splice(index, count, toAdd);
		} else {
			res = latLngs.splice(index, count);
		}

		this.redraw();

		return res;
	}
});

L.Polygon.include({
	_spliceLatLngs: function (index, count, toAdd) {
		var latLngs = this._latlngs[0],
			res;

		if (toAdd) {
			res = latLngs.splice(index, count, toAdd);
		} else {
			res = latLngs.splice(index, count);
		}

		this.redraw();

		return res;
	}
});



L.Edit = L.Edit || {};

L.Edit.SimpleShape = L.Handler.extend({
	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
		}),
		resizeIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
		})
	},

	initialize: function (shape, options) {
		this._shape = shape;
		L.Util.setOptions(this, options);
	},

	addHooks: function () {
		if (this._shape._map) {
			this._map = this._shape._map;

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		if (this._shape._map) {
			this._unbindMarker(this._moveMarker);

			for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
				this._unbindMarker(this._resizeMarkers[i]);
			}
			this._resizeMarkers = null;

			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
		}

		this._map = null;
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

		// Create center marker
		this._createMoveMarker();

		// Create edge marker
		this._createResizeMarker();
	},

	_createMoveMarker: function () {
		// Children override
	},

	_createResizeMarker: function () {
		// Children override
	},

	_createMarker: function (latlng, icon) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: icon,
			zIndexOffset: 10
		});

		this._bindMarker(marker);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_bindMarker: function (marker) {
		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this);
	},

	_unbindMarker: function (marker) {
		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._onMarkerDragEnd, this);
	},

	_onMarkerDragStart: function (e) {
		var marker = e.target;
		marker.setOpacity(0);

		this._shape.fire('editstart');
	},

	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target;
		marker.setOpacity(1);

		this._fireEdit();
	},

	_move: function () {
		// Children override
	},

	_resize: function () {
		// Children override
	}
});



L.Edit = L.Edit || {};

L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex;

		this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];

		this._toggleCornerMarkers(0, currentCornerIndex);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);

		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			newLatLngs.push([]);
			for (var j = 0, k = latlngs[i].length; j < k; j++) {
				offset = [latlngs[i][j].lat - center.lat, latlngs[i][j].lng - center.lng];
				newLatLngs[i].push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
			}
		}

		this._shape.setLatLngs(newLatLngs);

		// Reposition the resize markers
		this._repositionCornerMarkers();
	},

	_resize: function (latlng) {
		var bounds;

		// Update the shape based on the current position of this corner and the opposite point
		this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));

		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setLatLng(corners[i]);
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});



L.Edit = L.Edit || {};

L.Edit.Circle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var center = this._shape.getLatLng();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_move: function (latlng) {
		var resizemarkerPoint = this._getResizeMarkerPoint(latlng);

		// Move the resize marker
		this._resizeMarkers[0].setLatLng(resizemarkerPoint);

		// Move the circle
		this._shape.setLatLng(latlng);
	},

	_resize: function (latlng) {
		var moveLatLng = this._moveMarker.getLatLng(),
			radius = moveLatLng.distanceTo(latlng);

		this._shape.setRadius(radius);
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});


/*
 * L.LatLngUtil contains different utility functions for LatLngs.
 */

L.LatLngUtil = {
	// Clones a LatLngs[], returns [][]
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			clone.push(this.cloneLatLng(latlngs[i]));
		}
		return clone;
	},

	cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	}
};


L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
	// Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
	geodesicArea: function (latLngs) {
		var pointsCount = latLngs.length,
			area = 0.0,
			d2r = Math.PI / 180,
			p1, p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 10000) {
				areaStr = (area * 0.000001).toFixed(2) + ' 平方千米';
			} else {
				areaStr = area.toFixed(2) + ' 平方米';
			}
		} else {
			area *= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = (area / 3097600).toFixed(2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = (area / 4840).toFixed(2) + ' acres';
			} else {
				areaStr = Math.ceil(area) + ' yd&sup2;';
			}
		}

		return areaStr;
	},

	readableDistance: function (distance, isMetric) {
		var distanceStr;

		if (isMetric) {
			// show metres when distance is < 1km, then show km
			if (distance > 1000) {
				distanceStr = (distance  / 1000).toFixed(2) + ' 千米';
			} else {
				distanceStr = Math.ceil(distance) + ' 米';
			}
		} else {
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = (distance / 1760).toFixed(2) + ' miles';
			} else {
				distanceStr = Math.ceil(distance) + ' yd';
			}
		}

		return distanceStr;
	}
});


L.Util.extend(L.LineUtil, {
	// Checks to see if two line segments intersect. Does not handle degenerate cases.
	// http://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
	segmentsIntersect: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2, /*Point*/ p3) {
		return	this._checkCounterclockwise(p, p2, p3) !==
				this._checkCounterclockwise(p1, p2, p3) &&
				this._checkCounterclockwise(p, p1, p2) !==
				this._checkCounterclockwise(p, p1, p3);
	},

	// check to see if points are in counterclockwise order
	_checkCounterclockwise: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
	}
});


L.Polyline.include({
	// Check to see if this polyline has any linesegments that intersect.
	// NOTE: does not support detecting intersection for degenerate cases.
	intersects: function () {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			i, p, p1;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		for (i = len - 1; i >= 3; i--) {
			p = points[i - 1];
			p1 = points[i];


			if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
				return true;
			}
		}

		return false;
	},

	// Check for intersection if new latlng was added to this polyline.
	// NOTE: does not support detecting intersection for degenerate cases.
	newLatLngIntersects: function (latlng, skipFirst) {
		// Cannot check a polyline for intersecting lats/lngs when not added to the map
		if (!this._map) {
			return false;
		}

		return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
	},

	// Check for intersection if new point was added to this polyline.
	// newPoint must be a layer point.
	// NOTE: does not support detecting intersection for degenerate cases.
	newPointIntersects: function (newPoint, skipFirst) {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			lastPoint = points ? points[len - 1] : null,
			// The previous previous line segment. Previous line segment doesn't need testing.
			maxIndex = len - 2;

		if (this._tooFewPointsForIntersection(1)) {
			return false;
		}

		return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
	},

	// Polylines with 2 sides can only intersect in cases where points are collinear (we don't support detecting these).
	// Cannot have intersection when < 3 line segments (< 4 points)
	_tooFewPointsForIntersection: function (extraPoints) {
		var points = this._originalPoints,
			len = points ? points.length : 0;
		// Increment length by extraPoints if present
		len += extraPoints || 0;

		return !this._originalPoints || len <= 3;
	},

	// Checks a line segment intersections with any line segments before its predecessor.
	// Don't need to check the predecessor as will never intersect.
	_lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
		var points = this._originalPoints,
			p2, p3;

		minIndex = minIndex || 0;

		// Check all previous line segments (beside the immediately previous) for intersections
		for (var j = maxIndex; j > minIndex; j--) {
			p2 = points[j - 1];
			p3 = points[j];

			if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
				return true;
			}
		}

		return false;
	}
});



L.Polygon.include({
	// Checks a polygon for any intersecting line segments. Ignores holes.
	intersects: function () {
		var polylineIntersects,
			points = this._originalPoints,
			len, firstPoint, lastPoint, maxIndex;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		polylineIntersects = L.Polyline.prototype.intersects.call(this);

		// If already found an intersection don't need to check for any more.
		if (polylineIntersects) {
			return true;
		}

		len = points.length;
		firstPoint = points[0];
		lastPoint = points[len - 1];
		maxIndex = len - 2;

		// Check the line segment between last and first point. Don't need to check the first line segment (minIndex = 1)
		return this._lineSegmentsIntersectsRange(lastPoint, firstPoint, maxIndex, 1);
	}
});


L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		draw: {},
		edit: false
	},

	initialize: function (options) {
		if (L.version < '0.7') {
			throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
		}

		L.Control.prototype.initialize.call(this, options);

		var id, toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (L.DrawToolbar && this.options.draw) {
			toolbar = new L.DrawToolbar(this.options.draw);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}

		if (L.EditToolbar && this.options.edit) {
			toolbar = new L.EditToolbar(this.options.edit);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}
	},

	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw'),
			addedTopClass = false,
			topClassName = 'leaflet-draw-toolbar-top',
			toolbarContainer;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				toolbarContainer = this._toolbars[toolbarId].addToolbar(map);

				if (toolbarContainer) {
					// Add class to the first toolbar to remove the margin
					if (!addedTopClass) {
						if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
							L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
						}
						addedTopClass = true;
					}

					container.appendChild(toolbarContainer);
				}
			}
		}

		return container;
	},

	onRemove: function () {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				this._toolbars[toolbarId].removeToolbar();
			}
		}
	},

	setDrawingOptions: function (options) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
				this._toolbars[toolbarId].setOptions(options);
			}
		}
	},

	_toolbarEnabled: function (e) {
		var id = '' + L.stamp(e.target);

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId) && toolbarId !== id) {
				this._toolbars[toolbarId].disable();
			}
		}
	}
});

L.Map.mergeOptions({
	drawControlTooltips: true,
	drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});



L.Toolbar = L.Class.extend({
	includes: [L.Mixin.Events],

	initialize: function (options) {
		L.setOptions(this, options);

		this._modes = {};
		this._actionButtons = [];
		this._activeMode = null;
	},

	enabled: function () {
		return this._activeMode !== null;
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.disable();
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = this._toolbarClass || '',
			modeHandlers = this.getModeHandlers(map),
			i;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
		this._map = map;

		for (i = 0; i < modeHandlers.length; i++) {
			if (modeHandlers[i].enabled) {
				this._initModeHandler(
					modeHandlers[i].handler,
					this._toolbarContainer,
					buttonIndex++,
					buttonClassPrefix,
					modeHandlers[i].title
				);
			}
		}

		// if no buttons were added, do not add the toolbar
		if (!buttonIndex) {
			return;
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create empty actions part of the toolbar
		this._actionsContainer = L.DomUtil.create('ul', 'leaflet-draw-actions');

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	removeToolbar: function () {
		// Dispose each handler
		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId)) {
				// Unbind handler button
				this._disposeButton(
					this._modes[handlerId].button,
					this._modes[handlerId].handler.enable,
					this._modes[handlerId].handler
				);

				// Make sure is disabled
				this._modes[handlerId].handler.disable();

				// Unbind handler
				this._modes[handlerId].handler
					.off('enabled', this._handlerActivated, this)
					.off('disabled', this._handlerDeactivated, this);
			}
		}
		this._modes = {};

		// Dispose the actions toolbar
		for (var i = 0, l = this._actionButtons.length; i < l; i++) {
			this._disposeButton(
				this._actionButtons[i].button,
				this._actionButtons[i].callback,
				this
			);
		}
		this._actionButtons = [];
		this._actionsContainer = null;
	},

	_initModeHandler: function (handler, container, buttonIndex, classNamePredix, buttonTitle) {
		var type = handler.type;

		this._modes[type] = {};

		this._modes[type].handler = handler;

		this._modes[type].button = this._createButton({
			title: buttonTitle,
			className: classNamePredix + '-' + type,
			container: container,
			callback: this._modes[type].handler.enable,
			context: this._modes[type].handler
		});

		this._modes[type].buttonIndex = buttonIndex;

		this._modes[type].handler
			.on('enabled', this._handlerActivated, this)
			.on('disabled', this._handlerDeactivated, this);
	},

	_createButton: function (options) {
		var link = L.DomUtil.create('a', options.className || '', options.container);
		link.href = '#';

		if (options.text) {
			link.innerHTML = options.text;
		}

		if (options.title) {
			link.title = options.title;
		}

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', options.callback, options.context);

		return link;
	},

	_disposeButton: function (button, callback) {
		L.DomEvent
			.off(button, 'click', L.DomEvent.stopPropagation)
			.off(button, 'mousedown', L.DomEvent.stopPropagation)
			.off(button, 'dblclick', L.DomEvent.stopPropagation)
			.off(button, 'click', L.DomEvent.preventDefault)
			.off(button, 'click', callback);
	},

	_handlerActivated: function (e) {
		// Disable active mode (if present)
		this.disable();

		// Cache new active feature
		this._activeMode = this._modes[e.handler];

		L.DomUtil.addClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

		this._showActionsToolbar();

		this.fire('enable');
	},

	_handlerDeactivated: function () {
		this._hideActionsToolbar();

		L.DomUtil.removeClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

		this._activeMode = null;

		this.fire('disable');
	},

	_createActions: function (handler) {
		var container = this._actionsContainer,
			buttons = this.getActions(handler),
			l = buttons.length,
			li, di, dl, button;

		// Dispose the actions toolbar (todo: dispose only not used buttons)
		for (di = 0, dl = this._actionButtons.length; di < dl; di++) {
			this._disposeButton(this._actionButtons[di].button, this._actionButtons[di].callback);
		}
		this._actionButtons = [];

		// Remove all old buttons
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		for (var i = 0; i < l; i++) {
			if ('enabled' in buttons[i] && !buttons[i].enabled) {
				continue;
			}

			li = L.DomUtil.create('li', '', container);

			button = this._createButton({
				title: buttons[i].title,
				text: buttons[i].text,
				container: li,
				callback: buttons[i].callback,
				context: buttons[i].context
			});

			this._actionButtons.push({
				button: button,
				callback: buttons[i].callback
			});
		}
	},

	_showActionsToolbar: function () {
		var buttonIndex = this._activeMode.buttonIndex,
			lastButtonIndex = this._lastButtonIndex,
			toolbarPosition = this._activeMode.button.offsetTop - 1;

		// Recreate action buttons on every click
		this._createActions(this._activeMode.handler);

		// Correctly position the cancel button
		this._actionsContainer.style.top = toolbarPosition + 'px';

		if (buttonIndex === 0) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
			L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
		}

		if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
			L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
		}

		this._actionsContainer.style.display = 'block';
	},

	_hideActionsToolbar: function () {
		this._actionsContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-top');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
	}
});



L.Tooltip = L.Class.extend({
	initialize: function (map) {
		this._map = map;
		this._popupPane = map._panes.popupPane;

		this._container = map.options.drawControlTooltips ? L.DomUtil.create('div', 'leaflet-draw-tooltip', this._popupPane) : null;
		this._singleLineLabel = false;
	},

	dispose: function () {
		if (this._container) {
			this._popupPane.removeChild(this._container);
			this._container = null;
		}
	},

	updateContent: function (labelText) {
		if (!this._container) {
			return this;
		}
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = false;
		}

		this._container.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';

		return this;
	},

	updatePosition: function (latlng) {
		var pos = this._map.latLngToLayerPoint(latlng),
			tooltipContainer = this._container;

		if (this._container) {
			tooltipContainer.style.visibility = 'inherit';
			L.DomUtil.setPosition(tooltipContainer, pos);
		}

		return this;
	},

	showAsError: function () {
		if (this._container) {
			L.DomUtil.addClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	removeError: function () {
		if (this._container) {
			L.DomUtil.removeClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	}
});


L.DrawToolbar = L.Toolbar.extend({

	options: {
		polyline: {},
		polygon: {},
		rectangle: {},
		circle: {},
		marker: {}
	},

	initialize: function (options) {
		// Ensure that the options are merged correctly since L.extend is only shallow
		for (var type in this.options) {
			if (this.options.hasOwnProperty(type)) {
				if (options[type]) {
					options[type] = L.extend({}, this.options[type], options[type]);
				}
			}
		}

		this._toolbarClass = 'leaflet-draw-draw';
		L.Toolbar.prototype.initialize.call(this, options);
	},

	getModeHandlers: function (map) {
		return [
			{
				enabled: this.options.polyline,
				handler: new L.Draw.Polyline(map, this.options.polyline),
				title: L.drawLocal.draw.toolbar.buttons.polyline
			},
			{
				enabled: this.options.polygon,
				handler: new L.Draw.Polygon(map, this.options.polygon),
				title: L.drawLocal.draw.toolbar.buttons.polygon
			},
			{
				enabled: this.options.rectangle,
				handler: new L.Draw.Rectangle(map, this.options.rectangle),
				title: L.drawLocal.draw.toolbar.buttons.rectangle
			},
			{
				enabled: this.options.circle,
				handler: new L.Draw.Circle(map, this.options.circle),
				title: L.drawLocal.draw.toolbar.buttons.circle
			},
			{
				enabled: this.options.marker,
				handler: new L.Draw.Marker(map, this.options.marker),
				title: L.drawLocal.draw.toolbar.buttons.marker
			}
		];
	},

	// Get the actions part of the toolbar
	getActions: function (handler) {
		return [
			{
				enabled: handler.deleteLastVertex,
				title: L.drawLocal.draw.toolbar.undo.title,
				text: L.drawLocal.draw.toolbar.undo.text,
				callback: handler.deleteLastVertex,
				context: handler
			},
			{
				title: L.drawLocal.draw.toolbar.actions.title,
				text: L.drawLocal.draw.toolbar.actions.text,
				callback: this.disable,
				context: this
			}
		];
	},

	setOptions: function (options) {
		L.setOptions(this, options);

		for (var type in this._modes) {
			if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._modes[type].handler.setOptions(options[type]);
			}
		}
	}
});



/*L.Map.mergeOptions({
	editControl: true
});*/

L.EditToolbar = L.Toolbar.extend({
	options: {
		edit: {
			selectedPathOptions: {
				color: '#fe57a1', /* Hot pink all the things! */
				opacity: 0.6,
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1
			}
		},
		remove: {},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit) {
			if (typeof options.edit.selectedPathOptions === 'undefined') {
				options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
			}
			options.edit = L.extend({}, this.options.edit, options.edit);
		}

		if (options.remove) {
			options.remove = L.extend({}, this.options.remove, options.remove);
		}

		this._toolbarClass = 'leaflet-draw-edit';
		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	getModeHandlers: function (map) {
		var featureGroup = this.options.featureGroup;
		return [
			{
				enabled: this.options.edit,
				handler: new L.EditToolbar.Edit(map, {
					featureGroup: featureGroup,
					selectedPathOptions: this.options.edit.selectedPathOptions
				}),
				title: L.drawLocal.edit.toolbar.buttons.edit
			},
			{
				enabled: this.options.remove,
				handler: new L.EditToolbar.Delete(map, {
					featureGroup: featureGroup
				}),
				title: L.drawLocal.edit.toolbar.buttons.remove
			}
		];
	},

	getActions: function () {
		return [
			{
				title: L.drawLocal.edit.toolbar.actions.save.title,
				text: L.drawLocal.edit.toolbar.actions.save.text,
				callback: this._save,
				context: this
			},
			{
				title: L.drawLocal.edit.toolbar.actions.cancel.title,
				text: L.drawLocal.edit.toolbar.actions.cancel.text,
				callback: this.disable,
				context: this
			}
		];
	},

	addToolbar: function (map) {
		var container = L.Toolbar.prototype.addToolbar.call(this, map);

		this._checkDisabled();

		this.options.featureGroup.on('layeradd layerremove', this._checkDisabled, this);

		return container;
	},

	removeToolbar: function () {
		this.options.featureGroup.off('layeradd layerremove', this._checkDisabled, this);

		L.Toolbar.prototype.removeToolbar.call(this);
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.revertLayers();

		L.Toolbar.prototype.disable.call(this);
	},

	_save: function () {
		this._activeMode.handler.save();
		this._activeMode.handler.disable();
	},

	_checkDisabled: function () {
		var featureGroup = this.options.featureGroup,
			hasLayers = featureGroup.getLayers().length !== 0,
			button;

		if (this.options.edit) {
			button = this._modes[L.EditToolbar.Edit.TYPE].button;

			if (hasLayers) {
				L.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				L.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				L.drawLocal.edit.toolbar.buttons.edit
				: L.drawLocal.edit.toolbar.buttons.editDisabled
			);
		}

		if (this.options.remove) {
			button = this._modes[L.EditToolbar.Delete.TYPE].button;

			if (hasLayers) {
				L.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				L.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				L.drawLocal.edit.toolbar.buttons.remove
				: L.drawLocal.edit.toolbar.buttons.removeDisabled
			);
		}
	}
});



L.EditToolbar.Edit = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		// Set options to the default unless already set
		this._selectedPathOptions = options.selectedPathOptions;

		// Store the selectable layer group for ease of access
		this._featureGroup = options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Edit.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', {handler: this.type});
			//this disable other handlers

		this._map.fire('draw:editstart', { handler: this.type });
			//allow drawLayer to be updated before beginning edition.

		L.Handler.prototype.enable.call(this);
		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);
	},

	disable: function () {
		if (!this._enabled) { return; }
		this._featureGroup
			.off('layeradd', this._enableLayerEdit, this)
			.off('layerremove', this._disableLayerEdit, this);
		L.Handler.prototype.disable.call(this);
		this._map.fire('draw:editstop', { handler: this.type });
		this.fire('disabled', {handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({
				text: L.drawLocal.edit.handlers.edit.tooltip.text,
				subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
			});

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {
			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire('draw:edited', {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else if (layer instanceof L.Marker) { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;
		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			} else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			} else if (layer instanceof L.Marker) { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}
		}
	},

	_toggleMarkerHighlight: function (marker) {
		if (!marker._icon) {
			return;
		}
		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		var icon = marker._icon;

		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	},

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			isMarker = layer instanceof L.Marker,
			pathOptions;

		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leafler.markercluster there
		// is a chance that a marker doesn't.
		if (isMarker && !layer._icon) {
			return;
		}

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		// Update layer style so appears editable
		if (this._selectedPathOptions) {
			pathOptions = L.Util.extend({}, this._selectedPathOptions);

			if (isMarker) {
				this._toggleMarkerHighlight(layer);
			} else {
				layer.options.previousOptions = L.Util.extend({ dashArray: null }, layer.options);

				// Make sure that Polylines are not filled
				if (!(layer instanceof L.Circle) && !(layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
					pathOptions.fill = false;
				}

				layer.setStyle(pathOptions);
			}
		}

		if (isMarker) {
			layer.dragging.enable();
			layer.on('dragend', this._onMarkerDragEnd);
		} else {
			layer.editing.enable();
		}
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;
		layer.edited = false;

		// Reset layer styles to that of before select
		if (this._selectedPathOptions) {
			if (layer instanceof L.Marker) {
				this._toggleMarkerHighlight(layer);
			} else {
				// reset the layer style to what is was before being selected
				layer.setStyle(layer.options.previousOptions);
				// remove the cached options for the layer object
				delete layer.options.previousOptions;
			}
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer.off('dragend', this._onMarkerDragEnd, this);
		} else {
			layer.editing.disable();
		}
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._featureGroup.getLayers().length !== 0;
	}
});



L.EditToolbar.Delete = L.Handler.extend({
	statics: {
		TYPE: 'remove' // not delete as delete is reserved in js
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._deletableLayers = this.options.featureGroup;

		if (!(this._deletableLayers instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Delete.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', { handler: this.type});

		this._map.fire('draw:deletestart', { handler: this.type });

		L.Handler.prototype.enable.call(this);

		this._deletableLayers
			.on('layeradd', this._enableLayerDelete, this)
			.on('layerremove', this._disableLayerDelete, this);
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._deletableLayers
			.off('layeradd', this._enableLayerDelete, this)
			.off('layerremove', this._disableLayerDelete, this);

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:deletestop', { handler: this.type });

		this.fire('disabled', { handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._deletableLayers.eachLayer(this._enableLayerDelete, this);
			this._deletedLayers = new L.layerGroup();

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.remove.tooltip.text });

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(this._disableLayerDelete, this);
			this._deletedLayers = null;

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	revertLayers: function () {
		// Iterate of the deleted layers and add them back into the featureGroup
		this._deletedLayers.eachLayer(function (layer) {
			this._deletableLayers.addLayer(layer);
		}, this);
	},

	save: function () {
		this._map.fire('draw:deleted', { layers: this._deletedLayers });
	},

	_enableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.on('click', this._removeLayer, this);
	},

	_disableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.off('click', this._removeLayer, this);

		// Remove from the deleted layers so we can't accidently revert if the user presses cancel
		this._deletedLayers.removeLayer(layer);
	},

	_removeLayer: function (e) {
		var layer = e.layer || e.target || e;

		this._deletableLayers.removeLayer(layer);

		this._deletedLayers.addLayer(layer);
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._deletableLayers.getLayers().length !== 0;
	}
});



/*
 * Leaflet.label assumes that you have already included the Leaflet library.
 */

L.labelVersion = '0.2.2-dev';


L.Label = (L.Layer ? L.Layer : L.Class).extend({

	includes: L.Mixin.Events,

	options: {
		className: '',
		clickable: false,
		direction: 'right',
		noHide: false,
		offset: [12, -15], // 6 (width of the label triangle) + 6 (padding)
		opacity: 1,
		zoomAnimation: true
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
		this._animated = L.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		this._pane = this.options.pane ? map._panes[this.options.pane] :
			this._source instanceof L.Marker ? map._panes.markerPane : map._panes.popupPane;

		if (!this._container) {
			this._initLayout();
		}

		this._pane.appendChild(this._container);

		this._initInteraction();

		this._update();

		this.setOpacity(this.options.opacity);

		map
			.on('moveend', this._onMoveEnd, this)
			.on('viewreset', this._onViewReset, this);

		if (this._animated) {
			map.on('zoomanim', this._zoomAnimation, this);
		}

		if (L.Browser.touch && !this.options.noHide) {
			L.DomEvent.on(this._container, 'click', this.close, this);
			map.on('click', this.close, this);
		}
	},

	onRemove: function (map) {
		this._pane.removeChild(this._container);

		map.off({
			zoomanim: this._zoomAnimation,
			moveend: this._onMoveEnd,
			viewreset: this._onViewReset
		}, this);

		this._removeInteraction();

		this._map = null;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
		}
		return this;
	},

	setContent: function (content) {
		// Backup previous content and store new content
		this._previousContent = this._content;
		this._content = content;

		this._updateContent();

		return this;
	},

	close: function () {
		var map = this._map;

		if (map) {
			if (L.Browser.touch && !this.options.noHide) {
				L.DomEvent.off(this._container, 'click', this.close);
				map.off('click', this.close, this);
			}

			map.removeLayer(this);
		}
	},

	updateZIndex: function (zIndex) {
		this._zIndex = zIndex;

		if (this._container && this._zIndex) {
			this._container.style.zIndex = zIndex;
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	_initLayout: function () {
		this._container = L.DomUtil.create('div', 'leaflet-label ' + this.options.className + ' leaflet-zoom-animated');
		this.updateZIndex(this._zIndex);
	},

	_update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updatePosition();

		this._container.style.visibility = '';
	},

	_updateContent: function () {
		if (!this._content || !this._map || this._prevContent === this._content) {
			return;
		}

		if (typeof this._content === 'string') {
			this._container.innerHTML = this._content;

			this._prevContent = this._content;

			this._labelWidth = this._container.offsetWidth;
		}
	},

	_updatePosition: function () {
		var pos = this._map.latLngToLayerPoint(this._latlng);

		this._setPosition(pos);
	},

	_setPosition: function (pos) {
		var map = this._map,
			container = this._container,
			centerPoint = map.latLngToContainerPoint(map.getCenter()),
			labelPoint = map.layerPointToContainerPoint(pos),
			direction = this.options.direction,
			labelWidth = this._labelWidth,
			offset = L.point(this.options.offset);

		// position to the right (right or auto & needs to)
		if (direction === 'right' || direction === 'auto' && labelPoint.x < centerPoint.x) {
			L.DomUtil.addClass(container, 'leaflet-label-right');
			L.DomUtil.removeClass(container, 'leaflet-label-left');

			pos = pos.add(offset);
		} else { // position to the left
			L.DomUtil.addClass(container, 'leaflet-label-left');
			L.DomUtil.removeClass(container, 'leaflet-label-right');

			pos = pos.add(L.point(-offset.x - labelWidth, offset.y));
		}

		L.DomUtil.setPosition(container, pos);
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPosition(pos);
	},

	_onMoveEnd: function () {
		if (!this._animated || this.options.direction === 'auto') {
			this._updatePosition();
		}
	},

	_onViewReset: function (e) {
		/* if map resets hard, we must update the label */
		if (e && e.hard) {
			this._update();
		}
	},

	_initInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.addClass(container, 'leaflet-clickable');
		L.DomEvent.on(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(container, events[i], this._fireMouseEvent, this);
		}
	},

	_removeInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.removeClass(container, 'leaflet-clickable');
		L.DomEvent.off(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.off(container, events[i], this._fireMouseEvent, this);
		}
	},

	_onMouseClick: function (e) {
		if (this.hasEventListeners(e.type)) {
			L.DomEvent.stopPropagation(e);
		}

		this.fire(e.type, {
			originalEvent: e
		});
	},

	_fireMouseEvent: function (e) {
		this.fire(e.type, {
			originalEvent: e
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	}
});



// This object is a mixin for L.Marker and L.CircleMarker. We declare it here as both need to include the contents.
L.BaseMarkerMethods = {
	showLabel: function () {
		if (this.label && this._map) {
			this.label.setLatLng(this._latlng);
			this._map.showLabel(this.label);
		}

		return this;
	},

	hideLabel: function () {
		if (this.label) {
			this.label.close();
		}
		return this;
	},

	setLabelNoHide: function (noHide) {
		if (this._labelNoHide === noHide) {
			return;
		}

		this._labelNoHide = noHide;

		if (noHide) {
			this._removeLabelRevealHandlers();
			this.showLabel();
		} else {
			this._addLabelRevealHandlers();
			this.hideLabel();
		}
	},

	bindLabel: function (content, options) {
		var labelAnchor = this.options.icon ? this.options.icon.options.labelAnchor : this.options.labelAnchor,
			anchor = L.point(labelAnchor) || L.point(0, 0);

		anchor = anchor.add(L.Label.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = L.Util.extend({offset: anchor}, options);

		this._labelNoHide = options.noHide;

		if (!this.label) {
			if (!this._labelNoHide) {
				this._addLabelRevealHandlers();
			}

			this
				.on('remove', this.hideLabel, this)
				.on('move', this._moveLabel, this)
				.on('add', this._onMarkerAdd, this);

			this._hasLabelHandlers = true;
		}

		this.label = new L.Label(options, this)
			.setContent(content);

		return this;
	},

	unbindLabel: function () {
		if (this.label) {
			this.hideLabel();

			this.label = null;

			if (this._hasLabelHandlers) {
				if (!this._labelNoHide) {
					this._removeLabelRevealHandlers();
				}

				this
					.off('remove', this.hideLabel, this)
					.off('move', this._moveLabel, this)
					.off('add', this._onMarkerAdd, this);
			}

			this._hasLabelHandlers = false;
		}
		return this;
	},

	updateLabelContent: function (content) {
		if (this.label) {
			this.label.setContent(content);
		}
	},

	getLabel: function () {
		return this.label;
	},

	_onMarkerAdd: function () {
		if (this._labelNoHide) {
			this.showLabel();
		}
	},

	_addLabelRevealHandlers: function () {
		this
			.on('mouseover', this.showLabel, this)
			.on('mouseout', this.hideLabel, this);

		if (L.Browser.touch) {
			this.on('click', this.showLabel, this);
		}
	},

	_removeLabelRevealHandlers: function () {
		this
			.off('mouseover', this.showLabel, this)
			.off('mouseout', this.hideLabel, this);

		if (L.Browser.touch) {
			this.off('click', this.showLabel, this);
		}
	},

	_moveLabel: function (e) {
		this.label.setLatLng(e.latlng);
	}
};


// Add in an option to icon that is used to set where the label anchor is
L.Icon.Default.mergeOptions({
	labelAnchor: new L.Point(9, -20)
});

// Have to do this since Leaflet is loaded before this plugin and initializes
// L.Marker.options.icon therefore missing our mixin above.
L.Marker.mergeOptions({
	icon: new L.Icon.Default()
});

L.Marker.include(L.BaseMarkerMethods);
L.Marker.include({
	_originalUpdateZIndex: L.Marker.prototype._updateZIndex,

	_updateZIndex: function (offset) {
		var zIndex = this._zIndex + offset;

		this._originalUpdateZIndex(offset);

		if (this.label) {
			this.label.updateZIndex(zIndex);
		}
	},

	_originalSetOpacity: L.Marker.prototype.setOpacity,

	setOpacity: function (opacity, labelHasSemiTransparency) {
		this.options.labelHasSemiTransparency = labelHasSemiTransparency;

		this._originalSetOpacity(opacity);
	},

	_originalUpdateOpacity: L.Marker.prototype._updateOpacity,

	_updateOpacity: function () {
		var absoluteOpacity = this.options.opacity === 0 ? 0 : 1;

		this._originalUpdateOpacity();

		if (this.label) {
			this.label.setOpacity(this.options.labelHasSemiTransparency ? this.options.opacity : absoluteOpacity);
		}
	},

	_originalSetLatLng: L.Marker.prototype.setLatLng,

	setLatLng: function (latlng) {
		if (this.label && !this._labelNoHide) {
			this.hideLabel();
		}

		return this._originalSetLatLng(latlng);
	}
});


// Add in an option to icon that is used to set where the label anchor is
L.CircleMarker.mergeOptions({
	labelAnchor: new L.Point(0, 0)
});


L.CircleMarker.include({
	bindLabel: function (content, options) {
		if (!this.label || this.label.options !== options) {
			this.label = new L.Label(options, this);
		}

		this.label.setContent(content);

		if (!this._showLabelAdded) {
			this
				.on('remove', this._hideLabel, this)
				.on('add', this._onMarkerAdd, this);
			if (!this.label.options.noHide) {
				this
					.on('mouseout', this._hideLabel, this)
					.on('mouseover', this._showLabel, this)
					.on('mousemove', this._moveLabel, this);
			}
			if (L.Browser.touch) {
				this.on('click', this._showLabel, this);
			}
			this._showLabelAdded = true;
		}

		return this;
	},

	unbindLabel: function () {
		if (this.label) {
			this._hideLabel();
			this.label = null;
			this._showLabelAdded = false;
			this
				.off('mouseover', this._showLabel, this)
				.off('mousemove', this._moveLabel, this)
				.off('mouseout remove', this._hideLabel, this);
		}
		return this;
	},

	updateLabelContent: function (content) {
		if (this.label) {
			this.label.setContent(content);
		}
	},
	_onMarkerAdd: function (e) {
		if (this.label.options.noHide) {
			var latlng = L.Util.isArray(this.getLatLngs()[this.getLatLngs().length - 1]) ? this.getCenter() : this.getLatLngs()[this.getLatLngs().length - 1]
			this._showLabel({latlng: latlng});
		}
	},
	_showLabel: function (e) {
		this.label.setLatLng(e.latlng);
		this._map.showLabel(this.label);
	},

	_moveLabel: function (e) {
		this.label.setLatLng(e.latlng);
	},

	_hideLabel: function (e) {
		this.label.close();
	}
});


L.Path.include({
    bindLabel: function (content, options) {
        if (!this.label || this.label.options !== options) {
            this.label = new L.Label(options, this);
        }

        this.label.setContent(content);

        if (!this._showLabelAdded) {
            this
                .on('remove', this._hideLabel, this)
                .on('add', this._onMarkerAdd, this);
            if (!this.label.options.noHide) {
                this
                    .on('mouseout', this._hideLabel, this)
                    .on('mouseover', this._showLabel, this)
                    .on('mousemove', this._moveLabel, this);
            }
            if (L.Browser.touch) {
                this.on('click', this._showLabel, this);
            }
            this._showLabelAdded = true;
        }

        return this;
    },

    unbindLabel: function () {
        if (this.label) {
            this._hideLabel();
            this.label = null;
            this._showLabelAdded = false;
            this
                .off('mouseover', this._showLabel, this)
                .off('mousemove', this._moveLabel, this)
                .off('mouseout remove', this._hideLabel, this);
        }
        return this;
    },

    updateLabelContent: function (content) {
        if (this.label) {
            this.label.setContent(content);
        }
    },
    _onMarkerAdd: function (e) {
        if (this.label.options.noHide) {
            var latlng = L.Util.isArray(this.getLatLngs()[this.getLatLngs().length - 1]) ? this.getCenter() : this.getLatLngs()[this.getLatLngs().length - 1]
            this._showLabel({latlng: latlng});
        }
    },
    _showLabel: function (e) {
        this.label.setLatLng(e.latlng);
        this._map.showLabel(this.label);
    },

    _moveLabel: function (e) {
        this.label.setLatLng(e.latlng);
    },

    _hideLabel: function (e) {
        this.label.close();
    }
});


L.Map.include({
	showLabel: function (label) {
		return this.addLayer(label);
	}
});


L.FeatureGroup.include({
	// TODO: remove this when AOP is supported in Leaflet, need this as we cannot put code in removeLayer()
	clearLayers: function () {
		this.unbindLabel();
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	bindLabel: function (content, options) {
		return this.invoke('bindLabel', content, options);
	},

	unbindLabel: function () {
		return this.invoke('unbindLabel');
	},

	updateLabelContent: function (content) {
		this.invoke('updateLabelContent', content);
	}
});


/**
 * Created by bk on 2015/5/19.
 */
/**
 *
 * CONTAIN: “CONTAIN”,

 *  CROSS: “CROSS”,

 * DISJOINT: “DISJOINT”,

 * IDENTITY: “IDENTITY”,

 * INTERSECT: “INTERSECT”,

 * NONE: “NONE”,

 * OVERLAP: “OVERLAP”,

 * TOUCH: “TOUCH”,

 * WITHIN: “WITHIN”.
 */
L.SupermapQuery = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],

    options: {
        // url:"http://192.168.0.191:8091/iserver/services/map-DY/rest/maps/DY25/queryResults.jsonp",
        //shenhe in ('1')
        //SpatialQuery
        //DistanceQuery
        distance: 2500,
        queryMode: "BoundsQuery",
        spatialRelation: "INTERSECT",
        params: [
            {
                tableName: "D_Building@SUPERMAP_DY",
                where: ""
            }
        ],
        bounds: null,
        expectCount: "100000",
        isInnerTransform: false,
        //m和degree
        outProj: "m"

    },

    _body: {
        content: "{'queryMode':'$queryMode$'," +
        "'queryParameters':" +
        "{'customParams':null," +
        "'expectCount':$expectCount$," +
        "'networkType':\"LINE\"," +
        "'queryOption':\"ATTRIBUTEANDGEOMETRY\"," +
        "'queryParams':[$params$" +
        "]," +
        "'startRecord':0,'holdTime':10," +
        "'returnCustomResult':false}," +
        "$bounds$",
        bounds: "'bounds': {'rightTop':{'y':$rightTopY$,'x':$rightTopX$},'leftBottom':{'y':$leftBottomY$,'x':$leftBottomX$}}",
        params: "{'name':\"$name$\"," +
        "'attributeFilter':\"$where$\"," +
        "'joinItems':null," +
        "'linkItems':null," +
        "'ids':null,'orderBy':null," +
        "'groupBy':null,'fields':null},"
    },

    initialize: function (options) {
        L.setOptions(this, options);
        return this;
    },
    //处理返回时的面对象
    _fixPolygon: function (parts, points, result, attrs) {
        var innerPoints = [];
        var start = 0;
        var end = parts[0];
        for(var partIndex in parts){
            var tempPoints = [];
            var arrayPoints = [];
            for(i = start; i < end; i++){
                if (this.options.isInnerTransform) {
                    var transPoint = L.Util.transform.point25To2(points[i].x, points[i].y)
                    arrayPoints.push([transPoint.y, transPoint.x]);
                }
                else {
                    arrayPoints.push(L.Projection.Mercator.unproject(new L.point(points[i].x, points[i].y)));
                }
            }
            if(partIndex + 1 < points.length){
                start = end;
                end = end + parts[partIndex + 1];
            }
            tempPoints.push(arrayPoints);
            innerPoints.push(tempPoints);
        }

        var polygon = new L.Polygon(innerPoints, {
            attrs: attrs
        });
        var prooerties = {};
        for (var i in attrs.fieldNames) {
            prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
        }

        polygon.feature = polygon.toGeoJSON();
        polygon.feature.properties = prooerties;
        polygon.feature.id = "smid"+prooerties.SMID
        polygon.addTo(result, prooerties.SMID);
    },
    //处理返回时的点对象
    _fixPoint: function (points, result, attrs) {
        for (var index in points) {
            if (this.options.isInnerTransform) {
                var transPoint = L.Util.transform.point25To2(points[index].x, points[index].y)
                L.marker([transPoint.y, transPoint.x], {
                    attrs: attrs
                }).addTo(result);
            }
            else {
                var marker = L.marker(L.Projection.Mercator.unproject(new L.point(points[index].x, points[index].y)), {
                    attrs: attrs
                })
                var prooerties = {};
                for (var i in attrs.fieldNames) {
                    prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
                }
                marker.feature = marker.toGeoJSON();
                marker.feature.properties = prooerties;
                marker.feature.id = "smid"+prooerties.SMID
                marker.addTo(result);
            }

        }
    },
    _fixLine: function (points, result, attrs) {
        var innerPoints = [];
        for (var index in points) {
            if (this.options.isInnerTransform) {
                var transPoint = L.Util.transform.point25To2(points[index].x, points[index].y)
                innerPoints.push([transPoint.y, transPoint.x]);
            }
            else {
                innerPoints.push(L.Projection.Mercator.unproject(new L.point(points[index].x, points[index].y)));
            }

        }
        var polyline = new L.Polyline(innerPoints, {
            attrs: attrs
        });
        var prooerties = {};
        for (var i in attrs.fieldNames) {
            prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
        }

        polyline.feature = polyline.toGeoJSON();
        polyline.feature.properties = prooerties;
        polyline.feature.id = "smid"+prooerties.SMID
        polyline.addTo(result);
    },
    _toQueryStr: function () {
        var timestamp = Date.parse(new Date());
        var content = this._body.content;
        var paramStr = this._body.params;
        var options = this.options;
        content = content.toString().replace("$queryMode$", options.queryMode);
        content = content.toString().replace("$expectCount$", options.expectCount);

        var temParamStr = "";
        for (var i = 0; i < options.params.length; i++) {
            var item = paramStr.toString().replace("$name$", options.params[i].tableName);
            item = item.toString().replace("$where$", options.params[i].where);
            temParamStr += item;
        }
        content = content.toString().replace("$params$", temParamStr);
        if (options.queryMode == "SpatialQuery") {
            content = content.toString().replace("$bounds$", this._geomToStr(options.bounds));
            content += ",'spatialQueryMode':\"" + options.spatialRelation + "\"}"
        }
        else if (options.queryMode == "BoundsQuery" || options.queryMode == "SqlQuery") {
            content = content.toString().replace("$bounds$", this._boundsToStr(options.bounds));
            content += "}"
        } else if (options.queryMode == "DistanceQuery") {
            content = content.toString().replace("$bounds$", this._geomToStr(options.bounds));
            content += ",'spatialQueryMode':\"" + options.spatialRelation + "\"}"
            content += ",'distance':\"" + options.distance + "\"}"
        }


        var contentCount = Math.ceil(content.getLength() / 1000);
        var bodys = [];

        for (var index = 0; index < contentCount; index++) {
            var temContext = content.substring(index * 1000, (index * 1000) + 1000);

            bodys[index] = {
                returnContent: true,
                _method: 'POST',
                sectionCount: contentCount == 1 ? 1 : contentCount + 1,
                sectionIndex: index,
                requestEntity: temContext,
                jsonpUserID: timestamp
            };
        }
        if (contentCount > 1) {
            bodys.push({
                returnContent: true,
                _method: 'POST',
                sectionCount: contentCount + 1,
                sectionIndex: contentCount,
                jsonpUserID: timestamp
            });
        }
        return bodys;
    },
    _boundsToStr: function (bounds) {
        var boundsStr = this._body.bounds;
        if (bounds) {
            var northEast = bounds._northEast
            var southWest = bounds._southWest
            if (this.options.outProj == "m") {
                northEast = L.Projection.Mercator.project(northEast);
                southWest = L.Projection.Mercator.project(southWest);

            }
            boundsStr = boundsStr.toString().replace("$rightTopY$", northEast.y);
            boundsStr = boundsStr.toString().replace("$rightTopX$", northEast.x);
            boundsStr = boundsStr.toString().replace("$leftBottomY$", southWest.y);
            boundsStr = boundsStr.toString().replace("$leftBottomX$", southWest.x);
            return boundsStr;
        }
        else {
            return "";
        }
    },
    _geomToStr: function (feature) {
        var geoType = feature.toGeoJSON().geometry.type;
        switch (geoType.toString()) {
            case "Polygon":
                geoType = "REGION";
                break;
            case "Polyline":
                geoType = "LINE";
                break;
            case "Point":
                geoType = "POINT";
                break;
        }
        var featureJson = "'geometry':{'id':" + Date.parse(new Date()) + ",'style':null,'type':\"" + geoType + "\",'prjCoordSys':{'epsgCode':null},'parts':[";
        featureJson += geoType == "POINT" ? "1" : feature._latlngs.length;
        featureJson += "],";
        featureJson += "'points':["
        if (geoType == "POINT") {
            var temPoint = feature._latlng;
            if (this.options.outProj == "m") {
                temPoint = L.Projection.Mercator.project(temPoint);
            }
            featureJson += "{'id':\"\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
        }
        else {
            for (var i in feature._latlngs[0]) {
                var temPoint = feature._latlngs[0][i];
                if (this.options.outProj == "m") {
                    temPoint = L.Projection.Mercator.project(temPoint);
                }
                featureJson += "{'id':\"0\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
            }
        }
        featureJson += "]}";
        return featureJson;
    },
    get: function (url, callback, context) {
        var queryTask = this._toQueryStr();
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }

        this.JSONP(url, queryTask[queryTask.length - 1], function (a, b) {
            var result = new L.featureGroup();
            for (var recordIndex = 0; recordIndex < b.recordsets.length; recordIndex++) {
                for (var i = 0; i < b.recordsets[recordIndex].features.length; i++) {
                    var attrs = {
                        fieldNames: b.recordsets[recordIndex].features[i].fieldNames,
                        fieldValues: b.recordsets[recordIndex].features[i].fieldValues
                    }
                    var points = b.recordsets[recordIndex].features[i].geometry.points;
                    var parts = b.recordsets[0].features[i].geometry.parts;
                    switch (b.recordsets[recordIndex].features[i].geometry.type) {
                        case "REGION":
                            this._fixPolygon(parts, points, result, attrs);
                            break;
                        case "POINT":
                            this._fixPoint(points, result, attrs);
                            break;
                        case "LINE":
                            this._fixLine(points, result, attrs);
                            break;
                    }
                }
            }

            callback.call(context, result);
        }, this);
    }

})




/**
 * Created by bk on 2015/11/5.
 */
/**
 * @class L.SaveDraw
 * @params {[Object]} {
 *
 * outProj:"m" ����degree�� ������겻��ͶӰת��
 * }
 * */
L.SaveDraw = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],
    options: {
        outProj: "m"

    }, initialize: function (options) {
        L.setOptions(this, options);
    },
    concent: {
        returnContent: true,
        _method: 'POST',
        requestEntity: {},
        sectionCount: 1,
        sectionIndex: 0
    },
    _toGeoString: function (featureGroup) {
        var updateJson = "[";
        for (var key in featureGroup) {
            var featureJson = "{"
            var feature = featureGroup[key];
            var geoType = feature.toGeoJSON().geometry.type;
            switch (geoType.toString()) {
                case "Polygon":
                    geoType = "REGION";
                    break;
                case "LineString":
                    geoType = "LINE";
                    break;
                case "Point":
                    geoType = "POINT";
                    break;
            }
            if (feature.feature.properties) {
                var fieldName = "'fieldNames':["
                var fieldValue = "'fieldValues':[";
                for (var n in feature.feature.properties) {
                    fieldName += "\"" + n + "\"" + ",";
                    fieldValue += "\"" + feature.feature.properties[n] + "\"" + ",";
                }
                fieldName += "],";
                featureJson += fieldName;

                fieldValue += "],"
                featureJson += fieldValue;
            }
            featureJson += "'geometry':{'id':" + (feature.feature.properties.SMID||+Date.parse(new Date())) + ",'style':null,'type':\"" + geoType + "\",'prjCoordSys':{'epsgCode':null},'parts':[";
            featureJson += geoType == "POINT" ? "1" : feature._latlngs.length;
            featureJson += "],";
            featureJson += "'points':["
            if (geoType == "POINT") {
                var temPoint = feature._latlng;
                if (this.options.outProj == "m") {
                    temPoint = L.Projection.Mercator.project(temPoint);
                }
                featureJson += "{'id':\"\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
            }
            else {
                if (geoType == "REGION") {
                    for (var i in feature._latlngs[0]) {
                        var temPoint = feature._latlngs[0][i];
                        if (this.options.outProj == "m") {
                            temPoint = L.Projection.Mercator.project(temPoint);
                        }
                        featureJson += "{'id':\"0\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
                    }
                }
            }

            featureJson += "]}";
            featureJson += "},";
            updateJson += featureJson;
        }
        updateJson += "]"
        return updateJson;
    },
    _bodyJoin: function (content, method) {
        var contentCount = Math.ceil(content.getLength() / 1000);
        var bodys = [];
        var timestamp = Date.parse(new Date());

        for (var index = 0; index < contentCount; index++) {
            var temContext = content.substring(index * 1000, (index * 1000) + 1000);

            bodys[index] = {
                returnContent: true,
                _method: method || 'POST',
                sectionCount: contentCount == 1 ? 1 : contentCount + 1,
                sectionIndex: index,
                requestEntity: temContext,
                jsonpUserID: timestamp
            };
        }
        if (contentCount > 1) {
            bodys.push({
                returnContent: true,
                _method: method || 'POST',
                sectionCount: contentCount + 1,
                sectionIndex: contentCount,
                jsonpUserID: timestamp
            });
        }
        return bodys;
    },
    /**
     * @method save
     * @params {[String]} url url
     * @params {[Array]} featureGroup Ҫ�ؼ�
     * @params {[callback]} callback �ص�����
     * @params {[Object]} context ����
     * */
    save: function (url, featureGroup, callback, context) {

        var str = this._toGeoString(featureGroup);
        var queryTask = this._bodyJoin(str);
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }

        var my = this.JSONP(url, queryTask[queryTask.length - 1], callback, context);
        console.log(my);
    },
    update: function (url, featureGroup, callback, context) {

        var str = this._toGeoString(featureGroup);
        var queryTask = this._bodyJoin(str, "PUT");
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }

        var my = this.JSONP(url, queryTask[queryTask.length - 1], callback, context);
        console.log(my);
    },
    /**
     * ids : [1,2,3,4]
     * */
    delete: function (url, ids, callback, context) {
        var myConcent = this.concent;
        myConcent._method = "DELETE";
        myConcent.requestEntity = ids;
        myConcent.ids = ids;
        var my = this.JSONP(url, myConcent, callback, context);
    }
})


/**
 * Created by PRadostev on 20.02.2015.
 */

L.GMLUtil = {
    posNode: function (coord) {
        return L.XmlUtil.createElementNS('gml:pos', {srsDimension: 2}, {value: coord.x + ' ' + coord.y});
    },

    posListNode: function (coords, close) {
        var localcoords = [];
        coords.forEach(function (coord) {
            localcoords.push(coord.x + ' ' + coord.y);
        });
        if (close && coords.length > 0) {
            var coord = coords[0];
            localcoords.push(coord.x + ' ' + coord.y);
        }

        var posList = localcoords.join(' ');
        return L.XmlUtil.createElementNS('gml:posList', {}, {value: posList});
    }
};


/**
 * Created by PRadostev on 20.02.2015.
 */

L.Marker.include({
    toGml: function (crs) {
        var node = L.XmlUtil.createElementNS('gml:Point', {srsName: crs.code});
        node.appendChild(L.GMLUtil.posNode(crs.projection.project(this.getLatLng())));
        return node;
    }
});


/**
 * Created by PRadostev on 06.03.2015.
 */

L.Polyline.include({
    toGml: function (crs) {
        var node = L.XmlUtil.createElementNS('gml:LineString', {srsName: crs.code, srsDimension: 2});
        node.appendChild(L.GMLUtil.posListNode(crs.projection.project(this.getLatLngs()), true));
        return node;
    }
});



/**
 * Created by PRadostev on 20.02.2015.
 */

L.Polygon.include({
    toGml: function (crs) {
        var node = L.XmlUtil.createElementNS('gml:Polygon', {srsName: crs.code, srsDimension: 2});
        node.appendChild(L.XmlUtil.createElementNS('gml:exterior'))
            .appendChild(L.XmlUtil.createElementNS('gml:LinearRing', {srsDimension: 2}))
            //暂时是只添加一个环
            .appendChild(L.GMLUtil.posListNode(crs.projection.project(this.getLatLngs()[0]), true));
        //.appendChild(L.GMLUtil.posListNode(crs.projection.project(this.getLatLngs()), true));

        if (this._holes && this._holes.length) {
            for (var hole in this._holes) {
                node.appendChild(L.XmlUtil.createElementNS('gml:interior'))
                    .appendChild(L.XmlUtil.createElementNS('gml:LinearRing', {srsDimension: 2}))
                    .appendChild(L.GMLUtil.posListNode(crs.projection.project(this._holes[hole]), true));
            }
        }

        return node;
    }
});



/**
 * Created by PRadostev on 06.02.2015.
 */

L.XmlUtil = {
    // comes from OL
    namespaces: {
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        wfs: "http://www.opengis.net/wfs",
        gml: "http://www.opengis.net/gml",
        ogc: "http://www.opengis.net/ogc",
        ows: "http://www.opengis.net/ows",
        xmlns: "http://www.w3.org/2000/xmlns/"
    },

    //TODO: есть ли нормальная реализация для создания нового документа с doctype text/xml?
    xmldoc: (new DOMParser()).parseFromString('<root />', 'text/xml'),

    setAttributes: function (node, attributes) {
        for (var name in attributes) {
            if (attributes[name] != null && attributes[name].toString) {
                var value = attributes[name].toString();
                var uri = this.namespaces[name.substring(0, name.indexOf(":"))] || null;
                node.setAttributeNS(uri, name, value);
            }
        }
    },

    evaluate: function (xpath, rawxml) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(rawxml, 'text/xml');
        var xpe = new XPathEvaluator();
        var nsResolver = xpe.createNSResolver(xmlDoc.documentElement);

        return xpe.evaluate(xpath, xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
    },

    createElementNS: function (name, attributes, options) {
        options = options || {};

        var uri = options.uri;

        if (!uri) {
            uri = this.namespaces[name.substring(0, name.indexOf(":"))];
        }

        if (!uri) {
            uri = this.namespaces[options.prefix];
        }

        var node = uri ? this.xmldoc.createElementNS(uri, name) : this.xmldoc.createElement(name);

        if (attributes) {
            this.setAttributes(node, attributes);
        }

        if (options.value != null) {
            node.appendChild(this.xmldoc.createTextNode(options.value));
        }

        return node;
    },

    createTextNode: function (value) {
        return this.xmldoc.createTextNode(value);
    },

    createXmlDocumentString: function (node) {
        var doc = document.implementation.createDocument("", "", null);
        doc.appendChild(node);
        var serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    },

    createXmlString: function (node) {
        var serializer = new XMLSerializer();
        return serializer.serializeToString(node);
    }

};


/**
 * Created by PRadostev on 30.01.2015.
 */

L.Format = L.Class.extend({
    defaultOptions: {
        crs: L.CRS.EPSG3857,
        coordsToLatLng: function (coords) {
            return new L.LatLng(coords[1], coords[0], coords[2]);
        },
        latLngToCoords: function (latlng) {
            var coords = [latlng.lng, latlng.lat];
            if (latlng.alt !== undefined) {
                coords.push(latlng.alt);
            }
            return coords;
        }
    },

    setCRS: function (crs) {
        this.options.crs = crs;
        if (crs !== undefined) {
            this.options.coordsToLatLng = function (coords) {
                var point = L.point(coords[0], coords[1]);
                return crs.projection.unproject(point);
            };
            this.options.latLngToCoords = function (ll) {
                var point = new L.latLng(ll[0], ll[1]);
                return crs.projection.project(point);
            };
        }
    },

    initialize: function (options) {
        L.setOptions(this, L.extend(this.defaultOptions, options));
    }
});


/**
 * Created by PRadostev on 30.01.2015.
 * Translate GeoJSON to leaflet structures
 */

L.Format.GeoJSON = L.Format.extend({

    initialize: function (options) {
        L.Format.prototype.initialize.call(this, options);
        this.outputFormat = 'application/json';
    },

    responseToLayers: function (options) {
        options = options || {};
        var layers = {};
        var geoJson = options.rawData;

        for (var i = 0; i < geoJson.features.length; i++) {
            var layer = L.GeoJSON.geometryToLayer(geoJson.features[i], options);
            if (layer == null) {
                continue;
            }
            layer.feature = geoJson.features[i];
            layers[layer.feature.id] = layer;
        }

        return layers;
    }
});



/**
 * Created by PRadostev on 06.02.2015.
 * Class L.Filter
 * This class represents an OGC Filter
 */

L.Filter = L.Class.extend({
    initialize: function () {
        this.filter = L.XmlUtil.createElementNS('ogc:Filter');
    },

    /**
     * Represents this filter as GML node
     *
     * Returns:
     * {XmlElement} Gml representation of this filter
     */
    toGml: function () {
        return this.filter;
    },

    append: function () {
        return this;
    }
});


/**
 * Created by PRadostev on 09.02.2015.
 */

L.Filter.GmlObjectID = L.Filter.extend({
    append: function (id) {
        this.filter.appendChild(L.XmlUtil.createElementNS('ogc:GmlObjectId', {'gml:id': id}));
        return this;
    }
});


/**
 * Created by bk on 2015/6/5.
 *
 * TYPE : PropertyIsEqualTo,PropertyIsNotEqualTo,PropertyIsLessThan,PropertyIsGreaterThan,
 *        PropertyIsLessThanOrEq,PropertyIsGreaterThanO,PropertyIsLik,PropertyIsNull,
 *        PropertyIsBetween
 */


L.Filter.Property = L.Filter.extend({
    append: function (params) {
        var innerRelation = L.XmlUtil.createElementNS("ogc:Or");
        for (var i in params) {
            var node = L.XmlUtil.createElementNS("ogc:" + params[i].relation, {wildCard: "*", singleChar: "?", escapeChar: "\\"});

            var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
            propertyName.appendChild(L.XmlUtil.createTextNode(params[i].propertyName));
            node.appendChild(propertyName);

            var propertyValue = L.XmlUtil.createElementNS("ogc:Literal");
            propertyValue.appendChild(L.XmlUtil.createTextNode(params[i].propertyValue));
            node.appendChild(propertyValue);

            innerRelation.appendChild(node)

        }
        this.filter.appendChild(innerRelation);
        return innerRelation;
    }
});


L.Filter.Spatial = L.Filter.extend({
    //Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
    append: function (relation,geom,crs,geom_field) {
        var node =  L.XmlUtil.createElementNS(relation);
        var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
            propertyName.appendChild(L.XmlUtil.createTextNode(geom_field || "the_geom"));
            node.appendChild(propertyName);
        var propertyValue = geom.toGml(crs);
            node.appendChild(propertyValue);
        this.filter.appendChild(node);
        return node;
    }
});


L.Filter.BBox = L.Filter.extend({
    //Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
    append: function (bounds,crs,geom_field) {
        var node =  L.XmlUtil.createElementNS("ogc:BBOX");
        var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
        propertyName.appendChild(L.XmlUtil.createTextNode(geom_field||"the_geom"));
        node.appendChild(propertyName);
        //var propertyValue = geom.toGml(crs);
        //node.appendChild(propertyValue);

        var envelope = L.XmlUtil.createElementNS("gml:Envelope",{srsName:"http://www.opengis.net/gml/srs/epsg.xml#"+crs.code.substring(5)});

        var lowerCorner = L.XmlUtil.createElementNS("gml:lowerCorner");
        var lowerCornerPoint = crs.project(bounds._southWest);
        lowerCorner.appendChild(L.XmlUtil.createTextNode(lowerCornerPoint.x + " " + lowerCornerPoint.y));
        envelope.appendChild(lowerCorner);
        var upperCorner = L.XmlUtil.createElementNS("gml:upperCorner");
        var upperCornerPoint = crs.project(bounds._northEast);
        upperCorner.appendChild(L.XmlUtil.createTextNode(upperCornerPoint.x + " " + upperCornerPoint.y));
        envelope.appendChild(upperCorner);

        node.appendChild(envelope)

        this.filter.appendChild(node);
        return node;
    }
});


/**
 * Where语句
 * @class L.Where
 * @param {[Object]} Options 初始化参数
 *
 * geometry
 *
 * where
 *
 * spatialRelation  类型为：Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
 *
 * crs
 */
//Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
L.Where = L.Class.extend({
    options: {
        geometry: null,
        where: "",
        bounds: null,
        spatialRelation: "Intersects",
        crs: {}
    },
    initialize: function (options) {
        this.filter = L.XmlUtil.createElementNS('ogc:Filter');
        this.geometry = options.geometry
        this.bounds = options.bounds
        this.spatialRelation = options.spatialRelation || "Intersects";
        this.whereStr = options.where || "";
        this.crs = options.crs;
        this.geom_field = options.geom_field || null;
        this.filters = [];
        var innerRelation = L.XmlUtil.createElementNS("ogc:And");


        var part = this._differentiateAnd(this.whereStr);
        for (var i in part) {
            this._setInFilters(this.filters, part[i]);
        }

        if (this.geometry) {
            var filter = new L.Filter.Spatial();
            this.filters.push(filter.append(this.spatialRelation, this.geometry, this.crs, this.geom_field));
        }

        if (this.bounds) {
            var filter = new L.Filter.BBox();
            this.filters.push(filter.append(this.bounds, this.crs, this.geom_field));
        }

        for (var j in this.filters) {
            innerRelation.appendChild(this.filters[j])
            this.filter.appendChild(innerRelation);
        }
    },
    _setInFilters: function (filters, str) {
        if (str.indexOf(" in ") > 0) {
            var value, valueArr, colum, params = [], filter = new L.Filter.Property(),
                startIndex = str.indexOf("("),
                endIndex = str.indexOf(")"),
                keyWordIndex = str.indexOf(" in ")
            value = str.substring(startIndex + 1, endIndex);
            colum = str.substring(0, keyWordIndex);
            valueArr = value.split(",");
            for (var i in valueArr) {
                params.push({
                    relation: "PropertyIsLike",
                    propertyName: colum,
                    propertyValue: valueArr[i]
                })
            }
            filters.push(filter.append(params));
        }
        else if (str.indexOf(" = ") > 0) {
            var value, valueArr, colum, params = [], filter = new L.Filter.Property(),
                startIndex = str.indexOf("("),
                endIndex = str.indexOf(")"),
                keyWordIndex = str.indexOf(" = ")
            value = str.substring(startIndex + 1, endIndex);
            colum = str.substring(0, keyWordIndex);
            valueArr = value.split(",");
            for (var i in valueArr) {
                params.push({
                    relation: "PropertyIsEqualTo",
                    propertyName: colum,
                    propertyValue: valueArr[i]
                })
            }
            filters.push(filter.append(params));
        }
    },
    _differentiateAnd: function (str, arr) {
        if (!arr)
            arr = [];
        var currentStr;
        if (str.indexOf(" and ") > 0) {
            var startIndex = 0,
                endIndex = str.indexOf(" and ");
            currentStr = str.substring(endIndex + 5);
            arr.push(str.substring(startIndex, endIndex));
            return this._differentiateAnd(currentStr, arr);
        } else {
            arr.push(str);
            return arr;
        }
    },
    /**
     * Represents this filter as GML node
     *
     * Returns:
     * {XmlElement} Gml representation of this filter
     */
    toGml: function () {
        return this.filter;
    },

    append: function () {
        return this;
    }
});


L.WFSQuery = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],
    options: {
        crs: L.CRS.EPSG3857,
        showExisting: true,
        geometryField: 'Shape',
        version: '1.1.0',
        typeNS: '',
        typeName: '',
        typeNSName: '',
        filter: {},
        isInnerTransform: false,
        fields: [],
        netSP: "http://www.baidu.com"
    },
    initialize: function (options, readFormat) {
        L.setOptions(this, options);
        this.options.typeNSName = this._namespaceName(this.options.typeName);
        this.options.srsName = this.options.crs.code;
        this.readFormat = readFormat || new L.Format.GeoJSON();

        if (!this.options.filter) {
            this.options.filter = new L.Filter();
        }
        if (this.options.isInnerTransform) {
            this.options.coordsToLatLng = function (coords) {
                var point = L.Util.transform.point25To2(coords[0], coords[1]);
                var latlng = new L.LatLng(point.y, point.x);
                return latlng;
            };
        }
        else {
            this.options.coordsToLatLng = new (function (projection) {
                var proj = projection;
                return function (coords) {
                    var point = L.point(coords[0], coords[1]);
                    return proj.unproject(point);
                }
            })(this.options.crs.projection);
        }
        return this;
    },
    get: function (url, callback, context) {
        this.post(url, L.XmlUtil.createXmlDocumentString(this._getFeature(this.options.filter)),
            function (a, data) {
                var layers = this.readFormat.responseToLayers({
                    rawData: data,
                    coordsToLatLng: this.options.coordsToLatLng,
                    options: this.options

                });
                callback.call(context, layers);
            }, this)
    },
    _namespaceName: function (name) {
        return this.options.typeNS + ':' + name;
    },
    _getFeature: function (filter) {
        var request = L.XmlUtil.createElementNS('wfs:GetFeature',
            {
                service: 'WFS',
                version: this.options.version,
                outputFormat: this.readFormat.outputFormat
            });

        var query = request.appendChild(L.XmlUtil.createElementNS('wfs:Query',
            {
                typeName: this.options.typeNSName,
                srsName: this.options.srsName
            }));

        for (var i in this.options.fields) {

            var field = L.XmlUtil.createElementNS('wfs:PropertyName');
            field.textContent = this.options.fields[i];
            query.appendChild(field);
        }


        if (filter && filter.toGml) {
            query.appendChild(filter.toGml());
        }

        return request;
    }

})




/**
 * Created by PRadostev on 06.02.2015.
 */

L.WFSTransaction = L.WFSQuery.extend({
    initialize: function (options, readFormat) {
        L.WFSQuery.prototype.initialize.call(this, options, readFormat);
        this.changes = {};
        var that = this;
        this.on('save:success', function () {
            that.changes = {};
        });
    },


    save: function (url, layer, action, callback, context) {
        var obj =  {
            service: 'WFS',
            version: this.options.version
        }
        obj["xmlns:" + this.options.typeNS] = this.options.netSP;
        var transaction = L.XmlUtil.createElementNS('wfs:Transaction', obj);

        var inserted = [];

        var taskStr = this[action](layer);
        transaction.appendChild(taskStr);

        var that = this;

        this.post(url, L.XmlUtil.createXmlDocumentString(transaction), function (a, data, c) {
            var insertResult = L.XmlUtil.evaluate('//wfs:InsertResults/wfs:Feature/ogc:FeatureId/@fid', data);
            var filter = new L.Filter.GmlObjectID();
            var id = insertResult.iterateNext();
            while (id) {
                filter.append(id.value);
                id = insertResult.iterateNext();
            }
            //
            inserted.forEach(function (layer) {
                L.FeatureGroup.prototype.removeLayer.call(that, layer);
            });

            this.once('load', function () {
                this.fire('save:success');
            });
            if (callback) {
                callback.call(context, data);
            }

        }, this, "xml")


        return this;
    }
});


/**
 * Created by PRadostev on 20.02.2015.
 */

L.WFSTransaction.include({
    gmlFeature: function (layer) {
        var featureNode = L.XmlUtil.createElementNS(this.options.typeNSName, {}, {uri: this.options.namespaceUri});
        var feature = layer.feature;
        for (var propertyName in feature.properties) {
            featureNode.appendChild(this.gmlProperty(propertyName,
                feature.properties[propertyName]));
        }

        featureNode.appendChild(this.gmlProperty(this.options.geometryField,
            layer.toGml(this.options.crs)));
        return featureNode;
    },

    gmlProperty: function (name, value) {
        var propertyNode = L.XmlUtil.createElementNS(this._namespaceName(name));
        if (value instanceof Element) {
            propertyNode.appendChild(value);
        }
        else {
            propertyNode.appendChild(L.XmlUtil.createTextNode(value || ''));
        }

        return propertyNode;
    },

    wfsProperty: function (name, value) {
        var propertyNode = L.XmlUtil.createElementNS('wfs:Property');
        propertyNode.appendChild(L.XmlUtil.createElementNS('wfs:Name', {}, {value: name}));
        var valueNode = L.XmlUtil.createElementNS('wfs:Value');
        if (value instanceof Element) {
            valueNode.appendChild(value);
        }
        else {
            valueNode.appendChild(L.XmlUtil.createTextNode(value || ''));
        }

        propertyNode.appendChild(valueNode);

        return propertyNode;
    }
});



/**
 * Created by PRadostev on 20.02.2015.
 */

L.WFSTransaction.include({

    insert: function (layer) {
        var node = L.XmlUtil.createElementNS('wfs:Insert');
        node.appendChild(this.gmlFeature(layer));
        return node;
    },

    update: function (layer) {
        var node = L.XmlUtil.createElementNS('wfs:Update', {typeName: this.options.typeNSName});
        //判断传入的是属性还是layer
        var feature = {}, isFeature = true, filter;
        if (layer.isfilter) {
            isFeature = false;
        } else {
            feature.properties = layer.properties;
            isFeature = true;
        }

        for (var propertyName in layer.feature.properties) {
            node.appendChild(this.wfsProperty(propertyName, layer.feature.properties[propertyName]));
        }
        if (layer.toGml) {
            node.appendChild(this.wfsProperty(this._namespaceName(this.options.geometryField),
                layer.toGml(this.options.crs)));
        }
        if (isFeature) {
            filter = new L.Filter.GmlObjectID().append(layer.feature.id);
        }
        else {
            filter = new L.Where({where: layer.where || null});
        }
        node.appendChild(filter.toGml());
        return node;
    },

    remove: function (filter) {
        var node = L.XmlUtil.createElementNS('wfs:Delete', {typeName: this.options.typeNSName});
        //   var filter = new L.Filter.GmlObjectID().append(layer.feature.id);
        node.appendChild(filter.toGml());
        return node;
    }
});


L.Projection.GCJ02 = L.extend({} , L.chinaProj,{
    project: function (latlng) { // (LatLng) -> Point
        if(L.Util.isArray(latlng)){
            var points = [];
            for (var i in latlng){
                var temPoint = this.gcj_To_Gps84(latlng[i].lat,latlng[i].lng)
                points.push(new L.Point(temPoint[1],temPoint[0]));
            }
            return points;
        }else{
            var temPoint = this.gcj_To_Gps84(latlng.lat,latlng.lng)
            var point = new L.Point(temPoint[1],temPoint[0]);
            return point;
        }

    },

    unproject: function (point) { // (Point, Boolean) -> LatLng
        var temLatlng = this.gps84_To_Gcj02(point.y,point.x);
        if(!temLatlng)
        return new L.LatLng(0,0);
        var latlng = new L.LatLng(temLatlng[0],temLatlng[1]);
        return latlng;
    }
});



/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.GCJ02 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:4326',
	projection: L.Projection.GCJ02,
	transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5)
});



L.Projection.BD09 = L.extend({} , L.chinaProj,{
    project: function (latlng) { // (LatLng) -> Point
        if(L.Util.isArray(latlng)){
            var points = [];
            for (var i in latlng){
                var temPoint = this.bd09_To_Gcj02(latlng[i].lat,latlng[i].lng)
                points.push(new L.Point(temPoint[1],temPoint[0]));
            }
            return points;
        }else{
            var temPoint = this.bd09_To_Gcj02(latlng.lat,latlng.lng)
            var point = new L.Point(temPoint[1],temPoint[0]);
            return point;
        }

    },
    unproject: function (point) { // (Point, Boolean) -> LatLng
        var temLatlng = this.gps84_To_Gcj02(point.y,point.x);
        var tem84 = this.gcj02_To_Bd09(temLatlng[0],temLatlng[1]);
        if(!tem84)
            return new L.LatLng(0,0);
        var latlng = new L.LatLng(tem84[0],tem84[1]);
        return latlng;
    }
});



L.CRS.UNKNOWN = new L.Proj.CRS('EPSG:900913',
    '+title=Google Mercator EPSG:900913 +proj=merc +ellps=WGS84 +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        }(),
        origin: [-293909.5, 205382.0]
    })

L.CRS.BAIDU = new L.Proj.CRS('EPSG:3395',
    '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = Math.pow(2, 18);
            for (var i = 1; i < level; i++) {
                res[i] = Math.pow(2, (18 - i))
            }
            return res;
        }(),
        origin: [0, 0],
        bounds: L.bounds([20037508.342789244, 0], [0, 20037508.342789244])
    })

L.CRS.YUNNAN = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        }(),
        origin: [-293909.5, 205382.0]
    })
L.CRS.UNKNOWN.innerTransform = {
    A :629486.1,
    B :850786,
    C :106392700,
    D :321586.1,
    E :380061.7,
    F :23949170,
    project: function (lat, lng) {
        var p = {};
        var xx = this.A * lat + this.B * lng - this.C;
        var yy = this.E * lng - this.D * lat + this.F;
        p.x = xx;
        p.y = yy;
        return p;
    },
    unproject: function (x, y) {
        var p = {};
        var xx = (this.E * x - this.B * y + this.F * this.B + this.E * this.C) / (this.A * this.E + this.B * this.D);
        var yy = (0 - this.D * x - this.A * y + this.A * this.F - this.C * this.D) / (0 - this.B * this.D - this.A * this.E);
        p.lng = xx;
        p.lat = yy;
        return p;
    }
}

L.CRS.EPSG3857LZ = new L.Proj.CRS('EPSG:3857',
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    {
        resolutions: function () {
            level = 21
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            res[12] = 38.21851414253662;
            res[13] = 19.10925707126831;
            res[14] = 9.554628535634155;
            res[15] = 4.77731426794937;
            res[16] = 2.388657133974685;
            res[17] = 1.1943285668550503;
            res[18] = 0.5291677250021167;
            res[19] = 0.26458386250105836;
            return res;
        }(),
        origin: [-20037508.342787, 20037508.342787],
        tileSize: 128
    })


L.CRS.YN = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: (function getRes(level) {
            var res = [];
            res[0] = 6.7336482437657602628525536448314;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        })(21),
        origin: [ 106.59, 26.71]
    })

L.CRS.XCAJ = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: (function getRes(level) {
            var res = [];
            res[0] = 2.8109902583977338974280435264985;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        })(8),
        origin: [116.38, 39.93]
    })




var EsriLeaflet = { //jshint ignore:line
  VERSION: '1.0.0-rc.7',
  Layers: {},
  Services: {},
  Controls: {},
  Tasks: {},
  Util: {},
  Support: {
    CORS: !!(window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()),
    pointerEvents: document.documentElement.style.pointerEvents === ''
  }
};

if(typeof window !== 'undefined' && window.L){
  window.L.esri = EsriLeaflet;
}



/*
 * 这个类是Esri写的，写的很不好，挺乱的，工具类不用说了全部方法都是静态的
 * @class  EsriLeaflet.Util
 * @private
 *
 * */
(function(EsriLeaflet){

  // normalize request animation frame
  var raf = window.requestAnimationFrame ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame ||
     window.msRequestAnimationFrame ||
     function(cb) { return window.setTimeout(cb, 1000 / 60); };

  // shallow object clone for feature properties and attributes
  // from http://jsperf.com/cloning-an-object/2
  function clone(obj) {
    var target = {};
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        target[i] = obj[i];
      }
    }
    return target;
  }

  // checks if 2 x,y points are equal
  function pointsEqual(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // checks if the first and last points of a ring are equal and closes the ring
  function closeRing(coordinates) {
    if (!pointsEqual(coordinates[0], coordinates[coordinates.length - 1])) {
      coordinates.push(coordinates[0]);
    }
    return coordinates;
  }

  // determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
  // or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
  // points-are-in-clockwise-order
  function ringIsClockwise(ringToTest) {
    var total = 0,i = 0;
    var rLength = ringToTest.length;
    var pt1 = ringToTest[i];
    var pt2;
    for (i; i < rLength - 1; i++) {
      pt2 = ringToTest[i + 1];
      total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
      pt1 = pt2;
    }
    return (total >= 0);
  }

  // ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L504-L519
  function vertexIntersectsVertex(a1, a2, b1, b2) {
    var uaT = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
    var ubT = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
    var uB  = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);

    if ( uB !== 0 ) {
      var ua = uaT / uB;
      var ub = ubT / uB;

      if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
        return true;
      }
    }

    return false;
  }

  // ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L521-L531
  function arrayIntersectsArray(a, b) {
    for (var i = 0; i < a.length - 1; i++) {
      for (var j = 0; j < b.length - 1; j++) {
        if (vertexIntersectsVertex(a[i], a[i + 1], b[j], b[j + 1])) {
          return true;
        }
      }
    }

    return false;
  }

  // ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L470-L480
  function coordinatesContainPoint(coordinates, point) {
    var contains = false;
    for(var i = -1, l = coordinates.length, j = l - 1; ++i < l; j = i) {
      if (((coordinates[i][1] <= point[1] && point[1] < coordinates[j][1]) ||
           (coordinates[j][1] <= point[1] && point[1] < coordinates[i][1])) &&
          (point[0] < (coordinates[j][0] - coordinates[i][0]) * (point[1] - coordinates[i][1]) / (coordinates[j][1] - coordinates[i][1]) + coordinates[i][0])) {
        contains = !contains;
      }
    }
    return contains;
  }

  // ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L106-L113
  function coordinatesContainCoordinates(outer, inner){
    var intersects = arrayIntersectsArray(outer, inner);
    var contains = coordinatesContainPoint(outer, inner[0]);
    if(!intersects && contains){
      return true;
    }
    return false;
  }

  // do any polygons in this array contain any other polygons in this array?
  // used for checking for holes in arcgis rings
  // ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L117-L172
  function convertRingsToGeoJSON(rings){
    var outerRings = [];
    var holes = [];
    var x; // iterator
    var outerRing; // current outer ring being evaluated
    var hole; // current hole being evaluated

    // for each ring
    for (var r = 0; r < rings.length; r++) {
      var ring = closeRing(rings[r].slice(0));
      if(ring.length < 4){
        continue;
      }
      // is this ring an outer ring? is it clockwise?
      if(ringIsClockwise(ring)){
        var polygon = [ ring ];
        outerRings.push(polygon); // push to outer rings
      } else {
        holes.push(ring); // counterclockwise push to holes
      }
    }

    var uncontainedHoles = [];

    // while there are holes left...
    while(holes.length){
      // pop a hole off out stack
      hole = holes.pop();

      // loop over all outer rings and see if they contain our hole.
      var contained = false;
      for (x = outerRings.length - 1; x >= 0; x--) {
        outerRing = outerRings[x][0];
        if(coordinatesContainCoordinates(outerRing, hole)){
          // the hole is contained push it into our polygon
          outerRings[x].push(hole);
          contained = true;
          break;
        }
      }

      // ring is not contained in any outer ring
      // sometimes this happens https://github.com/Esri/esri-leaflet/issues/320
      if(!contained){
        uncontainedHoles.push(hole);
      }
    }

    // if we couldn't match any holes using contains we can try intersects...
    while(uncontainedHoles.length){
      // pop a hole off out stack
      hole = uncontainedHoles.pop();

      // loop over all outer rings and see if any intersect our hole.
      var intersects = false;
      for (x = outerRings.length - 1; x >= 0; x--) {
        outerRing = outerRings[x][0];
        if(arrayIntersectsArray(outerRing, hole)){
          // the hole is contained push it into our polygon
          outerRings[x].push(hole);
          intersects = true;
          break;
        }
      }

      if(!intersects) {
        outerRings.push([hole.reverse()]);
      }
    }

    if(outerRings.length === 1){
      return {
        type: 'Polygon',
        coordinates: outerRings[0]
      };
    } else {
      return {
        type: 'MultiPolygon',
        coordinates: outerRings
      };
    }
  }

  // This function ensures that rings are oriented in the right directions
  // outer rings are clockwise, holes are counterclockwise
  // used for converting GeoJSON Polygons to ArcGIS Polygons
  function orientRings(poly){
    var output = [];
    var polygon = poly.slice(0);
    var outerRing = closeRing(polygon.shift().slice(0));
    if(outerRing.length >= 4){
      if(!ringIsClockwise(outerRing)){
        outerRing.reverse();
      }

      output.push(outerRing);

      for (var i = 0; i < polygon.length; i++) {
        var hole = closeRing(polygon[i].slice(0));
        if(hole.length >= 4){
          if(ringIsClockwise(hole)){
            hole.reverse();
          }
          output.push(hole);
        }
      }
    }

    return output;
  }

  // This function flattens holes in multipolygons to one array of polygons
  // used for converting GeoJSON Polygons to ArcGIS Polygons
  function flattenMultiPolygonRings(rings){
    var output = [];
    for (var i = 0; i < rings.length; i++) {
      var polygon = orientRings(rings[i]);
      for (var x = polygon.length - 1; x >= 0; x--) {
        var ring = polygon[x].slice(0);
        output.push(ring);
      }
    }
    return output;
  }

  // convert an extent (ArcGIS) to LatLngBounds (Leaflet)
  EsriLeaflet.Util.extentToBounds = function(extent){
    var sw = new L.LatLng(extent.ymin, extent.xmin);
    var ne = new L.LatLng(extent.ymax, extent.xmax);
    return new L.LatLngBounds(sw, ne);
  };

  // convert an LatLngBounds (Leaflet) to extent (ArcGIS)
  EsriLeaflet.Util.boundsToExtent = function(bounds) {
    bounds = L.latLngBounds(bounds);
    return {
      'xmin': bounds.getSouthWest().lng,
      'ymin': bounds.getSouthWest().lat,
      'xmax': bounds.getNorthEast().lng,
      'ymax': bounds.getNorthEast().lat,
      'spatialReference': {
        'wkid' : 4326
      }
    };
  };
/**
 * 将geometry专为json格式
 * @method arcgisToGeojson
 * @params {[Geometry]} arcgis 几何元素
 * @params {[Object]} idAttribute 怀疑应该是字段，可选参数
 * */
  EsriLeaflet.Util.arcgisToGeojson = function (arcgis, idAttribute){
    var geojson = {};

    if(typeof arcgis.x === 'number' && typeof arcgis.y === 'number'){
      geojson.type = 'Point';
      geojson.coordinates = [arcgis.x, arcgis.y];
    }

    if(arcgis.points){
      geojson.type = 'MultiPoint';
      geojson.coordinates = arcgis.points.slice(0);
    }

    if(arcgis.paths) {
      if(arcgis.paths.length === 1){
        geojson.type = 'LineString';
        geojson.coordinates = arcgis.paths[0].slice(0);
      } else {
        geojson.type = 'MultiLineString';
        geojson.coordinates = arcgis.paths.slice(0);
      }
    }

    if(arcgis.rings) {
      geojson = convertRingsToGeoJSON(arcgis.rings.slice(0));
    }

    if(arcgis.geometry || arcgis.attributes) {
      geojson.type = 'Feature';
      geojson.geometry = (arcgis.geometry) ? EsriLeaflet.Util.arcgisToGeojson(arcgis.geometry) : null;
      geojson.properties = (arcgis.attributes) ? clone(arcgis.attributes) : null;
      if(arcgis.attributes) {
        geojson.id =  arcgis.attributes[idAttribute] || arcgis.attributes.OBJECTID || arcgis.attributes.FID;
      }
    }

    return geojson;
  };

  // GeoJSON -> ArcGIS
  /**
   * 将json专为geometry格式
   * @method geojsonToArcGIS
   * @params {[String]} geojson 描述几何元素的json
   * @params {[Object]} idAttribute 怀疑应该是字段
   * */
  EsriLeaflet.Util.geojsonToArcGIS = function(geojson, idAttribute){
    idAttribute = idAttribute || 'OBJECTID';
    var spatialReference = { wkid: 4326 };
    var result = {};
    var i;

    switch(geojson.type){
    case 'Point':
      result.x = geojson.coordinates[0];
      result.y = geojson.coordinates[1];
      result.spatialReference = spatialReference;
      break;
    case 'MultiPoint':
      result.points = geojson.coordinates.slice(0);
      result.spatialReference = spatialReference;
      break;
    case 'LineString':
      result.paths = [geojson.coordinates.slice(0)];
      result.spatialReference = spatialReference;
      break;
    case 'MultiLineString':
      result.paths = geojson.coordinates.slice(0);
      result.spatialReference = spatialReference;
      break;
    case 'Polygon':
      result.rings = orientRings(geojson.coordinates.slice(0));
      result.spatialReference = spatialReference;
      break;
    case 'MultiPolygon':
      result.rings = flattenMultiPolygonRings(geojson.coordinates.slice(0));
      result.spatialReference = spatialReference;
      break;
    case 'Feature':
      if(geojson.geometry) {
        result.geometry = EsriLeaflet.Util.geojsonToArcGIS(geojson.geometry, idAttribute);
      }
      result.attributes = (geojson.properties) ? clone(geojson.properties) : {};
      if(geojson.id){
        result.attributes[idAttribute] = geojson.id;
      }
      break;
    case 'FeatureCollection':
      result = [];
      for (i = 0; i < geojson.features.length; i++){
        result.push(EsriLeaflet.Util.geojsonToArcGIS(geojson.features[i], idAttribute));
      }
      break;
    case 'GeometryCollection':
      result = [];
      for (i = 0; i < geojson.geometries.length; i++){
        result.push(EsriLeaflet.Util.geojsonToArcGIS(geojson.geometries[i], idAttribute));
      }
      break;
    }

    return result;
  };

  EsriLeaflet.Util.responseToFeatureCollection = function(response, idAttribute){
    var objectIdField;

    if(idAttribute){
      objectIdField = idAttribute;
    } else if(response.objectIdFieldName){
      objectIdField = response.objectIdFieldName;
    } else if(response.fields) {
      for (var j = 0; j <= response.fields.length - 1; j++) {
        if(response.fields[j].type === 'esriFieldTypeOID') {
          objectIdField = response.fields[j].name;
          break;
        }
      }
    } else {
      objectIdField = 'OBJECTID';
    }

    var featureCollection = {
      type: 'FeatureCollection',
      features: []
    };
    var features = response.features || response.results;
    if(features.length){
      for (var i = features.length - 1; i >= 0; i--) {
        featureCollection.features.push(EsriLeaflet.Util.arcgisToGeojson(features[i], objectIdField));
      }
    }

    return featureCollection;
  };

    // trim url whitespace and add a trailing slash if needed
  /**
   * 去除url中乱七八糟的符号
   * @method cleanUrl
   * @param {[String]} url
   * */
  EsriLeaflet.Util.cleanUrl = function(url){
    //trim leading and trailing spaces, but not spaces inside the url
    url = url.replace(/^\s+|\s+$|\A\s+|\s+\z/g, '');

    //add a trailing slash to the url if the user omitted it
    if(url[url.length-1] !== '/'){
      url += '/';
    }

    return url;
  };

  EsriLeaflet.Util.isArcgisOnline = function(url){
    /* hosted feature services can emit geojson natively.
    our check for 'geojson' support will need to be revisted
    once the functionality makes its way to ArcGIS Server*/
    return (/\.arcgis\.com.*?FeatureServer/g).test(url);
  };

  EsriLeaflet.Util.geojsonTypeToArcGIS = function (geoJsonType) {
    var arcgisGeometryType;
    switch (geoJsonType) {
    case 'Point':
      arcgisGeometryType = 'esriGeometryPoint';
      break;
    case 'MultiPoint':
      arcgisGeometryType = 'esriGeometryMultipoint';
      break;
    case 'LineString':
      arcgisGeometryType = 'esriGeometryPolyline';
      break;
    case 'MultiLineString':
      arcgisGeometryType = 'esriGeometryPolyline';
      break;
    case 'Polygon':
      arcgisGeometryType = 'esriGeometryPolygon';
      break;
    case 'MultiPolygon':
      arcgisGeometryType = 'esriGeometryPolygon';
      break;
    }
    return arcgisGeometryType;
  };

  EsriLeaflet.Util.requestAnimationFrame = L.Util.bind(raf, window);

})(EsriLeaflet);



(function(EsriLeaflet){

  var callbacks = 0;

  window._EsriLeafletCallbacks = {};

  function serialize(params){
    var data = '';

    params.f = params.f || 'json';

    for (var key in params){
      if(params.hasOwnProperty(key)){
        var param = params[key];
        var type = Object.prototype.toString.call(param);
        var value;

        if(data.length){
          data += '&';
        }

        if (type === '[object Array]'){
          value = (Object.prototype.toString.call(param[0]) === '[object Object]') ? JSON.stringify(param) : param.join(',');
        } else if (type === '[object Object]') {
          value = JSON.stringify(param);
        } else if (type === '[object Date]'){
          value = param.valueOf();
        } else {
          value = param;
        }

        data += encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }

    return data;
  }

  function createRequest(callback, context){
    var httpRequest = new XMLHttpRequest();

    httpRequest.onerror = function(e) {
      httpRequest.onreadystatechange = L.Util.falseFn;

      callback.call(context, {
        error: {
          code: 500,
          message: 'XMLHttpRequest error'
        }
      }, null);
    };

    httpRequest.onreadystatechange = function(){
      var response;
      var error;

      if (httpRequest.readyState === 4) {
        try {
          response = JSON.parse(httpRequest.responseText);
        } catch(e) {
          response = null;
          error = {
            code: 500,
            message: 'Could not parse response as JSON. This could also be caused by a CORS or XMLHttpRequest error.'
          };
        }

        if (!error && response.error) {
          error = response.error;
          response = null;
        }

        httpRequest.onerror = L.Util.falseFn;

        callback.call(context, error, response);
      }
    };

    return httpRequest;
  }


  // AJAX handlers for CORS (modern browsers) or JSONP (older browsers)
  EsriLeaflet.Request = {

    request: function(url, params, callback, context){
      var paramString = serialize(params);
      var httpRequest = createRequest(callback, context);
      var requestLength = (url + '?' + paramString).length;

      // request is less then 2000 characters and the browser supports CORS, make GET request with XMLHttpRequest
      if(requestLength <= 2000 && L.esri.Support.CORS){
        httpRequest.open('GET', url + '?' + paramString);
        httpRequest.send(null);

      // request is less more then 2000 characters and the browser supports CORS, make POST request with XMLHttpRequest
      } else if (requestLength > 2000 && L.esri.Support.CORS){
        httpRequest.open('POST', url);
        httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        httpRequest.send(paramString);

      // request is less more then 2000 characters and the browser does not support CORS, make a JSONP request
      } else if(requestLength <= 2000 && !L.esri.Support.CORS){
        return L.esri.Request.get.JSONP(url, params, callback, context);

      // request is longer then 2000 characters and the browser does not support CORS, log a warning
      } else {
        if(console && console.warn){
          console.warn('a request to ' + url + ' was longer then 2000 characters and this browser cannot make a cross-domain post request. Please use a proxy http://esri.github.io/esri-leaflet/api-reference/request.html');
          return;
        }
      }

      return httpRequest;
    },
    post: {
      XMLHTTP: function (url, params, callback, context) {
        var httpRequest = createRequest(callback, context);
        httpRequest.open('POST', url);
        httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        httpRequest.send(serialize(params));

        return httpRequest;
      }
    },

    get: {
      CORS: function (url, params, callback, context) {
        var httpRequest = createRequest(callback, context);

        httpRequest.open('GET', url + '?' + serialize(params), true);
        httpRequest.send(null);

        return httpRequest;
      },
      JSONP: function(url, params, callback, context){
        var callbackId = 'c' + callbacks;

        params.callback = 'window._EsriLeafletCallbacks.' + callbackId;

        var script = L.DomUtil.create('script', null, document.body);
        script.type = 'text/javascript';
        script.src = url + '?' +  serialize(params);
        script.id = callbackId;

        window._EsriLeafletCallbacks[callbackId] = function(response){
          if(window._EsriLeafletCallbacks[callbackId] !== true){
            var error;
            var responseType = Object.prototype.toString.call(response);

            if(!(responseType === '[object Object]' || responseType === '[object Array]')){
              error = {
                error: {
                  code: 500,
                  message: 'Expected array or object as JSONP response'
                }
              };
              response = null;
            }

            if (!error && response.error) {
              error = response;
              response = null;
            }

            callback.call(context, error, response);
            window._EsriLeafletCallbacks[callbackId] = true;
          }
        };

        callbacks++;

        return {
          id: callbackId,
          url: script.src,
          abort: function(){
            window._EsriLeafletCallbacks._callback[callbackId]({
              code: 0,
              message: 'Request aborted.'
            });
          }
        };
      }
    }
  };

  // choose the correct AJAX handler depending on CORS support
  EsriLeaflet.get = (EsriLeaflet.Support.CORS) ? EsriLeaflet.Request.get.CORS : EsriLeaflet.Request.get.JSONP;

  // always use XMLHttpRequest for posts
  EsriLeaflet.post = EsriLeaflet.Request.post.XMLHTTP;

  // expose a common request method the uses GET\POST based on request length
  EsriLeaflet.request = EsriLeaflet.Request.request;

})(EsriLeaflet);


EsriLeaflet.Services.Service = L.Class.extend({

  includes: L.Mixin.Events,

  options: {
    proxy: false,
    useCors: EsriLeaflet.Support.CORS
  },

  initialize: function (options) {
    options = options || {};
    this._requestQueue = [];
    this._authenticating = false;
    L.Util.setOptions(this, options);
    this.options.url = EsriLeaflet.Util.cleanUrl(this.options.url);
  },

  get: function (path, params, callback, context) {
    return this._request('get', path, params, callback, context);
  },

  post: function (path, params, callback, context) {
    return this._request('post', path, params, callback, context);
  },

  request: function (path, params, callback, context) {
    return this._request('request', path, params, callback, context);
  },

  metadata: function (callback, context) {
    return this._request('get', '', {}, callback, context);
  },

  authenticate: function(token){
    this._authenticating = false;
    this.options.token = token;
    this._runQueue();
    return this;
  },

  _request: function(method, path, params, callback, context){
    this.fire('requeststart', {
      url: this.options.url + path,
      params: params,
      method: method
    });

    var wrappedCallback = this._createServiceCallback(method, path, params, callback, context);

    if (this.options.token) {
      params.token = this.options.token;
    }

    if (this._authenticating) {
      this._requestQueue.push([method, path, params, callback, context]);
      return;
    } else {
      var url = (this.options.proxy) ? this.options.proxy + '?' + this.options.url + path : this.options.url + path;

      if((method === 'get' || method === 'request') && !this.options.useCors){
        return EsriLeaflet.Request.get.JSONP(url, params, wrappedCallback);
      } else {
        return EsriLeaflet[method](url, params, wrappedCallback);
      }
    }
  },

  _createServiceCallback: function(method, path, params, callback, context){
    var request = [method, path, params, callback, context];

    return L.Util.bind(function(error, response){

      if (error && (error.code === 499 || error.code === 498)) {
        this._authenticating = true;

        this._requestQueue.push(request);

        this.fire('authenticationrequired', {
          authenticate: L.Util.bind(this.authenticate, this)
        });
      } else {
        callback.call(context, error, response);

        if(error) {
          this.fire('requesterror', {
            url: this.options.url + path,
            params: params,
            message: error.message,
            code: error.code,
            method: method
          });
        } else {
          this.fire('requestsuccess', {
            url: this.options.url + path,
            params: params,
            response: response,
            method: method
          });
        }

        this.fire('requestend', {
          url: this.options.url + path,
          params: params,
          method: method
        });
      }
    }, this);
  },

  _runQueue: function(){
    for (var i = this._requestQueue.length - 1; i >= 0; i--) {
      var request = this._requestQueue[i];
      var method = request.shift();
      this[method].apply(this, request);
    }
    this._requestQueue = [];
  }

});

EsriLeaflet.Services.service = function(params){
  return new EsriLeaflet.Services.Service(params);
};


EsriLeaflet.Tasks.Task = L.Class.extend({

  options: {
    proxy: false,
    useCors: EsriLeaflet.Support.CORS
  },

  //Generate a method for each methodName:paramName in the setters for this task.
  generateSetter: function(param, context){
    return L.Util.bind(function(value){
      this.params[param] = value;
      return this;
    }, context);
  },

  initialize: function(endpoint){
    // endpoint can be either a url (and options) for an ArcGIS Rest Service or an instance of EsriLeaflet.Service
    if(endpoint.request && endpoint.options){
      this._service = endpoint;
      L.Util.setOptions(this, endpoint.options);
    } else {
      L.Util.setOptions(this, endpoint);
      this.options.url = L.esri.Util.cleanUrl(endpoint.url);
    }

    // clone default params into this object
    this.params = L.Util.extend({}, this.params || {});

    // generate setter methods based on the setters object implimented a child class
    if(this.setters){
      for (var setter in this.setters){
        var param = this.setters[setter];
        this[setter] = this.generateSetter(param, this);
      }
    }
  },

  token: function(token){
    if(this._service){
      this._service.authenticate(token);
    } else {
      this.params.token = token;
    }
    return this;
  },

  request: function(callback, context){
    if(this._service){
      return this._service.request(this.path, this.params, callback, context);
    } else {
      return this._request('request', this.path, this.params, callback, context);
    }
  },

  _request: function(method, path, params, callback, context){
    var url = (this.options.proxy) ? this.options.proxy + '?' + this.options.url + path : this.options.url + path;
    if((method === 'get' || method === 'request') && !this.options.useCors){
      return EsriLeaflet.Request.get.JSONP(url, params, callback, context);
    } else{
      return EsriLeaflet[method](url, params, callback, context);
    }
  }
});


/**
 *
 * CONTAIN: “CONTAIN”,

 *  CROSS: “CROSS”,

 * DISJOINT: “DISJOINT”,

 * IDENTITY: “IDENTITY”,

 * INTERSECT: “INTERSECT”,

 * NONE: “NONE”,

 * OVERLAP: “OVERLAP”,

 * TOUCH: “TOUCH”,

 * WITHIN: “WITHIN”.
 */
L.EsriQuery = EsriLeaflet.Tasks.Task.extend({
    includes: [L.Mixin.Events],

    options: {
        // url:"http://192.168.0.191:8091/iserver/services/map-DY/rest/maps/DY25/queryResults.jsonp",
    },

    setters: {
        'offset': 'offset',
        'limit': 'limit',
        'fields': 'outFields',
        'precision': 'geometryPrecision',
        'featureIds': 'objectIds',
        'returnGeometry': 'returnGeometry',
        'token': 'token'
    },

    path: 'query',

    params: {
        returnGeometry: true,
        where: '1=1',
        outSr: 4326,
        outFields: '*'
    },
    //条件参数
    within: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelContains'; // will make code read layer within geometry, to the api this will reads geometry contains layer
        return this;
    },

    intersects: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelIntersects';
        return this;
    },

    contains: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelWithin'; // will make code read layer contains geometry, to the api this will reads geometry within layer
        return this;
    },
    _cleanParams: function () {
        delete this.params.returnIdsOnly;
        delete this.params.returnExtentOnly;
        delete this.params.returnCountOnly;
    },

    // crosses: function(geometry){
    //   this._setGeometry(geometry);
    //   this.params.spatialRel = 'esriSpatialRelCrosses';
    //   return this;
    // },

    // touches: function(geometry){
    //   this._setGeometry(geometry);
    //   this.params.spatialRel = 'esriSpatialRelTouches';
    //   return this;
    // },

    overlaps: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelOverlaps';
        return this;
    },

    // only valid for Feature Services running on ArcGIS Server 10.3 or ArcGIS Online
    nearby: function (latlng, radius) {
        latlng = L.latLng(latlng);
        this.params.geometry = [latlng.lng, latlng.lat];
        this.params.geometryType = 'esriGeometryPoint';
        this.params.spatialRel = 'esriSpatialRelIntersects';
        this.params.units = 'esriSRUnit_Meter';
        this.params.distance = radius;
        this.params.inSr = 4326;
        return this;
    },

    where: function (string) {
        this.params.where = string.replace(/"/g, "\'"); // jshint ignore:line
        return this;
    },

    between: function (start, end) {
        this.params.time = [start.valueOf(), end.valueOf()];
        return this;
    },

    simplify: function (map, factor) {
        var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
        this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
        return this;
    },

    orderBy: function (fieldName, order) {
        order = order || 'ASC';
        this.params.orderByFields = (this.params.orderByFields) ? this.params.orderByFields + ',' : '';
        this.params.orderByFields += ([fieldName, order]).join(' ');
        return this;
    },

    _setGeometry: function (geometry) {
        this.params.inSr = 4326;

        // convert bounds to extent and finish
        if (geometry instanceof L.LatLngBounds) {
            // set geometry + geometryType
            this.params.geometry = EsriLeaflet.Util.boundsToExtent(geometry);
            this.params.geometryType = 'esriGeometryEnvelope';
            return;
        }

        // convert L.Marker > L.LatLng
        if (geometry.getLatLng) {
            geometry = geometry.getLatLng();
        }

        // convert L.LatLng to a geojson point and continue;
        if (geometry instanceof L.LatLng) {
            geometry = {
                type: 'Point',
                coordinates: [geometry.lng, geometry.lat]
            };
        }

        // handle L.GeoJSON, pull out the first geometry
        if (geometry instanceof L.GeoJSON) {
            //reassign geometry to the GeoJSON value  (we are assuming that only one feature is present)
            geometry = geometry.getLayers()[0].feature.geometry;
            this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
            this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
        }

        // Handle L.Polyline and L.Polygon
        if (geometry.toGeoJSON) {
            geometry = geometry.toGeoJSON();
        }

        // handle GeoJSON feature by pulling out the geometry
        if (geometry.type === 'Feature') {
            // get the geometry of the geojson feature
            geometry = geometry.geometry;
        }

        // confirm that our GeoJSON is a point, line or polygon
        if (geometry.type === 'Point' || geometry.type === 'LineString' || geometry.type === 'Polygon') {
            this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
            this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
            return;
        }

        // warn the user if we havn't found a
        /* global console */
        if (console && console.warn) {
            console.warn('invalid geometry passed to spatial query. Should be an L.LatLng, L.LatLngBounds or L.Marker or a GeoJSON Point Line or Polygon object');
        }

        return;
    },


    initialize: function (options) {

        options.url = L.esri.Util.cleanUrl(options.url);
        L.setOptions(this, options);

        // clone default params into this object
        this.params = L.Util.extend({}, this.params || {});

        // generate setter methods based on the setters object implimented a child class
        if(this.setters){
            for (var setter in this.setters){
                var param = this.setters[setter];
                this[setter] = this.generateSetter(param, this);
            }
        }

        return this;
    },

    _updateLayerGeometry: function (layer, geojson) {
        // convert the geojson coordinates into a Leaflet LatLng array/nested arrays
        // pass it to setLatLngs to update layer geometries
        var latlngs = [];
        var coordsToLatLng = this.options.coordsToLatLng || L.GeoJSON.coordsToLatLng;

        switch (geojson.geometry.type) {
            case 'LineString':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 0, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'MultiLineString':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'Polygon':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'MultiPolygon':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 2, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
        }
    },

    createNewLayer: function (geojson) {
        // @TODO Leaflet 0.8
        //newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
        return L.GeoJSON.geometryToLayer(geojson);
    },

    doQuery: function (callback, context) {
        this._cleanParams();

        // if the service is hosted on arcgis online request geojson directly
        if (EsriLeaflet.Util.isArcgisOnline(this.options.url)) {
            this.params.f = 'geojson';

            return this.request(function (error, response) {
                var features = response;
                featureGroup = new L.FeatureGroup();
                for (var i = 0; i < features.features.length; i++) {
                    //console.log(i);
                    //if (i == 87)
                    //    debugger;
                    if (!features.features[i].geometry)
                        continue;
                    if (features.features[i].geometry.coordinates) {
                        var geom = L.GeoJSON.geometryToLayer(features.features[i]);
                        if(!geom)
                            continue;
                        geom.feature.id = (geom.feature.properties.OBJECTID || geom.feature.properties.FID);
                        geom.addTo(featureGroup, "OBJECTID_" + (geom.feature.properties.OBJECTID || geom.feature.properties.FID));
                    }
                }
                callback.call(context, error, featureGroup, response);
            }, context);

            // otherwise convert it in the callback then pass it on
        } else {
            return this.request(function (error, response) {
                var features = EsriLeaflet.Util.responseToFeatureCollection(response),
                    featureGroup = new L.FeatureGroup();
                for (var i = 0; i < features.features.length; i++) {
                    var geom = L.GeoJSON.geometryToLayer(features.features[i]);
                    geom.feature.id = (geom.feature.properties.OBJECTID || geom.feature.properties.FID);
                    geom.addTo(featureGroup, "OBJECTID_" + (geom.feature.properties.OBJECTID || geom.feature.properties.FID));
                }
                callback.call(context, error, featureGroup, response);
            }, context);
        }
    }

})




L.EsriTransation = EsriLeaflet.Services.Service.extend({

    options: {
        idAttribute: 'OBJECTID'
    },


    addFeature: function (feature, callback, context) {
        delete feature.id;

        feature = EsriLeaflet.Util.geojsonToArcGIS(feature);

        return this.post('addFeatures', {
            features: [feature]
        }, function (error, response) {
            var result = (response && response.addResults) ? response.addResults[0] : undefined;
            if (callback) {
                callback.call(context, error || response.addResults[0].error, result);
            }
        }, context);
    },

    updateFeature: function (feature, callback, context) {
        feature = EsriLeaflet.Util.geojsonToArcGIS(feature, this.options.idAttribute);

        return this.post('updateFeatures', {
            features: [feature]
        }, function (error, response) {
            var result = (response && response.updateResults) ? response.updateResults[0] : undefined;
            if (callback) {
                callback.call(context, error || response.updateResults[0].error, result);
            }
        }, context);
    },

    deleteFeature: function (id, callback, context) {
        return this.post('deleteFeatures', {
            objectIds: id
        }, function (error, response) {
            var result = (response && response.deleteResults) ? response.deleteResults[0] : undefined;
            if (callback) {
                callback.call(context, error || response.deleteResults[0].error, result);
            }
        }, context);
    },

    deleteFeatures: function (ids, callback, context) {
        return this.post('deleteFeatures', {
            objectIds: ids
        }, function (error, response) {
            // pass back the entire array
            var result = (response && response.deleteResults) ? response.deleteResults : undefined;
            if (callback) {
                callback.call(context, error || response.deleteResults[0].error, result);
            }
        }, context);
    }
});

EsriLeaflet.Services.featureLayer = function (options) {
    return new EsriLeaflet.Services.FeatureLayer(options);
};


L.AnimatedMarker = L.Marker.extend({
    options: {
        // meters
        distance: 200,
        // ms
        interval: 1000,
        // animate on add?
        autoStart: true,
        // callback onend
        onEnd: function () {
        },
        clickable: false,
        //���·���������Ҫ����·��
        routeFeature: null
    },

    initialize: function (latlngs, options) {
        this.setLine(latlngs);
        L.Marker.prototype.initialize.call(this, latlngs[0], options);
    },

    // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
    // are not supported.
    _chunk: function (latlngs) {
        var i,
            len = latlngs.length,
            chunkedLatLngs = [];

        for (i = 1; i < len; i++) {
            var cur = latlngs[i - 1],
                next = latlngs[i],
                dist = cur.distanceTo(next),
                factor = this.options.distance / dist,
                dLat = factor * (next.lat - cur.lat),
                dLng = factor * (next.lng - cur.lng);

            if (dist > this.options.distance) {
                while (dist > this.options.distance) {
                    cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
                    dist = cur.distanceTo(next);
                    chunkedLatLngs.push(cur);
                }
            } else {
                chunkedLatLngs.push(cur);
            }
        }
        chunkedLatLngs.push(latlngs[len - 1]);

        return chunkedLatLngs;
    },

    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);

        // Start animating when added to the map
        if (this.options.autoStart) {
            this.start();
        }
    },

    animate: function (direction) {
        var self = this,
            len = this._latlngs.length,
            lastSpeed = this.options.interval,
            speed,
            points = [],
        //间隔个数
            intervalCount,
            direction = direction || "forward";

        // Normalize the transition speed from vertex to vertex
        if (direction == "back") {
            if (this._i >= 2) {
                var count = this._latlngs[this._i - 2].distanceTo(this._latlngs[this._i - 1]) / this.options.distance;
                intervalCount = Math.floor(count)
                var lastInterValPersent = count - intervalCount;
                speed = count * this.options.interval;

                var detaLng = (this._latlngs[this._i - 1].lng - this._latlngs[this._i - 2].lng) / intervalCount,
                    detaLat = (this._latlngs[this._i - 1].lat - this._latlngs[this._i - 2].lat) / intervalCount;
                for (var i = 0; i < intervalCount; i++) {
                    //这块没有写好大概已经完成######
                    var latlng = new L.latLng(this._latlngs[this._i - 1].lat - (i + 2) * detaLat, this._latlngs[this._i - 1].lng - (i + 2) * detaLng);
                    latlng.speed = this.options.interval * i;

                    points.push(latlng);
                    if (latlng)
                        new delegateBack(latlng);
                }

            }
        } else {
            if (this._i < len) {
                var count = this._latlngs[this._i - 1].distanceTo(this._latlngs[this._i]) / this.options.distance;
                intervalCount = Math.floor(count)
                var lastInterValPersent = count - intervalCount;
                speed = count * this.options.interval;

                lastSpeed = lastInterValPersent * this.options.interval;

                var detaLng = (this._latlngs[this._i].lng - this._latlngs[this._i - 1].lng) / intervalCount,
                    detaLat = (this._latlngs[this._i].lat - this._latlngs[this._i - 1].lat) / intervalCount;
                for (var i = 0; i < intervalCount; i++) {
                    //这块没有写好大概已经完成######
                    var latlng = new L.latLng(this._latlngs[this._i - 1].lat + i * detaLat, this._latlngs[this._i - 1].lng + i * detaLng);
                    latlng.speed = this.options.interval * i

                    points.push(latlng);
                    if (latlng)
                        new delegate(latlng);
                }
                var lastLatlng = new L.latLng(this._latlngs[this._i].lat, this._latlngs[this._i].lng);
                lastLatlng.speed = lastSpeed;
            }
        }


        function delegate(point) {
            setTimeout(function () {
                self.setLatLng(point);
                if (self.options.routeFeature)
                    self.options.routeFeature.addLatLng(point);
            }, point.speed)
        }

        function delegateBack(point) {
            setTimeout(function () {
                self.setLatLng(point);
                if (self.options.routeFeature)
                    self.options.routeFeature._spliceLatLngs((self.options.routeFeature.getLatLngs().length - 1), 1);
            }, point.speed)
        }

        if (direction == "back") {
            this._i--;
        } else {
            this._i++;
        }


        // Queue up the animation to the next next vertex
        this._tid = setTimeout(function () {
            if (self._i === len) {
                self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
            } else {
                self.animate(direction);
            }
        }, speed);
    },

    // Start the animation
    start: function (direction) {
        if (this.state && this.state == "start")
            return;
        this.state = "start";
        this.animate(direction);
    },

    // Stop the animation in place
    stop: function () {
        this.state = "stop";
        if (this._tid) {
            clearTimeout(this._tid);
        }
    },

    setLine: function (latlngs) {
        if (L.DomUtil.TRANSITION) {
            // No need to to check up the line if we can animate using CSS3
            this._latlngs = latlngs;
        } else {
            // Chunk up the lines into options.distance bits
            this._latlngs = this._chunk(latlngs);
            this.options.distance = 10;
            this.options.interval = 30;
        }
        this._i = 1;
    }

});

L.animatedMarker = function (latlngs, options) {
    return new L.AnimatedMarker(latlngs, options);
};



/*
 * L.Control.GeoSearch - search for an address and zoom to its location
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch = {};
L.GeoSearch.Provider = {};

L.GeoSearch.Result = function (x, y, label, bounds, details) {
    this.X = x;
    this.Y = y;
    this.Label = label;
    this.bounds = bounds;

    if (details)
        this.details = details;
};

L.Control.GeoSearch = L.Control.extend({
    options: {
        position: 'topcenter',
        showMarker: true,
        retainZoomLevel: false,
        draggable: false,
        isProjInMap: false,
        proj: null
    },

    _config: {
        country: '',
        searchLabel: '输入查询地址 ...',
        notFoundMessage: '对不起没有找到相关信息。',
        messageHideDelay: 3000,
        zoomLevel: 18
    },

    initialize: function (options) {
        L.Util.extend(this.options, options);
        L.Util.extend(this._config, options);
    },

    onAdd: function (map) {
        var $controlContainer = map._controlContainer,
            nodes = $controlContainer.childNodes,
            topCenter = false;

        for (var i = 0, len = nodes.length; i < len; i++) {
            var klass = nodes[i].className;
            if (/leaflet-top/.test(klass) && /leaflet-center/.test(klass)) {
                topCenter = true;
                break;
            }
        }

        if (!topCenter) {
            var tc = document.createElement('div');
            tc.className += 'leaflet-top leaflet-center';
            $controlContainer.appendChild(tc);
            map._controlCorners.topcenter = tc;
        }

        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-geosearch');

        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-geosearch-qry';
        searchbox.type = 'text';
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;

        var msgbox = document.createElement('div');
        msgbox.id = 'leaflet-control-geosearch-msg';
        msgbox.className = 'leaflet-control-geosearch-msg';
        this._msgbox = msgbox;

        var resultslist = document.createElement('ul');
        resultslist.id = 'leaflet-control-geosearch-results';
        this._resultslist = resultslist;

        this._msgbox.appendChild(this._resultslist);
        this._container.appendChild(this._searchbox);
        this._container.appendChild(this._msgbox);

        L.DomEvent
            .addListener(this._container, 'click', L.DomEvent.stop)
            .addListener(this._searchbox, 'keypress', this._onKeyUp, this)
            .addListener(this._searchbox, 'keyup', this._onKeyUp_, this);


        L.DomEvent.disableClickPropagation(this._container);

        return this._container;
    },

    geosearch: function (qry) {
        var that = this;
        try {
            var provider = this._config.provider;

            if (typeof provider.GetLocations == 'function') {
                var results = provider.GetLocations(qry, function (results) {
                    that._processResults(results);
                });
            }
            else {
                var url = provider.GetServiceUrl(qry);
                L.Request.get(url, "", provider.ParseJSON, this);
                // this.sendRequest(provider, url);
            }
        }
        catch (error) {
            this._printError(error);
        }
    },


    _processResults: function (results) {
        if (results.length > 0) {
            this._map.fireEvent('geosearch_foundlocations', {Locations: results});
            this._showLocation(results[0]);
        } else {
            this._printError(this._config.notFoundMessage);
        }
    },

    _showLocation: function (location) {
        if (this.options.showMarker == true) {
            var latlng;
            if (this.options.proj) {
                latlng = this.options.proj.project({lat: location.Y, lng: location.X});
                location.Y = latlng.y;
                location.X = latlng.x;
            }
            if (this.options.isProjInMap) {
                latlng = this._map.options.crs.projection.unproject({x: location.Y, y: location.X});
                location.X = latlng.lat;
                location.Y = latlng.lng
            }
            if (typeof this._positionMarker === 'undefined') {
                this._positionMarker = L.marker(
                    [location.Y, location.X],
                    {draggable: this.options.draggable}
                ).addTo(this._map._layers.drawLayer);
            }
            else {
                this._positionMarker.setLatLng([location.Y, location.X]);
            }
        }
        if (!this.options.retainZoomLevel && location.bounds && location.bounds.isValid()) {
            this._map.fitBounds(location.bounds);
        }
        else {
            this._map.setView([location.Y, location.X], this._getZoomLevel(), false);
        }

        this._map.fireEvent('geosearch_showlocation', {
            Location: location,
            Marker: this._positionMarker
        });
    },

    _printError: function (message) {
        var elem = this._resultslist;
        elem.innerHTML = '<li>' + message + '</li>';
        elem.style.display = 'block';

        this._map.fireEvent('geosearch_error', {message: message});

        setTimeout(function () {
            elem.style.display = 'none';
        }, 3000);
    },

    _printList: function (list) {
        var elem = this._resultslist;
        elem.innerHTML = "";
        for (var i in list) {
            var item = L.DomUtil.create("li", "list-item");
            item.innerText = list[i].name;
            item.data = list[i];
            elem.appendChild(item);
            L.DomEvent
                .addListener(item, 'click', this._selectComplete, this)
        }
        elem.style.display = 'block';
    },
    _selectComplete: function (e) {
        this._searchbox.value = e.currentTarget.innerText;
        this._resultslist.style.display = 'none';
        var locate = {Y: e.currentTarget.data.location.lat, X: e.currentTarget.data.location.lng};
        this._showLocation(locate);
    },
    _onKeyUp: function (e) {
        var esc = 27,
            enter = 13;

        if (e.keyCode === esc) { // escape key detection is unreliable
            this._searchbox.value = '';
            this._map._container.focus();
        } else if (e.keyCode === enter) {

        }
        //  e.preventDefault();

    },
    _onKeyUp_: function (e) {
        e.stopPropagation();
        if (this._searchbox.value)
            this.geosearch(this._searchbox.value);
        else {
            this._resultslist.style.display = 'none';
        }
    },

    _getZoomLevel: function () {
        if (!this.options.retainZoomLevel) {
            return this._config.zoomLevel;
        }
        return this._map.zoom;
    }

});



/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Bing uses bing geocoding service
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch.Provider.Bing = L.Class.extend({
    options: {
        proxy: "",
        key: "",
        region: ""
    },

    initialize: function (options) {
        options = L.Util.setOptions(this, options);
    },

    GetServiceUrl: function (qry) {
        var parameters = {
            query: qry,
            region: this.options.region || 131,
            output: 'json',
            ak: this.options.key || 'F429b1f174179ddf0a092d6843984d79'
        };
        return this.options.proxy + 'http://api.map.baidu.com/place/v2/suggestion'
            + L.Util.getParamString(parameters);
    },

    ParseJSON: function (fault, data) {
        /*  var results = [];
         for (var i in data.result) {
         results.push(data.result[i]);
         }*/
        this._printList(data.result);
        //  return results;
    }
});



/** @license
 *
 *  Copyright (C) 2012 K. Arthur Endsley (kaendsle@mtu.edu)
 *  Michigan Tech Research Institute (MTRI)
 *  3600 Green Court, Suite 100, Ann Arbor, MI, 48105
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function(root, factory) {

	if (typeof define === "function" && define.amd) {
		// AMD (+ global for extensions)
		define(function() {
			return factory();
		});
	} else if (typeof module !== 'undefined' && typeof exports === "object") {
		// CommonJS
		module.exports = factory();
	} else {
		// Browser
		root.Wkt = factory();
	}
}(this, function() {


	var beginsWith, endsWith, root, Wkt;

	// Establish the root object, window in the browser, or exports on the server
	root = this;

	/**
	 * @desc The Wkt namespace.
	 * @property    {String}    delimiter   - The default delimiter for separating components of atomic geometry (coordinates)
	 * @namespace
	 * @global
	 */
	Wkt = function(obj) {
		if (obj instanceof Wkt) return obj;
		if (!(this instanceof Wkt)) return new Wkt(obj);
		this._wrapped = obj;
	};



	/**
	 * Returns true if the substring is found at the beginning of the string.
	 * @param   str {String}    The String to search
	 * @param   sub {String}    The substring of interest
	 * @return      {Boolean}
	 * @private
	 */
	beginsWith = function(str, sub) {
		return str.substring(0, sub.length) === sub;
	};

	/**
	 * Returns true if the substring is found at the end of the string.
	 * @param   str {String}    The String to search
	 * @param   sub {String}    The substring of interest
	 * @return      {Boolean}
	 * @private
	 */
	endsWith = function(str, sub) {
		return str.substring(str.length - sub.length) === sub;
	};

	/**
	 * The default delimiter for separating components of atomic geometry (coordinates)
	 * @ignore
	 */
	Wkt.delimiter = ' ';

	/**
	 * Determines whether or not the passed Object is an Array.
	 * @param   obj {Object}    The Object in question
	 * @return      {Boolean}
	 * @member Wkt.isArray
	 * @method
	 */
	Wkt.isArray = function(obj) {
		return !!(obj && obj.constructor === Array);
	};

	/**
	 * Removes given character String(s) from a String.
	 * @param   str {String}    The String to search
	 * @param   sub {String}    The String character(s) to trim
	 * @return      {String}    The trimmed string
	 * @member Wkt.trim
	 * @method
	 */
	Wkt.trim = function(str, sub) {
		sub = sub || ' '; // Defaults to trimming spaces
		// Trim beginning spaces
		while (beginsWith(str, sub)) {
			str = str.substring(1);
		}
		// Trim ending spaces
		while (endsWith(str, sub)) {
			str = str.substring(0, str.length - 1);
		}
		return str;
	};

	/**
	 * An object for reading WKT strings and writing geographic features
	 * @constructor this.Wkt.Wkt
	 * @param   initializer {String}    An optional WKT string for immediate read
	 * @property            {Array}     components      - Holder for atomic geometry objects (internal representation of geometric components)
	 * @property            {String}    delimiter       - The default delimiter for separating components of atomic geometry (coordinates)
	 * @property            {Object}    regExes         - Some regular expressions copied from OpenLayers.Format.WKT.js
	 * @property            {String}    type            - The Well-Known Text name (e.g. 'point') of the geometry
	 * @property            {Boolean}   wrapVerticies   - True to wrap vertices in MULTIPOINT geometries; If true: MULTIPOINT((30 10),(10 30),(40 40)); If false: MULTIPOINT(30 10,10 30,40 40)
	 * @return              {this.Wkt.Wkt}
	 * @memberof Wkt
	 */
	Wkt.Wkt = function(initializer) {

		/**
		 * The default delimiter between X and Y coordinates.
		 * @ignore
		 */
		this.delimiter = Wkt.delimiter || ' ';

		/**
		 * Configuration parameter for controlling how Wicket seralizes
		 * MULTIPOINT strings. Examples; both are valid WKT:
		 * If true: MULTIPOINT((30 10),(10 30),(40 40))
		 * If false: MULTIPOINT(30 10,10 30,40 40)
		 * @ignore
		 */
		this.wrapVertices = true;

		/**
		 * Some regular expressions copied from OpenLayers.Format.WKT.js
		 * @ignore
		 */
		this.regExes = {
			'typeStr': /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
			'spaces': /\s+|\+/, // Matches the '+' or the empty space
			'numeric': /-*\d+(\.*\d+)?/,
			'comma': /\s*,\s*/,
			'parenComma': /\)\s*,\s*\(/,
			'coord': /-*\d+\.*\d+ -*\d+\.*\d+/, // e.g. "24 -14"
			'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,
			'trimParens': /^\s*\(?(.*?)\)?\s*$/,
			'ogcTypes': /^(multi)?(point|line|polygon|box)?(string)?$/i, // Captures e.g. "Multi","Line","String"
			'crudeJson': /^{.*"(type|coordinates|geometries|features)":.*}$/ // Attempts to recognize JSON strings
		};

		/**
		 * The internal representation of geometry--the "components" of geometry.
		 * @ignore
		 */
		this.components = undefined;

		// An initial WKT string may be provided
		if (initializer && typeof initializer === 'string') {
			this.read(initializer);
		} else if (initializer && typeof initializer !== undefined) {
			this.fromObject(initializer);
		}

	};



	/**
	 * Returns true if the internal geometry is a collection of geometries.
	 * @return  {Boolean}   Returns true when it is a collection
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.isCollection = function() {
		switch (this.type.slice(0, 5)) {
			case 'multi':
				// Trivial; any multi-geometry is a collection
				return true;
			case 'polyg':
				// Polygons with holes are "collections" of rings
				return true;
			default:
				// Any other geometry is not a collection
				return false;
		}
	};

	/**
	 * Compares two x,y coordinates for equality.
	 * @param   a   {Object}    An object with x and y properties
	 * @param   b   {Object}    An object with x and y properties
	 * @return      {Boolean}
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.sameCoords = function(a, b) {
		return (a.x === b.x && a.y === b.y);
	};

	/**
	 * Sets internal geometry (components) from framework geometry (e.g.
	 * Google Polygon objects or google.maps.Polygon).
	 * @param   obj {Object}    The framework-dependent geometry representation
	 * @return      {this.Wkt.Wkt}   The object itself
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.fromObject = function(obj) {
		var result;

		if (obj.hasOwnProperty('type') && obj.hasOwnProperty('coordinates')) {
			result = this.fromJson(obj);
		} else {
			result = this.deconstruct.call(this, obj);
		}

		this.components = result.components;
		this.isRectangle = result.isRectangle || false;
		this.type = result.type;
		return this;
	};

	/**
	 * Creates external geometry objects based on a plug-in framework's
	 * construction methods and available geometry classes.
	 * @param   config  {Object}    An optional framework-dependent properties specification
	 * @return          {Object}    The framework-dependent geometry representation
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.toObject = function(config) {
		var obj = this.construct[this.type].call(this, config);
		// Don't assign the "properties" property to an Array
		if (typeof obj === 'object' && !Wkt.isArray(obj)) {
			obj.properties = this.properties;
		}
		return obj;
	};

	/**
	 * Returns the WKT string representation; the same as the write() method.
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.toString = function(config) {
		return this.write();
	};

	/**
	 * Parses a JSON representation as an Object.
	 * @param	obj	{Object}	An Object with the GeoJSON schema
	 * @return	{this.Wkt.Wkt}	The object itself
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.fromJson = function(obj) {
		var i, j, k, coords, iring, oring;

		this.type = obj.type.toLowerCase();
		this.components = [];
		if (obj.hasOwnProperty('geometry')) { //Feature
			this.fromJson(obj.geometry);
			this.properties = obj.properties;
			return this;
		}
		coords = obj.coordinates;

		if (!Wkt.isArray(coords[0])) { // Point
			this.components.push({
				x: coords[0],
				y: coords[1]
			});

		} else {

			for (i in coords) {
				if (coords.hasOwnProperty(i)) {

					if (!Wkt.isArray(coords[i][0])) { // LineString

						if (this.type === 'multipoint') { // MultiPoint
							this.components.push([{
								x: coords[i][0],
								y: coords[i][1]
							}]);

						} else {
							this.components.push({
								x: coords[i][0],
								y: coords[i][1]
							});

						}

					} else {

						oring = [];
						for (j in coords[i]) {
							if (coords[i].hasOwnProperty(j)) {

								if (!Wkt.isArray(coords[i][j][0])) {
									oring.push({
										x: coords[i][j][0],
										y: coords[i][j][1]
									});

								} else {

									iring = [];
									for (k in coords[i][j]) {
										if (coords[i][j].hasOwnProperty(k)) {

											iring.push({
												x: coords[i][j][k][0],
												y: coords[i][j][k][1]
											});

										}
									}

									oring.push(iring);

								}

							}
						}

						this.components.push(oring);
					}
				}
			}

		}

		return this;
	};

	/**
	 * Creates a JSON representation, with the GeoJSON schema, of the geometry.
	 * @return    {Object}    The corresponding GeoJSON representation
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.toJson = function() {
		var cs, json, i, j, k, ring, rings;

		cs = this.components;
		json = {
			coordinates: [],
			type: (function() {
				var i, type, s;

				type = this.regExes.ogcTypes.exec(this.type).slice(1);
				s = [];

				for (i in type) {
					if (type.hasOwnProperty(i)) {
						if (type[i] !== undefined) {
							s.push(type[i].toLowerCase().slice(0, 1).toUpperCase() + type[i].toLowerCase().slice(1));
						}
					}
				}

				return s;
			}.call(this)).join('')
		}

		// Wkt BOX type gets a special bbox property in GeoJSON
		if (this.type.toLowerCase() === 'box') {
			json.type = 'Polygon';
			json.bbox = [];

			for (i in cs) {
				if (cs.hasOwnProperty(i)) {
					json.bbox = json.bbox.concat([cs[i].x, cs[i].y]);
				}
			}

			json.coordinates = [
				[
					[cs[0].x, cs[0].y],
					[cs[0].x, cs[1].y],
					[cs[1].x, cs[1].y],
					[cs[1].x, cs[0].y],
					[cs[0].x, cs[0].y]
				]
			];

			return json;
		}

		// For the coordinates of most simple features
		for (i in cs) {
			if (cs.hasOwnProperty(i)) {

				// For those nested structures
				if (Wkt.isArray(cs[i])) {
					rings = [];

					for (j in cs[i]) {
						if (cs[i].hasOwnProperty(j)) {

							if (Wkt.isArray(cs[i][j])) { // MULTIPOLYGONS
								ring = [];

								for (k in cs[i][j]) {
									if (cs[i][j].hasOwnProperty(k)) {
										ring.push([cs[i][j][k].x, cs[i][j][k].y]);
									}
								}

								rings.push(ring);

							} else { // POLYGONS and MULTILINESTRINGS

								if (cs[i].length > 1) {
									rings.push([cs[i][j].x, cs[i][j].y]);

								} else { // MULTIPOINTS
									rings = rings.concat([cs[i][j].x, cs[i][j].y]);
								}
							}
						}
					}

					json.coordinates.push(rings);

				} else {
					if (cs.length > 1) { // For LINESTRING type
						json.coordinates.push([cs[i].x, cs[i].y]);

					} else { // For POINT type
						json.coordinates = json.coordinates.concat([cs[i].x, cs[i].y]);
					}
				}

			}
		}

		return json;
	};

	/**
	 * Absorbs the geometry of another this.Wkt.Wkt instance, merging it with its own,
	 * creating a collection (MULTI-geometry) based on their types, which must agree.
	 * For example, creates a MULTIPOLYGON from a POLYGON type merged with another
	 * POLYGON type, or adds a POLYGON instance to a MULTIPOLYGON instance.
	 * @param   wkt {String}    A Wkt.Wkt object
	 * @return	{this.Wkt.Wkt}	The object itself
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.merge = function(wkt) {
		var prefix = this.type.slice(0, 5);

		if (this.type !== wkt.type) {
			if (this.type.slice(5, this.type.length) !== wkt.type) {
				throw TypeError('The input geometry types must agree or the calling this.Wkt.Wkt instance must be a multigeometry of the other');
			}
		}

		switch (prefix) {

			case 'point':
				this.components = [this.components.concat(wkt.components)];
				break;

			case 'multi':
				this.components = this.components.concat((wkt.type.slice(0, 5) === 'multi') ? wkt.components : [wkt.components]);
				break;

			default:
				this.components = [
					this.components,
					wkt.components
				];
				break;

		}

		if (prefix !== 'multi') {
			this.type = 'multi' + this.type;
		}
		return this;
	};

	/**
	 * Reads a WKT string, validating and incorporating it.
	 * @param   str {String}    A WKT or GeoJSON string
	 * @return	{this.Wkt.Wkt}	The object itself
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.read = function(str) {
		var matches;
		matches = this.regExes.typeStr.exec(str);
		if (matches) {
			this.type = matches[1].toLowerCase();
			this.base = matches[2];
			if (this.ingest[this.type]) {
				this.components = this.ingest[this.type].apply(this, [this.base]);
			}

		} else {
			if (this.regExes.crudeJson.test(str)) {
				if (typeof JSON === 'object' && typeof JSON.parse === 'function') {
					this.fromJson(JSON.parse(str));

				} else {
					console.log('JSON.parse() is not available; cannot parse GeoJSON strings');
					throw {
						name: 'JSONError',
						message: 'JSON.parse() is not available; cannot parse GeoJSON strings'
					};
				}

			} else {
				console.log('Invalid WKT string provided to read()');
				throw {
					name: 'WKTError',
					message: 'Invalid WKT string provided to read()'
				};
			}
		}

		return this;
	}; // eo readWkt

	/**
	 * Writes a WKT string.
	 * @param   components  {Array}     An Array of internal geometry objects
	 * @return              {String}    The corresponding WKT representation
	 * @memberof this.Wkt.Wkt
	 * @method
	 */
	Wkt.Wkt.prototype.write = function(components) {
		var i, pieces, data;

		components = components || this.components;

		pieces = [];

		pieces.push(this.type.toUpperCase() + '(');

		for (i = 0; i < components.length; i += 1) {
			if (this.isCollection() && i > 0) {
				pieces.push(',');
			}

			// There should be an extract function for the named type
			if (!this.extract[this.type]) {
				return null;
			}

			data = this.extract[this.type].apply(this, [components[i]]);
			if (this.isCollection() && this.type !== 'multipoint') {
				pieces.push('(' + data + ')');

			} else {
				pieces.push(data);

				// If not at the end of the components, add a comma
				if (i !== (components.length - 1) && this.type !== 'multipoint') {
					pieces.push(',');
				}

			}
		}

		pieces.push(')');

		return pieces.join('');
	};

	/**
	 * This object contains functions as property names that extract WKT
	 * strings from the internal representation.
	 * @memberof this.Wkt.Wkt
	 * @namespace this.Wkt.Wkt.extract
	 * @instance
	 */
	Wkt.Wkt.prototype.extract = {
		/**
		 * Return a WKT string representing atomic (point) geometry
		 * @param   point   {Object}    An object with x and y properties
		 * @return          {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		point: function(point) {
			return String(point.x) + this.delimiter + String(point.y);
		},

		/**
		 * Return a WKT string representing multiple atoms (points)
		 * @param   multipoint  {Array}     Multiple x-and-y objects
		 * @return              {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		multipoint: function(multipoint) {
			var i, parts = [],
				s;

			for (i = 0; i < multipoint.length; i += 1) {
				s = this.extract.point.apply(this, [multipoint[i]]);

				if (this.wrapVertices) {
					s = '(' + s + ')';
				}

				parts.push(s);
			}

			return parts.join(',');
		},

		/**
		 * Return a WKT string representing a chain (linestring) of atoms
		 * @param   linestring  {Array}     Multiple x-and-y objects
		 * @return              {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		linestring: function(linestring) {
			// Extraction of linestrings is the same as for points
			return this.extract.point.apply(this, [linestring]);
		},

		/**
		 * Return a WKT string representing multiple chains (multilinestring) of atoms
		 * @param   multilinestring {Array}     Multiple of multiple x-and-y objects
		 * @return                  {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		multilinestring: function(multilinestring) {
			var i, parts = [];

			for (i = 0; i < multilinestring.length; i += 1) {
				parts.push(this.extract.linestring.apply(this, [multilinestring[i]]));
			}

			return parts.join(',');
		},

		/**
		 * Return a WKT string representing multiple atoms in closed series (polygon)
		 * @param   polygon {Array}     Collection of ordered x-and-y objects
		 * @return          {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		polygon: function(polygon) {
			// Extraction of polygons is the same as for multilinestrings
			return this.extract.multilinestring.apply(this, [polygon]);
		},

		/**
		 * Return a WKT string representing multiple closed series (multipolygons) of multiple atoms
		 * @param   multipolygon    {Array}     Collection of ordered x-and-y objects
		 * @return                  {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		multipolygon: function(multipolygon) {
			var i, parts = [];
			for (i = 0; i < multipolygon.length; i += 1) {
				parts.push('(' + this.extract.polygon.apply(this, [multipolygon[i]]) + ')');
			}
			return parts.join(',');
		},

		/**
		 * Return a WKT string representing a 2DBox
		 * @param   multipolygon    {Array}     Collection of ordered x-and-y objects
		 * @return                  {String}    The WKT representation
		 * @memberof this.Wkt.Wkt.extract
		 * @instance
		 */
		box: function(box) {
			return this.extract.linestring.apply(this, [box]);
		},

		geometrycollection: function(str) {
			console.log('The geometrycollection WKT type is not yet supported.');
		}
	};

	/**
	 * This object contains functions as property names that ingest WKT
	 * strings into the internal representation.
	 * @memberof this.Wkt.Wkt
	 * @namespace this.Wkt.Wkt.ingest
	 * @instance
	 */
	Wkt.Wkt.prototype.ingest = {

		/**
		 * Return point feature given a point WKT fragment.
		 * @param   str {String}    A WKT fragment representing the point
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		point: function(str) {
			var coords = Wkt.trim(str).split(this.regExes.spaces);
			// In case a parenthetical group of coordinates is passed...
			return [{ // ...Search for numeric substrings
				x: parseFloat(this.regExes.numeric.exec(coords[0])[0]),
				y: parseFloat(this.regExes.numeric.exec(coords[1])[0])
			}];
		},

		/**
		 * Return a multipoint feature given a multipoint WKT fragment.
		 * @param   str {String}    A WKT fragment representing the multipoint
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		multipoint: function(str) {
			var i, components, points;
			components = [];
			points = Wkt.trim(str).split(this.regExes.comma);
			for (i = 0; i < points.length; i += 1) {
				components.push(this.ingest.point.apply(this, [points[i]]));
			}
			return components;
		},

		/**
		 * Return a linestring feature given a linestring WKT fragment.
		 * @param   str {String}    A WKT fragment representing the linestring
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		linestring: function(str) {
			var i, multipoints, components;

			// In our x-and-y representation of components, parsing
			//  multipoints is the same as parsing linestrings
			multipoints = this.ingest.multipoint.apply(this, [str]);

			// However, the points need to be joined
			components = [];
			for (i = 0; i < multipoints.length; i += 1) {
				components = components.concat(multipoints[i]);
			}
			return components;
		},

		/**
		 * Return a multilinestring feature given a multilinestring WKT fragment.
		 * @param   str {String}    A WKT fragment representing the multilinestring
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		multilinestring: function(str) {
			var i, components, line, lines;
			components = [];

			lines = Wkt.trim(str).split(this.regExes.doubleParenComma);
			if (lines.length === 1) { // If that didn't work...
				lines = Wkt.trim(str).split(this.regExes.parenComma);
			}

			for (i = 0; i < lines.length; i += 1) {
				line = lines[i].replace(this.regExes.trimParens, '$1');
				components.push(this.ingest.linestring.apply(this, [line]));
			}

			return components;
		},

		/**
		 * Return a polygon feature given a polygon WKT fragment.
		 * @param   str {String}    A WKT fragment representing the polygon
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		polygon: function(str) {
			var i, j, components, subcomponents, ring, rings;
			rings = Wkt.trim(str).split(this.regExes.parenComma);
			components = []; // Holds one or more rings
			for (i = 0; i < rings.length; i += 1) {
				ring = rings[i].replace(this.regExes.trimParens, '$1').split(this.regExes.comma);
				subcomponents = []; // Holds the outer ring and any inner rings (holes)
				for (j = 0; j < ring.length; j += 1) {
					// Split on the empty space or '+' character (between coordinates)
					var split = ring[j].split(this.regExes.spaces);
					if (split.length > 2) {
						//remove the elements which are blanks
						split = split.filter(function(n) {
							return n != ""
						});
					}
					if (split.length === 2) {
						var x_cord = split[0];
						var y_cord = split[1];

						//now push
						subcomponents.push({
							x: parseFloat(x_cord),
							y: parseFloat(y_cord)
						});
					}
				}
				components.push(subcomponents);
			}
			return components;
		},

		/**
		 * Return box vertices (which would become the Rectangle bounds) given a Box WKT fragment.
		 * @param   str {String}    A WKT fragment representing the box
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		box: function(str) {
			var i, multipoints, components;

			// In our x-and-y representation of components, parsing
			//  multipoints is the same as parsing linestrings
			multipoints = this.ingest.multipoint.apply(this, [str]);

			// However, the points need to be joined
			components = [];
			for (i = 0; i < multipoints.length; i += 1) {
				components = components.concat(multipoints[i]);
			}

			return components;
		},

		/**
		 * Return a multipolygon feature given a multipolygon WKT fragment.
		 * @param   str {String}    A WKT fragment representing the multipolygon
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		multipolygon: function(str) {
			var i, components, polygon, polygons;
			components = [];
			polygons = Wkt.trim(str).split(this.regExes.doubleParenComma);
			for (i = 0; i < polygons.length; i += 1) {
				polygon = polygons[i].replace(this.regExes.trimParens, '$1');
				components.push(this.ingest.polygon.apply(this, [polygon]));
			}
			return components;
		},

		/**
		 * Return an array of features given a geometrycollection WKT fragment.
		 * @param   str {String}    A WKT fragment representing the geometry collection
		 * @memberof this.Wkt.Wkt.ingest
		 * @instance
		 */
		geometrycollection: function(str) {
			console.log('The geometrycollection WKT type is not yet supported.');
		}

	}; // eo ingest

	return Wkt;
}));


/** @license
 *
 *  Copyright (C) 2012 K. Arthur Endsley (kaendsle@mtu.edu)
 *  Michigan Tech Research Institute (MTRI)
 *  3600 Green Court, Suite 100, Ann Arbor, MI, 48105
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @augments Wkt.Wkt
 * A framework-dependent flag, set for each Wkt.Wkt() instance, that indicates
 * whether or not a closed polygon geometry should be interpreted as a rectangle.
 */
Wkt.Wkt.prototype.isRectangle = false;

/**
 * @augments Wkt.Wkt
 * Truncates an Array of coordinates by the closing coordinate when it is
 * equal to the first coordinate given--this is only to be used for closed
 * geometries in order to provide merely an "implied" closure to Leaflet.
 * @param   coords  {Array}     An Array of x,y coordinates (objects)
 * @return          {Array}
 */
Wkt.Wkt.prototype.trunc = function (coords) {
    var i, verts = [];

    for (i = 0; i < coords.length; i += 1) {
        if (Wkt.isArray(coords[i])) {
            verts.push(this.trunc(coords[i]));

        } else {

            // Add the first coord, but skip the last if it is identical
            if (i === 0 || !this.sameCoords(coords[0], coords[i])) {
                verts.push(coords[i]);
            }
        }
    }

    return verts;
};

/**
 * @augments Wkt.Wkt
 * An object of framework-dependent construction methods used to generate
 * objects belonging to the various geometry classes of the framework.
 */
Wkt.Wkt.prototype.construct = {
    /**
     * Creates the framework's equivalent point geometry object.
     * @param   config      {Object}    An optional properties hash the object should use
     * @param   component   {Object}    An optional component to build from
     * @return              {L.marker}
     */
    point: function (config, component) {
        var coord = component || this.components;
        if (coord instanceof Array) {
            coord = coord[0];
        }

        return L.marker(this.coordsToLatLng(coord), config);
    },

    /**
     * Creates the framework's equivalent multipoint geometry object.
     * @param   config  {Object}    An optional properties hash the object should use
     * @return          {L.featureGroup}
     */
    multipoint: function (config) {
        var i,
            layers = [],
            coords = this.components;

        for (i = 0; i < coords.length; i += 1) {
            layers.push(this.construct.point.call(this, config, coords[i]));
        }

        return L.featureGroup(layers, config);
    },

    /**
     * Creates the framework's equivalent linestring geometry object.
     * @param   config      {Object}    An optional properties hash the object should use
     * @param   component   {Object}    An optional component to build from
     * @return              {L.polyline}
     */
    linestring: function (config, component) {
        var coords = component || this.components,
            latlngs = this.coordsToLatLngs(coords);

        return L.polyline(latlngs, config);
    },

    /**
     * Creates the framework's equivalent multilinestring geometry object.
     * @param   config  {Object}    An optional properties hash the object should use
     * @return          {L.multiPolyline}
     */
    multilinestring: function (config) {
        var coords = this.components,
            latlngs = this.coordsToLatLngs(coords, 1);

        return L.multiPolyline(latlngs, config);
    },

    /**
     * Creates the framework's equivalent polygon geometry object.
     * @param   config      {Object}    An optional properties hash the object should use
     * @return              {L.multiPolygon}
     */
    polygon: function (config) {
        // Truncate the coordinates to remove the closing coordinate
        var coords = this.trunc(this.components),
            latlngs = this.coordsToLatLngs(coords, 1);
        return L.polygon(latlngs, config);
    },

    /**
     * Creates the framework's equivalent multipolygon geometry object.
     * @param   config  {Object}    An optional properties hash the object should use
     * @return          {L.multiPolygon}
     */
    multipolygon: function (config) {
        // Truncate the coordinates to remove the closing coordinate
        var coords = this.trunc(this.components),
            latlngs = this.coordsToLatLngs(coords, 2);

        return new L.Polygon(latlngs, config);
    },

    /**
     * Creates the framework's equivalent collection of geometry objects.
     * @param   config  {Object}    An optional properties hash the object should use
     * @return          {L.featureGroup}
     */
    geometrycollection: function (config) {
        var comps, i, layers;

        comps = this.trunc(this.components);
        layers = [];
        for (i = 0; i < this.components.length; i += 1) {
            layers.push(this.construct[comps[i].type].call(this, comps[i]));
        }

        return L.featureGroup(layers, config);

    }
};

L.Util.extend(Wkt.Wkt.prototype, {
    coordsToLatLngs: L.GeoJSON.coordsToLatLngs,
    // TODO Why doesn't the coordsToLatLng function in L.GeoJSON already suffice?
    coordsToLatLng: function (coords, reverse) {
        var lat = reverse ? coords.x : coords.y,
            lng = reverse ? coords.y : coords.x;

        return L.latLng(lat, lng, true);
    }
});

/**
 * @augments Wkt.Wkt
 * A framework-dependent deconstruction method used to generate internal
 * geometric representations from instances of framework geometry. This method
 * uses object detection to attempt to classify members of framework geometry
 * classes into the standard WKT types.
 * @param   obj {Object}    An instance of one of the framework's geometry classes
 * @return      {Object}    A hash of the 'type' and 'components' thus derived
 */
Wkt.Wkt.prototype.deconstruct = function (obj) {
    var attr, coordsFromLatLngs, features, i, verts, rings, tmp;

    /**
     * Accepts an Array (arr) of LatLngs from which it extracts each one as a
     *  vertex; calls itself recursively to deal with nested Arrays.
     */
    coordsFromLatLngs = function (arr) {
        var i, coords;

        coords = [];
        for (i = 0; i < arr.length; i += 1) {
            if (Wkt.isArray(arr[i])) {
                coords.push(coordsFromLatLngs(arr[i]));

            } else {
                coords.push({
                    x: arr[i].lng,
                    y: arr[i].lat
                });
            }
        }

        return coords;
    };

    // L.Marker ////////////////////////////////////////////////////////////////
    if (obj.constructor === L.Marker || obj.constructor === L.marker) {
        return {
            type: 'point',
            components: [{
                x: obj.getLatLng().lng,
                y: obj.getLatLng().lat
            }]
        };
    }

    // L.Rectangle /////////////////////////////////////////////////////////////
    if (obj.constructor === L.Rectangle || obj.constructor === L.rectangle) {
        tmp = obj.getBounds(); // L.LatLngBounds instance
        return {
            type: 'polygon',
            isRectangle: true,
            components: [
                [
                    { // NW corner
                        x: tmp.getSouthWest().lng,
                        y: tmp.getNorthEast().lat
                    },
                    { // NE corner
                        x: tmp.getNorthEast().lng,
                        y: tmp.getNorthEast().lat
                    },
                    { // SE corner
                        x: tmp.getNorthEast().lng,
                        y: tmp.getSouthWest().lat
                    },
                    { // SW corner
                        x: tmp.getSouthWest().lng,
                        y: tmp.getSouthWest().lat
                    },
                    { // NW corner (again, for closure)
                        x: tmp.getSouthWest().lng,
                        y: tmp.getNorthEast().lat
                    }
                ]
            ]
        };

    }

    // L.Polyline //////////////////////////////////////////////////////////////
    if (obj.constructor === L.Polyline || obj.constructor === L.polyline) {
        verts = [];
        tmp = obj.getLatLngs();

        if (!tmp[0].equals(tmp[tmp.length - 1])) {

            for (i = 0; i < tmp.length; i += 1) {
                verts.push({
                    x: tmp[i].lng,
                    y: tmp[i].lat
                });
            }

            return {
                type: 'linestring',
                components: verts
            };

        }
    }

    // L.Polygon ///////////////////////////////////////////////////////////////

    if (obj.constructor === L.Polygon || obj.constructor === L.polygon) {
        rings = [];
        verts = [];
        tmp = obj.getLatLngs();

        // First, we deal with the boundary points
        for (i = 0; i < obj._latlngs.length; i += 1) {
            verts.push({ // Add the first coordinate again for closure
                x: tmp[i].lng,
                y: tmp[i].lat
            });
        }

        verts.push({ // Add the first coordinate again for closure
            x: tmp[0].lng,
            y: tmp[0].lat
        });

        rings.push(verts);

        // Now, any holes
        if (obj._holes && obj._holes.length > 0) {
            // Reworked to support holes properly
            verts = coordsFromLatLngs(obj._holes);
            for (i=0; i < verts.length;i++) {
                verts[i].push(verts[i][0]); // Copy the beginning coords again for closure
                rings.push(verts[i]);
            }
        }

        return {
            type: 'polygon',
            components: rings
        };

    }

    // L.MultiPolyline /////////////////////////////////////////////////////////
    // L.MultiPolygon //////////////////////////////////////////////////////////
    // L.LayerGroup ////////////////////////////////////////////////////////////
    // L.FeatureGroup //////////////////////////////////////////////////////////
    if (obj.constructor === L.MultiPolyline || obj.constructor === L.MultiPolygon
            || obj.constructor === L.LayerGroup || obj.constructor === L.FeatureGroup) {

        features = [];
        tmp = obj._layers;

        for (attr in tmp) {
            if (tmp.hasOwnProperty(attr)) {
                if (tmp[attr].getLatLngs || tmp[attr].getLatLng) {
                    // Recursively deconstruct each layer
                    features.push(this.deconstruct(tmp[attr]));
                }
            }
        }

        return {

            type: (function () {
                switch (obj.constructor) {
                case L.MultiPolyline:
                    return 'multilinestring';
                case L.MultiPolygon:
                    return 'multipolygon';
                case L.FeatureGroup:
                    return (function () {
                        var i, mpgon, mpline, mpoint;

                        // Assume that all layers are of one type (any one type)
                        mpgon = true;
                        mpline = true;
                        mpoint = true;

                        for (i in obj._layers) {
                            if (obj._layers.hasOwnProperty(i)) {
                                if (obj._layers[i].constructor !== L.Marker) {
                                    mpoint = false;
                                }
                                if (obj._layers[i].constructor !== L.Polyline) {
                                    mpline = false;
                                }
                                if (obj._layers[i].constructor !== L.Polygon) {
                                    mpgon = false;
                                }
                            }
                        }

                        if (mpoint) {
                            return 'multipoint';
                        }
                        if (mpline) {
                            return 'multilinestring';
                        }
                        if (mpgon) {
                            return 'multipolygon';
                        }
                        return 'geometrycollection';

                    }());
                default:
                    return 'geometrycollection';
                }
            }()),

            components: (function () {
                // Pluck the components from each Wkt
                var i, comps;

                comps = [];
                for (i = 0; i < features.length; i += 1) {
                    if (features[i].components) {
                        comps.push(features[i].components);
                    }
                }

                return comps;
            }())

        };

    }

    // L.Circle ////////////////////////////////////////////////////////////////
    if (obj.constructor === L.Rectangle || obj.constructor === L.rectangle) {
        console.log('Deconstruction of L.Circle objects is not yet supported');

    } else {
        console.log('The passed object does not have any recognizable properties.');
    }

};

}(window, document));
//# sourceMappingURL=leaflet-src.map