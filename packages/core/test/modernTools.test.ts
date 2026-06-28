import { describe, expect, it } from "vitest";
import type { CommandContext, CommandResult, CommandSpec } from "../src/commands/types.ts";
import { MODERN_TOOL_COMMANDS } from "../src/commands/modernTools.ts";
import { VirtualFs } from "../src/fs/virtualFs.ts";

function buildFs(): VirtualFs {
  return new VirtualFs({
    "/project": { type: "dir" },
    "/project/README.md": { type: "file", content: "hello\nworld" },
    "/project/package.json": {
      type: "file",
      content: JSON.stringify({ name: "demo", scripts: { dev: "vite" } }, null, 2),
    },
    "/project/src": { type: "dir" },
    "/project/src/index.ts": { type: "file", content: "export const x = 1;" },
  });
}

function byName(name: string): CommandSpec {
  const spec = MODERN_TOOL_COMMANDS.find((s) => s.name === name);
  if (!spec) throw new Error(`no spec named ${name}`);
  return spec;
}

function run(name: string, args: string[], fs: VirtualFs, cwd = "/project"): CommandResult {
  const ctx = {
    args,
    raw: "",
    state: { cwd, openedFiles: [], searches: [] },
    fs,
    mission: {},
  } as unknown as CommandContext;
  return byName(name).handler(ctx);
}

describe("MODERN_TOOL_COMMANDS — bat", () => {
  it("prints content with a header and line numbers, and opens the file", () => {
    const fs = buildFs();
    const res = run("bat", ["README.md"], fs);
    expect(res.ok).toBe(true);
    expect(res.output[0]).toContain("/project/README.md");
    expect(res.output).toContain("1 │ hello");
    expect(res.output).toContain("2 │ world");
    expect(res.statePatch?.openedFiles).toContain("/project/README.md");
    expect(res.statePatch?.activeFile).toBe("/project/README.md");
    expect(res.events?.some((e) => e.type === "open_file")).toBe(true);
  });

  it("fails friendly on a missing file", () => {
    const res = run("bat", ["nope.md"], buildFs());
    expect(res.ok).toBe(false);
    expect(res.output[0]).toMatch(/no file named/);
  });
});

describe("MODERN_TOOL_COMMANDS — eza", () => {
  it("lists entries one per line with a trailing slash on dirs", () => {
    const res = run("eza", [], buildFs());
    expect(res.ok).toBe(true);
    expect(res.output).toContain("d src/");
    expect(res.output).toContain("- README.md");
    // one entry per line: src/, README.md, package.json
    expect(res.output.length).toBe(3);
  });
});

describe("MODERN_TOOL_COMMANDS — z (zoxide)", () => {
  it("jumps to a directory by substring via statePatch + move event", () => {
    const fs = buildFs();
    const res = run("z", ["src"], fs);
    expect(res.ok).toBe(true);
    expect(res.statePatch?.cwd).toBe("/project/src");
    expect(res.events?.some((e) => e.type === "move" && e.to === "/project/src")).toBe(true);
  });

  it("fails friendly when nothing matches", () => {
    const res = run("z", ["zzz-nope"], buildFs());
    expect(res.ok).toBe(false);
    expect(res.output[0]).toMatch(/no directory matching/);
  });
});

describe("MODERN_TOOL_COMMANDS — jq", () => {
  it("pretty-prints the whole document with `.`", () => {
    const res = run("jq", [".", "package.json"], buildFs());
    expect(res.ok).toBe(true);
    expect(res.output.join("\n")).toContain('"name": "demo"');
  });

  it("extracts a value with `.name`", () => {
    const res = run("jq", [".name", "package.json"], buildFs());
    expect(res.ok).toBe(true);
    expect(res.output).toEqual(['"demo"']);
  });

  it("follows a dotted path with `.scripts.dev`", () => {
    const res = run("jq", [".scripts.dev", "package.json"], buildFs());
    expect(res.output).toEqual(['"vite"']);
  });

  it("outputs null on a missing path", () => {
    const res = run("jq", [".nope", "package.json"], buildFs());
    expect(res.output).toEqual(["null"]);
  });

  it("fails on invalid JSON", () => {
    const res = run("jq", [".", "README.md"], buildFs());
    expect(res.ok).toBe(false);
    expect(res.output[0]).toMatch(/parse error/);
  });
});

describe("MODERN_TOOL_COMMANDS — lessons", () => {
  it("every spec has a thorough lesson", () => {
    expect(MODERN_TOOL_COMMANDS.length).toBe(4);
    for (const spec of MODERN_TOOL_COMMANDS) {
      expect(spec.lesson, `${spec.name} should have a lesson`).toBeDefined();
      const lesson = spec.lesson!;
      expect(lesson.kind).toBe("external-cli");
      expect(lesson.environment.length).toBeGreaterThan(0);
      expect(lesson.provenance.length).toBeGreaterThan(0);
      expect(lesson.explanation.length).toBeGreaterThan(0);
      expect(lesson.synopsis.length).toBeGreaterThan(0);
      expect(lesson.examples.length).toBeGreaterThan(0);
    }
  });
});
