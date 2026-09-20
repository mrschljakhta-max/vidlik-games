import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const MEDIEVAL_RAW =
  'https://raw.githubusercontent.com/agentkaerf/FreeModels/main/' +
  'Medieval%20Village%20MegaKit%5BStandard%5D/glTF/';

const FANTASY_RAW =
  'https://raw.githubusercontent.com/agentkaerf/FreeModels/main/' +
  'Fantasy%20Props%20MegaKit%5BStandard%5D/Exports/glTF/';

function assetUrl(name) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/quaternius/medieval/${name}`;
}

function loadUrl(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    );
  });
}

function loadLocal(name) {
  return loadUrl(assetUrl(name));
}

function loadMedieval(name) {
  return loadUrl(`${MEDIEVAL_RAW}${name}.gltf`);
}

function loadFantasy(name) {
  return loadUrl(`${FANTASY_RAW}${name}.gltf`);
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
    child.geometry?.computeBoundingSphere?.();
  });

  return root;
}

function clonePrepared(source, material) {
  return prepareModel(source.clone(true), material);
}

function normalizeModel(source, name) {
  const root = source.clone(true);

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => m.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
  });

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDimension = Math.max(size.x, size.y, size.z, .001);

  const wrapper = new THREE.Group();
  root.position.set(-center.x, -box.min.y, -center.z);
  wrapper.add(root);
  wrapper.scale.setScalar(1 / maxDimension);
  wrapper.name = `ArchitectureAsset_${name}`;

  return wrapper;
}

function cloneNormalized(source) {
  return source.clone(true);
}

function recolorArchitecture(root, materials, {
  dark = false,
} = {}) {
  const replacement = (
    dark ? materials.rockDark : materials.stone
  ).clone();

  replacement.color.setHex(dark ? 0x675f55 : 0xa89b84);
  replacement.roughness = .94;
  replacement.metalness = 0;

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.material = replacement.clone();
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return root;
}

function placeNormalized(target, source, {
  position,
  size,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  transform = null,
}) {
  let object = cloneNormalized(source);

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

function addRealVines(target, source, materials) {
  const vineMaterial = materials.grass.clone();
  vineMaterial.color.setHex(0x4f7e3e);
  vineMaterial.roughness = 1;

  const placements = [
    [-3.72, .08, 1.95, .82, .15],
    [-3.76, .05, -.82, .76, -.15],
    [-3.42, .02, -1.70, .72, .28],
    [-2.72, .03, -2.47, .74, .45],
    [-1.44, .02, -2.52, .62, -.40],
    [.36, .03, -2.54, .62, .18],
    [1.68, .04, -2.48, .80, -.25],
    [2.94, .04, -2.10, .70, .34],
    [3.53, .18, 1.72, .72, .25],
    [2.98, .18, 2.02, .64, -.12],
    [2.53, 2.72, -1.30, .66, -.15],
    [4.12, 2.28, -1.25, .64, .12],
    [3.70, 2.62, -1.28, .56, -.05],
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
  rubbleMaterial.color.setHex(0x8f8270);
  rubbleMaterial.roughness = .97;

  const placements = [
    [-3.10, .15, 1.68, 1.20, .3],
    [-2.60, .14, -1.92, 1.00, 1.1],
    [-1.90, .14, 2.08, .82, 2.4],
    [-.82, .14, -2.08, .74, .8],
    [.70, .14, 2.16, .85, 1.6],
    [1.66, .14, -1.96, .78, 2.1],
    [2.72, .14, 1.65, 1.15, 2.0],
    [2.42, .14, -1.92, .90, .7],
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

function addArchitectureGate(
  target,
  {
    doorFrame,
    support,
    wallArch,
    wallLantern,
  },
  materials,
  {
    doorPosition = new THREE.Vector3(3.45, 0, -1.20),
    doorObject = null,
  } = {},
) {
  if (!doorFrame) return false;

  const frame = placeNormalized(target, doorFrame, {
    position: [doorPosition.x, .02, doorPosition.z - .02],
    size: 3.45,
    rotation: [0, 0, 0],
    scale: [1.02, 1.02, .82],
    transform: (object) => recolorArchitecture(object, materials),
  });

  frame.name = 'AssetGate_DoorFrame';

  if (support) {
    [
      [doorPosition.x - 1.34, .02, doorPosition.z + .02, -.04],
      [doorPosition.x + 1.34, .02, doorPosition.z + .02, .04],
    ].forEach(([x, y, z, rz], index) => {
      placeNormalized(target, support, {
        position: [x, y, z],
        size: 1.48,
        rotation: [0, index ? Math.PI : 0, rz],
        scale: [.82, 1.25, .84],
        transform: (object) => recolorArchitecture(
          object,
          materials,
          { dark: index === 1 },
        ),
      });
    });
  }

  if (wallArch) {
    placeNormalized(target, wallArch, {
      position: [doorPosition.x, 2.46, doorPosition.z - .10],
      size: 1.62,
      rotation: [0, 0, 0],
      scale: [1.34, .70, .72],
      transform: (object) => recolorArchitecture(object, materials),
    });
  }

  if (wallLantern) {
    [
      [doorPosition.x - 1.02, 1.34, doorPosition.z + .34, 0],
      [doorPosition.x + 1.02, 1.34, doorPosition.z + .34, Math.PI],
    ].forEach(([x, y, z, yaw]) => {
      const lamp = placeNormalized(target, wallLantern, {
        position: [x, y, z],
        size: .62,
        rotation: [0, yaw, 0],
      });

      lamp.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const material = child.material.clone();
        material.roughness = Math.max(material.roughness ?? .5, .45);
        child.material = material;
      });

      const light = new THREE.PointLight(0xffb34d, 2.8, 3.0, 2);
      light.position.set(x, y + .12, z + .18);
      target.add(light);
    });
  }

  if (doorObject?.userData?.shellParts) {
    doorObject.userData.shellParts.forEach((part) => {
      part.visible = false;
    });
  }

  return true;
}

function addAssetCredit(target) {
  target.userData.externalAssetCredits = [
    {
      source: 'Quaternius / agentkaerf FreeModels mirror',
      packs: [
        'Medieval Village MegaKit',
        'Fantasy Props MegaKit',
      ],
      license: 'Standard/CC0 source packs used by project',
      assets: [
        'Prop_Vine4',
        'Prop_Brick1',
        'DoorFrame_Round_Brick',
        'Wall_Arch',
        'Prop_Support',
        'Lantern_Wall',
      ],
    },
  ];
}

export async function addExternalEnvironmentAssets(
  scene,
  materials,
  options = {},
) {
  const root = new THREE.Group();
  root.name = 'ExternalEnvironmentAssets';
  scene.add(root);

  addAssetCredit(root);

  const results = await Promise.allSettled([
    loadLocal('Prop_Vine4.gltf'),
    loadLocal('Prop_Brick1.gltf'),
    loadMedieval('DoorFrame_Round_Brick'),
    loadMedieval('Prop_Support'),
    loadMedieval('Wall_Arch'),
    loadFantasy('Lantern_Wall'),
  ]);

  const [
    vineResult,
    brickResult,
    frameResult,
    supportResult,
    archResult,
    lanternResult,
  ] = results;

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

  const architecture = {};

  if (frameResult.status === 'fulfilled') {
    architecture.doorFrame = normalizeModel(
      frameResult.value,
      'DoorFrame_Round_Brick',
    );
  } else {
    console.warn('VIDLIK: door-frame asset failed to load', frameResult.reason);
  }

  if (supportResult.status === 'fulfilled') {
    architecture.support = normalizeModel(
      supportResult.value,
      'Prop_Support',
    );
  }

  if (archResult.status === 'fulfilled') {
    architecture.wallArch = normalizeModel(
      archResult.value,
      'Wall_Arch',
    );
  }

  if (lanternResult.status === 'fulfilled') {
    architecture.wallLantern = normalizeModel(
      lanternResult.value,
      'Lantern_Wall',
    );
  }

  addArchitectureGate(
    root,
    architecture,
    materials,
    options,
  );

  return root;
}
