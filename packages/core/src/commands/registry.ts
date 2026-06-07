import { resolvePath, basename, parentPath } from "../fs/pathUtils.ts";
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

const nvim: CommandSpec = {
  name: "nvim",
  summary: "Open a file in nvim (simulated editor)",
  argType: "file",
  handler: ({ args, state, fs }) => {
    if (!args[0]) return { ok: false, output: ["nvim: open what? Try: nvim <file>"] };
    const target = resolvePath(state.cwd, args[0]);
    if (!fs.isFile(target)) {
      const near = closestPath(fs, target);
      return {
        ok: false,
        output: [
          `nvim: cannot find "${args[0]}".`,
          ...(near ? [`Did you mean: nvim ${near}`] : []),
        ],
        mistake: { kind: "bad_path", input: args[0], at: Date.now() },
      };
    }
    return {
      ok: true,
      output: [
        `── nvim ── ${basename(target)} ──`,
        ...(fs.readFile(target) ?? "").split("\n"),
        "(simulated buffer — :q to close, more vim missions coming)",
      ],
      statePatch: {
        openedFiles: dedupe(state.openedFiles, target),
        activeFile: target,
        editorOpen: true,
      },
      events: [{ type: "open_file", path: target }],
    };
  },
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
export const CORE_COMMANDS: CommandSpec[] = [pwd, ls, cd, cat, open, rg, nvim, tree];

export { resolvePath, parentPath };
export type { CommandResult };
