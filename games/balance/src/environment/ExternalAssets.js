import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function assetUrl(name) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/quaternius/medieval/${name}`;
}

function loadModel(name) {
  return new Promise((resolve, reject) => {
    loader.load(
      assetUrl(name),
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    );
  });
}

function prepareModel(root, material, {
  castShadow = true,
  receiveShadow = true,
} = {}) {
  root.traverse((child) => {
    if (!child.isMesh) return;

    child.material = material.clone();
    child.castShadow = castShadow;
    child.receiveShadow = receiveShadow;

    if (child.geometry?.attributes?.position) {
      child.geometry.computeBoundingSphere();
    }
  });

  return root;
}

function clonePrepared(source, material) {
  return prepareModel(source.clone(true), material);
}

function addRealStonePath(target, source, materials) {
  const points = [
    [-3.00, .13, .20, .02],
    [-2.34, .13, .18, -.03],
    [-1.68, .13, .16, .025],
    [-1.01, .13, .18, -.02],
    [-.34, .13, .15, .03],
    [.34, .13, .16, -.015],
    [1.00, .13, .13, .04],
    [1.62, .13, .02, -.18],
    [2.12, .13, -.28, -.42],
    [2.55, .13, -.68, -.55],
    [2.88, .13, -1.05, -.58],
  ];

  points.forEach(([x, y, z, rotation], index) => {
    const tile = clonePrepared(source, materials.path);

    const sx = .32 + (index % 3) * .018;
    const sz = .30 + (index % 2) * .024;

    tile.scale.set(sx, .45, sz);
    tile.position.set(x, y, z);
    tile.rotation.y = rotation;

    target.add(tile);
  });
}

function addRealVines(target, source, materials) {
  const vineMaterial = materials.grass.clone();
  vineMaterial.color.setHex(0x4d7f43);
  vineMaterial.roughness = 1;
  vineMaterial.bumpScale = .015;

  const placements = [
    [-3.72, .08, 1.95, .72, .15],
    [-3.76, .05, -.82, .66, -.15],
    [-2.72, .03, -2.47, .62, .45],
    [1.68, .04, -2.48, .70, -.25],
    [3.53, .18, 1.72, .60, .25],
    [2.53, 2.72, -1.30, .56, -.15],
    [4.12, 2.28, -1.25, .52, .12],
  ];

  placements.forEach(([x, y, z, scale, rotation]) => {
    const vine = clonePrepared(source, vineMaterial);
    vine.scale.setScalar(scale);
    vine.position.set(x, y, z);
    vine.rotation.y = rotation;
    target.add(vine);
  });
}

function addRubble(target, source, materials) {
  const rubbleMaterial = materials.rock.clone();
  rubbleMaterial.color.offsetHSL(0, -.02, -.06);
  rubbleMaterial.bumpScale = .08;

  const placements = [
    [-3.10, .15, 1.68, 1.20, .3],
    [-2.60, .14, -1.92, 1.00, 1.1],
    [2.72, .14, 1.65, 1.15, 2.0],
    [2.42, .14, -1.92, .90, .7],
    [.70, .14, 2.16, .85, 1.6],
    [3.07, .13, -.16, .75, 2.5],
  ];

  placements.forEach(([x, y, z, scale, rotation]) => {
    const brick = clonePrepared(source, rubbleMaterial);
    brick.scale.setScalar(scale);
    brick.position.set(x, y, z);
    brick.rotation.set(
      (scale % .2) * .15,
      rotation,
      (rotation % .4) * .12,
    );
    target.add(brick);
  });
}

function addAssetCredit(target) {
  target.userData.externalAssetCredits = [
    {
      source: 'Quaternius',
      pack: 'Medieval Village MegaKit',
      license: 'CC0',
      assets: [
        'Floor_UnevenBrick',
        'Prop_Vine4',
        'Prop_Brick1',
      ],
    },
  ];
}

export async function addExternalEnvironmentAssets(
  scene,
  materials,
  _options = {},
) {
  const root = new THREE.Group();
  root.name = 'ExternalEnvironmentAssets';
  scene.add(root);

  addAssetCredit(root);

  const results = await Promise.allSettled([
    loadModel('Floor_UnevenBrick.gltf'),
    loadModel('Prop_Vine4.gltf'),
    loadModel('Prop_Brick1.gltf'),
  ]);

  const [floorResult, vineResult, brickResult] = results;

  if (floorResult.status === 'fulfilled') {
    addRealStonePath(root, floorResult.value, materials);
  } else {
    console.warn('VIDLIK: external floor asset failed to load', floorResult.reason);
  }

  if (vineResult.status === 'fulfilled') {
    addRealVines(root, vineResult.value, materials);
  } else {
    console.warn('VIDLIK: external vine asset failed to load', vineResult.reason);
  }

  if (brickResult.status === 'fulfilled') {
    addRubble(root, brickResult.value, materials);
  } else {
    console.warn('VIDLIK: external rubble asset failed to load', brickResult.reason);
  }


  return root;
}
