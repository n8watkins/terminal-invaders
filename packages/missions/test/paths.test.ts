import { describe, expect, it } from "vitest";
import {
  LEARNING_PATHS,
  MISSIONS,
  getPath,
  missionsForPath,
  nextInPath,
  pathForMission,
} from "../src/index.ts";

const VALID_ENVS = new Set(["bash", "zsh", "powershell", "nvim", "tool:git", "tool:fzf"]);

describe("learning paths", () => {
  it("covers every mission exactly once across all paths", () => {
    const ids = LEARNING_PATHS.flatMap((p) => p.missionIds);
    // No duplicates.
    expect(new Set(ids).size).toBe(ids.length);
    // Same set as the campaign — nothing missing, nothing invented.
    expect(new Set(ids)).toEqual(new Set(MISSIONS.map((m) => m.id)));
    expect(ids.length).toBe(MISSIONS.length);
  });

  it("resolves every mission id to a real mission, in order", () => {
    for (const path of LEARNING_PATHS) {
      const missions = missionsForPath(path.id);
      expect(missions.length).toBe(path.missionIds.length);
      expect(missions.map((m) => m.id)).toEqual(path.missionIds);
    }
  });

  it("has a valid environment on every path", () => {
    for (const path of LEARNING_PATHS) {
      expect(VALID_ENVS.has(path.environment), `${path.id}: ${path.environment}`).toBe(true);
    }
  });

  it("has unique path ids and non-empty metadata", () => {
    const pathIds = LEARNING_PATHS.map((p) => p.id);
    expect(new Set(pathIds).size).toBe(pathIds.length);
    for (const p of LEARNING_PATHS) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.blurb.length).toBeGreaterThan(0);
      expect(p.outcomes.length).toBeGreaterThan(0);
      expect(p.missionIds.length).toBeGreaterThan(0);
    }
  });

  it("prerequisites reference real paths and form a DAG (no cycles)", () => {
    const ids = new Set(LEARNING_PATHS.map((p) => p.id));
    for (const p of LEARNING_PATHS) {
      for (const pre of p.prerequisites ?? []) {
        expect(ids.has(pre), `${p.id} requires unknown path ${pre}`).toBe(true);
      }
    }
    // Cycle detection via DFS.
    const byId = new Map(LEARNING_PATHS.map((p) => [p.id, p]));
    const state = new Map<string, "visiting" | "done">();
    const hasCycle = (id: string): boolean => {
      const s = state.get(id);
      if (s === "visiting") return true;
      if (s === "done") return false;
      state.set(id, "visiting");
      for (const pre of byId.get(id)?.prerequisites ?? []) {
        if (hasCycle(pre)) return true;
      }
      state.set(id, "done");
      return false;
    };
    for (const p of LEARNING_PATHS) expect(hasCycle(p.id), `cycle at ${p.id}`).toBe(false);
  });

  it("pathForMission and nextInPath walk a path in order", () => {
    const path = LEARNING_PATHS[0]!;
    expect(pathForMission(path.missionIds[0]!)?.id).toBe(path.id);
    expect(nextInPath(path.missionIds[0]!)?.id).toBe(path.missionIds[1]);
    // Last mission of a path has no next.
    expect(nextInPath(path.missionIds[path.missionIds.length - 1]!)).toBeUndefined();
    expect(getPath(path.id)).toBe(path);
  });
});
