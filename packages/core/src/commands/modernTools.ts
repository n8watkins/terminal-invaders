import { basename, resolvePath } from "../fs/pathUtils.ts";
import type { CommandSpec } from "./types.ts";

/**
 * "Modern CLI tools" command set — the install-it-yourself programs that have
 * become many developers' daily drivers as upgrades to the classic coreutils.
 *
 * Each of these is an `external-cli`: a standalone binary you add to your machine
 * (usually via Homebrew or apt), NOT a shell builtin and NOT preinstalled. The
 * handlers are thin but honest simulations over the virtual filesystem, and every
 * spec ships a full lesson card so `explain bat` / `explain jq` teach not just how
 * to use the tool but what kind of thing it is and where it comes from.
 */

/** Append `value` to `list` unless it's already present (mirrors registry.ts). */
function dedupe(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

const bat: CommandSpec = {
  name: "bat",
  summary: "Print a file with line numbers and a header (a cat clone)",
  argType: "file",
  handler: ({ args, state, fs }) => {
    if (!args[0]) return { ok: false, output: ["bat: missing file operand"] };
    const target = resolvePath(state.cwd, args[0]);
    const content = fs.readFile(target);
    if (content === undefined) {
      return {
        ok: false,
        output: [`bat: no file named "${args[0]}" in ${state.cwd}.`],
        mistake: { kind: "bad_path", input: args[0], at: Date.now() },
      };
    }
    const lines = content.split("\n");
    const width = String(lines.length).length;
    const numbered = lines.map(
      (line, i) => `${String(i + 1).padStart(width, " ")} │ ${line}`,
    );
    return {
      ok: true,
      output: [`───── ${target} ─────`, ...numbered],
      statePatch: { openedFiles: dedupe(state.openedFiles, target), activeFile: target },
      events: [{ type: "open_file", path: target }],
    };
  },
  lesson: {
    kind: "external-cli",
    environment: ["bash", "zsh"],
    provenance:
      "bat — a standalone program you install yourself, not a shell builtin and not preinstalled. It's a `cat` clone with syntax highlighting and line numbers. Install: `brew install bat` or `apt install bat` (on Debian/Ubuntu the binary is sometimes named `batcat` to avoid a name clash).",
    synopsis: "bat [file...]",
    explanation:
      "Prints a file to the terminal like `cat`, but nicer to read: it adds line numbers, a header showing the file name, and syntax highlighting based on the language. It also pages long output automatically (like piping through `less`). Reach for it whenever you'd `cat` a source file but want it to actually be legible.",
    examples: ["bat README.md", "bat package.json", "bat src/index.ts"],
    seeAlso: ["cat", "less"],
  },
};

const eza: CommandSpec = {
  name: "eza",
  summary: "List a directory, one entry per line with type markers (a modern ls)",
  argType: "dir",
  handler: ({ args, state, fs }) => {
    const target = args[0] ? resolvePath(state.cwd, args[0]) : state.cwd;
    if (!fs.exists(target)) {
      return {
        ok: false,
        output: [`eza: no such directory: ${args[0] ?? target}`],
        mistake: { kind: "bad_path", input: args[0] ?? target, at: Date.now() },
      };
    }
    if (fs.isFile(target)) return { ok: true, output: [`- ${basename(target)}`] };
    const entries = fs.listDir(target);
    if (entries.length === 0) return { ok: true, output: ["(empty)"] };
    return {
      ok: true,
      output: entries.map((e) =>
        e.node.type === "dir" ? `d ${e.name}/` : `- ${e.name}`,
      ),
    };
  },
  lesson: {
    kind: "external-cli",
    environment: ["bash", "zsh"],
    provenance:
      "eza — a modern `ls` replacement (the maintained successor to `exa`) that you install yourself; it is not a coreutil and not preinstalled. Install: `brew install eza` (or `apt install eza` on recent distros).",
    synopsis: "eza [options] [path]",
    explanation:
      "Lists the contents of a directory like `ls`, but with colors, file-type icons, a clearer type marker per entry, and git awareness (it can show which files have changes). It's a drop-in upgrade many developers alias to `ls`. Common flags mirror `ls`: `-l` for a long view, `-a` to include hidden files, `--tree` for a tree view.",
    examples: ["eza", "eza -la", "eza --tree src"],
    seeAlso: ["ls", "tree"],
  },
};

const zoxide: CommandSpec = {
  // Registered under the command name `z`, which is how you actually invoke zoxide.
  name: "z",
  summary: "Jump to a directory by a substring of its path (zoxide, a smarter cd)",
  argType: "dir",
  handler: ({ args, state, fs }) => {
    const needle = args[0];
    if (!needle) {
      return { ok: false, output: ["z: missing target. Try: z <directory-name>"] };
    }
    const lower = needle.toLowerCase();
    const match = fs.allPaths().find((p) => fs.isDir(p) && p.toLowerCase().includes(lower));
    if (!match) {
      return {
        ok: false,
        output: [`z: no directory matching "${needle}".`],
        mistake: { kind: "bad_path", input: needle, at: Date.now() },
      };
    }
    return {
      ok: true,
      output: [],
      statePatch: { cwd: match },
      events: [{ type: "move", from: state.cwd, to: match }],
    };
  },
  lesson: {
    kind: "external-cli",
    environment: ["bash", "zsh"],
    provenance:
      "zoxide — a standalone program you install that you invoke as `z`. It is not a shell builtin (it hooks into your shell after you install it). Install: `brew install zoxide` (or `apt install zoxide`), then add its init line to your shell config.",
    synopsis: "z <substring>",
    explanation:
      "zoxide — a smarter `cd` that learns your most-used directories so `z foo` jumps straight there instead of making you type the full path. It ranks the directories you visit by how often and recently you go to them, so over time a short fragment is enough to teleport across your whole filesystem. This trainer models the core idea: `z <substring>` jumps to the first directory whose path contains that substring.",
    examples: ["z src", "z app", "z project"],
    seeAlso: ["cd"],
  },
};

const jq: CommandSpec = {
  name: "jq",
  summary: "Slice and reshape JSON from a file (a command-line JSON processor)",
  argType: "file",
  handler: ({ args, state, fs }) => {
    const filter = args[0];
    const fileArg = args[1];
    if (!filter || !fileArg) {
      return { ok: false, output: ["jq: usage: jq <filter> <file>"] };
    }
    if (!filter.startsWith(".")) {
      return {
        ok: false,
        output: [
          `jq: unsupported filter "${filter}". This trainer supports ".", ".key", and ".a.b".`,
        ],
      };
    }
    const target = resolvePath(state.cwd, fileArg);
    const content = fs.readFile(target);
    if (content === undefined) {
      return {
        ok: false,
        output: [`jq: no file named "${fileArg}" in ${state.cwd}.`],
        mistake: { kind: "bad_path", input: fileArg, at: Date.now() },
      };
    }
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      return { ok: false, output: [`jq: parse error: ${fileArg} does not contain valid JSON`] };
    }
    // Resolve a dotted path: "." -> whole document, ".a.b" -> data.a.b.
    const keys = filter.slice(1).split(".").filter(Boolean);
    let value: unknown = data;
    for (const key of keys) {
      if (value !== null && typeof value === "object" && key in (value as object)) {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = null;
        break;
      }
    }
    return { ok: true, output: JSON.stringify(value, null, 2).split("\n") };
  },
  lesson: {
    kind: "external-cli",
    environment: ["bash", "zsh"],
    provenance:
      "jq — a standalone command-line JSON processor you install yourself; it is not part of the shell and not preinstalled. Install: `brew install jq` (or `apt install jq`).",
    synopsis: "jq <filter> <file>",
    explanation:
      "jq — a command-line JSON processor; slice, filter, and reshape JSON. You give it a filter expression and it walks the document and prints the result, pretty-printed. The simplest filter is `.`, which echoes the whole document; `.key` digs into a field and `.a.b` follows a path deeper. It's the standard way to pull a single value out of an API response or a `package.json` from the terminal.",
    examples: ["jq . package.json", "jq .name package.json", "jq .scripts.dev package.json"],
    seeAlso: ["cat", "rg"],
  },
};

export const MODERN_TOOL_COMMANDS: CommandSpec[] = [bat, eza, zoxide, jq];
