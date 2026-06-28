import type { Journey } from "@terminal-invaders/core";

/**
 * "PowerShell for bash users" — a shared-world journey that teaches the four
 * everyday cmdlets by mapping each onto the bash command you already know:
 *
 *   Get-Location  ->  pwd      (where am I?)
 *   Get-ChildItem ->  ls/dir   (what's here?)
 *   Set-Location  ->  cd       (go there)
 *   Get-Content   ->  cat      (read a file)
 *   Select-String ->  grep/rg  (find text)
 *
 * It's one small project — `/repo` — that carries across all three steps: you
 * orient yourself in step 1, walk into `src` and read a file in step 2, then in
 * step 3 a teammate drops a file with a TODO into that SAME tree and you hunt it
 * down. The vocabulary is PowerShell; the muscle memory is pure bash.
 */
const README = `# Terminal Invaders (repo)

A tiny project used to practice PowerShell the way a bash user would.

- src/   the source files
- tests/ the test files

Everything you do here maps to a bash command you already know.
`;

const APP_PS1 = `# src/app.ps1 — the entry point
Write-Output "Booting Terminal Invaders..."

function Start-App {
    Write-Output "Ready."
}

Start-App
`;

const UTILS_JS = `// src/utils.js — a couple of helpers
export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
`;

const APP_TEST = `# tests/app.test.ps1
Write-Output "TODO add real assertions here later"
`;

/** The teammate's bug file dropped into the world before step 3. */
const BUG_PS1 = "# TODO: fix the boot sequence\nfunction Start-App {}\n";

export const powershellJourney: Journey = {
  id: "journey-powershell",
  title: "PowerShell for bash users",
  environment: "powershell",
  blurb:
    "Know bash but landed in a PowerShell window? One small repo, three steps. " +
    "You'll orient, navigate, read, and search — learning that pwd, ls, cd, cat, and " +
    "grep all have a Verb-Noun twin, and the moves are exactly the same.",
  outcomes: [
    "Map pwd/ls/cd/cat/grep onto Get-Location, Get-ChildItem, Set-Location, Get-Content, Select-String",
    "Navigate a real (shared) project tree using PowerShell cmdlets and their aliases",
    "Find text across a project with Select-String, the way you'd reach for grep/rg",
  ],
  world: {
    startingCwd: "/repo",
    filesystem: {
      "/repo": { type: "dir" },
      "/repo/README.md": { type: "file", content: README },
      "/repo/src": { type: "dir" },
      "/repo/src/app.ps1": { type: "file", content: APP_PS1 },
      "/repo/src/utils.js": { type: "file", content: UTILS_JS },
      "/repo/tests": { type: "dir" },
      "/repo/tests/app.test.ps1": { type: "file", content: APP_TEST },
    },
  },
  steps: [
    {
      id: "orient",
      title: "Step 1 — Orient yourself",
      briefing:
        "You've opened a PowerShell prompt inside a project and you want your bearings. " +
        "In bash you'd run `pwd` then `ls`. PowerShell spells those `Get-Location` (alias " +
        "`gl`) and `Get-ChildItem` (alias `gci`, and yes `ls`/`dir` work too). Cmdlets are " +
        "named Verb-Noun, so `Get-Location` literally means \"get the location\". Run " +
        "`Get-Location` to print the current directory, then `Get-ChildItem` to list what's " +
        "here, then `check`.",
      concepts: ["Get-Location", "Get-ChildItem"],
      objectives: [
        {
          id: "pwd",
          label: "Print where you are (Get-Location = pwd)",
          type: "command_used",
          command: "Get-Location",
        },
        {
          id: "ls",
          label: "List what's here (Get-ChildItem = ls/dir)",
          type: "command_used",
          command: "Get-ChildItem",
        },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`Get-Location` (alias `gl`) is PowerShell's `pwd` — it prints the current directory." },
        { text: "`Get-ChildItem` (alias `gci`, also `ls`/`dir`) is PowerShell's directory listing." },
        { text: "Run both, then `check` — the world remembers where you've looked." },
      ],
      successMessage:
        "Oriented. `Get-Location` is pwd and `Get-ChildItem` is ls — same moves, Verb-Noun names.",
    },
    {
      id: "move-read",
      title: "Step 2 — Walk in and read a file",
      briefing:
        "The listing showed a `src` folder. In bash you'd `cd src` and `cat` a file; in " +
        "PowerShell that's `Set-Location src` (alias `sl`, and `cd` is an alias here too) " +
        "followed by `Get-Content` (alias `gc`), which prints a file just like `cat`. Move " +
        "into `src`, then read `app.ps1` with `Get-Content app.ps1`, then `check`.",
      concepts: ["Set-Location", "Get-Content"],
      objectives: [
        { id: "in-src", label: "Move into src (Set-Location = cd)", type: "cwd_is", path: "/repo/src" },
        {
          id: "read",
          label: "Read a file (Get-Content = cat)",
          type: "command_used",
          command: "Get-Content",
        },
        { id: "opened", label: "Open src/app.ps1", type: "file_opened", path: "/repo/src/app.ps1" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`Set-Location src` (alias `sl`, or just `cd src`) walks you into the folder." },
        { text: "Confirm with `Get-Location` — you should now be in /repo/src." },
        { text: "`Get-Content app.ps1` (alias `gc`) prints the file, exactly like `cat`." },
      ],
      successMessage:
        "Nice — `Set-Location` is cd and `Get-Content` is cat. You're standing in src with the file read.",
    },
    {
      id: "search",
      title: "Step 3 — Hunt down a TODO",
      briefing:
        "A teammate just pushed `src/bug.ps1` into this same repo and left a TODO in it. In " +
        "bash you'd reach for `grep` or `rg`; PowerShell's equivalent is `Select-String` " +
        "(alias `sls`), which scans file contents and prints each matching line with its " +
        "file and line number. Find the TODO with `Select-String TODO`, then `check`.",
      concepts: ["Select-String"],
      setup: {
        writeFiles: {
          "/repo/src/bug.ps1": BUG_PS1,
        },
      },
      objectives: [
        {
          id: "grep",
          label: "Search file contents (Select-String = grep/rg)",
          type: "command_used",
          command: "Select-String",
        },
        {
          id: "found",
          label: "Locate the TODO in src/bug.ps1",
          type: "search_performed",
          query: "TODO",
          expectedPath: "/repo/src/bug.ps1",
        },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`Select-String TODO` (alias `sls`) is PowerShell's grep — it searches every file's text." },
        { text: "The match line shows the file path and line number, so you can jump straight to it." },
        { text: "Once the hit points at /repo/src/bug.ps1, run `check`." },
      ],
      successMessage:
        "Found it. `Select-String` is grep/rg — that's the last of the five cmdlets every bash user needs.",
    },
  ],
};
