import * as THREE from 'three';
import './styles.css';
import { level01 } from './levels/level-01.js';
import { createRobot, animateRobot } from './entities/Robot.js';
import { createFloatingIsland, addCloudscape } from './environment/FloatingIsland.js';
import { createEnergyCore, createGenerator, createDoor, createEnergyCable } from './entities/PuzzleObjects.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="game-shell">
  <header class="hud"><section class="panel brand"><strong>ВІДЛІК</strong><span>BALANCE · математика оживлює світ</span></section><section class="panel level-status"><strong>РІВЕНЬ ${level01.id}</strong><span id="status">${level01.title}</span></section></header>
  <div id="scene" class="scene"></div>
  <section class="panel mission"><small>ПОТОЧНЕ ЗАВДАННЯ</small><h1 id="mission-title">Заряди генератор до ${level01.generator.targetValue}</h1><p id="mission-text">Натисни на світне ядро <b>+${level01.cores[0].value}</b>.</p></section>
  <button id="restart" class="restart">↻ Заново</button>
  <div id="complete" class="panel complete"><strong>РІВЕНЬ ЗАВЕРШЕНО</strong><span>${level01.completion.equation}</span></div>
</main>`;

const host = document.querySelector('#scene');
const status = document.querySelector('#status');
const title = document.querySelector('#mission-title');
const text = document.querySelector('#mission-text');
const complete = document.querySelector('#complete');
document.querySelector('#restart').addEventListener('click', () => location.reload());

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b2237); scene.fog = new THREE.FogExp2(0x91cde8, .025);
const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, .1, 100); camera.position.set(8, 7, 9.8); camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18; renderer.shadowMap.enabled = true; host.append(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x27313d, 2.6));
const sun = new THREE.DirectionalLight(0xfff4dc, 4.6); sun.position.set(7, 10, 6); sun.castShadow = true; scene.add(sun);
scene.add(new THREE.PointLight(0x4ee5ff, 16, 10, 2));

const materials = {
  rock: new THREE.MeshPhysicalMaterial({ color: 0x6f6d68, roughness: .82 }), rockDark: new THREE.MeshPhysicalMaterial({ color: 0x4e504e, roughness: .9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x5b7d50, roughness: .95 }), stone: new THREE.MeshPhysicalMaterial({ color: 0x8c8c84, roughness: .74 }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x101820, roughness: .2, metalness: .72, clearcoat: .8 }), white: new THREE.MeshPhysicalMaterial({ color: 0xf5f7fa, roughness: .19, clearcoat: 1 }),
  gold: new THREE.MeshPhysicalMaterial({ color: 0xffa31c, emissive: 0xff7200, emissiveIntensity: .28, metalness: .55, roughness: .22 }),
  cyan: new THREE.MeshPhysicalMaterial({ color: 0x7feeff, emissive: 0x25d3ff, emissiveIntensity: 3.5, transparent: true, opacity: .94 }),
  cyanLine: new THREE.MeshStandardMaterial({ color: 0x72ecff, emissive: 0x1fd5ff, emissiveIntensity: 3 }), visor: new THREE.MeshPhysicalMaterial({ color: 0x020812, roughness: .08, clearcoat: 1 }),
  face: new THREE.MeshStandardMaterial({ color: 0xb7f7ff, emissive: 0x42e1ff, emissiveIntensity: 5.2 }), door: new THREE.MeshPhysicalMaterial({ color: 0x29323a, roughness: .42, metalness: .75 }),
};

scene.add(createFloatingIsland(materials)); addCloudscape(scene);
const robot = createRobot(materials); robot.position.set(-2.75, .9, .3); scene.add(robot);
const core = createEnergyCore(materials, 2); core.position.set(...level01.cores[0].position); scene.add(core);
const generator = createGenerator(materials); generator.position.set(1.3, .15, .5); scene.add(generator);
const door = createDoor(materials); door.position.set(3.45, 0, -1.2); scene.add(door);
const cable = createEnergyCable(materials); scene.add(cable);
const exit = new THREE.Mesh(new THREE.TorusGeometry(.44, .07, 16, 40), materials.cyanLine); exit.position.set(3.45, .75, -2); exit.rotation.x = Math.PI / 2; exit.visible = false; scene.add(exit);

const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let phase = 'core'; let moving = false; let powered = false;
function flyTo(end, duration, done) { if (moving) return; moving = true; const start = robot.position.clone(); const t0 = performance.now(); const tick = now => { const u = Math.min(1, (now - t0) / duration); const e = 1 - Math.pow(1 - u, 3); robot.position.lerpVectors(start, end, e); robot.position.y += Math.sin(u * Math.PI) * .2; if (u < 1) requestAnimationFrame(tick); else { robot.position.copy(end); moving = false; done?.(); } }; requestAnimationFrame(tick); }
function pickCore() { flyTo(new THREE.Vector3(-1.45, .9, 1.45), 650, () => { scene.remove(core); robot.add(core); core.position.set(0, -.1, 1.32); core.scale.setScalar(.72); phase = 'generator'; status.textContent = 'Ядро знайдено'; title.textContent = 'Встав ядро в генератор'; text.innerHTML = 'Натисни на генератор <b>3 / 5</b>.'; }); }
function power() { flyTo(new THREE.Vector3(.35, .9, .5), 720, () => { robot.remove(core); scene.add(core); core.position.set(1.3, 1.22, .5); setTimeout(() => { core.visible = false; powered = true; cable.userData.glow.visible = true; status.textContent = 'Генератор активний'; title.textContent = '3 + 2 = 5'; text.textContent = 'Енергія подається до дверей.'; const y0 = door.userData.panel.position.y; const t0 = performance.now(); const open = now => { const u = Math.min(1, (now - t0) / 900); door.userData.panel.position.y = y0 + 2.55 * (1 - Math.pow(1 - u, 3)); if (u < 1) requestAnimationFrame(open); else { phase = 'exit'; exit.visible = true; title.textContent = 'Пройди через двері'; text.textContent = 'Натисни на світне кільце за проходом.'; } }; requestAnimationFrame(open); }, 500); }); }
function finish() { flyTo(new THREE.Vector3(3.45, .9, -2), 850, () => { phase = 'done'; status.textContent = 'Завершено'; title.textContent = 'Рівень завершено'; text.innerHTML = `<b>${level01.completion.equation}</b> · ${level01.completion.message}`; complete.classList.add('show'); }); }

renderer.domElement.addEventListener('pointerdown', e => { if (moving || phase === 'done') return; const r = renderer.domElement.getBoundingClientRect(); pointer.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects([core, generator, exit], true); if (!hits.length) return; const hit = hits[0].object; if (phase === 'core' && (hit === core || hit.parent === core)) pickCore(); else if (phase === 'generator' && (hit === generator || hit.parent === generator)) power(); else if (phase === 'exit' && (hit === exit || hit.parent === exit)) finish(); });

const clock = new THREE.Clock();
function render() { requestAnimationFrame(render); const t = clock.getElapsedTime(); animateRobot(robot, t, moving); if (core.visible) { core.userData.wire.rotation.x += .006; core.userData.wire.rotation.y += .015; } generator.userData.halo.rotation.z += .008; if (powered) generator.userData.slot.material.emissiveIntensity = 4.5 + Math.sin(t * 6) * .8; exit.rotation.z += .01; renderer.render(scene, camera); }
render();
window.addEventListener('resize', () => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); });
