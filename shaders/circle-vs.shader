uniform vec2 u_resolution;

attribute vec2 a_edge;
attribute vec3 a_circle;
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    vec2 clipspace = (a_circle.xy + a_circle.zz * a_edge) / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);

    v_color = a_color;
}
