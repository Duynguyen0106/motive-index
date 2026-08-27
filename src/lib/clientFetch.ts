/** Safe JSON parse for browser fetch — avoids "Unexpected end of JSON input". */
export async function readJsonResponse<T = Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Server returned an empty response. The request may have timed out — try again with a smaller batch."
        : `Request failed (HTTP ${res.status}) with an empty response. Check you're logged in and the deploy logs.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(`Invalid server response (HTTP ${res.status}): ${preview}`);
  }
}

export const adminFetchInit: RequestInit = {
  credentials: "same-origin",
  headers: { "content-type": "application/json" },
};
