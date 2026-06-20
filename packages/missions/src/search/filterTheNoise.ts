import type { Mission } from "@terminal-invaders/core";

export const filterTheNoise: Mission = {
  id: "search-006",
  title: "Filter the Noise",
  difficulty: 2,
  track: "search",
  briefing:
    'The word "config" is everywhere, but only one file sets the "config.database" connection. Search for that specific phrase, open the file, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/app.ts": { type: "file", content: "import { config } from './config';" },
    "/project/src/config.ts": { type: "file", content: "export const config = loadConfig();" },
    "/project/src/logger.ts": { type: "file", content: "const level = config.logLevel;" },
    "/project/src/database.ts": {
      type: "file",
      content: "const conn = config.database.url;\nexport const db = connect(conn);",
    },
  },
  objectives: [
    {
      id: "search-specific",
      label: 'Search for "config.database"',
      type: "search_performed",
      query: "config.database",
      expectedPath: "/project/src/database.ts",
    },
    {
      id: "open-target",
      label: "Open the file that uses config.database",
      type: "file_opened",
      path: "/project/src/database.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg "config" returns four files — too noisy. Narrow your query.' },
    { text: 'rg "config.database" matches only the file that matters.' },
    { text: "Open it: nvim src/database.ts." },
  ],
  successMessage: "A specific query cuts through the noise — one match, the right one.",
};
