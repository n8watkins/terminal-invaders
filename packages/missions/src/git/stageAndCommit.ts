import type { Mission } from "@terminal-invaders/core";

const HEAD = "export function greet(name) {\n  return `Hi ${name}`;\n}";
const WORKING = "export function greet(name) {\n  return `Hello, ${name}!`;\n}";

export const stageAndCommit: Mission = {
  id: "git-005",
  title: "Stage and Commit",
  difficulty: 2,
  track: "git",
  briefing:
    "You improved the greeting in greet.ts and it's ready to ship. Stage it with `git add`, then commit it with `git commit -m \"...\"`. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/greet.ts": { type: "file", content: WORKING },
  },
  git: {
    head: { "/project/greet.ts": HEAD },
  },
  objectives: [
    { id: "staged", label: "Stage greet.ts (git add)", type: "git_staged", path: "/project/greet.ts" },
    { id: "committed", label: "Commit the change (git commit -m)", type: "git_committed" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Stage the file: git add greet.ts" },
    { text: 'Commit it: git commit -m "Improve greeting"' },
    { text: "Use `git status` along the way to watch the file move from unstaged to staged." },
  ],
  successMessage: "add → commit. Your change is saved to history.",
};
