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
  completedObjectives: string[];
  score: number;
  combo: number;
  hintsUsed: number;
  mistakes: Mistake[];
  usedAutocomplete: boolean;
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
    completedObjectives: [],
    score: 0,
    combo: 0,
    hintsUsed: 0,
    mistakes: [],
    usedAutocomplete: false,
    startedAt: Date.now(),
    endedAt: undefined,
    complete: false,
  };
}
