import type { Mission } from "@terminal-invaders/core";

export const homeAndBack: Mission = {
  id: "nav-006",
  title: "Home and Back",
  difficulty: 2,
  track: "navigation",
  briefing:
    "You're deep in the source tree. Jump home with an absolute path (`cd /home/dev`), then jump straight back to where the work is (`cd /project/src/server`). Then check.",
  startingCwd: "/project/src/server",
  filesystem: {
    "/home": { type: "dir" },
    "/home/dev": { type: "dir" },
    "/home/dev/.bashrc": { type: "file", content: "export EDITOR=nvim" },
    "/home/dev/notes.md": { type: "file", content: "# Scratch notes" },
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/server": { type: "dir" },
    "/project/src/server/main.ts": {
      type: "file",
      content: "export function start() {\n  console.log('up');\n}",
    },
  },
  objectives: [
    { id: "go-home", label: "Jump home (cd /home/dev)", type: "cwd_is", path: "/home/dev" },
    { id: "back-to-work", label: "Jump back to the server dir (cd /project/src/server)", type: "cwd_is", path: "/project/src/server" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "An absolute path starts with `/` and works from anywhere. `cd /home/dev` goes home." },
    { text: "To return, give the full path again: `cd /project/src/server`." },
  ],
  successMessage: "Absolute paths jump anywhere — home, then right back to work.",
};
