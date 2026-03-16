<div align="center">
  <h1>🛠️ All-in-One Utilities</h1>
  
  [![Deploy to GitHub Pages](https://github.com/lalitmahajn/AIO-Utilities/actions/workflows/deploy.yml/badge.svg)](https://github.com/lalitmahajn/AIO-Utilities/actions/workflows/deploy.yml)
  [![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-red.svg)](LICENSE)

  <p><strong>A highly scalable, modern, and high-performance web application serving as a central hub for essential daily utility tools.</strong></p>
</div>

<br />

## ✨ Project Goal

The goal of this project is to provide a single, premium interface for all your essential utility tools with a focus on **speed, local-first privacy, and top-tier UI design**. Rather than using different ad-filled websites for basic tasks, AIO Utilities runs completely client-side in your browser.

---

## 🖥️ Demo

Deployed on GitHub Pages: **[Live App](https://lalitmahajn.github.io/AIO-Utilities/)**

---

## 🧰 Available Utilities

- 🎂 **Age Calculator** — Calculate exact age from a date of birth, or find the exact gap between two complex dates.
- 📏 **Unit Converter** — Instantly convert between Length, Mass, Temperature, Area, and Volume with automatically sorted output magnitudes.
- 🌍 **World Clock & Timezone Converter** — Search and save global timezones. Includes a smart search algorithm linking countries to IANA IDs, day/night visual indicators, and an interactive timeline.
- 📝 **Grammar Checker** — AI-powered prose analysis using LanguageTool. Features real-time error highlighting, tooltips with grammatical explanations, and a one-click "Auto-Fix All" button.
- 🔓 **PDF Password Remover** — A 100% client-side tool to strip passwords from PDFs using native browser decryption and `pdf-lib`. Your documents never leave your computer.
- 🖼️ **Image Tools** — 
    - **Format Converter**: Drag and drop images to convert between PNG, JPG, WEBP, and SVG. 
    - **Image Compressor**: Reduce file sizes to a specific target (KB/MB) using high-performance client-side scaling.
- 🔗 **QR Code Generator** — Generate premium QR codes with custom colors, adjustable error correction levels, and the ability to overlay logos at custom positions.

---

## 🚀 Key Features

*   **Scalable Architecture** — A centralized `UtilityRegistry` allows developers to plug-and-play new tools in seconds without modifying core routing logic.
*   **Local Persistence** — Integrated IndexedDB (via `Dexie.js`) silently saves your preferences (like World Clock watchlists or QR settings) locally.
*   **Premium UI** — A stunning dark-slate theme built with pure CSS, featuring glassmorphism, responsive grids, and highly polished micro-interactions.
*   **Privacy First** — Most utilities process data 100% offline. The Grammar Checker uses an external API (clearly marked) but everything else happens in your browser.
*   **CI/CD Ready** — Automated deployment pipelines using GitHub Actions.

---

## 🛡️ Security & Privacy

Since this app handles potentially sensitive user files (like PDFs and Images), we take privacy seriously:

| Layer | Protection |
|-------|-----------|
| **100% Client-Side** | All core utilities run directly in your browser's memory. |
| **External API (Opt-in)** | The **Grammar Checker** sends text to LanguageTool API for analysis. This is the only tool that requires an internet connection. |
| **No Data Mining** | Files are processed locally. We do not store or see your documents. |
| **Local Storage** | Your settings and history are saved only to your device via IndexedDB. |

---

## 💻 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS (Premium Design System)
- **Storage**: IndexedDB (Dexie)
- **Key APIs**: `pdf-lib`, `LanguageTool API`, `qrcode`

---

## 🛠️ Project Structure

```text
src/
├── core/         # Registry, Storage, and Hub architectures
├── components/   # Shared UI components (Dashboard, Layout)
├── utilities/    # Isolated tool logic (Age Calc, PDF, QR, etc.)
├── hooks/        # Persistence and UI state hooks
└── styles/       # Global theme and animation tokens
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/lalitmahajn/AIO-Utilities.git
cd AIO-Utilities
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 4. Production Build
```bash
npm run build
```

---

## 🌐 Deploy to GitHub Pages

The repo includes a GitHub Actions workflow that deploys automatically.

1. **Enable Pages** — Go to repo **Settings → Pages → Source** and select **GitHub Actions**.
2. **Push to `main`** — The workflow runs automatically and deploys your site to GitHub Pages.

---

## ➕ How to add a new Utility

Scaling this application is designed to be frictionless:

1. Create a designated folder in `src/utilities/[utility-name]`.
2. Implement your React component and export a registration payload matching the `Utility` interface.
3. Import and fire your registration function inside `src/utilities/index.ts`.
4. The Dashboard will automatically detect, route, and render your new tool!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-utility`)
3. Commit your changes (`git commit -m 'Add new utility'`)
4. Push to the branch (`git push origin feature/new-utility`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **PolyForm Noncommercial License 1.0.0** — you may use, modify, and distribute this software for **non-commercial purposes only**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) — UI Library
- [Vite](https://vitejs.dev/) — Next Generation Frontend Tooling
- [pdf-lib](https://pdf-lib.js.org/) — PDF Manipulation
- [Lucide](https://lucide.dev/) — Beautiful SVG icons
- [Inter](https://rsms.me/inter/) — UI typeface

