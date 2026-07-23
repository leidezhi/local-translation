import { useState, useMemo } from "react";
import { LanguageSelector } from "./components/LanguageSelector";
import { TranslationPanel } from "./components/TranslationPanel";
import { useTranslation } from "./hooks/useTranslation";
import { OllamaProvider } from "./providers/ollama";
import { OpenAiCompatibleProvider } from "./providers/openai-compat";
import type { LlmProvider, TranslationMode } from "./core/types";
import "./App.css";

function createProvider(): LlmProvider | null {
  // Try Ollama first (most common local setup)
  // In production, this reads from settings
  const ollamaUrl = localStorage.getItem("ollama_url") || "http://localhost:11434";
  const ollamaModel = localStorage.getItem("ollama_model") || "";

  if (ollamaModel) {
    return new OllamaProvider({ baseUrl: ollamaUrl, model: ollamaModel });
  }

  const openAiUrl = localStorage.getItem("openai_url") || "";
  const openAiModel = localStorage.getItem("openai_model") || "";

  if (openAiUrl && openAiModel) {
    return new OpenAiCompatibleProvider({ baseUrl: openAiUrl, model: openAiModel });
  }

  return null;
}

function App() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [mode] = useState<TranslationMode>("natural");
  const [glossary] = useState<Array<{ source: string; target: string }>>([]);

  const provider = useMemo(() => createProvider(), []);
  const { state, translate, cancel, reset } = useTranslation({
    provider,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    mode,
    glossary,
  });

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>本地翻译</h1>
        <span className="app-subtitle">Privacy-first</span>
      </header>

      <LanguageSelector
        sourceLanguage={sourceLang}
        targetLanguage={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
        onSwap={handleSwap}
        disabled={state.status === "translating"}
      />

      <TranslationPanel
        status={state.status}
        translatedText={state.translatedText}
        error={state.error}
        onTranslate={translate}
        onCancel={cancel}
        onReset={reset}
      />

      {!provider && (
        <div className="setup-hint">
          <p>未检测到翻译服务。请在设置中配置 Ollama 或 OpenAI-compatible 本地接口。</p>
          <p>
            快速开始：安装 <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">Ollama</a> 并运行{" "}
            <code>ollama run qwen2.5:7b</code>
          </p>
        </div>
      )}
    </main>
  );
}

export default App;
