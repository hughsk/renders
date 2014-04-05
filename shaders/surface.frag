precision mediump float;

uniform sampler2D backbuffer;
varying vec2 surfacePosition;

void main() {
  vec2 uv = (surfacePosition + vec2(1.0)) * 0.5;
  vec4 color = texture2D(backbuffer, uv);
  gl_FragColor = color;
}
