import { resolvePath, basename, parentPath } from "../fs/pathUtils.ts";
import type { Environment } from "../lessons/types.ts";
import type { ToolKit } from "../missions/types.ts";
import { FZF_COMMANDS } from "./fzf.ts";
import { CORE_COMMAND_LESSONS } from "./lessons.ts";
import { MODERN_TOOL_COMMANDS } from "./modernTools.ts";
import { POWERSHELL_COMMANDS } from "./powershell.ts";
import type { CommandResult, CommandSpec } from "./types.ts";

/** Suggest the closest existing path to a mistyped one (cheap heuristic). */
function closestPath(fs: { allPaths(): string[] }, target: string): string | undefined {
  const name = basename(target);
  return fs.allPaths().find((p) => basename(p) === name);
}

const pwd: CommandSpec = {
  name: "pwd",
  summary: "Print the current directory",
  argType: "none",
  handler: ({ state }) => ({ ok: true, output: [state.cwd] }),
};

const ls: CommandSpec = {
  name: "ls",
  summary: "List the contents of a directory",
  argType: "dir",
  handler: ({ args, state, fs }) => {
    const target = args[0] ? resolvePath(state.cwd, args[0]) : state.cwd;
    if (!fs.exists(target)) {
      return {
        ok: false,
        output: [`ls: no such directory: ${args[0] ?? target}`],
        mistake: { kind: "bad_path", input: args[0] ?? target, at: Date.now() },
      };
    }
    if (fs.isFile(target)) return { ok: true, output: [basename(target)] };
    const entries = fs.listDir(target);
    if (entries.length === 0) return { ok: true, output: ["(empty)"] };
    return {
      ok: true,
      output: [entries.map((e) => (e.node.type === "dir" ? `${e.name}/` : e.name)).join("  ")],
    };
  },
};

const cd: CommandSpec = {
  name: "cd",
  summary: "Change directory",
  argType: "dir",
  handler: ({ args, state, fs }) => {
    const raw = args[0] ?? "/project";
    const target = resolvePath(state.cwd, raw);
    if (!fs.exists(target)) {
      const here = fs.listDir(state.cwd).filter((e) => e.node.type === "dir");
      const hint = here.length
        ? ` Available here: ${here.map((e) => e.name).join(", ")}.`
        : "";
      return {
        ok: false,
        output: [`cd: no directory named "${raw}" in ${state.cwd}.${hint}`],
        mistake: { kind: "bad_path", input: raw, at: Date.now() },
      };
    }
    if (!fs.isDir(target)) {
      return {
        ok: false,
        output: [`cd: not a directory: ${raw}. Use \`open\` or \`cat\` for files.`],
        mistake: { kind: "bad_path", input: raw, at: Date.now() },
      };
    }
    return {
      ok: true,
      output: [],
      statePatch: { cwd: target },
      events: [{ type: "move", from: state.cwd, to: target }],
    };
  },
};

const cat: CommandSpec = {
  name: "cat",
  summary: "Print the contents of a file",
  argType: "file",
  handler: ({ args, state, fs }) => {
    if (!args[0]) return { ok: false, output: ["cat: missing file operand"] };
    const target = resolvePath(state.cwd, args[0]);
    const content = fs.readFile(target);
    if (content === undefined) {
      const near = closestPath(fs, target);
      return {
        ok: false,
        output: [
          `cat: no file named "${args[0]}" in ${state.cwd}.`,
          ...(near ? [`Closest match: ${near}`] : []),
        ],
        mistake: { kind: "bad_path", input: args[0], at: Date.now() },
      };
    }
    return {
      ok: true,
      output: content.split("\n"),
      statePatch: { openedFiles: dedupe(state.openedFiles, target), activeFile: target },
      events: [{ type: "open_file", path: target }],
    };
  },
};

const open: CommandSpec = {
  name: "open",
  summary: "Open a file in the preview pane",
  argType: "file",
  handler: ({ args, state, fs }) => {
    if (!args[0]) return { ok: false, output: ["open: missing file operand"] };
    const target = resolvePath(state.cwd, args[0]);
    if (!fs.isFile(target)) {
      const near = closestPath(fs, target);
      return {
        ok: false,
        output: [
          `open: no file named "${args[0]}" here.`,
          ...(near ? [`Try: open ${near}`] : []),
        ],
        mistake: { kind: "bad_path", input: args[0], at: Date.now() },
      };
    }
    return {
      ok: true,
      output: [`Opened ${basename(target)}.`],
      statePatch: { openedFiles: dedupe(state.openedFiles, target), activeFile: target },
      events: [{ type: "open_file", path: target }],
    };
  },
};

const rg: CommandSpec = {
  name: "rg",
  summary: "Search file contents (ripgrep)",
  argType: "none",
  handler: ({ args, state, fs }) => {
    const query = args[0];
    if (!query) return { ok: false, output: ["rg: missing search pattern. Try: rg \"text\""] };
    const matches = fs.search(query);
    const searches = [...state.searches, { query, matches }];
    if (matches.length === 0) {
      return {
        ok: true,
        output: [`No matches for "${query}".`],
        statePatch: { searches },
        events: [{ type: "search", query, matches }],
      };
    }
    return {
      ok: true,
      output: matches.map((m) => `${m.path}:${m.line}: ${m.text}`),
      statePatch: { searches },
      events: [{ type: "search", query, matches }],
    };
  },
};

// `nvim` and `git` are intercepted by the engine (they need the editor / git
// models). These specs exist only for autocomplete, help, and allow-list checks;
// their handlers are never invoked.
const enginePlaceholder = (name: string): CommandSpec["handler"] => () => ({
  ok: true,
  output: [`${name}: handled by the engine`],
});

const nvim: CommandSpec = {
  name: "nvim",
  summary: "Open a file in the simulated nvim editor",
  argType: "file",
  handler: enginePlaceholder("nvim"),
};

const git: CommandSpec = {
  name: "git",
  summary: "git status/diff/add/restore/commit/log (simulated)",
  argType: "none",
  handler: enginePlaceholder("git"),
};

const tree: CommandSpec = {
  name: "tree",
  summary: "Show the directory tree from the current location",
  argType: "dir",
  handler: ({ args, state, fs }) => {
    const root = args[0] ? resolvePath(state.cwd, args[0]) : state.cwd;
    if (!fs.isDir(root)) return { ok: false, output: [`tree: not a directory: ${root}`] };
    const lines: string[] = [root];
    const walk = (dir: string, prefix: string) => {
      const entries = fs.listDir(dir);
      entries.forEach((e, i) => {
        const last = i === entries.length - 1;
        lines.push(`${prefix}${last ? "└── " : "├── "}${e.name}${e.node.type === "dir" ? "/" : ""}`);
        if (e.node.type === "dir") walk(e.path, prefix + (last ? "    " : "│   "));
      });
    };
    walk(root, "");
    return { ok: true, output: lines };
  },
};

function dedupe(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

/** Commands whose only job is to satisfy mission objectives / validation. */
export const CORE_COMMANDS: CommandSpec[] = [pwd, ls, cd, cat, open, rg, nvim, git, tree];

// Attach the teaching cards so `help` can group by kind and `explain` can find
// them straight off the spec. Kept here (not inlined above) so the handlers stay
// readable and the lesson prose lives in one file.
for (const spec of CORE_COMMANDS) spec.lesson = CORE_COMMAND_LESSONS[spec.name];

/**
 * The base command set for a mission/journey, chosen by its environment:
 * PowerShell missions get the cmdlet set; everything else gets the bash core,
 * plus any opted-in toolkits (modern CLI tools, fzf). `tool:fzf` implies fzf.
 */
export function commandsForMission(mission: {
  environment?: Environment;
  tools?: ToolKit[];
}): CommandSpec[] {
  if (mission.environment === "powershell") return [...POWERSHELL_COMMANDS];
  const base = [...CORE_COMMANDS];
  const tools = new Set<ToolKit>(mission.tools ?? []);
  if (mission.environment === "tool:fzf") tools.add("fzf");
  if (tools.has("modern")) base.push(...MODERN_TOOL_COMMANDS);
  if (tools.has("fzf")) base.push(...FZF_COMMANDS);
  return base;
}

export { resolvePath, parentPath };
export type { CommandResult };
