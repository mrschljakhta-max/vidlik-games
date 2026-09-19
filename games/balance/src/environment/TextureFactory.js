import * as THREE from 'three';

let cachedTextureSet = null;

function seededRandom(seed = 1) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createCanvas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function finishColorTexture(canvas, repeat = [1, 1]) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function finishDataTexture(canvas, repeat = [1, 1]) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function scatterDots(
  ctx,
  rand,
  count,
  palette,
  alphaMin = .05,
  alphaMax = .25,
  radiusMin = .5,
  radiusMax = 5,
) {
  const { width, height } = ctx.canvas;

  for (let i = 0; i < count; i += 1) {
    const radius = radiusMin + rand() * (radiusMax - radiusMin);
    const color = palette[Math.floor(rand() * palette.length)];

    ctx.globalAlpha = alphaMin + rand() * (alphaMax - alphaMin);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      rand() * width,
      rand() * height,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawCracks(
  ctx,
  rand,
  count,
  color,
  alpha = .22,
  widthMin = .6,
  widthMax = 2,
  segmentMin = 2,
  segmentMax = 6,
  lengthMin = 8,
  lengthMax = 34,
) {
  const { width, height } = ctx.canvas;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < count; i += 1) {
    let x = rand() * width;
    let y = rand() * height;

    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * (.55 + rand() * .65);
    ctx.lineWidth = widthMin + rand() * (widthMax - widthMin);

    ctx.beginPath();
    ctx.moveTo(x, y);

    const segments =
      segmentMin +
      Math.floor(rand() * (segmentMax - segmentMin + 1));

    let angle = rand() * Math.PI * 2;

    for (let segment = 0; segment < segments; segment += 1) {
      angle += (rand() - .5) * 1.15;
      const distance =
        lengthMin + rand() * (lengthMax - lengthMin);

      x += Math.cos(angle) * distance;
      y += Math.sin(angle) * distance;
      ctx.lineTo(x, y);

      if (segment > 0 && rand() > .62) {
        const bx = x + (rand() - .5) * distance * .65;
        const by = y + (rand() - .5) * distance * .65;

        ctx.moveTo(x, y);
        ctx.lineTo(bx, by);
        ctx.moveTo(x, y);
      }
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawSoftStains(ctx, rand, count, palette, radiusMin = 18, radiusMax = 95) {
  const { width, height } = ctx.canvas;

  for (let i = 0; i < count; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const radius = radiusMin + rand() * (radiusMax - radiusMin);
    const color = palette[Math.floor(rand() * palette.length)];

    const gradient = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      radius,
    );

    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStoneJoints(
  ctx,
  rand,
  columns,
  rows,
  color,
  alpha = .28,
  lineWidth = 2.5,
) {
  const { width, height } = ctx.canvas;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineWidth;

  for (let row = 0; row < rows; row += 1) {
    const y = row * cellHeight + (rand() - .5) * 8;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (rand() - .5) * 8);
    ctx.stroke();

    const offset = row % 2 ? cellWidth * .5 : 0;

    for (let column = 0; column <= columns; column += 1) {
      const x =
        column * cellWidth +
        offset +
        (rand() - .5) * 7;

      ctx.beginPath();
      ctx.moveTo(x, y - 2);
      ctx.lineTo(
        x + (rand() - .5) * 5,
        y + cellHeight + 2,
      );
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

function drawMossSpeckles(ctx, rand, count, alphaScale = 1) {
  const palette = [
    'rgba(74,108,48,.20)',
    'rgba(92,130,55,.16)',
    'rgba(51,83,40,.17)',
    'rgba(125,145,69,.11)',
  ];

  for (let i = 0; i < count; i += 1) {
    const color = palette[Math.floor(rand() * palette.length)];
    const radius = 1 + rand() * 8;

    ctx.fillStyle = color.replace(
      /\.(\d+)\)/,
      (match) => match,
    );
    ctx.globalAlpha = (.22 + rand() * .5) * alphaScale;
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

function createGrayCanvas(fill = 180, size = 1024) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `rgb(${fill}, ${fill}, ${fill})`;
  ctx.fillRect(0, 0, size, size);

  return { canvas, ctx };
}

function createArchitecturalStoneMaps() {
  const size = 1024;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(1101);

  const gradient = colorCtx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#d0c6b5');
  gradient.addColorStop(.44, '#b7ad9d');
  gradient.addColorStop(1, '#988f83');

  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, size, size);

  scatterDots(
    colorCtx,
    colorRand,
    17500,
    ['#e0d6c5', '#c7bdad', '#9d9487', '#81796f', '#b2a899'],
    .025,
    .16,
    .5,
    4.5,
  );

  drawSoftStains(
    colorCtx,
    colorRand,
    145,
    [
      'rgba(89,82,74,.08)',
      'rgba(140,126,102,.06)',
      'rgba(70,92,54,.045)',
    ],
    18,
    92,
  );

  drawStoneJoints(
    colorCtx,
    colorRand,
    6,
    7,
    '#756e64',
    .16,
    2.3,
  );

  drawCracks(
    colorCtx,
    colorRand,
    155,
    '#635d55',
    .16,
    .6,
    1.7,
    2,
    5,
    6,
    24,
  );

  drawMossSpeckles(colorCtx, colorRand, 420, .38);

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(184, size);
  const bumpRand = seededRandom(1102);

  scatterDots(
    bumpCtx,
    bumpRand,
    19000,
    ['#8b8b8b', '#bebebe', '#e0e0e0', '#656565'],
    .03,
    .14,
    .5,
    4,
  );

  drawStoneJoints(
    bumpCtx,
    bumpRand,
    6,
    7,
    '#6d6d6d',
    .20,
    3,
  );

  drawCracks(
    bumpCtx,
    bumpRand,
    175,
    '#4d4d4d',
    .26,
    .8,
    2.2,
    2,
    6,
    7,
    28,
  );

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(218, size);
  const roughRand = seededRandom(1103);

  scatterDots(
    roughCtx,
    roughRand,
    15000,
    ['#b5b5b5', '#dddddd', '#969696', '#efefef'],
    .025,
    .12,
    .5,
    4,
  );

  drawSoftStains(
    roughCtx,
    roughRand,
    105,
    [
      'rgba(70,70,70,.07)',
      'rgba(230,230,230,.06)',
    ],
    20,
    70,
  );

  return {
    color: finishColorTexture(colorCanvas, [2.35, 2.35]),
    bump: finishDataTexture(bumpCanvas, [2.35, 2.35]),
    rough: finishDataTexture(roughCanvas, [2.35, 2.35]),
  };
}

function createCliffStoneMaps() {
  const size = 1024;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(2201);

  const gradient = colorCtx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#8b8274');
  gradient.addColorStop(.48, '#6b645b');
  gradient.addColorStop(1, '#4b4742');

  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, size, size);

  scatterDots(
    colorCtx,
    colorRand,
    21000,
    ['#9d9383', '#746c62', '#544f49', '#403c38', '#877e72'],
    .025,
    .14,
    .5,
    4.5,
  );

  for (let i = 0; i < 360; i += 1) {
    const x = colorRand() * size;
    const y = colorRand() * size;
    const length = 28 + colorRand() * 185;

    colorCtx.strokeStyle =
      colorRand() > .5 ? '#9a8f7f' : '#49443f';
    colorCtx.globalAlpha = .035 + colorRand() * .07;
    colorCtx.lineWidth = .8 + colorRand() * 2.4;
    colorCtx.beginPath();
    colorCtx.moveTo(x, y);
    colorCtx.lineTo(
      x + (colorRand() - .5) * 10,
      y + length,
    );
    colorCtx.stroke();
  }

  colorCtx.globalAlpha = 1;

  drawCracks(
    colorCtx,
    colorRand,
    185,
    '#332f2c',
    .22,
    .8,
    2.4,
    2,
    7,
    8,
    34,
  );

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(170, size);
  const bumpRand = seededRandom(2202);

  scatterDots(
    bumpCtx,
    bumpRand,
    22000,
    ['#bdbdbd', '#909090', '#606060', '#d8d8d8'],
    .03,
    .15,
    .5,
    4.5,
  );

  for (let i = 0; i < 330; i += 1) {
    const x = bumpRand() * size;
    const y = bumpRand() * size;
    const length = 35 + bumpRand() * 190;

    bumpCtx.strokeStyle =
      bumpRand() > .5 ? '#a4a4a4' : '#5a5a5a';
    bumpCtx.globalAlpha = .04 + bumpRand() * .09;
    bumpCtx.lineWidth = 1 + bumpRand() * 2.2;
    bumpCtx.beginPath();
    bumpCtx.moveTo(x, y);
    bumpCtx.lineTo(
      x + (bumpRand() - .5) * 9,
      y + length,
    );
    bumpCtx.stroke();
  }

  bumpCtx.globalAlpha = 1;

  drawCracks(
    bumpCtx,
    bumpRand,
    200,
    '#474747',
    .27,
    .8,
    2.6,
    2,
    7,
    8,
    38,
  );

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(232, size);
  const roughRand = seededRandom(2203);

  scatterDots(
    roughCtx,
    roughRand,
    18000,
    ['#c3c3c3', '#ececec', '#9b9b9b'],
    .02,
    .10,
    .5,
    4,
  );

  return {
    color: finishColorTexture(colorCanvas, [2.7, 3.4]),
    bump: finishDataTexture(bumpCanvas, [2.7, 3.4]),
    rough: finishDataTexture(roughCanvas, [2.7, 3.4]),
  };
}

function createPathStoneMaps() {
  const size = 1024;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(3301);

  colorCtx.fillStyle = '#b9ae9b';
  colorCtx.fillRect(0, 0, size, size);

  scatterDots(
    colorCtx,
    colorRand,
    15000,
    ['#d1c4ae', '#aaa08f', '#8f877b', '#c0b5a2'],
    .025,
    .15,
    .5,
    4.5,
  );

  drawStoneJoints(
    colorCtx,
    colorRand,
    5,
    5,
    '#756d61',
    .32,
    3.2,
  );

  drawCracks(
    colorCtx,
    colorRand,
    95,
    '#5f584f',
    .18,
    .7,
    1.9,
    2,
    5,
    6,
    21,
  );

  drawSoftStains(
    colorCtx,
    colorRand,
    80,
    [
      'rgba(90,77,60,.08)',
      'rgba(72,101,55,.05)',
    ],
    15,
    55,
  );

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(190, size);
  const bumpRand = seededRandom(3302);

  scatterDots(
    bumpCtx,
    bumpRand,
    16000,
    ['#d8d8d8', '#9a9a9a', '#676767'],
    .03,
    .14,
    .5,
    4,
  );

  drawStoneJoints(
    bumpCtx,
    bumpRand,
    5,
    5,
    '#686868',
    .28,
    3.5,
  );

  drawCracks(
    bumpCtx,
    bumpRand,
    105,
    '#484848',
    .26,
    .8,
    2,
    2,
    5,
    6,
    24,
  );

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(208, size);
  const roughRand = seededRandom(3303);

  scatterDots(
    roughCtx,
    roughRand,
    12500,
    ['#d7d7d7', '#a4a4a4', '#eeeeee'],
    .02,
    .11,
    .5,
    3.5,
  );

  return {
    color: finishColorTexture(colorCanvas, [2.1, 2.1]),
    bump: finishDataTexture(bumpCanvas, [2.1, 2.1]),
    rough: finishDataTexture(roughCanvas, [2.1, 2.1]),
  };
}

function createGrassMaps() {
  const size = 1024;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(4401);

  const gradient = colorCtx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#86ad68');
  gradient.addColorStop(.5, '#6f9958');
  gradient.addColorStop(1, '#577c46');

  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, size, size);

  scatterDots(
    colorCtx,
    colorRand,
    20000,
    ['#9bc47a', '#7ba361', '#4f783e', '#a9cf84', '#3f6735'],
    .02,
    .11,
    .5,
    3.5,
  );

  for (let i = 0; i < 4000; i += 1) {
    const x = colorRand() * size;
    const y = colorRand() * size;
    const length = 3 + colorRand() * 11;

    colorCtx.strokeStyle =
      colorRand() > .55 ? '#b1d78e' : '#456d39';
    colorCtx.globalAlpha = .04 + colorRand() * .11;
    colorCtx.lineWidth = .65 + colorRand() * .65;
    colorCtx.beginPath();
    colorCtx.moveTo(x, y);
    colorCtx.lineTo(
      x + (colorRand() - .5) * 3,
      y - length,
    );
    colorCtx.stroke();
  }

  colorCtx.globalAlpha = 1;

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(174, size);
  const bumpRand = seededRandom(4402);

  scatterDots(
    bumpCtx,
    bumpRand,
    20000,
    ['#8a8a8a', '#c7c7c7', '#5e5e5e'],
    .02,
    .10,
    .5,
    3,
  );

  for (let i = 0; i < 3600; i += 1) {
    const x = bumpRand() * size;
    const y = bumpRand() * size;
    const length = 2 + bumpRand() * 8;

    bumpCtx.strokeStyle =
      bumpRand() > .5 ? '#c0c0c0' : '#696969';
    bumpCtx.globalAlpha = .035 + bumpRand() * .08;
    bumpCtx.lineWidth = .7;
    bumpCtx.beginPath();
    bumpCtx.moveTo(x, y);
    bumpCtx.lineTo(
      x + (bumpRand() - .5) * 2,
      y - length,
    );
    bumpCtx.stroke();
  }

  bumpCtx.globalAlpha = 1;

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(186, size);
  const roughRand = seededRandom(4403);

  scatterDots(
    roughCtx,
    roughRand,
    14000,
    ['#a2a2a2', '#d7d7d7', '#777777'],
    .02,
    .09,
    .5,
    3,
  );

  return {
    color: finishColorTexture(colorCanvas, [4.8, 4.8]),
    bump: finishDataTexture(bumpCanvas, [4.8, 4.8]),
    rough: finishDataTexture(roughCanvas, [4.8, 4.8]),
  };
}

function createDoorWoodMaps() {
  const size = 1024;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(5501);

  const gradient = colorCtx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, '#3f2a1f');
  gradient.addColorStop(.48, '#6b4730');
  gradient.addColorStop(1, '#34231b');

  colorCtx.fillStyle = gradient;
  colorCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1100; i += 1) {
    const y = colorRand() * size;
    const phase = colorRand() * Math.PI * 2;

    colorCtx.strokeStyle =
      colorRand() > .5 ? '#845b3d' : '#2c1d17';
    colorCtx.globalAlpha = .025 + colorRand() * .075;
    colorCtx.lineWidth = .8 + colorRand() * 1.7;

    colorCtx.beginPath();

    for (let x = 0; x <= size; x += 24) {
      const yy =
        y +
        Math.sin(x / 70 + phase) *
          (1 + colorRand() * 4);

      if (x === 0) {
        colorCtx.moveTo(x, yy);
      } else {
        colorCtx.lineTo(x, yy);
      }
    }

    colorCtx.stroke();
  }

  colorCtx.globalAlpha = 1;

  scatterDots(
    colorCtx,
    colorRand,
    6500,
    ['#8c6245', '#2f2119', '#714a33'],
    .02,
    .10,
    .5,
    3.5,
  );

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(154, size);
  const bumpRand = seededRandom(5502);

  for (let i = 0; i < 1100; i += 1) {
    const y = bumpRand() * size;
    const phase = bumpRand() * Math.PI * 2;

    bumpCtx.strokeStyle =
      bumpRand() > .5 ? '#a7a7a7' : '#5f5f5f';
    bumpCtx.globalAlpha = .025 + bumpRand() * .07;
    bumpCtx.lineWidth = .8 + bumpRand() * 1.7;

    bumpCtx.beginPath();

    for (let x = 0; x <= size; x += 24) {
      const yy =
        y +
        Math.sin(x / 70 + phase) *
          (1 + bumpRand() * 4);

      if (x === 0) {
        bumpCtx.moveTo(x, yy);
      } else {
        bumpCtx.lineTo(x, yy);
      }
    }

    bumpCtx.stroke();
  }

  bumpCtx.globalAlpha = 1;

  scatterDots(
    bumpCtx,
    bumpRand,
    6200,
    ['#b8b8b8', '#676767'],
    .02,
    .09,
    .5,
    3,
  );

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(174, size);
  const roughRand = seededRandom(5503);

  scatterDots(
    roughCtx,
    roughRand,
    8500,
    ['#d0d0d0', '#969696', '#b5b5b5'],
    .02,
    .09,
    .5,
    3,
  );

  return {
    color: finishColorTexture(colorCanvas, [1.5, 1.5]),
    bump: finishDataTexture(bumpCanvas, [1.5, 1.5]),
    rough: finishDataTexture(roughCanvas, [1.5, 1.5]),
  };
}

function createEarthMaps() {
  const size = 768;

  const colorCanvas = createCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const colorRand = seededRandom(6601);

  colorCtx.fillStyle = '#5b5145';
  colorCtx.fillRect(0, 0, size, size);

  scatterDots(
    colorCtx,
    colorRand,
    12000,
    ['#746658', '#4e463c', '#655849', '#857566'],
    .025,
    .13,
    .5,
    4,
  );

  drawSoftStains(
    colorCtx,
    colorRand,
    90,
    [
      'rgba(42,36,31,.08)',
      'rgba(98,82,63,.08)',
    ],
    12,
    58,
  );

  const { canvas: bumpCanvas, ctx: bumpCtx } =
    createGrayCanvas(160, size);
  const bumpRand = seededRandom(6602);

  scatterDots(
    bumpCtx,
    bumpRand,
    13000,
    ['#c0c0c0', '#8a8a8a', '#595959'],
    .02,
    .11,
    .5,
    3.5,
  );

  const { canvas: roughCanvas, ctx: roughCtx } =
    createGrayCanvas(238, size);
  const roughRand = seededRandom(6603);

  scatterDots(
    roughCtx,
    roughRand,
    9000,
    ['#ececec', '#bbbbbb', '#d3d3d3'],
    .02,
    .08,
    .5,
    3,
  );

  return {
    color: finishColorTexture(colorCanvas, [4.2, 4.2]),
    bump: finishDataTexture(bumpCanvas, [4.2, 4.2]),
    rough: finishDataTexture(roughCanvas, [4.2, 4.2]),
  };
}

function getTextureSet() {
  if (cachedTextureSet) return cachedTextureSet;

  cachedTextureSet = {
    stone: createArchitecturalStoneMaps(),
    cliff: createCliffStoneMaps(),
    path: createPathStoneMaps(),
    grass: createGrassMaps(),
    door: createDoorWoodMaps(),
    earth: createEarthMaps(),
  };

  return cachedTextureSet;
}

function decorateMaterial(material, maps, options = {}) {
  const {
    bumpScale = .06,
    roughness = .92,
    color = null,
    envMapIntensity = .15,
  } = options;

  material.map = maps.color;
  material.bumpMap = maps.bump;
  material.bumpScale = bumpScale;
  material.roughnessMap = maps.rough;
  material.roughness = roughness;

  if (color !== null) {
    material.color.setHex(color);
  }

  if ('envMapIntensity' in material) {
    material.envMapIntensity = envMapIntensity;
  }

  material.needsUpdate = true;
  return material;
}

export function createEnvironmentMaterials(base) {
  const textures = getTextureSet();

  const grass = decorateMaterial(
    base.grass.clone(),
    textures.grass,
    {
      bumpScale: .035,
      roughness: .99,
      color: 0x91b676,
      envMapIntensity: .08,
    },
  );

  const rock = decorateMaterial(
    base.rock.clone(),
    textures.stone,
    {
      bumpScale: .095,
      roughness: .95,
      color: 0xb9ae9e,
      envMapIntensity: .12,
    },
  );

  const rockDark = decorateMaterial(
    base.rockDark.clone(),
    textures.cliff,
    {
      bumpScale: .13,
      roughness: .99,
      color: 0x82796d,
      envMapIntensity: .08,
    },
  );

  const stone = decorateMaterial(
    base.stone.clone(),
    textures.stone,
    {
      bumpScale: .085,
      roughness: .92,
      color: 0xc4b8a7,
      envMapIntensity: .15,
    },
  );

  const path = decorateMaterial(
    base.stone.clone(),
    textures.path,
    {
      bumpScale: .07,
      roughness: .93,
      color: 0xc0b39f,
      envMapIntensity: .11,
    },
  );

  const door = decorateMaterial(
    base.door.clone(),
    textures.door,
    {
      bumpScale: .055,
      roughness: .88,
      color: 0x6c4932,
      envMapIntensity: .08,
    },
  );

  const earth = decorateMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x5b5145,
      roughness: 1,
      metalness: 0,
    }),
    textures.earth,
    {
      bumpScale: .075,
      roughness: 1,
      color: 0x65594b,
      envMapIntensity: .04,
    },
  );

  return {
    grass,
    rock,
    rockDark,
    stone,
    path,
    door,
    earth,
  };
}
