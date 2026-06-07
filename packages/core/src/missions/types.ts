/**
 * Mission + filesystem + objective schema.
 * These types are the contract shared by the engine, the CLI, and (later) the web app.
 */

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
  | { id: string; label: string; type: "command_used"; command: string };

export type Mission = {
  id: string;
  title: string;
  difficulty: Difficulty;
  track: MissionTrack;
  briefing: string;
  startingCwd: string;
  filesystem: Record<string, FsNode>;
  objectives: Objective[];
  /** Optional whitelist. Empty/undefined = all known commands allowed. */
  allowedCommands?: string[];
  hints: Hint[];
  successMessage: string;
};
