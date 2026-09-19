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

function tuneMaterial(source) {
  const material = source.clone();

  if ('metalness' in material) {
    material.metalness = 0;
  }

  if ('roughness' in material) {
    material.roughness = Math.max(material.roughness ?? .8, .78);
  }

  if (material.transparent || material.alphaMap) {
    material.alphaTest = Math.max(material.alphaTest ?? 0, .18);
    material.depthWrite = true;
  }

  material.side = THREE.DoubleSide;
  material.needsUpdate = true;

  return material;
}

function cloneAsset(source) {
  return source.clone(true);
}

function place(
  target,
  source,
  {
    position,
    size,
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
  },
) {
  const object = cloneAsset(source);

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

function addCliffSilhouette(target, rocks) {
  const placements = [
    [-3.45, -.18, 2.28, 2.05, .18, -.15],
    [-2.18, -.20, 2.46, 1.80, -.12, .10],
    [-.70, -.18, 2.48, 2.20, .08, -.12],
    [.92, -.18, 2.44, 1.85, -.18, .12],
    [2.25, -.20, 2.33, 2.10, .14, -.10],
    [3.35, -.16, 1.92, 1.75, -.25, .12],

    [-3.44, -.20, -2.25, 1.90, -.12, -.10],
    [-2.08, -.17, -2.42, 2.15, .20, .12],
    [-.55, -.18, -2.46, 1.82, -.12, -.10],
    [1.02, -.16, -2.44, 2.22, .16, .12],
    [2.38, -.19, -2.29, 1.90, -.18, -.10],
    [3.38, -.15, -1.88, 1.72, .22, .10],

    [-3.72, -.20, 1.02, 1.75, -.10, -.16],
    [-3.76, -.18, -.58, 2.05, .18, .14],
    [3.78, -.19, .86, 1.92, -.16, -.12],
    [3.76, -.18, -.58, 2.12, .12, .14],
  ];

  placements.forEach(
    ([x, y, z, size, yaw, roll], index) => {
      const rock = rocks[index % rocks.length];

      place(target, rock, {
        position: [x, y, z],
        size,
        rotation: [
          Math.PI + (index % 2 ? .10 : -.08),
          yaw + index * .23,
          roll,
        ],
        scale: [
          .88 + (index % 3) * .08,
          1.12 + (index % 4) * .07,
          .90 + (index % 2) * .12,
        ],
      });
    },
  );

  const underside = [
    [-2.60, -.95, 1.42, 2.35, .4],
    [-1.05, -1.18, .95, 2.60, 1.1],
    [.65, -1.20, 1.08, 2.45, 2.0],
    [2.32, -.92, .94, 2.28, 2.7],
    [-2.45, -1.02, -.92, 2.22, 1.6],
    [-.72, -1.30, -.82, 2.72, 2.4],
    [1.10, -1.18, -.78, 2.50, .8],
    [2.65, -.92, -.92, 2.20, 2.2],
  ];

  underside.forEach(([x, y, z, size, yaw], index) => {
    place(target, rocks[(index + 1) % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        Math.PI + (index % 2 ? .18 : -.12),
        yaw,
        (index % 3 - 1) * .12,
      ],
      scale: [1.0, 1.26, .92],
    });
  });
}

function addSurfaceRocks(target, rocks) {
  const placements = [
    [-3.22, .05, 1.70, .62, .3],
    [-2.55, .04, -1.92, .48, 1.4],
    [-1.10, .03, 2.11, .46, 2.1],
    [.62, .04, 2.13, .42, .8],
    [2.56, .04, 1.75, .54, 2.8],
    [2.84, .03, -1.86, .48, 1.9],
    [-3.16, .03, -.96, .40, 2.5],
  ];

  placements.forEach(([x, y, z, size, yaw], index) => {
    place(target, rocks[index % rocks.length], {
      position: [x, y, z],
      size,
      rotation: [
        (index % 3 - 1) * .07,
        yaw,
        (index % 2 ? 1 : -1) * .06,
      ],
      scale: [1.15, .82, 1.0],
    });
  });
}

function addBushes(target, common, flowers) {
  const placements = [
    [-3.30, .04, 1.28, .82, .4, false],
    [-2.52, .04, 2.08, .68, 1.3, true],
    [-1.15, .04, -2.10, .72, 2.1, false],
    [.22, .04, 2.06, .62, .8, true],
    [1.94, .04, 1.95, .78, 2.8, false],
    [2.72, .04, 1.18, .68, 1.6, true],
    [2.62, .04, -1.92, .74, .2, false],
    [-3.24, .04, -1.72, .68, 2.4, true],
  ];

  placements.forEach(
    ([x, y, z, size, yaw, useFlowers], index) => {
      place(
        target,
        useFlowers ? flowers : common,
        {
          position: [x, y, z],
          size,
          rotation: [0, yaw, 0],
          scale: [
            .95 + (index % 3) * .08,
            .92 + (index % 2) * .10,
            .95,
          ],
        },
      );
    },
  );
}

function addGrass(target, tall, wispy) {
  const placements = [
    [-3.42, .04, 2.08, .34, .2, 0],
    [-2.92, .04, 1.66, .28, 1.0, 1],
    [-2.44, .04, -2.06, .32, 1.8, 0],
    [-1.72, .04, 2.15, .30, 2.5, 1],
    [-1.02, .04, -2.15, .28, .6, 0],
    [-.35, .04, 2.18, .31, 1.6, 1],
    [.54, .04, -2.12, .28, 2.2, 0],
    [1.34, .04, 2.12, .32, .9, 1],
    [2.15, .04, -2.02, .30, 1.3, 0],
    [2.74, .04, 1.82, .29, 2.8, 1],
    [3.26, .04, .82, .28, 2.1, 0],
    [-3.38, .04, -.62, .28, 1.1, 1],
    [3.18, .04, -1.64, .30, .3, 1],
    [.92, .04, 1.84, .24, 2.5, 0],
    [-1.86, .04, 1.42, .25, .4, 1],
  ];

  placements.forEach(([x, y, z, size, yaw, variant]) => {
    place(target, variant ? wispy : tall, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
      scale: [.86, 1.10, .86],
    });
  });
}

function addAccentPlants(target, plant, flowers) {
  [
    [-3.05, .04, 1.95, .48, .5, 0],
    [-2.15, .04, -1.84, .42, 2.0, 1],
    [.08, .04, 2.02, .46, 1.2, 0],
    [2.38, .04, 1.58, .44, 2.5, 1],
    [2.54, .04, -1.68, .42, .8, 0],
  ].forEach(([x, y, z, size, yaw, useFlowers]) => {
    place(target, useFlowers ? flowers : plant, {
      position: [x, y, z],
      size,
      rotation: [0, yaw, 0],
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

export async function addExternalNatureAssets(scene) {
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
    addCliffSilhouette(root, rocks);
    addSurfaceRocks(root, rocks);
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
