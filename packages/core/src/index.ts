// Public surface of the shared engine. Both the CLI and the web app build on this.

export * from "./missions/types.ts";
export * from "./missions/validator.ts";
export * from "./fs/pathUtils.ts";
export { VirtualFs } from "./fs/virtualFs.ts";
export type { SearchMatch, DirEntry } from "./fs/virtualFs.ts";
export { parseCommand } from "./commands/parser.ts";
export type { ParsedCommand } from "./commands/parser.ts";
export type { CommandResult, CommandSpec, CommandContext, CommandHandler } from "./commands/types.ts";
export { CORE_COMMANDS } from "./commands/registry.ts";
export { completeInput } from "./commands/autocomplete.ts";
export type { CompletionResult } from "./commands/autocomplete.ts";
export { GameEngine } from "./session/engine.ts";
export type { ExecuteResult } from "./session/engine.ts";
export { createInitialState } from "./session/state.ts";
export type { SessionState } from "./session/state.ts";
export type { GameEvent, Mistake, MistakeKind } from "./session/events.ts";
export * from "./scoring/scoring.ts";
