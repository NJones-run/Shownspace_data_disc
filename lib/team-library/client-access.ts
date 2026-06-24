export const SCORER_TOKENS_STORAGE_KEY = "frisbee-live-capture:scorer-tokens";

export function readScorerTokens() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SCORER_TOKENS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((token): token is string => typeof token === "string" && token.length > 0) : [];
  } catch {
    return [];
  }
}

export function saveScorerToken(token: string) {
  if (typeof window === "undefined") return;
  const tokens = Array.from(new Set([...readScorerTokens(), token]));
  window.localStorage.setItem(SCORER_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export function scorerTokenHeader() {
  const tokens = readScorerTokens();
  return tokens.length ? tokens.join(",") : "";
}
