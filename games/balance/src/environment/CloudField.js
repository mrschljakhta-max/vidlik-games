import * as THREE from 'three';

function seededRandom(seed = 417) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createCloudTexture(variant = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');

  // Soft transparent shadow under the cloud.
  const shadow = ctx.createRadialGradient(512, 330, 40, 512, 330, 360);
  shadow.addColorStop(0, 'rgba(92,132,160,.22)');
  shadow.addColorStop(.62, 'rgba(117,151,176,.12)');
  shadow.addColorStop(1, 'rgba(117,151,176,0)');

  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(512, 330, 360, 92, 0, 0, Math.PI * 2);
  ctx.fill();

  const variants = [
    [
      [240, 286, 150, 74],
      [350, 240, 170, 112],
      [485, 215, 190, 132],
      [640, 242, 180, 110],
      [770, 292, 145, 72],
    ],
    [
      [220, 300, 130, 66],
      [338, 258, 165, 96],
      [465, 230, 152, 118],
      [585, 205, 170, 132],
      [720, 248, 172, 102],
      [820, 300, 116, 62],
    ],
    [
      [245, 300, 150, 70],
      [380, 248, 185, 108],
      [520, 202, 150, 138],
      [645, 242, 182, 110],
      [785, 290, 132, 66],
    ],
    [
      [230, 296, 140, 68],
      [345, 252, 150, 102],
      [470, 220, 175, 128],
      [610, 214, 150, 120],
      [730, 252, 165, 94],
      [820, 300, 108, 58],
    ],
  ];

  const puffs = variants[variant % variants.length];

  // Unified cloud body. All puffs are painted into one texture,
  // so visually it reads as one soft silhouette rather than separate balls.
  ctx.save();
  ctx.filter = 'blur(2px)';

  puffs.forEach(([x, y, rx, ry], index) => {
    const grad = ctx.createRadialGradient(
      x - rx * .18,
      y - ry * .32,
      ry * .08,
      x,
      y,
      Math.max(rx, ry),
    );

    grad.addColorStop(0, 'rgba(255,255,255,.98)');
    grad.addColorStop(.56, 'rgba(250,253,255,.96)');
    grad.addColorStop(.82, 'rgba(228,242,250,.88)');
    grad.addColorStop(1, 'rgba(207,229,241,.18)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // A broad lower body makes the bottom flatter and more cohesive.
  const bodyGrad = ctx.createLinearGradient(0, 250, 0, 365);
  bodyGrad.addColorStop(0, 'rgba(248,252,255,.90)');
  bodyGrad.addColorStop(.64, 'rgba(231,243,250,.88)');
  bodyGrad.addColorStop(1, 'rgba(190,216,232,.28)');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(512, 300, 330, 92, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Soft highlight ridge along the top.
  const highlight = ctx.createLinearGradient(0, 125, 0, 285);
  highlight.addColorStop(0, 'rgba(255,255,255,.34)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(500, 220, 250, 88, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

const textureCache = new Map();

function getCloudTexture(variant) {
  if (!textureCache.has(variant)) {
    textureCache.set(variant, createCloudTexture(variant));
  }

  return textureCache.get(variant);
}

function createCloudSprite({
  variant,
  opacity,
  width,
  height,
  tint = 0xffffff,
}) {
  const material = new THREE.SpriteMaterial({
    map: getCloudTexture(variant),
    color: tint,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
    fog: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1);
  sprite.center.set(.5, .5);

  return sprite;
}

function addCloudLayer(root, rand, config) {
  const {
    count,
    radiusMin,
    radiusMax,
    yMin,
    yMax,
    widthMin,
    widthMax,
    aspectMin,
    aspectMax,
    opacityMin,
    opacityMax,
    speedMin,
    speedMax,
    driftMin,
    driftMax,
    tint,
  } = config;

  for (let i = 0; i < count; i += 1) {
    const width = THREE.MathUtils.lerp(widthMin, widthMax, rand());
    const aspect = THREE.MathUtils.lerp(aspectMin, aspectMax, rand());
    const opacity = THREE.MathUtils.lerp(opacityMin, opacityMax, rand());

    const cloud = createCloudSprite({
      variant: i % 4,
      opacity,
      width,
      height: width * aspect,
      tint,
    });

    const angle = rand() * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(radiusMin, radiusMax, rand());

    cloud.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(yMin, yMax, rand()),
      Math.sin(angle) * radius,
    );

    root.add(cloud);

    root.userData.clouds.push({
      object: cloud,
      baseX: cloud.position.x,
      baseY: cloud.position.y,
      baseZ: cloud.position.z,
      phase: rand() * Math.PI * 2,
      speed: THREE.MathUtils.lerp(speedMin, speedMax, rand()),
      drift: THREE.MathUtils.lerp(driftMin, driftMax, rand()),
      bobSpeed: THREE.MathUtils.lerp(.18, .34, rand()),
      bobAmount: THREE.MathUtils.lerp(.025, .065, rand()),
    });
  }
}

export function createCloudField() {
  const root = new THREE.Group();
  root.name = 'StylizedCloudFieldV2';
  root.userData.clouds = [];

  const rand = seededRandom(911);

  // Large lower clouds create a soft sea beneath the floating island.
  addCloudLayer(root, rand, {
    count: 5,
    radiusMin: 5.8,
    radiusMax: 10.5,
    yMin: -5.2,
    yMax: -3.2,
    widthMin: 5.2,
    widthMax: 8.4,
    aspectMin: .34,
    aspectMax: .44,
    opacityMin: .72,
    opacityMax: .90,
    speedMin: .025,
    speedMax: .042,
    driftMin: .42,
    driftMax: .72,
    tint: 0xf4fbff,
  });

  // Mid-distance clouds frame the scene without cluttering the island.
  addCloudLayer(root, rand, {
    count: 5,
    radiusMin: 10.0,
    radiusMax: 15.5,
    yMin: -1.4,
    yMax: 3.8,
    widthMin: 3.6,
    widthMax: 5.8,
    aspectMin: .32,
    aspectMax: .42,
    opacityMin: .52,
    opacityMax: .72,
    speedMin: .018,
    speedMax: .032,
    driftMin: .32,
    driftMax: .52,
    tint: 0xf1f9ff,
  });

  // Far atmospheric silhouettes.
  addCloudLayer(root, rand, {
    count: 4,
    radiusMin: 16.0,
    radiusMax: 23.0,
    yMin: .4,
    yMax: 5.6,
    widthMin: 4.8,
    widthMax: 7.6,
    aspectMin: .30,
    aspectMax: .38,
    opacityMin: .22,
    opacityMax: .38,
    speedMin: .010,
    speedMax: .020,
    driftMin: .20,
    driftMax: .36,
    tint: 0xe8f5ff,
  });

  root.userData.update = (time) => {
    for (const cloud of root.userData.clouds) {
      const a = time * cloud.speed + cloud.phase;

      cloud.object.position.x =
        cloud.baseX + Math.cos(a) * cloud.drift;

      cloud.object.position.z =
        cloud.baseZ + Math.sin(a) * cloud.drift;

      cloud.object.position.y =
        cloud.baseY +
        Math.sin(time * cloud.bobSpeed + cloud.phase) * cloud.bobAmount;
    }
  };

  return root;
}
