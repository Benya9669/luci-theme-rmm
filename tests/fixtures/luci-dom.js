// LuCI DOM from openwrt/luci 1fcad1ef1f5f28fe2b199dba8a060f9b5c58bb46 (Apache-2.0).
const DOM = Class.singleton(/** @lends LuCI.dom.prototype */ {
		__name__: 'LuCI.dom',

		/**
		 * Tests whether the given argument is a valid DOM `Node`.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} e
		 * The value to test.
		 *
		 * @returns {boolean}
		 * Returns `true` if the value is a DOM `Node`, else `false`.
		 */
		elem(e) {
			return (e != null && typeof(e) == 'object' && 'nodeType' in e);
		},

		/**
		 * Parses a given string as HTML and returns the first child node.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {string} s
		 * A string containing an HTML fragment to parse. Note that only
		 * the first result of the resulting structure is returned, so an
		 * input value of `<div>foo</div> <div>bar</div>` will only return
		 * the first `div` element node.
		 *
		 * @returns {Node}
		 * Returns the first DOM `Node` extracted from the HTML fragment or
		 * `null` on parsing failures or if no element could be found.
		 */
		parse(s) {
			try {
				return domParser.parseFromString(s, 'text/html').body.firstChild;
			}
			catch(e) {
				return null;
			}
		},

		/**
		 * Tests whether a given `Node` matches the given query selector.
		 *
		 * This function is a convenience wrapper around the standard
		 * `Node.matches("selector")` function with the added benefit that
		 * the `node` argument may be a non-`Node` value, in which case
		 * this function simply returns `false`.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} node
		 * The `Node` argument to test the selector against.
		 *
		 * @param {string} [selector]
		 * The query selector expression to test against the given node.
		 *
		 * @returns {boolean}
		 * Returns `true` if the given node matches the specified selector
		 * or `false` when the node argument is no valid DOM `Node` or the
		 * selector didn't match.
		 */
		matches(node, selector) {
			const m = this.elem(node) ? (node.matches ?? node.msMatchesSelector) : null;
			return m ? m.call(node, selector) : false;
		},

		/**
		 * Returns the closest parent node that matches the given query
		 * selector expression.
		 *
		 * This function is a convenience wrapper around the standard
		 * `Node.closest("selector")` function with the added benefit that
		 * the `node` argument may be a non-`Node` value, in which case
		 * this function simply returns `null`.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} node
		 * The `Node` argument to find the closest parent for.
		 *
		 * @param {string} [selector]
		 * The query selector expression to test against each parent.
		 *
		 * @returns {Node|null}
		 * Returns the closest parent node matching the selector or
		 * `null` when the node argument is no valid DOM `Node` or the
		 * selector didn't match any parent.
		 */
		parent(node, selector) {
			if (this.elem(node) && node.closest)
				return node.closest(selector);

			while (this.elem(node))
				if (this.matches(node, selector))
					return node;
				else
					node = node.parentNode;

			return null;
		},

		/**
		 * Appends the given children data to the given node.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} node
		 * The `Node` argument to append the children to.
		 *
		 * @param {*} [children]
		 * The children to append to the given node.
		 *
		 * When `children` is an array, then each item of the array
		 * will be either appended as a child element or text node,
		 * depending on whether the item is a DOM `Node` instance or
		 * some other non-`null` value. Non-`Node`, non-`null` values
		 * will be converted to strings first before being passed as
		 * argument to `createTextNode()`.
		 *
		 * When `children` is a function, it will be invoked with
		 * the passed `node` argument as the sole parameter and the `append`
		 * function will be invoked again, with the given `node` argument
		 * as first and the return value of the `children` function as
		 *  the second parameter.
		 *
		 * When `children` is a DOM `Node` instance, it will be
		 * appended to the given `node`.
		 *
		 * When `children` is any other non-`null` value, it will be
		 * converted to a string and appended to the `innerHTML` property
		 * of the given `node`.
		 *
		 * @returns {Node|null}
		 * Returns the last children `Node` appended to the node or `null`
		 * if either the `node` argument was no valid DOM `node` or if the
		 * `children` was `null` or didn't result in further DOM nodes.
		 */
		append(node, children) {
			if (!this.elem(node))
				return null;

			if (Array.isArray(children)) {
				for (let i = 0; i < children.length; i++)
					if (this.elem(children[i]))
						node.appendChild(children[i]);
					else if (children !== null && children !== undefined)
						node.appendChild(document.createTextNode(`${children[i]}`));

				return node.lastChild;
			}
			else if (typeof(children) === 'function') {
				return this.append(node, children(node));
			}
			else if (this.elem(children)) {
				return node.appendChild(children);
			}
			else if (children !== null && children !== undefined) {
				node.innerHTML = `${children}`;
				return node.lastChild;
			}

			return null;
		},

		/**
		 * Replaces the content of the given node with the given children.
		 *
		 * This function first removes any children of the given DOM
		 * `Node` and then adds the given children following the
		 * rules outlined below.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} node
		 * The `Node` argument to replace the children of.
		 *
		 * @param {*} [children]
		 * The children to replace into the given node.
		 *
		 * When `children` is an array, then each item of the array
		 * will be either appended as a child element or text node,
		 * depending on whether the item is a DOM `Node` instance or
		 * some other non-`null` value. Non-`Node`, non-`null` values
		 * will be converted to strings first before being passed as
		 * argument to `createTextNode()`.
		 *
		 * When `children` is a function, it will be invoked with
		 * the passed `node` argument as the sole parameter and the `append`
		 * function will be invoked again, with the given `node` argument
		 * as first and the return value of the `children` function as
		 * the second parameter.
		 *
		 * When `children` is a DOM `Node` instance, it will be
		 * appended to the given `node`.
		 *
		 * When `children` is any other non-`null` value, it will be
		 * converted to a string and appended to the `innerHTML` property
		 * of the given `node`.
		 *
		 * @returns {Node|null}
		 * Returns the last children `Node` appended to the node or `null`
		 * if either the `node` argument was no valid DOM `node` or if the
		 * `children` was `null` or didn't result in further DOM nodes.
		 */
		content(node, children) {
			if (!this.elem(node))
				return null;

			const dataNodes = node.querySelectorAll('[data-idref]');

			for (let i = 0; i < dataNodes.length; i++)
				delete this.registry[dataNodes[i].getAttribute('data-idref')];

			while (node.firstChild)
				node.removeChild(node.firstChild);

			return this.append(node, children);
		},

		/**
		 * Sets attributes or registers event listeners on element nodes.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {*} node
		 * The `Node` argument to set the attributes or add the event
		 * listeners for. When the given `node` value is not a valid
		 * DOM `Node`, the function returns and does nothing.
		 *
		 * @param {string|Object<string, *>} key
		 * Specifies either the attribute or event handler name to use,
		 * or an object containing multiple key, value pairs which are
		 * each added to the node as either attribute or event handler,
		 * depending on the respective value.
		 *
		 * @param {*} [val]
		 * Specifies the attribute value or event handler function to add.
		 * If the `key` parameter is an `Object`, this parameter will be
		 * ignored.
		 *
		 * When `val` is of type function, it will be registered as an event
		 * handler on the given `node` with the `key` parameter being the
		 * event name.
		 *
		 * When `val` is of type object, it will be serialized as JSON and
		 * added as an attribute to the given `node`, using the given `key`
		 * as an attribute name.
		 *
		 * When `val` is of any other type, it will be added as an attribute
		 * to the given `node` as-is, with the underlying `setAttribute()`
		 * call implicitly turning it into a string.
		 * @returns {null}
		 */
		attr(node, key, val) {
			if (!this.elem(node))
				return null;

			let attr = null;

			if (typeof(key) === 'object' && key !== null)
				attr = key;
			else if (typeof(key) === 'string')
				attr = {}, attr[key] = val;

			for (key in attr) {
				if (!attr.hasOwnProperty(key) || attr[key] == null)
					continue;

				switch (typeof(attr[key])) {
				case 'function':
					node.addEventListener(key, attr[key]);
					break;

				case 'object':
					node.setAttribute(key, JSON.stringify(attr[key]));
					break;

				default:
					node.setAttribute(key, attr[key]);
				}
			}
		},

		/**
		 * Creates a new DOM `Node` from the given `html`, `attr` and
		 * `data` parameters.
		 *
		 * This function has multiple signatures, it can be either invoked
		 * in the form `create(html[, attr[, data]])` or in the form
		 * `create(html[, data])`. The used variant is determined from the
		 * type of the second argument.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {string} html
		 * Describes the node to create.
		 *
		 * When the value of `html` is of type array, a `DocumentFragment`
		 * node is created and each item of the array is first converted
		 * to a DOM `Node` by passing it through `create()` and then added
		 * as a child to the fragment.
		 *
		 * When the value of `html` is a DOM `Node` instance, no new
		 * element will be created, but the node will be used as-is.
		 *
		 * When the value of `html` is a string starting with `<`, it will
		 * be passed to `dom.parse()` and the resulting value is used.
		 *
		 * When the value of `html` is any other string, it will be passed
		 * to `document.createElement()` for creating a new DOM `Node` of
		 * the given name.
		 *
		 * @param {Object<string, *>} [attr]
		 * Specifies an Object of key, value pairs to set as attributes
		 * or event handlers on the created node. Refer to
		 * {@link LuCI.dom#attr dom.attr()} for details.
		 *
		 * @param {*} [data]
		 * Specifies children to append to the newly created element.
		 * Refer to {@link LuCI.dom#append dom.append()} for details.
		 *
		 * @throws {InvalidCharacterError}
		 * Throws an `InvalidCharacterError` when the given `html`
		 * argument contained malformed markup (such as not escaped
		 * `&` characters in XHTML mode) or when the given node name
		 * in `html` contains characters which are not legal in DOM
		 * element names, such as spaces.
		 *
		 * @returns {Node}
		 * Returns the newly created `Node`.
		 */
		create() {
			const html = arguments[0];
			let attr = arguments[1];
			let data = arguments[2];
			let elem;

			if (!(attr instanceof Object) || Array.isArray(attr))
				data = attr, attr = null;

			if (Array.isArray(html)) {
				elem = document.createDocumentFragment();
				for (let i = 0; i < html.length; i++)
					elem.appendChild(this.create(html[i]));
			}
			else if (this.elem(html)) {
				elem = html;
			}
			else if (html.charCodeAt(0) === 60) {
				elem = this.parse(html);
			}
			else {
				elem = document.createElement(html);
			}

			if (!elem)
				return null;

			this.attr(elem, attr);
			this.append(elem, data);

			return elem;
		},

		registry: {},

		/**
		 * Attaches or detaches arbitrary data to and from a DOM `Node`.
		 *
		 * This function is useful to attach non-string values or runtime
		 * data that is not serializable to DOM nodes. To decouple data
		 * from the DOM, values are not added directly to nodes, but
		 * inserted into a registry instead which is then referenced by a
		 * string key stored as `data-idref` attribute in the node.
		 *
		 * This function has multiple signatures and is sensitive to the
		 * number of arguments passed to it.
		 *
		 *  - `dom.data(node)` -
		 *	 Fetches all data associated with the given node.
		 *  - `dom.data(node, key)` -
		 *	 Fetches a specific key associated with the given node.
		 *  - `dom.data(node, key, val)` -
		 *	 Sets a specific key to the given value associated with the
		 *	 given node.
		 *  - `dom.data(node, null)` -
		 *	 Clears any data associated with the node.
		 *  - `dom.data(node, key, null)` -
		 *	 Clears the given key associated with the node.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {Node} node
		 * The DOM `Node` instance to set or retrieve the data for.
		 *
		 * @param {string|null} [key]
		 * This is either a string specifying the key to retrieve, or
		 * `null` to unset the entire node data.
		 *
		 * @param {*|null} [val]
		 * This is either a non-`null` value to set for a given key or
		 * `null` to remove the given `key` from the specified node.
		 *
		 * @returns {*}
		 * Returns the get or set value, or `null` when no value could
		 * be found.
		 */
		data(node, key, val) {
			if (!node?.getAttribute)
				return null;

			let id = node.getAttribute('data-idref');

			/* clear all data */
			if (arguments.length > 1 && key == null) {
				if (id != null) {
					node.removeAttribute('data-idref');
					val = this.registry[id]
					delete this.registry[id];
					return val;
				}

				return null;
			}

			/* clear a key */
			else if (arguments.length > 2 && key != null && val == null) {
				if (id != null) {
					val = this.registry[id][key];
					delete this.registry[id][key];
					return val;
				}

				return null;
			}

			/* set a key */
			else if (arguments.length > 2 && key != null && val != null) {
				if (id == null) {
					do { id = Math.floor(Math.random() * 0xffffffff).toString(16) }
					while (this.registry.hasOwnProperty(id));

					node.setAttribute('data-idref', id);
					this.registry[id] = {};
				}

				return (this.registry[id][key] = val);
			}

			/* get all data */
			else if (arguments.length == 1) {
				if (id != null)
					return this.registry[id];

				return null;
			}

			/* get a key */
			else if (arguments.length == 2) {
				if (id != null)
					return this.registry[id][key];
			}

			return null;
		},

		/**
		 * Binds the given class instance to the specified DOM `Node`.
		 *
		 * This function uses the `dom.data()` facility to attach the
		 * passed instance of a Class to a node. This is needed for
		 * complex widget elements or similar where the corresponding
		 * class instance responsible for the element must be retrieved
		 * from DOM nodes obtained by `querySelector()` or similar means.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {Node} node
		 * The DOM `Node` instance to bind the class to.
		 *
		 * @param {Class} inst
		 * The Class instance to bind to the node.
		 *
		 * @throws {TypeError}
		 * Throws a `TypeError` when the given instance argument isn't
		 * a valid Class instance.
		 *
		 * @returns {Class}
		 * Returns the bound class instance.
		 */
		bindClassInstance(node, inst) {
			if (!(inst instanceof Class))
				LuCI.prototype.error('TypeError', 'Argument must be a class instance');

			return this.data(node, '_class', inst);
		},

		/**
		 * Finds a bound class instance on the given node itself or the
		 * first bound instance on its closest parent node.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {Node} node
		 * The DOM `Node` instance to start from.
		 *
		 * @returns {Class|null}
		 * Returns the founds class instance if any or `null` if no bound
		 * class could be found on the node itself or any of its parents.
		 */
		findClassInstance(node) {
			let inst = null;

			do {
				inst = this.data(node, '_class');
				node = node.parentNode;
			}
			while (!(inst instanceof Class) && node != null);

			return inst;
		},

		/**
		 * Finds a bound class instance on the given node itself or the
		 * first bound instance on its closest parent node and invokes
		 * the specified method name on the found class instance.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {Node} node
		 * The DOM `Node` instance to start from.
		 *
		 * @param {string} method
		 * The name of the method to invoke on the found class instance.
		 *
		 * @param {...*} args
		 * Additional arguments to pass to the invoked method as-is.
		 *
		 * @returns {*|null}
		 * Returns the return value of the invoked method if a class
		 * instance and method has been found. Returns `null` if either
		 * no bound class instance could be found, or if the found
		 * instance didn't have the requested `method`.
		 */
		callClassMethod(node, method, ...args) {
			const inst = this.findClassInstance(node);

			if (typeof(inst?.[method]) != 'function')
				return null;

			return inst[method].call(inst, ...args);
		},

		/**
		 * The ignore callback function is invoked by `isEmpty()` for each
		 * child node to decide whether to ignore a child node or not.
		 *
		 * When this function returns `false`, the node passed to it is
		 * ignored, else not.
		 *
		 * @callback LuCI.dom~ignoreCallbackFn
		 * @param {Node} node
		 * The child node to test.
		 *
		 * @returns {boolean}
		 * Boolean indicating whether to ignore the node or not.
		 */

		/**
		 * Tests whether a given DOM `Node` instance is empty or appears
		 * empty.
		 *
		 * Any element child nodes which have the CSS class `hidden` set
		 * or for which the optionally passed `ignoreFn` callback function
		 * returns `false` are ignored.
		 *
		 * @instance
		 * @memberof LuCI.dom
		 * @param {Node} node
		 * The DOM `Node` instance to test.
		 *
		 * @param {LuCI.dom.ignoreCallbackFn} [ignoreFn]
		 * Specifies an optional function which is invoked for each child
		 * node to decide whether the child node should be ignored or not.
		 *
		 * @returns {boolean}
		 * Returns `true` if the node does not have any children or if
		 * any children node either has a `hidden` CSS class or a `false`
		 * result when testing it using the given `ignoreFn`.
		 */
		isEmpty(node, ignoreFn) {
			for (let child = node?.firstElementChild; child != null; child = child.nextElementSibling)
				if (!child.classList.contains('hidden') && !ignoreFn?.(child))
					return false;

			return true;
		}
	});

DOM;
