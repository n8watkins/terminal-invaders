import type { GameEngine, Mission } from "@terminal-invaders/core";

type Props = {
  mission: Mission;
  engine: GameEngine;
};

export function MissionPanel({ mission, engine }: Props) {
  const checklist = engine.objectiveChecklist();
  const next = checklist.find((o) => !o.complete);

  return (
    <div className="panel mission">
      <div className="panel-title">Mission</div>
      <div className="mission-body">
        <p className="briefing">{mission.briefing}</p>

        <div className="next-step">
          <span className="next-label">Next</span>
          <span>{next ? next.label : "Run check to finish"}</span>
        </div>

        <div className="objectives">
          {checklist.map((o) => (
            <div key={o.id} className={`obj ${o.complete ? "done" : ""}`}>
              <span className="obj-box">{o.complete ? "✓" : "□"}</span>
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
