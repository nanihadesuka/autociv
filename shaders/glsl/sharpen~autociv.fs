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


  // col += -1.0 * texture2D(renderedTex, v_tex + vec2(-2.0, -2.0) * invSSize).rgb;
  // col += -4.0 * texture2D(renderedTex, v_tex + vec2(-1.0, -2.0) * invSSize).rgb;
  // col += -6.0 * texture2D(renderedTex, v_tex + vec2(+0.0, -2.0) * invSSize).rgb;
  // col += -4.0 * texture2D(renderedTex, v_tex + vec2(+1.0, -2.0) * invSSize).rgb;
  // col += -1.0 * texture2D(renderedTex, v_tex + vec2(+2.0, -2.0) * invSSize).rgb;

  // col += -1.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(-2.0, -1.0) * invSSize).rgb;
  // col += -4.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(-1.0, -1.0) * invSSize).rgb;
  // col += -6.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+0.0, -1.0) * invSSize).rgb;
  // col += -4.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+1.0, -1.0) * invSSize).rgb;
  // col += -1.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+2.0, -1.0) * invSSize).rgb;

  // col += -1.0 * 6.0 * texture2D(renderedTex, v_tex + vec2(-2.0, +0.0) * invSSize).rgb;
  // col += -4.0 * 6.0 * texture2D(renderedTex, v_tex + vec2(-1.0, +0.0) * invSSize).rgb;
  // col += +478.0 * texture2D(renderedTex, v_tex + vec2(+0.0, +0.0) * invSSize).rgb;
  // col += -4.0 * 6.0 * texture2D(renderedTex, v_tex + vec2(+1.0, +0.0) * invSSize).rgb;
  // col += -1.0 * 6.0 * texture2D(renderedTex, v_tex + vec2(+2.0, +0.0) * invSSize).rgb;

  // col += -1.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(-2.0, +1.0) * invSSize).rgb;
  // col += -4.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(-1.0, +1.0) * invSSize).rgb;
  // col += -6.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+0.0, +1.0) * invSSize).rgb;
  // col += -4.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+1.0, +1.0) * invSSize).rgb;
  // col += -1.0 * 4.0 * texture2D(renderedTex, v_tex + vec2(+2.0, +1.0) * invSSize).rgb;

  // col += -1.0 * texture2D(renderedTex, v_tex + vec2(-2.0, +2.0) * invSSize).rgb;
  // col += -4.0 * texture2D(renderedTex, v_tex + vec2(-1.0, +2.0) * invSSize).rgb;
  // col += -6.0 * texture2D(renderedTex, v_tex + vec2(+0.0, +2.0) * invSSize).rgb;
  // col += -4.0 * texture2D(renderedTex, v_tex + vec2(+1.0, +2.0) * invSSize).rgb;
  // col += -1.0 * texture2D(renderedTex, v_tex + vec2(+2.0, +2.0) * invSSize).rgb;

  // col /= 256.0;
  // return mix(centerColor, col, 1.0);
}

void main(void) { gl_FragColor.rgb = sharpen(); }
