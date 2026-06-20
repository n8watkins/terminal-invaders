import type { Mission } from "@terminal-invaders/core";

export const sidewaysAndDown: Mission = {
  id: "nav-008",
  title: "Sideways and Down",
  difficulty: 3,
  track: "navigation",
  briefing:
    "You're in src/web/pages and the helper you need is over in src/lib/http. Go up two levels and back down in one move (`cd ../../lib/http`), then open client.ts. Then check.",
  startingCwd: "/project/src/web/pages",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/web": { type: "dir" },
    "/project/src/web/pages": { type: "dir" },
    "/project/src/web/pages/home.tsx": { type: "file", content: "export const Home = () => null;" },
    "/project/src/lib": { type: "dir" },
    "/project/src/lib/http": { type: "dir" },
    "/project/src/lib/http/client.ts": {
      type: "file",
      content: "export async function get(url: string) {\n  return fetch(url);\n}",
    },
    "/project/src/lib/format": { type: "dir" },
    "/project/src/lib/format/date.ts": { type: "file", content: "export const fmtDate = () => '';" },
  },
  objectives: [
    { id: "into-http", label: "Move up two and into lib/http (cd ../../lib/http)", type: "cwd_is", path: "/project/src/lib/http" },
    { id: "open-client", label: "Open client.ts", type: "file_opened", path: "/project/src/lib/http/client.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Each `..` climbs one level; you can stack them and keep going down: `../../lib/http`." },
    { text: "From src/web/pages, `..` is web and `../..` is src. So `cd ../../lib/http`." },
  ],
  successMessage: "Stack `..` to climb, then descend — one relative move does it all.",
};
