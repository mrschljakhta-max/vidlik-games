import * as THREE from 'three';

export function createEnergyCore(materials, value = 2) {
  const core = new THREE.Group();
  const coreMaterial = materials.cyan.clone();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.42, 36, 24), coreMaterial);
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(.49, 18, 12),
    new THREE.MeshBasicMaterial({
      color: 0xc9f9ff,
      wireframe: true,
      transparent: true,
      opacity: .5,
    }),
  );

  core.add(ball, wire);
  core.userData = { type: 'core', value, ball, wire };
  return core;
}

export function createCorePedestal(materials) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.66, .78, .28, 32), materials.dark);
  base.position.y = .02;
  base.castShadow = true;

  const stone = new THREE.Mesh(new THREE.CylinderGeometry(.50, .59, .26, 32), materials.stone);
  stone.position.y = .26;
  stone.castShadow = true;

  const ringMaterial = materials.cyanLine.clone();
  ringMaterial.emissiveIntensity = 2.4;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .045, 12, 48), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .42;

  const light = new THREE.PointLight(0x4ee5ff, 3.2, 2.8, 2);
  light.position.y = .68;

  group.add(base, stone, ring, light);
  group.userData = { ring, light };
  return group;
}

export function createGenerator(materials) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.90, 1.05, .34, 40), materials.dark);
  base.position.y = .05;
  base.castShadow = true;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(.72, .80, .82, 40), materials.stone);
  body.position.y = .58;
  body.castShadow = true;

  const top = new THREE.Mesh(new THREE.TorusGeometry(.56, .14, 18, 48), materials.dark);
  top.rotation.x = Math.PI / 2;
  top.position.y = 1;

  const slotMaterial = materials.cyan.clone();
  slotMaterial.emissiveIntensity = 2.4;
  const slot = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .16, 40), slotMaterial);
  slot.position.y = 1.02;

  const haloMaterial = materials.cyanLine.clone();
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.66, .035, 12, 64), haloMaterial);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.08;

  const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(.49, .018, 10, 56), haloMaterial.clone());
  innerHalo.rotation.x = Math.PI / 2;
  innerHalo.position.y = 1.095;

  const light = new THREE.PointLight(0x4ee5ff, 0, 4.2, 2);
  light.position.y = 1.15;

  group.add(base, body, top, slot, halo, innerHalo, light);
  group.userData = {
    type: 'generator',
    base,
    body,
    top,
    slot,
    halo,
    innerHalo,
    light,
  };

  return group;
}

export function createDoor(materials) {
  const group = new THREE.Group();

  const left = new THREE.Mesh(new THREE.BoxGeometry(.34, 2.8, .52), materials.stone);
  left.position.set(-1.20, 1.26, 0);
  left.castShadow = true;

  const right = left.clone();
  right.position.x = 1.20;

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.75, .36, .52), materials.stone);
  top.position.set(0, 2.57, 0);
  top.castShadow = true;

  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.02, 2.30, .20), materials.door);
  panel.position.set(0, 1.20, .03);
  panel.castShadow = true;

  const trimMaterial = materials.gold.clone();
  trimMaterial.emissiveIntensity = .22;
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.08, .05), trimMaterial);
  trimL.position.set(-.88, 1.23, .17);

  const trimR = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.08, .05), trimMaterial.clone());
  trimR.position.set(.88, 1.23, .17);

  const portalMaterial = new THREE.MeshBasicMaterial({
    color: 0x63e7ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.16), portalMaterial);
  portal.position.set(0, 1.20, -.16);

  const portalLight = new THREE.PointLight(0x4ee5ff, 0, 5, 2);
  portalLight.position.set(0, 1.25, -.30);

  group.add(portal, left, right, top, panel, trimL, trimR, portalLight);
  group.userData = {
    type: 'door',
    panel,
    trimL,
    trimR,
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
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(.105, 18, 14), pulseMaterial);
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
