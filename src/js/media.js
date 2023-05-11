import * as THREE from "three";

export default class {
  constructor({ element, geometry, scene, height, width, viewport }) {
    this.element = element;
    this.image = this.element.querySelector("img");
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
    // const texture = new Texture(this.gl, {
    //   generateMipmaps: false,
    // });

    this.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.plane = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.plane);

    image.src = this.image.src;
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
