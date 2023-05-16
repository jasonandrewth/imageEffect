import * as THREE from "three";

export default class {
  constructor({
    geometry,
    glb,
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
    this.glb = glb;
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

    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5, 10);

    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });

    const material2 = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      roughness: 0.15,
      transmission: 0.5,
      thickness: 50, // Add refraction!
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;

    this.scene.add(this.mesh);
    //this.scene.add(this.glb)
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
