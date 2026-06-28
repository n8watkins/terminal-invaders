#!/usr/bin/env -S npx tsx
import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import {
  GameEngine,
  PathSession,
  completionCandidates,
  type Journey,
  type Mission,
} from "@terminal-invaders/core";
import {
  JOURNEYS,
  LEARNING_PATHS,
  MISSIONS,
  getJourney,
  getMission,
  getPath,
  missionsForPath,
  nextInPath,
  pathForMission,
  type LearningPath,
} from "@terminal-invaders/missions";
import { c } from "./colors.ts";
import { banner, checklist, prompt, renderEvents, replayBreakdown } from "./render.ts";
import { clearJourneySave, loadJourneySave, saveJourney } from "./saves.ts";
import { runSandbox, sandboxEligible } from "./sandbox.ts";

function print(s: string | string[]): void {
  stdout.write((Array.isArray(s) ? s.join("\n") : s) + "\n");
}

// ── Input: ONE readline for the whole session, pull-based ───────────────────
// Creating/closing a readline per prompt drops buffered lines on piped stdin.
// Instead we keep a single interface and a line QUEUE: every line read is either
// handed to a waiting consumer or queued, so nothing is ever dropped between
// prompts. Consumers pull with `nextLine()`. The Tab completer reads a mutable
// `completerEngine` so completion follows the active mission/step.
const CLOSED = Symbol("stdin-closed");
let rl: readline.Interface | undefined;
let stdinClosed = false;
let completerEngine: GameEngine | undefined;
const lineQueue: string[] = [];
let waiting: ((line: string | typeof CLOSED) => void) | undefined;

function initInput(): void {
  if (rl) return;
  rl = readline.createInterface({
    input: stdin,
    output: stdout,
    historySize: 200,
    completer: (line: string): [string[], string] => {
      if (!completerEngine || completerEngine.editorOpen) return [[], line];
      const { current, candidates, dirs } = completionCandidates(line, completerEngine);
      if (candidates.length > 0) completerEngine.noteAutocompleteUsed();
      return [candidates.map((cand) => (dirs.has(cand) ? `${cand}/` : cand)), current];
    },
  });
  rl.on("line", (l) => {
    if (waiting) {
      const w = waiting;
      waiting = undefined;
      w(l);
    } else {
      lineQueue.push(l);
    }
  });
  rl.on("close", () => {
    stdinClosed = true;
    if (waiting) {
      const w = waiting;
      waiting = undefined;
      w(CLOSED);
    }
  });
}

/** Pull the next line of input (queued or awaited). Never drops a line. */
function nextLine(): Promise<string | typeof CLOSED> {
  initInput();
  if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift()!);
  if (stdinClosed) return Promise.resolve(CLOSED);
  return new Promise((resolve) => {
    waiting = resolve;
  });
}

/** Prompt once and resolve with the trimmed answer (empty string if stdin closed). */
async function ask(question: string): Promise<string> {
  initInput();
  rl!.setPrompt(question);
  rl!.prompt();
  const line = await nextLine();
  return line === CLOSED ? "" : line.trim();
}

/** Pick a learning path or a journey. Returns undefined to quit. */
async function choosePath(completed: Set<string>): Promise<LearningPath | Journey | undefined> {
  print(c.bold(c.magenta("\nTERMINAL INVADERS")) + c.dim("  — choose what to learn\n"));
  LEARNING_PATHS.forEach((p, i) => {
    const done = p.missionIds.filter((id) => completed.has(id)).length;
    const total = p.missionIds.length;
    const progress = done === total ? c.green(`✓ ${done}/${total}`) : c.dim(`${done}/${total}`);
    print(`  ${c.cyan(String(i + 1))}. ${c.bold(p.title)}  ${progress}  ${c.dim(`[${p.environment}]`)}`);
    print(`       ${c.dim(p.blurb)}`);
  });
  print("");
  print(c.dim("  Journeys — one evolving project across several steps (saves your progress):"));
  JOURNEYS.forEach((j, i) => {
    const n = LEARNING_PATHS.length + i + 1;
    const mark = completed.has(j.id) ? c.green("✓ ") : "";
    print(`  ${c.cyan(String(n))}. ${mark}${c.bold(j.title)}  ${c.dim(`[${j.environment}] · ${j.steps.length} steps`)}`);
    print(`       ${c.dim(j.blurb)}`);
  });
  print("");
  const answer = await ask(c.green("select> ") + c.dim("(number, or q to quit) "));
  if (answer.toLowerCase() === "q" || answer === "") return undefined;
  const n = Number(answer);
  if (Number.isInteger(n)) {
    if (n >= 1 && n <= LEARNING_PATHS.length) return LEARNING_PATHS[n - 1];
    const j = JOURNEYS[n - LEARNING_PATHS.length - 1];
    if (j) return j;
  }
  return getPath(answer) ?? getJourney(answer);
}

/** Pick a mission within a path. Returns undefined to go back. */
async function chooseMissionInPath(
  path: LearningPath,
  completed: Set<string>,
): Promise<Mission | undefined> {
  const missions = missionsForPath(path.id);
  print("");
  print(c.bold(path.title) + c.dim(`  — ${path.environment}`));
  for (const o of path.outcomes) print(c.dim(`   • ${o}`));
  print("");
  missions.forEach((m, i) => {
    const mark = completed.has(m.id) ? c.green("✓") : c.gray("□");
    print(`  ${mark} ${c.cyan(String(i + 1))}. ${c.bold(m.title)} ${c.dim(`(${"★".repeat(m.difficulty)})`)}`);
  });
  print("");
  const answer = await ask(c.green("mission> ") + c.dim("(number, Enter = first unfinished, b = back) "));
  if (answer.toLowerCase() === "b") return undefined;
  if (answer === "") return missions.find((m) => !completed.has(m.id)) ?? missions[0];
  return missions[Number(answer) - 1] ?? getMission(answer);
}

/** Play a mission, then walk the rest of its path. */
async function playPath(start: Mission, completed: Set<string>): Promise<void> {
  let mission: Mission | undefined = start;
  while (mission) {
    await playMission(mission);
    completed.add(mission.id);
    const next = nextInPath(mission.id);
    if (!next) {
      const path = pathForMission(mission.id);
      print(c.green(c.bold(`\n★ Path complete: ${path?.title ?? ""} — every mission cleared. gg.\n`)));
      break;
    }
    const again = await ask(
      c.cyan(`\nNext: ${next.title}? `) + c.dim("[Enter = play, b = back to menu] "),
    );
    mission = again.toLowerCase() === "b" || again.toLowerCase() === "q" ? undefined : next;
  }
}

/**
 * Run one engine to completion (or until the player closes the stream). Used for
 * both standalone missions and individual journey steps. Returns whether the
 * mission/step actually completed (vs the player bailing out). Drives the single
 * shared readline via `lineHandler`.
 */
async function playEngine(engine: GameEngine, header?: string): Promise<boolean> {
  initInput();
  completerEngine = engine;
  const mission = engine.mission;
  console.clear();
  if (header) print(c.dim(header));
  print(banner(mission));
  print(checklist(engine));
  print("");

  const reprompt = () => {
    rl!.setPrompt(
      engine.editorOpen ? c.magenta(`nvim:${engine.editorStatusLine() ?? ""} `) : prompt(engine.state.cwd),
    );
    rl!.prompt();
  };

  reprompt();
  while (true) {
    const input = await nextLine();
    if (input === CLOSED) break;

    const { output, events } = engine.execute(input);

    if (output.length === 1 && output[0] === "\x1b[CLEAR\x1b[") {
      console.clear();
      if (header) print(c.dim(header));
      print(banner(mission));
    } else if (output.length) {
      print(output);
    }

    const feedback = renderEvents(events);
    if (feedback.length) print(feedback);

    if (engine.state.complete) {
      print(replayBreakdown(engine));
      print("");
      break;
    }

    // Show the live checklist after objective-changing turns.
    if (events.some((e) => e.type === "objective_complete")) {
      print("");
      print(checklist(engine));
    }

    print("");
    reprompt();
  }
  completerEngine = undefined;
  return engine.state.complete;
}

async function playMission(mission: Mission): Promise<void> {
  await playEngine(new GameEngine(mission));
}

/**
 * Play a journey: one shared world across ordered steps, with disk save/resume.
 * The world carries forward between steps; the save always points at the step
 * you'd resume into, so quitting and coming back lands you exactly there.
 */
async function playJourney(journey: Journey, completed: Set<string>): Promise<void> {
  let session: PathSession;
  const saved = loadJourneySave(journey.id);
  if (saved) {
    const ans = await ask(
      c.cyan(`Resume "${journey.title}" from step ${saved.stepIndex + 1}/${journey.steps.length}? `) +
        c.dim("[Enter = resume, n = restart] "),
    );
    if (ans.toLowerCase() === "n") {
      clearJourneySave(journey.id);
      session = new PathSession(journey);
    } else {
      session = new PathSession(journey, saved);
    }
  } else {
    session = new PathSession(journey);
  }

  while (true) {
    const header = `${journey.title}  ·  step ${session.stepIndex + 1}/${journey.steps.length}  ·  score ${session.totalScore}`;
    const done = await playEngine(session.current, header);
    if (!done) {
      saveJourney(journey.id, session.snapshot());
      print(c.dim("\nProgress saved — resume this journey anytime.\n"));
      return;
    }
    if (session.isLastStep) {
      session.advance(); // bank the final step's score
      print(c.green(c.bold(`\n★ Journey complete: ${journey.title} — score ${session.totalScore}. gg.\n`)));
      clearJourneySave(journey.id);
      completed.add(journey.id);
      return;
    }
    session.advance(); // bank the finished step, apply the next step's setup
    saveJourney(journey.id, session.snapshot());
    const ans = await ask(
      c.cyan(`\nNext: ${session.currentStep.title}? `) + c.dim("[Enter = continue, q = save & quit] "),
    );
    if (ans.toLowerCase() === "q") {
      print(c.dim("Saved — resume this journey anytime.\n"));
      return;
    }
  }
}

async function chooseSandboxMission(arg?: string): Promise<Mission | undefined> {
  const eligible = MISSIONS.filter(sandboxEligible);
  if (arg) {
    const byId = getMission(arg) ?? eligible[Number(arg) - 1];
    if (byId) return byId;
    print(c.red(`No mission "${arg}".`));
  }
  print(c.bold(c.magenta("\nTERMINAL INVADERS")) + c.dim("  — real sandbox missions\n"));
  eligible.forEach((m, i) => {
    print(`  ${c.cyan(String(i + 1))}. ${c.bold(m.title)} ${c.dim(`(${m.track}, ${"★".repeat(m.difficulty)})`)}`);
  });
  print("");
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await new Promise<string>((res) => rl.question(c.green("select> "), res));
  rl.close();
  return eligible[Number(answer.trim()) - 1] ?? getMission(answer.trim());
}

async function main(): Promise<void> {
  // Real-sandbox mode: `terminal-invaders sandbox [missionId]`
  if (process.argv[2] === "sandbox" || process.argv[2] === "--real") {
    const mission = await chooseSandboxMission(process.argv[3]);
    if (mission) await runSandbox(mission);
    return;
  }

  const completed = new Set<string>();
  const arg = process.argv[2];

  // Direct jump: `play <missionId|index>`, `play <pathId>`, or `play <journeyId>`.
  if (arg) {
    const direct = getMission(arg) ?? MISSIONS[Number(arg) - 1];
    const journey = getJourney(arg);
    if (direct) {
      await playPath(direct, completed);
    } else if (journey) {
      await playJourney(journey, completed);
    } else if (getPath(arg)) {
      const m = await chooseMissionInPath(getPath(arg)!, completed);
      if (m) await playPath(m, completed);
    } else {
      print(c.red(`No mission, path, or journey "${arg}".`));
    }
  }

  // Menu loop: choose a path or journey, play it, return to the menu.
  while (true) {
    const choice = await choosePath(completed);
    if (!choice) break;
    if ("steps" in choice) {
      await playJourney(choice, completed);
    } else {
      const mission = await chooseMissionInPath(choice, completed);
      if (mission) await playPath(mission, completed);
    }
  }
  print(c.dim("See you in the terminal. ◈"));
  rl?.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
