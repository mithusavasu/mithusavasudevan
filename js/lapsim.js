/* Quasi-steady-state lap time simulator (point-mass car).
   1. Corner speed limit from grip:  m v^2 k = mu (m g + 0.5 rho ClA v^2)
   2. Forward pass: accelerate with engine power, minus drag, limited by grip.
   3. Backward pass: brake as late as grip allows.
   Lap time = sum(ds / v). Simple, but the same idea real teams start from. */
(function (root) {
  const RHO = 1.225, G = 9.81, POWER = 760e3, BASE_MASS = 798, VCAP = 105;
  const COMPOUNDS = {
    soft:   { label: 'Soft',   mu: 1.60 },
    medium: { label: 'Medium', mu: 1.50 },
    hard:   { label: 'Hard',   mu: 1.42 }
  };
  const clAFromPct = (p) => 2.0 + (4.0 * p) / 100;   // downforce slider 0..100 -> ClA 2..6 m^2
  const cdAFromClA = (c) => 0.55 + 0.24 * c;          // more wing = more drag

  function run(track, setup) {
    const n = track.n, scale = track.mPerPx, ds = track.ds * scale;
    const m = BASE_MASS + setup.fuel, mu = COMPOUNDS[setup.compound].mu;
    const ClA = clAFromPct(setup.downforce), CdA = cdAFromClA(ClA);
    const vc = new Float64Array(n);
    let i0 = 0;
    for (let i = 0; i < n; i++) {
      const k = track.kappa[i] / scale;
      const denom = m * k - mu * 0.5 * RHO * ClA;
      vc[i] = denom <= 0 ? VCAP : Math.min(VCAP, Math.sqrt((mu * m * G) / denom));
      if (vc[i] < vc[i0]) i0 = i;
    }
    const accel = (v) => {
      v = Math.max(v, 5);
      const down = 0.5 * RHO * ClA * v * v, drag = 0.5 * RHO * CdA * v * v;
      const traction = mu * (m * G + down) * 0.5; // rear axle only
      return (Math.min(POWER / v, traction) - drag) / m;
    };
    const brake = (v) => {
      const down = 0.5 * RHO * ClA * v * v, drag = 0.5 * RHO * CdA * v * v;
      return (mu * (m * G + down) + drag) / m;
    };
    const v = new Float64Array(n);
    v[i0] = vc[i0];
    for (let j = 1; j < n; j++) {
      const i = (i0 + j) % n, p = (i - 1 + n) % n;
      v[i] = Math.min(vc[i], Math.sqrt(Math.max(0, v[p] * v[p] + 2 * accel(v[p]) * ds)));
    }
    for (let j = 1; j < n; j++) {
      const i = (i0 - j + n) % n, nx = (i + 1) % n;
      v[i] = Math.min(v[i], Math.sqrt(v[nx] * v[nx] + 2 * brake(v[nx]) * ds));
    }
    let time = 0, top = 0, min = Infinity;
    const tAt = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      tAt[i] = time;
      const vn = v[(i + 1) % n];
      time += ds / ((v[i] + vn) / 2);
      if (v[i] > top) top = v[i];
      if (v[i] < min) min = v[i];
    }
    return { v, vc, time, top, min, avg: (ds * n) / time, tAt, ds, ClA, CdA };
  }

  // Sweep downforce for every compound and return the fastest setup.
  function optimize(track, fuel) {
    let best = null;
    const curves = {};
    for (const c of Object.keys(COMPOUNDS)) {
      curves[c] = [];
      for (let p = 0; p <= 100; p += 2) {
        const r = run(track, { downforce: p, compound: c, fuel });
        curves[c].push([p, r.time]);
        if (!best || r.time < best.time) best = { downforce: p, compound: c, time: r.time };
      }
    }
    return { best, curves };
  }

  function fmtLap(t) {
    const m = Math.floor(t / 60), s = t - m * 60;
    return `${m}:${s.toFixed(3).padStart(6, '0')}`;
  }

  const api = { run, optimize, fmtLap, COMPOUNDS, clAFromPct };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LapSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
