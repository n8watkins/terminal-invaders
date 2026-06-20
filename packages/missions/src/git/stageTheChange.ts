import type { Mission } from "@terminal-invaders/core";

const HEAD = "export const TITLE = 'Acme';\nexport const TAGLINE = 'We ship things';";
const WORKING = "export const TITLE = 'Acme';\nexport const TAGLINE = 'We ship great things';";

export const stageTheChange: Mission = {
  id: "git-002",
  title: "Stage the Change",
  difficulty: 1,
  track: "git",
  briefing:
    "You polished the tagline in site.ts and it's ready to go into the next commit. First run `git status` to see it's unstaged, then stage it with `git add site.ts`. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/site.ts": { type: "file", content: WORKING },
  },
  git: {
    head: { "/project/site.ts": HEAD },
  },
  objectives: [
    { id: "status", label: "Check the repo state (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "staged", label: "Stage site.ts (git add)", type: "git_staged", path: "/project/site.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`git status` shows site.ts as modified but not staged." },
    { text: "Stage it: git add site.ts" },
  ],
  successMessage: "git add moves a change into the staging area, ready to commit.",
};
