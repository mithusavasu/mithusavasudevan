/* Pit Lab preview (setup sliders -> lap sim -> speed map, trace, optimizer)
   inside the racing tile. */
(function () {
  const { W, H } = Tracks;
  const $ = (id) => document.getElementById(id);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  }
  function fit(cv, w, h) {
    const dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = (cw * h) / w;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    }
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    const s = (cw * dpr) / w;
    c.setTransform(s, 0, 0, s, 0, 0);
    return c;
  }
  function pointAt(track, res, t) {
    // find index where cumulative time passes t
    const n = track.n, tt = res.tAt;
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tt[mid] <= t) lo = mid; else hi = mid - 1; }
    const i = lo, j = (i + 1) % n, span = (j ? tt[j] : res.time) - tt[i];
    const f = span > 0 ? (t - tt[i]) / span : 0;
    const p = track.pts[i], q = track.pts[j];
    return { i, x: p[0] + (q[0] - p[0]) * f, y: p[1] + (q[1] - p[1]) * f, v: res.v[i] + (res.v[j] - res.v[i]) * f, dv: res.v[j] - res.v[i] };
  }

  /* ================= Pit Lab section ================= */
  const S = { track: 'velocity', downforce: 50, compound: 'medium', fuel: 50, res: null, opt: null, t0: performance.now(), visible: false };

  function recompute() {
    const track = Tracks.get(S.track);
    S.res = LapSim.run(track, S);
    S.opt = S.opt && S.opt.key === S.track + S.fuel ? S.opt : { key: S.track + S.fuel, ...LapSim.optimize(track, S.fuel) };
    const r = S.res;
    $('simLap').textContent = LapSim.fmtLap(r.time);
    const gap = r.time - S.opt.best.time;
    $('simGap').textContent = gap < 0.0005 ? 'Optimal setup ✓' : `+${gap.toFixed(3)}s vs optimal`;
    $('simGap').classList.toggle('good', gap < 0.0005);
    $('simTop').textContent = `${(r.top * 3.6).toFixed(0)}`;
    $('simMin').textContent = `${(r.min * 3.6).toFixed(0)}`;
    $('simAvg').textContent = `${(r.avg * 3.6).toFixed(0)}`;
    $('dfVal').textContent = `${S.downforce}% · ClA ${r.ClA.toFixed(1)} m²`;
    $('fuelVal').textContent = `${S.fuel} kg`;
    $('simTrackName').textContent = track.name;
    $('simTrackBlurb').textContent = `${track.blurb} ${(track.length * track.mPerPx / 1000).toFixed(1)} km.`;
    drawTrace(track);
    drawSweep();
  }

  function drawMap(now) {
    const cv = $('simMap'), c = fit(cv, W, H), track = Tracks.get(S.track), r = S.res;
    const slow = css('--accent'), fast = css('--accent-2');
    let vmin = Infinity, vmax = 0;
    for (const v of r.v) { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
    c.lineCap = 'round';
    c.lineWidth = track.width + 4; c.strokeStyle = css('--asphalt');
    c.beginPath(); track.pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
    c.lineWidth = 9;
    for (let i = 0; i < track.n; i++) {
      const p = track.pts[i], q = track.pts[(i + 1) % track.n];
      c.strokeStyle = mix(slow, fast, (r.v[i] - vmin) / (vmax - vmin || 1));
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
    }
    // animated car (4x real time)
    const t = (((now - S.t0) / 1000) * 4) % r.time;
    const P = pointAt(track, r, t);
    c.fillStyle = css('--text'); c.shadowColor = css('--text'); c.shadowBlur = 14;
    c.beginPath(); c.arc(P.x, P.y, 7, 0, 7); c.fill(); c.shadowBlur = 0;
    $('simLive').textContent = `${(P.v * 3.6).toFixed(0)} km/h`;
    S.cursor = P.i;
  }

  function drawTrace(track) {
    const w = 600, h = 170, cv = $('simTrace'), c = fit(cv, w, h), r = S.res, pad = 34;
    const vmax = 105, X = (i) => pad + ((w - pad - 8) * i) / track.n, Y = (v) => h - 20 - ((h - 34) * v) / vmax;
    c.strokeStyle = css('--line'); c.lineWidth = 1;
    c.font = '10px "JetBrains Mono", monospace'; c.fillStyle = css('--muted'); c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const k of [100, 200, 300]) {
      const y = Y(k / 3.6);
      c.beginPath(); c.moveTo(pad, y); c.lineTo(w - 8, y); c.stroke();
      c.fillText(String(k), pad - 5, y);
    }
    c.textAlign = 'left'; c.fillText('km/h  ·  distance around the lap →', pad, h - 6);
    // corner limit (faint)
    c.strokeStyle = css('--muted'); c.globalAlpha = 0.35; c.setLineDash([3, 4]);
    c.beginPath(); for (let i = 0; i < track.n; i++) { const y = Y(Math.min(r.vc[i], vmax)); i ? c.lineTo(X(i), y) : c.moveTo(X(i), y); } c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;
    const grad = c.createLinearGradient(0, Y(vmax), 0, Y(0));
    grad.addColorStop(0, css('--accent-2')); grad.addColorStop(1, css('--accent'));
    c.strokeStyle = grad; c.lineWidth = 2.2;
    c.beginPath(); for (let i = 0; i < track.n; i++) { const y = Y(r.v[i]); i ? c.lineTo(X(i), y) : c.moveTo(X(i), y); } c.stroke();
  }

  function drawSweep() {
    const w = 600, h = 190, cv = $('simSweep'), c = fit(cv, w, h), pad = 66;
    const curves = S.opt.curves, all = Object.values(curves).flat().map((d) => d[1]);
    const tmin = Math.min(...all), tmax = Math.max(...all);
    const X = (p) => pad + ((w - pad - 10) * p) / 100, Y = (t) => 14 + ((h - 42) * (t - tmin)) / (tmax - tmin || 1);
    c.font = '10px "JetBrains Mono", monospace'; c.fillStyle = css('--muted'); c.textBaseline = 'middle';
    c.textAlign = 'right'; c.fillText(LapSim.fmtLap(tmin), pad - 5, Y(tmin)); c.fillText(LapSim.fmtLap(tmax), pad - 5, Y(tmax));
    c.textAlign = 'left'; c.fillText('less wing ← downforce → more wing', pad, h - 8);
    c.save(); c.translate(11, (h - 24) / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center';
    c.fillText('faster ↑', 0, 0); c.restore();
    c.strokeStyle = css('--line'); c.beginPath(); c.moveTo(pad, 8); c.lineTo(pad, h - 24); c.lineTo(w - 8, h - 24); c.stroke();
    const colors = { soft: css('--accent'), medium: css('--accent-3'), hard: css('--muted') };
    for (const [k, pts] of Object.entries(curves)) {
      c.strokeStyle = colors[k]; c.lineWidth = k === S.compound ? 2.4 : 1.2; c.globalAlpha = k === S.compound ? 1 : 0.55;
      c.beginPath(); pts.forEach(([p, t], i) => (i ? c.lineTo(X(p), Y(t)) : c.moveTo(X(p), Y(t)))); c.stroke();
    }
    c.globalAlpha = 1;
    const b = S.opt.best;
    c.fillStyle = css('--accent-2');
    c.beginPath(); c.arc(X(b.downforce), Y(b.time), 5, 0, 7); c.fill();
    c.textAlign = b.downforce > 70 ? 'right' : 'left';
    c.fillText(`best: ${LapSim.COMPOUNDS[b.compound].label}, ${b.downforce}%`, X(b.downforce) + (b.downforce > 70 ? -9 : 9), Y(b.time) + 2);
    // you are here
    c.strokeStyle = css('--text'); c.lineWidth = 2;
    const yx = X(S.downforce), yy = Y(S.res.time);
    c.beginPath(); c.arc(yx, yy, 6, 0, 7); c.stroke();
  }

  function bindPitLab() {
    document.querySelectorAll('[data-sim-track]').forEach((b) => b.addEventListener('click', () => {
      S.track = b.dataset.simTrack;
      document.querySelectorAll('[data-sim-track]').forEach((x) => x.classList.toggle('on', x === b));
      recompute();
    }));
    document.querySelectorAll('[data-compound]').forEach((b) => b.addEventListener('click', () => {
      S.compound = b.dataset.compound;
      document.querySelectorAll('[data-compound]').forEach((x) => x.classList.toggle('on', x === b));
      recompute();
    }));
    $('dfSlider').addEventListener('input', (e) => { S.downforce = +e.target.value; recompute(); });
    $('fuelSlider').addEventListener('input', (e) => { S.fuel = +e.target.value; recompute(); });
    $('optBtn').addEventListener('click', () => {
      const b = S.opt.best, start = S.downforce, t0 = performance.now();
      S.compound = b.compound;
      document.querySelectorAll('[data-compound]').forEach((x) => x.classList.toggle('on', x.dataset.compound === b.compound));
      const anim = (now) => {
        const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
        S.downforce = Math.round(start + (b.downforce - start) * e);
        $('dfSlider').value = S.downforce;
        recompute();
        if (k < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    });
    new IntersectionObserver((es) => { S.visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe($('simMap'));
    window.addEventListener('livery', recompute);
    window.addEventListener('resize', recompute);
    recompute();
  }

  function frame(now) {
    if (S.visible) drawMap(now);
    requestAnimationFrame(frame);
  }

  bindPitLab();
  requestAnimationFrame(frame);
})();
