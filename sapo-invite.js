'use strict';

(() => {
  const trigger = document.getElementById('ask-toggle');
  if (!trigger) return;

  const callout = document.createElement('span');
  callout.className = 'sapo-invite';
  callout.textContent = 'Ask .sapo';
  callout.setAttribute('aria-hidden', 'true');
  callout.hidden = true;
  trigger.append(callout);

  const panels = ['ask-panel', 'contact-panel'].map(id => document.getElementById(id)).filter(Boolean);
  const dialogs = Array.from(document.querySelectorAll('dialog'));
  const scheduleKey = 'sapo-invite-next';
  const delayBetween = (min, max) => min + Math.random() * (max - min);
  let nextAt = storedTime() ?? Date.now() + delayBetween(6000, 10000);
  let showTimer;
  let hideTimer;
  let leaving = false;

  function storedTime() {
    try {
      const previous = Number(sessionStorage.getItem(scheduleKey));
      if (previous > 0 && previous - Date.now() <= 58000) return previous;
    } catch {
      // The schedule stays in memory when browser storage is unavailable.
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(scheduleKey, String(nextAt));
    } catch {
      // Timing within this page does not require storage.
    }
  }

  function isObstructed() {
    return leaving || document.hidden || panels.some(panel => !panel.hidden) || dialogs.some(dialog => dialog.open);
  }

  function update() {
    if (isObstructed()) {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      showTimer = hideTimer = undefined;
      callout.hidden = true;
      return;
    }
    if (showTimer !== undefined || !callout.hidden) return;
    const remaining = nextAt - Date.now();
    showTimer = setTimeout(show, remaining > 0 ? remaining : delayBetween(1600, 3800));
  }

  function show() {
    showTimer = undefined;
    if (isObstructed()) return;
    callout.hidden = false;
    nextAt = Date.now() + delayBetween(36000, 57000);
    persist();
    hideTimer = setTimeout(() => {
      callout.hidden = true;
      hideTimer = undefined;
      update();
    }, 3600);
  }

  const observer = new MutationObserver(update);
  panels.forEach(panel => observer.observe(panel, { attributeFilter: ['hidden'] }));
  dialogs.forEach(dialog => observer.observe(dialog, { attributeFilter: ['open'] }));
  document.addEventListener('visibilitychange', update);
  addEventListener('pagehide', () => {
    leaving = true;
    update();
  });
  addEventListener('pageshow', () => {
    leaving = false;
    nextAt = Math.max(nextAt, storedTime() ?? 0);
    update();
  });
  persist();
  update();
})();
