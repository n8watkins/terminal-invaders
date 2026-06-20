import type { Mission } from "@terminal-invaders/core";

export const locateAndOpen: Mission = {
  id: "workflow-003",
  title: "Locate and Open",
  difficulty: 2,
  track: "workflow",
  briefing:
    "Somewhere in the codebase a function called formatPrice is defined. Search for it with rg, cd into the directory that holds it, then open the file. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/README.md": { type: "file", content: "# Acme Web" },
    "/project/src": { type: "dir" },
    "/project/src/components": { type: "dir" },
    "/project/src/components/Cart.tsx": {
      type: "file",
      content: "import { formatPrice } from '../lib/money';\n\nexport function Cart() {}",
    },
    "/project/src/lib": { type: "dir" },
    "/project/src/lib/money.ts": {
      type: "file",
      content:
        "export function formatPrice(cents) {\n  return `$${(cents / 100).toFixed(2)}`;\n}",
    },
    "/project/src/lib/dates.ts": {
      type: "file",
      content: "export function formatDate(d) {\n  return d.toISOString();\n}",
    },
  },
  objectives: [
    {
      id: "search-def",
      label: "Search for the formatPrice definition",
      type: "search_performed",
      query: "export function formatPrice",
      expectedPath: "/project/src/lib/money.ts",
    },
    { id: "enter-lib", label: "Enter src/lib", type: "cwd_is", path: "/project/src/lib" },
    { id: "open-money", label: "Open money.ts", type: "file_opened", path: "/project/src/lib/money.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Search for the definition, not just the name: rg "export function formatPrice"' },
    { text: "The match shows the path — cd into that folder: cd src/lib" },
    { text: "Then open it: nvim money.ts" },
  ],
  successMessage: "Search points the way — then you just cd and open.",
};
