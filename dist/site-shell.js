'use strict';

document.body.insertAdjacentHTML('beforeend', `
  <div class="dock">
    <section class="ask-panel" id="ask-panel" aria-labelledby="ask-title" hidden>
      <h2 class="sr-only" id="ask-title">sapo</h2>
      <div id="conversation" role="log" aria-live="polite" aria-label="Conversation"></div>
      <div class="suggestions" id="suggestions"></div>
      <form id="ask-form">
        <button class="icon-button close-ask" id="close-ask" type="button" aria-label="Close sapo">×</button>
        <label class="sr-only" for="question">Ask about Saurav</label>
        <input id="question" type="text" maxlength="400" placeholder="Ask about my work, skills, or projects…" autocomplete="off" required>
        <button class="icon-button send" type="submit" aria-label="Send question">↑</button>
      </form>
    </section>
    <div class="dock-row">
      <canvas class="sapo-nav-earth" aria-hidden="true"></canvas>
      <button class="ask-toggle" id="ask-toggle" aria-controls="ask-panel" aria-expanded="false" aria-label="Ask sapo" title="Ask sapo" type="button">
        <span class="sapo-wordmark" aria-hidden="true">sapo</span>
      </button>
      <div class="dock-shell">
        <section class="contact-panel" id="contact-panel" aria-label="Contact Saurav" hidden>
          <dl id="contact-methods"></dl>
          <p id="contact-feedback" class="sr-only" role="status"></p>
        </section>
        <nav class="tabs" aria-label="Portfolio">
          <a href="./?v=sapo" data-page-link="about">About</a>
          <a href="resume.html?v=timeline" data-page-link="resume">Resume</a>
          <a href="projects.html?v=case-studies" data-page-link="projects">Projects</a>
          <a href="creative.html?v=solar-2" data-page-link="creative">Creative Projects</a>
          <button type="button" id="dock-contact" aria-controls="contact-panel" aria-expanded="false">Contact</button>
        </nav>
      </div>
    </div>
  </div>
  <dialog id="detail" aria-labelledby="detail-title">
    <div class="detail-inner">
      <form method="dialog"><button type="submit" class="icon-button" aria-label="Close details">×</button></form>
      <div id="detail-content"></div>
    </div>
  </dialog>
`);
const companyLogos = {
  delta: 'assets/delta-light.svg',
  uc: 'assets/uc-light.svg',
  'uc-cech': 'assets/uc-light.svg',
  'uc-itsc': 'assets/uc-light.svg',
};

const currentPage = document.body.dataset.page;
document.querySelector('[data-page-link="' + currentPage + '"]').setAttribute('aria-current', 'page');
window.mountEarthDock?.(document.querySelector('.sapo-nav-earth'));
