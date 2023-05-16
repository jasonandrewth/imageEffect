import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Media from "./media2";
import Object from "./object-test";
import { lerp } from "three/src/math/MathUtils";
import Scroll from "./scroll";
import Lenis from "@studio-freight/lenis";
import * as dat from "lil-gui";

//Shaders
import selectFrag from "./shaders/selective/frag.glsl";
import selectVert from "./shaders/selective/vert.glsl";

import persFragment from "./shaders/persistence/frag.glsl";
import persVertex from "./shaders/persistence/vert.glsl";

class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    // this.projects = options.projects;
    this.maxScroll = document.querySelector(".demo-1__gallery");
    // this.layContainer = document.querySelector(".lay-content");
    // console.log("lay height", this.layContainer.scrollHeight);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    //Mouse
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    //this.target = new THREE.Vector3(0, 0, 0);

    console.log("dimensions width", this.width);
    console.log("dimensions height", this.height);

    //Loader
    // this.loader = new THREE.GLTFLoader();
    // console.log("loader", this.loader);

    //Mouse
    this.currentScroll = 0;
    //this.scroll = new Scroll();
    this.lenisScroll = new Lenis({
      lerp: 0.05,
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
    // this.pingPongSetup();
    this.mouseMovement();
    this.onResize();

    this.addObjects();
    this.createGeometry();
    this.createMedias();
    // this.createBlurPlane();
    // this.setPosition();
    //this.pingPongSetup();

    // this.composerPass();
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
    //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    //Light
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(-0.2, 0.5, 5);
    this.light.castShadow = true;

    this.light.shadow.camera.far = 15;
    this.light.shadow.mapSize.set(1024, 1024);
    this.light.shadow.normalBias = 0.05;

    const shadowHelper = new THREE.CameraHelper(this.light.shadow.camera);
    shadowHelper.name = "shadowHelper";

    this.scene.add(this.light);
    this.scene.add(shadowHelper);

    //const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
    this.scene.add(new THREE.AmbientLight(0x222222));
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);
    this.camera.position.z = 5;

    //this.camera = new THREE.PerspectiveCamera(
    //   45,
    //  this.width / this.height,
    //   100,
    //   2000
    // );
    // this.camera.position.z = 1500;

    // this.camera.fov =
    //   2 * Math.atan(this.height / 2 / this.camera.position.z) * (180 / Math.PI);
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  pingPongSetup() {
    const leftScreenBorder = -this.width / 2;
    const rightScreenBorder = this.width / 2;
    const topScreenBorder = -this.height / 2;
    const bottomScreenBorder = this.height / 2;
    // const leftScreenBorder = -innerWidth / 2;
    // const rightScreenBorder = innerWidth / 2;
    // const topScreenBorder = -innerHeight / 2;
    // const bottomScreenBorder = innerHeight / 2;
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
      this.viewport.width,
      this.viewport.height
    );

    this.fadeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        inputTexture: { value: null },
        uTime: { value: 0 },
        uBlurFactor: { value: 0.06 },
      },
      fragmentShader: persFragment,
      vertexShader: persVertex,
      //persistencevertex
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
        if (event.isPrimary === false) return;

        //this.mouse.x = (event.clientX - this.width / 2) / (this.width / 2);
        //this.mouse.y = -(event.clientY - this.height / 2) / (this.height / 2);

        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;
      },
      false
    );
  }

  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);

    this.camera.aspect = this.width / this.height;

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.camera.updateProjectionMatrix();

    this.viewport = {
      height,
      width,
    };

    window.scrollTo(0, 0);
    //this.lenisScroll.reset()
    this.lenisScroll.scrollTo(0);
    this.currentScroll = this.lenisScroll.animatedScroll;

    this.pingPongSetup();

    if (this.medias) {
      this.medias.forEach((media) =>
        media.onResize({
          height: this.height,
          width: this.width,
          viewport: this.viewport,
        })
      );
    }
  }

  addObjects() {
    this.meshes = [];
    this.objectArray = [];
    const objects = ["./glbs/kein_logo_tex.glb"];

    const geometry = new RoundedBoxGeometry(0.5, 0.5, 0.5, 16, 20);
    const geometry2 = new THREE.BoxGeometry(0.5, 0.5, 0.5, 10);
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
      geometry: geometry2,
      material: material2,
      scene: this.scene,
      width: this.width,
      height: this.height,
      viewport: this.viewport,
      top: this.maxScroll.scrollHeight * 0.5,
      x: this.maxScroll.clientWidth * 0.7,
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
    // mesh2.position.z = 100;
    mesh2.position.x = 1;
    mesh2.position.x = this.width / 2 - 200;
    mesh2.position.y = -this.height / 4;

    this.meshes.push(obj1);
    // this.meshes.push(mesh2);
    // this.meshes.push(mesh3);

    // this.meshes.forEach((mesh) => {
    //   mesh.castShadow = true;
    //   this.scene.add(mesh);
    // });
  }

  createGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 20, 20);

    const geo = new THREE.PlaneGeometry(this.width, this.height, 12, 12);
    const physicMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.blurPlane = new THREE.Mesh(geo, physicMat);
    this.blurPlane.position.z = 0;
    this.blurPlane.receiveShadow = true;

    this.scene.add(this.blurPlane);
  }

  createMedias() {
    this.mediasElements = document.querySelectorAll(".demo-1__gallery__figure");

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

    console.log(this.medias);
  }

  render() {
    this.time += 0.05;
    //   this.setPosition();
    this.lenisScroll.raf(this.time);
    this.currentScroll = this.lenisScroll.animatedScroll;

    if (this.medias) {
      this.medias.forEach((media) => media.update(this.currentScroll));
      this.medias.forEach((m) => {
        // m.plane.material.uniforms.uTime.value = this.time;
        // m.plane.material.uniforms.uScrollSpeed.value =
        //   this.lenisScroll.velocity;

        m.customUniforms.uTime.value = this.time;

        // if (this.params.scroll_effect) {
        //   m.customUniforms.uScrollSpeed.value = this.lenisScroll.velocity;
        // }
      });
    }

    if (this.meshes) {
      if (this.meshes.length > 0) {
        this.meshes.forEach((obj) => obj.update(this.currentScroll));
        this.meshes.forEach((obj) => (obj.mesh.rotation.y = this.time * 0.2));
      }
    }

    /* 
    //POSTPROCESSING
    
    */

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
