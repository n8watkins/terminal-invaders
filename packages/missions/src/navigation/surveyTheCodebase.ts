import type { Mission } from "@terminal-invaders/core";

export const surveyTheCodebase: Mission = {
  id: "nav-010",
  title: "Survey the Codebase (boss)",
  difficulty: 3,
  track: "navigation",
  briefing:
    "New repo, no map. Run `tree` to learn the shape, walk into the server package and its src, then open the real entrypoint (packages/server/src/main.ts). Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/README.md": { type: "file", content: "# Monorepo\n\nSee packages/server for the service." },
    "/project/package.json": { type: "file", content: '{ "name": "monorepo" }' },
    "/project/packages": { type: "dir" },
    "/project/packages/web": { type: "dir" },
    "/project/packages/web/src": { type: "dir" },
    "/project/packages/web/src/App.tsx": { type: "file", content: "export const App = () => null;" },
    "/project/packages/server": { type: "dir" },
    "/project/packages/server/package.json": { type: "file", content: '{ "name": "server" }' },
    "/project/packages/server/src": { type: "dir" },
    "/project/packages/server/src/main.ts": {
      type: "file",
      content: "import { createServer } from './app';\n\ncreateServer().listen(3000);",
    },
    "/project/packages/server/src/app.ts": {
      type: "file",
      content: "export function createServer() {\n  return { listen() {} };\n}",
    },
    "/project/packages/shared": { type: "dir" },
    "/project/packages/shared/index.ts": { type: "file", content: "export const VERSION = '1.0.0';" },
  },
  objectives: [
    { id: "tree", label: "Map the repo (tree)", type: "command_used", command: "tree" },
    { id: "into-server-src", label: "Walk to the server source (packages/server/src)", type: "cwd_is", path: "/project/packages/server/src" },
    { id: "open-main", label: "Open the entrypoint main.ts", type: "file_opened", path: "/project/packages/server/src/main.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`tree` from the root shows every package. Look for the one with src/main.ts." },
    { text: "Walk in: `cd packages/server/src`, then `open main.ts`." },
    { text: "Full path: `cd /project/packages/server/src` then `open main.ts`." },
  ],
  successMessage: "tree to orient, walk the packages, open the entrypoint — that's how you read a new repo.",
};
