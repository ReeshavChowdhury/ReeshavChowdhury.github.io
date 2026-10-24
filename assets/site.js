'use strict';
const toggle = document.querySelector('[data-demo-toggle]');
if (toggle) {
  toggle.addEventListener('click', () => {
    const scene = document.querySelector('[data-demo-scene]');
    const enabled = scene.classList.toggle('is-private');
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Show physical display' : 'Preview screen blanking';
    document.querySelector('[data-demo-state]').textContent = enabled ? 'PRIVACY MODE ON' : 'PRIVACY MODE OFF';
    scene.setAttribute('aria-label', enabled
      ? 'Illustration: Windows viewer in color, Ubuntu physical display black.'
      : 'Illustration: both the Windows viewer and Ubuntu physical display in color.');
  });
}
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const code = document.querySelector(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    } catch {
      button.textContent = 'Select and copy below';
    }
  });
}
