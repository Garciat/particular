// import 'es6-promise';
/// <reference path="node_modules/@types/es6-promise/index.d.ts" />
function downloadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    return new Promise(function (resolve, reject) {
        xhr.onload = function () {
            resolve(xhr.response);
        };
        xhr.onerror = reject;
        xhr.open('GET', url, true);
        xhr.send();
    });
}
var WebGLHelpers = (function () {
    function WebGLHelpers() {
    }
    WebGLHelpers.compileFragmentShader = function (gl, source) {
        return WebGLHelpers.compileShader(gl, source, gl.FRAGMENT_SHADER);
    };
    WebGLHelpers.compileVertexShader = function (gl, source) {
        return WebGLHelpers.compileShader(gl, source, gl.VERTEX_SHADER);
    };
    WebGLHelpers.compileShader = function (gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };
    WebGLHelpers.makeProgram = function (gl, shaders) {
        var program = gl.createProgram();
        shaders.forEach(function (p) { return gl.attachShader(program, p); });
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        return program;
    };
    return WebGLHelpers;
}());
var WebGLRenderer = (function () {
    function WebGLRenderer(canvas) {
        this.gl = canvas.getContext('webgl');
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
    WebGLRenderer.prototype.initBuffers = function () {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        var vertices = [
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        var a_position = gl.getAttribLocation(shaderProgram, 'a_position');
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    };
    WebGLRenderer.prototype.drawScene = function (time) {
        gl.uniform1f(u_time, time / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    WebGLRenderer.prototype.webGLStart = function (canvas) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        initGL(canvas);
        initShaders();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        initBuffers();
    };
    WebGLRenderer.prototype.canvasClicked = function () {
        toggleFullScreen();
    };
    WebGLRenderer.prototype.windowResized = function () {
        var canvas = document.getElementById('canvas');
        webGLStart(canvas);
    };
    WebGLRenderer.prototype.loop = function (time) {
        drawScene(time);
        requestAnimationFrame(loop);
    };
    WebGLRenderer.prototype.main = function () {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener('click', canvasClicked);
        webGLStart(canvas);
        loop();
    };
    return WebGLRenderer;
}());
