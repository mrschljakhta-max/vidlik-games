import * as THREE from 'three';

function seededRandom(seed = 17) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createFloatingIsland(materials) {
  const { rock, rockDark, grass, stone, dark, gold } = materials;
  const island = new THREE.Group();
  const rand = seededRandom(29);

  const top = new THREE.Mesh(new THREE.BoxGeometry(8.8, .75, 6.4), rock);
  top.position.y = -.55;
  top.castShadow = true;
  top.receiveShadow = true;
  island.add(top);

  const turf = new THREE.Mesh(new THREE.BoxGeometry(8.45, .12, 6.05), grass);
  turf.position.y = -.12;
  turf.receiveShadow = true;
  island.add(turf);

  for (let x = -3.8; x <= 3.8; x += 1.15) {
    const h = 1.35 + rand() * 1.65;
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(.95 + rand() * .25, h, .78 + rand() * .25),
      rand() > .48 ? rock : rockDark,
    );
    cliff.position.set(x, -1 - h / 2, 3 + (rand() - .5) * .25);
    cliff.rotation.y = (rand() - .5) * .20;
    cliff.rotation.z = (rand() - .5) * .05;
    cliff.castShadow = true;
    island.add(cliff);
  }

  for (let z = -2.35; z <= 2.25; z += 1.0) {
    const h = 1.25 + rand() * 1.7;
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(.82 + rand() * .22, h, .95 + rand() * .18),
      rand() > .48 ? rock : rockDark,
    );
    cliff.position.set(-4.25 + (rand() - .5) * .20, -1 - h / 2, z);
    cliff.rotation.y = (rand() - .5) * .20;
    cliff.castShadow = true;
    island.add(cliff);
  }

  for (let x = -3.2; x < 3.4; x += .82) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.7, .13, .72), stone);
    tile.position.set(x, .02, .15 + (rand() - .5) * .05);
    tile.rotation.y = (rand() - .5) * .05;
    tile.castShadow = true;
    tile.receiveShadow = true;
    island.add(tile);
  }

  const lantern = (x, z) => {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .26, 16), dark);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .25, 16), gold);
    light.position.y = .24;
    group.add(base, light);
    group.position.set(x, .05, z);
    island.add(group);

    const point = new THREE.PointLight(0xffb14a, 2.6, 2.3, 2);
    point.position.set(x, .55, z);
    island.add(point);
  };

  lantern(-3.55, -2.45);
  lantern(-3.55, 2.45);
  lantern(3.5, 2.45);
  lantern(3.55, -.1);

  const tuftMaterial = new THREE.MeshStandardMaterial({
    color: 0x789b62,
    roughness: .95,
  });

  const tuftPositions = [
    [-3.55, 2.42], [-2.65, 2.56], [-1.8, 2.52], [.2, 2.60],
    [1.35, 2.52], [2.45, 2.45], [3.45, 1.65], [3.55, -2.30],
    [2.45, -2.55], [1.3, -2.62], [-2.8, -2.55], [-3.62, -1.45],
  ];

  tuftPositions.forEach(([x, z], index) => {
    const cluster = new THREE.Group();
    const blades = 3 + (index % 3);

    for (let i = 0; i < blades; i += 1) {
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(.055, .30 + rand() * .18, 5),
        tuftMaterial,
      );
      blade.position.set((rand() - .5) * .24, .18 + rand() * .04, (rand() - .5) * .24);
      blade.rotation.z = (rand() - .5) * .28;
      cluster.add(blade);
    }

    cluster.position.set(x, .02, z);
    island.add(cluster);
  });

  const boulderMaterial = rockDark.clone();
  boulderMaterial.color.setHex(0x5d625d);
  [
    [-3.35, 1.72, .34],
    [-2.55, -2.28, .28],
    [2.72, 2.20, .30],
    [3.38, -2.14, .25],
  ].forEach(([x, z, scale], index) => {
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), boulderMaterial);
    boulder.scale.set(scale * 1.25, scale, scale);
    boulder.position.set(x, .10, z);
    boulder.rotation.set(rand(), rand(), rand());
    boulder.castShadow = true;
    island.add(boulder);
  });

  return island;
}

export function addCloudscape(scene, materials) {
  const rand = seededRandom(91);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: .40,
    roughness: 1,
    depthWrite: false,
  });

  for (let i = 0; i < 32; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(.65 + rand() * .75, 20, 14),
      cloudMaterial,
    );
    cloud.scale.set(1.8 + rand() * 1.7, .48 + rand() * .42, 1.05 + rand());
    cloud.position.set((rand() - .5) * 25, -3.8 - rand() * 3.1, (rand() - .5) * 19);
    scene.add(cloud);
  }

  const waterfallMaterial = new THREE.MeshBasicMaterial({
    color: 0x7eeaff,
    transparent: true,
    opacity: .32,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const distantData = [
    [-7.8, 1.0, -8.5, 1.15],
    [7.1, 2.0, -10.5, 1.35],
    [-10.5, 3.8, -15, .85],
    [10.2, 4.5, -16, .95],
  ];

  distantData.forEach(([x, y, z, scale], index) => {
    const group = new THREE.Group();

    const rock = new THREE.Mesh(
      new THREE.ConeGeometry(1.35 * scale, 3.8 * scale, 7),
      materials.rockDark,
    );
    rock.rotation.z = Math.PI;
    rock.position.y = -1.55 * scale;

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22 * scale, 1.42 * scale, .28 * scale, 10),
      materials.grass,
    );
    cap.position.y = .15;

    group.add(rock, cap);

    if (index < 2) {
      const waterfall = new THREE.Mesh(
        new THREE.PlaneGeometry(.28 * scale, 3.1 * scale),
        waterfallMaterial,
      );
      waterfall.position.set(.28 * scale, -1.25 * scale, .62 * scale);
      group.add(waterfall);
    }

    group.position.set(x, y, z);
    group.rotation.y = index % 2 ? -.24 : .22;
    scene.add(group);
  });
}
