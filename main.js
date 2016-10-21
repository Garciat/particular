'use strict';

function hue2rgb(p, q, t){
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}

function hslToGlColor(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
}

const main = async(function* () {
    const SCREENW = document.body.clientWidth;
    const SCREENH = document.body.clientHeight;

    var canvas = document.createElement('canvas');
    canvas.width = SCREENW;
    canvas.height = SCREENH;
    document.body.appendChild(canvas);

    var gl = canvas.getContext('webgl');
    var gl_ia = gl.getExtension('ANGLE_instanced_arrays');
    
    var vertexShaderNode = WebGLHelpers.compileVertexShader(gl, yield downloadText('shaders/circle-vs.shader'));
    var fragmentShaderNode = WebGLHelpers.compileFragmentShader(gl, yield downloadText('shaders/circle-fs.shader'));
    var programNode = WebGLHelpers.makeProgram(gl, [vertexShaderNode, fragmentShaderNode]);
    gl.useProgram(programNode);

    gl.enable(gl.BLEND);
    // gl.blendFuncSeparate(gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var CIRCLE_COUNT = 100000;
    var EDGE_COUNT = 10;

    var iE = 0;
    var edges = new Float32Array(2 * 3 * EDGE_COUNT);
    var iC = 0;
    var circles = new Float32Array(3 * CIRCLE_COUNT);
    var iK = 0;
    var colors = new Float32Array(4 * CIRCLE_COUNT);

    const K = 2 * Math.PI / EDGE_COUNT;
    for (let i = 0; i < EDGE_COUNT; ++i) {
        edges[iE++] = 0;
        edges[iE++] = 0;

        edges[iE++] = Math.cos((i + 0) * K);
        edges[iE++] = Math.sin((i + 0) * K);

        edges[iE++] = Math.cos((i + 1) * K);
        edges[iE++] = Math.sin((i + 1) * K);
    }

    for (let i = 0; i < CIRCLE_COUNT; ++i) {
        let [cx, cy, cz] = hslToGlColor(0, 0.8, 0.2 + 0.6 * Math.random());

        colors[iK++] = cx;
        colors[iK++] = cy;
        colors[iK++] = cz;
    }

    function regenerate() {
        iC = 0;
        for (let i = 0; i < CIRCLE_COUNT; ++i) {
            circles[iC++] = SCREENW * Math.random();
            circles[iC++] = SCREENH * Math.random();
            circles[iC++] = 1 + 3 * Math.random();
        }
    }

    var resolutionLocation = gl.getUniformLocation(programNode, 'u_resolution');
    gl.uniform2f(resolutionLocation, SCREENW, SCREENH);

    var edgeLocation = 0;
    var circleLocation = 1;
    var colorLocation = 2;

    gl.bindAttribLocation(programNode, edgeLocation, 'a_edge');
    gl.bindAttribLocation(programNode, circleLocation, 'a_circle');
    gl.bindAttribLocation(programNode, colorLocation, 'a_color');

    var edgeBuf = gl.createBuffer();
    var circleBuf = gl.createBuffer();
    var colorBuf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, edges, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(edgeLocation);
    gl.vertexAttribPointer(edgeLocation, 2, gl.FLOAT, false, 8, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 16, 0);
    gl_ia.vertexAttribDivisorANGLE(colorLocation, 1);

    function loop() {
        requestAnimationFrame(loop);

        regenerate();

        gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
        gl.bufferData(gl.ARRAY_BUFFER, circles, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(circleLocation);
        gl.vertexAttribPointer(circleLocation, 3, gl.FLOAT, false, 12, 0);
        gl_ia.vertexAttribDivisorANGLE(circleLocation, 1);

        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl_ia.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 3 * EDGE_COUNT, CIRCLE_COUNT);
    }

    loop();
});

window.addEventListener('load', main);
