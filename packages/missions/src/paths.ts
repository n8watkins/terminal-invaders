/**
 * Learning paths — the "course" layer over the flat mission campaign.
 *
 * The 50 missions ship as one scrambled array so the campaign can interleave
 * tracks. A `LearningPath` regroups those same missions into selectable, ordered
 * courses. Paths only reference mission *ids* (strings); a helper elsewhere
 * resolves ids to the actual mission objects, so this file stays free of any
 * dependency on the mission definitions themselves.
 */

import type { Environment } from "@terminal-invaders/core";

export type LearningPath = {
  id: string;
  title: string;
  environment: Environment;
  /** One-line pitch shown in the path picker. */
  blurb: string;
  /** What the player will be able to do after finishing. */
  outcomes: string[];
  /** Ordered mission ids that make up this path. */
  missionIds: string[];
  /** Other path ids recommended first (soft prerequisite, for ordering the menu). */
  prerequisites?: string[];
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "bash-navigation",
    title: "Find Your Way (Bash Navigation)",
    environment: "bash",
    blurb: "Learn to move around a project tree from the shell without getting lost.",
    outcomes: [
      "Move through a project tree with pwd/ls/cd without thinking",
      "List, inspect, and reason about directory contents at a glance",
      "Build and follow relative and absolute paths confidently",
    ],
    missionIds: [
      "nav-001",
      "nav-002",
      "nav-003",
      "nav-004",
      "nav-005",
      "nav-006",
      "nav-007",
      "nav-008",
      "nav-009",
      "nav-010",
    ],
  },
  {
    id: "searching",
    title: "Search a Codebase",
    environment: "bash",
    blurb: "Find files and text fast with find, grep, and ripgrep instead of scrolling.",
    outcomes: [
      "Locate files by name and pattern across a whole project",
      "Grep for text and filter results down to what matters",
      "Use ripgrep flags to scope, refine, and speed up searches",
    ],
    missionIds: [
      "search-001",
      "search-002",
      "search-003",
      "search-004",
      "search-005",
      "search-006",
      "search-007",
      "search-008",
      "search-009",
      "search-010",
    ],
    prerequisites: ["bash-navigation"],
  },
  {
    id: "neovim-motions",
    title: "Neovim Motions",
    environment: "nvim",
    blurb: "Edit at the speed of thought with modal motions and operators in Neovim.",
    outcomes: [
      "Navigate buffers with word, line, and search motions",
      "Combine operators and motions to edit text precisely",
      "Stay in normal mode and avoid reaching for the arrow keys",
    ],
    missionIds: [
      "lv-001",
      "lv-002",
      "lv-003",
      "lv-004",
      "lv-005",
      "lv-006",
      "lv-007",
      "lv-008",
      "lv-009",
      "lv-010",
    ],
    prerequisites: ["bash-navigation"],
  },
  {
    id: "git-safety",
    title: "Git Safety",
    environment: "tool:git",
    blurb: "Stage, commit, and recover work in git without fear of losing it.",
    outcomes: [
      "Inspect status and diffs to know exactly what you're committing",
      "Stage, commit, and unstage changes deliberately",
      "Recover from mistakes with reset, restore, and reflog",
    ],
    missionIds: [
      "git-001",
      "git-002",
      "git-003",
      "git-004",
      "git-005",
      "git-006",
      "git-007",
      "git-008",
      "git-009",
      "git-010",
    ],
    prerequisites: ["bash-navigation"],
  },
  {
    id: "workflows",
    title: "Real Dev Workflows",
    environment: "bash",
    blurb: "Tie navigation, search, editing, and git together into real day-to-day tasks.",
    outcomes: [
      "Chain shell, search, editor, and git skills into one fluid workflow",
      "Investigate, change, and verify code the way a working dev does",
      "Move through a realistic task without context-switching friction",
    ],
    missionIds: [
      "hero-copy-001",
      "workflow-002",
      "workflow-003",
      "workflow-004",
      "workflow-005",
      "workflow-006",
      "workflow-007",
      "workflow-008",
      "workflow-009",
      "workflow-010",
    ],
    prerequisites: ["searching", "neovim-motions", "git-safety"],
  },
];

export function getPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}

/** The path that contains a given mission id, if any. */
export function pathForMission(missionId: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.missionIds.includes(missionId));
}
