import * as THREE from 'three';

export function createRobot(materials) {
  const { white, dark, gold, cyan, visor, face } = materials;
  const robot = new THREE.Group();
  const visual = new THREE.Group();
  robot.add(visual);

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 52, 36), white);
  body.scale.set(1.06, .95, .92);
  body.castShadow = true;
  visual.add(body);

  const screen = new THREE.Mesh(new THREE.SphereGeometry(.78, 48, 32), visor);
  screen.scale.set(1.04, .65, .20);
  screen.position.set(0, .08, .84);
  visual.add(screen);

  const makeEye = (x) => {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(.058, .23, 8, 16), face);
    eye.position.set(x, .13, 1.005);
    eye.scale.z = .4;
    visual.add(eye);
    return eye;
  };

  const eyeL = makeEye(-.28);
  const eyeR = makeEye(.28);

  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-.13, -.13, 1.02),
    new THREE.Vector3(0, -.22, 1.045),
    new THREE.Vector3(.13, -.13, 1.02),
  );
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 18, .019, 8, false), face);
  visual.add(smile);

  [-.49, .49].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(.10, .38, 6, 14), gold);
    ear.position.set(x, .88, .03);
    ear.rotation.z = x < 0 ? -.28 : .28;
    visual.add(ear);
  });

  [-.98, .98].forEach((x) => {
    const module = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .18, 36), dark);
    outer.rotation.z = Math.PI / 2;
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .19, 36), gold);
    lamp.rotation.z = Math.PI / 2;
    module.add(outer, lamp);
    module.position.set(x, .05, .02);
    visual.add(module);
  });

  const thruster = new THREE.Group();
  const thrusterBody = new THREE.Mesh(new THREE.CylinderGeometry(.38, .46, .24, 36), dark);
  const thrusterGlow = new THREE.Mesh(new THREE.SphereGeometry(.23, 28, 20), cyan);
  thrusterGlow.scale.set(1, .72, 1);
  thrusterGlow.position.y = -.24;
  thruster.add(thrusterBody, thrusterGlow);
  thruster.position.set(0, -.84, 0);
  visual.add(thruster);

  const makeArm = (x) => {
    const root = new THREE.Group();
    root.position.set(x, -.34, .38);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .30, 6, 12), white);
    arm.rotation.z = x < 0 ? -.82 : .82;
    arm.position.x = x < 0 ? -.14 : .14;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), dark);
    hand.position.set(x < 0 ? -.30 : .30, -.05, .10);
    root.add(arm, hand);
    visual.add(root);
    return root;
  };

  const armL = makeArm(-.70);
  const armR = makeArm(.70);

  robot.scale.setScalar(.76);
  robot.userData = {
    visual,
    eyeL,
    eyeR,
    smile,
    thrusterGlow,
    armL,
    armR,
    mode: 'idle',
  };

  return robot;
}

export function setRobotExpression(robot, mode = 'neutral') {
  const { eyeL, eyeR } = robot.userData;

  if (mode === 'happy') {
    eyeL.rotation.z = -.48;
    eyeR.rotation.z = .48;
    return;
  }

  eyeL.rotation.z = 0;
  eyeR.rotation.z = 0;
}

export function setRobotCarry(robot, carrying) {
  const { armL, armR } = robot.userData;
  armL.rotation.x = carrying ? -.72 : 0;
  armR.rotation.x = carrying ? -.72 : 0;
  armL.rotation.z = carrying ? -.34 : 0;
  armR.rotation.z = carrying ? .34 : 0;
}

export function animateRobot(robot, time, moving = false) {
  const { visual, thrusterGlow, eyeL, eyeR } = robot.userData;

  visual.position.y = moving
    ? Math.sin(time * 7) * .018
    : Math.sin(time * 2) * .07;

  visual.rotation.z = moving
    ? Math.sin(time * 6) * .018
    : Math.sin(time * .9) * .02;

  const boost = moving ? 1.42 + Math.sin(time * 11) * .07 : 1 + Math.sin(time * 5) * .05;
  thrusterGlow.scale.setScalar(boost);
  thrusterGlow.material.emissiveIntensity = moving ? 4.2 : 3.5;

  const cycle = time % 4.2;
  const blink = cycle > 3.95 ? Math.sin(((cycle - 3.95) / .25) * Math.PI) : 0;
  eyeL.scale.y = Math.max(.12, 1 - blink * .9);
  eyeR.scale.y = Math.max(.12, 1 - blink * .9);
}
