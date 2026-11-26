'use strict';

(() => {
  const collage = document.querySelector('.portrait-collage');
  if (!collage) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const photo = collage.querySelector('.portrait-photo');
  const trigger = collage.querySelector('.portrait-button');
  let clearAnimation;

  function reveal() {
    if (motion.matches) return;
    clearTimeout(clearAnimation);
    collage.classList.remove('is-shuttering');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      collage.classList.add('is-shuttering');
      clearAnimation = setTimeout(() => collage.classList.remove('is-shuttering'), 1200);
    }));
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    if (photo.complete) reveal();
    else photo.addEventListener('load', reveal, { once: true });
  }, { threshold: .35 });
  observer.observe(collage);

  trigger.addEventListener('click', () => {
    reveal();
    document.dispatchEvent(new CustomEvent('sapo-buddy:wave', { detail: trigger }));
  });
})();
