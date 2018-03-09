"use strict";

var BasicGame = {};

BasicGame.Boot = function (game) {

};

BasicGame.Boot.prototype = {

    init: function () {

        //  Unless you specifically know your game needs to support multi-touch I would recommend setting this to 1
        this.input.maxPointers = 1;

        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
        this.stage.disableVisibilityChange = true;

        if (this.game.device.desktop)
        {
            //  If you have any desktop specific settings, they can go in here
            this.scale.pageAlignHorizontally = true;
            window.alert("Note: This game is optimized for mobile use.")
        }
        else
        {
            //this.scale.scaleMode = game.scale.starf
            //this.scale.scaleMode = this.scale.fullScreenScaleMode;
            //  Same goes for mobile settings.
            //  In this case we're saying "scale the game, no lower than 480x260 and no higher than 1024x768"
            //this.scale.scaleMode = game.scale.startfu;
            /*this.scale.setMinMax(240, 240, 240, 240);
            this.scale.forceLandscape = true;
            this.scale.pageAlignHorizontally = true;*/
        }

    },

    preload: function () {

        //  Here we load the assets required for our Preloader state (in this case a background and a loading bar)
        this.load.image('preloadBackground', 'assets/preloadBackground.jpg');
        this.load.image('progressBar', 'assets/progressBar.png');

    },

    create: function () {

        //  By this point the preloader assets have loaded to the cache, we've set the game settings
        //  So now let's start the real preloader going
        this.state.start('Preloader');

    }

};
