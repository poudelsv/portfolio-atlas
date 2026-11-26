'use strict';

(() => {
  const main = document.querySelector('main');
  const { planet, orbitTitle, orbitTarget, orbitAction } = document.body.dataset;
  if (planet) {
    const cover = document.createElement('section');
    cover.className = 'hero world-hero';
    cover.setAttribute('aria-labelledby', 'world-title');
    const stage = document.createElement('div');
    stage.className = 'globe-stage';
    const canvas = document.createElement('canvas');
    canvas.className = 'planet-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const title = document.createElement('h1');
    title.id = 'world-title';
    title.textContent = orbitTitle;
    const action = document.createElement('a');
    action.className = 'world-action';
    action.href = '#' + orbitTarget;
    action.textContent = orbitAction;
    stage.append(canvas, title);
    cover.append(stage, action);
    main.prepend(cover);
    paintPlanet(canvas, planet);
  }

  // Keep a planet in the outgoing frame if the visitor has scrolled beyond its cover.
  addEventListener('pageswap', event => {
    if (!event.viewTransition) return;
    const stage = document.querySelector('.globe-stage');
    if (!stage || stage.getBoundingClientRect().bottom > innerHeight * .25) return;
    stage.classList.add('world-in-transit');
    event.viewTransition.finished.catch(() => {}).finally(() => stage.classList.remove('world-in-transit'));
  });

  const destination = document.getElementById(orbitTarget || 'introduction');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!destination || location.hash || navigation?.type === 'back_forward') return;

  let timer;
  let cancelled = false;
  const events = new AbortController();
  function stopAutomaticScroll() {
    cancelled = true;
    clearTimeout(timer);
    events.abort();
  }
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    addEventListener(event, stopAutomaticScroll, { once: true, passive: true, signal: events.signal });
  }

  function plan(delay) {
    clearTimeout(timer);
    if (cancelled) return;
    timer = setTimeout(() => {
      if (document.hidden) return;
      if (scrollY < 32 && !location.hash) {
        destination.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
      }
      stopAutomaticScroll();
    }, delay);
  }

  const hold = motion.matches ? 300 : planet ? 1570 : 2460;
  plan(hold);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) plan(hold);
  }, { signal: events.signal });
  addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    clearTimeout(timer);
    event.viewTransition.finished.catch(() => {}).then(() => plan(motion.matches ? 80 : 330));
  }, { once: true, signal: events.signal });
})();
