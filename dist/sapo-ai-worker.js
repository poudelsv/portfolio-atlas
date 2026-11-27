const modelId = 'HuggingFaceTB/SmolLM2-135M-Instruct';
const modelRevision = '12fd25f77366fa6b3b4b768ec3050bf629380bac';
const systemPrompt = [
  'You are Sapo, a general assistant on a portfolio website.',
  'Answer in plain language in a few sentences. If you are unsure, say so.',
  'Do not provide or guess personal information about anyone.',
  'For questions about the portfolio owner, refer to the portfolio FAQ.',
].join(' ');

let generatorPromise;
let answering = false;

async function loadGenerator() {
  self.postMessage({ type: 'progress', text: 'Loading general AI in your browser. The first run downloads about 137 MB.' });
  const { env, pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  env.allowLocalModels = false;
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;

  let lastProgress = 0;
  return pipeline('text-generation', modelId, {
    device: 'wasm',
    dtype: 'q8',
    revision: modelRevision,
    progress_callback(status) {
      if (status.status !== 'progress' || !status.file?.endsWith('.onnx')) return;
      const progress = Math.round(status.progress);
      if (!Number.isFinite(progress) || progress - lastProgress < 5) return;
      lastProgress = progress;
      self.postMessage({ type: 'progress', text: `Downloading the AI model (137 MB)… ${progress}%` });
    },
  });
}

function getGenerator() {
  generatorPromise ??= loadGenerator().catch(error => {
    generatorPromise = undefined;
    throw error;
  });
  return generatorPromise;
}

function asChatContent(value) {
  return value.replace(/<\|[^|]*\|>/g, '').trim().slice(0, 800);
}

self.addEventListener('message', async ({ data }) => {
  if (answering || typeof data?.question !== 'string') return;
  const question = asChatContent(data.question);
  if (!question) {
    self.postMessage({ type: 'error' });
    return;
  }

  answering = true;
  try {
    const generate = await getGenerator();
    self.postMessage({ type: 'progress', text: 'Writing an answer…' });
    const history = Array.isArray(data.history) ? data.history.slice(-4) : [];
    const messages = [{ role: 'system', content: systemPrompt }];
    for (const item of history) {
      if ((item?.role === 'user' || item?.role === 'assistant') && typeof item.content === 'string') {
        messages.push({ role: item.role, content: asChatContent(item.content) });
      }
    }
    messages.push({ role: 'user', content: question });

    const [result] = await generate(messages, {
      max_new_tokens: 100,
      do_sample: false,
      repetition_penalty: 1.1,
      return_full_text: false,
    });
    const output = result?.generated_text;
    const answer = Array.isArray(output) ? output.at(-1)?.content : output;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty model response');
    self.postMessage({ type: 'answer', text: answer.trim() });
  } catch {
    self.postMessage({ type: 'error' });
  } finally {
    answering = false;
  }
});
