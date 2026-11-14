/* Hand-drawn SVG graphics: the AI robot guide and an (original, unbranded) open-wheel race car.
   Any element with [data-bot] or [data-car] gets one rendered into it. Robot eyes follow the cursor. */
(function () {
  function bot(opts) {
    const hat = opts.hat ? `
      <g class="bot-hat">
        <path d="M52 46 Q100 14 148 46 Z" fill="var(--surface-2)" stroke="var(--accent)" stroke-width="3"/>
        <rect x="44" y="42" width="112" height="10" rx="5" fill="var(--accent)"/>
        <circle cx="100" cy="32" r="7" fill="var(--accent-3)"/>
      </g>` : `
      <g class="bot-antenna">
        <line x1="100" y1="42" x2="100" y2="18" stroke="var(--muted)" stroke-width="4" stroke-linecap="round"/>
        <circle class="bot-tip" cx="100" cy="14" r="7" fill="var(--accent-2)"/>
      </g>`;
    return `
    <svg viewBox="0 0 200 250" class="bot-svg" role="img" aria-label="${opts.label || 'A friendly robot'}">
      <defs>
        <radialGradient id="botBody${opts.id}" cx="40%" cy="30%" r="80%">
          <stop offset="0" stop-color="#3a3546"/><stop offset="1" stop-color="#1c1924"/>
        </radialGradient>
        <filter id="botGlow${opts.id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <ellipse cx="100" cy="240" rx="58" ry="7" fill="#000" opacity=".35"/>
      ${hat}
      <rect x="30" y="72" width="14" height="30" rx="7" fill="var(--accent)"/>
      <rect x="156" y="72" width="14" height="30" rx="7" fill="var(--accent)"/>
      <rect x="40" y="44" width="120" height="92" rx="34" fill="url(#botBody${opts.id})" stroke="#4a4458" stroke-width="2"/>
      <rect x="54" y="62" width="92" height="54" rx="24" fill="#0a0910"/>
      <g class="bot-eyes">
        <ellipse cx="82" cy="86" rx="9" ry="11" fill="var(--accent-2)" filter="url(#botGlow${opts.id})" opacity=".8"/>
        <ellipse cx="118" cy="86" rx="9" ry="11" fill="var(--accent-2)" filter="url(#botGlow${opts.id})" opacity=".8"/>
        <ellipse class="eye" cx="82" cy="86" rx="7" ry="9" fill="var(--accent-2)"/>
        <ellipse class="eye" cx="118" cy="86" rx="7" ry="9" fill="var(--accent-2)"/>
        <circle cx="85" cy="82" r="2.4" fill="#fff"/><circle cx="121" cy="82" r="2.4" fill="#fff"/>
      </g>
      <path d="M90 104 Q100 111 110 104" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="64" cy="104" r="5" fill="var(--accent)" opacity=".45"/><circle cx="136" cy="104" r="5" fill="var(--accent)" opacity=".45"/>
      <rect x="88" y="134" width="24" height="10" rx="4" fill="#2a2633"/>
      <rect x="58" y="142" width="84" height="74" rx="26" fill="url(#botBody${opts.id})" stroke="#4a4458" stroke-width="2"/>
      <rect x="76" y="158" width="48" height="34" rx="10" fill="#0a0910"/>
      <path class="bot-heart" d="M100 184 l-11 -11 a6.5 6.5 0 0 1 11 -7 a6.5 6.5 0 0 1 11 7 z" fill="var(--accent)"/>
      <g class="bot-arm-l"><rect x="34" y="150" width="20" height="50" rx="10" fill="#2e2a38" stroke="#4a4458" stroke-width="2"/></g>
      <g class="bot-arm-r"><rect x="146" y="112" width="20" height="50" rx="10" fill="#2e2a38" stroke="#4a4458" stroke-width="2"/>
        <circle cx="156" cy="110" r="11" fill="#2e2a38" stroke="#4a4458" stroke-width="2"/></g>
      <rect x="72" y="214" width="20" height="18" rx="6" fill="#2e2a38"/><rect x="108" y="214" width="20" height="18" rx="6" fill="#2e2a38"/>
    </svg>`;
  }

  function car(id) {
    const wheel = (cx, cy, r, cls) => `
      <g class="wheel ${cls}" style="transform-origin:${cx}px ${cy}px">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#111014"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#ff3b3b" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="#2a2730"/>
        <g stroke="var(--accent-2)" stroke-width="3" stroke-linecap="round">
          <line x1="${cx - r * 0.5}" y1="${cy}" x2="${cx + r * 0.5}" y2="${cy}"/>
          <line x1="${cx}" y1="${cy - r * 0.5}" x2="${cx}" y2="${cy + r * 0.5}"/>
          <line x1="${cx - r * 0.35}" y1="${cy - r * 0.35}" x2="${cx + r * 0.35}" y2="${cy + r * 0.35}"/>
        </g>
        <circle cx="${cx}" cy="${cy}" r="5" fill="var(--accent)"/>
      </g>`;
    return `
    <svg viewBox="0 0 640 180" class="car-svg" role="img" aria-label="An illustrated open-wheel race car">
      <defs>
        <linearGradient id="carBody${id}" x1="0" x2="1">
          <stop offset="0" stop-color="#ff3d7f"/><stop offset=".6" stop-color="#c2307a"/><stop offset="1" stop-color="#7b2ff7"/>
        </linearGradient>
        <linearGradient id="carShine${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g class="speed-lines" stroke="var(--accent-2)" stroke-linecap="round">
        <line x1="-40" y1="70" x2="40" y2="70" stroke-width="3"/><line x1="-80" y1="100" x2="10" y2="100" stroke-width="2"/>
        <line x1="-20" y1="130" x2="50" y2="130" stroke-width="2.5"/>
      </g>
      <ellipse cx="320" cy="164" rx="290" ry="9" fill="#000" opacity=".4"/>
      <!-- rear wing -->
      <rect x="532" y="34" width="70" height="12" rx="3" fill="#1c1924" stroke="var(--accent)" stroke-width="2"/>
      <rect x="586" y="30" width="14" height="70" rx="3" fill="#1c1924"/>
      <rect x="548" y="44" width="8" height="52" fill="#2a2633"/>
      <!-- floor -->
      <path d="M70 140 L560 136 L560 146 L70 148 Z" fill="#141218"/>
      <!-- body -->
      <path d="M40 132 L170 122 L250 112 L285 92 L330 86 L352 66 L410 66 L440 88 L560 102 L585 112 L585 138 L40 142 Z" fill="url(#carBody${id})"/>
      <path d="M40 132 L170 122 L250 112 L285 92 L330 86 L352 66 L410 66 L440 88 L560 102 L585 112 L585 118 L40 134 Z" fill="url(#carShine${id})"/>
      <!-- sidepod + stripe -->
      <path d="M300 112 Q330 100 420 102 L520 110 L520 132 L300 134 Z" fill="#1c1924" opacity=".55"/>
      <path d="M60 130 L250 117 L560 112 L585 116 L585 121 L250 124 L60 136 Z" fill="var(--accent-2)"/>
      <text x="410" y="128" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="20" fill="#fff" font-style="italic">MV</text>
      <!-- cockpit, halo, helmet -->
      <circle cx="318" cy="84" r="15" fill="var(--accent-3)"/>
      <path d="M305 80 h24 a4 4 0 0 1 0 8 h-24 z" fill="#0a0910"/>
      <path d="M282 96 Q300 62 338 70 L350 78" fill="none" stroke="#0e0d12" stroke-width="7" stroke-linecap="round"/>
      <!-- front wing -->
      <path d="M12 144 L120 140 L124 150 L10 154 Z" fill="#1c1924" stroke="var(--accent)" stroke-width="2"/>
      <rect x="8" y="126" width="10" height="30" rx="3" fill="#1c1924"/>
      ${wheel(140, 134, 32, 'front')}
      ${wheel(500, 130, 36, 'rear')}
      <g class="exhaust"><circle cx="598" cy="112" r="6" fill="var(--accent-3)"/><circle cx="612" cy="112" r="4" fill="var(--accent)" opacity=".7"/></g>
    </svg>`;
  }

  let n = 0;
  document.querySelectorAll('[data-bot]').forEach((el) => {
    el.innerHTML = bot({ id: n++, hat: el.dataset.bot === 'officer', label: el.getAttribute('aria-label') || undefined });
  });
  document.querySelectorAll('[data-car]').forEach((el) => { el.innerHTML = car(n++); });

  // eyes follow the cursor
  window.addEventListener('pointermove', (e) => {
    document.querySelectorAll('.bot-svg').forEach((svg) => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.34;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 300);
      svg.querySelector('.bot-eyes').style.transform = `translate(${(dx / d) * 6 * k}px, ${(dy / d) * 5 * k}px)`;
    });
  });

  window.Art = { bot, car };
  window.Bots = {
    say(el, text) {
      if (!el) return;
      el.classList.remove('pop'); void el.offsetWidth;
      el.textContent = text; el.classList.add('pop');
    }
  };
})();
