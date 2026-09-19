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

  const light = new THREE.PointLight(0xffb84d, 3.0 * scale, 2.6 * scale, 2);
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

  grass.map = null;
  grass.bumpMap = null;
  grass.roughnessMap = null;
  grass.color.setHex(0x83b85f);
  grass.roughness = .94;
  grass.metalness = 0;
  grass.needsUpdate = true;

  return grass;
}

function createIslandBody(materials) {
  const shape = createIslandShape();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .30,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: .10,
    bevelThickness: .08,
    curveSegments: 12,
    steps: 1,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -.26, 0);

  const bodyMaterial = materials.earth.clone();
  bodyMaterial.map = null;
  bodyMaterial.bumpMap = null;
  bodyMaterial.roughnessMap = null;
  bodyMaterial.color.setHex(0x6d5b47);
  bodyMaterial.roughness = .98;
  bodyMaterial.needsUpdate = true;

  const body = new THREE.Mesh(geometry, bodyMaterial);
  body.name = 'IslandEarthBody';
  body.castShadow = true;
  body.receiveShadow = true;

  return body;
}

function createGrassCap(materials) {
  const geometry = new THREE.ShapeGeometry(createIslandShape(), 16);
  geometry.rotateX(-Math.PI / 2);

  const cap = new THREE.Mesh(
    geometry,
    createSmoothGrassMaterial(materials),
  );

  cap.position.y = .045;
  cap.name = 'IslandGrassCap';
  cap.receiveShadow = true;

  return cap;
}

function makeSoftPatchTexture(inner, middle, alpha = .12) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);

  gradient.addColorStop(0, inner);
  gradient.addColorStop(.54, middle);
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
  // Small transparent tint patches only — no large pale polygons.
  const patches = [
    [-2.55, 1.28, 1.05, .65, .10, 'moss'],
    [-1.02, -1.42, .92, .58, -.20, 'earth'],
    [2.18, 1.26, .82, .52, .18, 'moss'],
  ];

  const textures = {
    moss: makeSoftPatchTexture(
      'rgba(103,145,70,1)',
      'rgba(128,163,86,.48)',
      .11,
    ),
    earth: makeSoftPatchTexture(
      'rgba(120,93,60,1)',
      'rgba(139,110,72,.42)',
      .10,
    ),
  };

  patches.forEach(([x, z, sx, sz, rotation, type]) => {
    const material = new THREE.MeshBasicMaterial({
      map: textures[type],
      transparent: true,
      opacity: 1,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
    });

    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sz),
      material,
    );

    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = rotation;
    patch.position.set(x, .058, z);
    patch.renderOrder = 3;

    group.add(patch);
  });
}

function createNativeCliffMass(group, materials, rand) {
  const upperRock = materials.rock.clone();
  upperRock.map = null;
  upperRock.bumpMap = null;
  upperRock.roughnessMap = null;
  upperRock.color.setHex(0x968774);
  upperRock.roughness = .98;
  upperRock.metalness = 0;

  const middleRock = materials.rockDark.clone();
  middleRock.map = null;
  middleRock.bumpMap = null;
  middleRock.roughnessMap = null;
  middleRock.color.setHex(0x6f665c);
  middleRock.roughness = 1;
  middleRock.metalness = 0;

  const lowerRock = middleRock.clone();
  lowerRock.color.setHex(0x4f4942);

  const upper = [
    [-2.90, -.58, 1.18, 1.10, .76, .96, .20],
    [-1.78, -.64, 1.28, 1.22, .88, 1.02, .90],
    [-.55, -.67, 1.18, 1.30, .96, 1.08, 1.55],
    [.74, -.67, 1.10, 1.30, .94, 1.06, 2.18],
    [1.92, -.63, .95, 1.18, .84, .98, 2.82],
    [2.84, -.57, .68, 1.00, .72, .90, 3.42],
    [-2.84, -.60, -.88, 1.04, .76, .94, 1.02],
    [-1.64, -.66, -1.12, 1.22, .88, 1.02, 1.66],
    [-.34, -.70, -1.16, 1.30, .98, 1.08, 2.34],
    [.98, -.68, -1.10, 1.28, .94, 1.06, 2.94],
    [2.16, -.63, -.90, 1.14, .82, .98, 3.48],
    [2.96, -.56, -.48, .96, .70, .88, 4.06],
  ];

  upper.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      index % 4 === 0 ? middleRock : upperRock,
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
    [-2.30, -1.45, .62, .90, 1.28, .82, .38],
    [-1.10, -1.62, .55, 1.00, 1.48, .90, 1.22],
    [.18, -1.72, .46, 1.08, 1.62, .96, 2.08],
    [1.48, -1.56, .36, .96, 1.45, .88, 2.86],
    [2.42, -1.36, .22, .82, 1.20, .76, 3.58],
    [-1.98, -1.52, -.52, .88, 1.34, .82, 1.04],
    [-.72, -1.70, -.48, 1.00, 1.56, .90, 1.88],
    [.66, -1.68, -.44, 1.02, 1.52, .92, 2.66],
    [1.90, -1.46, -.36, .88, 1.28, .82, 3.34],
  ];

  middle.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      index % 3 === 0 ? upperRock : middleRock,
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

  // Longer tapered lower section to restore a proper floating-island silhouette.
  const keel = new THREE.Mesh(
    new THREE.CylinderGeometry(.42, 1.12, 2.90, 7, 1, false),
    lowerRock,
  );
  keel.position.set(-.04, -2.56, .00);
  keel.rotation.y = .24;
  keel.castShadow = true;
  keel.receiveShadow = true;
  group.add(keel);

  const lowerShardA = new THREE.Mesh(
    new THREE.ConeGeometry(.74, 1.52, 7),
    lowerRock,
  );
  lowerShardA.position.set(-.30, -4.02, .10);
  lowerShardA.rotation.set(.10, -.22, -.08);
  lowerShardA.castShadow = true;
  lowerShardA.receiveShadow = true;
  group.add(lowerShardA);

  const lowerShardB = new THREE.Mesh(
    new THREE.ConeGeometry(.46, 1.12, 6),
    middleRock,
  );
  lowerShardB.position.set(.58, -3.56, -.18);
  lowerShardB.rotation.set(-.08, .42, .16);
  lowerShardB.castShadow = true;
  lowerShardB.receiveShadow = true;
  group.add(lowerShardB);
}

function createEdgeStoneAccents(group, materials, rand) {
  // Fewer accents than before: they break the edge without making a stone necklace.
  const positions = [
    [-3.25, 1.72, .40, .10],
    [-2.10, 2.28, .34, -.06],
    [.12, 2.42, .34, .08],
    [2.38, 2.02, .38, -.10],
    [3.34, .72, .34, .08],
    [3.06, -1.72, .38, -.08],
    [.76, -2.36, .34, .08],
    [-1.74, -2.30, .36, -.08],
    [-3.34, -1.10, .34, .08],
  ];

  const material = materials.rock.clone();
  material.map = null;
  material.bumpMap = null;
  material.roughnessMap = null;
  material.color.setHex(0xa08f79);
  material.roughness = .97;
  material.needsUpdate = true;

  positions.forEach(([x, z, scale, tilt], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      material,
    );

    rock.scale.set(
      scale * (1.05 + (index % 3) * .06),
      scale * .32,
      scale * (.86 + (index % 2) * .10),
    );

    rock.position.set(
      x + (rand() - .5) * .05,
      -.13,
      z + (rand() - .5) * .05,
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
  baseMaterial.color.setHex(0xada08b);
  baseMaterial.roughness = .94;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.52, .10, .74),
    baseMaterial,
  );
  base.position.set(3.45, .045, -1.18);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const sideStoneData = [
    [2.44, .14, -1.18, .30, .20, .30, .08],
    [4.46, .14, -1.18, .32, .22, .32, -.06],
    [2.76, .10, -.84, .26, .16, .22, .18],
    [4.14, .10, -.84, .26, .16, .22, -.15],
  ];

  sideStoneData.forEach(([x, y, z, sx, sy, sz, rz]) => {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      materials.rock.clone(),
    );

    stone.material.color.setHex(0x988b78);
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
  foundationMaterial.color.setHex(0xb0a28d);
  foundationMaterial.roughness = .92;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.26, 1.56, 48),
    foundationMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(1.30, .092, .50);
  ring.receiveShadow = true;
  group.add(ring);
}

function createFlowerPatch(rand, scale = 1) {
  const group = new THREE.Group();

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x526f45,
    roughness: 1,
  });

  const flowerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xe1d6a8, roughness: .95 }),
    new THREE.MeshStandardMaterial({ color: 0xe1ead9, roughness: .95 }),
  ];

  for (let i = 0; i < 4; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(.009 * scale, .011 * scale, .14 * scale, 6),
      stemMaterial,
    );

    stem.position.set(
      (rand() - .5) * .26 * scale,
      .07 * scale,
      (rand() - .5) * .26 * scale,
    );

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(.032 * scale, 8, 6),
      flowerMaterials[i % flowerMaterials.length],
    );

    flower.scale.y = .50;
    flower.position.set(
      stem.position.x,
      .15 * scale,
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

  island.add(createIslandBody(materials));
  island.add(createGrassCap(materials));

  createNativeCliffMass(island, materials, rand);
  createSurfaceVariation(island);
  createEdgeStoneAccents(island, materials, rand);
  createStonePath(island, materials.path, rand);
  createDoorFoundation(island, materials);
  createGeneratorFoundation(island, materials);

  const flowerPositions = [
    [-2.48, -1.78, .50],
    [2.54, 1.16, .46],
  ];

  flowerPositions.forEach(([x, z, scale]) => {
    const patch = createFlowerPatch(rand, scale);
    patch.position.set(x, .095, z);
    island.add(patch);
  });

  [
    [-3.12, -2.08, .76],
    [-3.20, 1.98, .76],
    [2.76, 1.94, .74],
    [3.05, -.20, .72],
  ].forEach(([x, z, scale]) => {
    const lantern = createLantern(baseMaterials, scale);
    lantern.position.set(x, .08, z);
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
    opacity: .28,
    roughness: 1,
    depthWrite: false,
  });

  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(.50 + rand() * .48, 18, 12),
      cloudMaterial,
    );

    cloud.scale.set(
      1.45 + rand() * 1.20,
      .38 + rand() * .28,
      .86 + rand() * .68,
    );

    cloud.position.set(
      (rand() - .5) * 25,
      -4.2 - rand() * 3.3,
      (rand() - .5) * 20,
    );

    scene.add(cloud);
  }

  const waterfallMaterial = new THREE.MeshBasicMaterial({
    color: 0x83e5ff,
    transparent: true,
    opacity: .24,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const distantData = [
    [-8.6, 1.2, -10.8, .70],
    [8.4, 2.0, -12.4, .76],
    [-11.6, 3.8, -17.4, .58],
    [10.8, 4.2, -18.4, .62],
  ];

  distantData.forEach(([x, y, z, scale], index) => {
    const group = new THREE.Group();

    const mainRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      index % 2 ? materials.rock : materials.rockDark,
    );

    mainRock.scale.set(
      1.00 * scale,
      1.58 * scale,
      .88 * scale,
    );

    mainRock.position.y = -1.05 * scale;
    mainRock.rotation.set(.08, index * .52, -.04);

    const cap = new THREE.Mesh(
      new THREE.CircleGeometry(1, 24),
      createSmoothGrassMaterial(materials),
    );
    cap.rotation.x = -Math.PI / 2;
    cap.scale.set(
      1.04 * scale,
      .88 * scale,
      1,
    );
    cap.position.y = .10 * scale;

    group.add(mainRock, cap);

    if (index < 2) {
      const waterfall = new THREE.Mesh(
        new THREE.PlaneGeometry(
          .13 * scale,
          2.00 * scale,
        ),
        waterfallMaterial,
      );

      waterfall.position.set(
        .28 * scale,
        -.92 * scale,
        .72 * scale,
      );

      group.add(waterfall);
    }

    group.position.set(x, y, z);
    group.rotation.y = index % 2 ? -.24 : .22;
    scene.add(group);
  });
}
