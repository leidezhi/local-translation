# ADR-0003: SQLite for local storage

**Status:** Accepted
**Date:** 2026-07-23

## Context

The app needs to persist settings, glossary entries, and translation history locally. Data must remain on-device and be queryable without a server.

## Decision

Use SQLite via `tauri-plugin-sql` with the Rust `sqlx` driver.

## Alternatives considered

- **JSON files**: Simple but no query support, concurrency issues, data corruption risk on crash.
- **IndexedDB (browser)**: Tauri WebView has limited storage guarantees; not suitable for persistence the user expects to survive.
- **Dexie.js**: Abstraction over IndexedDB — same underlying issues.

## Consequences

- Settings, history, and glossary are properly relational
- Migrations are explicit and reversible
- History can be disabled entirely via a setting; when off, the history table is never written to
- Database file lives in the OS app data directory (not source tree)
