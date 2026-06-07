import type { GameEvent } from "@terminal-invaders/core";

export type LineKind = "input" | "output" | "good" | "bad" | "score" | "system";
export type OutputLine = { id: number; kind: LineKind; text: string };

let counter = 0;
export function line(kind: LineKind, text: string): OutputLine {
  return { id: counter++, kind, text };
}

/** Turn engine events into arcade feedback lines for the terminal log. */
export function eventLines(events: GameEvent[]): OutputLine[] {
  const out: OutputLine[] = [];
  for (const e of events) {
    switch (e.type) {
      case "objective_complete":
        out.push(line("good", `✓ ${e.label}`));
        break;
      case "score":
        out.push(line("score", `${e.amount > 0 ? "+" : ""}${e.amount}  ${e.reason}`));
        break;
      case "mission_complete":
        out.push(line("good", "★ MISSION COMPLETE ★"));
        break;
      default:
        break;
    }
  }
  return out;
}
