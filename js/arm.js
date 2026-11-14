/* Robot arm: 2-link planar arm + vertical gripper, analytic inverse kinematics.
   Auto mode moves test tubes from the bench to a rack and back; hover to take control. */
(function () {
  const cv = document.getElementById('armCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = 520, H = 400, FLOOR = 360;
  const B = { x: 260, y: 318 };            // shoulder
  const L1 = 150, L2 = 130, L3 = 38;       // upper arm, forearm, gripper
  const TUBE_H = 58, GRIP_Y = FLOOR - TUBE_H + 10, HOVER_Y = 170;
  const LEFT = [62, 92, 122, 152], RIGHT = [368, 398, 428, 458];
  const colors = ['--accent', '--accent-2', '--accent-3', '--accent'];

  const tubes = LEFT.map((x, i) => ({ x, home: 'L', idx: i, color: colors[i], held: false }));
  const tip = { x: 260, y: 200 };          // fingertip position (what IK solves for)
  let grip = 0, mode = 'auto', placed = 0, plan = [], userT = null, leaveTimer = null, visible = false;
  let view = { s: 1, ox: 0, oy: 0 };

  let side = 'L';
  function buildPlan() {
    let t = tubes.find((u) => u.home === side);
    if (!t) { side = side === 'L' ? 'R' : 'L'; t = tubes.find((u) => u.home === side); }
    const fromX = t.x;
    const slots = t.home === 'L' ? RIGHT : LEFT;
    const toX = slots[t.idx];
    plan = [
      { x: fromX, y: HOVER_Y }, { x: fromX, y: GRIP_Y, act: 'grip', t }, { x: fromX, y: HOVER_Y },
      { x: toX, y: HOVER_Y }, { x: toX, y: GRIP_Y, act: 'release', t, toX }, { x: toX, y: HOVER_Y }
    ];
  }

  function solve(fx, fy) {
    let wx = fx - B.x, wy = fy - L3 - B.y;
    let D = Math.hypot(wx, wy);
    const maxR = L1 + L2 - 1, minR = Math.abs(L1 - L2) + 1;
    if (D > maxR) { wx *= maxR / D; wy *= maxR / D; D = maxR; }
    if (D < minR) { wx *= minR / (D || 1); wy *= minR / (D || 1); D = minR; }
    const c2 = Math.max(-1, Math.min(1, (D * D - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
    let best = null;
    for (const sgn of [1, -1]) {
      const s2 = sgn * Math.sqrt(1 - c2 * c2);
      const q2 = Math.atan2(s2, c2);
      const q1 = Math.atan2(wy, wx) - Math.atan2(L2 * s2, L1 + L2 * c2);
      const ex = B.x + L1 * Math.cos(q1), ey = B.y + L1 * Math.sin(q1);
      if (!best || ey < best.ey) best = { q1, q2, ex, ey };
    }
    best.wx = B.x + wx; best.wy = B.y + wy;
    return best;
  }

  let wait = 0;
  function update(dt) {
    let target;
    if (mode === 'you' && userT) target = userT;
    else {
      if (!plan.length) buildPlan();
      target = plan[0];
    }
    const dx = target.x - tip.x, dy = target.y - tip.y, d = Math.hypot(dx, dy);
    const sp = (mode === 'you' ? 9 : 3.4) * dt * 60;
    if (d > sp) { tip.x += (dx / d) * sp; tip.y += (dy / d) * sp; }
    else {
      tip.x = target.x; tip.y = target.y;
      if (mode === 'auto') {
        const p = plan[0];
        if (p.act === 'grip') {
          grip = Math.min(1, grip + dt * 3);
          if (grip < 1) return;
          p.t.held = true;
        } else if (p.act === 'release') {
          grip = Math.max(0, grip - dt * 3);
          if (grip > 0) return;
          p.t.held = false; p.t.x = p.toX; p.t.home = p.t.home === 'L' ? 'R' : 'L';
          placed++;
        }
        if (wait > 0) { wait -= dt; return; }
        plan.shift();
      }
    }
  }

  function fit() {
    const dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const s = Math.min(cw / W, ch / H);
    view = { s, ox: (cw - W * s) / 2, oy: (ch - H * s) / 2 };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(s * dpr, 0, 0, s * dpr, view.ox * dpr, view.oy * dpr);
  }

  function drawTube(x, bottomY, color) {
    const w = 16;
    ctx.fillStyle = css(color);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x - w / 2 + 2, bottomY - TUBE_H * 0.55, w - 4, TUBE_H * 0.55 - 6);
    ctx.beginPath(); ctx.arc(x, bottomY - 6, w / 2 - 2, 0, Math.PI); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = css('--text'); ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bottomY - TUBE_H); ctx.lineTo(x - w / 2, bottomY - 6);
    ctx.arc(x, bottomY - 6, w / 2, Math.PI, 0, true);
    ctx.lineTo(x + w / 2, bottomY - TUBE_H);
    ctx.stroke();
    ctx.fillStyle = css('--muted');
    ctx.fillRect(x - w / 2 - 2, bottomY - TUBE_H - 4, w + 4, 5);
  }

  function draw() {
    fit();
    const text = css('--text'), muted = css('--muted'), acc = css('--accent'), acc2 = css('--accent-2'), line = css('--line'), surf = css('--surface-2');
    // reach envelope
    ctx.setLineDash([3, 6]); ctx.strokeStyle = line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(B.x, B.y + L3 * 0, L1 + L2, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    // floor, bench and rack
    ctx.fillStyle = surf; ctx.fillRect(20, FLOOR, W - 40, 8);
    ctx.fillStyle = muted; ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('BENCH', 107, FLOOR + 24); ctx.fillText('RACK', 413, FLOOR + 24);
    ctx.strokeStyle = line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(346, FLOOR); ctx.lineTo(346, FLOOR - 34); ctx.lineTo(480, FLOOR - 34); ctx.lineTo(480, FLOOR); ctx.stroke();
    // tubes on the floor/rack
    tubes.forEach((t) => { if (!t.held) drawTube(t.x, FLOOR, t.color); });
    if (mode === 'you' && userT) {
      ctx.strokeStyle = acc2; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(userT.x, userT.y, 9, 0, 7); ctx.moveTo(userT.x - 14, userT.y); ctx.lineTo(userT.x + 14, userT.y); ctx.moveTo(userT.x, userT.y - 14); ctx.lineTo(userT.x, userT.y + 14); ctx.stroke();
    }
    const k = solve(tip.x, tip.y);
    // base
    ctx.fillStyle = surf; ctx.strokeStyle = line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(B.x - 34, B.y + 6, 68, FLOOR - B.y - 6, 8); ctx.fill(); ctx.stroke();
    // links
    ctx.lineCap = 'round';
    const seg = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
    seg(B.x, B.y, k.ex, k.ey, 20, text);
    seg(k.ex, k.ey, k.wx, k.wy, 15, acc);
    ctx.shadowColor = 'transparent';
    seg(k.wx, k.wy, k.wx, k.wy + L3 - 12, 7, muted);
    // gripper fingers
    const open = 12 - grip * 4.5;
    ctx.strokeStyle = text; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(k.wx - open, k.wy + L3 - 14); ctx.lineTo(k.wx - open, k.wy + L3 + 4);
    ctx.moveTo(k.wx + open, k.wy + L3 - 14); ctx.lineTo(k.wx + open, k.wy + L3 + 4);
    ctx.moveTo(k.wx - open - 2, k.wy + L3 - 14); ctx.lineTo(k.wx + open + 2, k.wy + L3 - 14);
    ctx.stroke();
    const held = tubes.find((t) => t.held);
    if (held) drawTube(k.wx, k.wy + L3 + (TUBE_H - 10), held.color);
    // joints
    [[B.x, B.y, 13], [k.ex, k.ey, 10], [k.wx, k.wy, 7]].forEach(([x, y, r]) => {
      ctx.fillStyle = surf; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = acc2; ctx.lineWidth = 2.5; ctx.stroke();
    });
    $('armQ1').textContent = `${Math.round((-k.q1 * 180) / Math.PI)}°`;
    $('armQ2').textContent = `${Math.round((-k.q2 * 180) / Math.PI)}°`;
    $('armMode').textContent = mode === 'you' ? 'you' : 'auto';
    $('armPlaced').textContent = placed;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible) { if (!reduce || mode === 'you') update(dt); draw(); }
    requestAnimationFrame(frame);
  }

  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left - view.ox) / view.s, y = (e.clientY - r.top - view.oy) / view.s;
    userT = { x: Math.max(20, Math.min(W - 20, x)), y: Math.max(40, Math.min(FLOOR - 6, y)) };
    mode = 'you';
    clearTimeout(leaveTimer);
  });
  cv.addEventListener('pointerleave', () => {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => { mode = 'auto'; userT = null; }, 1200);
  });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(cv);
  requestAnimationFrame(frame);
})();
