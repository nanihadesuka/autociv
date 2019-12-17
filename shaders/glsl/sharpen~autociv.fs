#version 120

uniform sampler2D renderedTex;
uniform float width;
uniform float height;

varying vec2 v_tex;

vec3 sharpen(sampler2D tex, vec2 v_tex, float factor) {

  vec3 centerColor = texture2D(tex, v_tex).rgb;

  vec2 inv = vec2(1.0 / width, 1.0 / height);
  vec3 col = vec3(0.0);

  col -= texture2D(tex, v_tex + vec2(-1.0, -1.0) * inv).rgb;
  col -= texture2D(tex, v_tex + vec2(-1.0, 1.0) * inv).rgb;
  col += 5.0 * centerColor;
  col -= texture2D(tex, v_tex + vec2(1.0, -1.0) * inv).rgb;
  col -= texture2D(tex, v_tex + vec2(1.0, 1.0) * inv).rgb;

  return mix(centerColor, col, factor);
}

void main(void) { gl_FragColor.rgb = sharpen(renderedTex, v_tex, 0.1); }
