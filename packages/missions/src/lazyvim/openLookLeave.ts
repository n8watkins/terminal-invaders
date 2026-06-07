import type { Mission } from "@terminal-invaders/core";

export const openLookLeave: Mission = {
  id: "lv-001",
  title: "Open, Look, Leave",
  difficulty: 1,
  track: "lazyvim",
  briefing:
    "The core nvim loop: open a file, search inside it with /, and quit. Open utils.ts, search for \"export\", then :q to leave — and run check.",
  startingCwd: "/project/src",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/utils.ts": {
      type: "file",
      content: "const internal = 1;\n\nexport function add(a, b) {\n  return a + b;\n}\n\nexport const PI = 3.14;",
    },
  },
  objectives: [
    { id: "open", label: "Open utils.ts in nvim", type: "command_used", command: "nvim" },
    { id: "search", label: 'Search inside the file for "export" (/export)', type: "editor_search", pattern: "export" },
    { id: "quit", label: "Quit the editor (:q)", type: "editor_command_used", command: ":q" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim utils.ts" },
    { text: "Inside nvim, search with a slash: /export" },
    { text: "Leave with :q (you made no changes, so it's allowed)." },
  ],
  successMessage: "That's the rhythm — open, navigate, leave without fear.",
};
