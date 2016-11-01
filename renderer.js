var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function downloadText(url) {
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            resolve(xhr.response);
        };
        xhr.onerror = reject;
        xhr.open('GET', url, true);
        xhr.send();
    });
}
class WebGLHelpers {
    static compileFragmentShader(gl, source) {
        return WebGLHelpers.compileShader(gl, source, gl.FRAGMENT_SHADER);
    }
    static compileVertexShader(gl, source) {
        return WebGLHelpers.compileShader(gl, source, gl.VERTEX_SHADER);
    }
    static compileShader(gl, source, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    static makeProgram(gl, shaders) {
        let program = gl.createProgram();
        shaders.forEach(p => gl.attachShader(program, p));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        return program;
    }
    static createSizedArray(gl, size, usage) {
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, size, usage);
        return buffer;
    }
}
class CircleRenderer {
    constructor(gl) {
        this.gl = gl;
        this.gl_ia = gl.getExtension('ANGLE_instanced_arrays');
        this.circleGeometry = new Float32Array(2 * (CircleRenderer.CIRCLE_EDGE_COUNT + 2));
        this.circleColors = new Float32Array(4 * CircleRenderer.MAX_CIRCLE_COUNT);
        this.circleInfo = new Float32Array(3 * CircleRenderer.MAX_CIRCLE_COUNT);
        this.circleCount = 0;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const gl = this.gl;
            let vertexShader = WebGLHelpers.compileVertexShader(gl, yield downloadText('shaders/circle-vs.shader'));
            let fragmentShader = WebGLHelpers.compileFragmentShader(gl, yield downloadText('shaders/circle-fs.shader'));
            let program = WebGLHelpers.makeProgram(gl, [vertexShader, fragmentShader]);
            this.glProgram = program;
            this.glBufferGeometry = WebGLHelpers.createSizedArray(gl, this.circleGeometry.byteLength, gl.STATIC_DRAW);
            this.glBufferColors = WebGLHelpers.createSizedArray(gl, this.circleColors.byteLength, gl.STATIC_DRAW);
            this.glBufferInfo = WebGLHelpers.createSizedArray(gl, this.circleInfo.byteLength, gl.DYNAMIC_DRAW);
            let iV = 0;
            const K = 2 * Math.PI / CircleRenderer.CIRCLE_EDGE_COUNT;
            this.circleGeometry[iV++] = 0;
            this.circleGeometry[iV++] = 0;
            for (let i = 0; i <= CircleRenderer.CIRCLE_EDGE_COUNT; ++i) {
                this.circleGeometry[iV++] = Math.cos(i * K);
                this.circleGeometry[iV++] = Math.sin(i * K);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glBufferGeometry);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.circleGeometry);
            this.glU_resolution = gl.getUniformLocation(program, 'u_resolution');
            this.glA_edge = 0;
            this.glA_color = 1;
            this.glA_info = 2;
            gl.bindAttribLocation(program, this.glA_edge, 'a_edge');
            gl.bindAttribLocation(program, this.glA_color, 'a_color');
            gl.bindAttribLocation(program, this.glA_info, 'a_info');
        });
    }
    addCircle(x, y, r, color) {
        const id = this.circleCount;
        this.circleInfo[id * 3 + 0] = x;
        this.circleInfo[id * 3 + 1] = y;
        this.circleInfo[id * 3 + 2] = r;
        this.circleColors[id * 4 + 0] = color[0];
        this.circleColors[id * 4 + 1] = color[1];
        this.circleColors[id * 4 + 2] = color[2];
        this.circleColors[id * 4 + 3] = color[3];
        this.circleCount += 1;
        return id;
    }
    getCircleColor(id) {
        let r = this.circleColors[id * 4 + 0];
        let g = this.circleColors[id * 4 + 1];
        let b = this.circleColors[id * 4 + 2];
        let a = this.circleColors[id * 4 + 3];
        return [r, g, b, a];
    }
    flushCircles() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBufferColors);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.circleColors.subarray(0, 4 * this.circleCount));
    }
    updateCircle(id, x, y) {
        this.circleInfo[id * 3 + 0] = x;
        this.circleInfo[id * 3 + 1] = y;
    }
    removeCircle(id) {
        // TODO
    }
    draw() {
        const gl = this.gl;
        const gl_ia = this.gl_ia;
        gl.useProgram(this.glProgram);
        gl.uniform2f(this.glU_resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBufferGeometry);
        gl.enableVertexAttribArray(this.glA_edge);
        gl.vertexAttribPointer(this.glA_edge, 2, gl.FLOAT, false, 8, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBufferColors);
        gl.enableVertexAttribArray(this.glA_color);
        gl.vertexAttribPointer(this.glA_color, 4, gl.FLOAT, false, 16, 0);
        gl_ia.vertexAttribDivisorANGLE(this.glA_color, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBufferInfo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.circleInfo.subarray(0, 3 * this.circleCount));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 12, 0);
        gl_ia.vertexAttribDivisorANGLE(2, 1);
        gl_ia.drawArraysInstancedANGLE(gl.TRIANGLE_FAN, 0, CircleRenderer.CIRCLE_EDGE_COUNT + 2, this.circleCount);
    }
}
CircleRenderer.CIRCLE_EDGE_COUNT = 10;
CircleRenderer.MAX_CIRCLE_COUNT = 100000;
function hue2rgb(p, q, t) {
    if (t < 0)
        t += 1;
    if (t > 1)
        t -= 1;
    if (t < 1 / 6)
        return p + (q - p) * 6 * t;
    if (t < 1 / 2)
        return q;
    if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
function hslToGlColor(h, s, l) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}
