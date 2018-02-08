"use strict";

window.onload = function() {
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    var game = new Phaser.Game( 800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update } );
    
    function preload() {
        // Load an image and call it 'logo'.
        game.load.image( 'urn', 'assets/urn.png' );
        game.load.spritesheet('explosion', 'assets/explosionSpritesheet.png', 251, 200);
        game.load.audio('glassBreak', 'assets/glassBreak.wav');
    }
    
    var bouncy;
    var canCollide = true;
    var text;

    var referenceTime = 0;
    var highScore;
    var timeAlive;

    var milliseconds = 0;
    var seconds = 0;
    var minutes = 0;

    function create() {
        // Create a sprite at the center of the screen using the 'logo' image.
        bouncy = game.add.sprite( game.world.centerX, game.world.centerY, 'urn' );
        
        // Anchor the sprite at its center, as opposed to its top-left corner.
        // so it will be truly centered.
        bouncy.anchor.setTo( 0.5, 0.5 );
        
        // Turn on the arcade physics engine for this sprite.
        game.physics.enable( bouncy, Phaser.Physics.ARCADE );
        // Make it bounce off of the world bounds.
        bouncy.body.collideWorldBounds = true;
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Watch the ashes.", style );
        text.anchor.setTo( 0.5, 0.0 );

        //Initiate the score text
        highScore = game.add.text(10, 15, "00:00:00", style);
        timeAlive = game.add.text(game.world.width - 10, 15, "00:00:00", style);
        timeAlive.anchor.setTo(1.0, 0.0);
    }
    
    function update() {
        //Update the amount of time the player was alive
        updateTimer();

        // Accelerate the 'logo' sprite towards the cursor,
        // accelerating at 500 pixels/second and moving no faster than 500 pixels/second
        // in X or Y.
        // This function returns the rotation angle that makes it visually match its
        // new trajectory.
        bouncy.rotation = game.physics.arcade.accelerateToPointer( bouncy, game.input.activePointer, 500, 500, 500 );
        
        //The following doesn't work. Both args must be sprite, group, or Tilemap Layers
        //game.physics.arcade.collide(bouncy, game.world.bounds, collisionFunction())
        
        //If the object collided with the world bounds
        if( canCollide &&
            ((bouncy.position.x + bouncy.width/2 >= game.world.width) || (bouncy.position.x - bouncy.width/2 <= 0) ||
            (bouncy.position.y + bouncy.height/2 >= game.world.height) || (bouncy.position.y - bouncy.height/2 <= 0))){
                collisionFunction();
        }
    }

    function updateTimer() {
        minutes = Math.floor((game.time.now - referenceTime) / 60000) % 60;
        seconds = Math.floor((game.time.now - referenceTime) / 1000) % 60;
        milliseconds = Math.floor((game.time.now - referenceTime) % 100);
        //If any of the digits becomes a single digit number, pad it with a zero 
        if (milliseconds < 10)
            milliseconds = '0' + milliseconds; 
        if (seconds < 10)     
            seconds = '0' + seconds;    
        if (minutes < 10)        
            minutes = '0' + minutes;    
        timeAlive.setText(minutes + ':'+ seconds + ':' + milliseconds);
    }

    function collisionFunction(){
        //Update the player's high score, if need be.
        if(timeAlive.text > highScore.text){
            highScore.text = timeAlive.text;
        }
        referenceTime = game.time.now;

        //Change the text on collision with the background
        text.text = "Unbelievable";
        
        //Temporarily disable (hide) the object
        canCollide = false;
        bouncy.renderable = false;
        //bouncy.body.collideWorldBounds = false;

        //Load the glass breaking audio
        var glassAudio = game.add.audio('glassBreak');
        //Play it quietly.
        glassAudio.volume = 0.1;
        glassAudio.play();

        //Create the explosion animation
        var explosion = game.add.sprite( bouncy.position.x, bouncy.position.y, 'explosion' );
        //Anchor it around its center
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explode');
        //Play the animation
        var playing = explosion.animations.play('explode', 40, false, true);
        //When the animation is finished playing, call animationFinished
        playing.onComplete.add(animationFinished, this);
    }

    function animationFinished(){
        //Unhide the object, and place it in the center of the screen
        canCollide = true;
        bouncy.renderable = true;
        bouncy.position.x = game.world.centerX;
        bouncy.position.y = game.world.centerY;
        
        //Reset the text
        text.text = "Watch the ashes.";

        //To be 100% accurate about how long they've "survived", the
        //reference time should be reset here, but it doesn't look as nice.
        //referenceTime = game.time.now;
    }
};

//Helpful stuff

//   Assets
//Urn
//https://www.rubylane.com/item/61838-150922x20twt3368/Cobalt-Blue-Silver-Deposit-Vase-Red?search=1
//Explosion:
//https://giphy.com/stickers/explosion-attention-6mGPx9QGBTyUg
//Glass break audio:
//https://freesound.org/people/cmusounddesign/sounds/84704/

//   Tools
//Spritesheet converter:
//https://ezgif.com/gif-to-sprite/

//   Tutorials
//How to play audio:
//https://phaser.io/examples/v2/audio/play-music
//How to check collision with background
//http://www.html5gamedevs.com/topic/2557-detect-when-a-sprite-hits-the-bounds/ -- Zaidar