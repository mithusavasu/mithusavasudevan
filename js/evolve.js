/* Neuroevolution lab: cars with 5 distance sensors + a tiny neural network (6 -> 8 -> 2)
   learn to drive by a genetic algorithm. Fitness = distance covered in a fixed time,
   so the population is pushed to be both safe AND fast. Runs entirely in the browser. */
(function () {
  const { W, H } = Tracks;
  const SENS = [-1.1, -0.55, 0, 0.55, 1.1];
  const RAY = 170, NI = 6, NH = 8, NO = 2;
  const GLEN = NI * NH + NH + NH * NO + NO, B1 = NI * NH, W2 = B1 + NH, B2 = W2 + NH * NO;
  const VMAX = 5.5, ACC = 0.08, BRK = 0.2, DRAG = 0.004, GRIP = 0.17;
  const MAX_STEPS = 1800, STALL = 150;

  const $ = (id) => document.getElementById(id);
  const canvas = $('evoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nnCanvas = $('nnCanvas'), nnCtx = nnCanvas.getContext('2d');
  const chartCanvas = $('fitChart'), chartCtx = chartCanvas.getContext('2d');

  const state = {
    trackKey: 'harbour', track: null, grid: null, trackImg: null,
    popSize: 50, mutation: 0.1, speed: 1, running: false, visible: false,
    gen: 1, steps: 0, cars: [], hist: [], bestLap: null, keepBrains: false
  };

  /* ---------- helpers ---------- */
  function randn() {
    let u = 0; while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }
  function newGenome() {
    const g = new Float32Array(GLEN);
    for (let i = 0; i < GLEN; i++) g[i] = randn() * 0.8;
    return g;
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function forward(g, x, h, out) {
    for (let j = 0; j < NH; j++) {
      let s = g[B1 + j];
      for (let i = 0; i < NI; i++) s += g[j * NI + i] * x[i];
      h[j] = Math.tanh(s);
    }
    for (let k = 0; k < NO; k++) {
      let s = g[B2 + k];
      for (let j = 0; j < NH; j++) s += g[W2 + k * NH + j] * h[j];
      out[k] = Math.tanh(s);
    }
  }

  /* ---------- track ---------- */
  function buildTrack() {
    const t = Tracks.get(state.trackKey);
    state.track = t;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d');
    tracePath(o, t);
    o.lineWidth = t.width; o.lineJoin = 'round'; o.strokeStyle = '#000'; o.stroke();
    const data = o.getImageData(0, 0, W, H).data;
    const grid = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) grid[i] = data[i * 4 + 3] > 128 ? 1 : 0;
    state.grid = grid;
    renderTrackImage();
  }
  function tracePath(c, t) {
    c.beginPath();
    t.pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
  }
  function renderTrackImage() {
    const t = state.track;
    const off = document.createElement('canvas');
    off.width = W * 2; off.height = H * 2;
    const c = off.getContext('2d');
    c.scale(2, 2);
    c.lineJoin = 'round';
    tracePath(c, t);
    c.lineWidth = t.width + 6; c.strokeStyle = css('--kerb-a'); c.stroke();
    c.setLineDash([10, 10]); c.strokeStyle = css('--kerb-b'); c.stroke(); c.setLineDash([]);
    c.lineWidth = t.width; c.strokeStyle = css('--asphalt'); c.stroke();
    c.lineWidth = 1; c.setLineDash([6, 10]); c.strokeStyle = css('--line'); c.stroke(); c.setLineDash([]);
    // start / finish
    const p = t.pts[0], a = t.heading[0] + Math.PI / 2;
    c.lineWidth = 4; c.strokeStyle = css('--text');
    c.beginPath();
    c.moveTo(p[0] + Math.cos(a) * t.width / 2, p[1] + Math.sin(a) * t.width / 2);
    c.lineTo(p[0] - Math.cos(a) * t.width / 2, p[1] - Math.sin(a) * t.width / 2);
    c.stroke();
    state.trackImg = off;
  }
  const onTrack = (x, y) => {
    const ix = x | 0, iy = y | 0;
    return ix >= 0 && iy >= 0 && ix < W && iy < H && state.grid[iy * W + ix] === 1;
  };

  /* ---------- cars ---------- */
  function makeCar(g) {
    const t = state.track, p = t.pts[0];
    return {
      g, x: p[0], y: p[1], a: t.heading[0], v: 0, alive: true, idx: 0, prog: 0, maxProg: 0,
      lastImprove: 0, lapStep: null, sensors: new Float32Array(5),
      x6: new Float32Array(NI), h: new Float32Array(NH), out: new Float32Array(NO)
    };
  }
  function spawn(genomes) {
    state.cars = genomes.map(makeCar);
    state.steps = 0;
  }

  function stepCar(c) {
    const t = state.track, n = t.n;
    for (let s = 0; s < 5; s++) {
      const ang = c.a + SENS[s], dx = Math.cos(ang), dy = Math.sin(ang);
      let d = 0;
      while (d < RAY && onTrack(c.x + dx * d, c.y + dy * d)) d += 5;
      c.sensors[s] = Math.min(d, RAY) / RAY;
      c.x6[s] = c.sensors[s];
    }
    c.x6[5] = c.v / VMAX;
    forward(c.g, c.x6, c.h, c.out);
    const steer = c.out[0], thr = c.out[1];
    c.v += thr > 0 ? thr * ACC : thr * BRK;
    c.v -= c.v * DRAG;
    c.v = Math.max(0, Math.min(VMAX, c.v));
    const yawCap = Math.min(0.09, GRIP / Math.max(c.v, 0.1)) * Math.min(1, c.v / 0.6);
    c.a += steer * yawCap;
    c.x += Math.cos(c.a) * c.v;
    c.y += Math.sin(c.a) * c.v;

    if (!onTrack(c.x, c.y)) { c.alive = false; return; }

    // progress: nearest centreline index near the previous one
    let best = c.idx, bd = Infinity;
    for (let o = -12; o <= 12; o++) {
      const i = (c.idx + o + n) % n, p = t.pts[i];
      const d = (p[0] - c.x) ** 2 + (p[1] - c.y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    let delta = best - c.idx;
    if (delta < -n / 2) delta += n;
    if (delta > n / 2) delta -= n;
    c.idx = best;
    c.prog += delta;
    if (c.prog > c.maxProg) {
      if (c.lapStep === null && c.prog >= n) {
        c.lapStep = state.steps;
        if (state.bestLap === null || c.lapStep < state.bestLap) state.bestLap = c.lapStep;
      }
      c.maxProg = c.prog; c.lastImprove = state.steps;
    }
    if (state.steps - c.lastImprove > STALL || c.prog < c.maxProg - 25) c.alive = false;
  }

  /* ---------- evolution ---------- */
  function fitness(c) { return c.maxProg / state.track.n; } // laps covered
  function nextGen() {
    const sorted = state.cars.slice().sort((a, b) => fitness(b) - fitness(a));
    const fits = sorted.map(fitness);
    state.hist.push({ best: fits[0], mean: fits.reduce((a, b) => a + b, 0) / fits.length });
    if (state.hist.length > 60) state.hist.shift();
    const N = state.popSize;
    const parents = sorted.slice(0, Math.max(4, Math.floor(sorted.length * 0.3)));
    const pick = () => {
      let b = parents[(Math.random() * parents.length) | 0];
      for (let k = 0; k < 2; k++) {
        const c = parents[(Math.random() * parents.length) | 0];
        if (fitness(c) > fitness(b)) b = c;
      }
      return b.g;
    };
    const next = [Float32Array.from(sorted[0].g), Float32Array.from(sorted[1 % sorted.length].g)];
    while (next.length < N) {
      const a = pick(), b = pick(), child = new Float32Array(GLEN);
      for (let i = 0; i < GLEN; i++) {
        child[i] = Math.random() < 0.5 ? a[i] : b[i];
        if (Math.random() < state.mutation) child[i] += randn() * 0.45;
      }
      next.push(child);
    }
    state.gen++;
    spawn(next.slice(0, N));
  }

  function reset(keep) {
    const genomes = keep && state.cars.length
      ? state.cars.map((c) => c.g)
      : Array.from({ length: state.popSize }, newGenome);
    while (genomes.length < state.popSize) genomes.push(newGenome());
    state.gen = 1; state.hist = []; state.bestLap = null;
    spawn(genomes.slice(0, state.popSize));
  }

  function tick() {
    for (let s = 0; s < state.speed; s++) {
      let alive = 0;
      for (const c of state.cars) if (c.alive) { stepCar(c); if (c.alive) alive++; }
      state.steps++;
      if (alive === 0 || state.steps >= MAX_STEPS) { nextGen(); break; }
    }
  }

  /* ---------- drawing ---------- */
  function fitCanvas(cv, w, h) {
    const dpr = window.devicePixelRatio || 1;
    const cw = cv.clientWidth, ch = h ? (cw * h) / w : cv.clientHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    }
    return { s: (cw * dpr) / w, dpr };
  }

  function leader() {
    let L = null;
    for (const c of state.cars) if (c.alive && (!L || c.prog > L.prog)) L = c;
    return L || state.cars[0];
  }

  function draw() {
    const { s } = fitCanvas(canvas, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.drawImage(state.trackImg, 0, 0, W, H);
    const L = leader(), muted = css('--muted'), acc = css('--accent'), acc2 = css('--accent-2');
    for (const c of state.cars) {
      if (!c.alive || c === L) continue;
      drawCar(c, muted, 0.45);
    }
    if (L && L.alive) {
      ctx.strokeStyle = acc2; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
      for (let k = 0; k < 5; k++) {
        const ang = L.a + SENS[k], d = L.sensors[k] * RAY;
        ctx.beginPath(); ctx.moveTo(L.x, L.y);
        ctx.lineTo(L.x + Math.cos(ang) * d, L.y + Math.sin(ang) * d); ctx.stroke();
        ctx.beginPath(); ctx.arc(L.x + Math.cos(ang) * d, L.y + Math.sin(ang) * d, 2.5, 0, 7); ctx.fillStyle = acc2; ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawCar(L, acc, 1, true);
    }
    const alive = state.cars.filter((c) => c.alive).length;
    $('evoGen').textContent = state.gen;
    $('evoAlive').textContent = `${alive}/${state.cars.length}`;
    const bestNow = state.hist.length ? Math.max(...state.hist.map((h) => h.best)) : 0;
    const bestLaps = Math.max(bestNow, L ? L.maxProg / state.track.n : 0);
    $('evoBest').textContent = bestLaps < 1 ? `${(bestLaps * 100).toFixed(0)}% lap` : `${bestLaps.toFixed(2)} laps`;
    $('evoLap').textContent = state.bestLap ? `${(state.bestLap / 60).toFixed(2)}s` : '—';
    drawNN(L);
    drawChart();
  }

  function drawCar(c, color, alpha, glow) {
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(c.a);
    ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(-6, -4.5); ctx.lineTo(-4, 0); ctx.lineTo(-6, 4.5); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNN(c) {
    const w = 300, h = 210;
    const { s } = fitCanvas(nnCanvas, w, h);
    nnCtx.setTransform(1, 0, 0, 1, 0, 0);
    nnCtx.clearRect(0, 0, nnCanvas.width, nnCanvas.height);
    nnCtx.setTransform(s, 0, 0, s, 0, 0);
    if (!c) return;
    const acc = css('--accent'), acc2 = css('--accent-2'), text = css('--muted'), surf = css('--surface-2');
    const col = (n, x) => Array.from({ length: n }, (_, i) => [x, 18 + ((h - 36) * (i + 0.5)) / n]);
    const L0 = col(NI, 62), L1 = col(NH, 150), L2 = col(NO, 236);
    nnCtx.lineWidth = 1;
    for (let j = 0; j < NH; j++) for (let i = 0; i < NI; i++) edge(L0[i], L1[j], c.g[j * NI + i]);
    for (let k = 0; k < NO; k++) for (let j = 0; j < NH; j++) edge(L1[j], L2[k], c.g[W2 + k * NH + j]);
    function edge(a, b, wgt) {
      nnCtx.strokeStyle = wgt > 0 ? acc : acc2;
      nnCtx.globalAlpha = Math.min(0.85, Math.abs(wgt) / 2.2);
      nnCtx.beginPath(); nnCtx.moveTo(a[0], a[1]); nnCtx.lineTo(b[0], b[1]); nnCtx.stroke();
    }
    nnCtx.globalAlpha = 1;
    const node = (p, v, label, right) => {
      nnCtx.beginPath(); nnCtx.arc(p[0], p[1], 8, 0, 7);
      nnCtx.fillStyle = surf; nnCtx.fill();
      nnCtx.globalAlpha = Math.min(1, Math.abs(v));
      nnCtx.fillStyle = v >= 0 ? acc : acc2; nnCtx.fill();
      nnCtx.globalAlpha = 1;
      nnCtx.strokeStyle = text; nnCtx.lineWidth = 1; nnCtx.stroke();
      if (label) {
        nnCtx.fillStyle = text; nnCtx.font = '10px "JetBrains Mono", monospace';
        nnCtx.textAlign = right ? 'left' : 'right'; nnCtx.textBaseline = 'middle';
        nnCtx.fillText(label, p[0] + (right ? 13 : -13), p[1]);
      }
    };
    const inLabels = ['far L', 'left', 'ahead', 'right', 'far R', 'speed'];
    L0.forEach((p, i) => node(p, c.x6[i], inLabels[i]));
    L1.forEach((p, j) => node(p, c.h[j]));
    L2.forEach((p, k) => node(p, c.out[k], k ? 'gas' : 'steer', true));
  }

  function drawChart() {
    const w = 300, h = 120;
    const { s } = fitCanvas(chartCanvas, w, h);
    chartCtx.setTransform(1, 0, 0, 1, 0, 0);
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    chartCtx.setTransform(s, 0, 0, s, 0, 0);
    const hist = state.hist, pad = 26;
    const maxY = Math.max(1, ...hist.map((d) => d.best));
    chartCtx.strokeStyle = css('--line'); chartCtx.lineWidth = 1;
    chartCtx.beginPath(); chartCtx.moveTo(pad, 8); chartCtx.lineTo(pad, h - 18); chartCtx.lineTo(w - 6, h - 18); chartCtx.stroke();
    chartCtx.fillStyle = css('--muted'); chartCtx.font = '9px "JetBrains Mono", monospace';
    chartCtx.textAlign = 'right'; chartCtx.textBaseline = 'middle';
    chartCtx.fillText(`${maxY.toFixed(1)}`, pad - 4, 10);
    chartCtx.fillText('0', pad - 4, h - 18);
    chartCtx.textAlign = 'left';
    chartCtx.fillText('laps covered per generation →', pad + 4, h - 6);
    if (hist.length < 2) return;
    const X = (i) => pad + ((w - pad - 8) * i) / (hist.length - 1);
    const Y = (v) => h - 18 - ((h - 28) * v) / maxY;
    const line = (key, color, width) => {
      chartCtx.strokeStyle = color; chartCtx.lineWidth = width; chartCtx.beginPath();
      hist.forEach((d, i) => (i ? chartCtx.lineTo(X(i), Y(d[key])) : chartCtx.moveTo(X(i), Y(d[key]))));
      chartCtx.stroke();
    };
    line('mean', css('--muted'), 1.2);
    line('best', css('--accent'), 2);
  }

  /* ---------- loop + controls ---------- */
  function loop() {
    if (state.running && state.visible) tick();
    if (state.visible) draw();
    requestAnimationFrame(loop);
  }

  function setRunning(r) {
    state.running = r;
    $('evoPlay').textContent = r ? 'Pause' : 'Resume';
    $('evoPlay').setAttribute('aria-pressed', String(r));
  }

  $('evoPlay').addEventListener('click', () => setRunning(!state.running));
  $('evoReset').addEventListener('click', () => { reset(false); setRunning(true); });
  document.querySelectorAll('[data-evo-speed]').forEach((b) =>
    b.addEventListener('click', () => {
      state.speed = +b.dataset.evoSpeed;
      document.querySelectorAll('[data-evo-speed]').forEach((x) => x.classList.toggle('on', x === b));
    }));
  document.querySelectorAll('[data-evo-track]').forEach((b) =>
    b.addEventListener('click', () => {
      state.trackKey = b.dataset.evoTrack;
      document.querySelectorAll('[data-evo-track]').forEach((x) => x.classList.toggle('on', x === b));
      buildTrack();
      reset($('evoKeep').checked);
      setRunning(true);
    }));
  $('evoMut').addEventListener('input', (e) => {
    state.mutation = e.target.value / 100;
    $('evoMutVal').textContent = `${e.target.value}%`;
  });
  $('evoPop').addEventListener('input', (e) => {
    state.popSize = +e.target.value;
    $('evoPopVal').textContent = e.target.value;
  });
  $('evoPop').addEventListener('change', () => { reset(false); setRunning(true); });
  window.addEventListener('livery', () => { if (state.track) renderTrackImage(); });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  new IntersectionObserver((es) => {
    state.visible = es[0].isIntersecting;
    if (state.visible && !state.started) {
      state.started = true;
      if (!reduce) setRunning(true);
    }
  }, { threshold: 0.15 }).observe(canvas);

  buildTrack();
  reset(false);
  setRunning(false);
  $('evoPlay').textContent = 'Start';
  requestAnimationFrame(loop);
})();
