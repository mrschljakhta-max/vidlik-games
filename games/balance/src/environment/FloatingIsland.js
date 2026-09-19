import * as THREE from 'three';
import { createEnvironmentMaterials } from './TextureFactory.js';

function seededRandom(seed = 17) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createLantern(materials, scale = 1) {
  const group = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(.05 * scale, .07 * scale, .30 * scale, 12),
    materials.dark,
  );
  post.position.y = .15 * scale;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(.20 * scale, .34 * scale, .20 * scale),
    materials.dark,
  );
  frame.position.y = .42 * scale;

  const glassMaterial = materials.gold.clone();
  glassMaterial.emissiveIntensity = 2.2;

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(.12 * scale, .22 * scale, .12 * scale),
    glassMaterial,
  );
  glass.position.y = .42 * scale;

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(.15 * scale, .14 * scale, 4),
    materials.dark,
  );
  cap.position.y = .65 * scale;
  cap.rotation.y = Math.PI / 4;

  const light = new THREE.PointLight(0xffb84d, 3.2 * scale, 2.8 * scale, 2);
  light.position.y = .50 * scale;

  group.add(post, frame, glass, cap, light);
  return group;
}

function createIslandShape() {
  const shape = new THREE.Shape();

  shape.moveTo(-3.55, -2.05);
  shape.bezierCurveTo(-3.95, -1.42, -3.95, -.35, -3.78, .58);
  shape.bezierCurveTo(-3.62, 1.52, -3.18, 2.22, -2.36, 2.44);
  shape.bezierCurveTo(-1.58, 2.67, -.72, 2.48, .02, 2.55);
  shape.bezierCurveTo(.92, 2.62, 1.76, 2.48, 2.45, 2.25);
  shape.bezierCurveTo(3.16, 2.02, 3.62, 1.44, 3.74, .67);
  shape.bezierCurveTo(3.86, -.05, 3.73, -.88, 3.50, -1.56);
  shape.bezierCurveTo(3.26, -2.23, 2.58, -2.50, 1.78, -2.47);
  shape.bezierCurveTo(.96, -2.45, .25, -2.61, -.52, -2.56);
  shape.bezierCurveTo(-1.38, -2.50, -2.08, -2.54, -2.72, -2.36);
  shape.bezierCurveTo(-3.12, -2.25, -3.37, -2.16, -3.55, -2.05);

  return shape;
}

function createSmoothGrassMaterial(materials) {
  const grass = materials.grass.clone();

  // Critical change: remove the repeating procedural map that caused
  // the visible "checkerboard / Minecraft" pattern.
  grass.map = null;
  grass.bumpMap = null;
  grass.roughnessMap = null;
  grass.color.setHex(0x789f5f);
  grass.roughness = .94;
  grass.metalness = 0;
  grass.needsUpdate = true;

  return grass;
}

function createIslandBody(materials) {
  const shape = createIslandShape();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .34,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: .13,
    bevelThickness: .10,
    curveSegments: 12,
    steps: 1,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -.29, 0);

  const bodyMaterial = materials.earth.clone();
  bodyMaterial.color.setHex(0x5a4d3d);
  bodyMaterial.roughness = 1;

  const body = new THREE.Mesh(geometry, bodyMaterial);
  body.name = 'IslandEarthBody';
  body.castShadow = true;
  body.receiveShadow = true;

  return body;
}

function createGrassCap(materials) {
  const shape = createIslandShape();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .055,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: .07,
    bevelThickness: .035,
    curveSegments: 12,
    steps: 1,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, .015, 0);

  const cap = new THREE.Mesh(
    geometry,
    createSmoothGrassMaterial(materials),
  );

  cap.name = 'IslandGrassCap';
  cap.castShadow = true;
  cap.receiveShadow = true;

  return cap;
}

function makeSoftPatchTexture(inner, middle, alpha = .42) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);

  gradient.addColorStop(0, inner);
  gradient.addColorStop(.50, middle);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createSurfaceVariation(group) {
  const patches = [
    [-2.50, -.03, 1.38, 1.80, 1.10, .20, 'moss'],
    [-1.20, -.03, -1.58, 1.55, 1.00, -.35, 'earth'],
    [.15, -.03, 1.76, 1.35, .88, .15, 'moss'],
    [1.64, -.03, -1.55, 1.45, .92, -.18, 'earth'],
    [2.64, -.03, .92, 1.30, .82, .38, 'moss'],
    [2.38, -.03, -1.82, 1.05, .70, -.40, 'earth'],
  ];

  const textures = {
    moss: makeSoftPatchTexture(
      'rgba(68,100,43,1)',
      'rgba(96,125,58,.68)',
      .30,
    ),
    earth: makeSoftPatchTexture(
      'rgba(104,84,58,1)',
      'rgba(124,102,69,.62)',
      .26,
    ),
  };

  patches.forEach(([x, y, z, sx, sz, rotation, type]) => {
    const material = new THREE.MeshBasicMaterial({
      map: textures[type],
      transparent: true,
      opacity: 1,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      side: THREE.DoubleSide,
    });

    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sz),
      material,
    );

    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = rotation;
    patch.position.set(x, .082 + y, z);
    patch.renderOrder = 2;

    group.add(patch);
  });
}

function createSoftEdgeStones(group, materials, rand) {
  const positions = [
    [-3.25, 2.22, .48, .22],
    [-2.20, 2.43, .44, -.08],
    [-1.12, 2.45, .42, .15],
    [.06, 2.50, .46, -.10],
    [1.18, 2.42, .42, .12],
    [2.30, 2.20, .48, -.14],
    [3.20, 1.72, .42, .20],
    [3.48, .68, .38, -.20],
    [3.44, -.70, .42, .10],
    [3.06, -1.86, .46, -.12],
    [2.00, -2.35, .44, .08],
    [.82, -2.46, .42, -.10],
    [-.54, -2.45, .46, .14],
    [-1.78, -2.42, .42, -.08],
    [-2.88, -2.20, .46, .12],
    [-3.46, -1.28, .40, -.15],
    [-3.55, .02, .38, .12],
    [-3.46, 1.18, .42, -.12],
  ];

  const material = materials.rock.clone();
  material.color.setHex(0x9a8f7e);
  material.roughness = .96;

  positions.forEach(([x, z, scale, tilt], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      material,
    );

    rock.scale.set(
      scale * (1.08 + (index % 3) * .07),
      scale * .38,
      scale * (.88 + (index % 2) * .10),
    );

    rock.position.set(
      x + (rand() - .5) * .06,
      -.18 + (rand() - .5) * .025,
      z + (rand() - .5) * .06,
    );

    rock.rotation.set(
      (rand() - .5) * .08,
      rand() * Math.PI,
      tilt,
    );

    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });
}


function createLocalCliffMass(group, materials, rand) {
  const warm = materials.rock.clone();
  warm.map = null;
  warm.bumpMap = null;
  warm.roughnessMap = null;
  warm.color.setHex(0x8f806e);
  warm.roughness = .98;
  warm.metalness = 0;

  const mid = materials.rockDark.clone();
  mid.map = null;
  mid.bumpMap = null;
  mid.roughnessMap = null;
  mid.color.setHex(0x6f665c);
  mid.roughness = 1;
  mid.metalness = 0;

  const dark = mid.clone();
  dark.color.setHex(0x4f4942);

  const upper = [
    [-2.95, -.62,  1.20, 1.10, .82, 1.00, .20],
    [-1.90, -.70,  1.28, 1.22, .92, 1.08, .85],
    [-.72,  -.72,  1.18, 1.30, .98, 1.12, 1.55],
    [.55,  -.72,  1.14, 1.34, .98, 1.10, 2.15],
    [1.78, -.68,  1.00, 1.22, .90, 1.04, 2.78],
    [2.78, -.60,   .74, 1.02, .76,  .94, 3.38],
    [-2.88, -.64, -.92, 1.08, .82,  .98, 1.00],
    [-1.72, -.72, -1.18, 1.26, .94, 1.08, 1.65],
    [-.42,  -.76, -1.22, 1.34, 1.02, 1.14, 2.30],
    [.90,  -.74, -1.16, 1.30, .98, 1.10, 2.92],
    [2.10, -.68, -1.00, 1.18, .88, 1.02, 3.42],
    [2.94, -.60,  -.56, 1.00, .74,  .92, 4.00],
  ];

  upper.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      index % 4 === 0 ? mid : warm,
    );

    rock.scale.set(sx, sy, sz);
    rock.position.set(
      x + (rand() - .5) * .08,
      y + (rand() - .5) * .06,
      z + (rand() - .5) * .08,
    );
    rock.rotation.set(
      (rand() - .5) * .14,
      yaw + (rand() - .5) * .18,
      (rand() - .5) * .10,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });

  const middle = [
    [-2.25, -1.48,  .62, .92, 1.34, .84, .40],
    [-1.08, -1.66,  .54, 1.02, 1.54, .92, 1.22],
    [.20,  -1.76,  .46, 1.08, 1.68, .96, 2.08],
    [1.46, -1.60,  .36, .98, 1.50, .90, 2.86],
    [2.38, -1.40,  .22, .84, 1.24, .78, 3.58],
    [-1.92, -1.54, -.54, .90, 1.40, .84, 1.04],
    [-.68,  -1.74, -.48, 1.02, 1.62, .92, 1.88],
    [.68,  -1.72, -.44, 1.04, 1.58, .94, 2.66],
    [1.88, -1.50, -.36, .90, 1.32, .84, 3.34],
  ];

  middle.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      index % 3 === 0 ? warm : mid,
    );
    rock.scale.set(sx, sy, sz);
    rock.position.set(x, y, z);
    rock.rotation.set(
      .06 + (rand() - .5) * .12,
      yaw,
      (rand() - .5) * .12,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });

  const keel = new THREE.Mesh(
    new THREE.CylinderGeometry(.42, 1.10, 2.65, 7, 1, false),
    dark,
  );
  keel.position.set(-.05, -2.48, 0);
  keel.rotation.y = .24;
  keel.castShadow = true;
  keel.receiveShadow = true;
  group.add(keel);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(.64, 1.42, 7),
    dark,
  );
  tip.position.set(-.08, -3.88, .02);
  tip.rotation.y = -.18;
  tip.castShadow = true;
  tip.receiveShadow = true;
  group.add(tip);
}

function createStonePath(group, material, rand) {
  const pathPoints = [
    [-3.0, .20],
    [-2.35, .18],
    [-1.68, .15],
    [-1.00, .18],
    [-.32, .15],
    [.38, .16],
    [1.05, .15],
    [1.72, .08],
    [2.30, -.22],
    [2.75, -.70],
    [3.05, -1.16],
  ];

  pathPoints.forEach(([x, z], index) => {
    const width = index > 7 ? .58 : .66;
    const depth = index > 7 ? .52 : .64;

    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(
        width * (.90 + rand() * .18),
        .09 + rand() * .025,
        depth * (.90 + rand() * .18),
      ),
      material,
    );

    tile.position.set(
      x,
      .105 + rand() * .012,
      z + (rand() - .5) * .05,
    );

    tile.rotation.y =
      (index > 7 ? -.42 : 0) +
      (rand() - .5) * .07;

    tile.castShadow = true;
    tile.receiveShadow = true;
    group.add(tile);
  });
}

function createDoorFoundation(group, materials) {
  const baseMaterial = materials.stone.clone();
  baseMaterial.color.setHex(0xa69a87);
  baseMaterial.roughness = .94;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, .16, .76),
    baseMaterial,
  );
  base.position.set(3.45, .07, -1.18);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const sideStoneData = [
    [2.42, .18, -1.18, .34, .24, .34, .08],
    [4.48, .18, -1.18, .38, .28, .36, -.06],
    [2.72, .14, -.80, .32, .20, .26, .18],
    [4.18, .14, -.82, .30, .19, .24, -.15],
  ];

  sideStoneData.forEach(([x, y, z, sx, sy, sz, rz]) => {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      materials.rock.clone(),
    );

    stone.material.color.setHex(0x958a79);
    stone.material.roughness = .97;
    stone.scale.set(sx, sy, sz);
    stone.position.set(x, y, z);
    stone.rotation.set(.12, rz * 3, rz);
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  });
}

function createGeneratorFoundation(group, materials) {
  const foundationMaterial = materials.path.clone();
  foundationMaterial.color.setHex(0xa99e8c);
  foundationMaterial.roughness = .92;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.26, 1.58, 48),
    foundationMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(1.30, .095, .50);
  ring.receiveShadow = true;
  group.add(ring);

  const plateMaterial = materials.stone.clone();
  plateMaterial.color.setHex(0xb1a592);
  plateMaterial.roughness = .94;

  const plateData = [
    [.00, 1.54, .42, .20],
    [.68, 1.36, .34, -.18],
    [-.68, 1.34, .36, .14],
    [1.08, .78, .30, .28],
    [-1.06, .80, .32, -.22],
  ];

  plateData.forEach(([dx, dz, scale, rotation]) => {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(.56 * scale * 2, .065, .42 * scale * 2),
      plateMaterial,
    );

    plate.position.set(
      1.30 + dx,
      .105,
      .50 + dz,
    );

    plate.rotation.y = rotation;
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);
  });
}

function createFlowerPatch(rand, scale = 1) {
  const group = new THREE.Group();

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x526f45,
    roughness: 1,
  });

  const flowerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf3ecd7, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xe3d5a7, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xdde7d5, roughness: .95 }),
  ];

  for (let i = 0; i < 5; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(.010 * scale, .012 * scale, .16 * scale, 6),
      stemMaterial,
    );

    stem.position.set(
      (rand() - .5) * .30 * scale,
      .08 * scale,
      (rand() - .5) * .30 * scale,
    );

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(.035 * scale, 8, 6),
      flowerMaterials[i % flowerMaterials.length],
    );

    flower.scale.y = .50;
    flower.position.set(
      stem.position.x,
      .17 * scale,
      stem.position.z,
    );

    group.add(stem, flower);
  }

  return group;
}

export function createFloatingIsland(baseMaterials) {
  const materials = createEnvironmentMaterials(baseMaterials);
  const island = new THREE.Group();
  const rand = seededRandom(29);

  // Layered island instead of one textured tile slab.
  island.add(createIslandBody(materials));
  island.add(createGrassCap(materials));

  createLocalCliffMass(island, materials, rand);

  createSurfaceVariation(island);
  createSoftEdgeStones(island, materials, rand);
  createStonePath(island, materials.path, rand);
  createDoorFoundation(island, materials);
  createGeneratorFoundation(island, materials);

  const flowerPositions = [
    [-2.30, -1.88, .66],
    [.38, -1.96, .60],
    [2.62, 1.20, .56],
  ];

  flowerPositions.forEach(([x, z, scale]) => {
    const patch = createFlowerPatch(rand, scale);
    patch.position.set(x, .105, z);
    island.add(patch);
  });

  [
    [-3.12, -2.08, .78],
    [-3.20, 1.98, .78],
    [2.76, 1.94, .76],
    [3.05, -.20, .74],
  ].forEach(([x, z, scale]) => {
    const lantern = createLantern(baseMaterials, scale);
    lantern.position.set(x, .09, z);
    island.add(lantern);
  });

  return island;
}

export function addCloudscape(scene, baseMaterials) {
  const materials = createEnvironmentMaterials(baseMaterials);
  const rand = seededRandom(91);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: .32,
    roughness: 1,
    depthWrite: false,
  });

  // Softer background: fewer, smaller clouds so they do not compete
  // with the island silhouette.
  for (let i = 0; i < 22; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(.52 + rand() * .54, 18, 12),
      cloudMaterial,
    );

    cloud.scale.set(
      1.55 + rand() * 1.35,
      .40 + rand() * .30,
      .90 + rand() * .75,
    );

    cloud.position.set(
      (rand() - .5) * 25,
      -4.1 - rand() * 3.2,
      (rand() - .5) * 20,
    );

    scene.add(cloud);
  }

  const waterfallMaterial = new THREE.MeshBasicMaterial({
    color: 0x83e5ff,
    transparent: true,
    opacity: .28,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // Smaller, more distant background islands.
  const distantData = [
    [-8.6, 1.2, -10.5, .76],
    [8.2, 2.0, -12.0, .82],
    [-11.5, 3.8, -17.0, .62],
    [10.8, 4.2, -18.0, .68],
  ];

  distantData.forEach(([x, y, z, scale], index) => {
    const group = new THREE.Group();

    const mainRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      index % 2 ? materials.rock : materials.rockDark,
    );

    mainRock.scale.set(
      1.05 * scale,
      1.65 * scale,
      .92 * scale,
    );

    mainRock.position.y = -1.05 * scale;
    mainRock.rotation.set(.08, index * .52, -.04);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 9),
      createSmoothGrassMaterial(materials),
    );

    cap.scale.set(
      1.08 * scale,
      .14 * scale,
      .92 * scale,
    );
    cap.position.y = .16 * scale;

    group.add(mainRock, cap);

    if (index < 2) {
      const waterfall = new THREE.Mesh(
        new THREE.PlaneGeometry(
          .14 * scale,
          2.20 * scale,
        ),
        waterfallMaterial,
      );

      waterfall.position.set(
        .30 * scale,
        -.95 * scale,
        .76 * scale,
      );

      group.add(waterfall);
    }

    group.position.set(x, y, z);
    group.rotation.y = index % 2 ? -.24 : .22;
    scene.add(group);
  });
}
