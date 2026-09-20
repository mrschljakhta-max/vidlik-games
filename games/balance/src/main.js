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
import { createCloudField } from './environment/CloudField.js';
import {
  createEnvironmentMaterials,
} from './environment/TextureFactory.js';
import {
  addExternalEnvironmentAssets,
} from './environment/ExternalAssets.js';
import {
  addExternalNatureAssets,
} from './environment/ExternalNatureAssets.js';
import {
  createEnergyCore,
  createCorePedestal,
  createGenerator,
  createDoor,
  createEnergyCable,
} from './entities/PuzzleObjects.js';

const app = document.querySelector('#app');

const coreTagsMarkup = level01.cores.map((core) => {
  const polarityClass = core.value < 0 ? 'world-tag--negative' : 'world-tag--cyan';
  const description = core.value < 0
    ? 'Ядро відтоку · забирає енергію'
    : 'Енергетичне ядро · додає енергію';

  return `
    <div id="tag-${core.id}" class="world-tag world-tag--core ${polarityClass} world-tag--active">
      <strong>${core.label}</strong>
      <span>${description}</span>
    </div>
  `;
}).join('');

const energySegmentsMarkup = Array.from(
  { length: level01.generator.targetValue },
  () => '<i></i>',
).join('');

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

  <div class="panel controls-help">
    <span><kbd>WASD</kbd> / <kbd>←↑↓→</kbd> рух</span>
    <span><kbd>SHIFT</kbd> прискорення</span>
    <span><kbd>SPACE</kbd> стрибок</span>
    <span><kbd>ENTER</kbd> взаємодія</span>
  </div>

  <div id="scene" class="scene"></div>

  <section class="panel mission">
    <small>ПОТОЧНЕ ЗАВДАННЯ</small>
    <h1 id="mission-title">Збалансуй генератор до ${level01.generator.targetValue}</h1>
    <p id="mission-text">Додавай і віднімай енергію ядрами. Двері відкриються лише при точному балансі.</p>
    <div id="equation-trail" class="equation-trail">
      <span>${level01.generator.startValue}</span>
      <i>→</i>
      <strong>${level01.generator.targetValue}</strong>
    </div>
  </section>

  <button id="restart" class="restart" type="button">↻ Заново</button>

  <div id="interaction-prompt" class="panel interaction-prompt">
    <kbd>ENTER</kbd>
    <span id="interaction-label">Взаємодія</span>
  </div>

  <div id="complete" class="panel complete">
    <span class="complete__eyebrow">BALANCE</span>
    <strong>РІВЕНЬ ЗАВЕРШЕНО</strong>
    <span>${level01.completion.equation}</span>
  </div>

  ${coreTagsMarkup}

  <div id="generator-tag" class="world-tag world-tag--generator world-tag--active">
    <strong id="generator-value">${level01.generator.startValue} / ${level01.generator.targetValue}</strong>
    <div id="generator-segments" class="energy-segments">${energySegmentsMarkup}</div>
    <span id="generator-caption">Недостатньо енергії</span>
  </div>

  <div id="door-tag" class="world-tag world-tag--door">
    <div class="door-indicator">
      <b class="door-lock" aria-hidden="true"></b>
      <strong id="door-value">${level01.generator.targetValue}</strong>
    </div>
    <div id="door-segments" class="energy-segments energy-segments--door">${energySegmentsMarkup}</div>
    <span id="door-caption">Потрібен точний баланс</span>
  </div>

  <div id="orientation-lock" class="orientation-lock" aria-live="polite">
    <div class="orientation-lock__card">
      <div class="orientation-lock__phone" aria-hidden="true">
        <span></span>
      </div>
      <strong>Поверніть пристрій</strong>
      <p>BALANCE працює тільки в альбомній орієнтації.</p>
      <small>Поверніть телефон горизонтально, щоб продовжити.</small>
    </div>
  </div>
</main>
`;

const host = document.querySelector('#scene');
const status = document.querySelector('#status');
const title = document.querySelector('#mission-title');
const text = document.querySelector('#mission-text');
const equationTrail = document.querySelector('#equation-trail');
const complete = document.querySelector('#complete');
const interactionPrompt = document.querySelector('#interaction-prompt');
const interactionLabel = document.querySelector('#interaction-label');
const generatorTag = document.querySelector('#generator-tag');
const generatorValue = document.querySelector('#generator-value');
const generatorCaption = document.querySelector('#generator-caption');
const generatorSegments = [...document.querySelectorAll('#generator-segments i')];
const doorTag = document.querySelector('#door-tag');
const doorValue = document.querySelector('#door-value');
const doorCaption = document.querySelector('#door-caption');
const doorSegments = [...document.querySelectorAll('#door-segments i')];
const orientationLock = document.querySelector('#orientation-lock');

let orientationBlocked = false;

function updateOrientationGate() {
  const shouldBlock =
    window.innerWidth <= 900 &&
    window.innerHeight > window.innerWidth;

  orientationBlocked = shouldBlock;
  document.body.classList.toggle('orientation-blocked', shouldBlock);
  orientationLock.setAttribute('aria-hidden', shouldBlock ? 'false' : 'true');

  if (shouldBlock) {
    keys?.clear?.();
  }

  return shouldBlock;
}

document.querySelector('#restart').addEventListener('click', () => location.reload());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c5ef);
scene.fog = new THREE.FogExp2(0xd5ebfb, .014);

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
renderer.toneMappingExposure = 1.34;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.append(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf4fbff, 0x516273, 3.4));

const sun = new THREE.DirectionalLight(0xffe6b5, 6.4);
sun.position.set(8.5, 11.5, 5.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
scene.add(sun);

const skyFill = new THREE.PointLight(0x88dfff, 6.2, 12, 2);
skyFill.position.set(-3.0, 4.0, 2.8);
scene.add(skyFill);

const warmFill = new THREE.PointLight(0xffc06b, 6.6, 10, 2);
warmFill.position.set(4.1, 3.1, 2.8);
scene.add(warmFill);

const rimLight = new THREE.PointLight(0xffe0a2, 3.4, 9, 2);
rimLight.position.set(-4.2, 2.4, -2.8);
scene.add(rimLight);

const portalAccent = new THREE.PointLight(0x5fe7ff, 2.4, 7, 2);
portalAccent.position.set(3.4, 1.4, -1.3);
scene.add(portalAccent);

const materials = {
  rock: new THREE.MeshPhysicalMaterial({
    color: 0x6f6d68,
    roughness: .82,
    metalness: .01,
  }),
  rockDark: new THREE.MeshPhysicalMaterial({
    color: 0x4e504e,
    roughness: .9,
    metalness: .01,
  }),
  grass: new THREE.MeshStandardMaterial({
    color: 0x5b7d50,
    roughness: .95,
    metalness: 0,
  }),
  stone: new THREE.MeshPhysicalMaterial({
    color: 0x8c8c84,
    roughness: .74,
    metalness: .01,
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
    color: 0x60432f,
    roughness: .78,
    metalness: .04,
  }),
};

const detailedMaterials = createEnvironmentMaterials(materials);
Object.assign(materials, detailedMaterials);

scene.add(createFloatingIsland(materials));
addCloudscape(scene, materials);

const cloudField = createCloudField();
scene.add(cloudField);

const CORE_PLAY_SCALE = .72;

const robot = createRobot(materials);
robot.position.set(-2.75, .90, .30);
robot.scale.setScalar(.68);
scene.add(robot);

const coreEntries = level01.cores.map((config) => {
  const object = createEnergyCore(materials, config.value);
  object.position.set(...config.position);
  object.scale.setScalar(CORE_PLAY_SCALE);
  scene.add(object);

  const pedestal = createCorePedestal(materials, config.value);
  pedestal.position.set(config.position[0], .04, config.position[2]);
  scene.add(pedestal);

  const tag = document.querySelector(`#tag-${config.id}`);

  return {
    config,
    object,
    pedestal,
    tag,
    state: 'world',
  };
});

const generator = createGenerator(materials);
generator.position.set(1.30, .15, .50);
scene.add(generator);

const door = createDoor(materials);
door.position.set(3.45, 0, -1.20);
scene.add(door);

addExternalEnvironmentAssets(scene, materials, {
  doorPosition: door.position.clone(),
  doorObject: door,
}).catch((error) => {
  console.warn('VIDLIK: external environment pass failed', error);
});

addExternalNatureAssets(scene, materials).catch((error) => {
  console.warn('VIDLIK: external nature pass failed', error);
});

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
  generatorApproach: new THREE.Vector3(-.15, .90, 1.78),
  doorLane: new THREE.Vector3(2.65, .90, 2.25),
  doorApproach: new THREE.Vector3(3.45, .90, -.10),
  doorPass: new THREE.Vector3(3.45, .90, -1.62),
  exit: new THREE.Vector3(3.45, .90, -2.15),
};

const installedOffsets = [
  new THREE.Vector3(-.38, 1.38, .18),
  new THREE.Vector3(.38, 1.38, .18),
];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let phase = 'puzzle';
let moving = false;
let powered = false;
let doorOpen = false;
let puzzleSolved = false;
let energyLoopStart = 0;
let carryingEntry = null;
let currentValue = level01.generator.startValue;
let installedOrder = [];
let flightToken = 0;

const keys = new Set();
const manualVelocity = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const desiredMove = new THREE.Vector3();

const manual = {
  baseY: .90,
  walkSpeed: 2.75,
  runSpeed: 5.05,
  jumpSpeed: 4.7,
  gravity: 10.5,
  verticalVelocity: 0,
  grounded: true,
  moving: false,
  boosting: false,
  speedRatio: 0,
};

const islandBounds = {
  minX: -3.55,
  maxX: 3.60,
  minZ: -2.35,
  maxZ: 2.52,
};

const interactionRadius = {
  generator: 2.35,
  generatorExtended: 3.10,
  core: 1.15,
  exit: 1.05,
};

function belongsTo(object, root) {
  let current = object;

  while (current) {
    if (current === root) return true;
    current = current.parent;
  }

  return false;
}

function distanceXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function isNearGenerator(radius = interactionRadius.generator) {
  return distanceXZ(robot.position, generator.position) <= radius;
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

function canManualControl() {
  return !orientationBlocked && !moving && phase !== 'done';
}

function cancelAutopilot() {
  if (!moving) return;

  flightToken += 1;
  moving = false;
  manualVelocity.set(0, 0, 0);

  if (phase === 'exit') {
    title.textContent = 'Пройди через двері';
    text.textContent = 'Ручне керування відновлено. Проведи робота до світного виходу.';
  }
}

function isBlockedPosition(position) {
  if (
    position.x < islandBounds.minX ||
    position.x > islandBounds.maxX ||
    position.z < islandBounds.minZ ||
    position.z > islandBounds.maxZ
  ) {
    return true;
  }

  if (distanceXZ(position, generator.position) < 1.55) {
    return true;
  }

  for (const entry of coreEntries) {
    if (
      entry.state === 'world' &&
      distanceXZ(position, entry.pedestal.position) < .92
    ) {
      return true;
    }
  }

  const doorZ = door.position.z;
  const nearDoorPlane = Math.abs(position.z - doorZ) < .64;

  if (nearDoorPlane) {
    const leftPostX = door.position.x - 1.20;
    const rightPostX = door.position.x + 1.20;

    if (Math.abs(position.x - leftPostX) < .56) return true;
    if (Math.abs(position.x - rightPostX) < .56) return true;

    if (!doorOpen && Math.abs(position.x - door.position.x) < 1.12) {
      return true;
    }
  }

  return false;
}

function updateManualMovement(delta) {
  if (!canManualControl()) {
    manual.moving = false;
    manual.boosting = false;
    manual.speedRatio = 0;
    return;
  }

  const forwardInput =
    (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
    (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);

  const sideInput =
    (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
    (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);

  const hasMovementInput = forwardInput !== 0 || sideInput !== 0;
  const boostHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const wantsBoost = boostHeld && hasMovementInput;
  const targetSpeed = wantsBoost
    ? manual.runSpeed
    : manual.walkSpeed;

  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  cameraForward.normalize();

  cameraRight.crossVectors(cameraForward, camera.up).normalize();

  desiredMove
    .set(0, 0, 0)
    .addScaledVector(cameraForward, forwardInput)
    .addScaledVector(cameraRight, sideInput);

  if (desiredMove.lengthSq() > 1) {
    desiredMove.normalize();
  }

  desiredMove.multiplyScalar(targetSpeed);

  const acceleration = wantsBoost ? 8.5 : 12;

  manualVelocity.x = THREE.MathUtils.damp(
    manualVelocity.x,
    desiredMove.x,
    acceleration,
    delta,
  );

  manualVelocity.z = THREE.MathUtils.damp(
    manualVelocity.z,
    desiredMove.z,
    acceleration,
    delta,
  );

  const moveX = robot.position.clone();
  moveX.x += manualVelocity.x * delta;

  if (!isBlockedPosition(moveX)) {
    robot.position.x = moveX.x;
  } else {
    manualVelocity.x = 0;
  }

  const moveZ = robot.position.clone();
  moveZ.z += manualVelocity.z * delta;

  if (!isBlockedPosition(moveZ)) {
    robot.position.z = moveZ.z;
  } else {
    manualVelocity.z = 0;
  }

  const horizontalSpeed = Math.hypot(
    manualVelocity.x,
    manualVelocity.z,
  );

  if (horizontalSpeed > .08) {
    const lookTarget = robot.position.clone().add(
      new THREE.Vector3(
        manualVelocity.x,
        0,
        manualVelocity.z,
      ),
    );

    const targetQuaternion = getLookQuaternion(
      robot.position,
      lookTarget,
    );

    const turnRate = wantsBoost ? 14 : 11;
    const turnAmount = 1 - Math.exp(-turnRate * delta);
    robot.quaternion.slerp(targetQuaternion, turnAmount);
  }

  if (!manual.grounded || manual.verticalVelocity > 0) {
    robot.position.y += manual.verticalVelocity * delta;
    manual.verticalVelocity -= manual.gravity * delta;

    if (robot.position.y <= manual.baseY) {
      robot.position.y = manual.baseY;
      manual.verticalVelocity = 0;
      manual.grounded = true;
    }
  } else {
    robot.position.y = manual.baseY;
  }

  manual.moving = horizontalSpeed > .08 || !manual.grounded;
  manual.boosting =
    wantsBoost &&
    horizontalSpeed > manual.walkSpeed * .78;

  manual.speedRatio = THREE.MathUtils.clamp(
    horizontalSpeed / manual.runSpeed,
    0,
    1,
  );

  if (
    phase === 'exit' &&
    distanceXZ(robot.position, path.exit) < .62
  ) {
    completeLevel();
  }
}

function flyTo(end, duration = 700, done) {
  if (moving) return;

  moving = true;
  const token = ++flightToken;

  const start = robot.position.clone();
  const startQuaternion = robot.quaternion.clone();
  const endQuaternion = getLookQuaternion(start, end);
  const startedAt = performance.now();

  const tick = (now) => {
    if (token !== flightToken) return;

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

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  return `−${Math.abs(value)}`;
}

function updateEquationTrail() {
  let running = level01.generator.startValue;
  const values = [running];

  for (const id of installedOrder) {
    const entry = coreEntries.find((item) => item.config.id === id);
    running += entry.config.value;
    values.push(running);
  }

  equationTrail.innerHTML = values
    .map((value, index) => {
      const className = index === values.length - 1 ? 'current' : '';
      return `<span class="${className}">${value}</span>`;
    })
    .join('<i>→</i>');

  if (!puzzleSolved && values[values.length - 1] !== level01.generator.targetValue) {
    equationTrail.insertAdjacentHTML(
      'beforeend',
      `<i>→</i><strong>${level01.generator.targetValue}</strong>`,
    );
  }
}

function setGeneratorColor(colorHex, intensity = 3) {
  generator.userData.slot.material.color.setHex(colorHex);
  generator.userData.slot.material.emissive.setHex(colorHex);
  generator.userData.slot.material.emissiveIntensity = intensity;

  generator.userData.halo.material.color.setHex(colorHex);
  generator.userData.halo.material.emissive.setHex(colorHex);
  generator.userData.halo.material.emissiveIntensity = intensity;

  generator.userData.innerHalo.material.color.setHex(colorHex);
  generator.userData.innerHalo.material.emissive.setHex(colorHex);
  generator.userData.innerHalo.material.emissiveIntensity = intensity;

  generator.userData.light.color.setHex(colorHex);

  if (generator.userData.energyColumn) {
    generator.userData.energyColumn.material.color.setHex(colorHex);
  }
}

function updateCoreTags() {
  for (const entry of coreEntries) {
    const caption = entry.tag.querySelector('span');

    entry.tag.classList.toggle(
      'world-tag--hidden',
      entry.state === 'carried',
    );

    if (entry.state === 'installed') {
      caption.textContent = 'Встановлено · натисни, щоб витягти';
      entry.tag.classList.add('world-tag--installed');
      entry.tag.classList.remove('world-tag--active');
    } else if (entry.state === 'world') {
      caption.textContent = entry.config.value < 0
        ? 'Ядро відтоку · забирає енергію'
        : 'Енергетичне ядро · додає енергію';

      entry.tag.classList.remove('world-tag--installed');
      entry.tag.classList.toggle(
        'world-tag--active',
        !carryingEntry && !puzzleSolved,
      );
    }
  }
}

function paintEnergySegments(segments, value, target) {
  const safeValue = Math.max(0, Math.min(target, value));

  segments.forEach((segment, index) => {
    segment.classList.toggle('is-filled', index < safeValue);
  });
}

function updateGeneratorState({ allowSolve = true } = {}) {
  generatorValue.textContent = `${currentValue} / ${level01.generator.targetValue}`;
  paintEnergySegments(
    generatorSegments,
    currentValue,
    level01.generator.targetValue,
  );
  paintEnergySegments(
    doorSegments,
    currentValue,
    level01.generator.targetValue,
  );
  updateEquationTrail();

  generatorTag.classList.remove(
    'world-tag--overload',
    'world-tag--balanced',
  );

  if (currentValue < level01.generator.targetValue) {
    const missing = level01.generator.targetValue - currentValue;

    setGeneratorColor(0x54dfff, 2.5);
    generatorCaption.textContent = `Недостатньо · бракує ${missing}`;
    status.textContent = 'Недостатньо енергії';

    if (!puzzleSolved) {
      title.textContent = `Заряд: ${currentValue} / ${level01.generator.targetValue}`;
      text.textContent = 'Додай енергію або зміни комбінацію ядер.';
    }

    return;
  }

  if (currentValue > level01.generator.targetValue) {
    const extra = currentValue - level01.generator.targetValue;

    setGeneratorColor(0xff8a2a, 5.3);
    generatorCaption.textContent = `ПЕРЕВАНТАЖЕННЯ · зайвих ${extra}`;
    generatorTag.classList.add('world-tag--overload');
    status.textContent = 'Перевантаження';

    title.textContent = `Перевантаження: ${currentValue} / ${level01.generator.targetValue}`;
    text.innerHTML = `Забери <b>${extra}</b> одиниці енергії. Спробуй ядро відтоку.`;

    return;
  }

  setGeneratorColor(0x69ffc8, 6.0);
  generatorCaption.textContent = 'БАЛАНС';
  generatorTag.classList.add('world-tag--balanced');
  status.textContent = 'Баланс досягнуто';

  title.textContent = `${level01.completion.equation}`;
  text.textContent = 'Точний заряд. Генератор активує прохід.';

  if (allowSolve && !puzzleSolved) {
    solvePuzzle();
  }
}

function placeInstalledCores() {
  installedOrder.forEach((id, index) => {
    const entry = coreEntries.find((item) => item.config.id === id);
    const offset = installedOffsets[index] ?? installedOffsets[installedOffsets.length - 1];

    entry.object.removeFromParent();
    scene.add(entry.object);
    entry.object.position.copy(generator.position).add(offset);
    entry.object.scale.setScalar(.42);
  });
}

function dimPedestal(entry, dimmed) {
  entry.pedestal.userData.ring.material.emissiveIntensity = dimmed ? .4 : 2.4;
  entry.pedestal.userData.light.intensity = dimmed ? .25 : 3.2;
}

function attachCoreToRobot(entry) {
  entry.object.removeFromParent();
  robot.userData.visual.add(entry.object);

  entry.object.position.set(0, -.12, 1.34);
  entry.object.scale.setScalar(CORE_PLAY_SCALE);
  entry.state = 'carried';
  carryingEntry = entry;

  setRobotCarry(robot, true);
  updateCoreTags();

  generatorTag.classList.add('world-tag--active');

  title.textContent = `Несемо ядро ${entry.config.label}`;
  text.innerHTML = `Підійди до генератора й натисни <b>ENTER</b> або клікни по ньому, щоб застосувати <b>${entry.config.label}</b>.`;
}

function extractInstalledCore(entry) {
  if (puzzleSolved || carryingEntry || moving || entry.state !== 'installed') return;

  const index = installedOrder.indexOf(entry.config.id);

  if (index >= 0) {
    installedOrder.splice(index, 1);
  }

  currentValue -= entry.config.value;
  placeInstalledCores();
  updateGeneratorState({ allowSolve: false });

  const collect = () => {
    attachCoreToRobot(entry);
    status.textContent = 'Ядро витягнуто';
  };

  if (distanceXZ(robot.position, path.generatorApproach) < 1.0) {
    collect();
    return;
  }

  flyTo(path.generatorApproach, 700, collect);
}

function pickWorldCore(entry) {
  if (
    puzzleSolved ||
    carryingEntry ||
    moving ||
    entry.state !== 'world'
  ) {
    return;
  }

  const approach = new THREE.Vector3(...entry.config.approach);

  const collect = () => {
    dimPedestal(entry, true);
    attachCoreToRobot(entry);
    status.textContent = `Ядро ${entry.config.label} взято`;
  };

  if (distanceXZ(robot.position, approach) < 1.0) {
    collect();
    return;
  }

  title.textContent = `До ядра ${entry.config.label}`;
  text.textContent = 'Робот підлітає до ядра.';
  flyTo(approach, 680, collect);
}

function animateCoreIntoGenerator(entry, done) {
  const start = new THREE.Vector3();
  entry.object.getWorldPosition(start);

  robot.userData.visual.remove(entry.object);
  scene.add(entry.object);

  entry.object.position.copy(start);
  entry.object.scale.setScalar(.55);

  setRobotCarry(robot, false);
  carryingEntry = null;

  const end = generator.position.clone().add(
    new THREE.Vector3(0, 1.38, .15),
  );
  const startedAt = performance.now();

  const tick = (now) => {
    const u = Math.min(1, (now - startedAt) / 650);
    const eased = 1 - Math.pow(1 - u, 3);

    entry.object.position.lerpVectors(start, end, eased);
    entry.object.rotation.y += .09;
    entry.object.scale.setScalar(.55 * (1 - u * .35));

    if (u < 1) {
      requestAnimationFrame(tick);
      return;
    }

    entry.state = 'installed';
    installedOrder.push(entry.config.id);
    currentValue += entry.config.value;

    placeInstalledCores();
    updateCoreTags();
    done?.();
  };

  requestAnimationFrame(tick);
}

function insertCarriedCore() {
  if (!carryingEntry || puzzleSolved || moving) return;

  const entry = carryingEntry;

  const install = () => {
    animateCoreIntoGenerator(entry, () => {
      generatorTag.classList.remove('world-tag--active');

      status.textContent = `${entry.config.label} застосовано`;
      updateGeneratorState();
    });
  };

  if (isNearGenerator(interactionRadius.generator)) {
    install();
    return;
  }

  title.textContent = `Застосовуємо ${entry.config.label}`;
  text.textContent = entry.config.value < 0
    ? 'Ядро відтоку зменшить заряд генератора.'
    : 'Енергетичне ядро збільшить заряд генератора.';

  flyTo(path.generatorApproach, 760, install);
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

  doorValue.textContent = '5 / 5';
  doorCaption.textContent = 'Баланс підтверджено';
  doorTag.classList.add('world-tag--cyan', 'world-tag--balanced');

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

    doorOpen = true;
    phase = 'exit';
    exit.visible = true;

    doorValue.textContent = 'ГОТОВО';
    doorCaption.textContent = 'Прохід активний';
    doorTag.classList.add('world-tag--door-open');
    title.textContent = 'Пройди через двері';
    text.textContent = 'Проведи робота вручну або натисни на світне кільце.';
  };

  requestAnimationFrame(tick);
}

function solvePuzzle() {
  puzzleSolved = true;
  phase = 'solving';
  powered = true;

  generatorTag.classList.remove('world-tag--active');
  doorTag.classList.add('world-tag--active');

  for (const entry of coreEntries) {
    entry.tag.classList.remove('world-tag--active');
  }

  energizeDoor(openDoor);
}

function completeLevel() {
  if (phase === 'done') return;

  phase = 'done';
  moving = false;

  manualVelocity.set(0, 0, 0);
  manual.verticalVelocity = 0;
  manual.grounded = true;
  robot.position.y = manual.baseY;

  status.textContent = 'Завершено';
  title.textContent = 'Рівень завершено';
  text.innerHTML = `<b>${level01.completion.equation}</b> · ${level01.completion.message}`;

  setRobotExpression(robot, 'happy');
  complete.classList.add('show');
}

function finishLevel() {
  if (phase !== 'exit' || moving) return;

  if (distanceXZ(robot.position, path.exit) < .82) {
    completeLevel();
    return;
  }

  title.textContent = 'До виходу';
  text.textContent = 'Автопілот активний. Натисни WASD або стрілку, щоб перехопити керування.';

  flyRoute(
    [
      path.doorLane,
      path.doorApproach,
      path.doorPass,
      path.exit,
    ],
    [600, 650, 480, 380],
    completeLevel,
  );
}

function getInteractiveHit(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  raycaster.setFromCamera(pointer, camera);

  const interactables = [
    ...coreEntries.map((entry) => entry.object),
    generator,
    exit,
  ];

  const hits = raycaster.intersectObjects(interactables, true);
  return hits[0]?.object ?? null;
}

function getCoreEntryFromHit(hit) {
  return coreEntries.find((entry) => belongsTo(hit, entry.object)) ?? null;
}

function getContextInteraction() {
  if (phase === 'done') return null;

  if (
    phase === 'exit' &&
    !moving &&
    distanceXZ(robot.position, path.exit) <= interactionRadius.exit
  ) {
    return {
      label: 'Завершити рівень',
      action: completeLevel,
    };
  }

  if (
    carryingEntry &&
    !puzzleSolved &&
    !moving &&
    isNearGenerator(interactionRadius.generatorExtended)
  ) {
    return {
      label: `Вставити ${carryingEntry.config.label} у генератор`,
      action: insertCarriedCore,
    };
  }

  if (moving) return null;

  if (!carryingEntry && !puzzleSolved) {
    const installedEntries = [...coreEntries]
      .filter((entry) => entry.state === 'installed')
      .reverse();

    if (
      installedEntries.length &&
      isNearGenerator(interactionRadius.generator)
    ) {
      const entry = installedEntries[0];

      return {
        label: `Витягти ${entry.config.label} з генератора`,
        action: () => extractInstalledCore(entry),
      };
    }

    let nearest = null;
    let nearestDistance = Infinity;

    for (const entry of coreEntries) {
      if (entry.state !== 'world') continue;

      const approach = new THREE.Vector3(...entry.config.approach);
      const distance = distanceXZ(robot.position, approach);

      if (distance < nearestDistance) {
        nearest = entry;
        nearestDistance = distance;
      }
    }

    if (nearest && nearestDistance <= interactionRadius.core) {
      return {
        label: `Взяти ядро ${nearest.config.label}`,
        action: () => pickWorldCore(nearest),
      };
    }
  }

  return null;
}

function performContextInteraction() {
  const interaction = getContextInteraction();
  interaction?.action();
}

function updateInteractionPrompt() {
  const interaction = getContextInteraction();

  if (!interaction) {
    interactionPrompt.classList.remove('show');
    return;
  }

  interactionLabel.textContent = interaction.label;
  interactionPrompt.classList.add('show');
}

renderer.domElement.addEventListener('pointermove', (event) => {
  if (moving || phase === 'done') {
    renderer.domElement.style.cursor = 'default';
    return;
  }

  const hit = getInteractiveHit(event);

  if (!hit) {
    renderer.domElement.style.cursor = 'default';
    return;
  }

  const coreEntry = getCoreEntryFromHit(hit);

  const coreActionable =
    coreEntry &&
    !puzzleSolved &&
    !carryingEntry &&
    (coreEntry.state === 'world' || coreEntry.state === 'installed');

  const generatorActionable =
    !puzzleSolved &&
    carryingEntry &&
    belongsTo(hit, generator);

  const exitActionable =
    phase === 'exit' &&
    belongsTo(hit, exit);

  renderer.domElement.style.cursor =
    coreActionable || generatorActionable || exitActionable
      ? 'pointer'
      : 'default';
});

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (orientationBlocked || moving || phase === 'done') return;

  const hit = getInteractiveHit(event);
  if (!hit) return;

  const coreEntry = getCoreEntryFromHit(hit);

  if (coreEntry && !puzzleSolved && !carryingEntry) {
    if (coreEntry.state === 'world') {
      pickWorldCore(coreEntry);
      return;
    }

    if (coreEntry.state === 'installed') {
      extractInstalledCore(coreEntry);
      return;
    }
  }

  if (
    !puzzleSolved &&
    carryingEntry &&
    belongsTo(hit, generator)
  ) {
    insertCarriedCore();
    return;
  }

  if (phase === 'exit' && belongsTo(hit, exit)) {
    finishLevel();
  }
});

const keyboardCodes = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
  'Space',
  'Enter',
  'NumpadEnter',
]);

window.addEventListener('keydown', (event) => {
  if (orientationBlocked || !keyboardCodes.has(event.code)) return;

  event.preventDefault();

  if (event.code === 'Enter' || event.code === 'NumpadEnter') {
    if (!event.repeat) {
      performContextInteraction();
    }
    return;
  }

  if (event.code === 'Space') {
    if (canManualControl() && manual.grounded) {
      manual.verticalVelocity = manual.jumpSpeed;
      manual.grounded = false;
    }

    return;
  }

  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    keys.add(event.code);
    return;
  }

  if (moving) {
    cancelAutopilot();
  }

  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  if (!keyboardCodes.has(event.code)) return;
  keys.delete(event.code);
});

window.addEventListener('blur', () => {
  keys.clear();
  manualVelocity.set(0, 0, 0);
});

function worldToScreen(object, element, yOffset = 0) {
  if (
    !object.visible ||
    element.classList.contains('world-tag--hidden')
  ) {
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

updateGeneratorState({ allowSolve: false });
updateCoreTags();
updateOrientationGate();

const clock = new THREE.Clock();

function render() {
  requestAnimationFrame(render);

  const delta = Math.min(clock.getDelta(), .033);
  const time = clock.elapsedTime;

  cloudField.userData.update?.(time);
  updateManualMovement(delta);
  animateRobot(robot, time, {
    moving: moving || manual.moving,
    boosting: !moving && manual.boosting,
    speedRatio: moving ? .58 : manual.speedRatio,
  });

  for (const entry of coreEntries) {
    if (!entry.object.visible) continue;

    entry.object.userData.wire.rotation.x += .006;
    entry.object.userData.wire.rotation.y += .015;
    entry.object.userData.halo.rotation.z += entry.config.value < 0 ? -.020 : .015;

    const baseIntensity = entry.config.value < 0 ? 4.2 : 3.8;
    entry.object.userData.ball.material.emissiveIntensity =
      baseIntensity + Math.sin(time * 5) * .6;

    entry.pedestal.userData.ring.rotation.z +=
      entry.config.value < 0 ? -.005 : .004;
  }

  const generatorSpeed =
    currentValue > level01.generator.targetValue
      ? .045
      : powered
        ? .026
        : .010;

  generator.userData.halo.rotation.z += generatorSpeed;
  generator.userData.innerHalo.rotation.z -= generatorSpeed * .7;

  if (generator.userData.energyColumn) {
    generator.userData.energyColumn.material.opacity =
      .26 + Math.sin(time * (powered ? 8 : 4)) * .08;
    generator.userData.energyColumn.scale.y =
      1 + Math.sin(time * (powered ? 7 : 3)) * .08;
  }

  if (currentValue > level01.generator.targetValue) {
    generator.userData.light.intensity = 6.2 + Math.sin(time * 11) * 1.8;
  } else if (powered) {
    generator.userData.light.intensity = 6.0 + Math.sin(time * 6) * 1.0;
  } else {
    generator.userData.light.intensity = 2.4 + Math.sin(time * 4) * .35;
  }

  if (powered) {
    cable.userData.glow.material.emissiveIntensity =
      2.7 + Math.sin(time * 8) * .55;

    if (energyLoopStart && !cable.userData.pulse.visible) {
      const loop = ((performance.now() - energyLoopStart) % 2200) / 2200;
      const point = cable.userData.curve.getPoint(loop);

      cable.userData.pulse.position.copy(point);
      cable.userData.pulseLight.position.copy(point);
      cable.userData.pulse.visible = true;
      cable.userData.pulseLight.visible = true;
      cable.userData.pulse.material.opacity =
        .50 + Math.sin(time * 10) * .20;
    }
  }

  if (exit.visible) {
    exitRing.rotation.z += .018;
    exitInner.material.opacity = .14 + Math.sin(time * 5) * .07;
    exit.position.y = .10 + Math.sin(time * 2.6) * .03;
  }

  for (const entry of coreEntries) {
    const tagAnchor = entry.state === 'installed'
      ? generator.position
      : new THREE.Vector3(...entry.config.approach);

    entry.tag.classList.toggle(
      'world-tag--near',
      distanceXZ(robot.position, tagAnchor) <= 1.45,
    );

    worldToScreen(
      entry.object,
      entry.tag,
      entry.state === 'installed' ? .72 : .90,
    );
  }

  worldToScreen(generator, generatorTag, 1.95);
  worldToScreen(door, doorTag, 3.10);
  updateInteractionPrompt();

  renderer.render(scene, camera);
}

render();

function handleViewportChange() {
  updateOrientationGate();
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight);
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', () => {
  window.setTimeout(handleViewportChange, 120);
});
