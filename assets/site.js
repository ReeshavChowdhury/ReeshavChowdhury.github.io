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

// Lightweight, dependency-free 3D scenes used as interactive research illustrations.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('[data-3d-scene]')];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function project(point, state, width, height) {
    const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
    const cx = Math.cos(state.pitch), sx = Math.sin(state.pitch);
    const x = point.x * cy + point.z * sy;
    const z1 = -point.x * sy + point.z * cy;
    const y = point.y * cx - z1 * sx;
    const z = point.y * sx + z1 * cx;
    const perspective = 3.8 / (3.8 - z * 0.42);
    return {
      x: width / 2 + x * width * 0.29 * state.zoom * perspective,
      y: height / 2 + y * height * 0.34 * state.zoom * perspective,
      scale: perspective,
    };
  }

  function fitCanvas(canvas) {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, width: bounds.width, height: bounds.height };
  }

  function drawNetwork(context, state, width, height) {
    const layers = [
      [-1.35, [-0.78, -0.39, 0, 0.39, 0.78]],
      [0, [-0.88, -0.53, -0.18, 0.18, 0.53, 0.88]],
      [1.35, [-0.68, -0.23, 0.23, 0.68]],
    ].map(([x, ys], layer) => ys.map((y, index) => ({
      x, y, z: Math.sin(index * 1.7 + layer) * 0.19,
      color: layer === 1 ? '#84ad88' : '#527a68',
      radius: layer === 1 ? 4.2 : 4.8,
    })));

    context.lineWidth = 0.75;
    for (let layer = 0; layer < layers.length - 1; layer += 1) {
      for (const from of layers[layer]) {
        for (const to of layers[layer + 1]) {
          const a = project(from, state, width, height);
          const b = project(to, state, width, height);
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.strokeStyle = layer === 0 ? 'rgba(77,114,95,.27)' : 'rgba(153,137,85,.32)';
          context.stroke();
        }
      }
    }

    for (const layer of layers) {
      for (const node of layer) {
        const point = project(node, state, width, height);
        context.beginPath();
        context.arc(point.x, point.y, node.radius * point.scale, 0, Math.PI * 2);
        context.fillStyle = node.color;
        context.fill();
        context.strokeStyle = 'rgba(247,247,235,.9)';
        context.lineWidth = 1;
        context.stroke();
      }
    }

    // A wireframe sphere marks the encrypted computation stage.
    const center = { x: 0, y: 0, z: 0 };
    const radius = 0.72;
    const circleCount = 3;
    context.strokeStyle = 'rgba(80,113,83,.42)';
    context.lineWidth = 1;
    for (let plane = 0; plane < circleCount; plane += 1) {
      context.beginPath();
      for (let step = 0; step <= 80; step += 1) {
        const angle = (step / 80) * Math.PI * 2;
        let point;
        if (plane === 0) point = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius, z: 0 };
        else if (plane === 1) point = { x: center.x + Math.cos(angle) * radius, y: 0, z: center.z + Math.sin(angle) * radius };
        else point = { x: 0, y: center.y + Math.cos(angle) * radius, z: center.z + Math.sin(angle) * radius };
        const projected = project(point, state, width, height);
        if (step === 0) context.moveTo(projected.x, projected.y);
        else context.lineTo(projected.x, projected.y);
      }
      context.stroke();
    }
    const label = project(center, state, width, height);
    context.font = '600 11px ui-monospace, monospace';
    context.textAlign = 'center';
    context.fillStyle = '#263c2c';
    context.fillText('Enc(x)', label.x, label.y + 4);
  }

  function drawLattice(context, state, width, height) {
    const layers = 7;
    const side = 6;
    const points = [];
    for (let layer = 0; layer < layers; layer += 1) {
      const x = (layer - (layers - 1) / 2) * 0.34;
      for (let row = 0; row < side; row += 1) {
        for (let col = 0; col < side; col += 1) {
          points.push({
            x,
            y: (row - (side - 1) / 2) * 0.24,
            z: (col - (side - 1) / 2) * 0.24,
            depth: layer,
          });
        }
      }
    }
    const projected = points.map((point) => ({ point, screen: project(point, state, width, height) }));
    context.lineWidth = 0.7;
    for (const item of projected) {
      const nearest = projected.filter((other) => other.point.depth === item.point.depth && other.point.y === item.point.y && other.point.z > item.point.z && other.point.z - item.point.z < 0.25);
      for (const other of nearest) {
        context.beginPath();
        context.moveTo(item.screen.x, item.screen.y);
        context.lineTo(other.screen.x, other.screen.y);
        context.strokeStyle = 'rgba(71,108,83,.28)';
        context.stroke();
      }
    }
    projected.sort((a, b) => a.screen.scale - b.screen.scale);
    for (const item of projected) {
      const p = item.screen;
      context.beginPath();
      context.arc(p.x, p.y, Math.max(1.3, 2.1 * p.scale), 0, Math.PI * 2);
      context.fillStyle = item.point.depth % 2 ? '#b89954' : '#5a8066';
      context.fill();
    }
    context.textAlign = 'center';
    context.font = '600 11px ui-monospace, monospace';
    context.fillStyle = '#263c2c';
    context.fillText('ciphertext slots', width / 2, height - 15);
  }

  for (const canvas of scenes) {
    const shell = canvas.closest('.scene-shell');
    const state = { yaw: -0.42, pitch: 0.15, zoom: 1, mode: 'network', dragging: false, lastX: 0, lastY: 0 };
    let frame = 0;
    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { context, width, height } = fitCanvas(canvas);
        context.clearRect(0, 0, width, height);
        context.fillStyle = 'rgba(236,239,226,.58)';
        context.fillRect(0, 0, width, height);
        if (state.mode === 'lattice') drawLattice(context, state, width, height);
        else drawNetwork(context, state, width, height);
      });
    };
    const updateZoom = (value) => {
      state.zoom = Number(value) / 100;
      const input = shell.querySelector('[data-scene-zoom]');
      if (input) input.value = String(Math.round(state.zoom * 100));
      render();
    };

    canvas.addEventListener('pointerdown', (event) => {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!state.dragging) return;
      state.yaw += (event.clientX - state.lastX) * 0.009;
      state.pitch = clamp(state.pitch + (event.clientY - state.lastY) * 0.009, -1.1, 1.1);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      render();
    });
    const stopDragging = () => { state.dragging = false; canvas.classList.remove('is-dragging'); };
    canvas.addEventListener('pointerup', stopDragging);
    canvas.addEventListener('pointercancel', stopDragging);
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      updateZoom(clamp(state.zoom * 100 - Math.sign(event.deltaY) * 7, 70, 145));
    }, { passive: false });
    canvas.addEventListener('keydown', (event) => {
      const turn = Math.PI / 18;
      if (event.key === 'ArrowLeft') state.yaw -= turn;
      else if (event.key === 'ArrowRight') state.yaw += turn;
      else if (event.key === 'ArrowUp') state.pitch = clamp(state.pitch - turn, -1.1, 1.1);
      else if (event.key === 'ArrowDown') state.pitch = clamp(state.pitch + turn, -1.1, 1.1);
      else if (event.key === '+' || event.key === '=') updateZoom(clamp(state.zoom * 100 + 8, 70, 145));
      else if (event.key === '-') updateZoom(clamp(state.zoom * 100 - 8, 70, 145));
      else return;
      event.preventDefault();
      render();
    });
    shell.querySelectorAll('[data-scene-turn]').forEach((button) => button.addEventListener('click', () => {
      state.yaw += Number(button.dataset.sceneTurn) * Math.PI / 10;
      render();
    }));
    shell.querySelector('[data-scene-reset]')?.addEventListener('click', () => {
      state.yaw = -0.42;
      state.pitch = 0.15;
      state.mode = 'network';
      updateZoom(100);
      const toggle = shell.querySelector('[data-scene-mode]');
      if (toggle) toggle.textContent = 'Show ciphertext lattice';
      render();
    });
    shell.querySelector('[data-scene-zoom]')?.addEventListener('input', (event) => updateZoom(event.target.value));
    shell.querySelector('[data-scene-mode]')?.addEventListener('click', (event) => {
      state.mode = state.mode === 'network' ? 'lattice' : 'network';
      event.currentTarget.textContent = state.mode === 'network' ? 'Show ciphertext lattice' : 'Show model graph';
      canvas.setAttribute('aria-label', state.mode === 'network'
        ? 'Interactive three-dimensional neural network illustration. Drag to rotate; use the zoom control or arrow keys.'
        : 'Interactive three-dimensional ciphertext lattice illustration. Drag to rotate; use the zoom control or arrow keys.');
      render();
    });
    new ResizeObserver(render).observe(canvas);
    render();
  }

  // Subtle pointer-controlled depth on project and writing cards across the site.
  if (!reducedMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project-compact, .writing-card, .project-row, .feature').forEach((card) => {
      card.classList.add('tilt-card');
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 2.8).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 3.6).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
})();
