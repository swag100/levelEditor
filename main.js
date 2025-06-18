class Block {
    constructor(x,y,id=0,imageName='blocks.png') {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;

        this.imgGridW=16;
        this.imgGridH=16;

        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
        this.graphicOffsetX = 0;
        this.graphicOffsetY = 0;

        this.canCollide=true;

        this.id=id;

        this.image = new Image();
        this.image.src = imagePath + imageName;

        //everything we NEED to know in order to recreate it
        this.exportAttributes=[
            'x','y'
        ]
    }

    keyDown(event){}
    keyUp(event){}

    update(levelObjects) {}

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.drawImage(
            this.image, 
            (this.id % (this.image.naturalWidth / this.imgGridW)) * this.imgGridW, 
            Math.floor(this.id / Math.floor(this.image.naturalWidth / this.imgGridH)) * this.imgGridH,
            this.imgGridW, this.imgGridH,
            Math.floor(this.x - Math.floor(camX)) + Math.floor(this.graphicOffsetX), 
            Math.floor(this.y) + Math.floor(this.graphicOffsetY), 
            this.imgGridW, this.imgGridH
        );

    }
}

class Particle extends Block {
    constructor(x,y,w,h,xVel,yVel,id=0,animLength=0) {
        super(x,y,id,'particles.png');

        this.w = w;
        this.h=h;
        this.imgGridW=w;
        this.imgGridH=h;

        this.xVelocity=xVel;
        this.yVelocity=yVel;
        this.animLength=animLength;
        this.animOffset=id;

        this.animTick=0;

        this.canCollide=false;

        this.exportAttributes=[];//empty means DONT EXPORT
    }
    update(levelObjects){
        this.id=(Math.floor(this.animTick)%this.animLength)+this.animOffset;
        
        this.yVelocity+=downgravity;
        this.y+=this.yVelocity;

        //this.xVelocity*=0.95;
        this.x+=this.xVelocity;

        if(this.y>256){
            removeObjectFromArray(levelObjects, this);
        }

        this.animTick+=0.2;
    }

}

class Ground extends Block {
    constructor(x,y) {super(x, y, 0);}
}

class HardBlock extends Block {
    constructor(x,y) {super(x, y, 1);}
}

class ContainerBlock extends Block { //block with potential to hold something
    constructor(x,y,id,contains=null) {
        super(x,y,id);

        this.item=contains;

        this.yVelocity =0;

        this.canPunch=true;
    }

    update(levelObjects){
        this.graphicOffsetY+=this.yVelocity;
        if(this.graphicOffsetY<0){
            this.yVelocity+=downgravity;
        }else{
            this.yVelocity=0;
            this.graphicOffsetY=0;
        }
    }

    releaseItem(){
        this.id=2; //turn into empty block
    }

    punch(puncher){
        if(this.canPunch){
            this.canPunch=false;
            this.yVelocity-=1.8;

            //release item
            this.releaseItem();
        }
    }
}

class BrickBlock extends ContainerBlock {
    constructor(x,y,contains=null) {
        super(x, y, 6, contains);

        //only can punch when small... when big, brick immediately breaks
        //whatever tile the middle of mario is in gets hit

        //if block contains something, and is hit, removes element
        // when it is empty, IMMEDIATELY becomes empty sprite

    }

    update(levelObjects){
        super.update(levelObjects);

        if(this.yVelocity==0){
            this.canPunch=true;
        }
    }

    releaseItem(){
        if (this.item){
            super.releaseItem();
        }
    }

    punch(puncher){
        if(puncher.power!="small"&&!this.item){
            this.destroy();
        }else{
            super.punch(puncher);
        }
    }

    destroy(){
        playSound("smash.wav");

        removeObjectFromArray(levelObjects, this);

        // create particles
        for (let i =0; i<4;i++){
            let particle = new Particle(
                this.x+((i*8)%this.w)+((i%2==0)*-8)+4, 
                this.y+(Math.floor(i/2)*8)+((Math.floor(i/2)==0)*-8)+4,
                8,8,
                (((i%2==0)*2)-1)*-2,//xvel
                -5,//yvel
                0, 4 //animdata
            );

            levelObjects.push(particle);

        }

    }
}

class QuestionBlock extends ContainerBlock {
    constructor(x,y) {
        super(x, y, 3);

        this.animLength=3;
        this.animOffset=3;

        this.animTick=0;
        this.animSpeed=(5/60);

        this.direction=true;
    }

    update(levelObjects){
        if(this.canPunch){
            let speed=this.animSpeed;
            if(this.animTick<1){
                speed=(2/60);
            }
            this.animTick+=((this.direction*2)-1)*speed;

            if(this.animTick>this.animLength-speed||this.animTick<speed){
                this.direction=!this.direction;
            }
            this.id=(Math.floor(this.animTick)%this.animLength)+this.animOffset;
        }

        super.update(levelObjects);
    }
}

class Coin extends Block{
    constructor(x,y){
        super(x,y,10,'items.png');

        this.canCollide=false;

        this.hitboxOffsetX = 3;
        this.hitboxOffsetY = 2;
        this.w=10;
        this.h=14;

        this.animLength=3;
        this.animOffset=10;

        this.animTick=0;
        this.animSpeed=(5/60);

        this.direction=true;
    }

    update(levelObjects){
        let speed=this.animSpeed;
        if(this.animTick<1){
            speed=(2/60);
        }
        this.animTick+=((this.direction*2)-1)*speed;

        if(this.animTick>this.animLength-speed||this.animTick<speed){
            this.direction=!this.direction;
        }
        this.id=(Math.floor(this.animTick)%this.animLength)+this.animOffset;
    }

    collect(){
        playSound("coin.wav");

        //create some sort of html to display player Lives, player Score, and player Coin count

        removeObjectFromArray(levelObjects, this);
    }
}

class Entity {
    constructor(x,y) {
        this.x = x; //10
        this.y = y; //20

        this.yVelocity=0;
        this.xVelocity = 0;
        
        this.canCollide=true;

        this.xCollided=false;
        this.onGround=true;

        this.w = 10;//hitbox size
        this.h = 16;
        this.hitboxOffsetX = 3;
        this.hitboxOffsetY = 0;

        //everything we NEED to know in order to recreate it
        this.exportAttributes=[
            'x','y'
        ]
    }

    keyDown(event){}
    keyUp(event){}

    collided(obj){
        return (
            this.x + this.hitboxOffsetX + this.w > obj.x + obj.hitboxOffsetX && 
            this.x + this.hitboxOffsetX < obj.x + obj.w + obj.hitboxOffsetX && 
            this.y + this.hitboxOffsetY + this.h > obj.y + obj.hitboxOffsetY && 
            this.y + this.hitboxOffsetY < obj.y + obj.h + obj.hitboxOffsetY
        );
    }

    getCollisions(levelObjects) {
        let collisions = [];

        levelObjects.forEach((obj) => {
            if (this.collided(obj) && obj != this) {
                collisions.push(obj);
            }
        });
        return collisions;
    }

    collideX(levelObjects){
        //check for collision x
        this.xCollided=false;
        this.getCollisions(levelObjects).forEach((obj) => {
            if(obj.canCollide){
                if(this.xVelocity){
                    if (this.xVelocity > 0) {
                        this.x = (obj.x - this.w) + obj.hitboxOffsetX - this.hitboxOffsetX;
                    }else{
                        this.x = (obj.x + obj.w) + obj.hitboxOffsetX - this.hitboxOffsetX;
                    }
                }

                this.xCollided=true;
                this.xVelocity=0;
            }
        });
    }
    
    collideY(levelObjects){
        //check for collision y
        this.onGround=false;
        this.getCollisions(levelObjects).forEach((obj) => {
            if(obj.canCollide){
                if(this.yVelocity){
                    if (this.yVelocity > 0){
                        this.hitFloor(obj);
                    } else {
                        //hit ceiling logic. I am not sorry
                        this.hitCeiling(obj);
                    }

                }
            }
        }); 
    }

    hitFloor(obj){
        this.onGround=true;
        this.yVelocity=0;

        this.y = (obj.y - this.h) + obj.hitboxOffsetY - this.hitboxOffsetY;
    }
    hitCeiling(obj){
        this.yVelocity=0;

        //snap to ceiling if inside
        this.y = (obj.y + obj.h) + obj.hitboxOffsetY - this.hitboxOffsetY;
    }

    applyGravity(){
        this.yVelocity += downgravity;
        if (this.yVelocity >= terminalVelocity){
            this.yVelocity=terminalVelocity;
        }
    }

    update(levelObjects) {
        // move 
        this.applyGravity();

        this.x += this.xVelocity;
        this.collideX(levelObjects);

        this.y += this.yVelocity;
        this.collideY(levelObjects);
    }
    draw(ctx) {
        if (!Object.hasOwn(this, 'image'));{
            ctx.fillStyle = '#f00';
            ctx.fillRect(Math.floor(this.x - camX),Math.floor(this.y), 1, 1)
            ctx.fillStyle = '#00f';
            ctx.fillRect(
                Math.floor(this.x - camX + this.hitboxOffsetX),
                Math.floor(this.y + this.hitboxOffsetY),
                this.w,
                this.h
            )
        }
    }
}

class Enemy extends Entity{ //maybe add more to this...
    constructor(x,y,facing){
        super(x,y);

        this.direction=facing;

        this.image = new Image();
        this.image.src = imagePath + 'enemies.png';

        this.animations = {};
        this.animFrame;
        this.animName;
    }

    stomp(stomper){} // enemies handle this in many different ways

    draw(ctx){
        let modAnimFrame = Math.floor(this.animFrame) % this.animations[this.animName].length;

        let size=[
            this.animations[this.animName][modAnimFrame]['w'],
            this.animations[this.animName][modAnimFrame]['h']
        ]

        ctx.drawImage(
            this.image, 
            this.animations[this.animName][modAnimFrame]['x'],
            this.animations[this.animName][modAnimFrame]['y'],
            size[0], size[1],
            Math.floor(this.x) - Math.floor(camX), Math.floor(this.y), 
            size[0], size[1]
        );
    }
}

class Goomba extends Enemy {
    constructor(x,y,facing=true){
        super(x,y,facing);

        this.hitboxOffsetY=2;
        this.h=14;

        this.animations = {
            "die": [{"x":32,"y":0,"w":16,"h":16}],
            "walk": [
                {"x":0,"y":0,"w":16,"h":16},
                {"x":16,"y":0,"w":16,"h":16}
            ]
        };
        this.animFrame=0;
        this.animName="walk";

        this.dead=false;
        this.animFrameOnDeath;

        this.canCollide = false;
    }

    stomp(stomper){
        this.animName="die";
        this.animFrameOnDeath=this.animFrame;
        this.dead=true;
    }

    update(levelObjects){
        this.animFrame+=(3/60);
        if(this.dead){
            if(this.animFrame-this.animFrameOnDeath>=1.5){
                removeObjectFromArray(levelObjects,this);
            }
            return;
        }

        this.xVelocity=0.5*((this.direction*2)-1);

        this.applyGravity();

        this.x += this.xVelocity;
        if (this.getCollisions(levelObjects).length>0 ||
            this.x <= camBoundsLeft ||
            this.x + this.w + (this.hitboxOffsetX * 2) >= camBoundsRight + 256){
            this.direction=!this.direction;
        }
        this.collideX(levelObjects);

        this.y += this.yVelocity;
        this.collideY(levelObjects);

    }
}

class Player extends Entity {
    constructor(x,y,power="small") {
        super(x, y);

        this.canCollide=true;

        this.direction=false;//false=right, true=left
        this.animDirection=false;//Used for anims only... Fixes a bug!
        this.running=false;
        this.crouch=false;

        this.image = new Image();
        this.image.src = imagePath + 'mario.png';

        this.animations = {
            "die": [
                {"x":112,"y":0,"w":16,"h":16}
            ],

            "smallCrouch": [{"x":0,"y":0,"w":16,"h":16}],
            "smallIdle": [{"x":0,"y":0,"w":16,"h":16}],
            "smallJump": [{"x":80,"y":0,"w":16,"h":16}],
            "smallSkid": [{"x":64,"y":0,"w":16,"h":16}],
            "smallWalk": [
                {"x":16,"y":0,"w":16,"h":16},
                {"x":32,"y":0,"w":16,"h":16},
                {"x":48,"y":0,"w":16,"h":16}
            ],

            "largeCrouch": [{"x":96,"y":16,"w":16,"h":32}],
            "largeIdle": [{"x":0,"y":16,"w":16,"h":32}],
            "largeJump": [{"x":80,"y":16,"w":16,"h":32}],
            "largeSkid": [{"x":64,"y":16,"w":16,"h":32}],
            "largeWalk": [
                {"x":16,"y":16,"w":16,"h":32},
                {"x":32,"y":16,"w":16,"h":32},
                {"x":48,"y":16,"w":16,"h":32}
            ]
        };

        this.power = power;
        this.exportAttributes.push('power');
        this.updateHitbox();

        this.animName = "Idle";
        this.animFrame = 0;
        this.animTick=0; // the thing we increment every update

        this.sameFrameCount=0; // I hate this dumb bug, but I love being lazy

        this.jumpHeightMin=4.1;
        this.jumpHeightMax=4.5;

        this.jumpHeight = this.jumpHeightMin;

        this.acceleration=0.12;
        this.deceleration=0.1;
        this.walkSpeed=1;
        this.runSpeed=2.6;

        this.absVelocity=0;
    }

    keyDown(event){
        if(debugMode){
            //debug code - no need to remove!!
            if(event.code=="ControlLeft"){
                this.power = this.power=="large"?"small":"large";
                this.y-= this.power=="large"?16:-16;
                this.updateHitbox();
                update(levelObjects);
            }
        }else{
            //jump
            if (event.code=="KeyW" && !debugMode && this.onGround) {
                playSound("player/"+this.power + "Jump.wav");
                this.yVelocity-=this.jumpHeight;
                if (!this.crouch){
                    this.animName="Jump";
                }
            }
        }
    }

    hitFloor(obj){
        if(obj instanceof Enemy){
            if(!obj.dead){
                playSound("stomp.wav"); 
                obj.stomp(this);
            }

            this.yVelocity=-this.jumpHeightMax;
        }else{
            super.hitFloor(obj);
        }

        //stop jump sound when land
        if(soundsActive["player/"+this.power+"Jump.wav"]){
            stopSound("player/"+this.power + "Jump.wav");
        }
    }

    hitCeiling(obj){
        super.hitCeiling(obj);

        playSound("bump.wav"); 
        stopSound("player/"+this.power + "Jump.wav");
        
        if(obj instanceof ContainerBlock){
            let blockToHit;

            for (const obj of collidedBlocks){
                let xDifference = (this.x+(this.w/2)+this.hitboxOffsetX)-obj.x;

                let leftAdjacent= getObjectAt([obj.x-16,obj.y]);
                let rightAdjacent= getObjectAt([obj.x+16,obj.y]);

                if(
                    (xDifference>0&&xDifference<obj.w) ||
                    (xDifference<0&&!leftAdjacent) ||
                    (xDifference>obj.w&&!rightAdjacent)
                ){
                    blockToHit = obj;
                }

            }
            blockToHit.punch(this);
        }
    }

    updateHitbox(){
        switch(this.power){
            case "large":
                this.h = 30;
                this.hitboxOffsetY = 2;
                if(this.crouch){
                    this.h = 14;
                    this.hitboxOffsetY = 18;
                }
                break;
            default:
                this.w = 10;//hitbox size
                this.h = 14;
                this.hitboxOffsetX = 3;
                this.hitboxOffsetY = 2;
                break;
        }
    }

    update(levelObjects) {
        //move
        this.running = isKeyDown('ShiftLeft');
        this.crouch = isKeyDown('KeyS') && this.power!="small" && this.animName!="Jump";

        let directionValue= isKeyDown('KeyD') - isKeyDown('KeyA');
        let maxSpeed = this.running ? this.runSpeed : this.walkSpeed;

        if(directionValue>0)this.direction=false;
        if(directionValue<0)this.direction=true;

        if (this.onGround){
            this.animDirection=this.direction;
        }

        //do it here so we dont move but still change direction
        if (this.onGround && this.crouch){
            directionValue=0;
        }

        //make you jump higher when go fast
        if (directionValue){
            if (Math.abs(this.xVelocity)>this.absVelocity){
                this.absVelocity = Math.abs(this.xVelocity);
            }

        }else{
            this.absVelocity = 0;
        }
        if (!this.xVelocity){
            this.absVelocity = 0;
        }
        if (this.absVelocity >= (this.walkSpeed+this.runSpeed)/2){
            this.jumpHeight = this.jumpHeightMax;
        }else{
            this.jumpHeight = this.jumpHeightMin;
        }

        //handle powerups
        this.updateHitbox();
        
        //unstuck
        if(this.getCollisions(levelObjects).length>0&&!this.crouch){
            this.crouch=true;
            if (this.onGround){
                directionValue=0;
            }
            this.updateHitbox();
        }

        for (const obj of this.getCollisions(levelObjects)){
            if(obj instanceof Coin){ 
                obj.collect(); 
            }
            //only takes ONE non cancollide object to unstuck...
            // This causes the collisions to freak out when stomping more than one goomba

            //this is hardcoded for now. How can i make this more generic?
            //posible ideas is a Collectable class
        }

        //accelerate
        if(directionValue){
            this.xVelocity += directionValue * this.acceleration;
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
        this.collideX(levelObjects);

        //cam
        //This was a complete nightmare. 
        if(this.x <= camBoundsLeft){
            this.x = camBoundsLeft;
            this.xVelocity =0;
            this.xCollided=true;
        }
        if(this.x + this.w + (this.hitboxOffsetX * 2) >= camBoundsRight + 256){
            this.x = camBoundsRight + 256 - this.w - (this.hitboxOffsetX * 2);
            this.xVelocity =0;
            this.xCollided=true;
        }
        if (this.x > camX+camPaddingRight && camX < camBoundsRight){
            camX += this.xVelocity;
            if (this.x > camX+camPaddingRight){
                camX +=1;
            }
        }
        if (this.x < camX+camPaddingLeft && camX > camBoundsLeft){
            camX += this.xVelocity;
            if (this.x < camX+camPaddingLeft){
                camX -=1;
            }
        }

        //player leaves screen, make them come back
        if (this.y >= 488)this.y = -this.h;

        //switch anims
        if (this.onGround&&!this.yVelocity){ //get out of jumping
            this.animName="Walk";
        }

        if (!this.animName.includes('Jump')){
            if (this.xVelocity != 0) {
                this.animName="Walk";
            }else{
                this.animName="Idle";
            }
            if (!this.xCollided && this.onGround && directionValue && (this.xVelocity/Math.abs(this.xVelocity)) != directionValue){
                this.animName="Skid";
            }
        }
        if (this.crouch){
            this.animName="Crouch";
            if(this.power=="small"){
                this.crouch=false;
            }
        }

        //advance walk anim based off of speed
        let oldAnimFrame = this.animFrame;
        if (this.animName=='Walk'&&!this.yVelocity){
            this.animTick-=(Math.ceil(Math.abs(this.xVelocity)) / 2) * 2;
            
            if(Math.floor(this.animTick) % 9 == 0){
                this.animFrame+=1;
            }
        }
        if (oldAnimFrame==this.animFrame){
            this.sameFrameCount+=1
        }else{
            this.sameFrameCount=0;
        }
        if (this.running&&this.sameFrameCount>3){
            this.animTick+=1;
        }

        // move 
        this.yVelocity += !isKeyDown('KeyW') || this.yVelocity >= 0 ? downgravity : gravity;
        if (this.yVelocity >= terminalVelocity){
            this.yVelocity=terminalVelocity;
        }
        this.y += this.yVelocity;
        this.collideY(levelObjects);

        //jump padding
        if (this.animName.includes("Jump") && !isKeyDown('KeyW') && this.yVelocity <= -2) {
            this.yVelocity=-2;
        }
    }

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);
        let modAnimFrame = this.animFrame % this.animations[this.power+this.animName].length;

        //console.log(this.power+this.animName);
        
        flipAndDrawImage(
            ctx, this.image, 
            this.animations[this.power+this.animName][modAnimFrame]['x'],
            this.animations[this.power+this.animName][modAnimFrame]['y'],
            Math.floor(this.x - Math.floor(camX)), Math.floor(this.y), 
            this.animations[this.power+this.animName][modAnimFrame]['w'],
            this.animations[this.power+this.animName][modAnimFrame]['h'],
            this.animDirection, false
        );
    }
}

const imagePath = 'resources/images/';
const soundPath = 'resources/sounds/';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.scale(2, 2);
ctx.imageSmoothingEnabled= false;

const soundsActive = [];

//debug
const idModal = document.getElementById('idModal');
let debugMode = false;
let hoveredEntity = null;
let selectedEntity = null;
let cuteSelectionOffset = [0,0];//cute

let mouseLocation = [0,0];
let mouseButtonsPressed = {};
let keysPressed = {};

//game variables
const gravity = 0.12;
const downgravity = 0.36;
const terminalVelocity = 8;

//cam
let camX = 0;
let camPaddingLeft = 32; 
let camPaddingRight = 144;
let camBoundsLeft = 0;
let camBoundsRight = 0; //length of level

//level data
let defaultLevelData = {
    '0,216':0,'16,216':0,'32,216':0,'48,216':0,'64,216':0,
    '0,232':0,'16,232':0,'32,232':0,'48,232':0,'64,232':0,
    '10,20,\'small\'':'Player'
};
let levelData = defaultLevelData;

let levelObjects = [];
//let thePlayer = new Player(10, 20);

play();

//functions
function update() {
    if (debugMode){ //dont update any entities, so they can be dragged
        if (selectedEntity && mouseInBounds()){
            selectedEntity.x = mouseLocation[0] + cuteSelectionOffset[0];
            selectedEntity.y = mouseLocation[1] + cuteSelectionOffset[1];
        }

        //No forgiveness needed.
        if (!selectedEntity && !hoveredEntity && mouseInBounds()){
            const key = getBlockPosition(mouseLocation);

            if (isMouseButtonDown(0) || isMouseButtonDown(2)){
                if (getObjectAt(key)){
                    removeObjectFromArray(levelObjects,getObjectAt(key));
                }
            }
            
            if (isMouseButtonDown(0)){
                let obj = eval(`new ${idModal.value}(${key[0]},${key[1]})`);
                levelObjects.push(obj);
            }
        }
        if(hoveredEntity&&isMouseButtonDown(2)){
            removeObjectFromArray(levelObjects,hoveredEntity);
            hoveredEntity = null;
        }

        //cam control
        if (isKeyDown('ShiftLeft')){
            if(isKeyDown('KeyD'))camX+=6;
            if(isKeyDown('KeyA'))camX-=6;
        }else{
            if(isKeyDown('KeyD'))camX+=3;
            if(isKeyDown('KeyA'))camX-=3;
        }
    }else{
        for (const obj of levelObjects){
            obj.update(levelObjects);
        }
    }
    
    //limit cam
    if (camX <= camBoundsLeft){
        camX = camBoundsLeft;
    }
    if (camX>=camBoundsRight){
        camX = camBoundsRight;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    for (const tile of levelObjects){
        tile.draw(ctx);
    }

    canvas.style.cursor = 'auto';

    //debug
    if (debugMode){
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.5;
        
        canvas.style.cursor = 'pointer';

        let entities = [];
        for (const obj of levelObjects){
            if (obj instanceof Entity){
                entities.push(obj);
            }
        }
    
        for (const entity of entities){
            let camMouseLocation = [mouseLocation[0]+Math.floor(camX),mouseLocation[1]];

            hoveredEntity = null;
            if (pointInRect(camMouseLocation, entity)){
                hoveredEntity = entity;
                break;
            }
        }

        let entity=selectedEntity||hoveredEntity;
        if (entity){
            canvas.style.cursor = 'grab';
            if(selectedEntity){
                canvas.style.cursor = 'grabbing';
            }

            ctx.fillRect(
                Math.floor(entity.x + entity.hitboxOffsetX - Math.floor(camX)), 
                Math.floor(entity.y + entity.hitboxOffsetY), 
                entity.w,
                entity.h
            );
        }else{
            let preview_ids = {
                'Ground': 0,
                'HardBlock': 1,
                'CloudBlock': 7,
                'BrickBlock': 6,
                'QuestionBlock': 3,
                'Coin': 10,
                'Player': 0,
                'Goomba': 0
            }
            let preview_srcs = {
                'Coin': 'items.png',
                'Player': 'mario.png',
                'Goomba': 'enemies.png'
            }

            let image = new Image();
            let id = preview_ids[idModal.value];

            image.src = imagePath + 'blocks.png';
            if (Object.keys(preview_srcs).includes(idModal.value)){
                image.src = imagePath + preview_srcs[idModal.value];
            }

            ctx.drawImage(
                image, 
                (id % (image.naturalWidth / 16)) * 16, 
                Math.floor(id / Math.floor(image.naturalWidth / 16)) * 16,
                16,16,
                (Math.floor((mouseLocation[0]+(camX%256)) / 16) * 16)-(Math.floor(camX)%256), 
                (Math.floor((mouseLocation[1] - 8) / 16) * 16) + 8, 
                16,16
            );
        }
        
    }
    //end of debug
}

function main() {
    update();
    draw();
    requestAnimationFrame(main); //runs as fast as monitor refresh rate
}

//setInterval(main, (1000 / 60));
requestAnimationFrame(main);

//play
function play() {
    //alert('Im lazy so this doesn\'t work yet!');
    updateLevelObjects(levelData);
    updateLevelData(levelObjects);
    if (debugMode){
        toggleLevelEditor();
    }
}

//utils
function getObjectAt(location){
    for (obj of levelObjects){
        if (obj.x == location[0] && obj.y == location[1]){
            return obj
        }
    }
    return null
}

function getBlockPosition(position){
    return [
        Math.floor((Math.floor(position[0])+Math.floor(camX)) / 16)*16,
        (Math.floor((Math.floor(position[1]+ 8)) / 16)*16)-8
    ];
}

function playSound(soundURL) {
    const sound = new Audio(soundPath + soundURL);
    sound.addEventListener('ended', () => {
        delete soundsActive[soundURL];
    });
    soundsActive[soundURL] = sound;

    sound.play();
}
function stopSound(soundURL) {
    if(soundsActive[soundURL]){
        soundsActive[soundURL].pause();
        delete soundsActive[soundURL];
    }
}

function flipAndDrawImage(ctx, image, sx,sy, x,y, width, height, flipH, flipV) {
    ctx.save();
    ctx.translate(flipH ? width : 0, flipV ? height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1); 
    ctx.drawImage(image, sx,sy,width, height, flipH?-x:x, y, width, height);
    ctx.restore();
}

function isKeyDown(keyName) {
    return (keysPressed[keyName]);
}

function isMouseButtonDown(buttonName) {
    return (mouseButtonsPressed[buttonName]);
}

addEventListener("keydown", function(event){
    keysPressed[event.code] = true;

    for (const obj of levelObjects){obj.keyDown(event);}
});
addEventListener("keyup", function(event){
    keysPressed[event.code] = false;

    for (const obj of levelObjects){obj.keyUp(event);}
});

onmousemove = function(event){
    var rect = canvas.getBoundingClientRect();
    mouseLocation = [(event.clientX - rect.left)/2, (event.clientY - rect.top)/2]
}

function pointInRect(p,rect){
    return (
        p[0] >= rect.x && p[0] <= rect.x+rect.w+(rect.hitboxOffsetX*2) && 
        p[1] >= rect.y && p[1] <= rect.y+rect.h+rect.hitboxOffsetY
    );
}

function mouseInBounds(){
    return (
        mouseLocation[0] > 0 && 
        mouseLocation[0] < 256 &&
        mouseLocation[1] > 0 && 
        mouseLocation[1] < 244
    );
}

function removeObjectFromArray(array, object){
    let indexToRemove = array.indexOf(object);
    array.splice(indexToRemove, 1);
}

//i stole this. https://stackoverflow.com/questions/13405129/
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

//level editor

//IMPORTANT function. call whenever we want to play level. So exit editor / click play button
//Update REAL tiles -- in level editor, we just PREVIEW the data using tileData + entityData
//no need for tileData and entityData to be seperate; both just need X and Y coordinates + class
//infact, EVERY tile like ground and hard block SHOULD just be their own classes, yet I'm lazy...
function updateLevelObjects(levelData, ignorePlayer=false){
    /*theBlocks = [];
    for (const locationString in levelData) {
        if (levelData.hasOwnProperty(locationString)) {
            let xy = locationString.split(',');
            
            theBlocks.push(new Tile(xy[0], xy[1], levelData[locationString]));
            // this is where youd make a new class, eg. BrickBlock
            // entities: use a SpawnerBlock(entity), will not say block in the dropdown menu
            // actually... You could even use this for Bricks and ?s TOO!
            // the SpawnerBlock just CREATES the object when level is played / editor is EXITED
        }
    }*/
    let newLevelObjects = [];

    if(ignorePlayer){
        let playerObjects=[];
        for (const obj of levelObjects){
            if(obj instanceof Player){
                playerObjects.push(obj);
            }
        }
        newLevelObjects = newLevelObjects.concat(playerObjects);
    }

    for (const parametersString in levelData){
        if (levelData.hasOwnProperty(parametersString)) {
            let objClass = levelData[parametersString] || 'Ground';
            let obj = eval(`new ${objClass}(${parametersString});`);

            if(!(ignorePlayer&&objClass=="Player")){
                newLevelObjects.push(obj);
            }
        }
    }
    levelObjects = newLevelObjects;
}

function updateLevelData(levelObjects){
    let newLevelData = {};
    for (const obj of levelObjects){
        let newParametersString = '';
        for (let i = 0; i < obj.exportAttributes.length; i++){
            let attrName = obj.exportAttributes[i];
            let attrValue = obj[attrName];
            if(typeof attrValue === 'string'){
                attrValue=`\'${attrValue}\'`;
            }
            newParametersString+=attrValue;

            if (i!=obj.exportAttributes.length-1){
                newParametersString+=',';
            }
        }

        let classString = obj.constructor.name

        if(obj.exportAttributes.length){
            newLevelData[newParametersString] = classString;
        }
    }
    levelData = newLevelData;
}

//html things
function toggleLevelEditor(event){
    debugMode = !debugMode;

    let leButton = document.getElementById('enterLevelEditorButton');
    let le = document.getElementById('levelEditor');

    leButton.innerHTML = debugMode ? 'Exit Level Editor' : 'Enter Level Editor';
    le.style.display = debugMode ? 'block' : 'none';

    if(!debugMode){ //switched out of debug, save level data
        updateLevelData(levelObjects);
    }else{
        //reset all objects, except for player(s)
        updateLevelObjects(levelData, true);
    }
}

function hideShow(link){
    let instructions = link.parentElement;
    let instructionsList = instructions.lastElementChild;
    let show = instructionsList.style.display=='none';
    instructionsList.style.display = show?'block':'none';

    instructions.style.borderStyle=show?'revert':'solid';
    instructions.style.borderColor=show?'revert':'white';

    instructions.style.borderTopStyle='revert';
    instructions.style.borderTopColor='revert';

    instructions.style.marginBottom=show?'10px':'-24px';

    link.innerHTML=show?'hide':'show';
}

function updateLevelLength(element){
    document.getElementById('lengthOutput').innerHTML = (Number(element.value)+256)+'px'; 
    camBoundsRight = Number(document.getElementById('lengthModal').value); 
    //Value of this is a string, and is why MY CAM CODE HASNT BEEN WORKING
    //console.log(camBoundsRight);
}

addEventListener("mousedown", (event) => {
    mouseButtonsPressed[event.button] = true;

    //start drag
    if(event.button == 0 && hoveredEntity){
        cuteSelectionOffset = [
            hoveredEntity.x - mouseLocation[0],
            hoveredEntity.y - mouseLocation[1]
        ];
        selectedEntity = hoveredEntity;
    }
});

addEventListener("mouseup", (event) => {
    mouseButtonsPressed[event.button] = false;

    if(selectedEntity){
        selectedEntity=null;
    }
});

addEventListener('contextmenu', (event) => {
    if (debugMode &&mouseInBounds()){
        event.preventDefault();
    }
});

//io
const importInput = document.getElementById('importLevelInput');
const importButton = document.getElementById('importLevelButton');
importInput.addEventListener('change', importLevel);
importButton.addEventListener('click', ()=>{
    importInput.click();
})

function importLevel(event){
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event) {
            let data = JSON.parse(event.target.result);

            document.getElementById('levelTitle').value = data['levelTitle'];
            document.getElementById('lengthOutput').innerHTML = data['levelLength']+'px';
            document.getElementById('lengthModal').value = data['levelLength'];

            camBoundsRight = Number(data['levelLength']);
            camX =Number(data['cameraPosition']);
            
            levelData = data['levelData'];
            play();
        };
    }
}

function exportLevel(){
    if (!confirm("Export the level?")){
        return
    }

    updateLevelData(levelObjects);

    let data = {
        'levelTitle': document.getElementById('levelTitle').value,
        'levelLength': document.getElementById('lengthModal').value,
        'cameraPosition': camX,
        'levelData': levelData
    }

    download(
        JSON.stringify(data), 
        data['levelTitle'] || 'untitled', 
        'application/json'
    );
}
