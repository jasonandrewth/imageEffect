import * as THREE from "three";
import Media from "./media";
import { lerp } from "../utils/math";
import NormalizeWheel from "normalize-wheel";

class Sketch {
  constructor(options) {
    this.scroll = {
      ease: 0.05,
      current: 0,
      target: 0,
    };

    this.time = 0;
    this.container = options.dom;
    // .lay-content
    this.domContainer = document.querySelector(".demo-1__gallery");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.videos = [...document.querySelectorAll("video")];
    this.projects = [...document.querySelectorAll(".type-project")];

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.createLights();

    this.onResize();

    this.createGeometry();
    this.createMedias();

    this.render();

    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    //Light
    this.light = new THREE.DirectionalLight(0xfff0dd, 1);
    this.light.position.set(0, 5, 10);
    this.scene.add(this.light);
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

  createGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 20, 20);
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
  }

  /**
   * Wheel.
   */
  onWheel(event) {
    const normalized = NormalizeWheel(event);
    const speed = normalized.pixelY;

    if (
      window.scrollY === 0 ||
      window.scrollY > this.domContainer.scrollHeight - window.innerHeight - 2
    ) {
      return;
    } else {
      this.scroll.target += speed;
    }
  }

  /**
   * Resize.
   */

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

    this.scroll = {
      ease: 0.05,
      current: 0,
      target: 0,
    };

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

  /**
   * Update.
   */
  render() {
    this.time += 0.05;

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );

    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll.current));
    }

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }

  /**
   * Listeners.
   */
  addEventListeners() {
    window.addEventListener("resize", this.onResize.bind(this));

    window.addEventListener("mousewheel", this.onWheel.bind(this));
    window.addEventListener("wheel", this.onWheel.bind(this));
  }
}

new Sketch({
  dom: document.querySelector(".container"),
});
