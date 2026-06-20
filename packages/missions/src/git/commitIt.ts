import type { Mission } from "@terminal-invaders/core";

const HEAD = "export function total(items) {\n  return 0;\n}";
const WORKING = "export function total(items) {\n  return items.reduce((a, b) => a + b, 0);\n}";

export const commitIt: Mission = {
  id: "git-003",
  title: "Commit It",
  difficulty: 2,
  track: "git",
  briefing:
    "You finished the total() implementation in sum.ts. Stage it with `git add sum.ts`, then record it in history with `git commit -m \"...\"`. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/sum.ts": { type: "file", content: WORKING },
  },
  git: {
    head: { "/project/sum.ts": HEAD },
  },
  objectives: [
    { id: "staged", label: "Stage sum.ts (git add)", type: "git_staged", path: "/project/sum.ts" },
    { id: "committed", label: "Commit the change (git commit -m)", type: "git_committed" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Stage the file first: git add sum.ts" },
    { text: 'Then commit it: git commit -m "Implement total()"' },
    { text: "A commit needs a staged change — add before you commit." },
  ],
  successMessage: "add then commit -m: your work is now saved in the project's history.",
};
