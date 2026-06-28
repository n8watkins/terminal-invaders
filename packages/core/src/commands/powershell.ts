import { basename, resolvePath } from "../fs/pathUtils.ts";
import type { Lesson } from "../lessons/types.ts";
import type { CommandHandler, CommandSpec } from "./types.ts";

/**
 * PowerShell command set — "PowerShell for bash users".
 *
 * Every cmdlet here is a thin wrapper over the SAME VirtualFs the bash commands
 * use, so the *behavior* is identical — only the vocabulary changes. The whole
 * point is muscle-memory transfer: if you already know `pwd`, `cd`, `ls`, `cat`,
 * `grep`, and `echo`, these cards show you the PowerShell name for the exact same
 * operation. Each canonical cmdlet is registered alongside its common alias as a
 * separate `CommandSpec` that shares the same handler, mirroring how PowerShell
 * itself exposes both `Get-ChildItem` and `gci`.
 */

/** Shared provenance line: what a PowerShell cmdlet *is* and where it comes from. */
const PWSH_PROVENANCE =
  "A PowerShell cmdlet — built into PowerShell itself, Microsoft's cross-platform " +
  "shell. There is nothing extra to install beyond PowerShell: it ships with Windows " +
  "as `powershell`/`pwsh`, and on macOS/Linux you install PowerShell and run it as " +
  "`pwsh` (`brew install --cask powershell`, `apt install powershell`, or " +
  "`winget install Microsoft.PowerShell`). Cmdlets follow a `Verb-Noun` naming scheme " +
  "(Get-, Set-, Select-, Write-), and most have short aliases for everyday typing.";

function dedupe(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

/** A short lesson for an alias that simply points back to its canonical cmdlet. */
function aliasLesson(alias: string, canonical: string, bashName: string): Lesson {
  return {
    kind: "powershell-cmdlet",
    environment: ["powershell"],
    provenance: PWSH_PROVENANCE,
    synopsis: `${alias} (alias of ${canonical})`,
    explanation:
      `\`${alias}\` is PowerShell's built-in alias for \`${canonical}\` — they are the ` +
      `exact same cmdlet, so everything on the \`${canonical}\` card applies. If you come ` +
      `from bash, this is the \`${bashName}\` you already know, just spelled the PowerShell way.`,
    examples: [alias, `${alias}   # same as ${canonical}`],
    seeAlso: [canonical, bashName],
  };
}

// ---------------------------------------------------------------------------
// Handlers (one per operation, shared between the cmdlet and its alias spec).
// ---------------------------------------------------------------------------

/** Get-Location / gl — PowerShell's `pwd`. */
const getLocation: CommandHandler = ({ state }) => ({ ok: true, output: [state.cwd] });

/** Set-Location / sl / cd — PowerShell's `cd`. */
const setLocation: CommandHandler = ({ args, state, fs }) => {
  const raw = args[0] ?? "/project";
  const target = resolvePath(state.cwd, raw);
  if (!fs.exists(target)) {
    const here = fs.listDir(state.cwd).filter((e) => e.node.type === "dir");
    const hint = here.length
      ? ` Available here: ${here.map((e) => e.name).join(", ")}.`
      : "";
    return {
      ok: false,
      output: [`Set-Location: cannot find path "${raw}" in ${state.cwd}.${hint}`],
      mistake: { kind: "bad_path", input: raw, at: Date.now() },
    };
  }
  if (!fs.isDir(target)) {
    return {
      ok: false,
      output: [`Set-Location: "${raw}" is a file, not a directory. Use Get-Content to read it.`],
      mistake: { kind: "bad_path", input: raw, at: Date.now() },
    };
  }
  return {
    ok: true,
    output: [],
    statePatch: { cwd: target },
    events: [{ type: "move", from: state.cwd, to: target }],
  };
};

/** Get-ChildItem / gci — PowerShell's `ls`/`dir`. */
const getChildItem: CommandHandler = ({ args, state, fs }) => {
  const target = args[0] ? resolvePath(state.cwd, args[0]) : state.cwd;
  if (!fs.exists(target)) {
    return {
      ok: false,
      output: [`Get-ChildItem: cannot find path "${args[0] ?? target}".`],
      mistake: { kind: "bad_path", input: args[0] ?? target, at: Date.now() },
    };
  }
  if (fs.isFile(target)) {
    return { ok: true, output: ["Mode   Name", "----   ----", `-a---  ${basename(target)}`] };
  }
  const entries = fs.listDir(target);
  if (entries.length === 0) return { ok: true, output: ["(empty)"] };
  const rows = entries.map((e) => {
    const mode = e.node.type === "dir" ? "d----" : "-a---";
    const name = e.node.type === "dir" ? `${e.name}/` : e.name;
    return `${mode}  ${name}`;
  });
  return { ok: true, output: ["Mode   Name", "----   ----", ...rows] };
};

/** Get-Content / gc — PowerShell's `cat`. */
const getContent: CommandHandler = ({ args, state, fs }) => {
  if (!args[0]) return { ok: false, output: ["Get-Content: missing -Path operand"] };
  const target = resolvePath(state.cwd, args[0]);
  const content = fs.readFile(target);
  if (content === undefined) {
    return {
      ok: false,
      output: [`Get-Content: cannot find file "${args[0]}" in ${state.cwd}.`],
      mistake: { kind: "bad_path", input: args[0], at: Date.now() },
    };
  }
  return {
    ok: true,
    output: content.split("\n"),
    statePatch: { openedFiles: dedupe(state.openedFiles, target), activeFile: target },
    events: [{ type: "open_file", path: target }],
  };
};

/** Select-String / sls — PowerShell's `grep`/`rg`. */
const selectString: CommandHandler = ({ args, state, fs }) => {
  const query = args[0];
  if (!query) {
    return { ok: false, output: ['Select-String: missing -Pattern. Try: Select-String "text"'] };
  }
  const matches = fs.search(query);
  const searches = [...state.searches, { query, matches }];
  if (matches.length === 0) {
    return {
      ok: true,
      output: [`Select-String: no matches for "${query}".`],
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
};

/** Write-Output / echo — PowerShell's `echo`. */
const writeOutput: CommandHandler = ({ args }) => ({ ok: true, output: [args.join(" ")] });

// ---------------------------------------------------------------------------
// Command specs: canonical cmdlet + alias, sharing each handler.
// ---------------------------------------------------------------------------

export const POWERSHELL_COMMANDS: CommandSpec[] = [
  {
    name: "Get-Location",
    summary: "Print the current directory (PowerShell pwd)",
    argType: "none",
    handler: getLocation,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Get-Location",
      explanation:
        "Get-Location is PowerShell's `pwd`: it prints the absolute path of the directory " +
        "you're currently in. PowerShell tracks a current location just like bash tracks a " +
        "current working directory, and this cmdlet asks it where you are. The everyday " +
        "alias is `gl` (and `pwd` is itself a built-in alias in PowerShell).",
      examples: ["Get-Location", "gl", "Get-Location   # e.g. /project"],
      seeAlso: ["pwd", "Set-Location", "Get-ChildItem"],
    },
  },
  {
    name: "gl",
    summary: "Alias of Get-Location (PowerShell pwd)",
    argType: "none",
    handler: getLocation,
    lesson: aliasLesson("gl", "Get-Location", "pwd"),
  },
  {
    name: "Set-Location",
    summary: "Change directory (PowerShell cd)",
    argType: "dir",
    handler: setLocation,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Set-Location [-Path] <dir>",
      explanation:
        "Set-Location is PowerShell's `cd`: it moves you into a different directory so later " +
        "cmdlets operate there. It resolves the path the same way bash `cd` does — relative " +
        "names, `..` to go up, absolute paths — and the target must exist and be a directory. " +
        "The common aliases are `sl` and `cd` (PowerShell ships `cd` as an alias of this cmdlet).",
      examples: ["Set-Location src", "sl ..", "cd /project", "Set-Location -Path src/app"],
      seeAlso: ["cd", "Get-Location", "Get-ChildItem"],
    },
  },
  {
    name: "sl",
    summary: "Alias of Set-Location (PowerShell cd)",
    argType: "dir",
    handler: setLocation,
    lesson: aliasLesson("sl", "Set-Location", "cd"),
  },
  {
    name: "Get-ChildItem",
    summary: "List directory contents (PowerShell ls/dir)",
    argType: "dir",
    handler: getChildItem,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Get-ChildItem [-Path] [dir]",
      explanation:
        "Get-ChildItem is PowerShell's `ls` (and `dir`): it lists the files and folders inside " +
        "a directory — by default the one you're in. PowerShell prints a `Mode`/`Name` style " +
        "listing where a leading `d` marks directories. Reach for it to see what's around you " +
        "before you `Set-Location` into something or `Get-Content` a file. Aliases: `gci`, `dir`, `ls`.",
      examples: ["Get-ChildItem", "gci", "Get-ChildItem src", "Get-ChildItem -Path src/commands"],
      seeAlso: ["ls", "Set-Location", "Get-Content", "tree"],
    },
  },
  {
    name: "gci",
    summary: "Alias of Get-ChildItem (PowerShell ls/dir)",
    argType: "dir",
    handler: getChildItem,
    lesson: aliasLesson("gci", "Get-ChildItem", "ls"),
  },
  {
    name: "Get-Content",
    summary: "Print file contents (PowerShell cat)",
    argType: "file",
    handler: getContent,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Get-Content [-Path] <file>",
      explanation:
        "Get-Content is PowerShell's `cat`: it reads a file and prints its contents to the " +
        "terminal, line by line. It's the quickest way to glance at a small text file without " +
        "opening an editor. In PowerShell it actually emits each line as a separate object, but " +
        "for reading text it behaves just like `cat`. The everyday alias is `gc`.",
      examples: ["Get-Content README.md", "gc package.json", "Get-Content -Path notes.txt"],
      seeAlso: ["cat", "Get-ChildItem", "Select-String"],
    },
  },
  {
    name: "gc",
    summary: "Alias of Get-Content (PowerShell cat)",
    argType: "file",
    handler: getContent,
    lesson: aliasLesson("gc", "Get-Content", "cat"),
  },
  {
    name: "Select-String",
    summary: "Search file contents (PowerShell grep/rg)",
    argType: "none",
    handler: selectString,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Select-String [-Pattern] <text> [-Path <glob>]",
      explanation:
        "Select-String is PowerShell's `grep` (and the modern `rg`): it searches the text of " +
        "files for a pattern and prints every matching line with its file name and line number. " +
        "Reach for it to answer \"where in this project is X?\". It accepts plain text or regular " +
        "expressions, just like grep. The everyday alias is `sls`.",
      examples: [
        'Select-String "TODO"',
        'sls "function" -Path src',
        'Select-String -Pattern Lesson',
      ],
      seeAlso: ["rg", "Get-Content", "Get-ChildItem"],
    },
  },
  {
    name: "sls",
    summary: "Alias of Select-String (PowerShell grep/rg)",
    argType: "none",
    handler: selectString,
    lesson: aliasLesson("sls", "Select-String", "grep"),
  },
  {
    name: "Write-Output",
    summary: "Print arguments to output (PowerShell echo)",
    argType: "none",
    handler: writeOutput,
    lesson: {
      kind: "powershell-cmdlet",
      environment: ["powershell"],
      provenance: PWSH_PROVENANCE,
      synopsis: "Write-Output <text...>",
      explanation:
        "Write-Output is PowerShell's `echo`: it sends its arguments to the output, which lands " +
        "on your screen at the end of a pipeline. Use it to print a message or to push values " +
        "down a pipeline to the next cmdlet. PowerShell ships `echo` as a built-in alias of this " +
        "cmdlet, so `echo hello` and `Write-Output hello` do the same thing.",
      examples: ["Write-Output hello", "echo hello world", 'Write-Output "Build complete"'],
      seeAlso: ["echo", "Get-Content"],
    },
  },
  {
    name: "echo",
    summary: "Alias of Write-Output (PowerShell echo)",
    argType: "none",
    handler: writeOutput,
    lesson: aliasLesson("echo", "Write-Output", "echo"),
  },
];
