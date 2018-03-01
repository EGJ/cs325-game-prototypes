"use strict";

window.onload = function() {
    
    var game = new Phaser.Game( 800, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    
    function preload() {
        // Load an image and call it 'logo'.
        game.load.image( 'logo', 'assets/phaser.png' );

        game.load.tilemap('map', 'assets/Racetrack.json', null, Phaser.Tilemap.TILED_JSON);
        //The images for the tilemap
        /*game.load.image('Vertical', 'assets/Vertical.png');
        game.load.image('Horizontal', 'assets/Horizontal.png');
        game.load.image('CurveDR', 'assets/CurveDR.png');
        game.load.image('CurveDL', 'assets/CurveDL.png');
        game.load.image('CurveUL', 'assets/CurveUL.png');
        game.load.image('CurveUR', 'assets/CurveUR.png');
        */game.load.image('tiles', 'assets/RoadTiles.png')
    }
    
    var map;
    var layer1;
    var bouncy;
    
    function create() {
        map = game.add.tilemap('map');
        /*let layer = map.layer[0];
        let row = layer.data[0];
        map.addTilesetImage('tiles');*/
        /*map.addTilesetImage('Vertical');
        map.addTilesetImage('Horizontal');
        map.addTilesetImage('CurveDR');
        map.addTilesetImage('CurveDL');
        map.addTilesetImage('CurveUL');
        map.addTilesetImage('CurveUR');*/
//        layer1 = map.createLayer('Tile Layer 1');
//        layer1.resizeWorld();

        
        //game.scale.setGameSize(window.innerWidth , window.innerHeight );
        
        if(!game.device.desktop){
            //Center horizontally
            //game.scale.startFullScreen()
            game.scale.scaleMode = game.scale.fullScreenScaleMode;
            game.scale.pageAlignHorizontally = true;
    		game.scale.pageAlignVertically = true;
    		//game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            gyro.frequency = 1;
		    // start gyroscope detection
            gyro.startTracking(function(o) {
            // updating player velocity
            bouncy.body.velocity.x += o.gamma/20;
            bouncy.body.velocity.y += o.beta/20;
          });	
        }
        // Create a sprite at the center of the screen using the 'logo' image.
        bouncy = game.add.sprite( game.world.centerX, game.world.centerY, 'logo' );
        // Anchor the sprite at its center, as opposed to its top-left corner.
        // so it will be truly centered.
        bouncy.anchor.setTo( 0.5, 0.5 );
        
        // Turn on the arcade physics engine for this sprite.
        game.physics.enable( bouncy, Phaser.Physics.ARCADE );
        // Make it bounce off of the world bounds.
        bouncy.body.collideWorldBounds = true;
        //game.camera.follow(bouncy);
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        var text = game.add.text( game.world.centerX, 15, "Build something amazing.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function update() {
        if(game.device.desktop){
            
        }
        //game.scale.startFullScreen()
        //game.scale.fullscreen
        // Accelerate the 'logo' sprite towards the cursor,
        // accelerating at 500 pixels/second and moving no faster than 500 pixels/second
        // in X or Y.
        // This function returns the rotation angle that makes it visually match its
        // new trajectory.
        //bouncy.rotation = game.physics.arcade.accelerateToPointer( bouncy, game.input.activePointer, 500, 500, 500 );
    }
};




//Road segments (from http://brunnett-dharaelvis.blogspot.com/2013/09/collision-with-2d-sprite-objects-and.html)
//http://i.imgur.com/bNHYwZO.png
//http://i.imgur.com/ppPw7ED.png

//Sprites from images:
//https://instantsprite.com
