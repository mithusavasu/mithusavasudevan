/* The catalogue: every "title" on the site, plus generated poster art. */
(function () {
  const A = () => window.Art;

  /* ---------- poster art (returns HTML) ---------- */
  const svgWrap = (vb, body, extra = '') => `<svg class="art-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${extra}>${body}</svg>`;
  function trackPath(key) {
    const t = Tracks.get(key);
    return 'M' + t.pts.filter((_, i) => i % 3 === 0).map((p) => p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join(' L') + ' Z';
  }
  function stars(n, w, h) { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(Math.sin(i * 91.7) * 0.5 + 0.5) * w}" cy="${(Math.cos(i * 47.3) * 0.5 + 0.5) * h}" r="${(i % 3) * 0.22 + 0.28}" fill="#fff" opacity="${0.3 + (i % 5) * 0.12}"/>`; return s; }

  const ART = {
    car: () => `<div class="art bg-red">${A().car('p' + Math.random().toString(36).slice(2, 6))}</div>`,
    bot: () => `<div class="art bg-teal bot-art">${A().bot({ id: 'p' + Math.random().toString(36).slice(2, 6) })}</div>`,
    series: () => `<div class="art bg-series">${svgWrap('0 0 320 180', `<text x="160" y="118" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="120" fill="#e11d2e" letter-spacing="4">MV</text>${stars(30, 320, 180)}`)}</div>`,
    arm: () => `<div class="art bg-steel">${svgWrap('0 0 320 180', `
      <rect x="0" y="150" width="320" height="30" fill="#0d1117"/>
      <rect x="120" y="128" width="50" height="24" rx="6" fill="#2b313c"/>
      <line x1="145" y1="128" x2="105" y2="70" stroke="#e11d2e" stroke-width="16" stroke-linecap="round"/>
      <line x1="105" y1="70" x2="190" y2="58" stroke="#e8eef5" stroke-width="12" stroke-linecap="round"/>
      <circle cx="145" cy="128" r="9" fill="#46d3ff"/><circle cx="105" cy="70" r="8" fill="#46d3ff"/><circle cx="190" cy="58" r="6" fill="#46d3ff"/>
      <path d="M182 64 v22 M198 64 v22 M180 66 h20" stroke="#e8eef5" stroke-width="4" fill="none"/>
      ${[230, 250, 270].map((x, i) => `<rect x="${x}" y="104" width="12" height="46" rx="6" fill="none" stroke="#e8eef5" stroke-width="2"/><rect x="${x + 2}" y="${124 + i * 4}" width="8" height="${24 - i * 4}" rx="4" fill="${['#e11d2e', '#46d3ff', '#f5c518'][i]}"/>`).join('')}`)}</div>`,
    sql: () => `<div class="art bg-term"><pre>sqlite&gt; SELECT role, org
   ...&gt; FROM experience
   ...&gt; WHERE end_date IS NULL;
<b>Research Developer | CPS Lab</b>
<b>Perf. Analyst      | MSF</b>
<b>Research Lead      | Frontier</b></pre></div>`,
    track: (key = 'rosewood') => `<div class="art bg-asphalt">${svgWrap('0 0 900 520', `<path d="${trackPath(key)}" fill="none" stroke="#2b2b30" stroke-width="44" stroke-linejoin="round"/><path d="${trackPath(key)}" fill="none" stroke="#e11d2e" stroke-width="5" stroke-dasharray="26 18" stroke-linejoin="round"/>`)}</div>`,
    cars: () => `<div class="art bg-asphalt">${svgWrap('0 0 900 520', `<path d="${trackPath('harbour')}" fill="none" stroke="#2b2b30" stroke-width="44" stroke-linejoin="round"/>
      ${Tracks.get('harbour').pts.filter((_, i) => i % 37 === 0).map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="${i === 3 ? '#e11d2e' : '#e8eef5'}" opacity="${i === 3 ? 1 : 0.55}"/>`).join('')}
      <g stroke="#46d3ff" stroke-width="2" opacity=".8">${[-50, -20, 10, 40].map((a) => `<line x1="${Tracks.get('harbour').pts[111][0]}" y1="${Tracks.get('harbour').pts[111][1]}" x2="${Tracks.get('harbour').pts[111][0] + Math.cos(a / 57) * 120}" y2="${Tracks.get('harbour').pts[111][1] + Math.sin(a / 57) * 120}"/>`).join('')}</g>`)}</div>`,
    books: () => `<div class="art bg-wine">${svgWrap('0 0 320 180', `<rect x="20" y="150" width="280" height="10" rx="3" fill="#3a1d24"/>
      ${[['#e11d2e', 60], ['#46d3ff', 78], ['#f5c518', 66], ['#e8eef5', 84], ['#9b5de5', 70], ['#e11d2e', 90], ['#f28ab2', 62], ['#46d3ff', 74]].map(([c, h], i) => `<rect x="${40 + i * 30}" y="${150 - h}" width="24" height="${h}" rx="3" fill="${c}"/>`).join('')}`)}</div>`,
    pp: () => `<div class="art bg-pp">${svgWrap('0 0 320 180', `<defs><linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2e9d8"/><stop offset=".55" stop-color="#c9d3b0"/><stop offset="1" stop-color="#6e7f55"/></linearGradient></defs>
      <rect width="320" height="180" fill="url(#mist)"/><rect y="96" width="320" height="16" fill="#fff" opacity=".35"/>
      <g fill="#2e3326"><circle cx="138" cy="112" r="4.5"/><path d="M132 140 L138 116 L144 140 Z"/><circle cx="186" cy="110" r="4.5"/><path d="M180 140 L186 114 L192 140 Z"/></g>
      <text x="160" y="56" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="26" fill="#3b3326">Pride &amp; Prejudice</text>`)}</div>`,
    space: () => `<div class="art bg-space">${svgWrap('0 0 320 180', `${stars(60, 320, 180)}
      <ellipse cx="200" cy="92" rx="88" ry="20" fill="none" stroke="#f6d18a" stroke-width="6" opacity=".9"/>
      <circle cx="200" cy="92" r="30" fill="#000"/><path d="M170 92 a30 30 0 0 1 60 0" fill="none" stroke="#ffe7b0" stroke-width="5"/>
      <ellipse cx="200" cy="92" rx="88" ry="20" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
      <text x="22" y="160" font-family="Bebas Neue, Impact, sans-serif" font-size="30" letter-spacing="8" fill="#e8eef5">INTERSTELLAR</text>`)}</div>`,
    lens: () => `<div class="art bg-lens">${svgWrap('0 0 320 180', `<circle cx="160" cy="88" r="58" fill="#111" stroke="#e8eef5" stroke-width="3"/><circle cx="160" cy="88" r="46" fill="none" stroke="#555" stroke-width="2"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M160 88 L${160 + Math.cos(a / 57.3) * 44} ${88 + Math.sin(a / 57.3) * 44} L${160 + Math.cos((a + 60) / 57.3) * 44} ${88 + Math.sin((a + 60) / 57.3) * 44} Z" fill="#2a2a2a" stroke="#666" stroke-width="1"/>`).join('')}
      <circle cx="160" cy="88" r="14" fill="#46d3ff" opacity=".7"/><circle cx="150" cy="78" r="5" fill="#fff" opacity=".8"/>`)}</div>`,
    explore: () => `<div class="art bg-explore">${svgWrap('0 0 320 180', `<path d="M0 140 Q80 90 160 120 T320 100 V180 H0Z" fill="#1d3b2a"/><path d="M0 155 Q100 120 200 145 T320 135 V180 H0Z" fill="#14281d"/>
      <circle cx="160" cy="70" r="36" fill="none" stroke="#f5c518" stroke-width="3"/><path d="M160 40 L168 70 L160 100 L152 70 Z" fill="#e11d2e"/><path d="M160 70 L168 70 L160 100 Z" fill="#e8eef5"/>`)}</div>`,
    novel: () => `<div class="art bg-rose">${svgWrap('0 0 320 180', `<path d="M160 50 Q110 36 70 50 V138 Q110 124 160 138 Z" fill="#fff4f7"/><path d="M160 50 Q210 36 250 50 V138 Q210 124 160 138 Z" fill="#ffe3ea"/>
      <path d="M160 50 V138" stroke="#c45b78" stroke-width="2"/>${[66, 80, 94, 108].map((y) => `<line x1="84" y1="${y}" x2="146" y2="${y - 3}" stroke="#d9a3b3" stroke-width="2"/><line x1="174" y1="${y - 3}" x2="236" y2="${y}" stroke="#d9a3b3" stroke-width="2"/>`).join('')}
      <path d="M160 34 l-9 -9 a5.5 5.5 0 0 1 9 -6 a5.5 5.5 0 0 1 9 6 z" fill="#e11d2e"/>`)}</div>`,
    flag: () => `<div class="art bg-flag"></div>`,
    clinic: () => `<div class="art bg-teal">${svgWrap('0 0 320 180', `<rect x="96" y="40" width="128" height="96" rx="12" fill="#0e2a2e" stroke="#46d3ff" stroke-width="3"/><text x="160" y="80" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" fill="#46d3ff">NOW SERVING</text><text x="160" y="118" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="40" fill="#e8eef5">A-042</text>`)}</div>`,
    db: () => `<div class="art bg-gold">${svgWrap('0 0 320 180', `${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${70 + c * 46}" y="${44 + r * 32}" width="42" height="28" rx="4" fill="${r === 0 ? '#1a1406' : '#2b220c'}" stroke="#f5c518" stroke-width="1.5"/>`).join('')).join('')}`)}</div>`,
    coop: () => `<div class="art bg-violet">${svgWrap('0 0 320 180', `<rect x="110" y="60" width="100" height="70" rx="10" fill="none" stroke="#e8eef5" stroke-width="4"/><path d="M140 60 v-12 h40 v12" fill="none" stroke="#e8eef5" stroke-width="4"/><path d="M110 92 h100" stroke="#e8eef5" stroke-width="3"/><circle cx="160" cy="92" r="7" fill="#f5c518"/>`)}</div>`,
    sleep: () => `<div class="art bg-night">${svgWrap('0 0 320 180', `${stars(30, 320, 180)}<path d="M120 40 a40 40 0 1 0 40 60 a32 32 0 1 1 -40 -60z" fill="#f6e7b0"/>
      <path d="M40 140 Q70 110 100 140 T160 140 T220 140 T280 140" fill="none" stroke="#46d3ff" stroke-width="3"/>`)}</div>`,
    cart: () => `<div class="art bg-green">${svgWrap('0 0 320 180', `<path d="M96 52 h22 l16 60 h70 l14 -44 h-92" fill="none" stroke="#e8eef5" stroke-width="6" stroke-linejoin="round"/><circle cx="142" cy="128" r="8" fill="#e8eef5"/><circle cx="196" cy="128" r="8" fill="#e8eef5"/><text x="232" y="64" font-family="Bebas Neue, Impact" font-size="30" fill="#f5c518">$</text>`)}</div>`,
    job: (icon = '💼') => `<div class="art bg-job"><span class="job-icon">${icon}</span></div>`,
    docu: () => `<div class="art bg-docu">${svgWrap('0 0 320 180', `<line x1="30" y1="100" x2="290" y2="100" stroke="#555" stroke-width="3"/>
      ${['🧑‍💻', '🤝', '🤖', '📊', '🚀', '🧠'].map((e, i) => `<circle cx="${40 + i * 48}" cy="100" r="16" fill="${i === 5 ? '#e11d2e' : '#2a2a2e'}" stroke="#e8eef5" stroke-width="2"/><text x="${40 + i * 48}" y="106" text-anchor="middle" font-size="16">${e}</text>`).join('')}`)}</div>`
  };

  /* ---------- titles ---------- */
  const T = [
    { id: 'series', title: 'Mithusa: The Series', art: 'series', kind: 'MV Original · Documentary', year: '2024–', rating: 'CS-29', dur: '3 Seasons', match: 98,
      genres: ['Engineering', 'Coming-of-code', 'Feel-good'], cast: ['Python', 'SQL', 'Java', 'C', 'React', 'Flask', 'Arduino'],
      desc: "A third-year Computer Science student at TMU (BSc Hons, Co-op, Minor in Business Essentials) builds robots, databases and machine-learning experiments, and documents the whole thing. Currently streaming: reinforcement learning for a robot arm, and a hunt for a Summer 2027 co-op.",
      episodes: [['S1 · 2024–25', 'Hello, TMU', 'First code, first data structures, and mentoring with Women in CS.'], ['S2 · 2025–26', 'Hardware gets real', 'Research Developer at the CPS Lab: Arduino robots in C and Python. Analytics for MSF. Data at BMO.'], ['S3 · 2026–27', 'Machines that learn', 'QueueCare, ShelfSense, an RL robot arm, joining Toronto Met Formula Racing, and a learning roadmap to ML engineering. You are here.']] },

    { id: 'pitlab', title: 'Pit Lab', art: 'car', kind: 'MV Original Series', year: 2026, rating: 'In production', dur: '6 Episodes', match: 99, progress: 0.18,
      genres: ['Machine learning', 'Motorsport', 'Data'], cast: ['Python', 'SQL', 'PyTorch', 'RL', 'RAG'],
      desc: 'An F1 car-setup optimizer built on real race telemetry. A data pipeline feeds ML models, a lap simulator, a neural surrogate and an AI race-engineer agent, all deployed for real users. The Setup Optimizer is the pilot episode.',
      demo: 'setup',
      episodes: [['E1', 'Data + SQL pipeline', 'FastF1 telemetry into a database. Streaming now.'], ['E2', 'Lap time & tire models', 'scikit-learn, XGBoost, honest evaluation. Dec 2026.'], ['E3', 'The RL driver', 'An agent learns to race. Jan 2027.'], ['E4', 'Neural surrogate', 'PyTorch model of the simulator. Feb 2027.'], ['E5', 'AI race engineer', 'RAG + tool-using agent. Mar 2027.'], ['E6', 'Ship it', 'FastAPI, Docker, AWS, real users. Summer 2027.']] },
    { id: 'rlarm', title: 'RL Robot Arm', art: 'arm', kind: 'Research · Ongoing', year: 2026, rating: 'Lab', dur: 'Ongoing', match: 97, progress: 0.45,
      genres: ['Robotics', 'Reinforcement learning'], cast: ['Python', 'RL', 'Robotics', 'C'],
      desc: "At TMU's Computational Public Safety Lab, I'm teaching a robotic arm to pick up tubes and place them back in their slots using reinforcement learning. The demo below is its hand-coded cousin: analytic inverse kinematics. Hover over it to take control.",
      demo: 'arm' },
    { id: 'queuecare', title: 'QueueCare', art: 'clinic', kind: 'Team project · 3 people', year: 2026, rating: 'Agile', dur: '4 Sprints', match: 95,
      genres: ['Web app', 'Product', 'Healthcare'], cast: ['Python', 'Flask', 'SQLite', 'SQLAlchemy', 'Bootstrap', 'Jira'],
      desc: 'A clinic appointment and queue management system. I was product owner: 15+ user stories, acceptance criteria, burndown and Gantt tracking. I also built scheduling, check-in and queue features for 3 user roles.' },
    { id: 'shelfsense', title: 'ShelfSense', art: 'db', kind: 'Database project', year: 2026, rating: '3NF / BCNF', dur: '10 Tables', match: 94,
      genres: ['Databases', 'SQL'], cast: ['Oracle SQL', 'ER/EER', 'Unix shell'],
      desc: 'A library database designed from an ER/EER model: a 10-table Oracle schema with composite keys and constraints, plus 15+ queries and 3 reporting views. Normalized to 3NF and BCNF.' },
    { id: 'coop', title: 'Co-opConnect', art: 'coop', kind: 'Team project · 5 people', year: 2026, rating: 'QA', dur: '3 Sprints', match: 92,
      genres: ['Web app', 'Testing'], cast: ['JavaScript', 'Java', 'Firebase', 'Jira'],
      desc: 'A centralized co-op management system. I turned requirements into user stories and designed and ran 40+ functional and regression test cases.' },
    { id: 'neurosleep', title: 'NeuroSleep', art: 'sleep', kind: 'Web app · Live', year: 2026, rating: 'Live', dur: 'Web', match: 93,
      genres: ['Data viz', 'Science'], cast: ['React', 'TypeScript', 'Vite'],
      desc: 'An interactive app that visualizes sleep, brain activity and circadian rhythms, and how they connect to cognitive performance.',
      links: [['Watch live ↗', 'https://mithusavasu.github.io/neurosleep/'], ['Code ↗', 'https://github.com/mithusavasu/neurosleep']] },
    { id: 'smartcart', title: 'SmartCart', art: 'cart', kind: 'Web app · Live', year: 2026, rating: 'Live', dur: 'Web', match: 90,
      genres: ['Algorithms', 'Web app'], cast: ['JavaScript', 'HTML', 'CSS'],
      desc: 'Compares grocery prices across retailers and uses algorithms to find the cheapest way to complete your list.',
      links: [['Watch live ↗', 'https://mithusavasu.github.io/smart-grocery-optimizer/'], ['Code ↗', 'https://github.com/mithusavasu/smart-grocery-optimizer']] },
    { id: 'matilda', title: 'Matilda', art: 'bot', kind: 'Robotics build', year: 2025, rating: 'Hardware', dur: 'Robot', match: 96,
      genres: ['Robotics', 'Embedded'], cast: ['C', 'Arduino', 'Sensors', 'Actuators'],
      desc: 'A public-safety robot built with C and Arduino, with a camera, sensors, actuators and a robotic arm that handles objects up to 500 g.' },

    { id: 'pickplace', title: 'Pick & Place', art: 'arm', kind: 'Interactive', year: 2026, rating: 'Play now', dur: 'Live demo', match: 99,
      genres: ['Robotics', 'Interactive'], cast: ['Inverse kinematics', 'Canvas'],
      desc: 'A robot arm sorts test tubes into a rack on its own. Hover over it to take control: it solves inverse kinematics live to follow your cursor.', demo: 'arm' },
    { id: 'sql', title: 'Query My Résumé', art: 'sql', kind: 'Interactive', year: 2026, rating: 'Play now', dur: 'Live SQL', match: 100,
      genres: ['Data', 'Interactive'], cast: ['SQLite', 'WebAssembly', 'SQL'],
      desc: "My résumé as a real SQLite database running in your browser. Click a query or write your own. Tables: experience, projects, project_tech, skills, favourites.", demo: 'sql' },
    { id: 'evo', title: 'Cars That Teach Themselves', art: 'cars', kind: 'Interactive', year: 2026, rating: 'Play now', dur: 'Live ML', match: 99,
      genres: ['Machine learning', 'Motorsport', 'Interactive'], cast: ['Neural networks', 'Genetic algorithm'],
      desc: 'Each car has 5 sensors and a tiny neural network (6 → 8 → 2). Nobody teaches them: every generation, the best drivers are bred and mutated. Speed it up to 20× and watch them learn the track.', demo: 'evo' },
    { id: 'setup', title: 'The Setup Optimizer', art: 'track', kind: 'Interactive', year: 2026, rating: 'Play now', dur: 'Live sim', match: 97,
      genres: ['Simulation', 'Motorsport', 'Optimization'], cast: ['Lap simulator', 'Physics'],
      desc: 'A quasi-steady-state lap simulator. More wing means faster corners but slower straights, and each track has a different best setup. Tune the car, or let the optimizer find it.', demo: 'setup' },
    { id: 'library', title: 'The Bookshelf', art: 'books', kind: 'Interactive', year: 2026, rating: 'Play now', dur: 'Projects', match: 98,
      genres: ['Projects', 'Books'], cast: ['Every project I\'ve built'],
      desc: 'I read a lot of romance novels. I also write software. Pull a book off the shelf.', demo: 'books' },

    { id: 'pp', title: 'Pride & Prejudice', art: 'pp', kind: 'Film · Romance', year: 2005, rating: 'PG', dur: '2h 9m', match: 100,
      genres: ['Romance', 'Period drama', 'Comfort watch'], cast: ['Rewatch value: infinite'],
      desc: "One of my all-time favourite films. Romance, period drama, misty fields: I'll rewatch it any day." },
    { id: 'interstellar', title: 'Interstellar', art: 'space', kind: 'Film · Sci-fi', year: 2014, rating: 'PG-13', dur: '2h 49m', match: 100,
      genres: ['Sci-fi', 'Space', 'Physics'], cast: ['Physics', 'Space', 'Time'],
      desc: 'Space, physics and a story about time. The kind of film that makes me want to build things that simulate the universe.' },
    { id: 'novels', title: 'Romance Novels', art: 'novel', kind: 'Ongoing series', year: 'Always', rating: '♥', dur: 'Endless', match: 99,
      genres: ['Romance', 'Books'], cast: ['There is always one on the go'],
      desc: "Off the clock I'm almost always mid-romance-novel. Engineering by day, a good love story by night. Recommendations welcome." },
    { id: 'lens', title: 'Behind the Lens', art: 'lens', kind: 'Photography', year: 'Always', rating: 'f/1.8', dur: 'Gallery soon', match: 97,
      genres: ['Photography', 'Creative'], cast: ['Light', 'People', 'Places'],
      desc: 'I love photography: catching light, moments and places. A gallery of my own shots is coming to this page soon.' },
    { id: 'explore', title: 'Exploring New Things', art: 'explore', kind: 'Lifestyle', year: 'Always', rating: 'Curious', dur: 'Ongoing', match: 98,
      genres: ['Adventure', 'Curiosity'], cast: ['New places', 'New tech', 'New hobbies'],
      desc: "I love trying new things: new places, new hobbies, and especially new tech. That curiosity is how I ended up in robotics, data and ML." },
    { id: 'f1', title: 'F1 Race Weekends', art: 'flag', kind: 'Sport', year: 'Every season', rating: 'Lights out', dur: '24 Rounds', match: 99,
      genres: ['Motorsport', 'Cars'], cast: ['Strategy', 'Tires', 'Telemetry'],
      desc: "I've always loved cars, and F1 is where data, physics and engineering meet at 300 km/h. It's why half my ML projects have race cars in them, and why I joined Toronto Met Formula Racing in November 2026." },

    { id: 'docu', title: 'The Evolution of Tech (and Me)', art: 'docu', kind: 'Docuseries', year: '2024–', rating: 'Doc', dur: '6 Episodes', match: 99, progress: 0.8,
      genres: ['Documentary', 'Technology'], cast: ['Every tool I\'ve picked up along the way'],
      desc: "I've always been drawn to whatever is next in tech, and I like being part of how it evolves. Each episode is a stage in how my own toolkit grew.",
      episodes: [['E1', 'Hello, World', 'First code at TMU: Python, C, data structures.'], ['E2', 'Teaching it forward', 'Mentoring and workshops for 50+ people with Women in CS.'], ['E3', 'Hardware gets real', 'Arduino robots, sensors and motors at the CPS Lab.'], ['E4', 'Data everywhere', 'Client records at BMO, analytics at MSF, SQL databases at school.'], ['E5', 'Shipping with teams', 'Co-opConnect and QueueCare: Agile, testing, product ownership.'], ['E6', 'Machines that learn', 'Reinforcement learning, neural nets, and this very website.']] },

    { id: 'x-tmfr', title: 'General Member', art: 'job', icon: '🏎️', kind: 'Toronto Metropolitan Formula Racing (TMFR)', year: 2026, rating: 'New', dur: 'Nov 2026 – Present', match: 99,
      genres: ['Motorsport', 'Engineering', 'Team'], cast: ['Formula SAE', 'Race car engineering', 'Teamwork'],
      desc: "In November 2026 I joined Toronto Metropolitan Formula Racing (TMFR), TMU's student team that designs and builds a formula-style race car for Formula SAE competitions, as a general member. The F1 obsession now comes with a real car and a real team." },
    { id: 'x-cps', title: 'Research Developer', art: 'job', icon: '🤖', kind: 'TMU Computational Public Safety Lab', year: '2025–', rating: 'Current', dur: 'Jun 2025 – Present', match: 99,
      genres: ['Robotics', 'Research'], cast: ['C', 'Python', 'Arduino', 'Sensors', 'Motors', 'RL'],
      desc: 'I develop and test Arduino-based robotic systems in C and Python, integrating microcontrollers, sensors and motors and troubleshooting hardware and software. Now working on reinforcement learning for a robot arm.' },
    { id: 'x-msf', title: 'Digital Performance Analyst', art: 'job', icon: '📊', kind: 'TMU Friends of MSF / Doctors Without Borders', year: '2025–', rating: 'Current', dur: 'Aug 2025 – Present', match: 95,
      genres: ['Analytics', 'Outreach'], cast: ['Excel', 'Analytics'],
      desc: 'I generated 7,000+ social media views for humanitarian initiatives, coordinating with 5 executives and student orgs, and track performance analytics in Excel.' },
    { id: 'x-space', title: 'Research Lead', art: 'job', icon: '🛰️', kind: 'Frontier Space Technology, TMU', year: '2025–', rating: 'Current', dur: 'Aug 2025 – Present', match: 94,
      genres: ['Research', 'Leadership'], cast: ['Research', 'Writing'],
      desc: 'I lead research on space-technology applications and coordinate peers on technical research and writing.' },
    { id: 'x-bmo', title: 'Data Collection Associate', art: 'job', icon: '🏦', kind: 'BMO (Bank of Montreal)', year: 2026, rating: 'Complete', dur: 'Feb – Apr 2026', match: 92,
      genres: ['Data', 'Finance'], cast: ['Excel', 'Jira'],
      desc: 'I digitized 100+ client records with a focus on accuracy, data integrity and confidentiality, and resolved inconsistencies across them.' },
    { id: 'x-wics', title: 'Computer Science Mentor', art: 'job', icon: '🤝', kind: 'Women in Computer Science, TMU', year: '2024–25', rating: 'Complete', dur: 'Sep 2024 – Sep 2025', match: 96,
      genres: ['Community', 'Teaching'], cast: ['Mentoring', 'Workshops'],
      desc: 'I mentored junior students and led technical workshops for 50+ attendees.' }
  ];
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));

  const ROWS = {
    top10:  { title: 'Top 10 Projects in Toronto Today', ids: ['pitlab', 'rlarm', 'queuecare', 'shelfsense', 'coop', 'neurosleep', 'smartcart', 'matilda'], top10: true },
    cont:   { title: 'Continue Watching for {p}', ids: ['pitlab', 'rlarm', 'docu'] },
    play:   { title: 'Interactive · Play in your browser', ids: ['sql', 'evo', 'pickplace', 'setup', 'library'] },
    garage: { title: 'Robotics & Cars', ids: ['x-tmfr', 'rlarm', 'evo', 'matilda', 'setup', 'pitlab', 'f1'] },
    comfort:{ title: 'Off the Clock · Comfort Watches & Loves', ids: ['pp', 'interstellar', 'novels', 'lens', 'explore', 'f1'] },
    docu:   { title: 'Docuseries · The Evolution of Tech (and Me)', ids: ['docu', 'series'] },
    exp:    { title: 'Experience · Limited Series', ids: ['x-tmfr', 'x-cps', 'x-msf', 'x-space', 'x-bmo', 'x-wics'] }
  };

  const PROFILES = {
    recruiter: { name: 'Recruiter', icon: '💼', color: '#e11d2e', hero: 'series', rows: ['cont', 'exp', 'top10', 'play', 'docu', 'garage', 'comfort'] },
    engineer:  { name: 'Engineer', icon: '⚙️', color: '#2f80ed', hero: 'evo', rows: ['play', 'top10', 'garage', 'cont', 'docu', 'exp', 'comfort'] },
    film:      { name: 'Film buff', icon: '🎬', color: '#f5c518', hero: 'interstellar', rows: ['comfort', 'play', 'top10', 'docu', 'garage', 'exp', 'cont'] },
    explorer:  { name: 'Explorer', icon: '🧭', color: '#27ae60', hero: 'docu', rows: ['docu', 'play', 'garage', 'comfort', 'top10', 'exp', 'cont'] }
  };

  function art(t) { const f = ART[t.art] || ART.series; return t.art === 'job' ? f(t.icon) : f(); }

  window.Catalog = { T, byId, ROWS, PROFILES, art };
})();
