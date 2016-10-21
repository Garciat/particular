uniform vec2 u_resolution;
attribute vec2 a_position;
attribute vec2 a_center;
attribute float a_radius;

varying vec2 center;
varying vec2 resolution;
varying float radius;

void main() {
    vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);

    radius = a_radius - 1.0;
    center = a_center;
    resolution = u_resolution;
}
