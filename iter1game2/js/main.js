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
        game.load.image( 'logo', 'assets/phaser.png' );
        game.load.image( 'teapot', 'assets/teapot.png' );
        game.load.image( 'teapot2', 'assets/teapot2.png' );
        game.load.image( 'bucket', 'assets/bucket.png' );
    }
    
    /**@type {number} */
    var numLives = 3;
    /**@type {number} */
    var numBuckets = 8;
    /**@type {number} */
    var emissionFrequency = 2000;
    /**@type {number} */
    var increaseDifficultyInterval = 5000;
    /**@type {number} */
    var particleSpeed = -30;
    /**@type {number} */
    var enemyScaleFactor;
    //The text style
    var style;
    /** @type {Phaser.Sprite} */
    var player;
    /** @type {Phaser.Group} */
    var launchers;
    /** @type {Phaser.Group} */
    var enemies;
    /**@type {number} */
    var referenceTime;
    /**@type {Phaser.Timer} */
    var timer;
    /**@type {Phaser.TimerEvent} */
    var timerEvent;

    //Text to be shown on screen
    /** @type {Phaser.Text} */
    var playDurationText;
    /** @type {Phaser.Text} */
    var enemySpeedText;
    /** @type {Phaser.Text} */
    var livesText;
    /** @type {Phaser.Text} */
    var timeTillIncreaseText;

    //Variables to keep track of the time
    var startTime;
    var minutes;
    var seconds;
    var milliseconds;

    
    function create() {
        /*let emitter = game.add.emitter(game.world.centerX, game.world.centerY);
        emitter.width = game.world.width;
        emitter.makeParticles('teapot')
        emitter.start(false, 5000, 250);
        emitter.makeParticles('teapot2')*/

        //Create the player and add arcade physics to it
        player = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
        game.physics.arcade.enable(player);
        player.anchor.setTo(0.5, 0.5);
        game.physics.arcade.collide(player, enemies, collisionOccured);
        //Scale the player to be the same size as the projectile launchers
        let scalingFactor2 = game.world.width / (numBuckets * player.width);
        player.scale.setTo(scalingFactor2)

       //Control the player with the mouse
        game.input.addMoveCallback(mouseMoved, this)
        
        //Add a collision group for the projectile launchers and the projectiles
        //enemies is defined first so it will be beneath the launcher
        enemies = game.add.group(null, null, true, true);
        launchers = game.add.group(null, null, true, true);
        game.physics.arcade.enable(enemies);
        game.physics.arcade.enable(launchers);

        let i;
        //Create the projectile launchers at the bottom of the screen
        for(i=0; i<numBuckets; i++){
            //Create a launcher at the correct proportional location
            let launcher = launchers.create(game.world.width*i/numBuckets, game.world.height-50, 'bucket');
            game.physics.arcade.enable(launcher);
            //Scale the launcher so it will fill the correct proportion screen
            let scalingFactor = game.world.width / (numBuckets * launcher.width);
            launcher.scale.setTo(scalingFactor, 1);
        }

        let referenceEnemy = game.make.sprite(0,0,'teapot');
        enemyScaleFactor = game.world.width / (numBuckets * referenceEnemy.width);
        referenceEnemy.destroy();

        startTime = game.time.now;
        referenceTime = startTime;
        //The timer responsible for creating a projectile every emissionFrequency seconds
        timer = game.time.create(false);
        timerEvent = timer.loop(emissionFrequency, createProjectile, this);
        timer.start(0);

        style = { font: "15px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};
        let staticText1 = game.add.text(0, 0, "Time survived: ", style);
        let staticText2 = game.add.text(0, staticText1.y + staticText1.height, "Current Enemy Speed: ", style);
        let staticText3 = game.add.text(0, staticText2.y + staticText2.height, "Lives Remaining: ", style);
        let staticText4 = game.add.text(0, staticText3.y + staticText3.height, "Seconds until next difficulty increase: ", style);
        
        playDurationText = game.add.text(staticText1.width, staticText1.y, "00:00:0", style);
        enemySpeedText = game.add.text(staticText2.width, staticText2.y, -particleSpeed, style);
        livesText = game.add.text(staticText3.width, staticText3.y, numLives, style);
        timeTillIncreaseText = game.add.text(staticText4.width, staticText4.y, increaseDifficultyInterval, style);
    }
    
    function update() {
        let currentTime = game.time.now;
        let timeDifference = currentTime - referenceTime;

        timeTillIncreaseText.text = ((increaseDifficultyInterval - timeDifference)/1000).toFixed(1);;

        if(timeDifference > increaseDifficultyInterval){
            referenceTime = game.time.now;
            increaseDifficulty();
        }

        game.physics.arcade.overlap(player, enemies, collisionOccured);

        updateSurvivedText();
    }

    function mouseMoved(pointer, x, y, click){
        if(y < game.world.height - 50 - player.height/2){
            player.position.setTo(x, y);
        }
    }

    function createProjectile(){
        //Randomly choose which bucket the projectile should shoot out from
        let bucketPosition = game.rnd.integerInRange(0, numBuckets);

        let enemy = enemies.create(game.world.width*bucketPosition/numBuckets, game.world.height, 'teapot');
        enemy.scale.setTo(enemyScaleFactor);
        let body = enemy.body;
        body.velocity.y = particleSpeed;
    }

    function increaseDifficulty(){
        //Stop the timer and clear all the projectiles from the screen
        timer.remove(timerEvent);
        //enemies.removeAll()

        //Increase the difficulty
        particleSpeed -= 20;
        enemySpeedText.text = -particleSpeed;
        /*emissionFrequency -= 1000;
        if(emissionFrequency < 1000){
            emissionFrequency = 1000;
        }*/

        //Create a new timer to create the projectiles
        timerEvent = timer.loop(emissionFrequency, createProjectile, this);
    }

    function collisionOccured(){
        enemies.removeAll()
        numLives--;
        livesText.text = numLives;
        
        if(numLives == 0){

        }
    }

    function updateSurvivedText(){
        //Update the duration the user has been playing for.
        minutes = Math.floor((game.time.now - startTime) / 60000) % 60;
        seconds = Math.floor((game.time.now - startTime) / 1000) % 60;
        milliseconds = Math.floor((game.time.now - startTime) % 1000).toString()[0];
        //If the digits becomes a single digit number, pad it with a zero 
        if (seconds < 10)
            seconds = '0' + seconds;
        if (minutes < 10)
            minutes = '0' + minutes;
        playDurationText.setText(minutes + ':'+ seconds + ':' + milliseconds);
    }
};
