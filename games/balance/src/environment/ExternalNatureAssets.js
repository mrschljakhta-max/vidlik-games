import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const RAW_ROOT =
  'https://raw.githubusercontent.com/agentkaerf/FreeModels/main/' +
  'Stylized%20Nature%20MegaKit%5BStandard%5D/glTF/';

const assetPromises = new Map();

function loadNatureModel(name) {
  if (!assetPromises.has(name)) {
    assetPromises.set(
      name,
      new Promise((resolve, reject) => {
        loader.load(
          `${RAW_ROOT}${name}.gltf`,
          (gltf) => resolve(normalizeModel(gltf.scene, name)),
          undefined,
          reject,
        );
      }),
    );
  }

  return assetPromises.get(name);
}

function tuneMaterial(source) {
  const material = source.clone();

  if ('metalness' in material) material.metalness = 0;

  if ('roughness' in material) {
    material.roughness = Math.max(material.roughness ?? .8, .84);
  }

  if (material.transparent || material.alphaMap) {
    material.alphaTest = Math.max(material.alphaTest ?? 0, .18);
    material.depthWrite = true;
  }

  material.side = THREE.DoubleSide;
  material.needsUpdate = true;

  return material;
}

function normalizeModel(scene, name) {
  const prepared = scene.clone(true);

  prepared.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) =>
        tuneMaterial(material),
      );
    } else if (child.material) {
      child.material = tuneMaterial(child.material);
    }

    child.geometry?.computeBoundingSphere?.();
  });

  const bounds = new THREE.Box3().setFromObject(prepared);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  bounds.getSize(size);
  bounds.getCenter(center);

  const maxDimension = Math.max(size.x, size.y, size.z, .001);

  const centered = new THREE.Group();

  prepared.position.set(
    -center.x,
    -bounds.min.y,
    -center.z,
  );

  centered.add(prepared);
  centered.scale.setScalar(1 / maxDimension);
  centered.name = `NatureAsset_${name}`;

  return centered;
}

function cloneAsset(source) {
  return source.clone(true);
}

function recolorRock(root, materials, dark = false) {
  const replacement = (
    dark ? materials.rockDark : materials.rock
  ).clone();

  replacement.color.setHex(dark ? 0x6f665b : 0x9a8d79);
  replacement.roughness = .97;
  replacement.metalness = 0;
  replacement.bumpScale = dark ? .11 : .085;

  root.traverse((child) => {
    if (!child.isMesh) return;

    child.material = replacement.clone();
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return root;
}

function recolorFoliage(root, mode = 'green') {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const material = child.material.clone();

    if (material.color) {
      if (mode === 'green') {
        material.color.setHex(0x7ea85d);
      } else if (mode === 'light') {
        material.color.setHex(0xdcd4b0);
      }
    }

    material.roughness = Math.max(material.roughness ?? .8, .90);
    material.metalness = 0;
    material.needsUpdate = true;

    child.material = material;
  });

  return root;
}

function place(
  target,
  source,
  {
    position,
    size,
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    transform = null,
  },
) {
  let object = cloneAsset(source);

  if (transform) {
    object = transform(object);
  }

  object.position.set(...position);
  object.rotation.set(...rotation);

  object.scale.multiply(
    new THREE.Vector3(
      size * scale[0],
      size * scale[1],
      size * scale[2],
    ),
  );

  target.add(object);
  return object;
}

function addCliffSilhouette(target, rocks, materials) {
  const rim = [
    [-3.48, -.50, 1.86, 1.42, .10, -.12, false],
    [-2.62, -.54, 2.23, 1.52, .55, .10, false],
    [-1.45, -.54, 2.36, 1.64, 1.15, -.08, true],
    [-.16, -.54, 2.42, 1.48, 1.88, .10, false],
    [1.10, -.52, 2.35, 1.58, 2.55, -.08, false],
    [2.38, -.50, 2.06, 1.50, 3.15, .12, true],
    [3.34, -.48, 1.35, 1.42, 3.72, -.10, false],
    [3.48, -.50, .25, 1.50, 4.20, .10, true],
    [3.36, -.48, -.94, 1.42, 4.72, -.12, false],
    [2.86, -.52, -1.92, 1.54, 5.20, .10, false],
    [1.72, -.54, -2.34, 1.60, 5.74, -.10, true],
    [.36, -.52, -2.42, 1.52, 6.20, .12, false],
    [-1.02, -.54, -2.38, 1.64, .44, -.10, false],
    [-2.28, -.52, -2.20, 1.48, 1.00, .10, true],
    [-3.20, -.48, -1.62, 1.42, 1.62, -.10, false],
    [-3.52, -.50, -.48, 1.50, 2.12, .10, true],
  ];

  rim.forEach(([x, y, z, size, yaw, roll, dark], index) => {
    place(target, rocks[index % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        Math.PI + (index % 2 ? .08 : -.08),
        yaw,
        roll,
      ],
      scale: [1.02, 1.08, .96],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });

  const underside = [
    [-2.75, -1.18, 1.22, 2.02, .45, true],
    [-1.24, -1.43, 1.02, 2.25, 1.22, false],
    [.46, -1.48, 1.02, 2.32, 2.08, true],
    [2.14, -1.25, .92, 2.10, 2.82, false],
    [-2.50, -1.20, -.82, 2.04, 1.64, false],
    [-.82, -1.48, -.88, 2.36, 2.42, true],
    [.96, -1.43, -.82, 2.28, .82, false],
    [2.58, -1.18, -.78, 2.00, 2.30, true],
  ];

  underside.forEach(([x, y, z, size, yaw, dark], index) => {
    place(target, rocks[(index + 1) % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        Math.PI + (index % 2 ? .15 : -.12),
        yaw,
        (index % 3 - 1) * .10,
      ],
      scale: [1.00, 1.22, .94],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });
}

function addSurfaceRocks(target, rocks, materials) {
  const placements = [
    [-3.00, .02, 1.58, .46, .3, false],
    [-2.48, .02, -1.88, .38, 1.4, true],
    [2.38, .02, 1.62, .40, 2.8, true],
    [2.68, .02, -1.72, .38, 1.9, false],
  ];

  placements.forEach(([x, y, z, size, yaw, dark], index) => {
    place(target, rocks[index % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        (index % 3 - 1) * .05,
        yaw,
        (index % 2 ? 1 : -1) * .04,
      ],
      scale: [1.10, .72, .96],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });
}

function addBushes(target, common, flowers) {
  const greenPlacements = [
    [-3.00, .10, 1.12, .40, .4],
    [-2.20, .10, 1.86, .36, 1.3],
    [1.96, .10, 1.70, .40, 2.8],
    [2.44, .10, -1.58, .38, .2],
  ];

  greenPlacements.forEach(([x, y, z, size, yaw]) => {
    place(target, common, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      transform: (object) => recolorFoliage(object, 'green'),
    });
  });

  // Single subtle warm accent only.
  place(target, flowers, {
    position: [.88, .10, -1.82],
    size: .20,
    rotation: [0, .8, 0],
    transform: (object) => recolorFoliage(object, 'light'),
  });
}

function addGrass(target, tall, wispy) {
  const placements = [
    [-3.08, .10, 1.82, .15, .2, 0],
    [-2.22, .10, -1.82, .13, 1.8, 1],
    [1.16, .10, 1.86, .14, .9, 1],
    [2.22, .10, -1.74, .14, 2.1, 0],
    [2.94, .10, .56, .12, 1.6, 1],
  ];

  placements.forEach(([x, y, z, size, yaw, variant]) => {
    place(target, variant ? wispy : tall, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      scale: [.90, 1.05, .90],
      transform: (object) => recolorFoliage(object, 'green'),
    });
  });
}

function addAccentPlants(target, plant) {
  const placements = [
    [-2.66, .10, 1.72, .23, .5],
    [2.10, .10, 1.28, .22, 2.5],
  ];

  placements.forEach(([x, y, z, size, yaw]) => {
    place(target, plant, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      transform: (object) => recolorFoliage(object, 'green'),
    });
  });
}

function addCredits(root) {
  root.userData.externalAssetCredits = [
    {
      source: 'Quaternius',
      pack: 'Stylized Nature MegaKit',
      license: 'CC0',
      mirror: 'agentkaerf/FreeModels',
      assets: [
        'Rock_Medium_1',
        'Rock_Medium_2',
        'Rock_Medium_3',
        'Bush_Common',
        'Bush_Common_Flowers',
        'Grass_Common_Tall',
        'Grass_Wispy_Short',
        'Plant_1_Big',
      ],
    },
  ];
}

export async function addExternalNatureAssets(scene, materials) {
  const root = new THREE.Group();
  root.name = 'ExternalNatureAssets';
  addCredits(root);
  scene.add(root);

  const names = [
    'Rock_Medium_1',
    'Rock_Medium_2',
    'Rock_Medium_3',
    'Bush_Common',
    'Bush_Common_Flowers',
    'Grass_Common_Tall',
    'Grass_Wispy_Short',
    'Plant_1_Big',
  ];

  const results = await Promise.allSettled(
    names.map((name) => loadNatureModel(name)),
  );

  const loaded = new Map();

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      loaded.set(names[index], result.value);
      return;
    }

    console.warn(
      `VIDLIK: external nature asset failed: ${names[index]}`,
      result.reason,
    );
  });

  const rocks = [
    loaded.get('Rock_Medium_1'),
    loaded.get('Rock_Medium_2'),
    loaded.get('Rock_Medium_3'),
  ].filter(Boolean);

  if (rocks.length) {
    // The main cliff mass is now local/procedural in FloatingIsland.js
    // so it cannot disappear when remote GLTF assets fail.
    addSurfaceRocks(root, rocks, materials);
  }

  const bush = loaded.get('Bush_Common');
  const bushFlowers = loaded.get('Bush_Common_Flowers');

  if (bush && bushFlowers) {
    addBushes(root, bush, bushFlowers);
  }

  const grassTall = loaded.get('Grass_Common_Tall');
  const grassWispy = loaded.get('Grass_Wispy_Short');

  if (grassTall && grassWispy) {
    addGrass(root, grassTall, grassWispy);
  }

  const plant = loaded.get('Plant_1_Big');

  if (plant) {
    addAccentPlants(root, plant);
  }

  return root;
}
