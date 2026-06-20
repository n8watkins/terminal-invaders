import { describe, expect, it } from "vitest";
import { GameEngine } from "@terminal-invaders/core";
import { readTheConfig } from "../src/workflow/readTheConfig.ts";
import { locateAndOpen } from "../src/workflow/locateAndOpen.ts";
import { changeTheCta } from "../src/workflow/changeTheCta.ts";
import { fixTheTypo } from "../src/workflow/fixTheTypo.ts";
import { addAnExport } from "../src/workflow/addAnExport.ts";
import { fixABrokenImport } from "../src/workflow/fixABrokenImport.ts";
import { editAndCommit } from "../src/workflow/editAndCommit.ts";
import { searchFixVerify } from "../src/workflow/searchFixVerify.ts";
import { shipATinyFeature } from "../src/workflow/shipATinyFeature.ts";

function play(e: GameEngine, inputs: string[]) {
  for (const i of inputs) e.execute(i);
}

describe("workflow capstones", () => {
  it("solves workflow-002 (Read the Config)", () => {
    const e = new GameEngine(readTheConfig);
    play(e, ["cd config", "nvim settings.ts", ":q", "check"]);
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-003 (Locate and Open)", () => {
    const e = new GameEngine(locateAndOpen);
    play(e, [
      'rg "export function formatPrice"',
      "cd src/lib",
      "nvim money.ts",
      ":q",
      "check",
    ]);
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-004 (Change the CTA)", () => {
    const e = new GameEngine(changeTheCta);
    play(e, [
      'rg "Start now"',
      "nvim src/app/page.tsx",
      ":%s/Start now/Get started/g",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/app/page.tsx") ?? "";
    expect(content).toContain("Get started");
    expect(content).not.toContain("Start now");
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-005 (Fix the Typo)", () => {
    const e = new GameEngine(fixTheTypo);
    play(e, [
      'rg "recieve"',
      "nvim src/mailbox.ts",
      ":%s/recieve/receive/g",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/mailbox.ts") ?? "";
    expect(content).toContain("receive");
    expect(content).not.toContain("recieve");
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-006 (Add an Export)", () => {
    const e = new GameEngine(addAnExport);
    play(e, [
      'rg "export const cap"',
      "nvim src/lib/helpers.ts",
      "o",
      "export const slugify = (s) => s.toLowerCase();",
      "esc",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/lib/helpers.ts") ?? "";
    expect(content).toContain("export const slugify");
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-007 (Fix a Broken Import)", () => {
    const e = new GameEngine(fixABrokenImport);
    play(e, [
      'rg "./helprs"',
      "nvim src/Invoice.tsx",
      ":%s/helprs/helpers/g",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/Invoice.tsx") ?? "";
    expect(content).toContain('from "./helpers"');
    expect(content).not.toContain("./helprs");
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-008 (Edit and Commit)", () => {
    const e = new GameEngine(editAndCommit);
    play(e, [
      "nvim version.ts",
      ":%s/1.0.0/1.1.0/g",
      ":wq",
      "git add version.ts",
      'git commit -m "Bump to 1.1.0"',
      "check",
    ]);
    const content = e.fs.readFile("/project/version.ts") ?? "";
    expect(content).toContain("1.1.0");
    expect(e.state.gitCommits).toBeGreaterThan(0);
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-009 (Search, Fix, Verify)", () => {
    const e = new GameEngine(searchFixVerify);
    play(e, [
      'rg "isAdmin = true"',
      "nvim src/auth.ts",
      ":%s/isAdmin = true/isAdmin === true/g",
      ":wq",
      "check",
    ]);
    const content = e.fs.readFile("/project/src/auth.ts") ?? "";
    expect(content).toContain("isAdmin === true");
    expect(content).not.toContain("isAdmin = true");
    expect(e.state.complete).toBe(true);
  });

  it("solves workflow-010 (Ship a Tiny Feature)", () => {
    const e = new GameEngine(shipATinyFeature);
    play(e, [
      "tree",
      "cd src/config",
      'rg "export const flags"',
      "nvim flags.ts",
      "o",
      "  newFeature: true,",
      "esc",
      ":wq",
      "git add flags.ts",
      'git commit -m "Add newFeature flag"',
      "check",
    ]);
    const content = e.fs.readFile("/project/src/config/flags.ts") ?? "";
    expect(content).toContain("newFeature");
    expect(e.state.gitCommits).toBeGreaterThan(0);
    expect(e.state.complete).toBe(true);
  });
});
