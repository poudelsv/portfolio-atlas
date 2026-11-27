'use strict';

(() => {
  const portfolio = {
    photography: {
      title: 'Photography',
      summary: 'Framing, atmosphere, and the scale of a place.',
      brief: 'Explore how viewpoint and negative space change the way a landscape reads.',
      process: 'The reference frames move from broad context to closer detail. Compare the horizon, the placement of the subject, and the density of the frame.',
      frames: [
        { title: 'Earthrise', media: 'earthrise.jpg', type: 'image', alt: 'Earth rising over the lunar horizon', detail: 'A broad frame uses the lunar horizon to establish scale.', credit: 'NASA / Bill Anders', source: 'https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise.jpg' },
        { title: 'Hadley from orbit', media: 'hadley-orbit.jpg', type: 'image', alt: 'Moon terrain photographed from orbit on Apollo 15', detail: 'An overhead view makes the winding shape of Hadley Rille easier to see.', credit: 'NASA / Apollo 15', source: 'https://commons.wikimedia.org/wiki/File:Apollo_15_Hadley_Rille.jpg' },
        { title: 'On the lunar surface', media: 'hadley-detail.jpg', type: 'image', alt: 'Boulders on the rim of Hadley Rille', detail: 'A surface-level view brings rock texture and shadows into the foreground.', credit: 'NASA / Apollo 15', source: 'https://commons.wikimedia.org/wiki/File:Apollo_15_EVA_3_boulders_Hadley_Rille.jpg' },
      ],
    },
    videography: {
      title: 'Videography',
      summary: 'A sequence of frames built around pace and movement.',
      brief: 'Develop a simple sequence with an establishing shot, a visual transition, and a closing hold.',
      process: 'Watch the reference clip, then compare two animated storyboard frames. The playback and gallery controls operate separately.',
      frames: [
        { title: 'Earth rotation', media: 'galileo.webm', type: 'video', detail: 'Watch how small changes in rotation read against a stable frame.', credit: 'NASA Goddard Scientific Visualization Studio', source: 'https://svs.gsfc.nasa.gov/1377/' },
        { title: 'Transition study', detail: 'An animated storyboard frame explores how a shape can carry motion across a cut.' },
        { title: 'Closing hold', detail: 'A slower finish returns attention to the last composition.' },
      ],
    },
    modeling: {
      title: '3D Modeling & Animation',
      summary: 'Form, lighting, and motion studies in three dimensions.',
      brief: 'Show the same object at different stages, from its underlying structure to a lit turntable.',
      process: 'The first frame exposes the construction. The second adds a surface treatment. The last frame turns the model so its silhouette can be compared from multiple viewpoints.',
      frames: [
        { title: 'Wireframe', detail: 'The construction grid exposes the volume and proportions.' },
        { title: 'Surface study', detail: 'Color and lighting help separate the faces of the object.' },
        { title: 'Turntable', detail: 'A continuous turn shows how the silhouette changes with the view.' },
      ],
    },
    design: {
      title: 'Graphic Design',
      summary: 'A visual identity built through type, shape, and repeatable layout.',
      brief: 'Build a small identity system that can move between a poster, a graphic mark, and a small-format application.',
      process: 'The sample layouts use a shared typographic hierarchy and a single repeatable shape. Their proportions change with the placement.',
      frames: [
        { title: 'Poster layout', detail: 'A large wordmark sets the hierarchy in a vertical composition.' },
        { title: 'Graphic mark', detail: 'A minimal symbol isolates the repeatable shape in the system.' },
        { title: 'Identity application', detail: 'A smaller layout tests how the type and mark hold together at a different scale.' },
      ],
    },
  };

  for (const [kind, item] of Object.entries(portfolio)) {
    item.frames = [
      ...(typeof behanceWorks === 'undefined' ? [] : behanceWorks[kind] || []).map(work => ({
        title: work.title, detail: work.description, media: work.image, type: 'image',
        alt: work.alt, source: work.url, credit: 'View project on Behance', authored: true,
      })),
      ...item.frames,
    ];
  }

  const root = document.getElementById('creative');
  const medium = document.body.dataset.medium;
  const section = Object.hasOwn(portfolio, medium) ? portfolio[medium] : null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function artwork(kind, index) {
    const art = element('div', '', 'creative-art');
    art.dataset.medium = kind;
    art.dataset.variant = String(index + 1);
    art.setAttribute('aria-hidden', 'true');
    const object = element('span', '', 'creative-object');
    if (kind === 'modeling') {
      for (let face = 0; face < 6; face++) object.append(element('i'));
    }
    if (kind === 'design') object.append(element('span', index === 1 ? '✳' : '.sapo', 'creative-print-type'));
    art.append(object);
    return art;
  }

  function media(kind, frame, index, preview = false) {
    if (!frame.media || (frame.type === 'video' && preview)) return artwork(kind, index);
    const node = element(frame.type === 'video' ? 'video' : 'img');
    node.src = /^(https?:\/\/|assets\/)/.test(frame.media) ? frame.media : 'assets/creative/' + frame.media;
    if (preview && frame.type === 'image') node.loading = 'lazy';
    node.addEventListener('error', () => node.replaceWith(artwork(kind, index)), {once:true});
    if (node.tagName === 'VIDEO') {
      node.controls = true;
      node.playsInline = true;
      node.preload = 'metadata';
      node.setAttribute('aria-label', frame.title);
    } else {
      node.alt = preview ? '' : frame.alt;
      node.decoding = 'async';
    }
    return node;
  }

  function renderIndex() {
    const header = element('header', '', 'creative-header');
    header.append(element('h2', 'Creative disciplines', 'sr-only'));
    const profileLink = element('a', 'View my Behance profile', 'creative-back');
    profileLink.href = 'https://www.behance.net/sauravpoudel';
    header.append(profileLink);
    const grid = element('div', '', 'creative-grid');
    for (const [kind, item] of Object.entries(portfolio)) {
      const card = element('a', '', 'creative-card');
      card.href = kind + '.html?v=solar-2';
      const tile = element('span', '', 'creative-tile');
      tile.dataset.medium = kind;
      tile.append(media(kind, item.frames[0], 0, true));
      card.append(tile, element('h2', item.title), element('p', item.summary));
      grid.append(card);
    }
    root.append(header, grid);
  }

  function button(text, action) {
    const control = element('button', text);
    control.type = 'button';
    control.addEventListener('click', action);
    return control;
  }

  function renderCase() {
    const page = element('article', '', 'creative-case');
    const back = element('a', 'All creative projects', 'creative-back');
    back.href = 'creative.html?v=solar-2';
    const header = element('header', '', 'creative-header');
    header.append(element('h2', section.title + ' portfolio', 'sr-only'), element('p', section.summary));
    const viewer = element('section', '', 'creative-viewer');
    viewer.setAttribute('aria-label', section.title + ' slideshow');
    viewer.tabIndex = 0;
    const stage = element('figure', '', 'creative-stage');
    const frameMedia = element('div', '', 'creative-media');
    const caption = element('figcaption');
    stage.append(frameMedia, caption);
    const controls = element('div', '', 'creative-controls');
    const status = element('p');
    status.setAttribute('role', 'status');
    const previous = button('Previous', () => step(-1));
    const next = button('Next', () => step(1));
    controls.append(previous, status, next);

    const thumbs = element('div', '', 'creative-thumbs');
    thumbs.setAttribute('role', 'group');
    thumbs.setAttribute('aria-label', 'Choose a frame');
    const frameButtons = section.frames.map((frame, index) => button(frame.title, () => renderFrame(index)));
    thumbs.append(...frameButtons);
    const frameIndex = element('details', '', 'creative-frame-index');
    frameIndex.append(element('summary', 'Frame index'), thumbs);

    let selection = 0;
    let transition;
    function renderFrame(index) {
      if (index === selection && frameMedia.firstChild) return;
      frameMedia.querySelector('video')?.pause();
      const outgoing = frameMedia.firstElementChild;
      const direction = index < selection ? -1 : 1;
      selection = index;
      const frame = section.frames[index];
      frameMedia.replaceChildren(media(medium, frame, index));
      caption.replaceChildren(element('strong', frame.title), element('span', frame.authored ? frame.detail : 'Sample study · ' + frame.detail));
      if (frame.source) {
        const credit = element('a', frame.credit, 'creative-credit');
        credit.href = frame.source;
        caption.append(credit);
      }
      status.textContent = (index + 1) + ' / ' + section.frames.length + ' · ' + frame.title;
      previous.disabled = index === 0;
      next.disabled = index === section.frames.length - 1;
      frameButtons.forEach((control, position) => control.setAttribute('aria-pressed', String(position === index)));
      transition?.cancel();
      if (!reducedMotion.matches) {
        if (outgoing && outgoing.tagName !== 'VIDEO') {
          const ghost = outgoing.cloneNode(true);
          ghost.classList.add('creative-ghost');
          ghost.setAttribute('aria-hidden', 'true');
          frameMedia.append(ghost);
          const exit = ghost.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(1.035)', filter: 'blur(12px)' },
          ], { duration: 610, easing: 'ease-in-out' });
          exit.finished.catch(() => {}).finally(() => ghost.remove());
        }
        transition = frameMedia.firstElementChild.animate([
          { opacity: .03, transform: 'translateX(' + direction * 12 + 'px) scale(.98)', filter: 'blur(7px)' },
          { opacity: 1, transform: 'translateX(0) scale(1)', filter: 'blur(0)' },
        ], { duration: 680, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    }

    function step(direction) {
      const index = selection + direction;
      if (index >= 0 && index < section.frames.length) renderFrame(index);
    }

    viewer.addEventListener('keydown', event => {
      if (event.target.closest('video') || event.altKey || event.metaKey || event.ctrlKey) return;
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') renderFrame(0);
      else if (event.key === 'End') renderFrame(section.frames.length - 1);
      else step(event.key === 'ArrowLeft' ? -1 : 1);
    });

    let swipe;
    frameMedia.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.target.closest('video')) return;
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      frameMedia.setPointerCapture(event.pointerId);
    });
    frameMedia.addEventListener('pointercancel', () => { swipe = null; });
    frameMedia.addEventListener('pointerup', event => {
      if (swipe?.id !== event.pointerId) return;
      const dx = event.clientX - swipe.x;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.clientY - swipe.y) * 1.4) step(dx < 0 ? 1 : -1);
      swipe = null;
    });

    viewer.append(stage, controls, frameIndex);
    const story = element('section', '', 'creative-story');
    const tools = element('ul', '', 'creative-tool-list');
    const toolHeading = element('h2', 'Creative tools');
    toolHeading.id = 'creative-tools';
    tools.append(...creativeToolsets[medium].map(tool => element('li', tool)));
    story.append(toolHeading, tools, element('h2', 'Sample study'), element('p', section.brief), element('p', section.process));
    page.append(back, header, viewer, story);
    root.append(page);
    const work = new URLSearchParams(location.search).get('work');
    const requestedFrame = work ? section.frames.findIndex(frame => sapoSlug(frame.title) === work) : -1;
    renderFrame(Math.max(0, requestedFrame));
  }

  if (section) renderCase();
  else renderIndex();

  if (location.hash && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
    addEventListener('DOMContentLoaded', () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target && root.contains(target)) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, { once: true });
  }
})();
