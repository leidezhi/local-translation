import React from "react";
import type { AppSettings, ProviderType } from "../hooks/useSettings";

interface Props {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<Props> = ({ settings, onUpdate, onReset }) => {
  return (
    <div className="settings-panel">
      <h2>设置</h2>

      <section>
        <h3>模型提供器</h3>
        <label>
          类型
          <select
            value={settings.providerType}
            onChange={(e) => onUpdate({ providerType: e.target.value as ProviderType })}
          >
            <option value="ollama">Ollama</option>
            <option value="openai-compat">OpenAI 兼容接口</option>
          </select>
        </label>

        {settings.providerType === "ollama" ? (
          <>
            <label>
              Ollama 地址
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => onUpdate({ ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </label>
            <label>
              模型名称
              <input
                type="text"
                value={settings.ollamaModel}
                onChange={(e) => onUpdate({ ollamaModel: e.target.value })}
                placeholder="qwen3-4b-fixed"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              API 地址
              <input
                type="text"
                value={settings.openAiUrl}
                onChange={(e) => onUpdate({ openAiUrl: e.target.value })}
                placeholder="http://localhost:8080/v1"
              />
            </label>
            <label>
              模型名称
              <input
                type="text"
                value={settings.openAiModel}
                onChange={(e) => onUpdate({ openAiModel: e.target.value })}
              />
            </label>
            <label>
              API Key (可选)
              <input
                type="password"
                value={settings.openAiKey}
                onChange={(e) => onUpdate({ openAiKey: e.target.value })}
              />
            </label>
          </>
        )}

        <label>
          超时 (毫秒)
          <input
            type="number"
            value={settings.timeoutMs}
            onChange={(e) => onUpdate({ timeoutMs: Number(e.target.value) })}
            min={5000}
            max={300000}
          />
        </label>
      </section>

      <section>
        <h3>默认语言</h3>
        <label>
          源语言
          <select
            value={settings.defaultSourceLang}
            onChange={(e) => onUpdate({ defaultSourceLang: e.target.value })}
          >
            <option value="auto">自动检测</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </label>
        <label>
          目标语言
          <select
            value={settings.defaultTargetLang}
            onChange={(e) => onUpdate({ defaultTargetLang: e.target.value })}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </label>
      </section>

      <section>
        <h3>翻译风格</h3>
        <select
          value={settings.translationMode}
          onChange={(e) => onUpdate({ translationMode: e.target.value })}
        >
          <option value="faithful">忠实</option>
          <option value="natural">自然</option>
          <option value="academic">学术</option>
          <option value="casual">口语</option>
        </select>
      </section>

      <section>
        <h3>OCR</h3>
        <label>
          识别语言
          <input
            type="text"
            value={settings.ocrLanguage}
            onChange={(e) => onUpdate({ ocrLanguage: e.target.value })}
            placeholder="chi_sim+eng"
          />
        </label>
      </section>

      <section>
        <h3>历史记录</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(e) => onUpdate({ saveHistory: e.target.checked })}
          />
          保存翻译历史
        </label>
      </section>

      <section className="settings-actions">
        <button onClick={onReset} className="reset-btn">恢复默认设置</button>
      </section>
    </div>
  );
};
