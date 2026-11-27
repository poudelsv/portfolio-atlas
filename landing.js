'use strict';

const labels = {
  prompts: [
    ['roles', 'What does Saurav do?'],
    ['projects', 'What projects has he built?'],
    ['experience', 'Where has he worked?'],
    ['availability', 'When can you start?'],
    ['job-search', 'What are you looking for?'],
    [null, 'What is machine learning?'],
  ],
  workAnswer: 'Explore projects across aviation, healthcare, data, AI, and software.',
  roleAnswer: 'Saurav works on data engineering, software development, machine learning, and applied AI.',
  availabilityAnswer: 'I can start working in May 2027.',
  jobSearchAnswer: 'I’m looking for full-time roles related to data, AI, and software.',
  privacyAnswer: 'I keep this chat focused on professional work and general questions. Ask me about projects, skills, or a technical topic.',
  contactAnswer: 'Open Contact in the navigation for professional contact options.',
  fallback: 'I can help with questions about Saurav’s public projects, experience, and skills. Try asking about a specific project or work topic.',
  aiUnavailable: 'General AI couldn’t run in this browser right now. Try again, or ask me about the portfolio.',
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
let generalWorker;
let generating = false;
const generalHistory = [];
const privateValue = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{3}-\d{2}-\d{4}\b|(?:\+?1[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]?\d{3}[ .-]?\d{4}\b/i;
const personalTopic = /\b(?:e[ -]?mail(?: address)?|phone number|cell number|home address|mailing address|zip code|birthday|birth date|date of birth|age|family|relationship|medical history|salary|gpa|social security|ssn|passport number|personal (?:info(?:rmation)?|details))\b/i;

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

function isPersonalQuestion(text) {
  return privateValue.test(text) ||
    /\b(?:where (?:do|does) (?:you|he|saurav(?: poudel)?) (?:live|stay)|how old (?:are you|is (?:he|saurav(?: poudel)?)))\b/i.test(text) ||
    (personalTopic.test(text) && (/\b(?:saurav|poudel|you|your|he|his|portfolio owner)\b/i.test(text) ||
      /\b(?:what(?:['’]s| is)|who|tell me|find|give|look up|show|reveal|share|disclose)\b.{0,85}(?:['’]s\s+|\b(?:their|her)\s+)/i.test(text) ||
      /^\s*(?:e[ -]?mail|phone number|home address|birthday|gpa|ssn)\s*\??\s*$/i.test(text)));
}

function portfolioAnswer(text, intent) {
  const query = text.toLowerCase();
  const normalized = query.replace(/[^a-z0-9]+/g, '');
  const project = !intent && [...landingData.projects]
    .sort((first, second) => second.title.length - first.title.length)
    .find(item => [item.title, ...(item.aliases || [])].some(title => {
      const name = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return normalized.includes(name);
    }));
  const faq = sapoFaq.find(entry => entry.patterns.some(pattern => pattern.test(text)));
  if (intent === 'availability' || /\b(?:when (?:can|could|would) (?:you|saurav|he) (?:start|begin|join)|when (?:are you|is (?:saurav|he)) available|how soon (?:can|could) (?:you|saurav|he) start|(?:your|his|saurav['’]s) start date)\b/.test(query)) {
    return { reply: labels.availabilityAnswer };
  }
  if (intent === 'job-search' || /\b(?:what are you looking for|(?:your|his|saurav['’]s) (?:target roles|job search))\b/.test(query)) {
    return { reply: labels.jobSearchAnswer };
  }
  if (intent === 'roles' || /\b(?:what (?:does saurav|do you) do|saurav['’]s professional focus)\b/.test(query)) {
    return { reply: labels.roleAnswer };
  }
  if (intent === 'projects' || /\b(?:what projects (?:have you|has he|has saurav) built|show me (?:your|his|saurav['’]s) projects)\b/.test(query) || /^(?:projects|portfolio)\??$/.test(query)) {
    return {
      reply: labels.workAnswer + ' Start with ' + landingData.projects.slice(0, 3).map(item => item.title).join(', ') + '.',
      link: externalLink('View projects', 'projects.html?v=case-studies'),
    };
  }
  if (faq || project) {
    return { reply: faq?.answer ?? project.description, link: project?.url ? externalLink(labels.repo, project.url) : null };
  }
  if (/\b(?:how (?:can|do|should) i (?:hire|contact|reach) (?:you|him|saurav)|contact saurav|professional contact|open contact)\b/.test(query)) {
    return { reply: labels.contactAnswer };
  }
  if (intent === 'experience' || /\b(?:saurav|poudel|portfolio owner)\b/.test(query)) {
    return { reply: labels.fallback };
  }
}

function requestGeneralAnswer(text, onProgress) {
  const worker = generalWorker ??= new Worker(new URL('sapo-ai-worker.js?v=1', location.href), { type: 'module' });
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(fail, 240000);

    function cleanup() {
      clearTimeout(timeout);
      worker.removeEventListener('message', receive);
      worker.removeEventListener('error', fail);
    }

    function fail() {
      cleanup();
      worker.terminate();
      generalWorker = undefined;
      reject(new Error('General AI unavailable'));
    }

    function receive({ data }) {
      if (data.type === 'progress') onProgress(data.text);
      if (data.type === 'error') fail();
      if (data.type === 'answer') {
        cleanup();
        resolve(data.text);
      }
    }

    worker.addEventListener('message', receive);
    worker.addEventListener('error', fail);
    try {
      worker.postMessage({ question: text, history: generalHistory });
    } catch {
      fail();
    }
  });
}

async function ask(value, intent) {
  const text = value.trim();
  if (!text) return;
  const personal = isPersonalQuestion(text);
  addMessage(personal ? 'A question about personal information' : text, 'user');
  question.value = '';
  question.focus();
  const known = personal ? { reply: labels.privacyAnswer } : portfolioAnswer(text, intent);
  if (known) {
    const answer = addMessage(known.reply, 'guide');
    if (known.link) answer.append(' ', known.link);
  } else if (generating) {
    addMessage('Sapo is still working on the previous general question.', 'guide');
  } else {
    generating = true;
    const answer = addMessage('Starting general AI in your browser…', 'guide');
    conversation.scrollTop = conversation.scrollHeight;
    try {
      const result = await requestGeneralAnswer(text, progress => { answer.textContent = progress; });
      const cleanReply = typeof result === 'string' ? result.trim() : '';
      if (!cleanReply) throw new Error('Empty answer');
      answer.classList.add('generated');
      answer.textContent = privateValue.test(cleanReply) ? labels.privacyAnswer : cleanReply;
      if (answer.textContent === cleanReply) {
        generalHistory.push({ role: 'user', content: text }, { role: 'assistant', content: cleanReply });
        if (generalHistory.length > 4) generalHistory.splice(0, generalHistory.length - 4);
      }
    } catch {
      answer.textContent = labels.aiUnavailable;
    } finally {
      generating = false;
    }
  }
  conversation.scrollTop = conversation.scrollHeight;
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
