/**
 * Scoring rewards the behavior we want: completing objectives, searching,
 * using autocomplete, keeping a clean run. It is intentionally simple and
 * incremental — the engine calls these as events happen.
 */
export const POINTS = {
  objective: 100,
  comboStep: 25, // bonus per consecutive objective without a mistake in between
  searchBonus: 20,
  autocompleteBonus: 10,
  mistakePenalty: 25,
  hintPenalty: 50,
  timeBonusCap: 200,
} as const;

/** Points for completing an objective, scaled by the current combo. */
export function objectivePoints(combo: number): number {
  return POINTS.objective + Math.max(0, combo - 1) * POINTS.comboStep;
}

/** Diminishing time bonus: full marks under `parSeconds`, zero past 3x par. */
export function timeBonus(elapsedMs: number, parSeconds: number): number {
  const elapsed = elapsedMs / 1000;
  if (elapsed <= parSeconds) return POINTS.timeBonusCap;
  const ratio = 1 - (elapsed - parSeconds) / (parSeconds * 2);
  return Math.max(0, Math.round(POINTS.timeBonusCap * ratio));
}

export type SkillDimension =
  | "navigation"
  | "search"
  | "editing"
  | "recovery"
  | "git"
  | "speed"
  | "precision";
