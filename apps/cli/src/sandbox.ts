import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  VirtualFs,
  createInitialState,
  isObjectiveComplete,
  isSandboxObservable,
  type Mission,
  type Objective,
} from "@terminal-invaders/core";
import { c } from "./colors.ts";

const BASE = path.join(os.homedir(), ".terminal-invaders", "runs");
/** The virtual filesystem root every mission hangs off of. */
const VROOT = "/project";

export type SandboxRun = { runDir: string; projectDir: string; hasGit: boolean };

/** Map a virtual path ("/project/src/x") to its on-disk location inside the run. */
function diskPath(runDir: string, virtualPath: string): string {
  return path.join(runDir, virtualPath);
}

/** Map a git-relative path ("src/x") back to its virtual path. */
function toVirtual(rel: string): string {
  return `${VROOT}/${rel}`.replace(/\/+/g, "/");
}
function toRel(virtualPath: string): string {
  return virtualPath.slice(`${VROOT}/`.length);
}

export function assertSafe(dir: string): void {
  const resolved = path.resolve(dir);
  const base = path.resolve(BASE);
  // Exact prefix match on a path boundary — a string `startsWith` would let a
  // sibling like `<base>-evil` slip past the guard.
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`refusing to operate outside the sandbox base: ${resolved}`);
  }
}

function git(projectDir: string, args: string[]): string {
  return execFileSync("git", args, { cwd: projectDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

/** Materialize a mission as real files on disk, git-initialised if it has a git config. */
export function createSandbox(mission: Mission): SandboxRun {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(BASE, `${mission.id}-${stamp}`);
  assertSafe(runDir);
  const projectDir = diskPath(runDir, VROOT);

  const writeVirtual = (vpath: string, content: string) => {
    const target = diskPath(runDir, vpath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };

  // Create directories first.
  for (const [vpath, node] of Object.entries(mission.filesystem)) {
    if (node.type === "dir") fs.mkdirSync(diskPath(runDir, vpath), { recursive: true });
  }

  const hasGit = Boolean(mission.git) && gitAvailable();

  if (hasGit && mission.git) {
    // 1. Lay down the committed (HEAD) content and make the initial commit.
    for (const [vpath, content] of Object.entries(mission.git.head)) writeVirtual(vpath, content);
    git(projectDir, ["init", "-q", "-b", "main"]);
    git(projectDir, ["config", "user.email", "player@terminal-invaders.local"]);
    git(projectDir, ["config", "user.name", "Player"]);
    git(projectDir, ["add", "-A"]);
    git(projectDir, ["commit", "-q", "-m", "init"]);
  }

  // 2. Write the working-tree content (overwrites HEAD where the mission starts dirty).
  for (const [vpath, node] of Object.entries(mission.filesystem)) {
    if (node.type === "file") writeVirtual(vpath, node.content ?? "");
  }

  return { runDir, projectDir, hasGit };
}

function gitAvailable(): boolean {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Read the mission's known paths back from disk into a VirtualFs for validation. */
function snapshotFs(mission: Mission, runDir: string): VirtualFs {
  const nodes: Record<string, { type: "file" | "dir"; content?: string }> = {};
  for (const [vpath, node] of Object.entries(mission.filesystem)) {
    if (node.type === "dir") {
      nodes[vpath] = { type: "dir" };
    } else {
      const target = diskPath(runDir, vpath);
      nodes[vpath] = { type: "file", content: fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "" };
    }
  }
  return new VirtualFs(nodes);
}

type GitSnapshot = { stagedPaths: string[]; modifiedPaths: string[]; commits: number };

function snapshotGit(run: SandboxRun, mission: Mission): GitSnapshot {
  if (!run.hasGit) return { stagedPaths: [], modifiedPaths: [], commits: 0 };
  const staged = new Set<string>();
  const modified: string[] = [];
  const porcelain = git(run.projectDir, ["status", "--porcelain=v1"]);
  for (const raw of porcelain.split("\n")) {
    if (!raw.trim()) continue;
    const index = raw[0];
    const work = raw[1];
    let file = raw.slice(3).trim();
    // Renames/copies report "old -> new"; the new path is what's on disk. No
    // mission renames today, but parse it correctly rather than mangling it.
    if ((index === "R" || index === "C") && file.includes(" -> ")) {
      file = file.split(" -> ")[1] ?? file;
    }
    const vpath = toVirtual(file);
    if (index !== " " && index !== "?") staged.add(vpath);
    if (work !== " " || index === "?") modified.push(vpath);
  }
  // A change is "staged or beyond" if it's currently staged OR already committed
  // (its committed content diverged from the mission's original HEAD). Without
  // this, polling can't latch a stage→commit that happens between two ticks.
  for (const [vpath, original] of Object.entries(mission.git?.head ?? {})) {
    let headContent: string | undefined;
    try {
      headContent = git(run.projectDir, ["show", `HEAD:${toRel(vpath)}`]);
    } catch {
      headContent = undefined;
    }
    if (headContent !== undefined && headContent !== original) staged.add(vpath);
  }
  const count = Number(git(run.projectDir, ["rev-list", "--count", "HEAD"]).trim() || "0");
  // The mission's own setup made 1 commit; anything beyond that is the player's.
  return { stagedPaths: [...staged], modifiedPaths: modified, commits: Math.max(0, count - 1) };
}

/** Evaluate the disk-observable objectives against the current on-disk state. */
export function validateSandbox(
  mission: Mission,
  run: SandboxRun,
): { objective: Objective; complete: boolean }[] {
  const vfs = snapshotFs(mission, run.runDir);
  const g = snapshotGit(run, mission);
  const state = createInitialState(mission);
  state.gitStagedPaths = g.stagedPaths;
  state.gitModifiedPaths = g.modifiedPaths;
  state.gitCommits = g.commits;

  return mission.objectives
    .filter(isSandboxObservable)
    .map((objective) => ({ objective, complete: isObjectiveComplete(objective, state, vfs) }));
}

export function sandboxEligible(mission: Mission): boolean {
  return mission.objectives.some(isSandboxObservable);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Set up the sandbox, print instructions, then poll until objectives are met. */
export async function runSandbox(mission: Mission): Promise<void> {
  if (!sandboxEligible(mission)) {
    console.log(
      c.red(`"${mission.title}" has no objectives that can be checked from disk yet.`),
      "\nSandbox missions need file/git outcomes (edit a file, stage, commit, restore).",
    );
    return;
  }

  const run = createSandbox(mission);

  console.log(c.cyan("─".repeat(56)));
  console.log(`${c.bold(c.magenta("TERMINAL INVADERS"))} ${c.dim("· real sandbox ·")} ${c.bold(mission.title)}`);
  console.log(c.cyan("─".repeat(56)));
  console.log(`\n${mission.briefing}\n`);
  console.log(c.bold("Your sandbox is ready (isolated — your real projects are untouched):"));
  console.log(`  ${c.green("cd")} ${run.projectDir}`);
  console.log(c.dim("  Then use your real shell, nvim, and git. This window watches and scores.\n"));
  if (mission.git && !run.hasGit) {
    console.log(c.yellow("  (git not found on PATH — git objectives can't be checked here.)\n"));
  }
  console.log(c.dim(`Hints: ${mission.hints.map((h) => h.text).join(" · ")}\n`));

  const completed = new Set<string>();
  const render = () => {
    for (const { objective, complete } of validateSandbox(mission, run)) {
      if (complete && !completed.has(objective.id)) {
        completed.add(objective.id);
        console.log(c.green(`  ✓ ${objective.label}`));
      }
    }
  };

  const total = mission.objectives.filter(isSandboxObservable).length;
  console.log(c.bold("Objectives (auto-checked):"));
  for (const o of mission.objectives.filter(isSandboxObservable)) console.log(`  ${c.gray("□")} ${o.label}`);
  console.log(c.dim("\nWatching for changes… (Ctrl+C to stop)\n"));

  // Poll the filesystem; cheap for tiny missions and lets the player work freely.
  while (completed.size < total) {
    render();
    if (completed.size >= total) break;
    await sleep(1200);
  }

  console.log(`\n${c.green(c.bold("★ MISSION COMPLETE ★"))}  ${mission.successMessage}`);
  console.log(c.dim(`Sandbox left in place for inspection: ${run.projectDir}`));
}
