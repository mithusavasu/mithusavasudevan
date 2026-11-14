/* The streaming app: intro, profiles, hero billboard, rows, title modal (with live demos), search, My List. */
(function () {
  const $ = (id) => document.getElementById(id);
  const { T, byId, ROWS, PROFILES, art } = window.Catalog;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let profileKey = store.get('mv-profile', null);
  let myList = store.get('mv-list', []);

  /* ================= Intro + profiles ================= */
  function showProfiles() {
    $('profiles').hidden = false;
    document.body.classList.add('locked');
    $('profiles').querySelector('button').focus();
  }
  function pickProfile(key) {
    profileKey = key; store.set('mv-profile', key);
    $('profiles').hidden = true; document.body.classList.remove('locked');
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new CustomEvent('profile', { detail: PROFILES[key] }));
  }
  $('profileGrid').innerHTML = Object.entries(PROFILES).map(([k, p]) => `
    <button class="profile" data-profile="${k}"><span class="avatar" style="--c:${p.color}">${p.icon}</span><span>${p.name}</span></button>`).join('');
  $('profileGrid').querySelectorAll('[data-profile]').forEach((b) => b.addEventListener('click', () => pickProfile(b.dataset.profile)));

  function endIntro() {
    const intro = $('intro');
    if (intro.classList.contains('done')) return;
    intro.classList.add('done');
    setTimeout(() => { intro.hidden = true; if (profileKey && PROFILES[profileKey]) { document.body.classList.remove('locked'); render(); } else showProfiles(); }, reduce ? 0 : 500);
  }
  document.body.classList.add('locked');
  if (store.get('mv-seen-intro', false) || reduce) { $('intro').classList.add('quick'); setTimeout(endIntro, 300); }
  else { store.set('mv-seen-intro', true); setTimeout(endIntro, 3000); }
  $('intro').addEventListener('click', endIntro);
  $('switchProfile').addEventListener('click', showProfiles);

  /* ================= Cards ================= */
  function card(t, opts = {}) {
    const inList = myList.includes(t.id);
    return `
    <div class="card${opts.top10 ? ' top10' : ''}" role="listitem">
      ${opts.top10 ? `<span class="rank" aria-hidden="true">${opts.rank}</span>` : ''}
      <button class="poster" data-open="${t.id}" aria-label="${esc(t.title)}: more info">
        ${art(t)}
        <span class="badge">MV</span>
        ${t.demo ? '<span class="live-tag">▶ PLAYABLE</span>' : ''}
        <span class="ptitle">${esc(t.title)}</span>
        ${opts.progress && t.progress ? `<span class="progress"><i style="width:${t.progress * 100}%"></i></span>` : ''}
      </button>
      <div class="card-info">
        <div class="ci-btns">
          <button class="round play" data-play="${t.id}" aria-label="Play ${esc(t.title)}">▶</button>
          <button class="round" data-list="${t.id}" aria-label="${inList ? 'Remove from' : 'Add to'} My List">${inList ? '✓' : '+'}</button>
          <button class="round" data-like aria-label="Like">👍</button>
          <button class="round more" data-open="${t.id}" aria-label="More info">⌄</button>
        </div>
        <p class="ci-meta"><b class="match">${t.match}% Match</b> <span class="rating">${esc(t.rating)}</span> <span>${esc(t.dur)}</span></p>
        <p class="ci-genres">${t.genres.map(esc).join(' <i>•</i> ')}</p>
      </div>
    </div>`;
  }

  function row(key, title, ids, opts = {}) {
    return `
    <section class="row" id="row-${key}" aria-label="${esc(title)}">
      <h2>${esc(title)} <span class="explore">Explore all ›</span></h2>
      <div class="row-wrap">
        <button class="arrow left" aria-label="Scroll left">‹</button>
        <div class="track" role="list">${ids.map((id, i) => card(byId[id], { ...opts, rank: i + 1 })).join('')}</div>
        <button class="arrow right" aria-label="Scroll right">›</button>
      </div>
    </section>`;
  }

  /* ================= Render ================= */
  function render() {
    const P = PROFILES[profileKey] || PROFILES.recruiter;
    $('navAvatar').textContent = P.icon; $('navAvatar').style.setProperty('--c', P.color);
    renderHero(byId[P.hero]);
    let html = '';
    P.rows.forEach((k, i) => {
      const R = ROWS[k];
      html += row(k, R.title.replace('{p}', P.name), R.ids, { top10: R.top10, progress: k === 'cont' });
      if (i === 0 && myList.length) html += row('mylist', 'My List', myList);
    });
    $('rows').innerHTML = html;
    bindRows($('rows'));
  }

  function renderHero(t) {
    $('heroArt').innerHTML = art(t);
    $('heroKind').textContent = t.kind.toUpperCase();
    $('heroTitle').textContent = t.title;
    $('heroMeta').innerHTML = `<b class="match">${t.match}% Match</b><span>${esc(t.year)}</span><span class="rating">${esc(t.rating)}</span><span>${esc(t.dur)}</span><span class="hd">HD</span>`;
    $('heroDesc').textContent = t.desc;
    $('heroPlay').onclick = () => play(t.id);
    $('heroInfo').onclick = () => openTitle(t.id);
    $('heroPlay').querySelector('span').textContent = t.demo ? 'Play' : t.id === 'series' ? 'Play pilot' : 'Play';
  }

  function bindRows(rootEl) {
    rootEl.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openTitle(b.dataset.open)));
    rootEl.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => play(b.dataset.play)));
    rootEl.querySelectorAll('[data-list]').forEach((b) => b.addEventListener('click', () => toggleList(b.dataset.list)));
    rootEl.querySelectorAll('[data-like]').forEach((b) => b.addEventListener('click', () => { b.textContent = '💖'; b.classList.add('liked'); }));
    rootEl.querySelectorAll('.row-wrap').forEach((w) => {
      const tr = w.querySelector('.track');
      w.querySelector('.left').addEventListener('click', () => tr.scrollBy({ left: -tr.clientWidth * 0.85, behavior: 'smooth' }));
      w.querySelector('.right').addEventListener('click', () => tr.scrollBy({ left: tr.clientWidth * 0.85, behavior: 'smooth' }));
    });
  }

  function toggleList(id) {
    myList = myList.includes(id) ? myList.filter((x) => x !== id) : [id, ...myList];
    store.set('mv-list', myList);
    const y = window.scrollY; render(); window.scrollTo({ top: y, behavior: 'instant' });
    toast(myList.includes(id) ? `Added “${byId[id].title}” to My List` : `Removed from My List`);
    if (!$('modal').hidden) $('mList').textContent = myList.includes(id) ? '✓' : '+';
  }

  /* ================= Modal ================= */
  let current = null, lastFocus = null;
  function returnDemo() {
    const d = $('mDemo').firstElementChild;
    if (d) $('demos').append(d);
  }
  function openTitle(id, jumpToDemo) {
    const t = byId[id]; if (!t) return;
    lastFocus = document.activeElement;
    returnDemo();
    current = id;
    $('mBanner').innerHTML = art(t);
    $('mTitle').textContent = t.title;
    $('mKind').textContent = t.kind;
    $('mMeta').innerHTML = `<b class="match">${t.match}% Match</b><span>${esc(t.year)}</span><span class="rating">${esc(t.rating)}</span><span>${esc(t.dur)}</span><span class="hd">HD</span>`;
    $('mDesc').textContent = t.desc;
    $('mCast').textContent = t.cast.join(', ');
    $('mGenres').textContent = t.genres.join(', ');
    $('mList').textContent = myList.includes(id) ? '✓' : '+';
    $('mPlayLabel').textContent = t.demo ? 'Play demo' : t.links ? 'Watch live' : t.episodes ? 'Episodes' : 'Play';
    // demo
    if (t.demo) { const node = $('demos').querySelector(`[data-demo="${t.demo}"]`); if (node) $('mDemo').append(node); }
    $('mDemoWrap').hidden = !t.demo;
    // episodes
    $('mEpisodes').innerHTML = t.episodes ? `<h3>Episodes</h3>` + t.episodes.map(([n, name, d], i) => `
      <div class="ep${i === t.episodes.length - 1 && id === 'series' ? ' now' : ''}"><span class="ep-n">${esc(n)}</span><div><b>${esc(name)}</b><p>${esc(d)}</p></div></div>`).join('') : '';
    // links
    $('mLinks').innerHTML = (t.links || []).map(([txt, href]) => `<a class="btn ghost sm" href="${href}" target="_blank" rel="noopener">${esc(txt)}</a>`).join('');
    // more like this
    const similar = T.filter((x) => x.id !== id && x.genres.some((g) => t.genres.includes(g))).slice(0, 6);
    $('mMore').innerHTML = similar.map((x) => `<button class="more-card" data-open="${x.id}">${art(x)}<span class="badge">MV</span><span class="mc-body"><b>${esc(x.title)}</b><small>${x.match}% Match · ${esc(x.dur)}</small></span></button>`).join('');
    $('mMore').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openTitle(b.dataset.open)));
    $('mMoreWrap').hidden = !similar.length;

    $('modal').hidden = false; document.body.classList.add('locked');
    $('modal').scrollTop = 0;
    $('mClose').focus();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    if (jumpToDemo && t.demo) setTimeout(() => $('mDemoWrap').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 250);
    window.dispatchEvent(new CustomEvent('title-open', { detail: t }));
  }
  function closeModal() {
    if ($('modal').hidden) return;
    $('modal').hidden = true; document.body.classList.remove('locked');
    returnDemo(); current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function play(id) {
    const t = byId[id];
    if (t.links && !t.demo) { window.open(t.links[0][1], '_blank', 'noopener'); return; }
    openTitle(id, true);
  }
  $('mClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  $('mPlay').addEventListener('click', () => {
    const t = byId[current];
    if (t.demo) $('mDemoWrap').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    else if (t.links) window.open(t.links[0][1], '_blank', 'noopener');
    else if (t.episodes) $('mEpisodes').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  $('mList').addEventListener('click', () => toggleList(current));
  $('mLike').addEventListener('click', (e) => { e.currentTarget.textContent = '💖'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeSearch(); $('still').hidden = true; } });

  /* ================= Search ================= */
  const sInput = $('searchInput');
  $('searchBtn').addEventListener('click', () => { $('search').classList.add('open'); sInput.focus(); });
  function closeSearch() { if (!sInput.value) $('search').classList.remove('open'); }
  sInput.addEventListener('blur', closeSearch);
  sInput.addEventListener('input', () => {
    const q = sInput.value.trim().toLowerCase();
    const on = q.length > 0;
    document.body.classList.toggle('searching', on);
    if (!on) { $('results').innerHTML = ''; return; }
    const hits = T.filter((t) => [t.title, t.kind, t.desc, ...t.genres, ...t.cast].join(' ').toLowerCase().includes(q));
    $('results').innerHTML = `<h2>${hits.length ? `Results for “${esc(sInput.value)}”` : `No titles match “${esc(sInput.value)}”. Try "robot", "SQL" or "romance".`}</h2>
      <div class="grid" role="list">${hits.map((t) => card(t)).join('')}</div>`;
    bindRows($('results'));
  });

  /* ================= Nav ================= */
  const nav = $('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('solid', window.scrollY > 40), { passive: true });
  document.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const el = $('row-' + a.dataset.goto);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }));

  /* ================= Toast ================= */
  let tt = null;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ================= Are you still watching? ================= */
  let idle = null, asked = store.get('mv-still', false);
  const resetIdle = () => {
    clearTimeout(idle);
    if (asked) return;
    idle = setTimeout(() => {
      if (!$('modal').hidden || !$('profiles').hidden || !$('intro').hidden) return resetIdle();
      asked = true; store.set('mv-still', true);
      $('stillWho').textContent = (PROFILES[profileKey] || PROFILES.recruiter).name;
      $('still').hidden = false;
    }, 75000);
  };
  ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();
  $('stillYes').addEventListener('click', () => { $('still').hidden = true; });

  $('year').textContent = new Date().getFullYear();
  window.App = { openTitle, play };
})();
