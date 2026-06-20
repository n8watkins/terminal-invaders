import { useEffect, useMemo, useReducer, useState } from "react";
import { GameEngine, type Mission } from "@terminal-invaders/core";
import { MISSIONS } from "@terminal-invaders/missions";
import { FileTree } from "./components/FileTree.tsx";
import { MissionPanel } from "./components/MissionPanel.tsx";
import { Terminal } from "./components/Terminal.tsx";
import { MiniMap } from "./components/MiniMap.tsx";
import { eventLines, line, type OutputLine } from "./lib/output.ts";
import {
  loadProgress,
  recordCompletion,
  saveProgress,
  type MissionProgress,
  type ProgressMap,
} from "./lib/progress.ts";

const CLEAR_MARKER = "\x1b[CLEAR\x1b[";

export function App() {
  const [mission, setMission] = useState<Mission | null>(null);
  // Read persisted progress once; updates flow back via onComplete so the picker
  // shows fresh ✓ badges after exiting a run, without a reload.
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  // Persist as a side effect of state changing, not inside the updater — keeps
  // the updater pure (no double-write under StrictMode). recordCompletion
  // returns the same reference when nothing changed, so this only writes on a
  // real update.
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleComplete = (missionId: string, score: number) => {
    setProgress((prev) => recordCompletion(prev, missionId, score));
  };

  if (!mission) return <MissionPicker progress={progress} onPick={setMission} />;
  // key={mission.id} keeps the per-mission remount-by-id behavior intact.
  return (
    <Game
      mission={mission}
      onExit={() => setMission(null)}
      onComplete={handleComplete}
      key={mission.id}
    />
  );
}

function MissionPicker({
  progress,
  onPick,
}: {
  progress: ProgressMap;
  onPick: (m: Mission) => void;
}) {
  return (
    <div className="picker">
      <h1 className="logo">
        TERMINAL <span>INVADERS</span>
      </h1>
      <p className="tagline">An arcade terminal trainer. Pick a mission and start the reps.</p>
      <div className="mission-grid">
        {MISSIONS.map((m) => {
          const done = progress[m.id]?.completed ?? false;
          return (
            <button
              key={m.id}
              className={`mission-card${done ? " completed" : ""}`}
              onClick={() => onPick(m)}
              style={{ position: "relative" }}
            >
              <span className={`track-badge ${m.track}`}>{m.track}</span>
              {done ? <DoneBadge record={progress[m.id]} /> : null}
              <span className="card-title">{m.title}</span>
              <span className="card-diff">{"★".repeat(m.difficulty)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DoneBadge({ record }: { record: MissionProgress | undefined }) {
  // Inline-styled so this self-contained feature doesn't depend on shared CSS.
  return (
    <span
      className="done-badge"
      title={`Completed — best score ${record?.bestScore ?? 0}`}
      style={{
        position: "absolute",
        top: 10,
        right: 12,
        fontSize: 13,
        fontWeight: 700,
        color: "#6ee7a8",
      }}
    >
      ✓ {record?.bestScore ?? 0}
    </span>
  );
}

function Game({
  mission,
  onExit,
  onComplete,
}: {
  mission: Mission;
  onExit: () => void;
  onComplete: (missionId: string, score: number) => void;
}) {
  const engine = useMemo(() => new GameEngine(mission), [mission]);
  const [, force] = useReducer((x) => x + 1, 0);
  const [lines, setLines] = useState<OutputLine[]>(() => [
    line("system", mission.briefing),
    line("system", "Type `help` for commands, `hint` if stuck, `check` when done."),
  ]);
  const run = (input: string) => {
    const trimmed = input.trim();
    const next: OutputLine[] = [];
    // Echo the typed line (in editor mode even blank lines matter).
    if (engine.editorOpen || trimmed) next.push(line("input", engine.editorOpen ? input : trimmed));

    const { output, events } = engine.execute(input);

    if (output.length === 1 && output[0] === CLEAR_MARKER) {
      setLines([]);
      force();
      return;
    }
    for (const o of output) next.push(line("output", o));
    next.push(...eventLines(events));
    setLines((prev) => [...prev, ...next]);

    // Persist progress on completion. We trust the event but guard on
    // engine.state.complete so a stray event can't mark an unfinished run.
    if (events.some((e) => e.type === "mission_complete") && engine.state.complete) {
      onComplete(mission.id, engine.state.score);
    }
    force();
  };

  return (
    <div className="game">
      <header className="hud">
        <button className="back" onClick={onExit}>
          ‹ missions
        </button>
        <div className="hud-title">
          <span className="hud-logo">TERMINAL INVADERS</span>
          <span className="hud-mission">
            {mission.title} · <span className={`track-badge ${mission.track}`}>{mission.track}</span>
          </span>
        </div>
        <div className="hud-score">SCORE {engine.state.score}</div>
      </header>

      <main className="grid">
        <FileTree fs={engine.fs} cwd={engine.state.cwd} activeFile={engine.state.activeFile} />
        <Terminal engine={engine} lines={lines} onRun={run} />
        <MissionPanel mission={mission} engine={engine} />
      </main>

      <footer className="arcade">
        <MiniMap engine={engine} />
      </footer>
    </div>
  );
}
