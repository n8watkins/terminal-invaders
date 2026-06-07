import type { Mission } from "@terminal-invaders/core";
import { inspectRoot } from "./navigation/inspectRoot.ts";
import { relativePaths } from "./navigation/relativePaths.ts";
import { findTodo } from "./search/findTodo.ts";
import { openLookLeave } from "./lazyvim/openLookLeave.ts";
import { saveYourWork } from "./lazyvim/saveYourWork.ts";
import { replaceCopy } from "./lazyvim/replaceCopy.ts";
import { whatChanged } from "./git/whatChanged.ts";
import { stageAndCommit } from "./git/stageAndCommit.ts";
import { undoTheMistake } from "./git/undoTheMistake.ts";
import { heroCopy } from "./workflow/heroCopy.ts";

/** Ordered campaign — roughly increasing difficulty, mixing tracks. */
export const MISSIONS: Mission[] = [
  inspectRoot,
  relativePaths,
  findTodo,
  openLookLeave,
  saveYourWork,
  whatChanged,
  stageAndCommit,
  replaceCopy,
  undoTheMistake,
  heroCopy,
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export {
  inspectRoot,
  relativePaths,
  findTodo,
  openLookLeave,
  saveYourWork,
  replaceCopy,
  whatChanged,
  stageAndCommit,
  undoTheMistake,
  heroCopy,
};
