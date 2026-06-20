import type { Mission } from "@terminal-invaders/core";

export const readTheTree: Mission = {
  id: "nav-004",
  title: "Read the Tree",
  difficulty: 2,
  track: "navigation",
  briefing:
    "You don't know the layout yet. Run `tree` to see the whole structure, then `cd` to the deep handlers folder it reveals (src/api/handlers) and check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/api": { type: "dir" },
    "/project/src/api/handlers": { type: "dir" },
    "/project/src/api/handlers/users.ts": {
      type: "file",
      content: "export function listUsers() {\n  return [];\n}",
    },
    "/project/src/api/routes.ts": { type: "file", content: "export const routes = [];" },
    "/project/src/components": { type: "dir" },
    "/project/src/components/Button.tsx": { type: "file", content: "export const Button = () => null;" },
    "/project/README.md": { type: "file", content: "# App" },
  },
  objectives: [
    { id: "tree", label: "Reveal the structure (tree)", type: "command_used", command: "tree" },
    { id: "into-handlers", label: "cd to the handlers folder (src/api/handlers)", type: "cwd_is", path: "/project/src/api/handlers" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`tree` prints the nested folders so you can see how deep things go." },
    { text: "The handlers live under src/api. Try `cd src/api/handlers`." },
  ],
  successMessage: "tree first, then cd straight to what you spotted.",
};
