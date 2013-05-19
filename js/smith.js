"use strict";
/*
TODO: require jquery, enums,  lodash
popup modal dialog when game starts to choose bonus theme and level
*/

var ALL_TILES_TILE_BANK = 90;
var MAX_DISPLAYED_TILES_TILE_BANK = 12;

var INTERVAL_SEC_ADD_TILE = 4;
var INTERVAL_SEC_REMOVE_TILE = 10;

var SHOW_TRAY_SCORE_SECONDS = 3;
var TRAY_FADE_OUT_SEC = 2;

var INCORRECT_WORD_PENALTY = -40;

var MAX_ROTATION_DEGREES = 20;

//how many points is each letter worth
var LETTER_POINT_MAP = {
    'a':1, 'b':3, 'c':3, 'd':3, 'e':1, 'f':3, 'g':4, 'h':3, 'i':1
  , 'j':8, 'k':6, 'l':3, 'm':3, 'n':3, 'o':1, 'p':3, 'q':10, 'r':3
  , 's':3, 't':3, 'u':3, 'v':4, 'w':4, 'x':10, 'y':4, 'z':10
};
//how many titles of each letter can appear in a game
var LETTER_OCCURRENCE_MAP = {
    'a':8, 'b':2, 'c':2, 'd':4, 'e':11, 'f':2, 'g':3, 'h':2, 'i':8, 'j':1
  , 'k':1, 'l':3, 'm':2, 'n':6, 'o':4, 'p':2, 'q':1, 'r':6, 's':4
  , 't':6, 'u':4, 'v':2, 'w':2, 'x':1, 'y':2, 'z':1
};
var DICTIONARY_FILE_PATH = "/res/TWL06.txt";
var TILE_WIDTH = 56;

var TILES;
var LEVELS;
var level;
var numBlanks;

var THEMES;
var theme;
var THEME_BONUS_WORDS_MAP;
var trays = [];
var totalScore = 0;
var dictionary;

var dragSourceELementId;

var counterRemove;
var countRemove;

var counterAdd;
var countAdd;
var BONUSES = [0, 0, 100, 200, 300, 400];

function tileArrayToString(tileArray) {
	var output, tile;
	for( tile in tileArray) {
		output += tileArray[tile].toString();
	}
	return output;
}

function indexOfTile(tileArray, tile) {
	var foundIdx, tileIter;
	foundIdx = -1;
	for( tileIter in tileArray) {
		if( tileArray[tileIter].equals(tile) ) {
			foundIdx = tileIter;
		}
	}
	return foundIdx;
}

/*
tileArray2 is a subset of tileArray1
see http://stackoverflow.com/a/12093361 which also remove duplicates in the original array
arr_diff(['a', 'a', 'b'], ['a']) should return ['a', 'b'], not ['b']
TODO:use a generalized function for array diff of object array
*/

function tileDiff(tileArray1, tileArray2) {
	var diffArray, foundIdx, i;
	diffArray = tileArray1.slice(0);
	foundIdx = -1;
	for (i in tileArray2) {
		foundIdx = indexOfTile(tileArray1, tileArray2[i]);
		if( foundIdx >= 0 ) {
    		diffArray.splice(foundIdx, 1);
		}
	}
	return diffArray;
}

/*** begin Tile class ***/
function Tile (letter) {	
	this.letter = letter;
	this.pointValue = LETTER_POINT_MAP[letter];
}

Tile.prototype.toString = function() {
	return this.letter.toUpperCase();
};

Tile.prototype.equals = function(that) {
	if( this.letter === that.letter ) {
		return true;
	}
};

Tile.prototype.toDOM = function() {
	return '<img id="' + this.letter + '" class="tile" src="res/images/tiles/' + this.letter.toUpperCase() + '.png">';
};

// "static/class method"
Tile.fromDOM = function(tileSelector) {
	return new Tile(tileSelector.attr('id'));
};

Tile.rotateRandom = function(tileSelector) {
	// set the min degree rotation at -10 and the max at +10
	var randomAngle;
	randomAngle = Math.floor( Math.random()*MAX_ROTATION_DEGREES - (MAX_ROTATION_DEGREES/2) );
	Tile.rotate(tileSelector, randomAngle);
};

Tile.straighten = function(tileSelector) {
	Tile.rotate(tileSelector, 0);
};

Tile.rotate = function(tileSelector, angle) {	
	var rotationCssPropertyValue = 'rotate(' + angle + 'deg)';
	tileSelector.css('-webkit-transform', rotationCssPropertyValue);
};
/*** end Tile class ***/

/*** begin TileBank class ***/
//TODO decouple from DOM by creating a subclass TileBankDOM?
function TileBank (idDOM) {
	this.tileArray = [];
	this.idDOM = idDOM;	
	this.randomTileNums = [];
}

TileBank.prototype.addTile = function(tile) {
	this.tileArray.push(tile);
	return this;
};

/*
TileBank.prototype.addTileDOM = function(tile) {
	this.tileArray.push(tile);
	return this;
};
*/

//TODO move to TileBankDOM subclass
TileBank.prototype.addTileDOM = function(tile) {
	var letter, htmlTile;
	letter = tile.letter;
	htmlTile ='<li>' + tile.toDOM() + '</li>';
	$( this.idDOM ).append(htmlTile);
	Tile.rotateRandom( $( this.idDOM + ' img.tile' ).last() );
	return this;
};

TileBank.prototype.removeTile = function(tile) {
	console.debug('removing tile ' + tile + ' from tileBank');
	this.tileArray.splice(this.tileArray.indexOf(tile), 1);
	console.log('tileBank contains ' + this.tileArray.length + ' tiles');
	$( '#remaining-tiles' ).html(this.tileArray.length + ' remaining tile bank tiles');
	return this;
};

/*
TODO: remove
TileBank.prototype.getTile = function(tileDOM) {
	var letter = tileDOM.attr('id');
	for( var i in this.tileArray ) {
		var tile = this.tileArray[i];
		if( tile.letter == letter ) {
			return tile;
		}
	}
};
*/

//TODO decouple from DOM
TileBank.prototype.seedRandomDOM = function() {
	var i, randomNum, tileArray;
	i = 0;
	while( i < MAX_DISPLAYED_TILES_TILE_BANK ) {
		randomNum = Math.floor( Math.random() * ALL_TILES_TILE_BANK );
		this.randomTileNums.push(randomNum);
		i++;
	}
	tileArray = this.tileArray;
	for( i=0; i<this.randomTileNums.length; i++ ) {
		this.addTileDOM(tileArray[this.randomTileNums[i]]);
		//remove the tile from the tileArray?
	}
	$( '#remaining-tiles' ).html(this.tileArray.length + ' remaining tile bank tiles');
	return this;
};

/* make visible a random tile from the tileArray to the DOM that's not already displayed in the DOM */
//TODO decouple from DOM
TileBank.prototype.showRandomTile = function() {
	// create a temp array holding the elements in tileArray not already displayed in the DOM
	// randomly pick one of those elements to add to the DOM
	var shownTiles, hiddenTiles, randomHiddenTileIndex, newTile;
	shownTiles = [];
	$( this.idDOM + ' li:visible' ).each ( function() {
		shownTiles.push( new Tile( $( this ).find('img').attr('id') ) );
	});
	console.debug( 'shownTiles: ' + shownTiles.join('') );
	hiddenTiles = tileDiff(this.tileArray, shownTiles);
	console.debug( 'hiddenTiles ' + hiddenTiles.length + ' items: ' + hiddenTiles.join('') );
	randomHiddenTileIndex = Math.floor((Math.random()*hiddenTiles.length));
	newTile = hiddenTiles[randomHiddenTileIndex];
	this.addTileDOM(newTile);
	console.log( 'displayed tile ' + newTile);
	$( '#sound-new-tile' )[0].play();
	return this;
};

/* seed the tileBank with the number of tiles per letter
*  in the letterOccurenceMap
*/
TileBank.prototype.seed = function() {
	var letter, count, i;
	for( letter in LETTER_OCCURRENCE_MAP ) {
		count = LETTER_OCCURRENCE_MAP[letter];
		for( i=0; i<count; i++ ) {
			this.addTile(new Tile(letter));
		}
	}
	return this;
};

TileBank.prototype.clear = function() {
	this.tileArray = null;
	return this;
};

TileBank.prototype.hideRandomTile = function() {
	var selectorVisibleTiles, numVisibleTileBankTiles, randomTileIndex, selectorRandomTile, randomTile, tilePosition;
	//get the number of visible tile bank tiles
	selectorVisibleTiles = this.idDOM + ' li:visible';
	numVisibleTileBankTiles = $(selectorVisibleTiles).size();
	console.debug('there are ' + numVisibleTileBankTiles + ' visible tile bank tiles');
	//hide one of those tiles at random
	randomTileIndex = Math.floor(Math.random() * numVisibleTileBankTiles);
	selectorRandomTile = selectorVisibleTiles + ':eq(' + randomTileIndex +')';
	randomTile = this.tileArray[randomTileIndex];
	console.debug('hiding visible tile ' + randomTile + ' at position ' + randomTileIndex);
	$( selectorRandomTile ).addClass('flipped-horizontal-right');
	/*
	tilePosition = $( selectorRandomTile ).position();
	$( selectorRandomTile ).positionAbsolute();
	$( selectorRandomTile ).animate({'top': tilePosition.top - 30}, TRAY_FADE_OUT_SEC * 1000 );
	$( selectorRandomTile ).fadeOut(TRAY_FADE_OUT_SEC * 1000);
	setTimeout( function() {
		TileBank.removeTileDelayed( tileBank, randomTile, selectorRandomTile);
	}, TRAY_FADE_OUT_SEC * 5 * 1000 );
	*/
	numVisibleTileBankTiles = $(selectorVisibleTiles).size();
	console.debug('now there are ' + numVisibleTileBankTiles + ' visible tile bank tiles');
	$( '#sound-tile-gone' )[0].play();
	return this;
};

TileBank.removeTileDelayed = function(tileBank, tile, tileSelector) {
		tileBank.removeTile(tile);
		$( tileSelector ).hide();
};

/*** end TileBank class ***/

/*** begin Tray class ***/
function Tray () {
	this.oldWord = '';
	this.tileArray = [];
	this.score = 0;
	this.isValidWord = false;
	this.isBonusWord = false;
	this.isActive = false;
	return this;
}

Tray.prototype.isFull = function() {
	return this.tileArray.length === numBlanks;
};

Tray.prototype.setWord = function(word) {
	var letterArray, i;
	letterArray = word.split('');
	this.clear();
	for( i in letterArray ) {
		this.addTile( i, new Tile(letterArray[i]) );
	}
};

Tray.prototype.toString = function() {
	return this.tileArray.join('');
};

Tray.prototype.getTileCount = function() {
	return this.tileArray === null ? 0 : this.tileArray.length;
};

Tray.prototype.addTile = function(position, tile) {
	this.tileArray.splice(position, 0, tile);
	return this;
};

Tray.prototype.addTileDOM = function(position, tile) {
	//TODO
	return this;
};

Tray.prototype.removeTile = function(tile) {
	this.tileArray.splice(this.tileArray.indexOf(tile), 1);
	return this;
};

Tray.prototype.clear = function() {
	this.tileArray = [];
	this.isValidWord = false;
	this.score = 0;
	return this;
};

Tray.prototype.setScore = function() {
	var wordLength, tile;

	this.score = 0;
	wordLength = 0;
	this.setValidWord();
	if( this.isValidWord ) {
		for(tile in this.tileArray) {
			this.score += this.tileArray[tile].pointValue;
			wordLength++;
		}
		this.score *= wordLength;
		this.setBonusWord();
		if( this.isBonusWord ) {
			this.score += BONUSES[wordLength];
		}
	}
	return this;
};

Tray.prototype.getScore = function() {
	return this.score;
};

Tray.prototype.setValidWord = function() {
	var entry;
	for (entry in dictionary) {
	    if (dictionary[entry] === this.getWord().toUpperCase()) {
	        this.isValidWord = true;
	        break;
	    }
	}
	return this;
};

Tray.prototype.log = function() {
	var logText, trayIdx;
	logText = '';
	trayIdx = this.getTrayIndex();
	logText += 'tray ' + trayIdx + ': ';
	logText += this.getWord();
	if( this.isValidWord ) {
		logText += ' is a valid word.';
	}
	else {
		logText += " isn't a valid word.";
	}
	logText += ' score: ' + this.score;
	console.info(logText);
	//traySpan.text(traySpanText);
	return;
};

Tray.prototype.getTrayIndex = function() {
	var trayIdx, tray;
	trayIdx = -1;
	for( tray in trays ) {
		trayIdx++;
		if( trays[tray] === this ) {
			return trayIdx;
		}
	}
	return trayIdx;
};

/*
Tray.prototype.isValidWord = function() {
	return this.isValidWord;
};
*/

Tray.prototype.getWord = function() {
	var letterArray, tile_it;
	letterArray = [];
	for( tile_it in this.tileArray ) {
		letterArray[tile_it] = this.tileArray[tile_it].letter;
	}
	return letterArray.join('');
};

Tray.prototype.getWordAsArray = function() {
	var letterArray, tile_it;
	letterArray = [];
	for( tile_it in this.tileArray ) {
		letterArray[tile_it] = this.tileArray[tile_it].letter;
	}
	return letterArray;
};

/*
look up the word formed by the tray contents in bonus words
*/
Tray.prototype.setBonusWord = function() {
	this.isBonusWord = false;
	return this;
};

// rebuild a tray based on the tiles it contains
Tray.fromDOM = function(traySelector) {
	var letter, tray, trayIdx, i;

	trayIdx = $(traySelector).closest( 'li' ).index();
	tray = trays[trayIdx];
	tray.clear();
	i=0;
	$(traySelector).find('li').each( function() {
		letter = $(this).find('img').attr('id');
		tray.addTile(i, new Tile(letter));
		i++;
	});
	return tray;
};

Tray.handleEmpty = function(tray, isUpdateScore) {
	var emptyButtonSelector, trayIndex, traySelector, tileSelector, scoreSelector, tilePosition;
	trayIndex = tray.getTrayIndex();
	emptyButtonSelector = '.empty-tray:eq(' + trayIndex + ')';
	/*	if( $( emptyButtonSelector ).hasClass('disabled') ) {
		return;
	}*/
	$( emptyButtonSelector ).attr('disabled', 'disabled');
	trayIndex = $('.empty-tray').index(emptyButtonSelector);
	tray = trays[trayIndex];
	traySelector = 'ul.tray:eq(' + trayIndex + ')';
	tileSelector = traySelector + " li";
	if( isUpdateScore ) {
		scoreSelector = '.trays .score:eq(' + trayIndex + ')';
		tray.setScore();
		Tray.showScore(tray, scoreSelector, tray.getScore());
	}
	tilePosition = $(tileSelector).position();
	$( tileSelector ).each( function() {
		$( this ).positionAbsolute();
	});
	$( tileSelector ).animate({'top': tilePosition.top - 30}, SHOW_TRAY_SCORE_SECONDS * 1000 );
	$( tileSelector ).fadeOut(TRAY_FADE_OUT_SEC * 1000);
	setTimeout( function() {
		$( traySelector ).empty();
	}, TRAY_FADE_OUT_SEC * 1 * 1000 );
	tray.clear();
	$(traySelector)
		.sortable('disable')
		.removeClass('active');
	tray.log();
	$( '#sound-trash-tray' )[0].play();
	return;
};

/* TODO: pauseButtonSelector and traySelector can be removed as parameters and derived within this function */
Tray.handlePause = function(pauseButtonSelector, trayIndex, traySelector, icon) {
	var tray, i;
	//flip button to play button
	$( pauseButtonSelector ).removeClass('btn-danger').addClass('btn-success');
	icon.removeClass('icon-pause').addClass('icon-play');
	console.debug( 'enabling tray ' + trayIndex + ' for forming words');
	$(traySelector)
		.sortable('enable')
		.addClass('active');
	tray = trays[trayIndex];

	//save the oldWord so that we can restore it later if necessary
	tray.oldWord = tray.getWord();

	//disable other pause buttons
	i = 0;
	$( 'button.pause-play-tray' ).each( function() {
		if( !(i === trayIndex) ) {
			$( this ).addClass('disabled');
		}
		i++;
	});
	clearTimeout(counterRemove);
	clearTimeout(counterAdd);
	return;
};

Tray.getActiveTray = function() {
	var activeTray;
	$('ul.tray').each( function() {
		if( $(this).hasClass('active') ) {
			activeTray = $(this);
			return activeTray;
		}
	});
	return activeTray;
};

Tray.restoreTile = function(traySelector, tileSelector) {
	var tray, tile;
	tray = Tray.fromDOM(traySelector);
	tray.removeTile( tile );
	$( 'tile-bank' ).append( $( tileSelector ) );
	$( traySelector ).remove(tileSelector);
};

Tray.restoreWord = function(tray, traySelector) {
	var oldWord, currentWord, currentLetters, letterIdx, tileSelector;
	oldWord = tray.oldWord;
	currentLetters = tray.getWordAsArray();
	if( oldWord === currentWord ) {
		return;
	}
	for( letterIdx in currentLetters ) {
		if( !oldWord.indexOf(currentLetters[letterIdx]) ) {
			tileSelector = traySelector + ' li:eq('  + letterIdx + ')';
			Tray.restoreTile(traySelector, tileSelector);
		}
	}
	tray.setWord(oldWord);
};

Tray.handlePlay = function(playButtonSelector, trayIndex, traySelector, icon) {
	var tray, scoreSelector, emptyTrayButtonSelector, newTileSelector;
	tray = Tray.fromDOM(traySelector);
	tray.setScore();
	scoreSelector = '.trays .score:eq(' + trayIndex + ')';
	emptyTrayButtonSelector = '.empty-tray:eq(' + trayIndex + ')';
	$( emptyTrayButtonSelector ).removeAttr('disabled');
	if( tray.isValidWord ) {
		$( '#sound-valid-word' )[0].play();
		Tray.showScore(tray, scoreSelector);
		if( tray.isFull() ) {
			Tray.handleEmpty(tray, false);
		}
	}
	else {
		Tray.restoreWord(tray, traySelector);
		Tray.showScore(tray, scoreSelector, INCORRECT_WORD_PENALTY);
		tray.log();
	}
	//flip button to pause button
	$( playButtonSelector ).removeClass('btn-success').addClass('btn-danger');
	icon.removeClass('icon-play').addClass('icon-pause');
	console.log( 'disabling tray ' + trayIndex + ' for forming words');
	//flip flag on all new letters
	newTileSelector = traySelector  + ' li.new';
	$(newTileSelector).removeClass('new');
	$(traySelector)
		.sortable('disable')
		.removeClass('active');
	tray.log();
	// enable all pause buttons
	$( 'button.pause-play-tray' ).each( function() {
		$( this ).removeClass('disabled');
	});
	startRemoveTileTimer();
	startAddTileTimer();
	return;
};

Tray.showScore = function(tray, scoreSelector, previousScore) {
	var trayText, totalScorePosition, trayScore;

	trayScore = tray.getScore();
	if( previousScore === undefined) {
		trayText = '+' + trayScore;
	}
	else {
		trayText = '-' + previousScore;
	}

	if( tray.isBonusWord ) {
		//trayText = '<br/>Bonus! +' + tray.getBonus();
	}
	$( scoreSelector ).html(trayText);
	$( scoreSelector ).show();
	$( scoreSelector ).positionAbsolute();
	totalScorePosition = $( '#total-score' ).position();
	$( scoreSelector ).finish();
	$( scoreSelector ).animate({'left': totalScorePosition.left, 'top': totalScorePosition.top}, SHOW_TRAY_SCORE_SECONDS * 1000 );
	setTimeout( function() {
		$( scoreSelector ).hide();
		previousScore === undefined ? totalScore += trayScore :  totalScore -= trayScore;
		$('#total-score').text(totalScore);
	}, SHOW_TRAY_SCORE_SECONDS * 1000 );
};
/*** end Tray class ***/

/* position an DOM element absolute and preserve its original position */
jQuery.fn.positionAbsolute = function() {
	var elementPosition;
	elementPosition = $( this ).position();
	$( this ).css('position', 'absolute');
	$( this ).css( 'left', elementPosition.left );
	$( this ).css( 'top', elementPosition.top );
	return this;
};

/*
TODO:
split into two methods to allow setting the word in a tray programmatically for testing
recalculate word properly when reordering tiles within tray
*/
function handleTileStop (event, ui) {
	var listItem, tileDragged, trayDOM, trayDestination, trayIdx, tileSelector;
	listItem = ui instanceof HTMLElement ? ui : ui.item;
	//distinguish new letters	
	$( listItem ).addClass('new');
	tileSelector = $( listItem ).find( 'img' );
	tileDragged = Tile.fromDOM(tileSelector);
	Tile.straighten(tileSelector);
	trayDOM = $( listItem ).closest( 'ul' );	
	trayIdx = trayDOM.closest( 'li' ).index();
	if( trayIdx < 0 ) {
		console.debug( 'tile ' + tileDragged + ' was not dropped onto a tray.' );
	}
	else {
		console.debug( 'tile ' + tileDragged + ' was dropped onto tray ' + trayIdx );
		if( event.target.id === "tile-bank" ) {
			tileBank.removeTile(tileDragged);
		}
		/*$( '#sound-new-tile' )[0].play();*/
	}
	return;
}

function handleTileReceive(event, ui) {
    //disallow sorting within tile-bank as a destination
    //disallow drag from one tray to another
    //disallow other drags
    //(ui.sender.attr('id') == 'tile-bank' && ui.item[0].parentNode == this) ||
    if( ui.sender.hasClass('tray') && ui.sender.context != event.target ) {
        $(ui.sender).sortable('cancel');
    }
}

function handleTileChange(event, ui) {
    //disallow sorting with tile-bank
    if( ui.item[0].parentNode.id === 'tile-bank' && event.target.id === 'tile-bank') {
    	// why is this line throwing an error: "Uncaught TypeError: Cannot read property '0' of null"
        //$(this).sortable('cancel');
    }
}

function straightenTile (event, ui) {
	Tile.straighten( $( ui.target ).find( 'img' ) );
	ui.placeholder.html('&nbsp;'); /* prevents wobble when sorting tiles */
	return;
}

function startRemoveTileTimer() {
	counterRemove=setInterval(removeTileTimer, 1000); //1000 will  run it every 1 second
	return;
}

function clearRemoveTileTimer () {
	countRemove=INTERVAL_SEC_REMOVE_TILE;
	return;
}
         
function removeTileTimer () {
	if (countRemove <= 0) {
		clearInterval(counterRemove);
		tileBank.hideRandomTile();
		clearRemoveTileTimer();
		startRemoveTileTimer();
	}
	$('#remove-tile-timer').html(countRemove + ' secs till next tile removed');
	countRemove--;
	return;
}

function startAddTileTimer() {
	counterAdd=setInterval(addTileTimer, 1000); //1000 will  run it every 1 second
	return;
}

function clearAddTileTimer() {
	countAdd=INTERVAL_SEC_ADD_TILE;
	return;
}
         
function addTileTimer() {
	var tileBankCurrentDisplayedTiles;
	if( countAdd <= 0 ) {
		clearInterval(counterAdd);
		tileBankCurrentDisplayedTiles = $( tileBank.idDOM + ' li:visible' ).size();
		if (tileBankCurrentDisplayedTiles < MAX_DISPLAYED_TILES_TILE_BANK) {
			tileBank.showRandomTile();
		}
		else {
			console.log( 'max tiles ' + MAX_DISPLAYED_TILES_TILE_BANK + ' already displayed; not adding a tile.');
		}
		clearAddTileTimer();
		startAddTileTimer();
	}
	$('#add-tile-timer').html(countAdd + ' secs till next tile added');
	countAdd--;
	return;
}

LEVELS = new enums.Enum({
	'easy': {numBlanks: 6, numTrays: 5},
	'medium': {numBlanks: 7, numTrays: 5},
	'difficult': {numBlanks: 8, numTrays: 5}
});
level = LEVELS.easy;

THEMES = new enums.Enum({
	'silversmith': {wordList: ['sheetmetal', 'hollowware', 'jewellery']},
	'locksmith': {wordList: ['key', 'padlock', 'groove']}
});
theme = THEMES.land;

// initialize dictionary
$.get(DICTIONARY_FILE_PATH, function(dictionaryRawText) {
	dictionary = dictionaryRawText.split('\r\n');
});

// initialize tileBank
var tileBank = new TileBank('#tile-bank');
tileBank.seed();

// initialize trays
var i;
for( i=0; i<level.numTrays; i++ ) {
	trays.push(new Tray());
}