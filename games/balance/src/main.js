import * as THREE from 'three';
import './styles.css';
import { level01 } from './levels/level-01.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="game-shell">
    <header class="hud hud--top">
      <section class="panel brand">
        <strong>ВІДЛІК</strong>
        <span>BALANCE · математика оживлює світ</span>
      </section>
      <section class="panel level-status">
        <strong>РІВЕНЬ ${level01.id}</strong>
        <span>${level01.title}</span>
      </section>
    </header>
    <div id="scene" class="scene"></div>
    <section class="panel mission">
      <small>ПОТОЧНЕ ЗАВДАННЯ</small>
      <h1>Заряди генератор до ${level01.generator.targetValue}</h1>
      <p>Знайди ядро <b>+${level01.cores[0].value}</b> і запусти механізм.</p>
    </section>
  </main>
`;

const host = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b2237);
scene.fog = new THREE.FogExp2(0x91cde8, 0.025);

const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, 0.1, 100);
camera.position.set(8, 7, 9.8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
host.append(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x27313d, 2.6));
const sun = new THREE.DirectionalLight(0xfff4dc, 4.5);
sun.position.set(7, 10, 6);
sun.castShadow = true;
scene.add(sun);

// Temporary scene marker. The detailed Level 1 environment, robot and mechanics
// are intentionally split into their own modules in the next implementation pass.
const island = new THREE.Mesh(
  new THREE.BoxGeometry(8.8, 0.75, 6.4),
  new THREE.MeshStandardMaterial({ color: 0x687565, roughness: 0.9 }),
);
island.position.y = -0.55;
island.receiveShadow = true;
scene.add(island);

const grid = new THREE.GridHelper(8, 8, 0x67e7ff, 0x294759);
grid.position.y = -0.16;
scene.add(grid);

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
