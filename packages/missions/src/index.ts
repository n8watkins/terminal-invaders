import type { Journey, Mission } from "@terminal-invaders/core";
import { LEARNING_PATHS, getPath, pathForMission, type LearningPath } from "./paths.ts";
import { gitSafetyJourney } from "./journeys/gitSafety.ts";

// --- navigation ---
import { inspectRoot } from "./navigation/inspectRoot.ts";
import { lookAround } from "./navigation/lookAround.ts";
import { stepInside } from "./navigation/stepInside.ts";
import { readTheTree } from "./navigation/readTheTree.ts";
import { relativePaths } from "./navigation/relativePaths.ts";
import { homeAndBack } from "./navigation/homeAndBack.ts";
import { deepChain } from "./navigation/deepChain.ts";
import { sidewaysAndDown } from "./navigation/sidewaysAndDown.ts";
import { findByConvention } from "./navigation/findByConvention.ts";
import { surveyTheCodebase } from "./navigation/surveyTheCodebase.ts";

// --- search ---
import { firstGrep } from "./search/firstGrep.ts";
import { searchThenOpen } from "./search/searchThenOpen.ts";
import { theRightMatch } from "./search/theRightMatch.ts";
import { findTheDefinition } from "./search/findTheDefinition.ts";
import { findTodo } from "./search/findTodo.ts";
import { filterTheNoise } from "./search/filterTheNoise.ts";
import { exactSymbol } from "./search/exactSymbol.ts";
import { triageHits } from "./search/triageHits.ts";
import { searchOpenRead } from "./search/searchOpenRead.ts";
import { trackDownTheBug } from "./search/trackDownTheBug.ts";

// --- lazyvim ---
import { openLookLeave } from "./lazyvim/openLookLeave.ts";
import { saveYourWork } from "./lazyvim/saveYourWork.ts";
import { insertALine } from "./lazyvim/insertALine.ts";
import { appendAtTheEnd } from "./lazyvim/appendAtTheEnd.ts";
import { searchInFile } from "./lazyvim/searchInFile.ts";
import { deleteALine } from "./lazyvim/deleteALine.ts";
import { openBelow } from "./lazyvim/openBelow.ts";
import { oneShotSubstitute } from "./lazyvim/oneShotSubstitute.ts";
import { refactorPass } from "./lazyvim/refactorPass.ts";
import { replaceCopy } from "./lazyvim/replaceCopy.ts";

// --- git ---
import { whatChanged } from "./git/whatChanged.ts";
import { stageTheChange } from "./git/stageTheChange.ts";
import { commitIt } from "./git/commitIt.ts";
import { inspectTheHistory } from "./git/inspectTheHistory.ts";
import { stageAndCommit } from "./git/stageAndCommit.ts";
import { discardWorkingChanges } from "./git/discardWorkingChanges.ts";
import { inspectBeforeYouCommit } from "./git/inspectBeforeYouCommit.ts";
import { restoreJustOne } from "./git/restoreJustOne.ts";
import { undoTheMistake } from "./git/undoTheMistake.ts";
import { cleanSlate } from "./git/cleanSlate.ts";

// --- workflow ---
import { heroCopy } from "./workflow/heroCopy.ts";
import { readTheConfig } from "./workflow/readTheConfig.ts";
import { locateAndOpen } from "./workflow/locateAndOpen.ts";
import { changeTheCta } from "./workflow/changeTheCta.ts";
import { fixTheTypo } from "./workflow/fixTheTypo.ts";
import { addAnExport } from "./workflow/addAnExport.ts";
import { fixABrokenImport } from "./workflow/fixABrokenImport.ts";
import { editAndCommit } from "./workflow/editAndCommit.ts";
import { searchFixVerify } from "./workflow/searchFixVerify.ts";
import { shipATinyFeature } from "./workflow/shipATinyFeature.ts";

/**
 * Ordered campaign — roughly increasing difficulty, interleaving tracks.
 * Tier 1 (warm-up) first, then tier 2 (core skills), then tier 3 (bosses).
 * Within each tier we rotate navigation → search → lazyvim → git → workflow
 * so no single track dominates a stretch of the run.
 */
export const MISSIONS: Mission[] = [
  // ---- Tier 1: difficulty 1 (12) ----
  inspectRoot, // nav-001
  firstGrep, // search-001
  openLookLeave, // lv-001
  whatChanged, // git-001
  readTheConfig, // workflow-002
  lookAround, // nav-002
  searchThenOpen, // search-002
  insertALine, // lv-003
  stageTheChange, // git-002
  heroCopy, // hero-copy-001
  stepInside, // nav-003
  inspectTheHistory, // git-004

  // ---- Tier 2: difficulty 2 (20) ----
  readTheTree, // nav-004
  theRightMatch, // search-003
  saveYourWork, // lv-002
  commitIt, // git-003
  locateAndOpen, // workflow-003
  relativePaths, // nav-005
  findTheDefinition, // search-004
  appendAtTheEnd, // lv-004
  stageAndCommit, // git-005
  changeTheCta, // workflow-004
  homeAndBack, // nav-006
  findTodo, // search-005
  searchInFile, // lv-005
  discardWorkingChanges, // git-006
  fixTheTypo, // workflow-005
  filterTheNoise, // search-006
  deleteALine, // lv-006
  inspectBeforeYouCommit, // git-007
  addAnExport, // workflow-006
  openBelow, // lv-007

  // ---- Tier 3: difficulty 3 / bosses (18) ----
  deepChain, // nav-007
  exactSymbol, // search-007
  oneShotSubstitute, // lv-008
  restoreJustOne, // git-008
  fixABrokenImport, // workflow-007
  sidewaysAndDown, // nav-008
  triageHits, // search-008
  refactorPass, // lv-009
  undoTheMistake, // git-009
  editAndCommit, // workflow-008
  findByConvention, // nav-009
  searchOpenRead, // search-009
  replaceCopy, // lv-010
  cleanSlate, // git-010
  searchFixVerify, // workflow-009
  surveyTheCodebase, // nav-010
  trackDownTheBug, // search-010
  shipATinyFeature, // workflow-010
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

// ── Learning paths (the selectable "course" layer over the flat campaign) ──
export { LEARNING_PATHS, getPath, pathForMission };
export type { LearningPath };

/** Resolve a path's ordered mission ids to the actual mission objects. */
export function missionsForPath(pathId: string): Mission[] {
  const path = getPath(pathId);
  if (!path) return [];
  return path.missionIds
    .map((id) => getMission(id))
    .filter((m): m is Mission => m !== undefined);
}

// ── Journeys (shared-world storylines; one evolving project across steps) ──
export const JOURNEYS: Journey[] = [gitSafetyJourney];

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}

/** The next mission within the same path, or undefined at the path's end. */
export function nextInPath(missionId: string): Mission | undefined {
  const path = pathForMission(missionId);
  if (!path) return undefined;
  const idx = path.missionIds.indexOf(missionId);
  if (idx < 0 || idx + 1 >= path.missionIds.length) return undefined;
  return getMission(path.missionIds[idx + 1]!);
}

export {
  // navigation
  inspectRoot,
  lookAround,
  stepInside,
  readTheTree,
  relativePaths,
  homeAndBack,
  deepChain,
  sidewaysAndDown,
  findByConvention,
  surveyTheCodebase,
  // search
  firstGrep,
  searchThenOpen,
  theRightMatch,
  findTheDefinition,
  findTodo,
  filterTheNoise,
  exactSymbol,
  triageHits,
  searchOpenRead,
  trackDownTheBug,
  // lazyvim
  openLookLeave,
  saveYourWork,
  insertALine,
  appendAtTheEnd,
  searchInFile,
  deleteALine,
  openBelow,
  oneShotSubstitute,
  refactorPass,
  replaceCopy,
  // git
  whatChanged,
  stageTheChange,
  commitIt,
  inspectTheHistory,
  stageAndCommit,
  discardWorkingChanges,
  inspectBeforeYouCommit,
  restoreJustOne,
  undoTheMistake,
  cleanSlate,
  // workflow
  heroCopy,
  readTheConfig,
  locateAndOpen,
  changeTheCta,
  fixTheTypo,
  addAnExport,
  fixABrokenImport,
  editAndCommit,
  searchFixVerify,
  shipATinyFeature,
};
