#!/usr/bin/env -S npx tsx
import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import { GameEngine, resolvePath, splitForCompletion, type Mission } from "@terminal-invaders/core";
import { MISSIONS, getMission } from "@terminal-invaders/missions";
import { c } from "./colors.ts";
import { banner, checklist, prompt, renderEvents, replayBreakdown } from "./render.ts";
import { runSandbox, sandboxEligible } from "./sandbox.ts";

function print(s: string | string[]): void {
  stdout.write((Array.isArray(s) ? s.join("\n") : s) + "\n");
}

/** Pick a mission: honor an id/index arg, otherwise show a menu. */
async function chooseMission(arg?: string): Promise<Mission | undefined> {
  if (arg) {
    const byId = getMission(arg);
    if (byId) return byId;
    const idx = Number(arg) - 1;
    if (Number.isInteger(idx) && MISSIONS[idx]) return MISSIONS[idx];
    print(c.red(`No mission "${arg}".`));
  }

  print(c.bold(c.magenta("\nTERMINAL INVADERS")) + c.dim("  — choose a mission\n"));
  MISSIONS.forEach((m, i) => {
    print(`  ${c.cyan(String(i + 1))}. ${c.bold(m.title)} ${c.dim(`(${m.track}, ${"★".repeat(m.difficulty)})`)}`);
  });
  print("");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await new Promise<string>((res) => rl.question(c.green("select> "), res));
  rl.close();
  const idx = Number(answer.trim()) - 1;
  return MISSIONS[idx] ?? getMission(answer.trim());
}

function buildCompleter(engine: GameEngine) {
  return (line: string): [string[], string] => {
    if (engine.editorOpen) return [[], line]; // editor manages its own input
    const trailingSpace = /\s$/.test(line);
    const tokens = line.split(/\s+/).filter(Boolean);
    const current = trailingSpace ? "" : tokens[tokens.length - 1] ?? "";
    const atCommand = tokens.length === 0 || (tokens.length === 1 && !trailingSpace);

    let candidates: string[];
    if (atCommand) {
      candidates = engine.knownCommandNames().filter((cmd) => cmd.startsWith(current));
    } else {
      const spec = engine.getCommand(tokens[0] ?? "");
      const argType = spec?.argType ?? "path";
      if (argType === "none") return [[], current];
      const { dir, fragment } = splitForCompletion(current);
      const baseDir = resolvePath(engine.state.cwd, dir || ".");
      candidates = engine.fs
        .listDir(baseDir)
        .filter((e) => (argType === "dir" ? e.node.type === "dir" : true))
        .filter((e) => e.name.startsWith(fragment))
        .map((e) => dir + e.name + (e.node.type === "dir" ? "/" : ""));
    }

    if (candidates.length > 0) engine.noteAutocompleteUsed();
    return [candidates.length ? candidates : [], current];
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

  const arg = process.argv[2];
  let mission = await chooseMission(arg);

  while (mission) {
    await playMission(mission);
    const next = MISSIONS[MISSIONS.indexOf(mission) + 1];
    if (!next) {
      print(c.green(c.bold("\nThat's the whole pack. More missions coming. gg.\n")));
      break;
    }
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const again = await new Promise<string>((res) =>
      rl.question(c.cyan(`\nNext: ${next.title}? `) + c.dim("[Enter = play, q = quit] "), res),
    );
    rl.close();
    mission = again.trim().toLowerCase() === "q" ? undefined : next;
  }
  print(c.dim("See you in the terminal. ◈"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
