# CLAUDE.md

## Purpose

This file is the product, architecture, and UI contract for `daily-notes-desktop`.

Use it when changing:

- dependencies or build tooling
- Electron main/preload/renderer boundaries
- IPC channels or payloads
- storage/auth/update/logging architecture
- labels, placeholders, headings, or feature wording
- layout or styling direction

## Product Definition

`daily-notes-desktop` is a local-first desktop planner for one user on one machine.

Core product shape:

- static local PIN unlock
- local persistence only
- left projects rail
- center month grid with square date cards
- right selected-day workspace
- inline editing first
- popup editing for move/retag/long-form edits
- local organizer bar for fast command-style input

This app is not a team collaboration tool, not a chat assistant, and not a metrics dashboard.

## Design Direction

The visual system follows the Claude Calm Editorial direction in [design.md](/Users/hello/Work/My%20Work/Neutrix/daily-notes-desktop/design.md).

High-level design rules:

- keep the layout calm, warm, and editorial
- preserve the three-panel desktop workspace
- keep the projects rail collapsible
- keep date cards square and scan-first
- do not print repetitive state words like `Empty` or `Active` on every card
- prefer tonal separation, spacing, and typography over loud chrome

## Stack Contract

### Preferred Platform Stack

Use this as the target stack for future work:

- `Electron`
- `Vite`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Zustand`
- `Zod`
- `electron-log`
- `electron-builder`
- `electron-updater`
- `Playwright`
- `Sentry`

### Current Repo Audit

As of `2026-05-26`, the repo currently uses:

- active and installed: `Electron`, `Vite`, `React`, `TypeScript`, `Tailwind CSS`, `Zod`, `Playwright`, `electron-builder`
- installed but not yet added: none beyond the above
- not installed and not used yet: `Zustand`, `electron-store`, `electron-log`, `electron-updater`, `better-sqlite3`, `Sentry`, `keytar`, `sharp`, `node-pty`, `execa`, `uuid`, `date-fns`

### Dependency Decisions

- Keep the renderer lean. Do not add packages casually.
- Prefer `Zod` for all cross-process validation and storage-bound payload checks.
- Prefer `Zustand` if renderer state grows beyond straightforward local component state.
- Keep `better-sqlite3` out until JSON storage becomes a real product bottleneck or relational querying is clearly needed.
- Add `electron-updater` only with release channels, signing, logging, and rollback planning already defined.
- Add `keytar` only when the app stores machine-sensitive credentials rather than a local planner PIN.
- Add `node-pty` only if a real terminal surface becomes a committed feature.

## Styling Rules

- Do not expand raw CSS as the default styling path.
- Prefer Tailwind for new UI work and component-level styling.
- Keep [src/styles/app.css](/Users/hello/Work/My%20Work/Neutrix/daily-notes-desktop/src/styles/app.css) limited to Tailwind theme tokens, reset/base rules, and global font/background setup.
- Do not move layout, card, form, or panel styling back into raw handcrafted CSS selectors.
- Do not introduce ad hoc colors, spacing values, or one-off shadows outside the design system.

## Electron Architecture Rules

### Process Boundaries

- Renderer code must not know about filesystem paths, updater internals, OS APIs, or database details.
- Renderer code talks only through the typed preload bridge.
- Main process owns storage, auth, logging, update orchestration, crash reporting, and future database access.

### Service Layering

Business logic belongs in Electron main services, not React components.

Preferred structure:

- `electron/services/file.service.ts`
- `electron/services/auth.service.ts`
- `electron/services/updater.service.ts`
- `electron/services/log.service.ts`

Small helper modules under `electron/storage` or `electron/ipc` are acceptable, but UI components should not absorb that logic.

### IPC Contract

- Never scatter raw IPC channel strings across the codebase.
- Use the shared contract in [src/types/ipc.ts](/Users/hello/Work/My%20Work/Neutrix/daily-notes-desktop/src/types/ipc.ts).
- Channel names must be exported constants, not repeated inline strings.
- Request and response payload types belong beside the channel definitions.

Current shared channels:

- `storage:loadStore`
- `storage:saveStore`
- `auth:unlock`

### IPC Validation

Treat every renderer payload as untrusted.

- Validate IPC input in `ipcMain.handle(...)` before business logic runs.
- Use `Zod` schemas from the shared IPC contract.
- Reject malformed payloads immediately instead of letting storage or auth code guess.

Pattern to follow:

```ts
ipcMain.handle(IPC.SAVE_STORE, (_event, payload: unknown) => {
  const snapshot = unlockedStoreSnapshotSchema.parse(payload);
  return saveUnlockedStoreAtRoot(rootDir, snapshot);
});
```

## Storage Rules

- Local persistence is currently custom JSON storage under Electron main.
- Do not let renderer code read or write JSON files directly.
- If storage evolves, keep migration logic in main-process services.
- If the app moves from JSON to SQLite later, preserve the same preload/IPC boundary so the renderer does not change transport assumptions.

## Logging, Updates, and Release Rules

### Logging

- Prefer `electron-log` when structured app logging is introduced.
- Main-process logs should cover storage failures, update lifecycle, preload/main startup failures, and crash recovery paths.

### Auto-update

Do not add auto-update casually.

Production auto-update requires:

- code signing
- release channels
- rollback strategy
- update event logging
- crash reporting

### Packaging

- `electron-builder` is acceptable and is the current packaging tool.
- If the app later moves to Electron Forge, keep the same process-boundary rules and testing expectations.

## Testing Contract

Minimum testing coverage:

- unit tests for business logic
- IPC contract tests for preload/main payload boundaries
- end-to-end desktop flow tests with `Playwright`
- build/package verification for target desktop artifacts

For this repo specifically:

- storage/auth flows must be covered with tests
- malformed IPC payloads must have tests
- month-grid and selected-day behavior must stay covered

## UI Text Rules

### General Writing

- Prefer clear, accurate, concise text.
- Keep labels short.
- Use the user’s vocabulary, not implementation language.
- Favor direct action labels over decorative copy.

### Capitalization

- Use sentence case for titles, labels, and headings.
- Avoid all-caps except for tiny established metadata when necessary.

### Labels And Placeholders

- Every input needs a visible label or clear adjacent label.
- Do not rely on placeholder text as the only label.
- Placeholder text should be short, example-driven, and non-wrapping where possible.

### Day Card Text

- Prioritize scanability over prose.
- Empty cards should stay visually quiet.
- Active cards should use compact counts or indicators.
- Do not add repeated visible state words to every card.

### Buttons

Prefer direct labels such as:

- `Add`
- `Add note`
- `Add task`
- `Save`
- `Save changes`
- `Unlock workspace`
- `Open editor`

## Responsive Layout Rules

- Large widths should preserve a clear three-panel workspace.
- Medium widths should let the detail panel drop below before crushing the calendar.
- Small widths should stack earlier instead of preserving desktop density at all costs.
- The collapsible projects rail should remain functional across widths.
