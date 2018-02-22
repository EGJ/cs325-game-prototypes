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
        game.load.physics('physicsData', 'assets/physbody.json');
    }
    /** @type {Phaser.Sprite} */
    var spr;
    /** @type {Phaser.BitmapData} */
    var bmd;
    /** @type {Phaser.BitmapData} */
    var rectangle;
    /** @type {Phaser.Text} */
    var score;
    /** @type {Phaser.Text} */
    var inkText;
    /** @type {number} */
    var numberCorrect;
    /** @type {number} */
    var totalAttempts;
    /** @type {number} */
    var inkLength;
    /** @type {number} */
    let inkDecrementAmount = 0.3;

    function create() {
        //Enable the physics system
        game.physics.startSystem(Phaser.Physics.P2JS);
        
        //Add the sprite to the world, and add the physics to allow for collision checks
        spr = game.add.sprite(game.world.centerX, game.world.centerY, "logo");
        game.physics.p2.enable(spr);
        //Remove the large bounding box from the sprite
        spr.body.clearShapes();
        //Add a custom polygon bounding box
        spr.body.loadPolygon('physicsData','phaser');
        
        //Creates a sort of canvas that can be drawn on
        bmd = game.make.bitmapData(game.width, game.height);
        bmd.addToWorld();
        //Defines the rectangles that will be drawn to the aformentioned "canvas"
        rectangle = game.make.bitmapData(10, 10);
        rectangle.rect(0, 0, 10, 10, 'rgb(255,0,255)');

        //Whenever the mouse moves, call this method
        game.input.addMoveCallback(paint, this);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        let style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        let text = game.add.text(game.world.centerX, 0, "Talent Show: How well can you paint?", style);
        text.anchor.setTo(0.5, 0.0);
        let text2 = game.add.text(0, text.height, "Correctly painted: ", style);
        score = game.add.text(text2.x + text2.width, text.height, 0, style);
        inkText = game.add.text(0, 2*text2.height, "Ink remaining:", style);
        //How long the ink remaing line will be
        inkLength = game.width-5 - inkText.width;

        //Variables to keep track of the player's score
        numberCorrect = 0;
        totalAttempts = 0;

        //Set the style of the ink remaining line
        bmd.ctx.lineWidth = 4;
        bmd.ctx.strokeStyle = "white"
        updatePaintLeft()
    }
    
    function update() {
    }

    function paint(pointer, x, y) {
        //If the mouse is held down/clicked
        if (pointer.isDown){
            
            //Update the bitmapData buffer. This is necessary for getPixel* functions to work correctly
            //I can't get the update function to work with proper bounds :/
            bmd.update();
            //Store the values of the four corner pixels in the area
            let vals = [bmd.getPixel32(x-5,y-5), bmd.getPixel32(x+4,y+4), bmd.getPixel32(x-5,y+4), bmd.getPixel32(x+4,y-5)]

            //Draw a rectangle over the current location
            bmd.draw(rectangle, x-5, y-5);
            //If all of the corners have already been painted, do not continue
            //the rectangle is draw first in case there is a whole in the middle of the square. (does not count as a move though)
            if(vals.indexOf(0) == -1){
                return;
            }
            updatePaintLeft();
            //Update the amount of times the player has tried to color an area
            totalAttempts++;
            
            

            //If the center of the cursor is over the sprite-to-trace
                let hitResult = game.physics.p2.hitTest({x:x, y:y}, [spr]);
            if(hitResult.length != 0){
                //If the user painted over a new area in the sprite, update the number of correctly painted areas
                numberCorrect++;
            }
            score.text = numberCorrect + "/" + totalAttempts;

            //Once the user runs out of ink
            if(inkLength <= 0){
                //Add the game over text to the screen
                let style = { font: "25px Verdana", stroke: "#000000", strokeThickness: 6, fill: "#ffffff", align: "center" };
                let percentageCorrect = (numberCorrect*100/totalAttempts).toFixed(2);
                let goodness = ""
                if(percentageCorrect > 75){
                    goodness = "You really have a talent for this! Good job!\n"
                }else if(percentageCorrect > 50){
                    goodness = "Not bad. I'm sure you can do better though.\n"
                }else if(percentageCorrect > 25){
                    goodness = "Are you even trying?\n"
                }else{
                    goodness = "Testing to see how the game works, I hope?\n"
                }
                let gameOverText = "Game Over\nYour painting was " + percentageCorrect + "% accurate.\n" + goodness +
                "The now game will automatically restart in 10 seconds"
                let text = game.add.text(game.world.centerX, game.world.centerY, gameOverText, style);
                text.anchor.setTo(0.5, 0.5);
                //Disable user interaction
                game.input.deleteMoveCallback(paint, this)
                //Start a timer to restart the game
                let timer = game.time.create(true);
                timer.add(1000, function(){
                    //Restart the game
                    game.state.restart();
                })
                timer.start();
            }
        }
    }

    function updatePaintLeft(){
        inkLength -= inkDecrementAmount;
        //Erase the old ink left line. When the width of clearRect is inkLength+(number < 1),
        //there is a sort of ghost progress bar left, with lower numbers making it more visible.
        //If the number is >= 1, it is compeletly erased. I like the effect, so I'm using it.
        bmd.ctx.clearRect(inkText.width, (2*score.height)+18, inkLength+0.5, 4);

        //Draw a line from the end of the ink remaining text to the correct distance
        bmd.ctx.beginPath();
        bmd.ctx.moveTo(inkText.width, (2*score.height)+20);
        bmd.ctx.lineTo(inkLength + inkText.width, (2*score.height)+20);
        bmd.ctx.stroke();
        bmd.ctx.closePath();
    }

    /* How to do button stuff
        button = game.add.button(game.world.centerX - 95, 400, 'logo', buttonClickEvent, this);
        button.visible = false;
    
        function buttonClickEvent(){
            console.log("Button clicked");
        }
    */
};

//Get mouse position
//http://www.html5gamedevs.com/topic/1681-get-mouse-position/
//BitmapData (lots of testing to get to work properly)
//https://phaser.io/docs/2.3.0/Phaser.BitmapData.html
//Paint on screen
//https://phaser.io/examples/v2/bitmapdata/copy-bitmapdata
//p2 Physics
//https://phaser.io/examples/v2/p2-physics/load-polygon-1
//Polygon Creator
//Physics Editor - https://www.codeandweb.com/physicseditor
//Custom Timer
//https://phaser.io/examples/v2/time/custom-timer