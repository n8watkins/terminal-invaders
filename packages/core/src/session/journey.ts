/**
 * Journeys — a *shared persistent world* across an ordered set of steps.
 *
 * A classic mission is a self-contained world that resets between plays. A
 * journey is the opposite: one project you and the steps mutate together, where
 * what you do in step N is still there in step N+1. Stage and commit a fix in
 * step 1, and step 2's `git log` shows YOUR commit; discard a teammate's bad
 * change in step 3, and the repo stays clean into the boss step.
 *
 * `PathSession` is the orchestrator. It owns the live world (a VirtualFs and,
 * for git journeys, a GitModel) and hands those exact instances to each step's
 * GameEngine via the seed options, so the engine mutates the shared world rather
 * than a private copy. Between steps the world simply carries forward.
 */
import { VirtualFs } from "../fs/virtualFs.ts";
import { GitModel, type GitSnapshot } from "../git/git.ts";
import type { Environment } from "../lessons/types.ts";
import type { FsNode, Hint, Mission, Objective, ToolKit } from "../missions/types.ts";
import { GameEngine, type ExecuteResult } from "./engine.ts";

/**
 * A declarative change applied to the shared world before a step begins — used
 * to script a storyline ("a teammate pushed a bad change", "an upstream commit
 * landed"). Declarative (not a function) so it's easy to author and reason about.
 */
export type WorldMutation = {
  /** Create or overwrite working-tree files. */
  writeFiles?: Record<string, string>;
  /** Remove working-tree files. */
  deleteFiles?: string[];
  /** Inject a commit straight into history (a change that already landed upstream). */
  commitToHead?: { message: string; files: Record<string, string> };
};

export type JourneyStep = {
  id: string;
  title: string;
  briefing: string;
  concepts?: string[];
  objectives: Objective[];
  hints: Hint[];
  successMessage: string;
  /** Reposition the player at step start; defaults to carrying the previous cwd. */
  startingCwd?: string;
  /** World change applied before this step runs. */
  setup?: WorldMutation;
};

export type Journey = {
  id: string;
  title: string;
  environment: Environment;
  /** Command toolkits available throughout the journey (e.g. ["modern"], ["fzf"]). */
  tools?: ToolKit[];
  blurb: string;
  outcomes: string[];
  /** The initial shared world. */
  world: {
    filesystem: Record<string, FsNode>;
    git?: { head: Record<string, string> };
    startingCwd: string;
  };
  steps: JourneyStep[];
};

/** Everything needed to resume a journey exactly where the player left off. */
export type JourneySnapshot = {
  version: 1;
  journeyId: string;
  stepIndex: number;
  completedSteps: string[];
  bankedScore: number;
  cwd: string;
  fsNodes: Record<string, FsNode>;
  git?: GitSnapshot;
};

export class PathSession {
  readonly journey: Journey;
  stepIndex: number;
  completedSteps: string[];
  /** Score from steps already finished; the active step's score is on `current.state`. */
  bankedScore: number;
  private fs: VirtualFs;
  private git?: GitModel;
  private engine!: GameEngine;

  constructor(journey: Journey, snapshot?: JourneySnapshot) {
    this.journey = journey;
    if (snapshot) {
      this.fs = new VirtualFs(snapshot.fsNodes);
      this.git = snapshot.git ? GitModel.fromSnapshot(snapshot.git) : undefined;
      this.stepIndex = snapshot.stepIndex;
      this.completedSteps = [...snapshot.completedSteps];
      this.bankedScore = snapshot.bankedScore;
      // The snapshot world already reflects any setup mutations — don't re-apply.
      this.startStep(false, snapshot.cwd);
    } else {
      this.fs = new VirtualFs(journey.world.filesystem);
      this.git = journey.world.git ? new GitModel(journey.world.git.head) : undefined;
      this.stepIndex = 0;
      this.completedSteps = [];
      this.bankedScore = 0;
      this.startStep(true);
    }
  }

  get current(): GameEngine {
    return this.engine;
  }

  get currentStep(): JourneyStep {
    return this.journey.steps[this.stepIndex]!;
  }

  get isLastStep(): boolean {
    return this.stepIndex >= this.journey.steps.length - 1;
  }

  /** True once the active step's objectives are all satisfied and checked. */
  get stepComplete(): boolean {
    return this.engine.state.complete;
  }

  /** Banked score plus whatever the active step has accrued so far. */
  get totalScore(): number {
    return this.bankedScore + this.engine.state.score;
  }

  /** Delegate a line of input to the active step's engine. */
  execute(input: string): ExecuteResult {
    return this.engine.execute(input);
  }

  /**
   * Advance to the next step, carrying the world forward. Banks the finished
   * step's score and applies the next step's setup mutation. No-op if already at
   * the last step (use `isLastStep` / `stepComplete` to decide when to stop).
   */
  advance(): void {
    if (this.isLastStep) {
      this.bankCurrentStep();
      return;
    }
    const carriedCwd = this.engine.state.cwd;
    this.bankCurrentStep();
    this.stepIndex += 1;
    this.startStep(true, this.currentStep.startingCwd ?? carriedCwd);
  }

  snapshot(): JourneySnapshot {
    return {
      version: 1,
      journeyId: this.journey.id,
      stepIndex: this.stepIndex,
      completedSteps: [...this.completedSteps],
      bankedScore: this.bankedScore,
      cwd: this.engine.state.cwd,
      fsNodes: this.fs.toNodes(),
      git: this.git?.snapshot(),
    };
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private bankCurrentStep(): void {
    const step = this.currentStep;
    if (this.completedSteps.includes(step.id)) return;
    if (!this.engine.state.complete) return;
    this.completedSteps.push(step.id);
    this.bankedScore += this.engine.state.score;
  }

  private applyMutation(mut: WorldMutation): void {
    if (mut.commitToHead && this.git) {
      this.git.injectCommit(mut.commitToHead.message, mut.commitToHead.files);
      for (const [path, content] of Object.entries(mut.commitToHead.files)) {
        this.fs.setFile(path, content);
      }
    }
    for (const [path, content] of Object.entries(mut.writeFiles ?? {})) {
      this.fs.setFile(path, content);
    }
    for (const path of mut.deleteFiles ?? []) this.fs.deleteNode(path);
  }

  private startStep(applySetup: boolean, cwdOverride?: string): void {
    const step = this.currentStep;
    if (applySetup && step.setup) this.applyMutation(step.setup);
    const cwd = cwdOverride ?? step.startingCwd ?? this.journey.world.startingCwd;

    // Synthesize a Mission so the existing engine + render/validation machinery
    // works unchanged. The engine drives the SHARED fs/git via the seed options;
    // mission.filesystem is just a valid placeholder it won't actually use.
    const stepMission: Mission = {
      id: `${this.journey.id}:${step.id}`,
      title: step.title,
      difficulty: 1,
      track: "workflow",
      environment: this.journey.environment,
      tools: this.journey.tools,
      briefing: step.briefing,
      concepts: step.concepts,
      startingCwd: cwd,
      filesystem: this.fs.toNodes(),
      objectives: step.objectives,
      hints: step.hints,
      successMessage: step.successMessage,
    };
    this.engine = new GameEngine(stepMission, { seedFs: this.fs, seedGit: this.git });
    // Honor a carried/overridden cwd (createInitialState used mission.startingCwd,
    // which is `cwd`, so this is belt-and-suspenders for clarity).
    this.engine.state.cwd = cwd;
  }
}
