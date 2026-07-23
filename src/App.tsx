import { useState, useMemo } from "react";
import { LanguageSelector } from "./components/LanguageSelector";
import { TranslationPanel } from "./components/TranslationPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useTranslation } from "./hooks/useTranslation";
import { useSettings } from "./hooks/useSettings";
import { OllamaProvider } from "./providers/ollama";
import { OpenAiCompatibleProvider } from "./providers/openai-compat";
import type { TranslationMode } from "./core/types";
import "./App.css";

type Tab = "translate" | "settings";

function App() {
  const [tab, setTab] = useState<Tab>("translate");
  const { settings, update, reset } = useSettings();
  const [glossary] = useState<Array<{ source: string; target: string }>>([]);

  const provider = useMemo(() => {
    if (settings.providerType === "ollama") {
      return new OllamaProvider({
        baseUrl: settings.ollamaUrl,
        model: settings.ollamaModel,
        timeoutMs: settings.timeoutMs,
      });
    }
    return new OpenAiCompatibleProvider({
      baseUrl: settings.openAiUrl,
      model: settings.openAiModel,
      apiKey: settings.openAiKey || undefined,
      timeoutMs: settings.timeoutMs,
    });
  }, [settings]);

  const { state, translate, cancel, reset: resetTranslation } = useTranslation({
    provider,
    sourceLanguage: settings.defaultSourceLang,
    targetLanguage: settings.defaultTargetLang,
    mode: settings.translationMode as TranslationMode,
    glossary,
  });

  const handleSwap = () => {
    if (settings.defaultSourceLang === "auto") return;
    update({
      defaultSourceLang: settings.defaultTargetLang,
      defaultTargetLang: settings.defaultSourceLang,
    });
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>本地翻译</h1>
        <span className="app-subtitle">Privacy-first</span>
        <nav className="tab-nav">
          <button
            className={tab === "translate" ? "active" : ""}
            onClick={() => setTab("translate")}
          >
            翻译
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            设置
          </button>
        </nav>
      </header>

      {tab === "translate" ? (
        <>
          <LanguageSelector
            sourceLanguage={settings.defaultSourceLang}
            targetLanguage={settings.defaultTargetLang}
            onSourceChange={(lang) => update({ defaultSourceLang: lang })}
            onTargetChange={(lang) => update({ defaultTargetLang: lang })}
            onSwap={handleSwap}
            disabled={state.status === "translating"}
          />

          <TranslationPanel
            status={state.status}
            translatedText={state.translatedText}
            error={state.error}
            onTranslate={translate}
            onCancel={cancel}
            onReset={resetTranslation}
          />
        </>
      ) : (
        <SettingsPanel settings={settings} onUpdate={update} onReset={reset} />
      )}
    </main>
  );
}

export default App;
