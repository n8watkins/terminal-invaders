import type { Mission } from "@terminal-invaders/core";

export const deleteALine: Mission = {
  id: "lv-006",
  title: "Delete a Line",
  difficulty: 2,
  track: "lazyvim",
  briefing:
    'A leftover debug line is cluttering the file. Open server.ts, search for it with /console.log to land on it, delete the whole line with `dd`, then save with :w. Then check.',
  startingCwd: "/project/src",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/server.ts": {
      type: "file",
      content:
        "export function start(port) {\n  console.log(\"debug: starting\");\n  return listen(port);\n}",
    },
  },
  objectives: [
    { id: "find", label: 'Search to the debug line (/console.log)', type: "editor_search", pattern: "console.log" },
    { id: "delete", label: "Delete the line (dd)", type: "editor_command_used", command: "dd" },
    {
      id: "gone",
      label: 'File no longer contains "console.log"',
      type: "file_lacks",
      path: "/project/src/server.ts",
      text: "console.log",
    },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim server.ts, then /console.log to put the cursor on that line." },
    { text: "Press dd to delete the whole line, then :wq to save." },
  ],
  successMessage: "Search to the line, dd to remove it — surgical line deletion.",
};
