/**
 * Contains methods used in the link type editing dialog.
 */
net.soylentred.makelink.LinkTypeEditor = function() {
  this.logger_ = new net.soylentred.makelink.Logger(
      'net.soylentred.makelink.LinkTypeEditor');
  this.logger_.logCall('<init>', arguments);
  this.linkTypeSource_ = new net.soylentred.makelink.LinkTypeSource();
  this.prefs_ = net.soylentred.makelink.getPrefs();
};

/**
 * Gets the next available numeric format ID. This is the lowest integer not
 * already in use as an ID.
 *
 * @return The next available ID.
 */
net.soylentred.makelink.LinkTypeEditor.prototype.getNextAvailableId_ =
    function() {
  this.logger_.logCall('getNextAvailableId_', arguments);
  for (var id = 0; ; id++) {
    // TODO(roryparle): Find a way to check for a pref's existence that
    // doesn't involve exceptions. [Try this.prefs_.getPrefType (int return
    // value where 0 means invalid) or this.prefs_.prefHasUserValue (boolean
    // return value)] Alternatively, use the 'order' pref to determine which
    // IDs exist (probably requires that deleting doesn't just delete from
    // that pref).
    try {
      this.prefs_.getBoolPref('types.' + id + '.useentities');
    } catch (e) {
      return id;
    }
  }
};

/**
 * Saves a link type. Can save both new and modified types.
 *
 * TODO: Make an object to represent a type and have it know how to save
 * itself.
 *
 * @param type An object containing 'title', 'format', 'useentities', and an
 *     optional 'id' (unset for new link types)
 */
net.soylentred.makelink.LinkTypeEditor.prototype.saveType_ = function(type) {
  this.logger_.logCall('saveType_', arguments);
  if ('id' in type) {
    var id = type['id'];
    var isNew = false;
  } else {
    var id = this.getNextAvailableId_();
    var isNew = true;
  }
  var t = 'types.' + id;

  var title = Components.classes['@mozilla.org/supports-string;1']
      .createInstance(Components.interfaces.nsISupportsString);
  title.data = type['title'];
  this.prefs_.setComplexValue(t + '.title', 
      Components.interfaces.nsISupportsString, title);
  var format = Components.classes['@mozilla.org/supports-string;1']
      .createInstance(Components.interfaces.nsISupportsString);
  format.data = type['format'];
  this.prefs_.setComplexValue(t + '.format', 
      Components.interfaces.nsISupportsString, format);

  this.prefs_.setBoolPref(t + '.useentities', type['useentities']);
  if (isNew) {
    var order = this.prefs_.getCharPref('order');
    this.prefs_.setCharPref('order', order + ',' + id);
  }
};

/**
 * Called when the dialog is first loaded, to set the correct attributes.
 */
net.soylentred.makelink.LinkTypeEditor.prototype.initialize = function() {
  this.logger_.logCall('initialize', arguments);
  var dialog = this.getDialogElement_();
  if (window.arguments[0] == "_new") {
    // TODO(roryparle): Extract this text for localization.
    dialog.setAttribute("title", "Make Link :: New Link Type");
    document.getElementById("makelink-newlinktype-contexthelp-new").style
        .display = "block";
    document.getElementById("makelink-newlinktype-contexthelp-edit").style
        .display = "none";
  } else {
    var id = window.arguments[0];
    var type = this.linkTypeSource_.getType(id);
    document.getElementById("editlinktype-title").value = type['title'];
    document.getElementById("editlinktype-format").value = type['format'];
    document.getElementById("editlinktype-entities").checked =
        type['useentities'];
    
    dialog.setAttribute("title",
        "Make Link :: Edit Link Type :: " + type['title']);
    document.getElementById("makelink-newlinktype-contexthelp-new").style
        .display = "none";
    document.getElementById("makelink-newlinktype-contexthelp-edit").style
        .display = "block";
  }
  this.addEventListeners_();
};

/**
 * Attaches necessary event listeners (apart from the window load event, which
 * is attached below).
 */
net.soylentred.makelink.LinkTypeEditor.prototype.addEventListeners_ =
      function() {
  this.logger_.logCall('addEventListeners_', arguments);
  var dialog = this.getDialogElement_();
  dialog.addEventListener('dialogaccept',
      net.soylentred.makelink.bind(this, this.accept),
      false);
  var helpButton = document.getElementById('edit-help');
  helpButton.addEventListener('command',
      net.soylentred.makelink.bind(this, this.displayHelp),
      false);
};

/**
 * Returns the dialog root element.
 */
net.soylentred.makelink.LinkTypeEditor.prototype.getDialogElement_ =
      function() {
  this.logger_.logCall('getDialogElement_', arguments);
  return document.getElementById("makelink-edit-dialog");
};

/**
 * Called when the dialog's changes are applied.
 */
net.soylentred.makelink.LinkTypeEditor.prototype.accept = function() {	
  this.logger_.logCall('accept', arguments);
  var type = {};
  if (window.arguments[0] != "_new") {
    type['id'] = window.arguments[0];
  }
  type['title'] = document.getElementById("editlinktype-title").value;
  type['format'] = document.getElementById("editlinktype-format").value;
  type['useentities'] =
      document.getElementById("editlinktype-entities").checked;
  this.saveType_(type);
};

/**
 * Displays a help page describing the link formatting options.
 */
net.soylentred.makelink.LinkTypeEditor.prototype.displayHelp = function() {	
  this.logger_.logCall('displayHelp', arguments);
  window.open("chrome://makelink/content/help/defininglinktypes.html");
};

/**
 * Execute the initializer on load.
 */
(function() {
  var editor = new net.soylentred.makelink.LinkTypeEditor();
  window.addEventListener('load',
      net.soylentred.makelink.bind(editor, editor.initialize),
      false);
})();
