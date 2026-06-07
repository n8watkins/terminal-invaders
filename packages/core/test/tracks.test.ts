import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/index.ts";
import {
  openLookLeave,
  replaceCopy,
  saveYourWork,
  stageAndCommit,
  undoTheMistake,
  whatChanged,
} from "@terminal-invaders/missions";

function play(engine: GameEngine, inputs: string[]) {
  for (const i of inputs) engine.execute(i);
}

describe("LazyVim editor", () => {
  it("open / search / quit completes lv-001", () => {
    const e = new GameEngine(openLookLeave);
    play(e, ["nvim utils.ts", "/export", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("routes all input to the editor while open, then back to the shell", () => {
    const e = new GameEngine(openLookLeave);
    e.execute("nvim utils.ts");
    expect(e.editorOpen).toBe(true);
    e.execute(":q");
    expect(e.editorOpen).toBe(false);
  });

  it("insert + write persists to the filesystem (lv-002)", () => {
    const e = new GameEngine(saveYourWork);
    play(e, ["nvim todo.md", "i", "- Ship it", "esc", ":wq", "check"]);
    expect(e.fs.readFile("/project/todo.md")).toContain("Ship it");
    expect(e.state.complete).toBe(true);
  });

  it("blocks :q with unsaved changes", () => {
    const e = new GameEngine(saveYourWork);
    e.execute("nvim todo.md");
    e.execute("i");
    e.execute("- dirty");
    e.execute("esc");
    const { output } = e.execute(":q");
    expect(output.join(" ")).toMatch(/No write since last change/);
    expect(e.editorOpen).toBe(true);
  });

  it("global substitute swaps copy and completes the boss (lv-010)", () => {
    const e = new GameEngine(replaceCopy);
    play(e, ["nvim page.tsx", ":%s/Start now/Get started/g", ":wq", "check"]);
    const content = e.fs.readFile("/project/src/app/page.tsx") ?? "";
    expect(content).toContain("Get started");
    expect(content).not.toContain("Start now");
    expect(e.state.complete).toBe(true);
  });
});

describe("Git safety", () => {
  it("status + diff completes git-001", () => {
    const e = new GameEngine(whatChanged);
    play(e, ["git status", "git diff", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("add + commit completes git-005", () => {
    const e = new GameEngine(stageAndCommit);
    play(e, ["git add greet.ts", 'git commit -m "improve"', "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.gitCommits).toBe(1);
  });

  it("restore recovers the committed version (git-009)", () => {
    const e = new GameEngine(undoTheMistake);
    expect(e.fs.readFile("/project/env.ts")).toContain("oops");
    play(e, ["git diff", "git restore env.ts", "check"]);
    expect(e.fs.readFile("/project/env.ts")).toContain("api.acme.com");
    expect(e.state.complete).toBe(true);
  });

  it("git commands are inert without a git config", () => {
    const e = new GameEngine(openLookLeave);
    const { output } = e.execute("git status");
    expect(output.join(" ")).toMatch(/not a git repository/);
  });
});
