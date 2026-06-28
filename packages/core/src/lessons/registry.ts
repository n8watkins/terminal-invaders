/**
 * Lesson registry — one place to resolve "what IS this command" for any name the
 * trainer knows: shell commands, git subcommands, editor verbs, and the new tool
 * domains (modern CLI tools, PowerShell, fzf). The engine's `explain` command and
 * the front-ends' "new this mission" panels both build on this, so they can't
 * drift from each other.
 */
import { CORE_COMMAND_LESSONS } from "../commands/lessons.ts";
import { FZF_COMMANDS } from "../commands/fzf.ts";
import { MODERN_TOOL_COMMANDS } from "../commands/modernTools.ts";
import { POWERSHELL_COMMANDS } from "../commands/powershell.ts";
import { EDITOR_LESSONS } from "../editor/lessons.ts";
import { GIT_LESSONS } from "../git/lessons.ts";
import type { Mission } from "../missions/types.ts";
import type { Lesson } from "./types.ts";

// Pull the inline lessons off the tool command sets into a flat name->Lesson map.
const TOOL_LESSONS: Record<string, Lesson> = {};
for (const spec of [...MODERN_TOOL_COMMANDS, ...POWERSHELL_COMMANDS, ...FZF_COMMANDS]) {
  if (spec.lesson) TOOL_LESSONS[spec.name] = spec.lesson;
}

/**
 * Every lesson, keyed by command/verb/subcommand name. A few names appear in more
 * than one world (PowerShell aliases `ls`/`cd`/`pwd`/`cat` to its cmdlets), so the
 * spread order makes the bash CORE lesson win for shared names — that's the right
 * default for a context-free lookup like bare `explain`. For a per-environment
 * answer, the engine prefers the *active* command's own lesson first (a PowerShell
 * mission's `ls` shows the cmdlet alias card), falling back here.
 */
export const ALL_LESSONS: Record<string, Lesson> = {
  ...TOOL_LESSONS,
  ...EDITOR_LESSONS,
  ...GIT_LESSONS,
  ...CORE_COMMAND_LESSONS,
};

/** Resolve the teaching card for a name, or undefined if we don't teach it. */
export function lessonFor(name: string): Lesson | undefined {
  return ALL_LESSONS[name];
}

/** Names we can `explain`, sorted — used to help a player who runs bare `explain`. */
export function explainableNames(): string[] {
  return Object.keys(ALL_LESSONS).sort();
}

/**
 * The commands/verbs a mission introduces, for the "new this mission" panel.
 * Honors an explicit `mission.concepts` list; otherwise derives the set from the
 * mission's objectives (the commands it actually asks you to use), keeping only
 * names we have a lesson for and dropping the `check` game-verb as noise.
 */
export function conceptsForMission(mission: Mission): string[] {
  if (mission.concepts && mission.concepts.length > 0) return mission.concepts;
  const names: string[] = [];
  const add = (n: string) => {
    if (n !== "check" && lessonFor(n) && !names.includes(n)) names.push(n);
  };
  // A search objective introduces the environment's search tool (you grep with
  // `rg` in bash, `Select-String` in PowerShell) even though the objective names
  // the query, not the command.
  const searchTool = mission.environment === "powershell" ? "Select-String" : "rg";
  for (const o of mission.objectives) {
    if (o.type === "command_used") add(o.command);
    else if (o.type === "editor_command_used") add(o.command);
    else if (o.type === "git_subcommand_used") add(o.sub);
    else if (o.type === "search_performed") add(searchTool);
  }
  return names;
}

/**
 * Render a lesson as plain lines for `explain <name>`. Plain text (no color) so
 * the same card works in the terminal, the browser, and tests.
 */
export function formatLessonCard(name: string, lesson: Lesson): string[] {
  const lines: string[] = [];
  lines.push(`── explain: ${name} ──`);
  lines.push(`  kind:        ${lesson.kind}`);
  lines.push(`  environment: ${lesson.environment.join(", ")}`);
  lines.push(`  where:       ${lesson.provenance}`);
  lines.push(`  usage:       ${lesson.synopsis}`);
  lines.push("");
  lines.push(lesson.explanation);
  if (lesson.examples.length > 0) {
    lines.push("");
    lines.push("  examples:");
    for (const ex of lesson.examples) lines.push(`    ${ex}`);
  }
  if (lesson.seeAlso && lesson.seeAlso.length > 0) {
    lines.push("");
    lines.push(`  see also: ${lesson.seeAlso.join(", ")}   (try: explain ${lesson.seeAlso[0]})`);
  }
  return lines;
}
