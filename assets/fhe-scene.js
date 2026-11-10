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
  'The client creates a key pair. The secret key stays on this device.',
  'The client encrypts message m with the public key: Encₚₖ(m).',
  'The server evaluates f over ciphertext, using evaluation keys. It never decrypts m.',
  'The server sends back Encₚₖ(f(m)); the result is still encrypted.',
  'The client uses its secret key to decrypt the returned result.',
];

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#091711');
  scene.fog = new THREE.FogExp2('#091711', 0.034);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
  camera.position.set(0, 3.35, 11.6);
  camera.lookAt(0, 0.15, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = false;
  controls.minPolarAngle = 0.92;
  controls.maxPolarAngle = 1.78;

  scene.add(new THREE.HemisphereLight('#d5edda', '#091711', 1.6));
  const clientLight = new THREE.PointLight('#8ce0ad', 34, 12, 2);
  clientLight.position.set(-3.1, 2.4, 3.3);
  scene.add(clientLight);
  const serverLight = new THREE.PointLight('#eac88c', 34, 12, 2);
  serverLight.position.set(3.2, 2.3, 2.7);
  scene.add(serverLight);
  const fillLight = new THREE.PointLight('#8cb6f0', 18, 12, 2);
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
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), mat('#10251b', 0.16, 0.88));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.28;
  stage.add(floor);
  const grid = new THREE.GridHelper(17, 28, '#456a4e', '#294632');
  grid.position.y = -1.265;
  grid.material.transparent = true;
  grid.material.opacity = 0.34;
  stage.add(grid);

  // Client workstation: the message and both key roles remain on this side.
  const client = new THREE.Group();
  client.position.set(-3.25, -0.05, 0.2);
  stage.add(client);
  const chassis = mat('#263b30', 0.74, 0.26);
  const screen = mat('#07140f', 0.38, 0.2, '#143d2a', 0.7);
  makeBox(client, [2.05, 1.43, 0.16], [0, 0.37, 0.05], chassis);
  makeBox(client, [1.82, 1.19, 0.025], [0, 0.38, 0.145], screen);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 300;
  const screenContext = screenCanvas.getContext('2d');
  const drawClientScreen = (showResult = false) => {
    screenContext.fillStyle = '#10251a';
    screenContext.fillRect(0, 0, 512, 300);
    screenContext.fillStyle = '#89b494';
    screenContext.font = '18px monospace';
    screenContext.fillText(showResult ? 'DECRYPTED RESULT' : 'CLIENT MESSAGE', 32, 56);
    screenContext.fillStyle = '#e1f4dc';
    screenContext.font = '34px monospace';
    screenContext.fillText(showResult ? 'f(m) = 84' : 'm = 42', 32, 128);
    screenContext.fillStyle = '#547b5c';
    screenContext.fillRect(32, 162, 295, 3);
    screenContext.fillStyle = '#a8c9a5';
    screenContext.font = '15px monospace';
    screenContext.fillText(showResult ? 'opened with secret key' : 'ready to encrypt with pk', 32, 205);
    screenContext.fillStyle = showResult ? '#f0d395' : '#8fe2ae';
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
  const messageDot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), mat('#c7f0c8', 0.1, 0.18, '#9af2a1', 1));
  messageDot.position.set(0.56, 0.69, 0.17);
  client.add(messageDot);
  makeBox(client, [2.3, 0.12, 0.9], [0, -0.43, 0.18], chassis);
  makeBox(client, [1.95, 0.018, 0.48], [0, -0.355, 0.2], mat('#354c3b', 0.35, 0.52));
  const stand = makeBox(client, [0.3, 0.43, 0.18], [0, -0.79, 0.04], chassis);
  stand.rotation.x = -0.14;
  makeBox(client, [1.15, 0.06, 0.43], [0, -1.0, 0.1], chassis);
  const clientRing = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: '#87d8a0', transparent: true, opacity: 0.52 }));
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
  const publicKey = makeKey('#9ee6bb');
  publicKey.position.set(-3.7, 1.45, 0.55);
  publicKey.scale.setScalar(0.74);
  client.add(publicKey);
  const secretKey = makeKey('#e4c58c');
  secretKey.position.set(-2.36, -0.83, 0.72);
  secretKey.scale.setScalar(0.58);
  secretKey.rotation.z = -0.35;
  client.add(secretKey);

  // Remote evaluator: a compact rack with a visible arithmetic core.
  const server = new THREE.Group();
  server.position.set(3.25, -0.05, 0.12);
  stage.add(server);
  const rackMat = mat('#27392f', 0.72, 0.3);
  const rackFace = mat('#14251d', 0.58, 0.32);
  makeBox(server, [2.05, 2.82, 1.05], [0, 0.1, 0], rackMat);
  makeBox(server, [1.83, 2.56, 0.06], [0, 0.1, 0.55], rackFace);
  const serverUnits = [];
  const leds = [];
  for (let i = 0; i < 3; i += 1) {
    const y = 0.91 - i * 0.78;
    const unit = makeBox(server, [1.53, 0.58, 0.08], [0, y, 0.61], mat('#263d30', 0.52, 0.4, '#193827', 0.24));
    serverUnits.push(unit);
    makeBox(server, [0.64, 0.032, 0.015], [-0.31, y + 0.11, 0.66], mat('#71917a', 0.1, 0.6, '#397b4d', 0.7));
    makeBox(server, [0.44, 0.025, 0.015], [-0.21, y + 0.025, 0.66], mat('#5b7862', 0.1, 0.6, '#284d36', 0.55));
    for (let j = 0; j < 3; j += 1) {
      const ledMat = new THREE.MeshBasicMaterial({ color: j === 0 ? '#9be0a6' : '#668a70' });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), ledMat);
      led.position.set(0.46 + j * 0.12, y + 0.1, 0.69);
      server.add(led);
      leds.push(led);
    }
  }
  const evalCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.31, 1), new THREE.MeshStandardMaterial({ color: '#edd09b', metalness: 0.28, roughness: 0.23, emissive: '#bd8e4e', emissiveIntensity: 0.8 }));
  evalCore.position.set(0, -0.05, 0.76);
  server.add(evalCore);
  const evalRingA = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: '#edce91', transparent: true, opacity: 0.85 }));
  const evalRingB = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.008, 6, 64), new THREE.MeshBasicMaterial({ color: '#9ad6b0', transparent: true, opacity: 0.5 }));
  evalRingA.rotation.x = 0.83;
  evalRingB.rotation.y = 0.72;
  evalCore.add(evalRingA, evalRingB);
  const serverRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: '#e4bd7d', transparent: true, opacity: 0.48 }));
  serverRing.rotation.x = Math.PI / 2;
  serverRing.position.set(0, -1.2, 0.12);
  server.add(serverRing);

  // The evaluator receives evaluation keys separately from the encrypted message.
  const evalKeyPacket = makeKey('#eacb88');
  evalKeyPacket.scale.setScalar(0.42);
  stage.add(evalKeyPacket);

  const makeCurve = (points, color, glowColor) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.018, 8, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78 }));
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.085, 8, false), new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }));
    stage.add(tube, glow);
    return curve;
  };
  const keyCurve = makeCurve([[-2.14, 1.52, 0.1], [-1.15, 2.12, -0.05], [0, 2.24, -0.15], [1.2, 1.93, -0.05], [2.2, 1.43, 0.25]], '#9ecb9e', '#6fdb9b');
  const outboundCurve = makeCurve([[-2.12, 0.48, 0.32], [-1.15, 1.18, 0.46], [0, 1.35, 0.25], [1.17, 1.12, 0.44], [2.14, 0.53, 0.45]], '#88d9b0', '#55e3ae');
  const returnCurve = makeCurve([[2.14, -0.57, 0.44], [1.17, -1.02, 0.32], [0, -1.11, 0.24], [-1.15, -0.94, 0.35], [-2.12, -0.48, 0.32]], '#b4c6ff', '#839ff6');

  const addArrow = (curve, at, color) => {
    const point = curve.getPointAt(at);
    const tangent = curve.getTangentAt(at).normalize();
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 16), new THREE.MeshBasicMaterial({ color }));
    arrow.position.copy(point);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    stage.add(arrow);
  };
  addArrow(outboundCurve, 0.99, '#a7e9c0');
  addArrow(returnCurve, 0.99, '#c2d0ff');

  const packet = new THREE.Group();
  const packetCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ color: '#a7e9c5', metalness: 0.38, roughness: 0.18, emissive: '#4dbb82', emissiveIntensity: 0.8 }));
  const packetWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.3, 1)), new THREE.LineBasicMaterial({ color: '#d1ffe1', transparent: true, opacity: 0.86 }));
  const packetHalo = new THREE.Mesh(new THREE.SphereGeometry(0.39, 20, 16), new THREE.MeshBasicMaterial({ color: '#75e8aa', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
  packet.add(packetCore, packetWire, packetHalo);
  stage.add(packet);

  const resultPacket = new THREE.Group();
  const resultCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: '#b8caff', metalness: 0.38, roughness: 0.18, emissive: '#687ee0', emissiveIntensity: 0.75 }));
  const resultWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.28, 0)), new THREE.LineBasicMaterial({ color: '#d3ddff', transparent: true, opacity: 0.86 }));
  const resultHalo = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), new THREE.MeshBasicMaterial({ color: '#879ff0', transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false }));
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
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#b8d6bc', size: 0.018, transparent: true, opacity: 0.32, sizeAttenuation: true }));
  stage.add(dust);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    const compact = window.innerWidth < 640;
    stage.scale.setScalar(compact ? 0.8 : window.innerWidth < 900 ? 0.9 : 1);
    camera.position.set(0, compact ? 3.15 : 3.35, compact ? 12.6 : 11.6);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let activeStage = 0;
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let frameId = 0;
  let lastScreenResult = false;
  const clock = new THREE.Clock();
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
    lab.dataset.activeStage = String(activeStage);
    if (progressFill) progressFill.style.width = `${((activeStage + 1) / stageButtons.length) * 100}%`;
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
    controls.update();
    if (playing) {
      const cycle = time % 12;
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
      leds.forEach((led, index) => { led.material.color.set(computing && index % 3 === Math.floor((time * 5) % 3) ? '#f1d28c' : index % 3 === 0 ? '#9be0a6' : '#668a70'); });

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
    }
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
}
