# ADR-0002: Provider interface pattern

**Status:** Accepted
**Date:** 2026-07-23

## Context

The app needs to support multiple LLM backends (Ollama, OpenAI-compatible) and OCR engines. We need a consistent way to add new providers without modifying core logic.

## Decision

Define stable TypeScript interfaces at the boundary of each external capability:
- `LlmProvider` — abstract interface for text model inference
- `OcrProvider` — abstract interface for image OCR

Concrete implementations (Ollama, OpenAI-compatible, Tesseract, etc.) live under `src/providers/` and implement these interfaces. The application layer only imports the interfaces.

## Consequences

- New backends can be added without touching translation or OCR workflows
- Mock implementations enable fast integration testing
- Each provider has its own dependencies, keeping the core lean
- Breaking interface changes require updating all providers, but this is expected to be rare
