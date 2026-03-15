# All-in-One Utilities

A highly scalable, modern, and high-performance web application that serves as a central hub for various utility tools.

## ✨ Project Goal
The goal of this project is to provide a single, premium interface for all your essential utility tools (e.g., Age Calculator, Unit Converters, Formatters, etc.) with a focus on speed, local-first storage, and modern design.

### 🚀 Key Features:
- **Scalable Architecture**: Easily add new utilities without modifying the core logic.
- **Local Persistence**: Integrated IndexedDB (via Dexie.js) to store user data locally.
- **Premium UI**: Dark-themed, responsive dashboard with glassmorphism and modern typography.
- **CI/CD Ready**: Automated deployment to GitHub Pages via GitHub Actions.

## 🛠️ Project Structure
- `src/core/`: Utility registry and storage adapters.
- `src/utilities/`: Individual tool modules (e.g., `age-calculator`).
- `src/components/`: Shared UI components like the Dashboard.
- `src/hooks/`: Custom hooks for storage and state.
- `src/styles/`: Global design system and theme variables.

## 🏁 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## ➕ How to add a new Utility
1. Create a folder in `src/utilities/[name]`.
2. Implement your tool and a registration function.
3. Register it in `src/utilities/index.ts`.

## 📜 License
MIT
