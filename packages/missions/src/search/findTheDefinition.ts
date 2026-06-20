import type { Mission } from "@terminal-invaders/core";

export const findTheDefinition: Mission = {
  id: "search-004",
  title: "Find the Definition",
  difficulty: 2,
  track: "search",
  briefing:
    'Where is "formatCurrency" actually defined? Search for the keyword "export function formatCurrency", open the file that defines it, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/format.ts": {
      type: "file",
      content: "export function formatCurrency(n) {\n  return `$${n.toFixed(2)}`;\n}",
    },
    "/project/src/cart.ts": {
      type: "file",
      content: "import { formatCurrency } from './format';\nconst total = formatCurrency(99);",
    },
    "/project/src/receipt.ts": {
      type: "file",
      content: "import { formatCurrency } from './format';\nexport const line = formatCurrency(5);",
    },
  },
  objectives: [
    {
      id: "search-def",
      label: 'Search for "export function formatCurrency"',
      type: "search_performed",
      query: "export function formatCurrency",
      expectedPath: "/project/src/format.ts",
    },
    {
      id: "open-def",
      label: "Open the file where it is defined",
      type: "file_opened",
      path: "/project/src/format.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "The other files only import the symbol — search the definition keyword." },
    { text: 'rg "export function formatCurrency" jumps straight to format.ts.' },
    { text: "Open it: nvim src/format.ts." },
  ],
  successMessage: "Definitions hide behind their declaration keyword — search for it.",
};
