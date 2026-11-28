'use strict';

function initExplorer(openProject) {
  const section = document.getElementById('works');
  const relationships = document.getElementById('project-tree');
  const projects = landingData.projects;
  const fields = [...new Set([...(landingData.fields || []), ...projects.flatMap(project => project.fields || [])])];
  const toolShortNames = {
    'Entity Framework Core': 'EF Core',
    'Great Expectations': 'Great Expect.',
    'Ontology Actions': 'Ont. Actions',
    'Role-based permissions': 'Role permissions',
    'Salesforce CRM': 'SF CRM',
    'Salesforce Flow': 'SF Flow',
    'Salesforce Sandbox': 'SF Sandbox',
    'Stored procedures': 'Stored procs',
    'XR Interaction Toolkit': 'XR Toolkit',
  };

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
  const treeLink = node('a', 'Explore project relationships', 'explorer-tree-link');
  treeLink.href = '#project-tree';
  header.append(heading, node('p', 'Explore my work by field, or trace a project to the tools behind it.'), treeLink);

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

  const treeHeader = node('header', '', 'explorer-tree-header');
  const treeTitle = node('h2', 'Explore project relationships');
  treeTitle.id = 'project-tree-title';
  const instructions = node('p', 'Select a field or tool to filter. Select a project to open its case study.', 'explorer-tree-caption');
  const treeControls = node('div', '', 'explorer-tree-controls');
  const treeStatus = node('p', '', 'explorer-tree-status');
  treeStatus.setAttribute('role', 'status');
  const treeClear = button('Clear filters', 'explorer-clear', () => {
    setField('');
    fieldNodes.values().next().value?.focus({ preventScroll: true });
  });
  treeControls.append(treeStatus, treeClear);
  treeHeader.append(treeTitle, instructions, treeControls);

  const map = node('div', '', 'explorer-map');
  const emptyMap = node('p', '', 'explorer-map-empty');
  const network = node('div', '', 'explorer-network');
  const canvas = node('canvas', '', 'explorer-edges');
  canvas.setAttribute('aria-hidden', 'true');
  network.append(canvas);
  map.append(network, emptyMap);

  const groups = ['Fields', 'Projects', 'Tools'].map(label => {
    const part = node('div', '', 'explorer-network-column');
    const list = node('ul');
    part.append(node('h3', label), list);
    network.append(part);
    return list;
  });

  const context = canvas.getContext('2d');
  const fieldNodes = new Map();
  const projectNodes = new Map();
  const toolNodes = new Map();
  const nodeDetails = new WeakMap();
  const filterButtons = new Map();
  let selectedField = '';
  let selectedTool = '';
  let pointerNode;
  let focusedNode;
  let linkedProject;
  let diagramProjects = [];
  let pendingDraw;

  function traceNodes() {
    const linked = projectNodes.get(linkedProject);
    const root = pointerNode || focusedNode || linked || toolNodes.get(selectedTool) || fieldNodes.get(selectedField);
    const scope = nodeDetails.get(root);
    const related = new Set();
    const matches = new Set();
    if (scope) {
      for (const project of diagramProjects) {
        if (scope.kind === 'project' ? project !== scope.key : !(project[scope.kind + 's'] || []).includes(scope.key)) continue;
        matches.add(project);
        related.add(projectNodes.get(project));
        for (const field of project.fields || []) if (scope.kind !== 'field' || field === scope.key) related.add(fieldNodes.get(field));
        for (const tool of project.tools || []) if (scope.kind !== 'tool' || tool === scope.key) related.add(toolNodes.get(tool));
      }
    }
    const nodes = [...fieldNodes.values(), ...projectNodes.values(), ...toolNodes.values()];
    for (const item of nodes) {
      item.classList.toggle('is-current', item === root);
      item.classList.toggle('is-related', related.has(item));
      item.classList.toggle('is-dimmed', Boolean(scope) && !related.has(item));
    }
    return { root, matches, related };
  }

  function drawMap() {
    if (network.hidden) return;
    const { root, matches, related } = traceNodes();
    if (!context) return;
    const area = network.getBoundingClientRect();
    if (!area.width || !area.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.ceil(area.width * ratio);
    const height = Math.ceil(area.height * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, area.width, area.height);

    const bounds = new Map([...fieldNodes.values(), ...projectNodes.values(), ...toolNodes.values()]
      .map(item => [item, item.getBoundingClientRect()]));
    const edges = [];
    function connect(left, right, project, toolEdge = false) {
      if (!bounds.has(left) || !bounds.has(right)) return;
      edges.push({ left, right, focused: matches.has(project) && related.has(left) && related.has(right), toolEdge });
    }
    for (const project of diagramProjects) {
      const projectNode = projectNodes.get(project);
      for (const field of project.fields || []) connect(fieldNodes.get(field), projectNode, project);
      for (const tool of project.tools || []) connect(projectNode, toolNodes.get(tool), project, true);
    }

    const toolStart = groups[2].getBoundingClientRect().left - area.left;
    // Draw subdued paths first so the active relationships stay visible at crossings.
    for (const { left, right, focused, toolEdge } of edges.sort((a, b) => Number(a.focused) - Number(b.focused))) {
      const first = bounds.get(left);
      const second = bounds.get(right);
      const x1 = first.right - area.left;
      const x2 = second.left - area.left;
      const y1 = first.top - area.top + first.height / 2;
      const y2 = second.top - area.top + second.height / 2;
      const entry = toolEdge ? toolStart : x2;
      const middle = (x1 + entry) / 2;
      context.strokeStyle = toolEdge ? '#9ab2f4' : '#c7a9ff';
      context.globalAlpha = focused ? .88 : root ? .055 : toolEdge ? .14 : .24;
      context.lineWidth = focused ? 1.55 : .8;
      context.beginPath();
      context.moveTo(x1, y1);
      context.bezierCurveTo(middle, y1, middle, y2, entry, y2);
      if (toolEdge) context.lineTo(x2, y2);
      context.stroke();
    }
  }

  function scheduleDraw() {
    cancelAnimationFrame(pendingDraw);
    pendingDraw = requestAnimationFrame(drawMap);
  }

  function diagramButton(list, label, kind, key, action, pressed) {
    const entry = node('li');
    const item = button('', 'explorer-node ' + kind + '-node', action);
    const shortLabel = kind === 'project' && label.length > 30
      ? key.aliases?.find(alias => alias.length >= 9 && alias.length <= 28)
      : kind === 'tool' ? toolShortNames[label] : null;
    item.append(node('span', label, shortLabel ? 'explorer-label-full' : ''));
    if (shortLabel) {
      item.append(node('span', shortLabel, 'explorer-label-short'));
      item.setAttribute('aria-label', label);
    }
    item.title = label;
    nodeDetails.set(item, { kind, key });
    if (pressed !== undefined) item.setAttribute('aria-pressed', String(pressed));
    entry.append(item);
    list.append(entry);
    return item;
  }

  function renderMap() {
    const focus = document.activeElement;
    const rememberedField = [...fieldNodes].find(([, item]) => item === focus)?.[0];
    const rememberedTool = [...toolNodes].find(([, item]) => item === focus)?.[0];
    pointerNode = undefined;
    focusedNode = undefined;
    fieldNodes.clear();
    projectNodes.clear();
    toolNodes.clear();
    groups.forEach(list => list.replaceChildren());
    const visibleFields = new Set(diagramProjects.flatMap(project => project.fields || []));
    const tools = [...new Set(diagramProjects.flatMap(project => project.tools || []))].sort((a, b) => a.localeCompare(b));

    for (const field of fields.filter(candidate => visibleFields.has(candidate))) {
      fieldNodes.set(field, diagramButton(groups[0], field, 'field', field, () => setField(selectedField === field ? '' : field), field === selectedField));
    }
    for (const project of diagramProjects) {
      projectNodes.set(project, diagramButton(groups[1], project.title, 'project', project, () => openProject(project)));
    }
    for (const tool of tools) {
      toolNodes.set(tool, diagramButton(groups[2], tool, 'tool', tool, () => {
        selectedTool = selectedTool === tool ? '' : tool;
        linkedProject = undefined;
        render();
      }, tool === selectedTool));
    }
    if (!tools.length) groups[2].append(node('li', 'No tools listed', 'explorer-node-empty'));

    network.hidden = diagramProjects.length === 0;
    emptyMap.hidden = !network.hidden;
    emptyMap.textContent = 'Relationships appear when a project is added to this field.';
    if (rememberedField) (fieldNodes.get(rememberedField) || fieldNodes.values().next().value || treeLink).focus({ preventScroll: true });
    if (rememberedTool) (toolNodes.get(rememberedTool) || fieldNodes.values().next().value || treeLink).focus({ preventScroll: true });
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
    treeStatus.textContent = contextLabel ? status.textContent : '';
    treeControls.hidden = !contextLabel;
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
    linkedProject = undefined;
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

  network.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    pointerNode = event.target.closest('.explorer-node');
    scheduleDraw();
  });
  network.addEventListener('pointerleave', () => {
    pointerNode = undefined;
    scheduleDraw();
  });
  network.addEventListener('focusin', event => {
    focusedNode = event.target.closest('.explorer-node');
    scheduleDraw();
  });
  network.addEventListener('focusout', event => {
    focusedNode = event.relatedTarget?.closest?.('.explorer-node');
    scheduleDraw();
  });
  new ResizeObserver(scheduleDraw).observe(network);
  section.replaceChildren(header, filters, resultsHeader, cards, pager);
  relationships.replaceChildren(treeHeader, map);

  const route = new URLSearchParams(location.search);
  const requestedField = route.get('field')?.trim().toLowerCase();
  selectedField = fields.find(field => field.toLowerCase() === requestedField) || '';
  const requestedTool = route.get('tool')?.trim().toLowerCase();
  if (requestedTool) {
    selectedTool = projects.filter(project => !selectedField || (project.fields || []).includes(selectedField))
      .flatMap(project => project.tools || []).find(tool => tool.toLowerCase() === requestedTool) || '';
  }
  render();

  const requestedProject = route.get('project');
  const index = displayedProjects.findIndex(project => sapoSlug(project.title) === requestedProject);
  const project = displayedProjects[index];
  const opensTree = () => location.hash === '#' + relationships.id;
  if (index >= 0) {
    showProject(index);
    if (!opensTree()) openProject(project);
  }

  function revealTree() {
    if (!opensTree()) return;
    linkedProject = project;
    relationships.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    scheduleDraw();
  }

  if (opensTree() && document.readyState !== 'complete') window.addEventListener('DOMContentLoaded', revealTree, { once: true });
  else revealTree();
  window.addEventListener('hashchange', revealTree);
}
