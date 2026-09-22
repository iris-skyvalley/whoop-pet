const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const client = require("../src/shared/whoop-client.cjs");
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const user = () => ({
  id: "test-user",
  access_token: "old",
  refresh_token: "refresh",
  token_expires_at: Date.now() + 3600000,
});
const response = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});
const records = {
  "/cycle?limit=1": {
    records: [{ id: 12, score_state: "SCORED", score: { strain: 8.4 } }],
  },
  "/cycle/12/recovery": {
    cycle_id: 12,
    score_state: "SCORED",
    score: { recovery_score: 81, hrv_rmssd_milli: 72, resting_heart_rate: 54 },
  },
  "/cycle/12/sleep": {
    cycle_id: 12,
    nap: false,
    score_state: "SCORED",
    score: { sleep_performance_percentage: 92 },
  },
};
function dataFetch(url) {
  assert.ok(url.startsWith("https://api.prod.whoop.com/developer/v2/"));
  const body =
    records[url.replace("https://api.prod.whoop.com/developer/v2", "")];
  assert.ok(body, `Unexpected endpoint ${url}`);
  return response(200, body);
}
test("real metrics all come from the same v2 cycle", async () => {
  global.fetch = async (url) => dataFetch(url);
  assert.deepEqual(
    await client.fetchWhoopMetrics(user(), () =>
      assert.fail("unexpected refresh"),
    ),
    { recovery: 81, sleep_score: 92, strain: 8.4, hrv: 72, rhr: 54 },
  );
});
test("day-two expired token rotates and persists credentials before loading scores", async () => {
  let saved,
    refreshCount = 0;
  global.fetch = async (url, options) => {
    if (url.endsWith("/token")) {
      refreshCount++;
      assert.equal(options.body.get("scope"), "offline");
      return response(200, {
        access_token: "new",
        refresh_token: "rotated",
        expires_in: 3600,
      });
    }
    assert.equal(saved.refresh_token, "rotated");
    assert.equal(options.headers.Authorization, "Bearer new");
    return dataFetch(url);
  };
  await client.fetchWhoopMetrics({ ...user(), token_expires_at: 0 }, (t) => {
    saved = t;
  });
  assert.equal(refreshCount, 1);
});
test("missing refresh token requires reconnect and does not fabricate scores", async () => {
  global.fetch = () => assert.fail("must not call API with an expired token");
  await assert.rejects(
    client.fetchWhoopMetrics(
      { ...user(), token_expires_at: 0, refresh_token: "" },
      () => {},
    ),
    { code: "WHOOP_RECONNECT", status: 401 },
  );
});
test("rejected refresh requires reconnect", async () => {
  global.fetch = async () => response(400);
  await assert.rejects(
    client.fetchWhoopMetrics({ ...user(), token_expires_at: 0 }, () =>
      assert.fail(),
    ),
    { code: "WHOOP_RECONNECT" },
  );
});
test("temporary refresh failure is retryable, not a reconnect", async () => {
  global.fetch = async () => response(503);
  await assert.rejects(
    client.fetchWhoopMetrics({ ...user(), token_expires_at: 0 }, () =>
      assert.fail(),
    ),
    { code: "WHOOP_UNAVAILABLE" },
  );
});
test("a 401 before recorded expiry triggers one token refresh and retry", async () => {
  let refreshed = 0;
  global.fetch = async (url, options) => {
    if (url.endsWith("/token")) {
      refreshed++;
      return response(200, { access_token: "new", expires_in: 3600 });
    }
    if (options.headers.Authorization === "Bearer old") return response(401);
    return dataFetch(url);
  };
  await client.fetchWhoopMetrics(user(), (t) =>
    assert.equal(t.refresh_token, "refresh"),
  );
  assert.equal(refreshed, 1);
});
test("pending scores do not become defaults", async () => {
  global.fetch = async () =>
    response(200, { records: [{ id: 12, score_state: "PENDING_SCORE" }] });
  await assert.rejects(
    client.fetchWhoopMetrics(user(), () => {}),
    { code: "WHOOP_PENDING" },
  );
});
test("missing sleep performance never becomes 50 percent", async () => {
  global.fetch = async (url) =>
    url.endsWith("/sleep")
      ? response(200, {
          cycle_id: 12,
          nap: false,
          score_state: "SCORED",
          score: {},
        })
      : dataFetch(url);
  await assert.rejects(
    client.fetchWhoopMetrics(user(), () => {}),
    { code: "WHOOP_PENDING" },
  );
});
test("genuine zero scores are retained", async () => {
  global.fetch = async (url) => {
    const result = dataFetch(url);
    const body = structuredClone(await result.json());
    if (body.records) body.records[0].score.strain = 0;
    if (body.score?.recovery_score != null) body.score.recovery_score = 0;
    if (body.score?.sleep_performance_percentage != null)
      body.score.sleep_performance_percentage = 0;
    return response(200, body);
  };
  const metrics = await client.fetchWhoopMetrics(user(), () => {});
  assert.equal(metrics.strain, 0);
  assert.equal(metrics.recovery, 0);
  assert.equal(metrics.sleep_score, 0);
});
test("legacy fallback cache is recognized, genuine midrange scores are not", () => {
  assert.equal(
    client.isLegacyFallback({
      recovery: 50,
      sleep_score: 50,
      strain: 10,
      hrv: 0,
      rhr: 0,
    }),
    true,
  );
  assert.equal(
    client.isLegacyFallback({
      recovery: 50,
      sleep_score: 50,
      strain: 10,
      hrv: 40,
      rhr: 60,
    }),
    false,
  );
});
test("production bypasses fake cached metrics and makes no health/metrics writes when reconnect is needed", async () => {
  const statements = [];
  const sql = async (strings) => {
    const query = strings.join("?");
    statements.push(query);
    if (query.includes("FROM users"))
      return [{ ...user(), token_expires_at: 0, refresh_token: "" }];
    if (query.includes("FROM daily_metrics"))
      return [
        {
          recovery: 50,
          sleep_score: 50,
          strain: 10,
          hrv: 0,
          rhr: 0,
          fetched_at: new Date().toISOString(),
        },
      ];
    assert.fail(`Unexpected query: ${query}`);
  };
  const context = {
    module: { exports: {} },
    require: (name) =>
      name === "@neondatabase/serverless" ? { neon: () => sql } : client,
    console,
    process,
    Date,
    URLSearchParams,
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../api/index.js"), "utf8"),
    context,
  );
  let status, body;
  const res = {
    setHeader() {},
    status(s) {
      status = s;
      return this;
    },
    json(b) {
      body = b;
      return this;
    },
  };
  await context.module.exports(
    {
      url: "/api/creature",
      method: "GET",
      headers: { cookie: "bodypet_user=test-user" },
    },
    res,
  );
  assert.equal(status, 401);
  assert.equal(body.error, "WHOOP_RECONNECT");
  assert.ok(statements.every((q) => !/INSERT|UPDATE/.test(q)));
});
