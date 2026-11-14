/* Torque: a little car that transforms into a robot and answers questions about me.
   Answers come from a tiny retrieval engine (TF-IDF + cosine similarity) over notes. No LLM, no server. */
(function () {
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the transforming bot (original design) ---------- */
  const BOT = `
  <svg viewBox="0 0 160 170" class="tf" aria-hidden="true">
    <ellipse class="tf-shadow" cx="80" cy="152" rx="66" ry="7" fill="#000" opacity=".4"/>
    <g class="tf-part tf-torso">
      <rect x="54" y="68" width="52" height="58" rx="13" fill="#c8102e" stroke="#7a0a1c" stroke-width="2"/>
      <rect x="64" y="80" width="32" height="22" rx="6" fill="#16141c"/>
      <path d="M80 98 l-7 -7 a4.5 4.5 0 0 1 7 -5 a4.5 4.5 0 0 1 7 5 z" fill="#46d3ff"/>
      <rect x="62" y="110" width="36" height="6" rx="3" fill="#7a0a1c"/>
    </g>
    <g class="tf-part tf-trunk">
      <rect x="12" y="100" width="58" height="26" rx="10" fill="#e11d2e" stroke="#7a0a1c" stroke-width="2"/>
      <rect x="14" y="106" width="8" height="6" rx="2" fill="#ff6b6b"/>
      <rect x="40" y="100" width="4" height="26" fill="#f5f5f5" opacity=".9"/>
    </g>
    <g class="tf-part tf-hood">
      <rect x="90" y="100" width="58" height="26" rx="10" fill="#e11d2e" stroke="#7a0a1c" stroke-width="2"/>
      <circle cx="140" cy="110" r="4.5" fill="#fff6c2"/>
      <rect x="116" y="100" width="4" height="26" fill="#f5f5f5" opacity=".9"/>
    </g>
    <g class="tf-part tf-cabin">
      <line class="tf-antenna" x1="80" y1="76" x2="80" y2="62" stroke="#9aa3ad" stroke-width="3" stroke-linecap="round"/>
      <circle class="tf-antenna" cx="80" cy="60" r="4.5" fill="#46d3ff"/>
      <rect x="42" y="76" width="76" height="32" rx="15" fill="#f5f5f5" stroke="#cfcfd6" stroke-width="2"/>
      <rect x="50" y="82" width="60" height="19" rx="9" fill="#16141c"/>
      <g class="tf-eyes"><ellipse class="tf-eye" cx="69" cy="91.5" rx="4.5" ry="5.5" fill="#46d3ff"/><ellipse class="tf-eye" cx="91" cy="91.5" rx="4.5" ry="5.5" fill="#46d3ff"/></g>
      <path class="tf-smile" d="M75 97 q5 3.5 10 0" fill="none" stroke="#46d3ff" stroke-width="1.8" stroke-linecap="round"/>
    </g>
    <g class="tf-part tf-wheel tf-wl"><circle cx="40" cy="132" r="15" fill="#16141c"/><circle cx="40" cy="132" r="7" fill="#d0d4da"/><circle cx="40" cy="132" r="2.5" fill="#e11d2e"/></g>
    <g class="tf-part tf-wheel tf-wr"><circle cx="120" cy="132" r="15" fill="#16141c"/><circle cx="120" cy="132" r="7" fill="#d0d4da"/><circle cx="120" cy="132" r="2.5" fill="#e11d2e"/></g>
  </svg>`;

  const launcher = $('torque');
  launcher.querySelector('.tf-holder').innerHTML = BOT;
  const svg = launcher.querySelector('.tf');
  document.querySelectorAll('.torque-face').forEach((el) => { el.innerHTML = BOT; el.querySelector('.tf').classList.add('robot', 'static'); });

  /* ---------- knowledge base ---------- */
  const KB = [
    { t: 'Who I am', k: 'who are you about intro introduce yourself background student name mithusa tell me',
      a: "Mithusa Vasudevan: third-year Computer Science (BSc Hons, Co-op) at Toronto Metropolitan University with a Minor in Business Essentials, graduating 2029. Builds robots, databases and ML experiments, and loves films, romance novels, photography and F1." },
    { t: 'Current focus', k: 'working on now currently doing focus learning machine learning ml ai reinforcement rl robot robotic arm research tubes pick place',
      a: "Right now: teaching a robotic arm to pick up and place tubes with reinforcement learning at TMU's Computational Public Safety Lab, and building Pit Lab, an F1 car-setup optimizer that goes from data to deployed AI." },
    { t: 'Co-op search', k: 'hire hiring co-op coop internship summer 2027 job available looking role position work recruit',
      a: "Yes! Mithusa is looking for a Summer 2027 co-op, especially in data science, AI/ML engineering, robotics or simulation. Email: mvasudevan@torontomu.ca 📬" },
    { t: 'Languages', k: 'languages programming code python java c sql bash rust haskell elixir prolog lisp smalltalk',
      a: 'Python, Java, C, SQL and Bash day to day, plus HTML/CSS/JavaScript. Through coursework: Rust, Haskell, Elixir, Prolog, Lisp and Smalltalk too.' },
    { t: 'Data & databases', k: 'data database sql postgres postgresql oracle sqlite sqlalchemy dbeaver power bi excel analytics design normalization',
      a: 'SQL, PostgreSQL, Oracle, SQLite, SQLAlchemy, DBeaver, Power BI and Excel. Designs schemas from ER/EER models and normalizes them to 3NF/BCNF. Try "Query My Résumé": it is a real database!' },
    { t: 'Web & tools', k: 'web frontend backend react vite flask bootstrap rest api tools git github linux vs code docker jira typescript',
      a: 'React, TypeScript, Vite, Flask, Bootstrap and REST APIs, with Git, Linux, VS Code, Docker and Jira as tools.' },
    { t: 'Product & PM', k: 'agile scrum product owner management pm sprint backlog user stories leadership certification ibm',
      a: 'Product owner on an Agile team: user stories, acceptance criteria, burndown and Gantt charts. Certified in IBM Project Management Fundamentals and IBM Enterprise Design Thinking.' },
    { t: 'CPS Research Lab', k: 'research lab cps computational public safety arduino embedded developer microcontroller sensors motors hardware',
      a: "Research Developer at TMU's Computational Public Safety Lab since June 2025: Arduino robots in C and Python with microcontrollers, sensors and motors. Now doing RL for a robot arm." },
    { t: 'MSF', k: 'msf doctors without borders medecins sans frontieres digital performance analyst social media views',
      a: 'Digital Performance Analyst for TMU Friends of MSF / Doctors Without Borders: 7,000+ social media views for humanitarian initiatives, with analytics tracked in Excel.' },
    { t: 'Projects', k: 'projects built portfolio queuecare shelfsense coopconnect neurosleep smartcart matilda pit lab',
      a: 'Projects: Pit Lab (F1 ML), the RL robot arm, QueueCare (clinic queues, Flask), ShelfSense (Oracle DB), Co-opConnect, NeuroSleep (React), SmartCart and Matilda the robot. They are all in the Top 10 row!' },
    { t: 'QueueCare', k: 'queuecare clinic appointment queue flask product owner healthcare',
      a: 'QueueCare is a clinic appointment and queue system (Python, Flask, SQLite, SQLAlchemy). Product owner for a 3-person team across 4 sprints, building features for 3 user roles.' },
    { t: 'Films', k: 'film films movie movies favourite favorite watch pride prejudice interstellar cinema romance sci-fi netflix',
      a: 'Big film lover! 🎬 Pride & Prejudice (2005) and Interstellar (2014) are favourites: romance and period drama on one side, space and physics on the other. Find them in the "Off the Clock" row.' },
    { t: 'Romance novels', k: 'books read reading romance novels novel book',
      a: "There's almost always a romance novel on the go 📚 Engineering by day, a good love story by night. Recommendations welcome!" },
    { t: 'Photography', k: 'photography photo photos camera pictures lens shoot',
      a: 'Mithusa loves photography 📷: light, people and places. A gallery of Mithusa\'s own shots is coming soon in "Behind the Lens".' },
    { t: 'Exploring', k: 'explore exploring new things curious curiosity travel adventure hobbies evolution tech technology',
      a: "Loves exploring new things: new places, new hobbies, and especially new tech. Watch the docuseries “The Evolution of Tech (and Me)” to see how the toolkit grew." },
    { t: 'F1 & cars', k: 'f1 formula 1 cars car racing motorsport gran turismo forza tires drive',
      a: "Always loved cars 🏎️ F1 is where data, physics and engineering meet at 300 km/h, so the ML projects here are full of race cars, including the one chasing your cursor!" },
    { t: 'About me (Torque)', k: 'torque you bot robot transform transformer car who made what are you chatbot how work',
      a: "I'm Torque! A car by day, a robot when you need answers 🤖🚗 Under the hood I use TF-IDF + cosine similarity to retrieve the best-matching note: the R in RAG. Mithusa's LLM-powered version is on the roadmap." },
    { t: 'This website', k: 'website site built how made this portfolio streaming javascript stack',
      a: 'This site is hand-built with HTML, CSS and JavaScript, with no frameworks. Live demos include robot arm IK, a real SQLite résumé in WebAssembly, neuroevolving race cars, a lap simulator, the cursor-chasing car, and me.' },
    { t: 'Roadmap', k: 'roadmap plan next future learning path goals rag agent deploy deep learning mujoco onshape cad aws',
      a: 'The roadmap: data + SQL pipelines → ML models → RL agents → deep learning → RAG + AI agents → robot simulation (MuJoCo, Onshape) → shipping to real users on AWS by Summer 2027.' },
    { t: 'Leadership', k: 'leadership mentor mentoring women in computer science wics frontier space volunteer workshop',
      a: 'Mentored with Women in Computer Science (workshops for 50+ people) and is Research Lead at Frontier Space Technology at TMU.' },
    { t: 'Contact', k: 'contact email reach linkedin github message talk hello',
      a: 'Email mvasudevan@torontomu.ca, or find Mithusa on LinkedIn (mithusa-vasudevan) and GitHub (mithusavasu).' }
  ];
  const STOP = new Set('a an the is are am was were be to of and or in on at for with my me i you your do does did what which who how why can could would tell about it this that have has any some she her mithusa s'.split(' '));
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
  const tok = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+#\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
  const docs = KB.map((d) => tok(`${d.t} ${d.k} ${d.k} ${d.a}`));
  const df = new Map();
  docs.forEach((ws) => new Set(ws).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const idf = (w) => Math.log((KB.length + 1) / ((df.get(w) || 0) + 1)) + 1;
  const vec = (ws) => { const v = new Map(); ws.forEach((w) => v.set(w, (v.get(w) || 0) + 1)); let n = 0; v.forEach((c, w) => { const x = c * idf(w); v.set(w, x); n += x * x; }); n = Math.sqrt(n) || 1; v.forEach((x, w) => v.set(w, x / n)); return v; };
  const dv = docs.map(vec);
  const cos = (a, b) => { let s = 0; a.forEach((x, w) => { if (b.has(w)) s += x * b.get(w); }); return s; };

  /* ---------- chat UI ---------- */
  const panel = $('chat'), log = $('chatLog'), form = $('chatForm'), input = $('chatInput');
  let open = false, greeted = false;

  function add(who, text, meta) {
    const el = document.createElement('div'); el.className = `msg ${who}`;
    const b = document.createElement('div'); b.className = 'bubble'; el.append(b);
    if (meta) { const m = document.createElement('div'); m.className = 'meta'; m.textContent = meta; el.append(m); }
    log.append(el); log.scrollTop = log.scrollHeight;
    if (who === 'me' || reduce) { b.textContent = text; return; }
    let i = 0; svg.classList.add('talking');
    const iv = setInterval(() => { i += 3; b.textContent = text.slice(0, i); log.scrollTop = log.scrollHeight; if (i >= text.length) { clearInterval(iv); svg.classList.remove('talking'); } }, 16);
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    add('me', q);
    const r = dv.map((d, i) => ({ i, s: cos(vec(tok(q)), d) })).sort((a, b) => b.s - a.s)[0];
    setTimeout(() => {
      if (r.s < 0.1) add('bot', "Hmm, my engine stalled on that one 🛠️ Try asking about projects, the lab, films, photography, F1, or co-op plans!", `no match · best ${r.s.toFixed(2)}`);
      else add('bot', KB[r.i].a, `retrieved “${KB[r.i].t}” · similarity ${r.s.toFixed(2)}`);
    }, 300);
  }

  function setOpen(v) {
    open = v;
    launcher.setAttribute('aria-expanded', String(v));
    if (v) {
      launcher.classList.add('transforming');
      svg.classList.add('robot');
      setTimeout(() => {
        panel.hidden = false; launcher.classList.remove('transforming');
        if (!greeted) { greeted = true; add('bot', "Beep-vroom! 🚗➜🤖 I'm Torque, Mithusa's pit bot. Ask me anything: projects, skills, films, co-op plans…", 'online'); }
        input.focus();
      }, reduce ? 0 : 750);
    } else {
      panel.hidden = true;
      svg.classList.remove('robot');
    }
  }
  launcher.addEventListener('click', () => setOpen(!open));
  $('chatClose').addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); input.value = ''; });
  document.querySelectorAll('[data-ask]').forEach((b) => b.addEventListener('click', () => ask(b.dataset.ask)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });

  // little nudge bubble after a while
  setTimeout(() => { if (!open) launcher.classList.add('nudge'); }, 9000);
  launcher.addEventListener('mouseenter', () => launcher.classList.remove('nudge'));

  window.Torque = { open: () => setOpen(true), ask };
})();
