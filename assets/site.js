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
// Plaintext arithmetic illustration for the FHE article; no encryption or network calls.
const fheX = document.querySelector('#fhe-x');
const fheY = document.querySelector('#fhe-y');
if (fheX && fheY) {
  const updateScore = () => {
    const x = Number(fheX.value);
    const y = Number(fheY.value);
    document.querySelector('#fhe-x-value').value = String(x);
    document.querySelector('#fhe-y-value').value = String(y);
    document.querySelector('#fhe-result').value = String(2 * x + 3 * y);
  };
  fheX.addEventListener('input', updateScore);
  fheY.addEventListener('input', updateScore);
  updateScore();
}
const articleContents = document.querySelector('.article-toc');
if (articleContents && window.matchMedia('(max-width: 760px)').matches) {
  articleContents.open = false;
}

// A short, interactive FHE flow. Each block reveals one step.
const fheStepDescriptions = {
  input: 'Start with a plain input x.',
  encrypt: 'Encrypt x to get Enc(x).',
  compute: 'Evaluate f on the ciphertext without decrypting it.',
  result: 'Decrypt Enc(f(x)) to obtain f(x).',
};
for (const button of document.querySelectorAll('[data-fhe-step]')) {
  button.addEventListener('click', () => {
    for (const step of document.querySelectorAll('[data-fhe-step]')) {
      const selected = step === button;
      step.setAttribute('aria-pressed', String(selected));
      step.classList.toggle('is-selected', selected);
    }
    document.querySelector('#fhe-step-description').textContent = fheStepDescriptions[button.dataset.fheStep];
  });
}
