<div align="center">
  <h1>🛠️ All-in-One Utilities</h1>
  
  [![Deploy to GitHub Pages](https://github.com/lalitmahajn/AIO-Utilities/actions/workflows/deploy.yml/badge.svg)](https://github.com/lalitmahajn/AIO-Utilities/actions/workflows/deploy.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

  <p><strong>A highly scalable, modern, and high-performance web application serving as a central hub for essential daily utility tools.</strong></p>
</div>

<br />

## ✨ Project Goal

The goal of this project is to provide a single, premium interface for all your essential utility tools with a focus on **speed, local-first privacy, and top-tier UI design**. Rather than using different ad-filled websites for basic tasks, AIO Utilities runs completely client-side in your browser.

---

## 🖥️ Demo

Deployed on GitHub Pages: **[Live App (Example Link)](#)** *(Update with actual link when available)*

---

## 🧰 Available Utilities

- 🎂 **Age Calculator** — Calculate exact age from a date of birth, or find the exact gap between two complex dates.
- 📏 **Unit Converter** — Instantly convert between Length, Mass, Temperature, Area, and Volume with automatically sorted output magnitudes.
- 🌍 **World Clock & Timezone Converter** — Search and save global timezones. Includes a smart search algorithm linking countries to IANA IDs, day/night visual indicators, and an interactive timeline.
- 🔓 **PDF Password Remover** — A 100% client-side tool to strip passwords from PDFs using native browser decryption and `pdf-lib`. Your documents never leave your computer.
- 🖼️ **Image Format Converter** — Drag and drop images to instantly convert between PNG, JPG, WEBP, and even rasterize SVG files. Features a real-time quality slider with live file size estimation.

---

## 🚀 Key Features

*   **Scalable Architecture** — A centralized `UtilityRegistry` allows developers to plug-and-play new tools in seconds without modifying core routing logic.
*   **Local Persistence** — Integrated IndexedDB (via `Dexie.js`) silently saves your preferences (like World Clock watchlists) locally.
*   **Premium UI** — A stunning dark-slate theme built with pure CSS, featuring glassmorphism, responsive grids, and highly polished micro-interactions.
*   **Privacy First** — 100% offline-capable client-side processing. Files and data never touch a remote server.
*   **CI/CD Ready** — Automated deployment pipelines using GitHub Actions to deploy directly to GitHub Pages.

---

## 🛡️ Security & Privacy

Since this app handles potentially sensitive user files (like PDFs and Images), we take privacy seriously:

| Layer | Protection |
|-------|-----------|
| **100% Client-Side** | All utilities run directly in your browser's memory. |
| **No File Uploads** | Files are processed locally using HTML5 `Canvas` and Web APIs. |
| **Local Storage** | Your settings and history are saved only to your device via IndexedDB. |
| **Open Source** | Full transparency into how the app processes data. |

---

## 💻 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (CSS Variables + Scoped Modules)
- **Storage**: IndexedDB (Dexie)
- **Key Libraries**: `pdf-lib`, `@pdfsmaller/pdf-decrypt`

---

## 🛠️ Project Structure

```text
src/
├── core/         # Core architectures like the Utility Registry and Storage adapters
├── components/   # Shared UI (Dashboard, Sidebar, Layout)
├── utilities/    # Individual isolated tool packages (age-calculator, image-tools, etc.)
├── hooks/        # Reusable React hooks
└── styles/       # Global design system & theme tokens
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (for local development)

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

MIT License - Not for commercial distribution. See LICENSE file for details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) — UI Library
- [Vite](https://vitejs.dev/) — Next Generation Frontend Tooling
- [pdf-lib](https://pdf-lib.js.org/) — PDF Manipulation
- [Lucide](https://lucide.dev/) — Beautiful SVG icons
- [Inter](https://rsms.me/inter/) — UI typeface

