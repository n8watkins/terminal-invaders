import { describe, expect, it } from "vitest";
import { PathSession } from "@terminal-invaders/core";
import { powershellJourney } from "../src/journeys/powershell.ts";

/**
 * Drive the PowerShell journey through its exact intended solution, asserting the
 * shared world carries across steps: the cwd you set in step 2 is still there in
 * step 3, and the bug file a teammate "pushes" before step 3 is searchable from
 * that same tree.
 */
describe("powershell journey — PowerShell for bash users", () => {
  it("solves end to end, carrying the shared world across steps", () => {
    const s = new PathSession(powershellJourney);

    // ── Step 1 — orient: Get-Location, Get-ChildItem ────────────────────────
    expect(s.currentStep.id).toBe("orient");

    const pwd = s.execute("Get-Location").output.join("\n");
    expect(pwd).toBe("/repo"); // we start at the repo root

    const listing = s.execute("Get-ChildItem").output.join("\n");
    expect(listing).toMatch(/src\//); // the src folder is visible

    s.execute("check");
    expect(s.stepComplete).toBe(true);

    s.advance();

    // ── Step 2 — move-read: Set-Location into src, Get-Content a file ────────
    expect(s.currentStep.id).toBe("move-read");

    s.execute("Set-Location src");
    expect(s.current.state.cwd).toBe("/repo/src"); // cd worked

    const fileBody = s.execute("Get-Content app.ps1").output.join("\n");
    expect(fileBody).toMatch(/Start-App/); // we actually read the file

    s.execute("check");
    expect(s.stepComplete).toBe(true);
    expect(s.current.state.openedFiles).toContain("/repo/src/app.ps1");

    // The world carries: cwd from step 2 persists into step 3.
    expect(s.current.state.cwd).toBe("/repo/src");
    s.advance();

    // ── Step 3 — search: teammate's bug.ps1 (with a TODO) appears via setup ──
    expect(s.currentStep.id).toBe("search");

    // Shared world carried the cwd forward into the new step.
    expect(s.current.state.cwd).toBe("/repo/src");

    // The teammate's bug file now exists in the same tree.
    const afterSetup = s.execute("Get-ChildItem").output.join("\n");
    expect(afterSetup).toMatch(/bug\.ps1/);
    expect(s.execute("Get-Content bug.ps1").output.join("\n")).toMatch(/TODO/);

    // Select-String (grep) finds the TODO and points at the right file.
    const hits = s.execute("Select-String TODO").output.join("\n");
    expect(hits).toMatch(/TODO/);
    expect(hits).toMatch(/\/repo\/src\/bug\.ps1/);

    s.execute("check");
    expect(s.stepComplete).toBe(true);

    // Journey finished.
    expect(s.isLastStep).toBe(true);
    expect(s.completedSteps).toEqual(["orient", "move-read"]); // first two banked; last is current+complete
    expect(s.totalScore).toBeGreaterThan(0);
  });

  it("starts in the powershell environment at /repo", () => {
    expect(powershellJourney.environment).toBe("powershell");
    expect(powershellJourney.world.startingCwd).toBe("/repo");
    expect(powershellJourney.world.filesystem["/repo"]?.type).toBe("dir");
    // bug.ps1 is NOT in the starting world — it's injected by step 3's setup.
    expect(powershellJourney.world.filesystem["/repo/src/bug.ps1"]).toBeUndefined();
  });
});
