export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

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

    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    //Choose all videos

    this.videos = [...document.querySelectorAll("video")];

    this.videos.forEach((vid) => {
      vid.play();
      vid.addEventListener("play", function () {
        this.currentTime = 3;
      });

      //Mouse
      this.currentScroll = 0;
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.rawMouse = new THREE.Vector2();
    });

    this.scroll = new Scroll();
    this.addImages();
    //   this.addObjects();
    this.setPosition();
    //   this.pingPongSetup();

    this.mouseMovement();
    this.resize();
    this.setupResize();

    // this.composerPass();
    this.render();
  }

  mouseMovement() {
    window.addEventListener(
      "mousemove",
      (event) => {
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;

        this.rawMouse.x = event.clientX / this.width;
        this.rawMouse.y = event.clientY;

        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
          // console.log(intersects[0]);
          let obj = intersects[0].object;

          // console.log(obj.position);

          // console.log(obj);

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
    this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.materials = [];

    //Video texture
    // let vidTexture = new THREE.VideoTexture(this.video);

    this.videoStore = this.videos.map((vid) => {
      let bounds = vid.getBoundingClientRect();

      vid.style.opacity = 0;

      let geometry = new THREE.PlaneGeometry(
        bounds.width,
        bounds.height,
        20,
        20
      );

      let image = new Image();

      //   //Workaround setting dynamic source
      //   image.src = vid.src;
      //   let texture = new THREE.Texture(image);

      let vidTexture = new THREE.VideoTexture(vid);
      vidTexture.needsUpdate = true;

      let material = this.material.clone();
      this.materials.push(material);

      console.log("video texture", vidTexture);

      material.color = new THREE.Color(0xff0000);
      // console.log(material.uniforms.uImageSizes);

      // let mat2 = new THREE.MeshBasicMaterial({
      //   color: 0xff0000,
      //   map: this.loader.load(img.src),
      // });

      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        vid: vid,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });

    console.log(this.videoStore);
  }

  setPosition() {
    this.videoStore.forEach((o) => {
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
      o.mesh.position.z = -1;
    });
  }

  render() {
    this.time += 0.05;

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();

    // Render our entire scene to Framebuffer 2, on top of the faded out
    // texture of Framebuffer 1.
    this.renderer.render(this.scene, this.camera);
    // this.renderer.clearColor();

    // this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

const objects = [
  {
    url: "http://keingarten.com/wp-content/uploads/2023/04/kein_logo_chrome.glb",
  },
];
