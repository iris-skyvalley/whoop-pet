import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureDemoUser, getMetricsByDate } from "../src/server/db/store.js";
import { updateCreature } from "../src/server/services/creature.js";

test("expired cache does not age the pet or compound health changes within one day", async () => {
  const user = ensureDemoUser();
  const dayOne = "2026-09-21";
  const dayTwo = "2026-09-22";
  const first = await updateCreature(user.id, dayOne);
  getMetricsByDate(user.id, dayOne)!.fetched_at = "2000-01-01T00:00:00Z";
  const repeated = await updateCreature(user.id, dayOne);
  assert.equal(repeated.creature.streak_days, 1);
  assert.equal(repeated.creature.health_points, first.creature.health_points);
  const next = await updateCreature(user.id, dayTwo);
  assert.equal(next.creature.streak_days, 2);
  getMetricsByDate(user.id, dayTwo)!.fetched_at = "2000-01-01T00:00:00Z";
  const nextRepeated = await updateCreature(user.id, dayTwo);
  assert.equal(nextRepeated.creature.streak_days, 2);
  assert.equal(
    nextRepeated.creature.health_points,
    next.creature.health_points,
  );
});
