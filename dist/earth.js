(() => {
  const radians = Math.PI / 180;
  const tau = Math.PI * 2;
  const textureWidth = 720;
  const textureHeight = 360;
  // Low-resolution, hand-drawn coastlines for the globe's light map.
  const coasts = [
    // North America
    [[-168,65],[-160,71],[-145,71],[-136,69],[-129,71],[-120,71],[-112,69],[-107,72],[-96,73],[-91,70],[-84,71],[-82,65],[-88,62],[-94,58],[-87,54],[-80,54],[-78,61],[-70,61],[-66,57],[-62,55],[-57,53],[-53,48],[-60,46],[-67,45],[-70,40],[-74,39],[-76,35],[-81,30],[-80,25],[-83,25],[-85,30],[-91,29],[-96,26],[-97,21],[-92,19],[-88,20],[-86,17],[-88,15],[-84,13],[-83,9],[-78,8],[-78,10],[-81,10],[-84,10],[-89,13],[-96,16],[-102,19],[-106,23],[-109,28],[-115,31],[-118,33],[-121,37],[-124,42],[-126,49],[-130,53],[-135,57],[-140,61],[-147,60],[-152,58],[-158,57],[-167,55],[-164,60],[-169,60]],
    // South America
    [[-79,9],[-72,12],[-67,10],[-62,11],[-60,8],[-53,5],[-49,0],[-44,-2],[-37,-5],[-34,-9],[-39,-15],[-39,-19],[-42,-23],[-48,-28],[-51,-32],[-57,-36],[-62,-39],[-64,-43],[-65,-48],[-69,-54],[-74,-53],[-75,-48],[-75,-41],[-72,-34],[-72,-27],[-70,-20],[-75,-16],[-77,-10],[-80,-5],[-81,1],[-77,4]],
    // Greenland and northern islands
    [[-73,78],[-66,81],[-54,83],[-29,83],[-17,81],[-18,77],[-21,73],[-24,69],[-38,66],[-43,60],[-50,63],[-52,69],[-56,74],[-67,76]],
    [[-96,76],[-92,81],[-80,82],[-69,80],[-68,76],[-74,74],[-83,74],[-90,76]],
    [[-108,74],[-113,78],[-104,80],[-97,78],[-99,74]],
    [[-25,64],[-22,66],[-15,66],[-13,64],[-18,63]],
    [[-10,51],[-7,56],[-5,58],[-1,57],[0,54],[2,52],[1,50],[-6,50]],
    [[-11,52],[-10,55],[-6,55],[-6,52]],
    // Africa
    [[-17,14],[-16,21],[-11,29],[-8,33],[-3,36],[8,36],[13,34],[21,32],[29,31],[33,30],[36,25],[38,19],[43,12],[51,12],[49,7],[44,2],[41,-3],[39,-7],[40,-12],[40,-16],[35,-22],[33,-28],[28,-33],[20,-35],[17,-32],[15,-27],[12,-20],[12,-15],[12,-9],[8,-4],[9,2],[4,5],[-1,5],[-6,4],[-11,7],[-15,11]],
    // Europe and Asia
    [[-10,36],[-9,43],[-2,44],[1,47],[-4,48],[1,50],[7,53],[10,54],[9,58],[5,61],[6,66],[14,69],[23,71],[29,70],[33,65],[35,69],[44,69],[51,68],[58,69],[66,73],[80,73],[95,76],[112,74],[129,73],[139,72],[152,72],[161,70],[169,68],[179,68],[179,64],[170,63],[161,60],[159,53],[154,52],[151,60],[145,59],[139,55],[139,50],[135,45],[130,42],[128,37],[125,39],[121,37],[121,31],[119,25],[112,21],[108,19],[106,21],[106,16],[109,11],[106,8],[102,11],[101,15],[99,11],[102,4],[103,1],[99,3],[97,8],[98,16],[95,19],[91,22],[89,22],[87,20],[82,16],[80,9],[77,8],[74,15],[72,20],[67,24],[61,25],[56,26],[54,23],[56,20],[51,16],[46,13],[43,13],[43,16],[41,20],[38,22],[35,28],[36,32],[34,35],[28,37],[26,40],[27,42],[22,40],[20,37],[19,40],[14,44],[12,44],[13,41],[16,39],[15,37],[13,38],[10,43],[8,44],[5,43],[3,42],[-1,39],[-2,36]],
    [[130,30],[129,32],[132,34],[136,35],[141,40],[144,43],[146,44],[145,41],[142,38],[138,34],[135,33]],
    [[43,-12],[49,-13],[50,-17],[47,-23],[44,-25],[43,-20]],
    [[111,-8],[106,-6],[100,0],[95,5],[96,2],[99,-4],[104,-7]],
    [[109,3],[115,7],[118,5],[116,0],[114,-4],[109,-2]],
    [[137,-4],[141,-2],[147,-6],[150,-10],[145,-9],[141,-9]],
    // Australia and New Zealand
    [[113,-22],[114,-16],[122,-14],[129,-14],[136,-12],[137,-16],[141,-16],[144,-12],[146,-17],[147,-22],[152,-25],[153,-29],[150,-35],[146,-39],[140,-38],[135,-34],[131,-31],[125,-33],[117,-34],[114,-31]],
    [[166,-46],[170,-43],[174,-40],[176,-37],[178,-38],[178,-42],[173,-43],[168,-47]],
    [[-180,-74],[-150,-72],[-126,-74],[-102,-72],[-80,-71],[-65,-64],[-58,-72],[-31,-75],[-4,-70],[30,-70],[55,-67],[82,-67],[110,-66],[145,-70],[179,-75],[179,-89],[-180,-89]],
  ];

  const smooth = (start, end, number) => {
    const fraction = Math.max(0, Math.min(1, (number - start) / (end - start)));
    return fraction * fraction * (3 - 2 * fraction);
  };
  const lerp = (from, to, fraction) => from + (to - from) * fraction;

  function makeTexture() {
    const mask = document.createElement('canvas');
    mask.width = textureWidth;
    mask.height = textureHeight;
    const ink = mask.getContext('2d');
    for (const coast of coasts) {
      ink.beginPath();
      for (const [longitude, latitude] of coast) {
        ink.lineTo((longitude + 180) * 2, (90 - latitude) * 2);
      }
      ink.closePath();
      ink.fill();
    }

    const blur = document.createElement('canvas');
    blur.width = textureWidth;
    blur.height = textureHeight;
    const soft = blur.getContext('2d');
    soft.filter = 'blur(4px)';
    soft.drawImage(mask, -textureWidth, 0);
    soft.drawImage(mask, 0, 0);
    soft.drawImage(mask, textureWidth, 0);
    const map = soft.getImageData(0, 0, textureWidth, textureHeight).data;
    const texture = new Uint8ClampedArray(textureWidth * textureHeight * 3);

    for (let y = 0; y < textureHeight; y++) {
      for (let x = 0; x < textureWidth; x++) {
        const position = y * textureWidth + x;
        const u = x / textureWidth * tau;
        const v = y / textureHeight * Math.PI;
        const land = map[position * 4 + 3] / 255;
        const variation = Math.sin(u * 9 + v * 7) * Math.cos(v * 14 - u * 3)
          + Math.sin(u * 17 - v * 10 + .9) * .45
          + Math.cos(u * 31 + v * 19) * .19;
        const vegetation = smooth(.70, .99, land) * smooth(-.42, .76, variation);
        const ocean = Math.sin(u * 7 - v * 5) * Math.sin(v * 9 + u * 2) * 2.8;
        const coast = smooth(.06, .91, land);
        texture[position * 3] = lerp(41 + ocean, lerp(189, 105, vegetation), coast);
        texture[position * 3 + 1] = lerp(76 + ocean, lerp(167, 188, vegetation), coast);
        texture[position * 3 + 2] = lerp(239 + ocean, lerp(238, 126, vegetation), coast);
      }
    }
    return texture;
  }

  const texture = makeTexture();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const latitudeTilt = 10 * radians;
  const sinTilt = Math.sin(latitudeTilt);
  const cosTilt = Math.cos(latitudeTilt);

  function createGlobe(canvas, mode) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const isLoader = mode === 'loader';
    const isSky = mode === 'sky';
    const isStrip = mode === 'dock' || isSky;
    const raster = document.createElement('canvas');
    const graphics = raster.getContext('2d');
    let image;
    let points = [];
    let frame = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let onscreen = true;

    function resize() {
      const size = canvas.getBoundingClientRect();
      if (!size.width || !size.height) return;
      const ratio = isSky ? Math.min(devicePixelRatio || 1, 1.5, 1440 / size.width) : Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(size.width * ratio);
      canvas.height = Math.round(size.height * ratio);

      const side = isStrip ? Math.min(canvas.width, isSky ? 460 : 340) : Math.min(canvas.width, canvas.height, isLoader ? 160 : 570);
      const width = isStrip ? Math.max(1, Math.round(side * .82)) : side;
      const height = isStrip ? Math.max(1, Math.round(width * canvas.height / canvas.width)) : side;
      const originX = (side - width) / 2;
      const originY = isStrip ? side * .445 - height / 2 : 0;
      raster.width = width;
      raster.height = height;
      image = graphics.createImageData(width, height);
      const radius = side * .49;
      const center = side * .5;
      points = [];
      let random = 211;
      for (let y = 0; y < height; y++) {
        const latitude = (center - y - originY - .5) / radius;
        for (let x = 0; x < width; x++) {
          const right = (x + originX + .5 - center) / radius;
          const squared = right * right + latitude * latitude;
          const coverage = Math.max(0, Math.min(1, (1 - squared) * radius * .6 + .5));
          if (!coverage) continue;
          const depth = Math.sqrt(Math.max(0, 1 - squared));
          const yy = Math.asin(Math.max(-1, Math.min(1, latitude * cosTilt + depth * sinTilt)));
          const xx = Math.atan2(right, depth * cosTilt - latitude * sinTilt);
          const row = Math.max(0, Math.min(textureHeight - 1, Math.round((Math.PI / 2 - yy) / Math.PI * (textureHeight - 1))));
          const column = (xx / tau + .5) * textureWidth;
          const lighting = .87 + .12 * depth - .06 * right + .025 * latitude;
          const output = (y * width + x) * 4;
          image.data[output + 3] = Math.round(coverage * 255);
          random = (Math.imul(1664525, random) + 1013904223) >>> 0;
          const grain = (random / 4294967296 - .5) * 32;
          points.push({ output, row: row * textureWidth * 3, column, lighting, grain });
        }
      }
      paint(elapsed);
    }

    function paint(time) {
      if (!image) return;
      const spin = (-.69 + time * (isLoader ? .25 : .048)) / tau * textureWidth;
      const pixels = image.data;
      for (const { output, row, column, lighting, grain } of points) {
        const u = (column + spin + textureWidth) % textureWidth;
        const floor = Math.floor(u);
        const color = row + floor * 3;
        const nextColor = floor + 1 === textureWidth ? row : color + 3;
        const fraction = u - floor;
        pixels[output] = lerp(texture[color], texture[nextColor], fraction) * lighting + grain;
        pixels[output + 1] = lerp(texture[color + 1], texture[nextColor + 1], fraction) * lighting + grain;
        pixels[output + 2] = lerp(texture[color + 2], texture[nextColor + 2], fraction) * lighting + grain;
      }
      graphics.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isStrip) {
        ctx.drawImage(raster, 0, 0, canvas.width, canvas.height);
        return;
      }
      const length = Math.min(canvas.width, canvas.height);
      ctx.drawImage(raster, (canvas.width - length) / 2, (canvas.height - length) / 2, length, length);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (onscreen && !document.hidden && !reduced.matches) {
        lastFrame = 0;
        frame = requestAnimationFrame(tick);
      } else if (reduced.matches && onscreen) {
        paint(0);
      }
    }

    function tick(now) {
      if (!lastFrame) lastFrame = now;
      const delta = now - lastFrame;
      if (delta >= 54) {
        lastFrame = now;
        elapsed += Math.min(delta, 100) / 1000;
        paint(elapsed);
      }
      frame = requestAnimationFrame(tick);
    }

    resize();
    new ResizeObserver(resize).observe(canvas);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        onscreen = entry.isIntersecting;
        refresh();
      });
      observer.observe(canvas);
    } else refresh();
    reduced.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
  }

  createGlobe(document.getElementById('earth'), 'hero');
  createGlobe(document.getElementById('loader-earth'), 'loader');
  createGlobe(document.getElementById('landing-sky'), 'sky');
  window.mountEarthDock = canvas => createGlobe(canvas, 'dock');
})();
