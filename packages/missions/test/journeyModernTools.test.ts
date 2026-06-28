import { describe, expect, it } from "vitest";
import { PathSession } from "@terminal-invaders/core";
import { modernToolsJourney } from "../src/journeys/modernTools.ts";

/** Drive the active step to completion by replaying its exact solution. */
function play(s: PathSession, inputs: string[]) {
  for (const i of inputs) s.execute(i);
}

describe("modern-tools journey — shared persistent world", () => {
  it("is solvable end to end with eza/bat, zoxide, and jq", () => {
    const s = new PathSession(modernToolsJourney);

    // Step 1: list with eza, read package.json with bat.
    expect(s.currentStep.id).toBe("see-better");
    play(s, ["eza", "bat package.json", "check"]);
    expect(s.stepComplete).toBe(true);
    // bat actually opened the manifest.
    expect(s.current.state.openedFiles).toContain("/proj/package.json");

    s.advance();

    // Step 2: jump into /proj/src/app with zoxide's `z`.
    expect(s.currentStep.id).toBe("jump");
    play(s, ["z app", "check"]);
    expect(s.stepComplete).toBe(true);
    // The world carries: we're now standing in the app directory.
    expect(s.current.state.cwd).toBe("/proj/src/app");

    s.advance();

    // Step 3: a config.json appeared in the world; read a value with jq.
    expect(s.currentStep.id).toBe("query-json");
    // The setup mutation dropped the new file into the shared world.
    expect(s.snapshot().fsNodes["/proj/config.json"]).toBeDefined();
    // Step starts back at /proj so the relative `config.json` resolves.
    expect(s.current.state.cwd).toBe("/proj");

    play(s, ["jq .port config.json", "check"]);
    expect(s.stepComplete).toBe(true);

    // The journey is finished: last step, and it's complete.
    expect(s.isLastStep).toBe(true);
    expect(s.totalScore).toBeGreaterThan(0);
  });

  it("jq returns the queried value from the config the world grew", () => {
    const s = new PathSession(modernToolsJourney);
    play(s, ["eza", "bat package.json", "check"]);
    s.advance();
    play(s, ["z app", "check"]);
    s.advance();

    const out = s.current.execute("jq .port config.json").output.join("\n");
    expect(out).toBe("8080");
  });
});
