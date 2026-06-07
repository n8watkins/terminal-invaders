import { useMemo, useReducer, useState } from "react";
import { GameEngine, type Mission } from "@terminal-invaders/core";
import { MISSIONS } from "@terminal-invaders/missions";
import { FileTree } from "./components/FileTree.tsx";
import { MissionPanel } from "./components/MissionPanel.tsx";
import { Terminal } from "./components/Terminal.tsx";
import { MiniMap } from "./components/MiniMap.tsx";
import { eventLines, line, type OutputLine } from "./lib/output.ts";

const CLEAR_MARKER = "\x1b[CLEAR\x1b[";

export function App() {
  const [mission, setMission] = useState<Mission | null>(null);

  if (!mission) return <MissionPicker onPick={setMission} />;
  return <Game mission={mission} onExit={() => setMission(null)} key={mission.id} />;
}

function MissionPicker({ onPick }: { onPick: (m: Mission) => void }) {
  return (
    <div className="picker">
      <h1 className="logo">
        TERMINAL <span>INVADERS</span>
      </h1>
      <p className="tagline">An arcade terminal trainer. Pick a mission and start the reps.</p>
      <div className="mission-grid">
        {MISSIONS.map((m) => (
          <button key={m.id} className="mission-card" onClick={() => onPick(m)}>
            <span className={`track-badge ${m.track}`}>{m.track}</span>
            <span className="card-title">{m.title}</span>
            <span className="card-diff">{"★".repeat(m.difficulty)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Game({ mission, onExit }: { mission: Mission; onExit: () => void }) {
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
