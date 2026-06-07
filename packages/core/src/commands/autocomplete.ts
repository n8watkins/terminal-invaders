import { resolvePath, splitForCompletion } from "../fs/pathUtils.ts";
import type { VirtualFs } from "../fs/virtualFs.ts";
import type { GameEngine } from "../session/engine.ts";

export type CompletionResult = {
  /** Full replacement line if a single completion was applied. */
  replacement: string;
  /** All candidates (shown on double-Tab when ambiguous). */
  options: string[];
  /** True when `replacement` differs from the input (something was completed). */
  completed: boolean;
};

/** Longest common prefix of a list of strings. */
function commonPrefix(items: string[]): string {
  if (items.length === 0) return "";
  let prefix = items[0]!;
  for (const item of items.slice(1)) {
    while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Context-aware Tab completion.
 *  - At the command position, completes command names.
 *  - At an argument position, completes paths filtered by the command's argType
 *    (cd -> dirs only, cat/open/nvim -> files, ls/tree -> dirs, etc).
 */
export function completeInput(input: string, engine: GameEngine): CompletionResult {
  const trailingSpace = /\s$/.test(input);
  const tokens = input.split(/\s+/).filter((t, i, arr) => t !== "" || i === arr.length - 1);
  const editingNewToken = trailingSpace;
  const tokenIndex = editingNewToken ? tokens.length : tokens.length - 1;
  const current = editingNewToken ? "" : tokens[tokens.length - 1] ?? "";

  // Command position.
  if (tokenIndex === 0) {
    const matches = engine.knownCommandNames().filter((c) => c.startsWith(current));
    return finalize(input, current, matches, false);
  }

  // Argument position — depends on the command.
  const commandName = tokens[0] ?? "";
  const spec = engine.getCommand(commandName);
  const argType = spec?.argType ?? "path";
  if (argType === "none") return { replacement: input, options: [], completed: false };

  const matches = pathCompletions(engine.fs, engine.state.cwd, current, argType);
  return finalize(input, current, matches.replacements, true, matches.appendSlash);
}

function pathCompletions(
  fs: VirtualFs,
  cwd: string,
  token: string,
  argType: "dir" | "file" | "path",
): { replacements: string[]; appendSlash: Set<string> } {
  const { dir, fragment } = splitForCompletion(token);
  const baseDir = resolvePath(cwd, dir || ".");
  const entries = fs.listDir(baseDir);
  const appendSlash = new Set<string>();
  const replacements: string[] = [];

  for (const entry of entries) {
    if (!entry.name.startsWith(fragment)) continue;
    if (argType === "dir" && entry.node.type !== "dir") continue;
    if (argType === "file" && entry.node.type !== "file" && entry.node.type !== "dir") continue;
    const value = dir + entry.name;
    replacements.push(value);
    if (entry.node.type === "dir") appendSlash.add(value);
  }
  return { replacements, appendSlash };
}

function finalize(
  input: string,
  current: string,
  matches: string[],
  isPath: boolean,
  appendSlash: Set<string> = new Set(),
): CompletionResult {
  if (matches.length === 0) return { replacement: input, options: [], completed: false };

  const prefixToReplace = input.slice(0, input.length - current.length);

  if (matches.length === 1) {
    const only = matches[0]!;
    const suffix = isPath && appendSlash.has(only) ? "/" : isPath ? "" : " ";
    return {
      replacement: prefixToReplace + only + suffix,
      options: matches,
      completed: true,
    };
  }

  // Multiple matches: complete to the longest common prefix, surface all options.
  const prefix = commonPrefix(matches);
  const replacement = prefix.length > current.length ? prefixToReplace + prefix : input;
  return {
    replacement,
    options: matches.map((m) => (appendSlash.has(m) ? `${m}/` : m)),
    completed: replacement !== input,
  };
}
