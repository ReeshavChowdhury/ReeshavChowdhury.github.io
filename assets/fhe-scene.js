import * as THREE from 'three';
import { OrbitControls } from './vendor/three-r180/OrbitControls.js';

const canvas = document.querySelector('#fhe-canvas');
const fallback = document.querySelector('#fhe-fallback');
const stageCaption = document.querySelector('#fhe-stage-caption');
const pauseButton = document.querySelector('#fhe-motion-toggle');
const stageButtons = [...document.querySelectorAll('[data-fhe-step]')];
if (!canvas) throw new Error('FHE canvas not found');

const descriptions = [
  'A plain input x enters the system.',
  'Encryption turns x into Enc(x).',
  'The function runs directly on the ciphertext.',
  'The encrypted result can be decrypted to f(x).',
];

try {
  const scene = new THREE.Scene();
  const composition = new THREE.Group();
  scene.add(composition);
  scene.background = new THREE.Color('#07111b');
  scene.fog = new THREE.FogExp2('#07111b', 0.027);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(0, 1.7, 12.0);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.045;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.24;
  controls.minPolarAngle = 1.1;
  controls.maxPolarAngle = 1.95;

  scene.add(new THREE.HemisphereLight('#b8dfff', '#07111b', 1.25));
  const keyLight = new THREE.PointLight('#7edfc8', 35, 22, 2);
  keyLight.position.set(-3.5, 4.5, 4);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight('#7b99ff', 38, 24, 2);
  rimLight.position.set(3.5, 2.5, -4);
  scene.add(rimLight);
  const warmLight = new THREE.PointLight('#f2bd79', 15, 14, 2);
  warmLight.position.set(1.4, -1, 4);
  scene.add(warmLight);

  const positions = [-4.0, -1.34, 1.34, 4.0];
  const nodeCores = [];
  const teal = new THREE.Color('#8ce4cd');
  const blue = new THREE.Color('#93b5ff');
  const gold = new THREE.Color('#edc38b');
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const glowContext = glowCanvas.getContext('2d');
  const glowGradient = glowContext.createRadialGradient(64, 64, 2, 64, 64, 64);
  glowGradient.addColorStop(0, 'rgba(255,255,255,0.72)');
  glowGradient.addColorStop(0.28, 'rgba(255,255,255,0.24)');
  glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);

  function addStageBase(x, index) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);
    composition.add(group);
    const color = index === 2 ? gold : index === 3 ? blue : teal;
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture, color, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    aura.scale.set(3.0, 3.0, 1);
    aura.position.z = -0.55;
    group.add(aura);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.87, 0.014, 8, 100),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.92;
    group.add(ring);
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.008, 6, 72),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.26 })
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = -0.915;
    group.add(innerRing);
    const core = new THREE.Group();
    group.add(core);
    nodeCores.push(core);
    return { group, core, color };
  }

  const nodes = positions.map(addStageBase);

  // Plain input: a small, clear glass form.
  {
    const geometry = new THREE.IcosahedronGeometry(0.61, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: '#c4f0e8', roughness: 0.24, metalness: 0.16,
      transmission: 0.36, thickness: 0.7, clearcoat: 0.9,
      emissive: '#174c50', emissiveIntensity: 0.32,
    });
    const mesh = new THREE.Mesh(geometry, material);
    nodes[0].core.add(mesh);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.65, 1)),
      new THREE.LineBasicMaterial({ color: '#c3fff0', transparent: true, opacity: 0.38 })
    );
    nodes[0].core.add(wire);
  }

  // Encryption wraps the input in a translucent, moving field.
  {
    const shellGeo = new THREE.IcosahedronGeometry(0.82, 1);
    const shell = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
      color: '#75d9d0', roughness: 0.18, metalness: 0.32,
      transmission: 0.72, thickness: 1.3, clearcoat: 1,
      emissive: '#0c4447', emissiveIntensity: 0.42,
    }));
    nodes[1].core.add(shell);
    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.87, 1)),
      new THREE.LineBasicMaterial({ color: '#a9fff0', transparent: true, opacity: 0.7 })
    );
    nodes[1].core.add(cage);
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 16),
      new THREE.MeshBasicMaterial({ color: '#d4fff7', transparent: true, opacity: 0.9 })
    );
    nodes[1].core.add(inner);
  }

  // Evaluation: a quiet computational core surrounded by rotating rings.
  {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.49, 2),
      new THREE.MeshPhysicalMaterial({
        color: '#f1d4a3', roughness: 0.2, metalness: 0.35,
        clearcoat: 1, emissive: '#8b5f32', emissiveIntensity: 0.72,
      })
    );
    nodes[2].core.add(core);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.016, 8, 96), new THREE.MeshBasicMaterial({ color: '#f2c78d', transparent: true, opacity: 0.82 }));
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.012, 6, 96), new THREE.MeshBasicMaterial({ color: '#8ee6d1', transparent: true, opacity: 0.5 }));
    ringA.rotation.set(0.7, 0.25, 0.3);
    ringB.rotation.set(-0.55, 0.4, -0.35);
    nodes[2].core.add(ringA, ringB);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: i % 2 ? '#f4d39d' : '#9ff2dd' }));
      dot.position.set(Math.cos(angle) * 1.0, Math.sin(angle * 2) * 0.2, Math.sin(angle) * 1.0);
      nodes[2].core.add(dot);
    }
    nodeCores[2].userData.rings = [ringA, ringB];
  }

  // The result is still encrypted until its owner decrypts it.
  {
    const shell = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.73, 0),
      new THREE.MeshPhysicalMaterial({ color: '#a9c5ff', roughness: 0.2, metalness: 0.24, transmission: 0.56, thickness: 0.8, clearcoat: 1, emissive: '#273f86', emissiveIntensity: 0.44 })
    );
    nodes[3].core.add(shell);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.012, 6, 88), new THREE.MeshBasicMaterial({ color: '#bfd0ff', transparent: true, opacity: 0.66 }));
    ring.rotation.set(0.62, 0.2, -0.35);
    nodes[3].core.add(ring);
    const points = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 90 }, (_, i) => {
        const t = (i / 90) * Math.PI * 2;
        const r = 0.59 + (i % 5) * 0.027;
        return new THREE.Vector3(Math.cos(t) * r, Math.sin(t * 1.8) * 0.4, Math.sin(t) * r);
      })),
      new THREE.PointsMaterial({ color: '#dce8ff', size: 0.018, transparent: true, opacity: 0.75 })
    );
    nodes[3].core.add(points);
  }

  // A continuous glass filament and packets of light carry the computation through the four stages.
  const stageCurves = [];
  const pathColors = ['#85e6d1', '#9de9d1', '#aec5ff'];
  for (let i = 0; i < positions.length - 1; i += 1) {
    const x0 = positions[i], x1 = positions[i + 1];
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x0, 0.04, 0),
      new THREE.Vector3(x0 + 0.62, 0.82, 0.36),
      new THREE.Vector3(x1 - 0.62, 0.82, -0.36),
      new THREE.Vector3(x1, 0.04, 0),
    ]);
    stageCurves.push(curve);
    const filament = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.019, 8, false),
      new THREE.MeshBasicMaterial({ color: pathColors[i], transparent: true, opacity: 0.82 })
    );
    composition.add(filament);
    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.095, 8, false),
      new THREE.MeshBasicMaterial({ color: pathColors[i], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    composition.add(glow);
  }

  const packets = [];
  const packetColors = ['#b8ffec', '#f1d3a0', '#a6beff'];
  for (let i = 0; i < 36; i += 1) {
    const size = i % 7 === 0 ? 0.048 : 0.031;
    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(size, 10, 8),
      new THREE.MeshBasicMaterial({ color: packetColors[i % packetColors.length], transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(size * 2.8, 10, 8),
      new THREE.MeshBasicMaterial({ color: packetColors[i % packetColors.length], transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    composition.add(halo, packet);
    packets.push({ core: packet, halo });
  }

  // Restrained background dust gives the scene depth without competing with the FHE path.
  const dustPositions = new Float32Array(850 * 3);
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = (Math.random() - 0.5) * 24;
    dustPositions[i + 1] = (Math.random() - 0.5) * 13;
    dustPositions[i + 2] = -4 - Math.random() * 16;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#9bb9d2', size: 0.012, transparent: true, opacity: 0.35, sizeAttenuation: true }));
  composition.add(dust);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    const compact = window.innerWidth < 640;
    composition.scale.setScalar(compact ? 0.75 : 1);
    camera.position.z = compact ? 10.5 : 12.0;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let activeStage = 0;
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = playing;
  pauseButton.textContent = playing ? 'Pause' : 'Play';
  pauseButton.setAttribute('aria-pressed', String(playing));

  stageButtons.forEach((button) => button.addEventListener('click', () => {
    activeStage = Number(button.dataset.fheStep);
    stageButtons.forEach((item, index) => {
      const active = index === activeStage;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('is-active', active);
    });
    stageCaption.textContent = descriptions[activeStage];
  }));

  pauseButton.addEventListener('click', () => {
    playing = !playing;
    controls.autoRotate = playing;
    pauseButton.textContent = playing ? 'Pause' : 'Play';
    pauseButton.setAttribute('aria-pressed', String(playing));
  });

  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    controls.update();
    if (!playing) {
      renderer.render(scene, camera);
      return;
    }
    nodeCores.forEach((core, index) => {
      const active = index === activeStage;
      const pulse = active ? 1 + Math.sin(time * 2.5) * 0.035 : 1;
      core.scale.setScalar((index === 2 ? 1.12 : 1.32) * pulse);
      core.position.y = Math.sin(time * 0.65 + index) * 0.035;
      if (index === 0 || index === 1 || index === 3) core.rotation.y = time * (index === 1 ? 0.18 : 0.11) * (index === 3 ? -1 : 1);
      if (index === 2) {
        const [ringA, ringB] = core.userData.rings;
        ringA.rotation.y = time * 0.17;
        ringB.rotation.x = -0.55 + Math.sin(time * 0.3) * 0.08;
      }
    });
    packets.forEach((packet, index) => {
      const distance = (time * 0.095 + index / packets.length) % 1;
      const segmentFloat = distance * stageCurves.length;
      const segment = Math.min(stageCurves.length - 1, Math.floor(segmentFloat));
      const position = stageCurves[segment].getPointAt(segmentFloat - segment);
      packet.core.position.copy(position);
      packet.halo.position.copy(position);
    });
    dust.rotation.y = time * 0.004;
    renderer.render(scene, camera);
  };
  animate();
  fallback.hidden = true;
} catch (error) {
  console.error('FHE 3D scene could not start:', error);
  canvas.hidden = true;
  fallback.hidden = false;
  pauseButton.hidden = true;
}
