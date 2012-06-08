// Global variables
var gSokobanObject = null;

var gPlaceholderTbody = null;
var gPlayfieldTable = null;
var gStatusbarTextSpan = null;
var gFrontDiv = null;
var gBackDiv = null;
var gPuzzleSetControl = null;
var gPuzzleNumberControl = null;
var gWindowFrontW = null, gWindowFrontH = null;
var gStatusbarTd = null, gCenterTd = null, gButtonbarTd = null;
var gShroudDiv = null;
var gPuzzleSetAuthorSpan = null, gPuzzleSetCount = null;
var gIgnoreKeyDown = false, gKeyDownWait = false;
var gInfoButtonImg = null;
var gArrowButtons = null;
var gShowArrowButtons = false;
var gPrevPuzzleDiv = null, gNextPuzzleDiv = null;

var gInfoButtonShown = false, gInfoButtonInterval = null;

var gSokobanPuzzles = new Object();

// Create the Sokoban object
function Sokoban() {
    var initPuzzleSet = null, initPuzzleNumber = null;
    
    // Load preferences
    if(window.widget) {
	initPuzzleSet = widget.preferenceForKey("puzzleSet");
	initPuzzleNumber = parseInt(widget.preferenceForKey("puzzleNumber"), 10);
    }
    if(!initPuzzleSet)
	initPuzzleSet = 'Minicosmos';
    if(!initPuzzleNumber)
	initPuzzleNumber = 1;

    // Read-only properties
    this.puzzleSet = initPuzzleSet;
    this.puzzleNumber = initPuzzleNumber;
    
    // Internal state
    this.playfieldState = null;		    // Array of arrays detailing the current playfield
					    // Possible playfield states: player player-in-hole space wall boulder hole boulder-in-hole
    this.playerPosition = null;		    // Object holding the player's X-Y position 
    this.moveHistory = null;		    // Array of the player's moves
    this.gameDivs = null;		    // Array of absolute-positioned divs used to display game objects
    this.boulderCount = 0;		    // Number of boulders total
    this.boulderSolvedCount = 0;	    // Number of boulders in holes
    // Private functions
    this.setPlayfieldState = Sokoban_setPlayfieldState;
    this.updateStatus = Sokoban_updateStatus;
    this.win = Sokoban_win;
    this.slideDivs = Sokoban_slideDivs;
    
    // Interface functions
    this.loadPuzzle = Sokoban_loadPuzzle;
    this.reset = Sokoban_reset;
    this.canMove = Sokoban_canMove;
    this.move = Sokoban_move;
    this.undo = Sokoban_undo;
    this.puzzlesInCurrentSet = Sokoban_puzzlesInCurrentSet;
    
    this.loadPuzzle(initPuzzleSet, initPuzzleNumber);
}

function Sokoban_setPlayfieldState(x, y, state) {
    this.playfieldState[y][x] = state;
}

function Sokoban_updateStatus() {
    while(gStatusbarTextSpan.firstChild)
	gStatusbarTextSpan.removeChild(gStatusbarTextSpan.firstChild);
	
    gStatusbarTextSpan.appendChild(
	document.createTextNode(this.puzzleSet + " #" + this.puzzleNumber + " • " + (this.moveHistory.length || 0) + " moves")
    );
    
    // Show only the arrow buttons for directions the player can move
    if(gShowArrowButtons) {
	gArrowButtons[0].style.display = this.canMove( 0, -1)? "block" : "none"; // up
	gArrowButtons[1].style.display = this.canMove( 1,  0)? "block" : "none"; // right
	gArrowButtons[2].style.display = this.canMove( 0,  1)? "block" : "none"; // down
	gArrowButtons[3].style.display = this.canMove(-1,  0)? "block" : "none"; // left
    }
}

var gWinFlashState;
function Sokoban_win() {
    gIgnoreKeyDown = true;
    gWinFlashState = new Object();
    gWinFlashState.count = 0;
    setTimeout(Sokoban_doWinFlash, 1);
}

function Sokoban_doWinFlash() {
    var i;
    with(gSokobanObject) {
	for(i = 0; i < gameDivs.length; ++i) {
	    with(gameDivs[i]) {
		if(className == "player-won")
		    continue;
		if(className == "player")
		    className = "player-won";
		else if(gWinFlashState.count % 2)
		    className = "boulder";
		else
		    className = "boulder-in-hole";
	    }
	}
    }
    ++gWinFlashState.count;
    if(gWinFlashState.count == 9) {
	var nextPuzzleNumber = gSokobanObject.puzzleNumber;
	if(nextPuzzleNumber <= gSokobanObject.puzzlesInCurrentSet()) {
	    ++nextPuzzleNumber;
	    setTimeout('gSokobanObject.loadPuzzle("' + gSokobanObject.puzzleSet + '", ' + nextPuzzleNumber + ');', 1000);
	} else {
	    // XXX do something fun for finishing the set
	}
    } else {
	setTimeout(Sokoban_doWinFlash, 100);
    }
}

// Load a puzzle
function Sokoban_loadPuzzle(newPuzzleSet, newPuzzleNumber) {
    if(window.widget) {
	widget.setPreferenceForKey(newPuzzleSet, 'puzzleSet');
	widget.setPreferenceForKey(newPuzzleNumber, 'puzzleNumber');
    }
    this.puzzleSet = newPuzzleSet;
    this.puzzleNumber = newPuzzleNumber;

    this.reset();
}

// Get the number of puzzles in the current set
function Sokoban_puzzlesInCurrentSet() {
    return gSokobanPuzzles[this.puzzleSet].length - 2;
}

// Reset the puzzle to its initial state
function Sokoban_reset() {
    var puzzle = gSokobanPuzzles[this.puzzleSet][this.puzzleNumber];
    var i, j, k;
    
    if(puzzle == null) {
	alert("I don't have data for puzzle " + newPuzzleNumber + " of " + newPuzzleSet);
	return;
    }
    
    // Figure out the puzzle dimensions
    var puzzleW = 0, puzzleH = puzzle.length;
    for(i = 0; i < puzzleH; ++i) {
	if(puzzle[i].length > puzzleW)
	    puzzleW = puzzle[i].length;
    }
    // Set up the initial state and construct a new table body
    var newPlayfieldState = new Array(puzzleH);
    var newBoulderCount = 0, newBoulderSolvedCount = 0;
    var newPlayerPosition = new Object();
    var newPlayfieldTbody = document.createElement('tbody');
    var newGameDivs = new Array();
    var workingTr, workingTd, workingDiv, workingRow, stateClass, tdClass, divClass;
    for(i = 0; i < puzzleH; ++i) {
	workingRow = newPlayfieldState[i] = new Array(puzzleW);
	workingTr = document.createElement('tr');
	newPlayfieldTbody.appendChild(workingTr);
	for(j = 0; j < puzzle[i].length; ++j) {
	    switch(puzzle[i].charAt(j)) {
	    case '#':
		stateClass = tdClass = 'wall';
		divClass = null;
		break;
	    case '@':
		stateClass = divClass = 'player';
		tdClass = 'space';
		newPlayerPosition.x = j;
		newPlayerPosition.y = i;
		break;
	    case '+':
		stateClass = 'player-in-hole';
		tdClass = 'hole';
		divClass = 'player';
		newPlayerPosition.x = j;
		newPlayerPosition.y = i;
		break;
	    case '$':
		stateClass = divClass = 'boulder';
		tdClass = 'space';
		++newBoulderCount;
		break;
	    case '.':
		stateClass = tdClass = 'hole';
		divClass = null;
		break;
	    case '*':
		stateClass = divClass = 'boulder-in-hole';
		tdClass = 'hole';
		++newBoulderCount;
		++newBoulderSolvedCount;
		break;
	    default:
		stateClass = tdClass = 'space';
		divClass = null;
		break;
	    }
	    if(divClass) {
		workingDiv = document.createElement('div');
		workingDiv.className = divClass;
		workingDiv.style.left = (12*j - 4) + "px";
		workingDiv.style.top = (12*i + 1) + "px";
		if(divClass == "player" || divClass == "player-in-hole") {
		    // Stick the arrow buttons around the player
		    for(k = 0; k < 4; ++k)
			workingDiv.appendChild(gArrowButtons[k]);
		}
		newGameDivs.push(workingDiv);
	    } else
		workingDiv = null;
	    workingTd = document.createElement('td');
	    workingTd.className = tdClass;
	    workingRow[j] = new Object();
	    workingRow[j].state = stateClass;
	    workingRow[j].div = workingDiv;
	    workingTr.appendChild(workingTd);
	}
	for(; j < puzzleW; ++j) {
	    workingTd = document.createElement('td');
	    workingTd.className = workingRow[j] = 'space';
	    workingTr.appendChild(workingTd);
	}
    }

    // Resize the widget
    if(window.widget) {
	// Left and right sides + padding + game area
	gWindowFrontW = 2*15 + 2*5 + 12*puzzleW;
	if(gWindowFrontW < 215)
	    gWindowFrontW = 215;
	// Top side + status area + separators + padding + game area + button bar + bottom side
	gWindowFrontH = 12 + 15 + 2*6 + 2*5 + 12*puzzleH + 19 + 18;
	window.resizeTo(gWindowFrontW, gWindowFrontH);
    }
    
    // Reveal the changes to the world
    if(this.gameDivs)
	for(i = 0; i < this.gameDivs.length; ++i)
	    gPlayfieldContainerDiv.removeChild(this.gameDivs[i]);
    gPlayfieldContainerDiv.style.width = (12*puzzleW) + "px";
        
    this.playfieldState = newPlayfieldState;
    this.boulderCount = newBoulderCount;
    this.boulderSolvedCount = newBoulderSolvedCount;
    this.playerPosition = newPlayerPosition;
    this.moveHistory = new Array();
    this.gameDivs = newGameDivs;

    if(this.puzzleNumber <= 1)
	gPrevPuzzleDiv.style.opacity = .5;
    else {
	gPrevPuzzleDiv.style.opacity = .99;
        if(this.puzzleNumber >= this.puzzlesInCurrentSet())
	    gNextPuzzleDiv.style.opacity = .5;
	else
	    gNextPuzzleDiv.style.opacity = .99;
    }

    gIgnoreKeyDown = false;

    gPlayfieldTable.removeChild(gPlayfieldTable.tBodies[0])
    gPlayfieldTable.appendChild(newPlayfieldTbody);
    
    for(i = 0; i < newGameDivs.length; ++i)
	gPlayfieldContainerDiv.appendChild(newGameDivs[i]);

    this.updateStatus();
}

// Check whether the player can move in a direction
function Sokoban_canMove(dx, dy) {
    with(this.playerPosition) {
	// Is the player on the edge of the playfield?
	if(dx < 0 && x == 0)
	    return false;
	if(dx > 0 && x == (this.playfieldState[0].length-1))
	    return false;
	if(dy < 0 && y == 0)
	    return false;
	if(dy > 0 && y == (this.playfieldState.length-1))
	    return false;

	var destState = this.playfieldState[y+dy][x+dx];

	// Is the player walking into empty space?
	if(destState.state == 'space' || destState.state == 'hole')
	    return true;
	// Is the player against a wall?
	if(destState.state == 'wall')
	    return false;
	// Is the player pushing a boulder?
	if(destState.state == 'boulder' || destState.state == 'boulder-in-hole') {
	    // Is the space beyond the boulder open?
	    var beyondDestState = this.playfieldState[y+2*dy][x+2*dx];
	    // XXX check if boulder is on edge
	    if(beyondDestState.state == 'space' || beyondDestState.state == 'hole')
		return true;
	    else
		return false;
	}
    }
	    
    alert('Fell through canMove!');
    return false;
}

// Perform a move
function Sokoban_move(dx, dy) {
    var i;
    
    // Check whether we actually can move
    if(this.canMove(dx, dy)) {
	with(this.playerPosition) {
	    var pushed = false;
	    var startState = this.playfieldState[y][x];
	    var destState = this.playfieldState[y+dy][x+dx];
	    var beyondDestState = this.playfieldState[y+2*dy][x+2*dx];
	    
	    // Change the destination square's state
	    // Are we pushing a boulder?
	    if(destState.state == 'boulder' || destState.state == 'boulder-in-hole') {
		pushed = true;
		
		if(beyondDestState.state == 'hole') {
		    beyondDestState.state = 'boulder-in-hole';
		    ++this.boulderSolvedCount;
		} else /*if(beyondDestState == 'space')*/ {
		    beyondDestState.state = 'boulder';
		}
		
		if(destState.state == 'boulder') {
		    destState.state = 'player';
		} else /*if(destState == 'boulder-in-hole')*/ {
		    destState.state = 'player-in-hole';
		    --this.boulderSolvedCount;
		}
	    } else {
		if(destState.state == 'space') {
		    destState.state = 'player';
		} else /*if(destState == 'hole')*/ {
		    destState.state = 'player-in-hole';
		}
	    }
	    
	    // Change the start square's state
	    if(startState.state == 'player') {
		startState.state = 'space';
	    } else /*if(startState == 'player-in-hole')*/ {
		startState.state = 'hole';
	    }
	    
	    // Push the move onto the history list
	    this.moveHistory.push(new Array(dx, dy, pushed));
	    // Update the player position
	    x += dx;
	    y += dy;
	    // Transfer ownership of the divs
	    if(pushed) {
		beyondDestState.div = destState.div;
		beyondDestState.div.className = 'boulder';
	    }
	    destState.div = startState.div;
	    startState.div = null;
	    this.slideDivs(dx, dy, destState.div, pushed? beyondDestState.div : null, beyondDestState.state);
	    // Hide arrows while moving
	    for(i = 0; i < 4; ++i)
		gArrowButtons[i].style.display = "none";
	}
    }
}

var gSlideDivsState;
function Sokoban_slideDivs(inDx, inDy, inDiv1, inDiv2, inDiv2EndState) {
    gIgnoreKeyDown = true;
    gSlideDivsState = new Object();
    with(gSlideDivsState) {
	dx = inDx;
	dy = inDy;
	div1 = inDiv1;
	div2 = inDiv2;
	div2EndState = inDiv2EndState;
	step = 0;
	interval = setInterval(Sokoban_doSlide, 9);
    }
}

function Sokoban_doSlide() {
    with(gSlideDivsState) {
	if(dx) {
	    div1.style.left = (parseInt(div1.style.left, 10) + dx) + "px";
	    if(div2) div2.style.left = (parseInt(div2.style.left, 10) + dx) + "px";
	}
	
	if(dy) {
	    div1.style.top = (parseInt(div1.style.top, 10) + dy) + "px";
	    if(div2) div2.style.top = (parseInt(div2.style.top, 10) + dy) + "px";
	}
	++step;
	if(step >= 12) {
	    gIgnoreKeyDown = false;
	    if(div2) div2.className = div2EndState;
	    if(gSokobanObject.boulderSolvedCount == gSokobanObject.boulderCount)
		gSokobanObject.win();
	    clearInterval(interval);

	    gSokobanObject.updateStatus();
	}
    }
}

function Sokoban_undo() {
    if(this.moveHistory.length > 0) {
	var lastMove = this.moveHistory.pop();
	var dx = lastMove[0], dy = lastMove[1], pushed = lastMove[2];
	var pushState, destState, startState;
	
	with(this.playerPosition) {
	    pushState = this.playfieldState[y+dy][x+dx];
	    destState = this.playfieldState[y][x];
	    startState = this.playfieldState[y-dy][x-dx];
	    // Move the player state back
	    if(startState.state == 'space')
		startState.state = 'player';
	    else /*if(playfieldState[y-dy][x-dx] == 'hole')*/
		startState.state = 'player-in-hole';
	    startState.div = destState.div;
	    destState.div = null;
	    with(startState.div.style) {
		left = (parseInt(left, 10) - 12*dx) + "px";
		top  = (parseInt(top,  10) - 12*dy) + "px";
	    }

	    // Did we push?
	    if(pushed) {
		// Move the boulder back
		if(destState.state == 'player')
		    destState.state = 'boulder';
		else /*if(this.playfieldState[y][x] == 'player-in-hole')*/ {
		    destState.state = 'boulder-in-hole';
		    ++this.boulderSolvedCount;
		}
		if(pushState.state == 'boulder')
		    pushState.state = 'space';
		else /*if(this.playfieldState[y][x] == 'boulder-in-hole')*/ {
		    pushState.state = 'hole';
		    --this.boulderSolvedCount;
		}
		destState.div = pushState.div;
		pushState.div = null;
		with(destState.div) {
		    style.left = (parseInt(style.left, 10) - 12*dx) + "px";
		    style.top  = (parseInt(style.top,  10) - 12*dy) + "px";
		    className  = destState.state;
		}
	    } else {
		// Clear the old player state
		if(destState.state == 'player')
		    destState.state = 'space';
		else /*if(this.playfieldState[y][x] == 'player-in-hole')*/
		    destState.state = 'hole';
	    }
	    
	    x -= dx;
	    y -= dy;
	}
	this.updateStatus();
    }
}