import type { SearchMatch } from "../fs/virtualFs.ts";
import type { Mission } from "../missions/types.ts";
import type { Mistake } from "./events.ts";

export type SessionState = {
  cwd: string;
  activeFile?: string;
  editorOpen: boolean;
  commandHistory: string[];
  historyIndex: number;
  /** Distinct command names the player has run (for `command_used` objectives). */
  commandsUsed: string[];
  /** Absolute paths the player has opened via `open`/`nvim`/`cat`. */
  openedFiles: string[];
  /** Every search performed, with its results. */
  searches: { query: string; matches: SearchMatch[] }[];
  /** Whether a simulated nvim editor is currently open. */
  editorOpenPath?: string;
  /** Normalized editor verbs used this run (e.g. ":w", "i", ":%s"). */
  editorCommandsUsed: string[];
  /** Patterns searched inside the editor this run. */
  editorSearches: string[];
  /** Git subcommands run this run (e.g. "status", "diff", "commit"). */
  gitSubcommands: string[];
  /** Number of commits made this run. */
  gitCommits: number;
  /** Paths with staged changes (index differs from HEAD). Mirrored from the git model. */
  gitStagedPaths: string[];
  /** Paths with unstaged/untracked changes. Mirrored from the git model. */
  gitModifiedPaths: string[];
  completedObjectives: string[];
  score: number;
  combo: number;
  hintsUsed: number;
  mistakes: Mistake[];
  usedAutocomplete: boolean;
  /** Number of times `check` has been run (for repeated-premature-check detection). */
  checksRun: number;
  /** Set to Date.now() on the first real command, so think time before play doesn't burn the time bonus. */
  startedAt: number;
  endedAt?: number;
  complete: boolean;
};

export function createInitialState(mission: Mission): SessionState {
  return {
    cwd: mission.startingCwd,
    activeFile: undefined,
    editorOpen: false,
    commandHistory: [],
    historyIndex: 0,
    commandsUsed: [],
    openedFiles: [],
    searches: [],
    editorOpenPath: undefined,
    editorCommandsUsed: [],
    editorSearches: [],
    gitSubcommands: [],
    gitCommits: 0,
    gitStagedPaths: [],
    gitModifiedPaths: [],
    completedObjectives: [],
    score: 0,
    combo: 0,
    hintsUsed: 0,
    mistakes: [],
    usedAutocomplete: false,
    checksRun: 0,
    startedAt: Date.now(),
    endedAt: undefined,
    complete: false,
  };
}
