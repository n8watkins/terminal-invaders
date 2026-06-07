import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { replaceCopy, stageAndCommit, undoTheMistake } from "@terminal-invaders/missions";
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
