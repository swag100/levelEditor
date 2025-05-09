class Block {
    constructor(x,y,id=0) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;

        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
        this.graphicOffsetX = 0;
        this.graphicOffsetY = 0;

        this.id=id;

        this.image = new Image();
        this.image.src = imagePath + 'blocks.png';
    }

    keyDown(event){}
    keyUp(event){}

    update(levelObjects) {}

    draw(ctx) {
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.drawImage(
            this.image, 
            (this.id % (this.image.naturalWidth / 16)) * this.w, 
            Math.round(this.id / (((this.image.naturalHeight - 1) / 16))) * this.h,
            this.w, this.h,
            Math.floor(this.x - Math.floor(camX)) + this.graphicOffsetX, this.y + this.graphicOffsetY, 
            this.w, this.h
        );

    }
}

class Ground extends Block {
    constructor(x,y) {super(x, y, 0);}
}

class HardBlock extends Block {
    constructor(x,y) {super(x, y, 1);}
}

class BrickBlock extends Block {
    constructor(x,y) {
        super(x, y, 6);

        this.yVelocity =0;

        this.canPunch=true;

        //only can punch when small... when big, brick immediately breaks
        //whatever tile the middle of mario is in gets hit
    }

    update(levelObjects){
        this.graphicOffsetY+=this.yVelocity;
        if(this.graphicOffsetY<0){
            this.yVelocity+=gravity;
        }else{
            this.canPunch=true;
            this.yVelocity=0;
            this.graphicOffsetY=0;
        }
    }

    punch(){
        console.log('i just got punched');

        if(this.canPunch){
            this.canPunch=false;
            this.graphicOffsetY -= 4
        }
    }

    destroy(){
        //TODO
    }
}

class QuestionBlock extends Block {
    constructor(x,y) {
        super(x, y, 3);
    }

}

class Entity {
    constructor(x,y) {
        this.x = x; //10
        this.y = y; //20

        this.yVelocity=0;
        this.xVelocity = 0;

        this.xCollided=false;
        this.onGround=true;

        this.topCollisions=[];

        this.w = 10;//hitbox size
        this.h = 16;
        this.hitboxOffsetX = 3;
        this.hitboxOffsetY = 0;
    }

    keyDown(event){}
    keyUp(event){}

    checkForCollisions(levelObjects) {
        let collisions = [];

        levelObjects.forEach((obj) => {
            if (obj != this){
                if (this.x + this.hitboxOffsetX + this.w > obj.x + obj.hitboxOffsetX && 
                    this.x + this.hitboxOffsetX < obj.x + obj.w + obj.hitboxOffsetX && 
                    this.y + this.hitboxOffsetY + this.h > obj.y + obj.hitboxOffsetY && 
                    this.y + this.hitboxOffsetY < obj.y + obj.h + obj.hitboxOffsetY) 
                {
                    collisions.push(obj);
                }
            }
        });
        return collisions;
    }

    collideX(levelObjects){
        //check for collision x
        this.xCollided=false;
        this.checkForCollisions(levelObjects).forEach((obj) => {
            if(this.xVelocity){
                if (this.xVelocity > 0) {
                    this.x = (obj.x - this.w) + obj.hitboxOffsetX - this.hitboxOffsetX;
                }else{
                    this.x = (obj.x + obj.w) + obj.hitboxOffsetX - this.hitboxOffsetX;
                }
            }

            this.xCollided=true;
            this.xVelocity=0;
        });
    }
    
    collideY(levelObjects){
        //check for collision y
        this.onGround=false;
        this.checkForCollisions(levelObjects).forEach((obj) => {
            if(this.yVelocity){
                if (this.yVelocity > 0) {
                    this.y = (obj.y - this.h) + obj.hitboxOffsetY - this.hitboxOffsetY;
                    this.hitFloor(obj);
                } else {

                    //hit ceiling logic. I am not sorry
                    this.checkForCollisions(levelObjects).forEach((obj) => {
                        this.hitCeiling(obj);
                    })

                    //snap to ceiling if inside
                    this.y = (obj.y + obj.h) + obj.hitboxOffsetY - this.hitboxOffsetY;
                }
            }

            this.yVelocity=0;
        }); 
    }

    hitFloor(obj){this.onGround=true;}
    hitCeiling(obj){}

    update(levelObjects) {
        // move 
        this.yVelocity += downgravity;
        if (this.yVelocity >= terminalVelocity){
            this.yVelocity=terminalVelocity;
        }
        this.y += this.yVelocity;
        this.collideY(levelObjects);

        this.x += this.xVelocity;
        this.collideX(levelObjects);
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

class Player extends Entity {
    constructor(x,y) {
        super(x, y);

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

        this.power = "small";

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
                playSound(this.power + "Jump.wav");
                this.yVelocity-=this.jumpHeight;
                if (!this.crouch){
                    this.animName="Jump";
                }
            }
        }
    }

    hitCeiling(obj){
        if (obj instanceof BrickBlock){ //instanceof PunchableBlock in the future
            //TODO: change it to WHICHEVER ONE HAS A SMALLER DISTANCE IN X from middle of player
            let xDifference = (this.x+(this.w/2)+this.hitboxOffsetX)-obj.x;
            if((xDifference>=0&&xDifference<=obj.w)){
                this.power=="small"?obj.punch():obj.destroy();
            }
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
        
        //unstuck -- FIX SLIDING
        if(!this.crouch&&this.checkForCollisions(levelObjects).length>0){
            this.crouch=true;
            if (this.onGround){
                directionValue=0;
            }
            this.updateHitbox();
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
        if (this.crouch&&this.power!="small"){
            this.animName="Crouch";
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
        let modAnimFrame = 0;
        try{
            modAnimFrame = this.animFrame % this.animations[this.power+this.animName].length;
        }catch{
            console.log('uh oh');
        }

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

const soundPlayer = new Audio();

//debug
const idModal = document.getElementById('idModal');
let debugMode = false;
let hoveredEntity = null;
let selectedEntity = null;
let mousedownBlockKey = null;
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
    '10,20':'Player'
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
                    let indexToRemove = levelObjects.indexOf(getObjectAt(key));
                    levelObjects.splice(indexToRemove, 1);
                }
            }
            
            if (isMouseButtonDown(0)){
                let obj = eval(`new ${idModal.value}(${key[0]},${key[1]})`);
                levelObjects.push(obj);
            }
        }
        if(hoveredEntity&&isMouseButtonDown(2)){
            let indexToRemove = levelObjects.indexOf(hoveredEntity);
            levelObjects.splice(indexToRemove, 1);
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

        if (selectedEntity){
            ctx.fillRect(
                Math.floor(selectedEntity.x + selectedEntity.hitboxOffsetX - Math.floor(camX)), 
                Math.floor(selectedEntity.y + selectedEntity.hitboxOffsetY), 
                selectedEntity.w,
                selectedEntity.h
            );
        } else{
            if (hoveredEntity){
                ctx.fillRect(
                    Math.floor(hoveredEntity.x + hoveredEntity.hitboxOffsetX - Math.floor(camX)), 
                    Math.floor(hoveredEntity.y + hoveredEntity.hitboxOffsetY), 
                    hoveredEntity.w,
                    hoveredEntity.h
                );
            }else {
                let preview_ids = {
                    'Ground': 0,
                    'HardBlock': 1,
                    'BrickBlock': 6,
                    'QuestionBlock': 3,
                    'Player': 0,
                    'Goomba': 0
                }
                let preview_srcs = {
                    'Player': 'mario.png',
                    'Goomba': 'enemies.png'
                }

                let image = new Image();

                image.src = imagePath + 'blocks.png';
                if (Object.keys(preview_srcs).includes(idModal.value)){
                    image.src = imagePath + preview_srcs[idModal.value];
                }

                ctx.drawImage(
                    image, 
                    (preview_ids[idModal.value] % (image.naturalWidth / 16)) * 16,
                    Math.round(preview_ids[idModal.value] / (((image.naturalHeight - 1) / 16))) * 16,
                    16,16,
                    Math.floor((Math.floor((mouseLocation[0]+(camX%256)) / 16) * 16)-(camX%256)), 
                    (Math.floor((mouseLocation[1] - 8) / 16) * 16) + 8, 
                    16,16
                );
            }
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
function play(importing = false) {
    //alert('Im lazy so this doesn\'t work yet!');
    if(debugMode && !importing){
        createLevelData(levelObjects);
    }
    createLevelObjects(levelData); //this should be the ONLY call to this in the future
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
    if (soundPlayer.src){
        soundPlayer.pause();
        soundPlayer.currentTime = 0;

    }
    soundPlayer.src = soundPath + soundURL;
    try {
        soundPlayer.play();
    } catch (error) {
        console.log('sound interrupted');
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
        p[1] >= rect.y && p[1] <= rect.y+rect.h+(rect.hitboxOffsetY*2)
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
function createLevelObjects(levelData){
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
    for (const locationString in levelData){
        if (levelData.hasOwnProperty(locationString)) {
            let objParameters = locationString.split(',');
            let objClass = levelData[locationString] || 'Ground';
            let obj = eval(`new ${objClass}(${objParameters});`);
            newLevelObjects.push(obj);
        }
    }
    levelObjects = newLevelObjects;
}

function createLevelData(levelObjects){
    let newLevelData = {};
    for (obj of levelObjects){
        let newLocationString = obj.x+','+obj.y;
        let classString = obj.constructor.name
        newLevelData[newLocationString] = classString;
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
            play(true);
        };
    }
}

function exportLevel(){
    if (!confirm("Export the level?")){
        return
    }

    createLevelData(levelObjects);

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
