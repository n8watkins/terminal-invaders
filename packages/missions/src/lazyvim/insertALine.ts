import type { Mission } from "@terminal-invaders/core";

export const insertALine: Mission = {
  id: "lv-003",
  title: "Insert a Line",
  difficulty: 1,
  track: "lazyvim",
  briefing:
    'The notes file is empty under its heading. Open notes.md, enter insert mode with `i`, type a line containing "First note", press `esc`, save with :w, then :q to leave. Then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/notes.md": { type: "file", content: "# Notes\n" },
  },
  objectives: [
    { id: "insert", label: "Enter insert mode (i)", type: "editor_command_used", command: "i" },
    {
      id: "typed",
      label: 'Add a line containing "First note"',
      type: "file_contains",
      path: "/project/notes.md",
      text: "First note",
    },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim notes.md" },
    { text: "Press i to enter insert mode, type `- First note`, esc, :w to save, then :q to leave." },
  ],
  successMessage: "Insert, escape, write — a fresh line lands in the file.",
};
