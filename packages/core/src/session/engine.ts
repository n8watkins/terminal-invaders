import { VirtualFs } from "../fs/virtualFs.ts";
import { parseCommand } from "../commands/parser.ts";
import { CORE_COMMANDS } from "../commands/registry.ts";
import type { CommandResult, CommandSpec } from "../commands/types.ts";
import type { Mission } from "../missions/types.ts";
import { isObjectiveComplete } from "../missions/validator.ts";
import { objectivePoints, POINTS, timeBonus } from "../scoring/scoring.ts";
import type { GameEvent } from "./events.ts";
import { createInitialState, type SessionState } from "./state.ts";

export type ExecuteResult = {
  output: string[];
  events: GameEvent[];
};

const PAR_SECONDS = 90;

/**
 * GameEngine owns one mission run: the virtual filesystem, the session state,
 * and the command registry. UIs call `execute(input)` and react to the returned
 * output + events. `complete(input)` powers Tab autocomplete.
 */
export class GameEngine {
  readonly mission: Mission;
  readonly fs: VirtualFs;
  state: SessionState;
  private commands: Map<string, CommandSpec>;

  constructor(mission: Mission, extraCommands: CommandSpec[] = []) {
    this.mission = mission;
    this.fs = new VirtualFs(mission.filesystem);
    this.state = createInitialState(mission);
    this.commands = new Map();
    for (const spec of [...CORE_COMMANDS, ...extraCommands]) {
      if (this.isAllowed(spec.name)) this.commands.set(spec.name, spec);
    }
  }

  private isAllowed(name: string): boolean {
    const allow = this.mission.allowedCommands;
    return !allow || allow.length === 0 || allow.includes(name);
  }

  knownCommandNames(): string[] {
    return [...this.commands.keys(), "check", "help", "hint", "clear", "reset"].sort();
  }

  getCommand(name: string): CommandSpec | undefined {
    return this.commands.get(name);
  }

  execute(input: string): ExecuteResult {
    const parsed = parseCommand(input);
    if (parsed.name === "") return { output: [], events: [] };

    this.state.commandHistory.push(input);
    this.state.historyIndex = this.state.commandHistory.length;

    // Meta commands handled by the engine itself.
    switch (parsed.name) {
      case "check":
        this.markCommandUsed("check");
        return this.runCheck();
      case "help":
        return { output: this.helpText(), events: [] };
      case "hint":
        return this.runHint();
      case "clear":
        return { output: ["\x1b[CLEAR\x1b["], events: [] };
      case "reset":
        this.reset();
        return { output: ["Mission reset."], events: [] };
    }

    const spec = this.commands.get(parsed.name);
    if (!spec) {
      this.recordMistake({ kind: "unknown_command", input, at: Date.now() });
      return {
        output: [
          `Unknown command: ${parsed.name}. Type \`help\` to see what you can use.`,
        ],
        events: [{ type: "error", message: `unknown command: ${parsed.name}` }],
      };
    }

    const result = spec.handler({
      args: parsed.args,
      raw: parsed.raw,
      state: this.state,
      fs: this.fs,
      mission: this.mission,
    });

    this.markCommandUsed(parsed.name);
    const events = this.applyResult(result);
    return { output: result.output, events };
  }

  /** Apply a command result to state, award scoring, and detect newly completed objectives. */
  private applyResult(result: CommandResult): GameEvent[] {
    const events: GameEvent[] = [...(result.events ?? [])];

    if (result.statePatch) Object.assign(this.state, result.statePatch);

    if (result.mistake) {
      this.recordMistake(result.mistake);
      this.state.combo = 0;
    }

    // Reward first-time searches (a behavior we want to build).
    if (result.events?.some((e) => e.type === "search")) {
      this.award(POINTS.searchBonus, "search", events);
    }

    this.detectObjectiveCompletions(events);
    return events;
  }

  private detectObjectiveCompletions(events: GameEvent[]): void {
    for (const objective of this.mission.objectives) {
      if (this.state.completedObjectives.includes(objective.id)) continue;
      if (isObjectiveComplete(objective, this.state, this.fs)) {
        this.state.completedObjectives.push(objective.id);
        this.state.combo += 1;
        const pts = objectivePoints(this.state.combo);
        this.state.score += pts;
        events.push({ type: "objective_complete", objectiveId: objective.id, label: objective.label });
        events.push({ type: "score", amount: pts, reason: `objective: ${objective.label}` });
      }
    }
  }

  private runCheck(): ExecuteResult {
    const events: GameEvent[] = [];
    this.detectObjectiveCompletions(events);

    // Objectives latch: transient conditions (like `cwd_is`) count once passed,
    // so completion is judged against what's been satisfied so far, not the live state.
    const missing = this.mission.objectives.filter(
      (o) => !this.state.completedObjectives.includes(o.id),
    );
    if (missing.length > 0) {
      // Repeated premature checks are a (small) mistake.
      if (this.state.commandsUsed.filter((c) => c === "check").length > 1) {
        this.recordMistake({ kind: "premature_check", input: "check", at: Date.now() });
      }
      return {
        output: [
          "Not yet. Missing:",
          ...missing.map((o) => `  - ${o.label}`),
        ],
        events,
      };
    }

    if (!this.state.complete) {
      this.state.complete = true;
      this.state.endedAt = Date.now();
      const bonus = timeBonus(this.state.endedAt - this.state.startedAt, PAR_SECONDS);
      this.award(bonus, "time bonus", events);
      events.push({ type: "mission_complete" });
    }

    return {
      output: [
        this.mission.successMessage,
        `Score: ${this.state.score}`,
      ],
      events,
    };
  }

  private runHint(): ExecuteResult {
    const idx = this.state.hintsUsed;
    const hint = this.mission.hints[idx];
    if (!hint) return { output: ["No more hints. You've got this."], events: [] };
    this.state.hintsUsed += 1;
    this.state.score = Math.max(0, this.state.score - POINTS.hintPenalty);
    this.state.combo = 0;
    return {
      output: [`Hint ${idx + 1}: ${hint.text}`, `(-${POINTS.hintPenalty} pts)`],
      events: [{ type: "score", amount: -POINTS.hintPenalty, reason: "hint" }],
    };
  }

  private award(amount: number, reason: string, events: GameEvent[]): void {
    if (amount === 0) return;
    this.state.score += amount;
    events.push({ type: "score", amount, reason });
  }

  private markCommandUsed(name: string): void {
    if (!this.state.commandsUsed.includes(name)) this.state.commandsUsed.push(name);
  }

  private recordMistake(mistake: { kind: any; input: string; at: number }): void {
    this.state.mistakes.push(mistake);
    this.state.score = Math.max(0, this.state.score - POINTS.mistakePenalty);
  }

  noteAutocompleteUsed(): void {
    if (!this.state.usedAutocomplete) {
      this.state.usedAutocomplete = true;
      this.state.score += POINTS.autocompleteBonus;
    }
  }

  reset(): void {
    this.state = createInitialState(this.mission);
    // Rebuild the filesystem so edits are undone.
    (this as { fs: VirtualFs }).fs = new VirtualFs(this.mission.filesystem);
  }

  objectiveChecklist(): { id: string; label: string; complete: boolean }[] {
    return this.mission.objectives.map((o) => ({
      id: o.id,
      label: o.label,
      complete: this.state.completedObjectives.includes(o.id) || isObjectiveComplete(o, this.state, this.fs),
    }));
  }

  private helpText(): string[] {
    const lines = ["Commands:"];
    for (const spec of this.commands.values()) {
      lines.push(`  ${spec.name.padEnd(8)} ${spec.summary}`);
    }
    lines.push("  check    Validate the mission");
    lines.push("  hint     Reveal a hint (costs points)");
    lines.push("  clear    Clear the screen");
    lines.push("  reset    Restart the mission");
    return lines;
  }
}
