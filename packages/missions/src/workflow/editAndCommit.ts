import type { Mission } from "@terminal-invaders/core";

const HEAD = "export const VERSION = '1.0.0';";

export const editAndCommit: Mission = {
  id: "workflow-008",
  title: "Edit and Commit",
  difficulty: 3,
  track: "workflow",
  briefing:
    "Bump the version in version.ts to 1.1.0, then commit the change. Open it in nvim, substitute the version with :%s, save, then git add and git commit. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/version.ts": { type: "file", content: HEAD },
  },
  git: {
    head: { "/project/version.ts": HEAD },
  },
  objectives: [
    { id: "open-version", label: "Open version.ts in nvim", type: "file_opened", path: "/project/version.ts" },
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "bumped", label: "File now contains 1.1.0", type: "file_contains", path: "/project/version.ts", text: "1.1.0" },
    { id: "saved", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "committed", label: "Commit the bump (git commit -m)", type: "git_committed" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim version.ts" },
    { text: "Bump the version: :%s/1.0.0/1.1.0/g then :wq" },
    { text: 'Stage and commit: git add version.ts then git commit -m "Bump to 1.1.0"' },
  ],
  successMessage: "Edit, save, add, commit — the everyday change-and-ship loop.",
};
