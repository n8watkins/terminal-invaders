import { describe, expect, it } from "vitest";
import { MISSIONS, getMission } from "../src/index.ts";

// The campaign array in index.ts is hand-maintained across three lists (imports,
// MISSIONS, re-exports). These invariants catch a drift the per-mission
// solvability tests can't: a missing/duplicate registration, a wrong track, or
// an ordering that breaks the difficulty ramp.
describe("campaign integrity", () => {
  it("has 50 missions, 10 per track, all ids unique", () => {
    expect(MISSIONS).toHaveLength(50);

    const ids = MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    const byTrack: Record<string, number> = {};
    for (const m of MISSIONS) byTrack[m.track] = (byTrack[m.track] ?? 0) + 1;
    expect(byTrack).toEqual({
      navigation: 10,
      search: 10,
      lazyvim: 10,
      git: 10,
      workflow: 10,
    });
  });

  it("is ordered by non-decreasing difficulty (the campaign ramp)", () => {
    const diffs = MISSIONS.map((m) => m.difficulty);
    for (let i = 1; i < diffs.length; i++) {
      expect(diffs[i]).toBeGreaterThanOrEqual(diffs[i - 1]);
    }
  });

  it("every mission is well-formed and getMission round-trips", () => {
    for (const m of MISSIONS) {
      // Must be finishable: a `check` objective exists.
      expect(m.objectives.some((o) => o.type === "command_used" && o.command === "check")).toBe(true);
      expect(m.objectives.length).toBeGreaterThanOrEqual(2);
      expect(m.hints.length).toBeGreaterThanOrEqual(1);

      // Objective ids unique within a mission — latching keys on the id.
      const oids = m.objectives.map((o) => o.id);
      expect(new Set(oids).size).toBe(oids.length);

      // startingCwd must be a real node, and lookup must resolve to this object.
      expect(m.filesystem[m.startingCwd]).toBeDefined();
      expect(getMission(m.id)).toBe(m);
    }
  });
});
