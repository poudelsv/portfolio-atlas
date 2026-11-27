'use strict';

(() => {
  const showcase = document.getElementById('landing-showcase');
  if (!showcase) return;

  const employers = new Map();
  for (const role of landingData.experience) {
    if (!role.logoKey) continue;
    const key = role.logoKey.split('-')[0];
    const name = key === 'uc' ? 'University of Cincinnati' : role.organization;
    const logo = companyLogos[key];
    if (!logo || employers.has(name)) continue;
    employers.set(name, { name, logo, detail: 'Employer', href: 'resume.html#resume-history' });
  }

  const companies = [
    ...employers.values(),
    ...landingData.collaborators.filter(([name]) => !employers.has(name)).map(([name, logo, treatment]) => ({
      name, logo: 'assets/' + logo, treatment, detail: 'Collaborator', href: 'resume.html#resume-companies',
    })),
  ];
  const projectTools = new Set(landingData.projects.flatMap(project => project.tools || []));
  const skills = new Set(landingData.skills.flatMap(group => group.items));
  const tools = [
    ['JavaScript', 'tools/javascript.svg'],
    ['Hugging Face', 'tools/huggingface.svg'],
    ['Python', 'tools/python.svg'],
    ['PostgreSQL', 'tools/postgresql.svg'],
    ['TypeScript', 'tools/typescript.svg'],
    ['React', 'tools/react.svg'],
    ['Node.js', 'tools/nodejs.svg'],
    ['Docker', 'tools/docker.svg'],
    ['Apache Airflow', 'tools/airflow.svg'],
    ['Salesforce CRM', 'companies/salesforce.svg'],
    ['Palantir Foundry', 'companies/palantir.svg', 'light'],
  ].map(([name, logo, treatment]) => ({
    name, logo: 'assets/' + logo, treatment,
    href: projectTools.has(name) ? 'projects.html?tool=' + encodeURIComponent(name) + '#project-tree' : skills.has(name) ? 'resume.html#resume-skills' : '',
  }));

  function element(tag, className, text) {
    const result = document.createElement(tag);
    result.className = className;
    if (text) result.textContent = text;
    return result;
  }

  const playback = element('button', 'showcase-playback', 'Pause logo motion');
  playback.type = 'button';
  const heading = element('h2', 'sr-only', 'Work and tools');
  const controls = element('header', 'showcase-controls');
  controls.append(heading, playback);
  showcase.append(controls);

  function createList(entries, duplicate) {
    const list = element('ul', 'showcase-list');
    if (duplicate) list.setAttribute('aria-hidden', 'true');
    for (const { name, logo, detail, href, treatment } of entries) {
      const item = element('li', 'showcase-item');
      const card = element(href ? 'a' : 'div', 'showcase-mark');
      if (href) {
        card.href = href;
        if (duplicate) card.tabIndex = -1;
      }
      const icon = element('img', 'showcase-logo' + (treatment ? ' showcase-logo-' + treatment : ''));
      icon.src = logo;
      icon.alt = '';
      icon.width = 88;
      icon.height = 42;
      icon.decoding = 'async';
      icon.loading = 'lazy';
      icon.addEventListener('error', () => { icon.hidden = true; }, { once: true });
      const label = element('span', 'showcase-mark-label');
      label.append(element('strong', 'showcase-mark-name', name));
      if (detail) label.append(element('small', 'showcase-mark-detail', detail));
      card.append(icon, label);
      item.append(card);
      list.append(item);
    }
    return list;
  }

  function createRow(title, id, entries, kind) {
    const label = element('h3', 'showcase-row-label', title);
    label.id = id;
    const row = element('section', 'showcase-row showcase-row-' + kind);
    row.setAttribute('aria-labelledby', id);
    const viewport = element('div', 'showcase-viewport');
    viewport.addEventListener('touchstart', () => { if (enabled) setPlayback(false); }, { passive: true });
    const track = element('div', 'showcase-track');
    const first = createList(entries, false);
    const repeat = createList(entries, true);
    track.append(first, repeat);
    viewport.append(track);
    row.append(label, viewport);
    showcase.append(row);

    new ResizeObserver(() => {
      const width = first.getBoundingClientRect().width;
      if (width) row.style.setProperty('--showcase-period', Math.max(12, width / 36) + 's');
    }).observe(first);
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !reduced.matches;
  function setPlayback(play) {
    enabled = play && !reduced.matches;
    showcase.classList.toggle('is-still', !enabled);
    if (enabled) showcase.querySelectorAll('.showcase-viewport').forEach(viewport => { viewport.scrollLeft = 0; });
    playback.textContent = enabled ? 'Pause logo motion' : 'Play logo motion';
    playback.hidden = reduced.matches;
  }

  createRow('Work & collaborations', 'landing-companies-title', companies, 'companies');
  createRow('Tools', 'landing-tools-title', tools, 'tools');
  playback.addEventListener('click', () => setPlayback(!enabled));
  reduced.addEventListener('change', () => setPlayback(!reduced.matches));
  setPlayback(enabled);

  new IntersectionObserver(([entry]) => {
    showcase.classList.toggle('is-visible', entry.isIntersecting);
  }).observe(showcase);
})();
