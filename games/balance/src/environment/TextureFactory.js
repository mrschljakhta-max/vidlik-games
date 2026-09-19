import * as THREE from 'three';

function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeCanvas(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function finishTexture(canvas, repeat = [4, 4]) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function noiseDots(ctx, rand, count, palette, alpha = 1) {
  for (let i = 0; i < count; i += 1) {
    const radius = .4 + rand() * 2.2;
    const color = palette[Math.floor(rand() * palette.length)];

    ctx.globalAlpha = alpha * (.28 + rand() * .72);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      rand() * ctx.canvas.width,
      rand() * ctx.canvas.height,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export function createGrassTexture() {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(401);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#668f55');
  gradient.addColorStop(.55, '#587d49');
  gradient.addColorStop(1, '#47683d');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  noiseDots(
    ctx,
    rand,
    5200,
    ['#8eb86f', '#709858', '#3f6339', '#9ebc78', '#355a34'],
    .45,
  );

  ctx.lineWidth = 1;

  for (let i = 0; i < 1150; i += 1) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const length = 2 + rand() * 7;

    ctx.strokeStyle = rand() > .55 ? '#9cbf78' : '#365c35';
    ctx.globalAlpha = .18 + rand() * .28;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - .5) * 2.5, y - length);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  return finishTexture(canvas, [6, 5]);
}

export function createRockTexture() {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(773);

  ctx.fillStyle = '#77756e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  noiseDots(
    ctx,
    rand,
    4700,
    ['#8a887f', '#62645f', '#9a9589', '#555952', '#6d7169'],
    .38,
  );

  for (let i = 0; i < 52; i += 1) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const width = 18 + rand() * 70;
    const height = 8 + rand() * 28;

    ctx.strokeStyle = rand() > .45 ? '#525650' : '#999389';
    ctx.globalAlpha = .20 + rand() * .28;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.strokeRect(x, y, width, height);
  }

  for (let i = 0; i < 90; i += 1) {
    let x = rand() * canvas.width;
    let y = rand() * canvas.height;

    ctx.strokeStyle = '#494d48';
    ctx.globalAlpha = .20 + rand() * .25;
    ctx.lineWidth = .8 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);

    const segments = 2 + Math.floor(rand() * 5);

    for (let j = 0; j < segments; j += 1) {
      x += (rand() - .5) * 28;
      y += 7 + rand() * 22;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  return finishTexture(canvas, [4, 5]);
}

export function createPathTexture() {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(227);

  ctx.fillStyle = '#a39f91';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  noiseDots(
    ctx,
    rand,
    3400,
    ['#b5b09e', '#8f8d83', '#77796f', '#c0b9a3'],
    .42,
  );

  ctx.strokeStyle = '#696b62';
  ctx.globalAlpha = .33;
  ctx.lineWidth = 3;

  for (let x = 0; x <= canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - .5) * 10, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y + (rand() - .5) * 10);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  return finishTexture(canvas, [3, 3]);
}

export function createEnvironmentMaterials(base) {
  const grassMap = createGrassTexture();
  const rockMap = createRockTexture();
  const pathMap = createPathTexture();

  const grass = base.grass.clone();
  grass.map = grassMap;
  grass.color.setHex(0x87ad6f);
  grass.roughness = .98;

  const rock = base.rock.clone();
  rock.map = rockMap;
  rock.color.setHex(0xa09b8f);
  rock.roughness = .92;

  const rockDark = base.rockDark.clone();
  rockDark.map = rockMap.clone();
  rockDark.map.repeat.set(5, 6);
  rockDark.color.setHex(0x77766f);
  rockDark.roughness = .98;

  const path = base.stone.clone();
  path.map = pathMap;
  path.color.setHex(0xb8b3a3);
  path.roughness = .86;

  return {
    grass,
    rock,
    rockDark,
    path,
  };
}
