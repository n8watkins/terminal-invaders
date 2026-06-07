import type { Mission } from "@terminal-invaders/core";

export const relativePaths: Mission = {
  id: "nav-005",
  title: "Up and Over",
  difficulty: 2,
  track: "navigation",
  briefing:
    "Practice relative movement. Go down into src/utils, then hop sideways into src/api using `..`, open the route file, and check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/utils": { type: "dir" },
    "/project/src/utils/format.ts": { type: "file", content: "export const fmt = () => {};" },
    "/project/src/api": { type: "dir" },
    "/project/src/api/route.ts": {
      type: "file",
      content: "export async function GET() {\n  return Response.json({ ok: true });\n}",
    },
  },
  objectives: [
    { id: "into-utils", label: "cd into src/utils", type: "cwd_is", path: "/project/src/utils" },
    { id: "into-api", label: "Move sideways into src/api (cd ../api)", type: "cwd_is", path: "/project/src/api" },
    { id: "open-route", label: "Open route.ts", type: "file_opened", path: "/project/src/api/route.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`cd ../api` goes up one level then into a sibling folder." },
    { text: "From src/utils, `..` is src. So `cd ../api`." },
  ],
  successMessage: "That's the move — `..` to go up, then into a sibling.",
};
