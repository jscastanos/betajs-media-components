/*!
betajs-media-components - v0.0.67 - 2017-09-13
Copyright (c) Ziggeo,Oliver Friedmann
Apache-2.0 Software License.
*/
/** @flow **//*!
betajs-scoped - v0.0.14 - 2017-04-14
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/
var Scoped = (function () {
var Globals = (function () {  
/** 
 * This helper module provides functions for reading and writing globally accessible namespaces, both in the browser and in NodeJS.
 * 
 * @module Globals
 * @access private
 */
return { 
		
	/**
	 * Returns the value of a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @return value of global variable or undefined if not existing
	 */
	get : function(key/* : string */) {
		if (typeof window !== "undefined")
			return window[key];
		if (typeof global !== "undefined")
			return global[key];
		if (typeof self !== "undefined")
			return self[key];
		return undefined;
	},

	
	/**
	 * Sets a global variable.
	 * 
	 * @param {string} key identifier of a global variable
	 * @param value value to be set
	 * @return value that has been set
	 */
	set : function(key/* : string */, value) {
		if (typeof window !== "undefined")
			window[key] = value;
		if (typeof global !== "undefined")
			global[key] = value;
		if (typeof self !== "undefined")
			self[key] = value;
		return value;
	},
	
	
	/**
	 * Returns the value of a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @return value of global variable or undefined if not existing
	 * 
	 * @example
	 * // returns window.foo.bar / global.foo.bar 
	 * Globals.getPath("foo.bar")
	 */
	getPath: function (path/* : string */) {
		var args = path.split(".");
		if (args.length == 1)
			return this.get(path);		
		var current = this.get(args[0]);
		for (var i = 1; i < args.length; ++i) {
			if (!current)
				return current;
			current = current[args[i]];
		}
		return current;
	},


	/**
	 * Sets a global variable under a namespaced path.
	 * 
	 * @param {string} path namespaced path identifier of variable
	 * @param value value to be set
	 * @return value that has been set
	 * 
	 * @example
	 * // sets window.foo.bar / global.foo.bar 
	 * Globals.setPath("foo.bar", 42);
	 */
	setPath: function (path/* : string */, value) {
		var args = path.split(".");
		if (args.length == 1)
			return this.set(path, value);		
		var current = this.get(args[0]) || this.set(args[0], {});
		for (var i = 1; i < args.length - 1; ++i) {
			if (!(args[i] in current))
				current[args[i]] = {};
			current = current[args[i]];
		}
		current[args[args.length - 1]] = value;
		return value;
	}
	
};}).call(this);
/*::
declare module Helper {
	declare function extend<A, B>(a: A, b: B): A & B;
}
*/

var Helper = (function () {  
/** 
 * This helper module provides auxiliary functions for the Scoped system.
 * 
 * @module Helper
 * @access private
 */
return { 
		
	/**
	 * Attached a context to a function.
	 * 
	 * @param {object} obj context for the function
	 * @param {function} func function
	 * 
	 * @return function with attached context
	 */
	method: function (obj, func) {
		return function () {
			return func.apply(obj, arguments);
		};
	},

	
	/**
	 * Extend a base object with all attributes of a second object.
	 * 
	 * @param {object} base base object
	 * @param {object} overwrite second object
	 * 
	 * @return {object} extended base object
	 */
	extend: function (base, overwrite) {
		base = base || {};
		overwrite = overwrite || {};
		for (var key in overwrite)
			base[key] = overwrite[key];
		return base;
	},
	
	
	/**
	 * Returns the type of an object, particulary returning 'array' for arrays.
	 * 
	 * @param obj object in question
	 * 
	 * @return {string} type of object
	 */
	typeOf: function (obj) {
		return Object.prototype.toString.call(obj) === '[object Array]' ? "array" : typeof obj;
	},
	
	
	/**
	 * Returns whether an object is null, undefined, an empty array or an empty object.
	 * 
	 * @param obj object in question
	 * 
	 * @return true if object is empty
	 */
	isEmpty: function (obj) {
		if (obj === null || typeof obj === "undefined")
			return true;
		if (this.typeOf(obj) == "array")
			return obj.length === 0;
		if (typeof obj !== "object")
			return false;
		for (var key in obj)
			return false;
		return true;
	},
	
	
    /**
     * Matches function arguments against some pattern.
     * 
     * @param {array} args function arguments
     * @param {object} pattern typed pattern
     * 
     * @return {object} matched arguments as associative array 
     */	
	matchArgs: function (args, pattern) {
		var i = 0;
		var result = {};
		for (var key in pattern) {
			if (pattern[key] === true || this.typeOf(args[i]) == pattern[key]) {
				result[key] = args[i];
				i++;
			} else if (this.typeOf(args[i]) == "undefined")
				i++;
		}
		return result;
	},
	
	
	/**
	 * Stringifies a value as JSON and functions to string representations.
	 * 
	 * @param value value to be stringified
	 * 
	 * @return stringified value
	 */
	stringify: function (value) {
		if (this.typeOf(value) == "function")
			return "" + value;
		return JSON.stringify(value);
	}	

	
};}).call(this);
var Attach = (function () {  
/** 
 * This module provides functionality to attach the Scoped system to the environment.
 * 
 * @module Attach
 * @access private
 */
return { 
		
	__namespace: "Scoped",
	__revert: null,
	
	
	/**
	 * Upgrades a pre-existing Scoped system to the newest version present. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	upgrade: function (namespace/* : ?string */) {
		var current = Globals.get(namespace || Attach.__namespace);
		if (current && Helper.typeOf(current) == "object" && current.guid == this.guid && Helper.typeOf(current.version) == "string") {
			var my_version = this.version.split(".");
			var current_version = current.version.split(".");
			var newer = false;
			for (var i = 0; i < Math.min(my_version.length, current_version.length); ++i) {
				newer = parseInt(my_version[i], 10) > parseInt(current_version[i], 10);
				if (my_version[i] != current_version[i]) 
					break;
			}
			return newer ? this.attach(namespace) : current;				
		} else
			return this.attach(namespace);		
	},


	/**
	 * Attaches the Scoped system to the environment. 
	 * 
	 * @param {string} namespace Optional namespace (default is 'Scoped')
	 * @return {object} the attached Scoped system
	 */
	attach : function(namespace/* : ?string */) {
		if (namespace)
			Attach.__namespace = namespace;
		var current = Globals.get(Attach.__namespace);
		if (current == this)
			return this;
		Attach.__revert = current;
		if (current) {
			try {
				var exported = current.__exportScoped();
				this.__exportBackup = this.__exportScoped();
				this.__importScoped(exported);
			} catch (e) {
				// We cannot upgrade the old version.
			}
		}
		Globals.set(Attach.__namespace, this);
		return this;
	},
	

	/**
	 * Detaches the Scoped system from the environment. 
	 * 
	 * @param {boolean} forceDetach Overwrite any attached scoped system by null.
	 * @return {object} the detached Scoped system
	 */
	detach: function (forceDetach/* : ?boolean */) {
		if (forceDetach)
			Globals.set(Attach.__namespace, null);
		if (typeof Attach.__revert != "undefined")
			Globals.set(Attach.__namespace, Attach.__revert);
		delete Attach.__revert;
		if (Attach.__exportBackup)
			this.__importScoped(Attach.__exportBackup);
		return this;
	},
	

	/**
	 * Exports an object as a module if possible. 
	 * 
	 * @param {object} mod a module object (optional, default is 'module')
	 * @param {object} object the object to be exported
	 * @param {boolean} forceExport overwrite potentially pre-existing exports
	 * @return {object} the Scoped system
	 */
	exports: function (mod, object, forceExport) {
		mod = mod || (typeof module != "undefined" ? module : null);
		if (typeof mod == "object" && mod && "exports" in mod && (forceExport || mod.exports == this || !mod.exports || Helper.isEmpty(mod.exports)))
			mod.exports = object || this;
		return this;
	}	

};}).call(this);

function newNamespace (opts/* : {tree ?: boolean, global ?: boolean, root ?: Object} */) {

	var options/* : {
		tree: boolean,
	    global: boolean,
	    root: Object
	} */ = {
		tree: typeof opts.tree === "boolean" ? opts.tree : false,
		global: typeof opts.global === "boolean" ? opts.global : false,
		root: typeof opts.root === "object" ? opts.root : {}
	};

	/*::
	type Node = {
		route: ?string,
		parent: ?Node,
		children: any,
		watchers: any,
		data: any,
		ready: boolean,
		lazy: any
	};
	*/

	function initNode(options)/* : Node */ {
		return {
			route: typeof options.route === "string" ? options.route : null,
			parent: typeof options.parent === "object" ? options.parent : null,
			ready: typeof options.ready === "boolean" ? options.ready : false,
			children: {},
			watchers: [],
			data: {},
			lazy: []
		};
	}
	
	var nsRoot = initNode({ready: true});
	
	if (options.tree) {
		if (options.global) {
			try {
				if (window)
					nsRoot.data = window;
			} catch (e) { }
			try {
				if (global)
					nsRoot.data = global;
			} catch (e) { }
			try {
				if (self)
					nsRoot.data = self;
			} catch (e) { }
		} else
			nsRoot.data = options.root;
	}
	
	function nodeDigest(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready) {
			nodeDigest(node.parent);
			return;
		}
		if (node.route && node.parent && (node.route in node.parent.data)) {
			node.data = node.parent.data[node.route];
			node.ready = true;
			for (var i = 0; i < node.watchers.length; ++i)
				node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
			node.watchers = [];
			for (var key in node.children)
				nodeDigest(node.children[key]);
		}
	}
	
	function nodeEnforce(node/* : Node */) {
		if (node.ready)
			return;
		if (node.parent && !node.parent.ready)
			nodeEnforce(node.parent);
		node.ready = true;
		if (node.parent) {
			if (options.tree && typeof node.parent.data == "object")
				node.parent.data[node.route] = node.data;
		}
		for (var i = 0; i < node.watchers.length; ++i)
			node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
		node.watchers = [];
	}
	
	function nodeSetData(node/* : Node */, value) {
		if (typeof value == "object" && node.ready) {
			for (var key in value)
				node.data[key] = value[key];
		} else
			node.data = value;
		if (typeof value == "object") {
			for (var ckey in value) {
				if (node.children[ckey])
					node.children[ckey].data = value[ckey];
			}
		}
		nodeEnforce(node);
		for (var k in node.children)
			nodeDigest(node.children[k]);
	}
	
	function nodeClearData(node/* : Node */) {
		if (node.ready && node.data) {
			for (var key in node.data)
				delete node.data[key];
		}
	}
	
	function nodeNavigate(path/* : ?String */) {
		if (!path)
			return nsRoot;
		var routes = path.split(".");
		var current = nsRoot;
		for (var i = 0; i < routes.length; ++i) {
			if (routes[i] in current.children)
				current = current.children[routes[i]];
			else {
				current.children[routes[i]] = initNode({
					parent: current,
					route: routes[i]
				});
				current = current.children[routes[i]];
				nodeDigest(current);
			}
		}
		return current;
	}
	
	function nodeAddWatcher(node/* : Node */, callback, context) {
		if (node.ready)
			callback.call(context || this, node.data);
		else {
			node.watchers.push({
				callback: callback,
				context: context
			});
			if (node.lazy.length > 0) {
				var f = function (node) {
					if (node.lazy.length > 0) {
						var lazy = node.lazy.shift();
						lazy.callback.call(lazy.context || this, node.data);
						f(node);
					}
				};
				f(node);
			}
		}
	}
	
	function nodeUnresolvedWatchers(node/* : Node */, base, result) {
		node = node || nsRoot;
		result = result || [];
		if (!node.ready)
			result.push(base);
		for (var k in node.children) {
			var c = node.children[k];
			var r = (base ? base + "." : "") + c.route;
			result = nodeUnresolvedWatchers(c, r, result);
		}
		return result;
	}

	/** 
	 * The namespace module manages a namespace in the Scoped system.
	 * 
	 * @module Namespace
	 * @access public
	 */
	return {
		
		/**
		 * Extend a node in the namespace by an object.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used for extend the namespace node
		 */
		extend: function (path, value) {
			nodeSetData(nodeNavigate(path), value);
		},
		
		/**
		 * Set the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @param {object} value object that should be used as value for the namespace node
		 */
		set: function (path, value) {
			var node = nodeNavigate(path);
			if (node.data)
				nodeClearData(node);
			nodeSetData(node, value);
		},
		
		/**
		 * Read the object value of a node in the namespace.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {object} object value of the node or null if undefined
		 */
		get: function (path) {
			var node = nodeNavigate(path);
			return node.ready ? node.data : null;
		},
		
		/**
		 * Lazily navigate to a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being touched.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		lazy: function (path, callback, context) {
			var node = nodeNavigate(path);
			if (node.ready)
				callback(context || this, node.data);
			else {
				node.lazy.push({
					callback: callback,
					context: context
				});
			}
		},
		
		/**
		 * Digest a node path, checking whether it has been defined by an external system.
		 * 
		 * @param {string} path path to the node in the namespace
		 */
		digest: function (path) {
			nodeDigest(nodeNavigate(path));
		},
		
		/**
		 * Asynchronously access a node in the namespace.
		 * Will asynchronously call the callback as soon as the node is being defined.
		 *
		 * @param {string} path path to the node in the namespace
		 * @param {function} callback callback function accepting the node's object value
		 * @param {context} context optional callback context
		 */
		obtain: function (path, callback, context) {
			nodeAddWatcher(nodeNavigate(path), callback, context);
		},
		
		/**
		 * Returns all unresolved watchers under a certain path.
		 * 
		 * @param {string} path path to the node in the namespace
		 * @return {array} list of all unresolved watchers 
		 */
		unresolvedWatchers: function (path) {
			return nodeUnresolvedWatchers(nodeNavigate(path), path);
		},
		
		__export: function () {
			return {
				options: options,
				nsRoot: nsRoot
			};
		},
		
		__import: function (data) {
			options = data.options;
			nsRoot = data.nsRoot;
		}
		
	};
	
}
function newScope (parent, parentNS, rootNS, globalNS) {
	
	var self = this;
	var nextScope = null;
	var childScopes = [];
	var parentNamespace = parentNS;
	var rootNamespace = rootNS;
	var globalNamespace = globalNS;
	var localNamespace = newNamespace({tree: true});
	var privateNamespace = newNamespace({tree: false});
	
	var bindings = {
		"global": {
			namespace: globalNamespace
		}, "root": {
			namespace: rootNamespace
		}, "local": {
			namespace: localNamespace
		}, "default": {
			namespace: privateNamespace
		}, "parent": {
			namespace: parentNamespace
		}, "scope": {
			namespace: localNamespace,
			readonly: false
		}
	};
	
	var custom = function (argmts, name, callback) {
		var args = Helper.matchArgs(argmts, {
			options: "object",
			namespaceLocator: true,
			dependencies: "array",
			hiddenDependencies: "array",
			callback: true,
			context: "object"
		});
		
		var options = Helper.extend({
			lazy: this.options.lazy
		}, args.options || {});
		
		var ns = this.resolve(args.namespaceLocator);
		
		var execute = function () {
			this.require(args.dependencies, args.hiddenDependencies, function () {
				arguments[arguments.length - 1].ns = ns;
				if (this.options.compile) {
					var params = [];
					for (var i = 0; i < argmts.length; ++i)
						params.push(Helper.stringify(argmts[i]));
					this.compiled += this.options.ident + "." + name + "(" + params.join(", ") + ");\n\n";
				}
				if (this.options.dependencies) {
					this.dependencies[ns.path] = this.dependencies[ns.path] || {};
					if (args.dependencies) {
						args.dependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
					if (args.hiddenDependencies) {
						args.hiddenDependencies.forEach(function (dep) {
							this.dependencies[ns.path][this.resolve(dep).path] = true;
						}, this);
					}
				}
				var result = this.options.compile ? {} : args.callback.apply(args.context || this, arguments);
				callback.call(this, ns, result);
			}, this);
		};
		
		if (options.lazy)
			ns.namespace.lazy(ns.path, execute, this);
		else
			execute.apply(this);

		return this;
	};
	
	/** 
	 * This module provides all functionality in a scope.
	 * 
	 * @module Scoped
	 * @access public
	 */
	return {
		
		getGlobal: Helper.method(Globals, Globals.getPath),
		setGlobal: Helper.method(Globals, Globals.setPath),
		
		options: {
			lazy: false,
			ident: "Scoped",
			compile: false,
			dependencies: false
		},
		
		compiled: "",
		
		dependencies: {},
		
		
		/**
		 * Returns a reference to the next scope that will be obtained by a subScope call.
		 * 
		 * @return {object} next scope
		 */
		nextScope: function () {
			if (!nextScope)
				nextScope = newScope(this, localNamespace, rootNamespace, globalNamespace);
			return nextScope;
		},
		
		/**
		 * Creates a sub scope of the current scope and returns it.
		 * 
		 * @return {object} sub scope
		 */
		subScope: function () {
			var sub = this.nextScope();
			childScopes.push(sub);
			nextScope = null;
			return sub;
		},
		
		/**
		 * Creates a binding within in the scope. 
		 * 
		 * @param {string} alias identifier of the new binding
		 * @param {string} namespaceLocator identifier of an existing namespace path
		 * @param {object} options options for the binding
		 * 
		 */
		binding: function (alias, namespaceLocator, options) {
			if (!bindings[alias] || !bindings[alias].readonly) {
				var ns;
				if (Helper.typeOf(namespaceLocator) != "string") {
					ns = {
						namespace: newNamespace({
							tree: true,
							root: namespaceLocator
						}),
						path: null	
					};
				} else
					ns = this.resolve(namespaceLocator);
				bindings[alias] = Helper.extend(options, ns);
			}
			return this;
		},
		
		
		/**
		 * Resolves a name space locator to a name space.
		 * 
		 * @param {string} namespaceLocator name space locator
		 * @return {object} resolved name space
		 * 
		 */
		resolve: function (namespaceLocator) {
			var parts = namespaceLocator.split(":");
			if (parts.length == 1) {
				return {
					namespace: privateNamespace,
					path: parts[0]
				};
			} else {
				var binding = bindings[parts[0]];
				if (!binding)
					throw ("The namespace '" + parts[0] + "' has not been defined (yet).");
				return {
					namespace: binding.namespace,
					path : binding.path && parts[1] ? binding.path + "." + parts[1] : (binding.path || parts[1])
				};
			}
		},

		
		/**
		 * Defines a new name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new definition
		 * @param {object} context a callback context (optional)
		 * 
		 */
		define: function () {
			return custom.call(this, arguments, "define", function (ns, result) {
				if (ns.namespace.get(ns.path))
					throw ("Scoped namespace " + ns.path + " has already been defined. Use extend to extend an existing namespace instead");
				ns.namespace.set(ns.path, result);
			});
		},
		
		
		/**
		 * Assume a specific version of a module and fail if it is not met.
		 * 
		 * @param {string} assumption name space locator
		 * @param {string} version assumed version
		 * 
		 */
		assumeVersion: function () {
			var args = Helper.matchArgs(arguments, {
				assumption: true,
				dependencies: "array",
				callback: true,
				context: "object",
				error: "string"
			});
			var dependencies = args.dependencies || [];
			dependencies.unshift(args.assumption);
			this.require(dependencies, function () {
				var argv = arguments;
				var assumptionValue = argv[0].replace(/[^\d\.]/g, "");
				argv[0] = assumptionValue.split(".");
				for (var i = 0; i < argv[0].length; ++i)
					argv[0][i] = parseInt(argv[0][i], 10);
				if (Helper.typeOf(args.callback) === "function") {
					if (!args.callback.apply(args.context || this, args))
						throw ("Scoped Assumption '" + args.assumption + "' failed, value is " + assumptionValue + (args.error ? ", but assuming " + args.error : ""));
				} else {
					var version = (args.callback + "").replace(/[^\d\.]/g, "").split(".");
					for (var j = 0; j < Math.min(argv[0].length, version.length); ++j)
						if (parseInt(version[j], 10) > argv[0][j])
							throw ("Scoped Version Assumption '" + args.assumption + "' failed, value is " + assumptionValue + ", but assuming at least " + args.callback);
				}
			});
		},
		
		
		/**
		 * Extends a potentiall existing name space once a list of name space locators is available.
		 * 
		 * @param {string} namespaceLocator the name space that is to be defined
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments and returning the new additional definitions.
		 * @param {object} context a callback context (optional)
		 * 
		 */
		extend: function () {
			return custom.call(this, arguments, "extend", function (ns, result) {
				ns.namespace.extend(ns.path, result);
			});
		},
				
		
		/**
		 * Requires a list of name space locators and calls a function once they are present.
		 * 
		 * @param {array} dependencies a list of name space locator dependencies (optional)
		 * @param {array} hiddenDependencies a list of hidden name space locators (optional)
		 * @param {function} callback a callback function accepting all dependencies as arguments
		 * @param {object} context a callback context (optional)
		 * 
		 */
		require: function () {
			var args = Helper.matchArgs(arguments, {
				dependencies: "array",
				hiddenDependencies: "array",
				callback: "function",
				context: "object"
			});
			args.callback = args.callback || function () {};
			var dependencies = args.dependencies || [];
			var allDependencies = dependencies.concat(args.hiddenDependencies || []);
			var count = allDependencies.length;
			var deps = [];
			var environment = {};
			if (count) {
				var f = function (value) {
					if (this.i < deps.length)
						deps[this.i] = value;
					count--;
					if (count === 0) {
						deps.push(environment);
						args.callback.apply(args.context || this.ctx, deps);
					}
				};
				for (var i = 0; i < allDependencies.length; ++i) {
					var ns = this.resolve(allDependencies[i]);
					if (i < dependencies.length)
						deps.push(null);
					ns.namespace.obtain(ns.path, f, {
						ctx: this,
						i: i
					});
				}
			} else {
				deps.push(environment);
				args.callback.apply(args.context || this, deps);
			}
			return this;
		},

		
		/**
		 * Digest a name space locator, checking whether it has been defined by an external system.
		 * 
		 * @param {string} namespaceLocator name space locator
		 */
		digest: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			ns.namespace.digest(ns.path);
			return this;
		},
		
		
		/**
		 * Returns all unresolved definitions under a namespace locator
		 * 
		 * @param {string} namespaceLocator name space locator, e.g. "global:"
		 * @return {array} list of all unresolved definitions 
		 */
		unresolved: function (namespaceLocator) {
			var ns = this.resolve(namespaceLocator);
			return ns.namespace.unresolvedWatchers(ns.path);
		},
		
		/**
		 * Exports the scope.
		 * 
		 * @return {object} exported scope
		 */
		__export: function () {
			return {
				parentNamespace: parentNamespace.__export(),
				rootNamespace: rootNamespace.__export(),
				globalNamespace: globalNamespace.__export(),
				localNamespace: localNamespace.__export(),
				privateNamespace: privateNamespace.__export()
			};
		},
		
		/**
		 * Imports a scope from an exported scope.
		 * 
		 * @param {object} data exported scope to be imported
		 * 
		 */
		__import: function (data) {
			parentNamespace.__import(data.parentNamespace);
			rootNamespace.__import(data.rootNamespace);
			globalNamespace.__import(data.globalNamespace);
			localNamespace.__import(data.localNamespace);
			privateNamespace.__import(data.privateNamespace);
		}
		
	};
	
}
var globalNamespace = newNamespace({tree: true, global: true});
var rootNamespace = newNamespace({tree: true});
var rootScope = newScope(null, rootNamespace, rootNamespace, globalNamespace);

var Public = Helper.extend(rootScope, (function () {  
/** 
 * This module includes all public functions of the Scoped system.
 * 
 * It includes all methods of the root scope and the Attach module.
 * 
 * @module Public
 * @access public
 */
return {
		
	guid: "4b6878ee-cb6a-46b3-94ac-27d91f58d666",
	version: '0.0.14',
		
	upgrade: Attach.upgrade,
	attach: Attach.attach,
	detach: Attach.detach,
	exports: Attach.exports,
	
	/**
	 * Exports all data contained in the Scoped system.
	 * 
	 * @return data of the Scoped system.
	 * @access private
	 */
	__exportScoped: function () {
		return {
			globalNamespace: globalNamespace.__export(),
			rootNamespace: rootNamespace.__export(),
			rootScope: rootScope.__export()
		};
	},
	
	/**
	 * Import data into the Scoped system.
	 * 
	 * @param data of the Scoped system.
	 * @access private
	 */
	__importScoped: function (data) {
		globalNamespace.__import(data.globalNamespace);
		rootNamespace.__import(data.rootNamespace);
		rootScope.__import(data.rootScope);
	}
	
};

}).call(this));

Public = Public.upgrade();
Public.exports();
	return Public;
}).call(this);
/*!
betajs-media-components - v0.0.67 - 2017-09-13
Copyright (c) Ziggeo,Oliver Friedmann
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.MediaComponents');
Scoped.binding('base', 'global:BetaJS');
Scoped.binding('browser', 'global:BetaJS.Browser');
Scoped.binding('flash', 'global:BetaJS.Flash');
Scoped.binding('media', 'global:BetaJS.Media');
Scoped.binding('dynamics', 'global:BetaJS.Dynamics');
Scoped.define("module:", function () {
	return {
    "guid": "7a20804e-be62-4982-91c6-98eb096d2e70",
    "version": "0.0.67"
};
});
Scoped.assumeVersion('base:version', '~1.0.96');
Scoped.assumeVersion('browser:version', '~1.0.65');
Scoped.assumeVersion('flash:version', '~0.0.18');
Scoped.assumeVersion('dynamics:version', '~0.0.83');
Scoped.assumeVersion('media:version', '~0.0.45');
Scoped.extend("module:Assets", ["module:Assets"], function (Assets) {
    var languages = {"language:ar":{"ba-videoplayer-playbutton.tooltip":"&#x627;&#x646;&#x642;&#x631; &#x644;&#x62A;&#x634;&#x63A;&#x64A;&#x644; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;.","ba-videoplayer-playbutton.rerecord":"&#x627;&#x639;&#x62F; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;","ba-videoplayer-playbutton.submit-video":"&#x62A;&#x623;&#x643;&#x64A;&#x62F; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videoplayer-loader.tooltip":"&#x62C;&#x627;&#x631; &#x62A;&#x62D;&#x645;&#x64A;&#x644; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648; ...","ba-videoplayer-controlbar.change-resolution":"&#x62A;&#x63A;&#x64A;&#x64A;&#x631; &#x627;&#x644;&#x62F;&#x642;&#x629;","ba-videoplayer-controlbar.video-progress":"&#x62A;&#x642;&#x62F;&#x645; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videoplayer-controlbar.rerecord-video":"&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;&#x61F;","ba-videoplayer-controlbar.submit-video":"&#x62A;&#x623;&#x643;&#x64A;&#x62F; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videoplayer-controlbar.play-video":"&#x634;&#x63A;&#x644; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videoplayer-controlbar.pause-video":"&#x625;&#x64A;&#x642;&#x627;&#x641; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648; &#x645;&#x624;&#x642;&#x62A;&#x627;","ba-videoplayer-controlbar.elapsed-time":"&#x627;&#x644;&#x648;&#x642;&#x62A; &#x627;&#x644;&#x645;&#x646;&#x642;&#x636;&#x64A;","ba-videoplayer-controlbar.total-time":"&#x637;&#x648;&#x644; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648; &#x627;&#x644;&#x643;&#x644;&#x64A;","ba-videoplayer-controlbar.fullscreen-video":"&#x639;&#x631;&#x636; &#x645;&#x644;&#x621; &#x627;&#x644;&#x634;&#x627;&#x634;&#x629;","ba-videoplayer-controlbar.volume-button":"&#x62A;&#x639;&#x64A;&#x64A;&#x646; &#x645;&#x633;&#x62A;&#x648;&#x649; &#x627;&#x644;&#x635;&#x648;&#x62A;","ba-videoplayer-controlbar.volume-mute":"&#x643;&#x62A;&#x645; &#x627;&#x644;&#x635;&#x648;&#x62A;","ba-videoplayer-controlbar.volume-unmute":"&#x625;&#x644;&#x63A;&#x627;&#x621; &#x643;&#x62A;&#x645; &#x627;&#x644;&#x635;&#x648;&#x62A;","ba-videoplayer.video-error":"&#x644;&#x642;&#x62F; &#x62D;&#x62F;&#x62B; &#x62E;&#x637;&#x623;&#x60C; &#x631;&#x62C;&#x627;&#x621; &#x623;&#x639;&#x62F; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629; &#x644;&#x627;&#x62D;&#x642;&#x627;. &#x627;&#x646;&#x642;&#x631; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videorecorder-chooser.record-video":"&#x62A;&#x633;&#x62C;&#x64A;&#x644; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videorecorder-chooser.upload-video":"&#x631;&#x641;&#x639; &#x641;&#x64A;&#x62F;&#x64A;&#x648;","ba-videorecorder-controlbar.settings":"&#x625;&#x639;&#x62F;&#x627;&#x62F;&#x627;&#x62A;","ba-videorecorder-controlbar.camerahealthy":"&#x627;&#x644;&#x625;&#x636;&#x627;&#x621;&#x629; &#x62C;&#x64A;&#x62F;&#x629;","ba-videorecorder-controlbar.cameraunhealthy":"&#x627;&#x644;&#x625;&#x636;&#x627;&#x621;&#x629; &#x644;&#x64A;&#x633;&#x62A; &#x627;&#x644;&#x623;&#x645;&#x62B;&#x644;","ba-videorecorder-controlbar.microphonehealthy":"&#x627;&#x644;&#x635;&#x648;&#x62A; &#x62C;&#x64A;&#x62F;","ba-videorecorder-controlbar.microphoneunhealthy":"&#x644;&#x627; &#x64A;&#x645;&#x643;&#x646; &#x627;&#x644;&#x62A;&#x642;&#x627;&#x637; &#x623;&#x64A; &#x635;&#x648;&#x62A;","ba-videorecorder-controlbar.record":"&#x633;&#x62C;&#x644;","ba-videorecorder-controlbar.record-tooltip":"&#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x644;&#x62A;&#x633;&#x62C;&#x64A;&#x644;.","ba-videorecorder-controlbar.rerecord":"&#x627;&#x639;&#x62F; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;","ba-videorecorder-controlbar.rerecord-tooltip":"&#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x644;&#x625;&#x639;&#x627;&#x62F;&#x629;.","ba-videorecorder-controlbar.upload-covershot":"&#x631;&#x641;&#x639; &#x635;&#x648;&#x631;&#x629; &#x627;&#x644;&#x648;&#x627;&#x62C;&#x647;&#x629;.","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x62A;&#x62D;&#x645;&#x64A;&#x644; &#x644;&#x642;&#x637;&#x629; &#x645;&#x62E;&#x635;&#x635;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videorecorder-controlbar.stop":"&#x62A;&#x648;&#x642;&#x641;","ba-videorecorder-controlbar.stop-tooltip":"&#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x644;&#x62A;&#x648;&#x642;&#x641;.","ba-videorecorder-controlbar.skip":"&#x62A;&#x62E;&#x637;&#x649;","ba-videorecorder-controlbar.skip-tooltip":"&#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x644;&#x62A;&#x62E;&#x637;&#x64A;.","ba-videorecorder.recorder-error":"&#x644;&#x642;&#x62F; &#x62D;&#x62F;&#x62B; &#x62E;&#x637;&#x623;&#x60C; &#x631;&#x62C;&#x627;&#x621; &#x623;&#x639;&#x62F; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629; &#x644;&#x627;&#x62D;&#x642;&#x627;. &#x627;&#x646;&#x642;&#x631; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videorecorder.attach-error":"&#x644;&#x645; &#x646;&#x62A;&#x645;&#x643;&#x646; &#x645;&#x646; &#x627;&#x644;&#x648;&#x635;&#x648;&#x644; &#x625;&#x644;&#x649; &#x648;&#x627;&#x62C;&#x647;&#x629; &#x627;&#x644;&#x643;&#x627;&#x645;&#x64A;&#x631;&#x627;. &#x627;&#x639;&#x62A;&#x645;&#x627;&#x62F;&#x627; &#x639;&#x644;&#x649; &#x627;&#x644;&#x62C;&#x647;&#x627;&#x632; &#x648;&#x627;&#x644;&#x645;&#x62A;&#x635;&#x641;&#x62D;&#x60C; &#x642;&#x62F; &#x62A;&#x62D;&#x62A;&#x627;&#x62C; &#x625;&#x644;&#x649; &#x62A;&#x62B;&#x628;&#x64A;&#x62A; &#x641;&#x644;&#x627;&#x634; &#x623;&#x648; &#x627;&#x644;&#x648;&#x635;&#x648;&#x644; &#x625;&#x644;&#x649; &#x627;&#x644;&#x635;&#x641;&#x62D;&#x629; &#x639;&#x628;&#x631; &#x645;&#x62A;&#x635;&#x641;&#x62D; &#x627;&#x62E;&#x631;.","ba-videorecorder.access-forbidden":"&#x62A;&#x645; &#x62D;&#x638;&#x631; &#x627;&#x644;&#x62F;&#x62E;&#x648;&#x644; &#x625;&#x644;&#x649; &#x627;&#x644;&#x643;&#x627;&#x645;&#x64A;&#x631;&#x627;. &#x627;&#x646;&#x642;&#x631; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;","ba-videorecorder.pick-covershot":"&#x627;&#x62E;&#x62A;&#x64A;&#x627;&#x631; &#x635;&#x648;&#x631;&#x629; &#x627;&#x644;&#x648;&#x627;&#x62C;&#x647;&#x629;.","ba-videorecorder.uploading":"&#x62C;&#x627;&#x631;&#x64A; &#x627;&#x644;&#x631;&#x641;&#x639;","ba-videorecorder.uploading-failed":"&#x641;&#x634;&#x644; &#x641;&#x64A; &#x627;&#x644;&#x631;&#x641;&#x639; - &#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videorecorder.verifying":"&#x62C;&#x627;&#x631;&#x64A; &#x627;&#x644;&#x62A;&#x62D;&#x642;&#x642;","ba-videorecorder.verifying-failed":"&#x641;&#x634;&#x644; &#x639;&#x645;&#x644;&#x64A;&#x629; &#x627;&#x644;&#x62A;&#x62D;&#x642;&#x642; - &#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videorecorder.rerecord-confirm":"&#x62A;&#x622;&#x643;&#x64A;&#x62F; &#x627;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;&#x61F;","ba-videorecorder.video_file_too_large":"&#x645;&#x644;&#x641; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648; &#x643;&#x628;&#x64A;&#x631; &#x62C;&#x62F;&#x627; (&#x66A; s) - &#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629; &#x628;&#x627;&#x633;&#x62A;&#x62E;&#x62F;&#x627;&#x645; &#x645;&#x644;&#x641; &#x641;&#x64A;&#x62F;&#x64A;&#x648; &#x623;&#x635;&#x63A;&#x631;.","ba-videorecorder.unsupported_video_type":"&#x635;&#x64A;&#x63A;&#x629; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648; &#x63A;&#x64A;&#x631; &#x645;&#x62F;&#x639;&#x648;&#x645;&#x629; :&#x66A; s - &#x627;&#x646;&#x642;&#x631; &#x647;&#x646;&#x627; &#x644;&#x625;&#x639;&#x627;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62D;&#x627;&#x648;&#x644;&#x629;.","ba-videoplayer-controlbar.exit-fullscreen-video":"&#x627;&#x644;&#x62E;&#x631;&#x648;&#x62C; &#x645;&#x646; &#x627;&#x644;&#x634;&#x627;&#x634;&#x629; &#x627;&#x644;&#x643;&#x627;&#x645;&#x644;&#x629;","ba-videoplayer-share.share":"&#x634;&#x627;&#x631;&#x643; &#x627;&#x644;&#x641;&#x64A;&#x62F;&#x64A;&#x648;"},"language:az":{"ba-videoplayer-playbutton.tooltip":"Videoya baxmaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videoplayer-playbutton.rerecord":"Yenid&#x259;n yazmaq","ba-videoplayer-playbutton.submit-video":"Videonu t&#x259;sdiq et","ba-videoplayer-loader.tooltip":"Video y&#xFC;kl&#x259;nir ...","ba-videoplayer-controlbar.change-resolution":"G&#xF6;r&#xFC;nt&#xFC;n&#xFC;n keyfiyy&#x259;tini d&#x259;yi&#x15F;","ba-videoplayer-controlbar.video-progress":"Videonun davamiyy&#x259;ti","ba-videoplayer-controlbar.rerecord-video":"Video yenid&#x259;n yaz&#x131;ls&#x131;n?","ba-videoplayer-controlbar.submit-video":"Videonu t&#x259;sdiq et","ba-videoplayer-controlbar.play-video":"Videonu g&#xF6;st&#x259;r","ba-videoplayer-controlbar.pause-video":"Videonu dayand&#x131;r","ba-videoplayer-controlbar.elapsed-time":"G&#xF6;st&#x259;rilmi&#x15F; vaxt","ba-videoplayer-controlbar.total-time":"Videonu tam uzunlu&#x11F;u","ba-videoplayer-controlbar.fullscreen-video":"Tam ekran edin","ba-videoplayer-controlbar.volume-button":"S&#x259;s d&#xFC;ym&#x259;si","ba-videoplayer-controlbar.volume-mute":"S&#x259;ssiz et","ba-videoplayer-controlbar.volume-unmute":"S&#x259;sli et","ba-videoplayer.video-error":"X&#x259;ta ba&#x15F; vermi&#x15F;dir. Xahi&#x15F; edirik bir az sonra yenid&#x259;n c&#x259;hd edin. Yenid&#x259;n yoxlamaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder-chooser.record-video":"Videonu yaz","ba-videorecorder-chooser.upload-video":"Videonu y&#xFC;kl&#x259;","ba-videorecorder-controlbar.settings":"Ayarlar","ba-videorecorder-controlbar.camerahealthy":"&#x130;&#x15F;&#x131;qland&#x131;rma yax&#x15F;&#x131;d&#x131;r","ba-videorecorder-controlbar.cameraunhealthy":"&#x130;&#x15F;&#x131;qland&#x131;rma optimal deyil","ba-videorecorder-controlbar.microphonehealthy":"S&#x259;s yax&#x15F;&#x131; e&#x15F;idilir","ba-videorecorder-controlbar.microphoneunhealthy":"Mikrofonun s&#x259;si e&#x15F;idilmir","ba-videorecorder-controlbar.record":"Yazmaq","ba-videorecorder-controlbar.record-tooltip":"Videonu yazmaq &#xFC;&#xE7;&#xFC;n bas&#x131;n","ba-videorecorder-controlbar.rerecord":"Videonu yenid&#x259;n yaz","ba-videorecorder-controlbar.rerecord-tooltip":"Yenid&#x259;n yazmaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder-controlbar.upload-covershot":"Y&#xFC;kl&#x259;","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#xDC;zl&#xFC;k &#x15F;&#x259;kli y&#xFC;kl&#x259;m&#x259;k &#xFC;&#xE7;&#xFC;n bas&#x131;n","ba-videorecorder-controlbar.stop":"Dayand&#x131;rmaq","ba-videorecorder-controlbar.stop-tooltip":"Dayand&#x131;rmaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder-controlbar.skip":"N&#x259;z&#x259;r&#x259; alma","ba-videorecorder-controlbar.skip-tooltip":"N&#x259;z&#x259;r&#x259; almadan ke&#xE7;m&#x259;k &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder.recorder-error":"X&#x259;ta ba&#x15F; verdi. Xahi&#x15F; edirik bir az sonra yenid&#x259;n c&#x259;hd edin. Yenid&#x259;n yoxlamaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder.attach-error":"Kamera g&#xF6;r&#xFC;nt&#xFC;s&#xFC;n&#xFC; &#x259;ld&#x259; etm&#x259;k m&#xFC;mk&#xFC;n olmad&#x131;. Sizin istifad&#x259; etdiyiniz cihazdan v&#x259; brauzerd&#x259;n as&#x131;l&#x131; olaraq siz ya Flash proqram&#x131; y&#xFC;kl&#x259;nm&#x259;li v&#x259; ya veb s&#x259;hif&#x259;y&#x259; SSL il&#x259; daxil olmal&#x131;s&#x131;z.","ba-videorecorder.access-forbidden":"Kamera g&#xF6;r&#xFC;nt&#xFC;s&#xFC;n&#x259; icaz&#x259; verilm&#x259;di. Yenid&#x259;n yoxlamaq &#xFC;&#xE7;&#xFC;n bas&#x131;n.","ba-videorecorder.pick-covershot":"&#xDC;zl&#xFC;k &#x15F;&#x259;klini se&#xE7;in.","ba-videorecorder.uploading":"Y&#xFC;kl&#x259;nir","ba-videorecorder.uploading-failed":"Y&#xFC;kl&#x259;nm&#x259; zaman&#x131; x&#x259;ta ba&#x15F; verdi, t&#x259;krar etm&#x259;k &#xFC;&#xE7;&#xFC;n buraya bas&#x131;n.","ba-videorecorder.verifying":"Yoxlama","ba-videorecorder.verifying-failed":"Yoxlama u&#x11F;ursuzluqla bitdi - t&#x259;krar &#xFC;&#xE7;&#xFC;n buraya bas&#x131;n.","ba-videorecorder.rerecord-confirm":"Siz, h&#x259;qiq&#x259;t&#x259;n, videonu yenid&#x259;n yazmaq ist&#x259;yirsiniz?","ba-videorecorder.video_file_too_large":"Sizin video fayl&#x131;n h&#x259;cmi (%s) &#xE7;ox b&#xF6;y&#xFC;kd&#xFC;r - ki&#xE7;ik h&#x259;cmli video fayl il&#x259; yenid&#x259;n c&#x259;hd &#xFC;&#xE7;&#xFC;n buraya bas&#x131;n.","ba-videorecorder.unsupported_video_type":"Y&#xFC;kl&#x259;yin: %s - yenid&#x259;n yoxlamaq &#xFC;&#xE7;&#xFC;n buraya bas&#x131;n.","ba-videoplayer-controlbar.exit-fullscreen-video":"Tam ekran rejimind&#x259;n &#xE7;&#x131;x&#x131;&#x15F;","ba-videoplayer-share.share":"Videonu payla&#x15F;"},"language:bg":{"ba-videoplayer-playbutton.tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435;, &#x437;&#x430; &#x434;&#x430; &#x438;&#x433;&#x440;&#x430;&#x44F;&#x442; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;.","ba-videoplayer-playbutton.rerecord":"&#x440;&#x435;&#x43C;&#x43E;&#x43D;&#x442;&#x438;&#x440;&#x430;&#x43C;","ba-videoplayer-playbutton.submit-video":"&#x41F;&#x43E;&#x442;&#x432;&#x44A;&#x440;&#x436;&#x434;&#x430;&#x432;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-loader.tooltip":"&#x417;&#x430;&#x440;&#x435;&#x436;&#x434;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E; ...","ba-videoplayer-controlbar.change-resolution":"&#x41F;&#x440;&#x43E;&#x43C;&#x44F;&#x43D;&#x430; &#x43D;&#x430; &#x440;&#x430;&#x437;&#x434;&#x435;&#x43B;&#x438;&#x442;&#x435;&#x43B;&#x43D;&#x430;&#x442;&#x430; &#x441;&#x43F;&#x43E;&#x441;&#x43E;&#x431;&#x43D;&#x43E;&#x441;&#x442;","ba-videoplayer-controlbar.video-progress":"&#x43F;&#x440;&#x43E;&#x433;&#x440;&#x435;&#x441; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.rerecord-video":"&#x412;&#x44A;&#x437;&#x441;&#x442;&#x430;&#x43D;&#x43E;&#x432;&#x44F;&#x432;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;?","ba-videoplayer-controlbar.submit-video":"&#x41F;&#x43E;&#x442;&#x432;&#x44A;&#x440;&#x436;&#x434;&#x430;&#x432;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.play-video":"&#x432;&#x44A;&#x437;&#x43F;&#x440;&#x43E;&#x438;&#x437;&#x432;&#x435;&#x436;&#x434;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.pause-video":"Pause &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.elapsed-time":"Elasped &#x432;&#x440;&#x435;&#x43C;&#x435;","ba-videoplayer-controlbar.total-time":"&#x41E;&#x431;&#x449;&#x430; &#x434;&#x44A;&#x43B;&#x436;&#x438;&#x43D;&#x430; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.fullscreen-video":"&#x412;&#x44A;&#x432;&#x435;&#x434;&#x435;&#x442;&#x435; &#x446;&#x44F;&#x43B; &#x435;&#x43A;&#x440;&#x430;&#x43D;","ba-videoplayer-controlbar.volume-button":"Set &#x43E;&#x431;&#x435;&#x43C;","ba-videoplayer-controlbar.volume-mute":"Mute &#x437;&#x432;&#x443;&#x43A;","ba-videoplayer-controlbar.volume-unmute":"&#x438;&#x437;&#x43A;&#x43B;&#x44E;&#x447;&#x432;&#x430;&#x43D;&#x435; &#x43D;&#x430; &#x437;&#x432;&#x443;&#x43A;&#x430;","ba-videoplayer.video-error":"&#x412;&#x44A;&#x437;&#x43D;&#x438;&#x43A;&#x43D;&#x430; &#x433;&#x440;&#x435;&#x448;&#x43A;&#x430;. &#x41C;&#x43E;&#x43B;&#x44F;, &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x439;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E; &#x43F;&#x43E;-&#x43A;&#x44A;&#x441;&#x43D;&#x43E;. &#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder-chooser.record-video":"&#x417;&#x430;&#x43F;&#x438;&#x448;&#x435;&#x442;&#x435; &#x432;&#x430;&#x448;&#x438;&#x442;&#x435; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-chooser.upload-video":"&#x41A;&#x430;&#x447;&#x438; &#x412;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-controlbar.settings":"&#x41D;&#x430;&#x441;&#x442;&#x440;&#x43E;&#x439;&#x43A;&#x438;","ba-videorecorder-controlbar.camerahealthy":"&#x41E;&#x441;&#x432;&#x435;&#x442;&#x43B;&#x435;&#x43D;&#x438;&#x435;&#x442;&#x43E; &#x435; &#x434;&#x43E;&#x431;&#x440;&#x43E;","ba-videorecorder-controlbar.cameraunhealthy":"&#x41E;&#x441;&#x432;&#x435;&#x442;&#x43B;&#x435;&#x43D;&#x438;&#x435; &#x43D;&#x435; &#x435; &#x43E;&#x43F;&#x442;&#x438;&#x43C;&#x430;&#x43B;&#x43D;&#x43E;","ba-videorecorder-controlbar.microphonehealthy":"&#x417;&#x432;&#x443;&#x43A;&#x44A;&#x442; &#x435; &#x434;&#x43E;&#x431;&#x44A;&#x440;","ba-videorecorder-controlbar.microphoneunhealthy":"&#x41D;&#x435; &#x43C;&#x43E;&#x436;&#x435; &#x434;&#x430; &#x432;&#x437;&#x435;&#x43C;&#x435;&#x442;&#x435; &#x432;&#x441;&#x435;&#x43A;&#x438; &#x437;&#x432;&#x443;&#x43A;","ba-videorecorder-controlbar.record":"&#x440;&#x435;&#x43A;&#x43E;&#x440;&#x434;","ba-videorecorder-controlbar.record-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x437;&#x430;&#x43F;&#x438;&#x448;&#x435;&#x442;&#x435;.","ba-videorecorder-controlbar.rerecord":"&#x440;&#x435;&#x43C;&#x43E;&#x43D;&#x442;&#x438;&#x440;&#x430;&#x43C;","ba-videorecorder-controlbar.rerecord-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x440;&#x435;&#x43C;&#x43E;&#x43D;&#x442;&#x438;&#x440;&#x430;&#x43C;.","ba-videorecorder-controlbar.upload-covershot":"&#x41A;&#x430;&#x447;&#x438;","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43A;&#x430;&#x447;&#x438;&#x442;&#x435; &#x43F;&#x43E;&#x442;&#x440;&#x435;&#x431;&#x438;&#x442;&#x435;&#x43B;&#x441;&#x43A;&#x438; &#x43F;&#x43E;&#x43A;&#x440;&#x438;&#x442;&#x438;&#x435; &#x443;&#x434;&#x430;&#x440;","ba-videorecorder-controlbar.stop":"&#x421;&#x43F;&#x440;&#x438; &#x441;&#x435;","ba-videorecorder-controlbar.stop-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x441;&#x43F;&#x440;&#x435;.","ba-videorecorder-controlbar.skip":"&#x43F;&#x43E;&#x434;&#x441;&#x43A;&#x430;&#x447;&#x430;&#x43C;","ba-videorecorder-controlbar.skip-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43F;&#x440;&#x43E;&#x43F;&#x443;&#x441;&#x43D;&#x435;&#x442;&#x435;.","ba-videorecorder.recorder-error":"&#x412;&#x44A;&#x437;&#x43D;&#x438;&#x43A;&#x43D;&#x430; &#x433;&#x440;&#x435;&#x448;&#x43A;&#x430;. &#x41C;&#x43E;&#x43B;&#x44F;, &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x439;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E; &#x43F;&#x43E;-&#x43A;&#x44A;&#x441;&#x43D;&#x43E;. &#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.attach-error":"&#x41D;&#x438;&#x435; &#x43D;&#x435; &#x43C;&#x43E;&#x436;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43B;&#x443;&#x447;&#x438;&#x442;&#x435; &#x434;&#x43E;&#x441;&#x442;&#x44A;&#x43F; &#x434;&#x43E; &#x438;&#x43D;&#x442;&#x435;&#x440;&#x444;&#x435;&#x439;&#x441;&#x430; &#x43D;&#x430; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x430;&#x442;&#x430;. &#x412; &#x437;&#x430;&#x432;&#x438;&#x441;&#x438;&#x43C;&#x43E;&#x441;&#x442; &#x43E;&#x442; &#x443;&#x441;&#x442;&#x440;&#x43E;&#x439;&#x441;&#x442;&#x432;&#x43E;&#x442;&#x43E; &#x438; &#x431;&#x440;&#x430;&#x443;&#x437;&#x44A;&#x440;&#x430;, &#x43C;&#x43E;&#x436;&#x435; &#x434;&#x430; &#x441;&#x435; &#x43D;&#x430;&#x43B;&#x43E;&#x436;&#x438; &#x434;&#x430; &#x438;&#x43D;&#x441;&#x442;&#x430;&#x43B;&#x438;&#x440;&#x430;&#x442;&#x435; Flash &#x438;&#x43B;&#x438; &#x434;&#x43E;&#x441;&#x442;&#x44A;&#x43F; &#x434;&#x43E; &#x441;&#x442;&#x440;&#x430;&#x43D;&#x438;&#x446;&#x430;&#x442;&#x430; &#x447;&#x440;&#x435;&#x437; SSL.","ba-videorecorder.access-forbidden":"&#x414;&#x43E;&#x441;&#x442;&#x44A;&#x43F; &#x434;&#x43E; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x430;&#x442;&#x430; &#x435; &#x437;&#x430;&#x431;&#x440;&#x430;&#x43D;&#x435;&#x43D;&#x43E;. &#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.pick-covershot":"&#x418;&#x437;&#x431;&#x435;&#x440;&#x435;&#x442;&#x435; covershot.","ba-videorecorder.uploading":"&#x41A;&#x430;&#x447;&#x432;&#x430;&#x43D;&#x435;","ba-videorecorder.uploading-failed":"&#x41A;&#x430;&#x447;&#x432;&#x430; &#x441;&#x435; &#x43F;&#x440;&#x43E;&#x432;&#x430;&#x43B;&#x438; - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.verifying":"&#x41F;&#x440;&#x43E;&#x432;&#x435;&#x440;&#x43A;&#x430;","ba-videorecorder.verifying-failed":"&#x423;&#x434;&#x43E;&#x441;&#x442;&#x43E;&#x432;&#x435;&#x440;&#x44F;&#x432;&#x430;&#x43D;&#x435;&#x442;&#x43E; &#x441;&#x435; &#x43F;&#x440;&#x43E;&#x432;&#x430;&#x43B;&#x438; - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.rerecord-confirm":"&#x41D;&#x430;&#x438;&#x441;&#x442;&#x438;&#x43D;&#x430; &#x43B;&#x438; &#x438;&#x441;&#x43A;&#x430;&#x442;&#x435; &#x434;&#x430; &#x440;&#x435;&#x43C;&#x43E;&#x43D;&#x442;&#x438;&#x440;&#x430;&#x43C; &#x432;&#x438;&#x434;&#x435;&#x43E; &#x441;&#x438;?","ba-videorecorder.video_file_too_large":"&#x412;&#x430;&#x448;&#x438;&#x44F;&#x442; &#x432;&#x438;&#x434;&#x435;&#x43E; &#x444;&#x430;&#x439;&#x43B; &#x435; &#x442;&#x432;&#x44A;&#x440;&#x434;&#x435; &#x433;&#x43E;&#x43B;&#x44F;&#x43C; (%s) - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E; &#x441; &#x43F;&#x43E;-&#x43C;&#x430;&#x43B;&#x44A;&#x43A; &#x432;&#x438;&#x434;&#x435;&#x43E; &#x444;&#x430;&#x439;&#x43B;.","ba-videorecorder.unsupported_video_type":"&#x41C;&#x43E;&#x43B;&#x44F;, &#x43A;&#x430;&#x447;&#x435;&#x442;&#x435;: %s - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x435;&#x442;&#x435; &#x442;&#x443;&#x43A;, &#x437;&#x430; &#x434;&#x430; &#x43E;&#x43F;&#x438;&#x442;&#x430;&#x442;&#x435; &#x43E;&#x442;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videoplayer-controlbar.exit-fullscreen-video":"&#x418;&#x437;&#x43B;&#x438;&#x437;&#x430;&#x43D;&#x435; &#x43E;&#x442; &#x446;&#x44F;&#x43B; &#x200B;&#x200B;&#x435;&#x43A;&#x440;&#x430;&#x43D;","ba-videoplayer-share.share":"&#x421;&#x43F;&#x43E;&#x434;&#x435;&#x43B;&#x44F;&#x43D;&#x435; &#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;&#x43A;&#x43B;&#x438;&#x43F;"},"language:cat":{"ba-videoplayer-playbutton.tooltip":"Feu clic per veure el v&#xED;deo.","ba-videoplayer-playbutton.rerecord":"refer","ba-videoplayer-playbutton.submit-video":"confirmar v&#xED;deo","ba-videoplayer-loader.tooltip":"Carregant v&#xED;deo ...","ba-videoplayer-controlbar.change-resolution":"Canviar la resoluci&#xF3;","ba-videoplayer-controlbar.video-progress":"el progr&#xE9;s de v&#xED;deo","ba-videoplayer-controlbar.rerecord-video":"Torneu a fer el v&#xED;deo?","ba-videoplayer-controlbar.submit-video":"confirmar v&#xED;deo","ba-videoplayer-controlbar.play-video":"reproducci&#xF3; de v&#xED;deo","ba-videoplayer-controlbar.pause-video":"pausa de v&#xED;deo","ba-videoplayer-controlbar.elapsed-time":"temps Elasped","ba-videoplayer-controlbar.total-time":"Durada total de v&#xED;deo","ba-videoplayer-controlbar.fullscreen-video":"Introdu&#xEF;u a pantalla completa","ba-videoplayer-controlbar.volume-button":"volum de s&#xE8;ries","ba-videoplayer-controlbar.volume-mute":"silenciar so","ba-videoplayer-controlbar.volume-unmute":"activar so","ba-videoplayer.video-error":"Hi ha hagut un error. Siusplau, torni a intentar-ho m&#xE9;s tard. Feu clic per tornar a intentar-ho.","ba-videorecorder-chooser.record-video":"Gravar el v&#xED;deo","ba-videorecorder-chooser.upload-video":"Pujar v&#xED;deo","ba-videorecorder-controlbar.settings":"ajustos","ba-videorecorder-controlbar.camerahealthy":"La il&#xB7;luminaci&#xF3; &#xE9;s bona","ba-videorecorder-controlbar.cameraunhealthy":"La il&#xB7;luminaci&#xF3; no &#xE9;s &#xF2;ptima","ba-videorecorder-controlbar.microphonehealthy":"El so &#xE9;s bo","ba-videorecorder-controlbar.microphoneunhealthy":"No es pot recollir qualsevol so","ba-videorecorder-controlbar.record":"registre","ba-videorecorder-controlbar.record-tooltip":"Feu clic aqu&#xED; per gravar.","ba-videorecorder-controlbar.rerecord":"refer","ba-videorecorder-controlbar.rerecord-tooltip":"Cliqueu aqu&#xED; per fer de nou.","ba-videorecorder-controlbar.upload-covershot":"Pujar","ba-videorecorder-controlbar.upload-covershot-tooltip":"Feu clic aqu&#xED; per pujar foto de portada personalitzada","ba-videorecorder-controlbar.stop":"aturar","ba-videorecorder-controlbar.stop-tooltip":"Feu clic aqu&#xED; per aturar.","ba-videorecorder-controlbar.skip":"Omet","ba-videorecorder-controlbar.skip-tooltip":"Feu clic aqu&#xED; per saltar.","ba-videorecorder.recorder-error":"Hi ha hagut un error. Siusplau, torni a intentar-ho m&#xE9;s tard. Feu clic per tornar a intentar-ho.","ba-videorecorder.attach-error":"No hem pogut accedir a la interf&#xED;cie de la c&#xE0;mera. En funci&#xF3; del dispositiu i del navegador, &#xE9;s possible que hagi de instal &#xB7; lar Flash o accedir a la p&#xE0;gina a trav&#xE9;s de SSL.","ba-videorecorder.access-forbidden":"Estava prohibit l&#x27;acc&#xE9;s a la c&#xE0;mera. Feu clic per tornar a intentar-ho.","ba-videorecorder.pick-covershot":"Tria una covershot.","ba-videorecorder.uploading":"pujant","ba-videorecorder.uploading-failed":"C&#xE0;rrega fallat - fer clic aqu&#xED; per tornar a intentar-ho.","ba-videorecorder.verifying":"verificant","ba-videorecorder.verifying-failed":"fallat la verificaci&#xF3; de - fer clic aqu&#xED; per tornar a intentar-ho.","ba-videorecorder.rerecord-confirm":"De veritat vol tornar a fer el v&#xED;deo?","ba-videorecorder.video_file_too_large":"L&#x27;arxiu de v&#xED;deo &#xE9;s massa gran (%s) - fer clic aqu&#xED; per tornar a intentar-ho amb un arxiu de v&#xED;deo m&#xE9;s petita.","ba-videorecorder.unsupported_video_type":"Si us plau, puja: %s - fer clic aqu&#xED; per tornar a intentar-ho.","ba-videoplayer-controlbar.exit-fullscreen-video":"Surt de la pantalla completa","ba-videoplayer-share.share":"compartir v&#xED;deo"},"language:da":{"ba-videoplayer-playbutton.tooltip":"Klik for at afspille video.","ba-videoplayer-playbutton.rerecord":"redo","ba-videoplayer-playbutton.submit-video":"Bekr&#xE6;ft video","ba-videoplayer-loader.tooltip":"Indl&#xE6;ser video ...","ba-videoplayer-controlbar.change-resolution":"Skift opl&#xF8;sning","ba-videoplayer-controlbar.video-progress":"fremskridt Video","ba-videoplayer-controlbar.rerecord-video":"Redo video?","ba-videoplayer-controlbar.submit-video":"Bekr&#xE6;ft video","ba-videoplayer-controlbar.play-video":"Afspil video","ba-videoplayer-controlbar.pause-video":"Pause video","ba-videoplayer-controlbar.elapsed-time":"Elasped tid","ba-videoplayer-controlbar.total-time":"Samlet l&#xE6;ngde af video","ba-videoplayer-controlbar.fullscreen-video":"Indtast fullscreen","ba-videoplayer-controlbar.volume-button":"Indstil lydstyrke","ba-videoplayer-controlbar.volume-mute":"Sl&#xE5; lyden","ba-videoplayer-controlbar.volume-unmute":"Sl&#xE5; lyden til","ba-videoplayer.video-error":"Der opstod en fejl. Pr&#xF8;v venligst igen senere. Klik for at pr&#xF8;ve igen.","ba-videorecorder-chooser.record-video":"Optag din video","ba-videorecorder-chooser.upload-video":"Upload video","ba-videorecorder-controlbar.settings":"Indstillinger","ba-videorecorder-controlbar.camerahealthy":"Belysning er god","ba-videorecorder-controlbar.cameraunhealthy":"Belysning er ikke optimal","ba-videorecorder-controlbar.microphonehealthy":"Lyden er god","ba-videorecorder-controlbar.microphoneunhealthy":"Kan ikke afhente nogen lyd","ba-videorecorder-controlbar.record":"Optage","ba-videorecorder-controlbar.record-tooltip":"Klik her for at optage.","ba-videorecorder-controlbar.rerecord":"redo","ba-videorecorder-controlbar.rerecord-tooltip":"Klik her for at gentage.","ba-videorecorder-controlbar.upload-covershot":"Upload","ba-videorecorder-controlbar.upload-covershot-tooltip":"Klik her for at uploade brugerdefinerede d&#xE6;kning shot","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"Klik her for at stoppe.","ba-videorecorder-controlbar.skip":"Springe","ba-videorecorder-controlbar.skip-tooltip":"Klik her for at springe.","ba-videorecorder.recorder-error":"Der opstod en fejl. Pr&#xF8;v venligst igen senere. Klik for at pr&#xF8;ve igen.","ba-videorecorder.attach-error":"Vi kunne ikke f&#xE5; adgang til kameraet interface. Afh&#xE6;ngigt af enheden og browseren, skal du muligvis installere Flash eller adgang til siden via SSL.","ba-videorecorder.access-forbidden":"Adgang til kameraet var forbudt. Klik for at pr&#xF8;ve igen.","ba-videorecorder.pick-covershot":"V&#xE6;lg en covershot.","ba-videorecorder.uploading":"Upload","ba-videorecorder.uploading-failed":"Upload mislykkedes - klik her for at pr&#xF8;ve igen.","ba-videorecorder.verifying":"Bekr&#xE6;ftelse","ba-videorecorder.verifying-failed":"mislykkedes verificering - klik her for at pr&#xF8;ve igen.","ba-videorecorder.rerecord-confirm":"Vil du virkelig &#xF8;nsker at gentage din video?","ba-videorecorder.video_file_too_large":"Din video filen er for stor (%s) - klik her for at pr&#xF8;ve igen med et mindre videofil.","ba-videorecorder.unsupported_video_type":"upload venligst: %s - klik her for at pr&#xF8;ve igen.","ba-videoplayer-controlbar.exit-fullscreen-video":"Afslut fuldsk&#xE6;rm","ba-videoplayer-share.share":"Del video"},"language:de":{"ba-videoplayer-playbutton.tooltip":"Hier clicken um Wiedergabe zu starten.","ba-videoplayer-playbutton.rerecord":"Video neu aufnehmen","ba-videoplayer-playbutton.submit-video":"Video akzeptieren","ba-videoplayer-loader.tooltip":"Video wird geladen...","ba-videoplayer-controlbar.change-resolution":"Aufl&#xF6;sung anpassen","ba-videoplayer-controlbar.video-progress":"Videofortschritt","ba-videoplayer-controlbar.rerecord-video":"Video erneut aufnehmen?","ba-videoplayer-controlbar.submit-video":"Video akzeptieren","ba-videoplayer-controlbar.play-video":"Video wiedergeben","ba-videoplayer-controlbar.pause-video":"Video pausieren","ba-videoplayer-controlbar.elapsed-time":"Vergangene Zeit","ba-videoplayer-controlbar.total-time":"L&#xE4;nge des Videos","ba-videoplayer-controlbar.fullscreen-video":"Vollbildmodus","ba-videoplayer-controlbar.volume-button":"Lautst&#xE4;rke regulieren","ba-videoplayer-controlbar.volume-mute":"Ton abstellen","ba-videoplayer-controlbar.volume-unmute":"Ton wieder einstellen","ba-videoplayer.video-error":"Es ist ein Fehler aufgetreten, bitte versuchen Sie es sp&#xE4;ter noch einmal. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder-chooser.record-video":"Video aufnehmen","ba-videorecorder-chooser.upload-video":"Video hochladen","ba-videorecorder-controlbar.settings":"Einstellungen","ba-videorecorder-controlbar.camerahealthy":"Gute Beleuchtung","ba-videorecorder-controlbar.cameraunhealthy":"Beleuchtung nicht optimal","ba-videorecorder-controlbar.microphonehealthy":"Soundqualit&#xE4;t einwandfrei","ba-videorecorder-controlbar.microphoneunhealthy":"Mikrofon bis jetzt stumm","ba-videorecorder-controlbar.record":"Video aufnehmen","ba-videorecorder-controlbar.record-tooltip":"Hier clicken um Aufnahme zu starten.","ba-videorecorder-controlbar.rerecord":"Video neu aufnehmen","ba-videorecorder-controlbar.rerecord-tooltip":"Hier clicken um Video erneut aufzunehmen.","ba-videorecorder-controlbar.upload-covershot":"Hochladen","ba-videorecorder-controlbar.upload-covershot-tooltip":"Hier clicken um einen Covershot hochzuladen.","ba-videorecorder-controlbar.stop":"Aufnahme stoppen","ba-videorecorder-controlbar.stop-tooltip":"Hier clicken um Aufnahme zu stoppen.","ba-videorecorder-controlbar.skip":"&#xDC;berspringen","ba-videorecorder-controlbar.skip-tooltip":"Hier clicken um zu &#xDC;berspringen.","ba-videorecorder.recorder-error":"Es ist ein Fehler aufgetreten, bitte versuchen Sie es sp&#xE4;ter noch einmal. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.attach-error":"Wir konnten nicht auf die Kamera zugreifen. Je nach Browser und Ger&#xE4;t muss m&#xF6;glicherweise Flash installiert oder die Seite &#xFC;ber SSL geladen werden.","ba-videorecorder.access-forbidden":"Kamerazugriff wurde verweigert. Hier klick, um es noch einmal zu probieren.","ba-videorecorder.pick-covershot":"Bitte w&#xE4;hlen Sie einen Covershot aus.","ba-videorecorder.uploading":"Hochladen","ba-videorecorder.uploading-failed":"Hochladen fehlgeschlagen. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.verifying":"Verifizieren","ba-videorecorder.verifying-failed":"Verifizierung fehlgeschlagen. Hier klicken, um es noch einmal zu probieren.","ba-videorecorder.rerecord-confirm":"M&#xF6;chten Sie Ihr Video wirklich noch einmal aufnehmen?","ba-videorecorder.video_file_too_large":"Die angegebene Videodatei ist zu gro&#xDF; (%s). Hier klicken, um eine kleinere Videodatei hochzuladen.","ba-videorecorder.unsupported_video_type":"Bitte laden Sie Dateien des folgenden Typs hoch: %s. Hier klicken, um es noch einmal zu probieren.","ba-videoplayer-controlbar.exit-fullscreen-video":"Den Vollbildmous verlassen","ba-videoplayer-share.share":"Video teilen"},"language:es":{"ba-videoplayer-playbutton.tooltip":"Haga clic para ver el video.","ba-videoplayer-playbutton.rerecord":"Regrabar","ba-videoplayer-playbutton.submit-video":"Confirmar v&#xED;deo","ba-videoplayer-loader.tooltip":"Cargando v&#xED;deo ...","ba-videoplayer-controlbar.change-resolution":"Cambiar la resoluci&#xF3;n","ba-videoplayer-controlbar.video-progress":"El progreso de v&#xED;deo","ba-videoplayer-controlbar.rerecord-video":"Regrab el v&#xED;deo?","ba-videoplayer-controlbar.submit-video":"Confirmar v&#xED;deo","ba-videoplayer-controlbar.play-video":"Reproduzca el video","ba-videoplayer-controlbar.pause-video":"Pausa de v&#xED;deo","ba-videoplayer-controlbar.elapsed-time":"Tiempo transcurrido","ba-videoplayer-controlbar.total-time":"Duraci&#xF3;n total de video","ba-videoplayer-controlbar.fullscreen-video":"Ingrese a pantalla completa","ba-videoplayer-controlbar.volume-button":"Boton de volumen","ba-videoplayer-controlbar.volume-mute":"Silenciar sonido","ba-videoplayer-controlbar.volume-unmute":"Activar sonido","ba-videoplayer.video-error":"Se produjo un error, por favor intente de nuevo m&#xE1;s tarde. Haga clic para volver a intentarlo.","ba-videorecorder-chooser.record-video":"Grabar el v&#xED;deo","ba-videorecorder-chooser.upload-video":"Subir v&#xED;deo","ba-videorecorder-controlbar.settings":"ajustes","ba-videorecorder-controlbar.camerahealthy":"La iluminaci&#xF3;n es buena","ba-videorecorder-controlbar.cameraunhealthy":"La iluminaci&#xF3;n no es &#xF3;ptima","ba-videorecorder-controlbar.microphonehealthy":"El sonido es bueno","ba-videorecorder-controlbar.microphoneunhealthy":"Problemas con sonido","ba-videorecorder-controlbar.record":"Grabar","ba-videorecorder-controlbar.record-tooltip":"Haga clic aqu&#xED; para grabar.","ba-videorecorder-controlbar.rerecord":"Rehacer","ba-videorecorder-controlbar.rerecord-tooltip":"Haga clic aqu&#xED; para grabar de nuevo.","ba-videorecorder-controlbar.upload-covershot":"Subir","ba-videorecorder-controlbar.upload-covershot-tooltip":"Haga clic aqu&#xED; para subir foto de portada personalizada","ba-videorecorder-controlbar.stop":"Detener","ba-videorecorder-controlbar.stop-tooltip":"Haga clic aqu&#xED; para detener.","ba-videorecorder-controlbar.skip":"Saltear","ba-videorecorder-controlbar.skip-tooltip":"Haga clic aqu&#xED; para saltear.","ba-videorecorder.recorder-error":"Se produjo un error, por favor intente de nuevo m&#xE1;s tarde. Haga clic para volver a intentarlo.","ba-videorecorder.attach-error":"No hemos podido acceder a la interfaz de la c&#xE1;mara. Dependiendo del dispositivo y del navegador, es posible que tenga que instalar Flash o acceder a la p&#xE1;gina a trav&#xE9;s de SSL.","ba-videorecorder.access-forbidden":"Acceso denegado a la c&#xE1;mara. Haga clic para volver a intentarlo.","ba-videorecorder.pick-covershot":"Elige una foto de cubierta.","ba-videorecorder.uploading":"Subiendo","ba-videorecorder.uploading-failed":"Carga fallada - hacer clic aqu&#xED; para volver a intentarlo.","ba-videorecorder.verifying":"verificando","ba-videorecorder.verifying-failed":"fal la verificaci&#xF3;n - hacer clic aqu&#xED; para volver a intentarlo.","ba-videorecorder.rerecord-confirm":"&#xBF;De verdad quiere volver a hacer el v&#xED;deo?","ba-videorecorder.video_file_too_large":"El archivo de v&#xED;deo es demasiado grande (%s) - hacer clic aqu&#xED; para volver a intentarlo con un archivo de v&#xED;deo m&#xE1;s peque&#xF1;o.","ba-videorecorder.unsupported_video_type":"Por favor, sube: %s - hacer clic aqu&#xED; para volver a intentarlo.","ba-videoplayer-controlbar.exit-fullscreen-video":"Salir de pantalla completa","ba-videoplayer-share.share":"Compartir video"},"language:fi":{"ba-videoplayer-playbutton.tooltip":"Toista video.","ba-videoplayer-playbutton.rerecord":"tehd&#xE4; uudelleen","ba-videoplayer-playbutton.submit-video":"vahvista video","ba-videoplayer-loader.tooltip":"Ladataan videota ...","ba-videoplayer-controlbar.change-resolution":"Muuta resoluutio","ba-videoplayer-controlbar.video-progress":"video edistyminen","ba-videoplayer-controlbar.rerecord-video":"Tee uudelleen video?","ba-videoplayer-controlbar.submit-video":"vahvista video","ba-videoplayer-controlbar.play-video":"Toista video","ba-videoplayer-controlbar.pause-video":"tauko video","ba-videoplayer-controlbar.elapsed-time":"Elasped aika","ba-videoplayer-controlbar.total-time":"Kokonaispituus video","ba-videoplayer-controlbar.fullscreen-video":"Anna koko n&#xE4;yt&#xF6;n","ba-videoplayer-controlbar.volume-button":"Set tilavuus","ba-videoplayer-controlbar.volume-mute":"&#xE4;&#xE4;nen mykistys","ba-videoplayer-controlbar.volume-unmute":"Poista mykistys","ba-videoplayer.video-error":"Tapahtui virhe, yrit&#xE4; my&#xF6;hemmin uudelleen. Yrit&#xE4; uudelleen klikkaamalla.","ba-videorecorder-chooser.record-video":"Tallenna videon","ba-videorecorder-chooser.upload-video":"Lataa video","ba-videorecorder-controlbar.settings":"Asetukset","ba-videorecorder-controlbar.camerahealthy":"Valaistus on hyv&#xE4;","ba-videorecorder-controlbar.cameraunhealthy":"Valaistus ei ole optimaalinen","ba-videorecorder-controlbar.microphonehealthy":"&#xC4;&#xE4;ni on hyv&#xE4;","ba-videorecorder-controlbar.microphoneunhealthy":"Voi poimia mit&#xE4;&#xE4;n &#xE4;&#xE4;nt&#xE4;","ba-videorecorder-controlbar.record":"Enn&#xE4;tys","ba-videorecorder-controlbar.record-tooltip":"T&#xE4;&#xE4;lt&#xE4; tallentaa.","ba-videorecorder-controlbar.rerecord":"tehd&#xE4; uudelleen","ba-videorecorder-controlbar.rerecord-tooltip":"T&#xE4;&#xE4;lt&#xE4; redo.","ba-videorecorder-controlbar.upload-covershot":"Lataa","ba-videorecorder-controlbar.upload-covershot-tooltip":"T&#xE4;&#xE4;lt&#xE4; ladata mukautettuja kansi ammuttu","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"T&#xE4;&#xE4;lt&#xE4; lopettaa.","ba-videorecorder-controlbar.skip":"hyppi&#xE4;","ba-videorecorder-controlbar.skip-tooltip":"T&#xE4;&#xE4;lt&#xE4; ohittaa.","ba-videorecorder.recorder-error":"Tapahtui virhe, yrit&#xE4; my&#xF6;hemmin uudelleen. Yrit&#xE4; uudelleen klikkaamalla.","ba-videorecorder.attach-error":"Emme voineet k&#xE4;ytt&#xE4;&#xE4; Kameraliit&#xE4;nn&#xE4;t. Laitteesta riippuen ja selainta, sinun on ehk&#xE4; asennettava Flash tai k&#xE4;ytt&#xE4;&#xE4; sivun kautta SSL.","ba-videorecorder.access-forbidden":"P&#xE4;&#xE4;sy kameraan oli kielletty. Yrit&#xE4; uudelleen klikkaamalla.","ba-videorecorder.pick-covershot":"Valitse covershot.","ba-videorecorder.uploading":"lataaminen","ba-videorecorder.uploading-failed":"Lataaminen ep&#xE4;onnistui - klikkaa t&#xE4;st&#xE4; yrit&#xE4; uudelleen.","ba-videorecorder.verifying":"Tarkistetaan","ba-videorecorder.verifying-failed":"Varmentaa ep&#xE4;onnistui - klikkaa t&#xE4;st&#xE4; yrit&#xE4; uudelleen.","ba-videorecorder.rerecord-confirm":"Haluatko todella redo videon?","ba-videorecorder.video_file_too_large":"Videotiedosto on liian suuri (%s) - klikkaa t&#xE4;st&#xE4; yritt&#xE4;&#xE4; uudelleen pienemm&#xE4;ll&#xE4; videotiedosto.","ba-videorecorder.unsupported_video_type":"Lataa: %s - klikkaa t&#xE4;st&#xE4; yrit&#xE4; uudelleen.","ba-videoplayer-controlbar.exit-fullscreen-video":"exit fullscreen","ba-videoplayer-share.share":"Jaa video"},"language:fr":{"ba-videoplayer-playbutton.tooltip":"Cliquez ici pour voir la vid&#xE9;o.","ba-videoplayer-playbutton.rerecord":"Revoir","ba-videoplayer-playbutton.submit-video":"Confirmer vid&#xE9;o","ba-videoplayer-loader.tooltip":"T&#xE9;l&#xE9;chargez votre vid&#xE9;o...","ba-videoplayer-controlbar.change-resolution":"Modifiez la r&#xE9;solution d&#x2019;&#xE9;cran","ba-videoplayer-controlbar.video-progress":"Vid&#xE9;o en cours de chargement","ba-videoplayer-controlbar.rerecord-video":"Revoir la vid&#xE9;o?","ba-videoplayer-controlbar.submit-video":"Validez la vid&#xE9;o","ba-videoplayer-controlbar.play-video":"Lire la vid&#xE9;o","ba-videoplayer-controlbar.pause-video":"Pause vid&#xE9;o","ba-videoplayer-controlbar.elapsed-time":"Temps &#xE9;coul&#xE9; ou expir&#xE9;","ba-videoplayer-controlbar.total-time":"Dur&#xE9;e total de la vid&#xE9;o","ba-videoplayer-controlbar.fullscreen-video":"S&#xE9;lectionnez le mode plein &#xE9;cran","ba-videoplayer-controlbar.volume-button":"R&#xE9;glez ou ajustez le volume","ba-videoplayer-controlbar.volume-mute":"Silencieux","ba-videoplayer-controlbar.volume-unmute":"Silencieux d&#xE9;sactiv&#xE9;","ba-videoplayer.video-error":"Une s&#x2019;est produite, r&#xE9;essayez ult&#xE9;rieurement &#x2013; cliquez ici pour r&#xE9;essayer.","ba-videorecorder-chooser.record-video":"Enregistrez votre vid&#xE9;o","ba-videorecorder-chooser.upload-video":"T&#xE9;l&#xE9;chargez votre vid&#xE9;o","ba-videorecorder-controlbar.settings":"R&#xE9;glage ou mise &#xE0; jour","ba-videorecorder-controlbar.camerahealthy":"Bon &#xE9;clairage","ba-videorecorder-controlbar.cameraunhealthy":"L&#x2019;&#xE9;clairage n&#x2019;est pas ideal","ba-videorecorder-controlbar.microphonehealthy":"Bonne acoustique","ba-videorecorder-controlbar.microphoneunhealthy":"Acoustique n&#x27;est pas ideal","ba-videorecorder-controlbar.record":"Enregistrer","ba-videorecorder-controlbar.record-tooltip":"Cliquez ici pour enregistrez.","ba-videorecorder-controlbar.rerecord":"Revoir","ba-videorecorder-controlbar.rerecord-tooltip":"Cliquez ici pour recommencer.","ba-videorecorder-controlbar.upload-covershot":"T&#xE9;l&#xE9;chargez","ba-videorecorder-controlbar.upload-covershot-tooltip":"Cliquez ici pour t&#xE9;l&#xE9;charger une couverture personnalis&#xE9;e.","ba-videorecorder-controlbar.stop":"Arr&#xEA;ter","ba-videorecorder-controlbar.stop-tooltip":"Cliquez ici pour arr&#xEA;ter.","ba-videorecorder-controlbar.skip":"Sauter","ba-videorecorder-controlbar.skip-tooltip":"Cliquez ici pour sauter.","ba-videorecorder.recorder-error":"Une s&#x2019;est produite, r&#xE9;essayez ult&#xE9;rieurement &#x2013; cliquez ici pour r&#xE9;essayer.","ba-videorecorder.attach-error":"Nous ne pouvons pas acc&#xE9;der &#xE0; l&#x2019;interface de l&#x2019;appareil- cela d&#xE9;pend du syst&#xE8;me et de l&#x2019;explorateur. Cela peut n&#xE9;cessiter d&#x2019;installer flash ou une acc&#xE9;dez &#xE0; la page via SSL.","ba-videorecorder.access-forbidden":"L&#x2019;acc&#xE8;s &#xE0; l&#x2019;appareil est interdit. Cliquez pour recommencer.","ba-videorecorder.pick-covershot":"Choisissez une page de couverture.","ba-videorecorder.uploading":"T&#xE9;l&#xE9;chargez","ba-videorecorder.uploading-failed":"T&#xE9;l&#xE9;chargement &#xE9;chou&#xE9;- Cliquez ici pour recommencer ou r&#xE9;essayer.","ba-videorecorder.verifying":"V&#xE9;rification","ba-videorecorder.verifying-failed":"V&#xE9;rification &#xE9;chou&#xE9;e - Cliquez ici pour recommencer ou r&#xE9;essayer.","ba-videorecorder.rerecord-confirm":"Souhaitez vous r&#xE9;ellement recommencer la vid&#xE9;o?","ba-videorecorder.video_file_too_large":"La taille de votre fichier est trop grande (%s). Cliquez ici pour ajuster la taille.","ba-videorecorder.unsupported_video_type":"S&#x27;il vous pla&#xEE;t t&#xE9;l&#xE9;charger: %s - cliquez ici pour r&#xE9;essayer.","ba-videoplayer-controlbar.exit-fullscreen-video":"Quitter le mode plein &#xE9;cran","ba-videoplayer-share.share":"Partager la vid&#xE9;o"},"language:hi":{"ba-videoplayer-playbutton.tooltip":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x91A;&#x932;&#x93E;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videoplayer-playbutton.rerecord":"&#x92B;&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92A;&#x941;&#x928;&#x903; &#x930;&#x93F;&#x915;&#x949;&#x93F;&#x921; &#x915;&#x93F;","ba-videoplayer-playbutton.submit-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x91C;&#x92E;&#x93E; &#x915;&#x93F;","ba-videoplayer-loader.tooltip":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x932;&#x94B;&#x921; &#x939;&#x94B; &#x930;&#x939;&#x93E; &#x939;&#x948; ...","ba-videoplayer-controlbar.change-resolution":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; - &#x93F;&#x947;&#x938;&#x94B;&#x932;&#x941;&#x936;&#x928; &#x92C;&#x926;&#x932;&#x94B;","ba-videoplayer-controlbar.video-progress":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92C;&#x922;&#x93C; &#x93F;&#x939;&#x93E; &#x939;","ba-videoplayer-controlbar.rerecord-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92A;&#x941;&#x928;&#x903; &#x930;&#x93F;&#x915;&#x949;&#x93F;&#x921; &#x915;&#x93F;","ba-videoplayer-controlbar.submit-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x91C;&#x92E;&#x93E; &#x915;&#x93F;","ba-videoplayer-controlbar.play-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x91A;&#x932;&#x93E;&#x90F;&#x902;","ba-videoplayer-controlbar.pause-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x930;&#x94B;&#x915;&#x947;&#x902;","ba-videoplayer-controlbar.elapsed-time":"&#x92C;&#x940;&#x924;&#x93E;  &#x906; &#x938;&#x92E;&#x92F;","ba-videoplayer-controlbar.total-time":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x915;&#x940; &#x915;&#x941;&#x932; &#x932;&#x902;&#x92C;&#x93E;&#x908;","ba-videoplayer-controlbar.fullscreen-video":"&#x92A;&#x942;&#x930;&#x94D;&#x923; &#x938;&#x94D;&#x915;&#x94D;&#x930;&#x940;&#x928; &#x926;&#x930;&#x94D;&#x91C; &#x915;&#x930;&#x947;&#x902;","ba-videoplayer-controlbar.volume-button":"&#x92E;&#x93E;&#x924;&#x94D;&#x930;&#x93E; &#x938;&#x947;&#x91F; &#x915;&#x930;&#x947;&#x902;","ba-videoplayer-controlbar.volume-mute":"&#x927;&#x94D;&#x935;&#x928;&#x93F; &#x92E;&#x94D;&#x92F;&#x942;&#x91F; &#x915;&#x930;&#x947;&#x902;","ba-videoplayer-controlbar.volume-unmute":"&#x927;&#x94D;&#x935;&#x928;&#x93F; &#x915;&#x94B; &#x905;&#x928;&#x92E;&#x94D;&#x92F;&#x942;&#x91F; &#x915;&#x930;&#x947;&#x902;","ba-videoplayer.video-error":"&#x905; &#x93E;&#x924;  &#x941;&#x921;&#x93F; | &#x92A;&#x941;&#x928;&#x903;  &#x92F;&#x93E;&#x938; &#x915;&#x93F;&#x928;&#x947; &#x915;&#x947; &#x921;&#x932;&#x90F;  &#x93F;&#x915; &#x915;&#x93F;","ba-videorecorder-chooser.record-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x930;&#x93F;&#x915;&#x949;&#x930;&#x94D;&#x921; &#x915;&#x930;&#x94B;","ba-videorecorder-chooser.upload-video":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x905;&#x92A;&#x932;&#x94B;&#x921; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder-controlbar.settings":"&#x938;&#x947;&#x91F;&#x93F;&#x902;&#x917;&#x94D;&#x938;","ba-videorecorder-controlbar.camerahealthy":"&#x92A;&#x94D;&#x930;&#x915;&#x93E;&#x936; &#x905;&#x91A;&#x94D;&#x91B;&#x93E; &#x939;&#x948;","ba-videorecorder-controlbar.cameraunhealthy":"&#x92A;&#x94D;&#x930;&#x915;&#x93E;&#x936; &#x907;&#x937;&#x94D;&#x91F;&#x924;&#x92E; &#x928;&#x939;&#x940;&#x902; &#x939;&#x948;","ba-videorecorder-controlbar.microphonehealthy":"&#x927;&#x94D;&#x935;&#x928;&#x93F; &#x905;&#x91A;&#x94D;&#x91B;&#x940; &#x939;&#x948;","ba-videorecorder-controlbar.microphoneunhealthy":"&#x915;&#x94B;&#x908; &#x92D;&#x940; &#x906;&#x935;&#x93E;&#x91C; &#x928;&#x939;&#x940;&#x902; &#x909;&#x920;&#x93E; &#x938;&#x915;&#x924;&#x93E;","ba-videorecorder-controlbar.record":"&#x930;&#x93F;&#x915;&#x949;&#x93F;&#x921;","ba-videorecorder-controlbar.record-tooltip":"&#x930;&#x93F;&#x915;&#x949;&#x930;&#x94D;&#x921; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videorecorder-controlbar.rerecord":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92A;&#x941;&#x928;&#x903; &#x930;&#x93F;&#x915;&#x949;&#x93F;&#x921; &#x915;&#x93F;","ba-videorecorder-controlbar.rerecord-tooltip":"&#x92B;&#x93F;&#x930; &#x938;&#x947; &#x915;&#x930;&#x947;&#x902; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videorecorder-controlbar.upload-covershot":"&#x905;&#x92A;&#x932;&#x94B;&#x921;","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#x915;&#x938;&#x94D;&#x91F;&#x92E; &#x915;&#x935;&#x930; &#x936;&#x949;&#x91F; &#x905;&#x92A;&#x932;&#x94B;&#x921; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder-controlbar.stop":"&#x930;&#x941;&#x915;&#x947;&#x902;","ba-videorecorder-controlbar.stop-tooltip":"&#x930;&#x94B;&#x915;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder-controlbar.skip":"&#x91B;&#x94B;&#x921;&#x93C;&#x947;&#x902;","ba-videorecorder-controlbar.skip-tooltip":"&#x91B;&#x94B;&#x921;&#x93C;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videorecorder.recorder-error":"&#x90F;&#x915; &#x924;&#x94D;&#x930;&#x941;&#x91F;&#x93F; &#x918;&#x91F;&#x93F;&#x924; &#x939;&#x941;&#x908; &#x939;&#x948;, &#x915;&#x943;&#x92A;&#x92F;&#x93E; &#x92C;&#x93E;&#x926; &#x92E;&#x947;&#x902; &#x92A;&#x941;&#x928;: &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x947;&#x902;&#x964; &#x92A;&#x941;&#x928;&#x903; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder.attach-error":"&#x939;&#x92E; &#x915;&#x948;&#x92E;&#x930;&#x947; &#x915;&#x947; &#x907;&#x902;&#x91F;&#x930;&#x92B;&#x93C;&#x947;&#x938; &#x924;&#x915; &#x92A;&#x939;&#x941;&#x902;&#x91A; &#x928;&#x939;&#x940;&#x902; &#x938;&#x915;&#x947;&#x964; &#x921;&#x93F;&#x935;&#x93E;&#x907;&#x938; &#x914;&#x930; &#x92C;&#x94D;&#x930;&#x93E;&#x909;&#x91C;&#x93C;&#x930; &#x915;&#x947; &#x906;&#x927;&#x93E;&#x930; &#x92A;&#x930;, &#x906;&#x92A;&#x915;&#x94B; &#x92B;&#x94D;&#x932;&#x948;&#x936; &#x907;&#x902;&#x938;&#x94D;&#x91F;&#x949;&#x932; &#x915;&#x930;&#x928;&#x93E; &#x92F;&#x93E; &#x92A;&#x943;&#x937;&#x94D;&#x920; &#x92A;&#x930; &#x90F;&#x938;&#x90F;&#x938;&#x90F;&#x932; &#x915;&#x947; &#x92E;&#x93E;&#x927;&#x94D;&#x92F;&#x92E; &#x938;&#x947; &#x92A;&#x94D;&#x930;&#x935;&#x947;&#x936; &#x915;&#x930;&#x928;&#x93E; &#x92A;&#x921;&#x93C; &#x938;&#x915;&#x924;&#x93E; &#x939;&#x948;","ba-videorecorder.access-forbidden":"&#x915;&#x948;&#x92E;&#x930;&#x947; &#x924;&#x915; &#x92A;&#x939;&#x941;&#x902;&#x91A; &#x92E;&#x928;&#x93E;&#x908; &#x917;&#x908; &#x925;&#x940; &#x92A;&#x941;&#x928;&#x903; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder.pick-covershot":"&#x936;&#x949;&#x93F;&#x921;&#x915;&#x93F; &#x915;&#x93E; &#x91A;&#x941;&#x928;&#x93E;&#x935; &#x915;&#x940;&#x921;&#x91C;&#x90F;","ba-videorecorder.uploading":"&#x905;&#x92A;&#x932;&#x94B;&#x921; &#x939;&#x94B; &#x930;&#x939;&#x93E; &#x939;&#x948;","ba-videorecorder.uploading-failed":"&#x905;&#x92A;&#x932;&#x94B;&#x921; &#x915;&#x930;&#x928;&#x93E; &#x935;&#x93F;&#x92B;&#x932; - &#x92A;&#x941;&#x928;&#x903; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videorecorder.verifying":"&#x91C;&#x93E; &#x91A; &#x91C;&#x93E;&#x93F;&#x940; &#x939;&#x948;","ba-videorecorder.verifying-failed":"&#x938;&#x924;&#x94D;&#x92F;&#x93E;&#x92A;&#x928; &#x935;&#x93F;&#x92B;&#x932; - &#x92A;&#x941;&#x928;&#x903; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videorecorder.rerecord-confirm":"&#x915;&#x94D;&#x92F;&#x93E; &#x906;&#x92A; &#x935;&#x93E;&#x938;&#x94D;&#x924;&#x935; &#x92E;&#x947;&#x902; &#x905;&#x92A;&#x928;&#x947; &#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x915;&#x94B; &#x92B;&#x93F;&#x930; &#x938;&#x947; &#x915;&#x930;&#x928;&#x93E; &#x91A;&#x93E;&#x939;&#x924;&#x947; &#x939;&#x948;&#x902;?","ba-videorecorder.video_file_too_large":"&#x906;&#x92A;&#x915;&#x940; &#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92B;&#x93C;&#x93E;&#x907;&#x932; &#x92C;&#x939;&#x941;&#x924; &#x92C;&#x921;&#x93C;&#x940; &#x939;&#x948; ( %s) - &#x90F;&#x915; &#x91B;&#x94B;&#x91F;&#x947; &#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x92B;&#x93C;&#x93E;&#x907;&#x932; &#x915;&#x947; &#x938;&#x93E;&#x925; &#x92B;&#x93F;&#x930; &#x938;&#x947; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;","ba-videorecorder.unsupported_video_type":"&#x915;&#x943;&#x92A;&#x92F;&#x93E; &#x905;&#x92A;&#x932;&#x94B;&#x921; &#x915;&#x930;&#x947;&#x902;: %s - &#x92A;&#x941;&#x928;&#x903; &#x92A;&#x94D;&#x930;&#x92F;&#x93E;&#x938; &#x915;&#x930;&#x928;&#x947; &#x915;&#x947; &#x932;&#x93F;&#x90F; &#x92F;&#x939;&#x93E;&#x902; &#x915;&#x94D;&#x932;&#x93F;&#x915; &#x915;&#x930;&#x947;&#x902;&#x964;","ba-videoplayer-controlbar.exit-fullscreen-video":"&#x92A;&#x942;&#x930;&#x94D;&#x923; &#x938;&#x94D;&#x915;&#x94D;&#x930;&#x940;&#x928; &#x938;&#x947; &#x92C;&#x93E;&#x939;&#x930; &#x928;&#x93F;&#x915;&#x932;&#x947;&#x902;","ba-videoplayer-share.share":"&#x935;&#x940;&#x921;&#x93F;&#x92F;&#x94B; &#x936;&#x947;&#x92F;&#x930; &#x915;&#x930;&#x947;&#x902;"},"language:hr":{"ba-videoplayer-playbutton.tooltip":"Kliknite za reprodukciju video zapisa.","ba-videoplayer-playbutton.rerecord":"preurediti","ba-videoplayer-playbutton.submit-video":"Potvrda videa","ba-videoplayer-loader.tooltip":"U&#x10D;itavanje videa ...","ba-videoplayer-controlbar.change-resolution":"Promjena razlu&#x10D;ivosti","ba-videoplayer-controlbar.video-progress":"napredak Video","ba-videoplayer-controlbar.rerecord-video":"Ponovi video?","ba-videoplayer-controlbar.submit-video":"Potvrda videa","ba-videoplayer-controlbar.play-video":"Reprodukcija videozapisa","ba-videoplayer-controlbar.pause-video":"Pauza Video","ba-videoplayer-controlbar.elapsed-time":"Elasped vrijeme","ba-videoplayer-controlbar.total-time":"Ukupna du&#x17E;ina videa","ba-videoplayer-controlbar.fullscreen-video":"Idi na puni zaslon","ba-videoplayer-controlbar.volume-button":"Set volumen","ba-videoplayer-controlbar.volume-mute":"Bez zvuka","ba-videoplayer-controlbar.volume-unmute":"Vrati zvuk","ba-videoplayer.video-error":"Do&#x161;lo je do pogre&#x161;ke. Molimo poku&#x161;ajte ponovno kasnije. Kliknite za ponovni poku&#x161;aj.","ba-videorecorder-chooser.record-video":"Snimanje videa","ba-videorecorder-chooser.upload-video":"Dodaj video","ba-videorecorder-controlbar.settings":"Postavke","ba-videorecorder-controlbar.camerahealthy":"Rasvjeta je dobra","ba-videorecorder-controlbar.cameraunhealthy":"Rasvjeta nije optimalno","ba-videorecorder-controlbar.microphonehealthy":"Zvuk je dobar","ba-videorecorder-controlbar.microphoneunhealthy":"ne mo&#x17E;e podi&#x107;i bilo koji zvuk","ba-videorecorder-controlbar.record":"Snimiti","ba-videorecorder-controlbar.record-tooltip":"Kliknite ovdje za snimanje.","ba-videorecorder-controlbar.rerecord":"preurediti","ba-videorecorder-controlbar.rerecord-tooltip":"Kliknite ovdje ponoviti.","ba-videorecorder-controlbar.upload-covershot":"Postavi","ba-videorecorder-controlbar.upload-covershot-tooltip":"Kliknite ovdje kako biste poslali prilago&#x111;ene cover metak","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"Kliknite ovdje da se zaustavi.","ba-videorecorder-controlbar.skip":"Presko&#x10D;iti","ba-videorecorder-controlbar.skip-tooltip":"Kliknite ovdje presko&#x10D;iti.","ba-videorecorder.recorder-error":"Do&#x161;lo je do pogre&#x161;ke. Molimo poku&#x161;ajte ponovno kasnije. Kliknite za ponovni poku&#x161;aj.","ba-videorecorder.attach-error":"Nismo mogli pristupiti su&#x10D;elju fotoaparata. Ovisno o ure&#x111;aju i preglednika, mo&#x17E;da &#x107;ete morati instalirati Flash ili pristupiti stranici putem SSL-a.","ba-videorecorder.access-forbidden":"Pristup kameri je zabranjeno. Kliknite za ponovni poku&#x161;aj.","ba-videorecorder.pick-covershot":"Izaberite covershot.","ba-videorecorder.uploading":"Prijenos","ba-videorecorder.uploading-failed":"Prijenos nije uspio - kliknite ovdje za ponovni poku&#x161;aj.","ba-videorecorder.verifying":"Potvr&#x111;ivanje","ba-videorecorder.verifying-failed":"Potvr&#x111;ivanje nije uspjelo - kliknite ovdje za ponovni poku&#x161;aj.","ba-videorecorder.rerecord-confirm":"Da li zaista &#x17E;elite ponoviti svoj video?","ba-videorecorder.video_file_too_large":"Va&#x161; video datoteka je prevelika (%s) - kliknite ovdje kako bi poku&#x161;ali ponovno s manjim video datoteka.","ba-videorecorder.unsupported_video_type":"Prenesite: %s - kliknite ovdje za ponovni poku&#x161;aj.","ba-videoplayer-controlbar.exit-fullscreen-video":"Iza&#x111;ite iz cijelog zaslona","ba-videoplayer-share.share":"Dijeljenje videozapisa"},"language:hu":{"ba-videoplayer-playbutton.tooltip":"Kattintson ide a vide&#xF3; lej&#xE1;tsz&#xE1;s&#xE1;hoz.","ba-videoplayer-playbutton.rerecord":"&#xDA;jra","ba-videoplayer-playbutton.submit-video":"Er&#x151;s&#xED;tse vide&#xF3;","ba-videoplayer-loader.tooltip":"Vide&#xF3; bet&#xF6;lt&#xE9;se ...","ba-videoplayer-controlbar.change-resolution":"a felbont&#xE1;s m&#xF3;dos&#xED;t&#xE1;sa","ba-videoplayer-controlbar.video-progress":"vide&#xF3; halad&#xE1;s","ba-videoplayer-controlbar.rerecord-video":"&#xDA;jra vide&#xF3;t?","ba-videoplayer-controlbar.submit-video":"Er&#x151;s&#xED;tse vide&#xF3;","ba-videoplayer-controlbar.play-video":"vide&#xF3; lej&#xE1;tsz&#xE1;sa","ba-videoplayer-controlbar.pause-video":"sz&#xFC;net vide&#xF3;","ba-videoplayer-controlbar.elapsed-time":"Eltelt id&#x151;","ba-videoplayer-controlbar.total-time":"Teljes hossza vide&#xF3;","ba-videoplayer-controlbar.fullscreen-video":"a teljes k&#xE9;perny&#x151;s","ba-videoplayer-controlbar.volume-button":"&#xC1;ll&#xED;tsa be a hanger&#x151;t","ba-videoplayer-controlbar.volume-mute":"hang eln&#xE9;m&#xED;t&#xE1;sa","ba-videoplayer-controlbar.volume-unmute":"Unmute hang","ba-videoplayer.video-error":"Hiba t&#xF6;rt&#xE9;nt. K&#xE9;rj&#xFC;k, pr&#xF3;b&#xE1;lkozzon k&#xE9;s&#x151;bb. Kattintson ide &#xFA;jra.","ba-videorecorder-chooser.record-video":"A vide&#xF3; r&#xF6;gz&#xED;t&#xE9;s&#xE9;nek","ba-videorecorder-chooser.upload-video":"Vide&#xF3; felt&#xF6;lt&#xE9;se","ba-videorecorder-controlbar.settings":"Be&#xE1;ll&#xED;t&#xE1;sok","ba-videorecorder-controlbar.camerahealthy":"Vil&#xE1;g&#xED;t&#xE1;s j&#xF3;","ba-videorecorder-controlbar.cameraunhealthy":"Vil&#xE1;g&#xED;t&#xE1;s nem optim&#xE1;lis","ba-videorecorder-controlbar.microphonehealthy":"Hang j&#xF3;","ba-videorecorder-controlbar.microphoneunhealthy":"Nem lehet felvenni minden hang","ba-videorecorder-controlbar.record":"Rekord","ba-videorecorder-controlbar.record-tooltip":"Kattintson ide, hogy r&#xF6;gz&#xED;ti.","ba-videorecorder-controlbar.rerecord":"&#xDA;jra","ba-videorecorder-controlbar.rerecord-tooltip":"Kattintson ide, hogy &#xFA;jra.","ba-videorecorder-controlbar.upload-covershot":"Felt&#xF6;lt&#xE9;s","ba-videorecorder-controlbar.upload-covershot-tooltip":"Kattintson ide felt&#xF6;lthet&#x151; egyedi fed&#xE9;l l&#xF6;v&#xE9;s","ba-videorecorder-controlbar.stop":"&#xC1;llj meg","ba-videorecorder-controlbar.stop-tooltip":"Kattintson ide, hogy hagyja abba.","ba-videorecorder-controlbar.skip":"Skip","ba-videorecorder-controlbar.skip-tooltip":"Kattintson ide, hogy kihagyja.","ba-videorecorder.recorder-error":"Hiba t&#xF6;rt&#xE9;nt. K&#xE9;rj&#xFC;k, pr&#xF3;b&#xE1;lkozzon k&#xE9;s&#x151;bb. Kattintson ide &#xFA;jra.","ba-videorecorder.attach-error":"Nem tudtuk el&#xE9;rni a kamera interface. Att&#xF3;l f&#xFC;gg&#x151;en, hogy a k&#xE9;sz&#xFC;l&#xE9;k &#xE9;s a b&#xF6;ng&#xE9;sz&#x151;ben, akkor telep&#xED;tenie kell a Flash vagy el&#xE9;rni az oldalt SSL.","ba-videorecorder.access-forbidden":"Hozz&#xE1;f&#xE9;r&#xE9;s a kamera tilos volt. Kattintson ide &#xFA;jra.","ba-videorecorder.pick-covershot":"V&#xE1;lassz egy covershot.","ba-videorecorder.uploading":"Felt&#xF6;lt&#xE9;s","ba-videorecorder.uploading-failed":"Felt&#xF6;lt&#xE9;s sikertelen - ide kattintva &#xFA;jra.","ba-videorecorder.verifying":"ellen&#x151;rz&#xE9;se","ba-videorecorder.verifying-failed":"Ellen&#x151;rz&#xE9;s&#xE9;&#xE9;rt sikertelen - ide kattintva &#xFA;jra.","ba-videorecorder.rerecord-confirm":"T&#xE9;nyleg azt akarja ism&#xE9;telni a vide&#xF3;?","ba-videorecorder.video_file_too_large":"A vide&#xF3; f&#xE1;jl t&#xFA;l nagy (%s) - ide kattintva pr&#xF3;b&#xE1;lkozzon &#xFA;jra egy kisebb video f&#xE1;jlt.","ba-videorecorder.unsupported_video_type":"K&#xE9;rj&#xFC;k, t&#xF6;lts&#xF6;n fel: %s - ide kattintva &#xFA;jra.","ba-videoplayer-controlbar.exit-fullscreen-video":"Kil&#xE9;p&#xE9;s a teljes k&#xE9;perny&#x151;s","ba-videoplayer-share.share":"Vide&#xF3; megoszt&#xE1;sa"},"language:id":{"ba-videoplayer-playbutton.tooltip":"Klik untuk memutar video.","ba-videoplayer-playbutton.rerecord":"Mengulangi","ba-videoplayer-playbutton.submit-video":"Konfirmasi video","ba-videoplayer-loader.tooltip":"Memuat video ...","ba-videoplayer-controlbar.change-resolution":"Ubah resolusi","ba-videoplayer-controlbar.video-progress":"Kemajuan video","ba-videoplayer-controlbar.rerecord-video":"Redo video?","ba-videoplayer-controlbar.submit-video":"Konfirmasi video","ba-videoplayer-controlbar.play-video":"Putar video","ba-videoplayer-controlbar.pause-video":"Jeda video","ba-videoplayer-controlbar.elapsed-time":"Elasped waktu","ba-videoplayer-controlbar.total-time":"Panjang video total","ba-videoplayer-controlbar.fullscreen-video":"Memasuki layar penuh","ba-videoplayer-controlbar.volume-button":"Setel volume","ba-videoplayer-controlbar.volume-mute":"Bisu terdengar","ba-videoplayer-controlbar.volume-unmute":"Suarakan suara","ba-videoplayer.video-error":"Terjadi kesalahan, coba lagi nanti. Klik untuk mencoba lagi.","ba-videorecorder-chooser.record-video":"Merekam video","ba-videorecorder-chooser.upload-video":"Upload Video","ba-videorecorder-controlbar.settings":"Pengaturan","ba-videorecorder-controlbar.camerahealthy":"Pencahayaan itu bagus","ba-videorecorder-controlbar.cameraunhealthy":"Pencahayaan tidak optimal","ba-videorecorder-controlbar.microphonehealthy":"Suara bagus","ba-videorecorder-controlbar.microphoneunhealthy":"Tidak bisa mengambil suara apapun","ba-videorecorder-controlbar.record":"Merekam","ba-videorecorder-controlbar.record-tooltip":"Klik di sini untuk merekam.","ba-videorecorder-controlbar.rerecord":"Mengulangi","ba-videorecorder-controlbar.rerecord-tooltip":"Klik di sini untuk mengulang.","ba-videorecorder-controlbar.upload-covershot":"Upload","ba-videorecorder-controlbar.upload-covershot-tooltip":"Klik di sini untuk mengunggah tangkapan sampul khusus","ba-videorecorder-controlbar.stop":"Berhenti","ba-videorecorder-controlbar.stop-tooltip":"Klik di sini untuk berhenti.","ba-videorecorder-controlbar.skip":"Melewatkan","ba-videorecorder-controlbar.skip-tooltip":"Klik di sini untuk melompat.","ba-videorecorder.recorder-error":"Terjadi kesalahan, coba lagi nanti. Klik untuk mencoba lagi.","ba-videorecorder.attach-error":"Kami tidak dapat mengakses antarmuka kamera. Bergantung pada perangkat dan browser, Anda mungkin perlu menginstal Flash atau mengakses halaman melalui SSL.","ba-videorecorder.access-forbidden":"Akses ke kamera dilarang. Klik untuk mencoba lagi.","ba-videorecorder.pick-covershot":"Pilih sebuah coverhot.","ba-videorecorder.uploading":"Mengunggah","ba-videorecorder.uploading-failed":"Mengunggah gagal - klik di sini untuk mencoba lagi.","ba-videorecorder.verifying":"Memverifikasi","ba-videorecorder.verifying-failed":"Verifikasi gagal - klik di sini untuk mencoba lagi.","ba-videorecorder.rerecord-confirm":"Apakah Anda benar-benar ingin mengulang video Anda?","ba-videorecorder.video_file_too_large":"File video Anda terlalu besar ( %s) - klik di sini untuk mencoba lagi dengan file video yang lebih kecil.","ba-videorecorder.unsupported_video_type":"Silakan upload: %s - klik di sini untuk mencoba lagi.","ba-videoplayer-controlbar.exit-fullscreen-video":"Keluar dari layar penuh","ba-videoplayer-share.share":"Berbagi video"},"language:it":{"ba-videoplayer-playbutton.tooltip":"Clicca per giocare video.","ba-videoplayer-playbutton.rerecord":"Rifare","ba-videoplayer-playbutton.submit-video":"confermare il video","ba-videoplayer-loader.tooltip":"Caricamento video...","ba-videoplayer-controlbar.change-resolution":"Cambiare la risoluzione","ba-videoplayer-controlbar.video-progress":"progresso Video","ba-videoplayer-controlbar.rerecord-video":"Ripeti video?","ba-videoplayer-controlbar.submit-video":"confermare il video","ba-videoplayer-controlbar.play-video":"Guarda il video","ba-videoplayer-controlbar.pause-video":"il video Pause","ba-videoplayer-controlbar.elapsed-time":"tempo Elasped","ba-videoplayer-controlbar.total-time":"La lunghezza totale di Video","ba-videoplayer-controlbar.fullscreen-video":"Vai a tutto schermo","ba-videoplayer-controlbar.volume-button":"Impostare il volume","ba-videoplayer-controlbar.volume-mute":"suono muto","ba-videoplayer-controlbar.volume-unmute":"disattivare l&#x27;audio","ba-videoplayer.video-error":"&#xC8; verificato un errore, riprova pi&#xF9; tardi. Fare clic per riprovare.","ba-videorecorder-chooser.record-video":"Registra il tuo video","ba-videorecorder-chooser.upload-video":"Carica video","ba-videorecorder-controlbar.settings":"impostazioni","ba-videorecorder-controlbar.camerahealthy":"L&#x27;illuminazione &#xE8; buona","ba-videorecorder-controlbar.cameraunhealthy":"L&#x27;illuminazione non &#xE8; ottimale","ba-videorecorder-controlbar.microphonehealthy":"Il suono &#xE8; buono","ba-videorecorder-controlbar.microphoneunhealthy":"Non &#xE8; possibile udire i suoni","ba-videorecorder-controlbar.record":"Disco","ba-videorecorder-controlbar.record-tooltip":"Clicca qui per registrare.","ba-videorecorder-controlbar.rerecord":"Rifare","ba-videorecorder-controlbar.rerecord-tooltip":"Clicca qui per rifare.","ba-videorecorder-controlbar.upload-covershot":"Caricare","ba-videorecorder-controlbar.upload-covershot-tooltip":"Clicca qui per caricare copertina personalizzata colpo","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"Clicca qui per fermare.","ba-videorecorder-controlbar.skip":"Salta","ba-videorecorder-controlbar.skip-tooltip":"Clicca qui per saltare.","ba-videorecorder.recorder-error":"&#xC8; verificato un errore, riprova pi&#xF9; tardi. Fare clic per riprovare.","ba-videorecorder.attach-error":"Non abbiamo potuto accedere alla interfaccia della fotocamera. A seconda del dispositivo e del browser, potrebbe essere necessario installare Flash o accedere alla pagina tramite SSL.","ba-videorecorder.access-forbidden":"L&#x27;accesso alla telecamera era proibito. Fare clic per riprovare.","ba-videorecorder.pick-covershot":"Scegli una covershot.","ba-videorecorder.uploading":"Caricamento","ba-videorecorder.uploading-failed":"Caricamento fallito - clicca qui per riprovare.","ba-videorecorder.verifying":"verifica","ba-videorecorder.verifying-failed":"Verifica non riuscita - clicca qui per riprovare.","ba-videorecorder.rerecord-confirm":"Vuoi davvero di rifare il video?","ba-videorecorder.video_file_too_large":"Il file video &#xE8; troppo grande (%s) - clicca qui per provare di nuovo con un file video pi&#xF9; piccolo.","ba-videorecorder.unsupported_video_type":"Si prega di caricare: %s - clicca qui per riprovare.","ba-videoplayer-controlbar.exit-fullscreen-video":"Uscire da schermo intero","ba-videoplayer-share.share":"Condividi il Video"},"language:nl":{"ba-videoplayer-playbutton.tooltip":"Klik om video af te spelen.","ba-videoplayer-playbutton.rerecord":"opnieuw","ba-videoplayer-playbutton.submit-video":"Bevestig video","ba-videoplayer-loader.tooltip":"Loading video ...","ba-videoplayer-controlbar.change-resolution":"resolutie Change","ba-videoplayer-controlbar.video-progress":"video vooruitgang","ba-videoplayer-controlbar.rerecord-video":"Opnieuw video?","ba-videoplayer-controlbar.submit-video":"Bevestig video","ba-videoplayer-controlbar.play-video":"Video afspelen","ba-videoplayer-controlbar.pause-video":"pauze video","ba-videoplayer-controlbar.elapsed-time":"Verstreken tijd","ba-videoplayer-controlbar.total-time":"De totale lengte van de video","ba-videoplayer-controlbar.fullscreen-video":"Voer fullscreen","ba-videoplayer-controlbar.volume-button":"Volume instellen","ba-videoplayer-controlbar.volume-mute":"geluid uitschakelen","ba-videoplayer-controlbar.volume-unmute":"geluid vrijgeven","ba-videoplayer.video-error":"Er is een fout opgetreden, probeer het later opnieuw. Klik hier om opnieuw te proberen.","ba-videorecorder-chooser.record-video":"Neem uw video","ba-videorecorder-chooser.upload-video":"Upload Video","ba-videorecorder-controlbar.settings":"instellingen","ba-videorecorder-controlbar.camerahealthy":"Verlichting is goed","ba-videorecorder-controlbar.cameraunhealthy":"Verlichting is niet optimaal","ba-videorecorder-controlbar.microphonehealthy":"Het geluid is goed","ba-videorecorder-controlbar.microphoneunhealthy":"Kan niet pikken elk geluid","ba-videorecorder-controlbar.record":"Record","ba-videorecorder-controlbar.record-tooltip":"Klik hier om te registreren.","ba-videorecorder-controlbar.rerecord":"opnieuw","ba-videorecorder-controlbar.rerecord-tooltip":"Klik hier om opnieuw te doen.","ba-videorecorder-controlbar.upload-covershot":"Uploaden","ba-videorecorder-controlbar.upload-covershot-tooltip":"Klik hier om te uploaden aangepaste hoes schot","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"Klik hier om te stoppen.","ba-videorecorder-controlbar.skip":"Overspringen","ba-videorecorder-controlbar.skip-tooltip":"Klik hier om over te slaan.","ba-videorecorder.recorder-error":"Er is een fout opgetreden, probeer het later opnieuw. Klik hier om opnieuw te proberen.","ba-videorecorder.attach-error":"We konden geen toegang tot de camera-interface. Afhankelijk van het apparaat en de browser, moet u misschien Flash installeren of toegang tot de pagina via SSL.","ba-videorecorder.access-forbidden":"De toegang tot de camera was verboden. Klik hier om opnieuw te proberen.","ba-videorecorder.pick-covershot":"Kies een covershot.","ba-videorecorder.uploading":"uploaden","ba-videorecorder.uploading-failed":"Uploaden mislukt - klik hier om opnieuw te proberen.","ba-videorecorder.verifying":"Het verifi&#xEB;ren","ba-videorecorder.verifying-failed":"Verifying mislukt - klik hier om opnieuw te proberen.","ba-videorecorder.rerecord-confirm":"Wil je echt wilt uw video opnieuw te doen?","ba-videorecorder.video_file_too_large":"Uw video bestand is te groot (%s) - klik hier om opnieuw te proberen met een kleinere videobestand.","ba-videorecorder.unsupported_video_type":"Upload: %s - klik hier om opnieuw te proberen.","ba-videoplayer-controlbar.exit-fullscreen-video":"Verlaat volledig scherm","ba-videoplayer-share.share":"Deel Video"},"language:no":{"ba-videoplayer-playbutton.tooltip":"Klikk for &#xE5; spille video.","ba-videoplayer-playbutton.rerecord":"Gj&#xF8;re om","ba-videoplayer-playbutton.submit-video":"bekreft video","ba-videoplayer-loader.tooltip":"Laster video ...","ba-videoplayer-controlbar.change-resolution":"Endre oppl&#xF8;sning","ba-videoplayer-controlbar.video-progress":"video fremgang","ba-videoplayer-controlbar.rerecord-video":"Gj&#xF8;r om videoen?","ba-videoplayer-controlbar.submit-video":"bekreft video","ba-videoplayer-controlbar.play-video":"spill video","ba-videoplayer-controlbar.pause-video":"pause video","ba-videoplayer-controlbar.elapsed-time":"Elasped tid","ba-videoplayer-controlbar.total-time":"Total lengde p&#xE5; video","ba-videoplayer-controlbar.fullscreen-video":"Skriv fullskjerm","ba-videoplayer-controlbar.volume-button":"Still inn volum","ba-videoplayer-controlbar.volume-mute":"lyd","ba-videoplayer-controlbar.volume-unmute":"lyd","ba-videoplayer.video-error":"En feil oppstod. Vennligst pr&#xF8;v igjen senere. Klikk for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videorecorder-chooser.record-video":"Spill av video","ba-videorecorder-chooser.upload-video":"Last opp video","ba-videorecorder-controlbar.settings":"innstillinger","ba-videorecorder-controlbar.camerahealthy":"Belysning er god","ba-videorecorder-controlbar.cameraunhealthy":"Belysning er ikke optimal","ba-videorecorder-controlbar.microphonehealthy":"Lyden er god","ba-videorecorder-controlbar.microphoneunhealthy":"Kan ikke plukke opp noen lyd","ba-videorecorder-controlbar.record":"Ta opp","ba-videorecorder-controlbar.record-tooltip":"Klikk her for &#xE5; spille inn.","ba-videorecorder-controlbar.rerecord":"Gj&#xF8;re om","ba-videorecorder-controlbar.rerecord-tooltip":"Klikk her for &#xE5; gj&#xF8;re om.","ba-videorecorder-controlbar.upload-covershot":"Laste opp","ba-videorecorder-controlbar.upload-covershot-tooltip":"Klikk her for &#xE5; laste opp egendefinerte dekke skudd","ba-videorecorder-controlbar.stop":"Stoppe","ba-videorecorder-controlbar.stop-tooltip":"Klikk her for &#xE5; stoppe.","ba-videorecorder-controlbar.skip":"Hopp","ba-videorecorder-controlbar.skip-tooltip":"Klikk her for &#xE5; hoppe.","ba-videorecorder.recorder-error":"En feil oppstod. Vennligst pr&#xF8;v igjen senere. Klikk for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videorecorder.attach-error":"Vi kunne ikke f&#xE5; tilgang til kameraet grensesnitt. Avhengig av enheten og nettleser, kan det hende du m&#xE5; installere Flash eller tilgang til siden via SSL.","ba-videorecorder.access-forbidden":"Tilgang til kameraet ble forbudt. Klikk for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videorecorder.pick-covershot":"Plukk en covershot.","ba-videorecorder.uploading":"Laster opp","ba-videorecorder.uploading-failed":"Opplasting mislyktes - klikk her for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videorecorder.verifying":"Bekrefter","ba-videorecorder.verifying-failed":"Bekrefter mislyktes - klikk her for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videorecorder.rerecord-confirm":"Har du virkelig &#xF8;nsker &#xE5; gj&#xF8;re om videoen?","ba-videorecorder.video_file_too_large":"Videofilen er for stor (%s) - klikk her for &#xE5; pr&#xF8;ve p&#xE5; nytt med en mindre videofil.","ba-videorecorder.unsupported_video_type":"Last opp: %s - klikk her for &#xE5; pr&#xF8;ve p&#xE5; nytt.","ba-videoplayer-controlbar.exit-fullscreen-video":"Avslutt fullskjerm","ba-videoplayer-share.share":"Del video"},"language:pl":{"ba-videoplayer-playbutton.tooltip":"Kliknij, aby odtworzy&#x107; film.","ba-videoplayer-playbutton.rerecord":"Przerobi&#x107;","ba-videoplayer-playbutton.submit-video":"Potwierd&#x17A; wideo","ba-videoplayer-loader.tooltip":"&#x141;adowanie wideo ...","ba-videoplayer-controlbar.change-resolution":"zmiana rozdzielczo&#x15B;ci","ba-videoplayer-controlbar.video-progress":"post&#x119;p wideo","ba-videoplayer-controlbar.rerecord-video":"Redo wideo?","ba-videoplayer-controlbar.submit-video":"Potwierd&#x17A; wideo","ba-videoplayer-controlbar.play-video":"play video","ba-videoplayer-controlbar.pause-video":"Pauza wideo","ba-videoplayer-controlbar.elapsed-time":"czas, jaki up&#x142;yn&#x105;&#x142;","ba-videoplayer-controlbar.total-time":"Ca&#x142;kowita d&#x142;ugo&#x15B;&#x107; wideo","ba-videoplayer-controlbar.fullscreen-video":"Otworzy&#x107; w trybie pe&#x142;noekranowym","ba-videoplayer-controlbar.volume-button":"Ustaw g&#x142;o&#x15B;no&#x15B;&#x107;","ba-videoplayer-controlbar.volume-mute":"Wycisz d&#x17A;wi&#x119;k","ba-videoplayer-controlbar.volume-unmute":"W&#x142;&#x105;cz d&#x17A;wi&#x119;k","ba-videoplayer.video-error":"Wyst&#x105;pi&#x142; b&#x142;&#x105;d. Prosz&#x119; spr&#xF3;bowa&#x107; p&#xF3;&#x17A;niej. Kliknij, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videorecorder-chooser.record-video":"Nagraj wideo","ba-videorecorder-chooser.upload-video":"Prze&#x15B;lij wideo","ba-videorecorder-controlbar.settings":"Ustawienia","ba-videorecorder-controlbar.camerahealthy":"O&#x15B;wietlenie jest dobre","ba-videorecorder-controlbar.cameraunhealthy":"O&#x15B;wietlenie nie jest optymalna","ba-videorecorder-controlbar.microphonehealthy":"D&#x17A;wi&#x119;k jest dobry","ba-videorecorder-controlbar.microphoneunhealthy":"Nie mog&#x119; odebra&#x107; &#x17C;adnego d&#x17A;wi&#x119;ku","ba-videorecorder-controlbar.record":"Rekord","ba-videorecorder-controlbar.record-tooltip":"Kliknij tutaj, aby nagra&#x107;.","ba-videorecorder-controlbar.rerecord":"Przerobi&#x107;","ba-videorecorder-controlbar.rerecord-tooltip":"Kliknij tutaj, aby ponowi&#x107;.","ba-videorecorder-controlbar.upload-covershot":"Przekaza&#x107; plik","ba-videorecorder-controlbar.upload-covershot-tooltip":"Kliknij tu aby przes&#x142;a&#x107; niestandardowy ok&#x142;adk&#x119; strza&#x142;","ba-videorecorder-controlbar.stop":"Zatrzymaj si&#x119;","ba-videorecorder-controlbar.stop-tooltip":"Kliknij tutaj, aby zatrzyma&#x107;.","ba-videorecorder-controlbar.skip":"Pomin&#x105;&#x107;","ba-videorecorder-controlbar.skip-tooltip":"Kliknij tutaj, aby przej&#x15B;&#x107;.","ba-videorecorder.recorder-error":"Wyst&#x105;pi&#x142; b&#x142;&#x105;d. Prosz&#x119; spr&#xF3;bowa&#x107; p&#xF3;&#x17A;niej. Kliknij, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videorecorder.attach-error":"Nie mogli&#x15B;my uzyska&#x107; dost&#x119;p do interfejsu aparatu. W zale&#x17C;no&#x15B;ci od urz&#x105;dzenia i przegl&#x105;darki, mo&#x17C;e by&#x107; konieczne zainstalowanie Flash lub wej&#x15B;&#x107; na stron&#x119; za po&#x15B;rednictwem protoko&#x142;u SSL.","ba-videorecorder.access-forbidden":"Dost&#x119;p do kamery by&#x142;o zabronione. Kliknij, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videorecorder.pick-covershot":"Wybierz covershot.","ba-videorecorder.uploading":"Przesy&#x142;anie","ba-videorecorder.uploading-failed":"Przesy&#x142;anie nie powiod&#x142;o si&#x119; - kliknij tutaj, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videorecorder.verifying":"Weryfikacja","ba-videorecorder.verifying-failed":"Sprawdzanie poprawno&#x15B;ci nie powiod&#x142;o si&#x119; - kliknij tutaj, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videorecorder.rerecord-confirm":"Czy na pewno chcesz przerobi&#x107; sw&#xF3;j film?","ba-videorecorder.video_file_too_large":"Plik wideo jest zbyt du&#x17C;a (%s) - kliknij tutaj, aby spr&#xF3;bowa&#x107; ponownie z mniejszym pliku wideo.","ba-videorecorder.unsupported_video_type":"Prosz&#x119; przes&#x142;a&#x107;: %s - kliknij tutaj, aby ponowi&#x107; pr&#xF3;b&#x119;.","ba-videoplayer-controlbar.exit-fullscreen-video":"Zamknij pe&#x142;ny ekran","ba-videoplayer-share.share":"Udost&#x119;pnij film"},"language:pt-br":{"ba-videoplayer-playbutton.tooltip":"Clique para reproduzir v&#xED;deo.","ba-videoplayer-playbutton.rerecord":"Refazer","ba-videoplayer-playbutton.submit-video":"confirmar v&#xED;deo","ba-videoplayer-loader.tooltip":"Carregando v&#xED;deo ...","ba-videoplayer-controlbar.change-resolution":"altera&#xE7;&#xE3;o de resolu&#xE7;&#xE3;o","ba-videoplayer-controlbar.video-progress":"o progresso de v&#xED;deo","ba-videoplayer-controlbar.rerecord-video":"Refazer v&#xED;deo?","ba-videoplayer-controlbar.submit-video":"confirmar v&#xED;deo","ba-videoplayer-controlbar.play-video":"reprodu&#xE7;&#xE3;o de v&#xED;deo","ba-videoplayer-controlbar.pause-video":"v&#xED;deo pausa","ba-videoplayer-controlbar.elapsed-time":"tempo elasped","ba-videoplayer-controlbar.total-time":"comprimento total de v&#xED;deo","ba-videoplayer-controlbar.fullscreen-video":"Entrar em tela cheia","ba-videoplayer-controlbar.volume-button":"volume definido","ba-videoplayer-controlbar.volume-mute":"som Mute","ba-videoplayer-controlbar.volume-unmute":"ativar o som","ba-videoplayer.video-error":"Ocorreu um erro. Por favor tente novamente mais tarde. Clique para tentar novamente.","ba-videorecorder-chooser.record-video":"Grave o seu v&#xED;deo","ba-videorecorder-chooser.upload-video":"Upload video","ba-videorecorder-controlbar.settings":"Configura&#xE7;&#xF5;es","ba-videorecorder-controlbar.camerahealthy":"A ilumina&#xE7;&#xE3;o &#xE9; boa","ba-videorecorder-controlbar.cameraunhealthy":"Ilumina&#xE7;&#xE3;o n&#xE3;o &#xE9; o ideal","ba-videorecorder-controlbar.microphonehealthy":"O som &#xE9; bom","ba-videorecorder-controlbar.microphoneunhealthy":"n&#xE3;o pode pegar qualquer som","ba-videorecorder-controlbar.record":"Registro","ba-videorecorder-controlbar.record-tooltip":"Clique aqui para registrar.","ba-videorecorder-controlbar.rerecord":"Refazer","ba-videorecorder-controlbar.rerecord-tooltip":"Clique aqui para refazer.","ba-videorecorder-controlbar.upload-covershot":"Envio","ba-videorecorder-controlbar.upload-covershot-tooltip":"Clique aqui para enviar capa personalizada tiro","ba-videorecorder-controlbar.stop":"Pare","ba-videorecorder-controlbar.stop-tooltip":"Clique aqui para parar.","ba-videorecorder-controlbar.skip":"Pular","ba-videorecorder-controlbar.skip-tooltip":"Clique aqui para pular.","ba-videorecorder.recorder-error":"Ocorreu um erro. Por favor tente novamente mais tarde. Clique para tentar novamente.","ba-videorecorder.attach-error":"N&#xF3;s n&#xE3;o poderia acessar a interface da c&#xE2;mera. Dependendo do dispositivo e navegador, pode ser necess&#xE1;rio instalar o Flash ou acessar a p&#xE1;gina atrav&#xE9;s de SSL.","ba-videorecorder.access-forbidden":"foi proibido o acesso &#xE0; c&#xE2;mera. Clique para tentar novamente.","ba-videorecorder.pick-covershot":"Escolha um covershot.","ba-videorecorder.uploading":"upload","ba-videorecorder.uploading-failed":"Upload falhou - clique aqui para tentar novamente.","ba-videorecorder.verifying":"Verificando","ba-videorecorder.verifying-failed":"Verificando falhou - clique aqui para tentar novamente.","ba-videorecorder.rerecord-confirm":"Voc&#xEA; realmente quer refazer seu v&#xED;deo?","ba-videorecorder.video_file_too_large":"O arquivo de v&#xED;deo &#xE9; muito grande (%s) - clique aqui para tentar novamente com um arquivo de v&#xED;deo menor.","ba-videorecorder.unsupported_video_type":"Fa&#xE7;a o upload: %s - clique aqui para tentar novamente.","ba-videoplayer-controlbar.exit-fullscreen-video":"Sair do ecr&#xE3; inteiro","ba-videoplayer-share.share":"Compartilhar video"},"language:pt":{"ba-videoplayer-playbutton.tooltip":"Clique para ver","ba-videoplayer-playbutton.rerecord":"Repetir","ba-videoplayer-playbutton.submit-video":"Enviar v&#xED;deo","ba-videoplayer-loader.tooltip":"A Carregar...","ba-videoplayer-controlbar.change-resolution":"Alterar resolu&#xE7;&#xE3;o","ba-videoplayer-controlbar.video-progress":"Progress&#xE3;o","ba-videoplayer-controlbar.rerecord-video":"Repetir?","ba-videoplayer-controlbar.submit-video":"Confirmar","ba-videoplayer-controlbar.play-video":"Ver V&#xED;deo","ba-videoplayer-controlbar.pause-video":"Pausa","ba-videoplayer-controlbar.elapsed-time":"Tempo decorrido","ba-videoplayer-controlbar.total-time":"Tempo Total","ba-videoplayer-controlbar.fullscreen-video":"Modo ecr&#xE3; inteiro","ba-videoplayer-controlbar.volume-button":"Definir volume","ba-videoplayer-controlbar.volume-mute":"Som silencioso","ba-videoplayer-controlbar.volume-unmute":"Aumentar Som","ba-videoplayer.video-error":"Ocorreu um erro. Por favor tente de novo mais tarde. Clique para tentar novamente.","ba-videorecorder-chooser.record-video":"Gravar V&#xED;deo","ba-videorecorder-chooser.upload-video":"Enviar V&#xED;deo","ba-videorecorder-controlbar.settings":"Configura&#xE7;&#xF5;es","ba-videorecorder-controlbar.camerahealthy":"A ilumina&#xE7;&#xE3;o &#xE9; boa","ba-videorecorder-controlbar.cameraunhealthy":"A ilumina&#xE7;&#xE3;o n&#xE3;o &#xE9; a ideal","ba-videorecorder-controlbar.microphonehealthy":"O som est&#xE1; bom","ba-videorecorder-controlbar.microphoneunhealthy":"N&#xE3;o foi poss&#xED;vel ouvir nenhum som","ba-videorecorder-controlbar.record":"Gravar","ba-videorecorder-controlbar.record-tooltip":"Clique aqui para gravar","ba-videorecorder-controlbar.rerecord":"Repetir","ba-videorecorder-controlbar.rerecord-tooltip":"Clique aqui para repetir","ba-videorecorder-controlbar.upload-covershot":"Enviar","ba-videorecorder-controlbar.upload-covershot-tooltip":"Clique aqui para enviar a captura de capa personalizada","ba-videorecorder-controlbar.stop":"Parar","ba-videorecorder-controlbar.stop-tooltip":"Clique aqui para parar","ba-videorecorder-controlbar.skip":"Ignorar","ba-videorecorder-controlbar.skip-tooltip":"Clique aqui para ignorar","ba-videorecorder.recorder-error":"Ocorreu um erro. Por favor tente novamente mais tarde. Clique para tentar novamente.","ba-videorecorder.attach-error":"N&#xE3;o conseguimos aceder &#xE0; c&#xE2;mara. Dependendo do dispositivo e do navegador, pode ser necess&#xE1;rio instalar o Flash ou aceder &#xE0; p&#xE1;gina via SSL.","ba-videorecorder.access-forbidden":"O acesso &#xE0; c&#xE2;mara foi pro&#xED;bido. Clique para tentar novamente.","ba-videorecorder.pick-covershot":"Escolha uma capa personalizada","ba-videorecorder.uploading":"A enviar","ba-videorecorder.uploading-failed":"O envio falhou - clique para tentar de novo","ba-videorecorder.verifying":"A verificar","ba-videorecorder.verifying-failed":"A verifica&#xE7;&#xE3;o falhou - clique para tentar de novo","ba-videorecorder.rerecord-confirm":"Quer mesmo repetir o seu v&#xED;deo?","ba-videorecorder.video_file_too_large":"O seu v&#xED;deo &#xE9; demasiado grande (%s) - clique para tentar de novo com um v&#xED;deo mais pequeno.","ba-videorecorder.unsupported_video_type":"Please upload: %s - clique para tentar de novo.","ba-videoplayer-controlbar.exit-fullscreen-video":"Sair do modo ecr&#xE3; inteiro","ba-videoplayer-share.share":"Partilhar a grava&#xE7;&#xE3;o","ba-videoplayer-controlbar.pause-video-disabled":"A pausa n&#xE3;o &#xE9; suportada","ba-videorecorder-chooser.record-audio":"Gravar Audio"},"language:ro":{"ba-videoplayer-playbutton.tooltip":"Click aici pentru a reda video.","ba-videoplayer-playbutton.rerecord":"Reface","ba-videoplayer-playbutton.submit-video":"confirm&#x103; film","ba-videoplayer-loader.tooltip":"Se &#xEE;ncarc&#x103; videoclipul ...","ba-videoplayer-controlbar.change-resolution":"Schimba&#x21B;i rezolu&#x21B;ia","ba-videoplayer-controlbar.video-progress":"progresul video","ba-videoplayer-controlbar.rerecord-video":"Reface&#x21B;i video?","ba-videoplayer-controlbar.submit-video":"confirm&#x103; film","ba-videoplayer-controlbar.play-video":"Ruleaz&#x103; video","ba-videoplayer-controlbar.pause-video":"video de pauz&#x103;","ba-videoplayer-controlbar.elapsed-time":"timp scurs","ba-videoplayer-controlbar.total-time":"Lungimea total&#x103; a videoclipului","ba-videoplayer-controlbar.fullscreen-video":"intra pe tot ecranul","ba-videoplayer-controlbar.volume-button":"set de volum","ba-videoplayer-controlbar.volume-mute":"sunet mut","ba-videoplayer-controlbar.volume-unmute":"repornirea sunetului","ba-videoplayer.video-error":"A ap&#x103;rut o eroare, v&#x103; rug&#x103;m s&#x103; &#xEE;ncerca&#x21B;i din nou mai t&#xE2;rziu. Click aici pentru a &#xEE;ncerca din nou.","ba-videorecorder-chooser.record-video":"&#xCE;nregistrarea imaginilor video dvs.","ba-videorecorder-chooser.upload-video":"&#xCE;ncarc&#x103; film","ba-videorecorder-controlbar.settings":"set&#x103;rile","ba-videorecorder-controlbar.camerahealthy":"De iluminat este bun","ba-videorecorder-controlbar.cameraunhealthy":"De iluminat nu este optim","ba-videorecorder-controlbar.microphonehealthy":"Sunetul este bun","ba-videorecorder-controlbar.microphoneunhealthy":"Nu se poate ridica nici un sunet","ba-videorecorder-controlbar.record":"Record","ba-videorecorder-controlbar.record-tooltip":"Apasa aici pentru a &#xEE;nregistra.","ba-videorecorder-controlbar.rerecord":"Reface","ba-videorecorder-controlbar.rerecord-tooltip":"Apasa aici pentru a reface.","ba-videorecorder-controlbar.upload-covershot":"&#xCE;nc&#x103;rca&#x21B;i","ba-videorecorder-controlbar.upload-covershot-tooltip":"Apasa aici pentru a &#xEE;nc&#x103;rca capac personalizat lovitur&#x103;","ba-videorecorder-controlbar.stop":"Stop","ba-videorecorder-controlbar.stop-tooltip":"Apasa aici pentru a opri.","ba-videorecorder-controlbar.skip":"s&#x103;ri","ba-videorecorder-controlbar.skip-tooltip":"Apasa aici pentru a s&#x103;ri peste.","ba-videorecorder.recorder-error":"A ap&#x103;rut o eroare, v&#x103; rug&#x103;m s&#x103; &#xEE;ncerca&#x21B;i din nou mai t&#xE2;rziu. Click aici pentru a &#xEE;ncerca din nou.","ba-videorecorder.attach-error":"Nu am putut accesa interfa&#x21B;a camerei. &#xCE;n func&#x21B;ie de dispozitiv &#x219;i browser-ul, poate fi necesar s&#x103; instala&#x21B;i Flash sau accesa pagina prin SSL.","ba-videorecorder.access-forbidden":"Accesul la camera a fost interzis&#x103;. Click aici pentru a &#xEE;ncerca din nou.","ba-videorecorder.pick-covershot":"Alege un covershot.","ba-videorecorder.uploading":"Se &#xEE;ncarc&#x103;","ba-videorecorder.uploading-failed":"Se &#xEE;ncarc&#x103; nu a reu&#x219;it - clic aici pentru a &#xEE;ncerca din nou.","ba-videorecorder.verifying":"Se verific&#x103;","ba-videorecorder.verifying-failed":"Care verific&#x103; dac&#x103; nu a reu&#x219;it - clic aici pentru a &#xEE;ncerca din nou.","ba-videorecorder.rerecord-confirm":"Chiar vrei s&#x103; reface&#x21B;i videoclipul?","ba-videorecorder.video_file_too_large":"Fi&#x219;ierul dvs. video este prea mare (%s) - click aici pentru a &#xEE;ncerca din nou cu un fi&#x219;ier video mai mic.","ba-videorecorder.unsupported_video_type":"V&#x103; rug&#x103;m s&#x103; &#xEE;nc&#x103;rca&#x21B;i: %s - clic aici pentru a &#xEE;ncerca din nou.","ba-videoplayer-controlbar.exit-fullscreen-video":"Ie&#x219;i&#x21B;i din ecranul complet","ba-videoplayer-share.share":"Distribui&#x21B;i videoclipul"},"language:ru":{"ba-videoplayer-playbutton.tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x432;&#x43E;&#x441;&#x43F;&#x440;&#x43E;&#x438;&#x437;&#x432;&#x435;&#x441;&#x442;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;.","ba-videoplayer-playbutton.rerecord":"&#x41F;&#x435;&#x440;&#x435;&#x437;&#x430;&#x43F;&#x438;&#x441;&#x430;&#x442;&#x44C;","ba-videoplayer-loader.tooltip":"&#x417;&#x430;&#x433;&#x440;&#x443;&#x437;&#x43A;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E; ...","ba-videoplayer-controlbar.change-resolution":"&#x418;&#x437;&#x43C;&#x435;&#x43D;&#x438;&#x442;&#x44C; &#x440;&#x430;&#x437;&#x440;&#x435;&#x448;&#x435;&#x43D;&#x438;&#x435;","ba-videoplayer-controlbar.video-progress":"&#x425;&#x43E;&#x434; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.rerecord-video":"&#x41F;&#x435;&#x440;&#x435;&#x437;&#x430;&#x43F;&#x438;&#x441;&#x430;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;?","ba-videoplayer-controlbar.play-video":"&#x41F;&#x440;&#x43E;&#x438;&#x433;&#x440;&#x430;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.pause-video":"&#x41F;&#x440;&#x438;&#x43E;&#x441;&#x442;&#x430;&#x43D;&#x43E;&#x432;&#x438;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.elapsed-time":"&#x41F;&#x440;&#x43E;&#x439;&#x434;&#x435;&#x43D;&#x43D;&#x43E;&#x435; &#x432;&#x440;&#x435;&#x43C;&#x44F;","ba-videoplayer-controlbar.total-time":"&#x41E;&#x431;&#x449;&#x430;&#x44F; &#x434;&#x43B;&#x438;&#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.fullscreen-video":"&#x41F;&#x43E;&#x43B;&#x43D;&#x43E;&#x44D;&#x43A;&#x440;&#x430;&#x43D;&#x43D;&#x44B;&#x439; &#x440;&#x435;&#x436;&#x438;&#x43C;","ba-videoplayer-controlbar.volume-button":"&#x413;&#x440;&#x43E;&#x43C;&#x43A;&#x43E;&#x441;&#x442;&#x44C;","ba-videoplayer-controlbar.volume-mute":"&#x41E;&#x442;&#x43A;&#x43B;&#x44E;&#x447;&#x438;&#x442;&#x44C; &#x437;&#x432;&#x443;&#x43A;","ba-videoplayer-controlbar.volume-unmute":"&#x412;&#x43A;&#x43B;&#x44E;&#x447;&#x438;&#x442;&#x44C; &#x437;&#x432;&#x443;&#x43A;","ba-videoplayer.video-error":"&#x41F;&#x440;&#x43E;&#x438;&#x437;&#x43E;&#x448;&#x43B;&#x430; &#x43E;&#x448;&#x438;&#x431;&#x43A;&#x430;. &#x41F;&#x43E;&#x436;&#x430;&#x43B;&#x443;&#x439;&#x441;&#x442;&#x430;, &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x435; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443; &#x43F;&#x43E;&#x437;&#x436;&#x435;. &#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videorecorder-chooser.record-video":"&#x417;&#x430;&#x43F;&#x438;&#x448;&#x438;&#x442;&#x435; &#x441;&#x432;&#x43E;&#x435; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-chooser.upload-video":"&#x417;&#x430;&#x433;&#x440;&#x443;&#x437;&#x438;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-controlbar.settings":"&#x41D;&#x430;&#x441;&#x442;&#x440;&#x43E;&#x439;&#x43A;&#x438;","ba-videorecorder-controlbar.camerahealthy":"&#x41E;&#x441;&#x432;&#x435;&#x449;&#x435;&#x43D;&#x438;&#x435; &#x445;&#x43E;&#x440;&#x43E;&#x448;&#x435;&#x435;","ba-videorecorder-controlbar.cameraunhealthy":"&#x421;&#x43B;&#x430;&#x431;&#x43E;&#x435; &#x43E;&#x441;&#x432;&#x435;&#x449;&#x435;&#x43D;&#x438;&#x435;","ba-videorecorder-controlbar.microphonehealthy":"&#x417;&#x432;&#x443;&#x43A; &#x445;&#x43E;&#x440;&#x43E;&#x448;&#x438;&#x439;","ba-videorecorder-controlbar.microphoneunhealthy":"&#x41D;&#x435;&#x432;&#x43E;&#x437;&#x43C;&#x43E;&#x436;&#x43D;&#x43E; &#x43F;&#x43E;&#x43B;&#x443;&#x447;&#x438;&#x442;&#x44C; &#x437;&#x432;&#x443;&#x43A;","ba-videorecorder-controlbar.record":"&#x417;&#x430;&#x43F;&#x438;&#x441;&#x44C;","ba-videorecorder-controlbar.record-tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x437;&#x430;&#x43F;&#x438;&#x441;&#x430;&#x442;&#x44C;.","ba-videorecorder-controlbar.stop":"&#x421;&#x442;&#x43E;&#x43F;","ba-videorecorder-controlbar.stop-tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43E;&#x441;&#x442;&#x430;&#x43D;&#x43E;&#x432;&#x438;&#x442;&#x44C;.","ba-videorecorder-controlbar.skip":"&#x41F;&#x440;&#x43E;&#x43F;&#x443;&#x441;&#x442;&#x438;&#x442;&#x44C;","ba-videorecorder-controlbar.skip-tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x440;&#x43E;&#x43F;&#x443;&#x441;&#x442;&#x438;&#x442;&#x44C;.","ba-videorecorder.recorder-error":"&#x41F;&#x440;&#x43E;&#x438;&#x437;&#x43E;&#x448;&#x43B;&#x430; &#x43E;&#x448;&#x438;&#x431;&#x43A;&#x430;. &#x41F;&#x43E;&#x436;&#x430;&#x43B;&#x443;&#x439;&#x441;&#x442;&#x430;, &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x435; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443; &#x43F;&#x43E;&#x437;&#x436;&#x435;. &#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videorecorder.access-forbidden":"&#x414;&#x43E;&#x441;&#x442;&#x443;&#x43F; &#x43A; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x435; &#x431;&#x44B;&#x43B; &#x437;&#x430;&#x43F;&#x440;&#x435;&#x449;&#x435;&#x43D;. &#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videorecorder.pick-covershot":"&#x412;&#x44B;&#x431;&#x435;&#x440;&#x438;&#x442;&#x435; &#x441;&#x43D;&#x438;&#x43C;&#x43E;&#x43A;.","ba-videorecorder.uploading":"&#x417;&#x430;&#x433;&#x440;&#x443;&#x437;&#x43A;&#x430;","ba-videorecorder.uploading-failed":"&#x41E;&#x448;&#x438;&#x431;&#x43A;&#x430; &#x437;&#x430;&#x433;&#x440;&#x443;&#x437;&#x43A;&#x438;: &#x43D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videorecorder.verifying":"&#x41F;&#x440;&#x43E;&#x432;&#x435;&#x440;&#x43A;&#x430;","ba-videorecorder.verifying-failed":"&#x41E;&#x448;&#x438;&#x431;&#x43A;&#x430; &#x43F;&#x43E;&#x434;&#x442;&#x432;&#x435;&#x440;&#x436;&#x434;&#x435;&#x43D;&#x438;&#x44F;. &#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videorecorder.rerecord-confirm":"&#x412;&#x44B; &#x434;&#x435;&#x439;&#x441;&#x442;&#x432;&#x438;&#x442;&#x435;&#x43B;&#x44C;&#x43D;&#x43E; &#x445;&#x43E;&#x442;&#x438;&#x442;&#x435; &#x43F;&#x435;&#x440;&#x435;&#x437;&#x430;&#x43F;&#x438;&#x441;&#x430;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;?","ba-videorecorder.video_file_too_large":"&#x421;&#x43B;&#x438;&#x448;&#x43A;&#x43E;&#x43C; &#x431;&#x43E;&#x43B;&#x44C;&#x448;&#x43E;&#x439; &#x432;&#x438;&#x434;&#x435;&#x43E;&#x444;&#x430;&#x439;&#x43B;. &#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443; &#x441; &#x43C;&#x435;&#x43D;&#x44C;&#x448;&#x438;&#x43C; &#x432;&#x438;&#x434;&#x435;&#x43E;&#x444;&#x430;&#x439;&#x43B;&#x43E;&#x43C;.","ba-videorecorder.unsupported_video_type":"&#x41F;&#x43E;&#x436;&#x430;&#x43B;&#x443;&#x439;&#x441;&#x442;&#x430; &#x437;&#x430;&#x433;&#x440;&#x443;&#x437;&#x438;&#x442;&#x435;: %s - &#x43D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x43E;&#x432;&#x442;&#x43E;&#x440;&#x438;&#x442;&#x44C; &#x43F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x443;.","ba-videoplayer-playbutton.submit-video":"&#x41F;&#x43E;&#x434;&#x442;&#x432;&#x435;&#x440;&#x434;&#x438;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.submit-video":"&#x41F;&#x43E;&#x434;&#x442;&#x432;&#x435;&#x440;&#x434;&#x438;&#x442;&#x44C; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-controlbar.rerecord":"&#x41F;&#x435;&#x440;&#x435;&#x434;&#x435;&#x43B;&#x430;&#x442;&#x44C;","ba-videorecorder-controlbar.rerecord-tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x43F;&#x435;&#x440;&#x435;&#x437;&#x430;&#x43F;&#x438;&#x441;&#x430;&#x442;&#x44C;","ba-videorecorder-controlbar.upload-covershot":"&#x417;&#x430;&#x433;&#x440;&#x443;&#x437;&#x438;&#x442;&#x44C;","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#x41D;&#x430;&#x436;&#x43C;&#x438;&#x442;&#x435; &#x437;&#x434;&#x435;&#x441;&#x44C;, &#x447;&#x442;&#x43E;&#x431;&#x44B; &#x437;&#x430;&#x433;&#x440;&#x443;&#x437;&#x438;&#x442;&#x44C; &#x43B;&#x438;&#x447;&#x43D;&#x443;&#x44E; &#x43E;&#x431;&#x43B;&#x43E;&#x436;&#x43A;&#x443;","ba-videorecorder.attach-error":"&#x22;&#x41D;&#x435; &#x443;&#x434;&#x430;&#x43B;&#x43E;&#x441;&#x44C; &#x43F;&#x43E;&#x43B;&#x443;&#x447;&#x438;&#x442;&#x44C; &#x434;&#x43E;&#x441;&#x442;&#x443;&#x43F; &#x43A; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x435;. &#x412; &#x437;&#x430;&#x432;&#x438;&#x441;&#x438;&#x43C;&#x43E;&#x441;&#x442;&#x438; &#x43E;&#x442; &#x443;&#x441;&#x442;&#x440;&#x43E;&#x439;&#x441;&#x442;&#x432;&#x430; &#x438;&#x43B;&#x438; &#x431;&#x440;&#x430;&#x443;&#x437;&#x435;&#x440;&#x430;, &#x432;&#x430;&#x43C; &#x43C;&#x43E;&#x436;&#x435;&#x442; &#x43F;&#x43E;&#x43D;&#x430;&#x434;&#x43E;&#x431;&#x438;&#x442;&#x44C;&#x441;&#x44F; &#x443;&#x441;&#x442;&#x430;&#x43D;&#x43E;&#x432;&#x438;&#x442;&#x44C; Flash &#x438;&#x43B;&#x438; &#x43F;&#x43E;&#x43B;&#x443;&#x447;&#x438;&#x442;&#x44C; &#x434;&#x43E;&#x441;&#x442;&#x443;&#x43F; &#x43A; &#x441;&#x430;&#x439;&#x442;&#x443; &#x447;&#x435;&#x440;&#x435;&#x437; SSL.&#x22;","ba-videoplayer-controlbar.exit-fullscreen-video":"&#x412;&#x44B;&#x439;&#x442;&#x438; &#x438;&#x437; &#x440;&#x435;&#x436;&#x438;&#x43C;&#x430; &#x43F;&#x43E;&#x43B;&#x43D;&#x43E;&#x433;&#x43E; &#x43E;&#x43A;&#x43D;&#x430;","ba-videoplayer-share.share":"&#x41F;&#x43E;&#x434;&#x435;&#x43B;&#x438;&#x442;&#x44C;&#x441;&#x44F; &#x441; &#x432;&#x438;&#x434;&#x435;&#x43E;"},"language:sr":{"ba-videoplayer-playbutton.tooltip":"&#x426;&#x43B;&#x438;&#x446;&#x43A; &#x442;&#x43E; &#x43F;&#x43B;&#x430;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;.","ba-videoplayer-playbutton.rerecord":"&#x43F;&#x440;&#x435;&#x43F;&#x440;&#x430;&#x432;&#x438;&#x442;&#x438;","ba-videoplayer-playbutton.submit-video":"&#x43F;&#x43E;&#x442;&#x432;&#x440;&#x434;&#x438;&#x442;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-loader.tooltip":"&#x41B;&#x43E;&#x430;&#x434;&#x438;&#x43D;&#x433; &#x432;&#x438;&#x434;&#x435;&#x43E; ...","ba-videoplayer-controlbar.change-resolution":"&#x41F;&#x440;&#x43E;&#x43C;&#x435;&#x43D;&#x430; &#x440;&#x435;&#x437;&#x43E;&#x43B;&#x443;&#x446;&#x438;&#x458;&#x435;","ba-videoplayer-controlbar.video-progress":"&#x432;&#x438;&#x434;&#x435;&#x43E; &#x43D;&#x430;&#x43F;&#x440;&#x435;&#x434;&#x430;&#x43A;","ba-videoplayer-controlbar.rerecord-video":"&#x420;&#x435;&#x434;&#x43E; &#x432;&#x438;&#x434;&#x435;&#x43E;?","ba-videoplayer-controlbar.submit-video":"&#x43F;&#x43E;&#x442;&#x432;&#x440;&#x434;&#x438;&#x442;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.play-video":"&#x43F;&#x43B;&#x430;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.pause-video":"&#x43F;&#x430;&#x443;&#x437;&#x430; video","ba-videoplayer-controlbar.elapsed-time":"&#x415;&#x43B;&#x430;&#x441;&#x43F;&#x435;&#x434; &#x432;&#x440;&#x435;&#x43C;&#x435;","ba-videoplayer-controlbar.total-time":"&#x423;&#x43A;&#x443;&#x43F;&#x43D;&#x430; &#x434;&#x443;&#x436;&#x438;&#x43D;&#x430; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videoplayer-controlbar.fullscreen-video":"&#x415;&#x43D;&#x442;&#x435;&#x440; &#x444;&#x443;&#x43B;&#x43B;&#x441;&#x446;&#x440;&#x435;&#x435;&#x43D;","ba-videoplayer-controlbar.volume-button":"&#x41F;&#x43E;&#x434;&#x435;&#x448;&#x430;&#x432;&#x430;&#x45A;&#x435; &#x458;&#x430;&#x447;&#x438;&#x43D;&#x435; &#x437;&#x432;&#x443;&#x43A;&#x430;","ba-videoplayer-controlbar.volume-mute":"&#x43C;&#x443;&#x442;&#x435; &#x441;&#x43E;&#x443;&#x43D;&#x434;","ba-videoplayer-controlbar.volume-unmute":"&#x423;&#x43A;&#x459;&#x443;&#x447;&#x438; &#x437;&#x432;&#x443;&#x43A; &#x437;&#x432;&#x443;&#x43A;","ba-videoplayer.video-error":"&#x414;&#x43E;&#x448;&#x43B;&#x43E; &#x458;&#x435; &#x434;&#x43E; &#x433;&#x440;&#x435;&#x448;&#x43A;&#x435;. &#x41C;&#x43E;&#x43B;&#x438;&#x43C;&#x43E;, &#x43F;&#x43E;&#x43A;&#x443;&#x448;&#x430;&#x458;&#x442;&#x435; &#x43A;&#x430;&#x441;&#x43D;&#x438;&#x458;&#x435;. &#x426;&#x43B;&#x438;&#x446;&#x43A; &#x442;&#x43E; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x438;.","ba-videorecorder-chooser.record-video":"&#x421;&#x43D;&#x438;&#x43C;&#x438;&#x442;&#x435; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-chooser.upload-video":"&#x414;&#x43E;&#x434;&#x430;&#x458; &#x432;&#x438;&#x434;&#x435;&#x43E;","ba-videorecorder-controlbar.settings":"&#x41F;&#x43E;&#x434;&#x435;&#x448;&#x430;&#x432;&#x430;&#x45A;&#x430;","ba-videorecorder-controlbar.camerahealthy":"&#x41E;&#x441;&#x432;&#x435;&#x442;&#x459;&#x435;&#x45A;&#x435; &#x458;&#x435; &#x434;&#x43E;&#x431;&#x440;&#x43E;","ba-videorecorder-controlbar.cameraunhealthy":"&#x41E;&#x441;&#x432;&#x435;&#x442;&#x459;&#x435;&#x45A;&#x435; &#x43D;&#x438;&#x458;&#x435; &#x43E;&#x43F;&#x442;&#x438;&#x43C;&#x430;&#x43B;&#x43D;&#x430;","ba-videorecorder-controlbar.microphonehealthy":"&#x417;&#x432;&#x443;&#x43A; &#x458;&#x435; &#x434;&#x43E;&#x431;&#x430;&#x440;","ba-videorecorder-controlbar.microphoneunhealthy":"&#x41D;&#x435; &#x43C;&#x43E;&#x433;&#x443; &#x443;&#x437;&#x435;&#x442;&#x438; &#x431;&#x438;&#x43B;&#x43E; &#x43A;&#x43E;&#x458;&#x438; &#x437;&#x432;&#x443;&#x43A;","ba-videorecorder-controlbar.record":"&#x437;&#x430;&#x43F;&#x438;&#x441;","ba-videorecorder-controlbar.record-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x437;&#x430; &#x441;&#x43D;&#x438;&#x43C;&#x430;&#x45A;&#x435;.","ba-videorecorder-controlbar.rerecord":"&#x43F;&#x440;&#x435;&#x43F;&#x440;&#x430;&#x432;&#x438;&#x442;&#x438;","ba-videorecorder-controlbar.rerecord-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x437;&#x430; &#x43F;&#x43E;&#x43D;&#x430;&#x432;&#x459;&#x430;&#x45A;&#x435;.","ba-videorecorder-controlbar.upload-covershot":"&#x43E;&#x442;&#x43F;&#x440;&#x435;&#x43C;&#x430;&#x45A;&#x435;","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x431;&#x438;&#x441;&#x442;&#x435; &#x43F;&#x440;&#x438;&#x43B;&#x430;&#x433;&#x43E;&#x452;&#x435;&#x43D;&#x443; &#x43D;&#x430;&#x441;&#x43B;&#x43E;&#x432;&#x43D;&#x443; &#x43C;&#x435;&#x442;&#x430;&#x43A;","ba-videorecorder-controlbar.stop":"&#x417;&#x430;&#x443;&#x441;&#x442;&#x430;&#x432;&#x438;&#x442;&#x438;","ba-videorecorder-controlbar.stop-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x441;&#x435; &#x437;&#x430;&#x443;&#x441;&#x442;&#x430;&#x432;&#x438;.","ba-videorecorder-controlbar.skip":"&#x43F;&#x440;&#x435;&#x441;&#x43A;&#x43E;&#x447;&#x438;&#x442;&#x438;","ba-videorecorder-controlbar.skip-tooltip":"&#x41A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x43F;&#x440;&#x435;&#x441;&#x43A;&#x43E;&#x447;&#x438;&#x442;&#x435;.","ba-videorecorder.recorder-error":"&#x414;&#x43E;&#x448;&#x43B;&#x43E; &#x458;&#x435; &#x434;&#x43E; &#x433;&#x440;&#x435;&#x448;&#x43A;&#x435;. &#x41C;&#x43E;&#x43B;&#x438;&#x43C;&#x43E;, &#x43F;&#x43E;&#x43A;&#x443;&#x448;&#x430;&#x458;&#x442;&#x435; &#x43A;&#x430;&#x441;&#x43D;&#x438;&#x458;&#x435;. &#x426;&#x43B;&#x438;&#x446;&#x43A; &#x442;&#x43E; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x438;.","ba-videorecorder.attach-error":"&#x41C;&#x438; &#x43D;&#x435; &#x43C;&#x43E;&#x436;&#x435; &#x434;&#x430; &#x43F;&#x440;&#x438;&#x441;&#x442;&#x443;&#x43F;&#x438; &#x438;&#x43D;&#x442;&#x435;&#x440;&#x444;&#x435;&#x458;&#x441; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x435;. &#x423; &#x437;&#x430;&#x432;&#x438;&#x441;&#x43D;&#x43E;&#x441;&#x442;&#x438; &#x43E;&#x434; &#x443;&#x440;&#x435;&#x452;&#x430;&#x458;&#x430; &#x438; &#x43F;&#x440;&#x435;&#x442;&#x440;&#x430;&#x436;&#x438;&#x432;&#x430;&#x447;&#x430;, &#x43C;&#x43E;&#x436;&#x434;&#x430; &#x45B;&#x435;&#x442;&#x435; &#x43C;&#x43E;&#x440;&#x430;&#x442;&#x438; &#x434;&#x430; &#x438;&#x43D;&#x441;&#x442;&#x430;&#x43B;&#x438;&#x440;&#x430;&#x442;&#x435; &#x424;&#x43B;&#x430;&#x441;&#x445; &#x438;&#x43B;&#x438; &#x43F;&#x440;&#x438;&#x441;&#x442;&#x443;&#x43F;&#x438;&#x43B;&#x438; &#x441;&#x442;&#x440;&#x430;&#x43D;&#x438;&#x446;&#x438; &#x43F;&#x440;&#x435;&#x43A;&#x43E; &#x421;&#x421;&#x41B;.","ba-videorecorder.access-forbidden":"&#x41F;&#x440;&#x438;&#x441;&#x442;&#x443;&#x43F; &#x43A;&#x430;&#x43C;&#x435;&#x440;&#x43E;&#x43C; &#x458;&#x435; &#x437;&#x430;&#x431;&#x440;&#x430;&#x45A;&#x435;&#x43D;&#x43E;. &#x426;&#x43B;&#x438;&#x446;&#x43A; &#x442;&#x43E; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x438;.","ba-videorecorder.pick-covershot":"&#x418;&#x437;&#x430;&#x431;&#x435;&#x440;&#x438;&#x442;&#x435; &#x446;&#x43E;&#x432;&#x435;&#x440;&#x441;&#x445;&#x43E;&#x442;.","ba-videorecorder.uploading":"&#x443;&#x43F;&#x43B;&#x43E;&#x430;&#x434;&#x438;&#x43D;&#x433;","ba-videorecorder.uploading-failed":"&#x423;&#x43F;&#x43B;&#x43E;&#x430;&#x434;&#x438;&#x43D;&#x433; &#x444;&#x430;&#x438;&#x43B;&#x435;&#x434; - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43A;&#x443;&#x448;&#x430; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.verifying":"&#x432;&#x435;&#x440;&#x438;&#x444;&#x438;&#x43A;&#x430;&#x446;&#x438;&#x458;&#x443;","ba-videorecorder.verifying-failed":"&#x41F;&#x440;&#x43E;&#x432;&#x435;&#x440;&#x430; &#x43D;&#x438;&#x458;&#x435; &#x443;&#x441;&#x43F;&#x435;&#x43B;&#x430; - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43A;&#x443;&#x448;&#x430; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videorecorder.rerecord-confirm":"&#x414;&#x430; &#x43B;&#x438; &#x437;&#x430;&#x438;&#x441;&#x442;&#x430; &#x436;&#x435;&#x43B;&#x438;&#x442;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x438;&#x442;&#x435; &#x441;&#x432;&#x43E;&#x458; &#x432;&#x438;&#x434;&#x435;&#x43E;?","ba-videorecorder.video_file_too_large":"&#x412;&#x430;&#x448; &#x432;&#x438;&#x434;&#x435;&#x43E; &#x434;&#x430;&#x442;&#x43E;&#x442;&#x435;&#x43A;&#x430; &#x458;&#x435; &#x43F;&#x440;&#x435;&#x432;&#x435;&#x43B;&#x438;&#x43A;&#x430; (%s) - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x43E; &#x441;&#x430; &#x43C;&#x430;&#x45A;&#x43E;&#x43C; &#x432;&#x438;&#x434;&#x435;&#x43E; &#x444;&#x430;&#x458;&#x43B;.","ba-videorecorder.unsupported_video_type":"&#x41C;&#x43E;&#x43B;&#x438;&#x43C;&#x43E; &#x412;&#x430;&#x441; &#x434;&#x430; &#x443;&#x43F;&#x43B;&#x43E;&#x430;&#x434;: %&#x441; - &#x43A;&#x43B;&#x438;&#x43A;&#x43D;&#x438;&#x442;&#x435; &#x43E;&#x432;&#x434;&#x435; &#x434;&#x430; &#x43F;&#x43E;&#x43A;&#x443;&#x448;&#x430; &#x43F;&#x43E;&#x43D;&#x43E;&#x432;&#x43E;.","ba-videoplayer-controlbar.exit-fullscreen-video":"&#x418;&#x437;&#x43B;&#x430;&#x437; &#x438;&#x437; &#x446;&#x435;&#x43B;&#x43E;&#x433; &#x435;&#x43A;&#x440;&#x430;&#x43D;&#x430;","ba-videoplayer-share.share":"&#x41F;&#x43E;&#x434;&#x435;&#x43B;&#x438; &#x432;&#x438;&#x434;&#x435;&#x43E;"},"language:sv":{"ba-videoplayer-playbutton.tooltip":"Klicka f&#xF6;r att spela upp video.","ba-videoplayer-playbutton.rerecord":"G&#xF6;ra om","ba-videoplayer-playbutton.submit-video":"bekr&#xE4;fta video","ba-videoplayer-loader.tooltip":"Laddar video ...","ba-videoplayer-controlbar.change-resolution":"&#xE4;ndra uppl&#xF6;sning","ba-videoplayer-controlbar.video-progress":"video framsteg","ba-videoplayer-controlbar.rerecord-video":"G&#xF6;r video?","ba-videoplayer-controlbar.submit-video":"bekr&#xE4;fta video","ba-videoplayer-controlbar.play-video":"Spela video","ba-videoplayer-controlbar.pause-video":"pause video","ba-videoplayer-controlbar.elapsed-time":"f&#xF6;rfluten tid","ba-videoplayer-controlbar.total-time":"Totala l&#xE4;ngden av video","ba-videoplayer-controlbar.fullscreen-video":"Ange fullscreen","ba-videoplayer-controlbar.volume-button":"inst&#xE4;llda volymen","ba-videoplayer-controlbar.volume-mute":"st&#xE4;nga av ljudet","ba-videoplayer-controlbar.volume-unmute":"s&#xE4;tta p&#xE5; ljudet","ba-videoplayer.video-error":"Ett fel har intr&#xE4;ffat. V&#xE4;nligen f&#xF6;rs&#xF6;k igen senare. Klicka f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videorecorder-chooser.record-video":"Spela din video","ba-videorecorder-chooser.upload-video":"Ladda upp video","ba-videorecorder-controlbar.settings":"inst&#xE4;llningar","ba-videorecorder-controlbar.camerahealthy":"Belysning &#xE4;r bra","ba-videorecorder-controlbar.cameraunhealthy":"Belysning &#xE4;r inte optimal","ba-videorecorder-controlbar.microphonehealthy":"Ljudet &#xE4;r bra","ba-videorecorder-controlbar.microphoneunhealthy":"Det g&#xE5;r inte att plocka upp n&#xE5;got ljud","ba-videorecorder-controlbar.record":"Spela in","ba-videorecorder-controlbar.record-tooltip":"Klicka h&#xE4;r f&#xF6;r att spela in.","ba-videorecorder-controlbar.rerecord":"G&#xF6;ra om","ba-videorecorder-controlbar.rerecord-tooltip":"Klicka h&#xE4;r f&#xF6;r att g&#xF6;ra om.","ba-videorecorder-controlbar.upload-covershot":"Ladda upp","ba-videorecorder-controlbar.upload-covershot-tooltip":"Klicka h&#xE4;r f&#xF6;r att ladda upp anpassade t&#xE4;cka skott","ba-videorecorder-controlbar.stop":"Sluta","ba-videorecorder-controlbar.stop-tooltip":"Klicka h&#xE4;r f&#xF6;r att stanna.","ba-videorecorder-controlbar.skip":"Hoppa","ba-videorecorder-controlbar.skip-tooltip":"Klicka h&#xE4;r f&#xF6;r att hoppa.","ba-videorecorder.recorder-error":"Ett fel har intr&#xE4;ffat. V&#xE4;nligen f&#xF6;rs&#xF6;k igen senare. Klicka f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videorecorder.attach-error":"Vi kunde inte komma &#xE5;t kameragr&#xE4;nssnittet. Beroende p&#xE5; vilken enhet och webbl&#xE4;sare, kan du beh&#xF6;va installera Flash eller &#xF6;ppna sidan via SSL.","ba-videorecorder.access-forbidden":"&#xC5;tkomst till kameran var f&#xF6;rbjudet. Klicka f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videorecorder.pick-covershot":"V&#xE4;lj en covershot.","ba-videorecorder.uploading":"uppladdning","ba-videorecorder.uploading-failed":"Uppladdning misslyckades - klicka h&#xE4;r f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videorecorder.verifying":"verifiera","ba-videorecorder.verifying-failed":"Verifiera misslyckades - klicka h&#xE4;r f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videorecorder.rerecord-confirm":"Vill du verkligen vill g&#xF6;ra om din video?","ba-videorecorder.video_file_too_large":"Videofilen &#xE4;r f&#xF6;r stor (%s) - klicka h&#xE4;r f&#xF6;r att f&#xF6;rs&#xF6;ka igen med en mindre videofil.","ba-videorecorder.unsupported_video_type":"Ladda upp: %s - klicka h&#xE4;r f&#xF6;r att f&#xF6;rs&#xF6;ka igen.","ba-videoplayer-controlbar.exit-fullscreen-video":"Avsluta fullsk&#xE4;rmen","ba-videoplayer-share.share":"Dela video"},"language:tl":{"ba-videoplayer-playbutton.tooltip":"I-click upang i-play ang video.","ba-videoplayer-playbutton.rerecord":"I-redo","ba-videoplayer-playbutton.submit-video":"Kumpirmahin ang video","ba-videoplayer-loader.tooltip":"Nilo-load ang video ...","ba-videoplayer-controlbar.change-resolution":"Baguhin ang resolution","ba-videoplayer-controlbar.video-progress":"pag-usad Video","ba-videoplayer-controlbar.rerecord-video":"Gawing muli ang video?","ba-videoplayer-controlbar.submit-video":"Kumpirmahin ang video","ba-videoplayer-controlbar.play-video":"I-Play ang video","ba-videoplayer-controlbar.pause-video":"I-pause ang video","ba-videoplayer-controlbar.elapsed-time":"Elasped oras","ba-videoplayer-controlbar.total-time":"Kabuuang haba ng video","ba-videoplayer-controlbar.fullscreen-video":"Ipasok fullscreen","ba-videoplayer-controlbar.volume-button":"Itakda ang lakas ng tunog","ba-videoplayer-controlbar.volume-mute":"I-mute ang tunog","ba-videoplayer-controlbar.volume-unmute":"I-unmute ang tunog","ba-videoplayer.video-error":"May naganap na error. Mangyaring subukan muli sa ibang pagkakataon. I-click upang subukang muli.","ba-videorecorder-chooser.record-video":"Kumuha ng video","ba-videorecorder-chooser.upload-video":"Mag-upload ng Video","ba-videorecorder-controlbar.settings":"Mga Setting","ba-videorecorder-controlbar.camerahealthy":"Pag-iilaw ay mabuti","ba-videorecorder-controlbar.cameraunhealthy":"Pag-iilaw ay hindi optimal","ba-videorecorder-controlbar.microphonehealthy":"Sound ay mabuti","ba-videorecorder-controlbar.microphoneunhealthy":"Hindi kunin ang anumang tunog","ba-videorecorder-controlbar.record":"Rekord","ba-videorecorder-controlbar.record-tooltip":"Mag-click dito upang i-record.","ba-videorecorder-controlbar.rerecord":"I-redo","ba-videorecorder-controlbar.rerecord-tooltip":"Mag-click dito upang gawing muli.","ba-videorecorder-controlbar.upload-covershot":"Upload","ba-videorecorder-controlbar.upload-covershot-tooltip":"Mag-click dito upang mag-upload ng mga pasadyang pabalat shot","ba-videorecorder-controlbar.stop":"Itigil","ba-videorecorder-controlbar.stop-tooltip":"Mag-click dito upang itigil.","ba-videorecorder-controlbar.skip":"Laktawan","ba-videorecorder-controlbar.skip-tooltip":"Mag-click dito upang laktawan.","ba-videorecorder.recorder-error":"May naganap na error. Mangyaring subukan muli sa ibang pagkakataon. I-click upang subukang muli.","ba-videorecorder.attach-error":"Hindi namin mai-access ang interface ng camera. Depende sa device at browser, maaaring kailangan mong i-install ng Flash o ma-access ang pahina sa pamamagitan ng SSL.","ba-videorecorder.access-forbidden":"Access sa camera ay ipinagbabawal. I-click upang subukang muli.","ba-videorecorder.pick-covershot":"Pumili ng isang covershot.","ba-videorecorder.uploading":"Pag-upload","ba-videorecorder.uploading-failed":"Ina-upload ang mali - i-click dito upang subukang muli.","ba-videorecorder.verifying":"Bine-verify","ba-videorecorder.verifying-failed":"Ang pag-verify nabigo - i-click dito upang subukang muli.","ba-videorecorder.rerecord-confirm":"Nais mo ba talagang nais na gawing muli ang iyong video?","ba-videorecorder.video_file_too_large":"Ang iyong video file ay masyadong malaki (%s) - i-click dito upang subukang muli gamit ang mas maliit na file na video.","ba-videorecorder.unsupported_video_type":"Mangyaring i-upload: %s - i-click dito upang subukang muli.","ba-videoplayer-controlbar.exit-fullscreen-video":"Lumabas sa fullscreen","ba-videoplayer-share.share":"Ibahagi ang video"},"language:tr":{"ba-videoplayer-playbutton.tooltip":"video oynatmak i&#xE7;in t&#x131;klay&#x131;n&#x131;z.","ba-videoplayer-playbutton.rerecord":"yeniden yapmak","ba-videoplayer-playbutton.submit-video":"videoyu onayla","ba-videoplayer-loader.tooltip":"Video y&#xFC;kleniyor ...","ba-videoplayer-controlbar.change-resolution":"De&#x11F;i&#x15F;im &#xE7;&#xF6;z&#xFC;n&#xFC;rl&#xFC;&#x11F;&#xFC;","ba-videoplayer-controlbar.video-progress":"Video ilerleme","ba-videoplayer-controlbar.rerecord-video":"Videoyu Redo?","ba-videoplayer-controlbar.submit-video":"videoyu onayla","ba-videoplayer-controlbar.play-video":"Video oynatmak","ba-videoplayer-controlbar.pause-video":"Pause Video","ba-videoplayer-controlbar.elapsed-time":"Ge&#xE7;en s&#xFC;re","ba-videoplayer-controlbar.total-time":"videonun toplam uzunlu&#x11F;u","ba-videoplayer-controlbar.fullscreen-video":"Tam ekran yap","ba-videoplayer-controlbar.volume-button":"Set hacmi","ba-videoplayer-controlbar.volume-mute":"sesi","ba-videoplayer-controlbar.volume-unmute":"sesi a&#xE7;","ba-videoplayer.video-error":"Bir hata, l&#xFC;tfen tekrar deneyiniz olu&#x15F;tu. Tekrar denemek i&#xE7;in t&#x131;klay&#x131;n.","ba-videorecorder-chooser.record-video":"Ki&#x15F;isel Video kay&#x131;t","ba-videorecorder-chooser.upload-video":"video","ba-videorecorder-controlbar.settings":"Ayarlar","ba-videorecorder-controlbar.camerahealthy":"Ayd&#x131;nlatma iyidir","ba-videorecorder-controlbar.cameraunhealthy":"Ayd&#x131;nlatma optimum de&#x11F;il","ba-videorecorder-controlbar.microphonehealthy":"Ses iyidir","ba-videorecorder-controlbar.microphoneunhealthy":"herhangi bir ses pick up olamaz","ba-videorecorder-controlbar.record":"Kay&#x131;t","ba-videorecorder-controlbar.record-tooltip":"kaydetmek i&#xE7;in buraya t&#x131;klay&#x131;n.","ba-videorecorder-controlbar.rerecord":"yeniden yapmak","ba-videorecorder-controlbar.rerecord-tooltip":"yinelemek i&#xE7;in buraya t&#x131;klay&#x131;n.","ba-videorecorder-controlbar.upload-covershot":"y&#xFC;kleme","ba-videorecorder-controlbar.upload-covershot-tooltip":"&#xF6;zel kapak &#xE7;ekimi y&#xFC;klemek i&#xE7;in buraya t&#x131;klay&#x131;n","ba-videorecorder-controlbar.stop":"Dur","ba-videorecorder-controlbar.stop-tooltip":"durdurmak i&#xE7;in buray&#x131; t&#x131;klay&#x131;n.","ba-videorecorder-controlbar.skip":"atlamak","ba-videorecorder-controlbar.skip-tooltip":"atlamak i&#xE7;in buraya t&#x131;klay&#x131;n.","ba-videorecorder.recorder-error":"Bir hata, l&#xFC;tfen tekrar deneyiniz olu&#x15F;tu. Tekrar denemek i&#xE7;in t&#x131;klay&#x131;n.","ba-videorecorder.attach-error":"Biz kamera aray&#xFC;z&#xFC; eri&#x15F;emedi. cihaz ve taray&#x131;c&#x131;ya ba&#x11F;l&#x131; olarak, Flash y&#xFC;klemek veya SSL ile sayfaya eri&#x15F;mek i&#xE7;in gerekebilir.","ba-videorecorder.access-forbidden":"Kameraya eri&#x15F;im yasakland&#x131;. Tekrar denemek i&#xE7;in t&#x131;klay&#x131;n.","ba-videorecorder.pick-covershot":"Bir covershot se&#xE7;in.","ba-videorecorder.uploading":"Y&#xFC;kleme","ba-videorecorder.uploading-failed":"Y&#xFC;kleme ba&#x15F;ar&#x131;s&#x131;z - yeniden denemek i&#xE7;in buray&#x131; t&#x131;klay&#x131;n.","ba-videorecorder.verifying":"Do&#x11F;rulama","ba-videorecorder.verifying-failed":"Ba&#x15F;ar&#x131;s&#x131;z kullan&#x131;ld&#x131;&#x11F;&#x131;n&#x131; do&#x11F;rulamak - yeniden denemek i&#xE7;in buray&#x131; t&#x131;klay&#x131;n.","ba-videorecorder.rerecord-confirm":"E&#x11F;er ger&#xE7;ekten video yinelemek istiyor musunuz?","ba-videorecorder.video_file_too_large":"Videonuz dosyas&#x131; &#xE7;ok b&#xFC;y&#xFC;k (%s) - k&#xFC;&#xE7;&#xFC;k bir video dosyas&#x131; ile tekrar denemek i&#xE7;in buray&#x131; t&#x131;klay&#x131;n.","ba-videorecorder.unsupported_video_type":"y&#xFC;kleyin: %s - yeniden denemek i&#xE7;in buray&#x131; t&#x131;klay&#x131;n.","ba-videoplayer-controlbar.exit-fullscreen-video":"Tam ekrandan &#xE7;&#x131;k","ba-videoplayer-share.share":"Video payla&#x15F;"}};
    for (var language in languages)
        Assets.strings.register(languages[language], [language]);
    return {};
});

Scoped.define("module:Ads.AdSenseVideoAdProvider", [
        "module:Ads.AbstractVideoAdProvider", "module:Ads.AdSensePrerollAd"
    ],
    function(AbstractVideoAdProvider, AdSensePrerollAd, scoped) {
        return AbstractVideoAdProvider.extend({
            scoped: scoped
        }, {

            _newPrerollAd: function(options) {
                return new AdSensePrerollAd(this, options);
            }

        });
    });


Scoped.define("module:Ads.AdSensePrerollAd", [
    "module:Ads.AbstractPrerollAd"
], function(AbstractVideoPrerollAd, scoped) {
    return AbstractVideoPrerollAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(provider, options) {
                inherited.constructor.call(this, provider, options);
                this._adDisplayContainer = new google.ima.AdDisplayContainer(this._options.adElement, this._options.videoElement);
                // Must be done as the result of a user action on mobile
                this._adDisplayContainer.initialize();
                //Re-use this AdsLoader instance for the entire lifecycle of your page.
                this._adsLoader = new google.ima.AdsLoader(this._adDisplayContainer);

                var self = this;
                this._adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function() {
                    self._adError();
                }, false);
                this._adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function() {
                    self._adLoaded.apply(self, arguments);
                }, false);

                this._adsRequest = new google.ima.AdsRequest();
                this._adsRequest.adTagUrl = this._provider.options().adTagUrl;
            },

            _executeAd: function(options) {
                // Specify the linear and nonlinear slot sizes. This helps the SDK to
                // select the correct creative if multiple are returned.
                this._adsRequest.linearAdSlotWidth = options.width;
                this._adsRequest.linearAdSlotHeight = options.height;
                // adsRequest.nonLinearAdSlotWidth = 640;
                // adsRequest.nonLinearAdSlotHeight = 150;

                this._adsLoader.requestAds(this._adsRequest);
            },

            _adError: function() {
                if (this._adsManager)
                    this._adsManager.destroy();
                this._adFinished();
            },

            _adLoaded: function(adsManagerLoadedEvent) {
                // Get the ads manager.
                this._adsManager = adsManagerLoadedEvent.getAdsManager(this._options.videoElement);
                // See API reference for contentPlayback

                try {
                    // Initialize the ads manager. Ad rules playlist will start at this time.
                    this._adsManager.init(this._adsRequest.linearAdSlotWidth, this._adsRequest.linearAdSlotHeight, google.ima.ViewMode.NORMAL);
                    // Call start to show ads. Single video and overlay ads will
                    // start at this time; this call will be ignored for ad rules, as ad rules
                    // ads start when the adsManager is initialized.
                    this._adsManager.start();
                } catch (adError) {
                    // An error may be thrown if there was a problem with the VAST response.
                }

                var self = this;
                // Add listeners to the required events.
                this._adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, function() {
                    self._adError();
                }, false);

                //this._adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () {});
                this._adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, function() {
                    self._adFinished();
                });

                //this._adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () {});
                this._adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, function() {
                    self._adSkipped();
                });
            }

        };
    });
});
Scoped.define("module:Ads.AbstractVideoAdProvider", ["base:Class"], function(
    Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(options) {
                inherited.constructor.call(this);
                this._options = options;
            },

            options: function() {
                return this._options;
            },

            _newPrerollAd: function(options) {},

            newPrerollAd: function(options) {
                return this._newPrerollAd(options);
            },

            register: function(name) {
                this.cls.registry[name] = this;
            }

        };
    }, {

        registry: {}

    });
});


Scoped.define("module:Ads.AbstractPrerollAd", ["base:Class", "base:Events.EventsMixin"], function(Class, EventsMixin, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(provider, options) {
                inherited.constructor.call(this);
                this._provider = provider;
                this._options = options;
            },

            executeAd: function(options) {
                this._options.adElement.style.display = "";
                this._executeAd(options);
            },

            _adFinished: function() {
                this._options.adElement.style.display = "none";
                this.trigger("finished");
            },

            _adSkipped: function() {
                this._options.adElement.style.display = "none";
                this.trigger("adskipped");
            }

        };
    }]);
});
Scoped.define("module:Ads.VAST.Ad", ["base:Class", "base:Objs", "base:Events.EventsMixin"], function(Class, Objs, EventsMixin, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.id = null;
                this.sequence = null;
                this.system = null;
                this.title = null;
                this.description = null;
                this.advertiser = null;
                this.pricing = null;
                this.survey = null;
                this.errorURLTemplates = [];
                this.impressionURLTemplates = [];
                this.creatives = [];
                this.extensions = [];

                this.trackingEvents = {};
                this.availableTrackingEvents = ['creativeView', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'rewind', 'skip', 'closeLinear', 'close', 'mute', 'unmute', 'pause', 'resume', 'playerExpand', 'playerCollapse', 'acceptInvitationLinear', 'timeSpentViewing', 'otherAdInteraction', 'progress', 'acceptInvitation', 'adExpand', 'adCollapse', 'minimize', 'overlayViewDuration', 'fullscreen', 'exitFullscreen', 'clickthrough'];

                Objs.iter(this.availableTrackingEvents, function(_event) {
                    this.trackingEvents[_event] = null;
                }, this);

            }
        };
    }], {
        isNumeric: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        trackAd: function(URLTemplates, variables) {
            var URL, URLs, i, j, len, results;
            URLs = this.resolveURLTemplates(URLTemplates, variables);
            results = [];
            for (j = 0, len = URLs.length; j < len; j++) {
                URL = URLs[j];
                if (typeof window !== "undefined" && window !== null) {
                    i = new Image();
                    results.push(i.src = URL);
                } else {

                }
            }
            return results;
        },

        resolveURLTemplates: function(URLTemplates, variables) {
            var URLTemplate, URLs, j, key, len, macro1, macro2, resolveURL, value;
            if (!variables) {
                variables = {};
            }
            URLs = [];
            if (variables.ASSETURI) {
                variables.ASSETURI = this.encodeURIComponentRFC3986(variables.ASSETURI);
            }
            if (variables.CONTENTPLAYHEAD) {
                variables.CONTENTPLAYHEAD = this.encodeURIComponentRFC3986(variables.CONTENTPLAYHEAD);
            }
            if ((variables.ERRORCODE) && !/^[0-9]{3}$/.test(variables.ERRORCODE)) {
                variables.ERRORCODE = 900;
            }
            variables.CACHEBUSTING = this.leftpad(Math.round(Math.random() * 1.0e+8).toString());
            variables.TIMESTAMP = this.encodeURIComponentRFC3986((new Date()).toISOString());
            variables.RANDOM = variables.random = variables.CACHEBUSTING;
            for (j = 0, len = URLTemplates.length; j < len; j++) {
                URLTemplate = URLTemplates[j];
                resolveURL = URLTemplate;
                if (!resolveURL) {
                    continue;
                }
                for (key in variables) {
                    value = variables[key];
                    macro1 = "[" + key + "]";
                    macro2 = "%%" + key + "%%";
                    resolveURL = resolveURL.replace(macro1, value);
                    resolveURL = resolveURL.replace(macro2, value);
                }
                URLs.push(resolveURL);
            }
            return URLs;
        },

        leftpad: function(str) {
            if (str.length < 8) {
                return ((function() {
                    var j, ref, results;
                    results = [];
                    for (j = 0, ref = 8 - str.length; 0 <= ref ? j < ref : j > ref; 0 <= ref ? j++ : j--) {
                        results.push('0');
                    }
                    return results;
                })()).join('') + str;
            } else {
                return str;
            }
        },

        encodeURIComponentRFC3986: function(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        },

        storage: (function() {
            var data, isDisabled, storage, storageError;
            try {
                storage = typeof window !== "undefined" && window !== null ? window.localStorage || window.sessionStorage : null;
            } catch (error) {
                storageError = error;
                storage = null;
            }
            isDisabled = function(store) {
                var e, testValue;
                try {
                    testValue = '__VAST__';
                    store.setItem(testValue, testValue);
                    if (store.getItem(testValue) !== testValue) {
                        return true;
                    }
                } catch (error) {
                    e = error;
                    return true;
                }
                return false;
            };
            if ((storage === null) || isDisabled(storage)) {
                data = {};
                storage = {
                    length: 0,
                    getItem: function(key) {
                        return data[key];
                    },
                    setItem: function(key, value) {
                        data[key] = value;
                        this.length = Object.keys(data).length;
                    },
                    removeItem: function(key) {
                        delete data[key];
                        this.length = Object.keys(data).length;
                    },
                    clear: function() {
                        data = {};
                        this.length = 0;
                    }
                };
            }
            return storage;
        })()
    });
});
Scoped.define("module:Ads.VAST.Client", [
    "module:Ads.VAST.Ad", "module:Ads.VAST.Parser", "base:Objs"
], function(VASTAd, VASTParser, Objs, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function(parameters) {
                inherited.constructor.call(this);
                var defineProperty;
                this.cappingFreeLunch = 0;
                this.cappingMinimumTimeInterval = 60 * 1000; // don't allow ad request before 1 minute
                this.lastSuccessfullAd = +new Date();
                this.options = {
                    withCredentials: false,
                    timeout: 1000
                };

                defineProperty = Object.defineProperty;

                Objs.iter(['lastSuccessfullAd', 'totalCalls', 'totalCallsTimeout'], function(property) {
                    defineProperty(this, property, {
                        get: function() {
                            return VASTAd.storage.getItem(property);
                        },
                        set: function(value) {
                            return VASTAd.storage.setItem(property, value);
                        },
                        configurable: false,
                        enumerable: true
                    });
                }, this);

                if (this.lastSuccessfullAd === null)
                    this.lastSuccessfullAd = 0;

                if (this.totalCalls === null)
                    this.totalCalls = 0;

                if (this.totalCallsTimeout === null)
                    this.totalCallsTimeout = 0;

            },

            getAd: function(url, opts, cb) {
                var now, options, timeSinceLastCall;
                now = +new Date();

                if (!cb)
                    if (typeof opts === 'function')
                        cb = opts;
                options = {};

                options = Objs.extend(this.options, opts);

                var parser = new VASTParser();

                if (this.totalCallsTimeout < now) {
                    this.totalCalls = 1;
                    this.totalCallsTimeout = now + (60 * 60 * 1000);
                } else {
                    this.totalCalls++;
                }

                if (this.cappingFreeLunch >= this.totalCalls) {
                    cb(new Error("VAST call canceled - FreeLunch capping not reached yet " + this.totalCalls), null);
                    return;
                }

                timeSinceLastCall = now - this.lastSuccessfullAd;
                if (timeSinceLastCall < 0) {
                    this.lastSuccessfullAd = 0;
                } else if (now - this.lastSuccessfullAd < this.cappingMinimumTimeInterval) {
                    cb(new Error("VAST call cancelled - (" + this.cappingMinimumTimeInterval + ")ms minimum interval reached"), null);
                    return;
                }

                return parser.parse(url, options, (function(_this) {
                    return function(err, response) {
                        if (err)
                            cb(err, null);
                        else {
                            return cb(null, response);
                        }
                    };
                })(this));
            }
        };
    });
});
Scoped.define("module:Ads.VAST.Parser", [
        "module:Ads.VAST.Ad",
        "module:Ads.VAST.URLHandler",
        "module:Ads.VAST.Response",
        "module:Ads.VAST.CreativeLinear",
        "module:Ads.VAST.MediaFile",
        "module:Ads.VAST.CreativeCompanion",
        "module:Ads.VAST.CreativeNonLinear",
        "module:Ads.VAST.CompanionAd",
        "module:Ads.VAST.AdExtension",
        "module:Ads.VAST.AdExtensionChild",
        "module:Ads.VAST.NonLinear"
    ],
    function(VASTAd, URLHandler, VASTResponse, VASTCreativeLinear, VASTMediaFile, VASTCreativeCompanion, VASTCreativeNonLinear, VASTCompanionAd, VASTAdExtension, VASTAdExtensionChild, VASTNonLinear, scoped) {
        return VASTAd.extend({
            scoped: scoped
        }, function(inherited) {
            return {
                constructor: function() {
                    inherited.constructor.call(this);
                    this.URLTemplateFilters = [];
                },

                _indexOf: function(item) {
                    for (var i = 0, l = this.length; i < l; i++) {
                        if (i in this && this[i] === item) return i;
                    }
                    return -1;
                },

                addURLTemplateFilter: function(func) {
                    if (typeof func === 'function') {
                        URLTemplateFilters.push(func);
                    }
                },

                removeURLTemplateFilter: function() {
                    return URLTemplateFilters.pop();
                },

                countURLTemplateFilters: function() {
                    return URLTemplateFilters.length;
                },

                clearUrlTemplateFilters: function() {
                    URLTemplateFilters = [];
                    return URLTemplateFilters;
                },

                parse: function(url, options, cb) {
                    if (!cb) {
                        if (typeof options === 'function') {
                            cb = options;
                        }
                        options = {};
                    }
                    return this._parse(url, null, options, function(err, response) {
                        return cb(err, response);
                    });
                },

                track: function(templates, errorCode) {
                    // TODO: remove after development
                    //this.trigger('VAST-error', errorCode);
                    console.warn('Error code related vast video:', errorCode);
                    return this.trackAd(templates, errorCode);
                },

                _parse: function(url, parentURLs, options, cb) {
                    var filter, i, len, urlHandler;
                    urlHandler = new URLHandler();

                    if (!cb) {
                        if (typeof options === 'function') {
                            cb = options;
                        }
                        options = {};
                    }

                    for (i = 0, len = this.URLTemplateFilters.length; i < len; i++) {
                        filter = URLTemplateFilters[i];
                        url = filter(url);
                    }

                    if (parentURLs === null) {
                        parentURLs = [];
                    }
                    parentURLs.push(url);

                    return urlHandler.get(url, options, (function(_this) {
                        return function(err, xml) {
                            if (err !== null) {
                                return cb(err, null);
                            }
                            return _this.parseXmlDocument(url, parentURLs, options, xml, cb);
                        };
                    })(this));
                },

                __indexOf: [].indexOf || function(item) {
                    for (var i = 0, l = this.length; i < l; i++) {
                        if (i in this && this[i] === item) return i;
                    }
                    return -1;
                },

                parseXmlDocument: function(url, parentURLs, options, xml, cb) {
                    var ad, complete, i, j, len, len1, loopIndex, node, ref, ref1, response, _self;
                    _self = this;
                    response = new VASTResponse();
                    if (!(((xml !== null ? xml.documentElement : void 0) !== null) && xml.documentElement.nodeName === "VAST")) {
                        return cb(new Error('Invalid VAST XMLDocument'));
                    }

                    ref = xml.documentElement.childNodes;
                    for (i = 0, len = ref.length; i < len; i++) {
                        node = ref[i];
                        if (node.nodeName === 'Error') {
                            response.errorURLTemplates.push(this.parseNodeText(node));
                        }
                    }

                    ref1 = xml.documentElement.childNodes;
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        node = ref1[j];
                        if (node.nodeName === 'Ad') {
                            ad = this.parseAdElement(node);
                            if (ad !== null) {
                                response.ads.push(ad);
                            } else {
                                this.track(response.errorURLTemplates, {
                                    ERRORCODE: 101,
                                    ERRORMESSAGE: 'VAST schema validation error.'
                                });
                            }
                        }
                    }

                    complete = function(error, errorAlreadyRaised) {
                        var k, len2, noCreatives, ref2;
                        if (error === null) {
                            error = null;
                        }
                        if (errorAlreadyRaised === null) {
                            errorAlreadyRaised = false;
                        }
                        if (!response) {
                            return;
                        }
                        noCreatives = true;
                        ref2 = response.ads;
                        for (k = 0, len2 = ref2.length; k < len2; k++) {
                            ad = ref2[k];
                            if (ad.nextWrapperURL) {
                                return;
                            }
                            if (ad.creatives.length > 0) {
                                noCreatives = false;
                            }
                        }
                        if (noCreatives) {
                            if (!errorAlreadyRaised) {
                                _self.track(response.errorURLTemplates, {
                                    ERRORCODE: 303,
                                    ERRORMESSAGE: 'No VAST response after one or more Wrappers (No creatives)'
                                });
                            }
                        }
                        if (response.ads.length === 0) {
                            response = null;
                        }
                        return cb(error, response);
                    };

                    loopIndex = response.ads.length;
                    while (loopIndex--) {
                        ad = response.ads[loopIndex];
                        if (!ad.nextWrapperURL) {
                            continue;
                        }
                        this._handleComplete.call(this, ad, url, response, parentURLs, options, complete);
                    }
                    return complete();
                },


                _handleComplete: function(ad, url, response, parentURLs, options, complete) {
                    var _ref2;
                    if (parentURLs.length > (options.wrapperLimit ? options.wrapperLimit : 9) || (_ref2 = ad.nextWrapperURL, this.__indexOf.call(parentURLs, _ref2) >= 0)) {
                        this.track(ad.errorURLTemplates, {
                            ERRORCODE: 302,
                            ERRORMESSAGE: 'Wrapper limit reached, as defined by the video player. Too many Wrapper responses have been received with no InLine response.'
                        });
                        response.ads.splice(response.ads.indexOf(ad), 1);
                        complete(new Error("Wrapper limit reached, as defined by the video player"));
                        return;
                    }

                    if (url) {
                        ad.nextWrapperURL = this.resolveVastAdTagURI(ad.nextWrapperURL, url);
                    }

                    return this._parse(ad.nextWrapperURL, parentURLs, options, function(err, wrappedResponse) {
                        var _errorAlreadyRaised, _index, _k, _len2, _ref3, _wrappedAd;
                        _errorAlreadyRaised = false;
                        if (err) {
                            this.track(ad.errorURLTemplates, {
                                ERRORCODE: 301,
                                ERRORMESSAGE: 'Timeout of VAST URI provided in Wrapper element, or of VAST URI provided in a subsequent Wrapper element. (URI was either unavailable or reached a timeout as defined by the video player.)'
                            });
                            response.ads.splice(response.ads.indexOf(ad), 1);
                            _errorAlreadyRaised = true;
                        } else if (!wrappedResponse) {
                            this.track(ad.errorURLTemplates, {
                                ERRORCODE: 303,
                                ERRORMESSAGE: 'No VAST response after one or more Wrappers'
                            });
                            response.ads.splice(response.ads.indexOf(ad), 1);
                            _errorAlreadyRaised = true;
                        } else {
                            response.errorURLTemplates = response.errorURLTemplates.concat(wrappedResponse.errorURLTemplates);
                            _index = response.ads.indexOf(ad);
                            response.ads.splice(_index, 1);
                            _ref3 = wrappedResponse.ads;
                            for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
                                _wrappedAd = _ref3[_k];
                                this.mergeWrapperAdData(_wrappedAd, ad);
                                response.ads.splice(++_index, 0, _wrappedAd);
                            }
                        }
                        delete ad.nextWrapperURL;
                        return complete(err, _errorAlreadyRaised);
                    });
                },

                resolveVastAdTagURI: function(vastAdTagUrl, originalUrl) {
                    var baseURL, protocol;
                    if (vastAdTagUrl.indexOf('//') === 0) {
                        protocol = location.protocol;
                        return "" + protocol + vastAdTagUrl;
                    }
                    if (vastAdTagUrl.indexOf('://') === -1) {
                        baseURL = originalUrl.slice(0, originalUrl.lastIndexOf('/'));
                        return baseURL + "/" + vastAdTagUrl;
                    }
                    return vastAdTagUrl;
                },

                mergeWrapperAdData: function(wrappedAd, ad) {
                    var base, creative, eventName, i, j, k, l, len, len1, len2, len3, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, results, urls;
                    wrappedAd.errorURLTemplates = ad.errorURLTemplates.concat(wrappedAd.errorURLTemplates);
                    wrappedAd.impressionURLTemplates = ad.impressionURLTemplates.concat(wrappedAd.impressionURLTemplates);
                    wrappedAd.extensions = ad.extensions.concat(wrappedAd.extensions);
                    ref = wrappedAd.creatives;
                    for (i = 0, len = ref.length; i < len; i++) {
                        creative = ref[i];
                        if (((ref1 = ad.trackingEvents) !== null ? ref1[creative.type] : void 0) !== null) {
                            ref2 = ad.trackingEvents[creative.type];
                            for (eventName in ref2) {
                                urls = ref2[eventName];
                                if (creative.trackingEvents[eventName]) {
                                    base[eventName] = creative.trackingEvents[eventName];
                                } else {
                                    base[eventName] = [];
                                }
                                creative.trackingEvents[eventName] = creative.trackingEvents[eventName].concat(urls);
                            }
                        }
                    }
                    if ((ref3 = ad.videoClickTrackingURLTemplates) !== null ? ref3.length : void 0) {
                        ref4 = wrappedAd.creatives;
                        for (j = 0, len1 = ref4.length; j < len1; j++) {
                            creative = ref4[j];
                            if (creative.type === 'linear') {
                                creative.videoClickTrackingURLTemplates = creative.videoClickTrackingURLTemplates.concat(ad.videoClickTrackingURLTemplates);
                            }
                        }
                    }
                    if ((ref5 = ad.videoCustomClickURLTemplates) ? ref5.length : void 0) {
                        ref6 = wrappedAd.creatives;
                        for (k = 0, len2 = ref6.length; k < len2; k++) {
                            creative = ref6[k];
                            if (creative.type === 'linear') {
                                creative.videoCustomClickURLTemplates = creative.videoCustomClickURLTemplates.concat(ad.videoCustomClickURLTemplates);
                            }
                        }
                    }
                    if (ad.videoClickThroughURLTemplate) {
                        ref7 = wrappedAd.creatives;
                        results = [];
                        for (l = 0, len3 = ref7.length; l < len3; l++) {
                            creative = ref7[l];
                            if (creative.type === 'linear' && (creative.videoClickThroughURLTemplate === null)) {
                                results.push(creative.videoClickThroughURLTemplate = ad.videoClickThroughURLTemplate);
                            } else {
                                results.push(void 0);
                            }
                        }
                        return results;
                    }
                },

                childByName: function(node, name) {
                    var child, i, len, ref;
                    ref = node.childNodes;
                    for (i = 0, len = ref.length; i < len; i++) {
                        child = ref[i];
                        if (child.nodeName === name) {
                            return child;
                        }
                    }
                },

                childsByName: function(node, name) {
                    var child, childs, i, len, ref;
                    childs = [];
                    ref = node.childNodes;
                    for (i = 0, len = ref.length; i < len; i++) {
                        child = ref[i];
                        if (child.nodeName === name) {
                            childs.push(child);
                        }
                    }
                    return childs;
                },

                parseAdElement: function(adElement) {
                    var adTypeElement, i, len, ref, ref1;
                    ref = adElement.childNodes;
                    for (i = 0, len = ref.length; i < len; i++) {
                        adTypeElement = ref[i];
                        if ((ref1 = adTypeElement.nodeName) !== "Wrapper" && ref1 !== "InLine") {
                            continue;
                        }
                        this.copyNodeAttribute("id", adElement, adTypeElement);
                        this.copyNodeAttribute("sequence", adElement, adTypeElement);
                        if (adTypeElement.nodeName === "Wrapper") {
                            return this.parseWrapperElement(adTypeElement);
                        } else if (adTypeElement.nodeName === "InLine") {
                            return this.parseInLineElement(adTypeElement);
                        }
                    }
                },

                parseWrapperElement: function(wrapperElement) {
                    var ad, base, base1, eventName, i, item, j, k, l, len, len1, len2, len3, name1, ref, ref1, ref2, ref3, ref4, url, urls, wrapperCreativeElement, wrapperURLElement;
                    ad = this.parseInLineElement(wrapperElement);
                    wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURI");
                    if (wrapperURLElement) {
                        ad.nextWrapperURL = this.parseNodeText(wrapperURLElement);
                    } else {
                        wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURL");
                        if (wrapperURLElement) {
                            ad.nextWrapperURL = this.parseNodeText(this.childByName(wrapperURLElement, "URL"));
                        }
                    }
                    ref = ad.creatives;
                    for (i = 0, len = ref.length; i < len; i++) {
                        wrapperCreativeElement = ref[i];
                        if ((ref1 = wrapperCreativeElement.type) === 'linear' || ref1 === 'nonlinear') {
                            if (wrapperCreativeElement.trackingEvents) {
                                ad.trackingEvents = ad.trackingEvents ? ad.trackingEvents : {};
                                name1 = wrapperCreativeElement.type;
                                base[name1] = ad.trackingEvents[name1] ? ad.trackingEvents[name1] : {};
                                ref2 = wrapperCreativeElement.trackingEvents;
                                for (eventName in ref2) {
                                    urls = ref2[eventName];
                                    if (urls !== null) {
                                        base1[eventName] = ad.trackingEvents[wrapperCreativeElement.type][eventName] ? ad.trackingEvents[wrapperCreativeElement.type][eventName] : [];
                                        for (j = 0, len1 = urls.length; j < len1; j++) {
                                            url = urls[j];
                                            ad.trackingEvents[wrapperCreativeElement.type][eventName].push(url);
                                        }
                                    }
                                }
                            }
                            if (wrapperCreativeElement.videoClickTrackingURLTemplates) {
                                ad.videoClickTrackingURLTemplates = ad.videoClickTrackingURLTemplates || [];
                                ref3 = wrapperCreativeElement.videoClickTrackingURLTemplates;
                                for (k = 0, len2 = ref3.length; k < len2; k++) {
                                    item = ref3[k];
                                    ad.videoClickTrackingURLTemplates.push(item);
                                }
                            }
                            if (wrapperCreativeElement.videoClickThroughURLTemplate) {
                                ad.videoClickThroughURLTemplate = wrapperCreativeElement.videoClickThroughURLTemplate;
                            }
                            if (wrapperCreativeElement.videoCustomClickURLTemplates) {
                                ad.videoCustomClickURLTemplates = ad.videoCustomClickURLTemplates || [];
                                ref4 = wrapperCreativeElement.videoCustomClickURLTemplates;
                                for (l = 0, len3 = ref4.length; l < len3; l++) {
                                    item = ref4[l];
                                    ad.videoCustomClickURLTemplates.push(item);
                                }
                            }
                        }
                    }
                    if (ad.nextWrapperURL) {
                        return ad;
                    }
                },

                parseInLineElement: function(inLineElement) {
                    var ad, creative, creativeAttributes, creativeElement, creativeTypeElement, i, j, k, len, len1, len2, node, ref, ref1, ref2;
                    ad = new VASTAd();
                    ad.id = inLineElement.getAttribute("id") || null;
                    ad.sequence = inLineElement.getAttribute("sequence") || null;
                    ref = inLineElement.childNodes;
                    for (i = 0, len = ref.length; i < len; i++) {
                        node = ref[i];
                        switch (node.nodeName) {
                            case "Error":
                                ad.errorURLTemplates.push(this.parseNodeText(node));
                                break;
                            case "Impression":
                                ad.impressionURLTemplates.push(this.parseNodeText(node));
                                break;
                            case "Creatives":
                                ref1 = this.childsByName(node, "Creative");
                                for (j = 0, len1 = ref1.length; j < len1; j++) {
                                    creativeElement = ref1[j];
                                    creativeAttributes = {
                                        id: creativeElement.getAttribute('id') || null,
                                        adId: this.parseCreativeAdIdAttribute(creativeElement),
                                        sequence: creativeElement.getAttribute('sequence') || null,
                                        apiFramework: creativeElement.getAttribute('apiFramework') || null
                                    };
                                    ref2 = creativeElement.childNodes;
                                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                                        creativeTypeElement = ref2[k];
                                        switch (creativeTypeElement.nodeName) {
                                            case "Linear":
                                                creative = this.parseCreativeLinearElement(creativeTypeElement, creativeAttributes);
                                                if (creative) {
                                                    ad.creatives.push(creative);
                                                }
                                                break;
                                            case "NonLinearAds":
                                                creative = this.parseNonLinear(creativeTypeElement, creativeAttributes);
                                                if (creative) {
                                                    ad.creatives.push(creative);
                                                }
                                                break;
                                            case "CompanionAds":
                                                creative = this.parseCompanionAd(creativeTypeElement, creativeAttributes);
                                                if (creative) {
                                                    ad.creatives.push(creative);
                                                }
                                        }
                                    }
                                }
                                break;
                            case "Extensions":
                                this.parseExtension(ad.extensions, this.childsByName(node, "Extension"));
                                break;
                            case "AdSystem":
                                ad.system = {
                                    value: this.parseNodeText(node),
                                    version: node.getAttribute("version") || null
                                };
                                break;
                            case "AdTitle":
                                ad.title = this.parseNodeText(node);
                                break;
                            case "Description":
                                ad.description = this.parseNodeText(node);
                                break;
                            case "Advertiser":
                                ad.advertiser = this.parseNodeText(node);
                                break;
                            case "Pricing":
                                ad.pricing = {
                                    value: this.parseNodeText(node),
                                    model: node.getAttribute("model") || null,
                                    currency: node.getAttribute("currency") || null
                                };
                                break;
                            case "Survey":
                                ad.survey = this.parseNodeText(node);
                        }
                    }
                    return ad;
                },

                parseExtension: function(collection, extensions) {
                    var childNode, ext, extChild, extChildNodeAttr, extNode, extNodeAttr, i, j, k, l, len, len1, len2, len3, ref, ref1, ref2, results, txt;
                    results = [];
                    for (i = 0, len = extensions.length; i < len; i++) {
                        extNode = extensions[i];
                        ext = new VASTAdExtension();
                        if (extNode.attributes) {
                            ref = extNode.attributes;
                            for (j = 0, len1 = ref.length; j < len1; j++) {
                                extNodeAttr = ref[j];
                                ext.attributes[extNodeAttr.nodeName] = extNodeAttr.nodeValue;
                            }
                        }
                        ref1 = extNode.childNodes;
                        for (k = 0, len2 = ref1.length; k < len2; k++) {
                            childNode = ref1[k];
                            txt = this.parseNodeText(childNode);
                            if (childNode.nodeName !== '#comment' && txt !== '') {
                                extChild = new VASTAdExtensionChild();
                                extChild.name = childNode.nodeName;
                                extChild.value = txt;
                                if (childNode.attributes) {
                                    ref2 = childNode.attributes;
                                    for (l = 0, len3 = ref2.length; l < len3; l++) {
                                        extChildNodeAttr = ref2[l];
                                        extChild.attributes[extChildNodeAttr.nodeName] = extChildNodeAttr.nodeValue;
                                    }
                                }
                                ext.children.push(extChild);
                            }
                        }
                        results.push(collection.push(ext));
                    }
                    return results;
                },

                parseCreativeLinearElement: function(creativeElement, creativeAttributes) {
                    var adParamsElement, base, clickTrackingElement, creative, customClickElement, eventName, htmlElement, i, icon, iconClickTrackingElement, iconClicksElement, iconElement, iconsElement, iframeElement, j, k, l, len, len1, len10, len2, len3, len4, len5, len6, len7, len8, len9, m, maintainAspectRatio, mediaFile, mediaFileElement, mediaFilesElement, n, o, offset, p, percent, q, r, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, scalable, skipOffset, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate, videoClicksElement;
                    creative = new VASTCreativeLinear(creativeAttributes);
                    creative.duration = this.parseDuration(this.parseNodeText(this.childByName(creativeElement, "Duration")));
                    if (creative.duration === -1 && creativeElement.parentNode.parentNode.parentNode.nodeName !== 'Wrapper') {
                        return null;
                    }
                    skipOffset = creativeElement.getAttribute("skipoffset");
                    if (skipOffset === null) {
                        creative.skipDelay = null;
                    } else if (skipOffset.charAt(skipOffset.length - 1) === "%") {
                        percent = parseInt(skipOffset, 10);
                        creative.skipDelay = creative.duration * (percent / 100);
                    } else {
                        creative.skipDelay = this.parseDuration(skipOffset);
                    }
                    videoClicksElement = this.childByName(creativeElement, "VideoClicks");
                    if (videoClicksElement) {
                        creative.videoClickThroughURLTemplate = this.parseNodeText(this.childByName(videoClicksElement, "ClickThrough"));
                        ref = this.childsByName(videoClicksElement, "ClickTracking");
                        for (i = 0, len = ref.length; i < len; i++) {
                            clickTrackingElement = ref[i];
                            creative.videoClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
                        }
                        ref1 = this.childsByName(videoClicksElement, "CustomClick");
                        for (j = 0, len1 = ref1.length; j < len1; j++) {
                            customClickElement = ref1[j];
                            creative.videoCustomClickURLTemplates.push(this.parseNodeText(customClickElement));
                        }
                    }
                    adParamsElement = this.childByName(creativeElement, "AdParameters");
                    if (adParamsElement) {
                        creative.adParameters = this.parseNodeText(adParamsElement);
                    }
                    ref2 = this.childsByName(creativeElement, "TrackingEvents");
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                        trackingEventsElement = ref2[k];
                        ref3 = this.childsByName(trackingEventsElement, "Tracking");
                        for (l = 0, len3 = ref3.length; l < len3; l++) {
                            trackingElement = ref3[l];
                            eventName = trackingElement.getAttribute("event");
                            trackingURLTemplate = this.parseNodeText(trackingElement);
                            if (eventName && trackingURLTemplate) {
                                if (eventName === "progress") {
                                    offset = trackingElement.getAttribute("offset");
                                    if (!offset) {
                                        continue;
                                    }
                                    if (offset.charAt(offset.length - 1) === '%') {
                                        eventName = "progress-" + offset;
                                    } else {
                                        eventName = "progress-" + (Math.round(this.parseDuration(offset)));
                                    }
                                }
                                if ((base = creative.trackingEvents)[eventName] === null) {
                                    base[eventName] = [];
                                }

                                if (creative.trackingEvents[eventName]) {
                                    creative.trackingEvents[eventName].push(trackingURLTemplate);
                                }

                            }
                        }
                    }
                    ref4 = this.childsByName(creativeElement, "MediaFiles");
                    for (m = 0, len4 = ref4.length; m < len4; m++) {
                        mediaFilesElement = ref4[m];
                        ref5 = this.childsByName(mediaFilesElement, "MediaFile");
                        for (n = 0, len5 = ref5.length; n < len5; n++) {
                            mediaFileElement = ref5[n];
                            mediaFile = new VASTMediaFile();
                            mediaFile.id = mediaFileElement.getAttribute("id");
                            mediaFile.fileURL = this.parseNodeText(mediaFileElement);
                            mediaFile.deliveryType = mediaFileElement.getAttribute("delivery");
                            mediaFile.codec = mediaFileElement.getAttribute("codec");
                            mediaFile.mimeType = mediaFileElement.getAttribute("type");
                            mediaFile.apiFramework = mediaFileElement.getAttribute("apiFramework");
                            mediaFile.bitrate = parseInt(mediaFileElement.getAttribute("bitrate") || 0, 10);
                            mediaFile.minBitrate = parseInt(mediaFileElement.getAttribute("minBitrate") || 0, 10);
                            mediaFile.maxBitrate = parseInt(mediaFileElement.getAttribute("maxBitrate") || 0, 10);
                            mediaFile.width = parseInt(mediaFileElement.getAttribute("width") || 0, 10);
                            mediaFile.height = parseInt(mediaFileElement.getAttribute("height") || 0, 10);
                            scalable = mediaFileElement.getAttribute("scalable");
                            if (scalable && typeof scalable === "string") {
                                scalable = scalable.toLowerCase();
                                if (scalable === "true") {
                                    mediaFile.scalable = true;
                                } else if (scalable === "false") {
                                    mediaFile.scalable = false;
                                }
                            }
                            maintainAspectRatio = mediaFileElement.getAttribute("maintainAspectRatio");
                            if (maintainAspectRatio && typeof maintainAspectRatio === "string") {
                                maintainAspectRatio = maintainAspectRatio.toLowerCase();
                                if (maintainAspectRatio === "true") {
                                    mediaFile.maintainAspectRatio = true;
                                } else if (maintainAspectRatio === "false") {
                                    mediaFile.maintainAspectRatio = false;
                                }
                            }
                            creative.mediaFiles.push(mediaFile);
                        }
                    }
                    iconsElement = this.childByName(creativeElement, "Icons");
                    if (iconsElement) {
                        ref6 = this.childsByName(iconsElement, "Icon");
                        for (o = 0, len6 = ref6.length; o < len6; o++) {
                            iconElement = ref6[o];
                            icon = new VASTIcon();
                            icon.program = iconElement.getAttribute("program");
                            icon.height = parseInt(iconElement.getAttribute("height") || 0, 10);
                            icon.width = parseInt(iconElement.getAttribute("width") || 0, 10);
                            icon.xPosition = this.parseXPosition(iconElement.getAttribute("xPosition"));
                            icon.yPosition = this.parseYPosition(iconElement.getAttribute("yPosition"));
                            icon.apiFramework = iconElement.getAttribute("apiFramework");
                            icon.offset = this.parseDuration(iconElement.getAttribute("offset"));
                            icon.duration = this.parseDuration(iconElement.getAttribute("duration"));
                            ref7 = this.childsByName(iconElement, "HTMLResource");
                            for (p = 0, len7 = ref7.length; p < len7; p++) {
                                htmlElement = ref7[p];
                                icon.type = htmlElement.getAttribute("creativeType") || 'text/html';
                                icon.htmlResource = this.parseNodeText(htmlElement);
                            }
                            ref8 = this.childsByName(iconElement, "IFrameResource");
                            for (q = 0, len8 = ref8.length; q < len8; q++) {
                                iframeElement = ref8[q];
                                icon.type = iframeElement.getAttribute("creativeType") || 0;
                                icon.iframeResource = this.parseNodeText(iframeElement);
                            }
                            ref9 = this.childsByName(iconElement, "StaticResource");
                            for (r = 0, len9 = ref9.length; r < len9; r++) {
                                staticElement = ref9[r];
                                icon.type = staticElement.getAttribute("creativeType") || 0;
                                icon.staticResource = this.parseNodeText(staticElement);
                            }
                            iconClicksElement = this.childByName(iconElement, "IconClicks");
                            if (iconClicksElement) {
                                icon.iconClickThroughURLTemplate = this.parseNodeText(this.childByName(iconClicksElement, "IconClickThrough"));
                                ref10 = this.childsByName(iconClicksElement, "IconClickTracking");
                                for (s = 0, len10 = ref10.length; s < len10; s++) {
                                    iconClickTrackingElement = ref10[s];
                                    icon.iconClickTrackingURLTemplates.push(this.parseNodeText(iconClickTrackingElement));
                                }
                            }
                            icon.iconViewTrackingURLTemplate = this.parseNodeText(this.childByName(iconElement, "IconViewTracking"));
                            creative.icons.push(icon);
                        }
                    }
                    return creative;
                },

                parseNonLinear: function(creativeElement, creativeAttributes) {
                    var adParamsElement, base, clickTrackingElement, creative, eventName, htmlElement, i, iframeElement, j, k, l, len, len1, len2, len3, len4, len5, len6, m, n, nonlinearAd, nonlinearResource, o, ref, ref1, ref2, ref3, ref4, ref5, ref6, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate;
                    creative = new VASTCreativeNonLinear(creativeAttributes);
                    ref = this.childsByName(creativeElement, "TrackingEvents");
                    for (i = 0, len = ref.length; i < len; i++) {
                        trackingEventsElement = ref[i];
                        ref1 = this.childsByName(trackingEventsElement, "Tracking");
                        for (j = 0, len1 = ref1.length; j < len1; j++) {
                            trackingElement = ref1[j];
                            eventName = trackingElement.getAttribute("event");
                            trackingURLTemplate = this.parseNodeText(trackingElement);
                            if (eventName && trackingURLTemplate) {
                                if ((base = creative.trackingEvents)[eventName] === null) {
                                    base[eventName] = [];
                                }

                                if (creative.trackingEvents[eventName] && trackingURLTemplate !== null) {
                                    creative.trackingEvents[eventName].push(trackingURLTemplate);
                                }
                            }
                        }
                    }
                    ref2 = this.childsByName(creativeElement, "NonLinear");
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                        nonlinearResource = ref2[k];
                        nonlinearAd = new VASTNonLinear();
                        nonlinearAd.id = nonlinearResource.getAttribute("id") || null;
                        nonlinearAd.width = nonlinearResource.getAttribute("width");
                        nonlinearAd.height = nonlinearResource.getAttribute("height");
                        nonlinearAd.expandedWidth = nonlinearResource.getAttribute("expandedWidth");
                        nonlinearAd.expandedHeight = nonlinearResource.getAttribute("expandedHeight");
                        nonlinearAd.scalable = this.parseBoolean(nonlinearResource.getAttribute("scalable"));
                        nonlinearAd.maintainAspectRatio = this.parseBoolean(nonlinearResource.getAttribute("maintainAspectRatio"));
                        nonlinearAd.minSuggestedDuration = this.parseDuration(nonlinearResource.getAttribute("minSuggestedDuration"));
                        nonlinearAd.apiFramework = nonlinearResource.getAttribute("apiFramework");
                        ref3 = this.childsByName(nonlinearResource, "HTMLResource");
                        for (l = 0, len3 = ref3.length; l < len3; l++) {
                            htmlElement = ref3[l];
                            nonlinearAd.type = htmlElement.getAttribute("creativeType") || 'text/html';
                            nonlinearAd.htmlResource = this.parseNodeText(htmlElement);
                        }
                        ref4 = this.childsByName(nonlinearResource, "IFrameResource");
                        for (m = 0, len4 = ref4.length; m < len4; m++) {
                            iframeElement = ref4[m];
                            nonlinearAd.type = iframeElement.getAttribute("creativeType") || 0;
                            nonlinearAd.iframeResource = this.parseNodeText(iframeElement);
                        }
                        ref5 = this.childsByName(nonlinearResource, "StaticResource");
                        for (n = 0, len5 = ref5.length; n < len5; n++) {
                            staticElement = ref5[n];
                            nonlinearAd.type = staticElement.getAttribute("creativeType") || 0;
                            nonlinearAd.staticResource = this.parseNodeText(staticElement);
                        }
                        adParamsElement = this.childByName(nonlinearResource, "AdParameters");
                        if (adParamsElement) {
                            nonlinearAd.adParameters = this.parseNodeText(adParamsElement);
                        }
                        nonlinearAd.nonlinearClickThroughURLTemplate = this.parseNodeText(this.childByName(nonlinearResource, "NonLinearClickThrough"));
                        ref6 = this.childsByName(nonlinearResource, "NonLinearClickTracking");
                        for (o = 0, len6 = ref6.length; o < len6; o++) {
                            clickTrackingElement = ref6[o];
                            nonlinearAd.nonlinearClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
                        }
                        creative.variations.push(nonlinearAd);
                    }
                    return creative;
                },

                parseCompanionAd: function(creativeElement, creativeAttributes) {
                    var base, child, clickTrackingElement, companionAd, companionResource, creative, eventName, htmlElement, i, iframeElement, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, m, n, o, p, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate;
                    creative = new VASTCreativeCompanion(creativeAttributes);
                    ref = this.childsByName(creativeElement, "Companion");
                    for (i = 0, len = ref.length; i < len; i++) {
                        companionResource = ref[i];
                        companionAd = new VASTCompanionAd();
                        companionAd.id = companionResource.getAttribute("id") || null;
                        companionAd.width = companionResource.getAttribute("width");
                        companionAd.height = companionResource.getAttribute("height");
                        companionAd.companionClickTrackingURLTemplates = [];
                        ref1 = this.childsByName(companionResource, "HTMLResource");
                        for (j = 0, len1 = ref1.length; j < len1; j++) {
                            htmlElement = ref1[j];
                            companionAd.type = htmlElement.getAttribute("creativeType") || 'text/html';
                            companionAd.htmlResource = this.parseNodeText(htmlElement);
                        }
                        ref2 = this.childsByName(companionResource, "IFrameResource");
                        for (k = 0, len2 = ref2.length; k < len2; k++) {
                            iframeElement = ref2[k];
                            companionAd.type = iframeElement.getAttribute("creativeType") || 0;
                            companionAd.iframeResource = this.parseNodeText(iframeElement);
                        }
                        ref3 = this.childsByName(companionResource, "StaticResource");
                        for (l = 0, len3 = ref3.length; l < len3; l++) {
                            staticElement = ref3[l];
                            companionAd.type = staticElement.getAttribute("creativeType") || 0;
                            ref4 = this.childsByName(companionResource, "AltText");
                            for (m = 0, len4 = ref4.length; m < len4; m++) {
                                child = ref4[m];
                                companionAd.altText = this.parseNodeText(child);
                            }
                            companionAd.staticResource = this.parseNodeText(staticElement);
                        }
                        ref5 = this.childsByName(companionResource, "TrackingEvents");
                        for (n = 0, len5 = ref5.length; n < len5; n++) {
                            trackingEventsElement = ref5[n];
                            ref6 = this.childsByName(trackingEventsElement, "Tracking");
                            for (o = 0, len6 = ref6.length; o < len6; o++) {
                                trackingElement = ref6[o];
                                eventName = trackingElement.getAttribute("event");
                                trackingURLTemplate = this.parseNodeText(trackingElement);
                                if (eventName && trackingURLTemplate) {
                                    if ((base = companionAd.trackingEvents)[eventName] === null) {
                                        base[eventName] = [];
                                    }
                                    companionAd.trackingEvents[eventName].push(trackingURLTemplate);
                                }
                            }
                        }
                        ref7 = this.childsByName(companionResource, "CompanionClickTracking");
                        for (p = 0, len7 = ref7.length; p < len7; p++) {
                            clickTrackingElement = ref7[p];
                            companionAd.companionClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
                        }
                        companionAd.companionClickThroughURLTemplate = this.parseNodeText(this.childByName(companionResource, "CompanionClickThrough"));
                        companionAd.companionClickTrackingURLTemplate = this.parseNodeText(this.childByName(companionResource, "CompanionClickTracking"));
                        creative.variations.push(companionAd);
                    }
                    return creative;
                },

                parseDuration: function(durationString) {
                    var durationComponents, hours, minutes, seconds, secondsAndMS;
                    if (!(durationString)) {
                        return -1;
                    }
                    if (VASTAd.isNumeric(durationString)) {
                        return parseInt(durationString, 10);
                    }
                    durationComponents = durationString.split(":");
                    if (durationComponents.length !== 3) {
                        return -1;
                    }
                    secondsAndMS = durationComponents[2].split(".");
                    seconds = parseInt(secondsAndMS[0], 10);
                    if (secondsAndMS.length === 2) {
                        seconds += parseFloat("0." + secondsAndMS[1]);
                    }
                    minutes = parseInt(durationComponents[1] * 60, 10);
                    hours = parseInt(durationComponents[0] * 60 * 60, 10);
                    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || minutes > 60 * 60 || seconds > 60) {
                        return -1;
                    }
                    return hours + minutes + seconds;
                },

                parseXPosition: function(xPosition) {
                    if (xPosition === "left" || xPosition === "right") {
                        return xPosition;
                    }
                    return parseInt(xPosition || 0, 10);
                },

                parseYPosition: function(yPosition) {
                    if (yPosition === "top" || yPosition === "bottom") {
                        return yPosition;
                    }
                    return parseInt(yPosition || 0, 10);
                },

                parseBoolean: function(booleanString) {
                    return booleanString === 'true' || booleanString === 'TRUE' || booleanString === '1';
                },

                parseNodeText: function(node) {
                    return node && (node.textContent || node.text || '').trim();
                },

                copyNodeAttribute: function(attributeName, nodeSource, nodeDestination) {
                    var attributeValue;
                    attributeValue = nodeSource.getAttribute(attributeName);
                    if (attributeValue) {
                        return nodeDestination.setAttribute(attributeName, attributeValue);
                    }
                },

                parseCreativeAdIdAttribute: function(creativeElement) {
                    return creativeElement.getAttribute('AdID') || creativeElement.getAttribute('adID') || creativeElement.getAttribute('adId') || null;
                }
            };
        });
    });
Scoped.define("module:Ads.VAST.Tracker", [
        "module:Ads.VAST.Ad",
        "module:Ads.VAST.CreativeLinear",
        "module:Ads.VAST.NonLinear",
        "module:Ads.VAST.CompanionAd",
        "module:Ads.VAST.Client",
        "base:Events.ListenMixin"
    ],
    function(VASTAd, VASTCreativeLinear, VASTNonLinear, VASTCompanionAd, VASTClient, ListenMixin, scoped) {
        return VASTAd.extend({
            scoped: scoped
        }, [ListenMixin, function(inherited) {
            return {
                constructor: function(ad, creative, variation) {
                    inherited.constructor.call(this, ad, creative, variation);
                    var eventName, events, trackingEvents;
                    this.ad = ad;
                    this.creative = creative;
                    this.variation = variation || null;
                    this.muted = false;
                    this.impressed = false;
                    this.skipable = false;
                    this.skipDelayDefault = -1;

                    this.emitAlwaysEvents = this.availableTrackingEvents;
                    trackingEvents = creative ? creative.trackingEvents : {};

                    for (eventName in trackingEvents) {
                        events = trackingEvents[eventName];
                        if (events)
                            this.trackingEvents[eventName] = events.slice(0);
                    }

                    if (creative instanceof VASTCreativeLinear) {
                        this.setAdDuration(this.creative.duration);
                        this.skipDelay = creative.skipDelay;
                        this.linear = true;
                        this.clickThroughURLTemplate = creative.videoClickThroughURLTemplate;
                        this.clickTrackingURLTemplate = creative.videoClickTrackingURLTemplate;
                    } else {
                        this.skipDelay = -1;
                        this.linear = false;
                        if (this.variation) {
                            if (this.variation instanceof VASTNonLinear) {
                                this.clickThroughURLTemplate = this.variation.nonlinearClickThroughURLTemplate;
                                this.clickTrackingURLTemplates = this.variation.nonlinearClickTrackingURLTemplates;
                            } else if (this.variation instanceof VASTCompanionAd) {
                                this.clickThroughURLTemplate = this.variation.companionClickThroughURLTemplate;
                                this.clickTrackingURLTemplates = this.variation.companionClickTrackingURLTemplates;
                            }
                        }
                    }

                    this.on('adstart', function() {
                        VASTClient.lastSuccessfullAd = +new Date();
                    });


                },

                setAdDuration: function(duration) {
                    this.assetDuration = duration;
                    this.quartiles = {
                        'firstQuartile': Math.round(25 * this.assetDuration) / 100,
                        'midpoint': Math.round(50 * this.assetDuration) / 100,
                        'thirdQuartile': Math.round(75 * this.assetDuration) / 100
                    };
                    return this.quartiles;
                },

                setAdProgress: function(progress) {
                    var eventName, events, i, len, percent, quartile, ref, skipDelay, time;
                    skipDelay = this.skipDelay === null ? this.skipDelayDefault : this.skipDelay;
                    if (skipDelay !== -1 && !this.skipable) {
                        if (skipDelay > progress) {
                            this.trigger('adskip-countdown', skipDelay - progress);
                        } else {
                            this.skipable = true;
                            this.trigger('adskip-countdown', 0);
                        }
                    }
                    if (this.linear && this.assetDuration > 0) {
                        events = [];
                        if (progress > 0) {
                            events.push("start");
                            percent = Math.round(progress / this.assetDuration * 100);
                            events.push("progress-" + percent + "%");
                            events.push("progress-" + (Math.round(progress)));
                            ref = this.quartiles;
                            for (quartile in ref) {
                                time = ref[quartile];
                                if ((time <= progress && progress <= (time + 1))) {
                                    events.push(quartile);
                                }
                            }
                        }
                        for (i = 0, len = events.length; i < len; i++) {
                            eventName = events[i];
                            if (eventName !== null)
                                this.track(eventName, true);
                        }
                        if (progress < this.progress) {
                            this.track("rewind");
                        }
                    }
                    this.progress = progress;
                    return progress;
                },

                setAdMuted: function(muted) {
                    if (this.muted !== muted) {
                        this.track(muted ? "mute" : "unmute");
                    }
                    this.muted = muted;
                    return muted;
                },

                setAdPaused: function(paused) {
                    if (this.paused !== paused) {
                        this.track(paused ? "pause" : "resume");
                    }
                    this.paused = paused;
                    return paused;
                },

                setAdFullscreen: function(fullscreen) {
                    if (this.fullscreen !== fullscreen) {
                        this.track(fullscreen ? "fullscreen" : "exitFullscreen");
                    }
                    this.fullscreen = fullscreen;
                    return fullscreen;
                },

                setAdExpand: function(expanded) {
                    if (this.expanded !== expanded) {
                        this.track(expanded ? "expand" : "collapse");
                    }
                    this.expanded = expanded;
                    return expanded;
                },

                setAdSkipDelay: function(duration) {
                    if (typeof duration === 'number') {
                        this.skipDelay = duration;
                        return duration;
                    }
                },

                loadAd: function() {
                    if (!this.impressed) {
                        this.impressed = true;
                        this.trackAdURLs(this.ad.impressionURLTemplates);
                        return this.track("creativeView");
                    }
                },

                errorAdWithCode: function(errorCode) {
                    return this.trackAdURLs(this.ad.errorURLTemplates, {
                        ERRORCODE: errorCode
                    });
                },

                errorAdWithCodeAndMessage: function(errorCode, errorMessage) {
                    return this.trackAdURLs(this.ad.errorURLTemplates, {
                        ERRORCODE: errorCode,
                        ERRORMESSAGE: errorMessage
                    });
                },

                completeAd: function() {
                    return this.track("completeAd");
                },

                closeAd: function() {
                    return this.track(this.linear ? "closeLinear" : "close");
                },

                stopAd: function() {},

                skipAd: function() {
                    this.track("skip");
                    this.trackingEvents = [];
                    return this.trackingEvents;
                },

                clickAd: function() {
                    var clickThroughURL, ref, variables;
                    if ((ref = this.clickTrackingURLTemplates) !== null ? ref.length : void 0) {
                        this.trackAdURLs(this.clickTrackingURLTemplates);
                    }
                    if (this.clickThroughURLTemplate !== null) {
                        if (this.linear) {
                            variables = {
                                CONTENTPLAYHEAD: this.adProgressFormated()
                            };
                        }
                        clickThroughURL = VASTAd.resolveURLTemplates([this.clickThroughURLTemplate], variables)[0];
                        return this.trigger("clickthrough", clickThroughURL);
                    }
                },

                track: function(eventName, once) {
                    var idx, trackingURLTemplates;
                    if (!once) {
                        once = false;
                    }
                    if (eventName === 'closeLinear' && ((!this.trackingEvents[eventName]) && (this.trackingEvents.close))) {
                        eventName = 'close';
                    }
                    trackingURLTemplates = this.trackingEvents[eventName];
                    idx = this.emitAlwaysEvents.indexOf(eventName);
                    if (trackingURLTemplates !== null) {
                        this.trigger(eventName, '');
                        this.trackAdURLs(trackingURLTemplates);
                    } else if (idx !== -1) {
                        this.trigger(eventName, '');
                    }
                    if (once === true) {
                        delete this.trackingEvents[eventName];
                        delete this.trackingEvents[eventName];
                        if (idx > -1) {
                            this.emitAlwaysEvents.splice(idx, 1);
                        }
                    }
                },

                trackAdURLs: function(URLTemplates, variables) {
                    var _ref;
                    if (!variables) {
                        variables = {};
                    }
                    if (this.linear) {
                        if (((_ref = this.creative.mediaFiles[0]) !== null ? _ref.fileURL : void 0) !== null) {
                            variables.ASSETURI = this.creative.mediaFiles[0].fileURL;
                        }
                        variables.CONTENTPLAYHEAD = this.adProgressFormated();
                    }
                    return VASTAd.track(URLTemplates, variables);
                },

                adProgressFormated: function() {
                    var h, m, ms, s, seconds;
                    seconds = parseInt(this.progress, 10);
                    h = seconds / (60 * 60);
                    if (h.length < 2) {
                        h = "0" + h;
                    }
                    m = seconds / 60 % 60;
                    if (m.length < 2) {
                        m = "0" + m;
                    }
                    s = seconds % 60;
                    if (s.length < 2) {
                        s = "0" + m;
                    }
                    ms = parseInt((this.progress - seconds) * 100, 10);
                    return h + ":" + m + ":" + s + "." + ms;
                }
            };
        }]);
    });
Scoped.define("module:Ads.VAST.URLHandler", ["base:Class"], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            xhr: function() {
                if (window.XMLHttpRequest) {
                    return new XMLHttpRequest();
                } else if (window.ActiveXObject) {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } else {
                    return false;
                }
            },

            supportedXHR: function() {
                return !!this.xhr();
            },

            getXHR: function(url, options, cb) {
                var xhr;
                if (window.location.protocol === 'https:' && url.indexOf('http://') === 0) {
                    return cb(new Error('XHRURLHandler: Cannot go from HTTPS to HTTP.'));
                }

                try {
                    xhr = this.xhr();
                    xhr.open('GET', url);
                    xhr.timeout = options.timeout || 0;
                    xhr.withCredentials = options.withCredentials || false;
                    xhr.overrideMimeType('application/xml');
                    //xhr.overrideMimeType('application/xml') && xhr.overrideMimeType('text/xml');
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                return cb(null, xhr.responseXML);
                            } else {
                                return cb(new Error("XHRURLHandler: " + xhr.statusText));
                            }
                        }
                    };
                    return xhr.send();
                } catch (error) {
                    return cb(new Error('XHRURLHandler: Unexpected error'));
                }
            },

            xdr: function() {
                if (window.XDomainRequest) {
                    return new XDomainRequest();
                } else
                    return false;
            },

            supportedXDR: function() {
                return !!this.xdr();
            },

            getXDR: function(url, options, cb) {
                var xdr, xmlDocument;
                xmlDocument = (typeof window.ActiveXObject === "function") ? new window.ActiveXObject("Microsoft.XMLDOM") : void 0;
                if (xmlDocument) {
                    xmlDocument.async = false;
                } else {
                    return cb(new Error('FlashURLHandler: Microsoft.XMLDOM format not supported'), null);
                }
                xdr = this.xdr();
                xdr.open('GET', url);
                xdr.timeout = options.timeout || 0;
                xdr.withCredentials = options.withCredentials || false;
                xdr.send();
                xdr.onprogress = function() {};
                xdr.onload = function() {
                    xmlDocument.loadXML(xdr.responseText);
                    return cb(null, xmlDocument);
                };
                return xdr.onload;
            },

            get: function(url, options, cb) {
                var response;
                if (!cb) {
                    if (typeof options === 'function') {
                        cb = options;
                    }
                    options = {};
                }

                if (options.response) {
                    response = options.response;
                    delete options.response;
                    return cb(null, response);
                } else if (this.supportedXHR()) {
                    return this.getXHR(url, options, cb);
                } else if (this.supportedXDR()) {
                    return this.getXDR(url, options, cb);
                } else {
                    return cb(new Error('Current context is not supported by any of the default URLHandlers. Please provide a custom URLHandler'));
                }
            }
        };
    });
});
Scoped.define("module:Ads.VAST.VAST", [
        "base:Class",
        "module:Ads.VAST.Client",
        "module:Ads.VAST.Tracker",
        "module:Ads.VAST.Ad",
        "base:Objs",
        "base:Promise",
        "base:Events.EventsMixin"
    ],
    function(Class, VASTClient, VASTTracker, VASTAd, Objs, Promise, EventsMixin, scoped) {
        return Class.extend({
            scoped: scoped
        }, [EventsMixin, function(inherited) {
            return {
                constructor: function(options, requestOptions) {
                    inherited.constructor.call(this);
                    var vastClient, _promise, _self;
                    this.vastServerResponses = [];
                    this.timeout = 5000;
                    this.adPodTimeout = 100;
                    this.companion = undefined;
                    this.sources = [];
                    this.companion = {};

                    _self = this;
                    _promise = Promise.create();

                    vastClient = new VASTClient(options);

                    Objs.iter(options, function(vast) {
                        if (vast.adServer) {
                            vastClient.getAd(vast.adServer, requestOptions, function(err, response) {
                                if (err) {
                                    var _errorMessage = 'Error occurred during loading provided link. ' + err;
                                    _promise.asyncError({
                                        message: _errorMessage
                                    });
                                } else {
                                    _self.vastServerResponses.push(response);
                                    _promise.asyncSuccess(_self.vastServerResponses);
                                }
                            });
                        } else {
                            _promise.asyncError({
                                message: 'Video Ad options are not correct, asServer are required'
                            });
                        }
                    }, this);

                    _promise.success(function(responses) {
                        this.executeAd(responses[0]);
                    }, this);

                    _promise.error(function(error) {
                        this.trigger("adresponseerror", error);
                    }, this);
                },

                executeAd: function(response) {
                    var _ad, _adIds, _crIds, _creative, _foundCreative, _foundCompanion, _self;
                    _self = this;

                    for (_adIds = 0; _adIds < response.ads.length; _adIds++) {
                        _ad = response.ads[_adIds];
                        for (_crIds = 0; _crIds < _ad.creatives.length; _crIds++) {
                            _creative = _ad.creatives[_crIds];
                            _foundCreative = false;
                            _foundCompanion = false;

                            if (_creative.type === 'linear' && !_foundCreative) {
                                if (_creative.mediaFiles.length) {
                                    this.sources = this.createSourceObjects(_creative.mediaFiles);

                                    if (!this.sources.length) {
                                        _self.trigger("adcanceled");
                                        return;
                                    }

                                    this.vastTracker = new VASTTracker(_ad, _creative);
                                    _foundCreative = true;
                                }
                            }

                            if (_creative.type === 'companion' && !_foundCompanion) {
                                this.companion = _creative;
                                _foundCompanion = true;
                            }
                        }
                        if (this.vastTracker) {
                            _self.trigger("vastready");
                            break;
                        } else {
                            VASTAd.trackAd(_ad.errorURLTemplates, {
                                ERRORCODE: 403
                            });
                        }
                    }

                    if (!this.vastTracker) {
                        this.trigger("adcanceled");
                    }
                },

                createSourceObjects: function(mediaFiles) {
                    var _sources, _mediaFile, _source;
                    _sources = [];
                    for (var i = 0, j = mediaFiles.length; i < j; i++) {
                        _mediaFile = mediaFiles[i];
                        _source = {
                            type: _mediaFile.mimeType,
                            src: _mediaFile.fileURL
                        };

                        if (this._canPlaySource(_source)) {
                            _sources[i] = ({
                                type: _mediaFile.mimeType,
                                src: _mediaFile.fileURL,
                                width: _mediaFile.width,
                                height: _mediaFile.height
                            });
                        }
                    }

                    return _sources;
                },

                _canPlaySource: function(source) {
                    var _ext, _mimeType, _allowedMimeTypes;
                    _allowedMimeTypes = [
                        "application/vnd.apple.mpegurl",
                        "video/3gpp",
                        "video/mp4",
                        "video/mpeg",
                        "video/ogg",
                        "video/quicktime",
                        "video/webm",
                        "video/x-m4v",
                        "video/ms-asf",
                        "video/x-ms-wmv",
                        "video/x-msvideo"
                    ];

                    if (source.type) {
                        _mimeType = source.type;
                    } else if (source.src) {
                        _ext = this._ext(source.src);
                        _mimeType = 'video/' + _ext;
                    } else {
                        return false;
                    }

                    return Objs.contains_value(_allowedMimeTypes, _mimeType);
                },

                _ext: function(url) {
                    return (url = url.substr(1 + url.lastIndexOf("/")).split('?')[0]).split('#')[0].substr(url.lastIndexOf("."));
                },

                /**
                 * Runs the callback at the next available opportunity.
                 * @see https://developer.mozilla.org/en-US/docs/Web/API/window.setImmediate
                 */
                setImmediate: function(cb) {
                    return (
                        window.setImmediate ||
                        window.requestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.setTimeout
                    )(cb, 0);
                },

                /**
                 * Clears a callback previously registered with `setImmediate`.
                 * @param {id} id The identifier of the callback to abort
                 */
                clearImmediate: function(id) {
                    return (window.clearImmediate ||
                        window.cancelAnimationFrame ||
                        window.webkitCancelAnimationFrame ||
                        window.mozCancelAnimationFrame ||
                        window.clearTimeout)(id);
                }
            };
        }]);
    }
);

Scoped.define("module:Ads.VAST.Response", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                this.ads = [];
                this.errorURLTemplates = [];
            }
        };
    });
});

Scoped.define("module:Ads.VAST.CompanionAd", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.id = null;
                this.width = 0;
                this.height = 0;
                this.type = null;
                this.staticResource = null;
                this.htmlRecource = null;
                this.iframeResource = null;
                this.altText = null;
                this.companionClickThroughURLTemplate = null;
                this.companionClickTrackingURLTemplates = [];
            }
        };
    });
});

Scoped.define("module:Ads.VAST.Creative", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function(creativeAttributes) {
                inherited.constructor.call(this);

                if (creativeAttributes === null) {
                    creativeAttributes = {};
                }

                this.id = creativeAttributes.id || null;
                this.adId = creativeAttributes.adId || null;
                this.sequence = creativeAttributes.sequence || null;
                this.apiFramework = creativeAttributes.apiFramework || null;

            }
        };
    });
});

Scoped.define("module:Ads.VAST.CreativeLinear", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.type = "linear";
                this.duration = 0;
                this.skipDelay = null;
                this.mediaFiles = [];
                this.videoClickThroughURLTemplate = null;
                this.videoClickTrackingURLTemplates = [];
                this.videoCustomClickURLTemplates = [];
                this.adParameters = null;
                this.icons = [];
            }
        };
    });
});

Scoped.define("module:Ads.VAST.CreativeNonLinear", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.type = "nonlinear";
                this.variations = [];

            }
        };
    });
});

Scoped.define("module:Ads.VAST.AdExtension", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.attributes = {};
                this.children = [];
            }
        };
    });
});


Scoped.define("module:Ads.VAST.AdExtensionChild", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.name = null;
                this.value = null;
                this.attributes = {};
            }
        };
    });
});


Scoped.define("module:Ads.VAST.Icon", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.program = null;
                this.height = 0;
                this.width = 0;
                this.xPosition = 0;
                this.yPosition = 0;
                this.apiFramework = null;
                this.offset = null;
                this.duration = 0;
                this.type = null;
                this.staticResource = null;
                this.htmlResource = null;
                this.iframeResource = null;
                this.iconClickThroughURLTemplate = null;
                this.iconClickTrackingURLTemplates = [];
                this.iconViewTrackingURLTemplate = null;
            }
        };
    });
});

Scoped.define("module:Ads.VAST.MediaFile", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function(inherited) {
                this.id = null;
                this.fileURL = null;
                this.deliveryType = "progressive";
                this.mimeType = null;
                this.codec = null;
                this.bitrate = 0;
                this.minBitrate = 0;
                this.maxBitrate = 0;
                this.width = 0;
                this.height = 0;
                this.apiFramework = null;
                this.scalable = null;
                this.maintainAspectRatio = null;
            }
        };
    });
});

Scoped.define("module:Ads.VAST.CreativeCompanion", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function(inherited) {
                inherited.constructor.call(this);
                this.type = "companion";
                this.variations = [];

            }
        };
    });
});

Scoped.define("module:Ads.VAST.NonLinear", ["module:Ads.VAST.Ad"], function(VASTAd, scoped) {
    return VASTAd.extend({
        scoped: scoped
    }, function(inherited) {
        return {
            constructor: function() {
                inherited.constructor.call(this);
                this.id = null;
                this.width = 0;
                this.height = 0;
                this.expandedWidth = 0;
                this.expandedHeight = 0;
                this.scalable = true;
                this.maintainAspectRatio = true;
                this.minSuggestedDuration = 0;
                this.apiFramework = "static";
                this.type = null;
                this.staticResource = null;
                this.htmlResource = null;
                this.iframeResource = null;
                this.nonlinearClickThroughURLTemplate = null;
                this.nonlinearClickTrackingURLTemplates = [];
                this.adParameters = null;
            }
        };
    });
});
Scoped.define("module:Assets", [
    "base:Classes.LocaleTable",
    "browser:Info"
], function(LocaleTable, Info) {

    var strings = new LocaleTable();
    strings.setWeakLocale(Info.language());

    return {

        strings: strings,

        playerthemes: {},

        recorderthemes: {}

    };
});
Scoped.define("module:VideoPlayer.Dynamics.Adplayer", [
    "dynamics:Dynamic",
    "base:TimeFormat",
    "base:Timers",
    "browser:Dom",
    "media:Player.VideoPlayerWrapper",
    "module:Assets"
], [
    "dynamics:Partials.StylesPartial",
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.IfPartial",
    "dynamics:Partials.ClickPartial",
    "dynamics:Partials.EventPartial",
    "dynamics:Partials.OnPartial"
], function(Class, TimeFormat, Timers, Dom, VideoPlayerWrapper, Assets, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "<div class=\"{{css}}-ad-dashboard\">\n    <div class=\"{{css}}-ad-click-tracker\" ba-click=\"{{ad_clicked()}}\"></div>\n    <div data-selector=\"ad-title\" class=\"{{css}}-ad-title\">\n        <p>{{adtitle}}</p>\n    </div>\n    <div class=\"{{css}}-skipbutton-container\" ba-click=\"skip_linear_ad()\">\n        <p class=\"{{css}}-skipbutton\" ba-show=\"{{skipbuttonvisible}}\">{{lefttillskip > 0 ? string('can-skip-after').replace('%d', lefttillskip) : string('skip-ad')}}</p>\n    </div>\n\n    <div class=\"{{css}}-companion-ad-container\" ba-show=\"{{companionadvisible}}\">\n        <div class=\"{{css}}-close-companion-ad\" ba-click=\"skip_companion_ad()\">X</div>\n        <img class=\"{{css}}-companion-ad\" src=\"\"/>\n    </div>\n\n    <div class=\"{{css}}-ad-controlbar\">\n\n        <div data-selector=\"button-icon-play\" class=\"{{css}}-ad-leftbutton-container\"\n             ba-show=\"{{canpause}}\" ba-if=\"{{!adplaying}}\" ba-click=\"play_ad()\" title=\"{{string('play-video')}}\">\n            <div class=\"{{css}}-ad-button-inner\">\n                <i class=\"{{css}}-icon-play\"></i>\n            </div>\n        </div>\n        <div data-selector=\"button-icon-pause\" class=\"{{css}}-ad-leftbutton-container\"\n             ba-if=\"{{adplaying}}\" ba-click=\"pause_ad()\" ba-show=\"{{canpause}}\" title=\"{{string('pause-video')}}\">\n            <div class=\"{{css}}-ad-button-inner\">\n                <i class=\"{{css}}-icon-pause\"></i>\n            </div>\n        </div>\n        <div class=\"{{css}}-ad-time-container\">\n            <div class=\"{{css}}-ad-time-value\" title=\"{{string('elapsed-time')}}\">{{string('ad-will-end-after').replace('%s', formatTime(adduration))}}</div>\n        </div>\n\n        <div data-selector=\"video-title-block\" class=\"{{css}}-ad-video-title-container\" ba-if=\"{{title}}\">\n            <p class=\"{{css}}-ad-video-title\">\n                {{title}}\n            </p>\n        </div>\n\n        <div data-selector=\"button-icon-resize-full\" ba-show=\"{{enablefullscreen}}\" class=\"{{css}}-ad-rightbutton-container\"\n             ba-if=\"{{fullscreen}}\" ba-click=\"toggle_ad_fullscreen()\" title=\"{{ fullscreened ? string('exit-fullscreen-video') : string('fullscreen-video') }}\">\n            <div class=\"{{css}}-ad-button-inner\">\n                <i class=\"{{css}}-icon-resize-{{fullscreened ? 'small' : 'full'}}\"></i>\n            </div>\n        </div>\n\n        <div class=\"{{css}}-ad-volumebar\">\n            <div data-selector=\"button-volume-bar\" class=\"{{css}}-ad-volumebar-inner\"\n                 onmousedown=\"{{startUpdateAdVolume(domEvent)}}\"\n                 onmouseup=\"{{stopUpdateAdVolume(domEvent)}}\"\n                 onmouseleave=\"{{stopUpdateAdVolume(domEvent)}}\"\n                 onmousemove=\"{{progressUpdateAdVolume(domEvent)}}\">\n                <div class=\"{{css}}-ad-volumebar-position\" ba-styles=\"{{{width: Math.min(100, Math.round(advolume * 100)) + '%'}}}\">\n                    <div class=\"{{css}}-ad-volumebar-button\" title=\"{{string('volume-button')}}\"></div>\n                </div>\n            </div>\n        </div>\n\n        <div data-selector=\"button-icon-volume\" class=\"{{css}}-ad-rightbutton-container\" ba-click=\"toggle_ad_volume()\" title=\"{{string(advolume > 0 ? 'volume-mute' : 'volume-unmute')}}\">\n            <div class=\"{{css}}-ad-button-inner\">\n                <i class=\"{{css + '-icon-volume-' + (advolume >= 0.5 ? 'up' : (advolume > 0 ? 'down' : 'off')) }}\"></i>\n            </div>\n        </div>\n\n    </div>\n</div>\n",

                attrs: {
                    "css": "ba-adplayer",
                    "lefttillskip": 5,
                    "adduration": 0,
                    "duration": 0,
                    "advolume": 1.0,
                    "adplaying": false,
                    "companionadvisible": false,
                    "skipbuttonvisible": false,
                    "canskip": false,
                    "canpause": false,
                    "enablefullscreen": false,
                    "fullscreen": true,
                    "fullscreened": false,
                    "disablepause": false,
                    "title": ""
                },

                functions: {

                    formatTime: function(time) {
                        time = Math.max(time || 0, 1);
                        return TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, time * 1000);
                    },

                    startUpdateAdVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateAdVolume", true);
                        this.call("progressUpdateAdVolume", event);
                    },

                    progressUpdateAdVolume: function(event) {
                        var ev = event[0];
                        ev.preventDefault();
                        if (!this.get("_updateAdVolume"))
                            return;
                        var clientX = ev.clientX;
                        var target = ev.currentTarget;
                        var offset = Dom.elementOffset(target);
                        var dimensions = Dom.elementDimensions(target);
                        this.set("advolume", (clientX - offset.left) / (dimensions.width || 1));
                        this.trigger("advolume", this.get("advolume"));
                    },

                    stopUpdateAdVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateVolume", false);
                    },

                    play_ad: function() {
                        this.trigger("playad");
                    },

                    pause_ad: function() {
                        this.trigger("pausead");
                        this._pauseLinearAd();
                    },

                    toggle_ad_volume: function() {
                        if (this.get("advolume") > 0) {
                            this.__oldVolume = this.get("advolume");
                            this.set("advolume", 0);
                        } else
                            this.set("advolume", this.__oldVolume || 1);
                        this.trigger("advolume", this.get("advolume"));
                    },

                    toggle_ad_fullscreen: function() {
                        this.trigger("fullscreen");
                    },

                    skip_linear_ad: function() {
                        if (!this.get("canskip") && this._dyn._vast)
                            return;
                        this._dyn._vast.trigger("resumeplayer");
                    },

                    skip_companion_ad: function() {},

                    ad_clicked: function() {}
                },

                create: function() {
                    var _adElementHolder, _source, _duration, _adBlock, _volume;

                    this._dyn = this.parent();
                    _adBlock = this._dyn.activeElement().querySelector("[data-video='ad']");

                    _adBlock.style.display = 'none';
                    this._dyn._vast.once("adfire", function() {
                        _adElementHolder = this._dyn.activeElement().querySelector("[data-video='ad-video']");
                        _duration = this._dyn._vast.vastTracker.assetDuration;
                        _source = this._dyn._vast.sources[0];

                        this._attachLinearAd(_adElementHolder, _source, _duration);
                    }, this);

                    this._dyn._vast.on("adplaying", function() {
                        _adBlock.style.display = 'block';
                        if (this._dyn.get("playing")) {
                            this._dyn.player.pause();
                            this._dyn.set("playing", false);
                        }
                    }, this);

                    this._dyn._vast.on("resumeplayer", function() {
                        _adBlock.style.display = 'none';
                        this._dyn.activeElement().querySelector("[data-video='ad-video']").style.display = "none";

                        this._stopLinearAd();

                        this._dyn.player.play();

                        this._timer.weakDestroy();

                        this._dyn.set("adpodplaying", false);
                        this._dyn.set("adslot_active", false);
                        this._dyn.set("controlbar_active", true);

                        this._dyn.set("playing", true);
                    }, this);

                    this.on("pausead", function() {
                        if (!this._timer || !this.__adPlayer)
                            return;
                        this._timer.stop();
                        this.__adPlayer.pause();
                        this.set("adplaying", false);
                    });

                    this.on("playad", function() {
                        if (!this._timer || !this.__adPlayer)
                            return;
                        this._timer.start();
                        this.__adPlayer.play();
                        this.set("adplaying", true);
                    });

                    this.on("advolume", function() {
                        if (!this.__adPlayer)
                            return;
                        _volume = Math.min(1.0, this.get("advolume"));
                        this.__adPlayer.setVolume(_volume);
                        this.__adPlayer.setMuted(_volume <= 0.0);
                    });

                },

                _attachLinearAd: function(element, source, duration) {
                    VideoPlayerWrapper.create({
                        element: element,
                        source: source.src,
                        type: source.type
                    }).error(function(err) {
                        // trigger error related to loading video content
                        this._dyn._vast.trigger("resumeplayer");
                    }, this).success(function(instance) {
                        this.__adPlayer = instance;
                        this.set("adduration", duration);

                        this._dyn.set("controlbar_active", false);
                        this._dyn.set("adslot_active", true);
                        this._dyn.set("adpodplaying", true);

                        this._playLinearAd();
                        this._timer = new Timers.Timer({
                            context: this,
                            fire: this._timerFire,
                            delay: 1000,
                            start: true
                        });
                    }, this);
                },

                _timerFire: function() {
                    var _timeLeft, _leftTillSkip;
                    _timeLeft = this.get("adduration");
                    _leftTillSkip = this.get("lefttillskip");

                    this.set("adduration", --_timeLeft);

                    if (_leftTillSkip >= 0) {
                        if (!this.get("skipbuttonvisible"))
                            this.set("skipbuttonvisible", true);

                        if (_leftTillSkip === 0)
                            this.set("canskip", true);

                        this.set("lefttillskip", --_leftTillSkip);
                    }

                    if (this.get("adduration") === 0) {
                        this._dyn._vast.trigger("resumeplayer");
                    }
                },

                _playLinearAd: function() {
                    this.__adPlayer.play();
                    this.set("adplaying", true);
                    this._dyn._vast.trigger("adplaying");
                },

                _pauseLinearAd: function() {
                    if (this.__adPlayer.playing) {
                        this.__adPlayer.pause();
                        this._dyn._vast.trigger("adpaused");
                    }
                },

                _stopLinearAd: function() {
                    if (this.__adPlayer && this.get("adplaying")) {
                        this.__adPlayer.pause();
                        this.set("adplaying", false);
                    }
                },

                skip_ad: function() {
                    if (this.__adPlayer)
                        this.trigger("resumeplayer");
                }
            };
        })
        .register("ba-videoplayer-adslot")
        .attachStringTable(Assets.strings)
        .addStrings({
            "play-video": "Play",
            "pause-video": "Pause",
            "pause-video-disabled": "Pause not supported",
            "elapsed-time": "Elasped time",
            "fullscreen-video": "Enter fullscreen",
            "exit-fullscreen-video": "Exit fullscreen",
            "volume-button": "Set volume",
            "volume-mute": "Mute sound",
            "volume-unmute": "Unmute sound",
            "ad-will-end-after": "Ad will end after %s",
            "can-skip-after": "Skip after %d",
            "skip-ad": "Skip ad"
        });
});
Scoped.define("module:VideoPlayer.Dynamics.Controlbar", [
    "dynamics:Dynamic",
    "base:TimeFormat",
    "base:Comparators",
    "browser:Dom",
    "module:Assets",
    "browser:Info",
    "media:Player.Support"
], [
    "dynamics:Partials.StylesPartial",
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.IfPartial",
    "dynamics:Partials.ClickPartial"
], function(Class, TimeFormat, Comparators, Dom, Assets, Info, PlayerSupport, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div class=\"{{css}}-dashboard {{activitydelta > 5000 && hideoninactivity ? (css + '-dashboard-hidden') : ''}}\">\n\t<div data-selector=\"progress-bar-inner\" class=\"{{css}}-progressbar {{activitydelta < 2500 || ismobile ? '' : (css + '-progressbar-small')}} {{disableseeking ? css + '-disabled' : ''}}\"\n\t     onmousedown=\"{{startUpdatePosition(domEvent)}}\"\n\t     onmouseup=\"{{stopUpdatePosition(domEvent)}}\"\n\t     onmouseleave=\"{{stopUpdatePosition(domEvent)}}\"\n\t     onmousemove=\"{{progressUpdatePosition(domEvent)}}\">\n\t\t<div class=\"{{css}}-progressbar-cache\" ba-styles=\"{{{width: Math.round(duration ? cached / duration * 100 : 0) + '%'}}}\"></div>\n\t\t<div class=\"{{css}}-progressbar-position\" ba-styles=\"{{{width: Math.round(duration ? position / duration * 100 : 0) + '%'}}}\" title=\"{{string('video-progress')}}\">\n\t\t\t<div class=\"{{css}}-progressbar-button\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"{{css}}-backbar\"></div>\n\t<div class=\"{{css}}-controlbar\">\n        <div data-selector=\"submit-video-button\" class=\"{{css}}-leftbutton-container\" ba-if=\"{{submittable}}\"  ba-click=\"submit()\">\n            <div class=\"{{css}}-button-inner\">\n                {{string('submit-video')}}\n            </div>\n        </div>\n        <div data-selector=\"button-icon-ccw\" class=\"{{css}}-leftbutton-container\" ba-if=\"{{rerecordable}}\"  ba-click=\"rerecord()\" title=\"{{string('rerecord-video')}}\">\n            <div class=\"{{css}}-button-inner\">\n                <i class=\"{{css}}-icon-ccw\"></i>\n            </div>\n        </div>\n\t\t<div data-selector=\"button-icon-play\" class=\"{{css}}-leftbutton-container\" ba-if=\"{{!playing}}\" ba-click=\"play()\" title=\"{{string('play-video')}}\">\n\t\t\t<div class=\"{{css}}-button-inner\">\n\t\t\t\t<i class=\"{{css}}-icon-play\"></i>\n\t\t\t</div>\n\t\t</div>\n\t\t<div data-selector=\"button-icon-pause\" class=\"{{css}}-leftbutton-container {{disablepause ? css + '-disabled' : ''}}\"\n\t\t\t ba-if=\"{{playing}}\" ba-click=\"pause()\" title=\"{{disablepause ? string('pause-video-disabled') : string('pause-video')}}\">\n            <div class=\"{{css}}-button-inner\">\n                <i class=\"{{css}}-icon-pause\"></i>\n            </div>\n\t\t</div>\n\t\t<div class=\"{{css}}-time-container\">\n\t\t\t<div class=\"{{css}}-time-value\" title=\"{{string('elapsed-time')}}\">{{formatTime(position)}}</div>\n\t\t\t<div class=\"{{css}}-time-sep\">/</div>\n\t\t\t<div class=\"{{css}}-time-value\" title=\"{{string('total-time')}}\">{{formatTime(duration || position)}}</div>\n\t\t</div>\n\n\t\t<div data-selector=\"video-title-block\" class=\"{{css}}-video-title-container\" ba-if=\"{{title}}\">\n\t\t\t<p class=\"{{css}}-video-title\">\n\t\t\t\t{{title}}\n\t\t\t</p>\n\t\t</div>\n\n\t\t<div data-selector=\"button-icon-resize-full\" class=\"{{css}}-rightbutton-container\"\n\t\t\t ba-if=\"{{fullscreen}}\" ba-click=\"toggle_fullscreen()\" title=\"{{ fullscreened ? string('exit-fullscreen-video') : string('fullscreen-video') }}\">\n\t\t\t<div class=\"{{css}}-button-inner\">\n\t\t\t\t<i class=\"{{css}}-icon-resize-{{fullscreened ? 'small' : 'full'}}\"></i>\n\t\t\t</div>\n\t\t</div>\n\n        <div data-selector=\"button-airplay\" class=\"{{css}}-rightbutton-container\" ba-show=\"{{airplaybuttonvisible}}\" ba-click=\"show_airplay_devices()\">\n            <div class=\"{{css}}-airplay-container\">\n                <svg width=\"16px\" height=\"11px\" viewBox=\"0 0 16 11\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n                    <!-- Generator: Sketch 3.3.2 (12043) - http://www.bohemiancoding.com/sketch -->\n                    <title>Airplay</title>\n                    <desc>Airplay icon.</desc>\n                    <defs></defs>\n                    <g stroke=\"none\" stroke-width=\"1\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n                        <path d=\"M4,11 L12,11 L8,7 L4,11 Z M14.5454545,0 L1.45454545,0 C0.654545455,0 0,0.5625 0,1.25 L0,8.75 C0,9.4375 0.654545455,10 1.45454545,10 L4.36363636,10 L4.36363636,8.75 L1.45454545,8.75 L1.45454545,1.25 L14.5454545,1.25 L14.5454545,8.75 L11.6363636,8.75 L11.6363636,10 L14.5454545,10 C15.3454545,10 16,9.4375 16,8.75 L16,1.25 C16,0.5625 15.3454545,0 14.5454545,0 L14.5454545,0 Z\" sketch:type=\"MSShapeGroup\"></path>\n                    </g>\n                </svg>\n            </div>\n        </div>\n\n        <div data-selector=\"button-chromecast\" class=\"{{css}}-rightbutton-container {{css}}-cast-button-container\" ba-show=\"{{castbuttonvisble}}\">\n            <button class=\"{{css}}-gcast-button\" is=\"google-cast-button\"></button>\n        </div>\n\n        <div data-selector=\"button-stream-label\" class=\"{{css}}-rightbutton-container\" ba-if=\"{{streams.length > 1 && currentstream}}\" ba-click=\"toggle_stream()\" title=\"{{string('change-resolution')}}\">\n\t\t\t<div class=\"{{css}}-button-inner\">\n\t\t\t\t<span class=\"{{css}}-button-text\">{{currentstream_label}}</span>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"{{css}}-volumebar\">\n\t\t\t<div data-selector=\"button-volume-bar\" class=\"{{css}}-volumebar-inner\"\n\t\t\t     onmousedown=\"{{startUpdateVolume(domEvent)}}\"\n                 onmouseup=\"{{stopUpdateVolume(domEvent)}}\"\n                 onmouseleave=\"{{stopUpdateVolume(domEvent)}}\"\n                 onmousemove=\"{{progressUpdateVolume(domEvent)}}\">\n\t\t\t\t<div class=\"{{css}}-volumebar-position\" ba-styles=\"{{{width: Math.min(100, Math.round(volume * 100)) + '%'}}}\">\n\t\t\t\t    <div class=\"{{css}}-volumebar-button\" title=\"{{string('volume-button')}}\"></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div data-selector=\"button-icon-volume\" class=\"{{css}}-rightbutton-container\" ba-click=\"toggle_volume()\" title=\"{{string(volume > 0 ? 'volume-mute' : 'volume-unmute')}}\">\n\t\t\t<div class=\"{{css}}-button-inner\">\n\t\t\t\t<i class=\"{{css + '-icon-volume-' + (volume >= 0.5 ? 'up' : (volume > 0 ? 'down' : 'off')) }}\"></i>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n",

                attrs: {
                    "css": "ba-videoplayer",
                    "duration": 0,
                    "position": 0,
                    "cached": 0,
                    "volume": 1.0,
                    "expandedprogress": true,
                    "playing": false,
                    "rerecordable": false,
                    "submittable": false,
                    "streams": [],
                    "currentstream": null,
                    "fullscreen": true,
                    "fullscreened": false,
                    "activitydelta": 0,
                    "title": ""
                },

                computed: {
                    "currentstream_label:currentstream": function() {
                        var cs = this.get("currentstream");
                        return cs ? (cs.label ? cs.label : PlayerSupport.resolutionToLabel(cs.width, cs.height)) : "";
                    }
                },

                functions: {

                    formatTime: function(time) {
                        time = Math.max(time || 0, 1);
                        return TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, time * 1000);
                    },

                    startUpdatePosition: function(event) {
                        if (this.get("disableseeking")) return;
                        event[0].preventDefault();
                        this.set("_updatePosition", true);
                        this.call("progressUpdatePosition", event);
                    },

                    progressUpdatePosition: function(event) {
                        var ev = event[0];
                        ev.preventDefault();
                        if (!this.get("_updatePosition"))
                            return;
                        var clientX = ev.clientX;
                        var target = ev.currentTarget;
                        var offset = Dom.elementOffset(target);
                        var dimensions = Dom.elementDimensions(target);
                        this.set("position", this.get("duration") * (clientX - offset.left) / (dimensions.width || 1));

                        var player = this.__parent.player;
                        if (player._broadcastingState.googleCastConnected) {
                            player.trigger('google-cast-seeking', this.get("position"));
                            return;
                        }

                        this.trigger("position", this.get("position"));
                    },

                    stopUpdatePosition: function(event) {
                        event[0].preventDefault();
                        this.set("_updatePosition", false);
                    },

                    startUpdateVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateVolume", true);
                        this.call("progressUpdateVolume", event);
                    },

                    progressUpdateVolume: function(event) {
                        var ev = event[0];
                        ev.preventDefault();
                        if (!this.get("_updateVolume"))
                            return;
                        var clientX = ev.clientX;
                        var target = ev.currentTarget;
                        var offset = Dom.elementOffset(target);
                        var dimensions = Dom.elementDimensions(target);
                        this.set("volume", (clientX - offset.left) / (dimensions.width || 1));
                        this.trigger("volume", this.get("volume"));
                    },

                    stopUpdateVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateVolume", false);
                    },

                    startVerticallyUpdateVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateVolume", true);
                        this.call("progressVerticallyUpdateVolume", event);
                    },

                    progressVerticallyUpdateVolume: function(event) {
                        var ev = event[0];
                        ev.preventDefault();
                        if (!this.get("_updateVolume"))
                            return;
                        var pageY = ev.pageY;
                        var target = ev.currentTarget;
                        var offset = Dom.elementOffset(target);
                        var dimensions = Dom.elementDimensions(target);
                        this.set("volume", 1 - (pageY - offset.top) / dimensions.height);
                        this.trigger("volume", this.get("volume"));
                    },

                    stopVerticallyUpdateVolume: function(event) {
                        event[0].preventDefault();
                        this.set("_updateVolume", false);
                    },


                    play: function() {
                        this.trigger("play");
                    },

                    pause: function() {
                        this.trigger("pause");
                    },

                    toggle_volume: function() {
                        if (this.get("volume") > 0) {
                            this.__oldVolume = this.get("volume");
                            this.set("volume", 0);
                        } else
                            this.set("volume", this.__oldVolume || 1);
                        this.trigger("volume", this.get("volume"));
                    },

                    toggle_fullscreen: function() {
                        this.trigger("fullscreen");
                    },

                    rerecord: function() {
                        this.trigger("rerecord");
                    },

                    submit: function() {
                        this.set("submittable", false);
                        this.set("rerecordable", false);
                        this.trigger("submit");
                    },

                    toggle_stream: function() {
                        var streams = this.get("streams");
                        var current = streams.length - 1;
                        streams.forEach(function(stream, i) {
                            if (Comparators.deepEqual(stream, this.get("currentstream")))
                                current = i;
                        }, this);
                        this.set("currentstream", streams[(current + 1) % streams.length]);
                    },

                    show_airplay_devices: function() {
                        var dynamic = this.__parent;
                        if (dynamic.player._broadcastingState.airplayConnected) {
                            dynamic._broadcasting.lookForAirplayDevices(dynamic.player._element);
                        }
                    }

                },

                create: function() {
                    this.set("ismobile", Info.isMobile());
                }

            };
        })
        .register("ba-videoplayer-controlbar")
        .attachStringTable(Assets.strings)
        .addStrings({
            "video-progress": "Progress",
            "rerecord-video": "Redo?",
            "submit-video": "Confirm",
            "play-video": "Play",
            "pause-video": "Pause",
            "pause-video-disabled": "Pause not supported",
            "elapsed-time": "Elasped time",
            "total-time": "Total length of",
            "fullscreen-video": "Enter fullscreen",
            "volume-button": "Set volume",
            "volume-mute": "Mute sound",
            "volume-unmute": "Unmute sound",
            "change-resolution": "Change resolution",
            "exit-fullscreen-video": "Exit fullscreen"
        });
});
Scoped.define("module:VideoPlayer.Dynamics.Loader", [
    "dynamics:Dynamic",
    "module:Assets"
], function(Class, Assets, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div class=\"{{css}}-loader-container\">\n    <div data-selector=\"loader-block\" class=\"{{css}}-loader-loader\" title=\"{{string('tooltip')}}\">\n    </div>\n</div>\n",

                attrs: {
                    "css": "ba-videoplayer"
                }

            };
        })
        .register("ba-videoplayer-loader")
        .attachStringTable(Assets.strings)
        .addStrings({
            "tooltip": "Loading..."
        });
});
Scoped.define("module:VideoPlayer.Dynamics.Message", [
    "dynamics:Dynamic"
], [
    "dynamics:Partials.ClickPartial"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            template: "\n<div class=\"{{css}}-message-container\" ba-click=\"click()\">\n    <div data-selector=\"message-block\" class='{{css}}-message-message'>\n        {{message}}\n    </div>\n</div>\n",

            attrs: {
                "css": "ba-videoplayer",
                "message": ''
            },

            functions: {

                click: function() {
                    this.trigger("click");
                }

            }

        };
    }).register("ba-videoplayer-message");
});
Scoped.define("module:VideoPlayer.Dynamics.Playbutton", [
    "dynamics:Dynamic",
    "module:Assets"
], [
    "dynamics:Partials.ClickPartial"
], function(Class, Assets, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div data-selector=\"play-button\" class=\"{{css}}-playbutton-container\" ba-click=\"play()\" title=\"{{string('tooltip')}}\">\n\t<div class=\"{{css}}-playbutton-button\"></div>\n</div>\n\n<div class=\"{{css}}-rerecord-bar\" ba-if=\"{{rerecordable || submittable}}\">\n\t<div class=\"{{css}}-rerecord-backbar\"></div>\n\t<div class=\"{{css}}-rerecord-frontbar\">\n        <div class=\"{{css}}-rerecord-button-container\" ba-if=\"{{submittable}}\">\n            <div data-selector=\"player-submit-button\" class=\"{{css}}-rerecord-button\" onclick=\"{{submit()}}\">\n                {{string('submit-video')}}\n            </div>\n        </div>\n        <div class=\"{{css}}-rerecord-button-container\" ba-if=\"{{rerecordable}}\">\n        \t<div data-selector=\"player-rerecord-button\" class=\"{{css}}-rerecord-button\" onclick=\"{{rerecord()}}\">\n        \t\t{{string('rerecord')}}\n        \t</div>\n        </div>\n\t</div>\n</div>\n",

                attrs: {
                    "css": "ba-videoplayer",
                    "rerecordable": false,
                    "submittable": false
                },

                functions: {

                    play: function() {
                        this.trigger("play");
                    },

                    submit: function() {
                        this.set("submittable", false);
                        this.set("rerecordable", false);
                        this.trigger("submit");
                    },

                    rerecord: function() {
                        this.trigger("rerecord");
                    }

                }

            };
        })
        .register("ba-videoplayer-playbutton")
        .attachStringTable(Assets.strings)
        .addStrings({
            "tooltip": "Click to play.",
            "rerecord": "Redo",
            "submit-video": "Confirm video"
        });
});
Scoped.define("module:VideoPlayer.Dynamics.Player", [
    "dynamics:Dynamic",
    "module:Assets",
    "browser:Info",
    "browser:Dom",
    "media:Player.VideoPlayerWrapper",
    "media:Player.Broadcasting",
    "base:Types",
    "base:Objs",
    "base:Strings",
    "base:Time",
    "base:Timers",
    "base:States.Host",
    "base:Classes.ClassRegistry",
    "module:VideoPlayer.Dynamics.PlayerStates.Initial",
    "module:VideoPlayer.Dynamics.PlayerStates",
    "module:Ads.AbstractVideoAdProvider",
    "module:Ads.VAST.VAST",
    "browser:Events"
], [
    "module:VideoPlayer.Dynamics.Playbutton",
    "module:VideoPlayer.Dynamics.Message",
    "module:VideoPlayer.Dynamics.Loader",
    "module:VideoPlayer.Dynamics.Share",
    "module:VideoPlayer.Dynamics.Controlbar",
    "module:VideoPlayer.Dynamics.Adplayer",
    "dynamics:Partials.EventPartial",
    "dynamics:Partials.OnPartial",
    "dynamics:Partials.TemplatePartial"
], function(Class, Assets, Info, Dom, VideoPlayerWrapper, Broadcasting, Types, Objs, Strings, Time, Timers, Host, ClassRegistry, InitialState, PlayerStates, AdProvider, VAST, DomEvents, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "<div itemscope itemtype=\"http://schema.org/VideoObject\"\n    class=\"{{css}}-container {{css}}-size-{{csssize}} {{iecss}}-{{ie8 ? 'ie8' : 'noie8'}} {{csstheme}} {{css}}-{{ fullscreened ? 'fullscreen' : 'normal' }}-view {{css}}-{{ firefox ? 'firefox' : 'common'}}-browser\n    {{css}}-{{themecolor}}-color\"\n    ba-on:mousemove=\"user_activity()\"\n    ba-on:mousedown=\"user_activity(true)\"\n    ba-on:touchstart=\"user_activity(true)\"\n    style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}\"\n>\n    <video class=\"{{css}}-video\" data-video=\"video\" ba-show=\"{{!adpodplaying}}\" ba-toggle:playsinline=\"{{!playfullscreenonmobile}}\"></video>\n    <div class=\"{{css}}-adslot\"  ba-show=\"{{adpodplaying}}\" data-video=\"ad\">\n\t\t<div class=\"{{css}}-ad-video\" data-video=\"ad-video\" ba-toggle:playsinline=\"{{!playfullscreenonmobile}}\" style=\"width: 100%\"></div>\n\t\t<ba-{{dynadslot}}\n\t\t\tba-css=\"{{cssadslot || css}}\"\n\t\t\tba-template=\"{{tmpladslot}}\"\n\t\t\tba-show=\"{{adslot_active}}\"\n\t\t\tba-fullscreened=\"{{fullscreened}}\">\n\t\t</ba-{{dynadslot}}>\n\t</div>\n    <div class=\"{{css}}-overlay {{css}}{{adplaying ? '-adplaying' : ''}}\" ba-show=\"{{!adpodplaying}}\">\n\t\t<div class=\"{{css}}-player-toggle-overlay\" ba-on:click=\"toggle_player()\"></div>\n\t    <ba-{{dyncontrolbar}}\n\t\t    ba-css=\"{{csscontrolbar || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplcontrolbar}}\"\n\t\t    ba-show=\"{{controlbar_active}}\"\n\t\t    ba-playing=\"{{playing}}\"\n\t\t\tba-playwhenvisible=\"{{playwhenvisible}}\"\n            ba-airplay=\"{{airplay}}\"\n\t\t\tba-airplaybuttonvisible=\"{{airplaybuttonvisible}}\"\n            ba-chromecast=\"{{chromecast}}\"\n            ba-castbuttonvisble=\"{{castbuttonvisble}}\"\n\t\t    ba-event:rerecord=\"rerecord\"\n\t\t    ba-event:submit=\"submit\"\n\t\t    ba-event:play=\"play\"\n\t\t    ba-event:pause=\"pause\"\n\t\t    ba-event:position=\"seek\"\n\t\t    ba-event:volume=\"set_volume\"\n\t\t    ba-event:fullscreen=\"toggle_fullscreen\"\n\t\t    ba-volume=\"{{volume}}\"\n\t\t    ba-duration=\"{{duration}}\"\n\t\t    ba-cached=\"{{buffered}}\"\n\t\t    ba-title=\"{{title}}\"\n\t\t    ba-position=\"{{position}}\"\n\t\t    ba-activitydelta=\"{{activity_delta}}\"\n\t\t    ba-hideoninactivity=\"{{hideoninactivity}}\"\n\t\t    ba-rerecordable=\"{{rerecordable}}\"\n\t\t    ba-submittable=\"{{submittable}}\"\n\t\t    ba-streams=\"{{streams}}\"\n\t\t    ba-currentstream=\"{{=currentstream}}\"\n\t\t    ba-fullscreen=\"{{fullscreensupport && !nofullscreen}}\"\n            ba-fullscreened=\"{{fullscreened}}\"\n            ba-source=\"{{source}}\"\n\t\t\tba-disablepause=\"{{disablepause}}\"\n\t\t\tba-disableseeking=\"{{disableseeking}}\"\n\t\t></ba-{{dyncontrolbar}}>\n\t\t\n\t\t<ba-{{dynplaybutton}}\n\t\t    ba-css=\"{{cssplaybutton || css}}\"\n\t\t\tba-theme-color=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplplaybutton}}\"\n\t\t    ba-show=\"{{playbutton_active}}\"\n\t\t    ba-rerecordable=\"{{rerecordable}}\"\n\t\t    ba-submittable=\"{{submittable}}\"\n\t\t    ba-event:play=\"playbutton_click\"\n\t\t    ba-event:rerecord=\"rerecord\"\n\t\t    ba-event:submit=\"submit\"\n\t\t></ba-{{dynplaybutton}}>\n\t\t\n\t\t<ba-{{dynloader}}\n\t\t    ba-css=\"{{cssloader || css}}\"\n\t\t\tba-theme-color=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplloader}}\"\n\t\t\tba-playwhenvisible=\"{{playwhenvisible}}\"\n\t\t    ba-show=\"{{loader_active}}\"\n\t\t></ba-{{dynloader}}>\n\n\t\t<ba-{{dynshare}}\n\t\t\tba-css=\"{{cssshare || css}}\"\n\t\t\tba-theme-color=\"{{themecolor}}\"\n\t\t\tba-template=\"{{tmplshare}}\"\n        \tba-show=\"{{sharevideourl && sharevideo.length > 0}}\"\n\t\t\tba-url=\"{{sharevideourl}}\"\n\t\t\tba-shares=\"{{sharevideo}}\"\n\t\t></ba-{{dynshare}}>\n\t\t\n\t\t<ba-{{dynmessage}}\n\t\t    ba-css=\"{{cssmessage || css}}\"\n\t\t\tba-theme-color=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplmessage}}\"\n\t\t    ba-show=\"{{message_active}}\"\n\t\t    ba-message=\"{{message}}\"\n\t\t    ba-event:click=\"message_click\"\n\t\t></ba-{{dynmessage}}>\n\n\t\t<ba-{{dyntopmessage}}\n\t\t    ba-css=\"{{csstopmessage || css}}\"\n\t\t\tba-theme-color=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmpltopmessage}}\"\n\t\t    ba-show=\"{{topmessage}}\"\n\t\t    ba-topmessage=\"{{topmessage}}\"\n\t\t></ba-{{dyntopmessage}}>\n\t\t\n\t\t<meta itemprop=\"caption\" content=\"{{title}}\" />\n\t\t<meta itemprop=\"thumbnailUrl\" content=\"{{poster}}\"/>\n\t\t<meta itemprop=\"contentUrl\" content=\"{{source}}\"/>\n    </div>\n</div>\n",

                attrs: {
                    /* CSS */
                    "css": "ba-videoplayer",
                    "iecss": "ba-videoplayer",
                    "cssplaybutton": "",
                    "cssloader": "",
                    "cssmessage": "",
                    "csstopmessage": "",
                    "csscontrolbar": "",
                    "cssadslot": "",
                    "width": "",
                    "height": "",
                    /* Themes */
                    "theme": "",
                    "csstheme": "",
                    "themecolor": "",
                    /* Dynamics */
                    "dynplaybutton": "videoplayer-playbutton",
                    "dynloader": "videoplayer-loader",
                    "dynmessage": "videoplayer-message",
                    "dyntopmessage": "videoplayer-topmessage",
                    "dyncontrolbar": "videoplayer-controlbar",
                    "dynshare": "videoplayer-share",
                    "dynadslot": "videoplayer-adslot",
                    /* Templates */
                    "tmplplaybutton": "",
                    "tmplloader": "",
                    "tmplmessage": "",
                    "tmplshare": "",
                    "tmpltopmessage": "",
                    "tmplcontrolbar": "",
                    "tmpladslot": "",
                    /* Attributes */
                    "poster": "",
                    "source": "",
                    "sources": [],
                    "sourcefilter": {},
                    "streams": [],
                    "currentstream": null,
                    "playlist": null,
                    "volume": 1.0,
                    "title": "",
                    "initialseek": null,
                    "fullscreened": false,
                    "sharevideo": [],
                    "sharevideourl": "",
                    "visibilityfraction": 0.8,

                    /* Configuration */
                    "forceflash": false,
                    "noflash": false,
                    "reloadonplay": false,
                    "playonclick": true,
                    /* Ads */
                    "adprovider": null,
                    "preroll": false,
                    "vast": [],
                    "adpodplaying": false,
                    /* Options */
                    "rerecordable": false,
                    "submittable": false,
                    "autoplay": false,
                    "preload": false,
                    "loop": false,
                    "nofullscreen": false,
                    "playfullscreenonmobile": false,
                    "ready": true,
                    "stretch": false,
                    "volumeafterinteraction": false,
                    "hideoninactivity": true,
                    "skipinitial": false,
                    "topmessage": "",
                    "totalduration": null,
                    "playwhenvisible": false,
                    "playedonce": false,
                    "manuallypaused": false,
                    "disablepause": false,
                    "disableseeking": false,
                    "airplay": false,
                    "airplaybuttonvisible": false,
                    "airplaydevicesavailable": false,
                    "chromecast": false,
                    "castbuttonvisble": false,

                    /* States */
                    "states": {
                        "poster_error": {
                            "ignore": false,
                            "click_play": true
                        }
                    }
                },

                types: {
                    "forceflash": "boolean",
                    "noflash": "boolean",
                    "rerecordable": "boolean",
                    "loop": "boolean",
                    "autoplay": "boolean",
                    "preload": "boolean",
                    "ready": "boolean",
                    "nofullscreen": "boolean",
                    "stretch": "boolean",
                    "preroll": "boolean",
                    "hideoninactivity": "boolean",
                    "skipinitial": "boolean",
                    "volume": "float",
                    "initialseek": "float",
                    "fullscreened": "boolean",
                    "sharevideo": "array",
                    "sharevideourl": "string",
                    "playfullscreenonmobile": "boolean",
                    "themecolor": "string",
                    "totalduration": "float",
                    "playwhenvisible": "boolean",
                    "playedonce": "boolean",
                    "manuallypaused": "boolean",
                    "disablepause": "boolean",
                    "disableseeking": "boolean",
                    "playonclick": "boolean",
                    "airplay": "boolean",
                    "airplaybuttonvisible": "boolean",
                    "chromecast": "boolean",
                    "castbuttonvisble": "boolean"
                },

                extendables: ["states"],

                remove_on_destroy: true,

                create: function() {
                    if (Info.isMobile()) {
                        if (Info.isiOS() && Info.iOSversion().major >= 10) {
                            if (this.get("autoplay") || this.get("playwhenvisible")) {
                                this.set("volume", 0.0);
                                this.set("volumeafterinteraction", true);
                            }
                        } else {
                            this.set("autoplay", false);
                            this.set("loop", false);
                        }
                    }
                    if (this.get("theme") in Assets.playerthemes) {
                        Objs.iter(Assets.playerthemes[this.get("theme")], function(value, key) {
                            if (!this.isArgumentAttr(key))
                                this.set(key, value);
                        }, this);
                    }

                    if (!this.get("themecolor"))
                        this.set("themecolor", "default");

                    if (this.get("adprovider")) {
                        this._adProvider = this.get("adprovider");
                        if (Types.is_string(this._adProvider))
                            this._adProvider = AdProvider.registry[this._adProvider];
                    }
                    if (this.get('vast')) {
                        this._vast = new VAST(this.get('vast'));

                        this._vast.once("adresponseerror", function(err) {
                            // some error actions, no respond from ad server
                        }, this);
                    }
                    if (this.get("playlist")) {
                        var pl0 = (this.get("playlist"))[0];
                        this.set("poster", pl0.poster);
                        this.set("source", pl0.source);
                        this.set("sources", pl0.sources);
                    }
                    if (this.get("streams") && !this.get("currentstream"))
                        this.set("currentstream", (this.get("streams"))[0]);

                    this.set("ie8", Info.isInternetExplorer() && Info.internetExplorerVersion() < 9);
                    this.set("firefox", Info.isFirefox());
                    this.set("duration", this.get("totalduration") || 0.0);
                    this.set("position", 0.0);
                    this.set("buffered", 0.0);
                    this.set("message", "");
                    this.set("fullscreensupport", false);
                    this.set("csssize", "normal");

                    this.set("loader_active", false);
                    this.set("playbutton_active", false);
                    this.set("controlbar_active", false);
                    this.set("message_active", false);
                    this.set("adslot_active", false);

                    this.set("last_activity", Time.now());
                    this.set("activity_delta", 0);

                    this.set("playing", false);

                    this.__attachRequested = false;
                    this.__activated = false;
                    this.__error = null;
                    this.__currentStretch = null;

                    this.on("change:stretch", function() {
                        this._updateStretch();
                    }, this);
                    this.host = new Host({
                        stateRegistry: new ClassRegistry(this.cls.playerStates())
                    });
                    this.host.dynamic = this;
                    this.host.initialize(InitialState);

                    this._timer = new Timers.Timer({
                        context: this,
                        fire: this._timerFire,
                        delay: 100,
                        start: true
                    });

                    this.properties().compute("buffering", function() {
                        return this.get("playing") && this.get("buffered") < this.get("position") && this.get("last_position_change_delta") > 1000;
                    }, ["buffered", "position", "last_position_change_delta", "playing"]);
                },

                state: function() {
                    return this.host.state();
                },

                videoAttached: function() {
                    return !!this.player;
                },

                videoLoaded: function() {
                    return this.videoAttached() && this.player.loaded();
                },

                videoError: function() {
                    return this.__error;
                },

                _error: function(error_type, error_code) {
                    this.__error = {
                        error_type: error_type,
                        error_code: error_code
                    };
                    this.trigger("error:" + error_type, error_code);
                    this.trigger("error", error_type, error_code);
                },

                _clearError: function() {
                    this.__error = null;
                },

                _detachVideo: function() {
                    this.set("playing", false);
                    if (this.player)
                        this.player.weakDestroy();
                    if (this._prerollAd)
                        this._prerollAd.weakDestroy();
                    this.player = null;
                },

                _attachVideo: function() {
                    if (this.videoAttached())
                        return;
                    if (!this.__activated) {
                        this.__attachRequested = true;
                        return;
                    }
                    this.__attachRequested = false;
                    var video = this.activeElement().querySelector("[data-video='video']");
                    this._clearError();
                    VideoPlayerWrapper.create(Objs.extend(this._getSources(), {
                        element: video,
                        forceflash: !!this.get("forceflash"),
                        noflash: !!this.get("noflash"),
                        preload: !!this.get("preload"),
                        loop: !!this.get("loop"),
                        reloadonplay: this.get('playlist') ? true : !!this.get("reloadonplay")
                    })).error(function(e) {
                        if (this.destroyed())
                            return;
                        this._error("attach", e);
                    }, this).success(function(instance) {
                        if (this.destroyed())
                            return;
                        if (this._adProvider && this.get("preroll")) {
                            this._prerollAd = this._adProvider.newPrerollAd({
                                videoElement: this.activeElement().querySelector("[data-video='video']"),
                                adElement: this.activeElement().querySelector("[data-video='ad']")
                            });
                        }
                        this.player = instance;

                        if (this.get("chromecast") || this.get("aiplay")) {
                            if (!this.get("skipinitial")) this.set("skipinitial", true);
                            this._broadcasting = new Broadcasting({
                                player: instance,
                                commonOptions: {
                                    title: this.get("title"),
                                    poster: this.player._element.poster,
                                    currentPosition: this.get("position")
                                },
                                castOptions: {
                                    canControlVolume: true,
                                    canPause: !this.get("disablepause"),
                                    canSeek: !this.get("disableseeking"),
                                    displayName: this.get("title"),
                                    //displayStatus: "Please wait connecting",
                                    duration: this.get("duration"),
                                    imageUrl: this.player._element.poster,
                                    isConnected: this.player._broadcastingState.googleCastConnected,
                                    isMuted: false,
                                    isPaused: !this.get("playing")
                                },
                                airplayOptions: {}
                            });
                            if (Info.isChrome() && this.get("chromecast")) {
                                this._broadcasting.attachGoggleCast();
                                this.player.on("cast-available", function(isCastDeviceAvailable) {
                                    this.set("castbuttonvisble", isCastDeviceAvailable);
                                }, this);
                                this.player.on("cast-loaded", function(castRemotePlayer, castRemotePlayerController) {
                                    //castRemotePlayer.currentMediaDuration = this.player;

                                    // If player already start to play
                                    if (this.get("position") > 0) {
                                        this._broadcasting.options.currentPosition = this.get("position");
                                    }

                                    //If local player playing stop it before
                                    if (this.get('playing')) this.stop();

                                    // Intial play button state
                                    if (!castRemotePlayer.isPaused) this.set('playing', true);

                                }, this);

                                this.player.on("cast-playpause", function(castPaused) {
                                    this.set("playing", !castPaused);
                                }, this);

                                this.player.on("cast-time-changed", function(currentTime, totalMediaDuration) {
                                    var position = Math.round(currentTime / totalMediaDuration * 100);
                                    this.set("buffered", totalMediaDuration);
                                    this.set("cahched", totalMediaDuration);
                                    this.set("duration", totalMediaDuration || 0.0);
                                    this.set("position", currentTime);
                                }, this);

                                this.player.on("proceed-when-ending-googlecast", function(position) {
                                    this.player._broadcastingState.googleCastConnected = false;
                                    this.set('playing', false);
                                }, this);

                            }
                            if (Info.isSafari() && Info.safariVersion() >= 9 && window.WebKitPlaybackTargetAvailabilityEvent && this.get("airplay")) {
                                this.set("airplaybuttonvisible", true);
                                this._broadcasting.attachAirplayEvent.call(this, video);
                            }
                        }

                        if (this.get("playwhenvisible")) {
                            this.set("skipinitial", true);
                            var self = this;
                            if (Dom.isElementVisible(video, this.get("visibilityfraction"))) {
                                this.player.play();
                            }

                            this._visiblityScrollEvent = this.auto_destroy(new DomEvents());
                            this._visiblityScrollEvent.on(document, "scroll", function() {
                                if (!self.get('playedonce') && !self.get("manuallypaused")) {
                                    if (Dom.isElementVisible(video, self.get("visibilityfraction")))
                                        self.player.play();
                                    else
                                        self.player.pause();
                                }
                            });

                        }
                        this.player.on("fullscreen-change", function(inFullscreen) {
                            this.set("fullscreened", inFullscreen);
                        }, this);
                        this.player.on("postererror", function() {
                            this._error("poster");
                        }, this);
                        this.player.on("playing", function() {
                            this.set("playing", true);
                            this.trigger("playing");
                        }, this);
                        this.player.on("error", function(e) {
                            this._error("video", e);
                        }, this);
                        if (this.player.error())
                            this.player.trigger("error", this.player.error());
                        this.player.on("paused", function() {
                            this.set("playing", false);
                            this.trigger("paused");
                        }, this);
                        this.player.on("ended", function() {
                            this.set("playing", false);
                            this.set('playedonce', true);
                            this.trigger("ended");
                        }, this);
                        this.trigger("attached", instance);
                        this.player.once("loaded", function() {
                            var volume = Math.min(1.0, this.get("volume"));
                            this.player.setVolume(volume);
                            this.player.setMuted(volume <= 0.0);
                            this.trigger("loaded");
                            if (this.get("totalduration") || this.player.duration() < Infinity)
                                this.set("duration", this.get("totalduration") || this.player.duration());
                            this.set("fullscreensupport", this.player.supportsFullscreen());
                            this._updateStretch();
                            if (this.get("initialseek"))
                                this.player.setPosition(this.get("initialseek"));
                        }, this);
                        if (this.player.loaded())
                            this.player.trigger("loaded");
                        this._updateStretch();
                    }, this);
                },

                _getSources: function() {
                    var filter = this.get("currentstream") ? this.get("currentstream").filter : this.get("sourcefilter");
                    var poster = this.get("poster");
                    var source = this.get("source");
                    var sources = filter ? Objs.filter(this.get("sources"), function(source) {
                        return Objs.subset_of(filter, source);
                    }, this) : this.get("sources");
                    Objs.iter(sources, function(s) {
                        if (s.poster)
                            poster = s.poster;
                    });
                    return {
                        poster: poster,
                        source: source,
                        sources: sources
                    };
                },

                _afterActivate: function(element) {
                    inherited._afterActivate.call(this, element);
                    this.__activated = true;
                    if (this.__attachRequested)
                        this._attachVideo();
                },

                reattachVideo: function() {
                    this.set("reloadonplay", true);
                    this._detachVideo();
                    this._attachVideo();
                },

                object_functions: ["play", "rerecord", "pause", "stop", "seek", "set_volume"],

                functions: {

                    user_activity: function(strong) {
                        this.set("last_activity", Time.now());
                        this.set("activity_delta", 0);
                        if (strong && this.get("volumeafterinteraction")) {
                            this.set("volumeafterinteraction", false);
                            this.set("volume", 1.0);
                        }
                    },

                    message_click: function() {
                        this.trigger("message:click");
                    },

                    playbutton_click: function() {
                        this.host.state().play();
                    },

                    play: function() {
                        if (this.player._broadcastingState.googleCastConnected) {
                            this._broadcasting.player.trigger("play-google-cast");
                            return;
                        }
                        this.host.state().play();
                    },

                    rerecord: function() {
                        if (!this.get("rerecordable"))
                            return;
                        this.trigger("rerecord");
                    },

                    submit: function() {
                        if (!this.get("submittable"))
                            return;
                        this.trigger("submit");
                        this.set("submittable", false);
                        this.set("rerecordable", false);
                    },

                    pause: function() {

                        if (this.get('disablepause')) return;

                        if (this.get("playing")) {
                            if (this.player._broadcastingState.googleCastConnected) {
                                this._broadcasting.player.trigger("pause-google-cast");
                                return;
                            }
                            this.player.pause();
                        }

                        if (this.get("playwhenvisible"))
                            this.set("manuallypaused", true);
                    },

                    stop: function() {
                        if (!this.videoLoaded())
                            return;
                        if (this.get("playing"))
                            this.player.pause();
                        this.player.setPosition(0);
                        this.trigger("stopped");
                    },

                    seek: function(position) {
                        if (this.get('disableseeking')) return;
                        if (this.videoLoaded())
                            this.player.setPosition(position);
                        this.trigger("seek", position);
                    },

                    set_volume: function(volume) {
                        volume = Math.min(1.0, volume);

                        if (this.player._broadcastingState.googleCastConnected) {
                            this._broadcasting.player.trigger("change-google-cast-volume", volume);
                        }

                        this.set("volume", volume);
                        if (this.videoLoaded()) {
                            this.player.setVolume(volume);
                            this.player.setMuted(volume <= 0);
                        }
                    },

                    toggle_fullscreen: function() {
                        if (this.get("fullscreened"))
                            this.player.exitFullscreen();
                        else
                            this.player.enterFullscreen();
                        this.set("fullscreened", !this.get("fullscreened"));
                    },

                    toggle_player: function() {
                        if (!this.get("playonclick"))
                            return;
                        if (this.get('playing') && !this.get("disablepause")) {
                            this.pause();

                            if (this.get("playwhenvisible"))
                                this.set("manuallypaused", true);
                        } else
                            this.play();
                    }

                },

                destroy: function() {
                    this._timer.destroy();
                    this.host.destroy();
                    this._detachVideo();
                    inherited.destroy.call(this);
                },

                _timerFire: function() {
                    if (this.destroyed())
                        return;
                    try {
                        if (this.videoLoaded()) {
                            this.set("activity_delta", Time.now() - this.get("last_activity"));
                            var new_position = this.player.position();
                            if (new_position != this.get("position") || this.get("last_position_change"))
                                this.set("last_position_change", Time.now());
                            this.set("last_position_change_delta", Time.now() - this.get("last_position_change"));
                            this.set("position", new_position);
                            this.set("buffered", this.player.buffered());
                            var pld = this.player.duration();
                            if (0.0 < pld && pld < Infinity)
                                this.set("duration", this.player.duration());
                            else
                                this.set("duration", this.get("totalduration") || new_position);
                            this.set("fullscreened", this.player.isFullscreen());
                        }
                    } catch (e) {}
                    try {
                        this._updateStretch();
                    } catch (e) {}
                    try {
                        this._updateCSSSize();
                    } catch (e) {}
                },

                _updateCSSSize: function() {
                    var width = Dom.elementDimensions(this.activeElement()).width;
                    this.set("csssize", width > 400 ? "normal" : (width > 300 ? "medium" : "small"));
                },

                videoHeight: function() {
                    return this.videoAttached() ? this.player.videoHeight() : NaN;
                },

                videoWidth: function() {
                    return this.videoAttached() ? this.player.videoWidth() : NaN;
                },

                aspectRatio: function() {
                    return this.videoWidth() / this.videoHeight();
                },

                parentWidth: function() {
                    return Dom.elementDimensions(this.activeElement().parentElement).width;
                },

                parentHeight: function() {
                    return Dom.elementDimensions(this.activeElement().parentElement).height;
                },

                parentAspectRatio: function() {
                    return this.parentWidth() / this.parentHeight();
                },

                _updateStretch: function() {
                    var newStretch = null;
                    if (this.get("stretch")) {
                        var ar = this.aspectRatio();
                        if (isFinite(ar)) {
                            var par = this.parentAspectRatio();
                            if (isFinite(par)) {
                                if (par > ar)
                                    newStretch = "height";
                                if (par < ar)
                                    newStretch = "width";
                            } else if (par === Infinity)
                                newStretch = "height";
                        }
                    }
                    if (this.__currentStretch !== newStretch) {
                        if (this.__currentStretch)
                            Dom.elementRemoveClass(this.activeElement(), this.get("css") + "-stretch-" + this.__currentStretch);
                        if (newStretch)
                            Dom.elementAddClass(this.activeElement(), this.get("css") + "-stretch-" + newStretch);
                    }
                    this.__currentStretch = newStretch;
                }

            };
        }, {

            playerStates: function() {
                return [PlayerStates];
            }

        }).register("ba-videoplayer")
        .attachStringTable(Assets.strings)
        .addStrings({
            "video-error": "An error occurred, please try again later. Click to retry."
        });
});
Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.State", [
    "base:States.State",
    "base:Events.ListenMixin",
    "base:Objs"
], function(State, ListenMixin, Objs, scoped) {
    return State.extend({
        scoped: scoped
    }, [ListenMixin, {

        dynamics: [],

        _start: function() {
            this.dyn = this.host.dynamic;
            Objs.iter(Objs.extend({
                "loader": false,
                "message": false,
                "playbutton": false,
                "controlbar": false,
                "adslot": false
            }, Objs.objectify(this.dynamics)), function(value, key) {
                this.dyn.set(key + "_active", value);
            }, this);
            this._started();
        },

        _started: function() {},

        play: function() {
            this.dyn.set("autoplay", true);
        }

    }]);
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.FatalError", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["message"],
        _locals: ["message"],

        _started: function() {
            this.dyn.set("message", this._message || this.dyn.string("video-error"));
        }

    });
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.Initial", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader"],

        _started: function() {
            if (this.dyn.get("ready"))
                this.next("LoadPlayer");
            else {
                this.listenOn(this.dyn, "change:ready", function() {
                    this.next("LoadPlayer");
                });
            }
        }
    });
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadPlayer", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader"],

        _started: function() {
            this.listenOn(this.dyn, "error:attach", function() {
                this.next("LoadError");
            }, this);
            this.listenOn(this.dyn, "error:poster", function() {
                if (!this.dyn.get("states").poster_error.ignore)
                    this.next("PosterError");
            }, this);
            this.listenOn(this.dyn, "attached", function() {
                this.next("PosterReady");
            }, this);
            this.dyn.reattachVideo();
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadError", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["message"],

        _started: function() {
            this.dyn.set("message", this.dyn.string("video-error"));
            this.listenOn(this.dyn, "message:click", function() {
                this.next("LoadPlayer");
            }, this);
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PosterReady", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["playbutton"],

        _started: function() {
            this.listenOn(this.dyn, "error:poster", function() {
                if (!this.dyn.get("states").poster_error.ignore)
                    this.next("PosterError");
            }, this);
            if (this.dyn.get("autoplay") || this.dyn.get("skipinitial"))
                this.play();
        },

        play: function() {
            this.next("Preroll");
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.Preroll", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: [],

        _started: function() {
            if (this.dyn._prerollAd) {
                this.dyn._prerollAd.once("finished", function() {
                    this.next("LoadVideo");
                }, this);
                this.dyn._prerollAd.once("adskipped", function() {
                    this.next("LoadVideo");
                }, this);
                // TODO: video height and width return NaN before ad start even when ba-width/ba-height are provided
                this.dyn._prerollAd.executeAd({
                    width: this.dyn.videoWidth(),
                    height: this.dyn.videoHeight()
                });
            } else
                this.next("LoadVideo");
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PosterError", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["message"],

        _started: function() {
            this.dyn.set("message", this.dyn.string("video-error"));
            this.listenOn(this.dyn, "message:click", function() {
                this.next(this.dyn.get("states").poster_error.click_play ? "LoadVideo" : "LoadPlayer");
            }, this);
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.LoadVideo", [
    "module:VideoPlayer.Dynamics.PlayerStates.State",
    "base:Timers.Timer"
], function(State, Timer, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader"],

        _started: function() {
            this.listenOn(this.dyn, "error:video", function() {
                this.next("ErrorVideo");
            }, this);
            this.listenOn(this.dyn, "playing", function() {
                if (this.destroyed() || this.dyn.destroyed())
                    return;
                if (this.dyn.get("autoseek"))
                    this.dyn.execute("seek", this.dyn.get("autoseek"));
                this.next("PlayVideo");
            }, this);
            if (this.dyn.get("skipinitial") && !this.dyn.get("autoplay"))
                this.next("PlayVideo");
            else {
                this.auto_destroy(new Timer({
                    context: this,
                    fire: function() {
                        if (!this.destroyed() && !this.dyn.destroyed() && this.dyn.player)
                            this.dyn.player.play();
                    },
                    delay: 500,
                    immediate: true
                }));
            }
        }

    });
});



Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.ErrorVideo", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["message"],

        _started: function() {
            this.dyn.set("message", this.dyn.string("video-error"));
            this.listenOn(this.dyn, "message:click", function() {
                this.next("LoadVideo");
            }, this);
        }

    });
});




Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.PlayVideo", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["controlbar"],

        _started: function() {
            this.dyn.set("autoplay", false);
            this.listenOn(this.dyn, "change:currentstream", function() {
                this.dyn.set("autoplay", true);
                this.dyn.set("autoseek", this.dyn.player.position());
                this.dyn.reattachVideo();
                this.next("LoadPlayer");
            }, this);
            this.listenOn(this.dyn, "ended", function() {
                this.dyn.set("autoseek", null);
                this.next("NextVideo");
            }, this);
            this.listenOn(this.dyn, "change:buffering", function() {
                this.dyn.set("loader_active", this.dyn.get("buffering"));
            }, this);
            this.listenOn(this.dyn, "error:video", function() {
                this.next("ErrorVideo");
            }, this);
        },

        play: function() {
            if (!this.dyn.get("playing") && !this.dyn._vast) {
                this.dyn.player.play();
            } else {
                this.dyn._vast.trigger("adfire");
            }
        }

    });
});


Scoped.define("module:VideoPlayer.Dynamics.PlayerStates.NextVideo", [
    "module:VideoPlayer.Dynamics.PlayerStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        _started: function() {
            if (this.dyn.get("playlist")) {
                var list = this.dyn.get("playlist");
                var head = list.shift();
                if (this.dyn.get("loop"))
                    list.push(head);
                this.dyn.set("playlist", list);
                if (list.length > 0) {
                    var pl0 = list[0];
                    this.dyn.set("poster", pl0.poster);
                    this.dyn.set("source", pl0.source);
                    this.dyn.set("sources", pl0.sources);
                    this.dyn.trigger("playlist-next", pl0);
                    this.dyn.reattachVideo();
                    this.dyn.set("autoplay", true);
                    this.next("LoadPlayer");
                    return;
                }
            }
            this.next("PosterReady");
        }

    });
});
Scoped.define("module:VideoPlayer.Dynamics.Share", [
    "dynamics:Dynamic",
    "module:Assets"
], function(Class, Assets, scoped) {

    var SHARES = {
        facebook: 'https://facebook.com/sharer/sharer.php?u=',
        twitter: 'https://twitter.com/home?status=',
        gplus: 'https://plus.google.com/share?url='
    };

    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "<div class=\"{{css}}-share-action-container\">\n    <div class=\"{{css}}-toggle-share-container\">\n        <div class=\"{{css}}-button-inner\" onclick=\"{{toggleShare()}}\">\n            <i class=\"{{css}}-icon-share\"></i>\n        </div>\n    </div>\n    <div class=\"{{css}}-social-buttons-container\">\n        <ul class=\"{{css}}-socials-list\" ba-repeat=\"{{share :: shares}}\">\n            <li class=\"{{css}}-single-social\">\n                <div class=\"{{css}}-button-inner\">\n                    <i class=\"{{css}}-icon-{{share}}\" onclick=\"{{shareMedia(share)}}\"></i>\n                </div>\n            </li>\n        </ul>\n    </div>\n</div>\n",

                attrs: {
                    css: "ba-videoplayer",
                    url: "",
                    shares: []
                },

                functions: {

                    shareMedia: function(share) {
                        window.open(SHARES[share] + this.get("url"), 'pop', 'width=600 height=400');
                    },

                    toggleShare: function() {
                        /*
                        var container = this.activeElement().querySelector().firstElementChild;
                        container.style.right = container.style.right ? "" : "-45px";
                        */
                    }

                }
            };
        }).register("ba-videoplayer-share")
        .attachStringTable(Assets.strings)
        .addStrings({
            "share": "Share media"
        });
});
Scoped.define("module:VideoPlayer.Dynamics.Topmessage", [
    "dynamics:Dynamic"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            template: "\n<div class=\"{{css}}-topmessage-container\">\n    <div class='{{css}}-topmessage-background'>\n    </div>\n    <div data-selector=\"topmessage-message-block\" class='{{css}}-topmessage-message'>\n        {{topmessage}}\n    </div>\n</div>\n",

            attrs: {
                "css": "ba-videoplayer",
                "topmessage": ''
            }

        };
    }).register("ba-videoplayer-topmessage");
});
Scoped.define("module:VideoRecorder.Dynamics.Chooser", [
    "dynamics:Dynamic",
    "module:Assets",
    "browser:Info"
], [
    "dynamics:Partials.ClickPartial",
    "dynamics:Partials.IfPartial"
], function(Class, Assets, Info, scoped) {

    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div class=\"{{css}}-chooser-container\">\n\n\t<div class=\"{{css}}-chooser-button-container\">\n\t\t<div>\n\t\t\t<div data-selector=\"chooser-primary-button\" class=\"{{css}}-chooser-primary-button\"\n\t\t\t     ba-click=\"primary()\"\n\t\t\t     ba-if=\"{{has_primary}}\">\n\t\t\t\t<input data-selector=\"file-input-opt1\" ba-if=\"{{enable_primary_select && primary_select_capture}}\"\n\t\t\t\t       type=\"file\"\n\t\t\t\t       class=\"{{css}}-chooser-file\"\n\t\t\t\t       style=\"height:100\"\n\t\t\t\t       onchange=\"{{primary_select(domEvent)}}\"\n\t\t\t\t       accept=\"{{primary_accept_string}}\"\n\t\t\t\t       capture />\n\t\t\t\t<input data-selector=\"file-input-opt2\" ba-if=\"{{enable_primary_select && !primary_select_capture}}\"\n\t\t\t\t       type=\"file\"\n\t\t\t\t       class=\"{{css}}-chooser-file\"\n\t\t\t\t       style=\"height:100\"\n\t\t\t\t       onchange=\"{{primary_select(domEvent)}}\"\n\t\t\t\t       accept=\"{{primary_accept_string}}\" />\n\t\t\t\t<i class=\"{{css}}-icon-{{primaryrecord ? (!onlyaudio ? 'videocam' : 'volume-up'): 'upload'}}\"></i>\n\t\t\t\t<span>\n\t\t\t\t\t{{!onlyaudio ? primary_label : 'Record Audio'}}\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t</div>\n\t\t<div>\n\t\t\t<div data-selector=\"chooser-secondary-button\" class=\"{{css}}-chooser-secondary-button\"\n\t\t\t     ba-click=\"secondary()\"\n\t\t\t     ba-if=\"{{has_secondary}}\">\n\t\t\t\t<input data-selector=\"file-input-secondary-opt1\" ba-if=\"{{enable_secondary_select && secondary_select_capture}}\"\n\t\t\t\t       type=\"file\"\n\t\t\t\t       class=\"{{css}}-chooser-file\"\n\t\t\t\t       style=\"height:100\"\n\t\t\t\t       onchange=\"{{secondary_select(domEvent)}}\"\n\t\t\t\t       accept=\"{{secondary_accept_string}}\" />\n\t\t\t\t<input data-selector=\"file-input-secondary-opt2\" ba-if=\"{{enable_secondary_select && !secondary_select_capture}}\"\n\t\t\t\t       type=\"file\"\n\t\t\t\t       class=\"{{css}}-chooser-file\"\n\t\t\t\t       style=\"height:100\"\n\t\t\t\t       onchange=\"{{secondary_select(domEvent)}}\"\n\t\t\t\t       accept=\"{{secondary_accept_string}}\" />\n\t\t\t\t<span>\n\t\t\t\t\t{{!onlyaudio ? secondary_label : 'Upload Audio'}}\n\t\t\t\t</span>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n",

                attrs: {
                    "css": "ba-videorecorder",
                    "allowrecord": true,
                    "allowupload": true,
                    "allowcustomupload": true,
                    "allowedextensions": null,
                    "primaryrecord": true,
                    "onlyaudio": false
                },

                types: {
                    "allowedextensions": "array"
                },

                create: function() {
                    var custom_accept_string = "";
                    if (this.get("allowedextensions") && this.get("allowedextensions").length > 0) {
                        var browser_support = Info.isEdge() || Info.isChrome() || Info.isOpera() || (Info.isFirefox() && Info.firefoxVersion() >= 42) || (Info.isInternetExplorer() && Info.internetExplorerVersion() >= 10);
                        if (browser_support)
                            custom_accept_string = "." + this.get("allowedextensions").join(",.");
                    } else if (!this.get("allowcustomupload")) {
                        custom_accept_string = "video/*,video/mp4";
                    }
                    var recordVideoLabel = this.get("onlyaudio") ? "record-audio" : "record-video";
                    this.set("has_primary", true);
                    this.set("enable_primary_select", false);
                    this.set("primary_label", this.string(this.get("primaryrecord") && this.get("allowrecord") ? recordVideoLabel : "upload-video"));
                    this.set("secondary_label", this.string(this.get("primaryrecord") ? "upload-video" : recordVideoLabel));
                    if (!this.get("allowrecord") || !this.get("primaryrecord") || (Info.isMobile() && (!Info.isAndroid() || !Info.isCordova()))) {
                        this.set("enable_primary_select", true);
                        this.set("primary_select_capture", Info.isMobile() && this.get("allowrecord") && this.get("primaryrecord"));
                        if (Info.isMobile())
                            this.set("primary_accept_string", this.get("allowrecord") && this.get("primaryrecord") ? "video/*,video/mp4;capture=camcorder" : "video/*,video/mp4");
                        else
                            this.set("primary_accept_string", custom_accept_string);
                    }
                    this.set("has_secondary", this.get("allowrecord") && this.get("allowupload"));
                    this.set("enable_secondary_select", false);
                    if (this.get("primaryrecord") || (Info.isMobile() && (!Info.isAndroid() || !Info.isCordova()))) {
                        if (!Info.isiOS() || !Info.isCordova()) {
                            this.set("enable_secondary_select", true);
                            this.set("secondary_select_capture", Info.isMobile() && !this.get("primaryrecord"));
                            if (Info.isMobile())
                                this.set("secondary_accept_string", !this.get("primaryrecord") ? "video/*,video/mp4;capture=camcorder" : "video/*,video/mp4");
                            else
                                this.set("secondary_accept_string", custom_accept_string);
                        }
                    }
                },

                __recordCordova: function() {
                    var self = this;
                    navigator.device.capture.captureVideo(function(mediaFiles) {
                        var mediaFile = mediaFiles[0];
                        self.trigger("upload", mediaFile);
                    }, function(error) {}, {
                        limit: 1,
                        duration: this.get("timelimit")
                    });
                },

                __uploadCordova: function() {
                    var self = this;
                    navigator.camera.getPicture(function(url) {
                        self.trigger("upload", {
                            localURL: url,
                            fullPath: url
                        });
                    }, function(error) {}, {
                        destinationType: Camera.DestinationType.FILE_URI,
                        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                        mediaType: Camera.MediaType.VIDEO
                    });
                },

                functions: {
                    primary: function() {
                        if (this.get("enable_primary_select"))
                            return;
                        if (Info.isMobile() && Info.isAndroid() && Info.isCordova())
                            this.__recordCordova();
                        else
                            this.trigger("record");
                    },
                    secondary: function() {
                        if (this.get("enable_secondary_select"))
                            return;
                        if (Info.isMobile() && Info.isAndroid() && Info.isCordova())
                            this.__recordCordova();
                        else if (Info.isMobile() && Info.isiOS() && Info.isCordova())
                            this.__uploadCordova();
                        else
                            this.trigger("record");
                    },
                    primary_select: function(domEvent) {
                        if (!this.get("enable_primary_select"))
                            return;
                        this.trigger("upload", domEvent[0].target);
                    },
                    secondary_select: function(domEvent) {
                        if (!this.get("enable_secondary_select"))
                            return;
                        this.trigger("upload", domEvent[0].target);
                    }
                }

            };
        }).register("ba-videorecorder-chooser")
        .attachStringTable(Assets.strings)
        .addStrings({
            "record-video": "Record Video",
            "record-audio": "Record Audio",
            "upload-video": "Upload Video"
        });
});
Scoped.define("module:VideoRecorder.Dynamics.Controlbar", [
    "dynamics:Dynamic",
    "module:Assets",
    "base:Timers.Timer"
], [
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.RepeatPartial"
], function(Class, Assets, Timer, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "<div class=\"{{css}}-dashboard\">\n\t<div class=\"{{css}}-backbar\"></div>\n\t<div data-selector=\"recorder-settings\" class=\"{{css}}-settings\" ba-show=\"{{settingsvisible && settingsopen}}\">\n\t\t<div class=\"{{css}}-settings-backbar\"></div>\n\t\t<div data-selector=\"settings-list-front\" class=\"{{css}}-settings-front\">\n\t\t\t<ul data-selector=\"camera-settings\" ba-repeat=\"{{camera :: cameras}}\" ba-show=\"{{!novideo}}\">\n\t\t\t\t<li>\n\t\t\t\t\t<input type='radio' name='camera' value=\"{{selectedcamera == camera.id}}\" onclick=\"{{selectCamera(camera.id)}}\" />\n\t\t\t\t\t<span></span>\n\t\t\t\t\t<label onclick=\"{{selectCamera(camera.id)}}\">\n\t\t\t\t\t\t{{camera.label}}\n\t\t\t\t\t</label>\n\t\t\t\t </li>\n\t\t\t</ul>\n\t\t\t<hr ba-show=\"{{!noaudio && !novideo}}\"/>\n\t\t\t<ul data-selector=\"microphone-settings\" ba-repeat=\"{{microphone :: microphones}}\" ba-show=\"{{!noaudio}}\">\n\t\t\t\t<li onclick=\"{{selectMicrophone(microphone.id)}}\">\n\t\t\t\t\t<input type='radio' name='microphone' value=\"{{selectedmicrophone == microphone.id}}\" />\n\t\t\t\t\t<span></span>\n\t\t\t\t\t<label>\n\t\t\t\t\t\t{{microphone.label}}\n\t\t\t\t\t</label>\n\t\t\t\t </li>\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n\t<div data-selector=\"controlbar\" class=\"{{css}}-controlbar\">\n        <div class=\"{{css}}-leftbutton-container\" ba-show=\"{{settingsvisible}}\">\n            <div data-selector=\"record-button-icon-cog\" class=\"{{css}}-button-inner {{css}}-button-{{settingsopen ? 'selected' : 'unselected'}}\"\n                 onclick=\"{{settingsopen=!settingsopen}}\"\n                 onmouseenter=\"{{hover(string('settings'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n                <i class=\"{{css}}-icon-cog\"></i>\n            </div>\n        </div>\n        <div class=\"{{css}}-lefticon-container\" ba-show=\"{{settingsvisible && !novideo}}\">\n            <div data-selector=\"record-button-icon-videocam\" class=\"{{css}}-icon-inner\"\n                 onmouseenter=\"{{hover(string(camerahealthy ? 'camerahealthy' : 'cameraunhealthy'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n                <i class=\"{{css}}-icon-videocam {{css}}-icon-state-{{camerahealthy ? 'good' : 'bad' }}\"></i>\n            </div>\n        </div>\n        <div class=\"{{css}}-lefticon-container\" ba-show=\"{{settingsvisible && !noaudio}}\">\n            <div data-selector=\"record-button-icon-mic\" class=\"{{css}}-icon-inner\"\n                 onmouseenter=\"{{hover(string(microphonehealthy ? 'microphonehealthy' : 'microphoneunhealthy'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n                <i class=\"{{css}}-icon-mic {{css}}-icon-state-{{microphonehealthy ? 'good' : 'bad' }}\"></i>\n            </div>\n        </div>\n        <div class=\"{{css}}-lefticon-container\" ba-show=\"{{stopvisible && recordingindication}}\">\n            <div data-selector=\"recording-indicator\" class=\"{{css}}-recording-indication\">\n            </div>\n        </div>\n        <div class=\"{{css}}-label-container\" ba-show=\"{{controlbarlabel}}\">\n        \t<div data-selector=\"record-label-block\" class=\"{{css}}-label-label\">\n        \t\t{{controlbarlabel}}\n        \t</div>\n        </div>\n        <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{recordvisible}}\">\n        \t<div data-selector=\"record-primary-button\" class=\"{{css}}-button-primary\"\n                 onclick=\"{{record()}}\"\n                 onmouseenter=\"{{hover(string('record-tooltip'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n        \t\t{{string('record')}}\n        \t</div>\n        </div>\n        <div class=\"{{css}}-rightbutton-container\" ba-if=\"{{uploadcovershotvisible}}\">\n        \t<div data-selector=\"covershot-primary-button\" class=\"{{css}}-button-primary\"\n                 onmouseenter=\"{{hover(string('upload-covershot-tooltip'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n                 <input type=\"file\"\n\t\t\t\t       class=\"{{css}}-chooser-file\"\n\t\t\t\t       style=\"height:100\"\n\t\t\t\t       onchange=\"{{uploadCovershot(domEvent)}}\"\n\t\t\t\t       accept=\"{{covershot_accept_string}}\" />\n                 <span>\n        \t\t\t{{string('upload-covershot')}}\n        \t\t</span>\n        \t</div>\n        </div>\n        <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{rerecordvisible}}\">\n        \t<div data-selector=\"rerecord-primary-button\" class=\"{{css}}-button-primary\"\n                 onclick=\"{{rerecord()}}\"\n                 onmouseenter=\"{{hover(string('rerecord-tooltip'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n        \t\t{{string('rerecord')}}\n        \t</div>\n        </div>\n\t\t<div class=\"{{css}}-rightbutton-container\" ba-show=\"{{cancelvisible}}\">\n\t\t\t<div data-selector=\"cancel-primary-button\" class=\"{{css}}-button-primary\"\n\t\t\t\t onclick=\"{{cancel()}}\"\n\t\t\t\t onmouseenter=\"{{hover(string('cancel-tooltip'))}}\"\n\t\t\t\t onmouseleave=\"{{unhover()}}\">\n\t\t\t\t{{string('cancel')}}\n\t\t\t</div>\n\t\t</div>\n        <div class=\"{{css}}-rightbutton-container\" ba-show=\"{{stopvisible}}\">\n        \t<div data-selector=\"stop-primary-button\" class=\"{{css}}-button-primary {{mintimeindicator ? css + '-disabled': ''}}\"\n\t\t\t\t title=\"{{mintimeindicator ? string('stop-available-after').replace('%d', timeminlimit) : string('stop-tooltip')}}\"\n                 onclick=\"{{stop()}}\"\n                 onmouseenter=\"{{hover( mintimeindicator ? string('stop-available-after').replace('%d', timeminlimit) : string('stop-tooltip'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n        \t\t{{string('stop')}}\n        \t</div>\n        </div>\n        <div class=\"{{css}}-centerbutton-container\" ba-show=\"{{skipvisible}}\">\n        \t<div data-selector=\"skip-primary-button\" class=\"{{css}}-button-primary\"\n                 onclick=\"{{skip()}}\"\n                 onmouseenter=\"{{hover(string('skip-tooltip'))}}\"\n                 onmouseleave=\"{{unhover()}}\">\n        \t\t{{string('skip')}}\n        \t</div>\n        </div>\n\t</div>\n</div>\n",

                attrs: {
                    "css": "ba-videorecorder",
                    "hovermessage": "",
                    "recordingindication": true,
                    "covershot_accept_string": "image/*,image/png,image/jpg,image/jpeg"
                },

                create: function() {
                    this.auto_destroy(new Timer({
                        context: this,
                        fire: function() {
                            this.set("recordingindication", !this.get("recordingindication"));
                        },
                        delay: 500
                    }));
                },

                functions: {
                    selectCamera: function(cameraId) {
                        this.trigger("select-camera", cameraId);
                    },
                    selectMicrophone: function(microphoneId) {
                        this.trigger("select-microphone", microphoneId);
                    },
                    hover: function(text) {
                        this.set("hovermessage", text);
                    },
                    unhover: function() {
                        this.set("hovermessage", "");
                    },
                    record: function() {
                        this.trigger("invoke-record");
                    },
                    rerecord: function() {
                        this.trigger("invoke-rerecord");
                    },
                    stop: function() {
                        this.trigger("invoke-stop");
                    },
                    skip: function() {
                        this.trigger("invoke-skip");
                    },
                    cancel: function() {
                        this.trigger("invoke-cancel");
                    },
                    uploadCovershot: function(domEvent) {
                        this.trigger("upload-covershot", domEvent[0].target);
                    }
                }

            };
        })
        .register("ba-videorecorder-controlbar")
        .attachStringTable(Assets.strings)
        .addStrings({
            "settings": "Settings",
            "camerahealthy": "Lighting is good",
            "cameraunhealthy": "Lighting is not optimal",
            "microphonehealthy": "Sound is good",
            "microphoneunhealthy": "Cannot pick up any sound",
            "record": "Record",
            "record-tooltip": "Click here to record.",
            "rerecord": "Redo",
            "rerecord-tooltip": "Click here to redo.",
            "upload-covershot": "Upload",
            "upload-covershot-tooltip": "Click here to upload custom cover shot",
            "stop": "Stop",
            "stop-tooltip": "Click here to stop.",
            "skip": "Skip",
            "skip-tooltip": "Click here to skip.",
            "stop-available-after": "Minimum recording time is %d seconds",
            "cancel": "Cancel",
            "cancel-tooltip": "Click here to cancel."
        });
});
Scoped.define("module:VideoRecorder.Dynamics.Imagegallery", [
    "dynamics:Dynamic",
    "base:Collections.Collection",
    "base:Properties.Properties",
    "base:Timers.Timer",
    "browser:Dom"
], [
    "dynamics:Partials.StylesPartial"
], function(Class, Collection, Properties, Timer, Dom, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            template: "<div data-selector=\"slider-left-button\" class=\"{{css}}-imagegallery-leftbutton\">\n\t<div data-selector=\"slider-left-inner-button\" class=\"{{css}}-imagegallery-button-inner\" onclick=\"{{left()}}\">\n\t\t<i class=\"{{css}}-icon-left-open\"></i>\n\t</div>\n</div>\n\n<div data-selector=\"images-imagegallery-container\" ba-repeat=\"{{image::images}}\" class=\"{{css}}-imagegallery-container\" data-gallery-container>\n     <div class=\"{{css}}-imagegallery-image\"\n          ba-styles=\"{{{left: image.left + 'px', top: image.top + 'px', width: image.width + 'px', height: image.height + 'px'}}}\"\n          onclick=\"{{select(image)}}\">\n     </div>\n</div>\n\n<div data-selector=\"slider-right-button\" class=\"{{css}}-imagegallery-rightbutton\">\n\t<div data-selector=\"slider-right-inner-button\" class=\"{{css}}-imagegallery-button-inner\" onclick=\"{{right()}}\">\n\t\t<i class=\"{{css}}-icon-right-open\"></i>\n\t</div>\n</div>\n",

            attrs: {
                "css": "ba-videorecorder",
                "imagecount": 3,
                "imagenativewidth": 0,
                "imagenativeheight": 0,
                "containerwidth": 0,
                "containerheight": 0,
                "containeroffset": 0,
                "deltafrac": 1 / 8
            },

            computed: {
                "imagewidth:imagecount,containerwidth,deltafrac": function() {
                    if (this.get("imagecount") <= 0)
                        return 0.0;
                    return this.get("containerwidth") * (1 - this.get("deltafrac")) / this.get("imagecount");
                },
                "imagedelta:imagecount,containerwidth,deltafrac": function() {
                    if (this.get("imagecount") <= 1)
                        return 0.0;
                    return this.get("containerwidth") * (this.get("deltafrac")) / (this.get("imagecount") - 1);
                },
                "imageheight:imagewidth,imagenativewidth,imagenativeheight": function() {
                    return this.get("imagenativeheight") * this.get("imagewidth") / this.get("imagenativewidth");
                }
            },

            create: function() {
                var images = this.auto_destroy(new Collection());
                this.set("images", images);
                this.snapshotindex = 0;
                this._updateImageCount();
                this.on("change:imagecount", this._updateImageCount, this);
                this.on("change:imagewidth change:imageheight change:imagedelta", this._recomputeImageBoxes, this);
                this.auto_destroy(new Timer({
                    context: this,
                    delay: 1000,
                    fire: function() {
                        this.updateContainerSize();
                    }
                }));
            },

            destroy: function() {
                this.get("images").iterate(function(image) {
                    if (image.snapshotDisplay && this.parent().recorder)
                        this.parent().recorder.removeSnapshotDisplay(image.snapshotDisplay);
                }, this);
                inherited.destroy.call(this);
            },

            _updateImageCount: function() {
                var images = this.get("images");
                var n = this.get("imagecount");
                while (images.count() < n) {
                    var image = new Properties({
                        index: images.count()
                    });
                    this._recomputeImageBox(image);
                    images.add(image);
                }
                while (images.count() > n)
                    images.remove(images.getByIndex(images.count() - 1));
            },

            _recomputeImageBoxes: function() {
                this.get("images").iterate(function(image) {
                    this._recomputeImageBox(image);
                }, this);
            },

            _recomputeImageBox: function(image) {
                if (!this.parent().recorder)
                    return;
                var i = image.get("index");
                var iw = this.get("imagewidth");
                var ih = this.get("imageheight");
                var id = this.get("imagedelta");
                var h = this.get("containerheight");
                image.set("left", 1 + Math.round(i * (iw + id)));
                image.set("top", 1 + Math.round((h - ih) / 2));
                image.set("width", 1 + Math.round(iw));
                image.set("height", 1 + Math.round(ih));
                if (image.snapshot && image.snapshotDisplay) {
                    this.parent().recorder.updateSnapshotDisplay(
                        image.snapshot,
                        image.snapshotDisplay,
                        image.get("left") + this.get("containeroffset"),
                        image.get("top"),
                        image.get("width"),
                        image.get("height")
                    );
                }
            },

            updateContainerSize: function() {
                var container = this.activeElement().querySelector("[data-gallery-container]");
                var offset = Dom.elementOffset(container);
                var videoOffset = Dom.elementOffset(this.parent().recorder._element);
                var left = offset.left - videoOffset.left;
                var dimensions = Dom.elementDimensions(container);
                this.set("containeroffset", left);
                this.set("containerheight", dimensions.height);
                this.set("containerwidth", dimensions.width);
            },

            _afterActivate: function(element) {
                inherited._afterActivate.apply(this, arguments);
                this.updateContainerSize();
            },

            loadImageSnapshot: function(image, snapshotindex) {
                if (image.snapshotDisplay) {
                    this.parent().recorder.removeSnapshotDisplay(image.snapshotDisplay);
                    image.snapshotDisplay = null;
                }
                var snapshots = this.parent().snapshots;
                image.snapshot = snapshots[((snapshotindex % snapshots.length) + snapshots.length) % snapshots.length];
                image.snapshotDisplay = this.parent().recorder.createSnapshotDisplay(
                    this.activeElement(),
                    image.snapshot,
                    image.get("left") + this.get("containeroffset"),
                    image.get("top"),
                    image.get("width"),
                    image.get("height")
                );
            },

            loadSnapshots: function() {
                this.get("images").iterate(function(image) {
                    this.loadImageSnapshot(image, this.snapshotindex + image.get("index"));
                }, this);
            },

            nextSnapshots: function() {
                this.snapshotindex += this.get("imagecount");
                this.loadSnapshots();
            },

            prevSnapshots: function() {
                this.snapshotindex -= this.get("imagecount");
                this.loadSnapshots();
            },

            functions: {
                left: function() {
                    this.prevSnapshots();
                },
                right: function() {
                    this.nextSnapshots();
                },
                select: function(image) {
                    this.trigger("image-selected", image.snapshot);
                }
            }

        };
    }).register("ba-videorecorder-imagegallery");
});
Scoped.define("module:VideoRecorder.Dynamics.Loader", [
    "dynamics:Dynamic",
    "module:Assets"
], [
    "dynamics:Partials.ShowPartial"
], function(Class, Assets, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div class=\"{{css}}-loader-container\">\n    <div data-selector=\"recorder-loader-block\" class=\"{{css}}-loader-loader\" title=\"{{tooltip}}\">\n    </div>\n</div>\n<div data-selector=\"recorder-loader-label-container\" class=\"{{css}}-loader-label\" ba-show=\"{{label}}\">\n\t{{label}}\n</div>\n",

                attrs: {
                    "css": "ba-videorecorder",
                    "tooltip": "",
                    "label": "",
                    "message": "",
                    "hovermessage": ""
                }

            };
        }).register("ba-videorecorder-loader")
        .attachStringTable(Assets.strings)
        .addStrings({});
});
Scoped.define("module:VideoRecorder.Dynamics.Message", [
    "dynamics:Dynamic"
], [
    "dynamics:Partials.ClickPartial"
], function(Class, Templates, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            template: "\n<div data-selector=\"recorder-message-container\" class=\"{{css}}-message-container\" ba-click=\"click()\">\n    <div data-selector=\"recorder-message-block\" class='{{css}}-message-message'>\n        {{message || \"\"}}\n    </div>\n</div>\n",

            attrs: {
                "css": "ba-videorecorder",
                "message": ''
            },

            functions: {

                click: function() {
                    this.trigger("click");
                }

            }

        };
    }).register("ba-videorecorder-message");
});
Scoped.define("module:VideoRecorder.Dynamics.Recorder", [
    "dynamics:Dynamic",
    "module:Assets",
    "browser:Info",
    "browser:Dom",
    "browser:Upload.MultiUploader",
    "browser:Upload.FileUploader",
    "media:Recorder.VideoRecorderWrapper",
    "base:Types",
    "base:Objs",
    "base:Strings",
    "base:Time",
    "base:Timers",
    "base:States.Host",
    "base:Classes.ClassRegistry",
    "base:Collections.Collection",
    "base:Promise",
    "module:VideoRecorder.Dynamics.RecorderStates.Initial",
    "module:VideoRecorder.Dynamics.RecorderStates"
], [
    "module:VideoRecorder.Dynamics.Imagegallery",
    "module:VideoRecorder.Dynamics.Loader",
    "module:VideoRecorder.Dynamics.Controlbar",
    "module:VideoRecorder.Dynamics.Message",
    "module:VideoRecorder.Dynamics.Topmessage",
    "module:VideoRecorder.Dynamics.Chooser",
    "dynamics:Partials.ShowPartial",
    "dynamics:Partials.IfPartial",
    "dynamics:Partials.EventPartial",
    "dynamics:Partials.OnPartial",
    "dynamics:Partials.DataPartial",
    "dynamics:Partials.AttrsPartial",
    "dynamics:Partials.TemplatePartial"
], function(Class, Assets, Info, Dom, MultiUploader, FileUploader, VideoRecorderWrapper, Types, Objs, Strings, Time, Timers, Host, ClassRegistry, Collection, Promise, InitialState, RecorderStates, scoped) {
    return Class.extend({
            scoped: scoped
        }, function(inherited) {
            return {

                template: "\n<div data-selector=\"recorder-container\" ba-show=\"{{!player_active}}\"\n     class=\"{{css}}-container {{css}}-size-{{csssize}} {{iecss}}-{{ie8 ? 'ie8' : 'noie8'}} {{csstheme}}\n     \t{{css}}-{{ fullscreened ? 'fullscreen' : 'normal' }}-view {{css}}-{{ firefox ? 'firefox' : 'common'}}-browser\n    \t{{css}}-{{themecolor}}-color\"\n     style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : 'width:100%;'}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : 'height:100%'}}\"\n>\n\n    <video data-selector=\"recorder-status\" class=\"{{css}}-video {{css}}-{{hasrecorder ? 'hasrecorder' : 'norecorder'}}\" data-video=\"video\"></video>\n    <div data-selector=\"recorder-overlay\" class='{{css}}-overlay' ba-show=\"{{!hideoverlay}}\" data-overlay=\"overlay\">\n\t\t<ba-{{dynloader}}\n\t\t    ba-css=\"{{cssloader || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplloader}}\"\n\t\t    ba-show=\"{{loader_active}}\"\n\t\t    ba-tooltip=\"{{loadertooltip}}\"\n\t\t\tba-hovermessage=\"{{=hovermessage}}\"\n\t\t    ba-label=\"{{loaderlabel}}\"\n\t\t></ba-{{dynloader}}>\n\n\t\t<ba-{{dynmessage}}\n\t\t    ba-css=\"{{cssmessage || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplmessage}}\"\n\t\t    ba-show=\"{{message_active}}\"\n\t\t    ba-message=\"{{message}}\"\n\t\t    ba-event:click=\"message_click\"\n\t\t></ba-{{dynmessage}}>\n\n\t\t<ba-{{dyntopmessage}}\n\t\t    ba-css=\"{{csstopmessage || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmpltopmessage}}\"\n\t\t    ba-show=\"{{topmessage_active && (topmessage || hovermessage)}}\"\n\t\t    ba-topmessage=\"{{hovermessage || topmessage}}\"\n\t\t></ba-{{dyntopmessage}}>\n\n\t\t<ba-{{dynchooser}}\n\t\t\tba-onlyaudio=\"{{onlyaudio}}\"\n\t\t    ba-css=\"{{csschooser || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplchooser}}\"\n\t\t    ba-show=\"{{chooser_active}}\"\n\t\t    ba-allowrecord=\"{{allowrecord}}\"\n\t\t    ba-allowupload=\"{{allowupload}}\"\n\t\t    ba-allowcustomupload=\"{{allowcustomupload}}\"\n\t\t    ba-allowedextensions=\"{{allowedextensions}}\"\n\t\t    ba-primaryrecord=\"{{primaryrecord}}\"\n\t\t    ba-timelimit=\"{{timelimit}}\"\n\t\t    ba-event:record=\"record_video\"\n\t\t    ba-event:upload=\"upload_video\"\n\t\t></ba-{{dynchooser}}>\n\n\t\t<ba-{{dynimagegallery}}\n\t\t    ba-css=\"{{cssimagegallery || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplimagegallery}}\"\n\t\t    ba-if=\"{{imagegallery_active}}\"\n\t\t    ba-imagecount=\"{{gallerysnapshots}}\"\n\t\t    ba-imagenativewidth=\"{{recordingwidth}}\"\n\t\t    ba-imagenativeheight=\"{{recordingheight}}\"\n\t\t    ba-event:image-selected=\"select_image\"\n\t\t></ba-{{dynimagegallery}}>\n\n\t\t<ba-{{dyncontrolbar}}\n\t\t    ba-css=\"{{csscontrolbar || css}}\"\n\t\t\tba-themecolor=\"{{themecolor}}\"\n\t\t    ba-template=\"{{tmplcontrolbar}}\"\n\t\t    ba-show=\"{{controlbar_active}}\"\n\t\t    ba-cameras=\"{{cameras}}\"\n\t\t    ba-microphones=\"{{microphones}}\"\n\t\t    ba-noaudio=\"{{noaudio}}\"\n\t\t\tba-novideo=\"{{onlyaudio}}\"\n\t\t    ba-selectedcamera=\"{{selectedcamera || 0}}\"\n\t\t    ba-selectedmicrophone=\"{{selectedmicrophone || 0}}\"\n\t\t    ba-camerahealthy=\"{{camerahealthy}}\"\n\t\t    ba-microphonehealthy=\"{{microphonehealthy}}\"\n\t\t    ba-hovermessage=\"{{=hovermessage}}\"\n\t\t    ba-settingsvisible=\"{{settingsvisible}}\"\n\t\t    ba-recordvisible=\"{{recordvisible}}\"\n\t\t\tba-cancelvisible=\"{{allowcancel && cancancel}}\"\n\t\t    ba-uploadcovershotvisible=\"{{uploadcovershotvisible}}\"\n\t\t    ba-rerecordvisible=\"{{rerecordvisible}}\"\n\t\t    ba-stopvisible=\"{{stopvisible}}\"\n\t\t    ba-skipvisible=\"{{skipvisible}}\"\n\t\t    ba-controlbarlabel=\"{{controlbarlabel}}\"\n\t\t\tba-mintimeindicator=\"{{mintimeindicator}}\"\n\t\t\tba-timeminlimit=\"{{timeminlimit}}\"\n\t\t    ba-event:select-camera=\"select_camera\"\n\t\t    ba-event:select-microphone=\"select_microphone\"\n\t\t    ba-event:invoke-record=\"record\"\n\t\t    ba-event:invoke-rerecord=\"rerecord\"\n\t\t    ba-event:invoke-stop=\"stop\"\n\t\t    ba-event:invoke-skip=\"invoke_skip\"\n\t\t    ba-event:upload-covershot=\"upload_covershot\"\n\t\t></ba-{{dyncontrolbar}}>\n    </div>\n</div>\n\n<div data-selector=\"recorder-player\" ba-if=\"{{player_active}}\"\n     style=\"{{width ? 'width:' + width + ((width + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}{{height ? 'height:' + height + ((height + '').match(/^\\d+$/g) ? 'px' : '') + ';' : ''}}\"\n>\n\t<ba-{{dynvideoplayer}} ba-theme=\"{{theme || 'default'}}\"\n        ba-themecolor=\"{{themecolor}}\"\n        ba-source=\"{{playbacksource}}\"\n        ba-poster=\"{{playbackposter}}\"\n        ba-hideoninactivity=\"{{false}}\"\n        ba-forceflash=\"{{forceflash}}\"\n        ba-noflash=\"{{noflash}}\"\n        ba-stretch=\"{{stretch}}\"\n\t\tba-onlyaudio=\"{{onlyaudio}}\"\n        ba-attrs=\"{{playerattrs}}\"\n        ba-data:id=\"player\"\n        ba-width=\"{{width}}\"\n        ba-height=\"{{height}}\"\n        ba-totalduration=\"{{duration / 1000}}\"\n        ba-rerecordable=\"{{rerecordable && (recordings === null || recordings > 0)}}\"\n        ba-submittable=\"{{manualsubmit && verified}}\"\n        ba-reloadonplay=\"{{true}}\"\n        ba-autoplay=\"{{autoplay}}\"\n        ba-nofullscreen=\"{{nofullscreen}}\"\n        ba-topmessage=\"{{playertopmessage}}\"\n        ba-event:rerecord=\"rerecord\"\n        ba-event:playing=\"playing\"\n        ba-event:paused=\"paused\"\n        ba-event:ended=\"ended\"\n        ba-event:submit=\"manual_submit\"\n        >\n\t</ba-{{dynvideoplayer}}>\n</div>\n",

                attrs: {
                    /* CSS */
                    "css": "ba-videorecorder",
                    "iecss": "ba-videorecorder",
                    "cssimagegallery": "",
                    "cssloader": "",
                    "csscontrolbar": "",
                    "cssmessage": "",
                    "csstopmessage": "",
                    "csschooser": "",
                    "width": "",
                    "height": "",
                    "gallerysnapshots": 3,

                    /* Themes */
                    "theme": "",
                    "csstheme": "",

                    /* Dynamics */
                    "dynimagegallery": "videorecorder-imagegallery",
                    "dynloader": "videorecorder-loader",
                    "dyncontrolbar": "videorecorder-controlbar",
                    "dynmessage": "videorecorder-message",
                    "dyntopmessage": "videorecorder-topmessage",
                    "dynchooser": "videorecorder-chooser",
                    "dynvideoplayer": "videoplayer",

                    /* Templates */
                    "tmplimagegallery": "",
                    "tmplloader": "",
                    "tmplcontrolbar": "",
                    "tmplmessage": "",
                    "tmpltopmessage": "",
                    "tmplchooser": "",

                    /* Attributes */
                    "autorecord": false,
                    "autoplay": false,
                    "allowrecord": true,
                    "allowupload": true,
                    "allowcustomupload": true,
                    "primaryrecord": true,
                    "nofullscreen": false,
                    "recordingwidth": 640,
                    "recordingheight": 480,
                    "countdown": 3,
                    "snapshotmax": 15,
                    "framerate": null,
                    "audiobitrate": null,
                    "videobitrate": null,
                    "snapshottype": "jpg",
                    "picksnapshots": true,
                    "playbacksource": "",
                    "playbackposter": "",
                    "recordermode": true,
                    "skipinitial": false,
                    "skipinitialonrerecord": false,
                    "timelimit": null,
                    "timeminlimit": null,
                    "rtmpstreamtype": "mp4",
                    "rtmpmicrophonecodec": "speex",
                    "webrtcstreaming": false,
                    "microphone-volume": 1.0,
                    "flip-camera": false,
                    "early-rerecord": false,
                    "custom-covershots": false,
                    "manualsubmit": false,
                    "allowedextensions": null,
                    "filesizelimit": null,

                    /* Configuration */
                    "forceflash": false,
                    "simulate": false,
                    "noflash": false,
                    "onlyaudio": false,
                    "noaudio": false,
                    "flashincognitosupport": false,
                    "localplayback": false,
                    "uploadoptions": {},
                    "playerattrs": {},

                    /* Options */
                    "rerecordable": true,
                    "allowcancel": false,
                    "recordings": null,
                    "ready": true,
                    "stretch": false

                },

                scopes: {
                    player: ">[id='player']"
                },

                types: {
                    "forceflash": "boolean",
                    "noflash": "boolean",
                    "rerecordable": "boolean",
                    "ready": "boolean",
                    "stretch": "boolean",
                    "autorecord": "boolean",
                    "autoplay": "boolean",
                    "allowrecord": "boolean",
                    "allowupload": "boolean",
                    "allowcustomupload": "boolean",
                    "primaryrecord": "boolean",
                    "flashincognitosupport": "boolean",
                    "recordermode": "boolean",
                    "nofullscreen": "boolean",
                    "skipinitialonrerecord": "boolean",
                    "picksnapshots": "boolean",
                    "localplayback": "boolean",
                    "noaudio": "boolean",
                    "skipinitial": "boolean",
                    "webrtcstreaming": "boolean",
                    "microphone-volume": "float",
                    "audiobitrate": "int",
                    "videobitrate": "int",
                    "flip-camera": "boolean",
                    "early-rerecord": "boolean",
                    "custom-covershots": "boolean",
                    "manualsubmit": "boolean",
                    "simulate": "boolean",
                    "allowedextensions": "array",
                    "onlyaudio": "boolean",
                    "allowcancel": "boolean"
                },

                extendables: ["states"],

                remove_on_destroy: true,

                create: function() {

                    if (this.get("theme") in Assets.recorderthemes) {
                        Objs.iter(Assets.recorderthemes[this.get("theme")], function(value, key) {
                            if (!this.isArgumentAttr(key))
                                this.set(key, value);
                        }, this);
                    }
                    this.set("ie8", Info.isInternetExplorer() && Info.internetExplorerVersion() < 9);
                    this.set("hideoverlay", false);

                    if (Info.isMobile()) {
                        this.set("skipinitial", false);
                        this.set("skipinitialonrerecord", false);
                    }

                    this.__attachRequested = false;
                    this.__activated = false;
                    this._bound = false;
                    this.__recording = false;
                    this.__error = null;
                    this.__currentStretch = null;

                    this.on("change:stretch", function() {
                        this._updateStretch();
                    }, this);
                    this.host = new Host({
                        stateRegistry: new ClassRegistry(this.cls.recorderStates())
                    });
                    this.host.dynamic = this;
                    this.host.initialize(InitialState);

                    this._timer = new Timers.Timer({
                        context: this,
                        fire: this._timerFire,
                        delay: 250,
                        start: true
                    });

                    this.__cameraResponsive = true;
                    this.__cameraSignal = true;

                    if (this.get("onlyaudio")) {
                        this.set("picksnapshots", false);
                        this.set("allowupload", false);
                    }

                },

                state: function() {
                    return this.host.state();
                },

                recorderAttached: function() {
                    return !!this.recorder;
                },

                videoError: function() {
                    return this.__error;
                },

                _error: function(error_type, error_code) {
                    this.__error = {
                        error_type: error_type,
                        error_code: error_code
                    };
                    this.trigger("error:" + error_type, error_code);
                    this.trigger("error", error_type, error_code);
                },

                _clearError: function() {
                    this.__error = null;
                },

                _detachRecorder: function() {
                    if (this.recorder)
                        this.recorder.weakDestroy();
                    this.recorder = null;
                    this.set("hasrecorder", false);
                },

                _attachRecorder: function() {
                    if (this.recorderAttached())
                        return;
                    if (!this.__activated) {
                        this.__attachRequested = true;
                        return;
                    }
                    this.set("hasrecorder", true);
                    this.snapshots = [];
                    this.__attachRequested = false;
                    var video = this.activeElement().querySelector("[data-video='video']");
                    this._clearError();
                    this.recorder = VideoRecorderWrapper.create({
                        element: video,
                        simulate: this.get("simulate"),
                        forceflash: this.get("forceflash"),
                        noflash: this.get("noflash"),
                        recordVideo: !this.get("onlyaudio"),
                        recordAudio: !this.get("noaudio"),
                        recordingWidth: this.get("recordingwidth"),
                        recordingHeight: this.get("recordingheight"),
                        audioBitrate: this.get("audiobitrate"),
                        videoBitrate: this.get("videobitrate"),
                        flashFullSecurityDialog: !this.get("flashincognitosupport"),
                        rtmpStreamType: this.get("rtmpstreamtype"),
                        rtmpMicrophoneCodec: this.get("rtmpmicrophonecodec"),
                        webrtcStreaming: !!this.get("webrtcstreaming"),
                        framerate: this.get("framerate"),
                        flip: this.get("flip-camera")
                    });
                    if (this.recorder)
                        this.trigger("attached");
                    else
                        this._error("attach");
                },

                _bindMedia: function() {
                    if (this._bound || !this.recorderAttached() || !this.recorder)
                        return;
                    this.recorder.ready.success(function() {
                        this.recorder.on("require_display", function() {
                            this.set("hideoverlay", true);
                        }, this);
                        this.recorder.bindMedia().error(function(e) {
                            this.trigger("access_forbidden", e);
                            this.set("hideoverlay", false);
                            this.off("require_display", null, this);
                            this._error("bind", e);
                        }, this).success(function() {
                            this.trigger("access_granted");
                            this.recorder.setVolumeGain(this.get("microphone-volume"));
                            this.set("hideoverlay", false);
                            this.off("require_display", null, this);
                            this.recorder.enumerateDevices().success(function(devices) {
                                var selected = this.recorder.currentDevices();
                                this.set("selectedcamera", selected.video);
                                this.set("selectedmicrophone", selected.audio);
                                this.set("cameras", new Collection(Objs.values(devices.video)));
                                this.set("microphones", new Collection(Objs.values(devices.audio)));
                            }, this);
                            if (!this.get("noaudio"))
                                this.recorder.testSoundLevel(true);
                            this.set("devicetesting", true);
                            this._updateStretch();
                            while (this.snapshots.length > 0) {
                                var snapshot = this.snapshots.unshift();
                                this.recorder.removeSnapshot(snapshot);
                            }
                            this._bound = true;
                            this.trigger("bound");
                        }, this);
                    }, this);
                },

                isFlash: function() {
                    return this.recorder && this.recorder.isFlash();
                },

                _initializeUploader: function() {
                    if (this._dataUploader)
                        this._dataUploader.weakDestroy();
                    this._dataUploader = new MultiUploader();
                },

                _unbindMedia: function() {
                    if (!this._bound)
                        return;
                    this.recorder.unbindMedia();
                    this._bound = false;
                },

                _uploadCovershot: function(image) {
                    if (this.get("simulate"))
                        return;
                    this.__lastCovershotUpload = image;
                    var uploader = this.recorder.createSnapshotUploader(image, this.get("snapshottype"), this.get("uploadoptions").image);
                    uploader.upload();
                    this._dataUploader.addUploader(uploader);
                },

                _uploadCovershotFile: function(file) {
                    if (this.get("simulate"))
                        return;
                    this.__lastCovershotUpload = file;
                    var uploader = FileUploader.create(Objs.extend({
                        source: file
                    }, this.get("uploadoptions").image));
                    uploader.upload();
                    this._dataUploader.addUploader(uploader);
                },

                _uploadVideoFile: function(file) {
                    if (this.get("simulate"))
                        return;
                    var uploader = FileUploader.create(Objs.extend({
                        source: file
                    }, this.get("uploadoptions").video));
                    uploader.upload();
                    this._dataUploader.addUploader(uploader);
                },

                _prepareRecording: function() {
                    return Promise.create(true);
                },

                _startRecording: function() {
                    if (this.__recording)
                        return Promise.error(true);
                    if (!this.get("noaudio"))
                        this.recorder.testSoundLevel(false);
                    this.set("devicetesting", false);
                    return this.recorder.startRecord({
                        rtmp: this.get("uploadoptions").rtmp,
                        video: this.get("uploadoptions").video,
                        audio: this.get("uploadoptions").audio,
                        webrtcStreaming: this.get("uploadoptions").webrtcStreaming
                    }).success(function() {
                        this.__recording = true;
                        this.__recording_start_time = Time.now();
                    }, this);
                },

                _stopRecording: function() {
                    if (!this.__recording)
                        return Promise.error(true);
                    return this.recorder.stopRecord({
                        rtmp: this.get("uploadoptions").rtmp,
                        video: this.get("uploadoptions").video,
                        audio: this.get("uploadoptions").audio,
                        webrtcStreaming: this.get("uploadoptions").webrtcStreaming
                    }).success(function(uploader) {
                        this.__recording = false;
                        uploader.upload();
                        this._dataUploader.addUploader(uploader);
                    }, this);
                },

                _verifyRecording: function() {
                    return Promise.create(true);
                },

                _afterActivate: function(element) {
                    inherited._afterActivate.call(this, element);
                    this.__activated = true;
                    if (this.__attachRequested)
                        this._attachRecorder();
                },

                _showBackgroundSnapshot: function() {
                    if (this.get("onlyaudio"))
                        return;
                    this._hideBackgroundSnapshot();
                    this.__backgroundSnapshot = this.recorder.createSnapshot(this.get("snapshottype"));
                    var el = this.activeElement().querySelector("[data-video]");
                    var dimensions = Dom.elementDimensions(el);
                    this.__backgroundSnapshotDisplay = this.recorder.createSnapshotDisplay(el, this.__backgroundSnapshot, 0, 0, dimensions.width, dimensions.height);
                },

                _hideBackgroundSnapshot: function() {
                    if (this.get("onlyaudio"))
                        return;
                    if (this.__backgroundSnapshotDisplay)
                        this.recorder.removeSnapshotDisplay(this.__backgroundSnapshotDisplay);
                    delete this.__backgroundSnapshotDisplay;
                    if (this.__backgroundSnapshot)
                        this.recorder.removeSnapshot(this.__backgroundSnapshot);
                    delete this.__backgroundSnapshot;
                },

                object_functions: ["record", "rerecord", "stop", "play", "pause", "reset"],

                functions: {

                    cancel: function() {
                        if (confirm(this.string("cancel-confirm")))
                            this.execute("reset");
                    },

                    record: function() {
                        this.host.state().record();
                    },

                    record_video: function() {
                        this.host.state().selectRecord();
                    },

                    upload_video: function(file) {
                        this.host.state().selectUpload(file);
                    },

                    upload_covershot: function(file) {
                        this.host.state().uploadCovershot(file);
                    },

                    select_camera: function(camera_id) {
                        if (this.recorder) {
                            this.recorder.setCurrentDevices({
                                video: camera_id
                            });
                            this.set("selectedcamera", camera_id);
                        }
                    },

                    select_microphone: function(microphone_id) {
                        if (this.recorder) {
                            this.recorder.setCurrentDevices({
                                audio: microphone_id
                            });
                            this.recorder.testSoundLevel(true);
                            this.set("selectedmicrophone", microphone_id);
                        }
                        this.set("microphonehealthy", false);
                    },

                    invoke_skip: function() {
                        this.trigger("invoke-skip");
                    },

                    select_image: function(image) {
                        this.trigger("select-image", image);
                    },

                    rerecord: function() {
                        if (confirm(this.string("rerecord-confirm")))
                            this.host.state().rerecord();
                    },

                    stop: function() {
                        this.host.state().stop();
                    },

                    play: function() {
                        this.host.state().play();
                    },

                    pause: function() {
                        this.host.state().pause();
                    },

                    message_click: function() {
                        this.trigger("message-click");
                    },

                    playing: function() {
                        this.trigger("playing");
                    },

                    paused: function() {
                        this.trigger("paused");
                    },

                    ended: function() {
                        this.trigger("ended");
                    },

                    reset: function() {
                        this._stopRecording().callback(function() {
                            this._unbindMedia();
                            this._detachRecorder();
                            this.host.state().next("Initial");
                        }, this);
                    },

                    manual_submit: function() {
                        this.set("rerecordable", false);
                        this.set("manualsubmit", false);
                        this.trigger("manually_submitted");
                    }

                },

                destroy: function() {
                    this._timer.destroy();
                    this.host.destroy();
                    this._detachRecorder();
                    inherited.destroy.call(this);
                },

                deltaCoefficient: function() {
                    return this.recorderAttached() ? this.recorder.deltaCoefficient() : null;
                },

                blankLevel: function() {
                    return this.recorderAttached() ? this.recorder.blankLevel() : null;
                },

                lightLevel: function() {
                    return this.recorderAttached() ? this.recorder.lightLevel() : null;
                },

                soundLevel: function() {
                    return this.recorderAttached() ? this.recorder.soundLevel() : null;
                },

                _timerFire: function() {
                    if (this.destroyed())
                        return;
                    try {
                        if (this.recorderAttached() && this.get("devicetesting")) {
                            var lightLevel = this.lightLevel();
                            this.set("camerahealthy", lightLevel >= 100 && lightLevel <= 200);
                            if (!this.get("noaudio") && !this.get("microphonehealthy") && this.soundLevel() >= 1.01) {
                                this.set("microphonehealthy", true);
                                this.recorder.testSoundLevel(false);
                            }
                        }
                    } catch (e) {}

                    if (!this.get("onlyaudio")) {
                        if (this.__recording && this.__recording_start_time + 500 < Time.now()) {
                            var p = this.snapshots.length < this.get("snapshotmax") ? 0.25 : 0.05;
                            if (Math.random() <= p) {
                                var snap = this.recorder.createSnapshot(this.get("snapshottype"));
                                if (snap) {
                                    if (this.snapshots.length < this.get("snapshotmax")) {
                                        this.snapshots.push(snap);
                                    } else {
                                        var i = Math.floor(Math.random() * this.get("snapshotmax"));
                                        this.recorder.removeSnapshot(this.snapshots[i]);
                                        this.snapshots[i] = snap;
                                    }
                                }
                            }
                        }
                    }

                    try {
                        if (this.recorderAttached() && this._timer.fire_count() % 20 === 0 && this._accessing_camera) {
                            var signal = this.blankLevel() >= 0.01;
                            if (signal !== this.__cameraSignal) {
                                this.__cameraSignal = signal;
                                this.trigger(signal ? "camera_signal" : "camera_nosignal");
                            }
                        }
                        if (this.recorderAttached() && this._timer.fire_count() % 20 === 10 && this._accessing_camera) {
                            var delta = this.recorder.deltaCoefficient();
                            var responsive = delta === null || delta >= 0.5;
                            if (responsive !== this.__cameraResponsive) {
                                this.__cameraResponsive = responsive;
                                this.trigger(responsive ? "camera_responsive" : "camera_unresponsive");
                            }
                        }
                    } catch (e) {}

                    this._updateStretch();
                    this._updateCSSSize();
                },

                _updateCSSSize: function() {
                    var width = Dom.elementDimensions(this.activeElement()).width;
                    this.set("csssize", width > 400 ? "normal" : (width > 300 ? "medium" : "small"));
                },

                videoHeight: function() {
                    return this.recorderAttached() ? this.recorder.cameraHeight() : NaN;
                },

                videoWidth: function() {
                    return this.recorderAttached() ? this.recorder.cameraWidth() : NaN;
                },

                aspectRatio: function() {
                    return this.videoWidth() / this.videoHeight();
                },

                parentWidth: function() {
                    return this.get("width") || Dom.elementDimensions(this.activeElement()).width;
                },

                parentHeight: function() {
                    return this.get("height") || Dom.elementDimensions(this.activeElement()).height;
                },

                parentAspectRatio: function() {
                    return this.parentWidth() / this.parentHeight();
                },

                averageFrameRate: function() {
                    return this.recorderAttached() ? this.recorder.averageFrameRate() : null;
                },

                _updateStretch: function() {
                    var newStretch = null;
                    if (this.get("stretch")) {
                        var ar = this.aspectRatio();
                        if (isFinite(ar)) {
                            var par = this.parentAspectRatio();
                            if (isFinite(par)) {
                                if (par > ar)
                                    newStretch = "height";
                                if (par < ar)
                                    newStretch = "width";
                            } else if (par === Infinity)
                                newStretch = "height";
                        }
                    }
                    if (this.__currentStretch !== newStretch) {
                        if (this.__currentStretch)
                            Dom.elementRemoveClass(this.activeElement(), this.get("css") + "-stretch-" + this.__currentStretch);
                        if (newStretch)
                            Dom.elementAddClass(this.activeElement(), this.get("css") + "-stretch-" + newStretch);
                    }
                    this.__currentStretch = newStretch;
                }

            };
        }, {

            recorderStates: function() {
                return [RecorderStates];
            }

        }).register("ba-videorecorder")
        .attachStringTable(Assets.strings)
        .addStrings({
            "recorder-error": "An error occurred, please try again later. Click to retry.",
            "attach-error": "We could not access the camera interface. Depending on the device and browser, you might need to install Flash or access the page via SSL.",
            "access-forbidden": "Access to the camera was forbidden. Click to retry.",
            "pick-covershot": "Pick a covershot.",
            "uploading": "Uploading",
            "uploading-failed": "Uploading failed - click here to retry.",
            "verifying": "Verifying",
            "verifying-failed": "Verifying failed - click here to retry.",
            "rerecord-confirm": "Do you really want to redo your video?",
            "cancel-confirm": "Do you really want to cancel your video upload?",
            "video_file_too_large": "Your video file is too large (%s) - click here to try again with a smaller video file.",
            "unsupported_video_type": "Please upload: %s - click here to retry."
        });
});
Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.State", [
    "base:States.State",
    "base:Events.ListenMixin",
    "base:Objs"
], function(State, ListenMixin, Objs, scoped) {
    return State.extend({
        scoped: scoped
    }, [ListenMixin, {

        dynamics: [],

        _start: function() {
            this.dyn = this.host.dynamic;
            Objs.iter(Objs.extend({
                "message": false,
                "chooser": false,
                "topmessage": false,
                "controlbar": false,
                "loader": false,
                "imagegallery": false
            }, Objs.objectify(this.dynamics)), function(value, key) {
                this.dyn.set(key + "_active", value);
            }, this);
            this.dyn.set("playertopmessage", "");
            this.dyn._accessing_camera = false;
            this._started();
        },

        _started: function() {},

        record: function() {
            this.dyn.set("autorecord", true);
        },

        stop: function() {
            this.dyn.scopes.player.execute('stop');
        },

        play: function() {
            this.dyn.scopes.player.execute('play');
        },

        pause: function() {
            this.dyn.scopes.player.execute('pause');
        },

        rerecord: function() {},

        selectRecord: function() {},

        selectUpload: function(file) {},

        uploadCovershot: function(file) {}

    }]);
});



Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.FatalError", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "browser:Info",
    "base:Timers.Timer"
], function(State, Info, Timer, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["message"],
        _locals: ["message", "retry", "flashtest"],

        _started: function() {
            this.dyn.set("message", this._message || this.dyn.string("recorder-error"));
            this.listenOn(this.dyn, "message-click", function() {
                if (this._retry)
                    this.next(this._retry);
            });
            if (this._flashtest && !Info.isMobile() && Info.flash().supported() && !Info.flash().installed()) {
                this.auto_destroy(new Timer({
                    delay: 500,
                    context: this,
                    fire: function() {
                        if (Info.flash(true).installed())
                            this.next(this._retry);
                    }
                }));
                if (Info.isSafari() && Info.safariVersion() >= 10)
                    window.open("https://get.adobe.com/flashplayer");
            }
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Initial", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        _started: function() {
            this.dyn.set("verified", false);
            this.dyn.set("playbacksource", null);
            this.dyn.set("playbackposter", null);
            this.dyn.set("player_active", false);
            this.dyn._initializeUploader();
            if (!this.dyn.get("recordermode")) {
                if (!this.dyn.get("video")) {
                    console.warn("recordermode:false requires an existing video to be present and provided.");
                    this.dyn.set("recordermode", true);
                } else
                    this.next("Player");
            } else if (this.dyn.get("autorecord") || this.dyn.get("skipinitial"))
                this.eventualNext("CameraAccess");
            else
                this.next("Chooser");
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Player", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        rerecord: function() {
            this.dyn.trigger("rerecord");
            this.dyn.set("recordermode", true);
            this.next("Initial");
        },

        _started: function() {
            this.dyn.set("player_active", true);
        },

        _end: function() {
            this.dyn.set("player_active", false);
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Chooser", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "base:Strings",
    "browser:Info"
], function(State, Strings, Info, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["chooser"],

        record: function() {
            this.dyn.set("autorecord", true);
            this.selectRecord();
        },

        selectRecord: function() {
            this.next("CameraAccess");
        },

        selectUpload: function(file) {
            if (!(Info.isMobile() && Info.isAndroid() && Info.isCordova())) {
                if (this.dyn.get("allowedextensions")) {
                    var filename = (file.files[0].name || "").toLowerCase();
                    var found = false;
                    this.dyn.get("allowedextensions").forEach(function(extension) {
                        if (Strings.ends_with(filename, "." + extension.toLowerCase()))
                            found = true;
                    }, this);
                    if (!found) {
                        this.next("FatalError", {
                            message: this.dyn.string("unsupported_video_type").replace("%s", this.dyn.get("allowedextensions").join(" / ")),
                            retry: "Chooser"
                        });
                        return;
                    }
                }
                if (this.dyn.get("filesizelimit") && file.files && file.files.length > 0 && file.files[0].size && file.files[0].size > this.dyn.get("filesizelimit")) {
                    var fact = "KB";
                    var size = Math.round(file.files[0].size / 1000);
                    var limit = Math.round(this.dyn.get("filesizelimit") / 1000);
                    if (size > 999) {
                        fact = "MB";
                        size = Math.round(size / 1000);
                        limit = Math.round(limit / 1000);
                    }
                    this.next("FatalError", {
                        message: this.dyn.string("video_file_too_large").replace("%s", size + fact + " / " + limit + fact),
                        retry: "Chooser"
                    });
                    return;
                }
            }
            this._uploadFile(file);
        },

        _uploadFile: function(file) {
            this.dyn.set("creation-type", Info.isMobile() ? "mobile" : "upload");
            this.dyn._prepareRecording().success(function() {
                this.dyn.trigger("upload_selected", file);
                this.dyn._uploadVideoFile(file);
                this.next("Uploading");
            }, this).error(function(s) {
                this.next("FatalError", {
                    message: s,
                    retry: "Chooser"
                });
            }, this);
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CameraAccess", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "base:Timers.Timer"
], function(State, Timer, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader"],

        _started: function() {
            this.dyn.set("settingsvisible", true);
            this.dyn.set("recordvisible", true);
            this.dyn.set("rerecordvisible", false);
            this.dyn.set("stopvisible", false);
            this.dyn.set("skipvisible", false);
            this.dyn.set("controlbarlabel", "");
            this.listenOn(this.dyn, "bound", function() {
                this.dyn.set("creation-type", this.dyn.isFlash() ? "flash" : "webrtc");
                if (this.dyn.get("onlyaudio")) {
                    this.next("CameraHasAccess");
                    return;
                }
                var timer = this.auto_destroy(new Timer({
                    start: true,
                    delay: 100,
                    context: this,
                    fire: function() {
                        if (this.dyn.recorder.blankLevel() >= 0.01 && this.dyn.recorder.deltaCoefficient() >= 0.01) {
                            timer.stop();
                            this.next("CameraHasAccess");
                        }
                    }
                }));
            }, this);
            this.listenOn(this.dyn, "error", function(s) {
                this.next("FatalError", {
                    message: this.dyn.string("attach-error"),
                    retry: "Initial",
                    flashtest: true
                });
            }, this);
            this.listenOn(this.dyn, "access_forbidden", function() {
                this.next("FatalError", {
                    message: this.dyn.string("access-forbidden"),
                    retry: "Initial"
                });
            }, this);
            this.dyn._attachRecorder();
            if (this.dyn)
                this.dyn._bindMedia();
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CameraHasAccess", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["topmessage", "controlbar"],

        _started: function() {
            this.dyn.set("settingsvisible", true);
            this.dyn.set("recordvisible", true);
            this.dyn.set("rerecordvisible", false);
            this.dyn.set("stopvisible", false);
            this.dyn.set("skipvisible", false);
            this.dyn.set("controlbarlabel", "");
            if (this.dyn.get("autorecord"))
                this.next("RecordPrepare");
        },

        record: function() {
            if (!this.dyn.get("autorecord"))
                this.next("RecordPrepare");
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.RecordPrepare", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "base:Timers.Timer",
    "base:Time"
], function(State, Timer, Time, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader"],

        _started: function() {
            this.dyn._accessing_camera = true;
            this._promise = this.dyn._prepareRecording();
            this.dyn.set("message", "");
            if (this.dyn.get("countdown")) {
                this.dyn.set("loaderlabel", this.dyn.get("countdown"));
                var endTime = Time.now() + this.dyn.get("countdown") * 1000;
                var timer = new Timer({
                    context: this,
                    delay: 100,
                    fire: function() {
                        var time_left = Math.max(0, endTime - Time.now());
                        this.dyn.set("loaderlabel", "" + Math.round(time_left / 1000));
                        this.dyn.trigger("countdown", time_left);
                        if (endTime <= Time.now()) {
                            this.dyn.set("loaderlabel", "");
                            timer.stop();
                            this._startRecording();
                        }
                    }
                });
                this.auto_destroy(timer);
            } else
                this._startRecording();
        },

        record: function() {
            this._startRecording();
        },

        _startRecording: function() {
            this._promise.success(function() {
                this.dyn._startRecording().success(function() {
                    this.next("Recording");
                }, this).error(function(s) {
                    this.next("FatalError", {
                        message: s,
                        retry: "CameraAccess"
                    });
                }, this);
            }, this).error(function(s) {
                this.next("FatalError", {
                    message: s,
                    retry: "CameraAccess"
                });
            }, this);
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Recording", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "base:Timers.Timer",
    "base:Time",
    "base:TimeFormat",
    "base:Async"
], function(State, Timer, Time, TimeFormat, Async, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["topmessage", "controlbar"],

        _started: function() {
            this.dyn._accessing_camera = true;
            this.dyn.trigger("recording");
            this.dyn.set("settingsvisible", false);
            this.dyn.set("rerecordvisible", false);
            this.dyn.set("recordvisible", false);
            this.dyn.set("stopvisible", true);
            this.dyn.set("skipvisible", false);
            this._startTime = Time.now();
            this._stopping = false;
            this._timer = this.auto_destroy(new Timer({
                immediate: true,
                delay: 10,
                context: this,
                fire: this._timerFire
            }));
        },

        _timerFire: function() {
            var limit = this.dyn.get("timelimit");
            var current = Time.now();
            var display = Math.max(0, limit ? (this._startTime + limit * 1000 - current) : (current - this._startTime));
            this.dyn.trigger("recording_progress", current - this._startTime);
            this.dyn.set("controlbarlabel", TimeFormat.format(TimeFormat.ELAPSED_MINUTES_SECONDS, display));

            if (this.dyn.get("timeminlimit"))
                this.dyn.set("mintimeindicator", (Time.now() - this._startTime) / 1000 <= this.dyn.get("timeminlimit"));

            if (limit && this._startTime + limit * 1000 <= current) {
                this._timer.stop();
                this.stop();
            }
        },

        stop: function() {
            var minlimit = this.dyn.get("timeminlimit");
            if (minlimit) {
                var delta = (Time.now() - this._startTime) / 1000;
                if (delta < minlimit) {
                    var limit = this.dyn.get("timelimit");
                    if (!limit || limit > delta)
                        return;
                }
            }
            if (this._stopping)
                return;
            this.dyn.set("loader_active", true);
            this.dyn.set("controlbar_active", false);
            this.dyn.set("topmessage_active", false);
            this._stopping = true;
            Async.eventually(function() {
                this.dyn._stopRecording().success(function() {
                    this._hasStopped();
                    if (this.dyn.get("picksnapshots") && this.dyn.snapshots.length >= this.dyn.get("gallerysnapshots"))
                        this.next("CovershotSelection");
                    else
                        this.next("Uploading");
                }, this).error(function(s) {
                    this.next("FatalError", {
                        message: s,
                        retry: "CameraAccess"
                    });
                }, this);
            }, this);
        },

        _hasStopped: function() {
            this.dyn.set("duration", Time.now() - this._startTime);
            this.dyn._showBackgroundSnapshot();
            this.dyn._unbindMedia();
            this.dyn.trigger("recording_stopped");
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.CovershotSelection", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["imagegallery", "topmessage", "controlbar"],

        _started: function() {
            this.dyn.set("settingsvisible", false);
            this.dyn.set("recordvisible", false);
            this.dyn.set("stopvisible", false);
            this.dyn.set("skipvisible", true);
            this.dyn.set("controlbarlabel", "");
            this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
            this.dyn.set("uploadcovershotvisible", this.dyn.get("custom-covershots"));
            this.dyn.set("topmessage", this.dyn.string('pick-covershot'));
            var imagegallery = this.dyn.scope(">[tagname='ba-videorecorder-imagegallery']").materialize(true);
            imagegallery.loadSnapshots();
            imagegallery.updateContainerSize();
            this.listenOn(this.dyn, "invoke-skip", function() {
                this._nextUploading(true);
            }, this);
            this.listenOn(this.dyn, "select-image", function(image) {
                this.dyn._uploadCovershot(image);
                this._nextUploading(false);
            }, this);
        },

        rerecord: function() {
            this.dyn._hideBackgroundSnapshot();
            this.dyn._detachRecorder();
            this.dyn.trigger("rerecord");
            this.dyn.set("recordermode", true);
            this.next("Initial");
        },

        uploadCovershot: function(file) {
            this.dyn._uploadCovershotFile(file);
            this._nextUploading(false);
        },

        _nextUploading: function(skippedCovershot) {
            this.next("Uploading");
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Uploading", [
    "module:VideoRecorder.Dynamics.RecorderStates.State",
    "base:Time",
    "base:Async"
], function(State, Time, Async, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader", "message"],

        _started: function() {
            this.dyn.set("cancancel", true);
            this.dyn.set("skipinitial", this.dyn.get("skipinitial") || this.dyn.get("skipinitialonrerecord"));
            this.dyn.set("settingsvisible", false);
            this.dyn.set("recordvisible", false);
            this.dyn.set("stopvisible", false);
            this.dyn.set("controlbarlabel", "");
            this.dyn.trigger("uploading");
            this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
            if (this.dyn.get("early-rerecord"))
                this.dyn.set("controlbar_active", true);
            this.dyn.set("topmessage", "");
            this.dyn.set("message", this.dyn.string("uploading"));
            this.dyn.set("playertopmessage", this.dyn.get("message"));
            var uploader = this.dyn._dataUploader;
            this.listenOn(uploader, "success", function() {
                Async.eventually(function() {
                    this._finished();
                    this.next("Verifying");
                }, this);
            });
            this.listenOn(uploader, "error", function() {
                this.dyn.set("player_active", false);
                this.next("FatalError", {
                    message: this.dyn.string("uploading-failed"),
                    retry: this.dyn.recorderAttached() ? "Uploading" : "Initial"
                });
            });
            this.listenOn(uploader, "progress", function(uploaded, total) {
                this.dyn.trigger("upload_progress", uploaded, total);
                if (total !== 0) {
                    var up = Math.min(100, Math.round(uploaded / total * 100));
                    if (!isNaN(up)) {
                        this.dyn.set("message", this.dyn.string("uploading") + ": " + up + "%");
                        this.dyn.set("playertopmessage", this.dyn.get("message"));
                    }
                }
            });
            if (this.dyn.get("localplayback") && this.dyn.recorder && this.dyn.recorder.supportsLocalPlayback()) {
                this.dyn.set("playbacksource", this.dyn.recorder.localPlaybackSource());
                if (this.dyn.__lastCovershotUpload)
                    this.dyn.set("playbackposter", this.dyn.recorder.snapshotToLocalPoster(this.dyn.__lastCovershotUpload));
                this.dyn.set("loader_active", false);
                this.dyn.set("message_active", false);
                this.dyn._hideBackgroundSnapshot();
                this.dyn.set("player_active", true);
            }
            this.dyn.set("start-upload-time", Time.now());
            uploader.reset();
            uploader.upload();
        },

        rerecord: function() {
            this.dyn._hideBackgroundSnapshot();
            this.dyn._detachRecorder();
            this.dyn.trigger("rerecord");
            this.dyn.set("recordermode", true);
            this.next("Initial");
        },

        _finished: function() {
            this.dyn.set("cancancel", false);
            this.dyn.trigger("uploaded");
            this.dyn.set("end-upload-time", Time.now());
        }

    });
});


Scoped.define("module:VideoRecorder.Dynamics.RecorderStates.Verifying", [
    "module:VideoRecorder.Dynamics.RecorderStates.State"
], function(State, scoped) {
    return State.extend({
        scoped: scoped
    }, {

        dynamics: ["loader", "message"],

        _started: function() {
            this.dyn.trigger("verifying");
            this.dyn.set("message", this.dyn.string("verifying") + "...");
            this.dyn.set("playertopmessage", this.dyn.get("message"));
            if (this.dyn.get("localplayback") && this.dyn.recorder && this.dyn.recorder.supportsLocalPlayback()) {
                this.dyn.set("loader_active", false);
                this.dyn.set("message_active", false);
            } else {
                this.dyn.set("rerecordvisible", this.dyn.get("early-rerecord"));
                if (this.dyn.get("early-rerecord"))
                    this.dyn.set("controlbar_active", true);
            }
            this.dyn._verifyRecording().success(function() {
                this.dyn.trigger("verified");
                this.dyn._hideBackgroundSnapshot();
                this.dyn._detachRecorder();
                if (this.dyn.get("recordings"))
                    this.dyn.set("recordings", this.dyn.get("recordings") - 1);
                this.dyn.set("message", "");
                this.dyn.set("playertopmessage", "");
                this.dyn.set("verified", true);
                this.next("Player");
            }, this).error(function() {
                this.dyn.set("player_active", false);
                this.next("FatalError", {
                    message: this.dyn.string("verifying-failed"),
                    retry: this.dyn.recorderAttached() ? "Verifying" : "Initial"
                });
            }, this);
        },

        rerecord: function() {
            this.dyn._hideBackgroundSnapshot();
            this.dyn._detachRecorder();
            this.dyn.trigger("rerecord");
            this.dyn.set("recordermode", true);
            this.next("Initial");
        }

    });
});
Scoped.define("module:VideoRecorder.Dynamics.Topmessage", [
    "dynamics:Dynamic"
], function(Class, scoped) {
    return Class.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            template: "\n<div class=\"{{css}}-topmessage-container\">\n    <div class='{{css}}-topmessage-background'>\n    </div>\n    <div data-selector=\"recorder-topmessage-block\" class='{{css}}-topmessage-message'>\n        {{topmessage}}\n    </div>\n</div>\n",

            attrs: {
                "css": "ba-videorecorder",
                "topmessage": ''
            }

        };
    }).register("ba-videorecorder-topmessage");
});
}).call(Scoped);