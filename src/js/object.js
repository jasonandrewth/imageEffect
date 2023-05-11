import * as THREE from "three";

export default class {
  constructor({
    geometry,
    top,
    x,
    z,
    parallax,
    material,
    scene,
    height,
    width,
    viewport,
  }) {
    this.geometry = geometry;
    this.material = material;
    this.scene = scene;
    this.screen = { height: height, width: width };
    this.viewport = viewport;
    //in pixels
    this.top = top;
    this.x = x;
    this.z = z;
    this.parallax = parallax;

    this.createMesh();

    this.onResize();
  }

  createMesh() {
    // const texture = new Texture(this.gl, {
    //   generateMipmaps: false,
    // });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;

    this.scene.add(this.mesh);
  }

  createBounds() {
    // this.updateScale();
    this.updateX();
    this.updateY();
  }

  //   updateX() {
  //     this.mesh.position.x = this.x;
  //   }
  updateX(x = 0) {
    this.mesh.position.x =
      -(this.viewport.width / 2) -
      this.mesh.scale.x / 2 +
      (this.x / this.screen.width) * this.viewport.width;
  }

  updateY(y = 0) {
    this.mesh.position.y =
      this.viewport.height / 2 -
      this.mesh.scale.y / 2 -
      (((this.top - y) * this.parallax) / this.screen.height) *
        this.viewport.height;
  }

  update(y) {
    // this.updateScale();
    this.mesh.position.z = this.z;
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
