/**
 * Lamp Pull-String — script.js
 * -----------------------------------
 * Manages: pull interaction, lamp state, light animations,
 * floating dust particles, and cursor glow.
 */

(function () {
  'use strict';

  /* ======================================
     DOM References
     ====================================== */
  const pullHandle    = document.getElementById('pull-handle');
  const pullAssembly  = document.getElementById('pull-assembly');
  const pullString    = document.getElementById('pull-string');
  const bulbGlow      = document.getElementById('bulb-glow');
  const lightCone     = document.getElementById('light-cone');
  const roomLight     = document.getElementById('room-light');
  const floorShadow   = document.getElementById('floor-shadow');
  const instruction   = document.getElementById('instruction');
  const particlesCont = document.getElementById('particles');
  const cursorGlow    = document.getElementById('cursor-glow');

  /* ======================================
     State
     ====================================== */
  let lampOn      = false;   // current lamp state
  let pulling     = false;   // is user currently dragging?
  let pullStartY  = 0;       // Y when drag started
  let pullDelta   = 0;       // how far user has dragged
  const PULL_THRESHOLD = 28; // px needed to trigger toggle
  let particles   = [];      // active particle refs
  let particleRAF = null;    // animation frame id

  /* ======================================
     Initialise
     ====================================== */
  function init() {
    // Start with pulsing hint on handle
    pullHandle.classList.add('pulsing');
    bindEvents();
  }

  /* ======================================
     Event Binding
     ====================================== */
  function bindEvents() {
    // --- Mouse ---
    pullHandle.addEventListener('mousedown', onPullStart);
    window.addEventListener('mousemove', onPullMove);
    window.addEventListener('mouseup', onPullEnd);

    // --- Touch ---
    pullHandle.addEventListener('touchstart', onPullStart, { passive: false });
    window.addEventListener('touchmove', onPullMove, { passive: false });
    window.addEventListener('touchend', onPullEnd);

    // --- Simple click/tap fallback ---
    pullHandle.addEventListener('click', onHandleClick);

    // --- Keyboard accessibility ---
    pullHandle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleLamp();
      }
    });

    // --- Cursor glow ---
    window.addEventListener('mousemove', updateCursorGlow);
  }

  /* ======================================
     Cursor Glow
     ====================================== */
  function updateCursorGlow(e) {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top  = e.clientY + 'px';
  }

  /* ======================================
     Pull Interaction
     ====================================== */
  function clientY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  function onPullStart(e) {
    e.preventDefault();
    pulling    = true;
    pullStartY = clientY(e);
    pullDelta  = 0;
    pullHandle.classList.remove('pulsing');
    pullHandle.style.cursor = 'grabbing';
  }

  function onPullMove(e) {
    if (!pulling) return;
    e.preventDefault();
    pullDelta = Math.max(0, clientY(e) - pullStartY);

    // Clamp visual pull distance
    const clampedDelta = Math.min(pullDelta, 50);
    pullString.style.height = (getBaseStringHeight() + clampedDelta) + 'px';
    pullHandle.style.transform = 'translateY(' + clampedDelta + 'px)';
  }

  function onPullEnd() {
    if (!pulling) return;
    pulling = false;
    pullHandle.style.cursor = 'grab';

    // Spring back
    pullString.style.height = '';
    pullHandle.style.transform = '';

    if (pullDelta >= PULL_THRESHOLD) {
      toggleLamp();
    }
    pullDelta = 0;
  }

  /** Click/tap fallback (for quick taps that don't register a drag) */
  function onHandleClick(e) {
    // Ignore if it was already handled by drag
    if (pullDelta >= PULL_THRESHOLD) return;
    pullHandle.classList.remove('pulsing');
    animatePull();
  }

  /** Play a quick pull-and-release animation, then toggle */
  function animatePull() {
    pullAssembly.classList.add('pulled');
    setTimeout(function () {
      pullAssembly.classList.remove('pulled');
      toggleLamp();
    }, 320);
  }

  function getBaseStringHeight() {
    return window.innerWidth <= 600 ? 30 : 38;
  }

  /* ======================================
     Toggle Lamp
     ====================================== */
  function toggleLamp() {
    lampOn = !lampOn;

    if (lampOn) {
      turnOn();
    } else {
      turnOff();
    }
  }

  function turnOn() {
    bulbGlow.classList.add('on');
    lightCone.classList.add('on');
    roomLight.classList.add('on');
    floorShadow.classList.add('on');
    instruction.classList.add('hidden');

    // Start particles
    startParticles();
  }

  function turnOff() {
    bulbGlow.classList.remove('on');
    lightCone.classList.remove('on');
    roomLight.classList.remove('on');
    floorShadow.classList.remove('on');
    instruction.classList.remove('hidden');

    // Stop particles
    stopParticles();

    // Re-add pulsing hint after a beat
    setTimeout(function () {
      if (!lampOn) pullHandle.classList.add('pulsing');
    }, 1200);
  }

  /* ======================================
     Dust Particles
     ====================================== */
  function startParticles() {
    if (particleRAF) return; // already running
    spawnBatch();
    // Spawn new particles every ~800ms
    particleRAF = setInterval(spawnBatch, 800);
  }

  function stopParticles() {
    if (particleRAF) {
      clearInterval(particleRAF);
      particleRAF = null;
    }
    // Fade out existing particles
    var existing = particlesCont.querySelectorAll('.particle');
    existing.forEach(function (p) {
      p.style.opacity = '0';
      setTimeout(function () { p.remove(); }, 1000);
    });
  }

  function spawnBatch() {
    var count = window.innerWidth <= 600 ? 3 : 5;
    for (var i = 0; i < count; i++) {
      spawnParticle();
    }
  }

  function spawnParticle() {
    var el = document.createElement('div');
    el.className = 'particle';

    // Random size 1.5 – 4px
    var size = 1.5 + Math.random() * 2.5;
    el.style.width  = size + 'px';
    el.style.height = size + 'px';

    // Cone region: center ± spread, from lamp bottom to ~70% of viewport
    var lampCenterX = window.innerWidth / 2;
    var lampBottomY = getLampBottom();
    var coneHeight  = window.innerHeight * 0.55;

    // Random position within cone
    var yRatio = Math.random();
    var y = lampBottomY + yRatio * coneHeight;
    // Cone widens as y increases
    var spread = 40 + yRatio * (window.innerWidth * 0.22);
    var x = lampCenterX + (Math.random() - 0.5) * spread;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';

    // Drift direction
    var dx = (Math.random() - 0.5) * 60;
    var dy = -20 - Math.random() * 40; // float upward
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');

    var duration = 3000 + Math.random() * 3000;
    el.style.animation = 'particle-float ' + duration + 'ms ease-in-out forwards';

    particlesCont.appendChild(el);

    // Remove after animation ends
    setTimeout(function () {
      el.remove();
    }, duration + 200);
  }

  function getLampBottom() {
    // Approximate lamp bottom based on CSS layout
    var shade  = 70;
    var stand  = Math.min(Math.max(200, window.innerHeight * 0.38), 340);
    var topVh  = window.innerHeight * 0.03;
    if (window.innerWidth <= 600) {
      shade = 50;
      stand = Math.min(Math.max(160, window.innerHeight * 0.30), 240);
    }
    return topVh + shade + stand + 8; // shade + stand + base
  }

  /* ======================================
     Kick it off
     ====================================== */
  init();

})();
