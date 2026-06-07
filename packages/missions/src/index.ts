import type { Mission } from "@terminal-invaders/core";
import { inspectRoot } from "./navigation/inspectRoot.ts";
import { relativePaths } from "./navigation/relativePaths.ts";
import { findTodo } from "./search/findTodo.ts";
import { heroCopy } from "./workflow/heroCopy.ts";

/** Ordered campaign — roughly increasing difficulty across tracks. */
export const MISSIONS: Mission[] = [inspectRoot, relativePaths, findTodo, heroCopy];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export { inspectRoot, relativePaths, findTodo, heroCopy };
