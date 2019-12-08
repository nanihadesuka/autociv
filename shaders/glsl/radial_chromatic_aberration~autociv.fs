#version 120

uniform sampler2D renderedTex;

uniform float width;
uniform float height;

varying vec2 v_tex;

// Crude implementation, 1 pass interpolation (aka no interpolation)
vec3 radial_chromatic_aberration(vec2 v_tex)
{
	vec3 color = texture2D(renderedTex,v_tex).rgb;

	float rRG = (color.r + color.g)/2.0;
	float rGB = (color.g + color.b)/2.0;

	float force = 0.01;
	vec2 dir = v_tex - vec2(0.5,0.5);
	vec2 ndir = normalize(dir);
	float len = length(dir);

	float ratio = force*pow(len,4.5);
	vec2 r_v_tex = v_tex + ndir*rRG*ratio;
	vec2 b_v_tex = v_tex - ndir*rGB*ratio;

	color.r = texture2D(renderedTex,b_v_tex).r;
	color.b = texture2D(renderedTex,r_v_tex).b;

	return color;
}

void main(void)
{
	gl_FragColor.rgb = radial_chromatic_aberration(v_tex);
}
