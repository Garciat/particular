'use strict';

const main = async(function* () {
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    
    var vertexShaderNode = WebGLHelpers.compileVertexShader(gl, yield downloadText('shaders/circle-vs.shader'));
    var fragmentShaderNode = WebGLHelpers.compileFragmentShader(gl, yield downloadText('shaders/circle-fs.shader'));
    var programNode = WebGLHelpers.makeProgram(gl, [vertexShaderNode, fragmentShaderNode]);
    gl.useProgram(programNode);
    
    var ATTRIBUTES = 5;
    var j = 0;
    var data = [];

    function makeCircle(x, y, r) {
        data[j++] = (x - r);
        data[j++] = (y - r);
        data[j++] = x;
        data[j++] = y;
        data[j++] = r;

        data[j++] = (x + (1 + Math.sqrt(2)) * r);
        data[j++] = y - r;
        data[j++] = x;
        data[j++] = y;
        data[j++] = r;

        data[j++] = (x - r);
        data[j++] = (y + (1 + Math.sqrt(2)) * r);
        data[j++] = x;
        data[j++] = y;
        data[j++] = r;
    }

    makeCircle(50, 50, 45);

    makeCircle(100, 100, 45);

    var dataBuffer = new Float32Array(data);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        dataBuffer,
        gl.STATIC_DRAW);

    var resolutionLocation = gl.getUniformLocation(programNode, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    var positionLocation = gl.getAttribLocation(programNode, "a_position");
    var centerLocation = gl.getAttribLocation(programNode, "a_center");
    var radiusLocation = gl.getAttribLocation(programNode, "a_radius");

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(centerLocation);
    gl.enableVertexAttribArray(radiusLocation);

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(centerLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);
    gl.vertexAttribPointer(radiusLocation, 1, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 16);

    gl.drawArrays(gl.TRIANGLES, 0, data.length/ATTRIBUTES);
});

window.addEventListener('load', main);
