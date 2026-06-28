import type { VirtualFs } from "../fs/virtualFs.ts";
import type { Lesson } from "../lessons/types.ts";
import type { Mission } from "../missions/types.ts";
import type { GameEvent, Mistake } from "../session/events.ts";
import type { SessionState } from "../session/state.ts";

export type CommandContext = {
  args: string[];
  raw: string;
  state: Readonly<SessionState>;
  fs: VirtualFs;
  mission: Mission;
};

export type CommandResult = {
  ok: boolean;
  output: string[];
  /** Shallow patch merged into session state by the engine. */
  statePatch?: Partial<SessionState>;
  events?: GameEvent[];
  mistake?: Mistake;
};

export type CommandHandler = (ctx: CommandContext) => CommandResult;

export type CommandSpec = {
  name: string;
  summary: string;
  /** "command" completes nothing; "dir"/"file"/"path" drive arg autocomplete. */
  argType: "none" | "dir" | "file" | "path";
  handler: CommandHandler;
  /** The "what IS this" teaching card, surfaced by `explain` and `help`. */
  lesson?: Lesson;
};
