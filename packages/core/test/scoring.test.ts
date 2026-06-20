import { describe, expect, it, vi } from "vitest";
import { GameEngine } from "../src/index.ts";
import { objectivePoints, timeBonus, POINTS } from "../src/scoring/scoring.ts";
import type { Mission } from "../src/missions/types.ts";

// Minimal mission builder for engine-level scoring tests (not registered).
function mk(over: Partial<Mission> & Pick<Mission, "objectives">): Mission {
  return {
    id: "t",
    title: "t",
    difficulty: 1,
    track: "navigation",
    briefing: "",
    startingCwd: "/p",
    filesystem: { "/p": { type: "dir" } },
    hints: [{ text: "h" }],
    successMessage: "ok",
    ...over,
  };
}

describe("scoring — pure functions", () => {
  it("objectivePoints scales with combo (100, 125, 150, …)", () => {
    expect(objectivePoints(1)).toBe(100);
    expect(objectivePoints(2)).toBe(125);
    expect(objectivePoints(3)).toBe(150);
    expect(objectivePoints(0)).toBe(100); // floor: max(0, combo-1)
  });

  it("timeBonus: full under par, diminishing, zero past 3x par", () => {
    expect(timeBonus(0, 90)).toBe(POINTS.timeBonusCap);
    expect(timeBonus(90_000, 90)).toBe(POINTS.timeBonusCap);
    expect(timeBonus(180_000, 90)).toBe(100); // halfway between par and 3x par
    expect(timeBonus(270_000, 90)).toBe(0);
    expect(timeBonus(600_000, 90)).toBe(0); // never negative
  });
});

describe("scoring — engine integration", () => {
  it("awards the search bonus once per distinct query (not farmable)", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" }, "/p/a.ts": { type: "file", content: "const needle = 1;" } },
      track: "search",
      objectives: [{ id: "s", label: "find", type: "search_performed", query: "needle" }],
    });
    const e = new GameEngine(m);
    e.execute("rg needle"); // objective (combo 1 → +100) + first search bonus (+20)
    expect(e.state.score).toBe(120);
    const before = e.state.score;
    e.execute("rg needle"); // same query again — no re-award
    expect(e.state.score - before).toBe(0);
  });

  it("does not satisfy or reward a search that found nothing (isolates the matches>0 guards)", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" }, "/p/a.ts": { type: "file", content: "const needle = 1;" } },
      track: "search",
      objectives: [{ id: "s", label: "find", type: "search_performed", query: "needle" }],
    });
    const e = new GameEngine(m);
    // "needlexyz" CONTAINS the objective query "needle" (so the validator's query
    // check passes) but matches nothing in the fs, isolating the matches>0 guards.
    e.execute("rg needlexyz");
    expect(e.state.score).toBe(0);
    expect(e.objectiveChecklist().find((o) => o.id === "s")!.complete).toBe(false);
  });

  it("awards the search bonus on the first MATCHING search even after an empty one", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" }, "/p/a.ts": { type: "file", content: "const x = 1;" } },
      track: "search",
      objectives: [{ id: "s", label: "find", type: "search_performed", query: "needle" }],
    });
    const e = new GameEngine(m);
    e.execute("rg needle"); // nothing matches yet: no objective, no bonus
    expect(e.state.score).toBe(0);
    e.execute("nvim a.ts"); // add the text, then search again
    e.execute("i");
    e.execute("needle added");
    e.execute("esc");
    e.execute(":wq");
    e.execute("rg needle"); // first MATCHING search: objective (+100) + bonus (+20)
    expect(e.state.score).toBe(120);
  });

  it("a mistake resets the combo (wherever it is recorded)", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" } },
      objectives: [
        { id: "a", label: "pwd", type: "command_used", command: "pwd" },
        { id: "b", label: "ls", type: "command_used", command: "ls" },
        { id: "c", label: "tree", type: "command_used", command: "tree" },
      ],
    });
    const e = new GameEngine(m);
    e.execute("pwd");
    expect([e.state.combo, e.state.score]).toEqual([1, 100]);
    e.execute("ls");
    expect([e.state.combo, e.state.score]).toEqual([2, 225]);
    e.execute("definitelynotacommand"); // unknown_command mistake: -25 and combo → 0
    expect([e.state.combo, e.state.score]).toEqual([0, 200]);
    e.execute("tree"); // combo restarts at 1 → +100, not +150
    expect([e.state.combo, e.state.score]).toEqual([1, 300]);
  });

  it("penalizes repeated premature checks, but not the first", () => {
    const m = mk({
      objectives: [
        { id: "easy", label: "pwd", type: "command_used", command: "pwd" },
        { id: "need", label: "ls", type: "command_used", command: "ls" }, // left undone
      ],
    });
    const e = new GameEngine(m);
    e.execute("pwd"); // +100
    e.execute("check"); // incomplete, first check — free
    expect(e.state.score).toBe(100);
    expect(e.state.mistakes.filter((x) => x.kind === "premature_check")).toHaveLength(0);
    e.execute("check"); // incomplete, repeated — penalized
    expect(e.state.score).toBe(75);
    expect(e.state.mistakes.filter((x) => x.kind === "premature_check")).toHaveLength(1);
  });

  it("a failed command does not count toward command_used", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" }, "/p/sub": { type: "dir" } },
      objectives: [{ id: "cd", label: "cd", type: "command_used", command: "cd" }],
    });
    const e = new GameEngine(m);
    e.execute("cd nope"); // bad path — should not count
    expect(e.state.commandsUsed).not.toContain("cd");
    e.execute("cd sub"); // success — counts
    expect(e.state.commandsUsed).toContain("cd");
  });

  it("a failed nvim open does not count toward command_used 'nvim'", () => {
    const m = mk({
      filesystem: { "/p": { type: "dir" }, "/p/real.ts": { type: "file", content: "x" } },
      track: "lazyvim",
      objectives: [{ id: "open", label: "nvim", type: "command_used", command: "nvim" }],
    });
    const e = new GameEngine(m);
    e.execute("nvim missing.ts"); // bad path — editor never opens
    expect(e.state.commandsUsed).not.toContain("nvim");
    expect(e.editorOpen).toBe(false);
    e.execute("nvim real.ts"); // opens
    expect(e.state.commandsUsed).toContain("nvim");
  });

  it("the time bonus clock starts at first input, not construction", () => {
    vi.useFakeTimers();
    try {
      const m = mk({ objectives: [{ id: "a", label: "pwd", type: "command_used", command: "pwd" }] });
      const e = new GameEngine(m);
      const constructedAt = e.state.startedAt;

      vi.advanceTimersByTime(5000);
      e.execute("   "); // blank input must NOT start the clock (early return)
      expect(e.state.startedAt).toBe(constructedAt);

      e.execute("pwd"); // first real command resets the clock to "now"
      expect(e.state.startedAt).toBe(constructedAt + 5000);

      const afterFirst = e.state.startedAt;
      vi.advanceTimersByTime(3000);
      e.execute("pwd"); // a later command must NOT re-reset it
      expect(e.state.startedAt).toBe(afterFirst);
    } finally {
      vi.useRealTimers();
    }
  });
});
