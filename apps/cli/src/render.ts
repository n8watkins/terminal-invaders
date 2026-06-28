import { conceptsForMission, type GameEngine, type GameEvent, type Mission } from "@terminal-invaders/core";
import { c } from "./colors.ts";

export function banner(mission: Mission): string {
  const bar = c.cyan("─".repeat(52));
  const concepts = conceptsForMission(mission);
  const conceptLine =
    concepts.length > 0
      ? `${c.dim("new here:")} ${concepts.map((n) => c.yellow(n)).join(c.dim(" · "))}   ${c.dim("← run `explain <name>` to learn each")}`
      : "";
  return [
    bar,
    `${c.bold(c.magenta("TERMINAL INVADERS"))}  ${c.dim("·")}  ${c.bold(mission.title)}`,
    `${c.dim("track:")} ${mission.track}   ${c.dim("difficulty:")} ${"★".repeat(mission.difficulty)}`,
    bar,
    "",
    mission.briefing,
    ...(conceptLine ? ["", conceptLine] : []),
    "",
    c.dim('Type `help` for commands, `explain <cmd>` to learn one, `check` when done.'),
    "",
  ].join("\n");
}

export function checklist(engine: GameEngine): string {
  const lines = engine.objectiveChecklist().map((o) => {
    const box = o.complete ? c.green("✓") : c.gray("□");
    const label = o.complete ? c.dim(o.label) : o.label;
    return `  ${box} ${label}`;
  });
  return [c.bold("Objectives"), ...lines].join("\n");
}

/** Translate engine events into player-facing arcade feedback. */
export function renderEvents(events: GameEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    switch (e.type) {
      case "objective_complete":
        out.push(c.green(`  ✓ ${e.label}`));
        break;
      case "score":
        if (e.amount > 0) out.push(c.yellow(`  +${e.amount} ${c.dim(e.reason)}`));
        else out.push(c.red(`  ${e.amount} ${c.dim(e.reason)}`));
        break;
      case "mission_complete":
        out.push("");
        out.push(c.green(c.bold("  ★ MISSION COMPLETE ★")));
        break;
      default:
        break;
    }
  }
  return out;
}

export function prompt(cwd: string): string {
  return `${c.blue(cwd)} ${c.green("$")} `;
}

/** A short "replay breakdown" shown after completing a mission. */
export function replayBreakdown(engine: GameEngine): string {
  const counts = new Map<string, number>();
  for (const line of engine.state.commandHistory) {
    const name = line.trim().split(/\s+/)[0] ?? "";
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const used = [...counts.entries()].map(([k, v]) => `${k} x${v}`).join("  ");
  const seconds = engine.state.endedAt
    ? Math.round((engine.state.endedAt - engine.state.startedAt) / 1000)
    : 0;
  return [
    "",
    c.bold("Replay"),
    `  ${c.dim("commands:")} ${used}`,
    `  ${c.dim("time:")} ${seconds}s   ${c.dim("mistakes:")} ${engine.state.mistakes.length}   ${c.dim("hints:")} ${engine.state.hintsUsed}`,
    `  ${c.dim("score:")} ${c.bold(String(engine.state.score))}`,
  ].join("\n");
}
