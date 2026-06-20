import type { Mission } from "@terminal-invaders/core";

export const searchFixVerify: Mission = {
  id: "workflow-009",
  title: "Search, Fix, Verify",
  difficulty: 3,
  track: "workflow",
  briefing:
    'A bug uses assignment "isAdmin = true" inside an if. Search for it with rg, open the file, fix it to a comparison with :%s, save, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/auth.ts": {
      type: "file",
      content:
        "export function canEdit(user) {\n  if (user.isAdmin = true) {\n    return true;\n  }\n  return false;\n}",
    },
  },
  objectives: [
    {
      id: "search-bug",
      label: 'Search for the buggy "isAdmin = true"',
      type: "search_performed",
      query: "isAdmin = true",
      expectedPath: "/project/src/auth.ts",
    },
    { id: "open-auth", label: "Open auth.ts in nvim", type: "file_opened", path: "/project/src/auth.ts" },
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "fixed", label: 'File now compares with "isAdmin === true"', type: "file_contains", path: "/project/src/auth.ts", text: "isAdmin === true" },
    { id: "bug-gone", label: 'The assignment "isAdmin = true" is gone', type: "file_lacks", path: "/project/src/auth.ts", text: "isAdmin = true" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Find the bug: rg "isAdmin = true"' },
    { text: "Open it (nvim src/auth.ts), then fix the operator: :%s/isAdmin = true/isAdmin === true/g" },
    { text: "Save with :wq, then run check to verify the bug is gone." },
  ],
  successMessage: "Search to find it, substitute to fix it, file_lacks proves it's gone.",
};
