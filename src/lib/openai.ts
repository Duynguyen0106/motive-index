/**
 * OpenAI-compatible chat completions (OpenAI or OpenRouter via OPENAI_BASE_URL).
 */
export function getChatCompletionsUrl(): string {
  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  return `${base}/chat/completions`;
}

export function getChatModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function chatCompletionHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  // OpenRouter recommends these; harmless for direct OpenAI.
  if ((process.env.OPENAI_BASE_URL ?? "").includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL ?? "https://motiveindex.local";
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME ?? "Motive Index";
  }
  return headers;
}
