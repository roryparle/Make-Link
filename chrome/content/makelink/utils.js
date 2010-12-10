/**
 * This file sets up the net.soylentred.makelink namepsace, so it must be
 * sourced before any other JS files that use that namespace.
 * Also contains static utility functions useful in other files.
 */

// Set up namespace to avoid colliding with other extensions:
var net = net || {};
net.soylentred = net.soylentred || {};
net.soylentred.makelink = net.soylentred.makelink || {};

/**
 * Joins an array of objects with a specified string between each pair.
 * <p>E.g., join(', ' ['a', 'b', 'c']) => 'a, b, c'.
 *
 * @param connector The string to place between each pair.
 * @param elements An array of elements to be joined.
 * @return A string composed of the given elements joined with the connector.
 */
net.soylentred.makelink.join = function(connector, elements) {
  var string = '';
  for (var i = 0; i < elements.length; i++) {
    string += ((string == '') ? '' : connector) + elements[i];
  }
  return string;
};

/**
 * Gets the nsIPrefBranch relevant to this extension
 * ('net.soylentred.makelink.'). The branch is cached when first retrieved so
 * any script can ask for it and recieve the same instance.
 *
 * @return An nsIPrefBranch relevenat to this extension.
 */
net.soylentred.makelink.getPrefs = function() {
  if (!net.soylentred.makelink.prefs) {
    var prefs = Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefService)
        .getBranch('net.soylentred.makelink.');
    prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    net.soylentred.makelink.prefs = prefs;
  }
  return net.soylentred.makelink.prefs;
};

/**
 * Binds a method to an object. Returns a function which, when executed, will
 * execute the given method in the context of the given object (i.e., the
 * keyword 'this' if it occurs in the method, will refert to the object).
 *
 * Sample usage:
 * <pre>
 *  Foo = function(a) {
 *    this.a_ = a;
 *  }
 *
 *  Foo.prototype.bar = function() {
 *    alert(this.a_);
 *  }
 *
 *  var foo = new Foo('baz');
 *  window.addEventListener('load',
 *      net.soylentred.makelink.bind(foo, foo.bar),
 *      false);
 * </pre>
 *
 * @param object The object to bind to.
 * @param method The method to bind.
 * @return A function which will execute method in the context of object.
 */
net.soylentred.makelink.bind = function(object, method) {
  return function() {
    method.apply(object, arguments);
  };
};
