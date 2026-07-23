# 本地翻译 (Local Translation)

隐私优先、本地运行的 Windows 桌面翻译工具。

## 已开发功能

### 文本翻译

- 手动输入或粘贴文本，调用本地大模型翻译
- 支持 13 种语言（自动检测、中、英、日、韩、法、德、西、俄、葡、阿、泰、越）
- 流式显示翻译结果（逐字输出）
- **Ctrl+Enter** 快捷键发送翻译
- 翻译完成后一键复制译文
- 取消正在进行的翻译

### 翻译提供器

| 提供器 | 说明 |
|--------|------|
| Ollama | 通过 Ollama 本地 API (`/api/chat`) 流式调用模型 |
| OpenAI 兼容 | 通过标准 `/chat/completions` SSE 接口调用本地服务 |

两种提供器均支持：
- 服务健康检查
- 获取可用模型列表
- 流式输出和取消
- 术语表注入
- 提示注入防护

### 设置

- 选择翻译提供器（Ollama / OpenAI 兼容）
- 配置服务地址、模型名称
- 超时设置
- 默认源语言和目标语言
- 翻译风格（忠实 / 自然 / 学术 / 口语）
- OCR 语言配置
- 历史记录开关
- 设置通过 localStorage 持久化，关闭应用后保留

### 翻译提示词

- 自动生成系统提示词（含语言对、风格）
- 术语表注入
- 防提示注入：原文被包裹为数据块，不会被模型当作指令执行
- 长文本按段落分块翻译

### 架构

```
UI (React) → Application (useTranslation hook) → Providers (Ollama / OpenAI)
```

核心模块：
- `src/core/types.ts` — 类型定义（OcrBlock, TranslationRequest, LlmProvider 等）
- `src/core/prompt-builder.ts` — 翻译提示词构建器
- `src/core/ocr-merger.ts` — OCR 文字块阅读顺序合并
- `src/core/text-chunker.ts` — 长文本段落分块
- `src/core/errors.ts` — 错误分类与中文建议
- `src/providers/ollama.ts` — Ollama 适配器
- `src/providers/openai-compat.ts` — OpenAI 兼容适配器
- `src/hooks/useTranslation.ts` — 翻译状态管理
- `src/hooks/useSettings.ts` — 设置持久化
- `src/components/` — React UI 组件

## 环境要求

- **Windows 10/11**
- **Node.js** 20+
- **Rust** 1.77+
- **MinGW-w64 GCC** (GNU 工具链)
- **WebView2** (Windows 11 已内置)

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发模式
npx tauri dev

# 3. 运行测试
npm test
```

## 配置翻译服务

### 方式一：Ollama (推荐)

1. 安装 [Ollama](https://ollama.com)
2. 拉取模型：`ollama pull qwen3-4b-fixed`
3. 启动 Ollama（默认 `http://localhost:11434`）
4. 在应用设置中确认模型名称

### 方式二：OpenAI 兼容接口

1. 启动任意 OpenAI-compatible 本地服务（如 vllm、llama.cpp server 等）
2. 在设置中填入 API 地址和模型名称

## 测试

```bash
npm test          # 运行全部测试（当前 45 个）
npm run test:watch  # 监听模式
```

测试覆盖：
- Prompt Builder（语言、模式、术语表、防注入）
- OCR 文字块排序（阅读顺序、同行合并）
- 文本分块（段落边界、强制分块、重组）
- 错误分类（14 种错误类型、网络错误检测）
- Ollama 适配器（流式输出、消息格式、健康检查）
- OpenAI 兼容适配器（SSE 解析、认证头、术语表、取消）

## 项目结构

```
src/
├── core/              # 纯逻辑层（不依赖 UI/Rust）
│   ├── types.ts
│   ├── prompt-builder.ts
│   ├── ocr-merger.ts
│   ├── text-chunker.ts
│   └── errors.ts
├── providers/         # LLM/OCR 提供器实现
│   ├── ollama.ts
│   └── openai-compat.ts
├── hooks/             # React Hooks
│   ├── useTranslation.ts
│   └── useSettings.ts
├── components/        # UI 组件
│   ├── LanguageSelector.tsx
│   ├── TranslationPanel.tsx
│   └── SettingsPanel.tsx
├── App.tsx
├── App.css
└── __tests__/         # 单元测试
src-tauri/             # Rust/Tauri 后端
└── docs/
    ├── adr/           # 架构决策记录
    └── agents/        # Agent skills 配置
```

## 待开发 (阶段 2-4)

- [ ] 全局快捷键截图 + 区域框选
- [ ] OCR 文字识别
- [ ] 截图翻译工作流 (截图 → OCR → 翻译)
- [ ] 剪贴板文本翻译
- [ ] 系统托盘
- [ ] 历史记录页面
- [ ] 术语表管理
- [ ] 首次使用引导
- [ ] Windows 安装包
