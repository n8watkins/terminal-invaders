import type { Journey } from "@terminal-invaders/core";

/**
 * "Acme Repo" — a shared-world git journey. One repository, four steps, and the
 * state carries the whole way through: the commit you make in step 1 shows up in
 * step 2's `git log`; the bad change a teammate drops in step 3 is discarded from
 * the same working tree; the boss ships a new file into the same history.
 *
 * The world's `git.head` is the committed baseline; the working-tree `filesystem`
 * starts with an uncommitted edit to README (so step 1 has something to commit).
 */
const COMMITTED_README = "# Acme\n\nThe Acme service.\n";
const WORKING_README = "# Acme\n\nThe Acme service.\n\n## Setup\n\nRun `npm start` to boot the dev server.\n";
const SERVER_OK = "function start() {\n  return 'ok';\n}\n";
const SERVER_BROKEN = "function start() {\n  return undefined; // oops — broke the boot\n}\n";

export const gitSafetyJourney: Journey = {
  id: "journey-git-safety",
  title: "Acme Repo: a day in git",
  environment: "tool:git",
  blurb: "One repo, four steps. Commit a change, watch it land in history, recover from a bad edit, and ship a fix — the working tree carries the whole way.",
  outcomes: [
    "Run the stage → commit loop on a real, evolving repo",
    "See your own commit persist into later steps via git log",
    "Recover a working-tree change with git restore",
  ],
  world: {
    startingCwd: "/acme",
    filesystem: {
      "/acme": { type: "dir" },
      "/acme/README.md": { type: "file", content: WORKING_README },
      "/acme/src": { type: "dir" },
      "/acme/src/server.js": { type: "file", content: SERVER_OK },
    },
    git: {
      head: {
        "/acme/README.md": COMMITTED_README,
        "/acme/src/server.js": SERVER_OK,
      },
    },
  },
  steps: [
    {
      id: "first-commit",
      title: "Step 1 — Make your first commit",
      briefing:
        "The README has an uncommitted Setup section in the working tree. Stage it and commit it. Inspect with `git status` first, then `git add README.md`, then `git commit -m \"...\"`.",
      concepts: ["status", "add", "commit"],
      objectives: [
        { id: "see-status", label: "Inspect the change (git status)", type: "git_subcommand_used", sub: "status" },
        { id: "stage-readme", label: "Stage README.md (git add)", type: "git_staged", path: "/acme/README.md" },
        { id: "commit", label: "Commit the change (git commit)", type: "git_committed" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`git status` shows the README is modified but not staged." },
        { text: "Stage it: `git add README.md` — then `git status` again to confirm." },
        { text: 'Commit it: `git commit -m "Document setup"`.' },
      ],
      successMessage: "Committed. That snapshot is now part of the repo's history.",
    },
    {
      id: "confirm-landed",
      title: "Step 2 — Confirm it landed",
      briefing:
        "Your commit from step 1 is still here — this is the same repo. Prove it: `git log` lists your commit, and `git diff` shows a clean working tree (nothing pending).",
      concepts: ["log", "diff"],
      objectives: [
        { id: "see-log", label: "View history (git log)", type: "git_subcommand_used", sub: "log" },
        { id: "see-diff", label: "Confirm nothing pending (git diff)", type: "git_subcommand_used", sub: "diff" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`git log` lists commits newest-first — your step 1 commit is at the top." },
        { text: "`git diff` on a clean tree prints `(no changes)`." },
      ],
      successMessage: "History persisted across steps — that's the shared world.",
    },
    {
      id: "recover-bad-change",
      title: "Step 3 — Recover from a bad change",
      briefing:
        "A teammate's edit broke src/server.js in the working tree (it now returns undefined). You haven't staged it. Inspect it with `git diff`, then throw it away with `git restore src/server.js`.",
      concepts: ["diff", "restore"],
      setup: { writeFiles: { "/acme/src/server.js": SERVER_BROKEN } },
      objectives: [
        { id: "see-damage", label: "Inspect the damage (git diff)", type: "git_subcommand_used", sub: "diff" },
        { id: "restore", label: "Discard the change (git restore)", type: "git_clean", path: "/acme/src/server.js" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`git diff` shows server.js now returns undefined instead of 'ok'." },
        { text: "Discard the working-tree change: `git restore src/server.js`." },
      ],
      successMessage: "Restored. The working tree matches the last commit again — crisis averted.",
    },
    {
      id: "ship-it",
      title: "Step 4 — Ship a fix cleanly (boss)",
      briefing:
        "A new CHANGELOG.md landed in the working tree, untracked. Ship it: stage it, then commit so it's tracked and the tree is clean. `git add CHANGELOG.md`, then `git commit`.",
      concepts: ["status", "add", "commit"],
      setup: {
        writeFiles: {
          "/acme/CHANGELOG.md": "# Changelog\n\n- Document setup steps.\n- Fix server boot.\n",
        },
      },
      objectives: [
        { id: "stage-changelog", label: "Stage CHANGELOG.md (git add)", type: "git_staged", path: "/acme/CHANGELOG.md" },
        { id: "clean-tree", label: "Commit so the tree is clean (git commit)", type: "git_clean", path: "/acme/CHANGELOG.md" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`git status` shows CHANGELOG.md as untracked." },
        { text: "Stage it: `git add CHANGELOG.md`." },
        { text: 'Commit it: `git commit -m "Add changelog"` — now the tree is clean.' },
      ],
      successMessage: "Shipped. You ran the full git loop on one evolving repo — that's the day.",
    },
  ],
};
