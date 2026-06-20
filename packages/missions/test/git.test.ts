import { describe, expect, it } from "vitest";
import { GameEngine } from "@terminal-invaders/core";
import { stageTheChange } from "../src/git/stageTheChange.ts";
import { commitIt } from "../src/git/commitIt.ts";
import { inspectTheHistory } from "../src/git/inspectTheHistory.ts";
import { discardWorkingChanges } from "../src/git/discardWorkingChanges.ts";
import { inspectBeforeYouCommit } from "../src/git/inspectBeforeYouCommit.ts";
import { restoreJustOne } from "../src/git/restoreJustOne.ts";
import { cleanSlate } from "../src/git/cleanSlate.ts";

function play(e: GameEngine, inputs: string[]) {
  for (const i of inputs) e.execute(i);
}

describe("git track (new missions)", () => {
  it("solves git-002 — status + add stages the file", () => {
    const e = new GameEngine(stageTheChange);
    play(e, ["git status", "git add site.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.gitStagedPaths).toContain("/project/site.ts");
  });

  it("solves git-003 — add + commit records history", () => {
    const e = new GameEngine(commitIt);
    play(e, ["git add sum.ts", 'git commit -m "Implement total()"', "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.gitCommits).toBeGreaterThan(0);
  });

  it("solves git-004 — log + status", () => {
    const e = new GameEngine(inspectTheHistory);
    play(e, ["git log", "git status", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves git-006 — restore discards working changes", () => {
    const e = new GameEngine(discardWorkingChanges);
    expect(e.fs.readFile("/project/server.ts")).toContain("PORT = 9999");
    play(e, ["git status", "git restore server.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.fs.readFile("/project/server.ts")).toContain("PORT = 3000");
    expect(e.fs.readFile("/project/server.ts")).not.toContain("PORT = 9999");
  });

  it("solves git-007 — status, diff, add, commit", () => {
    const e = new GameEngine(inspectBeforeYouCommit);
    play(e, [
      "git status",
      "git diff",
      "git add discount.ts",
      'git commit -m "Apply 10% discount"',
      "check",
    ]);
    expect(e.state.complete).toBe(true);
    expect(e.state.gitCommits).toBeGreaterThan(0);
  });

  it("solves git-008 — restore only the target, keep the other dirty", () => {
    const e = new GameEngine(restoreJustOne);
    play(e, ["git status", "git restore colors.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.fs.readFile("/project/colors.ts")).toContain("#0066ff");
    expect(e.fs.readFile("/project/colors.ts")).not.toContain("#ff00ff");
    // The other file keeps its working edit.
    expect(e.fs.readFile("/project/copy.ts")).toContain("Welcome back");
    expect(e.state.gitModifiedPaths).toContain("/project/copy.ts");
  });

  it("solves git-010 (boss) — restore the bad file, commit the good one", () => {
    const e = new GameEngine(cleanSlate);
    play(e, [
      "git diff",
      "git restore auth.ts",
      "git add README.md",
      'git commit -m "Improve README"',
      "check",
    ]);
    expect(e.state.complete).toBe(true);
    expect(e.fs.readFile("/project/auth.ts")).toContain("checkPassword(user)");
    expect(e.fs.readFile("/project/auth.ts")).not.toContain("TODO bypass");
    expect(e.fs.readFile("/project/README.md")).toContain("fast, reliable");
    expect(e.state.gitCommits).toBeGreaterThan(0);
  });
});
