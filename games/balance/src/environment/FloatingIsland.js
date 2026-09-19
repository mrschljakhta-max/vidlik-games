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

function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);

  const rand = seededRandom(143);

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;

      const broad =
        Math.sin(x * .018) * 4 +
        Math.sin(y * .021) * 3 +
        Math.sin((x + y) * .010) * 2;

      const noise = (rand() - .5) * 8;
      const variation = broad + noise;

      image.data[i] = Math.max(0, Math.min(255, 104 + variation * .85));
      image.data[i + 1] = Math.max(0, Math.min(255, 170 + variation * 1.25));
      image.data[i + 2] = Math.max(0, Math.min(255, 72 + variation * .62));
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  // Very soft broad tinting. No tiles, squares or visible repeating cells.
  const gradients = [
    [130, 125, 120, 'rgba(194,206,104,.12)'],
    [390, 155, 150, 'rgba(76,128,52,.11)'],
    [275, 385, 135, 'rgba(171,193,82,.10)'],
  ];

  gradients.forEach(([x, y, radius, color]) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return texture;
}

function createSmoothGrassMaterial(materials) {
  const grass = materials.grass.clone();

  grass.map = createGrassTexture();
  grass.bumpMap = null;
  grass.roughnessMap = null;
  grass.color.setHex(0xffffff);
  grass.roughness = .92;
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
  const geometry = new THREE.ShapeGeometry(createIslandShape(), 18);
  geometry.rotateX(-Math.PI / 2);

  const cap = new THREE.Mesh(
    geometry,
    createSmoothGrassMaterial(materials),
  );

  // Lift the grass very slightly above the earth body to avoid z-fighting
  // and guarantee that the top reads as grass.
  cap.position.y = .105;
  cap.name = 'IslandGrassCap';
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
  // Only a few very soft earth/moss tints. They should never read as
  // separate polygons or pale plates.
  const patches = [
    [-2.62, 1.42, 1.18, .76, .16, 'moss'],
    [-1.22, -1.62, .92, .58, -.20, 'earth'],
    [2.48, -1.28, .82, .52, .26, 'earth'],
  ];

  const textures = {
    moss: makeSoftPatchTexture(
      'rgba(77,111,54,1)',
      'rgba(108,139,72,.46)',
      .10,
    ),
    earth: makeSoftPatchTexture(
      'rgba(112,88,58,1)',
      'rgba(133,106,70,.42)',
      .09,
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
    patch.position.set(x, .112, z);
    patch.renderOrder = 3;

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
  warm.color.setHex(0x948572);
  warm.roughness = .98;
  warm.metalness = 0;

  const mid = materials.rockDark.clone();
  mid.map = null;
  mid.bumpMap = null;
  mid.roughnessMap = null;
  mid.color.setHex(0x6b6258);
  mid.roughness = 1;
  mid.metalness = 0;

  const dark = mid.clone();
  dark.color.setHex(0x4f4942);

  // Broad rocky shoulder immediately under the island.
  const shoulder = [
    [-3.05, -.58,  1.36, 1.02, .70, .92, .22],
    [-2.08, -.62,  1.46, 1.14, .78, 1.00, .78],
    [-1.02, -.66,  1.44, 1.20, .84, 1.06, 1.30],
    [.08,  -.66,  1.40, 1.24, .86, 1.08, 1.88],
    [1.18, -.64,  1.34, 1.18, .82, 1.04, 2.45],
    [2.18, -.60,  1.20, 1.10, .76, .98, 3.00],
    [3.00, -.56,   .90, .96, .68, .90, 3.50],

    [-3.14, -.58, -.90, .98, .70, .92, .86],
    [-2.20, -.62, -1.22, 1.10, .78, .98, 1.36],
    [-1.16, -.66, -1.38, 1.18, .84, 1.04, 1.96],
    [-.04,  -.68, -1.42, 1.24, .88, 1.08, 2.50],
    [1.10, -.66, -1.36, 1.18, .84, 1.04, 3.00],
    [2.14, -.62, -1.16, 1.08, .76, .98, 3.52],
    [3.00, -.58,  -.78, .94, .68, .88, 4.02],
  ];

  shoulder.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      index % 5 === 0 ? mid : warm,
    );

    rock.scale.set(sx, sy, sz);
    rock.position.set(
      x + (rand() - .5) * .08,
      y + (rand() - .5) * .05,
      z + (rand() - .5) * .08,
    );
    rock.rotation.set(
      (rand() - .5) * .10,
      yaw + (rand() - .5) * .14,
      (rand() - .5) * .08,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });

  // Wider middle layer; this is what makes the island feel heavy instead of cone-like.
  const middle = [
    [-2.55, -1.26,  .82, 1.02, 1.18, .92, .40],
    [-1.55, -1.40,  .88, 1.14, 1.34, 1.00, 1.05],
    [-.48,  -1.50,  .82, 1.22, 1.46, 1.06, 1.72],
    [.64,  -1.50,  .76, 1.20, 1.46, 1.04, 2.36],
    [1.70, -1.38,  .66, 1.10, 1.30, .98, 2.98],
    [2.52, -1.20,  .48, .94, 1.10, .86, 3.54],

    [-2.40, -1.28, -.70, .98, 1.18, .90, 1.08],
    [-1.36, -1.42, -.80, 1.12, 1.34, .98, 1.72],
    [-.24,  -1.52, -.78, 1.20, 1.48, 1.04, 2.34],
    [.92,  -1.48, -.70, 1.16, 1.42, 1.00, 2.94],
    [1.94, -1.34, -.58, 1.04, 1.24, .94, 3.48],
  ];

  middle.forEach(([x, y, z, sx, sy, sz, yaw], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      index % 4 === 0 ? warm : mid,
    );

    rock.scale.set(sx, sy, sz);
    rock.position.set(x, y, z);
    rock.rotation.set(
      .05 + (rand() - .5) * .10,
      yaw,
      (rand() - .5) * .10,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });

  // Compact lower core: tapered, but still broad — no long stalactite.
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(.86, 1.52, 1.70, 8, 1, false),
    dark,
  );
  core.position.set(-.08, -2.30, .02);
  core.rotation.y = .18;
  core.scale.z = .86;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const lowerA = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1, 0),
    dark,
  );
  lowerA.scale.set(.88, .92, .76);
  lowerA.position.set(-.72, -2.98, .12);
  lowerA.rotation.set(.10, .52, -.12);
  lowerA.castShadow = true;
  lowerA.receiveShadow = true;
  group.add(lowerA);

  const lowerB = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1, 0),
    mid,
  );
  lowerB.scale.set(.72, .80, .68);
  lowerB.position.set(.62, -2.92, -.08);
  lowerB.rotation.set(-.08, 1.10, .10);
  lowerB.castShadow = true;
  lowerB.receiveShadow = true;
  group.add(lowerB);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(.62, .82, 7),
    dark,
  );
  tip.position.set(-.10, -3.55, .00);
  tip.rotation.y = -.16;
  tip.castShadow = true;
  tip.receiveShadow = true;
  group.add(tip);
}

function createStonePath(group, material, rand) {
  // Organic stepping-stone trail from the robot start area toward
  // the generator and then the gate. The route is intentionally curved
  // and irregular so it reads as a path, not a tiled grid.
  const dirtMaterial = new THREE.MeshBasicMaterial({
    color: 0x5f513f,
    transparent: true,
    opacity: .28,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const pathMaterial = material.clone();
  pathMaterial.color.setHex(0xb5aa96);
  pathMaterial.roughness = .96;
  pathMaterial.metalness = 0;

  const stones = [
    [-2.72, .16, .35, .54, .38, -.10],
    [-2.20, .16, .28, .58, .40,  .10],
    [-1.64, .15, .22, .56, .38, -.06],
    [-1.10, .14, .18, .60, .42,  .08],
    [-.52,  .14, .20, .58, .40, -.04],
    [.05,   .14, .22, .60, .42,  .06],
    [.62,   .14, .28, .58, .40, -.06],
    [1.14,  .14, .38, .56, .40,  .08],
    [1.58,  .14, .58, .54, .38, -.12],
    [1.98,  .14, .84, .52, .36, -.22],
    [2.34,  .14, 1.10, .50, .34, -.32],
    [2.64,  .14, 1.38, .48, .32, -.38],
  ];

  const trailShape = new THREE.Shape();
  trailShape.moveTo(-2.92, .28);
  trailShape.bezierCurveTo(-1.85, .08, -.65, .08, .42, .20);
  trailShape.bezierCurveTo(1.42, .32, 2.18, .72, 2.78, 1.48);
  trailShape.lineTo(2.54, 1.66);
  trailShape.bezierCurveTo(2.02, .98, 1.34, .58, .42, .46);
  trailShape.bezierCurveTo(-.66, .32, -1.86, .34, -2.90, .48);
  trailShape.closePath();

  const trail = new THREE.Mesh(
    new THREE.ShapeGeometry(trailShape, 24),
    dirtMaterial,
  );
  trail.rotation.x = -Math.PI / 2;
  trail.position.y = .108;
  trail.renderOrder = 1;
  group.add(trail);

  stones.forEach(([x, y, z, sx, sz, rotation], index) => {
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(
        .50,
        .54,
        .08,
        7 + (index % 3),
      ),
      pathMaterial,
    );

    stone.scale.set(
      sx * (.92 + rand() * .14),
      1,
      sz * (.92 + rand() * .14),
    );

    stone.position.set(
      x + (rand() - .5) * .05,
      y + rand() * .012,
      z + (rand() - .5) * .04,
    );

    stone.rotation.y = rotation + (rand() - .5) * .08;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  });
}


function createRuinClusters(group, materials, rand) {
  const stone = materials.stone.clone();
  stone.color.setHex(0xb5a88f);
  stone.roughness = .96;

  const moss = materials.grass.clone();
  moss.map = null;
  moss.bumpMap = null;
  moss.roughnessMap = null;
  moss.color.setHex(0x668c48);
  moss.roughness = 1;

  const clusters = [
    [-2.82, 1.62, 3, .55],
    [-1.92, 2.03, 2, -.28],
    [2.45, 1.72, 3, .20],
    [2.82, -.98, 2, -.46],
    [-3.06, -.88, 2, .34],
  ];

  clusters.forEach(([x, z, levels, rot], clusterIndex) => {
    for (let i = 0; i < levels; i += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(.46, .34, .42),
        stone,
      );

      block.position.set(
        x + (rand() - .5) * .14,
        .25 + i * .30,
        z + (rand() - .5) * .12,
      );
      block.rotation.set(
        (rand() - .5) * .04,
        rot + (rand() - .5) * .12,
        (rand() - .5) * .05,
      );
      block.scale.set(
        .92 + rand() * .16,
        .92 + rand() * .12,
        .92 + rand() * .16,
      );
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }

    if (clusterIndex !== 3) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(.48, .055, .44),
        moss,
      );
      cap.position.set(x, .27 + (levels - 1) * .30, z);
      cap.rotation.y = rot;
      group.add(cap);
    }
  });

  const brokenWalls = [
    [-2.68, 1.95, 1.02, .42, .22],
    [2.60, 1.88, .92, .46, -.18],
    [-3.22, .86, .76, .40, .08],
  ];

  brokenWalls.forEach(([x, z, width, height, rot]) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, .30),
      stone,
    );
    wall.position.set(x, .20 + height * .5, z);
    wall.rotation.y = rot;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const topMoss = new THREE.Mesh(
      new THREE.BoxGeometry(width * .90, .045, .28),
      moss,
    );
    topMoss.position.set(x, .225 + height, z);
    topMoss.rotation.y = rot;
    group.add(topMoss);
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
  createRuinClusters(island, materials, rand);
  createDoorFoundation(island, materials);
  createGeneratorFoundation(island, materials);

  const flowerPositions = [
    [-2.72, -1.72, .66],
    [-2.30, 1.54, .58],
    [-1.10, -1.92, .56],
    [.38, -1.96, .60],
    [1.92, -1.70, .58],
    [2.62, 1.20, .62],
    [2.15, 1.72, .52],
  ];

  flowerPositions.forEach(([x, z, scale]) => {
    const patch = createFlowerPatch(rand, scale);
    patch.position.set(x, .105, z);
    island.add(patch);
  });

  [
    [-3.12, -2.08, .82],
    [-3.20, 1.98, .82],
    [-1.46, 2.20, .72],
    [2.76, 1.94, .82],
    [3.05, -.20, .78],
    [2.38, -1.92, .74],
  ].forEach(([x, z, scale]) => {
    const lantern = createLantern(baseMaterials, scale);
    lantern.position.set(x, .09, z);
    island.add(lantern);
  });

  return island;
}

export function addCloudscape(scene, baseMaterials) {
  const materials = createEnvironmentMaterials(baseMaterials);

  // Clouds are handled by CloudField.js.
  // This function now keeps only the distant floating islands/waterfalls.
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
