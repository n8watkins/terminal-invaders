import { describe, expect, it } from "vitest";
import { GameEngine } from "@terminal-invaders/core";
import { insertALine } from "../src/lazyvim/insertALine.ts";
import { appendAtTheEnd } from "../src/lazyvim/appendAtTheEnd.ts";
import { searchInFile } from "../src/lazyvim/searchInFile.ts";
import { deleteALine } from "../src/lazyvim/deleteALine.ts";
import { openBelow } from "../src/lazyvim/openBelow.ts";
import { oneShotSubstitute } from "../src/lazyvim/oneShotSubstitute.ts";
import { refactorPass } from "../src/lazyvim/refactorPass.ts";

function play(e: GameEngine, inputs: string[]) {
  for (const i of inputs) e.execute(i);
}

describe("lazyvim track — new missions", () => {
  it("solves lv-003 (insert a line)", () => {
    const e = new GameEngine(insertALine);
    play(e, ["nvim notes.md", "i", "- First note", "esc", ":w", ":q", "check"]);
    expect(e.fs.readFile("/project/notes.md")).toContain("First note");
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-004 (append at the end)", () => {
    const e = new GameEngine(appendAtTheEnd);
    play(e, ["nvim CHANGELOG.md", "G", "o", "## v1.1.0", "esc", ":wq", "check"]);
    expect(e.fs.readFile("/project/CHANGELOG.md")).toContain("v1.1.0");
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-005 (search in file)", () => {
    const e = new GameEngine(searchInFile);
    play(e, ["nvim config.ts", "/timeout", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-006 (delete a line)", () => {
    const e = new GameEngine(deleteALine);
    play(e, ["nvim server.ts", "/console.log", "dd", ":wq", "check"]);
    expect(e.fs.readFile("/project/src/server.ts")).not.toContain("console.log");
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-007 (open below)", () => {
    const e = new GameEngine(openBelow);
    play(e, ["nvim team.md", "o", "- Dana", "esc", ":wq", "check"]);
    expect(e.fs.readFile("/project/team.md")).toContain("Dana");
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-008 (one-shot substitute)", () => {
    const e = new GameEngine(oneShotSubstitute);
    play(e, ["nvim counter.ts", ":%s/count/total/g", ":wq", "check"]);
    const content = e.fs.readFile("/project/src/counter.ts") ?? "";
    expect(content).toContain("total");
    expect(content).not.toContain("count");
    expect(e.state.complete).toBe(true);
  });

  it("solves lv-009 (refactor pass)", () => {
    const e = new GameEngine(refactorPass);
    play(e, [
      "nvim api.ts",
      "/legacyFetch",
      "dd",
      "o",
      "export const modernFetch = http.get;",
      "esc",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/api.ts") ?? "";
    expect(content).not.toContain("legacyFetch");
    expect(content).toContain("modernFetch");
    expect(e.state.complete).toBe(true);
  });
});
