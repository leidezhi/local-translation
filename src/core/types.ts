// Core types for the local translation app

/** OCR result for a single text block */
export interface OcrBlock {
  text: string;
  confidence?: number;
  box: { x: number; y: number; width: number; height: number };
  order: number;
}

/** A translation request */
export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: string | "auto";
  targetLanguage: string;
  mode: TranslationMode;
  glossary: GlossaryEntry[];
}

export type TranslationMode = "faithful" | "natural" | "academic" | "casual";

export interface GlossaryEntry {
  source: string;
  target: string;
}

/** Task lifecycle states */
export type TaskStatus =
  | "idle"
  | "capturing"
  | "ocr"
  | "translating"
  | "completed"
  | "cancelled"
  | "failed";

/** Standardized error types the UI can act on */
export type ErrorCategory =
  | "service_unavailable"
  | "connection_refused"
  | "timeout"
  | "model_not_found"
  | "invalid_response"
  | "user_cancelled"
  | "ocr_missing_language"
  | "ocr_no_text"
  | "ocr_engine_error"
  | "screenshot_failed"
  | "hotkey_conflict"
  | "database_error"
  | "input_too_long"
  | "unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  suggestion: string;
  cause?: unknown;
}

/** LLM provider capability interface */
export interface LlmProvider {
  readonly name: string;
  healthCheck(): Promise<boolean>;
  listModels(): Promise<string[]>;
  translate(
    request: TranslationRequest,
    onToken: (token: string) => void,
    signal: AbortSignal,
  ): Promise<void>;
}

/** OCR provider capability interface */
export interface OcrProvider {
  readonly name: string;
  healthCheck(): Promise<boolean>;
  recognize(
    imageBytes: Uint8Array,
    language: string,
    signal: AbortSignal,
  ): Promise<OcrBlock[]>;
}
