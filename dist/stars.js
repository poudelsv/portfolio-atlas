(() => {
  const canvas = document.getElementById('stars');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fullCircle = Math.PI * 2;

  let seed = 514637;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const stars = Array.from({ length: 117 }, () => ({
    x: .02 + random() * .96,
    y: .025 + random() * .95,
    radius: .48 + random() * .74,
    brightness: .22 + random() * .52,
    period: 8 + random() * 12,
    phase: random(),
  }));

  const constellations = [
    {
      x: .16, y: .25, period: 23, phase: .21,
      points: [[0, 27], [18, 10], [36, 20], [52, 1], [70, 4]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
      x: .82, y: .28, period: 25, phase: .54,
      points: [[12, 0], [52, 9], [26, 28], [31, 30], [37, 32], [9, 54], [56, 53], [22, 14]],
      edges: [[0, 2], [2, 3], [3, 4], [4, 1], [2, 5], [5, 6], [6, 4], [0, 7], [7, 1]],
    },
    {
      x: .29, y: .79, period: 28, phase: .79,
      points: [[3, 26], [28, 19], [38, 31], [57, 44], [49, 20], [76, 3], [94, 13]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 6]],
    },
    {
      x: .79, y: .72, period: 26, phase: .32,
      points: [[13, 14], [32, 26], [49, 11], [65, 3], [46, 36], [72, 51], [5, 26]],
      edges: [[6, 0], [0, 1], [1, 2], [2, 3], [1, 4], [4, 5]],
    },
  ];

  let width = 0;
  let height = 0;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;

  function pulse(time, period, phase, duration) {
    const progress = (time / period + phase) % 1;
    if (progress >= duration) return 0;
    return Math.sin(progress / duration * Math.PI) ** 2;
  }

  function dot(x, y, radius, alpha) {
    context.beginPath();
    context.fillStyle = 'rgba(235, 237, 251, ' + alpha + ')';
    context.arc(x, y, radius, 0, fullCircle);
    context.fill();
  }

  function paint(time) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);

    for (const star of stars) {
      const visibility = motion.matches ? (star.phase < .46 ? .52 : 0) : .13 + .87 * pulse(time, star.period, star.phase, .76);
      if (visibility < .025) continue;
      dot(star.x * width, star.y * height, star.radius, star.brightness * visibility);
    }

    const scale = Math.max(.55, Math.min(1.45, width / 1000));
    for (const [index, cluster] of constellations.entries()) {
      const visibility = motion.matches ? (index === 0 ? .42 : 0) : pulse(time, cluster.period, cluster.phase, .52);
      if (visibility < .025) continue;

      const points = cluster.points.map(([x, y]) => [
        cluster.x * width + (x - 35) * scale,
        cluster.y * height + (y - 25) * scale,
      ]);

      context.beginPath();
      context.strokeStyle = 'rgba(205, 214, 246, ' + (visibility * .24) + ')';
      context.lineWidth = .68;
      for (const [start, end] of cluster.edges) {
        context.moveTo(...points[start]);
        context.lineTo(...points[end]);
      }
      context.stroke();

      points.forEach(([x, y], i) => dot(x, y, i % 3 ? .85 : 1.22, visibility * (i % 3 ? .59 : .83)));
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    paint(elapsed);
  }

  function tick(now) {
    if (!previous) previous = now;
    const delta = now - previous;
    if (delta >= 62) {
      previous = now;
      elapsed += Math.min(delta, 150) / 1000;
      paint(elapsed);
    }
    frame = requestAnimationFrame(tick);
  }

  function refresh() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (document.hidden) return;
    if (motion.matches) paint(0);
    else frame = requestAnimationFrame(tick);
  }

  resize();
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', refresh);
  refresh();
})();
