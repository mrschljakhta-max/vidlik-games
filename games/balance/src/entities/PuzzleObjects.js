import * as THREE from 'three';

export function createEnergyCore(materials, value = 2) {
  const core = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.42, 36, 24), materials.cyan);
  const wire = new THREE.Mesh(new THREE.SphereGeometry(.49, 18, 12), new THREE.MeshBasicMaterial({ color: 0xc9f9ff, wireframe: true, transparent: true, opacity: .5 }));
  core.add(ball, wire); core.userData = { type: 'core', value, ball, wire }; return core;
}

export function createGenerator(materials) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.90, 1.05, .34, 40), materials.dark); base.position.y = .05;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.72, .80, .82, 40), materials.stone); body.position.y = .58;
  const top = new THREE.Mesh(new THREE.TorusGeometry(.56, .14, 18, 48), materials.dark); top.rotation.x = Math.PI / 2; top.position.y = 1;
  const slot = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .16, 40), materials.cyan); slot.position.y = 1.02;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.66, .035, 12, 64), materials.cyanLine); halo.rotation.x = Math.PI / 2; halo.position.y = 1.08;
  group.add(base, body, top, slot, halo); group.userData = { type: 'generator', base, body, top, slot, halo }; return group;
}

export function createDoor(materials) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(.34, 2.8, .52), materials.stone); left.position.set(-.95, 1.26, 0);
  const right = left.clone(); right.position.x = .95;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.25, .36, .52), materials.stone); top.position.set(0, 2.57, 0);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.30, .20), materials.door); panel.position.set(0, 1.20, .03);
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.08, .05), materials.gold); trimL.position.set(-.68, 1.23, .17);
  const trimR = trimL.clone(); trimR.position.x = .68;
  group.add(left, right, top, panel, trimL, trimR); group.userData = { type: 'door', panel }; return group;
}

export function createEnergyCable(materials) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.3, .12, .42), new THREE.Vector3(2.05, .15, .18),
    new THREE.Vector3(2.65, .16, -.25), new THREE.Vector3(3.10, .18, -.82), new THREE.Vector3(3.45, .22, -1.10),
  ]);
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .055, 10, false), new THREE.MeshStandardMaterial({ color: 0x1c3039, roughness: .7, metalness: .4 }));
  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .025, 8, false), materials.cyanLine); glow.visible = false;
  group.add(base, glow); group.userData = { curve, glow }; return group;
}
