#!/usr/bin/env -S npx tsx
import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import { GameEngine, completionCandidates, type Mission } from "@terminal-invaders/core";
import {
  LEARNING_PATHS,
  MISSIONS,
  getMission,
  getPath,
  missionsForPath,
  nextInPath,
  pathForMission,
  type LearningPath,
} from "@terminal-invaders/missions";
import { c } from "./colors.ts";
import { banner, checklist, prompt, renderEvents, replayBreakdown } from "./render.ts";
import { runSandbox, sandboxEligible } from "./sandbox.ts";

function print(s: string | string[]): void {
  stdout.write((Array.isArray(s) ? s.join("\n") : s) + "\n");
}

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await new Promise<string>((res) => rl.question(question, res));
  rl.close();
  return answer.trim();
}

/** Pick a learning path. Returns undefined to quit. */
async function choosePath(completed: Set<string>): Promise<LearningPath | undefined> {
  print(c.bold(c.magenta("\nTERMINAL INVADERS")) + c.dim("  — choose what to learn\n"));
  LEARNING_PATHS.forEach((p, i) => {
    const done = p.missionIds.filter((id) => completed.has(id)).length;
    const total = p.missionIds.length;
    const progress = done === total ? c.green(`✓ ${done}/${total}`) : c.dim(`${done}/${total}`);
    print(`  ${c.cyan(String(i + 1))}. ${c.bold(p.title)}  ${progress}  ${c.dim(`[${p.environment}]`)}`);
    print(`       ${c.dim(p.blurb)}`);
  });
  print("");
  const answer = await ask(c.green("path> ") + c.dim("(number, or q to quit) "));
  if (answer.toLowerCase() === "q" || answer === "") return undefined;
  return LEARNING_PATHS[Number(answer) - 1] ?? getPath(answer);
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

function buildCompleter(engine: GameEngine) {
  return (line: string): [string[], string] => {
    if (engine.editorOpen) return [[], line]; // editor manages its own input
    // Same completion brain as the web app — just adapted to readline's
    // [candidates, prefix] shape, with a "/" appended to directories.
    const { current, candidates, dirs } = completionCandidates(line, engine);
    if (candidates.length > 0) engine.noteAutocompleteUsed();
    return [candidates.map((cand) => (dirs.has(cand) ? `${cand}/` : cand)), current];
  };
}

async function playMission(mission: Mission): Promise<void> {
  const engine = new GameEngine(mission);
  console.clear();
  print(banner(mission));
  print(checklist(engine));
  print("");

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    completer: buildCompleter(engine),
    historySize: 200,
  });

  const ask = () =>
    rl.setPrompt(
      engine.editorOpen ? c.magenta(`nvim:${engine.editorStatusLine() ?? ""} `) : prompt(engine.state.cwd),
    );

  await new Promise<void>((resolve) => {
    ask();
    rl.prompt();

    rl.on("line", (line) => {
      const { output, events } = engine.execute(line);

      if (output.length === 1 && output[0] === "\x1b[CLEAR\x1b[") {
        console.clear();
        print(banner(mission));
      } else if (output.length) {
        print(output);
      }

      const feedback = renderEvents(events);
      if (feedback.length) print(feedback);

      if (engine.state.complete) {
        print(replayBreakdown(engine));
        print("");
        rl.close();
        resolve();
        return;
      }

      // Show the live checklist after objective-changing turns.
      if (events.some((e) => e.type === "objective_complete")) {
        print("");
        print(checklist(engine));
      }

      print("");
      ask();
      rl.prompt();
    });

    rl.on("close", () => resolve());
  });
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

  // Direct jump: `play <missionId|index>` or `play <pathId>` skips the path menu.
  if (arg) {
    const direct = getMission(arg) ?? MISSIONS[Number(arg) - 1];
    if (direct) {
      await playPath(direct, completed);
    } else if (getPath(arg)) {
      const m = await chooseMissionInPath(getPath(arg)!, completed);
      if (m) await playPath(m, completed);
    } else {
      print(c.red(`No mission or path "${arg}".`));
    }
  }

  // Path menu loop: choose a path → choose a mission → walk the path → repeat.
  while (true) {
    const path = await choosePath(completed);
    if (!path) break;
    const mission = await chooseMissionInPath(path, completed);
    if (mission) await playPath(mission, completed);
  }
  print(c.dim("See you in the terminal. ◈"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
