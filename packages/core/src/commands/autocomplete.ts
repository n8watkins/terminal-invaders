import { resolvePath, splitForCompletion } from "../fs/pathUtils.ts";
import type { GameEngine } from "../session/engine.ts";

export type CompletionResult = {
  /** Full replacement line if a single completion was applied. */
  replacement: string;
  /** All candidates (shown on double-Tab when ambiguous). */
  options: string[];
  /** True when `replacement` differs from the input (something was completed). */
  completed: boolean;
};

/**
 * Raw, presentation-agnostic completion candidates for the current input.
 * This is the single source of truth — `completeInput` (web/headless) and the
 * CLI's readline completer both build on it, so they can't drift apart.
 */
export type CompletionCandidates = {
  /** The token currently being completed (may be ""). */
  current: string;
  /** True when completing at the command position rather than an argument. */
  atCommand: boolean;
  /** Candidate replacements for `current` (command names or `dir + name` paths). */
  candidates: string[];
  /** Subset of `candidates` that are directories (UIs may append a trailing "/"). */
  dirs: Set<string>;
};

export function completionCandidates(input: string, engine: GameEngine): CompletionCandidates {
  const trailingSpace = /\s$/.test(input);
  const tokens = input.split(/\s+/).filter((t, i, arr) => t !== "" || i === arr.length - 1);
  const editingNewToken = trailingSpace;
  const tokenIndex = editingNewToken ? tokens.length : tokens.length - 1;
  const current = editingNewToken ? "" : tokens[tokens.length - 1] ?? "";

  // Command position.
  if (tokenIndex === 0) {
    const candidates = engine.knownCommandNames().filter((c) => c.startsWith(current));
    return { current, atCommand: true, candidates, dirs: new Set() };
  }

  // Argument position — filtered by the command's argType (cd -> dirs only;
  // cat/open/nvim/ls/tree -> dirs + files so you can descend then pick).
  const spec = engine.getCommand(tokens[0] ?? "");
  const argType = spec?.argType ?? "path";
  if (argType === "none") return { current, atCommand: false, candidates: [], dirs: new Set() };

  const { dir, fragment } = splitForCompletion(current);
  const baseDir = resolvePath(engine.state.cwd, dir || ".");
  const candidates: string[] = [];
  const dirs = new Set<string>();
  for (const entry of engine.fs.listDir(baseDir)) {
    if (!entry.name.startsWith(fragment)) continue;
    if (argType === "dir" && entry.node.type !== "dir") continue;
    const value = dir + entry.name;
    candidates.push(value);
    if (entry.node.type === "dir") dirs.add(value);
  }
  return { current, atCommand: false, candidates, dirs };
}

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
 * Context-aware Tab completion for the web/headless front-ends: turns the shared
 * `completionCandidates` into an applied replacement + the option list shown on
 * an ambiguous Tab.
 */
export function completeInput(input: string, engine: GameEngine): CompletionResult {
  const { current, atCommand, candidates, dirs } = completionCandidates(input, engine);
  return finalize(input, current, candidates, /* isPath */ !atCommand, dirs);
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
