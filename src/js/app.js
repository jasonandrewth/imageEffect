import * as THREE from "three";
import imagesLoaded from "imagesloaded";
import gsap from "gsap";
import Scroll from "./scroll";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { lerp } from "three/src/math/MathUtils";
//Shaders
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";

import persFragment from "./shaders/persistence/frag.glsl";
import persVertex from "./shaders/persistence/vert.glsl";

//Post processing
// import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
// import { RenderPass } from "three/examples/jsm/postprocessing/Renderpass.js";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    console.log("INIT", options.dom);

    /*
    SETUP 
    */
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      100,
      2000
    );
    this.camera.position.z = 1500;

    this.camera.fov =
      2 * Math.atan(this.height / 2 / this.camera.position.z) * (180 / Math.PI);

    //Light
    this.light = new THREE.DirectionalLight(0xfff0dd, 1);
    this.light.position.set(0, 5, 10);
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.images = [...document.querySelectorAll("img")];
    this.meshTransforms = [];

    //TRY VIDEO
    this.video = document.getElementById("video");
    this.video.play();
    this.video.addEventListener("play", function () {
      this.currentTime = 3;
    });

    // Preload images
    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll("img"),
        { background: true },
        resolve
      );
    });

    this.currentScroll = 0;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    preloadImages.then(() => {
      this.scroll = new Scroll();
      this.addImages();
      this.addObjects();
      this.setPosition();
      this.pingPongSetup();

      this.mouseMovement();
      this.resize();
      this.setupResize();

      // this.composerPass();
      this.render();
    });
  }

  // composerPass() {
  //   this.composer = new EffectComposer(this.renderer);
  //   this.renderPass = new RenderPass(this.scene, this.camera);
  //   this.composer.addPass(this.renderPass);

  //   //custom shader pass
  //   let counter = 0.0;

  //   this.myEffect = {
  //     uniforms: {
  //       tDiffuse: { value: null },
  //       uScrollSpeed: { value: 0 },
  //       mousePos: { value: new THREE.Vector2(0, 0) },
  //       uTime: { value: 0 },
  //     },
  //     vertexShader: `
  //       varying vec2 vUvs;
  //       void main() {
  //         vUvs = uv;

  //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //       }
  //     `,
  //     fragmentShader: postprocFragment,
  //   };

  //   this.customPass = new ShaderPass(this.myEffect);
  //   this.customPass.renderToScreen = true;
  //   this.composer.addPass(this.customPass);

  //   this.bloomPass = new UnrealBloomPass();

  //   // this.composer.addPass(this.bloomPass);
  // }

  pingPongSetup() {
    const leftScreenBorder = -innerWidth / 2;
    const rightScreenBorder = innerWidth / 2;
    const topScreenBorder = -innerHeight / 2;
    const bottomScreenBorder = innerHeight / 2;
    const near = -100;
    const far = 100;
    this.orthoCamera = new THREE.OrthographicCamera(
      leftScreenBorder,
      rightScreenBorder,
      topScreenBorder,
      bottomScreenBorder,
      near,
      far
    );
    this.orthoCamera.position.z = -10;
    this.orthoCamera.lookAt(new THREE.Vector3(0, 0, 0));

    this.fullscreenQuadGeometry = new THREE.PlaneGeometry(
      this.width,
      this.height
    );

    this.fadeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        inputTexture: { value: null },
        uTime: { value: 0 },
      },
      fragmentShader: persFragment,
      vertexShader: persVertex,
    });

    this.fadePlane = new THREE.Mesh(
      this.fullscreenQuadGeometry,
      this.fadeMaterial
    );

    // create the resultPlane

    // We will use it simply to copy the contents of fadePlane to the device screen

    this.resultMaterial = new THREE.MeshBasicMaterial({ map: null });
    this.resultPlane = new THREE.Mesh(
      this.fullscreenQuadGeometry,
      this.resultMaterial
    );

    // Create two extra framebuffers manually

    this.framebuffer1 = new THREE.WebGLRenderTarget(this.width, this.height);
    this.framebuffer2 = new THREE.WebGLRenderTarget(this.width, this.height);

    this.renderer.setClearColor(0x111111);
    this.renderer.setRenderTarget(this.framebuffer1);
    this.renderer.clearColor();
    this.renderer.setRenderTarget(this.framebuffer2);
    this.renderer.clearColor();
  }

  mouseMovement() {
    window.addEventListener(
      "mousemove",
      (event) => {
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;

        //COMPOSER PASS RELATED
        // this.customPass.uniforms.mousePos.value.x = this.mouse.x;
        // this.customPass.uniforms.mousePos.value.y = this.mouse.y;

        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
          // console.log(intersects[0]);
          let obj = intersects[0].object;

          console.log(obj);

          if (obj.geometry instanceof THREE.PlaneGeometry) {
            obj.material.uniforms.hover.value = intersects[0].uv;
          }
        }
      },
      false
    );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    // this.setPosition();

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uImage: { value: 0 },
        uVideo: { value: null },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
        hoverState: { value: 0 },
        uPlaneSizes: { value: new THREE.Vector2(0, 0) },
        uImageSizes: { value: new THREE.Vector2(0, 0) },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      // wireframe: true
    });

    this.materials = [];

    //Video texture
    let vidTexture = new THREE.VideoTexture(this.video);

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();

      img.style.opacity = 0;

      let geometry = new THREE.PlaneGeometry(
        bounds.width,
        bounds.height,
        20,
        20
      );

      let image = new Image();

      //Workaround setting dynamic source
      image.src = img.src;
      let texture = new THREE.Texture(image);
      texture.needsUpdate = true;

      let material = this.material.clone();

      img.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 1,
        });
      });
      img.addEventListener("mouseout", () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 0,
        });
      });

      this.materials.push(material);

      console.log(vidTexture);

      material.uniforms.uImage.value = texture;
      material.uniforms.uVideo.value = vidTexture;

      material.uniforms.uImageSizes.value.x = img.naturalWidth;
      material.uniforms.uImageSizes.value.y = img.naturalHeight;

      // console.log(material.uniforms.uImageSizes);

      // let mat2 = new THREE.MeshBasicMaterial({
      //   color: 0xff0000,
      //   map: this.loader.load(img.src),
      // });

      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });

    console.log(this.imageStore);
  }

  addObjects() {
    this.meshes = [];
    const geometry = new RoundedBoxGeometry(150, 150, 100, 16, 20);
    const geometry2 = new THREE.BoxGeometry(100, 100, 100, 55);
    const geometry3 = new THREE.TorusKnotGeometry(50, 20, 20, 20);
    // this.geometry = new THREE.SphereBufferGeometry( 0.4, 40,40 );
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      roughness: 0.15,
      transmission: 0.5,
      thickness: 50, // Add refraction!
    });

    const mesh = new THREE.Mesh(geometry, material);
    const mesh2 = new THREE.Mesh(geometry2, material);
    const mesh3 = new THREE.Mesh(geometry3, material);

    mesh.position.x = -this.width / 4 + 150;
    mesh.position.y = this.height / 4;
    mesh2.position.x = this.width / 2 - 200;
    mesh2.position.y = -this.height / 4;
    mesh3.position.x = -this.width / 4 - 200;
    mesh3.position.y = -this.height / 4;
    mesh.position.z = 100;
    mesh2.position.z = 100;
    mesh3.position.z = 100;

    this.meshes.push(mesh);
    this.meshes.push(mesh2);
    this.meshes.push(mesh3);
    this.scene.add(mesh);
    this.scene.add(mesh2);
    this.scene.add(mesh3);
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
      o.mesh.position.z = -1;

      o.mesh.material.uniforms.uPlaneSizes.value.x = o.width;
      o.mesh.material.uniforms.uPlaneSizes.value.y = o.height;

      // Assign random positions and scale to each plane
      this.meshTransforms.push({
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 2,
        scale: Math.random() * 0.2 + 0.1,
      });
    });
  }

  render() {
    this.time += 0.05;

    this.meshes.forEach((mesh) => {
      mesh.rotation.y = this.time / 30;
    });

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();

    this.imageStore.forEach((image, i) => {
      const mesh = image.mesh;
      const meshTransform = this.meshTransforms[i];
      // console.log(meshTransform);

      const moveRadius = 0.4;
      const speedFactor = this.time / 4;
      const x =
        meshTransform.x +
        Math.cos(speedFactor + meshTransform.y * 2) * moveRadius;
      const y =
        meshTransform.y +
        Math.sin(speedFactor + meshTransform.x * 2) * moveRadius;
      const z =
        meshTransform.z +
        Math.cos(speedFactor - meshTransform.x * 2) * moveRadius;

      const rotX = x + this.time;
      const rotY = y + this.time;
      const rotZ = z + this.time;

      // mesh.position.add(new THREE.Vector3(x, y, z).multiplyScalar(20));
      // mesh.rotation.set(0, 0, rotZ);
      // mesh.scale.set(
      //   meshTransform.scale,
      //   meshTransform.scale,
      //   meshTransform.scale
      // )

      const mouseFactorX = lerp(
        mesh.position.x,
        mesh.position.x - this.mouse.x * 250,
        0.4
      );

      const mouseFactorY = lerp(
        mesh.position.y,
        mesh.position.y - this.mouse.y * 250,
        0.4
      );
      // console.log(mouseFactorX);
      // mesh.position.add(
      //   new THREE.Vector3(mouseFactorX, -this.mouse.y, 0).multiplyScalar(50)
      // );
      mesh.position.setX(mouseFactorX);
      mesh.position.setY(mouseFactorY);
    });

    //Compser Pass related:
    // this.customPass.uniforms.uScrollSpeed.value = this.scroll.speedTarget;
    // this.bloomPass.strength = Math.pow(this.scroll.speedTarget, 2) / 4;
    // this.customPass.uniforms.uTime.value = this.time;

    // this.composer.render();

    this.materials.forEach((m) => {
      m.uniforms.uTime.value = this.time;
    });

    this.renderer.autoClearColor = false;
    this.renderer.setRenderTarget(this.framebuffer2);

    // Render the image buffer associated with Framebuffer 1 to Framebuffer 2
    // fading it out to pure black by a factor of 0.05 in the fadeMaterial
    // fragment shader
    this.fadePlane.material.uniforms.inputTexture.value =
      this.framebuffer1.texture;
    this.fadePlane.material.uniforms.uTime.value = this.time;
    this.renderer.render(this.fadePlane, this.camera);

    // Render our entire scene to Framebuffer 2, on top of the faded out
    // texture of Framebuffer 1.
    this.renderer.render(this.scene, this.camera);
    // this.renderer.clearColor();

    // Set the Default Framebuffer (device screen) represented by null as active WebGL framebuffer to render to.
    this.renderer.setRenderTarget(null);

    // Copy the pixel contents of Framebuffer 2 by passing them as a texture
    // to resultPlane and rendering it to the Default Framebuffer (device screen)
    this.resultPlane.material.map = this.framebuffer2.texture;
    this.renderer.render(this.resultPlane, this.camera);

    // Swap Framebuffer 1 and Framebuffer 2
    const swap = this.framebuffer1;
    this.framebuffer1 = this.framebuffer2;
    this.framebuffer2 = swap;

    // this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  dom: document.querySelector(".container"),
});
