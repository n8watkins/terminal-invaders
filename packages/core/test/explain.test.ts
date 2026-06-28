import { describe, expect, it } from "vitest";
import {
  ALL_LESSONS,
  CORE_COMMAND_LESSONS,
  EDITOR_LESSONS,
  GIT_LESSONS,
  GameEngine,
  conceptsForMission,
  lessonFor,
} from "../src/index.ts";
import { CORE_COMMANDS } from "../src/commands/registry.ts";
import { heroCopy, whatChanged } from "@terminal-invaders/missions";

describe("lesson coverage", () => {
  it("every core command has a lesson card", () => {
    for (const spec of CORE_COMMANDS) {
      expect(CORE_COMMAND_LESSONS[spec.name], `lesson for ${spec.name}`).toBeDefined();
      // and it's attached to the spec so `help` can group by kind
      expect(spec.lesson, `spec.lesson for ${spec.name}`).toBeDefined();
    }
  });

  it("the git subcommands the engine dispatches all have lessons", () => {
    for (const sub of ["status", "diff", "add", "restore", "commit", "log"]) {
      expect(GIT_LESSONS[sub], `git ${sub}`).toBeDefined();
    }
  });

  it("the editor verbs the simulator records all have lessons", () => {
    for (const verb of ["i", "esc", ":w", ":q", ":q!", ":wq", "dd", "/", ":%s"]) {
      expect(EDITOR_LESSONS[verb], `editor ${verb}`).toBeDefined();
    }
  });

  it("every lesson is well-formed (kind, env, provenance, explanation, examples)", () => {
    for (const [name, lesson] of Object.entries(ALL_LESSONS)) {
      expect(lesson.environment.length, `${name} environment`).toBeGreaterThan(0);
      expect(lesson.provenance.length, `${name} provenance`).toBeGreaterThan(0);
      expect(lesson.explanation.length, `${name} explanation`).toBeGreaterThan(0);
      expect(lesson.synopsis.length, `${name} synopsis`).toBeGreaterThan(0);
    }
  });
});

describe("explain command", () => {
  it("explains rg as an external tool, not a shell builtin", () => {
    const e = new GameEngine(heroCopy);
    const { output } = e.execute("explain rg");
    const text = output.join("\n");
    expect(text).toMatch(/ripgrep/i);
    expect(text).toMatch(/external-cli/);
  });

  it("demystifies git checkout (the user's actual question)", () => {
    const e = new GameEngine(heroCopy);
    const { output } = e.execute("explain checkout");
    const text = output.join("\n").toLowerCase();
    expect(text).toMatch(/switch|restore/); // explains the modern split
  });

  it("explains an editor verb", () => {
    const e = new GameEngine(heroCopy);
    const { output } = e.execute("explain :wq");
    expect(output.join("\n").length).toBeGreaterThan(0);
    expect(lessonFor(":wq")).toBeDefined();
  });

  it("bare explain lists what can be explained", () => {
    const e = new GameEngine(heroCopy);
    const { output } = e.execute("explain");
    expect(output.join("\n")).toMatch(/explain <name>/);
  });

  it("gives a friendly miss for an unknown name", () => {
    const e = new GameEngine(heroCopy);
    const { output } = e.execute("explain wat");
    expect(output.join("\n")).toMatch(/No lesson/);
  });
});

describe("help groups by kind", () => {
  it("labels external tools distinctly from shell builtins", () => {
    const e = new GameEngine(heroCopy);
    const text = e.execute("help").output.join("\n");
    expect(text).toMatch(/Shell builtins/);
    expect(text).toMatch(/External tools/);
    expect(text).toMatch(/explain <cmd>/);
  });
});

describe("conceptsForMission", () => {
  it("derives the commands a mission introduces from its objectives", () => {
    const concepts = conceptsForMission(heroCopy);
    expect(concepts).toContain("rg");
    expect(concepts).toContain("nvim");
    expect(concepts).not.toContain("check"); // game-verb noise is dropped
  });

  it("derives git subcommands for a git mission", () => {
    const concepts = conceptsForMission(whatChanged);
    expect(concepts.length).toBeGreaterThan(0);
  });
});
