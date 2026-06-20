import type { Mission } from "@terminal-invaders/core";

export const searchOpenRead: Mission = {
  id: "search-009",
  title: "Search -> Open -> Read",
  difficulty: 3,
  track: "search",
  briefing:
    'A "DEPRECATED" marker hides deep in a long file. Search for it, open the file in nvim, then jump to the line with /DEPRECATED, and check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/api.ts": {
      type: "file",
      content:
        "export function get() {}\nexport function post() {}\nexport function put() {}\n// DEPRECATED: use post() instead\nexport function patch() {}\nexport function del() {}",
    },
    "/project/src/types.ts": { type: "file", content: "export type User = { id: string };" },
  },
  objectives: [
    {
      id: "search-marker",
      label: 'Search for "DEPRECATED"',
      type: "search_performed",
      query: "DEPRECATED",
      expectedPath: "/project/src/api.ts",
    },
    {
      id: "open-file",
      label: "Open the file in nvim",
      type: "file_opened",
      path: "/project/src/api.ts",
    },
    {
      id: "read-line",
      label: "Jump to the line in nvim (/DEPRECATED)",
      type: "editor_search",
      pattern: "DEPRECATED",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg "DEPRECATED" tells you which file holds the marker.' },
    { text: "Open it with nvim, then search inside with /DEPRECATED." },
    { text: "Drive: nvim src/api.ts, then /DEPRECATED, then :q." },
  ],
  successMessage: "rg to the file, /pattern to the line — the full read chain.",
};
