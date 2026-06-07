import { describe, expect, it } from "vitest";
import { GameEngine, GitModel, VirtualFs, completeInput, parseCommand, resolvePath } from "../src/index.ts";
import { heroCopy } from "@terminal-invaders/missions";

describe("parseCommand", () => {
  it("handles quoted strings and extra spaces", () => {
    expect(parseCommand('  rg   "Start now" ')).toEqual({
      name: "rg",
      args: ["Start now"],
      raw: '  rg   "Start now" ',
    });
  });
  it("returns empty name for blank input", () => {
    expect(parseCommand("   ").name).toBe("");
  });
});

describe("resolvePath", () => {
  it("resolves relative, parent, and absolute paths", () => {
    expect(resolvePath("/project/src", "app")).toBe("/project/src/app");
    expect(resolvePath("/project/src/app", "..")).toBe("/project/src");
    expect(resolvePath("/project/src", "../utils/x")).toBe("/project/utils/x");
    expect(resolvePath("/whatever", "/project")).toBe("/project");
  });
});

describe("GameEngine — hero copy mission", () => {
  it("completes via the intended path and scores it", () => {
    const engine = new GameEngine(heroCopy);

    engine.execute("ls");
    engine.execute("cd src");
    engine.execute("cd app");
    engine.execute('rg "Start now"');
    engine.execute("nvim page.tsx");
    engine.execute(":q"); // leave the editor before running shell commands
    const result = engine.execute("check");

    expect(engine.state.complete).toBe(true);
    expect(engine.state.score).toBeGreaterThan(0);
    expect(result.events.some((e) => e.type === "mission_complete")).toBe(true);
  });

  it("reports missing objectives when checked too early", () => {
    const engine = new GameEngine(heroCopy);
    const { output } = engine.execute("check");
    expect(output[0]).toMatch(/Not yet/);
    expect(engine.state.complete).toBe(false);
  });

  it("gives a helpful error and records a mistake on bad cd", () => {
    const engine = new GameEngine(heroCopy);
    const { output } = engine.execute("cd nope");
    expect(output[0]).toMatch(/no directory named/);
    expect(engine.state.mistakes.length).toBe(1);
  });
});

describe("GitModel — commit shas", () => {
  it("uses the same stable sha at commit time and in the log", () => {
    const fs = new VirtualFs({ "/project/a.ts": { type: "file", content: "v1" } });
    const git = new GitModel({ "/project/a.ts": "v0" });

    git.add(fs, "/project/a.ts");
    const committed = git.commit("change a");
    const sha = committed.message.match(/\[main ([0-9a-f]+)\]/)?.[1];
    expect(sha).toBeTruthy();

    // The sha in `git log` matches the one printed at commit time, and is stable
    // across repeated reads (it used to be re-randomized on every call).
    expect(git.log()[0]).toBe(`${sha} change a`);
    expect(git.log()).toEqual(git.log());
  });
});

describe("autocomplete", () => {
  it("completes a command name", () => {
    const engine = new GameEngine(heroCopy);
    const res = completeInput("nv", engine);
    expect(res.replacement).toBe("nvim ");
    expect(res.completed).toBe(true);
  });

  it("completes a directory and appends a slash", () => {
    const engine = new GameEngine(heroCopy);
    const res = completeInput("cd sr", engine);
    expect(res.replacement).toBe("cd src/");
  });

  it("offers options when ambiguous", () => {
    const engine = new GameEngine(heroCopy);
    engine.execute("cd src");
    const res = completeInput("ls ", engine);
    expect(res.options).toContain("app/");
    expect(res.options).toContain("components/");
  });
});
