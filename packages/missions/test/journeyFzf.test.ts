import { describe, expect, it } from "vitest";
import { PathSession } from "@terminal-invaders/core";
import { fzfJourney } from "../src/journeys/fzf.ts";

/**
 * Drive the fzf journey through its exact intended solution, and — crucially —
 * assert that each `fzf <query>` opened the *specific* file we meant. Because the
 * fuzzy matcher picks a single best match, an ambiguous query would silently open
 * the wrong file; checking `activeFile`/`openedFiles` after each select catches
 * that (e.g. `fzf page` would actually select `package.json`, not `page.tsx`).
 */
describe("fzf journey — fuzzy-finding across a shared world", () => {
  it("is solvable end to end and selects the intended file each time", () => {
    const s = new PathSession(fzfJourney);

    // ── Step 1: open the picker, then fuzzy-open utils.ts ────────────────────
    expect(s.currentStep.id).toBe("open-picker");

    // Bare `fzf` lists the candidates and opens nothing.
    s.execute("fzf");
    expect(s.current.state.commandsUsed).toContain("fzf");
    expect(s.current.state.activeFile).toBeUndefined();

    // `fzf utils` uniquely matches utils.ts and opens it.
    s.execute("fzf utils");
    expect(s.current.state.activeFile).toBe("/code/src/lib/utils.ts");
    expect(s.current.state.openedFiles).toContain("/code/src/lib/utils.ts");

    s.execute("check");
    expect(s.stepComplete).toBe(true);

    // ── Step 2: reach a deeply nested file without cd ────────────────────────
    s.advance();
    expect(s.currentStep.id).toBe("deep-find");

    // `pgtsx` is a distinctive subsequence that singles out page.tsx — NOT
    // package.json (which "page" would wrongly win), proving the query is unambiguous.
    s.execute("fzf pgtsx");
    expect(s.current.state.activeFile).toBe("/code/src/app/page.tsx");
    expect(s.current.state.openedFiles).toContain("/code/src/app/page.tsx");
    // We got there without ever changing directory.
    expect(s.current.state.cwd).toBe("/code");

    s.execute("check");
    expect(s.stepComplete).toBe(true);

    // ── Step 3: find a brand-new file added by the step's setup mutation ─────
    s.advance();
    expect(s.currentStep.id).toBe("find-new");

    // The setup wrote handler.ts into the shared world; fzf must surface it.
    const candidates = s.current.execute("fzf").output;
    expect(candidates).toContain("/code/src/api/handler.ts");

    s.execute("fzf handler");
    expect(s.current.state.activeFile).toBe("/code/src/api/handler.ts");
    expect(s.current.state.openedFiles).toContain("/code/src/api/handler.ts");

    s.execute("check");
    expect(s.stepComplete).toBe(true);

    // The journey finishes on the last step with score banked along the way.
    expect(s.isLastStep).toBe(true);
    expect(s.totalScore).toBeGreaterThan(0);
  });

  it("each fzf query is unambiguous (the intended file outranks all others)", () => {
    // Re-drive from fresh sessions, asserting the selected path is exactly the
    // one the step's objective expects — the guard against a similar-scoring rival.
    const cases: { setup: (s: PathSession) => void; query: string; expected: string }[] = [
      { setup: () => {}, query: "fzf utils", expected: "/code/src/lib/utils.ts" },
      {
        setup: (s) => {
          s.execute("fzf utils");
          s.execute("check");
          s.advance();
        },
        query: "fzf pgtsx",
        expected: "/code/src/app/page.tsx",
      },
    ];
    for (const c of cases) {
      const s = new PathSession(fzfJourney);
      c.setup(s);
      s.execute(c.query);
      expect(s.current.state.activeFile, `${c.query} should open ${c.expected}`).toBe(c.expected);
    }
  });
});
