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
        game.load.spritesheet('farmer', 'assets/farmerWalk.png', 300, 300);;
        game.load.image( 'enemy', 'assets/chicken.png');
        game.load.audio('squawks', 'assets/chicken-squawks.wav');
    }
    //The objects that move
    /** @type {Phaser.Group} */
    var enemies;
    /** @type {Phaser.Sprite} name */
    var player;

    /** @type {Phaser.CursorKeys} name */
    var cursors;
    //Scoreboard data
    /** @type {Phaser.Text} */
    var turnsSurvived;
    /** @type {Phaser.Text} */
    var highScore;

    //Text that will display when the player returns to their previous location
    /** @type {Phaser.Text} */
    var undoText;

    //The player' & enemy's move history
    /** @type {{}[]} */
    var playerHistory = [];
    /** @type {{}[][]} */
    var enemyHistory = [];

    /** @type {number} */
    let moveIncrement = 50;
    /** @type {number} */
    let tweenTime = 500;

    //Variables related to the sounds
    /** @type {Phaser.Sound} */
    var squawks;
    /** @type {boolean} */
    var canSquawk = true;
    
    function create() {
        //Load and segment the audio
        squawks = game.add.audio('squawks');
        squawks.addMarker('squawkIWant', 1.5, 1);

        //Create a group that will contain all the enemies
        enemies = game.add.group()

        //Create the player sprite at the center of the screen
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'farmer' );
        player.scale.setTo(0.5);

        //The number of enemies to create
        let numEnemies = 3;
        //Create every enemy in the enemies group
        for(let i=0; i<numEnemies; i++){
            enemies.create((game.world.width / numEnemies) * i, game.world.y, 'enemy')
        }

        //Center the sprite. This will make it slightly misaligned with the other sprites, however.
        player.anchor.setTo( 0.5, 0.5 );

        //Scale all the enemies by 1/2.
        //For some reason the following line messes up the tweening..., so use a loop
        //enemies.scale.setTo(0.5);
        for(let i=0; i<enemies.length; i++){
            let enemy = enemies.getAt(i);
            enemy.scale.setTo(0.5);
            //While we are doing this, initialize the history list for each enemy
            enemyHistory[i] = [];
        }

        //Enable physics for the player/enemies to be able to check for collisions
        game.physics.arcade.enable(player);
        game.physics.arcade.enable(enemies);
        //Also, don't allow the player to exit the world
        player.body.collideWorldBounds = true;

        
        //Uncomment the following lines to call a function when the object collides;
        //this is in addition to the object rebounding.
        //player.body.onWorldBounds = new Phaser.Signal();
        //player.body.onWorldBounds.add(func_name, this);

        //Creates an object that will contain the four arrow keys, and associated data
        cursors = game.input.keyboard.createCursorKeys();
        
        //The CSS style to be used for all the text displayed
        var style = { font: "15px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};
        //All of the text
        let text = game.add.text( 0, 0, "Turns without incident: ", style );
        turnsSurvived = game.add.text(text.width, 0, 0, style);
        let text2 = game.add.text(0, 0, "High Score: ", style);
        text2.x = game.width - text2.width - 60;
        highScore = game.add.text(text2.x + text2.width, 0, 0, style);
        undoText = game.add.text(game.world.centerX, game.world.centerY, "Undo!", style);
        undoText.anchor.setTo(0.5, 0.5);
        //Modify the style of the undo text slightly
        undoText.fontSize = 150;
        undoText.fill = "#992d2d"
        undoText.alpha = 0;
    }
    
    function update() {
        game.stage.backgroundColor = '#000000';

        //Check if the player collided with the enemy
        game.physics.arcade.overlap(player, enemies, collisionHandler, null, this);

        //If an arrow key is pressed, move the player in that direction
        if(cursors.up.justDown){
            player.animations.frame = 3;
            updateScore();
            movePlayerY(-moveIncrement);
        }
        else if(cursors.down.justDown){
            player.animations.frame = 0;
            updateScore();
            movePlayerY(moveIncrement);
        }
        else if(cursors.left.justDown){
            player.animations.frame = 1;
            updateScore();
            movePlayerX(-moveIncrement);
        }
        else if(cursors.right.justDown){
            player.animations.frame = 2;
            updateScore();
            movePlayerX(moveIncrement);
        }
    }

    function updateScore(){
        //After the player moved, increment their score
        let score = eval(turnsSurvived.text) + 1;
        turnsSurvived.text = score.toString();
        //If the new score is greater than the highscore, update the highscore
        if(score > eval(highScore.text)){
            highScore.text = score.toString();
        }
    }

    //Called when the player collides with any of the enemies
    function collisionHandler (obj1, obj2) {
        //Make the background a redish color and reset the score
        game.stage.backgroundColor = '#992d2d';
        turnsSurvived.text = "0"

        if(canSquawk){
            //Play the squawk noise
            squawks.play("squawkIWant");
            canSquawk = false;
        }
    }

    function movePlayerY(amount){
        if(game.tweens.isTweening(player)){
            return;
        }

        //Animated equivalent of player.position.y += amount
        game.add.tween(player).to({ y: player.position.y+amount }, tweenTime, 'Linear', true, 0).onComplete.add(function(){
            canSquawk = true;
        });
        
        //If the player is returning the position they just came from (undo)
        //Note: JSON.stringify() is used because
        //apparently comparing dictionaries is super weird in javascript
        if(JSON.stringify(playerHistory[playerHistory.length-1]) == JSON.stringify({y: -amount})){
            //Well, I realize that undoing the enemies doesn't really make too
            //much sense in this game, since it isn't super clear that's what's
            //happening :/ oh well, maybe next time.
            //However, I won't move the enemies, so that's neat I guess?
            //undoEnemyMoves();
            undoText.alpha = 1;
            game.add.tween(undoText).to({ alpha: 0 }, 2000, "Linear", true);
            playerHistory.pop();
        }else{
            //Otherwise, add what was just done to the player's move history
            playerHistory.push({y: amount});
            
            //Update the enemy's position
            moveEnemies();
        }
    }

    function movePlayerX(amount){
        if(game.tweens.isTweening(player)){
            return;
        }

        //Animated equivalent of player.position.x += amount
        game.add.tween(player).to({ x: player.position.x+amount }, tweenTime, 'Linear', true, 0).onComplete.add(function(){
            canSquawk = true;
        });

        //If the player is returning the position they just came from
        //Note: JSON.stringify() is used because
        //apparently comparing dictionaries is super weird in javascript
        if(JSON.stringify(playerHistory[playerHistory.length-1]) == JSON.stringify({x: -amount})){
            //Well, I realize that undoing the enemies doesn't really make too
            //much sense in this game, since it isn't super clear that's what's
            //happening :/ oh well, maybe next time.
            //However, I won't move the enemies, so that's neat I guess?
            //undoEnemyMoves();
            undoText.alpha = 1;
            game.add.tween(undoText).to({ alpha: 0 }, 2000, "Linear", true);
            playerHistory.pop();
        }else{
            //Otherwise, add what was just done to the player's move history
            playerHistory.push({x: amount});
            
            //Update the enemy's position
            moveEnemies();
        }
    }

    function moveEnemies(){
        //For each enemy in the group of enemies
        for(let i=0; i<enemies.length; i++){
            let enemy = enemies.getAt(i);

            //Generate a random number between 0 and 1
            //This value will be used to move the enemy in the x or y direction
            let yOrX = Math.round(Math.random());

            //Randomly generate the amount to move (-moveIncrement or moveIncrement)
            let amount = (Math.round(Math.random()) * 2*moveIncrement) - moveIncrement;

            //Check if it is possible for the enemy to move in the randomized direction
            //If the enemy is attempting to move in the y direction
            if(yOrX == 0){
                //If the enemy will go below the world
                if((enemy.position.y + enemy.height) + amount > game.world.height+1){
                    amount *= -1;
                }
                //If the enemy will go above the world
                else if (enemy.position.y + amount < 0){
                    amount *= -1;
                }
            //The enemy is moving in the x direction
            }else{
                //If the enemy will go past the right edge of the world
                if((enemy.position.x + enemy.width) + amount > game.world.width+1){
                    amount *= -1;
                }
                //If the enemy will go past the left edge of the world
                else if (enemy.position.x + amount < 0){
                    amount *= -1;
                }
            }
            //The position where the enemy will move to
            let newPosition = 0;
            //This adds the enemy's current position to their history,
            //so the sprite can move back to that position later
            if(yOrX == 0){
                let oldPosition = {y: enemy.position.y};
                enemyHistory[i].push(oldPosition);
                newPosition = {y: enemy.position.y + amount};
            }else{
                let oldPosition = {x: enemy.position.x};
                enemyHistory[i].push(oldPosition);
                newPosition = {x: enemy.position.x + amount};
            }

            //Finally, move the enemy to its new position
            game.add.tween(enemy).to(newPosition, tweenTime, 'Linear', true, 0);
        }
    }

    //Well, I realize that undoing the enemies doesn't really make too
    //much sense in this game, since it isn't super clear that's what's
    //happening :/ oh well, maybe next time.
    //If I could add a trail to the player, I would likely add this back in.
    function undoEnemyMoves(){
        //Loop through every enemy
        for(let i=0; i<enemies.length; i++){
            let enemy = enemies.getAt(i);
            //Make it go back to the spot it came from
            game.add.tween(enemy).to(enemyHistory[i].pop(), tweenTime, 'Linear', true, 0);
        }
    }
};

//Assets:
//Chicken: https://dribbble.com/shots/1605065-Game-Asset-Angry-Chicken-Game-Character-Sprite-Sheets
//Squawks: http://soundbible.com/871-Chicken.html (public domain)
//Farmer: http://samdeleter.com/pixel-art/

//Helpful link:
//Fading Text: https://phaser.io/examples/v2/tweens/alpha-text
//Sprite Markers: https://phaser.io/examples/v2/audio/audio-sprite-duration