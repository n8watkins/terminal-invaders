import type { Mission } from "@terminal-invaders/core";

export const searchThenOpen: Mission = {
  id: "search-002",
  title: "Search then Open",
  difficulty: 1,
  track: "search",
  briefing:
    'A function called "calculateTax" is defined somewhere. Use rg to find it, open that file, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/index.ts": { type: "file", content: "export * from './billing';" },
    "/project/src/billing.ts": {
      type: "file",
      content: "export function calculateTax(amount) {\n  return amount * 0.2;\n}",
    },
    "/project/src/format.ts": { type: "file", content: "export const money = (n) => `$${n}`;" },
  },
  objectives: [
    {
      id: "search-fn",
      label: 'Search for "calculateTax"',
      type: "search_performed",
      query: "calculateTax",
      expectedPath: "/project/src/billing.ts",
    },
    {
      id: "open-hit",
      label: "Open the file with the match",
      type: "file_opened",
      path: "/project/src/billing.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg "calculateTax" prints the file that defines it.' },
    { text: "Open that exact path: nvim src/billing.ts (or cat / open)." },
  ],
  successMessage: "Search to locate, open to confirm — the core grep workflow.",
};
