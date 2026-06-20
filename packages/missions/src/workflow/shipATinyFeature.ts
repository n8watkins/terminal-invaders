import type { Mission } from "@terminal-invaders/core";

const HEAD_FLAGS = "export const flags = {\n  darkMode: true,\n  beta: false,\n};";

export const shipATinyFeature: Mission = {
  id: "workflow-010",
  title: "Ship a Tiny Feature (boss)",
  difficulty: 3,
  track: "workflow",
  briefing:
    "Ship a feature flag end to end: explore with tree, cd into src/config, find flags.ts with rg, open it, add a newFeature flag, save, then git add and git commit. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/README.md": { type: "file", content: "# Acme Web" },
    "/project/src": { type: "dir" },
    "/project/src/config": { type: "dir" },
    "/project/src/config/flags.ts": { type: "file", content: HEAD_FLAGS },
  },
  git: {
    head: { "/project/src/config/flags.ts": HEAD_FLAGS },
  },
  objectives: [
    { id: "survey", label: "Survey the tree (tree)", type: "command_used", command: "tree" },
    { id: "enter-config", label: "Enter src/config", type: "cwd_is", path: "/project/src/config" },
    {
      id: "search-flags",
      label: "Find the flags file",
      type: "search_performed",
      query: "export const flags",
      expectedPath: "/project/src/config/flags.ts",
    },
    { id: "open-flags", label: "Open flags.ts in nvim", type: "file_opened", path: "/project/src/config/flags.ts" },
    { id: "edited", label: "File now declares newFeature", type: "file_contains", path: "/project/src/config/flags.ts", text: "newFeature" },
    { id: "saved", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "committed", label: "Commit the feature (git commit -m)", type: "git_committed" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Explore first: tree, then cd src/config" },
    { text: 'Find and open the file: rg "export const flags" then nvim flags.ts' },
    { text: 'Add a line with o (e.g. `  newFeature: true,`), :wq, then git add flags.ts and git commit -m "Add newFeature flag".' },
  ],
  successMessage: "Explore, find, edit, save, commit — you shipped a feature end to end.",
};
