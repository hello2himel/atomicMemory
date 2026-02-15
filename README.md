# AtomicMemory

![Live Demo](https://img.shields.io/badge/Live-atomicmemory.netlify.app-brightgreen)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue)
![GitHub Repo](https://img.shields.io/badge/GitHub-hello2himel/atomicmemory-181717?logo=github)

AtomicMemory is an interactive, gamified web application for mastering all **118 chemical elements** of the periodic table. It uses active recall, immediate feedback, and a competitive scoring system to create an engaging study experience for chemistry students, enthusiasts, and educators.

Live demo: [atomicmemory.netlify.app](https://atomicmemory.netlify.app)

---

## Features

- **Multi-Mode Practice** — Full Table, Block (s/p/d/f), Group, and Period modes
- **Keyboard-First Interaction** — Type element symbols, navigate with arrow keys, submit with Enter
- **Immediate Feedback** — Correct answers highlight green, wrong answers flash red
- **Scoring & Ranks** — 7 rank tiers from Novice to Legendary with bonuses and penalties
- **Achievements** — 15 unlockable achievements (First Element, Speed Demon, Perfectionist, etc.)
- **Leaderboard** — Top 10 personal best scores with mode, date, accuracy, and time
- **Practice History** — Track your last 50 sessions
- **View Mode** — Toggle to reveal all element symbols and names on the table for reference
- **Timed Challenges** — Track speed and accuracy per session
- **Dark / Light Theme** — Auto-detects system preference or toggle manually
- **Responsive Design** — Full desktop and mobile support with dedicated mobile input UI
- **Animated Intro** — Periodic table animation with random color flashes and category-color settling
- **Fully Client-Side** — No server needed; all data stored in localStorage

---

## How It Works

1. **Choose a mode** — Full (all 118), Block, Group, or Period
2. **Click an element** — An input field appears; type the element's chemical symbol
3. **Get feedback** — Correct answers are marked green; mistakes flash red with point penalties
4. **Complete the challenge** — Fill in all active elements to finish and see your score breakdown
5. **Track progress** — View your history, achievements, and leaderboard from the header

### Navigation

- **Horizontal mode** — Elements advance left-to-right across periods
- **Vertical mode** — Elements advance top-to-bottom within groups
- **Arrow keys** — Navigate between elements manually

### Scoring

| Action | Points |
|--------|--------|
| Correct (first try) | +50 |
| Streak bonus | +10 per streak (max 10) |
| Perfect run | +1,000 |
| Speed bonus (<5 min for 118) | +500 |
| Mistake (1st) | −50 |
| Mistake (2nd) | −100 |
| Mistake (3rd+) | −200 |
| Hint used | −25 to −150 |

### Rank Tiers

Novice → Apprentice → Chemist → Expert → Master → Grand Master → Legendary

---

## Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — No frameworks or build tools
- **CSS Grid** — Periodic table layout
- **CSS Variables** — Theming (dark/light mode)
- **Google Fonts** — Outfit (display), IBM Plex Mono (monospace)
- **Remix Icon v3.5.0** — UI icons via CDN
- **localStorage** — Persistent scores, history, achievements, and preferences
- **Netlify** — Serverless deployment

---

## Folder Structure

```
/atomicmemory
├── index.html              # Main app (intro, header, table, modals)
├── css/
│   └── styles.css          # Complete styling with CSS variables and responsive design
├── js/
│   ├── elements.js         # 118-element data array (number, symbol, name, category, etc.)
│   ├── script.js           # Core app logic (rendering, interaction, state, modals, mobile)
│   ├── scoring.js          # Scoring system, rank tiers, leaderboard, localStorage
│   ├── achievements.js     # 15 achievement definitions and unlock manager
│   └── cubes.js            # Intro animation and logo grid animation
└── res/
    └── logo.png            # App logo
```

---

## Installation

```bash
git clone https://github.com/hello2himel/atomicmemory.git
cd atomicmemory
```

Open `index.html` in a browser, or serve with any static file server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

---

## Contributing

AtomicMemory is open source under the **AGPL-3.0 License**. Contributions, improvements, and suggestions are welcome.

GitHub: [hello2himel/atomicmemory](https://github.com/hello2himel/atomicmemory)

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
See [LICENSE](LICENSE) for details.

---

## Author

**Himel Das** — Developer, Open Source Enthusiast, and Physics/Astrophysics Student.

Website: [hello2himel.netlify.app](https://hello2himel.netlify.app)
Email: [hello2himel@proton.me](mailto:hello2himel@proton.me)