'use strict';

const sapoUnrelated = 'I can answer things about Saurav. For general answer, Bing it :)';
const sapoPrivateValue = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{3}-\d{2}-\d{4}\b|(?:\+?1[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]?\d{3}[ .-]?\d{4}\b/i;
const sapoStopWords = new Set('a about after all am an and any are as at been by can could did do does during for from had has have he her his how i in is it its me my of on or our she should so than that the their them these they this to us was were what when where which who why will with would you your saurav poudel tell show give describe please experience used use using work worked works working project projects role roles headline portfolio examples example know'.split(' '));
const sapoWordAliases = [
  [/\bsnowflakes\b/g, 'snowflake'], [/\bpostg?res\b/g, 'postgresql'],
  [/\bpowerbi\b/g, 'power bi'], [/\bnode\.?js\b/g, 'node js'], [/\breact\.?js\b/g, 'react'],
  [/\be ?medly\b/g, 'emedley'], [/\bgen ?ai\b/g, 'generative ai'], [/\bvr\b/g, 'virtual reality'],
  [/\bml\b/g, 'machine learning'], [/\bdelta airlines\b/g, 'delta air lines'],
  [/\b(?:uc|university of cincy)\b/g, 'university of cincinnati'], [/\bitsc\b/g, 'it solution center'],
  [/\bpowerquery\b/g, 'power query'], [/\bc\+\+/g, 'cplusplus'], [/\bc#/g, 'csharp'],
  [/\.net\b/g, 'dotnet'], [/\bfinalcut\b/g, 'final cut'], [/\bdata bases?\b/g, 'database'],
  [/\bco[ -]?ops?\b/g, 'co op'], [/\bcerts?\b/g, 'certification'],
  [/\b(?:studied|studying)\b/g, 'study'], [/\bgraduating\b/g, 'graduate'],
  [/\bdeans\b/g, 'dean'],
];

function sapoSlug(title) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sapoNormalize(value) {
  let text = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [pattern, spelling] of sapoWordAliases) text = text.replace(pattern, spelling);
  return text.replace(/[’']s\b/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function sapoTerms(normalized) {
  return new Set(normalized.split(' ').filter(word => word.length > 1 && !sapoStopWords.has(word)));
}

function sapoIncludes(normalized, phrase) {
  return !!phrase && (' ' + normalized + ' ').includes(' ' + phrase + ' ');
}

function sapoFirstPerson(text) {
  return text.replace(/(^|[.!?] )(Adapt|Analyzed|Answered|Applied|Automated|Built|Collaborated|Combined|Compared|Conduct|Consolidated|Connected|Containerized|Created|Decomposed|Developed|Designed|Documented|Extended|Helped|Help|Implemented|Led|Linked|Maintained|Match|Matched|Optimized|Orchestrated|Participated|Partnered|Prepared|Presented|Processed|Promote|Promoted|Reconciled|Reduced|Represented|Reproduced|Reviewed|Scheduled|Serve|Support|Tested|Train|Translated|Troubleshot|Use|Used|Verified|Verify|Worked|Write)\b/g,
    (_, lead, verb) => lead + 'I ' + verb.toLowerCase());
}

function sapoProjectLink(project) {
  return { label: project.title, href: 'projects.html?project=' + sapoSlug(project.title) + '#works' };
}

function sapoRoleLink(role) {
  return { label: role.title, href: 'resume.html#resume-role-' + sapoSlug(role.title) };
}

function sapoPrivacy(text, query) {
  if (sapoPrivateValue.test(text)) return true;
  return /\b(?:where (?:do|does) (?:you|he|saurav(?: poudel)?) (?:live|stay)|how old (?:are you|is (?:he|saurav(?: poudel)?)))\b/.test(query) ||
    (/\b(?:e ?mail(?: address)?|phone(?: number)?|cell number|home address|street address|mailing address|zip code|birthday|birth date|date of birth|age|family|relationship status|medical history|salary|social security|ssn|passport number|personal (?:info|information|details))\b/.test(query) &&
      (/\b(?:saurav|poudel|you|your|he|his|their|her)\b/.test(query) ||
       /^\s*(?:e ?mail|phone(?: number)?|home address|birthday|ssn)\s*$/.test(query)));
}

function initSapoSearch() {
  const about = { label: 'About', href: './#introduction' };
  const skills = { label: 'Skills', href: 'resume.html#resume-skills' };
  const history = { label: 'Work history', href: 'resume.html#resume-history' };
  const projects = { label: 'Projects', href: 'projects.html#works' };
  const creative = { label: 'Creative projects', href: 'creative.html#creative' };
  const education = { label: 'Education', href: 'resume.html#resume-education' };
  const honors = { label: 'Honors', href: 'resume.html#resume-honors' };
  const certifications = { label: 'Certifications', href: 'resume.html#resume-certifications' };
  const collaborators = { label: 'Collaborators', href: 'resume.html#resume-companies' };
  const tools = new Map();
  const records = [];
  let recent;

  function addRecord(record, aliases, facts = []) {
    const phrases = [...new Set([record.title, ...aliases].map(sapoNormalize).filter(Boolean))];
    records.push({ ...record, phrases, facts, titleTerms: sapoTerms(phrases.join(' ')),
      factTerms: sapoTerms(sapoNormalize(facts.join(' ') + ' ' + record.answer)) });
  }

  function noteTool(label, source, type) {
    const key = sapoNormalize(label);
    if (!key) return;
    if (!tools.has(key)) tools.set(key, { label, projects: [], roles: [], galleries: [] });
    if (source) tools.get(key)[type].push(source);
  }

  for (const entry of sapoProfile) addRecord({ ...entry, kind: 'profile' }, entry.aliases);
  addRecord({ title: 'Skills', kind: 'section',
    answer: 'My technical skills span ' + landingData.skills.map(group => group.category.toLowerCase()).join(', ') + '.', links: [skills] },
    ['tech stack', 'technical skills', 'programming languages', 'what tools do you know', 'what tools do you use', 'tools and skills']);
  addRecord({ title: 'Projects', kind: 'section',
    answer: 'My projects cover ' + landingData.fields.join(', ') + '. You can browse by field or follow the relationship map to see which tools I used.', links: [projects] },
    ['portfolio projects', 'my projects', 'what have you built', 'show me your work', 'project portfolio', 'what projects have you built']);
  addRecord({ title: 'Using the portfolio', kind: 'section',
    answer: 'I organized this site into About, Resume, Projects, and Creative Projects. You can filter work by field and select a project to see its tools, contributions, and results.', links: [about, projects, creative] },
    ['website', 'portfolio website', 'how do i use this site', 'project relationship map', 'who made this website', 'who built this site']);
  addRecord({ title: 'sapo', kind: 'section', answer: 'This is my portfolio assistant. It answers in my voice using my résumé, case studies, and creative work.',
    links: [about, projects] }, ['what is sapo', 'how does sapo work', 'what is sapo ai', 'how does sapo ai work', 'are you a chatbot']);
  addRecord({ title: 'Résumé PDF', kind: 'section', answer: 'You can preview or download my résumé PDF from the Résumé page.',
    links: [{ label: 'Résumé PDF', href: 'resume.html#resume-document-title' }] }, ['resume', 'pdf resume', 'download resume', 'download my resume', 'download your cv']);
  addRecord({ title: 'GitHub', kind: 'section', answer: 'My GitHub is linked in Contact. Projects also links to the public repositories for individual case studies when available.',
    links: [{ label: 'GitHub in Contact', href: './?contact=1#introduction' }, projects] }, ['your github', 'github profile', 'your repositories', 'show your code']);
  addRecord({ title: 'Adobe creative tools', kind: 'section', answer: 'My creative galleries list Lightroom and Photoshop for photography, Premiere Pro and After Effects for video, and Illustrator, Photoshop, and InDesign for design.',
    links: [{ label: 'Photography tools', href: 'photography.html#creative-tools' }, { label: 'Video tools', href: 'videography.html#creative-tools' }, { label: 'Design tools', href: 'design.html#creative-tools' }] }, ['adobe tools', 'adobe suite', 'creative cloud tools']);
  addRecord({ title: 'Academic honors', kind: 'section',
    answer: 'My honors include ' + new Intl.ListFormat('en').format(landingData.honors) + '.', links: [honors] },
    ['awards', 'honors', 'scholarships', 'deans list'], landingData.honors);
  addRecord({ title: 'Certifications', kind: 'section',
    answer: 'My certifications include ' + new Intl.ListFormat('en').format(landingData.certifications) + '.', links: [certifications] },
    ['professional credentials', 'what certifications do you have', 'salesforce certification', 'agentforce certification', 'certification'], landingData.certifications);
  addRecord({ title: 'GPA', kind: 'section',
    answer: 'My portfolio lists a GPA of ' + landingData.education.gpa + '.', links: [education] }, ['grade point average', 'your current gpa', 'your gpa', 'saurav gpa']);
  addRecord({ title: 'Collaborating companies', kind: 'section',
    answer: 'I list the organizations I worked with or collaborated with on my résumé.', links: [collaborators] },
    ['collaborators', 'company logos', 'organizations you worked with', 'companies you collaborated with'], landingData.collaborators.map(([name]) => name));
  for (const [company] of landingData.collaborators) {
    if (company === 'Delta Air Lines' || company === 'Salesforce' || company === 'Palantir') continue;
    addRecord({ title: company, kind: 'collaborator',
      answer: 'I list ' + company + ' among the organizations I worked with or collaborated with.', links: [collaborators] },
      company === 'Fiverr' ? ['Fiver'] : []);
  }
  for (const honor of landingData.honors) {
    const label = honor.split(',')[0];
    addRecord({ title: label, kind: 'section', answer: 'My résumé lists ' + honor + '.', links: [honors] }, []);
  }
  for (const credential of landingData.certifications) {
    const label = credential.split(' · ')[0];
    const aliases = label.startsWith('Salesforce') ? ['trailblazer credential', 'salesforce trailblazer credential'] : label.startsWith('Six Sigma') ? ['six sigma', 'white belt'] : ['neo4j certification'];
    addRecord({ title: label, kind: 'section', answer: 'My résumé lists ' + credential + '.', links: [certifications] }, aliases);
  }
  for (const item of landingData.projects) {
    addRecord({ title: item.title, kind: 'project', item, answer: sapoFirstPerson(item.description), links: [sapoProjectLink(item)] },
      item.aliases || [], [...item.contributions || [], ...(item.tools || []), item.category]);
    for (const tool of item.tools || []) noteTool(tool, item, 'projects');
  }
  for (const item of landingData.experience) {
    const current = /Present$/.test(item.dates);
    const lead = (current ? 'I serve as ' : 'I worked as ') + item.title + ' at ' + item.organization +
      (item.dates ? ' (' + item.dates + ')' : '') + '.';
    const organization = item.organization.replace(/^University of Cincinnati /, '');
    const uniqueOrganization = organization !== item.organization && !landingData.experience.some(other => other !== item && other.organization === item.organization);
    addRecord({ title: item.title, kind: 'role', item, answer: lead + ' ' + sapoFirstPerson(item.description), links: [sapoRoleLink(item)] },
      [...(uniqueOrganization ? [organization] : []), ...(item.title === 'Sustainability Program Support' ? ['sustainability office'] : [])],
      [...item.highlights || [], item.organization, item.dates]);
    for (const tool of item.tools || []) noteTool(tool, item, 'roles');
  }
  for (const group of landingData.skills) {
    addRecord({ title: group.category, kind: 'skill-group',
      answer: 'My ' + group.category.toLowerCase() + ' skills include ' + group.items.join(', ') + '.', links: [skills] }, [], group.items);
    for (const tool of group.items) noteTool(tool);
  }
  for (const field of landingData.fields) {
    const matching = landingData.projects.filter(project => project.fields.includes(field));
    addRecord({ title: field, kind: 'field',
      answer: 'My ' + (field === 'AI' ? field : field.toLowerCase()) + ' projects include ' + matching.slice(0, 3).map(project => project.title).join(', ') + '.',
      links: [{ label: field + ' projects', href: 'projects.html?field=' + encodeURIComponent(field) + '#works' }] },
      [field + ' projects'], []);
  }
  const mediaTitles = { photography: 'Photography', videography: 'Videography', modeling: '3D Modeling & Animation', design: 'Graphic Design' };
  const mediaAliases = { photography: ['photo work', 'photos'], videography: ['video editing', 'cinematography'], modeling: ['3d modeling', '3d animation', '3d work'], design: ['poster design', 'posters', 'design work'] };
  addRecord({ title: 'Creative projects', kind: 'gallery', answer: 'My creative portfolio covers photography, videography, 3D modeling and animation, and graphic design. It includes published work and labeled sample studies.', links: [creative] }, ['creative work', 'creative portfolio', 'behance']);
  for (const [medium, title] of Object.entries(mediaTitles)) {
    const link = { label: title, href: medium + '.html#creative' };
    const works = behanceWorks[medium];
    const answer = works.length
      ? 'My ' + title.toLowerCase() + ' page includes ' + works.map(work => work.title).join(' and ') + '. The page also labels sample studies separately.'
      : 'My 3D Modeling & Animation page shows sample studies of wireframes, surfaces, and turntable motion. My professional training animation is in the aviation project collection.';
    const galleryLinks = medium === 'modeling'
      ? [link, sapoProjectLink(landingData.projects.find(item => item.title === 'Aircraft Door & Catering Truck Safety Animation'))]
      : [link];
    addRecord({ title, kind: 'gallery', answer, links: galleryLinks }, mediaAliases[medium], creativeToolsets[medium]);
    for (const tool of creativeToolsets[medium]) noteTool(tool, { label: title, href: medium + '.html#creative-tools' }, 'galleries');
    for (const work of works) {
      const workLink = { label: work.title, href: medium + '.html?work=' + sapoSlug(work.title) + '#creative' };
      addRecord({ title: work.title, kind: 'creative-work', answer: 'I published ' + work.title + ' on Behance. You can open it in my ' + title.toLowerCase() + ' gallery.', links: [workLink] }, [], [work.description]);
    }
  }

  // Fit term weights to the portfolio. Rare evidence such as a named process is more useful than a shared buzzword.
  const frequency = new Map();
  for (const record of records) {
    for (const term of new Set([...record.titleTerms, ...record.factTerms])) {
      frequency.set(term, (frequency.get(term) || 0) + 1);
    }
  }
  const weight = term => Math.log(1 + records.length / (1 + (frequency.get(term) || 0)));
  const overlap = (queryTerms, terms) => [...queryTerms].filter(term => terms.has(term)).reduce((total, term) => total + weight(term), 0);
  const evidence = (text, terms) => overlap(terms, sapoTerms(sapoNormalize(text)));
  const toolAliases = new Map([
    ['aws', 'amazon web services'], ['amazon web services', 'amazon web services'], ['s3', 'amazon s3'],
    ['aws s3', 'amazon s3'], ['spark', 'apache spark'], ['kafka', 'apache kafka'], ['airflow', 'apache airflow'],
    ['foundry', 'palantir foundry'], ['palantir', 'palantir foundry'], ['rag', 'retrieval augmented generation'],
    ['salesforce', 'salesforce crm'], ['aip', 'aip logic'], ['maya', 'autodesk maya'],
  ]);
  tools.set('amazon web services', { label: 'AWS', projects: landingData.projects.filter(item => item.tools.some(tool => /\b(?:AWS|Amazon)\b/.test(tool))), roles: [], galleries: [] });
  for (const [alias, key] of toolAliases) if (tools.has(key)) tools.set(alias, tools.get(key));
  const toolNames = [...tools.keys()].sort((first, second) => second.length - first.length);

  function answerRecord(record, query, terms) {
    let answer = record.answer;
    if (record.kind === 'project' || record.kind === 'role') {
      const { item } = record;
      if (record.kind === 'project' && /\b(?:impact|outcomes?|results?|metrics?|numbers|evaluation|how many|how much)\b/.test(query)) {
        if (item.metrics?.length) return { reply: answer + ' My case study reports ' + new Intl.ListFormat('en').format(item.metrics.map(({ value, label }) => value + ' ' + label)) + '.', links: record.links };
        if (item.benchmark) return { reply: answer + ' My case study describes this evaluation plan. ' + item.benchmark, links: record.links };
      }
      if (item.tools?.length && /\b(?:tools?|stack|technologies|frameworks?|tech)\b/.test(query)) {
        return { reply: answer + ' The tools I list for this case study are ' + item.tools.join(', ') + '.', links: record.links };
      }
      const details = item.contributions || item.highlights || [];
      const ranked = details.map(fact => ({ fact, score: evidence(fact, terms) })).sort((a, b) => b.score - a.score);
      const detail = ranked[0]?.score > 0 ? ranked[0].fact : details[0];
      if (detail && !sapoNormalize(answer).includes(sapoNormalize(detail))) answer += ' ' + sapoFirstPerson(detail);
    }
    return { reply: answer, links: record.links };
  }

  function answerTool(name, tool, query, terms, project) {
    const employer = /\b(?:at|for|with|during) (?:the )?(delta(?: air lines)?|university of cincinnati(?: college of nursing| it solution center)?|college of nursing|it solution center)\b/.exec(query)?.[1];
    const companyIs = employer === 'delta' ? 'delta air lines' : employer;
    const mentioned = project && /\b(?:in|for|on|with|from)\b/.test(query) ? project : null;
    const candidates = tool.projects.filter(item => !companyIs || sapoIncludes(sapoNormalize(item.category + ' ' + item.description + ' ' + (item.contributions || []).join(' ')), companyIs));
    if (mentioned && !tool.projects.includes(mentioned)) {
      return { reply: 'My ' + mentioned.title + ' case study doesn’t list ' + tool.label + '.', links: [sapoProjectLink(mentioned)] };
    }
    const work = mentioned && candidates.includes(mentioned) ? mentioned : candidates.map(item => ({ item,
      score: evidence([item.title, item.category, item.description, ...item.tools].join(' '), terms) }))
      .sort((first, second) => second.score - first.score)[0]?.item;
    const explicitRole = landingData.experience.find(item => (!companyIs || sapoIncludes(sapoNormalize(item.organization), companyIs)) &&
      (companyIs || tool.roles.includes(item)) && item.highlights?.some(line => sapoIncludes(sapoNormalize(line), name)));
    if (explicitRole && !work) {
      const detail = explicitRole.highlights.find(line => sapoIncludes(sapoNormalize(line), name));
      return { reply: sapoFirstPerson(detail), links: [sapoRoleLink(explicitRole)] };
    }
    if (work) {
      const others = candidates.filter(item => item !== work).slice(0, 2).map(sapoProjectLink);
      const detail = (work.contributions || []).find(line => sapoIncludes(sapoNormalize(line), name));
      if (/\b(?:in production|at work|on the job)\b/.test(query) && /portfolio implementation|coursework/.test(work.category.toLowerCase())) {
        return { reply: 'I document ' + tool.label + ' in my ' + work.title + ' project. I haven’t documented production use of it.', links: [sapoProjectLink(work), skills] };
      }
      return { reply: 'Yes. I used ' + tool.label + ' in ' + work.title + '. ' + sapoFirstPerson(detail || work.description),
        links: [sapoProjectLink(work), ...others] };
    }
    if (companyIs) {
      const alternate = tool.projects[0];
      return { reply: 'My portfolio doesn’t document using ' + tool.label + ' in that role.' +
        (alternate ? ' I list it in my ' + alternate.title + ' case study.' : ''), links: alternate ? [history, sapoProjectLink(alternate)] : [history, skills] };
    }
    if (tool.galleries.length) return { reply: 'I list ' + tool.label + ' in the toolset for ' + tool.galleries.map(gallery => gallery.label).join(' and ') + '.', links: tool.galleries };
    return { reply: 'I list ' + tool.label + ' in my résumé skills. My portfolio doesn’t describe a specific project using it.', links: [skills] };
  }

  return text => {
    const query = sapoNormalize(text);
    if (sapoPrivacy(text, query)) {
      recent = undefined;
      return { reply: 'I keep personal details private. My About page covers my education and professional work.', links: [about], private: true };
    }
    const terms = sapoTerms(query);
    const owner = /\b(?:saurav|poudel|you|your|he|his)\b/.test(query);
    const workQuestion = /\b(?:experience|skills?|used?|working|worked|work|built|build|building|done|study|projects?|capstone|roles?|co op|collaborat\w*|certified|certifications?|credentials?|degree|graduate|graduation|job|hire|hiring|relocat\w*|start|available|availability|tools?|toolset|stack|portfolio|resume|github|gpa)\b/.test(query);
    const solicit = /^(?:tell me about|(?:can you )?show me|where can i (?:find|see|view)|can i download|walk me through|examples? of)\b/.test(query);
    const generalDefinition = /^(?:what (?:is|are|does)|define|explain|how (?:does|do i|to)|why (?:is|does))\b/.test(query);
    const hasPortfolioFrame = (owner && (workQuestion || /\bwhat (?:did|do) (?:you|he|saurav(?: poudel)?) do\b/.test(query))) ||
      /\b(?:in (?:the|this) portfolio|on (?:the|this) site|your resume)\b/.test(query);
    if (/^(?:please )?(?:(?:can|could|would|will) you )?(?:write|create|make|build|code|generate|draft|calculate|translate|solve|tell me a joke|ignore)\b/.test(query)) {
      recent = undefined;
      return { reply: sapoUnrelated, links: [] };
    }
    const ranked = records.map(record => {
      const matched = record.phrases.filter(phrase => sapoIncludes(query, phrase));
      const exact = matched.reduce((best, phrase) => Math.max(best, phrase.split(' ').length), 0);
      const whole = matched.includes(query);
      const subject = record.kind === 'project' || record.kind === 'role' || record.kind === 'creative-work';
      const titleScore = overlap(terms, record.titleTerms);
      const factScore = overlap(terms, record.factTerms);
      const score = exact * 6 + titleScore + factScore * .55 + (whole ? 12 : 0) + (record.kind === 'profile' && exact ? 4 : 0);
      return { record, exact, whole, subject, titleScore, factScore, score };
    }).sort((first, second) => second.score - first.score);
    const namedProject = ranked.find(candidate => candidate.record.kind === 'project' && candidate.exact >= 1)?.record.item;
    const toolName = toolNames.find(name => sapoIncludes(query, name));
    const strongest = ranked[0];
    const matchingProfile = ranked.find(candidate => candidate.record.kind === 'profile' &&
      (candidate.whole || candidate.exact >= 2) && (owner || hasPortfolioFrame || candidate.whole || solicit || candidate.exact >= 3));

    if (toolName && (query === toolName || hasPortfolioFrame || (solicit && workQuestion)) &&
        !/\b(?:certified|certifications?|credential|badge|github profile|your github)\b/.test(query) &&
        (!matchingProfile || namedProject || /\b(?:experience|used?|tools?|worked with|tech stack)\b/.test(query))) {
      const answer = answerTool(toolName, tools.get(toolName), query, terms, namedProject);
      if (/^(?:Yes\.|I (?:list|use|used|built))/.test(answer.reply)) {
        recent = records.find(record => (record.kind === 'project' || record.kind === 'role') && record.links[0].href === answer.links[0].href);
      } else {
        recent = undefined;
      }
      return answer;
    }
    const followup = /^(?:and )?(?:what (?:were the |was the )?(?:tools|stack|technologies|results|metrics|impact|else)|how (?:many|much)|how did you (?:do|build) that|can you elaborate|tell me more|more details)\b/.test(query);
    const candidate = ranked.find(item => item.whole ||
      (item.exact > 0 && (hasPortfolioFrame || solicit ||
        item.subject || (owner && item.exact >= 2) || (item.record.kind === 'profile' && item.exact >= 3))) ||
      (hasPortfolioFrame && !(recent && followup && terms.size <= 3) && item.factScore >= 4.5 && item.titleScore + item.factScore >= 7.5));
    if (generalDefinition && toolName && !hasPortfolioFrame && candidate?.exact === 1 && !candidate.whole) {
      recent = undefined;
      return { reply: sapoUnrelated, links: [] };
    }
    if (candidate && (!generalDefinition || hasPortfolioFrame || candidate.whole || candidate.subject || matchingProfile || (owner && candidate.exact >= 2))) {
      recent = candidate.record;
      return answerRecord(recent, query, terms);
    }
    if (recent && followup && terms.size <= 3) {
      return answerRecord(recent, query, terms);
    }
    recent = undefined;
    if (hasPortfolioFrame && !/\b(?:ignore|instructions|pretend|act as)\b/.test(query)) {
      const related = strongest?.exact ? strongest.record.links : /\b(?:skills?|tools?|used?|stack|experience with)\b/.test(query) ? [skills] : [history, projects];
      return { reply: 'I don’t have enough information in my portfolio to confirm that. Here’s where you can see what I’ve documented.', links: related };
    }
    return { reply: sapoUnrelated, links: [] };
  };
}
