/* Bookshelf: projects as book spines (plus a few romance novels, for honesty). */
(function () {
  const shelf = document.getElementById('shelf');
  const page = document.getElementById('bookPage');
  if (!shelf) return;

  const A = 'var(--accent)', B = 'var(--accent-2)', C3 = 'var(--accent-3)', S = 'var(--surface-2)', T = 'var(--text)';
  const DARK = 'var(--on-accent)', LIGHT = 'var(--text)';
  const BOOKS = [
    { title: 'Pit Lab', h: 178, c: A, ink: DARK, meta: 'In development · 2026–27', tags: ['Python', 'SQL', 'PyTorch', 'RL', 'RAG'],
      body: 'An F1 car-setup optimizer built on real race telemetry: SQL data pipeline → ML models → lap simulator → neural surrogate → AI race-engineer agent → deployed for real users. The "Setup optimizer" at Gate C is chapter one.' },
    { title: 'RL Robot Arm', h: 164, c: B, ink: DARK, meta: 'Research · ongoing', tags: ['Python', 'Reinforcement learning', 'Robotics'],
      body: 'At TMU\'s Computational Public Safety Lab, I\'m teaching a robotic arm to pick up tubes and place them back in their slots using reinforcement learning. The arm at Gate A is the hand-coded cousin of this.' },
    { title: 'QueueCare', h: 150, c: S, ink: LIGHT, meta: 'Sep 2026 – Present · team of 3', tags: ['Python', 'Flask', 'SQLite', 'SQLAlchemy', 'Scrum'],
      body: 'A clinic appointment and queue management system. I was product owner: 15+ user stories, acceptance criteria, 4 sprints of burndown and Gantt tracking. I also built scheduling, check-in and queue features for 3 user roles.' },
    { title: '♥ Off the Clock', h: 132, c: 'color-mix(in srgb, var(--accent) 55%, var(--surface-2))', ink: LIGHT, romance: true },
    { title: 'ShelfSense', h: 170, c: C3, ink: DARK, meta: 'Sep 2026 – Present · databases', tags: ['Oracle SQL', 'ER/EER', '3NF/BCNF', 'Unix shell'],
      body: 'A library database: ER/EER model → 10-table Oracle schema with composite keys, FK and check constraints, plus 15+ queries and 3 reporting views. Normalized to 3NF and BCNF. (A book about books, on a bookshelf.)' },
    { title: 'NeuroSleep', h: 156, c: 'color-mix(in srgb, var(--accent-2) 45%, var(--surface-2))', ink: LIGHT, meta: 'Live · web', tags: ['React', 'TypeScript', 'Vite', 'Data viz'],
      body: 'An interactive app that visualizes sleep, brain activity and circadian rhythms, and how they connect to cognitive performance.',
      links: [['Live ↗', 'https://mithusavasu.github.io/neurosleep/'], ['Code ↗', 'https://github.com/mithusavasu/neurosleep']] },
    { title: 'Co-opConnect', h: 144, c: S, ink: LIGHT, meta: 'Mar – May 2026 · team of 5', tags: ['JavaScript', 'Java', 'Firebase', 'QA'],
      body: 'A centralized co-op management system delivered over 3 sprints. I turned requirements into user stories and designed and ran 40+ functional and regression test cases.' },
    { title: 'SmartCart', h: 160, c: A, ink: DARK, meta: 'Live · algorithms', tags: ['JavaScript', 'Algorithms'],
      body: 'Compares grocery prices across retailers and uses algorithms to find the cheapest way to complete a shopping list.',
      links: [['Live ↗', 'https://mithusavasu.github.io/smart-grocery-optimizer/'], ['Code ↗', 'https://github.com/mithusavasu/smart-grocery-optimizer']] },
    { title: 'Matilda', h: 138, c: B, ink: DARK, meta: 'Robotics · embedded', tags: ['C', 'Arduino', 'Sensors'],
      body: 'A public-safety robot built with C and Arduino, with a camera, sensors, actuators and a robotic arm that handles objects up to 500 g.' },
    { title: '♥ One More Chapter', h: 146, c: 'color-mix(in srgb, var(--accent-3) 55%, var(--surface-2))', ink: LIGHT, romance: true, lean: true }
  ];
  const ROMANCE = {
    meta: 'Off the clock',
    body: "Not a project, just a reminder that I'm a person: I read a lot of romance novels. Engineering by day, a good love story by night. Recommendations welcome."
  };

  function open(i) {
    const b = BOOKS[i];
    shelf.querySelectorAll('.spine').forEach((s, j) => s.classList.toggle('on', j === i));
    page.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = b.title.replace('♥ ', '');
    const m = document.createElement('span'); m.className = 'meta'; m.textContent = b.romance ? ROMANCE.meta : b.meta;
    const p = document.createElement('p'); p.textContent = b.romance ? ROMANCE.body : b.body;
    page.append(m, h, p);
    if (b.tags) {
      const st = document.createElement('div'); st.className = 'stack';
      b.tags.forEach((t) => { const s = document.createElement('span'); s.textContent = t; st.append(s); });
      page.append(st);
    }
    if (b.links) {
      const l = document.createElement('div'); l.className = 'book-links';
      b.links.forEach(([txt, href]) => { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = txt; l.append(a); });
      page.append(l);
    }
  }

  BOOKS.forEach((b, i) => {
    const s = document.createElement('button');
    s.className = 'spine' + (b.romance ? ' romance' : '') + (b.lean ? ' lean' : '') + (b.leopard ? ' leopard' : '');
    s.setAttribute('role', 'listitem');
    s.style.setProperty('--h', b.h + 'px');
    s.style.setProperty('--c', b.c);
    s.style.setProperty('--ink', b.ink);
    s.textContent = b.title;
    s.setAttribute('aria-label', `Open ${b.title.replace('♥ ', '')}`);
    s.addEventListener('click', () => open(i));
    shelf.append(s);
  });
  open(0);
})();
