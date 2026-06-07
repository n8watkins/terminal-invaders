import type { Mission } from "@terminal-invaders/core";

const HEAD_CONFIG = "export const config = {\n  retries: 3,\n  timeout: 1000,\n};";
const WORKING_CONFIG = "export const config = {\n  retries: 5,\n  timeout: 1000,\n};";

export const whatChanged: Mission = {
  id: "git-001",
  title: "What Changed?",
  difficulty: 1,
  track: "git",
  briefing:
    "Someone edited config.ts but you don't know what they changed. Use `git status` to see the state, then `git diff` to see the actual change. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/config.ts": { type: "file", content: WORKING_CONFIG },
    "/project/README.md": { type: "file", content: "# Service" },
  },
  git: {
    head: {
      "/project/config.ts": HEAD_CONFIG,
      "/project/README.md": "# Service",
    },
  },
  objectives: [
    { id: "status", label: "Check the repo state (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "diff", label: "See what changed (git diff)", type: "git_subcommand_used", sub: "diff" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`git status` shows which files are modified." },
    { text: "`git diff` shows the exact lines that changed." },
  ],
  successMessage: "status then diff — always know what changed before you act.",
};
