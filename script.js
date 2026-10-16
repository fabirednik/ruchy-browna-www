/**
 * ============================================================================
 * RUCHY BROWNA – WIRTUALNE LABORATORIUM FIZYCZNE 2D
 * Kompletny silnik fizyki cząstek Canvas 2D, termostat Maxwella, zderzenia
 * sprężyste, live oscyloskop r^2(t), dekoder Einsteina oraz zintegrowane misje.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. STAN GLOBALNY APLIKACJI I PARAMETRY FIZYCZNE
     ========================================================================== */

  const State = {
    // Motyw
    theme: localStorage.getItem('brownian_theme') || 'dark-modern',

    // Pętla symulacji
    isRunning: true,
    stepRequested: false,
    simTime: 0,
    realTimeLast: performance.now(),
    fps: 60,
    fpsFrames: 0,
    fpsTimer: 0,

    // Parametry Fizyczne
    temp: 300,            // Temperatura w Kelwinach [100 - 1000]
    mass: 50,             // Masa cząstki Browna w jednostkach m0 [5 - 500]
    radius: 22,           // Promień cząstki Browna w px [8 - 60]
    solventCount: 200,    // Liczba cząsteczek cieczy [30 - 450]
    viscosity: 0.015,     // Lepkość / opór Stokesa płynu [0 - 0.08]
    timeScale: 1.0,       // Mnożnik czasu [0.1 - 2.5]

    // Tryb eksperymentalny (1 do 6)
    currentMode: 1,

    // Opcje wizualizacji
    showTrail: true,
    showVectors: false,
    showTheoryCircle: true,
    showThermalVision: false,

    // Widok wykresu ('displacement' | 'histogram')
    chartView: 'displacement',

    // Telemetria i Pomiary
    totalCollisions: 0,
    recentCollisions: [],
    collisionRate: 0,
    cumulativePath: 0,

    // Próbki do wykresu r^2(t)
    chartData: [],
    chartTimer: 0,

    // Interakcja mysz/dotyk (Flick Impulse)
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    flickParticle: null,

    // Iskierki zderzeń w Trybie 5
    collisionSparks: [],

    // Aktualnie aktywny symbol w dekoderze wzoru
    currentDecoderSymbol: 'T'
  };

  /* ==========================================================================
     2. DANE DEKODERA WZORU
     ========================================================================== */

  const FormulaDecoderData = {
    T: {
      title: "Symbol: $T$ – Temperatura Bezwzględna (w Kelwinach)",
      location: "W liczniku wzoru (wpływ wprost proporcjonalny)",
      text: "Temperatura w ujęciu mikroskopowym to bezpośrednia miara średniej energii kinetycznej chaotycznego ruchu cząsteczek: $\\langle E_k \\rangle = \\frac{1}{2}m v_{\\text{śr}}^2 = \\frac{3}{2}k_B T$. Wyższa temperatura oznacza, że cząsteczki wody poruszają się szybciej ($v \\propto \\sqrt{T}$), ich pęd $p = mv$ rośnie, a uderzenia w pyłek stają się gwałtowniejsze. Dlatego w gorącej herbacie cząstki dyfundują o wiele szybciej niż w lodowatej wodzie!"
    },
    R: {
      title: "Symbol: $R$ – Promień geometryczny cząstki (pyłku)",
      location: "W mianowniku wzoru (wpływ odwrotnie proporcjonalny)",
      text: "Dlaczego promień jest w mianowniku? Większa cząstka to drastycznie większa masa ($M \\propto R^3$). Z II zasady dynamiki Newtona ($a = \\frac{F}{M}$) przyspieszenie nadawane przez pojedyncze uderzenie staje się mikroskopijne. Dodatkowo wokół dużej kuli uderzenia z lewej i prawej strony uśredniają się znacznie dokładniej. Z tego powodu pyłek o promieniu $1\\ \\mu\\text{m}$ ulega ciągłym fluktuacjom położenia, a widoczna gołym okiem kulka styropianu pozostaje w wodzie nieruchoma!"
    },
    eta: {
      title: "Symbol: $\\eta$ (eta) – Współczynnik lepkości dynamicznej cieczy",
      location: "W mianowniku wzoru (opór ośrodka hamuje ruch)",
      text: "Lepkość to miara tarcia wewnętrznego płynu. Wyobraź sobie bieganie w powietrzu, w wodzie oraz w gęstym miodzie. Zgodnie z prawem Stokesa siła oporu hydrodynamicznego wynosi $F_o = 6\\pi \\eta R v$. Im większa lepkość $\\eta$, tym szybciej płyn tłumi każdy impuls pędu uzyskany ze zderzeń, a pyłek znacznie wolniej oddala się od punktu startu."
    },
    kB: {
      title: "Symbol: $k_B$ – Stała Boltzmanna ($1{,}38 \\cdot 10^{-23}\\ \\text{J/K}$)",
      location: "W liczniku wzoru (fundamentalny kantor walutowy)",
      text: "Stała Boltzmanna to uniwersalny łącznik fizyki. Przelicza temperaturę mierzoną termometrem (Kelwiny) na energię mechaniczną pojedynczych cząsteczek (Dżule). Jej mikroskopijna wartość rzędu $10^{-23}$ pokazuje, jak mała porcja energii kinetycznej przypada na pojedynczą cząsteczkę $\\text{H}_2\\text{O}$."
    },
    t: {
      title: "Symbol: $t$ – Czas trwania obserwacji (w sekundach)",
      location: "Współczynnik liniowy dla kwadratu przemieszczenia",
      text: "Średni kwadrat odległości rośnie proporcjonalnie do czasu: $\\langle r^2 \\rangle \\propto t$. Oznacza to, że sama odległość rośnie jak pierwiastek z czasu: $r \\propto \\sqrt{t}$. W zwykłym ruchu jednostajnym ($s = vt$) w 4 razy dłuższym czasie pokonujesz 4 razy większy dystans. W ruchach Browna w 4 razy dłuższym czasie oddalasz się średnio zaledwie 2 razy dalej!"
    }
  };

  /* ==========================================================================
     3. ELEMENTY DOM
     ========================================================================== */

  const DOM = {
    html: document.documentElement,
    body: document.body,
    themeSelect: document.getElementById('theme-select'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Canvas Symulacji
    simCanvas: document.getElementById('sim-canvas'),
    simCtx: document.getElementById('sim-canvas').getContext('2d'),
    simViewport: document.getElementById('canvas-viewport'),
    badgeMode: document.getElementById('badge-mode-indicator'),
    badgeFps: document.getElementById('badge-fps'),
    hudStatusText: document.getElementById('hud-status-text'),

    // Toolbar & Misje Drawer
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnPlayGlyph: document.getElementById('btn-play-glyph'),
    btnPlayText: document.getElementById('btn-play-text'),
    btnStep: document.getElementById('btn-step'),
    btnResetPos: document.getElementById('btn-reset-pos'),
    btnClearTrail: document.getElementById('btn-clear-trail'),
    btnRestartSim: document.getElementById('btn-restart-sim'),
    btnToggleMissions: document.getElementById('btn-toggle-missions'),
    missionsDrawer: document.getElementById('lab-missions-drawer'),
    missionsArrow: document.getElementById('missions-arrow'),
    btnCloseMissions: document.getElementById('btn-close-missions'),
    navMissionsLink: document.getElementById('nav-link-missions'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-chip'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Suwaki
    sliderTemp: document.getElementById('slider-temp'),
    valTemp: document.getElementById('val-temp'),
    sliderMass: document.getElementById('slider-mass'),
    valMass: document.getElementById('val-mass'),
    sliderRadius: document.getElementById('slider-radius'),
    valRadius: document.getElementById('val-radius'),
    sliderCount: document.getElementById('slider-count'),
    valCount: document.getElementById('val-count'),
    sliderViscosity: document.getElementById('slider-viscosity'),
    valViscosity: document.getElementById('val-viscosity'),
    sliderTimescale: document.getElementById('slider-timescale'),
    valTimescale: document.getElementById('val-timescale'),

    // Presety i Tryby
    presetButtons: document.querySelectorAll('.preset-pill'),
    modeTiles: document.querySelectorAll('.mode-tile'),

    // Wizualizacja Toggles
    chkTrail: document.getElementById('chk-trail'),
    chkVectors: document.getElementById('chk-vectors'),
    chkTheoryCircle: document.getElementById('chk-theory-circle'),
    chkThermalVision: document.getElementById('chk-thermal-vision'),

    // Telemetria
    meterTime: document.getElementById('meter-time'),
    meterCollisions: document.getElementById('meter-collisions'),
    meterColRate: document.getElementById('meter-col-rate'),
    meterSpeed: document.getElementById('meter-speed'),
    meterDisp: document.getElementById('meter-disp'),
    meterDispSq: document.getElementById('meter-disp-sq'),
    meterPath: document.getElementById('meter-path'),

    // Canvas Wykresu
    chartCanvas: document.getElementById('chart-canvas'),
    chartCtx: document.getElementById('chart-canvas').getContext('2d'),
    chartWrapper: document.getElementById('chart-canvas-wrapper'),
    chartMainTitle: document.getElementById('chart-main-title'),
    btnChartDisp: document.getElementById('btn-chart-disp'),
    btnChartHist: document.getElementById('btn-chart-hist'),
    chartLegend: document.getElementById('chart-legend'),

    // Dekoder Wzoru
    decoderButtons: document.querySelectorAll('.decoder-btn'),
    decoderTitle: document.getElementById('decoder-title'),
    decoderLocation: document.getElementById('decoder-location'),
    decoderText: document.getElementById('decoder-text'),

    // Misje
    btnLoadMissions: document.querySelectorAll('.btn-load-mission')
  };

  /* ==========================================================================
     4. SILNIK FIZYCZNY: STRUKTURY DANYCH, TERMOSTAT I ZDERZENIA
     ========================================================================== */

  let brownianParticles = [];
  let solventMolecules = [];

  let simWidth = 800;
  let simHeight = 460;
  let simDpr = window.devicePixelRatio || 1;

  let chartWidth = 800;
  let chartHeight = 200;
  let chartDpr = window.devicePixelRatio || 1;

  class Particle {
    constructor(x, y, vx, vy, radius, mass, color, isBrownian = false, id = 0) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = radius;
      this.mass = mass;
      this.color = color;
      this.isBrownian = isBrownian;
      this.id = id;

      this.startX = x;
      this.startY = y;
      this.lastX = x;
      this.lastY = y;
      this.trail = [];
      this.trailAccumulator = 0;
    }

    speed() {
      return Math.hypot(this.vx, this.vy);
    }

    displacement() {
      return Math.hypot(this.x - this.startX, this.y - this.startY);
    }

    displacementSq() {
      const dx = this.x - this.startX;
      const dy = this.y - this.startY;
      return dx * dx + dy * dy;
    }
  }

  function getThermalSpeed(temperature) {
    return Math.sqrt(Math.max(temperature, 50) / 300) * 135;
  }

  /**
   * Inicjalizacja cząstek w układzie
   */
  function initParticles() {
    brownianParticles = [];
    solventMolecules = [];
    State.totalCollisions = 0;
    State.recentCollisions = [];
    State.cumulativePath = 0;
    State.chartData = [];
    State.chartTimer = 0;
    State.simTime = 0;

    const centerX = simWidth / 2;
    const centerY = simHeight / 2;
    const vTh = getThermalSpeed(State.temp);

    // 1. Inicjalizacja cząstek Browna zależnie od trybu (płaskie jednokolorowe)
    if (State.currentMode === 3) {
      // Tryb 3: Dwie cząstki w jednym roju (lekka 15m0 zielona vs ciężka 250m0 pomarańczowa)
      const p1 = new Particle(centerX - 110, centerY, 0, 0, 15, 15, '#10b981', true, 1);
      const p2 = new Particle(centerX + 110, centerY, 0, 0, 36, 250, '#f59e0b', true, 2);
      brownianParticles.push(p1, p2);
    } else if (State.currentMode === 4) {
      // Tryb 4: Dyfuzja kropli atramentu (15 cząstek w centrum, solid purple)
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rDist = Math.random() * 28;
        const px = centerX + Math.cos(angle) * rDist;
        const py = centerY + Math.sin(angle) * rDist;
        const dye = new Particle(px, py, 0, 0, 9, 18, '#8b5cf6', true, i + 1);
        brownianParticles.push(dye);
      }
    } else if (State.currentMode === 6) {
      // Tryb 6: Komora ze szczeliną (cząstka startuje po lewej stronie)
      const pLeft = new Particle(simWidth * 0.25, centerY, 0, 0, State.radius, State.mass, '#ff9f43', true, 1);
      brownianParticles.push(pLeft);
    } else {
      // Tryb 1, 2, 5: Główna cząstka Browna (jednokolorowa pomarańczowa z białą obwódką)
      const pMain = new Particle(centerX, centerY, 0, 0, State.radius, State.mass, '#ff9f43', true, 1);
      brownianParticles.push(pMain);
    }

    // 2. Inicjalizacja roju cząsteczek cieczy z unikalnymi ID
    let count = State.solventCount;
    if (State.currentMode === 5) count = Math.min(count, 70);

    for (let i = 0; i < count; i++) {
      let x, y, safe = false, tries = 0;
      const rMol = 3.5;

      while (!safe && tries < 80) {
        tries++;
        x = rMol + 6 + Math.random() * (simWidth - 2 * rMol - 12);
        y = rMol + 6 + Math.random() * (simHeight - 2 * rMol - 12);

        safe = true;
        for (const bp of brownianParticles) {
          if (Math.hypot(x - bp.x, y - bp.y) < bp.radius + rMol + 6) {
            safe = false;
            break;
          }
        }
        if (State.currentMode === 6 && Math.abs(x - simWidth / 2) < 14) {
          safe = false;
        }
      }

      const angle = Math.random() * Math.PI * 2;
      const spd = vTh * (0.8 + Math.random() * 0.4);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;

      // Każda cząsteczka ma unikalny ID
      solventMolecules.push(new Particle(x, y, vx, vy, rMol, 1, '#38bdf8', false, 100 + i));
    }
  }

  function resetPositions() {
    const centerX = simWidth / 2;
    const centerY = simHeight / 2;

    if (State.currentMode === 3) {
      if (brownianParticles[0]) {
        brownianParticles[0].x = centerX - 110;
        brownianParticles[0].y = centerY;
        brownianParticles[0].vx = 0;
        brownianParticles[0].vy = 0;
        brownianParticles[0].startX = brownianParticles[0].x;
        brownianParticles[0].startY = brownianParticles[0].y;
        brownianParticles[0].trail = [];
      }
      if (brownianParticles[1]) {
        brownianParticles[1].x = centerX + 110;
        brownianParticles[1].y = centerY;
        brownianParticles[1].vx = 0;
        brownianParticles[1].vy = 0;
        brownianParticles[1].startX = brownianParticles[1].x;
        brownianParticles[1].startY = brownianParticles[1].y;
        brownianParticles[1].trail = [];
      }
    } else if (State.currentMode === 6) {
      if (brownianParticles[0]) {
        brownianParticles[0].x = simWidth * 0.25;
        brownianParticles[0].y = centerY;
        brownianParticles[0].vx = 0;
        brownianParticles[0].vy = 0;
        brownianParticles[0].startX = brownianParticles[0].x;
        brownianParticles[0].startY = brownianParticles[0].y;
        brownianParticles[0].trail = [];
      }
    } else {
      brownianParticles.forEach(p => {
        p.x = centerX + (State.currentMode === 4 ? (Math.random() - 0.5) * 35 : 0);
        p.y = centerY + (State.currentMode === 4 ? (Math.random() - 0.5) * 35 : 0);
        p.vx = 0;
        p.vy = 0;
        p.startX = p.x;
        p.startY = p.y;
        p.trail = [];
      });
    }

    State.simTime = 0;
    State.cumulativePath = 0;
    State.chartData = [];
    State.chartTimer = 0;
    State.totalCollisions = 0;
    State.recentCollisions = [];
  }

  function clearTrails() {
    brownianParticles.forEach(p => {
      p.trail = [];
      p.startX = p.x;
      p.startY = p.y;
    });
    State.cumulativePath = 0;
    State.chartData = [];
    State.chartTimer = 0;
    State.simTime = 0;
  }

  /**
   * Główna funkcja symulacji krokowej fizyki – 100% wykrywanie zderzeń sprężystych
   */
  function updatePhysics(dt) {
    const effDt = Math.min(dt, 0.04) * State.timeScale;
    State.simTime += effDt;

    const allParticles = [...brownianParticles, ...solventMolecules];
    const totalCount = allParticles.length;

    // 1. Ruch swobodny i opór Stokesa wyłącznie na cząstce Browna
    for (let i = 0; i < totalCount; i++) {
      const p = allParticles[i];
      p.x += p.vx * effDt;
      p.y += p.vy * effDt;

      if (p.isBrownian && State.viscosity > 0) {
        const dragFactor = Math.max(0, 1 - State.viscosity * 2.2 * effDt * 60);
        p.vx *= dragFactor;
        p.vy *= dragFactor;
      }
    }

    // 2. Termostat cieczy
    const targetV = getThermalSpeed(State.temp);
    let sumV2 = 0;
    const nSolv = solventMolecules.length;
    for (let i = 0; i < nSolv; i++) {
      const m = solventMolecules[i];
      sumV2 += (m.vx * m.vx + m.vy * m.vy);
    }
    const currentRms = Math.sqrt(sumV2 / Math.max(nSolv, 1));
    if (currentRms > 0.01) {
      const thermoScale = 1 + 0.08 * (targetV / currentRms - 1);
      for (let i = 0; i < nSolv; i++) {
        solventMolecules[i].vx *= thermoScale;
        solventMolecules[i].vy *= thermoScale;
      }
    }

    // 3. Kolizje ze ścianami
    const slitSize = 90;
    const slitTop = (simHeight - slitSize) / 2;
    const slitBottom = (simHeight + slitSize) / 2;
    const wallX = simWidth / 2;
    const wallThick = 6;

    for (let i = 0; i < totalCount; i++) {
      const p = allParticles[i];

      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx);
      } else if (p.x + p.radius > simWidth) {
        p.x = simWidth - p.radius;
        p.vx = -Math.abs(p.vx);
      }

      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = Math.abs(p.vy);
      } else if (p.y + p.radius > simHeight) {
        p.y = simHeight - p.radius;
        p.vy = -Math.abs(p.vy);
      }

      if (State.currentMode === 6) {
        const inSlitY = p.y >= slitTop && p.y <= slitBottom;
        if (!inSlitY) {
          if (Math.abs(p.x - wallX) < p.radius + wallThick / 2) {
            if (p.x < wallX) {
              p.x = wallX - p.radius - wallThick / 2;
              p.vx = -Math.abs(p.vx);
            } else {
              p.x = wallX + p.radius + wallThick / 2;
              p.vx = Math.abs(p.vx);
            }
          }
        }
      }
    }

    // 4. Dokładna detekcja zderzeń sprężystych wszystkich par (brak fałszywych pominięć)
    for (let i = 0; i < totalCount; i++) {
      const p1 = allParticles[i];
      for (let j = i + 1; j < totalCount; j++) {
        const p2 = allParticles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const minDist = p1.radius + p2.radius;

        // Bounding box pre-filter (bardzo szybki test prostokątny)
        if (Math.abs(dx) > minDist || Math.abs(dy) > minDist) continue;

        const distSq = dx * dx + dy * dy;
        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const normX = dx / dist;
          const normY = dy / dist;

          // Rozsunięcie nakładających się cząstek (Static Overlap Separation)
          const overlap = minDist - dist;
          const mSum = p1.mass + p2.mass;
          p1.x -= normX * overlap * (p2.mass / mSum);
          p1.y -= normY * overlap * (p2.mass / mSum);
          p2.x += normX * overlap * (p1.mass / mSum);
          p2.y += normY * overlap * (p1.mass / mSum);

          // Rzut prędkości względnej na normalną zderzenia
          const relVx = p2.vx - p1.vx;
          const relVy = p2.vy - p1.vy;
          const velNormal = relVx * normX + relVy * normY;

          // Odbicie sprężyste tylko jeśli cząstki zbliżają się do siebie
          if (velNormal < 0) {
            const impulse = (-2 * velNormal) / (1 / p1.mass + 1 / p2.mass);

            p1.vx -= (impulse / p1.mass) * normX;
            p1.vy -= (impulse / p1.mass) * normY;
            p2.vx += (impulse / p2.mass) * normX;
            p2.vy += (impulse / p2.mass) * normY;

            if (p1.isBrownian || p2.isBrownian) {
              State.totalCollisions++;
              State.recentCollisions.push(performance.now());

              if (State.currentMode === 5) {
                State.collisionSparks.push({
                  x: p1.x + normX * p1.radius,
                  y: p1.y + normY * p1.radius,
                  impX: normX * impulse * 0.1,
                  impY: normY * impulse * 0.1,
                  life: 0.35
                });
              }
            }
          }
        }
      }
    }

    // 5. Ślad i droga
    brownianParticles.forEach(p => {
      p.trailAccumulator += effDt;
      if (p.trailAccumulator >= 0.05) {
        p.trailAccumulator = 0;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 500) p.trail.shift();
      }

      const stepDist = Math.hypot(p.x - p.lastX, p.y - p.lastY);
      State.cumulativePath += stepDist;
      p.lastX = p.x;
      p.lastY = p.y;
    });

    // 6. Iskierki zderzeń (Tryb 5)
    for (let i = State.collisionSparks.length - 1; i >= 0; i--) {
      State.collisionSparks[i].life -= effDt;
      if (State.collisionSparks[i].life <= 0) {
        State.collisionSparks.splice(i, 1);
      }
    }

    // 7. Próbkowanie do wykresu r^2(t)
    State.chartTimer += effDt;
    if (State.chartTimer >= 0.1) {
      State.chartTimer = 0;
      if (brownianParticles.length > 0) {
        const bp = brownianParticles[0];
        const r2Measured = bp.displacementSq();

        const effEta = Math.max(State.viscosity, 0.005);
        const theorySlope = (1.85 * State.temp) / (effEta * 100 * bp.radius);
        const r2Theory = 4 * theorySlope * State.simTime;

        State.chartData.push({
          t: State.simTime,
          r2: r2Measured,
          r2Theory: r2Theory
        });

        // Stabilne downsamplowanie – wykres nigdy nie gubi historii od t=0 i nie ucieka w prawo
        if (State.chartData.length > 1000) {
          State.chartData = State.chartData.filter((_, idx) => idx % 2 === 0);
        }
      }
    }
  }

  /* ==========================================================================
     5. RENDEROWANIE GŁÓWNEGO CANVASU (JEDNOKOLOROWE KULKI BEZ GRADIENTÓW)
     ========================================================================== */

  function renderSimulation() {
    const ctx = DOM.simCtx;
    ctx.save();
    ctx.scale(simDpr, simDpr);
    ctx.clearRect(0, 0, simWidth, simHeight);

    // Tło
    if (State.theme === 'dark-modern') {
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, simWidth, simHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const step = 45;
      ctx.beginPath();
      for (let x = step; x < simWidth; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, simHeight); }
      for (let y = step; y < simHeight; y += step) { ctx.moveTo(0, y); ctx.lineTo(simWidth, y); }
      ctx.stroke();
    } else if (State.theme === 'light-modern') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, simWidth, simHeight);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      const step = 45;
      ctx.beginPath();
      for (let x = step; x < simWidth; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, simHeight); }
      for (let y = step; y < simHeight; y += step) { ctx.moveTo(0, y); ctx.lineTo(simWidth, y); }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#faf6ea';
      ctx.fillRect(0, 0, simWidth, simHeight);

      ctx.strokeStyle = 'rgba(120, 53, 15, 0.07)';
      ctx.lineWidth = 0.5;
      for (let x = 12; x < simWidth; x += 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, simHeight); ctx.stroke(); }
      for (let y = 12; y < simHeight; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(simWidth, y); ctx.stroke(); }
    }

    // Ścianka działowa w Trybie 6
    if (State.currentMode === 6) {
      const slitSize = 90;
      const slitTop = (simHeight - slitSize) / 2;
      const slitBottom = (simHeight + slitSize) / 2;
      const wallX = simWidth / 2;
      const wallThick = 6;

      ctx.fillStyle = State.theme === 'textbook' ? '#2d3748' : '#334155';
      ctx.fillRect(wallX - wallThick / 2, 0, wallThick, slitTop);
      ctx.fillRect(wallX - wallThick / 2, slitBottom, wallThick, simHeight - slitBottom);

      ctx.fillStyle = State.theme === 'dark-modern' ? '#94a3b8' : '#64748b';
      ctx.font = '10px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText('SZCZELINA', wallX, slitTop + slitSize / 2 + 3);
    }

    // Okrąg teoretyczny zasięgu r = sqrt(4Dt)
    if (State.showTheoryCircle && brownianParticles.length > 0) {
      const bp = brownianParticles[0];
      const effEta = Math.max(State.viscosity, 0.005);
      const theorySlope = (1.85 * State.temp) / (effEta * 100 * bp.radius);
      const theoreticalRadius = Math.sqrt(4 * theorySlope * Math.max(State.simTime, 0.01));

      ctx.save();
      ctx.beginPath();
      ctx.arc(bp.startX, bp.startY, theoreticalRadius, 0, Math.PI * 2);
      ctx.strokeStyle = State.theme === 'textbook' ? 'rgba(136, 19, 55, 0.5)' : 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bp.startX, bp.startY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();

      ctx.font = '10px var(--font-mono)';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`r_teor ≈ ${Math.round(theoreticalRadius)} px`, bp.startX + 6, bp.startY - theoreticalRadius - 4);
      ctx.restore();
    }

    // Ślad trajektorii
    if (State.showTrail) {
      brownianParticles.forEach(p => {
        if (p.trail.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.lineTo(p.x, p.y);

          if (State.theme === 'dark-modern') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2.2;
          } else if (State.theme === 'light-modern') {
            ctx.strokeStyle = p.id === 2 ? '#d97706' : '#4f46e5';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = p.id === 2 ? '#1e3a8a' : '#881337';
            ctx.lineWidth = 1.5;
          }
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Rój cząsteczek cieczy – PŁASKIE JEDNOKOLOROWE DYSKI
    if (State.currentMode !== 2) {
      const vTh = getThermalSpeed(State.temp);

      for (let i = 0; i < solventMolecules.length; i++) {
        const m = solventMolecules[i];

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);

        if (State.showThermalVision) {
          const ratio = Math.min(m.speed() / (vTh * 1.8), 1);
          if (ratio < 0.25) ctx.fillStyle = '#3b82f6';
          else if (ratio < 0.5) ctx.fillStyle = '#06b6d4';
          else if (ratio < 0.75) ctx.fillStyle = '#eab308';
          else ctx.fillStyle = '#ef4444';
        } else if (State.theme === 'dark-modern') {
          ctx.fillStyle = '#38bdf8';
        } else if (State.theme === 'light-modern') {
          ctx.fillStyle = '#475569';
        } else {
          ctx.fillStyle = '#334155';
        }
        ctx.fill();

        if (State.showVectors || State.currentMode === 5) {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x + m.vx * 0.08, m.y + m.vy * 0.08);
          ctx.strokeStyle = State.theme === 'dark-modern' ? 'rgba(0, 242, 254, 0.45)' : 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Cząstki Browna – NOWOCZESNE JEDNOKOLOROWE DYSKI (BEZ GRADIENTÓW!)
    brownianParticles.forEach(bp => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);

      // Płaski, solidny nowoczesny kolor
      ctx.fillStyle = bp.color;
      ctx.fill();

      // Wyrazista biała obwódka
      ctx.strokeStyle = State.theme === 'textbook' ? '#1a202c' : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dyskretny środek masy
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = State.theme === 'textbook' ? '#1a202c' : '#ffffff';
      ctx.fill();

      // Wektor prędkości
      if (State.showVectors || State.currentMode === 5) {
        ctx.beginPath();
        ctx.moveTo(bp.x, bp.y);
        ctx.lineTo(bp.x + bp.vx * 0.28, bp.y + bp.vy * 0.28);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
    });

    // Iskierki zderzeń (Tryb 5)
    if (State.currentMode === 5) {
      State.collisionSparks.forEach(s => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4 * (s.life / 0.35), 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.impX, s.y + s.impY);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    }

    // Wskaźnik przeciągania myszą / dotykiem (Flick)
    if (State.isDragging && State.flickParticle) {
      const p = State.flickParticle;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(State.dragCurrent.x, State.dragCurrent.y);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /* ==========================================================================
     6. RENDEROWANIE WYKRESÓW LIVE (STABILNY OSCYLOSKOP BEZ ZANIKANIA)
     ========================================================================== */

  function renderDisplacementChart(ctx) {
    const padL = 55, padR = 20, padT = 16, padB = 34;
    const pW = chartWidth - padL - padR;
    const pH = chartHeight - padT - padB;

    ctx.strokeStyle = State.theme === 'textbook' ? '#2d3748' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, pW, pH);

    // Zakres czasu od 0 do aktualnego czasu (minimum 8 sekund)
    const maxT = Math.max(State.simTime, 8);

    let maxR2 = 400;
    for (let i = 0; i < State.chartData.length; i++) {
      const d = State.chartData[i];
      if (d.r2 > maxR2) maxR2 = d.r2;
      if (d.r2Theory > maxR2) maxR2 = d.r2Theory;
    }
    maxR2 *= 1.15; // 15% marginesu u góry

    // Siatka osi Y
    ctx.font = '10px var(--font-mono)';
    ctx.fillStyle = State.theme === 'dark-modern' ? '#94a3b8' : '#475569';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = (maxR2 / 4) * i;
      const y = padT + pH - (i / 4) * pH;
      ctx.beginPath();
      ctx.strokeStyle = State.theme === 'textbook' ? 'rgba(120, 53, 15, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.moveTo(padL, y); ctx.lineTo(padL + pW, y); ctx.stroke();
      ctx.fillText(Math.round(val).toString(), padL - 6, y + 3);
    }

    // Siatka osi X
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const val = (maxT / 5) * i;
      const x = padL + (i / 5) * pW;
      ctx.beginPath();
      ctx.strokeStyle = State.theme === 'textbook' ? 'rgba(120, 53, 15, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.moveTo(x, padT); ctx.lineTo(x, padT + pH); ctx.stroke();
      ctx.fillText(`${val.toFixed(1)}s`, x, padT + pH + 16);
    }

    if (State.chartData.length < 2) return;

    // Przycięcie do obszaru wykresu – linie NIGDY nie wyjdą poza obrys ramki
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, pW, pH);
    ctx.clip();

    // 1. Teoria: linia przerywana od początku do końca
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = State.theme === 'textbook' ? '#881337' : '#f59e0b';
    ctx.lineWidth = 1.8;

    for (let i = 0; i < State.chartData.length; i++) {
      const d = State.chartData[i];
      const x = padL + (d.t / maxT) * pW;
      const y = padT + pH - Math.min(pH, Math.max(0, (d.r2Theory / maxR2) * pH));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Pomiar rzeczywisty: linia ciągła od t=0
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = State.theme === 'textbook' ? '#1e3a8a' : (State.theme === 'light-modern' ? '#059669' : '#00f2fe');
    ctx.lineWidth = 2;

    for (let i = 0; i < State.chartData.length; i++) {
      const d = State.chartData[i];
      const x = padL + (d.t / maxT) * pW;
      const y = padT + pH - Math.min(pH, Math.max(0, (d.r2 / maxR2) * pH));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  function renderHistogramChart(ctx) {
    const padL = 50, padR = 20, padT = 16, padB = 34;
    const pW = chartWidth - padL - padR;
    const pH = chartHeight - padT - padB;

    ctx.strokeStyle = State.theme === 'textbook' ? '#2d3748' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, pW, pH);

    const numBins = 16;
    const maxSpeed = Math.sqrt(State.temp / 300) * 260;
    const binW = maxSpeed / numBins;
    const bins = new Array(numBins).fill(0);

    for (let i = 0; i < solventMolecules.length; i++) {
      const v = solventMolecules[i].speed();
      const bIdx = Math.min(numBins - 1, Math.floor(v / binW));
      bins[bIdx]++;
    }

    const maxBin = Math.max(...bins, 10);
    const barW = pW / numBins;

    for (let i = 0; i < numBins; i++) {
      const bH = (bins[i] / maxBin) * (pH - 10);
      const bx = padL + i * barW;
      const by = padT + pH - bH;

      ctx.fillStyle = State.theme === 'textbook' ? '#854d0e' : (State.theme === 'light-modern' ? '#4f46e5' : '#38bdf8');
      ctx.fillRect(bx + 1.5, by, barW - 3, bH);
    }

    // Krzywa Maxwella 2D
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    const vPeak = Math.sqrt(State.temp / 300) * 90;

    for (let x = 0; x <= pW; x += 4) {
      const v = (x / pW) * maxSpeed;
      const val = (v / (vPeak * vPeak)) * Math.exp(-(v * v) / (2 * vPeak * vPeak));
      const peak = (1 / vPeak) * Math.exp(-0.5);
      const y = padT + pH - (val / peak) * (pH * 0.85);

      if (x === 0) ctx.moveTo(padL + x, y);
      else ctx.lineTo(padL + x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.font = '10px var(--font-mono)';
    ctx.fillStyle = State.theme === 'dark-modern' ? '#94a3b8' : '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('0', padL, padT + pH + 15);
    ctx.fillText(`${Math.round(maxSpeed)} px/s`, padL + pW, padT + pH + 15);
  }

  function renderChart() {
    const ctx = DOM.chartCtx;
    ctx.save();
    ctx.scale(chartDpr, chartDpr);
    ctx.clearRect(0, 0, chartWidth, chartHeight);

    ctx.fillStyle = State.theme === 'dark-modern' ? '#050811' : (State.theme === 'light-modern' ? '#f8fafc' : '#faf6ea');
    ctx.fillRect(0, 0, chartWidth, chartHeight);

    if (State.chartView === 'displacement') {
      renderDisplacementChart(ctx);
    } else {
      renderHistogramChart(ctx);
    }

    ctx.restore();
  }

  /* ==========================================================================
     7. TELEMETRIA I CYFROWE LICZNIKI
     ========================================================================== */

  let lastMeterUpdate = 0;

  function updateTelemetry(now) {
    if (now - lastMeterUpdate < 80) return;
    lastMeterUpdate = now;

    DOM.meterTime.textContent = `${State.simTime.toFixed(1)} s`;

    const tWindow = now - 1000;
    while (State.recentCollisions.length > 0 && State.recentCollisions[0] < tWindow) {
      State.recentCollisions.shift();
    }
    State.collisionRate = State.recentCollisions.length;

    DOM.meterCollisions.textContent = State.totalCollisions.toLocaleString();
    DOM.meterColRate.textContent = `${State.collisionRate} zderzeń/s`;

    if (brownianParticles.length > 0) {
      const bp = brownianParticles[0];
      DOM.meterSpeed.textContent = `${bp.speed().toFixed(2)} px/s`;
      DOM.meterDisp.textContent = `${bp.displacement().toFixed(1)} px`;
      DOM.meterDispSq.textContent = `${Math.round(bp.displacementSq())} px²`;
      DOM.meterPath.textContent = `${Math.round(State.cumulativePath)} px`;
    }

    DOM.badgeFps.textContent = `${State.fps} FPS`;
    DOM.hudStatusText.textContent = State.isRunning ? 'LABORATORIUM' : 'LABORATORIUM (PAUZA)';
  }

  /* ==========================================================================
     8. PĘTLA GŁÓWNA
     ========================================================================== */

  function loop(now) {
    const dt = (now - State.realTimeLast) / 1000;
    State.realTimeLast = now;

    State.fpsFrames++;
    State.fpsTimer += dt;
    if (State.fpsTimer >= 0.5) {
      State.fps = Math.round(State.fpsFrames / State.fpsTimer);
      State.fpsFrames = 0;
      State.fpsTimer = 0;
    }

    if (State.isRunning || State.stepRequested) {
      updatePhysics(dt);
      State.stepRequested = false;
    }

    renderSimulation();
    renderChart();
    updateTelemetry(now);

    requestAnimationFrame(loop);
  }

  /* ==========================================================================
     9. RESPONSYWNE SKALOWANIE CANVASÓW
     ========================================================================== */

  function resizeCanvases() {
    const simRect = DOM.simViewport.getBoundingClientRect();
    if (simRect.width > 0) {
      const oldW = simWidth;
      const oldH = simHeight;

      simWidth = simRect.width;
      simHeight = Math.round(Math.max(240, Math.min(simWidth * 0.52, 440)));
      simDpr = window.devicePixelRatio || 1;

      DOM.simCanvas.width = simWidth * simDpr;
      DOM.simCanvas.height = simHeight * simDpr;
      DOM.simCanvas.style.width = `${simWidth}px`;
      DOM.simCanvas.style.height = `${simHeight}px`;

      if (oldW > 0 && oldH > 0 && (oldW !== simWidth || oldH !== simHeight)) {
        const scX = simWidth / oldW;
        const scY = simHeight / oldH;
        const all = [...brownianParticles, ...solventMolecules];
        all.forEach(p => {
          p.x = Math.max(p.radius, Math.min(simWidth - p.radius, p.x * scX));
          p.y = Math.max(p.radius, Math.min(simHeight - p.radius, p.y * scY));
          p.startX = p.startX * scX;
          p.startY = p.startY * scY;
          p.trail.forEach(pt => {
            pt.x = pt.x * scX;
            pt.y = pt.y * scY;
          });
        });
      }
    }

    const chartRect = DOM.chartWrapper.getBoundingClientRect();
    if (chartRect.width > 0) {
      chartWidth = chartRect.width;
      chartHeight = Math.round(Math.max(160, Math.min(chartWidth * 0.28, 200)));
      chartDpr = window.devicePixelRatio || 1;

      DOM.chartCanvas.width = chartWidth * chartDpr;
      DOM.chartCanvas.height = chartHeight * chartDpr;
      DOM.chartCanvas.style.width = `${chartWidth}px`;
      DOM.chartCanvas.style.height = `${chartHeight}px`;
    }
  }

  /* ==========================================================================
     10. SCROLLSPY (DYNAMICZNE PODŚWIETLANIE AKTYWNEJ SEKCJI W NAWIGACJI)
     ========================================================================== */

  function updateActiveNavLink() {
    const sectionIds = ['wstep', 'historia', 'fizyka', 'laboratorium', 'matematyka'];
    const scrollPos = window.scrollY + 130;

    let activeId = sectionIds[0];
    for (let i = 0; i < sectionIds.length; i++) {
      const el = document.getElementById(sectionIds[i]);
      if (el) {
        if (scrollPos >= el.offsetTop) {
          activeId = sectionIds[i];
        }
      }
    }

    DOM.navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === activeId);
    });
  }

  /* ==========================================================================
     11. OBSŁUGA MOTYWÓW
     ========================================================================== */

  function applyTheme(name) {
    State.theme = name;
    DOM.html.setAttribute('data-theme', name);
    if (DOM.themeSelect) DOM.themeSelect.value = name;
    if (DOM.themeButtons) {
      DOM.themeButtons.forEach(btn => {
        const isActive = btn.dataset.theme === name;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
    localStorage.setItem('brownian_theme', name);
  }

  /* ==========================================================================
     12. TRYBY BADAŃ I PRESETY
     ========================================================================== */

  const ModeTitles = {
    1: 'Tryb 1: Widok Atomowy (Klasyczny)',
    2: 'Tryb 2: Mikroskop Browna (Ukryte Atomy)',
    3: 'Tryb 3: Porównanie Mas (Inercja Newtona)',
    4: 'Tryb 4: Dyfuzja Kropli Atramentu',
    5: 'Tryb 5: Rentgen Wektorowy (Siła & Pęd)',
    6: 'Tryb 6: Komora ze Szczeliną'
  };

  function setMode(modeNum) {
    State.currentMode = parseInt(modeNum, 10);
    DOM.badgeMode.textContent = ModeTitles[State.currentMode] || `Tryb ${State.currentMode}`;

    DOM.modeTiles.forEach(tile => {
      tile.classList.toggle('active', parseInt(tile.dataset.mode, 10) === State.currentMode);
    });

    initParticles();
  }

  function applyPreset(key) {
    if (key === 'cold-water') {
      State.temp = 120;
      State.mass = 50;
      State.radius = 22;
      State.solventCount = 220;
      State.viscosity = 0.03;
      setMode(1);
    } else if (key === 'hot-water') {
      State.temp = 900;
      State.mass = 50;
      State.radius = 22;
      State.solventCount = 220;
      State.viscosity = 0.005;
      setMode(1);
    } else if (key === 'honey') {
      State.temp = 300;
      State.mass = 70;
      State.radius = 24;
      State.solventCount = 250;
      State.viscosity = 0.07;
      setMode(1);
    } else if (key === 'boulder') {
      State.temp = 300;
      State.mass = 450;
      State.radius = 48;
      State.solventCount = 200;
      State.viscosity = 0.015;
      setMode(1);
    }

    syncSliders();
  }

  function syncSliders() {
    DOM.sliderTemp.value = State.temp;
    DOM.valTemp.textContent = `${State.temp} K`;

    DOM.sliderMass.value = State.mass;
    DOM.valMass.textContent = `${State.mass} m₀`;

    DOM.sliderRadius.value = State.radius;
    DOM.valRadius.textContent = `${State.radius} px`;

    DOM.sliderCount.value = State.solventCount;
    DOM.valCount.textContent = `${State.solventCount}`;

    DOM.sliderViscosity.value = State.viscosity;
    DOM.valViscosity.textContent = State.viscosity === 0 ? '0 (Próżnia)' : `${State.viscosity}`;

    DOM.sliderTimescale.value = State.timeScale;
    DOM.valTimescale.textContent = `${State.timeScale.toFixed(1)}×`;
  }

  /* ==========================================================================
     13. 5 MISJI BADAWCZYCH
     ========================================================================== */

  function loadMission(mId) {
    const id = parseInt(mId, 10);

    if (id === 1) {
      State.temp = 400;
      State.mass = 40;
      State.radius = 22;
      State.viscosity = 0.015;
      setMode(2);
    } else if (id === 2) {
      State.temp = 350;
      State.viscosity = 0.015;
      setMode(3);
    } else if (id === 3) {
      State.temp = 100;
      State.showThermalVision = true;
      DOM.chkThermalVision.checked = true;
      setMode(1);
    } else if (id === 4) {
      State.temp = 450;
      State.mass = 45;
      State.radius = 20;
      State.showTrail = true;
      DOM.chkTrail.checked = true;
      setMode(1);
    } else if (id === 5) {
      State.temp = 350;
      State.mass = 30;
      State.radius = 18;
      State.showTheoryCircle = true;
      DOM.chkTheoryCircle.checked = true;
      setMode(1);
    }

    syncSliders();

    if (State.layout === 'lecture') {
      DOM.simViewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const btn = document.querySelector(`.btn-load-mission[data-mission-id="${id}"]`);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Załadowano parametry do Laboratorium!';
      setTimeout(() => btn.innerHTML = orig, 1800);
    }
  }

  /* ==========================================================================
     14. DEKODER WZORU & SZUFLADA MISJI BADAWCZYCH
     ========================================================================== */

  function setDecoder(symbol) {
    State.currentDecoderSymbol = symbol;
    const data = FormulaDecoderData[symbol];
    if (!data) return;

    DOM.decoderButtons.forEach(b => b.classList.toggle('active', b.dataset.symbol === symbol));
    DOM.decoderTitle.textContent = data.title;
    DOM.decoderLocation.textContent = data.location;
    DOM.decoderText.innerHTML = `<p>${data.text}</p>`;

    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById('decoder-details'), {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        strict: false,
        throwOnError: false
      });
    }
  }

  function toggleMissionsDrawer(forceOpen) {
    if (!DOM.missionsDrawer) return;

    const isCurrentlyOpen = DOM.missionsDrawer.classList.contains('open');
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isCurrentlyOpen;

    DOM.missionsDrawer.classList.toggle('open', shouldOpen);
    if (DOM.missionsArrow) {
      DOM.missionsArrow.innerHTML = shouldOpen ? '<i class="ph-bold ph-caret-up"></i>' : '<i class="ph-bold ph-caret-down"></i>';
    }
    if (DOM.btnToggleMissions) DOM.btnToggleMissions.classList.toggle('active', shouldOpen);

    setTimeout(resizeCanvases, 260);
  }

  /* ==========================================================================
     15. NASŁUCHIWANIE ZDARZEŃ
     ========================================================================== */

  function setupEvents() {
    // Motyw
    if (DOM.themeSelect) {
      DOM.themeSelect.addEventListener('change', e => applyTheme(e.target.value));
    }
    if (DOM.themeButtons) {
      DOM.themeButtons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
      });
    }

    // Scrollspy dla nawigacji
    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    DOM.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        DOM.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Przyciski symulacji
    DOM.btnPlayPause.addEventListener('click', () => {
      State.isRunning = !State.isRunning;
      DOM.btnPlayGlyph.innerHTML = State.isRunning ? '<i class="ph-bold ph-pause"></i>' : '<i class="ph-bold ph-play"></i>';
      DOM.btnPlayText.textContent = State.isRunning ? 'Pauza' : 'Start';
    });

    DOM.btnStep.addEventListener('click', () => {
      State.isRunning = false;
      State.stepRequested = true;
      DOM.btnPlayGlyph.innerHTML = '<i class="ph-bold ph-play"></i>';
      DOM.btnPlayText.textContent = 'Start';
    });

    DOM.btnResetPos.addEventListener('click', resetPositions);
    DOM.btnClearTrail.addEventListener('click', clearTrails);
    DOM.btnRestartSim.addEventListener('click', initParticles);

    // Zakładki Tabs
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        DOM.tabButtons.forEach(b => b.classList.toggle('active', b === btn));
        DOM.tabPanes.forEach(p => p.classList.toggle('active', p.id === targetId));
      });
    });

    // Suwaki
    DOM.sliderTemp.addEventListener('input', e => {
      State.temp = parseInt(e.target.value, 10);
      DOM.valTemp.textContent = `${State.temp} K`;
    });

    DOM.sliderMass.addEventListener('input', e => {
      State.mass = parseInt(e.target.value, 10);
      DOM.valMass.textContent = `${State.mass} m₀`;
      brownianParticles.forEach(p => p.mass = State.mass);
    });

    DOM.sliderRadius.addEventListener('input', e => {
      State.radius = parseInt(e.target.value, 10);
      DOM.valRadius.textContent = `${State.radius} px`;
      brownianParticles.forEach(p => p.radius = State.radius);
    });

    DOM.sliderCount.addEventListener('input', e => {
      State.solventCount = parseInt(e.target.value, 10);
      DOM.valCount.textContent = `${State.solventCount}`;
      initParticles();
    });

    DOM.sliderViscosity.addEventListener('input', e => {
      State.viscosity = parseFloat(e.target.value);
      DOM.valViscosity.textContent = State.viscosity === 0 ? '0 (Próżnia)' : `${State.viscosity}`;
    });

    DOM.sliderTimescale.addEventListener('input', e => {
      State.timeScale = parseFloat(e.target.value);
      DOM.valTimescale.textContent = `${State.timeScale.toFixed(1)}×`;
    });

    // Presety & Tryby
    DOM.presetButtons.forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
    DOM.modeTiles.forEach(tile => tile.addEventListener('click', () => setMode(tile.dataset.mode)));

    // Checkboxy
    DOM.chkTrail.addEventListener('change', e => State.showTrail = e.target.checked);
    DOM.chkVectors.addEventListener('change', e => State.showVectors = e.target.checked);
    DOM.chkTheoryCircle.addEventListener('change', e => State.showTheoryCircle = e.target.checked);
    DOM.chkThermalVision.addEventListener('change', e => State.showThermalVision = e.target.checked);

    // Przełącznik wykresu
    DOM.btnChartDisp.addEventListener('click', () => {
      State.chartView = 'displacement';
      DOM.btnChartDisp.classList.add('active');
      DOM.btnChartHist.classList.remove('active');
      DOM.chartMainTitle.textContent = 'Kwadrat Przemieszczenia r²(t) vs Teoria';
      DOM.chartLegend.style.display = 'flex';
    });

    DOM.btnChartHist.addEventListener('click', () => {
      State.chartView = 'histogram';
      DOM.btnChartHist.classList.add('active');
      DOM.btnChartDisp.classList.remove('active');
      DOM.chartMainTitle.textContent = 'Histogram Prędkości: Rozkład Maxwella-Boltzmanna';
      DOM.chartLegend.style.display = 'none';
    });

    // Pointer na Canvasie
    function getCanvasCoords(e) {
      const rect = DOM.simCanvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (cx - rect.left) * (simWidth / rect.width),
        y: (cy - rect.top) * (simHeight / rect.height)
      };
    }

    function onDown(e) {
      const pos = getCanvasCoords(e);
      State.isDragging = true;
      State.dragStart = pos;
      State.dragCurrent = pos;

      State.flickParticle = null;
      for (const bp of brownianParticles) {
        if (Math.hypot(pos.x - bp.x, pos.y - bp.y) < bp.radius * 2.5) {
          State.flickParticle = bp;
          break;
        }
      }
      if (!State.flickParticle && brownianParticles.length > 0) {
        State.flickParticle = brownianParticles[0];
      }
    }

    function onMove(e) {
      if (!State.isDragging) return;
      State.dragCurrent = getCanvasCoords(e);
    }

    function onUp() {
      if (!State.isDragging) return;
      State.isDragging = false;

      if (State.flickParticle) {
        const dx = State.dragCurrent.x - State.dragStart.x;
        const dy = State.dragCurrent.y - State.dragStart.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 6) {
          State.flickParticle.vx += dx * 5.2;
          State.flickParticle.vy += dy * 5.2;
        } else {
          const a = Math.random() * Math.PI * 2;
          State.flickParticle.vx += Math.cos(a) * 80;
          State.flickParticle.vy += Math.sin(a) * 80;
        }
      }
      State.flickParticle = null;
    }

    DOM.simCanvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    DOM.simCanvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    // Dekoder & Misje
    DOM.decoderButtons.forEach(b => b.addEventListener('click', () => setDecoder(b.dataset.symbol)));
    DOM.btnLoadMissions.forEach(b => b.addEventListener('click', () => loadMission(b.dataset.missionId)));

    // Szuflada misji w laboratorium
    if (DOM.btnToggleMissions) {
      DOM.btnToggleMissions.addEventListener('click', () => toggleMissionsDrawer());
    }
    if (DOM.btnCloseMissions) {
      DOM.btnCloseMissions.addEventListener('click', () => toggleMissionsDrawer(false));
    }
    if (DOM.navMissionsLink) {
      DOM.navMissionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.simViewport.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toggleMissionsDrawer(true);
      });
    }

    // Skrót klawiaturowy: Spacja zatrzymuje / wznawia
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        DOM.btnPlayPause.click();
      }
    });

    // Płynny resize
    window.addEventListener('resize', resizeCanvases);
  }

  /* ==========================================================================
     16. INICJALIZACJA STARTOWA & OBSŁUGA KATEX
     ========================================================================== */

  function triggerMathRender() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        strict: false,
        throwOnError: false
      });
      setDecoder(State.currentDecoderSymbol || 'T');
    }
  }

  function start() {
    applyTheme(State.theme);

    resizeCanvases();
    initParticles();

    setDecoder('T');
    setupEvents();
    updateActiveNavLink();

    triggerMathRender();

    requestAnimationFrame(loop);
  }

  window.addEventListener('load', triggerMathRender);
  setTimeout(triggerMathRender, 200);
  setTimeout(triggerMathRender, 600);
  setTimeout(triggerMathRender, 1500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
