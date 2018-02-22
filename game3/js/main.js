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
    var pixel;
    /** @type {number} */
    var currentX = 0;
    /** @type {Phaser.Text} */
    var text;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.P2JS);
        bmd = game.add.bitmapData(800, 600, "canvas", true);
        pixel = game.make.bitmapData(12, 12);
        pixel.circle(6, 6, 6, "rgb(255, 0, 0)");

        spr = game.add.sprite(game.world.centerX, game.world.centerY, "logo");

        game.physics.p2.enable(spr, true);
        
        spr.alpha = 0.2
        spr.body.clearShapes();
        spr.body.loadPolygon('physicsData','phaser');

        game.input.addMoveCallback(paint, this);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something amazing.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function update() {
        
    }

    function paint(pointer, x, y) {
        if (pointer.isDown){
            bmd.draw(pixel, x - 6, y - 6);
            
            /*let areaRect = new Phaser.Rectangle(x-6, x-6, 12, 12);
            let tempRect = game.make.bitmapData(12, 12);
            tempRect.fill(0,0,255);
            /*if(bmd.getBounds().contains(spr.body)){
                //bmd's bounds are the whole screen, this always succeeds
                game.stage.backgroundColor = 0xff0000;
            }*/
            /*let tempSpr = game.add.sprite(x-6,y-6, tempRect);
            game.physics.p2.enable(tempSpr, true);*/
            /** @type {Phaser.Physics.P2.Body} */
            /*let i = spr.body;
            i.onBeginContact.add(function() {
                game.stage.backgroundColor = 0x0000ff;
            })*/

            let hitResult = game.physics.p2.hitTest({x:x, y:y}, [spr]);
            if(hitResult.length != 0){
                game.stage.backgroundColor = 0x0000ff;
                console.log(hitResult);
            }
        }
        //let imd = baseImage.getPixels()
        
        //Old way, for future reference:
        //bmd.setPixel(game.input.x, game.input.y, 255, 0, 0, true);
    }
};

//Get mouse position
//http://www.html5gamedevs.com/topic/1681-get-mouse-position/
//BitmapData (lots of testing to get to work properly)
//https://phaser.io/docs/2.3.0/Phaser.BitmapData.html
//Paint on screen
//https://phaser.io/examples/v2/bitmapdata/copy-bitmapdata