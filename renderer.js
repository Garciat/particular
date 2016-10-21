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
    return WebGLRenderer;
}());
