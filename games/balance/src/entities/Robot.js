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
  const smile = new THREE.Mesh(
    new THREE.TubeGeometry(smileCurve, 18, .019, 8, false),
    face,
  );
  visual.add(smile);

  [-.49, .49].forEach((x) => {
    const ear = new THREE.Mesh(
      new THREE.CapsuleGeometry(.10, .38, 6, 14),
      gold,
    );
    ear.position.set(x, .88, .03);
    ear.rotation.z = x < 0 ? -.28 : .28;
    visual.add(ear);
  });

  [-.98, .98].forEach((x) => {
    const module = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(.27, .27, .18, 36),
      dark,
    );
    outer.rotation.z = Math.PI / 2;

    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(.18, .18, .19, 36),
      gold,
    );
    lamp.rotation.z = Math.PI / 2;

    module.add(outer, lamp);
    module.position.set(x, .05, .02);
    visual.add(module);
  });

  const thruster = new THREE.Group();
  const thrusterBody = new THREE.Mesh(
    new THREE.CylinderGeometry(.38, .46, .24, 36),
    dark,
  );

  const thrusterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(.23, 28, 20),
    cyan,
  );
  thrusterGlow.scale.set(1, .72, 1);
  thrusterGlow.position.y = -.24;

  const trailMaterial = new THREE.MeshBasicMaterial({
    color: 0x6ceaff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const boostTrail = new THREE.Mesh(
    new THREE.ConeGeometry(.22, 1.15, 24, 1, true),
    trailMaterial,
  );
  boostTrail.position.y = -.88;
  boostTrail.rotation.z = Math.PI;
  boostTrail.scale.set(.75, .35, .75);

  const boostRing = new THREE.Mesh(
    new THREE.TorusGeometry(.33, .025, 10, 36),
    new THREE.MeshBasicMaterial({
      color: 0xa8f5ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  boostRing.rotation.x = Math.PI / 2;
  boostRing.position.y = -.47;

  thruster.add(thrusterBody, thrusterGlow, boostTrail, boostRing);
  thruster.position.set(0, -.84, 0);
  visual.add(thruster);

  const makeArm = (x) => {
    const root = new THREE.Group();
    root.position.set(x, -.34, .38);

    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(.075, .30, 6, 12),
      white,
    );
    arm.rotation.z = x < 0 ? -.82 : .82;
    arm.position.x = x < 0 ? -.14 : .14;

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(.13, 20, 14),
      dark,
    );
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
    boostTrail,
    boostRing,
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

export function animateRobot(robot, time, state = false) {
  const {
    visual,
    thrusterGlow,
    boostTrail,
    boostRing,
    eyeL,
    eyeR,
  } = robot.userData;

  const movementState = typeof state === 'boolean'
    ? {
        moving: state,
        boosting: false,
        speedRatio: state ? .55 : 0,
      }
    : {
        moving: Boolean(state?.moving),
        boosting: Boolean(state?.boosting),
        speedRatio: THREE.MathUtils.clamp(state?.speedRatio ?? 0, 0, 1),
      };

  const { moving, boosting, speedRatio } = movementState;

  const targetPitch = boosting
    ? -.20
    : moving
      ? -.045
      : 0;

  visual.rotation.x = THREE.MathUtils.lerp(
    visual.rotation.x,
    targetPitch,
    boosting ? .16 : .10,
  );

  visual.position.y = moving
    ? Math.sin(time * (boosting ? 10 : 7)) * (boosting ? .010 : .018)
    : Math.sin(time * 2) * .07;

  visual.rotation.z = moving
    ? Math.sin(time * (boosting ? 9 : 6)) * (boosting ? .010 : .018)
    : Math.sin(time * .9) * .02;

  const baseBoost = moving
    ? THREE.MathUtils.lerp(1.28, 1.55, speedRatio)
    : 1;

  const boostScale = boosting
    ? baseBoost + .32 + Math.sin(time * 15) * .06
    : baseBoost + Math.sin(time * 7) * .04;

  thrusterGlow.scale.set(
    boostScale,
    boostScale * (boosting ? 1.18 : .82),
    boostScale,
  );
  thrusterGlow.material.emissiveIntensity = boosting
    ? 6.2
    : moving
      ? 4.5
      : 3.5;

  const trailTargetOpacity = boosting
    ? .50 + Math.sin(time * 17) * .08
    : moving
      ? .10
      : 0;

  boostTrail.material.opacity = THREE.MathUtils.lerp(
    boostTrail.material.opacity,
    trailTargetOpacity,
    .16,
  );

  const trailLength = boosting
    ? 1.05 + speedRatio * .65
    : moving
      ? .32
      : .10;

  boostTrail.scale.x = boosting ? .95 : .55;
  boostTrail.scale.z = boosting ? .95 : .55;
  boostTrail.scale.y = THREE.MathUtils.lerp(
    boostTrail.scale.y,
    trailLength,
    .18,
  );

  boostRing.material.opacity = THREE.MathUtils.lerp(
    boostRing.material.opacity,
    boosting ? .62 : 0,
    .18,
  );

  const ringPulse = boosting
    ? 1 + Math.sin(time * 13) * .10
    : 1;

  boostRing.scale.setScalar(ringPulse);
  boostRing.rotation.z += boosting ? .065 : .015;

  const cycle = time % 4.2;
  const blink = cycle > 3.95
    ? Math.sin(((cycle - 3.95) / .25) * Math.PI)
    : 0;

  eyeL.scale.y = Math.max(.12, 1 - blink * .9);
  eyeR.scale.y = Math.max(.12, 1 - blink * .9);
}
