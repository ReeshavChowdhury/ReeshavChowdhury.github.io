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

// Animated chapter rail for the long-form FHE foundations guide.
const chapterNav = document.querySelector('.fhe-chapter-nav');
const guideBody = document.querySelector('.fhe-guide-body');
if (chapterNav && guideBody) {
  const chapterLinks = [...chapterNav.querySelectorAll('a[href^="#"]')]
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);
  const chapterCount = chapterLinks.filter(({ section }) => section.id !== 'reading').length;
  const readout = chapterNav.parentElement.querySelector('[data-toc-chapter]');
  const percentLabel = chapterNav.parentElement.querySelector('[data-toc-percent]');
  const progress = chapterNav.parentElement.querySelector('.fhe-toc-progress');
  const marker = document.createElement('span');
  marker.className = 'fhe-toc-marker';
  marker.setAttribute('aria-hidden', 'true');
  chapterNav.append(marker);

  const updateChapterRail = () => {
    const guideTop = guideBody.getBoundingClientRect().top + window.scrollY;
    const guideEnd = guideTop + guideBody.offsetHeight - window.innerHeight;
    const ratio = guideEnd <= guideTop ? 0 : Math.max(0, Math.min(1, (window.scrollY - guideTop) / (guideEnd - guideTop)));
    const percent = Math.round(ratio * 100);
    progress.style.setProperty('--reading-progress', `${percent}%`);
    progress.setAttribute('aria-valuenow', String(percent));
    percentLabel.textContent = `${percent}%`;

    const focusLine = window.innerHeight * 0.3;
    let current = chapterLinks[0];
    for (const item of chapterLinks) {
      if (item.section.getBoundingClientRect().top <= focusLine) current = item;
      else break;
    }
    chapterLinks.forEach(({ link }) => {
      const active = link === current.link;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const chapterIndex = chapterLinks.filter(({ section }) => section.id !== 'reading').indexOf(current);
    readout.textContent = current.section.id === 'reading'
      ? 'Further reading'
      : `Chapter ${chapterIndex + 1} of ${chapterCount}`;
    marker.style.transform = `translateY(${current.link.offsetTop + current.link.offsetHeight / 2 - 10}px)`;
  };

  let railFrame = 0;
  const scheduleRailUpdate = () => {
    if (railFrame) return;
    railFrame = window.requestAnimationFrame(() => {
      railFrame = 0;
      updateChapterRail();
    });
  };
  window.addEventListener('scroll', scheduleRailUpdate, { passive: true });
  window.addEventListener('resize', scheduleRailUpdate);
  window.addEventListener('hashchange', scheduleRailUpdate);
  chapterNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) window.setTimeout(scheduleRailUpdate, 450);
  });
  updateChapterRail();
}
