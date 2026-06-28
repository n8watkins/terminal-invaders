// Disk-backed journey saves for the CLI. Journeys carry a shared world across
// steps, so a save is the serialized world + which step you're on. Stored under
// ~/.terminal-invaders/saves/<journeyId>.json. All access is defensive: any I/O
// or parse failure degrades to "no save" rather than throwing.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { JourneySnapshot } from "@terminal-invaders/core";

const SAVES_DIR = join(homedir(), ".terminal-invaders", "saves");

function fileFor(journeyId: string): string {
  return join(SAVES_DIR, `${journeyId}.json`);
}

export function loadJourneySave(journeyId: string): JourneySnapshot | undefined {
  try {
    const file = fileFor(journeyId);
    if (!existsSync(file)) return undefined;
    const data = JSON.parse(readFileSync(file, "utf8")) as JourneySnapshot;
    if (data && data.journeyId === journeyId && data.version === 1) return data;
  } catch {
    // corrupt/unreadable save → treat as no save
  }
  return undefined;
}

export function saveJourney(journeyId: string, snapshot: JourneySnapshot): void {
  try {
    mkdirSync(SAVES_DIR, { recursive: true });
    writeFileSync(fileFor(journeyId), JSON.stringify(snapshot));
  } catch {
    // saving is a nicety; never fail the game over it
  }
}

export function clearJourneySave(journeyId: string): void {
  try {
    rmSync(fileFor(journeyId), { force: true });
  } catch {
    // ignore
  }
}
