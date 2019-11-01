#version 120

uniform sampler2D renderedTex;
uniform float width;
uniform float height;

varying vec2 v_tex;

vec3 sharpen() {
  vec2 invSSize = vec2(1.0 / width, 1.0 / height);
  vec3 centerColor = texture2D(renderedTex, v_tex).rgb;
  // return centerColor;
  vec3 col = vec3(0.0);
  col += -texture2D(renderedTex, v_tex + vec2(-1.0, -1.0) * invSSize).rgb;
  col += -texture2D(renderedTex, v_tex + vec2(-1.0, 1.0) * invSSize).rgb;
  col += 5.0 * centerColor;
  col += -texture2D(renderedTex, v_tex + vec2(1.0, -1.0) * invSSize).rgb;
  col += -texture2D(renderedTex, v_tex + vec2(1.0, 1.0) * invSSize).rgb;
  return mix(centerColor, col, 0.1);
}

void main(void) { gl_FragColor.rgb = sharpen(); }
