import type { Mission } from "@terminal-invaders/core";

const AUTH_HEAD = "export function login(user) {\n  return checkPassword(user);\n}";
const AUTH_WORKING = "export function login(user) {\n  return true; // TODO bypass\n}"; // broken hack — discard

const README_HEAD = "# Acme\n\nA service.";
const README_WORKING = "# Acme\n\nA fast, reliable service."; // real improvement — commit

export const cleanSlate: Mission = {
  id: "git-010",
  title: "Clean Slate (boss)",
  difficulty: 3,
  track: "git",
  briefing:
    "Two uncommitted changes are mixed together: a broken auth hack in auth.ts and a genuine docs improvement in README.md. Review them with `git diff`. Then `git restore auth.ts` to throw the hack away, and `git add README.md` + `git commit -m \"...\"` to ship the docs. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/auth.ts": { type: "file", content: AUTH_WORKING },
    "/project/README.md": { type: "file", content: README_WORKING },
  },
  git: {
    head: {
      "/project/auth.ts": AUTH_HEAD,
      "/project/README.md": README_HEAD,
    },
  },
  objectives: [
    { id: "diff", label: "Review both changes (git diff)", type: "git_subcommand_used", sub: "diff" },
    { id: "authclean", label: "Restore auth.ts to the committed version", type: "git_clean", path: "/project/auth.ts" },
    { id: "noback", label: "Confirm the bypass hack is gone", type: "file_lacks", path: "/project/auth.ts", text: "TODO bypass" },
    { id: "authsafe", label: "Confirm real auth is back", type: "file_contains", path: "/project/auth.ts", text: "checkPassword(user)" },
    { id: "committed", label: "Commit the README improvement", type: "git_committed" },
    // git_clean (not file_contains) so this only flips once README is actually
    // committed — a file_contains on its working text is true from the start and
    // would latch before the player does anything.
    { id: "docsshipped", label: "Confirm README is committed (clean tree)", type: "git_clean", path: "/project/README.md" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Start with `git diff` to see both files' changes side by side." },
    { text: "Throw away the hack: git restore auth.ts" },
    { text: 'Ship the docs: git add README.md then git commit -m "Improve README"' },
  ],
  successMessage: "restore what's bad, commit what's good — a clean slate, intentionally.",
};
