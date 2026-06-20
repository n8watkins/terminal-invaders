import type { Mission } from "@terminal-invaders/core";

export const fixABrokenImport: Mission = {
  id: "workflow-007",
  title: "Fix a Broken Import",
  difficulty: 3,
  track: "workflow",
  briefing:
    'A file imports from "./helprs" but the module is actually "./helpers". Search for the broken path, open the file, fix it with :%s, save, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/helpers.ts": {
      type: "file",
      content: "export const money = (n) => n.toFixed(2);",
    },
    "/project/src/Invoice.tsx": {
      type: "file",
      content:
        'import { money } from "./helprs";\n\nexport function Invoice() {\n  return money(10);\n}',
    },
  },
  objectives: [
    {
      id: "search-import",
      label: "Search for the broken import path",
      type: "search_performed",
      query: "./helprs",
      expectedPath: "/project/src/Invoice.tsx",
    },
    { id: "open-invoice", label: "Open Invoice.tsx in nvim", type: "file_opened", path: "/project/src/Invoice.tsx" },
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "fixed", label: 'Import now points to "./helpers"', type: "file_contains", path: "/project/src/Invoice.tsx", text: 'from "./helpers"' },
    { id: "old-gone", label: 'Broken path "./helprs" is gone', type: "file_lacks", path: "/project/src/Invoice.tsx", text: "./helprs" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Find the bad import: rg "./helprs"' },
    { text: "Open it (nvim src/Invoice.tsx), then substitute: :%s/helprs/helpers/g" },
    { text: "The substitute fixes every occurrence — then :wq to save." },
  ],
  successMessage: "Broken imports are just text — find them and substitute the fix.",
};
