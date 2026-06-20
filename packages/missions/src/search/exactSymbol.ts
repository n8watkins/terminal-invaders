import type { Mission } from "@terminal-invaders/core";

export const exactSymbol: Mission = {
  id: "search-007",
  title: "Exact Symbol",
  difficulty: 3,
  track: "search",
  briefing:
    'You want the variable named exactly "count" — not "counter", "accountCount", or "countdown". Search for the exact symbol "let count =", open the file, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/counter.ts": { type: "file", content: "let counter = 0;\nexport { counter };" },
    "/project/src/account.ts": { type: "file", content: "const accountCount = users.length;" },
    "/project/src/timer.ts": { type: "file", content: "let countdown = 10;" },
    "/project/src/state.ts": {
      type: "file",
      content: "let count = 0;\nexport function inc() {\n  count += 1;\n}",
    },
  },
  objectives: [
    {
      id: "search-exact-symbol",
      label: 'Search for the exact symbol "let count ="',
      type: "search_performed",
      query: "let count =",
      expectedPath: "/project/src/state.ts",
    },
    {
      id: "open-target",
      label: "Open the file that declares count",
      type: "file_opened",
      path: "/project/src/state.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg "count" also matches counter, accountCount, and countdown.' },
    { text: 'Add the surrounding tokens: rg "let count =" pins the whole symbol.' },
    { text: "Open it: nvim src/state.ts." },
  ],
  successMessage: "Surrounding tokens turn a substring into a whole-symbol match.",
};
