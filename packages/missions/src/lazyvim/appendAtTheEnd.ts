import type { Mission } from "@terminal-invaders/core";

export const appendAtTheEnd: Mission = {
  id: "lv-004",
  title: "Append at the End",
  difficulty: 2,
  track: "lazyvim",
  briefing:
    'The changelog needs a new entry at the bottom. Open CHANGELOG.md, jump to the last line with `G`, open a line below with `o`, type a line containing "v1.1.0", press `esc`, then :wq. Then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/CHANGELOG.md": {
      type: "file",
      content: "# Changelog\n\n## v1.0.0\n- Initial release",
    },
  },
  objectives: [
    { id: "open-below", label: "Enter insert mode to append (o or A)", type: "editor_command_used", command: "i" },
    {
      id: "typed",
      label: 'Add a line containing "v1.1.0"',
      type: "file_contains",
      path: "/project/CHANGELOG.md",
      text: "v1.1.0",
    },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim CHANGELOG.md, then press G to jump to the last line." },
    { text: "Press o to open a blank line below, type `## v1.1.0`, esc, then :wq." },
  ],
  successMessage: "G to the bottom, o to open below — appending is a two-key move.",
};
