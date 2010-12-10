net.soylentred.makelink.LinkTypeSource = function() {
  this.prefs_ = net.soylentred.makelink.getPrefs();
  this.logger_ = new net.soylentred.makelink.Logger(
      'net.soylentred.makelink.LinkTypeSource');
  this.logger_.logCall('<init>', arguments);
};

net.soylentred.makelink.LinkTypeSource.prototype.getLinkTypes = function() {
  this.logger_.logCall('getLinkTypes', arguments);
  var order = this.prefs_.getCharPref('order');

  // Parse the order and get the prefs for all the types listed:
  var typeIds = order.split(',');
  var types = [];
  for (var i = 0; i < typeIds.length; i++) {
    var type = this.getType(typeIds[i]);
    if (type) {
      types.push(type);
    }
  }
  // TODO(roryparle): If the order pref isn't set, recover by rebuilding it
  // from all existing net.soylentred.makelink.types.N.title prefs.
  return types;
};

net.soylentred.makelink.LinkTypeSource.prototype.getType = function(id) {
  this.logger_.logCall('getType', arguments);
  var t = 'types.' + id;
  var type = {};
  type['id'] = id;
  try {
    type['title'] = this.prefs_.getComplexValue(t + '.title',
        Components.interfaces.nsISupportsString).data;
    type['format'] = this.prefs_.getComplexValue(t + '.format',
        Components.interfaces.nsISupportsString).data;
    type['useentities'] = this.prefs_.getBoolPref(t + '.useentities');
  } catch(e) {
    this.logger_.warning('Exception while trying to get prefs for id ' + id);
    return null;
  }
  return type;
};