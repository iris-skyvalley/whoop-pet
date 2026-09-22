import type { User, WhoopTokenResponse } from "./types.js";
export class WhoopError extends Error {
  code: string;
  status: number;
}
export function fetchWhoopMetrics(
  user: Pick<User, "access_token" | "refresh_token" | "token_expires_at">,
  saveTokens: (tokens: WhoopTokenResponse) => void | Promise<void>,
): Promise<{
  recovery: number;
  sleep_score: number;
  strain: number;
  hrv: number;
  rhr: number;
}>;
export function isLegacyFallback(metrics: unknown): boolean;
