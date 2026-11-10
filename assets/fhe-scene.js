import * as THREE from 'three';
import { OrbitControls } from './vendor/three-r180/OrbitControls.js';

const canvas = document.querySelector('#fhe-canvas');
const fallback = document.querySelector('#fhe-fallback');
const stageCaption = document.querySelector('#fhe-stage-caption');
const pauseButton = document.querySelector('#fhe-motion-toggle');
const stageButtons = [...document.querySelectorAll('[data-fhe-step]')];
const progressFill = document.querySelector('.lab-progress span');
const lab = document.querySelector('.hero-lab');
if (!canvas) throw new Error('FHE canvas not found');

const descriptions = [
  'The client creates pk and sk, then derives evaluation keys. Use pk to encrypt locally; share evk, keep sk private.',
  'The client computes c = Encₚₖ(m). The plaintext m stays local; only ciphertext c is sent.',
  'The server computes c′ = Evalₑᵥₖ(f, c). It applies f without decrypting c.',
  'The server returns c′. The result is still encrypted while it travels back.',
  'The client computes m′ = Decₛₖ(c′). Exact schemes recover the result modulo t; CKKS is approximate.',
];
const mathStages = [
  { title: '01 / KEY GENERATION', equation: '(pk, sk) ← KeyGen(1^λ);   evk ← EvalKeyGen(sk)', note: 'Use pk to encrypt locally. Send scheme-required evk to the evaluator; keep sk private.' },
  { title: '02 / ENCRYPTION', equation: 'c ← Enc_pk(m)', note: 'Encrypt m with pk; send c, not m. RLWE schemes commonly encode c as polynomial components modulo q.' },
  { title: '03 / HOMOMORPHIC EVALUATION', equation: 'c′ ← Eval_evk(f, c)', note: 'Apply circuit f using evk. Multiplication depth, rotations, and noise budget depend on the scheme.' },
  { title: '04 / RETURN CIPHERTEXT', equation: 'server → client: c′', note: 'The returned value c′ is still encrypted; only the key owner can decrypt it.' },
  { title: '05 / DECRYPTION', equation: 'm′ ← Dec_sk(c′)', note: 'BFV/BGV recover the plaintext result modulo t. CKKS returns an approximate result.' },
];

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101722');
  scene.fog = new THREE.FogExp2('#101722', 0.034);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
  camera.position.set(0, 3.35, 11.6);
  camera.lookAt(0, 0.15, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = false;
  controls.minPolarAngle = 0.92;
  controls.maxPolarAngle = 1.78;

  scene.add(new THREE.HemisphereLight('#e1ecff', '#111823', 1.9));
  const clientLight = new THREE.PointLight('#69dfff', 42, 13, 2);
  clientLight.position.set(-3.1, 2.4, 3.3);
  scene.add(clientLight);
  const serverLight = new THREE.PointLight('#ffc76f', 40, 13, 2);
  serverLight.position.set(3.2, 2.3, 2.7);
  scene.add(serverLight);
  const fillLight = new THREE.PointLight('#a89cff', 24, 14, 2);
  fillLight.position.set(0, -0.6, -2.5);
  scene.add(fillLight);

  const stage = new THREE.Group();
  scene.add(stage);
  const mat = (color, metalness = 0.25, roughness = 0.32, emissive = '#000000', emissiveIntensity = 0) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity });
  const makeBox = (parent, size, position, material, radius = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };

  // Quiet ground plane and guide lines give the two machines a shared workspace.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), mat('#192231', 0.18, 0.82));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.28;
  stage.add(floor);
  const grid = new THREE.GridHelper(17, 28, '#7789a3', '#38475b');
  grid.position.y = -1.265;
  grid.material.transparent = true;
  grid.material.opacity = 0.34;
  stage.add(grid);

  // Client workstation: the message and both key roles remain on this side.
  const client = new THREE.Group();
  client.position.set(-3.25, -0.05, 0.2);
  stage.add(client);
  const chassis = mat('#667486', 0.62, 0.3);
  const screen = mat('#0b1522', 0.32, 0.2, '#162b47', 0.8);
  makeBox(client, [2.05, 1.43, 0.16], [0, 0.37, 0.05], chassis);
  makeBox(client, [1.82, 1.19, 0.025], [0, 0.38, 0.145], screen);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 300;
  const screenContext = screenCanvas.getContext('2d');
  const drawClientScreen = (showResult = false) => {
    screenContext.fillStyle = '#152338';
    screenContext.fillRect(0, 0, 512, 300);
    screenContext.fillStyle = '#8ecdf2';
    screenContext.font = '18px monospace';
    screenContext.fillText(showResult ? 'DECRYPTED RESULT' : 'CLIENT MESSAGE', 32, 56);
    screenContext.fillStyle = '#edf6ff';
    screenContext.font = '34px monospace';
    screenContext.fillText(showResult ? 'f(m) = 84' : 'm = 42', 32, 128);
    screenContext.fillStyle = '#58728f';
    screenContext.fillRect(32, 162, 295, 3);
    screenContext.fillStyle = '#bfd4e9';
    screenContext.font = '15px monospace';
    screenContext.fillText(showResult ? 'opened with secret key' : 'ready to encrypt with pk', 32, 205);
    screenContext.fillStyle = showResult ? '#ffd17a' : '#70e4ff';
    screenContext.beginPath();
    screenContext.arc(451, 45, 9, 0, Math.PI * 2);
    screenContext.fill();
  };
  drawClientScreen();
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  const screenDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 1.19), new THREE.MeshBasicMaterial({ map: screenTexture }));
  screenDisplay.position.set(0, 0.38, 0.17);
  client.add(screenDisplay);
  const messageDot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), mat('#b3f3ff', 0.1, 0.18, '#62dfff', 1));
  messageDot.position.set(0.56, 0.69, 0.17);
  client.add(messageDot);
  makeBox(client, [2.3, 0.12, 0.9], [0, -0.43, 0.18], chassis);
  makeBox(client, [1.95, 0.018, 0.48], [0, -0.355, 0.2], mat('#8795a5', 0.35, 0.52));
  const stand = makeBox(client, [0.3, 0.43, 0.18], [0, -0.79, 0.04], chassis);
  stand.rotation.x = -0.14;
  makeBox(client, [1.15, 0.06, 0.43], [0, -1.0, 0.1], chassis);
  const clientRing = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: '#64dfff', transparent: true, opacity: 0.66 }));
  clientRing.rotation.x = Math.PI / 2;
  clientRing.position.set(0, -1.2, 0.12);
  client.add(clientRing);

  // Key glyphs are kept visually distinct: public/evaluation material may travel;
  // the secret key is shown locked to the client machine.
  const makeKey = (color) => {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.66, roughness: 0.22, emissive: color, emissiveIntensity: 0.18 });
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 8, 22), material);
    group.add(bow);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.39, 12), material);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.x = 0.25;
    group.add(shaft);
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.08), material);
    tooth.position.set(0.35, -0.085, 0);
    group.add(tooth);
    return group;
  };
  const publicKey = makeKey('#73e3ff');
  publicKey.position.set(-0.96, 1.36, 0.55);
  publicKey.scale.setScalar(0.74);
  client.add(publicKey);
  const secretKey = makeKey('#e4c58c');
  secretKey.position.set(0.82, -0.79, 0.72);
  secretKey.scale.setScalar(0.58);
  secretKey.rotation.z = -0.35;
  client.add(secretKey);

  // Remote evaluator: a compact rack with a visible arithmetic core.
  const server = new THREE.Group();
  server.position.set(3.25, -0.05, 0.12);
  stage.add(server);
  const rackMat = mat('#566273', 0.72, 0.3);
  const rackFace = mat('#182333', 0.58, 0.32);
  makeBox(server, [2.05, 2.82, 1.05], [0, 0.1, 0], rackMat);
  makeBox(server, [1.83, 2.56, 0.06], [0, 0.1, 0.55], rackFace);
  const serverUnits = [];
  const leds = [];
  for (let i = 0; i < 3; i += 1) {
    const y = 0.91 - i * 0.78;
    const unit = makeBox(server, [1.53, 0.58, 0.08], [0, y, 0.61], mat('#344257', 0.52, 0.4, '#213550', 0.24));
    serverUnits.push(unit);
    makeBox(server, [0.64, 0.032, 0.015], [-0.31, y + 0.11, 0.66], mat('#9cb4d0', 0.1, 0.6, '#4976ab', 0.7));
    makeBox(server, [0.44, 0.025, 0.015], [-0.21, y + 0.025, 0.66], mat('#6e86a1', 0.1, 0.6, '#38587f', 0.55));
    for (let j = 0; j < 3; j += 1) {
      const ledMat = new THREE.MeshBasicMaterial({ color: j === 0 ? '#ffc96e' : '#8cb3e2' });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), ledMat);
      led.position.set(0.46 + j * 0.12, y + 0.1, 0.69);
      server.add(led);
      leds.push(led);
    }
  }
  const evalCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.31, 1), new THREE.MeshStandardMaterial({ color: '#ffe0a3', metalness: 0.28, roughness: 0.23, emissive: '#d68a3d', emissiveIntensity: 1.05 }));
  evalCore.position.set(0, -0.05, 0.76);
  server.add(evalCore);
  const evalRingA = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: '#ffd17b', transparent: true, opacity: 0.92 }));
  const evalRingB = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.008, 6, 64), new THREE.MeshBasicMaterial({ color: '#6fe5ff', transparent: true, opacity: 0.72 }));
  evalRingA.rotation.x = 0.83;
  evalRingB.rotation.y = 0.72;
  evalCore.add(evalRingA, evalRingB);
  const serverRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: '#ffc76f', transparent: true, opacity: 0.58 }));
  serverRing.rotation.x = Math.PI / 2;
  serverRing.position.set(0, -1.2, 0.12);
  server.add(serverRing);

  // The evaluator receives evaluation keys separately from the encrypted message.
  const evalKeyPacket = makeKey('#ffd17a');
  evalKeyPacket.scale.setScalar(0.42);
  stage.add(evalKeyPacket);

  const makeCurve = (points, color, glowColor) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.018, 8, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78 }));
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.085, 8, false), new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }));
    stage.add(tube, glow);
    return curve;
  };
  const keyCurve = makeCurve([[-2.14, 1.52, 0.1], [-1.15, 2.12, -0.05], [0, 2.24, -0.15], [1.2, 1.93, -0.05], [2.2, 1.43, 0.25]], '#ffd17a', '#ffb84e');
  const outboundCurve = makeCurve([[-2.12, 0.48, 0.32], [-1.15, 1.18, 0.46], [0, 1.35, 0.25], [1.17, 1.12, 0.44], [2.14, 0.53, 0.45]], '#63e4ff', '#45cfff');
  const returnCurve = makeCurve([[2.14, -0.57, 0.44], [1.17, -1.02, 0.32], [0, -1.11, 0.24], [-1.15, -0.94, 0.35], [-2.12, -0.48, 0.32]], '#c0a6ff', '#9a84ff');

  const addArrow = (curve, at, color) => {
    const point = curve.getPointAt(at);
    const tangent = curve.getTangentAt(at).normalize();
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 16), new THREE.MeshBasicMaterial({ color }));
    arrow.position.copy(point);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    stage.add(arrow);
  };
  addArrow(outboundCurve, 0.99, '#8df0ff');
  addArrow(returnCurve, 0.99, '#d1c2ff');

  const packet = new THREE.Group();
  const packetCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ color: '#a5f4ff', metalness: 0.38, roughness: 0.18, emissive: '#26bada', emissiveIntensity: 1.1 }));
  const packetWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.3, 1)), new THREE.LineBasicMaterial({ color: '#e4fbff', transparent: true, opacity: 0.98 }));
  const packetHalo = new THREE.Mesh(new THREE.SphereGeometry(0.39, 20, 16), new THREE.MeshBasicMaterial({ color: '#60e5ff', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  packet.add(packetCore, packetWire, packetHalo);
  stage.add(packet);

  const resultPacket = new THREE.Group();
  const resultCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: '#d4c7ff', metalness: 0.38, roughness: 0.18, emissive: '#8870ee', emissiveIntensity: 1 }));
  const resultWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.28, 0)), new THREE.LineBasicMaterial({ color: '#f1ecff', transparent: true, opacity: 0.98 }));
  const resultHalo = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), new THREE.MeshBasicMaterial({ color: '#a897ff', transparent: true, opacity: 0.19, blending: THREE.AdditiveBlending, depthWrite: false }));
  resultPacket.add(resultCore, resultWire, resultHalo);
  stage.add(resultPacket);
  evalKeyPacket.position.copy(keyCurve.getPointAt(0));
  packet.position.copy(outboundCurve.getPointAt(0));
  packet.visible = false;
  resultPacket.position.copy(returnCurve.getPointAt(0));
  resultPacket.visible = false;

  const dustPositions = new Float32Array(300 * 3);
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = (Math.random() - 0.5) * 14;
    dustPositions[i + 1] = Math.random() * 5 - 1.1;
    dustPositions[i + 2] = -2.1 - Math.random() * 5;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#bfd5f5', size: 0.018, transparent: true, opacity: 0.29, sizeAttenuation: true }));
  stage.add(dust);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    const compact = window.innerWidth < 640;
    stage.scale.setScalar(compact ? 0.76 : window.innerWidth < 900 ? 0.9 : 1);
    camera.position.set(0, compact ? 3.05 : 3.15, compact ? 10.8 : 9.6);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let activeStage = 0;
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let frameId = 0;
  let lastScreenResult = false;
  let phaseOffset = 0;
  const clock = new THREE.Clock();
  const phaseStarts = [0, 2.68, 5.42, 7.28, 10.32];
  const mathTitle = document.querySelector('#flow-math-title');
  const mathEquation = document.querySelector('#flow-equation');
  const mathNote = document.querySelector('#flow-math-note');
  lab.dataset.activeStage = '0';
  if (progressFill) progressFill.style.width = `${100 / stageButtons.length}%`;

  const setStage = (index) => {
    activeStage = index;
    stageButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeStage;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    stageCaption.textContent = descriptions[activeStage];
    mathTitle.textContent = mathStages[activeStage].title;
    mathEquation.textContent = mathStages[activeStage].equation;
    mathNote.textContent = mathStages[activeStage].note;
    lab.dataset.activeStage = String(activeStage);
    if (progressFill) progressFill.style.width = `${((activeStage + 1) / stageButtons.length) * 100}%`;
    phaseOffset = phaseStarts[activeStage] - (clock.getElapsedTime() % 12);
    scheduleRender();
  };
  stageButtons.forEach((button) => button.addEventListener('click', () => setStage(Number(button.dataset.fheStep))));

  const scheduleRender = () => {
    if (visible && !frameId) frameId = requestAnimationFrame(animate);
  };
  const animate = () => {
    frameId = 0;
    if (!visible) return;
    const time = clock.getElapsedTime();
    const cycle = ((time + phaseOffset) % 12 + 12) % 12;
    controls.update();
    const smooth = (v) => { const n = THREE.MathUtils.clamp(v, 0, 1); return n * n * (3 - 2 * n); };
    const placeOn = (object, curve, progress) => object.position.copy(curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1)));

    // Evaluation material is provisioned first; the secret key never enters this route.
    const keyProgress = smooth(cycle / 1.9);
    placeOn(evalKeyPacket, keyCurve, keyProgress);
    evalKeyPacket.visible = cycle < 2.2;

    // The message is encrypted locally, then only its ciphertext follows this path.
    const outbound = smooth((cycle - 2.55) / 2.35);
    placeOn(packet, outboundCurve, outbound);
    packet.visible = cycle >= 2.45 && cycle < 5.25;
    packet.rotation.x = time * 0.45;
    packet.rotation.y = time * 0.72;
    packet.scale.setScalar(0.84 + Math.sin(time * 4) * 0.04);

    // The server's evaluation core lights up while it computes over ciphertext.
    const computing = cycle >= 5.25 && cycle < 7.15;
    const computePulse = computing ? 1 + Math.sin(time * 8) * 0.12 : 0.83;
    evalCore.scale.setScalar(computePulse);
    evalCore.rotation.y = time * (computing ? 0.9 : 0.16);
    evalRingA.rotation.z = time * 0.8;
    evalRingB.rotation.x = 0.72 + Math.sin(time * 0.5) * 0.1;
    serverLight.intensity = computing ? 44 + Math.sin(time * 8) * 10 : 25;
    leds.forEach((led, index) => { led.material.color.set(computing && index % 3 === Math.floor((time * 5) % 3) ? '#fff0bd' : index % 3 === 0 ? '#ffc96e' : '#8cb3e2'); });

    // The returned object is still ciphertext until the client decrypts it.
    const returning = smooth((cycle - 7.18) / 2.25);
    placeOn(resultPacket, returnCurve, returning);
    resultPacket.visible = cycle >= 7.1 && cycle < 10.15;
    resultPacket.rotation.x = time * 0.51;
    resultPacket.rotation.y = -time * 0.68;
    const decrypted = cycle >= 10.15 && cycle < 11.8;
    if (decrypted !== lastScreenResult) {
      drawClientScreen(decrypted);
      screenTexture.needsUpdate = true;
      lastScreenResult = decrypted;
    }
    messageDot.material.emissiveIntensity = decrypted ? 1.8 : 0.72;
    clientLight.intensity = decrypted ? 44 : 28;
    publicKey.rotation.z = Math.sin(time * 0.6) * 0.08;
    secretKey.rotation.y = Math.sin(time * 0.3) * 0.06;
    clientRing.material.opacity = decrypted ? 0.9 : 0.48;
    serverRing.material.opacity = computing ? 0.9 : 0.42;
    dust.rotation.y = time * 0.012;
    renderer.render(scene, camera);
    if (playing) scheduleRender();
  };

  controls.addEventListener('change', scheduleRender);
  pauseButton.textContent = playing ? 'Pause flow' : 'Play flow';
  pauseButton.setAttribute('aria-pressed', String(playing));
  pauseButton.addEventListener('click', () => {
    playing = !playing;
    pauseButton.textContent = playing ? 'Pause flow' : 'Play flow';
    pauseButton.setAttribute('aria-pressed', String(playing));
    scheduleRender();
  });
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scheduleRender();
    else if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
  }, { threshold: 0.01 });
  visibilityObserver.observe(canvas);
  scheduleRender();
  fallback.hidden = true;
} catch (error) {
  console.error('FHE 3D flow could not start:', error);
  canvas.hidden = true;
  fallback.textContent = 'Client: m → Encₚₖ(m) → Server: Eval(f) → Encₚₖ(f(m)) → Client: Decₛₖ';
  fallback.hidden = false;
  pauseButton.hidden = true;
  stageButtons.forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.fheStep);
    stageCaption.textContent = descriptions[index];
    document.querySelector('#flow-math-title').textContent = mathStages[index].title;
    document.querySelector('#flow-equation').textContent = mathStages[index].equation;
    document.querySelector('#flow-math-note').textContent = mathStages[index].note;
    stageButtons.forEach((item, itemIndex) => {
      item.setAttribute('aria-pressed', String(itemIndex === index));
      item.classList.toggle('is-active', itemIndex === index);
    });
    if (progressFill) progressFill.style.width = `${((index + 1) / stageButtons.length) * 100}%`;
  }));
}
