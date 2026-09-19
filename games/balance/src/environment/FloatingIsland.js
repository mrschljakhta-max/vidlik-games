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

  const light = new THREE.PointLight(0xffb84d, 3.8 * scale, 3.1 * scale, 2);
  light.position.y = .50 * scale;

  group.add(post, frame, glass, cap, light);
  return group;
}

function createGrassTuft(rand, material, scale = 1) {
  const group = new THREE.Group();

  const blades = 5 + Math.floor(rand() * 5);

  for (let i = 0; i < blades; i += 1) {
    const height = (.20 + rand() * .22) * scale;

    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(.025 * scale, height, 5),
      material,
    );

    blade.position.set(
      (rand() - .5) * .28 * scale,
      height * .5,
      (rand() - .5) * .28 * scale,
    );

    blade.rotation.z = (rand() - .5) * .42;
    blade.rotation.x = (rand() - .5) * .18;
    group.add(blade);
  }

  return group;
}

function createFlowerPatch(rand, materials, scale = 1) {
  const group = new THREE.Group();

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d7e3e,
    roughness: 1,
  });

  const flowerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf8f0cf, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xffd879, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: .95 }),
  ];

  for (let i = 0; i < 5; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(.012 * scale, .014 * scale, .18 * scale, 6),
      stemMaterial,
    );

    stem.position.set(
      (rand() - .5) * .34 * scale,
      .09 * scale,
      (rand() - .5) * .34 * scale,
    );

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(.045 * scale, 8, 6),
      flowerMaterials[i % flowerMaterials.length],
    );

    flower.scale.y = .55;
    flower.position.set(
      stem.position.x,
      .19 * scale,
      stem.position.z,
    );

    group.add(stem, flower);
  }

  return group;
}

function addMossCap(group, x, z, width, depth, material, rand) {
  const moss = new THREE.Mesh(
    new THREE.BoxGeometry(
      width * (.72 + rand() * .16),
      .055,
      depth * (.72 + rand() * .16),
    ),
    material,
  );

  moss.position.set(
    x + (rand() - .5) * width * .1,
    .06,
    z + (rand() - .5) * depth * .1,
  );

  moss.rotation.y = (rand() - .5) * .13;
  moss.receiveShadow = true;
  group.add(moss);
}

function createVine(rand, material, length = 1.2) {
  const group = new THREE.Group();
  const segments = 6;

  for (let i = 0; i < segments; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(.075 + rand() * .025, 8, 6),
      material,
    );

    leaf.scale.set(1.35, .45, .7);
    leaf.position.set(
      Math.sin(i * 1.45) * .08,
      -(i / (segments - 1)) * length,
      0,
    );

    leaf.rotation.z = (rand() - .5) * .9;
    group.add(leaf);
  }

  return group;
}

function createEdgeBlocks(group, materials, rand) {
  const blockMaterialA = materials.rock;
  const blockMaterialB = materials.rockDark;

  const addBlock = (x, z, width, depth, edgeRotation = 0) => {
    const height = .62 + rand() * .28;

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      rand() > .34 ? blockMaterialA : blockMaterialB,
    );

    block.position.set(
      x,
      -.42 - height * .35,
      z,
    );

    block.rotation.y = edgeRotation + (rand() - .5) * .10;
    block.rotation.z = (rand() - .5) * .025;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);

    addMossCap(
      group,
      x,
      z,
      width,
      depth,
      materials.grass,
      rand,
    );
  };

  for (let x = -3.95; x <= 3.95; x += .88) {
    addBlock(
      x + (rand() - .5) * .12,
      2.88 + (rand() - .5) * .12,
      .74 + rand() * .16,
      .62 + rand() * .12,
    );

    addBlock(
      x + (rand() - .5) * .12,
      -2.88 + (rand() - .5) * .12,
      .74 + rand() * .16,
      .62 + rand() * .12,
    );
  }

  for (let z = -2.15; z <= 2.15; z += .86) {
    addBlock(
      -4.08 + (rand() - .5) * .10,
      z + (rand() - .5) * .12,
      .64 + rand() * .12,
      .72 + rand() * .16,
      Math.PI / 2,
    );

    addBlock(
      4.08 + (rand() - .5) * .10,
      z + (rand() - .5) * .12,
      .64 + rand() * .12,
      .72 + rand() * .16,
      Math.PI / 2,
    );
  }
}

function createHangingCliffs(group, materials, rand) {
  const positions = [];

  for (let x = -3.8; x <= 3.8; x += .92) {
    positions.push([x, 3.03], [x, -3.03]);
  }

  for (let z = -2.2; z <= 2.2; z += .92) {
    positions.push([-4.18, z], [4.18, z]);
  }

  positions.forEach(([x, z], index) => {
    const height = 1.20 + rand() * 2.05;
    const radius = .34 + rand() * .20;

    const geometry = new THREE.CylinderGeometry(
      radius * .55,
      radius,
      height,
      5 + Math.floor(rand() * 3),
    );

    const cliff = new THREE.Mesh(
      geometry,
      index % 3 === 0 ? materials.rockDark : materials.rock,
    );

    cliff.position.set(
      x + (rand() - .5) * .24,
      -1.02 - height * .5,
      z + (rand() - .5) * .24,
    );

    cliff.rotation.x = (rand() - .5) * .08;
    cliff.rotation.z = (rand() - .5) * .08;
    cliff.rotation.y = rand() * Math.PI;
    cliff.scale.x = .78 + rand() * .45;
    cliff.scale.z = .74 + rand() * .40;
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    group.add(cliff);
  });
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
        .11 + rand() * .035,
        depth * (.90 + rand() * .18),
      ),
      material,
    );

    tile.position.set(
      x,
      .055 + rand() * .015,
      z + (rand() - .5) * .07,
    );

    tile.rotation.y =
      (index > 7 ? -.42 : 0) +
      (rand() - .5) * .09;

    tile.castShadow = true;
    tile.receiveShadow = true;
    group.add(tile);
  });
}

export function createFloatingIsland(baseMaterials) {
  const materials = createEnvironmentMaterials(baseMaterials);
  const island = new THREE.Group();
  const rand = seededRandom(29);

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b493f,
    roughness: 1,
  });

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(8.18, .72, 5.70),
    earthMaterial,
  );

  soil.position.y = -.48;
  soil.castShadow = true;
  soil.receiveShadow = true;
  island.add(soil);

  const turf = new THREE.Mesh(
    new THREE.BoxGeometry(8.06, .18, 5.60),
    materials.grass,
  );

  turf.position.y = -.08;
  turf.receiveShadow = true;
  island.add(turf);

  createEdgeBlocks(island, materials, rand);
  createHangingCliffs(island, materials, rand);
  createStonePath(island, materials.path, rand);

  const tuftMaterial = new THREE.MeshStandardMaterial({
    color: 0x72995c,
    roughness: 1,
  });

  const vineMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d7a42,
    roughness: .98,
  });

  const tuftPositions = [
    [-3.45, 2.33], [-2.65, 2.38], [-1.80, 2.42], [-.75, 2.46],
    [.18, 2.46], [1.22, 2.40], [2.12, 2.32], [3.14, 2.02],
    [3.50, 1.22], [3.48, -.10], [3.35, -1.94], [2.55, -2.35],
    [1.40, -2.46], [.35, -2.43], [-1.15, -2.46], [-2.55, -2.38],
    [-3.45, -1.95], [-3.62, -.85], [-3.60, .90],
  ];

  tuftPositions.forEach(([x, z], index) => {
    const tuft = createGrassTuft(
      rand,
      tuftMaterial,
      .80 + (index % 4) * .08,
    );

    tuft.position.set(x, .02, z);
    island.add(tuft);
  });

  const flowerPositions = [
    [-3.05, 1.55],
    [-2.20, -2.05],
    [-.75, 2.10],
    [1.95, 2.00],
    [2.78, 1.35],
    [2.56, -2.02],
    [.55, -2.10],
  ];

  flowerPositions.forEach(([x, z], index) => {
    const patch = createFlowerPatch(
      rand,
      baseMaterials,
      .80 + (index % 3) * .10,
    );

    patch.position.set(x, .04, z);
    island.add(patch);
  });

  const boulderMaterial = materials.rockDark.clone();

  [
    [-3.28, 1.68, .28],
    [-2.60, -2.04, .23],
    [2.55, 2.05, .25],
    [3.15, -1.92, .22],
    [.10, 2.27, .20],
  ].forEach(([x, z, scale]) => {
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      boulderMaterial,
    );

    boulder.scale.set(
      scale * 1.35,
      scale,
      scale * 1.12,
    );

    boulder.position.set(x, .09, z);
    boulder.rotation.set(rand(), rand(), rand());
    boulder.castShadow = true;
    island.add(boulder);
  });

  [
    [-3.72, 1.90, 1.20],
    [-3.86, -.42, .95],
    [-2.95, -2.70, 1.05],
    [1.75, -2.72, 1.15],
    [3.82, 1.48, .90],
  ].forEach(([x, z, length], index) => {
    const vine = createVine(rand, vineMaterial, length);
    vine.position.set(x, -.02, z);
    vine.rotation.y = index % 2 ? .35 : -.25;
    island.add(vine);
  });

  [
    [-3.35, -2.28, .92],
    [-3.42, 2.15, .92],
    [2.92, 2.10, .90],
    [3.12, -.28, .88],
  ].forEach(([x, z, scale]) => {
    const lantern = createLantern(baseMaterials, scale);
    lantern.position.set(x, .03, z);
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
    opacity: .44,
    roughness: 1,
    depthWrite: false,
  });

  for (let i = 0; i < 34; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(.65 + rand() * .75, 20, 14),
      cloudMaterial,
    );

    cloud.scale.set(
      1.8 + rand() * 1.7,
      .48 + rand() * .42,
      1.05 + rand(),
    );

    cloud.position.set(
      (rand() - .5) * 25,
      -3.8 - rand() * 3.1,
      (rand() - .5) * 19,
    );

    scene.add(cloud);
  }

  const waterfallMaterial = new THREE.MeshBasicMaterial({
    color: 0x7eeaff,
    transparent: true,
    opacity: .40,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const distantData = [
    [-7.8, 1.0, -8.5, 1.15],
    [7.1, 2.0, -10.5, 1.35],
    [-10.5, 3.8, -15, .85],
    [10.2, 4.5, -16, .95],
    [-3.8, 5.4, -19.0, .72],
  ];

  distantData.forEach(([x, y, z, scale], index) => {
    const group = new THREE.Group();

    const rock = new THREE.Mesh(
      new THREE.CylinderGeometry(
        .48 * scale,
        1.35 * scale,
        3.8 * scale,
        7,
      ),
      index % 2 ? materials.rock : materials.rockDark,
    );

    rock.position.y = -1.50 * scale;
    rock.rotation.y = index * .52;

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.10 * scale,
        1.36 * scale,
        .30 * scale,
        10,
      ),
      materials.grass,
    );

    cap.position.y = .18;

    group.add(rock, cap);

    if (index < 3) {
      const waterfall = new THREE.Mesh(
        new THREE.PlaneGeometry(
          .24 * scale,
          3.25 * scale,
        ),
        waterfallMaterial,
      );

      waterfall.position.set(
        .30 * scale,
        -1.25 * scale,
        .66 * scale,
      );

      group.add(waterfall);
    }

    group.position.set(x, y, z);
    group.rotation.y = index % 2 ? -.24 : .22;
    scene.add(group);
  });
}
