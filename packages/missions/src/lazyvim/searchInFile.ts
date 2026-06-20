import type { Mission } from "@terminal-invaders/core";

export const searchInFile: Mission = {
  id: "lv-005",
  title: "Search in File",
  difficulty: 2,
  track: "lazyvim",
  briefing:
    'You need to find where the timeout is configured. Open config.ts, search inside it for "timeout" with /timeout, then quit with :q. Then check.',
  startingCwd: "/project/src",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/config.ts": {
      type: "file",
      content:
        "export const config = {\n  retries: 3,\n  timeout: 1000,\n  baseUrl: \"https://api.acme.com\",\n};",
    },
  },
  objectives: [
    { id: "search", label: 'Search inside the file for "timeout" (/timeout)', type: "editor_search", pattern: "timeout" },
    { id: "quit", label: "Quit the editor (:q)", type: "editor_command_used", command: ":q" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim config.ts" },
    { text: "Inside nvim, search with a slash: /timeout" },
    { text: "You made no changes, so :q quits cleanly." },
  ],
  successMessage: "Slash-search jumps you straight to the line that matters.",
};
