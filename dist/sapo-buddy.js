'use strict';

(() => {
  const main = document.querySelector('main');
  if (!main) return;

  const buddy = document.createElement('div');
  buddy.className = 'sapo-buddy';
  buddy.dataset.mood = 'rest';
  buddy.dataset.hidden = '';
  buddy.innerHTML = `
    <button class="sapo-buddy-control" type="button">
      <span class="sapo-buddy-orbit" aria-hidden="true"></span>
      <span class="sapo-buddy-mount" aria-hidden="true">
        <span class="sapo-buddy-momo"></span>
        <span class="sapo-buddy-puppet" aria-hidden="true">
          <span class="sapo-buddy-part sapo-buddy-leg sapo-buddy-leg--left"></span>
          <span class="sapo-buddy-part sapo-buddy-leg sapo-buddy-leg--right"></span>
          <span class="sapo-buddy-part sapo-buddy-sleeve sapo-buddy-sleeve--right"></span>
          <span class="sapo-buddy-part sapo-buddy-coat"></span>
          <span class="sapo-buddy-part sapo-buddy-sleeve sapo-buddy-sleeve--left"></span>
          <span class="sapo-buddy-hand sapo-buddy-hand--left"></span>
          <span class="sapo-buddy-hand sapo-buddy-hand--right"></span>
          <span class="sapo-buddy-part sapo-buddy-head"></span>
          <span class="sapo-buddy-eyes">× ×</span>
        </span>
      </span>
    </button>
    <span class="sapo-buddy-speech" aria-hidden="true"></span>
    <span class="sr-only" role="status"></span>`;
  document.body.append(buddy);

  const button = buddy.querySelector('button');
  const mount = buddy.querySelector('.sapo-buddy-mount');
  const puppet = buddy.querySelector('.sapo-buddy-puppet');
  const spirit = puppet.cloneNode(true);
  spirit.className = 'sapo-buddy-spirit';
  spirit.querySelector('.sapo-buddy-eyes').remove();
  button.append(spirit);
  const speech = buddy.querySelector('.sapo-buddy-speech');
  const status = buddy.querySelector('[role="status"]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'sapo-buddy';
  const deathDuration = 4600;
  const rideHold = 460;
  const dialogue = [
    { mood: 'momo', line: 'i like momo' },
    { mood: 'grumpy', line: 'leave me alone' },
    { mood: 'wave', line: 'i can make your life easier' },
    { mood: 'flourish', line: 'I’m so versatile I can handle videography, photography, and data engineering—basically anything technical except fixing the office printer.' },
  ];
  const ambientLines = [
    'Looking for a full-time starting May 2027',
    'I graduate May 2027',
    'I am open to relocate anywhere in the US',
  ];
  const randomDelay = (min, max) => min + Math.random() * (max - min);
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}') || {};
  } catch {
    // The companion still works if session storage is unavailable.
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);
  const firstX = Number.isFinite(saved.x) ? clamp(saved.x, 0, 1) * innerWidth : 18;
  const firstY = Number.isFinite(saved.y) ? clamp(saved.y, 0, 1) * innerHeight : innerHeight * 0.43;
  let position = { x: firstX, y: firstY };
  let aim = position;
  let waypoints = [];
  let attention = null;
  let lastPointer;
  let scrollPosition = window.scrollY;
  let hovered = false;
  let obstacles = [];
  let viewport = { width: 0, height: 0, buddyWidth: 0, buddyHeight: 0 };
  let dirty = true;
  let placeFrame = 0;
  let moveFrame = 0;
  let lastFrame = 0;
  let lastMeasure = 0;
  let lastPlan = 0;
  let moodTimer;
  let ambientTimer;
  let ambientSpeaking = false;
  let ambientIndex = Number.isInteger(saved.ambientIndex) && ambientLines[saved.ambientIndex]
    ? saved.ambientIndex : Math.floor(Math.random() * ambientLines.length);
  let ambientAt = Number.isFinite(saved.ambientAt) ? saved.ambientAt : Date.now() + randomDelay(11000, 15000);
  let rideTimer;
  let rideUntil = 0;
  let lean = 0;
  let clicks = 0;
  let lastClick = 0;
  let deadUntil = 0;
  let lastReaction = saved.lastReaction;
  let reactionPool = [];

  const blockerSelector = 'a, button, input, select, textarea, summary, video, iframe, canvas[tabindex]';
  const interestSelector = '.globe-stage, .dock-row, .explorer-card, .creative-card, .creative-media';
  const textSelector = 'h1, h2, h3, h4, p, li, dt, dd, figcaption, label';
  const layers = [main, document.querySelector('.dock')].filter(Boolean);

  function measure() {
    viewport = {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      buddyWidth: buddy.offsetWidth,
      buddyHeight: buddy.offsetHeight,
    };
    const { width, height } = viewport;
    obstacles = [];
    function record(rect) {
      if (rect.width && rect.height && rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width) {
        obstacles.push(rect);
      }
    }
    const range = document.createRange();
    for (const layer of layers) {
      if (layer !== main) {
        record(layer.getBoundingClientRect());
        continue;
      }
      for (const element of layer.querySelectorAll(blockerSelector + ', ' + textSelector)) {
        if (element.closest('[hidden], [inert], .sr-only')) continue;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > height) continue;
        if (element.matches(blockerSelector)) {
          record(rect);
        } else {
          range.selectNodeContents(element);
          for (const line of range.getClientRects()) record(line);
        }
      }
    }
    dirty = false;
    lastMeasure = performance.now();
  }

  function fits(point, width, height) {
    const { x, y } = point;
    if (x < 4 || y < 4 || x + width > viewport.width - 4 || y + height > viewport.height - 6) return false;
    const gap = 6;
    const right = x + width + gap;
    const bottom = y + height + gap;
    return !obstacles.some(rect => x - gap < rect.right && right > rect.left && y - gap < rect.bottom && bottom > rect.top);
  }

  function clear(point) {
    return fits(point, viewport.buddyWidth, viewport.buddyHeight);
  }

  function clearPath(from, to) {
    const x = Math.min(from.x, to.x);
    const y = Math.min(from.y, to.y);
    return fits({ x, y }, Math.abs(to.x - from.x) + viewport.buddyWidth,
      Math.abs(to.y - from.y) + viewport.buddyHeight);
  }

  function findDetour() {
    const { width, height, buddyWidth, buddyHeight } = viewport;
    const rows = new Set([8, height - buddyHeight - 8, position.y, aim.y]);
    const columns = new Set([8, width - buddyWidth - 8, position.x, aim.x]);
    for (const rect of obstacles) {
      rows.add(rect.top - buddyHeight - 8).add(rect.bottom + 8);
      columns.add(rect.left - buddyWidth - 8).add(rect.right + 8);
    }
    const bends = [
      ...Array.from(rows, y => [{ x: position.x, y }, { x: aim.x, y }]),
      ...Array.from(columns, x => [{ x, y: position.y }, { x, y: aim.y }]),
    ];
    let shortest = Infinity;
    let route = [];
    for (const [entry, exit] of bends) {
      const length = distance(position, entry) + distance(entry, exit) + distance(exit, aim);
      if (length >= shortest || !clearPath(position, entry) || !clearPath(entry, exit) || !clearPath(exit, aim)) continue;
      shortest = length;
      route = [entry, exit];
    }
    return route;
  }

  function placeSpeech() {
    if (!speech.textContent || !viewport.width) return;
    const { x, y } = position;
    const { width, height, buddyWidth, buddyHeight } = viewport;
    const bubbleWidth = speech.offsetWidth;
    const bubbleHeight = speech.offsetHeight;
    const right = x + buddyWidth + 8;
    const left = x - bubbleWidth - 8;
    const center = clamp(x + (buddyWidth - bubbleWidth) / 2, 8, width - bubbleWidth - 8);
    const top = y - bubbleHeight - 6;
    const bottom = y + buddyHeight + 6;
    const bubbleY = clamp(y + buddyHeight * 0.13, 8, height - bubbleHeight - 8);
    const sameSide = x < width / 2 ? [right, left] : [left, right];
    const candidates = sameSide.map(nextX => ({ x: nextX, y: bubbleY }));
    candidates.push({ x: center, y: top }, { x: center, y: bottom });

    // Find nearby free space when the usual bubble position would cover a title or button.
    for (const row of [8, height - bubbleHeight - 8, ...obstacles.flatMap(rect => [rect.top - bubbleHeight - 7, rect.bottom + 7])]) {
      for (const column of [...sameSide, 8, width - bubbleWidth - 8, center]) {
        if (column < x + buddyWidth && column + bubbleWidth > x && row < y + buddyHeight && row + bubbleHeight > y) continue;
        candidates.push({ x: column, y: row });
      }
    }
    const nearby = candidates.find(point => fits(point, bubbleWidth, bubbleHeight));
    buddy.toggleAttribute('data-speech-placed', Boolean(nearby));
    if (nearby) {
      speech.style.left = `${nearby.x - x}px`;
      speech.style.top = `${nearby.y - y}px`;
    }
  }

  function chooseSpace(nearCurrentPosition = false) {
    const { width, height, buddyWidth, buddyHeight } = viewport;
    const edge = width < 500 ? 6 : 14;
    const lane = Math.min(width * 0.12, 116);
    const oldSide = position.x + buddyWidth * 0.5 < width / 2 ? -1 : 1;
    const current = { x: position.x + buddyWidth * 0.5, y: position.y + buddyHeight * 0.69 };
    const point = nearCurrentPosition ? current : attention ?? current;
    const side = point.x < width * 0.43 ? -1 : point.x > width * 0.57 ? 1 : oldSide;
    const y = clamp(point.y - buddyHeight * 0.69, 8, height - buddyHeight - 10);
    const step = Math.max(30, buddyHeight * 0.26);
    const rows = [y, 12, height - buddyHeight - 12];
    for (let offset = step; offset < height; offset += step) rows.push(y - offset, y + offset);
    let best = null;
    let bestScore = Infinity;
    for (const bank of [side, -side]) {
      for (const margin of [edge, edge + lane * 0.45, edge + lane]) {
        const x = bank < 0 ? margin : width - margin - buddyWidth;
        for (const row of rows) {
          const candidate = { x, y: row };
          if (!clear(candidate)) continue;
          const score = Math.abs(row - y) + Math.abs(x + buddyWidth * 0.5 - point.x) * 0.42 + (bank !== side ? 68 : 0);
          if (score < bestScore) {
            best = candidate;
            bestScore = score;
          }
        }
      }
    }
    return best;
  }

  function setPosition(point) {
    position = point;
    buddy.style.transform = `translate3d(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px, 0)`;
  }

  function isResting() {
    return hovered || button.matches(':focus-visible') || Boolean(speech.textContent);
  }

  function bank(degrees) {
    const next = Math.round(clamp(degrees, -4, 4));
    if (next === lean) return;
    lean = next;
    buddy.style.setProperty('--sapo-ride-lean', `${lean}deg`);
  }

  function dismount() {
    clearTimeout(rideTimer);
    rideTimer = undefined;
    buddy.removeAttribute('data-riding');
    bank(0);
  }

  function settleRide() {
    const remaining = rideUntil - performance.now();
    if (remaining > 0) rideTimer = setTimeout(settleRide, remaining);
    else dismount();
  }

  function keepRiding(degrees) {
    dismissAmbient();
    if (reduced.matches || document.hidden || button.matches(':focus-visible') || speech.textContent) return;
    rideUntil = performance.now() + rideHold;
    if (!buddy.hasAttribute('data-riding')) buddy.dataset.riding = '';
    if (degrees !== undefined) bank(degrees);
    if (rideTimer === undefined) rideTimer = setTimeout(settleRide, rideHold);
  }

  function updateState() {
    if (document.hidden || buddy.hasAttribute('data-hidden') || reduced.matches || moveFrame) return;
    lastFrame = 0;
    moveFrame = requestAnimationFrame(walk);
  }

  function walk(now) {
    moveFrame = 0;
    if (document.hidden || buddy.hasAttribute('data-hidden') || reduced.matches) return;
    const elapsed = clamp(now - (lastFrame || now - 16), 2, 36);
    lastFrame = now;
    if (isResting()) return;
    while (waypoints.length && distance(position, waypoints[0]) < 1.1) waypoints.shift();
    const target = waypoints[0] ?? aim;
    if (distance(position, target) < 1.1) return;
    const t = 1 - Math.exp(-elapsed / 128);
    const horizontal = target.x - position.x;
    const point = { x: position.x + horizontal * t, y: position.y + (target.y - position.y) * t };
    if (!clearPath(position, point)) {
      waypoints = findDetour();
      if (waypoints.length) moveFrame = requestAnimationFrame(walk);
      return;
    }
    keepRiding(Math.abs(horizontal) > 4 ? horizontal / 18 : undefined);
    setPosition(point);
    moveFrame = requestAnimationFrame(walk);
  }

  function place() {
    placeFrame = 0;
    lastPlan = performance.now();
    if (dirty || lastPlan - lastMeasure > 800) measure();
    if (isResting() && clear(position)) {
      delete buddy.dataset.hidden;
      placeSpeech();
      return;
    }
    const next = chooseSpace();
    if (!next) {
      buddy.dataset.hidden = '';
      return;
    }
    if (distance(aim, next) > 6) waypoints = [];
    aim = next;
    const hidden = buddy.hasAttribute('data-hidden');
    const blocked = !clear(position);
    if (hidden || blocked || reduced.matches) {
      const relocate = blocked && !hidden && !reduced.matches;
      setPosition(relocate ? chooseSpace(true) ?? next : next);
      waypoints = [];
      if (relocate) {
        mount.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
      }
    }
    delete buddy.dataset.hidden;
    placeSpeech();
    updateState();
  }

  function refresh(layoutChanged = false) {
    dirty ||= layoutChanged;
    if (!placeFrame) placeFrame = requestAnimationFrame(place);
  }

  function follow(event) {
    if (reduced.matches || hovered || event.target.closest?.('.sapo-buddy')) return;
    const interest = event.target.closest?.(interestSelector);
    const point = { x: event.clientX, y: event.clientY };
    if (!lastPointer || distance(lastPointer, point) > 4) {
      lastPointer = { ...point };
      keepRiding();
    }
    const orbit = interest?.matches('.globe-stage');
    buddy.toggleAttribute('data-orbit', Boolean(orbit));
    if (orbit) {
      const bounds = interest.getBoundingClientRect();
      point.x = event.clientX < bounds.left + bounds.width / 2 ? bounds.left : bounds.right;
    } else if (interest?.matches('.dock-row')) {
      point.y = Math.max(0, interest.getBoundingClientRect().top - 50);
    }
    attention = point;
    if (performance.now() - lastPlan > 70) refresh();
  }

  function describeButton(fallen = false) {
    button.setAttribute('aria-label', fallen ? 'Wake the .sapo companion' : 'Play with the .sapo companion');
    button.title = fallen ? 'Click to wake .sapo.' : 'Click for a reaction. Three quick clicks play dead.';
    button.setAttribute('aria-description', button.title);
  }

  function say(line, hint) {
    dismount();
    speech.textContent = line;
    status.textContent = hint ? `${line}. ${hint}` : line;
    placeSpeech();
  }

  function clearSpeech() {
    ambientSpeaking = false;
    speech.textContent = '';
    buddy.removeAttribute('data-speech-placed');
    refresh();
  }

  function dismissAmbient() {
    if (!ambientSpeaking) return;
    clearTimeout(moodTimer);
    clearSpeech();
  }

  function scheduleAmbient() {
    clearTimeout(ambientTimer);
    if (document.hidden) return;
    ambientTimer = setTimeout(showAmbient, Math.max(900, ambientAt - Date.now()));
  }

  function showAmbient() {
    if (document.hidden) return;
    const busy = isResting() || buddy.dataset.mood !== 'rest' || buddy.hasAttribute('data-riding') ||
      getComputedStyle(buddy).visibility !== 'visible' || document.querySelector('.sapo-invite:not([hidden])');
    if (!busy) {
      if (dirty || performance.now() - lastMeasure > 800) measure();
      speech.textContent = ambientLines[ambientIndex];
      placeSpeech();
      if (buddy.hasAttribute('data-speech-placed')) {
        ambientSpeaking = true;
        ambientIndex = (ambientIndex + 1) % ambientLines.length;
        moodTimer = setTimeout(clearSpeech, 4800);
        ambientAt = Date.now() + randomDelay(30000, 46000);
        scheduleAmbient();
        return;
      }
      clearSpeech();
    }
    ambientAt = Date.now() + randomDelay(3000, 5000);
    scheduleAmbient();
  }

  function settle(delay) {
    moodTimer = setTimeout(() => {
      buddy.dataset.mood = 'rest';
      clearSpeech();
    }, delay);
  }

  function revive() {
    clearTimeout(moodTimer);
    deadUntil = 0;
    clicks = 0;
    lastClick = 0;
    buddy.dataset.mood = 'revived';
    describeButton();
    say('pls dont offline me');
    settle(3200);
  }

  function collapse(duration = deathDuration) {
    clearTimeout(moodTimer);
    deadUntil = Date.now() + duration;
    buddy.style.setProperty('--sapo-death-offset', `${duration - deathDuration}ms`);
    buddy.dataset.mood = 'fallen';
    describeButton(true);
    say('wasted', 'Press again to wake the companion.');
    moodTimer = setTimeout(revive, duration);
  }

  function react() {
    if (!reactionPool.length) reactionPool = dialogue.map((_, index) => index);
    const choices = reactionPool.filter(index => index !== lastReaction);
    const selected = choices[Math.floor(Math.random() * choices.length)];
    lastReaction = selected;
    reactionPool.splice(reactionPool.indexOf(selected), 1);
    const { mood, line } = dialogue[selected];
    buddy.dataset.mood = mood;
    say(line);
    settle(line.length > 60 ? 6200 : 2900);
  }

  function play() {
    dismissAmbient();
    if (deadUntil) {
      revive();
      return;
    }
    const now = Date.now();
    clicks = now - lastClick > 1500 ? 1 : clicks + 1;
    lastClick = now;
    if (clicks >= 3) {
      collapse();
      return;
    }
    clearTimeout(moodTimer);
    react();
  }

  button.addEventListener('click', play);
  document.addEventListener('sapo-buddy:wave', event => {
    const source = event.detail?.button ?? event.detail;
    const bounds = source?.getBoundingClientRect?.();
    if (bounds && !reduced.matches) {
      attention = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height * 0.65 };
      refresh();
    }
    play();
  });
  buddy.addEventListener('pointerenter', () => { hovered = true; });
  buddy.addEventListener('pointerleave', () => { hovered = false; refresh(); });
  button.addEventListener('focus', () => { if (button.matches(':focus-visible')) dismount(); });
  button.addEventListener('blur', () => refresh());
  document.addEventListener('pointermove', follow, { passive: true });
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') follow(event); }, { passive: true });
  window.addEventListener('scroll', () => {
    const next = window.scrollY;
    keepRiding(2 * Math.sign(next - scrollPosition));
    scrollPosition = next;
    refresh(true);
  }, { passive: true });
  window.addEventListener('resize', () => refresh(true), { passive: true });
  window.addEventListener('pageshow', () => { refresh(true); scheduleAmbient(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      dismount();
      dismissAmbient();
    }
    refresh(true);
    scheduleAmbient();
  });
  reduced.addEventListener('change', () => { dismount(); attention = null; refresh(); });
  const observeChanges = new MutationObserver(() => refresh(true));
  const resize = new ResizeObserver(() => refresh(true));
  for (const layer of layers) {
    observeChanges.observe(layer, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'inert'] });
    resize.observe(layer);
  }
  window.addEventListener('pagehide', () => {
    clearTimeout(ambientTimer);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        x: position.x / innerWidth, y: position.y / innerHeight, deadUntil, lastReaction, ambientAt, ambientIndex,
      }));
    } catch {
      // No state needs to be saved for the page to keep working.
    }
  });

  if (saved.deadUntil > Date.now()) collapse(saved.deadUntil - Date.now());
  else if (saved.deadUntil && Date.now() - saved.deadUntil < 2200) revive();
  else describeButton();
  refresh(true);
  scheduleAmbient();
})();
