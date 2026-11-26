'use strict';

function initResumePdf(host, path) {
  const viewport = document.createElement('div');
  viewport.className = 'resume-document-viewport';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.hidden = true;
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Résumé preview';
  const controls = document.createElement('div');
  controls.className = 'resume-document-controls';
  controls.hidden = true;

  function control(label, step) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => render(pageNumber + step));
    return button;
  }
  const previous = control('Previous page', -1);
  const next = control('Next page', 1);
  controls.append(previous, status, next);
  viewport.append(canvas);
  host.append(controls, viewport);
  host.setAttribute('aria-busy', 'true');

  let documentPdf;
  let pageNumber = 1;
  let renderId = 0;
  let task;

  async function render(number) {
    if (!documentPdf || number < 1 || number > documentPdf.numPages) return;
    pageNumber = number;
    previous.disabled = pageNumber === 1;
    next.disabled = pageNumber === documentPdf.numPages;
    const id = ++renderId;
    task?.cancel();
    try {
      const page = await documentPdf.getPage(number);
      if (id !== renderId) return;
      const base = page.getViewport({scale: 1});
      const width = Math.min(viewport.clientWidth || base.width, 850);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const layout = page.getViewport({scale: width * ratio / base.width});
      const buffer = document.createElement('canvas');
      buffer.width = Math.ceil(layout.width);
      buffer.height = Math.ceil(layout.height);
      task = page.render({canvas: buffer, viewport: layout});
      await task.promise;
      if (id !== renderId) return;
      canvas.width = buffer.width;
      canvas.height = buffer.height;
      canvas.getContext('2d').drawImage(buffer, 0, 0);
      canvas.setAttribute('aria-label', 'Saurav Poudel résumé, page ' + number);
      canvas.hidden = false;
      status.textContent = 'Page ' + number + ' of ' + documentPdf.numPages;
      host.setAttribute('aria-busy', 'false');
    } catch (error) {
      if (error?.name !== 'RenderingCancelledException') unavailable();
    }
  }

  function unavailable() {
    status.textContent = 'The preview could not load. Use Download PDF to read the résumé.';
    controls.hidden = false;
    previous.hidden = next.hidden = true;
    host.setAttribute('aria-busy', 'false');
  }

  async function load() {
    try {
      const library = await import('./vendor/pdfjs/pdf.min.mjs');
      library.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', location.href).href;
      documentPdf = await library.getDocument({url: path, isEvalSupported: false, useSystemFonts: true}).promise;
      controls.hidden = false;
      await render(1);
    } catch {
      unavailable();
    }
  }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(item => item.isIntersecting)) return;
    observer.disconnect();
    load();
  }, {rootMargin: '450px'});
  observer.observe(viewport);
}
