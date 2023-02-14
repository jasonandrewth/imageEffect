// Declare a varying variable for texture coordinates
varying vec2 vUv;

void main() {
      // Set each vertex position according to the
      // orthographic camera position and projection
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      // Pass the plane texture coordinates as interpolated varying
      // variable to the fragment shader
    vUv = uv;
}