/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Closely followed video tutorial playlist provided at the top of the assignment, then used ChatGPT for help with hue shift, organizing sliders, and dynamically changing fps. The eyeball girl (code and reference drawing) was completely made by me.
*/

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global Variables
var canvas, gl;
var a_Position, u_FragColor, u_Size, u_ModelMatrix, u_GlobalRotateMatrix;

// Color Variables
var shirtColor, headColor, eyeColor, hairColor, skirtColor, legColor, shinColor, shoeColor;

// Animation Globals
var g_targetFPS = 60;
var g_frameInterval = 1000 / g_targetFPS;
var g_lastFrameTime = performance.now();
var g_lastFPSUpdate = performance.now();
var g_frameCount = 0;
var g_currentFPS = 0;
var fpsArray = [];
var speedMultiplier = 2.25;
var g_startTime = performance.now() * 0.001;
var g_seconds = 0;

// Rotation Variables
var globalRotMat = new Matrix4();
var g_globalAngle = 2;

// Hue Shift
var g_hueShift = 0;

// Animation Toggle Variables
var g_armAnim = false;
var g_chestAnim = false;
var g_neckAnim = false;
var g_eyeAnim = false;
var g_headAnim = false;
var g_legAnim = false;
var g_skirtAnim = false;
var g_posAnim = true;

// Shape & Rendering Variables
var g_selectedShape = 'pyramid';
var g_shapesList = [];

// Body Part Angle and Position Variables
var g_headAngle = 0;
var g_headPosY = 0;
var g_eyePosX = 0;
var g_eyePosY = 0;
var g_braidLY = 0, g_braidRY = 0;
var g_braidL2Y = 0, g_braidR2Y = 0;
var g_braidL3Y = 0, g_braidR3Y = 0;

var g_neckAngle = 0;
var g_chestAngle = 0;
var g_chestAngleZ = 0;
var g_chestPosY = 0;
var g_armLAngle = 0;
var g_armRAngle = 0;
var g_armLPos = 0;
var g_armRPos = 0;

var g_skirtAngle = 0;
var g_skirtPosY = 0;
var g_thighLAngle = 0;
var g_shinLAngle = 0;
var g_footLAngle = 0;
var g_thighRAngle = 0;
var g_shinRAngle = 0;
var g_footRAngle = 0;

// UI Globals
var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 5;
var g_selectedType = POINT;
var g_selectedSeg = 10;

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

function main() {
    // Canvas and GL vars
    getWebGL();

    // Init GLSL shader programs and connect GLSL vars
    connectGLSL();

    //Set initial img value
    document.getElementById('ref-img').style.display = 'none';

    // Actions for HTML UI
    htmlActions();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Learned about alpha blending from ChatGPT when debugging my implementation

    // Initialize global rotation before first frame
    setUniformColor([1.0, 1.0, 1.0, 1.0]);
    updateGlobalRotation();

    // renderShapes();
    requestAnimationFrame(tick);
}

function updateGlobalRotation() {
    globalRotMat.setRotate(g_globalAngle, 0, 1, 0);
}

function defaultTransform(obj) {
    obj.matrix.setTranslate(0.0, -0.5, 0.0);
    obj.matrix.rotate(0, 1, 0, 0);
    obj.matrix.rotate(0, 0, 1, 0);
    obj.matrix.rotate(0, 0, 0, 1);
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function setUniformColor(color) {
    if (!arraysEqual(g_selectedColor, color)) {
        gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
        g_selectedColor = color;
    }
}

function setTargetFPS(fps) {
    g_targetFPS = fps;
    g_frameInterval = 1000 / g_targetFPS;
}

function updateFPS(currentTime) {
    fpsArray.push(g_currentFPS);
    if (fpsArray.length > 10) fpsArray.shift();
    let avgFPS = fpsArray.reduce((a, b) => a + b) / fpsArray.length;
    setText(`fps: ${Math.round(avgFPS)}`, "numdot");
}

function tick() {
    requestAnimationFrame(tick);

    const currentTime = performance.now();
    const deltaTime = currentTime - g_lastFrameTime;

    if (deltaTime >= g_frameInterval) {
        g_lastFrameTime = currentTime - (deltaTime % g_frameInterval); // Adjust for drift
        
        g_seconds = (performance.now() * 0.001) - g_startTime; // Update animation time

        updateAnimAng();
        updateGlobalRotation();
        renderShapes();

        g_frameCount++;
        if (currentTime - g_lastFPSUpdate >= 1000) {
            g_currentFPS = g_frameCount;
            g_frameCount = 0;
            g_lastFPSUpdate = currentTime;
            updateFPS(currentTime);
        }
    }
}

//Update the angles of everything if currently animated
function updateAnimAng() {
    var time = g_seconds * speedMultiplier;
    if (g_armAnim) {
        g_armLAngle = (-25 * Math.sin(time));
        g_armRAngle = (-10 * Math.sin(time));
        // Update arm slider position
        document.getElementById('armLSlide').value = g_armLAngle;
        document.getElementById('armRSlide').value = g_armRAngle;
    }
    if (g_chestAnim) {
        g_chestAngle = (7 * Math.sin(time));
        // Update chest slider position
        document.getElementById('chestSlide').value = g_chestAngle;
    }
    if (g_neckAnim) {
        g_neckAngle = (0.5 * Math.sin(time));
        // Update neck slider position
        document.getElementById('neckSlide').value = g_neckAngle;
    }
    if (g_eyeAnim) {
        g_eyePosX = (0.035 * Math.sin(time));
        // Update eye slider position
        document.getElementById('eyeSlide').value = g_eyePosX;
    }
    if (g_headAnim) {
        g_headAngle = (10 * Math.sin(time));
        // Update eye slider position
        document.getElementById('headSlide').value = g_headAngle;
    }
    if (g_legAnim) {
        g_thighRAngle = (-5 * Math.sin(time));
        g_thighLAngle = (-2 * Math.sin(time));
        g_footRAngle = (0.5 * Math.sin(time));
        g_footLAngle = (0.25 * Math.sin(time));
        // Update knee and foot slider
        document.getElementById("shinRSlide").value = g_thighRAngle;
        document.getElementById("shinLSlide").value = g_thighLAngle;
        document.getElementById("footRSlide").value = g_footRAngle;
        document.getElementById("footLSlide").value = g_footLAngle;
    }
    if (g_skirtAnim) {
        g_skirtAngle = (0.2 * Math.sin(time));
        g_chestAngleZ = (8 * Math.sin(time));
        // Update skirt slider
        document.getElementById("skirtSlide").value = g_skirtAngle;
        document.getElementById('chestSlide').value = g_chestAngleZ;
    }
    if (g_posAnim) {
        g_skirtPosY = (0.02 * Math.sin(time+3.5)) -0.005;
        g_chestPosY = (0.02 * Math.sin(time+3));
        g_armLPos = (0.03 * Math.sin(time+3)) - 0.045;
        g_armRPos = (0.03 * Math.sin(time+3)) - 0.045;
        g_headPosY = (0.03 * Math.sin(time+2)) -0.05;
        g_eyePosY = (0.01 * Math.sin(time+1.5));
        g_braidLY = (0.01 * Math.sin(time+1));
        g_braidRY = (0.01 * Math.sin(time+1));
        g_braidL2Y = (0.02 * Math.sin(time+0.5));
        g_braidR2Y = (0.02 * Math.sin(time+0.5));
        g_braidL3Y = (0.03 * Math.sin(time));
        g_braidR3Y = (0.03 * Math.sin(time));
        //Update pos slider
        document.getElementById("skirtSlide").value = g_skirtPosY*100;
        document.getElementById("chest3Slide").value = g_chestPosY*1000;
        document.getElementById("braidLSlide").value = g_braidL2Y*1000;
        document.getElementById("braidRSlide").value = g_braidR2Y*1000;
        document.getElementById("armRSlide").value = g_armRPos*100;
        document.getElementById("armLSlide").value = g_armLPos*100;
        document.getElementById("eye2Slide").value = g_armLPos*1000;
    }
}

function getWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true } );
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    // Set identity matrix as default
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function eventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x, y]);
}

// Icy Blue
// var shirtColor = [0.604, 0.761, 0.788, 1.0]; // #9ac2c9
// var headColor = [0.898, 1.0, 0.925, 1.0]; // #E5FFEC
// var eyeColor = [0.290, 0.314, 0.263, 1.0]; // #4a5043
// var hairColor = [0.290, 0.314, 0.263, 1.0]; // #4a5043
// var skirtColor = [0.541, 0.631, 0.694, 1.0]; // #8aa1b1
// var legColor = [0.725, 0.847, 0.761, 1.0]; // #b9d8c2;
// var shinColor = [0.604, 0.761, 0.788, 1.0]; // #9ac2c9
// var shoeColor = [0.290, 0.314, 0.263, 1.0]; // #4a5043 

// Pastel Green
// var shirtColor = [0.549, 0.847, 0.565, 1.0];  // #8CD790  
// var headColor = [0.843, 1.0, 0.945, 1.0];  // #D7FFF1  
// var eyeColor = [0.157, 0.349, 0.263, 1.0];  // #285943  
// var hairColor = [0.157, 0.349, 0.263, 1.0];  // #285943  
// var skirtColor = [0.467, 0.686, 0.612, 1.0];  // #77AF9C  
// var legColor = [0.843, 1.0, 0.945, 1.0];  // #D7FFF1  
// var shinColor = [0.549, 0.847, 0.565, 1.0];  // #8CD790  
// var shoeColor = [0.157, 0.349, 0.263, 1.0];  // #285943  

// Pastel Purple
// var shirtColor = [0.549, 0.616, 0.847, 1.0];  // Shifted blue from #8CD790
// var headColor = [0.678, 0.949, 1.0, 1.0];  // Shifted blue from #D7FFF1
// var eyeColor = [0.157, 0.263, 0.349, 1.0];  // Shifted blue from #285943
// var hairColor = [0.157, 0.263, 0.349, 1.0];  // Shifted blue from #285943
// var skirtColor = [0.367, 0.512, 0.747, 1.0]; // Shifted blue from #77AF9C
// var legColor = [0.678, 0.949, 1.0, 1.0];  // Shifted blue from #D7FFF1
// var shinColor = [0.549, 0.616, 0.847, 1.0];  // Shifted blue from #8CD790
// var shoeColor = [0.157, 0.263, 0.349, 1.0];  // Shifted blue from #285943

function renderShapes() {
    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Set default to white
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

    // Base colors
    const baseShirtColor = [0.549, 0.616, 0.847, 1.0];
    const baseHeadColor = [0.678, 0.949, 1.0, 1.0];
    const baseEyeColor = [0.157, 0.263, 0.349, 1.0];
    const baseHairColor = [0.157, 0.263, 0.349, 1.0];
    const baseSkirtColor = [0.367, 0.512, 0.747, 1.0];
    const baseLegColor = [0.678, 0.949, 1.0, 1.0];
    const baseShinColor = [0.549, 0.616, 0.847, 1.0];
    const baseShoeColor = [0.157, 0.263, 0.349, 1.0];

    // In renderShapes()
    shirtColor = shiftColor(baseShirtColor, g_hueShift);
    headColor = shiftColor(baseHeadColor, g_hueShift);
    eyeColor = shiftColor(baseEyeColor, g_hueShift);
    hairColor = shiftColor(baseHairColor, g_hueShift);
    skirtColor = shiftColor(baseSkirtColor, g_hueShift);
    legColor = shiftColor(baseLegColor, g_hueShift);
    shinColor = shiftColor(baseShinColor, g_hueShift);
    shoeColor = shiftColor(baseShoeColor, g_hueShift);


    /////////////////////// EYEBALL GIRL ///////////////////////

    // Top Half

    // Draw chest (cube)
    var chest = new Cube();
    chest.color = shirtColor;
    defaultTransform(chest);
    chest.matrix.rotate(-g_chestAngle, 1, 0, 0); // rotate x-axis to lean forward
    chest.matrix.rotate(-g_chestAngleZ, 0, 0, 1); // rotate z-axis to lean side to side 
    chest.matrix.translate(0.0, 0.0 + g_chestPosY, 0.0); // position y-axis to bob
    var chestCoordsMatrixArmL = new Matrix4(chest.matrix);
    var chestCoordsMatrixArmR = new Matrix4(chest.matrix);
    var chestCoordsMatrixSkirt = new Matrix4(chest.matrix);
    var chestCoordsMatrixNeck = new Matrix4(chest.matrix);
    chest.matrix.translate(-0.25, 0.45, 0.0);
    chest.matrix.rotate(10, 0, 0, 1); // z-axis
    chest.matrix.rotate(10, 0, 1, 0); // y-axis
    chest.matrix.scale(0.275, 0.39, 0.18);
    chest.render();

    // Draw neck (cube)
    var neck = new Cube();
    neck.color = shirtColor;
    neck.matrix = chestCoordsMatrixNeck;
    neck.matrix.translate(0, -0.05, 0);  // Move up for pivot
    neck.matrix.rotate(-g_neckAngle, 1, 0, 0); // rotate y-axis to turn neck
    neck.matrix.rotate(-g_headAngle, 0, 1, 0); // rotate y-axis to turn neck
    var neckCoordsMatrix = new Matrix4(neck.matrix);
    neck.matrix.rotate(10, 0, 0, 1); // z-axis
    neck.matrix.rotate(10, 0, 1, 0); // y-axis
    neck.matrix.translate(0.0, 0.05, 0.0); // Move back to original position
    neck.matrix.translate(-0.0655, 0.8, 0.0175);
    neck.matrix.scale(0.1, 0.2, 0.1);
    neck.render();

    // Draw head (sphere)
    var head = new Sphere(0.215, 20, 20);
    head.color = headColor;
    head.matrix = neckCoordsMatrix;
    head.matrix.translate(0.0, 0.0 + 0.25*g_headPosY, 0.0); // position y-axis to bob
    var headCoordsMatrixEye = new Matrix4(head.matrix);
    var headCoordsMatrixHairL = new Matrix4(head.matrix);
    var headCoordsMatrixHairR = new Matrix4(head.matrix);
    head.matrix.translate(-0.22, 1.175, 0.05);
    head.matrix.rotate(10, 0, 0, 1); // z-axis
    head.matrix.rotate(10, 0, 1, 0); // y-axis
    head.render();

    // Draw eye (sphere)
    var eye = new Sphere(0.125, 20, 20);
    eye.color = eyeColor;
    eye.matrix = headCoordsMatrixEye;
    eye.matrix.rotate(10, 0, 0, 1); // z-axis
    eye.matrix.rotate(10, 0, 1, 0); // y-axis
    eye.matrix.translate(-0.0 + g_eyePosX, 1.18 + g_eyePosY, -0.13); // position to move eye 
    eye.matrix.scale(1.0, 1.0, 0.5);
    eye.render();

    // Draw left braid1 (pyramid)
    var hairL = new Pyramid(0.5, 0.5);
    hairL.color = hairColor;
    hairL.matrix = headCoordsMatrixHairL;
    hairL.matrix.translate(0.0, g_braidLY, 0.0);
    var hairLCoordsMatrix1 = new Matrix4(hairL.matrix);
    hairL.matrix.translate(0.1, 1.0, 0.3);
    hairL.matrix.rotate(40, 0, 0, 1); // z-axis
    hairL.matrix.rotate(10, 0, 1, 0); // y-axis
    hairL.matrix.rotate(-40, 1, 0, 0); // x-axis
    hairL.matrix.scale(0.35, 0.5, 0.35);
    hairL.render();

    // Draw left braid2 (pyramid)
    var hairL2 = new Pyramid(0.5, 0.5);
    hairL2.color = hairColor;
    hairL2.matrix = hairLCoordsMatrix1;
    hairL2.matrix.translate(0.0, g_braidL2Y, 0.0);
    var hairLCoordsMatrix2 = new Matrix4(hairL2.matrix);
    hairL2.matrix.translate(0.25, 0.95, 0.5);
    hairL2.matrix.rotate(40, 0, 0, 1); // z-axis
    hairL2.matrix.rotate(15, 0, 1, 0); // y-axis
    hairL2.matrix.rotate(-60, 1, 0, 0); // x-axis
    hairL2.matrix.scale(0.35, 0.5, 0.35);
    hairL2.render();

    // Draw left braid3 (pyramid)
    var hairL3 = new Pyramid(0.5, 0.5);
    hairL3.color = hairColor;
    hairL3.matrix = hairLCoordsMatrix2;
    hairL3.matrix.translate(0.4, 0.9 + g_braidL3Y, 0.725);
    hairL3.matrix.rotate(40, 0, 0, 1); // z-axis
    hairL3.matrix.rotate(20, 0, 1, 0); // y-axis
    hairL3.matrix.rotate(-60, 1, 0, 0); // x-axis
    hairL3.matrix.scale(0.35, 0.5, 0.35);
    hairL3.render();

    // Draw right braid1 (pyramid)
    var hairR = new Pyramid(0.5, 0.5);
    hairR.color = hairColor;
    hairR.matrix = headCoordsMatrixHairR;
    hairR.matrix.translate(0.0, g_braidRY, 0.0);
    var hairRCoordsMatrix1 = new Matrix4(hairR.matrix);
    hairR.matrix.translate(-0.5, 0.9, 0.3);
    hairR.matrix.rotate(-40, 0, 0, 1); // z-axis
    hairR.matrix.rotate(10, 0, 1, 0); // y-axis
    hairR.matrix.rotate(-40, 1, 0, 0); // x-axis
    hairR.matrix.scale(0.35, 0.5, 0.35);
    hairR.render();

    // Draw right braid2 (pyramid)
    var hairR2 = new Pyramid(0.5, 0.5);
    hairR2.color = hairColor;
    hairR2.matrix = hairRCoordsMatrix1;
    hairR2.matrix.translate(0.0, g_braidR2Y, 0.0);
    var hairRCoordsMatrix2 = new Matrix4(hairR2.matrix);
    hairR2.matrix.translate(-0.575, 0.8, 0.5);
    hairR2.matrix.rotate(-40, 0, 0, 1); // z-axis
    hairR2.matrix.rotate(5, 0, 1, 0); // y-axis
    hairR2.matrix.rotate(-60, 1, 0, 0); // x-axis
    hairR2.matrix.scale(0.35, 0.5, 0.35);
    hairR2.render();

    // Draw right braid3 (pyramid)
    var hairR3 = new Pyramid(0.5, 0.5);
    hairR3.color = hairColor;
    hairR3.matrix = hairRCoordsMatrix2;
    hairR3.matrix.translate(-0.7, 0.7 + g_braidR3Y, 0.725);
    hairR3.matrix.rotate(-40, 0, 0, 1); // z-axis
    hairR3.matrix.rotate(5, 0, 1, 0); // y-axis
    hairR3.matrix.rotate(-60, 1, 0, 0); // x-axis
    hairR3.matrix.scale(0.35, 0.5, 0.35);
    hairR3.render();


    // Draw left arm (pyramid)
    var armL = new Pyramid(0.65, 0.5);
    armL.color = shirtColor;
    defaultTransform(armL);
    armL.matrix = chestCoordsMatrixArmL;
    armL.matrix.translate(0.1, 1.5 + g_armLPos, 0.0);
    armL.matrix.rotate(-g_armLAngle, 0, 1, 0); // rotate y-axis to position left arm
    var armLCoordsMatrix = new Matrix4(armL.matrix);
    armL.matrix.rotate(15, 0, 0, 1); // z-axis
    armL.matrix.rotate(0, 0, 1, 0); // y-axis
    armL.matrix.translate(-0.1, -1.5, 0.0);
    armL.matrix.scale(1.0, 1.0, 1.0);
    armL.matrix.translate(0.05, 0.3, 0.05);
    armL.matrix.rotate(25, 0, 0, 1); // z-axis
    armL.matrix.rotate(10, 0, 1, 0); // y-axis
    armL.matrix.scale(0.45, 1.4, 0.45);
    armL.render();

    // Draw right arm (pyramid)
    var armR = new Pyramid(0.65, 0.5);
    armR.color = shirtColor;
    defaultTransform(armR);
    armR.matrix = chestCoordsMatrixArmR;
    armR.matrix.translate(0.1, 1.5 + g_armRPos, 0.0);
    armR.matrix.rotate(g_armRAngle, 0, 1, 0); // rotate y-axis to position right arm
    var armRCoordsMatrix = new Matrix4(armR.matrix);
    armR.matrix.rotate(-15, 0, 0, 1); // z-axis
    armR.matrix.rotate(0, 0, 1, 0); // y-axis
    armR.matrix.translate(-0.1, -1.5, 0.0);
    armR.matrix.scale(1.0, 1.0, 1.0);
    armR.matrix.translate(-0.05, 0.1, 0.25);
    armR.matrix.rotate(0, 0, 0, 1); // z-axis
    armR.matrix.rotate(10, 0, 1, 0); // y-axis
    armR.matrix.rotate(-15, 1, 0, 0); // x-axis
    armR.matrix.scale(0.45, 1.4, 0.475);
    armR.render();

    // Bottom Half

    // Draw skirt (pyramid)
    var skirt = new Pyramid(0.65, 0.5);
    skirt.color = skirtColor;
    defaultTransform(skirt);
    skirt.matrix = chestCoordsMatrixSkirt;
    skirt.matrix.rotate(-g_skirtAngle, 0, 0, 1); // rotate z-axis to lean side to side
    skirt.matrix.translate(-0.0, g_skirtPosY, 0.0);
    skirt.matrix.rotate(0, 0, 0, 1); // z-axis
    skirt.matrix.scale(1.0, 1.0, 1.0);
    skirt.matrix.translate(-0.065, 0.25, 0.065);
    skirt.matrix.rotate(9, 0, 0, 1); // z-axis
    skirt.matrix.rotate(10, 0, 1, 0); // y-axis
    skirt.matrix.scale(0.775, 1.25, 0.55);
    skirt.render();

    // Left Leg

    // Draw left thigh (cube)
    var thighL = new Cube();
    thighL.color = legColor;
    defaultTransform(thighL);
    thighL.matrix.translate(0, 0.5, 0);  // Move up for pivot
    thighL.matrix.rotate(-g_thighLAngle, 0, 0, 1); // rotate z-axis to position left leg
    var thighLCoordsMatrix = new Matrix4(thighL.matrix);
    thighL.matrix.rotate(15, 0, 0, 1); // z-axis
    thighL.matrix.rotate(10, 0, 1, 0); // y-axis
    thighL.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    thighL.matrix.translate(-0.105, 0.0, 0.01);
    thighL.matrix.scale(0.1, 0.4, 0.1);
    thighL.render();

    // Draw left shin (cube)
    var shinL = new Cube();
    shinL.color = shinColor;
    shinL.matrix = thighLCoordsMatrix;
    shinL.matrix.translate(0, 0.5, 0);  // Move up for pivot
    shinL.matrix.rotate(-g_shinLAngle, 0, 0, 1); // rotate z-axis to position left knee
    var shinLCoordsMatrix = new Matrix4(shinL.matrix);
    shinL.matrix.rotate(15, 0, 0, 1); // z-axis
    shinL.matrix.rotate(10, 0, 1, 0); // y-axis
    shinL.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    shinL.matrix.translate(-0.233/*-0.178*/, -0.85, -0.0115);
    shinL.matrix.scale(0.1, 0.4, 0.1);
    shinL.render();

    // Draw left foot (pyramid)
    var footL = new Pyramid(0.65, 0.5);
    footL.color = shoeColor;
    footL.matrix = shinLCoordsMatrix;
    footL.matrix.rotate(-g_footLAngle, 0, 0, 1); // rotate z-axis to position left foot
    footL.matrix.rotate(0, 0, 0, 1); // z-axis
    footL.matrix.rotate(10, 0, 1, 0); // y-axis
    footL.matrix.translate(0.17, -1.475, 0.09);
    footL.matrix.scale(0.3, 0.55, 0.3);
    footL.render();

    // Right Leg

    // Draw right thigh (cube)
    var thighR = new Cube();
    thighR.color = legColor;
    defaultTransform(thighR);
    thighR.matrix.translate(0, 0.5, 0);  // Move up for pivot
    thighR.matrix.rotate(-g_thighRAngle, 0, 0, 1); // rotate z-axis to position right leg
    var thighRCoordsMatrix = new Matrix4(thighR.matrix);
    thighR.matrix.rotate(-6, 0, 0, 1); // z-axis
    thighR.matrix.rotate(10, 0, 1, 0); // y-axis
    thighR.matrix.rotate(-3, 1, 0, 0); // x-axis
    thighR.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    thighR.matrix.translate(-0.2, -0.015, 0.01);
    thighR.matrix.scale(0.1, 0.4, 0.1);
    thighR.render();

    // Draw right shin (cube)
    var shinR = new Cube();
    shinR.color = shinColor;
    shinR.matrix = thighRCoordsMatrix;
    shinR.matrix.translate(0, 0.5, 0);  // Move up for pivot
    shinR.matrix.rotate(-g_shinRAngle, 0, 0, 1); // rotate x-axis to position right knee
    var shinRCoordsMatrix = new Matrix4(shinR.matrix);
    shinR.matrix.rotate(-20, 0, 0, 1); // z-axis
    shinR.matrix.rotate(10, 0, 1, 0); // y-axis
    shinR.matrix.rotate(-4, 1, 0, 0); // x-axis
    shinR.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    shinR.matrix.translate(0.09, -0.895, 0.015);
    shinR.matrix.scale(0.1, 0.4, 0.1);
    shinR.render();

    // Draw right foot (pyramid)
    var footR = new Pyramid(0.65, 0.5);
    footR.color = shoeColor;
    footR.matrix = shinRCoordsMatrix;
    footR.matrix.rotate(-g_footRAngle, 0, 0, 1); // rotate z-axis to position right foot
    footR.matrix.rotate(0, 0, 0, 1); // z-axis
    footR.matrix.rotate(10, 0, 1, 0); // y-axis
    footR.matrix.translate(-0.335, -1.475, 0.07);
    footR.matrix.scale(0.3, 0.55, 0.3);
    footR.render();

    var duration = performance.now() - startTime;
}

// Set text of HTML element
function setText(text, htmlID) {
    var hElem = document.getElementById(htmlID);

    if (!hElem) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }

    hElem.innerHTML = text;
}

//Reset pose/camera
function resetScene() {
    g_globalAngle = 3.5;
    g_hueShift = 0;

    g_headAngle = 0;
    g_headPosY = 0;
    g_eyePosX = 0;
    g_eyePosY = 0;
    g_braidLY = 0;
    g_braidRY = 0;
    g_braidL2Y = 0;
    g_braidR2Y = 0;
    g_braidL3Y = 0;
    g_braidR3Y = 0;

    g_neckAngle = 0;
    g_chestAngle = 0;
    g_chestAngleZ = 0;
    g_chestPosY = 0;
    g_armLAngle = 0;
    g_armRAngle = 0;
    g_armLPos = 0;
    g_armRPos = 0;

    g_skirtAngle = 0;
    g_thighLAngle = 0;
    g_shinLAngle = 0;
    g_footLAngle = 0;
    g_thighRAngle = 0;
    g_shinRAngle = 0;
    g_footRAngle = 0;

    g_startTime = performance.now() * 0.001; // Reset animation time
    g_seconds = 0;

    g_targetFPS = 60;  // Desired FPS
    g_frameInterval = 1000 / g_targetFPS; // ms per frame
    g_lastFrameTime = performance.now();;
    g_frameCount = 0;
    g_lastFPSUpdate = performance.now();
    g_currentFPS = 0;
    fpsArray = [];
    speedMultiplier = 2.25;
    g_headAnim = false; 
    g_eyeAnim =  false; 
    g_legAnim = false; 
    g_skirtAnim = false;
    g_chestAnim = false; 
    g_armAnim = false; 
    g_neckAnim = false; 
    g_eyeAnim = false;
    g_posAnim = false;

    // Reset slider values
    document.getElementById("angSlide").value = g_globalAngle;
    document.getElementById("hueSlider").value = g_hueShift;
    document.getElementById("headSlide").value = g_headAngle;
    document.getElementById("braidLSlide").value = g_braidL2Y;
    document.getElementById("braidRSlide").value = g_braidR2Y;
    document.getElementById("eyeSlide").value = g_eyePosX;
    document.getElementById("eye2Slide").value = g_eyePosY;
    document.getElementById("neckSlide").value = g_neckAngle;
    document.getElementById("chestSlide").value = g_chestAngle;
    document.getElementById("chest2Slide").value = g_chestAngleZ;
    document.getElementById("chest3Slide").value = g_chestPosY;
    document.getElementById("skirtSlide").value = g_skirtAngle;
    document.getElementById("armLSlide").value = g_armLAngle;
    document.getElementById("armRSlide").value = g_armRAngle;
    document.getElementById("thighLSlide").value = g_thighLAngle;
    document.getElementById("shinLSlide").value = g_shinLAngle;
    document.getElementById("footLSlide").value = g_footLAngle;
    document.getElementById("thighRSlide").value = g_thighRAngle;
    document.getElementById("shinRSlide").value = g_shinRAngle;
    document.getElementById("footRSlide").value = g_footRAngle;
    document.getElementById("fpsSlide").value = g_targetFPS;
    document.getElementById("speedSlide").value = speedMultiplier;
}

function htmlActions() {

    //Button Events (Animation) 
    document.getElementById('idleOFF').onclick = function() { g_posAnim = false; }; 

    setupSliders();

    document.getElementById('eyeSlide').addEventListener('mousemove', function () { g_eyePosX = (this.value)/500;});
    document.getElementById('eye2Slide').addEventListener('mousemove', function () { g_eyePosY = (this.value)/500;});
    document.getElementById('braidLSlide').addEventListener('mousemove', function () { g_braidLY = (this.value)/500;});
    document.getElementById('braidRSlide').addEventListener('mousemove', function () { g_braidRY = (this.value)/500;});
    document.getElementById('chest3Slide').addEventListener('mousemove', function () { g_chestPosY = (this.value)/500;});
    document.getElementById('skirtSlide').addEventListener('mousemove', function () { g_skirtAngle = (this.value)/10;});
    document.getElementById('neckSlide').addEventListener('mousemove', function () { g_neckAngle = (this.value)/5;});

    //Button Events (Reset)
    document.getElementById('reset').onclick = function() { resetScene(); }; 

    //Button Event (Welcome Popup)
    document.getElementById('popup').onclick = function() { popup.style.display = 'none'; };

    //Button Event (Reference)
    document.getElementById('ref').onclick = function() {
        var img = document.getElementById('ref-img');
        if (img.style.display === 'none') {
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
    };

    //Button Event (Idle)
    document.getElementById('idleOFF').onclick = function() {
        if (g_posAnim === false) {
            g_posAnim = true;
        } else {
            g_posAnim = false;
        }
    };

    //Button Event (Anim1)
    document.getElementById('animON2').onclick = function() {
        if (g_headAnim === false) {
            g_headAnim = true; g_eyeAnim = true; g_legAnim = true; g_skirtAnim = true;
        } else {
            g_headAnim = false; g_eyeAnim =  false; g_legAnim = false; g_skirtAnim = false;
        }
    };

    //Button Event (Anim2)
    document.getElementById('animON1').onclick = function() {
        if (g_chestAnim === false) {
            g_chestAnim = true; g_armAnim = true; g_neckAnim = true; g_eyeAnim = true;
        } else {
            g_chestAnim = false; g_armAnim = false; g_neckAnim = false; g_eyeAnim = false;
        }
    };

    document.getElementById('webgl').addEventListener('click', function (event) {
        if (event.shiftKey) {
            // Shift-click: Enable alternate animation
            if (g_headAnim === false) {
                g_headAnim = true; g_eyeAnim = true; g_legAnim = true; g_skirtAnim = true;
            } else {
                g_headAnim = false; g_eyeAnim =  false; g_legAnim = false; g_skirtAnim = false;
            }
        } else {
            // Regular click: Enable default animation
            if (g_chestAnim === false) {
                g_chestAnim = true; g_armAnim = true; g_neckAnim = true; g_eyeAnim = true;
            } else {
                g_chestAnim = false; g_armAnim = false; g_neckAnim = false; g_eyeAnim = false;
            }
        }
    });

    // Update the colors when the hue slider is adjusted
    document.getElementById('hueSlider').addEventListener('mousemove', function () {
        g_hueShift = (this.value)/100; // Get the hue shift value from the slider
    });

}

function setupSliders() {
    const sliderEvents = [
        { id: 'angSlide', variable: 'g_globalAngle', updateFn: updateGlobalRotation },
        { id: 'fpsSlide', variable: 'g_targetFPS', updateFn: (value) => setTargetFPS(value) }, // Ensure FPS is updated
        { id: 'speedSlide', variable: 'speedMultiplier', event: 'mouseup' },

        // Head Controls
        { id: 'headSlide', variable: 'g_headAngle' },

        // Body Controls
        { id: 'chestSlide', variable: 'g_chestAngle' },
        { id: 'chest2Slide', variable: 'g_chestAngleZ' },

        // Arm Controls
        { id: 'armLSlide', variable: 'g_armLAngle' },
        { id: 'armRSlide', variable: 'g_armRAngle' },

        // Leg Controls
        { id: 'thighLSlide', variable: 'g_thighLAngle' },
        { id: 'shinLSlide', variable: 'g_shinLAngle' },
        { id: 'footLSlide', variable: 'g_footLAngle' },
        { id: 'thighRSlide', variable: 'g_thighRAngle' },
        { id: 'shinRSlide', variable: 'g_shinRAngle' },
        { id: 'footRSlide', variable: 'g_footRAngle' },
    ];

    sliderEvents.forEach(({ id, variable, updateFn, event = 'input' }) => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener(event, function () {
                let value = parseFloat(this.value);
                window[variable] = value;
                if (updateFn) updateFn(value); // Pass the value explicitly
                renderShapes();
            });
        } else {
            console.warn(`Slider ${id} not found.`);
        }
    });
}

function hslToRgb(h, s, l) {
    h = h % 1; // Ensure hue wraps around
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // Achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b, 1.0];
}

function shiftColor(baseColor, hueShift, saturationShift = 0, lightnessShift = 0) {
    // Convert RGB to HSL
    const r = baseColor[0], g = baseColor[1], b = baseColor[2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        
        h /= 6;
    }

    // Apply shifts
    h = (h + hueShift + 1) % 1; // Wrap around and ensure positive
    s = Math.max(0, Math.min(1, s + saturationShift));
    l = Math.max(0, Math.min(1, l + lightnessShift));

    // Convert back to RGB
    return hslToRgb(h, s, l);
}