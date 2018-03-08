"use strict";

window.onload = function() {
    
    var game = new Phaser.Game( 800, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    
    /** @type {Phaser.Tilemap} */
    var map;
    /** @type {Phaser.TilemapLayer} */
    var layer1;
    var mapBodies;
    /** @type {Phaser.Sprite} */
    var bouncy;
    /** @type {Phaser.CursorKeys} name */
    var cursors;
    var debugT;

    /** @type {boolean} */
    var gameReady = false;
    
    function create() {
        //Enable the physics system
        game.physics.startSystem(Phaser.Physics.P2JS);
        //Initialize the map
        map = game.add.tilemap('map');
        map.addTilesetImage('tiles');
        layer1 = map.createLayer('Tile Layer 1');
        layer1.resizeWorld();

            debugT = game.add.text(0,0,"text");
            debugT.fixedToCamera = true;
            debugT.cameraOffset.setTo(0, 200);
            debugT.fill = "#ffffff";

        //Allow collision checking for tiles 0-5
        map.setCollisionBetween(0, 5);
        //mapBodies = game.physics.p2.convertTilemap(map);//Does not use the polygons in the tilemap
        //This ONLY works if the STRING for the layer is passed in.
        //number, Phaser.TilemapLayer, or the default do no work, contrary to the specs.
        mapBodies = game.physics.p2.convertCollisionObjects(map, "Tile Layer 1");
        
        //game.scale.setGameSize(window.innerWidth , window.innerHeight );
        
        if(game.device.desktop){
            cursors = game.input.keyboard.createCursorKeys();

            //Begin the game once the player clicks space
            let spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            spaceBar.onDown.addOnce(setGameReady);
        }else{
            gameReady = true;
            let debugText = game.add.text(0,0,"text");
            debugText.fixedToCamera = true;
            debugText.cameraOffset.setTo(200, 0);
            debugText.fill = "#ffffff";
            //Center horizontally
            //game.scale.startFullScreen()
            game.scale.scaleMode = game.scale.fullScreenScaleMode;
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            //game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            console.log(gyro.getOrientation());
            console.log(gyro.getFeatures);
            gyro.frequency = 1;
		    // start gyroscope detection
            gyro.startTracking(function(o) {
                // updating player velocity
                bouncy.body.velocity.x += o.gamma/20;
                bouncy.body.velocity.y += o.beta/20;
                debugText.text = "Alpha: " + o.alpha + "\nBeta: " + o.beta + "\nGamma: " + o.gamma;
            });	
        }

        let minimap = game.add.image(0, 0, 'minimap');
        minimap.alpha = 0.5;
        minimap.fixedToCamera = true;
        minimap.cameraOffset.setTo(0, 0);

        //Create the player (car) at the appropriate spot in the world, and center it's anchor
        bouncy = game.add.sprite(game.world.centerX, game.world.height - 600, 'logo' );
        bouncy.anchor.setTo( 0.5, 0.5 );
        game.physics.p2.enable(bouncy);
        //Disable collision for the sprite
        game.physics.p2.setCollisionGroup(bouncy, game.physics.p2.nothingCollisionGroup);
        game.camera.follow(bouncy);

        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        var text = game.add.text( game.world.centerX, 15, "Build something amazing.", style );
        text.anchor.setTo( 0.5, 0.0 );
        console.log(game.world.bottom);
        console.log(game.world.height);
        console.log(layer1.bottom);
        console.log(layer1.height);
    }

    function setGameReady(){
        gameReady = true;
    }
    
    function update() {
        if(!gameReady){
            return;
        }
        if(game.device.desktop){
            if(cursors.up.isDown){
                bouncy.body.thrust(100);
            }
            if(cursors.down.isDown){
                bouncy.body.reverse(100);
            }
            if(cursors.left.isDown){
                bouncy.body.rotateLeft(50);
            }
            else if(cursors.right.isDown){
                bouncy.body.rotateRight(50);
            }else{
                bouncy.body.setZeroRotation();
            }
        }else{
            let angle = Math.atan2(bouncy.body.velocity.y, bouncy.body.velocity.x) + Math.PI/2;
            bouncy.body.rotation = angle;
        }

        //Check to see if the center of sprite, and the pixels at the bounds (+ shape) closest to the center overlap with the map
        let hitResultCenter = game.physics.p2.hitTest(bouncy.position, mapBodies);
        let hitResultTop    = game.physics.p2.hitTest(new Phaser.Point(bouncy.position.x, bouncy.position.y - bouncy.height/2), mapBodies);
        let hitResultLeft   = game.physics.p2.hitTest(new Phaser.Point(bouncy.position.x - bouncy.width/2, bouncy.position.y), mapBodies);
        let hitResultRight  = game.physics.p2.hitTest(new Phaser.Point(bouncy.position.x + bouncy.width/2, bouncy.position.y), mapBodies);
        let hitResultBottom = game.physics.p2.hitTest(new Phaser.Point(bouncy.position.x, bouncy.position.y + bouncy.height/2), mapBodies);
        let hitResults = [hitResultCenter, hitResultTop, hitResultLeft, hitResultRight, hitResultBottom];

        //Given a hitTest result, check if it is empty (no collision between point and track)
        let isEmpty = function(result, index){
            return result.length == 0;
        }

        //If all the points above are off of the track
        if(hitResults.every(isEmpty)){
            console.log("hit");
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




//Road segments
//(from http://brunnett-dharaelvis.blogspot.com/2013/09/collision-with-2d-sprite-objects-and.html)
//http://i.imgur.com/bNHYwZO.png
//http://i.imgur.com/ppPw7ED.png

//Car spritesheet
//(from http://knowyourmeme.com/photos/1131764-age-of-empires-cobra-car-how-do-you-turn-this-on)
//http://i0.kym-cdn.com/photos/images/newsfeed/001/131/764/71e.png

//Static car sprite
//(from https://openclipart.org/detail/61201/red-racing-car-top-view)
//https://openclipart.org/image/2400px/svg_to_png/61201/simple-travel-car-top-view.png

//Loading Background
//

//Progress Bar
//(from https://stackoverflow.com/questions/8038246/how-can-i-make-this-progress-bar-with-just-css)
//https://i.stack.imgur.com/AuDV9.png

//Sprites from images:
//https://instantsprite.com

//Tilemap physics & object thrust
//https://phaser.io/examples/v2/p2-physics/tilemap

//Javascript Some method
//https://www.w3schools.com/Jsref/jsref_some.asp
