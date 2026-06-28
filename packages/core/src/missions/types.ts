/**
 * Mission + filesystem + objective schema.
 * These types are the contract shared by the engine, the CLI, and (later) the web app.
 */

import type { Environment } from "../lessons/types.ts";

export type FsNodeType = "file" | "dir";

/**
 * A single node in a mission's virtual filesystem.
 * Nodes are stored in a flat map keyed by absolute path (e.g. "/project/src/app/page.tsx").
 * Parent/child relationships are derived from the paths, so mission authors only
 * have to list nodes — no manual `children` arrays to keep in sync.
 */
export type FsNode = {
  type: FsNodeType;
  content?: string;
  metadata?: {
    hidden?: boolean;
    editable?: boolean;
    target?: boolean;
    tags?: string[];
  };
};

export type MissionTrack =
  | "navigation"
  | "search"
  | "edit"
  | "lazyvim"
  | "git"
  | "workflow";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Optional command toolkits a mission/journey layers on top of its base shell. */
export type ToolKit = "modern" | "fzf";

export type Hint = {
  /** Penalty-free hints can be marked free; most cost points when revealed. */
  text: string;
};

/**
 * An objective is one checkable condition. A mission is complete when every
 * objective evaluates true (and the player runs `check`).
 */
export type Objective =
  | { id: string; label: string; type: "cwd_is"; path: string }
  | { id: string; label: string; type: "file_opened"; path: string }
  | {
      id: string;
      label: string;
      type: "search_performed";
      query: string;
      expectedPath?: string;
    }
  | { id: string; label: string; type: "file_contains"; path: string; text: string }
  | { id: string; label: string; type: "file_lacks"; path: string; text: string }
  | { id: string; label: string; type: "command_used"; command: string }
  // Editor (LazyVim track)
  | { id: string; label: string; type: "editor_command_used"; command: string }
  | { id: string; label: string; type: "editor_search"; pattern: string }
  // Git (Git-safety track)
  | { id: string; label: string; type: "git_subcommand_used"; sub: string }
  | { id: string; label: string; type: "git_staged"; path: string }
  | { id: string; label: string; type: "git_clean"; path: string }
  | { id: string; label: string; type: "git_committed" };

export type Mission = {
  id: string;
  title: string;
  difficulty: Difficulty;
  track: MissionTrack;
  briefing: string;
  /**
   * Which shell/tool world this mission is played in. Drives which command set
   * the engine offers (bash vs PowerShell vs a tool track) and how commands are
   * explained. Defaults to "bash" when omitted, so the original missions are
   * unaffected.
   */
  environment?: Environment;
  /**
   * Command toolkits to make available on top of the base shell (e.g. the modern
   * CLI tools, or fzf). The base set itself is chosen by `environment`
   * (PowerShell vs bash); these add optional tracks.
   */
  tools?: ToolKit[];
  /**
   * Names of commands/verbs this mission is the first to introduce. The front-ends
   * render a compact "new this mission" panel from these (each player can then run
   * `explain <name>` for the full lesson card). Purely presentational — objectives
   * still drive completion.
   */
  concepts?: string[];
  startingCwd: string;
  filesystem: Record<string, FsNode>;
  /**
   * Optional git track config. `head` is the committed snapshot (path -> content)
   * at the start of the run. If a working-tree file's content differs from its
   * head entry, the run begins with uncommitted changes (handy for "fix it" and
   * "recover" missions).
   */
  git?: { head: Record<string, string> };
  objectives: Objective[];
  /** Optional whitelist. Empty/undefined = all known commands allowed. */
  allowedCommands?: string[];
  hints: Hint[];
  successMessage: string;
};
