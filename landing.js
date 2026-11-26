'use strict';

const labels = {
  prompts: [
    ['roles', 'What does Saurav do?'],
    ['projects', 'What projects has he built?'],
    ['experience', 'Where has he worked?'],
    ['availability', 'When can you start?'],
    ['job-search', 'What are you looking for?'],
  ],
  workAnswer: 'Explore projects across aviation, healthcare, data, AI, and software.',
  roleAnswer: 'My focus is data engineering, software development, and applied AI.',
  availabilityAnswer: 'I can start working in May 2027.',
  jobSearchAnswer: 'I’m looking for full-time roles related to data, AI, and software.',
  contactAnswer: 'You can find my email, phone number, LinkedIn, and GitHub in Contact.',
  fallback: 'I can answer questions using my portfolio. Ask about a named project, my experience, or the type of work I do.',
  repo: 'View repository',
};
const get = id => document.getElementById(id);
const dialog = get('detail');
const askPanel = get('ask-panel');
const askToggle = get('ask-toggle');
const contactPanel = get('contact-panel');
const contactButtons = [get('dock-contact'), get('hero-contact')].filter(Boolean);
let contactTrigger = contactButtons[0];
const question = get('question');
const conversation = get('conversation');
let contactCloseTimer;

function make(tag, value, className) {
  const element = document.createElement(tag);
  if (value) element.textContent = value;
  if (className) element.className = className;
  return element;
}

function externalLink(label, href) {
  const anchor = make('a', label, 'button');
  anchor.href = href;
  return anchor;
}

function initProfile() {
  if (get('intro')) {
    get('intro').textContent = landingData.intro;
    get('role').textContent = landingData.roles.join(' · ');
  }
  get('suggestions').replaceChildren(...labels.prompts.map(([intent, prompt]) => {
    const button = make('button', prompt);
    button.type = 'button';
    button.addEventListener('click', () => ask(prompt, intent));
    return button;
  }));
}

function openDetails(title, elements) {
  const heading = make('h2', title);
  heading.id = 'detail-title';
  get('detail-content').replaceChildren(heading, ...elements);
  if (!dialog.open) dialog.showModal();
}

function openProject(project) {
  const nodes = [make('p', project.category, 'case-category'), make('p', project.description)];
  if (project.metrics?.length) {
    const facts = make('dl', '', 'case-metrics');
    for (const {value, label} of project.metrics) {
      const fact = make('div');
      fact.append(make('dt', label), make('dd', value));
      facts.append(fact);
    }
    nodes.push(make('h3', 'Impact & scope'), facts);
  }
  if (project.contributions?.length) {
    const contributions = make('ul', '', 'case-contributions');
    contributions.append(...project.contributions.map(item => make('li', item)));
    nodes.push(make('h3', 'What I contributed'), contributions);
  }
  if (project.tools?.length) nodes.push(make('h3', 'Tools'), make('p', project.tools.join(' · ')));
  if (project.benchmark) nodes.push(make('h3', 'Evaluation'), make('p', project.benchmark));
  if (project.url) nodes.push(externalLink(labels.repo, project.url));
  openDetails(project.title, nodes);
}

function renderContact() {
  const {email, phone, linkedin} = landingData.contact;
  const phoneDigits = phone.replace(/[^\d+]/g, '');
  const telephone = phoneDigits.length === 10 ? '+1' + phoneDigits : phoneDigits;
  const methods = [
    ['Email', email, 'mailto:' + email],
    ['Phone', phone, 'tel:' + telephone],
    ['LinkedIn', 'Saurav Poudel', linkedin],
    ['GitHub', '@' + new URL(landingData.github).pathname.split('/').filter(Boolean)[0], landingData.github],
  ];
  get('contact-methods').replaceChildren(...methods.map(([label, value, href], index) => {
    const row = make('div', '', 'contact-row');
    const dd = make('dd');
    const link = make('a', value);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    dd.append(link);
    row.append(make('dt', label), dd);
    if (index === 0) {
      const copyCell = make('dd');
      const copy = make('button', 'Copy');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(email);
          copy.textContent = 'Copied';
          get('contact-feedback').textContent = 'Copied';
        } catch {
          copy.textContent = 'Copy unavailable';
          get('contact-feedback').textContent = 'Copy unavailable';
        }
      });
      copyCell.append(copy);
      row.append(copyCell);
    } else {
      const arrow = make('dd', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      row.append(arrow);
    }
    return row;
  }));
}

function setContact(open, focus = false) {
  clearTimeout(contactCloseTimer);
  if (open) setAsk(false, false);
  const wasOpen = !contactPanel.hidden;
  contactPanel.hidden = !open;
  for (const button of contactButtons) button.setAttribute('aria-expanded', String(open));
  if (open) {
    if (!wasOpen) renderContact();
    if (focus) contactPanel.querySelector('a').focus({preventScroll: true});
  } else if (wasOpen && focus) {
    contactTrigger.focus({preventScroll: true});
  }
}

function setAsk(open, focus = true) {
  if (open) setContact(false);
  askPanel.hidden = !open;
  askToggle.setAttribute('aria-expanded', String(open));
  if (focus) (open ? question : askToggle).focus();
}

function addMessage(value, kind) {
  const message = make('p', value, 'message ' + kind);
  conversation.append(message);
  return message;
}

function ask(value, intent) {
  const text = value.trim();
  if (!text) return;
  const query = text.toLowerCase();
  const normalized = query.replace(/[^a-z0-9]+/g, '');
  const project = !intent && [...landingData.projects]
    .sort((first, second) => second.title.length - first.title.length)
    .find(item => [item.title, ...(item.aliases || [])].some(title => {
      const name = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return normalized.includes(name);
    }));
  addMessage(text, 'user');
  let reply = labels.fallback;
  let link;
  if (intent === 'availability' || /\b(?:start date|when (?:can|could|would) (?:you|saurav|he) (?:start|begin|join)|when (?:are you|is (?:saurav|he)) available|how soon (?:can|could) (?:you|saurav|he) start|available to (?:start|work))\b/.test(query)) {
    reply = labels.availabilityAnswer;
  } else if (intent === 'job-search' || /\b(?:(?:you|saurav|he) (?:are |is )?looking for|target roles|(?:roles?|jobs?|positions?) (?:do you |does (?:saurav|he) )?(?:want|seek)|seeking (?:roles?|jobs?|positions?|work))\b/.test(query)) {
    reply = labels.jobSearchAnswer;
  } else if (project) {
    reply = project.description;
    if (project.url) link = externalLink(labels.repo, project.url);
  } else if (intent === 'experience' || /experience|worked|résumé|resume|travaill|delta|career/.test(query)) {
    const delta = /delta/.test(query);
    const experience = delta ? landingData.experience.filter(item => item.organization.includes('Delta')) : landingData.experience;
    reply = experience.map(item => item.title + ' · ' + item.organization + '. ' + item.description).join(' ');
  } else if (intent === 'projects' || /project|projet|portfolio|build|built/.test(query)) {
    reply = labels.workAnswer + ' Start with ' + landingData.projects.slice(0, 3).map(item => item.title).join(', ') + '.';
    link = make('a', 'Projects');
    link.href = 'projects.html?v=case-studies';
    link.addEventListener('click', () => setAsk(false, false));
  } else if (/hire|contact|available|github|disponib/.test(query)) {
    reply = labels.contactAnswer;
    link = make('a', 'Open contact');
    link.href = '#dock-contact';
    link.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      contactTrigger = get('dock-contact');
      setContact(true, true);
    });
  } else if (intent === 'roles' || /skill|python|software|analytics|what.*do|que fait|\bai\b/.test(query)) {
    reply = labels.roleAnswer;
  }
  const answer = addMessage(reply, 'guide');
  if (link) answer.append(' ', link);
  conversation.scrollTop = conversation.scrollHeight;
  question.value = '';
  question.focus();
}

function playIntro() {
  const loader = document.querySelector('.loader');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!loader || (document.referrer.startsWith(location.origin + '/') && navigation?.type === 'navigate') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-loading');
  loader.addEventListener('animationend', () => {
    loader.hidden = true;
  }, { once: true });
}

get('ask-form').addEventListener('submit', event => {
  event.preventDefault();
  ask(question.value);
});
askToggle.addEventListener('click', () => setAsk(askPanel.hidden));
get('close-ask').addEventListener('click', () => setAsk(false));
document.querySelectorAll('.tabs a').forEach(link => link.addEventListener('click', () => {
  setAsk(false, false);
  setContact(false);
}));
const dockContact = get('dock-contact');
const contactShell = dockContact.closest('.dock-shell');
dockContact.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  contactTrigger = dockContact;
  setContact(true);
});
contactShell.addEventListener('pointerenter', () => clearTimeout(contactCloseTimer));
contactShell.addEventListener('pointerleave', event => {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  contactCloseTimer = setTimeout(() => {
    if (!contactPanel.contains(document.activeElement)) setContact(false);
  }, 180);
});
for (const button of contactButtons) {
  button.addEventListener('click', event => {
    const open = contactPanel.hidden || (button === dockContact && event.detail > 0 && !contactPanel.contains(document.activeElement));
    if (open) contactTrigger = button;
    setContact(open, true);
  });
}
document.addEventListener('click', event => {
  if (!contactPanel.hidden && !contactPanel.contains(event.target)
      && !contactButtons.some(button => button.contains(event.target))) setContact(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || dialog.open) return;
  if (!askPanel.hidden) setAsk(false);
  if (!contactPanel.hidden) setContact(false, true);
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

initProfile();
if (currentPage === 'resume') initResume();
if (currentPage === 'projects') initExplorer(openProject);
playIntro();
