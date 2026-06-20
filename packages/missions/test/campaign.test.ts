import { describe, expect, it } from "vitest";
import { MISSIONS, getMission } from "../src/index.ts";

/** Every ancestor directory path of an absolute path (excluding the path itself). */
function ancestorDirs(p: string): string[] {
  const parts = p.split("/").filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < parts.length - 1; i++) {
    cur += `/${parts[i]}`;
    out.push(cur);
  }
  return out;
}

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

  // Every filesystem node must have a complete chain of parent dir nodes, or the
  // file is reachable by cat/objectives but invisible to ls/cd/tree — a soft-lock
  // (children are derived from parentPath, so an orphan node lists nowhere).
  it("every filesystem node has its full chain of parent directory nodes", () => {
    for (const m of MISSIONS) {
      for (const p of Object.keys(m.filesystem)) {
        for (const anc of ancestorDirs(p)) {
          const node = m.filesystem[anc];
          expect(node, `${m.id}: ${p} is missing ancestor dir node ${anc}`).toBeDefined();
          expect(node?.type, `${m.id}: ancestor ${anc} of ${p} must be a dir`).toBe("dir");
        }
      }
    }
  });

  // Every path an objective references must resolve to a real node of the right
  // kind, so a mission can't ship an objective that points at nothing.
  it("every objective path resolves to an existing node of the right kind", () => {
    for (const m of MISSIONS) {
      for (const o of m.objectives) {
        const ref = `${m.id}/${o.id}`;
        if (o.type === "cwd_is") {
          expect(m.filesystem[o.path]?.type, `${ref}: cwd_is ${o.path}`).toBe("dir");
        } else if (o.type === "file_opened" || o.type === "file_contains" || o.type === "file_lacks") {
          expect(m.filesystem[o.path]?.type, `${ref}: ${o.type} ${o.path}`).toBe("file");
        } else if (o.type === "search_performed" && o.expectedPath) {
          expect(m.filesystem[o.expectedPath]?.type, `${ref}: expectedPath ${o.expectedPath}`).toBe("file");
        } else if (o.type === "git_staged" || o.type === "git_clean") {
          const known = m.filesystem[o.path] !== undefined || m.git?.head?.[o.path] !== undefined;
          expect(known, `${ref}: git path ${o.path} not in filesystem or git.head`).toBe(true);
        }
      }
    }
  });
});
