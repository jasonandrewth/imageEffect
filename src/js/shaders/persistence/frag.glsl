// Pass the texture from Framebuffer 1
uniform sampler2D inputTexture;
uniform float uTime;
uniform float uBlurFactor;

    // Consume the interpolated texture coordinates
varying vec2 vUv;

void main() {
      // Get pixel color from texture
    vec4 texColor = texture2D(inputTexture, vUv * 0.999);

      // Our fade-out color
    vec4 fadeColor = vec4(1.0, 1.0, 1.0, 0.0);

      // this step achieves the actual fading out
      // mix texColor into fadeColor by a factor of 0.05
      // you can change the value of the factor and see
      // the result will change accordingly
    gl_FragColor = mix(texColor, fadeColor, uBlurFactor);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}