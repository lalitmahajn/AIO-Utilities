# Developer Guide

AIO Utilities is built on a modular, registry-based architecture that makes it easy to scale.

## 🏗️ Project Structure
```text
src/
├── core/         # The "Brain" (Registry, Storage, Hub logic)
├── components/   # Shared UI components (Dashboard, Layout)
├── utilities/    # Isolated tool logic (The content of the app)
├── hooks/        # Custom hooks for state and persistence
└── styles/       # Design system and theme variables
```

## 🛠️ Tech Stack
*   **Core**: React 19 + TypeScript
*   **Build**: Vite 8
*   **Storage**: IndexedDB (via Dexie.js) for local persistence.
*   **API**: LanguageTool (Plus) for Grammar Checking.
*   **NPM**: Primary package manager.

## ➕ How to add a new Utility
Adding a tool is designed to be frictionless:

1.  **Create a folder**: Add your utility in `src/utilities/[your-tool-name]`.
2.  **Define Metadata**: Export a registration function that follows the `Utility` interface:
    ```typescript
    export const registerYourTool = () => {
      registry.register({
        id: 'your-tool',
        name: 'Your Tool Name',
        icon: <YourIcon />,
        category: 'productivity',
        component: React.lazy(() => import('./YourComponent'))
      });
    };
    ```
3.  **Register**: Call your function in `src/utilities/index.ts`.
4.  **Done**: The Dashboard will automatically render your tool card and handle routing!

## 🧪 Testing & Build
*   **Lint**: `npm run lint`
*   **Build**: `npm run build`
*   **Preview**: `npm run preview`
