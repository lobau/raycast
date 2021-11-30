var $ = function (id) { return document.getElementById(id); };
var dc = function (tag) { return document.createElement(tag); };

function setPixel(imageData, x, y, r, g, b, a) {
    let index = (x + y * imageData.width) * 4;
    imageData.data[index + 0] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
    imageData.data[index + 3] = a;
}

function getPixel(imageData, x, y) {
    let index = (x + y * imageData.width) * 4;
    return {
        r: imageData.data[index + 0],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3]
    };
}

// Holds information about a wall hit from a single ray
class RayHit {
    constructor() {
        this.strip = 0; // screen column
        this.tileX = 0; // where inside the wall that was hit, used for texture mapping
        this.distance = 0; // distance between player and wall
        this.correctDistance = 0; // distance to correct for fishbowl effect
        this.horizontal = false; // horizontal wall hit?
        this.wallType = 0; // type of wall
        this.rayAngle = 0; // angle of ray hitting the wall
    }
}

var map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 0, 3, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1],
    [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 4, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 4, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 4, 3, 3, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 3, 3, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];


const TILE_SIZE = 128; // Length of a wall or cell in game units.
const TEXTURE_SIZE = 64; // length of wall textures in pixels
const MAP_WIDTH = map[0].length;
const MAP_HEIGHT = map.length;
const MINIMAP_SCALE = 4;
const DISPLAY_WIDTH = 600;
const DISPLAY_HEIGHT = 240;
const STRIP_WIDTH = 1;
const FOV_DEGREES = 100;
const FOV_RADIANS = FOV_DEGREES * Math.PI / 180; // FOV in radians
const RAY_COUNT = Math.ceil(DISPLAY_WIDTH / STRIP_WIDTH);
const VIEW_DIST = (DISPLAY_WIDTH / 2) / Math.tan((FOV_RADIANS / 2));
const TWO_PI = Math.PI * 2;
const TEXTURE_FLOOR_ON = true;
const TEXTURE_CEILING_ON = true;

var player = {
    x: 16 * TILE_SIZE, // current x, y position in game units
    y: 10 * TILE_SIZE,
    z: 0,
    dir: 0,    // the direction that the player is turning, either -1 for left or 1 for right.
    rot: 0,    // the current angle of rotation. Counterclockwise is positive.
    speed: 0,    // is the playing moving forward (speed = 1) or backwards (speed = -1).
    moveSpeed: (TILE_SIZE / 6),  // how far (in map units) does the player move each step/update
    rotSpeed: 4 * Math.PI / 180  // how much does the player rotate each step/update (in radians)
}

var g_ceilingHeight = 1;
var g_mainCanvas;
var g_mainCanvasContext;
var g_backbuffer;
var g_floorimagedata;
var g_floorimagedata2;
var g_ceilingimagedata;

function init() {
    bindKeys();
    initScreen();
    drawMiniMap();
    gameCycle();
}

function initScreen() {
    g_maincanvas = document.getElementById('mainCanvas');
    g_mainCanvasContext = g_maincanvas.getContext('2d');
    g_maincanvas.width = DISPLAY_WIDTH;
    g_maincanvas.height = DISPLAY_HEIGHT;
    
    // Make sure that nothing gets drawn blurry (otherwise walls are blurry)
    g_mainCanvasContext.mozImageSmoothingEnabled = false;
    g_mainCanvasContext.webkitImageSmoothingEnabled = false;
    g_mainCanvasContext.msImageSmoothingEnabled = false;
    g_mainCanvasContext.imageSmoothingEnabled = false;
    loadFloorCeilingImages();
}

function loadFloorCeilingImages() {
    // Draw images on this temporary canvas to grab the ImageData pixels
    let canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    let context = canvas.getContext('2d');

    // Save floor image pixels
    let floorimg = document.getElementById('floorimg');
    context.drawImage(floorimg, 0, 0, floorimg.width, floorimg.height);
    g_floorimagedata = context.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // Save ceiling image pixels
    let ceilingimg = document.getElementById('ceilingimg');
    context.drawImage(ceilingimg, 0, 0, ceilingimg.width, ceilingimg.height);
    g_ceilingimagedata = context.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

// bind keyboard events to game functions (movement, etc)
function bindKeys() {
    document.onkeydown = function (e) {
        e = e || window.event;
        switch (e.keyCode) { // which key was pressed?
            case 38: // up, move player forward, ie. increase speed
                player.speed = 1;
                break;
            case 40: // down, move player backward, set negative speed
                player.speed = -1;
                break;
            case 37: // left, rotate player left
                player.dir = -1;
                break;
            case 39: // right, rotate player right
                player.dir = 1;
                break;
        }
    }

    document.onkeyup = function (e) {
        e = e || window.event;
        switch (e.keyCode) {
            case 38:
            case 40:
                player.speed = 0; // stop the player movement when up/down key is released
                break;
            case 37:
            case 39:
                player.dir = 0;
                break;
        }
    }
}

function gameCycle() {
    move();
    updateMiniMap();
    let rayHits = [];
    castRays(rayHits);
    drawWorld(rayHits);
    // setTimeout(gameCycle, 1000 / 60);
    window.requestAnimationFrame(gameCycle);
}

function stripScreenHeight(screenDistance, correctDistance, heightInGame) {
    return Math.round(screenDistance / correctDistance * heightInGame);
}

function drawWallStrip(rayHit, textureX, textureY, wallScreenHeight) {
    let swidth = 1;
    let sheight = TEXTURE_SIZE;
    let imgx = rayHit.strip * STRIP_WIDTH;
    let imgy = (DISPLAY_HEIGHT - wallScreenHeight) / 2;
    let imgw = STRIP_WIDTH;
    let imgh = wallScreenHeight;
    g_mainCanvasContext.drawImage(wallsimg, textureX, textureY, swidth, sheight, imgx, imgy, imgw, imgh);
    for (let level = 1; level < g_ceilingHeight; ++level) {
        g_mainCanvasContext.drawImage(wallsimg, textureX, textureY, swidth, sheight, imgx, imgy - level * wallScreenHeight, imgw, imgh);
    }
}

function drawFloor(rayHits) {

    // Solid Color
    if (!TEXTURE_FLOOR_ON) {
        for (let y = DISPLAY_HEIGHT / 2; y < DISPLAY_HEIGHT; ++y) {
            for (let x = 0; x < DISPLAY_WIDTH; ++x) {
                setPixel(g_backbuffer, x, y, 113, 113, 113, 255);
            }
        }
        return;
    }

    // Textured
    for (let i = 0; i < rayHits.length; ++i) {
        let rayHit = rayHits[i];
        let wallScreenHeight = stripScreenHeight(VIEW_DIST, rayHit.correctDistance, TILE_SIZE);
        let centerPlane = DISPLAY_HEIGHT / 2;
        let eyeHeight = TILE_SIZE / 2 + player.z;
        let screenX = rayHit.strip * STRIP_WIDTH;
        let screenY = Math.floor((DISPLAY_HEIGHT - wallScreenHeight) / 2) + wallScreenHeight;
        if (screenY < centerPlane) {
            screenY = centerPlane;
        }
        let cosFactor = 1 / Math.cos(player.rot - rayHit.rayAngle);
        for (; screenY < DISPLAY_HEIGHT; screenY++) {
            let straightDistance = (VIEW_DIST * eyeHeight) / (screenY - centerPlane);
            let diagonalDistance = straightDistance * cosFactor;

            let xEnd = diagonalDistance * Math.cos(rayHit.rayAngle);
            let yEnd = diagonalDistance * -Math.sin(rayHit.rayAngle);

            xEnd += player.x;
            yEnd += player.y;

            let x = Math.floor(xEnd) % TILE_SIZE;
            let y = Math.floor(yEnd) % TILE_SIZE;

            let tileX = Math.floor(xEnd / TILE_SIZE);
            let tileY = Math.floor(yEnd / TILE_SIZE);
            if (x < 0 || y < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) {
                continue;
            }
            let textureX = Math.floor(x / TILE_SIZE * TEXTURE_SIZE);
            let textureY = Math.floor(y / TILE_SIZE * TEXTURE_SIZE);
            let srcPixel = getPixel(g_floorimagedata, textureX, textureY);
            for (var j = 0; j < STRIP_WIDTH; j++) {
                setPixel(g_backbuffer, screenX + j, screenY, srcPixel.r, srcPixel.g, srcPixel.b, 255);
            }
        }
    }
}

function drawCeiling(rayHits) {

    // Solid Color
    if (!TEXTURE_CEILING_ON) {
        for (let y = 0; y < DISPLAY_HEIGHT / 2; ++y) {
            for (let x = 0; x < DISPLAY_WIDTH; ++x) {
                setPixel(g_backbuffer, x, y, 56, 56, 56, 255);
            }
        }
        return;
    }

    for (let i = 0; i < rayHits.length; ++i) {
        let rayHit = rayHits[i];
        let wallScreenHeight = stripScreenHeight(VIEW_DIST, rayHit.correctDistance, TILE_SIZE);
        let centerPlane = DISPLAY_HEIGHT / 2;
        let eyeHeight = TILE_SIZE / 2 + player.z;
        let highestCeilingTop = g_ceilingHeight * TILE_SIZE;
        let screenX = rayHit.strip * STRIP_WIDTH;
        let screenY = Math.floor((DISPLAY_HEIGHT - wallScreenHeight) / 2) + wallScreenHeight - 1;
        if (screenY < centerPlane) {
            screenY = centerPlane;
        }
        let cosFactor = 1 / Math.cos(player.rot - rayHit.rayAngle);
        for (; screenY >= 0; screenY--) {
            let ceilingHeight = TILE_SIZE * g_ceilingHeight;
            let straightDistance = (VIEW_DIST * (ceilingHeight - eyeHeight)) / (centerPlane - screenY);
            let diagonalDistance = straightDistance * cosFactor;

            let xEnd = diagonalDistance * Math.cos(rayHit.rayAngle);
            let yEnd = diagonalDistance * -Math.sin(rayHit.rayAngle);

            xEnd += player.x;
            yEnd += player.y;

            let x = Math.floor(xEnd) % TILE_SIZE;
            let y = Math.floor(yEnd) % TILE_SIZE;

            let tileX = Math.floor(xEnd / TILE_SIZE);
            let tileY = Math.floor(yEnd / TILE_SIZE);
            if (x < 0 || y < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) {
                continue;
            }
            let textureX = Math.floor(x / TILE_SIZE * TEXTURE_SIZE);
            let textureY = Math.floor(y / TILE_SIZE * TEXTURE_SIZE);
            let srcPixel;
            if ((tileX + tileY) % 2) {
                srcPixel = getPixel(g_ceilingimagedata, textureX, textureY);
            }
            else {
                srcPixel = getPixel(g_ceilingimagedata, textureX, textureY);
            }
            for (var j = 0; j < STRIP_WIDTH; j++) {
                setPixel(g_backbuffer, screenX + j, screenY, srcPixel.r, srcPixel.g, srcPixel.b, 255);
            }
        }
    }
}

function drawWorld(rayHits) {
    g_ceilingHeight = 1;
    g_backbuffer = g_mainCanvasContext.createImageData(DISPLAY_WIDTH, DISPLAY_HEIGHT);

    drawFloor(rayHits);
    drawCeiling(rayHits);
    g_mainCanvasContext.putImageData(g_backbuffer, 0, 0);

    let wallsimg = document.getElementById("wallsimg");

    for (let i = 0; i < rayHits.length; ++i) {
        let rayHit = rayHits[i];
        let wallScreenHeight = Math.round(VIEW_DIST / rayHit.correctDistance * TILE_SIZE);
        let textureX = (rayHit.horizontal ? TEXTURE_SIZE - 1 : 0) + (rayHit.tileX / TILE_SIZE * TEXTURE_SIZE);
        let textureY = TEXTURE_SIZE * (rayHit.wallType - 1);
        drawWallStrip(rayHit, textureX, textureY, wallScreenHeight);
    }
}

function castRays(rayHits) {
    var stripIdx = 0;

    for (var i = 0; i < RAY_COUNT; i++) {
        /*
              screenX
                    <------
                    +-----+------+  ^
                    \     |     /   |
                     \    |    /    |
                      \   |   /     | VIEW_DIST
                       \  |  /      |
                        \a| /       |
                         \|/        |
                          v         v
    
        tan(a) = screenX / VIEW_DIST
        a = atan( screenX / VIEW_DIST )
        */
        var screenX = (RAY_COUNT / 2 - i) * STRIP_WIDTH;
        var rayAngle = Math.atan(screenX / VIEW_DIST);
        castSingleRay(
            rayHits,
            player.rot + rayAngle,  // add the players viewing direction to get the angle in world space
            stripIdx++
        );
    }
}

function castSingleRay(rayHits, rayAngle, stripIdx) {
    rayAngle %= TWO_PI;
    if (rayAngle < 0) rayAngle += TWO_PI;

    var right = (rayAngle < TWO_PI * 0.25 && rayAngle >= 0) || // Quadrant 1
        (rayAngle > TWO_PI * 0.75); // Quadrant 4
    var up = rayAngle < TWO_PI * 0.5 && rayAngle >= 0; // Quadrant 1 and 2

    var wallType = 0;
    var textureX; // the x-coord on the texture of the block, ie. what part of the texture are we going to render

    var dist = 0; // the distance to the block we hit
    var xHit = 0; // the x and y coord of where the ray hit the block
    var yHit = 0;

    var wallHorizontal = false;

    //--------------------------
    // Vertical Lines Checking
    //--------------------------

    // Find x coordinate of vertical lines on the right and left
    var vx = 0;
    if (right) {
        vx = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
    }
    else {
        vx = Math.floor(player.x / TILE_SIZE) * TILE_SIZE - 1;
    }

    // Calculate y coordinate of those lines
    // lineY = playerY + (playerX-lineX)*tan(ALPHA);
    var vy = player.y + (player.x - vx) * Math.tan(rayAngle);

    // Calculate stepping vector for each line
    var stepx = right ? TILE_SIZE : -TILE_SIZE;
    var stepy = TILE_SIZE * Math.tan(rayAngle);

    // tan() returns positive values in Quadrant 1 and Quadrant 4
    // But window coordinates need negative coordinates for Y-axis so we reverse them
    if (right) {
        stepy = -stepy;
    }

    while (vx >= 0 && vx < MAP_WIDTH * TILE_SIZE && vy >= 0 && vy < MAP_HEIGHT * TILE_SIZE) {
        var wallY = Math.floor(vy / TILE_SIZE);
        var wallX = Math.floor(vx / TILE_SIZE);
        if (map[wallY][wallX] > 0) {
            var distX = player.x - vx;
            var distY = player.y - vy;
            var blockDist = distX * distX + distY * distY;
            if (!dist || blockDist < dist) {
                dist = blockDist;
                xHit = vx;
                yHit = vy;
                wallType = map[wallY][wallX];
                textureX = vy % TILE_SIZE;

                // Facing left, flip image
                if (!right) {
                    textureX = TILE_SIZE - textureX;
                }
            }
            break;
        }
        vx += stepx;
        vy += stepy;
    }

    //--------------------------
    // Horizontal Lines Checking
    //--------------------------

    // Find y coordinate of horizontal lines above and below
    var hy = 0;
    if (up) {
        hy = Math.floor(player.y / TILE_SIZE) * TILE_SIZE - 1;
    }
    else {
        hy = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
    }

    // Calculation x coordinate of horizontal line
    // lineX = playerX + (playerY-lineY)/tan(ALPHA);
    var hx = player.x + (player.y - hy) / Math.tan(rayAngle);
    var stepy = up ? -TILE_SIZE : TILE_SIZE;
    var stepx = TILE_SIZE / Math.tan(rayAngle);

    // tan() returns stepx as positive in quadrant 3 and negative in quadrant 4
    // This is the opposite of window coordinates so we need to reverse when angle is facing down
    if (!up) {
        stepx = -stepx;
    }

    while (hx >= 0 && hx < MAP_WIDTH * TILE_SIZE && hy >= 0 && hy < MAP_HEIGHT * TILE_SIZE) {
        var wallY = Math.floor(hy / TILE_SIZE);
        var wallX = Math.floor(hx / TILE_SIZE);
        if (map[wallY][wallX] > 0) {
            var distX = player.x - hx;
            var distY = player.y - hy;
            var blockDist = distX * distX + distY * distY;
            if (!dist || blockDist < dist) {
                dist = blockDist;
                xHit = hx;
                yHit = hy;
                wallType = map[wallY][wallX];
                textureX = hx % TILE_SIZE;
                wallHorizontal = true;

                // Facing down, flip image
                if (!up) {
                    textureX = TILE_SIZE - textureX;
                }
            }
            break;
        }
        hx += stepx;
        hy += stepy;
    }

    let rayHit = new RayHit();
    rayHit.strip = stripIdx;
    rayHit.tileX = textureX;
    rayHit.horizontal = wallHorizontal;
    rayHit.wallType = wallType;
    rayHit.rayAngle = rayAngle;
    if (dist) {
        rayHit.distance = Math.sqrt(dist);
        rayHit.correctDistance = rayHit.distance * Math.cos(player.rot - rayAngle);
        drawRay(xHit, yHit);
    }
    rayHits.push(rayHit);
}

function drawRay(rayX, rayY) {
    var miniMapObjects = $("minimapobjects");
    var objectCtx = miniMapObjects.getContext("2d");

    rayX = rayX / (MAP_WIDTH * TILE_SIZE) * 100;
    rayX = rayX / 100 * MINIMAP_SCALE * MAP_WIDTH;
    rayY = rayY / (MAP_HEIGHT * TILE_SIZE) * 100;
    rayY = rayY / 100 * MINIMAP_SCALE * MAP_HEIGHT;

    var playerX = player.x / (MAP_WIDTH * TILE_SIZE) * 100;
    playerX = playerX / 100 * MINIMAP_SCALE * MAP_WIDTH;

    var playerY = player.y / (MAP_HEIGHT * TILE_SIZE) * 100;
    playerY = playerY / 100 * MINIMAP_SCALE * MAP_HEIGHT;

    objectCtx.strokeStyle = "rgba(255,255,255,0.2)";
    objectCtx.lineWidth = 0.5;
    objectCtx.beginPath();
    objectCtx.moveTo(playerX, playerY);
    objectCtx.lineTo(
        rayX,
        rayY
    );
    objectCtx.closePath();
    objectCtx.stroke();
}

function move() {
    // speed = forward / backward = 1 or -1
    var moveStep = player.speed * player.moveSpeed; // player will move this far along the current direction vector

    // dir = left / right = -1 or 1
    player.rot += -player.dir * player.rotSpeed; // add rotation if player is rotating (player.dir != 0)

    // make sure the angle is between 0 and 360 degrees
    // while (player.rot < 0) player.rot += TWO_PI;
    // while (player.rot >= TWO_PI) player.rot -= TWO_PI;

    // cos(angle) = A / H = x / H
    // x = H * cos(angle)
    // sin(angle) = O / H = y / H
    // y = H * sin(angle)
    var newX = player.x + Math.cos(player.rot) * moveStep;  // calculate new player position with simple trigonometry
    var newY = player.y + -Math.sin(player.rot) * moveStep;

    // Round down to integers
    newX = Math.floor(newX);
    newY = Math.floor(newY);

    var wallX = newX / TILE_SIZE;
    var wallY = newY / TILE_SIZE;

    if (isBlocking(wallX, wallY)) { // are we allowed to move to the new position?
        return; // no, bail out.
    }

    player.x = newX; // set new position
    player.y = newY;
}

function isBlocking(x, y) {

    // first make sure that we cannot move outside the boundaries of the level
    if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH)
        return true;

    // return true if the map block is not 0, ie. if there is a blocking wall.
    return (map[Math.floor(y)][Math.floor(x)] != 0);
}

function updateMiniMap() {

    var miniMap = $("minimap");
    var miniMapObjects = $("minimapobjects");

    var objectCtx = miniMapObjects.getContext("2d");

    miniMapObjects.width = miniMapObjects.width;

    var playerX = player.x / (MAP_WIDTH * TILE_SIZE) * 100;
    playerX = playerX / 100 * MINIMAP_SCALE * MAP_WIDTH;

    var playerY = player.y / (MAP_HEIGHT * TILE_SIZE) * 100;
    playerY = playerY / 100 * MINIMAP_SCALE * MAP_HEIGHT;

    objectCtx.fillStyle = "red";
    objectCtx.fillRect(   // draw a dot at the current player position
        playerX - 2,
        playerY - 2,
        4, 4
    );

    objectCtx.strokeStyle = "red";
    objectCtx.beginPath();
    objectCtx.moveTo(playerX, playerY);
    objectCtx.lineTo(
        (playerX + Math.cos(player.rot) * 4 * MINIMAP_SCALE),
        (playerY + -Math.sin(player.rot) * 4 * MINIMAP_SCALE)
    );
    objectCtx.closePath();
    objectCtx.stroke();
}

function drawMiniMap() {
    let miniMap = $("minimap");     // the actual map
    let miniMapCtr = $("minimapcontainer");   // the container div element
    let miniMapObjects = $("minimapobjects"); // the canvas used for drawing the objects on the map (player character, etc)

    miniMap.width = MAP_WIDTH * MINIMAP_SCALE;  // resize the internal canvas dimensions
    miniMap.height = MAP_HEIGHT * MINIMAP_SCALE;  // of both the map canvas and the object canvas
    miniMapObjects.width = miniMap.width;
    miniMapObjects.height = miniMap.height;

    let w = (MAP_WIDTH * MINIMAP_SCALE) + "px"  // minimap CSS dimensions
    let h = (MAP_HEIGHT * MINIMAP_SCALE) + "px"
    miniMap.style.width = miniMapObjects.style.width = miniMapCtr.style.width = w;
    miniMap.style.height = miniMapObjects.style.height = miniMapCtr.style.height = h;

    let ctx = miniMap.getContext("2d");
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, miniMap.width, miniMap.height);

    // loop through all blocks on the map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let wall = map[y][x];
            if (wall > 0) { // if there is a wall block at this (x,y) ...
                ctx.fillStyle = "#999";
                ctx.fillRect(       // ... then draw a block on the minimap
                    x * MINIMAP_SCALE,
                    y * MINIMAP_SCALE,
                    MINIMAP_SCALE, MINIMAP_SCALE
                );
            }
        }
    }

    updateMiniMap();
}
setTimeout(init, 500);
