import type { Mission } from "@terminal-invaders/core";

export const stepInside: Mission = {
  id: "nav-003",
  title: "Step Inside",
  difficulty: 1,
  track: "navigation",
  briefing:
    "Stop looking from the outside — move in. `cd src` to step one level down, then `pwd` to confirm where you landed. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/app.ts": { type: "file", content: "export const app = () => {};" },
    "/project/README.md": { type: "file", content: "# Project" },
  },
  objectives: [
    { id: "into-src", label: "Step into src (cd src)", type: "cwd_is", path: "/project/src" },
    { id: "pwd", label: "Confirm your location (pwd)", type: "command_used", command: "pwd" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`cd src` moves you down into the src folder." },
    { text: "`pwd` prints the full path of where you now are." },
  ],
  successMessage: "cd to move in, pwd to confirm — that's the loop.",
};
