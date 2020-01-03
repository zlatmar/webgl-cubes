// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');
const eases = require('eases');
const BezierEasing = require('bezier-easing');
const glsl = require('glslify');

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [590, 590],
  fps: 24,
  duration: 8,
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  attributes: { antialiases: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("hsl(0, 0%, 95%)", 1.0);

  // Setup a camera
  const camera = new THREE.OrthographicCamera(50, 1, 0.01, 100);


  // Setup your scene
  const scene = new THREE.Scene();

  const palette = random.pick(palettes);

  const fragmentShader = `
      varying vec2 vUv;

      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(vec3(color * vUv.x), 1.0);
      }
  `;

  const vertexShader = glsl(`
        varying vec2 vUv;
        uniform float time;

        #pragma glslify: noise = require('glsl-noise/simplex/4d');

        void main() {
          vUv = uv;
          vec3 pos = position.xyz;
          pos += noise(vec4(position.xyz, time)) * 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `);

  // Setup a geometry
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const meshes = [];
  // Setup a mesh with geometry + material
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: {
          color: { value: new THREE.Color(random.pick(palette)) },
          time: { value: 0 }
        }
      }));
    mesh.position.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    );
    mesh.scale.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    )

    mesh.scale.multiplyScalar(0.5);

    scene.add(mesh);
    meshes.push(mesh);
  }

  scene.add(new THREE.AmbientLight('hsl(0, 0%, 40%)'));

  const light = new THREE.DirectionalLight('white', 1);
  light.position.set(
    0, 0, 4
  )
  scene.add(light);

  const easeFn = BezierEasing(0.67, 0.03, 0.29, 0.99);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);

      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 1.5;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -100;
      camera.far = 100;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update the camera
      camera.updateProjectionMatrix();

    },
    // Update & render your scene here
    render({ playhead, time }) {
      const t = Math.sin(playhead * Math.PI * 2) * 2;
      scene.rotation.z = easeFn(t);

      meshes.forEach(mesh => {
        mesh.material.uniforms.time.value = time;
      })

      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
