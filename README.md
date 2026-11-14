# mithusavasu.github.io · MITHUSA (Now Streaming)

My portfolio as a streaming app. Pick a profile, browse rows of "titles", and press play: most of them are live demos that run in your browser.

**Live:** https://mithusavasu.github.io

## Features

| Feature | What it does | How it works |
|---|---|---|
| **MV Studios intro** | Animated logo, then "Who's watching?" | CSS keyframes |
| **Profiles** | Recruiter / Engineer / Film buff / Explorer: each gets a different featured title and row order | `js/titles.js` profiles config |
| **Rows** | Top 10, Continue Watching (progress bars), Interactive, Robotics & Cars, Off the Clock (Pride & Prejudice, Interstellar, romance novels, photography, exploring), a docuseries and Experience | Hover-zoom cards with generated SVG poster art |
| **Title modal** | Episodes, cast (tech stack), genres, More Like This, plus the **live demo playing inside** | Demo DOM is moved into the modal on open |
| **Live demos** | Robot arm IK · SQLite résumé (WebAssembly) · neuroevolving race cars · lap-sim setup optimizer · project bookshelf | Canvas + sql.js |
| **Torque** 🚗➜🤖 | A little car that transforms into a robot and answers questions about me | SVG parts animated with CSS transforms; TF-IDF + cosine-similarity retrieval |
| **Cursor car** | A top-down race car chases your cursor, drifts and does donuts | Canvas steering physics with fading tire marks |
| **Extras** | Search, My List, “Are you still watching?” | `sessionStorage` |

No frameworks, no build step: plain HTML, CSS and JavaScript (plus sql.js from cdnjs). It's styled after streaming apps but has its own branding and isn't affiliated with any streaming service.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

```
index.html       layout, demo stage, modal, chat
css/style.css    all styling
js/titles.js     catalogue of titles, rows, profiles, poster art
js/app.js        intro, profiles, hero, rows, modal, search, My List
js/chat.js       Torque the transforming chat bot
js/follower.js   cursor-chasing race car
js/graphics.js   SVG robot + race car
js/arm.js        robot arm IK
js/sqltile.js    SQLite résumé
js/evolve.js     neuroevolution
js/tracks.js     track geometry
js/lapsim.js     lap simulator + optimizer
js/pitlab.js     setup optimizer UI
js/books.js      bookshelf
```
