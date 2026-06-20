import { describe, expect, it } from "vitest";
import { GameEngine } from "@terminal-invaders/core";
import { inspectRoot } from "../src/navigation/inspectRoot.ts";
import { relativePaths } from "../src/navigation/relativePaths.ts";
import { lookAround } from "../src/navigation/lookAround.ts";
import { stepInside } from "../src/navigation/stepInside.ts";
import { readTheTree } from "../src/navigation/readTheTree.ts";
import { homeAndBack } from "../src/navigation/homeAndBack.ts";
import { deepChain } from "../src/navigation/deepChain.ts";
import { sidewaysAndDown } from "../src/navigation/sidewaysAndDown.ts";
import { findByConvention } from "../src/navigation/findByConvention.ts";
import { surveyTheCodebase } from "../src/navigation/surveyTheCodebase.ts";

function play(e: GameEngine, inputs: string[]) {
  for (const i of inputs) e.execute(i);
}

describe("navigation track", () => {
  it("solves nav-001 Where Am I?", () => {
    const e = new GameEngine(inspectRoot);
    play(e, ["pwd", "ls", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves nav-005 Up and Over", () => {
    const e = new GameEngine(relativePaths);
    play(e, ["cd src/utils", "cd ../api", "open route.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.cwd).toBe("/project/src/api");
  });

  it("solves nav-002 Look Around", () => {
    const e = new GameEngine(lookAround);
    play(e, ["ls", "ls src", "cat README.md", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.openedFiles).toContain("/project/README.md");
  });

  it("solves nav-003 Step Inside", () => {
    const e = new GameEngine(stepInside);
    play(e, ["cd src", "pwd", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.cwd).toBe("/project/src");
  });

  it("solves nav-004 Read the Tree", () => {
    const e = new GameEngine(readTheTree);
    play(e, ["tree", "cd src/api/handlers", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.cwd).toBe("/project/src/api/handlers");
  });

  it("solves nav-006 Home and Back", () => {
    const e = new GameEngine(homeAndBack);
    play(e, ["cd /home/dev", "cd /project/src/server", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.cwd).toBe("/project/src/server");
  });

  it("solves nav-007 Deep Chain", () => {
    const e = new GameEngine(deepChain);
    play(e, ["cd src/features/auth/config", "open settings.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.openedFiles).toContain("/project/src/features/auth/config/settings.ts");
  });

  it("solves nav-008 Sideways and Down", () => {
    const e = new GameEngine(sidewaysAndDown);
    play(e, ["cd ../../lib/http", "open client.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.cwd).toBe("/project/src/lib/http");
  });

  it("solves nav-009 Find by Convention", () => {
    const e = new GameEngine(findByConvention);
    play(e, ["cd /project", "open tsconfig.json", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.openedFiles).toContain("/project/tsconfig.json");
  });

  it("solves nav-010 Survey the Codebase (boss)", () => {
    const e = new GameEngine(surveyTheCodebase);
    play(e, ["tree", "cd packages/server/src", "open main.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.openedFiles).toContain("/project/packages/server/src/main.ts");
  });
});
