import type { GameEngine } from "@terminal-invaders/core";

/**
 * The small arcade strip: one "invader" per objective. As you complete
 * objectives they get cleared — the mission is the wave you're shooting down.
 */
export function MiniMap({ engine }: { engine: GameEngine }) {
  const checklist = engine.objectiveChecklist();
  const done = checklist.filter((o) => o.complete).length;

  return (
    <div className="minimap">
      <div className="lane">
        {checklist.map((o) => (
          <span key={o.id} className={`invader ${o.complete ? "down" : ""}`}>
            {o.complete ? "✸" : "ᗧ"}
          </span>
        ))}
      </div>
      <div className="hud-stats">
        <span>
          WAVE <b>{done}</b>/{checklist.length}
        </span>
        <span>
          COMBO <b>{engine.state.combo}</b>
        </span>
        <span>
          SCORE <b>{engine.state.score}</b>
        </span>
      </div>
    </div>
  );
}
