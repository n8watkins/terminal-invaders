import { describe, expect, it } from "vitest";
import { GameEngine } from "@terminal-invaders/core";
import { findTodo } from "../src/search/findTodo.ts";
import { firstGrep } from "../src/search/firstGrep.ts";
import { searchThenOpen } from "../src/search/searchThenOpen.ts";
import { theRightMatch } from "../src/search/theRightMatch.ts";
import { findTheDefinition } from "../src/search/findTheDefinition.ts";
import { filterTheNoise } from "../src/search/filterTheNoise.ts";
import { exactSymbol } from "../src/search/exactSymbol.ts";
import { triageHits } from "../src/search/triageHits.ts";
import { searchOpenRead } from "../src/search/searchOpenRead.ts";
import { trackDownTheBug } from "../src/search/trackDownTheBug.ts";

function play(e: GameEngine, inputs: string[]) {
  for (const i of inputs) e.execute(i);
}

describe("search track", () => {
  it("solves search-005 (Hunt the Stale TODO)", () => {
    const e = new GameEngine(findTodo);
    play(e, ['rg "TODO"', "open src/auth.ts", "check"]);
    expect(e.state.complete).toBe(true);
    expect(e.state.openedFiles).toContain("/project/src/auth.ts");
  });

  it("solves search-001 (First Grep)", () => {
    const e = new GameEngine(firstGrep);
    play(e, ['rg "fizzbuzz"', "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-002 (Search then Open)", () => {
    const e = new GameEngine(searchThenOpen);
    play(e, ['rg "calculateTax"', "nvim src/billing.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-003 (The Right Match)", () => {
    const e = new GameEngine(theRightMatch);
    play(e, [`rg '"/checkout"'`, "nvim src/routes/checkout.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-004 (Find the Definition)", () => {
    const e = new GameEngine(findTheDefinition);
    play(e, ['rg "export function formatCurrency"', "nvim src/format.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-006 (Filter the Noise)", () => {
    const e = new GameEngine(filterTheNoise);
    play(e, ['rg "config.database"', "nvim src/database.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-007 (Exact Symbol)", () => {
    const e = new GameEngine(exactSymbol);
    play(e, ['rg "let count ="', "nvim src/state.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-008 (Triage Hits)", () => {
    const e = new GameEngine(triageHits);
    play(e, ['rg "sendEmail"', "nvim src/signup.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-009 (Search -> Open -> Read)", () => {
    const e = new GameEngine(searchOpenRead);
    play(e, ['rg "DEPRECATED"', "nvim src/api.ts", "/DEPRECATED", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves search-010 (Track Down the Bug)", () => {
    const e = new GameEngine(trackDownTheBug);
    play(e, [
      'rg "Invalid session token"',
      "nvim src/auth/session.ts",
      ":q",
      'rg "validateSession"',
      "nvim src/routes/dashboard.ts",
      ":q",
      "check",
    ]);
    expect(e.state.complete).toBe(true);
  });
});
