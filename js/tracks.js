/* Track geometry: closed Catmull-Rom splines resampled to even spacing.
   Logical canvas space is 900 x 520. All three circuits are original layouts. */
(function (root) {
  const W = 900, H = 520, WIDTH = 46, STEP = 4;

  const DEFS = {
    velocity: {
      name: 'Velocity Park', km: 5.4,
      blurb: 'Long straights and fast sweepers. Drag hurts here.',
      pts: [[150,430],[100,330],[110,200],[180,110],[320,80],[600,80],[780,100],[830,180],
            [790,250],[690,270],[650,320],[720,380],[760,440],[680,470],[420,470],[250,465]]
    },
    harbour: {
      name: 'Harbour Loop', km: 4.3,
      blurb: 'A balanced mix of slow corners and quick straights.',
      pts: [[160,450],[90,360],[100,230],[190,150],[300,170],[360,250],[450,250],[500,160],
            [600,90],[760,100],[830,200],[800,320],[700,350],[620,420],[480,460],[320,470]]
    },
    rosewood: {
      name: 'Rosewood Hairpins', km: 3.3,
      blurb: 'Tight, twisty and technical. Grip is everything.',
      pts: [[120,440],[80,340],[130,260],[240,280],[300,360],[380,380],[420,300],[340,220],
            [300,140],[380,80],[500,90],[540,170],[620,200],[720,130],[820,160],[830,260],
            [740,300],[700,380],[780,430],[700,480],[500,470],[300,480]]
    }
  };

  function catmull(pts, seg) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let s = 0; s < seg; s++) {
        const t = s / seg, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    return out;
  }

  function resample(poly, step) {
    const n = poly.length, cum = [0];
    for (let i = 1; i <= n; i++) {
      const a = poly[i - 1], b = poly[i % n];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const L = cum[n], m = Math.round(L / step), out = [];
    let j = 0;
    for (let k = 0; k < m; k++) {
      const target = (k * L) / m;
      while (cum[j + 1] < target) j++;
      const a = poly[j], b = poly[(j + 1) % n];
      const t = (target - cum[j]) / (cum[j + 1] - cum[j] || 1);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return { pts: out, length: L };
  }

  const cache = {};
  function get(key) {
    if (cache[key]) return cache[key];
    const d = DEFS[key];
    const { pts, length } = resample(catmull(d.pts, 24), STEP);
    const n = pts.length, ds = length / n;
    const heading = new Float64Array(n), kappa = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      heading[i] = Math.atan2(b[1] - a[1], b[0] - a[0]);
      // Curvature from the circle through three points spaced 3 apart (smoother than neighbours).
      const p = pts[(i - 3 + n) % n], q = pts[i], r = pts[(i + 3) % n];
      const A = Math.hypot(q[0] - p[0], q[1] - p[1]), B = Math.hypot(r[0] - q[0], r[1] - q[1]), C = Math.hypot(r[0] - p[0], r[1] - p[1]);
      const cross = Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
      kappa[i] = (2 * cross) / (A * B * C || 1);
    }
    // Light smoothing of curvature.
    const ks = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let o = -2; o <= 2; o++) s += kappa[(i + o + n) % n];
      ks[i] = s / 5;
    }
    const t = { key, name: d.name, blurb: d.blurb, pts, n, ds, length, heading, kappa: ks,
                mPerPx: (d.km * 1000) / length, width: WIDTH };
    cache[key] = t;
    return t;
  }

  const api = { W, H, WIDTH, keys: Object.keys(DEFS), get };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tracks = api;
})(typeof window !== 'undefined' ? window : globalThis);
