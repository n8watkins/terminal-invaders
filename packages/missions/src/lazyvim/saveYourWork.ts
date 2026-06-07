import type { Mission } from "@terminal-invaders/core";

export const saveYourWork: Mission = {
  id: "lv-002",
  title: "Save Your Work",
  difficulty: 2,
  track: "lazyvim",
  briefing:
    'The TODO list is missing an item. Open todo.md, enter insert mode with `i`, type a line containing "Ship it", press `esc`, then save and quit with :wq. Then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/todo.md": { type: "file", content: "# TODO\n\n- Write tests\n- Review PR" },
  },
  objectives: [
    { id: "insert", label: "Enter insert mode (i)", type: "editor_command_used", command: "i" },
    { id: "typed", label: 'Add a line containing "Ship it"', type: "file_contains", path: "/project/todo.md", text: "Ship it" },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim todo.md" },
    { text: "Press i to enter insert mode, then type your line (e.g. `- Ship it`)." },
    { text: "Press esc to leave insert mode, then :wq to write + quit." },
  ],
  successMessage: "Insert, escape, write, quit — the edit cycle is yours.",
};
