// Typed localStorage layer for per-mission progress.
//
// Records which missions the player has completed and the best score reached for
// each. Persists across reloads. All access is defensive: a missing, malformed,
// or unavailable localStorage (private mode, SSR, quota) degrades to an empty,
// no-op store rather than throwing.

const STORAGE_KEY = "terminal-invaders:progress:v1";

/** Per-mission record. `bestScore` is the highest score seen on completion. */
export type MissionProgress = {
  completed: boolean;
  bestScore: number;
};

/** Map of mission id → progress record. */
export type ProgressMap = Record<string, MissionProgress>;

function isMissionProgress(value: unknown): value is MissionProgress {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as MissionProgress).completed === "boolean" &&
    typeof (value as MissionProgress).bestScore === "number"
  );
}

function safeStorage(): Storage | null {
  try {
    // Touch the API to surface "localStorage is undefined / blocked" early.
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

/** Read the full progress map. Never throws; returns `{}` on any problem. */
export function loadProgress(): ProgressMap {
  const store = safeStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: ProgressMap = {};
    for (const [id, rec] of Object.entries(parsed as Record<string, unknown>)) {
      if (isMissionProgress(rec)) out[id] = rec;
    }
    return out;
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota / serialization failures are non-fatal: progress is a nicety.
  }
}

/**
 * Mark a mission complete, keeping the best (highest) score seen. Returns the
 * updated map so callers can refresh UI state without a re-read.
 */
export function recordCompletion(
  prev: ProgressMap,
  missionId: string,
  score: number,
): ProgressMap {
  const existing = prev[missionId];
  const bestScore = Math.max(existing?.bestScore ?? 0, score);
  // Skip the write if nothing changed (already complete and no new high score).
  if (existing?.completed && existing.bestScore >= bestScore) return prev;
  const next: ProgressMap = {
    ...prev,
    [missionId]: { completed: true, bestScore },
  };
  saveProgress(next);
  return next;
}
