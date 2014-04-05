#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

varying vec2 surfacePosition;

void main() {
  vec2 pos = gl_FragCoord.xy;

  pos += vec2(sin(pos.x + time), sin(pos.y - time));
  pos += sin(pos * 0.2) * 10.0;
  pos += cos(pos * 0.1) * 10.0;
  pos += mouse.xy * resolution * 0.1;

  vec3 color = vec3(
      abs(sin(pos.x * 0.1 + time))
    , abs(sin(pos.y * 0.1 + time))
    , 0.5
  );

  color.r = pow(color.r, 0.1);
  color.g = pow(color.g, 0.5);
  color.b = pow(color.b, 0.6);

  color = mix(
      color
    , vec3(clamp(dot(color, normalize(vec3(0.0, 1.0, 0.0))), 0.0, 1.0))
    , (cos(time * 2.5) + 1.0) * 0.5
  );

  color = vec3(1.0) - color;
  gl_FragColor = vec4(color, 1.0);
}
