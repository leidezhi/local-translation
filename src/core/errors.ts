import type { ClassifiedError, ErrorCategory } from "./types";

const ERROR_SUGGESTIONS: Record<ErrorCategory, string> = {
  service_unavailable: "请确认本地模型服务已启动",
  connection_refused: "请检查服务地址和端口是否正确",
  timeout: "翻译请求超时，请检查模型服务是否正常运行或尝试更短的文本",
  model_not_found: "该模型未找到，请在设置中检查模型名称或先拉取模型",
  invalid_response: "模型返回了无法解析的响应，请检查服务兼容性",
  user_cancelled: "已取消",
  ocr_missing_language: "OCR 语言资源缺失，请安装对应的语言包",
  ocr_no_text: "未在图片中识别到文字，请确认截图包含清晰文字",
  ocr_engine_error: "OCR 引擎发生错误",
  screenshot_failed: "截图失败，请检查屏幕捕获权限",
  hotkey_conflict: "快捷键与其他程序冲突，请更换快捷键",
  database_error: "数据库操作失败，请检查磁盘空间和权限",
  input_too_long: "输入文本过长，请缩短后重试",
  unknown: "发生未知错误",
};

export function classifyError(error: unknown, category: ErrorCategory): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  return {
    category,
    message,
    suggestion: ERROR_SUGGESTIONS[category],
    cause: error,
  };
}

export function classifyNetworkError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  const msg = message.toLowerCase();

  if (msg.includes("connection refused") || msg.includes("econnrefused")) {
    return classifyError(error, "connection_refused");
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return classifyError(error, "timeout");
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return classifyError(error, "model_not_found");
  }
  return classifyError(error, "service_unavailable");
}
