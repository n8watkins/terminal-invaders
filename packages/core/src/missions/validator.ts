import type { VirtualFs } from "../fs/virtualFs.ts";
import type { SessionState } from "../session/state.ts";
import type { Mission, Objective } from "./types.ts";

export type ObjectiveStatus = { objective: Objective; complete: boolean };

/** Evaluate a single objective against the current run state. */
export function isObjectiveComplete(
  objective: Objective,
  state: SessionState,
  fs: VirtualFs,
): boolean {
  switch (objective.type) {
    case "cwd_is":
      return state.cwd === objective.path;
    case "file_opened":
      return state.openedFiles.includes(objective.path);
    case "command_used":
      return state.commandsUsed.includes(objective.command);
    case "file_contains": {
      const content = fs.readFile(objective.path);
      return content !== undefined && content.includes(objective.text);
    }
    case "file_lacks": {
      const content = fs.readFile(objective.path);
      return content !== undefined && !content.includes(objective.text);
    }
    case "editor_command_used":
      return state.editorCommandsUsed.includes(objective.command);
    case "editor_search": {
      const needle = objective.pattern.toLowerCase();
      return state.editorSearches.some((p) => p.toLowerCase().includes(needle));
    }
    case "git_subcommand_used":
      return state.gitSubcommands.includes(objective.sub);
    case "git_staged":
      return state.gitStagedPaths.includes(objective.path);
    case "git_clean":
      return (
        !state.gitStagedPaths.includes(objective.path) &&
        !state.gitModifiedPaths.includes(objective.path)
      );
    case "git_committed":
      // A NEW commit beyond what was already present at step start. In a single
      // mission the baseline is 0; in a journey it carries the prior steps' count,
      // so "make a commit" can't be satisfied by a commit from an earlier step.
      return state.gitCommits > state.gitCommitsBaseline;
    case "search_performed": {
      const needle = objective.query.toLowerCase();
      return state.searches.some((s) => {
        if (!s.query.toLowerCase().includes(needle)) return false;
        // A search that found nothing isn't a meaningful "search performed".
        if (s.matches.length === 0) return false;
        if (!objective.expectedPath) return true;
        return s.matches.some((m) => m.path === objective.expectedPath);
      });
    }
  }
}

export function evaluateObjectives(
  mission: Mission,
  state: SessionState,
  fs: VirtualFs,
): ObjectiveStatus[] {
  return mission.objectives.map((objective) => ({
    objective,
    complete: isObjectiveComplete(objective, state, fs),
  }));
}

export function missingObjectives(
  mission: Mission,
  state: SessionState,
  fs: VirtualFs,
): Objective[] {
  return evaluateObjectives(mission, state, fs)
    .filter((s) => !s.complete)
    .map((s) => s.objective);
}

/**
 * Sandbox observability boundary.
 *
 * Real-sandbox mode (`pnpm play sandbox`) lets the player drive their own shell,
 * nvim, and git, so the engine never sees their keystrokes — it can only score
 * from what ends up on disk + in git. This function defines that boundary: it
 * returns true ONLY for the 5 disk-observable objective kinds the sandbox watcher
 * auto-checks:
 *
 *   - file_contains   (read the file back, look for the text)
 *   - file_lacks      (read the file back, confirm the text is gone)
 *   - git_staged      (index differs from HEAD)
 *   - git_clean       (path matches HEAD: neither staged nor modified)
 *   - git_committed   (a commit was made this run)
 *
 * The other 7 kinds are SIMULATOR-ONLY (no shell hook / history scrape exists),
 * because they describe transient actions rather than a resulting disk state:
 *
 *   - cwd_is, file_opened, command_used, editor_command_used, editor_search,
 *     git_subcommand_used, search_performed
 *
 * These are silently dropped from sandbox scoring. A mission is therefore
 * sandbox-eligible only if it has >= 1 observable objective; one made entirely of
 * non-observable kinds (e.g. pure navigation / search / editor-verb drills) is
 * simulator-only, and that's fine. Mission authors who want a mission playable in
 * the real sandbox must include at least one disk-observable objective above.
 */
export function isSandboxObservable(objective: Objective): boolean {
  switch (objective.type) {
    case "file_contains":
    case "file_lacks":
    case "git_staged":
    case "git_clean":
    case "git_committed":
      return true;
    default:
      return false;
  }
}

export function allObjectivesComplete(
  mission: Mission,
  state: SessionState,
  fs: VirtualFs,
): boolean {
  return mission.objectives.every((o) => isObjectiveComplete(o, state, fs));
}
