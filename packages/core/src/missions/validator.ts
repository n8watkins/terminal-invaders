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
    case "search_performed": {
      const needle = objective.query.toLowerCase();
      return state.searches.some((s) => {
        if (!s.query.toLowerCase().includes(needle)) return false;
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

export function allObjectivesComplete(
  mission: Mission,
  state: SessionState,
  fs: VirtualFs,
): boolean {
  return mission.objectives.every((o) => isObjectiveComplete(o, state, fs));
}
