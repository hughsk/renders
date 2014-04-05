precision mediump float;

attribute vec2 uPosition;
varying vec2 surfacePosition;

void main() {
  surfacePosition = uPosition;
  gl_Position = vec4(uPosition.x, uPosition.y, 0.0, 1.0);
}
