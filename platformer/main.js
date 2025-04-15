class Tile {
    constructor(x,y,w,h,color='#000000') {
        this.x = x;
        this.y = y;
        this.h = h;
        this.w = w;
        this.color=color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class Player {
    constructor(x,y) {
        this.x = x; //10
        this.y = y; //20

        this.yVelocity=0;
        this.xVelocity = 0;
        this.h = 16;
        this.w = 16;

        this.jumpHeight=3.2;
        this.speed=1;

        this.direction=false;//false=right, true=left

        this.xCollided=false;
        this.yCollided=true;
        
        this.image = new Image();
        this.image.src = 'images/mario.png';
        //this.data
        
        fetch("images/mario.json")
        .then(r=>r.text())
        .then(text => {
            this.data = JSON.parse(text);
        });

        console.log(this.data);

    }

    checkForCollisions(theTiles) {
        let collisions = [];
        theTiles.forEach((tile) => {
        if (this.x + this.w > tile.x && 
            this.x < tile.x + tile.w && 
            this.y + this.h > tile.y && 
            this.y < tile.y + tile.h) 
        {
            collisions.push(tile);
        }
        });
        return collisions;
    }

    update(theTiles) {
        //move
        this.xVelocity = ((isKeyDown('KeyD') - isKeyDown('KeyA')) * this.speed);

        if(this.xVelocity>0)this.direction=false;
        if(this.xVelocity<0)this.direction=true;

        this.x += this.xVelocity;

        //check for collision x
        this.xCollided=false;
        this.checkForCollisions(theTiles).forEach((tile) => {
        if (this.xVelocity > 0) {
            this.x = tile.x - this.w;
            this.xCollided=true;
        } else {
            this.x = tile.x + tile.w;
        }
        });
        

        // move 
        this.yVelocity += gravity;
        if (this.yVelocity >= terminalVelocity){
        this.yVelocity=terminalVelocity;
        }
        this.y += this.yVelocity;

        this.yCollided=false;
        this.checkForCollisions(theTiles).forEach((tile) => {
        if (this.yVelocity > 0) {
            this.y = tile.y - this.h;
            this.yCollided=true;
        } else {
            this.y = tile.y + tile.h;
        }

        this.yVelocity=0;
        });

        //jump
        if (this.yCollided && isKeyDown('Space')) {
        this.yVelocity-=this.jumpHeight;
        }

        //player leaves screen, make them come back
        if (this.y >= 180)
        {
        this.y = -this.h
        }
        
    }

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);
        
        flipAndDrawImage(ctx, this.image, 0,0,16,16, this.x, this.y, this.w, this.h, this.direction, false);
    }
}

let canvasScale= 2;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.scale(canvasScale, canvasScale);
ctx.imageSmoothingEnabled= false;

let keysPressed = {};

//game variables
const gravity = 0.1;
const terminalVelocity = 6;

let thePlayer = new Player(10, 20);
let theTiles = [
    new Tile(0, 150, 150, 20),
    new Tile(100, 120, 100, 10),
];

//functions
function main() {
    update();
    draw();
}

function update() {
    thePlayer.update(theTiles);

}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    thePlayer.draw(ctx);
    theTiles.forEach(function(tile) {
        tile.draw(ctx);
    });
}

setInterval(main, 10);

//utils

function flipAndDrawImage(ctx, image, sx,sy,sw,sh, x,y, width, height, flipH, flipV) {
    ctx.save();
    ctx.translate(flipH ? width : 0, flipV ? height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1); 
    ctx.drawImage(image, sx,sy,sw,sh, flipH?-x:x, y, width, height);
    ctx.restore();
}

function isKeyDown(keyName) {
return (Object.keys(keysPressed).includes(keyName) && keysPressed[keyName])
}

addEventListener("keydown", function(event){
keysPressed[event.code] = true;
});

addEventListener("keyup", function(event){
keysPressed[event.code] = false;
});
