net.soylentred.makelink.Logger = function(name) {
  this.prefs_ = net.soylentred.makelink.getPrefs();
  try {
    this.debug_ = this.prefs_.getBoolPref('debug');
  } catch (e) {
    this.debug_ = false;
  }
  this.name_ = name;
};

/**
 * Logs the calling of a method to the error console. This method should be
 * called as the first statement in a method to record the call for debugging
 * purposes.
 *
 * Uses {@code net.soylentred.makelink.Logger.prototype.info} so
 * the call will only be logged if the {@code net.soylentred.makelink.debug}
 * preference is set to true.
 *
 * @param method The name of the method to log.
 * @param args An array of the arguments passed to the method.
 */
net.soylentred.makelink.Logger.prototype.logCall = function(method, args) {
  var join = net.soylentred.makelink.join;
  this.info('Called: ' + method + '(' + join(', ', args) + ')');
};

/**
 * Logs an error message to the console.
 *
 * @param message The message to log.
 */
net.soylentred.makelink.Logger.prototype.warning = function(message) {
  Components.utils.reportError('[Make Link][' + this.name_ + '] ' + message);
};

/**
 * Logs an informational message to the error console if the preference
 * {@code net.soylentred.makelink.debug} is set to true.
 *
 * @param message The message to log.
 */
net.soylentred.makelink.Logger.prototype.info = function(message) {
  if (this.debug_) {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1']
        .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(
        '[Make Link] [' + this.name_ + '] [info] ' + message);
  }
};
