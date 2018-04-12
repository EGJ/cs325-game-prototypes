"use strict";

//I am using global variables, because I can't use this type annotations for member variables,
//and I like text completion way to much to abide by best practice :P
/** @type {Phaser.Game} */
var game;

/**@type {number} */
var numLives = 1;
/**@type {number} */
var numlaunchers = 8;
/**@type {number} */
var emissionFrequency = 1500;
/**@type {number} */
var increaseDifficultyInterval = 15000;
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

BasicGame.Game = function (game) {

}
BasicGame.Game.prototype = {
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    create: function() {
        game = this.game;
        //Create the player and add arcade physics to it
        player = game.add.sprite(game.world.centerX, game.world.centerY, 'robin');
        game.physics.arcade.enable(player);
        player.anchor.setTo(0.5, 0.5);
        game.physics.arcade.collide(player, enemies, this.collisionOccured);
        //Scale the player to be the same size as the projectile launchers
        let scalingFactor2 = game.world.width / (numlaunchers * player.width);
        player.scale.setTo(scalingFactor2)

        player.animations.add('flapWings');
        player.animations.play('flapWings', 120, true);
        //Make the hitbox of the player a little more forgiving
        player.body.setSize((player.width - 35) / player.scale.x, (player.height/1.5 ) / player.scale.y, 55, player.height/2);

        //Control the player with the mouse
        game.input.addMoveCallback(this.mouseMoved, this)
        
        //Add a collision group for the projectile launchers and the projectiles
        //enemies is defined first so it will be beneath the launcher
        enemies = game.add.group(null, null, true, true);
        launchers = game.add.group(null, null, true, true);
        game.physics.arcade.enable(enemies);
        game.physics.arcade.enable(launchers);


        let i;
        //Create the projectile launchers at the bottom of the screen
        for(i=0; i<numlaunchers; i++){
            //Create a launcher at the correct proportional location
            let launcher = launchers.create(game.world.width*i/numlaunchers, game.world.height-75, 'chimney');
            game.physics.arcade.enable(launcher);
            //Scale the launcher so it will fill the correct proportion screen
            let scalingFactor = game.world.width / (numlaunchers * launcher.width);
            launcher.scale.setTo(scalingFactor, scalingFactor);
        }

        let referenceEnemy = game.make.sprite(0,0,'smoke');
        enemyScaleFactor = game.world.width / (numlaunchers * referenceEnemy.width);
        referenceEnemy.destroy();

        startTime = game.time.now;
        referenceTime = startTime;
        //The timer responsible for creating a projectile every emissionFrequency seconds
        timer = game.time.create(false);
        timerEvent = timer.loop(emissionFrequency, this.createProjectile, this);
        timer.start(0);

        //All the text that is displayed on the screen
        style = { font: "15px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};
        let staticText1 = game.add.text(0, 0, "Time survived: ", style);
        let staticText2 = game.add.text(0, staticText1.y + staticText1.height, "Current Enemy Speed: ", style);
        let staticText3 = game.add.text(0, staticText2.y + staticText2.height, "Lives Remaining: ", style);
        let staticText4 = game.add.text(0, staticText3.y + staticText3.height, "Seconds until next difficulty increase: ", style);
        
        playDurationText = game.add.text(staticText1.width, staticText1.y, "00:00:0", style);
        enemySpeedText = game.add.text(staticText2.width, staticText2.y, -particleSpeed, style);
        livesText = game.add.text(staticText3.width, staticText3.y, numLives, style);
        timeTillIncreaseText = game.add.text(staticText4.width, staticText4.y, increaseDifficultyInterval, style);
    },
    
    update: function() {
        if(numLives == 0){
            return;
        }
        //The amount of time that has passed since the last update
        let timeDifference = game.time.now - referenceTime;

        timeTillIncreaseText.text = ((increaseDifficultyInterval - timeDifference)/1000).toFixed(1);;

        //If the amount of time until an increment has occurred, increase the difficulty
        if(timeDifference > increaseDifficultyInterval){
            referenceTime = game.time.now;
            this.increaseDifficulty();
        }

        //Check if the player hit any of the enemies
        game.physics.arcade.overlap(player, enemies, this.collisionOccured);

        this.updateSurvivedText();
    },

    render: function(){
        //game.debug.bodyInfo(player, 32, 130);
        //game.debug.body(player);
    },

    mouseMoved: function(pointer, x, y, click){
        //Move the player to the position of the mouse unless they would clip into the chimneys or the game is over
        if(y < game.world.height - 75 - player.height/2 && numLives != 0){
            player.position.setTo(x, y);
        }
    },

    createProjectile: function(){
        //Randomly choose which launcher the projectile should shoot out from
        let launcherPosition = game.rnd.integerInRange(0, numlaunchers);

        //Create a projectile at that launcher
        let enemy = enemies.create(game.world.width*launcherPosition/numlaunchers, game.world.height, 'smoke');
        //Scale the projectile to fit the launcher
        enemy.scale.setTo(enemyScaleFactor);
        let body = enemy.body;
        body.velocity.y = particleSpeed;
    },

    increaseDifficulty: function(){
        //Stop the timer and clear all the projectiles from the screen
        timer.remove(timerEvent);
        //enemies.removeAll()

        //Increase the difficulty
        particleSpeed -= 20;
        enemySpeedText.text = -particleSpeed;
        emissionFrequency -= 50;
        if(emissionFrequency < 1000){
            emissionFrequency = 1000;
        }

        //Create a new timer to create the projectiles
        timerEvent = timer.loop(emissionFrequency, this.createProjectile, this);
    },

    collisionOccured: function(){
        enemies.removeAll()
        numLives--;
        livesText.text = numLives;

        //If the player lost all their lives
        if(numLives == 0){
            //Don't create any more smoke clouds
            timer.remove(timerEvent);

            //Add the game over text and freeze the player's animation
            game.add.text(game.world.centerX, game.world.centerY, "Game Over. Press F5/⌘-R to restart.", style);
            player.animations.stop();
            
            //Restart the game when the player hits the spacebar
            //TODO: GET THIS TO WORK. WHY WON'T IT WORK? D:
            //let spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            //spaceBar.onDown.addOnce(this.restartGame);
        }
    },

    updateSurvivedText: function(){
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
    },

    restartGame: function(){
        //enemies.removeAll(true);
        //launchers.removeAll(true);
        //game.state.restart();
    }
};

//Sprite Tinting
//https://phaser.io/examples/v2/sprites/sprite-tint

//Robin
//(from https://www.pinterest.com/pin/436497388859683801/)
//https://i.pinimg.com/originals/6a/11/03/6a1103be1e1db9ed70cb1cfa23d0a2fb.jpg

//Chimney
//(from http://clubpenguin.wikia.com/wiki/File:Cozy_Fireplace_sprite_007.png)
//https://vignette.wikia.nocookie.net/clubpenguin/images/a/aa/Cozy_Fireplace_sprite_007.png/revision/latest?cb=20160918170441

//Smoke
//(from http://clipartmag.com/smoke-cloud-cliparts  )
//https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfxBdEFdZzr7Oll8-o2-iVIu6SIjHe1Ra8jXFuzYBSkE2Wm7MCUA

