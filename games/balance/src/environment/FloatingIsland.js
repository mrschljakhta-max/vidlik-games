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

      image.data[i] = Math.max(0, Math.min(255, 92 + variation * .70));
      image.data[i + 1] = Math.max(0, Math.min(255, 176 + variation * 1.18));
      image.data[i + 2] = Math.max(0, Math.min(255, 64 + variation * .50));
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  // Very soft broad tinting. No tiles, squares or visible repeating cells.
  const gradients = [
    [130, 125, 120, 'rgba(170,196,92,.16)'],
    [390, 155, 150, 'rgba(61,112,42,.14)'],
    [275, 385, 135, 'rgba(140,175,70,.12)'],
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

function createSmoothGrassMaterial() {
  return new THREE.MeshStandardMaterial({
    map: createGrassTexture(),
    color: 0xc8efaa,
    roughness: .98,
    metalness: 0,
    side: THREE.DoubleSide,
  });
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
  cap.position.y = .125;
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
    [-3.30, 2.08, .58, .18],
    [-2.12, 2.44, .42, -.10],
    [-.88,  2.50, .52, .14],
    [.62,   2.48, .38, -.12],
    [2.04,  2.22, .56, .10],
    [3.18,  1.58, .44, .18],
    [3.52,   .40, .34, -.16],
    [3.36, -1.08, .52, .12],
    [2.54, -2.06, .40, -.10],
    [1.16, -2.44, .54, .08],
    [-.42, -2.48, .36, -.12],
    [-1.84,-2.38, .58, .12],
    [-3.02,-1.90, .42, -.12],
    [-3.50, -.72, .54, .14],
    [-3.50,  .62, .36, -.10],
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

  // Broad lower cluster instead of a single cone-shaped stalactite.
  const lowerCluster = [
    [-.86, -3.10,  .24, .82, .72, .70, .36, dark],
    [ .04, -3.18,  .18, .94, .82, .78, 1.04, dark],
    [ .86, -3.05, -.12, .74, .68, .70, 1.76, mid],
    [-.38, -3.68, -.06, .62, .58, .56, 2.38, dark],
    [ .38, -3.62,  .02, .58, .54, .54, 3.12, dark],
  ];

  lowerCluster.forEach(([x, y, z, sx, sy, sz, yaw, material]) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      material,
    );

    rock.scale.set(sx, sy, sz);
    rock.position.set(x, y, z);
    rock.rotation.set(
      (rand() - .5) * .08,
      yaw + (rand() - .5) * .16,
      (rand() - .5) * .10,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });
}

function createStonePath(group, material, rand) {
  // Organic stepping-stone trail from the robot start area toward
  // the generator and then the gate. The route is intentionally curved
  // and irregular so it reads as a path, not a tiled grid.
  const dirtMaterial = new THREE.MeshBasicMaterial({
    color: 0x6d674f,
    transparent: true,
    opacity: .10,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

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

function createEdgeGrassTufts(group) {
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x6fa34a,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const positions = [
    [-3.28, 1.72, .16], [-2.74, 2.08, -.18], [-2.08, 2.24, .10],
    [-1.28, 2.28, -.12], [-.42, 2.34, .18], [.52, 2.30, -.16],
    [1.44, 2.20, .12], [2.30, 1.96, -.14], [3.00, 1.52, .18],
    [3.26, .78, -.12], [3.26, -.16, .10], [3.06, -1.04, -.16],
    [2.50, -1.82, .16], [1.72, -2.16, -.12], [.76, -2.28, .14],
    [-.26, -2.30, -.18], [-1.28, -2.28, .12], [-2.18, -2.12, -.10],
    [-2.92, -1.66, .14], [-3.32, -.84, -.12], [-3.38, .10, .10],
    [-3.38, .92, -.14],
  ];

  positions.forEach(([x, z, rot], index) => {
    const tuft = new THREE.Group();

    for (let i = 0; i < 4; i += 1) {
      const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(.12, .34 + (i % 2) * .08),
        bladeMaterial,
      );
      blade.position.y = .17;
      blade.rotation.y = (i / 4) * Math.PI + rot;
      blade.rotation.z = (i - 1.5) * .08;
      tuft.add(blade);
    }

    tuft.position.set(x, .13, z);
    tuft.rotation.y = rot + (index % 3) * .18;
    group.add(tuft);
  });
}


function addSurfaceZones(group) {
  const generatorZone = new THREE.Mesh(
    new THREE.RingGeometry(1.10, 1.72, 64),
    new THREE.MeshBasicMaterial({
      color: 0x736a55,
      transparent: true,
      opacity: .20,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      side: THREE.DoubleSide,
    }),
  );
  generatorZone.rotation.x = -Math.PI / 2;
  generatorZone.position.set(1.30, .133, .50);
  generatorZone.renderOrder = 2;
  group.add(generatorZone);

  const gateApron = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 1.18),
    new THREE.MeshBasicMaterial({
      color: 0x948a76,
      transparent: true,
      opacity: .24,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      side: THREE.DoubleSide,
    }),
  );
  gateApron.rotation.x = -Math.PI / 2;
  gateApron.position.set(3.18, .134, -.68);
  gateApron.rotation.z = -.04;
  gateApron.renderOrder = 2;
  group.add(gateApron);

  const wornPatch = new THREE.Mesh(
    new THREE.CircleGeometry(.78, 40),
    new THREE.MeshBasicMaterial({
      color: 0x7b725f,
      transparent: true,
      opacity: .14,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      side: THREE.DoubleSide,
    }),
  );
  wornPatch.rotation.x = -Math.PI / 2;
  wornPatch.position.set(-2.05, .132, .36);
  wornPatch.scale.set(1.45, .72, 1);
  wornPatch.renderOrder = 2;
  group.add(wornPatch);
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


function createShrubCluster(rand, scale = 1, hue = 'green') {
  const group = new THREE.Group();

  const colors = hue === 'light'
    ? [0x6fa14a, 0x7fb554, 0x5f913f]
    : [0x3f7434, 0x4f8539, 0x5e9542];

  const materials = colors.map((color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
  }));

  const lobes = 9;

  for (let i = 0; i < lobes; i += 1) {
    const radius = (.11 + rand() * .055) * scale;
    const leafMass = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      materials[i % materials.length],
    );

    const angle = (i / lobes) * Math.PI * 2 + rand() * .28;
    const ring = i === 0 ? 0 : (.12 + rand() * .12) * scale;

    leafMass.position.set(
      Math.cos(angle) * ring,
      (.12 + rand() * .12) * scale,
      Math.sin(angle) * ring,
    );

    leafMass.scale.set(
      1.10 + rand() * .26,
      .52 + rand() * .18,
      .92 + rand() * .24,
    );

    leafMass.rotation.set(
      rand() * .18,
      rand() * Math.PI,
      (rand() - .5) * .18,
    );

    leafMass.castShadow = true;
    leafMass.receiveShadow = true;
    group.add(leafMass);
  }

  return group;
}

function createGrassCluster(rand, scale = 1) {
  const group = new THREE.Group();

  const greens = [
    new THREE.MeshStandardMaterial({ color: 0x6ca34a, roughness: 1, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x87b85b, roughness: 1, side: THREE.DoubleSide }),
  ];

  for (let i = 0; i < 7; i += 1) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(.035 * scale, (.28 + rand() * .18) * scale, 5),
      greens[i % greens.length],
    );

    blade.position.set(
      (rand() - .5) * .24 * scale,
      (.14 + rand() * .08) * scale,
      (rand() - .5) * .24 * scale,
    );

    blade.rotation.z = (rand() - .5) * .22;
    blade.rotation.x = (rand() - .5) * .12;
    blade.castShadow = true;
    group.add(blade);
  }

  return group;
}

function addHeroStonePath(group, materials, rand) {
  const stoneMaterial = materials.stone.clone();
  stoneMaterial.color.setHex(0xb9ad94);
  stoneMaterial.roughness = .98;
  stoneMaterial.metalness = 0;

  const path = [
    // Core / robot side -> generator.
    [-2.72, .21, .34, .34, -.10],
    [-2.24, .21, .29, .38,  .08],
    [-1.74, .21, .25, .36, -.05],
    [-1.24, .21, .24, .39,  .09],
    [-.72,  .21, .28, .37, -.06],
    [-.22,  .21, .42, .38,  .06],
    [.16,   .21, .72, .35,  .12],

    // Around the generator toward the gate.
    [.52,   .21, 1.12, .33,  .18],
    [1.02,  .21, 1.42, .34,  .08],
    [1.56,  .21, 1.34, .35, -.10],
    [2.02,  .21, 1.02, .34, -.22],
    [2.38,  .21, .58, .33, -.34],
    [2.68,  .21, .12, .32, -.40],
    [2.92,  .21,-.36, .31, -.46],
    [3.08,  .21,-.78, .30, -.48],
  ];

  path.forEach(([x, y, z, scale, yaw], index) => {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      stoneMaterial,
    );

    stone.scale.set(
      scale * (1.18 + (index % 3) * .06),
      .055 + (index % 2) * .012,
      scale * (.76 + (index % 2) * .09),
    );

    stone.position.set(
      x + (rand() - .5) * .035,
      y,
      z + (rand() - .5) * .030,
    );

    stone.rotation.set(
      (rand() - .5) * .03,
      yaw + (rand() - .5) * .09,
      (rand() - .5) * .025,
    );

    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  });
}

function addLushBorder(group, materials, rand) {
  // Four intentional vegetation masses instead of evenly scattered dots.
  const clusters = [
    { center: [-2.92, 1.72], points: [
      [-.18, -.10, .54], [.18, .10, .46], [.02, .30, .42], [.30, -.16, .38],
    ]},
    { center: [-2.78, -1.56], points: [
      [-.18, .08, .50], [.14, -.10, .44], [.26, .18, .38],
    ]},
    { center: [.32, 2.16], points: [
      [-.28, .04, .44], [.06, .12, .50], [.34, -.04, .42],
    ]},
    { center: [2.62, -1.54], points: [
      [-.24, .06, .46], [.10, -.06, .52], [.30, .18, .40],
    ]},
  ];

  clusters.forEach((cluster, clusterIndex) => {
    cluster.points.forEach(([dx, dz, scale], index) => {
      const bush = createShrubCluster(
        rand,
        scale,
        (clusterIndex + index) % 3 === 0 ? 'light' : 'green',
      );
      bush.position.set(
        cluster.center[0] + dx,
        .14,
        cluster.center[1] + dz,
      );
      bush.rotation.y = rand() * Math.PI * 2;
      group.add(bush);

      if (index === 0 || index === 2) {
        const grass = createGrassCluster(rand, scale * .78);
        grass.position.set(
          cluster.center[0] + dx + (rand() - .5) * .18,
          .13,
          cluster.center[1] + dz + (rand() - .5) * .18,
        );
        group.add(grass);
      }
    });
  });

  const edgeGrass = [
    [-1.70, 2.18, .48],
    [1.58, 2.02, .46],
    [3.02, .74, .44],
    [1.36, -2.02, .48],
    [-.64, -2.16, .46],
    [-3.18, -.40, .44],
  ];

  edgeGrass.forEach(([x, z, scale]) => {
    const grass = createGrassCluster(rand, scale);
    grass.position.set(x, .13, z);
    grass.rotation.y = rand() * Math.PI * 2;
    group.add(grass);
  });
}

function addHangingGreenery(group, rand) {
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x4f8f3b, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x6da34b, roughness: 1 }),
  ];

  const anchors = [
    [-3.42, 1.62, .92], [-3.54, .80, .72], [-3.50,-.86,.84],
    [-2.86,-1.92,.96], [-1.82,-2.25,.72], [-.58,-2.36,.88],
    [.72,-2.34,.78], [1.88,-2.12,.92], [2.82,-1.66,.82],
    [3.30,-.84,.70], [3.36,.72,.76], [2.88,1.62,.88],
  ];

  anchors.forEach(([x, z, length], index) => {
    const vine = new THREE.Group();
    const pieces = 5 + (index % 3);

    for (let i = 0; i < pieces; i += 1) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(.08 + (i % 2) * .012, 7, 5),
        leafMaterials[i % leafMaterials.length],
      );

      leaf.scale.set(1.0, .42, .72);
      leaf.position.set(
        Math.sin(i * 1.35) * .075,
        -i * (length / pieces),
        Math.cos(i * 1.1) * .045,
      );
      leaf.rotation.z = (i % 2 ? .55 : -.55);
      leaf.castShadow = true;
      vine.add(leaf);
    }

    vine.position.set(x, .05, z);
    vine.rotation.y = rand() * Math.PI * 2;
    group.add(vine);
  });
}

function addHeroRockAccents(group, materials, rand) {
  const rockMaterial = materials.rock.clone();
  rockMaterial.color.setHex(0x8f8576);
  rockMaterial.roughness = .98;

  const rocks = [
    [-3.02, .18, 1.10, .36], [-2.56,.18,-1.55,.30],
    [-1.65,.18,1.90,.28], [2.52,.18,1.35,.34],
    [2.70,.18,-1.42,.31], [1.92,.18,-1.76,.28],
  ];

  rocks.forEach(([x, y, z, scale], index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      rockMaterial,
    );

    rock.scale.set(
      scale * 1.15,
      scale * .68,
      scale,
    );
    rock.position.set(x, y, z);
    rock.rotation.set(
      rand() * .12,
      index * .72 + rand() * .30,
      (rand() - .5) * .12,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });
}

function addGateGreenery(group, rand) {
  const groundPlacements = [
    [2.58, -.92, .52],
    [2.72, -.48, .46],
    [2.52, -.10, .42],
    [2.94, -1.62, .48],
  ];

  groundPlacements.forEach(([x, z, scale]) => {
    const bush = createShrubCluster(rand, scale, 'green');
    bush.position.set(x, .14, z);
    group.add(bush);
  });

  // Green crown and ivy around the door frame.
  const crownPlacements = [
    [2.74, 2.76, -1.16, .38],
    [3.16, 2.90, -1.16, .42],
    [3.72, 2.88, -1.16, .42],
    [4.10, 2.72, -1.16, .36],
    [2.58, 2.12, -1.12, .28],
    [4.26, 2.08, -1.12, .28],
  ];

  crownPlacements.forEach(([x, y, z, scale], index) => {
    const bush = createShrubCluster(
      rand,
      scale,
      index % 3 === 0 ? 'light' : 'green',
    );
    bush.position.set(x, y, z);
    group.add(bush);
  });

  const ivyMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c963f,
    roughness: 1,
  });

  [
    [2.66, 2.62, -1.05, .90],
    [4.18, 2.64, -1.05, .78],
    [3.98, 2.76, -1.05, .56],
  ].forEach(([x, y, z, length], vineIndex) => {
    const vine = new THREE.Group();
    const pieces = 7;

    for (let i = 0; i < pieces; i += 1) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(.075, 7, 5),
        ivyMaterial,
      );

      leaf.scale.set(1.0, .42, .68);
      leaf.position.set(
        Math.sin(i * 1.25 + vineIndex) * .07,
        -i * (length / pieces),
        0,
      );
      leaf.rotation.z = i % 2 ? .55 : -.55;
      vine.add(leaf);
    }

    vine.position.set(x, y, z);
    group.add(vine);
  });
}

export function createFloatingIsland(baseMaterials) {
  const materials = createEnvironmentMaterials(baseMaterials);
  const island = new THREE.Group();
  const rand = seededRandom(29);

  // Layered island instead of one textured tile slab.
  island.add(createIslandBody(materials));
  island.add(createGrassCap(materials));

  createLocalCliffMass(island, materials, rand);

  createSoftEdgeStones(island, materials, rand);
  createStonePath(island, materials.path, rand);
  addSurfaceZones(island);
  addHeroStonePath(island, materials, rand);
  addHeroRockAccents(island, materials, rand);
  addLushBorder(island, materials, rand);
  addHangingGreenery(island, rand);
  addGateGreenery(island, rand);
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

export function addCloudscape() {
  // Background floating rocks were intentionally removed.
  // CloudField.js now owns the sky so nothing hangs above the play area.
}
