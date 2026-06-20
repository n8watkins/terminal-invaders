import type { Mission } from "@terminal-invaders/core";

export const refactorPass: Mission = {
  id: "lv-009",
  title: "Refactor Pass",
  difficulty: 3,
  track: "lazyvim",
  briefing:
    'Drop the deprecated export and add the new one. Open api.ts, search /legacyFetch and delete that line with `dd`, then `o` a new line containing "modernFetch", esc, save with :wq. Then check.',
  startingCwd: "/project/src",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/api.ts": {
      type: "file",
      content:
        "import { http } from \"./http\";\n\nexport const legacyFetch = http.get;\n\nexport const post = http.post;",
    },
  },
  objectives: [
    { id: "find", label: 'Search to the deprecated line (/legacyFetch)', type: "editor_search", pattern: "legacyFetch" },
    { id: "delete", label: "Delete the line (dd)", type: "editor_command_used", command: "dd" },
    { id: "insert", label: "Enter insert mode to add the line (o)", type: "editor_command_used", command: "i" },
    {
      id: "removed",
      label: 'File no longer contains "legacyFetch"',
      type: "file_lacks",
      path: "/project/src/api.ts",
      text: "legacyFetch",
    },
    {
      id: "added",
      label: 'File now contains "modernFetch"',
      type: "file_contains",
      path: "/project/src/api.ts",
      text: "modernFetch",
    },
    { id: "save", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim api.ts, then /legacyFetch to land on that line." },
    { text: "Press dd to delete it, then o to open a line below and type the new export." },
    { text: "Type `export const modernFetch = http.get;`, esc, then :wq." },
  ],
  successMessage: "Delete the old, open the new — a clean refactor in one pass.",
};
