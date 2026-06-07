import type { SearchMatch } from "../fs/virtualFs.ts";

/**
 * Events are the bridge between the command engine and any UI.
 * The engine never touches animations directly — it emits events and the
 * CLI / web layer decides how to react (ship moves, lane flashes, etc).
 */
export type GameEvent =
  | { type: "move"; from: string; to: string }
  | { type: "open_file"; path: string }
  | { type: "search"; query: string; matches: SearchMatch[] }
  | { type: "objective_complete"; objectiveId: string; label: string }
  | { type: "score"; amount: number; reason: string }
  | { type: "error"; message: string }
  | { type: "mission_complete" };

export type MistakeKind =
  | "unknown_command"
  | "bad_path"
  | "premature_check"
  | "command_not_allowed";

export type Mistake = {
  kind: MistakeKind;
  input: string;
  at: number;
};
