precision highp float;

uniform vec2 uImageSizes;
uniform vec2 uPlaneSizes;
uniform vec2 hover;
uniform float hoverState;
uniform sampler2D uImage;
uniform sampler2D uVideo;

varying vec2 vUvs;
varying float vNoise;

void main() {

    vec3 color = vec3(0.0);
    vec2 ratio = vec2(min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0), min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0));

    vec2 uv = vec2(vUvs.x * ratio.x + (1.0 - ratio.x) * 0.5, vUvs.y * ratio.y + (1.0 - ratio.y) * 0.5);

    vec4 textureSample = texture2D(uImage, uv);

    color = textureSample.rgb;
    //color += 0.03 * vec3(vNoise);
    //color -= vec3(0.0, hoverState, hoverState);

    // color = vec3(vNoise);

    gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
}
