var mlDurls = {};

function getImageUrl(node) {
	if (node.nodeName.toLowerCase() == "img" && node.src) {
		return node.src;
	}
	return "";
}

function getDurl(url) {
	if (mlDurls[url]) return mlDurls[url];
	
	var xml = new XMLHttpRequest();
	xml.open("GET", "http://durl.us/api/?url=" + escape(url), false);
	xml.send(null);
	
	if (xml.status == 200) {
		try {
			var res = xml.responseXML.getElementsByTagName("result")[0].firstChild.nodeValue;
			if (res == "1") {
				var durl = xml.responseXML.getElementsByTagName("durl_url")[0].firstChild.nodeValue;
				mlDurls[url] = durl;
			} else {
				// var msg = "Error from server:\n\"" + xml.responseXML.getElementsByTagName("msg")[0].firstChild.nodeValue + "\"";
				// mlBadDurlResponse(url, msg);
			}
		} catch (e) {
			// mlBadDurlResponse(url, "Badly-formed response from Durl");
		}
	} else {
		// mlBadDurlResponse(url, "Durl.us HTTP response code: " + xml.status);
	}
	
	// Try TinyURL.com if durl doesn't work:
	if (!mlDurls[url]) {
		xml = new XMLHttpRequest();
		xml.open("GET", "http://tinyurl.com/create.php?url=" + escape(url), false);
		xml.send(null);
		
		if (xml.status == 200 && xml.responseText) {
			try {
				var durl = /<b>http:\/\/tinyurl.com\/[a-zA-Z0-9]+<\/b>/.exec(xml.responseText)[0]
						.replace(/<\/?b>/ig, "");
				mlDurls[url] = durl;
			} catch (e) {
				mlBadDurlResponse(url, "Couldn't parse the TinyURL.com response.");
			}
		} else {
			mlBadDurlResponse(url, "TinyURL.com HTTP response code: " + xml.status);
		}
	}
	
	return !mlDurls[url] ? mlDurls[url] : false;
}

function mlBadDurlResponse(url, msg) {
	alert("Can't get durl.us or tinyurl.com URL for " + url + "\n\n---\n" + msg + "\n---");
	mlDurls[url] = null;
}

function getLinkText(element) {
	// text to output:
	var text = "";
	
	// for every sub-element:
	for (var i = 0; i < element.childNodes.length; i++) {
		var currentNode = element.childNodes[i];
		
		if (currentNode.nodeValue != null) {
			// if it's a text node, add it to the output text:
			text += currentNode.nodeValue;
		} else if ( currentNode.tagName.toLowerCase() == "img" ) {
			// if it's an image, add its alt text:
			text += currentNode.alt;
		} else {
			// otherwise just recurse it's children:
			text += getLinkText(currentNode);
		}
	}
	// replace whitespace with a single space:
	return text.replace(/[ \n\r\t]+/g," ");
}

function getSelectedText( node )
{
    /*
     * original code taken from text/plain extension by Gilles Durys <mozbug@durys.net>
     * used (and modified) under the terms of the MPL/GPL bi-licence.
     */
    var selection = "";
    var nodeLocalName = node.localName.toUpperCase();
    if ( ( nodeLocalName == "TEXTAREA" ) || ( nodeLocalName == "INPUT" && ( node.type == "text" || node.type == "password" ) ) )
    {
        selection = node.value.substring( node.selectionStart , node.selectionEnd );
    }
    else if ( nodeLocalName == "OPTION" )
    {
        var parentSelect = node.parentNode;
        if ( parentSelect.localName.toUpperCase() == "SELECT" )
        {
            if ( parentSelect.multiple )
            {
                var anOption;
                for ( var i = 0 ; i < parentSelect.options.length ; i++ )
                {
                    anOption = parentSelect.options[i];
                    if ( anOption.selected )
                    {
                        selection += " " + anOption.value;
                    }
                }
            }
            else
            {
                selection = node.value;
            }
        }
    }
    else if ( nodeLocalName == "SELECT" )
    {
        selection = node.options[node.selected].value;
    }
    else
    {
        var focusedWindow = document.commandDispatcher.focusedWindow;
        selection = focusedWindow.getSelection().toString();
    }
    selection = selection.toString();

    // collapse white space:
    selection = selection.replace(/[ \n\r\t]+/g, " ");
    // trim white space:
    selection = selection.replace(/(^\s+)|(\s+$)/, "");
    return selection;
}

function getSelectionType(node) {
    var tag = node.localName.toUpperCase();

    if (tag == "IMG" && node.parentNode.localName.toUpperCase() == "A")
    {
        node = node.parentNode;
        tag = node.localName.toUpperCase();
    }

    if (tag == "A" && node.href)
    {
        // link:
        return "link";
    }
    else
    {
        // not a link:
        return "nolink";
    }
}

function getLinkTitle(node) {
    return node.title;
}

function getPageDescription( document )
{
    // get a list of meta elements:
    var metas = document.getElementsByTagName( "meta" );
    var desc = "";
    for ( var i = 0 ; i < metas.length ; i++ )
    {
        // look for the "description" meta element:
        var name = metas[i].getAttribute( "name" );
        if ( name )
        {
            if ( name.toLowerCase() == "description" ) desc = metas[i].getAttribute("content");
        }
    }
    // then return the description:
    return desc;
}

/* returns the link ultimately containing the node or the block
   level element ultimately containing the node, nearest ancestor in
   both cases */
function getCorrectTarget(node) {
	while (!isBlockLevel(node) && !isLink(node)) {
		if (node.parentNode) {
			// work up the tree if there is a parent:
			node = node.parentNode;
		} else {
			// return the current node if it's at the top:
			return node;
		}
	}
	return node;
}

function isLink(node) {
	// true iff node is a link (<a href>)
	return (tagName(node) == 'a' && node.href);
}

function isBlockLevel(node) {
	// array of all block level elements:
	var blocks = new Array('html', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dir', 'menu', 'li', 'dl', 'dt', 'dd', 'p', 'pre', 'blockquote', 'address', 'div', 'center', 'form', 'table', 'tr', 'td');
	return inArray(tagName(node), blocks);
}

function tagName(node) {
	return node.localName.toLowerCase();
}

function inArray(needle, haystack) {
	for (var i = 0; i < haystack.length; i++) {
		if (needle == haystack[i]) {
			return true;
		}
	}
	return false;
}