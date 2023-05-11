uniform sampler2D tDiffuse;
uniform float uScrollSpeed;
uniform float uTime;
// Pass in normalised mouse position
// (-1 to 1 horizontally and vertically)
uniform vec2 mousePos;

varying vec2 vUv;

void main() {
    vec2 newUV = vUv;

    //IGNORE
    float area = smoothstep(0.4, 0.0, vUv.y);
    area = pow(area, 4.0);
    newUV.x -= (vUv.x - 0.5) * 0.1 * area * uScrollSpeed;

     // combine it all to final output
     // Get pixel color from texture
    vec4 texColor = texture2D(tDiffuse, newUV);
    gl_FragColor = vec4(texColor * 0.975);
}