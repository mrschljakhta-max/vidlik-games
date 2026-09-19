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
    material.roughness = Math.max(material.roughness ?? .8, .82);
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

  replacement.color.setHex(dark ? 0x746b60 : 0x9f9484);
  replacement.roughness = .97;
  replacement.metalness = 0;
  replacement.bumpScale = dark ? .12 : .09;

  root.traverse((child) => {
    if (!child.isMesh) return;

    child.material = replacement.clone();
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return root;
}

function softenPlant(root, type = 'green') {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const material = child.material.clone();

    if (material.color) {
      if (type === 'green') {
        material.color.multiply(new THREE.Color(0x9eb88a));
      } else if (type === 'flowers') {
        material.color.multiply(new THREE.Color(0xd8d2ad));
      }
    }

    material.roughness = Math.max(material.roughness ?? .8, .88);
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
    [-3.48, -.44, 1.86, 1.48, .10, -.12, false],
    [-2.62, -.50, 2.23, 1.60, .55, .10, false],
    [-1.45, -.48, 2.36, 1.72, 1.15, -.08, true],
    [-.16, -.50, 2.42, 1.56, 1.88, .10, false],
    [1.10, -.48, 2.35, 1.66, 2.55, -.08, false],
    [2.38, -.46, 2.06, 1.58, 3.15, .12, true],
    [3.34, -.44, 1.35, 1.50, 3.72, -.10, false],

    [3.48, -.46, .25, 1.58, 4.20, .10, true],
    [3.36, -.44, -.94, 1.50, 4.72, -.12, false],
    [2.86, -.48, -1.92, 1.62, 5.20, .10, false],
    [1.72, -.50, -2.34, 1.68, 5.74, -.10, true],
    [.36, -.48, -2.42, 1.60, 6.20, .12, false],
    [-1.02, -.50, -2.38, 1.72, .44, -.10, false],
    [-2.28, -.48, -2.20, 1.56, 1.00, .10, true],
    [-3.20, -.44, -1.62, 1.50, 1.62, -.10, false],
    [-3.52, -.46, -.48, 1.58, 2.12, .10, true],
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
      scale: [1.04, 1.10, .96],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });

  const underside = [
    [-2.75, -1.15, 1.22, 2.10, .45, true],
    [-1.24, -1.42, 1.02, 2.36, 1.22, false],
    [.46, -1.48, 1.02, 2.44, 2.08, true],
    [2.14, -1.24, .92, 2.20, 2.82, false],
    [-2.50, -1.18, -.82, 2.12, 1.64, false],
    [-.82, -1.48, -.88, 2.48, 2.42, true],
    [.96, -1.42, -.82, 2.38, .82, false],
    [2.58, -1.16, -.78, 2.08, 2.30, true],
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
      scale: [1.02, 1.26, .94],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });
}

function addSurfaceRocks(target, rocks, materials) {
  const placements = [
    [-3.00, .02, 1.58, .52, .3, false],
    [-2.48, .02, -1.88, .42, 1.4, true],
    [-1.12, .02, 2.00, .40, 2.1, false],
    [.72, .02, 2.04, .36, .8, false],
    [2.38, .02, 1.62, .46, 2.8, true],
    [2.68, .02, -1.72, .42, 1.9, false],
    [-3.02, .02, -.84, .34, 2.5, false],
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
      scale: [1.12, .76, 1],
      transform: (object) => recolorRock(object, materials, dark),
    });
  });
}

function addBushes(target, common, flowers) {
  const greenPlacements = [
    [-3.05, .03, 1.24, .58, .4],
    [-2.38, .03, 1.94, .50, 1.3],
    [-1.20, .03, -1.94, .50, 2.1],
    [1.88, .03, 1.82, .56, 2.8],
    [2.52, .03, -1.70, .52, .2],
  ];

  greenPlacements.forEach(([x, y, z, size, yaw]) => {
    place(target, common, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      transform: (object) => softenPlant(object, 'green'),
    });
  });

  place(target, flowers, {
    position: [.86, .03, -1.88],
    size: .36,
    rotation: [0, .8, 0],
    transform: (object) => softenPlant(object, 'flowers'),
  });
}

function addGrass(target, tall, wispy) {
  const placements = [
    [-3.18, .03, 1.88, .22, .2, 0],
    [-2.32, .03, -1.92, .18, 1.8, 1],
    [-.42, .03, 2.00, .20, 1.4, 0],
    [1.18, .03, 1.94, .18, .9, 1],
    [2.28, .03, -1.82, .20, 2.1, 0],
    [3.02, .03, .62, .16, 1.6, 1],
    [-3.12, .03, -.58, .16, .8, 0],
    [.72, .03, 1.48, .15, 2.4, 1],
  ];

  placements.forEach(([x, y, z, size, yaw, variant]) => {
    place(target, variant ? wispy : tall, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      scale: [.90, 1.08, .90],
      transform: (object) => softenPlant(object, 'green'),
    });
  });
}

function addAccentPlants(target, plant, flowers) {
  const placements = [
    [-2.78, .03, 1.82, .34, .5, false],
    [-1.92, .03, -1.72, .30, 2.0, true],
    [.15, .03, 1.88, .34, 1.2, false],
    [2.20, .03, 1.42, .31, 2.5, true],
  ];

  placements.forEach(([x, y, z, size, yaw, useFlowers]) => {
    place(target, useFlowers ? flowers : plant, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      transform: (object) =>
        softenPlant(object, useFlowers ? 'flowers' : 'green'),
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
        'Flower_3_Group',
      ],
    },
  ];
}

export async function addExternalNatureAssets(
  scene,
  materials,
) {
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
    'Flower_3_Group',
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
    addCliffSilhouette(root, rocks, materials);
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
  const flowerGroup = loaded.get('Flower_3_Group');

  if (plant && flowerGroup) {
    addAccentPlants(root, plant, flowerGroup);
  }

  return root;
}
