function editLinkTypes_initialise() {
	var dialog = document.getElementById("makelink-edit-dialog");

	if (window.arguments[0] == "_new") {
		dialog.setAttribute("title", "Make Link :: New Link Type");
		document.getElementById("makelink-newlinktype-contexthelp-new").style.display = "block";
		document.getElementById("makelink-newlinktype-contexthelp-edit").style.display = "none";
	} else {
		var id = window.arguments[0];
		var type = net.soylentred.makelink.getType(id);
		document.getElementById("editlinktype-title").value = type['title'];
		document.getElementById("editlinktype-format").value = type['format'];
		document.getElementById("editlinktype-entities").checked = type['useentities'];
		
		dialog.setAttribute("title", "Make Link :: Edit Link Type :: " + type['title']);
		document.getElementById("makelink-newlinktype-contexthelp-new").style.display = "none";
		document.getElementById("makelink-newlinktype-contexthelp-edit").style.display = "block";
	}
}

function editLinkTypes_accept() {
    var type = {};
    if (window.arguments[0] != "_new") {
    	type['id'] = window.arguments[0];
    }
    type['title'] = document.getElementById("editlinktype-title").value;
    type['format'] = document.getElementById("editlinktype-format").value;
    type['useentities'] = document.getElementById("editlinktype-entities").checked;
    net.soylentred.makelink.saveType(type);
}

function editLinkTypes_displayHelp() {
	//display a page describing the available options:
	window.open("chrome://makelink/content/help/defininglinktypes.html");
}