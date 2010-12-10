net.soylentred.makelink.LinkMaker = function() {
  this.prefs_ = net.soylentred.makelink.getPrefs();
  this.logger_ = 
      new net.soylentred.makelink.Logger('net.soylentred.makelink.LinkMaker');
  this.logger_.logCall('<init>', arguments);
  this.linkTypeSource_ = new net.soylentred.makelink.LinkTypeSource();
  this.urlShortener_ = new net.soylentred.makelink.UrlShortener();
  this.pageInfo_ = new net.soylentred.makelink.PageInfo();
};

net.soylentred.makelink.LinkMaker.prototype.startUp = function() {
  this.logger_.logCall('startUp', arguments);
  this.prefs_.addObserver('', this, false);
  this.rebuildMenu_();
};

net.soylentred.makelink.LinkMaker.prototype.shutDown = function() {
  this.logger_.logCall('shutDown', arguments);
  this.prefs_.removeObserver('', this);
};

net.soylentred.makelink.LinkMaker.prototype.makeSelectionLink = function(
    event, format, useEntities) {
  this.logger_.logCall('makeSelectionLink', arguments);
  // What element was clicked on:
  var target = document.popupNode;

  var info = {};
  if (target.nodeName.toLowerCase() == 'img') {
    info['imgurl'] = this.pageInfo_.getImageUrl(target);
  }
  // move up the DOM tree to a link or block level element:
  target = this.pageInfo_.getCorrectTarget(target);

  // look to see if there's selected text:
  var selection;
  if ((selection = this.pageInfo_.getSelectedText(target, ' ')) != '') {
    info['text'] = selection;
    var newline = '\n';
    if (window.navigator.platform.match(/^Win/)) {
      newline = '\r\n';
    }
    info['text_n'] = this.pageInfo_.getSelectedText(target, newline);
    info['text_br'] =
      this.pageInfo_.getSelectedText(target , '<br />' + newline);
    info['url'] = window.content.document.location.href;
    info['title'] = window.content.document.title;
  }
  // or if it's a link:
  else if (this.pageInfo_.isLink(target)) {
    // get anchor text/URL:
    info['text'] = this.pageInfo_.getElementText(target);
    info['text_n'] = this.pageInfo_.getElementText(target);
    info['text_br'] = this.pageInfo_.getElementText(target);
    info['url'] = target.href;
    info['title'] = target.title || '';
  } else {
    // not an anchor (get page title/URL):
    info['text'] = window.content.document.title;
    info['text_n'] = window.content.document.title;
    info['text_br'] = window.content.document.title;
    info['url'] = window.content.document.location.href;
    info['title'] =
        this.pageInfo_.getPageDescription(window.content.document);
  }

  if (useEntities) {
    for (i in info) {
      info[i] = info[i].replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\"/g, '&quot;');
    }
  }
  // make the link:
  return this.makeLink_(format, info, useEntities);
};

net.soylentred.makelink.LinkMaker.prototype.openOptions = function() {
  this.logger_.logCall('openOptions', arguments);
  var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
  window.openDialog('chrome://makelink/content/options/options.xul',
      'makelinkoptions', features);
};

net.soylentred.makelink.LinkMaker.prototype.observe = function(
    subject, topic, data) {
  this.logger_.logCall('observe', arguments);
  if (topic == 'nsPref:changed') {
    this.rebuildMenu_();
  }
};

net.soylentred.makelink.LinkMaker.prototype.makeLink_ = function(
    format, info, copyAsHtml) {
  this.logger_.logCall('makeLink_', arguments);
  // split into pieces on %:
  var piece = format.split('%');
  // flag to record if the current piece is potentially a makelink variable:
  var inVar = false;

  var copyText = '';
  for (var i = 0; i < piece.length; i++) {
    // if it's not a makelink variable...:
    if (!inVar) {
      // just add it as it is:
      copyText += piece[i];
      // next piece could be a variable:
      inVar = true;
    } else {	
      inVar = false;
      switch (piece[i].toLowerCase()) {
        case 'text':
          copyText += info['text'];
          break;
        case 'text_n':
          copyText += info['text_n'];
          break;
        case 'text_br':
          copyText += info['text_br'];
          break;
        case 'url':
          copyText += info['url'];
          break;
        case 'imgurl':
          copyText += info['imgurl'];
          break;
        case 'title':
          copyText += info['title'];
          break;
        case 'tinyurl':
          var shortenedUrl = this.urlShortener_.getShortenedUrl(info['url']);
          if (!shortenedUrl) { 
            this.logger_.warning('Failed to fetch shortened URL');
            return false;
          }
          copyText += shortenedUrl;
          break;
        case 'input':
          copyText += prompt(format +
              '\n\nPlease enter the %input% text for\n--\n' +
              format + '\n--');
          break;
        // default (not actually a make link variable) means inVar
        // is still true for the next piece
        default:
          inVar = true;
          copyText += '%' + piece[i];
      }
    }
  }

  if (copyAsHtml) {
    var mimeTypes = ['text/html', 'text/unicode'];
  } else {
    var mimeTypes = ['text/unicode'];
  }
  return this.copyToClipboard_(copyText, mimeTypes);
};

net.soylentred.makelink.LinkMaker.prototype.copyToClipboard_ = function(
    copyText, mimeTypes) {
  this.logger_.logCall('copyToClipboard_', arguments);
  var string = Components.classes['@mozilla.org/supports-string;1']
      .createInstance(Components.interfaces.nsISupportsString);
  if (!string) {
    this.logger_.warning('Failed to create nsISupportsString');
    return false;
  }
  var transferable = Components.classes['@mozilla.org/widget/transferable;1']
      .createInstance(Components.interfaces.nsITransferable);
  if (!transferable) {
    this.logger_.warning('Failed to create nsITransferable');
    return false;
  }
  var clipboard = Components.classes['@mozilla.org/widget/clipboard;1']
      .getService(Components.interfaces.nsIClipboard);
  if (!clipboard) {
    this.logger_.warning('Failed to get service nsIClipboard');
    return false;
  }

  string.data = copyText;
  for (var i = 0; i < mimeTypes.length; i++) {
    transferable.addDataFlavor(mimeTypes[i]);
    transferable.setTransferData(mimeTypes[i], string, copyText.length * 2);
  }
  clipboard.setData(transferable, null,
      Components.interfaces.nsIClipboard.kGlobalClipboard);
  return true;
};

net.soylentred.makelink.LinkMaker.prototype.rebuildMenu_ = function() {
  this.logger_.logCall('rebuildMenu_', arguments);
  var menu = document.getElementById('makelink-submenu');
  var config = menu.lastChild;
  if (!this.menuHasBeenBuilt_) {
    config.addEventListener('command',
        net.soylentred.makelink.bind(this, this.openOptions),
        false);
    this.menuHasBeenBuilt_ = true;
  };
  var types = this.linkTypeSource_.getLinkTypes();
  // Remove all children of the menu:
  while (menu.firstChild != config) {
    menu.removeChild(menu.firstChild);
  }
  // For each link type, add a menu item:
  for (var i = 0; i < types.length; i++) {
    var menuitem = document.createElement('menuitem');
    menuitem.setAttribute('label', types[i]['title']);
    menuitem.setAttribute('format', types[i]['format']);
    menuitem.setAttribute('useentities',
        types[i]['useentities'] ? 'true' : 'false');
    menuitem.setAttribute('class', 'makelink-linktype');
    var linkMaker = this;
    menuitem.addEventListener('command',
        function(e) {
          linkMaker.makeSelectionLink(e, this.getAttribute('format'),
              this.getAttribute('useentities') == 'true');
        }, false);
    menu.insertBefore(menuitem, config);
  }
  // Add a separator (only if there's at least one link type):
  if (menu.firstChild != config) {
    menu.insertBefore(document.createElement('menuseparator'), config);
  }
};

(function(){
  var linkMaker = new net.soylentred.makelink.LinkMaker();
  window.addEventListener('load',
      net.soylentred.makelink.bind(linkMaker, linkMaker.startUp),
      false);
  window.addEventListener('unload',
      net.soylentred.makelink.bind(linkMaker, linkMaker.shutDown),
      false);
})();
