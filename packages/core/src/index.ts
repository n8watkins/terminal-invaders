// Public surface of the shared engine. Both the CLI and the web app build on this.

export * from "./lessons/types.ts";
export {
  ALL_LESSONS,
  conceptsForMission,
  explainableNames,
  formatLessonCard,
  lessonFor,
} from "./lessons/registry.ts";
export { CORE_COMMAND_LESSONS } from "./commands/lessons.ts";
export { EDITOR_LESSONS } from "./editor/lessons.ts";
export { GIT_LESSONS } from "./git/lessons.ts";
export { MODERN_TOOL_COMMANDS } from "./commands/modernTools.ts";
export { POWERSHELL_COMMANDS } from "./commands/powershell.ts";
export { FZF_COMMANDS } from "./commands/fzf.ts";
export * from "./missions/types.ts";
export * from "./missions/validator.ts";
export * from "./fs/pathUtils.ts";
export { VirtualFs } from "./fs/virtualFs.ts";
export type { SearchMatch, DirEntry } from "./fs/virtualFs.ts";
export { parseCommand } from "./commands/parser.ts";
export type { ParsedCommand } from "./commands/parser.ts";
export type { CommandResult, CommandSpec, CommandContext, CommandHandler } from "./commands/types.ts";
export { CORE_COMMANDS, commandsForMission } from "./commands/registry.ts";
export { completeInput, completionCandidates } from "./commands/autocomplete.ts";
export type { CompletionResult, CompletionCandidates } from "./commands/autocomplete.ts";
export { GameEngine } from "./session/engine.ts";
export type { ExecuteResult, GameEngineOptions } from "./session/engine.ts";
export { PathSession } from "./session/journey.ts";
export type { Journey, JourneyStep, JourneySnapshot, WorldMutation } from "./session/journey.ts";
export { EditorModel } from "./editor/editor.ts";
export { GitModel } from "./git/git.ts";
export type { GitStatus, GitCommit, GitSnapshot } from "./git/git.ts";
export { createInitialState } from "./session/state.ts";
export type { SessionState } from "./session/state.ts";
export type { GameEvent, Mistake, MistakeKind } from "./session/events.ts";
export * from "./scoring/scoring.ts";
