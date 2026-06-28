// localStorage-backed journey saves for the web app. A journey carries a shared
// world across steps, so a save is the serialized world + step index. Mirrors the
// CLI's disk saves. All access is defensive: any failure degrades to "no save".
import type { JourneySnapshot } from "@terminal-invaders/core";

const keyFor = (journeyId: string) => `terminal-invaders:journey:${journeyId}`;

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadJourneySave(journeyId: string): JourneySnapshot | undefined {
  const store = safeStorage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(keyFor(journeyId));
    if (!raw) return undefined;
    const data = JSON.parse(raw) as JourneySnapshot;
    if (data && data.journeyId === journeyId && data.version === 1) return data;
  } catch {
    // corrupt/unreadable → no save
  }
  return undefined;
}

export function saveJourneySave(journeyId: string, snapshot: JourneySnapshot): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(keyFor(journeyId), JSON.stringify(snapshot));
  } catch {
    // quota/serialization failures are non-fatal
  }
}

export function clearJourneySave(journeyId: string): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(keyFor(journeyId));
  } catch {
    // ignore
  }
}

export function hasJourneySave(journeyId: string): boolean {
  return loadJourneySave(journeyId) !== undefined;
}
