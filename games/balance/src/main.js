import * as THREE from 'three';
import './styles.css';
import { level01 } from './levels/level-01.js';
import {
  createRobot,
  animateRobot,
  setRobotCarry,
  setRobotExpression,
} from './entities/Robot.js';
import {
  createFloatingIsland,
  addCloudscape,
} from './environment/FloatingIsland.js';
import {
  createEnergyCore,
  createCorePedestal,
  createGenerator,
  createDoor,
  createEnergyCable,
} from './entities/PuzzleObjects.js';

const app = document.querySelector('#app');

app.innerHTML = `
<main class="game-shell">
  <header class="hud">
    <section class="panel brand">
      <strong>ВІДЛІК</strong>
      <span>BALANCE · математика оживлює світ</span>
    </section>

    <section class="panel level-status">
      <strong>РІВЕНЬ ${level01.id}</strong>
      <span id="status">${level01.title}</span>
    </section>
  </header>

  <div id="scene" class="scene"></div>

  <section class="panel mission">
    <small>ПОТОЧНЕ ЗАВДАННЯ</small>
    <h1 id="mission-title">Заряди генератор до ${level01.generator.targetValue}</h1>
    <p id="mission-text">Знайди світне ядро <b>+${level01.cores[0].value}</b>.</p>
  </section>

  <button id="restart" class="restart" type="button">↻ Заново</button>

  <div id="complete" class="panel complete">
    <span class="complete__eyebrow">BALANCE</span>
    <strong>РІВЕНЬ ЗАВЕРШЕНО</strong>
    <span>${level01.completion.equation}</span>
  </div>

  <div id="core-tag" class="world-tag world-tag--cyan world-tag--active">
    <strong>+2</strong>
    <span>Енергетичне ядро</span>
  </div>

  <div id="generator-tag" class="world-tag">
    <strong id="generator-value">3 / 5</strong>
    <span id="generator-caption">Генератор</span>
  </div>

  <div id="door-tag" class="world-tag">
    <strong id="door-value">ЗАЧИНЕНО</strong>
    <span id="door-caption">Потрібен заряд 5</span>
  </div>
</main>
`;

const host = document.querySelector('#scene');
const status = document.querySelector('#status');
const title = document.querySelector('#mission-title');
const text = document.querySelector('#mission-text');
const complete = document.querySelector('#complete');
const coreTag = document.querySelector('#core-tag');
const generatorTag = document.querySelector('#generator-tag');
const generatorValue = document.querySelector('#generator-value');
const generatorCaption = document.querySelector('#generator-caption');
const doorTag = document.querySelector('#door-tag');
const doorValue = document.querySelector('#door-value');
const doorCaption = document.querySelector('#door-caption');

document.querySelector('#restart').addEventListener('click', () => location.reload());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b2237);
scene.fog = new THREE.FogExp2(0x8ec8df, .023);

const camera = new THREE.PerspectiveCamera(
  38,
  host.clientWidth / host.clientHeight,
  .1,
  100,
);
camera.position.set(8, 7, 9.8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.20;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.append(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x27313d, 2.65));

const sun = new THREE.DirectionalLight(0xfff1d5, 4.8);
sun.position.set(7, 10, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
scene.add(sun);

const ambientCyan = new THREE.PointLight(0x4ee5ff, 8, 10, 2);
ambientCyan.position.set(-1.2, 1.8, 2.0);
scene.add(ambientCyan);

const warmFill = new THREE.PointLight(0xffb34d, 5, 8, 2);
warmFill.position.set(3.6, 3.0, 2.5);
scene.add(warmFill);

const materials = {
  rock: new THREE.MeshPhysicalMaterial({
    color: 0x6f6d68,
    roughness: .82,
  }),
  rockDark: new THREE.MeshPhysicalMaterial({
    color: 0x4e504e,
    roughness: .9,
  }),
  grass: new THREE.MeshStandardMaterial({
    color: 0x5b7d50,
    roughness: .95,
  }),
  stone: new THREE.MeshPhysicalMaterial({
    color: 0x8c8c84,
    roughness: .74,
  }),
  dark: new THREE.MeshPhysicalMaterial({
    color: 0x101820,
    roughness: .2,
    metalness: .72,
    clearcoat: .8,
  }),
  white: new THREE.MeshPhysicalMaterial({
    color: 0xf5f7fa,
    roughness: .19,
    clearcoat: 1,
  }),
  gold: new THREE.MeshPhysicalMaterial({
    color: 0xffa31c,
    emissive: 0xff7200,
    emissiveIntensity: .28,
    metalness: .55,
    roughness: .22,
  }),
  cyan: new THREE.MeshPhysicalMaterial({
    color: 0x7feeff,
    emissive: 0x25d3ff,
    emissiveIntensity: 3.5,
    transparent: true,
    opacity: .94,
  }),
  cyanLine: new THREE.MeshStandardMaterial({
    color: 0x72ecff,
    emissive: 0x1fd5ff,
    emissiveIntensity: 3,
  }),
  visor: new THREE.MeshPhysicalMaterial({
    color: 0x020812,
    roughness: .08,
    clearcoat: 1,
  }),
  face: new THREE.MeshStandardMaterial({
    color: 0xb7f7ff,
    emissive: 0x42e1ff,
    emissiveIntensity: 5.2,
  }),
  door: new THREE.MeshPhysicalMaterial({
    color: 0x29323a,
    roughness: .42,
    metalness: .75,
  }),
};

scene.add(createFloatingIsland(materials));
addCloudscape(scene, materials);

const robot = createRobot(materials);
robot.position.set(-2.75, .90, .30);
scene.add(robot);

const core = createEnergyCore(materials, level01.cores[0].value);
core.position.set(...level01.cores[0].position);
scene.add(core);

const pedestal = createCorePedestal(materials);
pedestal.position.set(core.position.x, .04, core.position.z);
scene.add(pedestal);

const generator = createGenerator(materials);
generator.position.set(1.30, .15, .50);
scene.add(generator);

const door = createDoor(materials);
door.position.set(3.45, 0, -1.20);
scene.add(door);

const cable = createEnergyCable(materials);
scene.add(cable);

const exit = new THREE.Group();
const exitRing = new THREE.Mesh(
  new THREE.TorusGeometry(.44, .07, 16, 40),
  materials.cyanLine.clone(),
);
exitRing.rotation.x = Math.PI / 2;
const exitInner = new THREE.Mesh(
  new THREE.CircleGeometry(.31, 32),
  new THREE.MeshBasicMaterial({
    color: 0x62e8ff,
    transparent: true,
    opacity: .16,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
exitInner.rotation.x = -Math.PI / 2;
exitInner.position.y = -.01;
const exitLight = new THREE.PointLight(0x54e5ff, 6, 3.4, 2);
exitLight.position.y = .25;
exit.add(exitRing, exitInner, exitLight);
exit.position.set(3.45, .10, -2.15);
exit.visible = false;
scene.add(exit);

const path = {
  corePickup: new THREE.Vector3(-1.55, .90, 1.62),
  generatorApproach: new THREE.Vector3(.02, .90, 1.48),
  doorLane: new THREE.Vector3(2.55, .90, 1.62),
  doorApproach: new THREE.Vector3(3.45, .90, -.10),
  doorPass: new THREE.Vector3(3.45, .90, -1.62),
  exit: new THREE.Vector3(3.45, .90, -2.15),
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const interactables = [core, generator, exit];

let phase = 'core';
let moving = false;
let powered = false;
let energyLoopStart = 0;

function belongsTo(object, root) {
  let current = object;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function getLookQuaternion(from, to) {
  const direction = new THREE.Vector3().subVectors(to, from);
  direction.y = 0;

  if (direction.lengthSq() < .0001) {
    return robot.quaternion.clone();
  }

  const yaw = Math.atan2(direction.x, direction.z);
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, yaw, 0),
  );
}

function flyTo(end, duration = 700, done) {
  if (moving) return;

  moving = true;

  const start = robot.position.clone();
  const startQuaternion = robot.quaternion.clone();
  const endQuaternion = getLookQuaternion(start, end);
  const startedAt = performance.now();

  const tick = (now) => {
    const u = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - u, 3);

    robot.position.lerpVectors(start, end, eased);
    robot.position.y += Math.sin(u * Math.PI) * .16;
    robot.quaternion.slerpQuaternions(
      startQuaternion,
      endQuaternion,
      Math.min(1, eased * 1.35),
    );

    if (u < 1) {
      requestAnimationFrame(tick);
      return;
    }

    robot.position.copy(end);
    robot.quaternion.copy(endQuaternion);
    moving = false;
    done?.();
  };

  requestAnimationFrame(tick);
}

function flyRoute(points, durations, done) {
  const run = (index) => {
    if (index >= points.length) {
      done?.();
      return;
    }

    flyTo(
      points[index],
      Array.isArray(durations) ? durations[index] : durations,
      () => run(index + 1),
    );
  };

  run(0);
}

function pickCore() {
  if (phase !== 'core' || moving) return;

  title.textContent = 'Забираємо ядро';
  text.textContent = 'Робот підлітає до енергетичного ядра.';

  flyTo(path.corePickup, 680, () => {
    core.removeFromParent();
    robot.userData.visual.add(core);
    core.position.set(0, -.12, 1.34);
    core.scale.setScalar(.72);

    setRobotCarry(robot, true);

    pedestal.userData.ring.material.emissiveIntensity = .45;
    pedestal.userData.light.intensity = .35;

    phase = 'generator';
    status.textContent = 'Ядро знайдено';
    title.textContent = 'Встав ядро в генератор';
    text.innerHTML = 'Натисни на генератор <b>3 / 5</b>.';

    coreTag.classList.remove('world-tag--active');
    coreTag.classList.add('world-tag--hidden');
    generatorTag.classList.add('world-tag--active');
  });
}

function animateCoreIntoGenerator(done) {
  const start = new THREE.Vector3();
  core.getWorldPosition(start);

  robot.userData.visual.remove(core);
  scene.add(core);
  core.position.copy(start);
  core.scale.setScalar(.55);

  setRobotCarry(robot, false);

  const end = new THREE.Vector3(1.30, 1.37, .50);
  const startedAt = performance.now();

  const tick = (now) => {
    const u = Math.min(1, (now - startedAt) / 650);
    const eased = 1 - Math.pow(1 - u, 3);

    core.position.lerpVectors(start, end, eased);
    core.rotation.y += .09;
    core.scale.setScalar(.55 * (1 - u * .32));

    if (u < 1) {
      requestAnimationFrame(tick);
      return;
    }

    core.visible = false;
    done?.();
  };

  requestAnimationFrame(tick);
}

function energizeDoor(done) {
  cable.userData.glow.visible = true;
  cable.userData.pulse.visible = true;
  cable.userData.pulseLight.visible = true;

  const startedAt = performance.now();

  const tick = (now) => {
    const u = Math.min(1, (now - startedAt) / 1250);
    const point = cable.userData.curve.getPoint(u);

    cable.userData.pulse.position.copy(point);
    cable.userData.pulseLight.position.copy(point);

    if (u < 1) {
      requestAnimationFrame(tick);
      return;
    }

    cable.userData.pulse.visible = false;
    cable.userData.pulseLight.visible = false;
    energyLoopStart = performance.now();
    done?.();
  };

  requestAnimationFrame(tick);
}

function openDoor() {
  const panel = door.userData.panel;
  const startY = panel.position.y;
  const startedAt = performance.now();

  doorValue.textContent = 'АКТИВАЦІЯ';
  doorCaption.textContent = 'Енергія отримана';
  doorTag.classList.add('world-tag--cyan');

  const tick = (now) => {
    const u = Math.min(1, (now - startedAt) / 1050);
    const eased = 1 - Math.pow(1 - u, 3);

    panel.position.y = startY + 2.58 * eased;
    door.userData.portal.material.opacity = .52 * eased;
    door.userData.portalLight.intensity = 6 * eased;
    door.userData.trimL.material.emissiveIntensity = .22 + 1.4 * eased;
    door.userData.trimR.material.emissiveIntensity = .22 + 1.4 * eased;

    if (u < 1) {
      requestAnimationFrame(tick);
      return;
    }

    phase = 'exit';
    exit.visible = true;

    doorValue.textContent = 'ВІДКРИТО';
    doorCaption.textContent = 'Прохід активний';
    title.textContent = 'Пройди через двері';
    text.textContent = 'Натисни на світне кільце за проходом.';
    doorTag.classList.remove('world-tag--active');
  };

  requestAnimationFrame(tick);
}

function powerGenerator() {
  if (phase !== 'generator' || moving) return;

  title.textContent = 'Підключаємо ядро';
  text.textContent = 'Робот займає безпечну позицію біля генератора.';

  flyTo(path.generatorApproach, 780, () => {
    animateCoreIntoGenerator(() => {
      powered = true;

      generatorValue.textContent = '5 / 5';
      generatorCaption.textContent = 'Заряджено';
      generatorTag.classList.remove('world-tag--active');
      generatorTag.classList.add('world-tag--cyan');

      generator.userData.light.intensity = 6.5;
      generator.userData.slot.material.emissiveIntensity = 5.2;

      status.textContent = 'Генератор активний';
      title.textContent = '3 + 2 = 5';
      text.textContent = 'Енергія рухається до дверей.';

      doorTag.classList.add('world-tag--active');

      energizeDoor(openDoor);
    });
  });
}

function finishLevel() {
  if (phase !== 'exit' || moving) return;

  phase = 'finishing';
  title.textContent = 'До виходу';
  text.textContent = 'Робот проходить через відкритий портал.';

  flyRoute(
    [
      path.doorLane,
      path.doorApproach,
      path.doorPass,
      path.exit,
    ],
    [600, 650, 480, 380],
    () => {
      phase = 'done';
      status.textContent = 'Завершено';
      title.textContent = 'Рівень завершено';
      text.innerHTML = `<b>${level01.completion.equation}</b> · ${level01.completion.message}`;

      setRobotExpression(robot, 'happy');
      complete.classList.add('show');
    },
  );
}

function getInteractiveHit(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactables, true);

  return hits[0]?.object ?? null;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  if (moving || phase === 'done' || phase === 'finishing') {
    renderer.domElement.style.cursor = 'default';
    return;
  }

  const hit = getInteractiveHit(event);
  const actionable =
    (phase === 'core' && hit && belongsTo(hit, core)) ||
    (phase === 'generator' && hit && belongsTo(hit, generator)) ||
    (phase === 'exit' && hit && belongsTo(hit, exit));

  renderer.domElement.style.cursor = actionable ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (moving || phase === 'done' || phase === 'finishing') return;

  const hit = getInteractiveHit(event);
  if (!hit) return;

  if (phase === 'core' && belongsTo(hit, core)) {
    pickCore();
    return;
  }

  if (phase === 'generator' && belongsTo(hit, generator)) {
    powerGenerator();
    return;
  }

  if (phase === 'exit' && belongsTo(hit, exit)) {
    finishLevel();
  }
});

function worldToScreen(object, element, yOffset = 0) {
  if (!object.visible || element.classList.contains('world-tag--hidden')) {
    element.style.opacity = '0';
    return;
  }

  const position = new THREE.Vector3();
  object.getWorldPosition(position);
  position.y += yOffset;
  position.project(camera);

  element.style.left = `${(position.x * .5 + .5) * innerWidth}px`;
  element.style.top = `${(-position.y * .5 + .5) * innerHeight}px`;
  element.style.opacity = position.z > 1 ? '0' : '1';
}

const clock = new THREE.Clock();

function render() {
  requestAnimationFrame(render);

  const time = clock.getElapsedTime();

  animateRobot(robot, time, moving);

  if (core.visible) {
    core.userData.wire.rotation.x += .006;
    core.userData.wire.rotation.y += .015;
    core.userData.ball.material.emissiveIntensity = 3.8 + Math.sin(time * 5) * .6;
  }

  pedestal.userData.ring.rotation.z += .004;

  generator.userData.halo.rotation.z += powered ? .026 : .008;
  generator.userData.innerHalo.rotation.z -= powered ? .018 : .005;

  if (powered) {
    generator.userData.slot.material.emissiveIntensity = 5.0 + Math.sin(time * 7) * .85;
    generator.userData.light.intensity = 6.0 + Math.sin(time * 6) * 1.0;
    cable.userData.glow.material.emissiveIntensity = 2.7 + Math.sin(time * 8) * .55;

    if (energyLoopStart && !cable.userData.pulse.visible) {
      const loop = ((performance.now() - energyLoopStart) % 2200) / 2200;
      const point = cable.userData.curve.getPoint(loop);
      cable.userData.pulse.position.copy(point);
      cable.userData.pulseLight.position.copy(point);
      cable.userData.pulse.visible = true;
      cable.userData.pulseLight.visible = true;
      cable.userData.pulse.material.opacity = .50 + Math.sin(time * 10) * .20;
    }
  }

  if (exit.visible) {
    exitRing.rotation.z += .018;
    exitInner.material.opacity = .14 + Math.sin(time * 5) * .07;
    exit.position.y = .10 + Math.sin(time * 2.6) * .03;
  }

  worldToScreen(core, coreTag, .88);
  worldToScreen(generator, generatorTag, 1.95);
  worldToScreen(door, doorTag, 3.10);

  renderer.render(scene, camera);
}

render();

window.addEventListener('resize', () => {
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight);
});
