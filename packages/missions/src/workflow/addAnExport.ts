import type { Mission } from "@terminal-invaders/core";

export const addAnExport: Mission = {
  id: "workflow-006",
  title: "Add an Export",
  difficulty: 2,
  track: "workflow",
  briefing:
    "The helpers file is missing a slugify export. Find it, open it in nvim, open a new line with o, type the export, save, then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/lib": { type: "dir" },
    "/project/src/lib/helpers.ts": {
      type: "file",
      content:
        "export const cap = (s) => s.toUpperCase();\nexport const trim = (s) => s.trim();",
    },
  },
  objectives: [
    {
      id: "search-helpers",
      label: "Search the helpers file",
      type: "search_performed",
      query: "export const cap",
      expectedPath: "/project/src/lib/helpers.ts",
    },
    { id: "open-helpers", label: "Open helpers.ts in nvim", type: "file_opened", path: "/project/src/lib/helpers.ts" },
    { id: "insert", label: "Enter insert mode to add the export (o)", type: "editor_command_used", command: "i" },
    { id: "exported", label: "File now exports slugify", type: "file_contains", path: "/project/src/lib/helpers.ts", text: "export const slugify" },
    { id: "saved", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Find the file: rg "export const cap"' },
    { text: "Open it (nvim src/lib/helpers.ts), then open a new line below the cursor with o and type your export." },
    { text: "Type: export const slugify = (s) => s.toLowerCase(); then esc and :wq" },
  ],
  successMessage: "o opens a fresh line below — perfect for appending an export.",
};
