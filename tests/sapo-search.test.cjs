const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const dist = join(__dirname, '..', 'dist');
const scripts = ['landing-data', 'behance-works', 'sapo-profile', 'sapo-search'];
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
    assert.equal(result.reply, 'I can answer things about Saurav. For general answer, Bing it :)');
    assert.equal(result.links.length, 0);
  }
});

test('private questions receive a privacy response and no contact values', () => {
  const answer = initSapoSearch();
  for (const prompt of ['Where does Saurav live?', 'What is your phone number?', 'Is jon@example.com your address?']) {
    const result = answer(prompt);
    assert.equal(result.private, true);
    assert.match(result.reply, /I keep personal details private/);
    assert.doesNotMatch(result.reply, /@|\d{3}[- ]\d{3}[- ]\d{4}/);
  }
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
