import { useEffect, useMemo, useReducer, useState } from "react";
import {
  conceptsForMission,
  GameEngine,
  PathSession,
  type Journey,
  type JourneyStep,
  type Mission,
} from "@terminal-invaders/core";
import {
  JOURNEYS,
  LEARNING_PATHS,
  missionsForPath,
  type LearningPath,
} from "@terminal-invaders/missions";
import { FileTree } from "./components/FileTree.tsx";
import { MissionPanel } from "./components/MissionPanel.tsx";
import { Terminal } from "./components/Terminal.tsx";
import { MiniMap } from "./components/MiniMap.tsx";
import { eventLines, line, type OutputLine } from "./lib/output.ts";
import {
  clearJourneySave,
  hasJourneySave,
  loadJourneySave,
  saveJourneySave,
} from "./lib/journeySaves.ts";
import {
  loadProgress,
  recordCompletion,
  saveProgress,
  type MissionProgress,
  type ProgressMap,
} from "./lib/progress.ts";

const CLEAR_MARKER = "\x1b[CLEAR\x1b[";

export function App() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
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

  // Flow: pick a path → pick a mission within it → play. Exiting a run returns to
  // the path's mission list; "‹ paths" returns to the path picker.
  if (mission) {
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
  if (journey) {
    return <JourneyGame journey={journey} onExit={() => setJourney(null)} key={journey.id} />;
  }
  if (path) {
    return (
      <MissionPicker
        path={path}
        progress={progress}
        onPick={setMission}
        onBack={() => setPath(null)}
      />
    );
  }
  return <PathPicker progress={progress} onPick={setPath} onPickJourney={setJourney} />;
}

function PathPicker({
  progress,
  onPick,
  onPickJourney,
}: {
  progress: ProgressMap;
  onPick: (p: LearningPath) => void;
  onPickJourney: (j: Journey) => void;
}) {
  return (
    <div className="picker">
      <h1 className="logo">
        TERMINAL <span>INVADERS</span>
      </h1>
      <p className="tagline">Pick what you want to learn. Each path is a course you take end to end.</p>
      <div className="path-list">
        {LEARNING_PATHS.map((p) => {
          const missions = missionsForPath(p.id);
          const done = missions.filter((m) => progress[m.id]?.completed).length;
          const complete = done === missions.length;
          return (
            <button
              key={p.id}
              className={`path-card${complete ? " completed" : ""}`}
              onClick={() => onPick(p)}
            >
              <span className="path-card-head">
                <span className="path-title">{p.title}</span>
                <span className={`env-badge ${p.environment.replace(":", "-")}`}>{p.environment}</span>
              </span>
              <span className="path-blurb">{p.blurb}</span>
              <span className="path-progress">
                {complete ? "✓ " : ""}
                {done}/{missions.length} complete
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="section-head">Journeys</h2>
      <p className="tagline">One evolving project across several steps — your changes carry forward, and progress is saved.</p>
      <div className="path-list">
        {JOURNEYS.map((j) => {
          const resumable = hasJourneySave(j.id);
          return (
            <button key={j.id} className="path-card journey" onClick={() => onPickJourney(j)}>
              <span className="path-card-head">
                <span className="path-title">{j.title}</span>
                <span className={`env-badge ${j.environment.replace(":", "-")}`}>{j.environment}</span>
              </span>
              <span className="path-blurb">{j.blurb}</span>
              <span className="path-progress">
                {j.steps.length} steps{resumable ? " · resume in progress" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MissionPicker({
  path,
  progress,
  onPick,
  onBack,
}: {
  path: LearningPath;
  progress: ProgressMap;
  onPick: (m: Mission) => void;
  onBack: () => void;
}) {
  const missions = missionsForPath(path.id);
  return (
    <div className="picker">
      <button className="back" onClick={onBack}>
        ‹ paths
      </button>
      <h1 className="logo" style={{ fontSize: "2rem" }}>
        {path.title}
      </h1>
      <p className="tagline">{path.blurb}</p>
      <ul className="outcomes">
        {path.outcomes.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      <div className="mission-grid">
        {missions.map((m) => {
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
  const [lines, setLines] = useState<OutputLine[]>(() => {
    const concepts = conceptsForMission(mission);
    return [
      line("system", mission.briefing),
      ...(concepts.length > 0
        ? [line("system", `New here: ${concepts.join(", ")} — run \`explain <name>\` to learn each.`)]
        : []),
      line("system", "Type `help` for commands, `explain <cmd>` to learn one, `check` when done."),
    ];
  });
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

function stepIntroLines(step: JourneyStep): OutputLine[] {
  const concepts = step.concepts ?? [];
  return [
    line("system", step.briefing),
    ...(concepts.length > 0
      ? [line("system", `New here: ${concepts.join(", ")} — run \`explain <name>\` to learn each.`)]
      : []),
    line("system", "Type `help`, `explain <cmd>`, `check` when done."),
  ];
}

/**
 * A journey: one shared world across ordered steps, with localStorage save/resume.
 * Reuses the same Game shell components, driving `PathSession.current` (a real
 * GameEngine). When a step's objectives are met, a "next step" affordance advances
 * the session — carrying the world forward — and resets the terminal log.
 */
function JourneyGame({ journey, onExit }: { journey: Journey; onExit: () => void }) {
  const [session] = useState(() => {
    const saved = loadJourneySave(journey.id);
    return saved ? new PathSession(journey, saved) : new PathSession(journey);
  });
  const [, force] = useReducer((x) => x + 1, 0);
  const [stepIndex, setStepIndex] = useState(session.stepIndex);
  const [stepDone, setStepDone] = useState(session.stepComplete);
  const [journeyDone, setJourneyDone] = useState(false);
  const [lines, setLines] = useState<OutputLine[]>(() => stepIntroLines(session.currentStep));

  const engine = session.current;

  const run = (input: string) => {
    const trimmed = input.trim();
    const next: OutputLine[] = [];
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

    if (engine.state.complete) {
      saveJourneySave(journey.id, session.snapshot());
      setStepDone(true);
    }
    force();
  };

  const advance = () => {
    if (session.isLastStep) {
      session.advance(); // bank the final step
      clearJourneySave(journey.id);
      setJourneyDone(true);
      force();
      return;
    }
    session.advance(); // bank finished step, carry the world, apply next setup
    saveJourneySave(journey.id, session.snapshot());
    setStepIndex(session.stepIndex);
    setStepDone(false);
    setLines(stepIntroLines(session.currentStep));
    force();
  };

  if (journeyDone) {
    return (
      <div className="picker">
        <h1 className="logo">★ {journey.title}</h1>
        <p className="tagline">
          Journey complete — final score {session.totalScore}. You ran the whole flow on one evolving world.
        </p>
        <button className="back" onClick={onExit}>
          ‹ back to paths
        </button>
      </div>
    );
  }

  return (
    <div className="game">
      <header className="hud">
        <button className="back" onClick={onExit}>
          ‹ paths
        </button>
        <div className="hud-title">
          <span className="hud-logo">{journey.title}</span>
          <span className="hud-mission">
            step {session.stepIndex + 1}/{journey.steps.length} · {session.currentStep.title}
          </span>
        </div>
        {stepDone ? (
          <button className="continue" onClick={advance}>
            {session.isLastStep ? "Finish journey ▸" : "Next step ▸"}
          </button>
        ) : null}
        <div className="hud-score">SCORE {session.totalScore}</div>
      </header>

      <main className="grid" key={stepIndex}>
        <FileTree fs={engine.fs} cwd={engine.state.cwd} activeFile={engine.state.activeFile} />
        <Terminal engine={engine} lines={lines} onRun={run} />
        <MissionPanel mission={engine.mission} engine={engine} />
      </main>

      <footer className="arcade">
        <MiniMap engine={engine} />
      </footer>
    </div>
  );
}
