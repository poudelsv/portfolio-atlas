'use strict';

function initExplorer(openProject) {
  const section = document.getElementById('works');
  const projects = landingData.projects;
  const fields = [...new Set([...(landingData.fields || []), ...projects.flatMap(project => project.fields || [])])];

  function node(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function button(label, className, action) {
    const element = node('button', label, className);
    element.type = 'button';
    element.addEventListener('click', action);
    return element;
  }

  const heading = node('h2', 'Selected work', 'sr-only');
  heading.id = 'works-title';
  section.setAttribute('aria-labelledby', heading.id);
  section.removeAttribute('aria-label');

  const header = node('header', '', 'explorer-header');
  header.append(heading, node('p', 'Explore my work by field, or trace a project to the tools behind it.'));

  const filters = node('div', '', 'explorer-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter projects by field');

  const status = node('p', '', 'explorer-status');
  status.setAttribute('role', 'status');
  const clear = button('Clear filters', 'explorer-clear', () => {
    setField('');
    filterButtons.get('').focus();
  });
  const resultsHeader = node('div', '', 'explorer-results-header');
  const pickerLabel = node('label', 'Browse projects', 'explorer-picker-label');
  const picker = node('select', '', 'explorer-picker');
  picker.addEventListener('change', () => showProject(Number(picker.value)));
  pickerLabel.append(picker);
  resultsHeader.append(status, clear, pickerLabel);
  const cards = node('div', '', 'explorer-cards');
  const pager = node('div', '', 'explorer-pager');
  const previous = button('Previous project', '', () => showProject(displayedIndex - 1));
  const next = button('Next project', '', () => showProject(displayedIndex + 1));
  const slideStatus = node('span');
  slideStatus.setAttribute('role', 'status');
  pager.append(previous, slideStatus, next);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let displayedProjects = [];
  let displayedIndex = 0;
  let projectTransition;

  const map = node('figure', '', 'explorer-map');
  const caption = node('figcaption');
  const instructions = node('p', 'Select a field or tool to filter the projects. Select a project to see its details.');
  caption.append(instructions);
  const emptyMap = node('p', '', 'explorer-map-empty');
  const scroll = node('div', '', 'explorer-map-scroll');
  const network = node('div', '', 'explorer-network');
  const canvas = node('canvas', '', 'explorer-edges');
  canvas.setAttribute('aria-hidden', 'true');
  network.append(canvas);
  scroll.append(network);
  map.append(caption, scroll, emptyMap);

  const groups = ['Fields', 'Projects', 'Tools'].map(label => {
    const part = node('div', '', 'explorer-network-column');
    const list = node('ul');
    part.append(node('h4', label), list);
    network.append(part);
    return list;
  });

  const context = canvas.getContext('2d');
  const fieldNodes = new Map();
  const projectNodes = new Map();
  const toolNodes = new Map();
  const filterButtons = new Map();
  let selectedField = '';
  let selectedTool = '';
  let highlighted;
  let diagramProjects = [];
  let pendingDraw;

  function drawMap() {
    if (!context || scroll.hidden) return;
    const area = network.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(area.width * ratio);
    canvas.height = Math.ceil(area.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    function connect(left, right, project, facet) {
      if (!left || !right) return;
      const first = left.getBoundingClientRect();
      const second = right.getBoundingClientRect();
      const x1 = first.right - area.left;
      const x2 = second.left - area.left;
      const y1 = first.top - area.top + first.height / 2;
      const y2 = second.top - area.top + second.height / 2;
      const middle = (x1 + x2) / 2;
      const active = highlighted && [left, right].includes(highlighted);
      const selected = selectedTool && (project.tools || []).includes(selectedTool);
      context.strokeStyle = active || selected || facet === selectedField ? '#c8baff' : '#81759c';
      context.globalAlpha = highlighted && !active ? .2 : .78;
      context.lineWidth = active || selected ? 2 : 1;
      context.beginPath();
      context.moveTo(x1, y1);
      context.bezierCurveTo(middle, y1, middle, y2, x2, y2);
      context.stroke();
    }

    for (const project of diagramProjects) {
      const projectNode = projectNodes.get(project);
      for (const field of project.fields || []) connect(fieldNodes.get(field), projectNode, project, field);
      for (const tool of project.tools || []) connect(projectNode, toolNodes.get(tool), project);
    }
  }

  function scheduleDraw() {
    cancelAnimationFrame(pendingDraw);
    pendingDraw = requestAnimationFrame(drawMap);
  }

  function diagramButton(list, label, className, action, pressed) {
    const entry = node('li');
    const item = button(label, 'explorer-node ' + className, action);
    if (pressed !== undefined) item.setAttribute('aria-pressed', String(pressed));
    entry.append(item);
    list.append(entry);
    return item;
  }

  function renderMap() {
    const focus = document.activeElement;
    const rememberedField = [...fieldNodes].find(([, item]) => item === focus)?.[0];
    const rememberedTool = [...toolNodes].find(([, item]) => item === focus)?.[0];
    highlighted = undefined;
    fieldNodes.clear();
    projectNodes.clear();
    toolNodes.clear();
    groups.forEach(list => list.replaceChildren());
    const visibleFields = new Set(diagramProjects.flatMap(project => project.fields || []));
    const tools = [...new Set(diagramProjects.flatMap(project => project.tools || []))].sort((a, b) => a.localeCompare(b));

    for (const field of fields.filter(candidate => visibleFields.has(candidate))) {
      fieldNodes.set(field, diagramButton(groups[0], field, 'field-node', () => setField(selectedField === field ? '' : field), field === selectedField));
    }
    for (const project of diagramProjects) {
      projectNodes.set(project, diagramButton(groups[1], project.title, 'project-node', () => openProject(project)));
    }
    for (const tool of tools) {
      toolNodes.set(tool, diagramButton(groups[2], tool, 'tool-node', () => {
        selectedTool = selectedTool === tool ? '' : tool;
        render();
      }, tool === selectedTool));
    }
    if (!tools.length) groups[2].append(node('li', 'No tools listed', 'explorer-node-empty'));

    scroll.hidden = diagramProjects.length === 0;
    emptyMap.hidden = !scroll.hidden;
    emptyMap.textContent = 'Relationships appear when a project is added to this field.';
    if (rememberedField) (fieldNodes.get(rememberedField) || filterButtons.get(selectedField)).focus();
    if (rememberedTool) (toolNodes.get(rememberedTool) || filterButtons.get(selectedField)).focus();
    scheduleDraw();
  }

  function showProject(index) {
    displayedIndex = index;
    const project = displayedProjects[index];
    pager.hidden = displayedProjects.length < 2;
    pickerLabel.hidden = pager.hidden;
    picker.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === displayedProjects.length - 1;
    if (!project) {
      cards.replaceChildren(node('p', selectedField ? 'No projects are listed in ' + selectedField + ' yet.' : 'No projects match these filters.', 'explorer-empty'));
      return;
    }
    slideStatus.textContent = (index + 1) + ' / ' + displayedProjects.length;
    const article = node('article', '', 'explorer-card');
    article.append(node('p', (project.fields || []).join('  ·  '), 'explorer-fields-caption'));
    const name = node('h3');
    name.append(button(project.title, 'explorer-project-title', () => openProject(project)));
    article.append(name, node('p', project.description));
    if (project.metrics?.length) {
      const facts = node('ul', '', 'explorer-facts');
      for (const metric of project.metrics.slice(0, 3)) {
        const item = node('li');
        item.append(node('strong', metric.value), node('span', metric.label));
        facts.append(item);
      }
      article.append(facts);
    }
    article.append(button('Read case study', 'explorer-case-link', () => openProject(project)));
    cards.replaceChildren(article);
    projectTransition?.cancel();
    if (!motion.matches) {
      projectTransition = article.animate([
        { opacity: .05, transform: 'scale(.97)', filter: 'blur(8px)' },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
      ], {duration:590,easing:'cubic-bezier(.2,.65,.25,1)'});
    }
  }

  function render() {
    diagramProjects = projects.filter(project => !selectedField || (project.fields || []).includes(selectedField));
    displayedProjects = diagramProjects.filter(project => !selectedTool || (project.tools || []).includes(selectedTool));
    for (const [field, control] of filterButtons) control.setAttribute('aria-pressed', String(field === selectedField));
    const contextLabel = [selectedField, selectedTool].filter(Boolean).join(' · ');
    status.textContent = displayedProjects.length + (displayedProjects.length === 1 ? ' project' : ' projects') + (contextLabel ? ' · ' + contextLabel : '');
    clear.hidden = !contextLabel;
    picker.replaceChildren(...displayedProjects.map((project, index) => {
      const option = node('option', project.title);
      option.value = String(index);
      return option;
    }));
    showProject(0);
    renderMap();
  }

  function setField(field) {
    selectedField = field;
    selectedTool = '';
    render();
  }

  for (const field of ['', ...fields]) {
    const count = field ? projects.filter(project => (project.fields || []).includes(field)).length : projects.length;
    const label = field || 'All fields';
    const item = button(label, 'explorer-filter', () => setField(field));
    const countBadge = node('span', String(count));
    countBadge.setAttribute('aria-hidden', 'true');
    item.setAttribute('aria-label', label + ', ' + count + (count === 1 ? ' project' : ' projects'));
    item.append(countBadge);
    filterButtons.set(field, item);
    filters.append(item);
  }

  function highlight(event) {
    const target = event.target.closest('.explorer-node');
    if (target === highlighted) return;
    highlighted = target;
    scheduleDraw();
  }

  function unhighlight(event) {
    if (!event.relatedTarget?.closest?.('.explorer-node')) {
      highlighted = undefined;
      scheduleDraw();
    }
  }

  network.addEventListener('pointerover', highlight);
  network.addEventListener('pointerout', unhighlight);
  network.addEventListener('focusin', highlight);
  network.addEventListener('focusout', unhighlight);
  new ResizeObserver(scheduleDraw).observe(network);
  const relationships = node('details', '', 'explorer-details');
  relationships.append(node('summary', 'Explore project relationships'), map);
  relationships.addEventListener('toggle', scheduleDraw);
  section.replaceChildren(header, filters, resultsHeader, cards, pager, relationships);
  const route = new URLSearchParams(location.search);
  const field = fields.find(item => item.toLowerCase() === route.get('field')?.toLowerCase());
  setField(field || '');
  const requestedProject = route.get('project');
  const index = displayedProjects.findIndex(project => sapoSlug(project.title) === requestedProject);
  if (index >= 0) {
    showProject(index);
    openProject(displayedProjects[index]);
  }
}
