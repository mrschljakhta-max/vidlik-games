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
    material.roughness = Math.max(material.roughness ?? .8, .86);
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

  replacement.map = null;
  replacement.bumpMap = null;
  replacement.roughnessMap = null;
  replacement.color.setHex(dark ? 0x6b6258 : 0x9b8d79);
  replacement.roughness = .98;
  replacement.metalness = 0;
  replacement.needsUpdate = true;

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
        material.color.setHex(0x769b58);
      } else if (mode === 'light') {
        material.color.setHex(0xd8d2b3);
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

function addSurfaceRocks(target, rocks, materials) {
  const placements = [
    [-3.00, .02, 1.58, .36, .3, false],
    [-2.48, .02, -1.88, .30, 1.4, true],
    [2.38, .02, 1.62, .32, 2.8, true],
    [2.68, .02, -1.72, .30, 1.9, false],
  ];

  placements.forEach(([x, y, z, size, yaw, dark], index) => {
    place(target, rocks[index % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        (index % 3 - 1) * .04,
        yaw,
        (index % 2 ? 1 : -1) * .03,
      ],
      scale: [1.08, .68, .94],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });
}

function addBushes(target, common, flowers) {
  const greenPlacements = [
    [-2.96, .10, 1.08, .34, .4],
    [-2.16, .10, 1.82, .30, 1.3],
    [1.98, .10, 1.66, .34, 2.8],
    [2.40, .10, -1.54, .32, .2],
  ];

  greenPlacements.forEach(([x, y, z, size, yaw]) => {
    place(target, common, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      transform: (object) => recolorFoliage(object, 'green'),
    });
  });

  place(target, flowers, {
    position: [.88, .10, -1.82],
    size: .16,
    rotation: [0, .8, 0],
    transform: (object) => recolorFoliage(object, 'light'),
  });
}

function addGrass(target, tall, wispy) {
  const placements = [
    [-3.04, .10, 1.78, .12, .2, 0],
    [-2.18, .10, -1.78, .11, 1.8, 1],
    [1.14, .10, 1.82, .11, .9, 1],
    [2.18, .10, -1.70, .11, 2.1, 0],
    [2.90, .10, .52, .10, 1.6, 1],
  ];

  placements.forEach(([x, y, z, size, yaw, variant]) => {
    place(target, variant ? wispy : tall, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      scale: [.90, 1.04, .90],
      transform: (object) => recolorFoliage(object, 'green'),
    });
  });
}

function addAccentPlants(target, plant) {
  const placements = [
    [-2.62, .10, 1.68, .18, .5],
    [2.06, .10, 1.24, .18, 2.5],
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
