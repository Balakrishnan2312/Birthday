/**
 * 3D Birthday Celebration Web Application
 * Powered by Three.js, Web Audio API, and Tailwind CSS
 * 
 * Luxury 3D Birthday Cake Redesign:
 * - 3-Tier Realistic Cake with smooth rounded edges & glossy frosting
 * - Soft pastel pink, white, cream, and subtle gold color palettes
 * - Cream piping around every tier
 * - Realistic dripping frosting on middle tier
 * - Edible pearl borders & sugar flower decorations
 * - Premium gold accents & cake stand
 * - 6 Soft glowing candles with flickering flames & smoke effects
 * - Purely decorative 3D Golden Crown Topper (ABSOLUTELY ZERO TEXT ON CAKE)
 * - Animated floating/bobbing, joyful celebration bounce, and theme switching
 */

// ==========================================
// COLOR THEMES FOR LUXURY 3D CAKE
// ==========================================
const CAKE_THEMES = [
  {
    name: 'Luxury Rose & Gold',
    bottom: 0xf472b6,  // Pastel rose pink fondant
    middle: 0xfff1f2,  // Silky cream white fondant
    top: 0xf43f5e,     // Rich pastel blush pink fondant
    accent: 0xfacc15,  // Luxury gold details & crown topper
    drip: 0xfff8f0,    // Smooth glossy cream drip
    pearl: 0xffffff,   // Edible white pearl
    piping: 0xfff0f5,  // Soft cream piping
    flower: 0xfbcfe8,  // Soft sugar blossom pink
    stand: 0xfffbeb,   // Ivory & gold cake stand
  },
  {
    name: 'Pastel Lavender Dream',
    bottom: 0xa855f7,  // Soft lavender
    middle: 0xf5f3ff,  // Creamy white
    top: 0x8b5cf6,     // Pastel purple
    accent: 0xf59e0b,  // Rose gold
    drip: 0xffffff,    // Vanilla white drip
    pearl: 0xf3e8ff,   // Lavender pearl
    piping: 0xfaf5ff,  // Soft piping
    flower: 0xe9d5ff,  // Lilac flower
    stand: 0xf8fafc,   // Pearl stand
  },
  {
    name: 'Emerald & Champagne',
    bottom: 0x10b981,  // Rich emerald fondant
    middle: 0xecfdf5,  // Mint cream fondant
    top: 0x059669,     // Deep emerald top tier
    accent: 0xfbbf24,  // Champagne gold
    drip: 0xfffbe6,    // Cream drip
    pearl: 0xffffff,   // White pearl
    piping: 0xf0fdf4,  // Cream piping
    flower: 0xa7f3d0,  // Mint sugar flower
    stand: 0xfffbe6,   // Champagne stand
  },
  {
    name: 'Royal Ocean Pearl',
    bottom: 0x38bdf8,  // Pastel ocean blue
    middle: 0xf0f9ff,  // Soft cloud white
    top: 0x0284c7,     // Deep sky blue
    accent: 0xf59e0b,  // Bright gold
    drip: 0xffffff,    // Glossy white drip
    pearl: 0xe0f2fe,   // Sky pearl
    piping: 0xf0f9ff,  // Cream piping
    flower: 0xbae6fd,  // Soft blue blossom
    stand: 0xf8fafc,   // White stand
  }
];

// Global App State
let activeThemeIndex = 0;
let candlesBlown = false;
let isPlayingMusic = false;
let audioCtx = null;
let melodyTimeoutId = null;

// Three.js Core Globals
let scene, camera, renderer, controls;
let cakeGroup;
let tierMaterials = [];
let themeMaterials = {};
let candleFlames = [];
let candleLights = [];
let smokeParticles = [];
let ambientSparkles;
let confettiExplosionParticles = [];
let fairyBulbs = [];
let roomBalloons = [];
let wallFrames = [];
let activeSelectedFrameIndex = null;

// Dynamic Animation State
let cakeBounceOffsetY = 0;
let cakeBounceVelocity = 0;
let topperGroup = null;

// Raycasting for interactive candle clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ==========================================
// 0. LAMP INTRO & STAGE STATE MACHINE
// ==========================================
const APP_STATE = {
  INTRO_OFF: 'INTRO_OFF',
  LAMP_PULLING: 'LAMP_PULLING',
  LAMP_ON: 'LAMP_ON',
  LIGHT_REVEAL: 'LIGHT_REVEAL',
  CAKE_ROOM: 'CAKE_ROOM'
};

let currentAppState = APP_STATE.INTRO_OFF;
let lampOn = false;
let pulling = false;
let pullStartY = 0;
let pullDelta = 0;
const PULL_THRESHOLD = 28;
let particlesInterval = null;
let revealTimeoutId = null;
let revealTransitionTimerId = null;

function initLampIntro() {
  const pullHandle = document.getElementById('pull-handle');
  const pullAssembly = document.getElementById('pull-assembly');
  const pullString = document.getElementById('pull-string');
  const cursorGlow = document.getElementById('cursor-glow');

  if (!pullHandle) return;

  // Pulse hint on handle initially
  pullHandle.classList.add('pulsing');

  // Mouse events
  pullHandle.addEventListener('mousedown', onPullStart);
  window.addEventListener('mousemove', onPullMove);
  window.addEventListener('mouseup', onPullEnd);

  // Touch events
  pullHandle.addEventListener('touchstart', onPullStart, { passive: false });
  window.addEventListener('touchmove', onPullMove, { passive: false });
  window.addEventListener('touchend', onPullEnd);

  // Click / tap fallback
  pullHandle.addEventListener('click', onHandleClick);

  // Keyboard support
  pullHandle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleLamp();
    }
  });

  // Cursor glow
  window.addEventListener('mousemove', (e) => {
    if (cursorGlow) {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    }
  });

  function clientY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  function getBaseStringHeight() {
    return window.innerWidth <= 600 ? 55 : 75;
  }

  function onPullStart(e) {
    if (currentAppState === APP_STATE.CAKE_ROOM) return;
    if (e.button !== undefined && e.button !== 0) return; // Only primary mouse button
    pulling = true;
    pullStartY = clientY(e);
    pullDelta = 0;
    if (currentAppState === APP_STATE.INTRO_OFF) {
      currentAppState = APP_STATE.LAMP_PULLING;
    }
    pullHandle.classList.remove('pulsing');
    pullHandle.style.cursor = 'grabbing';
  }

  function onPullMove(e) {
    if (!pulling) return;
    pullDelta = Math.max(0, clientY(e) - pullStartY);
    const clampedDelta = Math.min(pullDelta, 50);
    if (pullString) pullString.style.height = (getBaseStringHeight() + clampedDelta) + 'px';
    if (pullHandle) pullHandle.style.transform = 'translateY(' + clampedDelta + 'px)';
  }

  function onPullEnd() {
    if (!pulling) return;
    pulling = false;
    pullHandle.style.cursor = 'grab';

    if (pullString) pullString.style.height = '';
    if (pullHandle) pullHandle.style.transform = '';

    if (pullDelta >= PULL_THRESHOLD) {
      toggleLamp();
    } else {
      // Quick tap / click fallback animation & toggle
      animatePull();
    }
    pullDelta = 0;
  }

  function onHandleClick(e) {
    if (currentAppState === APP_STATE.CAKE_ROOM) return;
  }

  function animatePull() {
    if (pullAssembly) pullAssembly.classList.add('pulled');
    setTimeout(() => {
      if (pullAssembly) pullAssembly.classList.remove('pulled');
      toggleLamp();
    }, 320);
  }
}

function toggleLamp() {
  if (currentAppState === APP_STATE.CAKE_ROOM) return;

  lampOn = !lampOn;
  if (lampOn) {
    turnOnLamp();
  } else {
    turnOffLamp();
  }
}

function turnOnLamp() {
  currentAppState = APP_STATE.LAMP_ON;

  const bulbGlow = document.getElementById('bulb-glow');
  const lightCone = document.getElementById('light-cone');
  const roomLight = document.getElementById('room-light');
  const floorShadow = document.getElementById('floor-shadow');
  const instruction = document.getElementById('instruction');
  const pullHandle = document.getElementById('pull-handle');

  if (bulbGlow) bulbGlow.classList.add('on');
  if (lightCone) lightCone.classList.add('on');
  if (roomLight) roomLight.classList.add('on');
  if (floorShadow) floorShadow.classList.add('on');
  if (instruction) instruction.classList.add('hidden');
  if (pullHandle) pullHandle.classList.remove('pulsing');

  startParticles();

  // Schedule cake room reveal after 1.2 seconds of full lamp brightness
  if (revealTimeoutId) clearTimeout(revealTimeoutId);
  revealTimeoutId = setTimeout(() => {
    if (lampOn && currentAppState === APP_STATE.LAMP_ON) {
      triggerCakeReveal();
    }
  }, 1200);
}

function turnOffLamp() {
  lampOn = false;

  // Cancel any pending reveal timeouts
  if (revealTimeoutId) {
    clearTimeout(revealTimeoutId);
    revealTimeoutId = null;
  }
  if (revealTransitionTimerId) {
    clearTimeout(revealTransitionTimerId);
    revealTransitionTimerId = null;
  }

  currentAppState = APP_STATE.INTRO_OFF;

  // Stop background music if returning to dark intro
  if (bgAudio) {
    try {
      bgAudio.pause();
      bgAudio.currentTime = 0;
      isAudioPlaying = false;
    } catch (e) {}
  }

  const bulbGlow = document.getElementById('bulb-glow');
  const lightCone = document.getElementById('light-cone');
  const roomLight = document.getElementById('room-light');
  const floorShadow = document.getElementById('floor-shadow');
  const pullHandle = document.getElementById('pull-handle');
  const lampIntro = document.getElementById('lamp-intro');
  const transitionOverlay = document.getElementById('transition-overlay');
  const cakeExperience = document.getElementById('cake-experience');

  if (bulbGlow) bulbGlow.classList.remove('on');
  if (lightCone) lightCone.classList.remove('on');
  if (roomLight) roomLight.classList.remove('on');
  if (floorShadow) floorShadow.classList.remove('on');

  if (transitionOverlay) transitionOverlay.classList.remove('active');
  if (cakeExperience) cakeExperience.classList.remove('cake-experience-active');
  if (lampIntro) {
    lampIntro.classList.remove('intro-fading', 'intro-hidden');
  }

  stopParticles();

  setTimeout(() => {
    if (!lampOn && pullHandle) pullHandle.classList.add('pulsing');
  }, 1200);
}

function triggerCakeReveal() {
  lampOn = true;
  currentAppState = APP_STATE.LIGHT_REVEAL;

  const introLayer = document.getElementById('shobanaIntroLayer');
  const quizLayer = document.getElementById('shobanaQuizLayer');
  const completionLayer = document.getElementById('shobanaCompletionLayer');
  if (introLayer) { introLayer.style.display = 'none'; }
  if (quizLayer) { quizLayer.style.display = 'none'; }
  if (completionLayer) { completionLayer.style.display = 'none'; }

  const lampIntro = document.getElementById('lamp-intro');
  const transitionOverlay = document.getElementById('transition-overlay');
  const cakeExperience = document.getElementById('cake-experience');

  // Instantly hide lamp intro so it doesn't block the 3D room on mobile
  if (lampIntro) {
    lampIntro.classList.add('intro-fading', 'intro-hidden');
    lampIntro.style.display = 'none';
  }

  // Warm golden transition flash
  if (transitionOverlay) transitionOverlay.classList.add('active');

  // Reveal 3D cake room
  revealTransitionTimerId = setTimeout(() => {
    lampOn = true;
    if (cakeExperience) {
      cakeExperience.style.display = 'block';
      cakeExperience.classList.add('cake-experience-active');
    }
    currentAppState = APP_STATE.CAKE_ROOM;

    // Play background song automatically when entering 3D cake room!
    playSiteBGMOnOpen();

    // Force immediate camera & WebGL renderer adaptation for mobile viewports
    onWindowResize();

    // Fade out flash overlay
    setTimeout(() => {
      if (transitionOverlay) transitionOverlay.classList.remove('active');
    }, 400);
  }, 150);
}
window.triggerCakeReveal = triggerCakeReveal;

function goBackToQuiz() {
  const cakeExperience = document.getElementById('cake-experience');
  if (cakeExperience) cakeExperience.classList.remove('cake-experience-active');
  currentAppState = APP_STATE.QUIZ;
  if (typeof window.reopenQuiz === 'function') {
    window.reopenQuiz();
  }
}
window.goBackToQuiz = goBackToQuiz;

/* Dust Particles System */
function startParticles() {
  if (particlesInterval) return;
  spawnBatch();
  particlesInterval = setInterval(spawnBatch, 800);
}

function stopParticles() {
  if (particlesInterval) {
    clearInterval(particlesInterval);
    particlesInterval = null;
  }
  const particlesCont = document.getElementById('particles');
  if (particlesCont) {
    const existing = particlesCont.querySelectorAll('.particle');
    existing.forEach((p) => {
      p.style.opacity = '0';
      setTimeout(() => { p.remove(); }, 1000);
    });
  }
}

function spawnBatch() {
  const count = window.innerWidth <= 600 ? 3 : 5;
  for (let i = 0; i < count; i++) {
    spawnParticle();
  }
}

function spawnParticle() {
  const particlesCont = document.getElementById('particles');
  if (!particlesCont) return;

  const el = document.createElement('div');
  el.className = 'particle';

  const size = 1.5 + Math.random() * 2.5;
  el.style.width = size + 'px';
  el.style.height = size + 'px';

  const lampCenterX = window.innerWidth / 2;
  const lampBottomY = getLampBottom();
  const coneHeight = window.innerHeight * 0.55;

  const yRatio = Math.random();
  const y = lampBottomY + yRatio * coneHeight;
  const spread = 40 + yRatio * (window.innerWidth * 0.22);
  const x = lampCenterX + (Math.random() - 0.5) * spread;

  el.style.left = x + 'px';
  el.style.top = y + 'px';

  const dx = (Math.random() - 0.5) * 60;
  const dy = -20 - Math.random() * 40;
  el.style.setProperty('--dx', dx + 'px');
  el.style.setProperty('--dy', dy + 'px');

  const duration = 3000 + Math.random() * 3000;
  el.style.animation = 'particle-float ' + duration + 'ms ease-in-out forwards';

  particlesCont.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, duration + 200);
}

function getLampBottom() {
  const shade = document.querySelector('.lampshade');
  if (shade) {
    const rect = shade.getBoundingClientRect();
    return rect.bottom;
  }
  return window.innerHeight * 0.4;
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  createHomeEnvironment();
  createCake();
  createAmbientSparkles();
  setupUIEventListeners();
  animate();
  initLampIntro();
});

// ==========================================
// 1. THREE.JS SCENE SETUP
// ==========================================
function initThreeScene() {
  const container = document.getElementById('canvas-container');

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x181324, 0.003);

  // Camera - Wide perspective framing smaller cake elegantly with cinematic empty space matching reference screenshot ratio
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5.2, 13.2);

  // Renderer - High Performance 4K Anti-Aliased WebGL
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.90;
  // Use sRGB output for correct color rendering of photo textures
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Orbit Controls (Manual 360 Degree Room Navigation Only)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 5.2, 0); // Focus central point of room between cake and wall gallery
  controls.minDistance = 3.0;
  controls.maxDistance = 22.0;
  controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent camera going below table
  controls.autoRotate = false;

  // Dim Soft Warm Ambient Illumination
  const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.60);
  scene.add(ambientLight);

  // Key Light (Off - Top Key Light Disabled)
  const keyLight = new THREE.DirectionalLight(0xfff3e0, 0.0);
  keyLight.position.set(7, 13, 7);

  // Fill Light (Soft Dim Bounce)
  const fillLight = new THREE.DirectionalLight(0xffd8c0, 0.25);
  fillLight.position.set(-8, 7, -6);
  scene.add(fillLight);

  // Cake Rim Light (Soft Dim Rim Highlight)
  const cakeRimLight = new THREE.DirectionalLight(0xffecd1, 0.30);
  cakeRimLight.position.set(0, 6, -5);
  scene.add(cakeRimLight);

  // Central Golden Ceiling Chandelier Light (Off - Top Light Disabled)
  const roomChandelierLight = new THREE.PointLight(0xffd180, 0.0, 35);
  roomChandelierLight.position.set(0, 10, 0);

  // Window Resize Event & Initial PC/Mobile responsive setup
  window.addEventListener('resize', onWindowResize);

  // Raycaster click handler for candles
  renderer.domElement.addEventListener('pointerdown', onCanvasClick);
  renderer.domElement.addEventListener('pointermove', onPointerMove);

  updateResponsiveCameraAndCakeScale();
}

function updateResponsiveCameraAndCakeScale() {
  if (!camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  // 1. Dynamic Camera FOV & Distance Adaptation for PC (Desktop) vs Mobile Formats
  if (aspect < 1.0) {
    // Mobile Portrait Format (Phone screens & tall portrait displays)
    // Expand vertical FOV & step back camera Z distance so entire scene fits seamlessly without side cropping
    camera.fov = Math.min(74, Math.max(50, 50 + (1.0 - aspect) * 34));
    camera.position.set(0, 5.2 + (1.0 - aspect) * 0.9, 13.2 + (1.0 - aspect) * 5.2);
  } else if (aspect < 1.4) {
    // Tablet / Square Window Format
    camera.fov = 53;
    camera.position.set(0, 5.2, 14.0);
  } else {
    // PC Desktop Widescreen Format (16:9, 16:10, Ultrawide)
    camera.fov = 50;
    camera.position.set(0, 5.2, 13.2);
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  // 2. Responsive Cake Scaling for PC & Mobile
  if (cakeGroup) {
    let scaleFactor = 0.68; // Desktop PC format
    if (width < 640 || aspect < 0.8) {
      scaleFactor = 0.46; // Mobile format
    } else if (width < 1024 || aspect < 1.2) {
      scaleFactor = 0.58; // Tablet format
    }
    cakeGroup.scale.setScalar(scaleFactor);
  }
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateResponsiveCameraAndCakeScale();
}

// ==========================================
// 2. LUXURY 3-TIER 3D BIRTHDAY CAKE
// ==========================================
function createCake() {
  if (cakeGroup) {
    scene.remove(cakeGroup);
  }
  cakeGroup = new THREE.Group();
  const theme = CAKE_THEMES[activeThemeIndex];

  // Initialize Theme Materials
  themeMaterials = {
    bottomTier: new THREE.MeshPhysicalMaterial({
      color: theme.bottom,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    }),
    middleTier: new THREE.MeshPhysicalMaterial({
      color: theme.middle,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    }),
    topTier: new THREE.MeshPhysicalMaterial({
      color: theme.top,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: theme.accent,
      roughness: 0.15,
      metalness: 0.85,
    }),
    drip: new THREE.MeshPhysicalMaterial({
      color: theme.drip,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
    }),
    piping: new THREE.MeshPhysicalMaterial({
      color: theme.piping,
      roughness: 0.2,
      metalness: 0.02,
      clearcoat: 0.6,
    }),
    pearl: new THREE.MeshPhysicalMaterial({
      color: theme.pearl,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
    }),
    flower: new THREE.MeshStandardMaterial({
      color: theme.flower,
      roughness: 0.35,
      metalness: 0.05,
    }),
    stand: new THREE.MeshStandardMaterial({
      color: theme.stand,
      roughness: 0.2,
      metalness: 0.2,
    }),
    leaf: new THREE.MeshStandardMaterial({
      color: 0x86efac,
      roughness: 0.4,
    })
  };

  // Populate legacy array for backward compatibility
  tierMaterials = [
    themeMaterials.bottomTier,
    themeMaterials.middleTier,
    themeMaterials.drip,
    themeMaterials.topTier
  ];

  // ------------------------------------------
  // A. ELEGANT CAKE STAND / PLATTER
  // ------------------------------------------
  const standGroup = new THREE.Group();

  // Base Ring & Platter Foot
  const standBaseGeom = new THREE.CylinderGeometry(2.6, 3.2, 0.3, 64);
  const standBase = new THREE.Mesh(standBaseGeom, themeMaterials.stand);
  standBase.position.y = 0.15;
  standBase.receiveShadow = true;
  standGroup.add(standBase);

  // Gold Base Trim Ring
  const baseTrimGeom = new THREE.TorusGeometry(3.21, 0.05, 16, 64);
  const baseTrim = new THREE.Mesh(baseTrimGeom, themeMaterials.accent);
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.position.y = 0.05;
  standGroup.add(baseTrim);

  // Decorative Stem Node
  const standStemGeom = new THREE.CylinderGeometry(0.55, 0.85, 0.6, 32);
  const standStem = new THREE.Mesh(standStemGeom, themeMaterials.stand);
  standStem.position.y = 0.6;
  standStem.castShadow = true;
  standGroup.add(standStem);

  const stemOrbGeom = new THREE.TorusGeometry(0.72, 0.1, 16, 32);
  const stemOrb = new THREE.Mesh(stemOrbGeom, themeMaterials.accent);
  stemOrb.rotation.x = Math.PI / 2;
  stemOrb.position.y = 0.6;
  standGroup.add(stemOrb);

  // Platter Plate
  const standTopGeom = new THREE.CylinderGeometry(3.4, 3.4, 0.25, 64);
  const standTop = new THREE.Mesh(standTopGeom, themeMaterials.stand);
  standTop.position.y = 0.95;
  standTop.castShadow = true;
  standTop.receiveShadow = true;
  standGroup.add(standTop);

  // Gold Platter Rim Edge
  const platterRimGeom = new THREE.TorusGeometry(3.41, 0.06, 16, 64);
  const platterRim = new THREE.Mesh(platterRimGeom, themeMaterials.accent);
  platterRim.rotation.x = Math.PI / 2;
  platterRim.position.y = 0.95;
  standGroup.add(platterRim);

  cakeGroup.add(standGroup);

  // ------------------------------------------
  // B. TIER 1 (BOTTOM TIER) - Pastel Rose Pink
  // ------------------------------------------
  const tier1Group = new THREE.Group();
  const t1Radius = 2.5;
  const t1Height = 1.35;
  const t1Y = 1.75;

  // Main Cylinder
  const tier1Geom = new THREE.CylinderGeometry(t1Radius, t1Radius, t1Height, 64);
  const tier1 = new THREE.Mesh(tier1Geom, themeMaterials.bottomTier);
  tier1.position.y = t1Y;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  tier1Group.add(tier1);

  // Smooth Bevel Rings for Rounded Fondant Edges
  const t1TopBevel = new THREE.Mesh(new THREE.TorusGeometry(t1Radius - 0.06, 0.06, 16, 64), themeMaterials.bottomTier);
  t1TopBevel.rotation.x = Math.PI / 2;
  t1TopBevel.position.y = t1Y + t1Height / 2;
  tier1Group.add(t1TopBevel);

  const t1BotBevel = new THREE.Mesh(new THREE.TorusGeometry(t1Radius - 0.06, 0.06, 16, 64), themeMaterials.bottomTier);
  t1BotBevel.rotation.x = Math.PI / 2;
  t1BotBevel.position.y = t1Y - t1Height / 2;
  tier1Group.add(t1BotBevel);

  // Bottom Pearl Border (36 Edible Pearls around base)
  createPearlBorder(tier1Group, t1Radius + 0.02, t1Y - t1Height / 2 + 0.08, 36, themeMaterials.pearl);

  // Cream Piping around Tier 1 Top Rim
  createPipingBorder(tier1Group, t1Radius, t1Y + t1Height / 2, 32, themeMaterials.piping);

  // Side Sugar Flowers on Tier 1
  createFlowerClusters(tier1Group, t1Radius + 0.03, t1Y, 6, themeMaterials);

  cakeGroup.add(tier1Group);

  // ------------------------------------------
  // C. TIER 2 (MIDDLE TIER) - Silky Cream White
  // ------------------------------------------
  const tier2Group = new THREE.Group();
  const t2Radius = 1.8;
  const t2Height = 1.1;
  const t2Y = 2.95;

  // Main Cylinder
  const tier2Geom = new THREE.CylinderGeometry(t2Radius, t2Radius, t2Height, 64);
  const tier2 = new THREE.Mesh(tier2Geom, themeMaterials.middleTier);
  tier2.position.y = t2Y;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  tier2Group.add(tier2);

  // Bevel Edge Rings
  const t2TopBevel = new THREE.Mesh(new THREE.TorusGeometry(t2Radius - 0.05, 0.05, 16, 64), themeMaterials.middleTier);
  t2TopBevel.rotation.x = Math.PI / 2;
  t2TopBevel.position.y = t2Y + t2Height / 2;
  tier2Group.add(t2TopBevel);

  const t2BotBevel = new THREE.Mesh(new THREE.TorusGeometry(t2Radius - 0.05, 0.05, 16, 64), themeMaterials.middleTier);
  t2BotBevel.rotation.x = Math.PI / 2;
  t2BotBevel.position.y = t2Y - t2Height / 2;
  tier2Group.add(t2BotBevel);

  // Base Cream Piping Rim
  createPipingBorder(tier2Group, t2Radius, t2Y - t2Height / 2 + 0.04, 28, themeMaterials.piping);

  // Glossy Cream Dripping Frosting on Tier 2
  createDripFrosting(tier2Group, t2Radius, t2Y + t2Height / 2, themeMaterials.drip);

  // Decorative Gold Stud Dots around Tier 2 middle
  createGoldDecorations(tier2Group, t2Radius + 0.02, t2Y - 0.1, 16, themeMaterials.accent);

  cakeGroup.add(tier2Group);

  // ------------------------------------------
  // D. TIER 3 (TOP TIER) - Blush Pink
  // ------------------------------------------
  const tier3Group = new THREE.Group();
  const t3Radius = 1.15;
  const t3Height = 0.9;
  const t3Y = 3.95;

  // Main Cylinder
  const tier3Geom = new THREE.CylinderGeometry(t3Radius, t3Radius, t3Height, 64);
  const tier3 = new THREE.Mesh(tier3Geom, themeMaterials.topTier);
  tier3.position.y = t3Y;
  tier3.castShadow = true;
  tier3.receiveShadow = true;
  tier3Group.add(tier3);

  // Bevel Edge Rings
  const t3TopBevel = new THREE.Mesh(new THREE.TorusGeometry(t3Radius - 0.04, 0.04, 16, 64), themeMaterials.topTier);
  t3TopBevel.rotation.x = Math.PI / 2;
  t3TopBevel.position.y = t3Y + t3Height / 2;
  tier3Group.add(t3TopBevel);

  const t3BotBevel = new THREE.Mesh(new THREE.TorusGeometry(t3Radius - 0.04, 0.04, 16, 64), themeMaterials.topTier);
  t3BotBevel.rotation.x = Math.PI / 2;
  t3BotBevel.position.y = t3Y - t3Height / 2;
  tier3Group.add(t3BotBevel);

  // Base Cream Piping Rim
  createPipingBorder(tier3Group, t3Radius, t3Y - t3Height / 2 + 0.04, 20, themeMaterials.piping);

  // Top Surface Cream Frosting Swirls & Mini Sugar Flowers
  createTopSwirlsAndFlowers(tier3Group, t3Radius, t3Y + t3Height / 2, themeMaterials);

  cakeGroup.add(tier3Group);

  // ------------------------------------------
  // E. PURELY DECORATIVE 3D GOLDEN CROWN TOPPER (NO TEXT AT ALL!)
  // ------------------------------------------
  topperGroup = createDecorativeTopper(t3Y + t3Height / 2, themeMaterials.accent);
  cakeGroup.add(topperGroup);

  // ------------------------------------------
  // F. CANDLES & FLAMES (6 Glowing Candles)
  // ------------------------------------------
  createCandles(6, 0.65, t3Y + t3Height / 2);

  // Scaled down with responsive bounds for PC and Mobile formats
  updateResponsiveCameraAndCakeScale();

  scene.add(cakeGroup);
}

// ==========================================
// 3. CAKE DECORATION HELPER FUNCTIONS
// ==========================================

// Helper: Pearl Border Ring
function createPearlBorder(parentGroup, radius, yPos, count, pearlMaterial) {
  const pearlGeom = new THREE.SphereGeometry(0.075, 16, 16);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const pearl = new THREE.Mesh(pearlGeom, pearlMaterial);
    pearl.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    pearl.castShadow = true;
    parentGroup.add(pearl);
  }
}

// Helper: Elegant Cream Piping Border (Swirled bulbs)
function createPipingBorder(parentGroup, radius, yPos, count, pipingMaterial) {
  const bulbGeom = new THREE.SphereGeometry(0.065, 12, 12);
  bulbGeom.scale(1.2, 0.8, 1.2);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const bulb = new THREE.Mesh(bulbGeom, pipingMaterial);
    bulb.position.set(Math.cos(angle) * (radius + 0.02), yPos, Math.sin(angle) * (radius + 0.02));
    bulb.rotation.y = -angle;
    bulb.castShadow = true;
    parentGroup.add(bulb);
  }
}

// Helper: Sugar Flowers & Leaves
function createFlowerMesh(materials) {
  const flowerGroup = new THREE.Group();

  // 5 Petals
  const petalGeom = new THREE.SphereGeometry(0.06, 12, 12);
  petalGeom.scale(1.5, 0.35, 1.0);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeom, materials.flower);
    petal.position.set(Math.cos(angle) * 0.07, 0, Math.sin(angle) * 0.07);
    petal.rotation.y = -angle;
    petal.rotation.z = 0.15; // Soft upward tilt
    flowerGroup.add(petal);
  }

  // Golden Bead Center
  const centerGeom = new THREE.SphereGeometry(0.038, 12, 12);
  const center = new THREE.Mesh(centerGeom, materials.accent);
  center.position.y = 0.02;
  flowerGroup.add(center);

  // 2 Green Sugar Leaves
  const leafGeom = new THREE.SphereGeometry(0.05, 10, 10);
  leafGeom.scale(2.0, 0.25, 0.6);
  const leaf1 = new THREE.Mesh(leafGeom, materials.leaf);
  leaf1.position.set(0.1, -0.01, 0.05);
  leaf1.rotation.y = 0.4;
  flowerGroup.add(leaf1);

  const leaf2 = new THREE.Mesh(leafGeom, materials.leaf);
  leaf2.position.set(-0.1, -0.01, -0.05);
  leaf2.rotation.y = -2.2;
  flowerGroup.add(leaf2);

  return flowerGroup;
}

// Helper: Sugar Flower Clusters around Tier 1
function createFlowerClusters(parentGroup, radius, yPos, count, materials) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.2;
    const flower = createFlowerMesh(materials);
    flower.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    flower.rotation.y = -angle + Math.PI / 2;
    flower.rotation.x = 0.2; // Angle slightly on tier surface
    flower.scale.setScalar(1.2);
    parentGroup.add(flower);
  }
}

// Helper: Glossy Cream Dripping Frosting on Middle Tier
function createDripFrosting(parentGroup, radius, yPos, dripMaterial) {
  const dripGroup = new THREE.Group();

  // Top Ring Cap
  const capGeom = new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 0.05, 64);
  const cap = new THREE.Mesh(capGeom, dripMaterial);
  cap.position.y = yPos;
  dripGroup.add(cap);

  // Smooth Edge Torus Ring
  const ringGeom = new THREE.TorusGeometry(radius + 0.01, 0.05, 16, 64);
  const ring = new THREE.Mesh(ringGeom, dripMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = yPos;
  dripGroup.add(ring);

  // 18 Individual Teardrop Drips around circumference
  const dripCount = 18;
  for (let i = 0; i < dripCount; i++) {
    const angle = (i / dripCount) * Math.PI * 2;
    // Varying drip lengths
    const dripLen = 0.2 + Math.sin(i * 2.7) * 0.15 + (i % 2 === 0 ? 0.1 : 0.0);

    const dripStemGeom = new THREE.CylinderGeometry(0.04, 0.045, dripLen, 12);
    const dripStem = new THREE.Mesh(dripStemGeom, dripMaterial);

    const x = Math.cos(angle) * (radius + 0.02);
    const z = Math.sin(angle) * (radius + 0.02);

    dripStem.position.set(x, yPos - dripLen / 2, z);
    dripGroup.add(dripStem);

    // Rounded Tip Drop
    const tipGeom = new THREE.SphereGeometry(0.048, 12, 12);
    const tip = new THREE.Mesh(tipGeom, dripMaterial);
    tip.position.set(x, yPos - dripLen, z);
    dripGroup.add(tip);
  }

  parentGroup.add(dripGroup);
}

// Helper: Gold Stud Decorations
function createGoldDecorations(parentGroup, radius, yPos, count, accentMaterial) {
  const studGeom = new THREE.SphereGeometry(0.045, 12, 12);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.1;
    const stud = new THREE.Mesh(studGeom, accentMaterial);
    stud.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    stud.castShadow = true;
    parentGroup.add(stud);
  }
}

// Helper: Top Frosting Swirls & Mini Sugar Flowers
function createTopSwirlsAndFlowers(parentGroup, radius, yPos, materials) {
  const count = 8;
  const swirlGeom = new THREE.SphereGeometry(0.09, 14, 14);
  swirlGeom.scale(1, 1.4, 1);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const swirlR = radius * 0.75;
    const x = Math.cos(angle) * swirlR;
    const z = Math.sin(angle) * swirlR;

    // Cream Frosting Rosette Swirl
    const swirl = new THREE.Mesh(swirlGeom, materials.piping);
    swirl.position.set(x, yPos + 0.08, z);
    swirl.castShadow = true;
    parentGroup.add(swirl);

    // Mini Flower between every two swirls
    if (i % 2 === 0) {
      const flowerAngle = angle + (Math.PI / count);
      const miniFlower = createFlowerMesh(materials);
      miniFlower.scale.setScalar(0.7);
      miniFlower.position.set(Math.cos(flowerAngle) * swirlR, yPos + 0.04, Math.sin(flowerAngle) * swirlR);
      miniFlower.rotation.x = -Math.PI / 2; // Flat on top surface
      parentGroup.add(miniFlower);
    }
  }
}

// Helper: Purely Decorative Golden Crown Topper (ZERO TEXT!)
function createDecorativeTopper(yPos, accentMaterial) {
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, yPos, 0);

  // Golden Stem Support Rod
  const stemGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 16);
  const stem = new THREE.Mesh(stemGeom, accentMaterial);
  stem.position.y = 0.325;
  stem.castShadow = true;
  crownGroup.add(stem);

  // Crown Base Ring
  const crownBaseY = 0.65;
  const crownBaseGeom = new THREE.TorusGeometry(0.38, 0.035, 16, 32);
  const crownBase = new THREE.Mesh(crownBaseGeom, accentMaterial);
  crownBase.rotation.x = Math.PI / 2;
  crownBase.position.y = crownBaseY;
  crownBase.castShadow = true;
  crownGroup.add(crownBase);

  // 5 Golden Crown Tiara Arches
  const peakCount = 5;
  const pearlGeom = new THREE.SphereGeometry(0.045, 16, 16);

  for (let i = 0; i < peakCount; i++) {
    const angle = (i / peakCount) * Math.PI * 2;

    // Curved Arch Peak
    const archGeom = new THREE.TorusGeometry(0.18, 0.022, 12, 24, Math.PI);
    const arch = new THREE.Mesh(archGeom, accentMaterial);
    arch.position.set(Math.cos(angle) * 0.35, crownBaseY + 0.15, Math.sin(angle) * 0.35);
    arch.rotation.y = -angle + Math.PI / 2;
    arch.rotation.x = 0.2; // Slight outward flare
    crownGroup.add(arch);

    // Gold Pearl Tip on Peak
    const pearl = new THREE.Mesh(pearlGeom, accentMaterial);
    pearl.position.set(Math.cos(angle) * 0.36, crownBaseY + 0.32, Math.sin(angle) * 0.36);
    pearl.castShadow = true;
    crownGroup.add(pearl);
  }

  // Central Glowing Golden 3D Star Emblem in Crown Center
  const starGeom = new THREE.OctahedronGeometry(0.15, 0);
  const star = new THREE.Mesh(starGeom, accentMaterial);
  star.position.y = crownBaseY + 0.18;
  star.rotation.y = Math.PI / 4;
  star.castShadow = true;
  crownGroup.add(star);

  return crownGroup;
}

// Helper: 6 Glowing Candles with Realistic Flames & Point Lights
function createCandles(count, radius, baseY) {
  candleFlames = [];
  candleLights = [];

  const candleGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.6, 24);

  // Striped Candle Material
  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xfff0f5,
    roughness: 0.3,
    metalness: 0.05
  });

  // Golden Candle Cup Base Holder
  const cupGeom = new THREE.CylinderGeometry(0.065, 0.05, 0.08, 16);
  const cupMat = themeMaterials.accent;

  // Dark Wick
  const wickGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8);
  const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Golden Cup Holder
    const cup = new THREE.Mesh(cupGeom, cupMat);
    cup.position.set(x, baseY + 0.04, z);
    cup.castShadow = true;
    cakeGroup.add(cup);

    // Candle Body
    const candle = new THREE.Mesh(candleGeom, candleMat);
    candle.position.set(x, baseY + 0.34, z);
    candle.castShadow = true;
    candle.userData = { isFlame: true, candleIndex: i }; // Click raycastable
    cakeGroup.add(candle);

    // Wick
    const wick = new THREE.Mesh(wickGeom, wickMat);
    wick.position.set(x, baseY + 0.67, z);
    cakeGroup.add(wick);

    // Flame Group
    const flameGroup = new THREE.Group();
    flameGroup.position.set(x, baseY + 0.76, z);

    // Outer Warm Glowing Flame
    const flameGeom = new THREE.SphereGeometry(0.065, 16, 16);
    flameGeom.scale(1, 2.3, 1);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flameMesh = new THREE.Mesh(flameGeom, flameMat);
    flameMesh.userData = { isFlame: true, candleIndex: i }; // Click raycastable
    flameGroup.add(flameMesh);

    // Inner White Flame Core
    const innerGeom = new THREE.SphereGeometry(0.032, 12, 12);
    innerGeom.scale(1, 2.0, 1);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    innerMesh.position.y = -0.01;
    innerMesh.userData = { isFlame: true, candleIndex: i };
    flameGroup.add(innerMesh);

    cakeGroup.add(flameGroup);
    candleFlames.push(flameGroup);

    // Candle PointLight for Warm Dynamic Glow (attached inside flameGroup for correct scaled coordinates)
    const pLight = new THREE.PointLight(0xffb044, 1.8, 5, 2);
    pLight.position.set(0, 0.04, 0);
    pLight.castShadow = true;
    flameGroup.add(pLight);
    candleLights.push(pLight);
  }
}

// Update Cake Theme Palette
function updateCakeTheme(themeIndex) {
  activeThemeIndex = themeIndex % CAKE_THEMES.length;
  const theme = CAKE_THEMES[activeThemeIndex];

  if (themeMaterials.bottomTier) themeMaterials.bottomTier.color.setHex(theme.bottom);
  if (themeMaterials.middleTier) themeMaterials.middleTier.color.setHex(theme.middle);
  if (themeMaterials.topTier) themeMaterials.topTier.color.setHex(theme.top);
  if (themeMaterials.accent) themeMaterials.accent.color.setHex(theme.accent);
  if (themeMaterials.drip) themeMaterials.drip.color.setHex(theme.drip);
  if (themeMaterials.piping) themeMaterials.piping.color.setHex(theme.piping);
  if (themeMaterials.flower) themeMaterials.flower.color.setHex(theme.flower);
  if (themeMaterials.pearl) themeMaterials.pearl.color.setHex(theme.pearl);
  if (themeMaterials.stand) themeMaterials.stand.color.setHex(theme.stand);

  // Maintain array for legacy references
  tierMaterials = [
    themeMaterials.bottomTier,
    themeMaterials.middleTier,
    themeMaterials.drip,
    themeMaterials.topTier
  ];
}

// ==========================================
// 4. PARTICLE SYSTEMS (Ambient & Confetti)
// ==========================================
function createAmbientSparkles() {
  const count = 280;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = Math.random() * 18 - 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xfacc15,
    size: 0.14,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });

  ambientSparkles = new THREE.Points(geometry, material);
  scene.add(ambientSparkles);
}

// Create 360-Degree Enclosed White Room Environment with Warm Yellow-Gold Lighting
function createHomeEnvironment() {
  const homeGroup = new THREE.Group();

  // 1. REALISTIC WOODEN PARTY TABLE
  const tableMat = new THREE.MeshPhysicalMaterial({
    color: 0x4e2917, // Warm rich mahogany wood
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
  });

  // Table Top Disk
  const tableGeom = new THREE.CylinderGeometry(5.2, 5.2, 0.35, 64);
  const tableMesh = new THREE.Mesh(tableGeom, tableMat);
  tableMesh.position.y = -0.175;
  tableMesh.receiveShadow = true;
  tableMesh.castShadow = true;
  homeGroup.add(tableMesh);

  // Gold Trim Ring around Table Edge
  const tableRimGeom = new THREE.TorusGeometry(5.21, 0.05, 16, 64);
  const tableRimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.15, metalness: 0.85 });
  const tableRim = new THREE.Mesh(tableRimGeom, tableRimMat);
  tableRim.rotation.x = Math.PI / 2;
  tableRim.position.y = -0.01;
  homeGroup.add(tableRim);

  // Festive Off-White Table Runner
  const runnerMat = new THREE.MeshPhysicalMaterial({
    color: 0xfffcf7,
    roughness: 0.5,
    clearcoat: 0.1,
  });
  const runnerGeom = new THREE.CylinderGeometry(3.6, 3.6, 0.02, 64);
  const runner = new THREE.Mesh(runnerGeom, runnerMat);
  runner.position.y = 0.01;
  runner.receiveShadow = true;
  homeGroup.add(runner);

  // 2. 360-DEGREE ENCLOSED ROMANTIC CINEMATIC ROOM (Dark Rose-Slate Walls & Warm Oak Floor)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x181324, // Romantic dark rose-slate wall
    roughness: 0.82,
    metalness: 0.03,
  });

  const wallGeom = new THREE.PlaneGeometry(32, 20);
  const roomDist = 14;

  // Back Wall
  const backWall = new THREE.Mesh(wallGeom, wallMat);
  backWall.position.set(0, 8, -roomDist);
  backWall.receiveShadow = true;
  homeGroup.add(backWall);

  // Front Wall
  const frontWall = new THREE.Mesh(wallGeom, wallMat);
  frontWall.position.set(0, 8, roomDist);
  frontWall.rotation.y = Math.PI;
  frontWall.receiveShadow = true;
  homeGroup.add(frontWall);

  // Left Wall
  const leftWall = new THREE.Mesh(wallGeom, wallMat);
  leftWall.position.set(-roomDist, 8, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  homeGroup.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(wallGeom, wallMat);
  rightWall.position.set(roomDist, 8, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  homeGroup.add(rightWall);

  // Ceiling
  const ceilingGeom = new THREE.PlaneGeometry(32, 32);
  const ceiling = new THREE.Mesh(ceilingGeom, wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 18, 0);
  ceiling.receiveShadow = true;
  homeGroup.add(ceiling);

  // Warm Dark Mahogany/Oak Floor
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x241a18, // Warm dark oak floor
    roughness: 0.45,
    metalness: 0.05,
  });
  const floorGeom = new THREE.PlaneGeometry(32, 32);
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.35, 0);
  floor.receiveShadow = true;
  homeGroup.add(floor);

  // Gold Wainscoting Molding Trim Rails around 360 Walls
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.8 });
  const trimBoxGeom = new THREE.BoxGeometry(32, 0.12, 0.08);

  const trimBack = new THREE.Mesh(trimBoxGeom, goldTrimMat);
  trimBack.position.set(0, 3.5, -roomDist + 0.05);
  homeGroup.add(trimBack);

  const trimFront = new THREE.Mesh(trimBoxGeom, goldTrimMat);
  trimFront.position.set(0, 3.5, roomDist - 0.05);
  homeGroup.add(trimFront);

  const trimLeft = new THREE.Mesh(trimBoxGeom, goldTrimMat);
  trimLeft.rotation.y = Math.PI / 2;
  trimLeft.position.set(-roomDist + 0.05, 3.5, 0);
  homeGroup.add(trimLeft);

  const trimRight = new THREE.Mesh(trimBoxGeom, goldTrimMat);
  trimRight.rotation.y = Math.PI / 2;
  trimRight.position.set(roomDist - 0.05, 3.5, 0);
  homeGroup.add(trimRight);

  // 3. 360-DEGREE HANGING YELLOW-GOLD FAIRY LIGHT GARLANDS
  fairyBulbs = [];
  const bulbGeom = new THREE.SphereGeometry(0.1, 16, 16);

  const wallCurves = [
    // Back Wall Curve
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-13, 11, -13.5),
      new THREE.Vector3(-6.5, 8.5, -13.5),
      new THREE.Vector3(0, 9.5, -13.5),
      new THREE.Vector3(6.5, 8.2, -13.5),
      new THREE.Vector3(13, 11, -13.5),
    ]),
    // Right Wall Curve
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(13.5, 11, -13),
      new THREE.Vector3(13.5, 8.5, -6.5),
      new THREE.Vector3(13.5, 9.5, 0),
      new THREE.Vector3(13.5, 8.2, 6.5),
      new THREE.Vector3(13.5, 11, 13),
    ]),
    // Front Wall Curve
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(13, 11, 13.5),
      new THREE.Vector3(6.5, 8.5, 13.5),
      new THREE.Vector3(0, 9.5, 13.5),
      new THREE.Vector3(-6.5, 8.2, 13.5),
      new THREE.Vector3(-13, 11, 13.5),
    ]),
    // Left Wall Curve
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-13.5, 11, 13),
      new THREE.Vector3(-13.5, 8.5, 6.5),
      new THREE.Vector3(-13.5, 9.5, 0),
      new THREE.Vector3(-13.5, 8.2, -6.5),
      new THREE.Vector3(-13.5, 11, -13),
    ]),
  ];

  const stringMat = new THREE.MeshBasicMaterial({ color: 0x554422 });

  wallCurves.forEach((curve) => {
    const stringGeom = new THREE.TubeGeometry(curve, 48, 0.025, 8, false);
    const stringMesh = new THREE.Mesh(stringGeom, stringMat);
    homeGroup.add(stringMesh);

    const count = 22;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const pos = curve.getPoint(t);

      const bulbMatInstance = new THREE.MeshStandardMaterial({
        color: 0xffe082,
        emissive: 0xffb300,
        emissiveIntensity: 0.95,
        roughness: 0.1,
      });

      const bulb = new THREE.Mesh(bulbGeom, bulbMatInstance);
      bulb.position.copy(pos);
      homeGroup.add(bulb);

      if (i % 6 === 0) {
        const pLight = new THREE.PointLight(0xffa500, 0.65, 8);
        pLight.position.copy(pos);
        homeGroup.add(pLight);
      }

      fairyBulbs.push({ mesh: bulb, baseEmissive: 0.85 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2 });
    }
  });

  // 4. GOLDEN WALL SCONCES & PARTY BALLOONS
  const sconcePositions = [
    { x: -13.8, y: 7.5, z: 0 },
    { x: 13.8, y: 7.5, z: 0 },
    { x: 0, y: 7.5, z: -13.8 },
  ];

  const sconceGeom = new THREE.SphereGeometry(0.3, 16, 16);
  const baseSconceMat = new THREE.MeshStandardMaterial({
    color: 0xffea00,
    emissive: 0xffaa00,
    emissiveIntensity: 1.0,
  });

  sconcePositions.forEach((sp) => {
    // Clone material per sconce so we can disable the center one separately
    const sconceMat = baseSconceMat.clone();
    // If this is the center back-wall sconce, disable its visible emissive glow
    const isCenterBack = (Math.abs(sp.x) < 0.1 && Math.abs(sp.z + 13.8) < 0.01);
    if (isCenterBack) {
      sconceMat.emissiveIntensity = 0.0;
      sconceMat.emissive = new THREE.Color(0x000000);
    }

    const sconce = new THREE.Mesh(sconceGeom, sconceMat);
    sconce.position.set(sp.x, sp.y, sp.z);
    homeGroup.add(sconce);

    // Add point light for sconces, but disable intensity for the center back one
    const sLight = new THREE.PointLight(0xffb700, isCenterBack ? 0.0 : 1.1, 12);
    sLight.position.set(sp.x, sp.y, sp.z);
    homeGroup.add(sLight);
  });

  // Room Balloons in 360 corners
  const balloonColors = [0xff4b8b, 0xfacc15, 0x8b5cf6, 0x06b6d4, 0xf43f5e, 0xfbbf24];
  const balloonPositions = [
    { x: -9.5, y: 4.5, z: -9 },
    { x: -10.5, y: 6.0, z: -10 },
    { x: 9.5, y: 4.8, z: -9 },
    { x: 10.5, y: 6.2, z: -10 },
    { x: -9.5, y: 4.5, z: 9 },
    { x: 9.5, y: 4.8, z: 9 },
  ];

  roomBalloons = [];
  balloonPositions.forEach((p, idx) => {
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(p.x, p.y, p.z);

    const bMat = new THREE.MeshPhysicalMaterial({
      color: balloonColors[idx % balloonColors.length],
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
    });

    const bGeom = new THREE.SphereGeometry(0.65, 32, 32);
    bGeom.scale(1.0, 1.25, 1.0);
    const balloon = new THREE.Mesh(bGeom, bMat);
    balloon.castShadow = true;
    balloonGroup.add(balloon);

    const knotGeom = new THREE.ConeGeometry(0.08, 0.12, 12);
    const knot = new THREE.Mesh(knotGeom, bMat);
    knot.position.y = -0.82;
    balloonGroup.add(knot);

    const stringLineGeom = new THREE.CylinderGeometry(0.005, 0.005, 2.5, 8);
    const stringLineMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const stringLine = new THREE.Mesh(stringLineGeom, stringLineMat);
    stringLine.position.y = -2.0;
    balloonGroup.add(stringLine);

    homeGroup.add(balloonGroup);
    roomBalloons.push({ group: balloonGroup, initialY: p.y, speed: 1.0 + (idx % 3) * 0.4, phase: idx * 1.2 });
  });

  // 5. 3D PICTURE FRAME GALLERY WALL ON BACK WALL
  createWallFrameGallery(homeGroup);

  scene.add(homeGroup);
}

// Trigger 3D Explosive Confetti Particles
function trigger3DConfetti() {
  const count = 220;
  const geom = new THREE.PlaneGeometry(0.12, 0.2);
  const colors = [0xff4b8b, 0xfbbf24, 0x06b6d4, 0x8b5cf6, 0x10b981, 0xffffff];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geom, mat);

    // Spawn at cake top center
    mesh.position.set((Math.random() - 0.5) * 0.6, 4.2, (Math.random() - 0.5) * 0.6);

    // Velocity vectors outward in an explosive upward cone
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45;
    const speed = 0.16 + Math.random() * 0.28;

    const vx = Math.sin(phi) * Math.cos(theta) * speed;
    const vy = Math.cos(phi) * speed + 0.12;
    const vz = Math.sin(phi) * Math.sin(theta) * speed;

    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    scene.add(mesh);

    confettiExplosionParticles.push({
      mesh: mesh,
      vx: vx,
      vy: vy,
      vz: vz,
      rx: (Math.random() - 0.5) * 0.25,
      ry: (Math.random() - 0.5) * 0.25,
      life: 1.0,
    });
  }
}

// Create Smoke Puff when candles are blown
function triggerSmokeEffect() {
  const count = 35;
  const smokeGeom = new THREE.SphereGeometry(0.09, 12, 12);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.55,
  });

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(smokeGeom, smokeMat.clone());
    mesh.position.set((Math.random() - 0.5) * 1.3, 4.8, (Math.random() - 0.5) * 1.3);
    scene.add(mesh);

    smokeParticles.push({
      mesh: mesh,
      vy: 0.025 + Math.random() * 0.035,
      vx: (Math.random() - 0.5) * 0.012,
      vz: (Math.random() - 0.5) * 0.012,
      scaleSpeed: 0.022,
      opacitySpeed: 0.014,
    });
  }
}

// ==========================================
// 5. WEB AUDIO SYNTHESIZER (Happy Birthday Melody)
// ==========================================
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play Tone with Envelope
function playSynthNote(freq, duration, type = 'triangle', volume = 0.2) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback issue:', e);
  }
}

// Play Happy Birthday Melody Sequence
function playHappyBirthdaySong() {
  stopHappyBirthdaySong();
  isPlayingMusic = true;
  updateMusicUI(true);

  // Frequencies (Hz) for Happy Birthday
  const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, C5 = 523.25;

  const notes = [
    { f: C4, d: 0.35 }, { f: C4, d: 0.2 }, { f: D4, d: 0.5 }, { f: C4, d: 0.5 }, { f: F4, d: 0.5 }, { f: E4, d: 0.8 },
    { f: C4, d: 0.35 }, { f: C4, d: 0.2 }, { f: D4, d: 0.5 }, { f: C4, d: 0.5 }, { f: G4, d: 0.5 }, { f: F4, d: 0.8 },
    { f: C4, d: 0.35 }, { f: C4, d: 0.2 }, { f: C5, d: 0.5 }, { f: A4, d: 0.5 }, { f: F4, d: 0.5 }, { f: E4, d: 0.5 }, { f: D4, d: 0.8 },
    { f: Bb4, d: 0.35 }, { f: Bb4, d: 0.2 }, { f: A4, d: 0.5 }, { f: F4, d: 0.5 }, { f: G4, d: 0.5 }, { f: F4, d: 1.0 }
  ];

  let step = 0;
  function scheduleNextNote() {
    if (!isPlayingMusic) return;
    if (step >= notes.length) {
      step = 0; // Loop song
    }
    const current = notes[step];
    playSynthNote(current.f, current.d * 1.2, 'triangle', 0.25);

    step++;
    melodyTimeoutId = setTimeout(scheduleNextNote, current.d * 1000);
  }

  scheduleNextNote();
}

function stopHappyBirthdaySong() {
  isPlayingMusic = false;
  if (melodyTimeoutId) clearTimeout(melodyTimeoutId);
  updateMusicUI(false);
}

// Celebration Chime Effect
function playCelebrateChime() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playSynthNote(freq, 0.4, 'sine', 0.3);
    }, idx * 100);
  });
}

// Candle Blow Sound Effect (Filtered Noise)
function playBlowSound() {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.5; // 0.5s noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
  } catch (e) {
    console.warn(e);
  }
}

// ==========================================
// 4B. 3D PICTURE FRAME GALLERY WALL & PHOTO UPLOADER
// ==========================================
function createEmptyCanvasTexture(w, h, label = 'Empty Frame') {
  const canvas = document.createElement('canvas');
  const aspect = w / h;
  canvas.width = aspect >= 1 ? 600 : Math.round(600 * aspect);
  canvas.height = aspect >= 1 ? Math.round(600 / aspect) : 600;

  const ctx = canvas.getContext('2d');

  // Fine linen / warm off-white canvas surface
  ctx.fillStyle = '#f7f4ed';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle linen texture grain
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  for (let i = 0; i < 500; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Elegant golden inner border line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.008));
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  // Center minimal photo icon & text
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 12;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - 30, cy - 22, 60, 44, 8);
  } else {
    ctx.rect(cx - 30, cy - 22, 60, 44);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy - 2, 12, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;
  if (typeof renderer !== 'undefined' && renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  texture.needsUpdate = true;
  return texture;
}

function createBirthdayWallSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // 1. Soft Rose-Gold vertical ambient glow pillars behind text
  const pillarWidth = 64;
  const pillarGap = 34;
  const totalPillars = 5;
  const startX = cx - ((totalPillars * pillarWidth + (totalPillars - 1) * pillarGap) / 2);

  for (let i = 0; i < totalPillars; i++) {
    const px = startX + i * (pillarWidth + pillarGap);
    const grad = ctx.createLinearGradient(0, 50, 0, canvas.height - 50);
    grad.addColorStop(0, 'rgba(255, 75, 139, 0)');
    grad.addColorStop(0.25, 'rgba(255, 75, 139, 0.22)');
    grad.addColorStop(0.75, 'rgba(255, 75, 139, 0.22)');
    grad.addColorStop(1, 'rgba(255, 75, 139, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(px, 50, pillarWidth, canvas.height - 100);
  }

  // 2. Large Bold Pink Metallic Serif Text: "BIRTHDAY"
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const brightPinkGrad = ctx.createLinearGradient(0, cy - 110, 0, cy + 110);
  brightPinkGrad.addColorStop(0, '#ffffff');
  brightPinkGrad.addColorStop(0.18, '#ffdaf0');
  brightPinkGrad.addColorStop(0.42, '#ff4b8b');
  brightPinkGrad.addColorStop(0.75, '#ff1493');
  brightPinkGrad.addColorStop(1, '#c70067');

  ctx.shadowColor = 'rgba(255, 20, 147, 0.7)';
  ctx.shadowBlur = 14;

  ctx.font = '700 160px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.fillStyle = brightPinkGrad;
  ctx.letterSpacing = '18px';
  ctx.fillText('BIRTHDAY', cx, cy - 20);

  // 3. Special Visual Emphasis on "LUSUU" in Rose-Gold & Gold Metallic Serif
  const lusuuGrad = ctx.createLinearGradient(cx - 300, cy + 160, cx + 300, cy + 160);
  lusuuGrad.addColorStop(0, '#ffffff');
  lusuuGrad.addColorStop(0.25, '#ffe4b5');
  lusuuGrad.addColorStop(0.50, '#fbbf24');
  lusuuGrad.addColorStop(0.75, '#ff69b4');
  lusuuGrad.addColorStop(1, '#f59e0b');

  ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
  ctx.shadowBlur = 16;

  ctx.font = '800 125px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.fillStyle = lusuuGrad;
  ctx.letterSpacing = '28px';
  ctx.fillText('LUSUU', cx, cy + 160);

  // 4. Elegant Overlaid Cursive Script: "Happy"
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 12;

  const scriptGrad = ctx.createLinearGradient(cx - 400, cy - 160, cx + 150, cy);
  scriptGrad.addColorStop(0, '#ffffff');
  scriptGrad.addColorStop(1, '#ffe4f1');

  ctx.font = '400 215px "Dancing Script", "Great Vibes", "Brush Script MT", cursive';
  ctx.fillStyle = scriptGrad;
  ctx.letterSpacing = '0px';
  ctx.fillText('Happy', cx - 250, cy - 115);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const DEFAULT_FRAME_PHOTOS = [
  'photo4.jpg',   // Frame 0: Top Center Left (Portrait)
  'Screenshot 2026-08-14 223703.png',  // Frame 1: Top Center Right (Portrait)
  'photo2.jpg',   // Frame 2: Middle Center (Landscape)
  'IMG_2952.JPG', // Frame 3: Bottom Center Left (Portrait)
  'Screenshot 2026-08-14 223827.png',  // Frame 4: Bottom Center Right (Portrait)
  'photo3.jpg',   // Frame 5: Upper Left (Portrait)
  'photo11.jpeg',  // Frame 6: Lower Left (Portrait)
  'photo5.jpeg',  // Frame 7: Far Left Hanging (Portrait)
  'photo10.jpeg', // Frame 8: Upper Right (Portrait)
  'photo6.jpeg',  // Frame 9: Lower Right (Portrait)
  'IMG_0027.JPG', // Frame 10: Far Right (Portrait)
];

function createWallFrameGallery(homeGroup) {
  wallFrames = [];

  // Frame gallery configuration matching user reference photo layout
  const frameConfigs = [
    // Center Column - Top Row (2 Vertical / Portrait frames split)
    { id: 0, x: -0.95, y: 11.6, w: 1.5, h: 2.2, label: 'Top Center Left' },
    { id: 1, x: 0.95, y: 11.6, w: 1.5, h: 2.2, label: 'Top Center Right' },

    // Center Column - Middle Row (1 Horizontal / Landscape frame)
    { id: 2, x: 0, y: 9.0, w: 3.4, h: 2.2, label: 'Middle Center' },

    // Center Column - Bottom Row (2 Vertical / Portrait frames split)
    { id: 3, x: -0.95, y: 6.4, w: 1.5, h: 2.2, label: 'Bottom Center Left' },
    { id: 4, x: 0.95, y: 6.4, w: 1.5, h: 2.2, label: 'Bottom Center Right' },

    // Left-Middle Column (2 Vertical / Portrait frames)
    { id: 5, x: -2.9, y: 10.3, w: 1.8, h: 2.6, label: 'Upper Left' },
    { id: 6, x: -2.9, y: 7.4, w: 1.8, h: 2.6, label: 'Lower Left' },

    // Far-Left Frame
    { id: 7, x: -5.2, y: 8.8, w: 1.8, h: 2.6, label: 'Far Left (Hanging)' },

    // Right-Middle Column (2 Vertical / Portrait frames)
    { id: 8, x: 2.9, y: 10.3, w: 1.8, h: 2.6, label: 'Upper Right' },
    { id: 9, x: 2.9, y: 7.4, w: 1.8, h: 2.6, label: 'Lower Right' },

    // Far-Right Column (1 Vertical / Portrait frame)
    { id: 10, x: 5.2, y: 8.8, w: 1.8, h: 2.6, label: 'Far Right' },
  ];

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xdfb868, // Luxury polished gold frame molding
    roughness: 0.15,
    metalness: 0.85,
  });

  const passPartoutMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Off-white matting border
    roughness: 0.45,
  });

  const goldEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, // Bright polished gold accent edge
    roughness: 0.1,
    metalness: 0.9,
  });

  const roomDist = 14;
  const frameZ = -roomDist + 0.08; // Mounted right in front of back wall

  frameConfigs.forEach((cfg) => {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(cfg.x, cfg.y, frameZ);

    const borderThickness = 0.38;
    const borderDepth = 0.12;
    const outerW = cfg.w + borderThickness;
    const outerH = cfg.h + borderThickness;

    // 1. Outer Dark Wooden Frame Molding
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(outerW, 0.18, borderDepth), frameMat);
    topBar.position.set(0, outerH / 2 - 0.09, 0);
    topBar.castShadow = true;
    frameGroup.add(topBar);

    const botBar = new THREE.Mesh(new THREE.BoxGeometry(outerW, 0.18, borderDepth), frameMat);
    botBar.position.set(0, -outerH / 2 + 0.09, 0);
    botBar.castShadow = true;
    frameGroup.add(botBar);

    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, outerH - 0.36, borderDepth), frameMat);
    leftBar.position.set(-outerW / 2 + 0.09, 0, 0);
    leftBar.castShadow = true;
    frameGroup.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, outerH - 0.36, borderDepth), frameMat);
    rightBar.position.set(outerW / 2 - 0.09, 0, 0);
    rightBar.castShadow = true;
    frameGroup.add(rightBar);

    // Polished Metallic Gold Outer Bevel Border
    const goldRimTop = new THREE.Mesh(new THREE.BoxGeometry(outerW + 0.04, 0.04, borderDepth + 0.02), goldEdgeMat);
    goldRimTop.position.set(0, outerH / 2, 0);
    frameGroup.add(goldRimTop);

    const goldRimBot = new THREE.Mesh(new THREE.BoxGeometry(outerW + 0.04, 0.04, borderDepth + 0.02), goldEdgeMat);
    goldRimBot.position.set(0, -outerH / 2, 0);
    frameGroup.add(goldRimBot);

    const goldRimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, outerH + 0.04, borderDepth + 0.02), goldEdgeMat);
    goldRimLeft.position.set(-outerW / 2, 0, 0);
    frameGroup.add(goldRimLeft);

    const goldRimRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, outerH + 0.04, borderDepth + 0.02), goldEdgeMat);
    goldRimRight.position.set(outerW / 2, 0, 0);
    frameGroup.add(goldRimRight);

    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(outerW, outerH, 0.02), frameMat);
    backPanel.position.set(0, 0, -borderDepth / 2 + 0.01);
    frameGroup.add(backPanel);

    // 2. Off-White Pass-Partout Matting Plate
    const mattingW = cfg.w + 0.12;
    const mattingH = cfg.h + 0.12;
    const mattingPanel = new THREE.Mesh(new THREE.BoxGeometry(mattingW, mattingH, 0.02), passPartoutMat);
    mattingPanel.position.set(0, 0, -0.02);
    frameGroup.add(mattingPanel);

    // 3. Canvas Plane (Empty Photo Frame Canvas)
    const canvasGeom = new THREE.PlaneGeometry(cfg.w, cfg.h);
    const canvasTex = createEmptyCanvasTexture(cfg.w, cfg.h, cfg.label);
    const canvasMat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      roughness: 0.25,
      metalness: 0.02,
      emissive: 0x0b0b0b,
      emissiveIntensity: 0.10,
    });
    const canvasMesh = new THREE.Mesh(canvasGeom, canvasMat);
    canvasMesh.position.set(0, 0, 0.01);
    canvasMesh.receiveShadow = false;
    canvasMesh.castShadow = false;
    // Ensure the canvas photo renders beneath the glass overlay
    canvasMesh.renderOrder = 0;
    frameGroup.add(canvasMesh);

    // 4. Subtle Glass Reflection Layer
    const glassGeom = new THREE.PlaneGeometry(cfg.w, cfg.h);
    // Make the glass overlay fully transparent to remove the bright reflection
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      roughness: 0.02,
      clearcoat: 0.0,
    });
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    glassMesh.position.set(0, 0, 0.02);
    // Make sure glass does not affect underlying photo rendering
    glassMesh.material.depthWrite = false;
    glassMesh.renderOrder = 2;
    // Hide the glass mesh since opacity is zero to avoid any visible reflection artifacts
    glassMesh.visible = false;
    frameGroup.add(glassMesh);



    // Attach raycasting metadata to all sub-meshes of the frame
    frameGroup.traverse((child) => {
      if (child.isMesh) {
        child.userData = { isWallFrame: true, frameIndex: cfg.id };
      }
    });

    homeGroup.add(frameGroup);

    wallFrames.push({
      group: frameGroup,
      config: cfg,
      canvasMesh: canvasMesh,
      canvasMat: canvasMat,
      hasCustomPhoto: false,
      customPhotoUrl: null,
    });

    // Auto-load default image with face-focus alignment
    if (DEFAULT_FRAME_PHOTOS[cfg.id]) {
      applyPhotoToFrame(cfg.id, DEFAULT_FRAME_PHOTOS[cfg.id], false);
    }
  });

  // Elegant "Happy Birthday LUSUU" Wall Sign above frame gallery
  const signTex = createBirthdayWallSignTexture();
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    transparent: true,
    roughness: 0.12,
    metalness: 0.15,
    emissive: 0xff1493,
    emissiveIntensity: 0.85,
    side: THREE.DoubleSide,
  });

  const signW = 10.5;
  const signH = 5.25;
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);
  signMesh.position.set(0, 14.8, frameZ + 0.02);
  homeGroup.add(signMesh);
}

function openFrameModal(frameIndex, direction = null) {
  activeSelectedFrameIndex = frameIndex;
  currentSlideshowIndex = frameIndex;
  const frameData = wallFrames[frameIndex];
  if (!frameData) return;

  const modal = document.getElementById('media-modal');
  const modalIndicator = document.getElementById('modal-indicator');
  const pageLeftContent = document.getElementById('page-left-content');
  const pageRightContent = document.getElementById('page-right-content');

  if (!modal || !pageRightContent) return;

  let srcUrl = '';
  if (frameData.hasCustomPhoto && frameData.customPhotoUrl) {
    srcUrl = frameData.customPhotoUrl;
  } else if (DEFAULT_FRAME_PHOTOS[frameIndex]) {
    srcUrl = DEFAULT_FRAME_PHOTOS[frameIndex];
  } else {
    const canvas = frameData.canvasMat.map ? frameData.canvasMat.map.image : null;
    if (canvas && canvas.toDataURL) {
      srcUrl = canvas.toDataURL();
    }
  }

  if (modalIndicator) {
    modalIndicator.textContent = `Frame ${frameIndex + 1} of ${wallFrames.length}`;
  }

  playPageFlipSound();

  renderLeftPage(pageLeftContent, frameIndex, wallFrames.length);
  renderMediaToBookletContainer(pageRightContent, srcUrl);

  modal.classList.add('modal-active');
  resetAutoSlideshowTimer();
}

function applyPhotoToFrame(frameIndex, imageSrc, refreshModal = false, fitMode = 'cover') {
  const frameData = wallFrames[frameIndex];
  if (!frameData) return;

  const isVideo = imageSrc.toLowerCase().includes('.mp4') || imageSrc.toLowerCase().includes('.webm') || imageSrc.toLowerCase().includes('.mov');

  if (isVideo) {
    if (frameData.videoElement) {
      frameData.videoElement.pause();
      frameData.videoElement.remove();
    }

    const video = document.createElement('video');
    video.src = imageSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true; // Muted on 3D wall frames
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;

    if (frameData.canvasMat.map) {
      frameData.canvasMat.map.dispose();
    }
    frameData.canvasMat.map = texture;
    frameData.canvasMat.emissiveMap = texture;
    frameData.canvasMat.emissive = new THREE.Color(0xffffff);
    frameData.canvasMat.emissiveIntensity = 0.15;
    frameData.canvasMat.needsUpdate = true;

    frameData.hasCustomPhoto = true;
    frameData.customPhotoUrl = imageSrc;
    frameData.videoElement = video;

    video.play().catch(e => console.log('Video autoplay on frame:', e));

    if (refreshModal) {
      openFrameModal(frameIndex);
    }
    return;
  }

  const img = new Image();
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    img.crossOrigin = 'anonymous';
  }
  img.onload = () => {
    const w = frameData.config.w;
    const h = frameData.config.h;
    const aspect = w / h;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const baseWidth = aspect >= 1 ? 800 : Math.round(800 * aspect);
    const baseHeight = aspect >= 1 ? Math.round(800 / aspect) : 800;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(baseWidth * DPR);
    canvas.height = Math.round(baseHeight * DPR);
    canvas.style.width = baseWidth + 'px';
    canvas.style.height = baseHeight + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing for high DPI

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    const imgAspect = img.width / img.height;
    let drawW, drawH, drawX, drawY;

    if (fitMode === 'contain') {
      // Contain mode (fit inside with margin)
      const padding = 8;
      const availW = baseWidth - padding * 2;
      const availH = baseHeight - padding * 2;

      if (imgAspect > (availW / availH)) {
        drawW = availW;
        drawH = availW / imgAspect;
        drawX = padding;
        drawY = (baseHeight - drawH) / 2;
      } else {
        drawH = availH;
        drawW = availH * imgAspect;
        drawX = (baseWidth - drawW) / 2;
        drawY = padding;
      }
    } else {
      // Cover mode (fill frame completely with natural face/center alignment)
      if (imgAspect > aspect) {
        drawH = baseHeight;
        drawW = baseHeight * imgAspect;
        drawX = (baseWidth - drawW) * 0.5;
        drawY = 0;
      } else {
        drawW = baseWidth;
        drawH = baseWidth / imgAspect;
        drawX = 0;
        const excessH = drawH - baseHeight;
        drawY = -excessH * 0.20; // Smart upper focus for portrait faces
      }
    }

    // Natural HD enhancement filter for crisp contrast & natural skin tones
    try {
      ctx.filter = 'brightness(1.05) contrast(1.08) saturate(1.05)';
    } catch (e) {
      ctx.filter = 'none';
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    // Reset filter
    ctx.filter = 'none';

    // Subtle inner border line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, baseWidth - 2, baseHeight - 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    if (typeof renderer !== 'undefined' && renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    texture.needsUpdate = true;

    if (frameData.canvasMat.map) {
      frameData.canvasMat.map.dispose();
    }
    frameData.canvasMat.map = texture;
    frameData.canvasMat.emissiveMap = texture;
    frameData.canvasMat.emissive = new THREE.Color(0xffffff);
    frameData.canvasMat.emissiveIntensity = 0.08;
    frameData.canvasMat.needsUpdate = true;

    frameData.hasCustomPhoto = true;
    frameData.customPhotoUrl = imageSrc;
    frameData.fitMode = fitMode;

    if (refreshModal) {
      openFrameModal(frameIndex);
    }
  };
  img.onerror = (err) => {
    console.warn(`Could not load frame photo: ${imageSrc}`, err);
  };
  img.src = imageSrc;
}

function resetFrameToEmpty(frameIndex) {
  const frameData = wallFrames[frameIndex];
  if (!frameData) return;

  const emptyTex = createEmptyCanvasTexture(frameData.config.w, frameData.config.h, frameData.config.label);
  if (frameData.canvasMat.map) {
    frameData.canvasMat.map.dispose();
  }
  frameData.canvasMat.map = emptyTex;
  frameData.canvasMat.needsUpdate = true;

  frameData.hasCustomPhoto = false;
  frameData.customPhotoUrl = null;

  openFrameModal(frameIndex);
}

// ==========================================
// 6. RAYCASTING INTERACTION
// ==========================================
function onCanvasClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const obj = intersects[i].object;

    // Check Candle Flames
    if (obj.userData && obj.userData.isFlame) {
      toggleCandlesState();
      break;
    }

    // Check Wall Frames
    let frameObj = obj;
    while (frameObj && (!frameObj.userData || frameObj.userData.frameIndex === undefined)) {
      frameObj = frameObj.parent;
    }
    if (frameObj && frameObj.userData && frameObj.userData.frameIndex !== undefined) {
      openFrameModal(frameObj.userData.frameIndex);
      break;
    }
  }
}

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let isInteractive = false;
  for (let i = 0; i < intersects.length; i++) {
    const obj = intersects[i].object;
    if (obj.userData && obj.userData.isFlame) {
      isInteractive = true;
      break;
    }
    let frameObj = obj;
    while (frameObj && (!frameObj.userData || frameObj.userData.frameIndex === undefined)) {
      frameObj = frameObj.parent;
    }
    if (frameObj && frameObj.userData && frameObj.userData.frameIndex !== undefined) {
      isInteractive = true;
      break;
    }
  }

  if (renderer && renderer.domElement) {
    renderer.domElement.style.cursor = isInteractive ? 'pointer' : 'grab';
  }
}

// ==========================================
// 6B. MUSIC & AUTOMATED PHOTO/VIDEO SLIDESHOW (IMAGES FIRST, THEN VIDEOS WITHOUT AUDIO)
// ==========================================
let bgAudio = null;
let isAudioPlaying = false;
let autoMoveTimer = null;
let slideshowIndex = 0;

// Sequence: All Photo Images play FIRST, then Video Clips play NEXT (WITHOUT AUDIO)
const UNFORGETTABLE_SLIDESHOW_ITEMS = [
  // --- 1. OPEN ALL IMAGES FIRST ---
  { type: 'image', src: 'photo4.jpg' },
  { type: 'image', src: 'Screenshot 2026-08-14 223703.png' },
  { type: 'image', src: 'photo2.jpg' },
  { type: 'image', src: 'IMG_2952.JPG' },
  { type: 'image', src: 'Screenshot 2026-08-14 223827.png' },
  { type: 'image', src: 'photo3.jpg' },
  { type: 'image', src: 'photo11.jpeg' },
  { type: 'image', src: 'photo5.jpeg' },
  { type: 'image', src: 'photo10.jpeg' },
  { type: 'image', src: 'photo6.jpeg' },
  { type: 'image', src: 'IMG_0027.JPG' },

  // --- 2. THEN PLAY ALL VIDEOS NEXT (MUTED / WITHOUT AUDIO) ---
  { type: 'video', src: 'video/IMG_2945.MP4' },
  { type: 'video', src: 'video/IMG_2947.MP4' },
  { type: 'video', src: 'video/IMG_2949.MP4' },
  { type: 'video', src: 'video/WhatsApp Video 2025-12-23 at 8.36.05 PM.mp4' },
  { type: 'video', src: 'video/WhatsApp Video 2025-12-23 at 8.36.06 PM.mp4' }
];

function initAudio() {
  if (!bgAudio) {
    bgAudio = new Audio('Megham Karukathu Bgm.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.85;
  }
}

function playSiteBGMOnOpen() {
  if (currentAppState !== APP_STATE.CAKE_ROOM) return;
  initAudio();
  if (bgAudio) {
    bgAudio.muted = false;
    bgAudio.volume = 0.85;
    bgAudio.play().then(() => {
      isAudioPlaying = true;
    }).catch(e => console.log('Audio playback error:', e));
  }
}

// ------------------------------------------
// 3D BOOKLET MEDIA RENDER & SOUND SYNTHESIS
// ------------------------------------------
function playPageFlipSound() {
  try {
    const ctx = getAudioContext();
    const duration = 0.25;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.sin((i / bufferSize) * Math.PI);
      output[i] = (Math.random() * 2 - 1) * decay * 0.18;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
  } catch (e) {
    console.warn('Page flip sound issue:', e);
  }
}

function renderMediaToBookletContainer(container, srcUrl) {
  if (!container) return;
  container.innerHTML = '';

  if (!srcUrl) return;

  const isVideo = typeof srcUrl === 'string' && (srcUrl.toLowerCase().includes('.mp4') || srcUrl.toLowerCase().includes('.webm') || srcUrl.toLowerCase().includes('.mov'));

  if (isVideo) {
    const video = document.createElement('video');
    video.src = srcUrl;
    video.controls = true;
    video.autoplay = true;
    video.muted = true; // Muted video audio
    video.playsInline = true;
    video.loop = true;
    container.appendChild(video);
  } else if (typeof srcUrl === 'string') {
    const img = document.createElement('img');
    img.src = srcUrl;
    container.appendChild(img);
  }
}

function renderLeftPage(container, currentIdx, totalItems) {
  if (!container) return;
  if (currentIdx === 0) {
    renderLeftBookletTitle(container, currentIdx, totalItems);
  } else {
    let srcUrl = null;
    if (UNFORGETTABLE_SLIDESHOW_ITEMS && UNFORGETTABLE_SLIDESHOW_ITEMS[currentIdx - 1]) {
      srcUrl = UNFORGETTABLE_SLIDESHOW_ITEMS[currentIdx - 1].src;
    } else if (DEFAULT_FRAME_PHOTOS && DEFAULT_FRAME_PHOTOS[currentIdx - 1]) {
      srcUrl = DEFAULT_FRAME_PHOTOS[currentIdx - 1];
    }
    if (srcUrl) {
      renderMediaToBookletContainer(container, srcUrl);
    } else {
      renderLeftBookletTitle(container, currentIdx, totalItems);
    }
  }
}

function renderLeftBookletTitle(container, currentIdx, totalItems) {
  if (!container) return;
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center p-4 h-full select-none font-sans">
      <div class="booklet-avatar-frame w-28 h-28 sm:w-32 sm:h-32 aspect-square flex-shrink-0 mb-3 sm:mb-4 rounded-full p-1 bg-amber-100/90 border-2 border-amber-300 shadow-md flex items-center justify-center overflow-hidden ring-2 ring-amber-200/60 transition-transform duration-300 hover:scale-105">
        <img src="IMG_0027.JPG" alt="Memory Photo" class="w-full h-full object-cover rounded-full" />
      </div>
      <h2 class="booklet-left-title text-xl sm:text-2xl text-amber-950 font-bold tracking-wide mb-1.5 px-2">
        Our Precious Memories🤍
      </h2>
      <p class="text-base sm:text-lg text-amber-900/80 font-semibold tracking-wide">
        Happy Birthday LUSUU💎
      </p>
      <div class="w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-3 sm:my-4"></div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

let isPageFlipping = false;

function openSlideshowMediaItem(index, direction = null) {
  if (!UNFORGETTABLE_SLIDESHOW_ITEMS || UNFORGETTABLE_SLIDESHOW_ITEMS.length === 0) return;

  const total = UNFORGETTABLE_SLIDESHOW_ITEMS.length;
  const prevIdx = slideshowIndex;
  slideshowIndex = (index + total) % total;

  const item = UNFORGETTABLE_SLIDESHOW_ITEMS[slideshowIndex];
  const prevItem = UNFORGETTABLE_SLIDESHOW_ITEMS[prevIdx];

  const modal = document.getElementById('media-modal');
  const modalIndicator = document.getElementById('modal-indicator');
  const pageLeftContent = document.getElementById('page-left-content');
  const pageRightContent = document.getElementById('page-right-content');
  const flipLeaf = document.getElementById('booklet-flip-leaf');
  const leafFront = document.getElementById('leaf-front-content');
  const leafBack = document.getElementById('leaf-back-content');

  if (!modal || !pageRightContent) return;

  if (modalIndicator) {
    modalIndicator.textContent = `Page ${slideshowIndex + 1} of ${total}`;
  }

  // If opening modal for the first time or direction is null (no 3D flip animation)
  if (!direction || !modal.classList.contains('modal-active')) {
    renderLeftPage(pageLeftContent, slideshowIndex, total);
    renderMediaToBookletContainer(pageRightContent, item.src);
    modal.classList.add('modal-active');
    resetAutoSlideshowTimer();
    return;
  }

  if (isPageFlipping) return;
  isPageFlipping = true;

  playPageFlipSound();

  if (direction === 'next') {
    // Flipping page from Right to Left
    renderMediaToBookletContainer(leafFront, prevItem.src);
    renderLeftPage(leafBack, slideshowIndex, total);
    renderMediaToBookletContainer(pageRightContent, item.src);

    flipLeaf.className = 'booklet-flip-leaf flip-next-mode animate-flip-next';
    flipLeaf.style.display = 'flex';

    setTimeout(() => {
      renderLeftPage(pageLeftContent, slideshowIndex, total);
      flipLeaf.style.display = 'none';
      flipLeaf.className = 'booklet-flip-leaf';
      isPageFlipping = false;
    }, 700);

  } else if (direction === 'prev') {
    // Flipping page from Left to Right
    renderLeftPage(pageLeftContent, slideshowIndex, total);
    renderLeftPage(leafFront, slideshowIndex, total);
    renderMediaToBookletContainer(leafBack, prevItem.src);

    flipLeaf.className = 'booklet-flip-leaf flip-prev-mode animate-flip-prev';
    flipLeaf.style.display = 'flex';

    setTimeout(() => {
      renderMediaToBookletContainer(pageRightContent, item.src);
      flipLeaf.style.display = 'none';
      flipLeaf.className = 'booklet-flip-leaf';
      isPageFlipping = false;
    }, 700);
  } else {
    renderLeftPage(pageLeftContent, slideshowIndex, total);
    renderMediaToBookletContainer(pageRightContent, item.src);
    isPageFlipping = false;
  }

  modal.classList.add('modal-active');
  resetAutoSlideshowTimer();
}

function resetAutoSlideshowTimer() {
  if (autoMoveTimer) clearInterval(autoMoveTimer);

  // Auto change page every 7 seconds (7000ms)
  autoMoveTimer = setInterval(() => {
    slideshowIndex = (slideshowIndex + 1) % UNFORGETTABLE_SLIDESHOW_ITEMS.length;
    openSlideshowMediaItem(slideshowIndex, 'next');
  }, 7000);
}

function downloadCurrentImage() {
  let srcUrl = null;

  if (UNFORGETTABLE_SLIDESHOW_ITEMS && UNFORGETTABLE_SLIDESHOW_ITEMS[slideshowIndex]) {
    srcUrl = UNFORGETTABLE_SLIDESHOW_ITEMS[slideshowIndex].src;
  } else if (typeof activeSelectedFrameIndex !== 'undefined' && wallFrames && wallFrames[activeSelectedFrameIndex]) {
    const frameData = wallFrames[activeSelectedFrameIndex];
    if (frameData.hasCustomPhoto && frameData.customPhotoUrl) {
      srcUrl = frameData.customPhotoUrl;
    } else if (DEFAULT_FRAME_PHOTOS && DEFAULT_FRAME_PHOTOS[activeSelectedFrameIndex]) {
      srcUrl = DEFAULT_FRAME_PHOTOS[activeSelectedFrameIndex];
    }
  }

  if (!srcUrl) {
    const rightImg = document.querySelector('#page-right-content img');
    if (rightImg) srcUrl = rightImg.src;
  }

  if (!srcUrl) return;

  const pageNum = (slideshowIndex !== undefined ? slideshowIndex : (activeSelectedFrameIndex || 0)) + 1;
  const a = document.createElement('a');
  a.href = srcUrl;
  a.download = `Birthday_Memory_Photo_${pageNum}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function navigateSlideshow(direction) {
  if (!UNFORGETTABLE_SLIDESHOW_ITEMS || UNFORGETTABLE_SLIDESHOW_ITEMS.length === 0) return;

  if (direction === 'next') {
    slideshowIndex = (slideshowIndex + 1) % UNFORGETTABLE_SLIDESHOW_ITEMS.length;
  } else if (direction === 'prev') {
    slideshowIndex = (slideshowIndex - 1 + UNFORGETTABLE_SLIDESHOW_ITEMS.length) % UNFORGETTABLE_SLIDESHOW_ITEMS.length;
  }

  openSlideshowMediaItem(slideshowIndex, direction);
  resetAutoSlideshowTimer();
}

function startAutoSlideshow() {
  slideshowIndex = 0; // ALWAYS START AT THE VERY FIRST IMAGE PHOTO WHEN BUTTON CLICKED!
  openSlideshowMediaItem(slideshowIndex, 'next');
  resetAutoSlideshowTimer();
}

function stopAutoSlideshow() {
  if (autoMoveTimer) {
    clearInterval(autoMoveTimer);
    autoMoveTimer = null;
  }
}

function toggleUnforgettableMode() {
  initAudio();

  // 1. Play & Unmute Background Song (Megham Karukathu Bgm.mp3)
  if (bgAudio) {
    bgAudio.muted = false;
    bgAudio.volume = 0.85;
    bgAudio.play().then(() => {
      isAudioPlaying = true;
    }).catch((err) => console.log('Audio play error:', err));
  }

  // 2. View Our Memories Album (Images & Videos)
  startAutoSlideshow();

  // Trigger 3D Confetti Celebration
  if (candlesBlown) {
    candlesBlown = false;
  }
  trigger3DConfetti();
}

// Open Lightbox Media Modal
function openMediaModal(mediaItem) {
  const modal = document.getElementById('media-modal');
  const pageLeftContent = document.getElementById('page-left-content');
  const pageRightContent = document.getElementById('page-right-content');
  if (!modal || !pageRightContent) return;

  playPageFlipSound();
  renderLeftBookletTitle(pageLeftContent, 0, 1);
  renderMediaToBookletContainer(pageRightContent, mediaItem.src);

  modal.classList.add('modal-active');
}

// Close Lightbox Media Modal
function closeMediaModal() {
  stopAutoSlideshow();

  const modal = document.getElementById('media-modal');
  const pageLeftContent = document.getElementById('page-left-content');
  const pageRightContent = document.getElementById('page-right-content');

  if (modal) modal.classList.remove('modal-active');

  if (pageRightContent) {
    const vid = pageRightContent.querySelector('video');
    if (vid) vid.pause();
  }
  if (pageLeftContent) {
    const vid = pageLeftContent.querySelector('video');
    if (vid) vid.pause();
  }
  activeSelectedFrameIndex = null;
}

// ==========================================
// 7. UI EVENT LISTENERS & CROSS-PLATFORM INPUTS (WINDOWS & ANDROID)
// ==========================================
function setupUIEventListeners() {
  // Unforgettable Song & Auto Slideshow Button
  const blowBtn = document.getElementById('blow-btn');
  if (blowBtn) {
    blowBtn.addEventListener('click', toggleUnforgettableMode);
  }

  // Manual Modal Navigation Listeners (Previous / Next Arrows)
  const prevBtn = document.getElementById('modal-prev-btn');
  const nextBtn = document.getElementById('modal-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateSlideshow('prev');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateSlideshow('next');
    });
  }

  // Booklet Page Corner Fold Click Listeners
  const cornerNext = document.getElementById('corner-flip-next');
  const cornerPrev = document.getElementById('corner-flip-prev');

  if (cornerNext) {
    cornerNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateSlideshow('next');
    });
  }

  if (cornerPrev) {
    cornerPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateSlideshow('prev');
    });
  }

  // Frame Photo Upload Listeners
  const uploadBtn = document.getElementById('modal-upload-btn');
  const clearBtn = document.getElementById('modal-clear-btn');
  const fileInput = document.getElementById('frame-photo-input');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && activeSelectedFrameIndex !== null) {
        const reader = new FileReader();
        reader.onload = (event) => {
          applyPhotoToFrame(activeSelectedFrameIndex, event.target.result, true);
        };
        reader.readAsDataURL(file);
      }
      fileInput.value = '';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (activeSelectedFrameIndex !== null) {
        resetFrameToEmpty(activeSelectedFrameIndex);
      }
    });
  }

  // Cake Room Back Navigation Listener
  const cakeBackBtn = document.getElementById('cake-back-btn');
  if (cakeBackBtn) {
    cakeBackBtn.addEventListener('click', goBackToQuiz);
  }

  // Lightbox Modal Listeners
  const modalCloseBtn = document.getElementById('modal-close');
  const mediaModal = document.getElementById('media-modal');
  const modalDownloadBtn = document.getElementById('modal-download-btn');

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeMediaModal);
  }
  if (modalDownloadBtn) {
    modalDownloadBtn.addEventListener('click', downloadCurrentImage);
  }
  if (mediaModal) {
    mediaModal.addEventListener('click', (e) => {
      if (e.target === mediaModal) closeMediaModal();
    });
  }

  // ------------------------------------------
  // A. WINDOWS DESKTOP KEYBOARD CONTROLS
  // ------------------------------------------
  window.addEventListener('keydown', (e) => {
    // Ignore input if typing in an input element
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        toggleUnforgettableMode();
        break;
      case 'Escape':
        closeMediaModal();
        break;
      case 'ArrowLeft':
        if (mediaModal && mediaModal.classList.contains('modal-active')) {
          navigateSlideshow('prev');
        }
        break;
      case 'ArrowRight':
        if (mediaModal && mediaModal.classList.contains('modal-active')) {
          navigateSlideshow('next');
        }
        break;
      case 'KeyT':
        activeThemeIndex = (activeThemeIndex + 1) % CAKE_THEMES.length;
        createCake();
        break;
    }
  });

  // ------------------------------------------
  // B. ANDROID MOBILE TOUCH SWIPE NAVIGATION
  // ------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;
  if (mediaModal) {
    mediaModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    mediaModal.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Horizontal swipe threshold > 40px and predominant over vertical scroll
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          navigateSlideshow('next'); // Swipe left -> Next
        } else {
          navigateSlideshow('prev'); // Swipe right -> Previous
        }
      }
    }, { passive: true });
  }
}

// ==========================================
// 8. ANIMATION LOOP & PHYSICS
// ==========================================
function animate(timestamp = 0) {
  requestAnimationFrame(animate);

  const time = timestamp * 0.001;

  // 1. Orbit Controls Update
  controls.update();

  // Stable Cake Position (Fixed solidly on the wooden table)
  if (cakeGroup) {
    cakeGroup.position.set(0, 0, 0);
    cakeGroup.rotation.z = 0;
  }

  // 4. Crown Topper Gentle Floating & Slow Rotation
  if (topperGroup) {
    topperGroup.rotation.y = time * 0.3;
  }

  // 5. Candle Flames Smooth Ignition / Extinguish & Flickering
  const targetScale = candlesBlown ? 0.0001 : 1.0;

  candleFlames.forEach((flameGroup, i) => {
    // Smooth Lerp Scale for ignition / blowout animation
    flameGroup.scale.x = THREE.MathUtils.lerp(flameGroup.scale.x, targetScale, 0.12);
    flameGroup.scale.y = THREE.MathUtils.lerp(flameGroup.scale.y, targetScale, 0.12);
    flameGroup.scale.z = THREE.MathUtils.lerp(flameGroup.scale.z, targetScale, 0.12);

    flameGroup.visible = flameGroup.scale.x > 0.02;

    if (!candlesBlown && flameGroup.visible) {
      // Natural flame sway & flicker animation
      const flicker = Math.sin(time * 14 + i * 2.5) * 0.12 + (Math.random() - 0.5) * 0.06;
      flameGroup.scale.y = targetScale * (1 + flicker);
      flameGroup.rotation.z = Math.sin(time * 8 + i) * 0.09;
    }

    // Warm Point Light Intensity Interpolation
    if (candleLights[i]) {
      const currentIntensity = candleLights[i].intensity;
      const targetIntensity = candlesBlown ? 0 : (1.6 + Math.sin(time * 15 + i * 2) * 0.3);
      candleLights[i].intensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, 0.12);
    }
  });

  // 6. Ambient Sparkles Drift & Room Twinkle / Sway
  if (ambientSparkles) {
    ambientSparkles.rotation.y = time * 0.02;
    const positions = ambientSparkles.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= 0.008;
      if (positions[i] < -4) positions[i] = 14;
    }
    ambientSparkles.geometry.attributes.position.needsUpdate = true;
  }

  // 6b. Fairy Lights Twinkle & Room Balloons Sway
  fairyBulbs.forEach((b) => {
    b.mesh.material.emissiveIntensity = b.baseEmissive + Math.sin(time * 3 + b.phase) * 0.25;
  });

  roomBalloons.forEach((b) => {
    b.group.position.y = b.initialY + Math.sin(time * b.speed + b.phase) * 0.18;
    b.group.rotation.z = Math.sin(time * 0.8 + b.phase) * 0.04;
  });



  // 7. 3D Confetti Particles Physics
  for (let i = confettiExplosionParticles.length - 1; i >= 0; i--) {
    const p = confettiExplosionParticles[i];
    p.mesh.position.x += p.vx;
    p.mesh.position.y += p.vy;
    p.mesh.position.z += p.vz;

    p.vy -= 0.006; // Gravity effect
    p.mesh.rotation.x += p.rx;
    p.mesh.rotation.y += p.ry;
    p.life -= 0.01;

    if (p.life <= 0 || p.mesh.position.y < -2) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      confettiExplosionParticles.splice(i, 1);
    }
  }

  // 8. Candle Smoke Particles Rising & Fading
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const s = smokeParticles[i];
    s.mesh.position.y += s.vy;
    s.mesh.position.x += s.vx;
    s.mesh.position.z += s.vz;

    s.mesh.scale.addScalar(s.scaleSpeed);
    s.mesh.material.opacity -= s.opacitySpeed;

    if (s.mesh.material.opacity <= 0) {
      scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
      smokeParticles.splice(i, 1);
    }
  }

  // Render Scene
  renderer.render(scene, camera);
}
