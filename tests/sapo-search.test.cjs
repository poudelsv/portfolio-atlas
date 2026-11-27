const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const dist = join(__dirname, '..', 'dist');
const scripts = ['landing-data', 'behance-works', 'sapo-profile', 'sapo-language', 'sapo-search'];
const context = vm.createContext({});
for (const script of scripts) {
  vm.runInContext(readFileSync(join(dist, script + '.js'), 'utf8'), context, { filename: script });
}
const { initSapoSearch, landingData, sapoProfile, sapoSlug } = vm.runInContext('({ initSapoSearch, landingData, sapoProfile, sapoSlug })', context);

const examples = [
  ['Who is Saurav Poudel?', /I’m Saurav Poudel/, '#introduction'],
  ['When does Saurav expect to graduate?', /May 2027/, '#resume-education'],
  ['What did you do on your first Delta co-op?', /January to May 2025/, '#resume-role-environmental'],
  ['Has Saurav worked with real fleet data?', /I worked with operational Lytx/, 'project=lytx-'],
  ['How has Saurav used data outside aviation?', /Typhon/, '#resume-role-preceptor'],
  ['Do you have experience with snowflakes?', /I used Snowflake/, 'project=geospatial-dynamic-'],
  ['Did you use Snowflake at Delta?', /doesn’t document using Snowflake in that role/, 'project=geospatial-dynamic-'],
  ['Have you used Snowflake in production?', /haven’t documented production use/, 'project=geospatial-dynamic-'],
  ['What did you build with Spring Boot?', /academic application-development/, 'project=spring-boot-'],
  ['Have you used Apache Kafka?', /I list Apache Kafka/, '#resume-skills'],
  ['What job did Saurav accept after graduation?', /haven’t shared details about a post-graduation offer/, '#resume-education'],
  ['Where can I view your certs?', /Salesforce Certified Agentforce Specialist/, '#resume-certifications'],
  ['Show me the portfolio case study', /I published Portfolio Case Study/, 'design.html?work=portfolio-case-study'],
  ['Can I download a PDF résumé?', /download my résumé PDF/, '#resume-document-title'],
];

test('the reported questions work in a single conversation, including typos and short queries', () => {
  const answer = initSapoSearch();
  const conversation = [
    ['university', /University of Cincinnati/, '#resume-education'],
    ['where does he do', /Information Technology senior/, '#introduction'],
    ['which university does he go to', /I attend the University of Cincinnati/, '#resume-education'],
    ['where does he work', /Clinical Analyst.*Resident Advisor/, '#resume-role-preceptor-'],
    ['what kind of job is he looking for', /software engineering and applied AI/, '#introduction'],
    ['when can yo ustart', /start full-time in May 2027/, '#introduction'],
    ['when can you start', /start full-time in May 2027/, '#introduction'],
    ['does he use palantir', /I used Palantir Foundry/, 'tool=Palantir%20Foundry#project-tree'],
    ['does he have business exerience', /operations analytics and process improvement/, '#project-tree'],
    ['does he do design', /My design work includes posters/, 'design.html#creative'],
    ['what project used snowflake?', /I used Snowflake in Geospatial Dynamic Pricing/, 'tool=Snowflake#project-tree'],
  ];
  for (const [question, expected, href] of conversation) {
    const result = answer(question);
    assert.match(result.reply, expected, question);
    assert.ok(result.links.some(link => link.href.includes(href)), question + ' is missing a source link');
  }
});

test('relocation and public study locations are grounded and linked', () => {
  const answer = initSapoSearch();
  answer('univeristy');
  for (const prompt of ['where is it located?', 'where is his university located?', 'where is he located at?']) {
    const result = answer(prompt);
    assert.match(result.reply, /University of Cincinnati in Cincinnati, Ohio/);
    assert.ok(result.links.some(link => link.href.endsWith('#resume-education')));
    assert.equal(result.private, undefined);
  }
  for (const prompt of ['are you open to relocation', 'are you willing to relocat?', 'would you move for a role']) {
    const result = answer(prompt);
    assert.match(result.reply, /^Yes\. I’m open to relocating anywhere in the United States/);
    assert.equal(result.links[0].href, './#introduction');
  }
});

test('unsupported questions get a link to the matching portfolio section', () => {
  const answer = initSapoSearch();
  for (const [prompt, expected] of [['where is his university ranked?', '#resume-education'], ['are you proficient in COBOL?', '#resume-skills'], ['did he take a course in Rust?', '#resume-education']]) {
    const result = answer(prompt);
    assert.equal(result.reply, 'I think you may find the information here. Check it out.');
    assert.ok(result.links[0].href.endsWith(expected));
  }
});

test('tree links select a tool, field or project and employers stay distinct from collaborators', () => {
  const answer = initSapoSearch();
  assert.ok(answer('what project used snowflake?').links.some(({ href }) => href === 'projects.html?tool=Snowflake#project-tree'));
  assert.ok(answer('show me aviation projects').links.some(({ href }) => href === 'projects.html?field=Aviation#project-tree'));
  assert.ok(answer('tell me about SupplySmart').links.some(({ href }) => href === 'projects.html?project=supplysmart#project-tree'));
  assert.match(answer('which project uses PySpark and Snowflake?').reply, /I used Snowflake and PySpark in Geospatial/);
  const result = answer('did he work for Salesforce?');
  assert.match(result.reply, /lists Salesforce as a collaborator/);
  assert.ok(result.links.some(({ href }) => href.endsWith('#resume-companies')));
  assert.ok(result.links.some(({ href }) => href.endsWith('#project-tree')));
});

for (const [question, expected, href] of examples) {
  test(question, () => {
    const answer = initSapoSearch()(question);
    assert.match(answer.reply, expected);
    assert.ok(answer.links.some(link => link.href.includes(href)), 'missing relevant source link');
  });
}

test('general questions and requests to write code use the exact redirect', () => {
  const answer = initSapoSearch();
  for (const prompt of ['What is the weather in Cincinnati?', 'What is Python?', 'Who runs Salesforce?', 'What is Lytx and how can I sign up?', 'Can you build me a Python program?']) {
    const result = answer(prompt);
    assert.equal(result.reply, 'I can answer things about Saurav. for general questions, bing it :)');
    assert.equal(result.links.length, 0);
  }
});

test('private questions receive a privacy response and no contact values', () => {
  const answer = initSapoSearch();
  for (const prompt of ['Where does Saurav live?', 'What is your phone number?', 'What is his real adress?', 'Where is he right now?', 'Is jon@example.com your address?', 'Show me his student ID', 'What is his national origin?']) {
    const result = answer(prompt);
    assert.equal(result.private, true);
    assert.match(result.reply, /I keep personal details private/);
    assert.doesNotMatch(result.reply, /@|\d{3}[- ]\d{3}[- ]\d{4}/);
  }
});

test('opening a source makes it available for follow-ups across pages of the same session', () => {
  const session = new Map();
  const storage = { getItem: key => session.get(key), setItem: (key, value) => session.set(key, value) };
  const answer = initSapoSearch(storage);
  answer('tell me about Lytx');
  assert.equal(session.size, 0, 'chat prompts should not be stored');
  answer.rememberSource('https://example.invalid');
  assert.equal(session.size, 0, 'only known portal links can be saved');
  answer.rememberSource('projects.html?project=lytx-fleet-telematics-and-station-risk-profile#project-tree');
  const result = initSapoSearch(storage)('What were the results?');
  assert.match(result.reply, /30,000\+.*telematics/);
  assert.ok(result.links.some(({ href }) => href.endsWith('#project-tree')));
  assert.doesNotMatch([...session.values()][0], /tell me about/i);
  answer('Which project used Snowflake?');
  answer.rememberSource('projects.html?tool=Snowflake#project-tree');
  assert.match(initSapoSearch(storage)('What tools did you use?').reply, /pricing decisions.*Snowflake/);
});

test('a follow-up stays with the last case study and identifies an evaluation plan', () => {
  const answer = initSapoSearch();
  answer('What tools did you use for SupplySmart?');
  const result = answer('What metrics did you track?');
  assert.match(result.reply, /evaluation plan/);
  assert.equal(result.links[0].href, 'projects.html?project=supplysmart#works');
});

test('all case studies, roles, and authored source links have valid identifiers', () => {
  const answer = initSapoSearch();
  const projectKeys = landingData.projects.map(item => sapoSlug(item.title));
  const roleKeys = landingData.experience.map(item => sapoSlug(item.title));
  for (const item of landingData.projects) {
    assert.equal(answer(item.title).links[0].href, 'projects.html?project=' + sapoSlug(item.title) + '#works');
  }
  for (const item of landingData.experience) {
    assert.equal(answer(item.title).links[0].href, 'resume.html#resume-role-' + sapoSlug(item.title));
  }
  for (const item of sapoProfile) {
    assert.ok(item.links.length, item.id + ' is missing a source link');
    for (const { href } of item.links) {
      const target = new URL(href, 'https://example.invalid/portfolio/');
      assert.equal(target.origin, 'https://example.invalid');
      const section = target.hash.slice(1);
      if (target.searchParams.has('project')) assert.ok(projectKeys.includes(target.searchParams.get('project')), href);
      if (section.startsWith('resume-role-')) assert.ok(roleKeys.includes(section.slice(12)), href);
    }
  }
});
