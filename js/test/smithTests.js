test( "Tile and points test", function() {
  var tileA = new Tile('a');
  var tileB = new Tile('b');
  ok(tileA.pointValue == 1 && tileB.pointValue == 3, "Passed!");
});

test( "TileBank.addTile() test", function() {
  var tileBank = new TileBank();
  var tileA = new Tile('a');
  var tileB = new Tile('b');
  tileBank.addTile(tileA);
  tileBank.addTile(tileB);
  ok(tileBank.tileArray.length == 2, "Passed!");
});

test( "TileBank.removeTile() test 1", function() {
	var tileBank = new TileBank();
	var tileA = new Tile('a');
	var tileB_1 = new Tile('b');
	var tileB_2 = new Tile('b');
	tileBank.addTile(tileA);
	tileBank.addTile(tileB_1);
	tileBank.addTile(tileB_2);
	tileBank.removeTile(tileB_1);
	ok(tileBank.tileArray.length == 2, "Passed!");
});

test( "TileBank.removeTile() test 2", function() {
	var tileBank = new TileBank();
	tileBank.seed();
	tileBank.removeTile(new Tile('m'));
	ok(tileBank.tileArray.length == 89, "Passed!");
});

test( "TileBank.seed() tile count all test", function() {
  var tileBank = new TileBank();
  tileBank.seed();
  ok(tileBank.tileArray.length == 90, "Passed!");
});

/*
Array.prototype.keyCount = function(key) {
	var keyCount = 0;
	for( var keyIterator in this ) {
		if( this[keyIterator] == key ) {
			keyCount++;
		}
	}
	return keyCount;
};


test( "TileBank.seed() tile count letter test", function() {
	var tileBank = new TileBank();
	tileBank.seed();
	var tileArray = tileBank.tileArray;  

	var tileCount = {};
	for(var i = 0; i< tileArray.length; i++) {
	    var tile = tileArray[i];
	    tileCount[tile] = tileCount[tile] ? tileCount[tile]+1 : 1;
	}

	var tileA = new Tile('a');
	var tileM = new Tile('m');
	var tileZ = new Tile('z');

	//var tileACount = tileArray.keyCount(tileA);
	//var tileACount = tileCount[tileM];
	var tileACount = 7;
	console.debug(tileACount);
	ok(7 == 8, "Passed!");
});
*/

test( "Tray.addTile() test", function() {
  var tray = new Tray();
  tray.addTile(0, new Tile('a'));
  ok(tray.getTileCount() == 1, "Passed!");
});

test( "Tray.removeTile() test", function() {
  var tray = new Tray();
  tray
  	.addTile(0, new Tile('a'))
  	.removeTile(new Tile('a'));
  ok(tray.getTileCount() == 0, "Passed!");
});

test( "Tray.clear() test", function() {
  var tray = new Tray();
  tray
  	.addTile(0, new Tile('a'))
  	.addTile(1, new Tile('b'))
  	.clear();
  ok(tray.getTileCount() == 0, "Passed!");
});

test( "Tray scoring test invalid word", function() {
  var tray = new Tray();
  tray
  	.addTile(0, new Tile('a'))
  	.addTile(1, new Tile('c'));
  tray.setScore();
  ok(tray.getScore() == 0, "Passed!");
});

test( "Tray scoring test valid word", function() {
  var tray = new Tray();
  tray
  	.addTile(0, new Tile('c'))
  	.addTile(1, new Tile('a'))
  	.addTile(2, new Tile('b'));
  tray.setScore();
  ok(tray.getScore() == 21, "Passed!");
});

function arraysEqual(a,b) {
	return !(a<b || b<a);
}

test( "test tileDiff function", function() {
  var tileArray1 = [new Tile('a'), new Tile('a'), new Tile('b'), new Tile('c')];
  var tileArray2 = [new Tile('c'), new Tile('a')];
  var diffArray = tileDiff(tileArray1, tileArray2);
  //var diffArray = tileArray1.diff(tileArray2);
  console.debug(tileArrayToString(tileArray1));
  console.debug(tileArrayToString(tileArray2));
  console.debug(tileArrayToString(diffArray));
  ok(arraysEqual(diffArray, [new Tile('a'), new Tile('b')]), "Passed!");
});
