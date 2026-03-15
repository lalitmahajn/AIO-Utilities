# All-in-One Utilities Project

## Project Goal
The goal of this project is to create a highly scalable, modern, and high-performance web application that serves as a central hub for various utility tools (e.g., Age Calculator, Unit Converters, Formatter, etc.).

### Key Objectives:
- **Scalability**: Easily add new utilities without modifying the core architecture.
- **Hybrid Storage**: Use IndexedDB for local/temporary storage and provide hooks for permanent cloud storage (Supabase).
- **Modern UI**: A premium, responsive, and dynamic interface with micro-animations and a consistent design language.
- **Automated Deployment**: GitHub Actions integration for seamless CI/CD to GitHub Pages.

## Project Structure

```text
/
├── .github/
│   └── workflows/          # GitHub Actions for CI/CD
├── src/
│   ├── core/               # Hub logic, Storage adapters, Registry
│   ├── components/         # Shared UI components (Layout, Sidebar, Cards)
│   ├── utilities/          # Individual utility modules
│   │   ├── age-calculator/
│   │   ├── unit-converter/
│   │   └── ...
│   ├── hooks/              # Custom React hooks (Storage, UI state)
│   ├── assets/             # Static assets (icons, images)
│   ├── styles/             # Global CSS variables and utility classes
│   ├── App.tsx             # Main entry point and routing
│   └── main.tsx
├── public/                 # Static assets for the build
├── package.json
└── vite.config.ts
```

## Architecture Details

### 1. Utility Registry
Each utility will be a self-contained module that registers itself with the core hub. This allows for dynamic loading and easy expansion.

### 2. Storage Layer
- **Local (IndexedDB)**: Primary storage for quick access and offline support.
- **Cloud (Supabase)**: Optional hook for synchronization across devices.

### 3. UI Foundation
- **Dashboard**: A searchable, categorized grid of available utilities.
- **Navigation**: Sidebar or Header for quick access to pinned utilities.
- **Theme**: Dark/Light mode support with a premium slate/accent palette.
