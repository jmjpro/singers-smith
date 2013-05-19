$(function() {
    setTimeout( function() {
        $( '#smithalert' ).hide();
    }, 10000 );
    $( '#show-alert' ).click( function() {
        $( '#smithalert' ).show();
    });
	$.mobile.loading( 'show', { theme: "b", text: "", textonly: false});
	/*
	for( var i in LEVELS.symbols() ) {
		var levelIter = LEVELS.symbols()[i];
    	var levelName = levelIter.name;
    	$( 'select#level' )
          .append($('<option>', { levelName : levelName })
          .text(levelName));
    }
	for( var i in THEMES.symbols() ) {
    	var themeName = THEMES.symbols()[i].name;
    	$( 'select#theme' )
          .append($('<option>', { themeName : 'theme.' + themeName })
          .text(themeName));
    }
    */	

	$( '#modal-level-and-theme' ).modal( 'show' );

	var levelName;
	var themeName;
	var trayWidth;

	$( '.modal-footer > #ok' ).click( function() {
		level = $('button[name="level"].active').val();
		//TODO make this more dynamic
		switch( level) {
			case 'easy': numBlanks = LEVELS.easy.numBlanks; break;
			case 'medium': numBlanks = LEVELS.medium.numBlanks; break;
			case 'difficult': numBlanks = LEVELS.difficult.numBlanks; break;
			default: numBlanks = LEVELS.easy.numBlanks;;
		}
		trayWidth = TILE_WIDTH * numBlanks;
		$( 'ul.tray' ).css('width', trayWidth + 'px');
		$( '#lod' ).html( "Difficulty level: " + level );
		theme = $('button[name="theme"].active').val();
		$( '#theme' ).html( "Theme: " + theme );

		clearRemoveTileTimer();
		startRemoveTileTimer();

		clearAddTileTimer();
		startAddTileTimer();
	});
	
	console.debug( 'tileBank: ' + tileBank.tileArray.join('') );
	tileBank.seedRandomDOM();

	//trays[2].setWord('key');

	//initialize trays and blanks
	var htmlTrays = '';
	var htmlTiles = '';
	for( var i=0; i<trays.length; i++ ) {
		var trayId = 'tray_' + i;
		htmlTrays +=
    	'<li> \
	        <div class="button-group"> \
	            <input type="image" disabled class="empty-tray" src="res/images/trash-empty-icon.png" width="48" height="48"/> \
	            <button class="btn btn-large pause-play-tray btn-danger"><i class="icon-pause"></i></button> \
	        </div> \
	        <img class="traycap" src="res/images/tray-leftcap.png"/> \
	        <ul class="tray"> \
	        </ul> \
	        <img class="traycap" src="res/images/tray-rightcap.png"/> \
	        <div class="score"> \
    	    </div> \
	    </li>'
	}
	$( 'ul.trays' ).html(htmlTrays);

	$( '#tile-bank, .tray' ).sortable({
	    connectWith: '.tray',
	    cursor: 'move',
	    /*start: straightenTile,*/
	    //change: handleTileChange,
	    //receive: handleTileReceive,
	    stop: handleTileStop,
	    revert: true,
	}).disableSelection();

	$( '.tray' ).sortable('disable');

	$( '#tile-bank > li' ).on( 'dblclick taphold', function(event, ui) {
		var activeTray = Tray.getActiveTray();
		if( activeTray ) {
			//Tile.straighten( $(this).find('img') );
			$( activeTray ).append( this );
			handleTileStop(event, this);
		}
	});

	$( '#tile-bank > li' ).on( 'click', function(event, ui) {
		console.debug('clicked on ' + $(this).children('img').attr('id'));
	});

	$( '.empty-tray' ).click( function() {
		var tray, trayIndex, traySelector;
		trayIndex = $( '.empty-tray' ).index(this);
		traySelector = $( 'ul.tray:eq(' + trayIndex + ')' );
		tray = Tray.fromDOM( traySelector );
		Tray.handleEmpty( tray, true );
	});

	$( 'button.pause-play-tray' ).click( function togglePausePlay() {
		if( $( this ).hasClass('disabled') ) {
			return;
		}
		var trayIndex = $( 'button.pause-play-tray' ).index(this);
		var traySelector = 'ul.tray:eq(' + trayIndex + ')';
		var icon = $(this).find('i');
		if( icon.hasClass('icon-pause') ) { //pressed pause
			Tray.handlePause( this, trayIndex, traySelector, icon );
		}
		else { //pressed play
			//flip button to pause button
			Tray.handlePlay( this, trayIndex, traySelector, icon );
		}
		return;
	} );
});
