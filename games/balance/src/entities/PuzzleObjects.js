import * as THREE from 'three';

function makePolarityMaterial(value, materials) {
  if (value < 0) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xff78df,
      emissive: 0xd92cff,
      emissiveIntensity: 4.2,
      roughness: .12,
      transparent: true,
      opacity: .95,
    });
  }

  const material = materials.cyan.clone();
  material.emissiveIntensity = 3.8;
  return material;
}

function makePolarityLineMaterial(value, materials) {
  if (value < 0) {
    return new THREE.MeshStandardMaterial({
      color: 0xff9bea,
      emissive: 0xd92cff,
      emissiveIntensity: 3.6,
    });
  }

  return materials.cyanLine.clone();
}

export function createEnergyCore(materials, value = 2) {
  const core = new THREE.Group();
  const coreMaterial = makePolarityMaterial(value, materials);
  const lineMaterial = makePolarityLineMaterial(value, materials);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(.42, 36, 24),
    coreMaterial,
  );

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(.49, 18, 12),
    new THREE.MeshBasicMaterial({
      color: value < 0 ? 0xffc6f5 : 0xc9f9ff,
      wireframe: true,
      transparent: true,
      opacity: .52,
    }),
  );

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(.56, .025, 10, 48),
    lineMaterial,
  );
  halo.rotation.x = Math.PI / 2;

  const light = new THREE.PointLight(
    value < 0 ? 0xf04dff : 0x4ee5ff,
    4.2,
    3.2,
    2,
  );

  core.add(ball, wire, halo, light);
  core.userData = {
    type: 'core',
    value,
    ball,
    wire,
    halo,
    light,
    state: 'world',
  };

  return core;
}

export function createCorePedestal(materials, value = 2) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(.50, .58, .22, 32),
    materials.dark,
  );
  base.position.y = .02;
  base.castShadow = true;

  const stone = new THREE.Mesh(
    new THREE.CylinderGeometry(.39, .46, .20, 32),
    materials.stone,
  );
  stone.position.y = .20;
  stone.castShadow = true;

  const ringMaterial = makePolarityLineMaterial(value, materials);
  ringMaterial.emissiveIntensity = 2.4;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.35, .035, 12, 48),
    ringMaterial,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .32;

  const light = new THREE.PointLight(
    value < 0 ? 0xf04dff : 0x4ee5ff,
    2.7,
    2.4,
    2,
  );
  light.position.y = .54;

  group.add(base, stone, ring, light);
  group.userData = { ring, light, value };

  return group;
}

export function createGenerator(materials) {
  const group = new THREE.Group();
  group.name = 'BalanceGenerator';

  const stone = materials.stone.clone();
  stone.color.setHex(0xa99d87);
  stone.roughness = .94;

  const stoneDark = materials.rockDark.clone();
  stoneDark.color.setHex(0x635f58);
  stoneDark.roughness = .96;

  const metal = materials.dark.clone();
  metal.color.setHex(0x1b242b);
  metal.roughness = .34;
  metal.metalness = .72;

  const brass = materials.gold.clone();
  brass.color.setHex(0xc98b37);
  brass.emissive.setHex(0x6b3a06);
  brass.emissiveIntensity = .18;
  brass.metalness = .64;
  brass.roughness = .32;

  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.26, 1.38, .18, 12),
    stone,
  );
  basePlate.position.y = .09;
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;

  const lowerRing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.18, .22, 16),
    metal,
  );
  lowerRing.position.y = .24;
  lowerRing.castShadow = true;
  lowerRing.receiveShadow = true;

  const lowerStoneRing = new THREE.Mesh(
    new THREE.CylinderGeometry(.95, 1.06, .24, 14),
    stoneDark,
  );
  lowerStoneRing.position.y = .38;
  lowerStoneRing.castShadow = true;
  lowerStoneRing.receiveShadow = true;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(.80, .88, .58, 14),
    stone,
  );
  body.position.y = .66;
  body.castShadow = true;
  body.receiveShadow = true;

  const metalBand = new THREE.Mesh(
    new THREE.CylinderGeometry(.84, .90, .13, 16),
    metal,
  );
  metalBand.position.y = .64;
  metalBand.castShadow = true;

  const upperStone = new THREE.Mesh(
    new THREE.CylinderGeometry(.74, .81, .20, 14),
    stoneDark,
  );
  upperStone.position.y = .91;
  upperStone.castShadow = true;

  const topBasin = new THREE.Mesh(
    new THREE.CylinderGeometry(.70, .78, .16, 18),
    metal,
  );
  topBasin.position.y = 1.04;
  topBasin.castShadow = true;

  const basinInner = new THREE.Mesh(
    new THREE.CylinderGeometry(.53, .58, .07, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x102d35,
      metalness: .34,
      roughness: .24,
      clearcoat: .8,
    }),
  );
  basinInner.position.y = 1.10;

  const slotMaterial = materials.cyan.clone();
  slotMaterial.emissiveIntensity = 4.4;

  const slot = new THREE.Mesh(
    new THREE.CylinderGeometry(.42, .42, .10, 36),
    slotMaterial,
  );
  slot.position.y = 1.14;

  const haloMaterial = materials.cyanLine.clone();
  haloMaterial.emissiveIntensity = 4.0;

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(.68, .032, 12, 72),
    haloMaterial,
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.18;

  const innerHalo = new THREE.Mesh(
    new THREE.TorusGeometry(.49, .018, 10, 64),
    haloMaterial.clone(),
  );
  innerHalo.rotation.x = Math.PI / 2;
  innerHalo.position.y = 1.19;

  const energyColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(.12, .20, .36, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x8ff4ff,
      transparent: true,
      opacity: .46,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  energyColumn.position.y = 1.34;

  const light = new THREE.PointLight(0x4ee5ff, 0, 5.4, 2);
  light.position.y = 1.36;

  group.add(
    basePlate,
    lowerRing,
    lowerStoneRing,
    body,
    metalBand,
    upperStone,
    topBasin,
    basinInner,
    slot,
    halo,
    innerHalo,
    energyColumn,
    light,
  );

  // Chunky stone/metal modules around the body make the machine feel
  // integrated into the old ruins instead of like a clean sci-fi prop.
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = .96;

    const buttress = new THREE.Mesh(
      new THREE.BoxGeometry(.34, .34, .38),
      i % 2 === 0 ? stone : stoneDark,
    );
    buttress.position.set(
      Math.cos(angle) * radius,
      .56,
      Math.sin(angle) * radius,
    );
    buttress.rotation.y = -angle + Math.PI / 2;
    buttress.castShadow = true;
    buttress.receiveShadow = true;
    group.add(buttress);

    const clamp = new THREE.Mesh(
      new THREE.BoxGeometry(.18, .20, .10),
      metal,
    );
    clamp.position.set(
      Math.cos(angle) * 1.08,
      .70,
      Math.sin(angle) * 1.08,
    );
    clamp.rotation.y = -angle + Math.PI / 2;
    clamp.castShadow = true;
    group.add(clamp);

    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(.034, .034, .075, 10),
      brass,
    );
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(
      Math.cos(angle) * 1.10,
      .72,
      Math.sin(angle) * 1.10,
    );
    group.add(bolt);
  }

  // Cyan conduit pipes around the generator, visually matching the target.
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x173845,
    metalness: .62,
    roughness: .38,
  });

  const pipeGlow = materials.cyanLine.clone();
  pipeGlow.emissiveIntensity = 3.6;

  const pipeAngles = [-2.55, -1.35, -.20, .95];

  pipeAngles.forEach((angle) => {
    const start = new THREE.Vector3(
      Math.cos(angle) * .72,
      .38,
      Math.sin(angle) * .72,
    );
    const mid = new THREE.Vector3(
      Math.cos(angle) * 1.06,
      .30,
      Math.sin(angle) * 1.06,
    );
    const end = new THREE.Vector3(
      Math.cos(angle) * 1.28,
      .18,
      Math.sin(angle) * 1.28,
    );

    const curve = new THREE.CatmullRomCurve3([start, mid, end]);

    const pipe = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, .075, 8, false),
      pipeMaterial,
    );
    pipe.castShadow = true;
    group.add(pipe);

    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, .025, 6, false),
      pipeGlow,
    );
    group.add(glow);
  });

  // Front energy socket to visually connect with the cable toward the gate.
  const socket = new THREE.Group();
  socket.position.set(.74, .42, .66);
  socket.rotation.y = -.78;

  const socketBase = new THREE.Mesh(
    new THREE.CylinderGeometry(.16, .16, .22, 14),
    metal,
  );
  socketBase.rotation.z = Math.PI / 2;

  const socketGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(.10, .10, .235, 14),
    slotMaterial.clone(),
  );
  socketGlow.rotation.z = Math.PI / 2;

  socket.add(socketBase, socketGlow);
  group.add(socket);

  // Small warm hardware accents break up the cyan and tie into the gate.
  for (let i = 0; i < 4; i += 1) {
    const angle = .35 + i * (Math.PI / 2);
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(.17, .09, .12),
      brass,
    );
    plate.position.set(
      Math.cos(angle) * .86,
      .88,
      Math.sin(angle) * .86,
    );
    plate.rotation.y = -angle;
    group.add(plate);
  }

  group.userData = {
    type: 'generator',
    base: lowerRing,
    body,
    top: topBasin,
    slot,
    halo,
    innerHalo,
    light,
    energyColumn,
  };

  return group;
}

export function createDoor(materials) {
  const group = new THREE.Group();

  const accentMaterial = materials.gold.clone();
  accentMaterial.emissiveIntensity = .28;

  const pillarL = new THREE.Group();
  const pillarR = new THREE.Group();

  for (let i = 0; i < 5; i += 1) {
    const blockL = new THREE.Mesh(
      new THREE.BoxGeometry(.72, .56, .58),
      materials.stone,
    );
    blockL.position.set(-1.25 + (i % 2) * .02, .30 + i * .52, 0);
    blockL.rotation.z = (i % 2 ? 1 : -1) * .012;
    blockL.castShadow = true;
    blockL.receiveShadow = true;
    pillarL.add(blockL);

    const blockR = new THREE.Mesh(
      new THREE.BoxGeometry(.72, .56, .58),
      materials.stone,
    );
    blockR.position.set(1.25 - (i % 2) * .02, .30 + i * .52, 0);
    blockR.rotation.z = (i % 2 ? -1 : 1) * .012;
    blockR.castShadow = true;
    blockR.receiveShadow = true;
    pillarR.add(blockR);
  }

  const archTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.15, .44, .62),
    materials.stone,
  );
  archTop.position.set(0, 2.92, 0);
  archTop.castShadow = true;

  const capL = new THREE.Mesh(
    new THREE.BoxGeometry(.90, .22, .72),
    materials.stone,
  );
  capL.position.set(-1.25, 2.78, 0);

  const capR = capL.clone();
  capR.position.x = 1.25;

  const trimL = new THREE.Mesh(
    new THREE.BoxGeometry(.08, 2.18, .05),
    accentMaterial,
  );
  trimL.position.set(-.92, 1.22, .18);

  const trimR = new THREE.Mesh(
    new THREE.BoxGeometry(.08, 2.18, .05),
    accentMaterial.clone(),
  );
  trimR.position.set(.92, 1.22, .18);

  const trimTop = new THREE.Mesh(
    new THREE.TorusGeometry(.92, .05, 12, 40, Math.PI),
    accentMaterial.clone(),
  );
  trimTop.position.set(0, 2.28, .18);
  trimTop.rotation.z = Math.PI;

  const runeBase = new THREE.Mesh(
    new THREE.CircleGeometry(.38, 28),
    new THREE.MeshStandardMaterial({
      color: 0x293540,
      roughness: .4,
      metalness: .72,
    }),
  );
  runeBase.position.set(0, 3.30, .19);

  const runeDiamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(.18, 0),
    accentMaterial.clone(),
  );
  runeDiamond.position.set(0, 3.30, .23);
  runeDiamond.scale.set(1, 1.45, .25);

  const panel = new THREE.Group();
  panel.position.set(0, 1.15, .06);

  const leafL = new THREE.Mesh(
    new THREE.BoxGeometry(.82, 2.06, .18),
    materials.door,
  );
  leafL.position.set(-.42, 0, 0);
  leafL.castShadow = true;

  const leafR = leafL.clone();
  leafR.position.x = .42;

  const bandTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.76, .12, .04),
    materials.dark,
  );
  bandTop.position.set(0, .62, .11);

  const bandMid = bandTop.clone();
  bandMid.position.y = 0;

  const bandLow = bandTop.clone();
  bandLow.position.y = -.62;

  const lock = new THREE.Mesh(
    new THREE.CylinderGeometry(.08, .08, .08, 14),
    materials.gold,
  );
  lock.rotation.z = Math.PI / 2;
  lock.position.set(0, 0, .14);

  panel.add(leafL, leafR, bandTop, bandMid, bandLow, lock);

  const portalMaterial = new THREE.MeshBasicMaterial({
    color: 0x63e7ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.92, 2.18),
    portalMaterial,
  );
  portal.position.set(0, 1.18, -.18);

  const portalLight = new THREE.PointLight(0x4ee5ff, 0, 6, 2);
  portalLight.position.set(0, 1.35, -.26);

  group.add(
    portal,
    pillarL,
    pillarR,
    archTop,
    capL,
    capR,
    panel,
    trimL,
    trimR,
    trimTop,
    runeBase,
    runeDiamond,
    portalLight,
  );

  group.userData = {
    type: 'door',
    panel,
    trimL,
    trimR,
    trimTop,
    runeDiamond,
    portal,
    portalLight,
  };

  return group;
}

export function createEnergyCable(materials) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.3, .12, .42),
    new THREE.Vector3(2.05, .15, .18),
    new THREE.Vector3(2.65, .16, -.25),
    new THREE.Vector3(3.10, .18, -.82),
    new THREE.Vector3(3.45, .22, -1.10),
  ]);

  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, .055, 10, false),
    new THREE.MeshStandardMaterial({
      color: 0x1c3039,
      roughness: .7,
      metalness: .4,
    }),
  );

  const glowMaterial = materials.cyanLine.clone();
  glowMaterial.emissiveIntensity = 2.5;

  const glow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, .030, 8, false),
    glowMaterial,
  );
  glow.visible = false;

  const pulseMaterial = materials.cyan.clone();
  pulseMaterial.emissiveIntensity = 6;

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(.105, 18, 14),
    pulseMaterial,
  );
  pulse.visible = false;

  const pulseLight = new THREE.PointLight(0x57e8ff, 7, 2.4, 2);
  pulseLight.visible = false;

  group.add(base, glow, pulse, pulseLight);
  group.userData = {
    curve,
    glow,
    pulse,
    pulseLight,
  };

  return group;
}
