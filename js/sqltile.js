/* "Query my résumé": a real SQLite database (sql.js / WebAssembly) running in the browser. */
(function () {
  const $ = (id) => document.getElementById(id);
  const input = $('sqlInput'), out = $('sqlOut'), meta = $('sqlMeta');
  if (!input) return;

  const SCHEMA = `
  CREATE TABLE experience (role TEXT, org TEXT, start TEXT, end_date TEXT, kind TEXT);
  INSERT INTO experience VALUES
    ('General Member', 'Toronto Metropolitan Formula Racing (TMFR)', '2026-11', NULL, 'motorsport'),
    ('Research Developer', 'TMU Computational Public Safety Lab', '2025-06', NULL, 'research'),
    ('Digital Performance Analyst', 'TMU Friends of MSF / Doctors Without Borders', '2025-08', NULL, 'analytics'),
    ('Research Lead', 'Frontier Space Technology, TMU', '2025-08', NULL, 'leadership'),
    ('Data Collection Associate', 'BMO (Bank of Montreal)', '2026-02', '2026-04', 'data'),
    ('Computer Science Mentor', 'Women in Computer Science, TMU', '2024-09', '2025-09', 'community');

  CREATE TABLE projects (name TEXT, year INTEGER, kind TEXT, status TEXT, team_size INTEGER);
  INSERT INTO projects VALUES
    ('Pit Lab', 2026, 'ML / simulation', 'building', 1),
    ('RL Robot Arm', 2026, 'research', 'building', NULL),
    ('QueueCare', 2026, 'web app', 'building', 3),
    ('ShelfSense', 2026, 'database', 'building', NULL),
    ('Co-opConnect', 2026, 'web app', 'shipped', 5),
    ('NeuroSleep', 2026, 'data viz', 'live', 1),
    ('SmartCart', 2026, 'algorithms', 'live', 1),
    ('Matilda', 2025, 'robotics', 'shipped', NULL);

  CREATE TABLE project_tech (project TEXT, tech TEXT);
  INSERT INTO project_tech VALUES
    ('Pit Lab','Python'),('Pit Lab','SQL'),('Pit Lab','PyTorch'),
    ('RL Robot Arm','Python'),('RL Robot Arm','Reinforcement learning'),
    ('QueueCare','Python'),('QueueCare','Flask'),('QueueCare','SQLite'),('QueueCare','SQLAlchemy'),
    ('ShelfSense','Oracle SQL'),('ShelfSense','Unix shell'),
    ('Co-opConnect','JavaScript'),('Co-opConnect','Java'),('Co-opConnect','Firebase'),
    ('NeuroSleep','React'),('NeuroSleep','TypeScript'),
    ('SmartCart','JavaScript'),
    ('Matilda','C'),('Matilda','Arduino');

  CREATE TABLE favourites (title TEXT, medium TEXT, year INTEGER, why TEXT);
  INSERT INTO favourites VALUES
    ('Pride & Prejudice', 'film', 2005, 'the romance, the misty mornings'),
    ('Interstellar', 'film', 2014, 'physics + emotion at cinema scale'),
    ('a romance novel', 'book', NULL, 'there is always one on the go');

  CREATE TABLE skills (name TEXT, category TEXT, status TEXT);
  INSERT INTO skills VALUES
    ('Python','language','using'),('Java','language','using'),('C','language','using'),('SQL','language','using'),('Bash','language','using'),
    ('PostgreSQL','data','using'),('Oracle','data','using'),('SQLite','data','using'),('SQLAlchemy','data','using'),('Power BI','data','using'),('Excel','data','using'),
    ('React','web','using'),('Flask','web','using'),('Bootstrap','web','using'),('REST APIs','web','using'),
    ('Arduino','hardware','using'),('Microcontrollers','hardware','using'),
    ('Jira','process','using'),('Agile/Scrum','process','using'),
    ('scikit-learn','ml','learning'),('PyTorch','ml','learning'),('Reinforcement learning','ml','learning'),('MuJoCo','simulation','learning'),('AWS','cloud','learning');
  `;

  const PRESETS = {
    exp: "SELECT role, org, start,\n       COALESCE(end_date, 'present') AS until\nFROM experience\nORDER BY start DESC;",
    now: "SELECT role, org FROM experience\nWHERE end_date IS NULL;",
    proj: "SELECT name, kind, status, team_size\nFROM projects\nORDER BY status, name;",
    py: "SELECT p.name, p.kind, p.status\nFROM projects p\nJOIN project_tech t ON t.project = p.name\nWHERE t.tech = 'Python';",
    skills: "SELECT category,\n       COUNT(*) AS n,\n       GROUP_CONCAT(name, ', ') AS skills\nFROM skills\nGROUP BY category\nORDER BY n DESC;",
    fav: "SELECT title, medium, year, why\nFROM favourites\nORDER BY medium DESC, year;",
    schema: "SELECT name, sql FROM sqlite_master\nWHERE type = 'table';"
  };

  let db = null;

  function render(res, ms) {
    out.innerHTML = '';
    if (!res.length) { const p = document.createElement('p'); p.className = 'muted mono'; p.textContent = 'Query ran. 0 rows.'; out.append(p); meta.textContent = `0 rows · ${ms.toFixed(1)} ms`; return; }
    const { columns, values } = res[res.length - 1];
    const t = document.createElement('table'), thead = document.createElement('thead'), tr = document.createElement('tr');
    columns.forEach((c) => { const th = document.createElement('th'); th.textContent = c; tr.append(th); });
    thead.append(tr); t.append(thead);
    const tb = document.createElement('tbody');
    values.forEach((row) => {
      const r = document.createElement('tr');
      row.forEach((v) => { const td = document.createElement('td'); if (v === null) { td.textContent = 'NULL'; td.className = 'null'; } else { td.textContent = v; if (String(v).length <= 14) td.className = 'nw'; } r.append(td); });
      tb.append(r);
    });
    t.append(tb); out.append(t);
    meta.textContent = `${values.length} row${values.length === 1 ? '' : 's'} · ${ms.toFixed(1)} ms · SQLite ${db.exec('select sqlite_version()')[0].values[0][0]} in WebAssembly`;
  }

  function run() {
    if (!db) return;
    const q = input.value;
    if (/\b(drop|delete|update|insert|alter|create|attach|pragma)\b/i.test(q)) {
      out.innerHTML = '<p class="sql-err">Nice try 😄 This database is read-only. SELECTs only.</p>';
      meta.textContent = '';
      return;
    }
    const t0 = performance.now();
    try { render(db.exec(q), performance.now() - t0); }
    catch (e) { out.innerHTML = ''; const p = document.createElement('p'); p.className = 'sql-err'; p.textContent = 'Error: ' + e.message; out.append(p); meta.textContent = ''; }
  }

  function preset(key) {
    document.querySelectorAll('#sqlPresets button').forEach((b) => b.classList.toggle('on', b.dataset.q === key));
    input.value = PRESETS[key];
    run();
  }

  document.querySelectorAll('#sqlPresets button').forEach((b) => b.addEventListener('click', () => preset(b.dataset.q)));
  $('sqlRun').addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
  input.value = PRESETS.exp;

  if (typeof initSqlJs !== 'function') {
    out.innerHTML = '<p class="sql-err">Couldn\'t load SQLite (offline?). Refresh to try again.</p>';
    return;
  }
  initSqlJs({ locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${f}` })
    .then((SQL) => { db = new SQL.Database(); db.run(SCHEMA); preset('exp'); })
    .catch(() => { out.innerHTML = '<p class="sql-err">Couldn\'t load SQLite (offline?). Refresh to try again.</p>'; });
})();
