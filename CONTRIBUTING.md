# Contributing to Solstice

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Getting Started

```bash
git clone https://github.com/amit-biswas-1992/solstice.git
cd solstice
npm install
npm run dev:electron
```

The default PIN for a fresh install is `1234`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:electron` | Start the Electron app in development mode |
| `npm run dev` | Start only the Vite dev server (renderer) |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run smoke` | Run Playwright end-to-end tests |
| `npm run build` | Build for production |
| `npm run package` | Package the desktop app |

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [Issues](../../issues)
2. Use the **Bug Report** template
3. Include your OS, Node version, and steps to reproduce

### Suggesting Features

1. Open a [Feature Request](../../issues/new?template=feature_request.md)
2. Describe the use case and why it matters for daily workflows
3. Keep the scope focused on day-oriented productivity

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with a clear message
6. Push and open a Pull Request

### Pull Request Guidelines

- Keep PRs focused on a single change
- Follow the existing code style (TypeScript, Tailwind CSS)
- Add tests for new functionality
- Update documentation if needed
- Ensure all tests pass before requesting review

## Architecture Overview

```
solstice/
  electron/          # Main process (Node.js)
    main.ts          # BrowserWindow setup
    preload.ts       # Sandboxed bridge to renderer
    ipc/             # IPC channel handlers
    storage/         # JSON file persistence
  src/               # Renderer process (React)
    components/      # UI components
    lib/             # Utility functions
    types/           # TypeScript types and Zod schemas
    styles/          # Tailwind theme and global styles
```

### Key Principles

- **Local-first**: All data stays on the user's machine as JSON files
- **Day-oriented**: Every feature should connect back to daily workflows
- **Lean renderer**: No filesystem access in the renderer; everything goes through the typed IPC bridge
- **Calm UI**: Warm, editorial design direction. No loud chrome or busy interfaces

### Process Boundaries

- **Main process** owns storage, auth, and system APIs
- **Preload script** exposes a typed `window.dailyNotesDesktop` API
- **Renderer** communicates only through the preload bridge
- IPC channels are defined as constants in `src/types/ipc.ts`

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling (no raw CSS for component styles)
- Zod for runtime validation at IPC boundaries
- React function components with hooks
- Sentence case for UI text

## Need Help?

- Open a [Discussion](../../discussions) for questions
- Check the [README](README.md) for setup instructions
- Review existing issues and PRs for context
