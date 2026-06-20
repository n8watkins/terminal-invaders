import type { Mission } from "@terminal-invaders/core";

const HEAD = "export const PORT = 3000;\nexport const HOST = 'localhost';";
const WORKING = "export const PORT = 9999;\nexport const HOST = 'localhost';";

export const discardWorkingChanges: Mission = {
  id: "git-006",
  title: "Discard Working Changes",
  difficulty: 2,
  track: "git",
  briefing:
    "You changed PORT in server.ts while debugging and want to throw that experiment away. Inspect it with `git status`, then discard the working changes with `git restore server.ts` to get the committed version back. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/server.ts": { type: "file", content: WORKING },
  },
  git: {
    head: { "/project/server.ts": HEAD },
  },
  objectives: [
    { id: "status", label: "See the modified file (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "clean", label: "Restore server.ts to the committed version", type: "git_clean", path: "/project/server.ts" },
    { id: "restored", label: "Confirm PORT 3000 is back", type: "file_contains", path: "/project/server.ts", text: "PORT = 3000" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`git status` shows server.ts as modified." },
    { text: "Discard the change: git restore server.ts" },
    { text: "`git restore <file>` rewrites the working file from the last commit." },
  ],
  successMessage: "git restore is the safe undo for uncommitted work.",
};
