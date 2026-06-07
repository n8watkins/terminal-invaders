import type { Mission } from "@terminal-invaders/core";

export const findTodo: Mission = {
  id: "search-005",
  title: "Hunt the Stale TODO",
  difficulty: 2,
  track: "search",
  briefing:
    'Somewhere in this codebase a stale "TODO" is hiding. Use rg to find it, open the file it lives in, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/index.ts": { type: "file", content: "export * from './auth';" },
    "/project/src/auth.ts": {
      type: "file",
      content: "export function login() {\n  // TODO: handle expired sessions\n  return true;\n}",
    },
    "/project/src/db.ts": { type: "file", content: "export const db = connect();" },
  },
  objectives: [
    {
      id: "search-todo",
      label: 'Search for "TODO"',
      type: "search_performed",
      query: "TODO",
      expectedPath: "/project/src/auth.ts",
    },
    { id: "open-auth", label: "Open the file with the TODO", type: "file_opened", path: "/project/src/auth.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg searches contents, not names: rg "TODO".' },
    { text: "The result shows path:line — open that path." },
  ],
  successMessage: "Search is your superpower — rg finds anything by content.",
};
