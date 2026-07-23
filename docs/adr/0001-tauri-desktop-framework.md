# ADR-0001: Tauri as the desktop framework

**Status:** Accepted
**Date:** 2026-07-23

## Context

We need a desktop framework for a Windows translation tool that must:
- Run locally with no mandatory network access
- Support global hotkeys, system tray, screenshot capture
- Use minimal resources for long-running background presence
- Package as a standard Windows installer

## Decision

Use **Tauri v2** with React + TypeScript frontend and Rust backend.

## Alternatives considered

- **Electron**: Mature ecosystem but heavy (~150MB baseline, full Chromium). Rejected for bloat.
- **WPF/WinForms**: Windows-only is acceptable, but the UI framework is dated and the ecosystem is shrinking.
- **.NET MAUI**: Immature on Windows desktop, poor hotkey/tray support.
- **Flutter Desktop**: Windows support is improving but global hotkeys and system tray are still limited.

## Consequences

- Requires Rust toolchain (additional CI setup)
- Smaller ecosystem than Electron — some plugins may need custom Rust code
- ~10MB binary size vs 150MB for Electron
- Memory usage typically <50MB vs 200MB+ for Electron
- Tauri v2 is production-stable with strong plugin system
