"use strict";

//I am using global variables, because I can't use this type annotations for member variables,
//and I like text completion way to much to abide by best practice :P
/** @type {Phaser.Game} */
var game;

//Tilemap stuff
/** @type {Phaser.Tilemap} */
var map;
/** @type {Phaser.TilemapLayer} */
var layer1;
/** @type {Phaser.Physics.P2.Body[]} */
var mapBodies;

//Sprites
/** @type {Phaser.Sprite} */
var car;
/** @type {Phaser.Sprite} */
var finishLine;

//Keyboard input
/** @type {Phaser.CursorKeys} name */
var cursors;

//The text style
var style;

//Variables to keep track of the time
var referenceTime;
var minutes;
var seconds;
var milliseconds;

//Miscellaneous variables
/** @type {Phaser.Text} */
var beginText;
/** @type {Phaser.Text} */
var playDuration;
var gameReady = false;
var winEligible = true;

BasicGame.Game = function (game) {

    //  When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:
    /*
    this.game;      //  a reference to the currently running game (Phaser.Game)
    this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
    this.camera;    //  a reference to the game camera (Phaser.Camera)
    this.cache;     //  the game cache (Phaser.Cache)
    this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
    this.load;      //  for preloading assets (Phaser.Loader)
    this.math;      //  lots of useful common math operations (Phaser.Math)
    this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
    this.stage;     //  the game stage (Phaser.Stage)
    this.time;      //  the clock (Phaser.Time)
    this.tweens;    //  the tween manager (Phaser.TweenManager)
    this.state;     //  the state manager (Phaser.StateManager)
    this.world;     //  the game world (Phaser.World)
    this.particles; //  the particle manager (Phaser.Particles)
    this.physics;   //  the physics manager (Phaser.Physics)
    this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)
    
    //  You can use any of these from any function within this State.
    //  But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.
    */
    
    // For optional clarity, you can initialize
    // member variables here. Otherwise, you will do it in create().
    
    
};

BasicGame.Game.prototype = {

    create: function () {
        game = this.game;
        //Enable the physics system
        game.physics.startSystem(Phaser.Physics.P2JS);
        //Initialize the map
        map = game.add.tilemap('map');
        map.addTilesetImage('tiles');
        layer1 = map.createLayer('Tile Layer 1');
        layer1.resizeWorld();

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
            let spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            spaceBar.onDown.addOnce(this.setGameReady);
        }else{
            //Begin the game once the player taps on the screen
            game.input.onTap.addOnce(this.setGameReady);
        }

        //Create the minimap in the top left of the screen
        let minimap = game.add.image(0, 0, 'minimap');
        minimap.alpha = 0.5;
        //This locks the minimap to the upper-left-hand-corner
        minimap.fixedToCamera = true;
        minimap.cameraOffset.setTo(0, 0);

        //Create the player (car) at the appropriate spot in the world, center it's anchor, and make it face right.
        car = game.add.sprite(game.world.right + 210, game.world.height - 460, 'car' );
        car.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(car);
        car.body.rotation = Math.PI/2;

        //Create the finish line
        finishLine = game.add.sprite(car.position.x - 100, car.position.y, 'finishLine');
        finishLine.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(finishLine);
        
        //Disable collision for the car and the finish line
        game.physics.p2.setCollisionGroup(finishLine, game.physics.p2.nothingCollisionGroup);
        game.physics.p2.setCollisionGroup(car, game.physics.p2.nothingCollisionGroup);
        game.camera.follow(car);

        //Draw the car on top of every other sprite
        car.bringToTop();

        //Set up the text style and the introductory text
        style = { font: "25px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};
        if(game.device.desktop){
            beginText = game.add.text(car.position.x, car.position.y + 150, "Press Space to Begin.", style );
        }else{
            beginText = game.add.text(car.position.x, car.position.y + 150, "Tap to Begin.", style );
        }
        beginText.anchor.setTo(0.5, 0.0);

        //Create the text used to keep track of how long the player was playing.
        //This text will be locked in the upper-right-hand corner
        playDuration = game.add.text(0,0,"00:00:0", style);
        playDuration.fixedToCamera = true;
        playDuration.cameraOffset.setTo(game.camera.width - playDuration.width, 0);
    },

    update: function () {
        if(!gameReady){
            return;
        }
        this.updateTimer();

        if(game.device.desktop){
            //Move the car if any of the arrow keys are pressed
            if(cursors.up.isDown){
                car.body.thrust(100);
            }
            if(cursors.down.isDown){
                car.body.reverse(100);
            }
            if(cursors.left.isDown){
                car.body.rotateLeft(50);
            }
            else if(cursors.right.isDown){
                car.body.rotateRight(50);
            }else{
                car.body.setZeroRotation();
            }
        }else{
            //If the game is being played on mobile, the gyroscope is handling movement,
            //but we want the car's rotation to be in the direction of movement.
            let angle = Math.atan2(car.body.velocity.y, car.body.velocity.x) + Math.PI/2;
            car.body.rotation = angle;
        }

        let hitResult = game.physics.p2.hitTest(car.position, mapBodies, 500);
        //If the car is not on the track
        if(hitResult.length == 0){
            let gameOverText = "Game Over.\nDo not go off the track."
            
            //Stop the car, and prevent any further updates from the game
            gameReady = false;
            car.body.setZeroVelocity();

            //Completely stop the car, depending on the device, and add
            //device-specific restart instructions
            if(game.device.desktop){
                car.body.setZeroRotation();
                gameOverText += "\nPress Space to Restart";

                let spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
                spaceBar.onDown.addOnce(this.restartGame);
            }else{
                gyro.stopTracking();
                gameOverText += "\nTap to Restart";

                game.input.onTap.addOnce(this.restartGame);
            }

            //Show the gameover text
            let text = game.add.text(car.position.x, car.position.y, gameOverText, style);
            text.anchor.setTo(0.5, 0.5);
        }else if(!winEligible &&
                car.position.x > finishLine.position.x + finishLine.width/2 &&
                Math.abs(car.position.y - finishLine.position.y) < 153){//153 is half the width of the track (sprite is centered)
            //Otherwise, if the car is on the track, but uneligible to win (crossed the finish line
            //in the wrong direction first), and is now to the right of the finish line, make them
            //eligible to win.
            winEligible = true;
        }

        let hitResult2 = game.physics.p2.hitTest(car.position, [finishLine]);
        //If the car is on the finish line
        if(hitResult2.length != 0){
            //If the car is moving to the right, and is eligible to win (Did not cross the finish line backwards)
            if(winEligible && car.body.velocity.x > 0){
                //The text displayed when the player wins. The Number(...).toString() is used to remove leading zeros.
                let winText = "You Win!\nCongratulations!\nYou finished in: " + Number(minutes).toString() + 
                " minutes and " + Number(seconds).toString() + " seconds.";
                //Stop the car, and prevent any further updates from the game
                gameReady = false;
                car.body.setZeroVelocity();

                //Completely stop the car, depending on the device, and add
                //device-specific restart instructions
                if(game.device.desktop){
                    car.body.setZeroRotation();
                    winText += "\nPress Space to Restart";
    
                    let spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
                    spaceBar.onDown.addOnce(this.restartGame);
                }else{
                    gyro.stopTracking();
                    winText += "\nTap to Restart";
    
                    game.input.onTap.addOnce(this.restartGame);
                }

                //Show the win text
                let text = game.add.text(car.position.x, car.position.y, winText, style);
                text.anchor.setTo(0.5, 0.5);
            }else{
                //Otherwise, if the car is crossing the finish line in the wrong direction, make them uneligible to win
                winEligible = false;
            }
        }
    },

    setGameReady: function(){
        if(game.device.desktop){
            window.alert("Note: This game is optimized for mobile use.")
        }else{
            //Start the game in full screen, and enable the gyroscope
            game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
            game.scale.startFullScreen();
            gyro.frequency = 1;
		    // start gyroscope detection
            gyro.startTracking(function(o) {
                // updating player velocity
                car.body.velocity.x += o.gamma/20;
                car.body.velocity.y += o.beta/20;
            });
        }
        //Remove the intro text and begin the timer
        beginText.destroy();
        referenceTime = game.time.now;
        gameReady = true;
    },

    updateTimer: function() {
        //Update the duration the user has been playing for.
        minutes = Math.floor((game.time.now - referenceTime) / 60000) % 60;
        seconds = Math.floor((game.time.now - referenceTime) / 1000) % 60;
        milliseconds = Math.floor((game.time.now - referenceTime) % 1000).toString()[0];
        //If the digits becomes a single digit number, pad it with a zero 
        if (seconds < 10)
            seconds = '0' + seconds;
        if (minutes < 10)
            minutes = '0' + minutes;
        playDuration.setText(minutes + ':'+ seconds + ':' + milliseconds);
    },

    restartGame: function(){
        game.state.restart();
    }

};

//Teapot
//(from https://www.flaticon.com/free-icon/vintage-teapot_14790)
//https://imageog.flaticon.com/icons/png/512/14/14790.png?size=1200x630f&pad=10,10,10,10&ext=png&bg=FFFFFFFF

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
//(from http://hdwallpapersbackgrounds.us/cars/cool-citroen-gran-turismo-car-hd-backgrounds-15908.html)
//http://hdwallpapersbackgrounds.us/backgrounds-image/wallpapers-hd-3s-1920x1080/hd-wallpapers-5202cbeo3-3s-1920x1080.jpg

//Progress Bar
//(from https://stackoverflow.com/questions/8038246/how-can-i-make-this-progress-bar-with-just-css)
//https://i.stack.imgur.com/AuDV9.png

//Sprites from images:
//https://instantsprite.com

//Tilemap physics & object thrust
//https://phaser.io/examples/v2/p2-physics/tilemap

//Javascript Some method
//https://www.w3schools.com/Jsref/jsref_some.asp