uniform vec2 u_resolution;

attribute vec4 a_color;
attribute vec3 a_info;

varying vec4 v_color;

void main() {
    vec2 clipspace = a_info.xy / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);
    gl_PointSize = 2.0;

    v_color = a_color;
}