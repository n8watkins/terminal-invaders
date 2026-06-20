import type { Mission } from "@terminal-invaders/core";

const CONTENT = "export const VERSION = '3.0.0';";

export const inspectTheHistory: Mission = {
  id: "git-004",
  title: "Inspect the History",
  difficulty: 1,
  track: "git",
  briefing:
    "You just landed on this repo and want your bearings. List the recent commits with `git log`, then confirm the working tree is clean with `git status`. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/version.ts": { type: "file", content: CONTENT },
  },
  git: {
    head: { "/project/version.ts": CONTENT },
  },
  objectives: [
    { id: "log", label: "View the commit history (git log)", type: "git_subcommand_used", sub: "log" },
    { id: "status", label: "Check the working tree (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`git log` shows the recent commits." },
    { text: "`git status` confirms whether anything has changed." },
  ],
  successMessage: "log shows where the project has been; status shows where it is now.",
};
