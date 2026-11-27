'use strict';

(() => {
  const scene = document.querySelector('.landing-scene');
  if (!scene) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const atmosphere = scene.querySelector('.landing-atmosphere');
  const wave = scene.querySelector('.landing-scene-wave');

  new IntersectionObserver(([entry]) => {
    scene.classList.toggle('is-visible', entry.isIntersecting);
    if (entry.isIntersecting) scene.classList.add('is-entered');
  }).observe(scene);

  scene.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType !== 'mouse') return;
    const frame = scene.getBoundingClientRect();
    const x = (event.clientX - frame.left) / frame.width - .5;
    const y = (event.clientY - frame.top) / frame.height - .5;
    atmosphere.style.setProperty('--drift-x', x * 22 + 'px');
    atmosphere.style.setProperty('--drift-y', y * 15 + 'px');
  });
  scene.addEventListener('pointerleave', () => {
    atmosphere.style.removeProperty('--drift-x');
    atmosphere.style.removeProperty('--drift-y');
  });

  wave.addEventListener('click', () => {
    if (!motion.matches) wave.animate([
      { scale: 1 }, { scale: 1.35, opacity: 1, offset: .38 }, { scale: 1 },
    ], { duration: 470, easing: 'ease-out' });
    document.dispatchEvent(new CustomEvent('sapo-buddy:wave', { detail: wave }));
  });
})();
