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
    
    var CIRCLES = 100000;
    var PARTS = 10;
    var ATTRIBUTES = 6;
    var j = 0;
    var data = new Float32Array(6 * (3 * PARTS + 0) * CIRCLES);

    function putCircleVertex(x, y, cx, cy, cz, cw) {
        data[j++] = x;
        data[j++] = y;
        data[j++] = cx;
        data[j++] = cy;
        data[j++] = cz;
        data[j++] = cw;
    }

    const K = 2 * Math.PI / PARTS;

    function putCircle(x, y, r) {
        let [cx, cy, cz] = hslToGlColor(0, 0.8, 0.2 + 0.6 * Math.random());

        for (let i = 0; i < PARTS; ++i) {
            putCircleVertex(x,
                            y,
                            cx, cy, cz, 0);

            putCircleVertex(x + r * Math.cos((i + 0) * K),
                            y + r * Math.sin((i + 0) * K),
                            cx, cy, cz, 0);

            putCircleVertex(x + r * Math.cos((i + 1) * K),
                            y + r * Math.sin((i + 1) * K),
                            cx, cy, cz, 0);
        }
    }

    function regenerate() {
        j = 0;
        for (let m = 0; m < CIRCLES; ++m) {
            putCircle(SCREENW * Math.random(), SCREENH * Math.random(), 1 + 3 * Math.random());
        }
    }

    var resolutionLocation = gl.getUniformLocation(programNode, "u_resolution");
    gl.uniform2f(resolutionLocation, SCREENW, SCREENH);

    var positionLocation = gl.getAttribLocation(programNode, "a_position");
    var colorLocation = gl.getAttribLocation(programNode, "a_color");

    var buffer = gl.createBuffer();

    function loop() {
        requestAnimationFrame(loop);

        regenerate();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER, 
            data,
            gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.enableVertexAttribArray(colorLocation);

        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, data.length/ATTRIBUTES);
    }

    loop();
});

window.addEventListener('load', main);
