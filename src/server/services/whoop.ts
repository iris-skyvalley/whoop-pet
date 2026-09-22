import { fetchWhoopMetrics } from "../../shared/whoop-client.cjs";
import type { WhoopTokenResponse } from "../../shared/types.js";
import { updateUserTokens, getUserById } from "../db/store.js";

const WHOOP_AUTH = "https://api.prod.whoop.com/oauth/oauth2";

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    response_type: "code",
    scope:
      "offline read:recovery read:sleep read:workout read:profile read:cycles",
    state: Math.random().toString(36).substring(7),
  });
  return `${WHOOP_AUTH}/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<WhoopTokenResponse> {
  const res = await fetch(`${WHOOP_AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function fetchAllMetrics(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");
  return fetchWhoopMetrics(user, (tokens) => {
    updateUserTokens(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + tokens.expires_in * 1000,
    );
  });
}
