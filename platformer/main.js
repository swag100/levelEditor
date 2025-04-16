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

        this.direction=false;//false=right, true=left
        this.running=false;

        this.xCollided=false;
        this.yCollided=true;
        
        this.image = new Image();
        this.image.src = 'mario.png';

        this.animations = {
            "die": [
                {"x":0,"y":0,"w":16,"h":16}
            ],

            "smallIdle": [{"x":0,"y":0,"w":16,"h":16}],
            "smallJump": [{"x":78,"y":0,"w":16,"h":16}],
            "smallSkid": [{"x":64,"y":0,"w":16,"h":16}],
            "smallWalk": [
                {"x":16,"y":0,"w":16,"h":16},
                {"x":32,"y":0,"w":16,"h":16},
                {"x":48,"y":0,"w":16,"h":16}
            ]
        };

        this.animName = "smallIdle";
        this.animFrame = 0;
        this.animTick=0; // the thing we increment every update

        this.h = 16;//these are to be removed after anims are done
        this.w = 16;

        this.jumpHeight=3.2;
        this.acceleration=0.08;
        this.deceleration=0.16;
        this.walkSpeed=1;
        this.runSpeed=3;

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
        this.running = isKeyDown('ShiftLeft');

        let directionValue= isKeyDown('KeyD') - isKeyDown('KeyA');
        let maxSpeed = this.running ? this.runSpeed : this.walkSpeed;

        this.xVelocity += directionValue * this.acceleration;
        if (Math.abs(this.xVelocity) >= maxSpeed){
            this.xVelocity = maxSpeed*directionValue;
        }

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

        //check for collision y
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
        if (this.y >= 180)this.y = -this.h;

        //animtest
        this.animTick+=Math.abs(this.xVelocity);
        if(Math.floor(this.animTick) % 16 == 0){
            this.animFrame+=1;
        }
        if (this.xVelocity==0){
            this.animFrame=0;
        }
        console.log(this.animTick);

        //if (this.animName)
        if (this.xVelocity != 0) {
            this.animName="smallWalk";
        }else{
            this.animName="smallIdle";
        }
        
    }

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);

        let modAnimFrame = this.animFrame % this.animations[this.animName].length;
        
        flipAndDrawImage(
            ctx, this.image, 
            this.animations[this.animName][modAnimFrame]['x'],
            this.animations[this.animName][modAnimFrame]['y'],
            this.x, this.y, 
            this.animations[this.animName][modAnimFrame]['w'],
            this.animations[this.animName][modAnimFrame]['h'],
            this.direction, false
        );
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.scale(2, 2);
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

function flipAndDrawImage(ctx, image, sx,sy, x,y, width, height, flipH, flipV) {
    ctx.save();
    ctx.translate(flipH ? width : 0, flipV ? height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1); 
    ctx.drawImage(image, sx,sy,width, height, flipH?-x:x, y, width, height);
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
