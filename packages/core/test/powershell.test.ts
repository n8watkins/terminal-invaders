import { describe, expect, it } from "vitest";
import { POWERSHELL_COMMANDS } from "../src/commands/powershell.ts";
import { VirtualFs } from "../src/fs/virtualFs.ts";

/** A tiny project tree: a dir plus two files, one with a searchable word. */
function makeFs(): VirtualFs {
  return new VirtualFs({
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/README.md": { type: "file", content: "Hello world\nNeedle is here" },
    "/project/notes.txt": { type: "file", content: "just some notes" },
  });
}

/** Look a spec up by its registered name. */
function spec(name: string) {
  const found = POWERSHELL_COMMANDS.find((c) => c.name === name);
  if (!found) throw new Error(`no PowerShell spec named ${name}`);
  return found;
}

/** Build a fresh command context with a minimal session-state stand-in. */
function ctx(args: string[], fs: VirtualFs, overrides: Record<string, unknown> = {}) {
  return {
    args,
    raw: "",
    state: { cwd: "/project", openedFiles: [], searches: [], ...overrides } as any,
    fs,
    mission: {} as any,
  };
}

describe("POWERSHELL_COMMANDS — behavior matches the bash equivalents", () => {
  it("Get-Location prints the current directory", () => {
    const res = spec("Get-Location").handler(ctx([], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.output).toEqual(["/project"]);
  });

  it("gl (alias) behaves like Get-Location", () => {
    const res = spec("gl").handler(ctx([], makeFs()));
    expect(res.output).toEqual(["/project"]);
  });

  it("Set-Location changes directory via statePatch.cwd + move event", () => {
    const res = spec("Set-Location").handler(ctx(["src"], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.statePatch?.cwd).toBe("/project/src");
    expect(res.events).toEqual([{ type: "move", from: "/project", to: "/project/src" }]);
  });

  it("sl (alias) changes directory too", () => {
    const res = spec("sl").handler(ctx(["src"], makeFs()));
    expect(res.statePatch?.cwd).toBe("/project/src");
  });

  it("Set-Location errors on a missing path", () => {
    const res = spec("Set-Location").handler(ctx(["nope"], makeFs()));
    expect(res.ok).toBe(false);
    expect(res.mistake?.kind).toBe("bad_path");
  });

  it("Get-ChildItem lists directory entries", () => {
    const res = spec("Get-ChildItem").handler(ctx([], makeFs()));
    expect(res.ok).toBe(true);
    const joined = res.output.join("\n");
    expect(joined).toContain("src");
    expect(joined).toContain("README.md");
    expect(joined).toContain("notes.txt");
  });

  it("gci (alias) lists entries too", () => {
    const res = spec("gci").handler(ctx([], makeFs()));
    expect(res.output.join("\n")).toContain("src");
  });

  it("Get-Content prints file contents and records openedFiles/activeFile", () => {
    const res = spec("Get-Content").handler(ctx(["README.md"], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.output).toEqual(["Hello world", "Needle is here"]);
    expect(res.statePatch?.openedFiles).toEqual(["/project/README.md"]);
    expect(res.statePatch?.activeFile).toBe("/project/README.md");
    expect(res.events).toEqual([{ type: "open_file", path: "/project/README.md" }]);
  });

  it("gc (alias) reads file content too", () => {
    const res = spec("gc").handler(ctx(["notes.txt"], makeFs()));
    expect(res.output).toEqual(["just some notes"]);
  });

  it("Get-Content errors on a missing file", () => {
    const res = spec("Get-Content").handler(ctx(["ghost.md"], makeFs()));
    expect(res.ok).toBe(false);
    expect(res.mistake?.kind).toBe("bad_path");
  });

  it("Select-String finds a word and records the search", () => {
    const res = spec("Select-String").handler(ctx(["Needle"], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.output.join("\n")).toContain("/project/README.md:2");
    expect(res.statePatch?.searches).toHaveLength(1);
    expect(res.statePatch?.searches?.[0].query).toBe("Needle");
    expect(res.statePatch?.searches?.[0].matches.length).toBeGreaterThan(0);
    expect(res.events?.[0]).toMatchObject({ type: "search", query: "Needle" });
  });

  it("sls (alias) searches too, and reports no matches cleanly", () => {
    const res = spec("sls").handler(ctx(["zzzznope"], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.statePatch?.searches?.[0].matches).toHaveLength(0);
    expect(res.output.join("\n").toLowerCase()).toContain("no matches");
  });

  it("Write-Output echoes its arguments joined by spaces", () => {
    const res = spec("Write-Output").handler(ctx(["hello", "world"], makeFs()));
    expect(res.ok).toBe(true);
    expect(res.output).toEqual(["hello world"]);
  });

  it("echo (alias) echoes too", () => {
    const res = spec("echo").handler(ctx(["hi", "there"], makeFs()));
    expect(res.output).toEqual(["hi there"]);
  });
});

describe("POWERSHELL_COMMANDS — lesson coverage", () => {
  const CANONICAL_TO_BASH: Record<string, string[]> = {
    "Get-Location": ["pwd"],
    "Set-Location": ["cd"],
    "Get-ChildItem": ["ls", "dir"],
    "Get-Content": ["cat"],
    "Select-String": ["grep", "rg"],
    "Write-Output": ["echo"],
  };

  it("every spec has a powershell-cmdlet lesson with a non-empty explanation", () => {
    for (const c of POWERSHELL_COMMANDS) {
      expect(c.lesson, `${c.name} should have a lesson`).toBeDefined();
      expect(c.lesson?.kind).toBe("powershell-cmdlet");
      expect(c.lesson?.environment).toEqual(["powershell"]);
      expect(c.lesson?.provenance.length).toBeGreaterThan(0);
      expect(c.lesson?.explanation.length).toBeGreaterThan(0);
      expect(c.lesson?.provenance.toLowerCase()).toContain("powershell");
    }
  });

  it("each canonical cmdlet's explanation names a bash equivalent", () => {
    for (const [cmdlet, bashNames] of Object.entries(CANONICAL_TO_BASH)) {
      const explanation = spec(cmdlet).lesson?.explanation ?? "";
      const mentions = bashNames.some((b) => explanation.includes(`\`${b}\``));
      expect(mentions, `${cmdlet} explanation should name a bash equivalent`).toBe(true);
    }
  });

  it("registers each cmdlet, its short alias, and the bash-name aliases PowerShell ships", () => {
    const names = POWERSHELL_COMMANDS.map((c) => c.name);
    for (const pair of [
      ["Get-Location", "gl"],
      ["Set-Location", "sl"],
      ["Get-ChildItem", "gci"],
      ["Get-Content", "gc"],
      ["Select-String", "sls"],
      ["Write-Output", "echo"],
    ]) {
      expect(names).toContain(pair[0]);
      expect(names).toContain(pair[1]);
    }
    // PowerShell genuinely aliases these bash names, so a bash user can type them.
    for (const alias of ["ls", "dir", "cd", "pwd", "cat"]) {
      expect(names, `PowerShell should register the ${alias} alias`).toContain(alias);
    }
  });

  it("the bash-name aliases run the same handler as their canonical cmdlet", () => {
    const by = (n: string) => POWERSHELL_COMMANDS.find((c) => c.name === n)!;
    expect(by("ls").handler).toBe(by("Get-ChildItem").handler);
    expect(by("cd").handler).toBe(by("Set-Location").handler);
    expect(by("pwd").handler).toBe(by("Get-Location").handler);
    expect(by("cat").handler).toBe(by("Get-Content").handler);
  });
});
