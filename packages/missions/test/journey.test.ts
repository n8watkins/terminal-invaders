import { describe, expect, it } from "vitest";
import { PathSession, type Journey } from "@terminal-invaders/core";
import { JOURNEYS } from "../src/index.ts";
import { gitSafetyJourney } from "../src/journeys/gitSafety.ts";

const VALID_ENVS = new Set(["bash", "zsh", "powershell", "nvim", "tool:git", "tool:fzf"]);

/** Drive the active step to completion. */
function play(s: PathSession, inputs: string[]) {
  for (const i of inputs) s.execute(i);
}

describe("journey integrity (all registered journeys)", () => {
  it("has unique journey ids and valid metadata", () => {
    const ids = JOURNEYS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const j of JOURNEYS) {
      expect(VALID_ENVS.has(j.environment), `${j.id}: env ${j.environment}`).toBe(true);
      expect(j.steps.length, `${j.id}: steps`).toBeGreaterThan(0);
      expect(j.world.filesystem[j.world.startingCwd]?.type, `${j.id}: startingCwd`).toBe("dir");
      expect(j.blurb.length).toBeGreaterThan(0);
      expect(j.outcomes.length).toBeGreaterThan(0);
    }
  });

  it("has well-formed steps (unique step ids, unique objective ids, hints present)", () => {
    for (const j of JOURNEYS) {
      const stepIds = j.steps.map((s) => s.id);
      expect(new Set(stepIds).size, `${j.id}: step ids`).toBe(stepIds.length);
      for (const step of j.steps) {
        expect(step.objectives.length, `${j.id}/${step.id}: objectives`).toBeGreaterThan(0);
        expect(step.hints.length, `${j.id}/${step.id}: hints`).toBeGreaterThan(0);
        const oids = step.objectives.map((o) => o.id);
        expect(new Set(oids).size, `${j.id}/${step.id}: objective ids`).toBe(oids.length);
      }
    }
  });
});

describe("git-safety journey — shared persistent world", () => {
  it("carries the world (and history) across steps", () => {
    const s = new PathSession(gitSafetyJourney);

    // Step 1: stage + commit the README change.
    expect(s.currentStep.id).toBe("first-commit");
    play(s, ["git status", "git add README.md", 'git commit -m "Document setup"', "check"]);
    expect(s.stepComplete).toBe(true);

    // Advance — the SAME repo carries forward.
    s.advance();
    expect(s.currentStep.id).toBe("confirm-landed");

    // The commit from step 1 is visible in step 2's history (proves persistence).
    const log = s.current.execute("git log").output.join("\n");
    expect(log).toMatch(/Document setup/);
    expect(s.current.state.gitCommits).toBeGreaterThanOrEqual(1);
  });

  it("is solvable end to end, banking score the whole way", () => {
    const s = new PathSession(gitSafetyJourney);

    play(s, ["git status", "git add README.md", 'git commit -m "Document setup"', "check"]);
    s.advance();
    play(s, ["git log", "git diff", "check"]);
    s.advance();

    // Step 3: a teammate broke server.js in the working tree — restore it.
    expect(s.currentStep.id).toBe("recover-bad-change");
    const diff = s.current.execute("git diff").output.join("\n");
    expect(diff).toMatch(/undefined/); // the bad change is visible
    play(s, ["git restore src/server.js", "check"]);
    expect(s.stepComplete).toBe(true);
    s.advance();

    // Step 4 (boss): stage + commit the new changelog.
    expect(s.currentStep.id).toBe("ship-it");
    play(s, ["git add CHANGELOG.md", 'git commit -m "Add changelog"', "check"]);
    expect(s.stepComplete).toBe(true);
    expect(s.isLastStep).toBe(true);
    expect(s.completedSteps.length).toBe(3); // first three banked; last is current+complete
    expect(s.totalScore).toBeGreaterThan(0);
  });

  it("restoring in step 3 cleans the working tree it was dirtied in", () => {
    const s = new PathSession(gitSafetyJourney);
    play(s, ["git status", "git add README.md", 'git commit -m "x"', "check"]);
    s.advance();
    play(s, ["git log", "git diff", "check"]);
    s.advance();
    // Setup wrote the broken server.js; restore should bring back the committed 'ok'.
    s.current.execute("git restore src/server.js");
    const status = s.current.execute("git status").output.join("\n");
    expect(status).toMatch(/working tree clean/);
  });

  it("does not double-count the final step's score when advancing past it", () => {
    const s = new PathSession(gitSafetyJourney);
    play(s, ["git status", "git add README.md", 'git commit -m "x"', "check"]);
    s.advance();
    play(s, ["git log", "git diff", "check"]);
    s.advance();
    play(s, ["git diff", "git restore src/server.js", "check"]);
    s.advance();
    play(s, ["git add CHANGELOG.md", 'git commit -m "y"', "check"]);
    const before = s.totalScore; // last step complete, not yet advanced
    s.advance(); // banks the final step (engine stays in place)
    expect(s.totalScore).toBe(before); // must NOT add the last step's score twice
  });

  it("git_committed in a later step requires a NEW commit, not a carried one", () => {
    const journey: Journey = {
      id: "t-commit",
      title: "t",
      environment: "tool:git",
      blurb: "b",
      outcomes: ["o"],
      world: {
        startingCwd: "/r",
        filesystem: { "/r": { type: "dir" }, "/r/a.txt": { type: "file", content: "v2" } },
        git: { head: { "/r/a.txt": "v1" } },
      },
      steps: [
        {
          id: "s1",
          title: "s1",
          briefing: "",
          objectives: [
            { id: "c1", label: "commit", type: "git_committed" },
            { id: "d", label: "check", type: "command_used", command: "check" },
          ],
          hints: [{ text: "h" }],
          successMessage: "ok",
        },
        {
          id: "s2",
          title: "s2",
          briefing: "",
          setup: { writeFiles: { "/r/a.txt": "v3" } },
          objectives: [
            { id: "c2", label: "commit again", type: "git_committed" },
            { id: "d", label: "check", type: "command_used", command: "check" },
          ],
          hints: [{ text: "h" }],
          successMessage: "ok",
        },
      ],
    };
    const s = new PathSession(journey);
    play(s, ["git add a.txt", 'git commit -m "one"', "check"]);
    expect(s.stepComplete).toBe(true);
    s.advance();

    // The step-1 commit carried over, but git_committed here must NOT be satisfied
    // until the player makes a NEW commit in step 2.
    expect(s.current.objectiveChecklist().find((o) => o.id === "c2")?.complete).toBe(false);
    s.execute("check");
    expect(s.stepComplete).toBe(false); // can't pass on the carried commit alone

    play(s, ["git add a.txt", 'git commit -m "two"', "check"]);
    expect(s.stepComplete).toBe(true);
  });

  it("snapshots and resumes exactly where it left off", () => {
    const s = new PathSession(gitSafetyJourney);
    play(s, ["git status", "git add README.md", 'git commit -m "Document setup"', "check"]);
    s.advance(); // now on step 2, world carries the commit

    const snap = s.snapshot();
    expect(snap.stepIndex).toBe(1);
    expect(snap.git?.commits.length).toBeGreaterThanOrEqual(1);

    // Round-trip through JSON, as the CLI/web persistence layers will.
    const revived = new PathSession(gitSafetyJourney, JSON.parse(JSON.stringify(snap)));
    expect(revived.currentStep.id).toBe("confirm-landed");
    // The carried commit survived the round-trip.
    expect(revived.current.execute("git log").output.join("\n")).toMatch(/Document setup/);
    // And the resumed step is solvable.
    play(revived, ["git log", "git diff", "check"]);
    expect(revived.stepComplete).toBe(true);
  });
});
