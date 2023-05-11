import * as THREE from "three";
import gsap from "gsap";

//Shaders
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";

export default class {
  constructor({ element, geometry, scene, height, width, viewport }) {
    this.element = element;
    this.image = this.element.querySelector("img");
    this.image.style.opacity = 0.0;
    this.geometry = geometry;
    this.scene = scene;
    this.screen = { height: height, width: width };
    this.viewport = viewport;

    this.createMesh();
    this.createBounds();

    this.onResize();
  }

  createMesh() {
    const image = new Image();

    //Workaround setting dynamic sourc
    // const texture = new Texture(this.gl, {
    //   generateMipmaps: false,
    // });
    this.material = new THREE.MeshStandardMaterial();

    this.customUniforms = {
      uTime: { value: 0 },
      uImage: { value: 0 },
      uVideo: { value: null },
      uScrollSpeed: { value: 0 },
      hover: { value: new THREE.Vector2(0.5, 0.5) },
      hoverState: { value: 0 },
      uPlaneSizes: { value: new THREE.Vector2(0, 0) },
      uImageSizes: { value: new THREE.Vector2(0, 0) },
      uNoiseFactor: { value: 0.2 },
    };

    this.material2 = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uImage: { value: 0 },
        uVideo: { value: null },
        uNoiseFactor: { value: 0.02 },
        uScrollSpeed: { value: 0 },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
        hoverState: { value: 0 },
        uPlaneSizes: { value: new THREE.Vector2(0, 0) },
        uImageSizes: { value: new THREE.Vector2(0, 0) },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      // wireframe: true
    });

    //Workaround setting dynamic source
    image.src = this.image.src;
    let texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    //map texture
    this.material.map = texture;

    //SHADER INSERT

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.uniforms.uImage = this.customUniforms.uImage;
      shader.uniforms.uScrollSpeed = this.customUniforms.uScrollSpeed;
      shader.uniforms.hoverState = this.customUniforms.hoverState;
      shader.uniforms.uNoiseFactor = this.customUniforms.uNoiseFactor;

      //COMMON
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
          #include <common>

          #define M_PI 3.14159265358979323846

mat2 get2dRotateMatrix(float _angle) {
    return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec3 P) {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}
  
uniform vec2 hover;
uniform float hoverState;
uniform float uTime;
uniform float uScrollSpeed;
uniform float uNoiseFactor;

//varying vec2 vUvs;
varying float vNoise;
          `
      );

      //BEGIN VERTEX
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
         vec3 transformed = vec3(position);

    float dist = distance(uv, hover);

    float noise = cnoise(3.0 * vec3(position.x, position.y, position.z + uTime / 30.));

    float angle = hoverState * 0.1 * position.y * 0.1 + uTime * 0.05;

    mat2 rotate = get2dRotateMatrix(angle);

    float clampedSpeed = clamp(abs(uScrollSpeed), -6.0, 6.0);

    float isActive = hoverState > 0.0 ? hoverState : clampedSpeed;
    transformed.z += isActive * uNoiseFactor * sin(dist * 10. + uTime);
    transformed.x += isActive * uNoiseFactor * noise;
    transformed.y += isActive * uNoiseFactor * noise;

    vNoise = hoverState * sin(dist * 10. - uTime);
      `
      );

      console.log(shader.uniforms);
    };

    // this.material.uniforms.uImage.value = texture;
    // this.material.uniforms.uVideo.value = vidTexture;

    // this.material.uniforms.uImageSizes.value.x = this.image.naturalWidth;
    // this.material.uniforms.uImageSizes.value.y = this.image.naturalHeight;

    //EVENT LISTENERS
    // this.image.addEventListener("mouseenter", () => {
    //   gsap.to(this.material.uniforms.hoverState, {
    //     duration: 1,
    //     value: 1,
    //   });
    // });
    // this.image.addEventListener("mouseout", () => {
    //   gsap.to(this.material.uniforms.hoverState, {
    //     duration: 1,
    //     value: 0,
    //   });
    // });

    this.image.addEventListener("mouseenter", () => {
      gsap.to(this.customUniforms.hoverState, {
        duration: 1,
        value: 1,
      });
    });
    this.image.addEventListener("mouseout", () => {
      gsap.to(this.customUniforms.hoverState, {
        duration: 1,
        value: 0,
      });
    });

    //CREATE MESH
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.receiveShadow = true;

    this.scene.add(this.plane);
  }

  createBounds() {
    this.bounds = this.element.getBoundingClientRect();

    this.updateScale();
    this.updateX();
    this.updateY();
  }

  updateScale() {
    this.plane.scale.x =
      (this.viewport.width * this.bounds.width) / this.screen.width;
    this.plane.scale.y =
      (this.viewport.height * this.bounds.height) / this.screen.height;

    // this.material.uniforms.uPlaneSizes.value.x = this.plane.scale.x;
    // this.material.uniforms.uPlaneSizes.value.y = this.plane.scale.y;
  }

  updateX(x = 0) {
    this.plane.position.x =
      -(this.viewport.width / 2) +
      this.plane.scale.x / 2 +
      ((this.bounds.left - x) / this.screen.width) * this.viewport.width;
  }

  updateY(y = 0) {
    this.plane.position.y =
      this.viewport.height / 2 -
      this.plane.scale.y / 2 -
      ((this.bounds.top - y) / this.screen.height) * this.viewport.height;

    // console.log(y, this.plane.position.y);
  }

  update(y) {
    this.updateScale();
    this.updateX();
    this.updateY(y);
  }

  /**
   * Events.
   */
  onResize(sizes) {
    if (sizes) {
      const { height, width, viewport } = sizes;

      if (height && width) this.screen = { height: height, width: width };
      if (viewport) {
        this.viewport = viewport;
      }
    }

    this.createBounds();
  }
}
