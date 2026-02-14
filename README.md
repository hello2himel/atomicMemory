# AtomicMemory

![Live Demo](https://img.shields.io/badge/Live-atomicmemory.netlify.app-brightgreen)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue)
![GitHub Repo](https://img.shields.io/badge/GitHub-hello2himel/atomicmemory-181717?logo=github)

AtomicMemory is an interactive, minimalistic web application designed to help users **memorize all 118 chemical elements** of the periodic table. It combines **visual learning, keyboard-first interaction, timed challenges**, and **progress tracking** to create an engaging study experience for chemistry students, enthusiasts, and educators.  

Live demo: [atomicmemory.netlify.app](https://atomicmemory.netlify.app)

---

## Introduction

AtomicMemory is built around the concept of **active recall** and **pattern recognition**. The app presents the entire periodic table in a responsive grid, allowing users to practice in several modes:

- **Full Table Mode:** Attempt all 118 elements in sequence.
- **Block Mode:** Practice by s-, p-, d-, or f-block elements.
- **Group Mode:** Focus on a specific group (column) of the periodic table.
- **Period Mode:** Focus on a specific period (row) of the periodic table.

Each element is represented with its **atomic number, symbol, and name**, and feedback is immediate:

- Correct answers highlight in green.
- Incorrect answers flash red.
- Active element is emphasized for quick navigation.

The app is designed with **keyboard-first operation**, enabling fast input and minimal distractions. 

A visually rich **intro overlay with floating 3D element cubes** adds a modern touch, enhancing engagement without hindering learning.  

---

## Features

- **Multi-Mode Learning:** Full Table, Block, Group, Period.
- **Immediate Feedback:** Color-coded element status.
- **Timed Challenges:** Track speed and accuracy.
- **Progress Tracking:** View history, best times, and completion percentage.
- **Keyboard Navigation:** Enter and arrow keys supported.
- **Responsive Design:** Desktop, tablet, and mobile-friendly.
- **Adaptive Dark/Light Mode:** Automatic or manual toggling.
- **3D Intro Overlay:** Animated floating cubes representing elements.
- **Minimalist UI:** Focused on efficiency, free from distractions.
- **Open Source:** Fully client-side and AGPL-licensed.

---

## Live Demo

Access the live version: [atomicmemory.netlify.app](https://atomicmemory.netlify.app)

---

## Technologies Used

- HTML5, CSS3, Vanilla JavaScript
- CSS Grid for the periodic table layout
- Google Fonts: Inter
- Remix Icon for UI icons
- Fully client-side; serverless deployment via Netlify

---

## Installation & Usage

1. Clone the repository:

```bash
git clone https://github.com/hello2himel/atomicmemory.git
cd atomicmemory
````

2. Open `index.html` in a browser or visit the live demo.

3. Use the **intro overlay** to navigate to the main app.

4. Choose practice mode via **quick settings**.

5. Input element symbols with keyboard or click interface.

6. Track your progress with **history** and **stats bar**.

---

## Folder Structure

```
/atomicmemory
├── /css
│   └── styles.css
├── /js
│   ├── script.js
│   ├── elements.js
│   └── cubes.js
├── /res
│   └── logo.png
└── index.html
```

---

## Contribution

AtomicMemory is open source under the **AGPL-3.0 License**. Contributions, improvements, and suggestions are welcome.

GitHub repository: [hello2himel/atomicmemory](https://github.com/hello2himel/atomicmemory)

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
See [LICENSE](LICENSE) for details.

---

## Author

**Himel Das** – Developer, Open Source Enthusiast, and Physics/Astrophysics Student.
Website: [hello2himel.netlify.app](https://hello2himel.netlify.app)
Email: [hello2himel@proton.me](mailto:hello2himel@proton.me)