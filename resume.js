'use strict';

function initResume() {
  const section = document.getElementById('resume');
  const { experience, education, skills = [], honors = [], certifications = [] } = landingData;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const millisecondsPerDay = 86400000;
  const today = Math.floor(Date.now() / millisecondsPerDay);
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

  function calendarDay(label, endOfMonth = false) {
    if (label === 'Present') return today;
    const parts = label?.match(/^([A-Za-z]{3})[a-z.]*\s+(\d{4})$/i);
    if (!parts) return NaN;
    const month = months.findIndex(name => name.toLowerCase() === parts[1].toLowerCase());
    if (month === -1) return NaN;
    const year = Number(parts[2]);
    return (endOfMonth ? Date.UTC(year, month + 1, 0) : Date.UTC(year, month, 1)) / millisecondsPerDay;
  }

  const dated = experience.map(role => {
    const [first, last] = (role.dates || '').split(/\s+[–—-]\s+/);
    return { role, start: calendarDay(first), end: calendarDay(last, true) };
  }).filter(event => Number.isFinite(event.start)).sort((a, b) => a.start - b.start);
  const logos = typeof companyLogos === 'undefined' ? {} : companyLogos;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function element(tag, value = '', className = '') {
    const item = document.createElement(tag);
    item.textContent = value;
    if (className) item.className = className;
    return item;
  }

  function list(tag, values, className = '') {
    const group = element(tag, '', className);
    group.setAttribute('role', 'list');
    group.append(...values.map(value => element('li', value)));
    return group;
  }

  function button(text, className = '') {
    const control = element('button', text, className);
    control.type = 'button';
    return control;
  }

  const title = element('h2', 'Resume', 'sr-only');
  title.id = 'resume-title';
  section.replaceChildren(title);
  section.setAttribute('aria-labelledby', title.id);

  if (dated.length) {
    const firstDay = dated[0].start;
    const lastDay = Math.max(...dated.map(event => Number.isFinite(event.end) ? event.end : event.start));
    const totalDays = Math.max(1, lastDay - firstDay);
    const offsets = dated.map(event => event.start - firstDay);
    const speed = totalDays / 23000;
    const displayOffsets = [...offsets];
    const milestonesByDate = [];
    // Keep concurrent roles on the same dated tick, then cycle their panels as the cursor travels.
    for (let first = 0; first < offsets.length;) {
      let after = first + 1;
      while (offsets[after] === offsets[first]) after++;
      const span = (offsets[after] ?? totalDays) - offsets[first];
      const interval = Math.min(span / (after - first), speed * 1800);
      for (let i = first + 1; i < after; i++) displayOffsets[i] += interval * (i - first);
      milestonesByDate.push({ first, after });
      first = after;
    }
    let playing = dated.length > 1 && !reducedMotion.matches;
    let selection = playing ? 0 : milestonesByDate.at(-1).first;
    let cursor = offsets[selection];
    let visible = false;
    let scrubbing = false;
    let frame;
    let lastFrame;
    let transition;
    let activePanel;
    let retiringPanel;
    const experienceSection = element('section', '', 'resume-experience');
    const careerHeader = element('header', '', 'career-header');
    const experienceHeading = element('h3', 'Experience');
    experienceHeading.id = 'experience-title';
    experienceSection.setAttribute('aria-labelledby', experienceHeading.id);
    careerHeader.append(experienceHeading);

    const stage = element('div', '', 'career-stage');
    stage.id = 'career-role';
    const progress = element('p', '', 'sr-only');
    progress.setAttribute('role', 'status');
    const playback = button('Play', 'career-playback');
    playback.setAttribute('aria-controls', stage.id);
    if (dated.length > 1) careerHeader.append(playback);

    const controls = element('div', '', 'career-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Experience timeline');

    const dates = element('div', '', 'career-dates');
    const currentDate = element('time', '', 'career-current-date');
    const track = element('div', '', 'career-track');
    track.setAttribute('aria-hidden', 'true');
    for (const offset of new Set(offsets)) {
      const tick = element('span', '', 'career-tick');
      tick.style.setProperty('--career-tick', offset / totalDays * 100 + '%');
      track.append(tick);
    }
    const range = element('input', '', 'career-range');
    range.type = 'range';
    range.min = 0;
    range.max = totalDays;
    range.step = 1;
    range.setAttribute('aria-label', 'Role by date');
    range.setAttribute('aria-controls', stage.id);
    const sliderInstructions = element('p', 'Use the arrow keys to move one day or Page Up and Page Down to jump to a role.', 'sr-only');
    sliderInstructions.id = 'career-slider-instructions';
    range.setAttribute('aria-describedby', sliderInstructions.id);
    const milestones = element('div', '', 'career-milestones');
    const dateButtons = milestonesByDate.map(({ first, after }) => {
      const { start } = dated[first];
      const short = monthFormatter.format(start * millisecondsPerDay).replace(/\b(\d{2})(\d{2})$/, '’$2');
      const control = button(short, 'career-milestone');
      const options = dated.slice(first, after).map(({ role }) => role.title).join(' / ');
      control.title = monthFormatter.format(start * millisecondsPerDay) + ' · ' + options;
      control.setAttribute('aria-label', control.title);
      control.style.setProperty('--career-tick', offsets[first] / totalDays * 100 + '%');
      control.addEventListener('click', () => {
        const index = selection >= first && selection + 1 < after ? selection + 1 : first;
        seek(offsets[first], index, true);
      });
      return control;
    });
    milestones.append(...dateButtons);
    dates.append(currentDate, track, range, milestones, sliderInstructions);
    controls.append(dates);
    experienceSection.append(careerHeader, stage, controls, progress);
    const historyLink = element('a', 'Full work history', 'career-history-link');
    historyLink.href = '#resume-history';
    experienceSection.append(historyLink);
    section.append(experienceSection);

    function render(animate) {
      const role = dated[selection].role;
      const key = role.logoKey || role.organization.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const visual = element('div', '', 'career-visual');
      visual.setAttribute('aria-hidden', 'true');

      const badge = element('span', '', 'career-company-mark');
      const monogram = key.startsWith('uc') || role.organization.startsWith('University of Cincinnati') ? 'UC' :
        role.organization.split(/\s+/).slice(0, 3).map(word => word[0]).join('').toUpperCase();
      const fallback = element('span', monogram);
      const src = logos[key];
      if (src) {
        const logo = element('img');
        logo.alt = '';
        if (!/-light\.(svg|webp|png)(?:[?#]|$)/i.test(src)) logo.className = 'career-logo-monochrome';
        logo.src = src;
        logo.addEventListener('error', () => {
          logo.remove();
          fallback.hidden = false;
        }, { once: true });
        fallback.hidden = true;
        badge.append(logo);
      }
      badge.append(fallback);
      visual.append(badge);

      const detail = element('div', '', 'career-detail');
      const time = element('p', role.dates, 'career-date');
      const job = element('h4', role.title);
      const employer = element('p', role.organization, 'career-employer');
      detail.append(time, job, employer, element('p', role.location, 'career-location'));

      const panel = element('div', '', 'career-role-panel');
      panel.append(visual, detail);
      transition?.cancel();
      retiringPanel?.remove();
      if (animate && activePanel && !reducedMotion.matches) {
        const outgoing = activePanel;
        retiringPanel = outgoing;
        outgoing.setAttribute('aria-hidden', 'true');
        outgoing.inert = true;
        stage.append(panel);
        outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).onfinish = () => {
          outgoing.remove();
          if (retiringPanel === outgoing) retiringPanel = undefined;
        };
        transition = panel.animate([
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: .29 },
          { opacity: 1, offset: 1 },
        ], { duration: 480, easing: 'ease-out' });
      } else {
        stage.replaceChildren(panel);
      }
      activePanel = panel;
      dateButtons.forEach((control, index) => {
        const { first, after } = milestonesByDate[index];
        if (selection >= first && selection < after) control.setAttribute('aria-current', 'step');
        else control.removeAttribute('aria-current');
      });
    }

    function select(index) {
      if (index === selection) return;
      selection = index;
      render(true);
    }

    function positionAt(offset) {
      cursor = offset;
      const day = Math.floor(offset);
      if (Number(range.value) !== day) range.value = day;
      const position = offset / totalDays * 100 + '%';
      dates.style.setProperty('--career-position', position);
      const millis = (firstDay + day) * millisecondsPerDay;
      const month = new Date(millis).toISOString().slice(0, 7);
      if (currentDate.dateTime !== month) {
        currentDate.dateTime = month;
        currentDate.textContent = monthFormatter.format(millis);
      }
      const role = dated[selection].role;
      const value = currentDate.textContent + ' · ' + role.title + ' at ' + role.organization;
      if (range.getAttribute('aria-valuetext') !== value) range.setAttribute('aria-valuetext', value);
    }

    function seek(offset, index, announce = false) {
      select(index);
      positionAt(offset);
      lastFrame = undefined;
      if (announce) progress.textContent = range.getAttribute('aria-valuetext');
      updatePlayback();
    }

    function advance(now) {
      frame = undefined;
      const elapsed = lastFrame === undefined ? 0 : Math.min(now - lastFrame, 80);
      lastFrame = now;
      if (cursor >= totalDays) {
        select(0);
        positionAt(0);
      } else {
        const offset = Math.min(totalDays, cursor + elapsed * speed);
        const index = displayOffsets.findLastIndex(start => start <= offset);
        if (index > selection) select(index);
        positionAt(offset);
      }
      updatePlayback();
    }

    function updatePlayback() {
      const keyboardFocus = controls.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
      const canAdvance = playing && visible && !document.hidden && !scrubbing && !keyboardFocus;
      if (!canAdvance) {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
        lastFrame = undefined;
        return;
      }
      if (frame === undefined) frame = requestAnimationFrame(advance);
    }

    function setPlaying(value) {
      playing = value;
      playback.textContent = playing ? 'Pause timeline' : 'Play timeline';
      updatePlayback();
    }

    playback.addEventListener('click', () => {
      setPlaying(!playing);
    });
    controls.addEventListener('focusin', updatePlayback);
    controls.addEventListener('focusout', () => queueMicrotask(updatePlayback));
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      transition?.cancel();
      retiringPanel?.remove();
      setPlaying(false);
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .3;
      updatePlayback();
    }, { threshold: .3 }).observe(stage);

    range.addEventListener('pointerdown', () => {
      scrubbing = true;
      updatePlayback();
    });
    function stopScrubbing() {
      if (!scrubbing) return;
      scrubbing = false;
      updatePlayback();
    }
    window.addEventListener('pointerup', stopScrubbing);
    window.addEventListener('pointercancel', stopScrubbing);
    window.addEventListener('blur', stopScrubbing);
    range.addEventListener('input', () => {
      const offset = Number(range.value);
      const index = offsets[selection] === offset ? selection : offsets.findLastIndex(start => start <= offset);
      seek(offset, index);
    });
    range.addEventListener('keydown', event => {
      if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
      event.preventDefault();
      const next = Math.max(0, Math.min(dated.length - 1, selection + (event.key === 'PageUp' ? 1 : -1)));
      seek(offsets[next], next, true);
    });
    render(false);
    positionAt(cursor);
    setPlaying(playing);
  }

  const organizations = [
    ['Fiverr', 'companies/fiverr.svg', 'reverse'],
    ['Upwork', 'companies/upwork.svg'],
    ['Delta Air Lines', 'delta-light.svg'],
    ['LSG Sky Chefs', 'companies/lsg.png', 'lsg'],
    ['IBM', 'companies/ibm.svg', 'light'],
    ['Gate Gourmet', 'companies/gate-gourmet.svg'],
    ['Newrest', 'companies/newrest.png'],
    ['DO & CO', 'companies/do-and-co.png'],
    ['Unifi', 'companies/unifi.png'],
    ['VRPatients', 'companies/vrpatients.png'],
    ['Palantir', 'companies/palantir.svg', 'light'],
    ['Salesforce', 'companies/salesforce.svg'],
    ['FAA', 'companies/faa.svg?v=dark'],
    ['TSA', 'companies/tsa.svg'],
  ];
  const collaborators = element('section', '', 'resume-companies');
  collaborators.id = 'resume-companies';
  const collaboratorsHeading = element('h3', 'Companies I worked and collaborated with');
  collaboratorsHeading.id = 'resume-companies-title';
  collaborators.setAttribute('aria-labelledby', collaboratorsHeading.id);
  const marks = element('ul', '', 'resume-company-list');
  marks.setAttribute('role', 'list');
  for (const [name, path, treatment] of organizations) {
    const item = element('li');
    const logo = element('img', '', treatment ? 'resume-company-' + treatment : '');
    logo.alt = name;
    logo.loading = 'lazy';
    logo.decoding = 'async';
    logo.addEventListener('error', () => logo.replaceWith(element('span', name)), { once: true });
    logo.src = 'assets/' + path;
    item.append(logo);
    marks.append(item);
  }
  collaborators.append(collaboratorsHeading, marks);
  section.append(collaborators);

  if (experience.length) {
    const history = element('section', '', 'resume-history');
    history.id = 'resume-history';
    history.tabIndex = -1;
    const historyHeading = element('h3', 'Full work history');
    historyHeading.id = 'resume-history-title';
    history.setAttribute('aria-labelledby', historyHeading.id);
    const work = element('ol', '', 'resume-history-list');
    for (const role of experience) {
      const job = element('li', '', 'resume-history-entry');
      if (role.dates) job.append(element('p', role.dates, 'history-date'));
      job.append(element('h4', role.title), element('p', role.organization, 'history-company'));
      if (role.highlights?.length) job.append(list('ul', role.highlights, 'history-responsibilities'));
      else if (role.description) job.append(element('p', role.description, 'history-description'));
      work.append(job);
    }
    history.append(historyHeading, work);
    section.append(history);
  }

  const credentials = element('div', '', 'resume-credentials');
  if (education) {
    const study = element('section', '', 'credential credential-education');
    study.append(
      element('h3', 'Education'),
      element('h4', education.school),
      element('p', education.degree),
      element('p', education.focus),
      element('p', [education.graduation && 'Expected ' + education.graduation, education.location].filter(Boolean).join(' · '), 'credential-meta'),
    );
    if (education.gpa) study.append(element('p', 'GPA ' + education.gpa, 'credential-meta'));
    credentials.append(study);
  }
  if (skills.length) {
    const skill = element('section', '', 'credential credential-skills');
    const groups = element('div', '', 'credential-skill-grid');
    for (const group of skills) {
      const category = element('div');
      category.append(element('h4', group.category), list('ul', group.items, 'credential-tags'));
      groups.append(category);
    }
    skill.append(element('h3', 'Skills'), groups);
    credentials.append(skill);
  }
  const accolades = element('div', '', 'credential-accolades');
  for (const [label, items] of [['Honors', honors.filter(item => !certifications.includes(item))], ['Certifications', certifications]]) {
    if (!items.length) continue;
    const group = element('section', '', 'credential');
    const entries = list('ul', items, 'credential-honors');
    for (const entry of entries.children) {
      const url = landingData.certificationLinks?.[entry.textContent];
      if (!url) continue;
      const link = element('a', entry.textContent);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      entry.replaceChildren(link);
    }
    group.append(element('h3', label), entries);
    accolades.append(group);
  }
  if (accolades.childElementCount) credentials.append(accolades);
  if (credentials.childElementCount) section.append(credentials);

  const pdfPath = 'assets/Saurav-Poudel-Resume.pdf?v=credentials-391';
  const pdf = element('section', '', 'resume-document');
  const pdfHeader = element('header', '', 'resume-document-header');
  const pdfTitle = element('h3', 'Résumé PDF');
  pdfTitle.id = 'resume-document-title';
  pdf.setAttribute('aria-labelledby', pdfTitle.id);
  const download = element('a', 'Download PDF', 'button');
  download.href = pdfPath;
  download.download = 'Saurav-Poudel-Resume.pdf';
  pdfHeader.append(pdfTitle, download);
  const preview = element('div', '', 'resume-document-preview');
  preview.setAttribute('aria-label', 'Saurav Poudel résumé preview');
  pdf.append(pdfHeader, preview);

  section.append(pdf);
  initResumePdf(preview, pdfPath);
}
