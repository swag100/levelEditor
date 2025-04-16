class Tile {
    constructor(x,y,id=0) {
        this.x = x * 16;
        this.y = y * 16;
        this.w = 16;
        this.h = 16;

        this.id=id;

        this.image = new Image();
        this.image.src = 'tiles.png';
    }

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.drawImage(
            this.image, 
            (this.id % (this.image.naturalWidth / 16)) * this.w,
            Math.floor((this.id < this.id+1 ? 9 : this.id) / (this.image.naturalHeight / 16)) * this.h,
            this.w, this.h,
            this.x, this.y, 
            this.w, this.h
        );

    }
}

class Player {
    constructor(x,y) {
        this.x = x; //10
        this.y = y; //20

        this.yVelocity=0;
        this.xVelocity = 0;

        this.direction=false;//false=right, true=left
        this.animDirection=false;//Used for anims only... Fixes a bug!
        this.running=false;

        this.xCollided=false;
        this.yCollided=true;
        
        this.image = new Image();
        this.image.src = 'mario.png';

        this.sounds = {
            "smallJump": new Audio('smallJump.wav'),
            "largeJump": new Audio('largeJump.wav'),
        };

        this.animations = {
            "die": [
                {"x":0,"y":0,"w":16,"h":16}
            ],

            "smallIdle": [{"x":0,"y":0,"w":16,"h":16}],
            "smallJump": [{"x":80,"y":0,"w":16,"h":16}],
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

        this.w = 10;//hitbox size
        this.h = 16;
        this.hitboxOffsetX = 3;
        this.hitboxOffsetY = 0;

        this.jumpHeightMin=3;
        this.jumpHeightMax=4;

        this.jumpHeight = this.jumpHeightMin;

        this.jumpPadding = 1.6;
        this.acceleration=0.1;
        this.deceleration=0.1;
        this.walkSpeed=1;
        this.runSpeed=2;

    }

    checkForCollisions(theTiles) {
        let collisions = [];

        theTiles.forEach((tile) => {
        if (this.x + this.hitboxOffsetX + this.w > tile.x && 
            this.x + this.hitboxOffsetX < tile.x + tile.w && 
            this.y + this.hitboxOffsetY + this.h > tile.y && 
            this.y + this.hitboxOffsetY < tile.y + tile.h) 
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

        if(directionValue>0)this.direction=false;
        if(directionValue<0)this.direction=true;

        if (this.yCollided){
            this.animDirection=this.direction;
        }

        if (Math.abs(this.xVelocity) >= (this.runSpeed + this.walkSpeed) / 2){
            this.jumpHeight = this.jumpHeightMax;
        }else{
            this.jumpHeight = this.jumpHeightMin;
        }

        //accelerate
        if(directionValue){
            this.xVelocity += this.acceleration * directionValue;
            if (Math.abs(this.xVelocity) >= maxSpeed){
                this.xVelocity = maxSpeed*directionValue;
            }
        //decelerate
        }else{
            this.xVelocity += this.deceleration * ((this.direction * 2)-1);
            
            if ((this.xVelocity/Math.abs(this.xVelocity)) != -((this.direction * 2)-1)){
                this.xVelocity = 0;
            }

        }

        this.x += this.xVelocity;

        //check for collision x
        this.xCollided=false;
        this.checkForCollisions(theTiles).forEach((tile) => {
            if (this.xVelocity >= 0) {
                this.x = tile.x - (this.w + this.hitboxOffsetX);
            } else {
                this.x = tile.x + tile.w - this.hitboxOffsetX;
            }

            this.xCollided=true;
            this.xVelocity=0;
        });
        
        // move 
        this.yVelocity += this.yVelocity >= 0 ? downgravity : gravity;
        if (this.yVelocity >= terminalVelocity){
            this.yVelocity=terminalVelocity;
        }
        this.y += this.yVelocity;

        //check for collision y
        this.yCollided=false;
        this.checkForCollisions(theTiles).forEach((tile) => {
            if (this.yVelocity >= 0) {
                this.y = tile.y - this.h;
            } else {
                this.y = tile.y + tile.h;
            }

            this.yCollided=true;
            this.yVelocity=0;
        });

        //jump
        if (this.yCollided && isKeyDown('KeyW')) {
            //this.sounds["smallJump"].play();
            this.yVelocity-=this.jumpHeight;
            this.animName="smallJump";
        }

        if (this.animName.includes("Jump") && !isKeyDown('KeyW') && this.yVelocity <= -this.jumpPadding) {
            this.yVelocity=-this.jumpPadding;

        }

        //player leaves screen, make them come back
        if (this.y >= 180)this.y = -this.h;

        //switch anims
        if (this.yCollided&&!this.yVelocity){ //get out of jumping
            this.animName="smallWalk";
        }

        if (this.animName!="smallJump"){
            if (this.xVelocity != 0) {
                this.animName="smallWalk";
            }else{
                this.animName="smallIdle";
            }
            if (!this.xCollided && this.yCollided && directionValue && (this.xVelocity/Math.abs(this.xVelocity)) != directionValue){
                this.animName="smallSkid";
            }

        }

        //advance walk anim based off of speed
        if (this.animName.includes('Walk')){
            this.animTick+=this.xVelocity;
            if(Math.floor(this.animTick / this.xVelocity) * this.xVelocity % 12 == 0){
                this.animFrame+=1;
            }
        }
        
    }

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x + this.hitboxOffsetX, this.y, this.w, this.h);

        let modAnimFrame = this.animFrame % this.animations[this.animName].length;
        
        flipAndDrawImage(
            ctx, this.image, 
            this.animations[this.animName][modAnimFrame]['x'],
            this.animations[this.animName][modAnimFrame]['y'],
            this.x, this.y, 
            this.animations[this.animName][modAnimFrame]['w'],
            this.animations[this.animName][modAnimFrame]['h'],
            this.animDirection, false
        );
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.scale(2, 2);
ctx.imageSmoothingEnabled= false;

let keysPressed = {};

//game variables
const gravity = 0.12;
const downgravity = 0.3;
const terminalVelocity = 8;

let thePlayer = new Player(10, 20);
let theTiles = [
    new Tile(0, 9, 0),
    new Tile(1, 9, 0),
    new Tile(2, 9, 0),
    new Tile(3, 9, 0),
    new Tile(4, 9, 0),
    new Tile(5, 9, 7),
    new Tile(6, 8, 8),
    new Tile(7, 9, 9),
    new Tile(8, 9, 10),
    new Tile(9, 9, 11),
    new Tile(10, 9, 12)
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

    theTiles.forEach(function(tile) {
        tile.draw(ctx);
    });
    thePlayer.draw(ctx);
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
    return (Object.keys(keysPressed).includes(keyName) && keysPressed[keyName]);
}

addEventListener("keydown", function(event){
    keysPressed[event.code] = true;
});

addEventListener("keyup", function(event){
    keysPressed[event.code] = false;
});
