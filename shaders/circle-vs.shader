uniform vec2 u_resolution;

attribute vec2 a_position;
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);

    v_color = a_color;
}
