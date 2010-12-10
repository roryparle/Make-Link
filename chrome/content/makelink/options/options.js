net.soylentred.makelink.Options = function() {
  this.logger_ =
      new net.soylentred.makelink.Logger('net.soylentred.makelink.Options');
  this.logger_.logCall('<init>', arguments);
  this.prefs_ = net.soylentred.makelink.getPrefs();
  this.linkTypeSource_ = new net.soylentred.makelink.LinkTypeSource();
};

/**
 * Gets a list of row numbers for selected rows in the given tree.
 *
 * @param tree The tree to get the selection for.
 * @return A list of selected row IDs.
 */
net.soylentred.makelink.Options.prototype.getTreeSelection_ =
    function(tree) {
  this.logger_.logCall('getTreeSelection_', arguments);
  var ids = [];
  var rangeCount = tree.view.selection.getRangeCount();
  for (var i = 0; i < rangeCount; i++) {
    var start = {};
    var end = {};
    tree.view.selection.getRangeAt(i, start, end);
    for (var c = start.value; c <= end.value; c++) {
      ids.push(c);
    }
  }
  return ids;
};

/**
 * Returns a list of all selected treerow elements from the given tree.
 *
 * @param tree The tree to get the selection for.
 * @return A list of selected rows.
 */
net.soylentred.makelink.Options.prototype.getSelectedTreeRows_ =
    function(tree) {
  this.logger_.logCall('getSelectedTreeRows_', arguments);
  var ids = this.getTreeSelection_(tree);
  var rows = [];
  for (var i = 0; i < ids.length; i++) {
    rows.push(tree.view.getItemAtIndex(ids[i]).firstChild);
  }
  return rows;
};

/**
 * Prompts the user to confirm the deletion of a specified number of rows.
 *
 * @param count The number of rows that will be deleted.
 * @return true iff the user confirmed the deletion.
 */
net.soylentred.makelink.Options.prototype.verifyDeleteRows_ =
    function(count) {
  this.logger_.logCall('verifyDeleteRows_', arguments);
  // TODO(roryparle): Extract this text for localization.
  return (count <= 1) || this.confirm('Delete ' + count + ' link types?',
      'Are you sure you want to delete these ' + count + ' link types?');
};

/**
 * Deletes a link type identified by ID.
 *
 * TODO: Make an object to represent a type and have it know how to delete
 * itself.
 *
 * @param id The ID of the type to delete.
 */
net.soylentred.makelink.Options.prototype.deleteLinkType_ = function(id) {
  this.logger_.logCall('deleteLinkType_', arguments);
  // Set the new link type order with the given id removed:
  var order = this.prefs_.getCharPref('order').split(',');
  var newOrder = '';
  for (var i = 0; i < order.length; i++) {
    if (order[i] != id) {
      newOrder += (newOrder == '' ? '' : ',') + order[i];
    }
  }
  this.prefs_.setCharPref('order', newOrder);
  // Remove the prefs related to this type:
  this.prefs_.deleteBranch('types.' + id);
  return true;
};

/**
 * Shorthand method for using the confirm method of nsIPromptService.
 */
net.soylentred.makelink.Options.prototype.confirm_ = function(title, prompt) {	
  this.logger_.logCall('confirm_', arguments);
  return Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService)
      .confirm(window, title, prompt);
};

/**
 * Tries to delete the given treerows.
 *
 * @param rows A list of treerow elements to delete.
 * @return An object where o[true] is a list of IDs of link types which were
 *     deleted and o[false] is a list of IDs of link types which were not
 *     successfully deleted.
 */
net.soylentred.makelink.Options.prototype.deleteRows_ = function(rows) {
  this.logger_.logCall('deleteRows_', arguments);
  var success = {};
  success[true] = [];
  success[false] = [];
  for (var i = 0; i < rows.length; i++) {
    var id = rows[i].getAttribute("linktypeid");
    success[this.deleteLinkType_(id)].push(id);
  }
  return success;
};

/**
 * Constructs a message relating the success or failure of an attempt to
 * delete link-type rows.
 *
 * @param deleted A list of IDs of deleted link types.
 * @param notDeleted A list of IDs of link types which failed to delete.
 * @return A message relating the success or failure of deletion, or null if
 *     nothing should be reported.
 */
net.soylentred.makelink.Options.prototype.getDeleteSuccessMessage_ =
    function(deleted, notDeleted) {
  this.logger_.logCall('getDeleteSuccessMessage_', arguments);
  if (notDeleted.length == 0) {
    return null;
  }
  // TODO(roryparle): Extract this text for localization.
  var message = "An error occurred. The following rows were not deleted:\n";
  for (var i = 0; i < notDeleted.length; i++) {
    message = message + " • "
        + this.linkTypeSource_.getType(notDeleted[i]).title  + "\n";
  }
  return message;
};

/**
 * Deletes the selected rows from the tree of link types.
 */
net.soylentred.makelink.Options.prototype.deleteSelectedLinkTypes =
    function() {
  this.logger_.logCall('deleteSelectedLinkTypes', arguments);
  var tree = document.getElementById('makelink-link-types');
  var selectedRows = this.getSelectedTreeRows_(tree);
  if (this.verifyDeleteRows_(selectedRows.length)) {
    var success = this.deleteRows_(selectedRows);
    var deleted = success[true];
    var notDeleted = success[false];
    var message = this.getDeleteSuccessMessage_(deleted, notDeleted);
    if (message) {
      alert(message);
    }
  }
  this.rebuildTree_();
};

/**
 * Presents a dialog allowing the user to modify the selected link type.
 */
net.soylentred.makelink.Options.prototype.modifySelectedLinkType =
    function() {
  this.logger_.logCall('modifySelectedLinkType', arguments);
  var tree = document.getElementById('makelink-link-types');
  var selectedRows = this.getSelectedTreeRows_(tree);
  if (selectedRows.length != 1) {
    throw 'Wrong number of rows selected.';
  }
  var linkTypeId = selectedRows[0].getAttribute('linktypeid');
  this.openEditDialog_(linkTypeId);
};

/**
 * Presents a dialog allowing the user to add a new link type.
 */
net.soylentred.makelink.Options.prototype.showNewLinkTypeDialog =
    function () {
  this.logger_.logCall('showNewLinkTypeDialog', arguments);
  this.openEditDialog_('_new');
};

/**
 * Opens the new/edit dialog.
 *
 * @param linkTypeId The ID of the link type to edit, or '_new' if a new link
 *     type should be created.
 */
net.soylentred.makelink.Options.prototype.openEditDialog_ =
    function(linkTypeId) {
  this.logger_.logCall('openEditDialog_', arguments);
  window.openDialog('chrome://makelink/content/options/editlinktype.xul',
      'editlinktype',
      'chrome, dialog, modal, resizable=yes',
      linkTypeId);
};

/**
 * Enables or disables buttons based on selection in the tree element.
 */
net.soylentred.makelink.Options.prototype.enableButtons = function() {
  this.logger_.logCall('enableButtons', arguments);
  var buttonUp = document.getElementById('button-up');
  var buttonDown = document.getElementById('button-down');
  var buttonDel = document.getElementById('button-delete');
  var buttonMod = document.getElementById('button-modify');
  var tree = document.getElementById('makelink-link-types');
  var selectedRows = this.getSelectedTreeRows_(tree);
  buttonDel.disabled = (selectedRows.length == 0);
  buttonMod.disabled = (selectedRows.length != 1);
  buttonUp.disabled = (selectedRows.length != 1);
  buttonDown.disabled = (selectedRows.length != 1);
};

/**
 * Enables or disables context menu items based on selection in the tree
 * element.
 */
net.soylentred.makelink.Options.prototype.enableContextMenu = function() {
  this.logger_.logCall('enableContextMenu', arguments);
  var modifyMenu = document.getElementById('link-types-modify-selected');
  var deleteMenu = document.getElementById('link-types-delete-selected');
  var tree = document.getElementById('makelink-link-types');
  var selectedRows = this.getSelectedTreeRows_(tree);
  if (selectedRows.length != 1) {
    modifyMenu.setAttribute('disabled', true);
  } else {
    modifyMenu.removeAttribute('disabled');
  }
  if (selectedRows.length > 0) {
    deleteMenu.removeAttribute('disabled');
  } else {
    deleteMenu.setAttribute('disabled', true);
  }
};

/**
 * Moves the selected row in the link types list up.
 */
net.soylentred.makelink.Options.prototype.moveSelectedUp = function() {
  this.logger_.logCall('moveSelectedUp', arguments);
  var tree = document.getElementById('makelink-link-types');
  var selected = this.getTreeSelection_(tree);
  if (selected.length != 1) {
    throw 'Can\'t change list order for ' + selected.length + ' items.'
  }
  var index = selected[0];
  var row = this.getSelectedTreeRows_(tree)[0];
  if (row.parentNode.previousSibling) {
    var order = this.prefs_.getCharPref('order').split(',');
    var newOrder = [];
    for (var i = 0; i < order.length; i++) {
      if (i == index - 1) {
        newOrder.push(order[i + 1]);
      } else if (i == index) {
        newOrder.push(order[i - 1]);
      } else {
        newOrder.push(order[i]);
      }
    }
    this.prefs_.setCharPref('order',
        net.soylentred.makelink.join(',', newOrder));
    tree.view.selection.select(index - 1);
  }
};

/**
 * Moves the selected row in the link types list down.
 */
net.soylentred.makelink.Options.prototype.moveSelectedDown = function() {
  this.logger_.logCall('moveSelectedDown', arguments);
  var tree = document.getElementById('makelink-link-types');
  var selected = this.getTreeSelection_(tree);
  if (selected.length != 1) {
    throw 'Can\'t change list order for ' + selected.length + ' items.'
  }
  var index = selected[0];
  var row = this.getSelectedTreeRows_(tree)[0];
  if (row.parentNode.nextSibling) {
    var order = this.prefs_.getCharPref('order').split(',');
    var newOrder = [];
    for (var i = 0; i < order.length; i++) {
      if (i == index + 1) {
        newOrder.push(order[i - 1]);
      } else if (i == index) {
        newOrder.push(order[i + 1]);
      } else {
        newOrder.push(order[i]);
      }
    }
    this.prefs_.setCharPref('order',
        net.soylentred.makelink.join(',', newOrder));
    tree.view.selection.select(index + 1);
  }
};

/**
 * Called when a pref in the observed tree is updated. This method only cares
 * when it sees an 'nsPref:changed' topic, at which point it will update the
 * list of link formats. Other parameters are ignored.
 *
 * @param subject ?
 * @param topic The type of change made in the tree.
 * @param data The content of the change.
 */
net.soylentred.makelink.Options.prototype.observe = function(
    subject, topic, data) {
  this.logger_.logCall('observe', arguments);
  if (topic == 'nsPref:changed') {
    this.rebuildTree_();
  }
};

/**
 * Rebuilds the list of link types in the options dialog. This is called when
 * the dialog first appears and when the relevant preferences are updated.
 */
net.soylentred.makelink.Options.prototype.rebuildTree_ = function() {
  this.logger_.logCall('rebuildTree_', arguments);
  var tree = document.getElementById('types');
  var types = this.linkTypeSource_.getLinkTypes();
  while (tree.firstChild) {
    tree.removeChild(tree.firstChild);
  }
  for (var i = 0; i < types.length; i++) {
    var item = document.createElement('treeitem');
    item.appendChild(document.createElement('treerow'));
    var titleCell = document.createElement('treecell');
    titleCell.setAttribute('label', types[i]['title']);
    var formatCell = document.createElement('treecell');
    formatCell.setAttribute('label', types[i]['format']);
    var entityCell = document.createElement('treecell');
    entityCell.setAttribute('label',
        types[i]['useentities'] ? 'true' : 'false');
    item.firstChild.appendChild(titleCell);
    item.firstChild.appendChild(formatCell);
    item.firstChild.setAttribute('linktypeid', types[i]['id']);
    tree.appendChild(item);
  }
};

/**
 * Sets up necessary event handlers.
 */
net.soylentred.makelink.Options.prototype.initialize = function() {
  this.logger_.logCall('initialize', arguments);
  document.getElementById('link-types-delete-selected').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.deleteSelectedLinkTypes),
      false);
  document.getElementById('link-types-modify-selected').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.modifySelectedLinkType),
      false);
  document.getElementById('button-up').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.moveSelectedUp),
      false);
  document.getElementById('button-down').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.moveSelectedDown),
      false);
  document.getElementById('button-new').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.showNewLinkTypeDialog),
      false);
  document.getElementById('button-delete').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.deleteSelectedLinkTypes),
      false);
  document.getElementById('button-modify').addEventListener(
      'command',
      net.soylentred.makelink.bind(this, this.modifySelectedLinkType),
      false);
  document.getElementById('makelink-link-types').addEventListener(
      'select',
      net.soylentred.makelink.bind(this, this.enableButtons),
      false);
  document.getElementById('link-types-context').addEventListener(
      'popupshowing',
      net.soylentred.makelink.bind(this, this.enableContextMenu),
      false);
  this.rebuildTree_();
  this.enableButtons()
  this.prefs_.addObserver('', this, false);
};

/**
 * Cleans up this object to avoid memory leaks.
 */
net.soylentred.makelink.Options.prototype.shutDown = function() {
  this.logger_.logCall('shutDown', arguments);
  this.prefs_.removeObserver('', this);
};

(function() {
  var options = new net.soylentred.makelink.Options();
  window.addEventListener('load',
      net.soylentred.makelink.bind(options, options.initialize),
      false);
  window.addEventListener('unload',
      net.soylentred.makelink.bind(options, options.shutDown),
      false);
})();
