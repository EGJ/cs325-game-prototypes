"use strict";

BasicGame.Preloader = function (game) {

};

BasicGame.Preloader.prototype = {

	preload: function () {
		this.load.spritesheet( 'robin', 'assets/robinSpritesheet.png', 240, 314, 22);
        this.load.image( 'smoke', 'assets/smoke.png' );
        this.load.image( 'chimney', 'assets/chimney.png' );
	},

	create: function () {
		this.state.start('Game');
	}

};
