<div align="center">
  <h1>🛠️ All-in-One Utilities</h1>
  <p><strong>A highly scalable, modern, and high-performance web application serving as a central hub for essential daily utility tools.</strong></p>
</div>

<br />

## ✨ Project Goal

The goal of this project is to provide a single, premium interface for all your essential utility tools with a focus on **speed, local-first privacy, and top-tier UI design**. Rather than using different ad-filled websites for basic tasks, AIO Utilities runs completely client-side in your browser.

## 🧰 Available Utilities

- 🎂 **Age Calculator**: Calculate exact age from a date of birth, or find the exact gap between two complex dates.
- 📏 **Unit Converter**: Instantly convert between Length, Mass, Temperature, Area, and Volume with automatically sorted output magnitudes.
- 🌍 **World Clock & Timezone Converter**: Search and save global timezones. Includes a smart search algorithm linking countries to IANA IDs, day/night visual indicators, and a live/paused interactive timeline.
- 🔓 **PDF Password Remover**: A 100% client-side tool to strip passwords from PDFs using native browser decryption and `pdf-lib`. Your documents never leave your computer.
- 🖼️ **Image Format Converter**: Drag and drop images to instantly convert between PNG, JPG, WEBP, and even rasterize SVG files. Features a real-time quality slider with live file size estimation.

## 🚀 Key Features

*   **Scalable Architecture**: A centralized `UtilityRegistry` allows developers to plug-and-play new tools in seconds without modifying core routing logic.
*   **Local Persistence**: Integrated IndexedDB (via `Dexie.js`) silently saves your preferences (like World Clock watchlists) locally.
*   **Premium UI**: A stunning dark-slate theme built with pure CSS, featuring glassmorphism, responsive grids, and highly polished micro-interactions.
*   **Privacy First**: 100% offline-capable client-side processing. Files and data never touch a remote server.
*   **CI/CD Ready**: Automated deployment pipelines using GitHub Actions to deploy directly to GitHub Pages.

## 💻 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (CSS Variables + Scoped Modules)
- **Storage**: IndexedDB (Dexie)
- **Key Libraries**: `pdf-lib`, `@pdfsmaller/pdf-decrypt`

## 🛠️ Project Structure

```text
src/
├── core/         # Core architectures like the Utility Registry and Storage adapters
├── components/   # Shared UI (Dashboard, Sidebar, Layout)
├── utilities/    # Individual isolated tool packages (age-calculator, image-tools, etc.)
├── hooks/        # Reusable React hooks
└── styles/       # Global design system & theme tokens
```

## 🏁 Getting Started

### Prerequisites
- Node.js 18+

### Installation
```bash
git clone https://github.com/lalitmahajn/AIO-Utilities.git
cd AIO-Utilities
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## ➕ How to add a new Utility

Scaling this application is designed to be frictionless:

1. Create a designated folder in `src/utilities/[utility-name]`.
2. Implement your React component and export a registration payload matching the `Utility` interface.
3. Import and fire your registration function inside `src/utilities/index.ts`.
4. The Dashboard will automatically detect, route, and render your new tool!

## 📜 License

MIT License - Not for commercial distribution. See LICENSE file for details.

