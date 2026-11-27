'use strict';

// Compare short words with a bounded typo allowance, including adjacent swaps.
function sapoOneEdit(first, second) {
  if (first === second || Math.abs(first.length - second.length) > 1) return false;
  let start = 0;
  while (first[start] === second[start] && start < Math.min(first.length, second.length)) start++;
  const left = first.slice(start);
  const right = second.slice(start);
  if (left.length === right.length) {
    return left.slice(1) === right.slice(1) ||
      (left[0] === right[1] && left[1] === right[0] && left.slice(2) === right.slice(2));
  }
  return left.length > right.length ? left.slice(1) === right : left === right.slice(1);
}

function sapoFitSpelling(examples) {
  const weights = new Map();
  for (const example of examples) {
    for (const word of new Set(example.split(' '))) weights.set(word, (weights.get(word) || 0) + 1);
  }
  const byLength = new Map();
  for (const word of weights.keys()) {
    if (!byLength.has(word.length)) byLength.set(word.length, []);
    byLength.get(word.length).push(word);
  }
  const repairs = new Map();
  return query => query.split(' ').map(word => {
    if (word.length < 4 || word.length > 24 || !/^[a-z]+$/.test(word) || weights.has(word)) return word;
    if (!repairs.has(word)) {
      const matches = [word.length - 1, word.length, word.length + 1].flatMap(length => byLength.get(length) || [])
        .filter(candidate => sapoOneEdit(word, candidate))
        .sort((first, second) => weights.get(second) - weights.get(first));
      const [first, alternate] = matches;
      const confident = first && (!alternate || weights.get(first) > 2 * weights.get(alternate));
      if (repairs.size >= 128) repairs.clear();
      repairs.set(word, confident ? first : word);
    }
    return repairs.get(word);
  }).join(' ');
}

function sapoFitIntents(records, termsFor, weight) {
  const sharedWeight = (first, second) => [...first].reduce((total, word) => total + (second.has(word) ? weight(word) : 0), 0);
  const examples = new Map(records.map(record => [record, record.phrases.map(phrase => {
    const terms = termsFor(phrase);
    return { terms, weight: sharedWeight(terms, terms) };
  }).filter(example => example.terms.size > 1)]));
  return terms => {
    const queryWeight = sharedWeight(terms, terms);
    return record => {
      let best = 0;
      for (const example of examples.get(record)) {
        const shared = sharedWeight(terms, example.terms);
        const score = shared / (queryWeight * .6 + example.weight * .4);
        best = Math.max(best, score);
      }
      return best;
    };
  };
}
