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
    var game = new Phaser.Game(700, 900, Phaser.AUTO, 'game', {preload: preload, create: create, update: update});
    
    function preload() {
        game.load.image('heart', 'assets/Heart.png');
        game.load.image('gridSquare', 'assets/GridTile.png');
        game.load.image('tower1', 'assets/Tower1.png');
        game.load.image('tower2', 'assets/Tower2.png');
        game.load.image('wall', 'assets/Wall.png');
        game.load.image('enemy1', 'assets/Enemy1.png');
        game.load.image('healthBar', 'assets/HealthBar.png');
        game.load.image('sellButton', 'assets/Sell.png');
        game.load.image('projectile', 'assets/Projectile.png');
        game.load.image('exit', 'assets/Drawbridge.png');
        game.load.image('spawner', 'assets/Cave.png');
    }
    
    /**@type {number} */
    const numLives = 3;
    /**@type {number} */
    const tilesPerRow = 15;
    /**@type {number} */
    var playableHeight;
    /**@type {number} */
    var tileWidth;
    /**@type {number} */
    var tileHeight;
    /**@type {number} */
    const timerSpeed = 250;//How many milliseconds until an action is taken
    /**@type {number} */
    const constTimeUntilNextEnemy = 10;
    /**@type {number} */
    var baseTimeUntilNextEnemy;
    /**@type {number} */
    var timeUntilNextEnemy;
    /**@type {number} */
    const wallCost = 10;
    /**@type {number} */
    var money;//Change value in initializeVariables()
    /**@type {number} */
    var difficulty;
    /**@type {number} */
    var enemiesKilled;
    /**@type {number} */
    //The difficulty is increased every X kills
    const killsNeededForDifficultyIncrease = 3;
    /**@type {number} */
    //The difficulty is increased additionally every x difficulty levels
    const difficultyNeededForAdditionalDifficultyIncrease = 5;
    /**@type {number} */
    var enemyScalingFactor;
    //This amount affects the scaling in such a way that the sprite does not take up a full grid tile,
    //but instead leaves some space so the grid lines will still show up.
    /**@type {number} */
    var gridSpacing;
    /**@type {Phaser.Timer} */
    var actionTimer;
    /**@type {Phaser.Sprite} */
    var entryPoint;
    /**@type {Phaser.Sprite} */
    var exit;
    /**@type {Phaser.Sprite} */
    var queuedSprite;
    /**@type {Phaser.Group} */
    var activeTowers;
    /**@type {Phaser.Group} */
    var walls;
    /**@type {Phaser.Group} */
    var enemies;
    /**@type {Phaser.Group} */
    var lives;

    var grid;
    var pathfinder;
    /**@type {number} */
    var halfwayTile;

    //The text style
    var style;
    /** @type {Phaser.Text} */
    var moneyText;
    /** @type {Phaser.Text} */
    var difficultyText;

    const constAllEnemyStats = [
        {
            health: 100,
            baseMovementSpeed: 5,
            reward: 5
        }
    ]

    const constAllTowerStats = [
        {
            damage: 20,
            baseActionSpeed: 5,
            range: 5,
            cost: 10
        },
        {
            damage: 5,
            baseActionSpeed: 1,
            range: 2,
            cost: 20
        }
    ]

    //These two variables mimic the ones above, but will be modified during gameplay.
    //To reset these values to their originals after game.state.restart() is called, 
    //those original values (i.e. the constant values above these) must be saved
    var allEnemyStats;
    var allTowerStats;

    
    function create() {
        //(Re)initialze the variables. This is necessary because game.state.restart does NOT reset the global variables
        initializeVariables();

        game.stage.backgroundColor = '#dddddd';
        playableHeight = game.world.height-200;
        tileWidth = game.world.width/tilesPerRow;
        tileHeight = tileWidth;
        gridSpacing = game.world.width/tilesPerRow;

        //Initialize the variables used for pathfinding (see pathinding-browser.js)
        grid = new PF.Grid(tilesPerRow, tilesPerRow);
        pathfinder = new PF.AStarFinder();
        halfwayTile = Math.floor(tilesPerRow/2);
        
        //Initialize the groups to hold the placed towers, active enemies, and the player's hearts
        activeTowers = game.add.group();
        walls = game.add.group();
        enemies = game.add.group();
        lives = game.add.group();

        //Create the scaling factor for the enemies once here, since it will be used very frequently
        let referenceEnemy = game.make.sprite(0, 0, 'enemy1');
        enemyScalingFactor = (game.world.width-gridSpacing) / (tilesPerRow * referenceEnemy.width);
        referenceEnemy.destroy();

        //Create all of the static sprites
        createGrid();
        createBottomIcons();
        createStartAndExit();

        game.world.bringToTop(enemies);
        
        game.input.addMoveCallback(mouseMoved, this);

        //Add the text displaying the player's money
        style = { font: "25px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center"};
        let staticText = game.add.text(0, 0, "Money: ", style);
        moneyText = game.add.text(staticText.width, 0, money, style);
        let staticText2 = game.add.text(0, staticText.height, "Difficulty: ", style);
        difficultyText = game.add.text(staticText2.width, staticText2.y, difficulty, style);

        //Create a timer that fires when it is time for every piece to take an action
        actionTimer = game.time.create(false);
        actionTimer.loop(timerSpeed, takeAction, this);
        actionTimer.start();
    }
    
    function update() {
        
    }

    function initializeVariables(){
        difficulty = 1;
        money = 100;
        baseTimeUntilNextEnemy = constTimeUntilNextEnemy;
        timeUntilNextEnemy = baseTimeUntilNextEnemy;
        enemiesKilled = 0;
        allEnemyStats = constAllEnemyStats;
        allTowerStats = constAllTowerStats;
        //Technically the other global variables also are not reset, but
        //they are (re)created by the other functions or are constants
        //(game. stuff is automatically removed I believe (like drawn sprites))
    }

    function createGrid(){
        let referenceGridSquare = game.make.sprite(0, 0, 'gridSquare');
        let scalingFactor = game.world.width / (tilesPerRow * referenceGridSquare.width);
        referenceGridSquare.destroy();
        for(let i=0; i<tilesPerRow; i++){
            for(let j=0; j<tilesPerRow; j++){
                let spr = game.add.sprite(tileWidth*i, tileHeight*j, 'gridSquare');
                spr.scale.setTo(scalingFactor, scalingFactor);
            }
        }
    }

    function createBottomIcons(){
        //The first tower
        let towerStats = allTowerStats[0];
        let t1 = game.add.sprite(0, playableHeight, 'tower1');
        t1.inputEnabled = true;
        t1.events.onInputDown.add(bottomIconClicked, this, 0, 'tower');
        let scalingFactor = game.world.width / (.75* tilesPerRow * t1.width);
        t1.scale.setTo(scalingFactor, scalingFactor);
        game.add.text(0, t1.y + t1.height + 5, "💲"+towerStats.cost+"\n🕛"+towerStats.baseActionSpeed+"\n💀"+towerStats.damage+"\n📏"+towerStats.range, {fontSize:20});

        //The second tower
        towerStats = allTowerStats[1];
        let t2 = game.add.sprite(t1.width + 10, playableHeight, 'tower2');
        t2.inputEnabled = true;
        t2.events.onInputDown.add(bottomIconClicked, this, 0, 'tower');
        t2.scale.setTo(scalingFactor, scalingFactor);
        game.add.text(t2.x, t2.y + t2.height + 5, "💲"+towerStats.cost+"\n🕛"+towerStats.baseActionSpeed+"\n💀"+towerStats.damage+"\n📏"+towerStats.range, {fontSize:20});


        //The wall
        let wall = game.add.sprite(t2.x + t2.width + 10, playableHeight, 'wall');
        wall.inputEnabled = true;
        wall.events.onInputDown.add(bottomIconClicked, this, 0, 'wall');
        wall.scale.setTo(scalingFactor, scalingFactor);
        game.add.text(wall.x, wall.y + wall.height + 5, "💲"+wallCost, {fontSize:20});

        //The sell button
        let sellButton = game.add.sprite(wall.x + wall.width + 10, playableHeight, 'sellButton');
        sellButton.inputEnabled = true;
        sellButton.events.onInputDown.add(bottomIconClicked, this, 0, 'sell')
        sellButton.scale.setTo(scalingFactor, scalingFactor);
        game.add.text(sellButton.x, sellButton.y + sellButton.height + 5, "50%", {fontSize:20})

        //The Hearts
        /**@type {Phaser.Sprite} */
        let lastHeart = lives.create(0, playableHeight, 'heart');
        lastHeart.scale.setTo(scalingFactor, scalingFactor);
        lastHeart.position.setTo(game.world.width-lastHeart.width, playableHeight);
        for(let i=0; i<numLives-1; i++){
            let heart = lives.create(lastHeart.x-lastHeart.width-10, playableHeight, 'heart');
            heart.scale.setTo(scalingFactor, scalingFactor);
            lastHeart = heart;
        }
    }

    function createStartAndExit(){
        //Get x value of the tile immediately left of the middle tile (this is where the entry/exit will be placed)
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
            //Get the stats for the tower selected
            let towerStats;
            if(buttonClicked.key == 'tower1'){
                towerStats = allTowerStats[0];
            }else if(buttonClicked.key == 'tower2'){
                towerStats = allTowerStats[1];
            }
            queuedSprite.damage = towerStats.damage;
            queuedSprite.baseActionSpeed = towerStats.baseActionSpeed;
            queuedSprite.timeUntilAction = towerStats.baseActionSpeed;
            //The +5 is there because sometimes the tower can't reach the last square since tileWidth is a float.
            queuedSprite.range = tileWidth*towerStats.range + 5;
            queuedSprite.cost = towerStats.cost;
            //If the player does not have enough money for the tower, do not allow them to select the sprite
            if(queuedSprite.cost > money){
                queuedSprite.destroy();
                queuedSprite = null;
            }
        }
        if(buttonType == 'wall'){
            queuedSprite.cost = wallCost;

            //If the player does not have enough money for the wall, do not allow them to select the sprite
            if(queuedSprite.cost > money){
                queuedSprite.destroy();
                queuedSprite = null;
            }
        }
    }

    function takeAction(){
        //Take action for all enemies
        /**@type {Phaser.Sprite[]} */
        let allEnemies = enemies.children;
        for(let i=0; i<allEnemies.length; i++){
            let enemy = allEnemies[i];

            enemy.timeUntilAction--;
            if(enemy.timeUntilAction !=0){
                //If the enemy is not yet able to move
                continue;
            }
            enemy.timeUntilAction = enemy.baseMovementSpeed;

            //The x/y values of the grid number the player clicked on (0-tilesPerRow)
            let tileXNum = Math.floor((enemy.x / game.world.width) * tilesPerRow);
            let tileYNum = Math.floor((enemy.y / playableHeight) * tilesPerRow);
    
            let newGrid = grid.clone();
            //The path to the exit
            //findPath(x1, y1, x2, y2, grid);
            let path = pathfinder.findPath(tileXNum, tileYNum, halfwayTile, tilesPerRow-1, newGrid);
            //Get the coordinate of the next tile this enemy should move to (path[0] is the current tile)
            let nextTile = path[1];
            let newX = nextTile[0] * tileWidth + 1;
            let newY = nextTile[1] * tileWidth + 1;
            enemy.position.setTo(newX, newY);

            //If the enemy is within the exit (+.01 to tolerate floating point errors)
            if(enemy.y >= exit.y-.01 && enemy.x >= exit.x-.01 && enemy.x <= exit.x+exit.width+.01){
                //Get the leftmost heart
                //TODO: If enemies overlap and remove the last life "together" an error occurs
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
            timeUntilNextEnemy = baseTimeUntilNextEnemy;
            
            //Create a new enemy
            /**@type {Phaser.Sprite} */
            let enemy = enemies.create(entryPoint.x + tileWidth, 1, 'enemy1');
            let enemyStats = allEnemyStats[0];
            enemy.maxHealth = enemyStats.health;
            enemy.health = enemyStats.health;
            enemy.baseMovementSpeed = enemyStats.baseMovementSpeed;
            enemy.timeUntilAction = enemyStats.baseMovementSpeed;
            enemy.reward = enemyStats.reward;
            enemy.scale.setTo(enemyScalingFactor, enemyScalingFactor);
            //Add a healthbar to the enemy
            let hb = game.make.sprite(0, 0, "healthBar")
            enemy.addChild(hb);
        }

        //Take action for each tower
        /**@type {Phaser.Sprite[]} */
        let allTowers = activeTowers.children;
        for(let i=0; i<allTowers.length; i++){
            let tower = allTowers[i];

            //Only decrement the tower's action timer if it is not zero
            if(tower.timeUntilAction != 0){
                tower.timeUntilAction--;
                if(tower.timeUntilAction !=0){
                    //If the tower's action timer is not zero after decrementing it, continue and check the next tower
                    continue;
                }
            }


            /**@type {Phaser.Sprite} */
            let closestEnemy;
            let closestEnemyDistance;

            //Lookat all the enemies to determine which is the closest attackable enemy
            for(let j=0; j<allEnemies.length; j++){
                let enemy = allEnemies[j];
                let distance = game.physics.arcade.distanceBetween(tower, enemy);

                //If the current enemy is within the towers range, the distance to this enemy is closer than the current closest enemy,
                //and the enemy is not "Dead" (health is modified before the enemy dies so multiple towers do not shoot the same enemy)
                //(-.1 is so towers closer to the exit are prioritized)
                //TODO: Center the towers so their is actually correct (can reach below them one tile less than they can reach above them, etc.)
                if(distance <= tower.range && (closestEnemyDistance == null || distance < closestEnemyDistance-.1) && enemy.health > 0){
                    closestEnemy = enemy;
                    closestEnemyDistance = distance;
                }
            }

            //If the tower has an enemy in its range
            if(closestEnemy != null){
                //Shoot the enemy and modify the enemy's health immediately (so multiple towers do not shoot the same enemy)
                let projectile = game.add.sprite(tower.centerX, tower.centerY, 'projectile');
                closestEnemy.health -= tower.damage;
                //Reset the tower's timer
                tower.timeUntilAction = tower.baseActionSpeed;

                closestEnemy.alreadyDestroyed = false;
                //Animated the projectile from the tower to the enemy
                game.add.tween(projectile).to({x: closestEnemy.x, y: closestEnemy.y}, timerSpeed-100, 'Linear', true, 0).onComplete.add(function(){
                    //Remove the projectile
                    projectile.destroy();
                    if(!closestEnemy.alreadyDestroyed){
                        //TECHNICALLY a race condition is possible here and mulitple towers will run this code and award the player twice
                        //To minimize this risk, declare the enemy destroyed immediately
                        closestEnemy.alreadyDestroyed = true;

                        closestEnemy.children[0].width = (enemyScalingFactor*100) * (closestEnemy.health / closestEnemy.maxHealth);
                        //If the enemy has no more health, remove the enemy as well
                        if(closestEnemy.health <= 0){
                            money += closestEnemy.reward;
                            moneyText.text = money;
                            enemies.remove(closestEnemy);
                            closestEnemy.destroy();
                            enemiesKilled++;
                            //Increase the difficulty after every X defeated enemies
                            if(enemiesKilled % killsNeededForDifficultyIncrease == 0){
                                increaseDifficulty();
                            }
                        }
                    }
                });
            }
        }
    }

    function increaseDifficulty(){
        difficulty++;
        difficultyText.text = difficulty;
        for(let i=0; i<allEnemyStats.length; i++){
            let enemyStats = allEnemyStats[i];
            enemyStats.reward += 1;
            if(enemyStats.baseMovementSpeed > 2){
                enemyStats.baseMovementSpeed--;
            }else{
                enemyStats.health += 50;
            }
            if(difficulty % difficultyNeededForAdditionalDifficultyIncrease == 0 && baseTimeUntilNextEnemy > 1){
                baseTimeUntilNextEnemy--;
            }
        }
    }

    function restartGame(){
        game.state.restart();
    }

    function validatePathsExist(){
        let newGrid = grid.clone()
        //Verify path from spawner to exist exists
        let path = pathfinder.findPath(halfwayTile, 0, halfwayTile, tilesPerRow-1, newGrid);
        if(path.length == 0){
            //No path exists from the spawner to the exit
            return false;
        }
    
        /**@type {Phaser.Sprite[]} */
        let allEnemies = enemies.children;
        for(let i=0; i<allEnemies.length; i++){
            let newGrid = grid.clone()
            let enemy = allEnemies[i];
            //The x/y values of the grid number the player clicked on (0-tilesPerRow)
            let tileXNum = Math.floor((enemy.x / game.world.width) * tilesPerRow);
            let tileYNum = Math.floor((enemy.y / playableHeight) * tilesPerRow);
    
            //findPath(x1, y1, x2, y2, grid);
            let path = pathfinder.findPath(tileXNum, tileYNum, halfwayTile, tilesPerRow-1, newGrid);
            if(path.length == 0){
                //No path exists from the enemy to the exit
                return false;
            }
        }
        return true;
    }

    function mouseMoved(pointer, x, y, click){
        //If the player clicked in the playable area
        if(click && y < playableHeight){
            //The x/y values of the grid number the player clicked on (0-tilesPerRow)
            let closestXTileNum = Math.floor((x / game.world.width) * tilesPerRow);
            let closestYTileNum = Math.floor((y / playableHeight) * tilesPerRow);
            //The x/y coordinates that correspond to the grid position the player clicked on (0.0 - game.world.width)
            let closestX = Math.floor(x/tileWidth)*tileWidth;
            let closestY = Math.floor(y/tileHeight)*tileHeight;

            //The position of the cursor and of the tower closest to the cursor
            let currentPosition = new Phaser.Point(closestX+1, closestY+1)
            let objectPosition;
            /**@type {Phaser.Sprite}*/
            let closestObject = game.physics.arcade.closest(currentPosition, activeTowers.children.concat(walls.children));

            if(closestObject != null){
                objectPosition = new Phaser.Point(closestObject.x, closestObject.y)
            }
            
            //If the player clicked on an a grid space occupied by a tower or wall
            if(objectPosition != null && currentPosition.equals(objectPosition)){
                if(queuedSprite != null && queuedSprite.objectType == 'sell'){
                    //Remove the sprite from its relevant group
                    if(closestObject.objectType == 'tower'){
                        activeTowers.remove(closestObject);
                    }else{
                        walls.remove(closestObject);
                    }

                    //Refund the player half of the cost of that object
                    money += Math.floor(closestObject.cost / 2);
                    moneyText.text = money;
                    //Set this grid tile to be pathable again
                    grid.setWalkableAt(closestXTileNum, closestYTileNum, true);
                }
            //If the player clicked on the entry/exit
            }else if(((closestXTileNum >= halfwayTile-1 && closestXTileNum <= halfwayTile+1)) && 
                     (closestYTileNum == 0 || closestYTileNum == tilesPerRow-1)){
                return;
            //If the player clicked on a free grid space (or an enemy, but I don't really care too much about that)
            }else{
                //If the player has a tower to place
                if(queuedSprite != null){
                    if(queuedSprite.objectType == 'tower' || queuedSprite.objectType == 'wall'){
                        //Set this grid tile to be unpathable
                        grid.setWalkableAt(closestXTileNum, closestYTileNum, false);
                        //verify that it is still possible for all enemies to reach the exit
                        let pathsExist = validatePathsExist();
                        if(!pathsExist){
                            //If placing a tower at this location would make it impossible for some of the enemies to reach the exist, disallow the action
                            grid.setWalkableAt(closestXTileNum, closestYTileNum, true);
                            return;
                        }
                        //Deduct the cost of the tower from the player's money
                        money -= queuedSprite.cost;
                        moneyText.text = money;

                        //Place the sprite at the grid location and add it to its group (+1 so the grid is still visible)
                        queuedSprite.position.setTo(closestX+1, closestY+1);
                        if(queuedSprite.objectType == 'tower'){
                            activeTowers.add(queuedSprite);
                        }else{
                            walls.add(queuedSprite);
                        }
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
documentElement.innerHTML = ...;
*/

//https://github.com/qiao/PathFinding.js/

//http://www.html5gamedevs.com/topic/3985-health-bars/