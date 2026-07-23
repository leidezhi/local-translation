import React, { useState } from "react";
import type { TaskStatus, ClassifiedError } from "../core/types";

interface Props {
  status: TaskStatus;
  translatedText: string;
  error: ClassifiedError | null;
  onTranslate: (text: string, thinking?: boolean) => void;
  onCancel: () => void;
  onReset: () => void;
}

export const TranslationPanel: React.FC<Props> = ({
  status,
  translatedText,
  error,
  onTranslate,
  onCancel,
  onReset,
}) => {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const isTranslating = status === "translating";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";

  const handleSubmit = () => {
    if (input.trim()) {
      onTranslate(input.trim(), thinking);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="translation-panel">
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入要翻译的文本... (Ctrl+Enter 翻译)"
          rows={6}
          disabled={isTranslating}
        />
        <div className="input-actions">
          <label className="think-checkbox">
            <input
              type="checkbox"
              checked={thinking}
              onChange={(e) => setThinking(e.target.checked)}
              disabled={isTranslating}
            />
            思考
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isTranslating || !input.trim()}
          >
            {isTranslating ? "翻译中..." : "翻译"}
          </button>
          {isTranslating && (
            <button type="button" onClick={onCancel} className="cancel-btn">
              取消
            </button>
          )}
          {(isCompleted || isFailed || isCancelled) && (
            <button type="button" onClick={onReset} className="reset-btn">
              重新翻译
            </button>
          )}
        </div>
      </div>

      <div className="output-area">
        {isTranslating && (
          <div className="streaming-indicator">
            <span className="pulse" />
            正在翻译...
          </div>
        )}

        {isFailed && error && (
          <div className="error-box">
            <p className="error-msg">{error.message}</p>
            <p className="error-suggestion">{error.suggestion}</p>
          </div>
        )}

        {isCancelled && (
          <div className="cancelled-box">翻译已取消</div>
        )}

        {(isCompleted || isTranslating) && translatedText && (
          <div className="result-box">
            <div className="result-text">{translatedText}</div>
            {isCompleted && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(translatedText)}
                className="copy-btn"
              >
                复制译文
              </button>
            )}
          </div>
        )}

        {status === "idle" && (
          <div className="placeholder">译文将显示在这里</div>
        )}
      </div>
    </div>
  );
};
