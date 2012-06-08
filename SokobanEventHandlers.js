function body_onload() {
    // Get important elements
    gPlayfieldTable = document.getElementById('playfield');
    gPlayfieldContainerDiv = document.getElementById('playfieldContainer');
    gPlaceholderTbody = document.getElementById('placeholder');
    gStatusbarTextSpan = document.getElementById('statusbarText');
    gStatusbarTd = document.getElementById('statusbar');
    gCenterTd = document.getElementById('center');
    gButtonbarTd = document.getElementById('buttonbar');
    gFrontDiv = document.getElementById('front');
    gBackDiv = document.getElementById('back');
    gPrevPuzzleDiv = document.getElementById('prevPuzzle');
    gNextPuzzleDiv = document.getElementById('nextPuzzle');
    gPuzzleSetControl = document.getElementById('puzzleSetControl');
    gPuzzleNumberControl = document.getElementById('puzzleNumberControl');
    gShroudDiv = document.getElementById('shroud');
    gPuzzleSetAuthorSpan = document.getElementById('puzzleSetAuthor');
    gPuzzleSetCountSpan = document.getElementById('puzzleSetCount');
    gInfoButtonImg = document.getElementById('infoButton');

    // Populate the list of puzzle sets
    var sokobanSets = new Array(
	'-Aymeric du Peloux', 'Minicosmos', 'Microcosmos', 'Nabokosmos', 'Picokosmos',
	'-François Marques', 'Novoban', 'Sokolate', 'Sokompact', 'Kokoban',
	'-David Skinner', 'Microban', 'Sasquatch', 'Mas Sasquatch', 'Sasquatch III',
	'-Evgeny Grigoriev', 'Grigr2001', 'Grigr2002', 'GrigrSpecial',
	'-Yoshio Murase', 'Yoshio'
    );
    var i, workingOptgroup, workingOption;
    workingOptgroup = gPuzzleSetControl;
    for(i = 0; i < sokobanSets.length; ++i) {
	if(sokobanSets[i].charAt(0) == '-') {
	    workingOptgroup = document.createElement('optgroup');
	    workingOptgroup.label = sokobanSets[i].substring(1, sokobanSets[i].length);
	    gPuzzleSetControl.appendChild(workingOptgroup);
	} else {
	    workingOption = document.createElement('option');
	    workingOption.label = sokobanSets[i] + " (" + gSokobanPuzzles[sokobanSets[i]][0].difficulty + ")";
	    workingOption.value = sokobanSets[i];
	    workingOption.appendChild(document.createTextNode(sokobanSets[i]));
	    workingOptgroup.appendChild(workingOption);
	}
    }

    // Set up event handlers for button divs
    var divs = document.getElementsByTagName('div'), i;
    for(i = 0; i < divs.length; ++i) {
	if(divs[i].className == "button" || divs[i].className == "button_sep") {
	    divs[i].onmousedown = button_onmousedown;
	    divs[i].onmouseup = button_onmouseup;
	    divs[i].onmouseout = button_onmouseout;
	}
    }

    // Construct the arrow buttons
    gArrowButtons = new Array(4);
    gArrowButtons[0] = document.createElement("div");
    gArrowButtons[0].style.position = "absolute";
    gArrowButtons[0].style.display = "none";
    gArrowButtons[0].style.cursor = "pointer";
    gArrowButtons[0].style.AppleDashboardRegion = "dashboard-region(control rectangle)";
    gArrowButtons[0].style.opacity = ".6";
    gArrowButtons[0].style.backgroundRepeat = "no-repeat";
    gArrowButtons[0].style.backgroundPosition = "center center";
    gArrowButtons[0].style.width  = "14px";
    gArrowButtons[0].style.height = "14px";
    for(i = 1; i < 4; ++i)
	gArrowButtons[i] = gArrowButtons[0].cloneNode(false);
    // Up
    gArrowButtons[0].style.top = "-12px";
    gArrowButtons[0].style.left = "3px";
    gArrowButtons[0].style.backgroundImage = "url(images/up-arrow.png)";
    gArrowButtons[0].onclick = arrow_up_click;
    // Right
    gArrowButtons[1].style.top = "3px";
    gArrowButtons[1].style.left = "18px";
    gArrowButtons[1].style.backgroundImage = "url(images/right-arrow.png)";
    gArrowButtons[1].onclick = arrow_right_click;
    // Down
    gArrowButtons[2].style.top = "18px";
    gArrowButtons[2].style.left = "3px";
    gArrowButtons[2].style.backgroundImage = "url(images/down-arrow.png)";
    gArrowButtons[2].onclick = arrow_down_click;
    // Left
    gArrowButtons[3].style.top = "3px";
    gArrowButtons[3].style.left = "-11px";
    gArrowButtons[3].style.backgroundImage = "url(images/left-arrow.png)";
    gArrowButtons[3].onclick = arrow_left_click;

    // Create the Sokoban object
    gSokobanObject = new Sokoban();
}

function body_onkeydown(ev) {
    var keyCode, commandKey, move = true;
    
    if(gIgnoreKeyDown || gKeyDownWait) return;
    
    // Hide the arrows when a key is pressed
    if(gShowArrowButtons) {
	gShowArrowButtons = false;
	var i;
	for(i = 0; i < 4; ++i)
	    gArrowButtons[i].style.display = "none";
    }
    
    if(window.event) {
	keyCode = event.keyCode;
	commandKey = event.metaKey || event.ctrlKey;
    } else {
	// For FireFox
	keyCode = ev.which;
	commandKey = ev.metaKey || ev.ctrlKey;
    }
    
    var dx, dy;
    switch(keyCode) {
    case 37: // Left arrow
	dx = -1; dy =  0;
	break;
    case 38: // Up arrow
	dx =  0; dy = -1;
	break;
    case 39: // Right arrow
	dx =  1; dy =  0;
	break;
    case 40: // Down arrow
	dx =  0; dy =  1;
	break;

    case 8:  // Backspace
    case 85: // U
    case 90: // Z
	gSokobanObject.undo();
	move = false;
	break;
    case 27: // Escape
    case 82: // R
	gSokobanObject.reset();
	move = false;
	break;
    // XXX debug cheat!
    case 87: // W
	gSokobanObject.win();
	move = false;
	break;
    default:
	move = false;
	break;
    }
    if(move)
	gSokobanObject.move(dx, dy);

    // Work around a Safari bug where the onkeydown event fires twice
    gKeyDownWait = true;
    setTimeout("gKeyDownWait = false;", 10);
}

function reset_onclick() {
    gSokobanObject.reset();
}

function undo_onclick() {
    gSokobanObject.undo();
}

function prevPuzzle_onclick() {
    if(gSokobanObject.puzzleNumber > 1)
	gSokobanObject.loadPuzzle(gSokobanObject.puzzleSet, gSokobanObject.puzzleNumber - 1);
}

function nextPuzzle_onclick() {
    if(gSokobanObject.puzzleNumber < gSokobanObject.puzzlesInCurrentSet())
	gSokobanObject.loadPuzzle(gSokobanObject.puzzleSet, gSokobanObject.puzzleNumber + 1);
}

function infoButton_onclick() {
    if(window.widget) {
	var resizeW = (gWindowFrontW > 218)? gWindowFrontW : 218;
	var resizeH = (gWindowFrontH > 212)? gWindowFrontH : 212;
	window.resizeTo(resizeW, resizeH);
	widget.prepareForTransition("ToBack");
   }
    gFrontDiv.style.display = 'none';
    gBackDiv.style.display = 'block';
    
    gPuzzleSetControl.value = gSokobanObject.puzzleSet;
    gPuzzleNumberControl.value = gSokobanObject.puzzleNumber;
    updatePuzzleSetMetadataDisplay();
    
    if(window.widget) {
	setTimeout('widget.performTransition(); window.resizeTo(218, 212);', 0);
    }
}

function button_onmousedown() {
    set_button('inset');
}

function button_onmouseup() {
    set_button('outset');
}

function button_onmouseout() {
    set_button('outset');
}

function set_button(state) {
    if(window.event) {
	var element = event.srcElement;
	while(element.nodeType != 1) // 1 == ELEMENT_NODE
	    element = element.parentNode;
	element.style.borderStyle = state;
    }
}

function puzzleSetControl_onchange() {
    updatePuzzleSetMetadataDisplay();
    verifyPuzzleNumber();
}

function puzzleSetAuthor_onclick() {
    if(window.widget)
	widget.openURL(gPuzzleSetAuthorSpan.linkURL);
    else
	window.open(gPuzzleSetAuthorSpan.linkURL);
}

function puzzleNumberControl_onchange() {
    verifyPuzzleNumber();
}

function doneControl_onclick() {
    if(window.widget) {
	var resizeW = (gWindowFrontW > 218)? gWindowFrontW : 218;
	var resizeH = (gWindowFrontH > 212)? gWindowFrontH : 212;
	window.resizeTo(resizeW, resizeH);
	widget.prepareForTransition("ToFront");
    }

    var newPuzzleSet = gPuzzleSetControl.value;
    var newPuzzleNumber = parseInt(gPuzzleNumberControl.value, 10);
    if((newPuzzleSet != gSokobanObject.puzzleSet) || (newPuzzleNumber != gSokobanObject.puzzleNumber))
	gSokobanObject.loadPuzzle(newPuzzleSet, newPuzzleNumber);

    gFrontDiv.style.display = 'block';
    gBackDiv.style.display = 'none';
    if(window.widget) {
	setTimeout('widget.performTransition(); window.resizeTo(gWindowFrontW, gWindowFrontH);', 0);
    }
}

function window_onfocus() {
    gShroudDiv.style.opacity = "1";
    gStatusbarTextSpan.style.opacity = "1";
    // Work around a bug where absolute-positioned divs get incorrectly positioned when opacity changes
    if(window.widget || navigator.userAgent.match(/Safari/)) {
	window.resizeBy(1,0);
	window.resizeBy(-1,0);
    }
}

function window_onblur() {
    gShroudDiv.style.opacity = ".5";
    gStatusbarTextSpan.style.opacity = ".5";
}

function front_onmousemove() {
    if(!gInfoButtonShown) {
	gInfoButtonShown = true;
	if(gInfoButtonInterval) clearInterval(gInfoButtonInterval);
	gInfoButtonInterval = setInterval("fadeInfoButton(+1);", 25);
    }
}

function front_onmouseout() {
    if(gInfoButtonShown) {
	gInfoButtonShown = false;
	if(gInfoButtonInterval) clearInterval(gInfoButtonInterval);
	gInfoButtonInterval = setInterval("fadeInfoButton(-1);", 25);
    }
}

function center_onmousemove() {
    var i;

    if(!gShowArrowButtons) {
	gShowArrowButtons = true;
	gSokobanObject.updateStatus();
    }
}

function center_onmouseout() {
    if(gShowArrowButtons) {
	gShowArrowButtons = false;
	var i;
	for(i = 0; i < 4; ++i)
	    gArrowButtons[i].style.display = "none";
    }
}

function arrow_up_click() {
    gSokobanObject.move(0, -1);
}

function arrow_down_click() {
    gSokobanObject.move(0, 1);
}

function arrow_left_click() {
    gSokobanObject.move(-1, 0);
}

function arrow_right_click() {
    gSokobanObject.move(1, 0);
}

function versionTag_onclick() {
    // Take the viewer home
    if(window.widget) {
	widget.openURL("http://pknet.com/~joe/sokoban.html");
    } else {
	window.open("http://pknet.com/~joe/sokoban.html");
    }
}

function fadeInfoButton(direction) {
    if((direction < 0 && gInfoButtonImg.style.opacity <= 0)
	|| (direction > 0 && gInfoButtonImg.style.opacity >= .9)) {
	clearInterval(gInfoButtonInterval);
	gInfoButtonInterval = null;
	return;
    }
    gInfoButtonImg.style.opacity = (parseFloat(gInfoButtonImg.style.opacity) || 0) + .0625*direction;
}

function updatePuzzleSetMetadataDisplay() {
    while(gPuzzleSetAuthorSpan.firstChild)
	gPuzzleSetAuthorSpan.removeChild(gPuzzleSetAuthorSpan.firstChild);
    gPuzzleSetAuthorSpan.appendChild(document.createTextNode('"' + gPuzzleSetControl.value + '"'));
    gPuzzleSetAuthorSpan.appendChild(document.createElement("br"));
    gPuzzleSetAuthorSpan.appendChild(document.createTextNode("puzzles © " + gSokobanPuzzles[gPuzzleSetControl.value][0].author));
    gPuzzleSetAuthorSpan.linkURL = gSokobanPuzzles[gPuzzleSetControl.value][0].homepage;
    
    while(gPuzzleSetCountSpan.firstChild)
	gPuzzleSetCountSpan.removeChild(gPuzzleSetCountSpan.firstChild);
    gPuzzleSetCountSpan.appendChild(document.createTextNode((gSokobanPuzzles[gPuzzleSetControl.value].length-2) + " puzzles"));
}

function verifyPuzzleNumber() {
    if(parseInt(gPuzzleNumberControl.value) > (gSokobanPuzzles[gPuzzleSetControl.value].length-2))
	gPuzzleNumberControl.value = (gSokobanPuzzles[gPuzzleSetControl.value].length-2);
    else if(parseInt(gPuzzleNumberControl.value) <= 0)
	gPuzzleNumberControl.value = 1;
}

window.onfocus = window_onfocus;
window.onblur = window_onblur;
