import { describe, expect, it } from "vitest";
import { FZF_COMMANDS } from "../src/commands/fzf.ts";
import { VirtualFs } from "../src/fs/virtualFs.ts";

function makeFs() {
  return new VirtualFs({
    "/": { type: "dir" },
    "/project": { type: "dir" },
    "/project/README.md": { type: "file", content: "# readme" },
    "/project/src": { type: "dir" },
    "/project/src/app": { type: "dir" },
    "/project/src/app/page.tsx": { type: "file", content: "export default page" },
    "/project/src/lib": { type: "dir" },
    "/project/src/lib/utils.ts": { type: "file", content: "export const u = 1" },
  });
}

const spec = FZF_COMMANDS[0];

function run(args: string[], openedFiles: string[] = []) {
  const fs = makeFs();
  return spec.handler({
    args,
    raw: "",
    state: { cwd: "/project", openedFiles } as any,
    fs,
    mission: {} as any,
  });
}

describe("fzf", () => {
  it("fuzzy-selects and opens the best matching file", () => {
    const res = run(["page"]);
    expect(res.ok).toBe(true);

    const selected = "/project/src/app/page.tsx";
    expect(res.output).toContain(`▶ selected: ${selected}`);
    expect(res.statePatch?.openedFiles).toContain(selected);
    expect(res.statePatch?.activeFile).toBe(selected);
    expect(res.events).toEqual([{ type: "open_file", path: selected }]);
  });

  it("preserves previously opened files when selecting", () => {
    const res = run(["utils"], ["/project/README.md"]);
    const selected = "/project/src/lib/utils.ts";
    expect(res.statePatch?.openedFiles).toEqual(["/project/README.md", selected]);
  });

  it("lists candidates without selecting when given no query", () => {
    const res = run([]);
    expect(res.ok).toBe(true);
    expect(res.output).toContain("/project/src/app/page.tsx");
    expect(res.output).toContain("/project/src/lib/utils.ts");
    expect(res.output).toContain("/project/README.md");
    // No directories in the candidate list.
    expect(res.output).not.toContain("/project/src");
    // Nothing was opened.
    expect(res.statePatch).toBeUndefined();
    expect(res.events).toBeUndefined();
    expect(res.output.some((l) => l.includes("fzf <query>"))).toBe(true);
  });

  it("reports no matches and selects nothing for an unmatched query", () => {
    const res = run(["zzzzz"]);
    expect(res.ok).toBe(true);
    expect(res.output.join("\n")).toContain("(no matches");
    expect(res.statePatch).toBeUndefined();
    expect(res.events).toBeUndefined();
  });

  it("ships a thorough lesson card", () => {
    const lesson = spec.lesson;
    expect(lesson).toBeDefined();
    expect(lesson?.kind).toBe("external-cli");
    expect(lesson?.environment).toContain("tool:fzf");
    expect(lesson?.provenance.length).toBeGreaterThan(0);
    expect(lesson?.explanation.length).toBeGreaterThan(0);
    expect(lesson?.examples.length).toBeGreaterThan(0);
  });
});
