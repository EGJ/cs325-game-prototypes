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
    
    /** @type {Phaser.Game} */
    var game = new Phaser.Game(700, 800, Phaser.AUTO, 'game', {preload: preload, create: create, update: update});
    
    function preload() {
        game.load.image('heart', 'assets/Heart.png');
        game.load.image('gridSquare', 'assets/GridTile.png');
        game.load.image('tower1', 'assets/Tower1.png');
        game.load.image('enemy1', 'assets/Enemy1.png');
        game.load.image('sellButton', 'assets/Delete.png');
        game.load.image('projectile', 'assets/Projectile.png');
        game.load.image('exit', 'assets/Drawbridge.png');
        game.load.image('spawner', 'assets/Cave.png');
    }
    
    /**@type {number} */
    var numLives = 3;
    /**@type {number} */
    var playableHeight;
    /**@type {number} */
    var tilesPerRow = 15;
    /**@type {number} */
    var tileWidth;
    /**@type {number} */
    var tileHeight;
    /**@type {number} */
    var timerSpeed = 1000;
    /**@type {Phaser.Timer} */
    var actionTimer;
    //This amount affects the scaling in such a way that the sprite does not take up a full grid tile,
    //but instead leaves some space so the grid lines will still show up.
    /**@type {number} */
    var gridSpacing;
    /**@type {number} */
    var timeUntilNextEnemy = 3;
    /**@type {Phaser.Sprite} */
    var entryPoint;
    /**@type {Phaser.Sprite} */
    var exit;
    /**@type {Phaser.Sprite} */
    var queuedSprite;
    /**@type {Phaser.Group} */
    var activeTowers;
    /**@type {Phaser.Group} */
    var enemies;
    /**@type {Phaser.Group} */
    var lives;

    //The text style
    var style;

    
    function create() {
        game.stage.backgroundColor = '#dddddd';
        playableHeight = game.world.height-100;
        tileWidth = game.world.width/tilesPerRow;
        tileHeight = tileWidth;
        gridSpacing = game.world.width/tilesPerRow;

        activeTowers = game.add.group();
        enemies = game.add.group();
        lives = game.add.group();
        style = { font: "25px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};

        createGrid();
        createBottomIcons();
        createStartAndExit();
        game.input.addMoveCallback(mouseMoved, this);

        //Create a timer that fires when it is time for every piece to take an action
        actionTimer = game.time.create(false);
        actionTimer.loop(timerSpeed, takeAction, this);
        actionTimer.start();
    }
    
    function update() {
        
    }

    function createGrid(){
        for(let i=0; i<tilesPerRow; i++){
            for(let j=0; j<tilesPerRow; j++){
                let spr = game.add.sprite(tileWidth*i, tileHeight*j, 'gridSquare');

                let scalingFactor = game.world.width / (tilesPerRow * spr.width);
                spr.scale.setTo(scalingFactor, scalingFactor);
            }
        }
    }

    function createBottomIcons(){
        let t1 = game.add.sprite(0, playableHeight, 'tower1');
        t1.inputEnabled = true;
        t1.events.onInputDown.add(bottomIconClicked, this, 0, 'tower');

        let sellButton = game.add.sprite(t1.width+10, playableHeight, 'sellButton');
        sellButton.inputEnabled = true;
        sellButton.events.onInputDown.add(bottomIconClicked, this, 0, 'sell')

        /**@type {Phaser.Sprite} */
        let lastHeart = lives.create(0, playableHeight, 'heart');
        lastHeart.position.setTo(game.world.width-lastHeart.width, playableHeight);
        for(let i=0; i<numLives-1; i++){
            let heart = lives.create(lastHeart.x-lastHeart.width-10, playableHeight, 'heart');
            lastHeart = heart;
        }
    }

    function createStartAndExit(){
        let spriteX = (Math.floor(tilesPerRow/2) - 1) * tileWidth;
        
        //Place the sprites at top- and bottom-middle of the screen (+1 so the grid is still visible)
        entryPoint = game.add.sprite(spriteX+1, 1, 'spawner');
        exit = game.add.sprite(spriteX+1, playableHeight-tileHeight+1, 'exit');

        //Scale the entry/exit so it spans three tiles
        let scalingFactorX = ((3 * game.world.width) - 30) / (tilesPerRow * entryPoint.width);
        let scalingFactorY = (playableHeight - 30) / (tilesPerRow * entryPoint.height);

        entryPoint.scale.setTo(scalingFactorX, scalingFactorY);
        exit.scale.setTo(scalingFactorX, scalingFactorY);
    }

    function bottomIconClicked(buttonClicked, pointer, buttonType){
        //console.log(buttonClicked.key);
        //console.log(pointer.x + " " + pointer.y);
        //console.log(buttonType);
        
        //If the player already has a sprite "in their hand," delete it
        if(queuedSprite != null){
            queuedSprite.destroy();
            queuedSprite = null;
        }

        //Replace/Create a new sprite that the player will have in their hands
        queuedSprite = game.add.sprite(game.input.x, game.input.y, buttonClicked.key);
        queuedSprite.objectType = buttonType;
        let scalingFactor = (game.world.width-gridSpacing) / (tilesPerRow * queuedSprite.width);
        queuedSprite.scale.setTo(scalingFactor, scalingFactor);

        if(buttonType == 'tower'){
            //TODO: Check which tower was clicked, and change whatever stats accordingly
            queuedSprite.damage = 40;
        }
    }

    function takeAction(){
        //Take action for all enemies
        /**@type {Phaser.Sprite[]} */
        let allEnemies = enemies.children;
        for(let i=0; i<allEnemies.length; i++){
            let enemy = allEnemies[i];
            enemy.y = enemy.y + tileHeight;

            if(enemy.y >= playableHeight-tileHeight){
                //Get the leftmost heart
                /**@type {Phaser.Sprite} */
                let heart = lives.getTop();

                //Then, remove that heart and the enemy that reached the end.
                lives.removeChild(heart);
                heart.destroy();
                enemies.removeChild(enemy);
                enemy.destroy();
                //Decrement i. This is because allEnemies.length has now decreased by one.
                i-=1;

                //If the player lost all of their lives
                if(lives.length == 0){
                    actionTimer.stop();

                    let gameOverText = game.add.text(game.world.centerX, playableHeight/2, "Game Over.\nPress Space to Restart.", style)
                    gameOverText.anchor.setTo(0.5, 0.5);

                    let spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
                    spaceBar.onDown.addOnce(restartGame);                    
                }
            }
        }

        //Create a new enemy if the timer says so
        timeUntilNextEnemy--;
        if(timeUntilNextEnemy == 0){
            //Reset the timer for when a new enemy should spawn
            timeUntilNextEnemy = 3;
            
            //Create a new enemy
            let enemy = enemies.create(entryPoint.x + tileWidth, 1, 'enemy1');
            enemy.health = 100;
            let scalingFactor = (game.world.width-gridSpacing) / (tilesPerRow * enemy.width);
            enemy.scale.setTo(scalingFactor, scalingFactor);
        }

        //Take action for each tower
        /**@type {Phaser.Sprite[]} */
        let allTowers = activeTowers.children;
        for(let i=0; i<allTowers.length; i++){
            let tower = allTowers[i];
            let towerRange = 200;


            /**@type {Phaser.Sprite} */
            let closestEnemy;
            let closestEnemyDistance;

            for(let j=0; j<allEnemies.length; j++){
                let enemy = allEnemies[j];
                let distance = game.physics.arcade.distanceBetween(tower, enemy);

                //If the current enemy is within the towers range, the distance to this enemy is closer than the
                //current closest enemy, and the enemy is not "Dead" (health is modified before the enemy dies so multiple towers do not shoot the same enemy)
                if(distance <= towerRange && (closestEnemyDistance == null || closestEnemyDistance > distance) && enemy.health > 0){
                    closestEnemy = enemy;
                    closestEnemyDistance = distance;
                }
            }

            //If the tower has an enemy in its range
            if(closestEnemy != null){
                //Shoot the enemy and modify the enemy's health immediately (so multiple towers do not shoot the same enemy)
                let projectile = game.add.sprite(tower.centerX, tower.centerY, 'projectile');
                closestEnemy.health -= tower.damage;

                //Animated the projectile from the tower to the enemy
                game.add.tween(projectile).to({x: closestEnemy.x, y: closestEnemy.y}, timerSpeed-100, 'Linear', true, 0).onComplete.add(function(){
                    //Remove the projectile
                    projectile.destroy();
                    //If the enemy has no more health, remove the enemy as well
                    if(closestEnemy.health <= 0){
                        enemies.remove(closestEnemy);
                        closestEnemy.destroy();
                    }
                });
            }
        }
    }

    function restartGame(){
        game.state.restart();
    }

    function mouseMoved(pointer, x, y, click){
        //If the player clicked in the playable area
        if(click && y < playableHeight){
            //The x/y coordinates that corresponds to the grid position the player clicked on
            let closestX = Math.floor(x/tileWidth)*tileWidth;   //let closestXTileNum = Math.floor((x / game.world.width) * tilesPerRow);
            let closestY = Math.floor(y/tileHeight)*tileHeight; //let closestYTileNum = Math.floor((y / playableHeight) * tilesPerRow);

            //The position of the cursor and of the tower closest to the cursor
            let currentPosition = new Phaser.Point(closestX+1, closestY+1)
            let towerPosition;
            /**@type {Phaser.Sprite}*/
            let closestTower = game.physics.arcade.closest(currentPosition, activeTowers.children);

            if(closestTower != null){
                towerPosition = new Phaser.Point(closestTower.x, closestTower.y)
            }
            
            //If the player clicked on an occupied grid space
            if(towerPosition != null && currentPosition.equals(towerPosition)){
                //TODO: Ask the player whether or not they want to replace the current tower, if they have one.
                console.log("occupied");
                if(queuedSprite != null && queuedSprite.objectType == 'sell'){
                    activeTowers.remove(closestTower);
                    closestTower.destroy();
                }
            //If the player clicked on a free grid space
            }else{
                //If the player has a tower to place
                if(queuedSprite != null){
                    if(queuedSprite.objectType == 'tower'){
                        //Place the sprite at the grid location and add it to the group of active towers (+1 so the grid is still visible)
                        queuedSprite.position.setTo(closestX+1, closestY+1);
                        activeTowers.add(queuedSprite);
                        queuedSprite = null;
                    }else if(queuedSprite.objectType == 'sell'){
                        queuedSprite.destroy();
                        queuedSprite = null;
                    }
                }
            }
        }
        //If the player only moved the mouse and has a queued sprite, move the sprite to the mouse's position
        else if(queuedSprite != null){
            queuedSprite.position.setTo(x, y);
        }
    }
};

//https://phaser.io/examples/v2/geometry/line


//Potential ways to interact with the HTML:
/*
<div class='js-overlay overlay'>Hello World</div>
let documentElement = document.querySelector('.js-overlay')

Or

<div id="myDIV">This is my DIV element.</div>
let documentElement = document.getElementById("myDIV");
*/
