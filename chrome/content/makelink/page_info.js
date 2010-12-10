net.soylentred.makelink.PageInfo = function() {
  this.logger_ =
      new net.soylentred.makelink.Logger('net.soylentred.makelink.PageInfo');
  this.logger_.logCall('<init>', arguments);
};

/**
 * Gets the {@code src} URL of an image.
 * TODO: Resolve relative URLs.
 *
 * @param node The image node.
 * @return The {@code src} URL of the image if present, or the empty string.
 */
net.soylentred.makelink.PageInfo.prototype.getImageUrl = function(node) {
  this.logger_.logCall('getImageUrl', arguments);
  var nodeType = node.nodeName.toLowerCase();
  if (nodeType != 'img') {
    throw 'Unexpected node type in getImageUrl: ' + nodeType;
  }
  return node.src || '';
};

/**
 * Gets the text content of an element and its sub-elements as a string.
 * Only text content is preserved (i.e., there are no tags), and images are
 * replaced by their {@code alt} attributes.
 *
 * @param element The element to get the text of.
 * @return The complete text of the element and its children.
 */
net.soylentred.makelink.PageInfo.prototype.getElementText =
    function(element) {
  this.logger_.logCall('getElementText', arguments);
  var text = '';
  for (var i = 0; i < element.childNodes.length; i++) {
    var child = element.childNodes[i];
    if (child.nodeValue != null) {
      // It's a text node.
      text += child.nodeValue;
    } else if (child.tagName.toLowerCase() == "img") {
      text += child.alt;
    } else {
      text += this.getElementText(child);
    }
  }
  return text.replace(/[ \n\r\t]+/g, ' ');
};

/**
 * Get the selected text on a page.
 * TODO: Determine why it's necessary to pass a node as an argument.
 * TODO: Leave the n_alt repacement up to the caller.
 */
net.soylentred.makelink.PageInfo.prototype.getSelectedText =
    function(node, n_alt) {
  this.logger_.logCall('getSelectedText', arguments);
  var selection = '';
  var nodeLocalName = node.localName.toUpperCase();
  if (nodeLocalName == "TEXTAREA" || nodeLocalName == "INPUT" &&
      (node.type == "text" || node.type == "password")) {
    selection = node.value.substring(node.selectionStart, node.selectionEnd);
  } else if (nodeLocalName == "OPTION") {
    var parentSelect = node.parentNode;
    if (parentSelect.localName.toUpperCase() == "SELECT") {
      if (parentSelect.multiple) {
        var anOption;
        for (var i = 0; i < parentSelect.options.length; i++ ) {
          anOption = parentSelect.options[i];
          if (anOption.selected) {
            selection += " " + anOption.value;
          }
        }
      } else {
        selection = node.value;
      }
    }
  } else if (nodeLocalName == "SELECT") {
    // TODO: determine if this works correctly for multiple select.
    selection = node.options[node.selected].value;
  } else {
    var focusedWindow = document.commandDispatcher.focusedWindow;
    selection = focusedWindow.getSelection().toString();
  }
  selection = selection.toString();
  // collapse white space:
  selection = selection.replace(/[ \r\t]+/g, " ");
  // replace \n with n_alt:
  selection = selection.replace(/\n/g, n_alt);
  // trim white space:
  selection = selection.replace(/(^\s+)|(\s+$)/, "");
  return selection;
};

/**
 * Gets the value of the {@code content} attribute of the first {@code meta}
 * element with a {@code name} attribute of 'description'.
 *
 * @return The description of the page according to the first
 *     {@code <meta name='description'>} element, or the empty string if no
 *     such element exists or if it is missing the {@code content} attribute.
 */
net.soylentred.makelink.PageInfo.prototype.getPageDescription =
    function(document) {
  this.logger_.logCall('getPageDescription', arguments);
  var metas = document.getElementsByTagName('meta');
  for (var i = 0; i < metas.length; i++) {
    var name = metas[i].getAttribute('name');
    if (name && name.toLowerCase() == 'description') {
      return metas[i].getAttribute('content') || '';
    }
  }
  return 'desc';
};

/**
 * Finds the nearest ancestor link ({@code a} element with a {@code href}
 * attribute) or block level element containing the given node.
 *
 * @param node The node to check.
 * @return The nearest ancestor block-level element or link or the node.
 */
net.soylentred.makelink.PageInfo.prototype.getCorrectTarget = function(node) {
  this.logger_.logCall('getCorrectTarget', arguments);
  while (!this.isBlockLevel(node) && !this.isLink(node) && node.parentNode) {
    node = node.parentNode;
  }
  return node;
};

/**
 * Checks if the given node is an {@code a} element with an {@code href}
 * attribute.
 *
 * @param node The node to check.
 * @return true iff the node is an {@code a} element with an {@code href}
 *     attribute.
 */
net.soylentred.makelink.PageInfo.prototype.isLink = function(node) {
  this.logger_.logCall('isLink', arguments);
  return node.href && node.localName.toLowerCase() == 'a';
};

/**
 * Checks if the given node is a block-level element.
 *
 * @param node The node to check.
 * @return true iff the node is block-level.
 */
net.soylentred.makelink.PageInfo.prototype.isBlockLevel = function(node) {
  this.logger_.logCall('isBlockLevel', arguments);
  var blocks = ['html', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul',
      'ol', 'dir', 'menu', 'li', 'dl', 'dt', 'dd', 'p', 'pre', 'blockquote',
      'address', 'div', 'center', 'form', 'table', 'tr', 'td'];
  return blocks.indexOf(node.localName.toLowerCase()) >= 0;
};
