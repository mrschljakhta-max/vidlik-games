import * as THREE from 'three';

function seededRandom(seed = 417) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createCloudMaterial(opacity = .78) {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdff6ff,
    emissiveIntensity: .05,
    transparent: true,
    opacity,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });
}

function createCloudCluster(rand, {
  opacity = .78,
  puffCount = 6,
  flatten = .72,
} = {}) {
  const group = new THREE.Group();
  const material = createCloudMaterial(opacity);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 12),
    material.clone(),
  );

  body.scale.set(1.75, .48 * flatten, .92);
  body.position.y = -.08;
  body.material.opacity = opacity * .66;
  group.add(body);

  for (let i = 0; i < puffCount; i += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(.52 + rand() * .30, 16, 10),
      material,
    );

    const t = puffCount <= 1 ? 0 : i / (puffCount - 1);
    const x = THREE.MathUtils.lerp(-1.15, 1.15, t);

    puff.position.set(
      x + (rand() - .5) * .24,
      .08 + rand() * .34,
      (rand() - .5) * .46,
    );

    puff.scale.set(
      .96 + rand() * .50,
      (.72 + rand() * .28) * flatten,
      .90 + rand() * .44,
    );

    group.add(puff);
  }

  group.userData.cloudMaterial = material;
  return group;
}

function addLayer(root, rand, {
  count,
  radiusMin,
  radiusMax,
  yMin,
  yMax,
  opacity,
  scaleMin,
  scaleMax,
  speedMin,
  speedMax,
  flatten,
  puffMin,
  puffMax,
  driftRadius,
}) {
  for (let i = 0; i < count; i += 1) {
    const cloud = createCloudCluster(rand, {
      opacity,
      flatten,
      puffCount: puffMin + Math.floor(rand() * (puffMax - puffMin + 1)),
    });

    const angle = rand() * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(radiusMin, radiusMax, rand());
    const scale = THREE.MathUtils.lerp(scaleMin, scaleMax, rand());

    cloud.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(yMin, yMax, rand()),
      Math.sin(angle) * radius,
    );

    cloud.scale.setScalar(scale);
    cloud.rotation.y = rand() * Math.PI * 2;

    root.add(cloud);

    root.userData.clouds.push({
      object: cloud,
      baseX: cloud.position.x,
      baseY: cloud.position.y,
      baseZ: cloud.position.z,
      phase: rand() * Math.PI * 2,
      speed: THREE.MathUtils.lerp(speedMin, speedMax, rand()),
      bobSpeed: THREE.MathUtils.lerp(.28, .52, rand()),
      bobAmount: THREE.MathUtils.lerp(.035, .085, rand()),
      driftRadius: driftRadius * THREE.MathUtils.lerp(.72, 1.18, rand()),
    });
  }
}

export function createCloudField() {
  const root = new THREE.Group();
  root.name = 'StylizedCloudField';
  root.userData.clouds = [];

  const rand = seededRandom(417);

  // Foreground/lower layer: large clouds below the island.
  addLayer(root, rand, {
    count: 9,
    radiusMin: 5.2,
    radiusMax: 9.0,
    yMin: -5.4,
    yMax: -3.1,
    opacity: .66,
    scaleMin: 1.35,
    scaleMax: 2.25,
    speedMin: .035,
    speedMax: .065,
    flatten: .76,
    puffMin: 6,
    puffMax: 8,
    driftRadius: .62,
  });

  // Mid layer: smaller clouds around the scene.
  addLayer(root, rand, {
    count: 8,
    radiusMin: 9.0,
    radiusMax: 14.5,
    yMin: -2.6,
    yMax: 2.2,
    opacity: .52,
    scaleMin: .95,
    scaleMax: 1.55,
    speedMin: .025,
    speedMax: .045,
    flatten: .68,
    puffMin: 5,
    puffMax: 7,
    driftRadius: .46,
  });

  // Far layer: subtle silhouettes that add atmospheric depth.
  addLayer(root, rand, {
    count: 7,
    radiusMin: 15.0,
    radiusMax: 22.0,
    yMin: -1.8,
    yMax: 4.4,
    opacity: .28,
    scaleMin: 1.25,
    scaleMax: 2.10,
    speedMin: .012,
    speedMax: .026,
    flatten: .62,
    puffMin: 5,
    puffMax: 7,
    driftRadius: .34,
  });

  root.userData.update = (time) => {
    for (const cloud of root.userData.clouds) {
      const a = time * cloud.speed + cloud.phase;

      cloud.object.position.x =
        cloud.baseX + Math.cos(a) * cloud.driftRadius;

      cloud.object.position.z =
        cloud.baseZ + Math.sin(a) * cloud.driftRadius;

      cloud.object.position.y =
        cloud.baseY +
        Math.sin(time * cloud.bobSpeed + cloud.phase) * cloud.bobAmount;
    }
  };

  return root;
}
