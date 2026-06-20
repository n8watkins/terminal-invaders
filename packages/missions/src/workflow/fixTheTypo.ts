import type { Mission } from "@terminal-invaders/core";

export const fixTheTypo: Mission = {
  id: "workflow-005",
  title: "Fix the Typo",
  difficulty: 2,
  track: "workflow",
  briefing:
    'A comment misspells "receive" as "recieve". Find it with rg, open the file, fix it with a :%s substitute, save, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/mailbox.ts": {
      type: "file",
      content:
        "// We recieve messages here and queue them.\nexport function inbox() {\n  return [];\n}",
    },
  },
  objectives: [
    {
      id: "search-typo",
      label: 'Search for the misspelling "recieve"',
      type: "search_performed",
      query: "recieve",
      expectedPath: "/project/src/mailbox.ts",
    },
    { id: "open-file", label: "Open mailbox.ts in nvim", type: "file_opened", path: "/project/src/mailbox.ts" },
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "fixed", label: 'File now contains "receive"', type: "file_contains", path: "/project/src/mailbox.ts", text: "receive" },
    { id: "typo-gone", label: 'File no longer contains "recieve"', type: "file_lacks", path: "/project/src/mailbox.ts", text: "recieve" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Find the typo: rg "recieve"' },
    { text: "Open it (nvim src/mailbox.ts) and fix it: :%s/recieve/receive/g" },
    { text: "Save and quit with :wq once the substitute reports a change." },
  ],
  successMessage: "i before e — and rg + :%s before a manual hunt.",
};
