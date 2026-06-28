import { VirtualFs } from "../fs/virtualFs.ts";
import { parseCommand } from "../commands/parser.ts";
import { CORE_COMMANDS } from "../commands/registry.ts";
import type { CommandResult, CommandSpec } from "../commands/types.ts";
import { EditorModel } from "../editor/editor.ts";
import { GitModel } from "../git/git.ts";
import { resolvePath } from "../fs/pathUtils.ts";
import { explainableNames, formatLessonCard, lessonFor } from "../lessons/registry.ts";
import type { CommandKind } from "../lessons/types.ts";
import type { Mission } from "../missions/types.ts";
import { isObjectiveComplete } from "../missions/validator.ts";
import { objectivePoints, POINTS, timeBonus } from "../scoring/scoring.ts";
import type { GameEvent, Mistake } from "./events.ts";
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
  /** Rebuilt on `reset()`, so not readonly. UIs should always read it through the engine. */
  fs: VirtualFs;
  state: SessionState;
  private commands: Map<string, CommandSpec>;
  private editor?: EditorModel;
  private git?: GitModel;

  constructor(mission: Mission, extraCommands: CommandSpec[] = []) {
    this.mission = mission;
    this.fs = new VirtualFs(mission.filesystem);
    this.state = createInitialState(mission);
    this.commands = new Map();
    for (const spec of [...CORE_COMMANDS, ...extraCommands]) {
      if (this.isAllowed(spec.name)) this.commands.set(spec.name, spec);
    }
    if (mission.git) {
      this.git = new GitModel(mission.git.head);
      this.syncGitMirrors();
    }
  }

  /** Are we currently inside the simulated editor? (UIs use this to switch the prompt.) */
  get editorOpen(): boolean {
    return this.editor !== undefined;
  }

  editorStatusLine(): string | undefined {
    return this.editor?.statusLine();
  }

  private isAllowed(name: string): boolean {
    const allow = this.mission.allowedCommands;
    return !allow || allow.length === 0 || allow.includes(name);
  }

  knownCommandNames(): string[] {
    return [...this.commands.keys(), "check", "help", "explain", "hint", "clear", "reset"].sort();
  }

  getCommand(name: string): CommandSpec | undefined {
    return this.commands.get(name);
  }

  execute(input: string): ExecuteResult {
    // While the editor is open, every line is editor input (including ":q").
    if (this.editor) {
      this.state.commandHistory.push(input);
      return this.runEditor(input);
    }

    const parsed = parseCommand(input);
    if (parsed.name === "") return { output: [], events: [] };

    // Start the clock on the first real command, not at construction time, so a
    // player reading the briefing doesn't lose the time bonus before they act.
    if (this.state.commandHistory.length === 0) this.state.startedAt = Date.now();

    this.state.commandHistory.push(input);
    this.state.historyIndex = this.state.commandHistory.length;

    // Engine-hosted commands that need state beyond the registry. nvim is marked
    // used inside openEditor, only when the file actually opens.
    if (parsed.name === "nvim" && this.isAllowed("nvim")) {
      return this.openEditor(parsed.args[0]);
    }
    if (parsed.name === "git" && this.isAllowed("git")) {
      this.markCommandUsed("git");
      return this.runGit(parsed.args);
    }

    // Meta commands handled by the engine itself.
    switch (parsed.name) {
      case "check":
        this.markCommandUsed("check");
        return this.runCheck();
      case "help":
        return { output: this.helpText(), events: [] };
      case "explain":
        return { output: this.explainText(parsed.args[0]), events: [] };
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

    // Only a successful command counts toward command_used objectives.
    if (result.ok) this.markCommandUsed(parsed.name);
    const events = this.applyResult(result);
    return { output: result.output, events };
  }

  /** Apply a command result to state, award scoring, and detect newly completed objectives. */
  private applyResult(result: CommandResult): GameEvent[] {
    const events: GameEvent[] = [...(result.events ?? [])];

    if (result.statePatch) Object.assign(this.state, result.statePatch);

    if (result.mistake) this.recordMistake(result.mistake);

    // Reward the FIRST time each distinct query is searched AND actually finds
    // something, so repeating the same `rg` (or searching for nothing) can't farm
    // the bonus. state.searches already includes this search (statePatch applied
    // above), so a brand-new query appears exactly once.
    for (const e of result.events ?? []) {
      if (e.type !== "search" || e.matches.length === 0) continue;
      // Count only prior MATCHING searches of this query, so an earlier empty
      // search (before the file had the text) doesn't suppress the bonus on the
      // genuine first hit — while repeats of a matching query still can't farm it.
      const firstMatchForQuery =
        this.state.searches.filter((s) => s.query === e.query && s.matches.length > 0).length === 1;
      if (firstMatchForQuery) this.award(POINTS.searchBonus, "search", events);
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
    this.state.checksRun += 1;
    this.detectObjectiveCompletions(events);

    // Objectives latch: transient conditions (like `cwd_is`) count once passed,
    // so completion is judged against what's been satisfied so far, not the live state.
    const missing = this.mission.objectives.filter(
      (o) => !this.state.completedObjectives.includes(o.id),
    );
    if (missing.length > 0) {
      // Repeated premature checks are a (small) mistake. The first exploratory
      // check is free; spamming check while still incomplete is penalized.
      if (this.state.checksRun > 1) {
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

  // ── Editor (LazyVim track) ───────────────────────────────────────────────

  private openEditor(rawPath?: string): ExecuteResult {
    if (!rawPath) return { output: ["nvim: open what? Try: nvim <file>"], events: [] };
    const path = resolvePath(this.state.cwd, rawPath);
    if (!this.fs.isFile(path)) {
      const near = this.fs.allPaths().find((p) => p.endsWith(`/${rawPath}`));
      this.recordMistake({ kind: "bad_path", input: rawPath, at: Date.now() });
      return {
        output: [`nvim: cannot find "${rawPath}".`, ...(near ? [`Did you mean: nvim ${near}`] : [])],
        events: [{ type: "error", message: `nvim: ${rawPath}` }],
      };
    }
    // The file opened — now it counts as an nvim invocation.
    this.markCommandUsed("nvim");
    this.editor = new EditorModel(path, this.fs.readFile(path) ?? "");
    this.state.editorOpenPath = path;
    this.state.activeFile = path;
    if (!this.state.openedFiles.includes(path)) this.state.openedFiles.push(path);

    const events: GameEvent[] = [{ type: "open_file", path }];
    this.detectObjectiveCompletions(events);
    return {
      output: [
        `── nvim ── ${this.editor.statusLine()} ──`,
        ...this.editor.lines.map((l, i) => `${String(i + 1).padStart(3)} ${l}`),
        "(normal mode — `i` insert, `/text` search, `:%s/old/new/g` replace, `:wq` save+quit)",
      ],
      events,
    };
  }

  private runEditor(input: string): ExecuteResult {
    if (!this.editor) return { output: [], events: [] };
    const step = this.editor.handle(input);

    if (step.recordCommand && !this.state.editorCommandsUsed.includes(step.recordCommand)) {
      this.state.editorCommandsUsed.push(step.recordCommand);
    }
    if (step.recordSearch) this.state.editorSearches.push(step.recordSearch);
    if (step.write) {
      this.fs.writeFile(this.editor.path, this.editor.content());
      // A write happened — satisfy ":w" objectives whether the player used :w or :wq.
      if (!this.state.editorCommandsUsed.includes(":w")) this.state.editorCommandsUsed.push(":w");
      this.syncGitMirrors();
    }

    const events: GameEvent[] = [];
    if (step.close) {
      this.editor = undefined;
      this.state.editorOpenPath = undefined;
    }
    this.detectObjectiveCompletions(events);
    return { output: step.output, events };
  }

  // ── Git (Git-safety track) ───────────────────────────────────────────────

  private syncGitMirrors(): void {
    if (!this.git) return;
    this.state.gitStagedPaths = this.git.stagedPaths();
    this.state.gitModifiedPaths = this.git.modifiedPaths(this.fs);
    this.state.gitCommits = this.git.commits.length;
  }

  private runGit(args: string[]): ExecuteResult {
    if (!this.git) {
      return { output: ["fatal: not a git repository"], events: [] };
    }
    const sub = args[0] ?? "";
    if (sub && !this.state.gitSubcommands.includes(sub)) this.state.gitSubcommands.push(sub);
    const rest = args.slice(1);
    const output = this.dispatchGit(sub, rest);
    this.syncGitMirrors();
    const events: GameEvent[] = [];
    this.detectObjectiveCompletions(events);
    return { output, events };
  }

  private dispatchGit(sub: string, rest: string[]): string[] {
    const git = this.git!;
    const resolveArg = (a: string) => resolvePath(this.state.cwd, a);
    switch (sub) {
      case "status": {
        const s = git.status(this.fs);
        const lines: string[] = ["On branch main"];
        if (s.staged.length) {
          lines.push("Changes to be committed:");
          lines.push(...s.staged.map((c) => `  ${c.kind}:   ${c.path}`));
        }
        if (s.modified.length) {
          lines.push("Changes not staged for commit:");
          lines.push(...s.modified.map((c) => `  ${c.kind}:   ${c.path}`));
        }
        if (s.untracked.length) {
          lines.push("Untracked files:");
          lines.push(...s.untracked.map((p) => `  ${p}`));
        }
        if (lines.length === 1) lines.push("nothing to commit, working tree clean");
        return lines;
      }
      case "diff":
        return git.diff(this.fs, rest.includes("--staged") || rest.includes("--cached"));
      case "add": {
        if (!rest.length) return ["Nothing specified. Try: git add <file>"];
        return rest.map((a) => git.add(this.fs, resolveArg(a)).message).filter(Boolean);
      }
      case "restore": {
        const staged = rest.includes("--staged");
        const paths = rest.filter((a) => !a.startsWith("--"));
        if (!paths.length) return ["restore: specify a file. Try: git restore <file>"];
        return paths.map((a) => git.restore(this.fs, resolveArg(a), staged).message);
      }
      case "commit": {
        const mIdx = rest.indexOf("-m");
        const message = mIdx >= 0 ? rest.slice(mIdx + 1).join(" ") : "update";
        return [git.commit(message).message];
      }
      case "log":
        return git.log();
      default:
        return [`git: '${sub}' is not supported yet. Try: status, diff, add, restore, commit, log`];
    }
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

  private recordMistake(mistake: Mistake): void {
    this.state.mistakes.push(mistake);
    this.state.score = Math.max(0, this.state.score - POINTS.mistakePenalty);
    // Any mistake breaks the combo — wherever it's recorded from (registry result,
    // unknown command, bad nvim path, premature check).
    this.state.combo = 0;
  }

  noteAutocompleteUsed(): void {
    if (!this.state.usedAutocomplete) {
      this.state.usedAutocomplete = true;
      this.state.score += POINTS.autocompleteBonus;
    }
  }

  reset(): void {
    this.state = createInitialState(this.mission);
    this.editor = undefined;
    // Rebuild the filesystem so edits are undone.
    this.fs = new VirtualFs(this.mission.filesystem);
    this.git = this.mission.git ? new GitModel(this.mission.git.head) : undefined;
    this.syncGitMirrors();
  }

  objectiveChecklist(): { id: string; label: string; complete: boolean }[] {
    return this.mission.objectives.map((o) => ({
      id: o.id,
      label: o.label,
      complete: this.state.completedObjectives.includes(o.id) || isObjectiveComplete(o, this.state, this.fs),
    }));
  }

  /**
   * Help, grouped by what KIND of thing each command is — the distinction players
   * were missing ("is `rg` a shell builtin or a tool I install?"). Commands carry
   * a lesson with a `kind`; we bucket by it and label each bucket.
   */
  private helpText(): string[] {
    const KIND_ORDER: { kind: CommandKind; header: string }[] = [
      { kind: "shell-builtin", header: "Shell builtins (part of the shell itself)" },
      { kind: "coreutil", header: "Core utilities (classic Unix programs)" },
      { kind: "external-cli", header: "External tools (installed separately)" },
      { kind: "powershell-cmdlet", header: "PowerShell cmdlets" },
      { kind: "git-subcommand", header: "Git subcommands" },
      { kind: "editor-command", header: "Editor commands" },
    ];
    const lines: string[] = [];
    const seen = new Set<string>();
    for (const { kind, header } of KIND_ORDER) {
      const specs = [...this.commands.values()].filter((s) => s.lesson?.kind === kind);
      if (specs.length === 0) continue;
      lines.push(header + ":");
      for (const spec of specs) {
        lines.push(`  ${spec.name.padEnd(14)} ${spec.summary}`);
        seen.add(spec.name);
      }
    }
    // Any command without a lesson kind still gets listed so help is complete.
    const rest = [...this.commands.values()].filter((s) => !seen.has(s.name));
    if (rest.length > 0) {
      lines.push("Other:");
      for (const spec of rest) lines.push(`  ${spec.name.padEnd(14)} ${spec.summary}`);
    }
    lines.push("Game commands:");
    lines.push(`  ${"check".padEnd(14)} Validate the mission`);
    lines.push(`  ${"explain <cmd>".padEnd(14)} What a command IS, where it comes from, examples`);
    lines.push(`  ${"hint".padEnd(14)} Reveal a hint (costs points)`);
    lines.push(`  ${"clear".padEnd(14)} Clear the screen`);
    lines.push(`  ${"reset".padEnd(14)} Restart the mission`);
    lines.push("");
    lines.push("Not sure what something is? Run `explain <command>` — e.g. `explain rg`.");
    return lines;
  }

  /** `explain <name>` — surface the full teaching card for any command/verb/subcommand. */
  private explainText(name?: string): string[] {
    if (!name) {
      return [
        "explain <name> — learn what a command is, where it comes from, and how to use it.",
        "",
        `You can explain: ${explainableNames().join(", ")}`,
        "",
        "e.g. `explain rg`, `explain checkout`, `explain :wq`",
      ];
    }
    const lesson = lessonFor(name);
    if (!lesson) {
      return [
        `No lesson for "${name}" yet.`,
        "Run `help` to see available commands, or `explain` for the full list.",
      ];
    }
    return formatLessonCard(name, lesson);
  }
}
