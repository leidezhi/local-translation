import React from "react";

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "auto", label: "自动检测" },
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "ru", label: "Русский" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
];

interface Props {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  onSwap: () => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<Props> = ({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  onSwap,
  disabled,
}) => {
  return (
    <div className="lang-selector">
      <select
        value={sourceLanguage}
        onChange={(e) => onSourceChange(e.target.value)}
        disabled={disabled}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={onSwap}
        disabled={disabled || sourceLanguage === "auto"}
        title="交换语言"
      >
        ⇄
      </button>

      <select
        value={targetLanguage}
        onChange={(e) => onTargetChange(e.target.value)}
        disabled={disabled}
      >
        {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};
