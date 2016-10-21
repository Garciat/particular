// import 'es6-promise';
/// <reference path="node_modules/@types/es6-promise/index.d.ts" />

function downloadText(url: string) {
    let xhr = new XMLHttpRequest();

    xhr.responseType = 'text';
    
    return new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
            resolve(xhr.response);
        };
        xhr.onerror = reject;

        xhr.open('GET', url, true);
        xhr.send();
    });
}

class WebGLHelpers {

    static compileFragmentShader(gl: WebGLRenderingContext, source: string) {
        return WebGLHelpers.compileShader(gl, source, gl.FRAGMENT_SHADER);
    }

    static compileVertexShader(gl: WebGLRenderingContext, source: string) {
        return WebGLHelpers.compileShader(gl, source, gl.VERTEX_SHADER);
    }

    static compileShader(gl: WebGLRenderingContext, source: string, type: number) {
        let shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    static makeProgram(gl: WebGLRenderingContext, shaders: WebGLShader[]) {
        let program = gl.createProgram();

        shaders.forEach(p => gl.attachShader(program, p));
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }

        return program;
    }
}

class WebGLRenderer {
    
    gl: WebGLRenderingContext;

    constructor(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl');
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
}
