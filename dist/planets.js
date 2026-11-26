(() => {
  const tau = 2 * Math.PI;
  const mapWidth = 432;
  const mapHeight = 216;
  const skies = {
    mars: {
      tint: ['#48282e', '#79454c', '#a75349', '#c47d5a', '#dca171'],
      turn: -.63, seed: 38, style: 'rock',
    },
    jupiter: {
      tint: ['#71382d', '#a0503a', '#cb7952', '#e8a473', '#efc89a'],
      turn: .52, seed: 51, style: 'bands',
    },
    neptune: {
      tint: ['#493777', '#4c5ba1', '#4b83b1', '#51b7b8', '#a1d9ca'],
      turn: 1.27, seed: 66, style: 'cloud',
    },
    venus: {
      tint: ['#933f50', '#cd6a67', '#e99776', '#f5c694', '#f9e7b2'],
      turn: -.41, seed: 82, style: 'cloud',
    },
    uranus: {
      tint: ['#4c4388', '#6b69ae', '#9c78c2', '#d299cb', '#e0c6de'],
      turn: -1.45, seed: 91, style: 'cloud',
    },
    saturn: {
      tint: ['#8d3c2b', '#bb5d36', '#d38849', '#e8ac64', '#f1ce8e'],
      turn: .34, seed: 107, style: 'bands', rings: true,
    },
    mercury: {
      tint: ['#3e3943', '#66606a', '#898490', '#b9b4be', '#ded9dc'],
      turn: .65, seed: 126, style: 'rock',
    },
  };

  const figures = new WeakMap();
  const textures = new Map();
  const visible = new Set();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation;
  let lastFrame;
  let seconds = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smooth(value) {
    return value * value * (3 - 2 * value);
  }

  function linear(from, to, amount) {
    return from + (to - from) * amount;
  }

  function randomAt(x, y, z, seed) {
    let value = Math.imul(x + 101, 1597334677) ^ Math.imul(y + 233, 3812015801) ^ Math.imul(z + 353, 2798796415) ^ seed;
    value = Math.imul(value ^ (value >>> 16), 2246822507);
    return ((value ^ (value >>> 15)) >>> 0) / 4294967295;
  }

  function noise(x, y, z, seed) {
    const a = Math.floor(x);
    const b = Math.floor(y);
    const c = Math.floor(z);
    const u = smooth(x - a);
    const v = smooth(y - b);
    const w = smooth(z - c);
    const near = linear(
      linear(randomAt(a, b, c, seed), randomAt(a + 1, b, c, seed), u),
      linear(randomAt(a, b + 1, c, seed), randomAt(a + 1, b + 1, c, seed), u), v,
    );
    const far = linear(
      linear(randomAt(a, b, c + 1, seed), randomAt(a + 1, b, c + 1, seed), u),
      linear(randomAt(a, b + 1, c + 1, seed), randomAt(a + 1, b + 1, c + 1, seed), u), v,
    );
    return linear(near, far, w);
  }

  function surface(x, y, z, longitude, sky) {
    const seed = sky.seed;
    const warp = noise(x * 3, y * 3, z * 3, seed + 61) - .5;
    const wet = noise(x * 4 + warp, y * 4 - warp, z * 4 + warp, seed);
    const pigment = noise(x * 9 + warp, y * 9, z * 9 - warp, seed + 3);
    const mottling = noise(x * 27, y * 27, z * 27, seed + 7);
    if (sky.style === 'bands') {
      const latitude = y + .039 * Math.sin(longitude * 3 + y * 8) + warp * .13;
      const broad = Math.sin(latitude * 19 + .8) * .14;
      const narrow = Math.sin(latitude * 52 + .32 * Math.sin(longitude * 4)) * .075;
      const eye = sky.rings ? 0 : Math.exp(-((x - .32) ** 2 * 14 + (y + .31) ** 2 * 92 + (z - .87) ** 2 * 14)) * .3;
      return .22 + wet * .48 + broad + narrow + (pigment - .5) * .19 + (mottling - .5) * .12 - eye;
    }
    if (sky.style === 'rock') {
      const blooms = smooth(clamp((wet + warp * .25 - .23) * 1.8, 0, 1));
      const edge = 1 - Math.abs(Math.sin(blooms * Math.PI));
      return .1 + blooms * .7 + (pigment - .5) * (.22 + edge * .17) + (mottling - .5) * .22;
    }
    const clouds = smooth(clamp((wet - .23) * 1.9, 0, 1));
    const flow = Math.sin(y * 7 + z * 4 + warp * 3.8) * .075;
    return .15 + clouds * .7 + flow + (pigment - .5) * .27 + (mottling - .5) * .14;
  }

  function textureFor(mode) {
    const known = textures.get(mode);
    if (known) return known;
    const sky = skies[mode];
    const colors = sky.tint.map(color => [
      Number.parseInt(color.slice(1, 3), 16),
      Number.parseInt(color.slice(3, 5), 16),
      Number.parseInt(color.slice(5, 7), 16),
    ]);
    const map = new Uint8ClampedArray(mapWidth * mapHeight * 3);

    for (let row = 0; row < mapHeight; row++) {
      const latitude = Math.PI * (.5 - row / (mapHeight - 1));
      const y = Math.sin(latitude);
      const diameter = Math.cos(latitude);
      for (let col = 0; col < mapWidth; col++) {
        const longitude = (col / mapWidth - .5) * tau;
        const x = Math.sin(longitude) * diameter;
        const z = Math.cos(longitude) * diameter;
        const proportion = clamp(surface(x, y, z, longitude, sky) * (colors.length - 1), 0, colors.length - 1);
        const index = Math.min(colors.length - 2, Math.floor(proportion));
        const amount = proportion - index;
        const target = (row * mapWidth + col) * 3;
        for (let channel = 0; channel < 3; channel++) {
          map[target + channel] = linear(colors[index][channel], colors[index + 1][channel], amount);
        }
      }
    }

    textures.set(mode, map);
    return map;
  }

  function drawRings(ctx, centerX, centerY, radius, foreground) {
    const slant = -.24;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(slant);
    const stripes = [
      [1.24, '#b2988b83', 1.4], [1.32, '#f4ce9da8', 3.1],
      [1.44, '#dbb0858c', 4.5], [1.55, '#d3a681a0', 2.8], [1.62, '#edc69a52', 1],
    ];
    const direction = foreground ? 0 : Math.PI;
    for (const [width, color, stroke] of stripes) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * width, radius * width * .235, 0, direction, direction + Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = radius * stroke * .012;
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(figure, time) {
    if (!figure.image) return;
    const map = textureFor(figure.mode);
    const position = figure.sky.turn + time * .042;
    const turn = (position / tau * mapWidth) % mapWidth;
    const output = figure.image.data;

    for (const { index, row, longitude, shade, grain } of figure.points) {
      const column = (longitude + turn + mapWidth) % mapWidth;
      const left = Math.floor(column);
      const p = row + left * 3;
      const q = row + (left + 1 === mapWidth ? 0 : (left + 1) * 3);
      const blend = column - left;
      output[index] = linear(map[p], map[q], blend) * shade + grain;
      output[index + 1] = linear(map[p + 1], map[q + 1], blend) * shade + grain;
      output[index + 2] = linear(map[p + 2], map[q + 2], blend) * shade + grain;
    }

    const { canvas, context, raster, brush, radius } = figure;
    brush.putImageData(figure.image, 0, 0);
    const diameter = radius * 2;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (figure.sky.rings) drawRings(context, x, y, radius, false);
    context.drawImage(raster, x - radius, y - radius, diameter, diameter);
    if (figure.sky.rings) drawRings(context, x, y, radius, true);
  }

  function resize(figure) {
    const { canvas, raster, brush, sky } = figure;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(bounds.width * ratio);
    const height = Math.round(bounds.height * ratio);
    if (canvas.width === width && canvas.height === height && figure.image) return;
    canvas.width = width;
    canvas.height = height;
    figure.radius = Math.min(width, height) * (sky.rings ? .295 : .492);

    const side = Math.max(1, Math.round(Math.min(figure.radius * 2, 400)));
    raster.width = raster.height = side;
    figure.image = brush.createImageData(side, side);
    figure.points = [];
    const radius = side / 2;
    const slant = (sky.style === 'bands' ? -10 : 17) * Math.PI / 180;
    const cosine = Math.cos(slant);
    const sine = Math.sin(slant);
    for (let y = 0; y < side; y++) {
      const vertical = (radius - y - .5) / radius;
      for (let x = 0; x < side; x++) {
        const horizontal = (x + .5 - radius) / radius;
        const squared = vertical * vertical + horizontal * horizontal;
        const coverage = clamp((1 - squared) * radius * .66 + .5, 0, 1);
        if (!coverage) continue;
        const z = Math.sqrt(Math.max(0, 1 - squared));
        const px = horizontal * cosine - vertical * sine;
        const py = horizontal * sine + vertical * cosine;
        const longitude = (Math.atan2(px, z) / tau + .5) * mapWidth;
        const latitude = Math.asin(clamp(py, -1, 1));
        const row = Math.round((.5 - latitude / Math.PI) * (mapHeight - 1)) * mapWidth * 3;
        const shade = .92 + .09 * z + .07 * vertical - .05 * horizontal;
        const grain = (randomAt(x, y, 0, sky.seed) - .5) * (7 + 17 * randomAt(x >>> 2, y >>> 2, 2, sky.seed));
        const index = (y * side + x) * 4;

        figure.image.data[index + 3] = Math.round(255 * coverage);
        figure.points.push({ index, row, longitude, shade, grain });
      }
    }
    draw(figure, reduced.matches ? 0 : seconds);
  }

  function updatePlayback() {
    if (!document.hidden && !reduced.matches && visible.size) {
      if (!animation) {
        lastFrame = 0;
        animation = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(animation);
      animation = undefined;
    }
  }

  function tick(now) {
    if (!lastFrame) lastFrame = now;
    const delta = now - lastFrame;
    if (delta >= 68) {
      seconds += Math.min(delta, 160) / 1000;
      lastFrame = now;
      for (const figure of visible) draw(figure, seconds);
    }
    animation = requestAnimationFrame(tick);
  }

  const boundsObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const figure = figures.get(entry.target);
      if (figure) resize(figure);
    }
  });

  const viewportObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const figure = figures.get(entry.target);
      if (!figure) continue;
      if (entry.isIntersecting) visible.add(figure);
      else visible.delete(figure);
    }
    updatePlayback();
  });

  document.addEventListener('visibilitychange', updatePlayback);
  reduced.addEventListener('change', () => {
    if (reduced.matches) for (const figure of visible) draw(figure, 0);
    updatePlayback();
  });

  window.paintPlanet = function paintPlanet(canvas, planet) {
    const mode = typeof planet === 'string' ? planet.toLowerCase() : '';
    if (!canvas || !Object.hasOwn(skies, mode)) return () => {};
    const previous = figures.get(canvas);
    if (previous?.mode === mode) return previous.stop;
    previous?.stop();

    const context = canvas.getContext('2d');
    if (!context) return () => {};
    const raster = document.createElement('canvas');
    const brush = raster.getContext('2d');
    const figure = { canvas, context, raster, brush, mode, sky: skies[mode] };

    figure.stop = () => {
      if (figures.get(canvas) !== figure) return;
      figures.delete(canvas);
      visible.delete(figure);
      boundsObserver.unobserve(canvas);
      viewportObserver.unobserve(canvas);
      updatePlayback();
    };
    figures.set(canvas, figure);
    boundsObserver.observe(canvas);
    viewportObserver.observe(canvas);
    resize(figure);
    return figure.stop;
  };
})();
