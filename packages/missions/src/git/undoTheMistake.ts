import type { Mission } from "@terminal-invaders/core";

const GOOD = "export const API_URL = 'https://api.acme.com';\nexport const VERSION = '2.1.0';";
const BROKEN = "export const API_URL = 'http://localhost:9999';\nexport const VERSION = 'oops';";

export const undoTheMistake: Mission = {
  id: "git-009",
  title: "Undo the Mistake (boss)",
  difficulty: 3,
  track: "git",
  briefing:
    "A bad experiment clobbered env.ts and broke the build — and it was never committed. Inspect the damage with `git diff`, then throw the working changes away with `git restore` to get back to the committed version. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/env.ts": { type: "file", content: BROKEN },
  },
  git: {
    head: { "/project/env.ts": GOOD },
  },
  objectives: [
    { id: "diff", label: "Inspect the damage (git diff)", type: "git_subcommand_used", sub: "diff" },
    { id: "restored", label: "Restore env.ts to the committed version", type: "git_clean", path: "/project/env.ts" },
    { id: "verified", label: "Confirm the good URL is back", type: "file_contains", path: "/project/env.ts", text: "api.acme.com" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "See what's different from the last commit: git diff" },
    { text: "Discard the working changes: git restore env.ts" },
    { text: "`git restore` is the safe undo — it brings back the committed version." },
  ],
  successMessage: "git restore is your safety net — you can always get back to a clean state.",
};
