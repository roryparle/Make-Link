net = net || {}
net.soylentred = net.soylentred || {}

net.soylentred.makelink = {
  prefs: null,

  logMessage: function(msg) {
    Components.utils.reportError("• Make Link: " + msg);
  },
  
  openOptions: function() {
    var features = "chrome,titlebar,toolbar,centerscreen,resizable";
    window.openDialog("chrome://makelink/content/options/options.xul",
        "makelinkoptions", features);
  },

  makeLink: function(format, info, copyAsHtml) {
    // split into pieces on %:
    var piece = format.split("%");
    // flag to record if the current piece is potentially a makelink variable:
    var inVar = false;
    
    var copyText = "";
    for (var i = 0; i < piece.length; i++) {
      // if it's not a makelink variable...:
      if (!inVar) {
        // just add it as it is:
        copyText += piece[i];
        // next piece could be a variable:
        inVar = true;
      } else {
        switch (piece[i].toLowerCase()) {
          case "text":
            copyText += info['text'];
            inVar = false;
            break;
          case "url":
            copyText += info['url'];
            inVar = false;
            break;
          case "imgurl":
            copyText += info['imgurl'];
            inVar = false;
            break;
          case "title":
            copyText += info['title'];
            inVar = false;
            break;
          case "tinyurl":
            var durl = getDurl(info['url']);
            if (!durl) return false;
            copyText += durl;
            inVar = false;
            break;
          case "input":
            copyText += prompt(format + "\n\nPlease enter the %input% text for\n--\n" + format + "\n--");
            inVar = false;
            break;
          // default (not actually a make link variable) means inVar
          // is still true for the next piece
          default:
            copyText += "%" + piece[i];
        }
      }
    }
    
    var mimeType;
    if (copyAsHtml) {
      mimeType = new Array("text/html", "text/unicode");
    } else {
      mimeType = new Array("text/unicode");
    }
    
    // Create a clipboard object:
    /*
     * the remainder of this function is based on code by Ben Basson (Cusser)
     * used with permission
     */
    var clip = Components.classes['@mozilla.org/widget/clipboard;1']
        .createInstance(Components.interfaces.nsIClipboard);
    if (!clip) return false;
    
    var trans = Components.classes['@mozilla.org/widget/transferable;1']
        .createInstance(Components.interfaces.nsITransferable);
    if (!trans) return false;
    
    trans.addDataFlavor('text/unicode');
    
    var str = new Object();
    var len = new Object();
    var str = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);
    
    str.data = copyText;
    for (var i = 0; i < mimeType.length; i++) {
      trans.setTransferData(mimeType[i],str,copyText.length * 2);
    }
    var clipid=Components.interfaces.nsIClipboard;
    
    if (!clip) return false;
    
    clip.setData(trans,null,clipid.kGlobalClipboard);
    return false;
  },

  makeSelectionLink: function(event, format, useEntities) {
    // What element was clicked on:
    var target = document.popupNode;

    // array to store link info:
    var info = new Array();
    
    info['imgurl'] = getImageUrl(target);
    
    // move up the DOM tree to a link or block level element:
    target = getCorrectTarget(target);

    // look to see if there's selected text:
    var selection;
    if ( ( selection = getSelectedText( target ) ) != "" ) {
      // some text is selected:
      info['text'] = selection;
      info['url'] = window.content.document.location.href;
      info['title'] = window.content.document.title;
    }
    // or if it's a link:
    else if ( isLink( target ) )
    {
      // get anchor text/URL:
      info['text'] = getLinkText(target);
      info['url'] = target.href;
      info['title'] = getLinkTitle(target);
    }
    else
    {
      // not an anchor (get page title/URL):
      info['text'] = window.content.document.title;
      info['url'] = window.content.document.location.href;
      info['title'] = getPageDescription( window.content.document );
    }
    if (useEntities) {
      for (i in info) {
        info[i] = info[i].replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/\"/g, "&quot;");
      }
    }
    // make the link:
    this.makeLink(format, info, useEntities);
  },
  
  observe: function(subject, topic, data) {
    if (topic != "nsPref:changed") {
      return;
    }
    
    if (document.getElementById("makelink-preferences-dialog")) {
      this.rebuildTree();
    } else if (document.getElementById("makelink-menu")) {
      this.rebuildMenu();
    }
  },
  
  getLinkTypes: function() {
    var order = this.prefs.getCharPref("order");
    
    // Parse the order and get the prefs for all the types listed:
    var typeIds = order.split(",");
    var types = new Array();
    for (var i = 0; i < typeIds.length; i++) {
      var type = this.getType(typeIds[i]);
      types.push(type);
    }
    // XXX - if the order pref isn't set it should recover by 
    // rebuilding it from all existing net.soylentred.makelink.types.N.title prefs
    
    return types;
  },
  
  getType: function(id) {
    var t = "types." + id;
    var type = {};
    type['id'] = id;
    try {
      type['title'] = this.prefs.getComplexValue(t + ".title",
          Components.interfaces.nsISupportsString).data;
      type['format'] = this.prefs.getComplexValue(t + ".format",
          Components.interfaces.nsISupportsString).data;
      type['useentities'] = this.prefs.getBoolPref(t + ".useentities");
    }catch(e){
      this.logMessage("Exception while trying to get prefs for id " + id);
    }
    return type;
  },
  
  nextAvailableId: function() {
    var id;
    var available = false;
    for (id = 0; !available; id++) {
      // this is an ugly way to see if a preference is set, but I can't find a better way:
      try {
        this.prefs.getBoolPref("types." + id + ".useentities");
      } catch (e) {
        available = true;
      }
    }
    id--;
    return id;
  },
  
  saveType: function(type) {
    if ("id" in type) {
      var id = type['id'];
      var isNew = false;
    } else {
      var id = this.nextAvailableId();
      var isNew = true;
    }
    var t = "types." + id;
    
    var title = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);
    title.data = type['title'];
    this.prefs.setComplexValue(t + ".title", 
        Components.interfaces.nsISupportsString, title);
    var format = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);
    format.data = type['format'];
    this.prefs.setComplexValue(t + ".format", 
        Components.interfaces.nsISupportsString, format);

    this.prefs.setBoolPref(t + ".useentities", type['useentities']);
    if (isNew) {
      var order = this.prefs.getCharPref("order");
      this.prefs.setCharPref("order", order + "," + id);
    }
  },
  
  deleteLinkType: function(id) {
    // Set the new link type order with the given id removed:
    var order = this.prefs.getCharPref("order").split(",");
    var newOrder = "";
    for (var i = 0; i < order.length; i++) {
      if (order[i] != id) {
        newOrder += (newOrder == "" ? "" : ",") + order[i];
      }
    }
    this.prefs.setCharPref("order", newOrder);
    
    // Remove the prefs related to this type:
    this.prefs.deleteBranch("types." + id);
    
    return true;
  },
  
  moveSelectedUp: function() {
    var tree = document.getElementById("makelink-link-types");
    var idx = 1 * _getTreeSelection(tree);
    var row = _getSelectedTreeRows(tree)[0];
    var id = row.getAttribute("linktypeid");
    if (row.parentNode.previousSibling) {
      // Move id left one in the order pref:
      var order = this.prefs.getCharPref("order").split(",");
      var newOrder = "";
      for (var i = 0; i < order.length; i++) {
        newOrder += (newOrder == "" ? "" : ",");
        if (i == idx - 1) {
          newOrder += order[i + 1];
        } else if (i == idx) {
          newOrder += order[i - 1];
        } else {
          newOrder += order[i];
        }
      }
      this.prefs.setCharPref("order", newOrder);
      tree.view.selection.select(idx - 1);
    }
  },
  
  moveSelectedDown: function() {
    var tree = document.getElementById("makelink-link-types");
    var idx = 1 * _getTreeSelection(tree);
    var row = _getSelectedTreeRows(tree)[0];
    var id = row.getAttribute("linktypeid");
    if (row.parentNode.nextSibling) {
      // Move id right one in the order pref:
      var o = this.prefs.getCharPref("order");
      var order = o.split(",");
      var newOrder = "";
      for (var i = 0; i < order.length; i++) {
        newOrder += (newOrder == "" ? "" : ",");
        if (i == idx + 1) {
          newOrder += order[i - 1];
        } else if (i == idx) {
          newOrder += order[i + 1];
        } else {
          newOrder += order[i];
        }
      }
      this.prefs.setCharPref("order", newOrder);
      tree.view.selection.select(idx + 1);
    }
  },
  
  rebuildTree: function() {
    var tree = document.getElementById("types");
    
    var types = this.getLinkTypes();
    
    // Remove all children of the tree:
    while (tree.firstChild) {
      tree.removeChild(tree.firstChild);
    }
    
    for (var i = 0; i < types.length; i++) {
      var item = document.createElement("treeitem");
      item.appendChild(document.createElement("treerow"));
      var titleCell = document.createElement("treecell");
      titleCell.setAttribute("label", types[i]['title']);
      var formatCell = document.createElement("treecell");
      formatCell.setAttribute("label", types[i]['format']);
      var entityCell = document.createElement("treecell");
      entityCell.setAttribute("label", types[i]['useentities'] ? "true" : "false");
      item.firstChild.appendChild(titleCell);
      item.firstChild.appendChild(formatCell);
      item.firstChild.setAttribute("linktypeid", types[i]['id']);
      tree.appendChild(item);
    }
    
  },
  
  rebuildMenu: function() {
    var menu = document.getElementById("makelink-submenu");
    
    var types = this.getLinkTypes();
    
    // Remove all children of the menu:
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild);
    }
    
    // For each link type, add a menu item:
    for (var i = 0; i < types.length; i++) {
      var menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", types[i]['title']);
      menuitem.setAttribute("format", types[i]['format']);
      menuitem.setAttribute("useentities", types[i]['useentities'] ? "true" : "false");
      menuitem.setAttribute("class", "makelink-linktype");
      menuitem.addEventListener("command",
          function(e) {
            net.soylentred.makelink.makeSelectionLink(e, this.getAttribute('format'),
                this.getAttribute('useentities') == 'true');
          }, false);
      menu.appendChild(menuitem);
    }
    
    // Add a separator (only if there's at least one link type):
    if (menu.firstChild) {
      menu.appendChild(document.createElement("menuseparator"));
    }
    
    // Add the "Configure…" menuitem:
    var config = document.createElement("menuitem");
    config.setAttribute("label", "Configure…");
    config.setAttribute("id", "makelink-configure");
    config.addEventListener("command",
        function (e) {
          net.soylentred.makelink.openOptions();
        },
        false);
    menu.appendChild(config);
  },
  
  startup: function() {
    // Necessary for every window:
    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("net.soylentred.makelink.");
    this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this.prefs.addObserver("", this, false);
    
    // startup for context menu or preferences dialog:
    if (document.getElementById("makelink-preferences-dialog")) {
      this.pref_startup();
    } else if (document.getElementById("makelink-menu")) {
      this.menu_startup();
    } else if (document.getElementById("makelink-edit-dialog")) {
      this.edit_startup();
    }
  },
  
  shutdown: function() {
    this.prefs.removeObserver("", this);
  },
  
  menu_startup: function() {
    this.rebuildMenu();
  },
  
  pref_startup: function() {
    this.rebuildTree();
    
    options_enableButtons();
    document.getElementById("makelink-link-types").addEventListener("select",
        options_enableButtons, false);
    document.getElementById("link-types-context").addEventListener("popupshowing",
        options_enableContextMenu, false);
  },
  
  edit_startup: function() {
    editLinkTypes_initialise();
  }
}

window.addEventListener("load", function(e) {
  net.soylentred.makelink.startup();
}, false);

window.addEventListener("unload", function(e) {
  net.soylentred.makelink.shutdown();
}, false);

