import type { Mission } from "@terminal-invaders/core";

const HEAD = "export function discount(price) {\n  return price;\n}";
const WORKING = "export function discount(price) {\n  return price * 0.9;\n}";

export const inspectBeforeYouCommit: Mission = {
  id: "git-007",
  title: "Inspect Before You Commit",
  difficulty: 2,
  track: "git",
  briefing:
    "discount.ts has an uncommitted change. Do it properly: `git status` to see it, `git diff` to review the change, `git add discount.ts` to stage it, then `git commit -m \"...\"`. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/discount.ts": { type: "file", content: WORKING },
  },
  git: {
    head: { "/project/discount.ts": HEAD },
  },
  objectives: [
    { id: "status", label: "Check the state (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "diff", label: "Review the change (git diff)", type: "git_subcommand_used", sub: "diff" },
    { id: "staged", label: "Stage discount.ts (git add)", type: "git_staged", path: "/project/discount.ts" },
    { id: "committed", label: "Commit the change (git commit -m)", type: "git_committed" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Start with `git status`, then `git diff` to read the actual change." },
    { text: "Stage it: git add discount.ts" },
    { text: 'Commit it: git commit -m "Apply 10% discount"' },
  ],
  successMessage: "status → diff → add → commit: review before you record.",
};
