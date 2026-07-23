import { useState, useCallback } from "react";

export type ProviderType = "ollama" | "openai-compat";

export interface AppSettings {
  providerType: ProviderType;
  ollamaUrl: string;
  ollamaModel: string;
  openAiUrl: string;
  openAiModel: string;
  openAiKey: string;
  timeoutMs: number;
  defaultSourceLang: string;
  defaultTargetLang: string;
  translationMode: string;
  ocrLanguage: string;
  saveHistory: boolean;
}

const DEFAULTS: AppSettings = {
  providerType: "ollama",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen3-4b-fixed",
  openAiUrl: "http://localhost:8080/v1",
  openAiModel: "",
  openAiKey: "",
  timeoutMs: 60000,
  defaultSourceLang: "auto",
  defaultTargetLang: "zh",
  translationMode: "natural",
  ocrLanguage: "chi_sim+eng",
  saveHistory: true,
};

const STORAGE_KEY = "app_settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch { /* corrupted, use defaults */ }
  return { ...DEFAULTS };
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    saveSettings(DEFAULTS);
  }, []);

  return { settings, update, reset };
}
