"use strict";

BasicGame.Preloader = function (game) {

	this.background = null;
	this.progressBar = null;

	this.ready = false;

};

BasicGame.Preloader.prototype = {

	preload: function () {
		
		//	These are the assets we loaded in Boot.js
		this.background = this.add.sprite(0, 0, 'preloadBackground');
		this.progressBar = this.add.sprite(this.game.world.centerX, 500, 'progressBar');
		this.progressBar.anchor.setTo( 0.5, 0.5 );

		//	This sets the progessBar sprite as a loader sprite.
		//	What that does is automatically crop the sprite from 0 to full-width
		//	as the files below are loaded in.
		this.load.setPreloadSprite(this.progressBar);

		this.load.image('car', 'assets/car.png');
		this.load.image('finishLine', 'assets/finishLine.png');
        this.load.image('minimap', 'assets/map.png');
        this.load.tilemap('map', 'assets/305mapembedded.json', null, Phaser.Tilemap.TILED_JSON);
        //The spritesheet for the tilemap
		this.load.image('tiles', 'assets/305spritesheet.png');
	},

	create: function () {
		this.state.start('Game');
	}

};
