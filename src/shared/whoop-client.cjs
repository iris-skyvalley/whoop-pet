const BASE = "https://api.prod.whoop.com/developer/v2";
class WhoopError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const reconnect = () =>
  new WhoopError(
    "WHOOP_RECONNECT",
    "Your WHOOP connection has expired. Reconnect to load your real scores.",
    401,
  );
const unavailable = () =>
  new WhoopError(
    "WHOOP_UNAVAILABLE",
    "WHOOP couldn’t be reached. Please try again shortly.",
    502,
  );
const pending = () =>
  new WhoopError(
    "WHOOP_PENDING",
    "WHOOP hasn’t finished scoring your latest cycle. Please try again after your WHOOP app has synced.",
    409,
  );

async function fetchWhoopMetrics(user, saveTokens) {
  let token = user.access_token;
  let refreshPromise;
  const refresh = () => {
    if (!refreshPromise)
      refreshPromise = (async () => {
        if (!user.refresh_token) throw reconnect();
        let response;
        try {
          response = await fetch(
            "https://api.prod.whoop.com/oauth/oauth2/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: user.refresh_token,
                client_id: process.env.WHOOP_CLIENT_ID || "",
                client_secret: process.env.WHOOP_CLIENT_SECRET || "",
                scope: "offline",
              }),
            },
          );
        } catch {
          throw unavailable();
        }
        if (!response.ok) {
          if ([400, 401, 403].includes(response.status)) throw reconnect();
          throw unavailable();
        }
        const tokens = await response.json();
        if (!tokens.access_token || !Number.isFinite(tokens.expires_in))
          throw unavailable();
        tokens.refresh_token = tokens.refresh_token || user.refresh_token;
        await saveTokens(tokens);
        token = tokens.access_token;
      })();
    return refreshPromise;
  };
  if (Date.now() >= Number(user.token_expires_at) - 60000) await refresh();
  async function get(path, retry = true) {
    let response;
    try {
      response = await fetch(BASE + path, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw unavailable();
    }
    if (response.status === 401 && retry) {
      await refresh();
      return get(path, false);
    }
    if ([401, 403].includes(response.status)) throw reconnect();
    if (response.status === 404) throw pending();
    if (!response.ok) throw unavailable();
    return response.json();
  }
  const cycles = await get("/cycle?limit=1");
  const cycle = cycles.records?.[0];
  if (!cycle || cycle.score_state !== "SCORED" || !cycle.score) throw pending();
  // Bind all three measurements to one physiological cycle; never pick a nap
  // or an unrelated sleep record just because it was uploaded more recently.
  const [recovery, sleep] = await Promise.all([
    get(`/cycle/${cycle.id}/recovery`),
    get(`/cycle/${cycle.id}/sleep`),
  ]);
  if (
    recovery.score_state !== "SCORED" ||
    sleep.score_state !== "SCORED" ||
    recovery.cycle_id !== cycle.id ||
    sleep.cycle_id !== cycle.id ||
    sleep.nap
  )
    throw pending();
  const metrics = {
    recovery: recovery.score?.recovery_score,
    sleep_score: sleep.score?.sleep_performance_percentage,
    strain: cycle.score.strain,
    hrv: recovery.score?.hrv_rmssd_milli,
    rhr: recovery.score?.resting_heart_rate,
  };
  if (Object.values(metrics).some((value) => !Number.isFinite(value)))
    throw pending();
  return metrics;
}

// Earlier versions persisted these placeholders after failed WHOOP requests.
// Bypass them so existing accounts recover immediately after this fix.
function isLegacyFallback(metrics) {
  return (
    !!metrics &&
    Number(metrics.recovery) === 50 &&
    Number(metrics.sleep_score) === 50 &&
    Number(metrics.strain) === 10 &&
    Number(metrics.hrv) === 0 &&
    Number(metrics.rhr) === 0
  );
}
module.exports = { fetchWhoopMetrics, WhoopError, isLegacyFallback };
