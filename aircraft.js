(() => {
  const instances = new WeakMap();
  const tau = Math.PI * 2;
  const limit = (value, low, high) => Math.max(low, Math.min(high, value));
  const white = [223, 226, 229];
  const navy = [19, 54, 103];
  const steel = [154, 164, 178];
  const red = [190, 26, 53];
  const windowTint = [20, 28, 42];
  const fuselage = [
    [-6.17, -.09, .035, .045], [-6.04, -.02, .23, .26], [-5.8, .04, .46, .50],
    [-5.45, .095, .64, .67], [-5.05, .08, .735, .735], [-4.45, .025, .77, .75],
    [-3.55, 0, .775, .755], [-1.5, 0, .775, .755], [1.35, 0, .775, .755],
    [3.5, .016, .75, .735], [4.25, .08, .60, .59], [4.9, .14, .41, .41],
    [5.46, .18, .225, .245], [5.83, .21, .12, .127],
  ];

  function buildModel() {
    const faces = [];
    const add = (vertices, color, settings = {}) => {
      faces.push({ vertices, color, ...settings });
    };

    function tube(rings, axis, panels, getColor, position = [0, 0, 0]) {
      const [x, y, z] = position;
      const coordinate = (ring, angle) => axis === 'x'
        ? [ring[0] + x, ring[1] + y + Math.cos(angle) * ring[2], z + Math.sin(angle) * ring[3]]
        : [x + Math.cos(angle) * ring[2], y + Math.sin(angle) * ring[3], ring[0] + z];
      for (let i = 0; i < rings.length - 1; i++) {
        for (let panel = 0; panel < panels; panel++) {
          const from = panel / panels * tau;
          const to = (panel + 1) / panels * tau;
          const angle = (from + to) / 2;
          const normal = axis === 'x' ? [0, Math.cos(angle), Math.sin(angle)] : [Math.cos(angle), Math.sin(angle), 0];
          add([
            coordinate(rings[i], from), coordinate(rings[i + 1], from),
            coordinate(rings[i + 1], to), coordinate(rings[i], to),
          ], getColor(i, angle), { normal });
        }
      }
    }

    function disk(axis, center, radius, color, ring = 0, panels = 20) {
      const [x, y, z] = center;
      const point = (a, r) => axis === 'x' ? [x, y + Math.cos(a) * r, z + Math.sin(a) * r] : [x + Math.cos(a) * r, y + Math.sin(a) * r, z];
      for (let i = 0; i < panels; i++) {
        const from = i / panels * tau;
        const to = (i + 1) / panels * tau;
        add(ring ? [point(from, radius), point(to, radius), point(to, ring), point(from, ring)] : [center, point(from, radius), point(to, radius)], color, { flat: true });
      }
    }

    function panelOnBody(x, y, side, padding = .012) {
      const end = fuselage.findIndex(ring => ring[0] >= x);
      const right = fuselage[Math.max(1, end)];
      const left = fuselage[Math.max(1, end) - 1];
      const mix = limit((x - left[0]) / (right[0] - left[0]), 0, 1);
      const lerp = (first, second) => first + (second - first) * mix;
      const height = lerp(left[2], right[2]);
      const breadth = lerp(left[3], right[3]);
      const rise = limit((y - lerp(left[1], right[1])) / height, -.98, .98);
      return [x, y, side * (Math.sqrt(1 - rise * rise) * breadth + padding)];
    }

    tube(fuselage, 'x', 36, (_, angle) => Math.cos(angle) < -.40 ? navy : white);
    disk('x', [5.833, .21, 0], .104, [91, 103, 121]);
    for (const side of [-1, 1]) {
      const sideNormal = [0, 0, side];
      function cabinDetail(points, color, extra) {
        const normal = [points[0][0] < -4.8 ? -.48 : 0, .2, side];
        add(points.map(([x, y]) => panelOnBody(x, y, side, extra)), color, { normal, flat: true, decal: true });
      }
      for (let x = -4.44; x < 4.52; x += .247) {
        if (Math.abs(x + 4.25) < .12 || Math.abs(x + .28) < .15 || Math.abs(x - .24) < .11 || Math.abs(x - 3.9) < .15) continue;
        cabinDetail([
          [x - .055, .14], [x - .07, .17], [x - .07, .26], [x - .05, .29],
          [x + .045, .29], [x + .065, .264], [x + .065, .165], [x + .047, .14],
        ], windowTint);
      }
      cabinDetail([[-5.87, .37], [-5.65, .47], [-5.44, .48], [-5.39, .34], [-5.75, .345]], [12, 23, 34], .021);
      cabinDetail([[-5.37, .49], [-5.08, .50], [-5.00, .35], [-5.30, .34]], [23, 34, 42], .021);
      cabinDetail([[-5.02, .49], [-4.88, .46], [-4.84, .39], [-4.95, .35]], [29, 41, 48], .021);

      for (const x of [-4.5, -.31, .20, 3.92]) {
        const top = .45;
        const bottom = x > 3 ? -.15 : -.27;
        const width = .19;
        const door = [[x, top - .07], [x + .045, top], [x + width - .038, top], [x + width, top - .07], [x + width, bottom + .07], [x + width - .04, bottom], [x + .045, bottom], [x, bottom + .07]];
        add(door.map(([px, py]) => panelOnBody(px, py, side)), [112, 128, 145], { normal: sideNormal, flat: true, outline: true, decal: true });
      }

      const letteringOrigin = panelOnBody(side === 1 ? -3.91 : -2.56, .475, side, .065);
      const letteringAcross = [letteringOrigin[0] + side * .46, letteringOrigin[1], letteringOrigin[2]];
      const letteringDown = [letteringOrigin[0], letteringOrigin[1] - .38, letteringOrigin[2]];
      add([letteringOrigin, letteringAcross, letteringDown], navy, { normal: sideNormal, flat: true, wordmark: true, decal: true });

      const span = [
        [.59, -1.99, 2.10, -.27], [1.23, -1.66, 1.98, -.25], [2.18, -1.08, 1.99, -.18],
        [3.32, -.46, 2.03, -.11], [4.24, .11, 2.04, -.015], [5.21, .67, 1.96, .12],
      ];
      for (let i = 0; i < span.length - 1; i++) {
        const low = span[i];
        const high = span[i + 1];
        function wingPoint(rib, chord, thickness) {
          return [rib[1] + (rib[2] - rib[1]) * chord, rib[3] + thickness, rib[0] * side];
        }
        const upper = [.035, .13, .075, -.012];
        const lower = [.02, -.078, -.09, -.032];
        const chords = [0, .23, .72, 1];
        for (let j = 0; j < chords.length - 1; j++) {
          add([wingPoint(low, chords[j], upper[j]), wingPoint(high, chords[j], upper[j]), wingPoint(high, chords[j + 1], upper[j + 1]), wingPoint(low, chords[j + 1], upper[j + 1])], j === 2 ? [180, 187, 195] : [193, 201, 211], { normal: [0, 1, 0] });
          add([wingPoint(low, chords[j], lower[j]), wingPoint(high, chords[j], lower[j]), wingPoint(high, chords[j + 1], lower[j + 1]), wingPoint(low, chords[j + 1], lower[j + 1])], steel, { normal: [0, -1, 0] });
        }
        add([wingPoint(low, 0, upper[0]), wingPoint(high, 0, upper[0]), wingPoint(high, 0, lower[0]), wingPoint(low, 0, lower[0])], white, { normal: [-1, .4, 0] });
        add([wingPoint(low, 1, upper[3]), wingPoint(high, 1, upper[3]), wingPoint(high, 1, lower[3]), wingPoint(low, 1, lower[3])], steel, { normal: [1, 0, 0] });
        if (i > 0) {
          add([wingPoint(low, .72, upper[2] + .009), wingPoint(high, .72, upper[2] + .009), wingPoint(high, .724, upper[2] + .008), wingPoint(low, .724, upper[2] + .008)], [111, 123, 142], { normal: [0, 1, 0] });
        }
      }

      const sweptTip = [[.71, .14, 5.21], [1.15, 1.05, 5.65], [1.46, 1.08, 5.65], [1.98, .13, 5.21]];
      add(sweptTip.map(([x, y, z]) => [x, y, z * side]), navy, { normal: [0, 0, side] });
      add(sweptTip.map(([x, y, z]) => [x, y - .027, z * side - side * .003]), [26, 62, 108], { normal: [0, 0, -side] });

      for (const direction of [-1, 1]) {
        const elev = direction * .034;
        add([[3.51, .23 + elev, .25 * side], [4.94, .45 + elev, 2.55 * side], [5.66, .43 + elev, 2.47 * side], [5.50, .22 + elev, .39 * side]], [184, 194, 210], { normal: [0, direction, 0] });
      }

      const fin = [
        [[[4.16, 2.34], [4.42, 3.15], [4.91, 3.16], [5.07, 2.49]], navy],
        [[[3.95, 1.72], [4.16, 2.34], [5.07, 2.49], [5.29, 1.60]], red],
        [[[3.95, 1.72], [5.29, 1.60], [5.48, .86], [4.59, 1.34]], [148, 21, 51]],
        [[[2.87, .53], [3.74, 1.12], [3.95, 1.72], [4.59, 1.34], [5.48, .86], [5.59, .42]], navy],
      ];
      for (const [vertices, ink] of fin) {
        add(vertices.map(([x, y]) => [x, y, side * .067]), ink, { normal: sideNormal, panel: true });
      }

      const engineZ = side * 1.72;
      add([[-1.95, -.31, engineZ - .18], [-1.33, -.16, engineZ - .22], [.66, -.13, engineZ - .12], [.48, -.72, engineZ - .16]], steel, { normal: [0, .4, -1] });
      add([[-1.95, -.31, engineZ + .18], [-1.33, -.16, engineZ + .22], [.66, -.13, engineZ + .12], [.48, -.72, engineZ + .16]], steel, { normal: [0, .4, 1] });
      const nacelle = [[-1.95, 0, .415, .415], [-1.87, 0, .505, .49], [-1.64, 0, .545, .54], [-1.10, .028, .53, .52], [-.32, .085, .45, .45], [.21, .13, .39, .37], [.43, .14, .27, .26]];
      tube(nacelle, 'x', 28, i => i === 0 ? [188, 193, 203] : navy, [0, -.70, engineZ]);
      disk('x', [-1.964, -.70, engineZ], .419, [148, 162, 183], .367, 28);
      disk('x', [-1.949, -.70, engineZ], .369, [13, 20, 34]);
      for (let i = 0; i < 11; i++) {
        const angle = i / 11 * tau;
        const blade = (offset, radius) => [-1.964, -.70 + Math.cos(angle + offset) * radius, engineZ + Math.sin(angle + offset) * radius];
        add([blade(0, .10), blade(.28, .328), blade(.45, .34), blade(.35, .095)], [40, 52, 70], { flat: true });
      }
      disk('x', [-1.976, -.70, engineZ], .097, [103, 116, 137]);
      disk('x', [.44, -.56, engineZ], .267, [68, 82, 100], .197);
      disk('x', [.431, -.56, engineZ], .198, [15, 21, 30]);
    }
    return faces;
  }

  const model = buildModel();

  function fillColor(face) {
    const normal = face.normal || [0, 0, 1];
    const shade = face.flat ? 1 : .77 + .26 * (normal[1] * .67 - normal[0] * .36 + normal[2] * .43);
    return 'rgb(' + face.color.map(value => limit(Math.round(value * shade), 0, 255)).join(' ') + ')';
  }
  model.forEach(face => { face.ink = fillColor(face); });

  function initAircraft(host) {
    if (!host || instances.has(host)) return instances.get(host);
    const shell = document.createElement('div');
    shell.className = 'aircraft-viewer';
    const canvas = document.createElement('canvas');
    canvas.className = 'aircraft-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Stylized 3D preview of a Delta Air Lines narrow-body jet');
    canvas.tabIndex = 0;
    const instructions = document.createElement('p');
    instructions.className = 'aircraft-instructions';
    instructions.textContent = 'Drag or use the arrow keys to rotate. Use plus and minus to zoom.';
    instructions.id = 'aircraft-help-' + (document.querySelectorAll('.aircraft-instructions').length + 1);
    canvas.setAttribute('aria-describedby', instructions.id);

    const context = canvas.getContext('2d');
    if (!context) {
      instructions.textContent = 'The interactive aircraft preview is unavailable in this browser.';
      host.append(instructions);
      return;
    }

    const defaultView = { yaw: -.56, pitch: .34, zoom: 1 };
    let yaw = defaultView.yaw;
    let pitch = defaultView.pitch;
    let zoom = defaultView.zoom;
    let width = 0;
    let height = 0;
    let frame = 0;
    let drag;
    const display = new AbortController();
    const { signal } = display;

    function paint() {
      frame = 0;
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const roll = .25;
      const cosRoll = Math.cos(roll);
      const sinRoll = Math.sin(roll);
      const focus = 22;
      const scale = Math.min(width / 14.4, height / 7.7) * zoom;

      function project(point) {
        const [x, y, z] = point;
        const right = x * cosYaw - z * sinYaw;
        const forward = x * sinYaw + z * cosYaw;
        const up = y * cosPitch - forward * sinPitch;
        const depth = y * sinPitch + forward * cosPitch;
        const size = scale * focus / (focus - depth);
        return [
          width * .5 + (right * cosRoll + up * sinRoll) * size,
          height * .55 + (right * sinRoll - up * cosRoll) * size,
          depth,
        ];
      }

      const sorted = [];
      for (const face of model) {
        if (face.decal || face.panel) {
          const [x, y, z] = face.normal;
          if (y * sinPitch + (x * sinYaw + z * cosYaw) * cosPitch < .014) continue;
        }
        const points = face.vertices.map(project);
        const depth = points.reduce((sum, point) => sum + point[2], 0) / points.length;
        sorted.push({ face, points, depth });
      }
      sorted.sort((first, second) => Number(Boolean(first.face.decal)) - Number(Boolean(second.face.decal)) || first.depth - second.depth);

      for (const { face, points } of sorted) {
        const [a, b, c] = points;
        if (face.wordmark) {
          context.save();
          context.transform(b[0] - a[0], b[1] - a[1], c[0] - a[0], c[1] - a[1], a[0], a[1]);
          context.beginPath();
          context.moveTo(0, -.84);
          context.lineTo(.36, -.03);
          context.lineTo(-.36, -.03);
          context.closePath();
          context.fillStyle = '#c22b45';
          context.fill();
          context.beginPath();
          context.moveTo(-.30, -.11);
          context.lineTo(0, -.48);
          context.lineTo(.30, -.11);
          context.lineTo(0, -.23);
          context.closePath();
          context.fillStyle = '#ff7d89';
          context.fill();
          context.font = 'bold .775px system-ui, sans-serif';
          context.fillStyle = '#163961';
          context.fillText('D E L T A', .5, -.045);
          context.restore();
          continue;
        }
        context.beginPath();
        context.moveTo(a[0], a[1]);
        for (let index = 1; index < points.length; index++) context.lineTo(points[index][0], points[index][1]);
        context.closePath();
        context.fillStyle = face.ink;
        context.strokeStyle = face.ink;
        context.lineWidth = face.outline ? Math.max(.55, scale * .016) : .48;
        if (!face.outline) context.fill();
        if (!face.decal || face.outline) context.stroke();
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      schedule();
    }

    function turn(horizontal, vertical) {
      yaw = (yaw + horizontal + tau) % tau;
      pitch = limit(pitch + vertical, -1.05, 1.05);
      schedule();
    }

    function magnify(amount) {
      zoom = limit(zoom + amount, .72, 1.65);
      schedule();
    }

    function reset() {
      ({ yaw, pitch, zoom } = defaultView);
      schedule();
    }

    const controls = document.createElement('div');
    controls.className = 'aircraft-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Aircraft viewing controls');
    for (const [label, title, action] of [
      ['Rotate left', 'Rotate the aircraft left', () => turn(-.30, 0)],
      ['Rotate right', 'Rotate the aircraft right', () => turn(.30, 0)],
      ['−', 'Zoom out', () => magnify(-.13)],
      ['+', 'Zoom in', () => magnify(.13)],
      ['Reset view', 'Reset aircraft view', reset],
    ]) {
      const control = document.createElement('button');
      control.type = 'button';
      control.textContent = label;
      control.setAttribute('aria-label', title);
      control.addEventListener('click', action, { signal });
      controls.append(control);
    }

    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(drag.id);
      canvas.classList.add('is-dragging');
    }, { signal });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== drag?.id) return;
      turn((event.clientX - drag.x) * .010, (event.clientY - drag.y) * .009);
      drag.x = event.clientX;
      drag.y = event.clientY;
    }, { signal });
    for (const endEvent of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(endEvent, event => {
        if (event.pointerId !== drag?.id) return;
        drag = undefined;
        canvas.classList.remove('is-dragging');
      }, { signal });
    }
    canvas.addEventListener('keydown', event => {
      const keyActions = {
        ArrowLeft: () => turn(-.15, 0),
        ArrowRight: () => turn(.15, 0),
        ArrowUp: () => turn(0, -.12),
        ArrowDown: () => turn(0, .12),
        '+': () => magnify(.12),
        '=': () => magnify(.12),
        '-': () => magnify(-.12),
        Home: reset,
      };
      if (!Object.hasOwn(keyActions, event.key)) return;
      event.preventDefault();
      keyActions[event.key]();
    }, { signal });

    shell.append(canvas, controls, instructions);
    host.append(shell);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const instance = {
      reset,
      destroy() {
        display.abort();
        observer.disconnect();
        cancelAnimationFrame(frame);
        shell.remove();
        instances.delete(host);
      },
    };
    instances.set(host, instance);
    return instance;
  }

  window.initAircraft = initAircraft;
})();
