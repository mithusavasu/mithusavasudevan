/* A tiny top-down race car that chases your cursor, drifts around it and leaves fading tire marks. */
(function () {
  const cv = document.getElementById('follower');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let enabled = !reduce;
  try { const s = sessionStorage.getItem('mv-follower'); if (s !== null) enabled = s === '1'; } catch (e) { /* ignore */ }

  const car = { x: innerWidth * 0.5, y: innerHeight * 0.7, a: -Math.PI / 2, v: 0, drift: 0 };
  const target = { x: innerWidth * 0.5, y: innerHeight * 0.45, active: false };
  const marks = [];
  let w = 0, h = 0, dpr = 1, lastMove = 0, t = 0;

  function size() {
    dpr = window.devicePixelRatio || 1; w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }
  size(); window.addEventListener('resize', size);
  window.addEventListener('pointermove', (e) => { target.x = e.clientX; target.y = e.clientY; target.active = true; lastMove = performance.now(); }, { passive: true });
  window.addEventListener('pointerdown', (e) => { target.x = e.clientX; target.y = e.clientY; target.active = true; lastMove = performance.now(); }, { passive: true });
  document.addEventListener('pointerleave', () => { target.active = false; });

  function step(dt) {
    t += dt;
    // when the cursor rests, orbit around it (donuts!)
    const resting = performance.now() - lastMove > 900;
    let tx = target.x, ty = target.y;
    if (resting) { tx += Math.cos(t * 2.2) * 46; ty += Math.sin(t * 2.2) * 46; }
    const dx = tx - car.x, dy = ty - car.y, dist = Math.hypot(dx, dy);
    const want = Math.atan2(dy, dx);
    let diff = want - car.a; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
    const steer = Math.max(-1, Math.min(1, diff * 2.2));
    const desired = Math.min(520, dist * 3.2) * (1 - Math.min(0.7, Math.abs(diff) / Math.PI));
    car.v += (desired - car.v) * Math.min(1, dt * 3);
    const turn = steer * (2.4 + car.v / 160) * dt;
    car.a += turn;
    car.drift = car.drift * 0.9 + steer * Math.min(1, car.v / 300) * 0.1;
    const slip = car.drift * 0.6;
    car.x += Math.cos(car.a + slip) * car.v * dt;
    car.y += Math.sin(car.a + slip) * car.v * dt;
    // tire marks when turning hard at speed
    if (Math.abs(steer) > 0.5 && car.v > 120) {
      const bx = -Math.cos(car.a) * 9, by = -Math.sin(car.a) * 9, px = -Math.sin(car.a) * 6, py = Math.cos(car.a) * 6;
      marks.push({ x: car.x + bx + px, y: car.y + by + py, life: 1 }, { x: car.x + bx - px, y: car.y + by - py, life: 1 });
    }
    for (const m of marks) m.life -= dt * 0.7;
    while (marks.length && marks[0].life <= 0) marks.shift();
    if (marks.length > 600) marks.splice(0, marks.length - 600);
  }

  function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y); ctx.rotate(car.a);
    ctx.shadowColor = 'rgba(225,29,46,.6)'; ctx.shadowBlur = 14;
    // body
    ctx.fillStyle = '#e11d2e';
    ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(6, -4); ctx.lineTo(-10, -5); ctx.lineTo(-14, -3); ctx.lineTo(-14, 3); ctx.lineTo(-10, 5); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    // wings
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(15, -7, 3, 14); ctx.fillRect(-17, -6, 3, 12);
    // wheels
    ctx.fillStyle = '#111';
    [[9, -7], [9, 7], [-9, -7.5], [-9, 7.5]].forEach(([x, y]) => { ctx.beginPath(); ctx.roundRect(x - 3, y - 2, 6, 4, 1); ctx.fill(); });
    // cockpit + helmet
    ctx.fillStyle = '#16141c'; ctx.beginPath(); ctx.ellipse(-1, 0, 4, 2.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#46d3ff'; ctx.beginPath(); ctx.arc(-1, 0, 1.8, 0, 7); ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (enabled && !document.body.classList.contains('locked')) {
      step(dt);
      ctx.lineCap = 'round';
      for (let i = 2; i < marks.length; i++) {
        const a = marks[i - 2], b = marks[i];
        if (Math.hypot(a.x - b.x, a.y - b.y) > 20) continue;
        ctx.strokeStyle = `rgba(140,140,150,${b.life * 0.35})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      drawCar();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const btn = document.getElementById('followerBtn');
  const sync = () => { btn.setAttribute('aria-pressed', String(enabled)); btn.title = enabled ? 'Park the car' : 'Let the car out'; btn.classList.toggle('off', !enabled); };
  btn.addEventListener('click', () => { enabled = !enabled; try { sessionStorage.setItem('mv-follower', enabled ? '1' : '0'); } catch (e) { /* ignore */ } sync(); });
  sync();
})();
