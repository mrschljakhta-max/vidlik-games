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
  if (!ctx) return null;

  const shadow = ctx.createRadialGradient(512, 340, 32, 512, 340, 360);
  shadow.addColorStop(0, 'rgba(88,132,160,0.18)');
  shadow.addColorStop(0.55, 'rgba(110,146,173,0.10)');
  shadow.addColorStop(1, 'rgba(110,146,173,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(512, 332, 360, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  const variants = [
    [
      [240, 294, 138, 70],
      [358, 244, 164, 110],
      [496, 214, 198, 136],
      [646, 242, 182, 112],
      [782, 292, 136, 68],
    ],
    [
      [220, 304, 126, 62],
      [340, 260, 158, 96],
      [466, 230, 150, 116],
      [586, 210, 170, 132],
      [728, 250, 172, 102],
      [828, 304, 106, 54],
    ],
    [
      [250, 304, 146, 68],
      [388, 252, 182, 104],
      [522, 206, 148, 138],
      [652, 242, 176, 110],
      [790, 292, 124, 62],
    ],
    [
      [232, 298, 138, 66],
      [348, 252, 150, 102],
      [474, 220, 174, 126],
      [612, 216, 148, 118],
      [730, 252, 162, 92],
      [822, 302, 100, 56],
    ],
  ];

  const puffs = variants[variant % variants.length];

  ctx.save();
  ctx.filter = 'blur(2px)';

  puffs.forEach(([x, y, rx, ry]) => {
    const grad = ctx.createRadialGradient(
      x - rx * 0.18,
      y - ry * 0.30,
      ry * 0.08,
      x,
      y,
      Math.max(rx, ry)
    );

    grad.addColorStop(0, 'rgba(255,255,255,0.98)');
    grad.addColorStop(0.58, 'rgba(250,253,255,0.96)');
    grad.addColorStop(0.84, 'rgba(228,242,250,0.88)');
    grad.addColorStop(1, 'rgba(205,226,238,0.16)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const bodyGrad = ctx.createLinearGradient(0, 250, 0, 370);
  bodyGrad.addColorStop(0, 'rgba(248,252,255,0.88)');
  bodyGrad.addColorStop(0.66, 'rgba(231,243,250,0.86)');
  bodyGrad.addColorStop(1, 'rgba(188,214,230,0.24)');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(512, 304, 332, 88, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const highlight = ctx.createLinearGradient(0, 126, 0, 286);
  highlight.addColorStop(0, 'rgba(255,255,255,0.34)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(500, 220, 248, 84, 0, 0, Math.PI * 2);
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

function createCloudSprite({ variant, opacity, width, height, tint = 0xffffff }) {
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
  sprite.center.set(0.5, 0.5);
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
    tiltMin,
    tiltMax,
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
    const baseX = Math.cos(angle) * radius;
    const baseZ = Math.sin(angle) * radius;
    const baseY = THREE.MathUtils.lerp(yMin, yMax, rand());

    cloud.position.set(baseX, baseY, baseZ);
    cloud.material.rotation = THREE.MathUtils.lerp(tiltMin, tiltMax, rand());
    root.add(cloud);

    root.userData.clouds.push({
      object: cloud,
      baseX,
      baseY,
      baseZ,
      phase: rand() * Math.PI * 2,
      speed: THREE.MathUtils.lerp(speedMin, speedMax, rand()),
      driftX: THREE.MathUtils.lerp(driftMin, driftMax, rand()),
      driftZ: THREE.MathUtils.lerp(driftMin * 0.7, driftMax * 0.95, rand()),
      bobSpeed: THREE.MathUtils.lerp(0.16, 0.32, rand()),
      bobAmount: THREE.MathUtils.lerp(0.018, 0.065, rand()),
      rotationSwing: THREE.MathUtils.lerp(0.01, 0.035, rand()),
      opacityPulse: THREE.MathUtils.lerp(0.015, 0.05, rand()),
      baseOpacity: opacity,
    });
  }
}

export function createCloudField() {
  const root = new THREE.Group();
  root.name = 'StylizedCloudFieldV4';
  root.userData.clouds = [];

  const rand = seededRandom(911);

  addCloudLayer(root, rand, {
    count: 6,
    radiusMin: 4.8,
    radiusMax: 9.2,
    yMin: -6.2,
    yMax: -4.0,
    widthMin: 6.4,
    widthMax: 9.8,
    aspectMin: 0.30,
    aspectMax: 0.40,
    opacityMin: 0.76,
    opacityMax: 0.92,
    speedMin: 0.018,
    speedMax: 0.032,
    driftMin: 0.28,
    driftMax: 0.54,
    tiltMin: -0.04,
    tiltMax: 0.04,
    tint: 0xf5fbff,
  });

  addCloudLayer(root, rand, {
    count: 3,
    radiusMin: 10.8,
    radiusMax: 16.8,
    yMin: -0.4,
    yMax: 2.8,
    widthMin: 4.4,
    widthMax: 6.8,
    aspectMin: 0.30,
    aspectMax: 0.39,
    opacityMin: 0.44,
    opacityMax: 0.62,
    speedMin: 0.012,
    speedMax: 0.022,
    driftMin: 0.20,
    driftMax: 0.40,
    tiltMin: -0.035,
    tiltMax: 0.035,
    tint: 0xf0f8ff,
  });

  addCloudLayer(root, rand, {
    count: 2,
    radiusMin: 17.5,
    radiusMax: 24.0,
    yMin: 1.6,
    yMax: 4.8,
    widthMin: 5.8,
    widthMax: 8.4,
    aspectMin: 0.28,
    aspectMax: 0.36,
    opacityMin: 0.16,
    opacityMax: 0.28,
    speedMin: 0.006,
    speedMax: 0.012,
    driftMin: 0.12,
    driftMax: 0.24,
    tiltMin: -0.03,
    tiltMax: 0.03,
    tint: 0xe9f5ff,
  });

  root.userData.update = (time) => {
    for (const cloud of root.userData.clouds) {
      const t = time * cloud.speed + cloud.phase;

      cloud.object.position.x = cloud.baseX + Math.cos(t) * cloud.driftX;
      cloud.object.position.z = cloud.baseZ + Math.sin(t * 0.86) * cloud.driftZ;
      cloud.object.position.y =
        cloud.baseY +
        Math.sin(time * cloud.bobSpeed + cloud.phase) * cloud.bobAmount;

      if (cloud.object.material) {
        cloud.object.material.rotation =
          Math.sin(t * 0.5) * cloud.rotationSwing;

        cloud.object.material.opacity = THREE.MathUtils.clamp(
          cloud.baseOpacity + Math.sin(t * 0.7) * cloud.opacityPulse,
          0.12,
          0.95,
        );
      }
    }
  };

  return root;
}
