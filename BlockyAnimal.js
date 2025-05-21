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

//Global variables
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;

let g_globalAngle = 0;

let g_headAngle = 0;

let g_lShouAngle = 0;
let g_lShouAnimation = false;
let g_lElbAngle = 0;

let g_lLegAngle = 0;
let g_lLegAnimation = false;
let g_lKneeAngle = 0;

let g_rShouAngle = 0;
let g_rShouAnimation = false;
let g_rElbAngle = 0;

let g_rLegAngle = 0;
let g_rLegAnimation = false;
let g_rKneeAngle = 0;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById("webgl");

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to intialize shaders.");
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log("failed to get the storage location of u_ModelMatrix");
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {

    document.getElementById("allAnimationOn").onclick = function () {
        g_lShouAnimation = true;
        g_rShouAnimation = true;
        g_lLegAnimation = true;
        g_rLegAnimation = true;
    };
    document.getElementById("allAnimationOff").onclick = function () {
        g_lShouAnimation = false;
        g_rShouAnimation = false;
        g_lLegAnimation = false;
        g_rLegAnimation = false;
    };
    document.getElementById("angleSlide").addEventListener(
        "mousemove",
        function () {
            g_globalAngle = this.value;
            renderAllShapes();
        },
    );

    document.getElementById("headSlide").addEventListener(
        "mousemove",
        function () {
            g_headAngle = this.value;
            renderAllShapes();
        },
    );
    document.getElementById("lShouSlide").addEventListener(
        "mousemove",
        function () {
            g_lShouAngle = this.value;
            renderAllShapes();
        },
    );
    document.getElementById("lShouAnimationOn").onclick = function () {
        g_lShouAnimation = true;
    };
    document.getElementById("lShouAnimationOff").onclick = function () {
        g_lShouAnimation = false;
    };
    document.getElementById("lElbSlide").addEventListener(
        "mousemove",
        function () {
            g_lElbAngle = this.value;
            renderAllShapes();
        },
    );

    document.getElementById("lLegSlide").addEventListener(
        "mousemove",
        function () {
            g_lLegAngle = this.value;
            renderAllShapes();
        },
    );
    document.getElementById("lLegAnimationOn").onclick = function () {
        g_lLegAnimation = true;
    };
    document.getElementById("lLegAnimationOff").onclick = function () {
        g_lLegAnimation = false;
    };
    document.getElementById("lKneeSlide").addEventListener(
        "mousemove",
        function () {
            g_lKneeAngle = this.value;
            renderAllShapes();
        },
    );

    document.getElementById("rShouSlide").addEventListener(
        "mousemove",
        function () {
            g_rShouAngle = this.value;
            renderAllShapes();
        },
    );
    document.getElementById("rShouAnimationOn").onclick = function () {
        g_rShouAnimation = true;
    };
    document.getElementById("rShouAnimationOff").onclick = function () {
        g_rShouAnimation = false;
    };
    document.getElementById("rElbSlide").addEventListener(
        "mousemove",
        function () {
            g_rElbAngle = this.value;
            renderAllShapes();
        },
    );

    document.getElementById("rLegSlide").addEventListener(
        "mousemove",
        function () {
            g_rLegAngle = this.value;
            renderAllShapes();
        },
    );
    document.getElementById("rLegAnimationOn").onclick = function () {
        g_rLegAnimation = true;
    };
    document.getElementById("rLegAnimationOff").onclick = function () {
        g_rLegAnimation = false;
    };
    document.getElementById("rKneeSlide").addEventListener(
        "mousemove",
        function () {
            g_rKneeAngle = this.value;
            renderAllShapes();
        },
    );
}

function main() {
    setupWebGL();

    connectVariablestoGLSL();

    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) {
        if (ev.buttons == 1) click(ev);
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Clear <canvas>
    // gl.clear(gl.COLOR_BUFFER_BIT);

    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick(){
    g_seconds = performance.now()/1000.0-g_startTime;
    // console.log(g_seconds);

    updateAnimationAngles();

    renderAllShapes();

    requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {
    [x, y] = convertCoordinatesEventToGL(ev);

    
    let point;
    if(g_selectedType == POINT){
        point = new Point();
    }
    else if(g_selectedType == TRIANGLE){
        point = new Triangle();
    }
    else if(g_selectedType == CIRCLE){
        point = new Circle();
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    point.segments = g_selectedSegments;
    g_shapesList.push(point);

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function updateAnimationAngles(){
    if(g_lShouAnimation){
        g_lShouAngle = (45*Math.sin(g_seconds));
    }
    if(g_rShouAnimation){
        g_rShouAngle = (-45*Math.sin(g_seconds));
    }
    if(g_lLegAnimation){
        g_lLegAngle = (-45*Math.sin(g_seconds));
    }
    if(g_rLegAnimation){
        g_rLegAngle = (45*Math.sin(g_seconds));
    }
}

function renderAllShapes() {
    // var startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    var body = new Cube();
    body.color = [.7, .7, .7, 1];
    body.matrix.translate(-.4, -.2, -.3);
    body.matrix.rotate(0, 0, 0, 1);
    body.matrix.scale(0.8, .6, .6);
    body.render();

    var heart1 = new Cube();
    heart1.color = [1, 0, 0, 1];
    heart1.matrix.translate(0, 0, -.3001);
    heart1.matrix.rotate(45, 0, 0, 1);
    heart1.matrix.translate(-.1, -.1, 0);
    heart1.matrix.scale(0.2, .4, .1);
    heart1.render();

    var heart2 = new Cube();
    heart2.color = [1, 0, 0, 1];
    heart2.matrix.translate(0, 0, -.3001);
    heart2.matrix.rotate(-45, 0, 0, 1);
    heart2.matrix.translate(-.1, -.1, 0);
    heart2.matrix.scale(0.2, .4, .1);
    heart2.render();

    var heart3 = new Cube();
    heart3.color = [1, 0, 0, 1];
    heart3.matrix.translate(0.03, .18, -.3001);
    heart3.matrix.rotate(55, 0, 0, 1);
    heart3.matrix.translate(-.1, -.1, 0);
    heart3.matrix.scale(0.1, .3, .1);
    heart3.render();

    var heart4 = new Cube();
    heart4.color = [1, 0, 0, 1];
    heart4.matrix.translate(0.03, .09, -.3001);
    heart4.matrix.rotate(-55, 0, 0, 1);
    heart4.matrix.translate(-.1, -.1, 0);
    heart4.matrix.scale(0.1, .3, .1);
    heart4.render();

    var neck = new Cube();
    neck.color = [.5, .5, .5, 1];
    neck.matrix.translate(-.1, .35, -.1);
    neck.matrix.rotate(0, 0, 0, 1);
    neck.matrix.scale(.2, .2, .2);
    neck.render();

    var head = new Cube();
    head.color = [.7, .7, .7, 1];
    head.matrix.rotate(-g_headAngle, 0, 1, 0);
    head.matrix.translate(-.3, .5, -.2);
    var headMat = new Matrix4(head.matrix);
    head.matrix.scale(0.6, .4, .4);
    head.render();

    var lEye = new Cube();
    lEye.color = [1, 1, .7, 1];
    lEye.matrix = new Matrix4(headMat);
    lEye.matrix.translate(.4, .2, -.001);
    lEye.matrix.rotate(0, 0, 0, 1);
    lEye.matrix.scale(.1001, .1001, .1001);
    lEye.render();

    var rEye = new Cube();
    rEye.color = [1, 1, .7, 1];
    rEye.matrix = new Matrix4(headMat);
    rEye.matrix.translate(.1, .2, -.001);
    rEye.matrix.rotate(0, 0, 0, 1);
    rEye.matrix.scale(.1001, .1001, .1001);
    rEye.render();

    var mouth = new Cube();
    mouth.color = [1, 1, .7, 1];
    mouth.matrix = new Matrix4(headMat);
    mouth.matrix.translate(.1, 0, -.001);
    mouth.matrix.rotate(0, 0, 0, 1);
    mouth.matrix.scale(.4001, .1001, .1001);
    mouth.render();

    var leftEar = new Cube();
    leftEar.color = [.5, .5, .5, 1];
    leftEar.matrix = new Matrix4(headMat);
    leftEar.matrix.translate(.5, .1, .1);
    leftEar.matrix.scale(.2, .2, .2);
    leftEar.render();

    var rightEar = new Cube();
    rightEar.color = [.5, .5, .5, 1];
    rightEar.matrix = new Matrix4(headMat);
    rightEar.matrix.translate(-.1, .1, .1);
    rightEar.matrix.scale(.2, .2, .2);
    rightEar.render();

    var leftShoulder = new Cube();
    leftShoulder.color = [.5, .5, .5, 1];
    leftShoulder.matrix.translate(.35, .25, -.05);
    leftShoulder.matrix.rotate(45, 1, 0, 0);
    leftShoulder.matrix.scale(.2, .1, .1);
    leftShoulder.render();

    var rightShoulder = new Cube();
    rightShoulder.color = [.5, .5, .5, 1];
    rightShoulder.matrix.translate(-.55, .25, -.05);
    rightShoulder.matrix.rotate(45, 1, 0, 0);
    rightShoulder.matrix.scale(.2, .1, .1);
    rightShoulder.render();

    var leftArm = new Cube();
    leftArm.color = [.7, .7, .7, 1];
    leftArm.matrix.translate(.5, .3, 0);
    leftArm.matrix.rotate(-g_lShouAngle, 1, 0, 0);
    var leftElbMat = new Matrix4(leftArm.matrix);
    leftArm.matrix.translate(0, -.3, -.1);
    leftArm.matrix.scale(.1, .4, .2);
    leftArm.render();

    var leftFore = new Cube();
    leftFore.color = [.5, .5, .5, 1];
    leftFore.matrix = leftElbMat;
    leftFore.matrix.translate(0, -.3, 0);
    leftFore.matrix.rotate(-g_lElbAngle, 1, 0, 0);
    var leftWristMat = new Matrix4(leftFore.matrix);
    leftFore.matrix.translate(0, -.4, -.1);
    leftFore.matrix.scale(.1001, .4001, .2001);
    leftFore.render();

    var leftHand = new Cube();
    leftHand.color = [.7, .7, .7, 1];
    leftHand.matrix = leftWristMat;
    leftHand.matrix.translate(0, -.3, 0);
    leftHand.matrix.rotate(0, 1, 0, 0);
    var leftThumbMat = new Matrix4(leftHand.matrix);
    leftHand.matrix.translate(0, -.3, -.1);
    leftHand.matrix.scale(.1, .2, .2);
    leftHand.render();

    var leftThumb = new Cube();
    leftThumb.color = [.7, .7, .7, 1];
    leftThumb.matrix = leftThumbMat;
    leftThumb.matrix.translate(0, -.3, 0);
    leftThumb.matrix.rotate(0, 1, 0, 0);
    leftThumb.matrix.translate(0, .1, -.2);
    leftThumb.matrix.scale(.1, .1, .1);
    leftThumb.render();

    var leftLeg = new Cube();
    leftLeg.color = [.5, .5, .5, 1];
    leftLeg.matrix.translate(.1, -.2, 0);
    leftLeg.matrix.rotate(-g_lLegAngle, 1, 0, 0);
    var leftKneeMat = new Matrix4(leftLeg.matrix);
    leftLeg.matrix.translate(0, -.3, -.1);
    leftLeg.matrix.scale(0.2, .3, .2);
    leftLeg.render();

    var leftKnee = new Cube();
    leftKnee.color = [.7, .7, .7, 1];
    leftKnee.matrix = leftKneeMat;
    leftKnee.matrix.translate(0, -.3, 0);
    leftKnee.matrix.rotate(-g_lKneeAngle, 1, 0, 0);
    var leftFootMat = new Matrix4(leftKnee.matrix);
    leftKnee.matrix.translate(0, -.3, -.1);
    leftKnee.matrix.scale(.2001, .3001, .2001);
    leftKnee.render();

    var leftFoot = new Cube();
    leftFoot.color = [.5, .5, .5, 1];
    leftFoot.matrix = leftFootMat;
    leftFoot.matrix.translate(0, -.4, -.2);
    leftFoot.matrix.rotate(0, 1, 0, 0);
    leftFoot.matrix.scale(.2, .1, .3);
    leftFoot.render();


    var rightArm = new Cube();
    rightArm.color = [.7, .7, .7, 1];
    rightArm.matrix.setTranslate(-.6, .3, 0);
    rightArm.matrix.rotate(-g_rShouAngle, 1, 0, 0);
    var rightElbMat = new Matrix4(rightArm.matrix);
    rightArm.matrix.translate(0, -.3, -.1);
    rightArm.matrix.scale(.1, .4, .2);
    rightArm.render();

    var rightFore = new Cube();
    rightFore.color = [.5, .5, .5, 1];
    rightFore.matrix = rightElbMat;
    rightFore.matrix.translate(0, -.3, 0);
    rightFore.matrix.rotate(-g_rElbAngle, 1, 0, 0);
    var rightWristMat = new Matrix4(rightFore.matrix);
    rightFore.matrix.translate(0, -.4, -.1);
    rightFore.matrix.scale(.1001, .4001, .2001);
    rightFore.render();

    var rightHand = new Cube();
    rightHand.color = [.7, .7, .7, 1];
    rightHand.matrix = rightWristMat;
    rightHand.matrix.translate(0, -.3, 0);
    rightHand.matrix.rotate(0, 1, 0, 0);
    var rightThumbMat = new Matrix4(rightHand.matrix);
    rightHand.matrix.translate(0, -.3, -.1);
    rightHand.matrix.scale(.1, .2, .2);
    rightHand.render();

    var rightThumb = new Cube();
    rightThumb.color = [.7, .7, .7, 1];
    rightThumb.matrix = rightThumbMat;
    rightThumb.matrix.translate(0, -.3, 0);
    rightThumb.matrix.rotate(0, 1, 0, 0);
    rightThumb.matrix.translate(0, .1, -.2);
    rightThumb.matrix.scale(.1, .1, .1);
    rightThumb.render();

    var rightLeg = new Cube();
    rightLeg.color = [.5, .5, .5, 1];
    rightLeg.matrix.translate(-.3, -.2, 0);
    rightLeg.matrix.rotate(-g_rLegAngle, 1, 0, 0);
    var rightKneeMat = new Matrix4(rightLeg.matrix);
    rightLeg.matrix.translate(0, -.3, -.1);
    rightLeg.matrix.scale(0.2, .3, .2);
    rightLeg.render();

    var rightKnee = new Cube();
    rightKnee.color = [.7, .7, .7, 1];
    rightKnee.matrix = rightKneeMat;
    rightKnee.matrix.translate(0, -.3, 0);
    rightKnee.matrix.rotate(-g_rKneeAngle, 1, 0, 0);
    var rightFootMat = new Matrix4(rightKnee.matrix);
    rightKnee.matrix.translate(0, -.3, -.1);
    rightKnee.matrix.scale(.2001, .3001, .2001);
    rightKnee.render();

    var rightFoot = new Cube();
    rightFoot.color = [.5, .5, .5, 1];
    rightFoot.matrix = rightFootMat;
    rightFoot.matrix.translate(0, -.4, -.2);
    rightFoot.matrix.rotate(0, 1, 0, 0);
    rightFoot.matrix.scale(.2, .1, .3);
    rightFoot.render();

    // var duration = performance.now() - startTime;
    // sendTextToHTML("ms: " + Math.floor(duration), "numdot");
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}