import * as THREE from 'three';

export function createFloatingIsland(materials) {
  const { rock, rockDark, grass, stone, dark, gold } = materials;
  const island = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(8.8, .75, 6.4), rock);
  top.position.y = -.55; top.castShadow = true; top.receiveShadow = true; island.add(top);
  const turf = new THREE.Mesh(new THREE.BoxGeometry(8.45, .12, 6.05), grass);
  turf.position.y = -.12; turf.receiveShadow = true; island.add(turf);

  for (let x = -3.8; x <= 3.8; x += 1.25) {
    const h = 1.4 + Math.random() * 1.5;
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(1.1, h, .9), Math.random() > .5 ? rock : rockDark);
    cliff.position.set(x, -1 - h / 2, 3 + (Math.random() - .5) * .2); cliff.rotation.y = (Math.random() - .5) * .15;
    cliff.castShadow = true; island.add(cliff);
  }
  for (let z = -2.3; z <= 2.2; z += 1.1) {
    const h = 1.3 + Math.random() * 1.6;
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(.95, h, 1), Math.random() > .5 ? rock : rockDark);
    cliff.position.set(-4.25 + (Math.random() - .5) * .18, -1 - h / 2, z); cliff.castShadow = true; island.add(cliff);
  }

  for (let x = -3.2; x < 3.4; x += .82) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.7, .13, .72), stone);
    tile.position.set(x, .02, .15 + (Math.random() - .5) * .05); tile.rotation.y = (Math.random() - .5) * .05;
    tile.castShadow = true; island.add(tile);
  }

  const lantern = (x, z) => {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .26, 16), dark);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .25, 16), gold); light.position.y = .24;
    group.add(base, light); group.position.set(x, .05, z); island.add(group);
  };
  lantern(-3.55, -2.45); lantern(-3.55, 2.45); lantern(3.5, 2.45);
  return island;
}

export function addCloudscape(scene) {
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .48, roughness: 1, depthWrite: false });
  for (let i = 0; i < 28; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(.65 + Math.random() * .75, 24, 16), cloudMaterial);
    cloud.scale.set(1.8 + Math.random() * 1.5, .55 + Math.random() * .45, 1.1 + Math.random());
    cloud.position.set((Math.random() - .5) * 24, -4 - Math.random() * 2.5, (Math.random() - .5) * 18);
    scene.add(cloud);
  }
}
