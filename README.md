# AtomicMemory

![Live Demo](https://img.shields.io/badge/Live-atomicmemory.netlify.app-brightgreen)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue)
![GitHub Repo](https://img.shields.io/badge/GitHub-hello2himel/atomicmemory-181717?logo=github)

AtomicMemory is an interactive, gamified web application for mastering all **118 chemical elements** of the periodic table. It uses active recall, immediate feedback, and a competitive scoring system to create an engaging study experience for chemistry students, enthusiasts, and educators.

Live demo: [atomicmemory.netlify.app](https://atomicmemory.netlify.app)

---

## Features

- **Full Table Challenge** — Practice all 118 elements; answer as many as you can, then press Finish
- **Keyboard-First Interaction** — Type element symbols, navigate between cells with arrow keys, submit with Enter
- **Arrow Key Navigation** — Move between element cells using arrow keys while inputting (desktop) or arrow buttons (mobile)
- **Finish Anytime** — Press the Finish button to end the challenge at any point and see your score
- **Immediate Feedback** — Correct answers highlight green, wrong answers flash red
- **Scoring & Ranks** — 7 rank tiers from Novice to Legendary with bonuses and penalties
- **Achievements** — 15 unlockable achievements (First Element, Speed Demon, Perfectionist, etc.)
- **Leaderboard** — Top 10 personal best scores with date, accuracy, and time
- **Practice History** — Track your last 50 sessions
- **View Mode** — Toggle to reveal all element symbols and names on the table for reference
- **Timed Challenges** — Track speed and accuracy per session
- **Dark / Light Theme** — Auto-detects system preference or toggle manually
- **Responsive Design** — Full desktop and mobile support with dedicated mobile input UI
- **Mobile QWERTY Keyboard** — Wordle-style on-screen keyboard; no native keyboard needed
- **Cell-like Mobile Input** — Input display looks like a periodic table cell with atomic number and symbol
- **Mobile Arrow Keys** — On-screen directional buttons for navigating between elements on mobile
- **Desktop Bottom Nav** — Game stats and action buttons in a fixed bottom navigation bar
- **Animated Intro** — Periodic table animation with random color flashes and category-color settling (desktop); simplified setup screen (mobile)
- **Fully Client-Side** — No server needed; all data stored in localStorage

---

## How It Works

1. **Start the challenge** — On desktop, all 118 elements are shown in the periodic table; on mobile, a simplified setup screen appears
2. **Click an element (desktop)** — An input field appears; type the element's chemical symbol
3. **Type on QWERTY keyboard (mobile)** — Use the on-screen keyboard to type; input looks like a periodic table cell
4. **Navigate with arrow keys** — Use arrow keys (desktop) or arrow buttons (mobile) to move between cells
5. **Get feedback** — Correct answers are marked green; mistakes flash red with point penalties
6. **Finish anytime** — Press the Finish button when you're done to see your score breakdown
7. **Track progress** — View your history, achievements, and leaderboard

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
└── README.md               # Documentation
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