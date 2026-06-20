import type { Mission } from "@terminal-invaders/core";

export const openBelow: Mission = {
  id: "lv-007",
  title: "Open Below",
  difficulty: 2,
  track: "lazyvim",
  briefing:
    'The team list is missing a member. Open team.md, press `o` to open a new line right below the cursor, type a line containing "Dana", press `esc`, then save with :wq. Then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/team.md": { type: "file", content: "# Team\n- Alex\n- Sam" },
  },
  objectives: [
    { id: "open-below", label: "Enter insert mode (o opens a line below)", type: "editor_command_used", command: "i" },
    {
      id: "typed",
      label: 'Add a line containing "Dana"',
      type: "file_contains",
      path: "/project/team.md",
      text: "Dana",
    },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim team.md" },
    { text: "Press o to open a blank line below, type `- Dana`, esc, then :wq." },
  ],
  successMessage: "o opens a line below and drops you into insert — one key to add below.",
};
