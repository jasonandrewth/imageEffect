import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Media from "./media2";
import Object from "./object";
import { lerp } from "three/src/math/MathUtils";
import Scroll from "./scroll";
import Lenis from "@studio-freight/lenis";
import * as dat from "lil-gui";

//Shaders
import selectFrag from "./shaders/selective/frag.glsl";
import selectVert from "./shaders/selective/vert.glsl";

// import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
// import { RenderPass } from "three/examples/jsm/postprocessing/Renderpass";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
// import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
// import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
// import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
// import { BokehShader, BokehDepthShader } from "./bokeh2import.js";
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
// import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";

class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.maxScroll = document.querySelector(".demo-1__gallery");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.BLOOM_SCENE = 1;
    this.ENTIRE_SCENE = 0;

    //Postprocessing Ping Pong
    this.postprocessing = { enabled: false };

    //Mouse
    this.distance = 1;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.target = new THREE.Vector3(0, 0, 0);

    //Loader
    this.loader = new GLTFLoader();

    console.log("dimensions width", this.width);
    console.log("dimensions height", this.height);

    //Scroll
    this.currentScroll = 0;
    // this.scroll = new Scroll();
    this.lenisScroll = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    //Setup up functions
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.createLights();

    //POST PROCESSING
    // this.composerPass();
    // this.bokehPass();
    this.mouseMovement();
    this.onResize();

    this.addObjects();
    this.createGeometry();
    this.createMedias();
    this.createBlurPlane();
    // this.setPosition();
    //   this.pingPongSetup();

    this.debug();

    //this.mouseMovement();
    this.render();

    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    //Light
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(-3, 1, 8);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);
    this.light.shadow.camera.far = 10;
    this.light.shadow.normalBias = 0.05;

    this.shadowHelper = new THREE.CameraHelper(this.light.shadow.camera);
    this.shadowHelper.name = "shadowHelper";

    this.scene.add(this.light);
    // this.scene.add(this.shadowHelper);

    // this.scene.add(new THREE.AmbientLight(0x222222));
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);
    this.camera.position.z = 5;

    // this.camera.fov =
    //   2 * Math.atan(this.height / 2 / this.camera.position.z) * (180 / Math.PI);
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  updateAllMaterials() {
    this.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = 1;
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // Debug
  debug() {
    this.gui = new dat.GUI();

    this.params = {
      noise_factor: 0.5,
      scroll_effect: false,
      plane_blur: false,
      shadow_cam: false,
    };

    const that = this;

    this.gui
      .add(this.params, "noise_factor", 0, 1, 0.001)
      .name("Noise Factor")
      .onChange(function () {
        that.medias.forEach((media) => {
          media.customUniforms.uNoiseFactor.value = that.params.noise_factor;
        });
      });
    this.gui
      .add(this.params, "scroll_effect", false)
      .name("Scroll Effect")
      .onChange(function () {
        console.log(that.params.scroll_effect);
        // that.postprocessing.enabled = that.params.scroll_effect;
      });

    this.gui
      .add(this.params, "plane_blur", false)
      .name("Plane Blur")
      .onChange(function () {
        if (!that.params.plane_blur && that.blurPlane) {
          that.scene.remove(that.blurPlane);
        } else {
          that.scene.add(that.blurPlane);
        }
      });

    this.gui
      .add(this.params, "shadow_cam", false)
      .name("Shadow Camera")
      .onChange(function () {
        if (!that.params.shadow_cam && that.shadowHelper) {
          that.scene.remove(that.shadowHelper);
        } else {
          that.scene.add(that.shadowHelper);
        }
      });
  }

  // bokehPass() {
  //   //Efect controller idk
  //   this.effectController = {
  //     enabled: true,
  //     jsDepthCalculation: true,
  //     shaderFocus: false,

  //     fstop: 2.2,
  //     maxblur: 2.0,

  //     showFocus: true,
  //     focalDepth: 2.8,
  //     manualdof: false,
  //     vignetting: false,
  //     depthblur: true,

  //     threshold: 0.5,
  //     gain: 2.0,
  //     bias: 0.5,
  //     fringe: 0.7,

  //     focalLength: 35,
  //     noise: true,
  //     pentagon: false,

  //     dithering: 0.0001,
  //   };

  //   this.depthShader = BokehDepthShader;

  //   this.materialDepth = new THREE.ShaderMaterial({
  //     uniforms: this.depthShader.uniforms,
  //     vertexShader: this.depthShader.vertexShader,
  //     fragmentShader: this.depthShader.fragmentShader,
  //   });

  //   this.materialDepth.uniforms["mNear"].value = this.camera.near;
  //   this.materialDepth.uniforms["mFar"].value = this.camera.far;

  //   //INIT POSTPROCESSING

  //   this.postprocessing.scene = new THREE.Scene();

  //   this.postprocessing.camera = new THREE.OrthographicCamera(
  //     this.width / -2,
  //     this.width / 2,
  //     this.height / 2,
  //     this.height / -2,
  //     -10000,
  //     10000
  //   );
  //   this.postprocessing.camera.position.z = 100;

  //   this.postprocessing.scene.add(this.postprocessing.camera);

  //   this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(
  //     this.width,
  //     this.height
  //   );
  //   this.postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(
  //     this.width,
  //     this.height
  //   );

  //   const bokeh_shader = BokehShader;

  //   this.postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(
  //     bokeh_shader.uniforms
  //   );

  //   this.postprocessing.bokeh_uniforms["tColor"].value =
  //     this.postprocessing.rtTextureColor.texture;
  //   this.postprocessing.bokeh_uniforms["tDepth"].value =
  //     this.postprocessing.rtTextureDepth.texture;
  //   this.postprocessing.bokeh_uniforms["textureWidth"].value = this.width;
  //   this.postprocessing.bokeh_uniforms["textureHeight"].value = this.height;

  //   this.postprocessing.materialBokeh = new THREE.ShaderMaterial({
  //     uniforms: this.postprocessing.bokeh_uniforms,
  //     vertexShader: bokeh_shader.vertexShader,
  //     fragmentShader: bokeh_shader.fragmentShader,
  //     defines: {
  //       RINGS: 3,
  //       SAMPLES: 4,
  //     },
  //   });

  //   this.postprocessing.quad = new THREE.Mesh(
  //     new THREE.PlaneGeometry(this.width, this.height),
  //     this.postprocessing.materialBokeh
  //   );
  //   this.postprocessing.quad.position.z = -500;
  //   this.postprocessing.scene.add(this.postprocessing.quad);

  //   //Control effect
  //   this.matChanger = function () {
  //     for (const e in this.effectController) {
  //       if (e in this.postprocessing.bokeh_uniforms) {
  //         console.log("loged", e);
  //         this.postprocessing.bokeh_uniforms[e].value =
  //           this.effectController[e];
  //       }
  //     }

  //     // postprocessing.enabled = effectController.enabled;
  //     this.postprocessing.bokeh_uniforms["znear"].value = this.camera.near;
  //     this.postprocessing.bokeh_uniforms["zfar"].value = this.camera.far;
  //     // this.camera.setFocalLength(this.effectController.focalLength);
  //   };

  //   this.matChanger.bind(this);
  //   this.matChanger();
  // }

  // composerPass() {
  //   this.bloomLayer = new THREE.Layers();
  //   this.bloomLayer.set(this.BLOOM_SCENE);

  //   this.renderPass = new RenderPass(this.scene, this.camera);

  //   this.composer = new EffectComposer(this.renderer);
  //   // this.composer.renderToScreen = false;

  //   // Create the horizontal and vertical blur shaders

  //   // Create the shader passes for horizontal and vertical blur
  //   //this.hBlurPass = new ShaderPass(hBlurShader);
  //   this.vBlurPass = new ShaderPass(VerticalBlurShader);
  //   this.hBlurPass = new ShaderPass(HorizontalBlurShader);

  //   // Set the sizes of the blur passes
  //   this.hBlurPass.uniforms.h.value =
  //     (1 / window.innerWidth) * window.devicePixelRatio;
  //   this.vBlurPass.uniforms.v.value =
  //     (1 / window.innerHeight) * window.devicePixelRatio;

  //   //this.hBlurPass.renderToScreen = true;
  //   //this.vBlurPass.renderToScreen = true;

  //   console.log("pass", this.vBlurPass);

  //   // Add the blur passes to the composer
  //   //Adding passes here
  //   this.composer.addPass(this.renderPass);

  //   // this.composer.addPass(this.hBlurPass);
  //   // this.composer.addPass(this.vBlurPass);

  //   const finalPass = new ShaderPass(
  //     new THREE.ShaderMaterial({
  //       uniforms: {
  //         baseTexture: { value: null },
  //         blurTexture: { value: this.composer.renderTarget2.texture },
  //       },
  //       vertexShader: selectVert,
  //       fragmentShader: selectFrag,
  //       defines: {},
  //     }),
  //     "baseTexture"
  //   );
  //   finalPass.needsSwap = true;

  //   // this.finalComposer = new EffectComposer(this.renderer);
  //   // this.finalComposer.addPass(this.renderPass);
  //   // this.finalComposer.addPass(finalPass);

  //   //this.bloomPass = new UnrealBloomPass();
  //   //this.glitchPass = new GlitchPass();
  //   //this.composer.addPass(this.glitchPass);

  //   //this.composer.addPass(this.bloomPass);

  //   this.myEffect = {
  //     uniforms: {
  //       tDiffuse: { value: null },
  //       uScrollSpeed: { value: 0 },
  //       mousePos: { value: new THREE.Vector2(0, 0) },
  //       uTime: { value: 0 },
  //     },
  //     vertexShader: selectVert,
  //     fragmentShader: selectFrag,
  //   };

  //   this.customPass = new ShaderPass(this.myEffect);
  //   this.customPass.renderToScreen = true;
  //   this.composer.addPass(this.customPass);
  // }

  //BLOOM / BLUR
  renderBloom() {
    // this.scene.traverse(this.darkenNonBloomed.bind(this));
    // this.composer.render();
    this.camera.layers.set(this.BLOOM_SCENE);
    this.composer.render();
    this.camera.layers.set(this.ENTIRE_SCENE);
    //this.scene.traverse(this.restoreMaterial);
  }

  mouseMovement() {
    window.addEventListener(
      "mousemove",
      (event) => {
        if (event.isPrimary === false) return;

        this.mouse.x = (event.clientX - this.width / 2) / (this.width / 2);
        this.mouse.y = -(event.clientY - this.height / 2) / (this.height / 2);

        // this.mouse.x = (event.clientX / this.width) * 2 - 1;
        // this.mouse.y = -(event.clientY / this.height) * 2 + 1;

        this.postprocessing.bokeh_uniforms["focusCoords"].value.set(
          event.clientX / this.width,
          1 - event.clientY / this.height
        );

        console.log(this.postprocessing.bokeh_uniforms["focusCoords"].value);
      },
      false
    );
  }

  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);

    this.camera.aspect = this.width / this.height;

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.camera.updateProjectionMatrix();

    //POSTYPROC

    if (this.composer) this.composer.setSize(this.width, this.height);
    // this.finalComposer.setSize(this.width, this.height);
    if (this.renderPass) this.renderPass.setSize(this.width, this.height);

    // if (this.postprocessing) {
    //   this.postprocessing.rtTextureDepth.setSize(this.width, this.height);
    //   this.postprocessing.rtTextureColor.setSize(this.width, this.height);

    //   this.postprocessing.bokeh_uniforms["textureWidth"].value = this.width;
    //   this.postprocessing.bokeh_uniforms["textureHeight"].value = this.height;
    // }

    this.viewport = {
      height,
      width,
    };

    //Scroll
    // this.scroll.scrollToRender = 0;
    // this.scroll.setPosition();
    // this.lenisScroll.reset();
    // this.lenisScroll.scrollTo(0);
    this.currentScroll = this.lenisScroll.animatedScroll;

    console.log(this.currentScroll);

    if (this.medias) {
      this.medias.forEach((media) =>
        media.onResize({
          height: this.height,
          width: this.width,
          viewport: this.viewport,
        })
      );

      this.medias.forEach((media) => media.update(this.currentScroll));
    }
  }

  addObjects() {
    this.meshes = [];
    this.objectArray = [];
    const objects = ["./glbs/kein_logo_tex.glb"];

    const geometry = new RoundedBoxGeometry(0.5, 0.5, 0.5, 16, 20);
    const geometry2 = new THREE.BoxGeometry(0.5, 0.5, 0.5, 55);
    const geometry3 = new THREE.TorusKnotGeometry(0.2, 0.2, 20, 20);

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      roughness: 0.15,
      transmission: 0.5,
      thickness: 50, // Add refraction!
    });

    const material2 = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });

    const obj1 = new Object({
      geometry: geometry,
      material: material2,
      scene: this.scene,
      width: this.width,
      height: this.height,
      viewport: this.viewport,
      top: this.maxScroll.scrollHeight * 0.1,
      x: this.maxScroll.clientWidth * 0.3,
      z: 1,
      parallax: 0.5,
    });

    console.log(this.clientWidth);

    this.objectArray.push(obj1);

    console.log(obj1);

    const mesh = new THREE.Mesh(geometry, material2);
    const mesh2 = new THREE.Mesh(geometry2, material2.clone());
    const mesh3 = new THREE.Mesh(geometry3, material2.clone());
    mesh3.layers.set(this.BLOOM_SCENE);
    // mesh2.layers.set(this.BLOOM_SCENE);
    // obj1.mesh.layers.set(this.BLOOM_SCENE);
    //obj1.mesh.castShadow = true;

    mesh.position.x = -1;
    mesh.position.y = 1;
    mesh2.position.z = 2;
    mesh2.position.x = 1;
    mesh2.position.y = -1;

    // this.meshes.push(mesh);
    this.meshes.push(mesh2);
    this.meshes.push(mesh3);

    this.meshes.forEach((mesh) => {
      mesh.castShadow = true;
      this.scene.add(mesh);
    });
  }

  createGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 20, 20);
  }

  createBlurPlane() {
    const geo = new THREE.PlaneGeometry(this.width, this.height, 12, 12);
    const physicMat = new THREE.MeshPhysicalMaterial({
      // color: 0xff0000,
      // color: "transparent",
      roughness: 0.15,
      transmission: 0.5,
      metalness: 0,
      // thickness: 50, // Add refraction!
    });
    this.blurPlane = new THREE.Mesh(geo, physicMat);
    this.blurPlane.position.z = 1;

    // this.scene.add(this.blurPlane);
  }

  createMedias() {
    this.mediasElements = document.querySelectorAll(".demo-1__gallery__figure");
    this.material = new THREE.MeshBasicMaterial();

    this.materials = [];

    //Video texture
    // let vidTexture = new THREE.VideoTexture(this.video);

    this.projectStore = [];

    this.medias = Array.from(this.mediasElements).map((element) => {
      let media = new Media({
        element,
        geometry: this.planeGeometry,
        scene: this.scene,
        width: this.width,
        height: this.height,
        viewport: this.viewport,
      });

      return media;
    });

    //this.updateAllMaterials();

    console.log(this.medias);
  }

  // setPosition() {
  //   this.projectStore = [];

  //   this.projectStore.forEach((o) => {
  //     o.mesh.position.y =
  //       this.currentScroll - o.top + this.height / 2 - o.height / 2;
  //     o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
  //     o.mesh.position.z = -1;
  //   });
  // }

  saturate(x) {
    return Math.max(0, Math.min(1, x));
  }

  linearize(depth) {
    const zfar = this.camera.far;
    const znear = this.camera.near;
    return (-zfar * znear) / (depth * (zfar - znear) - zfar);
  }

  smoothstep(near, far, depth) {
    const x = this.saturate((depth - near) / (far - near));
    return x * x * (3 - 2 * x);
  }

  render() {
    this.time += 0.05;

    // this.scroll.render();
    // this.currentScroll = this.scroll.scrollToRender;
    this.currentScroll = this.lenisScroll.animatedScroll;
    this.lenisScroll.raf(this.time);
    // console.log(this.lenisScroll);
    //   this.setPosition();

    this.camera.lookAt(this.target);

    this.camera.updateMatrixWorld();

    if (this.medias) {
      this.medias.forEach((media) => media.update(this.currentScroll));
      this.medias.forEach((m) => {
        // m.plane.material.uniforms.uTime.value = this.time;
        // m.plane.material.uniforms.uScrollSpeed.value =
        //   this.lenisScroll.velocity;

        m.customUniforms.uTime.value = this.time;

        if (this.params.scroll_effect) {
          m.customUniforms.uScrollSpeed.value = this.lenisScroll.velocity;
        }
      });
    }

    if (this.objectArray.length > 0) {
      this.objectArray.forEach((obj) => obj.update(this.currentScroll));
    }

    //this.bloomPass.strength = Math.pow(this.lenisScroll.velocity, 2) / 4;

    //Postproc
    // this.renderBloom();
    // this.finalComposer.render();
    // this.customPass.uniforms.uScrollSpeed.value = this.lenisScroll.velocity;
    // this.composer.render();

    //JS DEPTH

    if (this.effectController && this.effectController.jsDepthCalculation) {
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      );

      // console.log(intersects);

      const targetDistance =
        intersects.length > 0 ? intersects[0].distance : 100;

      //if (intersects.length > 0)
      //console.log("intersect distance", intersects[0].distance);
      this.distance += (targetDistance - this.distance) * 0.03;

      // console.log("this distance", this.distance);

      const sdistance = this.smoothstep(
        this.camera.near,
        this.camera.far,
        this.distance
      );

      const ldistance = this.linearize(1 - sdistance);

      this.postprocessing.bokeh_uniforms["focalDepth"].value = ldistance;

      this.effectController["focalDepth"] = ldistance;
    }

    //Ping Pong
    if (this.postprocessing && this.postprocessing.enabled) {
      this.renderer.clear();

      // render scene into texture

      this.renderer.setRenderTarget(this.postprocessing.rtTextureColor);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);

      // render depth into texture

      this.scene.overrideMaterial = this.materialDepth;
      this.renderer.setRenderTarget(this.postprocessing.rtTextureDepth);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.scene.overrideMaterial = null;

      // render bokeh composite

      this.renderer.setRenderTarget(null);
      this.renderer.render(
        this.postprocessing.scene,
        this.postprocessing.camera
      );
    } else {
      this.scene.overrideMaterial = null;

      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }

    // this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }

  /**
   * Listeners.
   */
  addEventListeners() {
    window.addEventListener("resize", this.onResize.bind(this));
    this.container.addEventListener(
      "pointermove",
      this.mouseMovement.bind(this)
    );
  }
}

new Sketch({
  dom: document.querySelector(".container"),
});

// const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5, 55);

//     const material2 = new THREE.MeshStandardMaterial({
//       color: 0xff0000,
//     });

//     const obj1 = new ObjectCustom({
//       geometry: geometry,
//       material: material2,
//       scene: this.scene,
//       width: this.width,
//       height: this.height,
//       viewport: this.viewport,
//       top: this.maxScroll.scrollHeight * 0.1,
//       x: this.maxScroll.clientWidth * 0.3,
//       z: 1,
//       parallax: 0.5,
//     });

//     that.objectArray.push(obj1);
