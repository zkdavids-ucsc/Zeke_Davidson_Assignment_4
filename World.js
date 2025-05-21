// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    // gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    // v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal,1)));
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  varying vec4 v_VertPos;
  void main() {

    if(u_whichTexture == -3){
        gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else if (u_whichTexture == -2){
        gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1){
        gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0){
        gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1){
        gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2){
        gl_FragColor = texture2D(u_Sampler2, v_UV);
    }else {
        gl_FragColor = vec4(1,.2,.2,1);
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r=length(lightVector);
    // if(r<1.0){
    //     gl_FragColor = vec4(1,0,0,1);
    // } else if (r<2.0){
    //     gl_FragColor = vec4(0,1,0,1); 
    // }

    //Light Falloff 1/r^2
    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    // Reflection
    vec3 R = reflect(-L,N);

    // eye
    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

    // Specular
    float specular = pow(max(dot(E,R), 0.0), 10.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL;
    vec3 ambient = vec3(gl_FragColor) * 0.3;
    vec3 specLight = vec3(gl_FragColor) * specular;
    if(u_lightOn){
        gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
    }
  }`;

//Global variables
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;

let mousePosX;
let mousePosY;
let MOUSE_SENSITIVITY = 30;

let texture0;
let texture1;
let texture2;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

let g_camera = new Camera();
let g_map =[
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
];

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

let g_normalOn = false;
let g_lightPos = [0,1,-2];
let u_lightPos;
let u_cameraPos;
let g_lightOn = true;
let g_lightColor = [1.0, 1.0, 1.0];

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

    // // Get the storage location of a_Position
    a_UV = gl.getAttribLocation(gl.program, "a_UV");
    if (a_UV < 0) {
        console.log("Failed to get the storage location of a_UV");
        return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if(a_Normal < 0){
        console.log("Failed to get the storage location of a_Normal");
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
    if (!u_lightPos) {
        console.log("Failed to get the storage location of u_lightPos");
        return;
    }

    u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
    if (!u_cameraPos) {
        console.log("Failed to get the storage location of u_cameraPos");
        return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
    if (!u_lightOn) {
        console.log("Failed to get the storage location of u_lightOn");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log("failed to get the storage location of u_ModelMatrix");
        return;
    }

    // u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    // if (!u_NormalMatrix) {
    //     console.log("failed to get the storage location of u_NormalMatrix");
    //     return;
    // }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log("failed to get the storage location of u_ViewMatrix");
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log("failed to get the storage location of u_ProjectionMatrix");
        return;
    }

    // Get the storage location of u_Sampler
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }
    // Get the storage location of u_Sampler
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }
    // Get the storage location of u_Sampler
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return false;
    }

    // Get the storage location of u_Sampler
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
    document.getElementById("normalOn").onclick = function() {
        g_normalOn = true;
    };
    document.getElementById("normalOff").onclick = function() {
        g_normalOn = false;
    };

    document.getElementById("lightOn").onclick = function() {
        g_lightOn = true;
    };
    document.getElementById("lightOff").onclick = function() {
        g_lightOn = false;
    };
    document.getElementById("LightXSlide").addEventListener(
        "mousemove",
        function (ev) {
            if(ev.buttons == 1){
                g_lightPos[0] = this.value/100
                renderAllShapes();
            }
        },
    );
    document.getElementById("LightYSlide").addEventListener(
        "mousemove",
        function (ev) {
            if(ev.buttons == 1){
                g_lightPos[1] = this.value/100
                renderAllShapes();
            }
        },
    );
    document.getElementById("LightZSlide").addEventListener(
        "mousemove",
        function (ev) {
            if(ev.buttons == 1){
                g_lightPos[2] = this.value/100
                renderAllShapes();
            }
        },
    );

    document.getElementById("LightColorSlide").addEventListener(
        "mousemove",
        function (ev) {
            if(ev.buttons == 1){
                g_lightPos[2] = this.value/100
                renderAllShapes();
            }
        },
    );

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

function initTextures(gl, n) {

    var image = new Image();  // Create the image object
    if (!image) {
      console.log('Failed to create the image object');
      return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ sendTextureToTexture0(gl, n, texture0, u_Sampler0, image); };
    // Tell the browser to load an image
    image.src = 'sky.jpg';

    var metal = new Image();  // Create the image 
    if (!metal) {
        console.log('Failed to create the image object');
        return false;
      }

    // Register the event handler to be called on loading an image
    metal.onload = function(){ sendTextureToTexture1(gl, n, texture1, u_Sampler1, metal); };
    // Tell the browser to load an image
    metal.src = 'metal_box.jpg';

    var electric = new Image();  // Create the electric object

    // Register the event handler to be called on loading an electric
    electric.onload = function(){ sendTextureToTexture2(gl, n, texture2, u_Sampler2, electric); };
    // Tell the browser to load an electric
    electric.src = 'electric_box.jpg';
  
    return true;
  }
  
  function sendTextureToTexture0(gl, n, texture0, u_Sampler0, image) {
    texture0 = gl.createTexture();   // Create a texture object
    if (!texture0) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture0);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
    
    // gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  }

  function sendTextureToTexture1(gl, n, texture1, u_Sampler1, metal) {
    texture1 = gl.createTexture();   // Create a texture object
    if (!texture1) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE1);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture1);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, metal);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler1, 1);
    
    // gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  }

  function sendTextureToTexture2(gl, n, texture2, u_Sampler2, electric) {
    texture2 = gl.createTexture();   // Create a texture object
    if (!texture2) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE2);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture2);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, electric);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler2, 2);
    
    // gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  }
  

function main() {
    setupWebGL();

    connectVariablestoGLSL();

    addActionsForHtmlUI();

    document.onkeydown = keydown;
    canvas.onmousemove = function(ev){
        mouseCam(ev);
    }
    canvas.onmouseenter = function(ev){
        coord = convertCoordinatesEventToGL(ev);
        mousePosX = coord[0];   
        mousePosY = coord[1];
    }

    initTextures(gl, 2);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

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

// function click(ev) {
//     [x, y] = convertCoordinatesEventToGL(ev);

    
//     let point;
//     if(g_selectedType == POINT){
//         point = new Point();
//     }
//     else if(g_selectedType == TRIANGLE){
//         point = new Triangle();
//     }
//     else if(g_selectedType == CIRCLE){
//         point = new Circle();
//     }
//     point.position = [x, y];
//     point.color = g_selectedColor.slice();
//     point.size = g_selectedSize;
//     point.segments = g_selectedSegments;
//     g_shapesList.push(point);

//     renderAllShapes();
// }

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
    g_lightPos[0] = Math.cos(g_seconds);
}
 
 function mouseCam(ev){
    coord = convertCoordinatesEventToGL(ev);

    if(mousePosX > coord[0]){
        g_camera.panLeft((mousePosX - coord[0]) * MOUSE_SENSITIVITY);
    } else if (mousePosX < coord[0]){
        g_camera.panRight((mousePosX - coord[0]) * MOUSE_SENSITIVITY);
    }
    mousePosX = coord[0];
    mousePosY = coord[1];
 }

function keydown(ev){
    if(ev.keyCode == 68){      // d (move right)
        g_camera.right();
    }else if (ev.keyCode == 65){
        g_camera.left();
    } else if(ev.keyCode == 87){
        g_camera.forward();
    } else if(ev.keyCode == 83){
        g_camera.back();
    } else if(ev.keyCode == 81){
        g_camera.panLeft(5);
    } else if (ev.keyCode == 69){
        g_camera.panRight(-5);
    }

    renderAllShapes();
    // console.log(ev.keyCode);
    // console.log(g_camera);
}

function drawMap(){
    for(x=0; x<32; x++){
        for(y=0;y<32;y++){
            if(g_map[x][y]!=0){
                var cube = new Cube();
                cube.color == [1, 1, 1, 1];
                cube.textureNum = g_map[x][y];
                cube.matrix.translate(x-16, -1, y-16);
                cube.render();
            }
        }
    }
}

function renderAllShapes() {
    var projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, .1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2],);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //light position
    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    //camera position
    gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

    gl.uniform1i(u_lightOn, g_lightOn);

    // drawMap();

    var sphere = new Sphere();
    sphere.color = [1,1,1,1];
    sphere.textureNum = -2;
    if(g_normalOn == true) sphere.textureNum = -3;
    sphere.matrix.translate(2, 0, 0);
    sphere.matrix.scale(1, 1, 1);
    sphere.render();

    var light = new Cube();
    light.color=[2,2,0,1];
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-.1, -.1, -.1);
    light.matrix.translate(-.5, -.5, -.5);
    light.render();

    var ground = new Cube();
    ground.color = [1, 0, 0, 1];
    ground.textureNum = 1;
    ground.matrix.translate(0, -1, 0);
    ground.matrix.rotate(0, 0, 0, 1);
    ground.matrix.scale(-8, -0.1, -8);
    ground.matrix.translate(-.5, -.5, -.5);
    ground.render();

    var sky = new Cube();
    sky.color = [.5, .9, .9, 1];
    sky.textureNum = -2;
    if(g_normalOn == true) sky.textureNum = -3;
    sky.matrix.translate(0, 2, 0);
    sky.matrix.scale(-8, -8, -8);
    sky.matrix.translate(-.5, -.5, -.5);
    sky.render();
    
    var body = new Cube();
    body.color = [.7, .7, .7, 1];
    if(g_normalOn == true) body.textureNum = -3;
    body.matrix.translate(-.4, -.2, -.3);
    body.matrix.rotate(0, 0, 0, 1);
    body.matrix.scale(0.8, .6, .6);
    // body.normalMatrix.setInverseOf(body.matrix).transpose();
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