import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cleanSlate, replaceCopy, stageAndCommit, undoTheMistake } from "@terminal-invaders/missions";
import type { Mission } from "@terminal-invaders/core";
import * as os from "node:os";
import { assertSafe, createSandbox, sandboxEligible, validateSandbox } from "../src/sandbox.ts";

const hasGit = (() => {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const cleanup: string[] = [];
afterAll(() => {
  for (const dir of cleanup) fs.rmSync(dir, { recursive: true, force: true });
});

const allDone = (m: Parameters<typeof validateSandbox>[0], run: Parameters<typeof validateSandbox>[1]) =>
  validateSandbox(m, run).every((o) => o.complete);
const g = (dir: string, args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });

describe("real-sandbox mode", () => {
  it("only offers missions with disk-observable objectives", () => {
    expect(sandboxEligible(replaceCopy)).toBe(true);
    expect(sandboxEligible(undoTheMistake)).toBe(true);
  });

  it("materializes a mission to disk and detects a real file edit (lv-010)", () => {
    const run = createSandbox(replaceCopy);
    cleanup.push(run.runDir);
    const file = path.join(run.projectDir, "src/app/page.tsx");
    expect(fs.readFileSync(file, "utf8")).toContain("Start now");
    expect(allDone(replaceCopy, run)).toBe(false);

    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll("Start now", "Get started"));
    expect(allDone(replaceCopy, run)).toBe(true);
  });

  it.runIf(hasGit)("recovers a clobbered file via real `git restore` (git-009)", () => {
    const run = createSandbox(undoTheMistake);
    cleanup.push(run.runDir);
    expect(fs.readFileSync(path.join(run.projectDir, "env.ts"), "utf8")).toContain("oops");
    expect(allDone(undoTheMistake, run)).toBe(false);

    g(run.projectDir, ["restore", "env.ts"]);
    expect(allDone(undoTheMistake, run)).toBe(true);
  });

  it.runIf(hasGit)("latches stage→commit across polls (git-005)", () => {
    const run = createSandbox(stageAndCommit);
    cleanup.push(run.runDir);
    expect(allDone(stageAndCommit, run)).toBe(false);

    g(run.projectDir, ["add", "greet.ts"]);
    g(run.projectDir, ["commit", "-m", "improve"]);
    expect(allDone(stageAndCommit, run)).toBe(true); // staged-or-committed keeps git_staged true
  });

  it.runIf(hasGit)("git-010 is winnable in sandbox: restore the bad file, commit the good one", () => {
    const run = createSandbox(cleanSlate);
    cleanup.push(run.runDir);
    expect(allDone(cleanSlate, run)).toBe(false);

    g(run.projectDir, ["restore", "auth.ts"]); // discard the hack
    g(run.projectDir, ["add", "README.md"]);
    g(run.projectDir, ["commit", "-m", "ship docs"]); // commit the docs
    expect(allDone(cleanSlate, run)).toBe(true);
  });

  it.runIf(hasGit)("does not crash on an empty git.head, and player commits still register", () => {
    const emptyHead = {
      id: "test-empty-head",
      title: "t",
      difficulty: 1,
      track: "git",
      briefing: "",
      startingCwd: "/project",
      filesystem: {
        "/project": { type: "dir" },
        "/project/notes.txt": { type: "file", content: "hi" },
      },
      git: { head: {} },
      objectives: [
        { id: "committed", label: "commit", type: "git_committed" },
        { id: "check", label: "check", type: "command_used", command: "check" },
      ],
      hints: [{ text: "h" }],
      successMessage: "ok",
    } satisfies Mission;

    const run = createSandbox(emptyHead); // would throw before --allow-empty
    cleanup.push(run.runDir);
    expect(allDone(emptyHead, run)).toBe(false); // baseline commit doesn't count as the player's

    g(run.projectDir, ["add", "-A"]);
    g(run.projectDir, ["commit", "-m", "work"]);
    expect(allDone(emptyHead, run)).toBe(true);
  });

  it("refuses to operate outside the sandbox base", () => {
    // createSandbox always builds paths under ~/.terminal-invaders/runs; the
    // internal assertSafe guard would throw otherwise. Sanity-check the run dir.
    const run = createSandbox(replaceCopy);
    cleanup.push(run.runDir);
    expect(run.runDir).toContain(path.join(".terminal-invaders", "runs"));
  });

  it("guards the sandbox base on a path boundary, not a string prefix", () => {
    const base = path.join(os.homedir(), ".terminal-invaders", "runs");
    expect(() => assertSafe(path.join(base, "ok-run"))).not.toThrow();
    expect(() => assertSafe(base)).not.toThrow();
    // A sibling that merely shares the prefix string must be rejected.
    expect(() => assertSafe(`${base}-evil`)).toThrow(/outside the sandbox base/);
    expect(() => assertSafe(path.join(os.homedir(), "real-project"))).toThrow();
  });
});
